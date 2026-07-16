// Chapter 3: Tap the Log — the instrumentation proposal. Both sync engines
// (Zero's CRUD mutation → IVM pipeline → view update; Electric's WAL → shape
// log → client apply) already funnel every change through one narrow pipeline.
// We tap those hops and record each delta INTO the Replay recording, the same
// way the React instrumentation records commits. The persistent object is
// the recording strip: it starts with the render track he already built, then
// grows a second, parallel sync-delta track, then grows RUNGS tying deltas to
// the renders they caused — a new trigger source next to redux / zustand /
// tanstackQuery in the existing correlation layer (replayio/backend).
import { Timeline, Camera, CAMERA_HOME, colors, ease, cameraInterp, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720, bottom y≳630 clear —————

// Two engine pipelines up top: Zero (mutation path) and Electric (shape log).
const ZERO_Y = 108;
const ELEC_Y = 208;
const BOX_H = 44;
type Box = { x: number; w: number; label: string };
const ZERO_BOXES: Box[] = [
  { x: 150, w: 108, label: 'mutate()' },
  { x: 330, w: 100, label: 'filter' },
  { x: 480, w: 100, label: 'join' },
  { x: 630, w: 100, label: 'sort' },
  { x: 810, w: 128, label: 'view update' },
];
const ELEC_BOXES: Box[] = [
  { x: 150, w: 108, label: 'WAL' },
  { x: 380, w: 130, label: 'shape log' },
  { x: 660, w: 140, label: 'client apply' },
];
// tap points: one under each hand-off between boxes
const tapsFor = (boxes: Box[], y: number) =>
  boxes.slice(0, -1).map((b, i) => ({ x: (b.x + b.w + boxes[i + 1].x) / 2, y: y + BOX_H / 2 + 16 }));
const ZERO_TAPS = tapsFor(ZERO_BOXES, ZERO_Y);
const ELEC_TAPS = tapsFor(ELEC_BOXES, ELEC_Y);

// The recording strip — the persistent object. Two tracks inside.
const STRIP = { x: 120, y: 340, w: 1040, h: 190 };
const RENDER_Y = STRIP.y + 58; // the existing render track
const DELTA_Y = STRIP.y + 138; // the track we're proposing

// Render-track commit ticks (deterministic; a few heavy ones, per the PR:
// 130 commits, 5 heavy — we draw a representative window).
const rand = mulberry32(13);
const COMMITS = Array.from({ length: 16 }, (_, i) => ({
  x: STRIP.x + 60 + (i / 16) * (STRIP.w - 120) + rand() * 22,
  heavy: i === 4 || i === 9 || i === 13,
}));

// Sync-delta events on the second track; each records its operator hop.
const DRAND = mulberry32(29);
const DELTA_OPS = ['mutate', 'join', 'apply', 'filter', 'sort', 'apply', 'join', 'mutate'];
const DELTAS = DELTA_OPS.map((op, i) => ({
  x: STRIP.x + 80 + (i / DELTA_OPS.length) * (STRIP.w - 160) + DRAND() * 26,
  op,
}));
// Rungs: which deltas caused which commits (delta index → commit index).
const RUNGS: Array<[number, number]> = [
  [0, 1],
  [2, 4],
  [3, 6],
  [5, 9],
  [7, 13],
];

// Correlation chips — his existing trigger sources plus the new one.
const CHIP_Y = STRIP.y - 34;
const TRIGGER_CHIPS: Array<{ x: number; w: number; label: string }> = [
  { x: STRIP.x + 320, w: 76, label: 'redux' },
  { x: STRIP.x + 408, w: 96, label: 'zustand' },
  { x: STRIP.x + 516, w: 150, label: 'tanstackQuery' },
];
const NEW_CHIP = { x: STRIP.x + 678, w: 118, label: 'syncDelta' };

// The final causal chain: click → mutation → diff → recompute → render.
// A golden path from the Zero pipeline down into the strip and up a rung.
const CHAIN_DELTA = DELTAS[5];
const CHAIN_COMMIT = COMMITS[9];
const CHAIN_PATH = [
  `M ${ZERO_BOXES[0].x + 20} ${ZERO_Y}`,
  `L ${ZERO_BOXES[4].x + 60} ${ZERO_Y}`,
  `C ${ZERO_BOXES[4].x + 200} ${ZERO_Y}, ${CHAIN_DELTA.x + 120} ${DELTA_Y - 90}, ${CHAIN_DELTA.x} ${DELTA_Y}`,
  `L ${CHAIN_COMMIT.x} ${RENDER_Y}`,
].join(' ');
const CHAIN_STOPS = [
  { x: ZERO_BOXES[0].x + 54, y: ZERO_Y - 40, label: 'click' },
  { x: ZERO_BOXES[2].x + 50, y: ZERO_Y - 40, label: 'diff' },
  { x: CHAIN_DELTA.x, y: DELTA_Y + 34, label: 'recompute' },
  { x: CHAIN_COMMIT.x, y: RENDER_Y - 34, label: 'render' },
];

const CAM_ZERO: CameraState = { x: 560, y: 150, k: 1.42 };
const CAM_ELEC: CameraState = { x: 480, y: 230, k: 1.42 };
const CAM_STRIP: CameraState = { x: 640, y: 420, k: 1.22 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.96 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const zeroU = tl.channel('zeroU', 0); // Zero pipeline draw-on
  const elecU = tl.channel('elecU', 0); // Electric pipeline draw-on
  const pkt1U = tl.channel('pkt1U', 0); // a write traveling Zero's pipeline
  const pkt2U = tl.channel('pkt2U', 0); // a change traveling Electric's
  const tapU = tl.channel('tapU', 0); // tap points glow
  const stripU = tl.channel('stripU', 0); // the recording strip
  const renderU = tl.channel('renderU', 0); // render track (already his)
  const deltaU = tl.channel('deltaU', 0); // the NEW delta track grows
  const rungU = tl.channel('rungU', 0); // rungs tie deltas to renders
  const chipsU = tl.channel('chipsU', 0); // existing trigger chips
  const newChipU = tl.channel('newChipU', 0); // syncDelta chip pops in
  const pipeFade = tl.channel('pipeFade', 1); // pipelines dim once tapped
  const chainU = tl.channel('chainU', 0); // the golden causal chain
  const focusU = tl.channel('focusU', 0); // final spotlight dim

  // BEAT 0 — the proposal: one narrow pipeline per engine
  tl.caption({ at: 0.3, dur: 6, text: "So here's the actual proposal. Both engines already funnel every change through one narrow pipeline — which means there is exactly one place to tap." });
  tl.tween(zeroU, 1, { at: 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(elecU, 1, { at: 2.4, dur: 1.3, ease: ease.draw });
  tl.hold(6.3, 0.8);

  // BEAT 1 — Zero's mutation path
  tl.caption({ at: 7.4, dur: 6.5, text: 'In Zero, that path is the mutation pipeline: a write enters, the incremental view maintenance operators transform it — filter, join, sort — and a view update comes out the far end.' });
  tl.tween(cam, CAM_ZERO, { at: 7.6, dur: 1.4, ease: ease.move });
  tl.tween(pkt1U, 1, { at: 9.2, dur: 3.6, ease: ease.linear });
  tl.hold(13.9, 0.7);

  // BEAT 2 — Electric's shape log
  tl.caption({ at: 14.8, dur: 6, text: "In Electric, it's the shape log: the write-ahead log emits a change, shapes match it, and the client applies a delta. Different engine, same shape — a write becomes a delta becomes an update." });
  tl.tween(cam, CAM_ELEC, { at: 15.0, dur: 1.4, ease: ease.move });
  tl.tween(pkt2U, 1, { at: 16.6, dur: 3.0, ease: ease.linear });
  tl.hold(20.8, 0.7);

  // BEAT 3 — tap every hop, record into the recording
  tl.caption({ at: 21.7, dur: 7, text: 'At every one of those hops, we record the delta into the Replay recording — a timestamp, the operator, the payload — exactly the way our React instrumentation records commits today.' });
  tl.tween(cam, CAM_WIDE, { at: 21.9, dur: 1.5, ease: ease.move });
  tl.tween(tapU, 1, { at: 22.6, dur: 0.6, ease: ease.pop });
  tl.tween(stripU, 1, { at: 24.0, dur: 1.2, ease: ease.draw });
  tl.tween(renderU, 1, { at: 25.4, dur: 1.6, ease: ease.linear });
  tl.tween(pipeFade, 0.4, { at: 25.4, dur: 1.2, ease: ease.move });
  tl.hold(28.7, 0.8);

  // BEAT 4 — the second track grows
  tl.caption({ at: 29.8, dur: 6.5, text: 'So the recording grows a second track. The render track we already record stays exactly where it is — and underneath it, every sync delta lands with its timestamp and its operator hop.' });
  tl.tween(cam, CAM_STRIP, { at: 30.0, dur: 1.5, ease: ease.move });
  tl.tween(deltaU, 1, { at: 31.0, dur: 3.6, ease: ease.linear });
  tl.hold(36.3, 0.8);

  // BEAT 5 — the rungs
  tl.caption({ at: 37.4, dur: 6.5, text: 'And now the rungs. Every render a delta caused gets tied back to it — and the correlation layer we already have for Redux knows how to make exactly this kind of tie.' });
  tl.tween(rungU, 1, { at: 37.9, dur: 2.6, ease: ease.draw });
  tl.hold(43.9, 0.8);

  // BEAT 6 — a new trigger source next to his three
  tl.caption({ at: 45.0, dur: 6.5, text: "That's the key move: sync deltas become just another trigger source, sitting right next to Redux, Zustand, and the query cache in the attribution code. No new correlation machinery — one new row in it." });
  tl.tween(chipsU, 1, { at: 45.4, dur: 1.2, ease: ease.enter });
  tl.tween(newChipU, 1, { at: 48.2, dur: 0.5, ease: ease.pop });
  tl.hold(51.5, 0.8);

  // BEAT 7 — the full causal chain, observed
  tl.caption({ at: 52.6, dur: 7.5, text: "One recording now carries the whole causal chain: the user's click, the mutation, the diff, the query recompute, and the render it produced. None of it inferred. All of it observed." });
  tl.tween(cam, CAMERA_HOME, { at: 52.8, dur: 1.6, ease: ease.move });
  tl.tween(focusU, 1, { at: 53.2, dur: 1.2, ease: ease.move });
  tl.tween(chainU, 1, { at: 54.4, dur: 2.6, ease: ease.draw });
  tl.hold(60.1, 1.2);

  return { tl, cam, zeroU, elecU, pkt1U, pkt2U, tapU, stripU, renderU, deltaU, rungU, chipsU, newChipU, pipeFade, chainU, focusU };
}

const scene = buildScene();

// ————— pure subcomponents —————

function PipeBox({ b, y, u, i, n, accent }: { b: Box; y: number; u: number; i: number; n: number; accent: string }) {
  const e = clamp01(u * n - i);
  if (e <= 0) return null;
  return (
    <g opacity={e} transform={`translate(0, ${(1 - e) * 8})`}>
      <rect x={b.x} y={y - BOX_H / 2} width={b.w} height={BOX_H} rx={9} fill={colors.PANEL} stroke={accent} strokeWidth={1.5} />
      <text x={b.x + b.w / 2} y={y + 4.5} textAnchor="middle" fontSize={12.5} fill={colors.TEXT} fontFamily={mono}>
        {b.label}
      </text>
    </g>
  );
}

function Pipeline({ boxes, y, u, accent, title, fade }: { boxes: Box[]; y: number; u: number; accent: string; title: string; fade: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={fade}>
      <text x={boxes[0].x} y={y - BOX_H / 2 - 12} fontSize={11.5} fill={colors.MUTED} fontFamily={mono} opacity={Math.min(1, uu * 2)}>
        {title}
      </text>
      {boxes.slice(0, -1).map((b, i) => {
        const e = clamp01(uu * boxes.length - (i + 0.5));
        return e > 0 ? (
          <line key={i} x1={b.x + b.w} y1={y} x2={b.x + b.w + (boxes[i + 1].x - b.x - b.w) * e} y2={y} stroke={accent} strokeWidth={2} opacity={0.7} />
        ) : null;
      })}
      {boxes.map((b, i) => (
        <PipeBox key={i} b={b} y={y} u={uu} i={i} n={boxes.length} accent={accent} />
      ))}
    </g>
  );
}

/** A packet traveling left→right across a pipeline; position pure in u. */
function PipePacket({ boxes, y, u, color, fade }: { boxes: Box[]; y: number; u: number; color: string; fade: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || uu >= 1) return null;
  const x0 = boxes[0].x + 16;
  const x1 = boxes[boxes.length - 1].x + boxes[boxes.length - 1].w - 16;
  return (
    <g opacity={fade}>
      <circle cx={x0 + (x1 - x0) * uu} cy={y} r={7} fill={color} />
      <circle cx={x0 + (x1 - x0) * uu} cy={y} r={12} fill={color} opacity={0.25} />
    </g>
  );
}

function Taps({ taps, u, fade }: { taps: Array<{ x: number; y: number }>; u: number; fade: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g opacity={e * fade}>
      {taps.map((t, i) => (
        <g key={i}>
          <circle cx={t.x} cy={t.y} r={5 * e} fill={colors.WARM} />
          <circle cx={t.x} cy={t.y} r={10 * e} fill={colors.WARM} opacity={0.2} />
          <line x1={t.x} y1={t.y - 12} x2={t.x} y2={t.y - 22} stroke={colors.WARM} strokeWidth={1.5} opacity={0.7} />
        </g>
      ))}
    </g>
  );
}

/** The recording strip: render track + the growing sync-delta track. */
function RecordingStrip({ u, renderP, deltaP, rungP, spotlight }: { u: number; renderP: number; deltaP: number; rungP: number; spotlight: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const rp = clamp01(renderP);
  const dp = clamp01(deltaP);
  return (
    <g opacity={e}>
      <rect x={STRIP.x} y={STRIP.y} width={STRIP.w * e} height={STRIP.h} rx={14} fill="rgba(13,19,33,0.72)" stroke={colors.GRID} strokeWidth={1.5} />
      <text x={STRIP.x + 16} y={STRIP.y + 24} fontSize={11.5} fill={colors.MUTED} fontFamily={mono} opacity={e}>
        the Replay recording
      </text>
      {/* render track — his */}
      <text x={STRIP.x + 16} y={RENDER_Y - 18} fontSize={10.5} fill={colors.ACCENT} fontFamily={mono} opacity={rp > 0 ? 1 : 0}>
        render track — commits · phase timings
      </text>
      <line x1={STRIP.x + 16} y1={RENDER_Y} x2={STRIP.x + STRIP.w - 16} y2={RENDER_Y} stroke={colors.GRID} strokeWidth={1} opacity={rp > 0 ? 0.6 : 0} />
      {COMMITS.map((c, i) => {
        const lit = clamp01(rp * COMMITS.length - i);
        if (lit <= 0) return null;
        const h = c.heavy ? 26 : 13;
        return <rect key={i} x={c.x - 2} y={RENDER_Y - h * lit} width={4} height={h * lit} rx={1.5} fill={c.heavy ? colors.WARM : colors.ACCENT} opacity={0.55 + 0.45 * lit} />;
      })}
      {/* sync-delta track — the proposal */}
      {dp > 0 && (
        <>
          <text x={STRIP.x + 16} y={DELTA_Y - 18} fontSize={10.5} fill={colors.TEAL} fontFamily={mono} opacity={Math.min(1, dp * 3)}>
            sync-delta track — timestamp · operator · payload
          </text>
          <line x1={STRIP.x + 16} y1={DELTA_Y} x2={STRIP.x + 16 + (STRIP.w - 32) * dp} y2={DELTA_Y} stroke={colors.TEAL} strokeWidth={1.2} opacity={0.5} />
          {DELTAS.map((d, i) => {
            const lit = clamp01(dp * DELTAS.length - i);
            if (lit <= 0) return null;
            return (
              <g key={i} opacity={lit}>
                <rect x={d.x - 5} y={DELTA_Y - 5} width={10} height={10} rx={2} transform={`rotate(45 ${d.x} ${DELTA_Y})`} fill={colors.TEAL} />
                <text x={d.x} y={DELTA_Y + 22} textAnchor="middle" fontSize={9} fill={colors.MUTED} fontFamily={mono}>
                  {d.op}
                </text>
              </g>
            );
          })}
        </>
      )}
      {/* rungs */}
      {clamp01(rungP) > 0 &&
        RUNGS.map(([di, ci], i) => {
          const lit = clamp01(clamp01(rungP) * RUNGS.length - i);
          if (lit <= 0) return null;
          const d = DELTAS[di];
          const c = COMMITS[ci];
          return (
            <g key={i} opacity={0.85 * lit}>
              <line x1={d.x} y1={DELTA_Y - 8} x2={d.x + (c.x - d.x) * lit} y2={DELTA_Y - 8 + (RENDER_Y + 6 - (DELTA_Y - 8)) * lit} stroke={colors.SECONDARY} strokeWidth={1.6} strokeDasharray="3 3" />
              {lit >= 1 && <circle cx={c.x} cy={RENDER_Y + 6} r={3.2} fill={colors.SECONDARY} />}
            </g>
          );
        })}
      {/* spotlight veil for the closing chain */}
      {spotlight > 0 && <rect x={STRIP.x} y={STRIP.y} width={STRIP.w} height={STRIP.h} rx={14} fill="rgba(10,14,26,0.35)" opacity={spotlight} />}
    </g>
  );
}

function TriggerChips({ u, newU, fade }: { u: number; newU: number; fade: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const ne = clamp01(newU);
  return (
    <g opacity={fade}>
      <text x={STRIP.x + 16} y={CHIP_Y + 5} fontSize={10.5} fill={colors.MUTED} fontFamily={mono} opacity={e}>
        render triggers:
      </text>
      {TRIGGER_CHIPS.map((c, i) => {
        const lit = clamp01(e * TRIGGER_CHIPS.length - i);
        return lit > 0 ? (
          <g key={i} opacity={lit}>
            <rect x={c.x} y={CHIP_Y - 13} width={c.w} height={24} rx={12} fill="rgba(148,163,184,0.1)" stroke={colors.GRID} strokeWidth={1} />
            <text x={c.x + c.w / 2} y={CHIP_Y + 4} textAnchor="middle" fontSize={11} fill={colors.TEXT} fontFamily={mono}>
              {c.label}
            </text>
          </g>
        ) : null;
      })}
      {ne > 0 && (
        <g opacity={ne} transform={`scale(${0.9 + 0.1 * ne})`} style={{ transformOrigin: `${NEW_CHIP.x + NEW_CHIP.w / 2}px ${CHIP_Y}px` }}>
          <rect x={NEW_CHIP.x} y={CHIP_Y - 13} width={NEW_CHIP.w} height={24} rx={12} fill="rgba(56,189,248,0.12)" stroke={colors.TEAL} strokeWidth={1.5} />
          <text x={NEW_CHIP.x + NEW_CHIP.w / 2} y={CHIP_Y + 4} textAnchor="middle" fontSize={11} fill={colors.TEAL} fontFamily={mono} fontWeight={700}>
            {NEW_CHIP.label}
          </text>
        </g>
      )}
    </g>
  );
}

/** The closing golden chain: click → mutation → diff → recompute → render. */
function CausalChain({ u }: { u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g>
      <path d={CHAIN_PATH} fill="none" stroke={colors.WARM} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - e} opacity={0.9} />
      {CHAIN_STOPS.map((st, i) => {
        const lit = clamp01(e * CHAIN_STOPS.length - i * 0.8);
        return lit > 0 ? (
          <g key={i} opacity={lit}>
            <rect x={st.x - 38} y={st.y - 13} width={76} height={22} rx={11} fill="rgba(251,191,36,0.14)" stroke={colors.WARM} strokeWidth={1} />
            <text x={st.x} y={st.y + 3.5} textAnchor="middle" fontSize={10.5} fill={colors.WARM} fontFamily={mono}>
              {st.label}
            </text>
          </g>
        ) : null;
      })}
    </g>
  );
}

// ————— render —————

export function Render({ s }: { s: SceneState }) {
  const pipeFade = clamp01(s.get(scene.pipeFade));
  const focus = clamp01(s.get(scene.focusU));
  const dimmed = pipeFade * (1 - 0.6 * focus); // pipelines whisper at the close
  return (
    <Camera {...s.get(scene.cam)}>
      <Pipeline boxes={ZERO_BOXES} y={ZERO_Y} u={s.get(scene.zeroU)} accent={colors.ACCENT} title="Zero — mutation → incremental view maintenance → view" fade={dimmed} />
      <Pipeline boxes={ELEC_BOXES} y={ELEC_Y} u={s.get(scene.elecU)} accent={colors.SECONDARY} title="Electric — write-ahead log → shape log → apply" fade={dimmed} />
      <PipePacket boxes={ZERO_BOXES} y={ZERO_Y} u={s.get(scene.pkt1U)} color={colors.WARM} fade={pipeFade} />
      <PipePacket boxes={ELEC_BOXES} y={ELEC_Y} u={s.get(scene.pkt2U)} color={colors.WARM} fade={pipeFade} />
      <Taps taps={ZERO_TAPS} u={s.get(scene.tapU)} fade={dimmed + 0.3 * focus} />
      <Taps taps={ELEC_TAPS} u={s.get(scene.tapU)} fade={dimmed} />
      <RecordingStrip u={s.get(scene.stripU)} renderP={s.get(scene.renderU)} deltaP={s.get(scene.deltaU)} rungP={s.get(scene.rungU)} spotlight={0.4 * focus} />
      <TriggerChips u={s.get(scene.chipsU)} newU={s.get(scene.newChipU)} fade={1 - 0.5 * focus} />
      <CausalChain u={s.get(scene.chainU)} />
    </Camera>
  );
}

export const vizScene = () => scene;
