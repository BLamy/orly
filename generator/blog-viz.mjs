#!/usr/bin/env node
// Convert a book's legacy cue figures into live Docstream VizEmbed blocks.
//
//   node generator/blog-viz.mjs --slug <slug>
//
// The manifest's narration cues are consumed only here, for the blog's
// section windows. The normal chapter manifest/audio/player path is never
// rewritten. This generator emits no images or video files.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const slug = arg('slug');
if (!slug) {
  console.error('usage: node generator/blog-viz.mjs --slug <slug>');
  process.exit(2);
}

const bookDir = path.join(ROOT, 'public', 'generated', slug);
const manifestPath = path.join(bookDir, 'manifest.json');
const blogPath = path.join(bookDir, 'blog.md');
if (!fs.existsSync(manifestPath)) throw new Error(`no manifest at ${manifestPath}`);
if (!fs.existsSync(blogPath)) throw new Error(`no blog at ${blogPath}`);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.format !== 3) throw new Error(`"${slug}" is not a format-3 book`);

const chapters = new Map((manifest.chapters ?? []).map((chapter) => [chapter.number, chapter]));
const source = fs.readFileSync(blogPath, 'utf8');

function quoteAttr(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('"', '&quot;');
}

function cueRange(chapter, cueIndex) {
  const cues = chapter.cues?.length ? chapter.cues : [0];
  const from = Number(cues[cueIndex] ?? 0);
  const next = Number(cues[cueIndex + 1] ?? chapter.duration);
  if (!Number.isFinite(from) || !Number.isFinite(next) || next <= from) {
    throw new Error(`invalid cue range chapter ${chapter.number}, cue ${cueIndex}`);
  }
  return { from, to: next };
}

function vizBlock(chapter, cueIndex, title) {
  const { from, to } = cueRange(chapter, cueIndex);
  const scene = chapter.scene;
  return [
    `{% viz scene="${quoteAttr(scene)}" cue="${cueIndex}" from="${from.toFixed(3)}" to="${to.toFixed(3)}" title="${quoteAttr(title)}" %}`,
    '{% endviz %}',
    '',
    title,
  ].join('\n');
}

let converted = 0;
const figureRe = /<figure><img src="\/generated\/([^/]+)\/blog\/chapter-(\d+)-(\d+)\.png" alt="([^"]*)"><figcaption>([\s\S]*?)<\/figcaption><\/figure>/g;
const output = source.replace(figureRe, (whole, figureSlug, chapterNumber, cueIndex, _alt, caption) => {
  if (figureSlug !== slug) throw new Error(`blog figure points at ${figureSlug}, expected ${slug}`);
  const chapter = chapters.get(Number(chapterNumber));
  if (!chapter) throw new Error(`blog figure references missing chapter ${chapterNumber}`);
  const index = Number(cueIndex);
  if (!Number.isInteger(index) || index < 0 || index >= (chapter.cues?.length || 1)) {
    throw new Error(`blog figure references missing cue ${chapterNumber}-${cueIndex}`);
  }
  converted++;
  return vizBlock(chapter, index, caption.trim());
});

if (converted === 0 && /<figure>|<img\b/i.test(source)) {
  throw new Error('blog contains figures/images, but none match the legacy cue format');
}

const vizBlocks = [...output.matchAll(/\{%\s*viz\s+([^%]*?)\s*%\}/g)];
for (const [, attrs] of vizBlocks) {
  const scene = attrs.match(/scene="([^"]+)"/)?.[1];
  const from = Number(attrs.match(/from="([^"]+)"/)?.[1]);
  const to = Number(attrs.match(/to="([^"]+)"/)?.[1]);
  if (!scene || !Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    throw new Error(`invalid live viz block: ${attrs}`);
  }
}

if (/<(?:figure|img)\b/i.test(output)) throw new Error('blog still contains image/figure markup');
if (!output.includes('{% viz ')) throw new Error('blog contains no live viz blocks');

fs.writeFileSync(blogPath, output);
console.log(`converted ${converted} cue figure(s) to live Docstream VizEmbed blocks in ${blogPath}`);
