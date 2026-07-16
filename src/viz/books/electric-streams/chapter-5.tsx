// Replay Is the Platform
//
// Grounding: PROTOCOL.md §4.2 Stream forking (PUT + Stream-Forked-From /
// Stream-Fork-Offset; "The fork inherits data from the source up to the fork
// offset without copying it. Reads on a fork transparently stitch source and
// fork data"; forks use the same offset space), §8 (offset `-1` = replay from
// the beginning), §9.1 (JSON mode: message boundaries preserved);
// electric.ax/streams.md ("Every stream is multiplayer", "The shared stream
// is the coordination layer", and the four layers: Electric Streams → JSON
// mode → Durable State → StreamDB — this book is №1 of the series that
// climbs that stack).
//
// Centerpiece: the tape becomes shared substrate. Three playheads read at
// their own offsets, a latecomer joins by replaying from minus one, a fork
// branches the session at an offset — ghost-inherited past, diverging
// futures — and the layer cake rises from bytes to a live database.
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
import type { CameraState, SceneState } from '../../core';
import { Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — the main tape, the fork rail below it, the layer cake above.
// ---------------------------------------------------------------------------

const TAPE = { x0: 250, y: 356, cellW: 62, cellH: 44 } as const;
const cellX = (i: number): number => TAPE.x0 + i * TAPE.cellW;
const MSGS = ['ask', 'plan', 'tool', 'logs', 'fix', 'test', 'pass', 'ship'] as const;
const N = MSGS.length;
const FORK_AT = 5; // fork offset: inherits cells 0..4
const FORK_Y = 492;
const FORK_OWN = ['alt fix', 'test', 'pass'] as const;

// readers: [name, color, resting offset (cell units)]
const HEADS = [
  { name: 'agent', color: colors.ACCENT, at: 7.6 },
  { name: 'human', color: colors.POSITIVE, at: 5.2 },
  { name: 'dashboard', color: colors.SECONDARY, at: 3.4 },
] as const;

const SLABS = [
  { label: '2 · JSON mode — messages, boundaries preserved', y: 268 },
  { label: '3 · Durable State — insert · update · delete → live state', y: 212 },
  { label: '4 · StreamDB — a reactive database, live queries', y: 156 },
] as const;
const SLAB_X = 320;
const SLAB_W = 640;
const SLAB_H = 44;

const CAM_TAPE: CameraState = { x: 640, y: 360, k: 1.16 };
const CAM_FORK: CameraState = { x: 640, y: 430, k: 1.24 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~93s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TAPE, cameraInterp);

  const tapeU = tl.channel('tapeU', 0); // tape + agent playhead
  const headsU = tl.channel('headsU', 0); // human + dashboard attach
  const lateU = tl.channel('lateU', 0); // latecomer replays 0 → tail
  const orderU = tl.channel('orderU', 0); // offsets glow in sequence
  const forkU = tl.channel('forkU', 0); // fork rail + headers chip
  const stitchU = tl.channel('stitchU', 0); // read sweep across the seam
  const divU = tl.channel('divU', 0); // futures diverge (new cells both rails)
  const layer1U = tl.channel('layer1U', 0); // JSON mode slab
  const layer2U = tl.channel('layer2U', 0); // Durable State slab
  const layer3U = tl.channel('layer3U', 0); // StreamDB slab
  const seriesU = tl.channel('seriesU', 0); // the ghost slab + series spine
  const forkDimU = tl.channel('forkDimU', 0); // fork lane quiets for the cake
  const dimU = tl.channel('dimU', 0);
  const recapU = tl.channel('recapU', 0); // five-chip recap card

  // — beat 1 · a shared, replayable record —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'One last property, and it is the one the whole platform leans on. A durable stream is not a private pipe between two parties — it is a shared, replayable record.',
  });
  tl.tween(tapeU, 1, { at: 0.6, dur: 1.5, ease: ease.draw });
  tl.hold(6.5, 0.4);

  // — beat 2 · every stream is multiplayer —
  tl.caption({
    at: 6.9,
    dur: 6.0,
    text: 'Any number of readers can attach to the same stream. Each carries its own offset, each reads at its own pace, and none of them slows the others down.',
  });
  tl.tween(headsU, 1, { at: 7.4, dur: 2.2, ease: ease.move });
  tl.hold(12.9, 0.4);

  // — beat 3 · replay is the join protocol —
  tl.caption({
    at: 13.3,
    dur: 6.4,
    text: 'A latecomer joins by replaying from minus one. It walks the same tape and arrives at the same state as everyone else. Catch-up is not a special case — it is the join protocol.',
  });
  tl.tween(lateU, 1, { at: 13.9, dur: 4.4, ease: ease.move });
  tl.hold(19.7, 0.4);

  // — beat 4 · one order, no drift —
  tl.caption({
    at: 20.1,
    dur: 5.8,
    text: 'And because everyone reads one append-only record, everyone agrees on order. The stream is the coordination layer — there is no second source of truth to drift from.',
  });
  tl.tween(orderU, 1, { at: 20.6, dur: 3.2, ease: ease.linear });
  tl.hold(25.9, 0.4);

  // — beat 5 · forking: branch the session —
  tl.caption({
    at: 26.3,
    dur: 6.4,
    text: 'Now the move that makes agents brave: forking. One put request with two extra headers branches the session at any offset — a new stream that shares the past without copying a byte.',
  });
  tl.tween(cam, CAM_FORK, { at: 26.5, dur: 1.4, ease: ease.move });
  tl.tween(forkU, 1, { at: 27.2, dur: 2.0, ease: ease.draw });
  tl.hold(32.7, 0.4);

  // — beat 6 · stitched reads: the invisible seam —
  tl.caption({
    at: 33.1,
    dur: 6.0,
    text: "Reads on the fork stitch the two together: inherited data up to the fork point, the fork's own appends after it. The reader cannot tell where the seam is.",
  });
  tl.tween(stitchU, 1, { at: 33.7, dur: 3.6, ease: ease.move });
  tl.hold(39.1, 0.4);

  // — beat 7 · two futures, one history —
  tl.caption({
    at: 39.5,
    dur: 5.8,
    text: 'So the agent explores its plan B on the branch, while the original conversation stands untouched. Two futures, one shared history — and still one honest record each.',
  });
  tl.tween(divU, 1, { at: 40.0, dur: 2.6, ease: ease.move });
  tl.hold(45.3, 0.4);

  // — beat 8 · building upward: messages on bytes —
  tl.caption({
    at: 45.7,
    dur: 6.2,
    text: 'Durability plus replay is also what lets you build upward. If bytes at offsets replay perfectly, you can define messages on top of them — and every layer inherits the guarantees below it.',
  });
  tl.tween(cam, CAM_WIDE, { at: 45.9, dur: 1.5, ease: ease.move });
  tl.tween(forkDimU, 1, { at: 45.9, dur: 1.2, ease: ease.move });
  tl.tween(layer1U, 1, { at: 47.2, dur: 1.2, ease: ease.enter });
  tl.hold(51.9, 0.4);

  // — beat 9 · state, then a database —
  tl.caption({
    at: 52.3,
    dur: 6.2,
    text: 'On messages, typed changes — inserts, updates, and deletes you can materialize into live state. And on those, a full reactive database with queries, living entirely inside a stream.',
  });
  tl.tween(layer2U, 1, { at: 52.9, dur: 1.2, ease: ease.enter });
  tl.tween(layer3U, 1, { at: 55.1, dur: 1.2, ease: ease.enter });
  tl.hold(58.5, 0.4);

  // — beat 10 · the platform bet —
  tl.caption({
    at: 58.9,
    dur: 6.4,
    text: "That stack is this platform's bet: one durable primitive at the bottom, everything else defined on top. The next four books climb it — sync, state, the database, and the agents.",
  });
  tl.tween(seriesU, 1, { at: 59.6, dur: 1.4, ease: ease.enter });
  tl.hold(65.3, 0.4);

  // — beat 11 · recap: the whole journey —
  tl.caption({
    at: 65.7,
    dur: 7.2,
    text: 'So retrace the journey. A stream that survives a refresh. An address for every byte. A tail that is live. Writes that land exactly once. And replay — the property that turns a log into a platform.',
  });
  tl.tween(dimU, 1, { at: 66.2, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 1, { at: 67.6, dur: 1.0, ease: ease.pop });
  tl.hold(72.9, 2.0);

  return {
    tl, cam, tapeU, headsU, lateU, orderU, forkU, stitchU, divU,
    layer1U, layer2U, layer3U, seriesU, forkDimU, dimU, recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const RECAP = [
  ['1', 'survives'],
  ['2', 'addressed'],
  ['3', 'live'],
  ['4', 'exactly once'],
  ['5', 'replayable'],
] as const;

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const headsU = s.get(scene.headsU);
  const lateU = s.get(scene.lateU);
  const orderU = s.get(scene.orderU);
  const forkU = s.get(scene.forkU);
  const stitchU = s.get(scene.stitchU);
  const divU = s.get(scene.divU);
  const layer1U = s.get(scene.layer1U);
  const layer2U = s.get(scene.layer2U);
  const layer3U = s.get(scene.layer3U);
  const seriesU = s.get(scene.seriesU);
  const forkDimU = s.get(scene.forkDimU);
  const dimU = s.get(scene.dimU);
  const recapU = s.get(scene.recapU);

  const machineOp = 1 - 0.88 * dimU;
  const forkOp = (1 - 0.85 * forkDimU) * machineOp;
  const headsOp = (1 - 0.85 * forkDimU) * machineOp;
  const railX1 = cellX(N) + (divU > 0 ? TAPE.cellW : 0);
  const seamX = cellX(FORK_AT) - TAPE.cellW / 2; // between cells 4 and 5
  const stitchCell = stitchU * (FORK_AT + FORK_OWN.length); // sweep over the fork rail
  const layerU = [layer1U, layer2U, layer3U];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the main tape */}
        <g opacity={machineOp}>
          <Zone x={TAPE.x0 - 54} y={TAPE.y - 72} w={cellX(N) - TAPE.x0 + 160} h={158} label="/v1/stream/chat" kind="group" u={tapeU} color={colors.TEAL} dim={0.3 * forkDimU} />
          <line x1={TAPE.x0 - TAPE.cellW / 2} y1={TAPE.y + TAPE.cellH / 2 + 10} x2={railX1 + 10} y2={TAPE.y + TAPE.cellH / 2 + 10} stroke={colors.GRID} strokeWidth={1.5} opacity={tapeU} />
          {MSGS.map((m, i) => {
            const u = win(tapeU, N, i, 2.2);
            if (u <= 0) return null;
            const ordered = orderU > 0 && win(orderU, N, i, 1.2) > 0.5 && forkU <= 0;
            return (
              <g key={i} opacity={u}>
                <rect x={cellX(i) - TAPE.cellW / 2 + 3} y={TAPE.y - TAPE.cellH / 2} width={TAPE.cellW - 6} height={TAPE.cellH} rx={7} fill={colors.PANEL} stroke={ordered ? colors.WARM : colors.ACCENT} strokeWidth={ordered ? 2 : 1.2} />
                <text x={cellX(i)} y={TAPE.y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
                  {m}
                </text>
                <text x={cellX(i)} y={TAPE.y + TAPE.cellH / 2 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO} opacity={0.85}>
                  {`…V0${i}`}
                </text>
              </g>
            );
          })}
          {/* future A cell (divergence) */}
          <g opacity={divU * machineOp}>
            <rect x={cellX(N) - TAPE.cellW / 2 + 3} y={TAPE.y - TAPE.cellH / 2} width={TAPE.cellW - 6} height={TAPE.cellH} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
            <text x={cellX(N)} y={TAPE.y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
              tag
            </text>
            <text x={cellX(N) + 52} y={TAPE.y - TAPE.cellH / 2 - 8} textAnchor="middle" fill={colors.WARM} fontSize={11.5}>
              future A
            </text>
          </g>
        </g>

        {/* the playheads */}
        <g opacity={headsOp}>
          {HEADS.map((h, i) => {
            const u = i === 0 ? tapeU : win(headsU, 2, i - 1, 1.4);
            if (u <= 0) return null;
            const hx = cellX(h.at) - TAPE.cellW / 2;
            return (
              <g key={h.name} opacity={u}>
                <path d={`M ${hx} ${TAPE.y - TAPE.cellH / 2 - 14} l 8 -13 l -16 0 Z`} fill={h.color} />
                <text x={hx} y={TAPE.y - TAPE.cellH / 2 - 34} textAnchor="middle" fill={h.color} fontSize={11} fontFamily={MONO}>
                  {h.name}
                </text>
              </g>
            );
          })}
          {/* the latecomer sweeping from -1 */}
          {lateU > 0 && (
            <g>
              <path d={`M ${cellX(lateU * 6.4) - TAPE.cellW / 2} ${TAPE.y + TAPE.cellH / 2 + 40} l 8 13 l -16 0 Z`} fill={colors.WARM} />
              <text x={cellX(lateU * 6.4) - TAPE.cellW / 2} y={TAPE.y + TAPE.cellH / 2 + 72} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO} opacity={1 - clamp01(forkU * 3)}>
                {lateU < 0.15 ? 'offset=-1' : 'replaying…'}
              </text>
            </g>
          )}
        </g>

        {/* the fork */}
        <g opacity={forkOp}>
          {/* branch connector from the seam */}
          <path
            d={`M ${seamX} ${TAPE.y + TAPE.cellH / 2 + 10} C ${seamX} ${FORK_Y - 40}, ${seamX - 40} ${FORK_Y - 20}, ${cellX(FORK_AT) - TAPE.cellW / 2} ${FORK_Y - 4}`}
            fill="none"
            stroke={colors.SECONDARY}
            strokeWidth={2}
            strokeDasharray="6 4"
            opacity={forkU}
          />
          {/* headers chip — above the inherited cells, inside the camera frame */}
          <g opacity={forkU}>
            <rect x={140} y={FORK_Y - 78} width={300} height={52} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
            <text x={154} y={FORK_Y - 57} fill={colors.SECONDARY} fontSize={11} fontFamily={MONO}>
              Stream-Forked-From: /v1/stream/chat
            </text>
            <text x={154} y={FORK_Y - 37} fill={colors.SECONDARY} fontSize={11} fontFamily={MONO}>
              Stream-Fork-Offset: 01JQXK5V05
            </text>
          </g>
          {/* fork rail: ghost-inherited cells 0..4, then its own */}
          <line x1={cellX(0) - TAPE.cellW / 2} y1={FORK_Y + TAPE.cellH / 2 + 10} x2={cellX(FORK_AT + FORK_OWN.length) + TAPE.cellW / 2 + (divU > 0 ? TAPE.cellW : 0)} y2={FORK_Y + TAPE.cellH / 2 + 10} stroke={colors.GRID} strokeWidth={1.5} opacity={forkU} />
          {MSGS.slice(0, FORK_AT).map((m, i) => {
            const hot = stitchCell > i + 0.5;
            return (
              <g key={`g${i}`} opacity={forkU * 0.8}>
                <rect x={cellX(i) - TAPE.cellW / 2 + 3} y={FORK_Y - TAPE.cellH / 2} width={TAPE.cellW - 6} height={TAPE.cellH} rx={7} fill="none" stroke={hot ? colors.WARM : colors.GRID} strokeWidth={hot ? 2 : 1.2} strokeDasharray="5 4" />
                <text x={cellX(i)} y={FORK_Y + 4} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                  {m}
                </text>
              </g>
            );
          })}
          <text x={cellX(2)} y={FORK_Y + TAPE.cellH / 2 + 28} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontStyle="italic" opacity={forkU}>
            inherited — not copied
          </text>
          {FORK_OWN.map((m, i) => {
            const u = i === 0 ? forkU : win(divU, FORK_OWN.length - 1, i - 1, 1.4);
            if (u <= 0) return null;
            const hot = stitchCell > FORK_AT + i + 0.5;
            return (
              <g key={`f${i}`} opacity={u}>
                <rect x={cellX(FORK_AT + i) - TAPE.cellW / 2 + 3} y={FORK_Y - TAPE.cellH / 2} width={TAPE.cellW - 6} height={TAPE.cellH} rx={7} fill={colors.PANEL} stroke={hot ? colors.WARM : colors.SECONDARY} strokeWidth={hot ? 2 : 1.4} />
                <text x={cellX(FORK_AT + i)} y={FORK_Y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>
                  {m}
                </text>
              </g>
            );
          })}
          {/* the seam */}
          <g opacity={clamp01(stitchU * 2) * forkU}>
            <line x1={seamX} y1={FORK_Y - TAPE.cellH / 2 - 8} x2={seamX} y2={FORK_Y + TAPE.cellH / 2 + 8} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="3 3" />
            <text x={seamX + 66} y={FORK_Y - TAPE.cellH / 2 - 14} textAnchor="middle" fill={colors.WARM} fontSize={10.5}>
              the seam — invisible to readers
            </text>
          </g>
          {/* future B label */}
          <g opacity={divU}>
            <text x={cellX(FORK_AT + FORK_OWN.length) + 46} y={FORK_Y + 4} fill={colors.SECONDARY} fontSize={11.5}>
              future B
            </text>
          </g>
        </g>

        {/* the layer cake */}
        <g opacity={machineOp}>
          {SLABS.map((slab, i) => {
            const u = layerU[i];
            if (u <= 0) return null;
            const rise = (1 - u) * 26;
            return (
              <g key={i} opacity={u}>
                <rect x={SLAB_X} y={slab.y + rise} width={SLAB_W} height={SLAB_H} rx={10} fill={colors.PANEL} stroke={[colors.ACCENT, colors.POSITIVE, colors.WARM][i]} strokeWidth={1.4} />
                <text x={SLAB_X + 20} y={slab.y + rise + 28} fill={[colors.ACCENT, colors.POSITIVE, colors.WARM][i]} fontSize={14} fontFamily={MONO}>
                  {slab.label}
                </text>
              </g>
            );
          })}
          {layer1U > 0 && (
            <text x={SLAB_X + 20} y={TAPE.y - 88} fill={colors.TEAL} fontSize={14} fontFamily={MONO} opacity={layer1U}>
              1 · Electric Streams — bytes at offsets, replayable
            </text>
          )}
          <g opacity={seriesU}>
            <rect x={SLAB_X} y={100} width={SLAB_W} height={SLAB_H - 4} rx={10} fill="none" stroke={colors.SECONDARY} strokeWidth={1.4} strokeDasharray="7 5" />
            <text x={SLAB_X + 20} y={126} fill={colors.SECONDARY} fontSize={14} fontFamily={MONO}>
              5 · the agents — books two through five of this series
            </text>
          </g>
        </g>

        {/* recap card */}
        <g opacity={recapU}>
          <rect x={280} y={244} width={720} height={180} rx={16} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.5} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={700}>
            A log that turns into a platform
          </text>
          {RECAP.map(([n, w], i) => (
            <g key={n}>
              <rect x={316 + i * 132} y={330} width={120} height={54} rx={10} fill={colors.BG} stroke={[colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.WARM, colors.TEAL][i]} />
              <text x={376 + i * 132} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                {`ch ${n}`}
              </text>
              <text x={376 + i * 132} y={372} textAnchor="middle" fill={[colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.WARM, colors.TEAL][i]} fontSize={12.5} fontWeight={600}>
                {w}
              </text>
            </g>
          ))}
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
