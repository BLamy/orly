import type { Meta, StoryObj } from '@storybook/react-vite';
import { scaleLinear } from 'd3';
import { Player, Timeline, ease } from '../core';
import { Axes } from './axes';

/**
 * Axes catalog: the grid + axis lines draw on from one `reveal` channel,
 * then the whole coordinate system rescales — scales are rebuilt every
 * frame from a sampled 0..1 channel that lerps the domain, so the axes
 * scrub exactly like any other property.
 */
function buildDemo() {
  const tl = new Timeline();
  const reveal = tl.channel('reveal', 0);
  const dom = tl.channel('dom', 0); // 0 = tight domain, 1 = wide domain

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.2, text: 'Axes draw on; grid lines and ticks stagger in behind them.' });
  tl.tween(reveal, 1, { at: 0.6, dur: 1.5, ease: ease.draw });
  t = tl.hold(t, 0.8);

  t = tl.caption({ at: t, dur: 3.4, text: 'Scales rebuild per frame, so one channel rescales the whole domain.' });
  tl.tween(dom, 1, { at: t - 2.8, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.9);

  t = tl.caption({ at: t, dur: 3.0, text: 'And back — ticks re-derive from the sampled domain.' });
  tl.tween(dom, 0, { at: t - 2.6, dur: 1.4, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, reveal, dom };
}

const demo = buildDemo();

const X_RANGE: [number, number] = [150, 1130];
const Y_RANGE: [number, number] = [620, 100];
const X_DOMAIN = { from: [-4, 4], to: [-9, 9] } as const;
const Y_DOMAIN = { from: [-2.5, 2.5], to: [-6, 6] } as const;

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => {
          const u = s.get(demo.dom);
          const x = scaleLinear()
            .domain([lerp(X_DOMAIN.from[0], X_DOMAIN.to[0], u), lerp(X_DOMAIN.from[1], X_DOMAIN.to[1], u)])
            .range(X_RANGE);
          const y = scaleLinear()
            .domain([lerp(Y_DOMAIN.from[0], Y_DOMAIN.to[0], u), lerp(Y_DOMAIN.from[1], Y_DOMAIN.to[1], u)])
            .range(Y_RANGE);
          return <Axes x={x} y={y} reveal={s.get(demo.reveal)} xLabel="x" yLabel="y" />;
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/Axes',
  component: Demo,
};
export default meta;

export const DrawOnAndRescale: StoryObj<typeof Demo> = {};
