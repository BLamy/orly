// Why Attack Beats Review
//
// Backed by: electric-forest AGENTS.md ("The gauntlet": every verified task
// deposits promoted tests, golden artifacts, and fuzz seeds into the cheap
// gates at the front, so the pipeline gets stricter every time it runs;
// Critic charter: coverage, sabotage, fuzz, mock & env hunt) and
// .claude/workflows/verify-task.js (the SUITE duty: promote deterministic
// tests, golden event logs, fuzz corpus entries, verify targets). The
// chapter's experiment: the same seeded defect swarm thrown at a passive
// reviewer lane and at the critic's filter stack — review lets through what
// the diff never mentions; the attacks catch it.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { GauntletRail } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const LANE_L = { x: 120, y: 120, w: 460, h: 330 };
const LANE_R = { x: 700, y: 120, w: 460, h: 330 };
const RAIL = { x: 180, y: 545, w: 920 };

const CAM_LANES: CameraState = { x: 640, y: 280, k: 1.1 };
const CAM_LEFT: CameraState = { x: 350, y: 285, k: 1.3 };
const CAM_RIGHT: CameraState = { x: 930, y: 285, k: 1.3 };
const CAM_RAIL: CameraState = { x: 640, y: 500, k: 1.25 };
const CAM_WIDE: CameraState = { x: 640, y: 350, k: 1.0 };

/** The critic's filter stack (real attack arms, in order). */
const FILTERS = ['re-run with own inputs', 'fuzz the parsers', 'sabotage the tests', 'audit diff coverage', 'interrogate the recording'];

/** The defect swarm — seeded, identical on both sides. Each defect carries
 * which filter catches it (the diff "mentions" none of them). */
