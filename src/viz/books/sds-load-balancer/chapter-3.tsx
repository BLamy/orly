// The Edge of the Earth: DNS, CDNs, and the price of scaling out
//
// Backed by: the system-design-primer main README — "Domain name system"
// (DNS translates www.example.com to an IP; hierarchical with authoritative
// servers at the top; lower servers and browsers/OS cache mappings with a TTL;
// record types NS, MX, A, CNAME; managed services like CloudFlare and Route 53
// can route by latency/geography and keep traffic off servers under
// maintenance), "Content delivery network" (a globally distributed network of
// proxy servers serving content closer to the user; static HTML/CSS/JS,
// photos, videos; performance improves because users hit nearby data centers
// AND your servers stop serving those requests; PUSH CDNs receive content when
// it changes — you upload and rewrite URLs, good for low-traffic sites; PULL
// CDNs fetch from your origin on the first request and cache under a TTL —
// slower first hit, good for heavy traffic; content can be stale until the
// TTL expires), and "Load balancer → Horizontal scaling" disadvantages
// (servers must be stateless; sessions move to a centralized store like
// Redis or Memcached; downstream caches and databases must handle more
// simultaneous connections).
//
// ONE machine: the planet as a strip. A user on the left, your origin far on
// the right, edge nodes in between. The DNS ladder resolves the name, the
// first request makes the long haul (pull CDN), the copy sticks at the edge
// under a TTL arc, and every later request stops early. Push mode then
// pre-loads the edges from the origin. The finale prices horizontal scaling.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

const USER = { x: 130, y: 400 } as const;
const EDGES = [
  { x: 430, y: 400, label: 'edge · near you' },
  { x: 700, y: 400, label: 'edge' },
] as const;
const ORIGIN = { x: 1080, y: 400 } as const;

const DNS_STEPS = [
  { q: 'www.example.com ?', a: 'ask the root' },
  { q: '.com nameserver', a: 'ask .com' },
  { q: 'A record', a: '93.184.216.34' },
] as const;

