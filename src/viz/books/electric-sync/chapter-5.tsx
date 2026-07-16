// Going Dark: offline, reconnect, must-refetch
//
// Grounding: packages/typescript-client/src/shape-stream-state.ts (the
// documented machine: "Initial ─response─► Syncing ─up-to-date─► Live",
// "Any state ─error─► Error ─retry─► (previous state)", "Any state
// ─markMustRefetch─► Initial (offset reset)", InitialState offset: `-1`),
// client.ts (onError retries use exponential backoff with full jitter),
// packages/sync-service/lib/electric/shapes/api/error.ex (@must_refetch
// %{headers: %{control: "must-refetch"}} served with 409),
// shape_cache/shape_status/shape_db/write_buffer.ex ("On reboot clients of
// the in-flight shapes will receive `must-refetch`"),
// typescript-client/src/expired-shapes-cache.ts (remembers expired handles).
//
// Centerpiece: the client's state machine as rail stations above the
// persistent tape. The cord is cut, the tape keeps growing, and the gap
// widens; reconnection replays just the gap from the bookmark. Then the
// harsher failure: the log is gone, a red must-refetch pill tears the tape
// away, the token snaps back to Initial, and a fresh tape spools under a
// new handle. Ends with a four-vignette recap of the whole book.
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
import { ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — the state rail on top, client/Electric mid, the tape at bottom.
// ---------------------------------------------------------------------------

const RAIL_Y = 110;
const ST_INITIAL = { x: 340, y: RAIL_Y } as const;
const ST_SYNCING = { x: 640, y: RAIL_Y } as const;
const ST_LIVE = { x: 940, y: RAIL_Y } as const;
const ST_ERROR = { x: 940, y: RAIL_Y + 74 } as const; // the parked/backoff satellite
const ST_W = 150;
const ST_H = 42;

const CLIENT = { x: 170, y: 300 } as const;
const ELECTRIC = { x: 930, y: 300 } as const;

const TAPE = { x0: 140, x1: 1140, y: 540, h: 24 } as const;
const SEG_W = 54;
const segX = (i: number): number => TAPE.x0 + 28 + i * (SEG_W + 5);

// tape at chapter start: snapshot + the two live entries from ch3/ch4
const OLD_SEGS = [
  { off: '0_0', kind: 'snap' },
  { off: '0_1', kind: 'snap' },
  { off: '0_2', kind: 'snap' },
  { off: '0_3', kind: 'snap' },
  { off: '1837_0', kind: 'update' },
  { off: '1912_0', kind: 'insert' },
] as const;
// what lands while we're offline
const GROW_SEGS = [{ off: '2041_0' }, { off: '2077_0' }] as const;
const N_OLD = OLD_SEGS.length;

const OLD_HANDLE = '62488107-…';
const NEW_HANDLE = '77103292-…';

// playU: 0 = past 1912_0 (caught up at ch4's end) · 1 = past 2077_0
const playheadX = (p: number): number => {
  const a = segX(N_OLD - 1) + SEG_W;
  const b = segX(N_OLD + 1) + SEG_W;
  return a + (b - a) * clamp01(p);
};

// camera marks
const CAM_RAIL: CameraState = { x: 640, y: 170, k: 1.25 };
const CAM_TAPE: CameraState = { x: 640, y: 460, k: 1.25 };
const CAM_PAIR: CameraState = { x: 560, y: 330, k: 1.08 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~103s, twelve beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PAIR, cameraInterp);

  const nodesU = tl.channel('nodesU', 0); // client, Electric, link, tape
  const railU = tl.channel('railU', 0); // the state rail
  const tokenX = tl.channel('tokenX', ST_LIVE.x); // the state token
  const tokenY = tl.channel('tokenY', ST_LIVE.y);
  const offlineU = tl.channel('offlineU', 0); // the cord is cut
  const backoffU = tl.channel('backoffU', 0); // retry dots pulse under Error
  const growU = tl.channel('growU', 0); // two segments land while dark
  const gapU = tl.channel('gapU', 0); // the gap brace
  const reconU = tl.channel('reconU', 0); // reconnect request (with bookmark)
  const deltaU = tl.channel('deltaU', 0); // the two delta chips replay
  const playU = tl.channel('playU', 0); // playhead catches up
  const expireU = tl.channel('expireU', 0); // "Electric restarted" — log gone
  const nineU = tl.channel('nineU', 0); // 409 + must-refetch pill
  const resetU = tl.channel('resetU', 0); // offset -1 chip + expired-handle note
  const tearU = tl.channel('tearU', 0); // old tape segments dissolve
  const respoolU = tl.channel('respoolU', 0); // fresh tape + new handle
  const recapU = tl.channel('recapU', 0); // four vignettes
  const dimU = tl.channel('dimU', 0); // quiet the stage
  const closeU = tl.channel('closeU', 0); // closing panel

  // — beat 1 · the promise of local-first —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Local first means the app keeps working when the network doesn’t. The client already holds its rows — offline just means the tape stops arriving.',
  });
  tl.tween(nodesU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(railU, 1, { at: 1.6, dur: 1.4, ease: ease.draw });
  tl.hold(6.5, 0.6);

  // — beat 2 · cut the cord —
  tl.caption({
    at: 7.1,
    dur: 4.8,
    text: 'So cut the cord. The live request dies mid-hold, and the client goes dark.',
  });
  tl.tween(offlineU, 1, { at: 7.7, dur: 0.9, ease: ease.pop });
  tl.tween(tokenX, ST_ERROR.x, { at: 8.8, dur: 0.8, ease: ease.move });
  tl.tween(tokenY, ST_ERROR.y, { at: 8.8, dur: 0.8, ease: ease.move });
  tl.hold(11.9, 0.6);

  // — beat 3 · the state machine —
  tl.caption({
    at: 12.5,
    dur: 6.6,
    text: 'The client-side stream is an explicit state machine: initial, syncing, live. Errors don’t crash it — they park it, and it retries with exponential backoff and jitter.',
  });
  tl.tween(cam, CAM_RAIL, { at: 12.7, dur: 1.3, ease: ease.move });
  tl.tween(backoffU, 3, { at: 14.0, dur: 4.6, ease: ease.linear });
  tl.hold(19.1, 0.6);

  // — beat 4 · the gap grows —
  tl.caption({
    at: 19.7,
    dur: 6.4,
    text: 'Meanwhile the world keeps writing. The shape log keeps growing, and the gap between the client’s playhead and the head of the tape is everything it missed.',
  });
  tl.tween(cam, CAM_TAPE, { at: 19.9, dur: 1.3, ease: ease.move });
  tl.tween(growU, 1, { at: 20.9, dur: 2.6, ease: ease.move });
  tl.tween(gapU, 1, { at: 23.9, dur: 1.0, ease: ease.move });
  tl.hold(26.1, 0.6);

  // — beat 5 · reconnect with the bookmark —
  tl.caption({
    at: 26.7,
    dur: 5.6,
    text: 'When the network returns, the client doesn’t start over. It presents its bookmark: the same handle, the same offset.',
  });
  tl.tween(cam, CAM_PAIR, { at: 26.9, dur: 1.2, ease: ease.move });
  tl.tween(offlineU, 0, { at: 27.3, dur: 0.8, ease: ease.enter });
  tl.tween(tokenX, ST_SYNCING.x, { at: 27.9, dur: 0.9, ease: ease.move });
  tl.tween(tokenY, ST_SYNCING.y, { at: 27.9, dur: 0.9, ease: ease.move });
  tl.tween(reconU, 1, { at: 28.7, dur: 1.6, ease: ease.move });
  tl.hold(32.3, 0.6);

  // — beat 6 · replay just the gap —
  tl.caption({
    at: 32.9,
    dur: 6.2,
    text: 'Electric replays just the gap — the missed entries, in order. Deltas, not a fresh snapshot. The playhead catches up, and the token slides back to live.',
  });
  tl.tween(deltaU, 1, { at: 33.5, dur: 2.2, ease: ease.linear });
  tl.tween(playU, 1, { at: 35.3, dur: 1.2, ease: ease.move });
  tl.tween(gapU, 0, { at: 35.3, dur: 0.9, ease: ease.enter });
  tl.tween(tokenX, ST_LIVE.x, { at: 36.9, dur: 0.9, ease: ease.move });
  tl.hold(39.1, 0.8);

  // — beat 7 · bookmarks can expire —
  tl.caption({
    at: 39.9,
    dur: 5.6,
    text: 'But bookmarks can expire. Suppose Electric restarted while we were away, and this shape’s log is simply gone.',
  });
  tl.tween(cam, CAM_WIDE, { at: 40.1, dur: 1.3, ease: ease.move });
  tl.tween(offlineU, 0.6, { at: 40.5, dur: 0.7, ease: ease.enter }); // brief blink
  tl.tween(offlineU, 0, { at: 42.4, dur: 0.7, ease: ease.enter });
  tl.tween(expireU, 1, { at: 41.3, dur: 1.4, ease: ease.move });
  tl.hold(45.5, 0.6);

  // — beat 8 · 409: must refetch —
  tl.caption({
    at: 46.1,
    dur: 5.6,
    text: 'Then the server answers with a conflict, and a single control message: must refetch. The tape you’re asking about no longer exists.',
  });
  tl.tween(nineU, 1, { at: 46.7, dur: 1.6, ease: ease.move });
  tl.hold(51.7, 0.6);

  // — beat 9 · any state → initial —
  tl.caption({
    at: 52.3,
    dur: 6.4,
    text: 'The client’s reaction is built into the state machine: from any state, must refetch resets it to initial — offset back to minus one, the old handle remembered as expired.',
  });
  tl.tween(tokenX, ST_INITIAL.x, { at: 53.1, dur: 1.1, ease: ease.move });
  tl.tween(tokenY, ST_INITIAL.y, { at: 53.1, dur: 1.1, ease: ease.move });
  tl.tween(resetU, 1, { at: 54.4, dur: 0.9, ease: ease.enter });
  tl.tween(tearU, 1, { at: 55.4, dur: 1.6, ease: ease.move });
  tl.hold(58.7, 0.6);

  // — beat 10 · a fresh tape —
  tl.caption({
    at: 59.3,
    dur: 6.2,
    text: 'It refetches the snapshot, gets a fresh handle, and spools a new tape. Same shape, new log — and the app above never saw an error.',
  });
  tl.tween(respoolU, 1, { at: 60.1, dur: 2.8, ease: ease.move });
  tl.tween(tokenX, ST_SYNCING.x, { at: 60.3, dur: 0.8, ease: ease.move });
  tl.tween(tokenX, ST_LIVE.x, { at: 63.1, dur: 0.8, ease: ease.move });
  tl.hold(65.5, 0.8);

  // — beat 11 · the recap —
  tl.caption({
    at: 66.3,
    dur: 8.0,
    text: 'And that’s the whole machine. A stencil cuts the shape, a snapshot spools the tape, the write-ahead log grows it, a held request delivers it, and the offset makes every interruption survivable.',
  });
  tl.tween(dimU, 1, { at: 66.5, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 1, { at: 67.5, dur: 3.6, ease: ease.enter });
  tl.hold(74.3, 0.6);

  // — beat 12 · the close —
  tl.caption({
    at: 74.9,
    dur: 6.6,
    text: 'Sync out of Postgres, over plain web requests, into anything you like. That’s Electric — and the rest of this series is what agents build on top of a database that’s already everywhere.',
  });
  tl.tween(closeU, 1, { at: 75.7, dur: 0.9, ease: ease.enter });
  tl.hold(81.5, 1.6);

  return {
    tl,
    cam,
    nodesU,
    railU,
    tokenX,
    tokenY,
    offlineU,
    backoffU,
    growU,
    gapU,
    reconU,
    deltaU,
    playU,
    expireU,
    nineU,
    resetU,
    tearU,
    respoolU,
    recapU,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Station({ at, label, active }: { at: { x: number; y: number }; label: string; active: boolean }) {
  return (
    <g>
      <rect
        x={at.x - ST_W / 2}
        y={at.y - ST_H / 2}
        width={ST_W}
        height={ST_H}
        rx={10}
        fill={active ? 'rgba(56,189,248,0.10)' : colors.PANEL}
        stroke={active ? colors.ACCENT : colors.GRID}
        strokeWidth={active ? 1.6 : 1.2}
      />
      <text x={at.x} y={at.y + 5} textAnchor="middle" fill={active ? colors.ACCENT : colors.MUTED} fontSize={14} fontFamily={MONO}>
        {label}
      </text>
    </g>
  );
}

const SEG_COLOR: Record<string, { stroke: string; fill: string }> = {
  snap: { stroke: colors.ACCENT, fill: 'rgba(56,189,248,0.18)' },
  update: { stroke: colors.WARM, fill: 'rgba(251,191,36,0.2)' },
  insert: { stroke: colors.POSITIVE, fill: 'rgba(52,211,153,0.2)' },
};

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const nodesU = s.get(scene.nodesU);
  const railU = s.get(scene.railU);
  const tokenX = s.get(scene.tokenX);
  const tokenY = s.get(scene.tokenY);
  const offlineU = s.get(scene.offlineU);
  const backoffU = s.get(scene.backoffU);
  const growU = s.get(scene.growU);
  const gapU = s.get(scene.gapU);
  const reconU = s.get(scene.reconU);
  const deltaU = s.get(scene.deltaU);
  const playU = s.get(scene.playU);
  const expireU = s.get(scene.expireU);
  const nineU = s.get(scene.nineU);
  const resetU = s.get(scene.resetU);
  const tearU = s.get(scene.tearU);
  const respoolU = s.get(scene.respoolU);
  const recapU = s.get(scene.recapU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const stageDim = 1 - 0.87 * dimU;
  const phX = playheadX(playU);
  const headX = segX(N_OLD - 1 + 2 * growU) + SEG_W; // tape head while growing
  const nearest = [ST_INITIAL, ST_SYNCING, ST_LIVE, ST_ERROR].reduce((a, b) =>
    Math.hypot(b.x - tokenX, b.y - tokenY) < Math.hypot(a.x - tokenX, a.y - tokenY) ? b : a
  );

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageDim}>
          {/* ------------------------------------------------ the state rail */}
          <g opacity={railU}>
            <text x={ST_INITIAL.x - ST_W / 2} y={RAIL_Y - 42} fill={colors.MUTED} fontSize={11.5}>
              the shape stream state machine
            </text>
            <line x1={ST_INITIAL.x + ST_W / 2} y1={RAIL_Y} x2={ST_SYNCING.x - ST_W / 2} y2={RAIL_Y} stroke={colors.GRID} strokeWidth={1.4} />
            <line x1={ST_SYNCING.x + ST_W / 2} y1={RAIL_Y} x2={ST_LIVE.x - ST_W / 2} y2={RAIL_Y} stroke={colors.GRID} strokeWidth={1.4} />
            <text x={(ST_INITIAL.x + ST_SYNCING.x) / 2} y={RAIL_Y - 10} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
              response
            </text>
            <text x={(ST_SYNCING.x + ST_LIVE.x) / 2} y={RAIL_Y - 10} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
              up-to-date
            </text>
            <Station at={ST_INITIAL} label="Initial" active={nearest === ST_INITIAL} />
            <Station at={ST_SYNCING} label="Syncing" active={nearest === ST_SYNCING} />
            <Station at={ST_LIVE} label="Live" active={nearest === ST_LIVE} />
            {/* the error satellite */}
            <g opacity={0.4 + 0.6 * clamp01(backoffU)}>
              <rect x={ST_ERROR.x - 62} y={ST_ERROR.y - 16} width={124} height={32} rx={9} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeDasharray="4 4" />
              <text x={ST_ERROR.x} y={ST_ERROR.y + 4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>
                Error · retry
              </text>
              {/* backoff pulses: 3 dots with widening spacing */}
              {[0, 1, 2].map((i) => {
                const u = clamp01(backoffU - i);
                return u > 0 && u < 1 ? (
                  <circle key={i} cx={ST_ERROR.x + 74 + i * 22} cy={ST_ERROR.y} r={4 + 2 * Math.sin(Math.PI * u)} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.3} opacity={1 - u} />
                ) : null;
              })}
            </g>
            {/* the must-refetch return path */}
            <g opacity={clamp01(nineU * 1.4)}>
              <path
                d={`M ${ST_LIVE.x} ${RAIL_Y - ST_H / 2} C ${ST_LIVE.x - 120} ${RAIL_Y - 74}, ${ST_INITIAL.x + 120} ${RAIL_Y - 74}, ${ST_INITIAL.x} ${RAIL_Y - ST_H / 2}`}
                fill="none"
                stroke={colors.NEGATIVE}
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
              <text x={(ST_INITIAL.x + ST_LIVE.x) / 2} y={RAIL_Y - 60} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO}>
                markMustRefetch → offset reset
              </text>
            </g>
            {/* the token */}
            <circle cx={tokenX} cy={tokenY} r={9} fill={colors.WARM} stroke={colors.BG} strokeWidth={2} />
          </g>

          {/* ------------------------------------------------ client · link · Electric */}
          <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="client" sublabel="local first" u={nodesU} dim={0.55 * offlineU} />
          <ServiceNode
            x={ELECTRIC.x}
            y={ELECTRIC.y}
            kind="server"
            label="Electric"
            sublabel={expireU > 0.5 ? 'restarted' : 'sync service'}
            u={nodesU}
            status={expireU > 0.5 && tearU < 0.5 ? 'warn' : 'ok'}
          />
          <g opacity={nodesU}>
            <line
              x1={CLIENT.x + 64}
              y1={CLIENT.y}
              x2={ELECTRIC.x - 66}
              y2={ELECTRIC.y}
              stroke={colors.GRID}
              strokeWidth={1.5}
              strokeDasharray={offlineU > 0.3 ? '6 8' : '1 0'}
              opacity={1 - 0.6 * offlineU}
            />
            {/* the cut */}
            <g opacity={offlineU}>
              <line x1={540} y1={CLIENT.y - 18} x2={572} y2={CLIENT.y + 18} stroke={colors.NEGATIVE} strokeWidth={2.4} />
              <line x1={572} y1={CLIENT.y - 18} x2={540} y2={CLIENT.y + 18} stroke={colors.NEGATIVE} strokeWidth={2.4} />
              <text x={556} y={CLIENT.y + 40} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5}>
                offline
              </text>
            </g>
          </g>

          {/* reconnect request chip (the bookmark) */}
          {reconU > 0.02 && reconU < 1 && (
            <g opacity={clamp01(reconU * 4)}>
              {(() => {
                const x = CLIENT.x + 80 + (ELECTRIC.x - CLIENT.x - 200) * reconU;
                return (
                  <g>
                    <rect x={x - 108} y={CLIENT.y - 46} width={216} height={24} rx={7} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.3} />
                    <text x={x} y={CLIENT.y - 29} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily={MONO}>
                      handle=62488107-… offset=1912_0
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
          {/* the two replayed deltas */}
          {GROW_SEGS.map((gseg, i) => {
            const u = win(deltaU, 2, i, 1.6);
            if (u <= 0.02 || u >= 0.98) return null;
            const x = ELECTRIC.x - 90 - (ELECTRIC.x - CLIENT.x - 170) * u;
            return (
              <g key={gseg.off}>
                <rect x={x - 34} y={CLIENT.y + 16} width={68} height={20} rx={6} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.2} />
                <text x={x} y={CLIENT.y + 30} textAnchor="middle" fill={colors.POSITIVE} fontSize={9.5} fontFamily={MONO}>
                  {gseg.off}
                </text>
              </g>
            );
          })}
          {/* 409 + must-refetch pill */}
          {nineU > 0.02 && (
            <g opacity={clamp01(nineU * 1.4)}>
              {(() => {
                const x = ELECTRIC.x - 90 - (ELECTRIC.x - CLIENT.x - 200) * Math.min(nineU, 0.85) / 0.85;
                return (
                  <g>
                    <rect x={x - 92} y={CLIENT.y - 50} width={184} height={26} rx={12} fill="rgba(251,113,133,0.12)" stroke={colors.NEGATIVE} strokeWidth={1.5} />
                    <text x={x} y={CLIENT.y - 32} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO}>
                      409 · control: must-refetch
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
          {/* offset reset + expired-handle note */}
          <g opacity={resetU}>
            <rect x={CLIENT.x - 64} y={CLIENT.y + 58} width={200} height={24} rx={7} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.3} />
            <text x={CLIENT.x + 36} y={CLIENT.y + 75} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
              offset: -1 · expired: 62488107
            </text>
          </g>

          {/* ------------------------------------------------ the tape */}
          <g opacity={nodesU}>
            <text x={TAPE.x0} y={TAPE.y - 12} fill={colors.MUTED} fontSize={11.5}>
              the shape log
            </text>
            <text x={TAPE.x1} y={TAPE.y - 12} textAnchor="end" fill={respoolU > 0.3 ? colors.POSITIVE : colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              {respoolU > 0.3 ? NEW_HANDLE : OLD_HANDLE}
            </text>
            <rect x={TAPE.x0} y={TAPE.y} width={TAPE.x1 - TAPE.x0} height={TAPE.h} rx={6} fill={colors.PANEL} stroke={colors.GRID} />

            {/* the old tape: existing segments + the two that land while dark */}
            <g opacity={1 - tearU}>
              {OLD_SEGS.map((seg, i) => {
                const c = SEG_COLOR[seg.kind];
                return (
                  <g key={seg.off} transform={`translate(${tearU * (120 + i * 30)}, 0)`}>
                    <rect x={segX(i)} y={TAPE.y + 3} width={SEG_W} height={TAPE.h - 6} rx={4} fill={c.fill} stroke={c.stroke} strokeWidth={1} />
                    <text x={segX(i) + SEG_W / 2} y={TAPE.y + TAPE.h + 15} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily={MONO}>
                      {seg.off}
                    </text>
                  </g>
                );
              })}
              {GROW_SEGS.map((seg, i) => {
                const u = win(growU, 2, i, 1.6);
                if (u <= 0.02) return null;
                return (
                  <g key={seg.off} transform={`translate(${tearU * (200 + i * 30)}, ${(1 - u) * -40})`} opacity={u}>
                    <rect x={segX(N_OLD + i)} y={TAPE.y + 3} width={SEG_W} height={TAPE.h - 6} rx={4} fill="rgba(251,191,36,0.2)" stroke={colors.WARM} strokeWidth={1} />
                    <text x={segX(N_OLD + i) + SEG_W / 2} y={TAPE.y + TAPE.h + 15} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily={MONO}>
                      {seg.off}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* expiry hatch over the tape when the log is gone */}
            <g opacity={expireU * (1 - respoolU)}>
              <rect x={TAPE.x0} y={TAPE.y} width={TAPE.x1 - TAPE.x0} height={TAPE.h} rx={6} fill="rgba(251,113,133,0.08)" stroke={colors.NEGATIVE} strokeDasharray="6 5" />
              <text x={(TAPE.x0 + TAPE.x1) / 2} y={TAPE.y - 12} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11}>
                log gone — reboot lost the in-flight shape
              </text>
            </g>

            {/* the fresh tape spooling under the new handle */}
            <g opacity={clamp01(respoolU * 2)}>
              {[0, 1, 2, 3].map((i) => {
                const u = win(respoolU, 4, i, 1.8);
                if (u <= 0.02) return null;
                return (
                  <g key={i} opacity={u}>
                    <rect x={segX(i)} y={TAPE.y + 3} width={SEG_W * u} height={TAPE.h - 6} rx={4} fill="rgba(52,211,153,0.18)" stroke={colors.POSITIVE} strokeWidth={1} />
                    <text x={segX(i) + SEG_W / 2} y={TAPE.y + TAPE.h + 15} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily={MONO}>
                      {`0_${i}`}
                    </text>
                  </g>
                );
              })}
              <text x={segX(0)} y={TAPE.y - 12} fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO} opacity={clamp01(respoolU * 3 - 0.4)}>
                a new tape — same shape, new handle
              </text>
            </g>

            {/* playhead (hidden once the old tape tears; the new spool restarts it) */}
            <g opacity={(1 - tearU) * 1 + tearU * clamp01(respoolU * 2)}>
              {(() => {
                const x = tearU > 0.5 ? segX(0) + SEG_W * 4 * clamp01(respoolU) : phX;
                return (
                  <g>
                    <path d={`M ${x - 7} ${TAPE.y - 15} L ${x + 7} ${TAPE.y - 15} L ${x} ${TAPE.y - 3} Z`} fill={colors.WARM} />
                    <text x={x} y={TAPE.y - 22} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily={MONO}>
                      offset
                    </text>
                  </g>
                );
              })()}
            </g>

            {/* the gap brace */}
            <g opacity={gapU}>
              <path
                d={`M ${phX} ${TAPE.y + TAPE.h + 24} C ${phX} ${TAPE.y + TAPE.h + 38}, ${headX} ${TAPE.y + TAPE.h + 38}, ${headX} ${TAPE.y + TAPE.h + 24}`}
                fill="none"
                stroke={colors.NEGATIVE}
                strokeWidth={1.5}
              />
              <text x={(phX + headX) / 2} y={TAPE.y + TAPE.h + 58} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5}>
                everything it missed
              </text>
            </g>
          </g>
        </g>

        {/* ------------------------------------------------ the recap vignettes */}
        <g opacity={recapU * (1 - 0.35 * closeU)}>
          {[
            { label: 'a stencil cuts the shape', n: 'one' },
            { label: 'a snapshot spools the tape', n: 'two' },
            { label: 'the write-ahead log grows it', n: 'three' },
            { label: 'a held request delivers it', n: 'four' },
          ].map((v, i) => {
            const u = win(recapU, 4, i, 1.8);
            const x = 120 + i * 275;
            const y = 150;
            return (
              <g key={v.label} opacity={u}>
                <rect x={x} y={y} width={240} height={150} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
                {/* tiny glyphs per vignette */}
                {i === 0 && (
                  <g>
                    {[0, 1, 2, 3].map((r) => (
                      <rect key={r} x={x + 40} y={y + 28 + r * 18} width={160} height={12} rx={3} fill={r % 2 === 0 ? 'rgba(56,189,248,0.35)' : 'rgba(141,162,190,0.15)'} />
                    ))}
                  </g>
                )}
                {i === 1 && (
                  <g>
                    <rect x={x + 30} y={y + 52} width={180} height={16} rx={5} fill={colors.BG} stroke={colors.GRID} />
                    {[0, 1, 2, 3].map((k) => (
                      <rect key={k} x={x + 34 + k * 32} y={y + 55} width={26} height={10} rx={3} fill="rgba(56,189,248,0.35)" />
                    ))}
                    <path d={`M ${x + 158} ${y + 38} L ${x + 172} ${y + 38} L ${x + 165} ${y + 50} Z`} fill={colors.WARM} />
                  </g>
                )}
                {i === 2 && (
                  <g>
                    <circle cx={x + 60} cy={y + 46} r={14} fill="none" stroke={colors.WARM} strokeWidth={1.6} />
                    <line x1={x + 74} y1={y + 46} x2={x + 120} y2={y + 46} stroke={colors.GRID} strokeWidth={1.4} />
                    {[0, 1, 2].map((k) => (
                      <line key={k} x1={x + 120} y1={y + 46} x2={x + 180} y2={y + 30 + k * 18} stroke={k === 2 ? colors.ACCENT : colors.GRID} strokeWidth={k === 2 ? 1.8 : 1.1} />
                    ))}
                  </g>
                )}
                {i === 3 && (
                  <g>
                    <path d={`M ${x + 40} ${y + 60} C ${x + 90} ${y + 16}, ${x + 150} ${y + 16}, ${x + 200} ${y + 60}`} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
                    <circle cx={x + 200} cy={y + 60} r={5} fill={colors.ACCENT} />
                  </g>
                )}
                <text x={x + 120} y={y + 122} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
                  {v.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* ------------------------------------------------ the closing panel */}
        <g opacity={closeU}>
          <rect x={290} y={370} width={700} height={128} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={640} y={424} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={600}>
            Postgres to the client, live
          </text>
          <text x={640} y={458} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            shapes · offsets · the write-ahead path · held requests · must-refetch
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
