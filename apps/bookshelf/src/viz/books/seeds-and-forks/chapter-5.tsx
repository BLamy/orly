// Load New Code, Then Find the Edges
//
// Backed by: plans/deterministic-simulation-testing.md ("Hot load", "What a fork
// can't do yet", "Says when it can't", the definition-of-done table, and "It tests
// apps on workerd, not workerd"), results/forks.txt (the hot load at the moment with
// two orders: 315 unchanged, 175 with the new code, the same stock and order count;
// the page keeps its receipt; 348 of 348 forks answered), and forks/whole-stack.js
// (the replacement price function, written by hand and evaluated in the module's scope).
//
// Machine: a code hunk swapped in place, two receipts as bars that shrink from 315
// cents to 175, a page whose state survives the swap, then the limits as rows with
// their real status, and the definition of done with what is not met marked as such.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/* ------------------------------------------------------------------ data */
const OLD_LINES = [
  'const discount = loyal ? Math.round(full * 0.1) : 0;',
  'return { total: full - discount, loyal };',
];
const NEW_LINES = [
  'return { total: Math.round(full / 2),',
  '  loyal: "half price, after " + n + " orders" };',
];

const LIMITS: { what: string; status: string; quiet: boolean; hang: boolean }[] = [
  { what: 'requestAnimationFrame', status: 'never fires', quiet: false, hang: false },
  { what: 'fetch, XMLHttpRequest', status: 'never finish, unless wrapped', quiet: false, hang: true },
  { what: 'import() of a new chunk', status: 'never finishes', quiet: false, hang: true },
  { what: 'IndexedDB', status: 'never finishes: refuse by name', quiet: false, hang: true },
  { what: 'new Blob, cookies, iframes', status: 'the process hangs', quiet: false, hang: true },
  { what: 'new Worker', status: 'never finishes', quiet: false, hang: true },
  { what: 'a call with no answer', status: 'gets 0, and a log line', quiet: true, hang: false },
  { what: 'a worker file never read', status: 'reads as zeros', quiet: true, hang: false },
];

const GOALS: { what: string; status: string; tone: 'ok' | 'partial' | 'no' | 'unmeasured' }[] = [
  { what: 'any point · a fork at every 5th step', status: '348 of 348 answered · spike', tone: 'ok' },
  { what: 'hot load · code written by hand', status: 'spike, not from a rebuild', tone: 'partial' },
  { what: 'says when it can\'t', status: 'not met', tone: 'no' },
  { what: 'at an hour', status: 'not measured', tone: 'unmeasured' },
  { what: 'in the app', status: 'not built', tone: 'unmeasured' },
];
const TONE = {
  ok: colors.POSITIVE,
  partial: colors.WARM,
  no: colors.NEGATIVE,
  unmeasured: colors.MUTED,
} as const;

const CAM_WIDE: CameraState = { ...CAMERA_HOME };
const CAM_CODE: CameraState = { x: 620, y: 340, k: 1.0 }; // keeps both panels in frame
const CAM_LIMITS: CameraState = { x: 930, y: 340, k: 1.06 };

const C1 =
  'Last, new code. In the forked worker, the price rule changes to half price, and in the forked page, a new Shop component arrives.';
const C2 =
  'The state stays put. The Durable Object keeps its stock and its orders, and the page keeps its receipts. Only the code changes.';
const C3 =
  'At the same moment, after two orders, the unchanged code gives the loyal price, three dollars and fifteen cents. With the new code, the same click gives one dollar and seventy-five cents.';
const C4 =
  'That new code was written by hand and loaded into the running fork, not produced by a rebuild. A running Durable Object keeps the method it was given.';
const C5 =
  'Now the edges. On a page, animation frames never fire, and fetch and the older request calls never finish unless they go through the wrapper.';
const C6 =
  'The indexed database, blobs, cookies, iframes, and new Workers either hang or never finish. Each one has to be refused by name, or given a stand-in.';
