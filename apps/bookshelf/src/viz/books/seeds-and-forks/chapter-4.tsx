// Fork Both Sides at One Moment
//
// Backed by: plans/deterministic-simulation-testing.md ("A moment on both sides",
// "What a fork of a page does", the Buy table, the four cut cases), results/forks.txt
// (page parent 775M and fork 28M; worker parent 347M and fork 17M; receipts at 0, 1
// and 2 orders; the fourth order was new), forks/do-shop/shop.ts and shop-object.ts
// (every third order is 10% off; stock and orders in a Durable Object's SQL; served is
// a field), and FORKS.md (the page is Replay's Chromium 108; the worker is workerd).
//
// Machine: one shared clock with two recordings and four moments. A fork copies both
// sides at the playhead and runs on. In the forked page, Buy goes out through the
// forked worker's socket to the Durable Object and comes back as a receipt. The four
// cut cases at the end are the plan's table, drawn as they were measured.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/* ------------------------------------------------------------------ data */
// Receipts from the forks in results/forks.txt, one fork per moment on the shared clock.
type Fork = {
  moment: number; // 0..3: orders already placed before the fork
  cents: number;
  left: number;
  served: number;
  orderId: string;
  match: 'recorded' | 'new';
  loyal: boolean;
  fork: number; // when the fork appears
  click: number; // when Buy is pressed in the forked page
};
const FORKS: Fork[] = [
  { moment: 0, cents: 350, left: 6, served: 2, orderId: 'b05c9e3f…', match: 'recorded', loyal: false, fork: 23.4, click: 35.0 },
  { moment: 1, cents: 350, left: 5, served: 4, orderId: '14158ec9…', match: 'recorded', loyal: false, fork: 44.8, click: 46.0 },
  { moment: 2, cents: 315, left: 4, served: 6, orderId: '8e875cf9…', match: 'recorded', loyal: true, fork: 51.6, click: 53.0 },
  { moment: 3, cents: 350, left: 3, served: 10, orderId: '3b38ea82…', match: 'new', loyal: false, fork: 58.8, click: 60.0 },
];
const MOMENT_X = [150, 270, 390, 510];
const MOMENT_LABEL = ['0 orders', '1 order', '2 orders', '3 orders'];
const ORDER_X = [210, 330, 450]; // where each recorded order sits between moments

// The request path: page Buy → socket → worker (Durable Object) and back.
const P_BUY: [number, number] = [830, 218];
const P_SOCK: [number, number] = [990, 281];
const P_WORK: [number, number] = [990, 340];
const PATH: [number, number][] = [P_BUY, P_SOCK, P_WORK, P_SOCK, P_BUY];

const CAM_WIDE: CameraState = { ...CAMERA_HOME };
const CAM_CUT: CameraState = { x: 900, y: 330, k: 1.08 };

const C1 =
  "Now the time travel. This shop is recorded twice: the page runs in Replay's Chromium, and the worker runs in workerd, under Replay as well.";
const C2 =
  'The two recordings share one timeline. A moment is a pair of steps, one from each side, and every step has its place on that shared clock.';
const C3 =
  'Replay can get to any step of a recording. A fork used to be a paused process: you could read it, but it never went back to running.';
const C4 =
  'A fork is a copy of each process at that step, made copy on write, so it costs little. A page fork was about 28 megabytes, next to a parent of 775 megabytes.';
const C5 =
  'Fork both sides before the first order, then click Buy in the forked page. The receipt is the one the real session got: three dollars and fifty cents, with six left.';
const C6 =
  "The click becomes a request, sent through the forked worker's own socket. The worker runs its real code, and the answer comes back to the page.";
const C7 =
  'The same happens at the next moment, after one order, and the receipt matches the real session again: three dollars and fifty cents, with five left.';
const C8 =
  'The third receipt is the loyal price, three dollars and fifteen cents, because every third order is ten percent off. It matches as well.';
const C9 =
  'A fourth order, which never happened in the recording, is a new receipt. Its stock and its served count carry on from the fork itself.';
const C10 =
  'The hard case is a request in flight across the cut. In three of the four places it can be, the fork gives the receipt the session got, handled once.';
