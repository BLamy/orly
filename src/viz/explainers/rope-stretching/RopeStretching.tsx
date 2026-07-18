// Explained: Long Context — chapter 2: stretching the ruler. Real RoPE
// arithmetic at module scope for an 8-pair head (base 100, rates 1 → 0.01
// rad/token) trained on a 64-token window. What breaks at position 256,
// measured: the slowest channel reaches 2.56 radians when training only ever
// showed it 0.64 — angles the model has never seen — while the fastest hand
// has wrapped 40.7 times. Position interpolation (scale 4) brings every
// angle back into the seen range, but the adjacent-token score contrast
// collapses from 0.080 to 0.005 — sixteen times weaker — and every in-window
// score shifts by 0.265 on average, which is why finetuning follows. NTK
// scaling (base 100 → 488) fixes the slow channel (0.53 rad at 256) while
// keeping contrast at 0.070.
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
// Real math, module scope.
// ---------------------------------------------------------------------------

const D2 = 8;
const BASE = 100;
const W_TRAIN = 64;
const S = 4; // extension factor
const THETA: number[] = Array.from({ length: D2 }, (_, j) => Math.pow(BASE, -j / (D2 - 1)));
const BASE_NTK = BASE * Math.pow(S, (2 * D2) / (2 * D2 - 2)); // ≈ 488
const THETA_NTK: number[] = Array.from({ length: D2 }, (_, j) => Math.pow(BASE_NTK, -j / (D2 - 1)));

const gOff = (off: number, th: number[] = THETA): number =>
  th.reduce((a, t) => a + Math.cos(t * off), 0) / D2;

// measured quantities quoted in captions:
const SLOW_AT_W = THETA[D2 - 1] * W_TRAIN; // 0.64 rad — max angle seen in training
const SLOW_AT_256 = THETA[D2 - 1] * 256; // 2.56 rad — never seen
const FAST_WRAPS = 256 / (2 * Math.PI); // 40.7 wraps
const CONTRAST_RAW = gOff(0) - gOff(1); // 0.080
const CONTRAST_PI = gOff(0) - gOff(1 / S); // 0.005
const CONTRAST_NTK = gOff(0, THETA_NTK) - gOff(1, THETA_NTK); // 0.070
const MEAN_SHIFT_PI = (() => {
  let sum = 0;
  for (let o = 0; o <= W_TRAIN; o++) sum += Math.abs(gOff(o) - gOff(o / S));
  return sum / (W_TRAIN + 1);
})(); // 0.265

// ---------------------------------------------------------------------------
// Layout. Left: the slowest dial with its trained arc (persistent object).
// Right top: kernel curves raw vs interpolated. Right bottom: contrast bars.
// ---------------------------------------------------------------------------

const DIAL_X = 300;
const DIAL_Y = 300;
const DIAL_R = 120;

const KER_X = scaleLinear().domain([0, 16]).range([680, 1150]);
const KER_Y = scaleLinear().domain([-0.1, 1.05]).range([340, 130]);

const BARS_Y0 = 470;
const BAR_MAXW = 360;

const CAM_DIAL: CameraState = { x: 330, y: 300, k: 1.35 };
const CAM_KER: CameraState = { x: 915, y: 240, k: 1.35 };
const CAM_BARS: CameraState = { x: 900, y: 470, k: 1.35 };

