// Book scene — replay-qa-week, chapter 3: "You Fix It. It Checks."
//
// You ship the fix and flag the bug done; the agent walks the same path again
// and lays down a BRAND NEW movie. The two tapes sit one above the other —
// Tuesday's tape with its red crash moment, today's tape recording live — a
// comparison sweep reads them moment by moment, the camera dives to the same
// timestamp on both, and the moment flips to green ONLY on the new tape.
// Epistemics in plain words: "it's broken" is cheap to check; "it's fixed" is
// the expensive sentence, so green waits for receipts.
//
// Persistent object: the pair of tapes. Centerpiece: the aligned-moment
// comparison machine (shared sweep line + rung links between the two tapes).
import { CAMERA_HOME, Camera, Timeline, colors, ease, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage 1280×720; the bottom strip (y ≳ 630) stays clear for captions. */
const TAPE_X = 200;
const TAPE_W = 900;
const TAPE_H = 40;
const OLD = { x: TAPE_X, y: 268, w: TAPE_W, h: TAPE_H };
const NEW = { x: TAPE_X, y: 428, w: TAPE_W, h: TAPE_H };
const BUG = { x: 200, y: 84, w: 470, h: 96 };
const GHOST = { x: 730, y: 92, w: 370, h: 80 };

/** The moment where Tuesday's run fell over (fraction along the tape). */
const CRASH_U = 0.72;
const crashX = TAPE_X + CRASH_U * TAPE_W;

/* ------------------------------------------------------------------ data */
type Moment = { u: number; kind: 'step' | 'crash' | 'ok' | 'done'; label?: string };

/** Tuesday's tape: the walk up to the break. Nothing useful after it. */
const OLD_MOMENTS: Moment[] = [
  { u: 0.06, kind: 'step', label: 'open shop' },
  { u: 0.2, kind: 'step' },
  { u: 0.34, kind: 'step', label: 'add to cart' },
  { u: 0.5, kind: 'step', label: 'checkout' },
  { u: 0.64, kind: 'step', label: 'pay' },
  { u: CRASH_U, kind: 'crash', label: 'page errors' },
];

/** Today's tape: the same walk, plus the part Tuesday never reached. */
const NEW_MOMENTS: Moment[] = [
  { u: 0.06, kind: 'step', label: 'open shop' },
  { u: 0.2, kind: 'step' },
  { u: 0.34, kind: 'step', label: 'add to cart' },
  { u: 0.5, kind: 'step', label: 'checkout' },
  { u: 0.64, kind: 'step', label: 'pay' },
  { u: CRASH_U, kind: 'ok', label: 'page loads' },
  { u: 0.86, kind: 'done', label: 'order placed' },
];

/** Rungs of the comparison ladder — the shared moments the sweep matches. */
const SHARED_U = [0.06, 0.2, 0.34, 0.5, 0.64, CRASH_U];

/* -------------------------------------------------------------- cameras */
const CAM_TAPES: CameraState = { x: 650, y: 360, k: 1.06 };
const CAM_MOMENT: CameraState = { x: crashX, y: 368, k: 1.85 };
const CAM_CLOSE: CameraState = { x: 640, y: 340, k: 1.0 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const bugU = tl.channel('bugCard', 0); // the bug from Tuesday, still open
  const oldU = tl.channel('oldTape', 0); // Tuesday's tape reveal
  const shipU = tl.channel('fixShipped', 0); // your "done" flag pops on the card
  const walkU = tl.channel('agentWalk', 0); // the re-walk: new tape laid down live
  const rungsU = tl.channel('rungs', 0); // 0..SHARED_U.length, the ladder links
  const scanU = tl.channel('sweep', 0); // shared read head across both tapes
  const focusU = tl.channel('crashFocus', 0); // glow on the old red moment
  const flipU = tl.channel('greenFlip', 0); // the new tape's moment turns green
  const doneU = tl.channel('bugGreen', 0); // the bug card follows — green chip
  const ghostU = tl.channel('reopenGhost', 0); // the "if it still breaks" card
  const dimU = tl.channel('dimU', 0); // close: fade the machinery down

  /* — beat 1 · Wednesday morning, fix in hand ————————————————————————— */
  let t = 0.5;
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Tuesday, you watched the exact moment your checkout broke. Wednesday morning, you fix it. Took about twenty minutes.',
  });
  tl.tween(bugU, 1, { at: t - 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(oldU, 1, { at: t - 4.2, dur: 1.6, ease: ease.draw });
  t = tl.hold(t, 0.6);

  /* — beat 2 · you flag it done; the checking starts ———————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'You ship the fix and flag the bug as done. Most tools would take your word for it. This one goes and checks.',
  });
  tl.tween(shipU, 1, { at: t - 3.6, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 3 · the same walk, again ————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The agent opens your app and walks the exact same path that broke. Same clicks, same cart, same pay button.',
  });
  tl.tween(cam, CAM_TAPES, { at: t - 5.2, dur: 1.4, ease: ease.move });
  tl.tween(walkU, 0.55, { at: t - 4.0, dur: 3.6, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 4 · a brand new movie ———————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'And it films the whole walk as it goes. Not Tuesday’s tape again. A brand new movie, from today, on your fixed app.',
  });
  tl.tween(walkU, 1, { at: t - 5.4, dur: 4.4, ease: ease.linear });
  t = tl.hold(t, 0.6);

  /* — beat 5 · line the tapes up ———————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Then it lines the two movies up and reads them side by side, moment by moment. Every step on the old tape has a twin on the new one.',
  });
  tl.tween(rungsU, SHARED_U.length, { at: t - 5.0, dur: 2.4, ease: ease.enter });
  tl.tween(scanU, 0.62, { at: t - 4.6, dur: 4.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 6 · the moment (camera dives) ———————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'And here is the moment. On Tuesday’s tape, this is where the page fell over.',
  });
  tl.tween(scanU, CRASH_U, { at: t - 5.0, dur: 1.6, ease: ease.linear });
  tl.tween(cam, CAM_MOMENT, { at: t - 4.6, dur: 1.6, ease: ease.move });
  tl.tween(focusU, 1, { at: t - 2.8, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* — beat 7 · the flip — green only on the new tape ———————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'On today’s tape, the same moment just works. The page loads, the order goes through. Only now does the bug turn green.',
  });
  tl.tween(flipU, 1, { at: t - 4.2, dur: 0.6, ease: ease.pop });
  tl.tween(doneU, 1, { at: t - 2.4, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 8 · why green waits ————————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'That order matters. When it says a page broke, you can just look at the tape. But it’s fixed is the expensive kind of sentence, the kind that needs receipts. So green waits for the new movie.',
  });
  tl.tween(cam, CAM_CLOSE, { at: t - 6.2, dur: 1.6, ease: ease.move });
  tl.tween(focusU, 0, { at: t - 6.2, dur: 1.0, ease: ease.move });
  t = tl.hold(t, 0.6);

  /* — beat 9 · and if it wasn't really fixed ———————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'And if the fix didn’t really take? Nothing hides. The bug calmly comes back on your list, with a fresh movie of it still breaking.',
  });
  tl.tween(ghostU, 1, { at: t - 4.6, dur: 0.7, ease: ease.enter });
  tl.tween(ghostU, 0, { at: t - 0.6, dur: 0.9, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 10 · close ——————————————————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'So green here is never a mood. It’s a fact, with a film behind it.',
  });
  tl.tween(dimU, 1, { at: t - 4.6, dur: 1.4, ease: ease.move });
  tl.hold(t, 1.2);

  return { tl, cam, bugU, oldU, shipU, walkU, rungsU, scanU, focusU, flipU, doneU, ghostU, dimU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

const MOMENT_COLOR: Record<Moment['kind'], string> = {
  step: colors.ACCENT,
  crash: colors.NEGATIVE,
  ok: colors.POSITIVE,
  done: colors.POSITIVE,
};

/**
 * One film-strip tape. `reveal` draws it left to right; `focus` glows the
 * crash-timestamp moment; `flip` (new tape only) fades the ok/done markers in.
 */
function Tape({
  box, title, moments, reveal, focus, flip, fade,
}: {
  box: { x: number; y: number; w: number; h: number };
  title: string;
  moments: Moment[];
  reveal: number;
  focus: number;
  flip: number;
  fade: number;
}) {
  const r = clamp01(reveal);
  if (r <= 0) return null;
  const { x, y, w, h } = box;
  const drawnW = w * r;
  return (
    <g opacity={0.15 + 0.85 * clamp01(fade)}>
      <text x={x} y={y - 12} fill={colors.MUTED} fontSize={12.5}>
        {title}
      </text>
      <rect x={x} y={y} width={drawnW} height={h} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      {/* sprocket holes — it reads as film */}
      {Array.from({ length: 22 }, (_, i) => {
        const hx = x + 20 + i * 42;
        if (hx > x + drawnW - 14) return null;
        return (
          <g key={i}>
            <rect x={hx} y={y + 5} width={8} height={5} rx={2} fill={colors.BG} opacity={0.8} />
            <rect x={hx} y={y + h - 10} width={8} height={5} rx={2} fill={colors.BG} opacity={0.8} />
          </g>
        );
      })}
      {moments.map((m, i) => {
        // markers appear as the tape is drawn past them
        const seen = clamp01((r - m.u) * 14);
        if (seen <= 0) return null;
        const isVerdict = m.kind === 'ok' || m.kind === 'done';
        const mu = isVerdict ? seen * clamp01(flip) : seen;
        if (mu <= 0) return null;
        const mx = x + m.u * w;
        const cy = y + h / 2;
        const c = MOMENT_COLOR[m.kind];
        const hot = m.kind === 'crash' ? clamp01(focus) : m.kind === 'ok' ? clamp01(flip) : 0;
        return (
          <g key={i} opacity={mu}>
            {hot > 0 && <circle cx={mx} cy={cy} r={12 + 9 * hot} fill={c} opacity={0.2 * hot} />}
            {m.kind === 'crash' ? (
              <g stroke={c} strokeWidth={2.6} strokeLinecap="round">
                <line x1={mx - 5} y1={cy - 5} x2={mx + 5} y2={cy + 5} />
                <line x1={mx - 5} y1={cy + 5} x2={mx + 5} y2={cy - 5} />
              </g>
            ) : isVerdict ? (
              <g stroke={c} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <path d={`M ${mx - 5.5} ${cy} l 4 4.5 l 7 -8.5`} fill="none" />
              </g>
            ) : (
              <circle cx={mx} cy={cy} r={4.5} fill={c} />
            )}
            {m.label && (
              <text x={mx} y={y + h + 16} textAnchor="middle" fill={hot > 0.3 ? c : colors.MUTED} fontSize={10.5} fontFamily={mono}>
                {m.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** The comparison machine: rung links between twin moments + a shared sweep. */
function ComparisonLadder({ rungs, sweep, fade }: { rungs: number; sweep: number; fade: number }) {
  const sw = clamp01(sweep);
  const gapTop = OLD.y + OLD.h + 24;
  const gapBot = NEW.y - 18;
  return (
    <g opacity={0.15 + 0.85 * clamp01(fade)}>
      {SHARED_U.map((u, i) => {
        const ru = clamp01(rungs - i);
        if (ru <= 0) return null;
        const rx = TAPE_X + u * TAPE_W;
        const matched = sw >= u;
        const c = u === CRASH_U ? colors.WARM : colors.GRID;
        return (
          <line
            key={i}
            x1={rx}
            y1={gapTop}
            x2={rx}
            y2={gapTop + (gapBot - gapTop) * ru}
            stroke={c}
            strokeWidth={u === CRASH_U ? 1.8 : 1.2}
            strokeDasharray="3 4"
            opacity={(matched ? 0.9 : 0.35) * ru}
          />
        );
      })}
      {/* the shared read head — one line across both tapes */}
      {sw > 0.001 && (
        <g transform={`translate(${TAPE_X + sw * TAPE_W}, 0)`}>
          <line y1={OLD.y - 6} y2={NEW.y + NEW.h + 6} stroke={colors.WARM} strokeWidth={2} strokeLinecap="round" />
          <circle cy={OLD.y - 6} r={3.5} fill={colors.WARM} />
        </g>
      )}
    </g>
  );
}

/** The little agent that re-walks the path, laying the new tape behind it. */
function Walker({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || uu >= 0.999) return null;
  const wx = NEW.x + uu * NEW.w;
  const cy = NEW.y + NEW.h / 2;
  return (
    <g>
      <circle cx={wx} cy={cy} r={8} fill={colors.WARM} opacity={0.25} />
      <circle cx={wx} cy={cy} r={4} fill={colors.WARM} />
      <text x={wx} y={NEW.y - 12} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={mono}>
        recording
      </text>
    </g>
  );
}

/** The bug card — its status chip is the thing this whole chapter is about. */
function BugCard({ u, ship, done, fade }: { u: number; ship: number; done: number; fade: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = BUG;
  const d = clamp01(done);
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu * (0.15 + 0.85 * clamp01(fade))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={d > 0.5 ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={1.5} />
      <text x={18} y={26} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        your bug list
      </text>
      <text x={18} y={52} fill={colors.TEXT} fontSize={15} fontWeight={700}>
        Checkout errors when you pay
      </text>
      {/* the claim chip: your word first, then the proven green */}
      {clamp01(ship) > 0 && d < 0.999 && (
        <g opacity={clamp01(ship) * (1 - d)} transform={`scale(${0.92 + 0.08 * clamp01(ship)})`}>
          <rect x={18} y={62} width={128} height={24} rx={12} fill={colors.WARM} opacity={0.18} />
          <text x={82} y={79} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontWeight={700} fontFamily={mono}>
            fix shipped, unproven
          </text>
        </g>
      )}
      {d > 0 && (
        <g opacity={d} transform={`scale(${0.92 + 0.08 * d})`}>
          <rect x={18} y={62} width={148} height={24} rx={12} fill={colors.POSITIVE} opacity={0.2} />
          <text x={92} y={79} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
            fixed, new movie agrees
          </text>
        </g>
      )}
    </g>
  );
}

/** The other timeline — the fix that didn't take. Appears, then dissolves. */
function ReopenGhost({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = GHOST;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 8})`} opacity={uu * 0.9}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.4} strokeDasharray="6 5" />
      <text x={16} y={26} fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        if it still breaks
      </text>
      <text x={16} y={48} fill={colors.TEXT} fontSize={12.5}>
        the bug reopens on your list
      </text>
      <text x={16} y={67} fill={colors.MUTED} fontSize={11.5}>
        with a fresh movie of the break
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const fade = 1 - clamp01(s.get(scene.dimU)) * 0.55;
  return (
    <Camera {...s.get(scene.cam)}>
      <BugCard u={s.get(scene.bugU)} ship={s.get(scene.shipU)} done={s.get(scene.doneU)} fade={1} />
      <Tape
        box={OLD}
        title="Tuesday — the movie of the break"
        moments={OLD_MOMENTS}
        reveal={s.get(scene.oldU)}
        focus={s.get(scene.focusU)}
        flip={1}
        fade={fade}
      />
      <Tape
        box={NEW}
        title="today — a fresh movie of the same path"
        moments={NEW_MOMENTS}
        reveal={s.get(scene.walkU)}
        focus={0}
        flip={s.get(scene.flipU)}
        fade={fade}
      />
      <ComparisonLadder rungs={s.get(scene.rungsU)} sweep={s.get(scene.scanU)} fade={fade} />
      <Walker u={s.get(scene.walkU)} />
      <ReopenGhost u={s.get(scene.ghostU)} />
    </Camera>
  );
}
export const vizScene = () => scene;
