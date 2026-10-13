#!/usr/bin/env node
// STT round trip — proof, as data, that the voice says the names and numbers the lexicon respells.
//
//   npm run film:stt -- --slug <slug> [--lines L0104,L0108] [--force] [--dry-run] [--dir <filmDir>]
//
// Targets: every script line where a voice/lexicon.json entry fires, plus lines whose script entry sets
// qa: {stt: "required", expect: [terms]}. Each target clip (narration/clips/<id>.wav) goes through ElevenLabs
// speech-to-text (scribe_v1) once per clip version; the record lands in narration/stt.json:
//   { lineId, model, transcript, expectedTerms: [{term, accept, found}], pass, sig (sha of the clip), lineSig, wer, at }
// Accepted forms of a term are its written and spoken (lexicon) forms; number words count as digits.
// Current records (same clip sig, passing) are skipped unless --force. film:narrate runs this after every
// narration pass (unless --no-stt). QA narration.stt passes only when every target has a passing, current record.
// STT checks words, not stress: voice/voice.json listening[] carries the human sign-off for stress.
// Exit 1 if any target fails or errors.
import { parseArgs, list, helpText } from './lib/args.mjs';
import { filmPaths, readJson, rel } from './lib/paths.mjs';
import { loadLexicon } from './lib/voicecfg.mjs';
import { refreshStt, sttPath } from './lib/stt.mjs';

const a = parseArgs(process.argv.slice(2), { boolean: ['help', 'force', 'dry-run'], string: ['slug', 'dir', 'lines'] });
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const script = readJson(P.script);
const linesDoc = readJson(P.narration.lines, null);
if (!linesDoc) {
  console.error('error: no narration/lines.json — run film:narrate first');
  process.exit(1);
}
const r = await refreshStt(P, { script, lex: loadLexicon(P), linesDoc, only: list(a.lines), force: !!a.force, dryRun: !!a['dry-run'] });
for (const e of r.errors) console.error(`  error: ${e}`);
const failing = r.targets.filter((id) => r.records[id] && !r.records[id].pass);
console.log(`stt: ${r.targets.length} target lines (${r.targets.join(', ') || 'none'}); ${a["dry-run"] ? "would transcribe" : "transcribed"} ${r.checked.length}, current ${r.skipped.length}${failing.length ? `; FAILING ${failing.join(', ')}` : ''} → ${rel(sttPath(P))}`);
if (r.errors.length || failing.length) process.exitCode = 1;
