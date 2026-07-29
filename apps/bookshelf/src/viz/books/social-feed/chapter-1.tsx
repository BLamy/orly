// Written Once, Read Relentlessly
//
// Backing: solutions/system_design/twitter/README.md — "Constraints and
// assumptions" + "Calculate usage" (500M tweets/day · 6,000 writes/s ·
// 250B reads/month · 100,000 reads/s) and the POST /api/v1/tweet response
// (tweet_id 987, user_id 123, "hello world!").
//
// Machine: ONE tweet card is written once by its author — a single pulse —
// then a field of reader dots pulls copies out of it forever (spark packets
// looping card → crowd while the crowd lights up). Counters tick to the real
// rates; two bars make the 17:1 imbalance physical. Close on the design law:
// read-heavy → optimize for fast reads.
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
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Packet, ParticleCloud } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const frac = (u: number): number => u - Math.floor(u);

// ---------------------------------------------------------------------------
// The tweet card — the throughline object of the whole book.
// ---------------------------------------------------------------------------

const CARD = { x: 150, y: 150, w: 310, h: 128 } as const;
const CARD_C = { x: CARD.x + CARD.w / 2, y: CARD.y + CARD.h / 2 };
const AUTHOR = { x: 70, y: CARD_C.y };

// ---------------------------------------------------------------------------
// The crowd of readers — a jittered grid over the right half of the stage.
// Precomputed with a seeded PRNG; lighting order is a shuffled rank.
// ---------------------------------------------------------------------------

const FIELD = { x0: 570, y0: 96, x1: 1236, y1: 596 } as const;
const COLS = 22;
const ROWS = 14;
const rand = mulberry32(20260715);

interface Reader {
  x: number;
  y: number;
  litAt: number; // 0..1 order in which the tide reaches this reader
}

const READERS: Reader[] = (() => {
  const out: Reader[] = [];
  const dx = (FIELD.x1 - FIELD.x0) / (COLS - 1);
  const dy = (FIELD.y1 - FIELD.y0) / (ROWS - 1);
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      out.push({
        x: FIELD.x0 + i * dx + (rand() - 0.5) * dx * 0.6,
        y: FIELD.y0 + j * dy + (rand() - 0.5) * dy * 0.6,
        litAt: rand(),
      });
    }
  }
  return out;
})();

/** Spark targets: readers the looping read-packets fly to. */
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  phase: i / 14,
  targets: Array.from({ length: 4 }, () => Math.floor(rand() * READERS.length)),
}));

// The bars — writes vs reads per second, honest linear scale.
const BARS = { baseY: 578, maxH: 225, wX: 205, rX: 320, w: 74 } as const;
const W_RATE = 6000;
const R_RATE = 100000;

