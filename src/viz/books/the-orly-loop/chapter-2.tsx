// Captions Are the Script
//
// Backed by: .claude/commands/new-book.md (step 3 — plan the visualizations
// before any code), generator/prompts/storyboard.txt (visualizations first,
// captions are the narration), src/viz core Timeline (channels + tweens +
// tl.caption), generator/scene-captions.mjs (esbuild-bundle the scene, read
// tl.describe().captions — the ordered script — without mounting React), and
// the src/viz/scenes.ts books/*/*.tsx auto-registration glob.
//
// The centerpiece is self-referential: a tiny editor — mini-stage on top,
// timeline with channel rows + a caption row below — whose playhead visibly
// drives the stage as a pure function of time. The captions lift out of the
// timeline into the ordered script the generator extracts.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { ProgressRing, RING } from './ring';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — 1280×720; captions own the bottom ~12% (y ≳ 633).
// ---------------------------------------------------------------------------

/** The digest: real files funneling into one panel. */
const DIGEST_FILES = [
  '.github/workflows/new-book.yml',
  'generator/video.mjs',
  'generator/tts.mjs',
  'generator/verify-book.mjs',
  'src/viz/core/timeline.ts',
];
const DIGEST = { x: 760, y: 150, w: 330, h: 250 } as const;

/** The five plan cards — one visual idea per chapter. */
const PLAN_CARDS = [
  { title: 'Ch 1', idea: 'a form meets a gate', glyph: 'form' },
  { title: 'Ch 2', idea: 'an editor explains itself', glyph: 'timeline' },
  { title: 'Ch 3', idea: 'captions run a gauntlet', glyph: 'wave' },
  { title: 'Ch 4', idea: 'a browser demands proof', glyph: 'browser' },
  { title: 'Ch 5', idea: 'the ring closes', glyph: 'ring' },
];
const CARD = { w: 196, h: 110, y: 120, gap: 16 };
const cardX = (i: number) => 640 + (i - 2) * (CARD.w + CARD.gap);

/** The mini-stage (top) and the timeline editor (bottom). */
const STAGE = { x: 360, y: 64, w: 560, h: 240 } as const;
const ED = { x: 140, y: 330, w: 1000, h: 268 } as const;
const ED_SECS = 8; // the little scene is 8 "seconds" long
const tx = (t: number) => ED.x + 46 + (t / ED_SECS) * (ED.w - 92);

interface EdRow {
  name: string;
  y: number;
  from: number;
  to: number;
  color: string;
}
const ROWS: EdRow[] = [
  { name: 'cam', y: 402, from: 0.5, to: 2.0, color: colors.ACCENT },
  { name: 'dotU', y: 446, from: 1.0, to: 6.5, color: colors.SECONDARY },
  { name: 'barU', y: 490, from: 2.0, to: 7.0, color: colors.POSITIVE },
];
const CAP_ROW_Y = 546;
/** The mini-scene's own captions — full spoken sentences, at their moments. */
const MINI_CAPS = [
  { from: 0.3, to: 2.4, text: 'A dot sets out along the arc.' },
  { from: 2.9, to: 5.2, text: 'A bar counts what it covers.' },
  { from: 5.7, to: 7.8, text: 'Same time, same frame.' },
];

/** Script panel the captions lift into (the extracted narration). */
const SCRIPT = { x: 928, y: 78, w: 318, h: 222 } as const;

/** Mini-scene geometry: a quadratic arc + a counting bar. */
const ARC_A = { x: 408, y: 258 };
const ARC_C = { x: 620, y: 96 };
const ARC_B = { x: 848, y: 156 };
const arcPt = (u: number) => {
  const q = 1 - u;
  return {
    x: q * q * ARC_A.x + 2 * q * u * ARC_C.x + u * u * ARC_B.x,
    y: q * q * ARC_A.y + 2 * q * u * ARC_C.y + u * u * ARC_B.y,
  };
};
const BAR = { x: 884, base: 262, w: 16, maxH: 132 };

