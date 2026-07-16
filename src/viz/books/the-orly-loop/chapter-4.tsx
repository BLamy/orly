// Evidence, Not Confidence
//
// (Title dodges verify-book.mjs's play-affordance heuristic — a chapter
// button whose label matches /play|start|begin/i would get clicked by the
// gate itself and navigate every check to this chapter.)
//
// Backed by: generator/verify-book.mjs — `vite preview` serves the built
// dist/, headless Chromium opens ?bundle=<slug>&chapter=<n> for EVERY
// chapter, asserts the scene SVG is mounted (.bp-stage svg, not .bp-spinner),
// seeks to mid-chapter (SEEK_FRACTION 0.5), proves it's animating (innerHTML
// changed across 700ms or the audio clock advanced), requires a captions
// element and ZERO console errors, and screenshots each chapter to
// public/generated/<slug>/previews/ — plus new-book.yml, where a verify
// failure becomes a PR warning (continue-on-error), never a lost book.
// Epistemics: "it plays" is the expensive claim; this gate collects evidence.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { ProgressRing, RING } from './ring';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Layout — 1280×720; captions own the bottom ~12% (y ≳ 633).
// ---------------------------------------------------------------------------

const BROWSER = { x: 110, y: 96, w: 640, h: 440 } as const;
const VIEW = { x: BROWSER.x + 10, y: BROWSER.y + 54, w: BROWSER.w - 20, h: BROWSER.h - 100 } as const;
const URL_TEXT = 'localhost:5199/?bundle=the-orly-loop&chapter=4';

/** The real checks, in verify-book.mjs order. */
const CHECKS = [
  { label: 'scene mounted', detail: '.bp-stage svg' },
  { label: 'not stuck loading', detail: '.bp-spinner absent' },
  { label: 'seek to mid-chapter', detail: 'SEEK_FRACTION = 0.5' },
  { label: 'still animating', detail: 'innerHTML changed over 700ms' },
  { label: 'captions present', detail: '[class*="caption"]' },
  { label: 'console clean', detail: '0 errors (favicon excluded)' },
];
const PANEL_CK = { x: 800, y: 96, w: 384, h: 300 } as const;
const ckY = (i: number) => PANEL_CK.y + 52 + i * 41;

/** Snapshot pair (the alive check) + the frozen counterexample. */
const SNAP = { y: 430, w: 170, h: 124, ax: 210, bx: 470 } as const;
const PHASE_A = 0.52;
const PHASE_B = 0.585;
const FROZEN = { x: 820, y: 430, w: 110, h: 82, gap: 130 } as const;

/** The previews stack the screenshot flies to. */
const STACK = { x: 1080, y: 480 } as const;

// camera marks
const CAM_BROWSER: CameraState = { x: 430, y: 316, k: 1.35 };
const CAM_CHECKS: CameraState = { x: 950, y: 260, k: 1.45 };
const CAM_SNAP: CameraState = { x: 450, y: 430, k: 1.35 };
/** Beat 6 pulls back so the frozen counterexample inset is fully in frame. */
const CAM_FROZEN: CameraState = { x: 600, y: 430, k: 1.15 };

// ---------------------------------------------------------------------------
// The miniature chapter playing inside the browser — a pure orbit + bar.
// ---------------------------------------------------------------------------

function orbitPos(phase: number, cx: number, cy: number, r: number) {
  const a = -Math.PI / 2 + phase * TAU;
  return { x: cx + r * Math.cos(a), y: cy + r * 0.62 * Math.sin(a) };
}

