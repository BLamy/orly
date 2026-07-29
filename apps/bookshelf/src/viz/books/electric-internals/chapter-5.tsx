// Chapter 5 — StreamFS and the stack
//
// Grounding: electric.ax /docs/streams/stream-fs.md and repo docs/stream-fs.md
// (StreamFilesystem stores state in a metadata stream at /_metadata and
// content streams at /_content/{id}; createFile / readTextFile / mkdir /
// list / stat / move; watch() emits chokidar-style add / change / unlink /
// addDir events; stale-write detection via PreconditionFailedError; shared
// filesystem state across multiple agents over durable streams).
// The closing tower composes chapters 1–5: streams → proxy → state protocol
// → StreamDB → StreamFS (electric.ax /docs/streams.md overview).
//
// Centerpiece: A FILESYSTEM GROWN FROM TWO TAPES — metadata events fold into
// a directory tree (the same fold as chapter 3), a second agent watches the
// same tape, a stale write bounces — then the camera pulls back and the whole
// book stacks into one tower.
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
import { ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout + the metadata log (folded into the tree at module scope)
// ---------------------------------------------------------------------------
const META_Y = 150;
const META_X0 = 300;
const CELL_W = 46;
const CELL_H = 46;
const cellX = (i: number): number => META_X0 + i * CELL_W;

// metadata events, in tape order
const META_EVENTS = [
  { label: 'add', path: '/notes.md', color: colors.POSITIVE },
  { label: 'addDir', path: '/docs', color: colors.TEAL },
  { label: 'add', path: '/docs/spec.md', color: colors.POSITIVE },
  { label: 'change', path: '/notes.md', color: colors.WARM },
  { label: 'change', path: '/notes.md', color: colors.WARM }, // the retry after the bounce
] as const;

// tree entries appear when their metadata step lands (the fold)
const TREE = [
  { depth: 0, name: '/', step: -1 },
  { depth: 1, name: 'notes.md', step: 0 },
  { depth: 1, name: 'docs/', step: 1 },
  { depth: 2, name: 'spec.md', step: 2 },
] as const;

const CONTENT_RAILS = [
  { y: 262, id: '/_content/a1f4', file: 'notes.md' },
  { y: 316, id: '/_content/c9d2', file: 'docs/spec.md' },
] as const;

const AGENT_A = { x: 130, y: 240 } as const;
const AGENT_B = { x: 1150, y: 240 } as const;
const TREE_P = { x: 905, y: 420, w: 250, h: 150 } as const;

const CAM_FILE: CameraState = { x: 560, y: 260, k: 1.28 };
const CAM_WATCH: CameraState = { x: 860, y: 300, k: 1.25 };
const CAM_TOWER: CameraState = { x: 640, y: 380, k: 1.0 };

// the tower (finale) — bottom-up
const TOWER = [
  { label: 'Durable Streams', sub: 'the append-only tape at a URL', color: colors.ACCENT },
  { label: 'Durable Proxy', sub: 'any streaming endpoint → the tape', color: colors.TEAL },
  { label: 'State Protocol', sub: 'typed insert · update · delete', color: colors.SECONDARY },
  { label: 'StreamDB', sub: 'schema · dispatcher · live queries', color: colors.POSITIVE },
  { label: 'StreamFS', sub: 'metadata + content streams · watch', color: colors.WARM },
] as const;
const SLAB_W = 560;
const SLAB_H = 56;
const slabY = (i: number): number => 556 - i * 68;

// ---------------------------------------------------------------------------
// Timeline — ~66s, 10 captions.
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const railU = tl.channel('railU', 0); // metadata tape + agents enter
  const metaN = tl.channel('metaN', 0); // metadata events landed (the fold)
  const cont1U = tl.channel('cont1U', 0); // notes.md content rail fills
  const cont2U = tl.channel('cont2U', 0); // spec.md content rail fills
  const statU = tl.channel('statU', 0); // stat() chip reads the fold
  const watchU = tl.channel('watchU', 0); // agent B subscribes
  const chgU = tl.channel('chgU', 0); // change event flight + B pulse
  const confU = tl.channel('confU', 0); // conflict: stale write bounces
  const retryU = tl.channel('retryU', 0); // loser re-reads and retries
  const quietU = tl.channel('quietU', 0); // machinery fades for the tower
  const towerU = tl.channel('towerU', 0); // slabs stack 0..5
  const sweepU = tl.channel('sweepU', 0); // highlight sweep up the tower
  const endU = tl.channel('endU', 0); // closing line

  // — beat 1 · two kinds of tape —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Agents working together need one more thing: files. A workspace they can all see. The stream filesystem builds one out of nothing but streams.',
  });
  tl.tween(railU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });

  // — beat 2 · createFile —
  tl.caption({
    at: 7.0,
    dur: 6.4,
    text: 'It keeps two kinds of tape: one metadata stream that records every file event, and a content stream per file for the bytes.',
  });
  tl.tween(cam, CAM_FILE, { at: 7.2, dur: 1.2, ease: ease.move });
  tl.tween(cont1U, 1, { at: 8.2, dur: 2.2, ease: ease.linear });
  tl.tween(metaN, 1, { at: 10.2, dur: 1.2, ease: ease.linear });

  // — beat 3 · the tree is a fold —
  tl.caption({
    at: 13.8,
    dur: 6.4,
    text: 'Create a file and both tapes move: bytes land on a fresh content stream, and a metadata event announces the path. Fold the metadata tape, and you get the directory tree.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 14.0, dur: 1.3, ease: ease.move });
  tl.tween(metaN, 3, { at: 15.0, dur: 3.0, ease: ease.linear });
  tl.tween(cont2U, 1, { at: 16.4, dur: 1.8, ease: ease.linear });
  tl.tween(statU, 1, { at: 18.8, dur: 0.6, ease: ease.pop });

  // — beat 4 · watch —
  tl.caption({
    at: 20.8,
    dur: 6.2,
    text: "Because it's a stream, watching is free. Another agent subscribes to the metadata tape and gets add, change, and unlink events in order, as they land.",
  });
  tl.tween(cam, CAM_WATCH, { at: 21.0, dur: 1.2, ease: ease.move });
  tl.tween(statU, 0, { at: 21.0, dur: 0.5, ease: ease.enter });
  tl.tween(watchU, 1, { at: 21.8, dur: 1.2, ease: ease.draw });
  tl.tween(chgU, 1, { at: 23.6, dur: 2.6, ease: ease.linear });
  tl.tween(metaN, 4, { at: 24.4, dur: 0.8, ease: ease.linear });

  // — beat 5 · the stale write bounces —
  tl.caption({
    at: 27.6,
    dur: 6.6,
    text: 'Two writers, one file? The filesystem detects the stale write and rejects it with a precondition failure. The loser re-reads and retries — the tape stays consistent.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 27.8, dur: 1.3, ease: ease.move });
  tl.tween(confU, 1, { at: 28.6, dur: 2.6, ease: ease.linear });
  tl.tween(retryU, 1, { at: 31.6, dur: 2.2, ease: ease.linear });
  tl.tween(metaN, 5, { at: 33.2, dur: 0.6, ease: ease.linear });

  // — beat 6 · not polling a disk —
  tl.caption({
    at: 34.8,
    dur: 5.6,
    text: "So the second agent isn't polling a disk. It's replaying the same tape, holding the same tree, seeing every change the moment it lands.",
  });

  // — beat 7 · step back —
  tl.caption({
    at: 41.0,
    dur: 3.4,
    text: "Now step back, because you've seen the whole machine.",
  });
  tl.tween(quietU, 1, { at: 41.4, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_TOWER, { at: 41.6, dur: 1.6, ease: ease.move });

  // — beat 8 · the tower —
  tl.caption({
    at: 45.0,
    dur: 8.4,
    text: 'One durable tape at the bottom. The proxy pipes any streaming endpoint onto it. The state protocol types its cells. The database folds and queries them. The filesystem grows trees out of them.',
  });
  tl.tween(towerU, 5, { at: 45.4, dur: 7.4, ease: ease.linear });

  // — beat 9 · four blocks, one primitive —
  tl.caption({
    at: 54.0,
    dur: 6.4,
    text: 'Durable proxy, durable state, a stream database, a stream filesystem. Four blocks, one primitive — and every layer is just readers and writers of the tape.',
  });
  tl.tween(sweepU, 1, { at: 54.6, dur: 3.6, ease: ease.linear });

  // — beat 10 · the bet —
  tl.caption({
    at: 61.0,
    dur: 5.0,
    text: "That's Electric's bet: get the tape right, and the rest of the platform is composition.",
  });
  tl.tween(endU, 1, { at: 61.4, dur: 0.8, ease: ease.enter });
  tl.hold(66.0, 1.6);

  return {
    tl,
    cam,
    railU,
    metaN,
    cont1U,
    cont2U,
    statU,
    watchU,
    chgU,
    confU,
    retryU,
    quietU,
    towerU,
    sweepU,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const railU = s.get(scene.railU);
  const metaN = s.get(scene.metaN);
  const cont1U = s.get(scene.cont1U);
  const cont2U = s.get(scene.cont2U);
  const statU = s.get(scene.statU);
  const watchU = s.get(scene.watchU);
  const chgU = s.get(scene.chgU);
  const confU = s.get(scene.confU);
  const retryU = s.get(scene.retryU);
  const quietU = s.get(scene.quietU);
  const towerU = s.get(scene.towerU);
  const sweepU = s.get(scene.sweepU);
  const endU = s.get(scene.endU);

  const fsOp = railU * (1 - quietU * 0.92); // whole filesystem world fades for the tower
  const foldCount = Math.floor(metaN);
  // conflict packets: A's write (wins) and B's stale write (bounces)
  const confOut = clamp01(confU * 1.8);
  const confBack = clamp01(confU * 1.8 - 1);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the filesystem world ================= */}
        {fsOp > 0.01 && (
          <g opacity={fsOp}>
            {/* agents */}
            <ServiceNode x={AGENT_A.x} y={AGENT_A.y} kind="fn" label="agent A" sublabel="writes" u={railU} />
            <ServiceNode x={AGENT_B.x} y={AGENT_B.y} kind="fn" label="agent B" sublabel="fs.watch()" u={railU} glow={chgU > 0.8 ? Math.max(0, Math.sin(Math.PI * clamp01((chgU - 0.8) * 5))) : 0} />

            {/* metadata tape */}
            <text x={META_X0 - 14} y={META_Y + 5} textAnchor="end" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
              /_metadata
            </text>
            <line x1={META_X0 - 8} y1={META_Y + CELL_H / 2 + 8} x2={META_X0 + (cellX(META_EVENTS.length) - META_X0 + 24) * railU} y2={META_Y + CELL_H / 2 + 8} stroke={colors.GRID} strokeWidth={2} />
            {META_EVENTS.map((e, i) => {
              const u = clamp01(metaN - i);
              if (u <= 0.01) return null;
              return (
                <g key={i} opacity={0.4 + 0.6 * u}>
                  <rect x={cellX(i)} y={META_Y - CELL_H / 2 - (1 - u) * 14} width={CELL_W - 6} height={CELL_H} rx={7} fill={colors.PANEL} stroke={e.color} strokeWidth={1.6} />
                  <text x={cellX(i) + (CELL_W - 6) / 2} y={META_Y - 2} textAnchor="middle" fill={e.color} fontSize={9.5} fontFamily={MONO}>
                    {e.label}
                  </text>
                  <text x={cellX(i) + (CELL_W - 6) / 2} y={META_Y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={8.5} fontFamily={MONO}>
                    {e.path.split('/').pop()}
                  </text>
                </g>
              );
            })}

            {/* content rails */}
            {CONTENT_RAILS.map((rail, r) => {
              const u = r === 0 ? cont1U : cont2U;
              if (u <= 0.01) return null;
              const n = 6 * u;
              return (
                <g key={rail.id} opacity={clamp01(u * 3)}>
                  <text x={META_X0 - 14} y={rail.y + 4} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                    {rail.id}
                  </text>
                  <line x1={META_X0 - 8} y1={rail.y + 14} x2={META_X0 + 6 * 34 + 16} y2={rail.y + 14} stroke={colors.GRID} strokeWidth={1.5} />
                  {Array.from({ length: 6 }, (_, i) => {
                    const cu = clamp01(n - i);
                    if (cu <= 0.01) return null;
                    return <rect key={i} x={META_X0 + i * 34} y={rail.y - 12} width={28} height={24} rx={5} fill={colors.PANEL} stroke={colors.ACCENT} strokeOpacity={0.7} opacity={0.4 + 0.6 * cu} />;
                  })}
                  {/* retry appends fresh bytes on notes.md's rail */}
                  {r === 0 && retryU > 0.6 && (
                    <rect x={META_X0 + 6 * 34} y={rail.y - 12} width={28} height={24} rx={5} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} opacity={clamp01((retryU - 0.6) * 3)} />
                  )}
                </g>
              );
            })}
            {/* createFile call chip */}
            {cont1U > 0.05 && cont1U < 1 && (
              <g opacity={Math.sin(Math.PI * cont1U)}>
                <rect x={150} y={330} width={300} height={30} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
                <text x={300} y={350} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
                  fs.createFile("/notes.md", "# My Notes")
                </text>
              </g>
            )}

            {/* the tree — a fold of the metadata tape */}
            <g opacity={clamp01(metaN)}>
              <rect x={TREE_P.x - TREE_P.w / 2} y={TREE_P.y - TREE_P.h / 2} width={TREE_P.w} height={TREE_P.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={TREE_P.x - TREE_P.w / 2 + 14} y={TREE_P.y - TREE_P.h / 2 + 22} fill={colors.TEXT} fontSize={12.5} fontWeight={700}>
                fs.list("/")
              </text>
              {TREE.map((t, i) => {
                const seen = t.step < foldCount;
                if (!seen) return null;
                const changed = (t.name === 'notes.md' && (foldCount === 4 || foldCount === 5) && metaN - foldCount < 0.6) ? 1 : 0;
                return (
                  <text key={i} x={TREE_P.x - TREE_P.w / 2 + 20 + t.depth * 22} y={TREE_P.y - TREE_P.h / 2 + 50 + i * 24} fill={changed ? colors.WARM : colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                    {t.depth > 0 ? '└ ' : ''}
                    {t.name}
                  </text>
                );
              })}
            </g>
            {/* metadata → tree fold arrow */}
            <path d={`M${cellX(2)} ${META_Y + CELL_H / 2 + 12} C ${cellX(3)} ${TREE_P.y - 40}, ${TREE_P.x - 160} ${TREE_P.y - 60}, ${TREE_P.x - TREE_P.w / 2 - 8} ${TREE_P.y - 20}`} fill="none" stroke={colors.GRID} strokeWidth={1.4} strokeDasharray="2 6" opacity={clamp01(metaN) * 0.8} />

            {/* stat chip */}
            {statU > 0.01 && (
              <g opacity={statU}>
                <rect x={TREE_P.x - 118} y={TREE_P.y + TREE_P.h / 2 + 10} width={236} height={30} rx={8} fill={colors.BG} stroke={colors.TEAL} />
                <text x={TREE_P.x} y={TREE_P.y + TREE_P.h / 2 + 30} textAnchor="middle" fill={colors.TEAL} fontSize={11.5} fontFamily={MONO}>
                  fs.stat("/notes.md") → from the fold
                </text>
              </g>
            )}

            {/* watch subscription + event queue at B */}
            {watchU > 0.01 && (
              <g opacity={watchU}>
                <path d={`M${AGENT_B.x - 6} ${AGENT_B.y - 44} C ${AGENT_B.x - 60} ${META_Y + 30}, ${cellX(META_EVENTS.length) + 60} ${META_Y + 20}, ${cellX(META_EVENTS.length) + 6} ${META_Y}`} fill="none" stroke={colors.WARM} strokeWidth={1.6} strokeDasharray="3 5" />
                <text x={AGENT_B.x - 36} y={META_Y + 44} fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
                  watch({'{ recursive: true }'})
                </text>
                {/* received events queue */}
                {META_EVENTS.slice(0, Math.min(foldCount, 4)).map((e, i) => (
                  <g key={i} opacity={win(watchU, 4, i, 1.5)}>
                    <rect x={AGENT_B.x - 52} y={AGENT_B.y + 52 + i * 26} width={104} height={21} rx={6} fill={colors.BG} stroke={e.color} strokeOpacity={0.8} />
                    <text x={AGENT_B.x} y={AGENT_B.y + 67 + i * 26} textAnchor="middle" fill={e.color} fontSize={10} fontFamily={MONO}>
                      {e.label} {e.path.split('/').pop()}
                    </text>
                  </g>
                ))}
              </g>
            )}
            {/* the change event flying to B (beat 4) */}
            {chgU > 0.05 && chgU < 0.95 && (
              <circle cx={cellX(3) + 20 + (AGENT_B.x - 60 - cellX(3) - 20) * chgU} cy={META_Y - 40 - Math.sin(Math.PI * chgU) * 40 + 40 * chgU} r={7} fill={colors.WARM} opacity={0.95} />
            )}

            {/* conflict: two writes converge on /notes.md */}
            {confU > 0.02 && (
              <g>
                {/* A's winning write */}
                <circle cx={AGENT_A.x + 50 + (cellX(4) - AGENT_A.x - 50) * confOut} cy={AGENT_A.y - 30 - Math.sin(Math.PI * confOut) * 50} r={7.5} fill={colors.POSITIVE} opacity={confOut < 1 ? 0.95 : 0} />
                {/* B's stale write: reaches the tape, bounces back */}
                <circle
                  cx={AGENT_B.x - 50 - (AGENT_B.x - 50 - cellX(4) - 60) * (confOut - confBack * 0.5)}
                  cy={AGENT_B.y - 30 - Math.sin(Math.PI * clamp01(confOut - confBack * 0.5)) * 40}
                  r={7.5}
                  fill={colors.BG}
                  stroke={colors.NEGATIVE}
                  strokeWidth={2}
                  opacity={confU < 0.98 ? 0.95 : 0}
                />
                {confBack > 0.1 && confU < 0.98 && (
                  <g opacity={Math.sin(Math.PI * confBack)}>
                    <rect x={cellX(4) + 40} y={META_Y - 96} width={216} height={28} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.5} />
                    <text x={cellX(4) + 148} y={META_Y - 77} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>
                      PreconditionFailedError
                    </text>
                  </g>
                )}
              </g>
            )}
          </g>
        )}

        {/* ================= the tower ================= */}
        {towerU > 0.01 && (
          <g>
            {TOWER.map((slab, i) => {
              const u = clamp01(towerU - i);
              if (u <= 0.01) return null;
              const y = slabY(i) - (1 - u) * 28;
              const lit = sweepU > 0 ? Math.max(0, Math.sin(Math.PI * clamp01(sweepU * (TOWER.length + 1) - i) / 1)) : 0;
              const glow = Math.min(1, lit) * 0.5;
              return (
                <g key={slab.label} opacity={u}>
                  <rect x={640 - SLAB_W / 2} y={y - SLAB_H / 2} width={SLAB_W} height={SLAB_H} rx={12} fill={colors.PANEL} stroke={slab.color} strokeWidth={1.6 + glow * 2} />
                  {glow > 0.02 && <rect x={640 - SLAB_W / 2} y={y - SLAB_H / 2} width={SLAB_W} height={SLAB_H} rx={12} fill={slab.color} opacity={glow * 0.14} />}
                  <text x={640 - SLAB_W / 2 + 22} y={y + 6} fill={slab.color} fontSize={16} fontWeight={700}>
                    {slab.label}
                  </text>
                  <text x={640 + SLAB_W / 2 - 22} y={y + 6} textAnchor="end" fill={colors.MUTED} fontSize={12.5}>
                    {slab.sub}
                  </text>
                </g>
              );
            })}
            {/* the tape glyph under the tower */}
            <g opacity={clamp01(towerU)}>
              {Array.from({ length: 10 }, (_, i) => (
                <rect key={i} x={640 - 5 * 34 + i * 34 + 3} y={slabY(0) + SLAB_H / 2 + 14} width={28} height={16} rx={4} fill={colors.PANEL} stroke={colors.GRID} />
              ))}
            </g>
          </g>
        )}

        {/* ================= closing line ================= */}
        {endU > 0.01 && (
          <g opacity={endU}>
            <rect x={340} y={132} width={600} height={64} rx={14} fill={colors.BG} stroke={colors.GRID} />
            <text x={640} y={172} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              get the tape right — the rest is composition
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
