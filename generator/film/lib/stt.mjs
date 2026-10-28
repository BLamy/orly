// Speech-to-text round trips as DATA (narration/stt.json), so QA can gate on them.
//
//   sttTargets(script, lex)          -> [{ lineId, shot, terms: [{ term, accept: [...], from: 'lexicon'|'cast'|'qa' }] }]
//                                       every line where a lexicon entry fires (explicit spoken lines too), every
//                                       line naming a cast member (surname; matched leniently: spelling drift of
//                                       up to 25 % is accepted, a different word is not), or whose script line sets
//                                       qa.stt "required" (qa.expect lists terms that must come back)
//   matchTerms(transcript, terms)    -> [{ term, accept, found, near? }]   found = one accept form appears LITERALLY
//                                       (case/punctuation-blind; number words = digits). Review round 3: sound-alike
//                                       matching let "Ahmoudai" pass for Amodei, so a near spelling is only reported
//                                       (near: true) and never passes. A heard form a human has judged correct (RP
//                                       "Le Kun" for LeCun) goes in voice.json sttHeard {term: [forms]} and is accepted.
//   recordState(P, rec, take)        -> 'current' | 'stale-take' | 'stale-clip' | 'missing'  (a record is current only
//                                       while its lineSig equals the take's sig AND its sig equals the clip's sha)
//   wordErrorRate(ref, hyp)          -> 0..1 on normalised words (informational)
//   readStt(P) / writeStt(P, doc)    narration/stt.json { version, lines: { <lineId>: SttRecord } }
//   clipSig(P, rec)                  the current clip's signature (sha of the clip wav, 12 hex): a record is
//                                    current only while its sig equals this
//   transcribe(file, { model })      ElevenLabs speech-to-text (scribe_v1) -> { text, requestId, cost }
//
// SttRecord = { lineId, model, transcript, expectedTerms: [{term, accept, found}], pass, sig, lineSig, clip, wer, at }
// pass = every expected term came back. QA narration.stt passes only when every target line has a passing record
// whose sig matches its current clip; a stale or failing record fails.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson, fileSha } from './paths.mjs';
import { redact, secret } from './env.mjs';
import { displayWords } from './text.mjs';

export const STT_MODEL = 'scribe_v1';

const NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const TENS = new Set([20, 30, 40, 50, 60, 70, 80, 90]);

/** lowercase words, punctuation stripped, hyphens split, number words folded to digits ("nineteen sixty-nine" -> "1969",
 *  "Mark One" -> "mark 1", "Mark I" -> "mark i" (kept: a Roman numeral is also accepted via the written form)). */
