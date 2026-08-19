#!/usr/bin/env node
// Prepare and validate a book's written companion post.
//
//   node generator/blog-viz.mjs --slug <slug>
//
// New posts are authored as section-level markdown: one `###` section heading,
// lead paragraph, and live `{% viz %}` block per visual section. If an older
// post still contains cue figures, this compatibility path bundles contiguous
// cues into at most four sections per chapter before validating the result.
// The manifest's cues are used only as section-clock boundaries; no image,
// GIF, MP4, or WebM asset is created.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_SECTIONS_PER_CHAPTER = 4;

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

const chapters = manifest.chapters ?? [];
const chaptersByNumber = new Map(chapters.map((chapter) => [chapter.number, chapter]));
const chaptersByScene = new Map(chapters.map((chapter) => [chapter.scene, chapter]));
const source = fs.readFileSync(blogPath, 'utf8');

function quoteAttr(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('"', '&quot;');
}

function cueStart(chapter, cueIndex) {
  const cues = chapter.cues?.length ? chapter.cues : [0];
  const start = Number(cues[cueIndex] ?? chapter.duration ?? 0);
  if (!Number.isFinite(start)) throw new Error(`invalid cue start chapter ${chapter.number}, cue ${cueIndex}`);
  return start;
}

function sectionRange(chapter, firstCue, nextCue) {
  const from = cueStart(chapter, firstCue);
  const to = nextCue < (chapter.cues?.length ?? 0)
    ? cueStart(chapter, nextCue)
    : Number(chapter.duration);
  if (!Number.isFinite(to) || to <= from) {
    throw new Error(`invalid section range chapter ${chapter.number}: ${from}..${to}`);
  }
  return { from, to };
}

function vizBlock(chapter, section, cue, from, to, title) {
  return [
    `{% viz scene="${quoteAttr(chapter.scene)}" section="${quoteAttr(section)}" cue="${cue}" from="${from.toFixed(3)}" to="${to.toFixed(3)}" title="${quoteAttr(title)}" %}`,
    '{% endviz %}',
  ].join('\n');
}

