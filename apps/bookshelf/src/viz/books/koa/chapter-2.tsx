// use, then compose
//
// Backing files: lib/application.js — use(fn) type-checks and pushes onto
// this.middleware, callback() runs const fn = this.compose(this.middleware)
// once at boot; koa-compose/index.js — dispatch(i), next = dispatch.bind(null,
// i + 1), the `i <= index` guard ("next() called multiple times"), and
// `i === middleware.length` → Promise.resolve() at the empty center.
//
// Centerpiece: the flat middleware array physically curls into the onion —
// each card sweeps from its array slot onto a concentric ring (index 0
// outermost), then dispatch wires every ring to the one inside it.
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
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Layout — the array on the left, the onion target on the right.
// ---------------------------------------------------------------------------

const ARRAY_X = 235;
const ARRAY_Y0 = 185;
const ARRAY_DY = 100;
const CARD_W = 280;
const CARD_H = 72;

const ONION = { x: 850, y: 380 } as const;
const RINGS = [204, 146, 92] as const; // fn 0 outermost
const RING_COLORS = [colors.ACCENT, colors.SECONDARY, colors.TEAL] as const;

// where card i's chip lands: on top of its ring
const chipPos = (i: number): { x: number; y: number } => ({ x: ONION.x, y: ONION.y - RINGS[i] });

