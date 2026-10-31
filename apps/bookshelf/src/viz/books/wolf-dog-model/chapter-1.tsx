// Two Kinds of Choosing
//
// Wolf, Dog, Model — chapter 1. D3/SVG scene authored by Claude Opus 5.5. Requested model `claude-opus-5-5`; actual:
// `claude-opus-5-5` (the model id in this session's system context). Planned by Claude Opus 5.5 by user override of the
// Astra-planning default, in .orly-work/visual-plan.md (chapter 1). The eleven captions are the plan's fixed narration.
//
// Sources:
//   Darwin, On the Origin of Species (1859), ch. 1, "Methodical and Unconscious Selection"
//     https://www.gutenberg.org/cache/epub/1228/pg1228.txt
//   Zeder, "Core questions in domestication research", PNAS 2015, doi:10.1073/pnas.1501711112 (abstract)
//   Larson et al., "Rethinking dog domestication…", PNAS 2012, doi:10.1073/pnas.1203005109 (abstract)
//
// Schematic versus sourced:
//   - The trait cloud, its axes, the target box and every generation step are a conceptual illustration. No point is an
//     animal and no position is data.
//   - Quoted words on the cards are verbatim from the sources above. The order "domestication first, breeding after" is
//     this book's reading, voiced as such.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  ACCENT,
  Arrow,
  Canid,
  Card,
  Chips,
  DOG,
  Label,
  Person,
  WOLF,
  WOLF_POSE,
  DOG_POSE,
  clamp01,
  lerp,
  makeCloud,
  mixPose,
  seg,
  timing,
} from './shared/kit';
import { interpolateRgb } from 'd3';

// ---------------------------------------------------------------------------
// Fixed narration
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'Book one of this series, Let Theories Die, asked who decides what survives. Book two, Herding the Swarm, asked how to control a population. This book asks what kind of choosing turns a wolf into a dog.',
  'Picture a population as a cloud. One direction is temperament, from fearful to calm around people. The other is a job skill, like herding.',
  'Breeding aims at a specific trait. Charles Darwin called it methodical selection: a breeder with a distinct object in view, trying to make a new strain.',
  'Watch the breeder’s target. Only animals inside the box get to have offspring, and generation by generation the cloud climbs the skill axis.',
  'Darwin thought a second kind mattered more. He called it unconscious selection: everyone simply keeps and breeds from their best animals, with no plan to change the breed.',
  'His example was a man who keeps pointers. He wants good dogs and has no wish to alter the breed. Continued over centuries, Darwin argued, the breed changes anyway.',
  'Domestication is the deepest version of that pressure. The archaeologist Melinda Zeder defines it as a coevolutionary, mutualistic relationship. Both sides change, not only the animal.',
  'When dogs were first domesticated, and whether it happened once or many times, is still uncertain, as a large genetic study of dogs and wolves concluded.',
  'What we can watch is the order. First the cloud slides toward calm. Only an animal that tolerates people can then be bred for a job.',
  'So domestication is wide, and it comes first. Breeding is narrow, and it comes after.',
  'Keep both arrows in mind. Later in this book, the same two kinds of choosing turn up in the training of a language model.',
];
const { T, DUR } = timing(CAPTIONS);

// ---------------------------------------------------------------------------
// Layout: the trait space
// ---------------------------------------------------------------------------

const X0 = 210;
const X1 = 880;
const Y0 = 120;
const Y1 = 560;
const WILD = { x: 330, y: 470 };
const CALM_X = 735;
const CLIMB = 250; // how far the cloud climbs under the box
const BOX_A = { x: 238, y: 140, w: 210, h: 120 }; // first target: skill only
const BOX_B = { x: 625, y: 140, w: 230, h: 120 }; // second target: skill, among calm animals
const CLOUD = makeCloud(140, 1868);

const CARD = { x: 920, y: 140, w: 330, h: 230 };

const CHIP_TEXT = ['the series so far', 'schematic: a population, not data', 'Darwin, 1859 · schematic generations', 'Zeder 2015 · Larson et al. 2012', 'this book’s reading of the order'];

