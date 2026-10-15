// Explained: The Delta Rule — chapter 2: error correction. The update
// S = (I − β k kᵀ) S + β k vᵀ actually run (d = 16, β = 1) against blind
// accumulation, on a stream of 12 writes: four keys, each updated three
// times with fresh values. Read the four keys back at the end: accumulation
// recalls the latest values at average cosine 0.59 (it blended all three
// versions); the delta rule recalls them at 0.89. The algebraic identity
// (I − β k kᵀ) S + β k vᵀ = S + β k (v − Sᵀk)ᵀ — write only the error — is
// shown as the mechanism. Concept chapter for the KDA/SFDA line
// (arXiv:2607.11897).
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
// Real math, module scope.
// ---------------------------------------------------------------------------

const D = 16;
const NKEYS = 4;
const ROUNDS = 3;
const NW = NKEYS * ROUNDS; // 12 writes
const rand = mulberry32(20260711);

function randUnit(): number[] {
  const v = Array.from({ length: D }, () => rand() * 2 - 1);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

const KEYS: number[][] = Array.from({ length: NKEYS }, randUnit);
interface Write {
  ki: number;
  v: number[];
}
const STREAM: Write[] = (() => {
  const out: Write[] = [];
  for (let round = 0; round < ROUNDS; round++)
    for (let ki = 0; ki < NKEYS; ki++) out.push({ ki, v: randUnit() });
  return out;
})();
const LATEST: number[][] = (() => {
  const latest: number[][] = new Array(NKEYS).fill(null) as unknown as number[][];
  for (const w of STREAM) latest[w.ki] = w.v;
  return latest;
})();

type Mat = number[][];
const zeros = (): Mat => Array.from({ length: D }, () => new Array(D).fill(0) as number[]);
const readK = (S: Mat, k: number[]): number[] =>
  Array.from({ length: D }, (_, j) => k.reduce((acc, ki, i) => acc + ki * S[i][j], 0));
const cosSim = (u: number[], v: number[]): number => {
  const n = Math.hypot(...u) * Math.hypot(...v);
  return n < 1e-12 ? 0 : u.reduce((acc, x, i) => acc + x * v[i], 0) / n;
};

/** Accumulate: S += k vᵀ, snapshot after each write. */
const ACC: Mat[] = (() => {
  const out: Mat[] = [zeros()];
  let S = zeros();
  for (const w of STREAM) {
    S = S.map((r, i) => r.map((x, j) => x + KEYS[w.ki][i] * w.v[j]));
    out.push(S.map((r) => [...r]));
  }
  return out;
})();

/** Delta (β = 1): S += k (v − Sᵀk)ᵀ — identical to (I − k kᵀ) S + k vᵀ. */
const DELTA: Mat[] = (() => {
  const out: Mat[] = [zeros()];
  let S = zeros();
  for (const w of STREAM) {
    const pred = readK(S, KEYS[w.ki]);
    S = S.map((r, i) => r.map((x, j) => x + KEYS[w.ki][i] * (w.v[j] - pred[j])));
    out.push(S.map((r) => [...r]));
  }
  return out;
})();

/** Final recall of the LATEST value under each key. */
const RECALL_ACC: number[] = KEYS.map((k, ki) => cosSim(readK(ACC[NW], k), LATEST[ki]));
const RECALL_DELTA: number[] = KEYS.map((k, ki) => cosSim(readK(DELTA[NW], k), LATEST[ki]));
const AVG_ACC = RECALL_ACC.reduce((a, b) => a + b, 0) / NKEYS; // 0.59
const AVG_DELTA = RECALL_DELTA.reduce((a, b) => a + b, 0) / NKEYS; // 0.89

const matAt = (states: Mat[], u: number): Mat => {
  const f = Math.max(0, Math.min(NW, u));
  const i = Math.floor(f);
  if (i >= NW) return states[NW];
  const t = f - i;
  return states[i].map((r, a) => r.map((x, b) => x + (states[i + 1][a][b] - x) * t));
};

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const CELL = 13;
const ACC_X = 140;
const DELTA_X = 840;
const GRID_Y = 236;
const KEY_COLORS = [colors.ACCENT, colors.WARM, colors.SECONDARY, colors.TEAL];

// The two grids sit side by side; each camera frames one grid and keeps the
// other one just out of view, so no grid is ever sliced at the stage edge.
const CAM_ACC: CameraState = { x: 280, y: 330, k: 1.3 };
const CAM_DELTA: CameraState = { x: 960, y: 330, k: 1.3 };

// The write stream lives in screen space: it starts centred on the stage in
// beat 1 and slides up to a header band once the grids arrive (driven by accU).
const STREAM_CHIP_W = 84;
const STREAM_CHIP_H = 44;
const STREAM_GAP = 10;
const STREAM_X0 = (1280 - (NW * STREAM_CHIP_W + (NW - 1) * STREAM_GAP)) / 2;
const STREAM_TOP_START = 300;
const STREAM_TOP_END = 112;

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  streamU: ChannelRef<number>;
  accU: ChannelRef<number>;
  accTok: ChannelRef<number>;
  deltaU: ChannelRef<number>;
  deltaTok: ChannelRef<number>;
  eqU: ChannelRef<number>;
  identU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const streamU = tl.channel('streamU', 0);
  const accU = tl.channel('accU', 0);
  const accTok = tl.channel('accTok', 0);
  const deltaU = tl.channel('deltaU', 0);
  const deltaTok = tl.channel('deltaTok', 0);
  const eqU = tl.channel('eqU', 0);
  const identU = tl.channel('identU', 0);
  const barsU = tl.channel('barsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the setup
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Facts change. Here is a stream of twelve writes: four keys, and each key gets a new value three times. A good memory should answer with the latest version.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(streamU, 1, { at: 1.0, dur: 1.6, ease: ease.draw });
  tl.hold(6.9, 0.6);

  // Beat 2 — accumulate fails
  tl.caption({
    at: 7.5,
    dur: 5.6,
    text: 'The blind write from last chapter just adds. Three versions of every fact pile up in the same grid — watch all twelve land.',
  });
  tl.tween(cam, CAM_ACC, { at: 7.7, dur: 1.4, ease: ease.move });
  tl.tween(accU, 1, { at: 8.1, dur: 1.0, ease: ease.draw });
  tl.tween(accTok, NW, { at: 9.4, dur: 6.0, ease: ease.linear });
  tl.caption({
    at: 15.6,
    dur: 5.8,
    text: 'Ask for the latest values and you get an average recall of about point five nine. The memory answers with a blend of everything it was ever told — old versions included.',
  });
  tl.hold(21.6, 0.6);

  // Beat 3 — the delta rule
  tl.caption({
    at: 22.2,
    dur: 6.4,
    text: 'The delta rule adds one step of humility. Before writing, it asks the matrix: what do you currently predict for this key? Then it writes only the difference — the error.',
  });
  tl.tween(cam, CAM_DELTA, { at: 22.4, dur: 1.5, ease: ease.move });
  tl.tween(deltaU, 1, { at: 23.2, dur: 1.0, ease: ease.draw });
  tl.tween(eqU, 1, { at: 25.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 29.0,
    dur: 5.6,
    text: 'Same twelve writes, same sized matrix. When a key returns, the wrong prediction is subtracted before the new value goes in. Correction, not accumulation.',
  });
  tl.tween(deltaTok, NW, { at: 29.6, dur: 6.0, ease: ease.linear });
  tl.caption({
    at: 35.0,
    dur: 5.2,
    text: 'Read the latest values back now: average recall about point eight nine. The stale versions were erased on the way in.',
  });
  tl.tween(barsU, 1, { at: 36.0, dur: 1.0, ease: ease.enter });
  tl.hold(40.4, 0.6);

  // Beat 4 — the identity
  tl.caption({
    at: 41.0,
    dur: 6.4,
    text: 'And here is the algebra that makes it famous. Writing the error is exactly the same operation as first shrinking the state along the key direction, then writing fresh. Erase and write, fused into one line.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.2, dur: 1.5, ease: ease.move });
  tl.tween(identU, 1, { at: 42.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 47.8,
    dur: 5.4,
    text: 'That fused form is the beating heart of the twenty twenty six recurrence stack. But notice: erase strength and write strength share one knob, beta — remember that coupling.',
  });
  tl.hold(53.4, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 54.0,
    dur: 5.2,
    text: 'Point five nine against point eight nine, measured on the same stream. An update that reads before it writes is the difference.',
  });
  tl.tween(dimU, 1, { at: 54.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.2, dur: 0.9, ease: ease.enter });
  tl.hold(59.6, 1.2);

  return { tl, cam, titleU, streamU, accU, accTok, deltaU, deltaTok, eqU, identU, barsU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/delta-error-correction/overrides.json',
  slug: 'delta-error-correction',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const HEAT_SCALE = 0.9;

function StateGrid({ S, x, y, u }: { S: Mat; x: number; y: number; u: number }) {
  return (
    <g opacity={u}>
      {S.map((row, i) =>
        row.map((v, j) => (
          <rect
            key={`${i}-${j}`}
            x={x + j * CELL}
            y={y + i * CELL}
            width={CELL - 1.5}
            height={CELL - 1.5}
            rx={2}
            fill={colors.heat(clamp01(0.5 + v / (2 * HEAT_SCALE)))}
            opacity={clamp01(u * D * D - (i * D + j)) * 0.95}
          />
        )),
      )}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const streamU = s.get(scene.streamU);
  const accU = s.get(scene.accU);
  const accTok = s.get(scene.accTok);
  const deltaU = s.get(scene.deltaU);
  const deltaTok = s.get(scene.deltaTok);
  const eqU = s.get(scene.eqU);
  const identU = s.get(scene.identU);
  const barsU = s.get(scene.barsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const SA = matAt(ACC, accTok);
  const SD = matAt(DELTA, deltaTok);
  const gridW = D * CELL;
  // Which pass the stream is on: the blind pass first, then the delta pass.
  const tokNow = deltaU > 0 ? deltaTok : accTok;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        {/* the write stream: centred in beat 1, then slides up to the header band */}
        <g opacity={streamU}>
          <text x={640} y={STREAM_TOP_START - (STREAM_TOP_START - STREAM_TOP_END) * accU - 16} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            twelve writes — each key updated three times
          </text>
          {STREAM.map((w, t) => {
            const top = STREAM_TOP_START - (STREAM_TOP_START - STREAM_TOP_END) * accU;
            const x = STREAM_X0 + t * (STREAM_CHIP_W + STREAM_GAP);
            const done = t < tokNow;
            const active = tokNow < NW && t === Math.floor(tokNow) && tokNow > 0;
            return (
              <g key={t} opacity={clamp01(streamU * NW - t)}>
                <rect
                  x={x}
                  y={top}
                  width={STREAM_CHIP_W}
                  height={STREAM_CHIP_H}
                  rx={6}
                  fill={KEY_COLORS[w.ki]}
                  opacity={done ? 0.3 : 0.9}
                  stroke={active ? colors.TEXT : 'none'}
                  strokeWidth={2.5}
                />
                <text x={x + STREAM_CHIP_W / 2} y={top + STREAM_CHIP_H / 2 + 6} textAnchor="middle" fill={colors.BG} fontSize={18} fontWeight={700}>
                  k{w.ki + 1}
                </text>
              </g>
            );
          })}
        </g>

        <Camera {...cam}>
          {/* accumulate matrix: recedes as the camera pans onto the delta grid */}
          <g opacity={accU * (1 - 0.9 * clamp01((cam.x - 700) / 200))}>
            <text x={ACC_X} y={GRID_Y - 28} fill={colors.TEXT} fontSize={18}>
              blind accumulation
            </text>
            <StateGrid S={SA} x={ACC_X} y={GRID_Y} u={accU} />
            <rect x={ACC_X - 5} y={GRID_Y - 5} width={gridW + 8} height={gridW + 8} rx={6} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} opacity={0.7} />
            {barsU > 0 && (
              <g opacity={barsU}>
                {RECALL_ACC.map((r, ki) => (
                  <g key={ki}>
                    <rect x={ACC_X + ki * 54} y={GRID_Y + gridW + 34 - 0} width={40} height={10} rx={2} fill={KEY_COLORS[ki]} opacity={0.25} />
                    <rect x={ACC_X + ki * 54} y={GRID_Y + gridW + 34} width={40 * clamp01(r)} height={10} rx={2} fill={KEY_COLORS[ki]} />
                    <text x={ACC_X + ki * 54 + 20} y={GRID_Y + gridW + 62} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily="monospace">
                      {r.toFixed(2)}
                    </text>
                  </g>
                ))}
                <text x={ACC_X + 230} y={GRID_Y + gridW + 44} fill={colors.NEGATIVE} fontSize={17} fontFamily="monospace" fontWeight={700}>
                  avg {AVG_ACC.toFixed(2)}
                </text>
              </g>
            )}
          </g>

          {/* delta matrix */}
          <g opacity={deltaU}>
            <text x={DELTA_X} y={GRID_Y - 28} fill={colors.TEXT} fontSize={18}>
              delta rule — write the error
            </text>
            <StateGrid S={SD} x={DELTA_X} y={GRID_Y} u={deltaU} />
            <rect x={DELTA_X - 5} y={GRID_Y - 5} width={gridW + 8} height={gridW + 8} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} opacity={0.7} />
            {barsU > 0 && (
              <g opacity={barsU}>
                {RECALL_DELTA.map((r, ki) => (
                  <g key={ki}>
                    <rect x={DELTA_X + ki * 54} y={GRID_Y + gridW + 34} width={40} height={10} rx={2} fill={KEY_COLORS[ki]} opacity={0.25} />
                    <rect x={DELTA_X + ki * 54} y={GRID_Y + gridW + 34} width={40 * clamp01(r)} height={10} rx={2} fill={KEY_COLORS[ki]} />
                    <text x={DELTA_X + ki * 54 + 20} y={GRID_Y + gridW + 62} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily="monospace">
                      {r.toFixed(2)}
                    </text>
                  </g>
                ))}
                <text x={DELTA_X + 230} y={GRID_Y + gridW + 44} fill={colors.POSITIVE} fontSize={17} fontFamily="monospace" fontWeight={700}>
                  avg {AVG_DELTA.toFixed(2)}
                </text>
              </g>
            )}
          </g>
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Error correction
        </text>
      </g>
      <MathLabel
        tex="S \leftarrow S + \beta\,k\,(v - S^{\top}k)^{\top}"
        x={700}
        y={44}
        fontSize={21}
        color={colors.POSITIVE}
        opacity={eqU * mainOp}
      />
      {identU > 0 && (
        <g opacity={identU * mainOp}>
          <rect x={280} y={560} width={720} height={54} rx={10} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <MathLabel
            tex="S + \beta k (v - S^{\top}k)^{\top} \;=\; (I - \beta\,k k^{\top})\,S + \beta\,k v^{\top}"
            x={640}
            y={587}
            fontSize={20}
            color={colors.WARM}
            anchor="middle"
          />
        </g>
      )}

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Read before you write.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            Blind addition recalls the latest facts at 0.59.
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            Writing only the error recalls them at 0.89.
          </text>
        </g>
      )}
    </>
  );
}

export function DeltaErrorCorrection() {
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
