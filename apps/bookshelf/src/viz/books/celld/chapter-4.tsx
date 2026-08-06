// Sleep Cheap, Wake on Time
//
// Backed by: docs/README.md (idle cells hibernate to the bucket; one 8 GB
// node holds 1,000 resident cells; a resident cell costs ~$0.05/month),
// crates/celld/wake.rs (wake/<YYYY-MM-DDTHH:MM>/<cell> entries; the invariant
// list: stale entry = one spurious wake, missing entry = lost wake; resident
// threshold CELLD_ALARM_RESIDENT_MS default one hour; due_scan lists the
// wake/ prefix), crates/logic/wake.rs (minute_bucket / entry_key — minute
// precision, lexicographically ordered so the waker lists due buckets in
// order; WakeCore decide + Reconcile ordering rules).
//
// Machine: a cell shrinks into the bucket to hibernate; the persistent object
// is a minute-bucket calendar rail. An alarm files a durable wake entry under
// its minute; the sweep cursor walks the rail in time order and revives the
// cell; a dead node's orphaned entry glows until the fleet waker adopts it.
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

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const NODE = { x: 190, y: 150, w: 340, h: 230 };
const BUCKET = { x: 620, y: 130, w: 500, h: 250 };
const RAIL = { x: 150, y: 470, w: 980 };
const CELLP = { x: 320, y: 265 }; // the cell inside the node

const CAM_NODE: CameraState = { x: 430, y: 280, k: 1.16 };
const CAM_RAIL: CameraState = { x: 640, y: 440, k: 1.2 };
const CAM_WIDE: CameraState = { ...CAMERA_HOME };

