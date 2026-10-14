#!/usr/bin/env node
// Assemble + validate a film script from its per-chapter sources.
//
//   node generator/film/script.mjs assemble --slug <slug> [--check] [--wpm N (default: voice.json wpm, meta.narratorWpm, else 140)]
//
// Sources (written by the film-story workflow):
//   films/<slug>/story/meta.json         {slug,title,subtitle,logline,runtimeTargetSec, runtimeCeilingSec?}
//   films/<slug>/narration/lines.json    (optional) recorded line lengths and word times replace the wpm estimate
//   films/<slug>/story/cast.json         [PuppetSpec & {name,role,firstAppearance}]
//   films/<slug>/story/chapters/*.json   ScriptChapter (see apps/bookshelf/src/viz/film/contracts.ts)
// Outputs (unless --check): story/script.json (FilmScript) and story/script.md (readable screenplay).
// Validation errors exit 1; warnings print but pass. Stats: words, lines, shots, estimated runtime.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gapBefore } from './lib/timing.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const MOODS = ['duskRose', 'candleAmber', 'winterBlue', 'labGreen', 'dawnGold', 'serverCyan', 'emberRed', 'parchment'];
const KINDS = ['scene', 'card', 'plate', 'montage'];
const TEXT_KINDS = ['title', 'date', 'place', 'quote', 'label', 'equation', 'nameCard', 'term'];
const TRANSITIONS = ['cut', 'crossfade', 'iris', 'inkBleed', 'paperWipe', 'fadeBlack', 'lampChange', 'blur', 'whip'];
export const DEFAULTS = { leadIn: 0.6, pauseAfter: 0.45, holdAfter: 0.8 };
// House narrator pace (a measured mid-life voice); a locked voice.json wpm overrides it.
export const DEFAULT_WPM = 140;
// On-screen text needs chars/12 + 1.5 s to be read; under half of that is unreadable (error).
// It is measured from its cue beat to its optional 'until' beat (where the camera carries it out of
// frame: a pan, a cut, a push through a window), else to the end of the shot.
export const readSec = (text) => String(text).length / 12 + 1.5;
// Runtime gate: over target warns, over target × RUNTIME_SLACK fails (or, when meta sets runtimeCeilingSec, over that ceiling).
export const RUNTIME_SLACK = 1.1;

export const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const words = (s) => String(s).trim().split(/\s+/).filter(Boolean);

function readJson(file, dflt) {
  if (!existsSync(file)) {
    if (dflt !== undefined) return dflt;
    throw new Error(`missing ${path.relative(ROOT, file)}`);
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`invalid JSON in ${path.relative(ROOT, file)}: ${e.message}`);
  }
}