// camera marks
const CAM_ARRAY: CameraState = { x: 340, y: 330, k: 1.45 };
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_RING: CameraState = { x: 850, y: 240, k: 1.5 };
const CAM_CENTER: CameraState = { x: 850, y: 380, k: 1.65 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  arrayU: ChannelRef<number>;
  cardsU: ChannelRef<number>; // 0..3, card i enters at u > i
  badU: ChannelRef<number>; // the non-function bounce, 0..1
  typeErrU: ChannelRef<number>;
  foldU: ChannelRef<number>; // 0..1 drives all three card→ring sweeps
  composeChipU: ChannelRef<number>;
  wireU: ChannelRef<number>; // dispatch plugs between rings
  idxN: ChannelRef<number>; // the compose `index` counter
  idxU: ChannelRef<number>;
  guardU: ChannelRef<number>; // the double-next red flash
  centerU: ChannelRef<number>; // Promise.resolve() at the core
  entryU: ChannelRef<number>; // dispatch(0) entry arrow
  stageDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_ARRAY, cameraInterp);
  const arrayU = tl.channel('arrayU', 0);
  const cardsU = tl.channel('cardsU', 0);
  const badU = tl.channel('badU', 0);
  const typeErrU = tl.channel('typeErrU', 0);
  const foldU = tl.channel('foldU', 0);
  const composeChipU = tl.channel('composeChipU', 0);
  const wireU = tl.channel('wireU', 0);
  const idxN = tl.channel('idxN', -1);
  const idxU = tl.channel('idxU', 0);
  const guardU = tl.channel('guardU', 0);
  const centerU = tl.channel('centerU', 0);
  const entryU = tl.channel('entryU', 0);
  const stageDim = tl.channel('stageDim', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · hook —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'An onion has to be built before anything can travel through it. Koa builds it in two moves: use collects your functions, and compose folds them into one.',
  });
  tl.tween(arrayU, 1, { at: 0.5, dur: 1.0, ease: ease.draw });
  tl.hold(6.5, 0.5);

  // — Beat 2 · use pushes —
  tl.caption({
    at: 7.0,
    dur: 6,
    text: "Every call to use does almost nothing. It checks that you handed it a function, and pushes it onto an array called middleware. That's the entire method.",
  });
  tl.tween(cardsU, 3, { at: 7.6, dur: 2.7, ease: ease.move });
  tl.hold(13.0, 0.5);

  // — Beat 3 · the TypeError bounce —
  tl.caption({
    at: 13.5,
    dur: 5.4,
    text: 'Hand it anything else and it throws immediately: middleware must be a function. The array stays clean.',
  });
  tl.tween(badU, 1, { at: 14.1, dur: 1.6, ease: ease.move });
  tl.tween(typeErrU, 1, { at: 15.0, dur: 0.5, ease: ease.pop });
  tl.tween(typeErrU, 0, { at: 18.0, dur: 0.8, ease: ease.move });
  tl.hold(18.9, 0.4);

  // — Beat 4 · a flat, ordered list —
  tl.caption({
    at: 19.3,
    dur: 5.6,
    text: "So after three calls to use, the app holds a flat list: function zero, function one, function two. Order matters — it's the order you registered them.",
  });
  tl.tween(cam, CAM_WIDE, { at: 19.5, dur: 1.6, ease: ease.move });
  tl.hold(24.9, 0.5);

  // — Beat 5 · the fold (centerpiece) —
  tl.caption({
    at: 25.4,
    dur: 7,
    text: 'Then, once, when the server boots, callback hands that array to compose. Watch what compose returns: not a loop, but a single function that curls the list into rings.',
  });
  tl.tween(composeChipU, 1, { at: 26.0, dur: 0.7, ease: ease.enter });
  tl.tween(foldU, 1, { at: 27.2, dur: 3.6, ease: ease.move });
  tl.hold(32.4, 0.6);

  // — Beat 6 · dispatch —
  tl.caption({
    at: 33.0,
    dur: 5.6,
    text: 'Inside compose lives a tiny recursive engine called dispatch. Calling dispatch with an index runs that middleware — and hands it everything it needs.',
  });
  tl.tween(cam, CAM_RING, { at: 33.2, dur: 1.6, ease: ease.move });
  tl.hold(38.6, 0.4);

  // — Beat 7 · next is a handmade doorway —
  tl.caption({
    at: 39.0,
    dur: 7,
    text: "Here is the secret of next. Each middleware receives the context, plus dispatch bound to the following index. Next isn't magic — it's a handmade doorway to the ring just inside.",
  });
  tl.tween(wireU, 1, { at: 39.8, dur: 2.2, ease: ease.draw });
  tl.hold(46.0, 0.5);

  // — Beat 8 · the index guard —
  tl.caption({
    at: 46.5,
    dur: 6.6,
    text: 'Compose also keeps a private counter of the last index it entered. Call your doorway twice, and it rejects with: next called multiple times.',
  });
  tl.tween(idxU, 1, { at: 46.9, dur: 0.6, ease: ease.enter });
  tl.set(idxN, 0, 47.6);
  tl.set(idxN, 1, 48.4);
  tl.tween(guardU, 1, { at: 49.6, dur: 0.6, ease: ease.pop });
  tl.tween(guardU, 0.2, { at: 52.0, dur: 1.0, ease: ease.move });
  tl.hold(52.6, 0.5);

  // — Beat 9 · the empty center —
  tl.caption({
    at: 53.1,
    dur: 6.6,
    text: 'And when the index walks off the end of the array, there is no function left. Dispatch just returns a promise that is already resolved — the calm, empty center of the onion.',
  });
  tl.tween(cam, CAM_CENTER, { at: 53.3, dur: 1.8, ease: ease.move });
  tl.set(idxN, 2, 54.0);
  tl.set(idxN, 3, 54.8);
  tl.tween(centerU, 1, { at: 55.4, dur: 1.2, ease: ease.draw });
  tl.hold(59.7, 0.5);

  // — Beat 10 · built once, reused forever —
  tl.caption({
    at: 60.2,
    dur: 5.8,
    text: 'So the expensive thinking happens exactly once per application. Every request after that reuses the same folded function, starting at dispatch zero.',
  });
  tl.tween(cam, CAM_WIDE, { at: 60.4, dur: 1.8, ease: ease.move });
  tl.tween(entryU, 1, { at: 61.6, dur: 1.4, ease: ease.draw });
  tl.hold(66.0, 0.5);

  // — Beat 11 · payoff —
  tl.caption({
    at: 66.5,
    dur: 6,
    text: 'One array, one fold, one entry point. Next chapter we send a request through, and watch every middleware run in two halves.',
  });
  tl.tween(stageDim, 0.15, { at: 66.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 68.0, dur: 0.9, ease: ease.enter });
  tl.hold(71.6, 1.6);

  return {
    tl,
    cam,
    arrayU,
    cardsU,
    badU,
    typeErrU,
    foldU,
    composeChipU,
    wireU,
    idxN,
    idxU,
    guardU,
    centerU,
    entryU,
    stageDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function CodeChip({ x, y, text, u, color }: { x: number; y: number; text: string; u: number; color?: string }) {
  if (u <= 0) return null;
  const w = text.length * 7.4 + 22;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={y - 13} width={w} height={26} rx={6} fill={colors.PANEL} stroke={color ?? colors.GRID} />
      <text x={x} y={y + 4} textAnchor="middle" fill={color ?? colors.MUTED} fontSize={12} fontFamily="monospace">
        {text}
      </text>
    </g>
  );
}

