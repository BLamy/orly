// The Fox Farm
//
// Wolf, Dog, Model — chapter 2. D3/SVG scene authored by Claude Opus 5.5. Requested model `claude-opus-5-5`; actual:
// `claude-opus-5-5` (the model id in this session's system context). Planned by Claude Opus 5.5 by user override of the
// Astra-planning default, in .orly-work/visual-plan.md (chapter 2). The twelve captions are the plan's fixed narration.
//
// Sources:
//   Kukekova lab, "History of the Fox Domestication Project" (1959, Novosibirsk, 130 founders, 18% at generation 10)
//     https://publish.illinois.edu/kukekova-lab/?p=8
//   Dugatkin, "The silver fox domestication experiment", Evolution: Education and Outreach 11:16 (2018)
//     https://evolution-outreach.biomedcentral.com/articles/10.1186/s12052-018-0090-x
//   Lord, Larson, Coppinger & Karlsson, Trends in Ecology & Evolution 35(2), 2020, and the replies reported in
//     Science News (Trut, Wilkins, Dugatkin): https://www.sciencenews.org/?p=3000734
//   Hare et al., "Social cognitive evolution in captive foxes…", Current Biology 15(3), 2005
//
// Schematic versus sourced:
//   - The fox silhouette is a drawing whose features morph at the times the sources give (ears and tail "in less than a
//     decade"; stress hormones by generation 15). Its proportions are not measurements.
//   - The tameness gate (top 10%) and the minority → majority strip are schematic populations. The one number on the
//     strip, 18% extremely tame at generation 10, is the Kukekova lab's figure.
//   - The contest card states both sides; the book takes no verdict on domestication syndrome.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import type { ReactNode } from 'react';
import { ACCENT, Canid, Card, Chips, Label, Meter, Person, clamp01, lerp, mixPose, timing } from './shared/kit';
import type { CanidPose } from './shared/kit';

// ---------------------------------------------------------------------------
// Fixed narration
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'In nineteen fifty-nine, at the Institute of Cytology and Genetics in Novosibirsk, Dmitry Belyaev began an experiment with silver foxes.',
  'The rule was strict. Each generation, foxes were scored for tameness, and only the tamest, about the top ten percent, became parents. Tameness was the sole criterion.',
  'Within six generations, some foxes licked the experimenters’ hands, wagged their tails when people approached, and whined when they left.',
  'Then came traits nobody had selected for. In under ten years, some of the foxes had floppy ears and curly tails.',
  'By generation fifteen, their stress hormone levels were about half those of wild foxes, and over the generations their adrenal glands grew smaller.',
  'They also showed mottled, mutt-like coats, shorter and rounder snouts, and longer breeding seasons than their wild relatives.',
  'Early on, the tamest foxes were a small minority. One lab’s history reports eighteen percent extremely tame by the tenth generation. Today they are the vast majority.',
  'That bundle of side effects is called the domestication syndrome. Belyaev’s lesson was that you cannot select for just one trait.',
  'But the story is contested. A twenty twenty review traced the founding foxes to fur farms on Prince Edward Island in Canada, where breeding went back to at least the eighteen eighties.',
  'Those authors point to nineteen twenties photographs of tame-looking, spotted farm foxes, and argue the syndrome has no standard definition. Lyudmila Trut and other researchers reject that reading.',
  'One more by-product is worth knowing. Kits from the tame line were as skilled as dog puppies at using human gestures, though nobody bred them for it.',
  'Whatever the final verdict on the syndrome, the fox farm leaves a working rule: choose for one thing, and you get a package.',
];
const { T, DUR } = timing(CAPTIONS);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const SILVER = '#8b93a3';
const FOX_AT = { x: 330, y: 300 };
const WILD_FOX: CanidPose = { ear: 0, tail: 0.05, snout: 0, spots: 0 };
const EARS_TAIL: CanidPose = { ear: 0.9, tail: 0.95, snout: 0, spots: 0 };
const FULL: CanidPose = { ear: 0.9, tail: 0.95, snout: 0.75, spots: 0.85 };

const ROWS = [
  { title: 'tame behaviour', when: 'within 6 generations', note: 'licks hands · wags · whines when people leave' },
  { title: 'floppy ears · curly tails', when: 'in less than a decade', note: 'some foxes, not selected for' },
  { title: 'stress hormones ≈ ½ of wild', when: 'by generation 15', note: 'glucocorticoids; adrenal glands smaller' },
  { title: 'mottled coats · rounder snouts', when: 'over the experiment', note: 'and longer breeding seasons' },
];
const RX = 660;
const RY0 = 150;
const RH = 86;

