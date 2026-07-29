// Chapter 3 — The customs gate: what serializes, what cannot
//
// Grounding: packages/react-server/src/ReactFlightServer.js
// renderModelDestructive (line ~3585): Date -> '$D'+toJSON, Map -> '$Q'+id
// (outlined row), Set -> '$W'+id, Promise -> serializeThenable -> '$@'+id,
// undefined -> '$undefined', Infinity -> '$Infinity', BigInt -> '$n'.
// Exact thrown errors: "Event handlers cannot be passed to Client Component
// props." · "Functions cannot be passed directly to Client Components unless
// you explicitly expose it by marking it with \"use server\"..." · "Only
// plain objects, and a few built-ins, can be passed to Client Components
// from Server Components. Classes or null prototypes are not supported."
// The loophole: react-server-dom-webpack/src/ReactFlightWebpackReferences.js
// registerClientReference ({$$typeof: Symbol.for('react.client.reference'),
// $$id, $$async}) + createClientModuleProxy — calling a client export on the
// server throws "Attempted to call Counter() from the server but Counter is
// on the client...". fixtures/flight/src/App.js defines the async helper
// `delay` used here as the bounced plain function.
//
// Centerpiece: THE MORPHING GATE — values ride a belt to a scanner and are
// visibly rewritten into their dollar-encodings, or slam into the gate and
// fall, with React's real error text on screen.
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
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout: belt, gate, docked "boarded" list.
// ---------------------------------------------------------------------------

const BELT_Y = 396;
const BELT_X0 = 96;
const BELT_X1 = 1184;
const GATE_X = 590;
const DOCK = { x: 806, y: 128, dy: 35 } as const;

interface Traveler {
  label: string;
  out: string;
  note?: string;
  dock: number;
}
const G1: Traveler[] = [
  { label: '"hello"', out: '"hello"', dock: 0 },
  { label: '42', out: '42', dock: 1 },
  { label: 'new Date()', out: '"$D2026-07-16T09:00:00.000Z"', dock: 2 },
];
const G2: Traveler[] = [
  { label: 'new Map()', out: '"$Q6"', note: '+ row 6', dock: 3 },
  { label: 'new Set()', out: '"$W7"', note: '+ row 7', dock: 4 },
];
const PROMISE: Traveler = { label: 'a promise', out: '"$@8"', note: 'row 8 follows later', dock: 5 };
const REF: Traveler = { label: 'Counter', out: '"$L2"', note: '+ 2:I[…] import row', dock: 6 };

const EH_ERR = ['Event handlers cannot be passed to', 'Client Component props.'];
const FN_ERR = [
  'Functions cannot be passed directly to Client',
  'Components unless you explicitly expose it by',
  'marking it with "use server".',
];
const CLS_ERR = [
  'Only plain objects, and a few built-ins, can be',
  'passed to Client Components from Server',
  'Components. Classes or null prototypes are',
  'not supported.',
];
const CALL_ERR = [
  'Attempted to call Counter() from the server',
  "but Counter is on the client. It's not possible",
  'to invoke a client function from the server.',
];

