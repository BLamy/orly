// The Great Unbundling: Users+ and Users++
//
// Backed by: solutions/system_design/scaling_aws/README.md — "Users+"
// (profiling shows MySQL eating memory and CPU while user content fills the
// disk: move static content to an Object Store like S3 — user files, JS, CSS,
// images, videos; move MySQL to a separate box managed by RDS with multiple
// availability zones; secure it all in a VPC with a public subnet for the web
// server and a private subnet for everything else) and "Users++" (the single
// web server bottlenecks at peak: add a Load Balancer — ELB or HAProxy — with
// SSL termination; multiple web servers across availability zones; MySQL
// master-slave failover; split Web Servers from Application Servers so each
// layer scales independently; move static content to a CDN like CloudFront).
//
// ONE machine: the single box from chapter one sits center stage and comes
// apart. Static files fly to S3, the database slides out to RDS, a VPC fence
// draws itself, then the box multiplies behind a load balancer and the CDN
// takes the static traffic away entirely.
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

// VPC fence: public subnet (web tier) on the left, private subnet (data tier) on the right
const VPC = { x: 270, y: 165, w: 960, h: 400 } as const;
const PUB = { x: 300, y: 200, w: 420, h: 345 } as const;
const PRIV = { x: 750, y: 200, w: 460, h: 345 } as const;

const BOX = { x: 600, y: 380 } as const;
const S3 = { x: 1090, y: 100 } as const; // regional service, outside the VPC
const RDS = { x: 980, y: 300 } as const;
const LB = { x: 390, y: 380 } as const;
const CDN = { x: 250, y: 100 } as const; // edge, outside the VPC

// static assets that fly to S3
const ASSETS = ['user files', 'JS', 'CSS', 'images', 'videos'] as const;

// the web server fleet after horizontal scaling
const FLEET = [
  { x: 600, y: 255, az: 'az-1' },
  { x: 600, y: 375, az: 'az-1' },
  { x: 600, y: 495, az: 'az-2' },
] as const;

const rand = mulberry32(20260721);
const N_REQ = 24;
const REQS = Array.from({ length: N_REQ }, (_, i) => ({
  delay: i / N_REQ,
  lane: Math.floor(rand() * 3),
  cdn: rand() < 0.4,
}));

