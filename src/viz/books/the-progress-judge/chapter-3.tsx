// Thrash, the Cap, and the Loud Stop
//
// Backed by: /Users/brettlamy/Dev/electric-forest .claude/workflows/work-queue.js —
// thrash detection runs BEFORE the judge: reportKey = findings.map(f =>
// `${f.kind}:${f.citation}`).sort().join('|'); if seenReports already
// includes the key → flipInvalid("refuted twice with the identical finding
// set — rework is not converging") with no judge consulted; maxAttempts = 10
// (`retries < maxAttempts`, failure past it → flipInvalid); flipInvalid edits
// .eforest/project.json (status "invalid_loop", statusReason, updatedAt),
// runs build_queue.py and commits "loop: invalid_loop — <reason>". And
// .eforest/loop.md: states building / complete / paused / invalid_loop;
// "invalid_loop is a loud stop ... wait for a human. Routing around it is
// itself a refutation of the loop."
//
// ONE persistent object: the fingerprint ledger. Findings compress into a
// sorted key, keys accumulate in seenReports, a duplicate key snaps the
// tripwire (judge greyed out, never consulted), the cap pip burns, and every
// stop funnels into the same project-state flip — written, committed, loud.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const MACHINE = { x: 100, y: 116, w: 500, h: 250 };
const SEEN = { x: 100, y: 392, w: 500, h: 168 };
const JUDGE = { x: 660, y: 116, w: 250, h: 120 };
const CAP = { x: 660, y: 262, w: 250, h: 104 };
const STATE = { x: 660, y: 392, w: 520, h: 200 };

const KEY_1 = 'kindA:citeA|kindB:citeB|kindC:citeC';
const KEY_2 = 'kindA:citeD|kindB:citeB|kindD:citeE';

const STATES = ['building', 'complete', 'paused', 'invalid_loop'];

