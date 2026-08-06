// The Stack Is the Joint
//
// Backing source: Lee Valley, "How to Build a Contemporary Cedar Garden Bench"
// — glue and clamp one 48 in piece with an 18 in piece at each end, check
// level, and screw a 3-1/2 in piece to the centre of the 48 in length with 2 in
// pressure-treated screws; glue, clamp and screw the second 48 in piece to the
// two 18s; add a 14-1/2 in piece to the 18, then another 3-1/2 in piece,
// switching to 2-1/2 to 3 in screws for the remaining layers; stack all the
// interior pieces, then glue and clamp the final outside 48; clamp 24 hours.
//
// Centerpiece: the bench as a course diagram, built upward one layer at a time,
// with a live screw-length gauge beside it that explains — geometrically — why
// the two-inch screws get retired partway up.
import {
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Courses. Each 2x4 laid flat is 1-1/2 in thick; the stack grows upward.
// ---------------------------------------------------------------------------

const THICK = 1.5; // in
const PXI = 26; // px per inch of thickness — the stack is drawn tall
const BASE_Y = 470;
const LAYER_H = THICK * PXI;

interface Course {
  label: string;
  detail: string;
  width: number; // px
  x: number; // px, left edge
  screw: '2in' | 'long' | null;
}

const WIDE = 470;
const CX = 470;
const L = CX - WIDE / 2;

// One column of the stack, in the order the article builds it.
const COURSES: Course[] = [
  { label: '48 in + two 18 in legs', detail: 'base frame, level checked', width: WIDE, x: L, screw: '2in' },
  { label: '3½ in block', detail: 'centred on the 48', width: 66, x: CX - 33, screw: '2in' },
  { label: '48 in', detail: 'onto both legs', width: WIDE, x: L, screw: '2in' },
  { label: '14½ in', detail: 'onto the 18 in leg', width: 168, x: L, screw: 'long' },
  { label: '3½ in block', detail: 'the second spacer', width: 66, x: CX - 33, screw: 'long' },
  { label: '48 in', detail: 'interior layer', width: WIDE, x: L, screw: 'long' },
  { label: '14½ in', detail: 'interior layer', width: 168, x: CX + WIDE / 2 - 168, screw: 'long' },
  { label: '48 in — the outside face', detail: 'glued and clamped last', width: WIDE, x: L, screw: null },
];

// The screw-length gauge: to hold, a screw must cross what it goes through and
// still bite about an inch into what it lands in.
const GAUGE = { x: 900, y: 210, w: 250, h: 260 } as const;
const BITE = 1.0; // in — the bite you want on the far side

const CAM_BASE: CameraState = { x: 470, y: 420, k: 1.16 };
const CAM_STACK: CameraState = { x: 500, y: 340, k: 1.02 };
const CAM_GAUGE: CameraState = { x: 900, y: 330, k: 1.3 };
const CAM_WIDE: CameraState = { x: 620, y: 330, k: 0.9 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  layerU: ChannelRef<number>;
  glueU: ChannelRef<number>;
  gaugeU: ChannelRef<number>;
  needU: ChannelRef<number>;
  swapU: ChannelRef<number>;
  clampU: ChannelRef<number>;
  areaU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_BASE, cameraInterp);
  const layerU = tl.channel('layerU', 0);
  const glueU = tl.channel('glueU', 0);
  const gaugeU = tl.channel('gaugeU', 0);
  const needU = tl.channel('needU', 0);
  const swapU = tl.channel('swapU', 0);
  const clampU = tl.channel('clampU', 0);
  const areaU = tl.channel('areaU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the base frame —
  tl.caption({
    at: 0.5,
    dur: 6.95,
    text: 'The first course is the whole bench in miniature: one forty-eight inch length, an eighteen inch leg glued and clamped at each end, level checked before anything sets.',
  });
  tl.tween(layerU, 1, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.hold(6.9, 0.6);

  // — Beat 2 · the little block —
  tl.caption({
    at: 7.5,
    dur: 6.55,
    text: 'Then a three and a half inch block gets screwed to the middle of that forty-eight, with two inch pressure-treated screws. It is a tiny piece, and it is what keeps the long span from ever bowing inward.',
  });
  tl.tween(layerU, 2, { at: 7.8, dur: 1.2, ease: ease.move });
  tl.hold(13.5, 0.6);

  // — Beat 3 · the second long piece —
  tl.caption({
    at: 14.1,
    dur: 6.55,
    text: 'The second forty-eight inch length is glued, clamped and screwed to both legs. Notice there is no joinery here at all — no mortise, no tenon, no dovetail. The layering is the joint.',
  });
  tl.tween(cam, CAM_STACK, { at: 14.3, dur: 1.5, ease: ease.move });
  tl.tween(layerU, 3, { at: 14.8, dur: 1.2, ease: ease.move });
  tl.tween(glueU, 1, { at: 16.2, dur: 1.2, ease: ease.draw });
  tl.hold(20.1, 0.6);

  // — Beat 4 · a fourteen and a half, and another block —
  tl.caption({
    at: 20.7,
    dur: 6.35,
    text: 'A fourteen and a half inch piece goes onto the leg, and another little block on top of that. The stack is starting to get thick, and that changes the hardware.',
  });
  tl.tween(layerU, 5, { at: 21.0, dur: 2.0, ease: ease.move });
  tl.hold(26.5, 0.6);

  // — Beat 5 · why the screws get longer —
  tl.caption({
    at: 27.1,
    dur: 7.55,
    text: 'Here is the reasoning. A screw has to cross everything it passes through and still bite about an inch into the piece underneath. Through one layer of inch-and-a-half stock, two inches is barely enough. Through two, it is not.',
  });
  tl.tween(cam, CAM_GAUGE, { at: 27.3, dur: 1.5, ease: ease.move });
  tl.tween(gaugeU, 1, { at: 28.0, dur: 1.0, ease: ease.enter });
  tl.tween(needU, 1, { at: 29.6, dur: 2.0, ease: ease.move });
  tl.hold(34.1, 0.6);

  // — Beat 6 · the swap —
  tl.caption({
    at: 34.7,
    dur: 6.35,
    text: 'Which is why the build switches to two and a half or three inch screws for every layer after the first ones. Same joint, more stock above it, longer fastener.',
  });
  tl.tween(swapU, 1, { at: 35.0, dur: 1.2, ease: ease.pop });
  tl.hold(40.5, 0.6);

  // — Beat 7 · stack the rest —
  tl.caption({
    at: 41.1,
    dur: 6.75,
    text: 'From there it is repetition: all the interior pieces stacked, glued and screwed, and then the last outside forty-eight is glued and clamped over the whole face, with a final fourteen and a half on the outer leg.',
  });
  tl.tween(cam, CAM_STACK, { at: 41.3, dur: 1.6, ease: ease.move });
  tl.tween(gaugeU, 0, { at: 41.3, dur: 1.0, ease: ease.move });
  tl.tween(layerU, 8, { at: 42.0, dur: 3.0, ease: ease.move });
  tl.hold(47.3, 0.6);

  // — Beat 8 · why a stack is strong —
  tl.caption({
    at: 47.9,
    dur: 7.15,
    text: 'And a stack like this is far stronger than it looks, because glue on a long grain face is stronger than the wood around it. Every layer adds another whole face of it. That is the joinery.',
  });
  tl.tween(cam, CAM_WIDE, { at: 48.1, dur: 1.6, ease: ease.move });
  tl.tween(areaU, 1, { at: 49.0, dur: 2.0, ease: ease.draw });
  tl.hold(54.5, 0.6);

  // — Beat 9 · clamps, again —
  tl.caption({
    at: 55.1,
    dur: 6.15,
    text: 'Clamps go on the finished stack, and stay there for a day. What comes off tomorrow is a solid bench with a row of screw holes down its face.',
  });
  tl.tween(clampU, 1, { at: 55.4, dur: 1.4, ease: ease.pop });
  tl.hold(60.7, 0.6);

  // — Beat 10 · close —
  tl.caption({
    at: 61.3,
    dur: 5.4,
    text: 'Which leaves exactly one problem worth solving: what to do about the screw holes.',
  });
  tl.tween(dimAll, 0.13, { at: 61.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 62.6, dur: 0.9, ease: ease.enter });
  tl.hold(66.7, 1.6);

  return { tl, cam, layerU, glueU, gaugeU, needU, swapU, clampU, areaU, dimAll, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const CEDAR = '#a2653a';
const CEDAR_LIT = '#c98a4f';

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const layerU = s.get(scene.layerU);
  const glueU = s.get(scene.glueU);
  const gaugeU = s.get(scene.gaugeU);
  const needU = s.get(scene.needU);
  const swapU = s.get(scene.swapU);
  const clampU = s.get(scene.clampU);
  const areaU = s.get(scene.areaU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const topY = BASE_Y - Math.min(COURSES.length, Math.ceil(layerU)) * LAYER_H;

  // gauge geometry: through-thickness vs screw length
  const through = 1 + needU; // 1 layer -> 2 layers of 1.5 in
  const needIn = through * THICK + BITE;
  const haveIn = swapU > 0.5 ? 3 : 2;
  const inPx = 46; // px per inch in the gauge
  const gx = GAUGE.x;
  const gy = GAUGE.y;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll * (1 - 0.86 * gaugeU)}>
          {/* ---- the stack, course by course ---- */}
          {COURSES.map((c, i) => {
            const u = clamp01(layerU - i);
            if (u <= 0) return null;
            const y = BASE_Y - (i + 1) * LAYER_H;
            const drift = (1 - u) * 70;
            return (
              <g key={i} opacity={u}>
                {/* legs, drawn once under the base course */}
                {i === 0 && (
                  <>
                    <rect x={L} y={BASE_Y} width={44} height={168} rx={2} fill={CEDAR} stroke="#3a2515" strokeWidth={1.2} />
                    <rect x={L + WIDE - 44} y={BASE_Y} width={44} height={168} rx={2} fill={CEDAR} stroke="#3a2515" strokeWidth={1.2} />
                    <text x={L - 14} y={BASE_Y + 96} textAnchor="end" fill={colors.SECONDARY} fontSize={13} fontWeight={700}>
                      18 in
                    </text>
                  </>
                )}
                <rect
                  x={c.x}
                  y={y - drift}
                  width={c.width}
                  height={LAYER_H - 3}
                  rx={2}
                  fill={i === COURSES.length - 1 ? CEDAR_LIT : CEDAR}
                  stroke="#3a2515"
                  strokeWidth={1.2}
                />
                {/* glue line under each course */}
                {glueU > 0 && i > 0 && (
                  <rect x={c.x} y={y + LAYER_H - 4} width={c.width * glueU} height={3} fill={colors.POSITIVE} opacity={0.8} />
                )}
                {/* the screw that fastens this course */}
                {c.screw && (
                  <g>
                    <circle
                      cx={c.x + c.width / 2 + (c.width > 200 ? 90 : 0)}
                      cy={y - drift + LAYER_H / 2 - 1}
                      r={5}
                      fill={c.screw === 'long' ? colors.WARM : colors.ACCENT}
                      stroke={colors.BG}
                    />
                  </g>
                )}
                <text x={c.x + c.width + 14} y={y - drift + LAYER_H / 2 + 4} fill={colors.MUTED} fontSize={12.5}>
                  {c.label}
                </text>
              </g>
            );
          })}

          {/* glue-face highlight */}
          {areaU > 0 && (
            <g opacity={areaU}>
              {COURSES.map((c, i) => {
                if (i === 0) return null;
                const y = BASE_Y - (i + 1) * LAYER_H;
                return (
                  <rect key={i} x={c.x} y={y + LAYER_H - 5} width={c.width * areaU} height={5} fill={colors.POSITIVE} opacity={0.85} />
                );
              })}
              <text x={CX} y={topY - 60} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={700}>
                every layer adds another full glue face
              </text>
            </g>
          )}

          {/* clamps on the finished stack */}
          {clampU > 0 &&
            [L + 60, CX, L + WIDE - 60].map((x, i) => {
              const u = clamp01(clampU * 3 - i * 0.5);
              if (u <= 0) return null;
              return (
                <g key={i} opacity={u}>
                  <rect x={x - 14} y={topY - 26} width={28} height={13} rx={3} fill={colors.SECONDARY} />
                  <rect x={x - 14} y={BASE_Y + 6} width={28} height={13} rx={3} fill={colors.SECONDARY} />
                  <line x1={x} y1={topY - 26} x2={x} y2={BASE_Y + 19} stroke={colors.SECONDARY} strokeWidth={3} />
                </g>
              );
            })}

        </g>
        <g opacity={dimAll}>
          {/* ---- the screw-length gauge ---- */}
          {gaugeU > 0 && (
            <g opacity={gaugeU}>
              <rect x={gx - 40} y={gy - 56} width={GAUGE.w + 60} height={GAUGE.h + 92} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={gx + GAUGE.w / 2 - 10} y={gy - 28} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                what the screw has to reach
              </text>

              {/* the stock it passes through */}
              {[0, 1].map((k) => {
                const u = k === 0 ? 1 : needU;
                if (u <= 0.02) return null;
                return (
                  <rect
                    key={k}
                    x={gx}
                    y={gy + k * THICK * inPx}
                    width={140}
                    height={THICK * inPx - 2}
                    fill={CEDAR}
                    stroke="#3a2515"
                    opacity={u}
                  />
                );
              })}
              {/* the piece it lands in */}
              <rect x={gx} y={gy + through * THICK * inPx} width={140} height={BITE * inPx * 1.6} fill={CEDAR_LIT} stroke="#3a2515" />

              {/* required depth */}
              <line
                x1={gx + 158}
                y1={gy}
                x2={gx + 158}
                y2={gy + needIn * inPx}
                stroke={colors.POSITIVE}
                strokeWidth={3}
              />
              <text x={gx + 166} y={gy + (needIn * inPx) / 2} fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
                needs {needIn.toFixed(1)} in
              </text>
              {/* the screw you are holding */}
              <line
                x1={gx + 200}
                y1={gy}
                x2={gx + 200}
                y2={gy + haveIn * inPx}
                stroke={haveIn >= needIn ? colors.ACCENT : colors.NEGATIVE}
                strokeWidth={5}
                strokeLinecap="round"
              />
              <text
                x={gx + 210}
                y={gy + haveIn * inPx + 20}
                fill={haveIn >= needIn ? colors.ACCENT : colors.NEGATIVE}
                fontSize={14}
                fontWeight={700}
              >
                {haveIn === 3 ? '2½–3 in' : '2 in'}
              </text>
              <text
                x={gx + GAUGE.w / 2 - 10}
                y={gy + GAUGE.h + 20}
                textAnchor="middle"
                fill={haveIn >= needIn ? colors.POSITIVE : colors.NEGATIVE}
                fontSize={16}
                fontWeight={700}
              >
                {haveIn >= needIn ? 'holds' : 'not enough bite'}
              </text>
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={318} y={262} width={644} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={316} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              no mortises · no tenons · eight glued courses
            </text>
            <text x={640} y={358} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the stack is the joint
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
