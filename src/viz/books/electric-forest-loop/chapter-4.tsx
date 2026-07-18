// The Budget and the Loud Stop
//
// Backed by: .claude/workflows/work-queue.js (roundSize: 3 and maxAttempts: 10;
// reworks run in rounds of three, and when retries % roundSize === 0 a
// PROGRESS JUDGE — a third critic, neither the builder nor the refuting
// critic — reads the successive verdicts and rules ONLY on convergence; only
// a "progressing" ruling buys the next round; thrash detection — the same
// finding set refuting twice flips invalid_loop immediately; flipInvalid
// writes status, statusReason, updatedAt and commits) and .eforest/loop.md
// (the judge fires after attempts 3, 6, and 9; 10 total attempts is the hard
// cap; invalid_loop is a loud stop for a human — "routing around it is itself
// a refutation of the loop"; project states building / complete / paused /
// invalid_loop live in .eforest/project.json).
//
// ONE persistent object: the loop ring on the left, and on the right the
// rework budget as a physical ledger — ten pips laid out in rounds of three
// with a judge's gate after each round. Pips burn as refutations land; the
// judge's gavel opens the gate (progressing) or slams it (circling), and a
// halt flips the project state panel to invalid_loop and freezes the ring.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { LoopRing } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const RING = { cx: 380, cy: 330, r: 165 };
const STOPS = [
  { label: 'pick top task', color: colors.ACCENT },
  { label: 'builder', color: colors.SECONDARY },
  { label: 'claim + evidence', color: colors.SECONDARY },
  { label: 'critic', color: colors.NEGATIVE },
  { label: 'verdict', color: colors.WARM },
];

// the budget ledger: rounds of three, a judge gate after each full round
const LEDGER = { x: 690, y: 128, w: 500, rowH: 58 };
const PIP_DX = 52;
const ROWS = [
  { pips: 3, judge: true }, // attempts 1–3 → judge
  { pips: 3, judge: true }, // attempts 4–6 → judge
  { pips: 3, judge: true }, // attempts 7–9 → judge
  { pips: 1, judge: false }, // attempt 10 — the hard cap
];
const STATE = { x: 700, y: 408, w: 480, h: 186 };