const C11 =
  'The fourth is an answer the worker wrote and the page has not read. The engine keeps those bytes, but that case is not delivered yet.';
const C12 =
  'A fork is the whole stack at one moment: both sides, the storage, and the request in the air.';

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  trackU: ChannelRef<number>;
  momU: ChannelRef<number>;
  moveU: ChannelRef<number>; // playhead position, 0..3 moments
  forkU: ChannelRef<number>; // a fork is visible
  flightU: ChannelRef<number>; // the request, 0..2 (out, then back)
  pressU: ChannelRef<number>; // the Buy button is pressed
  rcptU: ChannelRef<number>; // the receipt card
  forkK: ChannelRef<number>; // which fork's numbers are shown (0..3)
  memU: ChannelRef<number>;
  cutU: ChannelRef<number>;
  endU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const trackU = tl.channel('trackU', 0);
  const momU = tl.channel('momU', 0);
  const moveU = tl.channel('moveU', 0);
  const forkU = tl.channel('forkU', 0);
  const flightU = tl.channel('flightU', 0);
  const pressU = tl.channel('pressU', 0);
  const rcptU = tl.channel('rcptU', 0);
  const forkK = tl.channel('forkK', 0);
  const memU = tl.channel('memU', 0);
  const cutU = tl.channel('cutU', 0);
  const endU = tl.channel('endU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · two recordings, one shared clock —
  tl.tween(trackU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  let t = 0.4;
  t = tl.caption({ at: t, dur: 7.2, text: C1 });
  t = tl.hold(t, 0.4);

  // — Beat 2 · moments are pairs of steps —
  tl.tween(momU, 1, { at: t, dur: 1.0, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.6, text: C2 });

  // — Beat 3 · a paused process, read only —
  tl.tween(moveU, 0, { at: t - 0.2, dur: 0.4, ease: ease.move });
  t = tl.caption({ at: t, dur: 7.0, text: C3 });
  t = tl.hold(t, 0.4);

  // — Beat 4 · the fork: a copy of each side, and the memory it costs —
  tl.tween(memU, 1, { at: t + 1.0, dur: 0.8, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.0, text: C4 });

  // The four forks and their clicks. Each fork starts from the playhead and runs on.
  // The playhead moves to the next moment before its fork appears.
  FORKS.forEach((f, k) => {
    if (k > 0) {
      tl.tween(moveU, k, { at: f.fork - 0.8, dur: 0.8, ease: ease.move });
      tl.set(forkU, 0, f.fork - 0.8);
    }
    tl.set(forkK, k, f.fork - 0.2);
    tl.tween(forkU, 1, { at: f.fork, dur: 0.8, ease: ease.enter });
    tl.set(flightU, 0, f.fork);
    tl.set(rcptU, 0, f.fork);
    tl.set(pressU, 1, f.click);
    tl.set(pressU, 0, f.click + 0.3);
    tl.tween(flightU, 2, { at: f.click + 0.2, dur: 4.0, ease: ease.linear });
    tl.tween(rcptU, 1, { at: f.click + 4.4, dur: 0.6, ease: ease.enter });
  });
  // The fork before the first order is visible through C5 and C6; the next fork
  // replaces it at its own moment.

  // — Beat 5 · the first fork, then the click —
  // (captions C5 and C6 are placed by the cursor below; the timings above line up with them)
  t = tl.caption({ at: t, dur: 7.0, text: C5 });
  t = tl.caption({ at: t, dur: 7.0, text: C6 });

  // — Beat 6 · the next moments —
  t = tl.caption({ at: t, dur: 7.0, text: C7 });
  t = tl.caption({ at: t, dur: 7.0, text: C8 });
  t = tl.caption({ at: t, dur: 7.0, text: C9 });

  // — Beat 7 · the cut cases: one receipt each, and one kept —
  tl.tween(cutU, 1, { at: t + 0.4, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_CUT, { at: t + 0.2, dur: 1.4, ease: ease.move });
  t = tl.caption({ at: t, dur: 7.0, text: C10 });
  t = tl.caption({ at: t, dur: 7.0, text: C11 });

  // — Beat 8 · clean ending: everything steps back, one opaque card remains —
  tl.tween(cam, CAM_WIDE, { at: t - 0.8, dur: 1.4, ease: ease.move });
  tl.tween(endU, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 0.8, dur: 1.0, ease: ease.enter });
  t = tl.caption({ at: t, dur: 6.0, text: C12 });
  t = tl.hold(t, 0.8);

  return { tl, cam, trackU, momU, moveU, forkU, flightU, pressU, rcptU, forkK, memU, cutU, endU, closeU };
}

const scene = buildScene();

/* ------------------------------------------------------------- drawing */
function alongPath(pts: [number, number][], u: number): [number, number] {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = clamp01(u) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const f = segs[i] === 0 ? 0 : clamp01(d / segs[i]);
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
}

function Timelines({ opacity, playX, moment, forkU, forkX }: { opacity: number; playX: number; moment: number; forkU: number; forkX: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <rect x={60} y={130} width={590} height={430} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={84} y={162} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        one timeline, two recordings
      </text>
      <rect x={90} y={218} width={520} height={22} rx={6} fill={colors.BG} stroke={colors.GRID} />
      <rect x={90} y={304} width={520} height={22} rx={6} fill={colors.BG} stroke={colors.GRID} />
      {MOMENT_X.map((x, i) => (
        <g key={i}>
          <line x1={x} x2={x} y1={194} y2={346} stroke={colors.MUTED} strokeWidth={1} strokeDasharray="4 5" />
          <text x={x} y={364} textAnchor="middle" fill={colors.MUTED} fontFamily={SANS} fontSize={13}>
            {MOMENT_LABEL[i]}
          </text>
        </g>
      ))}
      {/* track labels sit on their own band, so the moment lines pass behind them */}
      <rect x={84} y={198} width={230} height={20} fill={colors.PANEL} />
      <text x={90} y={213} fill={colors.TEXT} fontFamily={SANS} fontSize={14} fontWeight={600}>
        page · Replay Chromium 108
      </text>
      <rect x={84} y={284} width={300} height={20} fill={colors.PANEL} />
      <text x={90} y={299} fill={colors.TEXT} fontFamily={SANS} fontSize={14} fontWeight={600}>
        worker · workerd, with a Durable Object
      </text>
      {ORDER_X.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={229} r={6} fill={colors.ACCENT} />
          <circle cx={x} cy={315} r={6} fill={colors.POSITIVE} />
        </g>
      ))}
      <line x1={playX} x2={playX} y1={190} y2={350} stroke={colors.TEXT} strokeWidth={2.5} />
      {forkU > 0 && (
        <g opacity={forkU}>
          <line x1={forkX} x2={forkX} y1={350} y2={392} stroke={colors.ACCENT} strokeWidth={1.5} />
          <rect x={forkX} y={392} width={610 - forkX} height={22} rx={6} fill={colors.ACCENT} fillOpacity={0.14} stroke={colors.ACCENT} strokeDasharray="5 4" />
          <text x={forkX + 8} y={408} fill={colors.ACCENT} fontFamily={SANS} fontSize={13} fontWeight={600}>
            fork of the page · running
          </text>
          <rect x={forkX} y={432} width={610 - forkX} height={22} rx={6} fill={colors.POSITIVE} fillOpacity={0.14} stroke={colors.POSITIVE} strokeDasharray="5 4" />
          <text x={forkX + 8} y={448} fill={colors.POSITIVE} fontFamily={SANS} fontSize={13} fontWeight={600}>
            fork of the worker · running
          </text>
          <line x1={forkX} x2={forkX} y1={392} y2={454} stroke={colors.POSITIVE} strokeWidth={1.5} opacity={0} />
        </g>
      )}
      <text x={84} y={486} fill={colors.MUTED} fontFamily={MONO} fontSize={14}>
        page: parent 775 MB · fork 28 MB
      </text>
      <text x={84} y={510} fill={colors.MUTED} fontFamily={MONO} fontSize={14}>
        worker: parent 347 MB · fork 17 MB
      </text>
      <text x={84} y={540} fill={colors.MUTED} fontFamily={SANS} fontSize={13}>
        {`moment shown: ${MOMENT_LABEL[moment]}`}
      </text>
    </g>
  );
}

