// The Loop That Lies to Itself
//
// Backed by: /Users/brettlamy/Dev/electric-forest .claude/workflows/work-queue.js
// (the rework while-loop: verify-task → refuted → implement-task with the
// critic's report as rework context, again and again) and .eforest/loop.md
// (builder + critic, "refuted loops back"). The chapter's claim is the code's
// premise: the builder reads only the latest report (rework: true, report:
// verdict.report), the critic judges only the latest attempt — neither input
// contains the sequence. Convergence is a property of the trajectory, which
// is why work-queue.js later adds a third critic to read it (chapter 2).
//
// ONE persistent object: the trajectory plane. Verdicts start as ledger rows
// on the left, become points on a plane (findings count × depth of ground),
// and the two possible shapes — a spiral falling into the origin, an orbit
// that never approaches it — carry the whole argument.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const PAIR = { bx: 100, by: 130, cx: 380, cy: 130, w: 190, h: 74 };
const ROWS_Y = 288;
const ROW_H = 62;

// the trajectory plane — origin is "zero findings, verified"
const ORIGIN = { x: 700, y: 552 };
const PLANE = { x: 655, y: 140, w: 560, h: 440 };

/** converging rework: a decaying path into the origin (precomputed, pure) */
const CONV: { x: number; y: number }[] = Array.from({ length: 8 }, (_, k) => {
  if (k === 7) return { x: ORIGIN.x, y: ORIGIN.y };
  const r = 470 * Math.pow(0.66, k);
  const a = 0.35 + 0.18 * Math.sin(k * 2.1);
  return { x: ORIGIN.x + r * Math.cos(a), y: ORIGIN.y - r * Math.sin(a) };
});

/** circling rework: an orbit that never approaches the origin */
const ORBIT: { x: number; y: number }[] = Array.from({ length: 10 }, (_, k) => {
  const c = { x: 1005, y: 265 };
  const a = 1.1 - k * 0.75;
  const r = 100 + 10 * Math.sin(k * 1.9);
  return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
});

/** partial polyline path through points, u in [0, points.length - 1] */
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

const VOLLEYS = [
  { a: 'attempt 1', f: ['F1', 'F2', 'F3', 'F4'] },
  { a: 'attempt 2', f: ['F2', 'F4', 'F5', 'F6'] },
  { a: 'attempt 3', f: ['F1', 'F3', 'F5', 'F7'] },
];