// the tameness gate: 20 foxes sorted by score, the top 10% (2) become parents
const GATE_N = 20;
// the population strip: 40 foxes; tame share rises from a minority to the vast majority
const STRIP_N = 40;

const CHIP_TEXT = ['Novosibirsk, 1959', 'reported: Dugatkin 2018', 'Kukekova lab · schematic strip', 'contested: Lord et al. 2020 and replies', 'Hare et al. 2005', 'the working rule'];

const CAM_FOX: CameraState = { x: 420, y: 330, k: 1.12 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chipOn = tl.channel('chipOn', 0);
  const chipK = tl.channel('chipK', 0);

  const foxU = tl.channel('foxU', 0);
  const genU = tl.channel('genU', 0); // generation counter, 0..20
  const morphA = tl.channel('morphA', 0); // wild → ears and tail
  const morphB = tl.channel('morphB', 0); // → coat and snout
  const gateU = tl.channel('gateU', 0);
  const gatePick = tl.channel('gatePick', 0);
  const rows = [0, 1, 2, 3].map((i) => tl.channel(`row${i}`, 0));
  const hormone = tl.channel('hormone', 1); // relative to wild
  const stripU = tl.channel('stripU', 0);
  const tameShare = tl.channel('tameShare', 0.04);
  const bracketU = tl.channel('bracketU', 0);
  const contestU = tl.channel('contestU', 0);
  const contestB = tl.channel('contestB', 0);
  const photoU = tl.channel('photoU', 0);
  const kitU = tl.channel('kitU', 0);
  const pointU = tl.channel('pointU', 0);
  const kitWalk = tl.channel('kitWalk', 0);
  const listOut = tl.channel('listOut', 0); // the trait list leaves for the kit scene
  const dimAll = tl.channel('dimAll', 0);
  const closeU = tl.channel('closeU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: T[i], dur: i < CAPTIONS.length - 1 ? T[i + 1] - T[i] : DUR[i], text }));

  // — C0 · a silver fox, Novosibirsk, 1959 —
  let t = T[0];
  tl.tween(chipOn, 1, { at: t, dur: 0.6, ease: ease.enter });
  tl.tween(foxU, 1, { at: t + 0.3, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_FOX, { at: t + 0.6, dur: 2.4, ease: ease.move });
  tl.hold(t + 3.0, 1.0);

  // — C1 · the gate: only the tamest tenth becomes parents —
  t = T[1];
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(gateU, 1, { at: t + 0.6, dur: 1.0, ease: ease.enter });
  tl.tween(gatePick, 1, { at: t + 3.4, dur: 1.4, ease: ease.move });
  tl.tween(genU, 2, { at: t + 5.0, dur: 2.0, ease: ease.linear });
  tl.hold(t + 7.0, 0.8);

  // — C2 · by generation six: tame behaviour —
  t = T[2];
  tl.tween(chipK, 1, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(genU, 6, { at: t, dur: 2.2, ease: ease.linear });
  tl.tween(rows[0], 1, { at: t + 1.6, dur: 0.7, ease: ease.enter });
  tl.hold(t + 2.4, 1.0);

  // — C3 · in less than a decade: ears and tails —
  t = T[3];
  tl.tween(genU, 9, { at: t, dur: 1.8, ease: ease.linear });
  tl.tween(morphA, 1, { at: t + 1.8, dur: 2.0, ease: ease.move });
  tl.tween(rows[1], 1, { at: t + 2.2, dur: 0.7, ease: ease.enter });
  tl.hold(t + 3.8, 1.0);

  // — C4 · by generation fifteen: stress hormones halve —
  t = T[4];
  tl.tween(genU, 15, { at: t, dur: 2.2, ease: ease.linear });
  tl.tween(rows[2], 1, { at: t + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(hormone, 0.5, { at: t + 1.2, dur: 2.0, ease: ease.move });
  tl.hold(t + 3.2, 1.0);

  // — C5 · coats and snouts —
  t = T[5];
  tl.tween(genU, 20, { at: t, dur: 2.0, ease: ease.linear });
  tl.tween(morphB, 1, { at: t + 0.6, dur: 2.2, ease: ease.move });
  tl.tween(rows[3], 1, { at: t + 1.2, dur: 0.7, ease: ease.enter });
  tl.hold(t + 2.8, 1.0);

  // — C6 · a minority becomes the majority —
  t = T[6];
  tl.tween(chipK, 2, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(gateU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(stripU, 1, { at: t + 0.4, dur: 0.9, ease: ease.enter });
  tl.tween(tameShare, 0.18, { at: t + 2.0, dur: 1.6, ease: ease.move });
  tl.tween(tameShare, 0.85, { at: t + DUR[6] - 3.0, dur: 2.2, ease: ease.move });
  tl.hold(t + DUR[6] - 0.8, 0.6);

  // — C7 · the package has a name —
  t = T[7];
  tl.tween(bracketU, 1, { at: t + 0.4, dur: 1.2, ease: ease.draw });
  tl.hold(t + 1.6, 1.0);

  // — C8 · contested: where the founders came from —
  t = T[8];
  tl.tween(chipK, 3, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(stripU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(contestU, 1, { at: t + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(photoU, 1, { at: t + 1.6, dur: 0.8, ease: ease.enter });
  tl.hold(t + 2.4, 1.0);

  // — C9 · both sides —
  t = T[9];
  tl.tween(contestB, 1, { at: t + DUR[9] - 4.2, dur: 0.9, ease: ease.enter });
  tl.hold(t + DUR[9] - 3.2, 1.0);

  // — C10 · tame kits read human gestures —
  t = T[10];
  tl.tween(chipK, 4, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(contestU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(contestB, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(photoU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(listOut, 1, { at: t, dur: 0.7, ease: ease.move });
  tl.tween(kitU, 1, { at: t + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(pointU, 1, { at: t + 1.8, dur: 0.9, ease: ease.draw });
  tl.tween(kitWalk, 1, { at: t + 3.0, dur: 1.8, ease: ease.move });
  tl.hold(t + 4.8, 1.0);

  // — C11 · the working rule: one choice, a package —
  t = T[11];
  tl.tween(chipK, 5, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(dimAll, 1, { at: t, dur: 0.9, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(chipOn, 0, { at: t + DUR[11] - 1.2, dur: 0.6, ease: ease.move });
  tl.hold(T[11] + DUR[11], 0.6);

  return {
    tl, cam, chipOn, chipK, foxU, genU, morphA, morphB, gateU, gatePick, rows, hormone, stripU, tameShare, bracketU,
    contestU, contestB, photoU, kitU, pointU, kitWalk, listOut, dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local components
// ---------------------------------------------------------------------------

function TraitRow({ i, u, extra }: { i: number; u: number; extra?: ReactNode }) {
  if (u <= 0.005) return null;
  const r = ROWS[i];
  const y = RY0 + i * RH;
  return (
    <g opacity={u} transform={`translate(${(1 - u) * 24},0)`}>
      <circle cx={RX} cy={y + 2} r={7} fill={colors.WARM} />
      <Label x={RX + 22} y={y + 8} text={r.title} size={21} weight={650} />
      <Label x={RX + 22} y={y + 34} text={`${r.when} · ${r.note}`} size={15} color={colors.MUTED} />
      {extra}
    </g>
  );
}

/** a small fox token for the gate and the strip */
function Token({ x, y, tame, u = 1, r = 8 }: { x: number; y: number; tame: number; u?: number; r?: number }) {
  if (u <= 0.005) return null;
  return (
    <g opacity={u}>
      <circle cx={x} cy={y} r={r} fill={tame > 0.5 ? colors.WARM : SILVER} />
      <polygon points={`${x - r * 0.7},${y - r * 0.6} ${x - r * 0.3},${y - r * 1.5} ${x},${y - r * 0.8}`} fill={tame > 0.5 ? colors.WARM : SILVER} />
      <polygon points={`${x + r * 0.7},${y - r * 0.6} ${x + r * 0.3},${y - r * 1.5} ${x},${y - r * 0.8}`} fill={tame > 0.5 ? colors.WARM : SILVER} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (c: Parameters<typeof s.get>[0]) => s.get(c) as number;
  const gen = v(scene.genU);
  const morphA = v(scene.morphA);
  const morphB = v(scene.morphB);
  const pose = mixPose(mixPose(WILD_FOX, EARS_TAIL, morphA), FULL, morphB);
  const dimAll = v(scene.dimAll);
  const fade = 1 - 0.88 * dimAll;
  const gateU = v(scene.gateU);
  const gatePick = v(scene.gatePick);
  const stripU = v(scene.stripU);
  const share = v(scene.tameShare);
  const bracketU = v(scene.bracketU);
  const kitU = v(scene.kitU);
  const kitWalk = v(scene.kitWalk);
  const contestU = v(scene.contestU);
  const contestB = v(scene.contestB);
  const photoU = v(scene.photoU);

  // the fox steps back to make room for the kit scene
  const foxX = lerp(FOX_AT.x, 250, kitU);
  const foxS = lerp(1.5, 1.05, kitU);

  return (
    <>
      <Camera {...s.get(scene.cam)}>
        <g opacity={fade}>
          {/* ================= the fox and its generation counter ================= */}
          <Canid x={foxX} y={FOX_AT.y} s={foxS} pose={pose} color={SILVER} opacity={v(scene.foxU) * (1 - 0.75 * kitU)} />
          <g opacity={v(scene.foxU) * (1 - kitU)}>
            <Label x={FOX_AT.x} y={130} text={`generation ${Math.round(gen)}`} size={26} anchor="middle" weight={700} mono color={colors.TEXT} />
            <rect x={FOX_AT.x - 150} y={146} width={300} height={8} rx={4} fill={colors.GRID} />
            <rect x={FOX_AT.x - 150} y={146} width={300 * clamp01(gen / 20)} height={8} rx={4} fill={ACCENT} />
          </g>

          {/* ================= the tameness gate ================= */}
          {gateU > 0.01 && (
            <g opacity={gateU}>
              <Label x={110} y={470} text="tameness score →" size={15} color={colors.MUTED} />
              {Array.from({ length: GATE_N }, (_, i) => {
                const top = i >= GATE_N - 2;
                const x = 110 + i * 24;
                const y = 510 - (top ? 70 * gatePick : 0);
                return <Token key={i} x={x} y={y} tame={top && gatePick > 0.5 ? 1 : 0} u={top ? 1 : lerp(1, 0.25, gatePick)} />;
              })}
              <rect x={110 + (GATE_N - 2) * 24 - 16} y={490} width={58} height={40} rx={8} fill="none" stroke={colors.WARM} strokeWidth={2} strokeDasharray="5 4" />
              <Label x={110 + (GATE_N - 1) * 24 + 4} y={556} text="top ~10% → parents" size={15} color={colors.WARM} weight={650} anchor="end" u={gatePick} />
            </g>
          )}

          {/* ================= trait rows ================= */}
          <g opacity={(1 - v(scene.listOut)) * (1 - contestU)}>
          <TraitRow i={0} u={v(scene.rows[0])} />
          <TraitRow i={1} u={v(scene.rows[1])} />
          <TraitRow
            i={2}
            u={v(scene.rows[2])}
            extra={<Meter x={RX + 22} y={RY0 + 2 * RH + 46} w={260} value={v(scene.hormone)} color={colors.NEGATIVE} valueText={v(scene.hormone) < 0.99 ? `${Math.round(v(scene.hormone) * 100)}% of wild` : 'wild level'} />}
          />
          <TraitRow i={3} u={v(scene.rows[3])} />
          {bracketU > 0.01 && (
            <g opacity={bracketU}>
              <path d={`M${RX - 22},${RY0 - 14} L${RX - 34},${RY0 - 14} L${RX - 34},${RY0 + 3 * RH + 44} L${RX - 22},${RY0 + 3 * RH + 44}`} fill="none" stroke={ACCENT} strokeWidth={3} strokeDasharray={`${900 * bracketU} 900`} />
              <rect x={RX + 10} y={RY0 + 4 * RH - 6} width={320} height={40} rx={10} fill={ACCENT} fillOpacity={0.18} stroke={ACCENT} />
              <Label x={RX + 170} y={RY0 + 4 * RH + 21} text="the domestication syndrome" size={19} weight={700} anchor="middle" color={colors.TEXT} />
            </g>
          )}

          </g>
          {/* ================= minority → majority strip ================= */}
          {stripU > 0.01 && (
            <g opacity={stripU}>
              <Label x={90} y={480} text="share of the population that is very tame" size={15} color={colors.MUTED} />
              {Array.from({ length: STRIP_N }, (_, i) => {
                const col = i % 20;
                const row = Math.floor(i / 20);
                const tame = (i + 0.5) / STRIP_N < share ? 1 : 0;
                return <Token key={i} x={98 + col * 24} y={512 + row * 30} tame={tame} r={7} />;
              })}
              <Label x={590} y={530} text={share < 0.3 ? `${Math.round(share * 100)}%` : 'vast majority'} size={18} weight={700} color={colors.WARM} />
              <Label x={90} y={585} text="18% at generation 10 (Kukekova lab); later shares drawn schematically" size={13} color={colors.MUTED} />
            </g>
          )}

          {/* ================= the fox kit and the pointing test ================= */}
          {kitU > 0.01 && (
            <g opacity={kitU} transform="translate(785,505) scale(1.3) translate(-785,-515)">
              <Person x={980} y={540} s={1.1} />
              {/* pointing arm */}
              <line x1={958} y1={452} x2={lerp(958, 860, v(scene.pointU))} y2={lerp(452, 500, v(scene.pointU))} stroke="#e2e8f0" strokeWidth={8} strokeLinecap="round" />
              {/* two cups */}
              <path d="M720,560 L760,560 L752,520 L728,520 Z" fill="#64748b" stroke="#94a3b8" strokeWidth={1.5} />
              <path d="M820,560 L860,560 L852,520 L828,520 Z" fill="#64748b" stroke={colors.WARM} strokeWidth={1.5 + v(scene.pointU) * 2} />
              <Canid x={lerp(560, 760, kitWalk)} y={525} s={0.36} pose={FULL} color={SILVER} />
              <Label x={760} y={400} text="tame kits ≈ dog puppies at following gestures" size={17} anchor="middle" color={colors.TEXT} weight={650} />
              <Label x={760} y={424} text="kits from the unselected control line did worse" size={14} anchor="middle" color={colors.MUTED} />
            </g>
          )}
        </g>

        {/* ================= the contest card (opaque) ================= */}
        <Card x={520} y={120} w={720} h={410} u={contestU} accent={colors.NEGATIVE}>
          <Label x={548} y={160} text="contested" size={24} weight={700} color={colors.NEGATIVE} />
          <Label x={548} y={200} text="Lord, Larson, Coppinger & Karlsson, 2020" size={17} weight={650} />
          <Label x={548} y={232} text="· founders came from Prince Edward Island fur farms" size={16} />
          <Label x={548} y={258} text="· selective breeding there since at least the 1880s" size={16} />
          <Label x={548} y={284} text="· 1920s photos: tame-looking, spotted foxes" size={16} />
          <Label x={548} y={310} text="· the syndrome has no standard definition" size={16} />
          <g opacity={contestB}>
            <line x1={548} y1={336} x2={1212} y2={336} stroke={colors.GRID} />
            <Label x={548} y={370} text="replies" size={17} weight={650} />
            <Label x={548} y={402} text="· Trut: spots “arose only under selection for tameness”" size={16} />
            <Label x={548} y={428} text="· Wilkins: the review “misrepresents domestication syndrome”" size={16} />
            <Label x={548} y={454} text="· Dugatkin: hidden variation “extraordinarily unlikely”" size={16} />
            <Label x={548} y={500} text="as reported by Science News; this book takes no verdict" size={14} color={colors.MUTED} />
          </g>
        </Card>
        {photoU > 0.01 && (
          <g opacity={photoU * (1 - dimAll)}>
            <rect x={90} y={420} width={300} height={170} rx={4} fill="#3b3024" stroke="#d6c3a1" strokeWidth={6} />
            <Canid x={232} y={500} s={0.6} pose={{ ear: 0.1, tail: 0.15, snout: 0.15, spots: 0.7 }} color="#a39074" />
            <Label x={240} y={612} text="a 1920s farm fox, as the review describes (drawn)" size={13} color={colors.MUTED} anchor="middle" />
          </g>
        )}

        {/* ================= closing card (opaque) ================= */}
        {v(scene.closeU) > 0.01 && (
          <g opacity={v(scene.closeU)}>
            <rect x={200} y={170} width={880} height={300} rx={18} fill={colors.BG} />
            <rect x={200} y={170} width={880} height={300} rx={18} fill={colors.PANEL} stroke={ACCENT} strokeOpacity={0.6} strokeWidth={1.6} />
            <Canid x={360} y={320} s={0.9} pose={FULL} color={SILVER} />
            <Label x={520} y={240} text="chose" size={18} color={colors.MUTED} />
            <Label x={520} y={274} text="tameness, and only tameness" size={24} weight={700} color={colors.WARM} />
            <Label x={520} y={326} text="got" size={18} color={colors.MUTED} />
            <Label x={520} y={360} text="ears · tails · coats · snouts" size={21} />
            <Label x={520} y={390} text="hormones · breeding season" size={21} />
            <Label x={520} y={420} text="and a knack for reading people" size={21} color={ACCENT} weight={650} />
          </g>
        )}
      </Camera>

      <Chips items={CHIP_TEXT} k={v(scene.chipK)} on={v(scene.chipOn)} />
    </>
  );
}

export const vizScene = () => scene;
