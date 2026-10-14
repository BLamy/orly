#!/usr/bin/env node
// book-grades.mjs — publish the shelf's Grades tab data (apps/bookshelf/src/library/GradesPanel.tsx).
//
//   node generator/book-grades.mjs [--from docs/book-grades/2026-10-13-haiku.json]
//
// Reads a grading run (docs/book-grades/<date>-<grader>.json: the eight-dimension rubric of docs/book-quality.md §4,
// one entry per book) plus every film's own critic review (public/generated/<slug>/review.json, written by the film
// pipeline), and writes public/generated/book-grades.json: films first (their excellence-gate review), then books,
// each with scores, mean, pass, per-dimension notes, issues and best moment. Defaults to the newest run.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const runsDir = join(ROOT, 'docs', 'book-grades');
const from = argv.includes('--from')
  ? join(ROOT, argv[argv.indexOf('--from') + 1])
  : join(runsDir, readdirSync(runsDir).filter((f) => f.endsWith('.json')).sort().at(-1));
const run = JSON.parse(readFileSync(from, 'utf8'));
const lib = JSON.parse(readFileSync(join(ROOT, 'public', 'generated', 'library.json'), 'utf8')).books;
const meta = new Map(lib.map((b) => [b.slug, b]));
const DIMS = ['accuracy', 'depth', 'clarity', 'story', 'visual', 'sync', 'sound', 'curiosity'];
const round2 = (x) => Math.round(x * 100) / 100;

const films = lib
  .filter((b) => b.kind === 'film' && existsSync(join(ROOT, 'public', 'generated', b.slug, 'review.json')))
  .map((b) => {
    const r = JSON.parse(readFileSync(join(ROOT, 'public', 'generated', b.slug, 'review.json'), 'utf8'));
    return {
      slug: b.slug,
      kind: 'film',
      title: b.title,
      subtitle: b.subtitle,
      href: b.href,
      scores: r.scores,
      mean: r.mean,
      pass: r.pass,
      notes: r.notes || {},
      issues: [],
      gradedBy: `film critic panel, round ${r.round}`,
      at: r.at,
    };
  });

const books = run.books
  .filter((g) => meta.has(g.slug))
  .map((g) => {
    const b = meta.get(g.slug);
    const mean = round2(DIMS.reduce((n, k) => n + g.scores[k], 0) / DIMS.length);
    return {
      slug: g.slug,
      kind: 'book',
      title: b.title,
      subtitle: b.subtitle,
      series: b.series,
      href: b.href || `?bundle=${g.slug}`,
      scores: g.scores,
      mean,
      pass: DIMS.every((k) => g.scores[k] >= 8) && mean >= 8.5 && !(g.issues || []).some((i) => i.severity === 'critical'),
      notes: g.notes || {},
      issues: (g.issues || []).map(({ chapter, severity, problem, fix }) => ({ chapter, severity, problem, fix })),
      bestMoment: g.bestMoment,
      confidence: g.confidence,
      gradedBy: g.gradedBy,
    };
  })
  .sort((a, b) => b.mean - a.mean);

const out = {
  version: 1,
  run: from.replace(`${ROOT}/`, ''),
  date: run.date,
  rubric: run.rubric,
  graders: run.graders,
  bar: 8.5,
  floor: 8,
  dims: DIMS,
  entries: [...films, ...books],
};
writeFileSync(join(ROOT, 'public', 'generated', 'book-grades.json'), JSON.stringify(out));
console.log(`public/generated/book-grades.json: ${films.length} films + ${books.length} books from ${out.run}`);
