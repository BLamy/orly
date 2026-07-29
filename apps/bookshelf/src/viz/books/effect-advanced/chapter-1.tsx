// Pull, Don't Push
//
// Backing files: packages/effect/src/Stream.ts (Stream<A, E, R> wraps
// channel: Channel<NonEmptyReadonlyArray<A>, E, void, …>; toPull returns
// Pull<NonEmptyReadonlyArray<A>, E>), packages/effect/src/Channel.ts,
// packages/effect/src/Pull.ts (end-of-input as Cause.Done in the error
// channel), ai-docs/src/03_stream/10_creating-streams.ts (Stream.fromIterable)
// and 20_consuming-streams.ts (Stream.map, run* consumers).
//
// Centerpiece: the pull line — demand pulses race upstream along a demand
// wire, chunk crates answer downstream through a map station, and the camera
// then descends a three-floor cross-section (Stream → Channel → Pull) before
// the amber Done token flows down the same rail and seals the collector.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The pull line — three stations on a rail, a demand wire underneath.
// ---------------------------------------------------------------------------

const RAIL_Y = 250; // crates travel here, left → right
const WIRE_Y = 330; // demand pulses travel here, right → left
const SRC = { x: 190, w: 220 } as const;
const MAP = { x: 640, w: 210 } as const;
const RUN = { x: 1090, w: 190 } as const;

// three pull rounds — the source hands out its five values in crates
const ROUNDS = [
  { raw: [1, 2], mapped: [10, 20] },
  { raw: [3, 4], mapped: [30, 40] },
  { raw: [5], mapped: [50] },
] as const;

// the cross-section tower under the rail
const TOWER = { x: 340, y: 425, w: 600, floorH: 56, gap: 10 } as const;
const FLOORS = [
  { code: 'Stream<A, E, R>', note: 'values over time, emitted in chunks' },
  { code: 'channel: Channel<NonEmptyReadonlyArray<A>, E, void>', note: 'read input · write output · typed error · typed done' },
  { code: 'Stream.toPull  →  Pull<NonEmptyReadonlyArray<A>, E>', note: 'one effect per step: a chunk, a failure, or done' },
] as const;

