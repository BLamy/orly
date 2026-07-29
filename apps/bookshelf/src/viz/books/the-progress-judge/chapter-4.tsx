// When to Stop Honestly
//
// Backed by: /Users/brettlamy/Dev/electric-forest .claude/workflows/work-queue.js
// (roundSize 3, judge rulings at retries 3/6/9, maxAttempts 10, flipInvalid
// writing status + statusReason + commit) and .eforest/loop.md (the loop
// diagram: "rounds of 3 reworks; a progress judge rules between rounds;
// ≤ 10 total attempts"; invalid_loop as a loud stop; "wait for a human").
// The closing thesis chapter: an unbounded loop converts failure into spend,
// a bare cap without a judge kills converging work, and the judge is what
// lets the cap be generous. Recap of the three critics.
//
// ONE persistent object: the two trajectories from chapter one return in two
// framed panels — the orbit running forever under a climbing spend curve, the
// spiral guillotined by a low bare cap — then the judge dissolves the
// tradeoff, and the three critics line up with their fields of view.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const LP = { x: 90, y: 120, w: 520, h: 300 } as const; // unbounded loop panel
const RP = { x: 670, y: 120, w: 520, h: 300 } as const; // bare cap panel

/** the orbit, miniaturized inside the left panel */
const ORBIT: { x: number; y: number }[] = Array.from({ length: 12 }, (_, k) => {
  const c = { x: LP.x + 180, y: LP.y + 178 };
  const a = 1.1 - k * 0.75;
  const r = 74 + 8 * Math.sin(k * 1.9);
  return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
});

/** the spiral, miniaturized inside the right panel; needs 8 attempts to land */
const SPIRAL_O = { x: RP.x + 96, y: RP.y + 244 };
const SPIRAL: { x: number; y: number }[] = Array.from({ length: 9 }, (_, k) => {
  if (k === 8) return { x: SPIRAL_O.x, y: SPIRAL_O.y };
  const r = 300 * Math.pow(0.72, k);
  const a = 0.42 + 0.16 * Math.sin(k * 2.1);
  return { x: SPIRAL_O.x + r * Math.cos(a), y: SPIRAL_O.y - r * Math.sin(a) };
});
const BARE_CAP = 4; // a low cap kills it at attempt four

/** spend curve inside the left panel: climbs with each lap */
const SPEND = Array.from({ length: 12 }, (_, k) => ({
  x: LP.x + 336 + k * 13,
  y: LP.y + 250 - k * 15,
}));

function pathThrough(pts: { x: number; y: number }[], u: number): string {
  const n = Math.max(0, Math.min(u, pts.length - 1));
  const whole = Math.floor(n);
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i <= whole; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  const frac = n - whole;
  if (frac > 0 && whole < pts.length - 1) {
    const a = pts[whole];
    const b = pts[whole + 1];
    d += ` L ${a.x + (b.x - a.x) * frac} ${a.y + (b.y - a.y) * frac}`;
  }
  return d;
}

const CRITICS = [
  { name: 'the builder', sees: 'sees one attempt', code: 'implement-task · claim + evidence', color: colors.SECONDARY },
  { name: 'the refuting critic', sees: 'sees one verdict', code: 'verify-task · findings + citations', color: colors.NEGATIVE },
  { name: 'the progress judge', sees: 'sees the trajectory', code: 'progress-judge · { progressing, reason }', color: colors.WARM },
];
const CRIT_Y = 452;
const critX = (i: number) => 640 + (i - 1) * 372;

