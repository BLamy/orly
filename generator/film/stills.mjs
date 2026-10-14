#!/usr/bin/env node
// Stills — full-resolution frames from the film harness, for review and for fixes.
//
//   npm run film:stills -- --slug <slug> --times 12.5,1:02.25          absolute film times (s or m:ss)
//   npm run film:stills -- --slug <slug> --shots ch01-s02,ch02-s01 [--per-shot 3]   evenly across each shot
//   npm run film:stills -- --slug <slug> --shots ch01-s02 --beats                    at every beat of the shot
//        [--build | --base <url> | --static <dir>] (default: the running dev server) [--w 1920 --h 1080]
//        [--format png|jpg] [--out <dir>]  (default films/<slug>/qa/stills/)
//
// Names: t<seconds>.png for --times, <shot>-<k>of<n>.png for --shots, <shot>-beat-<id>.png for --beats.
// Prints a JSON list of { file, t, shot, local }. Exits non-zero on harness/page errors.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, list, num, die, helpText } from './lib/args.mjs';
import { filmPaths, readJson, rel, mkdirp, parseTime } from './lib/paths.mjs';
import { launchChromium } from './lib/browser.mjs';
import { openSite } from './lib/site.mjs';
import { openHarness } from './lib/harness.mjs';

const a = parseArgs(process.argv.slice(2), {
  boolean: ['build', 'beats', 'help', 'rebuild'],
  string: ['slug', 'dir', 'times', 'shots', 'shot', 'per-shot', 'base', 'static', 'w', 'h', 'format', 'out'],
  default: { rebuild: true },
});
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const FMT = a.format === 'jpg' || a.format === 'jpeg' ? 'jpeg' : 'png';
const OUT = path.resolve(a.out || P.qa.stills);

function timelineFor() {
  return readJson(P.app.timeline, null) ?? readJson(P.narration.timeline, null);
}

async function main() {
  const site = await openSite({ mode: a.static ? 'static' : a.build ? 'build' : 'dev', base: a.base, staticDir: a.static, rebuild: a.rebuild !== false });
  const browser = await launchChromium({ gpu: true });
  const results = [];
  try {
    const h = await openHarness(browser, site.base, a.slug, { width: num(a.w, 1920), height: num(a.h, 1080) });
    const tl = timelineFor();
    const jobs = [];
    for (const t of list(a.times).map(parseTime)) jobs.push({ t, name: `t${t.toFixed(3)}` });
    const shots = [...list(a.shots), ...list(a.shot)];
    for (const id of shots) {
      const s = h.info.shots.find((x) => x.id === id);
      if (!s) die(`shot ${id} is not in the harness`);
      if (a.beats) {
        const beats = tl?.shots.find((x) => x.id === id)?.beats ?? {};
        for (const [bid, bt] of Object.entries(beats)) jobs.push({ t: Math.min(s.end - 1e-3, s.start + bt), name: `${id}-beat-${bid}` });
      } else {
        const n = Math.max(1, num(a['per-shot'], 1));
        for (let k = 0; k < n; k++) jobs.push({ t: s.start + ((k + 0.5) / n) * (s.end - s.start), name: `${id}-${k + 1}of${n}` });
      }
    }
    if (!jobs.length) die('nothing to capture: pass --times or --shots');
    mkdirp(OUT);
    for (const j of jobs) {
      const fps = h.info.fps;
      const t = Math.round(j.t * fps) / fps; // snap to a frame the renderer would produce
      await h.seek(t);
      const buf = await h.capture({ format: FMT, quality: 95 });
      const file = path.join(OUT, `${j.name}.${FMT === 'jpeg' ? 'jpg' : 'png'}`);
      fs.writeFileSync(file, buf);
      const shot = h.info.shots.find((s) => t >= s.start && t < s.end) ?? h.info.shots[h.info.shots.length - 1];
      results.push({ file: rel(file), t: +t.toFixed(4), shot: shot?.id, local: shot ? +(t - shot.start).toFixed(4) : null });
    }
    if (h.errors.length) results.push({ errors: [...new Set(h.errors)].slice(0, 10) });
    await h.close();
  } finally {
    await browser.close();
    await site.close();
  }
  console.log(JSON.stringify(results, null, 1));
  if (results.some((r) => r.errors)) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
