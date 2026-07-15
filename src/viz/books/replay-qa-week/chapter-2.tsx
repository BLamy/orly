// Tuesday: Bugs That Come With a Movie
//
// Coffee plus the morning list: a SHORT list of real problems, not a wall of
// alerts. Each one carries the steps it took and a movie of the exact run.
// Centerpiece: the top bug card unfolds into a scrubbable tape of frames; the
// playhead slides to the broken moment and the camera dives in to watch it
// happen. The old "cannot reproduce" ghost stamp appears — and dissolves.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The morning list — three cards, worst on top.
// ---------------------------------------------------------------------------

const CARDS = [
  { y: 120, sev: colors.NEGATIVE, title: 'Checkout — the page errors', sub: '6 steps · movie attached' },
  { y: 236, sev: colors.WARM, title: 'Search — empty results flash', sub: '4 steps · movie attached' },
  { y: 352, sev: colors.WARM, title: 'Profile — photo never saves', sub: '5 steps · movie attached' },
] as const;
const CARD = { x: 76, w: 380, h: 96 } as const;

const STEPS = ['open the store', 'add a jacket to the cart', 'go to checkout', 'pay'] as const;

// ---------------------------------------------------------------------------
// The tape — a strip of frames, each a tiny deterministic "screen".
// ---------------------------------------------------------------------------

const TAPE = { x: 130, y: 452, w: 1010, h: 116 } as const;
const N_FRAMES = 22;
const FRAME_W = (TAPE.w - 24) / N_FRAMES;
const CRASH_U = 0.78;
const CRASH_FRAME = Math.round(CRASH_U * (N_FRAMES - 1));
const crashX = TAPE.x + 12 + (CRASH_FRAME + 0.5) * FRAME_W;

const rand = mulberry32(20260714);
/** per-frame thumbnail: 3 bar widths + a highlight row — a tiny fake screen */
const THUMBS: number[][] = Array.from({ length: N_FRAMES }, () =>
  Array.from({ length: 3 }, () => 0.35 + rand() * 0.55),
);