/** One frame of the mini-scene at a given phase — used live and in snapshots. */
function MiniScene({ cx, cy, scale, phase }: { cx: number; cy: number; scale: number; phase: number }) {
  const r = 74 * scale;
  const p = orbitPos(phase, cx, cy, r);
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.62} fill="none" stroke={colors.GRID} strokeWidth={1.4 * scale} strokeDasharray="3 6" />
      <circle cx={cx} cy={cy} r={10 * scale} fill={colors.WARM} opacity={0.9} />
      <circle cx={p.x} cy={p.y} r={6 * scale} fill={colors.ACCENT} />
      <rect x={cx - r} y={cy + r * 0.62 + 16 * scale} width={2 * r * (0.2 + 0.8 * (phase % 1))} height={5 * scale} rx={2.5 * scale} fill={colors.POSITIVE} opacity={0.85} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  browserU: ChannelRef<number>;
  urlU: ChannelRef<number>;
  playT: ChannelRef<number>;
  checks: ChannelRef<number>[];
  browserDim: ChannelRef<number>;
  snapU: ChannelRef<number>;
  frozenU: ChannelRef<number>;
  ccGlow: ChannelRef<number>;
  consoleU: ChannelRef<number>;
  errU: ChannelRef<number>;
  flashU: ChannelRef<number>;
  shotU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  ringU: ChannelRef<number>;
  litU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const browserU = tl.channel('browserU', 0);
  const urlU = tl.channel('urlU', 0);
  const playT = tl.channel('playT', 0); // mini-chapter progress 0..1
  const checks = CHECKS.map((_, i) => tl.channel(`ck${i}`, 0));
  const browserDim = tl.channel('browserDim', 0);
  const snapU = tl.channel('snapU', 0);
  const frozenU = tl.channel('frozenU', 0);
  const ccGlow = tl.channel('ccGlow', 0);
  const consoleU = tl.channel('consoleU', 0);
  const errU = tl.channel('errU', 0);
  const flashU = tl.channel('flashU', 0);
  const shotU = tl.channel('shotU', 0);
  const dimU = tl.channel('dimU', 0);
  const ringU = tl.channel('ringU', 0);
  const litU = tl.channel('litU', 0);

  // — Beat 1 · the expensive claim —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: "By now the book exists and can speak, and it claims it plays. That is the expensive claim — the one that needs evidence, not confidence.",
  });
  tl.hold(0.5, 0.4);

  // — Beat 2 · a real browser, every chapter —
  tl.caption({
    at: 8.0,
    dur: 6.5,
    text: 'So the built shelf is served for real, and a headless browser opens the book the way a reader would — chapter by chapter, every chapter.',
  });
  tl.tween(cam, CAM_BROWSER, { at: 8.2, dur: 1.4, ease: ease.move });
  tl.tween(browserU, 1, { at: 8.4, dur: 0.9, ease: ease.enter });
  tl.tween(urlU, 1, { at: 9.4, dur: 1.8, ease: ease.linear });
  tl.tween(playT, 0.2, { at: 11.4, dur: 9, ease: ease.linear });

  // — Beat 3 · mounted, not loading —
  tl.caption({
    at: 15.1,
    dur: 6,
    text: 'First check: the scene actually mounted. A real drawing on the stage — not a blank panel, and not a spinner that never leaves.',
  });
  tl.tween(cam, CAM_CHECKS, { at: 15.3, dur: 1.4, ease: ease.move });
  tl.tween(checks[0], 1, { at: 16.4, dur: 0.5, ease: ease.pop });
  tl.tween(checks[1], 1, { at: 17.6, dur: 0.5, ease: ease.pop });

  // — Beat 4 · seek to the middle —
  tl.caption({
    at: 21.7,
    dur: 5.5,
    text: 'Then the gate seeks to the middle of the chapter. Anyone can render frame zero.',
  });
  tl.tween(cam, CAM_BROWSER, { at: 21.9, dur: 1.3, ease: ease.move });
  tl.set(playT, 0.5, 23.6);
  tl.tween(checks[2], 1, { at: 24.2, dur: 0.5, ease: ease.pop });
  tl.tween(playT, 0.62, { at: 24.0, dur: 16, ease: ease.linear });

  // — Beat 5 · the alive check —
  tl.caption({
    at: 27.8,
    dur: 7,
    text: 'Now the hard question: is it actually animating? Take a snapshot, wait seven hundred milliseconds, take another. If the picture changed, it is alive.',
  });
  tl.tween(cam, CAM_SNAP, { at: 28.0, dur: 1.4, ease: ease.move });
  tl.tween(browserDim, 0.5, { at: 28.2, dur: 0.8, ease: ease.move });
  tl.tween(snapU, 1, { at: 28.8, dur: 2.2, ease: ease.move });
  tl.tween(checks[3], 1, { at: 33.0, dur: 0.5, ease: ease.pop });

  // — Beat 6 · the frozen counterexample —
  tl.caption({
    at: 35.4,
    dur: 6,
    text: "A frozen scene fails right here — identical pictures, and a clock that isn't moving. That is exactly the bug this gate exists to catch.",
  });
  tl.tween(cam, CAM_FROZEN, { at: 35.6, dur: 1.3, ease: ease.move });
  tl.tween(frozenU, 1, { at: 35.8, dur: 1.0, ease: ease.enter });
  tl.hold(41.4, 0.6);

  // — Beat 7 · captions present —
  tl.caption({
    at: 42.0,
    dur: 5.5,
    text: 'The captions have to be on screen too — the voice needs somewhere to land.',
  });
  tl.tween(frozenU, 0, { at: 42.2, dur: 0.7, ease: ease.move });
  tl.tween(snapU, 0, { at: 42.2, dur: 0.7, ease: ease.move });
  tl.tween(browserDim, 0, { at: 42.4, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_BROWSER, { at: 42.4, dur: 1.3, ease: ease.move });
  tl.tween(ccGlow, 1, { at: 43.6, dur: 0.8, ease: ease.enter });
  tl.tween(checks[4], 1, { at: 44.6, dur: 0.5, ease: ease.pop });

  // — Beat 8 · console clean —
  tl.caption({
    at: 48.1,
    dur: 6,
    text: 'And the console has to stay silent. One error — anywhere, in any chapter — and the whole book fails the gate.',
  });
  tl.tween(consoleU, 1, { at: 48.5, dur: 0.7, ease: ease.enter });
  tl.tween(errU, 1, { at: 50.4, dur: 0.8, ease: ease.enter });
  tl.tween(checks[5], 1, { at: 52.4, dur: 0.5, ease: ease.pop });

  // — Beat 9 · evidence ships —
  tl.caption({
    at: 54.7,
    dur: 7,
    text: 'Each chapter leaves a screenshot behind, taken mid-play. The evidence ships with the pull request, so a human sees what the gate saw.',
  });
  tl.tween(errU, 0, { at: 54.9, dur: 0.6, ease: ease.move });
  tl.tween(flashU, 1, { at: 55.6, dur: 0.25, ease: ease.pop });
  tl.tween(flashU, 0, { at: 55.9, dur: 0.5, ease: ease.move });
  tl.tween(shotU, 1, { at: 56.4, dur: 1.6, ease: ease.move });

  // — Beat 10 · never lose the book —
  tl.caption({
    at: 62.3,
    dur: 8,
    text: 'A flaky browser never loses the book — a failure here becomes a warning on the pull request, not a deleted branch. Station four: proven to play.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 62.5, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 63.3, dur: 1.2, ease: ease.move });
  tl.tween(ringU, 1, { at: 64.5, dur: 1.8, ease: ease.draw });
  tl.tween(litU, 1, { at: 66.7, dur: 0.8, ease: ease.pop });
  tl.hold(70.0, 1.5);

  return {
    tl, cam, browserU, urlU, playT, checks, browserDim, snapU, frozenU,
    ccGlow, consoleU, errU, flashU, shotU, dimU, ringU, litU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Polaroid({ x, y, w, h, phase, label, op }: { x: number; y: number; w: number; h: number; phase: number; label: string; op: number }) {
  if (op <= 0) return null;
  return (
    <g opacity={op}>
      <rect x={x} y={y} width={w} height={h + 22} rx={6} fill="#e8e8e2" />
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={3} fill={colors.BG} />
      <g transform={`translate(${x + w / 2} ${y + h / 2 - 2}) scale(${w / 260}) translate(${-(x + w / 2)} ${-(y + h / 2 - 2)})`}>
        <MiniScene cx={x + w / 2} cy={y + h / 2 - 2} scale={1} phase={phase} />
      </g>
      <text x={x + w / 2} y={y + h + 14} textAnchor="middle" fill="#333" fontSize={10.5} fontFamily={MONO}>
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const browserU = s.get(scene.browserU);
  const urlU = s.get(scene.urlU);
  const playT = s.get(scene.playT);
  const ck = scene.checks.map((c) => s.get(c));
  const browserDim = s.get(scene.browserDim);
  const snapU = s.get(scene.snapU);
  const frozenU = s.get(scene.frozenU);
  const ccGlow = s.get(scene.ccGlow);
  const consoleU = s.get(scene.consoleU);
  const errU = s.get(scene.errU);
  const flashU = s.get(scene.flashU);
  const shotU = s.get(scene.shotU);
  const dimU = s.get(scene.dimU);
  const ringU = s.get(scene.ringU);
  const litU = s.get(scene.litU);

  const worldOp = 1 - 0.88 * dimU;
  const urlShown = URL_TEXT.slice(0, Math.round(clamp01(urlU) * URL_TEXT.length));
  const phase = playT * 2.2; // the orbit keeps moving as the chapter plays

  // screenshot polaroid flight: from viewport center to the previews stack
  const shotX = VIEW.x + VIEW.w / 2 + (STACK.x - VIEW.x - VIEW.w / 2) * shotU;
  const shotY = VIEW.y + VIEW.h / 2 + (STACK.y - VIEW.y - VIEW.h / 2) * shotU;
  const shotScale = 1 - 0.55 * shotU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the headless browser ---- */}
          {browserU > 0 && (
            <g opacity={browserU * (1 - 0.6 * browserDim)}>
              <text x={BROWSER.x} y={BROWSER.y - 12} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                chromium · headless — generator/verify-book.mjs
              </text>
              <rect x={BROWSER.x} y={BROWSER.y} width={BROWSER.w} height={BROWSER.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
              {/* chrome */}
              {[0, 1, 2].map((i) => (
                <circle key={i} cx={BROWSER.x + 22 + i * 18} cy={BROWSER.y + 22} r={5} fill={colors.GRID} />
              ))}
              <rect x={BROWSER.x + 80} y={BROWSER.y + 10} width={BROWSER.w - 100} height={24} rx={12} fill={colors.BG} stroke={colors.GRID} />
              <text x={BROWSER.x + 94} y={BROWSER.y + 26} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                {urlShown}
                {urlU > 0 && urlU < 1 ? '▏' : ''}
              </text>
              {/* viewport: the mini chapter */}
              <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} rx={8} fill={colors.BG} />
              {urlU > 0.7 && (
                <g opacity={clamp01((urlU - 0.7) * 4)}>
                  <MiniScene cx={VIEW.x + VIEW.w / 2} cy={VIEW.y + VIEW.h / 2 - 14} scale={1} phase={phase} />
                  {/* the CC pill — the captions element the gate looks for */}
                  <rect
                    x={VIEW.x + VIEW.w / 2 - 150}
                    y={VIEW.y + VIEW.h - 40}
                    width={300}
                    height={26}
                    rx={13}
                    fill={colors.PANEL}
                    stroke={ccGlow > 0.1 ? colors.WARM : colors.GRID}
                    strokeWidth={ccGlow > 0.1 ? 2 : 1}
                  />
                  <text x={VIEW.x + VIEW.w / 2} y={VIEW.y + VIEW.h - 23} textAnchor="middle" fill={ccGlow > 0.1 ? colors.TEXT : colors.MUTED} fontSize={11}>
                    the voice needs somewhere to land
                  </text>
                </g>
              )}
              {/* seek bar */}
              <rect x={VIEW.x + 12} y={BROWSER.y + BROWSER.h - 26} width={VIEW.w - 24} height={6} rx={3} fill={colors.BG} stroke={colors.GRID} strokeWidth={1} />
              <rect x={VIEW.x + 12} y={BROWSER.y + BROWSER.h - 26} width={(VIEW.w - 24) * clamp01(playT)} height={6} rx={3} fill={colors.ACCENT} />
              <circle cx={VIEW.x + 12 + (VIEW.w - 24) * clamp01(playT)} cy={BROWSER.y + BROWSER.h - 23} r={7} fill={colors.ACCENT} />
              {ck[2] > 0.3 && (
                <text x={VIEW.x + 12 + (VIEW.w - 24) * 0.5} y={BROWSER.y + BROWSER.h - 34} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO} opacity={ck[2]}>
                  seek 50%
                </text>
              )}
              {/* screenshot flash */}
              {flashU > 0 && <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} rx={8} fill="#ffffff" opacity={0.75 * flashU} />}
            </g>
          )}

          {/* ---- the checklist ---- */}
          {browserU > 0 && (
            <g opacity={browserU}>
              <rect x={PANEL_CK.x} y={PANEL_CK.y} width={PANEL_CK.w} height={PANEL_CK.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={PANEL_CK.x + 20} y={PANEL_CK.y + 30} fill={colors.TEXT} fontSize={15} fontWeight={700}>
                the manual QA bar, automated
              </text>
              {CHECKS.map((c, i) => {
                const u = ck[i];
                return (
                  <g key={c.label}>
                    <circle cx={PANEL_CK.x + 30} cy={ckY(i)} r={9} fill={colors.BG} stroke={u > 0.3 ? colors.POSITIVE : colors.GRID} strokeWidth={2} />
                    {u > 0 && (
                      <path
                        d={`M ${PANEL_CK.x + 25.5} ${ckY(i)} l 3.2 3.8 l 6 -7.6`}
                        fill="none"
                        stroke={colors.POSITIVE}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={u}
                      />
                    )}
                    <text x={PANEL_CK.x + 52} y={ckY(i) + 1} fill={u > 0.3 ? colors.TEXT : colors.MUTED} fontSize={13.5} fontWeight={u > 0.3 ? 700 : 400}>
                      {c.label}
                    </text>
                    <text x={PANEL_CK.x + 52} y={ckY(i) + 16} fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={0.85}>
                      {c.detail}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ---- console strip ---- */}
          {consoleU > 0 && (
            <g opacity={consoleU}>
              <rect x={BROWSER.x} y={BROWSER.y + BROWSER.h + 12} width={BROWSER.w} height={34} rx={8} fill={colors.PANEL} stroke={errU > 0.4 ? colors.NEGATIVE : colors.POSITIVE} strokeWidth={1.4} />
              <text x={BROWSER.x + 16} y={BROWSER.y + BROWSER.h + 34} fill={errU > 0.4 ? colors.NEGATIVE : colors.POSITIVE} fontSize={12.5} fontFamily={MONO}>
                {errU > 0.4 ? 'console · Uncaught TypeError: … → the chapter FAILS' : 'console · 0 errors'}
              </text>
            </g>
          )}

          {/* ---- the alive check: two snapshots ---- */}
          {snapU > 0 && (
            <g>
              <Polaroid x={SNAP.ax} y={SNAP.y} w={SNAP.w} h={SNAP.h} phase={PHASE_A} label="t = 42.1s" op={clamp01(snapU * 2)} />
              <Polaroid x={SNAP.bx} y={SNAP.y} w={SNAP.w} h={SNAP.h} phase={PHASE_B} label="t = 42.8s · 700ms later" op={clamp01(snapU * 2 - 0.8)} />
              {snapU > 0.9 && (
                <g opacity={(snapU - 0.9) * 10}>
                  <text x={(SNAP.ax + SNAP.bx + SNAP.w) / 2} y={SNAP.y + SNAP.h / 2} textAnchor="middle" fill={colors.POSITIVE} fontSize={30} fontWeight={700}>
                    ≠
                  </text>
                  <text x={(SNAP.ax + SNAP.bx + SNAP.w) / 2} y={SNAP.y + SNAP.h / 2 + 24} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5}>
                    alive
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---- the frozen counterexample (dimmed inset) ---- */}
          {frozenU > 0 && (
            <g opacity={0.75 * frozenU}>
              <Polaroid x={FROZEN.x} y={FROZEN.y} w={FROZEN.w} h={FROZEN.h} phase={0.3} label="t" op={1} />
              <Polaroid x={FROZEN.x + FROZEN.gap} y={FROZEN.y} w={FROZEN.w} h={FROZEN.h} phase={0.3} label="t + 700ms" op={1} />
              <text x={FROZEN.x + FROZEN.gap - 10} y={FROZEN.y + FROZEN.h / 2 + 4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={22} fontWeight={700}>
                =
              </text>
              <text x={FROZEN.x + FROZEN.gap - 10 + 55} y={FROZEN.y + FROZEN.h + 44} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>
                frozen → FAIL
              </text>
            </g>
          )}

          {/* ---- the screenshot flying to the previews stack ---- */}
          {shotU > 0 && (
            <g>
              {/* the stack that's already there */}
              <g opacity={clamp01(shotU * 2)}>
                <rect x={STACK.x - 44} y={STACK.y - 30} width={84} height={64} rx={5} fill="#d9d9d2" transform={`rotate(-6 ${STACK.x} ${STACK.y})`} />
                <rect x={STACK.x - 40} y={STACK.y - 34} width={84} height={64} rx={5} fill="#e8e8e2" transform={`rotate(4 ${STACK.x} ${STACK.y})`} />
              </g>
              <g transform={`translate(${shotX} ${shotY}) scale(${shotScale}) translate(${-shotX} ${-shotY})`}>
                <Polaroid x={shotX - 60} y={shotY - 45} w={120} h={86} phase={phase} label="chapter-4.png" op={1} />
              </g>
              {shotU > 0.9 && (
                <text x={STACK.x} y={STACK.y + 62} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={(shotU - 0.9) * 10}>
                  previews/ · ships with the PR
                </text>
              )}
            </g>
          )}
        </g>

        {/* ---- ring finale ---- */}
        <ProgressRing ringU={ringU} lit={4} litU={litU} />
        {litU > 0 && (
          <text x={RING.cx} y={RING.cy + 8} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic" opacity={litU}>
            proven to play
          </text>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
