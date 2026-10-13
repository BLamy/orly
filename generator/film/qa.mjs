#!/usr/bin/env node
// Automated QA — the machine half of the excellence gate (ARCHITECTURE §3, §8). Reviewers read the report.
//
//   npm run film:qa -- --slug <slug> [--stage narration,timeline,score,mix,render,sheets,publish] [--json]
//
// Checks (status pass | warn | fail | skip):
//   narration  every script line narrated with the current text/lexicon/voice (sig), aligned exactly;
//              pacing (wpm per shot and line; a line over 200 wpm FAILS unless qa.pace "staccato"); clip edges (every cut
//              between two lines of a take: raw edge peak FAILS above -45 dBFS, warns above -50); stem loudness; stt (every
//              line where a lexicon entry fires or a cast member is named has a passing narration/stt.json record for its
//              current clip, else fail);
//              listening (voice.json human stress sign-offs: warn while pending or stale, fail on reject).
//   timeline   exists and is not a draft; app copy identical; lines/shots match the script; shot boundaries
//              on whole frames; beats inside their shots; runtime vs runtimeTargetSec (and runtimeCeilingSec: fail over it).
//   score      every cue rendered, render length exact (body + tail), window inside the film, cue true peak,
//              render newer than its .strudel source; music coverage; analysisSummary (score/analysis/summary.json
//              is current: a row per cue whose cueSeconds equals the cue's window in cues.json, and its
//              timelineSeconds stamp equals the timeline duration, both within one frame; fail when stale).
//   score      also cueJoins: a cue change (fade-out + fade-in) never overlaps narration, and the incoming cue sounds
//              alone >= 1.5 s before the next line (warn).
//   mix        master -16 ±0.5 LUFS, TP ≤ -1.5 (+0.1), length = film, duck depth vs its target (ceiling: warn > ±1.5 dB, fail > +3 dB), master limiter ≤ 1.5 dB (warn),
//              stem limiter ≤ 1 dB, chapter slices < 25 MiB, line levels (review round 2: each line's gated loudness vs
//              the median of the other lines, measured on the stem: warn when it sits more than 1.5 dB from where
//              lineLufs + its level hint wants it, or when |levelDb| > 1.5 stacks on the ride; fail beyond 3 dB or when a
//              requested hint/offset misses by more than 1.5 dB), linePeaks (warn when a line's loudest momentary
//              window in the master exceeds the narration's p95 by more than 2 dB), foley (≤ 10 events, each in a gap or
//              under its line's last words, -28..-32 LUFS short-term), swells (music-only moments trimmed), a fading
//              cue's fade starting ≥ 1.6 s after its lastStrike,
//              floor (room tone: the quietest 400 ms window > -70 LUFS, never digital zero), musicEq, lineMasking (each
//              line's voice vs music in its own window: fail < 6 dB, warn < 10 dB), master newer than its inputs.
//   render     film.mp4 frame count = round(duration × fps), 1920×1080, A/V within one frame, captions +
//              chapters present, newer than master/timeline.
//   sheets     a contact sheet per shot, newer than the timeline; cards (qa/cards/summary.json from cards.mjs: a probed
//              paper card blank for > 0.3 s fails, unprobed suspect paper and unaudited shots warn); ghostText (same
//              audit, review round 4: two different text layers overlapping while both are > 25 % opaque for > 0.25 s fail).
//   publish    manifest (if published) is format 3, kind film, every referenced file exists and is < 25 MiB;
//              warns when the shelf copy is stale (runtime ≠ timeline, or older than the master).
// Writes qa/reports/qa-<time>.json and qa/reports/latest.json; film.json stages.qa. Exit 1 on any fail.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, list, helpText } from './lib/args.mjs';
import { ROOT, filmPaths, readJson, writeJson, rel, resolveIn } from './lib/paths.mjs';
import { updateStage } from './lib/ledger.mjs';
import { speak, displayWords } from './lib/text.mjs';
import { loadLexicon, lineSig } from './lib/voicecfg.mjs';
import { videoInfo } from './lib/ffmpeg.mjs';
import { readWav } from './lib/wav.mjs';
import { cueContext, auditBody, splitNotes } from './lib/cuenotes.mjs';
import { sttTargets, readStt, clipSig, STT_MODEL, heardForms, recordState, matchTerms, recordPass } from './lib/stt.mjs';
import { spanLoudness, levelOffsets, lineSpans, LEVEL_TOLERANCE_DB, LEVEL_WARN_DB, LEVEL_FAIL_DB, levelHintDb, intendedDb } from './lib/levels.mjs';
import { edgePeaks, isCutEdge, EDGE_DB, EDGE_FAIL_DB } from './lib/split.mjs';

const a = parseArgs(process.argv.slice(2), { boolean: ['json', 'help'], string: ['slug', 'dir', 'stage'] });
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const STAGES = list(a.stage);
const checks = [];
const add = (stage, id, status, detail, extra = {}) => checks.push({ stage, id, status, detail, ...extra });
const mtime = (f) => (fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0);
const want = (s) => !STAGES.length || STAGES.includes(s);
const MAX_SLICE = 25 * 1024 * 1024;

const script = readJson(P.script, null);
const timeline = readJson(P.narration.timeline, null);
const scriptLines = [];
if (script) for (const ch of script.chapters || []) for (const s of ch.shots || []) for (const l of s.lines || []) scriptLines.push({ ...l, shot: s.id });