// one middleware card, morphing from its array slot onto its ring
function MiddlewareCard({ i, enterU, foldP }: { i: number; enterU: number; foldP: number }) {
  if (enterU <= 0) return null;
  const slot = { x: ARRAY_X, y: ARRAY_Y0 + i * ARRAY_DY };
  const chip = chipPos(i);
  // sweep with a vertical lift so the cards arc over instead of sliding flat
  const x = lerp(slot.x, chip.x, foldP);
  const y = lerp(slot.y, chip.y, foldP) - 70 * Math.sin(Math.PI * foldP);
  const w = lerp(CARD_W, 86, foldP);
  const h = lerp(CARD_H, 28, foldP);
  const c = RING_COLORS[i];
  return (
    <g opacity={enterU} transform={`translate(${x}, ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={colors.PANEL} stroke={c} strokeWidth={1.4} />
      <text x={0} y={foldP > 0.5 ? 4.5 : -8} textAnchor="middle" fill={c} fontSize={foldP > 0.5 ? 13 : 15} fontFamily="monospace" fontWeight={700}>
        fn {i}
      </text>
      {foldP < 0.5 && (
        <text x={0} y={16} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={1 - foldP * 2}>
          async (ctx, next) =&gt; …
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const arrayU = s.get(scene.arrayU);
  const cardsU = s.get(scene.cardsU);
  const badU = s.get(scene.badU);
  const typeErrU = s.get(scene.typeErrU);
  const foldU = s.get(scene.foldU);
  const composeChipU = s.get(scene.composeChipU);
  const wireU = s.get(scene.wireU);
  const idxN = s.get(scene.idxN);
  const idxU = s.get(scene.idxU);
  const guardU = s.get(scene.guardU);
  const centerU = s.get(scene.centerU);
  const entryU = s.get(scene.entryU);
  const stageDim = s.get(scene.stageDim);
  const closeU = s.get(scene.closeU);

  // the bad card slides in and bounces off the array
  const badT = badU; // 0..1: 0→0.55 approach, 0.55→1 bounce back
  const badX = badT < 0.55 ? lerp(ARRAY_X - 320, ARRAY_X - 60, badT / 0.55) : lerp(ARRAY_X - 60, ARRAY_X - 300, (badT - 0.55) / 0.45);
  const badVisible = badU > 0 && badU < 1;

  const idxDisplay = idxN >= 3 ? '3 — off the end' : String(Math.round(idxN));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the array ---- */}
        <g opacity={arrayU * stageDim * (1 - 0.75 * clamp01(foldU * 2))}>
          <text x={ARRAY_X} y={ARRAY_Y0 - 78} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily="monospace">
            this.middleware = []
          </text>
          <CodeChip x={ARRAY_X} y={ARRAY_Y0 - 44} text="use(fn) → this.middleware.push(fn)" u={clamp01(cardsU)} />
          {/* the bracket */}
          <path
            d={`M ${ARRAY_X - CARD_W / 2 - 22} ${ARRAY_Y0 - 55} h -14 V ${ARRAY_Y0 + 2 * ARRAY_DY + 55} h 14`}
            fill="none"
            stroke={colors.GRID}
            strokeWidth={2}
          />
          <path
            d={`M ${ARRAY_X + CARD_W / 2 + 22} ${ARRAY_Y0 - 55} h 14 V ${ARRAY_Y0 + 2 * ARRAY_DY + 55} h -14`}
            fill="none"
            stroke={colors.GRID}
            strokeWidth={2}
          />
        </g>

        {/* ---- the three middleware cards (array slots → rings) ---- */}
        {[0, 1, 2].map((i) => (
          <MiddlewareCard key={i} i={i} enterU={clamp01(cardsU - i)} foldP={clamp01(foldU * 1.9 - i * 0.45)} />
        ))}

        {/* ---- the non-function bounce ---- */}
        {badVisible && (
          <g>
            <g transform={`translate(${badX}, ${ARRAY_Y0 + ARRAY_DY})`} opacity={0.9}>
              <rect x={-70} y={-24} width={140} height={48} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.4} strokeDasharray="5 4" />
              <text x={0} y={5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                'not a function'
              </text>
            </g>
            <CodeChip
              x={ARRAY_X - 160}
              y={ARRAY_Y0 + ARRAY_DY - 62}
              text="TypeError: middleware must be a function!"
              u={typeErrU}
              color={colors.NEGATIVE}
            />
          </g>
        )}

        {/* ---- compose chip ---- */}
        <CodeChip
          x={620}
          y={112}
          text="callback(): const fn = this.compose(this.middleware)"
          u={composeChipU * stageDim}
          color={colors.WARM}
        />

        {/* ---- the onion rings, drawn on as each card arrives ---- */}
        {RINGS.map((r, i) => {
          const p = clamp01(foldU * 1.9 - i * 0.45);
          const draw = clamp01(p * 1.4 - 0.35);
          if (draw <= 0) return null;
          const circ = 2 * Math.PI * r;
          return (
            <g key={i} opacity={stageDim}>
              <circle
                cx={ONION.x}
                cy={ONION.y}
                r={r}
                fill={RING_COLORS[i]}
                opacity={0.05 * draw}
              />
              <circle
                cx={ONION.x}
                cy={ONION.y}
                r={r}
                fill="none"
                stroke={RING_COLORS[i]}
                strokeWidth={1.6}
                opacity={0.8}
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - draw)}
                transform={`rotate(-90 ${ONION.x} ${ONION.y})`}
              />
            </g>
          );
        })}

        {/* ---- dispatch wiring: each ring's handmade `next` ---- */}
        {wireU > 0 && (
          <g opacity={stageDim}>
            {[0, 1].map((i) => {
              const u = clamp01(wireU * 2 - i);
              if (u <= 0) return null;
              const y0 = ONION.y - RINGS[i] + 18;
              const y1 = ONION.y - RINGS[i + 1] - 6;
              return (
                <g key={i} opacity={u}>
                  <line x1={ONION.x + 46} y1={y0} x2={ONION.x + 46} y2={lerp(y0, y1, u)} stroke={colors.TEXT} strokeWidth={2} />
                  <path d={`M ${ONION.x + 41} ${lerp(y0, y1, u) - 7} L ${ONION.x + 46} ${lerp(y0, y1, u)} L ${ONION.x + 51} ${lerp(y0, y1, u) - 7}`} fill="none" stroke={colors.TEXT} strokeWidth={2} />
                  <text x={ONION.x + 58} y={(y0 + y1) / 2 + 4} fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
                    next = dispatch.bind(null, {i + 1})
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ---- the index counter + guard ---- */}
        {idxU > 0 && (
          <g opacity={idxU * stageDim}>
            <rect x={ONION.x - RINGS[0] - 230} y={ONION.y - 40} width={196} height={80} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={ONION.x - RINGS[0] - 132} y={ONION.y - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
              last entered
            </text>
            <text x={ONION.x - RINGS[0] - 132} y={ONION.y + 18} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontFamily="monospace" fontWeight={700}>
              index = {idxDisplay}
            </text>
          </g>
        )}
        {guardU > 0 && (
          <g opacity={guardU}>
            {/* a second, illegal call back into ring 1 */}
            <path
              d={`M ${ONION.x - 60} ${ONION.y - RINGS[1] - 40} q -40 30 -8 52`}
              fill="none"
              stroke={colors.NEGATIVE}
              strokeWidth={2.5}
              strokeDasharray="6 5"
            />
            <CodeChip x={ONION.x - 130} y={ONION.y - RINGS[1] - 60} text="next() called multiple times" u={guardU} color={colors.NEGATIVE} />
          </g>
        )}

        {/* ---- the calm center ---- */}
        {centerU > 0 && (
          <g opacity={centerU * stageDim}>
            <circle cx={ONION.x} cy={ONION.y} r={44} fill={colors.WARM} opacity={0.12} />
            <circle cx={ONION.x} cy={ONION.y} r={44} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={0.8} />
            <text x={ONION.x} y={ONION.y - 2} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
              i === length
            </text>
            <text x={ONION.x} y={ONION.y + 16} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
              Promise.resolve()
            </text>
          </g>
        )}

        {/* ---- dispatch(0): the single entry point ---- */}
        {entryU > 0 && (
          <g opacity={entryU * stageDim}>
            <line
              x1={ONION.x - RINGS[0] - 150}
              y1={ONION.y + 120}
              x2={lerp(ONION.x - RINGS[0] - 150, ONION.x - RINGS[0] - 8, entryU)}
              y2={lerp(ONION.y + 120, ONION.y + 40, entryU)}
              stroke={colors.POSITIVE}
              strokeWidth={2.5}
            />
            <CodeChip x={ONION.x - RINGS[0] - 130} y={ONION.y + 150} text="fnMiddleware(ctx) → dispatch(0)" u={entryU} color={colors.POSITIVE} />
          </g>
        )}

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={370} y={250} width={540} height={112} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              one array · one fold
            </text>
            <text x={640} y={332} textAnchor="middle" fill={colors.ACCENT} fontSize={21} fontWeight={700}>
              one entry point: dispatch(0)
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
