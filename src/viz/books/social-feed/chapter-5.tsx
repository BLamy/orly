// The Timeline Cache: Keeping Reads Cheap
//
// Backing: solutions/system_design/twitter/README.md — "Use case: User views
// the home timeline" (Read API → Timeline Service → Memory Cache O(1), then
// Tweet Info Service and User Info Service multigets), the latency numbers
// (1 MB from memory ≈ 250 µs; SSD 4×, disk 80× slower), and the
// optimizations: keep only several hundred tweets per home timeline, keep
// only active users (30 days) in the Memory Cache, and rebuild a missing
// timeline from the User Graph Service + SQL Database.
// Centerpiece: skinny id chips inflating into full tweet cards, a shelf that
// trims itself, an idle mailbox evaporating — then the whole machine, wide.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, Packet, RequestFlow, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

// latency bars (beat 1)
const BARS = [
  { label: 'memory', note: '0.25 ms per MB', w: 10, color: colors.POSITIVE },
  { label: 'SSD', note: '4× slower', w: 40, color: colors.WARM },
  { label: 'disk', note: '80× slower', w: 720, color: colors.NEGATIVE },
] as const;

// read path (beats 2–3)
const CLIENT = { x: 120, y: 430 } as const;
const WEB = { x: 300, y: 430 } as const;
const READ_API = { x: 480, y: 430 } as const;
const TSVC = { x: 665, y: 430 } as const;
const CACHE = { x: 865, y: 430 } as const;
const TINFO = { x: 1085, y: 330 } as const;
const UINFO = { x: 1085, y: 530 } as const;

// hydration (beats 3–5): chips above the cache, cards to their right
const N_IDS = 4;
const CHIP_X = 700;
const CARD_X = 1000;
const chipY = (i: number): number => 96 + i * 64;
const rand = mulberry32(9);
const CHIP_IDS: { t: string; u: string }[] = Array.from({ length: N_IDS }, () => ({
  t: String(100 + Math.floor(rand() * 890)),
  u: String(100 + Math.floor(rand() * 890)),
}));
const CARD_COLORS = [colors.ACCENT, colors.POSITIVE, colors.SECONDARY, colors.WARM];

// the shelf (beat 6): a mailbox that trims itself
const SHELF = { x: 250, y: 150, w: 780, h: 64 } as const;
const SHELF_SLOTS = 11;
const SHELF_TOTAL = 15; // 11 visible + 4 that arrive and push
const SLOT_W = 64;
const slotX = (pos: number): number => SHELF.x + 14 + pos * (SLOT_W + 4);

// the idle mailbox (beat 7)
const SHELF2 = { x: 250, y: 300, w: 780, h: 64 } as const;
/** deterministic scatter for the evaporation */
const SCATTER: { dx: number; dy: number; rot: number }[] = Array.from({ length: SHELF_SLOTS }, () => ({
  dx: (rand() - 0.5) * 90,
  dy: -40 - rand() * 70,
  rot: (rand() - 0.5) * 50,
}));

// rebuild nodes (beat 8)
const UGRAPH = { x: 350, y: 490 } as const;
const SQL = { x: 640, y: 490 } as const;

// recap map (beats 9–11)
const M_AUTHOR = { x: 150, y: 280 } as const;
const M_WRITE = { x: 285, y: 280 } as const;
const M_FAN = { x: 420, y: 280 } as const;
const M_WALL = { x: 585, y: 280 } as const; // center of a 3×3 mini wall
const M_CELEB = { x: 420, y: 440 } as const;
const M_MERGE = { x: 760, y: 330 } as const;
const M_HYD = { x: 895, y: 330 } as const;
const M_PHONE = { x: 1055, y: 330 } as const;

// camera marks
const CAM_BARS: CameraState = { x: 640, y: 260, k: 1.25 };
const CAM_PATH: CameraState = { x: 600, y: 420, k: 1.2 };
const CAM_HYD: CameraState = { x: 880, y: 300, k: 1.3 };
const CAM_SHELF: CameraState = { x: 640, y: 240, k: 1.35 };

