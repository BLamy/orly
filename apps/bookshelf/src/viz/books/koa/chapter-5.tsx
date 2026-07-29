// Errors Ride the Way Back Out
//
// Backing files: __tests__/context/onerror.test.js — a handler sets
// ctx.body = 'something else', then ctx.throw(418, 'boom'); the reply is 418
// 'boom' with Vary / X-CSRF-Token stripped and err.headers (X-New-Header)
// applied; after headerSent the error is only emitted. lib/context.js
// onerror() — emit → remove every header → set err.headers → type text →
// status → res.end(msg). lib/application.js handleRequest() —
// fnMiddleware(ctx).then(handleResponse).catch(onerror) is the net at the
// rim. docs/error-handling.md — try/catch around await next; an error caught
// and not rethrown never reaches the app error listener.
//
// Centerpiece: the chapter-3 cross-section, now failing — a red rejection
// pulse climbs the same right-leg path through every pending await, into the
// net at the rim, and ctx.onerror rebuilds the response on camera.
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
// Layout — the onion cross-section on the left, the response workbench right.
// ---------------------------------------------------------------------------

const RIM_Y = 150;
const OUT = { l: 340, r: 720, top: 200, bot: 520 } as const; // the try/catch ring
const INN = { l: 440, r: 620, top: 278, bot: 448 } as const; // the throwing handler

const THROW_PT = { x: 530, y: 390 } as const;

// the rejection's climb (scenario A: nobody catches)
const PULSE: ReadonlyArray<readonly [number, number]> = [
  [THROW_PT.x, THROW_PT.y], // 0 — the throw
  [INN.r, 365], // 1 — the handler's pending await... (its own right leg)
  [INN.r, INN.top - 10], // 2 — out of the inner ring
  [OUT.r, 245], // 3 — through the outer ring's right leg (no catch)
  [OUT.r, OUT.top - 10], // 4 — out of the outer ring
  [745, RIM_Y], // 5 — the rim
  [928, RIM_Y], // 6 — into ctx.onerror
];

const pulseAt = (u: number): { x: number; y: number } => {
  const k = Math.min(Math.max(u, 0), PULSE.length - 1.0001);
  const i = Math.floor(k);
  const f = k - i;
  return { x: lerp(PULSE[i][0], PULSE[i + 1][0], f), y: lerp(PULSE[i][1], PULSE[i + 1][1], f) };
};

const bracketPath = (b: { l: number; r: number; top: number; bot: number }): string =>
  `M ${b.l} ${b.top} V ${b.bot} H ${b.r} V ${b.top}`;

