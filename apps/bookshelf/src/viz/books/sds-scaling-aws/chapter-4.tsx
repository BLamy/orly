// The Breathing City: autoscaling, queues, and the long tail
//
// Backed by: solutions/system_design/scaling_aws/README.md — "Users++++":
// traffic spikes during U.S. business hours and drops when users leave the
// office; add AWS Autoscaling (one group per web/app server type across
// availability zones, min and max instance counts, CloudWatch triggers on CPU,
// latency, network traffic, or time of day; caveat: scaling up takes time) and
// automate DevOps (Chef, Puppet, Ansible) with monitoring (CloudWatch,
// PagerDuty, Sentry). "Users+++++": keep a limited window in MySQL and move
// the rest to a warehouse like Redshift (handles the 1 TB/month constraint);
// 40,000 average reads/s handled by scaling the Memory Cache; 400 writes/s
// pushing toward SQL patterns — federation, sharding, denormalization, SQL
// tuning — and NoSQL (DynamoDB); async work moves behind Queues (SQS) and
// Workers, e.g. a photo service creating thumbnails off the request path.
//
// ONE machine: the day as a sine wave of traffic. The server fleet literally
// breathes with the curve — instances wink in near the peak and wink out at
// night — then the finale assembles the whole primer skyline and rolls the
// end-of-series recap.
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
import { Packet } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// the day curve: traffic load 0..1 over a business day (precomputed samples)
const N_SAMPLES = 120;
const DAY = Array.from({ length: N_SAMPLES + 1 }, (_, i) => {
  const t = i / N_SAMPLES; // 0..1 = midnight..midnight
  // business-hours hump centered ~13:00 with a soft shoulder
  const g = Math.exp(-(((t - 0.55) * 4.2) ** 2));
  return 0.14 + 0.86 * g;
});
const dayAt = (t: number): number => DAY[Math.max(0, Math.min(N_SAMPLES, Math.round(t * N_SAMPLES)))];

const PLOT = { x0: 120, y0: 470, w: 640, h: 220 } as const;
const MIN_INST = 2;
const MAX_INST = 8;
const FLEET_X = 880;
const instY = (i: number): number => 150 + i * 52;