export function buildScene() {
  const tl = new Timeline();
  const camC = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const barsU = tl.channel('barsU', 0);
  const pathU = tl.channel('pathU', 0);
  const reqU = tl.channel('reqU', 0);
  const idsU = tl.channel('idsU', 0);
  const o1U = tl.channel('o1U', 0);
  const mgU = tl.channel('mgU', 0);
  const inflU = tl.channel('inflU', 0);
  const rigDim = tl.channel('rigDim', 0);
  const shelfU = tl.channel('shelfU', 0);
  const shelfPush = tl.channel('shelfPush', 0);
  const mb2U = tl.channel('mb2U', 0);
  const evapU = tl.channel('evapU', 0);
  const rebuildU = tl.channel('rebuildU', 0);
  const refillU = tl.channel('refillU', 0);
  const mapDim = tl.channel('mapDim', 0);
  const mapU = tl.channel('mapU', 0);
  const wPkU = tl.channel('wPkU', 0);
  const rPkU = tl.channel('rPkU', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · memory is fast —
  tl.caption({
    at: 0.5,
    dur: 7.7,
    text: 'This whole design leans on one physical fact: memory is fast. Reading a megabyte from memory takes a quarter of a millisecond — a spinning disk is eighty times slower.',
  });
  tl.tween(camC, CAM_BARS, { at: 0.7, dur: 1.5, ease: ease.move });
  tl.tween(barsU, 1, { at: 1.2, dur: 3.2, ease: ease.linear });

  // — Beat 2 · so the timeline lives in memory —
  tl.caption({
    at: 8.7,
    dur: 5.6,
    text: 'So the home timeline lives in the memory cache, and the read path is built to touch almost nothing else.',
  });
  tl.tween(camC, CAM_PATH, { at: 8.9, dur: 1.6, ease: ease.move });
  tl.tween(pathU, 1, { at: 9.4, dur: 2.2, ease: ease.linear });
  tl.tween(barsU, 0.12, { at: 9.0, dur: 1.0, ease: ease.move });

  // — Beat 3 · the skinny answer —
  tl.caption({
    at: 14.8,
    dur: 7.4,
    text: 'Watch a read. The timeline service asks the cache for your mailbox and gets it back in constant time — but what comes back is skinny: just tweet ids and user ids.',
  });
  tl.tween(reqU, 1, { at: 15.2, dur: 2.8, ease: ease.linear });
  tl.tween(idsU, 1, { at: 18.2, dur: 2.4, ease: ease.linear });
  tl.tween(o1U, 1, { at: 18.4, dur: 0.6, ease: ease.pop });

  // — Beat 4 · two batched calls —
  tl.caption({
    at: 22.7,
    dur: 6.9,
    text: 'Seventeen bytes per entry bought that speed. Now the feed needs flesh: one batched call to the tweet info service, and one to the user info service.',
  });
  tl.tween(camC, CAM_HYD, { at: 22.9, dur: 1.6, ease: ease.move });
  tl.tween(mgU, 2, { at: 23.9, dur: 3.6, ease: ease.linear });

  // — Beat 5 · ids inflate into cards —
  tl.caption({
    at: 30.1,
    dur: 5.4,
    text: 'The ids inflate into cards — text, names, avatars — and the feed lands on your screen.',
  });
  tl.tween(inflU, 1, { at: 30.5, dur: 3.4, ease: ease.linear });
  tl.hold(35.5, 0.6);

  // — Beat 6 · the shelf trims itself —
  tl.caption({
    at: 36.1,
    dur: 6.9,
    text: 'The cache stays small on purpose. Each mailbox keeps only a few hundred tweets — scroll past the end, and the database takes over.',
  });
  tl.tween(rigDim, 1, { at: 36.3, dur: 1.2, ease: ease.move });
  tl.tween(camC, CAM_SHELF, { at: 36.5, dur: 1.6, ease: ease.move });
  tl.tween(shelfU, 1, { at: 37.1, dur: 1.4, ease: ease.draw });
  tl.tween(shelfPush, SHELF_TOTAL - SHELF_SLOTS, { at: 38.6, dur: 3.8, ease: ease.linear });

  // — Beat 7 · idle mailboxes evaporate —
  tl.caption({
    at: 43.5,
    dur: 6.2,
    text: 'And mailboxes are only kept warm for people who show up. Go quiet for thirty days, and yours is quietly evicted.',
  });
  tl.tween(mb2U, 1, { at: 43.8, dur: 1.0, ease: ease.enter });
  tl.tween(evapU, 1, { at: 46.2, dur: 2.4, ease: ease.move });
  tl.hold(49.7, 0.5);

  // — Beat 8 · rebuilt the old way —
  tl.caption({
    at: 50.2,
    dur: 8.0,
    text: 'Come back after a month and there is no mailbox to read — so the system rebuilds it the old way: ask the user graph who you follow, pull their tweets from the database, refill the cache.',
  });
  tl.tween(rebuildU, 1, { at: 50.8, dur: 1.6, ease: ease.linear });
  tl.tween(refillU, 1, { at: 53.4, dur: 3.6, ease: ease.linear });
  tl.hold(58.2, 0.5);

  // — Beat 9 · step back —
  tl.caption({
    at: 58.7,
    dur: 6.2,
    text: 'Step back, and the whole machine is visible. A tweet is written once, fanned out to the many, held back for the few.',
  });
  tl.tween(mapDim, 1, { at: 58.9, dur: 1.2, ease: ease.move });
  tl.tween(camC, CAMERA_HOME, { at: 59.1, dur: 1.7, ease: ease.move });
  tl.tween(mapU, 1, { at: 59.9, dur: 2.6, ease: ease.linear });
  tl.tween(wPkU, 1, { at: 62.0, dur: 2.6, ease: ease.linear });

  // — Beat 10 · the read, retraced —
  tl.caption({
    at: 65.4,
    dur: 7.0,
    text: 'A read merges mailbox and celebrities, inflates ids into cards, and lands in milliseconds — because the expensive work already happened at write time.',
  });
  tl.tween(rPkU, 1, { at: 66.0, dur: 3.6, ease: ease.linear });
  tl.hold(72.0, 0.5);

  // — Beat 11 · the recap line —
  tl.caption({
    at: 72.5,
    dur: 8.1,
    text: 'That is the social feed: fan out on write, fall back to read, and let a cache full of seventeen byte entries carry a hundred thousand reads a second.',
  });
  tl.tween(endU, 1, { at: 73.4, dur: 0.9, ease: ease.pop });
  tl.hold(80.4, 1.6);

  return {
    tl,
    cam: camC,
    camC,
    barsU,
    pathU,
    reqU,
    idsU,
    o1U,
    mgU,
    inflU,
    rigDim,
    shelfU,
    shelfPush,
    mb2U,
    evapU,
    rebuildU,
    refillU,
    mapDim,
    mapU,
    wPkU,
    rPkU,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function MiniNode({ x, y, label, color, u, star }: { x: number; y: number; label: string; color: string; u: number; star?: boolean }) {
  if (u <= 0.01) return null;
  const e = ease.enter(u);
  return (
    <g opacity={e} transform={`translate(${x}, ${y + 8 * (1 - e)})`}>
      {star ? (
        <>
          <circle r={24} fill={colors.PANEL} stroke={color} strokeWidth={2} strokeDasharray="5 4" />
          <text y={7} textAnchor="middle" fill={color} fontSize={18}>
            ★
          </text>
        </>
      ) : (
        <rect x={-52} y={-24} width={104} height={48} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.8} />
      )}
      <text y={star ? 44 : 4} textAnchor="middle" fill={star ? color : colors.TEXT} fontSize={12.5} fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.camC);
  const barsU = s.get(scene.barsU);
  const pathU = s.get(scene.pathU);
  const reqU = s.get(scene.reqU);
  const idsU = s.get(scene.idsU);
  const o1U = s.get(scene.o1U);
  const mgU = s.get(scene.mgU);
  const inflU = s.get(scene.inflU);
  const rigDimV = 1 - 0.88 * s.get(scene.rigDim);
  const shelfU = s.get(scene.shelfU);
  const push = s.get(scene.shelfPush);
  const mb2U = s.get(scene.mb2U);
  const evapU = s.get(scene.evapU);
  const rebuildU = s.get(scene.rebuildU);
  const refillU = s.get(scene.refillU);
  const mapDimV = 1 - 0.9 * s.get(scene.mapDim);
  const mapU = s.get(scene.mapU);
  const wPkU = s.get(scene.wPkU);
  const rPkU = s.get(scene.rPkU);
  const endU = s.get(scene.endU);
  const shelfDim = mapDimV; // the shelf group also fades for the recap

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* beat 1 · latency bars */}
        {barsU > 0.01 && (
          <g opacity={Math.min(1, barsU) * rigDimV * mapDimV}>
            <text x={250} y={116} fill={colors.MUTED} fontSize={15}>
              time to read one megabyte, sequentially
            </text>
            {BARS.map((b, i) => {
              const u = win(clamp01(barsU), 3, i, 1.6);
              const y = 146 + i * 56;
              return (
                <g key={b.label} opacity={u > 0 ? 1 : 0}>
                  <text x={330} y={y + 15} textAnchor="end" fill={colors.TEXT} fontSize={14} fontWeight={600}>
                    {b.label}
                  </text>
                  <rect x={346} y={y} width={Math.max(2, b.w * ease.move(u))} height={20} rx={5} fill={b.color} opacity={0.85} />
                  <text x={352 + b.w * ease.move(u)} y={y + 15} fill={colors.MUTED} fontSize={12.5} opacity={clamp01(u * 2 - 1)}>
                    {b.note}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* the read path */}
        <g opacity={rigDimV * mapDimV}>
          <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="mobile" label="Client" u={clamp01(pathU * 5)} />
          <ServiceNode x={WEB.x} y={WEB.y} kind="server" label="Web Server" u={clamp01(pathU * 5 - 0.7)} />
          <ServiceNode x={READ_API.x} y={READ_API.y} kind="gateway" label="Read API" u={clamp01(pathU * 5 - 1.4)} />
          <ServiceNode x={TSVC.x} y={TSVC.y} kind="server" label="Timeline Service" u={clamp01(pathU * 5 - 2.1)} />
          <ServiceNode x={CACHE.x} y={CACHE.y} kind="cache" label="Memory Cache" sublabel="home timelines" u={clamp01(pathU * 5 - 2.8)} glow={o1U * 0.7} />
          <ServiceNode x={TINFO.x} y={TINFO.y} kind="db" label="Tweet Info Service" u={clamp01(pathU * 5 - 3.5)} />
          <ServiceNode x={UINFO.x} y={UINFO.y} kind="db" label="User Info Service" u={clamp01(pathU * 5 - 4.2)} />
          <Connection from={{ x: CLIENT.x + 42, y: CLIENT.y }} to={{ x: WEB.x - 52, y: WEB.y }} u={clamp01(pathU * 3)} arrow />
          <Connection from={{ x: WEB.x + 52, y: WEB.y }} to={{ x: READ_API.x - 52, y: READ_API.y }} u={clamp01(pathU * 3 - 0.4)} arrow />
          <Connection from={{ x: READ_API.x + 52, y: READ_API.y }} to={{ x: TSVC.x - 56, y: TSVC.y }} u={clamp01(pathU * 3 - 0.8)} arrow />
          <Connection from={{ x: TSVC.x + 56, y: TSVC.y }} to={{ x: CACHE.x - 52, y: CACHE.y }} u={clamp01(pathU * 3 - 1.2)} arrow />
          <Connection from={{ x: TSVC.x + 40, y: TSVC.y - 30 }} to={{ x: TINFO.x - 56, y: TINFO.y + 10 }} u={clamp01(pathU * 3 - 1.6)} dashed label="mget" />
          <Connection from={{ x: TSVC.x + 40, y: TSVC.y + 30 }} to={{ x: UINFO.x - 56, y: UINFO.y - 10 }} u={clamp01(pathU * 3 - 2)} dashed label="mget" />

          <RequestFlow path={[CLIENT, WEB, READ_API, TSVC, CACHE]} u={reqU} color={colors.WARM} r={8} label="read" dwell={0.18} />
          <MathLabel tex="O(1)" x={CACHE.x + 8} y={CACHE.y - 66} fontSize={22} color={colors.POSITIVE} opacity={o1U * rigDimV * mapDimV} />

          {/* skinny ids come back… */}
          {CHIP_IDS.map((c, i) => {
            const u = win(idsU, N_IDS, i, 2.2);
            if (u <= 0.001) return null;
            const e = ease.enter(u);
            const fly = ease.move(win(inflU, N_IDS, i, 2.4));
            const x = lerp(CHIP_X, CARD_X, fly);
            const y = chipY(i);
            const w = lerp(150, 230, fly);
            const h = lerp(26, 56, fly);
            return (
              <g key={i} opacity={e} transform={`translate(${x}, ${y + 10 * (1 - e)})`}>
                <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={colors.PANEL} stroke={CARD_COLORS[i]} strokeWidth={1.6} />
                {fly < 0.6 && (
                  <text y={4} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={colors.font.mono} opacity={1 - fly / 0.6}>
                    tweet_id {CHIP_IDS[i].t} · user_id {CHIP_IDS[i].u}
                  </text>
                )}
                {fly > 0.55 && (
                  <g opacity={clamp01((fly - 0.55) * 3)}>
                    <circle cx={-w / 2 + 22} cy={0} r={12} fill={CARD_COLORS[i]} opacity={0.85} />
                    <rect x={-w / 2 + 42} y={-14} width={w * 0.55} height={9} rx={4.5} fill={colors.MUTED} opacity={0.7} />
                    <rect x={-w / 2 + 42} y={2} width={w * 0.4} height={9} rx={4.5} fill={colors.MUTED} opacity={0.4} />
                  </g>
                )}
              </g>
            );
          })}
          {/* …and the multiget round trips */}
          <Packet from={{ x: CHIP_X + 60, y: chipY(1) }} to={{ x: TINFO.x - 30, y: TINFO.y - 34 }} u={clamp01(mgU)} r={6} color={colors.SECONDARY} />
          <Packet from={{ x: TINFO.x - 30, y: TINFO.y - 34 }} to={{ x: CHIP_X + 60, y: chipY(2) }} u={clamp01(mgU - 0.5)} r={6} color={colors.SECONDARY} />
          <Packet from={{ x: CHIP_X + 60, y: chipY(3) }} to={{ x: UINFO.x - 40, y: UINFO.y - 20 }} u={clamp01(mgU - 1)} r={6} color={colors.TEAL} />
          <Packet from={{ x: UINFO.x - 40, y: UINFO.y - 20 }} to={{ x: CHIP_X + 60, y: chipY(0) }} u={clamp01(mgU - 1.5)} r={6} color={colors.TEAL} />
        </g>

        {/* beat 6 · the shelf that trims itself */}
        {shelfU > 0.01 && (
          <g opacity={shelfU * shelfDim}>
            <rect x={SHELF.x} y={SHELF.y} width={SHELF.w} height={SHELF.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
            <text x={SHELF.x + 2} y={SHELF.y - 12} fill={colors.MUTED} fontSize={13}>
              one mailbox — newest first, several hundred entries, no more
            </text>
            {Array.from({ length: SHELF_TOTAL }, (_, i) => {
              // originals sit at i and shift right as `push` grows; each new
              // entry (i >= SHELF_SLOTS) slides in from the left when its turn
              // (`born`) comes. Whoever passes the last slot falls off.
              const isNew = i >= SHELF_SLOTS;
              const born = i - SHELF_SLOTS + 1;
              const p = isNew ? push - born : i + push;
              if (p < -0.9) return null;
              const fallU = clamp01(p - (SHELF_SLOTS - 1));
              if (fallU >= 1) return null;
              const x = slotX(Math.min(p, SHELF_SLOTS - 1) + fallU * 0.6);
              const y = SHELF.y + 10 + fallU * fallU * 110;
              return (
                <g key={i} opacity={(1 - fallU) * clamp01(p + 1)} transform={`translate(${x}, ${y}) rotate(${fallU * 24})`}>
                  <rect width={SLOT_W} height={SHELF.h - 20} rx={6} fill={isNew ? colors.ACCENT : colors.MUTED} opacity={isNew ? 0.85 : 0.3} />
                </g>
              );
            })}
            <text x={SHELF.x + SHELF.w + 8} y={SHELF.y + 100} textAnchor="end" fill={colors.MUTED} fontSize={12} fontStyle="italic" opacity={clamp01(push - 0.5)}>
              older tweets: back to the database
            </text>
          </g>
        )}

        {/* beat 7 · the idle mailbox evaporates */}
        {mb2U > 0.01 && (
          <g opacity={mb2U * shelfDim}>
            <rect x={SHELF2.x} y={SHELF2.y} width={SHELF2.w} height={SHELF2.h} rx={12} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.4} strokeDasharray={evapU > 0.3 ? '6 6' : undefined} opacity={1 - 0.6 * evapU} />
            <text x={SHELF2.x + 2} y={SHELF2.y - 12} fill={evapU > 0.5 ? colors.NEGATIVE : colors.MUTED} fontSize={13}>
              {evapU > 0.5 ? 'idle 31 days → evicted' : 'another mailbox — its owner has gone quiet'}
            </text>
            {Array.from({ length: SHELF_SLOTS }, (_, i) => {
              const e = clamp01(evapU * 2.2 - (i / SHELF_SLOTS) * 1.2);
              return (
                <g key={i} opacity={1 - e} transform={`translate(${slotX(i) + SCATTER[i].dx * e}, ${SHELF2.y + 10 + SCATTER[i].dy * e}) rotate(${SCATTER[i].rot * e})`}>
                  <rect width={SLOT_W} height={SHELF2.h - 20} rx={6} fill={colors.MUTED} opacity={0.3} />
                </g>
              );
            })}
          </g>
        )}

        {/* beat 8 · rebuild on miss */}
        {rebuildU > 0.01 && (
          <g opacity={rebuildU * shelfDim}>
            <ServiceNode x={UGRAPH.x} y={UGRAPH.y} kind="cache" label="User Graph Service" sublabel="who do they follow?" u={clamp01(rebuildU * 2)} />
            <ServiceNode x={SQL.x} y={SQL.y} kind="db" label="SQL Database" sublabel="their tweets" u={clamp01(rebuildU * 2 - 0.6)} />
            <Packet from={{ x: UGRAPH.x + 30, y: UGRAPH.y - 34 }} to={{ x: SHELF2.x + 180, y: SHELF2.y + 40 }} u={clamp01(refillU * 2)} r={6} color={colors.SECONDARY} label="follows" />
            <Packet from={{ x: SQL.x + 30, y: SQL.y - 34 }} to={{ x: SHELF2.x + 420, y: SHELF2.y + 40 }} u={clamp01(refillU * 2 - 0.6)} r={6} color={colors.POSITIVE} label="refill" />
            {/* the mailbox re-materializes */}
            {Array.from({ length: SHELF_SLOTS }, (_, i) => {
              const e = ease.enter(win(refillU, SHELF_SLOTS, i, 5));
              if (e <= 0.01 || refillU < 0.35) return null;
              return (
                <g key={i} opacity={e} transform={`translate(${slotX(i)}, ${SHELF2.y + 10})`}>
                  <rect width={SLOT_W} height={SHELF2.h - 20} rx={6} fill={colors.POSITIVE} opacity={0.5} />
                </g>
              );
            })}
            {refillU > 0.6 && (
              <text x={SHELF2.x + SHELF2.w - 6} y={SHELF2.y + 24} textAnchor="end" fill={colors.POSITIVE} fontSize={12} opacity={clamp01((refillU - 0.6) * 3)}>
                cache warm again
              </text>
            )}
          </g>
        )}

        {/* beats 9–11 · the whole machine */}
        {mapU > 0.01 && (
          <g opacity={mapU}>
            <MiniNode x={M_AUTHOR.x} y={M_AUTHOR.y} label="a tweet" color={colors.ACCENT} u={clamp01(mapU * 4)} />
            <MiniNode x={M_WRITE.x} y={M_WRITE.y} label="Write API" color={colors.TEXT} u={clamp01(mapU * 4 - 0.5)} />
            <MiniNode x={M_FAN.x} y={M_FAN.y} label="Fan Out" color={colors.ACCENT} u={clamp01(mapU * 4 - 1)} />
            {/* mini wall */}
            <g opacity={clamp01(mapU * 4 - 1.5)}>
              {Array.from({ length: 9 }, (_, i) => (
                <rect key={i} x={M_WALL.x - 54 + (i % 3) * 38} y={M_WALL.y - 54 + Math.floor(i / 3) * 38} width={30} height={30} rx={5} fill={colors.PANEL} stroke={wPkU > 0.9 ? colors.ACCENT : colors.GRID} strokeWidth={1.2} />
              ))}
              <text x={M_WALL.x} y={M_WALL.y + 72} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                mailboxes · the many
              </text>
            </g>
            <MiniNode x={M_CELEB.x} y={M_CELEB.y} label="celebrities · pulled" color={colors.WARM} u={clamp01(mapU * 4 - 2)} star />
            <MiniNode x={M_MERGE.x} y={M_MERGE.y} label="merge" color={colors.SECONDARY} u={clamp01(mapU * 4 - 2.5)} />
            <MiniNode x={M_HYD.x} y={M_HYD.y} label="hydrate" color={colors.TEAL} u={clamp01(mapU * 4 - 3)} />
            <g opacity={clamp01(mapU * 4 - 3.4)}>
              <rect x={M_PHONE.x - 34} y={M_PHONE.y - 56} width={68} height={112} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={M_PHONE.x} y={M_PHONE.y + 74} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5} fontWeight={600}>
                your feed
              </text>
            </g>
            <Connection from={{ x: M_AUTHOR.x + 54, y: M_AUTHOR.y }} to={{ x: M_WRITE.x - 54, y: M_WRITE.y }} u={clamp01(mapU * 2)} arrow />
            <Connection from={{ x: M_WRITE.x + 54, y: M_WRITE.y }} to={{ x: M_FAN.x - 54, y: M_FAN.y }} u={clamp01(mapU * 2 - 0.3)} arrow />
            <Connection from={{ x: M_FAN.x + 54, y: M_FAN.y }} to={{ x: M_WALL.x - 60, y: M_WALL.y }} u={clamp01(mapU * 2 - 0.6)} arrow />
            <Connection from={{ x: M_WALL.x + 60, y: M_WALL.y }} to={{ x: M_MERGE.x - 54, y: M_MERGE.y - 14 }} u={clamp01(mapU * 2 - 0.9)} arrow color={colors.ACCENT} />
            <Connection from={{ x: M_CELEB.x + 26, y: M_CELEB.y }} to={{ x: M_MERGE.x - 54, y: M_MERGE.y + 18 }} u={clamp01(mapU * 2 - 1.2)} arrow color={colors.WARM} dashed />
            <Connection from={{ x: M_MERGE.x + 54, y: M_MERGE.y }} to={{ x: M_HYD.x - 54, y: M_HYD.y }} u={clamp01(mapU * 2 - 1.5)} arrow />
            <Connection from={{ x: M_HYD.x + 54, y: M_HYD.y }} to={{ x: M_PHONE.x - 36, y: M_PHONE.y }} u={clamp01(mapU * 2 - 1.8)} arrow />
            {/* one tweet's journey, then one read's journey */}
            <RequestFlow path={[M_AUTHOR, M_WRITE, M_FAN, { x: M_WALL.x, y: M_WALL.y }]} u={wPkU} color={colors.ACCENT} r={7} dwell={0.15} />
            <RequestFlow path={[{ x: M_WALL.x, y: M_WALL.y }, M_MERGE, M_HYD, { x: M_PHONE.x - 20, y: M_PHONE.y }]} u={rPkU} color={colors.POSITIVE} r={7} dwell={0.15} />
            {rPkU > 0.05 && rPkU < 0.5 && (
              <Packet from={{ x: M_CELEB.x + 30, y: M_CELEB.y - 6 }} to={{ x: M_MERGE.x - 40, y: M_MERGE.y + 16 }} u={clamp01(rPkU * 3)} r={5.5} color={colors.WARM} />
            )}
          </g>
        )}

        {/* closing chip — small, over the quiet map */}
        {endU > 0.01 && (
          <g opacity={endU} transform={`translate(640, ${560 + 10 * (1 - ease.pop(endU))})`}>
            <rect x={-330} y={-30} width={660} height={58} rx={13} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.6} />
            <text y={-2} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={700}>
              writes do the work early — reads just collect it
            </text>
            <text y={20} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
              fan-out on write · pull for celebrities · merge and hydrate at serve time
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
