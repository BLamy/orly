import { useMemo } from 'react';
import katex from 'katex';
import { TEXT } from './colors';

/**
 * A KaTeX label positioned in stage coordinates via <foreignObject>.
 * (katex.min.css is loaded once by .storybook/preview.ts.)
 */
export function MathLabel({
  tex,
  x,
  y,
  fontSize = 26,
  color = TEXT,
  opacity = 1,
  anchor = 'middle',
  display = false,
  boxWidth = 900,
}: {
  tex: string;
  /** anchor point in stage coordinates */
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  opacity?: number;
  anchor?: 'start' | 'middle' | 'end';
  display?: boolean;
  boxWidth?: number;
}) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, displayMode: display }),
    [tex, display],
  );
  if (opacity <= 0) return null;
  const boxHeight = fontSize * 4;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - boxWidth : x - boxWidth / 2;
  const justify = anchor === 'start' ? 'flex-start' : anchor === 'end' ? 'flex-end' : 'center';
  return (
    <foreignObject
      x={left}
      y={y - boxHeight / 2}
      width={boxWidth}
      height={boxHeight}
      style={{ overflow: 'visible', pointerEvents: 'none' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: justify,
          alignItems: 'center',
          height: '100%',
          fontSize,
          color,
          opacity,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </foreignObject>
  );
}