// the mini-scene's channel values, all pure functions of the playhead second
const rowU = (row: EdRow, p: number) => clamp01((p - row.from) / (row.to - row.from));

// camera marks
const CAM_CARDS: CameraState = { x: 640, y: 200, k: 1.35 };
const CAM_EDITOR: CameraState = { x: 640, y: 350, k: 1.12 };
const CAM_ROWS: CameraState = { x: 640, y: 452, k: 1.5 };
const CAM_CAPS: CameraState = { x: 640, y: 500, k: 1.55 };
const CAM_DIGEST: CameraState = { x: 760, y: 280, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  filesU: ChannelRef<number>;
  digestU: ChannelRef<number>;
  cardsU: ChannelRef<number>;
  focusCard: ChannelRef<number>;
  edU: ChannelRef<number>;
  rowsU: ChannelRef<number>;
  playhead: ChannelRef<number>;
  capGlow: ChannelRef<number>;
  trickU: ChannelRef<number>;
  liftU: ChannelRef<number>;
  stageDim: ChannelRef<number>;
  winkU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  ringU: ChannelRef<number>;
  litU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const filesU = tl.channel('filesU', 0);
  const digestU = tl.channel('digestU', 0);
  const cardsU = tl.channel('cardsU', 0);
  const focusCard = tl.channel('focusCard', 0); // 0 = all, 1 = card 2 focused
  const edU = tl.channel('edU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const playhead = tl.channel('playhead', 0); // seconds 0..8 of the mini scene
  const capGlow = tl.channel('capGlow', 0);
  const trickU = tl.channel('trickU', 0);
  const liftU = tl.channel('liftU', 0);
  const stageDim = tl.channel('stageDim', 0);
  const winkU = tl.channel('winkU', 0);
  const dimU = tl.channel('dimU', 0);
  const ringU = tl.channel('ringU', 0);
  const litU = tl.channel('litU', 0);

  // — Beat 1 · the digest —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'Inside that run, Claude Code starts by reading the target repository — real files, real names. Everything the book will claim has to trace back to them.',
  });
  tl.tween(cam, CAM_DIGEST, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(filesU, 1, { at: 0.8, dur: 3.2, ease: ease.linear });
  tl.tween(digestU, 1, { at: 3.6, dur: 1.2, ease: ease.draw });

  // — Beat 2 · plan the pictures first —
  tl.caption({
    at: 8.0,
    dur: 7,
    text: 'Then, before any code, the rule this shelf lives by: plan the pictures first. Each chapter gets one visual idea — a machine you can watch working.',
  });
  tl.tween(digestU, 0.12, { at: 8.2, dur: 0.9, ease: ease.move });
  tl.tween(filesU, 0, { at: 8.2, dur: 0.9, ease: ease.move });
  tl.tween(cam, CAM_CARDS, { at: 8.3, dur: 1.3, ease: ease.move });
  tl.tween(cardsU, 1, { at: 8.8, dur: 2.6, ease: ease.draw });
  tl.hold(15.0, 0.6);

  // — Beat 3 · this chapter's card —
  tl.caption({
    at: 15.6,
    dur: 6.5,
    text: 'This chapter drew the strangest card of the five: build a tiny editor, and let it explain itself. A stage on top, a timeline underneath.',
  });
  tl.tween(focusCard, 1, { at: 15.8, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_EDITOR, { at: 17.2, dur: 1.5, ease: ease.move });
  tl.tween(cardsU, 0, { at: 17.4, dur: 0.9, ease: ease.move });
  tl.tween(digestU, 0, { at: 17.4, dur: 0.6, ease: ease.move });
  tl.tween(edU, 1, { at: 18.2, dur: 1.4, ease: ease.draw });

  // — Beat 4 · channels and tweens —
  tl.caption({
    at: 22.4,
    dur: 7,
    text: 'A scene is just channels — named values that change over time. Each colored bar is a tween: take this value from here to there, with this easing.',
  });
  tl.tween(cam, CAM_ROWS, { at: 22.6, dur: 1.4, ease: ease.move });
  tl.tween(rowsU, 1, { at: 23.2, dur: 2.4, ease: ease.draw });
  tl.hold(29.4, 0.6);

  // — Beat 5 · the stage is a pure function —
  tl.caption({
    at: 30.0,
    dur: 7,
    text: 'The stage never keeps secrets between frames. Ask for any moment and it computes that picture from scratch — sample the time, draw the values.',
  });
  tl.tween(cam, CAM_EDITOR, { at: 30.2, dur: 1.4, ease: ease.move });
  tl.tween(playhead, 4.6, { at: 31.0, dur: 5.2, ease: ease.linear });

  // — Beat 6 · scrub anywhere —
  tl.caption({
    at: 37.4,
    dur: 6.5,
    text: 'Which means you can scrub anywhere. Jump back, jump forward — the same time always gives back the exact same picture.',
  });
  tl.tween(playhead, 7.4, { at: 38.0, dur: 1.1, ease: ease.move });
  tl.tween(playhead, 1.6, { at: 39.7, dur: 1.2, ease: ease.move });
  tl.tween(playhead, 4.9, { at: 41.5, dur: 1.1, ease: ease.move });
  tl.hold(43.9, 0.6);

  // — Beat 7 · the caption row —
  tl.caption({
    at: 44.5,
    dur: 6.5,
    text: 'Now the bottom row. Those blocks are captions — and each one is a full spoken sentence, sitting at the exact moment it should be heard.',
  });
  tl.tween(cam, CAM_CAPS, { at: 44.7, dur: 1.4, ease: ease.move });
  tl.tween(capGlow, 1, { at: 45.4, dur: 1.0, ease: ease.enter });
  tl.hold(51.0, 0.6);

  // — Beat 8 · the trick —
  tl.caption({
    at: 51.6,
    dur: 6,
    text: 'And here is the trick that holds the whole pipeline together: those captions are the narration script. There is no second copy to keep in sync.',
  });
  tl.tween(trickU, 1, { at: 52.2, dur: 0.8, ease: ease.pop });

  // — Beat 9 · extraction —
  tl.caption({
    at: 58.0,
    dur: 7.5,
    text: 'The generator never opens the app. It bundles the scene, reads its timeline, and lifts the captions out in order — that ordered list is the script.',
  });
  tl.tween(cam, CAM_EDITOR, { at: 58.2, dur: 1.4, ease: ease.move });
  tl.tween(stageDim, 1, { at: 58.4, dur: 1.0, ease: ease.move });
  tl.tween(liftU, 1, { at: 59.4, dur: 3.4, ease: ease.move });

  // — Beat 10 · the wink + station two —
  tl.caption({
    at: 66.0,
    dur: 7.5,
    text: 'And yes — the scene you are watching right now is one of those files, written the same way, extracted the same way. Station two lights up.',
  });
  tl.tween(dimU, 1, { at: 66.4, dur: 1.2, ease: ease.move });
  tl.tween(winkU, 1, { at: 66.8, dur: 0.8, ease: ease.enter });
  tl.tween(ringU, 1, { at: 68.4, dur: 1.8, ease: ease.draw });
  tl.tween(litU, 1, { at: 70.6, dur: 0.8, ease: ease.pop });
  tl.hold(73.5, 1.5);

  return {
    tl, cam, filesU, digestU, cardsU, focusCard, edU, rowsU, playhead,
    capGlow, trickU, liftU, stageDim, winkU, dimU, ringU, litU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function CardGlyph({ kind, cx, cy }: { kind: string; cx: number; cy: number }) {
  const c = colors.ACCENT;
  switch (kind) {
    case 'form':
      return (
        <g stroke={c} strokeWidth={1.6} fill="none">
          <rect x={cx - 14} y={cy - 12} width={28} height={24} rx={3} />
          <line x1={cx - 8} y1={cy - 4} x2={cx + 8} y2={cy - 4} />
          <line x1={cx - 8} y1={cy + 2} x2={cx + 8} y2={cy + 2} />
        </g>
      );
    case 'timeline':
      return (
        <g strokeWidth={0} fill={c}>
          <rect x={cx - 14} y={cy - 8} width={16} height={4} rx={2} />
          <rect x={cx - 8} y={cy - 1} width={20} height={4} rx={2} />
          <rect x={cx - 12} y={cy + 6} width={12} height={4} rx={2} />
        </g>
      );
    case 'wave': {
      const d = Array.from({ length: 24 }, (_, i) => {
        const x = cx - 14 + (i / 23) * 28;
        const y = cy + Math.sin(i * 0.9) * 8;
        return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join('');
      return <path d={d} stroke={c} strokeWidth={1.6} fill="none" />;
    }
    case 'browser':
      return (
        <g stroke={c} strokeWidth={1.6} fill="none">
          <rect x={cx - 15} y={cy - 11} width={30} height={22} rx={3} />
          <line x1={cx - 15} y1={cy - 4} x2={cx + 15} y2={cy - 4} />
          <path d={`M ${cx - 4} ${cy} l 8 4 l -8 4 z`} fill={c} strokeWidth={0} />
        </g>
      );
    default:
      return <circle cx={cx} cy={cy} r={11} stroke={c} strokeWidth={1.6} fill="none" />;
  }
}

/** Partial arc polyline up to u. */
function arcD(u: number): string {
  const n = Math.max(2, Math.ceil(clamp01(u) * 40));
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const p = arcPt((i / (n - 1)) * clamp01(u));
    parts.push(`${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return parts.join('');
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const filesU = s.get(scene.filesU);
  const digestU = s.get(scene.digestU);
  const cardsU = s.get(scene.cardsU);
  const focusCard = s.get(scene.focusCard);
  const edU = s.get(scene.edU);
  const rowsU = s.get(scene.rowsU);
  const p = s.get(scene.playhead);
  const capGlow = s.get(scene.capGlow);
  const trickU = s.get(scene.trickU);
  const liftU = s.get(scene.liftU);
  const stageDim = s.get(scene.stageDim);
  const winkU = s.get(scene.winkU);
  const dimU = s.get(scene.dimU);
  const ringU = s.get(scene.ringU);
  const litU = s.get(scene.litU);

  const worldOp = 1 - 0.88 * dimU;
  const dotU = rowU(ROWS[1], p);
  const barU = rowU(ROWS[2], p);
  const camU = rowU(ROWS[0], p);
  const dot = arcPt(dotU);
  const miniScale = 1 + 0.05 * camU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- beat 1: files → digest ---- */}
          {(filesU > 0 || digestU > 0.14) && (
            <g>
              {DIGEST_FILES.map((f, i) => {
                const u = clamp01(filesU * (DIGEST_FILES.length + 1.5) - i);
                if (u <= 0) return null;
                const x0 = 240;
                const y0 = 140 + i * 56;
                const x1 = DIGEST.x + 30;
                const y1 = DIGEST.y + 60 + i * 30;
                return (
                  <g key={f} opacity={Math.min(1, u * 2) * (filesU > 0 ? 1 : 0)}>
                    <rect
                      x={x0 + (x1 - x0) * u - 6}
                      y={y0 + (y1 - y0) * u - 13}
                      width={300}
                      height={24}
                      rx={6}
                      fill={colors.PANEL}
                      stroke={colors.GRID}
                    />
                    <text x={x0 + (x1 - x0) * u + 6} y={y0 + (y1 - y0) * u + 4} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                      {f}
                    </text>
                  </g>
                );
              })}
              {digestU > 0 && (
                <g opacity={digestU}>
                  <rect x={DIGEST.x} y={DIGEST.y} width={DIGEST.w} height={DIGEST.h} rx={14} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
                  <text x={DIGEST.x + 18} y={DIGEST.y + 30} fill={colors.TEXT} fontSize={14} fontWeight={700}>
                    the digest
                  </text>
                  <text x={DIGEST.x + DIGEST.w - 18} y={DIGEST.y + 30} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                    31 files · 57k chars
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---- beat 2: the plan cards ---- */}
          {cardsU > 0 && (
            <g>
              {PLAN_CARDS.map((c, i) => {
                const u = clamp01(cardsU * (PLAN_CARDS.length + 2) - (i + 2));
                if (u <= 0) return null;
                const focused = i === 1;
                const op = u * (focusCard > 0 ? (focused ? 1 : 0.18) : 1);
                const x = cardX(i) - CARD.w / 2;
                return (
                  <g key={c.title} opacity={op} transform={`translate(0 ${(1 - u) * 18})`}>
                    <rect x={x} y={CARD.y} width={CARD.w} height={CARD.h} rx={12} fill={colors.PANEL} stroke={focused && focusCard > 0.3 ? colors.ACCENT : colors.GRID} strokeWidth={focused && focusCard > 0.3 ? 1.8 : 1} />
                    <text x={x + 14} y={CARD.y + 24} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                      {c.title}
                    </text>
                    <CardGlyph kind={c.glyph} cx={x + CARD.w / 2} cy={CARD.y + 52} />
                    <text x={x + CARD.w / 2} y={CARD.y + 92} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
                      {c.idea}
                    </text>
                  </g>
                );
              })}
              {cardsU > 0.8 && focusCard < 0.3 && (
                <text x={640} y={CARD.y + CARD.h + 34} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic" opacity={(cardsU - 0.8) * 5}>
                  one visual idea per chapter — before any code
                </text>
              )}
            </g>
          )}

          {/* ---- the editor: mini-stage ---- */}
          {edU > 0 && (
            <g opacity={edU * (1 - 0.85 * stageDim)}>
              <rect x={STAGE.x} y={STAGE.y} width={STAGE.w} height={STAGE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={STAGE.x + 14} y={STAGE.y + 24} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                stage — a pure function of t
              </text>
              <g transform={`translate(${STAGE.x + STAGE.w / 2} ${STAGE.y + STAGE.h / 2}) scale(${miniScale}) translate(${-(STAGE.x + STAGE.w / 2)} ${-(STAGE.y + STAGE.h / 2)})`}>
                {/* full arc, faint; covered part bright */}
                <path d={arcD(1)} fill="none" stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="3 6" />
                <path d={arcD(dotU)} fill="none" stroke={colors.SECONDARY} strokeWidth={2.2} />
                {dotU > 0 && (
                  <g>
                    <circle cx={dot.x} cy={dot.y} r={12} fill={colors.SECONDARY} opacity={0.2} />
                    <circle cx={dot.x} cy={dot.y} r={6.5} fill={colors.SECONDARY} />
                  </g>
                )}
                {/* the counting bar */}
                <rect x={BAR.x} y={BAR.base - BAR.maxH * barU} width={BAR.w} height={BAR.maxH * barU} rx={4} fill={colors.POSITIVE} opacity={0.9} />
                <line x1={BAR.x - 6} y1={BAR.base} x2={BAR.x + BAR.w + 6} y2={BAR.base} stroke={colors.GRID} strokeWidth={1.5} />
              </g>
            </g>
          )}

          {/* ---- the editor: timeline panel ---- */}
          {edU > 0 && (
            <g opacity={edU}>
              <rect x={ED.x} y={ED.y} width={ED.w} height={ED.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              {/* time axis */}
              {Array.from({ length: ED_SECS + 1 }, (_, t) => (
                <g key={t} opacity={0.85}>
                  <line x1={tx(t)} y1={ED.y + 28} x2={tx(t)} y2={ED.y + 34} stroke={colors.GRID} strokeWidth={1.5} />
                  <text x={tx(t)} y={ED.y + 22} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                    {t}s
                  </text>
                </g>
              ))}
              {/* channel rows */}
              {ROWS.map((r, i) => {
                const u = clamp01(rowsU * (ROWS.length + 1.5) - i);
                return (
                  <g key={r.name} opacity={u}>
                    <text x={ED.x + 38} y={r.y + 5} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                      {r.name}
                    </text>
                    <line x1={tx(0)} y1={r.y} x2={tx(ED_SECS)} y2={r.y} stroke={colors.GRID} strokeWidth={1} opacity={0.5} />
                    <rect x={tx(r.from)} y={r.y - 8} width={(tx(r.to) - tx(r.from)) * u} height={16} rx={8} fill={r.color} opacity={0.75} />
                  </g>
                );
              })}
              {rowsU > 0.9 && (
                <text x={tx(ROWS[1].from) + 8} y={ROWS[1].y - 14} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={(rowsU - 0.9) * 10}>
                  tl.tween(dotU, 1, ...)
                </text>
              )}
              {/* caption row */}
              <text x={ED.x + 38} y={CAP_ROW_Y + 5} textAnchor="end" fill={capGlow > 0.3 ? colors.WARM : colors.MUTED} fontSize={12} fontFamily={MONO} fontWeight={capGlow > 0.3 ? 700 : 400}>
                caption
              </text>
              {MINI_CAPS.map((c, i) => {
                const lift = clamp01(liftU * (MINI_CAPS.length + 1) - i);
                const x0 = tx(c.from);
                const w0 = tx(c.to) - tx(c.from);
                const y0 = CAP_ROW_Y - 11;
                // script slot destination
                const x1 = SCRIPT.x + 16;
                const y1 = SCRIPT.y + 56 + i * 48;
                const x = x0 + (x1 - x0) * lift;
                const y = y0 + (y1 - y0) * lift;
                const w = w0 + (SCRIPT.w - 32 - w0) * lift;
                const active = p >= c.from && p <= c.to;
                const glow = capGlow > 0 && active && lift === 0;
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={22}
                      rx={7}
                      fill={lift > 0.5 ? colors.BG : colors.PANEL}
                      stroke={glow || trickU > 0.3 ? colors.WARM : colors.GRID}
                      strokeWidth={glow || trickU > 0.3 ? 1.8 : 1}
                    />
                    <text x={x + 8} y={y + 15} fill={colors.TEXT} fontSize={10.5} opacity={0.95} clipPath={undefined}>
                      {lift > 0.5 ? `${i + 1}. ${c.text}` : c.text.length > w0 / 6.2 ? c.text.slice(0, Math.max(3, Math.floor(w0 / 6.2))) + '…' : c.text}
                    </text>
                  </g>
                );
              })}
              {/* playhead */}
              <g>
                <line x1={tx(p)} y1={ED.y + 30} x2={tx(p)} y2={ED.y + ED.h - 22} stroke={colors.WARM} strokeWidth={2} />
                <path d={`M ${tx(p) - 6} ${ED.y + 30} l 12 0 l -6 9 z`} fill={colors.WARM} />
                <text x={tx(p)} y={ED.y + ED.h - 6} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
                  t={p.toFixed(1)}s
                </text>
              </g>
              {trickU > 0 && (
                <text x={640} y={ED.y - 12} textAnchor="middle" fill={colors.WARM} fontSize={15} fontWeight={700} opacity={trickU}>
                  the captions ARE the narration script
                </text>
              )}
            </g>
          )}

          {/* ---- the extracted script panel ---- */}
          {liftU > 0.1 && (
            <g opacity={clamp01(liftU * 2)}>
              <rect x={SCRIPT.x} y={SCRIPT.y} width={SCRIPT.w} height={SCRIPT.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
              <text x={SCRIPT.x + 16} y={SCRIPT.y + 28} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
                the script — in order
              </text>
              <text x={SCRIPT.x + 16} y={SCRIPT.y + SCRIPT.h - 14} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                tl.describe().captions · scene-captions.mjs
              </text>
            </g>
          )}
        </g>

        {/* ---- the wink + ring finale ---- */}
        {winkU > 0 && (
          <g opacity={winkU * (1 - clamp01(ringU) * 0.0)}>
            <rect x={640 - 240} y={84} width={480} height={40} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
            <text x={640} y={109} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
              src/viz/books/the-orly-loop/chapter-2.tsx
            </text>
          </g>
        )}
        <ProgressRing ringU={ringU} lit={2} litU={litU} />
        {litU > 0 && (
          <text x={RING.cx} y={RING.cy + 8} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic" opacity={litU}>
            the scenes are written
          </text>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