// camera marks
const CAM_CARD: CameraState = { x: 320, y: 235, k: 1.5 };
const CAM_CROWD: CameraState = { x: 850, y: 340, k: 1.12 };
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_BARS: CameraState = { x: 340, y: 390, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  cardU: ChannelRef<number>;
  writeU: ChannelRef<number>;
  crowdU: ChannelRef<number>;
  tide: ChannelRef<number>;
  sparks: ChannelRef<number>;
  wN: ChannelRef<number>;
  rN: ChannelRef<number>;
  writeStream: ChannelRef<number>;
  barU: ChannelRef<number>;
  cardN: ChannelRef<number>;
  dimU: ChannelRef<number>;
  lawU: ChannelRef<number>;
  law2U: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cardU = tl.channel('cardU', 0);
  const writeU = tl.channel('writeU', 0);
  const crowdU = tl.channel('crowdU', 0);
  const tide = tl.channel('tide', 0);
  const sparks = tl.channel('sparks', 0);
  const wN = tl.channel('wN', 0);
  const rN = tl.channel('rN', 0);
  const writeStream = tl.channel('writeStream', 0);
  const barU = tl.channel('barU', 0);
  const cardN = tl.channel('cardN', 0);
  const dimU = tl.channel('dimU', 0);
  const lawU = tl.channel('lawU', 0);
  const law2U = tl.channel('law2U', 0);

  // — Beat 1 · written exactly once —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'Here is one tweet: hello world. It gets written exactly once, by one person.',
  });
  tl.tween(cam, CAM_CARD, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(cardU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(writeU, 1, { at: 2.6, dur: 1.6, ease: ease.linear });

  // — Beat 2 · read forever —
  tl.caption({
    at: 7.1,
    dur: 6.5,
    text: "But it doesn't get read once. Every follower who scrolls past reads it — today, tomorrow, every refresh.",
  });
  tl.tween(cam, CAM_WIDE, { at: 7.3, dur: 1.6, ease: ease.move });
  tl.tween(crowdU, 1, { at: 7.8, dur: 2.2, ease: ease.draw });
  tl.tween(sparks, 1, { at: 9.0, dur: 46, ease: ease.linear });
  tl.tween(tide, 0.35, { at: 9.4, dur: 10, ease: ease.linear });
  tl.hold(13.6, 0.7);

  // — Beat 3 · the write rate —
  tl.caption({
    at: 14.3,
    dur: 7,
    text: "At Twitter's scale that means five hundred million new tweets a day — about six thousand writes every second.",
  });
  tl.tween(writeStream, 1, { at: 14.5, dur: 26, ease: ease.linear });
  tl.tween(wN, W_RATE, { at: 15.0, dur: 4.5, ease: ease.move });
  tl.hold(21.3, 0.7);

  // — Beat 4 · the read rate —
  tl.caption({
    at: 22.0,
    dur: 6.5,
    text: 'Reads dwarf that: two hundred fifty billion timeline requests a month — a hundred thousand every second.',
  });
  tl.tween(cam, CAM_CROWD, { at: 22.2, dur: 1.5, ease: ease.move });
  tl.tween(rN, R_RATE, { at: 22.8, dur: 4.5, ease: ease.move });
  tl.tween(tide, 1, { at: 22.6, dur: 9, ease: ease.linear });
  tl.hold(28.5, 0.7);

  // — Beat 5 · the bars —
  tl.caption({
    at: 29.2,
    dur: 6.5,
    text: 'Side by side, the imbalance is the design brief: seventeen reads arrive for every write, before anything goes viral.',
  });
  tl.tween(cam, CAM_BARS, { at: 29.4, dur: 1.5, ease: ease.move });
  tl.tween(barU, 1, { at: 30.2, dur: 2.2, ease: ease.move });
  tl.hold(35.7, 0.7);

  // — Beat 6 · the skew —
  tl.caption({
    at: 36.4,
    dur: 7,
    text: 'And averages hide the skew. One tweet from a big account is read thousands, even millions of times. It was still written once.',
  });
  tl.tween(cam, CAM_CARD, { at: 36.6, dur: 1.5, ease: ease.move });
  tl.tween(cardN, 1200000, { at: 37.4, dur: 5.4, ease: ease.move });
  tl.hold(43.4, 0.7);

  // — Beat 7 · the law —
  tl.caption({
    at: 44.1,
    dur: 6.5,
    text: 'So the system is read heavy, and the rule follows: optimize for fast reads, even if writes must do extra work.',
  });
  tl.tween(cam, CAM_WIDE, { at: 44.3, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 44.9, dur: 1.4, ease: ease.move });
  tl.tween(lawU, 1, { at: 45.7, dur: 0.9, ease: ease.enter });

  // — Beat 8 · fan-out, announced —
  tl.caption({
    at: 51.0,
    dur: 7,
    text: "The whole design is that one trade. Do the expensive part once, at write time, so every read is cheap. That move is called fan-out.",
  });
  tl.tween(law2U, 1, { at: 52.2, dur: 0.9, ease: ease.enter });
  tl.hold(58.0, 1.6);

  return {
    tl, cam, cardU, writeU, crowdU, tide, sparks, wN, rN,
    writeStream, barU, cardN, dimU, lawU, law2U,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function computeCrowd(s: SceneState) {
  const crowdU = s.get(scene.crowdU);
  const tide = s.get(scene.tide);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  return READERS.map((m, k) => {
    const appear = clamp01(crowdU * 1.6 - (k / READERS.length) * 0.6);
    const lit = clamp01((tide - m.litAt) * 6);
    return {
      x: m.x,
      y: m.y,
      r: 2.2 + 2.2 * lit,
      alpha: appear * (0.16 + 0.7 * lit) * dim,
      color: lit > 0.03 ? colors.ACCENT : colors.MUTED,
    };
  });
}

const fmt = (n: number): string => Math.floor(n).toLocaleString('en-US');

function TweetCard({ u, reads, dim }: { u: number; reads: number; dim: number }) {
  const op = u * (1 - 0.85 * dim);
  if (op <= 0.01) return null;
  return (
    <g opacity={op}>
      <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <circle cx={CARD.x + 34} cy={CARD.y + 34} r={14} fill={colors.SECONDARY} opacity={0.9} />
      <text x={CARD.x + 58} y={CARD.y + 32} fill={colors.TEXT} fontSize={15} fontWeight={600}>
        user_id 123
      </text>
      <text x={CARD.x + 58} y={CARD.y + 50} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
        tweet_id 987
      </text>
      <text x={CARD.x + 24} y={CARD.y + 86} fill={colors.TEXT} fontSize={19}>
        “hello world!”
      </text>
      {reads > 0 && (
        <text x={CARD.x + CARD.w - 18} y={CARD.y + CARD.h - 14} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily="ui-monospace, monospace">
          reads: {fmt(reads)}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cardU = s.get(scene.cardU);
  const writeU = s.get(scene.writeU);
  const sparks = s.get(scene.sparks);
  const wN = s.get(scene.wN);
  const rN = s.get(scene.rN);
  const writeStream = s.get(scene.writeStream);
  const barU = s.get(scene.barU);
  const cardN = s.get(scene.cardN);
  const dimU = s.get(scene.dimU);
  const lawU = s.get(scene.lawU);
  const law2U = s.get(scene.law2U);
  const crowdU = s.get(scene.crowdU);

  const wH = BARS.maxH * (W_RATE / R_RATE) * barU;
  const rH = BARS.maxH * barU;
  const faded = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the author — one person, one write */}
        <g opacity={cardU * faded}>
          <circle cx={AUTHOR.x} cy={AUTHOR.y} r={11} fill={colors.SECONDARY} />
          <text x={AUTHOR.x} y={AUTHOR.y + 30} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
            author
          </text>
        </g>
        {/* the single write pulse */}
        <Packet from={AUTHOR} to={{ x: CARD.x - 4, y: CARD_C.y }} u={writeU} r={7} color={colors.SECONDARY} label="write ×1" />
        {/* beat 3: the steady global write trickle into the card */}
        {writeStream > 0 && writeStream < 1 &&
          [0, 1, 2].map((i) => (
            <Packet
              key={`w${i}`}
              from={{ x: AUTHOR.x, y: AUTHOR.y - 60 + i * 60 }}
              to={{ x: CARD.x - 4, y: CARD_C.y }}
              u={frac(writeStream * 9 + i / 3)}
              r={3.5}
              color={colors.SECONDARY}
              opacity={0.7 * faded}
            />
          ))}

        <TweetCard u={cardU} reads={cardN} dim={dimU} />

        {/* the crowd of readers */}
        <g opacity={crowdU * faded}>
          <text x={(FIELD.x0 + FIELD.x1) / 2} y={FIELD.y0 - 20} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
            the readers — every dot, a timeline request
          </text>
        </g>
        <ParticleCloud state={s} compute={computeCrowd} />

        {/* read sparks: copies streaming out of the card, forever */}
        {sparks > 0 && sparks < 1 &&
          SPARKS.map((sp, i) => {
            const raw = sparks * 26 + sp.phase;
            const u = frac(raw);
            const target = READERS[sp.targets[Math.floor(raw) % sp.targets.length]];
            return (
              <Packet
                key={`s${i}`}
                from={{ x: CARD.x + CARD.w + 4, y: CARD_C.y }}
                to={target}
                u={u}
                r={3.2}
                color={colors.ACCENT}
                opacity={0.85 * faded}
              />
            );
          })}

        {/* the two rate counters + bars */}
        <g opacity={faded}>
          {wN > 0 && (
            <g>
              <text x={BARS.wX + BARS.w / 2} y={BARS.baseY - BARS.maxH - 44} textAnchor="middle" fill={colors.SECONDARY} fontSize={20} fontWeight={700} fontFamily="ui-monospace, monospace">
                {fmt(wN)}
              </text>
              <text x={BARS.wX + BARS.w / 2} y={BARS.baseY - BARS.maxH - 26} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                writes / s
              </text>
            </g>
          )}
          {rN > 0 && (
            <g>
              <text x={BARS.rX + BARS.w / 2} y={BARS.baseY - BARS.maxH - 44} textAnchor="middle" fill={colors.ACCENT} fontSize={20} fontWeight={700} fontFamily="ui-monospace, monospace">
                {fmt(rN)}
              </text>
              <text x={BARS.rX + BARS.w / 2} y={BARS.baseY - BARS.maxH - 26} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                reads / s
              </text>
            </g>
          )}
          {barU > 0 && (
            <g>
              <line x1={BARS.wX - 26} y1={BARS.baseY} x2={BARS.rX + BARS.w + 26} y2={BARS.baseY} stroke={colors.GRID} strokeWidth={1.5} />
              <rect x={BARS.wX} y={BARS.baseY - wH} width={BARS.w} height={Math.max(wH, 0.01)} rx={4} fill={colors.SECONDARY} opacity={0.85} />
              <rect x={BARS.rX} y={BARS.baseY - rH} width={BARS.w} height={Math.max(rH, 0.01)} rx={4} fill={colors.ACCENT} opacity={0.85} />
              <g opacity={clamp01(barU * 2 - 1)}>
                <rect x={BARS.rX + BARS.w / 2 - 32} y={BARS.baseY - rH - 4 - 24} width={64} height={22} rx={11} fill={colors.PANEL} stroke={colors.WARM} />
                <text x={BARS.rX + BARS.w / 2} y={BARS.baseY - rH - 12} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700}>
                  ×17
                </text>
              </g>
            </g>
          )}
        </g>

        {/* the closing law panel — opaque, over a quiet stage */}
        <g opacity={lawU}>
          <rect x={330} y={200} width={620} height={230} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={268} textAnchor="middle" fill={colors.WARM} fontSize={30} fontWeight={800} letterSpacing={2}>
            READ-HEAVY
          </text>
          <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            optimize for fast reads
          </text>
          <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            writes may do extra work — once
          </text>
          <g opacity={law2U}>
            <rect x={455} y={366} width={370} height={36} rx={18} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.2} />
            <text x={640} y={389} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily="ui-monospace, monospace">
              the move: fan-out
            </text>
          </g>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