const CAM_MACHINE: CameraState = { x: 380, y: 260, k: 1.3 };
const CAM_SEEN: CameraState = { x: 400, y: 420, k: 1.3 };
const CAM_RIGHT: CameraState = { x: 850, y: 250, k: 1.3 };
const CAM_STATE: CameraState = { x: 880, y: 460, k: 1.24 };
const CAM_WIDE: CameraState = { x: 640, y: 350, k: 1.0 };

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  machineU: ChannelRef<number>;
  keyU: ChannelRef<number>; // chips → sorted key
  seenU: ChannelRef<number>; // the seenReports list
  matchU: ChannelRef<number>; // the duplicate arrives + snaps
  skipU: ChannelRef<number>; // judge greyed — not consulted
  capU: ChannelRef<number>;
  stateU: ChannelRef<number>;
  flipU: ChannelRef<number>;
  loudU: ChannelRef<number>; // routing-around barrier
  humanU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const machineU = tl.channel('machineU', 0);
  const keyU = tl.channel('keyU', 0);
  const seenU = tl.channel('seenU', 0);
  const matchU = tl.channel('matchU', 0);
  const skipU = tl.channel('skipU', 0);
  const capU = tl.channel('capU', 0);
  const stateU = tl.channel('stateU', 0);
  const flipU = tl.channel('flipU', 0);
  const loudU = tl.channel('loudU', 0);
  const humanU = tl.channel('humanU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the shortcut exists —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'One kind of non convergence needs no judgment at all. Before the judge is ever consulted, the loop fingerprints every refutation.',
  });
  tl.tween(cam, CAM_MACHINE, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(machineU, 1, { at: 1.0, dur: 1.8, ease: ease.draw });
  tl.hold(6.5, 0.6);

  // — Beat 2 · the fingerprint —
  tl.caption({
    at: 7.1,
    dur: 7.5,
    text: 'Each finding is reduced to its kind and its citation. The pairs are sorted, joined, and the result is a key — a fingerprint of exactly what failed, and where.',
  });
  tl.tween(keyU, 1, { at: 7.7, dur: 3.2, ease: ease.move });
  tl.hold(14.6, 0.6);

  // — Beat 3 · the memory —
  tl.caption({
    at: 15.2,
    dur: 6.5,
    text: 'The loop keeps every fingerprint it has seen for this task. When a new refutation arrives, its key is checked against that list first — before anything else happens.',
  });
  tl.tween(cam, CAM_SEEN, { at: 15.4, dur: 1.3, ease: ease.move });
  tl.tween(seenU, 1, { at: 15.9, dur: 2.0, ease: ease.draw });
  tl.hold(21.7, 0.6);

  // — Beat 4 · two identical fingerprints are a proof —
  tl.caption({
    at: 22.3,
    dur: 7.5,
    text: 'If the identical fingerprint ever appears twice, the case is already closed. Two refutations with the exact same finding set are a proof, not an opinion: the rework changed nothing that mattered.',
  });
  tl.tween(matchU, 1, { at: 23.1, dur: 1.6, ease: ease.move });
  tl.hold(29.8, 0.6);

  // — Beat 5 · the judge is skipped —
  tl.caption({
    at: 30.4,
    dur: 6.5,
    text: 'So thrash skips the court entirely. No judge is convened, no next attempt is granted — the loop flips straight to invalid, immediately.',
  });
  tl.tween(cam, CAM_RIGHT, { at: 30.6, dur: 1.4, ease: ease.move });
  tl.tween(skipU, 1, { at: 31.2, dur: 1.2, ease: ease.enter });
  tl.hold(36.9, 0.6);

  // — Beat 6 · the cap —
  tl.caption({
    at: 37.5,
    dur: 7.5,
    text: 'The other absolute is the cap. Ten total attempts, and there is no eleventh — even a builder who convinces the judge at three, six, and nine runs out of road at ten.',
  });
  tl.tween(capU, 1, { at: 38.2, dur: 1.4, ease: ease.enter });
  tl.hold(45.0, 0.6);

  // — Beat 7 · the flip —
  tl.caption({
    at: 45.6,
    dur: 7.5,
    text: 'Every stop lands in the same place. The loop edits the project file: the status becomes invalid loop, the reason is written out in full, and the change is committed into history.',
  });
  tl.tween(cam, CAM_STATE, { at: 45.8, dur: 1.4, ease: ease.move });
  tl.tween(stateU, 1, { at: 46.4, dur: 1.2, ease: ease.enter });
  tl.tween(flipU, 1, { at: 49.0, dur: 1.0, ease: ease.pop });
  tl.hold(53.1, 0.6);

  // — Beat 8 · one of four states —
  tl.caption({
    at: 53.7,
    dur: 7,
    text: 'Invalid loop is one of four states a project can be in — building, complete, paused, or this. And it is the loudest of the four: the loop must not resume itself.',
  });
  tl.hold(60.7, 0.6);

  // — Beat 9 · routing around is a refutation —
  tl.caption({
    at: 61.3,
    dur: 7.5,
    text: 'The spec is explicit about the temptation. Routing around the stop is itself a refutation of the loop — a system that quietly works around its own alarm has proven the alarm decorative.',
  });
  tl.tween(loudU, 1, { at: 62.0, dur: 1.2, ease: ease.enter });
  tl.hold(68.8, 0.6);

  // — Beat 10 · cheap to trust —
  tl.caption({
    at: 69.4,
    dur: 7.5,
    text: 'So the stop is designed to be expensive to ignore and cheap to trust: the reason on record, the commit in the history, and a human summoned to decide what happens next.',
  });
  tl.tween(cam, CAM_WIDE, { at: 69.6, dur: 1.4, ease: ease.move });
  tl.tween(endDim, 1, { at: 70.2, dur: 1.2, ease: ease.move });
  tl.tween(humanU, 1, { at: 71.0, dur: 0.9, ease: ease.enter });
  tl.tween(endU, 1, { at: 71.6, dur: 0.9, ease: ease.enter });
  tl.hold(76.9, 1.2);

  return { tl, cam, machineU, keyU, seenU, matchU, skipU, capU, stateU, flipU, loudU, humanU, endDim, endU };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

const CHIPS = [
  { kind: 'kindC', cite: 'citeC' },
  { kind: 'kindA', cite: 'citeA' },
  { kind: 'kindB', cite: 'citeB' },
];

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const machineU = s.get(scene.machineU);
  const keyU = s.get(scene.keyU);
  const seenU = s.get(scene.seenU);
  const matchU = s.get(scene.matchU);
  const skipU = s.get(scene.skipU);
  const capU = s.get(scene.capU);
  const stateU = s.get(scene.stateU);
  const flipU = s.get(scene.flipU);
  const loudU = s.get(scene.loudU);
  const humanU = s.get(scene.humanU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const worldOp = 1 - 0.85 * endDim;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the fingerprint machine ---- */}
          {machineU > 0 && (
            <g opacity={Math.min(1, machineU * 2)}>
              <rect x={MACHINE.x} y={MACHINE.y} width={MACHINE.w} height={MACHINE.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={MACHINE.x + 20} y={MACHINE.y + 32} fill={colors.TEXT} fontSize={15} fontWeight={700}>the fingerprint</text>
              <text x={MACHINE.x + 20} y={MACHINE.y + 54} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                findings.map(f =&gt; kind + ':' + citation)
              </text>
              {/* finding chips, unsorted */}
              {CHIPS.map((c, i) => {
                const u = clamp01(machineU * 4 - 1 - i);
                // sorted target order: kindA(1) kindB(2) kindC(0)
                const sortedPos = c.kind === 'kindA' ? 0 : c.kind === 'kindB' ? 1 : 2;
                const x0 = MACHINE.x + 24 + i * 156;
                const x1 = MACHINE.x + 24 + sortedPos * 156;
                const x = x0 + (x1 - x0) * clamp01(keyU * 2);
                return (
                  <g key={i} opacity={u} transform={`translate(${x} ${MACHINE.y + 74})`}>
                    <rect width={144} height={30} rx={8} fill={colors.NEGATIVE} opacity={0.14} stroke={colors.NEGATIVE} />
                    <text x={72} y={20} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>
                      {c.kind}:{c.cite}
                    </text>
                  </g>
                );
              })}
              {keyU > 0.4 && (
                <g opacity={clamp01((keyU - 0.4) * 2.5)}>
                  <text x={MACHINE.x + 20} y={MACHINE.y + 138} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                    .sort().join('|') →
                  </text>
                  <rect x={MACHINE.x + 20} y={MACHINE.y + 150} width={MACHINE.w - 40} height={34} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
                  <text x={MACHINE.x + 34} y={MACHINE.y + 172} fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>{KEY_1}</text>
                  <text x={MACHINE.x + 20} y={MACHINE.y + 212} fill={colors.MUTED} fontSize={10.5} fontStyle="italic">
                    one string — exactly what failed, and where
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---- seenReports ---- */}
          {seenU > 0 && (
            <g opacity={Math.min(1, seenU * 2)}>
              <rect x={SEEN.x} y={SEEN.y} width={SEEN.w} height={SEEN.h} rx={14} fill={colors.PANEL} stroke={matchU > 0.6 ? colors.NEGATIVE : colors.GRID} strokeWidth={matchU > 0.6 ? 2 : 1.5} />
              <text x={SEEN.x + 20} y={SEEN.y + 30} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>seenReports</text>
              <text x={SEEN.x + 150} y={SEEN.y + 30} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>every fingerprint this task has produced</text>
              {[KEY_1, KEY_2].map((k, i) => (
                <g key={i} opacity={clamp01(seenU * 2 - i * 0.5)}>
                  <rect x={SEEN.x + 20} y={SEEN.y + 44 + i * 34} width={SEEN.w - 40} height={26} rx={7} fill={colors.BG} stroke={i === 0 && matchU > 0.6 ? colors.NEGATIVE : colors.GRID} strokeWidth={i === 0 && matchU > 0.6 ? 1.8 : 1} />
                  <text x={SEEN.x + 32} y={SEEN.y + 62 + i * 34} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>{k}</text>
                </g>
              ))}
              {/* the duplicate arriving */}
              {matchU > 0 && (
                <g opacity={Math.min(1, matchU * 1.6)}>
                  <g transform={`translate(${SEEN.x + 20} ${SEEN.y + 118 - (1 - Math.min(1, matchU * 1.4)) * 26})`}>
                    <rect width={SEEN.w - 40} height={26} rx={7} fill={colors.NEGATIVE} opacity={0.14} stroke={colors.NEGATIVE} strokeWidth={1.8} />
                    <text x={12} y={18} fill={colors.NEGATIVE} fontSize={10} fontFamily={MONO}>{KEY_1}</text>
                  </g>
                  {matchU > 0.6 && (
                    <text x={SEEN.x + SEEN.w - 26} y={SEEN.y + 158} textAnchor="end" fill={colors.NEGATIVE} fontSize={11} fontWeight={700} opacity={(matchU - 0.6) * 2.5}>
                      identical finding set, twice → invalid loop, now
                    </text>
                  )}
                </g>
              )}
            </g>
          )}

          {/* ---- the judge, not consulted ---- */}
          {skipU > 0 && (
            <g opacity={skipU}>
              <rect x={JUDGE.x} y={JUDGE.y} width={JUDGE.w} height={JUDGE.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} opacity={0.45} />
              <text x={JUDGE.x + 18} y={JUDGE.y + 32} fill={colors.MUTED} fontSize={13.5} fontWeight={700} opacity={0.6}>the progress judge</text>
              <line x1={JUDGE.x + 16} y1={JUDGE.y + 60} x2={JUDGE.x + JUDGE.w - 16} y2={JUDGE.y + 60} stroke={colors.NEGATIVE} strokeWidth={2} opacity={0.7} />
              <text x={JUDGE.x + 18} y={JUDGE.y + 88} fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>not consulted</text>
              <text x={JUDGE.x + 18} y={JUDGE.y + 106} fill={colors.MUTED} fontSize={9.5}>thrash is a proof — no ruling needed</text>
            </g>
          )}

          {/* ---- the cap ---- */}
          {capU > 0 && (
            <g opacity={capU}>
              <rect x={CAP.x} y={CAP.y} width={CAP.w} height={CAP.h} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
              <text x={CAP.x + 18} y={CAP.y + 30} fill={colors.WARM} fontSize={13.5} fontWeight={700}>the hard cap</text>
              <text x={CAP.x + 18} y={CAP.y + 52} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>retries &lt; maxAttempts · 10</text>
              <text x={CAP.x + 18} y={CAP.y + 78} fill={colors.TEXT} fontSize={11.5}>there is no eleventh attempt</text>
            </g>
          )}

          {/* ---- the project state flip ---- */}
          {stateU > 0 && (
            <g opacity={stateU}>
              <rect x={STATE.x} y={STATE.y} width={STATE.w} height={STATE.h} rx={14} fill={colors.PANEL} stroke={flipU > 0.5 ? colors.NEGATIVE : colors.GRID} strokeWidth={flipU > 0.5 ? 2 : 1.5} />
              <text x={STATE.x + 18} y={STATE.y + 26} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                .eforest/project.json
              </text>
              {STATES.map((st, i) => {
                const active = flipU > 0.5 ? st === 'invalid_loop' : st === 'building';
                const color = st === 'invalid_loop' ? colors.NEGATIVE : st === 'complete' ? colors.POSITIVE : st === 'paused' ? colors.WARM : colors.ACCENT;
                return (
                  <g key={st} transform={`translate(${STATE.x + 18 + i * 124} ${STATE.y + 40})`}>
                    <rect width={114} height={30} rx={8} fill={active ? color : 'none'} opacity={active ? 0.16 : 1} stroke={active ? color : colors.GRID} strokeWidth={active ? 1.8 : 1} />
                    <text x={57} y={20} textAnchor="middle" fill={active ? colors.TEXT : colors.MUTED} fontSize={10.5} fontFamily={MONO} fontWeight={active ? 700 : 400}>
                      {st}
                    </text>
                  </g>
                );
              })}
              {flipU > 0.5 && (
                <g opacity={flipU}>
                  <text x={STATE.x + 18} y={STATE.y + 102} fill={colors.NEGATIVE} fontSize={10} fontFamily={MONO}>
                    statusReason: "refuted twice with the identical finding set —
                  </text>
                  <text x={STATE.x + 18} y={STATE.y + 118} fill={colors.NEGATIVE} fontSize={10} fontFamily={MONO}>
                    rework is not converging"
                  </text>
                  <text x={STATE.x + 18} y={STATE.y + 142} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
                    git commit — "loop: invalid_loop — …" · the stop is in the history
                  </text>
                </g>
              )}
              {loudU > 0 && (
                <text x={STATE.x + 18} y={STATE.y + 174} fill={colors.WARM} fontSize={11} fontStyle="italic" opacity={loudU}>
                  routing around it is itself a refutation of the loop
                </text>
              )}
            </g>
          )}

          {/* ---- the human ---- */}
          {humanU > 0 && (
            <g opacity={humanU} transform={`translate(640 ${614 - (1 - humanU) * 10})`}>
              <rect x={-250} y={-22} width={500} height={38} rx={19} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
              <text y={3} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700}>
                wait for a human — only a human resumes the loop
              </text>
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={300} y={252} width={680} height={124} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              expensive to ignore, cheap to trust
            </text>
            <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              a reason on record, a commit in the history, a human summoned
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
