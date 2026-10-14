#!/usr/bin/env node
// Clean a raw rrweb capture into marketing-grade footage for a promo film.
//
//   node tools/promo/rr-clean.mjs --slug replay-qa-promo --take overview
//
// Reads films/<slug>/capture/raw/<take>.jsonl and films/<slug>/capture/clean.json (per-take + shared rules):
//   { "shared": { "redact": ["literal secret", …], "redactPatterns": ["regex", …], "hide": ["css selector", …],
//                 "css": "extra replay css", "maxGapMs": 700 },
//     "takes": { "<take>": { "cuts": [["markA","markB"]], "speed": [["markA","markB",2.5]], "maxGapMs": 500,
//                            "replace": [["from text","to text"]], "hide": [...] } } }
// Writes films/<slug>/capture/clean/<take>.json (committed) and public/generated/<slug>/rr/<take>.json (app copy):
//   { take, viewport, duration (ms), marks: {name: ms}, css, cursor: {samples: [[ms,x,y]…] @60 Hz, clicks: [[ms,x,y]…]},
//     events (timestamps rebased so the take starts at 0), stats }
//
// What "clean" means:
//  1. Trim to the take's `start` … `end` marks (the full snapshot before `start` is folded onto t = 0).
//  2. Redact: every text node, attribute value and input value is scrubbed of secrets (login variables, API
//     tokens, bearer strings, e-mail addresses, password inputs) — literal list + patterns.
//  3. Retime: idle gaps longer than maxGapMs collapse to maxGapMs; `cuts` remove spans (spinners, waits);
//     `speed` ranges play faster. One monotone time map is applied to every event, mark and cursor sample.
//  4. Cursor: rrweb's own mouse is hidden; the pointer path is extracted, smoothed (centred moving average on a
//     60 Hz resample) and exported with click times so the film can draw a crisp cursor + click pulses.
//  5. Chrome: toasts, chat widgets, scrollbars, focus rings, carets and anything listed in `hide` are suppressed
//     with replay-time CSS.
//  6. Assets: remote url(...) / src / srcset references are downloaded into public/generated/<slug>/rr/assets/
//     and rewritten, so playback is offline and deterministic (no late-loading fonts in a frame-exact render).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
};
const slug = arg('slug');
const take = arg('take');
if (!slug || !take) {
  console.error('usage: rr-clean.mjs --slug <slug> --take <take> [--no-assets]');
  process.exit(2);
}
const FILM = path.resolve('films', slug);
const CAP = path.join(FILM, 'capture');
const PUB = path.resolve('public', 'generated', slug, 'rr');
const ASSETS = path.join(PUB, 'assets');
const PUBLIC_BASE = `/generated/${slug}/rr/assets/`;

const ET = { DomContentLoaded: 0, Load: 1, FullSnapshot: 2, Incremental: 3, Meta: 4, Custom: 5, Plugin: 6 };
const IS = { Mutation: 0, MouseMove: 1, MouseInteraction: 2, Scroll: 3, ViewportResize: 4, Input: 5, TouchMove: 6, StyleSheetRule: 8, Font: 10, Drag: 12, StyleDeclaration: 13, Selection: 14, AdoptedStyleSheet: 15 };
const MI = { MouseUp: 0, MouseDown: 1, Click: 2 };

const rulesAll = fs.existsSync(path.join(CAP, 'clean.json')) ? JSON.parse(fs.readFileSync(path.join(CAP, 'clean.json'), 'utf8')) : {};
const shared = rulesAll.shared ?? {};
const rules = { ...shared, ...(rulesAll.takes?.[take] ?? {}) };
rules.hide = [...(shared.hide ?? []), ...(rulesAll.takes?.[take]?.hide ?? [])];
rules.replace = [...(shared.replace ?? []), ...(rulesAll.takes?.[take]?.replace ?? [])];

// ---------------------------------------------------------------- load
const raw = fs
  .readFileSync(path.join(CAP, 'raw', `${take}.jsonl`), 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l))
  .sort((a, b) => a.timestamp - b.timestamp);
if (!raw.length) throw new Error('empty capture');

