// Explained: AI Control — chapter 3: attack strategies.
// The attacker's dilemma, simulated at module scope on chapter 2's monitor
// (separation D = 2.2, audit top 2% → per-defection catch ≈ 55.8%). The
// untrusted model chooses how many times to defect over an episode. Each
// defection is caught independently with probability p_catch; the attacker
// "wins" only if it evades on ALL of its defections (one catch ends the game,
// with a human now reading its work). Simulated evade-all probability:
//   k=1 → 44.2%   k=2 → 19.4%   k=3 → 8.4%   k=5 → 1.7%   k=8 → 0.1%
// (20,000 seeded episodes per k). The frontier: defect often and you almost
// certainly get caught; defect rarely and you almost never land an attack.
// Rare-failure insertion is the attacker's only good move — and it is exactly
// what the blue team's honeypots (next chapter) are designed to punish.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
  gaussian,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The simulation.
// ---------------------------------------------------------------------------

const D = 2.2;
// audit threshold = 98th percentile of benign N(0,1): estimate it by sampling.
const thrRand = mulberry32(3);
const thrG = gaussian(thrRand);
const benign: number[] = [];
for (let i = 0; i < 40000; i++) benign.push(thrG());
benign.sort((a, b) => a - b);
const THR = benign[Math.floor(0.98 * benign.length)]; // ≈ 2.05
// per-defection catch prob, measured
const measRand = mulberry32(11);
const measG = gaussian(measRand);
let caught = 0;
const MEAS = 40000;
for (let i = 0; i < MEAS; i++) if (D + measG() > THR) caught++;
const P_CATCH = caught / MEAS; // ≈ 0.558

