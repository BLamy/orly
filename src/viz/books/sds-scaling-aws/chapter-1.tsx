// One Box: where every system starts
//
// Backed by: solutions/system_design/scaling_aws/README.md — Step 1
// constraints (1 user growing to tens of millions; 10 million users, 1 billion
// writes/month, 100 billion reads/month, 100:1 read to write, 1 TB of new
// content a month) and Step 3 "Start with a single box": a web server on EC2
// with MySQL on the same machine; vertical scaling (choose a bigger box, watch
// CPU / memory / IO / network with CloudWatch, top, nagios, statsd, graphite);
// an Elastic IP; DNS via Route 53; securing the box (ports 80, 443, and 22
// for whitelisted IPs only); vertical scaling gets expensive and has no
// redundancy or failover. The iterative method: benchmark, profile, address
// the bottleneck, repeat.
//
// ONE machine: literally one box. Traffic trickles in, the internal meters
// climb, the box swells through instance sizes, the cost curve bends upward,
// and a single red X shows what happens when the only box dies.
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

const BOX = { x: 640, y: 360 } as const;
const METERS = ['CPU', 'memory', 'IO', 'network'] as const;

const rand = mulberry32(20260720);
const N_REQ = 34;
const REQS = Array.from({ length: N_REQ }, (_, i) => ({
  y: 240 + rand() * 240,
  delay: i / N_REQ,
  speed: 0.8 + rand() * 0.6,
}));

// vertical scaling: the box's size at each "bigger box" step
const SIZES = [1, 1.25, 1.55, 1.9] as const;
// cost curve points (x: size step, y: cost — super-linear)
const COST = [0.1, 0.24, 0.52, 1.0] as const;

