// The Question: 100,000 Reads a Second
//
// Backing: solutions/system_design/twitter/README.md — "Design the Twitter
// timeline and search". Every number on screen is from the README's
// constraints and usage math: 100 million active users, 500 million tweets a
// day (~6,000 tweets/sec), 250 billion read requests a month (~100,000
// reads/sec), average fanout of 10 (~60,000 deliveries/sec).
// Centerpiece: the traffic imbalance as two particle firehoses — a thin
// write stream and a flooding read stream — then a ×10 fanout prism that
// widens the writes, ending on the two doors: pull vs push.
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
import { ParticleCloud } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Precomputed particle tracks — everything derives from one `flow` channel.
// ---------------------------------------------------------------------------

const DUR = 66; // scene length in seconds; `flow` runs 0..1 across it

const STREAM_TOP = 158;
const STREAM_BOT = 552;
const WRITE_X = 360;
const READ_X = 920;
const PRISM_Y = 320;

interface Track {
  x: number;
  off: number; // phase offset 0..1
  speed: number; // cycles per second
  r: number;
}

const rand = mulberry32(20260715);

function makeTracks(n: number, cx: number, spread: number, s0: number, s1: number): Track[] {
  return Array.from({ length: n }, () => ({
    x: cx + (rand() - 0.5) * 2 * spread,
    off: rand(),
    speed: s0 + rand() * (s1 - s0),
    r: 2.2 + rand() * 1.8,
  }));
}

const WRITE_TRACKS = makeTracks(14, WRITE_X, 42, 0.2, 0.27);
const READ_TRACKS = makeTracks(130, READ_X, 118, 0.28, 0.4);

/** ×10 fanout: each write particle gains 9 shadow copies below the prism. */
const FAN_SPREAD: number[] = Array.from({ length: 9 }, (_, k) => (k - 4) * 15 + (rand() - 0.5) * 6);

const yOf = (tr: Track, t: number): number => {
  const u = (tr.off + t * tr.speed) % 1;
  return STREAM_TOP + u * (STREAM_BOT - STREAM_TOP);
};

// feed cards inside the phone
const PHONE = { x: 640, y: 352, w: 224, h: 396 } as const;
const CARD_N = 4;

