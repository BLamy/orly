// The Request Leaves a Trace
//
// Grounding: packages/effect/src/Tracer.ts — "A span records the lifetime of
// an operation, including its name, parent, attributes... and completion
// status"; SpanStatus Ended carries the exit the span completed with.
// packages/effect/src/Effect.ts — withSpan ("Wraps the effect with a child
// span for tracing"), annotateCurrentSpan, Effect.fn("Name.method") (traced
// functions, as in ai-docs 01_service.ts: Effect.fn("Database.query")).
// packages/effect/src/unstable/http/HttpTraceContext.ts — toHeaders emits
// `traceparent: 00-<traceId>-<spanId>-01` (+ compact b3); fromHeaders decodes
// an ExternalSpan parent. packages/effect/src/unstable/observability/
// OtlpTracer.ts — "Spans are batched using the configured interval and batch
// size" (default exportInterval 5 seconds, maxBatchSize 1000);
// OtlpExporter.ts — retry policy waits on 429 using the Retry-After header.
//
// Centerpiece: a SPAN WATERFALL that builds itself while the request runs
// above it — nesting = parenthood, color = exit, and the trace crosses the
// wire on a traceparent header before shipping to the collector in batches.
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
import { Connection, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The trace — bars open/close at fractions of one request-time unit.
// ---------------------------------------------------------------------------

type Span = {
  label: string;
  depth: number;
  open: number;
  close: number;
  color: string;
  remote?: boolean;
};

const SPANS: Span[] = [
  { label: 'handle request', depth: 0, open: 0.02, close: 0.97, color: colors.ACCENT },
  { label: 'UserRepository.findById', depth: 1, open: 0.06, close: 0.26, color: colors.POSITIVE },
  { label: 'charge customer', depth: 1, open: 0.32, close: 0.93, color: colors.ACCENT },
  { label: 'billing attempt 1', depth: 2, open: 0.34, close: 0.44, color: colors.NEGATIVE },
  { label: 'billing attempt 2', depth: 2, open: 0.5, close: 0.62, color: colors.NEGATIVE },
  { label: 'billing attempt 3', depth: 2, open: 0.68, close: 0.9, color: colors.POSITIVE },
  { label: 'POST /charges', depth: 3, open: 0.72, close: 0.86, color: colors.TEAL, remote: true },
];

const WF = { x0: 170, x1: 985, y0: 330, rowH: 39, barH: 24 };
const bx = (t: number) => WF.x0 + t * (WF.x1 - WF.x0);
const rowY = (i: number) => WF.y0 + i * WF.rowH;

// top strip: the live system
const HANDLER = { x: 300, y: 160 };
const BILLING = { x: 730, y: 160 };
const COLLECTOR = { x: 1080, y: 160 };
const BATCH = { x: 1022, y: 330, w: 160, h: 130 };

const CAM_WF: CameraState = { x: 600, y: 420, k: 1.2 };
const CAM_HOP: CameraState = { x: 620, y: 220, k: 1.3 };
const CAM_SHIP: CameraState = { x: 950, y: 300, k: 1.28 };

// ---------------------------------------------------------------------------
// Timeline (~75s, 12 beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const nodesU = tl.channel('nodesU', 0); // service nodes + waterfall frame
  const reqU = tl.channel('reqU', 0); // master request time 0..1
  const annU = tl.channel('annU', 0); // annotateCurrentSpan chip
  const hopU = tl.channel('hopU', 0); // packet handler → billing
  const tpU = tl.channel('tpU', 0); // traceparent chip on the packet
  const remLblU = tl.channel('remLblU', 0); // "same trace" flag on remote span
  const flyU = tl.channel('flyU', 0); // ended spans fly into the batch
  const shipU = tl.channel('shipU', 0); // batch → collector envelope
  const rateU = tl.channel('rateU', 0); // 429 + Retry-After retry pulse
  const recapU = tl.channel('recapU', 0);

  // — beat 1 · invisible work —
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Last chapter, our request failed twice and recovered — silently. In production, invisible work is future downtime. You need to see inside the request.',
  });
  tl.tween(nodesU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });

  // — beat 2 · a span opens —
  tl.caption({
    at: 6.8,
    dur: 5.6,
    text: 'Wrap an effect in a span, and it gets a name, a start, and an end. The moment the request enters, a bar opens on the trace.',
  });
  tl.tween(cam, CAM_WF, { at: 7.0, dur: 1.3, ease: ease.move });
  tl.tween(reqU, 0.12, { at: 7.6, dur: 3.6, ease: ease.linear });

  // — beat 3 · spans nest —
  tl.caption({
    at: 12.9,
    dur: 5.6,
    text: 'Calls nest, and so do spans. The repository lookup opens a child under the handler — the waterfall writes itself while the request runs.',
  });
  tl.tween(reqU, 0.3, { at: 13.1, dur: 5.0, ease: ease.linear });

  // — beat 4 · the retries, on the record —
  tl.caption({
    at: 19.0,
    dur: 6.0,
    text: 'And there are last chapter\'s retries: sibling spans under the billing call. Two ended in failure — a span records exactly how it ended, not just how long it took.',
  });
  tl.tween(reqU, 0.64, { at: 19.2, dur: 5.4, ease: ease.linear });

  // — beat 5 · annotate —
  tl.caption({
    at: 25.5,
    dur: 5.2,
    text: 'Attach evidence as you go: annotate the current span, and the user id rides along with the trace.',
  });
  tl.tween(annU, 1, { at: 26.1, dur: 0.8, ease: ease.pop });

  // — beat 6 · the request leaves the process —
  tl.caption({
    at: 31.2,
    dur: 5.4,
    text: 'Then the request leaves the process — a real network call to the billing service. Most tracing stories end at this boundary. This one does not.',
  });
  tl.tween(cam, CAM_HOP, { at: 31.4, dur: 1.3, ease: ease.move });
  tl.tween(reqU, 0.7, { at: 31.4, dur: 3.0, ease: ease.linear });
  tl.tween(hopU, 0.55, { at: 32.6, dur: 3.4, ease: ease.linear });

  // — beat 7 · traceparent —
  tl.caption({
    at: 37.0,
    dur: 5.6,
    text: 'The current span is encoded into a trace parent header that rides the request: sixteen bytes of trace id, eight bytes of span id, one sampling flag.',
  });
  tl.tween(tpU, 1, { at: 37.4, dur: 0.8, ease: ease.enter });
  tl.tween(hopU, 1, { at: 38.6, dur: 3.2, ease: ease.linear });

  // — beat 8 · one waterfall, two processes —
  tl.caption({
    at: 43.0,
    dur: 5.6,
    text: 'The billing service decodes it and parents its own span under ours. Two processes, one waterfall — you can follow the request across the wire.',
  });
  tl.tween(cam, CAM_WF, { at: 43.2, dur: 1.3, ease: ease.move });
  tl.tween(reqU, 1, { at: 43.4, dur: 4.6, ease: ease.linear });
  tl.tween(remLblU, 1, { at: 44.4, dur: 0.8, ease: ease.enter });

  // — beat 9 · spans queue in the batch —
  tl.caption({
    at: 49.0,
    dur: 5.6,
    text: 'Finished spans do not vanish. They queue in a batch inside the tracer, waiting with their timings and their verdicts.',
  });
  tl.tween(cam, CAM_SHIP, { at: 49.2, dur: 1.3, ease: ease.move });
  tl.tween(flyU, 1, { at: 49.8, dur: 3.4, ease: ease.linear });

  // — beat 10 · ship it —
  tl.caption({
    at: 55.0,
    dur: 5.6,
    text: 'Every five seconds, or every thousand spans, the batch ships to your collector over the open telemetry protocol.',
  });
  tl.tween(shipU, 1, { at: 55.6, dur: 2.6, ease: ease.linear });

  // — beat 11 · schedules all the way down —
  tl.caption({
    at: 61.0,
    dur: 5.8,
    text: 'And if the collector says slow down, the exporter waits and retries on a schedule of its own. The machinery is built from the parts you already know.',
  });
  tl.tween(rateU, 1, { at: 61.6, dur: 2.4, ease: ease.move });

  // — beat 12 · recap + hook —
  tl.caption({
    at: 67.2,
    dur: 6.4,
    text: 'Fibers, safe cancellation, retries with jitter — and now a trace of everything. One piece left: wiring it all into a service you can actually run.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 67.3, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 1, { at: 68.0, dur: 0.9, ease: ease.enter });
  tl.hold(73.0, 1.0);

  return { tl, cam, nodesU, reqU, annU, hopU, tpU, remLblU, flyU, shipU, rateU, recapU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const nodesU = s.get(scene.nodesU);
  const reqU = s.get(scene.reqU);
  const annU = s.get(scene.annU);
  const hopU = s.get(scene.hopU);
  const tpU = s.get(scene.tpU);
  const remLblU = s.get(scene.remLblU);
  const flyU = s.get(scene.flyU);
  const shipU = s.get(scene.shipU);
  const rateU = s.get(scene.rateU);
  const recapU = s.get(scene.recapU);

  const stageDim = 1 - recapU * 0.88;
  // packet: out during hopU 0..0.55, back during 0.62..1
  const outF = clamp01(hopU / 0.55);
  const backF = clamp01((hopU - 0.62) / 0.38);
  const pkt = {
    x: HANDLER.x + 62 + (BILLING.x - 124 - HANDLER.x) * (backF > 0 ? 1 - backF : outF),
    y: HANDLER.y,
  };
  const ended = SPANS.filter((sp) => reqU >= sp.close && !sp.remote);
  const arrived = Math.round(flyU * ended.length);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageDim}>
          {/* ---------------- the live system ---------------- */}
          <g opacity={nodesU}>
            <ServiceNode x={HANDLER.x} y={HANDLER.y} kind="server" label="api service" sublabel="handle request" u={nodesU} />
            <ServiceNode x={BILLING.x} y={BILLING.y} kind="external" label="billing svc" sublabel="POST /charges" u={nodesU} />
            <ServiceNode x={COLLECTOR.x} y={COLLECTOR.y} kind="storage" label="otel collector" sublabel="/v1/traces" u={nodesU} />
            <Connection from={{ x: HANDLER.x + 58, y: HANDLER.y }} to={{ x: BILLING.x - 58, y: BILLING.y }} u={nodesU} color={colors.GRID} />
          </g>

          {/* the hop packet + traceparent chip */}
          {hopU > 0.01 && hopU < 0.99 && (
            <g>
              <circle cx={pkt.x} cy={pkt.y} r={8} fill={backF > 0 ? colors.POSITIVE : colors.WARM} />
              {tpU > 0.01 && backF <= 0 && (
                <g opacity={tpU}>
                  <rect x={pkt.x - 150} y={pkt.y - 58} width={300} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} />
                  <text x={pkt.x} y={pkt.y - 38} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                    traceparent: 00-4bf9…2710-00f0…67-01
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---------------- the waterfall ---------------- */}
          <g opacity={nodesU}>
            <rect x={WF.x0 - 20} y={WF.y0 - 26} width={WF.x1 - WF.x0 + 40} height={SPANS.length * WF.rowH + 40} rx={12} fill={colors.PANEL} fillOpacity={0.45} stroke={colors.GRID} />
            <text x={WF.x0 - 6} y={WF.y0 - 34} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              trace 4bf92f3577b34da6a3ce929d0e0e4736
            </text>
            {SPANS.map((sp, i) => {
              const openU = clamp01((reqU - sp.open) / 0.02);
              if (openU <= 0) return null;
              const headT = Math.min(reqU, sp.close);
              const w = Math.max(3, bx(headT) - bx(sp.open));
              const closed = reqU >= sp.close;
              const y = rowY(i);
              const flown = !sp.remote && closed && ended.indexOf(sp) < arrived && flyU > 0.01;
              return (
                <g key={i} opacity={openU * (flown ? 0.35 : 1)}>
                  <text x={WF.x0 + sp.depth * 26 - 8} y={y + WF.barH / 2 + 4} textAnchor="end" fill={sp.remote ? colors.TEAL : colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                    {sp.label}
                  </text>
                  <rect x={bx(sp.open)} y={y} width={w} height={WF.barH} rx={6} fill={sp.color} opacity={closed ? 0.5 : 0.3} stroke={sp.color} strokeWidth={1.4} />
                  {!closed && reqU > sp.open && (
                    <circle cx={bx(headT)} cy={y + WF.barH / 2} r={4.5} fill={sp.color} />
                  )}
                  {closed && (
                    <text x={bx(sp.close) + 8} y={y + WF.barH / 2 + 4} fill={sp.color} fontSize={11}>
                      {sp.color === colors.NEGATIVE ? 'exit: fail' : sp.remote ? 'remote' : 'exit: ok'}
                    </text>
                  )}
                  {sp.remote && remLblU > 0.01 && (
                    <text x={bx(sp.open)} y={y - 5} fill={colors.TEAL} fontSize={11} opacity={remLblU} fontStyle="italic">
                      parented across the wire (external span)
                    </text>
                  )}
                </g>
              );
            })}
            {/* annotation chip */}
            {annU > 0.01 && (
              <g opacity={annU}>
                <rect x={bx(0.4)} y={rowY(0) - 3} width={172} height={22} rx={6} fill={colors.BG} stroke={colors.SECONDARY} />
                <text x={bx(0.4) + 86} y={rowY(0) + 12} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontFamily={MONO}>
                  user.id = 42 · attempt = 3
                </text>
              </g>
            )}
          </g>

          {/* ---------------- the batch + export ---------------- */}
          <g opacity={nodesU}>
            <rect x={BATCH.x} y={BATCH.y} width={BATCH.w} height={BATCH.h} rx={12} fill={colors.PANEL} stroke={rateU > 0.3 && rateU < 0.85 ? colors.WARM : colors.GRID} />
            <text x={BATCH.x + BATCH.w / 2} y={BATCH.y + 24} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
              OtlpTracer batch
            </text>
            <text x={BATCH.x + BATCH.w / 2} y={BATCH.y + 46} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              every 5s · max 1000
            </text>
            <text x={BATCH.x + BATCH.w / 2} y={BATCH.y + 84} textAnchor="middle" fill={colors.ACCENT} fontSize={26} fontWeight={700}>
              {Math.max(0, arrived - Math.round(shipU) * ended.length)}
            </text>
            <text x={BATCH.x + BATCH.w / 2} y={BATCH.y + 106} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              spans queued
            </text>
          </g>

          {/* spans flying into the batch */}
          {flyU > 0.01 &&
            ended.map((sp, k) => {
              const u = win(flyU, ended.length, k, 1.6);
              if (u <= 0 || u >= 1) return null;
              const i = SPANS.indexOf(sp);
              const x0 = bx(sp.close);
              const y0 = rowY(i) + WF.barH / 2;
              const x1 = BATCH.x + BATCH.w / 2;
              const y1 = BATCH.y + BATCH.h / 2;
              return (
                <rect
                  key={k}
                  x={x0 + (x1 - x0) * u - 12}
                  y={y0 + (y1 - y0) * u - Math.sin(Math.PI * u) * 40 - 4}
                  width={24}
                  height={8}
                  rx={3}
                  fill={sp.color}
                  opacity={0.9}
                />
              );
            })}

          {/* envelope to the collector */}
          {shipU > 0.01 && shipU < 0.99 && (
            <g>
              <rect
                x={BATCH.x + BATCH.w / 2 + (COLLECTOR.x - BATCH.x - BATCH.w / 2) * shipU - 14}
                y={BATCH.y - 10 + (COLLECTOR.y + 40 - BATCH.y) * shipU}
                width={28}
                height={18}
                rx={4}
                fill={colors.ACCENT}
              />
              <text
                x={BATCH.x + BATCH.w / 2 + (COLLECTOR.x - BATCH.x - BATCH.w / 2) * shipU}
                y={BATCH.y - 20 + (COLLECTOR.y + 40 - BATCH.y) * shipU}
                textAnchor="middle"
                fill={colors.MUTED}
                fontSize={10.5}
                fontFamily={MONO}
              >
                POST /v1/traces
              </text>
            </g>
          )}

          {/* 429 → Retry-After */}
          {rateU > 0.01 && (
            <g opacity={clamp01(rateU * 1.6) * (rateU > 0.92 ? (1 - rateU) / 0.08 : 1)}>
              <rect x={BATCH.x - 46} y={BATCH.y + BATCH.h + 14} width={252} height={40} rx={10} fill={colors.BG} stroke={colors.WARM} />
              <text x={BATCH.x + 80} y={BATCH.y + BATCH.h + 31} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                429 → wait Retry-After
              </text>
              <text x={BATCH.x + 80} y={BATCH.y + BATCH.h + 47} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                Schedule.forever + addDelay
              </text>
            </g>
          )}
        </g>

        {/* ---------------- recap ---------------- */}
        {recapU > 0.01 && (
          <g opacity={recapU}>
            <rect x={330} y={262} width={620} height={170} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={600}>
              the request leaves a trace
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily={MONO}>
              Effect.withSpan — every operation on the record
            </text>
            <text x={640} y={374} textAnchor="middle" fill={colors.WARM} fontSize={15} fontFamily={MONO}>
              HttpTraceContext — the trace crosses the wire
            </text>
            <text x={640} y={402} textAnchor="middle" fill={colors.TEAL} fontSize={15} fontFamily={MONO}>
              OtlpTracer — batched, shipped, observable
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
