// Read Heavy: Users+++ and the cache that makes servers stateless
//
// Backed by: solutions/system_design/scaling_aws/README.md — "Users+++":
// benchmarks show the system is read-heavy (100:1 with writes) and MySQL
// suffers under the read load. Moves: try the MySQL cache first, then add a
// Memory Cache such as ElastiCache for frequently accessed content (memory
// read ~250 µs vs SSD 4x vs disk 80x); move session data out of the web
// servers into the cache so the web servers become STATELESS and can
// autoscale; add MySQL Read Replicas (with their own load balancers) to
// relieve the write master, and add logic to separate reads from writes.
//
// ONE machine: a read flood against the database's health bar. The memory
// cache slides in and visibly absorbs the flood; session chips leave the web
// servers (they turn identical/stateless); read replicas fan out under the
// master; and the write path stays a thin, calm line throughout.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

const WEB = [
  { x: 330, y: 220 },
  { x: 330, y: 360 },
  { x: 330, y: 500 },
] as const;
const CACHE = { x: 680, y: 250 } as const;
const MASTER = { x: 1000, y: 300 } as const;
const REPLICAS = [
  { x: 940, y: 450 },
  { x: 1090, y: 450 },
] as const;

const rand = mulberry32(20260722);
const N_READS = 40;
const READS = Array.from({ length: N_READS }, (_, i) => ({
  lane: i % 3,
  delay: (i / N_READS) * 0.9,
  toReplica: Math.floor(rand() * 2),
}));

