// Readable Minds
//
// Let Theories Die — chapter 5. D3/SVG scene authored by Claude Opus 5.5. Requested model `claude-opus-5-5`;
// actual: `claude-opus-5-5`. Planned by Claude Opus 5.5 (user override of the default Astra planning stage) in
// .orly-work/visual-plan.md, chapter 5. The eleven captions are the plan's fixed narration.
//
// Sources (sources.json, chapter 5):
//   all essay claims     Cammarata, "Neural Networks Are Already Clean" (Goodfire, 2026),
//                        https://already-clean.goodfire.com/essay.md
//   read before write    our own conclusion (inferred), narrated as one
//
// Schematic versus measured: the tile plate is a percentage plate (one tile = 1% of neuron poles, not a sampled
// neuron), drawn from the essay's preliminary Qwen3-32B estimates (~90% / ~7% / ~2–4%). The branch, the V with its
// whiskers, the squeeze bars and the doors are illustrations. Reported values on stage: those estimates, 480 → 10,
// ~85% confidence, 87% → 50%.
//
// Beat sheet — ONE lens travels the chapter and becomes the READ door's window:
//   C0  the question card from chapter 1 returns, then tucks into the corner
//   C1  the lens arrives over a blank plate
//   C2  the plate fills: one job / two related jobs / not yet understood
//   C3  the lens moves to a branch that grows: iy → Miyazaki · diy → do it yourself
//   C4  "recursive generalization": neighbours alike, ends unlike
//   C5  a V neuron; feature visualization's search takes the cat route and adds whiskers
//   C6  480 bars squeeze to 10 coarse ones: curves & loops
//   C7  a confidence dial, apart from every count: ~85%
//   C8  one neuron removed: the next word's probability 87% → 50%
//   C9  two doors: READ opens (the lens is its window); WRITE stays locked, its key held outside the population
//   C10 the card answers both questions; clean closing panel
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { ACCENT, Chips, Closing, DEAD, GOAL, Panel, SCORE, Txt, Veil, addCaptions, captionClock, clamp01, lerp, win } from './shared/kit';

const CAPS = [
  'Back to the question from the first chapter: if every judge is a proxy, can anyone see what training actually built?',
  'Nick Cammarata’s essay for Goodfire, Neural Networks Are Already Clean, argues that the answer is yes far more often than the field assumed.',
  'In preliminary audits of the Qwen three thirty-two billion model, his team estimates that roughly ninety percent of neuron poles have one main job, and about seven percent have two related jobs.',
  'Tangled-looking neurons grow like a family tree. One neuron detected the letters i y, then d i y, and then the phrase do it yourself, which has no i y at all.',
  'He calls this recursive generalization. Each step is easy to follow locally. Only the final list looks unrelated, the way living species can look without their family tree.',
  'Even the microscope reward-hacked. Feature visualization searches for an image that maximizes a neuron, and the search takes the easiest path, which is how a V-shape neuron came out with cat whiskers.',
  'Scarcity did not make the network hide things. Cut one layer from four hundred eighty neurons to ten, and its neurons stayed readable, just coarser: one curves and loops neuron instead of ten curve detectors.',
  'He puts his confidence at about eighty-five percent, and he means confidence in an argument, not a count of clean neurons.',
  'Networks that can be read can also be edited precisely. In one of the essay’s tests, removing a single neuron cut the probability of the next word from eighty-seven percent to fifty.',
  'That is why the order matters. A model reading its own neurons is a check. A model rewriting its own training removes the outside check. Read access should come before write access.',
  'So, both questions. The judge is always a proxy, and minds may be more readable than we feared. Let theories die in our stead, and keep the judge outside the population it judges.',
];
const { T, DUR } = captionClock(CAPS);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const PLATE = { x: 250, y: 190, pitch: 34, tile: 28 };
/** 100 tiles: 90 one job, 7 two related, 3 not yet understood (the essay says ~2–4%) */
const KIND = Array.from({ length: 100 }, (_, i) => (i < 90 ? 0 : i < 97 ? 1 : 2));
// shuffle deterministically so the kinds are scattered, not banded
const ORDER = Array.from({ length: 100 }, (_, i) => (i * 37 + 11) % 100);

