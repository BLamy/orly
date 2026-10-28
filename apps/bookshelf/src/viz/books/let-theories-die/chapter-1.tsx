// The Score Is the Outcome
//
// Let Theories Die — chapter 1. D3/SVG scene authored by Claude Opus 5.5. Requested model `claude-opus-5-5`;
// actual: `claude-opus-5-5`. Planned by Claude Opus 5.5 (user override of the default Astra planning stage) in
// .orly-work/visual-plan.md, chapter 1. The eleven captions are the plan's fixed narration.
//
// Sources (sources.json, chapter 1):
//   natural selection   Darwin, On the Origin of Species (1859), ch. 4
//   BOAS                https://www.vet.cam.ac.uk/boas/about-boas
//   proxy / Goodhart    https://en.wikipedia.org/wiki/Goodhart%27s_law
//
// Schematic versus measured: the herd, the traits, the face profile, its airway and both meters are an
// illustration of the mechanism. No value on stage is a measurement of real dogs.
//
// Beat sheet
//   C0  two judges: a nature panel (left) and an empty breeder panel (right) fade in
//   C1  a hazard sweeps the herd; the unfit grey out; no one chose
//   C2  survivors bud offspring; tag "the score is what happened"
//   C3  camera pans right: the breeder, a big face profile and a ruler that can only see the face
//   C4  "proxy" stamped on the ruler; two meters: proxy (flat face) and goal (easy breathing)
//   C5  generations tick 0→6: the muzzle shortens, the proxy meter climbs
//   C6  a cross-section inset: the airway's soft tissue swells shut; the BOAS label lands
//   C7  the goal meter falls while the proxy rises: the gap opens
//   C8  the meters are renamed score / goal: reward hacking is this gap in a machine
//   C9  veil; the question card: which kind of judge, and can anyone see what it built?
//   C10 the card is kept for chapter five; clean closing panel
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { ACCENT, Chips, Closing, DEAD, GOAL, Meter, Panel, SCORE, Txt, Veil, addCaptions, captionClock, clamp01, lerp, win } from './shared/kit';

const CAPS = [
  'Two kinds of judge decide what survives. One has a goal in mind. The other has no goal at all.',
  'In natural selection, nobody picks the winners. Whatever survives and leaves offspring simply becomes the next generation.',
  'There is no score to fake, because the score is just what happened. Survival is not a measurement of fitness. It is the outcome itself.',
  'Artificial selection adds a breeder. The breeder wants something, but can only see traits, so they choose by a trait that stands in for the goal.',
  'That stand-in is called a proxy. Push a population hard on a proxy, and it gets very good at the proxy.',
  'Bulldogs are the classic case. Generation after generation, breeders selected for a shorter, flatter face.',
  'Veterinary researchers at Cambridge link that selection for extreme short-headed features to blocked airways, a condition called brachycephalic obstructive airway syndrome.',
  'The proxy kept rising, while the thing it stood for, a dog that breathes easily, fell. Nobody wanted that. The proxy delivered it.',
  'Reward hacking is the same gap inside a machine: a measured score drifting away from the goal it was meant to track.',
  'Every AI training run has a judge. So this book asks two questions: which kind of judge is it, and can anyone see what it built?',
  'Hold on to the second question. In the last chapter, we try to answer it by reading a network directly.',
];
const { T, DUR } = captionClock(CAPS);

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/** the nature herd: 24 creatures, a trait each; survival is decided by the hazard, nothing else */
const HERD = (() => {
  const r = mulberry32(1859);
  return Array.from({ length: 24 }, (_, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const trait = r();
    return {
      x: 128 + col * 78 + (row % 2) * 20,
      y: 232 + row * 74,
      trait,
      hue: ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d'][Math.floor(r() * 4)],
      lives: trait > 0.38,
    };
  });
})();
const SWEEP_X0 = 80;
const SWEEP_X1 = 600;

