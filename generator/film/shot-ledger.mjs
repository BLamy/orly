#!/usr/bin/env node
// The per-shot fix ledger — film.json stages.fixes[<key>].outcomes, written deterministically (review round 3).
//
//   node generator/film/shot-ledger.mjs record   --slug <s> --key round3-shots --shot <id> --outcome fixed|partial|skipped
//                                                --reason "<what was checked / what is missing>" [--times "19.34,26.2"] [--by <label>]
//   node generator/film/shot-ledger.mjs finalize --slug <s> --key round3-shots --ids a,b,c [--outcomes a=fixed,b=partial]
//                                                [--times-map a:19.34/26.2,b:11.73] [--notes-file <json>] [--round 3] [--by film-shots]
//   node generator/film/shot-ledger.mjs check    --slug <s> --key round3-shots [--ids a,b] [--round 3]
//   node generator/film/shot-ledger.mjs backfill --slug <s> --key round2-shots --from-verdict 3
//   node generator/film/shot-ledger.mjs show     --slug <s> --key round3-shots
//   node generator/film/shot-ledger.mjs history  --slug <s> --shot <id> [--round 4]   every routed note for the shot, all rounds
//   (--key auto = "shots-<UTC date>", for a film-shots run outside a review round)
//
// record     an author (or reviser) records the outcome of ONE routed shot right after verifying it on frames rendered
//            after its last edit. The record keeps the shot file's sha, so a later overwrite is detectable.
// finalize   the stage's closing step (film-shots runs it; no judgement involved): for every ROUTED id it merges the
//            workflow's outcome (--outcomes) with the recorded one (the worse wins), then runs the MECHANICAL NOTE CHECK:
//            each note's key strings (qa/reviews/round-<n>/note-checks.json, the verdict's fixChecks, and the note's own
//            "grep … for 'X' … gone" phrases) are looked up in the shot source with comments stripped; a "fixed" whose
//            check misses, or whose file changed after the outcome was recorded without a passing check, is downgraded
//            to "partial" with the reason; so is a "fixed" with no word times recorded as checked. Writes stages.fixes[key] = {at, by, kind: "shot-ledger", round, consumed,
//            outcomes} under a lock (keeping other keys and other ids), prints a JSON summary, and EXITS 2 when any
//            routed id has no outcome (the workflow then fails the stage).
// check      the note check alone (no write); exit 1 on any miss.
// backfill   builds a ledger for an earlier round from a review verdict's ledgerAudit + carriedOverUnapplied.
// history    (review round 4) prints every routed note for one shot from round 1 to --round (verdict fixes.shots and the
//            round's global hand-off), each with its removed ("absent") keys and their respellings, then the cumulative
//            REMOVED list: what a critic or reviser must never re-add, in any spelling.
// RESPELLINGS (review round 4: ch10-s12 re-added a removed '1/7' as 'one-seventh … GNMT+RL (derived)'): finalize and
//            check also look for (a) every absent key of this round respelled (digits <-> words, fractions <-> ordinals,
//            abbreviations; lib/shotledger.mjs respellings) and the quoted nouns of the note's own delete/remove clauses,
//            and (b) every absent key of EARLIER rounds for the same shot (and its respellings), minus anything this
//            round requires; matched case-insensitively as whole words inside string literals. Any hit downgrades a
//            "fixed" to "partial" ("re-added removed text").
// NAMED BEATS (review round 5: ch15-s08 was downgraded for a missing literal 'open' although it anchors on
//            T.beat('stamp'), which the clock defines as T.word(L1516b,'open')): a missing quoted word key is satisfied
//            when the shot calls T.beat('<name>') and that timeline beat equals the word's time within one frame
//            ('two#2' = the second occurrence). The check records each such match as viaBeat.
// Notes: an id's note is --notes-file[id], else the round's verdict fixes.shots[id], else the round's global hand-off.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, list, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson } from './lib/paths.mjs';
import { readFilm } from './lib/ledger.mjs';
import { withLock, noteChecks, runCheck, shotSha, worse, RANK, removedKeys, removalKeys, respellings, runRespellCheck, shotHistory } from './lib/shotledger.mjs';