const CAM_PLOT: CameraState = { x: 450, y: 380, k: 1.2 };
const CAM_FLEET: CameraState = { x: 900, y: 330, k: 1.25 };
const CAM_QUEUE: CameraState = { x: 640, y: 420, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axesU: ChannelRef<number>;
  dayT: ChannelRef<number>;
  fleetU: ChannelRef<number>;
  trigU: ChannelRef<number>;
  qU: ChannelRef<number>;
  photoU: ChannelRef<number>;
  tailU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axesU = tl.channel('axesU', 0); // the day plot
  const dayT = tl.channel('dayT', 0); // time of day sweep 0..1
  const fleetU = tl.channel('fleetU', 0); // fleet panel
  const trigU = tl.channel('trigU', 0); // cloudwatch trigger labels
  const qU = tl.channel('qU', 0); // queue + workers
  const photoU = tl.channel('photoU', 0); // photo/thumbnail packets
  const tailU = tl.channel('tailU', 0); // warehouse/nosql/sharding chips
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the shape of a day —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'The final profile is not about a component. It is about time. Traffic spikes through the business day and collapses at night, and we are paying for the peak around the clock.',
  });
  tl.tween(cam, CAM_PLOT, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(axesU, 1, { at: 0.9, dur: 1.6, ease: ease.draw });
  tl.tween(dayT, 0.3, { at: 2.6, dur: 3.4, ease: ease.linear });
  tl.hold(7.0, 0.5);

  // — Beat 2 · autoscaling —
  tl.caption({
    at: 7.5,
    dur: 7,
    text: 'Because the web servers are stateless, the fix is autoscaling: one group per server type, spread across availability zones, with a minimum and a maximum number of instances.',
  });
  tl.tween(fleetU, 1, { at: 8.2, dur: 1.2, ease: ease.enter });
  tl.hold(14.0, 0.5);

  // — Beat 3 · breathe in —
  tl.caption({
    at: 14.5,
    dur: 7,
    text: 'Watch the fleet breathe. As the morning load climbs, monitoring triggers fire on processor load and latency, and new instances wink into existence to meet the wave.',
  });
  tl.tween(cam, CAM_FLEET, { at: 14.7, dur: 1.4, ease: ease.move });
  tl.tween(dayT, 0.56, { at: 15.2, dur: 5.4, ease: ease.linear });
  tl.tween(trigU, 1, { at: 16.0, dur: 0.9, ease: ease.pop });
  tl.hold(21.5, 0.5);

  // — Beat 4 · breathe out —
  tl.caption({
    at: 22.0,
    dur: 6.5,
    text: 'And when America goes home, the fleet exhales. Idle instances power down, and the bill follows the curve instead of the peak. The honest caveat: scaling up takes minutes, not milliseconds.',
  });
  tl.tween(dayT, 1, { at: 22.6, dur: 5.0, ease: ease.linear });
  tl.hold(28.5, 0.5);

  // — Beat 5 · queues + workers —
  tl.caption({
    at: 29.0,
    dur: 7.5,
    text: 'Growth also changes what runs where. Anything that need not happen during the request moves behind a queue. Upload a photo, and the thumbnails are made later, by workers, while the response has already gone home.',
  });
  tl.tween(cam, CAM_QUEUE, { at: 29.2, dur: 1.4, ease: ease.move });
  tl.tween(qU, 1, { at: 29.8, dur: 1.2, ease: ease.enter });
  tl.tween(photoU, 1, { at: 31.2, dur: 3.8, ease: ease.linear });
  tl.hold(37.0, 0.5);

  // — Beat 6 · the long tail —
  tl.caption({
    at: 37.5,
    dur: 8,
    text: 'And beyond that, the long tail of scale: retire old rows to a data warehouse, keep growing the memory cache for forty thousand reads a second, and when four hundred writes a second strain the master, reach for federation, sharding, denormalization, or a no sequel store.',
  });
  tl.tween(tailU, 1, { at: 38.4, dur: 1.6, ease: ease.enter });
  tl.hold(45.5, 0.5);

  // — Beat 7 · series recap —
  tl.caption({
    at: 46.0,
    dur: 8.5,
    text: 'Step back and the whole journey fits in one sentence. Start with one box, measure honestly, and every time something saturates, give that one thing its own machine, its own copies, or its own queue. That is how one box becomes a city of millions.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 46.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 46.8, dur: 1.6, ease: ease.move });
  tl.hold(54.5, 1.5);

  return { tl, cam, axesU, dayT, fleetU, trigU, qU, photoU, tailU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axesU = s.get(scene.axesU);
  const dayT = s.get(scene.dayT);
  const fleetU = s.get(scene.fleetU);
  const trigU = s.get(scene.trigU);
  const qU = s.get(scene.qU);
  const photoU = s.get(scene.photoU);
  const tailU = s.get(scene.tailU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;
  const load = dayAt(dayT);
  const want = Math.round(MIN_INST + (MAX_INST - MIN_INST) * clamp01((load - 0.14) / 0.86));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the day curve ---- */}
        <g opacity={axesU * dimAll}>
          <line x1={PLOT.x0} y1={PLOT.y0} x2={PLOT.x0 + PLOT.w} y2={PLOT.y0} stroke={colors.GRID} strokeWidth={1.4} />
          <line x1={PLOT.x0} y1={PLOT.y0} x2={PLOT.x0} y2={PLOT.y0 - PLOT.h} stroke={colors.GRID} strokeWidth={1.4} />
          {['midnight', 'noon', 'midnight'].map((t, i) => (
            <text key={i} x={PLOT.x0 + (i / 2) * PLOT.w} y={PLOT.y0 + 24} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              {t}
            </text>
          ))}
          {/* curve up to dayT */}
          <path
            d={DAY.slice(0, Math.max(2, Math.round(dayT * N_SAMPLES)))
              .map((v, i) => `${i === 0 ? 'M' : 'L'} ${PLOT.x0 + (i / N_SAMPLES) * PLOT.w} ${PLOT.y0 - v * PLOT.h}`)
              .join(' ')}
            fill="none"
            stroke={colors.ACCENT}
            strokeWidth={2.5}
          />
          {/* now marker */}
          <circle cx={PLOT.x0 + dayT * PLOT.w} cy={PLOT.y0 - load * PLOT.h} r={6} fill={colors.WARM} />
          <text x={PLOT.x0 - 8} y={PLOT.y0 - PLOT.h + 4} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
            traffic
          </text>
        </g>

        {/* ---- the breathing fleet ---- */}
        <g opacity={fleetU * dimAll}>
          <text x={FLEET_X} y={118} fill={colors.TEXT} fontSize={14}>
            autoscaling group
          </text>
          <text x={FLEET_X} y={138} fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
            min {MIN_INST} · max {MAX_INST} · multi-az
          </text>
          {Array.from({ length: MAX_INST }, (_, i) => {
            const on = i < want;
            const winking = i === want - 1 || i === want; // soft edge
            return (
              <g key={i} opacity={on ? 1 : 0.16}>
                <rect x={FLEET_X} y={instY(i)} width={230} height={40} rx={9} fill={colors.PANEL} stroke={on ? (winking ? colors.WARM : colors.POSITIVE) : colors.GRID} strokeWidth={on ? 1.5 : 1} />
                <text x={FLEET_X + 14} y={instY(i) + 25} fill={on ? colors.TEXT : colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
                  web-{i + 1} · {i % 2 === 0 ? 'az-1' : 'az-2'} {on ? '' : '· off'}
                </text>
              </g>
            );
          })}
          <g opacity={trigU}>
            <text x={FLEET_X} y={instY(MAX_INST) + 26} fill={colors.WARM} fontSize={10.5} fontFamily="ui-monospace, monospace">
              CloudWatch: CPU · latency · network · time of day
            </text>
          </g>
        </g>

        {/* ---- queue + workers ---- */}
        <g opacity={qU * dimAll * (1 - tailU * 0.25)}>
          <rect x={330} y={150} width={150} height={50} rx={10} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={1.3} />
          <text x={405} y={180} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
            upload photo
          </text>
          <rect x={540} y={150} width={130} height={50} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.3} />
          <text x={605} y={175} textAnchor="middle" fill={colors.SECONDARY} fontSize={12}>
            Queue
          </text>
          <text x={605} y={191} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily="ui-monospace, monospace">
            SQS
          </text>
          <rect x={730} y={150} width={140} height={50} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
          <text x={800} y={175} textAnchor="middle" fill={colors.ACCENT} fontSize={12}>
            Workers
          </text>
          <text x={800} y={191} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily="ui-monospace, monospace">
            create thumbnails
          </text>
          <line x1={480} y1={175} x2={540} y2={175} stroke={colors.GRID} strokeWidth={1.3} />
          <line x1={670} y1={175} x2={730} y2={175} stroke={colors.GRID} strokeWidth={1.3} />
          {photoU > 0 && photoU < 1 && (
            <Packet from={{ x: 480, y: 175 }} to={{ x: 730, y: 175 }} u={photoU} r={6} color={colors.SECONDARY} />
          )}
          <text x={405} y={226} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontStyle="italic" opacity={photoU}>
            response already returned
          </text>
        </g>

        {/* ---- the long tail chips ---- */}
        <g opacity={tailU * dimAll}>
          {[
            'Redshift — old rows retire to the warehouse',
            'Memory Cache — scaled for 40,000 reads / s',
            'Federation · Sharding · Denormalization · SQL Tuning',
            'DynamoDB — NoSQL for the heaviest keys',
          ].map((t, i) => (
            <g key={i}>
              <rect x={140} y={252 + i * 44} width={430} height={34} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={355} y={274 + i * 44} textAnchor="middle" fill={i === 2 ? colors.WARM : colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
                {t}
              </text>
            </g>
          ))}
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={250} y={185} width={780} height={300} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={234} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            one box → a city of millions
          </text>
          {[
            ['1', 'one box, vertically scaled, honestly measured'],
            ['2', 'unbundle: object store, managed database, load balancer, CDN'],
            ['3', 'read heavy: memory cache, stateless servers, read replicas'],
            ['4', 'breathe: autoscaling, queues and workers, warehouse and shards'],
          ].map(([k, v], i) => (
            <g key={k}>
              <text x={390} y={282 + i * 40} textAnchor="end" fill={colors.ACCENT} fontSize={14} fontFamily="ui-monospace, monospace">
                {k}
              </text>
              <text x={418} y={282 + i * 40} fill={colors.MUTED} fontSize={13}>
                {v}
              </text>
            </g>
          ))}
          <text x={640} y={452} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            benchmark · profile · fix the real bottleneck · repeat
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
