import { useEffect, useState } from 'react';
import { ChapterPlayer } from './ChapterPlayer';

const ASSET_BASE =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

/** Manifest v3: each chapter is one authored viz scene + one narration MP3. */
export interface ChapterV3 {
  number: number;
  title: string;
  blurb?: string;
  /** slug in the src/viz scene registry, e.g. 'books/replay-qa/chapter-1' */
  scene: string;
  /** MP3 path relative to the book dir, e.g. 'audio/chapter-1.mp3' */
  audio?: string;
  /** caption start times (s) in the MP3, one per caption */
  cues?: number[];
  /** total length (s) */
  duration?: number;
}

export interface ManifestV3 {
  format: number;
  slug: string;
  title: string;
  subtitle?: string;
  animal?: string;
  accent?: string;
  chapters: ChapterV3[];
}

/** Format seconds as m:ss (blank for missing/zero). */
export function fmtDur(s?: number): string {
  if (!s || s < 1) return '';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function chapterFromUrl(count: number): number | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('chapter');
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : null;
}

/**
 * The v3 book player: chapter menu → one full-bleed scene per chapter, with
 * the ElevenLabs narration MP3 as the playback clock.
 */
export function BookPlayer({ slug }: { slug: string }) {
  const base = `${ASSET_BASE}generated/${slug}/`;
  const [manifest, setManifest] = useState<ManifestV3 | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** null = chapter menu; otherwise the 0-based playing chapter */
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${base}manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((m: ManifestV3) => {
        if (!alive) return;
        if (m.format !== 3) throw new Error(`unsupported manifest format ${m.format}`);
        setManifest(m);
        setCurrent(chapterFromUrl(m.chapters.length));
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [base]);

  if (error) return <div className="bp-loading">Couldn’t load “{slug}”: {error}</div>;
  if (!manifest) return <div className="bp-loading">Loading the book…</div>;

  const accent = manifest.accent ?? '#38bdf8';

  if (current === null) {
    return (
      <div className="bp" style={{ ['--accent' as string]: accent }}>
        <div className="bp-menu">
          <div className="bp-menu-inner">
            <a className="bp-back" href={ASSET_BASE}>
              ← Back to the shelf
            </a>
            <header className="bp-head">
              {manifest.animal && (
                <img
                  className="bp-animal"
                  src={`${base}${manifest.animal}`}
                  alt=""
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              )}
              <div className="bp-head-text">
                <div className="bp-eyebrow">The Secret Lives of Data</div>
                <h1 className="bp-title">{manifest.title}</h1>
                {manifest.subtitle && <p className="bp-sub">{manifest.subtitle}</p>}
                <p className="bp-meta">
                  {manifest.chapters.length}{' '}
                  {manifest.chapters.length === 1 ? 'chapter' : 'chapters'}
                  {fmtDur(manifest.chapters.reduce((s, c) => s + (c.duration ?? 0), 0)) &&
                    ` · ${fmtDur(manifest.chapters.reduce((s, c) => s + (c.duration ?? 0), 0))}`}
                </p>
              </div>
            </header>
            <ul className="bp-chapters">
              {manifest.chapters.map((c, i) => (
                <li key={c.number}>
                  <button className="bp-chapter" onClick={() => setCurrent(i)}>
                    <span className="bp-num">{String(c.number).padStart(2, '0')}</span>
                    <span className="bp-ctext">
                      <span className="bp-ctitle">{c.title}</span>
                      {c.blurb && <span className="bp-cblurb">{c.blurb}</span>}
                      {fmtDur(c.duration) && <span className="bp-cdur">{fmtDur(c.duration)}</span>}
                    </span>
                    <span className="bp-go" aria-hidden>
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="bp-foot">Space to play · ← / → chapters · Esc for this menu</div>
          </div>
        </div>
      </div>
    );
  }

  const chapter = manifest.chapters[current];
  return (
    <div className="bp" style={{ ['--accent' as string]: accent }}>
      <ChapterPlayer
        key={`${slug}/${chapter.number}`}
        base={base}
        chapter={chapter}
        bookTitle={manifest.title}
        index={current}
        count={manifest.chapters.length}
        nextTitle={manifest.chapters[current + 1]?.title}
        onPrev={current > 0 ? () => setCurrent(current - 1) : undefined}
        onNext={current < manifest.chapters.length - 1 ? () => setCurrent(current + 1) : undefined}
        onExit={() => setCurrent(null)}
      />
    </div>
  );
}