// camera marks
const CAM_LIST: CameraState = { x: 340, y: 300, k: 1.35 };
const CAM_TAPE: CameraState = { x: 640, y: 470, k: 1.15 };
const CAM_CRASH: CameraState = { x: crashX, y: 430, k: 2.0 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  listU: ChannelRef<number>;
  listOp: ChannelRef<number>;
  pickU: ChannelRef<number>;
  stepsU: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  scrub: ChannelRef<number>;
  breakU: ChannelRef<number>;
  ghostU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const listU = tl.channel('listU', 0);
  const listOp = tl.channel('listOp', 1);
  const pickU = tl.channel('pickU', 0);
  const stepsU = tl.channel('stepsU', 0);
  const tapeU = tl.channel('tapeU', 0);
  const scrub = tl.channel('scrub', 0);
  const breakU = tl.channel('breakU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the morning list —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Tuesday, first coffee. Waiting for you: a short list of real problems, not a wall of alerts.',
  });
  tl.tween(cam, CAM_LIST, { at: 0.6, dur: 1.6, ease: ease.move });
  tl.tween(listU, 1, { at: 0.8, dur: 1.8, ease: ease.enter });

  // — Beat 2 · worst on top —
  tl.caption({
    at: 7.5,
    dur: 5.5,
    text: 'Each one is ranked by how much it hurts, so the worst thing is always on top.',
  });
  tl.tween(pickU, 1, { at: 9.4, dur: 0.7, ease: ease.pop });
  tl.hold(13.0, 0.6);

  // — Beat 3 · the steps —
  tl.caption({
    at: 13.6,
    dur: 6,
    text: 'Open the first one. It carries the exact steps that were taken, in order.',
  });
  tl.tween(stepsU, 1, { at: 14.4, dur: 2.0, ease: ease.enter });
  tl.hold(19.6, 0.6);

  // — Beat 4 · the movie —
  tl.caption({
    at: 20.2,
    dur: 6,
    text: 'And it comes with a movie — a full tape of the run where things went wrong.',
  });
  tl.tween(cam, CAM_TAPE, { at: 20.4, dur: 1.6, ease: ease.move });
  tl.tween(tapeU, 1, { at: 21.0, dur: 1.6, ease: ease.draw });
  tl.hold(26.2, 0.6);

  // — Beat 5 · scrub to the moment —
  tl.caption({
    at: 26.8,
    dur: 5.5,
    text: 'You slide along the tape, straight to the exact moment it broke.',
  });
  tl.tween(scrub, CRASH_U, { at: 27.6, dur: 4.4, ease: ease.move });
  tl.tween(cam, CAM_CRASH, { at: 30.0, dur: 2.0, ease: ease.move });

  // — Beat 6 · watch it happen —
  tl.caption({
    at: 33.4,
    dur: 6,
    text: 'And you watch it happen. The click, the pause, the page giving up.',
  });
  tl.tween(breakU, 1, { at: 34.6, dur: 1.2, ease: ease.enter });
  tl.hold(39.4, 0.8);

  // — Beat 7 · the old stamp —
  tl.caption({
    at: 40.2,
    dur: 6,
    text: 'There is an old stamp that used to live on bug reports: cannot reproduce.',
  });
  tl.tween(cam, CAM_TAPE, { at: 40.4, dur: 1.8, ease: ease.move });
  tl.tween(ghostU, 1, { at: 41.6, dur: 1.0, ease: ease.enter });

  // — Beat 8 · not here —
  tl.caption({
    at: 46.6,
    dur: 6.5,
    text: 'Not here. The tape is the reproduction. Nobody argues about what the tester meant.',
  });
  tl.tween(ghostU, 0, { at: 48.2, dur: 2.2, ease: ease.move });
  tl.hold(53.1, 0.6);

  // — Beat 9 · you can just look —
  tl.caption({
    at: 53.7,
    dur: 6,
    text: "When it says a page broke, you don't have to trust it. You can just look.",
  });
  tl.tween(cam, CAM_WIDE, { at: 53.9, dur: 1.8, ease: ease.move });
  tl.tween(listOp, 0.12, { at: 54.4, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.0, dur: 1.0, ease: ease.enter });

  // — Beat 10 · the point —
  tl.caption({
    at: 60.3,
    dur: 6,
    text: 'That is the trick of the whole thing: bad news arrives carrying its own proof.',
  });
  tl.hold(66.3, 1.4);

  return { tl, cam, listU, listOp, pickU, stepsU, tapeU, scrub, breakU, ghostU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const listU = s.get(scene.listU);
  const listOp = s.get(scene.listOp);
  const pickU = s.get(scene.pickU);
  const stepsU = s.get(scene.stepsU);
  const tapeU = s.get(scene.tapeU);
  const scrub = s.get(scene.scrub);
  const breakU = s.get(scene.breakU);
  const ghostU = s.get(scene.ghostU);
  const closeU = s.get(scene.closeU);

  const playX = TAPE.x + 12 + scrub * (TAPE.w - 24);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the morning list */}
        {CARDS.map((c, i) => {
          const u = clamp01(listU * 2.2 - i * 0.6);
          const picked = i === 0 ? pickU : 0;
          const op = i === 0 ? Math.max(listOp, 0.12) : listOp * (1 - 0.5 * pickU);
          return u > 0 ? (
            <g key={i} opacity={u * op} transform={`translate(0 ${(1 - u) * 18})`}>
              <rect
                x={CARD.x}
                y={c.y}
                width={CARD.w}
                height={CARD.h}
                rx={12}
                fill={colors.PANEL}
                stroke={picked > 0 ? c.sev : colors.GRID}
                strokeWidth={1 + 1.2 * picked}
              />
              <circle cx={CARD.x + 30} cy={c.y + 32} r={7} fill={c.sev} />
              <text x={CARD.x + 50} y={c.y + 37} fill={colors.TEXT} fontSize={16}>
                {c.title}
              </text>
              <text x={CARD.x + 50} y={c.y + 64} fill={colors.MUTED} fontSize={13}>
                {c.sub}
              </text>
            </g>
          ) : null;
        })}

        {/* the steps panel — what the first card carries */}
        {stepsU > 0 && (
          <g opacity={Math.max(listOp, 0.12)}>
            <rect x={520} y={110} width={330} height={200} rx={12} fill={colors.PANEL} stroke={colors.GRID} opacity={stepsU} />
            <text x={544} y={144} fill={colors.MUTED} fontSize={13} opacity={stepsU}>
              steps taken
            </text>
            {STEPS.map((step, i) => {
              const u = clamp01(stepsU * 2.5 - i * 0.5);
              return (
                <g key={i} opacity={u}>
                  <text x={544} y={178 + i * 32} fill={colors.MUTED} fontSize={14}>
                    {i + 1}.
                  </text>
                  <text x={568} y={178 + i * 32} fill={colors.TEXT} fontSize={15}>
                    {step}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* the tape — a scrubbable movie of the run */}
        {tapeU > 0 && (
          <g>
            <rect
              x={TAPE.x}
              y={TAPE.y}
              width={TAPE.w}
              height={TAPE.h}
              rx={10}
              fill={colors.PANEL}
              stroke={colors.GRID}
              opacity={tapeU}
            />
            {THUMBS.map((bars, i) => {
              const u = clamp01(tapeU * 2 - (i / N_FRAMES) * 1);
              const fx = TAPE.x + 12 + i * FRAME_W;
              const isCrash = i === CRASH_FRAME;
              const seen = playX >= fx + FRAME_W * 0.5;
              return (
                <g key={i} opacity={u}>
                  <rect
                    x={fx + 2}
                    y={TAPE.y + 14}
                    width={FRAME_W - 4}
                    height={TAPE.h - 28}
                    rx={4}
                    fill={isCrash && breakU > 0 ? colors.NEGATIVE : colors.BG}
                    fillOpacity={isCrash ? 0.12 + 0.2 * breakU : 1}
                    stroke={isCrash ? colors.NEGATIVE : colors.GRID}
                    strokeWidth={isCrash ? 1.6 : 1}
                    opacity={seen ? 1 : 0.55}
                  />
                  {bars.map((w, r) => (
                    <rect
                      key={r}
                      x={fx + 8}
                      y={TAPE.y + 28 + r * 22}
                      width={(FRAME_W - 16) * w}
                      height={7}
                      rx={3}
                      fill={isCrash && r === 2 ? colors.NEGATIVE : colors.MUTED}
                      opacity={isCrash && r === 2 ? 0.4 + 0.6 * breakU : 0.35}
                    />
                  ))}
                </g>
              );
            })}
            {/* playhead */}
            <g opacity={tapeU}>
              <line x1={playX} y1={TAPE.y - 8} x2={playX} y2={TAPE.y + TAPE.h + 8} stroke={colors.ACCENT} strokeWidth={2.4} />
              <circle cx={playX} cy={TAPE.y - 14} r={7} fill={colors.ACCENT} />
            </g>
            {/* the broken moment, examined up close */}
            {breakU > 0 && (
              <g opacity={breakU}>
                <circle cx={crashX} cy={TAPE.y + TAPE.h / 2} r={34 + 10 * breakU} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} opacity={0.5 * breakU} />
                <text x={crashX} y={TAPE.y - 30} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14}>
                  the moment it broke
                </text>
              </g>
            )}
          </g>
        )}

        {/* the ghost stamp — dissolving */}
        {ghostU > 0 && (
          <g opacity={ghostU * 0.85} transform={`translate(640 300) rotate(-12) scale(${1 + (1 - ghostU) * 0.35})`}>
            <rect x={-190} y={-38} width={380} height={76} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} strokeDasharray="10 7" />
            <text x={0} y={10} textAnchor="middle" fill={colors.NEGATIVE} fontSize={30} fontWeight={700} letterSpacing={2}>
              CANNOT REPRODUCE
            </text>
          </g>
        )}

        {/* close — the claim and its receipt */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <text x={640} y={200} textAnchor="middle" fill={colors.TEXT} fontSize={26}>
              a page broke
            </text>
            <text x={640} y={238} textAnchor="middle" fill={colors.ACCENT} fontSize={17}>
              → just look at the tape
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
