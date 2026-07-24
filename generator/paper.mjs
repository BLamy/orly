// Acquire a research paper (arXiv id / abstract / HTML) and build a focused
// "digest" for scene authoring — PLUS download the paper's own figures, GIFs,
// and video clips so a book can embed them on-stage (see the `Figure`
// primitive). This is the paper-shaped sibling of `repo.mjs`: same digest
// contract, but the source is a paper instead of a code tree.
//
//   import { acquireAndDigest, downloadFigures } from './generator/paper.mjs'
//   const d = await acquireAndDigest({ paper: '2607.13285', prompt: '...' })
//   await downloadFigures({ id: d.id, outDir: 'public/generated/<slug>/figures' })
//
// Networking uses global fetch (Node ≥18). arXiv's HTML rendering
// (https://arxiv.org/html/<id>) carries the full sectioned text and <img>
// figures; we fall back to the abstract page if HTML isn't available yet.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const UA = 'orly-explainer-bookshelf/1.0 (+https://orly.brett-lamy.workers.dev)';
const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.gif']); // gif treated as clip-ish

// Normalize "arXiv:2607.13285", a full abs/html URL, or a bare id → "2607.13285".
export function arxivId(input) {
  const s = String(input).trim();
  const m = s.match(/(\d{4}\.\d{4,5})(v\d+)?/);
  if (!m) throw new Error(`Not a recognizable arXiv id: ${input}`);
  return m[1] + (m[2] || '');
}

async function fetchText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } });
  if (!r.ok) throw new Error(`GET ${url} → ${r.status}`);
  return await r.text();
}

// Very small HTML→text: drop scripts/styles, keep <h*> as markdown headings,
// collapse everything else to readable prose. Not a parser — a digest tool.
function htmlToText(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<figure[\s\S]*?<\/figure>/gi, (m) => {
      const cap = (m.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i) || [])[1] || '';
      return `\n[FIGURE] ${stripTags(cap)}\n`;
    })
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, _l, t) => `\n\n## ${stripTags(t).trim()}\n`)
    .replace(/<(p|div|section|li|tr|br)[^>]*>/gi, '\n');
  s = stripTags(s);
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(+n))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Pull every <img>/<source>/<video> asset out of the arXiv HTML, resolving
// relative URLs against the page. Returns [{url, caption, type}] in doc order.
function extractMedia(html, baseUrl) {
  const media = [];
  const seen = new Set();
  const push = (rawUrl, caption, forcedType) => {
    if (!rawUrl) return;
    let url;
    try {
      url = new URL(rawUrl, baseUrl).href;
    } catch {
      return;
    }
    if (seen.has(url)) return;
    seen.add(url);
    const ext = extname(new URL(url).pathname).toLowerCase();
    const type = forcedType || (VIDEO_EXT.has(ext) && ext !== '.gif' ? 'video' : ext === '.gif' ? 'gif' : IMG_EXT.has(ext) ? 'image' : null);
    if (!type) return;
    media.push({ url, caption: caption ? stripTags(caption) : '', type });
  };

  // <figure> blocks give us an image + its caption together.
  const figRe = /<figure[\s\S]*?<\/figure>/gi;
  let fm;
  while ((fm = figRe.exec(html))) {
    const block = fm[0];
    const cap = (block.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i) || [])[1] || '';
    const vid = block.match(/<video[\s\S]*?<\/video>/i);
    if (vid) {
      const srcs = [...vid[0].matchAll(/<source[^>]*\ssrc=["']([^"']+)["']/gi)].map((m) => m[1]);
      const poster = (vid[0].match(/\bposter=["']([^"']+)["']/i) || [])[1];
      if (srcs[0]) push(srcs[0], cap, 'video');
      else if (poster) push(poster, cap, 'image');
    }
    for (const im of block.matchAll(/<img[^>]*\ssrc=["']([^"']+)["']/gi)) push(im[1], cap);
  }
  // Any remaining standalone <img> (schematics outside <figure>).
  for (const im of html.matchAll(/<img[^>]*\ssrc=["']([^"']+)["']/gi)) push(im[1], '');
  // Filter arXiv chrome (logos, math glyphs rendered as tiny images).
  return media.filter((m) => !/(logo|arxiv-logo|\/static\/|mathjax|\.svg$)/i.test(m.url));
}