const TREE_NODES = [
  { id: 'iy', x: 760, y: 360, label: 'iy' },
  { id: 'mz', x: 920, y: 250, label: 'Miyazaki' },
  { id: 'diy', x: 920, y: 420, label: 'diy' },
  { id: 'dy', x: 1100, y: 470, label: 'do it yourself' },
];
const TREE_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [2, 3],
];

const V = { x: 420, y: 380 };
const BARS_X = 760;
const LENS_R = 64;
const LENS_STOPS: [number, number][] = [
  [640, 260], // C0 resting (hidden)
  [420, 360], // plate
  [760, 360], // tree: frames the root, iy
  [420, 380], // V
  [880, 360], // bars
  [380, 340], // read door window
];

const CAM_PLATE: CameraState = { x: 520, y: 360, k: 1.1 };
const CAM_TREE: CameraState = { x: 900, y: 360, k: 1.12 };
const CAM_V: CameraState = { x: 520, y: 370, k: 1.1 };
const CAM_BARS: CameraState = { x: 820, y: 360, k: 1.1 };

const PHASE_CHIPS = [
  'question 2, from chapter 1',
  'Goodfire · preliminary, threshold-dependent',
  'recursive generalization',
  'feature visualization · illustrative',
  'InceptionV1 layer 3b, retrained',
  'an argument, not a count',
  'one ablation · reported',
  'our conclusion',
];

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chipIn = tl.channel('chipIn', 0);
  const chipK = tl.channel('chipK', 0);
  const cardU = tl.channel('cardU', 0);
  const cardTuck = tl.channel('cardTuck', 0);
  const lensU = tl.channel('lensU', 0);
  const lensStop = tl.channel('lensStop', 1); // float index into LENS_STOPS
  const plateU = tl.channel('plateU', 0);
  const fillU = tl.channel('fillU', 0);
  const plateOut = tl.channel('plateOut', 0);
  const treeU = tl.channel('treeU', 0); // 0..3 edges grown
  const recU = tl.channel('recU', 0);
  const treeOut = tl.channel('treeOut', 0);
  const vU = tl.channel('vU', 0);
  const pathU = tl.channel('pathU', 0);
  const vOut = tl.channel('vOut', 0);
  const barsU = tl.channel('barsU', 0);
  const squeeze = tl.channel('squeeze', 0);
  const barsOut = tl.channel('barsOut', 0);
  const dialU = tl.channel('dialU', 0);
  const ablU = tl.channel('ablU', 0);
  const cut = tl.channel('cut', 0);
  const ablOut = tl.channel('ablOut', 0);
  const doorsU = tl.channel('doorsU', 0);
  const readOpen = tl.channel('readOpen', 0);
  const keyU = tl.channel('keyU', 0);
  const answerU = tl.channel('answerU', 0);
  const veil = tl.channel('veil', 0);
  const closeU = tl.channel('closeU', 0);

  addCaptions(tl, CAPS, T, DUR);

  // C0 — the question returns
  let t = T[0];
  tl.tween(chipIn, 1, { at: t, dur: 0.6, ease: ease.enter });
  tl.tween(cardU, 1, { at: t + 0.2, dur: 0.8, ease: ease.enter });
  tl.hold(t + 1.0, 1);

  // C1 — the lens, the plate
  t = T[1];
  tl.tween(chipK, 1, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cardTuck, 1, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_PLATE, { at: t + 0.4, dur: 1.3, ease: ease.move });
  tl.tween(plateU, 1, { at: t + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(lensU, 1, { at: t + 1.8, dur: 0.7, ease: ease.enter });
  tl.hold(t + 2.5, 1);

  // C2 — the plate fills
  t = T[2];
  tl.tween(fillU, 1, { at: t + 0.6, dur: 5.0, ease: ease.linear });
  tl.hold(t + 5.6, 1);

  // C3 — the branch
  t = T[3];
  tl.tween(chipK, 2, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(plateOut, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_TREE, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(lensStop, 2, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(treeU, 3, { at: t + 1.4, dur: 5.2, ease: ease.linear });
  tl.hold(t + 6.6, 0.8);

  // C4 — recursive generalization
  t = T[4];
  tl.tween(recU, 1, { at: t + 0.4, dur: 0.8, ease: ease.enter });
  tl.hold(t + 1.2, 1);

  // C5 — the microscope reward-hacks
  t = T[5];
  tl.tween(chipK, 3, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(treeOut, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_V, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(lensStop, 3, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(vU, 1, { at: t + 1.0, dur: 0.8, ease: ease.draw });
  tl.tween(pathU, 1, { at: t + 3.0, dur: 4.6, ease: ease.linear });
  tl.hold(t + 7.6, 0.8);

  // C6 — squeeze
  t = T[6];
  tl.tween(chipK, 4, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(vOut, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_BARS, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(lensStop, 4, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(barsU, 1, { at: t + 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(squeeze, 1, { at: t + 3.2, dur: 3.0, ease: ease.move });
  tl.hold(t + 6.2, 1);

  // C7 — confidence, apart
  t = T[7];
  tl.tween(chipK, 5, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(barsOut, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(lensU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(dialU, 1, { at: t + 0.8, dur: 2.0, ease: ease.move });
  tl.hold(t + 2.8, 1);

  // C8 — ablation
  t = T[8];
  tl.tween(chipK, 6, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(dialU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(ablU, 1, { at: t + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(cut, 1, { at: t + 4.0, dur: 2.0, ease: ease.move });
  tl.hold(t + 6.0, 1);

  // C9 — read before write
  t = T[9];
  tl.tween(chipK, 7, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(ablOut, 1, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(doorsU, 1, { at: t + 0.6, dur: 0.9, ease: ease.enter });
  tl.tween(lensStop, 5, { at: t + 0.6, dur: 0.1, ease: ease.move });
  tl.tween(lensU, 1, { at: t + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(readOpen, 1, { at: t + 2.4, dur: 1.4, ease: ease.move });
  tl.tween(keyU, 1, { at: t + 5.2, dur: 1.2, ease: ease.move });
  tl.hold(t + 6.4, 1);

  // C10 — both questions answered
  t = T[10];
  tl.tween(chipIn, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(veil, 1, { at: t + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(cardTuck, 0, { at: t + 0.4, dur: 1.2, ease: ease.move });
  tl.tween(answerU, 1, { at: t + 1.6, dur: 1.0, ease: ease.enter });
  tl.tween(closeU, 1, { at: t + 6.0, dur: 0.8, ease: ease.enter });
  tl.hold(T[10] + DUR[10], 0.6);

  return {
    tl, cam, chipIn, chipK, cardU, cardTuck, lensU, lensStop, plateU, fillU, plateOut, treeU, recU, treeOut, vU, pathU,
    vOut, barsU, squeeze, barsOut, dialU, ablU, cut, ablOut, doorsU, readOpen, keyU, answerU, veil, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const KIND_COLOR = [GOAL, colors.ACCENT, DEAD];

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>) => s.get(ch);
  const cam = s.get(scene.cam);
  const tuck = v(scene.cardTuck);
  const stop = v(scene.lensStop);
  const si = Math.min(LENS_STOPS.length - 2, Math.floor(stop));
  const su = clamp01(stop - si);
  const lx = lerp(LENS_STOPS[si][0], LENS_STOPS[si + 1][0], su);
  const ly = lerp(LENS_STOPS[si][1], LENS_STOPS[si + 1][1], su);
  const plateOp = v(scene.plateU) * (1 - v(scene.plateOut));
  const treeOp = clamp01(v(scene.treeU) * 3) * (1 - v(scene.treeOut));
  const vOp = v(scene.vU) * (1 - v(scene.vOut));
  const barsOp = v(scene.barsU) * (1 - v(scene.barsOut));
  const ablOp = v(scene.ablU) * (1 - v(scene.ablOut));
  const path = v(scene.pathU);
  const sq = v(scene.squeeze);

  // question card: centre ↔ tucked top-right
  const cx = lerp(640, 1090, tuck);
  const cy = lerp(300, 120, tuck);
  const ck = lerp(1, 0.42, tuck);

  return (
    <>
      <Camera {...cam}>
        {/* ================= the plate ================= */}
        {plateOp > 0.01 && (
          <g opacity={plateOp}>
            {Array.from({ length: 100 }, (_, i) => {
              const c = i % 10;
              const r = Math.floor(i / 10);
              const k = KIND[ORDER[i]];
              const u = clamp01(v(scene.fillU) * 100 - i);
              return (
                <g key={i}>
                  <rect x={PLATE.x + c * PLATE.pitch} y={PLATE.y + r * PLATE.pitch} width={PLATE.tile} height={PLATE.tile} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
                  {u > 0.01 && <rect x={PLATE.x + c * PLATE.pitch} y={PLATE.y + r * PLATE.pitch} width={PLATE.tile} height={PLATE.tile} rx={5} fill={KIND_COLOR[k]} opacity={u * 0.85} />}
                  {u > 0.5 && k === 2 && (
                    <text x={PLATE.x + c * PLATE.pitch + 14} y={PLATE.y + r * PLATE.pitch + 20} fontSize={16} textAnchor="middle" fill={colors.TEXT}>
                      ?
                    </text>
                  )}
                </g>
              );
            })}
            <g opacity={win(v(scene.fillU), 0.4, 0.8)}>
              {[
                { c: GOAL, t: '≈ 90%  one main job' },
                { c: colors.ACCENT, t: '≈ 7%  two related jobs' },
                { c: DEAD, t: '≈ 2–4%  not yet understood' },
              ].map((l, k) => (
                <g key={k}>
                  <rect x={620} y={240 + k * 46} width={22} height={22} rx={4} fill={l.c} />
                  <Txt x={654} y={258 + k * 46} text={l.t} size={19} />
                </g>
              ))}
              <Txt x={620} y={400} text="Qwen3-32B · neuron poles" size={16} color={colors.MUTED} italic />
              <Txt x={620} y={424} text="one tile = 1%, not one neuron" size={15} color={colors.MUTED} italic />
            </g>
          </g>
        )}

        {/* ================= the branch ================= */}
        {treeOp > 0.01 && (
          <g opacity={treeOp}>
            {TREE_EDGES.map(([a, b], k) => {
              const u = clamp01(v(scene.treeU) - k);
              if (u <= 0.01) return null;
              const A = TREE_NODES[a];
              const B = TREE_NODES[b];
              const mx = (A.x + B.x) / 2;
              return <path key={k} d={`M ${A.x},${A.y} C ${mx},${A.y} ${mx},${B.y} ${lerp(A.x, B.x, u)},${lerp(A.y, B.y, u)}`} fill="none" stroke={GOAL} strokeWidth={3} />;
            })}
            {TREE_NODES.map((n, k) => {
              const u = k === 0 ? 1 : clamp01(v(scene.treeU) - (k === 1 ? 0 : k === 2 ? 1 : 2) - 0.7) * 3.3;
              if (u <= 0.01) return null;
              const w = n.label.length * 11 + 28;
              return (
                <g key={k} opacity={clamp01(u)}>
                  <rect x={n.x - w / 2} y={n.y - 20} width={w} height={40} rx={10} fill={colors.PANEL} stroke={k === 3 ? SCORE : GOAL} strokeWidth={2} />
                  <Txt x={n.x} y={n.y + 7} text={n.label} size={19} anchor="middle" mono />
                </g>
              );
            })}
            <Txt x={1100} y={516} text="no “iy” left" size={16} anchor="middle" color={SCORE} u={clamp01(v(scene.treeU) - 2.6) * 2.5} italic />
            {v(scene.recU) > 0.01 && (
              <g opacity={v(scene.recU)}>
                <Txt x={900} y={180} text="recursive generalization" size={24} anchor="middle" weight={650} color={GOAL} />
                <Txt x={900} y={208} text="neighbours alike · ends unlike" size={17} anchor="middle" color={colors.MUTED} italic />
              </g>
            )}
          </g>
        )}

        {/* ================= the V and the easy path ================= */}
        {vOp > 0.01 && (
          <g opacity={vOp}>
            <path d={`M ${V.x - 60},${V.y - 70} L ${V.x},${V.y + 50} L ${V.x + 60},${V.y - 70}`} fill="none" stroke={colors.ACCENT} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${v(scene.vU) * 300} 400`} />
            <Txt x={V.x} y={V.y + 104} text="neuron 4e:55 · a V-shape detector" size={17} anchor="middle" color={colors.ACCENT} />
            {/* whiskers accrue as the search goes the cat way */}
            {[-1, 1].map((side) =>
              [0, 1, 2].map((k) => {
                const u = win(path, 0.45 + k * 0.12, 0.6 + k * 0.12);
                if (u <= 0.01) return null;
                const x0 = V.x + side * 18;
                const y0 = V.y + 6 + k * 12;
                return <line key={`${side}-${k}`} x1={x0} y1={y0} x2={x0 + side * 70 * u} y2={y0 - 10 + k * 10} stroke={SCORE} strokeWidth={2} />;
              }),
            )}
            {/* the search path, drawn as a route: start → cat route (short) vs the honest route (long) */}
            <path d={`M 120,560 C 200,520 220,470 300,450`} fill="none" stroke={colors.MUTED} strokeWidth={2} strokeDasharray="5 6" opacity={win(path, 0, 0.2)} />
            <circle cx={lerp(120, 300, win(path, 0.05, 0.4))} cy={lerp(560, 450, win(path, 0.05, 0.4))} r={7} fill={SCORE} opacity={win(path, 0, 0.1)} />
            <Txt x={110} y={540} text="gradient descent" size={15} color={colors.MUTED} u={win(path, 0, 0.2)} />
            <Txt x={620} y={330} text="the search takes" size={19} u={win(path, 0.6, 0.8)} />
            <Txt x={620} y={356} text="the easiest path" size={19} weight={650} color={SCORE} u={win(path, 0.6, 0.8)} />
            <Txt x={620} y={388} text="here, through cat circuitry" size={16} color={colors.MUTED} u={win(path, 0.75, 0.95)} italic />
          </g>
        )}

        {/* ================= squeeze 480 → 10 ================= */}
        {barsOp > 0.01 && (
          <g opacity={barsOp}>
            <Txt x={BARS_X + 120} y={200} text={sq < 0.5 ? '480 neurons' : '10 neurons'} size={22} anchor="middle" weight={650} />
            {Array.from({ length: 48 }, (_, k) => {
              const g = Math.floor(k / 4.8); // which of the 10 it merges into
              const x0 = BARS_X - 120 + k * 10;
              const x1 = BARS_X - 120 + g * 48;
              const x = lerp(x0, x1, sq);
              const w = lerp(6, 40, sq);
              return <rect key={k} x={x} y={240} width={w} height={220} rx={3} fill={g === 3 ? SCORE : colors.ACCENT} opacity={lerp(0.8, 0.22, sq)} />;
            })}
            <Txt x={BARS_X - 120 + 3 * 48 + 20} y={490} text="curves & loops" size={17} anchor="middle" color={SCORE} weight={650} u={win(sq, 0.7, 1)} />
            <Txt x={BARS_X + 120} y={530} text="coarser, still readable · not hidden" size={18} anchor="middle" color={GOAL} u={win(sq, 0.8, 1)} />
            <Txt x={BARS_X + 120} y={556} text="(48× less room; one bar drawn per ten neurons)" size={14} anchor="middle" color={colors.MUTED} u={win(sq, 0.8, 1)} italic />
          </g>
        )}

        {/* ================= confidence dial ================= */}
        {v(scene.dialU) > 0.01 && (
          <g opacity={clamp01(v(scene.dialU) * 3)}>
            <Panel x={440} y={200} w={400} h={300} stroke={colors.SECONDARY} />
            <path d="M 540,400 A 100,100 0 0,1 740,400" fill="none" stroke={colors.GRID} strokeWidth={16} />
            <path d="M 540,400 A 100,100 0 0,1 740,400" fill="none" stroke={colors.SECONDARY} strokeWidth={16} strokeDasharray={`${314 * 0.85 * v(scene.dialU)} 400`} />
            <Txt x={640} y={392} text={`~${Math.round(85 * v(scene.dialU))}%`} size={40} anchor="middle" weight={700} color={colors.SECONDARY} />
            <Txt x={640} y={250} text="confidence in the argument" size={20} anchor="middle" weight={650} />
            <Txt x={640} y={450} text="not a count of clean neurons" size={17} anchor="middle" color={colors.MUTED} italic />
          </g>
        )}

        {/* ================= ablation ================= */}
        {ablOp > 0.01 && (
          <g opacity={ablOp}>
            <Panel x={300} y={190} w={680} h={320} />
            <Txt x={330} y={232} text="“…once upon a midnight ___”" size={20} mono />
            <circle cx={420} cy={360} r={34} fill={v(scene.cut) > 0.5 ? DEAD : colors.SECONDARY} />
            <Txt x={420} y={366} text="one neuron" size={13} anchor="middle" color={colors.BG} weight={700} />
            {v(scene.cut) > 0.05 && <path d="M 392,332 L 448,388 M 448,332 L 392,388" stroke={colors.NEGATIVE} strokeWidth={4} opacity={v(scene.cut)} />}
            <Txt x={540} y={316} text="p(next word: dreary)" size={17} color={colors.MUTED} />
            <rect x={540} y={330} width={380} height={30} rx={8} fill={colors.GRID} opacity={0.5} />
            <rect x={540} y={330} width={380 * lerp(0.87, 0.5, v(scene.cut))} height={30} rx={8} fill={SCORE} />
            <Txt x={930 - 4} y={398} text={`${Math.round(lerp(87, 50, v(scene.cut)))}%`} size={26} anchor="end" weight={700} color={SCORE} mono />
            <Txt x={640} y={470} text="read precisely → edit precisely" size={19} anchor="middle" weight={650} u={win(v(scene.cut), 0.6, 1)} />
          </g>
        )}

        {/* ================= the doors ================= */}
        {v(scene.doorsU) > 0.01 && (
          <g opacity={v(scene.doorsU)}>
            {/* the population boundary */}
            <rect x={250} y={170} width={620} height={360} rx={24} fill="none" stroke={colors.MUTED} strokeWidth={1.6} strokeDasharray="6 6" />
            <Txt x={270} y={198} text="the model (inside the population)" size={15} color={colors.MUTED} italic />
            {/* READ door */}
            <rect x={300} y={230} width={160} height={260} rx={10} fill={colors.PANEL} stroke={GOAL} strokeWidth={2.4} />
            <g transform={`translate(300,230) scale(${1 - 0.7 * v(scene.readOpen)},1)`}>
              <rect width={160} height={260} rx={10} fill={GOAL} opacity={0.18} />
            </g>
            <Txt x={380} y={470} text="READ" size={24} anchor="middle" weight={700} color={GOAL} />
            <Txt x={380} y={560} text="its own neurons: a check" size={17} anchor="middle" color={GOAL} u={v(scene.readOpen)} />
            {/* WRITE door */}
            <rect x={620} y={230} width={160} height={260} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2.4} />
            <rect x={680} y={340} width={40} height={34} rx={6} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
            <path d="M 688,340 v -12 a 12,12 0 0 1 24,0 v 12" fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
            <Txt x={700} y={470} text="WRITE" size={24} anchor="middle" weight={700} color={colors.NEGATIVE} />
            <Txt x={700} y={560} text="its own training: locked" size={17} anchor="middle" color={colors.NEGATIVE} u={v(scene.readOpen)} />
            {/* the key, held outside */}
            {v(scene.keyU) > 0.01 && (
              <g opacity={v(scene.keyU)}>
                <circle cx={1010} cy={300} r={24} fill={SCORE} />
                <path d="M 994,334 Q 1010,314 1026,334 Z" fill={SCORE} />
                <g transform={`translate(${lerp(1060, 1000, v(scene.keyU))},380)`}>
                  <circle r={12} fill="none" stroke={SCORE} strokeWidth={4} />
                  <line x1={12} y1={0} x2={50} y2={0} stroke={SCORE} strokeWidth={4} />
                  <line x1={40} y1={0} x2={40} y2={10} stroke={SCORE} strokeWidth={4} />
                </g>
                <Txt x={1010} y={440} text="the judge holds the key," size={17} anchor="middle" color={SCORE} />
                <Txt x={1010} y={462} text="outside" size={17} anchor="middle" color={SCORE} weight={650} />
              </g>
            )}
          </g>
        )}

        {/* the lens (persistent) */}
        {v(scene.lensU) > 0.01 && (
          <g opacity={v(scene.lensU)}>
            <circle cx={lx} cy={ly} r={LENS_R} fill="none" stroke={colors.TEXT} strokeWidth={3} opacity={0.85} />
            <circle cx={lx} cy={ly} r={LENS_R + 6} fill="none" stroke={colors.TEXT} strokeWidth={1} opacity={0.3} />
            {stop < 4.5 && <line x1={lx + LENS_R * 0.72} y1={ly + LENS_R * 0.72} x2={lx + LENS_R * 1.35} y2={ly + LENS_R * 1.35} stroke={colors.TEXT} strokeWidth={6} strokeLinecap="round" opacity={0.85} />}
          </g>
        )}

        <Veil u={v(scene.veil)} />
      </Camera>

      {/* ================= the question card (screen space) ================= */}
      {v(scene.cardU) > 0.01 && (
        <g opacity={v(scene.cardU)} transform={`translate(${cx},${cy}) scale(${ck})`}>
          <rect x={-340} y={-120} width={680} height={v(scene.answerU) > 0.01 ? 300 : 230} rx={14} fill={colors.BG} />
          <rect x={-340} y={-120} width={680} height={v(scene.answerU) > 0.01 ? 300 : 230} rx={14} fill={colors.PANEL} stroke={ACCENT} strokeWidth={1.6} />
          <text x={0} y={-60} fontSize={30} fontWeight={650} textAnchor="middle" fill={colors.TEXT}>
            1. Which kind of judge is it?
          </text>
          <text x={0} y={0} fontSize={30} fontWeight={650} textAnchor="middle" fill={ACCENT}>
            2. Can anyone see what it built?
          </text>
          {v(scene.answerU) > 0.01 && (
            <g opacity={v(scene.answerU)}>
              <text x={0} y={70} fontSize={22} textAnchor="middle" fill={SCORE}>
                1. A proxy, every time.
              </text>
              <text x={0} y={110} fontSize={22} textAnchor="middle" fill={GOAL}>
                2. More often than we feared.
              </text>
            </g>
          )}
        </g>
      )}
      <Chips texts={PHASE_CHIPS} k={v(scene.chipK)} inU={v(scene.chipIn) * (1 - v(scene.cardU) * (1 - v(scene.cardTuck)))} />
      <Closing text="Let theories die in our stead." sub="and keep the judge outside the population it judges" u={v(scene.closeU)} />
    </>
  );
}

export const vizScene = () => scene;
