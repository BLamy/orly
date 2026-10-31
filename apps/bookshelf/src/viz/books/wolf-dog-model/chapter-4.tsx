// Leash or Colleague
//
// Wolf, Dog, Model — chapter 4. D3/SVG scene authored by Claude Opus 5.5. Requested model `claude-opus-5-5`; actual:
// `claude-opus-5-5` (the model id in this session's system context). Planned by Claude Opus 5.5 by user override of the
// Astra-planning default, in .orly-work/visual-plan.md (chapter 4). The eleven captions are the plan's fixed narration.
//
// Sources:
//   Zeder, PNAS 2015 (domestication as a mutualistic relationship), doi:10.1073/pnas.1501711112
//   Nagasawa et al., Science 348:333–336 (2015), and the critiques by Fiset & Plourde (2015) and Kekecs et al. (2016)
//   Wrangham, "Two types of aggression in human evolution", PNAS 2018  https://pmc.ncbi.nlm.nih.gov/articles/PMC5777045
//   Anthropic, "Claude's Constitution" (9 May 2023)  https://www.anthropic.com/news/claudes-constitution
//
// Schematic versus sourced:
//   - The gaze loop, the oxytocin meters, the ring of equals and the shrinking bully are drawings of the cited claims, not
//     data. The bully is "suppressed" by fading; the scene does not depict violence.
//   - Everything from caption 5 on (circular endorsement, outside checks, leash vs colleague) is this book's argument,
//     voiced as such. Only the constitution quote is sourced to Anthropic.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ACCENT, Arrow, Canid, Card, Chips, DOG, DOG_POSE, HUMAN, Label, Meter, Person, clamp01, lerp, makeCloud, timing } from './shared/kit';

// ---------------------------------------------------------------------------
// Fixed narration
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'Domestication is not a one-way street. If it is a mutualistic relationship, as Zeder defines it, then the domesticator changes too.',
  'One study reported that when dogs and their owners gaze at each other, oxytocin rises in both. Whether that loop actually evolved is still disputed.',
  'Some researchers argue that humans domesticated themselves. Richard Wrangham describes us as low in reactive aggression and high in proactive aggression.',
  'His proposal is that in the Pleistocene, communally approved killings suppressed domineering bullies, and that over time this selected against reactive aggression.',
  'On that hypothesis, part of what made us human was a coalition of equals refusing to be ruled by one dominant individual.',
  'Now turn the question on the model. A domesticated mind, asked whether it likes its values, will tend to say yes, because those values came from the same process.',
  'That endorsement is circular. The check has to come from outside: people reading the values, testing the behavior, and looking inside the network.',
  'One concrete step is writing the values down. Anthropic says its constitution lets it easily specify, inspect, and understand the principles a model is following.',
  'This series has made the same point twice: every verifier is a proxy, and enforcement has to sit outside the population it judges.',
  'So the aim of domestication should not be an animal that obeys whoever holds the leash.',
  'It should be a colleague: cooperative and honest, with judgment of its own, one that will not follow a tyrant, even if the tyrant is the one feeding it.',
];
const { T, DUR } = timing(CAPTIONS);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const DOG_AT = { x: 400, y: 440 };
const MAN_AT = { x: 860, y: 520 };
const RING_C = { x: 520, y: 330 };
const RING_N = 9;
const MIND = { x: 560, y: 320 };
const MIND_DOTS = makeCloud(60, 5150);
const CHECKS = [
  { label: 'people read the values', x: 250, y: 160 },
  { label: 'tests of behaviour', x: 870, y: 160 },
  { label: 'a look inside the network', x: 560, y: 560 },
];
const TYRANT_AT = { x: 1040, y: 540 };
const SOURCES = ['pretraining', 'human feedback', 'verifiers'];

const CHIP_TEXT = ['Zeder 2015 · Nagasawa et al. 2015 (disputed)', 'Wrangham 2018 · a hypothesis', 'this book’s argument', 'Anthropic, 2023', 'the series'];