const CAM_PAIR: CameraState = { x: 350, y: 300, k: 1.3 };
const CAM_PLANE: CameraState = { x: 935, y: 355, k: 1.18 };
const CAM_WIDE: CameraState = { x: 640, y: 355, k: 1.0 };

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pairU: ChannelRef<number>;
  volleyU: ChannelRef<number>; // 0..3 exchanges
  planeU: ChannelRef<number>;
  convU: ChannelRef<number>; // 0..7 along the spiral
  orbitU: ChannelRef<number>; // 0..9 along the orbit
  convDim: ChannelRef<number>;
  spotU: ChannelRef<number>; // "each sees one point"
  glowU: ChannelRef<number>; // the whole curve, owned by nobody
  leftDim: ChannelRef<number>;
  spendU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pairU = tl.channel('pairU', 0);
  const volleyU = tl.channel('volleyU', 0);
  const planeU = tl.channel('planeU', 0);
  const convU = tl.channel('convU', 0);
  const orbitU = tl.channel('orbitU', 0);
  const convDim = tl.channel('convDim', 0);
  const spotU = tl.channel('spotU', 0);
  const glowU = tl.channel('glowU', 0);
  const leftDim = tl.channel('leftDim', 0);
  const spendU = tl.channel('spendU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the pairing everyone knows —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'The loop books on this shelf all teach one shape: a builder makes a claim, a critic tries to break it. This book is about the failure that pairing cannot catch — a loop that reworks forever and never notices.',
  });
  tl.tween(cam, CAM_PAIR, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(pairU, 1, { at: 1.0, dur: 1.8, ease: ease.draw });
  tl.hold(7.5, 0.6);

  // — Beat 2 · attempt one, fairly refuted —
  tl.caption({
    at: 8.1,
    dur: 6,
    text: 'Watch a task go around. Attempt one comes back refuted with four findings. Fair findings — the critic is doing its job.',
  });
  tl.tween(volleyU, 1, { at: 8.6, dur: 1.6, ease: ease.move });
  tl.hold(14.1, 0.6);

  // — Beat 3 · every verdict locally reasonable —
  tl.caption({
    at: 14.7,
    dur: 7,
    text: 'Attempt two fixes those and comes back refuted with four different findings. Also fair. Attempt three, the same. Every single verdict is locally reasonable.',
  });
  tl.tween(volleyU, 3, { at: 15.2, dur: 3.6, ease: ease.linear });
  tl.hold(21.7, 0.6);

  // — Beat 4 · plot the sequence —
  tl.caption({
    at: 22.3,
    dur: 6.5,
    text: 'Now step back and plot the sequence. Give every verdict a point: how many findings it raised, and how deep the ground they touch.',
  });
  tl.tween(cam, CAM_PLANE, { at: 22.5, dur: 1.5, ease: ease.move });
  tl.tween(leftDim, 1, { at: 22.7, dur: 1.2, ease: ease.move });
  tl.tween(planeU, 1, { at: 23.2, dur: 1.8, ease: ease.draw });
  tl.hold(28.8, 0.6);

  // — Beat 5 · the spiral —
  tl.caption({
    at: 29.4,
    dur: 8,
    text: 'A healthy rework traces a spiral. Each attempt lands closer to the origin — fewer findings, shallower ground — until a verdict finally reaches zero and the critic writes verified.',
  });
  tl.tween(convU, 7, { at: 30.0, dur: 5.6, ease: ease.move });
  tl.hold(37.4, 0.6);

  // — Beat 6 · the orbit —
  tl.caption({
    at: 38.0,
    dur: 8,
    text: 'This task is doing something else. Same class of failure, cosmetic changes, scope creeping wider. The points orbit. The trajectory never approaches zero.',
  });
  tl.tween(convDim, 1, { at: 38.3, dur: 1.0, ease: ease.move });
  tl.tween(orbitU, 9, { at: 38.8, dur: 5.8, ease: ease.move });
  tl.hold(46.0, 0.6);

  // — Beat 7 · nobody sees the curve —
  tl.caption({
    at: 46.6,
    dur: 8,
    text: 'And here is the trap: nobody inside the loop can see this curve. The builder reads only the latest report. The critic judges only the latest attempt. Each of them sees exactly one point.',
  });
  tl.tween(spotU, 1, { at: 47.4, dur: 1.2, ease: ease.enter });
  tl.hold(54.6, 0.6);

  // — Beat 8 · convergence is a property of the trajectory —
  tl.caption({
    at: 55.2,
    dur: 6.5,
    text: 'Convergence is not a property of any verdict. It is a property of the trajectory — and the trajectory has no owner.',
  });
  tl.tween(spotU, 0, { at: 55.6, dur: 0.9, ease: ease.move });
  tl.tween(glowU, 1, { at: 56.2, dur: 1.4, ease: ease.move });
  tl.hold(61.7, 0.6);

  // — Beat 9 · the bill —
  tl.caption({
    at: 62.3,
    dur: 7,
    text: 'An orbit like this will burn tokens for as long as you let it, one plausible attempt at a time. Left alone, the loop lies to itself by never adding anything up.',
  });
  tl.tween(spendU, 1, { at: 63.0, dur: 1.2, ease: ease.enter });
  tl.hold(69.3, 0.6);

  // — Beat 10 · the teaser —
  tl.caption({
    at: 69.9,
    dur: 7.5,
    text: 'So the electric forest gives the trajectory a judge of its own. A third critic — neither the builder nor the one refuting — whose only job is to read the curve. That is the machine we open next.',
  });
  tl.tween(cam, CAM_WIDE, { at: 70.1, dur: 1.4, ease: ease.move });
  tl.tween(endDim, 1, { at: 70.4, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 71.4, dur: 0.9, ease: ease.enter });
  tl.hold(77.4, 1.2);

  return { tl, cam, pairU, volleyU, planeU, convU, orbitU, convDim, spotU, glowU, leftDim, spendU, endDim, endU };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pairU = s.get(scene.pairU);
  const volleyU = s.get(scene.volleyU);
  const planeU = s.get(scene.planeU);
  const convU = s.get(scene.convU);
  const orbitU = s.get(scene.orbitU);
  const convDim = s.get(scene.convDim);
  const spotU = s.get(scene.spotU);
  const glowU = s.get(scene.glowU);
  const leftDim = s.get(scene.leftDim);
  const spendU = s.get(scene.spendU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const worldOp = 1 - 0.85 * endDim;
  const spotPoint = ORBIT[6];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- LEFT: builder ↔ critic, and the volley ledger ---- */}
          {pairU > 0 && (
            <g opacity={Math.min(1, pairU * 2) * (1 - 0.85 * leftDim)}>
              <rect x={PAIR.bx} y={PAIR.by} width={PAIR.w} height={PAIR.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
              <text x={PAIR.bx + 16} y={PAIR.by + 32} fill={colors.TEXT} fontSize={14} fontWeight={700}>builder</text>
              <text x={PAIR.bx + 16} y={PAIR.by + 54} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>implement-task · rework: true</text>
              <rect x={PAIR.cx} y={PAIR.cy} width={PAIR.w} height={PAIR.h} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
              <text x={PAIR.cx + 16} y={PAIR.cy + 32} fill={colors.TEXT} fontSize={14} fontWeight={700}>critic</text>
              <text x={PAIR.cx + 16} y={PAIR.cy + 54} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>verify-task · verdict</text>
              {/* the loop arrows */}
              <path d={`M ${PAIR.bx + PAIR.w} ${PAIR.by + 22} h ${PAIR.cx - PAIR.bx - PAIR.w - 8} m -8 -5 l 8 5 l -8 5`} stroke={colors.GRID} strokeWidth={1.8} fill="none" opacity={pairU} />
              <path d={`M ${PAIR.cx} ${PAIR.by + 54} h ${-(PAIR.cx - PAIR.bx - PAIR.w - 8)} m 8 -5 l -8 5 l 8 5`} stroke={colors.GRID} strokeWidth={1.8} fill="none" opacity={pairU} />

              {/* volleys — each attempt refuted, each verdict fair */}
              {VOLLEYS.map((v, i) => {
                const u = clamp01(volleyU - i);
                if (u <= 0) return null;
                const y = ROWS_Y + i * ROW_H;
                return (
                  <g key={i} opacity={Math.min(1, u * 1.6)}>
                    <rect x={PAIR.bx} y={y} width={470} height={ROW_H - 14} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                    <text x={PAIR.bx + 14} y={y + 22} fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>{v.a}</text>
                    <text x={PAIR.bx + 14} y={y + 38} fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>refuted · 4 findings</text>
                    {v.f.map((f, j) => {
                      const fu = clamp01(u * 5 - 1 - j);
                      return (
                        <g key={f} opacity={fu} transform={`translate(${PAIR.bx + 250 + j * 54} ${y + 16})`}>
                          <rect width={46} height={20} rx={6} fill={colors.NEGATIVE} opacity={0.16} stroke={colors.NEGATIVE} strokeWidth={1} />
                          <text x={23} y={14} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>{f}</text>
                        </g>
                      );
                    })}
                    <text x={PAIR.bx + 250} y={y + 44} fill={colors.MUTED} fontSize={9.5} fontStyle="italic" opacity={u}>
                      fair on its own
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ---- RIGHT: the trajectory plane ---- */}
          {planeU > 0 && (
            <g opacity={planeU}>
              {/* axes from the origin */}
              <line x1={ORIGIN.x} y1={ORIGIN.y} x2={ORIGIN.x + (PLANE.w - 60) * planeU} y2={ORIGIN.y} stroke={colors.GRID} strokeWidth={1.6} />
              <line x1={ORIGIN.x} y1={ORIGIN.y} x2={ORIGIN.x} y2={ORIGIN.y - (PLANE.h - 40) * planeU} stroke={colors.GRID} strokeWidth={1.6} />
              <text x={ORIGIN.x + PLANE.w - 70} y={ORIGIN.y + 20} textAnchor="end" fill={colors.MUTED} fontSize={11}>how many findings →</text>
              <text x={ORIGIN.x - 14} y={ORIGIN.y - PLANE.h + 46} fill={colors.MUTED} fontSize={11} transform={`rotate(-90 ${ORIGIN.x - 14} ${ORIGIN.y - PLANE.h + 46})`} textAnchor="end">
                how deep the ground →
              </text>
              {/* the origin: zero findings, verified */}
              <circle cx={ORIGIN.x} cy={ORIGIN.y} r={7} fill={colors.POSITIVE} opacity={0.9} />
              <text x={ORIGIN.x + 14} y={ORIGIN.y + 20} fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>0 findings — verified</text>

              {/* converging spiral */}
              {convU > 0 && (
                <g opacity={1 - 0.75 * convDim}>
                  <path d={pathThrough(CONV, convU)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} opacity={0.85} />
                  {CONV.map((p, k) => (
                    <circle key={k} cx={p.x} cy={p.y} r={k === 7 ? 0 : 5.5} fill={colors.POSITIVE} opacity={clamp01(convU - k + 0.5)} />
                  ))}
                  {convU > 6.5 && (
                    <text x={CONV[2].x + 30} y={CONV[2].y - 14} fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} opacity={clamp01((convU - 6.5) * 2)}>
                      converging
                    </text>
                  )}
                </g>
              )}

              {/* the orbit */}
              {orbitU > 0 && (
                <g>
                  <path d={pathThrough(ORBIT, orbitU)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.2} opacity={0.85 + 0.15 * glowU} />
                  {ORBIT.map((p, k) => {
                    const isSpot = k === 6 && spotU > 0;
                    return (
                      <g key={k} opacity={clamp01(orbitU - k + 0.5)}>
                        {isSpot && <circle cx={p.x} cy={p.y} r={16} fill={colors.WARM} opacity={0.25 * spotU} />}
                        <circle cx={p.x} cy={p.y} r={5.5} fill={isSpot ? colors.WARM : colors.NEGATIVE} />
                      </g>
                    );
                  })}
                  {orbitU > 8.5 && (
                    <text x={1005} y={265} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700} opacity={clamp01((orbitU - 8.5) * 2) * (1 - spotU)}>
                      circling
                    </text>
                  )}
                </g>
              )}

              {/* "each sees one point" */}
              {spotU > 0 && (
                <g opacity={spotU}>
                  <rect x={spotPoint.x + 20} y={spotPoint.y - 34} width={218} height={44} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.3} />
                  <text x={spotPoint.x + 32} y={spotPoint.y - 16} fill={colors.WARM} fontSize={11} fontWeight={700}>one point, no curve</text>
                  <text x={spotPoint.x + 32} y={spotPoint.y - 1} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>report: verdict.report — latest only</text>
                </g>
              )}

              {/* the trajectory glow — the thing nobody owns */}
              {glowU > 0 && (
                <g opacity={glowU}>
                  <path d={pathThrough(ORBIT, 9)} fill="none" stroke={colors.WARM} strokeWidth={5} opacity={0.28} />
                  <text x={935} y={168} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontWeight={700}>
                    the trajectory — nobody's input, nobody's output
                  </text>
                </g>
              )}

              {/* the spend counter */}
              {spendU > 0 && (
                <g opacity={spendU}>
                  <rect x={680} y={196} width={190} height={52} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.3} />
                  <text x={694} y={218} fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700}>tokens burn per lap</text>
                  <text x={694} y={236} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>attempt n+1 always looks plausible</text>
                </g>
              )}
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={300} y={262} width={680} height={130} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              convergence lives in the trajectory
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              so the trajectory gets a judge of its own
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
