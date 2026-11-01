#!/usr/bin/env node
// Score anchor filler for durable-objects-unbound (composer's tool; lives with the score it serves).
//
// The Strudel sources are written as TEMPLATES in score/src/<id>.strudel with anchors in @{…}; this tool resolves
// every anchor against the LOCKED clock (narration/timeline.json) and writes the playable score/cues/<id>.strudel
// that score.mjs renders. A re-fit after a clock change is then: re-run windows + fill, re-render the changed cues.
//
//   node films/durable-objects-unbound/score/tools/fill.mjs windows        # cue start/end from score/tools/windows.json
//   node films/durable-objects-unbound/score/tools/fill.mjs fill [ids]     # src/*.strudel -> cues/*.strudel
//   node films/durable-objects-unbound/score/tools/fill.mjs gaps <id>      # lines + speech-free gaps, cue-local
//   node films/durable-objects-unbound/score/tools/fill.mjs joins          # join audit (same rule as QA cueJoins)
//
// Anchors (all resolve to CUE-LOCAL seconds = absolute − cue.start, 3 decimals; in windows.json they are absolute):
//   @{L0104}            line start            @{L0104.end}        line end
//   @{L0104.tick}       start of word 'tick'  @{L0104.tick.end}   its end      (@{L0104.tick#2} = 2nd occurrence)
//   @{ch01-s01:tick}    beat 'tick' of a shot @{ch01-s02}         shot start   @{ch01-s02.end}  shot end
//   @{DUR}              window length         @{START} / @{END}   absolute window (for comments)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCORE = path.resolve(HERE, '..');
const FILM = path.resolve(SCORE, '..');
const TL = JSON.parse(fs.readFileSync(path.join(FILM, 'narration/timeline.json'), 'utf8'));
const CUES_F = path.join(SCORE, 'cues.json');
const r3 = (x) => Math.round(x * 1000) / 1000;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9'-]/g, '').replace(/^'+|'+$/g, '');

const lines = new Map();
const shots = new Map();
for (const s of TL.shots) {
  shots.set(s.id, s);
  for (const L of s.lines || []) lines.set(L.id, { ...L, shot: s, a: s.start + L.start, b: s.start + L.end });
}
const spans = [...lines.values()].sort((x, y) => x.a - y.a);

