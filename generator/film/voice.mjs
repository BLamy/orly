#!/usr/bin/env node
// Stage 3 — narrator voice: audition candidates, then lock voice.json.
//
//   npm run film:voice -- audition --slug <slug> --voices <id>[:label],<id>… [--models eleven_multilingual_v2,eleven_v4]
//                         [--speed 1.0] [--text sample.txt | --chars 700] [--dry-run] [--budget N]
//   npm run film:voice -- lock --slug <slug> --voice <id> [--name "…"] [--model eleven_multilingual_v2] [--speed 1.05]
//                         [--stability 0.6] [--similarity 0.8] [--style 0.05] [--seed N]
//   npm run film:voice -- show --slug <slug>
//   npm run film:voice -- listen --slug <slug>            (pronunciation sign-offs: term, line, status, clip to play)
//   npm run film:voice -- signoff --slug <slug> --term Rosenblatt --by "<name>" [--verdict ok|reject] [--note "…"]
//
// audition: synthesizes the same paragraph (default: the first ~700 chars of the script, through the
//   lexicon) for every voice × model, and measures duration, speech span, words per minute (from the
//   alignment, exact), EBU R128 loudness / true peak and credits. Files: voice/auditions/<voice>-<model>-s<speed>.mp3
//   and voice/auditions/report.json (merged across runs). Spend is logged to narration/ledger.json and
//   capped by --budget (default film.json budgets.narrationCredits, else 40000). Results are cached by content.
// lock: writes voice/voice.json { voiceId, name, model, settings, seed, format, wpm } read by film:narrate.
//   Never pick or describe a voice as imitating a real person (ARCHITECTURE §1.4).
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, list, num, die, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, sha, rel, mkdirp, fileSha } from './lib/paths.mjs';
import { budget as filmBudget, updateStage } from './lib/ledger.mjs';
import { speak, displayWords, sanitizeSpoken } from './lib/text.mjs';
import { loadLexicon } from './lib/voicecfg.mjs';
import { DEFAULT_FORMAT, DEFAULT_MODEL, DEFAULT_SETTINGS, MODELS, estimateCredits, ttsWithTimestamps, ProviderLimitError } from './lib/eleven.mjs';
import { loudness, mediaDuration } from './lib/ffmpeg.mjs';
import { redact } from './lib/env.mjs';

const HELP = await helpText(import.meta.url);
const a = parseArgs(process.argv.slice(2), {
  boolean: ['dry-run', 'help', 'force'],
  string: ['term', 'by', 'verdict', 'note', 'slug', 'dir', 'voices', 'voice', 'models', 'model', 'speed', 'text', 'chars', 'budget', 'name', 'stability', 'similarity', 'style', 'seed', 'wpm', 'format'],
});
const cmd = a._[0];
if (a.help || !cmd) {
  console.log(HELP);
  process.exit(a.help ? 0 : 2);
}
if (!a.slug) die('--slug is required');
const P = filmPaths(a.slug, { dir: a.dir });

const FALLBACK_TEXT =
  'In the summer of 1958, a young psychologist wheeled a machine into a room full of reporters. It had a camera for an eye, a tangle of wires for a brain, and a single ambition: to learn. ' +
  'Nobody in that room could have guessed where the idea would lead. It would be mocked, abandoned and nearly forgotten, and then, half a century later, it would quietly change everything.';

function sampleText() {
  if (a.text) return sanitizeSpoken(fs.readFileSync(a.text, 'utf8').replace(/\s+/g, ' '));
  const max = num(a.chars, 700);
  if (!fs.existsSync(P.script)) return FALLBACK_TEXT;
  const lex = loadLexicon(P);
  const script = readJson(P.script);
  let out = '';
  for (const ch of script.chapters || [])
    for (const s of ch.shots || [])
      for (const l of s.lines || []) {
        if (out.length >= max * 0.8) return out;
        const sp = speak(l, lex).spoken;
        if (out.length + sp.length + 1 > max && out) return out;
        out += (out ? ' ' : '') + sp;
      }
  return out || FALLBACK_TEXT;
}

