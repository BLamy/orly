// The Hash Table: one box, constant time
//
// Grounding (donnemartin/system-design-primer):
//   README.md § NoSQL > Key-value store — "Abstraction: hash table", O(1)
//   reads/writes, backed by memory or SSD, Redis/Memcached; latency numbers
//   ("reading 1 MB sequentially from memory takes about 250 microseconds").
//   solutions/system_design/query_cache — the primer's own "design a
//   key-value store" exercise: Memory Cache, 10M users, 10B queries/month
//   (~4,000 req/s), 270 bytes/entry ⇒ 2.7 TB of cache data per month.
//
// Visual machine: a literal hash table — one machine panel with eight slot
// rows; keys are chips that fall through the h(k) funnel and deflect into
// their slot. A GET probe flies straight to its slot and bounces the value
// back. Then the primer's own load numbers overflow the box, and the camera
// pulls back onto dark silhouettes of more machines: which key lives where?
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
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
/** Per-item window over one 0..1 driver channel (the stagger trick). */
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

// ---------------------------------------------------------------------------
// Layout — the machine, its slots, and the key queue.
// ---------------------------------------------------------------------------

const BOX = { x: 600, y: 96, w: 520, h: 470 } as const;
const SLOTS = 8;
const SLOT_H = (BOX.h - 60) / SLOTS;
const slotY = (i: number): number => BOX.y + 44 + i * SLOT_H + SLOT_H / 2;

const FUNNEL = { x: 470, y: 330 } as const; // mouth of h(k)
const QUEUE_X = 150; // where key chips wait

interface KeyChip {
  name: string;
  value: string;
  slot: number;
  /** column inside the slot row (collisions sit side by side) */
  lane: number;
}

// Seeded, fixed-order data: 12 keys, slots assigned by PRNG (≤2 per slot).
const rand = mulberry32(404);
const KEY_NAMES: [string, string][] = [
  ['cart:42', '3 items'],
  ['user:7', 'ada'],
  ['sku:993', '$18'],
  ['geo:pdx', '45.5N'],
  ['sess:12', 'active'],
  ['rank:3', 'gold'],
  ['img:77', '4 KB'],
  ['tag:hot', '212'],
  ['fx:usd', '1.00'],
  ['top:day', 'list'],
  ['ip:back', 'allow'],
  ['ttl:x9', '60s'],
];
const KEYS: KeyChip[] = (() => {
  const laneOf = new Map<number, number>();
  return KEY_NAMES.map(([name, value]) => {
    let slot = Math.floor(rand() * SLOTS);
    // keep collisions to two per row so the picture stays legible
    while ((laneOf.get(slot) ?? 0) >= 2) slot = (slot + 1) % SLOTS;
    const lane = laneOf.get(slot) ?? 0;
    laneOf.set(slot, lane + 1);
    return { name, value, slot, lane };
  });
})();
const HERO = 0; // cart:42 — the throughline key of the whole book
const HERO_SLOT = KEYS[HERO].slot;
// spoken numbers must match the picture — the caption is templated on this
const SLOT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
const HERO_SLOT_WORD = SLOT_WORDS[HERO_SLOT];

/** Chip position along its flight: queue → funnel mouth → its slot. */
function chipPos(k: KeyChip, u: number, qi: number): { x: number; y: number } {
  const start = { x: QUEUE_X + 40, y: 150 + qi * 36 };
  const mid = { x: FUNNEL.x, y: FUNNEL.y };
  const end = { x: BOX.x + 150 + k.lane * 170, y: slotY(k.slot) };
  if (u <= 0.5) {
    const t = u / 0.5;
    return { x: start.x + (mid.x - start.x) * t, y: start.y + (mid.y - start.y) * t };
  }
  const t = (u - 0.5) / 0.5;
  // deflect: a slight arc from the funnel to the slot row
  const bend = Math.sin(t * Math.PI) * 26;
  return { x: mid.x + (end.x - mid.x) * t + bend * 0.2, y: mid.y + (end.y - mid.y) * t - bend };
}

const CLIENT = { x: 190, y: 480 } as const;

// camera marks
const CAM_SLOT: CameraState = { x: 780, y: 380, k: 1.5 };
const CAM_BOX: CameraState = { x: 730, y: 340, k: 1.12 };

