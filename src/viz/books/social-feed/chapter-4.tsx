// The Celebrity Problem — and the Hybrid
//
// Backing: solutions/system_design/twitter/README.md — "Step 4: Scale the
// design": the Fanout Service is a potential bottleneck; users with millions
// of followers can take several minutes to fan out, which races @replies to
// the tweet (mitigated by re-ordering tweets at serve time); the fix is to
// avoid fanning out highly-followed users and instead merge their tweets
// into the reader's home timeline results at serve time.
// Centerpiece: the mailbox wall drowning under a celebrity torrent, the
// reply-before-original race in one zoomed cell, then the hybrid merge —
// push for the many, pull for the few.
import {
  CAMERA_HOME,
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
import { Packet, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const frac = (v: number): number => v - Math.floor(v);

// ---------------------------------------------------------------------------
// Layout — the fan on the left, a 8×6 wall of tiny mailboxes on the right.
// ---------------------------------------------------------------------------

const FANOUT = { x: 260, y: 300 } as const;
const AUTHOR = { x: 110, y: 140 } as const; // a regular user
const REPLIER = { x: 110, y: 300 } as const; // whoever replies
const CELEB = { x: 110, y: 460 } as const; // the celebrity

const COLS = 8;
const ROWS = 6;
const CELLS = COLS * ROWS;
const CELL_X0 = 616;
const CELL_Y0 = 132;
const CELL_DX = 78;
const CELL_DY = 66;
const CELL_W = 64;
const CELL_H = 52;
const cellPos = (i: number) => ({
  x: CELL_X0 + (i % COLS) * CELL_DX,
  y: CELL_Y0 + Math.floor(i / COLS) * CELL_DY,
});

const rand = mulberry32(4242);
/** Sweep order for the torrent (a shuffled column-major walk). */
const CELL_ORDER: number[] = (() => {
  const order = Array.from({ length: CELLS }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
})();
/** rankOf[cell] = position of that cell in the sweep. */
const RANK_OF: number[] = (() => {
  const r = new Array<number>(CELLS).fill(0);
  CELL_ORDER.forEach((c, k) => (r[c] = k));
  return r;
})();

/** Ten mailboxes the regular user's tweet lands in. */
const TEN: number[] = CELL_ORDER.slice(0, 10);

const N_TORRENT = 22; // packets visibly in flight during the celebrity fanout
const FOCUS_CELL = 19; // the cell we zoom into for the reply race

// the hybrid merge panel (over a dimmed stage)
const MAILBOX_MINS = [3, 9, 14, 22, 31];
const CELEB_MINS = [6, 18, 27];
const MERGED: { min: number; celeb: boolean }[] = [
  ...MAILBOX_MINS.map((m) => ({ min: m, celeb: false })),
  ...CELEB_MINS.map((m) => ({ min: m, celeb: true })),
].sort((a, b) => a.min - b.min);
const MERGE_Y0 = 218;
const MERGE_DY = 40;

// camera marks
const CAM_WALL: CameraState = { x: 760, y: 320, k: 1.08 };
const CAM_CELEB: CameraState = { x: 300, y: 400, k: 1.4 };
const FOCUS_P = cellPos(FOCUS_CELL);
const CAM_FOCUS: CameraState = { x: FOCUS_P.x + 60, y: FOCUS_P.y + 10, k: 2.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rigU: ChannelRef<number>;
  authU: ChannelRef<number>;
  pk10U: ChannelRef<number>;
  msU: ChannelRef<number>;
  celebU: ChannelRef<number>;
  torrentU: ChannelRef<number>;
  torrentPhase: ChannelRef<number>;
  fillFrac: ChannelRef<number>;
  pendingV: ChannelRef<number>;
  barV: ChannelRef<number>;
  replierU: ChannelRef<number>;
  replyU: ChannelRef<number>;
  focusU: ChannelRef<number>;
  flashU: ChannelRef<number>;
  swapU: ChannelRef<number>;
  hybridU: ChannelRef<number>;
  mergeDim: ChannelRef<number>;
  panelU: ChannelRef<number>;
  zipU: ChannelRef<number>;
  scoreU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rigU = tl.channel('rigU', 0);
  const authU = tl.channel('authU', 0);
  const pk10U = tl.channel('pk10U', 0);
  const msU = tl.channel('msU', 0);
  const celebU = tl.channel('celebU', 0);
  const torrentU = tl.channel('torrentU', 0);
  const torrentPhase = tl.channel('torrentPhase', 0);
  const fillFrac = tl.channel('fillFrac', 0);
  const pendingV = tl.channel('pendingV', 0);
  const barV = tl.channel('barV', 0);
  const replierU = tl.channel('replierU', 0);
  const replyU = tl.channel('replyU', 0);
  const focusU = tl.channel('focusU', 0);
  const flashU = tl.channel('flashU', 0);
  const swapU = tl.channel('swapU', 0);
  const hybridU = tl.channel('hybridU', 0);
  const mergeDim = tl.channel('mergeDim', 0);
  const panelU = tl.channel('panelU', 0);
  const zipU = tl.channel('zipU', 0);
  const scoreU = tl.channel('scoreU', 0);

  // — Beat 1 · the hidden assumption —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Fan-out on write rests on a hidden assumption: fanning out is fast, because most people have a modest number of followers.',
  });
  tl.tween(rigU, 1, { at: 0.7, dur: 2.0, ease: ease.linear });
  tl.tween(cam, CAM_WALL, { at: 0.9, dur: 1.6, ease: ease.move });

  // — Beat 2 · ten quick inserts —
  tl.caption({
    at: 7.4,
    dur: 6.0,
    text: 'The average tweet reaches ten mailboxes. Ten quick inserts, done in a few milliseconds. The math works — on average.',
  });
  tl.tween(authU, 1, { at: 7.6, dur: 0.7, ease: ease.enter });
  tl.tween(pk10U, 1, { at: 8.5, dur: 2.8, ease: ease.linear });
  tl.tween(msU, 1, { at: 11.4, dur: 0.5, ease: ease.pop });
  tl.hold(13.4, 0.5);

  // — Beat 3 · then a celebrity tweets —
  tl.caption({
    at: 13.9,
    dur: 4.9,
    text: 'Then a celebrity tweets. Not ten followers this time — millions.',
  });
  tl.tween(cam, CAM_CELEB, { at: 14.1, dur: 1.5, ease: ease.move });
  tl.tween(celebU, 1, { at: 14.6, dur: 0.8, ease: ease.pop });
  tl.tween(msU, 0, { at: 14.6, dur: 0.6, ease: ease.enter });
  tl.hold(18.3, 0.5);

  // — Beat 4 · the torrent —
  tl.caption({
    at: 18.8,
    dur: 6.9,
    text: 'One tap of the send button just became millions of inserts. The fan out service grinds through them while the backlog piles up.',
  });
  tl.tween(cam, CAM_WALL, { at: 19.0, dur: 1.6, ease: ease.move });
  tl.tween(torrentU, 1, { at: 19.4, dur: 0.8, ease: ease.enter });
  tl.tween(torrentPhase, 3, { at: 19.4, dur: 24, ease: ease.linear });
  tl.tween(fillFrac, 0.5, { at: 19.8, dur: 22, ease: ease.linear });
  tl.tween(pendingV, 3200000, { at: 19.8, dur: 8, ease: ease.linear });

  // — Beat 5 · milliseconds become minutes —
  tl.caption({
    at: 26.2,
    dur: 6.6,
    text: 'Delivery time stretches from milliseconds to minutes. For all that time, some followers have the tweet and some do not.',
  });
  tl.tween(barV, 1, { at: 26.6, dur: 4.5, ease: ease.move });
  tl.tween(pendingV, 5800000, { at: 27.8, dur: 8, ease: ease.linear });
  tl.hold(32.8, 0.5);

  // — Beat 6 · the reply race —
  tl.caption({
    at: 33.3,
    dur: 8.2,
    text: 'And that opens a race. Someone replies to the tweet — a reply with a tiny fan-out that lands instantly. Millions of mailboxes now hold the answer before the question.',
  });
  tl.tween(replierU, 1, { at: 33.6, dur: 0.7, ease: ease.enter });
  tl.tween(replyU, 1, { at: 34.6, dur: 1.8, ease: ease.linear });
  tl.tween(cam, CAM_FOCUS, { at: 37.0, dur: 1.8, ease: ease.move });
  tl.tween(focusU, 1, { at: 38.4, dur: 0.8, ease: ease.enter });
  tl.tween(flashU, 3, { at: 39.0, dur: 2.2, ease: ease.linear });

  // — Beat 7 · re-order at serve time —
  tl.caption({
    at: 41.9,
    dur: 5.9,
    text: 'The small fix: re-order tweets at serve time, so a conversation reads in order no matter when its pieces landed.',
  });
  tl.tween(swapU, 1, { at: 43.2, dur: 1.4, ease: ease.move });
  tl.hold(47.8, 0.5);

  // — Beat 8 · stop fanning out celebrities —
  tl.caption({
    at: 48.3,
    dur: 6.6,
    text: 'The real fix changes the strategy: stop fanning out celebrities entirely. Their tweets are stored once — and never pushed.',
  });
  tl.tween(cam, CAM_CELEB, { at: 48.5, dur: 1.7, ease: ease.move });
  tl.tween(focusU, 0, { at: 48.5, dur: 0.8, ease: ease.enter });
  tl.tween(torrentU, 0, { at: 49.4, dur: 1.2, ease: ease.move });
  tl.tween(hybridU, 1, { at: 50.2, dur: 0.9, ease: ease.pop });

  // — Beat 9 · merge two sources at read time —
  tl.caption({
    at: 55.1,
    dur: 7.3,
    text: 'Instead, when you open your feed, the system merges two sources: your precomputed mailbox, plus a quick pull of the few celebrities you follow.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 55.3, dur: 1.7, ease: ease.move });
  tl.tween(mergeDim, 1, { at: 55.9, dur: 1.2, ease: ease.move });
  tl.tween(panelU, 1, { at: 56.8, dur: 0.9, ease: ease.enter });
  tl.tween(zipU, 1, { at: 58.2, dur: 3.8, ease: ease.linear });
  tl.hold(62.4, 0.5);

  // — Beat 10 · push for the many, pull for the few —
  tl.caption({
    at: 62.9,
    dur: 7.2,
    text: 'That is the hybrid every large feed settles on. Fan out on write for the many, fan out on read for the few, and merge at serve time.',
  });
  tl.tween(scoreU, 1, { at: 63.6, dur: 0.9, ease: ease.pop });
  tl.hold(70.1, 1.6);

  return {
    tl,
    cam,
    rigU,
    authU,
    pk10U,
    msU,
    celebU,
    torrentU,
    torrentPhase,
    fillFrac,
    pendingV,
    barV,
    replierU,
    replyU,
    focusU,
    flashU,
    swapU,
    hybridU,
    mergeDim,
    panelU,
    zipU,
    scoreU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const fmt = (v: number): string => {
  const n = Math.round(v);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

function Avatar({ x, y, color, label, sub, u, star }: { x: number; y: number; color: string; label: string; sub?: string; u: number; star?: boolean }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      <circle cx={x} cy={y} r={22} fill={colors.PANEL} stroke={color} strokeWidth={2.2} />
      {star ? (
        <text x={x} y={y + 7} textAnchor="middle" fill={color} fontSize={20}>
          ★
        </text>
      ) : (
        <>
          <circle cx={x} cy={y - 5} r={5.5} fill={color} opacity={0.9} />
          <path d={`M${x - 10} ${y + 12} Q${x} ${y} ${x + 10} ${y + 12}`} fill={color} opacity={0.9} />
        </>
      )}
      <text x={x} y={y + 41} textAnchor="middle" fill={color} fontSize={13} fontWeight={600}>
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 58} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
          {sub}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rigU = s.get(scene.rigU);
  const authU = s.get(scene.authU);
  const pk10U = s.get(scene.pk10U);
  const msU = s.get(scene.msU);
  const celebU = s.get(scene.celebU);
  const torrentU = s.get(scene.torrentU);
  const phase = s.get(scene.torrentPhase);
  const fill = s.get(scene.fillFrac);
  const pending = s.get(scene.pendingV);
  const barVv = s.get(scene.barV);
  const replierU = s.get(scene.replierU);
  const replyU = s.get(scene.replyU);
  const focusU = s.get(scene.focusU);
  const flashU = s.get(scene.flashU);
  const swapU = s.get(scene.swapU);
  const hybridU = s.get(scene.hybridU);
  const mergeDimV = 1 - 0.88 * s.get(scene.mergeDim);
  const panelU = s.get(scene.panelU);
  const zipU = s.get(scene.zipU);
  const scoreU = s.get(scene.scoreU);

  const flash = Math.abs(Math.sin(Math.PI * flashU)); // three pulses, 0 at ends

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={mergeDimV}>
          {/* the fan + the wall */}
          <ServiceNode x={FANOUT.x} y={FANOUT.y} kind="fn" label="Fan Out Service" u={clamp01(rigU * 2)} glow={0.6 * torrentU} status={torrentU > 0.5 ? 'warn' : 'ok'} />
          <Zone x={CELL_X0 - 26} y={CELL_Y0 - 34} w={COLS * CELL_DX + 40} h={ROWS * CELL_DY + 44} label="Memory Cache — each cell is a mailbox" kind="group" u={clamp01(rigU * 2 - 0.5)} color={colors.ACCENT} />
          {Array.from({ length: CELLS }, (_, i) => {
            const u = win(clamp01(rigU * 2 - 0.5), CELLS, RANK_OF[i], 10);
            if (u <= 0.001) return null;
            const p = cellPos(i);
            const litTen = TEN.includes(i) ? clamp01(pk10U * 3 - (TEN.indexOf(i) / 10) * 2) : 0;
            const litCeleb = clamp01((fill - RANK_OF[i] / CELLS) * 14);
            const gotReply = ease.enter(win(replyU, CELLS, RANK_OF[i], 10));
            const lit = Math.max(litTen, litCeleb);
            return (
              <g key={i} opacity={ease.enter(u)}>
                <rect x={p.x - CELL_W / 2} y={p.y - CELL_H / 2} width={CELL_W} height={CELL_H} rx={7} fill={colors.PANEL} stroke={lit > 0.05 ? colors.ACCENT : colors.GRID} strokeWidth={1.2} />
                {/* slots: the head slot lights when the tweet lands */}
                <rect x={p.x - CELL_W / 2 + 7} y={p.y - 12} width={CELL_W - 14} height={9} rx={3} fill={colors.ACCENT} opacity={0.15 + 0.75 * lit} />
                <rect x={p.x - CELL_W / 2 + 7} y={p.y + 2} width={CELL_W - 14} height={9} rx={3} fill={gotReply > 0.01 ? colors.POSITIVE : colors.MUTED} opacity={gotReply > 0.01 ? 0.2 + 0.7 * gotReply : 0.18} />
              </g>
            );
          })}

          {/* the three authors */}
          <Avatar x={AUTHOR.x} y={AUTHOR.y} color={colors.ACCENT} label="a regular user" sub="10 followers" u={authU} />
          <Avatar x={REPLIER.x} y={REPLIER.y} color={colors.POSITIVE} label="someone replies" u={replierU} />
          <Avatar x={CELEB.x} y={CELEB.y} color={colors.WARM} label="a celebrity" sub="millions of followers" u={celebU} star />

          {/* ten quick inserts */}
          {authU > 0.01 &&
            TEN.map((c, k) => (
              <Packet key={c} from={{ x: FANOUT.x + 40, y: FANOUT.y - 20 }} to={cellPos(c)} u={win(pk10U, 10, k, 3)} r={5} color={colors.ACCENT} />
            ))}
          {authU > 0.01 && <Packet from={{ x: AUTHOR.x + 24, y: AUTHOR.y }} to={{ x: FANOUT.x - 46, y: FANOUT.y - 16 }} u={clamp01(pk10U * 4)} r={7} color={colors.ACCENT} label="tweet" />}
          {msU > 0.01 && (
            <g opacity={msU} transform={`translate(${FANOUT.x}, ${FANOUT.y - 74})`}>
              <rect x={-74} y={-18} width={148} height={30} rx={8} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.4} />
              <text y={3} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={600}>
                done in ~4 ms
              </text>
            </g>
          )}

          {/* the celebrity torrent — packets always in flight */}
          {torrentU > 0.01 && (
            <g opacity={torrentU}>
              <Packet from={{ x: CELEB.x + 24, y: CELEB.y }} to={{ x: FANOUT.x - 40, y: FANOUT.y + 20 }} u={clamp01(phase * 3)} r={8} color={colors.WARM} label="one tweet" />
              {Array.from({ length: N_TORRENT }, (_, k) => {
                const cyc = phase * 1.6 + (k * 7) / N_TORRENT;
                const u = frac(cyc);
                const target = CELL_ORDER[(k * 13 + Math.floor(cyc) * 5) % CELLS];
                return <Packet key={k} from={{ x: FANOUT.x + 40, y: FANOUT.y }} to={cellPos(target)} u={u} r={4.5} color={colors.WARM} />;
              })}
            </g>
          )}

          {/* backlog + delivery-time bar */}
          {pending > 1000 && torrentU > 0.01 && (
            <g opacity={torrentU}>
              <rect x={330} y={64} width={340} height={64} rx={12} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
              <text x={350} y={90} fill={colors.MUTED} fontSize={13}>
                deliveries still pending
              </text>
              <text x={350} y={116} fill={colors.WARM} fontSize={21} fontWeight={700} fontFamily={colors.font.mono}>
                {fmt(pending)}
              </text>
            </g>
          )}
          {barVv > 0.01 && (
            <g opacity={clamp01(barVv * 3) * torrentU}>
              <text x={330} y={168} fill={colors.MUTED} fontSize={13}>
                time to deliver one tweet
              </text>
              <rect x={330} y={178} width={340} height={12} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={330} y={178} width={340 * barVv} height={12} rx={5} fill={colors.NEGATIVE} opacity={0.85} />
              <text x={330} y={208} fill={colors.MUTED} fontSize={11.5}>
                milliseconds
              </text>
              <text x={505} y={208} fill={colors.MUTED} fontSize={11.5}>
                seconds
              </text>
              <text x={670} y={208} textAnchor="end" fill={colors.NEGATIVE} fontSize={11.5} fontWeight={600}>
                minutes
              </text>
            </g>
          )}

          {/* the reply, sweeping the wall instantly */}
          {replyU > 0.001 && <Packet from={{ x: REPLIER.x + 24, y: REPLIER.y }} to={{ x: FANOUT.x - 46, y: FANOUT.y }} u={clamp01(replyU * 5)} r={5.5} color={colors.POSITIVE} label="reply" />}

          {/* the focus cell: answer before question */}
          {focusU > 0.01 && (
            <g opacity={focusU}>
              <rect x={FOCUS_P.x - CELL_W / 2 - 4} y={FOCUS_P.y - CELL_H / 2 - 4} width={CELL_W + 8} height={CELL_H + 8} rx={9} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} opacity={0.4 + 0.6 * flash} />
              <g transform={`translate(${FOCUS_P.x + 46} ${FOCUS_P.y - 66})`}>
                <rect x={0} y={0} width={148} height={92} rx={8} fill={colors.BG} stroke={colors.GRID} strokeWidth={1} />
                <text x={10} y={17} fill={colors.MUTED} fontSize={9.5}>
                  this mailbox, right now
                </text>
                {/* reply is here; the original is still in flight — until the swap */}
                <g transform={`translate(10, ${lerp(26, 56, ease.move(swapU))})`}>
                  <rect width={128} height={22} rx={5} fill={colors.POSITIVE} opacity={0.8} />
                  <text x={8} y={15} fill={colors.BG} fontSize={10.5} fontWeight={700}>
                    the reply · here
                  </text>
                </g>
                <g transform={`translate(10, ${lerp(56, 26, ease.move(swapU))})`}>
                  <rect width={128} height={22} rx={5} fill="none" stroke={colors.WARM} strokeWidth={1.4} strokeDasharray={swapU > 0.5 ? undefined : '4 4'} />
                  <text x={8} y={15} fill={colors.WARM} fontSize={10.5} fontWeight={600}>
                    {swapU > 0.5 ? 'the tweet · first' : 'the tweet · …late'}
                  </text>
                </g>
                {swapU > 0.6 && (
                  <text x={10} y={90} fill={colors.POSITIVE} fontSize={9.5} opacity={clamp01((swapU - 0.6) * 3)}>
                    re-ordered at serve time
                  </text>
                )}
              </g>
            </g>
          )}

          {/* the hybrid badge */}
          {hybridU > 0.01 && (
            <g opacity={hybridU}>
              <circle cx={CELEB.x} cy={CELEB.y} r={30 + 4 * (1 - ease.pop(hybridU))} fill="none" stroke={colors.WARM} strokeWidth={2} strokeDasharray="6 5" />
              <g transform={`translate(${CELEB.x + 118}, ${CELEB.y - 8})`}>
                <rect x={-62} y={-16} width={124} height={32} rx={8} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
                <text y={4} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={600}>
                  no fan-out
                </text>
              </g>
              <text x={CELEB.x + 118} y={CELEB.y + 32} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                stored once · pulled at read time
              </text>
            </g>
          )}
        </g>

        {/* the merge-at-serve-time panel */}
        {panelU > 0.01 && (
          <g opacity={panelU}>
            <rect x={230} y={130} width={820} height={460} rx={20} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={168} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={700}>
              at serve time
            </text>
            <text x={400} y={198} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5}>
              your mailbox · precomputed
            </text>
            <text x={880} y={198} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
              celebrities you follow · pulled now
            </text>
            <text x={640} y={198} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
              one feed
            </text>
            {MERGED.map((m, r) => {
              const srcIdx = m.celeb ? CELEB_MINS.indexOf(m.min) : MAILBOX_MINS.indexOf(m.min);
              const fromX = m.celeb ? 880 : 400;
              const fromY = MERGE_Y0 + srcIdx * MERGE_DY + (m.celeb ? 30 : 0);
              const toY = MERGE_Y0 + r * MERGE_DY;
              const fly = ease.move(win(zipU, MERGED.length, r, 4));
              const x = lerp(fromX, 640, fly);
              const y = lerp(fromY, toY, fly);
              const color = m.celeb ? colors.WARM : colors.ACCENT;
              return (
                <g key={`${m.celeb}-${m.min}`} transform={`translate(${x}, ${y})`}>
                  <rect x={-80} y={-14} width={160} height={28} rx={7} fill={colors.BG} stroke={color} strokeWidth={1.5} />
                  <circle cx={-64} cy={0} r={5} fill={color} opacity={0.9} />
                  <text x={-50} y={4.5} fill={colors.MUTED} fontSize={12} fontFamily={colors.font.mono}>
                    {m.min}m ago
                  </text>
                  {m.celeb && (
                    <text x={62} y={4.5} textAnchor="end" fill={color} fontSize={11}>
                      ★
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* scoreboard */}
        {scoreU > 0.01 && (
          <g opacity={scoreU} transform={`translate(640, ${374 + 12 * (1 - ease.pop(scoreU))})`}>
            <rect x={-355} y={-64} width={710} height={214} rx={18} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={1.5} opacity={0.98} />
            <text y={-18} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the many → fan-out on write
            </text>
            <text y={26} textAnchor="middle" fill={colors.WARM} fontSize={22} fontWeight={700}>
              the few → fan-out on read
            </text>
            <text y={72} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
              merge at serve time
            </text>
            <text y={112} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              the hybrid behind every large feed
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