async function audition() {
  const voices = list(a.voices || a.voice).map((v) => {
    const [id, ...label] = v.split(':');
    return { id, label: label.join(':') || id };
  });
  if (!voices.length) die('audition needs --voices id[:label],…');
  const models = list(a.models || a.model);
  if (!models.length) models.push(DEFAULT_MODEL);
  for (const m of models) if (!MODELS[m]) die(`unknown model ${m}`);
  const speed = num(a.speed, 1.0);
  const text = sampleText();
  const words = displayWords(text).length;
  const settings = { ...DEFAULT_SETTINGS, speed };
  const jobs = voices.flatMap((v) => models.map((m) => ({ v, m, key: sha({ v: v.id, m, s: settings, t: text, f: DEFAULT_FORMAT }) })));
  mkdirp(P.auditions);
  const todo = jobs.filter((j) => a.force || !fs.existsSync(path.join(P.auditions, `${j.key}.json`)));
  const est = todo.reduce((s, j) => s + estimateCredits(text.length, j.m), 0);
  const ledger = readJson(P.narration.spend, []);
  const spentSoFar = ledger.reduce((s, r) => s + (Number.isFinite(r.cost) ? r.cost : r.estimate || 0), 0);
  const BUDGET = num(a.budget, filmBudget(P, 'narrationCredits', 40000));
  console.log(`sample: ${text.length} chars, ${words} words; ${jobs.length} auditions (${todo.length} new) ≈ ${est} credits (ledger ${Math.round(spentSoFar)} / budget ${BUDGET})`);
  if (a['dry-run']) {
    console.log(`text: ${text}`);
    return;
  }
  if (spentSoFar + est > BUDGET) die(`estimated ${est} credits exceeds the remaining budget`);
  const report = readJson(path.join(P.auditions, 'report.json'), { sample: null, results: {} });
  report.sample = { text, chars: text.length, words };
  for (const j of jobs) {
    const base = path.join(P.auditions, j.key);
    let meta;
    if (!todo.includes(j)) meta = readJson(`${base}.json`);
    else {
      const r = await ttsWithTimestamps({ voiceId: j.v.id, body: { text, model_id: j.m, voice_settings: settings }, format: DEFAULT_FORMAT });
      fs.writeFileSync(`${base}.mp3`, r.audio);
      meta = { at: new Date().toISOString(), cost: r.cost, requestId: r.requestId, alignment: r.alignment };
      writeJson(`${base}.json`, meta, 0);
      writeJson(P.narration.spend, [...readJson(P.narration.spend, []), { at: meta.at, kind: 'audition', key: j.key, voice: j.v.id, model: j.m, chars: text.length, cost: Number.isFinite(r.cost) ? r.cost : null, estimate: estimateCredits(text.length, j.m), requestId: r.requestId }]);
    }
    const nice = path.join(P.auditions, `${j.v.id}-${j.m}-s${speed}.mp3`);
    fs.copyFileSync(`${base}.mp3`, nice);
    const st = meta.alignment.character_start_times_seconds;
    const en = meta.alignment.character_end_times_seconds;
    const ch = meta.alignment.characters;
    const first = ch.findIndex((c) => /\S/.test(c));
    let last = ch.length - 1;
    while (last > 0 && !/\S/.test(ch[last])) last--;
    const speech = en[last] - st[first];
    const L = loudness(nice);
    const row = { voice: j.v.id, label: j.v.label, model: j.m, speed, file: rel(nice), duration: +mediaDuration(nice).toFixed(3), speech: +speech.toFixed(3), words, wpm: +((words / speech) * 60).toFixed(1), I: L.I, TP: L.TP, LRA: L.LRA, cost: meta.cost ?? null };
    report.results[`${j.v.id}|${j.m}|${speed}`] = row;
    console.log(`  ${j.v.label.padEnd(28).slice(0, 28)} ${j.m.padEnd(24)} ${row.wpm} wpm · ${row.duration}s · ${row.I} LUFS · TP ${row.TP} · ${row.cost ?? 'cached'} cr → ${row.file}`);
  }
  writeJson(path.join(P.auditions, 'report.json'), report);
  updateStage(P, 'voice', { status: 'auditioned', auditions: Object.keys(report.results).length, report: rel(path.join(P.auditions, 'report.json')) });
  console.log(`→ ${rel(path.join(P.auditions, 'report.json'))}  (listen, then: film:voice -- lock --slug ${a.slug} --voice <id>)`);
}

