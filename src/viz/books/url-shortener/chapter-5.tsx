// What Breaks First
//
// Backing files: solutions/system_design/pastebin/README.md Step 4 (scale the
// design: Load Balancer + horizontal Web Servers, Memory Cache for uneven
// traffic, SQL Read Replicas absorb misses, single SQL Write Master-Slave is
// enough at 4 writes/s, else Federation/Sharding/Denormalization/SQL Tuning;
// MapReduce over Web Server logs for monthly hit counts — the HitCounts
// mapper/reducer emitting ((2016-01, url0), 1) pairs; expired pastes deleted
// by scanning for expiration older than now; S3 comfortably handles
// 12.7 GB/month) and solutions/system_design/scaling_aws/README.md
// (the benchmark → profile → address-bottleneck → repeat loop).
//
// Centerpiece: the traffic dial. Crank it and watch the design fail one
// bottleneck at a time — the lone web server reddens and is rescued by a
// load balancer with horizontal replicas; the read flood is absorbed by the
// cache and replicas from chapter four; write escalation stays on the shelf.
// Then MapReduce folds raw log lines into monthly hit counts, the expiry
// sweep dissolves stale rows, and the recap retraces the link's whole life.
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
import { Connection, RequestFlow, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — the final architecture (pastebin README step-4 diagram, internal
// load balancers omitted to reduce clutter, as the primer itself does).
// ---------------------------------------------------------------------------

const N = {
  client: { x: 170, y: 250 },
  lb: { x: 360, y: 250 },
  web: { x: 540, y: 250 },
  readApi: { x: 730, y: 170 },
  writeApi: { x: 730, y: 340 },
  cache: { x: 950, y: 90 },
  replicas: { x: 950, y: 190 },
  master: { x: 950, y: 300 },
  store: { x: 950, y: 410 },
  analytics: { x: 730, y: 470 },
  cdn: { x: 360, y: 110 },
} as const;

// the MapReduce fold — real shape from the HitCounts MRJob in the README
const LOG_LINES = [
  'GET /dSUUsvo 200',
  'GET /x7Rq2Lp 200',
  'GET /dSUUsvo 200',
  'GET /M4nv0Yt 200',
] as const;
const MAPPED = [
  '(2016-01, dSUUsvo), 1',
  '(2016-01, x7Rq2Lp), 1',
  '(2016-01, dSUUsvo), 1',
  '(2016-01, M4nv0Yt), 1',
] as const;
const REDUCED = [
  '(2016-01, dSUUsvo), 2',
  '(2016-01, x7Rq2Lp), 1',
  '(2016-01, M4nv0Yt), 1',
] as const;

// the expiry sweep table
const EXP_ROWS = [
  { link: 'aB93kQz', exp: 'expired', dead: true },
  { link: 'dSUUsvo', exp: '41 min left', dead: false },
  { link: 'pE6sW1c', exp: 'expired', dead: true },
  { link: 'Zk82hFw', exp: 'no expiry', dead: false },
] as const;

const ESCALATION = ['Federation', 'Sharding', 'Denormalization', 'SQL Tuning'] as const;

const CAM_DIAL: CameraState = { x: 420, y: 260, k: 1.3 };
const CAM_ARCH: CameraState = { x: 700, y: 270, k: 1.12 };
const CAM_PANEL: CameraState = { x: 640, y: 500, k: 1.3 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  loopU: ChannelRef<number>;
  loopSpin: ChannelRef<number>;
  archU: ChannelRef<number>;
  dial: ChannelRef<number>;
  hurtU: ChannelRef<number>;
  lbU: ChannelRef<number>;
  readGlow: ChannelRef<number>;
  escU: ChannelRef<number>;
  mrU: ChannelRef<number>;
  mrFold: ChannelRef<number>;
  expU: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  storeU: ChannelRef<number>;
  panelOff: ChannelRef<number>;
  recapU: ChannelRef<number>;
  archDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_DIAL, cameraInterp);
  const loopU = tl.channel('loopU', 0);
  const loopSpin = tl.channel('loopSpin', 0);
  const archU = tl.channel('archU', 0);
  const dial = tl.channel('dial', 0);
  const hurtU = tl.channel('hurtU', 0);
  const lbU = tl.channel('lbU', 0);
  const readGlow = tl.channel('readGlow', 0);
  const escU = tl.channel('escU', 0);
  const mrU = tl.channel('mrU', 0);
  const mrFold = tl.channel('mrFold', 0);
  const expU = tl.channel('expU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const storeU = tl.channel('storeU', 0);
  const panelOff = tl.channel('panelOff', 0);
  const recapU = tl.channel('recapU', 0);
  const archDim = tl.channel('archDim', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · one bottleneck at a time —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: "Systems don't fail everywhere at once — they fail one bottleneck at a time. The primer's method is a loop: benchmark, profile for the bottleneck, fix it, and go again.",
  });
  tl.tween(loopU, 1, { at: 0.7, dur: 1.2, ease: ease.draw });
  tl.tween(loopSpin, 2, { at: 1.2, dur: 5.5, ease: ease.linear });
  tl.hold(6.9, 0.5);

  // — Beat 2 · crank it —
  tl.caption({
    at: 7.5,
    dur: 5.6,
    text: 'So crank the dial and watch. The first thing to buckle is the single web server standing in front of everything, taking every request alone.',
  });
  tl.tween(archU, 1, { at: 7.7, dur: 1.6, ease: ease.enter });
  tl.tween(cam, CAM_ARCH, { at: 7.9, dur: 1.6, ease: ease.move });
  tl.tween(dial, 1, { at: 9.3, dur: 2.4, ease: ease.move });
  tl.tween(hurtU, 1, { at: 10.5, dur: 1.6, ease: ease.move });
  tl.hold(13.1, 0.5);

  // — Beat 3 · horizontal —
  tl.caption({
    at: 13.7,
    dur: 5.8,
    text: 'The fix is horizontal: put a load balancer in front and add identical web servers beside the first — any one of them can answer, and losing one no longer matters.',
  });
  tl.tween(lbU, 1, { at: 14.3, dur: 1.2, ease: ease.enter });
  tl.tween(hurtU, 0, { at: 16.3, dur: 1.2, ease: ease.move });
  tl.hold(19.5, 0.5);

  // — Beat 4 · the read flood, already solved —
  tl.caption({
    at: 20.1,
    dur: 5.9,
    text: 'The read flood hits next, and you already know this answer: the memory cache soaks up the hot links, and the read replicas take the misses.',
  });
  tl.tween(readGlow, 1, { at: 20.7, dur: 1.2, ease: ease.move });
  tl.tween(readGlow, 0.2, { at: 24.6, dur: 1.2, ease: ease.move });

  // — Beat 5 · write escalation —
  tl.caption({
    at: 26.0,
    dur: 6.4,
    text: "Writes stay gentle — four a second fits one master with a standby. If that ever stops being true, the escalation shelf is ready: federation, sharding, denormalization, and query tuning.",
  });
  tl.tween(escU, 1, { at: 27.6, dur: 3.2, ease: ease.move });
  tl.hold(32.4, 0.5);

  // — Beat 6 · MapReduce analytics —
  tl.caption({
    at: 33.0,
    dur: 6.6,
    text: 'Analytics never needed to be realtime, so nothing realtime gets built. A map reduce job chews through the raw web server logs and folds them into monthly hit counts per link.',
  });
  tl.tween(cam, CAM_PANEL, { at: 33.2, dur: 1.5, ease: ease.move });
  tl.tween(mrU, 1, { at: 34.0, dur: 1.0, ease: ease.enter });
  tl.tween(mrFold, 1, { at: 35.4, dur: 3.6, ease: ease.linear });
  tl.hold(39.6, 0.5);

  // — Beat 7 · the janitor —
  tl.caption({
    at: 40.2,
    dur: 5.6,
    text: 'Expired pastes get a janitor: a periodic scan compares each expiration to the clock, and whatever has gone stale is deleted.',
  });
  tl.tween(mrU, 0, { at: 40.4, dur: 0.8, ease: ease.move });
  tl.tween(expU, 1, { at: 41.2, dur: 0.8, ease: ease.enter });
  tl.tween(sweepU, 1, { at: 42.4, dur: 2.8, ease: ease.linear });
  tl.hold(45.8, 0.5);

  // — Beat 8 · what doesn't break —
  tl.caption({
    at: 46.4,
    dur: 5.2,
    text: "And the object store? Twelve point seven gigabytes of new content a month barely registers. Some parts of a design simply refuse to be the bottleneck.",
  });
  tl.tween(expU, 0, { at: 46.6, dur: 0.8, ease: ease.move });
  tl.tween(storeU, 1, { at: 47.4, dur: 1.0, ease: ease.pop });

  // — Beat 9 · the whole answer —
  tl.caption({
    at: 52.0,
    dur: 7,
    text: 'Pull back, and the whole answer is on the table: a name minted from a hash and spelled in base 62, metadata in a relational row, content in an object store, and the hot reads served from memory at the edge.',
  });
  tl.tween(cam, CAM_WIDE, { at: 52.2, dur: 1.8, ease: ease.move });
  tl.tween(panelOff, 1, { at: 52.2, dur: 1.0, ease: ease.move });
  tl.tween(storeU, 0.4, { at: 52.2, dur: 1.0, ease: ease.move });
  tl.tween(recapU, 1, { at: 54.4, dur: 4.2, ease: ease.linear });
  tl.hold(59.4, 0.5);

  // — Beat 10 · solved —
  tl.caption({
    at: 60.0,
    dur: 6.6,
    text: "That's the URL shortener, solved. Interviewers aren't asking you to memorize boxes — they want exactly this: size the load, split the data, cache the reads, and know what breaks first.",
  });
  tl.tween(archDim, 0.13, { at: 60.4, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 61.8, dur: 1.0, ease: ease.enter });
  tl.hold(66.6, 1.6);

  return {
    tl,
    cam,
    loopU,
    loopSpin,
    archU,
    dial,
    hurtU,
    lbU,
    readGlow,
    escU,
    mrU,
    mrFold,
    expU,
    sweepU,
    storeU,
    panelOff,
    recapU,
    archDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const LOOP_STEPS = ['benchmark', 'profile', 'address', 'repeat'] as const;

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const loopU = s.get(scene.loopU);
  const loopSpin = s.get(scene.loopSpin);
  const archU = s.get(scene.archU);
  const dial = s.get(scene.dial);
  const hurtU = s.get(scene.hurtU);
  const lbU = s.get(scene.lbU);
  const readGlow = s.get(scene.readGlow);
  const escU = s.get(scene.escU);
  const mrU = s.get(scene.mrU);
  const mrFold = s.get(scene.mrFold);
  const expU = s.get(scene.expU);
  const sweepU = s.get(scene.sweepU);
  const storeU = s.get(scene.storeU);
  const panelOff = s.get(scene.panelOff);
  const recapU = s.get(scene.recapU);
  const archDim = s.get(scene.archDim);
  const closeU = s.get(scene.closeU);

  const loopFade = clamp01(1 - archU * 1.2);
  const needleAngle = -120 + 210 * dial; // dial from ×1 to ×10

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the benchmark→profile→fix loop ring ---- */}
        {loopU > 0 && loopFade > 0 && (
          <g opacity={loopU * loopFade}>
            <circle cx={420} cy={260} r={110} fill="none" stroke={colors.GRID} strokeWidth={2} />
            {LOOP_STEPS.map((step, i) => {
              const ang = (i / 4) * Math.PI * 2 - Math.PI / 2;
              const active = Math.floor(loopSpin * 4) % 4 === i;
              return (
                <g key={step}>
                  <circle cx={420 + Math.cos(ang) * 110} cy={260 + Math.sin(ang) * 110} r={active ? 10 : 6} fill={active ? colors.WARM : colors.MUTED} />
                  <text
                    x={420 + Math.cos(ang) * 152}
                    y={260 + Math.sin(ang) * 152 + 5}
                    textAnchor="middle"
                    fill={active ? colors.WARM : colors.MUTED}
                    fontSize={active ? 16 : 13}
                  >
                    {step}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ---- the traffic dial ---- */}
        {archU > 0 && (
          <g opacity={archU * archDim * (1 - panelOff * 0.5)}>
            <circle cx={170} cy={110} r={52} fill={colors.PANEL} stroke={colors.GRID} />
            <line
              x1={170}
              y1={110}
              x2={170 + Math.cos((needleAngle * Math.PI) / 180) * 38}
              y2={110 + Math.sin((needleAngle * Math.PI) / 180) * 38}
              stroke={dial > 0.6 ? colors.NEGATIVE : colors.WARM}
              strokeWidth={3.5}
              strokeLinecap="round"
            />
            <text x={170} y={182} textAnchor="middle" fill={dial > 0.6 ? colors.NEGATIVE : colors.MUTED} fontSize={13} fontWeight={700}>
              traffic ×{Math.max(1, Math.round(1 + dial * 9))}
            </text>
          </g>
        )}

        {/* ---- the architecture ---- */}
        {archU > 0 && (
          <g opacity={archDim}>
            <ServiceNode x={N.client.x} y={N.client.y} kind="client" label="Client" u={archU} />
            <ServiceNode x={N.cdn.x} y={N.cdn.y} kind="cdn" label="CDN" u={clamp01(archU * 1.4 - 0.2)} />
            {lbU > 0 && <ServiceNode x={N.lb.x} y={N.lb.y} kind="lb" label="Load Balancer" u={lbU} />}
            <ServiceNode
              x={N.web.x}
              y={N.web.y}
              kind="server"
              label={lbU > 0.5 ? 'Web Servers' : 'Web Server'}
              sublabel={lbU > 0.5 ? 'horizontal' : 'alone'}
              u={archU}
              status={hurtU > 0.5 ? 'down' : lbU > 0.5 ? 'ok' : undefined}
              glow={hurtU}
              replicas={lbU > 0.5 ? 4 : undefined}
            />
            <ServiceNode x={N.readApi.x} y={N.readApi.y} kind="server" label="Read API" u={clamp01(archU * 1.4 - 0.3)} />
            <ServiceNode x={N.writeApi.x} y={N.writeApi.y} kind="server" label="Write API" u={clamp01(archU * 1.4 - 0.3)} />
            <ServiceNode x={N.cache.x} y={N.cache.y} kind="cache" label="Memory Cache" u={clamp01(archU * 1.4 - 0.4)} glow={readGlow} />
            <ServiceNode x={N.replicas.x} y={N.replicas.y} kind="db" label="Read Replicas" u={clamp01(archU * 1.4 - 0.4)} replicas={3} glow={readGlow * 0.8} />
            <ServiceNode
              x={N.master.x}
              y={N.master.y}
              kind="db"
              label="SQL Master-Slave"
              sublabel="4 writes / s"
              u={clamp01(archU * 1.4 - 0.5)}
            />
            <ServiceNode x={N.store.x} y={N.store.y} kind="storage" label="Object Store" sublabel="12.7 GB / mo" u={clamp01(archU * 1.4 - 0.5)} glow={storeU} />
            <ServiceNode x={N.analytics.x} y={N.analytics.y} kind="db" label="Analytics" sublabel="warehouse" u={clamp01(archU * 1.4 - 0.6)} />

            {/* wiring */}
            <Connection from={{ x: N.client.x + 46, y: N.client.y }} to={{ x: (lbU > 0 ? N.lb.x : N.web.x) - 56, y: N.web.y }} u={archU} arrow />
            <Connection from={{ x: N.client.x + 20, y: N.client.y - 34 }} to={{ x: N.cdn.x - 50, y: N.cdn.y }} elbow="v" u={clamp01(archU * 1.4 - 0.2)} arrow dashed />
            {lbU > 0 && <Connection from={{ x: N.lb.x + 52, y: N.lb.y }} to={{ x: N.web.x - 56, y: N.web.y }} u={lbU} arrow />}
            <Connection from={{ x: N.web.x + 56, y: N.web.y - 12 }} to={{ x: N.readApi.x - 56, y: N.readApi.y }} elbow="h" u={clamp01(archU * 1.4 - 0.3)} arrow />
            <Connection from={{ x: N.web.x + 56, y: N.web.y + 12 }} to={{ x: N.writeApi.x - 56, y: N.writeApi.y }} elbow="h" u={clamp01(archU * 1.4 - 0.3)} arrow />
            <Connection from={{ x: N.readApi.x + 56, y: N.readApi.y - 10 }} to={{ x: N.cache.x - 62, y: N.cache.y }} elbow="h" u={clamp01(archU * 1.4 - 0.4)} arrow />
            <Connection from={{ x: N.readApi.x + 56, y: N.readApi.y + 8 }} to={{ x: N.replicas.x - 62, y: N.replicas.y }} elbow="h" u={clamp01(archU * 1.4 - 0.4)} arrow />
            <Connection from={{ x: N.writeApi.x + 56, y: N.writeApi.y - 8 }} to={{ x: N.master.x - 62, y: N.master.y }} elbow="h" u={clamp01(archU * 1.4 - 0.5)} arrow />
            <Connection from={{ x: N.writeApi.x + 56, y: N.writeApi.y + 10 }} to={{ x: N.store.x - 62, y: N.store.y }} elbow="h" u={clamp01(archU * 1.4 - 0.5)} arrow />
            <Connection from={{ x: N.analytics.x, y: N.analytics.y - 34 }} to={{ x: N.web.x, y: N.web.y + 34 }} elbow="v" u={clamp01(archU * 1.4 - 0.6)} dashed arrow label="logs" labelSize={9} />
          </g>
        )}

        {/* ---- the write escalation shelf ---- */}
        {escU > 0 && (
          <g opacity={archDim * (1 - panelOff) * (1 - mrU) * (1 - expU)}>
            {ESCALATION.map((e, i) => {
              const u = clamp01(escU * 4 - i * 0.8);
              if (u <= 0) return null;
              return (
                <g key={e} opacity={u}>
                  <rect x={1090} y={250 + i * 34} width={150} height={26} rx={7} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.2} />
                  <text x={1165} y={268 + i * 34} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5}>
                    {e}
                  </text>
                </g>
              );
            })}
            <text x={1165} y={240} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontStyle="italic" opacity={clamp01(escU * 2)}>
              if writes ever grow
            </text>
          </g>
        )}

        {/* ---- MapReduce panel ---- */}
        {mrU > 0 && (
          <g opacity={mrU}>
            <rect x={330} y={430} width={620} height={180} rx={12} fill={colors.BG} />
            <rect x={330} y={430} width={620} height={180} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={348} y={456} fill={colors.TEXT} fontSize={13}>
              MapReduce over the raw logs
            </text>
            <text x={932} y={456} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
              class HitCounts(MRJob)
            </text>
            {/* raw log lines */}
            {LOG_LINES.map((line, i) => {
              const gone = clamp01(mrFold * 2.2 - i * 0.25);
              return (
                <text key={i} x={348} y={482 + i * 22} fill={colors.MUTED} fontSize={11} fontFamily="monospace" opacity={1 - gone * 0.75}>
                  {line}
                </text>
              );
            })}
            {/* mapped pairs */}
            {MAPPED.map((line, i) => {
              const u = clamp01(mrFold * 2.2 - i * 0.25 - 0.3);
              const folded = clamp01(mrFold * 2 - 1.2);
              return (
                <text key={i} x={560} y={482 + i * 22} fill={colors.TEAL} fontSize={11} fontFamily="monospace" opacity={u * (1 - folded * 0.7)}>
                  {line}
                </text>
              );
            })}
            {/* reduced counts */}
            {REDUCED.map((line, i) => {
              const u = clamp01(mrFold * 3 - 1.8 - i * 0.3);
              return (
                <text key={i} x={790} y={490 + i * 24} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace" fontWeight={700} opacity={u}>
                  {line}
                </text>
              );
            })}
            <text x={560} y={594} fill={colors.MUTED} fontSize={10}>
              mapper — (month, url), 1
            </text>
            <text x={790} y={594} fill={colors.MUTED} fontSize={10}>
              reducer — sum per key
            </text>
          </g>
        )}

        {/* ---- expiry sweep panel ---- */}
        {expU > 0 && (
          <g opacity={expU}>
            <rect x={390} y={430} width={500} height={176} rx={12} fill={colors.BG} />
            <rect x={390} y={430} width={500} height={176} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={408} y={456} fill={colors.TEXT} fontSize={13}>
              the janitor — delete where expired
            </text>
            <text x={872} y={456} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
              created_at + expiration &lt; now
            </text>
            {EXP_ROWS.map((r, i) => {
              const y = 474 + i * 30;
              const swept = sweepU > (i + 0.5) / EXP_ROWS.length;
              const dying = r.dead && swept;
              return (
                <g key={r.link} opacity={dying ? 0.25 : 1}>
                  <rect x={408} y={y} width={464} height={24} rx={5} fill={colors.BG} stroke={dying ? colors.NEGATIVE : colors.GRID} strokeWidth={dying ? 1.4 : 1} />
                  <text x={422} y={y + 16} fill={dying ? colors.NEGATIVE : colors.TEXT} fontSize={11.5} fontFamily="monospace" textDecoration={dying ? 'line-through' : undefined}>
                    {r.link}
                  </text>
                  <text x={858} y={y + 16} textAnchor="end" fill={dying ? colors.NEGATIVE : colors.MUTED} fontSize={11} fontFamily="monospace">
                    {r.exp}
                  </text>
                </g>
              );
            })}
            {/* the sweep beam */}
            {sweepU > 0 && sweepU < 1 && (
              <line x1={408} y1={474 + sweepU * 118} x2={872} y2={474 + sweepU * 118} stroke={colors.WARM} strokeWidth={2} opacity={0.8} />
            )}
          </g>
        )}

        {/* ---- the recap: one link's whole life ---- */}
        {recapU > 0 && (
          <g opacity={archDim}>
            <RequestFlow
              path={[
                { x: N.client.x, y: N.client.y },
                { x: N.lb.x, y: N.lb.y },
                { x: N.web.x, y: N.web.y },
                { x: N.writeApi.x, y: N.writeApi.y },
                { x: N.master.x, y: N.master.y },
                { x: N.store.x, y: N.store.y },
                { x: N.cache.x, y: N.cache.y },
                { x: N.cdn.x, y: N.cdn.y },
                { x: N.client.x, y: N.client.y },
              ]}
              u={recapU}
              color={colors.ACCENT}
              label="dSUUsvo"
              labelSize={11}
              hold={false}
            />
          </g>
        )}

        {/* ---- closing ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={310} y={230} width={660} height={180} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={282} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
              size the load · split the data · cache the reads
            </text>
            <text x={640} y={318} textAnchor="middle" fill={colors.ACCENT} fontSize={19} fontWeight={700}>
              know what breaks first
            </text>
            <text x={640} y={368} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              System Design, Solved · №1 — the URL shortener
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
