#!/usr/bin/env node
// Cue-note clock hygiene — keep the score's cue-note BODIES free of stale absolute times (review round 3).
//
//   node generator/film/cue-notes.mjs --slug <slug> [--cues m10,m13] [--fix] [--show] [--dir <filmDir>]
//
// Each cue's notes in score/cues.json = its CURRENT CLOCK paragraph (the only time authority; the composer rewrites
// it at every re-fit) + a body (the brief). This tool re-maps every anchored time in the body ('lastHall' 948.83)
// to the anchor's time on the CURRENT clock (narration/timeline.json: a beat of the cue's shots, else the nearest
// occurrence of the word in the cue's window) and strips every other absolute time (section spans, parenthesised
// line spans, "at 1067.83"), keeping the word names. Without --fix it reports (exit 1 when a body is stale).
// --show prints the rewritten bodies. QA score.notesClock runs the same audit. film-score runs --fix after a re-fit.
import { parseArgs, list, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, rel } from './lib/paths.mjs';
import { cueContext, remapBody, splitNotes, auditBody } from './lib/cuenotes.mjs';

const a = parseArgs(process.argv.slice(2), { boolean: ['help', 'fix', 'show'], string: ['slug', 'dir', 'cues'] });
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const cues = readJson(P.score.cues);
const timeline = readJson(P.narration.timeline);
const want = new Set(list(a.cues));
let dirty = 0;
for (const c of cues) {
  if (want.size && !want.has(c.id)) continue;
  const { head, body } = splitNotes(c.notes);
  if (!body) continue;
  const ctx = cueContext(c, timeline);
  const before = auditBody(body, ctx);
  const r = remapBody(body, ctx);
  const changed = r.body !== body;
  if (before.stale.length || before.bare.length) dirty++;
  console.log(`${c.id}: ${before.stale.length} stale anchored time(s), ${before.bare.length} bare time(s); typical move ${r.shift >= 0 ? '+' : ''}${r.shift} s${r.unresolved.length ? `; unresolved anchors (number dropped): ${r.unresolved.join(', ')}` : ''}`);
  if (before.stale.length) console.log(`   stale: ${before.stale.slice(0, 8).map((s) => `'${s.anchor}' ${s.at} -> ${s.now}`).join(' | ')}${before.stale.length > 8 ? ' …' : ''}`);
  if (a.show && changed) console.log(`   --- body now:\n${r.body}\n`);
  if (a.fix && changed) c.notes = `${head}\n\n${r.body}`;
}
if (a.fix) {
  writeJson(P.score.cues, cues);
  const left = cues.filter((c) => (!want.size || want.has(c.id)) && splitNotes(c.notes).body).map((c) => auditBody(splitNotes(c.notes).body, cueContext(c, timeline))).filter((x) => x.stale.length || x.bare.length).length;
  console.log(`fixed → ${rel(P.score.cues)}; cue bodies still carrying stale or bare times: ${left}`);
  process.exitCode = left ? 1 : 0;
} else process.exitCode = dirty ? 1 : 0;