function ShopFlow({
  opacity,
  f,
  press,
  flight,
  rcpt,
}: {
  opacity: number;
  f: Fork;
  press: number;
  flight: number;
  rcpt: number;
}) {
  if (opacity <= 0) return null;
  // Before the receipt lands, the stock still holds the one espresso this order takes.
  const soldLeft = rcpt >= 0.5 ? f.left : f.left + 1;
  const served = rcpt >= 0.5 ? `${f.served}` : '…';
  const u = clamp01(flight / 2);
  const [px, py] = alongPath(PATH, u);
  const moving = flight > 0 && flight < 2;
  return (
    <g opacity={opacity}>
      <rect x={700} y={150} width={500} height={112} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={722} y={180} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        forked page · the shop
      </text>
      <rect x={722} y={196} width={220} height={44} rx={10} fill={colors.ACCENT} fillOpacity={0.12 + 0.4 * press} stroke={colors.ACCENT} strokeWidth={1.4} />
      <text x={832} y={224} textAnchor="middle" fill={colors.TEXT} fontFamily={SANS} fontSize={17} fontWeight={700}>
        Buy espresso
      </text>
      <text x={1180} y={200} textAnchor="end" fill={colors.MUTED} fontFamily={SANS} fontSize={14}>
        espresso left
      </text>
      <text x={1180} y={240} textAnchor="end" fill={colors.ACCENT} fontFamily={MONO} fontSize={30} fontWeight={700}>
        {soldLeft}
      </text>

      <rect x={930} y={266} width={120} height={26} rx={8} fill={colors.BG} stroke={colors.GRID} />
      <text x={990} y={284} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13}>
        socket
      </text>

      <rect x={700} y={296} width={500} height={92} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={722} y={322} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        forked worker · Shop Durable Object
      </text>
      <text x={722} y={350} fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
        stock: espresso {soldLeft} · bagel 4 · orders in SQL
      </text>
      <text x={722} y={374} fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
        {`served: ${served}`}
      </text>

      {moving && (
        <circle cx={px} cy={py} r={8} fill={colors.WARM} />
      )}

      <g opacity={rcpt}>
        <rect x={700} y={404} width={500} height={136} rx={14} fill={colors.PANEL} stroke={f.match === 'recorded' ? colors.POSITIVE : colors.WARM} strokeWidth={1.4} />
        <text x={722} y={432} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
          receipt
        </text>
        <text x={1180} y={432} textAnchor="end" fill={f.match === 'recorded' ? colors.POSITIVE : colors.WARM} fontFamily={SANS} fontSize={14} fontWeight={700}>
          {f.match === 'recorded' ? 'matches the recording' : 'new: not in the recording'}
        </text>
        <text x={722} y={470} fill={colors.TEXT} fontFamily={MONO} fontSize={15}>
          {`orderId ${f.orderId}`}
        </text>
        <text x={722} y={498} fill={colors.TEXT} fontFamily={MONO} fontSize={15}>
          {`cents ${f.cents} · left ${f.left} · served ${f.served}${f.loyal ? ' · loyal' : ''}`}
        </text>
        <text x={722} y={526} fill={colors.MUTED} fontFamily={SANS} fontSize={14}>
          {`orders so far: ${f.moment} · the fork handled this request once`}
        </text>
      </g>
    </g>
  );
}

