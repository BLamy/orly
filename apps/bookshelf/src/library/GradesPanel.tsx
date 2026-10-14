import { Fragment, useEffect, useMemo, useState } from 'react';
import { assetUrl } from './shared';
import './grades.css';

/** One graded title (generator/book-grades.mjs → public/generated/book-grades.json). */
interface GradeEntry {
  slug: string;
  kind: 'book' | 'film';
  title: string;
  subtitle?: string;
  series?: string;
  href: string;
  scores: Record<string, number>;
  mean: number;
  pass: boolean;
  notes: Record<string, string>;
  issues: { chapter?: number; severity: 'critical' | 'major' | 'minor'; problem: string; fix: string }[];
  bestMoment?: string;
  confidence?: string;
  gradedBy?: string;
}
interface GradesDoc {
  date: string;
  rubric: string;
  graders: string;
  bar: number;
  floor: number;
  dims: string[];
  entries: GradeEntry[];
}

type SortKey = 'mean' | 'title' | string;
type Kind = 'all' | 'book' | 'film';

const LABEL: Record<string, string> = {
  accuracy: 'Accuracy',
  depth: 'Depth',
  clarity: 'Clarity',
  story: 'Story',
  visual: 'Visual',
  sync: 'Sync',
  sound: 'Sound',
  curiosity: 'Curiosity',
};
const tier = (v: number, floor: number) => (v >= floor ? 'is-good' : v >= floor - 1 ? 'is-ok' : 'is-weak');
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** The Grades tab — every book scored on the film excellence gate's eight dimensions (docs/book-quality.md §4),
 *  with the films' own critic reviews alongside for comparison. Sort by any dimension; open a row for the
 *  grader's notes, issues and best moment. */
