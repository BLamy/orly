// The Held Request: live mode
//
// Grounding: packages/sync-service/lib/electric/shapes/api.ex (defstruct
// long_poll_timeout: 20_000, keepalive_interval: 21_000, max_age: 60,
// stale_age: 300; "For 'now' offset, return immediately with up-to-date
// message"; maybe_up_to_date → %{headers: %{control: "up-to-date"}}),
// packages/typescript-client/src/constants.ts (LIVE_QUERY_PARAM `live`,
// LIVE_CACHE_BUSTER_QUERY_PARAM `cursor`), client.ts ("Default exceeds
// Electric's 20s server long-poll timeout"), README ("The core sync protocol
// is based on a low-level HTTP API. This integrates with CDNs for
// highly-scalable data delivery.").
//
// Centerpiece: the held request — the client's live long-poll drawn as an
// arc that parks at Electric under a twenty-second TimerArc. Quiet timeout
// → empty up-to-date → re-park; then a write drops onto the tape mid-hold
// and the arc snaps back carrying the new entry. Closes with the CDN plate:
// cached catch-up reads fan out, only live holds reach Electric.
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
import { ServiceNode, TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — client left, Electric right, the tape along the bottom.
// ---------------------------------------------------------------------------

const CLIENT = { x: 180, y: 250 } as const;
const ELECTRIC = { x: 880, y: 230 } as const;
const CDN = { x: 520, y: 150 } as const;

const STORE = { x: 70, y: 330, w: 250, h: 190 } as const;
const TAPE = { x0: 140, x1: 1140, y: 560, h: 24 } as const;
const SEG_W = 58;
const segX = (i: number): number => TAPE.x0 + 30 + i * (SEG_W + 5);

// tape contents: 4 snapshot segs (ch2), 1837_0 (ch3's update), 1912_0 (live insert)
const SEGS = [
  { off: '0_0', kind: 'snap' },
  { off: '0_1', kind: 'snap' },
  { off: '0_2', kind: 'snap' },
  { off: '0_3', kind: 'snap' },
  { off: '1837_0', kind: 'update' },
  { off: '1912_0', kind: 'insert' },
] as const;

// playU: 0 = end of snapshot · 1 = past 1837_0 · 2 = past 1912_0
const playheadX = (p: number): number => {
  const marks = [segX(3) + SEG_W, segX(4) + SEG_W, segX(5) + SEG_W];
  if (p <= 0) return marks[0];
  if (p >= 2) return marks[2];
  const i = Math.floor(p);
  return marks[i] + (marks[i + 1] - marks[i]) * (p - i);
};

// the held arc: client → up and over → Electric
const ARC = `M ${CLIENT.x + 60} ${CLIENT.y - 10} C ${CLIENT.x + 240} ${CLIENT.y - 130}, ${ELECTRIC.x - 260} ${ELECTRIC.y - 120}, ${ELECTRIC.x - 62} ${ELECTRIC.y - 4}`;
const ARC_BACK = `M ${ELECTRIC.x - 62} ${ELECTRIC.y + 24} C ${ELECTRIC.x - 240} ${ELECTRIC.y + 130}, ${CLIENT.x + 240} ${CLIENT.y + 140}, ${CLIENT.x + 66} ${CLIENT.y + 30}`;

// store rows across the chapter
const BASE_ROWS = [
  { id: 41, title: 'Ship the demo', status0: 'doing', status1: 'done' },
  { id: 27, title: 'Write eval suite', status0: 'todo', status1: 'todo' },
  { id: 55, title: 'Wire the webhook', status0: 'doing', status1: 'doing' },
  { id: 62, title: 'Review agent logs', status0: 'todo', status1: 'todo' },
] as const;
const NEW_ROW = { id: 73, title: 'Fix flaky test', status: 'todo' } as const;

// camera marks
const CAM_PAIR: CameraState = { x: 540, y: 320, k: 1.12 };
const CAM_HOLD: CameraState = { x: 760, y: 240, k: 1.3 };
const CAM_TAPE: CameraState = { x: 620, y: 480, k: 1.25 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~99s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PAIR, cameraInterp);

  const nodesU = tl.channel('nodesU', 0); // client + Electric + store + tape
  const pollU = tl.channel('pollU', 0); // strawman poll arcs, 0..3
  const pollDimU = tl.channel('pollDimU', 0); // strawman fades away
  const catchU = tl.channel('catchU', 0); // catch-up round trip
  const playU = tl.channel('playU', 0); // playhead position 0..2
  const flipU = tl.channel('flipU', 0); // row 41 flips to done
  const parkU = tl.channel('parkU', 0); // the live arc parks
  const chipU = tl.channel('chipU', 0); // the live params chip
  const timerU = tl.channel('timerU', 0); // twenty-second TimerArc sweep
  const emptyU = tl.channel('emptyU', 0); // empty up-to-date returns, re-park
  const timer2U = tl.channel('timer2U', 0); // second hold's timer (partial)
  const writeU = tl.channel('writeU', 0); // the insert drops onto the tape
  const releaseU = tl.channel('releaseU', 0); // arc snaps back with the entry
  const applyU = tl.channel('applyU', 0); // new row lands in the store
  const park2U = tl.channel('park2U', 0); // parks again
  const cdnU = tl.channel('cdnU', 0); // CDN plate + client fleet
  const dimU = tl.channel('dimU', 0); // quiet the stage for the close
  const closeU = tl.channel('closeU', 0); // closing panel

  // — beat 1 · the strawman: polling —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'The naive way to stay fresh is to ask on a timer. Ask, hear nothing. Ask, hear nothing. Wasteful when quiet, and still laggy when busy.',
  });
  tl.tween(nodesU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(pollU, 3, { at: 2.0, dur: 4.4, ease: ease.linear });
  tl.hold(6.7, 0.5);

  // — beat 2 · close the chapter-three gap —
  tl.caption({
    at: 7.2,
    dur: 6.0,
    text: 'First, our client closes the gap from chapter three. It asks from its bookmark, and the missed update comes straight back: the demo shipped.',
  });
  tl.tween(pollDimU, 1, { at: 7.4, dur: 0.8, ease: ease.enter });
  tl.tween(catchU, 1, { at: 8.0, dur: 2.6, ease: ease.move });
  tl.tween(playU, 1, { at: 9.8, dur: 1.0, ease: ease.move });
  tl.tween(flipU, 1, { at: 10.4, dur: 0.6, ease: ease.pop });
  tl.hold(13.2, 0.6);

  // — beat 3 · this time, Electric holds the request —
  tl.caption({
    at: 13.8,
    dur: 6.4,
    text: 'Then it asks again — and this time there’s nothing new. So with live mode set, Electric doesn’t answer with emptiness. It simply holds the request open.',
  });
  tl.tween(cam, CAM_HOLD, { at: 14.0, dur: 1.3, ease: ease.move });
  tl.tween(parkU, 1, { at: 15.2, dur: 1.6, ease: ease.draw });
  tl.tween(chipU, 1, { at: 17.0, dur: 0.7, ease: ease.enter });
  tl.hold(20.2, 0.6);

  // — beat 4 · the twenty-second heartbeat —
  tl.caption({
    at: 20.8,
    dur: 7.2,
    text: 'A timer starts: twenty seconds by default. If nothing happens, an empty up-to-date response comes back and the client immediately parks a new request. That quiet heartbeat is all an idle shape costs.',
  });
  tl.tween(timerU, 1, { at: 21.2, dur: 3.6, ease: ease.linear });
  tl.tween(emptyU, 1, { at: 25.0, dur: 1.6, ease: ease.move });
  tl.hold(28.0, 0.6);

  // — beat 5 · a write lands mid-hold —
  tl.caption({
    at: 28.6,
    dur: 6.4,
    text: 'Now somebody adds a task. The change runs the whole chapter-three pipeline and lands on our tape — while the request is parked.',
  });
  tl.tween(timer2U, 0.4, { at: 29.0, dur: 2.4, ease: ease.linear });
  tl.tween(cam, CAM_TAPE, { at: 29.2, dur: 1.3, ease: ease.move });
  tl.tween(writeU, 1, { at: 31.0, dur: 1.4, ease: ease.move });
  tl.hold(35.0, 0.5);

  // — beat 6 · the release —
  tl.caption({
    at: 35.5,
    dur: 5.2,
    text: 'The parked request releases instantly, carrying the new entry down to the client.',
  });
  tl.tween(cam, CAM_PAIR, { at: 35.7, dur: 1.2, ease: ease.move });
  tl.tween(releaseU, 1, { at: 36.5, dur: 1.6, ease: ease.move });
  tl.hold(40.7, 0.5);

  // — beat 7 · apply: postgres to screen —
  tl.caption({
    at: 41.2,
    dur: 6.0,
    text: 'The client applies it, and the playhead catches the head of the tape. Postgres to screen in well under a second — and no poll ever fired.',
  });
  tl.tween(applyU, 1, { at: 41.8, dur: 0.8, ease: ease.pop });
  tl.tween(playU, 2, { at: 42.4, dur: 1.0, ease: ease.move });
  tl.hold(47.2, 0.6);

  // — beat 8 · the loop —
  tl.caption({
    at: 47.8,
    dur: 5.2,
    text: 'Then it parks again. Live mode is just this loop: hold, release on change, hold again.',
  });
  tl.tween(park2U, 1, { at: 48.4, dur: 1.4, ease: ease.draw });
  tl.hold(53.0, 0.7);

  // — beat 9 · the CDN fan-out —
  tl.caption({
    at: 53.7,
    dur: 7.4,
    text: 'And because every chunk is plain cacheable web traffic, the catch-up reads can be served by a content delivery network. A thousand new clients replay the same cached tape; only the live holds reach Electric.',
  });
  tl.tween(cam, CAM_WIDE, { at: 53.9, dur: 1.4, ease: ease.move });
  tl.tween(cdnU, 1, { at: 54.7, dur: 2.0, ease: ease.enter });
  tl.hold(61.1, 0.7);

  // — beat 10 · the close —
  tl.caption({
    at: 61.8,
    dur: 6.0,
    text: 'One held request per client, one write fanned out to everyone watching. That’s the delivery half of the machine.',
  });
  tl.tween(dimU, 1, { at: 62.2, dur: 1.1, ease: ease.move });
  tl.tween(closeU, 1, { at: 63.4, dur: 0.8, ease: ease.enter });
  tl.hold(67.8, 1.5);

  return {
    tl,
    cam,
    nodesU,
    pollU,
    pollDimU,
    catchU,
    playU,
    flipU,
    parkU,
    chipU,
    timerU,
    emptyU,
    timer2U,
    writeU,
    releaseU,
    applyU,
    park2U,
    cdnU,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const STATUS_COLOR: Record<string, string> = {
  todo: colors.MUTED,
  doing: colors.ACCENT,
  done: colors.POSITIVE,
};

/** point along the held arc (approximate the cubic with sampled points) */
function arcPoint(u: number, back = false): { x: number; y: number } {
  // control points mirror the ARC path strings above
  const P = back
    ? [
        { x: ELECTRIC.x - 62, y: ELECTRIC.y + 24 },
        { x: ELECTRIC.x - 240, y: ELECTRIC.y + 130 },
        { x: CLIENT.x + 240, y: CLIENT.y + 140 },
        { x: CLIENT.x + 66, y: CLIENT.y + 30 },
      ]
    : [
        { x: CLIENT.x + 60, y: CLIENT.y - 10 },
        { x: CLIENT.x + 240, y: CLIENT.y - 130 },
        { x: ELECTRIC.x - 260, y: ELECTRIC.y - 120 },
        { x: ELECTRIC.x - 62, y: ELECTRIC.y - 4 },
      ];
  const t = clamp01(u);
  const mt = 1 - t;
  return {
    x: mt * mt * mt * P[0].x + 3 * mt * mt * t * P[1].x + 3 * mt * t * t * P[2].x + t * t * t * P[3].x,
    y: mt * mt * mt * P[0].y + 3 * mt * mt * t * P[1].y + 3 * mt * t * t * P[2].y + t * t * t * P[3].y,
  };
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const nodesU = s.get(scene.nodesU);
  const pollU = s.get(scene.pollU);
  const pollDimU = s.get(scene.pollDimU);
  const catchU = s.get(scene.catchU);
  const playU = s.get(scene.playU);
  const flipU = s.get(scene.flipU);
  const parkU = s.get(scene.parkU);
  const chipU = s.get(scene.chipU);
  const timerU = s.get(scene.timerU);
  const emptyU = s.get(scene.emptyU);
  const timer2U = s.get(scene.timer2U);
  const writeU = s.get(scene.writeU);
  const releaseU = s.get(scene.releaseU);
  const applyU = s.get(scene.applyU);
  const park2U = s.get(scene.park2U);
  const cdnU = s.get(scene.cdnU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const stageDim = 1 - 0.85 * dimU;
  const phX = playheadX(playU);
  // the held arc is visible while parked (parkU), gone once released, back with park2U
  const arcOn = Math.max(parkU * (1 - releaseU), park2U);
  const timerNow = Math.max(timerU * (1 - emptyU), Math.min(timer2U, 1) * (1 - releaseU));
  const relPos = arcPoint(releaseU, true);
  const catchPos = arcPoint(catchU <= 0.5 ? catchU * 2 : 2 - catchU * 2, catchU > 0.5);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageDim}>
          {/* ------------------------------------------------ nodes */}
          <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="client" sublabel="live" u={nodesU} glow={arcOn} />
          <ServiceNode x={ELECTRIC.x} y={ELECTRIC.y} kind="server" label="Electric" sublabel="shapes/api.ex" u={nodesU} />

          {/* ------------------------------------------------ strawman polling */}
          <g opacity={clamp01(pollU * 3) * (1 - pollDimU)}>
            {[0, 1, 2].map((i) => {
              const u = clamp01(pollU - i);
              if (u <= 0) return null;
              const p = arcPoint(u <= 0.5 ? u * 2 : 2 - u * 2, u > 0.5);
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={5} fill="none" stroke={colors.MUTED} strokeWidth={1.6} />
                  {u > 0.45 && u < 0.98 && (
                    <text x={p.x + 14} y={p.y - 6} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                      nothing new
                    </text>
                  )}
                </g>
              );
            })}
            <text x={(CLIENT.x + ELECTRIC.x) / 2} y={CLIENT.y - 128} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
              poll · poll · poll
            </text>
          </g>

          {/* ------------------------------------------------ catch-up round trip */}
          {catchU > 0.01 && catchU < 0.99 && (
            <g>
              <circle cx={catchPos.x} cy={catchPos.y} r={6.5} fill={catchU > 0.5 ? colors.WARM : 'none'} stroke={catchU > 0.5 ? colors.BG : colors.ACCENT} strokeWidth={1.6} />
              {catchU > 0.55 && (
                <text x={catchPos.x + 14} y={catchPos.y - 8} fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
                  update id=41 → done
                </text>
              )}
            </g>
          )}

          {/* ------------------------------------------------ the held arc */}
          <g opacity={arcOn}>
            <path d={ARC} fill="none" stroke={colors.ACCENT} strokeWidth={2.2} strokeDasharray="1 0" opacity={0.9} />
            <circle cx={ELECTRIC.x - 70} cy={ELECTRIC.y - 8} r={6} fill={colors.ACCENT} />
            <text x={(CLIENT.x + ELECTRIC.x) / 2} y={CLIENT.y - 116} textAnchor="middle" fill={colors.ACCENT} fontSize={12}>
              parked — waiting inside Electric
            </text>
          </g>
          {/* live params chip */}
          <g opacity={chipU * (1 - 0.5 * releaseU)}>
            <rect x={340} y={CLIENT.y - 96} width={400} height={26} rx={8} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.2} />
            <text x={540} y={CLIENT.y - 78} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
              ?live=true&handle=62488107-…&offset=1837_0&cursor=…
            </text>
          </g>

          {/* the twenty-second timer */}
          <g opacity={arcOn * clamp01(timerNow * 8 + (timerNow > 0 ? 0.2 : 0))}>
            <TimerArc cx={ELECTRIC.x - 100} cy={ELECTRIC.y - 60} r={20} u={timerNow} color={timerNow > 0.9 ? colors.WARM : colors.ACCENT} />
            <text x={ELECTRIC.x - 100} y={ELECTRIC.y - 92} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              long_poll_timeout: 20_000
            </text>
          </g>

          {/* empty up-to-date returning (timeout path) */}
          {emptyU > 0.02 && emptyU < 0.98 && (
            <g>
              {(() => {
                const p = arcPoint(emptyU, true);
                return (
                  <g>
                    <rect x={p.x - 46} y={p.y - 12} width={92} height={22} rx={10} fill={colors.BG} stroke={colors.MUTED} strokeWidth={1.2} />
                    <text x={p.x} y={p.y + 3} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                      up-to-date · empty
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* the released response carrying the insert */}
          {releaseU > 0.02 && releaseU < 0.99 && (
            <g>
              <rect x={relPos.x - 56} y={relPos.y - 13} width={112} height={24} rx={7} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.4} />
              <text x={relPos.x} y={relPos.y + 3} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily={MONO}>
                insert id=73
              </text>
            </g>
          )}

          {/* ------------------------------------------------ the local store */}
          <g opacity={nodesU}>
            <rect x={STORE.x} y={STORE.y} width={STORE.w} height={STORE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={STORE.x + 16} y={STORE.y + 24} fill={colors.MUTED} fontSize={12}>
              local store
            </text>
            {BASE_ROWS.map((r, i) => {
              const status = r.id === 41 && flipU > 0.5 ? r.status1 : r.status0;
              return (
                <g key={r.id}>
                  <rect x={STORE.x + 12} y={STORE.y + 36 + i * 30} width={STORE.w - 24} height={24} rx={5} fill="rgba(56,189,248,0.07)" stroke={colors.GRID} />
                  <text x={STORE.x + 22} y={STORE.y + 53 + i * 30} fill={r.id === 41 ? colors.WARM : colors.TEXT} fontSize={11.5} fontFamily={MONO}>
                    {r.id}
                  </text>
                  <text x={STORE.x + 54} y={STORE.y + 53 + i * 30} fill={colors.TEXT} fontSize={11.5}>
                    {r.title}
                  </text>
                  <text x={STORE.x + STORE.w - 20} y={STORE.y + 53 + i * 30} textAnchor="end" fill={STATUS_COLOR[status]} fontSize={11} fontFamily={MONO}>
                    {status}
                  </text>
                  {r.id === 41 && flipU > 0.5 && flipU < 1 && (
                    <rect x={STORE.x + 12} y={STORE.y + 36 + i * 30} width={STORE.w - 24} height={24} rx={5} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={1 - flipU} />
                  )}
                </g>
              );
            })}
            {/* the live-inserted row */}
            <g opacity={applyU}>
              <rect x={STORE.x + 12} y={STORE.y + 36 + 4 * 30} width={STORE.w - 24} height={24} rx={5} fill="rgba(52,211,153,0.10)" stroke={colors.POSITIVE} strokeWidth={1.2} />
              <text x={STORE.x + 22} y={STORE.y + 53 + 4 * 30} fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
                {NEW_ROW.id}
              </text>
              <text x={STORE.x + 54} y={STORE.y + 53 + 4 * 30} fill={colors.TEXT} fontSize={11.5}>
                {NEW_ROW.title}
              </text>
              <text x={STORE.x + STORE.w - 20} y={STORE.y + 53 + 4 * 30} textAnchor="end" fill={STATUS_COLOR[NEW_ROW.status]} fontSize={11} fontFamily={MONO}>
                {NEW_ROW.status}
              </text>
            </g>
          </g>

          {/* ------------------------------------------------ the tape */}
          <g opacity={nodesU}>
            <text x={TAPE.x0} y={TAPE.y - 12} fill={colors.MUTED} fontSize={11.5}>
              the shape log
            </text>
            <rect x={TAPE.x0} y={TAPE.y} width={TAPE.x1 - TAPE.x0} height={TAPE.h} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            {SEGS.map((seg, i) => {
              const isLive = seg.kind === 'insert';
              const segU = isLive ? clamp01(writeU * 1.4) : 1;
              const color = seg.kind === 'snap' ? colors.ACCENT : seg.kind === 'update' ? colors.WARM : colors.POSITIVE;
              const fill = seg.kind === 'snap' ? 'rgba(56,189,248,0.18)' : seg.kind === 'update' ? 'rgba(251,191,36,0.2)' : 'rgba(52,211,153,0.2)';
              if (segU <= 0.01) return null;
              // the live insert drops in from above
              const dropY = isLive ? (1 - segU) * -46 : 0;
              return (
                <g key={seg.off} transform={`translate(0, ${dropY})`} opacity={segU}>
                  <rect x={segX(i)} y={TAPE.y + 3} width={SEG_W} height={TAPE.h - 6} rx={4} fill={fill} stroke={color} strokeWidth={1} />
                  <text x={segX(i) + SEG_W / 2} y={TAPE.y + TAPE.h + 15} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                    {seg.off}
                  </text>
                </g>
              );
            })}
            {/* the playhead */}
            <path d={`M ${phX - 7} ${TAPE.y - 15} L ${phX + 7} ${TAPE.y - 15} L ${phX} ${TAPE.y - 3} Z`} fill={colors.WARM} />
            <text x={phX} y={TAPE.y - 22} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily={MONO}>
              offset
            </text>
          </g>

          {/* ------------------------------------------------ the CDN plate */}
          <g opacity={cdnU}>
            <ServiceNode x={CDN.x} y={CDN.y} kind="cdn" label="CDN" sublabel="max-age=60" u={cdnU} />
            {/* the fleet of new clients */}
            {[0, 1, 2, 3].map((i) => {
              const cy = 420 + i * 28;
              return (
                <g key={i} opacity={win(cdnU, 4, i, 2)}>
                  <circle cx={64} cy={cy} r={8} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
                  <line x1={74} y1={cy} x2={CDN.x - 46} y2={CDN.y + 30} stroke={colors.ACCENT} strokeWidth={0.9} opacity={0.5} />
                </g>
              );
            })}
            <line x1={CDN.x + 48} y1={CDN.y + 6} x2={ELECTRIC.x - 66} y2={ELECTRIC.y - 16} stroke={colors.ACCENT} strokeWidth={1.1} strokeDasharray="5 5" opacity={0.7} />
            <text x={CDN.x + 10} y={CDN.y + 62} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              cached chunks served here
            </text>
            <text x={(CDN.x + ELECTRIC.x) / 2 + 30} y={CDN.y - 6} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              only live holds pass through
            </text>
          </g>
        </g>

        {/* ------------------------------------------------ the closing panel */}
        <g opacity={closeU}>
          <rect x={300} y={240} width={680} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={600}>
            hold → release on change → hold again
          </text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={14.5}>
            one held request per client · one write fanned out to everyone
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
