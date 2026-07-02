import type { Meta, StoryObj } from '@storybook/react-vite';
import { Camera, CAMERA_HOME, MathLabel, Player, Timeline, colors, ease, stagger } from './index';
import type { CameraState } from './index';

/**
 * The transport demo: exercises tweens, staggering, draw-on, camera moves,
 * captions, and TeX — everything a scene needs. Scrub it: every frame is a
 * pure function of the slider position.
 */
function buildDemo() {
  const tl = new Timeline();

  const ballX = tl.channel('ballX', 220);
  const ballY = tl.channel('ballY', 480);
  const ballR = tl.channel('ballR', 0);
  const ringDraw = tl.channel('ringDraw', 0);
  const dots = Array.from({ length: 8 }, (_, i) => tl.channel(`dot${i}`, 0));
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const texU = tl.channel('texU', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3, text: 'One timeline. Every property is a pure function of time.' });
  tl.tween(ballR, 22, { at: 0.6, dur: 0.6, ease: ease.enter });
  t = tl.tween(ballX, 1060, { at: 1.2, dur: 1.4, ease: ease.move });

  t = tl.caption({ at: t, dur: 3, text: 'Paths draw on. Groups stagger in.' });
  tl.tween(ringDraw, 1, { at: t - 2.6, dur: 1.4, ease: ease.draw });
  stagger(dots.length, { at: t - 1.6, dur: 0.5, ease: ease.enter }).forEach((o, i) =>
    tl.tween(dots[i], 1, o),
  );

  t = tl.caption({ at: t + 0.3, dur: 3, text: 'The camera is just another channel.' });
  tl.tween(cam, { x: 640, y: 300, k: 1.8 }, { at: t - 2.8, dur: 1.4, ease: ease.move });
  tl.tween(texU, 1, { at: t - 1.6, dur: 0.6, ease: ease.enter });

  t = tl.caption({ at: t + 0.4, dur: 2.6, text: 'Scrub the slider — seeking is exact.' });
  tl.tween(cam, CAMERA_HOME, { at: t - 2.4, dur: 1.4, ease: ease.move });
  tl.tween(ballY, 300, { at: t - 2.0, dur: 1.0, ease: ease.move });
  tl.hold(t, 0.8);

  return { tl, ballX, ballY, ballR, ringDraw, dots, cam, texU };
}

const demo = buildDemo();
const RING_R = 120;
const RING_C = 2 * Math.PI * RING_R;

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => {
          const cam = s.get(demo.cam);
          return (
            <Camera {...cam}>
              <circle
                cx={640}
                cy={300}
                r={RING_R}
                fill="none"
                stroke={colors.SECONDARY}
                strokeWidth={3}
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - s.get(demo.ringDraw))}
                transform="rotate(-90 640 300)"
              />
              {demo.dots.map((d, i) => {
                const a = (i / demo.dots.length) * 2 * Math.PI - Math.PI / 2;
                const u = s.get(d);
                return (
                  <circle
                    key={i}
                    cx={640 + Math.cos(a) * RING_R}
                    cy={300 + Math.sin(a) * RING_R}
                    r={7 * u}
                    fill={colors.POSITIVE}
                    opacity={u}
                  />
                );
              })}
              <circle cx={s.get(demo.ballX)} cy={s.get(demo.ballY)} r={s.get(demo.ballR)} fill={colors.ACCENT} />
              <MathLabel tex="f(t)\;\text{— sampled, never transitioned}" x={640} y={140} opacity={s.get(demo.texU)} fontSize={28} />
            </Camera>
          );
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Core/Player',
  component: Demo,
};
export default meta;

export const Transport: StoryObj<typeof Demo> = {};
