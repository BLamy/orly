// Seeds Pick the Order
//
// Backed by: plans/deterministic-simulation-testing.md (the loop, the seams, the
// determinism runs), scripts/sim.js (availableActions lists the deliveries and the
// parked storage calls; choose() is candidates[floor(random() * length)]; the
// planned requests draw their items first), and results/spike.txt (the hashes).
//
// The draws are not invented. They are mulberry32(5) in the order sim.js makes
// them: two planned items, then one draw per pick. Those four picks reproduce the
// first four actions of seed five's trace (deliver r0, GET espresso, deliver r1,
// GET bagel). A pick spends a draw even when only one candidate is left.
//
// Machine: a four-stop loop (candidates, seeded pick, run, check) with one packet
// going round it, and a bar of draws that is cut into as many slots as there are
// candidates. Then the seams, the seeded UUIDs, and the three-process hashes.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/* ------------------------------------------------------------------ data */
const SEED = 5;
const rand = mulberry32(SEED);
// sim.js plans two requests first, each drawing once for its item.
const ITEMS = [rand() < 0.7 ? 'espresso' : 'bagel', rand() < 0.7 ? 'espresso' : 'bagel'];
// Then one draw per pick.
const DRAWS = [rand(), rand(), rand(), rand()];

type Pick = { pool: string[]; draw: number };
const PICKS: Pick[] = [
  { pool: [`deliver r0 · ${ITEMS[0]}`, `deliver r1 · ${ITEMS[1]}`], draw: DRAWS[0] },
  { pool: [`deliver r1 · ${ITEMS[1]}`, `GET ${ITEMS[0]}`], draw: DRAWS[1] },
  { pool: [`deliver r1 · ${ITEMS[1]}`], draw: DRAWS[2] },
  { pool: [`GET ${ITEMS[1]}`], draw: DRAWS[3] },
];
const slotOf = (p: Pick) => Math.min(p.pool.length - 1, Math.floor(p.draw * p.pool.length));

const RING = { cx: 330, cy: 340, r: 170 };
const STOPS = [
  { label: 'candidates', x: 330, y: 170 },
  { label: 'seeded pick', x: 500, y: 340 },
  { label: 'run one action', x: 330, y: 510 },
  { label: 'check the rules', x: 160, y: 340 },
];

const CAM_WIDE: CameraState = { ...CAMERA_HOME };
const CAM_RING: CameraState = { x: 330, y: 340, k: 1.2 };
// Both keep the loop's labels (left edge near x 85) inside the frame.
const CAM_PICKS: CameraState = { x: 660, y: 345, k: 1.04 };
const CAM_SEAMS: CameraState = { x: 660, y: 340, k: 1.04 };

const C1 =
  'A simulator does not wait for the scheduler to decide who runs next. It decides for itself, from a list of what could happen next.';
const C2 =
  'The candidates are the requests not yet delivered, plus every storage call waiting to finish. At the start of seed five there are two.';
const C3 =
  'Each pick is one draw from a seeded random number generator. After the seed plans the two requests, the next draw is 0.22. With two candidates, that lands on the first.';
const C4 =
  'The next draw is 0.62, which lands on the second candidate, a storage read. A pick always spends a draw, even when only one candidate is left.';
const C5 =
  "The chosen action runs. A delivered request reaches the app's own code, and a parked storage call is released, so the app runs as it would in production.";
const C6 =
  "After every action, the simulator checks the rules. Every request gets an answer, and an acknowledged write can be read back. The app adds its own, such as stock plus sold equals the start.";
const C7 =
  'The seams are where the outside plugs in. The key-value binding points at the simulator, and outbound fetch goes there too, so every storage call waits until the simulator lets it finish.';
const C8 =
  "Randomness is seeded too. The app's random order IDs come from the same seed, so the response bytes match, not only the order of events.";
const C9 =
  "Three processes ran the same three hundred seeds, and every trace and response hashed the same. The same hundred seeds on stock workerd and on Replay's workerd matched too.";
const C10 =
  'The plan keeps a failing seed as its list of named actions, so it can run again. Time is the gap: the clock for seeded runs is not built yet.';
