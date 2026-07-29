// The Loop Closes
//
// Backed by: .github/workflows/new-book.yml (commit + open a PR even on
// partial failure — `if: always()` — and the PR is left OPEN for review),
// .github/scripts/open-book-pr.sh, .github/workflows/preview.yml (dispatched
// after the push: `wrangler versions upload --preview-alias`, sticky PR
// comment with per-book links, updated on every push),
// .github/workflows/comment-edit.yml ("@claude <change>" from the owner
// re-runs the tweak pipeline against the PR's book and pushes), and
// .github/workflows/deploy.yml (merge to main → production Workers deploy).
// The centerpiece is the full nine-stop ring; the finale closes it into the
// ouroboros — the cover animal — because this book was built by the loop it
// describes.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { LoopRing } from '../../agent';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Layout — 1280×720; captions own the bottom ~12% (y ≳ 633).
// ---------------------------------------------------------------------------

const BIG = { cx: 450, cy: 320, r: 218 } as const;
/** The whole pipeline as ring stops (clockwise from 12 o'clock). */
const STOPS = [
  { label: 'issue' },
  { label: 'claude' },
  { label: 'scenes' },
  { label: 'voice' },
  { label: 'verify' },
  { label: 'PR', color: colors.WARM },
  { label: 'preview' },
  { label: 'merge', color: colors.POSITIVE },
  { label: 'shelf' },
];
const N = STOPS.length;
const stopPos = (i: number) => {
  const a = -Math.PI / 2 + (i / N) * TAU;
  return { x: BIG.cx + BIG.r * Math.cos(a), y: BIG.cy + BIG.r * Math.sin(a) };
};

const PR_CARD = { x: 905, y: 96, w: 320, h: 104 } as const;
const PREV_CARD = { x: 905, y: 224, w: 320, h: 92 } as const;
const REPLY_CARD = { x: 905, y: 340, w: 320, h: 62 } as const;
const SHELF = { x: 905, y: 428, w: 320, h: 140 } as const;

/** Spines already on the shelf (colors from the real library palette). */
const SPINES = ['#34d399', '#f5b942', '#2dd4bf', '#fb7185', '#22d3ee', '#a78bfa', '#38bdf8', '#fbbf24', '#4ade80'];

