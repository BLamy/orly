// Explained: State-Space Models — chapter 5: where this sits. Three memory
// designs on one stage: attention's exact growing list, the SSM's gated
// decaying state, and the delta rule's error-correcting writes. The update
// demo is genuinely computed at module scope (d = 16): store key→value, then
// REWRITE the same key with a new value. Plain accumulation reads back a
// blend (cosine 0.65 with both values); the delta-rule update reads the new
// value at 1.00 and the old one at −0.16 — it erased before it wrote.
// Bridges to Explained: Transformers (attention) and the delta-rule book.
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
// Real math, module scope. d = 16. Same key written twice.
// ---------------------------------------------------------------------------

const D = 16;
const rand = mulberry32(20260705);

function randUnit(): number[] {
  const v = Array.from({ length: D }, () => rand() * 2 - 1);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

const K0 = randUnit();
const V0 = randUnit();
const V1 = randUnit();

type Mat = number[][];
const zeros = (): Mat => Array.from({ length: D }, () => new Array(D).fill(0) as number[]);
const readK = (S: Mat, k: number[]): number[] =>
  Array.from({ length: D }, (_, j) => k.reduce((acc, ki, i) => acc + ki * S[i][j], 0));
const cosSim = (u: number[], v: number[]): number => {
  const n = Math.hypot(...u) * Math.hypot(...v);
  return n < 1e-12 ? 0 : u.reduce((acc, x, i) => acc + x * v[i], 0) / n;
};
const writeAcc = (S: Mat, k: number[], v: number[]): Mat =>
  S.map((r, i) => r.map((x, j) => x + k[i] * v[j]));
const writeDelta = (S: Mat, k: number[], v: number[]): Mat => {
  const sk = readK(S, k);
  return S.map((r, i) => r.map((x, j) => x - k[i] * sk[j] + k[i] * v[j]));
};

// state snapshots: [empty, after first write, after rewrite]
const ACC_STATES: Mat[] = (() => {
  const s1 = writeAcc(zeros(), K0, V0);
  return [zeros(), s1, writeAcc(s1, K0, V1)];
})();
const DELTA_STATES: Mat[] = (() => {
  const s1 = writeDelta(zeros(), K0, V0);
  return [zeros(), s1, writeDelta(s1, K0, V1)];
})();

// read-back similarities after the rewrite (stage 2)
const ACC_NEW = cosSim(readK(ACC_STATES[2], K0), V1); // 0.65
const ACC_OLD = cosSim(readK(ACC_STATES[2], K0), V0); // 0.65
const DELTA_NEW = cosSim(readK(DELTA_STATES[2], K0), V1); // 1.00
const DELTA_OLD = cosSim(readK(DELTA_STATES[2], K0), V0); // -0.16

const matAt = (states: Mat[], u: number): Mat => {
  const f = Math.max(0, Math.min(2, u));
  const i = Math.floor(f);
  if (i >= 2) return states[2];
  const t = f - i;
  return states[i].map((r, a) => r.map((x, b) => x + (states[i + 1][a][b] - x) * t));
};

// ---------------------------------------------------------------------------
// Layout: three columns — attention / accumulate / delta.
// ---------------------------------------------------------------------------

const COL_ATT_X = 120;
const COL_ACC_X = 500;
const COL_DEL_X = 880;
const COL_Y = 160;
const CELL = 11;

const CAM_ATT: CameraState = { x: 260, y: 300, k: 1.35 };
const CAM_MID: CameraState = { x: 690, y: 320, k: 1.3 };
const CAM_DEL: CameraState = { x: 1000, y: 320, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  attU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  writeStage: ChannelRef<number>; // 0 empty → 1 first write → 2 rewrite
  readU: ChannelRef<number>;
  deltaEqU: ChannelRef<number>;
  spectrumU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const attU = tl.channel('attU', 0);
  const gridU = tl.channel('gridU', 0);
  const writeStage = tl.channel('writeStage', 0);
  const readU = tl.channel('readU', 0);
  const deltaEqU = tl.channel('deltaEqU', 0);
  const spectrumU = tl.channel('spectrumU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the family portrait
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Last chapter of the book — time to place state-space models on the map. There are three big designs for machine memory, and they differ in one question: how do you forget?',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.9,
    dur: 5.6,
    text: 'Attention never forgets: it keeps the exact list and searches it. You met this in the transformers book. Perfect recall, and a cache that grows without limit.',
  });
  tl.tween(cam, CAM_ATT, { at: 7.1, dur: 1.4, ease: ease.move });
  tl.tween(attU, 1, { at: 7.5, dur: 1.2, ease: ease.draw });
  tl.hold(12.7, 0.6);

  // Beat 2 — the stress test
  tl.caption({
    at: 13.3,
    dur: 6.0,
    text: 'The fixed-state designs both compress — but watch how differently they handle one everyday event: a fact that changes. We store a key with a value, then write a new value to the same key.',
  });
  tl.tween(cam, CAM_MID, { at: 13.5, dur: 1.5, ease: ease.move });
  tl.tween(gridU, 1, { at: 14.3, dur: 1.2, ease: ease.draw });
  tl.tween(writeStage, 1, { at: 17.2, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 19.9,
    dur: 5.2,
    text: 'The state-space habit is to accumulate: add the new pair on top and let decay clean up eventually. Here comes the second write, onto the same key.',
  });
  tl.tween(writeStage, 2, { at: 22.4, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 25.5,
    dur: 6.0,
    text: 'Now read that key back. The answer is a blend — cosine point six five with the new value, and point six five with the old one. Both facts, smeared together. Neither one trusted.',
  });
  tl.tween(readU, 1, { at: 26.3, dur: 0.9, ease: ease.enter });
  tl.hold(31.7, 0.6);

  // Beat 3 — the delta rule
  tl.caption({
    at: 32.3,
    dur: 6.2,
    text: 'The third design fixes exactly this. Before writing, the delta rule reads what the state already says about that key, and subtracts it. Erase first, then write.',
  });
  tl.tween(cam, CAM_DEL, { at: 32.5, dur: 1.5, ease: ease.move });
  tl.tween(deltaEqU, 1, { at: 33.5, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 38.9,
    dur: 6.0,
    text: 'Same rewrite, same sized state — computed for real. Read the key back now: cosine one point zero with the new value, and minus point one six with the old. The stale fact is gone.',
  });
  tl.hold(45.1, 0.6);

  // Beat 4 — the spectrum
  tl.caption({
    at: 45.7,
    dur: 6.4,
    text: 'So the map looks like this. Attention forgets nothing and pays in memory. State-space models forget by time, with gates deciding what survives. The delta rule forgets by content, replacing exactly what changed.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 45.9, dur: 1.6, ease: ease.move });
  tl.tween(spectrumU, 1, { at: 47.1, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 52.5,
    dur: 5.4,
    text: 'The frontier models of twenty twenty six mix all three: attention layers for exact lookup, state-space layers for cheap length, delta-rule layers for facts that change.',
  });
  tl.hold(58.1, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 58.7,
    dur: 5.8,
    text: 'You now hold the whole trade: exact and expensive, compressed and steerable, or corrected in place. The delta rule earned its own book — that is where we go next.',
  });
  tl.tween(dimU, 1, { at: 58.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 59.9, dur: 0.9, ease: ease.enter });
  tl.hold(64.5, 1.2);

  return { tl, cam, titleU, attU, gridU, writeStage, readU, deltaEqU, spectrumU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/ssm-memory-spectrum/overrides.json',
  slug: 'ssm-memory-spectrum',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const HEAT_SCALE = 0.55; // max |entry| ≈ 0.5 across snapshots

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

function SimBars({ x, y, simNew, simOld, u }: { x: number; y: number; simNew: number; simOld: number; u: number }) {
  const W = 130;
  return (
    <g opacity={u}>
      <text x={x} y={y - 8} fill={colors.MUTED} fontSize={12}>
        read the key back — similarity with…
      </text>
      {[
        { label: 'new value', v: simNew, color: colors.POSITIVE },
        { label: 'old value', v: simOld, color: colors.WARM },
      ].map((row, r) => (
        <g key={row.label}>
          <text x={x} y={y + 22 + r * 26} fill={colors.MUTED} fontSize={12}>
            {row.label}
          </text>
          <line x1={x + 78} y1={y + 18 + r * 26} x2={x + 78} y2={y + 26 + r * 26} stroke={colors.GRID} />
          <rect
            x={row.v >= 0 ? x + 78 : x + 78 + row.v * W}
            y={y + 12 + r * 26}
            width={Math.abs(row.v) * W}
            height={12}
            rx={3}
            fill={row.color}
            opacity={0.9}
          />
          <text x={x + 78 + Math.max(0, row.v) * W + 8} y={y + 22 + r * 26} fill={row.color} fontSize={13} fontFamily="monospace" fontWeight={600}>
            {row.v.toFixed(2)}
          </text>
        </g>
      ))}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const attU = s.get(scene.attU);
  const gridU = s.get(scene.gridU);
  const writeStage = s.get(scene.writeStage);
  const readU = s.get(scene.readU);
  const deltaEqU = s.get(scene.deltaEqU);
  const spectrumU = s.get(scene.spectrumU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const accS = matAt(ACC_STATES, writeStage);
  const delS = matAt(DELTA_STATES, writeStage);
  const gridW = D * CELL;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* attention column */}
          <g opacity={attU}>
            <text x={COL_ATT_X} y={COL_Y - 34} fill={colors.TEXT} fontSize={18}>
              attention
            </text>
            <text x={COL_ATT_X} y={COL_Y - 12} fill={colors.MUTED} fontSize={13}>
              keep the exact list
            </text>
            {Array.from({ length: 9 }, (_, i) => (
              <g key={i} opacity={clamp01(attU * 9 - i)}>
                <rect
                  x={COL_ATT_X}
                  y={COL_Y + i * 26}
                  width={200}
                  height={20}
                  rx={4}
                  fill={colors.ACCENT}
                  opacity={0.14 + 0.05 * i}
                />
                <text x={COL_ATT_X + 8} y={COL_Y + i * 26 + 14} fill={colors.TEXT} fontSize={11} fontFamily="monospace" opacity={0.8}>
                  {i === 3 ? 'key → old value' : i === 7 ? 'key → new value' : `k${i + 1} v${i + 1}`}
                </text>
              </g>
            ))}
            <text x={COL_ATT_X} y={COL_Y + 9 * 26 + 22} fill={colors.NEGATIVE} fontSize={13}>
              grows forever · recalls exactly
            </text>
          </g>

          {/* accumulate column */}
          <g opacity={gridU}>
            <text x={COL_ACC_X} y={COL_Y - 34} fill={colors.TEXT} fontSize={18}>
              state-space: accumulate
            </text>
            <text x={COL_ACC_X} y={COL_Y - 12} fill={colors.MUTED} fontSize={13}>
              add on top, decay later
            </text>
            <StateGrid S={accS} x={COL_ACC_X} y={COL_Y} u={gridU} />
            <rect x={COL_ACC_X - 5} y={COL_Y - 5} width={gridW + 8} height={gridW + 8} rx={6} fill="none" stroke={colors.SECONDARY} strokeWidth={1.5} opacity={0.7} />
            <SimBars x={COL_ACC_X} y={COL_Y + gridW + 26} simNew={ACC_NEW * readU} simOld={ACC_OLD * readU} u={readU} />
          </g>

          {/* delta column */}
          <g opacity={deltaEqU}>
            <text x={COL_DEL_X} y={COL_Y - 34} fill={colors.TEXT} fontSize={18}>
              delta rule: correct
            </text>
            <text x={COL_DEL_X} y={COL_Y - 12} fill={colors.MUTED} fontSize={13}>
              erase first, then write
            </text>
            <StateGrid S={delS} x={COL_DEL_X} y={COL_Y} u={deltaEqU} />
            <rect x={COL_DEL_X - 5} y={COL_Y - 5} width={gridW + 8} height={gridW + 8} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} opacity={0.7} />
            <SimBars x={COL_DEL_X} y={COL_Y + gridW + 26} simNew={DELTA_NEW * deltaEqU} simOld={DELTA_OLD * deltaEqU} u={deltaEqU * readU} />
          </g>

          {/* the spectrum strip */}
          {spectrumU > 0 && (
            <g opacity={spectrumU}>
              <line x1={160} y1={600} x2={1120} y2={600} stroke={colors.GRID} strokeWidth={2} />
              {[
                { x: 220, label: 'forgets nothing', sub: 'attention', color: colors.ACCENT },
                { x: 640, label: 'forgets by time', sub: 'gated SSM', color: colors.SECONDARY },
                { x: 1060, label: 'forgets by content', sub: 'delta rule', color: colors.POSITIVE },
              ].map((p) => (
                <g key={p.sub}>
                  <circle cx={p.x} cy={600} r={7} fill={p.color} />
                  <text x={p.x} y={580} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                    {p.label}
                  </text>
                  <text x={p.x} y={624} textAnchor="middle" fill={p.color} fontSize={12}>
                    {p.sub}
                  </text>
                </g>
              ))}
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Where this sits
        </text>
        <text x={40} y={70} fill={colors.MUTED} fontSize={14}>
          three ways to forget
        </text>
      </g>
      <MathLabel
        tex="S \leftarrow S - k\,(k^{\top} S) + k\,v^{\top}"
        x={820}
        y={44}
        fontSize={21}
        color={colors.POSITIVE}
        opacity={deltaEqU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={220} width={840} height={200} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Three ways to forget.
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Attention keeps everything. Gated states forget by time.
          </text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            The delta rule forgets by content — next book.
          </text>
          <text x={640} y={392} textAnchor="middle" fill={colors.SECONDARY} fontSize={14}>
            The Explainers · State-Space Models
          </text>
        </g>
      )}
    </>
  );
}

export function SsmMemorySpectrum() {
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
