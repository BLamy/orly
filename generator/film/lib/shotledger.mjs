// The per-shot fix ledger and the shot-file overwrite guard (review round 3).
//
// Round 2 routed per-shot notes with a ledger key, but the ledger was written by a late, low-effort agent that never
// ran, and one fix (ch08-s05) was measured, then silently overwritten by a later pass. Everything here is
// deterministic file work, so the workflow only has to run one command and check its exit code.
//
//   withLock(file, fn)                 a mkdir lock next to `file` (stale after 60 s) around a read-modify-write
//   stripComments(src)                 TS/JS source without comments (a note's key string in a comment is not on screen)
//   noteChecks(P, round, id, note)     -> { present: [], absent: [], files: [] }  the mechanical check of one routed note:
//                                         qa/reviews/round-<n>/note-checks.json, the verdict's fixChecks, and the note's
//                                         own "grep … for 'X'" / "'X' must be absent" phrases
//   runCheck(P, id, check)             -> { ok, missing: [present strings not found], found: [absent strings found], files }
//   shotFile(P, id) / shotSha(P, id)   the shot's source file and its sha (12 hex)
//   RANK                               skipped < partial < fixed (the worse of two reports wins)
// Review round 4 (ch10-s12 reached "fixed" a fourth time by RESPELLING a removed number: '1/7' came back as
// 'one-seventh … GNMT+RL (derived)'):
//   removalKeys(note)                  -> quoted strings in the note's delete/remove/drop clauses (the note's own nouns)
//   respellings(key, note?)            -> obvious respellings of an absent key: digits <-> words, fractions <-> ordinals
//                                         ('1/7' <-> 'one-seventh', 'seventh'), 'x'/'×' <-> 'times', '%' <-> 'percent',
//                                         abbreviations (dotted, any case, and the long form the note gives in brackets)
//   shotHistory(P, id, uptoRound)      -> [{ round, note, absent }] every routed note for the shot (verdict fixes.shots and
//                                         the round's global hand-off), with the round's absent keys
//   removedKeys(P, id, round, present) -> absent keys of this AND earlier rounds (minus anything this round requires)
//   runRespellCheck(P, id, keys)       -> [{ key, as }] respellings found in the shot (case-insensitive, whole words)
import fs from 'node:fs';
import path from 'node:path';
import { readJson, sha } from './paths.mjs';

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

export function withLock(file, fn, { timeoutMs = 30000, staleMs = 60000 } = {}) {
  const lock = `${file}.lock`;
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  const t0 = Date.now();
  for (;;) {
    try {
      fs.mkdirSync(lock);
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > staleMs) fs.rmSync(lock, { recursive: true, force: true });
      } catch {}
      if (Date.now() - t0 > timeoutMs) throw new Error(`lock busy: ${lock}`);
      sleep(50);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmSync(lock, { recursive: true, force: true });
  }
}

export const RANK = { missing: -1, skipped: 0, partial: 1, fixed: 2 };
export const worse = (a, b) => (a == null ? b : b == null ? a : RANK[a] <= RANK[b] ? a : b);

export function shotFile(P, id) {
  return path.join(P.app.dir, 'shots', `${id}.tsx`);
}
export function shotSha(P, id) {
  const f = shotFile(P, id);
  return fs.existsSync(f) ? sha(fs.readFileSync(f), 12) : null;
}

/** comments out, strings kept (quotes, template literals and their ${} parts are tracked approximately) */
export function stripComments(src) {
  let out = '';
  let q = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];
    if (q) {
      out += c;
      if (c === '\\') {
        out += n ?? '';
        i++;
      } else if (c === q) q = null;
      continue;
    }
    if (c === '/' && n === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      out += '\n';
      continue;
    }
    if (c === '/' && n === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') q = c;
    out += c;
  }
  return out;
}

// "·" in source is the same text as "·" on screen
const decode = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\u\{([0-9a-fA-F]+)\}/g, (m, h) => String.fromCodePoint(parseInt(h, 16)));
// typographic quotes and dashes match their plain forms
const fold = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-');

