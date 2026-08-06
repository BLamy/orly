// One Setting, Every Cut
//
// Backing source: Lee Valley, "How to Build a Custom Kitchen Side Table" by
// Charles Mak — Domino joinery is used for the leg-to-apron joints, butt joints
// and mid-board connections, with the advice to "work smart by organizing and
// finishing all the cuts under one machine setting before changing its
// setting." The divider in the lower compartment gets mortises cut on its
// bottom edge by clamping it to the compartment bottom and cutting matching
// mortises in both; 10 mm button slots are cut on the upper aprons and the
// back piece interior.
//
// Centerpiece: a queue of parts and a machine with a setting. Run the parts in
// the order they occur to you and the setting changes over and over; group them
// and the same cuts take three settings — the same idea as a sort.
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
// The work queue. Each part needs a mortise cut at one of three settings.
// ---------------------------------------------------------------------------

type Setting = 'A' | 'B' | 'C';
const SET_COLOR: Record<Setting, string> = {
  A: colors.ACCENT,
  B: colors.SECONDARY,
  C: colors.WARM,
};
const SET_NAME: Record<Setting, string> = {
  A: 'leg to apron',
  B: 'butt joints',
  C: '10 mm button slots',
};

// the order the parts occur to you while building
const NAIVE: Setting[] = ['A', 'B', 'A', 'C', 'B', 'A', 'C', 'B', 'A', 'C', 'B', 'A'];
// the same twelve cuts, grouped by setting
const SORTED: Setting[] = [...NAIVE].sort();

const changes = (seq: Setting[]): number =>
  seq.reduce((n, s, i) => (i > 0 && s !== seq[i - 1] ? n + 1 : n), 1);

const SLOT_W = 62;
const SLOT_H = 40;
const ROW_X = 214;
const NAIVE_Y = 214;
const SORT_Y = 372;

// The divider trick: clamp the divider to the compartment bottom, cut both.
const D = { x: 470, y: 470, w: 340, h: 34 } as const;

