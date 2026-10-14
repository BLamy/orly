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
// Sampling: a frame every --every s (default 1) plus every beat.
// ROLES (review round 2: "tag every text item as 'subject' (named or meant to be read) or 'texture', and fail any
// subject text under 22 px cap"). A text's role is, in order: the role it was drawn under (kit textRole(c, role, fn):
// the kit's cards are 'subject'); else 'subject' when it is one of the shot's script onScreenText items (or a wrapped
// piece of one), or when the narrator says its words while it is visible (at least two of its significant words, or
// its only one, within ±2 s of a sample where it shows); else 'texture'. A SUBJECT text FAILS when its largest cap
// height while it is the subject (visible at opacity >= 0.3; for a named text, within its named window) stays under
// --min (22) px. Texture is reported apart and never fails. Output: films/<slug>/qa/legibility/<shot>.json and
// summary.json (per shot: offenders = failing subject texts with max cap px, why each is subject, and the time it is
// named; texture counts). Read with the contact sheet before fixing.
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
          const saveBase = this.textBaseline;
          this.font = f100;
          this.textBaseline = 'alphabetic'; // the ascent is relative to the current baseline
          const mm = this.measureText(sc ? 'h' : 'H');
          this.font = save;
          this.textBaseline = saveBase;
          r = mm.actualBoundingBoxAscent > 1 ? mm.actualBoundingBoxAscent / 100 : 0.68;
          cache.set(key, r);
        }
        const size = Number(/(\d+(?:\.\d+)?)px/.exec(this.font)?.[1] ?? 10);
        const t = this.getTransform();
        const dev = Math.hypot(t.a, t.b);
        const H = window.__film?.height || 1080;
        const cap = size * r * dev * (1080 / H);
        const alpha = this.globalAlpha * alphaOf(name === 'fillText' ? this.fillStyle : this.strokeStyle);
        rec.push({ text: s.slice(0, 80), cap: Math.round(cap * 10) / 10, alpha: Math.round(alpha * 100) / 100, font: this.font.slice(0, 60), role: this.__textRole || null });
      }
      return orig.call(this, text, x, y, maxW);
    };
  };
  wrap('fillText');
  wrap('strokeText');
}

const STOP = new Set('the a an and or of to in on at by for with from is are was were be as it its this that these those not no but if then than into over under who what when where which while will would can could may might must shall should has have had do does did i you he she we they them his her our their my your me us him also just only very more most less much many some any each every all one two three four five six seven eight nine ten'.split(' '));
const norm = (x) => String(x).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const sigWords = (x) => norm(x).split(' ').filter((w) => w.length >= 3 && !STOP.has(w.toLowerCase()) && !/^\d+$/.test(w));
/** classify a text the shot drew: { role, why, window? } */
function classify(e, script, tlShot) {
  if (e.roles.has('texture') && !e.roles.has('subject')) return { role: 'texture', why: 'drawn as texture' };
  if (e.roles.has('subject')) return { role: 'subject', why: 'drawn as subject (kit card or textRole)' };
  // a script onScreenText item, or a wrapped / typing-on piece of one: most of its tokens are that item's tokens
  // (the last may be a typed-on prefix); a lone token must be a word of 4+ letters (a bare year is not enough)
  const toks = norm(e.text).split(' ').filter(Boolean);
  const ost = (script?.onScreenText || []).map((o) => norm(o.text).split(' ').filter(Boolean));
  const inItem = (item) => {
    const set = new Set(item);
    const hits = toks.filter((tk, i) => set.has(tk) || (i === toks.length - 1 && item.some((w) => w.startsWith(tk) && tk.length >= 2)));
    if (toks.length === 1) return hits.length === 1 && /^[A-Z]{4,}$/.test(toks[0]);
    return hits.length >= Math.max(2, Math.ceil(toks.length * 0.6));
  };
  if (toks.length && ost.some(inItem)) return { role: 'subject', why: 'script onScreenText' };
  const words = sigWords(e.text);
  if (words.length && tlShot) {
    const spoken = tlShot.lines.flatMap((l) => l.words.map((w) => ({ w: norm(w.w), t: w.start })));
    const need = Math.min(2, words.length);
    let hit = null;
    for (const smp of e.samples) {
      const near = new Set(spoken.filter((w) => Math.abs(w.t - smp.t) <= 2).flatMap((w) => w.w.split(' ')));
      const got = words.filter((w) => near.has(w) || near.has(w.replace(/S$/, '')) || near.has(`${w}S`));
      if (got.length >= need) {
        hit = hit || { from: smp.t, to: smp.t, words: got };
        hit.to = smp.t;
      }
    }
    if (hit) return { role: 'subject', why: `named: "${hit.words.slice(0, 3).join(' ').toLowerCase()}"`, window: [hit.from, hit.to] };
  }
  return { role: 'texture', why: 'not named, not in onScreenText' };
}