const CAM_BOX: CameraState = { x: 640, y: 360, k: 1.25 };
const CAM_METERS: CameraState = { x: 700, y: 350, k: 1.5 };
const CAM_COST: CameraState = { x: 950, y: 300, k: 1.25 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  boxU: ChannelRef<number>;
  dnsU: ChannelRef<number>;
  trafU: ChannelRef<number>;
  meterU: ChannelRef<number>;
  loadU: ChannelRef<number>;
  sizeK: ChannelRef<number>;
  costU: ChannelRef<number>;
  portU: ChannelRef<number>;
  dieU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const boxU = tl.channel('boxU', 0); // the single box
  const dnsU = tl.channel('dnsU', 0); // route 53 + elastic ip
  const trafU = tl.channel('trafU', 0); // request dots
  const meterU = tl.channel('meterU', 0); // the four meters
  const loadU = tl.channel('loadU', 0); // meters climb
  const sizeK = tl.channel('sizeK', 0); // vertical scaling step 0..3
  const costU = tl.channel('costU', 0); // the cost curve
  const portU = tl.channel('portU', 0); // security ports
  const dieU = tl.channel('dieU', 0); // the box dies
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the whole company —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Every giant system starts the same way: one rented machine. A web server and a my sequel database, side by side on a single box, serving your first two users.',
  });
  tl.tween(cam, CAM_BOX, { at: 0.7, dur: 1.5, ease: ease.move });
  tl.tween(boxU, 1, { at: 0.9, dur: 1.4, ease: ease.enter });
  tl.hold(7.0, 0.5);

  // — Beat 2 · dns + ip —
  tl.caption({
    at: 7.5,
    dur: 6,
    text: 'Give it a public address that survives a reboot, point the domain name at it, and you are live. If the box ever has to be replaced, the domain just points somewhere new.',
  });
  tl.tween(dnsU, 1, { at: 8.2, dur: 1.2, ease: ease.enter });
  tl.hold(13.5, 0.5);

  // — Beat 3 · lock the doors —
  tl.caption({
    at: 14.0,
    dur: 6,
    text: 'Lock the doors before anyone knocks. Only three ports stay open: web traffic, secure web traffic, and remote login, that last one for whitelisted addresses only.',
  });
  tl.tween(portU, 1, { at: 14.8, dur: 1.2, ease: ease.enter });
  tl.hold(20.0, 0.5);

  // — Beat 4 · the method —
  tl.caption({
    at: 20.5,
    dur: 6.5,
    text: 'Now the discipline that carries this whole book: benchmark, profile, fix the one thing that is actually slow, and repeat. Never jump to the final architecture.',
  });
  tl.hold(27.0, 0.5);

  // — Beat 5 · load climbs —
  tl.caption({
    at: 27.5,
    dur: 7,
    text: 'Users arrive, and the meters start talking. Watch the processor, the memory, the disk, the network. Monitoring is how a single box tells you what it needs next.',
  });
  tl.tween(cam, CAM_METERS, { at: 27.7, dur: 1.5, ease: ease.move });
  tl.tween(meterU, 1, { at: 27.9, dur: 1.0, ease: ease.enter });
  tl.tween(trafU, 1, { at: 28.3, dur: 4.5, ease: ease.linear });
  tl.tween(loadU, 0.85, { at: 28.6, dur: 5.0, ease: ease.linear });
  tl.hold(34.5, 0.5);

  // — Beat 6 · vertical scaling —
  tl.caption({
    at: 35.0,
    dur: 7,
    text: 'The first answer is the simplest one: buy a bigger box. This is vertical scaling, and for a while it genuinely works. Each upgrade buys you headroom.',
  });
  tl.tween(cam, CAM_BOX, { at: 35.2, dur: 1.4, ease: ease.move });
  tl.set(sizeK, 1, 36.6);
  tl.tween(loadU, 0.45, { at: 36.6, dur: 0.8, ease: ease.move });
  tl.set(sizeK, 2, 38.6);
  tl.tween(loadU, 0.8, { at: 38.0, dur: 2.4, ease: ease.linear });
  tl.set(sizeK, 3, 40.6);
  tl.hold(42.0, 0.5);

  // — Beat 7 · the cost curve —
  tl.caption({
    at: 42.5,
    dur: 6.5,
    text: 'But look at the price of each step. Bigger boxes get expensive faster than they get bigger, and the web server and the database still cannot scale independently.',
  });
  tl.tween(cam, CAM_COST, { at: 42.7, dur: 1.4, ease: ease.move });
  tl.tween(costU, 1, { at: 43.4, dur: 2.2, ease: ease.draw });
  tl.hold(49.0, 0.5);

  // — Beat 8 · the real problem —
  tl.caption({
    at: 49.5,
    dur: 6.5,
    text: 'And there is a sharper problem than money. One box means one point of failure. When it goes down, and one day it will, everything you have goes down with it.',
  });
  tl.tween(cam, CAM_BOX, { at: 49.7, dur: 1.4, ease: ease.move });
  tl.tween(dieU, 1, { at: 51.4, dur: 1.2, ease: ease.move });
  tl.hold(56.0, 0.5);

  // — Beat 9 · close —
  tl.caption({
    at: 56.5,
    dur: 6.5,
    text: 'So the story of scaling is the story of taking this one box apart, carefully, one bottleneck at a time. That disassembly starts in the next chapter.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 56.7, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 57.3, dur: 1.4, ease: ease.move });
  tl.hold(63.0, 1.5);

  return { tl, cam, boxU, dnsU, trafU, meterU, loadU, sizeK, costU, portU, dieU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const boxU = s.get(scene.boxU);
  const dnsU = s.get(scene.dnsU);
  const trafU = s.get(scene.trafU);
  const meterU = s.get(scene.meterU);
  const loadU = s.get(scene.loadU);
  const sizeK = s.get(scene.sizeK);
  const costU = s.get(scene.costU);
  const portU = s.get(scene.portU);
  const dieU = s.get(scene.dieU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;
  const size = SIZES[Math.min(3, Math.max(0, Math.round(sizeK)))];
  const bw = 260 * size;
  const bh = 200 * size;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- traffic dots ---- */}
        <g opacity={dimAll * (1 - dieU * 0.8)}>
          {REQS.map((r, i) => {
            const u = clamp01((trafU - r.delay * 0.8) * r.speed * 2.2);
            if (u <= 0 || u >= 1) return null;
            return <circle key={i} cx={100 + u * (BOX.x - bw / 2 - 110)} cy={r.y} r={4.5} fill={colors.ACCENT} opacity={0.75} />;
          })}
        </g>

        {/* ---- the box ---- */}
        <g opacity={boxU * dimAll}>
          <rect x={BOX.x - bw / 2} y={BOX.y - bh / 2} width={bw} height={bh} rx={16} fill={colors.PANEL} stroke={dieU > 0.4 ? colors.NEGATIVE : colors.TEXT} strokeWidth={1.8} />
          <text x={BOX.x} y={BOX.y - bh / 2 - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            EC2 instance {sizeK > 0.5 ? '· a bigger box' : ''}
          </text>
          {/* web server + mysql inside */}
          <rect x={BOX.x - bw / 2 + 20} y={BOX.y - bh / 2 + 24} width={bw / 2 - 32} height={bh - 48} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.3} />
          <text x={BOX.x - bw / 4 - 6} y={BOX.y} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5 * size}>
            Web Server
          </text>
          <rect x={BOX.x + 12} y={BOX.y - bh / 2 + 24} width={bw / 2 - 32} height={bh - 48} rx={10} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.3} />
          <text x={BOX.x + bw / 4 - 6} y={BOX.y} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5 * size}>
            MySQL
          </text>
          {dieU > 0.4 && (
            <g opacity={dieU}>
              <line x1={BOX.x - bw / 2} y1={BOX.y - bh / 2} x2={BOX.x + bw / 2} y2={BOX.y + bh / 2} stroke={colors.NEGATIVE} strokeWidth={5} />
              <line x1={BOX.x + bw / 2} y1={BOX.y - bh / 2} x2={BOX.x - bw / 2} y2={BOX.y + bh / 2} stroke={colors.NEGATIVE} strokeWidth={5} />
              <text x={BOX.x} y={BOX.y + bh / 2 + 28} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13}>
                no redundancy · no failover
              </text>
            </g>
          )}
        </g>

        {/* ---- dns + elastic ip ---- */}
        <g opacity={dnsU * dimAll * (1 - dieU * 0.7)}>
          <rect x={90} y={120} width={180 } height={54} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
          <text x={180} y={143} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
            DNS · Route 53
          </text>
          <text x={180} y={161} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
            domain → Elastic IP
          </text>
          <line x1={270} y1={150} x2={BOX.x - bw / 2 - 8} y2={BOX.y - bh / 2 + 10} stroke={colors.GRID} strokeWidth={1.2} opacity={0.7} />
        </g>

        {/* ---- ports ---- */}
        <g opacity={portU * dimAll * (1 - dieU * 0.7)}>
          {['80 HTTP', '443 HTTPS', '22 SSH·allowlist'].map((p, i) => (
            <g key={p}>
              <rect x={BOX.x - 130 + i * 92} y={BOX.y + bh / 2 + 14} width={84} height={26} rx={6} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.1} />
              <text x={BOX.x - 88 + i * 92} y={BOX.y + bh / 2 + 31} textAnchor="middle" fill={colors.WARM} fontSize={8.5} fontFamily="ui-monospace, monospace">
                {p}
              </text>
            </g>
          ))}
        </g>

        {/* ---- the meters ---- */}
        <g opacity={meterU * dimAll}>
          {METERS.map((m, i) => {
            const v = clamp01(loadU * (0.75 + i * 0.12));
            const x = 900;
            const y = 210 + i * 66;
            return (
              <g key={m}>
                <text x={x - 10} y={y + 15} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                  {m}
                </text>
                <rect x={x} y={y} width={200} height={20} rx={6} fill={colors.BG} stroke={colors.GRID} />
                <rect x={x} y={y} width={200 * v} height={20} rx={6} fill={v > 0.75 ? colors.NEGATIVE : v > 0.5 ? colors.WARM : colors.POSITIVE} opacity={0.8} />
              </g>
            );
          })}
          <text x={900} y={182} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
            CloudWatch · top · statsd · graphite
          </text>
        </g>

        {/* ---- the cost curve ---- */}
        <g opacity={costU * dimAll}>
          <line x1={880} y1={560} x2={1180} y2={560} stroke={colors.GRID} strokeWidth={1.4} />
          <line x1={880} y1={560} x2={880} y2={440} stroke={colors.GRID} strokeWidth={1.4} />
          {COST.map((c, i) => {
            if (i === 0) return null;
            const u = clamp01(costU * 3 - (i - 1));
            const x0 = 880 + (i - 1) * 95;
            const x1 = 880 + i * 95;
            const y0 = 560 - COST[i - 1] * 110;
            const y1 = 560 - c * 110;
            return <line key={i} x1={x0} y1={y0} x2={lerp(x0, x1, u)} y2={lerp(y0, y1, u)} stroke={colors.NEGATIVE} strokeWidth={2.5} />;
          })}
          <text x={1030} y={588} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
            cost per upgrade — vertical scaling gets expensive
          </text>
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={290} y={225} width={700} height={220} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={276} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            benchmark · profile · fix · repeat
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.ACCENT} fontSize={14}>
            one box → tens of millions of users, one bottleneck at a time
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontStyle="italic">
            the target: a billion writes and a hundred billion reads a month
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