// Fetch a paper and return the digest contract (+ media list, + metadata).
export async function acquireAndDigest({ paper, prompt = '', maxChars = 95000 }) {
  const id = arxivId(paper);
  const htmlUrl = `https://arxiv.org/html/${id}`;
  const absUrl = `https://arxiv.org/abs/${id}`;

  let title = '';
  let abstract = '';
  let bodyText = '';
  let media = [];
  let source = htmlUrl;

  try {
    const html = await fetchText(htmlUrl);
    title = stripTags((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    media = extractMedia(html, htmlUrl);
    bodyText = htmlToText(html);
  } catch (e) {
    // HTML render not up yet — fall back to the abstract page.
    source = absUrl;
    const abs = await fetchText(absUrl);
    title = stripTags((abs.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    abstract = stripTags((abs.match(/<blockquote class="abstract[^>]*>([\s\S]*?)<\/blockquote>/i) || [])[1] || '');
    bodyText = abstract;
  }

  const digest =
    `# PAPER DIGEST — arXiv:${id}\n\n` +
    `Source: ${source}\n` +
    `Title: ${title}\n` +
    (prompt ? `Focus: ${prompt}\n` : '') +
    `\nFigures/clips available to embed: ${media.length}\n` +
    media.map((m, i) => `  [${i}] ${m.type} — ${m.caption || m.url}`).join('\n') +
    `\n\n## Full text\n\n` +
    bodyText.slice(0, maxChars);

  return {
    id,
    digest,
    title,
    media,
    chosen: media.map((m) => m.url),
    slugBase: `arxiv-${id.replace(/\./g, '-')}`,
    cleanup: () => {},
  };
}

// Download a chosen subset of media into outDir. `pick` optionally restricts to
// indices (into the `media` array); by default all are fetched. Returns the
// saved asset records with local paths + the absolute web path to reference.
export async function downloadFigures({ media, outDir, webBase, pick }) {
  mkdirSync(outDir, { recursive: true });
  const chosen = pick ? pick.map((i) => media[i]).filter(Boolean) : media;
  const saved = [];
  let n = 0;
  for (const m of chosen) {
    n += 1;
    let ext = extname(new URL(m.url).pathname).toLowerCase();
    if (!ext || ext.length > 5) ext = m.type === 'video' ? '.mp4' : '.png';
    const name = `fig-${String(n).padStart(2, '0')}${ext}`;
    try {
      const r = await fetch(m.url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error(`GET ${m.url} → ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      writeFileSync(join(outDir, name), buf);
      saved.push({
        name,
        file: join(outDir, name),
        web: `${webBase.replace(/\/$/, '')}/${name}`,
        caption: m.caption,
        type: m.type,
        bytes: buf.length,
        src: m.url,
      });
    } catch (e) {
      saved.push({ name, error: String(e.message || e), src: m.url, caption: m.caption, type: m.type });
    }
  }
  return saved;
}

// CLI: `node generator/paper.mjs <arxiv-id> [slug]` — digest to stdout and
// download figures into public/generated/<slug>/figures/ for authoring.
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , paperArg, slugArg] = process.argv;
  if (!paperArg) {
    console.error('usage: node generator/paper.mjs <arxiv-id> [slug]');
    process.exit(1);
  }
  const d = await acquireAndDigest({ paper: paperArg });
  const slug = slugArg || d.slugBase;
  const outDir = `public/generated/${slug}/figures`;
  console.error(`paper ${d.id}: "${d.title}" — ${d.media.length} media, digest ${d.digest.length} chars`);
  const digestPath = `/tmp/paper-${d.id}.txt`;
  writeFileSync(digestPath, d.digest);
  console.error(`digest → ${digestPath}`);
  const saved = await downloadFigures({ media: d.media, outDir, webBase: `/generated/${slug}/figures` });
  writeFileSync(join(outDir, 'index.json'), JSON.stringify(saved, null, 2));
  const ok = saved.filter((s) => !s.error);
  console.error(`figures → ${outDir}  (${ok.length}/${saved.length} downloaded)`);
  for (const s of saved) console.error(`  ${s.error ? 'ERR ' : 'ok  '}${s.name}  ${s.caption?.slice(0, 70) || s.src}`);
}