const a = parseArgs(process.argv.slice(2), { boolean: ['help', 'json'], string: ['slug', 'dir', 'key', 'shot', 'outcome', 'reason', 'times', 'by', 'ids', 'outcomes', 'times-map', 'notes-file', 'round', 'from-verdict'] });
const cmd = a._[0];
if (a.help || !a.slug || !cmd) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
// --key auto: a stage run without a review round (workflow scripts have no clock, so the date comes from here)
if (a.key === 'auto') a.key = `shots-${now().slice(0, 10)}`;
const roundOf = (key) => Number(a.round || a['from-verdict'] || (String(key).match(/round(\d+)/) || [])[1]) || null;

function mutateFixes(key, fn) {
  return withLock(P.ledger, () => {
    const f = readFilm(P);
    f.stages.fixes = f.stages.fixes || {};
    const e = (f.stages.fixes[key] = f.stages.fixes[key] || { kind: 'shot-ledger', outcomes: {} });
    e.outcomes = e.outcomes || {};
    const r = fn(e, f);
    writeJson(P.ledger, f, 2);
    return r;
  });
}

function notesFor(round, ids) {
  const out = {};
  const file = a['notes-file'] ? readJson(path.resolve(a['notes-file']), {}) : {};
  const v = round ? readJson(path.join(P.qa.dir, 'reviews', `round-${round}`, 'verdict.json'), {}) : {};
  const g = round ? readFilm(P).stages.fixes?.[`round${round}-global`]?.handoff || {} : {};
  for (const id of ids) out[id] = file[id] || v.fixes?.shots?.[id] || g[id] || null;
  return out;
}