// the primer's query_cache numbers, animated on the load meter
const REQS = 4000; // requests per second
const USERS = '10,000,000';

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  boxU: ChannelRef<number>;
  heroU: ChannelRef<number>;
  funnelU: ChannelRef<number>;
  heroFly: ChannelRef<number>;
  hashU: ChannelRef<number>;
  keysIn: ChannelRef<number>;
  getU: ChannelRef<number>;
  retU: ChannelRef<number>;
  o1U: ChannelRef<number>;
  chipsU: ChannelRef<number>;
  load: ChannelRef<number>;
  hotU: ChannelRef<number>;
  ghostsU: ChannelRef<number>;
  boxDim: ChannelRef<number>;
  qU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const boxU = tl.channel('boxU', 0); // machine panel draw-on
  const heroU = tl.channel('heroU', 0); // cart:42 chip appears in the queue
  const funnelU = tl.channel('funnelU', 0); // h(k) funnel entrance
  const heroFly = tl.channel('heroFly', 0); // hero chip flight 0..1
  const hashU = tl.channel('hashU', 0); // the h("cart:42") = 5 label
  const keysIn = tl.channel('keysIn', 0); // staggered flights for the rest
  const getU = tl.channel('getU', 0); // read probe travel
  const retU = tl.channel('retU', 0); // value packet return travel
  const o1U = tl.channel('o1U', 0); // O(1) label
  const chipsU = tl.channel('chipsU', 0); // Redis / Memcached chips
  const load = tl.channel('load', 0); // 0..1 → req/s counter + fill meter
  const hotU = tl.channel('hotU', 0); // overload glow + 2.7 TB chip
  const ghostsU = tl.channel('ghostsU', 0); // silhouettes of more machines
  const boxDim = tl.channel('boxDim', 0); // ending: quiet the machine
  const qU = tl.channel('qU', 0); // the "which key lives where?" marks

  // — Beat 1 · the interview question, one bare box —
  tl.caption({
    at: 0.5,
    dur: 7.0,
    text: 'Round four: design a key-value store. Strip away the buzzwords and the thing under Redis, Memcached, and Dynamo is ancient — a hash table with a network cable.',
  });
  tl.tween(boxU, 1, { at: 0.7, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAM_BOX, { at: 0.9, dur: 1.6, ease: ease.move });
  tl.hold(7.5, 0.6);

  // — Beat 2 · the contract: key in, value back —
  tl.caption({
    at: 8.1,
    dur: 6.0,
    text: 'The contract is one sentence. You hand it a key and a value to remember; later you hand back the key, and it returns the value.',
  });
  tl.tween(heroU, 1, { at: 8.5, dur: 0.7, ease: ease.pop });
  tl.hold(14.1, 0.5);

  // — Beat 3 · the funnel: hash to a slot —
  tl.caption({
    at: 14.6,
    dur: 6.4,
    text: `Inside, a hash function turns the key into a slot number. Our cart key hashes to slot ${HERO_SLOT_WORD}, so slot ${HERO_SLOT_WORD} is where the value lives.`,
  });
  tl.tween(funnelU, 1, { at: 14.8, dur: 0.7, ease: ease.enter });
  tl.tween(heroFly, 1, { at: 15.6, dur: 1.8, ease: ease.move });
  tl.tween(hashU, 1, { at: 17.6, dur: 0.6, ease: ease.enter });
  tl.hold(21.0, 0.6);

  // — Beat 4 · every key gets the same treatment —
  tl.caption({
    at: 21.6,
    dur: 5.6,
    text: 'Every key gets the same treatment. Wherever a key hashes, that is home — no searching, no scanning, no index to consult.',
  });
  tl.tween(keysIn, 1, { at: 21.9, dur: 4.6, ease: ease.linear });
  tl.hold(27.2, 0.6);

  // — Beat 5 · the read probe: constant time —
  tl.caption({
    at: 27.8,
    dur: 6.2,
    text: 'Reads are one jump. Hash the key, go straight to the slot, take the value — constant time whether you hold twelve keys or twelve billion.',
  });
  tl.tween(cam, CAM_SLOT, { at: 28.0, dur: 1.2, ease: ease.move });
  tl.tween(getU, 1, { at: 29.2, dur: 1.1, ease: ease.linear });
  tl.tween(retU, 1, { at: 30.5, dur: 1.1, ease: ease.linear });
  tl.tween(o1U, 1, { at: 31.8, dur: 0.6, ease: ease.pop });
  tl.hold(34.0, 0.6);

  // — Beat 6 · memory speed; Redis / Memcached —
  tl.caption({
    at: 34.6,
    dur: 6.4,
    text: 'Keep it in memory and that jump reads a megabyte in about a quarter of a millisecond. This exact box is what Redis and Memcached sell you.',
  });
  tl.tween(cam, CAM_BOX, { at: 34.8, dur: 1.2, ease: ease.move });
  tl.tween(chipsU, 1, { at: 36.2, dur: 0.7, ease: ease.enter });
  tl.hold(41.0, 0.6);

  // — Beat 7 · the follow-up: real load —
  tl.caption({
    at: 41.6,
    dur: 6.6,
    text: 'So far, an answer with one box. Then the follow-up lands: ten million users, ten billion lookups a month — four thousand requests a second, around the clock.',
  });
  tl.tween(load, 0.72, { at: 42.2, dur: 5.4, ease: ease.linear });
  tl.hold(48.2, 0.4);

  // — Beat 8 · the box overflows —
  tl.caption({
    at: 48.6,
    dur: 6.0,
    text: 'Store what those lookups return and you grow by nearly three terabytes a month. The box glows hot, and memory simply runs out.',
  });
  tl.tween(load, 1, { at: 49.0, dur: 2.6, ease: ease.linear });
  tl.tween(hotU, 1, { at: 51.2, dur: 1.0, ease: ease.enter });
  tl.hold(54.6, 0.6);

  // — Beat 9 · no taller box —
  tl.caption({
    at: 55.2,
    dur: 5.8,
    text: 'A bigger machine only postpones the ending — vertical scaling has a ceiling and a price tag. You need more boxes, not a taller one.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 55.4, dur: 1.6, ease: ease.move });
  tl.tween(hotU, 0.4, { at: 56.0, dur: 1.0, ease: ease.move });
  tl.tween(ghostsU, 1, { at: 57.0, dur: 1.6, ease: ease.draw });
  tl.hold(61.0, 0.4);

  // — Beat 10 · the real question —
  tl.caption({
    at: 61.4,
    dur: 6.2,
    text: 'And more boxes create the real question, the one the whole design hangs on: which key lives on which machine? That is chapter two.',
  });
  tl.tween(boxDim, 0.55, { at: 61.6, dur: 1.0, ease: ease.move });
  tl.tween(hotU, 0, { at: 61.6, dur: 0.8, ease: ease.move });
  tl.tween(qU, 1, { at: 62.4, dur: 1.2, ease: ease.enter });
  tl.hold(67.6, 1.2);

  return {
    tl, cam, boxU, heroU, funnelU, heroFly, hashU, keysIn, getU, retU, o1U,
    chipsU, load, hotU, ghostsU, boxDim, qU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — a pure function of the sampled state.
// ---------------------------------------------------------------------------

function Chip({ x, y, name, value, u, hot }: {
  x: number; y: number; name: string; value: string; u: number; hot?: boolean;
}) {
  if (u <= 0) return null;
  const w = 128;
  return (
    <g opacity={u} transform={`translate(${x - w / 2}, ${y - 13})`}>
      <rect width={w} height={26} rx={7} fill={colors.PANEL} stroke={hot ? colors.WARM : colors.GRID} strokeWidth={hot ? 1.6 : 1} />
      <text x={10} y={17} fill={hot ? colors.WARM : colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace">{name}</text>
      <text x={w - 10} y={17} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">{value}</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const boxU = s.get(scene.boxU);
  const heroU = s.get(scene.heroU);
  const funnelU = s.get(scene.funnelU);
  const heroFly = s.get(scene.heroFly);
  const hashU = s.get(scene.hashU);
  const keysIn = s.get(scene.keysIn);
  const getU = s.get(scene.getU);
  const retU = s.get(scene.retU);
  const o1U = s.get(scene.o1U);
  const chipsU = s.get(scene.chipsU);
  const load = s.get(scene.load);
  const hotU = s.get(scene.hotU);
  const ghostsU = s.get(scene.ghostsU);
  const boxDim = s.get(scene.boxDim);
  const qU = s.get(scene.qU);

  const boxAlpha = boxU * (1 - boxDim * 0.85);
  const hero = KEYS[HERO];
  const heroP = chipPos(hero, heroFly, 0);
  const heroSlotPt = { x: BOX.x + 150 + hero.lane * 170, y: slotY(hero.slot) };
  const reqs = Math.round(load * REQS);
  const fill = clamp01(load * 1.15); // meter overflows just past full load

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* silhouettes of the machines to come */}
        <g opacity={ghostsU}>
          {[0, 1, 2].map((i) => (
            <g key={i} opacity={0.55}>
              <rect x={120 + i * 150} y={560 + i * 8 - 340} width={120} height={200} rx={12}
                fill="none" stroke={colors.MUTED} strokeWidth={1.4} strokeDasharray="6 6" opacity={0.5} />
              <text x={180 + i * 150} y={330 + i * 8} textAnchor="middle" fill={colors.MUTED} fontSize={26} opacity={qU}>?</text>
            </g>
          ))}
          <text x={300} y={575} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={qU}>
            which key lives where?
          </text>
        </g>

        {/* the machine */}
        <g opacity={boxAlpha}>
          <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={16}
            fill={colors.PANEL} stroke={hotU > 0.02 ? colors.NEGATIVE : colors.GRID} strokeWidth={1.5 + hotU * 1.5} />
          {hotU > 0.02 && (
            <rect x={BOX.x - 6} y={BOX.y - 6} width={BOX.w + 12} height={BOX.h + 12} rx={20}
              fill="none" stroke={colors.NEGATIVE} strokeWidth={8} opacity={hotU * 0.22} />
          )}
          <text x={BOX.x + 20} y={BOX.y + 28} fill={colors.TEXT} fontSize={16}>one machine</text>
          <text x={BOX.x + BOX.w - 20} y={BOX.y + 28} textAnchor="end" fill={colors.MUTED} fontSize={13}
            fontFamily="ui-monospace, monospace">key → value</text>

          {/* slot rows */}
          {Array.from({ length: SLOTS }, (_, i) => (
            <g key={i} opacity={clamp01(boxU * 1.4 - i * 0.05)}>
              <rect x={BOX.x + 58} y={slotY(i) - SLOT_H / 2 + 4} width={BOX.w - 84} height={SLOT_H - 8} rx={8}
                fill={colors.BG} stroke={colors.GRID} opacity={0.9} />
              <text x={BOX.x + 36} y={slotY(i) + 4} textAnchor="middle" fill={colors.MUTED} fontSize={12}
                fontFamily="ui-monospace, monospace">{i}</text>
            </g>
          ))}

          {/* fill meter — the primer's monthly growth eating the box */}
          <g opacity={clamp01(load * 6)}>
            <rect x={BOX.x + BOX.w + 16} y={BOX.y + 40} width={12} height={BOX.h - 80} rx={6}
              fill={colors.BG} stroke={colors.GRID} />
            <rect x={BOX.x + BOX.w + 16} y={BOX.y + 40 + (BOX.h - 80) * (1 - fill)} width={12} height={(BOX.h - 80) * fill} rx={6}
              fill={fill >= 1 ? colors.NEGATIVE : colors.WARM} opacity={0.85} />
            <text x={BOX.x + BOX.w + 22} y={BOX.y + 24} textAnchor="middle" fill={colors.MUTED} fontSize={11}>mem</text>
          </g>
        </g>

        {/* the h(k) funnel */}
        <g opacity={funnelU * (1 - boxDim * 0.85)}>
          <path d={`M${FUNNEL.x - 58} ${FUNNEL.y - 44} L${FUNNEL.x + 8} ${FUNNEL.y - 12} L${FUNNEL.x + 8} ${FUNNEL.y + 12} L${FUNNEL.x - 58} ${FUNNEL.y + 44} Z`}
            fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <MathLabel tex={'h(k)'} x={FUNNEL.x - 26} y={FUNNEL.y} fontSize={17} color={colors.SECONDARY} anchor="middle" />
        </g>

        {/* hero key: waiting, flying, then living in slot 5 */}
        {heroFly < 1 ? (
          <Chip x={heroP.x} y={heroP.y} name={hero.name} value={hero.value} u={heroU * (1 - boxDim)} hot />
        ) : (
          <Chip x={heroSlotPt.x} y={heroSlotPt.y} name={hero.name} value={hero.value} u={(1 - boxDim * 0.85)} hot />
        )}
        <g opacity={hashU * (1 - boxDim)}>
          <text x={FUNNEL.x - 26} y={FUNNEL.y + 74} textAnchor="middle" fill={colors.SECONDARY} fontSize={14}
            fontFamily="ui-monospace, monospace">{`h("cart:42") = ${HERO_SLOT}`}</text>
        </g>

        {/* the other keys, staggered through the funnel */}
        {KEYS.map((k, i) => {
          if (i === HERO) return null;
          const u = win(keysIn, KEYS.length - 1, i - 1, 3.2);
          if (u <= 0) return null;
          const p = chipPos(k, u, i);
          return <Chip key={k.name} x={p.x} y={p.y} name={k.name} value={k.value} u={Math.min(1, u * 5) * (1 - boxDim * 0.85)} />;
        })}

        {/* the read: probe out, value back */}
        <g opacity={(1 - boxDim)}>
          {getU > 0 && retU < 1 && (
            <g>
              <circle cx={CLIENT.x} cy={CLIENT.y} r={9} fill={colors.POSITIVE} opacity={0.9} />
              <text x={CLIENT.x} y={CLIENT.y + 26} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>client</text>
              <text x={CLIENT.x} y={CLIENT.y - 18} textAnchor="middle" fill={colors.MUTED} fontSize={12}
                fontFamily="ui-monospace, monospace">GET cart:42</text>
            </g>
          )}
          {getU > 0 && getU < 1 && (
            <circle
              cx={CLIENT.x + (heroSlotPt.x - CLIENT.x) * getU}
              cy={CLIENT.y + (heroSlotPt.y - CLIENT.y) * getU - Math.sin(getU * Math.PI) * 60}
              r={6} fill={colors.POSITIVE} />
          )}
          {retU > 0 && retU < 1 && (
            <g>
              <circle
                cx={heroSlotPt.x + (CLIENT.x - heroSlotPt.x) * retU}
                cy={heroSlotPt.y + (CLIENT.y - heroSlotPt.y) * retU + Math.sin(retU * Math.PI) * 60}
                r={8} fill={colors.WARM} />
              <text
                x={heroSlotPt.x + (CLIENT.x - heroSlotPt.x) * retU}
                y={heroSlotPt.y + (CLIENT.y - heroSlotPt.y) * retU + Math.sin(retU * Math.PI) * 60 - 14}
                textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily="ui-monospace, monospace">3 items</text>
            </g>
          )}
        </g>
        <MathLabel tex={'O(1)'} x={heroSlotPt.x + 120} y={heroSlotPt.y - 34} fontSize={20}
          color={colors.POSITIVE} opacity={o1U * (1 - boxDim)} anchor="middle" />

        {/* Redis / Memcached chips + the latency fact — left column, clear of
            the caption pill (the CC pill owns the stage's bottom strip) */}
        <g opacity={chipsU * (1 - boxDim) * (1 - clamp01(load * 6))}>
          {['Redis', 'Memcached'].map((nm, i) => (
            <g key={nm} transform={`translate(${185}, ${170 + i * 44})`}>
              <rect width={116} height={32} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
              <text x={58} y={21} textAnchor="middle" fill={colors.ACCENT} fontSize={13}>{nm}</text>
            </g>
          ))}
          <text x={185} y={276} fill={colors.MUTED} fontSize={12}
            fontFamily="ui-monospace, monospace">memory: ~250 μs / MB</text>
        </g>

        {/* the load counter */}
        <g opacity={clamp01(load * 6) * (1 - boxDim) * (1 - ghostsU)}>
          <text x={200} y={150} fill={colors.TEXT} fontSize={15}>users</text>
          <text x={200} y={176} fill={colors.WARM} fontSize={20} fontFamily="ui-monospace, monospace">{USERS}</text>
          <text x={200} y={216} fill={colors.TEXT} fontSize={15}>requests / s</text>
          <text x={200} y={244} fill={hotU > 0.02 ? colors.NEGATIVE : colors.WARM} fontSize={22}
            fontFamily="ui-monospace, monospace">{reqs.toLocaleString('en-US')}</text>
          <g opacity={hotU}>
            <text x={200} y={286} fill={colors.NEGATIVE} fontSize={14} fontFamily="ui-monospace, monospace">+2.7 TB / month</text>
          </g>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