const FIGURE_RE = /<figure><img src="\/generated\/([^/]+)\/blog\/chapter-(\d+)-(\d+)\.png" alt="([^"]*)"><figcaption>([\s\S]*?)<\/figcaption><\/figure>/g;
function parseAttrs(raw) {
  const attrs = {};
  for (const match of raw.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[match[1]] = match[2];
  return attrs;
}

function firstSentence(text) {
  const clean = text.trim().replace(/\s+/g, ' ');
  return (clean.match(/^.*?[.!?](?:\s|$)/)?.[0] ?? clean).replace(/[.!?]+$/, '');
}

function legacyChapterBody(body, chapter, figureSlug) {
  const figures = [...body.matchAll(FIGURE_RE)].map((match) => ({
    cue: Number(match[3]),
    caption: match[5].trim(),
    index: match.index,
    end: match.index + match[0].length,
  }));
  if (!figures.length) return { body, converted: 0 };
  if (figureSlug !== slug) throw new Error(`blog figure points at ${figureSlug}, expected ${slug}`);
  if (figures.some((figure) => figure.cue < 0 || figure.cue >= (chapter.cues?.length || 1))) {
    throw new Error(`blog figure references a missing cue in chapter ${chapter.number}`);
  }
  figures.sort((a, b) => a.cue - b.cue);

  const targetCount = Math.min(MAX_SECTIONS_PER_CHAPTER, figures.length);
  const groupSize = Math.ceil(figures.length / targetCount);
  const prefix = body.slice(0, figures[0].index).trimEnd();
  const suffix = body.slice(figures.at(-1).end).trimStart();
  const rendered = [];

  for (let offset = 0; offset < figures.length; offset += groupSize) {
    const group = figures.slice(offset, offset + groupSize);
    const sectionNumber = rendered.length + 1;
    const nextCue = figures[offset + group.length]?.cue ?? (chapter.cues?.length ?? 1);
    const { from, to } = sectionRange(chapter, group[0].cue, nextCue);
    const lead = group[0].caption;
    const after = group.slice(1).map((figure) => figure.caption).join(' ');
    const section = `${slug}-chapter-${chapter.number}-section-${sectionNumber}`;
    const title = `Section ${sectionNumber} · ${firstSentence(lead)}`;
    rendered.push(
      [
        `### ${title}`,
        '',
        lead,
        '',
        vizBlock(chapter, section, group[0].cue, from, to, title),
        ...(after ? ['', after] : []),
      ].join('\n'),
    );
  }

  const pieces = [];
  if (prefix) pieces.push(prefix);
  pieces.push(...rendered);
  if (suffix) pieces.push(suffix);
  return { body: `\n\n${pieces.join('\n\n')}\n`, converted: figures.length };
}

function convertLegacyFigures(markdown) {
  const headings = [...markdown.matchAll(/^## [^\n]+\n/gm)];
  if (!headings.length) return { markdown, converted: 0 };
  let output = '';
  let cursor = 0;
  let converted = 0;

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const bodyStart = heading.index + heading[0].length;
    const bodyEnd = headings[i + 1]?.index ?? markdown.length;
    const body = markdown.slice(bodyStart, bodyEnd);
    const figure = body.match(FIGURE_RE);
    if (!figure) {
      output += markdown.slice(cursor, bodyEnd);
      cursor = bodyEnd;
      continue;
    }
    const figureMatch = figure[0].match(/chapter-(\d+)-/);
    const chapterNumber = Number(figureMatch?.[1]);
    const chapter = chaptersByNumber.get(chapterNumber);
    if (!chapter) throw new Error(`blog figure references missing chapter ${chapterNumber}`);
    const figureSlug = figure[0].match(/<img src="\/generated\/([^/]+)\//)?.[1];
    const result = legacyChapterBody(body, chapter, figureSlug);
    output += markdown.slice(cursor, bodyStart);
    output += result.body;
    converted += result.converted;
    cursor = bodyEnd;
  }

  output += markdown.slice(cursor);
  return { markdown: output, converted };
}

function validateSectionShape(markdown, blocks) {
  const headings = (markdown.match(/^### [^\n]+$/gm) ?? []).length;
  if (headings < blocks.length) {
    throw new Error(`blog has ${blocks.length} live viz blocks but only ${headings} section headings; add one ### heading and lead paragraph per block`);
  }
  const lines = markdown.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!/\{\%\s*viz\s+/.test(lines[i])) continue;
    let heading = i - 1;
    while (heading >= 0 && !lines[heading].trim()) heading--;
    while (heading >= 0 && !/^### [^\n]+$/.test(lines[heading])) heading--;
    if (heading < 0 || !lines.slice(heading + 1, i).some((line) => line.trim())) {
      throw new Error(`live viz block on line ${i + 1} needs a ### title followed by a lead paragraph`);
    }
  }
}

function validateLiveBlocks(markdown) {
  const blocks = [];
  for (const match of markdown.matchAll(/\{\%\s*viz\s+([^%]*?)\s*\%\}/g)) {
    const attrs = parseAttrs(match[1]);
    const scene = attrs.scene;
    const from = Number(attrs.from);
    const to = Number(attrs.to);
    const chapter = chaptersByScene.get(scene);
    if (!scene || !chapter || !Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
      throw new Error(`invalid live viz block: ${match[0]}`);
    }
    if (!attrs.section) throw new Error(`live viz block is missing section="...": ${match[0]}`);
    const duration = Number(chapter.duration);
    if (from < -0.001 || to > duration + 0.001) {
      throw new Error(`viz section ${attrs.section} falls outside ${scene} duration ${duration}: ${from}..${to}`);
    }
    blocks.push({ scene, section: attrs.section, from, to });
  }

  if (/<(?:figure|img)\b/i.test(markdown)) throw new Error('blog still contains image/figure markup');
  if (!blocks.length) throw new Error('blog contains no live viz blocks');
  validateSectionShape(markdown, blocks);

  const byScene = new Map();
  for (const block of blocks) {
    const list = byScene.get(block.scene) ?? [];
    list.push(block);
    byScene.set(block.scene, list);
  }
  for (const [scene, list] of byScene) {
    list.sort((a, b) => a.from - b.from);
    for (let i = 1; i < list.length; i++) {
      const previous = list[i - 1];
      const current = list[i];
      // Adjacent half-open windows share no rendered frame. A positive
      // overlap would make two blog sections show the same source interval.
      if (current.from < previous.to - 0.001) {
        throw new Error(`overlapping viz sections in ${scene}: ${previous.section} and ${current.section}`);
      }
    }
  }
  return blocks;
}

const converted = convertLegacyFigures(source);
if (converted.converted) fs.writeFileSync(blogPath, converted.markdown);
const blocks = validateLiveBlocks(converted.markdown);
console.log(
  `${converted.converted ? `bundled ${converted.converted} legacy cue figure(s) and ` : ''}` +
  `validated ${blocks.length} non-overlapping live Docstream blog section(s) in ${blogPath}`,
);
