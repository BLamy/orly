// Source package checks are dependency-free. --scenes also extracts native timelines.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(dir, '../..');
const read = f => JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
const script = read('series-script.json');
const plan = read('series-plan.json');
const provenance = read('provenance.json');
for (const [file, expected] of Object.entries(provenance.packageHashes)) {
  assert.equal(createHash('sha256').update(readFileSync(resolve(dir, file))).digest('hex'), expected, `Original package changed: ${file}`);
}
assert.equal(script.books.length, 6);
assert.equal(script.books.flatMap(b => b.chapters).length, 19);
assert.equal(script.books.flatMap(b => b.chapters.flatMap(c => c.captions)).length, script.statistics.captions);
assert.equal(script.series, plan.series);
assert.equal(new Set(script.books.map(b => b.slug)).size, 6);
for (const [i, book] of script.books.entries()) {
  assert.equal(book.order, i + 1);
  for (const field of ['title', 'subtitle', 'animal', 'accent']) assert.equal(book[field], plan.books[i][field]);
  for (const [j, chapter] of book.chapters.entries()) {
    assert.equal(chapter.number, j + 1);
    assert.ok(chapter.captions.every(c => typeof c === 'string' && c.length));
  }
}
if (process.argv.includes('--sources') || process.argv.includes('--live-sources')) {
  for (const [id, source] of Object.entries(script.sources)) {
    if (!source.path) continue;
    const snapshot = provenance.sources.find(s => s.id === id)?.snapshotFile;
    const file = snapshot && !process.argv.includes('--live-sources') ? resolve(dir, snapshot) : source.path;
    assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), source.sha256, `Source changed: ${id}`);
  }
}
if (process.argv.includes('--scenes')) {
  // Optional slug enables the required book-by-book verification workflow.
  const idx = process.argv.indexOf('--slug');
  const slug = idx >= 0 ? process.argv[idx + 1] : undefined;
  if (idx >= 0) assert.ok(script.books.some(b => b.slug === slug), 'Unknown or missing slug');
  const books = script.books.filter(b => !slug || b.slug === slug);
  const files = books.flatMap(b => b.chapters.map(c => ({
    book: b, chapter: c, file: resolve(root, `apps/bookshelf/src/viz/books/${b.slug}/chapter-${c.number}.tsx`),
  })));
  for (const { file } of files) assert.ok(existsSync(file), `Scene not authored: ${file}`);
  const { extractScene } = await import('../../generator/scene-captions.mjs');
  for (const { book, chapter, file } of files) {
    const actual = await extractScene(file);
    assert.deepEqual(actual.captions.map(c => c.text), chapter.captions, `${book.slug} chapter ${chapter.number}: narration mismatch`);
    assert.ok(existsSync(file.replace(/\.tsx$/, '.stories.tsx')), `Missing story: ${file}`);
    assert.ok(actual.duration > 0 && actual.captions.every(c => c.dur > 0));
    console.log(`${book.slug} chapter ${chapter.number}: ${actual.captions.length} exact captions`);
  }
}
console.log('Narration package and ordering verified. Scene verification only runs with --scenes.');