/** the note's own mechanical phrases: "grep the file for 'BLEU' and '1/7' to confirm both are gone", "'X' must be absent" */
export function phraseChecks(note) {
  const absent = [];
  const s = String(note || '');
  for (const m of s.matchAll(/grep (?:the (?:file|source) )?for ((?:'[^']+'(?:,\s*|\s+and\s+|\s+or\s+)?)+)[^.]*?(?:gone|absent|removed)/gi)) for (const q of m[1].matchAll(/'([^']+)'/g)) absent.push(q[1]);
  for (const m of s.matchAll(/'([^']+)' must be (?:absent|gone)/gi)) absent.push(m[1]);
  return { present: [], absent: [...new Set(absent)] };
}

export function noteChecks(P, round, id, note) {
  const out = { present: [], absent: [], files: [] };
  const add = (c) => {
    if (!c) return;
    out.present.push(...(c.present || []));
    out.absent.push(...(c.absent || []));
    out.files.push(...(c.files || []));
  };
  if (round) {
    const dir = path.join(P.qa.dir, 'reviews', `round-${round}`);
    add(readJson(path.join(dir, 'note-checks.json'), {})[id]);
    add(readJson(path.join(dir, 'verdict.json'), {}).fixChecks?.[id]);
  }
  add(phraseChecks(note));
  return { present: [...new Set(out.present)], absent: [...new Set(out.absent)], files: [...new Set(out.files)] };
}

/** a note's key strings against the shot source (comments stripped) plus the files the check names and the shot's
 *  own sets/<id>-*.ts modules */
export function runCheck(P, id, check) {
  const files = [shotFile(P, id)];
  const setsDir = path.join(P.app.dir, 'sets');
  if (fs.existsSync(setsDir)) for (const f of fs.readdirSync(setsDir)) if (f.startsWith(`${id}-`) || f.startsWith(`${id}.`)) files.push(path.join(setsDir, f));
  for (const f of check.files || []) files.push(path.resolve(P.app.dir, f));
  const texts = files.filter((f) => fs.existsSync(f)).map((f) => fold(decode(stripComments(fs.readFileSync(f, 'utf8')))));
  const has = (s) => texts.some((t) => t.includes(fold(s)));
  const unresolved = (check.present || []).filter((s) => !has(s));
  // review round 5: a quoted word key ('open') is a T.word anchor; a shot that anchors on a named clock beat
  // (T.beat('stamp')) whose timeline time equals that word's time within one frame satisfies it
  const viaBeat = unresolved.map((s) => beatForWordKey(P, id, s, texts)).filter(Boolean);
  const missing = unresolved.filter((s) => !viaBeat.some((v) => v.key === s));
  const found = (check.absent || []).filter((s) => has(s));
  return { ok: !missing.length && !found.length, missing, found, ...(viaBeat.length ? { viaBeat } : {}), files: files.filter((f) => fs.existsSync(f)).map((f) => path.relative(P.app.dir, f)) };
}

const normWord = (w) => fold(String(w)).toLowerCase().replace(/[^\p{L}\p{N}']+/gu, '').replace(/^'+|'+$/g, '');
const timelineCache = new Map();
function shotClock(P, id) {
  const file = [P.app?.timeline, P.narration?.timeline].find((f) => f && fs.existsSync(f));
  if (!file) return null;
  const key = `${file}:${fs.statSync(file).mtimeMs}`;
  if (!timelineCache.has(key)) timelineCache.set(key, readJson(file, null));
  const tl = timelineCache.get(key);
  const shot = tl?.shots?.find((s) => s.id === id);
  return shot ? { shot, fps: tl.fps || 24 } : null;
}

/** a missing word key "'open'" (or "'two#2'", the n-th occurrence) resolved through a named clock beat the shot
 *  anchors on: T.beat('<name>') in the source whose timeline beat equals that word's shot-local time within one
 *  frame. Returns { key, word, beat, beatAt, wordAt } or null. */
export function beatForWordKey(P, id, key, texts) {
  const m = String(key).match(/^'([^']+?)(?:#(\d+))?'$/);
  if (!m) return null;
  const clock = shotClock(P, id);
  if (!clock) return null;
  const want = normWord(m[1]);
  const hits = clock.shot.lines.flatMap((l) => (l.words || []).filter((w) => normWord(w.w) === want).map((w) => +w.start.toFixed(4)));
  const times = m[2] ? hits.slice(Number(m[2]) - 1, Number(m[2])) : hits;
  if (!times.length) return null;
  const names = new Set();
  for (const t of texts) for (const b of t.matchAll(/\bT\.beat\(\s*(['"`])([^'"`]+)\1\s*\)/g)) names.add(b[2]);
  const tol = 1 / clock.fps + 1e-6;
  for (const name of names) {
    const at = clock.shot.beats?.[name];
    if (!Number.isFinite(at)) continue;
    const w = times.find((t) => Math.abs(t - at) <= tol);
    if (w != null) return { key, word: m[1], beat: name, beatAt: at, wordAt: w };
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// review round 4: removals stay removed, in any spelling
// ---------------------------------------------------------------------------------------------------------------
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = { 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety' };
const ORD = { 2: 'half', 3: 'third', 4: 'quarter', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth', 20: 'twentieth', 100: 'hundredth', 1000: 'thousandth' };
const numWord = (n) => (n < 20 ? ONES[n] : n < 100 ? `${TENS[n - (n % 10)]}${n % 10 ? `-${ONES[n % 10]}` : ''}` : n === 100 ? 'a hundred' : n === 1000 ? 'a thousand' : null);
const WORD_NUM = Object.fromEntries([...ONES.map((w, i) => [w, i]), ...Object.entries(TENS).map(([n, w]) => [w, +n])]);
const ORD_NUM = Object.fromEntries(Object.entries(ORD).map(([n, w]) => [w, +n]));

/** quoted strings in the note's delete/remove/drop clauses ("Delete the caption 'X'", "remove 'Y' and 'Z'") */
export function removalKeys(note) {
  const out = [];
  const s = String(note || '');
  for (const sent of s.split(/(?<=[.;!?])\s+|\s+\|\s+/)) {
    const m = /\b(delete|deletes|deleted|remove|removes|removed|drop|drops|strip|strike out|cut out|take out|lose)\b/i.exec(sent);
    if (!m) continue;
    // stop at the first "keep"/"replace with"/"instead" clause: what follows is meant to stay
    const tail = sent.slice(m.index).split(/\b(?:keep|keeping|replace (?:it |them )?with|use the|instead)\b/i)[0];
    for (const q of tail.matchAll(/'([^']{2,120})'/g)) out.push(q[1]);
  }
  return [...new Set(out)];
}

/** obvious respellings of a removed string (never the string itself) */
export function respellings(key, note = '') {
  const k = String(key);
  const out = new Set();
  // fractions 1/N <-> one-Nth, Nth, 1:N
  const fr = /^(\d+)\s*\/\s*(\d+)$/.exec(k.trim());
  if (fr) {
    const [a, b] = [+fr[1], +fr[2]];
    const ord = ORD[b];
    if (ord) {
      if (a === 1) for (const v of [`one-${ord}`, `one ${ord}`, `a ${ord}`, ord]) out.add(v);
      else if (numWord(a)) for (const v of [`${numWord(a)}-${ord}s`, `${numWord(a)} ${ord}s`]) out.add(v);
    }
    out.add(`${a}:${b}`);
  }
  // ordinal / fraction words -> digits
  const low = k.toLowerCase().trim();
  if (ORD_NUM[low]) for (const v of [`1/${ORD_NUM[low]}`, `${ORD_NUM[low]}th`]) out.add(v);
  // every number token to words, every number word to digits
  const toWords = k.replace(/(?<![\d.,/:])\d+(?![\d.,/:])/g, (d) => numWord(+d) ?? d);
  if (toWords !== k) out.add(toWords);
  const toDigits = k.replace(/\b[a-z]+(?:-[a-z]+)?\b/gi, (w) => {
    const lw = w.toLowerCase();
    if (lw in WORD_NUM) return String(WORD_NUM[lw]);
    const [t, o] = lw.split('-');
    return t in WORD_NUM && o in WORD_NUM && WORD_NUM[t] >= 20 && WORD_NUM[o] < 10 ? String(WORD_NUM[t] + WORD_NUM[o]) : w;
  });
  if (toDigits !== k) out.add(toDigits);
  // multipliers and percents
  const mx = /^(\d+)\s*[x×]$/i.exec(k.trim());
  if (mx) for (const v of [`${numWord(+mx[1]) ?? mx[1]} times`, `${mx[1]} times`, `${numWord(+mx[1]) ?? mx[1]}fold`]) out.add(v);
  if (/%/.test(k)) {
    out.add(k.replace(/\s*%/g, ' percent'));
    out.add(k.replace(/\s*%/g, ' per cent'));
  }
  // abbreviations: dotted, any case (matched case-insensitively), and a long form the note gives in brackets
  for (const ab of k.match(/\b[A-Z][A-Z0-9]{1,6}\b/g) || []) {
    if (ab === k.trim()) out.add(ab.split('').join('.'));
    const esc = ab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const long1 = new RegExp(`([A-Z][\\w-]*(?:\\s+[A-Za-z][\\w-]*){1,6})\\s*\\(${esc}\\)`).exec(note);
    const long2 = new RegExp(`\\b${esc}\\s*\\(([A-Z][\\w-]*(?:\\s+[A-Za-z][\\w-]*){1,6})\\)`).exec(note);
    for (const m of [long1, long2]) if (m) out.add(m[1]);
  }
  out.delete(k);
  return [...out].filter((v) => v && v.trim().length >= 3);
}

function roundsOn(P) {
  const dir = path.join(P.qa.dir, 'reviews');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map((d) => +(/^round-(\d+)$/.exec(d) || [])[1]).filter(Number.isFinite).sort((a, b) => a - b);
}

/** every routed note for a shot up to (and including) a round, oldest first, with that round's absent keys */
export function shotHistory(P, id, uptoRound = Infinity, film = null) {
  const out = [];
  for (const r of roundsOn(P)) {
    if (r > uptoRound) continue;
    const dir = path.join(P.qa.dir, 'reviews', `round-${r}`);
    const v = readJson(path.join(dir, 'verdict.json'), {});
    const hand = film?.stages?.fixes?.[`round${r}-global`]?.handoff?.[id];
    const note = v.fixes?.shots?.[id];
    if (!note && !hand) continue;
    const nc = readJson(path.join(dir, 'note-checks.json'), {})[id] || {};
    const fc = v.fixChecks?.[id] || {};
    const absent = [...new Set([...(nc.absent || []), ...(fc.absent || []), ...phraseChecks(note).absent, ...removalKeys(note)])];
    const present = [...new Set([...(nc.present || []), ...(fc.present || [])])];
    out.push({ round: r, ...(note ? { note } : {}), ...(hand ? { handoff: hand } : {}), absent, present });
  }
  return out;
}

/** what routed notes removed from this shot (this round and every earlier one), minus what this round requires */
export function removedKeys(P, id, round, film = null) {
  const hist = shotHistory(P, id, round ?? Infinity, film);
  const cur = hist.filter((h) => h.round === round);
  const required = new Set(cur.flatMap((h) => h.present).map((s) => s.toLowerCase()));
  const keys = [];
  for (const h of hist) for (const k of h.absent) if (!required.has(k.toLowerCase())) keys.push({ key: k, round: h.round, note: h.note || h.handoff || '' });
  const seen = new Set();
  return keys.filter((x) => (seen.has(x.key) ? false : seen.add(x.key)));
}

/** respellings (and earlier rounds' removed strings) found in the shot source: case-insensitive, whole words */
export function runRespellCheck(P, id, keys) {
  const files = [shotFile(P, id)];
  const setsDir = path.join(P.app.dir, 'sets');
  if (fs.existsSync(setsDir)) for (const f of fs.readdirSync(setsDir)) if (f.startsWith(`${id}-`) || f.startsWith(`${id}.`)) files.push(path.join(setsDir, f));
  // on-screen text (and T.word anchors) live in string literals: match inside them only, so identifiers never hit
  const lits = (src) => [...src.matchAll(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g)].map((m) => m[0].slice(1, -1));
  const text = files.filter((f) => fs.existsSync(f)).flatMap((f) => lits(decode(stripComments(fs.readFileSync(f, 'utf8')))).map(fold)).join('\n');
  const hits = [];
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const { key, round, exact } of keys) {
    const forms = exact ? [key] : [key, ...respellings(key, '')];
    for (const f of forms) {
      const ff = fold(f);
      const re = new RegExp(`(^|[^A-Za-z0-9])${esc(ff).replace(/\\ /g, '\\s+').replace(/-/g, '[-\\s]?')}(?=$|[^A-Za-z0-9])`, 'i');
      if (re.test(text)) {
        hits.push({ key, as: f, round });
        break;
      }
    }
  }
  return hits;
}
