// Pipeline: one stage per wake
//
// Grounding: packages/agents-runtime/skills/designing-entities/references/
// patterns/pipeline.md — sequential stages, each a spawned worker; a status
// state machine (idle → stage_1 → stage_2 → stage_3 → done) enforced with
// transition(); deterministic child ids `${parentId}-stage-${n}`; each
// stage's output is captured from the child-completion wake and becomes the
// next stage's initialMessage; spawn-once guard per stage so re-wakes never
// re-run completed stages. Anti-patterns: spawning all stages at once
// ("that's map-reduce"), and restarting from stage one on re-wake.
//
// Centerpiece: ONE payload — fourteen text strokes — that stays center stage
// and METAMORPHOSES three times (raw jumble → clean rows → grouped analysis
// → final report) while the state-machine rail above it advances exactly one
// stop per wake.
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
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The payload — 14 strokes, four precomputed formations
// ---------------------------------------------------------------------------

const PC = { x: 660, y: 392 } as const; // payload center
const N_SEG = 14;
const rand = mulberry32(555);

interface Seg {
  x: number;
  y: number;
  w: number;
}
// F0 — raw jumble
const F0: Seg[] = Array.from({ length: N_SEG }, () => ({
  x: (rand() - 0.5) * 168,
  y: (rand() - 0.5) * 128,
  w: 26 + rand() * 58,
}));
// F1 — clean rows (7 rows × 2 columns)
const F1: Seg[] = Array.from({ length: N_SEG }, (_, i) => ({
  x: i % 2 === 0 ? -76 : 6,
  y: -54 + Math.floor(i / 2) * 18,
  w: 66,
}));
// F2 — three analysis groups with gaps
const F2: Seg[] = Array.from({ length: N_SEG }, (_, i) => {
  const g = i < 5 ? 0 : i < 10 ? 1 : 2;
  const j = i < 5 ? i : i < 10 ? i - 5 : i - 10;
  return { x: -76 + (j % 2) * 82, y: -62 + g * 52 + Math.floor(j / 2) * 12, w: 62 };
});
// F3 — the report: title bar + tidy block
const F3: Seg[] = Array.from({ length: N_SEG }, (_, i) =>
  i === 0
    ? { x: -70, y: -58, w: 140 }
    : { x: -70, y: -36 + (i - 1) * 10, w: i % 3 === 0 ? 96 : 128 }
);
const FORMS = [F0, F1, F2, F3];
const FORM_COLOR = [colors.MUTED, colors.ACCENT, colors.SECONDARY, colors.WARM];

// the state-machine rail
const STOPS = ['idle', 'stage_1', 'stage_2', 'stage_3', 'done'];
const STOP_X = [250, 445, 640, 835, 1030];
const RAIL_Y = 120;

const PARENT = { x: 170, y: 392 } as const;
const STAGE_META = [
  { role: 'preprocessor', color: colors.ACCENT, id: '${parentId}-stage-1' },
  { role: 'analyzer', color: colors.SECONDARY, id: '${parentId}-stage-2' },
  { role: 'synthesizer', color: colors.WARM, id: '${parentId}-stage-3' },
];

const TAPE_Y = 556;
const TAPE_X0 = 168;
// append order: transition + insert per stage, then done
const TAPE_CELLS = [
  { a: 'status_update', b: 'stage_1', c: colors.WARM },
  { a: 'children_insert', b: 'stage-1', c: colors.ACCENT },
  { a: 'status_update', b: 'stage_2', c: colors.WARM },
  { a: 'children_insert', b: 'stage-2', c: colors.SECONDARY },
  { a: 'status_update', b: 'stage_3', c: colors.WARM },
  { a: 'children_insert', b: 'stage-3', c: colors.WARM },
  { a: 'status_update', b: 'done', c: colors.POSITIVE },
];

const CAM_PAYLOAD: CameraState = { x: 580, y: 380, k: 1.15 };
const CAM_RAIL: CameraState = { x: 640, y: 240, k: 1.25 };