// breeder panel geometry
const BIG = { cx: 980, cy: 300 }; // the big profile's head centre
const RULER = { x: 760, y: 410, w: 300 };
const METERS = { x: 760, y1: 486, y2: 548, w: 420 };
const GENS = 6;

// camera
const CAM_NATURE: CameraState = { x: 360, y: 340, k: 1.22 };
const CAM_BREEDER: CameraState = { x: 960, y: 360, k: 1.18 };
const CAM_GAP: CameraState = { x: 900, y: 430, k: 1.12 };

const PHASE_CHIPS = ['two judges', 'nature: no one chooses', 'the breeder: a proxy for the goal', 'schematic · not measured dogs', 'the gap has a name'];

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chipIn = tl.channel('chipIn', 0);
  const chipK = tl.channel('chipK', 0);
  const natU = tl.channel('natU', 0);
  const brdPanelU = tl.channel('brdPanelU', 0);
  const sweep = tl.channel('sweep', 0);
  const budU = tl.channel('budU', 0);
  const tagU = tl.channel('tagU', 0);
  const bigU = tl.channel('bigU', 0);
  const rulerU = tl.channel('rulerU', 0);
  const proxyU = tl.channel('proxyU', 0);
  const meterU = tl.channel('meterU', 0);
  const gen = tl.channel('gen', 0); // 0..6 generations
  const airU = tl.channel('airU', 0); // airway cutaway + label
  const boasU = tl.channel('boasU', 0);
  const flow = tl.channel('flow', 0); // airflow phase, tweened linearly
  const gapU = tl.channel('gapU', 0);
  const renameU = tl.channel('renameU', 0);
  const natDim = tl.channel('natDim', 0);
  const veil = tl.channel('veil', 0);
  const cardU = tl.channel('cardU', 0);
  const closeU = tl.channel('closeU', 0);

  addCaptions(tl, CAPS, T, DUR);
  // airflow runs the whole chapter at constant speed (scrub-safe: position is a pure function of time)
  tl.tween(flow, 60, { at: 0, dur: T[10] + DUR[10] + 1, ease: ease.linear });

  // C0 — two judges
  let t = T[0];
  tl.tween(chipIn, 1, { at: t, dur: 0.6, ease: ease.enter });
  tl.tween(natU, 1, { at: t + 0.3, dur: 0.8, ease: ease.enter });
  tl.tween(brdPanelU, 1, { at: t + 1.6, dur: 0.8, ease: ease.enter });
  tl.hold(t + 2.4, 1);

  // C1 — the hazard sweeps
  t = T[1];
  tl.tween(chipK, 1, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_NATURE, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(sweep, 1, { at: t + 1.2, dur: 4.2, ease: ease.linear });
  tl.hold(t + 5.4, 0.8);

  // C2 — offspring; the score is what happened
  t = T[2];
  tl.tween(budU, 1, { at: t + 0.4, dur: 1.4, ease: ease.enter });
  tl.tween(tagU, 1, { at: t + 2.4, dur: 0.6, ease: ease.enter });
  tl.hold(t + 3.0, 1);

  // C3 — the breeder
  t = T[3];
  tl.tween(chipK, 2, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_BREEDER, { at: t, dur: 1.5, ease: ease.move });
  tl.tween(natDim, 1, { at: t + 0.4, dur: 0.8, ease: ease.move });
  tl.tween(bigU, 1, { at: t + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(rulerU, 1, { at: t + 3.4, dur: 1.0, ease: ease.draw });
  tl.hold(t + 4.4, 1);

  // C4 — proxy stamp + meters
  t = T[4];
  tl.tween(proxyU, 1, { at: t + 0.5, dur: 0.5, ease: ease.pop });
  tl.tween(meterU, 1, { at: t + 2.0, dur: 0.8, ease: ease.enter });
  tl.hold(t + 2.8, 1);

  // C5 — generations: the face shortens
  t = T[5];
  tl.tween(chipK, 3, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(gen, GENS * 0.6, { at: t + 0.8, dur: 3.6, ease: ease.linear });
  tl.hold(t + 4.4, 0.6);

  // C6 — the airway narrows; BOAS
  t = T[6];
  tl.tween(airU, 1, { at: t, dur: 0.8, ease: ease.enter });
  tl.tween(gen, GENS, { at: t + 0.6, dur: 4.4, ease: ease.linear });
  tl.tween(boasU, 1, { at: t + 4.6, dur: 0.7, ease: ease.enter });
  tl.hold(t + 5.3, 1);

  // C7 — the gap opens
  t = T[7];
  tl.tween(cam, CAM_GAP, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(gapU, 1, { at: t + 2.4, dur: 1.2, ease: ease.draw });
  tl.hold(t + 3.6, 1);

  // C8 — renamed: score and goal
  t = T[8];
  tl.tween(chipK, 4, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(renameU, 1, { at: t + 0.6, dur: 0.9, ease: ease.move });
  tl.hold(t + 1.5, 1);

  // C9 — veil + question card
  t = T[9];
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(chipIn, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(veil, 1, { at: t + 0.3, dur: 1.0, ease: ease.move });
  tl.tween(cardU, 1, { at: t + 1.2, dur: 0.8, ease: ease.enter });
  tl.hold(t + 2.0, 1);

  // C10 — closing
  t = T[10];
  tl.tween(closeU, 1, { at: t + 1.2, dur: 0.8, ease: ease.enter });
  tl.hold(T[10] + DUR[10], 0.6);

  return {
    tl, cam, chipIn, chipK, natU, brdPanelU, sweep, budU, tagU, bigU, rulerU, proxyU, meterU, gen, airU, boasU, flow,
    gapU, renameU, natDim, veil, cardU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local components
// ---------------------------------------------------------------------------

/** A dog head in profile, facing left. `flat` 0 = long muzzle, 1 = very short. */
function DogHead({ cx, cy, s, flat, color, opacity = 1, airway = 0 }: { cx: number; cy: number; s: number; flat: number; color: string; opacity?: number; airway?: number }) {
  if (opacity <= 0.005) return null;
  const L = lerp(92, 12, flat); // muzzle length
  const mh = lerp(46, 58, flat); // a flatter face is a taller, wider muzzle
  const mx = -62 - L; // muzzle left edge (head radius 66)
  return (
    <g transform={`translate(${cx},${cy}) scale(${s})`} opacity={opacity}>
      {/* ear */}
      <path d="M 14,-60 L 44,-104 L 58,-46 Z" fill={color} opacity={0.85} />
      {/* head */}
      <circle r={66} fill={color} />
      {/* muzzle */}
      <rect x={mx} y={-4} width={L + 70} height={mh} rx={Math.min(22, mh / 2)} fill={color} />
      {/* folds appear as the face flattens */}
      {flat > 0.45 && (
        <path d={`M ${mx + 18},${-2} q 14,-14 30,0 M ${mx + 22},${-14} q 16,-14 34,0`} fill="none" stroke="#7c2d12" strokeWidth={3 / s} opacity={win(flat, 0.45, 0.8)} />
      )}
      {/* nose, with a nostril that narrows as the face flattens */}
      <ellipse cx={mx + 6} cy={6} rx={11} ry={9} fill="#1f2937" />
      <ellipse cx={mx + 3} cy={8} rx={lerp(4.2, 0.9, flat)} ry={lerp(3.2, 0.8, flat)} fill="#0b1220" stroke="#475569" strokeWidth={0.8} />
      {/* eye */}
      <circle cx={-14} cy={-18} r={7} fill="#1f2937" />
      {/* where the cross-section is taken: a dashed cut through the muzzle */}
      {airway > 0.01 && (
        <g opacity={airway}>
          <line x1={mx + L * 0.5 + 18} y1={-12} x2={mx + L * 0.5 + 18} y2={mh + 8} stroke={colors.TEXT} strokeWidth={1.6} strokeDasharray="4 4" />
        </g>
      )}
    </g>
  );
}

/** The airway as a cross-section: a passage whose soft-tissue walls swell shut as the face flattens. */
const INSET = { x: 690, y: 232, w: 178, h: 134 };
function AirwayInset({ u, flat, flow }: { u: number; flat: number; flow: number }) {
  if (u <= 0.01) return null;
  const { x, y, w, h } = INSET;
  const midY = y + 66;
  const gap = lerp(44, 7, Math.pow(flat, 0.85)); // open passage height
  const bulge = (44 - gap) / 2; // soft tissue swelling from each wall
  const x0 = x + 14;
  const x1 = x + w - 14;
  // a smooth swelling profile, widest in the middle of the passage
  const wall = (top: boolean) => {
    const sgn = top ? 1 : -1;
    const base = midY - sgn * 22;
    const pts: string[] = [];
    for (let k = 0; k <= 24; k++) {
      const px = lerp(x0, x1, k / 24);
      const bell = Math.sin((Math.PI * k) / 24);
      pts.push(`${k === 0 ? 'M' : 'L'}${px.toFixed(1)},${(base + sgn * bulge * bell).toFixed(1)}`);
    }
    return `${pts.join(' ')} L${x1},${base - sgn * 14} L${x0},${base - sgn * 14} Z`;
  };
  const speed = lerp(1, 0.22, flat);
  return (
    <g opacity={u}>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={x + 12} y={y + 22} fontSize={14} fill={colors.MUTED}>
        airway, cut through the muzzle
      </text>
      <rect x={x0} y={midY - 22} width={x1 - x0} height={44} fill="#0b1220" />
      <path d={wall(true)} fill="#f0a8a0" />
      <path d={wall(false)} fill="#f0a8a0" />
      {Array.from({ length: 6 }, (_, k) => {
        const ph = (((flow * speed * 0.6 + k / 6) % 1) + 1) % 1;
        const px = lerp(x0 + 4, x1 - 4, ph);
        const room = gap / 2 - 3;
        const py = midY + (k % 3 - 1) * Math.max(0, room * 0.55);
        return <circle key={k} cx={px} cy={py} r={2.6} fill={GOAL} opacity={lerp(0.95, 0.45, flat)} />;
      })}
      <text x={x + w / 2} y={y + h - 10} fontSize={14} textAnchor="middle" fill={flat > 0.55 ? colors.NEGATIVE : GOAL} fontWeight={650}>
        {flat > 0.55 ? 'obstructed' : 'open passage'}
      </text>
    </g>
  );
}

function Creature({ x, y, hue, u, dead, s = 1 }: { x: number; y: number; hue: string; u: number; dead: number; s?: number }) {
  if (u <= 0.005) return null;
  const c = dead > 0.5 ? DEAD : hue;
  return (
    <g transform={`translate(${x},${y + dead * 10}) scale(${s})`} opacity={u * (1 - dead * 0.7)}>
      <circle r={17} fill={c} />
      <rect x={-34} y={-2} width={26} height={14} rx={6} fill={c} />
      <circle cx={-31} cy={3} r={3.4} fill="#1f2937" />
      <circle cx={-5} cy={-5} r={2.6} fill="#1f2937" />
      {dead > 0.05 && <path d="M -9,-9 L 9,9 M 9,-9 L -9,9" stroke={colors.NEGATIVE} strokeWidth={2.4} opacity={dead} />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>) => s.get(ch);
  const cam = s.get(scene.cam);
  const natU = v(scene.natU);
  const sweep = v(scene.sweep);
  const budU = v(scene.budU);
  const gen = v(scene.gen);
  const flat = gen / GENS;
  const proxyVal = 0.16 + 0.78 * flat;
  const goalVal = 0.9 - 0.74 * Math.pow(flat, 1.2);
  const natDim = v(scene.natDim);
  const renameU = v(scene.renameU);
  const gapU = v(scene.gapU);
  const sweepX = lerp(SWEEP_X0, SWEEP_X1, sweep);
  const natOp = natU * (1 - 0.82 * natDim);

  return (
    <>
      <Camera {...cam}>
        {/* ================= nature (left) ================= */}
        <g opacity={natOp}>
          <Panel x={72} y={150} w={540} h={400} />
          <Txt x={96} y={186} text="Nature" size={24} weight={650} />
          <Txt x={96} y={210} text="no breeder, no scoreboard" size={16} color={colors.MUTED} italic />
          {sweep > 0.001 && sweep < 0.999 && (
            <g>
              <rect x={sweepX - 30} y={160} width={30} height={380} fill={colors.NEGATIVE} opacity={0.12} />
              <line x1={sweepX} y1={160} x2={sweepX} y2={540} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="5 5" />
              <Txt x={sweepX + 8} y={176} text="a hard winter" size={14} color={colors.NEGATIVE} />
            </g>
          )}
          {HERD.map((h, i) => {
            const passed = sweepX > h.x ? 1 : 0;
            const dead = h.lives ? 0 : clamp01((sweepX - h.x) / 40) * passed;
            return (
              <g key={i}>
                <Creature x={h.x} y={h.y} hue={h.hue} u={1} dead={dead} />
                {h.lives && budU > 0.01 && <Creature x={h.x + 22} y={h.y + 26} hue={h.hue} u={clamp01(budU * 1.4 - (i % 6) * 0.06)} dead={0} s={0.55} />}
              </g>
            );
          })}
          {v(scene.tagU) * (1 - natDim) > 0.01 && (
            <g opacity={v(scene.tagU) * (1 - natDim)}>
              <rect x={150} y={500} width={384} height={36} rx={9} fill={colors.BG} stroke={GOAL} strokeWidth={1.4} />
              <Txt x={342} y={524} text="the score is just what happened" size={18} anchor="middle" color={GOAL} />
            </g>
          )}
        </g>

        {/* ================= the breeder (right) ================= */}
        <Panel x={668} y={150} w={548} h={420} u={v(scene.brdPanelU)} />
        <Txt x={692} y={186} text="The breeder" size={24} weight={650} u={v(scene.brdPanelU)} />
        <Txt x={692} y={210} text="wants a goal, can only see traits" size={16} color={colors.MUTED} italic u={v(scene.brdPanelU)} />

        <DogHead cx={BIG.cx} cy={BIG.cy} s={1} flat={flat} color="#d6a36b" opacity={v(scene.bigU)} airway={v(scene.airU)} />
        <AirwayInset u={v(scene.airU)} flat={flat} flow={v(scene.flow)} />
        {/* generation strip */}
        {v(scene.bigU) > 0.01 && gen > 0.02 && (
          <g>
            <Txt x={1196} y={238} text={`generation ${Math.min(GENS, Math.floor(gen + 0.001))}`} size={17} anchor="end" color={colors.MUTED} mono />
          </g>
        )}
        {v(scene.boasU) > 0.01 && (
          <g opacity={v(scene.boasU)}>
            <line x1={INSET.x + INSET.w / 2} y1={INSET.y + INSET.h} x2={INSET.x + INSET.w / 2} y2={384} stroke={colors.NEGATIVE} strokeWidth={1.6} />
            <rect x={700} y={384} width={262} height={30} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.3} />
            <Txt x={831} y={405} text="narrowed airway (BOAS)" size={16} anchor="middle" color={colors.NEGATIVE} />
          </g>
        )}

        {/* ruler: the only thing the breeder can see */}
        {v(scene.rulerU) > 0.01 && (
          <g opacity={v(scene.rulerU) * (1 - v(scene.boasU))}>
            <line x1={RULER.x} y1={RULER.y} x2={RULER.x + RULER.w * v(scene.rulerU)} y2={RULER.y} stroke={SCORE} strokeWidth={3} />
            {Array.from({ length: 11 }, (_, k) => (
              <line key={k} x1={RULER.x + k * 30} y1={RULER.y - (k % 5 === 0 ? 10 : 5)} x2={RULER.x + k * 30} y2={RULER.y} stroke={SCORE} strokeWidth={1.5} opacity={win(v(scene.rulerU), k / 11, k / 11 + 0.1)} />
            ))}
            <Txt x={RULER.x} y={RULER.y + 24} text="face length" size={15} color={SCORE} />
          </g>
        )}
        {v(scene.proxyU) > 0.01 && (
          <g transform={`translate(1110,${RULER.y - 6}) rotate(-8) scale(${0.6 + 0.4 * v(scene.proxyU)})`} opacity={v(scene.proxyU) * (1 - v(scene.boasU))}>
            <rect x={-52} y={-18} width={104} height={34} rx={6} fill="none" stroke={SCORE} strokeWidth={2.4} />
            <Txt x={0} y={7} text="PROXY" size={20} anchor="middle" weight={700} color={SCORE} />
          </g>
        )}

        {/* meters: proxy and goal, renamed score and goal at C8 */}
        <Meter x={METERS.x} y={METERS.y1} w={METERS.w} label={renameU > 0.5 ? 'score  (what is measured)' : 'proxy: a flat face'} value={proxyVal} color={SCORE} u={v(scene.meterU) * clamp01(Math.abs(renameU - 0.5) * 2)} />
        <Meter x={METERS.x} y={METERS.y2} w={METERS.w} label={renameU > 0.5 ? 'goal  (what was wanted)' : 'goal: easy breathing'} value={goalVal} color={GOAL} u={v(scene.meterU) * clamp01(Math.abs(renameU - 0.5) * 2)} />
        {gapU > 0.01 && (
          <g opacity={gapU}>
            <line x1={METERS.x + METERS.w * goalVal} y1={METERS.y2 + 7} x2={METERS.x + METERS.w * proxyVal} y2={METERS.y1 + 7} stroke={colors.NEGATIVE} strokeWidth={2.4} strokeDasharray="6 5" />
            <Txt x={METERS.x + METERS.w} y={METERS.y2 + 44} text="the gap" size={20} weight={650} color={colors.NEGATIVE} u={gapU} anchor="end" />
            <Txt x={METERS.x + METERS.w - 90} y={METERS.y2 + 44} text={renameU > 0.5 ? 'reward hacking =' : ''} size={17} color={colors.NEGATIVE} u={renameU} anchor="end" />
          </g>
        )}

        <Veil u={v(scene.veil)} />
        {/* ================= the planted question ================= */}
        {v(scene.cardU) > 0.01 && (
          <g opacity={v(scene.cardU)}>
            <Panel x={300} y={170} w={680} h={250} stroke={ACCENT} opaque />
            <Txt x={640} y={222} text="Every AI training run has a judge." size={24} anchor="middle" color={colors.MUTED} />
            <Txt x={640} y={286} text="1. Which kind of judge is it?" size={30} anchor="middle" weight={650} />
            <Txt x={640} y={344} text="2. Can anyone see what it built?" size={30} anchor="middle" weight={650} color={ACCENT} />
            <Txt x={640} y={392} text="question 2 returns in chapter 5" size={16} anchor="middle" color={colors.MUTED} italic u={v(scene.closeU)} />
          </g>
        )}
      </Camera>
      <Chips texts={PHASE_CHIPS} k={v(scene.chipK)} inU={v(scene.chipIn)} />
      <Closing text="Nature can't be gamed. A breeder's ruler can." u={v(scene.closeU)} />
    </>
  );
}

export const vizScene = () => scene;
