// Read/update the library registry (public/generated/library.json) that the
// bookshelf renders.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { syncIssueBooks } from './sync-issue-books.mjs';

const PALETTE = [
  '#d6202b', '#1f6fb2', '#3a8b3a', '#e07b1a', '#6a3f9e',
  '#198a8a', '#b0277a', '#c79100', '#41607f', '#a01f3c',
];

const CHRONOLOGICAL_SERIES = new Set([
  'Daily Papers by Hugging Face',
  'Fresh from arXiv',
]);

export function colorForSlug(slug) {
  let h = 0;
  for (const c of String(slug)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function upsertBook(libPath, book) {
  let lib = { books: [] };
  if (existsSync(libPath)) {
    try { lib = JSON.parse(readFileSync(libPath, 'utf8')); } catch { /* start fresh */ }
  }
  if (!Array.isArray(lib.books)) lib.books = [];
  const i = lib.books.findIndex((b) => b.slug === book.slug);
  const merged = i >= 0 ? { ...lib.books[i], ...book } : { ...book };
  if (CHRONOLOGICAL_SERIES.has(merged.series)) delete merged.seriesOrder;
  if (i >= 0) lib.books[i] = merged;
  else lib.books.push(merged);
  // newest first
  lib.books.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  mkdirSync(dirname(libPath), { recursive: true });
  writeFileSync(libPath, JSON.stringify(lib, null, 2));
  // keep the "tweak a book" issue dropdown current
  try { syncIssueBooks({ libPath }); } catch { /* form may not exist yet */ }
  return lib;
}
