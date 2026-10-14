// Cue-note clock hygiene (review round 3: m10/m13 bodies still carried stale absolute times, e.g. 'lastHall' 948.83
// when the hall stands at 968.87, and spans like 1290.87-1281.54 that run backwards, contradicting the cue's own
// CURRENT CLOCK paragraph).
//
// A cue's notes = a CURRENT CLOCK paragraph (the only time authority, re-written at every re-fit) + "\n\n" + a body
// (the composer's brief). The body must not carry absolute clock times that can go stale:
//   remapBody(body, ctx)  -> { body, remapped: [{anchor, from, to}], stripped: [text], unresolved: [anchor] }
//     'anchor' T            T re-mapped to the anchor's CURRENT time (a beat of the cue's shots, else the nearest
//                           occurrence of that word in the cue's window); unresolvable -> the number is dropped
//     every other absolute time (spans, section headers "884.83-901.66 THE BELIEF:", "(L1212 1585.60-1593.33)",
//     "at 1067.83") is stripped; the word names stay
//   auditBody(body, ctx)  -> { stale: [{anchor, at, now}], bare: [text] }  (QA score.notesClock)
// ctx = cueContext(cue, timeline): beats and words of the cue's window on the current clock.

const NUM = String.raw`\d{1,4}\.\d{1,4}(?!\d)`;
const TIME = String.raw`~?${NUM}`;
// a span may start on a whole second ("2061-2065.80"); a lone time needs its decimals
const SPAN = String.raw`(?:~?\d{3,4}(?=\s?[-–]\s?~?\d{1,4}\.\d)|${TIME})(?:\s?[-–]\s?${TIME})?`;
const UNIT_AFTER = /^\s*(?:s\b|sec|Hz|kHz|dB|LUFS|LU\b|%|x\b|×|bpm|BPM|ms\b)/;
const FILTER_BEFORE = /(?:lpf|hpf|cutoff|freq|gain|ratio|intensity|crest|depth)\s*[=:]?\s*$/i;
const LEVEL_BEFORE = /\b(?:TP|M|S|I)\s*[=:]?\s*$/;

const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']/g, '');

export function cueContext(cue, timeline, pad = 12) {
  const beats = new Map();
  const words = [];
  const inWin = (t) => t >= cue.start - pad && t <= cue.end + pad;
  for (const s of timeline.shots) {
    const mine = (cue.shots || []).includes(s.id);
    for (const [b, t] of Object.entries(s.beats || {})) {
      const at = +(s.start + t).toFixed(2);
      if (!mine && !inWin(at)) continue;
      if (!beats.has(b)) beats.set(b, []);
      beats.get(b).push({ at, mine });
    }
    // timeline word times are shot-local (the same base as line.start)
    for (const l of s.lines || [])
      for (const w of l.words || []) {
        const at = +(s.start + w.start).toFixed(2);
        if (inWin(at)) words.push({ w: norm(w.w), at });
      }
  }
  return { cue, beats, words };
}

/** the anchor's current time nearest to `hint` (the old time shifted by the cue's typical move) */
export function resolveAnchor(ctx, name, hint) {
  const bs = ctx.beats.get(name) || ctx.beats.get(name.replace(/\s+/g, '')) || [];
  const pick = (xs) => (xs.length ? xs.reduce((a, b) => (Math.abs(b - hint) < Math.abs(a - hint) ? b : a)) : null);
  const mineB = bs.filter((b) => b.mine).map((b) => b.at);
  if (mineB.length) return pick(mineB);
  if (bs.length) return pick(bs.map((b) => b.at));
  // a word anchor: its first word ('A cliff' -> 'a' is useless, so the longest word of the phrase)
  const ws = String(name).split(/\s+/).map(norm).filter(Boolean).sort((x, y) => y.length - x.length);
  if (!ws.length) return null;
  const cands = ctx.words.filter((w) => w.w === ws[0] || w.w === `${ws[0]}s` || `${w.w}s` === ws[0]).map((w) => w.at);
  const best = pick(cands);
  return best != null && Math.abs(best - hint) <= 6 ? best : null;
}

// 'anchor' T, 'anchor' (T, 'anchor' (about T-T2: the span's end is dropped (the anchor's time is the authority)
const ANCHORED = new RegExp(String.raw`'([^'\n]{1,40})'(\s*\(?\s*(?:about\s+|at\s+|~)?)(${NUM})(?![\d])(\s?[-–]\s?~?${NUM})?`, 'g');

/** the typical clock move of this body: median of (beat time now - written time) over its beat anchors */
function typicalShift(body, ctx) {
  const d = [];
  for (const m of body.matchAll(ANCHORED)) {
    const bs = ctx.beats.get(m[1]);
    if (!bs?.length) continue;
    const t = +m[3];
    const near = bs.map((b) => b.at).reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a));
    if (Math.abs(near - t) < 30) d.push(near - t);
  }
  if (!d.length) return 0;
  d.sort((x, y) => x - y);
  return d[Math.floor(d.length / 2)];
}

