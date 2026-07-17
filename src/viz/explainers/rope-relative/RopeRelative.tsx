// Explained: Long Context — chapter 1: positions as rotations. Real RoPE,
// actually computed at module scope: an 8-dimensional head split into four
// frequency pairs (base 100 → rotation rates 1, 0.316, 0.1, 0.0316 radians
// per token). The attention score of a query at position 5 against a key at
// position 2 comes out 0.386 — and moving BOTH tokens fifteen or seventy five
// steps later gives exactly 0.386 again, because the rotations cancel to the
// offset: q^T R(θ(n−m)) k. The score-vs-offset kernel (1.0, 0.87 at one
// step, 0.39 at four, 0.06 at sixteen) is the same computation swept.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real RoPE math, module scope.
// ---------------------------------------------------------------------------

const PAIRS = 4;
const BASE = 100;
/** rotation rate per token for each frequency pair. */
const THETA: number[] = Array.from({ length: PAIRS }, (_, j) => Math.pow(BASE, -2 * j / (2 * PAIRS)));
// [1, 0.3162, 0.1, 0.0316]

/** q = k: each pair holds magnitude 1/2 along the first axis (unit vector overall). */
const MAG2 = 0.25; // |pair|^2

/** Attention score between positions m and n — full rotation computation. */
const rot = (p: [number, number], ang: number): [number, number] => [
  p[0] * Math.cos(ang) - p[1] * Math.sin(ang),
  p[0] * Math.sin(ang) + p[1] * Math.cos(ang),
];
const score = (m: number, n: number): number => {
  let acc = 0;
  for (let j = 0; j < PAIRS; j++) {
    const qr = rot([0.5, 0], m * THETA[j]);
    const kr = rot([0.5, 0], n * THETA[j]);
    acc += qr[0] * kr[0] + qr[1] * kr[1];
  }
  return acc;
};
// score(5, 2) = score(20, 17) = score(80, 77) = 0.3859 — verified.

/** The same thing as a pure function of offset (what the algebra collapses to). */
const gOff = (off: number): number => THETA.reduce((a, t) => a + MAG2 * Math.cos(t * off), 0);
// gOff(0)=1, gOff(1)=0.871, gOff(4)=0.390, gOff(16)=0.057

// ---------------------------------------------------------------------------
// Layout. Left: four rotation dials (the persistent object). Right: the
// score-vs-offset kernel. A position slider drives every dial.
// ---------------------------------------------------------------------------

const DIAL_XS = [200, 360, 520, 680];
const DIAL_Y = 250;
const DIAL_R = 56;

const KER_X = scaleLinear().domain([0, 24]).range([160, 700]);
const KER_Y = scaleLinear().domain([-0.3, 1.05]).range([600, 430]);

const CAM_DIALS: CameraState = { x: 440, y: 260, k: 1.3 };
const CAM_KER: CameraState = { x: 430, y: 500, k: 1.3 };

