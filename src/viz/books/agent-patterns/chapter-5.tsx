// The map, and the crash test
//
// Grounding: packages/agents-runtime/skills/designing-entities/references/
// pattern-triggers.md — the disambiguation flow ("Parallel vs sequential
// spawning? All at once → map-reduce or manager-worker. One after another →
// pipeline." · "Fixed specialist roles or dynamic types? Fixed set →
// manager-worker. Variable count per chunk → map-reduce; per request →
// dispatcher.") and its trigger-phrase table ("multiple perspectives",
// "process in parallel"/"chunks", "step by step", "classify and route").
// README.md — every entity owns an append-only stream; on every wake the
// runtime materializes it into typed collections and runs handler(ctx, wake).
// Pattern invariants — deterministic child ids + spawn-once guards are what
// make resume safe (manager-worker MW2/MW3, pipeline P2/P3, map-reduce MR3,
// dispatcher D1).
//
// Centerpiece: four miniature dioramas of chapters 1–4 assemble onto a 2×2
// map cut by the two questions; then a BLACKOUT kills every running parent
// mid-flight, only the four stream tapes stay lit, and a wake replays each
// tape until every machine resumes exactly where it stopped.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — the 2×2 map
// ---------------------------------------------------------------------------

const CX = 640;
const CY = 340;
const Q = [
  { x: 385, y: 208, name: 'manager-worker', color: colors.POSITIVE, phrase: '“multiple perspectives”', resume: 'children ✓ 3 — observe, don’t respawn' },
  { x: 895, y: 208, name: 'map-reduce', color: colors.ACCENT, phrase: '“process the chunks in parallel”', resume: 'spawnCounter still 8 — no collisions' },
  { x: 385, y: 482, name: 'pipeline', color: colors.WARM, phrase: '“step by step”', resume: 'status still stage_2 — no restart' },
  { x: 895, y: 482, name: 'dispatcher', color: colors.SECONDARY, phrase: '“classify and route”', resume: 'status still waiting — resume the child' },
] as const;

const TAPE_W = 172;

const CAM_CRASH: CameraState = { x: 640, y: 340, k: 1.12 };

