// The Bucket Is the Coordinator
//
// Backed by: README.md (object-storage compare-and-swap, exactly one owner, no
// membership protocol / failure detector / consensus), crates/celld/
// ownership_store.rs (OwnerRecord wire {node, epoch}, node lease records),
// crates/celld/bucket.rs (put_cas answers Ok(None) only for a clean 412/409),
// crates/celld/main.rs (Timer::NodeLeaseRenew / Timer::NodeLeaseFence —
// monotonic lease ticks fence the node even when storage hangs).
//
// Machine: the bucket is a ring at center; three nodes orbit it. The owner
// record card for cell room-7 is the persistent object. Two nodes race a
// compare-and-swap — one write lands, the other bounces off with a clean
// rejection and proxies. Lease arcs renew around each node; node-a's lease
// expires, the fence fires, node-c swaps itself in and the epoch advances.
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
const TAU = Math.PI * 2;

/* ---------------------------------------------------------------- layout */
const BUCKET = { x: 640, y: 330, r: 118 };
const NODES = [
  { id: 'node-a', x: 250, y: 170, color: colors.ACCENT },
  { id: 'node-b', x: 1030, y: 170, color: colors.WARM },
  { id: 'node-c', x: 640, y: 585 - 45, color: colors.SECONDARY },
] as const;
const RECORD = { x: BUCKET.x, y: BUCKET.y + 8 };

const CAM_RING: CameraState = { ...CAMERA_HOME };
const CAM_RECORD: CameraState = { x: 640, y: 320, k: 1.3 };
const CAM_LEASE: CameraState = { x: 470, y: 250, k: 1.24 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.0 };

