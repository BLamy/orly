// Per-book review stories for MoreWrong. Each story renders one book's whole
// node sequence — the art-directed scene (via the registry; GenericScene where
// a book isn't art-directed yet), its beat text, and its choices — so the
// series can be reviewed in Storybook before narration. The sidebar entries
// under "MoreWrong/Books" are the navigable index; MoreWrong/Overview links to
// each. Scenes upgrade automatically as each book-NN.tsx lands.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BOOKS, METER_MAX, START_METER, type GameNode } from './data';
import { bookScene } from './scene/registry';
import { GenericScene } from './scene/GenericScene';
import { Stage } from './components/Stage';

/** A representative controlGap for a book, so the box wall thins across the arc. */
const gapForBook = (n: number) => Math.round(START_METER + ((n - 1) / 19) * (METER_MAX - START_METER));

function NodeCard({ bn, node, gap }: { bn: number; node: GameNode; gap: number }) {
  const art = bookScene(bn);
  const el = art?.({ nodeId: node.id, controlGap: gap }) ?? null;
  const meanwhile = node.id.includes('meanwhile');
  return (
    <div style={{ marginBottom: 34 }}>
      <div style={{ font: '12px ui-monospace, monospace', color: '#5f708a', marginBottom: 6 }}>
        {node.id} · control gap {gap}{node.terminal ? ' · terminal' : ''}
      </div>
      <div style={{ width: 'min(760px, 92vw)', aspectRatio: '16 / 9', background: '#0a0e1a', borderRadius: 10, overflow: 'hidden', boxShadow: '0 0 0 1px #16202f' }}>
        <Stage>{el ?? <GenericScene nodeId={node.id} controlGap={gap} concept={BOOKS[bn]?.concept ?? ''} />}</Stage>
      </div>
      {meanwhile && (
        <div style={{ font: '11px ui-monospace, monospace', letterSpacing: 2, color: '#8da2be', marginTop: 8 }}>MEANWHILE, THE SYSTEM</div>
      )}
      <p style={{ width: 'min(760px, 92vw)', font: '15px/1.6 system-ui', color: '#e7eefb', marginTop: 8 }}>{node.beat}</p>
      {node.choices.length > 0 && (
        <ul style={{ width: 'min(760px, 92vw)', margin: '6px 0 0', paddingLeft: 18 }}>
          {node.choices.map((c, i) => (
            <li key={i} style={{ font: '13px/1.5 system-ui', color: '#a9b8cd', marginBottom: 3 }}>
              <strong style={{ color: '#cdd8e8' }}>{c.label}</strong>
              {c.detail ? ` — ${c.detail}` : ''}
              <span style={{ color: '#5f708a' }}> → {c.next}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookMontage({ book }: { book: number }) {
  const b = BOOKS[book];
  const gap = gapForBook(book);
  if (!b) return <div style={{ color: '#e7eefb', padding: 24 }}>Book {book} not loaded.</div>;
  return (
    <div style={{ background: '#070b14', minHeight: '100vh', padding: '28px 24px', color: '#e7eefb' }}>
      <h2 style={{ margin: '0 0 2px', font: '600 22px system-ui' }}>Book {book} · {b.title}</h2>
      <div style={{ font: '13px ui-monospace, monospace', color: '#7d8ba3', marginBottom: 14 }}>Act {b.act} · {b.concept}</div>
      {b.grounding && (
        <p style={{ width: 'min(760px, 92vw)', font: '13px/1.6 system-ui', color: '#a9b8cd', background: '#0b1220', border: '1px solid #1a2740', borderRadius: 10, padding: '12px 14px', marginBottom: 22 }}>
          <strong>Grounding.</strong> {b.grounding}
        </p>
      )}
      {b.nodes.map((n) => <NodeCard key={n.id} bn={book} node={n} gap={gap} />)}
    </div>
  );
}

const meta: Meta<typeof BookMontage> = {
  title: 'MoreWrong/Books',
  component: BookMontage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj<typeof BookMontage>;
const mk = (n: number): S => ({ args: { book: n }, name: `Book ${String(n).padStart(2, '0')} · ${BOOKS[n]?.title ?? '…'}` });

export const Book01 = mk(1);
export const Book02 = mk(2);
export const Book03 = mk(3);
export const Book04 = mk(4);
export const Book05 = mk(5);
export const Book06 = mk(6);
export const Book07 = mk(7);
export const Book08 = mk(8);
export const Book09 = mk(9);
export const Book10 = mk(10);
export const Book11 = mk(11);
export const Book12 = mk(12);
export const Book13 = mk(13);
export const Book14 = mk(14);
export const Book15 = mk(15);
export const Book16 = mk(16);
export const Book17 = mk(17);
export const Book18 = mk(18);
export const Book19 = mk(19);
export const Book20 = mk(20);
