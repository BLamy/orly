// A title's own score, shown inside its player (a book's Score tab beside Chapters and Blog; a film's Score tab
// under the VCR): the eight-dimension excellence gate (docs/book-quality.md §4), weakest dimension first, with the
// reviewers' notes, issues and best moment. Books are graded by generator/book-grades.mjs
// (public/generated/book-grades.json); films by their critic panel (public/generated/<slug>/review.json).
// The full ranking stays on the Grades page (?tab=grades).
import { useEffect, useState } from 'react';
import { ASSET_BASE, assetUrl } from '../library/shared';
import './score-card.css';

export interface Score {
  mean: number;
  /** the gate: pass = every dimension ≥ floor and mean ≥ bar */
  bar: number;
  floor: number;
  pass: boolean;
  scores: Record<string, number>;
  notes: Record<string, string>;
  issues?: { chapter?: number; severity: 'critical' | 'major' | 'minor'; problem: string; fix?: string }[];
  bestMoment?: string;
  /** who graded it (a model, or "film critic panel, round 2") and when */
  by?: string;
  at?: string;
}

export const DIM_LABEL: Record<string, string> = {
  accuracy: 'Accuracy',
  depth: 'Depth',
  clarity: 'Clarity',
  story: 'Story',
  visual: 'Visual',
  sync: 'Sync',
  sound: 'Sound',
  curiosity: 'Curiosity',
};

interface GradesDoc {
  date: string;
  bar: number;
  floor: number;
  entries: {
    slug: string;
    scores: Record<string, number>;
    mean: number;
    pass: boolean;
    notes: Record<string, string>;
    issues: Score['issues'];
    bestMoment?: string;
    confidence?: string;
    gradedBy?: string;
    at?: string;
  }[];
}

let gradesDoc: Promise<GradesDoc | null> | null = null;
const loadGrades = () =>
  (gradesDoc ??= fetch(assetUrl('generated/book-grades.json'))
    .then((r) => (r.ok ? (r.json() as Promise<GradesDoc>) : null))
    .catch(() => null));

/** a book's score from the shelf's grading run (null while loading or when it has none) */
export function useBookScore(slug: string): Score | null {
  const [score, setScore] = useState<Score | null>(null);
  useEffect(() => {
    let alive = true;
    setScore(null);
    loadGrades().then((doc) => {
      const e = doc?.entries.find((x) => x.slug === slug);
      if (!alive || !doc || !e) return;
      setScore({
        mean: e.mean,
        bar: doc.bar,
        floor: doc.floor,
        pass: e.pass,
        scores: e.scores,
        notes: e.notes ?? {},
        issues: e.issues,
        bestMoment: e.bestMoment,
        by: `${e.gradedBy ?? 'the grading panel'}${e.confidence ? ` · confidence ${e.confidence}` : ''}`,
        at: e.at ?? doc.date,
      });
    });
    return () => {
      alive = false;
    };
  }, [slug]);
  return score;
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(v * 10 === Math.round(v * 10) ? 1 : 2));

export function ScoreCard({ score }: { score: Score }) {
  const dims = Object.entries(score.scores).sort((a, b) => a[1] - b[1]);
  const date = score.at ? new Date(score.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  return (
    <section className="sc" aria-label="Score">
      <header className="sc-head">
        <span className={`sc-mean ${score.pass ? 'is-pass' : score.mean >= score.floor ? 'is-close' : 'is-low'}`}>{score.mean.toFixed(2)}</span>
        <span className="sc-gate">
          <b>{score.pass ? 'Passes the gate' : 'Not yet passing'}</b>
          <span>
            mean ≥ {score.bar}, every dimension ≥ {score.floor}
          </span>
        </span>
      </header>
      <ul className="sc-dims">
        {dims.map(([k, v]) => (
          <li key={k} className={v < score.floor ? 'is-below' : ''}>
            <span className="sc-dim">{DIM_LABEL[k] ?? k}</span>
            <span className="sc-bar" aria-hidden>
              <i style={{ width: `${Math.max(0, Math.min(10, v)) * 10}%` }} />
              <b style={{ left: `${score.floor * 10}%` }} />
            </span>
            <span className="sc-num">{fmt(v)}</span>
            {score.notes[k] && <p>{score.notes[k]}</p>}
          </li>
        ))}
      </ul>
      {score.issues && score.issues.length > 0 && (
        <>
          <h3 className="sc-h">Issues</h3>
          <ol className="sc-issues">
            {score.issues.map((it, i) => (
              <li key={i}>
                <span className={`sc-sev is-${it.severity}`}>{it.severity}</span>
                {it.chapter ? <span className="sc-ch">ch {it.chapter}</span> : null}
                {it.problem}
                {it.fix && <em> Fix: {it.fix}</em>}
              </li>
            ))}
          </ol>
        </>
      )}
      {score.bestMoment && (
        <p className="sc-best">
          <b>Best moment:</b> {score.bestMoment}
        </p>
      )}
      <footer className="sc-foot">
        {score.by && <span>Graded by {score.by}</span>}
        {date && <span>{date}</span>}
        <a href={`${ASSET_BASE}?tab=grades`}>All scores →</a>
      </footer>
    </section>
  );
}
