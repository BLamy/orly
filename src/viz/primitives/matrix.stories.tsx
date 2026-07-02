import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease, mulberry32 } from '../core';
import { MatrixGrid } from './matrix';

/**
 * MatrixGrid catalog: a 6×6 heatmap fills in from ONE progress channel
 * (the derived-stagger pattern — cellU is a pure function of p, no n²
 * channels), a highlight sweeps the rows, and a 3×3 shows showValues.
 * Values come from mulberry32(42) so every replay is identical.
 */
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const rand = mulberry32(42);
const BIG = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => rand()));
const SMALL = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => rand()));

function buildDemo() {
  const tl = new Timeline();
  const p = tl.channel('p', 0); // ONE channel staggers all 36 cells
  const rowF = tl.channel('rowF', 0); // highlighted row index (floored)
  const hU = tl.channel('hU', 0); // highlight fade
  const p3 = tl.channel('p3', 0); // 3×3 fill progress

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.4, text: 'One progress channel staggers all 36 cells — no per-cell channels.' });
  tl.tween(p, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 3.6, text: 'A highlight sweeps the rows: index and fade are both sampled.' });
  tl.tween(hU, 1, { at: t - 3.1, dur: 0.5, ease: ease.enter });
  tl.tween(rowF, 5, { at: t - 2.6, dur: 1.6, ease: ease.linear });
  tl.tween(hU, 0, { at: t - 0.9, dur: 0.5, ease: ease.move });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 3.4, text: 'showValues prints each cell — a 3×3 with the same stagger.' });
  tl.tween(p3, 1, { at: t - 2.9, dur: 1.2, ease: ease.draw });
  tl.hold(t, 1.1);

  return { tl, p, rowF, hU, p3 };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => {
          const p = s.get(demo.p);
          const p3 = s.get(demo.p3);
          return (
            <>
              <MatrixGrid
                x={250}
                y={185}
                values={BIG}
                cellU={(i, j) => clamp01(p * 36 - (i * 6 + j))}
                rowLabels={['0', '1', '2', '3', '4', '5']}
                highlight={{
                  row: Math.min(5, Math.floor(s.get(demo.rowF))),
                  u: s.get(demo.hU),
                  color: colors.WARM,
                }}
              />
              <MatrixGrid
                x={800}
                y={225}
                cell={56}
                gap={6}
                values={SMALL}
                cellU={(i, j) => clamp01(p3 * 9 - (i * 3 + j))}
                showValues
              />
            </>
          );
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/MatrixGrid',
  component: Demo,
};
export default meta;

export const FillSweepValues: StoryObj<typeof Demo> = {};