function qaNarration() {
  const doc = readJson(P.narration.lines, null);
  if (!script) return add('narration', 'script', 'fail', `missing ${rel(P.script)}`);
  if (!doc) return add('narration', 'lines', 'fail', 'no narration/lines.json — run film:narrate');
  const lex = loadLexicon(P);
  const missing = [];
  const stale = [];
  for (const l of scriptLines) {
    const r = doc.lines[l.id];
    if (!r) missing.push(l.id);
    else if (doc.voice && r.sig !== lineSig(doc.voice, speak(l, lex).spoken, l.tts)) stale.push(l.id);
  }
  add('narration', 'coverage', missing.length || stale.length ? 'fail' : 'pass', missing.length || stale.length ? `missing ${missing.length} (${missing.slice(0, 8).join(',')}), stale ${stale.length} (${stale.slice(0, 8).join(',')})` : `${scriptLines.length} lines narrated and current`, { missing, stale });
  const spokenW = doc.lines ? Object.values(doc.lines).filter((r) => r.wordsFrom === 'spoken').map((r) => r.text.slice(0, 40)) : [];
  if (spokenW.length) add('narration', 'wordMap', 'warn', `${spokenW.length} lines anchor on spoken words (explicit spoken text with a different word count)`);
  // pacing: a line over 200 wpm fails unless the script marks it a deliberate staccato (line field qa.pace
  // "staccato"); 185-200 warns (review round 1: the warn list carried the rushed prologue for a whole round)
  const perShot = {};
  const fast = [];
  const tooFast = [];
  const slow = [];
  for (const l of scriptLines) {
    const r = doc.lines[l.id];
    if (!r) continue;
    const words = displayWords(r.spoken).length;
    const sec = r.speechEnd - r.speechStart;
    const wpm = (words / sec) * 60;
    if (words >= 6 && wpm > 200 && l.qa?.pace !== 'staccato') tooFast.push(`${l.id} ${wpm.toFixed(0)}`);
    else if (words >= 6 && wpm > 185) fast.push(`${l.id} ${wpm.toFixed(0)}`);
    if (words >= 6 && wpm < 70) slow.push(`${l.id} ${wpm.toFixed(0)}`);
    const s = (perShot[l.shot] ??= { words: 0, sec: 0 });
    s.words += words;
    s.sec += sec;
  }
  const tot = Object.values(perShot).reduce((q, s) => ({ words: q.words + s.words, sec: q.sec + s.sec }), { words: 0, sec: 0 });
  const wpm = tot.sec ? (tot.words / tot.sec) * 60 : 0;
  add('narration', 'pacing', tooFast.length ? 'fail' : fast.length || slow.length || wpm < 95 || wpm > 160 ? 'warn' : 'pass', `${wpm.toFixed(0)} wpm overall${tooFast.length ? `; OVER 200 wpm (re-narrate slower, e.g. script line tts {solo, speed: 0.88}): ${tooFast.join(', ')}` : ''}${fast.length ? `; fast: ${fast.slice(0, 8).join(', ')}` : ''}${slow.length ? `; slow: ${slow.slice(0, 6).join(', ')}` : ''}`, {
    wpm: +wpm.toFixed(1),
    tooFast,
    fast,
    perShot: Object.fromEntries(Object.entries(perShot).map(([k, s]) => [k, +((s.words / s.sec) * 60).toFixed(1)])),
  });
  // clip edges (lib/split.mjs): every CUT between two lines of one take must sit in silence: the raw peak of the
  // clip's outer 20 ms (after any digital pre-roll) fails above -45 dBFS and warns above -50 (a loud cut = a ghost
  // syllable of the neighbouring line or a clipped word). A take's own start/end is not a cut: it only must not
  // carry sound the alignment does not own (film:narrate re-generates such a line on its own: narration/solo.json).
  const loud = [];
  const warmEdges = [];
  const dirty = [];
  let cuts = 0;
  for (const l of scriptLines) {
    const r = doc.lines[l.id];
    if (!r) continue;
    const f = path.resolve(P.dir, r.clip);
    if (!fs.existsSync(f)) continue;
    const { channels, sampleRate } = readWav(f);
    const e = edgePeaks(channels[0], sampleRate);
    const kinds = { head: r.cut?.head ?? 'gap', tail: r.cut?.tail ?? 'gap' }; // unknown (pre-split) clips count as cuts
    for (const side of ['head', 'tail']) {
      if (!isCutEdge(kinds[side])) continue;
      cuts++;
      if (e[side] > EDGE_FAIL_DB) loud.push(`${l.id} ${side} ${e[side]} dBFS`);
      else if (e[side] > EDGE_DB) warmEdges.push(`${l.id} ${side} ${e[side]} dBFS`);
    }
    if (r.cut && r.cut.clean === false) dirty.push(l.id);
  }
  add('narration', 'clipEdges', loud.length || dirty.length ? 'fail' : warmEdges.length ? 'warn' : 'pass', loud.length || dirty.length ? `loud cut edges (> ${EDGE_FAIL_DB} dBFS: a ghost syllable or a clipped word): ${loud.slice(0, 10).join(', ')}${dirty.length ? `; unclean take edges (re-generate on its own): ${dirty.join(', ')}` : ''}` : warmEdges.length ? `cut edges between ${EDGE_FAIL_DB} and ${EDGE_DB} dBFS: ${warmEdges.slice(0, 10).join(', ')}` : `all ${cuts} cut edges under ${EDGE_DB} dBFS`, { loud, warm: warmEdges, dirty });
  const stem = readJson(P.narration.stem, null);
  if (stem) add('narration', 'stem', Math.abs(stem.integrated - stem.target) <= 1 && stem.truePeak <= -1 && (stem.limitedDb ?? 0) <= 1 ? 'pass' : 'warn', `stem ${stem.integrated} LUFS (target ${stem.target}), TP ${stem.truePeak} dBTP, limiter ${stem.limitedDb ?? 0} dB${stem.compressor ? `, compressor ${stem.compressor.grDb} dB GR, line rides ≤ ${Math.max(0, ...Object.values(stem.rides || {}).map((r) => Math.abs(r.rideDb))).toFixed(1)} dB` : ''}`);
  // STT as data (film:stt → narration/stt.json): every line where a lexicon entry fires (or qa.stt is required)
  // needs a passing round trip whose sig matches its CURRENT clip; a missing, stale or failing record fails
  // review round 3: a record is current only while it transcribes the CURRENT take (lineSig) of the current clip
  // (sig); terms are re-judged here under today's literal rule (no sound-alikes), and a stale record of ANY line
  // (a re-narrated line that is not a name target too) fails
  const heard = heardForms(readJson(P.voice, {}));
  const targets = sttTargets(script, lex, { heard });
  if (!targets.length) add('narration', 'stt', 'pass', 'no line needs an STT round trip (no lexicon entry fires, no qa.stt)');
  else {
    const stt = readStt(P);
    const bad = [];
    const good = [];
    const tIds = new Set(targets.map((t) => t.lineId));
    for (const t of targets) {
      const rec = stt.lines[t.lineId];
      const take = doc.lines[t.lineId];
      const state = recordState(P, rec, take);
      if (state === 'missing') bad.push(`${t.lineId}: no record`);
      else if (state === 'stale-take') bad.push(`${t.lineId}: STALE (record transcribes take ${rec.lineSig}, current take ${take?.sig}: "${rec.transcript}")`);
      else if (state === 'stale-clip') bad.push(`${t.lineId}: stale (record for clip ${rec.sig}, current clip ${clipSig(P, take)})`);
      else {
        const terms = matchTerms(rec.transcript, t.terms);
        const miss = terms.filter((x) => !x.found);
        if (miss.length) bad.push(`${t.lineId}: ${miss.map((x) => `${x.term}${x.near ? ' (only a near spelling)' : ''}`).join(', ')} not heard literally in "${rec.transcript}" (accept ${miss.map((x) => x.accept.join('/')).join('; ')})`);
        else good.push(`${t.lineId} (${terms.map((x) => x.term).join(', ')})`);
      }
    }
    // records of re-narrated lines that are not name targets: stale or off-text records fail too
    for (const [id, rec] of Object.entries(stt.lines || {})) {
      if (tIds.has(id) || !doc.lines[id]) continue;
      const state = recordState(P, rec, doc.lines[id]);
      if (state !== 'current') bad.push(`${id}: ${state} record (re-narrated line; re-run film:stt --lines ${id})`);
      else if (!recordPass(rec.transcript, [], rec.wer ?? 1)) bad.push(`${id}: transcript does not match the current text (WER ${rec.wer}): "${rec.transcript}"`);
      else good.push(`${id} (re-take, WER ${rec.wer})`);
    }
    add('narration', 'stt', bad.length ? 'fail' : 'pass', bad.length ? `${bad.join('; ')} — run film:stt --slug ${a.slug}` : `${good.length} lines round-tripped on the current takes (${STT_MODEL}; terms heard literally): ${good.join('; ')}`, { targets: targets.map((t) => t.lineId), bad });
  }
  // the human half: stress can only be judged by ear (voice.json listening[], film:voice signoff)
  const voiceCfg = readJson(P.voice, {});
  const ls = voiceCfg.listening || [];
  if (ls.length) {
    const rej = ls.filter((e) => e.status === 'reject');
    const pend = ls.filter((e) => e.status !== 'ok' && e.status !== 'reject');
    const stale = ls.filter((e) => e.status === 'ok' && e.clipSig !== clipSig(P, doc.lines[e.line]));
    add('narration', 'listening', rej.length ? 'fail' : pend.length || stale.length ? 'warn' : 'pass',
      ls.map((e) => `${e.term} ${e.status === 'ok' && stale.includes(e) ? 'STALE (clip changed since sign-off)' : e.status}${e.by ? ` (${e.by})` : ''}`).join('; ') + (pend.length || stale.length ? ` — a human listens and runs film:voice signoff --slug ${a.slug} --term <term> --by <name>` : ''));
  }
}

