// arXiv:2607.13491 — "DeepLoop: Depth Scaling for Looped Transformers"
// (Li, Zhang, Guo, Gu, Wang, July 2026). Chapter 1: what a looped transformer
// is. A compact stack of M physical blocks is applied for R rounds, so the
// unrolled depth is N = M * R — depth without new parameters. The hidden-state
// trajectory on the right is genuinely computed: a weight-tied residual block
// h <- h + 0.5 * tanh(W h) applied eight times at d = 6, seeded.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real math, module scope: a tiny weight-tied residual block, visited 8 times.
// ---------------------------------------------------------------------------

const D = 6;
const VISITS = 8;
const rand = mulberry32(11);

const W: number[][] = Array.from({ length: D }, () =>
  Array.from({ length: D }, () => (rand() * 2 - 1) * 0.9),
);
const H0: number[] = Array.from({ length: D }, () => rand() * 2 - 1);

/** Hidden-state snapshots h_0..h_8 under h <- h + 0.5 tanh(W h). */
const TRAJ: number[][] = (() => {
  const out: number[][] = [[...H0]];
  let h = [...H0];
  for (let r = 0; r < VISITS; r++) {
    const f = W.map((row) => Math.tanh(row.reduce((a, w, j) => a + w * h[j], 0)));
    h = h.map((x, i) => x + 0.5 * f[i]);
    out.push([...h]);
  }
  return out;
})();
// 2-D projection of the trajectory (coords 0 and 1) for the on-screen path.
// With this seed the state moves every visit — the loop is doing real work.

// ---------------------------------------------------------------------------
// Stage layout.
// ---------------------------------------------------------------------------

// Left: the standard 12-layer tower.
const TOWER_X = 140;
const TOWER_W = 150;
const TOWER_BOT = 596;
const LAYER_H = 38;
const N_LAYERS = 12;

// Middle: the compact looped stack (M = 3 physical blocks).
const LOOP_X = 480;
const LOOP_W = 170;
const M_BLOCKS = 3;
const LOOP_BOT = 470;
const BLOCK_H = 62;
const BLOCK_COLORS = [colors.ACCENT, colors.SECONDARY, colors.POSITIVE];

// Bottom-middle: the unrolled tape of visited blocks.
const TAPE_X = 430;
const TAPE_Y = 560;
const TAPE_CELL = 24;

// Right: the computed trajectory panel.
const TRAJ_X = 850;
const TRAJ_Y = 170;
const TRAJ_W = 350;
const TRAJ_H = 290;
const projX = (h: number[]): number => TRAJ_X + TRAJ_W / 2 + h[0] * 62;
const projY = (h: number[]): number => TRAJ_Y + TRAJ_H / 2 - h[1] * 62;

