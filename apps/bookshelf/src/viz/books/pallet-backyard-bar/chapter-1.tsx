// Choose the Pallet, Skip the Cut
//
// Backing source: Lee Valley, "Make a Backyard Bar Using Pallets" — the front
// of the bar is a single reclaimed pallet in excellent condition, about 47 in
// long, with wide 6 in cross boards, standing 40 in tall so bar stools fit
// under the top. It was "sanded lightly - just enough so no one would get
// splinters", and the build deliberately avoids cuts by choosing pallets well.
//
// Centerpiece: four salvage candidates hung side by side like specimens. A
// spec card drops in, and one by one the candidates are measured against it
// and struck out, until the survivor tips up off the ground into the bar face.
import {
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
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Salvage geometry. 1 in = 5.2 px.
// ---------------------------------------------------------------------------

const IN = 5.2;
const WOOD = '#7d5a34';
const WOOD_LIT = '#a3763f';

interface Candidate {
  id: string;
  lengthIn: number; // long dimension — the width of the bar face
  heightIn: number; // short dimension — the standing height
  boardIn: number; // cross board width
  split: number[]; // indices of cracked boards
  verdict: string;
  cx: number;
  cy: number;
}

// Four candidates off the same salvage pile. Only one clears every line of the
// spec: long enough, tall enough, wide cross boards, nothing broken.
const CANDIDATES: Candidate[] = [
  { id: 'A', lengthIn: 40, heightIn: 32, boardIn: 4, split: [], verdict: 'too short · 40 in', cx: 350, cy: 236 },
  { id: 'B', lengthIn: 48, heightIn: 40, boardIn: 6, split: [1, 4], verdict: 'cracked boards', cx: 930, cy: 236 },
  { id: 'C', lengthIn: 47, heightIn: 40, boardIn: 6, split: [], verdict: 'the one', cx: 350, cy: 508 },
  { id: 'D', lengthIn: 47, heightIn: 40, boardIn: 3.5, split: [], verdict: 'narrow boards · 3.5 in', cx: 930, cy: 508 },
];
const WINNER = 2;

// A pallet face: cross boards stacked up the height with a gap between each,
// three stringers running vertically behind them.
interface Board {
  y: number;
  h: number;
  splitAt: number | null;
}
function boardsOf(c: Candidate): Board[] {
  const gap = 1.6 * IN;
  const bh = c.boardIn * IN;
  const total = c.heightIn * IN;
  const n = Math.max(3, Math.round((total + gap) / (bh + gap)));
  const used = n * bh + (n - 1) * gap;
  const top = -total / 2 + (total - used) / 2;
  const rand = mulberry32(1971 + c.id.charCodeAt(0));
  return Array.from({ length: n }, (_, i) => ({
    y: top + i * (bh + gap),
    h: bh,
    splitAt: c.split.includes(i) ? lerp(0.3, 0.7, rand()) : null,
  }));
}
const BOARDS: Board[][] = CANDIDATES.map(boardsOf);

// Splinters on the survivor's face — sanded away in the last act.
const srand = mulberry32(90210);
const SPLINTERS = Array.from({ length: 26 }, () => ({
  u: srand(),
  b: Math.floor(srand() * BOARDS[WINNER].length),
  len: 5 + srand() * 9,
  tilt: (srand() - 0.5) * 1.1,
}));

// The survivor tips up out of the pile. Its face is drawn through a bilinear
// map between a foreshortened "lying flat" quad and the upright elevation, so
// every board rides the same tipping motion.
type Pt = { x: number; y: number };
type Quad = [Pt, Pt, Pt, Pt]; // TL, TR, BR, BL
const HERO_X = 610;
const HERO_Y = 400;
const HERO_W = CANDIDATES[WINNER].lengthIn * IN;
const HERO_H = CANDIDATES[WINNER].heightIn * IN;
const FLAT: Quad = [
  { x: HERO_X - HERO_W * 0.34, y: HERO_Y + HERO_H / 2 - 30 },
  { x: HERO_X + HERO_W * 0.34, y: HERO_Y + HERO_H / 2 - 30 },
  { x: HERO_X + HERO_W * 0.5, y: HERO_Y + HERO_H / 2 },
  { x: HERO_X - HERO_W * 0.5, y: HERO_Y + HERO_H / 2 },
];
const UP: Quad = [
  { x: HERO_X - HERO_W / 2, y: HERO_Y - HERO_H / 2 },
  { x: HERO_X + HERO_W / 2, y: HERO_Y - HERO_H / 2 },
  { x: HERO_X + HERO_W / 2, y: HERO_Y + HERO_H / 2 },
  { x: HERO_X - HERO_W / 2, y: HERO_Y + HERO_H / 2 },
];
const quadAt = (u: number): Quad =>
  FLAT.map((p, i) => ({ x: lerp(p.x, UP[i].x, u), y: lerp(p.y, UP[i].y, u) })) as Quad;
// bilinear: (a, b) in 0..1 across the quad
const onQuad = (q: Quad, a: number, b: number): Pt => ({
  x: lerp(lerp(q[0].x, q[1].x, a), lerp(q[3].x, q[2].x, a), b),
  y: lerp(lerp(q[0].y, q[1].y, a), lerp(q[3].y, q[2].y, a), b),
});

const SPEC = { x: 470, y: 96, w: 340, h: 150 } as const;
const SPEC_LINES = ['≈ 47 in long', '40 in tall', '6 in cross boards', 'no broken boards'];

const CAM_WIDE: CameraState = { x: 640, y: 372, k: 1.0 };
const CAM_HERO: CameraState = { x: 610, y: 396, k: 1.3 };
const camOn = (i: number): CameraState => ({ x: CANDIDATES[i].cx, y: CANDIDATES[i].cy, k: 1.45 });

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pileU: ChannelRef<number>;
  specU: ChannelRef<number>;
  ruleU: ChannelRef<number>;
  strikeA: ChannelRef<number>;
  strikeB: ChannelRef<number>;
  strikeD: ChannelRef<number>;
  crownU: ChannelRef<number>;
  othersDim: ChannelRef<number>;
  heroU: ChannelRef<number>;
  sawU: ChannelRef<number>;
  splinterU: ChannelRef<number>;
  sandU: ChannelRef<number>;
  standU: ChannelRef<number>;
  stoolU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const pileU = tl.channel('pileU', 0);
  const specU = tl.channel('specU', 0);
  const ruleU = tl.channel('ruleU', 0);
  const strikeA = tl.channel('strikeA', 0);
  const strikeB = tl.channel('strikeB', 0);
  const strikeD = tl.channel('strikeD', 0);
  const crownU = tl.channel('crownU', 0);
  const othersDim = tl.channel('othersDim', 1);
  const heroU = tl.channel('heroU', 0);
  const sawU = tl.channel('sawU', 0);
  const splinterU = tl.channel('splinterU', 0);
  const sandU = tl.channel('sandU', 0);
  const standU = tl.channel('standU', 0);
  const stoolU = tl.channel('stoolU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the pile —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'A backyard bar is one of those projects that looks like carpentry and is really just shopping. Almost all of this one is reclaimed pallets, and the whole build turns on which pallets you pick.',
  });
  tl.tween(pileU, 1, { at: 0.6, dur: 2.0, ease: ease.enter });
  tl.hold(7.1, 0.6);

  // — Beat 2 · the spec —
  tl.caption({
    at: 7.7,
    dur: 6.4,
    text: 'So start with a specification instead of a saw. The front of the bar wants a pallet about forty-seven inches long, forty inches tall, with wide six-inch cross boards, and not a single broken one.',
  });
  tl.tween(specU, 1, { at: 8.0, dur: 0.8, ease: ease.enter });
  tl.tween(ruleU, 1, { at: 9.2, dur: 2.0, ease: ease.draw });
  tl.hold(14.1, 0.6);

  // — Beat 3 · too short —
  tl.caption({
    at: 14.7,
    dur: 5.6,
    text: 'This one is forty inches end to end and thirty-two tall. Build the bar from it and you are leaning down to your drink. Put it back on the pile.',
  });
  tl.tween(cam, camOn(0), { at: 14.9, dur: 1.4, ease: ease.move });
  tl.tween(strikeA, 1, { at: 17.2, dur: 0.9, ease: ease.draw });
  tl.hold(20.3, 0.5);

  // — Beat 4 · cracked —
  tl.caption({
    at: 20.8,
    dur: 5.8,
    text: 'This one is the right size, but two of its boards are split. A pallet that has already failed once under a forklift is not the thing to lean your elbows on.',
  });
  tl.tween(cam, camOn(1), { at: 21.0, dur: 1.5, ease: ease.move });
  tl.tween(strikeB, 1, { at: 23.6, dur: 0.9, ease: ease.draw });
  tl.hold(26.6, 0.5);

  // — Beat 5 · narrow boards —
  tl.caption({
    at: 27.1,
    dur: 5.8,
    text: 'And this one measures up perfectly, but its cross boards are barely three and a half inches wide. More gaps than face, and nowhere solid to drive a screw later on.',
  });
  tl.tween(cam, camOn(3), { at: 27.3, dur: 1.5, ease: ease.move });
  tl.tween(strikeD, 1, { at: 29.9, dur: 0.9, ease: ease.draw });
  tl.hold(32.9, 0.5);

  // — Beat 6 · the survivor —
  tl.caption({
    at: 33.4,
    dur: 6.2,
    text: 'Which leaves one. Forty-seven inches of clean six-inch boards, in excellent condition. Everything else in this build is measured against the pallet you just found.',
  });
  tl.tween(cam, camOn(WINNER), { at: 33.6, dur: 1.5, ease: ease.move });
  tl.tween(crownU, 1, { at: 35.4, dur: 1.6, ease: ease.move });
  tl.hold(39.6, 0.6);

  // — Beat 7 · the cut you never make —
  tl.caption({
    at: 40.2,
    dur: 6.4,
    text: 'And notice what just happened. By choosing carefully rather than settling, the entire front of the bar needs no cutting at all. Patience at the salvage pile is time you never spend at the saw.',
  });
  tl.tween(othersDim, 0.12, { at: 40.4, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_HERO, { at: 40.6, dur: 1.6, ease: ease.move });
  tl.tween(heroU, 1, { at: 41.4, dur: 1.2, ease: ease.enter });
  tl.tween(sawU, 1, { at: 43.6, dur: 0.9, ease: ease.pop });
  tl.hold(46.6, 0.6);

  // — Beat 8 · sanding —
  tl.caption({
    at: 47.2,
    dur: 6.2,
    text: 'It gets sanded, but only lightly — just enough that nobody picks up a splinter. This is reclaimed wood, and the grey, dented, well-travelled look is the entire point.',
  });
  tl.tween(sawU, 0, { at: 47.4, dur: 0.5, ease: ease.move });
  tl.tween(splinterU, 1, { at: 47.6, dur: 0.7, ease: ease.enter });
  tl.tween(sandU, 1, { at: 49.2, dur: 2.6, ease: ease.linear });
  tl.hold(53.4, 0.6);

  // — Beat 9 · stand it up —
  tl.caption({
    at: 54.0,
    dur: 6.4,
    text: 'Then it comes off the ground and stands on its long edge. Forty inches of height is not an arbitrary number: it is the gap that a bar stool needs to slide underneath.',
  });
  tl.tween(standU, 1, { at: 54.4, dur: 1.8, ease: ease.move });
  tl.tween(stoolU, 1, { at: 56.8, dur: 1.0, ease: ease.enter });
  tl.tween(dimU, 1, { at: 57.8, dur: 1.1, ease: ease.draw });
  tl.hold(60.4, 0.6);

  // — Beat 10 · close —
  tl.caption({
    at: 61.0,
    dur: 6.0,
    text: 'One pallet, standing up, is now the face of the bar. Everything from here is a matter of giving it two sides and a top.',
  });
  tl.tween(specU, 0, { at: 61.2, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 61.2, dur: 1.6, ease: ease.move });
  tl.tween(closeU, 1, { at: 62.4, dur: 0.9, ease: ease.enter });
  tl.hold(67.0, 1.6);

  return {
    tl,
    cam,
    pileU,
    specU,
    ruleU,
    strikeA,
    strikeB,
    strikeD,
    crownU,
    othersDim,
    heroU,
    sawU,
    splinterU,
    sandU,
    standU,
    stoolU,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function PalletFace({
  c,
  boards,
  u,
  lit,
}: {
  c: Candidate;
  boards: Board[];
  u: number;
  lit: number;
}) {
  if (u <= 0) return null;
  const w = c.lengthIn * IN;
  const rise = (1 - u) * 26;
  return (
    <g opacity={u} transform={`translate(${c.cx}, ${c.cy + rise})`}>
      {/* stringers behind */}
      {[-w / 2 + 6, -6, w / 2 - 18].map((x, i) => (
        <rect
          key={i}
          x={x}
          y={-c.heightIn * IN * 0.5}
          width={12}
          height={c.heightIn * IN}
          fill="#4a3722"
          opacity={0.85}
        />
      ))}
      {boards.map((b, i) => (
        <g key={i}>
          <rect
            x={-w / 2}
            y={b.y}
            width={w}
            height={b.h}
            rx={1.5}
            fill={lit > 0 ? WOOD_LIT : WOOD}
            stroke="#2a1f13"
            strokeWidth={1}
          />
          {b.splitAt !== null && (
            <path
              d={`M ${-w / 2 + w * b.splitAt} ${b.y} l 6 ${b.h * 0.45} l -9 ${b.h * 0.55}`}
              fill="none"
              stroke={colors.NEGATIVE}
              strokeWidth={2.2}
            />
          )}
        </g>
      ))}
    </g>
  );
}

function Strike({ c, u, label }: { c: Candidate; u: number; label: string }) {
  if (u <= 0) return null;
  const w = c.lengthIn * IN;
  const h = c.heightIn * IN;
  return (
    <g opacity={u}>
      <line
        x1={c.cx - w / 2}
        y1={c.cy - h / 2}
        x2={c.cx + w / 2}
        y2={c.cy + h / 2}
        stroke={colors.NEGATIVE}
        strokeWidth={3.5}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - u}
      />
      <text x={c.cx} y={c.cy + h / 2 + 26} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pileU = s.get(scene.pileU);
  const specU = s.get(scene.specU);
  const ruleU = s.get(scene.ruleU);
  const strikes = [s.get(scene.strikeA), s.get(scene.strikeB), 0, s.get(scene.strikeD)];
  const crownU = s.get(scene.crownU);
  const othersDim = s.get(scene.othersDim);
  const heroU = s.get(scene.heroU);
  const sawU = s.get(scene.sawU);
  const splinterU = s.get(scene.splinterU);
  const sandU = s.get(scene.sandU);
  const standU = s.get(scene.standU);
  const stoolU = s.get(scene.stoolU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const hero = CANDIDATES[WINNER];
  const heroBoards = BOARDS[WINNER];
  const q = quadAt(standU);
  const totalH = hero.heightIn * IN;
  // board extents in 0..1 down the face
  const bandOf = (b: Board) => ({
    b0: (b.y + totalH / 2) / totalH,
    b1: (b.y + b.h + totalH / 2) / totalH,
  });
  const groundY = HERO_Y + totalH / 2;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the salvage pile ---- */}
        <g opacity={othersDim}>
          {CANDIDATES.map((c, i) => (
            <g key={c.id}>
              <PalletFace c={c} boards={BOARDS[i]} u={clamp01(pileU * 3 - i * 0.5)} lit={i === WINNER ? crownU : 0} />
              {pileU > 0.6 && (
                <text x={c.cx} y={c.cy - c.heightIn * IN / 2 - 14} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  {c.lengthIn} × {c.heightIn} in · {c.boardIn} in boards
                </text>
              )}
              <Strike c={c} u={strikes[i]} label={c.verdict} />
            </g>
          ))}
          {/* the survivor gets a ring, not a strike */}
          {crownU > 0 && (
            <g opacity={crownU}>
              <rect
                x={CANDIDATES[WINNER].cx - hero.lengthIn * IN / 2 - 12}
                y={CANDIDATES[WINNER].cy - totalH / 2 - 12}
                width={hero.lengthIn * IN + 24}
                height={totalH + 24}
                rx={10}
                fill="none"
                stroke={colors.POSITIVE}
                strokeWidth={3}
              />
              <text
                x={CANDIDATES[WINNER].cx}
                y={CANDIDATES[WINNER].cy + totalH / 2 + 34}
                textAnchor="middle"
                fill={colors.POSITIVE}
                fontSize={15}
                fontWeight={700}
              >
                excellent condition — the bar front
              </text>
            </g>
          )}
        </g>

        {/* ---- the spec card ---- */}
        <g opacity={specU}>
          <rect x={SPEC.x} y={SPEC.y} width={SPEC.w} height={SPEC.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
          <text x={SPEC.x + 18} y={SPEC.y + 30} fill={colors.ACCENT} fontSize={14} fontWeight={700}>
            WHAT THE FRONT NEEDS
          </text>
          {SPEC_LINES.map((line, i) => {
            const u = clamp01(ruleU * 4 - i * 0.7);
            return (
              <text key={line} x={SPEC.x + 18} y={SPEC.y + 58 + i * 24} fill={colors.TEXT} fontSize={15} opacity={u}>
                {line}
              </text>
            );
          })}
        </g>

        {/* ---- the hero, tipping up ---- */}
        {heroU > 0 && (
          <g opacity={heroU}>
            {heroBoards.map((b, i) => {
              const { b0, b1 } = bandOf(b);
              const p = [onQuad(q, 0, b0), onQuad(q, 1, b0), onQuad(q, 1, b1), onQuad(q, 0, b1)];
              return (
                <polygon
                  key={i}
                  points={p.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                  fill={WOOD_LIT}
                  stroke="#2a1f13"
                  strokeWidth={1}
                />
              );
            })}

            {/* splinters, sanded away left to right */}
            {splinterU > 0 &&
              SPLINTERS.map((sp, i) => {
                const gone = clamp01(sandU * 1.25 - sp.u * 1.0);
                const alive = splinterU * (1 - gone);
                if (alive <= 0.01) return null;
                const band = bandOf(heroBoards[Math.min(sp.b, heroBoards.length - 1)]);
                const p = onQuad(q, sp.u, (band.b0 + band.b1) / 2);
                return (
                  <line
                    key={i}
                    x1={p.x}
                    y1={p.y}
                    x2={p.x + Math.cos(sp.tilt) * sp.len}
                    y2={p.y + Math.sin(sp.tilt) * sp.len}
                    stroke={colors.NEGATIVE}
                    strokeWidth={1.6}
                    opacity={alive * 0.9}
                  />
                );
              })}
            {/* the sanding block, sweeping once across the face */}
            {sandU > 0 && sandU < 1 && (
              <g opacity={0.95}>
                {(() => {
                  const p = onQuad(q, clamp01(sandU), 0.5);
                  return (
                    <>
                      <rect x={p.x - 26} y={p.y - 16} width={52} height={32} rx={5} fill={colors.SECONDARY} opacity={0.85} />
                      <text x={p.x} y={p.y - 24} textAnchor="middle" fill={colors.SECONDARY} fontSize={12}>
                        light sanding only
                      </text>
                    </>
                  );
                })()}
              </g>
            )}

            {/* the cut that never happens */}
            {sawU > 0 && (
              <g opacity={sawU}>
                <line x1={HERO_X - 60} y1={HERO_Y - 130} x2={HERO_X + 60} y2={HERO_Y - 130} stroke={colors.MUTED} strokeWidth={3} strokeDasharray="9 7" />
                <line x1={HERO_X - 34} y1={HERO_Y - 156} x2={HERO_X + 34} y2={HERO_Y - 104} stroke={colors.NEGATIVE} strokeWidth={3.5} />
                <line x1={HERO_X + 34} y1={HERO_Y - 156} x2={HERO_X - 34} y2={HERO_Y - 104} stroke={colors.NEGATIVE} strokeWidth={3.5} />
                <text x={HERO_X} y={HERO_Y - 172} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={700}>
                  zero cuts on the front
                </text>
              </g>
            )}

            {/* stool + height dimension, once it is standing */}
            {stoolU > 0 && (
              <g opacity={stoolU}>
                {(() => {
                  const sx = HERO_X + HERO_W / 2 + 96;
                  const seat = groundY - 30 * IN;
                  return (
                    <>
                      <line x1={sx - 34} y1={seat} x2={sx + 34} y2={seat} stroke={colors.SECONDARY} strokeWidth={7} strokeLinecap="round" />
                      <line x1={sx - 22} y1={seat} x2={sx - 28} y2={groundY} stroke={colors.SECONDARY} strokeWidth={4} />
                      <line x1={sx + 22} y1={seat} x2={sx + 28} y2={groundY} stroke={colors.SECONDARY} strokeWidth={4} />
                      <line x1={sx - 26} y1={groundY - 8 * IN} x2={sx + 26} y2={groundY - 8 * IN} stroke={colors.SECONDARY} strokeWidth={3} />
                      <text x={sx} y={groundY + 24} textAnchor="middle" fill={colors.SECONDARY} fontSize={13}>
                        bar stool
                      </text>
                    </>
                  );
                })()}
              </g>
            )}
            {dimU > 0 && (
              <g opacity={dimU}>
                <line
                  x1={HERO_X - HERO_W / 2 - 34}
                  y1={groundY}
                  x2={HERO_X - HERO_W / 2 - 34}
                  y2={groundY - totalH * dimU}
                  stroke={colors.ACCENT}
                  strokeWidth={2}
                />
                <text
                  x={HERO_X - HERO_W / 2 - 44}
                  y={groundY - totalH / 2}
                  textAnchor="end"
                  fill={colors.ACCENT}
                  fontSize={16}
                  fontWeight={700}
                >
                  40 in
                </text>
                <line
                  x1={HERO_X - HERO_W / 2}
                  y1={groundY + 22}
                  x2={HERO_X - HERO_W / 2 + HERO_W * dimU}
                  y2={groundY + 22}
                  stroke={colors.ACCENT}
                  strokeWidth={2}
                />
                <text x={HERO_X} y={groundY + 44} textAnchor="middle" fill={colors.ACCENT} fontSize={16} fontWeight={700}>
                  47 in
                </text>
              </g>
            )}
          </g>
        )}

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={306} y={286} width={668} height={132} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={338} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              one pallet · 47 by 40 inches · six-inch boards · uncut
            </text>
            <text x={640} y={380} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the front of the bar
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