function qaTimeline() {
  if (!timeline) return add('timeline', 'exists', 'fail', 'no narration/timeline.json — run film:timeline');
  add('timeline', 'draft', timeline.draft ? 'fail' : 'pass', timeline.draft ? 'timeline is a DRAFT (synthetic timings)' : 'locked from narration');
  const app = fs.existsSync(P.app.timeline) ? fs.readFileSync(P.app.timeline, 'utf8') : null;
  add('timeline', 'appCopy', app && app === fs.readFileSync(P.narration.timeline, 'utf8') ? 'pass' : 'fail', app ? 'app copy identical' : `missing ${rel(P.app.timeline)}`);
  if (script) {
    const tIds = timeline.shots.flatMap((s) => s.lines.map((l) => l.id)).join(',');
    const sIds = scriptLines.map((l) => l.id).join(',');
    add('timeline', 'matchesScript', tIds === sIds ? 'pass' : 'fail', tIds === sIds ? 'lines match script.json' : 'timeline lines differ from script.json — re-run film:timeline');
    // review round 3: after line re-takes the clock must be rebuilt BEFORE assemble. Fails when a line's text or
    // take changed after timeline.json was built (script text differs, or lines.json holds a newer take than the
    // clock's line duration says); a script.json that was only touched (same text) passes with a note.
    const tLines = new Map(timeline.shots.flatMap((s) => s.lines.map((l) => [l.id, l])));
    const textDiff = scriptLines.filter((l) => tLines.has(l.id) && tLines.get(l.id).text !== l.text).map((l) => l.id);
    const takes = readJson(P.narration.lines, { lines: {} }).lines || {};
    // a line spans speechStart..speechEnd of its take on the clock: a re-take with another length shows here
    const takeDiff = Object.entries(takes).filter(([id, r]) => tLines.has(id) && Number.isFinite(r.speechEnd) && Math.abs(tLines.get(id).end - tLines.get(id).start - (r.speechEnd - r.speechStart)) > 0.002).map(([id]) => id);
    const newerTakes = mtime(P.narration.lines) > mtime(P.narration.timeline);
    const touched = mtime(P.script) > mtime(P.narration.timeline);
    if (textDiff.length || takeDiff.length) add('timeline', 'fresh', 'fail', `the clock predates the current lines (${[...textDiff.map((id) => `${id} text`), ...takeDiff.map((id) => `${id} take`)].slice(0, 12).join(', ')}) — run film:timeline, re-fit shot anchors, re-mix`);
    else if (newerTakes) add('timeline', 'fresh', 'fail', 'narration/lines.json is newer than timeline.json (re-takes not laid on the clock) — run film:timeline');
    else add('timeline', 'fresh', 'pass', touched ? 'script.json was touched after timeline.json, but every line text matches the clock' : 'timeline.json is newer than script.json and lines.json');
  }
  const fps = timeline.fps;
  const offFrame = timeline.shots.filter((s) => Math.abs(s.start * fps - Math.round(s.start * fps)) > 1e-3 || Math.abs(s.end * fps - Math.round(s.end * fps)) > 1e-3).map((s) => s.id);
  let gaps = 0;
  timeline.shots.forEach((s, i) => {
    if (i && Math.abs(s.start - timeline.shots[i - 1].end) > 1e-4) gaps++;
  });
  add('timeline', 'frames', offFrame.length || gaps ? 'fail' : 'pass', offFrame.length || gaps ? `off-frame shots: ${offFrame.join(',')}; gaps ${gaps}` : 'shots contiguous, on whole frames');
  const badBeats = timeline.shots.flatMap((s) => Object.entries(s.beats).filter(([, t]) => t < 0 || t > s.end - s.start).map(([b]) => `${s.id}:${b}`));
  add('timeline', 'beats', badBeats.length ? 'warn' : 'pass', badBeats.length ? `beats outside their shot: ${badBeats.join(', ')}` : `${timeline.shots.reduce((q, s) => q + Object.keys(s.beats).length, 0)} beats inside their shots`);
  if (script?.runtimeTargetSec) {
    const r = timeline.duration / script.runtimeTargetSec;
    add('timeline', 'runtime', r < 0.85 || r > 1.15 ? 'warn' : 'pass', `${(timeline.duration / 60).toFixed(1)} min vs target ${(script.runtimeTargetSec / 60).toFixed(1)} min (${(r * 100).toFixed(0)}%)`);
  }
  if (script?.runtimeCeilingSec) {
    const c = script.runtimeCeilingSec;
    add('timeline', 'ceiling', timeline.duration > c ? 'fail' : 'pass', `${timeline.duration.toFixed(2)} s vs ceiling ${c} s (story/meta.json runtimeCeilingSec)`);
  }
}