function CutCases({ u }: { u: number }) {
  if (u <= 0) return null;
  const cases = [
    { name: 'not arrived', sub: 'the page sent it; not seen yet', outcome: 'sent to the fork · one receipt', at: 0.2, color: colors.POSITIVE },
    { name: 'being handled', sub: 'the worker has started on it', outcome: 'the fork finishes it · one receipt', at: 0.95, color: colors.POSITIVE },
    { name: 'finished in JavaScript', sub: 'answer not written yet', outcome: 'the fork delivers it · one receipt', at: 1.0, color: colors.POSITIVE },
    { name: 'answer written, not read', sub: 'the engine has kept the bytes', outcome: 'kept · not yet delivered', at: 0.6, color: colors.WARM },
  ];
  // The mini path sits to the right of the text: page, then socket, then worker.
  const stops: [number, number][] = [
    [0.0, 1000],
    [0.5, 1080],
    [1.0, 1160],
  ];
  const xOf = (f: number) => {
    for (let i = 0; i < stops.length - 1; i++) {
      const [a, xa] = stops[i];
      const [b, xb] = stops[i + 1];
      if (f >= a && f <= b) return xa + ((f - a) / (b - a)) * (xb - xa);
    }
    return stops[stops.length - 1][1];
  };
  return (
    <g>
      <rect x={700} y={150} width={500} height={390} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={722} y={180} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        the cut: where the request is when the fork is taken
      </text>
      {cases.map((c, i) => {
        const rowU = clamp01((u - i * 0.18) * 3);
        const y = 204 + i * 84;
        const dot = xOf(c.at);
        return (
          <g key={c.name} opacity={rowU}>
            <rect x={722} y={y} width={456} height={74} rx={10} fill={colors.BG} stroke={colors.GRID} />
            <text x={740} y={y + 26} fill={colors.TEXT} fontFamily={SANS} fontSize={17} fontWeight={600}>
              {c.name}
            </text>
            <text x={740} y={y + 46} fill={colors.MUTED} fontFamily={SANS} fontSize={13}>
              {c.sub}
            </text>
            <text x={740} y={y + 65} fill={c.color} fontFamily={SANS} fontSize={13} fontWeight={600}>
              {c.outcome}
            </text>
            <line x1={1000} x2={1160} y1={y + 37} y2={y + 37} stroke={colors.GRID} strokeWidth={2} />
            <text x={1000} y={y + 22} fill={colors.MUTED} fontFamily={MONO} fontSize={11}>
              page
            </text>
            <text x={1080} y={y + 22} fill={colors.MUTED} fontFamily={MONO} fontSize={11} textAnchor="middle">
              socket
            </text>
            <text x={1160} y={y + 22} fill={colors.MUTED} fontFamily={MONO} fontSize={11} textAnchor="end">
              worker
            </text>
            <circle cx={dot} cy={y + 37} r={7} fill={c.color} />
          </g>
        );
      })}
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={240} y={250} width={800} height={180} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontFamily={SANS} fontSize={26} fontWeight={600}>
        A fork is the whole stack at one moment.
      </text>
      <text x={640} y={370} textAnchor="middle" fill={colors.WARM} fontFamily={SANS} fontSize={26} fontWeight={600}>
        Both sides, the storage, and the request in the air.
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const end = clamp01(s.get(scene.endU));
  const dim = 1 - 0.85 * end;
  const trackOp = clamp01(s.get(scene.trackU)) * dim;
  const cut = clamp01(s.get(scene.cutU));
  const k = Math.min(FORKS.length - 1, Math.max(0, Math.floor(s.get(scene.forkK))));
  const f = FORKS[k];
  const move = s.get(scene.moveU);
  const x = interpX(move);
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <Timelines
          opacity={trackOp * (1 - cut)}
          playX={x}
          moment={Math.min(3, Math.round(move))}
          forkU={clamp01(s.get(scene.forkU)) * dim}
          forkX={x}
        />
        <ShopFlow
          opacity={(1 - cut) * clamp01(s.get(scene.forkU)) * dim}
          f={f}
          press={clamp01(s.get(scene.pressU))}
          flight={s.get(scene.flightU)}
          rcpt={clamp01(s.get(scene.rcptU))}
        />
        <CutCases u={cut * dim} />
        <ClosingCard u={clamp01(s.get(scene.closeU))} />
      </Camera>
    </>
  );
}

// The playhead moves between the four moments in one straight slide.
function interpX(move: number): number {
  const m = Math.max(0, Math.min(3, move));
  const i = Math.floor(m);
  const j = Math.min(3, i + 1);
  return MOMENT_X[i] + (MOMENT_X[j] - MOMENT_X[i]) * (m - i);
}

export const vizScene = () => scene;
