import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease } from '../core';
import { Vec } from './arrow';

/**
 * Vec catalog: two vectors grow in, one rotates (its tip is derived from a
 * sampled angle channel), then tip-to-tail addition — b slides to the tip
 * of a and the sum closes the triangle in a third color.
 */
const O = { x: 480, y: 470 };
const A_LEN = 260;
const A_START = -0.15; // radians, stage orientation (negative = up-right)
const A_END = -0.75;
const B = { dx: 250, dy: -70 };

function buildDemo() {
  const tl = new Timeline();
  const growA = tl.channel('growA', 0);
  const growB = tl.channel('growB', 0);
  const angA = tl.channel('angA', A_START);
  const shift = tl.channel('shift', 0); // 0 = b at origin, 1 = b tail on a's tip
  const growSum = tl.channel('growSum', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.0, text: 'Vectors grow in from tail to tip.' });
  tl.tween(growA, 1, { at: 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(growB, 1, { at: 0.95, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 3.2, text: 'Rotation is just the tip riding a sampled angle channel.' });
  tl.tween(angA, A_END, { at: t - 2.7, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 3.2, text: 'Tip-to-tail: slide b so its tail sits on the tip of a…' });
  tl.tween(shift, 1, { at: t - 2.7, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0.3);

  t = tl.caption({ at: t, dur: 3.2, text: '…and the sum closes the triangle.', tex: '\\vec a + \\vec b' });
  tl.tween(growSum, 1, { at: t - 2.7, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, growA, growB, angA, shift, growSum };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => {
          const ang = s.get(demo.angA);
          const aTip = { x: O.x + A_LEN * Math.cos(ang), y: O.y + A_LEN * Math.sin(ang) };
          const sh = s.get(demo.shift);
          const bTail = { x: O.x + (aTip.x - O.x) * sh, y: O.y + (aTip.y - O.y) * sh };
          return (
            <>
              <circle cx={O.x} cy={O.y} r={4} fill={colors.MUTED} />
              <Vec
                x1={O.x}
                y1={O.y}
                x2={aTip.x}
                y2={aTip.y}
                grow={s.get(demo.growA)}
                color={colors.ACCENT}
                label="a"
                labelAt="mid"
              />
              <Vec
                x1={bTail.x}
                y1={bTail.y}
                x2={bTail.x + B.dx}
                y2={bTail.y + B.dy}
                grow={s.get(demo.growB)}
                color={colors.POSITIVE}
                label="b"
                labelAt="mid"
              />
              <Vec
                x1={O.x}
                y1={O.y}
                x2={aTip.x + B.dx}
                y2={aTip.y + B.dy}
                grow={s.get(demo.growSum)}
                color={colors.WARM}
                label="a+b"
                labelAt="tip"
              />
            </>
          );
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/Vec',
  component: Demo,
};
export default meta;

export const GrowRotateAdd: StoryObj<typeof Demo> = {};
