// Quorums: two dials on the front panel
//
// Grounding: README.md "Consistency patterns" (#consistency-patterns) —
// strong: "After a write, reads will see it. Data is replicated
// synchronously"; eventual: "After a write, reads will eventually see it
// (typically within milliseconds). Data is replicated asynchronously";
// "CAP theorem" (#cap-theorem). The N/R/W quorum mechanics are from the
// primer's cited key-value-store solution (the Dynamo paper, README.md
// "Design a key-value store like Redis" → amazon-dynamo-sosp2007.pdf, §4.5:
// "R + W > N yields a quorum-like system").
//
// Centerpiece: the OVERLAP MACHINE — three replica lanes under a control
// panel with two dials, W and R. Write and read sets are drawn as translucent
// bands over the lanes; when W + R > N the bands must share a lane (it
// flashes), and when the dials drop to 1/1 the bands miss and a stale read
// happens on screen.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Packet } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const LANES = ['B', 'C', 'D'] as const;
const LANE_COLOR = [colors.SECONDARY, colors.POSITIVE, colors.TEAL];
const LANE_X = 380;
const LANE_W = 520;
const LANE_H = 72;
const laneY = (i: number): number => 262 + i * 100; // row centers
const CHIP_X = 790; // stored-value chip slot inside each lane
const COORD = { x: 180, y: 362 } as const;

const PANEL = { x: LANE_X, y: 84, w: LANE_W, h: 92 } as const;
const DIAL_W = { x: 600, y: PANEL.y + 46 } as const;
const DIAL_R = { x: 760, y: PANEL.y + 46 } as const;

// right column ends ≤ 1205: CAM_LANES (k=1.12) shows stage x up to ≈1211
const README_CHIP = { x: 920, y: 120, w: 282, h: 132 } as const;
const LAT = { x: 920, y: 330, w: 282, h: 130 } as const;

const VERSION_COLOR: Record<string, string> = {
  v1: colors.MUTED,
  v2: colors.WARM,
  v3: colors.ACCENT,
};

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_PANEL: CameraState = { x: 665, y: 220, k: 1.3 };
const CAM_LANES: CameraState = { x: 640, y: 350, k: 1.12 };