export function remapBody(body, ctx) {
  const remapped = [];
  const unresolved = [];
  const stripped = [];
  const shift = typicalShift(body, ctx);
  // 1. anchored times -> the anchor's current time (or dropped)
  let out = body.replace(ANCHORED, (all, name, mid, T) => {
    const t = +T;
    const now = resolveAnchor(ctx, name, t + shift);
    if (now == null) {
      unresolved.push(name);
      // keep the words only: "'x' (about T-T2; y)" -> "'x' (y)", "'x' (T)" -> "'x'", "'x' T" -> "'x'"
      return mid.includes('(') ? `'${name}' (\u0001` : `'${name}'`;
    }
    if (Math.abs(now - t) > 0.004) remapped.push({ anchor: name, from: t, to: now });
    return `'${name}'${mid}${now.toFixed(2)}`;
  });
  // protect the remapped anchored times from step 2
  const keep = [];
  out = out.replace(new RegExp(String.raw`'[^'\n]{1,40}'\s*\(?\s*(?:about\s+|at\s+|~)?${NUM}`, 'g'), (m) => {
    keep.push(m);
    return `\u0000${keep.length - 1}\u0000`;
  });
  // 2. every other absolute time: section headers, parenthesised spans, prepositional times
  const isTime = (s, before, after) => {
    const v = parseFloat(s.replace(/^~/, ''));
    if (!Number.isFinite(v) || v < 10) return false;
    if (UNIT_AFTER.test(after)) return false;
    if (FILTER_BEFORE.test(before) || LEVEL_BEFORE.test(before)) return false;
    return /\.\d{2,3}$/.test(s) || v >= 100;
  };
  out = out.replace(new RegExp(String.raw`(L\d{3,4}[a-z]?\s+)?(${SPAN})`, 'g'), (all, lid, span, off, str) => {
    const before = str.slice(Math.max(0, off - 12), off);
    const after = str.slice(off + all.length, off + all.length + 6);
    const first = span.split(/\s?[-–]\s?/)[0];
    if (!isTime(first, before, after)) return all;
    stripped.push(all);
    return lid ? lid.trim() : '\u0001';
  });
  // tidy: "(\u0001)" -> "", "(about \u0001; x)" -> "(x)", prepositions left hanging, double spaces
  out = out
    .replace(/\u0001(?:\s*,\s*\u0001)+/g, '\u0001')
    .replace(/\u0001\s+clock/g, 'earlier clock')
    .replace(/\s+(?:by|from|to|at)\s+about(?=[.,;)])/g, '')
    .replace(/\s*\((?:\s*(?:about|at|by|from|to|until|after|line ends|ends|runs|~)?\s*\u0001\s*[,;]?\s*)+\)/g, '')
    .replace(/\(\s*(?:(?:about|at|by|from|to|until|after)\s+)?\u0001\s*[,;]\s*/g, '(')
    .replace(/[,;]\s*(?:about\s+)?\u0001\s*\)/g, ')')
    .replace(/\s+(?:at|by|from|to|until|after|under|within|over|across|in the gap after|in the clear after|the breath|line ends|ends|runs|runs to|starts at|enters at|peaks ~|sits about|around)\s+(?:about\s+|~)?\u0001/g, '')
    .replace(/(^|[.;:!?]\s+|\n)\u0001\s+/g, '$1')
    .replace(/\s*\u0001/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\(\s*[,;/:]\s*/g, '(')
    .replace(/\(\s*[→-]\s*\)/g, '')
    .replace(/\(\s+/g, '(')
    .replace(/\.:\s/g, '. ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,;)])/g, '$1')
    .replace(/[ \t]+\.(?=\s|$)/g, '.');
  out = out.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
  return { body: out, remapped, stripped, unresolved, shift: +shift.toFixed(3) };
}

export function splitNotes(notes) {
  const s = String(notes || '');
  const i = s.indexOf('\n\n');
  return i >= 0 ? { head: s.slice(0, i), body: s.slice(i + 2) } : { head: s, body: '' };
}

/** QA: anchored times that disagree with the anchor's current time by more than tol, and bare absolute times */
export function auditBody(body, ctx, tol = 0.3) {
  const stale = [];
  for (const m of body.matchAll(ANCHORED)) {
    const t = +m[3];
    const now = resolveAnchor(ctx, m[1], t);
    if (now != null && Math.abs(now - t) > tol) stale.push({ anchor: m[1], at: t, now });
  }
  const r = remapBody(body, ctx);
  return { stale, bare: r.stripped };
}
