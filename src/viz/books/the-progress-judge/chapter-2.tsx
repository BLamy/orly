// Rounds of Three, and the Judge
//
// Backed by: /Users/brettlamy/Dev/electric-forest .claude/workflows/work-queue.js —
// roundSize = args?.roundSize ?? 3, maxAttempts = args?.maxAttempts ?? 10; the
// judge convenes when `retries > 0 && retries % roundSize === 0` (attempts 3,
// 6, 9); it is an agent labeled `progress-judge:<taskId>` with schema
// PROGRESS_SCHEMA = { progressing: boolean, reason: string }; its prompt hands
// it "the successive critic verdicts, oldest first" and instructs "Rule ONLY
// on convergence: findings shrinking or shifting to new, shallower ground
// (progress) vs same class of failure, cosmetic changes, growing scope
// (circling). Do not fix anything." Only `judgment?.progressing` buys the
// next round; anything else calls flipInvalid.
//
// ONE persistent object: the courtroom. The pip ledger runs along the top;
// verdict documents fly from it onto the judge's desk, oldest first; the two
// possible readings render as finding-set bars that shrink (progress) or
// hold shape and widen (circling); the ruling is a single boolean chip.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const LEDGER = { x: 150, y: 108, pipDX: 66, gapDX: 40 };
const pipX = (i: number) => LEDGER.x + i * LEDGER.pipDX + Math.floor(i / 3) * LEDGER.gapDX;

const DESK = { x: 120, y: 218, w: 420, h: 320 };
const READ = { x: 620, y: 218, w: 580, h: 320 };

// finding-set bars: converging (shrinks, shifts hue) vs circling (same, wider)
const CONV_BARS = [5, 3, 1];
const CIRC_BARS = [4, 4, 5];