async function main() {
  const tl = readJson(P.app.timeline, null) ?? readJson(P.narration.timeline);
  const scriptShots = new Map((readJson(P.script, { chapters: [] }).chapters || []).flatMap((c) => c.shots || []).map((s) => [s.id, s]));
  const site = await openSite({ mode: a.build ? 'build' : 'dev', base: a.base });
  const browser = await launchChromium({ gpu: true });
  const summary = readJson(path.join(OUT, 'summary.json'), { shots: {} });
  const ids = [...list(a.shot), ...list(a.shots)];
  try {
    const h = await openHarness(browser, site.base, a.slug, { width: 1920, height: 1080, init: recorder });
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
        // one draw per text per frame: the largest (a text drawn twice, e.g. shadow + face, counts once)
        const frame = new Map();
        for (const d of rec) {
          if (d.alpha < 0.3) continue;
          const k = d.text.trim();
          const f = frame.get(k);
          if (!f || d.cap > f.cap) frame.set(k, { ...d, role: d.role || f?.role || null });
          else if (d.role && !f.role) f.role = d.role;
        }
        for (const [k, d] of frame) {
          const e = seen.get(k) ?? { text: k, maxCap: 0, minCap: Infinity, first: lt, last: lt, font: d.font, roles: new Set(), samples: [] };
          e.maxCap = Math.max(e.maxCap, d.cap);
          e.minCap = Math.min(e.minCap, d.cap);
          e.last = lt;
          if (d.role) e.roles.add(d.role);
          e.samples.push({ t: lt, cap: d.cap });
          seen.set(k, e);
        }
      }
      const sShot = scriptShots.get(shot.id);
      const all = [...seen.values()].map((e) => {
        const c = classify(e, sShot, tlShot);
        // a named text is judged while it is named (±2 s of its window); others over everything they are visible
        const judged = c.window ? e.samples.filter((q) => q.t >= c.window[0] - 2 && q.t <= c.window[1] + 2) : e.samples;
        const capWhileSubject = Math.max(0, ...judged.map((q) => q.cap));
        const { roles, samples, ...rest } = e;
        return { ...rest, first: +e.first.toFixed(2), last: +e.last.toFixed(2), role: c.role, why: c.why, ...(c.window ? { namedAt: c.window.map((x) => +x.toFixed(2)) } : {}), capWhileSubject };
      });
      const meaningful = (e) => e.text.replace(/[^A-Za-z0-9]/g, '').length >= 2;
      const under = all.filter((e) => e.role === 'subject' && meaningful(e) && e.capWhileSubject < MIN);
      // a typing-on text leaves its prefixes behind ("AAA", "AAAI-84 · AU"): report the longest only
      const offenders = under.filter((e) => !under.some((o) => o !== e && o.text.length > e.text.length && o.text.startsWith(e.text))).sort((x, y) => x.capWhileSubject - y.capWhileSubject);
      const texture = all.filter((e) => e.role === 'texture');
      const doc = {
        shot: shot.id, at: new Date().toISOString(), minCapPx: MIN, sampled: ts.size, texts: all.length,
        rule: 'subject text (named or meant to be read) must reach the min cap height while it is the subject; texture never fails',
        offenders, subjects: all.filter((e) => e.role === 'subject').map((e) => ({ text: e.text, capWhileSubject: e.capWhileSubject, why: e.why })),
        texture: texture.map((e) => ({ text: e.text, maxCap: e.maxCap, why: e.why })), textureTexts: texture.length,
      };
      writeJson(path.join(OUT, `${shot.id}.json`), doc, 1);
      summary.shots[shot.id] = { offenders: offenders.map((o) => `${o.text} (${o.capWhileSubject}px; ${o.why})`), subjects: doc.subjects.length, texture: texture.length, texts: all.length, at: doc.at, fail: offenders.length > 0 };
      console.log(`  ${shot.id}: ${all.length} texts (${doc.subjects.length} subject, ${texture.length} texture), ${offenders.length} subject under ${MIN}px${offenders.length ? `: ${offenders.slice(0, 6).map((o) => `"${o.text.slice(0, 28)}" ${o.capWhileSubject}`).join(', ')}` : ''}`);
    }
    await h.close();
  } finally {
    await browser.close();
    await site.close();
  }
  summary.at = new Date().toISOString();
  summary.minCapPx = MIN;
  summary.rule = 'review round 2: subject text (kit cards, script onScreenText, or named by the narrator while visible) fails under minCapPx; texture is exempt';
  writeJson(path.join(OUT, 'summary.json'), summary, 1);
  const bad = Object.entries(summary.shots).filter(([, s]) => s.offenders.length);
  console.log(`${bad.length} shot(s) FAIL: subject text under ${MIN}px cap height → ${rel(path.join(OUT, 'summary.json'))}`);
  if (bad.length && ids.some((id) => bad.some(([k]) => k === id))) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