// camera marks
const CAM_BELT: CameraState = { x: 640, y: 350, k: 1.08 };
const CAM_GATE: CameraState = { x: GATE_X, y: 330, k: 1.3 };
const CAM_PROXY: CameraState = { x: 350, y: 300, k: 1.28 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~96s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_BELT, cameraInterp);

  const gateU = tl.channel('gateU', 0); // belt + scanner draw on
  const g1U = tl.channel('g1U', 0); // string / number / date
  const g2U = tl.channel('g2U', 0); // map / set
  const pU = tl.channel('pU', 0); // the promise
  const fn1U = tl.channel('fn1U', 0); // onClick bounce
  const fn2U = tl.channel('fn2U', 0); // delay bounce
  const clsU = tl.channel('clsU', 0); // class instance bounce
  const recurU = tl.channel('recurU', 0); // the recursive rule
  const proxyU = tl.channel('proxyU', 0); // sealed module proxy panel
  const refU = tl.channel('refU', 0); // the reference boards
  const dimU = tl.channel('dimU', 0);
  const lawU = tl.channel('lawU', 0);

  // — beat 1 · the gate exists because the wire is text —
  tl.caption({
    at: 0.5,
    dur: 8.4,
    text: 'The wire is a stream of text. So the boundary between server and client is really a gate: every value that crosses must survive being flattened into text and revived inside a different memory.',
  });
  tl.tween(gateU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.hold(8.9, 0.5);

  // — beat 2 · the easy travelers —
  tl.caption({
    at: 9.4,
    dur: 7.6,
    text: 'The easy travelers sail through. Strings and numbers are already text. A date stamps itself with a dollar D and its clock time, ready to be revived on the far side.',
  });
  tl.tween(g1U, 1, { at: 9.7, dur: 6.4, ease: ease.linear });
  tl.hold(17.0, 0.5);

  // — beat 3 · collections unroll —
  tl.caption({
    at: 17.5,
    dur: 6.8,
    text: 'Maps and sets ride too. The gate unrolls each one into a row of its own on the tape, and sends a short address across in its place.',
  });
  tl.tween(g2U, 1, { at: 17.8, dur: 5.4, ease: ease.linear });
  tl.hold(24.3, 0.5);

  // — beat 4 · a promise boards —
  tl.caption({
    at: 24.8,
    dur: 8.0,
    text: 'Even a promise can board. It crosses as dollar at eight — an address for a value that does not exist yet. The row that keeps the promise follows down the tape whenever it resolves.',
  });
  tl.tween(pU, 1, { at: 25.1, dur: 5.2, ease: ease.linear });
  tl.hold(32.8, 0.5);

  // — beat 5 · a function slams into the gate —
  tl.caption({
    at: 33.3,
    dur: 7.8,
    text: 'Then a function walks up — a click handler — and the gate slams shut. A function is a closure over this machine, its memory, its scope. Flatten that to text and you would ship a lie.',
  });
  tl.tween(cam, CAM_GATE, { at: 33.5, dur: 1.2, ease: ease.move });
  tl.tween(fn1U, 1, { at: 34.2, dur: 4.4, ease: ease.linear });
  tl.hold(41.1, 0.5);

  // — beat 6 · React refuses by name —
  tl.caption({
    at: 41.6,
    dur: 8.0,
    text: 'React refuses loudly, and points at the one legal door: a function may only cross if you explicitly mark it with the directive use server. Hold that thought for the final chapter.',
  });
  tl.tween(fn2U, 1, { at: 42.2, dur: 4.6, ease: ease.linear });
  tl.hold(49.6, 0.5);

  // — beat 7 · class instances bounce —
  tl.caption({
    at: 50.1,
    dur: 7.8,
    text: 'Class instances bounce too. Only plain objects and a few built-ins may board — anything leaning on methods or a custom prototype would arrive as a hollow shell of itself.',
  });
  tl.tween(clsU, 1, { at: 50.6, dur: 4.6, ease: ease.linear });
  tl.hold(57.9, 0.5);

  // — beat 8 · the rule is recursive —
  tl.caption({
    at: 58.4,
    dur: 7.4,
    text: 'And the gate is recursive. Every prop, every child, every value nested inside anything headed for a client component takes this same walk. There is no diplomatic pouch.',
  });
  tl.tween(cam, CAM_WIDE, { at: 58.6, dur: 1.2, ease: ease.move });
  tl.tween(recurU, 1, { at: 59.2, dur: 1.4, ease: ease.enter });
  tl.hold(65.8, 0.5);

  // — beat 9 · the sealed proxy —
  tl.caption({
    at: 66.3,
    dur: 8.4,
    text: 'So how did the counter cross in chapter two? On the server, its file is never even loaded. Importing it hands you a sealed proxy — try to call it there, and it throws.',
  });
  tl.tween(recurU, 0, { at: 66.5, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_PROXY, { at: 66.6, dur: 1.3, ease: ease.move });
  tl.tween(proxyU, 1, { at: 67.4, dur: 1.6, ease: ease.enter });
  tl.hold(74.7, 0.5);

  // — beat 10 · the reference boards —
  tl.caption({
    at: 75.2,
    dur: 7.8,
    text: 'That proxy is a reference: a module address, an export name, a promise of script files. This is what boards the tape — directions to code, never the code itself.',
  });
  tl.tween(cam, CAM_BELT, { at: 75.4, dur: 1.3, ease: ease.move });
  tl.tween(refU, 1, { at: 76.0, dur: 5.0, ease: ease.linear });
  tl.hold(83.0, 0.5);

  // — beat 11 · the law —
  tl.caption({
    at: 83.5,
    dur: 9.2,
    text: 'One law runs this border. Data crosses by value. Components cross by reference. Functions do not cross at all — until we open the one marked door, in the final chapter.',
  });
  tl.tween(dimU, 1, { at: 83.9, dur: 1.2, ease: ease.move });
  tl.tween(lawU, 1, { at: 85.2, dur: 1.6, ease: ease.enter });
  tl.hold(92.7, 1.2);

  return { tl, cam, gateU, g1U, g2U, pU, fn1U, fn2U, clsU, recurU, proxyU, refU, dimU, lawU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

/** traveler position/appearance along the belt for one 0..1 window */
function travel(u: number, dock: number) {
  if (u <= 0) return null;
  const scanned = u > 0.5;
  let x: number;
  let y = BELT_Y;
  if (u < 0.45) x = lerp(BELT_X0 + 40, GATE_X - 52, u / 0.45);
  else if (u < 0.55) x = GATE_X - 52;
  else {
    const t = (u - 0.55) / 0.45;
    x = lerp(GATE_X + 46, DOCK.x, t);
    y = lerp(BELT_Y, DOCK.y + dock * DOCK.dy, t);
  }
  return { x, y, scanned, atGate: u >= 0.45 && u <= 0.55 };
}

/** bounce position for a rejected traveler */
function bounce(u: number) {
  if (u <= 0) return null;
  let x: number;
  let y = BELT_Y;
  let op = 1;
  let atGate = false;
  if (u < 0.45) x = lerp(BELT_X0 + 40, GATE_X - 52, u / 0.45);
  else if (u < 0.55) {
    x = GATE_X - 52;
    atGate = true;
  } else {
    const t = (u - 0.55) / 0.45;
    x = GATE_X - 52 - 130 * t;
    y = BELT_Y - 44 * Math.sin(Math.PI * Math.min(t * 1.6, 1)) + 190 * t * t;
    op = 1 - 0.75 * t;
  }
  return { x, y, op, atGate };
}

function Chip({ x, y, text, color, mono = true, opacity = 1 }: { x: number; y: number; text: string; color: string; mono?: boolean; opacity?: number }) {
  const w = 18 + text.length * (mono ? 6.6 : 6.0);
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - 13} width={w} height={26} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.3} />
      <text x={x} y={y + 4} textAnchor="middle" fill={color} fontSize={11} fontFamily={mono ? MONO : undefined}>
        {text}
      </text>
    </g>
  );
}

