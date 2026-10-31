// films/<slug>/film.json — the stage ledger (ARCHITECTURE §1.5, §3).
//
//   readFilm(P)                         -> { slug, stages: {}, budgets: {}, ... } (never throws on missing)
//   stageStart(P, 'narration', { args })   status 'running'
//   stageDone(P, 'narration', { outputs, metrics })   status 'done'
//   stageBlocked(P, 'narration', 'quota exceeded: resume with npm run film:narrate -- --slug x')
//   stageFailed(P, 'render', err)
//   budget(P, 'narrationCredits', 40000) -> number (film.json budgets override the default)
//
// Updates are read-modify-write of only `stages.<name>` so concurrent workflow writers of other
// top-level keys (research/story/review) are preserved.
import { readJson, writeJson } from './paths.mjs';
import { redact } from './env.mjs';

export function readFilm(P) {
  const f = readJson(P.ledger, {});
  if (!f.slug) f.slug = P.slug;
  if (!f.stages || typeof f.stages !== 'object') f.stages = {};
  return f;
}

export function updateStage(P, stage, patch) {
  const f = readFilm(P);
  const prev = f.stages[stage] || {};
  f.stages[stage] = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  writeJson(P.ledger, f, 2);
  return f.stages[stage];
}

const tool = () => `generator/film/${process.argv[1]?.split('/').pop() ?? '?'}`;

export const stageStart = (P, stage, extra = {}) =>
  updateStage(P, stage, { status: 'running', startedAt: new Date().toISOString(), tool: tool(), error: null, resume: null, ...extra });
export const stageDone = (P, stage, extra = {}) => updateStage(P, stage, { status: 'done', finishedAt: new Date().toISOString(), ...extra });
export const stageBlocked = (P, stage, resume, extra = {}) => updateStage(P, stage, { status: 'blocked', resume, ...extra });
export const stageFailed = (P, stage, err, extra = {}) =>
  updateStage(P, stage, { status: 'failed', error: redact(err?.message ?? String(err)).slice(0, 2000), ...extra });

export function budget(P, key, dflt) {
  const f = readFilm(P);
  const v = f.budgets?.[key];
  return Number.isFinite(Number(v)) && v !== null ? Number(v) : dflt;
}
