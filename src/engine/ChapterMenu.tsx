import type { Chapter } from '../stories';

// Landing screen: pick a chapter. Faithful to the original site's homepage —
// a quiet index that opens into a guided, animated explainer.
export function ChapterMenu({
  chapters,
  onSelect,
}: {
  chapters: Chapter[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="menu">
      <div className="menu-inner">
        <div className="menu-head">
          <div className="menu-eyebrow">The Secret Lives of Data</div>
          <h1 className="menu-title">almostnode, explained</h1>
          <p className="menu-sub">
            How a browser-native dev environment actually works — one concept at a time.
          </p>
        </div>
        <ul className="chapter-list">
          {chapters.map((c) => (
            <li key={c.id}>
              <button
                className="chapter-card"
                style={{ ['--accent' as string]: c.accent } as React.CSSProperties}
                onClick={() => onSelect(c.id)}
              >
                <span className="chapter-num">{String(c.number).padStart(2, '0')}</span>
                <span className="chapter-text">
                  <span className="chapter-card-title">{c.title}</span>
                  <span className="chapter-blurb">{c.blurb}</span>
                </span>
                <span className="chapter-go" aria-hidden>
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="menu-foot">Use → / ← to step · Space to play · Esc for chapters</div>
      </div>
    </div>
  );
}