const marksRaw = {};
for (const e of raw) if (e.type === ET.Custom && e.data?.tag === 'mark') marksRaw[e.data.payload.name] = e.timestamp;
// the take window: start/end marks, overridable per take ("startMark": "typing", "startOffsetMs": -1200)
let t0 = (marksRaw[rules.startMark ?? 'start'] ?? raw[0].timestamp) + (rules.startOffsetMs ?? 0);
// autoStart (default on): never open on a loading shell. Track the DOM's node count (full snapshot + adds − removes)
// and start at the first moment it reaches 70% of its peak within the first 8 s of the take (+250 ms to settle).
if (rules.autoStart !== false) {
  const count = (n) => 1 + (n.childNodes ?? []).reduce((a, c) => a + count(c), 0);
  let nodes = 0;
  const series = [];
  for (const e of raw) {
    if (e.type === 2) nodes = count(e.data.node);
    else if (e.type === 3 && e.data.source === 0) nodes += (e.data.adds ?? []).reduce((a, x) => a + count(x.node), 0) - (e.data.removes ?? []).length;
    series.push([e.timestamp, nodes]);
  }
  // only before the take's first scripted action (a later page can be much bigger than the first one)
  const nextMark = Math.min(...Object.values(marksRaw).filter((m) => m > t0 + 50), t0 + 8000);
  const win = series.filter(([t]) => t >= t0 && t <= nextMark);
  const peak = Math.max(0, ...win.map(([, n]) => n));
  const first = win.find(([, n]) => n >= 0.7 * peak);
  if (first && first[0] > t0) t0 = Math.min(first[0] + 250, nextMark - 300);
}
const t1 = (marksRaw[rules.endMark ?? 'end'] ?? raw[raw.length - 1].timestamp) + (rules.endOffsetMs ?? 0);

// ---------------------------------------------------------------- 1. trim
// keep the last Meta + FullSnapshot at or before t0 and everything after it; fold pre-start events onto t0
let snapIdx = -1;
for (let i = 0; i < raw.length; i++) if (raw[i].type === ET.FullSnapshot && raw[i].timestamp <= t0) snapIdx = i;
if (snapIdx < 0) snapIdx = raw.findIndex((e) => e.type === ET.FullSnapshot);
let metaIdx = snapIdx;
while (metaIdx > 0 && raw[metaIdx].type !== ET.Meta) metaIdx--;
let events = raw.slice(metaIdx).filter((e) => e.timestamp <= t1 + 1);