const PAIR_COLORS = [colors.ACCENT, colors.TEAL, colors.POSITIVE, colors.SECONDARY];

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  dialsU: ChannelRef<number>;
  posQ: ChannelRef<number>; // query position
  posK: ChannelRef<number>; // key position
  scoreU: ChannelRef<number>;
  eqU: ChannelRef<number>;
  kerU: ChannelRef<number>;
  kerSweep: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
  airT: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const dialsU = tl.channel('dialsU', 0);
  const posQ = tl.channel('posQ', 0);
  const posK = tl.channel('posK', 0);
  const scoreU = tl.channel('scoreU', 0);
  const eqU = tl.channel('eqU', 0);
  const kerU = tl.channel('kerU', 0);
  const kerSweep = tl.channel('kerSweep', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);
  const airT = tl.channel('airT', 0); // ambient clock — keeps every frame alive
  tl.tween(airT, 60, { at: 0, dur: 60, ease: ease.linear });

  // Beat 1 — the problem
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Attention by itself is order-blind: shuffle the tokens and the scores would not change. Long context starts with the question of how a model even knows where a token is.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });

  // Beat 2 — positions as rotations
  tl.caption({
    at: 6.3,
    dur: 6.0,
    text: 'The modern answer is rotary position embedding. Split the head into pairs of dimensions, and treat each pair as a tiny clock hand. Moving one token later in the sequence rotates every hand — each at its own fixed speed.',
  });
  tl.tween(cam, CAM_DIALS, { at: 6.5, dur: 1.4, ease: ease.move });
  tl.tween(dialsU, 1, { at: 7.3, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 12.5,
    dur: 5.4,
    text: 'Here are four hands, from fast to slow: one full radian per token down to about three hundredths. Watch them turn as the token slides from position zero to position five.',
  });
  tl.tween(posQ, 5, { at: 13.3, dur: 3.6, ease: ease.move });
  tl.hold(18.1, 0.6);

  // Beat 3 — two tokens, one score
  tl.caption({
    at: 18.7,
    dur: 6.0,
    text: 'Now score a query at position five against a key at position two — the actual dot product of the rotated vectors. It comes out at zero point three nine.',
  });
  tl.tween(posK, 2, { at: 19.3, dur: 1.6, ease: ease.move });
  tl.tween(scoreU, 1, { at: 21.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 25.0,
    dur: 6.2,
    text: 'Here is the trick. Slide both tokens fifteen steps later — positions twenty and seventeen. Every hand turns, and the score comes out at zero point three nine again. Exactly. The rotations cancel down to the gap between the tokens.',
  });
  tl.tween(posQ, 20, { at: 25.8, dur: 2.6, ease: ease.move });
  tl.tween(posK, 17, { at: 25.8, dur: 2.6, ease: ease.move });
  tl.caption({
    at: 31.5,
    dur: 4.8,
    text: 'Push them to eighty and seventy seven — same number a third time. Position is gone from the score; only the offset survives. That is the algebra on screen.',
  });
  tl.tween(posQ, 80, { at: 32.1, dur: 2.4, ease: ease.move });
  tl.tween(posK, 77, { at: 32.1, dur: 2.4, ease: ease.move });
  tl.tween(eqU, 1, { at: 33.5, dur: 0.8, ease: ease.enter });
  tl.hold(36.5, 0.7);

  // Beat 4 — the kernel
  tl.caption({
    at: 37.2,
    dur: 6.0,
    text: 'So sweep the offset itself. Identical tokens score one when they sit together, point eight seven one step apart, point three nine at four steps, and nearly nothing at sixteen.',
  });
  tl.tween(cam, CAM_KER, { at: 37.4, dur: 1.5, ease: ease.move });
  tl.tween(kerU, 1, { at: 38.4, dur: 1.2, ease: ease.draw });
  tl.tween(kerSweep, 1, { at: 39.4, dur: 3.6, ease: ease.move });
  tl.caption({
    at: 43.6,
    dur: 5.2,
    text: 'The fast hands make nearby positions sharply distinguishable; the slow hands keep a faint sense of distance alive across dozens of tokens. Every rotary model carries this fingerprint.',
  });
  tl.hold(49.0, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 49.7,
    dur: 5.6,
    text: 'Notice what the design promises: the score depends only on relative offset, so in principle any context length should work. The next chapter is about why that promise breaks in practice.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 49.9, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 50.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 52.0, dur: 0.9, ease: ease.enter });
  tl.hold(55.3, 1.2);

  return { tl, cam, titleU, dialsU, posQ, posK, scoreU, eqU, kerU, kerSweep, dimU, closeU, airT };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/rope-relative/overrides.json',
  slug: 'rope-relative',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const dialsU = s.get(scene.dialsU);
  const posQ = s.get(scene.posQ);
  const posK = s.get(scene.posK);
  const scoreU = s.get(scene.scoreU);
  const eqU = s.get(scene.eqU);
  const kerU = s.get(scene.kerU);
  const kerSweep = s.get(scene.kerSweep);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);
  const airT = s.get(scene.airT);

  const mainOp = 1 - 0.85 * dimU;
  const liveScore = score(posQ, posK);
  const sweepOff = kerSweep * 24;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the four dials */}
          <g opacity={dialsU * (1 - 0.8 * kerU)}>
            <text x={DIAL_XS[0] - DIAL_R} y={DIAL_Y - DIAL_R - 42} fill={colors.TEXT} fontSize={18}>
              four frequency pairs — four clock hands
            </text>
            {THETA.map((th, j) => {
              const angQ = posQ * th;
              const angK = posK * th;
              return (
                <g key={j}>
                  <circle cx={DIAL_XS[j]} cy={DIAL_Y} r={DIAL_R} fill="none" stroke={colors.GRID} strokeWidth={1.2} />
                  {/* ambient rim tick — a pure function of the timeline clock */}
                  <circle
                    cx={DIAL_XS[j] + DIAL_R * Math.cos(-(airT * (0.35 + 0.1 * j) + j))}
                    cy={DIAL_Y + DIAL_R * Math.sin(-(airT * (0.35 + 0.1 * j) + j))}
                    r={2.5}
                    fill={colors.MUTED}
                    opacity={0.5}
                  />
                  {/* query hand */}
                  <line
                    x1={DIAL_XS[j]}
                    y1={DIAL_Y}
                    x2={DIAL_XS[j] + DIAL_R * 0.86 * Math.cos(-angQ)}
                    y2={DIAL_Y + DIAL_R * 0.86 * Math.sin(-angQ)}
                    stroke={PAIR_COLORS[j]}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  {/* key hand */}
                  <line
                    x1={DIAL_XS[j]}
                    y1={DIAL_Y}
                    x2={DIAL_XS[j] + DIAL_R * 0.62 * Math.cos(-angK)}
                    y2={DIAL_Y + DIAL_R * 0.62 * Math.sin(-angK)}
                    stroke={colors.WARM}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                  <text x={DIAL_XS[j]} y={DIAL_Y + DIAL_R + 22} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                    θ = {th.toFixed(th < 0.05 ? 4 : th < 0.6 ? 3 : 1)}
                  </text>
                </g>
              );
            })}
            <text x={DIAL_XS[0] - DIAL_R} y={DIAL_Y + DIAL_R + 52} fill={colors.MUTED} fontSize={13}>
              long hand: query at position {posQ.toFixed(0)} · short hand: key at position {posK.toFixed(0)}
            </text>
          </g>

          {/* the live score */}
          {scoreU > 0 && (
            <g opacity={scoreU * (1 - 0.8 * kerU)}>
              <rect x={700} y={DIAL_Y + 96} width={230} height={92} rx={12} fill={colors.PANEL} opacity={0.85} stroke={colors.GRID} />
              <text x={815} y={DIAL_Y + 126} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                dot product of rotated q and k
              </text>
              <text x={815} y={DIAL_Y + 166} textAnchor="middle" fill={colors.WARM} fontSize={30} fontWeight={700} fontFamily="monospace">
                {liveScore.toFixed(3)}
              </text>
            </g>
          )}

          {/* the algebra */}
          <MathLabel
            tex="(R_{m}q)^{\top}(R_{n}k) = q^{\top}R_{\theta(n-m)}\,k"
            x={330}
            y={392}
            fontSize={21}
            color={colors.SECONDARY}
            opacity={eqU * (1 - 0.8 * kerU)}
          />

          {/* the kernel */}
          {kerU > 0 && (
            <g opacity={kerU}>
              <text x={160} y={KER_Y(1.05) - 14} fill={colors.TEXT} fontSize={17}>
                score of identical tokens vs offset
              </text>
              <Axes x={KER_X} y={KER_Y} reveal={kerU} xTicks={6} yTicks={3} xLabel="offset (tokens)" fontSize={11} />
              <FunctionPlot
                x={KER_X}
                y={KER_Y}
                f={gOff}
                domain={[0, Math.max(0.4, sweepOff)]}
                samples={200}
                reveal={1}
                color={colors.ACCENT}
                width={2.6}
              />
              {kerSweep > 0.02 && (
                <>
                  <circle cx={KER_X(sweepOff)} cy={KER_Y(gOff(sweepOff))} r={5} fill={colors.WARM} />
                  <text x={KER_X(sweepOff) + 10} y={KER_Y(gOff(sweepOff)) - 10} fill={colors.WARM} fontSize={13} fontWeight={600}>
                    {gOff(sweepOff).toFixed(2)}
                  </text>
                </>
              )}
              <text x={KER_X(24)} y={KER_Y(0.12)} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                fast hands: sharp nearby · slow hands: faint far
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Positions as rotations
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={220} width={840} height={200} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Only the offset survives.
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            0.386 at positions five and two — 0.386 at eighty and seventy seven.
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            A relative ruler, built from nothing but rotations.
          </text>
        </g>
      )}
    </>
  );
}

export function RopeRelative() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