const CAM_LEFT: CameraState = { x: 350, y: 280, k: 1.26 };
const CAM_RIGHT: CameraState = { x: 930, y: 280, k: 1.26 };
const CAM_SPLIT: CameraState = { x: 640, y: 280, k: 1.02 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 1.0 };

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  framesU: ChannelRef<number>;
  orbitU: ChannelRef<number>; // laps forever
  spendU: ChannelRef<number>;
  spiralU: ChannelRef<number>;
  chopU: ChannelRef<number>; // the bare cap guillotine
  judgeU: ChannelRef<number>; // the judge dissolves the tradeoff
  numbersU: ChannelRef<number>; // 3 / 3-6-9 / 10 recap
  panelDim: ChannelRef<number>;
  criticsU: ChannelRef<number>; // 0..3 the three cards
  honestU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const framesU = tl.channel('framesU', 0);
  const orbitU = tl.channel('orbitU', 0);
  const spendU = tl.channel('spendU', 0);
  const spiralU = tl.channel('spiralU', 0);
  const chopU = tl.channel('chopU', 0);
  const judgeU = tl.channel('judgeU', 0);
  const numbersU = tl.channel('numbersU', 0);
  const panelDim = tl.channel('panelDim', 0);
  const criticsU = tl.channel('criticsU', 0);
  const honestU = tl.channel('honestU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the question —
  tl.caption({
    at: 0.5,
    dur: 7.5,
    text: 'End with the question every autonomous loop must answer: when do you stop? Get it wrong in one direction and failure becomes spend. Get it wrong in the other and you kill work that was about to land.',
  });
  tl.tween(framesU, 1, { at: 0.9, dur: 1.8, ease: ease.draw });
  tl.hold(8.0, 0.6);

  // — Beat 2 · unbounded —
  tl.caption({
    at: 8.6,
    dur: 7,
    text: 'An unbounded loop is the first failure. An orbiting task burns one plausible attempt after another, forever — the loop converts a hard bug into an open ended bill.',
  });
  tl.tween(cam, CAM_LEFT, { at: 8.8, dur: 1.4, ease: ease.move });
  tl.tween(orbitU, 11, { at: 9.4, dur: 5.0, ease: ease.linear });
  tl.tween(spendU, 11, { at: 9.4, dur: 5.0, ease: ease.linear });
  tl.hold(15.6, 0.6);

  // — Beat 3 · the bare cap —
  tl.caption({
    at: 16.2,
    dur: 8,
    text: 'A bare cap is the second. Without anyone reading the trajectory, the only safe cap is a small one — and a small cap executes the spiral that needed eight attempts, rounds short of verified.',
  });
  tl.tween(cam, CAM_RIGHT, { at: 16.4, dur: 1.4, ease: ease.move });
  tl.tween(spiralU, BARE_CAP - 1, { at: 17.0, dur: 2.6, ease: ease.move });
  tl.tween(chopU, 1, { at: 20.4, dur: 0.9, ease: ease.pop });
  tl.hold(24.2, 0.6);

  // — Beat 4 · the judge dissolves the tradeoff —
  tl.caption({
    at: 24.8,
    dur: 8,
    text: 'The progress judge dissolves that tradeoff. Circling is caught at attempt three, long before any cap matters — so the cap itself can afford to be generous. Ten attempts, for work that keeps earning them.',
  });
  tl.tween(cam, CAM_SPLIT, { at: 25.0, dur: 1.5, ease: ease.move });
  tl.tween(judgeU, 1, { at: 25.8, dur: 1.2, ease: ease.enter });
  tl.tween(spiralU, 8, { at: 28.4, dur: 2.8, ease: ease.move });
  tl.hold(32.4, 0.6);

  // — Beat 5 · why the numbers are the numbers —
  tl.caption({
    at: 33.0,
    dur: 7,
    text: 'That is why the budget reads the way it does: rounds of three, a ruling after attempts three, six, and nine, a hard ceiling at ten. Each number is affordable because the judge exists.',
  });
  tl.tween(numbersU, 1, { at: 33.6, dur: 1.2, ease: ease.enter });
  tl.hold(39.4, 0.6);

  // — Beat 6 · critic one and two —
  tl.caption({
    at: 40.0,
    dur: 7,
    text: 'So count the critics. The builder makes the claim — it sees one attempt. The refuting critic attacks the claim — it sees one verdict.',
  });
  tl.tween(cam, CAM_WIDE, { at: 40.2, dur: 1.4, ease: ease.move });
  tl.tween(panelDim, 1, { at: 40.4, dur: 1.2, ease: ease.move });
  tl.tween(criticsU, 2, { at: 41.2, dur: 2.6, ease: ease.move });
  tl.hold(46.4, 0.6);

  // — Beat 7 · the third —
  tl.caption({
    at: 47.0,
    dur: 7.5,
    text: 'And the progress judge watches the curve — the only participant whose input is the sequence itself, and whose entire output is one honest boolean and a reason.',
  });
  tl.tween(criticsU, 3, { at: 47.6, dur: 1.4, ease: ease.move });
  tl.hold(53.9, 0.6);

  // — Beat 8 · stopping honestly —
  tl.caption({
    at: 54.5,
    dur: 7.5,
    text: 'Stopping honestly means the halt is a first class result: a state, a reason, a commit, a human. Not a timeout, and not a silent retry counter buried in a log.',
  });
  tl.tween(honestU, 1, { at: 55.2, dur: 1.0, ease: ease.enter });
  tl.hold(61.4, 0.6);

  // — Beat 9 · the whole book —
  tl.caption({
    at: 62.0,
    dur: 8,
    text: 'A loop that can prove it is stuck earns the right to run unattended. That is the whole book: the loop itself can fail — and detecting that takes a third pair of eyes, watching the trajectory.',
  });
  tl.tween(endDim, 1, { at: 62.4, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 63.4, dur: 0.9, ease: ease.enter });
  tl.hold(69.8, 1.4);

  return { tl, cam, framesU, orbitU, spendU, spiralU, chopU, judgeU, numbersU, panelDim, criticsU, honestU, endDim, endU };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const framesU = s.get(scene.framesU);
  const orbitU = s.get(scene.orbitU);
  const spendU = s.get(scene.spendU);
  const spiralU = s.get(scene.spiralU);
  const chopU = s.get(scene.chopU);
  const judgeU = s.get(scene.judgeU);
  const numbersU = s.get(scene.numbersU);
  const panelDim = s.get(scene.panelDim);
  const criticsU = s.get(scene.criticsU);
  const honestU = s.get(scene.honestU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const worldOp = 1 - 0.85 * endDim;
  const panelOp = 1 - 0.82 * panelDim;
  const capX = SPIRAL[BARE_CAP - 1].x - 26;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          <g opacity={panelOp}>
            {/* ---- LEFT: the unbounded loop ---- */}
            {framesU > 0 && (
              <g opacity={Math.min(1, framesU * 2)}>
                <rect x={LP.x} y={LP.y} width={LP.w} height={LP.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={LP.x + 20} y={LP.y + 32} fill={colors.TEXT} fontSize={14.5} fontWeight={700}>no cap, no judge</text>
                <text x={LP.x + 20} y={LP.y + 52} fill={colors.MUTED} fontSize={10.5}>failure becomes spend</text>
                {orbitU > 0 && (
                  <g>
                    <path d={pathThrough(ORBIT, orbitU)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} opacity={0.8} />
                    {ORBIT.map((p, k) => (
                      <circle key={k} cx={p.x} cy={p.y} r={4.5} fill={colors.NEGATIVE} opacity={clamp01(orbitU - k + 0.5)} />
                    ))}
                  </g>
                )}
                {spendU > 0 && (
                  <g>
                    <line x1={LP.x + 336} y1={LP.y + 256} x2={LP.x + 490} y2={LP.y + 256} stroke={colors.GRID} strokeWidth={1.4} />
                    <path d={pathThrough(SPEND, spendU)} fill="none" stroke={colors.WARM} strokeWidth={2.2} opacity={0.9} />
                    <text x={LP.x + 336} y={LP.y + 82} fill={colors.WARM} fontSize={10.5} fontFamily={MONO} opacity={clamp01(spendU / 3)}>
                      tokens spent →
                    </text>
                    {spendU > 10.5 && (
                      <text x={LP.x + 490} y={LP.y + 96} textAnchor="end" fill={colors.WARM} fontSize={11} fontWeight={700} opacity={(spendU - 10.5) * 2}>
                        no landing
                      </text>
                    )}
                  </g>
                )}
              </g>
            )}

            {/* ---- RIGHT: the bare cap ---- */}
            {framesU > 0 && (
              <g opacity={Math.min(1, framesU * 2 - 0.4)}>
                <rect x={RP.x} y={RP.y} width={RP.w} height={RP.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={RP.x + 20} y={RP.y + 32} fill={colors.TEXT} fontSize={14.5} fontWeight={700}>a cap, but no judge</text>
                <text x={RP.x + 20} y={RP.y + 52} fill={colors.MUTED} fontSize={10.5}>the safe cap is a low cap — and the low cap kills converging work</text>
                {spiralU > 0 && (
                  <g>
                    <circle cx={SPIRAL_O.x} cy={SPIRAL_O.y} r={6} fill={colors.POSITIVE} opacity={0.9} />
                    <text x={SPIRAL_O.x + 12} y={SPIRAL_O.y + 16} fill={colors.POSITIVE} fontSize={9.5} fontFamily={MONO}>verified</text>
                    <path d={pathThrough(SPIRAL, spiralU)} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={0.85} />
                    {SPIRAL.map((p, k) => (
                      <circle key={k} cx={p.x} cy={p.y} r={k === 8 ? 0 : 4.5} fill={colors.POSITIVE} opacity={clamp01(spiralU - k + 0.5)} />
                    ))}
                  </g>
                )}
                {/* the guillotine at the bare cap */}
                {chopU > 0 && (
                  <g opacity={chopU * (1 - 0.75 * judgeU)}>
                    <line x1={capX} y1={RP.y + 66} x2={capX} y2={RP.y + LP.h - 24} stroke={colors.NEGATIVE} strokeWidth={2.4} strokeDasharray="7 5" />
                    <text x={capX - 8} y={RP.y + 84} textAnchor="end" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO}>
                      cap: {BARE_CAP} — killed here
                    </text>
                  </g>
                )}
                {judgeU > 0.5 && spiralU > 7.5 && (
                  <text x={RP.x + RP.w - 24} y={RP.y + LP.h - 30} textAnchor="end" fill={colors.POSITIVE} fontSize={11} fontWeight={700} opacity={(spiralU - 7.5) * 2}>
                    lands at attempt eight
                  </text>
                )}
              </g>
            )}
          </g>

          {/* ---- the judge between the panels ---- */}
          {judgeU > 0 && (
            <g opacity={judgeU * panelOp} transform={`translate(640 ${LP.y + 150})`}>
              <path d="M 0 -30 L 26 0 L 0 30 L -26 0 Z" fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
              <text y={5} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily={MONO}>judge</text>
              <text y={52} textAnchor="middle" fill={colors.MUTED} fontSize={10}>circling stopped at three</text>
              <text y={68} textAnchor="middle" fill={colors.MUTED} fontSize={10}>converging runs to ten</text>
            </g>
          )}

          {/* ---- the numbers ---- */}
          {numbersU > 0 && (
            <g opacity={numbersU * panelOp} transform="translate(640 470)">
              <rect x={-330} y={-26} width={660} height={48} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
              <text y={4} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                roundSize: 3 · judge @ 3, 6, 9 · maxAttempts: 10
              </text>
            </g>
          )}

          {/* ---- the three critics ---- */}
          {criticsU > 0 && (
            <g>
              {CRITICS.map((c, i) => {
                const u = clamp01(criticsU - i);
                if (u <= 0) return null;
                const x = critX(i);
                return (
                  <g key={c.name} opacity={u} transform={`translate(0 ${(1 - u) * 16})`}>
                    <rect x={x - 172} y={CRIT_Y - 54} width={344} height={108} rx={13} fill={colors.PANEL} stroke={c.color} strokeWidth={1.6} />
                    <text x={x} y={CRIT_Y - 24} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={700}>{c.name}</text>
                    <text x={x} y={CRIT_Y} textAnchor="middle" fill={c.color} fontSize={12.5} fontWeight={700}>{c.sees}</text>
                    <text x={x} y={CRIT_Y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>{c.code}</text>
                    {i < 2 && u > 0.9 && (
                      <path d={`M ${x + 178} ${CRIT_Y} l 14 0 m -5 -5 l 5 5 l -5 5`} stroke={colors.MUTED} strokeWidth={1.6} fill="none" opacity={(u - 0.9) * 10} />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* ---- stopping honestly ---- */}
          {honestU > 0 && (
            <g opacity={honestU} transform="translate(640 588)">
              <rect x={-330} y={-22} width={660} height={40} rx={20} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
              <text y={4} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
                a state · a reason · a commit · a human
              </text>
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={290} y={262} width={700} height={130} rx={16} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              the loop itself can fail
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              detecting that takes a third pair of eyes on the trajectory
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