/** absolute seconds of an anchor */
export function anchor(tok) {
  tok = tok.trim();
  let m;
  if ((m = tok.match(/^(ch\d+-s\d+[a-z]?):([\w-]+)$/))) {
    const s = shots.get(m[1]);
    if (!s) throw new Error(`no shot ${m[1]}`);
    const b = s.beats?.[m[2]];
    if (!Number.isFinite(b)) throw new Error(`no beat ${m[2]} in ${m[1]}`);
    return s.start + b;
  }
  if ((m = tok.match(/^(ch\d+-s\d+[a-z]?)(\.end)?$/))) {
    const s = shots.get(m[1]);
    if (!s) throw new Error(`no shot ${m[1]}`);
    return m[2] ? s.end : s.start;
  }
  if ((m = tok.match(/^(L\d+[a-z]?)(?:\.([^.#]+?)(?:#(\d+))?)?(\.end)?$/))) {
    const L = lines.get(m[1]);
    if (!L) throw new Error(`no line ${m[1]}`);
    if (!m[2] || m[2] === 'end') return m[2] === 'end' || m[4] ? L.b : L.a;
    const want = norm(m[2]);
    const hits = L.words.filter((w) => norm(w.w) === want);
    const n = +(m[3] || 1);
    const w = hits[n - 1];
    if (!w) throw new Error(`no word '${m[2]}'${m[3] ? '#' + n : ''} in ${m[1]}: "${L.text}"`);
    return L.shot.start + (m[4] ? w.end : w.start);
  }
  throw new Error(`bad anchor @{${tok}}`);
}
/** evaluate "L0117.end + 0.3" style absolute expressions (windows.json) */
function evalAbs(expr) {
  const js = String(expr).replace(/[A-Za-z][\w.:#-]*/g, (t) => (/^(Math|min|max)$/.test(t) ? t : String(anchor(t))));
  // eslint-disable-next-line no-new-func
  return r3(Function('min', 'max', `return (${js})`)(Math.min, Math.max));
}

const readCues = () => JSON.parse(fs.readFileSync(CUES_F, 'utf8'));
const writeCues = (c) => fs.writeFileSync(CUES_F, JSON.stringify(c, null, 2) + '\n');

/** windows.json: { first: {id, start, fadeIn}, joins: [{out, in, after: "L0117", before: "L0201"}], last: {id, end, fadeOut},
 *  alone, guard }. Every join sits in the speech-free gap between line `after` and line `before`: the outgoing fade
 *  starts `guard` s after `after` ends and finishes `alone` s before `before` starts; the incoming cue starts just
 *  after the fade begins and is fully in before the outgoing cue ends. Cue metadata comes from tools/cues.base.json. */
function windows() {
  const W = JSON.parse(fs.readFileSync(path.join(HERE, 'windows.json'), 'utf8'));
  const base = JSON.parse(fs.readFileSync(path.join(HERE, 'cues.base.json'), 'utf8'));
  const old = fs.existsSync(CUES_F) ? Object.fromEntries(readCues().map((c) => [c.id, c])) : {};
  const win = {};
  win[W.first.id] = { start: evalAbs(W.first.start), fadeIn: W.first.fadeIn };
  for (const j of W.joins) {
    const e = anchor(`${j.after}.end`);
    const s = anchor(j.before);
    const pEnd = r3(s - W.alone);
    const fadeStart = r3(e + W.guard);
    const nStart = r3(e + W.guard + 0.05);
    win[j.out] = { ...win[j.out], end: pEnd, fadeOut: +(pEnd - fadeStart).toFixed(3) };
    win[j.in] = { start: nStart, fadeIn: +Math.min(1.2, pEnd - nStart).toFixed(3) };
    if (pEnd - fadeStart < 0.6) console.warn(`  warn ${j.out}→${j.in}: gap ${(s - e).toFixed(2)} s leaves a ${(pEnd - fadeStart).toFixed(2)} s fade`);
  }
  win[W.last.id] = { ...win[W.last.id], end: W.last.end === 'film.end' ? TL.duration : evalAbs(W.last.end), fadeOut: W.last.fadeOut };
  const cues = base.map(({ body, lastStrikeAt, ...b }) => {
    const w = win[b.id];
    const o = old[b.id] || {};
    const c = { ...b, start: w.start, end: w.end, fadeIn: w.fadeIn, fadeOut: w.fadeOut };
    // the composer's marker: the onset of the final chord, anchored to its word (the onset detector can miss a soft
    // final note over sustained strings and report an earlier one)
    if (lastStrikeAt) Object.assign(c, { lastStrike: evalAbs(lastStrikeAt), lastStrikeFrom: 'composer' });
    c.shots = TL.shots.filter((s) => s.start >= c.start - 2.5 && s.start < c.end - 2.5).map((s) => s.id);
    // a moved window invalidates the analysed lastStrike; an unmoved one keeps it
    if (!lastStrikeAt && o.start === c.start && o.end === c.end) for (const k of ['lastStrike', 'lastStrikeFrom']) if (o[k] != null) c[k] = o[k];
    c.notes = `${head(c, cuesNeighbours(base, b.id, win))}\n\n${body}`;
    const was = old[b.id] ? `  [was ${o.start}–${o.end}]` : '';
    console.log(`${c.id}: ${c.start.toFixed(3)}–${c.end.toFixed(3)} (${(c.end - c.start).toFixed(3)} s) fadeIn ${c.fadeIn} fadeOut ${c.fadeOut}${o.start !== c.start || o.end !== c.end ? was : ''}`);
    return c;
  });
  writeCues(cues);
}

function cuesNeighbours(list, id, win) {
  const i = list.findIndex((x) => x.id === id);
  const p = list[i - 1];
  const nx = list[i + 1];
  return { prev: p && { id: p.id, ...win[p.id] }, next: nx && { id: nx.id, ...win[nx.id] } };
}
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '?');
/** the CURRENT CLOCK paragraph: the only time authority in a cue's notes */
function head(c, { prev, next }) {
  const an = (() => {
    try {
      return JSON.parse(fs.readFileSync(path.join(SCORE, 'analysis', `${c.id}.json`), 'utf8'));
    } catch {
      return null;
    }
  })();
  const fresh = an && Math.abs((an.cueSeconds ?? -1) - (c.end - c.start)) < 0.01;
  const under = spans.filter((l) => l.b > c.start && l.a < c.end);
  const gapAt = (t) => {
    const before = [...spans].reverse().find((l) => l.b <= t + 1e-6);
    const after = spans.find((l) => l.a >= t - 1e-6);
    return `${f2(before?.b ?? 0)}–${f2(after?.a ?? TL.duration)} (${before?.id ?? 'start'} -> ${after?.id ?? 'end'})`;
  };
  const len = c.end - c.start;
  const ls = Number.isFinite(c.lastStrike) ? c.lastStrike : null;
  const fadeStart = c.end - (c.fadeOut || 0);
  const parts = [
    `CURRENT CLOCK (timeline ${TL.duration} s; ${fresh ? `rendered with score.mjs through strudel.cc Export to WAV: ${an.I} LUFS integrated, TP ${an.TP} dBTP, length ${an.lengthOk ? 'exact' : `off by ${an.lengthErrorMs} ms`}` : 'not yet rendered on this window'}; this paragraph is the only time authority).`,
    `Window ${c.start.toFixed(3)}–${c.end.toFixed(3)} (${len.toFixed(3)} s = ${(len * 0.25).toFixed(3)} cycles at setcpm(15)), shots ${c.shots[0]}…${c.shots.at(-1)}; lines under it ${under[0]?.id} (${f2(under[0]?.a)}) … ${under.at(-1)?.id} (ends ${f2(under.at(-1)?.b)}).`,
    `IN: ${c.start === 0 ? `from black at 0.00 with a ${c.fadeIn} s fade-in, in the speech-free opening ${gapAt(0)}` : `${c.start.toFixed(2)} with a ${c.fadeIn} s fade-in under ${prev?.id}'s fade, inside the speech-free gap ${gapAt(c.start)}; it sounds alone from ${f2(prev?.end)}`}.`,
    `OUT: ${next ? `fades ${f2(fadeStart)}–${f2(c.end)} (fadeOut ${c.fadeOut} s), inside the speech-free gap ${gapAt(fadeStart)}, overlapping ${next.id}'s fade-in` : `fades ${f2(fadeStart)}–${f2(c.end)} (fadeOut ${c.fadeOut} s) at the end of the film, after ${under.at(-1)?.id} ends ${f2(under.at(-1)?.b)}`}; LAST STRIKE ${ls != null ? `${f2(ls)} (${c.lastStrikeFrom || 'measured'}; it rings ${f2(fadeStart - ls)} s before the fade)` : 'not yet measured'}.`,
    `Duck: ratio ${c.duck.ratio}, ${c.duck.attack}/${c.duck.release} ms, measured-depth target ${c.duck.depthDb} dB (written around the voice). Every event is placed by the word or beat it names (template score/src/${c.id}.strudel, resolved by score/tools/fill.mjs); cue-local seconds = absolute - ${c.start.toFixed(3)}.`,
  ];
  return parts.join(' ');
}

/** rebuild every cue's CURRENT CLOCK paragraph (after analysis has measured lastStrike), keeping each body */
function notes() {
  const W = JSON.parse(fs.readFileSync(path.join(HERE, 'windows.json'), 'utf8'));
  const cues = readCues();
  const win = Object.fromEntries(cues.map((c) => [c.id, { start: c.start, end: c.end, fadeIn: c.fadeIn, fadeOut: c.fadeOut }]));
  for (const c of cues) {
    const i = c.notes.indexOf('\n\n');
    const body = i >= 0 ? c.notes.slice(i + 2) : '';
    c.notes = `${head(c, cuesNeighbours(cues, c.id, win))}\n\n${body}`;
  }
  void W;
  writeCues(cues);
  console.log(`rewrote the CURRENT CLOCK paragraph of ${cues.length} cues`);
}

function fill(ids) {
  const cues = readCues();
  for (const c of cues) {
    if (ids.length && !ids.includes(c.id)) continue;
    const src = path.join(SCORE, 'src', `${c.id}.strudel`);
    if (!fs.existsSync(src)) {
      console.log(`${c.id}: no template`);
      continue;
    }
    const DUR = r3(c.end - c.start);
    let used = 0;
    const out = fs.readFileSync(src, 'utf8').replace(/@\{([^}]+)\}/g, (_, tok) => {
      used++;
      if (tok === 'DUR') return DUR.toFixed(3);
      if (tok === 'START') return c.start.toFixed(3);
      if (tok === 'END') return c.end.toFixed(3);
      const t = r3(anchor(tok) - c.start);
      if (t < -1e-6 || t > DUR + 1e-6) console.warn(`  warn ${c.id}: @{${tok}} = ${t} lies outside the window 0..${DUR}`);
      return t.toFixed(3);
    });
    const head = `// GENERATED from score/src/${c.id}.strudel by score/tools/fill.mjs against narration/timeline.json (${TL.duration} s clock).\n// Window ${c.start.toFixed(3)}–${c.end.toFixed(3)} (${DUR.toFixed(3)} s). Edit the template, not this file.\n`;
    fs.mkdirSync(path.join(SCORE, 'cues'), { recursive: true });
    const dst = path.join(SCORE, 'cues', `${c.id}.strudel`);
    const next = head + out;
    const prev = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8') : null;
    if (prev !== next) fs.writeFileSync(dst, next);
    console.log(`${c.id}: ${used} anchors -> cues/${c.id}.strudel${prev === next ? ' (unchanged)' : ''}`);
  }
}

function gaps(id) {
  const c = readCues().find((x) => x.id === id);
  if (!c) throw new Error(`no cue ${id}`);
  let prev = c.start;
  for (const L of spans.filter((l) => l.b > c.start && l.a < c.end)) {
    const g = L.a - prev;
    if (g >= 0.45) console.log(`      gap ${r3(prev - c.start).toFixed(2)}–${r3(L.a - c.start).toFixed(2)}  (${g.toFixed(2)} s)`);
    console.log(`  ${L.id} ${r3(L.a - c.start).toFixed(2)}–${r3(L.b - c.start).toFixed(2)}  [${L.shot.id}] ${L.text}`);
    // inner word gaps >= 0.45 s
    for (let i = 1; i < L.words.length; i++) {
      const wg = L.words[i].start - L.words[i - 1].end;
      if (wg >= 0.45) console.log(`        breath ${r3(L.shot.start + L.words[i - 1].end - c.start).toFixed(2)}–${r3(L.shot.start + L.words[i].start - c.start).toFixed(2)} after '${L.words[i - 1].w}'`);
    }
    prev = L.b;
  }
  if (c.end - prev > 0.45) console.log(`      gap ${r3(prev - c.start).toFixed(2)}–${r3(c.end - c.start).toFixed(2)}  (${(c.end - prev).toFixed(2)} s) to window end`);
}

function joins() {
  const cues = readCues().sort((x, y) => x.start - y.start);
  for (let i = 1; i < cues.length; i++) {
    const p = cues[i - 1];
    const n = cues[i];
    const a0 = Math.min(n.start, p.end - (p.fadeOut || 0));
    const a1 = Math.max(p.end, n.start + (n.fadeIn || 0));
    const hit = spans.filter((sp) => sp.a < a1 && sp.b > a0);
    const prevL = [...spans].reverse().find((sp) => sp.b <= a0 + 1e-6);
    const next = spans.find((sp) => sp.a >= a1 - 1e-6);
    const ls = Number.isFinite(p.lastStrike) ? `; ${p.id} lastStrike ${p.lastStrike} → fade may start ${(p.lastStrike + 1.6).toFixed(2)} (configured ${(p.end - p.fadeOut).toFixed(2)})` : '';
    console.log(`${p.id}→${n.id} ${a0.toFixed(2)}–${a1.toFixed(2)}: after ${prevL?.id} (${(a0 - prevL?.b).toFixed(2)} s), ${hit.length ? 'UNDER ' + hit.map((h) => h.id) : 'clear'}, alone ${(next ? next.a - a1 : Infinity).toFixed(2)} s before ${next?.id}${ls}`);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'windows') windows();
else if (cmd === 'fill') fill(rest.flatMap((x) => x.split(',')).filter(Boolean));
else if (cmd === 'gaps') gaps(rest[0]);
else if (cmd === 'joins') joins();
else if (cmd === 'notes') notes();
else if (cmd === 'anchor') console.log(rest.map((t) => `${t} = ${anchor(t)}`).join('\n'));
else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 20).join('\n'));
  process.exit(cmd ? 2 : 0);
}