const CAM_TOWER: CameraState = { x: 320, y: 340, k: 1.3 };
const CAM_LOOP: CameraState = { x: 570, y: 340, k: 1.3 };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Timeline — captions are the narration script.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  towerU: ChannelRef<number>;
  towerTok: ChannelRef<number>;
  paramU: ChannelRef<number>;
  loopU: ChannelRef<number>;
  loopTok: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  trajU: ChannelRef<number>;
  trajTok: ChannelRef<number>;
  nEqU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const towerU = tl.channel('towerU', 0);
  const towerTok = tl.channel('towerTok', 0);
  const paramU = tl.channel('paramU', 0);
  const loopU = tl.channel('loopU', 0);
  const loopTok = tl.channel('loopTok', 0); // unrolled visit index 0..12
  const tapeU = tl.channel('tapeU', 0);
  const trajU = tl.channel('trajU', 0);
  const trajTok = tl.channel('trajTok', 0);
  const nEqU = tl.channel('nEqU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — depth, paid for in parameters
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'A transformer gets its power from depth. Token representations flow up a residual stream, and every layer adds its own small refinement.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(towerU, 1, { at: 0.8, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAM_TOWER, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(towerTok, 1, { at: 2.0, dur: 3.6, ease: ease.linear });
  tl.caption({
    at: 7.0,
    dur: 5.2,
    text: 'But every one of those layers is its own set of weights. Twelve layers means twelve blocks of parameters. Depth is paid for in memory.',
  });
  tl.tween(paramU, 1, { at: 7.6, dur: 0.9, ease: ease.enter });
  tl.hold(12.2, 0.7);

  // Beat 2 — the looped alternative
  tl.caption({
    at: 12.9,
    dur: 5.6,
    text: 'A looped transformer makes a thrifty bet. Keep only a compact stack of blocks, and run the signal through that same stack again and again.',
  });
  tl.tween(cam, CAM_LOOP, { at: 13.2, dur: 1.4, ease: ease.move });
  tl.tween(loopU, 1, { at: 13.8, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 18.7,
    dur: 6.2,
    text: 'Three physical blocks, visited four times. The computation is twelve layers deep, but it owns only a quarter of the parameters.',
  });
  tl.tween(tapeU, 1, { at: 19.0, dur: 0.7, ease: ease.enter });
  tl.tween(loopTok, 12, { at: 19.4, dur: 6.6, ease: ease.linear });
  tl.caption({
    at: 25.1,
    dur: 5.6,
    text: 'Unroll it in time and it looks like an ordinary deep network, except the same colors keep coming back. The same weights, visited again and again.',
  });
  tl.tween(nEqU, 1, { at: 26.4, dur: 0.8, ease: ease.enter });
  tl.hold(30.9, 0.6);

  // Beat 3 — the loop does real work (computed)
  tl.caption({
    at: 31.5,
    dur: 5.8,
    text: 'And the loop genuinely computes. Here is a tiny weight-tied block applied eight times: the hidden state keeps moving, each visit refining the last one.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 31.7, dur: 1.4, ease: ease.move });
  tl.tween(trajU, 1, { at: 32.6, dur: 1.0, ease: ease.draw });
  tl.tween(trajTok, VISITS, { at: 33.6, dur: 4.4, ease: ease.linear });
  tl.caption({
    at: 37.7,
    dur: 5.4,
    text: 'The depth the signal experiences is the unrolled depth. This paper calls it N: physical blocks times the number of loops.',
  });
  tl.hold(43.3, 0.7);

  // Beat 4 — the question of the book
  tl.caption({
    at: 44.0,
    dur: 5.8,
    text: 'That one change, revisiting parameters, quietly breaks the rules deep networks are trained by. Gradients stop behaving like they do in a standard stack.',
  });
  tl.tween(dimU, 1, { at: 44.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 45.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.4,
    dur: 5.2,
    text: 'This book is about exactly what breaks when depth loops back on itself, and the one line fix that repairs it.',
  });
  tl.hold(55.8, 1.2);

  return {
    tl,
    cam,
    titleU,
    towerU,
    towerTok,
    paramU,
    loopU,
    loopTok,
    tapeU,
    trajU,
    trajTok,
    nEqU,
    dimU,
    closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/looped-transformer/overrides.json',
  slug: 'looped-transformer',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const towerU = s.get(scene.towerU);
  const towerTok = s.get(scene.towerTok);
  const paramU = s.get(scene.paramU);
  const loopU = s.get(scene.loopU);
  const loopTok = s.get(scene.loopTok);
  const tapeU = s.get(scene.tapeU);
  const trajU = s.get(scene.trajU);
  const trajTok = s.get(scene.trajTok);
  const nEqU = s.get(scene.nEqU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // packet position in the looped stack: which block is being visited now
  const visit = Math.min(12, loopTok);
  const blockIdx = Math.floor(visit) % M_BLOCKS;
  const blockFrac = visit - Math.floor(visit);
  const packetY =
    LOOP_BOT - blockIdx * (BLOCK_H + 10) - BLOCK_H / 2 - blockFrac * 0;
  const roundDone = Math.floor(visit / M_BLOCKS);

  const trajN = Math.min(VISITS, trajTok);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* left: the standard tower */}
          <g opacity={towerU}>
            <text x={TOWER_X} y={TOWER_BOT - N_LAYERS * LAYER_H - 26} fill={colors.TEXT} fontSize={19}>
              standard transformer
            </text>
            {Array.from({ length: N_LAYERS }, (_, i) => {
              const u = clamp01(towerU * N_LAYERS - i);
              return (
                <g key={i} opacity={u}>
                  <rect
                    x={TOWER_X}
                    y={TOWER_BOT - (i + 1) * LAYER_H}
                    width={TOWER_W}
                    height={LAYER_H - 8}
                    rx={6}
                    fill={colors.ACCENT}
                    opacity={0.14 + 0.04 * i}
                    stroke={colors.ACCENT}
                    strokeOpacity={0.5}
                  />
                  <text
                    x={TOWER_X + 10}
                    y={TOWER_BOT - (i + 1) * LAYER_H + 19}
                    fill={colors.TEXT}
                    fontSize={11}
                    fontFamily="monospace"
                    opacity={0.7}
                  >
                    layer {i + 1}
                  </text>
                </g>
              );
            })}
            {/* the rising token */}
            {towerTok > 0 && (
              <circle
                cx={TOWER_X + TOWER_W / 2}
                cy={TOWER_BOT - towerTok * N_LAYERS * LAYER_H + LAYER_H / 2}
                r={7}
                fill={colors.WARM}
              />
            )}
            <g opacity={paramU}>
              <line
                x1={TOWER_X + TOWER_W + 14}
                y1={TOWER_BOT - N_LAYERS * LAYER_H}
                x2={TOWER_X + TOWER_W + 14}
                y2={TOWER_BOT - 8}
                stroke={colors.WARM}
                strokeWidth={2}
              />
              <text x={TOWER_X + TOWER_W + 24} y={TOWER_BOT - (N_LAYERS * LAYER_H) / 2} fill={colors.WARM} fontSize={14}>
                12 blocks of weights
              </text>
            </g>
          </g>

          {/* middle: the looped compact stack */}
          <g opacity={loopU}>
            <text x={LOOP_X} y={LOOP_BOT - M_BLOCKS * (BLOCK_H + 10) - 22} fill={colors.TEXT} fontSize={19}>
              looped transformer
            </text>
            {Array.from({ length: M_BLOCKS }, (_, m) => (
              <g key={m}>
                <rect
                  x={LOOP_X}
                  y={LOOP_BOT - (m + 1) * (BLOCK_H + 10) + 10}
                  width={LOOP_W}
                  height={BLOCK_H - 6}
                  rx={8}
                  fill={BLOCK_COLORS[m]}
                  opacity={blockIdx === m && loopTok > 0 && loopTok < 12 ? 0.5 : 0.2}
                  stroke={BLOCK_COLORS[m]}
                  strokeOpacity={0.85}
                  strokeWidth={2}
                />
                <text
                  x={LOOP_X + 12}
                  y={LOOP_BOT - (m + 1) * (BLOCK_H + 10) + 45}
                  fill={colors.TEXT}
                  fontSize={13}
                  fontFamily="monospace"
                >
                  block {m + 1} — weights φ{m + 1}
                </text>
              </g>
            ))}
            {/* loop-back arrow */}
            <path
              d={`M ${LOOP_X + LOOP_W + 14} ${LOOP_BOT - M_BLOCKS * (BLOCK_H + 10) + 36}
                  C ${LOOP_X + LOOP_W + 78} ${LOOP_BOT - M_BLOCKS * (BLOCK_H + 10) + 36},
                    ${LOOP_X + LOOP_W + 78} ${LOOP_BOT - 20},
                    ${LOOP_X + LOOP_W + 14} ${LOOP_BOT - 20}`}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={2.4}
              strokeDasharray="7 5"
              markerEnd="none"
            />
            <text x={LOOP_X + LOOP_W + 34} y={LOOP_BOT - 118} fill={colors.WARM} fontSize={14}>
              × R loops
            </text>
            {/* visiting packet */}
            {loopTok > 0 && loopTok < 12 && (
              <circle cx={LOOP_X + LOOP_W / 2} cy={packetY + 8} r={7} fill={colors.WARM} />
            )}
            {/* round counter */}
            <text x={LOOP_X} y={LOOP_BOT + 34} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
              rounds finished: {Math.min(4, roundDone)} / 4
            </text>
          </g>

          {/* unrolled tape */}
          <g opacity={tapeU}>
            <text x={TAPE_X} y={TAPE_Y + 46} fill={colors.MUTED} fontSize={13}>
              unrolled in time — same colors, same weights
            </text>
            {Array.from({ length: 12 }, (_, i) => {
              const u = clamp01(loopTok - i);
              return (
                <rect
                  key={i}
                  x={TAPE_X + i * (TAPE_CELL + 4)}
                  y={TAPE_Y}
                  width={TAPE_CELL}
                  height={TAPE_CELL}
                  rx={5}
                  fill={BLOCK_COLORS[i % M_BLOCKS]}
                  opacity={u * 0.85}
                />
              );
            })}
          </g>
        </Camera>
      </g>

      {/* screen-fixed: title + arXiv id */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Around the block
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.13491
        </text>
      </g>

      <MathLabel
        tex="N = M \cdot R = 3 \times 4 = 12"
        x={952}
        y={92}
        fontSize={22}
        color={colors.WARM}
        opacity={nEqU * mainOp}
      />

      {/* right: computed trajectory of the tied block */}
      <g opacity={trajU * mainOp}>
        <rect x={TRAJ_X - 24} y={TRAJ_Y - 44} width={TRAJ_W + 48} height={TRAJ_H + 92} rx={12} fill={colors.PANEL} opacity={0.5} stroke={colors.GRID} />
        <text x={TRAJ_X - 8} y={TRAJ_Y - 18} fill={colors.TEXT} fontSize={15}>
          one tied block, eight visits (computed)
        </text>
        <text x={TRAJ_X - 8} y={TRAJ_Y + TRAJ_H + 34} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
          h ← h + ½·tanh(W h) · d = 6 · 2-D projection
        </text>
        {TRAJ.map((h, i) => {
          if (i > 0 && i > trajN) return null;
          const u = i === 0 ? 1 : clamp01(trajN - i + 1);
          return (
            <g key={i} opacity={u}>
              {i > 0 && (
                <line
                  x1={projX(TRAJ[i - 1])}
                  y1={projY(TRAJ[i - 1])}
                  x2={projX(h)}
                  y2={projY(h)}
                  stroke={colors.ACCENT}
                  strokeWidth={2}
                  opacity={0.6}
                />
              )}
              <circle
                cx={projX(h)}
                cy={projY(h)}
                r={i === 0 ? 6 : 4.5}
                fill={i === 0 ? colors.WARM : colors.ACCENT}
              />
              <text x={projX(h) + 9} y={projY(h) - 6} fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                {i === 0 ? 'h₀' : `visit ${i}`}
              </text>
            </g>
          );
        })}
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={190} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Depth without new parameters.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            But when the same weights are visited again and again,
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            training stops following the standard rules.
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
            DeepLoop · arXiv:2607.13491
          </text>
        </g>
      )}
    </>
  );
}

export function LoopedTransformer() {
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
