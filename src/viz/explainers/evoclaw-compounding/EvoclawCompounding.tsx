// arXiv:2607.09711 — "EvoClawBench" — Chapter 5: the close.
// The shelf thesis applied to self-improvement: an agent that learns from
// its own runs is compounding — but only if the skills are VERIFIED, not
// just remembered. The benchmark's own design says it: fresh workspace,
// frozen files, graded sub-problems — a skill counts only when it survives
// a transfer test it could fail. Bridges to explained-agents ch5 (an
// agent's "it works" is the expensive claim) and the loop books.
// Recap retraces: question → toy loop → measured spread → failure bill.
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

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// two compounding curves: verified skills vs remembered skills, over runs
// simple closed-form illustration (labeled conceptual): verified gains
// accrete; remembered assumptions accumulate drag.
const RUNS = 20;
const verifiedCurve = Array.from({ length: RUNS + 1 }, (_, i) => 0.7 + 0.25 * (1 - Math.exp(-i / 7)));
const rememberedCurve = Array.from({ length: RUNS + 1 }, (_, i) => 0.7 + 0.1 * Math.exp(-((i - 3) ** 2) / 8) - 0.25 * (1 - Math.exp(-Math.max(0, i - 4) / 6)));

const AX_X = 200;
const AX_Y = 470;
const AX_W = 560;
const AX_H = 300;

const px = (i: number): number => AX_X + (i / RUNS) * AX_W;
const py = (v: number): number => AX_Y - ((v - 0.3) / 0.7) * AX_H;

const pathOf = (c: number[]): string =>
  c.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
const V_PATH = pathOf(verifiedCurve);
const R_PATH = pathOf(rememberedCurve);

const JOURNEY = [
  'ch1 · a skill is a frozen procedural file',
  'ch2 · same evidence, two skills, opposite endings',
  'ch3 · the spread: 0.99 to 96.73 on one benchmark',
  'ch4 · transfer and amortization — the two bars',
];

