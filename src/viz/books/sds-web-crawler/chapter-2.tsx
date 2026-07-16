// Politeness: never hammer one host
//
// Backed by: solutions/system_design/web_crawler/README.md — the Robots.txt
// note ("gives webmasters control of crawl frequency"), and the Crawler
// Service optimizations: own periodically-refreshed DNS lookup, connection
// pooling, "web crawling is bandwidth intensive". The machine: the frontier
// hands the loop six links from the same host — fired back to back they read
// as a flood on a fetch time-strip and the host tips over; the robots pact
// re-spaces them into a drip with a timer between visits, and the crawler
// stays fast in AGGREGATE by dripping thousands of hosts in parallel.
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
import { Connection, Packet, ServiceNode, TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const fract = (v: number): number => v - Math.floor(v);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const CRAWLER = { x: 500, y: 300 } as const;
const FOO = { x: 985, y: 235 } as const;

// the frontier's six same-host links (paths are on-screen labels only)
const PATHS = ['/index', '/news', '/prices', '/jobs', '/blog', '/about'];
const LAD = { x: 84, y0: 128, w: 240, rowH: 44 } as const;

// the fetch time-strip
const STRIP = { x0: 390, x1: 1200, y: 566 } as const;
const burstDotX = (i: number): number => STRIP.x0 + 26 + i * 22;
const dripDotX = (i: number): number => STRIP.x0 + 26 + i * 152;

// the parallel host lattice (foo/bar/baz are the primer's sample hosts)
const rand = mulberry32(20260716);
const HOSTS = Array.from({ length: 12 }, (_, i) => ({
  x: 800 + (i % 4) * 128,
  y: 110 + Math.floor(i / 4) * 128,
  label: i === 1 ? 'foo' : i === 6 ? 'bar' : i === 8 ? 'baz' : '',
  phase: rand(),
}));

const CAM_SETUP: CameraState = { x: 520, y: 320, k: 1.12 };
const CAM_HOST: CameraState = { x: 880, y: 300, k: 1.25 };
const CAM_ROBOTS: CameraState = { x: 950, y: 250, k: 1.35 };
const CAM_DRIP: CameraState = { x: 830, y: 400, k: 1.1 };
const CAM_DNS: CameraState = { x: 560, y: 400, k: 1.22 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ladU: ChannelRef<number>;
  coreU: ChannelRef<number>;
  stripU: ChannelRef<number>;
  burstP: ChannelRef<number>;
  health: ChannelRef<number>;
  rewindU: ChannelRef<number>;
  robotsU: ChannelRef<number>;
  dripP: ChannelRef<number>;
  hostsU: ChannelRef<number>;
  poolPhase: ChannelRef<number>;
  dnsU: ChannelRef<number>;
  poolU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SETUP, cameraInterp);
  const ladU = tl.channel('ladU', 0); // same-host frontier chips
  const coreU = tl.channel('coreU', 0); // crawler + foo host reveal
  const stripU = tl.channel('stripU', 0); // fetch time-strip reveal
  const burstP = tl.channel('burstP', 0); // six back-to-back fetches
  const health = tl.channel('health', 0); // 0 ok · 1 warn · 2 down
  const rewindU = tl.channel('rewindU', 0); // wipe the burst
  const robotsU = tl.channel('robotsU', 0); // robots.txt pact card
  const dripP = tl.channel('dripP', 0); // six spaced fetches (0..6)
  const hostsU = tl.channel('hostsU', 0); // the parallel host lattice
  const poolPhase = tl.channel('poolPhase', 0); // streaming drips, all hosts
  const dnsU = tl.channel('dnsU', 0); // DNS cache card
  const poolU = tl.channel('poolU', 0); // persistent pooled connections
  const closeU = tl.channel('closeU', 0); // quiet ending

  // — Beat 1 · the failure mode —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Here is the failure mode nobody sketches on the whiteboard: your crawl loop, pointed at one small website, is indistinguishable from an attack.',
  });
  tl.tween(coreU, 1, { at: 0.7, dur: 0.9, ease: ease.enter });
  tl.tween(ladU, 1, { at: 1.4, dur: 1.2, ease: ease.enter });
  tl.tween(stripU, 1, { at: 2.6, dur: 1.2, ease: ease.draw });
  tl.hold(7.0, 0.5);

  // — Beat 2 · the burst —
  tl.caption({
    at: 7.5,
    dur: 6.5,
    text: 'When one site fills the top of the frontier, the loop fires those fetches back to back. To the server on the other end, that is a flood.',
  });
  tl.tween(cam, CAM_HOST, { at: 7.7, dur: 1.4, ease: ease.move });
  tl.tween(burstP, 1, { at: 8.6, dur: 2.8, ease: ease.linear });
  tl.tween(health, 1, { at: 10.4, dur: 0.8, ease: ease.move });
  tl.hold(13.9, 0.4);

  // — Beat 3 · the host tips over —
  tl.caption({
    at: 14.4,
    dur: 5.6,
    text: 'A small host tips over under that. And a crawler that knocks sites offline gets blocked, not welcomed back.',
  });
  tl.tween(health, 2, { at: 14.8, dur: 0.9, ease: ease.move });
  tl.hold(20.0, 0.4);

  // — Beat 4 · the manner —
  tl.caption({
    at: 20.5,
    dur: 6.8,
    text: 'So the crawler adopts a manner: politeness. Never hammer one host, no matter how eager the frontier is to hand you its links.',
  });
  tl.tween(rewindU, 1, { at: 21.0, dur: 1.2, ease: ease.move });
  tl.tween(health, 0, { at: 21.4, dur: 1.0, ease: ease.move });
  tl.hold(27.4, 0.4);

  // — Beat 5 · robots.txt —
  tl.caption({
    at: 27.9,
    dur: 6.6,
    text: 'The design supports the robots file, where a webmaster sets the terms: which pages are off limits, and how often the crawler may come knocking.',
  });
  tl.tween(cam, CAM_ROBOTS, { at: 28.1, dur: 1.4, ease: ease.move });
  tl.tween(robotsU, 1, { at: 28.8, dur: 0.8, ease: ease.enter });
  tl.hold(34.6, 0.4);

  // — Beat 6 · the drip —
  tl.caption({
    at: 35.1,
    dur: 7,
    text: 'Same six fetches, spread out on the clock, a timer counting down between visits. The site barely notices the crawler was ever there.',
  });
  tl.tween(cam, CAM_DRIP, { at: 35.3, dur: 1.5, ease: ease.move });
  tl.tween(dripP, 6, { at: 36.0, dur: 9.5, ease: ease.linear });
  tl.hold(42.3, 0.4);

  // — Beat 7 · fast in aggregate —
  tl.caption({
    at: 46.0,
    dur: 7,
    text: 'Per host you are deliberately slow. The crawler stays fast the other way: thousands of hosts, each politely dripped, all in parallel.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 46.2, dur: 1.6, ease: ease.move });
  tl.tween(robotsU, 0.15, { at: 46.4, dur: 1.0, ease: ease.move });
  tl.tween(hostsU, 1, { at: 47.0, dur: 1.6, ease: ease.enter });
  tl.tween(poolPhase, 6, { at: 47.0, dur: 24, ease: ease.linear });
  tl.hold(53.2, 0.4);

  // — Beat 8 · the DNS cache —
  tl.caption({
    at: 53.7,
    dur: 7.6,
    text: 'There is a quieter bottleneck: every fetch starts by resolving a name to an address. So the crawler keeps its own lookup table, refreshed on a schedule, instead of asking the network every time.',
  });
  tl.tween(cam, CAM_DNS, { at: 53.9, dur: 1.4, ease: ease.move });
  tl.tween(dnsU, 1, { at: 54.6, dur: 0.8, ease: ease.enter });
  tl.hold(61.5, 0.4);

  // — Beat 9 · connection pooling —
  tl.caption({
    at: 62.0,
    dur: 6,
    text: 'It also holds connections open and reuses them, pooling instead of paying the handshake tax on every single page.',
  });
  tl.tween(poolU, 1, { at: 62.4, dur: 1.4, ease: ease.draw });
  tl.hold(68.2, 0.4);

  // — Beat 10 · where the firehose points —
  tl.caption({
    at: 68.7,
    dur: 7,
    text: 'Crawling is bandwidth hungry by nature. Politeness does not make the machine slower; it decides where the firehose is allowed to point.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 68.9, dur: 1.6, ease: ease.move });
  tl.tween(closeU, 1, { at: 69.3, dur: 1.4, ease: ease.move });
  tl.hold(75.6, 1.4);

  return {
    tl,
    cam,
    ladU,
    coreU,
    stripU,
    burstP,
    health,
    rewindU,
    robotsU,
    dripP,
    hostsU,
    poolPhase,
    dnsU,
    poolU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ladU = s.get(scene.ladU);
  const coreU = s.get(scene.coreU);
  const stripU = s.get(scene.stripU);
  const burstP = s.get(scene.burstP);
  const health = s.get(scene.health);
  const rewindU = s.get(scene.rewindU);
  const robotsU = s.get(scene.robotsU);
  const dripP = s.get(scene.dripP);
  const hostsU = s.get(scene.hostsU);
  const poolPhase = s.get(scene.poolPhase);
  const dnsU = s.get(scene.dnsU);
  const poolU = s.get(scene.poolU);
  const closeU = s.get(scene.closeU);

  const status: 'ok' | 'warn' | 'down' = health > 1.5 ? 'down' : health > 0.5 ? 'warn' : 'ok';
  const burstGone = 1 - rewindU;
  const dripping = dripP > 0 && dripP < 6;
  const dimAll = 1 - closeU * 0.85;
  // lattice fades the single-host story back
  const soloOp = clamp01(1 - hostsU * 0.9);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* the frontier — six links, one host */}
          <g opacity={ladU}>
            <text x={LAD.x} y={LAD.y0 - 26} fill={colors.TEXT} fontSize={15}>
              the frontier
            </text>
            <text x={LAD.x} y={LAD.y0 - 8} fill={colors.NEGATIVE} fontSize={12} fontFamily="ui-monospace, monospace">
              six links · one host
            </text>
            {PATHS.map((p, i) => {
              const consumed = Math.max(clamp01(burstP * 3 - i * 0.35) * burstGone, clamp01(dripP - i));
              return (
                <g key={p} opacity={1 - consumed * 0.75}>
                  <rect x={LAD.x} y={LAD.y0 + i * LAD.rowH} width={LAD.w} height={LAD.rowH - 8} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={LAD.x + 12} y={LAD.y0 + i * LAD.rowH + 24} fill={colors.TEXT} fontSize={13} fontFamily="ui-monospace, monospace">
                    foo.com{p}
                  </text>
                </g>
              );
            })}
          </g>

          {/* crawler + the single host */}
          <g opacity={coreU * soloOp}>
            <Connection from={{ x: CRAWLER.x + 70, y: CRAWLER.y }} to={{ x: FOO.x - 70, y: FOO.y }} u={coreU} color={colors.MUTED} dim={0.4} />
          </g>
          <g opacity={coreU}>
            <ServiceNode x={CRAWLER.x} y={CRAWLER.y} kind="server" label="Crawler Service" sublabel="crawl loop" u={coreU} />
          </g>
          <g opacity={soloOp}>
            <ServiceNode x={FOO.x} y={FOO.y} kind="external" label="foo.com" sublabel="one small host" u={coreU} status={status} glow={health > 0.5 ? 0.6 : 0} />
          </g>

          {/* burst packets — back to back */}
          {burstGone > 0.02 &&
            PATHS.map((_, i) => (
              <Packet
                key={`b${i}`}
                from={{ x: CRAWLER.x + 70, y: CRAWLER.y }}
                to={{ x: FOO.x - 70, y: FOO.y }}
                u={clamp01(burstP * 3 - i * 0.35)}
                r={6.5}
                color={colors.NEGATIVE}
                opacity={burstGone * soloOp}
              />
            ))}

          {/* drip packets — one at a time, timer between */}
          {dripping && (
            <>
              <Packet
                from={{ x: CRAWLER.x + 70, y: CRAWLER.y }}
                to={{ x: FOO.x - 70, y: FOO.y }}
                u={clamp01(fract(dripP) * 2.2)}
                r={6.5}
                color={colors.POSITIVE}
                opacity={soloOp}
              />
              <g opacity={soloOp}>
                <TimerArc cx={FOO.x - 120} cy={FOO.y - 70} r={20} u={1 - fract(dripP)} color={colors.POSITIVE} />
                <text x={FOO.x - 120} y={FOO.y - 102} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                  wait before next visit
                </text>
              </g>
            </>
          )}

          {/* robots.txt — the pact */}
          <g opacity={robotsU}>
            <rect x={FOO.x - 128} y={FOO.y + 62} width={256 } height={64} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
            <text x={FOO.x} y={FOO.y + 88} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily="ui-monospace, monospace">
              robots.txt
            </text>
            <text x={FOO.x} y={FOO.y + 108} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              webmaster-controlled crawl frequency
            </text>
          </g>

          {/* the fetch time-strip */}
          <g opacity={stripU}>
            <line x1={STRIP.x0} y1={STRIP.y} x2={STRIP.x0 + (STRIP.x1 - STRIP.x0) * stripU} y2={STRIP.y} stroke={colors.GRID} strokeWidth={1.5} />
            {Array.from({ length: 12 }, (_, i) => (
              <line key={i} x1={STRIP.x0 + 26 + i * 76} y1={STRIP.y - 4} x2={STRIP.x0 + 26 + i * 76} y2={STRIP.y + 4} stroke={colors.GRID} strokeWidth={1} />
            ))}
            <text x={STRIP.x0} y={STRIP.y + 24} fill={colors.MUTED} fontSize={12} fontStyle="italic">
              fetches on the clock →
            </text>
            {/* burst dots: clustered — a flood */}
            {PATHS.map((_, i) => (
              <circle
                key={`bd${i}`}
                cx={burstDotX(i)}
                cy={STRIP.y - 12}
                r={5.5}
                fill={colors.NEGATIVE}
                opacity={burstGone * (clamp01(burstP * 3 - i * 0.35) >= 1 ? 0.9 : 0)}
              />
            ))}
            {/* drip dots: evenly spaced */}
            {PATHS.map((_, i) => (
              <circle key={`dd${i}`} cx={dripDotX(i)} cy={STRIP.y - 12} r={5.5} fill={colors.POSITIVE} opacity={dripP >= i + 0.99 ? 0.9 : 0} />
            ))}
          </g>

          {/* the parallel lattice — many hosts, each on its own drip */}
          <g opacity={hostsU}>
            {HOSTS.map((h, i) => {
              const u = fract(poolPhase * 0.55 + h.phase);
              return (
                <g key={i}>
                  {poolU > 0.02 && (
                    <line x1={CRAWLER.x + 70} y1={CRAWLER.y} x2={h.x} y2={h.y} stroke={colors.TEAL} strokeWidth={1} opacity={0.22 * poolU} />
                  )}
                  <circle cx={h.x} cy={h.y} r={17} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.2} opacity={0.9} />
                  {h.label && (
                    <text x={h.x} y={h.y - 26} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                      {h.label}
                    </text>
                  )}
                  <Packet from={{ x: CRAWLER.x + 70, y: CRAWLER.y }} to={{ x: h.x, y: h.y }} u={u} r={4} color={colors.POSITIVE} opacity={0.8} />
                  <TimerArc cx={h.x} cy={h.y} r={10} u={1 - u} color={colors.POSITIVE} width={2} opacity={0.5} />
                </g>
              );
            })}
          </g>

          {/* the DNS cache */}
          <g opacity={dnsU}>
            <rect x={400} y={430} width={220} height={62} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
            <text x={510} y={456} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily="ui-monospace, monospace">
              DNS cache
            </text>
            <text x={510} y={476} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              own lookups · refreshed periodically
            </text>
            <line x1={CRAWLER.x} y1={CRAWLER.y + 42} x2={510} y2={430} stroke={colors.ACCENT} strokeWidth={1.2} opacity={0.5} />
          </g>
        </g>

        {/* quiet close */}
        <g opacity={closeU}>
          <rect x={310} y={230} width={660} height={200} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            polite per host · fast in aggregate
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            robots.txt terms · spaced visits · DNS cache · pooled connections
          </text>
          <text x={640} y={382} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontStyle="italic">
            the firehose stays on — it just never points at one place
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
