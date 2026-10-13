#!/usr/bin/env node
// Depth audit — does every camera move have at least three depth planes moving against each other?
//
//   node generator/film/depth.mjs --slug <slug> [--shot id[,id] | --all] [--every 0.5] [--min 3]
//
// Review round 1 (art): "require at least 3 depth planes with parallax on every camera move". The harness
// reports, for each painted frame, the camera and the z of every layer the shot painted (core/frame.ts
// lastFrameDepth). A shot MOVES when its camera changes between samples (x/y by > 1 px, z by > 2, lens by >
// 0.002); a moving shot passes when every moving stretch paints >= --min distinct depths (layers at the same z
// count once: they cannot parallax against each other). Locked-off shots are reported but not judged.
// Output: films/<slug>/qa/depth/summary.json { shots: { id: { moving, minPlanes, planes, ids, verdict } } }.
import path from 'node:path';
import { parseArgs, list, num, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, rel, mkdirp } from './lib/paths.mjs';
import { launchChromium } from './lib/browser.mjs';
import { openSite } from './lib/site.mjs';
import { openHarness } from './lib/harness.mjs';

const a = parseArgs(process.argv.slice(2), { boolean: ['all', 'help', 'build'], string: ['slug', 'dir', 'shot', 'shots', 'every', 'min', 'base'] });
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const EVERY = Math.max(0.2, num(a.every, 0.5));
const MIN = num(a.min, 3);
const OUT = path.join(P.qa.dir, 'depth');

async function main() {
  const tl = readJson(P.app.timeline, null) ?? readJson(P.narration.timeline);
  const site = await openSite({ mode: a.build ? 'build' : 'dev', base: a.base });
  const browser = await launchChromium({ gpu: true });
  const summary = readJson(path.join(OUT, 'summary.json'), { shots: {} });
  try {
    const h = await openHarness(browser, site.base, a.slug, { width: 960, height: 540 });
    const ids = [...list(a.shot), ...list(a.shots)];
    const shots = ids.length ? ids.map((id) => h.info.shots.find((s) => s.id === id)).filter(Boolean) : h.info.shots;
    mkdirp(OUT);
    for (const shot of shots) {
      const k = tl.shots.findIndex((s) => s.id === shot.id);
      const td = (s) => (!s || s.transitionIn === 'cut' ? 0 : s.transitionDur ?? 1);
      const lo = td(tl.shots[k]) / 2 + 0.05;
      const hi = shot.end - shot.start - td(tl.shots[k + 1]) / 2 - 0.05;
      const rows = [];
      for (let t = lo; t < hi; t += EVERY) {
        await h.seek(shot.start + t);
        const fi = await h.frameInfo();
        if (fi?.depth) rows.push({ t: +t.toFixed(2), cam: fi.depth.cam, zs: fi.depth.zs, ids: fi.depth.ids });
      }
      const moved = (p, q) => Math.abs(p.cam.x - q.cam.x) > 1 || Math.abs(p.cam.y - q.cam.y) > 1 || Math.abs(p.cam.z - q.cam.z) > 2 || Math.abs((p.cam.lens ?? 1) - (q.cam.lens ?? 1)) > 0.002;
      let moving = 0;
      let minPlanes = Infinity;
      const thin = [];
      for (let i = 1; i < rows.length; i++) {
        if (!moved(rows[i - 1], rows[i])) continue;
        moving++;
        const planes = new Set([...rows[i - 1].zs, ...rows[i].zs]).size;
        minPlanes = Math.min(minPlanes, planes);
        if (planes < MIN) thin.push(`${rows[i].t}s: ${planes} (${rows[i].ids.join(',')})`);
      }
      const all = new Set(rows.flatMap((r) => r.ids));
      const verdict = !moving ? 'locked-off' : thin.length ? 'thin' : 'ok';
      summary.shots[shot.id] = { moving, minPlanes: Number.isFinite(minPlanes) ? minPlanes : null, layers: [...all], thin: thin.slice(0, 6), verdict };
      console.log(`  ${shot.id}: ${verdict}${moving ? ` (moving ${moving}/${rows.length - 1} samples, min ${minPlanes} planes)` : ''}${thin.length ? ` — ${thin.slice(0, 2).join('; ')}` : ''}`);
    }
    await h.close();
  } finally {
    await browser.close();
    await site.close();
  }
  summary.at = new Date().toISOString();
  summary.min = MIN;
  writeJson(path.join(OUT, 'summary.json'), summary, 1);
  const thin = Object.entries(summary.shots).filter(([, s]) => s.verdict === 'thin').map(([k]) => k);
  console.log(`${thin.length} moving shot(s) under ${MIN} depth planes: ${thin.join(', ')} → ${rel(path.join(OUT, 'summary.json'))}`);
}

main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