// ---------------------------------------------------------------------------
// Timeline (~56s, eight beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const parentLit = tl.channel('parentLit', 0);
  const payloadU = tl.channel('payloadU', 0); // strokes appear
  const railU = tl.channel('railU', 0); // rail + stops draw on
  const tokenPos = tl.channel('tokenPos', 0); // 0..4 along STOPS
  const morphIdx = tl.channel('morphIdx', 0); // 0..3 across FORMS
  const w1U = tl.channel('w1U', 0); // preprocessor wraps the payload
  const w2U = tl.channel('w2U', 0);
  const w3U = tl.channel('w3U', 0);
  const idChipU = tl.channel('idChipU', 0);
  const handChipU = tl.channel('handChipU', 0); // output → initialMessage chip
  const rows = tl.channel('rows', 0); // tape cells stamped so far
  const ghostU = tl.channel('ghostU', 0); // all-at-once ghosts: 0..1 in, 1..2 out
  const rewakeU = tl.channel('rewakeU', 0); // stray re-wake bolt
  const holdChipU = tl.channel('holdChipU', 0); // "already ran" chip
  const endU = tl.channel('endU', 0);

  // — beat 1 · the relay, not the race —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Not everything fans out. Sometimes stage two literally cannot start until stage one has finished — because the output is the input.',
  });
  tl.tween(parentLit, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(payloadU, 1, { at: 1.6, dur: 1.6, ease: ease.linear });
  tl.hold(6.5, 0.5);

  // — beat 2 · the state machine comes first —
  tl.caption({
    at: 7.0,
    dur: 6.2,
    text: 'So this entity writes a state machine first: a status that only moves forward. Idle, stage one, stage two, stage three, done.',
  });
  tl.tween(cam, CAM_RAIL, { at: 7.2, dur: 1.3, ease: ease.move });
  tl.tween(railU, 1, { at: 7.8, dur: 1.8, ease: ease.draw });
  tl.hold(12.6, 0.6);

  // — beat 3 · stage one spawns, parent goes dark —
  tl.caption({
    at: 13.2,
    dur: 7.2,
    text: 'Stage one spawns a single worker, the preprocessor, and hands it the raw input. Then the parent goes dark. One stage per wake — nothing else is allowed to happen.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 13.4, dur: 1.3, ease: ease.move });
  tl.tween(tokenPos, 1, { at: 14.0, dur: 0.9, ease: ease.move });
  tl.tween(rows, 2, { at: 14.2, dur: 0.5, ease: ease.linear });
  tl.tween(w1U, 1, { at: 15.2, dur: 0.8, ease: ease.enter });
  tl.tween(idChipU, 1, { at: 16.2, dur: 0.6, ease: ease.enter });
  tl.tween(parentLit, 0.12, { at: 17.6, dur: 1.0, ease: ease.move });
  tl.hold(20.0, 0.4);

  // — beat 4 · first wake: the payload cleans up —
  tl.caption({
    at: 20.4,
    dur: 6.4,
    text: "The completion wake carries stage one's output, and the payload transforms: the noise is gone. The token on the rail moves exactly one stop.",
  });
  tl.tween(idChipU, 0, { at: 20.6, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_PAYLOAD, { at: 20.8, dur: 1.3, ease: ease.move });
  tl.tween(parentLit, 1, { at: 21.4, dur: 0.4, ease: ease.pop });
  tl.tween(morphIdx, 1, { at: 21.8, dur: 1.6, ease: ease.move });
  tl.tween(w1U, 0, { at: 23.6, dur: 0.8, ease: ease.enter });
  tl.tween(tokenPos, 2, { at: 24.2, dur: 0.9, ease: ease.move });
  tl.tween(rows, 3, { at: 24.4, dur: 0.3, ease: ease.linear });

  // — beat 5 · output becomes the next message —
  tl.caption({
    at: 27.2,
    dur: 6.0,
    text: 'That output becomes the next message. The analyzer receives clean text and nothing else — it never sees the raw mess.',
  });
  tl.tween(handChipU, 1, { at: 27.6, dur: 0.6, ease: ease.enter });
  tl.tween(w2U, 1, { at: 28.4, dur: 0.8, ease: ease.enter });
  tl.tween(rows, 4, { at: 28.6, dur: 0.3, ease: ease.linear });
  tl.tween(parentLit, 0.12, { at: 29.2, dur: 0.8, ease: ease.move });
  tl.tween(parentLit, 1, { at: 31.0, dur: 0.3, ease: ease.pop });
  tl.tween(morphIdx, 2, { at: 31.4, dur: 1.6, ease: ease.move });
  tl.tween(w2U, 0, { at: 33.0, dur: 0.6, ease: ease.enter });

  // — beat 6 · the last morph —
  tl.caption({
    at: 34.0,
    dur: 5.6,
    text: 'One more wake, one more transformation: the analysis becomes the report, and the token reaches done.',
  });
  tl.tween(handChipU, 0, { at: 34.2, dur: 0.5, ease: ease.enter });
  tl.tween(tokenPos, 3, { at: 34.4, dur: 0.8, ease: ease.move });
  tl.tween(rows, 6, { at: 34.6, dur: 0.4, ease: ease.linear });
  tl.tween(w3U, 1, { at: 35.0, dur: 0.7, ease: ease.enter });
  tl.tween(parentLit, 0.12, { at: 35.8, dur: 0.6, ease: ease.move });
  tl.tween(parentLit, 1, { at: 36.6, dur: 0.3, ease: ease.pop });
  tl.tween(morphIdx, 3, { at: 37.0, dur: 1.6, ease: ease.move });
  tl.tween(w3U, 0, { at: 38.6, dur: 0.6, ease: ease.enter });
  tl.tween(tokenPos, 4, { at: 38.8, dur: 0.9, ease: ease.move });
  tl.tween(rows, 7, { at: 39.0, dur: 0.3, ease: ease.linear });

  // — beat 7 · what the machine refuses to do —
  tl.caption({
    at: 41.0,
    dur: 8.2,
    text: "Two things this machine refuses to do. It won't spawn every stage at once — that's a different pattern wearing a costume. And a re-wake can't restart it: the status already says which stages ran.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.2, dur: 1.2, ease: ease.move });
  tl.tween(ghostU, 1, { at: 41.8, dur: 0.9, ease: ease.enter });
  tl.tween(ghostU, 2, { at: 44.6, dur: 0.9, ease: ease.move });
  tl.tween(rewakeU, 1, { at: 46.0, dur: 1.2, ease: ease.linear });
  tl.tween(holdChipU, 1, { at: 47.2, dur: 0.6, ease: ease.enter });

  // — beat 8 · name the shape —
  tl.caption({
    at: 50.0,
    dur: 6.2,
    text: 'Fixed stages, strict order, each output feeding the next. When the work is a relay and not a race, reach for the pipeline.',
  });
  tl.tween(holdChipU, 0, { at: 50.4, dur: 0.5, ease: ease.enter });
  tl.tween(endU, 1, { at: 51.0, dur: 1.4, ease: ease.move });
  tl.hold(56.2, 1.8);

  return {
    tl,
    cam,
    parentLit,
    payloadU,
    railU,
    tokenPos,
    morphIdx,
    w1U,
    w2U,
    w3U,
    idChipU,
    handChipU,
    rows,
    ghostU,
    rewakeU,
    holdChipU,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, u }: { x: number; y: number; text: string; color: string; u: number }) {
  if (u <= 0.01) return null;
  const w = text.length * 7.4 + 24;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={y - 15} width={w} height={28} rx={8} fill={colors.BG} stroke={color} strokeOpacity={0.7} />
      <text x={x} y={y + 5} textAnchor="middle" fill={color} fontSize={12.5} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const parentLit = s.get(scene.parentLit);
  const payloadU = s.get(scene.payloadU);
  const railU = s.get(scene.railU);
  const tokenPos = s.get(scene.tokenPos);
  const morphIdx = s.get(scene.morphIdx);
  const wU = [s.get(scene.w1U), s.get(scene.w2U), s.get(scene.w3U)];
  const idChipU = s.get(scene.idChipU);
  const handChipU = s.get(scene.handChipU);
  const rows = s.get(scene.rows);
  const ghostU = s.get(scene.ghostU);
  const rewakeU = s.get(scene.rewakeU);
  const holdChipU = s.get(scene.holdChipU);
  const endU = s.get(scene.endU);

  // payload segment interpolation between formations
  const lo = Math.min(3, Math.max(0, Math.floor(morphIdx)));
  const hi = Math.min(3, lo + 1);
  const f = clamp01(morphIdx - lo);
  const dim = 1 - 0.85 * endU;

  // token position along the rail
  const ti = Math.min(4, Math.max(0, Math.floor(tokenPos)));
  const tf = clamp01(tokenPos - ti);
  const tokenX = STOP_X[ti] + (STOP_X[Math.min(4, ti + 1)] - STOP_X[ti]) * tf;

  const activeWorker = wU.findIndex((u) => u > 0.01);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- the state-machine rail ---------------- */}
        {railU > 0.01 && (
          <g opacity={0.5 + 0.5 * dim}>
            <line
              x1={STOP_X[0]}
              y1={RAIL_Y}
              x2={STOP_X[0] + (STOP_X[4] - STOP_X[0]) * railU}
              y2={RAIL_Y}
              stroke={colors.GRID}
              strokeWidth={2.5}
            />
            {STOPS.map((st, i) => {
              const u = clamp01(railU * 5 - i);
              if (u <= 0) return null;
              const passed = tokenPos > i + 0.02;
              return (
                <g key={st} opacity={u}>
                  <circle cx={STOP_X[i]} cy={RAIL_Y} r={7} fill={passed ? colors.POSITIVE : colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                  <text x={STOP_X[i]} y={RAIL_Y + 28} textAnchor="middle" fill={passed ? colors.POSITIVE : colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                    {st}
                  </text>
                  {passed && i > 0 && i < 4 && (
                    <text x={STOP_X[i]} y={RAIL_Y - 16} textAnchor="middle" fill={colors.POSITIVE} fontSize={11}>
                      ✓
                    </text>
                  )}
                </g>
              );
            })}
            {/* the token — a diamond that only moves right */}
            <rect
              x={tokenX - 9}
              y={RAIL_Y - 9}
              width={18}
              height={18}
              rx={4}
              fill={colors.WARM}
              stroke={colors.BG}
              strokeWidth={2}
              transform={`rotate(45 ${tokenX} ${RAIL_Y})`}
            />
            {/* the stray re-wake pulse: the token holds its stop */}
            {rewakeU > 0.01 && rewakeU < 1 && (
              <circle
                cx={tokenX}
                cy={RAIL_Y}
                r={12 + 16 * rewakeU}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={2}
                opacity={1 - rewakeU}
              />
            )}
            <text x={STOP_X[0] - 62} y={RAIL_Y + 4} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={railU}>
              status
            </text>
          </g>
        )}

        {/* ---------------- parent ---------------- */}
        <g>
          {parentLit > 0.2 && (
            <rect x={PARENT.x - 92} y={PARENT.y - 46} width={184} height={92} rx={20} fill={colors.SECONDARY} opacity={0.16 * parentLit} />
          )}
          <rect
            x={PARENT.x - 85}
            y={PARENT.y - 39}
            width={170}
            height={78}
            rx={14}
            fill={colors.PANEL}
            stroke={colors.SECONDARY}
            strokeWidth={1.8}
            strokeOpacity={0.25 + 0.75 * parentLit}
          />
          <circle cx={PARENT.x - 67} cy={PARENT.y - 23} r={4.5} fill={colors.SECONDARY} opacity={0.25 + 0.75 * parentLit} />
          <text x={PARENT.x} y={PARENT.y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={600} opacity={0.45 + 0.55 * parentLit}>
            pipeline
          </text>
          <text x={PARENT.x} y={PARENT.y + 19} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            run_stage
          </text>
        </g>

        {/* ---------------- the worker wrap ---------------- */}
        {activeWorker >= 0 && (
          <g opacity={wU[activeWorker] * dim}>
            <rect
              x={PC.x - 145}
              y={PC.y - 118}
              width={290}
              height={224}
              rx={18}
              fill="none"
              stroke={STAGE_META[activeWorker].color}
              strokeWidth={2}
              strokeDasharray="8 6"
              strokeOpacity={0.8}
            />
            <rect x={PC.x - 76} y={PC.y - 134} width={152} height={30} rx={9} fill={colors.BG} stroke={STAGE_META[activeWorker].color} strokeOpacity={0.8} />
            <text x={PC.x} y={PC.y - 114} textAnchor="middle" fill={STAGE_META[activeWorker].color} fontSize={13.5}>
              {STAGE_META[activeWorker].role}
            </text>
          </g>
        )}

        {/* ---------------- THE payload ---------------- */}
        <g opacity={dim}>
          {FORMS[0].map((_, i) => {
            const u = clamp01(payloadU * N_SEG - i * 0.7);
            if (u <= 0) return null;
            const a = FORMS[lo][i];
            const b = FORMS[hi][i];
            const x = PC.x + a.x + (b.x - a.x) * f;
            const y = PC.y + a.y + (b.y - a.y) * f;
            const w = a.w + (b.w - a.w) * f;
            const titleTall = i === 0 && (lo === 3 || (hi === 3 && f > 0.5));
            const h = titleTall ? 7 : 4.5;
            return (
              <g key={i}>
                <rect x={x} y={y} width={w} height={h} rx={2} fill={FORM_COLOR[lo]} opacity={u * (1 - f)} />
                <rect x={x} y={y} width={w} height={h} rx={2} fill={FORM_COLOR[hi]} opacity={u * f} />
              </g>
            );
          })}
          {/* analysis group boxes at F2 */}
          {((lo === 2 && f < 0.5) || (hi === 2 && f > 0.3)) &&
            [0, 1, 2].map((g) => {
              const op = hi === 2 ? clamp01((f - 0.3) / 0.5) : clamp01(1 - f * 2);
              return (
                <rect
                  key={g}
                  x={PC.x - 84}
                  y={PC.y - 70 + g * 52}
                  width={172}
                  height={40}
                  rx={7}
                  fill="none"
                  stroke={colors.SECONDARY}
                  strokeOpacity={0.45 * op}
                />
              );
            })}
          {/* report check at F3 */}
          {lo === 3 && (
            <g opacity={clamp01(f + (morphIdx >= 3 ? 1 : 0))}>
              <circle cx={PC.x + 92} cy={PC.y - 52} r={13} fill={colors.POSITIVE} opacity={0.9} />
              <text x={PC.x + 92} y={PC.y - 47} textAnchor="middle" fill={colors.BG} fontSize={14} fontWeight={700}>
                ✓
              </text>
            </g>
          )}
          <text x={PC.x} y={PC.y + 96} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic" opacity={payloadU}>
            {morphIdx < 0.5 ? 'the raw input' : morphIdx < 1.5 ? 'cleaned' : morphIdx < 2.5 ? 'analyzed' : 'the report'}
          </text>
        </g>

        {/* ---------------- all-at-once ghosts (the refused move) ------------ */}
        {ghostU > 0.01 && ghostU < 1.99 && (
          <g opacity={ghostU <= 1 ? ghostU * 0.8 : (2 - ghostU) * 0.8}>
            {[0, 1, 2].map((i) => (
              <rect
                key={i}
                x={1005}
                y={210 + i * 96}
                width={168}
                height={72}
                rx={12}
                fill="none"
                stroke={colors.NEGATIVE}
                strokeWidth={1.6}
                strokeDasharray="6 5"
              />
            ))}
            <text x={1089} y={188} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13}>
              all three at once?
            </text>
            <g transform="translate(1089 340)">
              <line x1={-26} y1={-26} x2={26} y2={26} stroke={colors.NEGATIVE} strokeWidth={5} strokeLinecap="round" />
              <line x1={26} y1={-26} x2={-26} y2={26} stroke={colors.NEGATIVE} strokeWidth={5} strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* ---------------- chips ---------------- */}
        <Chip x={640} y={528} text={'ctx.spawn("worker", `${parentId}-stage-1`)'} color={colors.ACCENT} u={idChipU} />
        <Chip x={430} y={250} text={'initialMessage: previous stage output'} color={colors.SECONDARY} u={handChipU} />
        <Chip x={905} y={186} text={'stage two already ran — no restart'} color={colors.POSITIVE} u={holdChipU} />

        {/* ---------------- the stream tape ---------------- */}
        {rows > 0.05 && (
          <g>
            <text x={TAPE_X0} y={TAPE_Y - 12} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              the pipeline&apos;s stream — append only
            </text>
            <line x1={TAPE_X0} y1={TAPE_Y + 44} x2={TAPE_X0 + 7 * 128 + 20} y2={TAPE_Y + 44} stroke={colors.GRID} strokeWidth={2} />
            {TAPE_CELLS.map((c, i) => {
              const u = clamp01(rows - i);
              if (u <= 0) return null;
              const x = TAPE_X0 + i * 128;
              return (
                <g key={i} opacity={u} transform={`translate(0 ${6 * (1 - u)})`}>
                  <rect x={x} y={TAPE_Y} width={120} height={36} rx={7} fill={colors.PANEL} stroke={c.c} strokeOpacity={0.55} />
                  <text x={x + 60} y={TAPE_Y + 15} textAnchor="middle" fill={colors.TEXT} fontSize={9.5} fontFamily={MONO}>
                    {c.a}
                  </text>
                  <text x={x + 60} y={TAPE_Y + 29} textAnchor="middle" fill={c.c} fontSize={10} fontFamily={MONO}>
                    {c.b}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