const CAM_RING: CameraState = { x: 430, y: 330, k: 1.2 };
const CAM_LEDGER: CameraState = { x: 900, y: 250, k: 1.28 };
const CAM_STATE: CameraState = { x: 900, y: 440, k: 1.3 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 1.0 };

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ringU: ChannelRef<number>;
  orbitU: ChannelRef<number>; // laps around the loop
  ledgerU: ChannelRef<number>; // budget grid reveal
  burnU: ChannelRef<number>; // burned pips, continuous 0..6
  judge1U: ChannelRef<number>; // judge panel + first ruling: progressing
  ruleU: ChannelRef<number>; // "progressing" chip
  judge2U: ChannelRef<number>; // second ruling: circling → halt
  capU: ChannelRef<number>; // the hard cap highlight
  thrashU: ChannelRef<number>; // identical-finding-set tripwire
  stateU: ChannelRef<number>;
  flipU: ChannelRef<number>; // building → invalid_loop
  ringDim: ChannelRef<number>;
  humanU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const orbitU = tl.channel('orbitU', 0);
  const ledgerU = tl.channel('ledgerU', 0);
  const burnU = tl.channel('burnU', 0);
  const judge1U = tl.channel('judge1U', 0);
  const ruleU = tl.channel('ruleU', 0);
  const judge2U = tl.channel('judge2U', 0);
  const capU = tl.channel('capU', 0);
  const thrashU = tl.channel('thrashU', 0);
  const stateU = tl.channel('stateU', 0);
  const flipU = tl.channel('flipU', 0);
  const ringDim = tl.channel('ringDim', 0);
  const humanU = tl.channel('humanU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the loop as a ring —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Zoom out and the whole thing is one loop: take the top task, build, submit the claim and the evidence, face the critic, get a verdict. A refuted task loops back with the critic’s report as fresh context.',
  });
  tl.tween(cam, CAM_RING, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(ringU, 1, { at: 1.2, dur: 2.2, ease: ease.draw });
  tl.tween(orbitU, 2, { at: 3.6, dur: 3.4, ease: ease.linear });
  tl.hold(7.0, 0.6);

  // — Beat 2 · but rework is metered, in rounds of three —
  tl.caption({
    at: 7.6,
    dur: 7,
    text: 'But rework is not an open tab. The work queue meters it in rounds of three — each refutation burns one attempt, and when a round ends without a verified verdict, the loop does not simply spend another.',
  });
  tl.tween(cam, CAM_LEDGER, { at: 7.8, dur: 1.4, ease: ease.move });
  tl.tween(ledgerU, 1, { at: 8.5, dur: 1.8, ease: ease.draw });
  tl.tween(burnU, 3, { at: 10.8, dur: 3.2, ease: ease.linear });
  tl.hold(14.6, 0.6);

  // — Beat 3 · the progress judge —
  tl.caption({
    at: 15.2,
    dur: 7.5,
    text: 'Instead it calls in a third critic: the progress judge. Not the builder, not the critic that refuted — fresh eyes that read the successive verdicts, oldest first, and rule on exactly one question.',
  });
  tl.tween(judge1U, 1, { at: 15.8, dur: 1.2, ease: ease.enter });
  tl.hold(22.7, 0.6);

  // — Beat 4 · the one question: convergence —
  tl.caption({
    at: 23.3,
    dur: 8,
    text: 'Is the rework converging? Findings shrinking, or shifting to new, shallower ground — that is progress. The same class of failure, cosmetic changes, growing scope — that is circling. The judge fixes nothing; it only rules.',
  });
  tl.hold(31.3, 0.6);

  // — Beat 5 · progressing buys a round —
  tl.caption({
    at: 31.9,
    dur: 6.5,
    text: 'Only a progressing ruling buys the next round of three. The gate opens, the builder gets attempts four, five, and six — and at six the judge sits again. The check fires after attempts three, six, and nine.',
  });
  tl.tween(ruleU, 1, { at: 32.5, dur: 0.7, ease: ease.pop });
  tl.tween(burnU, 6, { at: 33.6, dur: 3.2, ease: ease.linear });
  tl.hold(38.4, 0.6);

  // — Beat 6 · the halt, and the hard cap —
  tl.caption({
    at: 39.0,
    dur: 7.5,
    text: 'Any other ruling is a halt, on the spot. And even a builder who keeps convincing the judge runs out of road: ten total attempts is the hard cap, and there is no eleventh.',
  });
  tl.tween(judge2U, 1, { at: 39.8, dur: 0.8, ease: ease.pop });
  tl.tween(capU, 1, { at: 43.0, dur: 1.0, ease: ease.enter });
  tl.hold(46.5, 0.6);

  // — Beat 7 · thrash detection —
  tl.caption({
    at: 47.1,
    dur: 6.5,
    text: 'One tripwire skips the judge entirely: if the critic refutes twice with the identical finding set, the rework is provably not converging, and the loop stops immediately.',
  });
  tl.tween(thrashU, 1, { at: 47.8, dur: 1.0, ease: ease.enter });
  tl.hold(53.6, 0.6);

  // — Beat 8 · the flip —
  tl.caption({
    at: 54.2,
    dur: 7,
    text: 'Every one of those stops lands in the same place. The loop flips the project status to invalid loop, writes down exactly why, commits — and the ring freezes.',
  });
  tl.tween(cam, CAM_STATE, { at: 54.4, dur: 1.4, ease: ease.move });
  tl.tween(stateU, 1, { at: 54.9, dur: 1.0, ease: ease.enter });
  tl.tween(flipU, 1, { at: 57.2, dur: 1.0, ease: ease.pop });
  tl.tween(ringDim, 1, { at: 57.8, dur: 1.2, ease: ease.move });
  tl.hold(61.2, 0.6);

  // — Beat 9 · a loud stop for a human —
  tl.caption({
    at: 61.8,
    dur: 7,
    text: 'That state is a loud stop for a human. The loop must not resume itself, and it must never route around the stop — routing around it would itself refute the loop.',
  });
  tl.tween(cam, CAM_WIDE, { at: 62.0, dur: 1.4, ease: ease.move });
  tl.tween(humanU, 1, { at: 62.8, dur: 0.9, ease: ease.enter });
  tl.hold(68.4, 0.6);

  // — Beat 10 · close —
  tl.caption({
    at: 69.0,
    dur: 7,
    text: 'Rounds of three, a judge between rounds, a cap of ten. A loop that can say I am stuck, out loud, in writing, is a loop you can leave running — the alternative is an agent quietly lowering the bar until everything passes.',
  });
  tl.tween(endDim, 1, { at: 69.3, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 70.2, dur: 0.9, ease: ease.enter });
  tl.hold(75.6, 1.2);

  return {
    tl, cam, ringU, orbitU, ledgerU, burnU, judge1U, ruleU, judge2U,
    capU, thrashU, stateU, flipU, ringDim, humanU, endDim, endU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

const STATES = ['building', 'complete', 'paused', 'invalid_loop'];

/** absolute pip index for row r, col c (rows of 3, then the cap pip) */
const pipIndex = (r: number, c: number) => r * 3 + c;

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ringU = s.get(scene.ringU);
  const orbitU = s.get(scene.orbitU);
  const ledgerU = s.get(scene.ledgerU);
  const burnU = s.get(scene.burnU);
  const judge1U = s.get(scene.judge1U);
  const ruleU = s.get(scene.ruleU);
  const judge2U = s.get(scene.judge2U);
  const capU = s.get(scene.capU);
  const thrashU = s.get(scene.thrashU);
  const stateU = s.get(scene.stateU);
  const flipU = s.get(scene.flipU);
  const ringDim = s.get(scene.ringDim);
  const humanU = s.get(scene.humanU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const worldOp = 1 - 0.85 * endDim;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the loop ring ---- */}
          <LoopRing
            cx={RING.cx}
            cy={RING.cy}
            r={RING.r}
            stops={STOPS}
            u={ringDim > 0.5 ? 0 : orbitU}
            reveal={ringU}
            color={colors.ACCENT}
            dim={ringDim}
            labelSize={13}
          />
          {ringU > 0.9 && (
            <text x={RING.cx} y={RING.cy + 6} textAnchor="middle" fill={ringDim > 0.5 ? colors.NEGATIVE : colors.MUTED} fontSize={12.5} fontFamily={MONO} opacity={0.9}>
              {ringDim > 0.5 ? 'loop frozen' : 'work-queue — the gauntlet, looped'}
            </text>
          )}

          {/* ---- the rework ledger: rounds of 3, judge gates, the cap ---- */}
          {ledgerU > 0 && (
            <g opacity={ledgerU * (1 - 0.5 * ringDim)}>
              <text x={LEDGER.x} y={LEDGER.y - 22} fill={colors.MUTED} fontSize={12}>
                rework budget
              </text>
              <text x={LEDGER.x + 116} y={LEDGER.y - 22} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                roundSize: 3 · maxAttempts: 10
              </text>
              {ROWS.map((row, r) => {
                const rowU = clamp01(ledgerU * (ROWS.length + 1) - r);
                if (rowU <= 0) return null;
                const y = LEDGER.y + r * LEDGER.rowH;
                const judgeRuled = r === 0 ? ruleU : r === 1 ? judge2U : 0;
                const judgeHalts = r === 1 && judge2U > 0.5;
                return (
                  <g key={r} opacity={rowU}>
                    <text x={LEDGER.x - 4} y={y + 13} fill={colors.MUTED} fontSize={10} fontFamily={MONO} textAnchor="end" opacity={0.8}>
                      {r < 3 ? `r${r + 1}` : 'cap'}
                    </text>
                    {Array.from({ length: row.pips }, (_, c) => {
                      const i = pipIndex(r, c);
                      const burned = clamp01(burnU - i);
                      const isCap = i === 9;
                      const stroke = isCap ? (capU > 0.3 ? colors.WARM : colors.MUTED) : burned > 0.5 ? colors.NEGATIVE : colors.MUTED;
                      return (
                        <g key={c} transform={`translate(${LEDGER.x + 16 + c * PIP_DX} ${y + 8})`}>
                          <circle r={11} fill={burned > 0.5 ? colors.NEGATIVE : colors.PANEL} stroke={stroke} strokeWidth={isCap && capU > 0.3 ? 2.4 : 2} opacity={burned > 0.5 ? 0.9 : 1} />
                          {burned > 0.5 && (
                            <g stroke={colors.BG} strokeWidth={2} strokeLinecap="round" opacity={burned}>
                              <line x1={-4} y1={-4} x2={4} y2={4} />
                              <line x1={4} y1={-4} x2={-4} y2={4} />
                            </g>
                          )}
                          {isCap && capU > 0.3 && (
                            <text x={20} y={4.5} fill={colors.WARM} fontSize={11} fontFamily={MONO} opacity={capU}>
                              attempt 10 — no eleventh
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {/* judge gate after each full round */}
                    {row.judge && (
                      <g transform={`translate(${LEDGER.x + 16 + 3 * PIP_DX + 26} ${y + 8})`}>
                        <path d="M 0 -12 L 12 0 L 0 12 L -12 0 Z" fill={judgeHalts ? colors.NEGATIVE : judgeRuled > 0.5 ? colors.POSITIVE : colors.PANEL} stroke={judgeHalts ? colors.NEGATIVE : judgeRuled > 0.5 ? colors.POSITIVE : colors.GRID} strokeWidth={1.6} opacity={judgeRuled > 0.5 ? 0.9 : 0.8} />
                        <text x={22} y={4.5} fill={judgeHalts ? colors.NEGATIVE : judgeRuled > 0.5 ? colors.POSITIVE : colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                          {judgeHalts ? 'judge: circling — halt' : judgeRuled > 0.5 ? 'judge: progressing' : `judge @ ${(r + 1) * 3}`}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* ---- the progress judge panel ---- */}
          {judge1U > 0 && (
            <g opacity={judge1U * (1 - 0.5 * ringDim)}>
              <rect x={LEDGER.x} y={LEDGER.y + 4 * LEDGER.rowH + 4} width={LEDGER.w} height={64} rx={12} fill={colors.PANEL} stroke={judge2U > 0.5 ? colors.NEGATIVE : colors.GRID} strokeWidth={1.5} />
              <text x={LEDGER.x + 16} y={LEDGER.y + 4 * LEDGER.rowH + 28} fill={colors.TEXT} fontSize={12.5} fontWeight={700}>
                the progress judge — a third critic, fresh eyes
              </text>
              <text x={LEDGER.x + 16} y={LEDGER.y + 4 * LEDGER.rowH + 48} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                reads successive verdicts · rules ONLY on convergence · fixes nothing
              </text>
            </g>
          )}

          {/* ---- the thrash tripwire ---- */}
          {thrashU > 0 && (
            <g opacity={thrashU * (1 - 0.5 * ringDim)} transform={`translate(${LEDGER.x} ${LEDGER.y + 4 * LEDGER.rowH + 84})`}>
              <path d="M 8 4 l 6 10 h -12 Z" fill={colors.NEGATIVE} opacity={0.9} />
              <text x={24} y={13} fill={colors.TEXT} fontSize={11.5}>
                identical finding set refuted twice → invalid loop, no judge needed
              </text>
            </g>
          )}

          {/* ---- the project state panel ---- */}
          {stateU > 0 && (
            <g opacity={stateU}>
              <rect x={STATE.x} y={STATE.y} width={STATE.w} height={STATE.h} rx={14} fill={colors.PANEL} stroke={flipU > 0.5 ? colors.NEGATIVE : colors.GRID} strokeWidth={flipU > 0.5 ? 2 : 1.5} />
              <text x={STATE.x + 18} y={STATE.y + 26} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                .eforest/project.json — status
              </text>
              {STATES.map((st, i) => {
                const active = flipU > 0.5 ? st === 'invalid_loop' : st === 'building';
                const color = st === 'invalid_loop' ? colors.NEGATIVE : st === 'complete' ? colors.POSITIVE : st === 'paused' ? colors.WARM : colors.ACCENT;
                return (
                  <g key={st} transform={`translate(${STATE.x + 18 + (i % 2) * 224} ${STATE.y + 44 + Math.floor(i / 2) * 42})`}>
                    <rect width={206} height={32} rx={9} fill={active ? color : 'none'} opacity={active ? 0.16 : 1} stroke={active ? color : colors.GRID} strokeWidth={active ? 1.8 : 1} />
                    <circle cx={18} cy={16} r={5} fill={active ? color : colors.GRID} />
                    <text x={34} y={21} fill={active ? colors.TEXT : colors.MUTED} fontSize={12.5} fontFamily={MONO} fontWeight={active ? 700 : 400}>
                      {st}
                    </text>
                  </g>
                );
              })}
              {flipU > 0.5 && (
                <text x={STATE.x + 18} y={STATE.y + 148} fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO} opacity={flipU}>
                  statusReason: “progress judge halted rework after 6 attempt(s)”
                </text>
              )}
              <text x={STATE.x + 18} y={STATE.y + 170} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={flipU}>
                committed — the stop is part of the history
              </text>
            </g>
          )}

          {/* ---- the human ---- */}
          {humanU > 0 && (
            <g opacity={humanU} transform={`translate(640 ${610 - (1 - humanU) * 10})`}>
              <rect x={-260} y={-24} width={520} height={40} rx={20} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
              <text y={2} textAnchor="middle" fill={colors.WARM} fontSize={13.5} fontWeight={700}>
                only a human flips it back to building
              </text>
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={310} y={262} width={660} height={124} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              rounds of three · a judge between rounds · a cap of ten
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              the loop would rather halt than lie
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