const C11 =
  'Same seed, same order, same bytes. The one thing the seed does not yet control is time.';

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ringU: ChannelRef<number>;
  loopU: ChannelRef<number>; // the packet, in quarter turns of the ring (0..4)
  pickU: ChannelRef<number>;
  pickK: ChannelRef<number>; // which pick is shown (0..3)
  markU: ChannelRef<number>; // the draw marker
  checkU: ChannelRef<number>;
  checkK: ChannelRef<number>;
  seamU: ChannelRef<number>;
  randU: ChannelRef<number>;
  detU: ChannelRef<number>;
  failU: ChannelRef<number>;
  endU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const loopU = tl.channel('loopU', 0);
  const pickU = tl.channel('pickU', 0);
  const pickK = tl.channel('pickK', 0);
  const markU = tl.channel('markU', 0);
  const checkU = tl.channel('checkU', 0);
  const checkK = tl.channel('checkK', 0);
  const seamU = tl.channel('seamU', 0);
  const randU = tl.channel('randU', 0);
  const detU = tl.channel('detU', 0);
  const failU = tl.channel('failU', 0);
  const endU = tl.channel('endU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · a loop that decides for itself —
  tl.tween(ringU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_RING, { at: 1.0, dur: 1.8, ease: ease.move });
  let t = 0.4;
  t = tl.caption({ at: t, dur: 7.2, text: C1 });
  t = tl.hold(t, 0.4);

  // — Beat 2 · the candidates: two at the start —
  tl.tween(cam, CAM_WIDE, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(pickU, 1, { at: t + 0.2, dur: 0.8, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.0, text: C2 });
  t = tl.hold(t, 0.4);

  // — Beat 3 · the first draw lands on the first candidate —
  tl.tween(cam, CAM_PICKS, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(markU, 1, { at: t + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(loopU, 1, { at: t + 0.8, dur: 0.8, ease: ease.move });
  t = tl.caption({ at: t, dur: 8.0, text: C3 });

  // — Beat 4 · the second draw, then two forced picks —
  tl.set(pickK, 1, t + 0.2);
  t = tl.caption({ at: t, dur: 7.6, text: C4 });
  tl.set(pickK, 2, t - 2.6);
  tl.set(pickK, 3, t - 1.2);

  // — Beat 5 · the chosen action runs —
  tl.tween(loopU, 2, { at: t, dur: 0.8, ease: ease.move });
  t = tl.caption({ at: t, dur: 7.0, text: C5 });

  // — Beat 6 · the rules are checked after every action —
  tl.tween(pickU, 0, { at: t - 0.2, dur: 0.6, ease: ease.move });
  tl.tween(loopU, 3, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(checkU, 1, { at: t + 0.0, dur: 0.8, ease: ease.enter });
  tl.set(checkK, 1, t + 0.6);
  tl.set(checkK, 2, t + 1.8);
  tl.set(checkK, 3, t + 3.0);
  t = tl.caption({ at: t, dur: 8.0, text: C6 });

  // — Beat 7 · the seams: KV and outbound fetch both reach the simulator —
  tl.tween(checkU, 0, { at: t - 0.2, dur: 0.6, ease: ease.move });
  tl.tween(loopU, 4, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(seamU, 1, { at: t + 0.1, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_SEAMS, { at: t, dur: 1.4, ease: ease.move });
  t = tl.caption({ at: t, dur: 8.0, text: C7 });

  // — Beat 8 · seeded UUIDs —
  tl.tween(seamU, 0, { at: t - 0.2, dur: 0.6, ease: ease.move });
  tl.tween(randU, 1, { at: t + 0.0, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_WIDE, { at: t, dur: 1.4, ease: ease.move });
  t = tl.caption({ at: t, dur: 7.0, text: C8 });

  // — Beat 9 · three processes, one hash —
  tl.tween(randU, 0, { at: t - 0.2, dur: 0.6, ease: ease.move });
  tl.tween(detU, 1, { at: t + 0.0, dur: 1.0, ease: ease.enter });
  t = tl.caption({ at: t, dur: 8.0, text: C9 });

  // — Beat 10 · a kept failure, and the clock that is not built yet —
  tl.tween(detU, 0, { at: t - 0.2, dur: 0.6, ease: ease.move });
  tl.tween(failU, 1, { at: t + 0.0, dur: 1.0, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.0, text: C10 });

  // — Beat 11 · clean ending: everything steps back, one opaque card remains —
  tl.tween(endU, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 0.8, dur: 1.0, ease: ease.enter });
  t = tl.caption({ at: t, dur: 6.0, text: C11 });
  t = tl.hold(t, 0.8);

  return { tl, cam, ringU, loopU, pickU, pickK, markU, checkU, checkK, seamU, randU, detU, failU, endU, closeU };
}

const scene = buildScene();

/* ------------------------------------------------------------- drawing */
function Ring({ opacity, loop }: { opacity: number; loop: number }) {
  if (opacity <= 0) return null;
  const stage = Math.floor(loop) % 4;
  const theta = (-90 + 90 * loop) * (Math.PI / 180);
  const px = RING.cx + RING.r * Math.cos(theta);
  const py = RING.cy + RING.r * Math.sin(theta);
  return (
    <g opacity={opacity}>
      <circle cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke={colors.GRID} strokeWidth={2} />
      <text x={RING.cx} y={RING.cy + 6} textAnchor="middle" fill={colors.MUTED} fontFamily={SANS} fontSize={15}>
        one loop per action
      </text>
      {/* the packet travels beneath the stop boxes, so their labels stay readable */}
      <circle cx={px} cy={py} r={10} fill={colors.WARM} />
      {STOPS.map((st, i) => {
        const active = i === stage;
        return (
          <g key={st.label}>
            <rect
              x={st.x - 78}
              y={st.y - 22}
              width={156}
              height={44}
              rx={10}
              fill={active ? colors.ACCENT : colors.PANEL}
              fillOpacity={active ? 0.2 : 1}
              stroke={active ? colors.ACCENT : colors.GRID}
              strokeWidth={active ? 2 : 1}
            />
            <text x={st.x} y={st.y + 6} textAnchor="middle" fill={colors.TEXT} fontFamily={SANS} fontSize={15} fontWeight={active ? 700 : 500}>
              {st.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function PickPanel({ opacity, k, mark }: { opacity: number; k: number; mark: number }) {
  if (opacity <= 0) return null;
  const X0 = 660;
  const W = 540;
  const pick = PICKS[Math.min(k, PICKS.length - 1)];
  const n = pick.pool.length;
  const j = slotOf(pick);
  const markX = X0 + pick.draw * W;
  return (
    <g opacity={opacity}>
      <rect x={640} y={140} width={580} height={400} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={670} y={180} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        seed 5 · the picks
      </text>
      <text x={1190} y={180} textAnchor="end" fill={colors.MUTED} fontFamily={MONO} fontSize={14}>
        pick {k + 1} of 4
      </text>
      {pick.pool.map((label, i) => {
        const w = W / n;
        const x = X0 + i * w;
        const chosen = i === j;
        return (
          <g key={label}>
            <rect
              x={x}
              y={250}
              width={w - 6}
              height={42}
              rx={8}
              fill={chosen ? colors.ACCENT : colors.GRID}
              fillOpacity={chosen ? 0.32 : 0.5}
            />
            <text x={x + (w - 6) / 2} y={276} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
              {label}
            </text>
          </g>
        );
      })}
      <g opacity={mark}>
        <line x1={markX} x2={markX} y1={236} y2={306} stroke={colors.WARM} strokeWidth={2.5} />
        <text x={Math.min(1150, Math.max(700, markX))} y={226} textAnchor="middle" fill={colors.WARM} fontFamily={MONO} fontSize={14}>
          draw {pick.draw.toFixed(2)}
        </text>
        <text x={670} y={346} fill={colors.TEXT} fontFamily={MONO} fontSize={15}>
          {`${pick.draw.toFixed(2)} × ${n} = ${(pick.draw * n).toFixed(2)}, so slot ${j + 1}`}
        </text>
        <text x={670} y={384} fill={colors.ACCENT} fontFamily={MONO} fontSize={21} fontWeight={700}>
          {`runs: ${pick.pool[j]}`}
        </text>
      </g>
      {PICKS.slice(0, k + 1).map((p, i) => (
        <text key={i} x={670} y={432 + i * 28} fill={i === k ? colors.TEXT : colors.MUTED} fontFamily={MONO} fontSize={14}>
          {`${i + 1}. draw ${p.draw.toFixed(2)} → ${p.pool[slotOf(p)]}`}
        </text>
      ))}
    </g>
  );
}

function CheckPanel({ opacity, k }: { opacity: number; k: number }) {
  if (opacity <= 0) return null;
  const rows = [
    'every request gets an answer',
    'an acknowledged write can be read back',
    "the app's own rule: stock plus sold equals the start",
  ];
  return (
    <g opacity={opacity}>
      <rect x={640} y={140} width={580} height={400} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={670} y={180} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        after every action
      </text>
      {rows.map((label, i) => {
        const y = 250 + i * 66;
        const done = i < k;
        return (
          <g key={label}>
            <rect x={670} y={y - 30} width={520} height={50} rx={8} fill={colors.BG} stroke={colors.GRID} />
            <text x={694} y={y} fill={colors.TEXT} fontFamily={SANS} fontSize={18}>
              {label}
            </text>
            <text x={1160} y={y + 2} textAnchor="end" fill={done ? colors.POSITIVE : colors.MUTED} fontFamily={SANS} fontSize={22} fontWeight={700}>
              {done ? '✓' : '…'}
            </text>
          </g>
        );
      })}
      <text x={670} y={480} fill={colors.MUTED} fontFamily={MONO} fontSize={14}>
        checkInvariants · checkCompletion
      </text>
    </g>
  );
}

function SeamPanel({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  const box = (x: number, y: number, w: number, h: number, title: string, sub: string, color: string) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={colors.BG} stroke={color} strokeWidth={1.6} />
      <text x={x + 16} y={y + 28} fill={colors.TEXT} fontFamily={SANS} fontSize={18} fontWeight={600}>
        {title}
      </text>
      <text x={x + 16} y={y + 50} fill={colors.MUTED} fontFamily={MONO} fontSize={13}>
        {sub}
      </text>
    </g>
  );
  return (
    <g opacity={opacity}>
      <rect x={640} y={140} width={580} height={400} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={670} y={180} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        where the outside plugs in
      </text>
      {box(670, 300, 170, 70, 'app code', 'the shop', colors.ACCENT)}
      {box(930, 220, 270, 70, 'KV binding', 'kvNamespace = "sim"', colors.SECONDARY)}
      {box(930, 390, 270, 70, 'simulator', 'globalOutbound = "sim"', colors.WARM)}
      <line x1={840} y1={320} x2={930} y2={262} stroke={colors.MUTED} strokeWidth={1.6} />
      <line x1={840} y1={352} x2={930} y2={414} stroke={colors.MUTED} strokeWidth={1.6} strokeDasharray="5 4" />
      <text x={862} y={276} fill={colors.MUTED} fontFamily={SANS} fontSize={14}>
        kv().get / put
      </text>
      <text x={846} y={402} fill={colors.MUTED} fontFamily={SANS} fontSize={14}>
        outbound fetch
      </text>
      <rect x={946} y={440} width={238} height={28} rx={6} fill={colors.WARM} fillOpacity={0.18} />
      <text x={1065} y={459} textAnchor="middle" fill={colors.WARM} fontFamily={SANS} fontSize={14} fontWeight={600}>
        each call waits until released
      </text>
      <text x={670} y={530} fill={colors.MUTED} fontFamily={SANS} fontSize={15}>
        the app's own code runs as it would in production
      </text>
    </g>
  );
}

function RandPanel({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  const chip = (x: number, label: string, color: string) => (
    <g>
      <rect x={x} y={236} width={170} height={44} rx={22} fill={colors.BG} stroke={color} strokeWidth={1.5} />
      <text x={x + 85} y={264} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
        {label}
      </text>
    </g>
  );
  return (
    <g opacity={opacity}>
      <rect x={640} y={140} width={580} height={400} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={670} y={180} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        randomness comes from the seed
      </text>
      {chip(670, 'seed 5', colors.ACCENT)}
      <line x1={846} y1={258} x2={872} y2={258} stroke={colors.MUTED} strokeWidth={1.6} />
      {chip(878, 'randomUUID()', colors.SECONDARY)}
      <line x1={1054} y1={258} x2={1080} y2={258} stroke={colors.MUTED} strokeWidth={1.6} />
      <text x={1094} y={262} fill={colors.TEXT} fontFamily={SANS} fontSize={14}>
        bytes
      </text>
      {['run one', 'run two'].map((label, i) => {
        const y = 340 + i * 56;
        return (
          <g key={label}>
            <text x={670} y={y + 22} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
              {label}
            </text>
            <rect x={790} y={y} width={300} height={32} rx={6} fill={colors.ACCENT} fillOpacity={0.22} />
            <text x={940} y={y + 21} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={13}>
              same order, same UUIDs
            </text>
            <text x={1160} y={y + 22} textAnchor="end" fill={colors.POSITIVE} fontFamily={SANS} fontSize={16} fontWeight={700}>
              identical
            </text>
          </g>
        );
      })}
      <text x={670} y={480} fill={colors.MUTED} fontFamily={SANS} fontSize={15}>
        without seeding, the order stays the same and the response bytes differ
      </text>
    </g>
  );
}

function DetPanel({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  const rows: { label: string; seeds: string; hash: string; y: number; w: number }[] = [
    { label: 'process 1', seeds: '300 seeds', hash: '062551a2 · 01013c1d', y: 230, w: 330 },
    { label: 'process 2', seeds: '300 seeds', hash: '062551a2 · 01013c1d', y: 282, w: 330 },
    { label: 'process 3', seeds: '300 seeds', hash: '062551a2 · 01013c1d', y: 334, w: 330 },
    { label: 'stock workerd', seeds: '100 seeds', hash: '7b1dc5a8 · cf463dfb', y: 412, w: 240 },
    { label: "Replay's workerd", seeds: '100 seeds', hash: '7b1dc5a8 · cf463dfb', y: 464, w: 240 },
  ];
  return (
    <g opacity={opacity}>
      <rect x={640} y={140} width={580} height={400} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={670} y={180} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        same seeds, new processes, two runtimes
      </text>
      <text x={1160} y={206} textAnchor="end" fill={colors.MUTED} fontFamily={MONO} fontSize={13}>
        trace · response hashes
      </text>
      {rows.map((r) => (
        <g key={r.label}>
          <text x={670} y={r.y + 20} fill={colors.TEXT} fontFamily={SANS} fontSize={16}>
            {r.label}
          </text>
          <rect x={800} y={r.y + 2} width={r.w} height={28} rx={6} fill={colors.ACCENT} fillOpacity={0.2} />
          <text x={800 + r.w / 2} y={r.y + 21} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={13}>
            {r.seeds}
          </text>
          <text x={1160} y={r.y + 21} textAnchor="end" fill={colors.POSITIVE} fontFamily={MONO} fontSize={13}>
            {r.hash}
          </text>
        </g>
      ))}
    </g>
  );
}

function FailPanel({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  const named = ['deliver r0 espresso', 'GET espresso -> 3', 'deliver r1 bagel', 'GET bagel -> 2', '…'];
  return (
    <g opacity={opacity}>
      <rect x={640} y={140} width={340} height={400} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={664} y={180} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        kept failure
      </text>
      {named.map((line, i) => (
        <text key={line} x={664} y={230 + i * 38} fill={colors.TEXT} fontFamily={MONO} fontSize={15}>
          {line}
        </text>
      ))}
      <text x={664} y={480} fill={colors.MUTED} fontFamily={SANS} fontSize={14}>
        named actions, run again on demand
      </text>
      <rect x={1010} y={140} width={210} height={400} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={1115} y={180} textAnchor="middle" fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        the clock
      </text>
      <circle cx={1115} cy={300} r={70} fill="none" stroke={colors.MUTED} strokeWidth={2} strokeDasharray="4 5" />
      <line x1={1115} y1={300} x2={1115} y2={248} stroke={colors.MUTED} strokeWidth={3} />
      <rect x={1040} y={404} width={150} height={30} rx={6} fill={colors.WARM} fillOpacity={0.2} />
      <text x={1115} y={424} textAnchor="middle" fill={colors.WARM} fontFamily={SANS} fontSize={14} fontWeight={600}>
        not built yet
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
        Same seed, same order, same bytes.
      </text>
      <text x={640} y={370} textAnchor="middle" fill={colors.WARM} fontFamily={SANS} fontSize={26} fontWeight={600}>
        Time is the one thing the seed does not yet control.
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
        <Ring opacity={clamp01(s.get(scene.ringU)) * dim} loop={s.get(scene.loopU)} />
        <PickPanel
          opacity={clamp01(s.get(scene.pickU)) * dim}
          k={Math.floor(s.get(scene.pickK))}
          mark={clamp01(s.get(scene.markU))}
        />
        <CheckPanel opacity={clamp01(s.get(scene.checkU)) * dim} k={Math.floor(s.get(scene.checkK))} />
        <SeamPanel opacity={clamp01(s.get(scene.seamU)) * dim} />
        <RandPanel opacity={clamp01(s.get(scene.randU)) * dim} />
        <DetPanel opacity={clamp01(s.get(scene.detU)) * dim} />
        <FailPanel opacity={clamp01(s.get(scene.failU)) * dim} />
        <ClosingCard u={clamp01(s.get(scene.closeU))} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