// ---------------------------------------------------------------- 2. redact
// literal secrets: clean.json `redact` plus the gitignored capture/api/redact.local.json (login variables etc.)
const local = fs.existsSync(path.join(CAP, 'api', 'redact.local.json')) ? JSON.parse(fs.readFileSync(path.join(CAP, 'api', 'redact.local.json'), 'utf8')).redact ?? [] : [];
const secrets = [...new Set([...(rules.redact ?? []), ...local])].filter((s) => s && s.length >= 3).sort((a, b) => b.length - a.length);
const patterns = [
  /\b(?:sk|pk|rk|rqa|rqk|ghp|gho|github_pat|xox[abp])[-_][A-Za-z0-9_\-]{12,}\b/g,
  /\bBearer\s+[A-Za-z0-9._\-]{12,}/g,
  /\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{6,}/g,
  ...(rules.redactPatterns ?? []).map((p) => new RegExp(p, 'g')),
];
const emailRe = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
const emailAllow = new Set((rules.emailAllow ?? []).map((s) => s.toLowerCase()));
let redactions = 0;
const scrub = (s) => {
  if (typeof s !== 'string' || !s) return s;
  let out = s;
  for (const [a, b] of rules.replace) if (out.includes(a)) out = out.split(a).join(b);
  for (const sec of secrets) if (out.includes(sec)) { out = out.split(sec).join('•'.repeat(Math.min(12, sec.length))); redactions++; }
  for (const re of patterns) out = out.replace(re, (m) => (redactions++, '•'.repeat(Math.min(16, m.length))));
  out = out.replace(emailRe, (m) => (emailAllow.has(m.toLowerCase()) ? m : (redactions++, 'you@your-app.dev')));
  return out;
};
const scrubNode = (n) => {
  if (!n) return;
  if (n.type === 3 && typeof n.textContent === 'string' && !n.isStyle) n.textContent = scrub(n.textContent);
  if (n.type === 2 && n.attributes) {
    for (const k of Object.keys(n.attributes)) {
      if (k === '_cssText' || k === 'src' || k === 'srcset' || k === 'href' && n.tagName === 'link') continue;
      if (typeof n.attributes[k] === 'string') n.attributes[k] = scrub(n.attributes[k]);
    }
    if (n.tagName === 'input' && /password/i.test(n.attributes.type ?? '') && n.attributes.value) n.attributes.value = '••••••••';
  }
  for (const c of n.childNodes ?? []) scrubNode(c);
};
// hideByText: buttons/links/badges whose text matches are hidden (internal Admin button, credit meter, …)
const hideRes = (rules.hideByText ?? []).map((r) => new RegExp(r, 'i'));
const textOf = (n) => (n.type === 3 ? n.textContent ?? '' : (n.childNodes ?? []).map(textOf).join(''));
let hidden = 0;
const hideNode = (n) => {
  if (!n || !hideRes.length) return;
  if (n.type === 2 && ['button', 'a', 'span', 'div'].includes(n.tagName) && (n.tagName !== 'div' || (n.childNodes ?? []).length <= 4)) {
    const tx = textOf(n).trim();
    if (tx.length < 60 && hideRes.some((r) => r.test(tx))) {
      n.attributes = { ...n.attributes, style: `${n.attributes?.style ?? ''};visibility:hidden !important` };
      hidden++;
      return;
    }
  }
  for (const c of n.childNodes ?? []) hideNode(c);
};
for (const e of events) {
  if (e.type === ET.FullSnapshot) hideNode(e.data.node);
  else if (e.type === ET.Incremental && e.data.source === IS.Mutation) for (const a of e.data.adds ?? []) hideNode(a.node);
}
for (const e of events) {
  if (e.type === ET.FullSnapshot) scrubNode(e.data.node);
  else if (e.type === ET.Incremental) {
    const d = e.data;
    if (d.source === IS.Mutation) {
      for (const a of d.adds ?? []) scrubNode(a.node);
      for (const t of d.texts ?? []) t.value = scrub(t.value);
      for (const a of d.attributes ?? []) for (const k of Object.keys(a.attributes ?? {})) if (typeof a.attributes[k] === 'string' && k !== 'src' && k !== 'srcset') a.attributes[k] = scrub(a.attributes[k]);
    } else if (d.source === IS.Input && typeof d.text === 'string') d.text = scrub(d.text);
  }
}

// ---------------------------------------------------------------- 3. retime (one monotone map)
const markT = (name) => {
  if (marksRaw[name] == null) throw new Error(`take ${take}: unknown mark "${name}" (have ${Object.keys(marksRaw).join(', ')})`);
  return marksRaw[name];
};
// segments of original time with a rate: rate 0 = cut, 1 = real time, 2.5 = 2.5x faster
const segs = [];
for (const [a, b] of rules.cuts ?? []) segs.push({ a: markT(a), b: markT(b), rate: 0 });
for (const [a, b, f] of rules.speed ?? []) segs.push({ a: markT(a), b: markT(b), rate: f });
// idle compression: gaps between "meaningful" events (not mouse moves, not style noise) beyond maxGap
const maxGap = rules.maxGapMs ?? 700;
const meaningful = events.filter((e) => e.timestamp >= t0 && (e.type !== ET.Incremental || ![IS.MouseMove, IS.StyleDeclaration, IS.Selection].includes(e.data.source)));
const movesAt = events.filter((e) => e.type === ET.Incremental && e.data.source === IS.MouseMove).map((e) => e.timestamp);
for (let i = 1; i < meaningful.length; i++) {
  const a = meaningful[i - 1].timestamp, b = meaningful[i].timestamp;
  if (b - a <= maxGap) continue;
  // never compress across a gap in which the cursor is travelling
  const moving = movesAt.some((m) => m > a + 50 && m < b - 50);
  if (moving) continue;
  if (segs.some((s) => s.a < b && s.b > a)) continue;
  segs.push({ a: a + maxGap / 2, b: b - maxGap / 2, rate: 0 });
}
segs.sort((x, y) => x.a - y.a);
const map = (t) => {
  // new time = elapsed since t0 with each segment's rate applied
  let out = Math.max(0, t - t0);
  for (const s of segs) {
    if (t <= s.a) break;
    const span = Math.min(t, s.b) - s.a;
    out -= span - (s.rate === 0 ? 0 : span / s.rate);
  }
  return Math.max(0, out);
};
const inCut = (t) => segs.some((s) => s.rate === 0 && t > s.a && t < s.b);

