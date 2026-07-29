import { useMemo } from 'react';
import katex from 'katex';
import type { CaptionItem } from './timeline';

function CaptionTex({ tex }: { tex: string }) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false }), [tex]);
  return <span style={{ marginLeft: 12 }} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Lower-third captions rendered as HTML over the stage (crisper than SVG
 * text, and KaTeX needs HTML anyway). Opacity/translate come straight from
 * the sampled fade envelope, so captions scrub with everything else.
 */
export function Captions({ items }: { items: CaptionItem[] }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '8%',
        right: '8%',
        bottom: '9%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {items.map((c, i) => (
        <div
          key={`${c.text}-${i}`}
          style={{
            opacity: c.u,
            transform: `translateY(${(1 - c.u) * 10}px)`,
            fontSize: 'clamp(14px, 1.9vw, 24px)',
            lineHeight: 1.45,
            textAlign: 'center',
            color: '#e6edf6',
            textShadow: '0 2px 12px rgba(4, 8, 18, 0.9), 0 0 2px rgba(4, 8, 18, 0.9)',
            maxWidth: '52em',
          }}
        >
          {c.text}
          {c.tex ? <CaptionTex tex={c.tex} /> : null}
        </div>
      ))}
    </div>
  );
}