const CAM_BOX: CameraState = { x: 600, y: 360, k: 1.15 };
const CAM_S3: CameraState = { x: 760, y: 300, k: 1 };
const CAM_LB: CameraState = { x: 640, y: 340, k: 1.05 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  boxU: ChannelRef<number>;
  flyU: ChannelRef<number>;
  rdsU: ChannelRef<number>;
  vpcU: ChannelRef<number>;
  lbU: ChannelRef<number>;
  fleetU: ChannelRef<number>;
  msU: ChannelRef<number>;
  splitU: ChannelRef<number>;
  cdnU: ChannelRef<number>;
  trafU: ChannelRef<number>;
  closeU: ChannelRef<number>;
  strainU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const boxU = tl.channel('boxU', 0);
  const flyU = tl.channel('flyU', 0); // assets → S3
  const rdsU = tl.channel('rdsU', 0); // mysql slides out to RDS
  const vpcU = tl.channel('vpcU', 0); // vpc fence
  const lbU = tl.channel('lbU', 0); // load balancer
  const fleetU = tl.channel('fleetU', 0); // server multiplies
  const msU = tl.channel('msU', 0); // master-slave failover
  const splitU = tl.channel('splitU', 0); // web/app split label
  const cdnU = tl.channel('cdnU', 0); // cloudfront
  const trafU = tl.channel('trafU', 0); // traffic through lb + cdn
  const closeU = tl.channel('closeU', 0);
  const strainU = tl.channel('strainU', 0); // load on the lone box, climbing to timeouts

  // — Beat 1 · the diagnosis —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'The profiler has spoken: on our one box, the database is eating the memory and the processor, while user uploads quietly fill the disk. Three tenants, one apartment.',
  });
  tl.tween(cam, CAM_BOX, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(boxU, 1, { at: 0.9, dur: 1.2, ease: ease.enter });
  tl.hold(7.5, 0.5);

  // — Beat 2 · static content moves out —
  tl.caption({
    at: 8.0,
    dur: 7,
    text: 'First eviction: everything static. User files, scripts, styles, images, and videos fly out to an object store, which scales practically without limit and encrypts at rest.',
  });
  tl.tween(cam, CAM_S3, { at: 8.2, dur: 1.4, ease: ease.move });
  tl.tween(flyU, 1, { at: 8.8, dur: 3.6, ease: ease.linear });
  tl.hold(15.0, 0.5);

  // — Beat 3 · the database moves out —
  tl.caption({
    at: 15.5,
    dur: 6.5,
    text: 'Second eviction: the database gets its own box, as a managed relational service spanning multiple availability zones. Now the web tier and the data tier can scale independently.',
  });
  tl.tween(rdsU, 1, { at: 16.4, dur: 1.8, ease: ease.move });
  tl.hold(22.0, 0.5);

  // — Beat 4 · the fence —
  tl.caption({
    at: 22.5,
    dur: 6,
    text: 'Draw the fence while you are at it: a virtual private cloud, with the web server in a public subnet and everything else in a private one the internet cannot reach.',
  });
  tl.tween(vpcU, 1, { at: 23.2, dur: 1.6, ease: ease.draw });
  tl.hold(28.5, 0.5);

  // — Beat 5 · the web server buckles —
  tl.caption({
    at: 29.0,
    dur: 6,
    text: 'Growth continues, and now the load tests show the lone web server buckling at peak hours. Slow responses. Some outright downtime. Vertical scaling already had its turn.',
  });
  tl.tween(strainU, 1, { at: 29.4, dur: 3.4, ease: ease.linear });
  tl.hold(35.0, 0.5);

  // — Beat 6 · horizontal scaling —
  tl.caption({
    at: 35.5,
    dur: 7,
    text: 'This time the answer is horizontal: a load balancer in front, terminating secure connections, and identical web servers behind it, spread across availability zones so no single failure matters.',
  });
  tl.tween(cam, CAM_LB, { at: 35.7, dur: 1.4, ease: ease.move });
  tl.tween(lbU, 1, { at: 36.2, dur: 1.0, ease: ease.enter });
  tl.tween(fleetU, 1, { at: 37.4, dur: 1.8, ease: ease.move });
  tl.tween(trafU, 1, { at: 39.4, dur: 3.6, ease: ease.linear });
  tl.hold(43.5, 0.5);

  // — Beat 7 · master-slave + split —
  tl.caption({
    at: 44.0,
    dur: 6.5,
    text: 'The database pairs up too, a write master with a failover copy in another zone. And the web tier splits again: reverse proxies in front, application servers behind, each scaled to its own load.',
  });
  tl.tween(msU, 1, { at: 44.8, dur: 1.2, ease: ease.enter });
  tl.tween(splitU, 1, { at: 47.0, dur: 1.0, ease: ease.enter });
  tl.hold(50.5, 0.5);

  // — Beat 8 · the CDN —
  tl.caption({
    at: 51.0,
    dur: 6.5,
    text: 'And the static traffic stops visiting you at all. A content delivery network serves it from edges near the user, cutting both your load and their latency.',
  });
  tl.tween(cdnU, 1, { at: 51.8, dur: 1.2, ease: ease.enter });
  tl.hold(57.0, 0.5);

  // — Beat 9 · close —
  tl.caption({
    at: 57.5,
    dur: 6.5,
    text: 'One box has become a small city: balanced, fenced, and redundant. But the next bottleneck is already forming, because this system reads a hundred times more than it writes.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 57.7, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 58.3, dur: 1.4, ease: ease.move });
  tl.hold(64.0, 1.5);

  return { tl, cam, boxU, flyU, rdsU, vpcU, lbU, fleetU, msU, splitU, cdnU, trafU, closeU, strainU };
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
      <text x={x} y={y - 1} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
        {title}
      </text>
      {sub && (
        <text x={x} y={y + 17} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const boxU = s.get(scene.boxU);
  const flyU = s.get(scene.flyU);
  const rdsU = s.get(scene.rdsU);
  const vpcU = s.get(scene.vpcU);
  const lbU = s.get(scene.lbU);
  const fleetU = s.get(scene.fleetU);
  const msU = s.get(scene.msU);
  const splitU = s.get(scene.splitU);
  const cdnU = s.get(scene.cdnU);
  const trafU = s.get(scene.trafU);
  const closeU = s.get(scene.closeU);
  const strainU = s.get(scene.strainU);

  const dimAll = 1 - closeU * 0.88;
  const single = 1 - fleetU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- vpc fence + subnets ---- */}
        <g opacity={vpcU * dimAll}>
          <rect x={VPC.x} y={VPC.y} width={VPC.w} height={VPC.h} rx={18} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} strokeDasharray="10 7" />
          <text x={VPC.x + 20} y={VPC.y + 26} fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, monospace">
            VPC
          </text>
          <rect x={PUB.x} y={PUB.y} width={PUB.w} height={PUB.h} rx={12} fill={colors.SECONDARY} fillOpacity={0.05} stroke={colors.SECONDARY} strokeWidth={1} strokeOpacity={0.6} />
          <text x={PUB.x + 16} y={PUB.y + 26} fill={colors.SECONDARY} fontSize={12} fontFamily="ui-monospace, monospace">
            public subnet · web
          </text>
          <rect x={PRIV.x} y={PRIV.y} width={PRIV.w} height={PRIV.h} rx={12} fill={colors.POSITIVE} fillOpacity={0.05} stroke={colors.POSITIVE} strokeWidth={1} strokeOpacity={0.6} />
          <text x={PRIV.x + 16} y={PRIV.y + 26} fill={colors.POSITIVE} fontSize={12} fontFamily="ui-monospace, monospace">
            private subnet · everything else
          </text>
        </g>

        {/* ---- the (single) box ---- */}
        <g opacity={boxU * single * dimAll}>
          <Node x={BOX.x} y={BOX.y} w={220} h={140} title="" stroke={colors.TEXT} />
          <text x={BOX.x} y={BOX.y - 44} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            the one box
          </text>
          <text x={BOX.x} y={BOX.y - 14} textAnchor="middle" fill={colors.ACCENT} fontSize={14}>
            Web Server
          </text>
          <g opacity={1 - rdsU}>
            <text x={BOX.x} y={BOX.y + 16} textAnchor="middle" fill={colors.POSITIVE} fontSize={14}>
              MySQL
            </text>
          </g>
          {/* load gauge: fills as peak traffic arrives */}
          <rect x={BOX.x - 80} y={BOX.y + 40} width={160} height={8} rx={4} fill={colors.GRID} />
          <rect x={BOX.x - 80} y={BOX.y + 40} width={160 * strainU} height={8} rx={4} fill={colors.WARM} />
        </g>
        {/* timeout tag once the box starts failing */}
        <g opacity={clamp01((strainU - 0.5) * 4) * single * dimAll}>
          <text x={BOX.x} y={BOX.y - 88} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily="ui-monospace, monospace">
            503 · timeout
          </text>
        </g>

        {/* ---- assets flying to S3 ---- */}
        <g opacity={dimAll}>
          {ASSETS.map((a, i) => {
            const u = clamp01(flyU * 2.2 - i * 0.28);
            if (u <= 0 || u >= 1) return null;
            const x = lerp(BOX.x + 60, S3.x - 70, u);
            const y = lerp(BOX.y - 20, S3.y, u) - Math.sin(u * Math.PI) * 40;
            return (
              <g key={a}>
                <rect x={x - 42} y={y - 12} width={84} height={24} rx={6} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.1} />
                <text x={x} y={y + 4} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily="ui-monospace, monospace">
                  {a}
                </text>
              </g>
            );
          })}
        </g>
        <g opacity={clamp01(flyU * 3) * dimAll}>
          <Node x={S3.x} y={S3.y} w={190} h={60} title="Object Store" sub="S3 · static content" stroke={colors.WARM} />
        </g>

        {/* ---- RDS ---- */}
        {rdsU > 0 && (() => {
          const x = lerp(BOX.x, RDS.x, rdsU);
          const y = lerp(BOX.y + 22, RDS.y, rdsU);
          return (
            <g opacity={dimAll}>
              <Node x={x} y={y} w={190} h={64} title="MySQL · RDS" sub="multi availability zone" stroke={colors.POSITIVE} />
              {msU > 0 && (
                <g opacity={msU}>
                  <line x1={x} y1={y + 32} x2={x} y2={y + 110} stroke={colors.GRID} strokeWidth={1.4} />
                  <Node x={x} y={y + 136} w={190} h={52} title="Failover replica" sub="master-slave" stroke={colors.GRID} />
                </g>
              )}
            </g>
          );
        })()}

        {/* ---- the load balancer + fleet ---- */}
        <g opacity={lbU * dimAll}>
          <Node x={LB.x} y={LB.y} w={150} h={70} title="Load Balancer" sub="ELB · SSL ends here" stroke={colors.ACCENT} />
        </g>
        {FLEET.map((f, i) => {
          const u = clamp01(fleetU * 2 - i * 0.4);
          if (u <= 0) return null;
          return (
            <g key={i} opacity={u * dimAll}>
              <Node x={f.x} y={f.y} w={200} h={64} title={splitU > 0.5 ? 'Web + App Server' : 'Web Server'} sub={`${f.az}${splitU > 0.5 ? ' · reverse proxy → api' : ''}`} stroke={colors.TEXT} />
              <line x1={LB.x + 75} y1={LB.y} x2={f.x - 100} y2={f.y} stroke={colors.GRID} strokeWidth={1.2} opacity={0.7} />
              {rdsU > 0.9 && <line x1={f.x + 100} y1={f.y} x2={RDS.x - 95} y2={RDS.y} stroke={colors.GRID} strokeWidth={1} opacity={0.5} />}
            </g>
          );
        })}

        {/* ---- traffic ---- */}
        {REQS.map((r, i) => {
          const u = clamp01((trafU - r.delay * 0.7) * 2.4);
          if (u <= 0 || u >= 1) return null;
          const viaCdn = r.cdn && cdnU > 0.5;
          const target = viaCdn ? CDN : FLEET[r.lane];
          const from = { x: 90, y: viaCdn ? CDN.y : LB.y };
          const mid = viaCdn ? CDN : LB;
          const edgeX = mid.x - 75;
          const p = u < 0.5
            ? { x: lerp(from.x, edgeX, u * 2), y: lerp(from.y, mid.y, u * 2) }
            : viaCdn
              ? { x: edgeX, y: mid.y }
              : { x: lerp(mid.x + 75, target.x - 100, u * 2 - 1), y: lerp(mid.y, target.y, u * 2 - 1) };
          return <circle key={i} cx={p.x} cy={p.y} r={4.5} fill={viaCdn ? colors.WARM : colors.ACCENT} opacity={0.8} />;
        })}
        <text x={90} y={430} textAnchor="middle" fill={colors.MUTED} fontSize={12} opacity={trafU > 0 ? 1 : 0}>
          users
        </text>

        {/* ---- CDN ---- */}
        <g opacity={cdnU * dimAll}>
          <Node x={CDN.x} y={CDN.y} w={170} h={60} title="CDN" sub="CloudFront · edges" stroke={colors.WARM} />
          <line x1={CDN.x + 85} y1={CDN.y} x2={S3.x - 95} y2={S3.y} stroke={colors.WARM} strokeWidth={1.2} strokeDasharray="6 5" opacity={0.7} />
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={280} y={215} width={720} height={240} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={264} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the unbundling, in order
          </text>
          {[
            'static content → object store, then a CDN',
            'database → its own managed box, master + failover',
            'web server → a fleet behind a load balancer, across zones',
          ].map((t, i) => (
            <text key={i} x={640} y={312 + i * 36} textAnchor="middle" fill={i === 2 ? colors.ACCENT : colors.MUTED} fontSize={13.5}>
              {t}
            </text>
          ))}
          <text x={640} y={430} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            profiling picked every one of these moves — not fashion
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
