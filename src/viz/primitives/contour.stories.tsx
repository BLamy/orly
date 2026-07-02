import type { Meta, StoryObj } from '@storybook/react-vite';
import { scaleLinear } from 'd3';
import { Camera, CAMERA_HOME, Player, Timeline, colors, ease } from '../core';
import type { CameraState } from '../core';
import { Axes } from './axes';
import { ContourField } from './contour';

/**
 * ContourField catalog: iso-contours of a two-basin scalar field stagger
 * in (outermost level first) from one reveal channel, then the camera —
 * just another channel — pushes in toward the deeper basin.
 */
const F = (x: number, y: number) =>
  -Math.exp(-((x - 1.2) ** 2 + (y - 0.8) ** 2) / 1.4) -
  0.75 * Math.exp(-((x + 1.4) ** 2 + (y + 1) ** 2) / 2);

const X = scaleLinear().domain([-4, 4]).range([160, 1120]);
const Y = scaleLinear().domain([-3, 3]).range([660, 60]);
const BASIN: CameraState = { x: X(1.2), y: Y(0.8), k: 1.9 };

function buildDemo() {
  const tl = new Timeline();
  const axesU = tl.channel('axesU', 0);
  const reveal = tl.channel('reveal', 0);
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.4, text: 'Iso-contours of a two-basin field stagger in, outermost first.' });
  tl.tween(axesU, 1, { at: 0.5, dur: 1.1, ease: ease.draw });
  tl.tween(reveal, 1, { at: 1.0, dur: 1.6, ease: ease.draw });
  t = tl.hold(t, 0.8);

  t = tl.caption({ at: t, dur: 3.4, text: 'The camera pushes in toward the deeper basin — it is just a channel.' });
  tl.tween(cam, BASIN, { at: t - 2.9, dur: 1.5, ease: ease.move });
  t = tl.hold(t, 0.9);

  t = tl.caption({ at: t, dur: 3.0, text: 'Pull back out — seeking through the move is exact.' });
  tl.tween(cam, CAMERA_HOME, { at: t - 2.6, dur: 1.4, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, axesU, reveal, cam };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => (
          <Camera {...s.get(demo.cam)}>
            <Axes x={X} y={Y} reveal={s.get(demo.axesU)} />
            <ContourField f={F} x={X} y={Y} reveal={s.get(demo.reveal)} color={colors.ACCENT} />
          </Camera>
        )}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/ContourField',
  component: Demo,
};
export default meta;

export const StaggerAndPushIn: StoryObj<typeof Demo> = {};
