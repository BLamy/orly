// Turn the viewpoint, not the evidence
//
// Sources (S-Space, arXiv 2610.13527; github.com/MirroS-Lab/S-Space @ fbb0940):
//   sspace/experiments/spinbench/perspective_taking/adapter.py
//     VIEW_ROTATIONS (lines 21–26): x is right, z is close;
//       left  (x,z) → (z, −x) · right (x,z) → (−z, x) · back (x,z) → (−x, −z)
//     rotate_coordinates (268–292) · spinbench_target_margin (295–325):
//       left decision uses −x', closer decision uses z'; positive chooses A;
//       an exactly-zero margin raises, so the back view asks LEFT here
//   sspace/experiments/spinbench/perspective_taking/projection.py
//     source_coordinates (118–131): the single measured source axis; unobserved
//       axes stay zero · _rotation_prediction (134–141): rotate, then margin
//     score_spinbench_projection: original directed margin (swapped recorded, not averaged)
//   paper Table 10 — SpinBench without premise, n = 146, Qwen3.6-27B:
//     direct 60.96% · reasoning 83.56% · S-Space + Rotation 95.21%
//
// Machine: a top-down horizontal/depth cross-section with apple A, cup B and a
// viewer. The measured relation (A − B = +2 horizontal) never changes; the
// viewer walks around the scene and the coordinate frame rotates rigidly with
// it, so the same evidence reads out as different signed coordinates. A sparse
// H/V/D vector at the right shows the source and rotated values; a decision
// badge reads the requested sign. The rotation is an EXTERNAL computation
// supplied by the experiment, labelled as such. Toy relation; readout
// coordinates are not metric.
import type { ReactNode } from 'react';
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Vec } from '../../primitives';

// ---------------------------------------------------------------------------
// Tiny pure kit (local; no shared edits)
// ---------------------------------------------------------------------------
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const fmt = (v: number, d = 1): string => {
  const r = Number(v.toFixed(d));
  return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toFixed(d);
};

const INK = {
  apple: '#fb7185',
  cup: '#38bdf8',
  hx: colors.WARM,
  vy: colors.SECONDARY,
  dz: colors.POSITIVE,
  viewer: colors.TEXT,
  text: colors.TEXT,
  muted: colors.MUTED,
  faint: colors.ink.faint,
  panel: colors.PANEL,
  bg: colors.BG,
} as const;

const BEAT_EVERY = 8;
const CAPTION_DUR = 8;
const CHAPTER_DUR = 74;
const beatAt = (i: number): number => 0.4 + BEAT_EVERY * i;

function narrate(tl: Timeline, lines: readonly string[]): ChannelRef<number> {
  const beat = tl.channel('beat', -1);
  lines.forEach((text, i) => {
    tl.caption({ at: beatAt(i), dur: CAPTION_DUR, text });
    tl.tween(beat, i, { at: beatAt(i), dur: 0.6, ease: ease.enter });
  });
  tl.hold(CHAPTER_DUR - 1, 1);
  return beat;
}
const on = (b: number, i: number): number => clamp01(b - (i - 1));
const win = (b: number, i: number, j: number): number => on(b, i) * (1 - clamp01(b - j));