// camera marks
const CAM_PHONE: CameraState = { x: 640, y: 330, k: 1.4 };
const CAM_READS: CameraState = { x: 860, y: 360, k: 1.12 };
const CAM_PRISM: CameraState = { x: 420, y: 340, k: 1.45 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  qU: ChannelRef<number>;
  phoneU: ChannelRef<number>;
  phoneDim: ChannelRef<number>;
  feedU: ChannelRef<number>;
  statsU: ChannelRef<number>;
  writeU: ChannelRef<number>;
  readU: ChannelRef<number>;
  ratioU: ChannelRef<number>;
  prismU: ChannelRef<number>;
  fanU: ChannelRef<number>;
  flow: ChannelRef<number>;
  dimU: ChannelRef<number>;
  doorsU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const qU = tl.channel('qU', 0);
  const phoneU = tl.channel('phoneU', 0);
  const phoneDim = tl.channel('phoneDim', 1);
  const feedU = tl.channel('feedU', 0);
  const statsU = tl.channel('statsU', 0);
  const writeU = tl.channel('writeU', 0);
  const readU = tl.channel('readU', 0);
  const ratioU = tl.channel('ratioU', 0);
  const prismU = tl.channel('prismU', 0);
  const fanU = tl.channel('fanU', 0);
  const flow = tl.channel('flow', 0);
  const dimU = tl.channel('dimU', 0);
  const doorsU = tl.channel('doorsU', 0);

  // the one clock behind every particle
  tl.tween(flow, 1, { at: 0, dur: DUR, ease: ease.linear });

  // — Beat 1 · the question —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Here is the classic interview question: design the home timeline. Open the app, and you see the newest posts from everyone you follow.',
  });
  tl.tween(qU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(phoneU, 1, { at: 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_PHONE, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(feedU, 1, { at: 2.2, dur: 1.8, ease: ease.move });

  // — Beat 2 · the numbers behind it —
  tl.caption({
    at: 7.4,
    dur: 5.4,
    text: 'One feed. Simple to describe, brutal to serve — because of the numbers behind it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 7.6, dur: 1.5, ease: ease.move });
  tl.tween(statsU, 1, { at: 8.6, dur: 1.0, ease: ease.enter });
  tl.hold(12.8, 0.5);

  // — Beat 3 · the write trickle —
  tl.caption({
    at: 13.3,
    dur: 7.2,
    text: 'Writes first. A hundred million people post five hundred million tweets a day. That sounds huge — but it is only about six thousand new tweets a second.',
  });
  tl.tween(phoneDim, 0.22, { at: 13.5, dur: 1.0, ease: ease.move });
  tl.tween(writeU, 1, { at: 14.2, dur: 1.4, ease: ease.enter });
  tl.hold(20.5, 0.6);

  // — Beat 4 · the read flood —
  tl.caption({
    at: 21.1,
    dur: 6.7,
    text: 'Now the reads. Two hundred fifty billion timeline requests a month — one hundred thousand reads every single second.',
  });
  tl.tween(readU, 1, { at: 21.6, dur: 1.6, ease: ease.enter });
  tl.tween(cam, CAM_READS, { at: 21.8, dur: 1.6, ease: ease.move });
  tl.hold(27.8, 0.5);

  // — Beat 5 · read heavy —
  tl.caption({
    at: 28.3,
    dur: 6.5,
    text: 'For every tweet written, roughly seventeen timelines are read. This system is read heavy — so whatever we build must make reads cheap.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 28.5, dur: 1.5, ease: ease.move });
  tl.tween(ratioU, 1, { at: 29.4, dur: 0.6, ease: ease.pop });
  tl.hold(34.8, 0.5);

  // — Beat 6 · the fanout amplifier —
  tl.caption({
    at: 35.3,
    dur: 7.7,
    text: 'And an amplifier hides inside the writes. The average tweet is delivered to ten followers — so six thousand writes become sixty thousand deliveries a second.',
  });
  tl.tween(ratioU, 0, { at: 35.5, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_PRISM, { at: 35.7, dur: 1.6, ease: ease.move });
  tl.tween(prismU, 1, { at: 36.6, dur: 0.7, ease: ease.pop });
  tl.tween(fanU, 1, { at: 37.6, dur: 1.4, ease: ease.move });
  tl.hold(43.0, 0.6);

  // — Beat 7 · the real question —
  tl.caption({
    at: 43.6,
    dur: 6.2,
    text: 'So the real question underneath the design is about timing: when is a timeline actually built? There are exactly two choices.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 43.8, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 45.2, dur: 1.4, ease: ease.move });

  // — Beat 8 · two doors —
  tl.caption({
    at: 50.2,
    dur: 8.2,
    text: 'Build it at the moment someone asks — that is fan-out on read. Or build it before anyone asks — that is fan-out on write. We will walk through both doors.',
  });
  tl.tween(doorsU, 1, { at: 50.6, dur: 1.0, ease: ease.pop });
  tl.hold(58.8, 1.6);

  return {
    tl,
    cam,
    qU,
    phoneU,
    phoneDim,
    feedU,
    statsU,
    writeU,
    readU,
    ratioU,
    prismU,
    fanU,
    flow,
    dimU,
    doorsU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function computeParticles(s: SceneState) {
  const t = s.get(scene.flow) * DUR;
  const wU = s.get(scene.writeU);
  const rU = s.get(scene.readU);
  const fU = s.get(scene.fanU);
  const dim = 1 - 0.86 * s.get(scene.dimU);
  const pts: { x: number; y: number; r: number; alpha: number; color: string }[] = [];

  if (wU > 0.01) {
    for (const tr of WRITE_TRACKS) {
      const y = yOf(tr, t);
      pts.push({ x: tr.x, y, r: tr.r, alpha: 0.85 * wU * dim, color: colors.ACCENT });
      if (fU > 0.01 && y > PRISM_Y) {
        const depth = (y - PRISM_Y) / (STREAM_BOT - PRISM_Y);
        for (const sp of FAN_SPREAD) {
          pts.push({
            x: tr.x + sp * depth * 2.2,
            y,
            r: tr.r * 0.62,
            alpha: 0.55 * fU * wU * dim,
            color: colors.TEAL,
          });
        }
      }
    }
  }
  if (rU > 0.01) {
    for (const tr of READ_TRACKS) {
      pts.push({ x: tr.x, y: yOf(tr, t), r: tr.r * 0.85, alpha: 0.6 * rU * dim, color: colors.WARM });
    }
  }
  return pts;
}

function Spout({ x, w, label, color, u }: { x: number; w: number; label: string; color: string; u: number }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={STREAM_TOP - 26} width={w} height={14} rx={7} fill={color} opacity={0.75} />
      <text x={x} y={STREAM_TOP - 38} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

function Bin({ x, w, u }: { x: number; w: number; u: number }) {
  if (u <= 0.01) return null;
  return (
    <path
      d={`M${x - w / 2} ${STREAM_BOT} L${x - w / 2} ${STREAM_BOT + 22} L${x + w / 2} ${STREAM_BOT + 22} L${x + w / 2} ${STREAM_BOT}`}
      fill="none"
      stroke={colors.MUTED}
      strokeWidth={2.5}
      opacity={0.7 * u}
    />
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const qU = s.get(scene.qU);
  const phoneU = s.get(scene.phoneU);
  const phoneDim = s.get(scene.phoneDim);
  const feedU = s.get(scene.feedU);
  const statsU = s.get(scene.statsU);
  const writeU = s.get(scene.writeU);
  const readU = s.get(scene.readU);
  const ratioU = s.get(scene.ratioU);
  const prismU = s.get(scene.prismU);
  const fanU = s.get(scene.fanU);
  const dimU = s.get(scene.dimU);
  const doorsU = s.get(scene.doorsU);
  const streamDim = 1 - 0.86 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the question, pinned at the top */}
        <g opacity={qU * (1 - 0.85 * dimU)}>
          <text x={640} y={72} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={700}>
            Design the home timeline
          </text>
          <text x={640} y={98} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={colors.font.mono}>
            solutions/system_design/twitter/README.md
          </text>
        </g>

        {/* the product: one phone, one feed */}
        <g opacity={phoneU * phoneDim}>
          <rect
            x={PHONE.x - PHONE.w / 2}
            y={PHONE.y - PHONE.h / 2}
            width={PHONE.w}
            height={PHONE.h}
            rx={26}
            fill={colors.PANEL}
            stroke={colors.MUTED}
            strokeWidth={2}
          />
          <text x={PHONE.x} y={PHONE.y - PHONE.h / 2 + 34} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            home timeline
          </text>
          {Array.from({ length: CARD_N }, (_, i) => {
            const u = clamp01(feedU * (CARD_N + 1) - i);
            const e = ease.enter(u);
            const cy = PHONE.y - PHONE.h / 2 + 66 + i * 84 + 14 * (1 - e);
            return (
              <g key={i} opacity={e}>
                <rect x={PHONE.x - PHONE.w / 2 + 14} y={cy} width={PHONE.w - 28} height={70} rx={10} fill={colors.BG} stroke={colors.GRID} />
                <circle cx={PHONE.x - PHONE.w / 2 + 36} cy={cy + 22} r={11} fill={[colors.ACCENT, colors.POSITIVE, colors.SECONDARY, colors.WARM][i]} opacity={0.85} />
                <rect x={PHONE.x - PHONE.w / 2 + 56} y={cy + 14} width={(PHONE.w - 92) * 0.9} height={8} rx={4} fill={colors.MUTED} opacity={0.6} />
                <rect x={PHONE.x - PHONE.w / 2 + 56} y={cy + 30} width={(PHONE.w - 92) * 0.65} height={8} rx={4} fill={colors.MUTED} opacity={0.35} />
                <rect x={PHONE.x - PHONE.w / 2 + 22} y={cy + 48} width={(PHONE.w - 58) * 0.8} height={7} rx={3.5} fill={colors.MUTED} opacity={0.25} />
              </g>
            );
          })}
        </g>

        {/* scale counters */}
        <g opacity={statsU * (1 - 0.85 * dimU)}>
          <text x={200} y={132} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={700}>
            100,000,000
          </text>
          <text x={200} y={154} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            active users
          </text>
          <text x={1080} y={132} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={700}>
            500,000,000
          </text>
          <text x={1080} y={154} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            tweets per day
          </text>
        </g>

        {/* the two firehoses */}
        <ParticleCloud state={s} compute={computeParticles} />
        <g opacity={streamDim}>
          <Spout x={WRITE_X} w={110} label="writes" color={colors.ACCENT} u={writeU} />
          <Bin x={WRITE_X} w={fanU > 0.01 ? 150 + 90 * fanU : 150} u={writeU} />
          <g opacity={writeU}>
            <text x={WRITE_X} y={596} textAnchor="middle" fill={colors.ACCENT} fontSize={19} fontWeight={700} opacity={1 - fanU}>
              ~6,000 tweets / sec
            </text>
            <text x={WRITE_X} y={596} textAnchor="middle" fill={colors.TEAL} fontSize={19} fontWeight={700} opacity={fanU}>
              ~60,000 deliveries / sec
            </text>
          </g>
          <Spout x={READ_X} w={280} label="timeline reads" color={colors.WARM} u={readU} />
          <Bin x={READ_X} w={310} u={readU} />
          <g opacity={readU}>
            <text x={READ_X} y={596} textAnchor="middle" fill={colors.WARM} fontSize={19} fontWeight={700}>
              ~100,000 reads / sec
            </text>
          </g>

          {/* the fanout prism */}
          {prismU > 0.01 && (
            <g opacity={prismU} transform={`translate(${WRITE_X}, ${PRISM_Y}) scale(${0.8 + 0.2 * prismU})`}>
              <path d="M-70 -16 L70 -16 L96 16 L-96 16 Z" fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={2} />
              <text y={5} textAnchor="middle" fill={colors.TEAL} fontSize={15} fontWeight={600}>
                fanout ×10
              </text>
            </g>
          )}
        </g>

        {/* the 17:1 ratio chip */}
        {ratioU > 0.01 && (
          <g opacity={ratioU} transform={`translate(640, 300) scale(${0.85 + 0.15 * ratioU})`}>
            <rect x={-150} y={-32} width={300} height={64} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
            <text y={-2} textAnchor="middle" fill={colors.WARM} fontSize={22} fontWeight={700}>
              ≈ 17 reads
            </text>
            <text y={20} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              for every write
            </text>
          </g>
        )}

        {/* the two doors */}
        {doorsU > 0.01 && (
          <g opacity={doorsU}>
            {[
              { x: 400, title: 'fan-out on read', sub: 'build it when asked', color: colors.WARM, tag: 'pull' },
              { x: 880, title: 'fan-out on write', sub: 'build it before the ask', color: colors.ACCENT, tag: 'push' },
            ].map((d, i) => {
              const u = clamp01(doorsU * 1.6 - i * 0.6);
              const e = ease.pop(u);
              return (
                <g key={d.tag} transform={`translate(${d.x}, ${370 + 16 * (1 - e)})`} opacity={u}>
                  <rect x={-165} y={-92} width={330} height={184} rx={18} fill={colors.PANEL} stroke={d.color} strokeWidth={2.5} />
                  <text y={-38} textAnchor="middle" fill={d.color} fontSize={17} fontWeight={600} fontFamily={colors.font.mono}>
                    {d.tag}
                  </text>
                  <text y={4} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={700}>
                    {d.title}
                  </text>
                  <text y={40} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
                    {d.sub}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
