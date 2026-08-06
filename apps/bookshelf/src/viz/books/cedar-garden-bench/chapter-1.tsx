// Seven Boards, Four Lengths
//
// Backing source: Lee Valley, "How to Build a Contemporary Cedar Garden Bench"
// (July 2020) — the whole bench comes out of seven 2x4x8 cedar boards
// (pressure-treated or spruce as cheaper alternatives). The cutting schedule is
// six 48 in pieces, five 18 in pieces, twelve 14-1/2 in pieces and five 3-1/2
// in pieces from scraps; the advice is to trim 1/8 in off one end first "so you
// have a clean, straight edge" and to use a stop block for uniform cuts.
//
// Centerpiece: seven eight-foot boards as seven bars. Each is consumed by the
// cutting schedule in front of you, the offcut ledger running alongside, until
// twenty-eight parts in four lengths sit in the bin below.
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
// Seven boards, 96 in each. 1 in = 7.0 px.
// ---------------------------------------------------------------------------

const PXI = 7.0;
const BOARD_IN = 96;
const TRIM = 0.125; // in — the clean-edge trim off one end
const X0 = 236;
const ROW_Y = (i: number): number => 108 + i * 62;
const BAR_H = 30;

const CEDAR = '#a2653a';
const CEDAR_LIT = '#c98a4f';

// The cutting schedule, board by board. Boards one to five each give a 48, an
// 18 and two 14-1/2s; board six gives a 48 and two 14-1/2s; board seven is the
// block-and-scrap board the 3-1/2 in pieces come out of.
type Cut = { len: number; kind: 'l48' | 'l18' | 'l145' | 'l35' };
const PLAN: Cut[][] = [
  ...Array.from({ length: 5 }, () => [
    { len: 48, kind: 'l48' as const },
    { len: 18, kind: 'l18' as const },
    { len: 14.5, kind: 'l145' as const },
    { len: 14.5, kind: 'l145' as const },
  ]),
  [
    { len: 48, kind: 'l48' as const },
    { len: 14.5, kind: 'l145' as const },
    { len: 14.5, kind: 'l145' as const },
  ],
  [
    { len: 3.5, kind: 'l35' as const },
    { len: 3.5, kind: 'l35' as const },
    { len: 3.5, kind: 'l35' as const },
    { len: 3.5, kind: 'l35' as const },
    { len: 3.5, kind: 'l35' as const },
  ],
];
const KIND_COLOR: Record<Cut['kind'], string> = {
  l48: colors.ACCENT,
  l18: colors.SECONDARY,
  l145: colors.POSITIVE,
  l35: colors.WARM,
};
const KIND_LABEL: Record<Cut['kind'], string> = {
  l48: '48 in',
  l18: '18 in',
  l145: '14½ in',
  l35: '3½ in',
};
const used = (row: Cut[]): number => row.reduce((s, c) => s + c.len, 0);

// the tally, in the order it is revealed
const TALLY: { kind: Cut['kind']; n: number }[] = [
  { kind: 'l48', n: 6 },
  { kind: 'l18', n: 5 },
  { kind: 'l145', n: 12 },
  { kind: 'l35', n: 5 },
];