function qaScore() {
  if (!fs.existsSync(P.score.cues)) return add('score', 'cues', 'skip', 'no score/cues.json');
  const j = readJson(P.score.cues);
  const cues = Array.isArray(j) ? j : j.cues || [];
  const D = timeline?.duration ?? Infinity;
  const problems = [];
  const warns = [];
  for (const c of cues) {
    const wav = resolveIn(P, c.render || `score/renders/${c.id}.wav`);
    const src = resolveIn(P, c.file || `score/cues/${c.id}.strudel`);
    if (!fs.existsSync(wav)) {
      problems.push(`${c.id}: not rendered`);
      continue;
    }
    if (mtime(src) > mtime(wav)) warns.push(`${c.id}: source newer than render`);
    if (c.start < 0 || c.end > D + 1e-3 || c.end <= c.start) problems.push(`${c.id}: window ${c.start}..${c.end} outside 0..${D}`);
    const an = readJson(path.join(P.score.analysis, `${c.id}.json`), null);
    if (!an) warns.push(`${c.id}: not analysed (film:score analyze)`);
    else {
      if (an.lengthOk === false) problems.push(`${c.id}: render length off by ${an.lengthErrorMs} ms`);
      if (an.TP > -1) warns.push(`${c.id}: true peak ${an.TP} dBTP`);
      const meta = readJson(wav.replace(/\.wav$/, '.json'), null);
      const fatal = (meta?.errors || []).filter((e) => /soundfont zone|\[webaudio\] error|sample not found|could not load/i.test(e));
      if (fatal.length) problems.push(`${c.id}: render dropped notes (${fatal[0].replace(/%c/g, '').replace(/\s*(background-)?color:.*$/, '').trim().slice(0, 90)}) — fix and re-render`);
      if (meta && Math.abs(meta.bodySeconds - (c.end - c.start)) > 0.005) problems.push(`${c.id}: rendered body ${meta.bodySeconds}s but cue window is ${(c.end - c.start).toFixed(3)}s — re-render`);
    }
  }
  add('score', 'renders', problems.length ? 'fail' : warns.length ? 'warn' : 'pass', [...problems, ...warns].slice(0, 12).join('; ') || `${cues.length} cues rendered at exact length`, { problems, warns });
  qaScoreSummary(cues, D);
  qaCueJoins(cues);
  // review round 3: cue-note BODIES must not carry absolute times that contradict the current clock (the CURRENT
  // CLOCK paragraph is the only time authority); fix with film cue-notes --fix (re-maps anchors, strips the rest)
  if (timeline) {
    const bad = [];
    for (const c of cues) {
      const { body } = splitNotes(c.notes);
      if (!body) continue;
      const r = auditBody(body, cueContext(c, timeline));
      if (r.stale.length || r.bare.length) bad.push(`${c.id}: ${r.stale.length} stale anchored${r.stale.length ? ` (e.g. '${r.stale[0].anchor}' ${r.stale[0].at} vs ${r.stale[0].now})` : ''}, ${r.bare.length} bare`);
    }
    add('score', 'notesClock', bad.length ? 'warn' : 'pass', bad.length ? `${bad.join('; ')} — run node generator/film/cue-notes.mjs --slug ${a.slug} --fix` : 'every cue-note body is on the current clock (anchored times match their anchors; no bare absolute times)');
  }
  const music = cues.reduce((s, c) => s + (c.end - c.start), 0);
  if (Number.isFinite(D)) add('score', 'coverage', 'pass', `${(music / 60).toFixed(1)} min of music over ${(D / 60).toFixed(1)} min (${((music / D) * 100).toFixed(0)}%)`);
}

/** Cue changes sound in the clear (review round 1: 17 of 20 crossfades sat under a chapter's first line). A join is
 *  the outgoing cue's fade-out plus the incoming cue's fade-in (or their overlap): it must not overlap narration
 *  (fail), and the incoming cue should have >= 1.5 s alone before the next line (warn). */
