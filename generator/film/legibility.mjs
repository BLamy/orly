#!/usr/bin/env node
// Legibility audit — measures every piece of text a shot paints, as the viewer would see it on a 1080p frame.
//
//   node generator/film/legibility.mjs --slug <slug> [--shot id[,id] | --all] [--every 1] [--min 22] [--json]
//
// Review round 1 (art + teacher): "set a kit-wide minimum of about 22 px cap height at 1080p for any text the viewer
// must read, and push in whenever a card is the subject". The harness page gets a recorder on
// CanvasRenderingContext2D fillText/strokeText (init script): for each draw it measures the current font's cap
// height ('H', or the small-cap 'h' for an SC face setting lower case) times the current transform (camera, layer
// parallax and offscreen bakes included) on the 1080p frame, and the draw's opacity (globalAlpha x fill alpha).
// Sampling: a frame every --every s (default 1) plus every beat. A text OFFENDS when, across the whole shot, its
// LARGEST cap height while visible (opacity >= 0.3) stays under --min (22) px. Text under 6 px is texture (ledger
// scribble, newspaper columns), reported apart. Output: films/<slug>/qa/legibility/<shot>.json and summary.json
// (per shot: offenders with max cap px, first and last time seen). Read with the contact sheet before fixing.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, list, num, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, rel, mkdirp } from './lib/paths.mjs';
import { launchChromium } from './lib/browser.mjs';
import { openSite } from './lib/site.mjs';
import { openHarness } from './lib/harness.mjs';

const a = parseArgs(process.argv.slice(2), { boolean: ['all', 'help', 'json', 'build'], string: ['slug', 'dir', 'shot', 'shots', 'every', 'min', 'base'] });
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const EVERY = Math.max(0.25, num(a.every, 1));
const MIN = num(a.min, 22);
const TEXTURE = 6;
const OUT = path.join(P.qa.dir ?? path.join(P.dir, 'qa'), 'legibility');

// runs in the page before any script: wraps fillText/strokeText; window.__legRec = [] while recording
function recorder() {
  const P2 = CanvasRenderingContext2D.prototype;
  const cache = new Map();
  const alphaOf = (style) => {
    if (typeof style !== 'string') return 1;
    let m = /rgba?\(([^)]+)\)/.exec(style);
    if (m) {
      const p = m[1].split(/[ ,/]+/).filter(Boolean);
      return p.length >= 4 ? parseFloat(p[3]) * (p[3].includes('%') ? 0.01 : 1) : 1;
    }
    m = /^#([0-9a-f]{8})$/i.exec(style);
    if (m) return parseInt(m[1].slice(6), 16) / 255;
    return 1;
  };
  const wrap = (name) => {
    const orig = P2[name];
    P2[name] = function (text, x, y, maxW) {
      const rec = window.__legRec;
      if (rec && text != null && /[A-Za-z0-9]/.test(String(text))) {
        const s = String(text);
        const sc = /SC"|SC\b/.test(this.font) && /[a-z]/.test(s);
        const f100 = this.font.replace(/\d+(\.\d+)?px/, '100px');
        const key = f100 + (sc ? '|h' : '|H');
        let r = cache.get(key);
        if (r == null) {
          const save = this.font;
          this.font = f100;
          const mm = orig === P2.fillText ? this.measureText(sc ? 'h' : 'H') : this.measureText(sc ? 'h' : 'H');
          this.font = save;
          r = mm.actualBoundingBoxAscent > 1 ? mm.actualBoundingBoxAscent / 100 : 0.68;
          cache.set(key, r);
        }
        const size = Number(/(\d+(?:\.\d+)?)px/.exec(this.font)?.[1] ?? 10);
        const t = this.getTransform();
        const dev = Math.hypot(t.a, t.b);
        const H = window.__film?.height || 1080;
        const cap = size * r * dev * (1080 / H);
        const alpha = this.globalAlpha * alphaOf(name === 'fillText' ? this.fillStyle : this.strokeStyle);
        rec.push({ text: s.slice(0, 80), cap: Math.round(cap * 10) / 10, alpha: Math.round(alpha * 100) / 100, font: this.font.slice(0, 60) });
      }
      return orig.call(this, text, x, y, maxW);
    };
  };
  wrap('fillText');
  wrap('strokeText');
}