const CAM_WIDE: CameraState = { x: 640, y: 330, k: 0.94 };
const CAM_FIRST: CameraState = { x: 600, y: 150, k: 1.5 };
const CAM_STOP: CameraState = { x: 560, y: 250, k: 1.2 };
const CAM_LAST: CameraState = { x: 620, y: 470, k: 1.28 };
const CAM_TALLY: CameraState = { x: 640, y: 380, k: 1.0 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  boardsU: ChannelRef<number>;
  trimU: ChannelRef<number>;
  cut1U: ChannelRef<number>;
  stopU: ChannelRef<number>;
  cut25U: ChannelRef<number>;
  cut6U: ChannelRef<number>;
  cut7U: ChannelRef<number>;
  tallyU: ChannelRef<number>;
  wasteU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const boardsU = tl.channel('boardsU', 0);
  const trimU = tl.channel('trimU', 0);
  const cut1U = tl.channel('cut1U', 0);
  const stopU = tl.channel('stopU', 0);
  const cut25U = tl.channel('cut25U', 0);
  const cut6U = tl.channel('cut6U', 0);
  const cut7U = tl.channel('cut7U', 0);
  const tallyU = tl.channel('tallyU', 0);
  const wasteU = tl.channel('wasteU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the whole bill of materials —
  tl.caption({
    at: 0.5,
    dur: 6.75,
    text: 'This entire bench is seven boards. Seven two-by-fours, eight feet long, in cedar — and if cedar is out of your budget, pressure-treated lumber or spruce will build exactly the same bench.',
  });
  tl.tween(boardsU, 1, { at: 0.7, dur: 2.2, ease: ease.enter });
  tl.hold(6.7, 0.6);

  // — Beat 2 · the clean edge —
  tl.caption({
    at: 7.3,
    dur: 6.55,
    text: 'Before any real cut, an eighth of an inch comes off one end of each board. Lumberyard ends are rarely square, and every measurement you are about to make is taken from that end.',
  });
  tl.tween(cam, CAM_FIRST, { at: 7.5, dur: 1.5, ease: ease.move });
  tl.tween(trimU, 1, { at: 8.6, dur: 1.0, ease: ease.enter });
  tl.hold(13.3, 0.6);

  // — Beat 3 · the first board —
  tl.caption({
    at: 13.9,
    dur: 7.15,
    text: 'Now the first board. Forty-eight inches, then eighteen, then two pieces at fourteen and a half. That is ninety-five inches of cut parts out of ninety-six inches of board, which tells you the design was drawn around the lumber.',
  });
  tl.tween(cut1U, 1, { at: 14.4, dur: 2.4, ease: ease.move });
  tl.hold(20.5, 0.6);

  // — Beat 4 · the stop block —
  tl.caption({
    at: 21.1,
    dur: 6.95,
    text: 'The next four boards are the same board again. This is what a stop block is for: clamp it to the fence once, and every fourteen and a half inch piece is the same fourteen and a half, not a measurement you take five times.',
  });
  tl.tween(cam, CAM_STOP, { at: 21.3, dur: 1.6, ease: ease.move });
  tl.tween(stopU, 1, { at: 22.2, dur: 0.9, ease: ease.enter });
  tl.tween(cut25U, 1, { at: 23.2, dur: 2.6, ease: ease.move });
  tl.hold(27.5, 0.6);

  // — Beat 5 · boards six and seven —
  tl.caption({
    at: 28.1,
    dur: 6.95,
    text: 'The sixth board gives up a forty-eight and two more fourteen and a halves. The seventh is the odd one: it is where the little three and a half inch blocks come from, cut from it and from the offcuts of everything before.',
  });
  tl.tween(cam, CAM_LAST, { at: 28.3, dur: 1.6, ease: ease.move });
  tl.tween(cut6U, 1, { at: 29.2, dur: 1.4, ease: ease.move });
  tl.tween(cut7U, 1, { at: 31.0, dur: 1.6, ease: ease.move });
  tl.hold(34.5, 0.6);

  // — Beat 6 · the tally —
  tl.caption({
    at: 35.1,
    dur: 7.15,
    text: 'Count what is on the bench now: six pieces at forty-eight inches, five at eighteen, twelve at fourteen and a half, and five little blocks. Four lengths. Nothing else in the whole project.',
  });
  tl.tween(cam, CAM_TALLY, { at: 35.3, dur: 1.6, ease: ease.move });
  tl.tween(tallyU, 1, { at: 36.4, dur: 2.4, ease: ease.move });
  tl.hold(41.7, 0.6);

  // — Beat 7 · the waste —
  tl.caption({
    at: 42.3,
    dur: 6.75,
    text: 'And notice how little is left over. Twenty-eight parts, four lengths, and a handful of short ends — a cutting schedule this tight is a design decision, not luck.',
  });
  tl.tween(wasteU, 1, { at: 42.8, dur: 1.6, ease: ease.draw });
  tl.hold(48.5, 0.6);

  // — Beat 8 · close —
  tl.caption({
    at: 49.1,
    dur: 5.8,
    text: 'Four lengths, and a bench that is really a stack. Before any of it gets glued, though, the whole thing gets built once with nothing but clamps.',
  });
  tl.tween(dimAll, 0.13, { at: 49.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 50.6, dur: 0.9, ease: ease.enter });
  tl.hold(54.9, 1.6);

  return { tl, cam, boardsU, trimU, cut1U, stopU, cut25U, cut6U, cut7U, tallyU, wasteU, dimAll, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function BoardRow({ i, u, cutU, trimU }: { i: number; u: number; cutU: number; trimU: number }) {
  if (u <= 0) return null;
  const y = ROW_Y(i);
  const row = PLAN[i];
  const trim = trimU * TRIM;
  let at = trim;
  const gapEach = 7; // px the parts drift apart as they are cut free
  return (
    <g opacity={u}>
      {/* the uncut board behind */}
      <rect x={X0} y={y} width={BOARD_IN * PXI} height={BAR_H} rx={2} fill={CEDAR} stroke="#3a2515" strokeWidth={1.2} opacity={0.35} />
      {/* the trimmed end */}
      {trimU > 0 && (
        <rect x={X0} y={y} width={Math.max(2, TRIM * PXI * trimU)} height={BAR_H} fill={colors.NEGATIVE} opacity={0.85} />
      )}
      {/* the parts */}
      {row.map((c, k) => {
        const cu = clamp01(cutU * (row.length + 1) - k);
        const x = X0 + at * PXI + k * gapEach * cu;
        at += c.len;
        if (cu <= 0) return null;
        return (
          <g key={k} opacity={cu}>
            <rect x={x} y={y} width={c.len * PXI} height={BAR_H} rx={2} fill={CEDAR_LIT} stroke={KIND_COLOR[c.kind]} strokeWidth={1.8} />
            {c.len > 10 && (
              <text x={x + (c.len * PXI) / 2} y={y + BAR_H / 2 + 5} textAnchor="middle" fill="#2a1a0d" fontSize={13} fontWeight={700}>
                {KIND_LABEL[c.kind]}
              </text>
            )}
          </g>
        );
      })}
      {/* the offcut ledger */}
      {cutU > 0.9 && (
        <text x={X0 + BOARD_IN * PXI + 16} y={y + BAR_H / 2 + 5} fill={colors.MUTED} fontSize={12.5}>
          {(BOARD_IN - used(row) - TRIM).toFixed(1)} in left
        </text>
      )}
      <text x={X0 - 16} y={y + BAR_H / 2 + 5} textAnchor="end" fill={colors.MUTED} fontSize={12.5}>
        board {i + 1}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const boardsU = s.get(scene.boardsU);
  const trimU = s.get(scene.trimU);
  const cut1U = s.get(scene.cut1U);
  const stopU = s.get(scene.stopU);
  const cut25U = s.get(scene.cut25U);
  const cut6U = s.get(scene.cut6U);
  const cut7U = s.get(scene.cut7U);
  const tallyU = s.get(scene.tallyU);
  const wasteU = s.get(scene.wasteU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const cutFor = (i: number): number => {
    if (i === 0) return cut1U;
    if (i <= 4) return clamp01(cut25U * 2 - (i - 1) * 0.25);
    if (i === 5) return cut6U;
    return cut7U;
  };
  const totalLeft = PLAN.reduce((sum, row) => sum + (BOARD_IN - used(row) - TRIM), 0);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {PLAN.map((_, i) => (
            <BoardRow key={i} i={i} u={clamp01(boardsU * 3 - i * 0.28)} cutU={cutFor(i)} trimU={trimU} />
          ))}

          {/* the stop block, clamped to the fence */}
          {stopU > 0 && (
            <g opacity={stopU}>
              <rect x={X0 - 34} y={ROW_Y(1) - 22} width={16} height={ROW_Y(4) - ROW_Y(1) + BAR_H + 44} rx={3} fill={colors.SECONDARY} opacity={0.85} />
              <text x={X0 - 44} y={ROW_Y(2) + BAR_H} textAnchor="end" fill={colors.SECONDARY} fontSize={13.5} fontWeight={600}>
                stop block
              </text>
              <text x={X0 - 44} y={ROW_Y(2) + BAR_H + 20} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                set once, cut five
              </text>
            </g>
          )}

          {/* the tally */}
          {tallyU > 0 && (
            <g opacity={tallyU}>
              <rect x={300} y={558} width={690} height={64} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              {TALLY.map((t, i) => {
                const u = clamp01(tallyU * 4 - i * 0.7);
                if (u <= 0) return null;
                return (
                  <g key={t.kind} opacity={u}>
                    <rect x={318 + i * 170} y={572} width={14} height={34} rx={3} fill={KIND_COLOR[t.kind]} />
                    <text x={342 + i * 170} y={588} fill={colors.TEXT} fontSize={16} fontWeight={700}>
                      {t.n} ×
                    </text>
                    <text x={342 + i * 170} y={608} fill={KIND_COLOR[t.kind]} fontSize={15}>
                      {KIND_LABEL[t.kind]}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* the waste ledger */}
          {wasteU > 0 && (
            <g opacity={wasteU}>
              <text x={990} y={588} fill={colors.MUTED} fontSize={13.5}>
                28 parts
              </text>
              <text x={990} y={608} fill={colors.WARM} fontSize={13.5} fontWeight={700}>
                {totalLeft.toFixed(0)} in of short ends
              </text>
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={318} y={266} width={644} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={320} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              seven boards · 48, 18, 14½ and 3½ inches
            </text>
            <text x={640} y={362} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              a bench with only four lengths in it
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
