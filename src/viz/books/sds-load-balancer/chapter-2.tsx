// Layer Four, Layer Seven: reading the envelope vs opening the mail
//
// Backed by: the system-design-primer main README — "Layer 4 load balancing"
// (decisions from the transport layer: source and destination IP addresses
// and ports in the header, NOT the packet contents; forwards packets with
// network address translation), "Layer 7 load balancing" (decisions from the
// application layer: headers, message, cookies; terminates the connection,
// reads the message, picks a server, opens a new connection — e.g. video
// traffic to video servers, sensitive billing traffic to security-hardened
// servers; layer 4 costs less time and compute, layer 7 buys flexibility),
// and "Reverse proxy (web server)" — a reverse proxy is useful even with ONE
// server: hide the backends, blacklist IPs, limit connections per client,
// SSL termination, cache responses, compress, serve static content directly;
// NGINX and HAProxy can do both layer 7 reverse proxying and load balancing;
// both add complexity and are a single point of failure unless doubled.
//
// ONE machine: a letter. The same request drawn as an envelope goes through
// two doors — the layer four door reads only the address and stamps it
// through; the layer seven door opens it, reads the contents, and routes
// video to the video lane and billing to the hardened lane. Then one reverse
// proxy stands in front of a single server and shows its six small jobs.
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

const L4 = { x: 430, y: 230 } as const;
const L7 = { x: 430, y: 470 } as const;
const LANES = [
  { x: 1000, y: 390, label: 'video servers', color: colors.SECONDARY },
  { x: 1000, y: 540, label: 'hardened billing servers', color: colors.WARM },
] as const;
const L4_OUT = { x: 1000, y: 230 } as const;

const PROXY = { x: 560, y: 360 } as const;

// reverse proxy duties (from the README list)
const DUTIES = [
  'hide the backends',
  'blacklist IPs · limit connections',
  'SSL termination',
  'cache responses',
  'compression',
  'serve static content directly',
] as const;