function lock() {
  const voiceId = a.voice;
  if (!voiceId || voiceId === true) die('lock needs --voice <id>');
  const prev = readJson(P.voice, {});
  const model = a.model || prev.model || DEFAULT_MODEL;
  if (!MODELS[model]) die(`unknown model ${model}`);
  const s = { ...DEFAULT_SETTINGS, ...(prev.voiceId === voiceId ? prev.settings : {}) };
  if (a.speed != null) s.speed = Number(a.speed);
  if (a.stability != null) s.stability = Number(a.stability);
  if (a.similarity != null) s.similarity_boost = Number(a.similarity);
  if (a.style != null) s.style = Number(a.style);
  const rep = readJson(path.join(P.auditions, 'report.json'), { results: {} });
  const aud = rep.results[`${voiceId}|${model}|${s.speed}`] ?? Object.values(rep.results).find((r) => r.voice === voiceId && r.model === model);
  // wpm at the locked speed: exact audition, else interpolate across this voice's auditions at other speeds
  // (or scale a single one by the speed ratio). Never inherit another voice's wpm.
  const estWpm = () => {
    const rows = Object.values(rep.results).filter((r) => r.voice === voiceId && r.model === model && r.wpm).sort((x, y) => x.speed - y.speed);
    const exact = rows.find((r) => r.speed === s.speed);
    if (exact) return exact.wpm;
    if (!rows.length) return prev.voiceId === voiceId ? prev.wpm ?? null : null;
    if (rows.length === 1) return +((rows[0].wpm * s.speed) / rows[0].speed).toFixed(1);
    const lo = rows.filter((r) => r.speed < s.speed).pop() ?? rows[0];
    const hi = rows.find((r) => r.speed > s.speed) ?? rows[rows.length - 1];
    if (lo === hi || lo.speed === hi.speed) return +((lo.wpm * s.speed) / lo.speed).toFixed(1);
    return +(lo.wpm + ((hi.wpm - lo.wpm) * (s.speed - lo.speed)) / (hi.speed - lo.speed)).toFixed(1);
  };
  const v = {
    voiceId,
    name: a.name || prev.name || aud?.label || null,
    model,
    settings: s,
    seed: a.seed != null ? Number(a.seed) : prev.seed ?? Number.parseInt(sha(P.slug, 8), 16) % 4294967295,
    format: a.format || prev.format || DEFAULT_FORMAT,
    wpm: a.wpm != null ? Number(a.wpm) : estWpm(),
    lockedAt: new Date().toISOString(),
    notes: prev.notes ?? 'Library voice chosen by audition; not a clone or imitation of any real person.',
    // a new voice re-opens every pronunciation sign-off (same voice: kept)
    ...(prev.listening ? { listening: prev.voiceId === voiceId ? prev.listening : prev.listening.map((e) => ({ ...e, status: 'pending', by: null, at: null, clipSig: null })) } : {}),
  };
  writeJson(P.voice, v, 2);
  if (!fs.existsSync(P.lexicon)) writeJson(P.lexicon, {}, 2);
  updateStage(P, 'voice', { status: 'done', voiceId, model, at: v.lockedAt, outputs: [rel(P.voice), rel(P.lexicon)] });
  console.log(`locked ${rel(P.voice)}: ${v.name ?? voiceId} · ${model} · speed ${s.speed} · seed ${v.seed}${v.wpm ? ` · ~${v.wpm} wpm` : ''}`);
}

// listening: the human half of pronunciation QA. STT (film:stt) proves the WORDS come back; only an ear can
// judge STRESS. voice.json listening[] = [{ term, line, expect, status: pending|ok|reject, by, at, clipSig, note }].
// signoff records one person's verdict against the line's CURRENT clip (clipSig); a re-narrated clip makes it
// stale again (QA narration.listening warns while anything is pending or stale, fails on a reject).
function listen() {
  const v = readJson(P.voice);
  const lines = readJson(P.narration.lines, { lines: {} }).lines;
  for (const e of v.listening || []) {
    const rec = lines[e.line];
    const cur = rec ? fileSha(path.resolve(P.dir, rec.clip), 12) : null;
    console.log(`${e.term.padEnd(12)} ${e.line.padEnd(7)} ${(e.status === 'ok' && e.clipSig !== cur ? 'STALE' : e.status).padEnd(8)} expect ${e.expect}${rec ? `  ← ${rel(path.resolve(P.dir, rec.clip))}` : ''}${e.by ? `  (${e.by}, ${e.at})` : ''}`);
  }
}
function signoff() {
  if (!a.term || !a.by) die('signoff needs --term <term> --by <name> [--verdict ok|reject] [--note "…"]');
  const v = readJson(P.voice);
  const e = (v.listening || []).find((x) => x.term.toLowerCase() === String(a.term).toLowerCase());
  if (!e) die(`no listening entry for ${a.term} in ${rel(P.voice)}`);
  const verdict = a.verdict || 'ok';
  if (!['ok', 'reject'].includes(verdict)) die('--verdict must be ok or reject');
  const rec = readJson(P.narration.lines, { lines: {} }).lines[e.line];
  if (!rec) die(`${e.line} is not narrated`);
  Object.assign(e, { status: verdict, by: a.by, at: new Date().toISOString(), clipSig: fileSha(path.resolve(P.dir, rec.clip), 12), note: a.note ?? e.note ?? null });
  writeJson(P.voice, v, 2);
  console.log(`${e.term} (${e.line}): ${verdict} by ${a.by} against clip ${e.clipSig}`);
}

const run = { audition, lock, listen, signoff, show: () => console.log(JSON.stringify(readJson(P.voice), null, 2)) }[cmd];
if (!run) die(`unknown subcommand ${cmd} (audition | lock | listen | signoff | show)`);
Promise.resolve(run()).catch((e) => {
  console.error(`${e instanceof ProviderLimitError ? 'stopped (provider limit)' : 'error'}: ${redact(e.message)}`);
  process.exit(e instanceof ProviderLimitError ? 3 : 1);
});