/** dial arc path from angle a0 to a1 (screen convention: clockwise-negative). */
const arcPath = (cx: number, cy: number, r: number, a1: number): string => {
  const large = a1 > Math.PI ? 1 : 0;
  const x1 = cx + r;
  const y1 = cy;
  const x2 = cx + r * Math.cos(-a1);
  const y2 = cy + r * Math.sin(-a1);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2} Z`;
};

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  dialU: ChannelRef<number>;
  pos: ChannelRef<number>; // token position driving the slow hand
  mode: ChannelRef<number>; // 0 raw · 1 position interpolation · 2 NTK
  oodU: ChannelRef<number>;
  kerU: ChannelRef<number>;
  piKerU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const dialU = tl.channel('dialU', 0);
  const pos = tl.channel('pos', 0);
  const mode = tl.channel('mode', 0);
  const oodU = tl.channel('oodU', 0);
  const kerU = tl.channel('kerU', 0);
  const piKerU = tl.channel('piKerU', 0);
  const barsU = tl.channel('barsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the trained arc
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'A rotary model trained on sixty four tokens has a secret limit. Its slowest clock hand — the one that measures long distances — only ever swept this small arc during training.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_DIAL, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(dialU, 1, { at: 1.4, dur: 1.2, ease: ease.enter });
  tl.tween(pos, W_TRAIN, { at: 2.6, dur: 2.8, ease: ease.move });
  tl.hold(6.3, 0.5);

  // Beat 2 — position 256: off the map
  tl.caption({
    at: 6.8,
    dur: 6.2,
    text: 'Now hand it a two hundred fifty six token document. The slow hand swings to two point six radians — an angle it has never once seen. Every weight downstream is now reading a value from outside its training distribution.',
  });
  tl.tween(pos, 256, { at: 7.6, dur: 3.4, ease: ease.move });
  tl.tween(oodU, 1, { at: 9.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 13.4,
    dur: 5.2,
    text: 'Meanwhile the fastest hand has wrapped around more than forty times. This is what breaks without finetuning: not the algebra, but the territory.',
  });
  tl.hold(18.8, 0.6);

  // Beat 3 — position interpolation
  tl.caption({
    at: 19.4,
    dur: 6.0,
    text: 'The first fix is position interpolation: divide every position by four before rotating. The slow hand lands back inside its trained arc — same document, familiar angles.',
  });
  tl.tween(mode, 1, { at: 20.4, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 25.6,
    dur: 6.2,
    text: 'But squeezing the ruler costs resolution. Compute the score contrast between a token and its immediate neighbor: it collapses from zero point zero eight to zero point zero zero five — sixteen times weaker. Adjacent tokens start to blur.',
  });
  tl.tween(cam, CAM_KER, { at: 25.8, dur: 1.5, ease: ease.move });
  tl.tween(kerU, 1, { at: 26.8, dur: 1.2, ease: ease.draw });
  tl.tween(piKerU, 1, { at: 28.4, dur: 1.4, ease: ease.draw });
  tl.hold(32.0, 0.6);

  // Beat 4 — NTK
  tl.caption({
    at: 32.6,
    dur: 6.2,
    text: 'The second fix is smarter: change the rotation base instead — here from one hundred to about four hundred ninety. That slows the slow hands into range while barely touching the fast ones. The neighbor contrast survives at zero point zero seven.',
  });
  tl.tween(cam, CAM_DIAL, { at: 33.2, dur: 1.3, ease: ease.move });
  tl.tween(mode, 2, { at: 33.8, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_BARS, { at: 36.4, dur: 1.4, ease: ease.move });
  tl.tween(barsU, 1, { at: 37.2, dur: 1.2, ease: ease.pop });
  tl.hold(38.8, 0.6);

  // Beat 5 — why finetuning still follows
  tl.caption({
    at: 39.4,
    dur: 6.0,
    text: 'Neither trick is free. Under interpolation, every score the model learned inside its old window shifts — by zero point two seven on average in this head. That is why a stretch is almost always followed by a short finetune.',
  });
  tl.hold(45.7, 0.6);

  // Beat 6 — close
  tl.caption({
    at: 46.3,
    dur: 5.6,
    text: 'So the ruler can be stretched — by squeezing positions or by retuning the clock speeds — and each stretch trades a little precision for a lot of reach. Next: a stranger thing models do with their first few tokens.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 46.5, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 47.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.6, dur: 0.9, ease: ease.enter });
  tl.hold(51.9, 1.2);

  return { tl, cam, titleU, dialU, pos, mode, oodU, kerU, piKerU, barsU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/rope-stretching/overrides.json',
  slug: 'rope-stretching',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const dialU = s.get(scene.dialU);
  const pos = s.get(scene.pos);
  const mode = s.get(scene.mode);
  const oodU = s.get(scene.oodU);
  const kerU = s.get(scene.kerU);
  const piKerU = s.get(scene.piKerU);
  const barsU = s.get(scene.barsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // effective slow-hand rate under the current mode (blend raw → PI → NTK)
  const slowRaw = THETA[D2 - 1];
  const slowNTK = THETA_NTK[D2 - 1];
  const m1 = Math.min(1, mode); // raw → PI blend
  const m2 = Math.max(0, mode - 1); // PI → NTK blend
  // PI divides position by S (same theta); NTK keeps position, smaller theta
  const angPI = (slowRaw * pos) / S;
  const angRaw = slowRaw * pos;
  const angNTK = slowNTK * pos;
  const ang = angRaw + (angPI - angRaw) * m1 + (angNTK - angPI) * m2;
  const outOfArc = ang > SLOW_AT_W + 1e-6;
  const modeLabel = mode < 0.5 ? 'raw extrapolation' : mode < 1.5 ? 'position interpolation ÷4' : 'NTK: base 100 → 488';

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the slow dial — a whisper while the camera studies the charts */}
          <g opacity={dialU * (1 - 0.8 * Math.max(kerU * (1 - Math.min(1, Math.max(0, s.get(scene.mode) - 1))), barsU))}>
            <text x={DIAL_X - DIAL_R} y={DIAL_Y - DIAL_R - 40} fill={colors.TEXT} fontSize={18}>
              the slowest clock hand
            </text>
            {/* trained arc */}
            <path d={arcPath(DIAL_X, DIAL_Y, DIAL_R, SLOW_AT_W)} fill={colors.POSITIVE} opacity={0.18} />
            <circle cx={DIAL_X} cy={DIAL_Y} r={DIAL_R} fill="none" stroke={colors.GRID} strokeWidth={1.4} />
            {/* the hand */}
            <line
              x1={DIAL_X}
              y1={DIAL_Y}
              x2={DIAL_X + DIAL_R * 0.9 * Math.cos(-ang)}
              y2={DIAL_Y + DIAL_R * 0.9 * Math.sin(-ang)}
              stroke={outOfArc ? colors.NEGATIVE : colors.ACCENT}
              strokeWidth={3.5}
              strokeLinecap="round"
            />
            <text x={DIAL_X - DIAL_R} y={DIAL_Y + DIAL_R + 30} fill={colors.MUTED} fontSize={13}>
              position {pos.toFixed(0)} · angle {ang.toFixed(2)} rad · {modeLabel}
            </text>
            <text x={DIAL_X + DIAL_R * 0.55} y={DIAL_Y - DIAL_R * 0.42} fill={colors.POSITIVE} fontSize={12}>
              seen in training: 0 – {SLOW_AT_W.toFixed(2)} rad
            </text>
            {oodU > 0 && outOfArc && (
              <text x={DIAL_X - DIAL_R} y={DIAL_Y + DIAL_R + 56} fill={colors.NEGATIVE} fontSize={14} fontWeight={600} opacity={oodU}>
                never seen: {SLOW_AT_256.toFixed(2)} rad · fast hand wrapped {FAST_WRAPS.toFixed(0)}×
              </text>
            )}
          </g>

          {/* kernel curves: raw vs interpolated */}
          {kerU > 0 && (
            <g opacity={kerU}>
              <text x={680} y={KER_Y(1.05) - 14} fill={colors.TEXT} fontSize={16}>
                score vs offset: raw ruler vs squeezed ruler
              </text>
              <Axes x={KER_X} y={KER_Y} reveal={kerU} xTicks={4} yTicks={2} xLabel="offset (tokens)" fontSize={11} />
              <FunctionPlot
                x={KER_X}
                y={KER_Y}
                f={(o) => gOff(o)}
                domain={[0, 16]}
                samples={200}
                reveal={kerU}
                color={colors.ACCENT}
                width={2.4}
              />
              <FunctionPlot
                x={KER_X}
                y={KER_Y}
                f={(o) => gOff(o / S)}
                domain={[0, 16]}
                samples={200}
                reveal={piKerU}
                color={colors.WARM}
                width={2.4}
              />
              <text x={KER_X(15.8)} y={KER_Y(gOff(15.8 / S)) - 10} textAnchor="end" fill={colors.WARM} fontSize={12}>
                interpolated: flat near zero offset — neighbors blur
              </text>
              <text x={KER_X(15.8)} y={KER_Y(0.34)} textAnchor="end" fill={colors.ACCENT} fontSize={12}>
                raw: steep near zero — neighbors distinct
              </text>
            </g>
          )}

          {/* contrast bars */}
          {barsU > 0 && (
            <g opacity={barsU}>
              <text x={680} y={BARS_Y0 - 24} fill={colors.TEXT} fontSize={16}>
                neighbor contrast, measured
              </text>
              {[
                { label: 'raw ruler', v: CONTRAST_RAW, c: colors.ACCENT },
                { label: 'interpolated ÷4', v: CONTRAST_PI, c: colors.WARM },
                { label: 'NTK base 488', v: CONTRAST_NTK, c: colors.POSITIVE },
              ].map((b, i) => (
                <g key={b.label}>
                  <text x={680} y={BARS_Y0 + i * 34 + 13} fill={b.c} fontSize={13}>
                    {b.label}
                  </text>
                  <rect
                    x={830}
                    y={BARS_Y0 + i * 34}
                    width={(b.v / CONTRAST_RAW) * BAR_MAXW * barsU}
                    height={18}
                    rx={4}
                    fill={b.c}
                    opacity={0.85}
                  />
                  <text x={838 + (b.v / CONTRAST_RAW) * BAR_MAXW * barsU} y={BARS_Y0 + i * 34 + 13} fill={b.c} fontSize={12} fontWeight={600}>
                    {b.v.toFixed(3)}
                  </text>
                </g>
              ))}
            </g>
          )}

          <MathLabel
            tex="\theta_j' = \left(b\, s^{d/(d-2)}\right)^{-2j/d}"
            x={680}
            y={BARS_Y0 + 128}
            fontSize={16}
            color={colors.MUTED}
            opacity={barsU}
          />
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Stretching the ruler
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={220} width={840} height={200} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Reach costs resolution.
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Interpolation: in range, but neighbor contrast falls 16×.
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            NTK keeps the fast hands fast — then a short finetune settles both.
          </text>
        </g>
      )}
    </>
  );
}

export function RopeStretching() {
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