const bez = (a: { x: number; y: number }, b: { x: number; y: number }, u: number) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 70;
  const v = 1 - u;
  return {
    x: v * v * a.x + 2 * v * u * mx + u * u * b.x,
    y: v * v * a.y + 2 * v * u * my + u * u * b.y,
  };
};

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  bucketU: ChannelRef<number>;
  nodesU: ChannelRef<number>;
  reqU: ChannelRef<number>;
  recordU: ChannelRef<number>;
  raceU: ChannelRef<number>;
  proxyU: ChannelRef<number>;
  fieldsU: ChannelRef<number>;
  leaseU: ChannelRef<number>;
  fenceU: ChannelRef<number>;
  takeoverU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_RING, cameraInterp);
  const bucketU = tl.channel('bucketU', 0);
  const nodesU = tl.channel('nodesU', 0);
  const reqU = tl.channel('reqU', 0);
  const recordU = tl.channel('recordU', 0);
  const raceU = tl.channel('raceU', 0); // both CAS packets fly; winner lands, loser bounces
  const proxyU = tl.channel('proxyU', 0); // loser proxies the request to the winner
  const fieldsU = tl.channel('fieldsU', 0); // {node, epoch} fields spotlight
  const leaseU = tl.channel('leaseU', 0); // lease arcs renew
  const fenceU = tl.channel('fenceU', 0); // node-a dies, fence fires
  const takeoverU = tl.channel('takeoverU', 0); // node-c CAS, epoch 3 -> 4
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · what is missing —
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 7.4,
    text: 'Here is what celld leaves out: no membership protocol, no failure detector, no consensus service. The only thing the nodes share is an object storage bucket.',
  });
  tl.tween(bucketU, 1, { at: t - 6.8, dur: 1.6, ease: ease.draw });
  t = tl.hold(t, 0.6);

  // — Beat 2 · the fleet points at the bucket —
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Every node runs the same daemon and points at the same bucket. The bucket holds deployments, cell state, and small ownership records.',
  });
  tl.tween(nodesU, 1, { at: t - 5.8, dur: 2.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 3 · ownership is one atomic write —
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'A request arrives for a cell that nobody owns. To serve it, a node must first own the cell — and ownership is one atomic write.',
  });
  tl.tween(cam, CAM_RECORD, { at: t - 6.3, dur: 1.4, ease: ease.move });
  tl.tween(reqU, 1, { at: t - 5.6, dur: 2.0, ease: ease.linear });
  tl.tween(recordU, 1, { at: t - 3.2, dur: 0.9, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 4 · the compare-and-swap race —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Two nodes can try at once. Each attempts a compare and swap on the owner record. Exactly one write lands.',
  });
  tl.tween(raceU, 1, { at: t - 6.0, dur: 3.4, ease: ease.linear });
  t = tl.hold(t, 0.6);

  // — Beat 5 · the loser proxies —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'The loser gets a clean rejection, reads who won, and proxies the request to the owner instead. No election, and nobody votes.',
  });
  tl.tween(proxyU, 1, { at: t - 5.8, dur: 3.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 6 · the record's two fields —
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The owner record carries two fields: which node owns the cell, and an epoch that counts every handoff.',
  });
  tl.tween(fieldsU, 1, { at: t - 5.6, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 7 · leases and the fence —
  t = tl.caption({
    at: t,
    dur: 7.4,
    text: 'Each node also keeps a lease alive with a heartbeat. If it cannot renew in time, a fence timer fires and the node stops serving before anyone else can take over.',
  });
  tl.tween(cam, CAM_LEASE, { at: t - 6.9, dur: 1.4, ease: ease.move });
  tl.tween(leaseU, 1, { at: t - 6.2, dur: 2.6, ease: ease.linear });
  tl.tween(fenceU, 1, { at: t - 3.0, dur: 2.2, ease: ease.linear });
  t = tl.hold(t, 0.6);

  // — Beat 8 · takeover, epoch advances —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'When a node dies, its lease expires. Another node swaps itself in, the epoch advances, and the cell moves.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 6.1, dur: 1.4, ease: ease.move });
  tl.tween(takeoverU, 1, { at: t - 5.4, dur: 3.2, ease: ease.linear });
  t = tl.hold(t, 0.6);

  // — Beat 9 · close —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'One conditional write at a time is the entire coordination protocol. Exactly one node owns a cell. It never has two.',
  });
  tl.tween(dimU, 1, { at: t - 6.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.8, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, bucketU, nodesU, reqU, recordU, raceU, proxyU, fieldsU, leaseU, fenceU, takeoverU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */
function BucketRing({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const dash = TAU * BUCKET.r;
  return (
    <g opacity={1 - 0.85 * dim}>
      <circle
        cx={BUCKET.x}
        cy={BUCKET.y}
        r={BUCKET.r}
        fill={colors.PANEL}
        stroke={colors.TEAL}
        strokeWidth={2.4}
        strokeDasharray={dash}
        strokeDashoffset={dash * (1 - uu)}
        opacity={0.96}
      />
      <text x={BUCKET.x} y={BUCKET.y - BUCKET.r - 16} textAnchor="middle" fill={colors.TEAL} fontSize={13.5} fontWeight={700} opacity={uu}>
        the fleet bucket · S3-compatible · you own it
      </text>
      <text x={BUCKET.x} y={BUCKET.y - 66} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={uu}>
        deployments/ · cells/ · wake/ · fleet/
      </text>
    </g>
  );
}

function Nodes({
  u,
  lease,
  fence,
  takeover,
  dim,
}: {
  u: number;
  lease: number;
  fence: number;
  takeover: number;
  dim: number;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={1 - 0.85 * dim}>
      {NODES.map((n, i) => {
        const p = clamp01(u * 3 - i * 0.7);
        if (p <= 0) return null;
        const dead = n.id === 'node-a' ? clamp01((fence - 0.55) * 3) : 0;
        const leaseR = 44;
        // lease arc: sweeps as it renews; node-a's decays once fence begins
        const sweep = n.id === 'node-a' ? Math.max(0, 1 - clamp01(fence * 1.6)) : 0.4 + 0.6 * Math.abs(Math.sin(lease * Math.PI * (1.3 + i * 0.3)));
        const dash = TAU * leaseR;
        return (
          <g key={n.id} transform={`translate(${n.x}, ${n.y})`} opacity={p * (1 - dead * 0.75)}>
            <rect x={-58} y={-34} width={116} height={68} rx={12} fill={colors.PANEL} stroke={dead > 0.3 ? colors.NEGATIVE : n.color} strokeWidth={1.8} />
            <text y={-6} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
              {n.id}
            </text>
            <text y={16} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
              celld · embeds V8
            </text>
            {lease > 0 && (
              <g opacity={clamp01(lease * 3)}>
                <circle
                  r={leaseR}
                  fill="none"
                  stroke={dead > 0.3 ? colors.NEGATIVE : n.color}
                  strokeWidth={2}
                  strokeDasharray={`${dash * 0.25 * sweep + 0.01} ${dash}`}
                  transform="rotate(-90)"
                  opacity={0.7}
                />
              </g>
            )}
            {dead > 0.3 && (
              <text y={54} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO} opacity={(dead - 0.3) * 2}>
                lease expired · fenced
              </text>
            )}
          </g>
        );
      })}
      {lease > 0.15 && lease < 1 && fence < 0.4 && (
        <text x={250} y={262} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={clamp01(lease * 4)}>
          NodeLeaseRenew → NodeLeaseFence
        </text>
      )}
    </g>
  );
}

function OwnerRecord({
  u,
  fields,
  race,
  takeover,
  dim,
}: {
  u: number;
  fields: number;
  race: number;
  takeover: number;
  dim: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const owned = race > 0.55 || takeover > 0;
  const flipped = takeover > 0.62;
  const glow = takeover > 0.55 && takeover < 0.85 ? Math.sin(((takeover - 0.55) / 0.3) * Math.PI) : 0;
  return (
    <g transform={`translate(${RECORD.x}, ${RECORD.y + (1 - uu) * 10})`} opacity={(1 - 0.8 * dim) * uu}>
      <rect x={-104} y={-52} width={208} height={104} rx={12} fill={colors.BG} stroke={flipped ? colors.SECONDARY : owned ? colors.ACCENT : colors.GRID} strokeWidth={1.8 + glow * 2} />
      <text y={-30} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        cells/room-7/owner
      </text>
      <text y={-4} textAnchor="middle" fill={owned ? colors.TEXT : colors.MUTED} fontSize={13} fontFamily={MONO} opacity={fields > 0 ? 1 : 0.85}>
        {owned ? (flipped ? 'node: node-c' : 'node: node-a') : 'node: —'}
      </text>
      <text y={20} textAnchor="middle" fill={owned ? colors.WARM : colors.MUTED} fontSize={13} fontFamily={MONO}>
        {owned ? (flipped ? 'epoch: 4' : 'epoch: 3') : 'epoch: —'}
      </text>
      {fields > 0 && !flipped && (
        <text y={44} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} opacity={fields}>
          epoch counts every handoff
        </text>
      )}
      {flipped && (
        <text y={44} textAnchor="middle" fill={colors.SECONDARY} fontSize={9.5} opacity={clamp01((takeover - 0.62) * 4)}>
          handoff: the epoch just advanced
        </text>
      )}
    </g>
  );
}

function CasRace({ u, dim }: { u: number; dim: number }) {
  if (u <= 0 || u >= 1.15) return null;
  const a = NODES[0];
  const b = NODES[1];
  const target = { x: RECORD.x, y: RECORD.y - 60 };
  // winner (node-a) flies 0..0.55 and lands; loser (node-b) flies 0..0.6 then bounces back 0.6..1
  const wu = clamp01(u / 0.55);
  const luRaw = clamp01(u / 0.6);
  const bounce = clamp01((u - 0.6) / 0.4);
  const wp = bez({ x: a.x + 58, y: a.y }, target, ease.linear(wu));
  const lp =
    bounce <= 0
      ? bez({ x: b.x - 58, y: b.y }, target, luRaw * 0.92)
      : bez({ x: b.x - 58, y: b.y }, target, 0.92 * (1 - ease.move(bounce)));
  return (
    <g opacity={1 - 0.85 * dim}>
      {wu < 1 && (
        <g transform={`translate(${wp.x}, ${wp.y})`}>
          <rect x={-44} y={-13} width={88} height={26} rx={13} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text y={4} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5} fontFamily={MONO}>
            put-if-none
          </text>
        </g>
      )}
      {u > 0.05 && (
        <g transform={`translate(${lp.x}, ${lp.y})`} opacity={bounce > 0.8 ? (1 - bounce) * 5 : 1}>
          <rect x={-44} y={-13} width={88} height={26} rx={13} fill={colors.PANEL} stroke={bounce > 0 ? colors.NEGATIVE : colors.WARM} strokeWidth={1.5} />
          <text y={4} textAnchor="middle" fill={bounce > 0 ? colors.NEGATIVE : colors.WARM} fontSize={10.5} fontFamily={MONO}>
            {bounce > 0 ? 'rejected 412' : 'put-if-none'}
          </text>
        </g>
      )}
      {bounce > 0.1 && bounce < 0.9 && (
        <text x={BUCKET.x + 165} y={BUCKET.y - 118} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10} fontFamily={MONO} opacity={Math.sin(bounce * Math.PI)}>
          clean rejection — the only safe “no”
        </text>
      )}
    </g>
  );
}

