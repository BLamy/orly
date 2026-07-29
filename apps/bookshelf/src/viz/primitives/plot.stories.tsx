import type { Meta, StoryObj } from '@storybook/react-vite';
import { scaleLinear } from 'd3';
import { Player, Timeline, colors, ease } from '../core';
import { Axes } from './axes';
import { FunctionPlot } from './plot';

/**
 * FunctionPlot catalog, one flowing timeline: sin(x) draws on, morphs
 * pointwise into 0.7·sin(2x), then an area sweep fills under the curve.
 * The curve is always the same 200 samples, so the morph is a
 * structure-stable lerp — no path-topology tricks needed.
 */
const SIN = (x: number) => Math.sin(x);
const SIN2 = (x: number) => 0.7 * Math.sin(2 * x);

const X = scaleLinear().domain([-Math.PI * 2, Math.PI * 2]).range([150, 1130]);
const Y = scaleLinear().domain([-1.6, 1.6]).range([620, 100]);

function buildDemo() {
  const tl = new Timeline();
  const axesU = tl.channel('axesU', 0);
  const reveal = tl.channel('reveal', 0);
  const morphU = tl.channel('morphU', 0);
  const sweep = tl.channel('sweep', 0);

  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 3.4,
    text: 'A curve draws on left to right — dashoffset from a reveal channel.',
    tex: 'f(x) = \\sin x',
  });
  tl.tween(axesU, 1, { at: 0.5, dur: 1.2, ease: ease.draw });
  tl.tween(reveal, 1, { at: 1.3, dur: 1.6, ease: ease.draw });
  t = tl.hold(t, 0.8);

  t = tl.caption({
    at: t,
    dur: 3.4,
    text: 'Morphing is a pointwise lerp between two sampled curves.',
    tex: '\\sin x \\;\\to\\; 0.7\\,\\sin 2x',
  });
  tl.tween(morphU, 1, { at: t - 2.9, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.8);

  t = tl.caption({ at: t, dur: 3.4, text: 'An area sweep fills under the curve, left to right.' });
  tl.tween(sweep, 1, { at: t - 2.9, dur: 1.6, ease: ease.draw });
  tl.hold(t, 1.1);

  return { tl, axesU, reveal, morphU, sweep };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => (
          <>
            <Axes x={X} y={Y} reveal={s.get(demo.axesU)} xLabel="x" yLabel="f(x)" />
            <FunctionPlot
              x={X}
              y={Y}
              f={SIN2}
              morph={{ from: SIN, u: s.get(demo.morphU) }}
              reveal={s.get(demo.reveal)}
              area={{ baseline: 0, sweep: s.get(demo.sweep), opacity: 0.2 }}
              color={colors.ACCENT}
            />
          </>
        )}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/FunctionPlot',
  component: Demo,
};
export default meta;

export const DrawMorphSweep: StoryObj<typeof Demo> = {};
