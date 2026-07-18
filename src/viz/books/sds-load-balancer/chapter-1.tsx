// Meet the Traffic Cop: what a load balancer actually does
//
// Backed by: the system-design-primer main README, "Load balancer" section —
// load balancers distribute incoming client requests across servers and are
// effective at: preventing requests from going to unhealthy servers,
// preventing overloading resources, and helping eliminate a single point of
// failure; implemented in hardware (expensive) or software like HAProxy;
// extra duties: SSL termination (decrypt once, spare the backends, one place
// for certificates) and session persistence (cookies pin a client to an
// instance); routing metrics: random, least loaded, session/cookies, round
// robin or weighted round robin; and the sting in the tail — a single load
// balancer is itself a single point of failure, so run them in active-passive
// or active-active pairs.
//
// ONE machine: a dispatcher between a stream of requests and four servers.
// We watch round robin deal packets like cards, a server go unhealthy and get
// routed around, the routing dial switch to least-loaded, SSL terminate at
// the door, and finally the dispatcher itself duplicate into a failover pair.
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

const LB = { x: 520, y: 360 } as const;
const SERVERS = [
  { x: 950, y: 165 },
  { x: 950, y: 295 },
  { x: 950, y: 425 },
  { x: 950, y: 555 },
] as const;

// precomputed request schedule: each request has a birth time and a target
// under round robin (i % 4) — during the "sick server" window, server 1 is
// skipped; during least-loaded, targets follow the load table below.
const rand = mulberry32(20260723);
const N_REQ = 46;
interface Req {
  delay: number; // 0..1 within its phase
  rr: number; // round robin target
  ll: number; // least-loaded target
  y: number;
}
const REQS: Req[] = Array.from({ length: N_REQ }, (_, i) => ({
  delay: i / N_REQ,
  rr: i % 4,
  ll: [0, 2, 3, 0, 2][i % 5], // server 1 busy: least-loaded avoids it
  y: 250 + rand() * 220,
}));

// server load bars during the least-loaded demo
const LOADS = [0.35, 0.85, 0.4, 0.3] as const;