function ProxyPath({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = NODES[0];
  const b = NODES[1];
  const pu = ease.linear(clamp01(uu * 1.25));
  const x = b.x - 58 + (a.x + 58 - (b.x - 58)) * pu;
  const y = a.y - 62;
  return (
    <g opacity={1 - 0.85 * dim}>
      <line x1={b.x - 58} y1={y} x2={a.x + 58} y2={y} stroke={colors.GRID} strokeWidth={1.4} strokeDasharray="4 6" opacity={uu} />
      {pu > 0 && pu < 1 && (
        <g transform={`translate(${x}, ${y})`}>
          <circle r={9} fill={colors.WARM} />
          <text y={-14} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily={MONO}>
            proxied to owner
          </text>
        </g>
      )}
    </g>
  );
}

function ReqPacket({ u, dim }: { u: number; dim: number }) {
  if (u <= 0 || u >= 1) return null;
  const from = { x: 1180, y: 470 };
  const to = { x: NODES[1].x, y: NODES[1].y + 40 };
  const p = bez(from, to, ease.linear(u));
  return (
    <g transform={`translate(${p.x}, ${p.y})`} opacity={(1 - 0.85 * dim) * Math.min(1, u * 5, (1 - u) * 5 + 0.4)}>
      <circle r={10} fill={colors.POSITIVE} />
      <text y={-15} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>
        req → room-7
      </text>
    </g>
  );
}

function TakeoverCas({ u, dim }: { u: number; dim: number }) {
  if (u <= 0.1 || u >= 0.62) return null;
  const c = NODES[2];
  const target = { x: RECORD.x, y: RECORD.y + 62 };
  const p = bez({ x: c.x, y: c.y - 34 }, target, ease.linear(clamp01((u - 0.1) / 0.5)));
  return (
    <g transform={`translate(${p.x}, ${p.y})`} opacity={1 - 0.85 * dim}>
      <rect x={-58} y={-13} width={116} height={26} rx={13} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
      <text y={4} textAnchor="middle" fill={colors.SECONDARY} fontSize={10.5} fontFamily={MONO}>
        swap owner · e4
      </text>
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${330 + (1 - uu) * 14})`} opacity={uu}>
      <rect x={-350} y={-88} width={700} height={176} rx={18} fill={colors.BG} stroke={colors.TEAL} strokeWidth={1.7} />
      <text y={-40} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={750}>
        The bucket is the coordinator.
      </text>
      <text y={-2} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
        one conditional write · put_cas → clean 412 is the only “no”
      </text>
      <text y={30} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
        owner record = node + epoch · every handoff advances it
      </text>
      <text y={61} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
        no membership · no failure detector · no consensus service
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
        <BucketRing u={s.get(scene.bucketU)} dim={dim} />
        <Nodes
          u={s.get(scene.nodesU)}
          lease={s.get(scene.leaseU)}
          fence={s.get(scene.fenceU)}
          takeover={s.get(scene.takeoverU)}
          dim={dim}
        />
        <ReqPacket u={s.get(scene.reqU)} dim={dim} />
        <OwnerRecord
          u={s.get(scene.recordU)}
          fields={s.get(scene.fieldsU)}
          race={s.get(scene.raceU)}
          takeover={s.get(scene.takeoverU)}
          dim={dim}
        />
        <CasRace u={s.get(scene.raceU)} dim={dim} />
        <ProxyPath u={s.get(scene.proxyU)} dim={dim} />
        <TakeoverCas u={s.get(scene.takeoverU)} dim={dim} />
        <ClosingCard u={s.get(scene.closeU)} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
