// The Fiber Tree
//
// Grounding: packages/effect/src/Fiber.ts ("A runtime fiber is a lightweight
// thread that executes Effects. Fibers are the unit of concurrency in
// Effect... structured concurrency and cancellation safety"),
// packages/effect/src/Effect.ts — forkChild (child fiber of the current
// fiber), forkScoped ("Forks the fiber in a Scope, interrupting it when the
// scope is closed"), forkDetach ("attached to the global scope... when the
// fiber executing the returned effect terminates, the forked fiber will
// continue running"), and packages/effect/src/FiberSet.ts ("tracks running
// fibers, removes each fiber when it completes, and interrupts all
// still-running fibers when the owning scope closes"; FiberSet.make /
// FiberSet.run / FiberSet.awaitEmpty).
//
// Centerpiece: a LIVING FIBER TREE on a time axis. The main fiber is a trunk
// growing left to right; every fork sprouts a branch that keeps growing in
// real time. A Scope is a dashed box whose closing sweeps interruption
// through everything inside; a detached fiber escapes ownership and outlives
// its parent; a FiberSet reaps a whole population at once.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Tree geometry — the trunk runs left→right; branches split off diagonally
// then run parallel. Every line is a polyline drawn partially by a 0..1 head.
// ---------------------------------------------------------------------------

const X0 = 100;
const XEND = 1150;
const TRUNK_Y = 380;

type Pt = { x: number; y: number };

