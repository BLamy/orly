// A Read-Heavy Problem
//
// Backing files: solutions/system_design/pastebin/README.md (use cases,
// constraints, and the back-of-the-envelope math: 10M users, 10M writes/mo,
// 100M reads/mo, 10:1 read:write, 1.27 KB/paste, 12.7 GB/mo, ~450 GB and
// 360M shortlinks in 3 years, 4 writes/s vs 40 reads/s, 2.5M sec/month).
//
// Centerpiece: the demand lanes — a paste card shrinks into a link chip, then
// two particle lanes (writes a trickle, reads a flood) make the 10:1 ratio
// visceral. The envelope panel transforms: paste anatomy → a 36-month storage
// stack → two per-second meters. The chapter ends on the one promise the
// whole book keeps: following a link must be fast.
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
import { ParticleCloud } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The demand lanes — writes trickle, reads flood. All particle phases are
// precomputed with a seeded PRNG; playback derives positions from one linear
// `flow` channel, so every frame is a pure function of sampled state.
// ---------------------------------------------------------------------------

const LANES = { x0: 470, x1: 1210 } as const;
const WRITE_LANE = { y: 180, band: 26 } as const;
const READ_LANE = { y: 300, band: 84 } as const;

interface Streamer {
  phase: number; // 0..1 offset along the loop
  jitter: number; // -1..1 within the lane band
  speed: number; // relative speed multiplier
}

const rand = mulberry32(20260715);
const mkStream = (n: number): Streamer[] =>
  Array.from({ length: n }, () => ({
    phase: rand(),
    jitter: rand() * 2 - 1,
    speed: 0.85 + rand() * 0.3,
  }));

const WRITERS: Streamer[] = mkStream(9); // 10M writes/mo — the trickle
const READERS: Streamer[] = mkStream(90); // 100M reads/mo — the flood

// paste anatomy — real sizes from the pastebin README
const ANATOMY = [
  { label: 'shortlink', bytes: '7 B' },
  { label: 'expiration_length_in_minutes', bytes: '4 B' },
  { label: 'created_at', bytes: '5 B' },
  { label: 'paste_path', bytes: '255 B' },
] as const;

// storage stack — 36 bricks, one per month, 12.7 GB each
const BRICKS = { cols: 6, rows: 6, w: 34, h: 20, gap: 5, x0: 806, y0: 588 } as const;
const brickPos = (k: number): { x: number; y: number } => ({
  x: BRICKS.x0 + (k % BRICKS.cols) * (BRICKS.w + BRICKS.gap),
  y: BRICKS.y0 - Math.floor(k / BRICKS.cols) * (BRICKS.h + BRICKS.gap) - BRICKS.h,
});