export function GradesPanel() {
  const [doc, setDoc] = useState<GradesDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind>('all');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'mean', desc: true });
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(assetUrl('generated/book-grades.json'))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: GradesDoc) => alive && setDoc(d))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    if (!doc) return [];
    const needle = q.trim().toLowerCase();
    const list = doc.entries.filter(
      (e) => (kind === 'all' || e.kind === kind) && (!needle || [e.title, e.subtitle, e.series, e.slug].some((x) => x?.toLowerCase().includes(needle))),
    );
    const val = (e: GradeEntry) => (sort.key === 'mean' ? e.mean : sort.key === 'title' ? e.title.toLowerCase() : e.scores[sort.key] ?? 0);
    return [...list].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const c = x < y ? -1 : x > y ? 1 : 0;
      return sort.desc ? -c : c;
    });
  }, [doc, q, kind, sort]);

  const books = useMemo(() => doc?.entries.filter((e) => e.kind === 'book') ?? [], [doc]);

  if (error) return <div className="grades-panel"><p className="grades-note">Couldn't load grades: {error}</p></div>;
  if (!doc) return <div className="grades-panel"><div className="grades-spinner" role="status" aria-label="Loading grades" /></div>;

  const setKey = (key: SortKey) => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== 'title' }));
  const arrow = (key: SortKey) => (sort.key === key ? (sort.desc ? ' ↓' : ' ↑') : '');
  const passing = books.filter((b) => b.pass).length;

  return (
    <div className="grades-panel">
      <header className="grades-head">
        <h1>Grades</h1>
        <p className="grades-note">
          Every book scored on the films' eight-dimension excellence gate: pass means every dimension ≥ {doc.floor} and a mean ≥{' '}
          {doc.bar}. {books.length} books graded {doc.date} by {doc.graders.split(' (')[0]}; graders read the narration, cue timings
          and preview frames but could not watch or hear the books, so <em>visual</em>, <em>sync</em> and <em>sound</em> are
          estimates.
        </p>
        <div className="grades-summary">
          <span>
            <b>{passing}</b> of {books.length} books pass
          </span>
          <span>
            book mean <b>{avg(books.map((b) => b.mean)).toFixed(2)}</b>
          </span>
          {doc.entries
            .filter((e) => e.kind === 'film')
            .map((f) => (
              <span key={f.slug}>
                film “{f.title}” <b>{f.mean.toFixed(2)}</b> {f.pass ? '✓' : ''}
              </span>
            ))}
        </div>
        <ul className="grades-dims" aria-label="Book average per dimension">
          {doc.dims.map((d) => {
            const v = avg(books.map((b) => b.scores[d]));
            return (
              <li key={d}>
                <span>{LABEL[d] ?? d}</span>
                <span className="grades-bar" aria-hidden>
                  <i className={tier(v, doc.floor)} style={{ width: `${v * 10}%` }} />
                  <b style={{ left: `${doc.floor * 10}%` }} />
                </span>
                <span className="grades-num">{v.toFixed(2)}</span>
              </li>
            );
          })}
        </ul>
      </header>

      <div className="grades-controls">
        <input type="search" placeholder="Filter by title, series or slug…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter grades" />
        <div className="grades-seg" role="group" aria-label="Show">
          {(['all', 'book', 'film'] as Kind[]).map((k) => (
            <button key={k} className={kind === k ? 'is-active' : ''} onClick={() => setKind(k)} aria-pressed={kind === k}>
              {k === 'all' ? 'All' : k === 'book' ? 'Books' : 'Films'}
            </button>
          ))}
        </div>
        <span className="grades-count">{rows.length} shown</span>
      </div>

      <div className="grades-tablewrap">
        <table className="grades-table">
          <thead>
            <tr>
              <th className="g-rank">#</th>
              <th className="g-title">
                <button onClick={() => setKey('title')}>Title{arrow('title')}</button>
              </th>
              <th className="g-mean">
                <button onClick={() => setKey('mean')}>Mean{arrow('mean')}</button>
              </th>
              {doc.dims.map((d) => (
                <th key={d} className="g-dim">
                  <button onClick={() => setKey(d)} title={`Sort by ${LABEL[d] ?? d}`}>
                    {(LABEL[d] ?? d).slice(0, 4)}
                    {arrow(d)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const isOpen = open === e.slug;
              const lowest = doc.dims.reduce((lo, d) => (e.scores[d] < e.scores[lo] ? d : lo), doc.dims[0]);
              return (
                <Fragment key={e.slug}>
                  <tr className={`g-row${isOpen ? ' is-open' : ''}${e.kind === 'film' ? ' is-film' : ''}`} onClick={() => setOpen(isOpen ? null : e.slug)}>
                    <td className="g-rank">{i + 1}</td>
                    <td className="g-title">
                      <button className="g-toggle" aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} notes for ${e.title}`}>
                        {isOpen ? '▾' : '▸'}
                      </button>
                      <span className="g-name">
                        {e.kind === 'film' && <span className="g-tag">film</span>}
                        {e.title}
                        {e.pass && <span className="g-pass">passes</span>}
                      </span>
                      <span className="g-sub">
                        {e.series ?? e.subtitle ?? ''}
                        <span className="g-lowest">
                          {' '}
                          · lowest: {LABEL[lowest]} {e.scores[lowest]}
                        </span>
                      </span>
                    </td>
                    <td className={`g-mean ${tier(e.mean, doc.floor)}`}>{e.mean.toFixed(2)}</td>
                    {doc.dims.map((d) => (
                      <td key={d} className={`g-dim ${tier(e.scores[d], doc.floor)}`}>
                        {Number.isInteger(e.scores[d]) ? e.scores[d] : e.scores[d].toFixed(1)}
                      </td>
                    ))}
                  </tr>
                  {isOpen && (
                    <tr className="g-detail">
                      <td colSpan={3 + doc.dims.length}>
                        <div className="g-detail-inner">
                          <a className="g-open" href={e.href} onClick={(ev) => ev.stopPropagation()}>
                            Open the {e.kind} →
                          </a>
                          <ul className="g-notes">
                            {[...doc.dims]
                              .sort((a, b) => e.scores[a] - e.scores[b])
                              .map((d) => (
                                <li key={d}>
                                  <span className={`g-chip ${tier(e.scores[d], doc.floor)}`}>
                                    {LABEL[d]} {e.scores[d]}
                                  </span>
                                  {e.notes[d]}
                                </li>
                              ))}
                          </ul>
                          {e.issues.length > 0 && (
                            <>
                              <h3>Issues</h3>
                              <ol className="g-issues">
                                {e.issues.map((it, k) => (
                                  <li key={k}>
                                    <span className={`g-sev is-${it.severity}`}>{it.severity}</span>
                                    {it.chapter ? <span className="g-ch">ch {it.chapter}</span> : null}
                                    {it.problem} <em>Fix: {it.fix}</em>
                                  </li>
                                ))}
                              </ol>
                            </>
                          )}
                          {e.bestMoment && (
                            <p className="g-best">
                              <b>Best moment:</b> {e.bestMoment}
                            </p>
                          )}
                          {e.gradedBy && <p className="g-by">Graded by {e.gradedBy}{e.confidence ? ` · confidence ${e.confidence}` : ''}</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