const CAM_DNS: CameraState = { x: 420, y: 250, k: 1.3 };
const CAM_STRIP: CameraState = { x: 640, y: 400, k: 1.12 };
const CAM_EDGE: CameraState = { x: 470, y: 380, k: 1.35 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  stripU: ChannelRef<number>;
  dnsU: ChannelRef<number>;
  dnsK: ChannelRef<number>;
  cacheDnsU: ChannelRef<number>;
  pull1: ChannelRef<number>;
  stickU: ChannelRef<number>;
  ttlU: ChannelRef<number>;
  pull2: ChannelRef<number>;
  pushU: ChannelRef<number>;
  staleU: ChannelRef<number>;
  costU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stripU = tl.channel('stripU', 0); // user / edges / origin strip
  const dnsU = tl.channel('dnsU', 0); // the ladder panel
  const dnsK = tl.channel('dnsK', 0); // resolution steps 0..3
  const cacheDnsU = tl.channel('cacheDnsU', 0); // browser cache note
  const pull1 = tl.channel('pull1', 0); // first request: long haul
  const stickU = tl.channel('stickU', 0); // copy sticks at the edge
  const ttlU = tl.channel('ttlU', 0); // ttl arc drains
  const pull2 = tl.channel('pull2', 0); // second request: short hop
  const pushU = tl.channel('pushU', 0); // push mode preload
  const staleU = tl.channel('staleU', 0); // staleness warning
  const costU = tl.channel('costU', 0); // horizontal scaling price chips
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the distance —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'The last bottleneck is not a machine at all. It is geography. Your user is here. Your servers are an ocean away, and every request pays the distance twice.',
  });
  tl.tween(cam, CAM_STRIP, { at: 0.7, dur: 1.5, ease: ease.move });
  tl.tween(stripU, 1, { at: 0.9, dur: 1.8, ease: ease.draw });
  tl.hold(7.0, 0.5);

  // — Beat 2 · DNS —
  tl.caption({
    at: 7.5,
    dur: 7,
    text: 'Before any request moves, a name becomes an address. The domain name system is a hierarchy: ask the root, ask the top level, and an authoritative server finally answers with the address record.',
  });
  tl.tween(cam, CAM_DNS, { at: 7.7, dur: 1.4, ease: ease.move });
  tl.tween(dnsU, 1, { at: 7.9, dur: 1.0, ease: ease.enter });
  tl.set(dnsK, 1, 10.0);
  tl.set(dnsK, 2, 11.6);
  tl.set(dnsK, 3, 13.2);
  tl.hold(14.5, 0.5);

  // — Beat 3 · DNS caching —
  tl.caption({
    at: 15.0,
    dur: 6,
    text: 'Nobody climbs that ladder twice. Your browser and your system cache the answer under a time to live, and managed services can even route by geography or steer traffic away from servers under maintenance.',
  });
  tl.tween(cacheDnsU, 1, { at: 15.8, dur: 1.0, ease: ease.enter });
  tl.hold(21.0, 0.5);

  // — Beat 4 · pull CDN, first request —
  tl.caption({
    at: 21.5,
    dur: 7,
    text: 'Now the content delivery network. In pull mode, the first request for a file makes the full journey to your origin, and on the way back, the edge keeps a copy. The first visitor pays. Everyone after rides free.',
  });
  tl.tween(cam, CAM_STRIP, { at: 21.7, dur: 1.4, ease: ease.move });
  tl.tween(pull1, 1, { at: 22.6, dur: 3.6, ease: ease.linear });
  tl.tween(stickU, 1, { at: 26.4, dur: 0.8, ease: ease.pop });
  tl.hold(28.5, 0.5);

  // — Beat 5 · the short hop —
  tl.caption({
    at: 29.0,
    dur: 6,
    text: 'Watch the second request. It travels to the nearby edge and stops. Your origin never hears about it. That is the double win: closer content for them, fewer requests for you.',
  });
  tl.tween(cam, CAM_EDGE, { at: 29.2, dur: 1.4, ease: ease.move });
  tl.tween(pull2, 1, { at: 30.0, dur: 2.0, ease: ease.linear });
  tl.hold(35.0, 0.5);

  // — Beat 6 · TTL + staleness —
  tl.caption({
    at: 35.5,
    dur: 6.5,
    text: 'The copy lives under a time to live. Until that clock expires, the edge will happily serve yesterday’s file, even if the original changed an hour ago. Cheap speed, honest staleness.',
  });
  tl.tween(ttlU, 1, { at: 36.2, dur: 3.0, ease: ease.linear });
  tl.tween(staleU, 1, { at: 39.4, dur: 0.9, ease: ease.pop });
  tl.hold(42.0, 0.5);

  // — Beat 7 · push mode —
  tl.caption({
    at: 42.5,
    dur: 7,
    text: 'Push mode inverts the deal: you upload content to the edges yourself whenever it changes, and you rewrite the links to point there. Small sites with rarely changing content push. Heavy traffic pulls.',
  });
  tl.tween(cam, CAM_STRIP, { at: 42.7, dur: 1.4, ease: ease.move });
  tl.tween(pushU, 1, { at: 43.6, dur: 3.0, ease: ease.linear });
  tl.hold(49.5, 0.5);

  // — Beat 8 · the price of scaling out —
  tl.caption({
    at: 50.0,
    dur: 7.5,
    text: 'One last bill to read. Scaling out means cloned, stateless servers, sessions in a shared store, and every downstream cache and database answering more simultaneous connections. Nothing in this book was free. It was all just cheaper than the outage.',
  });
  tl.tween(costU, 1, { at: 51.0, dur: 1.2, ease: ease.enter });
  tl.hold(56.5, 0.5);

  // — Beat 9 · series close —
  tl.caption({
    at: 57.0,
    dur: 7.5,
    text: 'And that completes the tour: a name becomes an address, an edge absorbs the distance, a balancer shares the load, and behind it all, stateless servers scale sideways. The request never knows how many machines conspired to answer it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 57.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 57.8, dur: 1.5, ease: ease.move });
  tl.hold(65.0, 1.5);

  return { tl, cam, stripU, dnsU, dnsK, cacheDnsU, pull1, stickU, ttlU, pull2, pushU, staleU, costU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function TtlArc({ cx, cy, r, u, color }: { cx: number; cy: number; r: number; u: number; color: string }) {
  const frac = Math.max(0.001, 1 - u);
  const a = frac * Math.PI * 2;
  const x = cx + r * Math.sin(a);
  const y = cy - r * Math.cos(a);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.GRID} strokeWidth={1.4} />
      <path d={`M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y} Z`} fill={color} opacity={0.7} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const stripU = s.get(scene.stripU);
  const dnsU = s.get(scene.dnsU);
  const dnsK = s.get(scene.dnsK);
  const cacheDnsU = s.get(scene.cacheDnsU);
  const pull1 = s.get(scene.pull1);
  const stickU = s.get(scene.stickU);
  const ttlU = s.get(scene.ttlU);
  const pull2 = s.get(scene.pull2);
  const pushU = s.get(scene.pushU);
  const staleU = s.get(scene.staleU);
  const costU = s.get(scene.costU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;
  const kDns = Math.floor(dnsK + 0.001);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the strip: user · edges · origin ---- */}
        <g opacity={stripU * dimAll}>
          <line x1={USER.x} y1={USER.y} x2={ORIGIN.x} y2={ORIGIN.y} stroke={colors.GRID} strokeWidth={1.2} strokeDasharray="3 7" opacity={0.6} />
          {/* user */}
          <circle cx={USER.x} cy={USER.y} r={20} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
          <text x={USER.x} y={USER.y + 44} textAnchor="middle" fill={colors.ACCENT} fontSize={12}>
            the user
          </text>
          {/* edges */}
          {EDGES.map((e, i) => (
            <g key={i}>
              <rect x={e.x - 55} y={e.y - 28} width={110} height={56} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={e.x} y={e.y + 4} textAnchor="middle" fill={colors.WARM} fontSize={10.5}>
                {e.label}
              </text>
              {/* cached copy chip at edge 0 */}
              {i === 0 && stickU > 0.05 && (
                <g opacity={stickU}>
                  <rect x={e.x - 34} y={e.y - 62} width={68} height={24} rx={5} fill={colors.BG} stroke={staleU > 0.4 ? colors.NEGATIVE : colors.POSITIVE} strokeWidth={1.3} />
                  <text x={e.x} y={e.y - 46} textAnchor="middle" fill={staleU > 0.4 ? colors.NEGATIVE : colors.POSITIVE} fontSize={8.5} fontFamily="ui-monospace, monospace">
                    hero.jpg {staleU > 0.4 ? '· stale?' : ''}
                  </text>
                  {ttlU > 0.02 && <TtlArc cx={e.x + 46} cy={e.y - 50} r={9} u={ttlU} color={colors.WARM} />}
                </g>
              )}
            </g>
          ))}
          {/* origin */}
          <rect x={ORIGIN.x - 70} y={ORIGIN.y - 34} width={140} height={68} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
          <text x={ORIGIN.x} y={ORIGIN.y - 2} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>
            your origin
          </text>
          <text x={ORIGIN.x} y={ORIGIN.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily="ui-monospace, monospace">
            an ocean away
          </text>
        </g>

        {/* ---- DNS ladder ---- */}
        <g opacity={dnsU * dimAll}>
          <rect x={190} y={110} width={460} height={150} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
          <text x={210} y={138} fill={colors.TEXT} fontSize={12.5}>
            resolving the name
          </text>
          {DNS_STEPS.map((st, i) => {
            const on = i < kDns;
            return (
              <g key={i} opacity={on ? 1 : 0.2}>
                <text x={230} y={166 + i * 26} fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  {st.q}
                </text>
                <text x={470} y={166 + i * 26} fill={i === 2 ? colors.POSITIVE : colors.TEXT} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  → {st.a}
                </text>
              </g>
            );
          })}
          <g opacity={cacheDnsU}>
            <text x={210} y={246} fill={colors.WARM} fontSize={10} fontFamily="ui-monospace, monospace">
              cached by browser + OS under a TTL · NS · MX · A · CNAME
            </text>
          </g>
        </g>

        {/* ---- pull request 1: the long haul ---- */}
        {pull1 > 0 && pull1 < 1 && (() => {
          // out to origin (0..0.55), back with the copy (0.55..1)
          if (pull1 < 0.55) {
            const u = pull1 / 0.55;
            return <circle cx={lerp(USER.x + 24, ORIGIN.x - 74, u)} cy={USER.y - 8} r={6} fill={colors.ACCENT} opacity={dimAll} />;
          }
          const u = (pull1 - 0.55) / 0.45;
          return <circle cx={lerp(ORIGIN.x - 74, USER.x + 24, u)} cy={USER.y + 8} r={6} fill={colors.POSITIVE} opacity={dimAll} />;
        })()}

        {/* ---- pull request 2: the short hop ---- */}
        {pull2 > 0 && pull2 < 1 && (() => {
          if (pull2 < 0.5) {
            const u = pull2 / 0.5;
            return <circle cx={lerp(USER.x + 24, EDGES[0].x - 59, u)} cy={USER.y - 8} r={6} fill={colors.ACCENT} opacity={dimAll} />;
          }
          const u = (pull2 - 0.5) / 0.5;
          return <circle cx={lerp(EDGES[0].x - 59, USER.x + 24, u)} cy={USER.y + 8} r={6} fill={colors.WARM} opacity={dimAll} />;
        })()}
        {pull2 >= 1 && (
          <text x={(USER.x + EDGES[0].x) / 2} y={USER.y - 40} textAnchor="middle" fill={colors.WARM} fontSize={11} fontStyle="italic" opacity={dimAll * (1 - pushU)}>
            stops here — the origin never hears about it
          </text>
        )}

        {/* ---- push preload ---- */}
        {pushU > 0 &&
          EDGES.map((e, i) => {
            const u = clamp01(pushU * 1.6 - i * 0.35);
            if (u <= 0 || u >= 1) return null;
            return <circle key={i} cx={lerp(ORIGIN.x - 74, e.x + 59, u)} cy={ORIGIN.y - 12} r={6} fill={colors.SECONDARY} opacity={dimAll} />;
          })}
        {pushU > 0.8 && (
          <text x={700} y={330} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily="ui-monospace, monospace" opacity={dimAll}>
            push: upload on change · rewrite URLs to the CDN
          </text>
        )}

        {/* ---- horizontal scaling price chips ---- */}
        <g opacity={costU * dimAll}>
          {[
            'servers must be stateless — no sessions, no local files',
            'sessions move to a shared store · Redis / Memcached',
            'downstream caches + databases: more simultaneous connections',
          ].map((t, i) => (
            <g key={i}>
              <rect x={280} y={490 + i * 40} width={720} height={32} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={640} y={511 + i * 40} textAnchor="middle" fill={i === 0 ? colors.ACCENT : colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
                {t}
              </text>
            </g>
          ))}
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={255} y={195} width={770} height={280} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={244} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the request's journey
          </text>
          {[
            ['name', 'DNS resolves it once, then caches under a TTL'],
            ['distance', 'a CDN edge answers from nearby — push or pull'],
            ['door', 'a balancer routes by envelope or by meaning'],
            ['fleet', 'stateless clones scale sideways behind it'],
          ].map(([k, v], i) => (
            <g key={k}>
              <text x={420} y={292 + i * 38} textAnchor="end" fill={colors.ACCENT} fontSize={14} fontFamily="ui-monospace, monospace">
                {k}
              </text>
              <text x={448} y={292 + i * 38} fill={colors.MUTED} fontSize={13}>
                {v}
              </text>
            </g>
          ))}
          <text x={640} y={448} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            grounded in the system design primer's core sections
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
