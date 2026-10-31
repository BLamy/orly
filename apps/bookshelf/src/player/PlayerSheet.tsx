// The players' mobile bottom sheet (portrait phones): @brett_lamy/ui's FloatingSheet docked edge to edge under the
// video, resting with its top at the video's bottom edge and dragged up to fill the screen. Its tabs (Chapters,
// Blog, Score; a film's Chapters, Score, Sources, Music) sit at the top of the body; the active tab's content
// scrolls inside it. Shared by BookPlayer and FilmPlayer so the two players look and behave the same.
import { FloatingSheet } from '@brett_lamy/ui';
import '@brett_lamy/ui/styles.css';
import { useEffect, useState, type ReactNode } from 'react';
import './player-sheet.css';

export interface SheetTab {
  id: string;
  label: string;
  content: ReactNode;
}

const MIN_REST = 120; // px of sheet kept on screen however tall the video is

export function PlayerSheet({
  top,
  tabs,
  tab,
  onTab,
  label,
}: {
  /** the video block's bottom edge (px from the top of the screen): the sheet rests just below it */
  top: number;
  tabs: SheetTab[];
  tab: string;
  onTab: (id: string) => void;
  label: string;
}) {
  const [hostH, setHostH] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight));
  useEffect(() => {
    const on = () => setHostH(window.innerHeight);
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  // the whole resting sheet (cap included) as a share of the screen: everything below the video
  const rest = Math.max(MIN_REST, hostH - top);
  const restPct = Math.min(90, Math.max(10, (rest / hostH) * 100));
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];
  if (!active) return null;
  return (
    <div className="ps-host">
      <FloatingSheet
        peek={`${restPct.toFixed(2)}%` as `${number}%`}
        topGap={24}
        gutter={0}
        radius={16}
        appearance="sheet"
        tone="auto"
        bodyAlign="start"
        label={label}
        surfaceClassName="ps-surface"
      >
        <FloatingSheet.Body>
          <div className="ps-body">
            {tabs.length > 1 && (
              <div className="bp-tabbar ps-tabs" role="tablist">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    className={`bp-tab${t.id === active.id ? ' active' : ''}`}
                    role="tab"
                    aria-selected={t.id === active.id}
                    onClick={() => onTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <div className="ps-content">{active.content}</div>
          </div>
        </FloatingSheet.Body>
      </FloatingSheet>
    </div>
  );
}