const CAM_L4: CameraState = { x: 620, y: 230, k: 1.3 };
const CAM_L7: CameraState = { x: 640, y: 460, k: 1.25 };
const CAM_PROXY: CameraState = { x: 700, y: 360, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  envU: ChannelRef<number>;
  l4U: ChannelRef<number>;
  l4Go: ChannelRef<number>;
  l7U: ChannelRef<number>;
  openU: ChannelRef<number>;
  vidGo: ChannelRef<number>;
  bilGo: ChannelRef<number>;
  actsU: ChannelRef<number>;
  proxyU: ChannelRef<number>;
  dutyK: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const envU = tl.channel('envU', 0); // the envelope appears
  const l4U = tl.channel('l4U', 0); // layer 4 door
  const l4Go = tl.channel('l4Go', 0); // envelope forwarded unopened
  const l7U = tl.channel('l7U', 0); // layer 7 door
  const openU = tl.channel('openU', 0); // the letter opens
  const vidGo = tl.channel('vidGo', 0); // video letter → video lane
  const bilGo = tl.channel('bilGo', 0); // billing letter → hardened lane
  const actsU = tl.channel('actsU', 0); // cost comparison chips
  const proxyU = tl.channel('proxyU', 0); // reverse proxy act
  const dutyK = tl.channel('dutyK', 0); // duties reveal 0..6
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the envelope —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'Every request is a letter. On the outside, an envelope: where it came from and where it is going, addresses and ports. Inside, the actual message.',
  });
  tl.tween(envU, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  tl.hold(6.5, 0.5);

  // — Beat 2 · layer 4 —
  tl.caption({
    at: 7.0,
    dur: 7,
    text: 'A layer four balancer reads only the envelope. Source, destination, port, done. It rewrites the address and forwards the packet without ever looking inside. That refusal to open the mail is exactly why it is fast and cheap.',
  });
  tl.tween(cam, CAM_L4, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.tween(l4U, 1, { at: 7.4, dur: 1.0, ease: ease.enter });
  tl.tween(l4Go, 1, { at: 9.6, dur: 2.8, ease: ease.linear });
  tl.hold(14.5, 0.5);

  // — Beat 3 · layer 7 —
  tl.caption({
    at: 15.0,
    dur: 6.5,
    text: 'A layer seven balancer opens the letter. It terminates the connection, reads the headers, the message, the cookies, and only then decides who should handle it.',
  });
  tl.tween(cam, CAM_L7, { at: 15.2, dur: 1.4, ease: ease.move });
  tl.tween(l7U, 1, { at: 15.4, dur: 1.0, ease: ease.enter });
  tl.tween(openU, 1, { at: 17.2, dur: 1.4, ease: ease.move });
  tl.hold(21.5, 0.5);

  // — Beat 4 · content routing —
  tl.caption({
    at: 22.0,
    dur: 7,
    text: 'And that buys real routing intelligence: the video request goes to the servers built for video, while the billing request goes to the security hardened ones. Same front door, different rooms.',
  });
  tl.tween(vidGo, 1, { at: 22.8, dur: 2.6, ease: ease.linear });
  tl.tween(bilGo, 1, { at: 25.0, dur: 2.6, ease: ease.linear });
  tl.hold(29.0, 0.5);

  // — Beat 5 · the trade —
  tl.caption({
    at: 29.5,
    dur: 6,
    text: 'The trade is honest: layer four spends less time and compute per request, layer seven buys flexibility. On modern commodity hardware, the difference is often small enough to choose flexibility.',
  });
  tl.tween(actsU, 1, { at: 30.4, dur: 1.0, ease: ease.enter });
  tl.hold(35.5, 0.5);

  // — Beat 6 · the reverse proxy —
  tl.caption({
    at: 36.0,
    dur: 7,
    text: 'Now meet the load balancer’s twin: the reverse proxy. Same position, in front of the servers, but it earns its keep even when there is only one server behind it.',
  });
  tl.tween(cam, CAM_PROXY, { at: 36.2, dur: 1.4, ease: ease.move });
  tl.tween(envU, 0, { at: 36.2, dur: 1.0, ease: ease.move });
  tl.tween(proxyU, 1, { at: 37.0, dur: 1.2, ease: ease.enter });
  tl.hold(42.5, 0.5);

  // — Beat 7 · the duties —
  tl.caption({
    at: 43.0,
    dur: 8,
    text: 'It hides the backends from the world, blacklists abusive addresses, limits connections per client, ends encryption, caches responses, compresses them, and serves static files itself. Six small jobs, one calm doorman.',
  });
  tl.tween(dutyK, 6, { at: 43.6, dur: 6.4, ease: ease.linear });
  tl.hold(51.0, 0.5);

  // — Beat 8 · same software —
  tl.caption({
    at: 51.5,
    dur: 5.5,
    text: 'In practice the line blurs: the same software, engine x or h a proxy, plays both roles at once, reverse proxying and balancing from the same seat.',
  });
  tl.hold(57.0, 0.5);

  // — Beat 9 · close —
  tl.caption({
    at: 57.5,
    dur: 6,
    text: 'One caution carries over from last chapter: any single doorman is a single point of failure. Double them. Next, we leave the building entirely and follow the request across the planet.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 57.7, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 58.3, dur: 1.4, ease: ease.move });
  tl.hold(63.5, 1.5);

  return { tl, cam, envU, l4U, l4Go, l7U, openU, vidGo, bilGo, actsU, proxyU, dutyK, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Envelope({ x, y, open = 0, label, color = colors.TEXT, opacity = 1, w = 110, h = 70 }: {
  x: number; y: number; open?: number; label?: string; color?: string; opacity?: number; w?: number; h?: number;
}) {
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      {/* flap */}
      <path
        d={`M ${x - w / 2} ${y - h / 2} L ${x} ${y - h / 2 + (1 - open) * h * 0.45 - open * 26} L ${x + w / 2} ${y - h / 2}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
      {/* letter peeking out when open */}
      {open > 0.15 && (
        <rect x={x - w / 2 + 12} y={y - h / 2 - 20 * open} width={w - 24} height={22 * open} rx={3} fill={colors.BG} stroke={colors.GRID} strokeWidth={1} />
      )}
      {label && (
        <text x={x} y={y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily="ui-monospace, monospace">
          {label}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const envU = s.get(scene.envU);
  const l4U = s.get(scene.l4U);
  const l4Go = s.get(scene.l4Go);
  const l7U = s.get(scene.l7U);
  const openU = s.get(scene.openU);
  const vidGo = s.get(scene.vidGo);
  const bilGo = s.get(scene.bilGo);
  const actsU = s.get(scene.actsU);
  const proxyU = s.get(scene.proxyU);
  const dutyK = s.get(scene.dutyK);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;
  const nDuty = Math.floor(dutyK + 0.001);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* =================== the two doors =================== */}
        <g opacity={envU * dimAll * (1 - proxyU)}>
          {/* layer 4 door */}
          <g opacity={l4U}>
            <rect x={L4.x - 90} y={L4.y - 60} width={180} height={120} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
            <text x={L4.x} y={L4.y - 32} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5}>
              layer 4
            </text>
            <text x={L4.x} y={L4.y - 12} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
              src ip:port → dst ip:port
            </text>
            <text x={L4.x} y={L4.y + 44} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
              forwards packets · NAT
            </text>
          </g>
          {/* the unopened envelope rides through the L4 door */}
          {(() => {
            const x = lerp(150, L4_OUT.x, l4Go);
            return <Envelope x={x} y={L4.y} label="to: 10.0.0.7:443" color={colors.ACCENT} opacity={l4Go < 1 ? 1 : 0.4} />;
          })()}
          {l4Go > 0.2 && l4Go < 0.9 && (
            <text x={L4.x} y={L4.y + 78} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontStyle="italic">
              never opened
            </text>
          )}

          {/* layer 7 door */}
          <g opacity={l7U}>
            <rect x={L7.x - 90} y={L7.y - 60} width={180} height={120} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
            <text x={L7.x} y={L7.y - 32} textAnchor="middle" fill={colors.SECONDARY} fontSize={13.5}>
              layer 7
            </text>
            <text x={L7.x} y={L7.y - 12} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
              headers · message · cookies
            </text>
            <text x={L7.x} y={L7.y + 44} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
              terminate → read → reconnect
            </text>
          </g>
          {/* two letters at the L7 door, opened then routed */}
          {l7U > 0.5 && (() => {
            const lanes = [
              { go: vidGo, lane: LANES[0], tag: 'GET /video' },
              { go: bilGo, lane: LANES[1], tag: 'POST /billing' },
            ];
            return lanes.map((L, i) => {
              const x = lerp(L7.x + 130, L.lane.x - 90, L.go);
              const y = lerp(L7.y - 10 + i * 26, L.lane.y, L.go);
              return (
                <g key={i}>
                  <Envelope x={x} y={y} open={openU} label={openU > 0.4 ? L.tag : undefined} color={L.lane.color} w={100} h={58} />
                </g>
              );
            });
          })()}
          {/* the lanes */}
          {LANES.map((l, i) => (
            <g key={i} opacity={l7U}>
              <rect x={l.x - 90} y={l.y - 34} width={200} height={68} rx={10} fill={colors.PANEL} stroke={l.color} strokeWidth={1.4} />
              <text x={l.x + 10} y={l.y + 4} textAnchor="middle" fill={l.color} fontSize={11.5}>
                {l.label}
              </text>
            </g>
          ))}
          {/* L4 destination */}
          <g opacity={l4U}>
            <rect x={L4_OUT.x - 60} y={L4.y - 26} width={170} height={52} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={L4_OUT.x + 25} y={L4.y + 5} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              upstream server
            </text>
          </g>
          {/* cost chips */}
          <g opacity={actsU}>
            <text x={640} y={104} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
              layer 4: less time, less compute · layer 7: routing by meaning
            </text>
          </g>
        </g>

        {/* =================== the reverse proxy =================== */}
        <g opacity={proxyU * dimAll}>
          <rect x={PROXY.x - 90} y={PROXY.y - 80} width={180} height={160} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
          <text x={PROXY.x} y={PROXY.y - 50} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
            Reverse Proxy
          </text>
          <text x={PROXY.x} y={PROXY.y - 30} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
            NGINX / HAProxy
          </text>
          {/* the single server behind it */}
          <rect x={PROXY.x + 240} y={PROXY.y - 34} width={150} height={68} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
          <text x={PROXY.x + 315} y={PROXY.y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
            one server
          </text>
          <line x1={PROXY.x + 90} y1={PROXY.y} x2={PROXY.x + 240} y2={PROXY.y} stroke={colors.GRID} strokeWidth={1.3} />
          <line x1={150} y1={PROXY.y} x2={PROXY.x - 90} y2={PROXY.y} stroke={colors.GRID} strokeWidth={1.3} />
          <text x={150} y={PROXY.y - 14} fill={colors.MUTED} fontSize={11} fontStyle="italic">
            the internet
          </text>
          {/* duties light up one by one */}
          {DUTIES.map((d, i) => {
            const on = i < nDuty;
            const flash = i === nDuty - 1;
            return (
              <g key={d} opacity={on ? 1 : 0.15}>
                <rect x={280} y={120 + i * 38} width={300} height={30} rx={7} fill={colors.PANEL} stroke={flash ? colors.WARM : colors.GRID} strokeWidth={flash ? 1.8 : 1} />
                <text x={430} y={140 + i * 38} textAnchor="middle" fill={on ? colors.TEXT : colors.MUTED} fontSize={11.5}>
                  {d}
                </text>
              </g>
            );
          })}
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={280} y={220} width={720} height={230} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={270} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            two doormen, one seat
          </text>
          <text x={640} y={320} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5}>
            layer 4 reads the envelope · layer 7 reads the letter
          </text>
          <text x={640} y={352} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
            a reverse proxy earns its keep behind even one server
          </text>
          <text x={640} y={404} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            and every single doorman must be doubled
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
