// The Read Path
//
// Backing files: solutions/system_design/pastebin/README.md (read path:
// Client → Web Server → Read API → SQL Database → Object Store; Step 4:
// Memory Cache for popular content, uneven traffic, SQL Read Replicas absorb
// cache misses, CDN; memory 250 µs vs SSD 4x vs disk 80x),
// solutions/system_design/query_cache/README.md (Redis/Memcached, LRU) and
// solutions/object_oriented_design/lru_cache/lru_cache.py (move_to_front,
// remove_from_tail, lookup dict).
//
// Centerpiece: the read funnel — a rain of requests from a client crowd is
// absorbed layer by layer (CDN edge, memory cache, read replicas), and only
// a trickle ever reaches the disk. Supporting machines: a hot-link histogram
// (traffic is never uniform), a three-lane latency race (memory vs SSD vs
// disk), and the LRU shelf where hits slide to the front and the tail falls.
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
import { ParticleCloud, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The funnel — layer x-positions and per-request absorb depths (seeded).
// Distribution: CDN 40% · memory cache 35% · read replicas 18% · disk 7%.
// ---------------------------------------------------------------------------

const LAYERS = [
  { x: 400, label: 'CDN', sub: 'edge', kind: 'cdn' as const, share: '40%' },
  { x: 640, label: 'Memory Cache', sub: 'Redis / Memcached', kind: 'cache' as const, share: '35%' },
  { x: 880, label: 'Read Replicas', sub: 'SQL · ×3', kind: 'db' as const, share: '18%' },
  { x: 1120, label: 'Object Store', sub: 'disk', kind: 'storage' as const, share: '7%' },
] as const;
const LANE_Y0 = 190;
const LANE_Y1 = 430;
const CROWD_X = 150;

interface Req {
  phase: number;
  y: number;
  depth: number; // which layer index absorbs it
  speed: number;
}

const rand = mulberry32(40404);
const pickDepth = (r: number): number => (r < 0.4 ? 0 : r < 0.75 ? 1 : r < 0.93 ? 2 : 3);
const REQS: Req[] = Array.from({ length: 64 }, () => ({
  phase: rand(),
  y: LANE_Y0 + rand() * (LANE_Y1 - LANE_Y0),
  depth: pickDepth(rand()),
  speed: 0.8 + rand() * 0.4,
}));

// hot-link histogram — zipf-ish popularity, precomputed
const BARS = Array.from({ length: 14 }, (_, i) => 1 / (1 + i * 0.9));

// LRU shelf — a deterministic little story in shelf states over lruU 0..1:
//   phase A (0..0.4): hit on slot 3 → moves to front
//   phase B (0.4..1): new entry at capacity → tail falls off
const SHELF_A0 = ['x7Rq2Lp', 'dSUUsvo', 'aB93kQz', 'M4nv0Yt', 'pE6sW1c'];
const SHELF_A1 = ['M4nv0Yt', 'x7Rq2Lp', 'dSUUsvo', 'aB93kQz', 'pE6sW1c']; // M4nv0Yt hit → front
const SHELF_B1 = ['Zk82hFw', 'M4nv0Yt', 'x7Rq2Lp', 'dSUUsvo', 'aB93kQz']; // insert; pE6sW1c evicted
const SHELF = { x0: 420, y: 96, cell: 118, gap: 10, h: 40 } as const;
const shelfX = (i: number): number => SHELF.x0 + i * (SHELF.cell + SHELF.gap);

// latency race — memory 250 µs, SSD ×4, disk ×80 (log-ish lane speeds)
const RACE = { x0: 430, x1: 1150, y0: 470, dy: 44 } as const;
const RACE_LANES = [
  { label: 'memory', time: '250 µs', speed: 1, color: colors.POSITIVE },
  { label: 'SSD', time: '×4', speed: 1 / 4, color: colors.WARM },
  { label: 'disk', time: '×80', speed: 1 / 80, color: colors.NEGATIVE },
] as const;

const CAM_FUNNEL: CameraState = { x: 660, y: 310, k: 1.12 };
const CAM_HIST: CameraState = { x: 420, y: 470, k: 1.4 };
const CAM_RACE: CameraState = { x: 790, y: 500, k: 1.3 };
const CAM_SHELF: CameraState = { x: 730, y: 170, k: 1.35 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  crowdU: ChannelRef<number>;
  baseU: ChannelRef<number>;
  flow: ChannelRef<number>;
  histU: ChannelRef<number>;
  layerU: ChannelRef<number>;
  raceU: ChannelRef<number>;
  raceGo: ChannelRef<number>;
  lruU: ChannelRef<number>;
  lruGo: ChannelRef<number>;
  repliU: ChannelRef<number>;
  cdnU: ChannelRef<number>;
  countsU: ChannelRef<number>;
  panelDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_FUNNEL, cameraInterp);
  const crowdU = tl.channel('crowdU', 0);
  const baseU = tl.channel('baseU', 0);
  const flow = tl.channel('flow', 0);
  const histU = tl.channel('histU', 0);
  const layerU = tl.channel('layerU', 0);
  const raceU = tl.channel('raceU', 0);
  const raceGo = tl.channel('raceGo', 0);
  const lruU = tl.channel('lruU', 0);
  const lruGo = tl.channel('lruGo', 0);
  const repliU = tl.channel('repliU', 0);
  const cdnU = tl.channel('cdnU', 0);
  const countsU = tl.channel('countsU', 0);
  const panelDim = tl.channel('panelDim', 1);
  const closeU = tl.channel('closeU', 0);

  // the rain never stops once it starts
  tl.tween(flow, 10, { at: 7.0, dur: 58, ease: ease.linear });

  // — Beat 1 · the moment —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'Someone clicks our link. This is the moment the whole design exists for — and it happens forty times every second on average, with spikes far above that.',
  });
  tl.tween(crowdU, 1, { at: 0.6, dur: 1.2, ease: ease.enter });

  // — Beat 2 · the plain path —
  tl.caption({
    at: 6.9,
    dur: 5.7,
    text: 'The plain path works: the read service looks the link up in the database, follows the stored path to the object store, and returns the contents.',
  });
  tl.tween(baseU, 1, { at: 7.2, dur: 1.6, ease: ease.draw });

  // — Beat 3 · traffic is lumpy —
  tl.caption({
    at: 13.2,
    dur: 5.8,
    text: 'But look at which links people actually follow. Traffic is never evenly distributed — a handful of hot pastes soak up most of the reads.',
  });
  tl.tween(cam, CAM_HIST, { at: 13.4, dur: 1.4, ease: ease.move });
  tl.tween(histU, 1, { at: 14.2, dur: 2.2, ease: ease.move });
  tl.hold(19.4, 0.5);

  // — Beat 4 · the memory cache —
  tl.caption({
    at: 20.0,
    dur: 6.2,
    text: 'That skew is what a memory cache is for. The popular pastes sit in memory — in something like Redis or Memcached — and reads for them never reach the database at all.',
  });
  tl.tween(cam, CAM_FUNNEL, { at: 20.2, dur: 1.4, ease: ease.move });
  tl.tween(layerU, 1, { at: 21.0, dur: 1.6, ease: ease.enter });
  tl.hold(26.6, 0.5);

  // — Beat 5 · the latency race —
  tl.caption({
    at: 27.2,
    dur: 6.6,
    text: 'The speed gap is not subtle. Reading a megabyte from memory takes about two hundred fifty microseconds. A solid state drive takes four times longer — and a spinning disk, eighty times.',
  });
  tl.tween(cam, CAM_RACE, { at: 27.4, dur: 1.4, ease: ease.move });
  tl.tween(raceU, 1, { at: 28.0, dur: 1.0, ease: ease.enter });
  tl.tween(raceGo, 1, { at: 29.2, dur: 4.2, ease: ease.linear });
  tl.hold(33.8, 0.5);

  // — Beat 6 · LRU —
  tl.caption({
    at: 34.4,
    dur: 7,
    text: 'Memory is small, so the cache must forget. The primer evicts the least recently used entry: every hit moves an entry to the front of a linked list, and when space runs out, the tail falls off.',
  });
  tl.tween(cam, CAM_SHELF, { at: 34.6, dur: 1.4, ease: ease.move });
  tl.tween(lruU, 1, { at: 35.4, dur: 0.8, ease: ease.enter });
  tl.tween(lruGo, 1, { at: 36.6, dur: 4.4, ease: ease.linear });
  tl.hold(41.8, 0.5);

  // — Beat 7 · misses → replicas —
  tl.caption({
    at: 42.4,
    dur: 6.2,
    text: "Cache misses fall through to read replicas — copies of the database that answer lookups so the write master doesn't have to, as long as replication lag doesn't bog them down.",
  });
  tl.tween(cam, CAM_FUNNEL, { at: 42.6, dur: 1.4, ease: ease.move });
  tl.tween(repliU, 1, { at: 43.4, dur: 1.0, ease: ease.pop });

  // — Beat 8 · the CDN —
  tl.caption({
    at: 49.0,
    dur: 6,
    text: 'And in front of everything, a content delivery network can serve the hottest pastes from the edge, close to the reader — those requests never even reach our servers.',
  });
  tl.tween(cdnU, 1, { at: 49.8, dur: 1.0, ease: ease.pop });

  // — Beat 9 · the funnel counts —
  tl.caption({
    at: 55.4,
    dur: 6.4,
    text: 'Stack the layers and the read path becomes a funnel: the edge absorbs the hottest, memory absorbs the popular, replicas absorb the misses — and the disk sees almost nothing.',
  });
  tl.tween(cam, CAM_WIDE, { at: 55.6, dur: 1.6, ease: ease.move });
  tl.tween(countsU, 1, { at: 56.6, dur: 2.0, ease: ease.move });
  tl.hold(61.8, 0.5);

  // — Beat 10 · promise kept —
  tl.caption({
    at: 62.4,
    dur: 5.4,
    text: 'Fast follows, cheap reads. That was the promise in the envelope math — and this funnel is how the design keeps it.',
  });
  tl.tween(panelDim, 0.13, { at: 62.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 63.8, dur: 0.9, ease: ease.enter });
  tl.hold(67.4, 1.5);

  return {
    tl,
    cam,
    crowdU,
    baseU,
    flow,
    histU,
    layerU,
    raceU,
    raceGo,
    lruU,
    lruGo,
    repliU,
    cdnU,
    countsU,
    panelDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function reqParticles(s: SceneState) {
  const flow = s.get(scene.flow);
  const crowdU = s.get(scene.crowdU);
  const layerU = s.get(scene.layerU);
  const repliU = s.get(scene.repliU);
  const cdnU = s.get(scene.cdnU);
  const panelDim = s.get(scene.panelDim);
  if (crowdU <= 0) return [];
  const pts = [];
  for (const q of REQS) {
    // before the layers exist, everything flies to the last layer (plain path)
    const cdnOn = cdnU > 0.5;
    const cacheOn = layerU > 0.5;
    const repliOn = repliU > 0.5;
    let stopAt: number;
    if (q.depth === 0) stopAt = cdnOn ? 0 : cacheOn ? 1 : 3;
    else if (q.depth === 1) stopAt = cacheOn ? 1 : 3;
    else if (q.depth === 2) stopAt = repliOn ? 2 : 3;
    else stopAt = 3;
    const xEnd = LAYERS[stopAt].x - 52;
    const u = (q.phase + flow * 0.14 * q.speed) % 1;
    const x = CROWD_X + 40 + u * (xEnd - CROWD_X - 40);
    pts.push({
      x,
      y: q.y,
      r: 2.6,
      alpha: panelDim * crowdU * 0.85 * Math.min(1, u * 10, (1 - u) * 6),
      color: stopAt === 0 ? colors.TEAL : stopAt === 1 ? colors.ACCENT : stopAt === 2 ? colors.WARM : colors.NEGATIVE,
    });
  }
  return pts;
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const crowdU = s.get(scene.crowdU);
  const baseU = s.get(scene.baseU);
  const histU = s.get(scene.histU);
  const layerU = s.get(scene.layerU);
  const raceU = s.get(scene.raceU);
  const raceGo = s.get(scene.raceGo);
  const lruU = s.get(scene.lruU);
  const lruGo = s.get(scene.lruGo);
  const repliU = s.get(scene.repliU);
  const cdnU = s.get(scene.cdnU);
  const countsU = s.get(scene.countsU);
  const panelDim = s.get(scene.panelDim);
  const closeU = s.get(scene.closeU);

  // LRU shelf interpolation
  const hitU = clamp01(lruGo / 0.4); // phase A progress
  const insU = clamp01((lruGo - 0.5) / 0.5); // phase B progress
  const shelfNow = insU > 0 ? SHELF_B1 : hitU >= 1 ? SHELF_A1 : SHELF_A0;
  const posOf = (link: string, arr: string[]): number => arr.indexOf(link);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- client crowd ---- */}
        <g opacity={crowdU * panelDim}>
          <ServiceNode x={CROWD_X} y={310} kind="client" label="readers" sublabel="40 / s avg" u={crowdU} replicas={10} />
        </g>

        {/* ---- the funnel layers ---- */}
        <g opacity={panelDim}>
          {/* base path nodes (replica + store) are always the far layers */}
          <ServiceNode x={LAYERS[3].x} y={310} kind="storage" label="Object Store" sublabel="the disk" u={baseU} />
          <ServiceNode
            x={LAYERS[2].x}
            y={310}
            kind="db"
            label={repliU > 0.5 ? 'Read Replicas' : 'SQL Database'}
            sublabel={repliU > 0.5 ? 'no write load' : 'lookup shortlink'}
            u={baseU}
            replicas={repliU > 0.5 ? 3 : undefined}
            glow={repliU * 0.7 * (1 - countsU)}
          />
          <ServiceNode
            x={LAYERS[1].x}
            y={310}
            kind="cache"
            label="Memory Cache"
            sublabel="Redis / Memcached"
            u={layerU}
            glow={layerU * 0.8 * (1 - raceU)}
          />
          <ServiceNode x={LAYERS[0].x} y={310} kind="cdn" label="CDN" sublabel="the edge" u={cdnU} glow={cdnU * 0.7 * (1 - countsU)} />
        </g>
        <ParticleCloud state={s} compute={reqParticles} />

        {/* absorb shares */}
        {countsU > 0 && (
          <g opacity={countsU * panelDim}>
            {LAYERS.map((l) => (
              <g key={l.label}>
                <text x={l.x} y={392} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={700}>
                  {l.share}
                </text>
                <text x={l.x} y={410} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                  absorbed here
                </text>
              </g>
            ))}
          </g>
        )}

        {/* ---- hot-link histogram ---- */}
        {histU > 0 && (
          <g opacity={clamp01(histU * 2) * panelDim * (1 - countsU)}>
            <rect x={210} y={430} width={420} height={160} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={228} y={456} fill={colors.TEXT} fontSize={13}>
              reads per link
            </text>
            <text x={612} y={456} textAnchor="end" fill={colors.MUTED} fontSize={11} fontStyle="italic">
              a few links get almost everything
            </text>
            {BARS.map((b, i) => {
              const u = clamp01(histU * 3 - i * 0.15);
              const h = 106 * b * u;
              return (
                <rect
                  key={i}
                  x={230 + i * 27}
                  y={576 - h}
                  width={19}
                  height={h}
                  rx={3}
                  fill={i < 3 ? colors.ACCENT : colors.MUTED}
                  opacity={i < 3 ? 0.95 : 0.45}
                />
              );
            })}
          </g>
        )}

        {/* ---- the latency race ---- */}
        {raceU > 0 && (
          <g opacity={raceU * panelDim * (1 - countsU)}>
            <rect x={RACE.x0 - 20} y={RACE.y0 - 34} width={RACE.x1 - RACE.x0 + 40} height={176} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={RACE.x0} y={RACE.y0 - 10} fill={colors.TEXT} fontSize={13}>
              read 1 MB, sequentially
            </text>
            {RACE_LANES.map((lane, i) => {
              const y = RACE.y0 + 22 + i * RACE.dy;
              const u = clamp01(raceGo * lane.speed * 1.05);
              return (
                <g key={lane.label}>
                  <line x1={RACE.x0} y1={y} x2={RACE.x1 - 90} y2={y} stroke={colors.GRID} strokeWidth={1} />
                  <circle cx={RACE.x0 + (RACE.x1 - 90 - RACE.x0) * u} cy={y} r={7} fill={lane.color} />
                  <text x={RACE.x0} y={y - 12} fill={lane.color} fontSize={12}>
                    {lane.label}
                  </text>
                  <text x={RACE.x1 - 10} y={y + 4} textAnchor="end" fill={u >= 1 ? lane.color : colors.MUTED} fontSize={12} fontFamily="monospace">
                    {lane.time}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ---- the LRU shelf ---- */}
        {lruU > 0 && (
          <g opacity={lruU * panelDim * (1 - countsU)}>
            <text x={SHELF.x0} y={SHELF.y - 26} fill={colors.TEXT} fontSize={13}>
              the cache, as a linked list — front is safety
            </text>
            <text x={SHELF.x0} y={SHELF.y - 8} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
              {insU > 0.2 ? 'remove_from_tail() · append_to_front(node)' : hitU > 0.4 ? 'move_to_front(node)' : 'lookup = {query: node}'}
            </text>
            {['x7Rq2Lp', 'dSUUsvo', 'aB93kQz', 'M4nv0Yt', 'pE6sW1c', 'Zk82hFw'].map((link) => {
              // interpolate each chip between its shelf positions across phases
              const pA = posOf(link, SHELF_A0);
              const pB = posOf(link, SHELF_A1);
              const pC = posOf(link, SHELF_B1);
              let x: number;
              let alpha = 1;
              let stroke: string = colors.GRID;
              if (link === 'Zk82hFw') {
                // the new entry drops in from the left during phase B
                if (insU <= 0) return null;
                x = shelfX(0) - 140 * (1 - insU);
                alpha = insU;
                stroke = colors.POSITIVE;
              } else if (pC === -1) {
                // evicted: rides off the right end and fades
                const from = shelfX(pB >= 0 ? pB : pA);
                x = from + (insU > 0 ? 120 * insU : 0);
                alpha = insU > 0 ? 1 - insU : 1;
                if (insU > 0.1) stroke = colors.NEGATIVE;
              } else {
                const xa = shelfX(pA);
                const xb = shelfX(pB);
                const xc = shelfX(pC);
                x = hitU < 1 ? xa + (xb - xa) * hitU : xb + (xc - xb) * insU;
                if (link === 'M4nv0Yt' && hitU > 0 && hitU < 1) stroke = colors.ACCENT;
              }
              if (alpha <= 0) return null;
              return (
                <g key={link} opacity={alpha}>
                  <rect x={x} y={SHELF.y} width={SHELF.cell} height={SHELF.h} rx={8} fill={colors.PANEL} stroke={stroke} strokeWidth={stroke === colors.GRID ? 1 : 1.8} />
                  <text x={x + SHELF.cell / 2} y={SHELF.y + 25} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                    {link}
                  </text>
                </g>
              );
            })}
            <text x={shelfX(0)} y={SHELF.y + SHELF.h + 18} fill={colors.MUTED} fontSize={10.5}>
              front — most recent
            </text>
            <text x={shelfX(4) + SHELF.cell} y={SHELF.y + SHELF.h + 18} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
              tail — next to go
            </text>
          </g>
        )}

        {/* ---- closing ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={360} y={240} width={560} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={295} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
              edge → memory → replicas → disk
            </text>
            <text x={640} y={335} textAnchor="middle" fill={colors.ACCENT} fontSize={18} fontWeight={700}>
              the hot path never touches the database
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
