#!/usr/bin/env node
// Shot-file overwrite guard (review round 3: ch08-s05's fix was measured at 05:11Z, then a later pass wrote its own,
// older version of the file over it at 05:32Z). Every pass that edits a shot file brackets its work with:
//
//   node generator/film/shot-guard.mjs read   --slug <s> --shot <id> --owner <label>   at task start (and after a merge)
//   node generator/film/shot-guard.mjs check  --slug <s> --shot <id> --owner <label>   right BEFORE every write
//   node generator/film/shot-guard.mjs commit --slug <s> --shot <id> --owner <label>   right AFTER the write
//   node generator/film/shot-guard.mjs log    --slug <s> --shot <id>
//
// read    records the sha of the file this owner is working from and snapshots that version.
// check   exit 0 when the file on disk is still the version this owner read; EXIT 3 when someone else changed it
//         since (concurrent group, critic/reviser, a resumed or earlier pass): it prints the two snapshot paths. Re-read
//         the CURRENT file, merge your edits onto it (never write your stale copy back), then `read` again.
// commit  records the new version (snapshot + sha) as the shot's latest, by this owner. EXIT 4 when the version this
//         owner had read was not the latest committed one (the write skipped `check`, or raced it): the overwritten
//         version's snapshot path is printed so the change can be restored and merged.
// State: films/<slug>/qa/shot-guard/guard.json {shots: {<id>: {latest: {sha, owner, at}, views: {<owner>: {sha, at}},
// history: [...]}}} and versions/<id>/<sha>.tsx. Owners are free-form labels, unique per pass (e.g. "author:ch08-s05:r3").
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, rel } from './lib/paths.mjs';
import { withLock, shotFile, shotSha } from './lib/shotledger.mjs';

const a = parseArgs(process.argv.slice(2), { boolean: ['help'], string: ['slug', 'dir', 'shot', 'owner'] });
const cmd = a._[0];
if (a.help || !a.slug || !cmd || !a.shot) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const G = path.join(P.qa.dir, 'shot-guard');
const GJ = path.join(G, 'guard.json');
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const snap = (id, sha) => {
  if (!sha) return null;
  const f = path.join(G, 'versions', id, `${sha}.tsx`);
  if (!fs.existsSync(f)) {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.copyFileSync(shotFile(P, id), f);
  }
  return rel(f);
};
const owner = a.owner || 'anonymous';
const id = a.shot;

const out = withLock(GJ, () => {
  const g = readJson(GJ, { shots: {} });
  const s = (g.shots[id] = g.shots[id] || { latest: null, views: {}, history: [] });
  const cur = shotSha(P, id);
  let code = 0;
  let msg;
  if (cmd === 'read') {
    s.views[owner] = { sha: cur, at: now() };
    if (!s.latest && cur) s.latest = { sha: cur, owner: 'baseline', at: now() };
    msg = { shot: id, owner, sha: cur, snapshot: snap(id, cur) };
  } else if (cmd === 'check') {
    const v = s.views[owner];
    if (!v) {
      code = 3;
      msg = { shot: id, owner, error: 'no `read` recorded for this owner: run `shot-guard read` and re-read the file first' };
    } else if (v.sha !== cur) {
      code = 3;
      msg = { shot: id, owner, error: `CHANGED since you read it (you read ${v.sha} at ${v.at}; now ${cur}, latest commit by ${s.latest?.owner ?? '?'} at ${s.latest?.at ?? '?'}). Re-read the current file, merge your edits onto it, then run read again.`, yourVersion: path.join(rel(G), 'versions', id, `${v.sha}.tsx`), current: snap(id, cur) };
    } else msg = { shot: id, owner, ok: true, sha: cur };
  } else if (cmd === 'commit') {
    const v = s.views[owner];
    const base = v?.sha ?? null;
    const latest = s.latest?.sha ?? null;
    const entry = { sha: cur, owner, at: now(), base };
    if (latest && base !== latest && latest !== cur) {
      code = 4;
      entry.overwrote = latest;
      msg = { shot: id, owner, error: `your write replaced ${s.latest.owner}'s version ${latest} (you had read ${base ?? 'nothing'}): merge their changes back in`, overwritten: path.join(rel(G), 'versions', id, `${latest}.tsx`) };
    } else msg = { shot: id, owner, ok: true, sha: cur };
    snap(id, cur);
    s.history = [...(s.history || []), entry].slice(-30);
    s.latest = { sha: cur, owner, at: entry.at };
    s.views[owner] = { sha: cur, at: entry.at };
  } else if (cmd === 'log') msg = { shot: id, current: cur, ...s };
  else {
    code = 2;
    msg = { error: `unknown command ${cmd}` };
  }
  if (cmd !== 'log') writeJson(GJ, g);
  return { code, msg };
});
console.log(JSON.stringify(out.msg));
process.exitCode = out.code;