const C7 =
  'The quiet failures are the dangerous ones. A page call with no answer gets a zero, and a worker file the fork never read comes back as zeros.';
const C8 =
  'So the rule is simple: anything a fork cannot do must stop with its name. That rule is not met yet, so no fork answer should be trusted until it is.';
const C9 =
  'Measured, or not. Forks at every fifth step: three hundred forty-eight of three hundred forty-eight answered. An hour-long session is not measured, and the button in the app is not built.';
const C10 =
  'It tests apps on workerd, not workerd itself. What happens between two awaits is still the JavaScript engine\'s, and the scheduling inside workerd is still workerd\'s.';
const C11 = 'Seeds find the bug, forks let you stand inside it, and the edges are written down.';

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  leftU: ChannelRef<number>;
  newU: ChannelRef<number>;
  barU: ChannelRef<number>;
  newBarU: ChannelRef<number>;
  recvU: ChannelRef<number>; // the receipt comparison appears with its caption
  byHandU: ChannelRef<number>;
  shopU: ChannelRef<number>;
  shopV: ChannelRef<number>;
  limU: ChannelRef<number>;
  limK: ChannelRef<number>;
  hangU: ChannelRef<number>;
  quietU: ChannelRef<number>;
  ruleU: ChannelRef<number>;
  goalU: ChannelRef<number>;
  goalK: ChannelRef<number>;
  scopeU: ChannelRef<number>;
  endU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const leftU = tl.channel('leftU', 0);
  const newU = tl.channel('newU', 0);
  const barU = tl.channel('barU', 0);
  const newBarU = tl.channel('newBarU', 0);
  const recvU = tl.channel('recvU', 0);
  const byHandU = tl.channel('byHandU', 0);
  const shopU = tl.channel('shopU', 0);
  const shopV = tl.channel('shopV', 0);
  const limU = tl.channel('limU', 0);
  const limK = tl.channel('limK', 0);
  const hangU = tl.channel('hangU', 0);
  const quietU = tl.channel('quietU', 0);
  const ruleU = tl.channel('ruleU', 0);
  const goalU = tl.channel('goalU', 0);
  const goalK = tl.channel('goalK', 0);
  const scopeU = tl.channel('scopeU', 0);
  const endU = tl.channel('endU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · new code arrives: a hunk in the worker, a component on the page —
  tl.tween(leftU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(shopU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_CODE, { at: 1.0, dur: 1.6, ease: ease.move });
  let t = 0.4;
  t = tl.caption({ at: t, dur: 7.2, text: C1 });
  tl.tween(newU, 1, { at: 3.4, dur: 1.2, ease: ease.enter });
  tl.set(shopV, 1, 3.6);
  t = tl.hold(t, 0.4);

  // — Beat 2 · the state stays put —
  t = tl.caption({ at: t, dur: 7.0, text: C2 });
  t = tl.hold(t, 0.4);

  // — Beat 3 · the same moment, two prices —
  tl.tween(barU, 1, { at: t + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(recvU, 1, { at: t, dur: 0.8, ease: ease.enter });
  tl.tween(newBarU, 1, { at: t + 4.0, dur: 1.6, ease: ease.move });
  t = tl.caption({ at: t, dur: 8.0, text: C3 });

  // — Beat 4 · written by hand, loaded into the running fork —
  tl.tween(byHandU, 1, { at: t + 0.6, dur: 0.8, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.4, text: C4 });
  tl.tween(leftU, 0, { at: t - 0.4, dur: 0.4, ease: ease.move });
  t = tl.hold(t, 0.4);

  // — Beat 5 · the edges: what a page cannot do yet —
  tl.tween(shopU, 0, { at: t - 0.4, dur: 0.6, ease: ease.move });
  tl.tween(limU, 1, { at: t - 0.2, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_LIMITS, { at: t - 0.2, dur: 1.4, ease: ease.move });
  LIMITS.forEach((_, i) => tl.set(limK, i + 1, t + 0.6 + i * 0.4));
  t = tl.caption({ at: t, dur: 7.0, text: C5 });

  // — Beat 6 · the calls that hang —
  tl.tween(hangU, 1, { at: t + 0.4, dur: 0.8, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.2, text: C6 });

  // — Beat 7 · the quiet ones —
  tl.tween(quietU, 1, { at: t + 0.4, dur: 0.8, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.4, text: C7 });

  // — Beat 8 · the rule, and its status —
  tl.tween(limU, 0, { at: t - 0.4, dur: 0.6, ease: ease.move });
  tl.tween(ruleU, 1, { at: t - 0.2, dur: 0.8, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.4, text: C8 });

  // — Beat 9 · the definition of done, as measured —
  tl.tween(ruleU, 0, { at: t - 0.4, dur: 0.6, ease: ease.move });
  tl.tween(goalU, 1, { at: t - 0.2, dur: 0.6, ease: ease.enter });
  GOALS.forEach((_, i) => tl.set(goalK, i + 1, t + 0.4 + i * 0.6));
  t = tl.caption({ at: t, dur: 8.0, text: C9 });

  // — Beat 10 · what the test covers: the app, not workerd —
  tl.tween(goalU, 0, { at: t - 0.4, dur: 0.6, ease: ease.move });
  tl.tween(scopeU, 1, { at: t - 0.2, dur: 1.0, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.0, text: C10 });

  // — Beat 11 · clean ending: everything steps back, one opaque card remains —
  tl.tween(scopeU, 0, { at: t - 0.4, dur: 0.6, ease: ease.move });
  tl.tween(endU, 1, { at: t - 0.2, dur: 0.8, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 0.6, dur: 1.0, ease: ease.enter });
  t = tl.caption({ at: t, dur: 6.0, text: C11 });
  t = tl.hold(t, 0.8);

  return {
    tl,
    cam,
    leftU,
    newU,
    barU,
    newBarU,
    recvU,
    byHandU,
    shopU,
    shopV,
    limU,
    limK,
    hangU,
    quietU,
    ruleU,
    goalU,
    goalK,
    scopeU,
    endU,
    closeU,
  };
}

const scene = buildScene();

/* ------------------------------------------------------------- drawing */
function CodeHunks({ opacity, newU, byHand }: { opacity: number; newU: number; byHand: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <rect x={84} y={182} width={532} height={170} rx={12} fill={colors.BG} stroke={colors.GRID} />
      <text x={104} y={210} fill={colors.MUTED} fontFamily={SANS} fontSize={15}>
        the price rule · shop.ts, hot loaded into the fork
      </text>
      {OLD_LINES.map((line, i) => (
        <text key={line} x={104} y={244 + i * 26} fill={colors.NEGATIVE} fontFamily={MONO} fontSize={14} opacity={1 - 0.7 * newU}>
          {`- ${line}`}
        </text>
      ))}
      <g opacity={newU}>
        {NEW_LINES.map((line, i) => (
          <text key={line} x={104} y={300 + i * 26} fill={colors.POSITIVE} fontFamily={MONO} fontSize={14}>
            {`+ ${line}`}
          </text>
        ))}
      </g>
      <g opacity={byHand}>
        <rect x={470} y={312} width={132} height={26} rx={13} fill={colors.WARM} fillOpacity={0.2} />
        <text x={536} y={330} textAnchor="middle" fill={colors.WARM} fontFamily={SANS} fontSize={13} fontWeight={600}>
          written by hand
        </text>
      </g>
    </g>
  );
}

function Receipts({ opacity, bar, newBar }: { opacity: number; bar: number; newBar: number }) {
  if (opacity <= 0) return null;
  const SCALE = 460 / 400;
  const unchangedW = 315 * SCALE * bar;
  const cents = 315 - (315 - 175) * newBar;
  const newW = cents * SCALE;
  return (
    <g opacity={opacity}>
      <text x={84} y={392} fill={colors.MUTED} fontFamily={SANS} fontSize={15}>
        unchanged code · the same moment, two orders in
      </text>
      <rect x={84} y={404} width={460} height={30} rx={6} fill={colors.BG} stroke={colors.GRID} />
      <rect x={84} y={404} width={unchangedW} height={30} rx={6} fill={colors.WARM} fillOpacity={0.6} />
      <text x={94} y={425} fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
        {bar > 0.9 ? '315 cents · loyal' : ''}
      </text>

      <text x={84} y={466} fill={colors.MUTED} fontFamily={SANS} fontSize={15}>
        after the hot load · the same click
      </text>
      {/* the new price only exists once the hot load has happened */}
      <g opacity={Math.min(1, newBar * 6)}>
        <rect x={84} y={478} width={460} height={30} rx={6} fill={colors.BG} stroke={colors.GRID} />
        <rect x={84} y={478} width={newW} height={30} rx={6} fill={colors.ACCENT} fillOpacity={0.6} />
        <text x={94} y={499} fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
          {`${Math.round(cents)} cents${newBar > 0.9 ? ' · half price' : ''}`}
        </text>
      </g>

      <text x={84} y={536} fill={colors.MUTED} fontFamily={SANS} fontSize={14}>
        same stock (espresso 5, bagel 4) and the same two orders before the click
      </text>
    </g>
  );
}

function ShopCard({ opacity, v }: { opacity: number; v: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <rect x={700} y={150} width={500} height={250} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={722} y={182} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        forked page
      </text>
      <text x={722} y={222} fill={colors.TEXT} fontFamily={SANS} fontSize={24} fontWeight={700}>
        {v < 0.5 ? 'Shop' : 'Shop · new component'}
      </text>
      <text x={722} y={254} fill={colors.MUTED} fontFamily={SANS} fontSize={15}>
        {v < 0.5 ? 'the component as it was' : 'hot loaded into this moment'}
      </text>
      <rect x={722} y={282} width={456} height={80} rx={10} fill={colors.BG} stroke={colors.GRID} />
      <text x={742} y={310} fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
        receipt aba2d27b-3194-4630-8e92-310c…
      </text>
      <text x={742} y={336} fill={colors.POSITIVE} fontFamily={SANS} fontSize={15} fontWeight={600}>
        kept: the page's state did not reset
      </text>
    </g>
  );
}

function LimitRows({ opacity, k, hang, quiet }: { opacity: number; k: number; hang: number; quiet: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <rect x={700} y={150} width={500} height={390} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={722} y={182} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        what a fork cannot do yet · page and worker
      </text>
      {LIMITS.slice(0, k).map((row, i) => {
        const y = 230 + i * 40;
        const emphasize = (row.hang && hang > 0.5) || (row.quiet && quiet > 0.5);
        const color = row.quiet ? colors.NEGATIVE : row.hang ? colors.WARM : colors.MUTED;
        return (
          <g key={row.what}>
            <rect x={722} y={y - 17} width={456} height={34} rx={8} fill={colors.BG} stroke={emphasize ? color : colors.GRID} strokeWidth={emphasize ? 1.6 : 1} />
            <text x={740} y={y + 5} fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
              {row.what}
            </text>
            <text x={1160} y={y + 5} textAnchor="end" fill={row.quiet ? colors.NEGATIVE : colors.WARM} fontFamily={SANS} fontSize={14} fontWeight={600}>
              {row.status}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function RuleCard({ u }: { u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={700} y={150} width={500} height={390} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={950} y={250} textAnchor="middle" fill={colors.TEXT} fontFamily={SANS} fontSize={26} fontWeight={700}>
        anything a fork cannot do
      </text>
      <text x={950} y={290} textAnchor="middle" fill={colors.TEXT} fontFamily={SANS} fontSize={26} fontWeight={700}>
        must stop with its name
      </text>
      <rect x={830} y={330} width={240} height={44} rx={22} fill={colors.NEGATIVE} fillOpacity={0.2} stroke={colors.NEGATIVE} strokeWidth={1.5} />
      <text x={950} y={359} textAnchor="middle" fill={colors.NEGATIVE} fontFamily={SANS} fontSize={20} fontWeight={800}>
        not met yet
      </text>
      <text x={950} y={420} textAnchor="middle" fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        a list of what is unsupported, each with a test that it refuses
      </text>
    </g>
  );
}

function GoalRows({ opacity, k }: { opacity: number; k: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <rect x={700} y={150} width={500} height={390} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={722} y={182} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        the definition of done · where it stands
      </text>
      {GOALS.slice(0, k).map((g, i) => {
        const y = 226 + i * 62;
        const color = TONE[g.tone];
        return (
          <g key={g.what}>
            <text x={722} y={y} fill={colors.TEXT} fontFamily={SANS} fontSize={16}>
              {g.what}
            </text>
            <rect x={722} y={y + 12} width={456} height={30} rx={8} fill={color} fillOpacity={0.14} stroke={color} strokeWidth={1.2} />
            <text x={1160} y={y + 33} textAnchor="end" fill={color} fontFamily={SANS} fontSize={14} fontWeight={700}>
              {g.status}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ScopeCard({ u }: { u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={700} y={150} width={500} height={390} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <rect x={728} y={190} width={444} height={310} rx={14} fill={colors.BG} stroke={colors.MUTED} strokeDasharray="6 5" strokeWidth={1.5} />
      <text x={748} y={218} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        workerd · its own scheduling, not tested here
      </text>
      <rect x={780} y={250} width={340} height={170} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
      <text x={800} y={282} fill={colors.ACCENT} fontFamily={SANS} fontSize={16} fontWeight={700}>
        your app code · tested here
      </text>
      <text x={800} y={318} fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
        shop, Durable Object, page
      </text>
      <rect x={800} y={350} width={300} height={28} rx={8} fill={colors.WARM} fillOpacity={0.2} />
      <text x={950} y={369} textAnchor="middle" fill={colors.WARM} fontFamily={SANS} fontSize={14} fontWeight={600}>
        between two awaits: V8
      </text>
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={240} y={250} width={800} height={180} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontFamily={SANS} fontSize={26} fontWeight={600}>
        Seeds find the bug. Forks let you stand inside it.
      </text>
      <text x={640} y={370} textAnchor="middle" fill={colors.WARM} fontFamily={SANS} fontSize={26} fontWeight={600}>
        The edges are written down.
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const end = clamp01(s.get(scene.endU));
  const dim = 1 - 0.85 * end;
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <CodeHunks
            opacity={clamp01(s.get(scene.leftU))}
            newU={clamp01(s.get(scene.newU))}
            byHand={clamp01(s.get(scene.byHandU))}
          />
          <Receipts
            opacity={clamp01(s.get(scene.leftU)) * clamp01(s.get(scene.recvU))}
            bar={clamp01(s.get(scene.barU))}
            newBar={clamp01(s.get(scene.newBarU))}
          />
          <ShopCard opacity={clamp01(s.get(scene.shopU))} v={clamp01(s.get(scene.shopV))} />
          <LimitRows
            opacity={clamp01(s.get(scene.limU))}
            k={Math.floor(s.get(scene.limK))}
            hang={clamp01(s.get(scene.hangU))}
            quiet={clamp01(s.get(scene.quietU))}
          />
          <RuleCard u={clamp01(s.get(scene.ruleU))} />
          <GoalRows opacity={clamp01(s.get(scene.goalU))} k={Math.floor(s.get(scene.goalK))} />
          <ScopeCard u={clamp01(s.get(scene.scopeU))} />
        </g>
        <ClosingCard u={clamp01(s.get(scene.closeU))} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