/** Validate a whole script; returns {errors, warnings, stats}. Pure (given loaded data). */
// narrated: optional { [lineId]: { text, speech, words: [{w, start}] } } from narration/lines.json (speech-relative
// word starts); a line whose recorded text still matches uses its real length and word times instead of the wpm guess.
/** Quoted spans in a string: “…” or "…" (straight quotes in pairs). */
export const quotedSpans = (s) => [...String(s).matchAll(/“([^”]+)”|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);
const qnorm = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const NUMBERISH = /^(\d[\d,.]*|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|and)$/;

/**
 * Quote integrity (review round 1: a British-spelling pass changed LeCun's "checks" to "cheques" on screen, in the
 * captions and in quotes.json itself). quotesLock = { <quoteId>: text } frozen when research was verified.
 * Errors: a quotes.json text that differs from the lock; a quoted span of 3+ words in a line's text that is not
 * verbatim (case and punctuation aside) in some quotes.json text; explicit `spoken` that drops a quotation's marks,
 * or changes a quoted word (numbers and lexicon respellings aside).
 */
export function checkQuotes(script, { quotes = null, quotesLock = null, lexKeys = [] } = {}) {
  const errors = [];
  if (quotes && quotesLock) {
    for (const q of quotes) {
      if (!(q.id in quotesLock)) continue;
      if (quotesLock[q.id] !== q.text) errors.push(`quotes.json ${q.id}: text differs from research/quotes.lock.json (verbatim quotes are frozen after fact-checking): "${q.text.slice(0, 80)}" vs "${String(quotesLock[q.id]).slice(0, 80)}"`);
    }
  }
  const qt = quotes ? quotes.map((q) => qnorm(q.text)) : null;
  const lexLower = new Set(lexKeys.map((k) => k.toLowerCase()));
  for (const ch of script.chapters || [])
    for (const sh of ch.shots || [])
      for (const ln of sh.lines || []) {
        const spans = quotedSpans(ln.text);
        for (const sp of spans) {
          const n = qnorm(sp);
          if (qt && n.split(' ').length >= 3 && !qt.some((t) => t.includes(n))) errors.push(`${sh.id}/${ln.id}: quoted text not verbatim in research/quotes.json: "${sp}"`);
        }
        if (ln.spoken != null && spans.length) {
          const sq = quotedSpans(ln.spoken);
          if (sq.length < spans.length) errors.push(`${sh.id}/${ln.id}: \`spoken\` drops quotation marks (${spans.length} quoted in text, ${sq.length} in spoken): keep them so the voice reads the quote as a quote`);
          else
            spans.forEach((sp, i) => {
              const tw = qnorm(sp).split(' ');
              const sw = new Set(qnorm(sq[i] ?? '').split(' '));
              const changed = tw.filter((w) => !sw.has(w) && !NUMBERISH.test(w) && !lexLower.has(w) && w !== 'ai');
              if (changed.length && sq[i] != null) errors.push(`${sh.id}/${ln.id}: \`spoken\` changes quoted words (${changed.join(', ')}): "${sp}" vs "${sq[i]}"`);
            });
        }
      }
  // the credits' off-screen quotations (meta staging.creditsSources "<quote> — <speaker, date>"): each fragment
  // between ellipses must sit, verbatim, in one quotes.json text (review round 1: '… to play' for 'to make them play')
  if (qt)
    for (const e of script.staging?.creditsSources || []) {
      const m = String(e.text).match(/^(.*\S)\s+—\s+[^—]+$/s);
      if (!m) continue;
      const frags = m[1].replace(/^[“"‘'…\s]+|[”"’'…\s]+$/g, '').split(/…|\.\.\./).map(qnorm).filter((f) => f.split(' ').length >= 3);
      if (frags.length && !qt.some((t) => frags.every((f) => t.includes(f)))) errors.push(`meta staging.creditsSources (${e.from}): quotation not verbatim in research/quotes.json: "${String(e.text).slice(0, 90)}…"`);
    }
  return errors;
}

export function validate(script, { claims = null, quotes = null, quotesLock = null, lexKeys = [], wpm = DEFAULT_WPM, narrated = null } = {}) {
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(m);
  const W = (m) => warnings.push(m);
  if (!script.title) E('meta: missing title');
  if (!script.logline) W('meta: missing logline');
  const castIds = new Set((script.cast || []).map((c) => c.id));
  for (const c of script.cast || []) if (!c.id || !c.name) E(`cast: entry missing id/name (${JSON.stringify(c).slice(0, 80)})`);
  const claimIds = claims ? new Set(claims.map((c) => c.id)) : null;
  const quoteTexts = quotes ? quotes.map((q) => norm(q.text)) : null;
  const seenCh = new Set();
  const seenShot = new Set();
  const seenLine = new Set();
  let nWords = 0;
  let nLines = 0;
  let nShots = 0;
  let seconds = 0;
  let nReal = 0;
  (script.chapters || []).forEach((ch, ci) => {
    if (!ch.id) E(`chapter #${ci + 1}: missing id`);
    if (seenCh.has(ch.id)) E(`chapter ${ch.id}: duplicate id`);
    seenCh.add(ch.id);
    if (ch.number !== ci + 1) W(`chapter ${ch.id}: number ${ch.number} but position ${ci + 1}`);
    if (!ch.title) E(`chapter ${ch.id}: missing title`);
    if (!Array.isArray(ch.shots) || !ch.shots.length) E(`chapter ${ch.id}: no shots`);
    for (const sh of ch.shots || []) {
      nShots++;
      const where = `${ch.id}/${sh.id}`;
      if (!sh.id) E(`${ch.id}: shot missing id`);
      if (seenShot.has(sh.id)) E(`${where}: duplicate shot id`);
      seenShot.add(sh.id);
      if (!KINDS.includes(sh.kind)) E(`${where}: kind "${sh.kind}" not in ${KINDS.join('|')}`);
      if (!MOODS.includes(sh.mood)) E(`${where}: mood "${sh.mood}" not in ${MOODS.join('|')}`);
      if (!sh.visual || sh.visual.length < 40) E(`${where}: visual direction missing or too thin`);
      if (!sh.setting) W(`${where}: no setting`);
      if (sh.transitionIn && !TRANSITIONS.includes(sh.transitionIn)) E(`${where}: transitionIn "${sh.transitionIn}" unknown`);
      const lineMap = new Map();
      const lineAt = new Map(); // id -> {start, dur, n} estimated shot-local timing
      let shotSec = sh.leadIn ?? DEFAULTS.leadIn;
      (sh.lines || []).forEach((ln, li) => {
        if (li > 0) shotSec += gapBefore(ln, sh.lines[li - 1]); // preGap ?? previous pauseAfter ?? 0.45
        if (ln.preGap != null && !(typeof ln.preGap === 'number' && ln.preGap >= 0 && ln.preGap <= 6)) E(`${where}/${ln.id}: preGap must be a number of seconds in 0..6`);
        if (ln.levelDb != null && !(typeof ln.levelDb === 'number' && ln.levelDb >= -9 && ln.levelDb <= 6)) E(`${where}/${ln.id}: levelDb must be a number of dB in -9..+6`);
        if (ln.levelDb != null && Math.abs(ln.levelDb) > 1.5) W(`${where}/${ln.id}: levelDb ${ln.levelDb} stacks on the per-line ride (review round 2: +3 dB made L1501 the loudest line); prefer level: 'soft' or |levelDb| <= 1.5`);
        if (ln.level != null && !['soft'].includes(ln.level)) E(`${where}/${ln.id}: level must be 'soft' (or absent)`);
        if (ln.trimDb != null && !(typeof ln.trimDb === 'number' && ln.trimDb >= -3 && ln.trimDb <= 3)) E(`${where}/${ln.id}: trimDb (fixed clip-gain trim) must be a number of dB in -3..+3`);
        if (ln.fadeIn != null && !(typeof ln.fadeIn === 'number' && ln.fadeIn >= 0 && ln.fadeIn <= 0.2)) E(`${where}/${ln.id}: fadeIn must be a number of seconds in 0..0.2`);
        if (ln.gainEnvelope != null) {
          // film:timeline per-word clip gain: [{from, to?, db, rampMs?}] (words of the line; "word#2" = second occurrence)
          const lw = String(ln.spoken ?? ln.text).toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9']/g, '')).filter(Boolean);
          const has = (w) => {
            const [w0, nth] = String(w).split('#');
            const k = w0.toLowerCase().replace(/[^a-z0-9']/g, '');
            return lw.filter((x) => x === k).length >= (Number(nth) || 1);
          };
          if (!Array.isArray(ln.gainEnvelope) || !ln.gainEnvelope.length) E(`${where}/${ln.id}: gainEnvelope must be a non-empty array of {from, to?, db, rampMs?}`);
          else
            for (const seg of ln.gainEnvelope) {
              if (!seg || typeof seg.from !== 'string' || (seg.to != null && typeof seg.to !== 'string')) E(`${where}/${ln.id}: gainEnvelope segment needs word strings from (and optional to)`);
              else if (!has(seg.from) || (seg.to != null && !has(seg.to))) E(`${where}/${ln.id}: gainEnvelope word ${JSON.stringify(has(seg.from) ? seg.to : seg.from)} is not in the spoken line`);
              if (!(typeof seg?.db === 'number' && seg.db >= -9 && seg.db <= 6)) E(`${where}/${ln.id}: gainEnvelope db must be a number in -9..+6`);
              if (seg?.rampMs != null && !(typeof seg.rampMs === 'number' && seg.rampMs >= 5 && seg.rampMs <= 200)) E(`${where}/${ln.id}: gainEnvelope rampMs must be 5..200`);
            }
        }
        nLines++;
        if (!ln.id) E(`${where}: line missing id`);
        if (seenLine.has(ln.id)) E(`${where}: duplicate line id ${ln.id}`);
        seenLine.add(ln.id);
        lineMap.set(ln.id, ln);
        if (!ln.text || !ln.text.trim()) E(`${where}/${ln.id}: empty line`);
        const spoken = ln.spoken ?? ln.text;
        if (/[<>{}\[\]`*_#|]/.test(spoken)) E(`${where}/${ln.id}: markup/symbols in spoken text`);
        if (spoken.length > 320) W(`${where}/${ln.id}: long line (${spoken.length} chars) — split for the ear`);
        const w = words(spoken).length;
        nWords += w;
        const rec = narrated?.[ln.id];
        const real = rec && rec.text === ln.text && rec.speech > 0 ? rec : null;
        if (real) nReal++;
        // a re-cut from the cache (changed insertGaps) shifts the length by the difference in edited gaps
        const regap = real ? Object.values(ln.insertGaps || {}).reduce((a, g) => a + Number(g || 0), 0) - (real.gaps || 0) : 0;
        // an estimate also carries the line's insertGaps (the narrator cuts them into the take)
        const edits = Object.values(ln.insertGaps || {}).reduce((a, g) => a + Number(g || 0), 0);
        const dur = real ? real.speech + regap : (w / wpm) * 60 + edits;
        lineAt.set(ln.id, { start: shotSec, dur, n: w, real, edits });
        shotSec += dur;
      });
      shotSec += sh.holdAfter ?? DEFAULTS.holdAfter;
      shotSec = Math.max(shotSec, sh.minDuration ?? 0);
      seconds += shotSec;
      for (const b of sh.beats || []) {
        if (!b.id) E(`${where}: beat missing id`);
        const at = b.at || {};
        if ('shotTime' in at) {
          if (typeof at.shotTime !== 'number' || at.shotTime < 0) E(`${where}/beat ${b.id}: bad shotTime`);
        } else if (at.line) {
          const ln = lineMap.get(at.line);
          if (!ln) E(`${where}/beat ${b.id}: line ${at.line} is not in this shot`);
          else if (at.word !== undefined) {
            const ws = words(ln.spoken ?? ln.text).map(norm);
            if (typeof at.word === 'number' && (at.word < 0 || at.word >= ws.length)) E(`${where}/beat ${b.id}: word index ${at.word} out of range (${ws.length} words)`);
            if (typeof at.word === 'string' && !ws.includes(norm(at.word))) E(`${where}/beat ${b.id}: word "${at.word}" not in line ${at.line}`);
          }
        } else E(`${where}/beat ${b.id}: anchor needs {line,…} or {shotTime}`);
      }
      for (const c of sh.cast || []) if (!castIds.has(c)) E(`${where}: cast id "${c}" not in cast.json`);
      const beatAt = (id) => {
        const b = (sh.beats || []).find((x) => x.id === id);
        if (!b) return 0;
        if ('shotTime' in (b.at || {})) return b.at.shotTime;
        const t = lineAt.get(b.at?.line);
        if (!t) return 0;
        let at = b.at.edge === 'end' ? t.start + t.dur : t.start;
        if (b.at.word !== undefined) {
          const ws = words((lineMap.get(b.at.line)?.spoken ?? lineMap.get(b.at.line)?.text) || '').map(norm);
          const i = typeof b.at.word === 'number' ? b.at.word : Math.max(0, ws.indexOf(norm(b.at.word)));
          const rw = t.real?.words?.[i];
          // the current insertGaps edits that fall before this word (a gap is opened AFTER its word)
          const ln2 = lineMap.get(b.at.line);
          const gapIdx = (wd) => {
            const [w0, nth] = String(wd).split('#');
            return ws.map((x, j) => (x === norm(w0) ? j : -1)).filter((j) => j >= 0)[Math.max(0, (Number(nth) || 1) - 1)] ?? -1;
          };
          const cur = Object.entries(ln2?.insertGaps || {}).reduce((a, [wd, g]) => (gapIdx(wd) >= 0 && gapIdx(wd) < i ? a + Number(g || 0) : a), 0);
          if (rw && t.real.words.length === t.n) {
            // recorded word time without the recorded edits, plus the current edits that fall before this word
            // edge 'end' on a word resolves to that word's END, as lib/timing.mjs resolveBeat does on the real clock
            const end = b.at.edge === 'end';
            at = t.start + (end ? rw.bareEnd ?? t.real.words[i + 1]?.bare ?? t.dur : rw.bare) + cur;
          } else at = t.start + ((t.dur - t.edits) * (i + (b.at.edge === 'end' ? 1 : 0))) / Math.max(1, t.n) + cur;
        }
        return at + (b.at.offset ?? 0);
      };
      const beatIds = new Set((sh.beats || []).map((b) => b.id));
      // a beat at or past the shot's end never renders (the cut comes first)
      for (const b of sh.beats || []) {
        const t = beatAt(b.id);
        if (t >= shotSec - 0.05) E(`${where}/beat ${b.id}: resolves at ${t.toFixed(2)}s, after the shot ends (${shotSec.toFixed(2)}s)`);
      }
      for (const o of sh.onScreenText || []) {
        if (!TEXT_KINDS.includes(o.kind)) E(`${where}: onScreenText kind "${o.kind}" unknown`);
        if (o.beat && !beatIds.has(o.beat)) E(`${where}: on-screen ${o.kind} cued on beat "${o.beat}", which is not in this shot`);
        if (o.until && !beatIds.has(o.until)) E(`${where}: on-screen ${o.kind} 'until' beat "${o.until}" is not in this shot`);
        const need = readSec(o.text);
        // Text leaves the frame at its 'until' beat (a camera move, a cut, a wipe), else at the shot's end.
        const from = o.beat ? beatAt(o.beat) : 0;
        const exit = o.until && beatIds.has(o.until) ? Math.min(shotSec, beatAt(o.until)) : shotSec;
        if (o.until && exit <= from) E(`${where}: on-screen ${o.kind} 'until' beat "${o.until}" comes before its cue beat`);
        const shown = exit - from;
        if (shown < need * 0.5) E(`${where}: on-screen ${o.kind} unreadable: ~${shown.toFixed(1)} s on screen${o.until ? ` (until "${o.until}")` : ''}, needs ${need.toFixed(1)} s (${o.text.length} chars). Shorten it, cue it earlier, ${o.until ? 'move its exit beat later' : 'or raise holdAfter'}`);
        else if (shown < need) W(`${where}: on-screen ${o.kind} short of reading time: ~${shown.toFixed(1)} s of ${need.toFixed(1)} s needed (${o.text.length} chars)`);
        if (o.kind === 'quote' && quoteTexts) {
          const q = norm(o.text.replace(/[—–-]\s*[^—–-]*$/, ''));
          if (!quoteTexts.some((t) => t.includes(q) || q.includes(t))) E(`${where}: on-screen quote not found verbatim in research/quotes.json: "${o.text.slice(0, 70)}…"`);
        }
      }
      if (claimIds) for (const c of sh.claims || []) if (!claimIds.has(c)) E(`${where}: claim id "${c}" not in research/claims.json`);
      if ((sh.lines || []).length && !(sh.claims || []).length && sh.kind !== 'card') W(`${where}: narration with no claim ids`);
    }
  });
  for (const e of checkQuotes(script, { quotes, quotesLock, lexKeys })) E(e);
  const target = script.runtimeTargetSec;
  const ceiling = script.runtimeCeilingSec;
  const basis = nReal === nLines && nLines ? 'from the recorded narration' : nReal ? `${nReal}/${nLines} lines recorded, the rest at ${wpm} wpm` : `at ${wpm} wpm`;
  if (ceiling && seconds > ceiling) {
    const m = `runtime: ${seconds.toFixed(1)} s (${basis}) is over the ${ceiling} s ceiling (story/meta.json runtimeCeilingSec). Shorten holds and over-long pauses first (holdAfter, minDuration, negative insertGaps), then cut words`;
    if (nReal === nLines) E(m);
    else W(m);
  }
  if (target) {
    const over = `estimated ${(seconds / 60).toFixed(1)} min (${seconds.toFixed(1)} s, ${basis}) against a ${(target / 60).toFixed(1)} min target`;
    // an explicit runtimeCeilingSec (an editorial decision, checked above) replaces the target × RUNTIME_SLACK gate
    if (!ceiling && seconds > target * RUNTIME_SLACK) E(`runtime: ${over} (ceiling ${((target * RUNTIME_SLACK) / 60).toFixed(1)} min). Cut words or air (holds, lead-ins, minDuration) from lines that carry no unique claim`);
    else if (seconds > target) W(`runtime: ${over}`);
  }
  return { errors, warnings, stats: { chapters: (script.chapters || []).length, shots: nShots, lines: nLines, words: nWords, estMinutes: +(seconds / 60).toFixed(1), estSeconds: +seconds.toFixed(2), recordedLines: nReal, targetMinutes: target ? +(target / 60).toFixed(1) : null, wpm } };
}

export function toMarkdown(script) {
  const out = [`# ${script.title}`, script.subtitle ? `*${script.subtitle}*` : '', '', `> ${script.logline || ''}`, ''];
  for (const ch of script.chapters) {
    out.push(`## Chapter ${ch.number} — ${ch.title}`, '', ch.blurb ? `*${ch.blurb}*` : '', '');
    for (const sh of ch.shots) {
      out.push(`### ${sh.id} · ${sh.setting || ''} · ${sh.era || ''} · ${sh.mood}${sh.transitionIn ? ` · in: ${sh.transitionIn}` : ''}`, '');
      out.push(`_${sh.visual}_`, '');
      for (const o of sh.onScreenText || []) out.push(`> **[${o.kind}]** ${o.text}`);
      if ((sh.onScreenText || []).length) out.push('');
      for (const ln of sh.lines || []) out.push(`**${ln.id}** ${ln.text}${ln.direction ? `  _(${ln.direction})_` : ''}`, '');
      if (sh.music?.note) out.push(`♪ ${sh.music.note}`, '');
    }
  }
  return out.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}

export function loadFilm(slug) {
  const ST = path.join(ROOT, 'films', slug, 'story');
  const meta = readJson(path.join(ST, 'meta.json'));
  const cast = readJson(path.join(ST, 'cast.json'), []);
  const dir = path.join(ST, 'chapters');
  if (!existsSync(dir)) throw new Error(`missing ${path.relative(ROOT, dir)}`);
  const chapters = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => readJson(path.join(dir, f)))
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0) || String(a.id).localeCompare(String(b.id)));
  return { ...meta, slug, cast, chapters };
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const arg = (k, d) => (rest.includes(`--${k}`) ? rest[rest.indexOf(`--${k}`) + 1] : d);
  if (cmd !== 'assemble' || !arg('slug')) {
    console.error('usage: script.mjs assemble --slug <slug> [--check] [--wpm N (default: voice.json wpm, meta.narratorWpm, else 140)]');
    process.exit(2);
  }
  const slug = arg('slug');
  const RES = path.join(ROOT, 'films', slug, 'research');
  const script = loadFilm(slug);
  const claims = readJson(path.join(RES, 'claims.json'), null);
  const quotes = readJson(path.join(RES, 'quotes.json'), null);
  const voice = readJson(path.join(ROOT, 'films', slug, 'voice', 'voice.json'), null);
  const wpm = Number(arg('wpm', 0)) || voice?.wpm || script.narratorWpm || DEFAULT_WPM;
  // real line lengths and word times from the recorded narration, where it exists. `bare` is a word's
  // speech-relative start with the recorded insertGaps edits taken back out (they are re-applied from the script).
  const unshift = (r) => {
    const gaps = [...(r.insertedGaps || [])].sort((x, y) => x.at - y.at);
    return (r.words || []).map((w) => {
      let t = w.start;
      let shifted = 0;
      for (const g of gaps) if (t - shifted > g.at) shifted += g.gap;
      t -= shifted;
      const bare = t - (r.speechStart - (gaps.length && r.speechStart > gaps[0].at ? gaps[0].gap : 0));
      // the word's end, on the same edit-free clock as `bare` (lib/timing.mjs resolveBeat uses a word's END for edge:'end')
      const bareEnd = w.end != null ? bare + (w.end - w.start) : undefined;
      return { w: w.w, start: w.start - r.speechStart, bare, bareEnd };
    });
  };
  const recorded = readJson(path.join(ROOT, 'films', slug, 'narration', 'lines.json'), null);
  const narrated = recorded?.lines
    ? Object.fromEntries(
        Object.entries(recorded.lines).map(([id, r]) => [id, { text: r.text, speech: r.speechEnd - r.speechStart, gaps: (r.insertedGaps || []).reduce((a, g) => a + g.gap, 0), words: unshift(r) }]),
      )
    : null;
  // the verified quote texts, frozen: written once (when absent) from the fact-checked quotes.json
  const lockFile = path.join(RES, 'quotes.lock.json');
  let quotesLock = readJson(lockFile, null);
  if (!quotesLock && quotes) {
    quotesLock = Object.fromEntries(quotes.map((q) => [q.id, q.text]));
    writeFileSync(lockFile, JSON.stringify({ $notes: 'Verbatim quote texts frozen after fact-checking. script.mjs fails when quotes.json drifts from these. Change one only with a source correction, and record why.', ...quotesLock }, null, 1) + '\n');
    console.log(`wrote ${path.relative(ROOT, lockFile)} (${quotes.length} quotes frozen)`);
  }
  if (quotesLock) delete quotesLock.$notes;
  const lexFile = path.join(ROOT, 'films', slug, 'voice', 'lexicon.json');
  const lexKeys = Object.keys(readJson(lexFile, {})).filter((k) => !k.startsWith('$'));
  const { errors, warnings, stats } = validate(script, { claims, quotes, quotesLock, lexKeys, wpm, narrated });
  if (!claims) warnings.unshift('research/claims.json not found: claim ids not checked');
  if (!quotes) warnings.unshift('research/quotes.json not found: on-screen quotes not checked');
  for (const w of warnings.slice(0, 60)) console.log(`warn  ${w}`);
  if (warnings.length > 60) console.log(`warn  … ${warnings.length - 60} more`);
  for (const e of errors) console.log(`ERROR ${e}`);
  console.log(JSON.stringify({ slug, ...stats, errors: errors.length, warnings: warnings.length }));
  if (errors.length) process.exit(1);
  if (rest.includes('--check')) return;
  const ST = path.join(ROOT, 'films', slug, 'story');
  writeFileSync(path.join(ST, 'script.json'), JSON.stringify(script, null, 2) + '\n');
  writeFileSync(path.join(ST, 'script.md'), toMarkdown(script) + '\n');
  console.log(`wrote ${path.relative(ROOT, path.join(ST, 'script.json'))} and script.md`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
