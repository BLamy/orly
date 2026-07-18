// arXiv:2607.03502 — "Reading Between the Dots", chapter 3: what transparent
// computation across fillers looks like versus no computation at all. Two
// hand-built two-layer attention toys, both computed for real at module
// scope: a RELAY model (question -> fillers -> answer; the fillers are
// load-bearing scratch space) and a DIRECT model (the question attends
// straight to the operands; the fillers are decorative). The paper's two
// causal instruments tell them apart: ablating attention into the filler
// positions kills the relay model's answer (13.00 -> 0.00) and leaves the
// direct model untouched (13.00 -> 13.00); transplanting a donor prompt's
// filler-position activations (KV-cache transplant, Section 4.3) flips the
// relay model to the donor's answer (13.00 -> 7.00) and does nothing to the
// direct model. On the real models the paper reports the same signatures:
// direct question-to-answer attention falls from ~15.8% to 3-4% when fillers
// are present, and a filler-only KV transplant drives the donor answer's
// rank from 96 to 11.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The two toys (same embedding scheme as chapter 2's machine).
// ---------------------------------------------------------------------------

const P = 6;
const DIM = 12;
const SCALE = 20;

type Vec = number[];
type Mat = number[][];

function embed(a: number, b: number): Mat {
  const X: Mat = Array.from({ length: P }, () => Array(DIM).fill(0));
  for (let i = 0; i < P; i++) X[i][i] = 1;
  X[0][6] = a / SCALE;
  X[1][6] = b / SCALE;
  return X;
}
const softmax = (r: Vec): Vec => {
  const m = Math.max(...r);
  const e = r.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
};
const attnRows = (targets: number[][]): Mat =>
  targets.map((tgt) => softmax(Array.from({ length: P }, (_, j) => (tgt.includes(j) ? 10 : 0))));

interface Options {
  ablate?: boolean;
  transplant?: Mat | null;
}
interface Out {
  H: Mat;
  a2: Mat;
  ans: number;
}

function runRelay(a: number, b: number, { ablate = false, transplant = null }: Options = {}): Out {
  const X = embed(a, b);
  const a1A = attnRows(Array.from({ length: P }, (_, i) => (i === 2 ? [0] : [5])));
  const a1B = attnRows(Array.from({ length: P }, (_, i) => (i === 3 ? [1] : [5])));
  const H = X.map((r) => [...r]);
  for (let i = 0; i < P; i++) {
    H[i][7] += a1A[i].reduce((s, w, j) => s + w * X[j][6], 0);
    H[i][8] += a1B[i].reduce((s, w, j) => s + w * X[j][6], 0);
  }
  if (transplant) {
    H[2] = transplant[2].slice();
    H[3] = transplant[3].slice();
  }
  let a2 = attnRows(Array.from({ length: P }, (_, i) => (i === 5 ? [2, 3] : [5])));
  if (ablate) {
    a2 = a2.map((row) => {
      const r = row.map((w, j) => (j === 2 || j === 3 ? 0 : w));
      const s = r.reduce((x, y) => x + y, 0) || 1;
      return r.map((w) => w / s);
    });
  }
  const O = H.map((r) => [...r]);
  for (let i = 0; i < P; i++) O[i][9] += 2 * a2[i].reduce((s, w, j) => s + w * (H[j][7] + H[j][8]), 0);
  return { H, a2, ans: O[5][9] * SCALE };
}

function runDirect(a: number, b: number, { ablate = false, transplant = null }: Options = {}): Out {
  const X = embed(a, b);
  const H = X.map((r) => [...r]);
  if (transplant) {
    H[2] = transplant[2].slice();
    H[3] = transplant[3].slice();
  }
  let a2 = attnRows(Array.from({ length: P }, (_, i) => (i === 5 ? [0, 1] : [5])));
  if (ablate) {
    a2 = a2.map((row) => {
      const r = row.map((w, j) => (j === 2 || j === 3 ? 0 : w));
      const s = r.reduce((x, y) => x + y, 0) || 1;
      return r.map((w) => w / s);
    });
  }
  const O = H.map((r) => [...r]);
  for (let i = 0; i < P; i++) O[i][9] += 2 * a2[i].reduce((s, w, j) => s + w * H[j][6], 0);
  return { H, a2, ans: O[5][9] * SCALE };
}

// the experiments (A=7, B=6; donor A=3, B=4)
const RELAY = runRelay(7, 6); // 13.00
const DIRECT = runDirect(7, 6); // 13.00
const RELAY_ABL = runRelay(7, 6, { ablate: true }); // 0.00
const DIRECT_ABL = runDirect(7, 6, { ablate: true }); // 13.00
const DONOR = runRelay(3, 4); // 7.00
const RELAY_TX = runRelay(7, 6, { transplant: DONOR.H }); // 7.00
const DIRECT_TX = runDirect(7, 6, { transplant: runDirect(3, 4).H }); // 13.00

