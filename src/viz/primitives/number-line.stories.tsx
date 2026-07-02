import type { Meta, StoryObj } from '@storybook/react-vite';
import { scaleLinear } from 'd3';
import { Player, Timeline, colors, ease } from '../core';
import { NumberLine, Brace } from './number-line';

/**
 * NumberLine + Brace catalog: the line draws on with staggered ticks, a
 * point slides along it (its x is just scale(v) of a sampled value), and
 * a brace grows outward under an interval.
 */
const SCALE = scaleLinear().domain([-5, 5]).range([170, 1110]);
const LINE_Y = 340;

function buildDemo() {
  const tl = new Timeline();
  const reveal = tl.channel('reveal', 0);
  const pointU = tl.channel('pointU', 0);
  const v = tl.channel('v', -4);
  const braceU = tl.channel('braceU', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.2, text: 'A number line draws on; ticks stagger in behind it.' });
  tl.tween(reveal, 1, { at: 0.6, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.8);

  t = tl.caption({ at: t, dur: 3.4, text: 'A value channel slides a point — its x is just scale(v).' });
  tl.tween(pointU, 1, { at: t - 3.0, dur: 0.6, ease: ease.enter });
  tl.tween(v, 3, { at: t - 2.5, dur: 1.5, ease: ease.move });
  t = tl.hold(t, 0.8);

  t = tl.caption({ at: t, dur: 3.2, text: 'A brace grows outward from its center to call out an interval.' });
  tl.tween(braceU, 1, { at: t - 2.7, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.1);

  return { tl, reveal, pointU, v, braceU };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => {
          const value = s.get(demo.v);
          const pu = s.get(demo.pointU);
          const px = SCALE(value);
          return (
            <>
              <NumberLine scale={SCALE} y={LINE_Y} reveal={s.get(demo.reveal)} label="x" />
              <g opacity={pu}>
                <circle cx={px} cy={LINE_Y} r={9 * pu} fill={colors.ACCENT} />
                <text x={px} y={LINE_Y - 20} textAnchor="middle" fill={colors.ACCENT} fontSize={17}>
                  {value.toFixed(1)}
                </text>
              </g>
              <Brace
                x0={SCALE(0)}
                x1={SCALE(3)}
                y={LINE_Y + 44}
                u={s.get(demo.braceU)}
                color={colors.WARM}
                label="the interval [0, 3]"
              />
            </>
          );
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/NumberLine',
  component: Demo,
};
export default meta;

export const DrawSlideBrace: StoryObj<typeof Demo> = {};