const rand = mulberry32(41);
const DEFECTS = Array.from({ length: 12 }, (_, i) => ({
  i,
  xJit: rand(),
  yJit: rand(),
  catchAt: i % 5, // which filter stops it on the right lane
  wobble: rand() * Math.PI * 2,
}));
const laneDefectX = (lane: { x: number; w: number }, d: (typeof DEFECTS)[number]) => lane.x + 40 + d.xJit * (lane.w - 80);

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  lanesU: ChannelRef<number>;
  fallL: ChannelRef<number>; // defects falling through the review lane
  stampU: ChannelRef<number>;
  fallR: ChannelRef<number>; // defects falling into the filter stack
  filtersU: ChannelRef<number>;
  caughtU: ChannelRef<number>; // catch flashes + counter
  escapeU: ChannelRef<number>; // the escaped bugs on the left, in prod
  railU: ChannelRef<number>;
  depositU: ChannelRef<number>; // promoted tests land in the gates
  recapU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const lanesU = tl.channel('lanesU', 0);
  const fallL = tl.channel('fallL', 0);
  const stampU = tl.channel('stampU', 0);
  const fallR = tl.channel('fallR', 0);
  const filtersU = tl.channel('filtersU', 0);
  const caughtU = tl.channel('caughtU', 0);
  const escapeU = tl.channel('escapeU', 0);
  const railU = tl.channel('railU', 0);
  const depositU = tl.channel('depositU', 0);
  const recapU = tl.channel('recapU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the experiment —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'One last experiment. Take the same change, carrying the same dozen latent defects, and push it through two doors: a careful review on the left, the critic on the right.',
  });
  tl.tween(cam, CAM_LANES, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(lanesU, 1, { at: 1.2, dur: 1.6, ease: ease.draw });
  tl.hold(7.0, 0.6);

  // — Beat 2 · the reviewer reads —
  tl.caption({
    at: 7.6,
    dur: 7,
    text: 'The reviewer reads every line, carefully, and approves in good faith. But reading can only test the claims the diff makes. A defect the diff never mentions casts no shadow on the page.',
  });
  tl.tween(cam, CAM_LEFT, { at: 7.8, dur: 1.3, ease: ease.move });
  tl.tween(fallL, 1, { at: 8.4, dur: 5.0, ease: ease.linear });
  tl.tween(stampU, 1, { at: 12.0, dur: 0.6, ease: ease.pop });
  tl.hold(14.9, 0.6);

  // — Beat 3 · everything lands in production —
  tl.caption({
    at: 15.5,
    dur: 5.5,
    text: 'So the swarm falls straight through the approval, untouched, and lands where escaped defects always land: in production, on a Tuesday.',
  });
  tl.tween(escapeU, 1, { at: 16.0, dur: 3.5, ease: ease.linear });
  tl.hold(21.3, 0.6);

  // — Beat 4 · the filter stack —
  tl.caption({
    at: 21.9,
    dur: 7,
    text: 'The right door is different because nothing gets taken on faith. The change has to survive being run with someone else’s inputs, fuzzed, sabotaged, coverage audited, and held against its own recording.',
  });
  tl.tween(cam, CAM_RIGHT, { at: 22.1, dur: 1.4, ease: ease.move });
  tl.tween(filtersU, 1, { at: 22.8, dur: 2.8, ease: ease.draw });
  tl.hold(29.1, 0.6);

  // — Beat 5 · the swarm meets the filters —
  tl.caption({
    at: 29.7,
    dur: 7.5,
    text: 'Drop the same dozen defects in, and watch. The race condition dies under fuzzing. The silent failure dies under sabotage. The unexercised branch dies in the coverage audit. Layer by layer, the swarm thins.',
  });
  tl.tween(fallR, 1, { at: 30.2, dur: 5.6, ease: ease.linear });
  tl.tween(caughtU, 1, { at: 31.0, dur: 5.4, ease: ease.linear });
  tl.hold(37.4, 0.6);

  // — Beat 6 · the punchline of the count —
  tl.caption({
    at: 38.0,
    dur: 6,
    text: 'Not because the critic is smarter than the reviewer. Because running, bending, and breaking the code asks questions the diff never volunteers answers to.',
  });
  tl.hold(44.0, 0.6);

  // — Beat 7 · verification compounds —
  tl.caption({
    at: 44.6,
    dur: 7.5,
    text: 'And every catch compounds. When a task verifies, the critic promotes what it learned — a deterministic test, a golden event log, fuzz seeds — into the cheap gates at the front of the pipeline. The gauntlet gets stricter every lap.',
  });
  tl.tween(cam, CAM_RAIL, { at: 44.8, dur: 1.4, ease: ease.move });
  tl.tween(railU, 1, { at: 45.6, dur: 1.6, ease: ease.draw });
  tl.tween(depositU, 1, { at: 48.2, dur: 2.6, ease: ease.linear });
  tl.hold(52.7, 0.6);

  // — Beat 8 · recap —
  tl.caption({
    at: 53.3,
    dur: 8,
    text: 'So retrace the journey. A claim is cheap, so it must be tethered to a recording. The builder makes evidence in its workshop. The critic attacks it from six directions. The budget keeps the loop honest — and every lap makes the next one harder to fool.',
  });
  tl.tween(cam, CAM_WIDE, { at: 53.5, dur: 1.5, ease: ease.move });
  tl.tween(endDim, 1, { at: 54.2, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 1, { at: 55.2, dur: 3.4, ease: ease.draw });
  tl.hold(61.9, 0.5);

  // — Beat 9 · close —
  tl.caption({
    at: 62.4,
    dur: 6,
    text: 'Believe a bug report for free. Make it works pay its way — with a session anyone can interrogate. That is the whole doctrine, and it is why an adversary catches what a reader cannot.',
  });
  tl.tween(endU, 1, { at: 63.2, dur: 1.0, ease: ease.enter });
  tl.hold(68.4, 1.4);

  return {
    tl, cam, lanesU, fallL, stampU, fallR, filtersU, caughtU, escapeU,
    railU, depositU, recapU, endDim, endU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

const RECAP = ['a claim is not evidence', 'the builder’s workshop', 'the critic attacks', 'the budget and the stop', 'attack beats review'];

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const lanesU = s.get(scene.lanesU);
  const fallL = s.get(scene.fallL);
  const stampU = s.get(scene.stampU);
  const fallR = s.get(scene.fallR);
  const filtersU = s.get(scene.filtersU);
  const caughtU = s.get(scene.caughtU);
  const escapeU = s.get(scene.escapeU);
  const railU = s.get(scene.railU);
  const depositU = s.get(scene.depositU);
  const recapU = s.get(scene.recapU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const worldOp = 1 - 0.85 * endDim;
  const caught = Math.round(clamp01(caughtU) * 12);

  const filterY = (k: number) => LANE_R.y + 60 + k * 52;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- lane frames ---- */}
          {lanesU > 0 && (
            <g opacity={lanesU}>
              <rect x={LANE_L.x} y={LANE_L.y} width={LANE_L.w} height={LANE_L.h} rx={14} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
              <text x={LANE_L.x + LANE_L.w / 2} y={LANE_L.y - 14} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontWeight={700}>
                passive review
              </text>
              <rect x={LANE_R.x} y={LANE_R.y} width={LANE_R.w} height={LANE_R.h} rx={14} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
              <text x={LANE_R.x + LANE_R.w / 2} y={LANE_R.y - 14} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontWeight={700}>
                adversarial verification
              </text>
            </g>
          )}

          {/* ---- left lane: the reading eye + the LGTM membrane ---- */}
          {lanesU > 0 && (
            <g opacity={lanesU}>
              <g transform={`translate(${LANE_L.x + LANE_L.w / 2} ${LANE_L.y + 56})`}>
                <path d="M -26 0 Q 0 -22 26 0 Q 0 22 -26 0 Z" fill="none" stroke={colors.MUTED} strokeWidth={2} />
                <circle r={7.5} fill={colors.MUTED} />
                <text y={40} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                  reads the diff · agrees with its story
                </text>
              </g>
              {/* the approval line the swarm falls through */}
              <line x1={LANE_L.x + 40} y1={LANE_L.y + 150} x2={LANE_L.x + LANE_L.w - 40} y2={LANE_L.y + 150} stroke={colors.POSITIVE} strokeWidth={1.5} strokeDasharray="7 7" opacity={0.7} />
              {stampU > 0 && (
                <g transform={`translate(${LANE_L.x + LANE_L.w - 96} ${LANE_L.y + 136}) rotate(-10) scale(${0.7 + 0.3 * stampU})`} opacity={stampU}>
                  <rect x={-44} y={-14} width={88} height={28} rx={6} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
                  <text y={5} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontWeight={800} letterSpacing={1.5}>
                    LGTM
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---- left swarm: falls straight through ---- */}
          {fallL > 0 &&
            DEFECTS.map((d) => {
              const u = clamp01(fallL * 2.2 - d.yJit * 1.1);
              if (u <= 0) return null;
              const x = laneDefectX(LANE_L, d) + Math.sin(u * 6 + d.wobble) * 6;
              const yTop = LANE_L.y + 92;
              const yBot = LANE_L.y + LANE_L.h - 26;
              const y = yTop + (yBot - yTop) * u;
              const inProd = escapeU > 0 && u >= 0.999;
              return (
                <g key={d.i}>
                  <circle cx={x} cy={y} r={5} fill={colors.NEGATIVE} opacity={Math.min(1, u * 4)} />
                  {inProd && <circle cx={x} cy={y} r={9} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.2} opacity={0.5 * escapeU} />}
                </g>
              );
            })}
          {escapeU > 0.5 && (
            <text x={LANE_L.x + LANE_L.w / 2} y={LANE_L.y + LANE_L.h + 26} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontWeight={700} opacity={escapeU}>
              12 of 12 reach production
            </text>
          )}

          {/* ---- right lane: the filter stack ---- */}
          {filtersU > 0 &&
            FILTERS.map((f, k) => {
              const u = clamp01(filtersU * (FILTERS.length + 1.5) - k);
              if (u <= 0) return null;
              const y = filterY(k);
              return (
                <g key={f} opacity={u}>
                  <line x1={LANE_R.x + 36} y1={y} x2={LANE_R.x + LANE_R.w - 36} y2={y} stroke={colors.ACCENT} strokeWidth={1.5} opacity={0.75} />
                  <text x={LANE_R.x + LANE_R.w - 30} y={y + 4} textAnchor="start" fill={colors.MUTED} fontSize={0} fontFamily={MONO}>
                    {''}
                  </text>
                  <text x={LANE_R.x + 40} y={y - 7} fill={colors.ACCENT} fontSize={11} fontFamily={MONO} opacity={0.95}>
                    {f}
                  </text>
                </g>
              );
            })}

          {/* ---- right swarm: caught layer by layer ---- */}
          {fallR > 0 &&
            DEFECTS.map((d) => {
              const u = clamp01(fallR * 2.2 - d.yJit * 1.1);
              if (u <= 0) return null;
              const x = laneDefectX(LANE_R, d) + Math.sin(u * 6 + d.wobble) * 6;
              const yTop = LANE_R.y + 26;
              const yCatch = filterY(d.catchAt);
              const y = yTop + (yCatch - yTop) * Math.min(1, u);
              const landed = u >= 0.999;
              const flash = landed ? clamp01(caughtU * 2 - d.yJit) : 0;
              return (
                <g key={d.i}>
                  <circle cx={x} cy={y} r={5} fill={landed ? colors.WARM : colors.NEGATIVE} opacity={Math.min(1, u * 4)} />
                  {flash > 0 && (
                    <g opacity={flash}>
                      <circle cx={x} cy={y} r={9 + 4 * flash} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={0.7 * (1 - flash * 0.5)} />
                      <g stroke={colors.WARM} strokeWidth={1.6} strokeLinecap="round">
                        <line x1={x - 3.2} y1={y - 3.2} x2={x + 3.2} y2={y + 3.2} />
                        <line x1={x + 3.2} y1={y - 3.2} x2={x - 3.2} y2={y + 3.2} />
                      </g>
                    </g>
                  )}
                </g>
              );
            })}
          {caughtU > 0.1 && (
            <text x={LANE_R.x + LANE_R.w / 2} y={LANE_R.y + LANE_R.h + 26} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700} opacity={Math.min(1, caughtU * 2)}>
              {caught} of 12 caught before the verdict
            </text>
          )}

          {/* ---- the compounding gauntlet ---- */}
          <GauntletRail
            x={RAIL.x}
            y={RAIL.y}
            w={RAIL.w}
            gates={['format:check', 'lint', 'typecheck', 'test', 'build'].map((label) => ({ label, state: railU > 0.9 ? 1 : 0 }))}
            reveal={railU}
            deposit={depositU > 0 ? { gate: 3, label: '+1 promoted test', u: clamp01(depositU * 2) } : undefined}
          />
          {depositU > 0.5 && (
            <g opacity={clamp01(depositU * 2 - 1)}>
              <g transform={`translate(${RAIL.x + (RAIL.w / 4) * 1}, ${RAIL.y - 34 - 8})`}>
                <rect x={-72} y={-12} width={144} height={24} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
                <text y={4.5} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={MONO}>
                  +1 golden log
                </text>
              </g>
              <g transform={`translate(${RAIL.x + (RAIL.w / 4) * 3.6}, ${RAIL.y - 34 - 8})`}>
                <rect x={-70} y={-12} width={140} height={24} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
                <text y={4.5} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={MONO}>
                  +1 fuzz seed
                </text>
              </g>
            </g>
          )}
        </g>

        {/* ---- recap ribbon + closing ---- */}
        {recapU > 0 && (
          <g>
            {RECAP.map((r, i) => {
              const u = clamp01(recapU * (RECAP.length + 1) - i);
              if (u <= 0) return null;
              const x = 150 + i * 250;
              return (
                <g key={r} opacity={u} transform={`translate(${x} ${210 + (1 - u) * 10})`}>
                  <circle r={7} fill={i === 4 ? colors.WARM : colors.ACCENT} />
                  {i < RECAP.length - 1 && <line x1={10} y1={0} x2={240} y2={0} stroke={colors.GRID} strokeWidth={1.5} opacity={u} />}
                  <text y={30} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
                    {r}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={300} y={300} width={680} height={130} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={352} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={700}>
              believe “broken” for free · make “works” pay its way
            </text>
            <text x={640} y={388} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              the electric forest loop
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