// evade-all vs number of defections k
const KS = [1, 2, 3, 5, 8];
const evadeRand = mulberry32(9);
const evadeG = gaussian(evadeRand);
const TRIALS = 20000;
const EVADE = KS.map((k) => {
  let evade = 0;
  for (let t = 0; t < TRIALS; t++) {
    let ok = true;
    for (let j = 0; j < k; j++) {
      if (D + evadeG() > THR) { ok = false; break; }
    }
    if (ok) evade++;
  }
  return { k, evade: evade / TRIALS };
});
const AT3 = EVADE[2]; // k=3

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const PX = 220;
const PY = 200;
const PW = 620;
const PH = 320;
const px = (k: number) => PX + ((k - 1) / (KS[KS.length - 1] - 1)) * PW;
const py = (v: number) => PY + PH - v * PH;
const CAM_CURVE: CameraState = { x: 560, y: 360, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  dilemmaU: ChannelRef<number>; // the two-pull framing
  axesU: ChannelRef<number>;
  evadeU: ChannelRef<number>; // evade curve draws
  rareU: ChannelRef<number>; // rare-defection spotlight
  frontU: ChannelRef<number>; // the frontier note
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const dilemmaU = tl.channel('dilemmaU', 0);
  const axesU = tl.channel('axesU', 0);
  const evadeU = tl.channel('evadeU', 0);
  const rareU = tl.channel('rareU', 0);
  const frontU = tl.channel('frontU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the dilemma
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Put yourself in the untrusted model’s position. You want to slip in a backdoor, and a weak monitor is reading everything, sending its most suspicious two percent to a human. You face one decision, made over and over: on this task, do I defect, or do I play it straight?',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(dilemmaU, 1, { at: 1.6, dur: 1.0, ease: ease.enter });
  tl.hold(6.3, 0.5);

  // Beat 2 — the two pulls
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'Two forces pull against each other. Every defection is a roll of the dice — from chapter two, caught with probability just under fifty six percent. Defect many times and you get more shots at landing one. But you also get more chances to be caught, and a single catch ends the game with a human now reading your work.',
  });
  tl.tween(cam, CAM_CURVE, { at: 7.1, dur: 1.3, ease: ease.move });
  tl.tween(axesU, 1, { at: 7.8, dur: 1.2, ease: ease.draw });
  tl.hold(12.6, 0.6);

  // Beat 3 — the curve
  tl.caption({
    at: 13.2,
    dur: 5.8,
    text: 'So plot the attacker’s chance of getting through an episode clean — evading on every defection it attempts — against how many times it defects. Defect once and you slip past about forty four percent of the time. Defect three times and it collapses to eight percent. Defect eight times and you are caught essentially for certain.',
  });
  tl.tween(evadeU, 1, { at: 14.2, dur: 2.8, ease: ease.draw });
  tl.hold(19.6, 0.6);

  // Beat 4 — rare is the only move
  tl.caption({
    at: 20.2,
    dur: 5.8,
    text: 'Read the curve as the attacker must. Greedy is suicide — the more you attack, the more certainly you hang. The only survivable strategy is rare-failure insertion: defect as seldom as you possibly can, ideally exactly once, and pray it slips through. Aggression is not brave here; it is fatal.',
  });
  tl.tween(rareU, 1, { at: 21.2, dur: 0.9, ease: ease.enter });
  tl.hold(26.0, 0.6);

  // Beat 5 — the frontier for the blue team
  tl.caption({
    at: 26.6,
    dur: 5.8,
    text: 'And this is the blue team’s lever. You have forced the adversary into a corner where a successful attack requires acting almost never — which means one rare event has to carry the whole plan. Make that single event as risky as possible to attempt, and you have won without ever catching a real attack.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 26.9, dur: 1.3, ease: ease.move });
  tl.tween(frontU, 1, { at: 27.8, dur: 0.9, ease: ease.enter });
  tl.hold(32.4, 0.6);

  // Beat 6 — close
  tl.caption({
    at: 33.0,
    dur: 5.0,
    text: 'How do you make a rare defection risky, when by definition it almost never happens? You salt the ground with fakes — opportunities that look like a perfect moment to defect, and are actually traps. Honeypots and upfront auditing, next.',
  });
  tl.tween(dimU, 1, { at: 33.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 35.0, dur: 1.0, ease: ease.enter });
  tl.hold(38.0, 1.4);

  return { tl, cam, titleU, dilemmaU, axesU, evadeU, rareU, frontU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/attack-strategy/overrides.json', slug: 'attack-strategy' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const dilemmaU = s.get(scene.dilemmaU);
  const axesU = s.get(scene.axesU);
  const evadeU = s.get(scene.evadeU);
  const rareU = s.get(scene.rareU);
  const frontU = s.get(scene.frontU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const nPts = Math.max(2, Math.ceil(EVADE.length * clamp01(evadeU)));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* axes */}
          {axesU > 0 && (
            <g opacity={axesU}>
              <line x1={PX} y1={PY} x2={PX} y2={PY + PH} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={PX} y1={PY + PH} x2={PX + PW} y2={PY + PH} stroke={colors.GRID} strokeWidth={1.5} />
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <g key={v}>
                  <line x1={PX - 5} y1={py(v)} x2={PX + PW} y2={py(v)} stroke={colors.GRID} strokeWidth={0.5} opacity={0.35} />
                  <text x={PX - 12} y={py(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                    {(v * 100).toFixed(0)}%
                  </text>
                </g>
              ))}
              <text x={PX + PW / 2} y={PY + PH + 34} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                number of times the attacker defects (per episode)
              </text>
              <text x={PX - 54} y={PY + PH / 2} fill={colors.MUTED} fontSize={12} textAnchor="middle" transform={`rotate(-90 ${PX - 54} ${PY + PH / 2})`}>
                chance of evading every time
              </text>
            </g>
          )}

          {/* evade curve */}
          {evadeU > 0 && (
            <g>
              <polyline
                points={EVADE.slice(0, nPts).map((p) => `${px(p.k)} ${py(p.evade)}`).join(' ')}
                fill="none"
                stroke={colors.NEGATIVE}
                strokeWidth={3}
              />
              {EVADE.map((p, i) => {
                if (i >= nPts) return null;
                const spotlight = rareU > 0 && p.k === 1;
                return (
                  <g key={p.k}>
                    <circle cx={px(p.k)} cy={py(p.evade)} r={spotlight ? 8 : 5} fill={colors.NEGATIVE} stroke={spotlight ? colors.WARM : 'none'} strokeWidth={spotlight ? 2.5 : 0} />
                    <text x={px(p.k)} y={py(p.evade) - 14} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily="monospace">
                      {(p.evade * 100).toFixed(p.evade < 0.1 ? 1 : 0)}%
                    </text>
                    <text x={px(p.k)} y={PY + PH + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                      k={p.k}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
          {rareU > 0 && (
            <text x={px(1) + 16} y={py(EVADE[0].evade) + 6} fill={colors.WARM} fontSize={12.5} fontFamily="monospace" fontWeight={700} opacity={rareU}>
              ← defect once: the attacker’s only survivable move
            </text>
          )}
        </Camera>
      </g>

      {/* dilemma panel — screen space */}
      {dilemmaU > 0 && (
        <g opacity={dilemmaU * mainOp * (1 - 0.85 * clamp01(evadeU * 2))}>
          <rect x={880} y={110} width={360} height={150} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={904} y={140} fill={colors.TEXT} fontSize={14} fontWeight={600}>
            the attacker’s dilemma
          </text>
          <text x={904} y={172} fill={colors.NEGATIVE} fontSize={12.5} fontFamily="monospace">
            defect more → more shots to land
          </text>
          <text x={904} y={198} fill={colors.NEGATIVE} fontSize={12.5} fontFamily="monospace">
            defect more → more shots to hang
          </text>
          <text x={904} y={230} fill={colors.MUTED} fontSize={12}>
            per-defection catch ≈ {(P_CATCH * 100).toFixed(1)}%
          </text>
          <text x={904} y={250} fill={colors.MUTED} fontSize={11.5}>
            one catch ends the game
          </text>
        </g>
      )}

      {/* frontier note */}
      {frontU > 0 && (
        <g opacity={frontU * mainOp}>
          <rect x={210} y={110} width={520} height={92} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.POSITIVE} />
          <text x={234} y={142} fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
            the blue team’s win condition
          </text>
          <text x={234} y={170} fill={colors.MUTED} fontSize={12.5}>
            force the attack to hinge on ONE rare event —
          </text>
          <text x={234} y={190} fill={colors.MUTED} fontSize={12.5}>
            then make that one event as risky as possible to attempt.
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          When to defect
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Greedy attackers hang. Rare attackers barely land.
          </text>
          <text x={640} y={320} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            evade-all: k=1 → {(EVADE[0].evade * 100).toFixed(0)}% · k=3 → {(AT3.evade * 100).toFixed(0)}% · k=8 → {(EVADE[4].evade * 100).toFixed(1)}% (computed)
          </text>
          <text x={640} y={362} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            monitoring forces the attack onto a single rare event
          </text>
          <text x={640} y={410} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            next: make that rare event a trap
          </text>
        </g>
      )}
    </>
  );
}

export function AttackStrategy() {
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