function Txt({
  x, y, children, size = 14, fill = INK.text, opacity = 1, anchor = 'start', mono = false, weight = 400, spacing,
}: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string; opacity?: number;
  anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number; spacing?: number;
}) {
  if (opacity <= 0.003) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={fill} opacity={opacity} textAnchor={anchor} fontWeight={weight}
      letterSpacing={spacing} fontFamily={mono ? colors.font.mono : colors.font.ui}>
      {children}
    </text>
  );
}
const monoW = (text: string, size: number): number => text.length * size * 0.602;
function Chip({ x, y, text, color = INK.muted, opacity = 1, size = 12, anchor = 'middle' }: {
  x: number; y: number; text: string; color?: string; opacity?: number; size?: number; anchor?: 'start' | 'middle' | 'end';
}) {
  if (opacity <= 0.003) return null;
  const w = monoW(text, size) + 16;
  const h = size + 10;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - h / 2} width={w} height={h} rx={5} fill={INK.panel} fillOpacity={0.92} stroke={color} strokeWidth={1.1} />
      <text x={left + w / 2} y={y + size * 0.36} fontSize={size} textAnchor="middle" fill={color} fontFamily={colors.font.mono}>{text}</text>
    </g>
  );
}
function Field({ x, y, w, h, opacity, children }: { x: number; y: number; w: number; h: number; opacity: number; children?: ReactNode }) {
  if (opacity <= 0.003) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={INK.bg} />
      <rect x={x} y={y} width={w} height={h} rx={12} fill={INK.panel} stroke={colors.GRID} />
      {children}
    </g>
  );
}
function Apple({ x, y, r, opacity = 1 }: { x: number; y: number; r: number; opacity?: number }) {
  if (opacity <= 0.003) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={INK.apple} />
      <line x1={x} y1={y - r} x2={x} y2={y - r * 1.35} stroke="#6b4b2b" strokeWidth={r * 0.1} strokeLinecap="round" />
    </g>
  );
}
function Cup({ x, y, r, opacity = 1 }: { x: number; y: number; r: number; opacity?: number }) {
  if (opacity <= 0.003) return null;
  const w = r * 1.5;
  const h = r * 1.6;
  return (
    <g opacity={opacity}>
      <path d={`M${x - w / 2},${y - h / 2} h${w} v${h * 0.72} q0,${h * 0.28} ${-w * 0.35},${h * 0.28} h${-w * 0.3} q${-w * 0.35},0 ${-w * 0.35},${-h * 0.28} z`} fill={INK.cup} />
      <path d={`M${x + w / 2},${y - h * 0.25} q${r * 0.7},0 ${r * 0.7},${r * 0.45} q0,${r * 0.45} ${-r * 0.7},${r * 0.45}`} stroke={INK.cup} strokeWidth={r * 0.18} fill="none" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Data — the official rotations (adapter.py VIEW_ROTATIONS), exact arithmetic
// ---------------------------------------------------------------------------
type V3 = readonly [number, number, number];
const VIEW_ROTATIONS = {
  front: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  left: [[0, 0, 1], [0, 1, 0], [-1, 0, 0]],
  right: [[0, 0, -1], [0, 1, 0], [1, 0, 0]],
  back: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
} as const;
type View = keyof typeof VIEW_ROTATIONS;
const rotate = (v: V3, view: View): V3 => {
  const R = VIEW_ROTATIONS[view];
  return [0, 1, 2].map((r) => R[r][0] * v[0] + R[r][1] * v[1] + R[r][2] * v[2]) as unknown as V3;
};
/** spinbench_target_margin: left uses −x', closer uses z'; positive → A. */
const targetMargin = (rotated: V3, property: 'left' | 'closer'): number => (property === 'left' ? -rotated[0] : rotated[2]);

const SOURCE_MARGIN = 2; // illustrative: A (apple) right of B (cup) in the source view
const SOURCE: V3 = [SOURCE_MARGIN, 0, 0]; // source_coordinates: horizontal only, others zero
const STEPS = [
  { view: 'left', property: 'closer', formula: "(x', z') = (z, -x)", theta: 90 },
  { view: 'right', property: 'closer', formula: "(x', z') = (-z, x)", theta: -90 },
  { view: 'back', property: 'left', formula: "(x', z') = (-x, -z)", theta: -180 },
] as const;
const RESULTS = STEPS.map((st) => {
  const rotated = rotate(SOURCE, st.view);
  const margin = targetMargin(rotated, st.property);
  return { ...st, rotated, margin, answer: margin > 0 ? 'A' : 'B' };
});
// sanity (module scope): left → (0,0,−2) closer → B; right → (0,0,2) closer → A; back → (−2,0,0) left → A
const EXPECT: readonly [V3, string][] = [[[0, 0, -2], 'B'], [[0, 0, 2], 'A'], [[-2, 0, 0], 'A']];
RESULTS.forEach((r, i) => {
  const ok = r.rotated.every((v, k) => v === EXPECT[i][0][k]) && r.answer === EXPECT[i][1];
  if (!ok) throw new Error(`S-Space rotation check failed for ${r.view}`);
});

// Table 10 — SpinBench without premise, n = 146, Qwen3.6-27B
const BARS = [
  { key: 'direct', label: 'direct answer', pct: 60.96, color: INK.muted },
  { key: 'reasoning', label: 'reasoning', pct: 83.56, color: INK.vy },
  { key: 'sspace', label: 'S-Space + rotation', pct: 95.21, color: INK.dz },
] as const;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const MAP = { cx: 560, cy: 350, s: 85, R: 180 } as const; // top-down cross-section
const A_POS = { x: 1, z: 0 } as const; // apple
const B_POS = { x: -1, z: 0 } as const; // cup
const mx = (x: number): number => MAP.cx + x * MAP.s;
const mz = (z: number): number => MAP.cy + z * MAP.s; // close = toward the bottom (front viewer)
const rad = (deg: number): number => (deg * Math.PI) / 180;
/** viewer position for frame angle θ (deg): front 0 → bottom; left 90; right −90; back ±180 */
const viewerAt = (deg: number) => ({ x: MAP.cx - MAP.R * Math.sin(rad(deg)), y: MAP.cy + MAP.R * Math.cos(rad(deg)) });
/** frame axes (unit screen vectors) for θ: x' = (cos, sin), z' (close) = (−sin, cos) */
const frameAxes = (deg: number) => ({
  x: { dx: Math.cos(rad(deg)), dy: Math.sin(rad(deg)) },
  z: { dx: -Math.sin(rad(deg)), dy: Math.cos(rad(deg)) },
});
/** the relative vector A − B expressed in the frame at θ (continuous; snaps to the table at cardinal views) */
const relativeIn = (deg: number): { x: number; z: number } => {
  const dx = A_POS.x - B_POS.x;
  const dz = A_POS.z - B_POS.z;
  const ax = frameAxes(deg);
  return { x: dx * ax.x.dx + dz * ax.x.dy, z: dx * ax.z.dx + dz * ax.z.dy };
};

const PANEL = { x: 900, y: 150, w: 330, h: 378 } as const; // sparse vector + decision
const CELL = { w: 76, h: 40, gap: 10 } as const;
const cellX = (i: number): number => PANEL.x + 18 + i * (CELL.w + CELL.gap);
const ROW_SRC = PANEL.y + 85;
const ROW_ROT = PANEL.y + 188;
const MINI = { ox: PANEL.x + 260, oy: PANEL.y + 290, s: 28 } as const; // rotated-relation mini frame, clear of the badge

const ROUTE_Y = 560;
const BAR = { x0: 378, w: 130, gap: 70, base: 520, top: 150 } as const;
const barX = (i: number): number => BAR.x0 + i * (BAR.w + BAR.gap);
const barY = (pct: number): number => lerp(BAR.base, BAR.top, pct / 100);

// on-screen question per viewpoint step: front/left, right, back (matches the caption at that beat)
const QUESTION = [
  'From the left side, which object is closer to the viewer?',
  'From the right side, which object is closer to the viewer?',
  'From behind the scene, which object appears on the left?',
] as const;

const CAPTIONS = [
  'An accurate map can still lead to a wrong answer. Imagine asking which object looks closer after you move to the left side.',
  'Start with the measured relation between the objects in the original view. The benchmark code keeps that value in a sparse coordinate vector.',
  'Unmeasured coordinates stay at zero. They are placeholders for this controlled calculation, not claims about the full scene geometry.',
  'From the left viewpoint, horizontal difference becomes the negative distance difference. The same evidence now answers a different question.',
  "The apple's new distance margin is negative, so the cup is closer from that viewpoint. The decision follows from the rotated sign.",
  'Move to the right side instead, and the sign reverses. Move behind the scene, and both horizontal and distance signs reverse.',
  'This rotation is supplied by the experiment. It tests how much useful spatial evidence exists before the model produces its own answer.',
  'On one reported viewpoint benchmark, direct answers reach about sixty-one percent. Reasoning reaches eighty-four, while readout plus rotation reaches ninety-five.',
  'Find the map, test its influence, then turn its coordinates. The remaining gap shows why representing space and reasoning through space are different jobs.',
] as const;

const NOTES = [
  'paper §5 · toy relation, not a model answer',
  'projection.py · source_coordinates',
  'projection.py · unobserved coordinates remain zero',
  'adapter.py · VIEW_ROTATIONS["left"] · rotate_coordinates',
  'adapter.py · spinbench_target_margin (closer uses z′)',
  'adapter.py · VIEW_ROTATIONS right / back · left uses −x′',
  'projection.py · _rotation_prediction · external computation',
  'paper Table 10 · Qwen3.6-27B · without premise · n = 146',
  'paper §§2, 3.2, 5',
] as const;

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = narrate(tl, CAPTIONS);
  const mapU = tl.channel('mapU', 0);
  const mapO = tl.channel('mapO', 1);
  const relU = tl.channel('relU', 0); // the A − B arrow on the map
  const questionU = tl.channel('questionU', 0);
  const panelU = tl.channel('panelU', 0);
  const packetU = tl.channel('packetU', 0); // +2 travels from the map into the H cell
  const zeroU = tl.channel('zeroU', 0); // V, D placeholders
  const theta = tl.channel('theta', 0); // frame angle (deg)
  const stepIdx = tl.channel('stepIdx', -1); // which cardinal result is current (set, never tweened)
  const rotRowU = tl.channel('rotRowU', 0);
  const decisionU = tl.channel('decisionU', 0);
  const routeU = tl.channel('routeU', 0);
  const barsU = tl.channel('barsU', 0);
  const barsO = tl.channel('barsO', 1);
  const panelO = tl.channel('panelO', 1);
  const recapU = tl.channel('recapU', 0);
  const closeU = tl.channel('closeU', 0);

  // BEAT 0 — the cross-section, the relation, the question
  tl.tween(mapU, 1, { at: 0.5, dur: 1.4, ease: ease.draw });
  tl.tween(relU, 1, { at: 2.2, dur: 1.0, ease: ease.draw });
  tl.tween(questionU, 1, { at: 3.6, dur: 0.8, ease: ease.enter });

  // BEAT 1 — the measured value enters a sparse vector
  let t = beatAt(1);
  tl.tween(panelU, 1, { at: t + 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(packetU, 1, { at: t + 1.4, dur: 1.6, ease: ease.move });
  tl.tween(zeroU, 1, { at: t + 3.4, dur: 0.8, ease: ease.enter });

  // BEAT 2 — zoom to the sparse vector; ghost map
  t = beatAt(2);
  tl.tween(cam, { x: 740, y: 340, k: 1.05 }, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(mapO, 0.3, { at: t, dur: 1.0, ease: ease.enter });

  // BEAT 3 — rotate the frame to the left viewpoint
  t = beatAt(3);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(mapO, 1, { at: t - 0.2, dur: 0.8, ease: ease.enter });
  tl.set(stepIdx, 0, t + 0.3);
  tl.tween(theta, STEPS[0].theta, { at: t + 0.6, dur: 2.4, ease: ease.move });
  tl.tween(rotRowU, 1, { at: t + 3.2, dur: 0.8, ease: ease.enter });

  // BEAT 4 — read the sign
  t = beatAt(4);
  tl.tween(cam, { x: 740, y: 340, k: 1.05 }, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(decisionU, 1, { at: t + 0.8, dur: 0.6, ease: ease.pop });

  // BEAT 5 — right, then back
  t = beatAt(5);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(decisionU, 0, { at: t - 0.2, dur: 0.4, ease: ease.enter });
  tl.set(stepIdx, 1, t + 0.2);
  tl.tween(theta, STEPS[1].theta, { at: t + 0.2, dur: 2.0, ease: ease.move });
  tl.tween(decisionU, 1, { at: t + 2.4, dur: 0.5, ease: ease.pop });
  tl.tween(decisionU, 0, { at: t + 3.6, dur: 0.3, ease: ease.enter });
  tl.set(stepIdx, 2, t + 3.9);
  tl.tween(theta, STEPS[2].theta, { at: t + 3.9, dur: 2.0, ease: ease.move });
  tl.tween(decisionU, 1, { at: t + 6.1, dur: 0.5, ease: ease.pop });

  // BEAT 6 — pull back; the route is external
  t = beatAt(6);
  tl.tween(cam, { x: 640, y: 380, k: 0.96 }, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(routeU, 1, { at: t + 0.6, dur: 1.6, ease: ease.draw });

  // BEAT 7 — the measured bars
  t = beatAt(7);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.3, ease: ease.move });
  tl.tween(mapO, 0, { at: t - 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(panelO, 0, { at: t - 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(routeU, 0, { at: t - 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(barsU, 1, { at: t + 0.6, dur: 2.2, ease: ease.move });

  // BEAT 8 — bars out, three miniatures, opaque takeaway
  t = beatAt(8);
  tl.tween(barsO, 0, { at: t + 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(mapO, 0, { at: t + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(recapU, 1, { at: t + 1.2, dur: 1.6, ease: ease.draw });
  tl.tween(closeU, 1, { at: t + 3.4, dur: 0.6, ease: ease.enter });

  return {
    tl, cam, beat, mapU, mapO, relU, questionU, panelU, packetU, zeroU, theta, stepIdx, rotRowU,
    decisionU, routeU, barsU, barsO, panelO, recapU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local renderers
// ---------------------------------------------------------------------------
function Viewer({ x, y, deg, opacity }: { x: number; y: number; deg: number; opacity: number }) {
  if (opacity <= 0.003) return null;
  // the viewer faces the scene centre: the facing direction is −z' (far)
  const ax = frameAxes(deg);
  const fx = -ax.z.dx;
  const fy = -ax.z.dy;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={13} fill={INK.panel} stroke={INK.viewer} strokeWidth={2} />
      <circle cx={x + fx * 5} cy={y + fy * 5} r={4} fill={INK.viewer} />
      <path d={`M${x + fx * 18},${y + fy * 18} L${x + fx * 44 - fy * 18},${y + fy * 44 + fx * 18} L${x + fx * 44 + fy * 18},${y + fy * 44 - fx * 18} Z`}
        fill={INK.viewer} fillOpacity={0.12} />
    </g>
  );
}

function Cell({ x, y, value, color, hollow, opacity, hot }: { x: number; y: number; value: number; color: string; hollow: boolean; opacity: number; hot?: number }) {
  if (opacity <= 0.003) return null;
  const h = hot ?? 0;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y - CELL.h / 2} width={CELL.w} height={CELL.h} rx={6} fill={color}
        fillOpacity={hollow ? 0.02 : 0.18 + 0.25 * h} stroke={color} strokeOpacity={hollow ? 0.45 : 0.8 + 0.2 * h}
        strokeWidth={1 + 1.2 * h} strokeDasharray={hollow ? '4 3' : undefined} />
      <Txt x={x + CELL.w / 2} y={y + 6} size={16} anchor="middle" mono fill={hollow ? INK.muted : INK.text}>{fmt(value, 0)}</Txt>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const map = s.get(scene.mapU);
  const mapO = s.get(scene.mapO);
  const rel = s.get(scene.relU);
  const question = s.get(scene.questionU);
  const panel = s.get(scene.panelU) * s.get(scene.panelO);
  const packet = s.get(scene.packetU);
  const zero = s.get(scene.zeroU);
  const deg = s.get(scene.theta);
  const stepIdx = Math.round(s.get(scene.stepIdx));
  const rotRow = s.get(scene.rotRowU);
  const decision = s.get(scene.decisionU);
  const route = s.get(scene.routeU);
  const bars = s.get(scene.barsU) * s.get(scene.barsO);
  const recap = s.get(scene.recapU);
  const close = s.get(scene.closeU);

  const cur = stepIdx >= 0 ? RESULTS[stepIdx] : null;
  const viewer = viewerAt(deg);
  const axes = frameAxes(deg);
  const gz = { x: viewer.x + axes.z.dx * -62, y: viewer.y + axes.z.dy * -62 }; // gizmo origin, pulled toward the scene
  const live = relativeIn(deg); // continuous readout during the sweep
  const rotated: V3 = [live.x, 0, live.z];
  const rotating = cur !== null && Math.abs(deg - cur.theta) > 0.5;
  const property = cur?.property ?? 'closer';
  const margin = targetMargin(rotated, property);
  const viewName = cur?.view ?? 'front';

  // packet: the +2 label travels from the map's margin label to the H cell
  const p0 = { x: mx(0), y: mz(0) - 40 };
  const p1 = { x: cellX(0) + CELL.w / 2, y: ROW_SRC };
  const pk = { x: lerp(p0.x, p1.x, packet), y: lerp(p0.y, p1.y, packet) - 60 * Math.sin(Math.PI * packet) };

  const hotD = property === 'closer' ? decision : 0;
  const hotH = property === 'left' ? decision : 0;

  return (
    <g>
      <Camera {...s.get(scene.cam)}>
        {/* ---- top-down cross-section ---- */}
        <g opacity={map * mapO}>
          <Txt x={MAP.cx} y={MAP.cy - MAP.R - 46} size={13} anchor="middle" fill={INK.muted}>top-down cross-section · horizontal / depth · illustrative relation</Txt>
          {/* fixed world grid: x right, z close (toward the front viewer) */}
          {[-2, -1, 0, 1, 2].map((k) => (
            <g key={k} opacity={0.35}>
              <line x1={mx(k)} y1={mz(-2)} x2={mx(k)} y2={mz(2)} stroke={colors.GRID} />
              <line x1={mx(-2)} y1={mz(k)} x2={mx(2)} y2={mz(k)} stroke={colors.GRID} />
            </g>
          ))}
          {/* fixed world axes labels (source frame) */}
          <Txt x={mx(2) + 10} y={mz(0) + 4} size={13} fill={INK.hx} opacity={1 - clamp01(Math.abs(deg) / 20)}>x right</Txt>
          <Txt x={mx(-2) - 8} y={mz(2) + 4} size={13} anchor="end" fill={INK.dz} opacity={1 - clamp01(Math.abs(deg) / 20)}>z close</Txt>
          {/* objects */}
          <Cup x={mx(B_POS.x)} y={mz(B_POS.z)} r={16} opacity={clamp01(map * 2 - 1)} />
          <Apple x={mx(A_POS.x)} y={mz(A_POS.z)} r={16} opacity={clamp01(map * 2 - 1)} />
          <Txt x={mx(B_POS.x)} y={mz(B_POS.z) + 36} size={13} anchor="middle" fill={INK.cup}>B · cup</Txt>
          <Txt x={mx(A_POS.x)} y={mz(A_POS.z) + 36} size={13} anchor="middle" fill={INK.apple}>A · apple</Txt>
          {/* the measured relation A − B (never changes) */}
          <Vec x1={mx(B_POS.x) + 24} y1={mz(0) - 26} x2={mx(A_POS.x) - 24} y2={mz(0) - 26} grow={rel} color={INK.hx} width={3} head={10} />
          <Txt x={mx(0)} y={mz(0) - 40} size={14} anchor="middle" mono fill={INK.hx} opacity={rel * (1 - packet) + clamp01(packet - 0.98)}>{`A − B = ${fmt(SOURCE_MARGIN, 0)} horizontal (source view)`}</Txt>
          {/* the viewer and its rigid frame gizmo */}
          <Viewer x={viewer.x} y={viewer.y} deg={deg} opacity={clamp01(map * 2 - 1)} />
          <Vec x1={gz.x} y1={gz.y} x2={gz.x + axes.x.dx * 46} y2={gz.y + axes.x.dy * 46} grow={clamp01(map * 2 - 1)} color={INK.hx} width={2.2} head={8} label="x′" labelSize={12} />
          <Vec x1={gz.x} y1={gz.y} x2={gz.x + axes.z.dx * 34} y2={gz.y + axes.z.dy * 34} grow={clamp01(map * 2 - 1)} color={INK.dz} width={2.2} head={8} />
          {/* z′ label sits beside the shaft, away from the viewer icon */}
          <Txt x={gz.x + axes.z.dx * 17 - axes.x.dx * 10} y={gz.y + axes.z.dy * 17 - axes.x.dy * 10 + 4}
            size={13} anchor={Math.abs(axes.x.dx) > 0.5 ? (axes.x.dx > 0 ? 'end' : 'start') : 'middle'}
            fill={INK.dz} opacity={clamp01(map * 2 - 1)}>z′ close</Txt>
          {/* viewer label sits outside the viewer, on the far side from the scene */}
          <Txt x={viewer.x + axes.z.dx * 30} y={viewer.y + axes.z.dy * 30 + 4}
            size={13} anchor={Math.abs(axes.z.dx) > 0.5 ? (axes.z.dx > 0 ? 'start' : 'end') : 'middle'}
            fill={INK.viewer} opacity={0.9 * clamp01(map * 2 - 1)}>
            {rotating ? `viewer → ${viewName}` : `viewer · ${viewName}`}
          </Txt>
        </g>

        {/* question banner */}
        <g opacity={question * (1 - clamp01(s.get(scene.barsU) * 4))}>
          <rect x={200} y={66} width={880} height={36} rx={8} fill={INK.panel} stroke={colors.GRID} />
          <Txt x={640} y={89} size={16} anchor="middle" weight={600}>{QUESTION[Math.max(0, stepIdx)]}</Txt>
        </g>

        {/* ---- sparse vector + decision panel ---- */}
        <g opacity={panel}>
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={12} fill={INK.panel} stroke={colors.GRID} />
          <Txt x={PANEL.x + 18} y={PANEL.y + 26} size={13} fill={INK.muted}>relation coordinates · A − B · H / V / D</Txt>
          <Txt x={PANEL.x + 18} y={ROW_SRC - 32} size={13} fill={INK.muted}>source view (front)</Txt>
          {['H', 'V', 'D'].map((k, i) => (
            <Txt key={k} x={cellX(i) + CELL.w / 2} y={ROW_SRC + 34} size={13} anchor="middle" fill={[INK.hx, INK.vy, INK.dz][i]}>{k}</Txt>
          ))}
          <Cell x={cellX(0)} y={ROW_SRC} value={SOURCE[0]} color={INK.hx} hollow={false} opacity={clamp01(packet * 1.5 - 0.5)} />
          <Cell x={cellX(1)} y={ROW_SRC} value={0} color={INK.vy} hollow opacity={zero} />
          <Cell x={cellX(2)} y={ROW_SRC} value={0} color={INK.dz} hollow opacity={zero} />
          <Txt x={PANEL.x + 18} y={ROW_SRC + 58} size={13} fill={INK.muted} opacity={zero}>unmeasured axes set to zero</Txt>
          <Chip x={PANEL.x + 18} y={ROW_SRC + 80} text="source_coordinates" color={INK.muted} anchor="start" opacity={win(b, 1, 2) * zero} />

          {/* rotated row */}
          <g opacity={rotRow}>
            <Txt x={PANEL.x + 18} y={ROW_ROT - 10} size={13} fill={INK.muted}>{`after external rotation · ${viewName} view`}</Txt>
            <Cell x={cellX(0)} y={ROW_ROT + 22} value={rotated[0]} color={INK.hx} hollow={Math.abs(rotated[0]) < 0.05} opacity={1} hot={hotH} />
            <Cell x={cellX(1)} y={ROW_ROT + 22} value={0} color={INK.vy} hollow opacity={1} />
            <Cell x={cellX(2)} y={ROW_ROT + 22} value={rotated[2]} color={INK.dz} hollow={Math.abs(rotated[2]) < 0.05} opacity={1} hot={hotD} />
            <MathLabel tex={cur ? cur.formula : ''} x={PANEL.x + 18} y={ROW_ROT + 66} fontSize={15} anchor="start" boxWidth={300} color={INK.text} opacity={cur ? 1 : 0} />
            <Txt x={PANEL.x + 18} y={ROW_ROT + 92} size={13} fill={INK.muted}>x right · z close</Txt>
          </g>

          {/* rotated-relation mini frame: x′ across, z′ (close) down */}
          <g opacity={rotRow}>
            <line x1={MINI.ox - 44} y1={MINI.oy} x2={MINI.ox + 44} y2={MINI.oy} stroke={colors.ink.axis} />
            <line x1={MINI.ox} y1={MINI.oy - 66} x2={MINI.ox} y2={MINI.oy + 66} stroke={colors.ink.axis} />
            <Txt x={MINI.ox + 48} y={MINI.oy + 4} size={13} fill={INK.hx}>x′</Txt>
            <Txt x={MINI.ox + 6} y={MINI.oy + 72} size={13} fill={INK.dz}>+z′ close</Txt>
            <Txt x={MINI.ox + 6} y={MINI.oy - 60} size={13} fill={INK.muted}>−z′ far</Txt>
            <Vec x1={MINI.ox} y1={MINI.oy} x2={MINI.ox + rotated[0] * MINI.s} y2={MINI.oy + rotated[2] * MINI.s} grow={1} color={INK.hx} width={2.6} head={9} />
          </g>

          {/* decision badge */}
          <g opacity={decision}>
            <rect x={PANEL.x + 18} y={ROW_ROT + 108} width={190} height={62} rx={8} fill={INK.panel} stroke={margin > 0 ? INK.apple : INK.cup} />
            <Txt x={PANEL.x + 30} y={ROW_ROT + 130} size={13} fill={INK.muted}>{property === 'closer' ? 'closer margin = z′' : 'left margin = −x′'}</Txt>
            <Txt x={PANEL.x + 30} y={ROW_ROT + 156} size={16} mono fill={margin > 0 ? INK.apple : INK.cup}>
              {`${fmt(margin, 0)} ${margin > 0 ? '> 0 → A (apple)' : '< 0 → B (cup)'}`}
            </Txt>
          </g>
        </g>

        {/* ---- the external route (beat 6) ---- */}
        <g opacity={route}>
          {[
            { x: 180, label: 'readout', sub: 'projection' },
            { x: 450, label: 'rotation', sub: 'supplied by the experiment' },
            { x: 720, label: 'sign check', sub: 'target margin' },
          ].map((st, i) => (
            <g key={st.label} opacity={clamp01(route * 3 - i)}>
              <rect x={st.x - 100} y={ROUTE_Y - 16} width={200} height={32} rx={8} fill={INK.panel} stroke={INK.dz} />
              <Txt x={st.x} y={ROUTE_Y + 5} size={14} anchor="middle" fill={INK.dz} weight={600}>{st.label}</Txt>
              <Txt x={st.x} y={ROUTE_Y + 30} size={13} anchor="middle" fill={INK.muted}>{st.sub}</Txt>
              {i < 2 && <Vec x1={st.x + 106} y1={ROUTE_Y} x2={st.x + 164} y2={ROUTE_Y} grow={clamp01(route * 3 - i - 0.5)} color={INK.dz} width={2} head={8} />}
            </g>
          ))}
          <Txt x={450} y={ROUTE_Y - 24} size={13} anchor="middle" fill={INK.dz}>external readout + rotation</Txt>
          <g opacity={clamp01(route * 3 - 2)}>
            <Txt x={885} y={ROUTE_Y + 5} size={13} anchor="middle" fill={INK.muted}>versus</Txt>
            <rect x={960} y={ROUTE_Y - 16} width={240} height={32} rx={8} fill={INK.panel} stroke={INK.muted} strokeDasharray="5 4" />
            <Txt x={1080} y={ROUTE_Y + 5} size={14} anchor="middle" fill={INK.muted}>model-generated answer</Txt>
            <Txt x={1080} y={ROUTE_Y + 30} size={13} anchor="middle" fill={INK.muted}>separate · no internal rotation</Txt>
          </g>
        </g>

        {/* ---- Table 10 bars ---- */}
        <g opacity={bars > 0 ? 1 : 0}>
          <g opacity={clamp01(s.get(scene.barsU) * 3) * s.get(scene.barsO)}>
            <Txt x={BAR.x0} y={BAR.top - 36} size={14} weight={600}>viewpoint benchmark · answer accuracy</Txt>
            <Txt x={BAR.x0} y={BAR.top - 16} size={13} fill={INK.muted}>Qwen3.6-27B · SpinBench without premise · n = 146 · Table 10</Txt>
            {[0, 25, 50, 75, 100].map((p) => (
              <g key={p}>
                <line x1={BAR.x0 - 10} y1={barY(p)} x2={barX(2) + BAR.w + 10} y2={barY(p)} stroke={colors.GRID} />
                <Txt x={BAR.x0 - 18} y={barY(p) + 4} size={13} anchor="end" fill={INK.muted}>{`${p}%`}</Txt>
              </g>
            ))}
            <line x1={BAR.x0 - 10} y1={BAR.base} x2={barX(2) + BAR.w + 10} y2={BAR.base} stroke={colors.ink.axis} strokeWidth={1.5} />
          </g>
          {BARS.map((bar, i) => {
            const u = clamp01(s.get(scene.barsU) * 1.6 - i * 0.3) * s.get(scene.barsO);
            const v = bar.pct * u;
            return (
              <g key={bar.key} opacity={s.get(scene.barsO)}>
                <rect x={barX(i)} y={barY(v)} width={BAR.w} height={BAR.base - barY(v)} rx={6} fill={bar.color} fillOpacity={0.55} stroke={bar.color} />
                <Txt x={barX(i) + BAR.w / 2} y={barY(v) - 12} size={22} anchor="middle" mono weight={600} fill={bar.color} opacity={clamp01(u * 2)}>{`${v.toFixed(2)}%`}</Txt>
                <Txt x={barX(i) + BAR.w / 2} y={BAR.base + 22} size={14} anchor="middle" fill={INK.text} opacity={clamp01(u * 2)}>{bar.label}</Txt>
              </g>
            );
          })}
        </g>

        {/* ---- recap miniatures (three real machines) ---- */}
        <g opacity={recap * (1 - 0.85 * close)} transform="translate(24 0)">
          {/* 1: dot-product ruler */}
          <g opacity={clamp01(recap * 3)}>
            {[1.5, -0.5, 0.8, 1.2].map((v, i) => (
              <rect key={i} x={200 + i * 40} y={200} width={34} height={28} rx={4} fill={INK.apple} fillOpacity={0.15 + 0.4 * Math.min(1, Math.abs(v) / 1.5)} stroke={INK.apple} strokeOpacity={0.6} />
            ))}
            {[1, 0, 0, 0].map((v, i) => (
              <rect key={i} x={200 + i * 40} y={236} width={34} height={28} rx={4} fill={INK.hx} fillOpacity={0.12 + 0.4 * v} stroke={INK.hx} strokeOpacity={0.6} />
            ))}
            <Txt x={277} y={300} size={13} anchor="middle" fill={INK.muted}>find the map · dot-product rulers</Txt>
          </g>
          {/* 2: coordinate edit */}
          <g opacity={clamp01(recap * 3 - 1)}>
            <line x1={500} y1={232} x2={740} y2={232} stroke={colors.ink.axis} strokeWidth={2} />
            <Cup x={560} y={252} r={9} />
            <Apple x={680} y={212} r={10} />
            <Vec x1={672} y1={196} x2={568} y2={196} grow={1} color={INK.hx} width={2} head={8} />
            <Txt x={620} y={300} size={13} anchor="middle" fill={INK.muted}>test its influence · coordinate edit</Txt>
          </g>
          {/* 3: rotated relation */}
          <g opacity={clamp01(recap * 3 - 2)}>
            <line x1={900} y1={232} x2={1020} y2={232} stroke={colors.ink.axis} />
            <line x1={960} y1={188} x2={960} y2={276} stroke={colors.ink.axis} />
            <Vec x1={960} y1={232} x2={960} y2={190} grow={1} color={INK.hx} width={2.4} head={8} />
            <Txt x={1026} y={236} size={13} fill={INK.hx}>x′</Txt>
            <Txt x={968} y={276} size={13} fill={INK.dz}>+z′</Txt>
            <Txt x={960} y={300} size={13} anchor="middle" fill={INK.muted}>turn its coordinates · rotated relation</Txt>
          </g>
        </g>

        {/* ---- quiet close ---- */}
        <Field x={200} y={360} w={880} h={120} opacity={close}>
          <Txt x={640} y={408} size={24} weight={600} anchor="middle">Representing space and reasoning through space are different jobs</Txt>
          <Txt x={640} y={444} size={14} anchor="middle" fill={INK.muted}>one model, one benchmark subset, one explicit rotation · not a claim about all models or all reasoning</Txt>
        </Field>
      </Camera>

      {/* screen-fixed overlays */}
      <g>
        <Txt x={70} y={54} size={13} fill={INK.muted} spacing={1.6} weight={600}>CHAPTER 3</Txt>
        <Txt x={164} y={54} size={16} weight={600}>Turn the viewpoint, not the evidence</Txt>
      </g>
      {NOTES.map((n, i) => (
        <Txt key={i} x={70} y={610} size={13} anchor="start" fill={INK.muted} opacity={0.85 * clamp01(1 - Math.abs(b - i) * 1.6)}>
          {`Source: ${n}`}
        </Txt>
      ))}
      {/* the traveling "+2" packet is drawn last so it rides above the panels */}
      <Camera {...s.get(scene.cam)}>
        <g opacity={clamp01(packet * 6) * (1 - clamp01((packet - 0.9) * 10))}>
          <circle cx={pk.x} cy={pk.y} r={16} fill={INK.hx} fillOpacity={0.25} stroke={INK.hx} />
          <Txt x={pk.x} y={pk.y + 5} size={14} anchor="middle" mono fill={INK.hx}>+2</Txt>
        </g>
      </Camera>
    </g>
  );
}

export const vizScene = () => scene;