// camera marks
const CAM_CARDS: CameraState = { x: 840, y: 260, k: 1.25 };
const CAM_RING: CameraState = { x: 520, y: 330, k: 1.1 };
const CAM_SHELF: CameraState = { x: 890, y: 420, k: 1.3 };
const CAM_END: CameraState = { x: 570, y: 330, k: 1.06 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ringU: ChannelRef<number>;
  lapU: ChannelRef<number>;
  prU: ChannelRef<number>;
  openPulse: ChannelRef<number>;
  prevU: ChannelRef<number>;
  replyU: ChannelRef<number>;
  chordU: ChannelRef<number>;
  shelfU: ChannelRef<number>;
  spineU: ChannelRef<number>;
  cardsDim: ChannelRef<number>;
  snakeU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const lapU = tl.channel('lapU', 0); // LoopRing orbit progress, in laps
  const prU = tl.channel('prU', 0);
  const openPulse = tl.channel('openPulse', 0);
  const prevU = tl.channel('prevU', 0);
  const replyU = tl.channel('replyU', 0);
  const chordU = tl.channel('chordU', 0); // the @claude inner-loop flight
  const shelfU = tl.channel('shelfU', 0);
  const spineU = tl.channel('spineU', 0);
  const cardsDim = tl.channel('cardsDim', 0);
  const snakeU = tl.channel('snakeU', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the PR, even on failure —
  tl.caption({
    at: 0.5,
    dur: 7.5,
    text: 'One station is left, and it makes the whole machine safe to run: the pull request. The run commits everything it made — even if it died halfway, the partial work is saved.',
  });
  tl.tween(ringU, 1, { at: 0.6, dur: 2.6, ease: ease.draw });
  tl.set(lapU, 4 / N, 0.6);
  tl.tween(lapU, 5 / N, { at: 3.4, dur: 2.0, ease: ease.linear });
  tl.tween(prU, 1, { at: 5.6, dur: 0.8, ease: ease.enter });

  // — Beat 2 · left open on purpose —
  tl.caption({
    at: 8.5,
    dur: 6,
    text: 'And the pull request stays open on purpose. Publishing is a human decision — merging is the approval, and nothing ships without it.',
  });
  tl.tween(cam, CAM_CARDS, { at: 8.7, dur: 1.4, ease: ease.move });
  tl.tween(openPulse, 1, { at: 9.5, dur: 0.6, ease: ease.pop });
  tl.tween(openPulse, 0.4, { at: 10.6, dur: 0.8, ease: ease.move });

  // — Beat 3 · the preview —
  tl.caption({
    at: 15.0,
    dur: 7,
    text: 'Meanwhile a preview deploys to its own live address, and the link lands right on the pull request. Every push updates the same link.',
  });
  tl.tween(lapU, 6 / N, { at: 15.2, dur: 1.8, ease: ease.linear });
  tl.tween(prevU, 1, { at: 17.2, dur: 0.8, ease: ease.enter });

  // — Beat 4 · watch before deciding —
  tl.caption({
    at: 22.5,
    dur: 5.5,
    text: 'So you watch the finished book in a real browser, at a real address, before deciding anything at all.',
  });
  tl.hold(27.4, 0.6);

  // — Beat 5 · ask for a change —
  tl.caption({
    at: 28.5,
    dur: 6,
    text: 'Want a change? Reply on the pull request, mention the bot by name, and describe the edit in plain words.',
  });
  tl.tween(replyU, 1, { at: 29.2, dur: 0.8, ease: ease.enter });

  // — Beat 6 · the inner loop —
  tl.caption({
    at: 35.0,
    dur: 7,
    text: 'That comment sends the book around again: the same scenes, the same voice, the same verification — and back to the very same open pull request.',
  });
  tl.tween(cam, CAM_RING, { at: 35.2, dur: 1.4, ease: ease.move });
  tl.set(lapU, 0, 36.0);
  tl.tween(chordU, 1, { at: 36.0, dur: 1.6, ease: ease.move });
  tl.set(lapU, 2 / N, 37.6);
  tl.set(chordU, 0, 37.7);
  tl.tween(lapU, 5 / N, { at: 37.8, dur: 3.6, ease: ease.linear });

  // — Beat 7 · the gate again —
  tl.caption({
    at: 42.5,
    dur: 5.5,
    text: 'Every lap ends at the same gate: a fresh preview, and a human deciding. It runs as many times as it takes.',
  });
  tl.hold(47.4, 0.6);

  // — Beat 8 · merge → live —
  tl.caption({
    at: 48.5,
    dur: 6.5,
    text: 'Merge, and the shelf redeploys to production. The book is live, sitting beside every book that came before it.',
  });
  tl.tween(lapU, 8 / N, { at: 48.7, dur: 2.6, ease: ease.linear });
  tl.tween(cam, CAM_SHELF, { at: 50.0, dur: 1.4, ease: ease.move });
  tl.tween(shelfU, 1, { at: 50.6, dur: 0.9, ease: ease.enter });
  tl.tween(spineU, 1, { at: 51.8, dur: 1.2, ease: ease.move });

  // — Beats 9–11 · the recap lap —
  tl.caption({
    at: 55.5,
    dur: 5,
    text: 'Now look at the whole ring one last time. An issue became a plan.',
  });
  tl.tween(cam, CAM_END, { at: 55.7, dur: 1.6, ease: ease.move });
  tl.tween(cardsDim, 1, { at: 55.9, dur: 1.2, ease: ease.move });
  tl.tween(lapU, 8 / N + 1 + 1 / N, { at: 56.5, dur: 19, ease: ease.linear });

  tl.caption({
    at: 61.0,
    dur: 6,
    text: 'The plan became scenes whose captions were the script, and the script became a voice with an exact cue for every line.',
  });
  tl.caption({
    at: 67.5,
    dur: 7,
    text: 'Gates threw out what could not be spoken and what could not be proven to play, and a pull request asked a human before anything shipped.',
  });

  // — Beat 12 · ouroboros —
  tl.caption({
    at: 75.0,
    dur: 8.5,
    text: 'And this book — the one you just watched — went through that exact loop, from an issue titled after itself. The snake eats its tail. That is the whole machine.',
  });
  tl.tween(snakeU, 1, { at: 76.0, dur: 1.8, ease: ease.draw });
  tl.tween(endU, 1, { at: 78.6, dur: 1.2, ease: ease.enter });
  tl.hold(83.5, 1.5);

  return { tl, cam, ringU, lapU, prU, openPulse, prevU, replyU, chordU, shelfU, spineU, cardsDim, snakeU, endU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

/** The @claude inner-loop flight: preview stop → scenes stop, through the ring. */
function chordPos(u: number) {
  const a = stopPos(6);
  const b = stopPos(2);
  const q = 1 - u;
  return {
    x: q * q * a.x + 2 * q * u * BIG.cx + u * u * b.x,
    y: q * q * a.y + 2 * q * u * BIG.cy + u * u * b.y,
  };
}

/** The ouroboros head, biting the tail at 12 o'clock. */
function SnakeHead({ u }: { u: number }) {
  if (u <= 0) return null;
  const top = { x: BIG.cx, y: BIG.cy - BIG.r };
  // the head slides in along the ring from slightly counter-clockwise
  const a0 = -Math.PI / 2 - 0.5 * (1 - u);
  const hx = BIG.cx + BIG.r * Math.cos(a0);
  const hy = BIG.cy + BIG.r * Math.sin(a0);
  const rot = ((a0 + Math.PI / 2) * 180) / Math.PI + 90; // tangent, clockwise
  return (
    <g opacity={u}>
      {/* tail tip, tapering just clockwise of the bite */}
      <path
        d={`M ${top.x + 14} ${top.y + 2} q 14 4 26 14`}
        fill="none"
        stroke={colors.POSITIVE}
        strokeWidth={5 * u}
        strokeLinecap="round"
        opacity={0.9}
      />
      {/* head */}
      <g transform={`translate(${hx} ${hy}) rotate(${rot})`}>
        <path d="M -14 -12 Q 16 -10 22 0 Q 16 10 -14 12 Q -6 0 -14 -12 Z" fill={colors.POSITIVE} />
        <circle cx={2} cy={-4.5} r={2.6} fill={colors.BG} />
        <path d="M 22 0 l 10 -3 m -10 3 l 10 3" stroke={colors.NEGATIVE} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ringU = s.get(scene.ringU);
  const lapU = s.get(scene.lapU);
  const prU = s.get(scene.prU);
  const openPulse = s.get(scene.openPulse);
  const prevU = s.get(scene.prevU);
  const replyU = s.get(scene.replyU);
  const chordU = s.get(scene.chordU);
  const shelfU = s.get(scene.shelfU);
  const spineU = s.get(scene.spineU);
  const cardsDim = s.get(scene.cardsDim);
  const snakeU = s.get(scene.snakeU);
  const endU = s.get(scene.endU);

  const cardsOp = 1 - 0.9 * cardsDim;
  const cp = chordPos(clamp01(chordU));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the ring (the pipeline, whole) ---- */}
        <g opacity={endU > 0 ? 1 - 0.35 * endU : 1}>
          <LoopRing
            cx={BIG.cx}
            cy={BIG.cy}
            r={BIG.r}
            stops={STOPS}
            u={lapU}
            reveal={ringU}
            color={colors.ACCENT}
            labelSize={15}
          />
          {/* the @claude chord flight */}
          {chordU > 0 && chordU < 1 && (
            <g>
              <path
                d={`M ${stopPos(6).x} ${stopPos(6).y} Q ${BIG.cx} ${BIG.cy} ${stopPos(2).x} ${stopPos(2).y}`}
                fill="none"
                stroke={colors.SECONDARY}
                strokeWidth={1.5}
                strokeDasharray="3 7"
                opacity={0.6}
              />
              <circle cx={cp.x} cy={cp.y} r={7} fill={colors.SECONDARY} />
            </g>
          )}
          <SnakeHead u={snakeU} />
        </g>

        {/* ---- the PR card ---- */}
        {prU > 0 && (
          <g opacity={prU * cardsOp}>
            <rect x={PR_CARD.x} y={PR_CARD.y} width={PR_CARD.w} height={PR_CARD.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={PR_CARD.x + 18} y={PR_CARD.y + 28} fill={colors.TEXT} fontSize={14} fontWeight={700}>
              book: ORLY Loop
            </text>
            <text x={PR_CARD.x + 18} y={PR_CARD.y + 50} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              src/viz/books/the-orly-loop · manifest
            </text>
            <text x={PR_CARD.x + 18} y={PR_CARD.y + 68} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              audio/ · previews/ · library.json
            </text>
            <rect x={PR_CARD.x + PR_CARD.w - 78} y={PR_CARD.y + 16} width={60} height={24} rx={12} fill={colors.POSITIVE} opacity={0.5 + 0.5 * openPulse} />
            <text x={PR_CARD.x + PR_CARD.w - 48} y={PR_CARD.y + 33} textAnchor="middle" fill={colors.BG} fontSize={12} fontWeight={700}>
              OPEN
            </text>
            <text x={PR_CARD.x + 18} y={PR_CARD.y + 90} fill={colors.MUTED} fontSize={11} fontStyle="italic">
              opened by the run — reviewed by you
            </text>
          </g>
        )}

        {/* ---- the sticky preview comment ---- */}
        {prevU > 0 && (
          <g opacity={prevU * cardsOp}>
            <rect x={PREV_CARD.x} y={PREV_CARD.y} width={PREV_CARD.w} height={PREV_CARD.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
            <text x={PREV_CARD.x + 18} y={PREV_CARD.y + 26} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
              📖 Preview deployed
            </text>
            <text x={PREV_CARD.x + 18} y={PREV_CARD.y + 48} fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
              …workers.dev/?bundle=the-orly-loop
            </text>
            <text x={PREV_CARD.x + 18} y={PREV_CARD.y + 70} fill={colors.MUTED} fontSize={11} fontStyle="italic">
              updated on each push · preview.yml
            </text>
          </g>
        )}

        {/* ---- the @claude reply ---- */}
        {replyU > 0 && (
          <g opacity={replyU * cardsOp}>
            <rect x={REPLY_CARD.x} y={REPLY_CARD.y} width={REPLY_CARD.w} height={REPLY_CARD.h} rx={12} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.3} />
            <text x={REPLY_CARD.x + 18} y={REPLY_CARD.y + 26} fill={colors.SECONDARY} fontSize={12.5} fontFamily={MONO}>
              @claude tighten the pacing in
            </text>
            <text x={REPLY_CARD.x + 18} y={REPLY_CARD.y + 44} fill={colors.SECONDARY} fontSize={12.5} fontFamily={MONO}>
              chapter two
            </text>
          </g>
        )}

        {/* ---- the shelf ---- */}
        {shelfU > 0 && (
          <g opacity={shelfU * (1 - 0.85 * cardsDim)}>
            <rect x={SHELF.x} y={SHELF.y} width={SHELF.w} height={SHELF.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={SHELF.x + 18} y={SHELF.y + 26} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
              the shelf — production
            </text>
            <line x1={SHELF.x + 16} y1={SHELF.y + 112} x2={SHELF.x + SHELF.w - 16} y2={SHELF.y + 112} stroke={colors.GRID} strokeWidth={3} />
            {SPINES.map((c, i) => (
              <rect key={i} x={SHELF.x + 22 + i * 26} y={SHELF.y + 46} width={18} height={66} rx={3} fill={c} opacity={0.75} />
            ))}
            {/* the new spine slides in */}
            <g opacity={clamp01(spineU * 2)}>
              <rect
                x={SHELF.x + 22 + SPINES.length * 26 + 20 * (1 - spineU)}
                y={SHELF.y + 46 - 26 * (1 - spineU)}
                width={18}
                height={66}
                rx={3}
                fill={colors.ACCENT}
              />
              {spineU > 0.9 && (
                <circle cx={SHELF.x + 31 + SPINES.length * 26} cy={SHELF.y + 79} r={22} fill={colors.ACCENT} opacity={0.25 * (spineU - 0.9) * 10} />
              )}
            </g>
          </g>
        )}

        {/* ---- the closing panel (opaque — the stage under it stays quiet) ---- */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={640 - 270} y={230} width={540} height={168} rx={16} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.6} />
            <text x={640} y={295} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={800}>
              ORLY Loop
            </text>
            <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontStyle="italic">
              a book built by the loop it describes
            </text>
            <text x={640} y={368} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              issue → build → voice → verify → publish → 🐍
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