const MINUTES = ['14:29', '14:30', '14:31', '14:32', '14:33', '14:34'];
const DUE_INDEX = 3; // 14:32 holds room-7's entry
const minuteX = (i: number) => RAIL.x + 60 + i * ((RAIL.w - 120) / (MINUTES.length - 1));

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  nodeU: ChannelRef<number>;
  bucketU: ChannelRef<number>;
  densityU: ChannelRef<number>;
  hibernateU: ChannelRef<number>;
  alarmU: ChannelRef<number>;
  railU: ChannelRef<number>;
  entryU: ChannelRef<number>;
  invariantU: ChannelRef<number>;
  thresholdU: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  reviveU: ChannelRef<number>;
  orphanU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_NODE, cameraInterp);
  const nodeU = tl.channel('nodeU', 0);
  const bucketU = tl.channel('bucketU', 0);
  const densityU = tl.channel('densityU', 0); // the 1000-cell grid fills
  const hibernateU = tl.channel('hibernateU', 0); // room-7 shrinks into the bucket
  const alarmU = tl.channel('alarmU', 0); // the appointment ring
  const railU = tl.channel('railU', 0); // minute-bucket calendar draws
  const entryU = tl.channel('entryU', 0); // durable wake entry filed
  const invariantU = tl.channel('invariantU', 0); // asymmetry panel
  const thresholdU = tl.channel('thresholdU', 0); // stay-resident threshold
  const sweepU = tl.channel('sweepU', 0); // cursor walks the rail
  const reviveU = tl.channel('reviveU', 0); // cell revives, alarm fires
  const orphanU = tl.channel('orphanU', 0); // dead node's entry adopted
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · resident vs hibernated —
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'A resident cell holds memory. An idle cell hibernates to the bucket, where it is only an object, and costs almost nothing.',
  });
  tl.tween(nodeU, 1, { at: t - 6.2, dur: 1.0, ease: ease.enter });
  tl.tween(bucketU, 1, { at: t - 5.4, dur: 1.2, ease: ease.draw });
  tl.tween(hibernateU, 1, { at: t - 3.4, dur: 2.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 2 · the economics —
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'One eight gigabyte node holds a thousand resident cells. Hibernation is what makes a cell for every user affordable.',
  });
  tl.tween(densityU, 1, { at: t - 5.6, dur: 2.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 3 · the appointment problem —
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'But a sleeping cell can still have an appointment. An alarm set for later must fire even while the cell is asleep — even if the node that slept it is gone.',
  });
  tl.tween(alarmU, 1, { at: t - 6.2, dur: 1.6, ease: ease.pop });
  t = tl.hold(t, 0.5);

  // — Beat 4 · the wake entry —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'So committed alarm state is mirrored into the bucket as a wake entry, filed under the minute it comes due.',
  });
  tl.tween(cam, CAM_RAIL, { at: t - 6.1, dur: 1.4, ease: ease.move });
  tl.tween(railU, 1, { at: t - 5.4, dur: 1.8, ease: ease.draw });
  tl.tween(entryU, 1, { at: t - 3.2, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 5 · the asymmetric invariant —
  t = tl.caption({
    at: t,
    dur: 7.6,
    text: 'The rule is asymmetric on purpose. A stale entry costs one spurious wake. A missing entry costs a lost alarm. So only a completed activation is allowed to delete one.',
  });
  tl.tween(invariantU, 1, { at: t - 6.9, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.6);

  // — Beat 6 · the resident threshold —
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Alarms due within the hour keep their cell resident, because waking costs more than staying. Alarms further out hibernate behind their entry.',
  });
  tl.tween(thresholdU, 1, { at: t - 5.8, dur: 1.4, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 7 · the sweep —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'A sweep lists the wake prefix in time order, finds the minutes that are due, and revives each cell to fire its alarm.',
  });
  tl.tween(sweepU, 1, { at: t - 6.0, dur: 3.2, ease: ease.linear });
  tl.tween(reviveU, 1, { at: t - 2.6, dur: 2.0, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 8 · orphans adopted —
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'If a node dies with alarms armed, its entries are still in the bucket. A fleet waker finds the orphans, and any healthy node adopts them.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 6.3, dur: 1.4, ease: ease.move });
  tl.tween(orphanU, 1, { at: t - 5.4, dur: 3.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 9 · close —
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Sleep costs nearly nothing, and no alarm is ever lost. The bucket keeps the calendar.',
  });
  tl.tween(dimU, 1, { at: t - 5.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.4, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return {
    tl, cam, nodeU, bucketU, densityU, hibernateU, alarmU, railU, entryU,
    invariantU, thresholdU, sweepU, reviveU, orphanU, dimU, closeU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */
function NodeBox({ u, density, orphan, dim }: { u: number; density: number; orphan: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const dead = clamp01(orphan * 2.2);
  const cols = 12;
  const rows = 6;
  const total = cols * rows;
  return (
    <g opacity={(1 - 0.85 * dim) * uu}>
      <rect x={NODE.x} y={NODE.y} width={NODE.w} height={NODE.h} rx={14} fill={colors.PANEL} stroke={dead > 0.5 ? colors.NEGATIVE : colors.ACCENT} strokeWidth={1.8} opacity={1 - dead * 0.5} />
      <text x={NODE.x + 16} y={NODE.y + 26} fill={colors.TEXT} fontSize={13.5} fontWeight={700} opacity={1 - dead * 0.5}>
        {dead > 0.5 ? 'node-a · dead' : 'node-a · 8 GB'}
      </text>
      <text x={NODE.x + 16} y={NODE.y + 46} fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={1 - dead * 0.5}>
        ~1,000 resident cells · ≈ $0.05 per cell / month
      </text>
      <g opacity={1 - dead * 0.6}>
        {Array.from({ length: total }, (_, i) => {
          const p = clamp01(density * total * 0.35 - i * 0.28);
          if (p <= 0) return null;
          const cx = NODE.x + 24 + (i % cols) * 25;
          const cy = NODE.y + 68 + Math.floor(i / cols) * 25;
          return <circle key={i} cx={cx} cy={cy} r={7 * p} fill={colors.ACCENT} opacity={0.35 + 0.3 * p} />;
        })}
      </g>
    </g>
  );
}

function BucketBox({ u, hibernate, dim }: { u: number; hibernate: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const hu = clamp01(hibernate);
  // room-7 travels node -> bucket, shrinking
  const p = ease.move(hu);
  const x = CELLP.x + (BUCKET.x + 130 - CELLP.x) * p;
  const y = CELLP.y + (BUCKET.y + 150 - CELLP.y) * p;
  const r = 26 - 14 * p;
  return (
    <g opacity={(1 - 0.8 * dim) * uu}>
      <rect x={BUCKET.x} y={BUCKET.y} width={BUCKET.w} height={BUCKET.h} rx={14} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={2} />
      <text x={BUCKET.x + 18} y={BUCKET.y + 28} fill={colors.TEAL} fontSize={13} fontWeight={700}>
        the bucket — hibernated cells are just objects
      </text>
      <text x={BUCKET.x + 18} y={BUCKET.y + 52} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        cells/room-7/ltx/e4/ · idle ⇒ ~zero cost
      </text>
      {hu > 0 && (
        <g transform={`translate(${x}, ${y})`}>
          <circle r={r} fill={hu >= 1 ? colors.TEAL : colors.ACCENT} opacity={0.9} />
          <text y={4} textAnchor="middle" fill={colors.BG} fontSize={9.5} fontFamily={MONO} fontWeight={700}>
            room-7
          </text>
        </g>
      )}
      {hu >= 1 && (
        <text x={BUCKET.x + 130} y={BUCKET.y + 190} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
          asleep · an object in S3
        </text>
      )}
    </g>
  );
}

function AlarmRing({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const cx = BUCKET.x + 130;
  const cy = BUCKET.y + 150;
  return (
    <g opacity={(1 - 0.85 * dim) * uu}>
      <circle cx={cx} cy={cy} r={22 + 8 * Math.sin(uu * Math.PI)} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={0.85} />
      <text x={cx + 40} y={cy - 18} fill={colors.WARM} fontSize={11} fontFamily={MONO}>
        alarm: today 14:32
      </text>
      <text x={cx + 40} y={cy + 2} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
        set via ctx.storage — who will wake it?
      </text>
    </g>
  );
}

function WakeRail({
  u,
  entry,
  invariant,
  threshold,
  sweep,
  revive,
  orphan,
  dim,
}: {
  u: number;
  entry: number;
  invariant: number;
  threshold: number;
  sweep: number;
  revive: number;
  orphan: number;
  dim: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const cursor = RAIL.x + (minuteX(DUE_INDEX) + 40 - RAIL.x) * ease.linear(clamp01(sweep));
  const orphanGlow = orphan > 0.2 && orphan < 0.7 ? Math.sin(((orphan - 0.2) / 0.5) * Math.PI) : 0;
  const adopted = clamp01((orphan - 0.6) * 3);
  return (
    <g opacity={1 - 0.8 * dim}>
      <text x={RAIL.x} y={RAIL.y - 58} fill={colors.TEXT} fontSize={13.5} fontWeight={700} opacity={uu}>
        the wake calendar · wake/ prefix in the bucket
      </text>
      <text x={RAIL.x} y={RAIL.y - 38} fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={uu}>
        minute buckets, lexicographically ordered — wake.rs · logic/wake.rs
      </text>
      <line x1={RAIL.x} y1={RAIL.y} x2={RAIL.x + RAIL.w * uu} y2={RAIL.y} stroke={colors.GRID} strokeWidth={3} strokeLinecap="round" />
      {MINUTES.map((m, i) => {
        const p = clamp01(uu * MINUTES.length * 0.9 - i * 0.6);
        if (p <= 0) return null;
        const x = minuteX(i);
        const isDue = i === DUE_INDEX;
        return (
          <g key={m} transform={`translate(${x}, ${RAIL.y})`} opacity={p}>
            <line y1={-8} y2={8} stroke={colors.GRID} strokeWidth={2} />
            <text y={30} textAnchor="middle" fill={isDue && entry > 0.5 ? colors.WARM : colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              {'2026-08-06T' + m}
            </text>
            {isDue && entry > 0.3 && (
              <g opacity={clamp01((entry - 0.3) * 2)}>
                <rect x={-46} y={-58 + (1 - clamp01(entry)) * 10} width={92} height={30} rx={8}
                  fill={colors.PANEL}
                  stroke={adopted > 0 ? colors.SECONDARY : orphanGlow > 0 ? colors.NEGATIVE : revive > 0.6 ? colors.POSITIVE : colors.WARM}
                  strokeWidth={1.6 + orphanGlow * 1.6}
                />
                <text y={-38} textAnchor="middle" fill={adopted > 0 ? colors.SECONDARY : orphanGlow > 0 ? colors.NEGATIVE : colors.WARM} fontSize={10.5} fontFamily={MONO}>
                  room-7
                </text>
              </g>
            )}
          </g>
        );
      })}
      {/* stay-resident threshold marker */}
      {threshold > 0 && (
        <g opacity={threshold}>
          <line x1={minuteX(1) + 30} y1={RAIL.y - 70} x2={minuteX(1) + 30} y2={RAIL.y + 12} stroke={colors.SECONDARY} strokeWidth={1.4} strokeDasharray="4 5" />
          <text x={minuteX(1) + 30 - 8} y={RAIL.y - 78} textAnchor="end" fill={colors.SECONDARY} fontSize={10} fontFamily={MONO}>
            due sooner: stay resident
          </text>
          <text x={minuteX(1) + 30 + 8} y={RAIL.y - 78} fill={colors.SECONDARY} fontSize={10} fontFamily={MONO}>
            further out: hibernate · one hour default
          </text>
        </g>
      )}
      {/* invariant panel */}
      {invariant > 0 && (
        <g transform={`translate(640, ${RAIL.y + 78})`} opacity={invariant * (1 - clamp01(sweep) * 0.8)}>
          <rect x={-330} y={-24} width={660} height={48} rx={10} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.2} />
          <text x={-310} y={-2} fill={colors.WARM} fontSize={11} fontFamily={MONO}>
            stale entry → one spurious wake · cheap
          </text>
          <text x={-310} y={17} fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>
            missing entry → a lost alarm · never acceptable
          </text>
          <text x={130} y={8} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
            delete: completed activation only
          </text>
        </g>
      )}
      {/* sweep cursor */}
      {sweep > 0 && (
        <g transform={`translate(${cursor}, ${RAIL.y})`} opacity={Math.min(1, sweep * 4)}>
          <line y1={-64} y2={14} stroke={colors.POSITIVE} strokeWidth={2} />
          <text y={-70} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily={MONO}>
            due scan · in order
          </text>
        </g>
      )}
      {/* revived cell pops out of the entry */}
      {revive > 0.3 && (
        <g transform={`translate(${minuteX(DUE_INDEX)}, ${RAIL.y - 105 - ease.pop(clamp01((revive - 0.3) / 0.7)) * 16})`} opacity={clamp01((revive - 0.3) * 2)}>
          <circle r={20} fill={colors.POSITIVE} opacity={0.92} />
          <text y={4} textAnchor="middle" fill={colors.BG} fontSize={9} fontFamily={MONO} fontWeight={700}>
            room-7
          </text>
          <text y={-30} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>
            revived → alarm fires
          </text>
        </g>
      )}
      {/* orphan adoption note */}
      {adopted > 0 && (
        <text x={minuteX(DUE_INDEX)} y={RAIL.y + 52} textAnchor="middle" fill={colors.SECONDARY} fontSize={10.5} fontFamily={MONO} opacity={adopted}>
          owner died · fleet waker adopts the entry
        </text>
      )}
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${330 + (1 - uu) * 14})`} opacity={uu}>
      <rect x={-345} y={-88} width={690} height={176} rx={18} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.7} />
      <text y={-40} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={750}>
        Sleep cheap. Wake on time.
      </text>
      <text y={-2} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
        arm durable ⇒ wake entry exists, within one sweep tick
      </text>
      <text y={30} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
        spurious wake: cheap · lost alarm: never
      </text>
      <text y={61} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
        the bucket keeps the calendar · any node can answer it
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <NodeBox u={s.get(scene.nodeU)} density={s.get(scene.densityU)} orphan={s.get(scene.orphanU)} dim={dim} />
        <BucketBox u={s.get(scene.bucketU)} hibernate={s.get(scene.hibernateU)} dim={dim} />
        <AlarmRing u={s.get(scene.alarmU) * (1 - clamp01(s.get(scene.railU)) * 0.7)} dim={dim} />
        <WakeRail
          u={s.get(scene.railU)}
          entry={s.get(scene.entryU)}
          invariant={s.get(scene.invariantU)}
          threshold={s.get(scene.thresholdU) * (1 - clamp01(s.get(scene.orphanU)))}
          sweep={s.get(scene.sweepU)}
          revive={s.get(scene.reviveU)}
          orphan={s.get(scene.orphanU)}
          dim={dim}
        />
        <ClosingCard u={s.get(scene.closeU)} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
