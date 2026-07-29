// The Celebrity Problem
//
// Backing: solutions/system_design/twitter/README.md — "Step 4: Scale the
// design": the Fanout Service is a potential bottleneck; users with millions
// of followers take minutes to fan out; race conditions with @replies
// (mitigated by re-ordering at serve time); the fix is to avoid fanning out
// highly-followed users and instead merge their tweets into the home-timeline
// results at read time. Average fanout is 10 deliveries per tweet
// ("Constraints and assumptions").
//
// Machine: a highly-followed account against a 700-dot follower murmuration.
// The fan-out wavefront crawls (a timer + an insert counter that will not
// finish); a reply overtakes its original in a mini race; then the hybrid —
// the cloud re-forms into readers (formation lerp), the celebrity's tweets
// stack in ONE column, and a zipper merge interleaves cached entries with
// celebrity tweets into a single time-ordered feed. Ends on the series recap.
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
import type { CameraState, SceneState } from '../../core';
import { Packet, ParticleCloud, TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The follower murmuration — formation A swarms around the celebrity;
// formation B re-forms as the readers on the right. Seeded, precomputed.
// ---------------------------------------------------------------------------

const CELEB = { x: 190, y: 250 };
const N_DOTS = 700;
const rand = mulberry32(20260718);

interface Dot {
  ax: number; ay: number; // formation A — the follower cloud
  bx: number; by: number; // formation B — the readers
  litAt: number;          // fan-out wavefront order, 0..1
}

const DOTS: Dot[] = Array.from({ length: N_DOTS }, () => {
  // A: an elongated murmuration blob to the celebrity's right
  const t = rand() * Math.PI * 2;
  const rr = Math.sqrt(rand());
  const ax = 800 + Math.cos(t) * 380 * rr;
  const ay = 330 + Math.sin(t) * 235 * rr * (0.7 + 0.3 * Math.sin(t * 2));
  // B: a tighter reader crowd, lower right
  const t2 = rand() * Math.PI * 2;
  const r2 = Math.sqrt(rand());
  return {
    ax, ay,
    bx: 1010 + Math.cos(t2) * 200 * r2,
    by: 430 + Math.sin(t2) * 150 * r2,
    litAt: rand(),
  };
});

const FOLLOWER_TARGET = 5000000;

// The reply-race panel.
const RACE = { x: 430, y: 340, w: 470, h: 210 } as const;
const RACE_FEED_X = RACE.x + RACE.w - 130;

// The merge stage.
const COL = { x: 200, y: 120, w: 130, h: 34, gap: 10 } as const; // celebrity's own column
const CACHED = { x: 560, y: 200, w: 130, h: 34, gap: 10 } as const; // your cached list
const FEED = { x: 1010, y: 210, w: 200, h: 36, gap: 10 } as const; // the merged feed

interface MergeCell {
  time: string;
  from: 'cache' | 'celeb';
  srcIdx: number;
}
// Interleaved in true time order — the zipper.
const MERGED: MergeCell[] = [
  { time: '09:41', from: 'cache', srcIdx: 0 },
  { time: '09:43', from: 'celeb', srcIdx: 0 },
  { time: '09:44', from: 'cache', srcIdx: 1 },
  { time: '09:47', from: 'cache', srcIdx: 2 },
  { time: '09:50', from: 'celeb', srcIdx: 1 },
  { time: '09:52', from: 'cache', srcIdx: 3 },
];
const cellSrc = (c: MergeCell) =>
  c.from === 'cache'
    ? { x: CACHED.x + CACHED.w / 2, y: CACHED.y + c.srcIdx * (CACHED.h + CACHED.gap) + CACHED.h / 2 }
    : { x: COL.x + COL.w / 2, y: COL.y + c.srcIdx * (COL.h + COL.gap) + COL.h / 2 };
const cellDst = (i: number) => ({ x: FEED.x + FEED.w / 2, y: FEED.y + i * (FEED.h + FEED.gap) + FEED.h / 2 });

// camera marks
const CAM_CELEB: CameraState = { x: 430, y: 300, k: 1.25 };
const CAM_RACE: CameraState = { x: 665, y: 430, k: 1.45 };
const CAM_MERGE: CameraState = { x: 760, y: 330, k: 1.15 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const celebU = tl.channel('celebU', 0);
  const cloudU = tl.channel('cloudU', 0);
  const wave = tl.channel('wave', 0);
  const fanN = tl.channel('fanN', 0);
  const raceU = tl.channel('raceU', 0);
  const raceRun = tl.channel('raceRun', 0);
  const flagU = tl.channel('flagU', 0);
  const cancelU = tl.channel('cancelU', 0);
  const form = tl.channel('form', 0);
  const zoneU = tl.channel('zoneU', 0);
  const colU = tl.channel('colU', 0);
  const mergeU = tl.channel('mergeU', 0);
  const winU = tl.channel('winU', 0);
  const dimU = tl.channel('dimU', 0);
  const recapU = tl.channel('recapU', 0);

  // — Beat 1 · the hidden assumption —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'Chapter two hid an assumption: fanning out is cheap because the average tweet reaches about ten followers.',
  });
  tl.tween(cam, CAM_CELEB, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(celebU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(cloudU, 1, { at: 2.2, dur: 2.4, ease: ease.draw });

  // — Beat 2 · millions of inserts —
  tl.caption({
    at: 7.1,
    dur: 7,
    text: 'Then a celebrity tweets. Millions of followers means millions of inserts, and one tweet can take minutes to finish delivering.',
  });
  tl.tween(wave, 0.34, { at: 8.0, dur: 13, ease: ease.linear });
  tl.tween(fanN, FOLLOWER_TARGET * 0.34, { at: 8.0, dur: 13, ease: ease.linear });
  tl.hold(14.6, 0.7);

  // — Beat 3 · the reply race —
  tl.caption({
    at: 15.3,
    dur: 7,
    text: 'Minutes are enough to break conversations: a reply can finish fanning out before the original, so feeds show an answer with no question.',
  });
  tl.tween(cam, CAM_RACE, { at: 15.5, dur: 1.4, ease: ease.move });
  tl.tween(raceU, 1, { at: 15.9, dur: 0.8, ease: ease.enter });
  tl.tween(raceRun, 1, { at: 17.0, dur: 3.6, ease: ease.linear });
  tl.tween(flagU, 1, { at: 20.8, dur: 0.6, ease: ease.pop });
  tl.hold(22.7, 0.7);

  // — Beat 4 · the hybrid: the many —
  tl.caption({
    at: 23.4,
    dur: 6.5,
    text: 'The fix is a hybrid. Most accounts keep fanning out on write, exactly as before — their audiences are small enough.',
  });
  tl.tween(cam, CAM_WIDE, { at: 23.6, dur: 1.6, ease: ease.move });
  tl.tween(raceU, 0, { at: 23.6, dur: 1.0, ease: ease.move });
  tl.tween(cancelU, 1, { at: 24.2, dur: 1.6, ease: ease.move });
  tl.tween(zoneU, 1, { at: 25.4, dur: 1.2, ease: ease.enter });
  tl.hold(29.3, 0.7);

  // — Beat 5 · the few, uncopied —
  tl.caption({
    at: 30.0,
    dur: 7,
    text: 'But highly followed accounts skip the fan-out entirely. Their tweets stay in one searchable place instead of being copied millions of times.',
  });
  tl.tween(colU, 1, { at: 31.0, dur: 2.2, ease: ease.draw });
  tl.tween(form, 1, { at: 31.6, dur: 3.4, ease: ease.move });
  tl.hold(36.4, 0.7);

  // — Beat 6 · the zipper merge —
  tl.caption({
    at: 37.1,
    dur: 7.5,
    text: 'At read time, the timeline service merges the two: your precomputed list, plus a live lookup of the stars you follow, re-ordered at serve time.',
  });
  tl.tween(cam, CAM_MERGE, { at: 37.3, dur: 1.5, ease: ease.move });
  tl.tween(mergeU, 1, { at: 38.4, dur: 5.2, ease: ease.linear });
  tl.hold(44.9, 0.7);

  // — Beat 7 · everyone wins —
  tl.caption({
    at: 45.6,
    dur: 6,
    text: 'Everyone wins the part they need: writes never stall, reads stay near constant, and only the loudest voices cost a merge.',
  });
  tl.tween(winU, 1, { at: 46.6, dur: 0.9, ease: ease.enter });
  tl.hold(51.9, 0.7);

  // — Beat 8 · recap —
  tl.caption({
    at: 52.6,
    dur: 8.5,
    text: "That's the social feed, solved. Written once and read relentlessly — so fan out to the many at write time, cache every feed, and merge in the few when someone finally looks.",
  });
  tl.tween(cam, CAM_WIDE, { at: 52.8, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 53.2, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 1, { at: 54.6, dur: 1.4, ease: ease.enter });
  tl.hold(61.1, 1.8);

  return {
    tl, cam, celebU, cloudU, wave, fanN, raceU, raceRun, flagU,
    cancelU, form, zoneU, colU, mergeU, winU, dimU, recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const fmt = (n: number): string => Math.floor(n).toLocaleString('en-US');

function computeCloud(s: SceneState) {
  const cloudU = s.get(scene.cloudU);
  const wave = s.get(scene.wave);
  const cancelU = s.get(scene.cancelU);
  const form = s.get(scene.form);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const raceDim = 1 - 0.6 * s.get(scene.raceU);
  return DOTS.map((d, k) => {
    const appear = clamp01(cloudU * 1.6 - (k / N_DOTS) * 0.6);
    const lit = clamp01((wave - d.litAt) * 9) * (1 - cancelU);
    const settled = 1 - 0.5 * form; // readers sit quieter than the swarm
    return {
      x: lerp(d.ax, d.bx, form),
      y: lerp(d.ay, d.by, form),
      r: 1.9 + 2.1 * lit,
      alpha: appear * (0.14 + 0.62 * lit + 0.1 * form) * dim * raceDim * settled,
      color: lit > 0.03 ? colors.WARM : colors.MUTED,
    };
  });
}

function MiniStack({ x, y, w, h, gap, items, u, color, label }: {
  x: number; y: number; w: number; h: number; gap: number;
  items: string[]; u: number; color: string; label: string;
}) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      <text x={x + w / 2} y={y - 12} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
        {label}
      </text>
      {items.map((it, i) => (
        <g key={i} opacity={clamp01(u * items.length - i)}>
          <rect x={x} y={y + i * (h + gap)} width={w} height={h} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.2} />
          <text x={x + w / 2} y={y + i * (h + gap) + h / 2 + 4} textAnchor="middle" fill={color} fontSize={12} fontFamily="ui-monospace, monospace">
            {it}
          </text>
        </g>
      ))}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const celebU = s.get(scene.celebU);
  const wave = s.get(scene.wave);
  const fanN = s.get(scene.fanN);
  const raceU = s.get(scene.raceU);
  const raceRun = s.get(scene.raceRun);
  const flagU = s.get(scene.flagU);
  const cancelU = s.get(scene.cancelU);
  const form = s.get(scene.form);
  const zoneU = s.get(scene.zoneU);
  const colU = s.get(scene.colU);
  const mergeU = s.get(scene.mergeU);
  const winU = s.get(scene.winU);
  const dimU = s.get(scene.dimU);
  const recapU = s.get(scene.recapU);

  const faded = 1 - 0.85 * dimU;
  const waveActive = wave > 0 && cancelU < 1;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the follower murmuration / reader crowd */}
        <ParticleCloud state={s} compute={computeCloud} />
        <g opacity={clamp01(form * 2 - 1) * faded}>
          <text x={1010} y={620} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
            the same crowd — now just readers
          </text>
        </g>

        {/* the highly-followed account */}
        <g opacity={celebU * faded}>
          <circle cx={CELEB.x} cy={CELEB.y} r={26} fill={colors.WARM} opacity={0.16} />
          <circle cx={CELEB.x} cy={CELEB.y} r={15} fill={colors.WARM} />
          <text x={CELEB.x} y={CELEB.y + 5} textAnchor="middle" fill={colors.BG} fontSize={14} fontWeight={800}>
            ★
          </text>
          <text x={CELEB.x} y={CELEB.y + 44} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
            highly-followed user
          </text>
          <text x={CELEB.x} y={CELEB.y + 62} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
            followers: 5,000,000
          </text>
        </g>

        {/* the crawling fan-out — a clock and a counter that will not finish */}
        {waveActive && (
          <g opacity={(1 - cancelU) * faded}>
            <TimerArc cx={CELEB.x} cy={CELEB.y - 84} r={24} u={1 - wave} color={colors.NEGATIVE} />
            <text x={CELEB.x} y={CELEB.y - 122} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>
              minutes of delivery
            </text>
            <rect x={CELEB.x - 80} y={CELEB.y + 84} width={160} height={52} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.2} />
            <text x={CELEB.x} y={CELEB.y + 108} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={700} fontFamily="ui-monospace, monospace">
              {fmt(fanN)}
            </text>
            <text x={CELEB.x} y={CELEB.y + 126} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
              inserts… of 5,000,000
            </text>
          </g>
        )}

        {/* the reply race */}
        {raceU > 0.01 && (
          <g opacity={raceU}>
            <rect x={RACE.x} y={RACE.y} width={RACE.w} height={RACE.h} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={RACE.x + 18} y={RACE.y + 28} fill={colors.TEXT} fontSize={14} fontWeight={600}>
              the race
            </text>
            {/* original: millions of inserts, crawling */}
            <text x={RACE.x + 18} y={RACE.y + 62} fill={colors.WARM} fontSize={12}>
              original — fanning out to millions
            </text>
            <line x1={RACE.x + 18} y1={RACE.y + 80} x2={RACE_FEED_X - 20} y2={RACE.y + 80} stroke={colors.GRID} strokeWidth={1.5} />
            <Packet from={{ x: RACE.x + 18, y: RACE.y + 80 }} to={{ x: RACE_FEED_X - 20, y: RACE.y + 80 }} u={raceRun * 0.5} r={6} color={colors.WARM} />
            {/* the reply: ten followers, done instantly */}
            <text x={RACE.x + 18} y={RACE.y + 120} fill={colors.ACCENT} fontSize={12}>
              a reply — ten followers, done at once
            </text>
            <line x1={RACE.x + 18} y1={RACE.y + 138} x2={RACE_FEED_X - 20} y2={RACE.y + 138} stroke={colors.GRID} strokeWidth={1.5} />
            <Packet from={{ x: RACE.x + 18, y: RACE.y + 138 }} to={{ x: RACE_FEED_X - 20, y: RACE.y + 138 }} u={clamp01(raceRun * 1.9)} r={6} color={colors.ACCENT} />
            {/* one follower's feed: the answer lands above a missing question */}
            <rect x={RACE_FEED_X} y={RACE.y + 56} width={108} height={34} rx={7} fill={clamp01(raceRun * 1.9) >= 1 ? colors.ACCENT : colors.PANEL} opacity={0.9} stroke={colors.GRID} />
            <text x={RACE_FEED_X + 54} y={RACE.y + 77} textAnchor="middle" fill={clamp01(raceRun * 1.9) >= 1 ? colors.BG : colors.MUTED} fontSize={11} fontWeight={600}>
              {clamp01(raceRun * 1.9) >= 1 ? 'the reply' : 'feed slot'}
            </text>
            <rect x={RACE_FEED_X} y={RACE.y + 98} width={108} height={34} rx={7} fill="none" stroke={colors.WARM} strokeDasharray="5 4" opacity={0.8} />
            <text x={RACE_FEED_X + 54} y={RACE.y + 119} textAnchor="middle" fill={colors.WARM} fontSize={10} fontStyle="italic">
              original… missing
            </text>
            <g opacity={flagU}>
              <circle cx={RACE_FEED_X + 118} cy={RACE.y + 73} r={11} fill={colors.NEGATIVE} />
              <text x={RACE_FEED_X + 118} y={RACE.y + 78} textAnchor="middle" fill={colors.BG} fontSize={14} fontWeight={800}>
                !
              </text>
            </g>
          </g>
        )}

        {/* hybrid zone chip — the many keep fan-out on write */}
        <g opacity={zoneU * faded * (1 - 0.5 * clamp01(mergeU * 3))}>
          <rect x={430} y={95} width={330} height={44} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.2} />
          <text x={595} y={113} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontWeight={600}>
            most accounts: fan out on write
          </text>
          <text x={595} y={130} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
            average audience ≈ 10 — cheap, as in chapter two
          </text>
        </g>

        {/* the celebrity's own column — one searchable place */}
        <MiniStack
          x={COL.x}
          y={COL.y}
          w={COL.w}
          h={COL.h}
          gap={COL.gap}
          items={['★ 09:43', '★ 09:50']}
          u={colU * faded}
          color={colors.WARM}
          label="their tweets — stored once"
        />

        {/* your cached list — as chapter three left it */}
        <MiniStack
          x={CACHED.x}
          y={CACHED.y}
          w={CACHED.w}
          h={CACHED.h}
          gap={CACHED.gap}
          items={['09:41', '09:44', '09:47', '09:52']}
          u={clamp01(mergeU * 4) * faded}
          color={colors.ACCENT}
          label="your cached list"
        />

        {/* the zipper merge into one time-ordered feed */}
        {mergeU > 0 && (
          <g opacity={faded}>
            <text x={FEED.x + FEED.w / 2} y={FEED.y - 26} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={600}>
              your feed — merged at serve time
            </text>
            {MERGED.map((c, i) => {
              const u = clamp01(mergeU * (MERGED.length / 2 + 1) - i / 2);
              const src = cellSrc(c);
              const dst = cellDst(i);
              const x = lerp(src.x, dst.x, u);
              const y = lerp(src.y, dst.y, u);
              const color = c.from === 'cache' ? colors.ACCENT : colors.WARM;
              return (
                <g key={i} opacity={clamp01(u * 4)}>
                  <rect x={x - FEED.w / 2} y={y - FEED.h / 2} width={FEED.w} height={FEED.h} rx={8} fill={colors.PANEL} stroke={color} strokeWidth={1.4} opacity={0.95} />
                  <text x={x - FEED.w / 2 + 14} y={y + 4} fill={color} fontSize={12} fontFamily="ui-monospace, monospace">
                    {c.from === 'celeb' ? '★ ' : ''}{c.time}
                  </text>
                  <text x={x + FEED.w / 2 - 14} y={y + 4} textAnchor="end" fill={colors.MUTED} fontSize={10}>
                    {c.from === 'cache' ? 'cached' : 'merged in'}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* everyone wins — chips */}
        <g opacity={winU * faded}>
          <rect x={430} y={560} width={460} height={40} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={660} y={585} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
            writes never stall · reads stay near constant
          </text>
        </g>

        {/* — the recap, on a quiet stage — */}
        <g opacity={recapU}>
          <rect x={290} y={150} width={700} height={170} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={210} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700}>
            The Social Feed, solved
          </text>
          <text x={640} y={246} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            written once · read relentlessly
          </text>
          <text x={640} y={284} textAnchor="middle" fill={colors.ACCENT} fontSize={14}>
            fan out to the many — cache every feed — merge in the few
          </text>

          {/* three mini glyphs: the asymmetry, the burst, the grab-and-merge */}
          <g transform="translate(400, 420)">
            <rect x={-14} y={-40} width={16} height={40} fill={colors.SECONDARY} opacity={0.8} rx={3} />
            <rect x={10} y={-88} width={16} height={88} fill={colors.ACCENT} opacity={0.8} rx={3} />
            <text x={6} y={26} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              reads ≫ writes
            </text>
          </g>
          <g transform="translate(640, 420)">
            <circle cx={-30} cy={-44} r={7} fill={colors.ACCENT} />
            {[-80, -62, -44, -26, -8].map((y, i) => (
              <line key={i} x1={-24} y1={-44} x2={34} y2={y} stroke={colors.ACCENT} strokeWidth={1.6} opacity={0.7} />
            ))}
            <text x={0} y={26} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              fan out on write
            </text>
          </g>
          <g transform="translate(880, 420)">
            {[0, 1, 2].map((i) => (
              <rect key={i} x={-45 + i * 32} y={-58} width={26} height={22} rx={5} fill={i === 1 ? colors.WARM : colors.ACCENT} opacity={0.85} />
            ))}
            <path d="M -32 -30 L -32 -12 M 0 -30 L 0 -12 M 32 -30 L 32 -12" stroke={colors.MUTED} strokeWidth={1.6} fill="none" />
            <rect x={-52} y={-12} width={104} height={16} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={1.4} />
            <text x={0} y={26} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              merge at serve time
            </text>
          </g>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