// ---------------------------------------------------------------------------
// Timeline (~70s, nine beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const mapU = tl.channel('mapU', 0); // four dioramas assemble (staggered)
  const div1U = tl.channel('div1U', 0); // horizontal split: parallel / one at a time
  const div2U = tl.channel('div2U', 0); // vertical split: fixed / decided by input
  const phrasesU = tl.channel('phrasesU', 0); // trigger phrases file in
  const crashU = tl.channel('crashU', 0); // the blackout
  const replayU = tl.channel('replayU', 0); // playheads sweep the tapes
  const resumeU = tl.channel('resumeU', 0); // machines relight + resume chips
  const endU = tl.channel('endU', 0); // recap quiet-down
  const closeU = tl.channel('closeU', 0); // closing lockup

  // — beat 1 · assembly —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Four machines, one platform. Time to put them on a single map — because choosing between them comes down to answering two questions.',
  });
  tl.tween(mapU, 1, { at: 0.9, dur: 3.2, ease: ease.linear });
  tl.hold(6.9, 0.5);

  // — beat 2 · question one —
  tl.caption({
    at: 7.4,
    dur: 6.6,
    text: 'Question one: do the children run all at once, or one after another? The fan and the shatter sit up top. The rail and the switch sit below.',
  });
  tl.tween(div1U, 1, { at: 7.8, dur: 1.8, ease: ease.draw });
  tl.hold(14.0, 0.6);

  // — beat 3 · question two —
  tl.caption({
    at: 14.6,
    dur: 6.8,
    text: 'Question two: is the set of children fixed in the code, or decided by whatever arrives? Named roles and numbered stages on the left. Chunks and requests on the right.',
  });
  tl.tween(div2U, 1, { at: 15.0, dur: 1.8, ease: ease.draw });
  tl.hold(21.4, 0.6);

  // — beat 4 · the phrases find their homes —
  tl.caption({
    at: 22.0,
    dur: 7.6,
    text: 'Now the phrases people actually say can find their homes. Multiple perspectives. Process the chunks in parallel. Step by step. Classify and route.',
  });
  tl.tween(phrasesU, 1, { at: 22.6, dur: 4.6, ease: ease.linear });
  tl.hold(29.6, 0.6);

  // — beat 5 · kill everything —
  tl.caption({
    at: 30.2,
    dur: 7.0,
    text: 'And now the part this whole series has been building toward. Kill everything. Mid fan-out, mid stage two, mid dispatch — every process dies, right now.',
  });
  tl.tween(cam, CAM_CRASH, { at: 30.4, dur: 1.2, ease: ease.move });
  tl.tween(crashU, 1, { at: 33.2, dur: 1.1, ease: ease.move });

  // — beat 6 · what survived —
  tl.caption({
    at: 37.8,
    dur: 5.8,
    text: 'Look at what survived: the streams. Every spawn, every status, every result was appended to a tape before anything went dark.',
  });
  tl.hold(43.6, 0.4);

  // — beat 7 · the wake replays the tape —
  tl.caption({
    at: 44.0,
    dur: 8.0,
    text: 'A wake replays each tape into live state, and every machine resumes where it stopped. The manager refuses to spawn twins. The pipeline token is still on stage two. The counter still reads eight.',
  });
  tl.tween(replayU, 1, { at: 44.6, dur: 2.6, ease: ease.linear });
  tl.tween(resumeU, 1, { at: 47.4, dur: 2.2, ease: ease.move });

  // — beat 8 · the payoff —
  tl.caption({
    at: 52.8,
    dur: 6.0,
    text: 'Durability was never a feature bolted onto these patterns. The tape is the pattern — a wake just reads it back.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 53.0, dur: 1.5, ease: ease.move });
  tl.hold(58.8, 0.4);

  // — beat 9 · the series, retraced —
  tl.caption({
    at: 59.2,
    dur: 8.4,
    text: "And that's the series: entities that live as streams, state that syncs everywhere it's needed, and four shapes of coordination you can pick with two questions. The platform remembers the rest.",
  });
  tl.tween(endU, 1, { at: 59.8, dur: 1.6, ease: ease.move });
  tl.tween(closeU, 1, { at: 61.6, dur: 1.0, ease: ease.enter });
  tl.hold(67.6, 2.0);

  return { tl, cam, mapU, div1U, div2U, phrasesU, crashU, replayU, resumeU, endU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Mini dioramas — each is a pure function of (lit, glow) at its quadrant
// ---------------------------------------------------------------------------

function MiniTape({ x, y, color, glow, replay }: { x: number; y: number; color: string; glow: number; replay: number }) {
  const cells = 6;
  return (
    <g>
      {Array.from({ length: cells }, (_, i) => (
        <rect
          key={i}
          x={x - TAPE_W / 2 + i * (TAPE_W / cells)}
          y={y}
          width={TAPE_W / cells - 4}
          height={12}
          rx={3}
          fill={color}
          opacity={0.28 + 0.6 * glow}
        />
      ))}
      {replay > 0.01 && replay < 1 && (
        <rect x={x - TAPE_W / 2 + TAPE_W * replay - 3} y={y - 4} width={6} height={20} rx={2} fill={colors.TEXT} opacity={0.95} />
      )}
    </g>
  );
}

function MiniMW({ x, y, lit }: { x: number; y: number; lit: number }) {
  const kids = [colors.POSITIVE, colors.NEGATIVE, colors.ACCENT];
  return (
    <g opacity={0.15 + 0.85 * lit}>
      <circle cx={x - 58} cy={y} r={13} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
      {kids.map((c, i) => (
        <g key={i}>
          <line x1={x - 45} y1={y} x2={x + 40} y2={y - 34 + i * 34} stroke={c} strokeWidth={1.4} strokeOpacity={0.7} />
          <circle cx={x + 48} cy={y - 34 + i * 34} r={8} fill={c} opacity={0.9} />
        </g>
      ))}
    </g>
  );
}

function MiniMR({ x, y, lit }: { x: number; y: number; lit: number }) {
  return (
    <g opacity={0.15 + 0.85 * lit}>
      <circle cx={x - 58} cy={y} r={13} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
      {Array.from({ length: 8 }, (_, i) => {
        const gx = x + 18 + (i % 4) * 22;
        const gy = y - 14 + Math.floor(i / 4) * 26;
        return (
          <g key={i}>
            <line x1={x - 45} y1={y} x2={gx} y2={gy} stroke={colors.ACCENT} strokeWidth={0.8} strokeOpacity={0.5} />
            <rect x={gx - 6} y={gy - 6} width={12} height={12} rx={3} fill={colors.ACCENT} opacity={0.85} />
          </g>
        );
      })}
    </g>
  );
}

function MiniPipe({ x, y, lit }: { x: number; y: number; lit: number }) {
  return (
    <g opacity={0.15 + 0.85 * lit}>
      <line x1={x - 78} y1={y} x2={x + 78} y2={y} stroke={colors.GRID} strokeWidth={2} />
      {[-78, -26, 26, 78].map((dx, i) => (
        <circle key={i} cx={x + dx} cy={y} r={5} fill={i < 2 ? colors.POSITIVE : colors.PANEL} stroke={colors.GRID} />
      ))}
      {/* the token — mid-flight on stage two */}
      <rect x={x - 6} y={y - 6} width={12} height={12} rx={3} fill={colors.WARM} transform={`rotate(45 ${x} ${y})`} />
    </g>
  );
}

function MiniDisp({ x, y, lit }: { x: number; y: number; lit: number }) {
  return (
    <g opacity={0.15 + 0.85 * lit}>
      <line x1={x - 80} y1={y} x2={x - 18} y2={y} stroke={colors.GRID} strokeWidth={2} />
      <circle cx={x - 10} cy={y} r={11} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
      <line x1={x} y1={y} x2={x + 52} y2={y - 26} stroke={colors.ACCENT} strokeWidth={1.6} />
      <line x1={x} y1={y} x2={x + 52} y2={y + 26} stroke={colors.SECONDARY} strokeWidth={1.6} strokeOpacity={0.5} />
      <rect x={x + 54} y={y - 34} width={16} height={16} rx={4} fill={colors.ACCENT} opacity={0.9} />
      <rect x={x + 54} y={y + 18} width={16} height={16} rx={4} fill="none" stroke={colors.SECONDARY} strokeDasharray="3 3" />
    </g>
  );
}

const MINIS = [MiniMW, MiniMR, MiniPipe, MiniDisp];

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const mapU = s.get(scene.mapU);
  const div1U = s.get(scene.div1U);
  const div2U = s.get(scene.div2U);
  const phrasesU = s.get(scene.phrasesU);
  const crashU = s.get(scene.crashU);
  const replayU = s.get(scene.replayU);
  const resumeU = s.get(scene.resumeU);
  const endU = s.get(scene.endU);
  const closeU = s.get(scene.closeU);

  // machines: assembled → killed by the crash → relit by the resume
  const machineLit = (assembled: number): number =>
    assembled * (1 - 0.95 * crashU * (1 - resumeU));
  const frameDim = 1 - 0.85 * endU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- dividers: the two questions ---------------- */}
        <g opacity={frameDim * (1 - 0.7 * crashU * (1 - resumeU))}>
          {div1U > 0.01 && (
            <g>
              <line x1={CX - 560 * div1U} y1={CY} x2={CX + 560 * div1U} y2={CY} stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="7 7" />
              <text x={72} y={126} fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={clamp01(div1U * 2 - 1)}>
                all at once
              </text>
              <text x={72} y={600} fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={clamp01(div1U * 2 - 1)}>
                one after another
              </text>
            </g>
          )}
          {div2U > 0.01 && (
            <g>
              <line x1={CX} y1={CY - 290 * div2U} x2={CX} y2={CY + 290 * div2U} stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="7 7" />
              <text x={CX - 24} y={68} textAnchor="end" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={clamp01(div2U * 2 - 1)}>
                a fixed set
              </text>
              <text x={CX + 24} y={68} fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={clamp01(div2U * 2 - 1)}>
                decided by the input
              </text>
            </g>
          )}
        </g>

        {/* ---------------- the four dioramas ---------------- */}
        {Q.map((q, i) => {
          const asm = win(mapU, 4, i, 1.6);
          if (asm <= 0) return null;
          const lit = machineLit(asm);
          const Mini = MINIS[i];
          const tapeGlow = clamp01(crashU * (1 - resumeU) + 0.25);
          return (
            <g key={q.name} opacity={frameDim}>
              <rect
                x={q.x - 130}
                y={q.y - 78}
                width={260}
                height={156}
                rx={14}
                fill={colors.PANEL}
                fillOpacity={0.35}
                stroke={q.color}
                strokeOpacity={0.2 + 0.5 * lit}
              />
              <text x={q.x} y={q.y - 56} textAnchor="middle" fill={q.color} fontSize={13.5} fontWeight={600} opacity={0.4 + 0.6 * lit}>
                {q.name}
              </text>
              <Mini x={q.x} y={q.y - 8} lit={lit} />
              <MiniTape x={q.x} y={q.y + 42} color={q.color} glow={tapeGlow} replay={replayU} />
              {/* the trigger phrase */}
              {phrasesU > 0.01 && (
                <text
                  x={q.x}
                  y={q.y + 72}
                  textAnchor="middle"
                  fill={colors.TEXT}
                  fontSize={12.5}
                  fontStyle="italic"
                  opacity={win(phrasesU, 4, i, 1.8) * (1 - 0.8 * crashU * (1 - resumeU))}
                >
                  {q.phrase}
                </text>
              )}
              {/* the resume receipt */}
              {resumeU > 0.01 && (
                <text x={q.x} y={q.y + 72} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO} opacity={resumeU}>
                  {q.resume}
                </text>
              )}
            </g>
          );
        })}

        {/* ---------------- the crash flash ---------------- */}
        {crashU > 0.01 && resumeU < 0.5 && (
          <g opacity={1 - resumeU * 2}>
            <text x={CX} y={CY + 8} textAnchor="middle" fill={colors.NEGATIVE} fontSize={26} fontWeight={700} opacity={crashU}>
              ⚡ every process just died
            </text>
            <text x={CX} y={CY + 36} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={crashU}>
              the tapes did not
            </text>
          </g>
        )}

        {/* ---------------- closing lockup ---------------- */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={CX - 330} y={CY - 74} width={660} height={148} rx={18} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={CX} y={CY - 30} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={600}>
              two questions → four shapes
            </text>
            <text x={CX} y={CY + 4} textAnchor="middle" fill={colors.MUTED} fontSize={14.5}>
              all at once or one after another · fixed or decided by the input
            </text>
            <text x={CX} y={CY + 42} textAnchor="middle" fontSize={14.5}>
              <tspan fill={Q[0].color}>manager-worker</tspan>
              <tspan fill={colors.MUTED}> · </tspan>
              <tspan fill={Q[1].color}>map-reduce</tspan>
              <tspan fill={colors.MUTED}> · </tspan>
              <tspan fill={Q[2].color}>pipeline</tspan>
              <tspan fill={colors.MUTED}> · </tspan>
              <tspan fill={Q[3].color}>dispatcher</tspan>
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