// drop cursor samples inside cuts (the DOM state still advances through them instantly)
const out = [];
for (const e of events) {
  if (e.type === ET.Incremental && e.data.source === IS.MouseMove && inCut(e.timestamp)) continue;
  out.push({ ...e, timestamp: Math.round(map(e.timestamp)) });
}
events = out;
const marks = Object.fromEntries(Object.entries(marksRaw).filter(([, t]) => t >= t0 - 1 && t <= t1 + 1).map(([k, t]) => [k, Math.round(map(t))]));
const duration = Math.round(map(t1));

// ---------------------------------------------------------------- 4. cursor
const pts = [];
const clicks = [];
for (const e of events) {
  if (e.type !== ET.Incremental) continue;
  const d = e.data;
  if (d.source === IS.MouseMove) for (const p of d.positions ?? []) pts.push([e.timestamp + (p.timeOffset ?? 0), p.x, p.y]);
  if (d.source === IS.MouseInteraction && d.x != null) {
    pts.push([e.timestamp, d.x, d.y]);
    if (d.type === MI.Click) clicks.push([e.timestamp, Math.round(d.x), Math.round(d.y)]);
  }
}
pts.sort((a, b) => a[0] - b[0]);
const samples = [];
if (pts.length) {
  const at = (t) => {
    let i = 0;
    while (i < pts.length - 1 && pts[i + 1][0] <= t) i++;
    const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)];
    if (t <= a[0] || a === b) return [a[1], a[2]];
    const u = (t - a[0]) / Math.max(1, b[0] - a[0]);
    return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  };
  const raw60 = [];
  for (let t = 0; t <= duration; t += 1000 / 60) raw60.push([t, ...at(t)]);
  const R = 3; // ±3 samples ≈ 100 ms window
  for (let i = 0; i < raw60.length; i++) {
    let sx = 0, sy = 0, n = 0;
    for (let k = -R; k <= R; k++) {
      const p = raw60[Math.max(0, Math.min(raw60.length - 1, i + k))];
      sx += p[1]; sy += p[2]; n++;
    }
    // keep clicks pinned: near a click, use the exact click point
    const c = clicks.find((cl) => Math.abs(cl[0] - raw60[i][0]) < 120);
    samples.push([Math.round(raw60[i][0]), c ? c[1] : +(sx / n).toFixed(1), c ? c[2] : +(sy / n).toFixed(1)]);
  }
}

// ---------------------------------------------------------------- 5. replay css
const css = [
  '.replayer-mouse, .replayer-mouse-tail { display: none !important; }',
  // frame-exact footage: CSS animations/transitions off, so entrance fades never freeze at opacity 0 (rrweb-paused
  // pauses them at their first keyframe) and every frame is a pure function of the DOM state
  '*, *::before, *::after { animation: none !important; transition: none !important; }',
  '*::-webkit-scrollbar { display: none !important; } * { scrollbar-width: none !important; }',
  '*:focus, *:focus-visible { outline: none !important; box-shadow: none !important; }',
  'input, textarea { caret-color: transparent !important; }',
  '[data-sonner-toaster], [id^="intercom"], .intercom-lightweight-app, [data-testid="toast"], #fs-frame { display: none !important; }',
  ...rules.hide.map((s) => `${s} { display: none !important; }`),
  rules.css ?? '',
]
  // rrweb's insertStyleRules calls insertRule once per entry: exactly one rule each
  .flatMap((block) => block.match(/[^{}]+\{[^{}]*\}/g) ?? [])
  .map((r) => r.trim())
  .filter(Boolean);