const CAM_CURVES: CameraState = { x: AX_X + AX_W / 2 + 40, y: 320, k: 1.25 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  axesU: ChannelRef<number>;
  vU: ChannelRef<number>;
  rU: ChannelRef<number>;
  gapU: ChannelRef<number>;
  ruleU: ChannelRef<number>;
  journeyU: ChannelRef<number>;
  bridgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const axesU = tl.channel('axesU', 0);
  const vU = tl.channel('vU', 0);
  const rU = tl.channel('rU', 0);
  const gapU = tl.channel('gapU', 0);
  const ruleU = tl.channel('ruleU', 0);
  const journeyU = tl.channel('journeyU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the promise restated
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'An agent that learns from its own runs is the only kind that compounds. Every run makes the next one cheaper, faster, safer. That promise is real — this benchmark saw it happen, three and a half points at a time.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_CURVES, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(axesU, 1, { at: 1.6, dur: 1.4, ease: ease.draw });
  tl.tween(vU, 1, { at: 3.2, dur: 1.8, ease: ease.draw });
  tl.hold(5.9, 0.7);

  // Beat 2 — the fork
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'But the same loop, run without a filter, compounds the other way. Remembered assumptions pile up as drag, and the curve that was supposed to climb sinks below where it started. The benchmark saw that too — spectacularly.',
  });
  tl.tween(rU, 1, { at: 7.6, dur: 1.8, ease: ease.draw });
  tl.tween(gapU, 1, { at: 9.8, dur: 1.0, ease: ease.move });
  tl.hold(12.4, 0.7);

  // Beat 3 — the discriminator
  tl.caption({
    at: 13.1,
    dur: 6.0,
    text: 'The discriminator between the two curves is not intelligence. It is verification. A skill counts only if it survives a test it could fail — a fresh workspace, frozen files, graded checks. Memory without a gate is just accumulating bias.',
  });
  tl.tween(ruleU, 1, { at: 14.4, dur: 0.9, ease: ease.enter });
  tl.hold(19.1, 0.7);

  // Beat 4 — recap
  tl.caption({
    at: 19.8,
    dur: 6.0,
    text: 'Retrace the book. A skill pinned down as a frozen file. A toy agent showing the same evidence can birth a general lesson or a memorized fixture. The measured spread from under one percent to ninety six. And the two bars every skill must clear.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 20.0, dur: 1.4, ease: ease.move });
  tl.tween(journeyU, 1, { at: 20.9, dur: 3.2, ease: ease.linear });
  tl.hold(25.8, 0.7);

  // Beat 5 — the bridge
  tl.caption({
    at: 26.5,
    dur: 5.8,
    text: 'This is the agents book from this shelf, arriving from a new direction. There, the expensive claim was it works. Here, the expensive claim is I learned something. Both get cheap the moment a verifier — not the agent — signs off.',
  });
  tl.tween(bridgeU, 1, { at: 27.6, dur: 0.9, ease: ease.enter });
  tl.hold(32.3, 0.7);

  // Beat 6 — close
  tl.caption({
    at: 33.0,
    dur: 5.6,
    text: 'So yes — let your agents write skills from their own runs. Just make every skill earn its place: prove it transfers, prove it amortizes, and freeze it once it does. Compounding is real. It is just never free.',
  });
  tl.tween(dimU, 1, { at: 33.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 34.3, dur: 1.0, ease: ease.enter });
  tl.hold(38.6, 1.4);

  return { tl, cam, titleU, axesU, vU, rU, gapU, ruleU, journeyU, bridgeU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/evoclaw-compounding/overrides.json',
  slug: 'evoclaw-compounding',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const axesU = s.get(scene.axesU);
  const vU = s.get(scene.vU);
  const rU = s.get(scene.rU);
  const gapU = s.get(scene.gapU);
  const ruleU = s.get(scene.ruleU);
  const journeyU = s.get(scene.journeyU);
  const bridgeU = s.get(scene.bridgeU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const chartOp = 1 - 0.8 * journeyU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* curves chart */}
          <g opacity={chartOp}>
            {axesU > 0 && (
              <g opacity={axesU}>
                <line x1={AX_X} y1={AX_Y} x2={AX_X + AX_W * axesU} y2={AX_Y} stroke={colors.GRID} strokeWidth={1.5} />
                <line x1={AX_X} y1={AX_Y} x2={AX_X} y2={AX_Y - AX_H * axesU} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={AX_X + AX_W - 60} y={AX_Y + 24} fill={colors.MUTED} fontSize={13}>
                  runs
                </text>
                <text x={AX_X - 24} y={AX_Y - AX_H - 12} fill={colors.MUTED} fontSize={13}>
                  success rate
                </text>
                <text x={AX_X + 130} y={AX_Y - AX_H - 12} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                  conceptual curves — the endpoints are ch2's toy + ch3's reported spread
                </text>
                <line x1={AX_X} y1={py(0.7)} x2={AX_X + AX_W} y2={py(0.7)} stroke={colors.GRID} strokeDasharray="4 5" opacity={0.5} />
                <text x={AX_X + AX_W + 8} y={py(0.7) + 4} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                  baseline
                </text>
              </g>
            )}
            {vU > 0 && (
              <g>
                <path d={V_PATH} fill="none" stroke={colors.POSITIVE} strokeWidth={3}
                  strokeDasharray={`${1000 * clamp01(vU)} 1000`} opacity={0.9} />
                {vU > 0.9 && (
                  <text x={px(RUNS) - 4} y={py(verifiedCurve[RUNS]) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontWeight={600}>
                    verified skills
                  </text>
                )}
              </g>
            )}
            {rU > 0 && (
              <g>
                <path d={R_PATH} fill="none" stroke={colors.NEGATIVE} strokeWidth={3}
                  strokeDasharray={`${1000 * clamp01(rU)} 1000`} opacity={0.9} />
                {rU > 0.9 && (
                  <text x={px(RUNS) - 4} y={py(rememberedCurve[RUNS]) + 22} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} fontWeight={600}>
                    remembered skills
                  </text>
                )}
              </g>
            )}
            {gapU > 0 && (
              <g opacity={gapU}>
                <line x1={px(RUNS)} y1={py(verifiedCurve[RUNS])} x2={px(RUNS)} y2={py(rememberedCurve[RUNS])} stroke={colors.WARM} strokeWidth={2} strokeDasharray="3 4" />
                <text x={px(RUNS) + 10} y={(py(verifiedCurve[RUNS]) + py(rememberedCurve[RUNS])) / 2} fill={colors.WARM} fontSize={12}>
                  the gate
                </text>
              </g>
            )}
            {ruleU > 0 && (
              <g opacity={ruleU}>
                <rect x={840} y={200} width={350} height={120} rx={12} fill={colors.PANEL} stroke={colors.WARM} />
                <text x={862} y={232} fill={colors.WARM} fontSize={14} fontWeight={600}>
                  the discriminator
                </text>
                <text x={862} y={260} fill={colors.TEXT} fontSize={13}>
                  a skill counts only if it survives
                </text>
                <text x={862} y={282} fill={colors.TEXT} fontSize={13}>
                  a test it could fail — fresh
                </text>
                <text x={862} y={304} fill={colors.TEXT} fontSize={13}>
                  workspace, frozen file, graded
                </text>
              </g>
            )}
          </g>

          {/* recap */}
          {journeyU > 0 && (
            <g opacity={journeyU}>
              {JOURNEY.map((line, i) => {
                const u = clamp01(journeyU * JOURNEY.length - i);
                if (u <= 0) return null;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={330} cy={180 + i * 56} r={5} fill={colors.SECONDARY} />
                    {i < JOURNEY.length - 1 && (
                      <line x1={330} y1={186 + i * 56} x2={330} y2={230 + i * 56} stroke={colors.GRID} strokeWidth={1.5} />
                    )}
                    <text x={352} y={186 + i * 56} fill={colors.TEXT} fontSize={16}>
                      {line}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* bridge chip */}
          {bridgeU > 0 && (
            <g opacity={bridgeU}>
              <rect x={310} y={430} width={660} height={64} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={640} y={457} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} fontWeight={600}>
                the shelf's rule, one more time
              </text>
              <text x={640} y={480} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                “it works” needs a recording · “I learned something” needs a transfer test
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Compounding is never free
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.09711
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={225} width={860} height={200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Verified, not just remembered
          </text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            let agents write skills from their own runs — then make each one
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            prove it transfers and amortizes before it earns a place
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            EvoClawBench · arXiv:2607.09711
          </text>
        </g>
      )}
    </>
  );
}

export function EvoclawCompounding() {
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
