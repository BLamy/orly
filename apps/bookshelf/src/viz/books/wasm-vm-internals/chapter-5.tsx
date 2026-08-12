// A Cluster Only You Can Read
//
// Builds directly on chapter 1's tailnet torrent. That swarm moves bytes but
// holds them accidentally — each peer has whatever its boot touched. Movement
// one steals IPFS's control-plane ideas to make holding deliberate:
//   1. provider records — content asks "who has it", not "where is it"
//   2. pinning → a replication factor: desired state vs actual, reconciled
//   3. erasure coding — stripe parity across tabs so the fleet survives churn
// Movement two turns the same machinery on the machine's PRIVATE half — the
// user's overlay writes and snapshots: compress (first, and only first), then
// encrypt with a key only your devices hold, then erasure-shard the ciphertext
// across the same tailnet peers. Every peer stores unreadable noise; any four
// shards restore your machine on a new device; dedup/delta happen before the
// lock because per-user keys end cross-user dedup.
import {
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

// ---------------------------------------------------------------------------
// Geometry — stores top (movement 1), pipeline lane top (movement 2), and one
// shared tab ring that carries both stories.
// ---------------------------------------------------------------------------

const OURS = { x: 320, y: 180 };
const IPFS = { x: 960, y: 180 };

const CL_CX = 640;
const CL_CY = 470;
const CL_R = 150;
const N_TABS = 6;
const TABS = Array.from({ length: N_TABS }, (_, k) => {
  const a = -Math.PI / 2 + (k * 2 * Math.PI) / N_TABS;
  return { x: CL_CX + CL_R * Math.cos(a), y: CL_CY + CL_R * Math.sin(a) };
});
const SCHED = { x: CL_CX, y: 240 };

// The stripe demo: 4 data shards + 2 parity shards, placed round-robin.
const SHARDS = ['d0', 'd1', 'd2', 'd3', 'p0', 'p1'];
const CRASHED = 2; // the tab that closes in the churn beat (and stays flaky)

// Movement 2: the compress → encrypt → shard pipeline lane.
const LANE_Y = 170;
const STAGES = [
  { x: 230, label: 'overlay chunk', sub: '128 KiB, plaintext', w: 132 },
  { x: 455, label: 'compress', sub: '~45 KiB', w: 100 },
  { x: 665, label: 'encrypt', sub: 'your key only', w: 104 },
  { x: 910, label: '6 shards', sub: 'any 4 rebuild', w: 150 },
];

const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };
const CAM_STORES: CameraState = { x: 640, y: 210, k: 1.25 };
const CAM_CLUSTER: CameraState = { x: CL_CX, y: CL_CY - 60, k: 1.22 };
const CAM_LANE: CameraState = { x: 620, y: 240, k: 1.18 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  oursU: ChannelRef<number>;
  ipfsU: ChannelRef<number>;
  dhtU: ChannelRef<number>;
  clusterU: ChannelRef<number>;
  annU: ChannelRef<number>;
  specU: ChannelRef<number>;
  stripeU: ChannelRef<number>;
  crashU: ChannelRef<number>;
  repairU: ChannelRef<number>;
  gapU: ChannelRef<number>;
  laneU: ChannelRef<number>;
  zstdU: ChannelRef<number>;
  encU: ChannelRef<number>;
  shardU: ChannelRef<number>;
  scatterU: ChannelRef<number>;
  peerViewU: ChannelRef<number>;
  restoreU: ChannelRef<number>;
  dedupU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_STORES, cameraInterp);
  const oursU = tl.channel('oursU', 0);
  const ipfsU = tl.channel('ipfsU', 0);
  const dhtU = tl.channel('dhtU', 0);
  const clusterU = tl.channel('clusterU', 0);
  const annU = tl.channel('annU', 0);
  const specU = tl.channel('specU', 0);
  const stripeU = tl.channel('stripeU', 0);
  const crashU = tl.channel('crashU', 0);
  const repairU = tl.channel('repairU', 0);
  const gapU = tl.channel('gapU', 0);
  const laneU = tl.channel('laneU', 0);
  const zstdU = tl.channel('zstdU', 0);
  const encU = tl.channel('encU', 0);
  const shardU = tl.channel('shardU', 0);
  const scatterU = tl.channel('scatterU', 0);
  const peerViewU = tl.channel('peerViewU', 0);
  const restoreU = tl.channel('restoreU', 0);
  const dedupU = tl.channel('dedupU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // ================= movement 1 · give the swarm a control plane =================

  // — Beat 1 · what we have —
  tl.caption({
    at: 0.5,
    dur: 7.5,
    text: 'Chapter one ended with a torrent inside your tailnet: tabs trading the hash-named chunks of the base image, the bucket demoted to web seed. But that swarm is accidental — each peer holds whatever its own boot happened to touch, and nobody is responsible for anything.',
  });
  tl.tween(oursU, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  tl.hold(7.9, 0.6);

  // — Beat 2 · IPFS grew the missing machinery —
  tl.caption({
    at: 8.5,
    dur: 7.5,
    text: 'IPFS has lived with exactly this problem for years. It starts where our torrent starts — blocks named by their hash, manifests of hashes — but it grew the machinery a torrent lacks: a way to find holders, and a way to make holding deliberate instead of accidental.',
  });
  tl.tween(ipfsU, 1, { at: 8.8, dur: 1.4, ease: ease.enter });
  tl.hold(15.9, 0.6);

  // — Beat 3 · who, not where —
  tl.caption({
    at: 16.5,
    dur: 7.5,
    text: 'The first steal is discovery. A torrent peer only knows what its direct connections advertise; IPFS asks the network "who has this hash" and any holder anywhere answers. Location becomes a lookup result — which turns our loose swarm into something a scheduler can reason about.',
  });
  tl.tween(dhtU, 1, { at: 16.8, dur: 1.6, ease: ease.draw });
  tl.hold(23.9, 0.6);

  // — Beat 4 · tabs as a cluster —
  tl.caption({
    at: 24.5,
    dur: 7.5,
    text: 'Because here is what the chapter-one swarm really is, seen from above: a cluster. Tabs are nodes that come and go; chunks are the workload; the tailnet is the network fabric between them. The torrent moves the bytes — what it lacks is a control plane deciding where bytes should live.',
  });
  tl.tween(cam, CAM_CLUSTER, { at: 24.7, dur: 1.8, ease: ease.move });
  tl.tween(dhtU, 0, { at: 24.7, dur: 0.9, ease: ease.move });
  tl.tween(clusterU, 1, { at: 25.4, dur: 2.2, ease: ease.draw });
  tl.hold(31.9, 0.6);

  // — Beat 5 · steal #1: provider records —
  tl.caption({
    at: 32.5,
    dur: 7.0,
    text: 'Steal one: provider records. Each tab announces the chunk set it holds — a few kilobytes of bitmap gossip. Any tab can then resolve a chunk to the nearest holder, IPFS-style, before falling back to the bucket.',
  });
  tl.tween(annU, 1, { at: 32.8, dur: 1.8, ease: ease.move });
  tl.hold(39.1, 0.6);

  // — Beat 6 · steal #2: pinning is a replication factor —
  tl.caption({
    at: 39.7,
    dur: 7.5,
    text: 'Steal two: pinning, upgraded into desired state. Declare "every hot chunk lives on at least three tabs" and run a reconciler that compares the announced actual against that spec — a kubernetes controller loop, but the pods are chunks.',
  });
  tl.tween(specU, 1, { at: 40.0, dur: 1.6, ease: ease.enter });
  tl.hold(46.8, 0.6);

  // — Beat 7 · steal #3: stripe with parity —
  tl.caption({
    at: 47.4,
    dur: 7.5,
    text: 'Steal three: stop replicating whole chunks and stripe them. Erasure-code a hot region into four data shards plus two parity shards spread across six tabs — a redundant array whose disks are browser tabs. Any four of the six rebuild the data.',
  });
  tl.tween(stripeU, 1, { at: 47.7, dur: 2.0, ease: ease.draw });
  tl.hold(54.5, 0.6);

  // — Beat 8 · churn: a tab closes —
  tl.caption({
    at: 55.1,
    dur: 7.0,
    text: 'Tabs are the least reliable nodes ever fielded — people close them. One vanishes, and nothing is lost: parity covers the hole while the reconciler notices actual has drifted below spec.',
  });
  tl.tween(crashU, 1, { at: 55.6, dur: 1.2, ease: ease.pop });
  tl.hold(61.5, 0.6);

  // — Beat 9 · repair —
  tl.caption({
    at: 62.1,
    dur: 7.0,
    text: 'The controller loop does what controllers do: reconstructs the missing shard from the survivors and re-places it on a fresh tab. Desired state restored. No coordinator ever touched the data — it only compared two lists.',
  });
  tl.tween(repairU, 1, { at: 62.6, dur: 2.0, ease: ease.move });
  tl.hold(68.5, 0.6);

  // ================= movement 2 · sharding the private half =================

  // — Beat 10 · the private half —
  tl.caption({
    at: 69.1,
    dur: 7.5,
    text: 'All of that machinery moves the public half — the base image anyone may hold. But the machine you actually care about is the other half: your overlay writes and your snapshots. That data cannot ride the swarm as plaintext, and losing it means losing the machine.',
  });
  tl.tween(cam, CAM_WIDE, { at: 69.3, dur: 1.6, ease: ease.move });
  tl.tween(oursU, 0, { at: 69.3, dur: 0.9, ease: ease.move });
  tl.tween(ipfsU, 0, { at: 69.3, dur: 0.9, ease: ease.move });
  tl.tween(annU, 0, { at: 69.3, dur: 0.9, ease: ease.move });
  tl.tween(specU, 0, { at: 69.3, dur: 0.9, ease: ease.move });
  tl.tween(gapU, 1, { at: 69.8, dur: 1.6, ease: ease.enter });
  tl.hold(76.5, 0.6);

  // — Beat 11 · compress first, and only first —
  tl.caption({
    at: 77.1,
    dur: 7.5,
    text: 'The pipeline order is forced by information theory. Compression must come first, because encrypted bytes look like random noise and no compressor can touch them. So each private chunk is squeezed by a dictionary-aware compressor while it is still plaintext — an overlay chunk full of filesystem structure shrinks to roughly a third.',
  });
  tl.tween(cam, CAM_LANE, { at: 77.3, dur: 1.6, ease: ease.move });
  tl.tween(gapU, 0.25, { at: 77.3, dur: 0.9, ease: ease.move });
  tl.tween(laneU, 1, { at: 77.6, dur: 1.4, ease: ease.draw });
  tl.tween(zstdU, 1, { at: 78.8, dur: 1.6, ease: ease.move });
  tl.hold(84.5, 0.6);

  // — Beat 12 · encrypt with a key the network never sees —
  tl.caption({
    at: 85.1,
    dur: 7.5,
    text: 'Then the compressed chunk is sealed with a key that exists only on your devices. What leaves the machine is ciphertext, content-addressed by the hash of the ciphertext itself — so the network can still verify, route, and deduplicate the bytes it carries without ever learning what they are.',
  });
  tl.tween(encU, 1, { at: 85.6, dur: 1.8, ease: ease.pop });
  tl.hold(92.5, 0.6);

  // — Beat 13 · shard and scatter —
  tl.caption({
    at: 93.1,
    dur: 7.5,
    text: 'The sealed chunk is then erasure-coded into six shards, any four of which reconstruct it. The reconciler from a moment ago scatters them across six different tailnet peers — a work laptop, a home desktop, a teammate\'s idle tab. No peer holds enough to matter, and two can vanish without losing a byte.',
  });
  tl.tween(shardU, 1, { at: 93.6, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_WIDE, { at: 95.0, dur: 1.6, ease: ease.move });
  tl.tween(scatterU, 1, { at: 95.8, dur: 2.4, ease: ease.move });
  tl.hold(100.5, 0.6);

  // — Beat 14 · what a peer actually holds —
  tl.caption({
    at: 101.1,
    dur: 7.5,
    text: 'Look at the swarm from a peer\'s side. It stores a fixed-size block of uniform noise with a hash for a name — no filename, no owner label, no structure. Even a peer that collected three of your six shards holds nothing: below the threshold the code reveals zero bytes, and above it the result is still ciphertext without your key.',
  });
  tl.tween(peerViewU, 1, { at: 101.6, dur: 1.6, ease: ease.enter });
  tl.hold(108.5, 0.6);

  // — Beat 15 · restore anywhere —
  tl.caption({
    at: 109.1,
    dur: 7.5,
    text: 'Now the payoff. Sit down at a brand-new device, unlock your key, and ask the tailnet for your manifest. Any four shards of each chunk stream back in parallel — one peer is offline, and it simply does not matter. Decode, decrypt, decompress, and hash-check against the manifest: your machine reassembles from the network.',
  });
  tl.tween(peerViewU, 0, { at: 109.3, dur: 0.9, ease: ease.move });
  tl.tween(cam, CAM_CLUSTER, { at: 109.3, dur: 1.6, ease: ease.move });
  tl.tween(restoreU, 1, { at: 110.2, dur: 2.2, ease: ease.move });
  tl.hold(116.5, 0.6);

  // — Beat 16 · the honest price —
  tl.caption({
    at: 117.1,
    dur: 7.5,
    text: 'One honest cost: per-user keys kill cross-user deduplication — two people who wrote the same file upload different ciphertext. The answer is to spend cleverness before the lock: within your own history, snapshots are deduplicated and delta-encoded against their parents first, so what gets sealed and sharded is already the minimal diff.',
  });
  tl.tween(dedupU, 1, { at: 117.6, dur: 1.6, ease: ease.enter });
  tl.hold(124.0, 0.6);

  // — Beat 17 · close —
  tl.caption({
    at: 124.6,
    dur: 7.0,
    text: 'So the tailnet ends up as one machine with two halves. The public half placed by policy and repaired by parity. The private half sealed, sharded, and scattered. Everyone stores it. Only you can read it.',
  });
  tl.tween(cam, CAM_WIDE, { at: 124.8, dur: 1.4, ease: ease.move });
  tl.tween(dimAll, 0.12, { at: 125.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 126.3, dur: 0.9, ease: ease.enter });
  tl.hold(130.6, 1.6);

  return {
    tl, cam, oursU, ipfsU, dhtU, clusterU, annU, specU, stripeU, crashU, repairU,
    gapU, laneU, zstdU, encU, shardU, scatterU, peerViewU, restoreU, dedupU, dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Store({
  x, y, u, title, addr, accent,
}: { x: number; y: number; u: number; title: string; addr: string; accent: string }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={x - 190} y={y - 70} width={380} height={140} rx={12} fill={colors.PANEL} stroke={accent} strokeWidth={1.6} />
      <text x={x} y={y - 40} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={700}>
        {title}
      </text>
      <text x={x} y={y - 14} textAnchor="middle" fill={accent} fontSize={12.5} fontFamily="monospace">
        {addr}
      </text>
      {[0, 1, 2].map((k) => (
        <rect key={k} x={x - 150 + k * 104} y={y + 6} width={92} height={26} rx={5} fill={accent} opacity={0.18} />
      ))}
      {[0, 1, 2].map((k) => (
        <text key={k} x={x - 104 + k * 104} y={y + 23} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
          {['a41f…', '9c02…', 'e7d8…'][k]}
        </text>
      ))}
      <text x={x} y={y + 56} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
        blocks named by their own hash
      </text>
    </g>
  );
}

function TabNode({
  x, y, u, dead, label, shard, privShard,
}: { x: number; y: number; u: number; dead?: number; label: string; shard?: string; privShard?: string }) {
  if (u <= 0) return null;
  const gone = dead ?? 0;
  const c = gone > 0.5 ? colors.NEGATIVE : colors.SECONDARY;
  return (
    <g opacity={u * (1 - gone * 0.75)}>
      <rect x={x - 30} y={y - 20} width={60} height={40} rx={6} fill={colors.PANEL} stroke={c} strokeWidth={1.4} strokeDasharray={gone > 0.5 ? '4 4' : undefined} />
      <rect x={x - 30} y={y - 20} width={60} height={10} rx={4} fill={c} opacity={0.35} />
      <text x={x} y={y + 4} textAnchor="middle" fill={c} fontSize={10.5}>
        {label}
      </text>
      {shard && gone < 0.5 && (
        <text x={x} y={y + 16} textAnchor="middle" fill={shard.startsWith('p') ? colors.WARM : colors.ACCENT} fontSize={10} fontWeight={700} fontFamily="monospace">
          {shard}
        </text>
      )}
      {privShard && gone < 0.5 && (
        <text x={x + 40} y={y + 4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10} fontWeight={700} fontFamily="monospace">
          {privShard}
        </text>
      )}
    </g>
  );
}

function StageBox({
  x, w, u, label, sub, color, hatch,
}: { x: number; w: number; u: number; label: string; sub: string; color: string; hatch?: boolean }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={LANE_Y - 24} width={w} height={48} rx={8} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
      {hatch &&
        Array.from({ length: Math.floor(w / 9) }, (_, i) => (
          <line
            key={i}
            x1={x - w / 2 + 4 + i * 9}
            y1={LANE_Y - 20}
            x2={x - w / 2 + 4 + i * 9 + 6}
            y2={LANE_Y + 20}
            stroke={color}
            strokeWidth={1}
            opacity={0.35}
          />
        ))}
      <text x={x} y={LANE_Y - 1} textAnchor="middle" fill={color} fontSize={12.5} fontWeight={700}>
        {label}
      </text>
      <text x={x} y={LANE_Y + 15} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
        {sub}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const oursU = s.get(scene.oursU);
  const ipfsU = s.get(scene.ipfsU);
  const dhtU = s.get(scene.dhtU);
  const clusterU = s.get(scene.clusterU);
  const annU = s.get(scene.annU);
  const specU = s.get(scene.specU);
  const stripeU = s.get(scene.stripeU);
  const crashU = s.get(scene.crashU);
  const repairU = s.get(scene.repairU);
  const gapU = s.get(scene.gapU);
  const laneU = s.get(scene.laneU);
  const zstdU = s.get(scene.zstdU);
  const encU = s.get(scene.encU);
  const shardU = s.get(scene.shardU);
  const scatterU = s.get(scene.scatterU);
  const peerViewU = s.get(scene.peerViewU);
  const restoreU = s.get(scene.restoreU);
  const dedupU = s.get(scene.dedupU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const stageU = [laneU, zstdU, encU, shardU];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- movement 1 beats 1–2: the two stores ---- */}
          <Store x={OURS.x} y={OURS.y} u={oursU} title="the ch-1 tailnet torrent" addr="peers trade chunks/<sha256>" accent={colors.ACCENT} />
          <Store x={IPFS.x} y={IPFS.y} u={ipfsU} title="IPFS" addr="/ipfs/<CID>" accent={colors.WARM} />
          {ipfsU > 0.3 && (
            <g opacity={clamp01(ipfsU * 2 - 0.6)}>
              <line x1={OURS.x + 196} y1={OURS.y} x2={IPFS.x - 196} y2={IPFS.y} stroke={colors.GRID} strokeWidth={1.4} />
              <text x={640} y={OURS.y - 10} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                same hash-named blocks — ours moves them, IPFS also PLACES them
              </text>
            </g>
          )}

          {/* ---- beat 3: who, not where ---- */}
          {dhtU > 0 && (
            <g opacity={dhtU}>
              <rect x={400} y={300} width={480} height={96} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={640} y={338} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
                <tspan fill={colors.NEGATIVE}>where</tspan> is chunk a41f…?   →   <tspan fill={colors.POSITIVE}>who</tspan> has chunk a41f…?
              </text>
              <text x={640} y={372} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                location becomes a lookup result, not part of the name
              </text>
            </g>
          )}

          {/* ---- the shared tab ring ---- */}
          {clusterU > 0 && (
            <g>
              {annU > 0 &&
                TABS.map((p, k) => (
                  <line
                    key={`an${k}`}
                    x1={p.x}
                    y1={p.y - 22}
                    x2={SCHED.x + (k % 2 ? 26 : -26)}
                    y2={SCHED.y + 24}
                    stroke={colors.SECONDARY}
                    strokeWidth={1.2}
                    strokeDasharray="3 5"
                    opacity={annU * (k === CRASHED && crashU > 0.5 ? 0.15 : 0.55)}
                  />
                ))}
              {TABS.map((p, k) => (
                <TabNode
                  key={k}
                  x={p.x}
                  y={p.y}
                  u={clamp01(clusterU * 2 - k * 0.12)}
                  dead={k === CRASHED ? crashU : 0}
                  label={
                    scatterU > 0.4
                      ? ['work laptop', 'home desktop', 'tab', 'old phone', 'office mini', 'your tab'][k]
                      : `tab ${k}`
                  }
                  shard={stripeU > 0.4 && scatterU < 0.4 ? (k === CRASHED && repairU > 0.6 ? undefined : SHARDS[k]) : undefined}
                  privShard={scatterU > 0.4 && k !== CRASHED ? `s${k}` : undefined}
                />
              ))}
              {repairU > 0.6 && scatterU < 0.4 && (
                <g opacity={clamp01(repairU * 3 - 1.8)}>
                  <rect x={TABS[5].x + 36} y={TABS[5].y - 20} width={40} height={40} rx={6} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
                  <text x={TABS[5].x + 56} y={TABS[5].y + 5} textAnchor="middle" fill={colors.ACCENT} fontSize={10} fontWeight={700} fontFamily="monospace">
                    {SHARDS[CRASHED]}′
                  </text>
                  <text x={TABS[5].x + 56} y={TABS[5].y - 28} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                    rebuilt from parity
                  </text>
                </g>
              )}

              {/* the reconciler */}
              {(annU > 0 || specU > 0) && (
                <g opacity={Math.max(annU, specU)}>
                  <rect x={SCHED.x - 96} y={SCHED.y - 26} width={192} height={52} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
                  <text x={SCHED.x} y={SCHED.y - 4} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700}>
                    reconciler
                  </text>
                  <text x={SCHED.x} y={SCHED.y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                    compare(desired, announced)
                  </text>
                </g>
              )}
              {specU > 0 && (
                <g opacity={specU}>
                  <text x={SCHED.x - 250} y={SCHED.y - 8} textAnchor="end" fill={colors.ACCENT} fontSize={12.5} fontFamily="monospace">
                    spec: hot × 3 replicas
                  </text>
                  <text
                    x={SCHED.x + 250}
                    y={SCHED.y - 8}
                    textAnchor="start"
                    fill={crashU > 0.5 && repairU < 0.6 ? colors.NEGATIVE : colors.SECONDARY}
                    fontSize={12.5}
                    fontFamily="monospace"
                  >
                    {crashU > 0.5 && repairU < 0.6 ? 'actual: DEGRADED' : 'actual: in spec'}
                  </text>
                </g>
              )}
              {stripeU > 0.3 && scatterU < 0.4 && (
                <text x={CL_CX} y={CL_CY + CL_R + 58} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={stripeU}>
                  4 data + 2 parity shards — any 4 of 6 tabs reconstruct the region
                </text>
              )}
            </g>
          )}

          {/* ---- movement 2 beat 10: public vs private ---- */}
          {gapU > 0 && (
            <g opacity={gapU}>
              <rect x={280} y={64} width={330} height={96} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
              <text x={445} y={100} textAnchor="middle" fill={colors.ACCENT} fontSize={14.5} fontWeight={700}>
                base image — public
              </text>
              <text x={445} y={124} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                shared chunks · placed by the reconciler
              </text>
              <rect x={670} y={64} width={330} height={96} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
              <text x={835} y={100} textAnchor="middle" fill={colors.WARM} fontSize={14.5} fontWeight={700}>
                your overlay + snapshots — private
              </text>
              <text x={835} y={124} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                every write since boot · exists in one place
              </text>
            </g>
          )}

          {/* ---- beats 11–13: the pipeline lane ---- */}
          {laneU > 0 && (
            <g opacity={laneU}>
              {STAGES.map((st, k) =>
                k < STAGES.length - 1 ? (
                  <g key={`ar${k}`} opacity={stageU[k + 1]}>
                    <line
                      x1={st.x + st.w / 2 + 8}
                      y1={LANE_Y}
                      x2={STAGES[k + 1].x - STAGES[k + 1].w / 2 - 8}
                      y2={LANE_Y}
                      stroke={colors.GRID}
                      strokeWidth={1.6}
                    />
                    <text
                      x={(st.x + st.w / 2 + STAGES[k + 1].x - STAGES[k + 1].w / 2) / 2}
                      y={LANE_Y - 10}
                      textAnchor="middle"
                      fill={colors.MUTED}
                      fontSize={13}
                    >
                      →
                    </text>
                  </g>
                ) : null
              )}
              <StageBox x={STAGES[0].x} w={STAGES[0].w} u={laneU} label={STAGES[0].label} sub={STAGES[0].sub} color={colors.WARM} />
              <StageBox x={STAGES[1].x} w={STAGES[1].w} u={zstdU} label={STAGES[1].label} sub={STAGES[1].sub} color={colors.POSITIVE} />
              <StageBox x={STAGES[2].x} w={STAGES[2].w} u={encU} label={STAGES[2].label} sub={STAGES[2].sub} color={colors.NEGATIVE} hatch />
              <StageBox x={STAGES[3].x} w={STAGES[3].w} u={shardU} label={STAGES[3].label} sub={STAGES[3].sub} color={colors.SECONDARY} />
              {zstdU > 0.5 && encU < 0.4 && (
                <text x={455} y={LANE_Y + 48} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} opacity={clamp01(zstdU * 2 - 1)}>
                  compress BEFORE encrypting — ciphertext is incompressible
                </text>
              )}
              {encU > 0.5 && (
                <text x={665} y={LANE_Y + 48} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} opacity={clamp01(encU * 2 - 1)}>
                  key lives only on your devices — network sees noise with a name
                </text>
              )}
              {shardU > 0.4 && (
                <g opacity={clamp01(shardU * 2 - 0.8)}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <rect key={i} x={STAGES[3].x - 66 + i * 22} y={LANE_Y + 34} width={16} height={16} rx={3} fill={colors.SECONDARY} opacity={0.75} />
                  ))}
                  <text x={STAGES[3].x} y={LANE_Y + 66} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                    s0 … s5 — Reed–Solomon (4 + 2)
                  </text>
                </g>
              )}
            </g>
          )}

          {/* scatter lines from the shard row to the ring */}
          {scatterU > 0 && restoreU < 0.1 && (
            <g>
              {TABS.map((p, k) =>
                k === CRASHED ? null : (
                  <line
                    key={`sc${k}`}
                    x1={STAGES[3].x - 66 + k * 22 + 8}
                    y1={LANE_Y + 50}
                    x2={p.x}
                    y2={p.y - 22}
                    stroke={colors.SECONDARY}
                    strokeWidth={1.1}
                    strokeDasharray="3 5"
                    opacity={clamp01(scatterU * 2 - k * 0.15) * 0.5}
                  />
                )
              )}
            </g>
          )}

          {/* restore: live peers stream shards to the new device */}
          {restoreU > 0 && (
            <g opacity={restoreU}>
              <rect x={CL_CX - 62} y={CL_CY - 26} width={124} height={52} rx={9} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
              <text x={CL_CX} y={CL_CY - 4} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontWeight={700}>
                new device
              </text>
              <text x={CL_CX} y={CL_CY + 14} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">
                key unlocked · needs any 4
              </text>
              {TABS.filter((_, k) => k !== CRASHED)
                .slice(0, 4)
                .map((p, k) => (
                  <line
                    key={`re${k}`}
                    x1={p.x}
                    y1={p.y + (p.y < CL_CY ? 22 : -22)}
                    x2={CL_CX}
                    y2={CL_CY + (p.y < CL_CY ? -28 : 28)}
                    stroke={colors.ACCENT}
                    strokeWidth={1.7}
                    opacity={clamp01(restoreU * 2 - k * 0.2) * 0.8}
                  />
                ))}
              <text x={CL_CX} y={CL_CY + CL_R + 76} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontWeight={700}>
                decode → decrypt → decompress → hash-verify
              </text>
            </g>
          )}

          {/* ---- beat 14: the peer's-eye view ---- */}
          {peerViewU > 0 && (
            <g opacity={peerViewU}>
              <rect x={880} y={330} width={340} height={150} rx={12} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.4} />
              <text x={1050} y={358} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
                what a peer stores
              </text>
              <text x={1050} y={382} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                7f3a92c1… → 32 KiB of uniform noise
              </text>
              <text x={1050} y={404} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                no filename · no owner · no structure
              </text>
              <text x={1050} y={428} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11}>
                3 of 6 shards + no key = zero bytes revealed
              </text>
              <text x={1050} y={452} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                blast radius of a compromised peer: none
              </text>
            </g>
          )}

          {/* ---- beat 16: dedup before the lock ---- */}
          {dedupU > 0 && (
            <g opacity={dedupU}>
              <rect x={70} y={330} width={360} height={128} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={250} y={358} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
                spend cleverness before the lock
              </text>
              <text x={250} y={384} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                snapshot N = delta(snapshot N−1) · dedup within your history
              </text>
              <text x={250} y={406} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                then compress → encrypt → shard the minimal diff
              </text>
              <text x={250} y={432} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontWeight={700}>
                cross-user dedup is the price of privacy — paid knowingly
              </text>
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={300} y={262} width={680} height={144} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={316} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              placed by policy · repaired by parity · sealed and scattered
            </text>
            <text x={640} y={360} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              everyone stores it — only you can read it
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