// camera marks
const CAM_LINE: CameraState = { x: 640, y: 280, k: 1.12 };
const CAM_WIRE: CameraState = { x: 700, y: 310, k: 1.3 };
const CAM_TOWER: CameraState = { x: 640, y: 460, k: 1.32 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pipeU: ChannelRef<number>;
  runU: ChannelRef<number>;
  cyc1: ChannelRef<number>;
  cyc2: ChannelRef<number>;
  cyc3: ChannelRef<number>;
  busyU: ChannelRef<number>;
  towerU: ChannelRef<number>;
  floorHi: ChannelRef<number>;
  pull4: ChannelRef<number>;
  doneU: ChannelRef<number>;
  sealU: ChannelRef<number>;
  stageDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_LINE, cameraInterp);
  const pipeU = tl.channel('pipeU', 0);
  const runU = tl.channel('runU', 0);
  const cyc1 = tl.channel('cyc1', 0);
  const cyc2 = tl.channel('cyc2', 0);
  const cyc3 = tl.channel('cyc3', 0);
  const busyU = tl.channel('busyU', 0);
  const towerU = tl.channel('towerU', 0);
  const floorHi = tl.channel('floorHi', 0);
  const pull4 = tl.channel('pull4', 0);
  const doneU = tl.channel('doneU', 0);
  const sealU = tl.channel('sealU', 0);
  const stageDim = tl.channel('stageDim', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · push vs pull —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'Most streaming tools push: the source fires values at you and hopes you keep up. Effect streams run the other way around — nothing moves until somebody asks.',
  });
  tl.tween(pipeU, 1, { at: 0.6, dur: 1.5, ease: ease.draw });
  tl.hold(7.5, 0.6);

  // — Beat 2 · a stream is a description —
  tl.caption({
    at: 8.1,
    dur: 6,
    text: 'A stream is only a description. Build the source, bolt on a map stage, and still nothing runs. It waits for a consumer, like collect, to start pulling.',
  });
  tl.tween(runU, 1, { at: 10.6, dur: 0.7, ease: ease.enter });
  tl.hold(14.1, 0.6);

  // — Beat 3 · the first pull —
  tl.caption({
    at: 14.7,
    dur: 5,
    text: 'Watch the ask happen. The consumer sends one pull upstream — a little packet of demand racing backwards through the pipeline.',
  });
  tl.tween(cam, CAM_WIRE, { at: 14.9, dur: 1.2, ease: ease.move });
  // cycle 1: pulse upstream (0 → 0.32), crate downstream (0.45 → 1)
  tl.tween(cyc1, 0.32, { at: 15.9, dur: 1.5, ease: ease.linear });

  // — Beat 4 · the source answers with a chunk —
  tl.caption({
    at: 19.9,
    dur: 6,
    text: 'And the source answers with a chunk — a crate of values, not one lonely element. Batching is built into the engine, so the cost per element stays tiny.',
  });
  tl.tween(cam, CAM_LINE, { at: 20.1, dur: 1.2, ease: ease.move });
  tl.tween(cyc1, 0.62, { at: 20.7, dur: 1.6, ease: ease.linear });

  // — Beat 5 · the map station —
  tl.caption({
    at: 26.1,
    dur: 5.5,
    text: 'On the way down, the map stage transforms the crate in flight. Operators are stations on the line — they never copy the whole stream.',
  });
  tl.tween(cyc1, 1, { at: 26.9, dur: 2.2, ease: ease.linear });
  tl.hold(31.6, 0.5);

  // — Beat 6 · consumer sets the pace —
  tl.caption({
    at: 32.1,
    dur: 7.5,
    text: 'Here is the good part: the consumer sets the pace. A second pull, a second crate. Then the consumer gets busy — and the source simply waits. Backpressure, for free.',
  });
  tl.tween(cyc2, 1, { at: 32.5, dur: 3.4, ease: ease.linear });
  tl.tween(busyU, 1, { at: 36.4, dur: 0.5, ease: ease.enter });
  tl.tween(busyU, 0, { at: 39.2, dur: 0.5, ease: ease.enter });
  tl.hold(39.6, 0.4);

  // — Beat 7 · open the machine: Stream floor —
  tl.caption({
    at: 40.0,
    dur: 5.5,
    text: 'Now open the machine. A stream is a thin wrapper: inside, it is a channel that emits non-empty arrays of your elements.',
  });
  tl.tween(cam, CAM_TOWER, { at: 40.2, dur: 1.4, ease: ease.move });
  tl.tween(towerU, 1, { at: 40.6, dur: 1.5, ease: ease.draw });
  tl.set(floorHi, 1, 41.0);
  tl.set(floorHi, 2, 43.4);

  // — Beat 8 · Channel floor —
  tl.caption({
    at: 45.5,
    dur: 5.5,
    text: 'A channel is the general machine underneath: it can read input, write output, fail with a typed error, and finish with a typed done value.',
  });

  // — Beat 9 · Pull floor —
  tl.caption({
    at: 51.0,
    dur: 5.5,
    text: 'And at the very bottom sits pull — one effect per step. Each evaluation returns a chunk, fails, or reports that the stream is over.',
  });
  tl.set(floorHi, 3, 51.4);

  // — Beat 10 · done rides the error channel —
  tl.caption({
    at: 56.5,
    dur: 6,
    text: 'The end of input rides in the error channel as a special done signal — cheap to detect, and never confused with a real failure.',
  });
  tl.hold(62.5, 0.5);

  // — Beat 11 · the source runs dry —
  tl.caption({
    at: 63.0,
    dur: 7,
    text: 'Back on the line, the last crate ships, and the next pull finds the source empty. The amber done token flows down the same rail, and the collector seals with every value in order.',
  });
  tl.tween(cam, CAM_WIDE, { at: 63.2, dur: 1.4, ease: ease.move });
  tl.set(floorHi, 0, 63.2);
  tl.tween(cyc3, 1, { at: 63.4, dur: 3.0, ease: ease.linear });
  tl.tween(pull4, 1, { at: 66.6, dur: 1.2, ease: ease.linear });
  tl.tween(doneU, 1, { at: 67.9, dur: 1.6, ease: ease.linear });
  tl.tween(sealU, 1, { at: 69.4, dur: 0.6, ease: ease.pop });

  // — Beat 12 · payoff —
  tl.caption({
    at: 70.8,
    dur: 6.5,
    text: 'That is the whole trick. Map, filter, take — every operator you will ever use is just another station bolted into the same pull line.',
  });
  tl.tween(stageDim, 0.13, { at: 71.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 72.6, dur: 0.8, ease: ease.enter });
  tl.hold(77.3, 1.5);

  return {
    tl,
    cam,
    pipeU,
    runU,
    cyc1,
    cyc2,
    cyc3,
    busyU,
    towerU,
    floorHi,
    pull4,
    doneU,
    sealU,
    stageDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Station({ x, w, title, code, u, glow }: {
  x: number;
  w: number;
  title: string;
  code: string;
  u: number;
  glow?: number;
}) {
  if (u <= 0) return null;
  const h = 74;
  return (
    <g opacity={u}>
      <rect
        x={x - w / 2}
        y={RAIL_Y - h / 2}
        width={w}
        height={h}
        rx={12}
        fill={colors.PANEL}
        stroke={glow && glow > 0.05 ? colors.ACCENT : colors.GRID}
        strokeWidth={glow && glow > 0.05 ? 2.5 : 1}
      />
      <text x={x} y={RAIL_Y - 10} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={600}>
        {title}
      </text>
      <text x={x} y={RAIL_Y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
        {code}
      </text>
    </g>
  );
}

// a crate of values traveling the rail; u: 0 at source edge, 1 at collector
function Crate({ u, raw, mapped }: { u: number; raw: readonly number[]; mapped: readonly number[] }) {
  if (u <= 0 || u >= 1) return null;
  const x0 = SRC.x + SRC.w / 2 + 24;
  const x1 = RUN.x - RUN.w / 2 - 24;
  const x = lerp(x0, x1, u);
  // the map station sits at ~46% of the rail — values swap as the crate passes
  const past = x > MAP.x;
  const vals = past ? mapped : raw;
  const w = vals.length * 34 + 14;
  const flash = clamp01(1 - Math.abs(x - MAP.x) / 46);
  return (
    <g>
      <rect
        x={x - w / 2}
        y={RAIL_Y - 20}
        width={w}
        height={40}
        rx={8}
        fill={colors.BG}
        stroke={past ? colors.POSITIVE : colors.ACCENT}
        strokeWidth={1.5 + flash * 1.5}
      />
      {vals.map((v, i) => (
        <text
          key={i}
          x={x - w / 2 + 24 + i * 34}
          y={RAIL_Y + 5}
          textAnchor="middle"
          fill={past ? colors.POSITIVE : colors.ACCENT}
          fontSize={15}
          fontFamily="monospace"
          fontWeight={700}
        >
          {v}
        </text>
      ))}
    </g>
  );
}

// a demand pulse traveling the wire; u: 0 at consumer, 1 at source
function Pulse({ u }: { u: number }) {
  if (u <= 0 || u >= 1) return null;
  const x = lerp(RUN.x - RUN.w / 2, SRC.x + SRC.w / 2, u);
  return (
    <g>
      <circle cx={x} cy={WIRE_Y} r={7} fill={colors.WARM} opacity={0.95} />
      <circle cx={x} cy={WIRE_Y} r={13} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={0.5} />
      <text x={x} y={WIRE_Y + 28} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily="monospace">
        pull
      </text>
    </g>
  );
}

// cycle phases: pulse upstream 0→0.32 · dwell · crate downstream 0.45→1
const pulseU = (cyc: number): number => clamp01(cyc / 0.32);
const crateU = (cyc: number): number => clamp01((cyc - 0.45) / 0.55);

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pipeU = s.get(scene.pipeU);
  const runU = s.get(scene.runU);
  const cycs = [s.get(scene.cyc1), s.get(scene.cyc2), s.get(scene.cyc3)];
  const busyU = s.get(scene.busyU);
  const towerU = s.get(scene.towerU);
  const floorHi = s.get(scene.floorHi);
  const pull4 = s.get(scene.pull4);
  const doneU = s.get(scene.doneU);
  const sealU = s.get(scene.sealU);
  const stageDim = s.get(scene.stageDim);
  const closeU = s.get(scene.closeU);

  // collected values appear as each cycle completes
  const collected: number[] = [];
  ROUNDS.forEach((r, k) => {
    if (cycs[k] >= 0.995) collected.push(...r.mapped);
  });

  const railX0 = SRC.x + SRC.w / 2;
  const railX1 = RUN.x - RUN.w / 2;

  // the map station glows while any crate passes it
  const mapGlow = Math.max(
    0,
    ...cycs.map((cyc) => {
      const u = crateU(cyc);
      if (u <= 0 || u >= 1) return 0;
      return clamp01(1 - Math.abs(lerp(railX0 + 24, railX1 - 24, u) - MAP.x) / 60);
    }),
  );

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageDim}>
          {/* rails */}
          <g opacity={pipeU}>
            <line x1={railX0} y1={RAIL_Y} x2={lerp(railX0, railX1, pipeU)} y2={RAIL_Y} stroke={colors.GRID} strokeWidth={2} />
            <line x1={railX1} y1={WIRE_Y} x2={lerp(railX1, railX0, pipeU)} y2={WIRE_Y} stroke={colors.GRID} strokeWidth={1} strokeDasharray="3 7" />
            <text x={railX0 + 8} y={RAIL_Y - 28} fill={colors.MUTED} fontSize={10.5}>
              chunks ⟶
            </text>
            <text x={railX1 - 8} y={WIRE_Y + 24} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
              ⟵ demand
            </text>
          </g>

          {/* stations */}
          <Station x={SRC.x} w={SRC.w} title="source" code="Stream.fromIterable([1, 2, 3, 4, 5])" u={pipeU} />
          <Station x={MAP.x} w={MAP.w} title="map" code="Stream.map((n) => n * 10)" u={pipeU} glow={mapGlow} />
          <Station x={RUN.x} w={RUN.w} title="consumer" code="Stream.runCollect" u={runU} />

          {/* busy chip on the consumer */}
          {busyU > 0 && (
            <g opacity={busyU}>
              <rect x={RUN.x - 52} y={RAIL_Y - 68} width={104} height={22} rx={11} fill={colors.BG} stroke={colors.WARM} />
              <text x={RUN.x} y={RAIL_Y - 53} textAnchor="middle" fill={colors.WARM} fontSize={11}>
                busy — not asking
              </text>
            </g>
          )}

          {/* traveling pulses and crates */}
          {cycs.map((cyc, k) => (
            <g key={k}>
              <Pulse u={pulseU(cyc)} />
              <Crate u={crateU(cyc)} raw={ROUNDS[k].raw} mapped={ROUNDS[k].mapped} />
            </g>
          ))}
          <Pulse u={pull4} />

          {/* the Done token rides the crate rail */}
          {doneU > 0 && doneU < 1 && (
            <g>
              <rect
                x={lerp(railX0 + 24, railX1 - 24, doneU) - 34}
                y={RAIL_Y - 16}
                width={68}
                height={32}
                rx={6}
                fill={colors.BG}
                stroke={colors.WARM}
                strokeWidth={2}
              />
              <text
                x={lerp(railX0 + 24, railX1 - 24, doneU)}
                y={RAIL_Y + 4}
                textAnchor="middle"
                fill={colors.WARM}
                fontSize={11}
                fontFamily="monospace"
                fontWeight={700}
              >
                Done
              </text>
            </g>
          )}

          {/* collector tray under the consumer */}
          {runU > 0 && (
            <g opacity={runU}>
              <rect
                x={RUN.x - 88}
                y={RAIL_Y + 64}
                width={176}
                height={40}
                rx={8}
                fill={colors.PANEL}
                stroke={sealU > 0.5 ? colors.POSITIVE : colors.GRID}
                strokeWidth={sealU > 0.5 ? 2 : 1}
              />
              <text x={RUN.x} y={RAIL_Y + 89} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                {collected.length ? `[${collected.join(', ')}]` : '[ ]'}
              </text>
              {sealU > 0 && (
                <text x={RUN.x} y={RAIL_Y + 122} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} opacity={sealU}>
                  ✓ complete
                </text>
              )}
            </g>
          )}

          {/* the cross-section tower */}
          {towerU > 0 && (
            <g opacity={towerU}>
              <text x={TOWER.x} y={TOWER.y - 14} fill={colors.MUTED} fontSize={12} fontStyle="italic">
                inside the machine
              </text>
              {FLOORS.map((f, i) => {
                const y = TOWER.y + i * (TOWER.floorH + TOWER.gap);
                const hi = Math.round(floorHi) === i + 1;
                const u = clamp01(towerU * 3 - i);
                return (
                  <g key={i} opacity={u * (hi ? 1 : 0.5)}>
                    <rect
                      x={TOWER.x}
                      y={y}
                      width={TOWER.w}
                      height={TOWER.floorH}
                      rx={10}
                      fill={colors.PANEL}
                      stroke={hi ? colors.ACCENT : colors.GRID}
                      strokeWidth={hi ? 2.5 : 1}
                    />
                    <text x={TOWER.x + 18} y={y + 24} fill={hi ? colors.ACCENT : colors.TEXT} fontSize={12.5} fontFamily="monospace">
                      {f.code}
                    </text>
                    <text x={TOWER.x + 18} y={y + 43} fill={colors.MUTED} fontSize={11}>
                      {f.note}
                    </text>
                  </g>
                );
              })}
              {/* done-in-the-error-channel callout on the Pull floor */}
              {Math.round(floorHi) === 3 && (
                <g>
                  <rect x={TOWER.x + TOWER.w + 14} y={TOWER.y + 2 * (TOWER.floorH + TOWER.gap) + 6} width={150} height={44} rx={8} fill={colors.BG} stroke={colors.WARM} />
                  <text x={TOWER.x + TOWER.w + 89} y={TOWER.y + 2 * (TOWER.floorH + TOWER.gap) + 24} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily="monospace">
                    Cause.Done
                  </text>
                  <text x={TOWER.x + TOWER.w + 89} y={TOWER.y + 2 * (TOWER.floorH + TOWER.gap) + 40} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
                    end rides the error rail
                  </text>
                </g>
              )}
            </g>
          )}
        </g>

        {/* closing panel */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={340} y={240} width={600} height={160} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              demand flows up · chunks flow down
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the consumer sets the pace
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