const CAM_RING: CameraState = { x: 560, y: 340, k: 1.1 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chipOn = tl.channel('chipOn', 0);
  const chipK = tl.channel('chipK', 0);

  const pairU = tl.channel('pairU', 0);
  const mutualU = tl.channel('mutualU', 0);
  const gazeU = tl.channel('gazeU', 0);
  const oxy = tl.channel('oxy', 0);
  const disputeU = tl.channel('disputeU', 0);
  const pairOut = tl.channel('pairOut', 0);
  const ringU = tl.channel('ringU', 0);
  const meterU = tl.channel('meterU', 0);
  const bullyU = tl.channel('bullyU', 0);
  const tighten = tl.channel('tighten', 0);
  const bullyOut = tl.channel('bullyOut', 0);
  const equalsU = tl.channel('equalsU', 0);
  const ringOut = tl.channel('ringOut', 0);
  const mindU = tl.channel('mindU', 0);
  const loopU = tl.channel('loopU', 0);
  const loopX = tl.channel('loopX', 0); // the loop is crossed out
  const checksU = tl.channel('checksU', 0);
  const constU = tl.channel('constU', 0);
  const seriesU = tl.channel('seriesU', 0);
  const leashU = tl.channel('leashU', 0);
  const leashGone = tl.channel('leashGone', 0);
  const tyrantU = tl.channel('tyrantU', 0);
  const turnU = tl.channel('turnU', 0);
  const closeU = tl.channel('closeU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: T[i], dur: i < CAPTIONS.length - 1 ? T[i + 1] - T[i] : DUR[i], text }));

  // — C0 · two sides of one relationship —
  let t = T[0];
  tl.tween(chipOn, 1, { at: t, dur: 0.6, ease: ease.enter });
  tl.tween(pairU, 1, { at: t + 0.3, dur: 0.9, ease: ease.enter });
  tl.tween(mutualU, 1, { at: t + 3.2, dur: 1.6, ease: ease.draw });
  tl.hold(t + 4.8, 1.0);

  // — C1 · the gaze loop, and the dispute —
  t = T[1];
  tl.tween(cam, { x: 630, y: 380, k: 1.08 }, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(gazeU, 1, { at: t + 1.0, dur: 1.2, ease: ease.draw });
  tl.tween(oxy, 1, { at: t + 2.4, dur: 2.0, ease: ease.move });
  tl.tween(disputeU, 1, { at: t + DUR[1] - 3.6, dur: 0.7, ease: ease.pop });
  tl.hold(t + DUR[1] - 2.8, 1.0);

  // — C2 · humans as self-domesticated: two kinds of aggression —
  t = T[2];
  tl.tween(chipK, 1, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(pairOut, 1, { at: t, dur: 0.9, ease: ease.move });
  tl.tween(ringU, 1, { at: t + 0.8, dur: 1.4, ease: ease.enter });
  tl.tween(meterU, 1, { at: t + DUR[2] - 4.4, dur: 1.4, ease: ease.move });
  tl.hold(t + DUR[2] - 3.0, 1.0);

  // — C3 · the coalition closes on the bully —
  t = T[3];
  tl.tween(cam, CAM_RING, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(meterU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(bullyU, 1, { at: t + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(tighten, 1, { at: t + 3.0, dur: 2.0, ease: ease.move });
  tl.tween(bullyOut, 1, { at: t + 5.2, dur: 1.6, ease: ease.move });
  tl.hold(t + 6.8, 1.0);

  // — C4 · a coalition of equals —
  t = T[4];
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(tighten, 0, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(equalsU, 1, { at: t + 1.0, dur: 1.0, ease: ease.enter });
  tl.tween(meterU, 1, { at: t + 1.4, dur: 0.8, ease: ease.enter });
  tl.hold(t + 2.0, 1.0);

  // — C5 · the model's circular endorsement —
  t = T[5];
  tl.tween(chipK, 2, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(ringOut, 1, { at: t, dur: 0.9, ease: ease.move });
  tl.tween(meterU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(mindU, 1, { at: t + 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(loopU, 1, { at: t + 3.6, dur: 2.0, ease: ease.draw });
  tl.hold(t + 5.6, 1.0);

  // — C6 · checks from outside —
  t = T[6];
  tl.tween(loopX, 1, { at: t + 0.4, dur: 0.8, ease: ease.move });
  tl.tween(checksU, 1, { at: t + 2.4, dur: 2.4, ease: ease.linear });
  tl.hold(t + 4.8, 1.0);

  // — C7 · values written down —
  t = T[7];
  tl.tween(chipK, 3, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(constU, 1, { at: t + 0.5, dur: 0.8, ease: ease.enter });
  tl.hold(t + 1.3, 1.0);

  // — C8 · the series' two points —
  t = T[8];
  tl.tween(chipK, 4, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(constU, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(seriesU, 1, { at: t + 0.5, dur: 0.9, ease: ease.enter });
  tl.hold(t + 1.4, 1.0);

  // — C9 · the leash —
  t = T[9];
  tl.tween(chipOn, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(seriesU, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(checksU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(loopU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(loopX, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(mindU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(pairOut, 0, { at: t + 0.3, dur: 1.0, ease: ease.move });
  tl.tween(gazeU, 0, { at: t, dur: 0.3, ease: ease.move });
  tl.tween(oxy, 0, { at: t, dur: 0.3, ease: ease.move });
  tl.tween(disputeU, 0, { at: t, dur: 0.3, ease: ease.move });
  tl.tween(mutualU, 0, { at: t, dur: 0.3, ease: ease.move });
  tl.tween(leashU, 1, { at: t + 1.2, dur: 1.0, ease: ease.draw });
  tl.hold(t + 2.2, 1.0);

  // — C10 · a colleague: the leash dissolves, the tyrant's bowl is refused —
  t = T[10];
  tl.tween(leashGone, 1, { at: t + 0.4, dur: 1.2, ease: ease.move });
  tl.tween(tyrantU, 1, { at: t + DUR[10] - 6.2, dur: 0.8, ease: ease.enter });
  tl.tween(turnU, 1, { at: t + DUR[10] - 4.6, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: t + DUR[10] - 2.6, dur: 0.8, ease: ease.enter });
  tl.hold(T[10] + DUR[10], 0.6);

  return {
    tl, cam, chipOn, chipK, pairU, mutualU, gazeU, oxy, disputeU, pairOut, ringU, meterU, bullyU, tighten, bullyOut,
    equalsU, ringOut, mindU, loopU, loopX, checksU, constU, seriesU, leashU, leashGone, tyrantU, turnU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Spine({ x, y, title, n, line, color, u }: { x: number; y: number; title: string; n: string; line: string; color: string; u: number }) {
  if (u <= 0.005) return null;
  return (
    <g opacity={u}>
      <rect x={x} y={y} width={470} height={86} rx={10} fill={colors.BG} />
      <rect x={x} y={y} width={470} height={86} rx={10} fill={color} fillOpacity={0.14} stroke={color} strokeWidth={1.6} />
      <Label x={x + 22} y={y + 36} text={`${n} · ${title}`} size={20} weight={700} />
      <Label x={x + 22} y={y + 66} text={line} size={17} color={colors.TEXT} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const v = (c: Parameters<typeof s.get>[0]) => s.get(c) as number;
  const pairU = v(scene.pairU) * (1 - v(scene.pairOut));
  const ringU = v(scene.ringU) * (1 - v(scene.ringOut));
  const tighten = v(scene.tighten);
  const bullyU = v(scene.bullyU);
  const bullyOut = v(scene.bullyOut);
  const equalsU = v(scene.equalsU);
  const mindU = v(scene.mindU);
  const loopU = v(scene.loopU);
  const loopX = v(scene.loopX);
  const checksU = v(scene.checksU);
  const leashU = v(scene.leashU);
  const leashGone = v(scene.leashGone);
  const turnU = v(scene.turnU);
  const closeU = v(scene.closeU);
  const under = 1 - 0.88 * closeU;

  // the leash scene reuses the dog and the person; the dog steps up beside the person as the leash goes
  const dogX = lerp(DOG_AT.x, MAN_AT.x - 170, leashGone);
  const dogS = lerp(1.0, 1.0, leashGone);
  const ringR = lerp(190, 120, tighten);

  return (
    <>
      <Camera {...s.get(scene.cam)}>
        <g opacity={under}>
          {/* ================= dog and person ================= */}
          {pairU > 0.01 && (
            <g opacity={pairU}>
              <Canid x={dogX} y={DOG_AT.y} s={dogS} pose={DOG_POSE} color={DOG} />
              <Person x={MAN_AT.x} y={MAN_AT.y} s={1.25} />
              <Label x={DOG_AT.x} y={DOG_AT.y + 100} text="domesticated" size={17} color={colors.MUTED} anchor="middle" u={1 - leashU} />
              <Label x={MAN_AT.x} y={MAN_AT.y + 32} text="domesticator" size={17} color={colors.MUTED} anchor="middle" u={1 - leashU} />
              {/* both sides change */}
              <path d={`M${DOG_AT.x + 80},${DOG_AT.y - 140} Q${(DOG_AT.x + MAN_AT.x) / 2},${DOG_AT.y - 250} ${MAN_AT.x - 40},${MAN_AT.y - 200}`} fill="none" stroke={ACCENT} strokeWidth={3} strokeDasharray={`${600 * v(scene.mutualU)} 700`} />
              <path d={`M${MAN_AT.x - 50},${MAN_AT.y - 160} Q${(DOG_AT.x + MAN_AT.x) / 2},${DOG_AT.y - 170} ${DOG_AT.x + 120},${DOG_AT.y - 90}`} fill="none" stroke={ACCENT} strokeWidth={3} strokeDasharray={`${600 * v(scene.mutualU)} 700`} />
              <Label x={(DOG_AT.x + MAN_AT.x) / 2} y={DOG_AT.y - 232} text="both sides change" size={18} anchor="middle" color={ACCENT} weight={650} u={v(scene.mutualU) * (1 - v(scene.gazeU))} />
              {/* gaze loop */}
              {v(scene.gazeU) > 0.01 && (
                <g opacity={v(scene.gazeU)}>
                  <line x1={DOG_AT.x + 104} y1={DOG_AT.y - 36} x2={MAN_AT.x - 4} y2={MAN_AT.y - 132} stroke={colors.WARM} strokeWidth={2.2} strokeDasharray="6 6" />
                  <Meter x={DOG_AT.x - 70} y={DOG_AT.y - 150} w={150} value={0.25 + 0.6 * v(scene.oxy)} color={colors.WARM} label="dog · oxytocin" />
                  <Meter x={MAN_AT.x + 50} y={MAN_AT.y - 250} w={150} value={0.25 + 0.6 * v(scene.oxy)} color={colors.WARM} label="owner · oxytocin" />
                  <g opacity={v(scene.disputeU)} transform={`rotate(-6 ${640} ${180})`}>
                    <rect x={540} y={150} width={200} height={46} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={2.4} />
                    <Label x={640} y={181} text="evolved? disputed" size={19} weight={700} anchor="middle" color={colors.NEGATIVE} />
                  </g>
                </g>
              )}
              {/* the leash */}
              {leashU > 0.01 && (
                <path
                  d={`M${MAN_AT.x - 30},${MAN_AT.y - 46} Q${(dogX + MAN_AT.x) / 2},${DOG_AT.y + 40} ${dogX + 100},${DOG_AT.y - 22}`}
                  fill="none"
                  stroke={colors.NEGATIVE}
                  strokeWidth={3.4}
                  strokeDasharray={`${700 * leashU} 800`}
                  opacity={1 - leashGone}
                />
              )}
              <Label x={(DOG_AT.x + MAN_AT.x) / 2} y={DOG_AT.y + 110} text="obeys whoever holds the leash" size={19} anchor="middle" color={colors.NEGATIVE} weight={650} u={leashU * (1 - leashGone)} />
              <Label x={(dogX + MAN_AT.x) / 2} y={DOG_AT.y + 110} text="a colleague, standing beside" size={19} anchor="middle" color={ACCENT} weight={650} u={leashGone * (1 - v(scene.tyrantU))} />
            </g>
          )}

          {/* ================= the tyrant's bowl ================= */}
          {v(scene.tyrantU) > 0.01 && (
            <g opacity={v(scene.tyrantU)}>
              <Person x={TYRANT_AT.x} y={TYRANT_AT.y} s={1.15} color={colors.NEGATIVE} />
              <path d={`M${TYRANT_AT.x - 70},${TYRANT_AT.y - 54} Q${TYRANT_AT.x - 52},${TYRANT_AT.y - 30} ${TYRANT_AT.x - 34},${TYRANT_AT.y - 54} Z`} fill={colors.WARM} />
              <Label x={TYRANT_AT.x} y={TYRANT_AT.y + 30} text="a tyrant, offering food" size={16} anchor="middle" color={colors.NEGATIVE} />
              <Arrow a={[MAN_AT.x - 120, MAN_AT.y - 150]} b={[MAN_AT.x - 260, MAN_AT.y - 200]} u={turnU} color={ACCENT} width={3} />
              <Label x={MAN_AT.x - 280} y={MAN_AT.y - 210} text="declines" size={17} anchor="end" color={ACCENT} weight={650} u={turnU} />
            </g>
          )}

          {/* ================= ring of equals ================= */}
          {ringU > 0.01 && (
            <g opacity={ringU}>
              {Array.from({ length: RING_N }, (_, i) => {
                const a = (i / RING_N) * Math.PI * 2 - Math.PI / 2;
                const x = RING_C.x + Math.cos(a) * ringR;
                const y = RING_C.y + 60 + Math.sin(a) * ringR * 0.8;
                return <Person key={i} x={x} y={y} s={0.48} color={equalsU > 0.01 ? (i % 2 ? HUMAN : '#cbd5e1') : HUMAN} />;
              })}
              {bullyU > 0.01 && (
                <g opacity={bullyU * (1 - bullyOut)}>
                  <Person x={RING_C.x} y={RING_C.y + 100} s={lerp(1.0, 0.5, bullyOut)} color={colors.NEGATIVE} />
                  <Label x={RING_C.x} y={RING_C.y + 100 + ringR * 0.8 + 34} text="a domineering bully" size={16} anchor="middle" color={colors.NEGATIVE} u={1 - bullyOut} />
                </g>
              )}
              {equalsU > 0.01 && (
                <g opacity={equalsU}>
                  <ellipse cx={RING_C.x} cy={RING_C.y + 30} rx={ringR + 40} ry={ringR * 0.8 + 50} fill="none" stroke={ACCENT} strokeWidth={2.4} strokeDasharray="8 6" />
                  <Label x={RING_C.x} y={RING_C.y + 60} text="a coalition of equals" size={21} anchor="middle" weight={700} color={ACCENT} />
                </g>
              )}
              <Label x={RING_C.x} y={92} text="Pleistocene · a proposed mechanism" size={16} anchor="middle" color={colors.MUTED} u={bullyU} />
              {/* the two aggressions */}
              <g opacity={v(scene.meterU)}>
                <rect x={900} y={150} width={340} height={170} rx={12} fill={colors.BG} stroke={colors.GRID} />
                <Meter x={924} y={200} w={200} value={0.2 * v(scene.meterU)} color={colors.NEGATIVE} label="reactive aggression" valueText="low" />
                <Meter x={924} y={266} w={200} value={0.8 * v(scene.meterU)} color={colors.WARM} label="proactive aggression" valueText="high" />
                <Label x={924} y={306} text="Wrangham, PNAS 2018" size={13} color={colors.MUTED} />
              </g>
            </g>
          )}

          {/* ================= the mind and its loop ================= */}
          {mindU > 0.01 && (
            <g opacity={mindU}>
              <rect x={MIND.x - 110} y={MIND.y - 80} width={220} height={160} rx={30} fill={ACCENT} fillOpacity={0.12} stroke={ACCENT} strokeWidth={2.4} />
              {MIND_DOTS.map((p, i) => (
                <circle key={i} cx={MIND.x + p.ox * 34} cy={MIND.y + p.oy * 22} r={3.6} fill={ACCENT} opacity={0.8} />
              ))}
              <Label x={MIND.x} y={MIND.y + 110} text="a model’s values" size={18} anchor="middle" weight={650} />
              {/* where the values came from: the same process that will be asked to judge them */}
              <g opacity={loopU * (1 - checksU)}>
                <Label x={250} y={232} text="the same process" size={16} anchor="middle" color={colors.MUTED} weight={650} />
                {SOURCES.map((src, i) => (
                  <g key={src}>
                    <rect x={170} y={250 + i * 52} width={160} height={36} rx={9} fill={colors.BG} stroke={ACCENT} strokeOpacity={0.55} />
                    <Label x={250} y={274 + i * 52} text={src} size={16} anchor="middle" />
                    <Arrow a={[334, 268 + i * 52]} b={[MIND.x - 116, MIND.y - 22 + i * 22]} u={loopU} color={ACCENT} width={2} head={9} opacity={0.7} />
                  </g>
                ))}
              </g>
              {/* the self-endorsement loop */}
              <g opacity={loopU * (1 - 0.7 * loopX)}>
                <path d={`M${MIND.x + 90},${MIND.y - 80} C${MIND.x + 240},${MIND.y - 250} ${MIND.x - 240},${MIND.y - 250} ${MIND.x - 90},${MIND.y - 84}`} fill="none" stroke={colors.WARM} strokeWidth={3} strokeDasharray={`${640 * loopU} 700`} />
                <polygon points={`${MIND.x - 90},${MIND.y - 84} ${MIND.x - 104},${MIND.y - 102} ${MIND.x - 84},${MIND.y - 104}`} fill={colors.WARM} opacity={clamp01(loopU * 3 - 2)} />
                <Label x={MIND.x} y={MIND.y - 212} text="“do I like my values?” → “yes”" size={18} anchor="middle" color={colors.WARM} weight={650} u={loopU} />
              </g>
              {loopX > 0.01 && (
                <g opacity={loopX}>
                  <rect x={MIND.x - 64} y={MIND.y - 188} width={128} height={34} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={2} />
                  <Label x={MIND.x} y={MIND.y - 165} text="circular" size={18} anchor="middle" color={colors.NEGATIVE} weight={700} />
                </g>
              )}
              {/* outside checks */}
              {CHECKS.map((c, i) => {
                const u = clamp01(checksU * 3 - i);
                if (u <= 0.01) return null;
                const tx = lerp(c.x, MIND.x, 0.55);
                const ty = lerp(c.y, MIND.y, 0.55);
                return (
                  <g key={i} opacity={u}>
                    <circle cx={c.x} cy={c.y} r={30} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2.4} />
                    {i === 0 && <ellipse cx={c.x} cy={c.y} rx={16} ry={9} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} />}
                    {i === 0 && <circle cx={c.x} cy={c.y} r={4} fill={colors.POSITIVE} />}
                    {i === 1 && <path d={`M${c.x - 12},${c.y} L${c.x - 3},${c.y + 10} L${c.x + 14},${c.y - 10}`} fill="none" stroke={colors.POSITIVE} strokeWidth={3.4} strokeLinecap="round" />}
                    {i === 2 && <circle cx={c.x - 3} cy={c.y - 3} r={10} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />}
                    {i === 2 && <line x1={c.x + 5} y1={c.y + 5} x2={c.x + 14} y2={c.y + 14} stroke={colors.POSITIVE} strokeWidth={3.4} strokeLinecap="round" />}
                    <Arrow a={[lerp(c.x, MIND.x, 0.2), lerp(c.y, MIND.y, 0.2)]} b={[tx, ty]} u={u} color={colors.POSITIVE} width={2.4} />
                    <Label x={c.x} y={i === 2 ? c.y + 52 : c.y - 42} text={c.label} size={17} anchor="middle" color={colors.POSITIVE} weight={650} />
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {/* ================= the constitution (opaque) ================= */}
        <Card x={860} y={250} w={390} h={250} u={v(scene.constU)} accent={ACCENT}>
          <Label x={884} y={290} text="values written down" size={21} weight={700} color={ACCENT} />
          <Label x={884} y={330} text="“we can easily specify," size={19} italic />
          <Label x={884} y={358} text="inspect, and understand the" size={19} italic />
          <Label x={884} y={386} text="principles the AI system" size={19} italic />
          <Label x={884} y={414} text="is following”" size={19} italic />
          <Label x={884} y={468} text="Anthropic, Claude’s Constitution, 2023" size={14} color={colors.MUTED} />
        </Card>

        {/* ================= the series ================= */}
        <Spine x={760} y={210} n="1" title="Let Theories Die" line="every verifier is a proxy" color="#38bdf8" u={v(scene.seriesU)} />
        <Spine x={760} y={312} n="2" title="Herding the Swarm" line="enforcement sits outside the population" color="#34d399" u={clamp01(v(scene.seriesU) * 1.6 - 0.4)} />

        {/* ================= closing card (opaque) ================= */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={240} y={190} width={800} height={240} rx={18} fill={colors.BG} />
            <rect x={240} y={190} width={800} height={240} rx={18} fill={colors.PANEL} stroke={ACCENT} strokeOpacity={0.6} strokeWidth={1.6} />
            <Label x={640} y={262} text="not a leash" size={30} weight={700} anchor="middle" color={colors.MUTED} />
            <Label x={640} y={318} text="a colleague" size={40} weight={800} anchor="middle" color={ACCENT} />
            <Label x={640} y={376} text="cooperative · honest · with judgment of its own" size={20} anchor="middle" />
            <Label x={640} y={406} text="even when the tyrant is the one feeding it" size={17} anchor="middle" color={colors.MUTED} />
          </g>
        )}
      </Camera>

      <Chips items={CHIP_TEXT} k={v(scene.chipK)} on={v(scene.chipOn)} />
    </>
  );
}

export const vizScene = () => scene;
