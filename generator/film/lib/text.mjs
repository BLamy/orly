// Pure text utilities for narration (no I/O; unit-tested in generator/film/text.test.mjs).
//
//   sanitizeSpoken(s)                   dashes -> commas, curly quotes -> straight, tidy spaces
//   displayWords(text)                  ['In','1958','a','psychologist', …]  (the WordTiming.w vocabulary)
//   normWord(w)                         case/punctuation-blind key ("LeCun's" -> "lecuns")
//   compileLexicon(json)                accepts {word: spoken} | {entries:{…}} | [{text|written, spoken|say}]
//   speak(line, lexicon)                -> { spoken, words: [{ w, n }] }  n = spoken words this display word became
//                                       (the lexicon applies inside explicit `spoken` text as well)
//   applyLexicon(text, lexicon)         the lexicon pass alone -> { spoken, words }
//   planChunks(lines, max)              pack a shot's lines into ≤ max-char request chunks joined by "\n\n"
//   alignChunk(chunkLines, alignment)   per-line { start, end, words:[{w,start,end}] } from ElevenLabs char alignment
//
// The vocabulary rule: subtitles show `text`; the voice says `spoken` (explicit, else text), run through
// the voice-only lexicon. Word timings are reported per DISPLAY word so shots can anchor to the
// words they show (`T.word('L0012', 'AlexNet')`), even when the voice says "Alex Net".