const CAM_DB: CameraState = { x: 950, y: 330, k: 1.25 };
const CAM_CACHE: CameraState = { x: 680, y: 300, k: 1.3 };
const CAM_WEB: CameraState = { x: 420, y: 360, k: 1.25 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rigU: ChannelRef<number>;
  floodU: ChannelRef<number>;
  hpU: ChannelRef<number>;
  cacheU: ChannelRef<number>;
  absorbU: ChannelRef<number>;
  sessU: ChannelRef<number>;
  replU: ChannelRef<number>;
  splitU: ChannelRef<number>;
  calmU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rigU = tl.channel('rigU', 0); // web fleet + master
  const floodU = tl.channel('floodU', 0); // the read flood, phase 1 (all to db)
  const hpU = tl.channel('hpU', 0); // master health drains
  const cacheU = tl.channel('cacheU', 0); // elasticache slides in
  const absorbU = tl.channel('absorbU', 0); // flood phase 2 (mostly cache)
  const sessU = tl.channel('sessU', 0); // session chips → cache
  const replU = tl.channel('replU', 0); // read replicas
  const splitU = tl.channel('splitU', 0); // read/write split labels
  const calmU = tl.channel('calmU', 0); // master health recovers
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the ratio —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'The next profile run finds a lopsided truth: for every write, this system serves a hundred reads. And all one hundred are lining up at the same database.',
  });
  tl.tween(rigU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.hold(7.0, 0.5);

  // — Beat 2 · the flood —
  tl.caption({
    at: 7.5,
    dur: 6.5,
    text: 'Watch the read traffic pour through the web tier straight into the write master. Its health drains request by request. This is what a bottleneck looks like from above.',
  });
  tl.tween(cam, CAM_DB, { at: 7.7, dur: 1.4, ease: ease.move });
  tl.tween(floodU, 1, { at: 8.2, dur: 4.6, ease: ease.linear });
  tl.tween(hpU, 1, { at: 8.6, dur: 4.6, ease: ease.linear });
  tl.hold(14.5, 0.5);

  // — Beat 3 · try the free fix first —
  tl.caption({
    at: 15.0,
    dur: 5.5,
    text: 'Discipline first: before buying anything, tune the database and its own internal cache. Sometimes that alone relieves the bottleneck. Here, it is not enough.',
  });
  tl.hold(20.5, 0.5);

  // — Beat 4 · the memory cache —
  tl.caption({
    at: 21.0,
    dur: 7,
    text: 'So in slides a memory cache. Frequently read content now answers from memory in about two hundred fifty microseconds, four times faster than solid state, eighty times faster than disk.',
  });
  tl.tween(cam, CAM_CACHE, { at: 21.2, dur: 1.4, ease: ease.move });
  tl.tween(cacheU, 1, { at: 21.8, dur: 1.2, ease: ease.enter });
  tl.tween(absorbU, 1, { at: 23.4, dur: 4.0, ease: ease.linear });
  tl.tween(calmU, 0.6, { at: 24.0, dur: 3.0, ease: ease.move });
  tl.hold(28.5, 0.5);

  // — Beat 5 · sessions move out —
  tl.caption({
    at: 29.0,
    dur: 7,
    text: 'The cache gets a second job: holding user sessions. Once the web servers stop remembering anything, they become identical and disposable, and that word, stateless, is what makes autoscaling possible later.',
  });
  tl.tween(cam, CAM_WEB, { at: 29.2, dur: 1.4, ease: ease.move });
  tl.tween(sessU, 1, { at: 30.2, dur: 2.8, ease: ease.linear });
  tl.hold(36.0, 0.5);

  // — Beat 6 · read replicas —
  tl.caption({
    at: 36.5,
    dur: 7,
    text: 'For the reads that still miss the cache, the database grows read replicas. The web tier learns one new rule: writes go to the master, reads go to the replicas.',
  });
  tl.tween(cam, CAM_DB, { at: 36.7, dur: 1.4, ease: ease.move });
  tl.tween(replU, 1, { at: 37.4, dur: 1.4, ease: ease.enter });
  tl.tween(splitU, 1, { at: 39.6, dur: 1.0, ease: ease.enter });
  tl.tween(calmU, 1, { at: 40.0, dur: 2.0, ease: ease.move });
  tl.hold(43.5, 0.5);

  // — Beat 7 · the master exhales —
  tl.caption({
    at: 44.0,
    dur: 6,
    text: 'And the master exhales. It is back to doing the one job only it can do: accepting writes. Everything else has been delegated to memory and to copies.',
  });
  tl.hold(50.0, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 50.5,
    dur: 7,
    text: 'Cache the hot reads, evict state from the servers, replicate for the rest. One chapter remains: teaching this whole city to grow and shrink by itself.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.7, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.3, dur: 1.4, ease: ease.move });
  tl.hold(57.5, 1.5);

  return { tl, cam, rigU, floodU, hpU, cacheU, absorbU, sessU, replU, splitU, calmU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Node({ x, y, w = 150, h = 56, title, sub, stroke = colors.GRID, opacity = 1 }: {
  x: number; y: number; w?: number; h?: number; title: string; sub?: string; stroke?: string; opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill={colors.PANEL} stroke={stroke} strokeWidth={1.3} />
      <text x={x} y={y - 1} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
        {title}
      </text>
      {sub && (
        <text x={x} y={y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily="ui-monospace, monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rigU = s.get(scene.rigU);
  const floodU = s.get(scene.floodU);
  const hpU = s.get(scene.hpU);
  const cacheU = s.get(scene.cacheU);
  const absorbU = s.get(scene.absorbU);
  const sessU = s.get(scene.sessU);
  const replU = s.get(scene.replU);
  const splitU = s.get(scene.splitU);
  const calmU = s.get(scene.calmU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;
  const health = clamp01(1 - hpU * 0.8 + calmU * 0.75);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- web fleet ---- */}
        {WEB.map((w, i) => (
          <g key={i} opacity={rigU * dimAll}>
            <Node x={w.x} y={w.y} w={170} h={70} title={sessU > 0.9 ? 'Web Server · stateless' : 'Web Server'} sub={sessU > 0.9 ? 'identical, disposable' : 'holds sessions'} stroke={sessU > 0.9 ? colors.POSITIVE : colors.TEXT} />
            {/* session chip inside until it flies out */}
            {(() => {
              const u = clamp01(sessU * 2 - i * 0.4);
              if (u >= 1) return null;
              const x = lerp(w.x + 55, CACHE.x - 40, u);
              const y = lerp(w.y - 18, CACHE.y + 20, u) - Math.sin(u * Math.PI) * 30;
              return (
                <g opacity={dimAll}>
                  <rect x={x - 30} y={y - 10} width={60} height={20} rx={5} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.1} />
                  <text x={x} y={y + 4} textAnchor="middle" fill={colors.SECONDARY} fontSize={8.5} fontFamily="ui-monospace, monospace">
                    session
                  </text>
                </g>
              );
            })()}
          </g>
        ))}

        {/* ---- the memory cache ---- */}
        <g opacity={cacheU * dimAll}>
          <Node x={CACHE.x} y={CACHE.y} w={190} h={80} title="Memory Cache" sub="ElastiCache · ~250 µs" stroke={colors.WARM} />
        </g>

        {/* ---- master + replicas ---- */}
        <g opacity={rigU * dimAll}>
          <Node x={MASTER.x} y={MASTER.y} w={180} h={72} title="MySQL Write Master" sub="the only writer" stroke={health < 0.45 ? colors.NEGATIVE : colors.POSITIVE} />
          {/* health bar */}
          <rect x={MASTER.x - 80} y={MASTER.y - 58} width={160} height={10} rx={4} fill={colors.BG} stroke={colors.GRID} />
          <rect x={MASTER.x - 80} y={MASTER.y - 58} width={160 * health} height={10} rx={4} fill={health < 0.45 ? colors.NEGATIVE : health < 0.75 ? colors.WARM : colors.POSITIVE} />
        </g>
        {REPLICAS.map((r, i) => (
          <g key={i} opacity={replU * dimAll}>
            <Node x={r.x} y={r.y} w={140} h={56} title="Read Replica" stroke={colors.GRID} />
            <line x1={MASTER.x} y1={MASTER.y + 36} x2={r.x} y2={r.y - 28} stroke={colors.GRID} strokeWidth={1.2} opacity={0.7} />
          </g>
        ))}
        {splitU > 0.05 && (
          <g opacity={splitU * dimAll}>
            <text x={MASTER.x} y={MASTER.y - 74} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily="ui-monospace, monospace">
              writes → master
            </text>
            <text x={(REPLICAS[0].x + REPLICAS[1].x) / 2} y={REPLICAS[0].y + 48} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily="ui-monospace, monospace">
              reads → replicas
            </text>
          </g>
        )}

        {/* ---- the read flood ---- */}
        {READS.map((r, i) => {
          // phase 1: straight to master; phase 2: mostly absorbed by cache/replicas
          const phase2 = absorbU > 0.05;
          const t = phase2 ? absorbU : floodU;
          const u = clamp01((t - r.delay) * 3.0);
          if (u <= 0 || u >= 1) return null;
          const from = WEB[r.lane];
          const hitCache = phase2 && i % 5 !== 0;
          const toRepl = phase2 && !hitCache && replU > 0.5;
          const target = hitCache ? CACHE : toRepl ? REPLICAS[r.toReplica] : MASTER;
          const x = lerp(from.x + 85, target.x - 80, u);
          const y = lerp(from.y, target.y, u);
          return <circle key={`${phase2 ? 'b' : 'a'}-${i}`} cx={x} cy={y} r={4} fill={hitCache ? colors.WARM : colors.ACCENT} opacity={0.8} />;
        })}

        {/* the thin write line, always calm */}
        <g opacity={rigU * dimAll * 0.9}>
          <line x1={WEB[1].x + 85} y1={WEB[1].y + 22} x2={MASTER.x - 90} y2={MASTER.y + 22} stroke={colors.POSITIVE} strokeWidth={1.4} strokeDasharray="4 8" />
          <text x={640} y={430} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily="ui-monospace, monospace" opacity={0.8}>
            1 write per 100 reads
          </text>
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={290} y={220} width={700} height={230} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={270} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            surviving a hundred to one
          </text>
          <text x={640} y={320} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
            hot reads from memory · sessions out of the servers · replicas for the rest
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontStyle="italic">
            stateless web servers — the ticket to autoscaling
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