function ErrCard({ x, y, lines, u, title }: { x: number; y: number; lines: string[]; u: number; title: string }) {
  if (u <= 0) return null;
  const h = 34 + lines.length * 16;
  return (
    <g opacity={u} transform={`translate(${x},${y + 8 * (1 - u)})`}>
      <rect x={-172} y={0} width={344} height={h} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.5} />
      <text x={-158} y={20} fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO} fontWeight={700}>
        {title}
      </text>
      {lines.map((l, i) => (
        <text key={i} x={-158} y={38 + i * 16} fill={colors.TEXT} fontSize={10.5} fontFamily={MONO} opacity={0.92}>
          {l}
        </text>
      ))}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gateU = s.get(scene.gateU);
  const g1U = s.get(scene.g1U);
  const g2U = s.get(scene.g2U);
  const pU = s.get(scene.pU);
  const fn1U = s.get(scene.fn1U);
  const fn2U = s.get(scene.fn2U);
  const clsU = s.get(scene.clsU);
  const recurU = s.get(scene.recurU);
  const proxyU = s.get(scene.proxyU);
  const refU = s.get(scene.refU);
  const dimU = s.get(scene.dimU);
  const lawU = s.get(scene.lawU);

  const mainOp = 1 - 0.88 * dimU;

  // docked (already boarded) travelers stay visible once their window closed
  const docked: Array<{ trav: Traveler; on: boolean }> = [
    ...G1.map((t, i) => ({ trav: t, on: win(g1U, G1.length, i, 1.6) >= 1 })),
    ...G2.map((t, i) => ({ trav: t, on: win(g2U, G2.length, i, 1.6) >= 1 })),
    { trav: PROMISE, on: pU >= 1 },
    { trav: REF, on: refU >= 1 },
  ];

  const anyAtGate =
    [...G1.map((_, i) => travel(win(g1U, G1.length, i, 1.6), 0)), ...G2.map((_, i) => travel(win(g2U, G2.length, i, 1.6), 0)), travel(pU, 0), travel(refU, 0)].some(
      (p) => p?.atGate,
    ) || [bounce(fn1U), bounce(fn2U), bounce(clsU)].some((p) => p?.atGate);

  const movers: Array<{ trav: Traveler; u: number }> = [
    ...G1.map((t, i) => ({ trav: t, u: win(g1U, G1.length, i, 1.6) })),
    ...G2.map((t, i) => ({ trav: t, u: win(g2U, G2.length, i, 1.6) })),
    { trav: PROMISE, u: pU },
    { trav: REF, u: refU },
  ];

  const rejects: Array<{ label: string; u: number }> = [
    { label: 'onClick', u: fn1U },
    { label: 'delay()', u: fn2U },
    { label: 'a class instance', u: clsU },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={mainOp}>
          {/* the belt */}
          <g opacity={gateU}>
            <line x1={BELT_X0} y1={BELT_Y + 20} x2={GATE_X - 30} y2={BELT_Y + 20} stroke={colors.GRID} strokeWidth={2} />
            <line x1={GATE_X + 30} y1={BELT_Y + 20} x2={BELT_X1} y2={BELT_Y + 20} stroke={colors.GRID} strokeWidth={2} />
            {Array.from({ length: 9 }, (_, i) => (
              <path key={i} d={`M ${BELT_X0 + 30 + i * 52} ${BELT_Y + 20} l 8 -5 v 10 z`} fill={colors.GRID} opacity={0.7} />
            ))}
            <text x={BELT_X0 + 4} y={BELT_Y + 44} fill={colors.SECONDARY} fontSize={12} fontWeight={650}>
              SERVER
            </text>
            <text x={BELT_X1 - 4} y={BELT_Y + 44} textAnchor="end" fill={colors.ACCENT} fontSize={12} fontWeight={650}>
              CLIENT
            </text>

            {/* the gate: two posts + scanner */}
            <rect x={GATE_X - 30} y={BELT_Y - 118} width={14} height={148} rx={5} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
            <rect x={GATE_X + 16} y={BELT_Y - 118} width={14} height={148} rx={5} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
            <rect x={GATE_X - 30} y={BELT_Y - 140} width={60} height={24} rx={6} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
            <text x={GATE_X} y={BELT_Y - 123} textAnchor="middle" fill={colors.WARM} fontSize={11}>
              the gate
            </text>
            <text x={GATE_X} y={BELT_Y - 152} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
              renderModelDestructive — ReactFlightServer.js
            </text>
            {/* scan beam */}
            <line x1={GATE_X - 16} y1={BELT_Y - 112} x2={GATE_X - 16} y2={BELT_Y + 16} stroke={colors.WARM} strokeWidth={anyAtGate ? 2.4 : 1} opacity={anyAtGate ? 0.95 : 0.3} />
          </g>

          {/* boarded dock list */}
          <g opacity={gateU}>
            <text x={DOCK.x + 100} y={DOCK.y - 34} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              boarded — as written on the tape
            </text>
            {docked.map(
              ({ trav, on }) =>
                on && (
                  <g key={trav.dock}>
                    <text x={DOCK.x - 40} y={DOCK.y + trav.dock * DOCK.dy + 4} textAnchor="end" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
                      {trav.label}
                    </text>
                    <text x={DOCK.x - 30} y={DOCK.y + trav.dock * DOCK.dy + 4} fill={colors.MUTED} fontSize={10}>
                      →
                    </text>
                    <text x={DOCK.x - 10} y={DOCK.y + trav.dock * DOCK.dy + 4} fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO} fontWeight={650}>
                      {trav.out}
                    </text>
                    {trav.note && (
                      <text x={DOCK.x + 220} y={DOCK.y + trav.dock * DOCK.dy + 4} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                        {trav.note}
                      </text>
                    )}
                  </g>
                ),
            )}
          </g>

          {/* moving travelers */}
          {movers.map(({ trav, u }) => {
            const p = travel(u, trav.dock);
            if (!p || u >= 1) return null;
            return <Chip key={trav.label} x={p.x} y={p.y - 16} text={p.scanned ? trav.out : trav.label} color={p.scanned ? colors.POSITIVE : colors.TEXT} opacity={1} />;
          })}

          {/* rejected travelers */}
          {rejects.map(({ label, u }) => {
            const p = bounce(u);
            if (!p || u >= 1) return null;
            return <Chip key={label} x={p.x} y={p.y - 16} text={label} color={colors.NEGATIVE} opacity={p.op} />;
          })}

          {/* error cards above the gate */}
          <ErrCard x={GATE_X - 210} y={128} lines={EH_ERR} u={fn1U > 0.5 ? clamp01((fn1U - 0.5) / 0.2) * (1 - 0.85 * clamp01(proxyU * 4)) : 0} title="Error" />
          <ErrCard x={GATE_X + 190} y={112} lines={FN_ERR} u={fn2U > 0.5 ? clamp01((fn2U - 0.5) / 0.2) * (1 - 0.85 * clamp01(proxyU * 4)) : 0} title="Error" />
          <ErrCard x={GATE_X - 20} y={188} lines={CLS_ERR} u={clsU > 0.5 ? clamp01((clsU - 0.5) / 0.2) * (1 - 0.85 * clamp01(proxyU * 4)) : 0} title="Error" />

          {/* the recursive rule */}
          {recurU > 0.02 && (
            <g opacity={recurU * (1 - clamp01(proxyU * 3))}>
              <text x={300} y={520} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                {'["$","$L2",null,{ …every value in here walks the belt too }]'}
              </text>
              <path d={`M 330 528 C 260 580, 140 520, ${BELT_X0 + 40} ${BELT_Y + 34}`} fill="none" stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="4 4" opacity={0.8} />
            </g>
          )}

          {/* the sealed proxy panel */}
          {proxyU > 0.02 && (
            <g opacity={proxyU}>
              <rect x={104} y={116} width={472} height={196} rx={13} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
              <text x={126} y={144} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO} fontWeight={650}>
                Counter.js
              </text>
              <text x={230} y={144} fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>
                'use client'
              </text>
              <text x={126} y={170} fill={colors.MUTED} fontSize={11}>
                imported on the server → never executed, replaced by a proxy:
              </text>
              {[
                '$$typeof: Symbol.for(\'react.client.reference\')',
                '$$id:     "./src/Counter.js#Counter"',
                '$$async:  false',
              ].map((l, i) => (
                <text key={i} x={142} y={196 + i * 19} fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
                  {l}
                </text>
              ))}
              <text x={126} y={272} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                registerClientReference — ReactFlightWebpackReferences.js
              </text>
              <ErrCard x={370} y={330} lines={CALL_ERR} u={clamp01((proxyU - 0.5) / 0.5)} title="Error — if you call it here" />
            </g>
          )}
        </g>

        {/* the law */}
        {lawU > 0.02 && (
          <g opacity={lawU}>
            <rect x={300} y={196} width={680} height={240} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
            <text x={640} y={252} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={700}>
              The law of the boundary
            </text>
            <text x={640} y={300} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
              Data crosses by value.
            </text>
            <text x={640} y={332} textAnchor="middle" fill={colors.ACCENT} fontSize={15.5}>
              Components cross by reference.
            </text>
            <text x={640} y={364} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15.5}>
              Functions do not cross —
            </text>
            <text x={640} y={402} textAnchor="middle" fill={colors.WARM} fontSize={13.5} fontFamily={MONO}>
              except through one marked door: 'use server'
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
