// Dispatcher: classify and route
//
// Grounding: packages/agents-runtime/skills/designing-entities/references/
// patterns/dispatcher.md — an entity classifies incoming messages and routes
// each to a specialist entity TYPE chosen dynamically by the model per
// request ("research question vs coding question vs data analysis"; targets
// may be app-defined types). The dispatch tool takes {type, systemPrompt,
// task}, spawns with wake:{on:"runFinished",includeResponse:true}, and
// returns immediately ("Started …; I will continue when it finishes").
// State: children {type,status,response}, status machine idle → classifying
// → dispatching → waiting, and a dispatchCounter (Date.now alone is not
// unique under rapid dispatch). D5: validate the type against a whitelist or
// catch spawn errors — unregistered types cause opaque errors.
//
// Centerpiece: a RAILROAD SWITCH. Message cards ride the inbox rail into the
// dispatcher; the lever physically throws toward the chosen branch;
// specialists bloom at track ends on demand; answers ride wakes back while
// the dispatcher sleeps between decisions.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const DSP = { x: 470, y: 330 } as const;
const SW = { x: DSP.x + 88, y: DSP.y } as const; // the switch throat

interface Branch {
  y: number;
  color: string;
  type: string;
  registered: boolean;
}
const BR_X = 950;
const BRANCHES: Branch[] = [
  { y: 150, color: colors.ACCENT, type: 'researcher', registered: true },
  { y: 330, color: colors.TEAL, type: '?', registered: false },
  { y: 500, color: colors.SECONDARY, type: 'coder', registered: true },
];