const CAM_BOX: CameraState = { x: 470, y: 362, k: 1.1 };

const toDog = interpolateRgb(WOLF, DOG);

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chipOn = tl.channel('chipOn', 0);
  const chipK = tl.channel('chipK', 0);

  const heroU = tl.channel('heroU', 0); // the opening wolf
  const heroMorph = tl.channel('heroMorph', 0); // wolf → dog, a promise of the book
  const spinesU = tl.channel('spinesU', 0);
  const heroOut = tl.channel('heroOut', 0);
  const axesU = tl.channel('axesU', 0);
  const cloudU = tl.channel('cloudU', 0);
  const card1 = tl.channel('card1', 0); // methodical
  const boxA = tl.channel('boxA', 0);
  const gen = tl.channel('gen', 0); // 0..4 generations under box A
  const card2 = tl.channel('card2', 0); // unconscious
  const pointersU = tl.channel('pointersU', 0);
  const centuries = tl.channel('centuries', 0); // 0..4
  const card3 = tl.channel('card3', 0); // Zeder
  const personU = tl.channel('personU', 0);
  const mutualU = tl.channel('mutualU', 0);
  const card4 = tl.channel('card4', 0); // Larson
  const dom = tl.channel('dom', 0); // slide toward calm
  const domArrow = tl.channel('domArrow', 0);
  const boxB = tl.channel('boxB', 0);
  const breed = tl.channel('breed', 0); // climb inside box B
  const breedArrow = tl.channel('breedArrow', 0);
  const tagsU = tl.channel('tagsU', 0);
  const dimAll = tl.channel('dimAll', 0);
  const closeU = tl.channel('closeU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: T[i], dur: i < CAPTIONS.length - 1 ? T[i + 1] - T[i] : DUR[i], text }));

  // — C0 · the series so far; a wolf that will become a dog —
  let t = T[0];
  tl.tween(chipOn, 1, { at: t, dur: 0.6, ease: ease.enter });
  tl.tween(heroU, 1, { at: t + 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(spinesU, 1, { at: t + 1.2, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 330, k: 1.08 }, { at: t + 0.4, dur: 3.0, ease: ease.move });
  tl.tween(heroMorph, 1, { at: t + DUR[0] - 4.6, dur: 3.2, ease: ease.move });
  tl.hold(t + DUR[0] - 1.2, 0.8);

  // — C1 · the cloud and its two axes —
  t = T[1];
  tl.tween(chipK, 1, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(heroOut, 1, { at: t, dur: 1.1, ease: ease.move });
  tl.tween(spinesU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(cloudU, 1, { at: t + 0.7, dur: 1.4, ease: ease.enter });
  tl.tween(axesU, 1, { at: t + 1.4, dur: 1.4, ease: ease.draw });
  tl.hold(t + 2.8, 1.0);

  // — C2 · methodical selection: a breeder with an object in view —
  t = T[2];
  tl.tween(chipK, 2, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(card1, 1, { at: t + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(boxA, 1, { at: t + 3.0, dur: 1.2, ease: ease.draw });
  tl.hold(t + 4.2, 1.0);

  // — C3 · only the box breeds; the cloud climbs, generation by generation —
  t = T[3];
  tl.tween(card1, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_BOX, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(gen, 4, { at: t + 1.0, dur: DUR[3] - 1.4, ease: ease.linear });
  tl.hold(t + DUR[3] - 0.4, 0.4);

  // — C4 · unconscious selection: the same wild cloud, no target —
  t = T[4];
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(boxA, 0, { at: t, dur: 0.7, ease: ease.move });
  tl.tween(gen, 0, { at: t + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(card2, 1, { at: t + 0.6, dur: 0.7, ease: ease.enter });
  tl.hold(t + 2.0, 1.0);

  // — C5 · the pointer keeper: centuries of small choices, no plan —
  t = T[5];
  tl.tween(pointersU, 1, { at: t + 0.3, dur: 0.8, ease: ease.enter });
  tl.tween(centuries, 4, { at: t + 1.2, dur: DUR[5] - 1.8, ease: ease.linear });
  tl.hold(t + DUR[5] - 0.6, 0.5);

  // — C6 · Zeder: a relationship that changes both sides —
  t = T[6];
  tl.tween(chipK, 3, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(card2, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(pointersU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(card3, 1, { at: t + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(personU, 1, { at: t + 1.6, dur: 0.7, ease: ease.enter });
  tl.tween(mutualU, 1, { at: t + DUR[6] - 3.6, dur: 1.4, ease: ease.draw });
  tl.hold(t + DUR[6] - 2.0, 1.0);

  // — C7 · Larson: when and how often is still open —
  t = T[7];
  tl.tween(card3, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(mutualU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(card4, 1, { at: t + 0.4, dur: 0.7, ease: ease.enter });
  tl.hold(t + 1.2, 1.0);

  // — C8 · the order: slide toward calm first, then breed among the calm —
  t = T[8];
  tl.tween(chipK, 4, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(card4, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(centuries, 0, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(dom, 1, { at: t + 1.0, dur: 2.4, ease: ease.move });
  tl.tween(domArrow, 1, { at: t + 1.0, dur: 2.4, ease: ease.draw });
  tl.tween(boxB, 1, { at: t + 3.8, dur: 0.9, ease: ease.draw });
  tl.tween(breed, 1, { at: t + 4.8, dur: 1.8, ease: ease.move });
  tl.tween(breedArrow, 1, { at: t + 4.8, dur: 1.8, ease: ease.draw });
  tl.hold(t + 6.6, 0.8);

  // — C9 · wide and first; narrow and after —
  t = T[9];
  tl.tween(personU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(tagsU, 1, { at: t + 0.3, dur: 0.8, ease: ease.enter });
  tl.hold(t + 1.1, 1.0);

  // — C10 · everything whispers; an opaque closing card —
  t = T[10];
  tl.tween(chipOn, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(dimAll, 1, { at: t, dur: 0.9, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 0.6, dur: 0.8, ease: ease.enter });
  tl.hold(T[10] + DUR[10], 0.6);

  return {
    tl, cam, chipOn, chipK, heroU, heroMorph, spinesU, heroOut, axesU, cloudU, card1, boxA, gen, card2, pointersU,
    centuries, card3, personU, mutualU, card4, dom, domArrow, boxB, breed, breedArrow, tagsU, dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local components
// ---------------------------------------------------------------------------

function Box({ b, u, color, label }: { b: { x: number; y: number; w: number; h: number }; u: number; color: string; label: string }) {
  if (u <= 0.005) return null;
  const per = 2 * (b.w + b.h);
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10} fill={color} fillOpacity={0.08 * u} stroke={color} strokeWidth={2.4} strokeDasharray={`${per * u} ${per}`} />
      <Label x={b.x + 12} y={b.y + 24} text={label} size={15} color={color} u={clamp01(u * 1.4 - 0.4)} weight={650} />
    </g>
  );
}

function Spine({ x, y, title, n, color, u }: { x: number; y: number; title: string; n: string; color: string; u: number }) {
  if (u <= 0.005) return null;
  return (
    <g opacity={u} transform={`translate(${x},${y + (1 - u) * 20})`}>
      <rect x={0} y={0} width={56} height={230} rx={6} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={1.6} />
      <text transform="translate(34,212) rotate(-90)" fontSize={17} fill={colors.TEXT} fontWeight={600} fontFamily={colors.font.ui}>
        {title}
      </text>
      <text x={28} y={26} textAnchor="middle" fontSize={15} fill={color} fontWeight={700} fontFamily={colors.font.ui}>
        {n}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (c: Parameters<typeof s.get>[0]) => s.get(c) as number;
  const heroU = v(scene.heroU);
  const heroMorph = v(scene.heroMorph);
  const spinesU = v(scene.spinesU);
  const heroOut = v(scene.heroOut);
  const axesU = v(scene.axesU);
  const cloudU = v(scene.cloudU);
  const gen = v(scene.gen);
  const centuries = v(scene.centuries);
  const dom = v(scene.dom);
  const breed = v(scene.breed);
  const dimAll = v(scene.dimAll);
  const fade = 1 - 0.88 * dimAll; // everything whispers under the closing card

  // cloud state: methodical climb (gen), unplanned drift (centuries), then the ordered slide and climb
  const climbA = gen / 4;
  const drift = centuries / 4;
  const cx = WILD.x + (CALM_X - WILD.x) * dom + 30 * drift;
  const cy = WILD.y - CLIMB * Math.max(climbA, breed) - 34 * drift;
  const sx = lerp(52, 44, dom);
  const sy = lerp(44, 34, Math.max(climbA, breed));
  // the cull: inside each generation, the low-skill half (below the box) fades out, then the next generation refills
  const frac = gen - Math.floor(gen);
  const culling = gen > 0.02 && gen < 3.98 ? seg(frac, 0.1, 0.35) * (1 - seg(frac, 0.65, 0.95)) : 0;
  const domCull = seg(dom, 0.15, 0.45) * (1 - seg(dom, 0.65, 0.95));

  const heroPose = mixPose(WOLF_POSE, DOG_POSE, heroMorph);
  const heroColor = toDog(heroMorph);

  return (
    <>
      <Camera {...s.get(scene.cam)}>
        {/* ================= opening: the wolf, and the series spines ================= */}
        {heroU * (1 - heroOut) > 0.01 && (
          <g opacity={heroU * (1 - heroOut)}>
            <Canid x={lerp(560, WILD.x, heroOut)} y={lerp(330, WILD.y, heroOut)} s={lerp(1.55, 0.2, heroOut)} pose={heroPose} color={heroColor} />
            <Label x={560} y={470} text={heroMorph < 0.5 ? 'wolf' : 'dog'} size={22} anchor="middle" color={colors.MUTED} u={1 - heroOut} />
          </g>
        )}
        <g opacity={spinesU}>
          <Spine x={880} y={180} title="Let Theories Die" n="1" color="#38bdf8" u={spinesU} />
          <Spine x={956} y={180} title="Herding the Swarm" n="2" color="#34d399" u={clamp01(spinesU * 1.4 - 0.2)} />
          <Spine x={1032} y={180} title="Wolf, Dog, Model" n="3" color={ACCENT} u={clamp01(spinesU * 1.8 - 0.6)} />
          <Label x={1000} y={450} text="Who Survives" size={20} anchor="middle" color={colors.TEXT} weight={650} u={spinesU} />
        </g>

        {/* ================= trait space ================= */}
        <g opacity={axesU * fade}>
          <Arrow a={[X0, Y1]} b={[X1, Y1]} u={axesU} color={colors.MUTED} width={2} />
          <Arrow a={[X0, Y1]} b={[X0, Y0]} u={axesU} color={colors.MUTED} width={2} />
          <Label x={X0} y={Y1 + 30} text="fearful" size={16} color={colors.MUTED} u={axesU} />
          <Label x={X1} y={Y1 + 30} text="calm around people" size={16} color={colors.MUTED} anchor="end" u={axesU} />
          <Label x={(X0 + X1) / 2} y={Y1 + 30} text="temperament" size={17} color={colors.TEXT} anchor="middle" weight={600} u={axesU} />
          <text transform={`translate(${X0 - 22},${(Y0 + Y1) / 2}) rotate(-90)`} textAnchor="middle" fontSize={17} fill={colors.TEXT} fontWeight={600} opacity={axesU} fontFamily={colors.font.ui}>
            job skill (herding)
          </text>
        </g>

        <g opacity={fade}>
          <Box b={BOX_A} u={v(scene.boxA)} color={colors.WARM} label="breeder’s target" />
          <Box b={BOX_B} u={v(scene.boxB)} color={colors.WARM} label="breed among the calm" />
        </g>

        {cloudU > 0.01 && (
          <g opacity={fade}>
            {CLOUD.map((p, i) => {
              const enter = clamp01(cloudU * 2.2 - p.rank * 1.2);
              if (enter <= 0.01) return null;
              const x = cx + p.ox * sx;
              const y = cy + p.oy * sy;
              const culled = Math.max(p.oy > 0.25 ? culling : 0, p.ox < -0.35 ? domCull : 0);
              // colour carries temperament: grey (fearful) on the left, warm (calm around people) on the right
              const col = toDog(clamp01((x - X0 - 60) / (X1 - X0 - 160)));
              return <circle key={i} cx={x} cy={y} r={5.2} fill={col} opacity={enter * (1 - 0.8 * culled)} />;
            })}
          </g>
        )}
        {gen > 0.05 && gen < 3.99 && (
          <Label x={BOX_A.x + BOX_A.w + 18} y={BOX_A.y + 30} text={`generation ${Math.min(4, Math.floor(gen) + 1)}`} size={18} color={colors.WARM} weight={650} mono u={clamp01(Math.min(gen, 4 - gen) * 4) * fade} />
        )}

        {/* ================= the pointer keeper: centuries of small choices ================= */}
        {v(scene.pointersU) > 0.01 && (
          <g opacity={v(scene.pointersU) * fade}>
            {[0, 1, 2, 3, 4].map((k) => {
              const u = clamp01(centuries - k + 1);
              const pose = mixPose({ ear: 0.6, tail: 0.3, snout: 0.35, spots: 0.5 }, { ear: 0.8, tail: 0.25, snout: 0.6, spots: 0.75 }, k / 4);
              return (
                <g key={k} opacity={lerp(0.25, 1, u)}>
                  <Canid x={940 + k * 68} y={470} s={0.29} pose={pose} color={DOG} />
                  <Label x={948 + k * 68} y={512} text={`c.${k + 1}`} size={13} color={colors.MUTED} anchor="middle" mono />
                </g>
              );
            })}
            <Label x={1082} y={440} text="a pointer keeper’s dogs, century by century" size={14} color={colors.MUTED} anchor="middle" />
          </g>
        )}

        {/* ================= the person, and the two-way relationship ================= */}
        <g opacity={fade}>
          <Person x={1010} y={560} s={1.05} opacity={v(scene.personU)} />
          <Arrow a={[960, 440]} b={[cx + 80, cy - 10]} u={v(scene.mutualU)} color={ACCENT} width={3} />
          <Arrow a={[cx + 80, cy + 18]} b={[960, 468]} u={v(scene.mutualU)} color={ACCENT} width={3} />
        </g>

        {/* ================= the order, as two arrows ================= */}
        <g opacity={fade}>
          <Arrow a={[WILD.x - 60, 612]} b={[CALM_X + 70, 612]} u={v(scene.domArrow)} color={ACCENT} width={12} head={20} />
          <Arrow a={[CALM_X + 150, WILD.y]} b={[CALM_X + 150, WILD.y - CLIMB]} u={v(scene.breedArrow)} color={colors.WARM} width={4} head={14} />
          <Label x={WILD.x - 74} y={618} text="domestication · wide · first" size={17} color={colors.TEXT} anchor="end" weight={650} u={v(scene.tagsU)} />
          <g opacity={v(scene.tagsU)}>
            <rect x={CALM_X + 170} y={196} width={150} height={56} rx={10} fill={colors.BG} />
            <Label x={CALM_X + 178} y={218} text="breeding" size={17} color={colors.WARM} weight={650} />
            <Label x={CALM_X + 178} y={241} text="narrow · after" size={16} color={colors.TEXT} />
          </g>
        </g>

        {/* ================= quote cards (opaque) ================= */}
        <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} u={v(scene.card1)} accent={colors.WARM}>
          <Label x={CARD.x + 26} y={CARD.y + 42} text="methodical selection" size={22} weight={700} color={colors.WARM} />
          <Label x={CARD.x + 26} y={CARD.y + 84} text="“with a distinct object" size={20} italic />
          <Label x={CARD.x + 26} y={CARD.y + 112} text="in view, to make a new" size={20} italic />
          <Label x={CARD.x + 26} y={CARD.y + 140} text="strain or sub-breed”" size={20} italic />
          <Label x={CARD.x + 26} y={CARD.y + 196} text="Darwin, On the Origin of Species, 1859" size={14} color={colors.MUTED} />
        </Card>
        <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} u={v(scene.card2)} accent={ACCENT}>
          <Label x={CARD.x + 26} y={CARD.y + 42} text="unconscious selection" size={22} weight={700} color={ACCENT} />
          <Label x={CARD.x + 26} y={CARD.y + 84} text="“every one trying to possess" size={19} italic />
          <Label x={CARD.x + 26} y={CARD.y + 112} text="and breed from the best" size={19} italic />
          <Label x={CARD.x + 26} y={CARD.y + 140} text="individual animals”" size={19} italic />
          <Label x={CARD.x + 26} y={CARD.y + 196} text="Darwin, On the Origin of Species, 1859" size={14} color={colors.MUTED} />
        </Card>
        <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} u={v(scene.card3)} accent={ACCENT}>
          <Label x={CARD.x + 26} y={CARD.y + 42} text="domestication is" size={22} weight={700} color={ACCENT} />
          <Label x={CARD.x + 26} y={CARD.y + 84} text="“a distinctive coevolutionary," size={19} italic />
          <Label x={CARD.x + 26} y={CARD.y + 112} text="mutualistic relationship”" size={19} italic />
          <Label x={CARD.x + 26} y={CARD.y + 140} text="between domesticator and domesticate" size={15} color={colors.TEXT} />
          <Label x={CARD.x + 26} y={CARD.y + 196} text="Zeder, PNAS, 2015" size={14} color={colors.MUTED} />
        </Card>
        <Card x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} u={v(scene.card4)} accent={colors.MUTED}>
          <Label x={CARD.x + 26} y={CARD.y + 42} text="still open" size={22} weight={700} color={colors.TEXT} />
          <Label x={CARD.x + 26} y={CARD.y + 84} text="when did it begin?" size={19} color={colors.TEXT} />
          <Label x={CARD.x + 26} y={CARD.y + 112} text="once, or many times?" size={19} color={colors.TEXT} />
          <Label x={CARD.x + 26} y={CARD.y + 150} text="1,375 dogs · 35 breeds · 19 wolves" size={15} color={colors.MUTED} mono />
          <Label x={CARD.x + 26} y={CARD.y + 196} text="Larson et al., PNAS, 2012" size={14} color={colors.MUTED} />
        </Card>

        {/* ================= closing card (opaque) ================= */}
        {v(scene.closeU) > 0.01 && (
          <g opacity={v(scene.closeU)}>
            <rect x={250} y={200} width={780} height={250} rx={18} fill={colors.BG} />
            <rect x={250} y={200} width={780} height={250} rx={18} fill={colors.PANEL} stroke={ACCENT} strokeOpacity={0.6} strokeWidth={1.6} />
            <Arrow a={[320, 300]} b={[620, 300]} color={ACCENT} width={14} head={22} />
            <Label x={320} y={268} text="domestication" size={22} color={ACCENT} weight={700} />
            <Label x={320} y={344} text="able to live with people · first" size={18} color={colors.TEXT} />
            <Arrow a={[800, 360]} b={[800, 250]} color={colors.WARM} width={4} head={14} />
            <Label x={830} y={268} text="breeding" size={22} color={colors.WARM} weight={700} />
            <Label x={830} y={300} text="good at a job" size={18} color={colors.TEXT} />
            <Label x={830} y={326} text="after" size={18} color={colors.TEXT} />
            <Label x={640} y={412} text="Next: a fox farm that selected for one trait, and got many." size={19} color={colors.MUTED} anchor="middle" />
          </g>
        )}
      </Camera>

      <Chips items={CHIP_TEXT} k={v(scene.chipK)} on={v(scene.chipOn)} />
    </>
  );
}

export const vizScene = () => scene;