export function sanitizeSpoken(text) {
  return String(text)
    .trim()
    .replace(/\s*(?:—|–|--)\s*/g, ', ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/,\s*,+/g, ',')
    .replace(/^,\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1');
}

export const stripTags = (s) => String(s).replace(/\[[^\]]*\]\s*/g, '');

const ALNUM = /[\p{L}\p{N}]/u;
const SEP = /(\s+|—|–|--)/;

/** Leading/trailing punctuation stripped; inner apostrophes and hyphens kept. */
export const coreOf = (tok) => tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

export const normWord = (w) =>
  String(w)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');

export function displayWords(text) {
  return stripTags(text)
    .split(SEP)
    .filter((t) => t && !SEP.test(t) && ALNUM.test(t))
    .map(coreOf);
}

export function compileLexicon(json) {
  const map = new Map();
  if (!json) return map;
  const add = (k, v) => {
    if (typeof k === 'string' && typeof v === 'string' && k.trim()) map.set(k.trim(), v.trim());
  };
  const src = Array.isArray(json) ? json : json.entries ?? json.words ?? json;
  if (Array.isArray(src)) for (const e of src) add(e.text ?? e.written ?? e.word, e.spoken ?? e.say ?? e.as);
  else for (const [k, v] of Object.entries(src)) if (!k.startsWith('$') && k !== 'notes') add(k, typeof v === 'string' ? v : v?.spoken ?? v?.say);
  // case-insensitive fallback index
  const lower = new Map();
  for (const [k, v] of map) if (!lower.has(k.toLowerCase())) lower.set(k.toLowerCase(), v);
  map.lower = lower;
  map.maxWords = Math.max(1, ...[...map.keys()].map((k) => k.split(/\s+/).length));
  return map;
}

function lookup(lex, key, exact = false) {
  if (!lex || !lex.size) return undefined;
  return lex.get(key) ?? (exact ? undefined : lex.lower?.get(key.toLowerCase()));
}

const countSpokenWords = (s) => displayWords(s).length;

/**
 * Build the spoken form of a line and the display-word -> spoken-word-count map.
 * line: { text, spoken? }. Explicit `spoken` wins over the written text, and the lexicon is applied INSIDE it
 * too (review round 1: names in explicit lines never reached the lexicon, so "AlphaGo" and "Alpha Go" were read
 * two ways). Tokens that are already respelled (not lexicon keys) pass through untouched. If the explicit text's
 * word count differs from the display words, `words` is null (word anchors then use the spoken words).
 */
export function speak(line, lex) {
  const text = String(line.text ?? '');
  if (line.spoken != null && String(line.spoken).trim()) {
    const base = sanitizeSpoken(line.spoken);
    const lexed = applyLexicon(base, lex, { exact: true }); // exact case only: a re-cased token is a deliberate respelling
    const dw = displayWords(text);
    const bw = displayWords(base);
    // display word i <-> explicit spoken word i (when the counts agree), then the lexicon's expansion of that word
    const words = dw.length === bw.length && lexed.words.length === bw.length ? dw.map((w, i) => ({ w, n: lexed.words[i].n })) : null;
    return { spoken: lexed.spoken, words, explicit: true };
  }
  return { ...applyLexicon(text, lex), explicit: false };
}

/** The lexicon pass over one string: -> { spoken, words: [{ w, n }] } (n = spoken words this word became). */
export function applyLexicon(text, lex, { exact = false } = {}) {
  const segs = stripTags(text).split(SEP);
  const out = [];
  const words = [];
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (!seg) continue;
    if (SEP.test(seg)) {
      out.push(seg);
      continue;
    }
    // multi-word lexicon keys: try the longest run of whitespace-separated segments first
    let done = false;
    for (let k = Math.min(lex?.maxWords ?? 1, 6); k >= 2 && !done; k--) {
      const idx = [];
      let j = i;
      while (idx.length < k && j < segs.length) {
        if (!segs[j]) {
          j++;
          continue;
        }
        if (SEP.test(segs[j])) {
          if (!/^\s+$/.test(segs[j])) break;
          j++;
          continue;
        }
        idx.push(j);
        j++;
      }
      if (idx.length < k) continue;
      const toks = idx.map((x) => segs[x]);
      const first = toks[0];
      const last = toks[k - 1];
      const lead = first.match(/^[^\p{L}\p{N}]*/u)[0];
      const trail = last.match(/[^\p{L}\p{N}]*$/u)[0];
      const key = toks.map(coreOf).join(' ');
      const rep = lookup(lex, key, exact);
      if (rep == null) continue;
      out.push(lead + rep + trail);
      const n = countSpokenWords(rep);
      toks.forEach((t, q) => {
        if (ALNUM.test(t)) words.push({ w: coreOf(t), n: q === 0 ? n : 0 });
      });
      i = idx[k - 1];
      done = true;
    }
    if (done) continue;
    if (!ALNUM.test(seg)) {
      out.push(seg);
      continue;
    }
    const core = coreOf(seg);
    const lead = seg.slice(0, seg.indexOf(core));
    const trail = seg.slice(seg.indexOf(core) + core.length);
    let rep = lookup(lex, core, exact);
    if (rep == null) {
      const poss = core.match(/^(.*?)(['’]s)$/);
      const r2 = poss && lookup(lex, poss[1], exact);
      if (r2 != null) rep = `${r2}'s`;
    }
    const spokenTok = rep ?? core;
    out.push(lead + spokenTok + trail);
    words.push({ w: core, n: rep == null ? 1 : countSpokenWords(spokenTok) });
  }
  return { spoken: sanitizeSpoken(out.join('')), words };
}

/**
 * Pack lines (already carrying `.spoken`) into chunks of at most `max` characters, joined by a blank
 * line so the model breathes between lines. Never splits a line; a single over-long line gets its
 * own chunk (the model limit is 10k on mlv2, so it is still valid).
 */
export function planChunks(lines, max = 1200) {
  const chunks = [];
  let cur = null;
  for (const l of lines) {
    const add = (cur && cur.lines.length ? 2 : 0) + l.spoken.length;
    // a solo line (tts.solo / tts.speed, or a line with no clean gap: narration/solo.json) gets its own request
    if (!cur || cur.len + add > max || l.solo || cur.solo) {
      cur = { lines: [], len: 0 };
      chunks.push(cur);
    }
    cur.len += (cur.lines.length ? 2 : 0) + l.spoken.length;
    cur.lines.push(l);
    if (l.solo) cur.solo = true;
  }
  for (const c of chunks) c.text = c.lines.map((l) => l.spoken).join('\n\n');
  return chunks;
}

function squashChars(chars) {
  const s = [];
  const idx = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (ALNUM.test(c)) {
      const lc = c.toLowerCase();
      for (const ch of lc) {
        s.push(ch);
        idx.push(i);
      }
    }
  }
  return { s: s.join(''), idx };
}
const squash = (str) => squashChars([...String(str)]).s;

/**
 * Per-line timings inside one synthesized chunk.
 * lines: [{ id, spoken, words: [{w,n}] | null }]; alignment: ElevenLabs { characters, character_start_times_seconds, character_end_times_seconds }.
 * Returns [{ id, matched, start, end, words: [{w, start, end}] }] in chunk seconds. Display words get
 * the span of the spoken words they map to; a display word that maps to 0 spoken words (the tail of a
 * multi-word lexicon key) shares its head's span.
 */
export function alignChunk(lines, alignment) {
  const { s: hay, idx } = squashChars(alignment.characters);
  const st = alignment.character_start_times_seconds;
  const en = alignment.character_end_times_seconds;
  let from = 0;
  return lines.map((l) => {
    const spokenWords = displayWords(l.spoken);
    const parts = spokenWords.map(squash);
    const needle = parts.join('');
    const at = needle ? hay.indexOf(needle, from) : -1;
    if (at < 0) return { id: l.id, matched: false, start: null, end: null, words: [] };
    from = at + needle.length;
    const sw = [];
    let p = at;
    let prevEnd = st[idx[at]];
    for (let k = 0; k < parts.length; k++) {
      const len = parts[k].length;
      if (!len) {
        sw.push({ w: spokenWords[k], start: prevEnd, end: prevEnd });
        continue;
      }
      const s = st[idx[p]];
      const e = en[idx[p + len - 1]];
      sw.push({ w: spokenWords[k], start: s, end: Math.max(e, s) });
      prevEnd = e;
      p += len;
    }
    const start = sw.length ? sw[0].start : st[idx[at]];
    const end = sw.length ? sw[sw.length - 1].end : en[idx[at + needle.length - 1]];
    let words = sw;
    if (l.words) {
      words = [];
      let q = 0;
      for (const d of l.words) {
        if (d.n === 0) {
          const head = words[words.length - 1] ?? sw[q] ?? sw[sw.length - 1];
          words.push({ w: d.w, start: head?.start ?? start, end: head?.end ?? start });
          continue;
        }
        const span = sw.slice(q, q + d.n);
        q += d.n;
        if (!span.length) {
          words.push({ w: d.w, start: end, end });
          continue;
        }
        words.push({ w: d.w, start: span[0].start, end: span[span.length - 1].end });
      }
    }
    return { id: l.id, matched: true, start, end, words };
  });
}

/** Display words as evenly paced synthetic timings (draft timelines before narration exists). */
export function draftWords(text, wpm = 110) {
  const words = displayWords(text);
  const per = 60 / wpm;
  const weights = words.map((w) => 0.55 + 0.45 * Math.min(2.5, w.length / 5));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const dur = Math.max(0.6, words.length * per);
  let t = 0;
  const out = words.map((w, i) => {
    const d = (weights[i] / total) * dur;
    const r = { w, start: +t.toFixed(4), end: +(t + d * 0.86).toFixed(4) };
    t += d;
    return r;
  });
  return { duration: +dur.toFixed(4), words: out };
}