// ---------------------------------------------------------------------------
// Timeline (~89s, thirteen beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_LANES, cameraInterp);

  const rigU = tl.channel('rigU', 0); // lanes + coordinator + panel
  const wGlow = tl.channel('wGlow', 0); // dial intro glows
  const rGlow = tl.channel('rGlow', 0);
  const wVal = tl.channel('wVal', 2); // the W dial (2 → 3 → 1)
  const rVal = tl.channel('rVal', 2); // the R dial (2 → 1 → 1)

  const write1U = tl.channel('write1U', 0); // W=2 write: packets to all lanes
  const ack1U = tl.channel('ack1U', 0); // acks back from B and C
  const ok1U = tl.channel('ok1U', 0); // "write OK" stamp
  const staleU = tl.channel('staleU', 0); // D's "stale" tag

  const read1U = tl.channel('read1U', 0); // R=2 read: probes out 0..1, back 1..2
  const cmpU = tl.channel('cmpU', 0); // version compare + v2 wins

  const bandsU = tl.channel('bandsU', 0); // write/read set bands
  const flashU = tl.channel('flashU', 0); // overlap lane flash (0..3 pulses)
  const texU = tl.channel('texU', 0); // W + R > N

  const latU = tl.channel('latU', 0); // latency panel
  const cfgU = tl.channel('cfgU', 0); // bands morph 2/2 → 3/1 with the dials
  const strongU = tl.channel('strongU', 0); // README strong-consistency chip
  const missU = tl.channel('missU', 0); // bands slide to the 1/1 miss layout
  const write2U = tl.channel('write2U', 0); // W=1 write to B only
  const read2U = tl.channel('read2U', 0); // R=1 read from D, 0..1 out 1..2 back
  const evU = tl.channel('evU', 0); // README eventual-consistency chip
  const capU = tl.channel('capU', 0); // CAP chip
  const closeU = tl.channel('closeU', 0); // quiet stage + centered formula

  // — beat 1 · the rig —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Three replicas now hold our key. In front of them sits a coordinator, and on its control panel there are exactly two dials: W and R.',
  });
  tl.tween(rigU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAM_PANEL, { at: 3.2, dur: 1.4, ease: ease.move });

  // — beat 2 · what the dials mean —
  tl.caption({
    at: 7.2,
    dur: 6.2,
    text: 'W is how many replicas must confirm a write before you call it done. R is how many replicas you ask before you trust a read.',
  });
  tl.tween(wGlow, 1, { at: 7.6, dur: 0.6, ease: ease.pop });
  tl.tween(wGlow, 0, { at: 10.2, dur: 0.8, ease: ease.enter });
  tl.tween(rGlow, 1, { at: 10.4, dur: 0.6, ease: ease.pop });
  tl.tween(rGlow, 0, { at: 12.8, dur: 0.8, ease: ease.enter });

  // — beat 3 · a write at W = 2 —
  tl.caption({
    at: 14.0,
    dur: 6.4,
    text: 'Watch a write with W at two. The new value goes out to all three replicas — but the coordinator only waits for two confirmations.',
  });
  tl.tween(cam, CAM_LANES, { at: 14.2, dur: 1.3, ease: ease.move });
  tl.tween(write1U, 1, { at: 15.4, dur: 1.6, ease: ease.linear });
  tl.tween(ack1U, 1, { at: 17.2, dur: 1.2, ease: ease.linear });
  tl.tween(ok1U, 1, { at: 18.6, dur: 0.5, ease: ease.pop });

  // — beat 4 · the allowed stale replica —
  tl.caption({
    at: 21.0,
    dur: 5.6,
    text: "B and C confirm, and done is declared. D never got the update — nobody waited for it. That's a stale replica, and it's allowed.",
  });
  tl.tween(staleU, 1, { at: 22.0, dur: 0.7, ease: ease.enter });

  // — beat 5 · a read at R = 2 —
  tl.caption({
    at: 27.2,
    dur: 6.2,
    text: 'Now a read with R at two. Ask two replicas — say D and C. One answers with the old value, one with the new. Version numbers break the tie.',
  });
  tl.tween(read1U, 1, { at: 27.8, dur: 1.2, ease: ease.linear });
  tl.tween(read1U, 2, { at: 29.2, dur: 1.2, ease: ease.linear });
  tl.tween(cmpU, 1, { at: 30.8, dur: 0.7, ease: ease.pop });

  // — beat 6 · why it works: the overlap —
  tl.caption({
    at: 34.2,
    dur: 6.6,
    text: 'Why did that work? Touch two replicas writing and two reading, out of three total — the write set and the read set must share at least one node.',
  });
  tl.tween(bandsU, 1, { at: 34.8, dur: 1.4, ease: ease.draw });
  tl.tween(flashU, 3, { at: 36.6, dur: 2.6, ease: ease.linear });

  // — beat 7 · the one-line guarantee —
  tl.caption({
    at: 41.6,
    dur: 5.0,
    text: "That's the entire guarantee, and it fits in one line: W plus R, greater than N.",
  });
  tl.tween(texU, 1, { at: 42.4, dur: 0.7, ease: ease.pop });

  // — beat 8 · crank W to three —
  tl.caption({
    at: 47.4,
    dur: 6.4,
    text: 'The dials trade speed for certainty. Crank W to three: every write now waits for the slowest machine, and write latency stretches out.',
  });
  tl.tween(wVal, 3, { at: 48.2, dur: 1.2, ease: ease.move });
  tl.tween(rVal, 1, { at: 48.2, dur: 1.2, ease: ease.move });
  tl.tween(cfgU, 1, { at: 48.2, dur: 1.2, ease: ease.move });
  tl.tween(latU, 1, { at: 49.0, dur: 0.8, ease: ease.enter });

  // — beat 9 · strong consistency —
  tl.caption({
    at: 54.4,
    dur: 5.6,
    text: "In exchange, reads relax to R of one — any single replica is guaranteed fresh. The primer calls this strong consistency: after a write, reads will see it.",
  });
  tl.tween(strongU, 1, { at: 55.0, dur: 0.8, ease: ease.enter });

  // — beat 10 · spin both down —
  tl.caption({
    at: 60.6,
    dur: 6.4,
    text: 'Now spin both dials down to one. Writes barely wait, reads barely ask — and the two bands can miss each other completely.',
  });
  tl.tween(strongU, 0, { at: 60.8, dur: 0.6, ease: ease.enter });
  tl.tween(wVal, 1, { at: 61.2, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 61.2, dur: 0.8, ease: ease.enter });
  tl.tween(missU, 1, { at: 62.6, dur: 1.4, ease: ease.move });

  // — beat 11 · the stale read, live —
  tl.caption({
    at: 67.6,
    dur: 6.2,
    text: "Here's the miss, live: the write lands on B alone, the read asks D — and the customer sees yesterday's value. Not broken. Eventual: reads will eventually see it.",
  });
  tl.tween(write2U, 1, { at: 68.2, dur: 1.0, ease: ease.linear });
  tl.tween(read2U, 1, { at: 69.6, dur: 1.0, ease: ease.linear });
  tl.tween(read2U, 2, { at: 70.8, dur: 1.0, ease: ease.linear });
  tl.tween(evU, 1, { at: 71.8, dur: 0.8, ease: ease.enter });

  // — beat 12 · CAP with knobs on —
  tl.caption({
    at: 74.4,
    dur: 6.2,
    text: "This is the C-A-P theorem with knobs on. When the network partitions you can't have both perfect consistency and perfect availability — the dials let you choose your loss.",
  });
  tl.tween(cam, CAM_WIDE, { at: 74.6, dur: 1.5, ease: ease.move });
  tl.tween(evU, 0, { at: 75.0, dur: 0.6, ease: ease.enter });
  tl.tween(capU, 1, { at: 75.6, dur: 0.8, ease: ease.enter });

  // — beat 13 · dial in your loss —
  tl.caption({
    at: 81.2,
    dur: 6.2,
    text: 'So a key-value store never picks consistency or availability once and for all. It exposes N, W, and R — and every team dials in the loss it can live with.',
  });
  tl.tween(capU, 0, { at: 81.4, dur: 0.6, ease: ease.enter });
  tl.tween(closeU, 1, { at: 81.8, dur: 1.2, ease: ease.move });
  tl.hold(87.4, 1.6);

  return {
    tl,
    cam,
    rigU,
    wGlow,
    rGlow,
    wVal,
    rVal,
    write1U,
    ack1U,
    ok1U,
    staleU,
    read1U,
    cmpU,
    bandsU,
    flashU,
    texU,
    latU,
    cfgU,
    strongU,
    missU,
    write2U,
    read2U,
    evU,
    capU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

function Dial({ x, y, label, value, glow }: { x: number; y: number; label: string; value: number; glow: number }) {
  const shown = Math.round(value);
  const angle = -120 + ((value - 1) / 2) * 240; // 1..3 → -120°..120°
  return (
    <g>
      {glow > 0 && <circle cx={x} cy={y} r={40} fill={colors.ACCENT} opacity={0.18 * glow} />}
      <circle cx={x} cy={y} r={30} fill={colors.BG} stroke={colors.GRID} strokeWidth={2} />
      {[1, 2, 3].map((v) => {
        const a = ((-120 + ((v - 1) / 2) * 240) * Math.PI) / 180;
        return (
          <circle key={v} cx={x + 24 * Math.sin(a)} cy={y - 24 * Math.cos(a)} r={1.6} fill={colors.MUTED} />
        );
      })}
      <line
        x1={x}
        y1={y}
        x2={x + 20 * Math.sin((angle * Math.PI) / 180)}
        y2={y - 20 * Math.cos((angle * Math.PI) / 180)}
        stroke={colors.ACCENT}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <text x={x} y={y + 52} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={700} fontFamily={MONO}>
        {label} = {shown}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rigU = s.get(scene.rigU);
  const wGlow = s.get(scene.wGlow);
  const rGlow = s.get(scene.rGlow);
  const wVal = s.get(scene.wVal);
  const rVal = s.get(scene.rVal);
  const write1U = s.get(scene.write1U);
  const ack1U = s.get(scene.ack1U);
  const ok1U = s.get(scene.ok1U);
  const staleU = s.get(scene.staleU);
  const read1U = s.get(scene.read1U);
  const cmpU = s.get(scene.cmpU);
  const bandsU = s.get(scene.bandsU);
  const flashU = s.get(scene.flashU);
  const texU = s.get(scene.texU);
  const latU = s.get(scene.latU);
  const cfgU = s.get(scene.cfgU);
  const strongU = s.get(scene.strongU);
  const missU = s.get(scene.missU);
  const write2U = s.get(scene.write2U);
  const read2U = s.get(scene.read2U);
  const evU = s.get(scene.evU);
  const capU = s.get(scene.capU);
  const closeU = s.get(scene.closeU);

  const stage = 1 - 0.85 * closeU;

  // stored versions per lane (B, C, D)
  const versions = [
    write2U >= 0.98 ? 'v3' : write1U >= 0.95 ? 'v2' : 'v1',
    write1U >= 0.98 ? 'v2' : 'v1',
    'v1',
  ];

  // write/read set bands track the dials: 2/2 → (cfgU) 3/1 → (missU) 1/1
  const bandTop = (i: number): number => laneY(i) - LANE_H / 2 - 8;
  const bandBot = (i: number): number => laneY(i) + LANE_H / 2 + 8;
  const wBot = lerp(lerp(bandBot(1), bandBot(2), cfgU), bandBot(0), missU);
  const rTop = lerp(bandTop(1), bandTop(2), Math.max(cfgU, missU));
  const wBand = { y: bandTop(0), h: wBot - bandTop(0) };
  const rBand = { y: rTop, h: bandBot(2) - rTop };
  const overlapFlash = Math.abs(Math.sin(Math.PI * flashU)) * (1 - missU);

  // per-lane write-1 packet progress: B and C at full speed, D dropped mid-flight
  const wp = [clamp01(write1U * 1.15), clamp01(write1U * 1.05), clamp01(write1U * 0.62)];
  const dDropFade = write1U > 0.9 ? clamp01((1 - write1U) * 10) : 1;

  // latency bars from the dial values (wait-for-slowest grows with the dial)
  const wLat = 36 + ((wVal - 1) / 2) * 180;
  const rLat = 36 + ((rVal - 1) / 2) * 180;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={rigU * stage}>
          {/* the write/read set bands (under the lanes) */}
          <g opacity={bandsU}>
            <rect x={LANE_X - 14} y={wBand.y} width={LANE_W + 28} height={wBand.h} rx={16} fill={colors.ACCENT} opacity={0.1} stroke={colors.ACCENT} strokeWidth={1.4} strokeDasharray="5 5" />
            <text x={LANE_X - 26} y={wBand.y + 24} textAnchor="end" fill={colors.ACCENT} fontSize={14} fontWeight={600}>
              write set
            </text>
            <rect x={LANE_X - 14} y={rBand.y} width={LANE_W + 28} height={rBand.h} rx={16} fill={colors.POSITIVE} opacity={0.1} stroke={colors.POSITIVE} strokeWidth={1.4} strokeDasharray="5 5" />
            <text x={LANE_X + LANE_W + 26} y={rBand.y + rBand.h - 12} fill={colors.POSITIVE} fontSize={14} fontWeight={600}>
              read set
            </text>
          </g>

          {/* replica lanes */}
          {LANES.map((nd, i) => {
            const flash = i === 1 ? overlapFlash : 0;
            return (
              <g key={nd}>
                <rect
                  x={LANE_X}
                  y={laneY(i) - LANE_H / 2}
                  width={LANE_W}
                  height={LANE_H}
                  rx={12}
                  fill={colors.PANEL}
                  stroke={flash > 0.05 ? colors.WARM : colors.GRID}
                  strokeWidth={1.5 + 2 * flash}
                />
                <text x={LANE_X + 24} y={laneY(i) + 6} fill={LANE_COLOR[i]} fontSize={18} fontWeight={700}>
                  {nd}
                </text>
                <text x={LANE_X + 52} y={laneY(i) + 6} fill={colors.MUTED} fontSize={12}>
                  replica
                </text>
                {/* the stored value chip */}
                <rect x={CHIP_X} y={laneY(i) - 20} width={76} height={40} rx={9} fill={colors.BG} stroke={VERSION_COLOR[versions[i]]} strokeWidth={1.8} />
                <text x={CHIP_X + 38} y={laneY(i) + 6} textAnchor="middle" fill={VERSION_COLOR[versions[i]]} fontSize={15} fontFamily={MONO} fontWeight={700}>
                  {versions[i]}
                </text>
                {i === 2 && staleU > 0 && (
                  <g opacity={staleU}>
                    <text x={CHIP_X + 38} y={laneY(i) + 34} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontStyle="italic">
                      stale — allowed
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* coordinator */}
          <rect x={COORD.x - 74} y={COORD.y - 46} width={148} height={92} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={COORD.x} y={COORD.y - 12} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
            coordinator
          </text>
          <text x={COORD.x} y={COORD.y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            {write1U === 0
              ? 'ready'
              : ok1U > 0.5
                ? write2U > 0.5
                  ? 'W=1 → OK'
                  : 'acks 2/2 → OK'
                : `waiting ${Math.min(Math.floor(ack1U * 2), 1) + (ack1U >= 1 ? 1 : 0)}/2`}
          </text>
          {ok1U > 0 && (
            <g opacity={ok1U}>
              <rect x={COORD.x - 34} y={COORD.y + 24} width={68} height={26} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} />
              <text x={COORD.x} y={COORD.y + 42} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontWeight={700}>
                OK
              </text>
            </g>
          )}

          {/* control panel with the two dials */}
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={PANEL.x + 22} y={PANEL.y + 34} fill={colors.MUTED} fontSize={13} fontStyle="italic">
            control panel
          </text>
          <text x={PANEL.x + 22} y={PANEL.y + 62} fill={colors.TEXT} fontSize={17} fontFamily={MONO} fontWeight={700}>
            N = 3
          </text>
          <Dial x={DIAL_W.x} y={DIAL_W.y} label="W" value={wVal} glow={wGlow} />
          <Dial x={DIAL_R.x} y={DIAL_R.y} label="R" value={rVal} glow={rGlow} />

          {/* W=2 write: packets out, acks back, D's copy dropped */}
          {write1U > 0 && write1U < 1 && (
            <g>
              {[0, 1].map((i) => (
                <Packet key={i} from={{ x: COORD.x + 74, y: COORD.y }} to={{ x: CHIP_X, y: laneY(i) }} u={wp[i]} r={6.5} color={colors.WARM} label={i === 0 && wp[0] < 0.9 ? 'set v2' : undefined} />
              ))}
              <g opacity={dDropFade}>
                <Packet from={{ x: COORD.x + 74, y: COORD.y }} to={{ x: CHIP_X, y: laneY(2) }} u={wp[2]} r={6.5} color={colors.WARM} opacity={0.7} />
              </g>
            </g>
          )}
          {ack1U > 0 && ack1U < 1 && (
            <g>
              <Packet from={{ x: LANE_X, y: laneY(0) }} to={{ x: COORD.x + 74, y: COORD.y - 14 }} u={clamp01(ack1U * 1.3)} r={5} color={colors.SECONDARY} label="ack" />
              <Packet from={{ x: LANE_X, y: laneY(1) }} to={{ x: COORD.x + 74, y: COORD.y + 14 }} u={clamp01(ack1U * 1.05)} r={5} color={colors.POSITIVE} label="ack" />
            </g>
          )}

          {/* R=2 read: probes to C and D, versioned answers return */}
          {read1U > 0 && read1U < 2 && (
            <g>
              {read1U <= 1 ? (
                <g>
                  <Packet from={{ x: COORD.x + 74, y: COORD.y }} to={{ x: CHIP_X, y: laneY(1) }} u={read1U} r={5.5} color={colors.POSITIVE} />
                  <Packet from={{ x: COORD.x + 74, y: COORD.y }} to={{ x: CHIP_X, y: laneY(2) }} u={read1U} r={5.5} color={colors.POSITIVE} />
                </g>
              ) : (
                <g>
                  <Packet from={{ x: CHIP_X, y: laneY(1) }} to={{ x: COORD.x + 74, y: COORD.y - 14 }} u={read1U - 1} r={6.5} color={VERSION_COLOR.v2} label="v2" />
                  <Packet from={{ x: CHIP_X, y: laneY(2) }} to={{ x: COORD.x + 74, y: COORD.y + 14 }} u={read1U - 1} r={6.5} color={VERSION_COLOR.v1} label="v1" />
                </g>
              )}
            </g>
          )}
          {cmpU > 0 && (
            <g opacity={cmpU * (1 - bandsU * 0.4)}>
              <rect x={COORD.x - 62} y={COORD.y - 108} width={124} height={44} rx={10} fill={colors.BG} stroke={VERSION_COLOR.v2} strokeWidth={1.6} />
              <text x={COORD.x} y={COORD.y - 80} textAnchor="middle" fill={VERSION_COLOR.v2} fontSize={14} fontFamily={MONO} fontWeight={700}>
                {'v2 > v1 ✓'}
              </text>
            </g>
          )}

          {/* the 1/1 miss, live */}
          {write2U > 0 && write2U < 1 && (
            <Packet from={{ x: COORD.x + 74, y: COORD.y }} to={{ x: CHIP_X, y: laneY(0) }} u={write2U} r={6.5} color={VERSION_COLOR.v3} label="set v3" />
          )}
          {read2U > 0 && read2U < 2 && (
            <g>
              {read2U <= 1 ? (
                <Packet from={{ x: COORD.x + 74, y: COORD.y }} to={{ x: CHIP_X, y: laneY(2) }} u={read2U} r={5.5} color={colors.POSITIVE} />
              ) : (
                <Packet from={{ x: CHIP_X, y: laneY(2) }} to={{ x: COORD.x + 74, y: COORD.y }} u={read2U - 1} r={6.5} color={VERSION_COLOR.v1} label="v1 — stale" />
              )}
            </g>
          )}

          {/* W + R > N */}
          <g opacity={texU}>
            <rect x={920} y={96} width={282} height={64} rx={12} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.6} />
            <MathLabel tex={'W + R > N'} x={1061} y={112} fontSize={24} color={colors.WARM} anchor="middle" />
          </g>

          {/* latency bars, driven by the dials */}
          <g opacity={latU}>
            <rect x={LAT.x} y={LAT.y} width={LAT.w} height={LAT.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={LAT.x + 20} y={LAT.y + 30} fill={colors.MUTED} fontSize={13} fontStyle="italic">
              latency — wait for the slowest
            </text>
            <text x={LAT.x + 20} y={LAT.y + 62} fill={colors.TEXT} fontSize={13}>
              write
            </text>
            <rect x={LAT.x + 66} y={LAT.y + 50} width={wLat} height={14} rx={7} fill={colors.ACCENT} opacity={0.85} />
            <text x={LAT.x + 20} y={LAT.y + 98} fill={colors.TEXT} fontSize={13}>
              read
            </text>
            <rect x={LAT.x + 66} y={LAT.y + 86} width={rLat} height={14} rx={7} fill={colors.POSITIVE} opacity={0.85} />
          </g>

          {/* README chips (one slot, three tenants) */}
          {strongU > 0.01 && (
            <g opacity={strongU}>
              <rect x={READM(0).x} y={READM(0).y} width={READM(0).w} height={READM(0).h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={READM(0).x + 20} y={READM(0).y + 30} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                README · Strong consistency
              </text>
              <text x={READM(0).x + 20} y={READM(0).y + 60} fill={colors.TEXT} fontSize={14} fontStyle="italic">
                “After a write, reads will see it.
              </text>
              <text x={READM(0).x + 20} y={READM(0).y + 82} fill={colors.TEXT} fontSize={14} fontStyle="italic">
                Data is replicated synchronously.”
              </text>
            </g>
          )}
          {evU > 0.01 && (
            <g opacity={evU}>
              <rect x={READM(0).x} y={READM(0).y} width={READM(0).w} height={READM(0).h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={READM(0).x + 20} y={READM(0).y + 30} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                README · Eventual consistency
              </text>
              <text x={READM(0).x + 20} y={READM(0).y + 60} fill={colors.TEXT} fontSize={14} fontStyle="italic">
                “After a write, reads will eventually
              </text>
              <text x={READM(0).x + 20} y={READM(0).y + 82} fill={colors.TEXT} fontSize={14} fontStyle="italic">
                see it (typically within milliseconds).”
              </text>
            </g>
          )}
          {capU > 0.01 && (
            <g opacity={capU}>
              <rect x={READM(0).x} y={READM(0).y} width={READM(0).w} height={READM(0).h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={READM(0).x + 20} y={READM(0).y + 30} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                README · CAP theorem
              </text>
              <text x={READM(0).x + 20} y={READM(0).y + 60} fill={colors.TEXT} fontSize={14} fontStyle="italic">
                “…a software tradeoff between
              </text>
              <text x={READM(0).x + 20} y={READM(0).y + 82} fill={colors.TEXT} fontSize={14} fontStyle="italic">
                consistency and availability.”
              </text>
            </g>
          )}
        </g>

        {/* the quiet closing: the formula on an opaque panel */}
        <g opacity={closeU}>
          <rect x={410} y={270} width={460} height={150} rx={16} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
          <MathLabel tex={'W + R > N'} x={640} y={300} fontSize={34} color={colors.WARM} anchor="middle" />
          <text x={640} y={392} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontStyle="italic">
            tune the dials, choose your loss
          </text>
        </g>
      </Camera>
    </>
  );
}

// README chip slot (single location, reused by the three chips)
function READM(_: number): { x: number; y: number; w: number; h: number } {
  return README_CHIP;
}

export const vizScene = () => scene;