const CAM_QUEUE: CameraState = { x: 620, y: 250, k: 1.12 };
const CAM_COST: CameraState = { x: 620, y: 300, k: 1.0 };
const CAM_SORT: CameraState = { x: 620, y: 330, k: 1.02 };
const CAM_DIVIDER: CameraState = { x: 620, y: 470, k: 1.4 };
const CAM_WIDE: CameraState = { x: 620, y: 340, k: 0.92 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  queueU: ChannelRef<number>;
  runU: ChannelRef<number>;
  costU: ChannelRef<number>;
  sortU: ChannelRef<number>;
  run2U: ChannelRef<number>;
  compareU: ChannelRef<number>;
  divU: ChannelRef<number>;
  clampU: ChannelRef<number>;
  mortU: ChannelRef<number>;
  slotU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_QUEUE, cameraInterp);
  const queueU = tl.channel('queueU', 0);
  const runU = tl.channel('runU', 0);
  const costU = tl.channel('costU', 0);
  const sortU = tl.channel('sortU', 0);
  const run2U = tl.channel('run2U', 0);
  const compareU = tl.channel('compareU', 0);
  const divU = tl.channel('divU', 0);
  const clampU = tl.channel('clampU', 0);
  const mortU = tl.channel('mortU', 0);
  const slotU = tl.channel('slotU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · what the joinery is —
  tl.caption({
    at: 0.5,
    dur: 6.75,
    text: 'Every joint in this table is a loose tenon cut with a Domino: the legs to the aprons, the butt joints, and the connections out in the middle of a board where nothing else would hold.',
  });
  tl.tween(queueU, 1, { at: 0.7, dur: 1.8, ease: ease.enter });
  tl.hold(6.7, 0.6);

  // — Beat 2 · the machine has a setting —
  tl.caption({
    at: 7.3,
    dur: 6.55,
    text: 'The machine only knows one setting at a time — a fence height, a width, a depth. Changing it is quick. Changing it, and then getting it back exactly, is not.',
  });
  tl.tween(runU, 1, { at: 7.8, dur: 3.0, ease: ease.linear });
  tl.hold(13.3, 0.6);

  // — Beat 3 · the cost of working part by part —
  tl.caption({
    at: 13.9,
    dur: 6.95,
    text: 'So work part by part, in the order the parts occur to you, and you pay for it. Twelve cuts in this order means resetting the machine eleven separate times, and every reset is a chance to be slightly off.',
  });
  tl.tween(cam, CAM_COST, { at: 14.1, dur: 1.4, ease: ease.move });
  tl.tween(costU, 1, { at: 14.8, dur: 1.6, ease: ease.pop });
  tl.hold(20.3, 0.6);

  // — Beat 4 · sort the queue —
  tl.caption({
    at: 20.9,
    dur: 6.75,
    text: 'The advice in the article is one line long: finish all the cuts under one machine setting before you change it. Which is really a sort — group the identical cuts, then run the groups.',
  });
  tl.tween(cam, CAM_SORT, { at: 21.1, dur: 1.5, ease: ease.move });
  tl.tween(sortU, 1, { at: 21.8, dur: 2.4, ease: ease.move });
  tl.hold(27.1, 0.6);

  // — Beat 5 · the payoff —
  tl.caption({
    at: 27.7,
    dur: 6.75,
    text: 'Same twelve cuts, same machine, same afternoon. Two resets instead of eleven — and every joint of a given kind was cut without the fence moving between them, so they all match.',
  });
  tl.tween(run2U, 1, { at: 28.0, dur: 2.6, ease: ease.linear });
  tl.tween(compareU, 1, { at: 30.8, dur: 1.0, ease: ease.pop });
  tl.hold(33.9, 0.6);

  // — Beat 6 · the divider —
  tl.caption({
    at: 34.5,
    dur: 6.95,
    text: 'The same instinct solves the trickiest joint in the piece. The lower compartment has a divider that has to land on a wide bottom panel, and mortises in two loose parts almost never line up.',
  });
  tl.tween(cam, CAM_DIVIDER, { at: 34.7, dur: 1.5, ease: ease.move });
  tl.tween(divU, 1, { at: 35.4, dur: 1.2, ease: ease.enter });
  tl.hold(40.9, 0.6);

  // — Beat 7 · clamp them together —
  tl.caption({
    at: 41.5,
    dur: 6.95,
    text: 'So the divider is clamped to the compartment bottom first, and the mortises in its bottom edge are cut with it held exactly where it will live. Then the matching mortises go into the panel from the same reference.',
  });
  tl.tween(clampU, 1, { at: 41.9, dur: 1.2, ease: ease.pop });
  tl.tween(mortU, 1, { at: 43.4, dur: 1.8, ease: ease.move });
  tl.hold(47.9, 0.6);

  // — Beat 8 · button slots —
  tl.caption({
    at: 48.5,
    dur: 6.75,
    text: 'One more setting, while the machine is out: ten millimetre slots on the inside of the upper aprons and the back. They are not joints at all — they are how the top will be attached later.',
  });
  tl.tween(cam, CAM_WIDE, { at: 48.7, dur: 1.6, ease: ease.move });
  tl.tween(slotU, 1, { at: 49.4, dur: 1.6, ease: ease.pop });
  tl.hold(54.7, 0.6);

  // — Beat 9 · close —
  tl.caption({
    at: 55.3,
    dur: 5.8,
    text: 'Cuts grouped, mortises matched, slots ready. All that is left is putting it together in an order that stays square.',
  });
  tl.tween(dimAll, 0.13, { at: 55.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.8, dur: 0.9, ease: ease.enter });
  tl.hold(61.1, 1.6);

  return { tl, cam, queueU, runU, costU, sortU, run2U, compareU, divU, clampU, mortU, slotU, dimAll, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const OAK = '#8a6a43';
const OAK_LIT = '#b08a55';

function Queue({
  seq,
  y,
  u,
  head,
  label,
}: {
  seq: Setting[];
  y: number;
  u: number;
  head: number;
  label: string;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <text x={ROW_X - 16} y={y + SLOT_H / 2 + 5} textAnchor="end" fill={colors.MUTED} fontSize={13}>
        {label}
      </text>
      {seq.map((st, i) => {
        const x = ROW_X + i * (SLOT_W + 6);
        const done = head > i;
        const changed = i > 0 && st !== seq[i - 1];
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={SLOT_W}
              height={SLOT_H}
              rx={4}
              fill={done ? SET_COLOR[st] : OAK}
              opacity={done ? 0.85 : 0.55}
              stroke={SET_COLOR[st]}
              strokeWidth={1.6}
            />
            <text x={x + SLOT_W / 2} y={y + SLOT_H / 2 + 5} textAnchor="middle" fill={done ? colors.BG : colors.TEXT} fontSize={15} fontWeight={700}>
              {st}
            </text>
            {changed && done && (
              <line x1={x - 3} y1={y - 8} x2={x - 3} y2={y + SLOT_H + 8} stroke={colors.NEGATIVE} strokeWidth={2.4} />
            )}
          </g>
        );
      })}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const queueU = s.get(scene.queueU);
  const runU = s.get(scene.runU);
  const costU = s.get(scene.costU);
  const sortU = s.get(scene.sortU);
  const run2U = s.get(scene.run2U);
  const compareU = s.get(scene.compareU);
  const divU = s.get(scene.divU);
  const clampU = s.get(scene.clampU);
  const mortU = s.get(scene.mortU);
  const slotU = s.get(scene.slotU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const head1 = runU * NAIVE.length;
  const head2 = run2U * SORTED.length;
  const gap = clamp01(divU) * 26 * (1 - clampU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* the three settings, as a legend */}
          <g opacity={queueU}>
            {(['A', 'B', 'C'] as Setting[]).map((st, i) => (
              <g key={st}>
                <rect x={ROW_X + i * 250} y={128} width={16} height={16} rx={3} fill={SET_COLOR[st]} />
                <text x={ROW_X + 24 + i * 250} y={142} fill={colors.TEXT} fontSize={14}>
                  {st} — {SET_NAME[st]}
                </text>
              </g>
            ))}
          </g>

          <Queue seq={NAIVE} y={NAIVE_Y} u={queueU} head={head1} label="as they occur" />
          {costU > 0 && (
            <text x={ROW_X + NAIVE.length * (SLOT_W + 6) + 14} y={NAIVE_Y + SLOT_H / 2 + 6} fill={colors.NEGATIVE} fontSize={17} fontWeight={700} opacity={costU}>
              {changes(NAIVE) - 1} resets
            </text>
          )}

          <Queue seq={SORTED} y={SORT_Y} u={sortU} head={head2} label="grouped by setting" />
          {compareU > 0 && (
            <text x={ROW_X + SORTED.length * (SLOT_W + 6) + 14} y={SORT_Y + SLOT_H / 2 + 6} fill={colors.POSITIVE} fontSize={17} fontWeight={700} opacity={compareU}>
              {changes(SORTED) - 1} resets
            </text>
          )}

          {/* ---- the divider trick ---- */}
          {divU > 0 && (
            <g opacity={divU}>
              {/* the compartment bottom */}
              <rect x={D.x - 40} y={D.y + D.h + 20} width={D.w + 80} height={D.h} rx={3} fill={OAK} stroke="#2f2415" strokeWidth={1.3} />
              {/* the divider, dropping onto it */}
              <rect x={D.x} y={D.y - gap} width={D.w} height={D.h} rx={3} fill={OAK_LIT} stroke="#2f2415" strokeWidth={1.3} />
              <text x={D.x - 52} y={D.y + D.h / 2 + 5} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                divider
              </text>
              <text x={D.x - 52} y={D.y + D.h * 2 + 26} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                bottom
              </text>

              {/* clamped together */}
              {clampU > 0 &&
                [D.x + 40, D.x + D.w - 40].map((x, i) => (
                  <g key={i} opacity={clampU}>
                    <rect x={x - 12} y={D.y - 16} width={24} height={11} rx={3} fill={colors.SECONDARY} />
                    <rect x={x - 12} y={D.y + D.h * 2 + 22} width={24} height={11} rx={3} fill={colors.SECONDARY} />
                    <line x1={x} y1={D.y - 16} x2={x} y2={D.y + D.h * 2 + 33} stroke={colors.SECONDARY} strokeWidth={3} />
                  </g>
                ))}

              {/* matching mortises, cut from one reference */}
              {mortU > 0 &&
                [0.24, 0.5, 0.76].map((f, i) => {
                  const u = clamp01(mortU * 3 - i * 0.5);
                  if (u <= 0) return null;
                  const x = D.x + f * D.w;
                  return (
                    <g key={i} opacity={u}>
                      <rect x={x - 15} y={D.y + D.h - 9} width={30} height={9} rx={2} fill={colors.POSITIVE} />
                      <rect x={x - 15} y={D.y + D.h + 20} width={30} height={9} rx={2} fill={colors.POSITIVE} />
                    </g>
                  );
                })}
              {mortU > 0.8 && (
                <text x={D.x + D.w / 2} y={D.y + D.h * 2 + 66} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={700} opacity={clamp01(mortU * 3 - 2.4)}>
                  both halves cut from the same reference
                </text>
              )}
            </g>
          )}

          {/* ---- the 10 mm button slots ---- */}
          {slotU > 0 && (
            <g opacity={slotU}>
              <rect x={860} y={168} width={300} height={30} rx={3} fill={OAK_LIT} stroke="#2f2415" />
              {[0.18, 0.42, 0.66, 0.9].map((f, i) => {
                const u = clamp01(slotU * 4 - i * 0.5);
                if (u <= 0) return null;
                return <rect key={i} x={860 + f * 300 - 14} y={190} width={28} height={9} rx={2} fill={colors.WARM} opacity={u} />;
              })}
              <text x={1010} y={158} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
                10 mm button slots — inside the upper aprons
              </text>
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={316} y={256} width={648} height={140} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              group the cuts · clamp before you mortise
            </text>
            <text x={640} y={352} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              one setting, every cut
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