if (cmd === 'record') {
  if (!a.key || !a.shot || !(a.outcome in RANK) || a.outcome === 'missing') {
    console.error('record needs --key, --shot and --outcome fixed|partial|skipped');
    process.exit(2);
  }
  const rec = { outcome: a.outcome, reason: String(a.reason || ''), ...(a.times ? { wordTimes: list(a.times).map(Number).filter(Number.isFinite) } : {}), sha: shotSha(P, a.shot), recordedBy: a.by || 'author', recordedAt: now() };
  mutateFixes(a.key, (e) => {
    e.outcomes[a.shot] = { ...(e.outcomes[a.shot] || {}), ...rec };
  });
  console.log(JSON.stringify({ key: a.key, shot: a.shot, ...rec }));
} else if (cmd === 'finalize' || cmd === 'check') {
  if (!a.key) {
    console.error(`${cmd} needs --key`);
    process.exit(2);
  }
  const round = roundOf(a.key);
  const existing = readFilm(P).stages.fixes?.[a.key]?.outcomes || {};
  const ids = list(a.ids).length ? list(a.ids) : Object.keys(existing);
  const given = Object.fromEntries(list(a.outcomes).map((kv) => kv.split('=')).filter(([k, v]) => k && v in RANK));
  // --times-map "id:19.34/26.2,id2:11.73": the word times the workflow's authors reported checking
  const givenTimes = Object.fromEntries(list(a['times-map']).map((kv) => kv.split(':')).filter(([k, v]) => k && v).map(([k, v]) => [k, v.split('/').map(Number).filter(Number.isFinite)]));
  const notes = notesFor(round, ids);
  const film = readFilm(P);
  const result = {};
  const missing = [];
  const downgraded = [];
  for (const id of ids) {
    const rec = existing[id] || {};
    let outcome = worse(given[id], rec.outcome && rec.outcome !== 'missing' ? rec.outcome : null);
    let reason = rec.reason || (given[id] ? 'outcome reported by the author in the workflow result' : '');
    const check = noteChecks(P, round, id, notes[id]);
    // review round 4: the note's own delete/remove nouns are absent keys too
    for (const k of removalKeys(notes[id])) if (!check.absent.includes(k) && !check.present.includes(k)) check.absent.push(k);
    const hasCheck = check.present.length || check.absent.length;
    const r = hasCheck ? runCheck(P, id, check) : null;
    // review round 4: removals stay removed in any spelling, this round's and every earlier round's
    const removed = removedKeys(P, id, round, film);
    for (const k of check.absent) if (!removed.some((x) => x.key === k)) removed.push({ key: k, round, note: notes[id] || '' });
    const respell = removed.length ? runRespellCheck(P, id, removed).filter((h) => !(r?.found || []).includes(h.key)) : [];
    if (r && respell.length) r.ok = false;
    const curSha = shotSha(P, id);
    const changedAfter = rec.sha && curSha && rec.sha !== curSha;
    const wordTimes = [...new Set([...(rec.wordTimes || []), ...(givenTimes[id] || [])])].sort((x, y) => x - y);
    if (outcome == null) missing.push(id);
    if (outcome === 'fixed' && !wordTimes.length) {
      // review round 3: "fixed" means verified on frames at the word times the note names; with none recorded it is not
      outcome = 'partial';
      reason = `no word times recorded as checked (record --times, or the workflow's wordTimes); author said: ${reason}`;
      downgraded.push(id);
    }
    if (outcome === 'fixed' && ((r && !r.ok) || respell.length)) {
      outcome = 'partial';
      reason = `note check FAILED (${[...(r?.missing || []).map((s) => `missing '${s}'`), ...(r?.found || []).map((s) => `still has '${s}'`), ...respell.map((h) => `re-added removed text '${h.key}' (round ${h.round}) as '${h.as}'`)].join(', ')}); author said: ${reason}`;
      downgraded.push(id);
    } else if (outcome === 'fixed' && changedAfter && !r) {
      outcome = 'partial';
      reason = `the shot file changed after the outcome was recorded (sha ${rec.sha} -> ${curSha}) and the note has no mechanical check: re-verify; author said: ${reason}`;
      downgraded.push(id);
    }
    result[id] = {
      ...rec,
      outcome: outcome ?? 'missing',
      reason: outcome == null ? 'NO OUTCOME: neither the workflow nor the author recorded one' : reason,
      ...(wordTimes.length ? { wordTimes } : {}),
      ...(notes[id] ? { note: String(notes[id]).slice(0, 600) } : {}),
      ...(r || respell.length ? { check: { ok: !!r?.ok && !respell.length, present: check.present, absent: check.absent, missing: r?.missing || [], found: r?.found || [], ...(respell.length ? { respelled: respell } : {}), ...(r?.viaBeat ? { viaBeat: r.viaBeat } : {}), removedKeys: removed.map((x) => x.key) } } : {}),
      sha: curSha,
      ...(changedAfter ? { recordedSha: rec.sha } : {}),
    };
  }
  const counts = {};
  for (const o of Object.values(result)) counts[o.outcome] = (counts[o.outcome] || 0) + 1;
  if (cmd === 'finalize') {
    const at = now();
    mutateFixes(a.key, (e) => {
      Object.assign(e, { at, by: a.by || 'film-shots (shot-ledger.mjs finalize)', kind: 'shot-ledger', round, consumed: { ...(e.consumed || {}), shots: true, score: true } });
      Object.assign(e.outcomes, result);
    });
    // read back: the entry must hold every routed id
    const back = readFilm(P).stages.fixes?.[a.key]?.outcomes || {};
    const lost = ids.filter((id) => !back[id]);
    if (lost.length) missing.push(...lost.map((id) => `${id} (not in film.json after write)`));
  }
  const summary = { key: a.key, round, routed: ids.length, counts, missing, downgraded, written: cmd === 'finalize' };
  console.log(JSON.stringify(summary));
  if (cmd === 'check') for (const [id, o] of Object.entries(result)) if (o.check && !o.check.ok) console.error(`  ${id}: missing ${JSON.stringify(o.check.missing)} still has ${JSON.stringify(o.check.found)}${o.check.respelled ? ` re-added ${JSON.stringify(o.check.respelled.map((h) => `${h.key} as ${h.as} (r${h.round})`))}` : ''}`);
  process.exitCode = missing.length ? 2 : cmd === 'check' && Object.values(result).some((o) => o.check && !o.check.ok) ? 1 : 0;
} else if (cmd === 'backfill') {
  const round = Number(a['from-verdict']);
  if (!a.key || !round) {
    console.error('backfill needs --key and --from-verdict <round>');
    process.exit(2);
  }
  const v = readJson(path.join(P.qa.dir, 'reviews', `round-${round}`, 'verdict.json'));
  const prev = readJson(path.join(P.qa.dir, 'reviews', `round-${round - 1}`, 'verdict.json'), {});
  const audit = v.ledgerAudit || {};
  const idOf = (s) => (String(s).match(/^(ch\d+-s\d+[a-z]?|L\d+[a-z]?|m\d+)/) || [])[1];
  const out = {};
  const put = (raw, outcome, reason) => {
    const id = idOf(raw);
    if (!id) return;
    const extra = String(raw).slice(id.length).trim();
    // the worse report wins (an id listed both fixed and partial is partial)
    if (!out[id] || RANK[outcome] < RANK[out[id].outcome]) out[id] = { outcome, reason: [extra, reason].filter(Boolean).join(': ') };
  };
  for (const x of audit.fixed || []) put(x, 'fixed', `confirmed fixed by the round-${round} reviewers`);
  for (const [k, r] of Object.entries(audit.partial || {})) put(k, 'partial', r);
  for (const [k, r] of Object.entries(audit.skipped_unrecorded || {})) put(k, 'skipped', r);
  for (const id of v.carriedOverUnapplied || []) if (!out[id] || out[id].outcome === 'fixed') out[id] = { outcome: out[id] ? 'partial' : 'skipped', reason: `carried over unapplied into round ${round}${out[id] ? ` (also listed fixed: ${out[id].reason})` : ''}` };
  for (const [id, o] of Object.entries(out)) {
    const n = prev.fixes?.shots?.[id] || prev.fixes?.lines?.[id] || prev.fixes?.cues?.[id];
    if (n) o.note = String(n).slice(0, 600);
    o.recordedBy = `back-filled from qa/reviews/round-${round}/verdict.json ledgerAudit`;
  }
  const at = now();
  mutateFixes(a.key, (e) => {
    Object.assign(e, { at, by: a.by || `back-fill from the round-${round} verdict (shot-ledger.mjs backfill)`, kind: 'shot-ledger', round: round - 1, backfilled: true, consumed: { shots: true, score: true } });
    Object.assign(e.outcomes, out);
  });
  const counts = {};
  for (const o of Object.values(out)) counts[o.outcome] = (counts[o.outcome] || 0) + 1;
  console.log(JSON.stringify({ key: a.key, ids: Object.keys(out).length, counts }));
} else if (cmd === 'history') {
  if (!a.shot) {
    console.error('history needs --shot');
    process.exit(2);
  }
  const film = readFilm(P);
  const round = Number(a.round) || Infinity;
  const hist = shotHistory(P, a.shot, round, film);
  const removed = removedKeys(P, a.shot, Number.isFinite(round) ? round : Math.max(0, ...hist.map((h) => h.round)), film);
  if (a.json) console.log(JSON.stringify({ shot: a.shot, history: hist, removed: removed.map((x) => ({ key: x.key, round: x.round, respellings: respellings(x.key, x.note) })) }, null, 1));
  else {
    console.log(`ROUTED NOTES for ${a.shot} (oldest first). RULE: never re-add what a routed note removed, in any spelling.`);
    for (const h of hist) console.log(`\n[round ${h.round}] ${h.note || ''}${h.handoff ? `\n  hand-off: ${h.handoff}` : ''}${h.absent.length ? `\n  removed: ${h.absent.map((k) => `'${k}'`).join(', ')}` : ''}`);
    console.log(`\nREMOVED (must stay absent): ${removed.length ? removed.map((x) => `'${x.key}' (r${x.round}${respellings(x.key, x.note).length ? `; also as ${respellings(x.key, x.note).map((v) => `'${v}'`).join(', ')}` : ''})`).join('; ') : 'nothing'}`);
  }
} else if (cmd === 'show') {
  console.log(JSON.stringify(readFilm(P).stages.fixes?.[a.key] || null, null, 1));
} else {
  console.error(`unknown command ${cmd}`);
  process.exit(2);
}
