import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease, gaussian, mulberry32 } from '../core';
import { ParticleCloud } from './particles';

/**
 * ParticleCloud catalog: 1,500 points seeded with mulberry32(7) + gaussian
 * form a ring, then drift into a spiral driven by ONE 0..1 channel. Both
 * endpoint positions (plus a per-point delay) are precomputed at module
 * scope; compute() only lerps — so the cloud scrubs exactly.
 */
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const N = 1500;
const CX = 640;
const CY = 370;

interface Endpoints {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  delay: number;
  alpha: number;
  color: string;
}

const rand = mulberry32(7);
const gauss = gaussian(rand);

const POINTS: Endpoints[] = Array.from({ length: N }, (_, k) => {
  const tt = k / (N - 1);
  // formation A: a noisy ring
  const ringA = tt * 2 * Math.PI;
  const ringR = 250 + gauss() * 12;
  // formation B: a two-turn spiral (same index → smooth unwinding)
  const spiralA = tt * 4 * Math.PI;
  const spiralR = 36 + tt * 250 + gauss() * 7;
  return {
    ax: CX + Math.cos(ringA) * ringR,
    ay: CY + Math.sin(ringA) * ringR * 0.92,
    bx: CX + Math.cos(spiralA) * spiralR,
    by: CY + Math.sin(spiralA) * spiralR * 0.92,
    delay: rand() * 0.3,
    alpha: 0.45 + 0.55 * rand(),
    color: rand() < 0.12 ? colors.SECONDARY : colors.ACCENT,
  };
});

function buildDemo() {
  const tl = new Timeline();
  const fadeIn = tl.channel('fadeIn', 0);
  const form = tl.channel('form', 0); // 0 = ring, 1 = spiral

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.4, text: '1,500 particles, seeded — mulberry32 and gaussian, never Math.random.' });
  tl.tween(fadeIn, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 3.6, text: 'One 0→1 channel drifts the whole cloud into a spiral.' });
  tl.tween(form, 1, { at: t - 3.1, dur: 1.5, ease: ease.move });
  t = tl.hold(t, 0.9);

  t = tl.caption({ at: t, dur: 3.2, text: 'Scrub the slider — every position re-derives from t.' });
  tl.tween(form, 0, { at: t - 2.8, dur: 1.5, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, fadeIn, form };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => (
          <ParticleCloud
            state={s}
            r={2.2}
            compute={(st) => {
              const u = st.get(demo.form);
              const fade = st.get(demo.fadeIn);
              return POINTS.map((p) => {
                // per-point delay derived from the one channel — pure, scrub-safe
                const local = clamp01(u * 1.3 - p.delay);
                return {
                  x: p.ax + (p.bx - p.ax) * local,
                  y: p.ay + (p.by - p.ay) * local,
                  alpha: p.alpha * fade,
                  color: p.color,
                };
              });
            }}
          />
        )}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/ParticleCloud',
  component: Demo,
};
export default meta;

export const RingToSpiral: StoryObj<typeof Demo> = {};