function qaCueJoins(cues) {
  if (!timeline || timeline.draft) return;
  const spans = lineSpans(timeline);
  const sorted = [...cues].sort((x, y) => x.start - y.start);
  const under = [];
  const tight = [];
  const ok = [];
  for (let i = 1; i < sorted.length; i++) {
    const p = sorted[i - 1];
    const n = sorted[i];
    const a0 = Math.min(n.start, p.end - (p.fadeOut || 0));
    const a1 = Math.max(p.end, n.start + (n.fadeIn || 0));
    const hit = spans.filter((sp) => sp.a < a1 && sp.b > a0);
    const next = spans.find((sp) => sp.a >= a1 - 1e-6);
    const clear = next ? next.a - a1 : Infinity;
    const tag = `${p.id}→${n.id} ${a0.toFixed(2)}–${a1.toFixed(2)} s`;
    if (hit.length) under.push(`${tag} under ${hit.map((h) => h.id).join(',')}`);
    else if (clear < 1.5) tight.push(`${tag}: ${clear.toFixed(2)} s before ${next.id}`);
    else ok.push(tag);
  }
  add('score', 'cueJoins', under.length ? 'fail' : tight.length ? 'warn' : 'pass', under.length ? `cue changes under narration (move the incoming cue earlier, or the clock needs a head-hold): ${under.join('; ')}${tight.length ? `; tight: ${tight.join('; ')}` : ''}` : tight.length ? `incoming cue sounds alone for under 1.5 s: ${tight.join('; ')}` : `${ok.length} cue changes, each in the clear before the next line`, { under, tight });
}

/** score/analysis/summary.json must describe the CURRENT cues on the CURRENT clock (review round 4: it kept
 * reporting the 65.83 s clock after the cue was re-fitted to 67.75 s; reviewers read it) */
function qaScoreSummary(cues, D) {
  const file = path.join(P.score.analysis, 'summary.json');
  const sum = readJson(file, null);
  if (!cues.length) return;
  if (!sum) return add('score', 'analysisSummary', 'fail', `missing ${rel(file)}: run film:score analyze --slug ${a.slug}`);
  const frame = 1 / (timeline?.fps || 24) + 1e-6;
  const bad = [];
  const rows = new Map((sum.cues || []).map((r) => [r.id, r]));
  for (const c of cues) {
    const r = rows.get(c.id);
    const want = c.end - c.start;
    if (!r || r.error) bad.push(`${c.id}: ${r?.error || 'no row'}`);
    else if (!(Math.abs((r.cueSeconds ?? NaN) - want) <= frame)) bad.push(`${c.id}: cueSeconds ${r.cueSeconds} vs window ${want.toFixed(3)} s`);
  }
  for (const id of rows.keys()) if (!cues.some((c) => c.id === id)) bad.push(`${id}: not in cues.json`);
  if (Number.isFinite(D)) {
    if (sum.timelineSeconds == null) bad.push(`no timelineSeconds stamp (written before the clock stamp)`);
    else if (Math.abs(sum.timelineSeconds - D) > frame) bad.push(`measured on a ${sum.timelineSeconds} s clock, timeline is ${D} s`);
    // a cue that spans the whole film must measure the whole film
    for (const c of cues) {
      const r = rows.get(c.id);
      if (r && !r.error && c.start <= frame && Math.abs(c.end - D) <= frame && !(Math.abs(r.cueSeconds - D) <= frame)) bad.push(`${c.id}: spans the film but cueSeconds ${r.cueSeconds} ≠ ${D} s`);
    }
  }
  add('score', 'analysisSummary', bad.length ? 'fail' : 'pass', bad.length ? `${rel(file)} is stale (${bad.slice(0, 6).join('; ')}): re-run film:score analyze --slug ${a.slug}` : `summary current: ${cues.length} cue(s) on the ${Number.isFinite(D) ? D : '?'} s clock`, { problems: bad });
}

