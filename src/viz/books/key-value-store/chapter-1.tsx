// One Big Hash Table: the first answer
//
// Grounding: solutions/object_oriented_design/hash_table/hash_map.py (the
// primer's own HashTable: _hash_function(key) = key % self.size, set, get)
// and README.md "Key-value store" (#key-value-store): "Abstraction: hash
// table", O(1) reads and writes, backed by memory or SSD.
//
// Centerpiece: a WORKING hash table — keys fall through the hash gate and
// deflect into buckets. Then traffic scales up: keys rain in, the memory bar
// overflows, the box flickers as a single point of failure, and the problem
// splits in two (partition / replicate) — the rest of the book.
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
import { Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
/** Per-item window over one 0..1 driver channel (the stagger trick). */
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

// ---------------------------------------------------------------------------
// Layout — the interview card, the hash table machine, the meters.
// ---------------------------------------------------------------------------

const CARD = { x: 70, y: 150, w: 300, h: 150 } as const;
const TABLE = { x: 480, y: 96, w: 360, h: 476 } as const;
const GATE = { x: TABLE.x + 20, y: TABLE.y + 46, w: TABLE.w - 40, h: 74 } as const;
const N_BUCKETS = 8;
const ROW_H = 42;
const ROW_Y0 = GATE.y + GATE.h + 22;
const rowY = (b: number): number => ROW_Y0 + b * ROW_H + ROW_H / 2;
const SLOT_X0 = TABLE.x + 46;
const SLOT_DX = 46;
const MEM = { x: 880, y: ROW_Y0, w: 18, h: N_BUCKETS * ROW_H - 8 } as const;
const METER = { x: 1050, y: 150 } as const;

// camera marks
const CAM_CARD: CameraState = { x: 430, y: 270, k: 1.3 };
const CAM_TABLE: CameraState = { x: 660, y: 330, k: 1.18 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// The keys. Our throughline key "user:42" goes first; 13 more rain in later.
// Buckets come from one seeded PRNG; slot order is arrival order.
// ---------------------------------------------------------------------------

const rand = mulberry32(42);

const KEY_NAMES = [
  'user:42', // ours — WARM, always
  'cart:7',
  'sess:19',
  'img:304',
  'feed:8',
  'geo:112',
  'cfg:1',
  'like:77',
  'msg:53',
  'tag:26',
  'doc:88',
  'job:61',
  'ana:5',
  'ord:230',
] as const;

interface KeyDatum {
  name: string;
  bucket: number;
  slot: number;
}

const KEYS: KeyDatum[] = (() => {
  const fill = new Array<number>(N_BUCKETS).fill(0);
  return KEY_NAMES.map((name, i) => {
    // our key demonstrably lands in bucket 6 (the caption quotes it)
    let bucket = i === 0 ? 6 : Math.floor(rand() * N_BUCKETS);
    // keep rows readable: cap at 4 dots, spill to the next row
    let guard = 0;
    while (fill[bucket] >= 4 && guard++ < N_BUCKETS) bucket = (bucket + 1) % N_BUCKETS;
    const slot = fill[bucket]++;
    return { name, bucket, slot };
  });
})();

const OUR = KEYS[0];

/** Piecewise-linear travel along waypoints, u in 0..1. */
function along(pts: { x: number; y: number }[], u: number): { x: number; y: number } {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.min(Math.floor(f), pts.length - 2);
  const t = f - i;
  return {
    x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
    y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
  };
}

/** card → gate → down the spine → into the slot. */
function keyPath(k: KeyDatum): { x: number; y: number }[] {
  return [
    { x: CARD.x + CARD.w - 10, y: CARD.y + 108 },
    { x: GATE.x - 24, y: GATE.y + GATE.h / 2 },
    { x: GATE.x + GATE.w / 2, y: GATE.y + GATE.h / 2 },
    { x: GATE.x + GATE.w / 2, y: rowY(k.bucket) },
    { x: SLOT_X0 + k.slot * SLOT_DX, y: rowY(k.bucket) },
  ];
}
const OUR_PATH = keyPath(OUR);

// ---------------------------------------------------------------------------
// Timeline (~74s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CARD, cameraInterp);

  const qU = tl.channel('qU', 0); // interview card
  const opsU = tl.channel('opsU', 0); // set / get chips
  const tableU = tl.channel('tableU', 0); // hash table panel draw-on
  const keyU = tl.channel('keyU', 0); // our key's travel card→slot
  const calcU = tl.channel('calcU', 0); // "% 8 → 6" chip at the gate
  const getU = tl.channel('getU', 0); // read retrace 0..1 out, 1..2 back
  const bigOU = tl.channel('bigOU', 0); // O(1) label
  const rainU = tl.channel('rainU', 0); // 13 more keys, staggered
  const rpsU = tl.channel('rpsU', 0); // requests/second ramp
  const memU = tl.channel('memU', 0); // memory bar fill
  const hotU = tl.channel('hotU', 0); // overload glow
  const flickU = tl.channel('flickU', 0); // SPOF flicker, 0..3 = three dips
  const dimU = tl.channel('dimU', 0); // machine fades under the closing cards
  const q1U = tl.channel('q1U', 0); // PARTITION card
  const q2U = tl.channel('q2U', 0); // REPLICATE card
  const teaseU = tl.channel('teaseU', 0); // three-node ring teaser

  // — beat 1 · the interview question —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Here is the classic opener: design a key-value store. Two operations — put a value under a key, and get it back, fast.',
  });
  tl.tween(qU, 1, { at: 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(opsU, 1, { at: 2.6, dur: 0.8, ease: ease.pop });
  tl.hold(6.7, 0.5);

  // — beat 2 · the primer's answer: a hash table —
  tl.caption({
    at: 7.2,
    dur: 6.4,
    text: 'The primer answers with a data structure before it answers with servers. A key-value store is, at heart, a hash table — this exact class from the solutions folder.',
  });
  tl.tween(cam, CAM_TABLE, { at: 7.4, dur: 1.4, ease: ease.move });
  tl.tween(tableU, 1, { at: 7.8, dur: 1.6, ease: ease.draw });

  // — beat 3 · our key drops through the gate —
  tl.caption({
    at: 14.2,
    dur: 6.6,
    text: 'The hash function turns a key into a bucket number: take the key, mod the table size. Our key — user forty-two — lands in bucket six.',
  });
  tl.tween(keyU, 0.42, { at: 14.6, dur: 1.0, ease: ease.move }); // to the gate
  tl.tween(calcU, 1, { at: 15.8, dur: 0.5, ease: ease.pop });
  tl.tween(keyU, 1, { at: 17.2, dur: 1.4, ease: ease.move }); // into bucket 6
  tl.hold(20.6, 0.8);

  // — beat 4 · reads retrace it —
  tl.caption({
    at: 21.4,
    dur: 5.8,
    text: 'Reads retrace the same arithmetic. No scanning, no searching — one hash, one hop, constant time on average.',
  });
  tl.tween(getU, 1, { at: 21.8, dur: 1.6, ease: ease.move });
  tl.tween(getU, 2, { at: 23.6, dur: 1.4, ease: ease.move });
  tl.tween(bigOU, 1, { at: 25.2, dur: 0.6, ease: ease.pop });

  // — beat 5 · at small scale, done —
  tl.caption({
    at: 27.8,
    dur: 5.2,
    text: "And at small scale, you're done. A hash table in memory on one machine really is a key-value store.",
  });
  tl.tween(calcU, 0, { at: 28.2, dur: 0.6, ease: ease.enter });
  tl.hold(31.6, 1.4);

  // — beat 6 · turn up the traffic —
  tl.caption({
    at: 33.6,
    dur: 6.4,
    text: 'But the interview is never about small scale. Turn up the traffic: millions of keys, thousands of requests a second, all aimed at this one box.',
  });
  tl.tween(cam, CAM_WIDE, { at: 33.8, dur: 1.5, ease: ease.move });
  tl.tween(rainU, 1, { at: 34.6, dur: 8.5, ease: ease.linear });
  tl.tween(rpsU, 1, { at: 34.6, dur: 11, ease: ease.linear });

  // — beat 7 · memory fills —
  tl.caption({
    at: 40.6,
    dur: 6.0,
    text: 'Memory fills first. One machine holds the entire keyspace, so the entire keyspace has to fit in one machine.',
  });
  tl.tween(memU, 1, { at: 41.0, dur: 4.6, ease: ease.linear });
  tl.tween(hotU, 1, { at: 44.4, dur: 1.6, ease: ease.move });

  // — beat 8 · single point of failure —
  tl.caption({
    at: 47.2,
    dur: 6.0,
    text: "And it's worse than full — this box is now a single point of failure. The day it dies, every key it holds dies with it.",
  });
  tl.tween(flickU, 3, { at: 47.8, dur: 3.4, ease: ease.linear });

  // — beat 9 · the problem splits in two —
  tl.caption({
    at: 53.8,
    dur: 6.6,
    text: 'So the problem splits cleanly in two. Too much data for one machine: partition it. Any machine can vanish: replicate it.',
  });
  tl.tween(dimU, 1, { at: 54.0, dur: 1.2, ease: ease.move });
  tl.tween(q1U, 1, { at: 55.2, dur: 0.7, ease: ease.pop });
  tl.tween(q2U, 1, { at: 56.6, dur: 0.7, ease: ease.pop });

  // — beat 10 · the road ahead —
  tl.caption({
    at: 61.0,
    dur: 6.4,
    text: 'The rest of this book is those two answers, and the price they charge. First, the split — done so that growing the cluster never triggers a stampede.',
  });
  tl.tween(teaseU, 1, { at: 62.2, dur: 1.4, ease: ease.draw });
  tl.hold(67.4, 1.6);

  return {
    tl,
    cam,
    qU,
    opsU,
    tableU,
    keyU,
    calcU,
    getU,
    bigOU,
    rainU,
    rpsU,
    memU,
    hotU,
    flickU,
    dimU,
    q1U,
    q2U,
    teaseU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const qU = s.get(scene.qU);
  const opsU = s.get(scene.opsU);
  const tableU = s.get(scene.tableU);
  const keyU = s.get(scene.keyU);
  const calcU = s.get(scene.calcU);
  const getU = s.get(scene.getU);
  const bigOU = s.get(scene.bigOU);
  const rainU = s.get(scene.rainU);
  const rpsU = s.get(scene.rpsU);
  const memU = s.get(scene.memU);
  const hotU = s.get(scene.hotU);
  const flickU = s.get(scene.flickU);
  const dimU = s.get(scene.dimU);
  const q1U = s.get(scene.q1U);
  const q2U = s.get(scene.q2U);
  const teaseU = s.get(scene.teaseU);

  const machineOp = (1 - 0.88 * dimU) * (1 - 0.4 * Math.abs(Math.sin(Math.PI * flickU)));
  const ourPos = along(OUR_PATH, keyU);
  const getPos = along(OUR_PATH, getU <= 1 ? getU : 2 - getU);
  const rps = Math.round(120 * Math.pow(10, 2.6 * rpsU)); // 120 → ~48k req/s
  const borderColor = hotU > 0.02 ? colors.NEGATIVE : colors.GRID;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the interview card */}
        <g opacity={qU * (1 - 0.88 * dimU)}>
          <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={CARD.x + 22} y={CARD.y + 36} fill={colors.MUTED} fontSize={13} fontStyle="italic">
            the interview question
          </text>
          <text x={CARD.x + 22} y={CARD.y + 64} fill={colors.TEXT} fontSize={19} fontWeight={600}>
            Design a key-value store
          </text>
          <g opacity={opsU}>
            <rect x={CARD.x + 22} y={CARD.y + 86} width={116} height={30} rx={8} fill="none" stroke={colors.ACCENT} />
            <text x={CARD.x + 80} y={CARD.y + 106} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>
              set(k, v)
            </text>
            <rect x={CARD.x + 150} y={CARD.y + 86} width={92} height={30} rx={8} fill="none" stroke={colors.POSITIVE} />
            <text x={CARD.x + 196} y={CARD.y + 106} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>
              get(k)
            </text>
          </g>
        </g>

        {/* the machine: server zone + hash table panel */}
        <g opacity={machineOp}>
          <Zone
            x={TABLE.x - 40}
            y={TABLE.y - 30}
            w={TABLE.w + 160}
            h={TABLE.h + 66}
            label="one server — memory or SSD"
            kind="group"
            u={clamp01(rpsU * 4) * tableU}
            color={borderColor}
          />
          <g opacity={tableU}>
            <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.h} rx={14} fill={colors.PANEL} stroke={borderColor} strokeWidth={1.5 + hotU} />
            <text x={TABLE.x + 18} y={TABLE.y + 28} fill={colors.TEXT} fontSize={15} fontWeight={600}>
              HashTable
            </text>
            <text x={TABLE.x + TABLE.w - 18} y={TABLE.y + 28} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              hash_map.py
            </text>

            {/* the hash gate */}
            <rect x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.4} />
            <text x={GATE.x + 14} y={GATE.y + 30} fill={colors.ACCENT} fontSize={13.5} fontFamily={MONO}>
              _hash_function(key)
            </text>
            <text x={GATE.x + 14} y={GATE.y + 54} fill={colors.MUTED} fontSize={13.5} fontFamily={MONO}>
              return key % self.size
            </text>

            {/* the buckets */}
            {Array.from({ length: N_BUCKETS }, (_, b) => (
              <g key={b}>
                <rect
                  x={TABLE.x + 20}
                  y={ROW_Y0 + b * ROW_H}
                  width={TABLE.w - 40}
                  height={ROW_H - 8}
                  rx={7}
                  fill={colors.BG}
                  stroke={b === OUR.bucket && keyU > 0.9 ? colors.WARM : colors.GRID}
                  opacity={0.9}
                />
                <text x={TABLE.x + TABLE.w - 30} y={ROW_Y0 + b * ROW_H + 23} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  [{b}]
                </text>
              </g>
            ))}
          </g>

          {/* the "% 8 → 6" computation chip */}
          <g opacity={calcU}>
            <rect x={GATE.x + GATE.w - 120} y={GATE.y - 18} width={132} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} />
            <text x={GATE.x + GATE.w - 54} y={GATE.y + 2} textAnchor="middle" fill={colors.WARM} fontSize={13.5} fontFamily={MONO}>
              {'% 8 → [6]'}
            </text>
          </g>

          {/* O(1) */}
          <MathLabel tex={'O(1)'} x={TABLE.x + TABLE.w + 46} y={rowY(OUR.bucket) - 10} fontSize={26} color={colors.POSITIVE} opacity={bigOU * (1 - dimU)} />

          {/* our key — the throughline */}
          {keyU > 0 && (
            <g>
              <circle cx={ourPos.x} cy={ourPos.y} r={8} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
              <text x={ourPos.x} y={ourPos.y - 14} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                user:42
              </text>
            </g>
          )}

          {/* the read retrace — a hollow probe out, a green value back */}
          {getU > 0 && getU < 2 && (
            <circle
              cx={getPos.x}
              cy={getPos.y}
              r={7}
              fill={getU <= 1 ? 'none' : colors.POSITIVE}
              stroke={getU <= 1 ? colors.POSITIVE : colors.BG}
              strokeWidth={2}
            />
          )}

          {/* the rain — 13 more keys, staggered along their own paths */}
          {KEYS.slice(1).map((k, i) => {
            const u = win(rainU, KEYS.length - 1, i, 2.5);
            if (u <= 0) return null;
            const p = along(keyPath(k), u);
            return <circle key={k.name} cx={p.x} cy={p.y} r={6} fill={colors.ACCENT} opacity={0.9} stroke={colors.BG} strokeWidth={1} />;
          })}

          {/* memory bar */}
          <g opacity={tableU * clamp01(rpsU * 3)}>
            <rect x={MEM.x} y={MEM.y} width={MEM.w} height={MEM.h} rx={6} fill={colors.BG} stroke={colors.GRID} />
            <rect
              x={MEM.x + 2}
              y={MEM.y + 2 + (MEM.h - 4) * (1 - (0.22 + 0.78 * memU))}
              width={MEM.w - 4}
              height={(MEM.h - 4) * (0.22 + 0.78 * memU)}
              rx={4}
              fill={memU > 0.96 ? colors.NEGATIVE : colors.ACCENT}
              opacity={0.85}
            />
            <text x={MEM.x + MEM.w / 2} y={MEM.y - 10} textAnchor="middle" fill={memU > 0.96 ? colors.NEGATIVE : colors.MUTED} fontSize={12}>
              {memU > 0.96 ? 'mem — FULL' : 'mem'}
            </text>
          </g>

          {/* requests-per-second meter */}
          <g opacity={clamp01(rpsU * 5)}>
            <text x={METER.x} y={METER.y} fill={rpsU > 0.8 ? colors.NEGATIVE : colors.TEXT} fontSize={30} fontFamily={MONO} fontWeight={600}>
              {rps.toLocaleString('en-US')}
            </text>
            <text x={METER.x} y={METER.y + 24} fill={colors.MUTED} fontSize={13}>
              requests / second
            </text>
          </g>
        </g>

        {/* the closing split: partition / replicate */}
        <g opacity={q1U}>
          <rect x={200} y={250} width={400} height={130} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={230} y={300} fill={colors.TEXT} fontSize={18}>
            Too much data for one box
          </text>
          <text x={230} y={340} fill={colors.ACCENT} fontSize={20} fontWeight={700}>
            {'→ PARTITION'}
          </text>
        </g>
        <g opacity={q2U}>
          <rect x={680} y={250} width={400} height={130} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
          <text x={710} y={300} fill={colors.TEXT} fontSize={18}>
            Any box can die
          </text>
          <text x={710} y={340} fill={colors.POSITIVE} fontSize={20} fontWeight={700}>
            {'→ REPLICATE'}
          </text>
        </g>

        {/* three-node ring teaser — chapter 2 begins here */}
        <g opacity={teaseU}>
          <circle cx={640} cy={500} r={62} fill="none" stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="4 5" />
          {[0, 1, 2].map((i) => {
            const a = -Math.PI / 2 + (i / 3) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={640 + 62 * Math.cos(a)}
                cy={500 + 62 * Math.sin(a)}
                r={9}
                fill={[colors.ACCENT, colors.SECONDARY, colors.POSITIVE][i]}
              />
            );
          })}
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