// camera marks
const CAM_ASK: CameraState = { x: 320, y: 300, k: 1.45 };
const CAM_LANES: CameraState = { x: 800, y: 260, k: 1.18 };
const CAM_ENVELOPE: CameraState = { x: 780, y: 460, k: 1.28 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  askU: ChannelRef<number>;
  shrinkU: ChannelRef<number>;
  askDim: ChannelRef<number>;
  lanesU: ChannelRef<number>;
  flow: ChannelRef<number>;
  readU: ChannelRef<number>;
  ratioU: ChannelRef<number>;
  anatU: ChannelRef<number>;
  chipsU: ChannelRef<number>;
  stackU: ChannelRef<number>;
  metersU: ChannelRef<number>;
  spikeU: ChannelRef<number>;
  panelDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 360, y: 300, k: 1.18 }, cameraInterp);
  const askU = tl.channel('askU', 0);
  const shrinkU = tl.channel('shrinkU', 0);
  const askDim = tl.channel('askDim', 1);
  const lanesU = tl.channel('lanesU', 0);
  const flow = tl.channel('flow', 0);
  const readU = tl.channel('readU', 0);
  const ratioU = tl.channel('ratioU', 0);
  const anatU = tl.channel('anatU', 0);
  const chipsU = tl.channel('chipsU', 0);
  const stackU = tl.channel('stackU', 0);
  const metersU = tl.channel('metersU', 0);
  const spikeU = tl.channel('spikeU', 0);
  const panelDim = tl.channel('panelDim', 1);
  const closeU = tl.channel('closeU', 0);

  // one linear conveyor for the whole chapter — the lanes never stop
  tl.tween(flow, 12, { at: 13.0, dur: 52, ease: ease.linear });

  // — Beat 1 · the ask —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'The classic interview opener: design a paste service like Pastebin, or a link shortener like Bitly. Text goes in, and a short link comes back.',
  });
  tl.tween(askU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  // slow push-in on the ask — the opening beat breathes instead of freezing
  tl.tween(cam, CAM_ASK, { at: 0.5, dur: 3.0, ease: ease.move });
  tl.tween(shrinkU, 1, { at: 3.4, dur: 1.4, ease: ease.move });
  tl.hold(7.0, 0.6);

  // — Beat 2 · size before boxes —
  tl.caption({
    at: 7.6,
    dur: 5,
    text: 'Before drawing a single box, the primer sizes the workload. Ten million users are about to lean on this thing.',
  });
  tl.tween(cam, CAM_LANES, { at: 7.8, dur: 1.5, ease: ease.move });
  tl.tween(lanesU, 1, { at: 8.6, dur: 1.6, ease: ease.draw });

  // — Beat 3 · the write trickle —
  tl.caption({
    at: 12.9,
    dur: 5.5,
    text: 'Every month they write ten million new pastes. Watch the write lane — a steady, unhurried trickle.',
  });

  // — Beat 4 · the read flood —
  tl.caption({
    at: 18.8,
    dur: 6.7,
    text: 'And every month they read one hundred million. Ten reads for every write. This system is read-heavy, and that ratio will shape every choice that follows.',
  });
  tl.tween(readU, 1, { at: 19.4, dur: 1.8, ease: ease.draw });
  tl.tween(ratioU, 1, { at: 23.2, dur: 0.6, ease: ease.pop });
  tl.hold(25.5, 0.6);

  // — Beat 5 · weigh one paste —
  tl.caption({
    at: 26.3,
    dur: 6.7,
    text: 'Now weigh a single paste. One kilobyte of content, plus a whisper of metadata — a seven byte link, an expiration, a timestamp, a path. About one point two seven kilobytes.',
  });
  tl.tween(cam, CAM_ENVELOPE, { at: 26.5, dur: 1.5, ease: ease.move });
  tl.tween(anatU, 1, { at: 27.2, dur: 0.9, ease: ease.enter });
  tl.tween(chipsU, 1, { at: 28.4, dur: 2.4, ease: ease.move });
  tl.hold(33.0, 0.5);

  // — Beat 6 · multiply out —
  tl.caption({
    at: 33.6,
    dur: 6.4,
    text: 'Multiply it out: about twelve point seven gigabytes of new pastes a month. Stack three years of months and you get roughly four hundred fifty gigabytes — and three hundred sixty million links.',
  });
  tl.tween(stackU, 1, { at: 34.2, dur: 4.6, ease: ease.move });
  tl.hold(40.0, 0.5);

  // — Beat 7 · convert to seconds —
  tl.caption({
    at: 40.6,
    dur: 6,
    text: 'Convert to seconds — a month is about two and a half million of them. The monthly flood becomes four writes per second, and forty reads.',
  });
  tl.tween(metersU, 1, { at: 41.4, dur: 0.9, ease: ease.enter });

  // — Beat 8 · spikes —
  tl.caption({
    at: 47.0,
    dur: 5.5,
    text: 'Those are averages. Traffic is never evenly distributed — when a paste gets popular, the read meter will spike far past forty.',
  });
  tl.tween(spikeU, 1, { at: 48.2, dur: 0.7, ease: ease.pop });
  tl.tween(spikeU, 0.25, { at: 50.6, dur: 1.4, ease: ease.move });

  // — Beat 9 · the promise —
  tl.caption({
    at: 52.9,
    dur: 6.6,
    text: "So the brief is honest: modest data, gentle writes, and one hot promise — following a short link should feel instant. Keep the reads cheap, and everything else follows.",
  });
  tl.tween(cam, CAM_WIDE, { at: 53.1, dur: 1.6, ease: ease.move });
  tl.tween(askDim, 0.12, { at: 53.3, dur: 1.2, ease: ease.move });
  tl.tween(panelDim, 0.14, { at: 53.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.0, dur: 0.9, ease: ease.enter });
  tl.hold(59.5, 1.5);

  return {
    tl,
    cam,
    askU,
    shrinkU,
    askDim,
    lanesU,
    flow,
    readU,
    ratioU,
    anatU,
    chipsU,
    stackU,
    metersU,
    spikeU,
    panelDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function laneParticles(s: SceneState) {
  const lanesU = s.get(scene.lanesU);
  const readU = s.get(scene.readU);
  const flow = s.get(scene.flow);
  const pts = [];
  for (const w of WRITERS) {
    const u = (w.phase + flow * 0.08 * w.speed) % 1;
    pts.push({
      x: LANES.x0 + u * (LANES.x1 - LANES.x0),
      y: WRITE_LANE.y + w.jitter * WRITE_LANE.band * 0.5,
      r: 3.4,
      alpha: lanesU * 0.9 * Math.min(1, u * 8, (1 - u) * 8),
      color: colors.WARM,
    });
  }
  for (const rr of READERS) {
    const u = (rr.phase + flow * 0.11 * rr.speed) % 1;
    pts.push({
      x: LANES.x0 + u * (LANES.x1 - LANES.x0),
      y: READ_LANE.y + rr.jitter * READ_LANE.band * 0.5,
      r: 2.8,
      alpha: readU * 0.85 * Math.min(1, u * 8, (1 - u) * 8),
      color: colors.ACCENT,
    });
  }
  return pts;
}

function Meter({ x, y, value, unit, color, u, flare }: {
  x: number;
  y: number;
  value: string;
  unit: string;
  color: string;
  u: number;
  flare?: number;
}) {
  if (u <= 0) return null;
  const f = flare ?? 0;
  return (
    <g opacity={u}>
      <circle cx={x} cy={y} r={46 + 10 * f} fill="none" stroke={color} strokeWidth={2.5} opacity={0.5 + 0.5 * f} />
      <circle cx={x} cy={y} r={40} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={x} y={y + 1} textAnchor="middle" fill={color} fontSize={f > 0.3 ? 24 : 21} fontWeight={700}>
        {f > 0.3 ? '40+' : value}
      </text>
      <text x={x} y={y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
        {unit}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const askU = s.get(scene.askU);
  const shrinkU = s.get(scene.shrinkU);
  const askDim = s.get(scene.askDim);
  const lanesU = s.get(scene.lanesU);
  const readU = s.get(scene.readU);
  const ratioU = s.get(scene.ratioU);
  const anatU = s.get(scene.anatU);
  const chipsU = s.get(scene.chipsU);
  const stackU = s.get(scene.stackU);
  const metersU = s.get(scene.metersU);
  const spikeU = s.get(scene.spikeU);
  const panelDim = s.get(scene.panelDim);
  const closeU = s.get(scene.closeU);

  // the paste card collapses toward the link chip as shrinkU rises
  const cardW = 260 - 150 * shrinkU;
  const cardH = 200 - 156 * shrinkU;
  const cardX = 110 + 20 * shrinkU;
  const cardY = 170 + 60 * shrinkU;

  const bricksLit = stackU * 36;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the ask: paste in, link out ---- */}
        <g opacity={askU * askDim}>
          <rect x={cardX} y={cardY} width={cardW} height={cardH} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          {shrinkU < 0.65 &&
            [0, 1, 2, 3, 4].map((row) => (
              <rect
                key={row}
                x={cardX + 18}
                y={cardY + 24 + row * 26}
                width={(cardW - 36) * (0.55 + 0.4 * Math.abs(Math.sin(row * 2.1 + 1)))}
                height={9}
                rx={4}
                fill={colors.MUTED}
                opacity={(0.65 - shrinkU) * 0.8}
              />
            ))}
          <text x={cardX + cardW / 2} y={cardY - 14} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            {shrinkU > 0.6 ? 'a short link' : 'a wall of text — 1 KB'}
          </text>
          {shrinkU > 0.6 && (
            <text x={cardX + cardW / 2} y={cardY + cardH / 2 + 5} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily="monospace" opacity={(shrinkU - 0.6) / 0.4}>
              /dSUUsvo
            </text>
          )}
        </g>

        {/* ---- the demand lanes ---- */}
        <g opacity={lanesU * askDim}>
          <text x={LANES.x0} y={WRITE_LANE.y - 28} fill={colors.WARM} fontSize={14}>
            writes — 10 million a month
          </text>
          {/* conveyor baseline — dashes stream with the flow, pure f(flow) */}
          <line
            x1={LANES.x0}
            y1={WRITE_LANE.y + 22}
            x2={LANES.x1}
            y2={WRITE_LANE.y + 22}
            stroke={colors.GRID}
            strokeWidth={1}
            strokeDasharray="6 10"
            strokeDashoffset={-(s.get(scene.flow) * 90) % 16}
          />
        </g>
        <g opacity={readU * askDim}>
          <text x={LANES.x0} y={READ_LANE.y - 54} fill={colors.ACCENT} fontSize={14}>
            reads — 100 million a month
          </text>
          <line
            x1={LANES.x0}
            y1={READ_LANE.y + READ_LANE.band / 2 + 14}
            x2={LANES.x1}
            y2={READ_LANE.y + READ_LANE.band / 2 + 14}
            stroke={colors.GRID}
            strokeWidth={1}
            strokeDasharray="6 10"
            strokeDashoffset={-(s.get(scene.flow) * 140) % 16}
          />
        </g>
        <ParticleCloud state={s} compute={laneParticles} />
        {ratioU > 0 && (
          <g opacity={ratioU * askDim}>
            <text x={LANES.x1 - 6} y={READ_LANE.y - 54} textAnchor="end" fill={colors.TEXT} fontSize={22} fontWeight={700}>
              10 : 1
            </text>
            <text x={LANES.x1 - 6} y={READ_LANE.y - 34} textAnchor="end" fill={colors.MUTED} fontSize={12}>
              reads : writes
            </text>
          </g>
        )}

        {/* ---- the envelope: anatomy → stack → meters ---- */}
        <g opacity={anatU * panelDim}>
          <rect x={430} y={400} width={330} height={210} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={448} y={428} fill={colors.TEXT} fontSize={14}>
            one paste
          </text>
          {/* the 1 KB content slab */}
          <rect x={448} y={440} width={294 * clamp01(chipsU * 2)} height={44} rx={6} fill={colors.ACCENT} opacity={0.35} />
          <text x={456} y={467} fill={colors.TEXT} fontSize={12} fontFamily="monospace" opacity={clamp01(chipsU * 2)}>
            content — 1 KB
          </text>
          {/* metadata chips */}
          {ANATOMY.map((a, i) => {
            const u = clamp01(chipsU * 4 - i * 0.7 - 0.8);
            return (
              <g key={a.label} opacity={u}>
                <rect x={448} y={494 + i * 22} width={294} height={18} rx={4} fill={colors.BG} stroke={colors.GRID} />
                <text x={456} y={507 + i * 22} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                  {a.label}
                </text>
                <text x={734} y={507 + i * 22} textAnchor="end" fill={colors.WARM} fontSize={10.5} fontFamily="monospace">
                  {a.bytes}
                </text>
              </g>
            );
          })}
          <text x={595} y={600} textAnchor="middle" fill={colors.TEXT} fontSize={13} opacity={clamp01(chipsU * 3 - 2)}>
            ≈ 1.27 KB per paste
          </text>
        </g>

        {/* storage stack — 36 months of 12.7 GB */}
        <g opacity={panelDim}>
          {Array.from({ length: 36 }, (_, k) => {
            const u = clamp01(bricksLit - k);
            if (u <= 0) return null;
            const p = brickPos(k);
            return (
              <rect
                key={k}
                x={p.x}
                y={p.y}
                width={BRICKS.w}
                height={BRICKS.h}
                rx={3}
                fill={colors.SECONDARY}
                opacity={0.25 + 0.5 * u}
              />
            );
          })}
          {stackU > 0.1 && (
            <g opacity={clamp01(stackU * 2 - 0.4)}>
              <text x={922} y={392} textAnchor="middle" fill={colors.SECONDARY} fontSize={13}>
                36 months × 12.7 GB
              </text>
              <text x={922} y={412} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={600}>
                ≈ 450 GB · 360 M links
              </text>
            </g>
          )}
        </g>

        {/* the two per-second meters */}
        <g opacity={panelDim}>
          <Meter x={1080} y={470} value="4" unit="writes / s" color={colors.WARM} u={metersU} />
          <Meter x={1080} y={575} value="40" unit="reads / s" color={colors.ACCENT} u={metersU} flare={spikeU} />
        </g>

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={340} y={250} width={600} height={150} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              modest data · gentle writes
            </text>
            <text x={640} y={352} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              reads must be fast
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