export function normText(s) {
  const toks = String(s)
    .toLowerCase()
    .replace(/[‐-―-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  const out = [];
  let prevWordNum = null; // value of the previous token when it was a spelled number (for "nineteen sixty nine")
  for (let i = 0; i < toks.length; i++) {
    // "six hundred and eighty-nine" -> 689 (scribe writes such numbers as digits; without this a correct take of a
    // line with a spelled hundreds number failed its round trip on WER alone)
    if (toks[i] === 'hundred' && prevWordNum != null && prevWordNum >= 1 && prevWordNum < 10) {
      let v = prevWordNum * 100;
      let j = i + 1;
      if (toks[j] === 'and' && NUM[toks[j + 1]] != null && NUM[toks[j + 1]] > 0) j++;
      const r0 = NUM[toks[j]];
      if (r0 != null && r0 > 0 && r0 < 100) {
        let r = r0;
        if (TENS.has(r0) && NUM[toks[j + 1]] != null && NUM[toks[j + 1]] > 0 && NUM[toks[j + 1]] < 10) r += NUM[toks[++j]];
        v += r;
        i = j;
      }
      out[out.length - 1] = String(v);
      prevWordNum = null;
      continue;
    }
    const n = NUM[toks[i]];
    if (n == null) {
      out.push(toks[i]);
      prevWordNum = null;
      continue;
    }
    let v = n;
    if (TENS.has(n) && NUM[toks[i + 1]] != null && NUM[toks[i + 1]] > 0 && NUM[toks[i + 1]] < 10) v = n + NUM[toks[++i]]; // "sixty nine" -> 69
    if (prevWordNum != null && prevWordNum >= 10 && prevWordNum < 100 && v >= 10 && v < 100) {
      out[out.length - 1] = `${prevWordNum}${String(v).padStart(2, '0')}`; // a year said in pairs -> 1969
      prevWordNum = null;
      continue;
    }
    out.push(String(v));
    prevWordNum = v;
  }
  return out;
}

// a possessive or plural on the last word still counts ("Schmidhuber's" -> schmidhubers matches schmidhuber)
const containsSeq = (hay, needle) => {
  if (!needle.length) return false;
  const last = needle.length - 1;
  for (let i = 0; i + needle.length <= hay.length; i++) if (needle.every((w, k) => hay[i + k] === w || (k === last && hay[i + k] === `${w}s`))) return true;
  return false;
};

function firingEntries(text, lex) {
  const words = normText(text).join(' ');
  const out = [];
  for (const [k, v] of lex) {
    const key = normText(k).join(' ');
    if (key && ` ${words} `.includes(` ${key} `)) out.push({ term: k, spoken: v });
  }
  return out;
}

/** Proper names to listen for, from the script's cast list: each real person's surname (and full name), without
 *  the era qualifier: "Geoffrey Hinton (2000s–2020s)" -> { full: 'Geoffrey Hinton', last: 'Hinton' }. Roles
 *  ("Newspaper boy", "The detective's hands") are skipped: a name has at least two capitalised words. */
export function castNames(script) {
  const seen = new Map();
  for (const c of script.cast || []) {
    const full = String(c.name || '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/^(Sir|Dr\.?|Professor)\s+/i, '').trim();
    const toks = full.split(/\s+/).filter(Boolean);
    if (toks.length < 2 || !toks.every((t) => /^[A-Z\u00C0-\u017F]/.test(t) || /^[A-Z]\.$/.test(t))) continue;
    const last = toks[toks.length - 1];
    if (!seen.has(last)) seen.set(last, { full, last });
  }
  return [...seen.values()];
}

/** voice.json sttHeard: { term: [heard forms] } — forms a human judged to be the right pronunciation spelled
 *  another way by the transcriber (each needs a reason in voice.json sttHeardNotes). */
export const heardForms = (voiceCfg) => (voiceCfg && typeof voiceCfg.sttHeard === 'object' && voiceCfg.sttHeard) || {};

export function sttTargets(script, lex, { heard = {} } = {}) {
  const out = [];
  const names = castNames(script);
  const withHeard = (t) => (heard[t.term]?.length ? { ...t, accept: [...new Set([...t.accept, ...heard[t.term]])] } : t);
  for (const ch of script.chapters || [])
    for (const shot of ch.shots || [])
      for (const l of shot.lines || []) {
        // the lexicon fires on the written text, explicit spoken lines included (speak() applies it inside them)
        const terms = firingEntries(l.text, lex).map((e) => ({ term: e.term, accept: [...new Set([e.term, e.spoken])], from: 'lexicon', fuzzy: /^[A-Z][A-Za-z'-]*[a-z][A-Za-z'-]*(?: [A-Z][A-Za-z'-]+)*$/.test(e.term) && e.term.length >= 5 })); // names, not initialisms
        // every line that names a cast member (review round 1: names in explicit lines were never round-tripped)
        const words = ` ${normText(l.text).join(' ')} `;
        for (const n of names) {
          const key = normText(n.last).join(' ');
          if (!key || !words.includes(` ${key} `) && !words.includes(` ${key}s `)) continue;
          if (terms.some((x) => normText(x.term).join(' ').includes(key))) continue;
          const resp = lookupLex(lex, n.last);
          terms.push({ term: n.last, accept: [...new Set([n.last, ...(resp ? [resp] : [])])], from: 'cast', fuzzy: true });
        }
        const qa = l.qa || {};
        for (const t of qa.expect || []) if (!terms.some((x) => x.term === t)) terms.push({ term: t, accept: [t], from: 'qa', fuzzy: /^[A-Z][a-z]{4,}$/.test(t) });
        if (terms.length || qa.stt === 'required') out.push({ lineId: l.id, shot: shot.id, text: l.text, terms: terms.map(withHeard) });
      }
  return out;
}

const lookupLex = (lex, k) => (lex?.get ? lex.get(k) ?? lex.lower?.get(String(k).toLowerCase()) : undefined);

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** A rough sound key for names: c/k/q, z/s, ph/f, silent gh, non-rhotic r (an RP narrator's "Lenat" is heard as
 *  "Lennart"), vowels after the first letter dropped, doubles collapsed: lecun, la kun -> lkn; amodei, ahmadai -> amd. */
export function soundKey(w) {
  let s = String(w).toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return '';
  s = s.replace(/ph/g, 'f').replace(/gh/g, '').replace(/ck|q|c(?=[aoukrlt]|$)/g, 'k').replace(/c/g, 's').replace(/z/g, 's').replace(/x/g, 'ks').replace(/w(?=[^aeiou]|$)/g, '').replace(/h(?=[^aeiou]|$)/g, '').replace(/r(?=[^aeiouy]|$)/g, '');
  const head = s[0];
  const tail = s.slice(1).replace(/[aeiouyh]/g, '');
  return (head + tail).replace(/(.)\1+/g, '$1');
}

/** A name heard as a near spelling ("Hockreiter", "Le Cun", "Schmidhuber's", "Yan La Kun"): 1-3 consecutive
 *  transcript words, spaces dropped, within 25 % edits of a written/spoken form, or with the same sound key
 *  (names of 5+ letters only; keys of 3+). STT checks that a name was SAID recognisably; stress is a human's call. */
function fuzzyHas(hay, form) {
  const f = normText(form).join('');
  if (f.length < 5) return false;
  const fk = soundKey(f);
  for (let i = 0; i < hay.length; i++)
    for (let k = 1; k <= 3 && i + k <= hay.length; k++) {
      let g = hay.slice(i, i + k).join('');
      if (g.endsWith('s') && !f.endsWith('s')) g = g.slice(0, -1);
      if (lev(g, f) <= Math.floor(f.length * 0.25)) return true;
      if (fk.length >= 3 && soundKey(g) === fk) return true;
    }
  return false;
}

export function matchTerms(transcript, terms) {
  const hay = normText(transcript);
  return terms.map((t) => {
    const found = t.accept.some((f) => containsSeq(hay, normText(f)));
    const near = !found && t.accept.some((f) => fuzzyHas(hay, f));
    return { term: t.term, accept: t.accept, found, ...(near ? { near: true } : {}), ...(t.from ? { from: t.from } : {}) };
  });
}

/** a record is current only while it transcribes the CURRENT take (lineSig = the take's sig in lines.json) of the
 *  current clip file (sig = the clip's sha). Review round 3: L1517's record still held the old text's transcript. */
export function recordState(P, rec, take) {
  if (!rec) return 'missing';
  if (!take) return 'stale-take';
  if ((rec.lineSig ?? null) !== (take.sig ?? null)) return 'stale-take';
  if (rec.sig !== clipSig(P, take)) return 'stale-clip';
  return 'current';
}

/** WER above this on a line with no expected terms fails its round trip (the take does not say the current text) */
export const WER_FAIL = 0.5;
/** pass rule for one record: every expected term found literally; a line without terms must match its text */
export const recordPass = (transcript, expectedTerms, wer) => !!transcript && expectedTerms.every((x) => x.found) && (expectedTerms.length || wer <= WER_FAIL);

export function wordErrorRate(ref, hyp) {
  const r = normText(displayWords(ref).join(' '));
  const h = normText(hyp);
  const d = Array.from({ length: r.length + 1 }, (_, i) => [i, ...new Array(h.length).fill(0)]);
  for (let j = 1; j <= h.length; j++) d[0][j] = j;
  for (let i = 1; i <= r.length; i++)
    for (let j = 1; j <= h.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1));
  return r.length ? +(d[r.length][h.length] / r.length).toFixed(3) : 0;
}

export const sttPath = (P) => path.join(P.narration.dir, 'stt.json');
export const readStt = (P) => readJson(sttPath(P), { version: 1, lines: {} });
export const writeStt = (P, doc) => writeJson(sttPath(P), doc);

export function clipSig(P, rec) {
  if (!rec?.clip) return null;
  return fileSha(path.resolve(P.dir, rec.clip), 12);
}

export async function transcribe(file, { model = STT_MODEL, retries = 3 } = {}) {
  const url = 'https://api.elevenlabs.io/v1/speech-to-text';
  for (let attempt = 0; ; attempt++) {
    const form = new FormData();
    form.append('model_id', model);
    form.append('tag_audio_events', 'false');
    form.append('language_code', 'en');
    form.append('file', new Blob([fs.readFileSync(file)], { type: 'audio/wav' }), path.basename(file));
    let res;
    try {
      res = await fetch(url, { method: 'POST', headers: { 'xi-api-key': secret('ELEVENLABS_API_KEY') }, body: form });
    } catch (e) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
        continue;
      }
      throw new Error(`ElevenLabs STT network error: ${redact(e.message)}`);
    }
    if (res.ok) {
      const j = await res.json();
      return { text: String(j.text ?? '').trim(), requestId: res.headers.get('request-id'), cost: Number(res.headers.get('character-cost') ?? NaN), language: j.language_code ?? null };
    }
    const text = redact((await res.text()).slice(0, 400));
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await new Promise((r) => setTimeout(r, 2500 * 2 ** attempt));
      continue;
    }
    throw new Error(`ElevenLabs STT ${res.status}: ${text}`);
  }
}

/**
 * Round-trip every STT target line whose record is missing, stale (clip changed), or failing — or all of
 * `lines` with force. Returns { checked: [ids], records, skipped: [ids current], errors: [msg] }.
 * Spend goes in narration/ledger.json as kind 'stt' (cost from the character-cost header: about 0.37 credits per
 * second of clip, 2 for L0104's 6.5 s and 6 for L0108's 16.5 s on 2026-10-06). Never throws for one line's API error: it is returned in errors.
 */
export async function refreshStt(P, { script, lex, linesDoc, voiceSig, only = [], also = [], heard, force = false, dryRun = false, log = console.log } = {}) {
  const doc = readStt(P);
  const want = new Set(only);
  heard = heard ?? heardForms(readJson(P.voice, {}));
  const all = sttTargets(script, lex, { heard });
  const targets = all.filter((t) => !want.size || want.has(t.lineId));
  // review round 3: every line RE-NARRATED in a fix round is transcribed too, not only name targets (its pass
  // rule is the word error rate against its current text)
  const byId = new Map();
  for (const ch of script.chapters || []) for (const shot of ch.shots || []) for (const l of shot.lines || []) byId.set(l.id, { lineId: l.id, shot: shot.id, text: l.text, terms: [] });
  for (const id of also) if (!targets.some((t) => t.lineId === id) && byId.has(id)) targets.push(all.find((t) => t.lineId === id) || byId.get(id));
  const checked = [];
  const skipped = [];
  const errors = [];
  for (const t of targets) {
    const rec = linesDoc?.lines?.[t.lineId];
    if (!rec) {
      errors.push(`${t.lineId}: not narrated`);
      continue;
    }
    const sig = clipSig(P, rec);
    const old = doc.lines[t.lineId];
    // current = same take (lineSig) and same clip (sig): re-judge it under today's rules without paying again
    if (!force && old && recordState(P, old, rec) === 'current' && old.transcript) {
      old.expectedTerms = matchTerms(old.transcript, t.terms);
      old.pass = recordPass(old.transcript, old.expectedTerms, old.wer ?? 0);
      if (old.pass) {
        skipped.push(t.lineId);
        continue;
      }
      if (!t.terms.length || old.expectedTerms.some((x) => !x.found)) {
        // the same clip transcribes the same way: re-paying cannot change the verdict; a re-take (or a human's
        // sttHeard entry) must
        skipped.push(t.lineId);
        continue;
      }
    }
    if (old && recordState(P, old, rec) === 'stale-take') log(`  stt ${t.lineId}: record transcribes an older take (lineSig ${old.lineSig} vs ${rec.sig}): re-transcribing`);
    const file = path.resolve(P.dir, rec.clip);
    if (dryRun) {
      log(`  stt ${t.lineId}: would transcribe ${rec.clip} (${rec.duration}s; expect ${t.terms.map((x) => x.term).join(', ') || 'no terms'})`);
      checked.push(t.lineId);
      continue;
    }
    try {
      const r = await transcribe(file);
      const expectedTerms = matchTerms(r.text, t.terms);
      const wer = wordErrorRate(rec.spoken ?? t.text, r.text);
      const pass = recordPass(r.text, expectedTerms, wer);
      doc.lines[t.lineId] = {
        lineId: t.lineId,
        model: STT_MODEL,
        transcript: r.text,
        expectedTerms,
        pass,
        sig,
        lineSig: rec.sig ?? voiceSig ?? null,
        clip: rec.clip,
        wer,
        ...(t.terms.length ? {} : { scope: 'renarrated' }),
        requestId: r.requestId,
        at: new Date().toISOString(),
      };
      const rows = readJson(P.narration.spend, []);
      writeJson(P.narration.spend, [...rows, { at: doc.lines[t.lineId].at, kind: 'stt', key: `stt-${t.lineId}-${sig}`, shot: t.shot, seconds: rec.duration, cost: Number.isFinite(r.cost) ? r.cost : null, estimate: Math.max(1, Math.ceil(rec.duration * 0.37)), requestId: r.requestId, model: STT_MODEL }]);
      checked.push(t.lineId);
      log(`  stt ${t.lineId}: ${pass ? 'PASS' : 'FAIL'} "${r.text}" (${expectedTerms.map((x) => `${x.term} ${x.found ? 'ok' : 'MISSING'}`).join(', ')})`);
    } catch (e) {
      errors.push(`${t.lineId}: ${redact(e.message)}`);
    }
  }
  if (!dryRun && (checked.length || skipped.length)) {
    doc.updatedAt = new Date().toISOString();
    writeStt(P, doc);
  }
  return { checked, skipped, errors, records: doc.lines, targets: targets.map((t) => t.lineId) };
}
