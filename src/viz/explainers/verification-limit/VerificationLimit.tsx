// Explained: Proof or It Didn't Happen — chapter 5: the limit case.
// The book's capstone: the shelf's ladder of verifiers arranged on one axis —
// how much the verified party can negotiate with the verdict. Tests (choose
// your samples), benchmarks and judges (optimize the surface), adversarial
// critics (argue the evidence), and at the top the kernel: verification the
// verified cannot negotiate with. One claim-dot climbs the ladder; each rung
// replays the failure mode this book (and the loop books) measured. Numbers
// on screen are the ones computed in chapters 1–4 of this book.
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
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The ladder. "negotiability": what the verified party can still do about an
// unfavorable verdict. Numbers: computed in this book's earlier chapters.
// ---------------------------------------------------------------------------

const RUNGS = [
  {
    name: 'tests',
    negotiation: 'pick the samples',
    fact: 'ch.1 — 60/60 green while half the space fails',
    color: colors.NEGATIVE,
  },
  {
    name: 'benchmarks & model judges',
    negotiation: 'optimize the surface',
    fact: 'ch.4 — judge false-accepts: 11% → 79% under pressure',
    color: colors.WARM,
  },
  {
    name: 'adversarial critics',
    negotiation: 'argue the evidence',
    fact: 'the loop books — replay the tape, sabotage, budget the rework',
    color: colors.SECONDARY,
  },
  {
    name: 'the proof kernel',
    negotiation: 'none — change what is true',
    fact: 'ch.4 — 0% at every pressure level, by recomputation',
    color: colors.POSITIVE,
  },
];