function qaMix() {
  const L = readJson(P.mix.loudness, null);
  if (!L) return add('mix', 'master', 'fail', 'no mix/loudness.json — run film:mix');
  const m = L.master;
  add('mix', 'loudness', Math.abs(m.I - L.target.I) <= 0.5 ? 'pass' : 'fail', `${m.I} LUFS (target ${L.target.I}), LRA ${m.LRA}, ${L.loudnorm?.normalization ?? '?'} normalization`);
  add('mix', 'truePeak', m.TP <= L.target.TP + 0.1 ? 'pass' : 'fail', `${m.TP} dBTP (ceiling ${L.target.TP})`);
  if (timeline) add('mix', 'length', Math.abs(m.duration - timeline.duration) <= 0.01 ? 'pass' : 'fail', `${m.duration}s vs film ${timeline.duration}s`);
  const duckT = L.duck.targetDb ?? 6;
  // a cue's depthDb is a ceiling: warn more than 1.5 dB over (or under) it, fail more than 3 dB over
  const dd = L.duck.depthDb;
  const duckStatus = dd == null ? 'skip' : dd > duckT + 3 ? 'fail' : Math.abs(dd - duckT) > 1.5 ? 'warn' : 'pass';
  const ap = L.duck.applied;
  add('mix', 'duck', duckStatus, dd == null ? 'no ducked music under narration' : `music ducks ${dd} dB (target ${duckT}, ceiling; warn beyond ±1.5) under ${L.duck.speechSecondsUnderMusic}s of narration${ap?.calibrated ? `; calibrated to threshold ${ap.thresholdDb} dBFS, ratio ${ap.ratio}` : ''}`);
  if (L.moments) {
    // informational: the opening line's loudest window and the music's loudest moments (reviewers check the climax)
    const first = timeline?.shots?.[0]?.lines?.[0]?.id;
    const fm = first ? L.moments.lines?.[first] : null;
    const top = (L.moments.nonSpeech || []).slice(0, 3).map((q) => `${q.M} LUFS @ ${q.at}s`).join(', ');
    add('mix', 'moments', 'pass', `${fm ? `${first} peaks ${fm.M} LUFS momentary; ` : ''}loudest music-only windows: ${top || 'none'}`);
  }
  const pre = L.loudnorm?.preLimit;
  // review round 2: aim for at most 1.5 dB of master limiting (reach -16 LUFS by trimming music swells, not speech)
  add('mix', 'preLimit', pre && pre.reductionDb > 1.5 ? 'warn' : 'pass', pre ? `master limiter takes ${pre.reductionDb} dB off the peaks before the final gain${pre.reductionDb > 1.5 ? ' (> 1.5 dB)' : ''}${pre.where ? `; over the ceiling: speech ${pre.where.speech.seconds} s (max ${pre.where.speech.maxDb} dB), music-only ${pre.where.music.seconds} s (max ${pre.where.music.maxDb} dB)` : ''}` : 'no master limiting (constant gain only)', { reductionDb: pre?.reductionDb ?? 0 });
  const st = L.narration;
  if (st) add('mix', 'stemLimit', (st.limitedDb ?? 0) > 1 ? 'warn' : 'pass', `narration stem limiter ${st.limitedDb ?? 0} dB${st.compressor ? `; speech compressor ${st.compressor.grDb} dB GR` : ''}`);
  // per-line levels, measured here on the narration stem (independent of what timeline.mjs reports): each line's
  // loudest momentary window must sit within 0.5 dB of its requested levelDb offset from the median of the others
  if (fs.existsSync(P.narration.wav) && timeline && !timeline.draft) {
    const requested = Object.fromEntries(scriptLines.map((l) => [l.id, intendedDb(l)]));
    const hints = Object.fromEntries(scriptLines.map((l) => [l.id, levelHintDb(l.level)]));
    const levelDbOf = Object.fromEntries(scriptLines.map((l) => [l.id, Number(l.levelDb) || 0]));
    // each line's OWN window (shot start + line start/end), gated loudness: not the loudest 400 ms (review round 1)
    const lv = levelOffsets(spanLoudness(P.narration.wav, lineSpans(timeline)), requested, hints);
    const rows = Object.entries(lv);
    // review round 2: the leveling is capped at ±3 dB, so lines keep some of their own level; warn on drift from
    // lineLufs + hint beyond 1.5 dB, fail beyond 3 dB, and fail a requested hint/offset that misses by > 1.5 dB
    // (a small levelDb may compensate a capped ride, so a hinted line is judged against its hint, not hint + levelDb)
    const fail = rows.filter(([, v]) => Math.abs(v.driftDb) > LEVEL_FAIL_DB || (v.hintDb && Math.abs(v.driftDb) > LEVEL_WARN_DB));
    const drift = rows.filter(([k, v]) => !fail.some(([f]) => f === k) && Math.abs(v.driftDb) > LEVEL_WARN_DB);
    const stacked = Object.entries(levelDbOf).filter(([, d]) => Math.abs(d) > LEVEL_WARN_DB);
    const shown = rows.filter(([, v]) => v.hintDb || v.requestedDb).map(([k, v]) => `${k} ${v.offsetDb} (${v.hintDb ? `hint ${v.hintDb}` : 'no hint'}${v.requestedDb !== (v.hintDb || 0) ? `, levelDb ${+(v.requestedDb - (v.hintDb || 0)).toFixed(2)}` : ''})`);
    const rest = rows.filter(([, v]) => !v.hintDb && !v.requestedDb).map(([, v]) => v.offsetDb);
    const status = fail.length ? 'fail' : drift.length || stacked.length ? 'warn' : 'pass';
    add('mix', 'lineLevels', status,
      `${fail.length ? `off their intended level: ${fail.map(([k, v]) => `${k} ${v.offsetDb >= 0 ? '+' : ''}${v.offsetDb} dB, want ${v.hintDb || 0}`).join('; ')} — re-run film:timeline or re-narrate; ` : ''}` +
      `${drift.length ? `more than ${LEVEL_WARN_DB} dB from lineLufs + hint (capped leveling keeps the take's level): ${drift.map(([k, v]) => `${k} ${v.driftDb >= 0 ? '+' : ''}${v.driftDb}`).join(', ')}; ` : ''}` +
      `${stacked.length ? `levelDb over ±${LEVEL_WARN_DB} stacks on the ride: ${stacked.map(([k, d]) => `${k} ${d}`).join(', ')}; ` : ''}` +
      `${shown.length ? `hinted/offset: ${shown.join(', ')}; ` : ''}spread of the rest ${rest.length ? `${Math.min(...rest)}..${Math.max(...rest)}` : 'n/a'} dB`,
      { lines: lv });
  }
  // review round 2: five lines (+2/+3 dB offsets on top of the rides) peaked 4-5 dB over every other line; warn when a
  // line's loudest momentary window in the master exceeds the narration's median line peak by more than 2 dB
  if (L.moments?.lines) {
    const pk = Object.entries(L.moments.lines).map(([k, v]) => [k, v.M]).filter(([, m]) => Number.isFinite(m));
    const sorted = pk.map(([, m]) => m).sort((x, y) => x - y);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    // review round 3 (L1505 was 5 dB over its neighbour): the bar is the MEDIAN line peak + 2 dB, not p95 + 2
    const n = sorted.length;
    const med = +(n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2).toFixed(2);
    const hot = pk.filter(([, m]) => m > med + 2).sort((x, y) => y[1] - x[1]);
    add('mix', 'linePeaks', hot.length ? 'warn' : 'pass', `narration momentary peaks: median ${med} LUFS, p95 ${p95}, max ${sorted[n - 1]}${hot.length ? `; over median + 2 dB: ${hot.map(([k, m]) => `${k} ${m}`).join(', ')}` : ' (none over median + 2 dB)'}`, { median: med, p95, hot });
  }
  if (L.foley) {
    const f = L.foley;
    const bad = (f.events || []).filter((e) => e.problems?.length);
    const ok = f.checks ? Object.values(f.checks).every(Boolean) : true;
    add('mix', 'foley', ok ? 'pass' : 'warn', f.source ? `${(f.events || []).length} foley events (max ${f.max})${(f.events || []).length ? `: ${f.events.map((e) => `${e.id} ${e.t}s ${e.lufsS} LUFS S`).join(', ')}` : ''}${bad.length ? `; placement: ${bad.map((e) => `${e.id} ${e.problems.join('/')}`).join('; ')}` : ''}${f.checks && !f.checks.level ? '; a level is outside -28..-32 LUFS S' : ''}` : 'no score/foley.json (no foley bus)');
  }
  if (L.swells?.regions) add('mix', 'swells', 'pass', `music-only ceiling ${L.swells.ceiling} LUFS M (line p50 ${L.swells.lineMomentaryP50} − ${L.swells.margin}); ${L.swells.regions.length} swells trimmed${L.swells.regions.length ? `: ${L.swells.regions.slice().sort((x, y) => y.M - x.M).slice(0, 5).map((r) => `${r.peakAt}s −${r.trimDb} dB`).join(', ')}` : ''}`);
  // a fading cue's last strike rings in clear air before the fade-out begins (mix.mjs --fade-after-strike, 1.6 s)
  const fades = (L.cues || []).filter((c) => c.fade);
  if (fades.length) {
    const failed = fades.filter((c) => c.fade.ok === false);
    const unmarked = fades.filter((c) => c.fade.lastStrike == null);
    add('mix', 'fadeAfterStrike', failed.length ? 'fail' : unmarked.length ? 'warn' : 'pass',
      fades.map((c) => (c.fade.lastStrike == null ? `${c.id}: no lastStrike marker in cues.json (unverified)` : `${c.id}: fade ${c.fade.fadeStart}–${+(c.fade.fadeStart + c.fade.fadeDur).toFixed(2)} s starts ${c.fade.afterStrike} s after the last strike (${c.fade.lastStrike} s; min ${c.fade.minAfterStrike})${c.fade.ok === false ? ' — the window is too short' : ''}`)).join('; '));
  }
  // the master never reaches digital zero (a room-tone floor runs under everything: mix.mjs --floor-lufs)
  if (L.floor) add('mix', 'floor', L.floor.minMomentary > -70 ? 'pass' : 'fail', `room tone ${L.floor.measuredLufs} LUFS (target ${L.floor.lufs}); quietest 400 ms of the master ${L.floor.minMomentary} LUFS${L.floor.minMomentary > -70 ? '' : ' — digital silence somewhere: re-run film:mix'}`);
  else add('mix', 'floor', 'fail', 'no room-tone floor in loudness.json (mix.mjs before review round 1): re-run film:mix');
  if (L.musicEq) add('mix', 'musicEq', L.musicEq.highpassHz >= 30 ? 'pass' : 'warn', `music bus: ${L.musicEq.highpassHz} Hz high-pass (${L.musicEq.highpassSlope}), low band under ${L.musicEq.shelfHz} Hz ${L.musicEq.keyed ? `keyed down ${L.musicEq.lowBandReductionUnderSpeechDb} dB more under speech` : 'static shelf'}`);
  // speech-to-music ratio inside each line's window
  if (L.lineMasking) {
    const rows = Object.entries(L.lineMasking).sort((x, y) => x[1] - y[1]);
    const bad = rows.filter(([, d]) => d < 6);
    const low = rows.filter(([, d]) => d >= 6 && d < 10);
    add('mix', 'lineMasking', bad.length ? 'fail' : low.length ? 'warn' : 'pass', `${bad.length ? `music within 6 dB of the voice: ${bad.map(([k, d]) => `${k} ${d} dB`).join(', ')}; ` : ''}${low.length ? `under 10 dB: ${low.slice(0, 12).map(([k, d]) => `${k} ${d}`).join(', ')}${low.length > 12 ? ` (+${low.length - 12})` : ''}` : ''}${!bad.length && !low.length ? `every line at least 10 dB over the music (lowest ${rows[0]?.[0]} ${rows[0]?.[1]} dB)` : ''}`, { lines: L.lineMasking });
  }
  const big = (L.chapters || []).filter((c) => c.bytes >= MAX_SLICE);
  add('mix', 'chapters', big.length ? 'fail' : 'pass', `${(L.chapters || []).length} slices${big.length ? `; over 25 MiB: ${big.map((c) => c.number).join(',')}` : ''}`);
  const newest = Math.max(mtime(P.narration.wav), mtime(P.score.cues), ...(L.cues || []).map((c) => mtime(path.join(ROOT, c.file))));
  if (mtime(P.mix.master) < newest) add('mix', 'fresh', 'warn', 'master is older than narration.wav, cues.json or a cue render — re-run film:mix');
}

function qaRender() {
  if (!fs.existsSync(P.render.film)) return add('render', 'film', 'skip', 'no render/film.mp4 yet');
  const v = videoInfo(P.render.film);
  const fps = timeline?.fps ?? v.fps;
  const want = timeline ? Math.round(timeline.duration * fps) : v.frames;
  add('render', 'frames', v.frames === want ? 'pass' : 'fail', `${v.frames} frames (expected ${want} = round(${timeline?.duration} × ${fps}))`);
  add('render', 'format', v.width === 1920 && v.height === 1080 && Math.abs(v.fps - fps) < 1e-6 ? 'pass' : 'fail', `${v.width}×${v.height} @ ${v.fps} fps ${v.pixFmt}`);
  add('render', 'av', v.audioDuration != null && Math.abs(v.audioDuration - v.frames / v.fps) <= 1 / v.fps + 0.03 ? 'pass' : 'fail', `video ${(v.frames / v.fps).toFixed(3)}s, audio ${v.audioDuration ?? 'none'}s (${v.audioCodec ?? '-'})`);
  add('render', 'extras', v.subtitles ? 'pass' : 'warn', v.subtitles ? 'captions muxed' : 'no caption track');
  const ch = v.chapters;
  const wantCh = timeline?.chapters?.length ?? 0;
  add('render', 'chapters', ch.warnings.length ? 'fail' : ch.count !== wantCh ? 'warn' : 'pass', ch.warnings.length ? `chapter mux broken: ${ch.warnings.slice(0, 2).join('; ')}` : `${ch.count} chapters muxed (timeline has ${wantCh})`);
  if (mtime(P.render.film) < Math.max(mtime(P.mix.master), mtime(P.app.timeline))) add('render', 'fresh', 'warn', 'film.mp4 is older than the master or the timeline — re-render');
}

function qaSheets() {
  if (!timeline) return add('sheets', 'sheets', 'skip', 'no timeline');
  const miss = timeline.shots.filter((s) => !fs.existsSync(path.join(P.qa.sheets, `${s.id}.png`))).map((s) => s.id);
  const old = timeline.shots.filter((s) => fs.existsSync(path.join(P.qa.sheets, `${s.id}.png`)) && mtime(path.join(P.qa.sheets, `${s.id}.png`)) < mtime(P.app.timeline)).map((s) => s.id);
  add('sheets', 'coverage', miss.length ? 'warn' : old.length ? 'warn' : 'pass', miss.length ? `missing sheets: ${miss.slice(0, 10).join(',')}${miss.length > 10 ? '…' : ''}` : old.length ? `older than the timeline: ${old.slice(0, 10).join(',')}` : `${timeline.shots.length} sheets current`);
  // review round 3: no paper card shows blank (generator/film/cards.mjs): paper > 50 % with text < 20 % for > 0.3 s
  // fails on a card the type kit's cardProbe reports, warns on unprobed light paper; a shot whose source is newer
  // than its audit is listed as unaudited
  const cs = readJson(path.join(P.qa.dir, 'cards', 'summary.json'), null);
  if (!cs) add('sheets', 'cards', 'warn', `no card audit — run node generator/film/cards.mjs --slug ${a.slug} --all`);
  else {
    const fails = Object.entries(cs.shots || {}).filter(([, v]) => v.fails?.length).map(([k, v]) => `${k}: ${v.fails.join('; ')}`);
    const sus = Object.entries(cs.shots || {}).filter(([, v]) => v.suspects?.length).map(([k]) => k);
    const shotSrc = (id) => path.join(P.app.dir, 'shots', `${id}.tsx`);
    const unaudited = timeline.shots.filter((s) => !cs.shots?.[s.id] || (fs.existsSync(shotSrc(s.id)) && mtime(shotSrc(s.id)) > Date.parse(cs.shots[s.id].at || 0))).map((s) => s.id);
    add('sheets', 'cards', fails.length ? 'fail' : sus.length || unaudited.length ? 'warn' : 'pass', fails.length ? `blank paper cards: ${fails.slice(0, 8).join(' | ')}` : `${Object.keys(cs.shots || {}).length} shots audited, no blank probed card${sus.length ? `; suspect unprobed paper (read the frames): ${sus.slice(0, 8).join(', ')}` : ''}${unaudited.length ? `; unaudited or changed since: ${unaudited.length} shots (${unaudited.slice(0, 6).join(', ')}…)` : ''}`, { fails, suspects: sus, unaudited });
    // review round 4: no ghost text (the same audit): two different text layers overlapping, both > 25 % opaque, > 0.25 s
    const ghostAudited = Object.entries(cs.shots || {}).filter(([, v]) => Array.isArray(v.ghosts));
    const ghosts = ghostAudited.filter(([, v]) => v.ghosts.length).map(([k, v]) => `${k}: ${v.ghosts.slice(0, 2).join('; ')}`);
    const noGhostAudit = timeline.shots.filter((s) => !Array.isArray(cs.shots?.[s.id]?.ghosts)).map((s) => s.id);
    add('sheets', 'ghostText', ghosts.length ? 'fail' : noGhostAudit.length || unaudited.length ? 'warn' : 'pass', ghosts.length ? `ghost text (two text layers both > 25 % for > 0.25 s; fix with the type kit's textSwapOut): ${ghosts.slice(0, 8).join(' | ')}` : `${ghostAudited.length} shots audited, no ghost text${noGhostAudit.length ? `; no ghost audit yet: ${noGhostAudit.length} shots (${noGhostAudit.slice(0, 6).join(', ')}…)` : ''}${unaudited.length ? `; changed since the audit: ${unaudited.length} shots` : ''}`, { ghosts, noGhostAudit });
  }
}

function qaPublish() {
  const mf = path.join(P.publish.dir, 'manifest.json');
  if (!fs.existsSync(mf)) return add('publish', 'manifest', 'skip', 'not published');
  const m = readJson(mf);
  const bad = [];
  if (m.format !== 3) bad.push('format != 3');
  if (m.kind !== 'film') bad.push('kind != film');
  for (const c of m.chapters || []) {
    if (!c.audio) continue;
    const f = path.join(P.publish.dir, c.audio);
    if (!fs.existsSync(f)) bad.push(`missing ${c.audio}`);
    else if (fs.statSync(f).size >= MAX_SLICE) bad.push(`${c.audio} ≥ 25 MiB`);
  }
  add('publish', 'manifest', bad.length ? 'fail' : 'pass', bad.join('; ') || `${(m.chapters || []).length} chapters, kind film`);
  // stale shelf copy: the published film must match the current clock and be newer than the master
  const stale = [];
  const runtime = m.film?.runtime ?? m.runtime;
  if (timeline && runtime != null && Math.abs(runtime - timeline.duration) > 0.05) stale.push(`runtime ${runtime} s ≠ timeline ${timeline.duration} s`);
  if (fs.existsSync(P.mix.master) && mtime(mf) < mtime(P.mix.master)) stale.push('manifest older than mix/master.wav');
  add('publish', 'current', stale.length ? 'warn' : 'pass', stale.length ? `shelf copy is stale (${stale.join('; ')}): re-run film:publish` : 'matches the current clock and master');
}

const run = { narration: qaNarration, timeline: qaTimeline, score: qaScore, mix: qaMix, render: qaRender, sheets: qaSheets, publish: qaPublish };
for (const [k, f] of Object.entries(run)) {
  if (!want(k)) continue;
  try {
    f();
  } catch (e) {
    add(k, 'error', 'fail', `check crashed: ${e.message}`);
  }
}
const count = (s) => checks.filter((c) => c.status === s).length;
const report = { slug: a.slug, at: new Date().toISOString(), summary: { pass: count('pass'), warn: count('warn'), fail: count('fail'), skip: count('skip') }, checks };
const stamp = report.at.replace(/[:.]/g, '-');
writeJson(path.join(P.qa.reports, `qa-${stamp}.json`), report);
writeJson(path.join(P.qa.reports, STAGES.length ? 'latest-partial.json' : 'latest.json'), report);
updateStage(P, 'qa', { status: count('fail') ? 'failed' : 'done', at: report.at, summary: report.summary, report: rel(path.join(P.qa.reports, STAGES.length ? 'latest-partial.json' : 'latest.json')), partial: STAGES.length ? STAGES : undefined });
if (a.json) console.log(JSON.stringify(report, null, 1));
else {
  const icon = { pass: 'ok  ', warn: 'WARN', fail: 'FAIL', skip: 'skip' };
  for (const c of checks) console.log(`${icon[c.status]} ${`${c.stage}.${c.id}`.padEnd(22)} ${c.detail}`);
  console.log(`\n${report.summary.pass} pass · ${report.summary.warn} warn · ${report.summary.fail} fail · ${report.summary.skip} skip → ${rel(path.join(P.qa.reports, STAGES.length ? 'latest-partial.json' : 'latest.json'))}`);
}
if (count('fail')) process.exitCode = 1;