// ---------------------------------------------------------------- 6. assets
let localized = 0;
const assetCache = new Map();
async function localize(url) {
  if (!/^https?:\/\//.test(url)) return url;
  if (assetCache.has(url)) return assetCache.get(url);
  const p = (async () => {
    try {
      const r = await fetch(url);
      if (!r.ok) return url;
      const buf = Buffer.from(await r.arrayBuffer());
      const ext = (path.extname(new URL(url).pathname) || '.' + (r.headers.get('content-type') ?? 'bin').split('/').pop().split(';')[0]).slice(0, 8);
      const name = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16) + ext;
      fs.mkdirSync(ASSETS, { recursive: true });
      fs.writeFileSync(path.join(ASSETS, name), buf);
      localized++;
      return PUBLIC_BASE + name;
    } catch {
      return url;
    }
  })();
  assetCache.set(url, p);
  return p;
}
async function rewriteCss(css) {
  const urls = [...css.matchAll(/url\(\s*['"]?(https?:\/\/[^'")\s]+)['"]?\s*\)/g)].map((m) => m[1]);
  for (const u of new Set(urls)) css = css.split(u).join(await localize(u));
  return css;
}
async function assetsNode(n) {
  if (!n) return;
  if (n.type === 2 && n.attributes) {
    const A = n.attributes;
    if (typeof A._cssText === 'string') A._cssText = await rewriteCss(A._cssText);
    if (typeof A.style === 'string' && A.style.includes('url(')) A.style = await rewriteCss(A.style);
    if (typeof A.src === 'string' && n.tagName === 'img') A.src = await localize(A.src);
    if (typeof A.srcset === 'string') delete A.srcset;
    if (n.tagName === 'link' && /icon|preload|prefetch|preconnect|manifest/i.test(A.rel ?? '')) n.attributes = { rel: 'x-dropped' };
  }
  if (n.type === 3 && n.isStyle && typeof n.textContent === 'string') n.textContent = await rewriteCss(n.textContent);
  for (const c of n.childNodes ?? []) await assetsNode(c);
}
if (!arg('no-assets', false)) {
  for (const e of events) {
    if (e.type === ET.FullSnapshot) await assetsNode(e.data.node);
    else if (e.type === ET.Incremental && e.data.source === IS.Mutation) {
      for (const a of e.data.adds ?? []) await assetsNode(a.node);
      for (const a of e.data.attributes ?? []) {
        const at = a.attributes ?? {};
        if (typeof at.src === 'string') at.src = await localize(at.src);
        if (typeof at.style === 'string' && at.style.includes('url(')) at.style = await rewriteCss(at.style);
        if ('srcset' in at) delete at.srcset;
      }
    } else if (e.type === ET.Incremental && e.data.source === IS.StyleSheetRule) {
      for (const r of e.data.adds ?? []) if (typeof r.rule === 'string') r.rule = await rewriteCss(r.rule);
    } else if (e.type === ET.Incremental && e.data.source === IS.Font && typeof e.data.fontSource === 'string') {
      const m = e.data.fontSource.match(/url\(["']?(https?:[^"')]+)/);
      if (m) e.data.fontSource = e.data.fontSource.replace(m[1], await localize(m[1]));
    }
  }
}

// ---------------------------------------------------------------- write
const meta = events.find((e) => e.type === ET.Meta);
const doc = {
  take,
  viewport: { width: meta?.data?.width ?? 1440, height: meta?.data?.height ?? 900 },
  duration,
  marks,
  css,
  cursor: { samples, clicks },
  events,
  stats: {
    rawEvents: raw.length,
    events: events.length,
    rawMs: t1 - t0,
    ms: duration,
    cutMs: Math.round(t1 - t0 - duration),
    redactions,
    hidden,
    assetsLocalized: localized,
    clicks: clicks.length,
  },
};
const json = JSON.stringify(doc);
// leak check BEFORE anything is written: no secret may survive anywhere in the output
const leaks = secrets.filter((s) => json.includes(s));
if (leaks.length) {
  console.error(`LEAK: ${leaks.length} redaction literal(s) still present in ${take}.json`);
  process.exit(3);
}
fs.mkdirSync(path.join(CAP, 'clean'), { recursive: true });
fs.mkdirSync(PUB, { recursive: true });
fs.writeFileSync(path.join(CAP, 'clean', `${take}.json`), json);
fs.writeFileSync(path.join(PUB, `${take}.json`), json);

console.log(`${take}: ${(doc.stats.rawMs / 1000).toFixed(1)} s raw → ${(duration / 1000).toFixed(1)} s clean · ${events.length} events · ${redactions} redactions · ${localized} assets · marks ${Object.keys(marks).join(', ')} · ${(json.length / 1e6).toFixed(2)} MB`);