const CAM_LEDGER: CameraState = { x: 640, y: 190, k: 1.3 };
const CAM_DESK: CameraState = { x: 360, y: 350, k: 1.28 };
const CAM_READ: CameraState = { x: 880, y: 360, k: 1.2 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.0 };

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ledgerU: ChannelRef<number>;
  burnU: ChannelRef<number>; // 0..6 pips burned across the chapter
  gateU: ChannelRef<number>; // boundary highlight at attempt 3
  judgeU: ChannelRef<number>; // the judge panel
  docsU: ChannelRef<number>; // 0..3 verdicts fly to the desk
  questionU: ChannelRef<number>;
  convBarsU: ChannelRef<number>;
  circBarsU: ChannelRef<number>;
  schemaU: ChannelRef<number>;
  ruleU: ChannelRef<number>; // progressing: true
  gate2U: ChannelRef<number>; // the 6 and 9 gates light
  haltU: ChannelRef<number>; // the false branch
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ledgerU = tl.channel('ledgerU', 0);
  const burnU = tl.channel('burnU', 0);
  const gateU = tl.channel('gateU', 0);
  const judgeU = tl.channel('judgeU', 0);
  const docsU = tl.channel('docsU', 0);
  const questionU = tl.channel('questionU', 0);
  const convBarsU = tl.channel('convBarsU', 0);
  const circBarsU = tl.channel('circBarsU', 0);
  const schemaU = tl.channel('schemaU', 0);
  const ruleU = tl.channel('ruleU', 0);
  const gate2U = tl.channel('gate2U', 0);
  const haltU = tl.channel('haltU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the budget —
  tl.caption({
    at: 0.5,
    dur: 7.5,
    text: 'The work queue meters rework in rounds of three. Ten small slots is the entire budget — three rounds of three, then one final attempt at the end. No task gets an open tab.',
  });
  tl.tween(cam, CAM_LEDGER, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(ledgerU, 1, { at: 1.1, dur: 2.4, ease: ease.draw });
  tl.hold(8.0, 0.6);

  // — Beat 2 · the boundary —
  tl.caption({
    at: 8.6,
    dur: 7.5,
    text: 'Each refutation burns one slot. The interesting moment is the boundary: when the count of retries divides evenly by the round size, the loop stops building and convenes a court.',
  });
  tl.tween(burnU, 3, { at: 9.2, dur: 3.0, ease: ease.linear });
  tl.tween(gateU, 1, { at: 13.0, dur: 0.9, ease: ease.pop });
  tl.hold(16.1, 0.6);

  // — Beat 3 · the third party —
  tl.caption({
    at: 16.7,
    dur: 7.5,
    text: 'The court is one agent with a strict charter. It is called the progress judge, and it is deliberately a third party: not the builder defending its work, and not the critic that just refuted it.',
  });
  tl.tween(cam, CAM_DESK, { at: 16.9, dur: 1.4, ease: ease.move });
  tl.tween(judgeU, 1, { at: 17.5, dur: 1.4, ease: ease.enter });
  tl.hold(24.2, 0.6);

  // — Beat 4 · what it reads —
  tl.caption({
    at: 24.8,
    dur: 7,
    text: 'What the judge receives is the evidence the other two never assemble: the successive critic verdicts, oldest first, laid side by side as a single document.',
  });
  tl.tween(docsU, 3, { at: 25.4, dur: 3.4, ease: ease.move });
  tl.hold(31.8, 0.6);

  // — Beat 5 · the one question —
  tl.caption({
    at: 32.4,
    dur: 7,
    text: 'It is told to read them and rule on exactly one question. Not whether the code is good. Not how to fix it. Are these reworks converging?',
  });
  tl.tween(questionU, 1, { at: 33.0, dur: 1.0, ease: ease.enter });
  tl.hold(39.4, 0.6);

  // — Beat 6 · what converging looks like —
  tl.caption({
    at: 40.0,
    dur: 7.5,
    text: 'Converging looks like this: the finding sets shrink, or they shift to new, shallower ground. The critic keeps finding things — but smaller things, in fresher places.',
  });
  tl.tween(cam, CAM_READ, { at: 40.2, dur: 1.4, ease: ease.move });
  tl.tween(convBarsU, 1, { at: 40.9, dur: 2.6, ease: ease.move });
  tl.hold(47.5, 0.6);

  // — Beat 7 · what circling looks like —
  tl.caption({
    at: 48.1,
    dur: 7,
    text: 'Circling looks like this: the same class of failure wearing cosmetic changes, or a scope that grows with every attempt. Movement without progress.',
  });
  tl.tween(circBarsU, 1, { at: 48.7, dur: 2.6, ease: ease.move });
  tl.hold(55.1, 0.6);

  // — Beat 8 · the ruling shape —
  tl.caption({
    at: 55.7,
    dur: 6.5,
    text: 'The ruling comes back in a fixed shape: a single boolean called progressing, plus a reason. There is no third option and no partial credit.',
  });
  tl.tween(schemaU, 1, { at: 56.3, dur: 1.0, ease: ease.enter });
  tl.hold(62.2, 0.6);

  // — Beat 9 · true buys a round —
  tl.caption({
    at: 62.8,
    dur: 8,
    text: 'Only a true buys the next round of three. The gate opens, the builder gets attempts four through six, and at six the judge sits again. The checks fire after attempts three, six, and nine.',
  });
  tl.tween(cam, CAM_WIDE, { at: 63.0, dur: 1.4, ease: ease.move });
  tl.tween(ruleU, 1, { at: 63.6, dur: 0.7, ease: ease.pop });
  tl.tween(burnU, 6, { at: 64.8, dur: 3.0, ease: ease.linear });
  tl.tween(gate2U, 1, { at: 68.2, dur: 1.0, ease: ease.enter });
  tl.hold(70.8, 0.6);

  // — Beat 10 · anything else halts —
  tl.caption({
    at: 71.4,
    dur: 7.5,
    text: 'Anything else — a false, a missing ruling, a malformed answer — halts the task on the spot and flips the whole project to an invalid loop. The judge cannot fix the work, but it can stop it.',
  });
  tl.tween(haltU, 1, { at: 72.2, dur: 1.0, ease: ease.enter });
  tl.hold(78.9, 0.6);

  // — Beat 11 · the division of sight —
  tl.caption({
    at: 79.5,
    dur: 7.5,
    text: 'That is the design. The builder owns the attempt, the critic owns the verdict, and the judge owns the one thing neither of them can see — the direction the sequence is moving.',
  });
  tl.tween(endDim, 1, { at: 79.8, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 80.8, dur: 0.9, ease: ease.enter });
  tl.hold(87.0, 1.2);

  return {
    tl, cam, ledgerU, burnU, gateU, judgeU, docsU, questionU,
    convBarsU, circBarsU, schemaU, ruleU, gate2U, haltU, endDim, endU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ledgerU = s.get(scene.ledgerU);
  const burnU = s.get(scene.burnU);
  const gateU = s.get(scene.gateU);
  const judgeU = s.get(scene.judgeU);
  const docsU = s.get(scene.docsU);
  const questionU = s.get(scene.questionU);
  const convBarsU = s.get(scene.convBarsU);
  const circBarsU = s.get(scene.circBarsU);
  const schemaU = s.get(scene.schemaU);
  const ruleU = s.get(scene.ruleU);
  const gate2U = s.get(scene.gate2U);
  const haltU = s.get(scene.haltU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const worldOp = 1 - 0.85 * endDim;
  const gate1X = (pipX(2) + pipX(3)) / 2;
  const gate2X = (pipX(5) + pipX(6)) / 2;
  const gate3X = (pipX(8) + pipX(9)) / 2;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the pip ledger: ten slots, rounds of three ---- */}
          {ledgerU > 0 && (
            <g>
              <text x={LEDGER.x} y={LEDGER.y - 34} fill={colors.MUTED} fontSize={12} opacity={ledgerU}>the rework budget</text>
              <text x={LEDGER.x + 150} y={LEDGER.y - 34} fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={ledgerU}>
                roundSize: 3 · maxAttempts: 10
              </text>
              {Array.from({ length: 10 }, (_, i) => {
                const u = clamp01(ledgerU * 12 - i);
                if (u <= 0) return null;
                const burned = clamp01(burnU - i);
                const isCap = i === 9;
                return (
                  <g key={i} transform={`translate(${pipX(i)} ${LEDGER.y})`} opacity={u}>
                    <circle r={13} fill={burned > 0.5 ? colors.NEGATIVE : colors.PANEL} stroke={isCap ? colors.WARM : burned > 0.5 ? colors.NEGATIVE : colors.MUTED} strokeWidth={2} />
                    {burned > 0.5 ? (
                      <g stroke={colors.BG} strokeWidth={2} strokeLinecap="round" opacity={burned}>
                        <line x1={-4.5} y1={-4.5} x2={4.5} y2={4.5} />
                        <line x1={4.5} y1={-4.5} x2={-4.5} y2={4.5} />
                      </g>
                    ) : (
                      <text y={4} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>{i + 1}</text>
                    )}
                    {isCap && <text y={32} textAnchor="middle" fill={colors.WARM} fontSize={9.5} fontFamily={MONO}>cap</text>}
                  </g>
                );
              })}
              {/* judge gates between rounds */}
              {[gate1X, gate2X, gate3X].map((gx, gi) => {
                const lit = gi === 0 ? Math.max(gateU, ruleU) : gate2U;
                const open = gi === 0 ? ruleU : 0;
                return (
                  <g key={gi} transform={`translate(${gx} ${LEDGER.y})`} opacity={ledgerU}>
                    <path d="M 0 -13 L 11 0 L 0 13 L -11 0 Z" fill={open > 0.5 ? colors.POSITIVE : lit > 0.3 ? colors.WARM : colors.PANEL} stroke={lit > 0.3 ? (open > 0.5 ? colors.POSITIVE : colors.WARM) : colors.GRID} strokeWidth={1.6} opacity={0.9} />
                    <text y={-22} textAnchor="middle" fill={lit > 0.3 ? colors.WARM : colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                      judge @ {(gi + 1) * 3}
                    </text>
                  </g>
                );
              })}
              {gateU > 0 && (
                <text x={gate1X} y={LEDGER.y + 40} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO} opacity={gateU * (1 - ruleU)}>
                  retries % roundSize === 0
                </text>
              )}
              {ruleU > 0 && (
                <text x={gate1X} y={LEDGER.y + 40} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO} opacity={ruleU}>
                  progressing: true — round two granted
                </text>
              )}
            </g>
          )}

          {/* ---- the judge's desk ---- */}
          {judgeU > 0 && (
            <g opacity={judgeU}>
              <rect x={DESK.x} y={DESK.y} width={DESK.w} height={DESK.h} rx={14} fill={colors.PANEL} stroke={haltU > 0.5 ? colors.NEGATIVE : colors.GRID} strokeWidth={1.5} />
              <text x={DESK.x + 20} y={DESK.y + 32} fill={colors.TEXT} fontSize={15} fontWeight={700}>the progress judge</text>
              <text x={DESK.x + 20} y={DESK.y + 54} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                agent · label progress-judge:taskId
              </text>
              <text x={DESK.x + 20} y={DESK.y + 72} fill={colors.MUTED} fontSize={10.5}>
                neither the builder nor the refuting critic
              </text>
              {/* the docket: verdicts, oldest first */}
              {docsU > 0 && (
                <g>
                  <text x={DESK.x + 20} y={DESK.y + 104} fill={colors.MUTED} fontSize={10.5} opacity={Math.min(1, docsU)}>
                    successive verdicts, oldest first
                  </text>
                  {[0, 1, 2].map((i) => {
                    const u = clamp01(docsU - i);
                    if (u <= 0) return null;
                    const y = DESK.y + 118 + i * 46;
                    return (
                      <g key={i} opacity={u} transform={`translate(${DESK.x + 20 + (1 - u) * 60} ${y})`}>
                        <rect width={DESK.w - 40} height={38} rx={8} fill={colors.BG} stroke={colors.GRID} />
                        <text x={12} y={16} fill={colors.SECONDARY} fontSize={10.5} fontFamily={MONO}>--- attempt {i + 1} ---</text>
                        <text x={12} y={30} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>refuted · findings + citations</text>
                      </g>
                    );
                  })}
                </g>
              )}
              {questionU > 0 && (
                <g opacity={questionU}>
                  <rect x={DESK.x + 20} y={DESK.y + 262} width={DESK.w - 40} height={40} rx={9} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.3} />
                  <text x={DESK.x + 36} y={DESK.y + 279} fill={colors.ACCENT} fontSize={11.5} fontWeight={700}>Rule ONLY on convergence.</text>
                  <text x={DESK.x + 36} y={DESK.y + 295} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>Do not fix anything.</text>
                </g>
              )}
            </g>
          )}

          {/* ---- the two readings ---- */}
          {(convBarsU > 0 || circBarsU > 0) && (
            <g>
              <rect x={READ.x} y={READ.y} width={READ.w} height={READ.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} opacity={Math.min(1, convBarsU * 2)} />
              {/* converging: finding sets shrink, hue shifts to shallower ground */}
              {convBarsU > 0 && (
                <g opacity={Math.min(1, convBarsU * 2)}>
                  <text x={READ.x + 24} y={READ.y + 34} fill={colors.POSITIVE} fontSize={13} fontWeight={700}>progressing</text>
                  <text x={READ.x + 24} y={READ.y + 54} fill={colors.MUTED} fontSize={10.5}>findings shrinking, or shifting to new, shallower ground</text>
                  {CONV_BARS.map((n, i) => {
                    const u = clamp01(convBarsU * 3.5 - i);
                    const w = n * 40 * u;
                    return (
                      <g key={i} transform={`translate(${READ.x + 24} ${READ.y + 72 + i * 26})`}>
                        <text x={-2} y={13} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO} textAnchor="end" opacity={u}>{i + 1}</text>
                        <rect x={8} width={w} height={16} rx={5} fill={colors.POSITIVE} opacity={0.35 + 0.25 * (i / 2)} />
                        <text x={16 + w} y={13} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO} opacity={u}>{n} findings</text>
                      </g>
                    );
                  })}
                  <text x={READ.x + 24} y={READ.y + 160} fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO} opacity={clamp01(convBarsU * 2 - 1)}>
                    → shrinking toward zero
                  </text>
                </g>
              )}
              {/* circling: same class, cosmetic changes, growing scope */}
              {circBarsU > 0 && (
                <g opacity={Math.min(1, circBarsU * 2)}>
                  <text x={READ.x + 24} y={READ.y + 196} fill={colors.NEGATIVE} fontSize={13} fontWeight={700}>circling</text>
                  <text x={READ.x + 24} y={READ.y + 216} fill={colors.MUTED} fontSize={10.5}>same class of failure, cosmetic changes, growing scope</text>
                  {CIRC_BARS.map((n, i) => {
                    const u = clamp01(circBarsU * 3.5 - i);
                    const w = n * 40 * u;
                    return (
                      <g key={i} transform={`translate(${READ.x + 24} ${READ.y + 232 + i * 26})`}>
                        <text x={-2} y={13} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO} textAnchor="end" opacity={u}>{i + 1}</text>
                        <rect x={8} width={w} height={16} rx={5} fill={colors.NEGATIVE} opacity={0.4} />
                        <text x={16 + w} y={13} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO} opacity={u}>
                          {i === 2 ? `${n} findings — wider` : `${n} findings — same class`}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
              {/* the ruling schema */}
              {schemaU > 0 && (
                <g opacity={schemaU} transform={`translate(${READ.x + 330} ${READ.y + 40})`}>
                  <rect width={224} height={78} rx={10} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.4} />
                  <text x={14} y={22} fill={colors.SECONDARY} fontSize={10.5} fontFamily={MONO}>PROGRESS_SCHEMA</text>
                  <text x={14} y={44} fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>{'{ progressing: boolean,'}</text>
                  <text x={14} y={62} fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>{'  reason: string }'}</text>
                </g>
              )}
            </g>
          )}

          {/* ---- the halt branch ---- */}
          {haltU > 0 && (
            <g opacity={haltU} transform={`translate(640 588)`}>
              <rect x={-330} y={-22} width={660} height={40} rx={20} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
              <text y={3} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>
                !judgment?.progressing → flipInvalid — no third option
              </text>
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={280} y={262} width={720} height={130} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={700}>
              the builder owns the attempt · the critic owns the verdict
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.WARM} fontSize={14} fontStyle="italic">
              the judge owns the direction
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