const BENCH = { x: 1010, y: 330 } as const; // the response card

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_THROW: CameraState = { x: 560, y: 380, k: 1.45 };
const CAM_CLIMB: CameraState = { x: 680, y: 260, k: 1.3 };
const CAM_BENCH: CameraState = { x: 950, y: 300, k: 1.35 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  stageU: ChannelRef<number>; // rim + brackets + bench
  bodySetU: ChannelRef<number>; // 'something else' + status 200 on the card
  throwU: ChannelRef<number>; // the spark
  pulseU: ChannelRef<number>; // 0..6 climb
  netU: ChannelRef<number>; // the catch flash at the rim
  emitU: ChannelRef<number>; // app.emit('error')
  stripU: ChannelRef<number>; // headers fly off
  newHdrU: ChannelRef<number>; // err.headers applied
  fixU: ChannelRef<number>; // type text + status 418
  swapU: ChannelRef<number>; // body 'something else' → 'boom'
  tryU: ChannelRef<number>; // scenario B: the outer ring activates
  pulse2U: ChannelRef<number>; // 0..3, absorbed climb
  absorbU: ChannelRef<number>; // the catch at the outer ring
  lockU: ChannelRef<number>; // headerSent
  stageDim: ChannelRef<number>;
  recapU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const stageU = tl.channel('stageU', 0);
  const bodySetU = tl.channel('bodySetU', 0);
  const throwU = tl.channel('throwU', 0);
  const pulseU = tl.channel('pulseU', 0);
  const netU = tl.channel('netU', 0);
  const emitU = tl.channel('emitU', 0);
  const stripU = tl.channel('stripU', 0);
  const newHdrU = tl.channel('newHdrU', 0);
  const fixU = tl.channel('fixU', 0);
  const swapU = tl.channel('swapU', 0);
  const tryU = tl.channel('tryU', 0);
  const pulse2U = tl.channel('pulse2U', 0);
  const absorbU = tl.channel('absorbU', 0);
  const lockU = tl.channel('lockU', 0);
  const stageDim = tl.channel('stageDim', 1);
  const recapU = tl.channel('recapU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · set a body, then throw —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'Time to break the onion. Deep inside, a handler has already set a body — something else — when it hits trouble and calls ctx throw, with status four eighteen and the message boom.',
  });
  tl.tween(stageU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_THROW, { at: 1.2, dur: 2.0, ease: ease.move });
  tl.tween(bodySetU, 1, { at: 3.2, dur: 0.8, ease: ease.enter });
  tl.tween(throwU, 1, { at: 5.6, dur: 0.6, ease: ease.pop });
  tl.hold(7.5, 0.5);

  // — Beat 2 · a throw becomes a rejection —
  tl.caption({
    at: 8.0,
    dur: 6.4,
    text: "A throw inside an async function doesn't crash anything. It becomes a rejected promise — and a rejection travels exactly like a resolution: up, through every paused await.",
  });
  tl.tween(cam, CAM_CLIMB, { at: 8.4, dur: 1.8, ease: ease.move });
  tl.tween(pulseU, 2, { at: 9.0, dur: 2.6, ease: ease.move });
  tl.hold(14.4, 0.5);

  // — Beat 3 · each ring may catch, or pass —
  tl.caption({
    at: 14.9,
    dur: 5.4,
    text: 'Each middleware waiting on next now has a choice: catch the rejection, or let it keep climbing. Suppose nobody catches.',
  });
  tl.tween(pulseU, 4, { at: 15.5, dur: 2.2, ease: ease.move });
  tl.hold(20.3, 0.5);

  // — Beat 4 · the net at the rim —
  tl.caption({
    at: 20.8,
    dur: 6.6,
    text: 'At the very rim, chapter one left a net. When Koa launched the onion, it chained a then for success — and a catch that routes every escaped error into ctx onerror.',
  });
  tl.tween(cam, CAM_WIDE, { at: 21.0, dur: 1.8, ease: ease.move });
  tl.tween(pulseU, 6, { at: 22.0, dur: 2.2, ease: ease.move });
  tl.tween(netU, 1, { at: 24.4, dur: 0.6, ease: ease.pop });
  tl.hold(27.4, 0.5);

  // — Beat 5 · onerror step one: emit —
  tl.caption({
    at: 27.9,
    dur: 5.8,
    text: 'The first thing onerror does is tell the app. It emits an error event, so your listener — or the default logger — hears about every error that escapes the stack.',
  });
  tl.tween(cam, CAM_BENCH, { at: 28.1, dur: 1.6, ease: ease.move });
  tl.tween(emitU, 1, { at: 29.3, dur: 1.2, ease: ease.draw });
  tl.hold(33.7, 0.5);

  // — Beat 6 · strip every header —
  tl.caption({
    at: 34.2,
    dur: 6.2,
    text: 'Then it cleans the crime scene. Every header already set on the response is removed — the vary header, the custom token, all of it — so a half built answer cannot leak.',
  });
  tl.tween(stripU, 1, { at: 35.2, dur: 1.8, ease: ease.move });
  tl.hold(40.4, 0.5);

  // — Beat 7 · the error's own headers, text, 418 —
  tl.caption({
    at: 40.9,
    dur: 6.4,
    text: "Headers attached to the error itself are applied instead, the content type is forced to plain text, and the status becomes the error's own: four eighteen.",
  });
  tl.tween(newHdrU, 1, { at: 41.7, dur: 0.8, ease: ease.enter });
  tl.tween(fixU, 1, { at: 43.9, dur: 0.7, ease: ease.pop });
  tl.hold(47.3, 0.5);

  // — Beat 8 · the body swap —
  tl.caption({
    at: 47.8,
    dur: 6.6,
    text: "The body that middleware wrote earlier? Discarded. Because this error came from ctx throw, it's marked safe to expose, so the client reads the real message: boom.",
  });
  tl.tween(swapU, 1, { at: 48.8, dur: 1.0, ease: ease.move });
  tl.hold(54.4, 0.5);

  // — Beat 9 · that was the default handler —
  tl.caption({
    at: 54.9,
    dur: 5.6,
    text: "That's scenario one: the default handler, a try catch wrapped around the entire onion. Scenario two is better — catch it yourself.",
  });
  tl.tween(cam, CAM_WIDE, { at: 55.1, dur: 1.8, ease: ease.move });
  tl.hold(60.5, 0.4);

  // — Beat 10 · your own try/catch ring —
  tl.caption({
    at: 60.9,
    dur: 6.6,
    text: 'Any middleware can wrap its await next in a try catch. The official pattern sits at the outer ring, catches whatever climbs up, and shapes its own response — a status and a tidy body.',
  });
  tl.tween(tryU, 1, { at: 61.3, dur: 1.2, ease: ease.draw });
  tl.tween(pulse2U, 3, { at: 63.0, dur: 2.2, ease: ease.move });
  tl.tween(absorbU, 1, { at: 65.4, dur: 0.7, ease: ease.pop });
  tl.hold(67.9, 0.5);

  // — Beat 11 · caught means silent —
  tl.caption({
    at: 68.4,
    dur: 5.6,
    text: "Catch it and don't rethrow, and the story ends there — the app level error event never even fires. Koa's docs are explicit about that.",
  });
  tl.hold(74.0, 0.4);

  // — Beat 12 · the headerSent lock —
  tl.caption({
    at: 74.4,
    dur: 6.4,
    text: 'One edge case: if headers already left the socket, there is nothing left to rewrite. Onerror marks the error as header sent, emits the event, and quietly backs off.',
  });
  tl.tween(lockU, 1, { at: 75.4, dur: 0.8, ease: ease.enter });
  tl.hold(80.4, 0.5);

  // — Beat 13 · the recap: the whole machine —
  tl.caption({
    at: 80.9,
    dur: 8,
    text: 'And that is the whole machine. Use pushes, compose folds, the request dives, turns at the floor, and climbs back out — carrying your body on success, or a rejection that someone, somewhere, always catches.',
  });
  tl.tween(stageDim, 0.12, { at: 81.2, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 1, { at: 82.4, dur: 2.6, ease: ease.draw });
  tl.tween(closeU, 1, { at: 85.6, dur: 0.9, ease: ease.enter });
  tl.hold(88.9, 1.8);

  return {
    tl,
    cam,
    stageU,
    bodySetU,
    throwU,
    pulseU,
    netU,
    emitU,
    stripU,
    newHdrU,
    fixU,
    swapU,
    tryU,
    pulse2U,
    absorbU,
    lockU,
    stageDim,
    recapU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function HeaderRow({ y, name, value, gone, u, color }: { y: number; name: string; value: string; gone: number; u: number; color?: string }) {
  if (u <= 0) return null;
  return (
    <g opacity={u * (1 - gone)} transform={`translate(${gone * 150}, 0)`}>
      <rect x={-118} y={y - 12} width={236} height={24} rx={5} fill={colors.BG} stroke={colors.GRID} />
      <text x={-108} y={y + 4} fill={color ?? colors.MUTED} fontSize={10.5} fontFamily="monospace">
        {name}
      </text>
      <text x={108} y={y + 4} textAnchor="end" fill={color ?? colors.MUTED} fontSize={10.5} fontFamily="monospace">
        {value}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const stageU = s.get(scene.stageU);
  const bodySetU = s.get(scene.bodySetU);
  const throwU = s.get(scene.throwU);
  const pulseU = s.get(scene.pulseU);
  const netU = s.get(scene.netU);
  const emitU = s.get(scene.emitU);
  const stripU = s.get(scene.stripU);
  const newHdrU = s.get(scene.newHdrU);
  const fixU = s.get(scene.fixU);
  const swapU = s.get(scene.swapU);
  const tryU = s.get(scene.tryU);
  const pulse2U = s.get(scene.pulse2U);
  const absorbU = s.get(scene.absorbU);
  const lockU = s.get(scene.lockU);
  const stageDim = s.get(scene.stageDim);
  const recapU = s.get(scene.recapU);
  const closeU = s.get(scene.closeU);

  const p = pulseAt(pulseU);
  const pulseVisible = pulseU > 0.02 && pulseU < 5.9;
  const p2 = pulseAt(Math.min(pulse2U, 3));
  const pulse2Visible = pulse2U > 0.02 && absorbU < 0.7;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the rim: the net chapter one installed ---- */}
        <g opacity={stageU * stageDim}>
          <line x1={280} y1={RIM_Y} x2={760} y2={RIM_Y} stroke={colors.POSITIVE} strokeWidth={1.6} strokeDasharray="7 6" opacity={0.5 + 0.5 * netU} />
          <text x={280} y={RIM_Y - 34} fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
            fnMiddleware(ctx)
          </text>
          <text x={280} y={RIM_Y - 16} fill={netU > 0.3 ? colors.NEGATIVE : colors.MUTED} fontSize={11.5} fontFamily="monospace">
            .then(handleResponse).catch(onerror)
          </text>
        </g>

        {/* ---- the outer ring: your try/catch (ghost until scenario B) ---- */}
        <g opacity={stageU * (0.18 + 0.82 * tryU) * stageDim}>
          <path d={bracketPath(OUT)} fill="none" stroke={colors.POSITIVE} strokeWidth={22} opacity={0.09 + 0.1 * absorbU} strokeLinejoin="round" />
          <path d={bracketPath(OUT)} fill="none" stroke={colors.POSITIVE} strokeWidth={1.7} opacity={0.85} strokeLinejoin="round" />
          <text x={OUT.l - 10} y={OUT.top - 12} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
            try {'{'} await next() {'}'} catch (err) {'{'} … {'}'}
          </text>
        </g>

        {/* ---- the inner ring: the throwing handler ---- */}
        <g opacity={stageU * stageDim}>
          <path d={bracketPath(INN)} fill="none" stroke={colors.SECONDARY} strokeWidth={22} opacity={0.1} strokeLinejoin="round" />
          <path d={bracketPath(INN)} fill="none" stroke={colors.SECONDARY} strokeWidth={1.7} opacity={0.85} strokeLinejoin="round" />
          <text x={INN.l - 10} y={INN.top - 12} fill={colors.SECONDARY} fontSize={13}>
            the handler
          </text>
          <text x={THROW_PT.x} y={THROW_PT.y - 44} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="monospace" opacity={bodySetU}>
            ctx.body = 'something else'
          </text>
          <text x={THROW_PT.x} y={THROW_PT.y - 26} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily="monospace" opacity={throwU}>
            ctx.throw(418, 'boom')
          </text>
        </g>

        {/* the throw spark */}
        {throwU > 0 && (
          <g opacity={throwU}>
            <circle cx={THROW_PT.x} cy={THROW_PT.y} r={10 + 8 * (1 - throwU)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
            <circle cx={THROW_PT.x} cy={THROW_PT.y} r={5} fill={colors.NEGATIVE} />
          </g>
        )}

        {/* ---- the climbing rejection (scenario A) ---- */}
        {pulseVisible && (
          <g>
            <circle cx={p.x} cy={p.y} r={9} fill={colors.NEGATIVE} />
            <circle cx={p.x} cy={p.y} r={15} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} opacity={0.6} />
            <text x={p.x + 24} y={p.y + 4} fill={colors.NEGATIVE} fontSize={11} fontFamily="monospace">
              rejected
            </text>
          </g>
        )}

        {/* ---- scenario B: absorbed at the outer ring ---- */}
        {pulse2Visible && (
          <g>
            <circle cx={p2.x} cy={p2.y} r={9} fill={colors.NEGATIVE} />
            <circle cx={p2.x} cy={p2.y} r={15} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} opacity={0.6} />
          </g>
        )}
        {absorbU > 0 && (
          <g opacity={absorbU * stageDim}>
            <circle cx={OUT.r} cy={245} r={20} fill={colors.POSITIVE} opacity={0.2} />
            <circle cx={OUT.r} cy={245} r={20} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
            <text x={OUT.r - 30} y={585} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily="monospace">
              ctx.status = err.statusCode || 500 · ctx.body = {'{'} message {'}'}
            </text>
            <text x={OUT.r + 34} y={240} fill={colors.POSITIVE} fontSize={11.5} fontFamily="monospace">
              caught
            </text>
            <text x={OUT.r + 34} y={256} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
              no rethrow → no event
            </text>
          </g>
        )}

        {/* ---- ctx.onerror + the response workbench ---- */}
        <g opacity={stageU * stageDim}>
          {/* onerror box at the end of the rim */}
          <rect x={928} y={RIM_Y - 22} width={166} height={44} rx={9} fill={colors.PANEL} stroke={netU > 0.3 ? colors.NEGATIVE : colors.GRID} strokeWidth={1.5} />
          <text x={1011} y={RIM_Y + 5} textAnchor="middle" fill={netU > 0.3 ? colors.NEGATIVE : colors.MUTED} fontSize={13} fontFamily="monospace">
            ctx.onerror(err)
          </text>

          {/* the app, listening */}
          <rect x={758} y={44} width={150} height={40} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={833} y={69} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
            app.on('error')
          </text>
          {emitU > 0 && (
            <g opacity={emitU}>
              <line x1={960} y1={RIM_Y - 24} x2={lerp(960, 875, emitU)} y2={lerp(RIM_Y - 24, 88, emitU)} stroke={colors.WARM} strokeWidth={2} strokeDasharray="5 4" />
              <text x={955} y={106} fill={colors.WARM} fontSize={11} fontFamily="monospace">
                app.emit('error', err, this)
              </text>
            </g>
          )}

          {/* the response card */}
          <rect x={BENCH.x - 130} y={BENCH.y - 100} width={260} height={212} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={BENCH.x} y={BENCH.y - 76} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
            the response
          </text>
          <g transform={`translate(${BENCH.x}, 0)`}>
            {/* status row */}
            <g opacity={bodySetU}>
              <text x={-118} y={BENCH.y - 48} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                status
              </text>
              <text x={118} y={BENCH.y - 48} textAnchor="end" fill={fixU > 0.5 ? colors.NEGATIVE : colors.POSITIVE} fontSize={12} fontFamily="monospace" fontWeight={700}>
                {fixU > 0.5 ? '418' : '200'}
              </text>
            </g>
            {/* headers — stripped on stripU */}
            <HeaderRow y={BENCH.y - 20} name="Vary" value="Accept-Encoding" gone={clamp01(stripU * 1.6)} u={bodySetU} />
            <HeaderRow y={BENCH.y + 8} name="X-CSRF-Token" value="asdf" gone={clamp01(stripU * 1.6 - 0.4)} u={bodySetU} />
            {/* the error's own header lands */}
            <HeaderRow y={BENCH.y - 20} name="X-New-Header" value="Value" gone={0} u={newHdrU} color={colors.WARM} />
            {fixU > 0 && (
              <text x={-118} y={BENCH.y + 12} fill={colors.WARM} fontSize={10.5} fontFamily="monospace" opacity={fixU}>
                Content-Type: text plain
              </text>
            )}
            {/* the body */}
            <g opacity={bodySetU}>
              <rect x={-118} y={BENCH.y + 34} width={236} height={30} rx={5} fill={colors.BG} stroke={swapU > 0.5 ? colors.NEGATIVE : colors.GRID} />
              {swapU < 0.5 ? (
                <text x={0} y={BENCH.y + 54} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="monospace" opacity={1 - swapU}>
                  'something else'
                </text>
              ) : (
                <text x={0} y={BENCH.y + 54} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace" opacity={swapU}>
                  res.end('boom')
                </text>
              )}
            </g>
            {swapU > 0.5 && (
              <text x={0} y={BENCH.y + 88} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace" opacity={swapU}>
                err.expose → the real message ships
              </text>
            )}
          </g>

          {/* the headerSent lock */}
          {lockU > 0 && (
            <g opacity={lockU} transform={`translate(${BENCH.x}, ${BENCH.y + 136})`}>
              <rect x={-130} y={-16} width={260} height={32} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
              <text x={0} y={5} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily="monospace">
                headerSent → emit only, then back off
              </text>
            </g>
          )}
        </g>

        {/* ---- the recap: the whole machine, retraced ---- */}
        {recapU > 0 && (
          <g opacity={recapU}>
            <rect x={250} y={230} width={780} height={190} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            {(['use pushes', 'compose folds', 'dive', 'turn', 'climb', 'respond'] as const).map((word, i) => {
              const u = clamp01(recapU * 6 - i);
              const x = 330 + i * 125;
              return (
                <g key={word} opacity={u}>
                  <circle cx={x} cy={300} r={7} fill={i === 3 ? colors.WARM : colors.ACCENT} />
                  {i < 5 && <line x1={x + 12} y1={300} x2={x + 113} y2={300} stroke={colors.GRID} strokeWidth={2} />}
                  <text x={x} y={336} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
                    {word}
                  </text>
                </g>
              );
            })}
            <text x={640} y={388} textAnchor="middle" fill={colors.ACCENT} fontSize={17} opacity={closeU}>
              …and every rejection rides the same rings out, into a catch.
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
