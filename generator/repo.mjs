// Acquire a GitHub repo (or local path) and build a focused "digest" for the
// storyboard LLM: a relevant file subset + bounded source excerpts, ranked
// against the subsystem prompt with ripgrep.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative, extname, basename } from 'node:path';

const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', 'out', 'target', 'vendor', '.venv',
  '__pycache__', '.next', 'coverage', '.cache', 'tmp', '.turbo', '.nx',
]);
const SKIP_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2',
  '.ttf', '.eot', '.mp3', '.mp4', '.mov', '.zip', '.gz', '.tar', '.pdf', '.wasm',
  '.lock', '.map', '.snap', '.bin', '.pack',
]);
const SKIP_NAMES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock', 'cargo.lock',
  'poetry.lock', 'go.sum', 'gemfile.lock', 'bun.lockb',
]);
const STOPWORDS = new Set(
  'the a an of to in on and or for with how does do is are it its this that we our my your what when where which subsystem explain works flow data system through happens get got make made use used into from over under about please walk me'.split(' ')
);

// Resolve the input to a working directory: a local dir (used in place) or a
// sanitized shallow clone of a github.com repo into a temp dir.
export function acquireRepo(input) {
  const asPath = resolve(input);
  try {
    if (statSync(asPath).isDirectory()) {
      return { dir: asPath, cleanup: () => {}, slugBase: basename(asPath), remote: false };
    }
  } catch {
    /* not a local path */
  }
  const m = input.match(/(?:github\.com[/:])([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/i);
  if (!m) throw new Error(`Not a local directory or a recognizable github.com URL: ${input}`);
  const ownerRepo = m[1];
  if (!/^[\w.-]+\/[\w.-]+$/.test(ownerRepo)) throw new Error(`Refusing unusual repo path: ${ownerRepo}`);
  const url = `https://github.com/${ownerRepo}.git`;
  const dir = mkdtempSync(join(tmpdir(), 'repoexp-'));
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_LFS_SKIP_SMUDGE: '1' };
  const r = spawnSync(
    'git',
    ['clone', '--depth', '1', '--single-branch', '--filter=blob:none', '--no-tags', url, dir],
    { env, stdio: 'inherit', timeout: 180000 }
  );
  if (r.status !== 0) {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    throw new Error(`git clone failed for ${url}`);
  }
  return {
    dir,
    cleanup: () => { try { rmSync(dir, { recursive: true, force: true }); } catch {} },
    slugBase: ownerRepo.replace('/', '-').toLowerCase(),
    remote: true,
  };
}

function walk(dir, base, out, cap) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (out.length >= cap) return;
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
      walk(join(dir, e.name), base, out, cap);
    } else if (e.isFile()) {
      const ext = extname(e.name).toLowerCase();
      if (SKIP_EXT.has(ext) || e.name.endsWith('.min.js') || SKIP_NAMES.has(e.name.toLowerCase())) continue;
      const full = join(dir, e.name);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.size > 2 * 1024 * 1024) continue;
      out.push({ path: relative(base, full), size: st.size });
    }
  }
}

function keywords(prompt) {
  const words = prompt.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const idents = (prompt.match(/[A-Za-z_][A-Za-z0-9_]{3,}/g) || []).map((s) => s.toLowerCase());
  return [...new Set([...words, ...idents])];
}

// ripgrep match counts per file for one keyword (cwd = repo dir, paths relative).
function rgCounts(dir, kw) {
  const rg = spawnSync('rg', ['-c', '-i', '--no-messages', '--', kw, '.'], {
    cwd: dir, encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024,
  });
  const map = new Map();
  if (rg.status === 0 && rg.stdout) {
    for (const line of rg.stdout.split('\n')) {
      const idx = line.lastIndexOf(':');
      if (idx < 0) continue;
      const p = line.slice(0, idx).replace(/^\.\//, '');
      const c = parseInt(line.slice(idx + 1), 10) || 0;
      map.set(p, c);
    }
  }
  return map;
}

export function digestRepo({ dir, prompt, maxFiles = 30, maxChars = 95000 }) {
  const files = [];
  walk(dir, dir, files, 8000);
  const byPath = new Map(files.map((f) => [f.path, f]));
  const kws = keywords(prompt);
  const score = new Map(files.map((f) => [f.path, 0]));
  const hasRg = spawnSync('rg', ['--version'], { encoding: 'utf8' }).status === 0;

  for (const kw of kws) {
    if (hasRg) {
      for (const [p, c] of rgCounts(dir, kw)) if (score.has(p)) score.set(p, score.get(p) + c);
    }
  }
  // path / filename signal
  for (const f of files) {
    const lp = f.path.toLowerCase();
    let s = score.get(f.path) || 0;
    for (const kw of kws) if (lp.includes(kw)) s += 10;
    if (/readme/i.test(f.path)) s += 6;
    if (/(^|\/)(index|main|app|server|core|router|context|application)\.[jt]sx?$/i.test(f.path)) s += 3;
    score.set(f.path, s);
  }

  const ranked = files
    .filter((f) => (score.get(f.path) || 0) > 0)
    .sort((a, b) => (score.get(b.path) || 0) - (score.get(a.path) || 0));
  const chosen = (ranked.length ? ranked : files.slice(0, maxFiles)).slice(0, maxFiles);

  // Always include a README at the top if present.
  const readme = files.find((f) => /^readme(\.md|\.txt)?$/i.test(f.path));
  if (readme && !chosen.some((f) => f.path === readme.path)) chosen.unshift(readme);

  let out = `# REPO DIGEST\n\nThe following files were selected as most relevant to the subsystem prompt.\n\n## Relevant files\n`;
  out += chosen.map((f) => `- ${f.path}`).join('\n') + '\n';
  let used = out.length;
  for (const f of chosen) {
    let content;
    try { content = readFileSync(join(dir, f.path), 'utf8'); } catch { continue; }
    const budget = Math.max(1400, Math.floor((maxChars - used) / Math.max(1, chosen.length)));
    const slice = content.length > budget
      ? content.slice(0, budget) + `\n…(${content.length - budget} more chars truncated)`
      : content;
    const block = `\n## ${f.path}\n\`\`\`\n${slice}\n\`\`\`\n`;
    if (used + block.length > maxChars) break;
    out += block;
    used += block.length;
  }
  return { digest: out, fileCount: files.length, chosen: chosen.map((f) => f.path) };
}

export function acquireAndDigest({ repo, prompt, maxFiles, maxChars }) {
  const acq = acquireRepo(repo);
  try {
    const { digest, fileCount, chosen } = digestRepo({ dir: acq.dir, prompt, maxFiles, maxChars });
    return { digest, fileCount, chosen, slugBase: acq.slugBase, cleanup: acq.cleanup };
  } catch (e) {
    acq.cleanup();
    throw e;
  }
}