function branchPoint(b: Branch, t: number): { x: number; y: number } {
  const x0 = SW.x;
  const y0 = SW.y;
  const x1 = BR_X - 72;
  const y1 = b.y;
  const c1 = { x: x0 + 150, y: y0 };
  const c2 = { x: x1 - 150, y: y1 };
  const u = 1 - t;
  return {
    x: u * u * u * x0 + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * x1,
    y: u * u * u * y0 + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * y1,
  };
}
function branchD(b: Branch, reveal: number): string {
  const n = 28;
  const upto = Math.max(1, Math.round(n * clamp01(reveal)));
  const parts: string[] = [];
  for (let i = 0; i <= upto; i++) {
    const p = branchPoint(b, i / n);
    parts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return parts.join('');
}

const INBOX_X0 = 60;
const STATUS = ['idle', 'classifying', 'dispatching', 'waiting'];
const ST_X = [356, 512, 682, 838];

const TAPE_Y = 592;
const TAPE_X0 = 168;
const TAPE_CELLS = [
  { a: 'children_insert', b: 'dispatch-1 · researcher', c: colors.ACCENT, w: 178 },
  { a: 'status_update', b: 'waiting', c: colors.WARM, w: 112 },
  { a: 'children_insert', b: 'dispatch-2 · coder', c: colors.SECONDARY, w: 158 },
  { a: 'children_update', b: 'dispatch-1 ✓ completed', c: colors.POSITIVE, w: 188 },
];

const CAM_SWITCH: CameraState = { x: 610, y: 320, k: 1.35 };

// ---------------------------------------------------------------------------
// Timeline (~62s, eight beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const dLit = tl.channel('dLit', 0);
  const railU = tl.channel('railU', 0); // inbox rail + dim branches draw on
  const m1U = tl.channel('m1U', 0); // msg 1: 0..1 approach, 1..2 ride branch
  const m2U = tl.channel('m2U', 0);
  const m3U = tl.channel('m3U', 0); // unknown kind: approach only
  const class1U = tl.channel('class1U', 0); // card gains kind color + label
  const class2U = tl.channel('class2U', 0);
  const class3U = tl.channel('class3U', 0);
  const switchDir = tl.channel('switchDir', 0); // -1 up · 0 mid · 1 down
  const spawn1U = tl.channel('spawn1U', 0); // researcher blooms
  const spawn2U = tl.channel('spawn2U', 0); // coder blooms
  const statusIdx = tl.channel('statusIdx', 0);
  const cnt = tl.channel('cnt', 0); // dispatchCounter
  const rows = tl.channel('rows', 0); // tape cells stamped
  const dispChipU = tl.channel('dispChipU', 0); // the dispatch tool chip
  const retChipU = tl.channel('retChipU', 0); // "started — continuing later"
  const bolt1U = tl.channel('bolt1U', 0); // researcher's wake home
  const fwd1U = tl.channel('fwd1U', 0); // the answer forwarded out left
  const bounceU = tl.channel('bounceU', 0); // unknown type bounces
  const errChipU = tl.channel('errChipU', 0);
  const bolt2U = tl.channel('bolt2U', 0); // coder finishes during the close
  const endU = tl.channel('endU', 0);

  // — beat 1 · one inbox, many kinds —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'One inbox, many kinds of question. A research request, a coding task, a data pull — each one wants a different specialist entirely.',
  });
  tl.tween(dLit, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(railU, 1, { at: 1.4, dur: 1.8, ease: ease.draw });
  tl.hold(6.7, 0.5);

  // — beat 2 · the decision is the job —
  tl.caption({
    at: 7.2,
    dur: 6.4,
    text: "The dispatcher's whole job is the decision. Its model reads each message and picks a type — not an answer, just who should answer.",
  });
  tl.tween(m1U, 1, { at: 7.6, dur: 1.6, ease: ease.move });
  tl.set(statusIdx, 1, 9.4);
  tl.tween(class1U, 1, { at: 9.8, dur: 0.8, ease: ease.enter });
  tl.tween(dispChipU, 1, { at: 10.8, dur: 0.6, ease: ease.enter });
  tl.hold(13.0, 0.6);

  // — beat 3 · the switch throws —
  tl.caption({
    at: 13.6,
    dur: 7.4,
    text: 'The switch throws, and a specialist of that type is spawned on demand at the end of the track. Its id comes from a counter the dispatcher keeps in state, so rapid dispatches never collide.',
  });
  tl.tween(cam, CAM_SWITCH, { at: 13.8, dur: 1.3, ease: ease.move });
  tl.set(statusIdx, 2, 14.4);
  tl.tween(switchDir, -1, { at: 14.6, dur: 0.7, ease: ease.move });
  tl.tween(spawn1U, 1, { at: 15.4, dur: 0.7, ease: ease.enter });
  tl.set(cnt, 1, 15.6);
  tl.tween(m1U, 2, { at: 16.0, dur: 1.6, ease: ease.linear });
  tl.tween(rows, 1, { at: 17.8, dur: 0.4, ease: ease.linear });
  tl.tween(dispChipU, 0, { at: 17.8, dur: 0.5, ease: ease.enter });

  // — beat 4 · return immediately, wait durably —
  tl.caption({
    at: 21.4,
    dur: 6.6,
    text: 'Then the tool returns immediately: started, it says — I will continue when this finishes. The dispatcher goes dark, holding nothing but a note that says waiting.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 21.6, dur: 1.3, ease: ease.move });
  tl.tween(retChipU, 1, { at: 22.2, dur: 0.6, ease: ease.enter });
  tl.set(statusIdx, 3, 23.0);
  tl.tween(rows, 2, { at: 23.2, dur: 0.4, ease: ease.linear });
  tl.tween(dLit, 0.12, { at: 24.6, dur: 1.0, ease: ease.move });

  // — beat 5 · a different verdict —
  tl.caption({
    at: 28.4,
    dur: 6.8,
    text: 'A second message, a different verdict: the switch throws the other way and a different type spawns. Now two specialists run while the dispatcher sleeps.',
  });
  tl.tween(retChipU, 0, { at: 28.6, dur: 0.5, ease: ease.enter });
  tl.tween(m2U, 1, { at: 28.8, dur: 1.4, ease: ease.move });
  tl.tween(dLit, 1, { at: 30.0, dur: 0.4, ease: ease.enter });
  tl.set(statusIdx, 1, 30.2);
  tl.tween(class2U, 1, { at: 30.4, dur: 0.7, ease: ease.enter });
  tl.set(statusIdx, 2, 31.2);
  tl.tween(switchDir, 1, { at: 31.3, dur: 0.8, ease: ease.move });
  tl.tween(spawn2U, 1, { at: 32.2, dur: 0.7, ease: ease.enter });
  tl.set(cnt, 2, 32.4);
  tl.tween(m2U, 2, { at: 32.6, dur: 1.5, ease: ease.linear });
  tl.tween(rows, 3, { at: 34.2, dur: 0.4, ease: ease.linear });
  tl.set(statusIdx, 3, 34.6);
  tl.tween(dLit, 0.12, { at: 34.8, dur: 0.8, ease: ease.move });

  // — beat 6 · the answer rides a wake home —
  tl.caption({
    at: 35.8,
    dur: 6.8,
    text: 'Each completion rides a wake back in. The dispatcher lights up, marks that child completed, and forwards the specialist answer to whoever asked.',
  });
  tl.tween(bolt1U, 1, { at: 36.4, dur: 1.6, ease: ease.linear });
  tl.tween(dLit, 1, { at: 38.0, dur: 0.3, ease: ease.pop });
  tl.tween(rows, 4, { at: 38.4, dur: 0.4, ease: ease.linear });
  tl.set(statusIdx, 0, 38.8);
  tl.tween(fwd1U, 1, { at: 39.2, dur: 1.6, ease: ease.move });
  tl.tween(dLit, 0.12, { at: 41.2, dur: 0.8, ease: ease.move });

  // — beat 7 · the unknown track —
  tl.caption({
    at: 43.4,
    dur: 6.8,
    text: 'And when a message names a type nobody registered? Validate first, or catch the spawn error — an unknown track is a wreck you can see coming.',
  });
  tl.tween(m3U, 1, { at: 43.8, dur: 1.4, ease: ease.move });
  tl.tween(dLit, 1, { at: 45.0, dur: 0.4, ease: ease.enter });
  tl.set(statusIdx, 1, 45.2);
  tl.tween(class3U, 1, { at: 45.4, dur: 0.7, ease: ease.enter });
  tl.tween(switchDir, 0, { at: 46.2, dur: 0.6, ease: ease.move });
  tl.tween(bounceU, 1, { at: 47.0, dur: 1.1, ease: ease.move });
  tl.tween(errChipU, 1, { at: 48.2, dur: 0.6, ease: ease.enter });
  tl.set(statusIdx, 0, 49.0);

  // — beat 8 · name the shape —
  tl.caption({
    at: 51.2,
    dur: 6.6,
    text: "Classify, route, return, resume. When requests differ in kind and the real question is who, not how — that's the dispatcher.",
  });
  tl.tween(errChipU, 0, { at: 51.6, dur: 0.5, ease: ease.enter });
  tl.tween(bolt2U, 1, { at: 52.2, dur: 1.4, ease: ease.linear });
  tl.tween(dLit, 1, { at: 53.6, dur: 0.3, ease: ease.pop });
  tl.tween(dLit, 0.5, { at: 54.4, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 53.0, dur: 1.4, ease: ease.move });
  tl.hold(57.8, 1.8);

  return {
    tl,
    cam,
    dLit,
    railU,
    m1U,
    m2U,
    m3U,
    class1U,
    class2U,
    class3U,
    switchDir,
    spawn1U,
    spawn2U,
    statusIdx,
    cnt,
    rows,
    dispChipU,
    retChipU,
    bolt1U,
    fwd1U,
    bounceU,
    errChipU,
    bolt2U,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, u }: { x: number; y: number; text: string; color: string; u: number }) {
  if (u <= 0.01) return null;
  const w = text.length * 7.4 + 24;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={y - 15} width={w} height={28} rx={8} fill={colors.BG} stroke={color} strokeOpacity={0.7} />
      <text x={x} y={y + 5} textAnchor="middle" fill={color} fontSize={12.5} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

/** a message card: u ≤ 1 approaches on the inbox rail, 1..2 rides a branch */
function msgPos(u: number, queue: number, branch: Branch | null): { x: number; y: number } {
  if (u <= 1) {
    const x0 = INBOX_X0 + 40 + queue * 92;
    const x1 = DSP.x - 118;
    return { x: x0 + (x1 - x0) * u, y: DSP.y };
  }
  if (!branch) return { x: DSP.x - 118, y: DSP.y };
  const p = branchPoint(branch, clamp01(u - 1));
  return { x: p.x - 36, y: p.y };
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dLit = s.get(scene.dLit);
  const railU = s.get(scene.railU);
  const m1U = s.get(scene.m1U);
  const m2U = s.get(scene.m2U);
  const m3U = s.get(scene.m3U);
  const classU = [s.get(scene.class1U), s.get(scene.class2U), s.get(scene.class3U)];
  const switchDir = s.get(scene.switchDir);
  const spawnU = [s.get(scene.spawn1U), s.get(scene.spawn2U)];
  const statusIdx = s.get(scene.statusIdx);
  const cnt = s.get(scene.cnt);
  const rows = s.get(scene.rows);
  const dispChipU = s.get(scene.dispChipU);
  const retChipU = s.get(scene.retChipU);
  const bolt1U = s.get(scene.bolt1U);
  const fwd1U = s.get(scene.fwd1U);
  const bounceU = s.get(scene.bounceU);
  const errChipU = s.get(scene.errChipU);
  const bolt2U = s.get(scene.bolt2U);
  const endU = s.get(scene.endU);

  const dim = 1 - 0.85 * endU;
  const angle = 26 * switchDir;

  const msgs = [
    { u: m1U, cls: classU[0], queue: 2, branch: BRANCHES[0], kind: 'research', color: colors.ACCENT },
    { u: m2U, cls: classU[1], queue: 1, branch: BRANCHES[2], kind: 'coding', color: colors.SECONDARY },
    { u: m3U, cls: classU[2], queue: 0, branch: null as Branch | null, kind: 'unknown', color: colors.NEGATIVE },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- status strip + counter ---------------- */}
        <g opacity={(0.4 + 0.6 * dim) * railU}>
          {STATUS.map((st, i) => {
            const active = Math.abs(statusIdx - i) < 0.5;
            const w = st.length * 8.5 + 26;
            return (
              <g key={st}>
                <rect
                  x={ST_X[i] - w / 2}
                  y={44}
                  width={w}
                  height={30}
                  rx={9}
                  fill={active ? colors.PANEL : 'none'}
                  stroke={active ? colors.WARM : colors.GRID}
                  strokeWidth={active ? 1.8 : 1}
                />
                <text x={ST_X[i]} y={64} textAnchor="middle" fill={active ? colors.WARM : colors.MUTED} fontSize={13} fontFamily={MONO}>
                  {st}
                </text>
              </g>
            );
          })}
          <text x={1214} y={64} textAnchor="end" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
            dispatchCounter: <tspan fill={colors.WARM} fontWeight={700}>{Math.round(cnt)}</tspan>
          </text>
        </g>

        {/* ---------------- rails ---------------- */}
        <g opacity={dim}>
          <line
            x1={INBOX_X0}
            y1={DSP.y}
            x2={INBOX_X0 + (DSP.x - 100 - INBOX_X0) * railU}
            y2={DSP.y}
            stroke={colors.GRID}
            strokeWidth={2.5}
          />
          <text x={INBOX_X0} y={DSP.y - 16} fill={colors.MUTED} fontSize={12} opacity={railU}>
            inbox
          </text>
          {BRANCHES.map((b, i) => (
            <path
              key={i}
              d={branchD(b, railU)}
              fill="none"
              stroke={b.registered ? colors.GRID : colors.GRID}
              strokeWidth={b.registered ? 2 : 1.2}
              strokeDasharray={b.registered ? undefined : '4 6'}
              opacity={b.registered ? 0.9 : 0.5}
            />
          ))}
          {/* the switch lever */}
          <g transform={`rotate(${angle} ${SW.x} ${SW.y})`} opacity={railU}>
            <line x1={SW.x} y1={SW.y} x2={SW.x + 64} y2={SW.y} stroke={colors.WARM} strokeWidth={4.5} strokeLinecap="round" />
          </g>
          <circle cx={SW.x} cy={SW.y} r={6} fill={colors.WARM} opacity={railU} />
        </g>

        {/* ---------------- specialists at track ends ---------------- */}
        {[BRANCHES[0], BRANCHES[2]].map((b, i) => {
          const u = spawnU[i];
          const boltHome = i === 0 ? bolt1U : bolt2U;
          const done = boltHome > 0.95;
          if (u <= 0.01) return null;
          return (
            <g key={b.type} opacity={u * dim}>
              <rect
                x={BR_X - 70}
                y={b.y - 30}
                width={150}
                height={60}
                rx={12}
                fill={colors.PANEL}
                stroke={b.color}
                strokeWidth={1.8}
                strokeOpacity={done ? 0.4 : 0.9}
              />
              <text x={BR_X + 5} y={b.y - 3} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={600} opacity={done ? 0.55 : 1}>
                {b.type}
              </text>
              <text x={BR_X + 5} y={b.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                spawned on demand
              </text>
              {done && (
                <text x={BR_X + 66} y={b.y - 16} textAnchor="end" fill={colors.POSITIVE} fontSize={13}>
                  ✓
                </text>
              )}
            </g>
          );
        })}
        {/* the unregistered middle track end */}
        <g opacity={0.45 * railU * dim}>
          <rect x={BR_X - 70} y={BRANCHES[1].y - 26} width={150} height={52} rx={12} fill="none" stroke={colors.GRID} strokeDasharray="5 5" />
          <text x={BR_X + 5} y={BRANCHES[1].y + 5} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
            unregistered
          </text>
        </g>

        {/* ---------------- wake bolts ---------------- */}
        {[
          { u: bolt1U, b: BRANCHES[0] },
          { u: bolt2U, b: BRANCHES[2] },
        ].map(({ u, b }, i) => {
          if (u <= 0.01 || u >= 0.99) return null;
          const p = branchPoint(b, 1 - u);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={6.5} fill={b.color} />
              <circle cx={p.x} cy={p.y} r={11} fill="none" stroke={b.color} strokeOpacity={0.5} />
              <text x={p.x} y={p.y - 16} textAnchor="middle" fill={b.color} fontSize={11} fontFamily={MONO}>
                runFinished
              </text>
            </g>
          );
        })}

        {/* ---------------- the messages ---------------- */}
        {msgs.map((m, i) => {
          if (m.u <= 0.01) return null;
          // the unknown card bounces off the switch
          const bounce = i === 2 ? bounceU : 0;
          const pos = msgPos(m.u, m.queue, m.branch);
          const bx = pos.x - 46 * Math.sin(Math.PI * clamp01(bounce)) * 1.4;
          const by = pos.y - 34 * Math.sin(Math.PI * clamp01(bounce));
          const ridden = m.u > 1.9; // delivered into the specialist — hide it
          const label = m.cls > 0.5 ? m.kind : '· · ·';
          const stroke = m.cls > 0.5 ? m.color : colors.GRID;
          return (
            <g key={i} opacity={(ridden ? 0 : 0.95) * dim * (1 - 0.9 * fwd1U * (i === 0 ? 1 : 0))}>
              <rect x={bx} y={by - 17} width={82} height={34} rx={8} fill={colors.PANEL} stroke={stroke} strokeWidth={1.6} />
              <text x={bx + 41} y={by + 4} textAnchor="middle" fill={m.cls > 0.5 ? m.color : colors.MUTED} fontSize={11.5}>
                {label}
              </text>
              {i === 2 && bounce > 0.6 && (
                <text x={bx + 41} y={by - 26} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO} opacity={clamp01((bounce - 0.6) / 0.4)}>
                  type: wizard → error
                </text>
              )}
            </g>
          );
        })}

        {/* the forwarded answer exits stage left */}
        {fwd1U > 0.01 && fwd1U < 1 && (
          <g opacity={1 - 0.3 * fwd1U}>
            <rect x={DSP.x - 118 - (DSP.x + 40) * fwd1U} y={DSP.y - 60} width={96} height={34} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
            <text x={DSP.x - 70 - (DSP.x + 40) * fwd1U} y={DSP.y - 38} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5}>
              answer ↖
            </text>
          </g>
        )}

        {/* ---------------- the dispatcher ---------------- */}
        <g>
          {dLit > 0.2 && (
            <rect x={DSP.x - 97} y={DSP.y - 48} width={194} height={96} rx={20} fill={colors.SECONDARY} opacity={0.16 * dLit} />
          )}
          <rect
            x={DSP.x - 90}
            y={DSP.y - 41}
            width={180}
            height={82}
            rx={14}
            fill={colors.PANEL}
            stroke={colors.SECONDARY}
            strokeWidth={1.8}
            strokeOpacity={0.25 + 0.75 * dLit}
          />
          <circle cx={DSP.x - 72} cy={DSP.y - 25} r={4.5} fill={colors.SECONDARY} opacity={0.25 + 0.75 * dLit} />
          <text x={DSP.x} y={DSP.y - 3} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={600} opacity={0.45 + 0.55 * dLit}>
            dispatcher
          </text>
          <text x={DSP.x} y={DSP.y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            dispatch
          </text>
        </g>

        {/* ---------------- chips ---------------- */}
        <Chip x={640} y={116} text={'dispatch({ type, systemPrompt, task })'} color={colors.ACCENT} u={dispChipU} />
        <Chip x={640} y={116} text={'started — I will continue when it finishes'} color={colors.WARM} u={retChipU} />
        <Chip x={640} y={116} text={'validate the type, or catch the spawn error'} color={colors.NEGATIVE} u={errChipU} />

        {/* ---------------- the stream tape ---------------- */}
        {rows > 0.05 && (
          <g>
            <text x={TAPE_X0} y={TAPE_Y - 12} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              the dispatcher&apos;s stream — append only
            </text>
            <line x1={TAPE_X0} y1={TAPE_Y + 42} x2={TAPE_X0 + 680} y2={TAPE_Y + 42} stroke={colors.GRID} strokeWidth={2} />
            {(() => {
              let x = TAPE_X0;
              return TAPE_CELLS.map((c, i) => {
                const u = clamp01(rows - i);
                const cx = x;
                x += c.w + 10;
                if (u <= 0) return null;
                return (
                  <g key={i} opacity={u} transform={`translate(0 ${6 * (1 - u)})`}>
                    <rect x={cx} y={TAPE_Y} width={c.w} height={34} rx={7} fill={colors.PANEL} stroke={c.c} strokeOpacity={0.55} />
                    <text x={cx + c.w / 2} y={TAPE_Y + 14} textAnchor="middle" fill={colors.TEXT} fontSize={9.5} fontFamily={MONO}>
                      {c.a}
                    </text>
                    <text x={cx + c.w / 2} y={TAPE_Y + 27} textAnchor="middle" fill={c.c} fontSize={9.5} fontFamily={MONO}>
                      {c.b}
                    </text>
                  </g>
                );
              });
            })()}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