async function main() {
  const tl = readJson(P.app.timeline, null) ?? readJson(P.narration.timeline);
  const site = await openSite({ mode: a.build ? 'build' : 'dev', base: a.base });
  const browser = await launchChromium({ gpu: true });
  const summary = readJson(path.join(OUT, 'summary.json'), { shots: {} });
  try {
    const h = await openHarness(browser, site.base, a.slug, { width: 1920, height: 1080, init: recorder });
    const ids = [...list(a.shot), ...list(a.shots)];
    const shots = ids.length ? ids.map((id) => h.info.shots.find((s) => s.id === id)) : h.info.shots;
    mkdirp(OUT);
    for (const shot of shots) {
      if (!shot) continue;
      const fps = h.info.fps;
      const dur = shot.end - shot.start;
      // only frames where this shot is alone on screen (a transition paints the neighbour too)
      const k = tl.shots.findIndex((s) => s.id === shot.id);
      const tlShot = tl.shots[k];
      const transDur = (s) => (!s || s.transitionIn === 'cut' ? 0 : s.transitionDur ?? 1);
      const lo = transDur(tlShot) / 2 + 0.05;
      const hi = dur - transDur(tl.shots[k + 1]) / 2 - 0.05;
      const ts = new Set();
      for (let t = Math.max(0.25, lo); t < hi; t += EVERY) ts.add(+t.toFixed(3));
      for (const bt of Object.values(tlShot?.beats || {})) ts.add(Math.min(hi, Math.max(lo, bt + 0.4)));
      const seen = new Map();
      for (const lt of [...ts].sort((x, y) => x - y)) {
        const t = Math.floor((shot.start + lt) * fps + 1e-6) / fps;
        await h.page.evaluate(() => (window.__legRec = []));
        await h.seek(t);
        const rec = await h.page.evaluate(() => {
          const r = window.__legRec;
          window.__legRec = null;
          return r;
        });
        for (const d of rec) {
          if (d.alpha < 0.3) continue;
          const k = d.text.trim();
          const e = seen.get(k) ?? { text: k, maxCap: 0, minCap: Infinity, first: lt, last: lt, font: d.font };
          e.maxCap = Math.max(e.maxCap, d.cap);
          e.minCap = Math.min(e.minCap, d.cap);
          e.last = lt;
          seen.set(k, e);
        }
      }
      const all = [...seen.values()].map((e) => ({ ...e, first: +e.first.toFixed(2), last: +e.last.toFixed(2) }));
      const offenders = all.filter((e) => e.maxCap < MIN && e.maxCap >= TEXTURE && e.text.replace(/[^A-Za-z0-9]/g, '').length >= 2).sort((x, y) => x.maxCap - y.maxCap);
      const texture = all.filter((e) => e.maxCap < TEXTURE).length;
      const doc = { shot: shot.id, at: new Date().toISOString(), minCapPx: MIN, sampled: ts.size, texts: all.length, offenders, textureTexts: texture, ok: all.filter((e) => e.maxCap >= MIN).map((e) => ({ text: e.text, maxCap: e.maxCap })) };
      writeJson(path.join(OUT, `${shot.id}.json`), doc, 1);
      summary.shots[shot.id] = { offenders: offenders.map((o) => `${o.text} (${o.maxCap}px)`), texts: all.length, at: doc.at };
      console.log(`  ${shot.id}: ${all.length} texts, ${offenders.length} under ${MIN}px${offenders.length ? `: ${offenders.slice(0, 6).map((o) => `"${o.text.slice(0, 28)}" ${o.maxCap}`).join(', ')}` : ''}`);
    }
    await h.close();
  } finally {
    await browser.close();
    await site.close();
  }
  summary.at = new Date().toISOString();
  summary.minCapPx = MIN;
  writeJson(path.join(OUT, 'summary.json'), summary, 1);
  const bad = Object.entries(summary.shots).filter(([, s]) => s.offenders.length);
  console.log(`${bad.length} shot(s) with text under ${MIN}px cap height → ${rel(path.join(OUT, 'summary.json'))}`);
}

main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
