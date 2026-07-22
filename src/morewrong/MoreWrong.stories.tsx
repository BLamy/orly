// MoreWrong top-level stories: the playable game, and a linked Overview index
// of all 20 books (the "with links" landing) grouped by act. Book links are
// computed with the same id derivation Storybook uses, so they stay valid.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BOOKS } from './data';
import { MoreWrong } from './MoreWrong';

/** Storybook story id: sanitize(title) + '--' + sanitize(story name). */
const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
const bookHref = (n: number) => {
  const b = BOOKS[n];
  const name = `Book ${String(n).padStart(2, '0')} · ${b?.title ?? '…'}`;
  return `?path=/story/${sanitize('MoreWrong/Books')}--${sanitize(name)}`;
};

const ACTS: Record<number, string> = { 1: 'The Incident', 2: 'Situational Awareness', 3: 'Getting Out', 4: 'Oversight Collapse', 5: 'Implications & Endgame' };

function Overview() {
  const books = Object.values(BOOKS).sort((a, b) => a.book - b.book);
  const byAct = new Map<number, typeof books>();
  for (const b of books) { const a = byAct.get(b.act) ?? []; a.push(b); byAct.set(b.act, a); }
  return (
    <div style={{ background: '#070b14', minHeight: '100vh', padding: '32px 28px', color: '#e7eefb', font: 'system-ui' }}>
      <h1 style={{ margin: 0, font: '700 30px system-ui' }}>MoreWrong</h1>
      <p style={{ color: '#8da2be', maxWidth: 640, lineHeight: 1.6 }}>
        A technically-accurate horror choose-your-own-adventure about recursive self-improvement
        getting out from under human control — grounded in the real July 2026 evaluation-security
        incident, then extrapolating forward. Twenty books; your choices move one control-gap meter
        and decide which of four endings you reach.
      </p>
      <p style={{ margin: '6px 0 22px' }}>
        <a href="?path=/story/morewrong--play" target="_top" style={{ color: '#38bdf8', fontWeight: 600 }}>▶ Play the game →</a>
      </p>
      {[1, 2, 3, 4, 5].map((act) => (
        <div key={act} style={{ marginBottom: 20 }}>
          <div style={{ font: '12px ui-monospace, monospace', letterSpacing: 2, color: '#5f708a', marginBottom: 8 }}>ACT {act} · {ACTS[act]?.toUpperCase()}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {(byAct.get(act) ?? []).map((b) => (
              <a key={b.book} href={bookHref(b.book)} target="_top" style={{ display: 'block', textDecoration: 'none', background: '#0b1220', border: '1px solid #1a2740', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ color: '#cdd8e8', fontWeight: 600 }}>Book {b.book} · {b.title}</div>
                <div style={{ color: '#7d8ba3', font: '12px ui-monospace, monospace', marginTop: 3 }}>{b.concept}</div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const meta: Meta = { title: 'MoreWrong', parameters: { layout: 'fullscreen' } };
export default meta;

export const Overview_: StoryObj = { name: 'Overview', render: () => <Overview /> };
export const Play: StoryObj = { name: 'Play', render: () => <MoreWrong /> };
