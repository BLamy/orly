import { useEffect, useMemo, useState } from 'react';
import './book-sources.css';

/**
 * The sources under a book (public/generated/<slug>/sources.json, validated by generator/book-sources.mjs): every
 * factual claim the narration makes, chapter by chapter, with the code, docs or papers it rests on. Same idea as the
 * film's sources page (SourcesPanel), but a book plays one chapter at a time, so entries link to their chapter
 * instead of seeking a single clock.
 */
export interface BookSource {
  label: string;
  /** a web link (docs, paper, issue, blog) */
  url?: string;
  /** code in the explained repo: pinned `owner/repo@<sha>` plus a path and optional line range */
  repo?: string;
  path?: string;
  lines?: string;
  /** a short verbatim excerpt the claim rests on */
  quote?: string;
}
export interface BookClaim {
  id: string;
  claim: string;
  /** index of the narration caption that states it (0-based), for the reader to find it */
  caption?: number;
  status?: 'verified' | 'paraphrase' | 'inferred';
  sources: BookSource[];
}
export interface BookSourcesDoc {
  version: number;
  slug: string;
  chapters: { number: number; title?: string; claims: BookClaim[] }[];
}

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u.slice(0, 40);
  }
};

/** the link a source resolves to: its own url, else a GitHub permalink built from repo@sha + path + lines */
export function sourceHref(s: BookSource): string | undefined {
  if (s.url) return s.url;
  const m = s.repo?.match(/^([\w.-]+\/[\w.-]+)@([0-9a-f]{7,40})$/i);
  if (!m || !s.path) return undefined;
  const L = s.lines?.match(/^(\d+)(?:-(\d+))?$/);
  return `https://github.com/${m[1]}/blob/${m[2]}/${s.path}${L ? `#L${L[1]}${L[2] ? `-L${L[2]}` : ''}` : ''}`;
}
const sourceText = (s: BookSource) => (s.url ? hostOf(s.url) : `${s.path ?? ''}${s.lines ? `:${s.lines}` : ''}`);

export function BookSources({
  url,
  currentChapter,
  onChapter,
}: {
  url: string;
  /** 1-based number of the chapter now playing */
  currentChapter?: number;
  onChapter?: (number: number) => void;
}) {
  const [doc, setDoc] = useState<BookSourcesDoc | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: BookSourcesDoc) => alive && setDoc(d))
      .catch(() => alive && setDoc(null));
    return () => {
      alive = false;
    };
  }, [url]);

  const needle = q.trim().toLowerCase();
  const counts = useMemo(() => {
    const claims = doc?.chapters.reduce((n, c) => n + c.claims.length, 0) ?? 0;
    const links = new Set<string>();
    doc?.chapters.forEach((c) => c.claims.forEach((cl) => cl.sources.forEach((s) => links.add(sourceHref(s) ?? s.label))));
    return { claims, links: links.size };
  }, [doc]);
  if (!doc || !counts.claims) return null;

  return (
    <section className="bs" aria-label="Sources">
      <header className="bs-head">
        <strong>Sources</strong>
        <span>
          {counts.claims} claims · {counts.links} links
        </span>
        <input type="search" placeholder="Filter: a file, a word, a site…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter sources" />
      </header>
      {doc.chapters.map((ch) => {
        const claims = ch.claims.filter(
          (c) => !needle || [c.claim, ...c.sources.flatMap((s) => [s.label, s.path, s.url, s.quote])].some((x) => x?.toLowerCase().includes(needle)),
        );
        if (!claims.length) return null;
        return (
          <details key={ch.number} className="bs-ch" open={ch.number === currentChapter || !!needle}>
            <summary>
              <span className="bs-num">Chapter {ch.number}</span> {ch.title}
              {onChapter && (
                <button className="bs-go" onClick={(e) => (e.preventDefault(), onChapter(ch.number))} title="Play this chapter">
                  ▶
                </button>
              )}
            </summary>
            <ol className="bs-claims">
              {claims.map((c) => (
                <li key={c.id}>
                  <p>{c.claim}</p>
                  {c.status && c.status !== 'verified' && <span className="bs-tag">{c.status}</span>}
                  <ul className="bs-src">
                    {c.sources.map((s, i) => {
                      const href = sourceHref(s);
                      return (
                        <li key={i}>
                          {href ? (
                            <a href={href} target="_blank" rel="noopener">
                              {s.label}
                            </a>
                          ) : (
                            <span>{s.label}</span>
                          )}
                          <code>{sourceText(s)}</code>
                          {s.quote && <q>{s.quote}</q>}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </details>
        );
      })}
    </section>
  );
}
