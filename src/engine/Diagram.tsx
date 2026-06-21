import { useEffect, useRef } from 'react';
import type { Story } from '../types';
import { renderDiagram, VB_H, VB_W } from './d3/render';

// React owns the <svg> element; D3 owns everything inside it. Each step change
// re-runs the imperative D3 render, which diffs node/edge sets and transitions.
export function Diagram({
  story,
  stepIndex,
  reduced,
  coverNote,
}: {
  story: Story;
  stepIndex: number;
  reduced: boolean;
  coverNote?: string;
}) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (ref.current) renderDiagram(ref.current, story, stepIndex, reduced, coverNote);
  }, [story, stepIndex, reduced, coverNote]);

  return (
    <div className="stage">
      <svg ref={ref} className="stage-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" />
    </div>
  );
}