const TOKS = ['A', 'B', '.', '.', '.', 'Q'];

// ---------------------------------------------------------------------------
// Layout — two attention heatmaps side by side, results table below.
// ---------------------------------------------------------------------------

const CELL = 30;
const HM_L = { x: 220, y: 190 };
const HM_R = { x: 760, y: 190 };

const TABLE_Y = 452;
const CAM_MAPS: CameraState = { x: 640, y: 300, k: 1.15 };
const CAM_TABLE: CameraState = { x: 640, y: 430, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  mapsU: ChannelRef<number>;
  relayHi: ChannelRef<number>;
  paperU: ChannelRef<number>;
  ablU: ChannelRef<number>;
  txU: ChannelRef<number>;
  tableU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const mapsU = tl.channel('mapsU', 0);
  const relayHi = tl.channel('relayHi', 0);
  const paperU = tl.channel('paperU', 0);
  const ablU = tl.channel('ablU', 0);
  const txU = tl.channel('txU', 0);
  const tableU = tl.channel('tableU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — two suspects
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Two models, same prompt, same correct answer of thirteen. One genuinely computes through the dots. One ignores them completely. From the outside they are indistinguishable.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_MAPS, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(mapsU, 1, { at: 1.2, dur: 1.6, ease: ease.draw });
  tl.hold(6.3, 0.5);

  // Beat 2 — the attention signature
  tl.caption({
    at: 6.8,
    dur: 6.2,
    text: 'The first fingerprint is the attention map. In the relay model the question barely looks at the operands — its attention flows through the dots, and the dots look back at the operands. A two hop relay.',
  });
  tl.tween(relayHi, 1, { at: 7.6, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 13.2,
    dur: 5.8,
    text: 'In the direct model the dots are dark rows and dark columns — nothing reads them, they read nothing. The paper sees the same signature at scale: direct question to answer attention collapses from about sixteen percent to three when fillers appear.',
  });
  tl.tween(paperU, 1, { at: 16.4, dur: 0.9, ease: ease.enter });
  tl.hold(19.0, 0.6);

  // Beat 3 — ablation
  tl.caption({
    at: 19.6,
    dur: 6.0,
    text: 'Attention maps can mislead, so intervene. First experiment: forbid the final layer from reading the filler positions and renormalize. If the dots carry the computation, the answer should die.',
  });
  tl.tween(cam, CAM_TABLE, { at: 20.0, dur: 1.4, ease: ease.move });
  tl.tween(tableU, 1, { at: 20.8, dur: 0.9, ease: ease.enter });
  tl.tween(ablU, 1, { at: 23.4, dur: 0.9, ease: ease.pop });
  tl.caption({
    at: 26.0,
    dur: 5.4,
    text: 'And it does — the relay model falls from thirteen to zero, while the direct model does not flinch. The dots were load bearing in one machine and scenery in the other.',
  });
  tl.hold(31.4, 0.6);

  // Beat 4 — transplant
  tl.caption({
    at: 32.0,
    dur: 6.2,
    text: 'Second experiment, the paper’s sharpest: transplant. Run a donor prompt whose answer is seven, and splice its hidden states into the target — at the filler positions only.',
  });
  tl.tween(txU, 1, { at: 35.2, dur: 0.9, ease: ease.pop });
  tl.caption({
    at: 38.4,
    dur: 6.0,
    text: 'The relay model now answers seven — the donor’s answer, smuggled in through the dots. The paper reports the same causal pull at scale: a filler only transplant drives the donor answer from rank ninety six up to rank eleven.',
  });
  tl.hold(44.4, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 45.0,
    dur: 5.6,
    text: 'So transparent computation has fingerprints: a relay in the attention, intermediates under the lens, and causal weight under ablation and transplant. Time to look at the real models.',
  });
  tl.tween(closeU, 1, { at: 45.8, dur: 1.0, ease: ease.enter });
  tl.hold(50.6, 1.2);

  return { tl, cam, titleU, mapsU, relayHi, paperU, ablU, txU, tableU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/filler-relay-patterns/overrides.json',
  slug: 'filler-relay-patterns',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Combined attention picture per model: layer-2 rows, plus layer-1 filler rows for the relay. */
function attnPicture(relay: boolean): number[][] {
  if (relay) {
    const a1A = attnRows(Array.from({ length: P }, (_, i) => (i === 2 ? [0] : [5])));
    const a1B = attnRows(Array.from({ length: P }, (_, i) => (i === 3 ? [1] : [5])));
    return Array.from({ length: P }, (_, i) => {
      if (i === 2) return a1A[2];
      if (i === 3) return a1B[3];
      return RELAY.a2[i];
    });
  }
  return DIRECT.a2;
}
const PIC_RELAY = attnPicture(true);
const PIC_DIRECT = attnPicture(false);

function Heatmap({
  pic,
  x,
  y,
  title,
  sub,
  u,
  hiRelay,
}: {
  pic: number[][];
  x: number;
  y: number;
  title: string;
  sub: string;
  u: number;
  hiRelay: number;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <text x={x} y={y - 44} fill={colors.TEXT} fontSize={17}>
        {title}
      </text>
      <text x={x} y={y - 24} fill={colors.MUTED} fontSize={12}>
        {sub}
      </text>
      {pic.map((row, i) =>
        row.map((w, j) => (
          <rect
            key={`${i}-${j}`}
            x={x + j * CELL}
            y={y + i * CELL}
            width={CELL - 3}
            height={CELL - 3}
            rx={4}
            fill={colors.heat(clamp01(w))}
          />
        )),
      )}
      {TOKS.map((t, i) => (
        <g key={i}>
          <text x={x + i * CELL + CELL / 2 - 1} y={y - 6} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
            {t}
          </text>
          <text x={x - 10} y={y + i * CELL + 19} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
            {t}
          </text>
        </g>
      ))}
      {/* relay highlight: Q->fillers and fillers->operands */}
      {hiRelay > 0 && (
        <g opacity={hiRelay}>
          <rect x={x + 2 * CELL - 2} y={y + 5 * CELL - 2} width={2 * CELL} height={CELL} rx={4} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
          <rect x={x - 2} y={y + 2 * CELL - 2} width={2 * CELL} height={2 * CELL} rx={4} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
        </g>
      )}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const mapsU = s.get(scene.mapsU);
  const relayHi = s.get(scene.relayHi);
  const paperU = s.get(scene.paperU);
  const ablU = s.get(scene.ablU);
  const txU = s.get(scene.txU);
  const tableU = s.get(scene.tableU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;

  const rows = [
    { label: 'clean run', relay: RELAY.ans, direct: DIRECT.ans, u: tableU },
    { label: 'ablate filler reads', relay: RELAY_ABL.ans, direct: DIRECT_ABL.ans, u: ablU },
    { label: 'transplant donor fillers (donor answers 7)', relay: RELAY_TX.ans, direct: DIRECT_TX.ans, u: txU },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <Heatmap
            pic={PIC_RELAY}
            x={HM_L.x}
            y={HM_L.y}
            title="relay model"
            sub="rows attend to columns · computed softmax weights"
            u={mapsU}
            hiRelay={relayHi}
          />
          <Heatmap
            pic={PIC_DIRECT}
            x={HM_R.x}
            y={HM_R.y}
            title="direct model"
            sub="the fillers are dark: unread and unreading"
            u={mapsU}
            hiRelay={0}
          />
          {paperU > 0 && (
            <text x={HM_L.x} y={HM_L.y + 6 * CELL + 34} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={paperU}>
              paper, at scale: direct question→answer attention ~15.8% → 3–4% with fillers
            </text>
          )}

          {/* results table */}
          {tableU > 0 && (
            <g opacity={tableU}>
              <text x={220} y={TABLE_Y - 14} fill={colors.TEXT} fontSize={16}>
                the two interventions, computed
              </text>
              <text x={700} y={TABLE_Y + 16} fill={colors.ACCENT} fontSize={13} fontWeight={600}>
                relay
              </text>
              <text x={850} y={TABLE_Y + 16} fill={colors.MUTED} fontSize={13} fontWeight={600}>
                direct
              </text>
              {rows.map((r, i) => {
                if (r.u <= 0) return null;
                const y = TABLE_Y + 46 + i * 36;
                const relayBad = Math.abs(r.relay - 13) > 0.5;
                return (
                  <g key={r.label} opacity={r.u}>
                    <text x={220} y={y} fill={colors.TEXT} fontSize={14}>
                      {r.label}
                    </text>
                    <text x={700} y={y} fill={relayBad ? colors.NEGATIVE : colors.POSITIVE} fontSize={15} fontFamily="monospace" fontWeight={600}>
                      {r.relay.toFixed(2)}
                    </text>
                    <text x={850} y={y} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
                      {r.direct.toFixed(2)}
                    </text>
                  </g>
                );
              })}
              {txU > 0 && (
                <text x={220} y={TABLE_Y + 46 + 3 * 36} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={txU}>
                  paper, at scale: filler-only KV transplant lifts donor answer rank 96 → 11
                </text>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Relay or scenery?
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.03502 · §4.3 ablation + transplant
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Interventions, not vibes.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Ablate the dots and the relay dies; transplant the dots and the
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            donor answer rides in. Causal tests separate work from scenery.
          </text>
        </g>
      )}
    </>
  );
}

export function FillerRelayPatterns() {
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
