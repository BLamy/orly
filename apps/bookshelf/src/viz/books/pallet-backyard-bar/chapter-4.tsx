// Three Coats and a Level Patio
//
// Backing source: Lee Valley, "Make a Backyard Bar Using Pallets" — surfaces
// are sanded as needed and brushed with stain, about three coats; the bar top
// is finished with a coating of Varathane "to create a washable surface"; the
// ground beneath is dug, levelled and laid with patio stones; a bottle opener
// and two bar stools finish it, and the protective finish is reapplied yearly
// (or an epoxy coating is used instead).
//
// Centerpiece: a magnified slice through the wood surface. Stain sinks in coat
// by coat, a water drop proves stain is colour and not armour, a film of
// Varathane goes on and the same drop beads and wipes away — then the camera
// pulls all the way back to the bar standing on levelled stone.
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
// simple hex lerp for the stain deepening
function mixHex(a: string, b: string, u: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const p = pa.map((v, i) => Math.round(lerp(v, pb[i], clamp01(u))));
  return `#${p.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// ---------------------------------------------------------------------------
// Stage A — a magnified slice through the bar top.
// ---------------------------------------------------------------------------

const SLICE = { x: 208, y: 150, w: 660, h: 150 } as const;
const RAW = '#a08256';
const STAINED = '#5f3418';

const grand = mulberry32(31415);
const GRAIN = Array.from({ length: 46 }, () => ({
  x: grand(),
  w: 1 + grand() * 2.4,
  d: 0.35 + grand() * 0.6,
}));

// ---------------------------------------------------------------------------
// Stage B — the whole bar, from the front, standing on the patio.
// ---------------------------------------------------------------------------

const EIN = 5.0; // px per inch in elevation
const BAR = { cx: 640, groundY: 604, w: 47 * EIN, h: 40 * EIN } as const;
const TOP_OVERHANG = 4 * EIN;
const STONES = [-1.5, -0.5, 0.5, 1.5].map((k) => ({ k }));
const STONE_W = 88;
const STONE_H = 22;

const CAM_SLICE: CameraState = { x: 538, y: 236, k: 1.22 };
const CAM_DROP: CameraState = { x: 552, y: 244, k: 1.34 };
const CAM_PULL: CameraState = { x: 640, y: 396, k: 0.98 };
const CAM_GROUND: CameraState = { x: 640, y: 520, k: 1.4 };
const CAM_FINAL: CameraState = { x: 640, y: 400, k: 0.92 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  sliceU: ChannelRef<number>;
  brushU: ChannelRef<number>;
  dropRawU: ChannelRef<number>;
  blotchU: ChannelRef<number>;
  filmU: ChannelRef<number>;
  dropSealU: ChannelRef<number>;
  wipeU: ChannelRef<number>;
  sliceDim: ChannelRef<number>;
  barU: ChannelRef<number>;
  sodU: ChannelRef<number>;
  digU: ChannelRef<number>;
  stoneU: ChannelRef<number>;
  levelU: ChannelRef<number>;
  stoolU: ChannelRef<number>;
  openerU: ChannelRef<number>;
  yearU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SLICE, cameraInterp);
  const sliceU = tl.channel('sliceU', 0);
  const brushU = tl.channel('brushU', 0);
  const dropRawU = tl.channel('dropRawU', 0);
  const blotchU = tl.channel('blotchU', 0);
  const filmU = tl.channel('filmU', 0);
  const dropSealU = tl.channel('dropSealU', 0);
  const wipeU = tl.channel('wipeU', 0);
  const sliceDim = tl.channel('sliceDim', 1);
  const barU = tl.channel('barU', 0);
  const sodU = tl.channel('sodU', 0);
  const digU = tl.channel('digU', 0);
  const stoneU = tl.channel('stoneU', 0);
  const levelU = tl.channel('levelU', 0);
  const stoolU = tl.channel('stoolU', 0);
  const openerU = tl.channel('openerU', 0);
  const yearU = tl.channel('yearU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · into the surface —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'The bar is built. Everything from here is about weather. So come in close, right down to the surface of the wood, because that is where the argument with the weather is actually settled.',
  });
  tl.tween(sliceU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.hold(6.5, 0.6);

  // — Beat 2 · first coat —
  tl.caption({
    at: 7.1,
    dur: 5.8,
    text: 'The first coat of stain goes on with a brush and mostly disappears. Dry, thirsty pallet wood drinks it straight in, and the colour looks thin and uneven.',
  });
  tl.tween(brushU, 1, { at: 7.4, dur: 2.2, ease: ease.linear });
  tl.hold(12.9, 0.5);

  // — Beat 3 · coats two and three —
  tl.caption({
    at: 13.4,
    dur: 6.2,
    text: 'So it gets a second coat, and a third. Each one has less bare wood left to soak into, so more of it stays near the surface, and the colour finally evens out and holds.',
  });
  tl.tween(brushU, 2, { at: 13.7, dur: 2.0, ease: ease.linear });
  tl.tween(brushU, 3, { at: 16.3, dur: 2.0, ease: ease.linear });
  tl.hold(19.6, 0.6);

  // — Beat 4 · stain is colour, not armour —
  tl.caption({
    at: 20.2,
    dur: 6.4,
    text: 'But stain is colour, not armour. Set a wet glass down on stained wood and the water goes where the stain went — into the grain, leaving a ring you cannot wipe off.',
  });
  tl.tween(cam, CAM_DROP, { at: 20.4, dur: 1.4, ease: ease.move });
  tl.tween(dropRawU, 1, { at: 21.2, dur: 1.2, ease: ease.move });
  tl.tween(blotchU, 1, { at: 22.8, dur: 1.6, ease: ease.move });
  tl.hold(26.6, 0.6);

  // — Beat 5 · the film —
  tl.caption({
    at: 27.2,
    dur: 6.4,
    text: 'Which is why the bar top gets one more thing the sides do not: a coat of Varathane. It cures as a film that sits on top of the wood rather than inside it, and that film is a washable surface.',
  });
  tl.tween(dropRawU, 0, { at: 27.4, dur: 0.6, ease: ease.move });
  tl.tween(blotchU, 0, { at: 27.4, dur: 0.8, ease: ease.move });
  tl.tween(filmU, 1, { at: 28.4, dur: 1.8, ease: ease.draw });
  tl.hold(33.6, 0.6);

  // — Beat 6 · the same drop, sealed —
  tl.caption({
    at: 34.2,
    dur: 6.0,
    text: 'Now the same spill has nowhere to go. It beads, it sits there looking pleased with itself, and it leaves with a cloth. That is the whole reason the top is finished differently from everything below it.',
  });
  tl.tween(dropSealU, 1, { at: 34.6, dur: 1.2, ease: ease.move });
  tl.tween(wipeU, 1, { at: 37.2, dur: 1.6, ease: ease.move });
  tl.hold(40.2, 0.6);

  // — Beat 7 · pull back to the ground —
  tl.caption({
    at: 40.8,
    dur: 6.2,
    text: 'Pull all the way back out, and there is one problem left, and it is underneath. A bar set straight on lawn sinks, rocks, and wicks water up into the very wood you just spent three coats protecting.',
  });
  tl.tween(sliceDim, 0.07, { at: 41.0, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_PULL, { at: 41.0, dur: 1.8, ease: ease.move });
  tl.tween(barU, 1, { at: 41.6, dur: 1.4, ease: ease.enter });
  tl.tween(sodU, 1, { at: 42.6, dur: 1.0, ease: ease.enter });
  tl.hold(47.0, 0.6);

  // — Beat 8 · dig, level, lay stone —
  tl.caption({
    at: 47.6,
    dur: 6.4,
    text: 'So the sod comes out, the ground gets levelled, and patio stones go down where the bar will stand. Dry, flat, and firm — the same three things every outdoor build ends up asking for.',
  });
  tl.tween(cam, CAM_GROUND, { at: 47.8, dur: 1.5, ease: ease.move });
  tl.tween(digU, 1, { at: 48.6, dur: 1.4, ease: ease.move });
  tl.tween(stoneU, 1, { at: 50.4, dur: 1.8, ease: ease.move });
  tl.tween(levelU, 1, { at: 52.4, dur: 1.4, ease: ease.move });
  tl.hold(54.0, 0.6);

  // — Beat 9 · the two small things —
  tl.caption({
    at: 54.6,
    dur: 5.8,
    text: 'Two bar stools slide under the overhang, and a bottle opener gets screwed to the front, which is the moment the thing stops being a project and starts being a bar.',
  });
  tl.tween(cam, CAM_FINAL, { at: 54.8, dur: 1.6, ease: ease.move });
  tl.tween(stoolU, 1, { at: 55.8, dur: 1.2, ease: ease.enter });
  tl.tween(openerU, 1, { at: 57.4, dur: 0.6, ease: ease.pop });
  tl.hold(60.4, 0.6);

  // — Beat 10 · the yearly bill —
  tl.caption({
    at: 61.0,
    dur: 6.2,
    text: 'One honest warning: a brushed finish outdoors is a subscription, not a purchase. Plan on recoating it every year, or spend the money once on an epoxy coating and stop thinking about it.',
  });
  tl.tween(yearU, 1, { at: 61.4, dur: 2.4, ease: ease.linear });
  tl.hold(67.2, 0.6);

  // — Beat 11 · close —
  tl.caption({
    at: 67.8,
    dur: 5.8,
    text: 'Three pallets, one shelf, one bought board and three coats of stain. Next in this series, the wood stops being free and the joinery starts getting serious.',
  });
  tl.tween(dimAll, 0.14, { at: 68.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 69.3, dur: 0.9, ease: ease.enter });
  tl.hold(73.6, 1.6);

  return {
    tl,
    cam,
    sliceU,
    brushU,
    dropRawU,
    blotchU,
    filmU,
    dropSealU,
    wipeU,
    sliceDim,
    barU,
    sodU,
    digU,
    stoneU,
    levelU,
    stoolU,
    openerU,
    yearU,
    dimAll,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const sliceU = s.get(scene.sliceU);
  const brushU = s.get(scene.brushU);
  const dropRawU = s.get(scene.dropRawU);
  const blotchU = s.get(scene.blotchU);
  const filmU = s.get(scene.filmU);
  const dropSealU = s.get(scene.dropSealU);
  const wipeU = s.get(scene.wipeU);
  const sliceDim = s.get(scene.sliceDim);
  const barU = s.get(scene.barU);
  const sodU = s.get(scene.sodU);
  const digU = s.get(scene.digU);
  const stoneU = s.get(scene.stoneU);
  const levelU = s.get(scene.levelU);
  const stoolU = s.get(scene.stoolU);
  const openerU = s.get(scene.openerU);
  const yearU = s.get(scene.yearU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  // stain: colour and penetration deepen with each coat, with diminishing returns
  const coats = clamp01(brushU / 3);
  const soak = 1 - Math.exp(-1.5 * brushU); // 0 -> ~0.99 over three coats
  const surface = mixHex(RAW, STAINED, soak);
  const pass = brushU % 1;
  const brushing = brushU > 0.001 && brushU < 3 && pass > 0.001;
  const coatNo = Math.min(3, Math.floor(brushU) + (pass > 0 ? 1 : 0));

  const dropX = SLICE.x + SLICE.w * 0.62;
  const dropTop = SLICE.y - 74 + dropRawU * 60;
  const sealDropX = dropX + wipeU * 300;

  // patio + bar
  const digDepth = digU * 26;
  const stoneTopY = BAR.groundY - stoneU * STONE_H;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the magnified surface ================= */}
        <g opacity={sliceU * sliceDim * dimAll}>
          <text x={SLICE.x} y={SLICE.y - 96} fill={colors.MUTED} fontSize={13}>
            the bar top, greatly magnified
          </text>

          {/* the wood body */}
          <rect x={SLICE.x} y={SLICE.y} width={SLICE.w} height={SLICE.h} rx={3} fill={RAW} stroke="#2a1f13" strokeWidth={1.4} />
          {/* grain channels, tinted as far down as the stain has reached */}
          {GRAIN.map((g, i) => (
            <rect
              key={i}
              x={SLICE.x + g.x * SLICE.w}
              y={SLICE.y}
              width={g.w}
              height={SLICE.h * g.d}
              fill={mixHex(RAW, STAINED, soak * (0.55 + g.d * 0.5))}
              opacity={0.85}
            />
          ))}
          {/* the stained layer near the surface */}
          <rect
            x={SLICE.x}
            y={SLICE.y}
            width={SLICE.w}
            height={SLICE.h * lerp(0.1, 0.42, coats)}
            fill={surface}
            opacity={clamp01(brushU * 1.2)}
          />

          {/* the brush, one pass per coat */}
          {brushing && (
            <g>
              <rect x={SLICE.x + pass * SLICE.w - 34} y={SLICE.y - 40} width={68} height={30} rx={4} fill={colors.SECONDARY} />
              <rect x={SLICE.x + pass * SLICE.w - 30} y={SLICE.y - 12} width={60} height={14} fill={surface} />
            </g>
          )}
          {brushU > 0 && (
            <text x={SLICE.x + SLICE.w} y={SLICE.y - 52} textAnchor="end" fill={colors.WARM} fontSize={16} fontWeight={700}>
              coat {coatNo} of 3
            </text>
          )}

          {/* the film of Varathane */}
          {filmU > 0 && (
            <g>
              <rect
                x={SLICE.x}
                y={SLICE.y - 11}
                width={SLICE.w * filmU}
                height={11}
                fill={colors.ACCENT}
                opacity={0.42}
              />
              <line x1={SLICE.x} y1={SLICE.y - 11} x2={SLICE.x + SLICE.w * filmU} y2={SLICE.y - 11} stroke={colors.ACCENT} strokeWidth={2} />
              <text x={SLICE.x} y={SLICE.y - 24} fill={colors.ACCENT} fontSize={13.5} opacity={filmU}>
                Varathane — a film on top, not in the grain
              </text>
            </g>
          )}

          {/* drop test on bare stain: it soaks in and stains darker */}
          {dropRawU > 0 && (
            <g opacity={dropRawU}>
              <circle cx={dropX} cy={dropTop} r={11} fill={colors.ACCENT} opacity={0.75 * (1 - blotchU)} />
            </g>
          )}
          {blotchU > 0 && (
            <g opacity={blotchU}>
              <ellipse cx={dropX} cy={SLICE.y + 26} rx={40 * blotchU} ry={22 * blotchU} fill="#2f1a0c" opacity={0.75} />
              <text x={dropX} y={SLICE.y + SLICE.h + 34} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={700}>
                soaks in — a ring for good
              </text>
            </g>
          )}

          {/* drop test on the film: it beads and wipes */}
          {dropSealU > 0 && (
            <g opacity={dropSealU * (wipeU > 0.85 ? clamp01((1 - wipeU) * 6) : 1)}>
              <path
                d={`M ${sealDropX - 15} ${SLICE.y - 11} a 15 13 0 1 1 30 0 z`}
                fill={colors.ACCENT}
                opacity={0.8}
              />
              {wipeU > 0.05 && wipeU < 0.95 && (
                <rect x={sealDropX - 62} y={SLICE.y - 42} width={34} height={34} rx={5} fill={colors.POSITIVE} opacity={0.75} />
              )}
            </g>
          )}
          {wipeU > 0.5 && (
            <text x={SLICE.x + SLICE.w * 0.62} y={SLICE.y + SLICE.h + 34} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={700} opacity={clamp01(wipeU * 2 - 1)}>
              beads, then wipes away
            </text>
          )}
        </g>

        {/* ================= the whole bar on the ground ================= */}
        <g opacity={barU * dimAll}>
          {/* lawn */}
          {sodU > 0 && (
            <g opacity={sodU}>
              <rect x={0} y={BAR.groundY} width={STAGE_W} height={120} fill="#233042" opacity={0.6} />
              <line x1={0} y1={BAR.groundY} x2={STAGE_W} y2={BAR.groundY} stroke={colors.POSITIVE} strokeWidth={2} opacity={0.55} />
            </g>
          )}
          {/* the excavation */}
          {digU > 0 && (
            <rect
              x={BAR.cx - BAR.w / 2 - 60}
              y={BAR.groundY}
              width={BAR.w + 120}
              height={digDepth}
              fill={colors.BG}
              stroke={colors.GRID}
              strokeWidth={1.2}
            />
          )}
          {/* patio stones */}
          {stoneU > 0 &&
            STONES.map((st, i) => {
              const u = clamp01(stoneU * 3 - i * 0.5);
              if (u <= 0) return null;
              return (
                <rect
                  key={i}
                  x={BAR.cx + st.k * STONE_W - STONE_W / 2 + 2}
                  y={BAR.groundY + digDepth - STONE_H - (1 - u) * 70}
                  width={STONE_W - 4}
                  height={STONE_H}
                  rx={2}
                  fill="#5b6478"
                  stroke={colors.GRID}
                  opacity={u}
                />
              );
            })}
          {/* the bar itself, sitting on the stone */}
          {(() => {
            const baseY = stoneU > 0 ? BAR.groundY + digDepth - STONE_H : BAR.groundY;
            const topY = baseY - BAR.h;
            return (
              <g>
                <rect x={BAR.cx - BAR.w / 2} y={topY} width={BAR.w} height={BAR.h} rx={3} fill={STAINED} stroke="#2a1f13" strokeWidth={1.4} />
                {Array.from({ length: 5 }, (_, i) => (
                  <line
                    key={i}
                    x1={BAR.cx - BAR.w / 2}
                    y1={topY + ((i + 1) * BAR.h) / 6}
                    x2={BAR.cx + BAR.w / 2}
                    y2={topY + ((i + 1) * BAR.h) / 6}
                    stroke="#2a1f13"
                    strokeWidth={1}
                    opacity={0.7}
                  />
                ))}
                {/* the sealed top */}
                <rect x={BAR.cx - BAR.w / 2 - TOP_OVERHANG} y={topY - 12} width={BAR.w + TOP_OVERHANG * 2} height={12} rx={2} fill="#b98346" stroke="#2a1f13" />
                <rect
                  x={BAR.cx - BAR.w / 2 - TOP_OVERHANG}
                  y={topY - 14}
                  width={BAR.w + TOP_OVERHANG * 2}
                  height={3}
                  fill={colors.ACCENT}
                  opacity={0.5 * (1 - yearU * 0.75)}
                />

                {/* the level, once the stones are down */}
                {levelU > 0 && (
                  <g opacity={levelU}>
                    <rect x={BAR.cx - 70} y={BAR.groundY + digDepth - STONE_H - 20} width={140} height={16} rx={3} fill={colors.PANEL} stroke={colors.ACCENT} />
                    <circle
                      cx={BAR.cx + (1 - levelU) * 34}
                      cy={BAR.groundY + digDepth - STONE_H - 12}
                      r={5}
                      fill={levelU > 0.9 ? colors.POSITIVE : colors.WARM}
                    />
                    <text x={BAR.cx} y={BAR.groundY + digDepth + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                      dug, levelled, laid on stone
                    </text>
                  </g>
                )}

                {/* stools */}
                {stoolU > 0 &&
                  [-1, 1].map((sgn, i) => {
                    const u = clamp01(stoolU * 2 - i * 0.4);
                    if (u <= 0) return null;
                    const sx = BAR.cx + sgn * (BAR.w / 2 + 74);
                    const seat = baseY - 30 * EIN;
                    return (
                      <g key={i} opacity={u}>
                        <line x1={sx - 28} y1={seat} x2={sx + 28} y2={seat} stroke={colors.SECONDARY} strokeWidth={7} strokeLinecap="round" />
                        <line x1={sx - 18} y1={seat} x2={sx - 24} y2={baseY} stroke={colors.SECONDARY} strokeWidth={4} />
                        <line x1={sx + 18} y1={seat} x2={sx + 24} y2={baseY} stroke={colors.SECONDARY} strokeWidth={4} />
                        <line x1={sx - 22} y1={baseY - 8 * EIN} x2={sx + 22} y2={baseY - 8 * EIN} stroke={colors.SECONDARY} strokeWidth={3} />
                      </g>
                    );
                  })}

                {/* the bottle opener */}
                {openerU > 0 && (
                  <g opacity={openerU}>
                    <rect x={BAR.cx + BAR.w / 2 - 40} y={topY + 40} width={16} height={26} rx={3} fill={colors.WARM} />
                    <text x={BAR.cx + BAR.w / 2 - 52} y={topY + 34} textAnchor="end" fill={colors.WARM} fontSize={13}>
                      bottle opener
                    </text>
                  </g>
                )}
              </g>
            );
          })()}

          {/* the yearly recoat */}
          {yearU > 0 && (
            <g opacity={yearU}>
              <line x1={300} y1={230} x2={980} y2={230} stroke={colors.GRID} strokeWidth={2} />
              <line x1={300} y1={230} x2={300 + 680 * yearU} y2={230} stroke={colors.WARM} strokeWidth={3} />
              <circle cx={980} cy={230} r={6} fill={colors.WARM} opacity={clamp01(yearU * 4 - 3)} />
              <text x={300} y={214} fill={colors.MUTED} fontSize={13}>
                fresh
              </text>
              <text x={980} y={214} textAnchor="end" fill={colors.WARM} fontSize={13.5} fontWeight={700}>
                one year later — recoat
              </text>
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={300} y={244} width={680} height={144} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              three coats of stain · a sealed top · level stone underneath
            </text>
            <text x={640} y={342} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              a bar made almost entirely of other people&apos;s pallets
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
