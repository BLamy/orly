/**
 * Sources under the film (generator/film/publish.mjs → sources.json, built by generator/film/lib/sources.mjs):
 * every claim the film states and every quotation it uses, chapter by chapter, with their source links. Each entry
 * carries the time of the shot that uses it (▶ seeks the film there), the chapter playing now is open and marked,
 * and a filter narrows everything to matching text, people or sites.
 */
import { useMemo, useState } from 'react';

interface SourceClaim {
  id: string;
  claim: string;
  date?: string;
  status?: string;
  sources?: string[];
  missing?: boolean;
}
interface SourceQuote {
  id: string;
  text: string;
  speaker?: string;
  date?: string;
  source?: string;
  context?: string;
}
interface SourcesDoc {
  chapters: { number: number; id: string; title: string; start: number; shots: { id: string; start: number; claims: SourceClaim[]; quotes?: SourceQuote[] }[] }[];
  offScreen?: (SourceQuote & { from?: string })[];
  counts?: { claims: number; quotes: number; sources: number };
}

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u.slice(0, 40);
  }
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** one chapter's claims and quotes, each once, at the first shot that uses it */
function collect(ch: SourcesDoc['chapters'][number]) {
  const claims = new Map<string, SourceClaim & { at: number }>();
  const quotes = new Map<string, SourceQuote & { at: number }>();
  for (const sh of ch.shots) {
    for (const c of sh.claims) if (!claims.has(c.id) && !c.missing) claims.set(c.id, { ...c, at: sh.start });
    for (const q of sh.quotes ?? []) if (!quotes.has(q.id)) quotes.set(q.id, { ...q, at: sh.start });
  }
  return { claims: [...claims.values()], quotes: [...quotes.values()] };
}

export function SourcesPanel({ doc, now, onSeek, pageUrl }: { doc: SourcesDoc; now: number; onSeek: (t: number) => void; pageUrl?: string }) {
  const [q, setQ] = useState('');
  const chapters = useMemo(() => doc.chapters.map((ch) => ({ ch, ...collect(ch) })), [doc]);
  const playing = useMemo(() => {
    let n = doc.chapters[0]?.number;
    for (const ch of doc.chapters) if (now >= ch.start - 1e-3) n = ch.number;
    return n;
  }, [doc, now]);
  const needle = q.trim().toLowerCase();
  const hit = (...xs: (string | undefined)[]) => !needle || xs.some((x) => x?.toLowerCase().includes(needle));

  return (
    <section className="fp-sources-panel" aria-label="Sources">
      <header>
        <strong>Sources</strong>
        {doc.counts && (
          <span>
            {doc.counts.claims} claims · {doc.counts.quotes} quotations · {doc.counts.sources} links
          </span>
        )}
        <input type="search" placeholder="Filter: a name, a word, a site…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter sources" />
        {pageUrl && (
          <a href={pageUrl} target="_blank" rel="noopener">
            Full sources page ↗
          </a>
        )}
      </header>
      {chapters.map(({ ch, claims, quotes }) => {
        const cs = claims.filter((c) => hit(c.claim, c.date, ...(c.sources ?? [])));
        const qs = quotes.filter((x) => hit(x.text, x.speaker, x.date, x.source));
        if (needle && !cs.length && !qs.length) return null;
        return (
          <details key={ch.id} open={!!needle || ch.number === playing} className={ch.number === playing ? 'is-now' : ''}>
            <summary>
              <span className="fp-src-ch">Chapter {ch.number}</span> {ch.title}
              <span className="fp-src-count">
                {cs.length} claims{qs.length ? ` · ${qs.length} quotations` : ''}
              </span>
            </summary>
            {qs.length > 0 && (
              <ul className="fp-src-quotes">
                {qs.map((x) => (
                  <li key={x.id}>
                    <button className="fp-src-at" onClick={() => onSeek(x.at)} title="Play from here">
                      ▶ {mmss(x.at)}
                    </button>
                    <blockquote>“{x.text}”</blockquote>
                    <div className="fp-src-meta">
                      — {x.speaker}
                      {x.date ? `, ${x.date}` : ''}
                      {x.source && (
                        <>
                          {' · '}
                          <a href={x.source} target="_blank" rel="noopener">
                            {host(x.source)}
                          </a>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <ul className="fp-src-claims">
              {cs.map((c) => (
                <li key={c.id}>
                  <button className="fp-src-at" onClick={() => onSeek(c.at)} title="Play from here">
                    ▶ {mmss(c.at)}
                  </button>
                  <p>
                    {c.claim}
                    {c.status === 'contested' && <em className="fp-src-contested">contested</em>}
                  </p>
                  <div className="fp-src-meta">
                    {c.date && <span>{c.date}</span>}
                    {(c.sources ?? []).map((u) => (
                      <a key={u} href={u} target="_blank" rel="noopener">
                        {host(u)}
                      </a>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
      {!!doc.offScreen?.length && !needle && (
        <details>
          <summary>
            <span className="fp-src-ch">Also cited</span> quotations on screen without narration
          </summary>
          <ul className="fp-src-quotes">
            {doc.offScreen.map((x) => (
              <li key={x.id}>
                <blockquote>“{x.text.replace(/\s+—\s+[^—]+$/, '')}”</blockquote>
                <div className="fp-src-meta">
                  — {x.speaker}
                  {x.date ? `, ${x.date}` : ''}
                  {x.source && (
                    <>
                      {' · '}
                      <a href={x.source} target="_blank" rel="noopener">
                        {host(x.source)}
                      </a>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export type { SourcesDoc };