const RUNG_X = 260;
const RUNG_W = 760;
const RUNG_H = 96;
const RUNG_GAP = 30;
const rungY = (i: number) => 530 - i * (RUNG_H + RUNG_GAP); // rung 0 at bottom (bottom edge 626, clear of the CC strip)
const CAM_RUNG = (i: number): CameraState => ({ x: 640, y: rungY(i) + RUNG_H / 2, k: 1.35 });

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  axisU: ChannelRef<number>;
  rungU: ChannelRef<number>; // rungs draw in, 0..1 across all four
  dotI: ChannelRef<number>; // the claim dot's rung position (continuous)
  factU: ChannelRef<number>; // per-rung fact chips, revealed with the dot
  agentU: ChannelRef<number>; // the agents-checking-themselves panel
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
  finalU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const axisU = tl.channel('axisU', 0);
  const rungU = tl.channel('rungU', 0);
  const dotI = tl.channel('dotI', -1);
  const factU = tl.channel('factU', 0);
  const agentU = tl.channel('agentU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);
  const finalU = tl.channel('finalU', 0);

  // Beat 1 — the axis
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Every verifier on this shelf answers the same question — should I believe this claim? — and they differ on exactly one axis: how much the party being verified can still negotiate with the verdict.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(axisU, 1, { at: 1.6, dur: 1.2, ease: ease.draw });
  tl.tween(rungU, 1, { at: 2.4, dur: 2.6, ease: ease.linear });
  tl.hold(6.1, 0.5);

  // Beat 2 — climb: tests
  tl.caption({
    at: 6.6,
    dur: 5.6,
    text: 'Start at the bottom, where this book began. A test suite lets the claimant choose the samples. Chapter one showed a function passing sixty out of sixty tests while failing on half its input space — negotiation by omission.',
  });
  tl.tween(cam, CAM_RUNG(0), { at: 6.9, dur: 1.3, ease: ease.move });
  tl.tween(dotI, 0, { at: 7.4, dur: 0.8, ease: ease.move });
  tl.tween(factU, 1, { at: 8.2, dur: 0.8, ease: ease.enter });
  tl.hold(12.2, 0.5);

  // Beat 3 — benchmarks and judges
  tl.caption({
    at: 12.7,
    dur: 5.8,
    text: 'One rung up: benchmarks and model judges. Better — someone else picks the questions — but the verdict reads a surface the claimant can optimize. Chapter four measured a judge sliding from eleven percent to seventy nine percent false accepts as the prose improved.',
  });
  tl.tween(cam, CAM_RUNG(1), { at: 13.0, dur: 1.2, ease: ease.move });
  tl.tween(dotI, 1, { at: 13.5, dur: 0.9, ease: ease.move });
  tl.hold(18.5, 0.5);

  // Beat 4 — critics
  tl.caption({
    at: 19.0,
    dur: 6.0,
    text: 'The third rung is where the loop books live. An adversarial critic replays the recording, holds the diff against the tape, sabotages the code to prove the tests can go red. Negotiation shrinks to arguing about evidence — hard, but a determined claimant still argues.',
  });
  tl.tween(cam, CAM_RUNG(2), { at: 19.3, dur: 1.2, ease: ease.move });
  tl.tween(dotI, 2, { at: 19.8, dur: 0.9, ease: ease.move });
  tl.caption({
    at: 25.4,
    dur: 4.8,
    text: 'Even there, a judge of progress has to decide whether rework is converging, and a human reads the final stop. Strong verification — but verification with people, or models, in the loop.',
  });
  tl.hold(30.2, 0.5);

  // Beat 5 — the kernel
  tl.caption({
    at: 30.7,
    dur: 5.8,
    text: 'And the top rung is this book. The kernel offers no samples to pick, no surface to optimize, no evidence to argue. The only move that changes its verdict is changing what is true. Verification the verified cannot negotiate with.',
  });
  tl.tween(cam, CAM_RUNG(3), { at: 31.0, dur: 1.3, ease: ease.move });
  tl.tween(dotI, 3, { at: 31.5, dur: 0.9, ease: ease.move });
  tl.hold(36.5, 0.6);

  // Beat 6 — what it costs, and the agent connection
  tl.caption({
    at: 37.1,
    dur: 5.8,
    text: 'The top rung is not free. It only works where claims can be written formally — a proof, a type, an invariant — and most of what agents claim cannot be, yet. That is why the shelf spends whole books on rung three.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 37.3, dur: 1.4, ease: ease.move });
  tl.tween(agentU, 1, { at: 38.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 43.3,
    dur: 5.6,
    text: 'But the direction of travel is fixed. Every time a claim can be pushed up one rung — a test promoted to a property, a review promoted to a replay, a spec promoted to a proof — the agent’s fluency stops mattering, and its work starts to.',
  });
  tl.hold(48.9, 0.6);

  // Beat 7 — close
  tl.caption({
    at: 49.5,
    dur: 5.6,
    text: 'So the book closes where the shelf always lands. An agent’s word is a prediction. Tests sample it, judges grade it, critics attack it — and at the limit, a thirty line kernel replaces belief with arithmetic.',
  });
  tl.tween(dimU, 1, { at: 50.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.5, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 55.5,
    dur: 5.0,
    text: 'Proof, or it did not happen. Everything below the top rung is an engineering compromise with that sentence — and now you know exactly what is being compromised, and by how much.',
  });
  tl.tween(finalU, 1, { at: 56.5, dur: 0.9, ease: ease.enter });
  tl.hold(60.5, 1.4);

  return { tl, cam, titleU, axisU, rungU, dotI, factU, agentU, dimU, closeU, finalU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/verification-limit/overrides.json',
  slug: 'verification-limit',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const axisU = s.get(scene.axisU);
  const rungU = s.get(scene.rungU);
  const dotI = s.get(scene.dotI);
  const factU = s.get(scene.factU);
  const agentU = s.get(scene.agentU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);
  const finalU = s.get(scene.finalU);

  const mainOp = 1 - 0.85 * dimU;
  const dotOn = dotI > -0.5;
  const dotIdx = clamp01((dotI + 1) / 4) * 4 - 1; // continuous rung index
  const dotY = dotOn ? rungY(Math.max(0, dotIdx)) + RUNG_H / 2 : rungY(0) + RUNG_H + 40;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the negotiability axis */}
          {axisU > 0 && (
            <g opacity={axisU}>
              <line x1={RUNG_X - 60} y1={rungY(0) + RUNG_H} x2={RUNG_X - 60} y2={rungY(3)} stroke={colors.GRID} strokeWidth={2} />
              <text
                x={RUNG_X - 78}
                y={(rungY(0) + rungY(3) + RUNG_H) / 2}
                fill={colors.MUTED}
                fontSize={13}
                textAnchor="middle"
                transform={`rotate(-90 ${RUNG_X - 78} ${(rungY(0) + rungY(3) + RUNG_H) / 2})`}
              >
                negotiability of the verdict ↓
              </text>
            </g>
          )}

          {/* the rungs */}
          {RUNGS.map((r, i) => {
            const u = clamp01(rungU * RUNGS.length - i);
            if (u <= 0) return null;
            const y = rungY(i);
            const active = Math.abs(dotIdx - i) < 0.5 && dotOn;
            return (
              <g key={r.name} opacity={u * (active || !dotOn ? 1 : 0.42)}>
                <rect x={RUNG_X} y={y} width={RUNG_W} height={RUNG_H} rx={12} fill={colors.PANEL} opacity={0.95} stroke={r.color} strokeWidth={active ? 2.5 : 1.2} />
                <text x={RUNG_X + 26} y={y + 34} fill={r.color} fontSize={17} fontWeight={700}>
                  {r.name}
                </text>
                <text x={RUNG_X + 26} y={y + 60} fill={colors.MUTED} fontSize={13}>
                  what the claimant can still do: {r.negotiation}
                </text>
                {(active && factU > 0) && (
                  <text x={RUNG_X + 26} y={y + 82} fill={colors.TEXT} fontSize={12} fontFamily="monospace" opacity={factU}>
                    {r.fact}
                  </text>
                )}
              </g>
            );
          })}

          {/* the claim dot */}
          {dotOn && (
            <g>
              <circle cx={RUNG_X - 26} cy={dotY} r={11} fill={colors.ACCENT} />
              <text x={RUNG_X - 26} y={dotY - 20} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily="monospace" fontWeight={700}>
                “it works”
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* the agent connection — screen space */}
      {agentU > 0 && (
        <g opacity={agentU * mainOp}>
          <rect x={880} y={120} width={370} height={168} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={904} y={152} fill={colors.TEXT} fontSize={14} fontWeight={600}>
            the promotion ladder
          </text>
          <text x={904} y={182} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
            test → property
          </text>
          <text x={904} y={206} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
            review → replayed recording
          </text>
          <text x={904} y={230} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
            spec → machine-checked proof
          </text>
          <text x={904} y={262} fill={colors.POSITIVE} fontSize={12}>
            each promotion retires one negotiation
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The unnegotiable verifier
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={180} y={200} width={920} height={264} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={262} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Proof, or it didn’t happen.
          </text>
          <text x={640} y={312} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            tests: pick the samples · judges: optimize the surface · critics: argue the evidence
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontWeight={600}>
            kernel: change what is true — there is no other move
          </text>
          {finalU > 0 && (
            <text x={640} y={408} textAnchor="middle" fill={colors.WARM} fontSize={14.5} opacity={finalU}>
              everything below the top rung is a measured compromise — this book measured it
            </text>
          )}
        </g>
      )}
    </>
  );
}

export function VerificationLimit() {
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