/** partial polyline path: draw up to fraction u of total length */
function partialD(pts: Pt[], u: number): string {
  if (u <= 0.0001) return '';
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    segs.push(d);
    total += d;
  }
  let remain = total * clamp01(u);
  const out = [`M${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length; i++) {
    if (remain >= segs[i - 1]) {
      out.push(`L${pts[i].x} ${pts[i].y}`);
      remain -= segs[i - 1];
    } else {
      const f = remain / segs[i - 1];
      out.push(
        `L${pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f} ${pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f}`,
      );
      return out.join('');
    }
  }
  return out.join('');
}

/** point at fraction u along polyline */
function alongPt(pts: Pt[], u: number): Pt {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    segs.push(d);
    total += d;
  }
  let remain = total * clamp01(u);
  for (let i = 1; i < pts.length; i++) {
    if (remain <= segs[i - 1]) {
      const f = remain / segs[i - 1];
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
      };
    }
    remain -= segs[i - 1];
  }
  return pts[pts.length - 1];
}

/** child branch polyline: fork point on trunk → diagonal → lane */
function branch(forkX: number, laneY: number, tipX: number): Pt[] {
  return [
    { x: forkX, y: TRUNK_Y },
    { x: forkX + 46, y: laneY },
    { x: tipX, y: laneY },
  ];
}

// children of the main fiber (Effect.forkChild) — lanes stack upward
const CHILD_A = branch(300, 300, 1020);
const CHILD_B = branch(400, 232, 1020);
const CHILD_C = branch(500, 164, 1020);
// detached fiber (Effect.forkDetach) — top lane, outlives everything
const DETACH = branch(770, 100, 1190);
// scoped fibers (Effect.forkScoped) — lanes below the trunk, inside the Scope
const SCOPE_BOX = { x: 570, y: 428, w: 440, h: 178 };
const SCOPED_1 = branch(614, 480, 980);
const SCOPED_2 = branch(676, 552, 980);

// FiberSet panel — 8 mini fibers; 4 complete on their own, 4 get reaped
const SET_BOX = { x: 380, y: 168, w: 520, h: 400 };
const rand = mulberry32(11);
const MINIS = Array.from({ length: 8 }, (_, i) => ({
  y: SET_BOX.y + 64 + i * 42,
  len: 220 + rand() * 210,
  done: i % 2 === 0, // evens complete and remove themselves
}));

const CAM_FORK: CameraState = { x: 420, y: 320, k: 1.5 };
const CAM_SCOPE: CameraState = { x: 760, y: 440, k: 1.35 };
const CAM_SET: CameraState = { x: 640, y: 368, k: 1.18 };

// ---------------------------------------------------------------------------
// Timeline (~73s, 11 beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const axisU = tl.channel('axisU', 0); // time axis + request chip
  const trunkU = tl.channel('trunkU', 0); // main fiber head, 0..1 of X0..XEND
  const aU = tl.channel('aU', 0); // child A growth
  const bU = tl.channel('bU', 0); // child B growth
  const cU = tl.channel('cU', 0); // child C growth
  const treeLblU = tl.channel('treeLblU', 0); // "a tree, not a pile"
  const scopeU = tl.channel('scopeU', 0); // Scope box draw-on
  const s1U = tl.channel('s1U', 0); // scoped fiber 1
  const s2U = tl.channel('s2U', 0); // scoped fiber 2
  const scopeReapU = tl.channel('scopeReapU', 0); // scope close: red sweep
  const detachU = tl.channel('detachU', 0); // detached fiber growth
  const mainDoneU = tl.channel('mainDoneU', 0); // trunk completes (green cap)
  const kidReapU = tl.channel('kidReapU', 0); // children interrupted with parent
  const soloU = tl.channel('soloU', 0); // dim stage around the survivor
  const setU = tl.channel('setU', 0); // FiberSet panel enters (tree fades)
  const miniU = tl.channel('miniU', 0); // minis grow (staggered)
  const miniDoneU = tl.channel('miniDoneU', 0); // evens complete + remove
  const setReapU = tl.channel('setReapU', 0); // owning scope closes
  const recapU = tl.channel('recapU', 0); // closing panel

  // — beat 1 · a request never runs alone —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Meet a request in production. It never runs alone — it spawns retries, timeouts, and background work. In Effect, every one of those runs on a fiber.',
  });
  tl.tween(axisU, 1, { at: 0.6, dur: 0.9, ease: ease.enter });
  tl.tween(trunkU, 0.17, { at: 1.4, dur: 4.6, ease: ease.linear });

  // — beat 2 · the first fork —
  tl.caption({
    at: 7.2,
    dur: 5.6,
    text: "Forking a child starts a new fiber. It's not a thread — it's a lightweight description the runtime schedules, so thousands of them are cheap.",
  });
  tl.tween(cam, CAM_FORK, { at: 7.3, dur: 1.3, ease: ease.move });
  tl.tween(trunkU, 0.3, { at: 7.2, dur: 5.6, ease: ease.linear });
  tl.tween(aU, 0.4, { at: 7.8, dur: 4.8, ease: ease.linear });

  // — beat 3 · fork again and again —
  tl.caption({
    at: 13.3,
    dur: 5.2,
    text: 'Fork again and again. Each child remembers who forked it — the fibers form a tree, not a pile.',
  });
  tl.tween(trunkU, 0.42, { at: 13.3, dur: 5.2, ease: ease.linear });
  tl.tween(aU, 0.62, { at: 13.3, dur: 5.2, ease: ease.linear });
  tl.tween(bU, 0.5, { at: 13.6, dur: 4.9, ease: ease.linear });
  tl.tween(cU, 0.42, { at: 14.4, dur: 4.1, ease: ease.linear });

  // — beat 4 · the shape is the trick —
  tl.caption({
    at: 19.0,
    dur: 5.6,
    text: 'That shape is the whole trick. Structured concurrency means ownership: every fiber has a parent responsible for it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 19.2, dur: 1.5, ease: ease.move });
  tl.tween(treeLblU, 1, { at: 20.4, dur: 0.7, ease: ease.enter });
  tl.tween(trunkU, 0.5, { at: 19.0, dur: 5.6, ease: ease.linear });
  tl.tween(aU, 0.72, { at: 19.0, dur: 5.6, ease: ease.linear });
  tl.tween(bU, 0.62, { at: 19.0, dur: 5.6, ease: ease.linear });
  tl.tween(cU, 0.55, { at: 19.0, dur: 5.6, ease: ease.linear });

  // — beat 5 · fork into a Scope —
  tl.caption({
    at: 25.2,
    dur: 6.0,
    text: 'You can also tie a fiber to a scope. Fork it scoped, and its lifetime belongs to that scope — not to you.',
  });
  tl.tween(cam, CAM_SCOPE, { at: 25.4, dur: 1.4, ease: ease.move });
  tl.tween(treeLblU, 0, { at: 25.3, dur: 0.5, ease: ease.enter });
  tl.tween(scopeU, 1, { at: 25.8, dur: 1.2, ease: ease.draw });
  tl.tween(s1U, 0.55, { at: 27.2, dur: 3.6, ease: ease.linear });
  tl.tween(s2U, 0.45, { at: 27.8, dur: 3.0, ease: ease.linear });
  tl.tween(trunkU, 0.58, { at: 25.2, dur: 6.0, ease: ease.linear });

  // — beat 6 · the scope closes —
  tl.caption({
    at: 31.8,
    dur: 6.2,
    text: 'When the scope closes, every fiber inside is interrupted. No orphan loops, no leaked pollers — cleanup is a property of the shape.',
  });
  tl.tween(scopeReapU, 1, { at: 33.0, dur: 2.2, ease: ease.move });
  tl.tween(trunkU, 0.64, { at: 31.8, dur: 6.2, ease: ease.linear });
  tl.tween(aU, 0.8, { at: 31.8, dur: 6.2, ease: ease.linear });
  tl.tween(bU, 0.7, { at: 31.8, dur: 6.2, ease: ease.linear });

  // — beat 7 · the escape hatch —
  tl.caption({
    at: 38.6,
    dur: 5.8,
    text: 'There is an escape hatch: fork detached attaches the fiber to the global scope. It answers to nobody.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 38.7, dur: 1.4, ease: ease.move });
  tl.tween(scopeU, 0.25, { at: 38.8, dur: 0.8, ease: ease.enter });
  tl.tween(detachU, 0.4, { at: 39.6, dur: 4.6, ease: ease.linear });
  tl.tween(trunkU, 0.72, { at: 38.6, dur: 5.8, ease: ease.linear });

  // — beat 8 · parent dies, children die; the detached one survives —
  tl.caption({
    at: 44.8,
    dur: 6.8,
    text: 'Watch the difference. The main fiber finishes, and its children are interrupted with it. The detached one keeps running — in production, this is how leaks are born.',
  });
  tl.tween(trunkU, 0.86, { at: 44.8, dur: 1.8, ease: ease.linear });
  tl.tween(mainDoneU, 1, { at: 46.8, dur: 0.5, ease: ease.pop });
  tl.tween(kidReapU, 1, { at: 47.4, dur: 2.0, ease: ease.move });
  tl.tween(detachU, 0.78, { at: 44.8, dur: 6.8, ease: ease.linear });
  tl.tween(soloU, 1, { at: 49.6, dur: 1.2, ease: ease.enter });

  // — beat 9 · FiberSet: dynamic populations —
  tl.caption({
    at: 52.2,
    dur: 6.2,
    text: 'For dynamic work there is the fiber set: it manages many fibers together. Run a fiber into the set and it removes itself the moment it completes.',
  });
  tl.tween(cam, CAM_SET, { at: 52.3, dur: 1.3, ease: ease.move });
  tl.tween(setU, 1, { at: 52.6, dur: 1.0, ease: ease.enter });
  tl.tween(miniU, 1, { at: 53.6, dur: 3.4, ease: ease.linear });
  tl.tween(miniDoneU, 1, { at: 55.6, dur: 2.6, ease: ease.linear });

  // — beat 10 · the set is owned too —
  tl.caption({
    at: 59.0,
    dur: 6.0,
    text: 'And the set itself is owned by a scope. Close it, and every fiber still running is interrupted — all of them, at once.',
  });
  tl.tween(setReapU, 1, { at: 60.6, dur: 1.6, ease: ease.move });
  tl.hold(64.6, 0.4);

  // — beat 11 · recap + hook —
  tl.caption({
    at: 65.6,
    dur: 6.6,
    text: 'So: fork children, let scopes own lifetimes, and treat detached fibers as a loaded gun. Next — what interruption actually feels like from inside a fiber.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 65.7, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 1, { at: 66.4, dur: 0.9, ease: ease.enter });
  tl.hold(71.4, 1.2);

  return {
    tl,
    cam,
    axisU,
    trunkU,
    aU,
    bU,
    cU,
    treeLblU,
    scopeU,
    s1U,
    s2U,
    scopeReapU,
    detachU,
    mainDoneU,
    kidReapU,
    soloU,
    setU,
    miniU,
    miniDoneU,
    setReapU,
    recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** a fiber line with a glowing head, an optional interrupt pulse + ✕ cap */
function FiberLine({
  pts,
  u,
  color,
  reap = 0,
  dim = 1,
  label,
  labelDx = 8,
  width = 3,
}: {
  pts: Pt[];
  u: number;
  color: string;
  reap?: number; // 0..1: red pulse travels fork→tip, then ✕ + dim
  dim?: number;
  label?: string;
  labelDx?: number;
  width?: number;
}) {
  if (u <= 0.001) return null;
  const head = alongPt(pts, u);
  const reaped = reap >= 0.999;
  const op = dim * (reaped ? 0.32 : 1);
  return (
    <g opacity={op}>
      <path d={partialD(pts, u)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
      {!reaped && reap <= 0.001 && <circle cx={head.x} cy={head.y} r={5} fill={color} />}
      {label && (
        <text x={pts[1].x + labelDx} y={pts[1].y - 10} fill={color} fontSize={13} fontFamily={MONO}>
          {label}
        </text>
      )}
      {reap > 0.001 && reap < 0.999 && (
        <circle
          cx={alongPt(pts, u * reap).x}
          cy={alongPt(pts, u * reap).y}
          r={6}
          fill={colors.NEGATIVE}
          opacity={0.95}
        />
      )}
      {reap > 0.6 && (
        <g opacity={clamp01((reap - 0.6) / 0.4)} stroke={colors.NEGATIVE} strokeWidth={2.5} strokeLinecap="round">
          <line x1={head.x - 7} y1={head.y - 7} x2={head.x + 7} y2={head.y + 7} />
          <line x1={head.x - 7} y1={head.y + 7} x2={head.x + 7} y2={head.y - 7} />
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axisU = s.get(scene.axisU);
  const trunkU = s.get(scene.trunkU);
  const aU = s.get(scene.aU);
  const bU = s.get(scene.bU);
  const cU = s.get(scene.cU);
  const treeLblU = s.get(scene.treeLblU);
  const scopeU = s.get(scene.scopeU);
  const s1U = s.get(scene.s1U);
  const s2U = s.get(scene.s2U);
  const scopeReapU = s.get(scene.scopeReapU);
  const detachU = s.get(scene.detachU);
  const mainDoneU = s.get(scene.mainDoneU);
  const kidReapU = s.get(scene.kidReapU);
  const soloU = s.get(scene.soloU);
  const setU = s.get(scene.setU);
  const miniU = s.get(scene.miniU);
  const miniDoneU = s.get(scene.miniDoneU);
  const setReapU = s.get(scene.setReapU);
  const recapU = s.get(scene.recapU);

  const trunkHead = { x: X0 + trunkU * (XEND - X0), y: TRUNK_Y };
  // the whole tree fades under the FiberSet panel, except the survivor stays dim
  const treeOp = 1 - setU * 0.88;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* time axis */}
        <g opacity={axisU * treeOp}>
          <line x1={X0 - 20} y1={620} x2={XEND + 30} y2={620} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={X0 - 20} y={614} fill={colors.MUTED} fontSize={12}>
            time →
          </text>
        </g>

        <g opacity={treeOp}>
          {/* children dim while the survivor beat plays */}
          <g opacity={1 - soloU * 0.75}>
            {/* trunk — the main fiber */}
            <path
              d={partialD([{ x: X0, y: TRUNK_Y }, { x: XEND, y: TRUNK_Y }], trunkU)}
              fill="none"
              stroke={colors.ACCENT}
              strokeWidth={4.5}
              strokeLinecap="round"
            />
            <text x={X0} y={TRUNK_Y + 26} fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>
              main fiber
            </text>
            {axisU > 0.01 && mainDoneU < 0.5 && (
              <circle cx={trunkHead.x} cy={trunkHead.y} r={6.5} fill={colors.ACCENT} />
            )}
            {/* main completes: green cap */}
            {mainDoneU > 0.01 && (
              <g opacity={mainDoneU}>
                <circle cx={trunkHead.x} cy={trunkHead.y} r={9} fill={colors.POSITIVE} />
                <text x={trunkHead.x + 14} y={trunkHead.y + 5} fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                  done
                </text>
              </g>
            )}

            {/* forkChild children */}
            <FiberLine pts={CHILD_A} u={aU} color={colors.SECONDARY} label="Effect.forkChild" reap={win(kidReapU, 3, 0, 2)} />
            <FiberLine pts={CHILD_B} u={bU} color={colors.SECONDARY} reap={win(kidReapU, 3, 1, 2)} />
            <FiberLine pts={CHILD_C} u={cU} color={colors.SECONDARY} reap={win(kidReapU, 3, 2, 2)} />

            {/* tree label */}
            {treeLblU > 0.01 && (
              <text x={640} y={140} textAnchor="middle" fill={colors.TEXT} fontSize={19} opacity={treeLblU}>
                a tree of fibers — every child has an owner
              </text>
            )}

            {/* the Scope */}
            {scopeU > 0.01 && (
              <g opacity={scopeU}>
                <rect
                  x={SCOPE_BOX.x}
                  y={SCOPE_BOX.y}
                  width={SCOPE_BOX.w}
                  height={SCOPE_BOX.h}
                  rx={12}
                  fill={colors.PANEL}
                  fillOpacity={0.5}
                  stroke={scopeReapU > 0.05 ? colors.NEGATIVE : colors.TEAL}
                  strokeWidth={1.8}
                  strokeDasharray="7 6"
                />
                <text x={SCOPE_BOX.x + 12} y={SCOPE_BOX.y + 24} fill={scopeReapU > 0.05 ? colors.NEGATIVE : colors.TEAL} fontSize={14} fontFamily={MONO}>
                  Scope {scopeReapU > 0.05 ? '· closing' : ''}
                </text>
                <FiberLine pts={SCOPED_1} u={s1U} color={colors.TEAL} label="Effect.forkScoped" reap={win(scopeReapU, 2, 0, 1.6)} />
                <FiberLine pts={SCOPED_2} u={s2U} color={colors.TEAL} reap={win(scopeReapU, 2, 1, 1.6)} />
              </g>
            )}
          </g>

          {/* the detached fiber — survives everything (kept bright during solo) */}
          <FiberLine pts={DETACH} u={detachU} color={colors.WARM} label="Effect.forkDetach" width={3.5} />
          {soloU > 0.01 && detachU > 0.3 && (
            <text
              x={alongPt(DETACH, detachU).x - 4}
              y={DETACH[1].y - 32}
              textAnchor="end"
              fill={colors.WARM}
              fontSize={14}
              fontStyle="italic"
              opacity={soloU}
            >
              still running — nobody owns it
            </text>
          )}
        </g>

        {/* ------------- FiberSet panel ------------- */}
        {setU > 0.01 && (
          <g opacity={setU}>
            <rect
              x={SET_BOX.x}
              y={SET_BOX.y}
              width={SET_BOX.w}
              height={SET_BOX.h}
              rx={14}
              fill={colors.PANEL}
              stroke={setReapU > 0.05 ? colors.NEGATIVE : colors.GRID}
              strokeWidth={1.6}
            />
            <text x={SET_BOX.x + 18} y={SET_BOX.y + 32} fill={colors.TEXT} fontSize={16} fontFamily={MONO}>
              FiberSet.make()
            </text>
            <text x={SET_BOX.x + SET_BOX.w - 18} y={SET_BOX.y + 32} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              {(() => {
                const started = MINIS.filter((_, i) => win(miniU, MINIS.length, i, 2.5) > 0).length;
                const removed = MINIS.filter((m, i) => m.done && win(miniDoneU, 4, Math.floor(i / 2), 1.5) >= 1).length;
                const reaped = setReapU >= 0.98 ? MINIS.filter((m) => !m.done).length : 0;
                return `running: ${Math.max(0, started - removed - reaped)}`;
              })()}
            </text>
            {MINIS.map((m, i) => {
              const grow = win(miniU, MINIS.length, i, 2.5);
              if (grow <= 0) return null;
              const x0 = SET_BOX.x + 46;
              const doneU = m.done ? win(miniDoneU, 4, Math.floor(i / 2), 1.5) : 0;
              const gone = doneU >= 1;
              const reap = m.done ? 0 : setReapU;
              return (
                <g key={i} opacity={gone ? 0.12 : 1}>
                  <text x={SET_BOX.x + 18} y={m.y + 4} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                    run
                  </text>
                  <FiberLine
                    pts={[{ x: x0, y: m.y }, { x: x0 + m.len, y: m.y }]}
                    u={grow}
                    color={m.done ? colors.POSITIVE : colors.ACCENT}
                    reap={reap}
                    width={2.5}
                  />
                  {m.done && doneU > 0.2 && !gone && (
                    <circle cx={x0 + m.len * grow} cy={m.y} r={5.5} fill={colors.POSITIVE} opacity={clamp01(doneU * 2)} />
                  )}
                </g>
              );
            })}
            {setReapU > 0.5 && (
              <text x={SET_BOX.x + SET_BOX.w / 2} y={SET_BOX.y + SET_BOX.h - 16} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} opacity={clamp01((setReapU - 0.5) * 2)}>
                scope closed → remaining fibers interrupted
              </text>
            )}
          </g>
        )}

        {/* ------------- recap panel ------------- */}
        {recapU > 0.01 && (
          <g opacity={recapU}>
            <rect x={0} y={0} width={STAGE_W} height={STAGE_H} fill={colors.BG} opacity={0.86} />
            <rect x={330} y={250} width={620} height={188} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={600}>
              the fiber tree
            </text>
            <text x={640} y={336} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} fontFamily={MONO}>
              Effect.forkChild — a child, owned by its parent
            </text>
            <text x={640} y={366} textAnchor="middle" fill={colors.TEAL} fontSize={15} fontFamily={MONO}>
              Effect.forkScoped — owned by a Scope
            </text>
            <text x={640} y={396} textAnchor="middle" fill={colors.WARM} fontSize={15} fontFamily={MONO}>
              Effect.forkDetach — owned by nobody
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
