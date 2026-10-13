// Where the film harness is served from, for render / stills / sheets.
//
//   const site = await openSite({ mode: 'build' | 'dev' | 'static', base?, staticDir?, rebuild? })
//   site.base   -> 'http://127.0.0.1:PORT'   site.key -> build identity (for segment resume)   await site.close()
//
// build (render default): `vite build` of apps/bookshelf into .orly-work/film-build/dist with publicDir off
//   (public/ is 1.4 GB of book audio), served by a tiny static server that falls back to the repo's
//   public/ for any file not in the build. --no-rebuild reuses the last build.
// dev (stills/sheets default): the running dev server ($FILM_DEV_URL or http://127.0.0.1:5199; start it
//   with `npm run film:dev`). static: serve any folder (e.g. a stub harness) as the site root.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ROOT, WORK, sha } from './paths.mjs';

export const DEV_URL = process.env.FILM_DEV_URL || 'http://127.0.0.1:5199';
const BUILD_DIR = path.join(WORK, 'film-build', 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav',
  '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.vtt': 'text/vtt',
};

export function serveStatic(roots, { spa = 'index.html' } = {}) {
  const server = http.createServer((req, res) => {
    let p;
    try {
      p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (p.endsWith('/')) p += 'index.html';
    for (const root of roots) {
      const f = path.join(root, p);
      if (!f.startsWith(root)) break;
      if (fs.existsSync(f) && fs.statSync(f).isFile()) {
        res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
        fs.createReadStream(f).pipe(res);
        return;
      }
    }
    const fallback = path.join(roots[0], spa);
    if (spa && !path.extname(p) && fs.existsSync(fallback)) {
      res.writeHead(200, { 'content-type': TYPES['.html'] });
      fs.createReadStream(fallback).pipe(res);
      return;
    }
    res.writeHead(404).end();
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve({ base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(() => r())) })),
  );
}

export function viteBuild(outDir = BUILD_DIR) {
  const code = `
    const { build } = await import('vite');
    await build({ root: process.cwd(), configFile: 'vite.config.ts', publicDir: false, logLevel: 'warn',
      build: { outDir: ${JSON.stringify(outDir)}, emptyOutDir: true, reportCompressedSize: false, sourcemap: false } });`;
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: path.join(ROOT, 'apps/bookshelf'), encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`vite build failed:\n${(r.stderr || r.stdout).trim().split('\n').slice(-25).join('\n')}`);
  return { outDir, ms: Date.now() - t0 };
}

async function devAlive(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return r.ok;
  } catch {
    return false;
  }
}

export async function openSite({ mode = 'build', base, staticDir, rebuild = true, log = console.error } = {}) {
  if (base) return { base: base.replace(/\/$/, ''), key: `base:${base}`, close: async () => {}, mode: 'base' };
  if (mode === 'dev') {
    if (!(await devAlive(DEV_URL))) throw new Error(`dev server not answering at ${DEV_URL} — start it with: npm run film:dev`);
    return { base: DEV_URL, key: null, close: async () => {}, mode };
  }
  if (mode === 'static') {
    const dir = path.resolve(staticDir);
    const s = await serveStatic([dir]);
    return { ...s, key: `static:${sha(fs.readdirSync(dir).join(','))}`, mode };
  }
  if (rebuild || !fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    log('[site] vite build (publicDir off) …');
    const b = viteBuild(BUILD_DIR);
    log(`[site] built in ${(b.ms / 1000).toFixed(1)} s`);
  }
  const s = await serveStatic([BUILD_DIR, path.join(ROOT, 'public')]);
  return { ...s, key: `build:${sha(fs.readFileSync(path.join(BUILD_DIR, 'index.html')))}`, mode };
}
