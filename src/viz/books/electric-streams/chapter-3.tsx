// Live at the Tail
//
// Grounding: PROTOCOL.md §5.6 (Stream-Up-To-Date: true — caught up, NOT the
// end), §5.7 (long-poll: server parks the request, 200 with data or 204 No
// Content on timeout; closed streams return immediately), §5.8 (SSE: `event:
// data` chased by `event: control` with streamNextOffset/streamCursor;
// streamClosed ends the connection), §10 (cursor collapsing: time-bucketed
// cursors — server cursor.ts, DEFAULT_CURSOR_INTERVAL_SECONDS = 20 — let CDNs
// collapse identical waits into one origin request).
//
// Centerpiece: the tail of the tape feeding two live delivery machines at
// once — a long-poll gate where parked requests wait under a timer and spring
// open when an append lands, and a held-open server-sent-events pipe where
// data + control events slide down. Then a thousand readers collapse into one
// origin request, and closure caps the tape with an honest end-of-stream.
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
import type { CameraState, SceneState } from '../../core';
import { ServiceNode, TimerArc, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — the tape tail up top, long-poll lane left, SSE lane right.
// ---------------------------------------------------------------------------

const TAPE = { x0: 300, y: 200, cellW: 62, cellH: 44 } as const;
const cellX = (i: number): number => TAPE.x0 + i * TAPE.cellW;
const BASE = ['plan', 'run', 'logs', 'diff', 'patch', 'green'] as const; // already on the tape
const LIVE = ['ship', 'tag', 'done'] as const; // appended during the scene
const NB = BASE.length;
const TAIL_X = cellX(NB + LIVE.length); // after the last live cell

const GATE = { x: 420, y: 372 } as const; // the long-poll parking bracket
const LP_READER = { x: 330, y: 556 } as const;
const SSE_X = 900; // the held-open pipe
const SSE_READER = { x: 960, y: 556 } as const;
const RULER = { x0: 430, x1: 760, y: 470 } as const; // cursor interval ruler

const CAM_TAIL: CameraState = { x: 640, y: 260, k: 1.2 };
const CAM_LP: CameraState = { x: 480, y: 400, k: 1.3 };
const CAM_SSE: CameraState = { x: 930, y: 380, k: 1.28 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~92s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TAIL, cameraInterp);

  const tapeU = tl.channel('tapeU', 0); // tape + reader enter
  const upU = tl.channel('upU', 0); // Stream-Up-To-Date chip
  const pollU = tl.channel('pollU', 0); // naive polling hail (8 empty asks)
  const park1U = tl.channel('park1U', 0); // first long-poll request parks
  const timer1U = tl.channel('timer1U', 1); // its countdown (1 → 0.55 then spring)
  const app1U = tl.channel('app1U', 0); // append "ship" lands
  const springU = tl.channel('springU', 0); // gate springs, 200 + data returns
  const park2U = tl.channel('park2U', 0); // second request parks
  const timer2U = tl.channel('timer2U', 1); // runs all the way out
  const t204U = tl.channel('t204U', 0); // 204 goes home, reader re-asks
  const pipeU = tl.channel('pipeU', 0); // SSE pipe draws
  const ev1U = tl.channel('ev1U', 0); // data event slides down
  const ev2U = tl.channel('ev2U', 0); // control event chases it
  const ctlU = tl.channel('ctlU', 0); // control-payload spotlight
  const app2U = tl.channel('app2U', 0); // append "tag" lands (feeds both lanes)
  const crowdU = tl.channel('crowdU', 0); // a thousand readers funnel to one
  const rulerU = tl.channel('rulerU', 0); // cursor interval ruler
  const app3U = tl.channel('app3U', 0); // final append "done"
  const closeU = tl.channel('closeU', 0); // Stream-Closed end-cap, lanes retract
  const dimU = tl.channel('dimU', 0);
  const cardU = tl.channel('cardU', 0);

  // — beat 1 · caught up is not the end —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Our reader has caught up. It holds the tail offset, and the server says so: up to date. But up to date is not the end — it only means nothing more, yet.',
  });
  tl.tween(tapeU, 1, { at: 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(upU, 1, { at: 3.2, dur: 0.7, ease: ease.pop });
  tl.hold(6.7, 0.4);

  // — beat 2 · the naive tail: poll and burn —
  tl.caption({
    at: 7.1,
    dur: 5.8,
    text: 'The naive move is to keep asking. Poll every second, and you burn requests all night to learn, over and over, that nothing happened.',
  });
  tl.tween(pollU, 1, { at: 7.5, dur: 4.6, ease: ease.linear });
  tl.hold(12.9, 0.4);

  // — beat 3 · long poll: the request parks —
  tl.caption({
    at: 13.3,
    dur: 6.2,
    text: 'Long polling flips the cost. The reader asks once — and if there is nothing new, the server does not answer. It parks the request and holds it open.',
  });
  tl.tween(cam, CAM_LP, { at: 13.5, dur: 1.4, ease: ease.move });
  tl.tween(park1U, 1, { at: 14.2, dur: 1.2, ease: ease.move });
  tl.tween(timer1U, 0.55, { at: 15.6, dur: 3.6, ease: ease.linear });
  tl.hold(19.5, 0.4);

  // — beat 4 · an append springs the gate —
  tl.caption({
    at: 19.9,
    dur: 6.0,
    text: 'The moment an append lands, every parked request springs open, and the response leaves with the new data on board. The latency of a push, the shape of a plain request.',
  });
  tl.tween(cam, CAM_TAIL, { at: 20.1, dur: 1.2, ease: ease.move });
  tl.tween(app1U, 1, { at: 20.6, dur: 1.0, ease: ease.move });
  tl.tween(springU, 1, { at: 21.8, dur: 1.4, ease: ease.move });
  tl.hold(25.5, 0.4);

  // — beat 5 · timeout: 204, ask again —
  tl.caption({
    at: 25.9,
    dur: 6.2,
    text: 'If nothing arrives before the timeout, the server returns empty-handed — no content — and the reader simply asks again. Either way: no busy waiting, no burned requests.',
  });
  tl.tween(cam, CAM_LP, { at: 26.1, dur: 1.2, ease: ease.move });
  tl.tween(park2U, 1, { at: 26.6, dur: 1.0, ease: ease.move });
  tl.tween(timer2U, 0, { at: 27.8, dur: 2.4, ease: ease.linear });
  tl.tween(t204U, 1, { at: 30.4, dur: 1.2, ease: ease.move });
  tl.hold(31.7, 0.4);

  // — beat 6 · server-sent events: hold the response open —
  tl.caption({
    at: 32.1,
    dur: 6.0,
    text: 'The second live mode holds the response itself open. Server-sent events: one connection, and data flows down it the moment it exists.',
  });
  tl.tween(cam, CAM_SSE, { at: 32.3, dur: 1.4, ease: ease.move });
  tl.tween(pipeU, 1, { at: 32.9, dur: 1.3, ease: ease.draw });
  tl.tween(app2U, 1, { at: 34.6, dur: 1.0, ease: ease.move });
  tl.tween(ev1U, 1, { at: 35.8, dur: 1.6, ease: ease.move });
  tl.hold(37.7, 0.4);

  // — beat 7 · every data event is chased by a control event —
  tl.caption({
    at: 38.1,
    dur: 6.4,
    text: 'Every data event is chased by a control event carrying the next offset. Even mid-flight, the reader knows exactly where it stands — kill the tab, and it resumes to the byte.',
  });
  tl.tween(ev2U, 1, { at: 38.6, dur: 1.6, ease: ease.move });
  tl.tween(ctlU, 1, { at: 40.6, dur: 0.8, ease: ease.enter });
  tl.hold(44.1, 0.4);

  // — beat 8 · a thousand readers, one origin request —
  tl.caption({
    at: 44.5,
    dur: 6.2,
    text: 'Here is the quiet superpower: these are plain web requests, so a content delivery network can hold them too. A thousand readers park — exactly one request reaches the origin.',
  });
  tl.tween(cam, CAM_WIDE, { at: 44.7, dur: 1.4, ease: ease.move });
  tl.tween(ctlU, 0, { at: 44.7, dur: 0.8, ease: ease.enter });
  tl.tween(crowdU, 1, { at: 45.4, dur: 2.4, ease: ease.move });
  tl.hold(50.3, 0.4);

  // — beat 9 · the cursor makes collapsing safe —
  tl.caption({
    at: 50.7,
    dur: 6.2,
    text: 'A cursor makes that safe. The server buckets time into twenty-second intervals, hands every reader the same cursor, and identical waits collapse into identical cache keys.',
  });
  tl.tween(rulerU, 1, { at: 51.2, dur: 1.4, ease: ease.draw });
  tl.hold(56.5, 0.4);

  // — beat 10 · closure: quiet versus over —
  tl.caption({
    at: 56.9,
    dur: 6.4,
    text: 'And when the writer is done, it says so — it closes the stream. Readers at the tail get the closed signal instead of silence. That is the difference between quiet and over.',
  });
  tl.tween(app3U, 1, { at: 57.4, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 58.8, dur: 1.4, ease: ease.move });
  tl.tween(crowdU, 0, { at: 60.2, dur: 1.2, ease: ease.move });
  tl.hold(63.1, 0.4);

  // — beat 11 · recap —
  tl.caption({
    at: 63.5,
    dur: 6.6,
    text: 'So a durable stream is live in every direction. Catch up from any offset, tail the future in real time, and hear an honest end of stream. Next: making writes just as safe.',
  });
  tl.tween(dimU, 1, { at: 64.0, dur: 1.2, ease: ease.move });
  tl.tween(cardU, 1, { at: 65.4, dur: 0.9, ease: ease.pop });
  tl.hold(70.1, 1.8);

  return {
    tl, cam, tapeU, upU, pollU, park1U, timer1U, app1U, springU, park2U,
    timer2U, t204U, pipeU, ev1U, ev2U, ctlU, app2U, crowdU, rulerU, app3U,
    closeU, dimU, cardU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

/** Straight-line lerp between two points. */
const lerpP = (a: { x: number; y: number }, b: { x: number; y: number }, u: number) => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u,
});

const CROWD = [
  { x: 120, y: 600 }, { x: 205, y: 616 }, { x: 292, y: 605 },
  { x: 500, y: 615 }, { x: 585, y: 602 }, { x: 668, y: 614 },
] as const;

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const upU = s.get(scene.upU);
  const pollU = s.get(scene.pollU);
  const park1U = s.get(scene.park1U);
  const timer1U = s.get(scene.timer1U);
  const app1U = s.get(scene.app1U);
  const springU = s.get(scene.springU);
  const park2U = s.get(scene.park2U);
  const timer2U = s.get(scene.timer2U);
  const t204U = s.get(scene.t204U);
  const pipeU = s.get(scene.pipeU);
  const ev1U = s.get(scene.ev1U);
  const ev2U = s.get(scene.ev2U);
  const ctlU = s.get(scene.ctlU);
  const app2U = s.get(scene.app2U);
  const crowdU = s.get(scene.crowdU);
  const rulerU = s.get(scene.rulerU);
  const app3U = s.get(scene.app3U);
  const closeU = s.get(scene.closeU);
  const dimU = s.get(scene.dimU);
  const cardU = s.get(scene.cardU);

  const machineOp = 1 - 0.88 * dimU;
  const railX1 = TAIL_X + 30;

  // live appends land at cells NB, NB+1, NB+2
  const liveU = [app1U, app2U, app3U];

  // long-poll request/response travel
  const parked1 = park1U >= 1 && springU <= 0 ? 1 : 0;
  const req1 = lerpP({ x: LP_READER.x, y: LP_READER.y - 44 }, GATE, park1U);
  const resp1 = lerpP(GATE, { x: LP_READER.x, y: LP_READER.y - 44 }, springU);
  const req2 = lerpP({ x: LP_READER.x, y: LP_READER.y - 44 }, GATE, park2U);
  const resp2 = lerpP(GATE, { x: LP_READER.x, y: LP_READER.y - 44 }, t204U);

  // SSE events slide down the pipe
  const evY = (u: number): number => 320 + (SSE_READER.y - 96 - 320) * u;

  // naive-poll hail: 8 tiny round trips reader→gate→reader
  const hail = Array.from({ length: 8 }, (_, i) => {
    const u = win(pollU, 8, i, 1.4);
    if (u <= 0 || u >= 1) return null;
    const out = u < 0.5 ? u * 2 : 1 - (u - 0.5) * 2;
    return { p: lerpP({ x: LP_READER.x, y: LP_READER.y - 44 }, GATE, out), back: u >= 0.5, i };
  });
  const emptyAnswers = Math.min(8, Math.floor(pollU * 9.4 - 0.7 > 0 ? (pollU * (8 + 1.4) - 0.7) / 1 : 0));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the tape tail */}
        <g opacity={machineOp}>
          <Zone x={TAPE.x0 - 56} y={TAPE.y - 66} w={railX1 - TAPE.x0 + 130} h={158} label="the durable stream — at the tail" kind="group" u={tapeU} color={colors.TEAL} />
          <line x1={TAPE.x0 - TAPE.cellW / 2} y1={TAPE.y + TAPE.cellH / 2 + 10} x2={railX1 + 26} y2={TAPE.y + TAPE.cellH / 2 + 10} stroke={colors.GRID} strokeWidth={1.5} opacity={tapeU} />
          {BASE.map((m, i) => (
            <g key={i} opacity={tapeU}>
              <rect x={cellX(i) - TAPE.cellW / 2 + 3} y={TAPE.y - TAPE.cellH / 2} width={TAPE.cellW - 6} height={TAPE.cellH} rx={7} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} opacity={0.75} />
              <text x={cellX(i)} y={TAPE.y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
                {m}
              </text>
            </g>
          ))}
          {LIVE.map((m, i) => {
            const u = liveU[i];
            if (u <= 0) return null;
            const x = cellX(NB + i) - TAPE.cellW / 2 + 3;
            const drop = (1 - u) * (1 - u) * 70;
            return (
              <g key={`l${i}`} opacity={u}>
                <rect x={x} y={TAPE.y - TAPE.cellH / 2 - drop} width={TAPE.cellW - 6} height={TAPE.cellH} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
                <text x={x + (TAPE.cellW - 6) / 2} y={TAPE.y + 4 - drop} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
                  {m}
                </text>
              </g>
            );
          })}
          {/* the reader's tail playhead + up-to-date chip */}
          <g opacity={upU * machineOp}>
            <path d={`M ${cellX(NB) - TAPE.cellW / 2} ${TAPE.y - TAPE.cellH / 2 - 14} l 9 -14 l -18 0 Z`} fill={colors.POSITIVE} opacity={1 - clamp01(app1U * 2)} />
            <rect x={cellX(NB) - 130} y={TAPE.y - TAPE.cellH / 2 - 62} width={228} height={26} rx={8} fill={colors.BG} stroke={colors.POSITIVE} opacity={1 - clamp01(crowdU * 2)} />
            <text x={cellX(NB) - 16} y={TAPE.y - TAPE.cellH / 2 - 44} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO} opacity={1 - clamp01(crowdU * 2)}>
              Stream-Up-To-Date: true
            </text>
          </g>
          {/* closure end-cap */}
          <g opacity={closeU * machineOp}>
            <rect x={cellX(NB + 2) + TAPE.cellW / 2 + 6} y={TAPE.y - TAPE.cellH / 2 - 8} width={7} height={TAPE.cellH + 16} rx={3} fill={colors.NEGATIVE} />
            <rect x={cellX(NB + 2) - 60} y={TAPE.y - TAPE.cellH / 2 - 62} width={196} height={26} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} />
            <text x={cellX(NB + 2) + 38} y={TAPE.y - TAPE.cellH / 2 - 44} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
              Stream-Closed: true
            </text>
          </g>
        </g>

        {/* ---- long-poll lane ---- */}
        <g opacity={machineOp}>
          <ServiceNode x={LP_READER.x} y={LP_READER.y} kind="client" label="reader A" sublabel="live=long-poll" u={tapeU} />
          {/* the parking bracket */}
          <g opacity={clamp01(park1U * 3 + pollU * 3)}>
            <path d={`M ${GATE.x - 26} ${GATE.y - 20} l 0 40 M ${GATE.x + 26} ${GATE.y - 20} l 0 40`} stroke={colors.MUTED} strokeWidth={2.5} fill="none" />
            <text x={GATE.x} y={GATE.y + 42} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              held open
            </text>
          </g>
          {/* naive polling hail + counter */}
          {hail.map((h) => h && <circle key={h.i} cx={h.p.x} cy={h.p.y} r={5} fill={h.back ? 'none' : colors.ACCENT} stroke={colors.MUTED} strokeWidth={1.5} opacity={0.8} />)}
          <g opacity={pollU > 0.05 && park1U < 0.2 ? 1 : 0}>
            <text x={LP_READER.x + 120} y={LP_READER.y - 70} fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
              {`empty answers: ${Math.max(0, Math.min(8, emptyAnswers))}`}
            </text>
          </g>
          {/* request 1: parks, waits under the timer, springs with data */}
          {park1U > 0 && springU < 1 && (
            <g>
              {springU <= 0 ? (
                <circle cx={req1.x} cy={req1.y} r={8} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
              ) : (
                <g>
                  <circle cx={resp1.x} cy={resp1.y} r={9} fill={colors.WARM} />
                  <text x={resp1.x + 14} y={resp1.y - 8} fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
                    200 + ship
                  </text>
                </g>
              )}
              {parked1 > 0 && <TimerArc cx={GATE.x} cy={GATE.y - 44} r={16} u={timer1U} color={colors.ACCENT} />}
            </g>
          )}
          {/* request 2: timer runs out, 204 goes home */}
          {park2U > 0 && t204U < 1 && (
            <g>
              {t204U <= 0 ? (
                <circle cx={req2.x} cy={req2.y} r={8} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
              ) : (
                <g>
                  <circle cx={resp2.x} cy={resp2.y} r={8} fill="none" stroke={colors.MUTED} strokeWidth={2} />
                  <text x={resp2.x + 14} y={resp2.y - 8} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                    204 — ask again
                  </text>
                </g>
              )}
              {park2U >= 1 && t204U <= 0 && <TimerArc cx={GATE.x} cy={GATE.y - 44} r={16} u={timer2U} color={colors.MUTED} />}
            </g>
          )}
        </g>

        {/* ---- SSE lane ---- */}
        <g opacity={machineOp}>
          <ServiceNode x={SSE_READER.x} y={SSE_READER.y} kind="client" label="reader B" sublabel="live=sse" u={pipeU} />
          <g opacity={pipeU}>
            <line x1={SSE_X} y1={300} x2={SSE_X} y2={SSE_READER.y - 52} stroke={colors.SECONDARY} strokeWidth={2.5} strokeDasharray="1 0" opacity={0.9 * (1 - 0.7 * closeU)} />
            <text x={SSE_X + 12} y={318} fill={colors.SECONDARY} fontSize={11.5} fontFamily={MONO}>
              one held-open response
            </text>
          </g>
          {/* data event then control event slide down the pipe */}
          {ev1U > 0 && (
            <g opacity={Math.min(1, ev1U * 3) * (1 - 0.85 * closeU)}>
              <rect x={SSE_X - 132} y={evY(ev1U) - 13} width={120} height={26} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={SSE_X - 72} y={evY(ev1U) + 5} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
                event: data
              </text>
            </g>
          )}
          {ev2U > 0 && (
            <g opacity={Math.min(1, ev2U * 3) * (1 - 0.85 * closeU)}>
              <rect x={SSE_X - 148} y={evY(ev2U * 0.82) - 13} width={136} height={26} rx={8} fill={colors.PANEL} stroke={ctlU > 0.4 ? colors.WARM : colors.MUTED} strokeWidth={ctlU > 0.4 ? 2 : 1.2} />
              <text x={SSE_X - 80} y={evY(ev2U * 0.82) + 5} textAnchor="middle" fill={ctlU > 0.4 ? colors.WARM : colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                event: control
              </text>
            </g>
          )}
          {/* the control payload, spotlit */}
          <g opacity={ctlU}>
            <rect x={SSE_X + 26} y={396} width={286} height={64} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={SSE_X + 42} y={422} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
              {'{"streamNextOffset":'}
            </text>
            <text x={SSE_X + 42} y={444} fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
              {'  "01JQXK5V08", …}'}
            </text>
          </g>
          {/* closed control event */}
          <g opacity={closeU}>
            <rect x={SSE_X - 160} y={evY(0.5) - 13} width={186} height={26} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} />
            <text x={SSE_X - 67} y={evY(0.5) + 5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
              {'{"streamClosed":true}'}
            </text>
          </g>
        </g>

        {/* ---- the collapsing crowd ---- */}
        <g opacity={crowdU * (1 - closeU) * machineOp}>
          {CROWD.map((c, i) => (
            <g key={i}>
              <line x1={c.x} y1={c.y - 10} x2={GATE.x} y2={GATE.y + 8} stroke={colors.GRID} strokeWidth={1.2} />
              <circle cx={c.x} cy={c.y} r={7} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
            </g>
          ))}
          <text x={393} y={600} fill={colors.MUTED} fontSize={13}>
            …a thousand parked readers
          </text>
          <rect x={GATE.x + 46} y={GATE.y - 14} width={252} height={28} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
          <text x={GATE.x + 172} y={GATE.y + 5} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO}>
            collapsed: 1 request to origin
          </text>
        </g>

        {/* ---- the cursor ruler ---- */}
        <g opacity={rulerU * (1 - closeU) * machineOp}>
          <line x1={RULER.x0} y1={RULER.y} x2={RULER.x1} y2={RULER.y} stroke={colors.MUTED} strokeWidth={1.5} />
          {[0, 1, 2, 3].map((i) => {
            const x = RULER.x0 + ((RULER.x1 - RULER.x0) / 3) * i;
            return (
              <g key={i}>
                <line x1={x} y1={RULER.y - 6} x2={x} y2={RULER.y + 6} stroke={colors.MUTED} strokeWidth={1.5} />
                {i < 3 && (
                  <text x={x + (RULER.x1 - RULER.x0) / 6} y={RULER.y + 22} textAnchor="middle" fill={i === 1 ? colors.WARM : colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                    {`cursor=${1042 + i}`}
                  </text>
                )}
              </g>
            );
          })}
          <text x={(RULER.x0 + RULER.x1) / 2} y={RULER.y - 14} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
            time, in twenty-second buckets — same bucket, same cache key
          </text>
        </g>

        {/* closing card */}
        <g opacity={cardU}>
          <rect x={310} y={240} width={660} height={170} rx={16} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.5} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={700}>
            Live in every direction
          </text>
          <text x={640} y={332} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            catch up from any offset · park a long poll · hold a pipe of events
          </text>
          <text x={640} y={368} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>
            ?offset=… · live=long-poll · live=sse · Stream-Closed: true
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