const CAM_LB: CameraState = { x: 660, y: 360, k: 1.15 };
const CAM_SICK: CameraState = { x: 880, y: 300, k: 1.3 };
const CAM_SSL: CameraState = { x: 480, y: 360, k: 1.4 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rigU: ChannelRef<number>;
  rrU: ChannelRef<number>;
  sickU: ChannelRef<number>;
  reroute: ChannelRef<number>;
  dialK: ChannelRef<number>;
  llU: ChannelRef<number>;
  loadU: ChannelRef<number>;
  sslU: ChannelRef<number>;
  stickU: ChannelRef<number>;
  pairU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rigU = tl.channel('rigU', 0); // dispatcher + servers
  const rrU = tl.channel('rrU', 0); // round robin dealing
  const sickU = tl.channel('sickU', 0); // server 1 goes red
  const reroute = tl.channel('reroute', 0); // traffic avoiding the sick one
  const dialK = tl.channel('dialK', 0); // routing policy dial 0=rr 1=least
  const llU = tl.channel('llU', 0); // least-loaded traffic
  const loadU = tl.channel('loadU', 0); // load bars appear
  const sslU = tl.channel('sslU', 0); // ssl termination inset
  const stickU = tl.channel('stickU', 0); // session persistence cookie
  const pairU = tl.channel('pairU', 0); // active-passive pair
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the job —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'One server can only take so much. The moment you have two, you need someone at the door deciding who handles what. That someone is the load balancer.',
  });
  tl.tween(cam, CAM_LB, { at: 0.7, dur: 1.5, ease: ease.move });
  tl.tween(rigU, 1, { at: 0.9, dur: 1.8, ease: ease.draw });
  tl.hold(7.0, 0.5);

  // — Beat 2 · round robin —
  tl.caption({
    at: 7.5,
    dur: 6.5,
    text: 'Its simplest strategy is round robin: deal the requests out like cards, one to each server in turn. Fair, predictable, and completely blind to how busy anyone is.',
  });
  tl.tween(rrU, 1, { at: 8.0, dur: 5.0, ease: ease.linear });
  tl.hold(14.5, 0.5);

  // — Beat 3 · health checks —
  tl.caption({
    at: 15.0,
    dur: 6.5,
    text: 'Now the first superpower: health checks. Server two stops answering, and the balancer simply stops sending it traffic. Users never learn that anything died.',
  });
  tl.tween(cam, CAM_SICK, { at: 15.2, dur: 1.4, ease: ease.move });
  tl.tween(sickU, 1, { at: 16.2, dur: 0.8, ease: ease.pop });
  tl.tween(reroute, 1, { at: 17.2, dur: 3.6, ease: ease.linear });
  tl.hold(22.0, 0.5);

  // — Beat 4 · least loaded —
  tl.caption({
    at: 22.5,
    dur: 7,
    text: 'The dial has more settings: random, least loaded, or sticky by session. Switch to least loaded, and traffic starts flowing around the busy machine like water around a rock.',
  });
  tl.tween(cam, CAM_LB, { at: 22.7, dur: 1.4, ease: ease.move });
  tl.set(dialK, 1, 24.0);
  tl.tween(loadU, 1, { at: 24.0, dur: 1.0, ease: ease.enter });
  tl.tween(llU, 1, { at: 25.0, dur: 4.0, ease: ease.linear });
  tl.hold(29.5, 0.5);

  // — Beat 5 · ssl termination —
  tl.caption({
    at: 30.0,
    dur: 7,
    text: 'Second superpower: the encryption ends at the door. The balancer decrypts incoming requests and encrypts the responses, so the backends never pay that cost, and certificates live in exactly one place.',
  });
  tl.tween(cam, CAM_SSL, { at: 30.2, dur: 1.4, ease: ease.move });
  tl.tween(sslU, 1, { at: 30.8, dur: 1.2, ease: ease.enter });
  tl.hold(36.5, 0.5);

  // — Beat 6 · session persistence —
  tl.caption({
    at: 37.0,
    dur: 6,
    text: 'And if the web servers still keep sessions in memory, the balancer can issue a cookie and pin each client to the same instance, so nobody gets logged out mid conversation.',
  });
  tl.tween(stickU, 1, { at: 37.8, dur: 1.2, ease: ease.enter });
  tl.hold(42.5, 0.5);

  // — Beat 7 · who balances the balancer —
  tl.caption({
    at: 43.0,
    dur: 7,
    text: 'But notice what we just built: every request now flows through one box. The load balancer that eliminated your single point of failure has become one. So it runs as a pair, active and passive, or both active at once.',
  });
  tl.tween(cam, CAM_LB, { at: 43.2, dur: 1.4, ease: ease.move });
  tl.tween(pairU, 1, { at: 45.4, dur: 1.4, ease: ease.move });
  tl.hold(49.5, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 50.0,
    dur: 7,
    text: 'Hardware balancers exist and cost a fortune. Software like h a proxy does the same job on commodity machines. Either way, the traffic cop only reads envelopes so far. Next chapter, it learns to open the mail.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.2, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 50.8, dur: 1.4, ease: ease.move });
  tl.hold(57.0, 1.5);

  return { tl, cam, rigU, rrU, sickU, reroute, dialK, llU, loadU, sslU, stickU, pairU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rigU = s.get(scene.rigU);
  const rrU = s.get(scene.rrU);
  const sickU = s.get(scene.sickU);
  const reroute = s.get(scene.reroute);
  const dialK = s.get(scene.dialK);
  const llU = s.get(scene.llU);
  const loadU = s.get(scene.loadU);
  const sslU = s.get(scene.sslU);
  const stickU = s.get(scene.stickU);
  const pairU = s.get(scene.pairU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;
  const dial = Math.round(dialK);

  // active phase for packet animation
  const phase: { t: number; pick: (r: Req) => number } | null =
    llU > 0
      ? { t: llU, pick: (r) => r.ll }
      : reroute > 0
        ? { t: reroute, pick: (r) => (r.rr === 1 ? (r.rr + 1) % 4 : r.rr) }
        : rrU > 0
          ? { t: rrU, pick: (r) => r.rr }
          : null;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- incoming stream ---- */}
        <g opacity={rigU * dimAll}>
          <text x={90} y={330} fill={colors.MUTED} fontSize={12} fontStyle="italic">
            requests
          </text>
        </g>

        {/* ---- the dispatcher ---- */}
        <g opacity={rigU * dimAll}>
          <rect x={LB.x - 85} y={LB.y - 75} width={170} height={150} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
          <text x={LB.x} y={LB.y - 46} textAnchor="middle" fill={colors.ACCENT} fontSize={14.5}>
            Load Balancer
          </text>
          <text x={LB.x} y={LB.y - 26} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
            HAProxy / hardware
          </text>
          {/* the routing dial */}
          <circle cx={LB.x} cy={LB.y + 18} r={26} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.4} />
          <line
            x1={LB.x}
            y1={LB.y + 18}
            x2={LB.x + 22 * Math.cos(-Math.PI / 2 + dialK * 1.2)}
            y2={LB.y + 18 + 22 * Math.sin(-Math.PI / 2 + dialK * 1.2)}
            stroke={colors.WARM}
            strokeWidth={2.5}
          />
          <text x={LB.x} y={LB.y + 62} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily="ui-monospace, monospace">
            {dial === 0 ? 'round robin' : 'least loaded'}
          </text>
          {/* passive twin */}
          <g opacity={pairU}>
            <rect x={LB.x - 85 + 14} y={LB.y - 75 + 14} width={170} height={150} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} opacity={0.9} />
            <text x={LB.x + 14} y={LB.y + 92} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              active–passive failover
            </text>
          </g>
        </g>

        {/* ---- the servers ---- */}
        {SERVERS.map((sv, i) => {
          const dead = i === 1 && sickU > 0.4;
          return (
            <g key={i} opacity={rigU * dimAll}>
              <rect x={sv.x - 75} y={sv.y - 34} width={150} height={68} rx={10} fill={colors.PANEL} stroke={dead ? colors.NEGATIVE : colors.GRID} strokeWidth={dead ? 2 : 1.3} />
              <text x={sv.x} y={sv.y - 6} textAnchor="middle" fill={dead ? colors.NEGATIVE : colors.TEXT} fontSize={12.5}>
                server {i + 1} {dead ? '· down' : ''}
              </text>
              {/* health dot */}
              <circle cx={sv.x - 58} cy={sv.y - 18} r={5} fill={dead ? colors.NEGATIVE : colors.POSITIVE} />
              {/* load bar for least-loaded demo */}
              <g opacity={loadU}>
                <rect x={sv.x - 60} y={sv.y + 10} width={120} height={10} rx={4} fill={colors.BG} stroke={colors.GRID} />
                <rect x={sv.x - 60} y={sv.y + 10} width={120 * LOADS[i]} height={10} rx={4} fill={LOADS[i] > 0.7 ? colors.NEGATIVE : colors.POSITIVE} opacity={0.85} />
              </g>
              {/* sticky cookie pin */}
              {stickU > 0.05 && i === 2 && (
                <g opacity={stickU}>
                  <circle cx={sv.x + 58} cy={sv.y - 18} r={8} fill={colors.WARM} opacity={0.9} />
                  <text x={sv.x + 58} y={sv.y + 40 + 14} textAnchor="middle" fill={colors.WARM} fontSize={9.5} fontFamily="ui-monospace, monospace">
                    session cookie → always here
                  </text>
                </g>
              )}
              <line x1={LB.x + 85} y1={LB.y} x2={sv.x - 75} y2={sv.y} stroke={dead ? colors.NEGATIVE : colors.GRID} strokeWidth={1.1} opacity={dead ? 0.3 : 0.6} strokeDasharray={dead ? '4 6' : undefined} />
            </g>
          );
        })}

        {/* ---- packets ---- */}
        {phase &&
          REQS.map((r, i) => {
            const u = clamp01((phase.t - r.delay * 0.85) * 3.2);
            if (u <= 0 || u >= 1) return null;
            const target = SERVERS[phase.pick(r)];
            // two segments: inflow → LB, LB → server
            if (u < 0.45) {
              const v = u / 0.45;
              return <circle key={i} cx={lerp(120, LB.x - 85, v)} cy={lerp(r.y, LB.y, v)} r={4.5} fill={colors.ACCENT} opacity={0.85} />;
            }
            const v = (u - 0.45) / 0.55;
            return <circle key={i} cx={lerp(LB.x + 85, target.x - 75, v)} cy={lerp(LB.y, target.y, v)} r={4.5} fill={colors.POSITIVE} opacity={0.85} />;
          })}

        {/* ---- ssl inset ---- */}
        <g opacity={sslU * dimAll}>
          <rect x={250} y={470} width={230} height={110} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.3} />
          <text x={365} y={498} textAnchor="middle" fill={colors.WARM} fontSize={12.5}>
            SSL termination
          </text>
          <text x={365} y={522} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily="ui-monospace, monospace">
            encrypted → [decrypt] → plain
          </text>
          <text x={365} y={546} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
            certificates live here, once
          </text>
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={280} y={215} width={720} height={240} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={264} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            what the traffic cop guarantees
          </text>
          {[
            'no request visits an unhealthy server',
            'no server drowns while a neighbor idles',
            'encryption and certificates handled at the door',
            'and the cop itself runs as a redundant pair',
          ].map((t, i) => (
            <text key={i} x={640} y={310 + i * 32} textAnchor="middle" fill={i === 3 ? colors.ACCENT : colors.MUTED} fontSize={13.5}>
              {t}
            </text>
          ))}
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
