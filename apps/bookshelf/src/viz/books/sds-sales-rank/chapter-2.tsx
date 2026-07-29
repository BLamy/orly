// MapReduce, Watched: the two-step job
//
// Backed by: solutions/system_design/sales_rank/README.md (Step 3 — the Sales
// Rank Service runs a multi-step MapReduce over the Sales API log files:
// Step 1 transform to (category, product_id), sum(quantity); Step 2 a
// distributed sort — with the exact worked example rows reproduced below) and
// sales_rank_mapreduce.py (SalesRanker(MRJob): within_past_week filter in
// mapper; reducer sums values per key; mapper_sort re-keys to
// (category, quantity), product_id so the shuffle/sort step sorts it;
// reducer_identity; steps() chains the two mr passes).
//
// ONE machine: the README's actual six receipts become six chips that we
// follow through the whole job — filtered at the week gate, keyed by the
// mapper, merged by the reducer, re-keyed by the sort mapper, and finally
// slotted into the two per-category leaderboards the job really produces.
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
// The README's worked example, as chip data.
// ---------------------------------------------------------------------------

interface Chip {
  raw: string; // the log line (abbreviated to the fields that matter)
  mapped: string; // (category, product), qty
  summed: string; // after reducer
  flipped: string; // after mapper_sort
  mergeInto: number | null; // reducer merges this chip into another
  ladder: 0 | 1; // which category leaderboard
  rung: number; // row in the ladder (sorted by quantity, ascending)
}

const CHIPS: Chip[] = [
  { raw: 't1 · product1 · category1 · qty 2', mapped: '(category1, product1), 2', summed: '(category1, product1), 2', flipped: '(category1, 2), product1', mergeInto: null, ladder: 0, rung: 1 },
  { raw: 't2 · product1 · category2 · qty 2', mapped: '(category2, product1), 2', summed: '(category2, product1), 3', flipped: '(category2, 3), product1', mergeInto: null, ladder: 1, rung: 0 },
  { raw: 't2 · product1 · category2 · qty 1', mapped: '(category2, product1), 1', summed: '', flipped: '', mergeInto: 1, ladder: 1, rung: 0 },
  { raw: 't3 · product2 · category1 · qty 3', mapped: '(category1, product2), 3', summed: '(category1, product2), 3', flipped: '(category1, 3), product2', mergeInto: null, ladder: 0, rung: 2 },
  { raw: 't4 · product3 · category2 · qty 7', mapped: '(category2, product3), 7', summed: '(category2, product3), 7', flipped: '(category2, 7), product3', mergeInto: null, ladder: 1, rung: 1 },
  { raw: 't5 · product4 · category1 · qty 1', mapped: '(category1, product4), 1', summed: '(category1, product4), 1', flipped: '(category1, 1), product4', mergeInto: null, ladder: 0, rung: 0 },
];
// a receipt older than the week — within_past_week(timestamp) rejects it
const OLD_ROW = 't0 · product2 · category1 · qty 5   (last month)';

const SRC = { x: 90, y0: 170, rowH: 56, w: 300 } as const;
const MID = { x: 470, y0: 170, rowH: 56, w: 300 } as const;
const LAD = [
  { x: 880, y0: 150, label: 'category1', rows: 3 },
  { x: 880, y0: 400, label: 'category2', rows: 2 },
] as const;
const LAD_ROW_H = 52;
const LAD_W = 310;

const srcPos = (i: number) => ({ x: SRC.x, y: SRC.y0 + i * SRC.rowH });
const midPos = (i: number) => ({ x: MID.x, y: MID.y0 + i * MID.rowH });
const ladPos = (c: Chip) => ({ x: LAD[c.ladder].x, y: LAD[c.ladder].y0 + 36 + c.rung * LAD_ROW_H });

const CAM_SRC: CameraState = { x: 340, y: 340, k: 1.25 };
const CAM_MID: CameraState = { x: 560, y: 340, k: 1.25 };
const CAM_LAD: CameraState = { x: 940, y: 360, k: 1.2 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  srcU: ChannelRef<number>;
  gateU: ChannelRef<number>;
  rejectU: ChannelRef<number>;
  mapU: ChannelRef<number>;
  sumU: ChannelRef<number>;
  flipU: ChannelRef<number>;
  sortU: ChannelRef<number>;
  ladU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const srcU = tl.channel('srcU', 0); // receipts appear
  const gateU = tl.channel('gateU', 0); // the week gate
  const rejectU = tl.channel('rejectU', 0); // old row bounced
  const mapU = tl.channel('mapU', 0); // chips fly src → keyed pairs
  const sumU = tl.channel('sumU', 0); // reducer merge
  const flipU = tl.channel('flipU', 0); // mapper_sort key flip
  const sortU = tl.channel('sortU', 0); // chips fly to the ladders
  const ladU = tl.channel('ladU', 0); // ladder frames
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the input —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Here is the whole trick of map reduce: you never write the sort. You describe two small functions, and a fleet of machines does the rest. Watch it run on seven real receipts.',
  });
  tl.tween(cam, CAM_SRC, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(srcU, 1, { at: 0.9, dur: 2.2, ease: ease.draw });
  tl.hold(7.0, 0.5);

  // — Beat 2 · the gate —
  tl.caption({
    at: 7.5,
    dur: 6,
    text: 'The mapper reads every line, and its first move is a bouncer check: is this receipt from the past week? One of ours is a month old. It never gets past the door.',
  });
  tl.tween(gateU, 1, { at: 7.8, dur: 1.0, ease: ease.enter });
  tl.tween(rejectU, 1, { at: 9.6, dur: 1.6, ease: ease.move });
  tl.hold(13.5, 0.5);

  // — Beat 3 · map —
  tl.caption({
    at: 14.0,
    dur: 7,
    text: 'Every receipt that survives is boiled down to a key and a value: the category and product become the key, the quantity becomes the value. Everything else on the line is dropped.',
  });
  tl.tween(cam, CAM_MID, { at: 14.2, dur: 1.4, ease: ease.move });
  tl.tween(mapU, 1, { at: 14.8, dur: 3.4, ease: ease.linear });
  tl.hold(21.0, 0.5);

  // — Beat 4 · shuffle + reduce —
  tl.caption({
    at: 21.5,
    dur: 7,
    text: 'Now the shuffle: pairs with the same key find each other, no matter which machine emitted them. Product one sold twice in category two, and the reducer adds those quantities into one total.',
  });
  tl.tween(sumU, 1, { at: 23.0, dur: 2.0, ease: ease.move });
  tl.hold(28.5, 0.5);

  // — Beat 5 · the clever flip —
  tl.caption({
    at: 29.0,
    dur: 7.5,
    text: 'Then comes the cleverest line in the job. A second mapper flips each pair so the quantity moves into the key. Why? Because map reduce always sorts by key between steps.',
  });
  tl.tween(flipU, 1, { at: 30.4, dur: 1.8, ease: ease.move });
  tl.hold(36.5, 0.5);

  tl.caption({
    at: 37.0,
    dur: 6,
    text: 'Put the number you care about inside the key, and the framework performs a distributed sort for you, for free, as a side effect of shuffling.',
  });
  tl.hold(43.0, 0.5);

  // — Beat 6 · the sort lands —
  tl.caption({
    at: 43.5,
    dur: 6.5,
    text: 'And out it comes: every category with its products in order of quantity sold. Category one ranks product two first. Category two crowns product three, with seven sold.',
  });
  tl.tween(cam, CAM_LAD, { at: 43.7, dur: 1.4, ease: ease.move });
  tl.tween(ladU, 1, { at: 43.9, dur: 1.0, ease: ease.enter });
  tl.tween(sortU, 1, { at: 44.6, dur: 3.4, ease: ease.linear });
  tl.hold(50.0, 0.5);

  // — Beat 7 · scale intuition —
  tl.caption({
    at: 50.5,
    dur: 7,
    text: 'Nothing about this changes at a billion receipts. The mapper never sees more than one line. The reducer never sees more than one key. The scale lives entirely in how many machines you rent.',
  });
  tl.hold(57.5, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 58.0,
    dur: 7,
    text: 'Two map functions, one reduce, one free sort. Every hour the job reruns over the sliding week of receipts, and the leaderboards come out fresh. Next: where they land, and who reads them.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 58.2, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 58.8, dur: 1.4, ease: ease.move });
  tl.hold(65.0, 1.5);

  return { tl, cam, srcU, gateU, rejectU, mapU, sumU, flipU, sortU, ladU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srcU = s.get(scene.srcU);
  const gateU = s.get(scene.gateU);
  const rejectU = s.get(scene.rejectU);
  const mapU = s.get(scene.mapU);
  const sumU = s.get(scene.sumU);
  const flipU = s.get(scene.flipU);
  const sortU = s.get(scene.sortU);
  const ladU = s.get(scene.ladU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- stage labels ---- */}
        <g opacity={dimAll}>
          <text x={SRC.x} y={SRC.y0 - 36} fill={colors.TEXT} fontSize={15} opacity={srcU}>
            the receipts
          </text>
          <text x={SRC.x} y={SRC.y0 - 16} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace" opacity={srcU}>
            Sales API log · one line per sale
          </text>
          <text x={MID.x} y={MID.y0 - 36} fill={colors.TEXT} fontSize={15} opacity={clamp01(mapU * 3)}>
            {flipU > 0.5 ? 'after mapper_sort' : sumU > 0.5 ? 'after reducer' : 'after mapper'}
          </text>
          <text x={MID.x} y={MID.y0 - 16} fill={colors.ACCENT} fontSize={11} fontFamily="ui-monospace, monospace" opacity={clamp01(mapU * 3)}>
            {flipU > 0.5
              ? 'yield (category_id, quantity), product_id'
              : sumU > 0.5
                ? 'yield key, sum(values)'
                : 'yield (category_id, product_id), quantity'}
          </text>
        </g>

        {/* ---- the week gate ---- */}
        <g opacity={gateU * dimAll * (1 - sortU)}>
          <line x1={SRC.x + SRC.w + 18} y1={SRC.y0 - 20} x2={SRC.x + SRC.w + 18} y2={SRC.y0 + 7.6 * SRC.rowH} stroke={colors.WARM} strokeWidth={2} strokeDasharray="7 5" />
          <text x={SRC.x + SRC.w + 18} y={SRC.y0 + 7.6 * SRC.rowH + 22} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily="ui-monospace, monospace">
            within_past_week(timestamp)
          </text>
        </g>

        {/* ---- the rejected old receipt ---- */}
        <g opacity={srcU * (1 - clamp01(rejectU * 1.4)) * dimAll}>
          <rect x={SRC.x} y={SRC.y0 + 6 * SRC.rowH + rejectU * 90} width={SRC.w + 40} height={SRC.rowH - 14} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.2} />
          <text x={SRC.x + 12} y={SRC.y0 + 6 * SRC.rowH + 26 + rejectU * 90} fill={colors.NEGATIVE} fontSize={10.5} fontFamily="ui-monospace, monospace">
            {OLD_ROW}
          </text>
        </g>

        {/* ---- the six chips ---- */}
        {CHIPS.map((c, i) => {
          const appear = clamp01(srcU * 2 - i * 0.14);
          const flyMap = clamp01(mapU * 1.9 - i * 0.15);
          // merged chip fades into its host during sumU
          const isMerged = c.mergeInto !== null;
          const host = isMerged ? CHIPS[c.mergeInto!] : c;
          const hostIdx = isMerged ? c.mergeInto! : i;
          const a = srcPos(i);
          const b = midPos(i);
          const merge = isMerged ? sumU : 0;
          // position: src → mid, then (if merged) slide onto host row, then → ladder
          let x = lerp(a.x, b.x, flyMap);
          let y = lerp(a.y, b.y, flyMap);
          if (isMerged) {
            const hb = midPos(hostIdx);
            x = lerp(x, hb.x, merge);
            y = lerp(y, hb.y, merge);
          }
          const flySort = isMerged ? 0 : clamp01(sortU * 1.9 - i * 0.16);
          if (!isMerged) {
            const lp = ladPos(c);
            x = lerp(x, lp.x, flySort);
            y = lerp(y, lp.y, flySort);
          }
          const op = appear * (isMerged ? 1 - clamp01(sumU * 1.2) : 1) * dimAll;
          if (op <= 0.01) return null;
          const text =
            flySort > 0.9
              ? c.flipped
              : flipU > 0.5
                ? c.flipped
                : sumU > 0.6
                  ? c.summed
                  : flyMap > 0.6
                    ? c.mapped
                    : c.raw;
          const keyed = flyMap > 0.6;
          const catColor = c.ladder === 0 ? colors.ACCENT : colors.SECONDARY;
          return (
            <g key={i} opacity={op}>
              <rect x={x} y={y} width={SRC.w} height={SRC.rowH - 14} rx={8} fill={colors.PANEL} stroke={keyed ? catColor : colors.GRID} strokeWidth={keyed ? 1.5 : 1.1} />
              <text x={x + 12} y={y + 26} fill={keyed ? colors.TEXT : colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
                {text}
              </text>
              {/* the flip pulse */}
              {flipU > 0 && flipU < 1 && !isMerged && (
                <rect x={x} y={y} width={SRC.w} height={SRC.rowH - 14} rx={8} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={Math.sin(flipU * Math.PI)} />
              )}
            </g>
          );
        })}

        {/* ---- the leaderboards ---- */}
        <g opacity={ladU * dimAll}>
          {LAD.map((l, li) => (
            <g key={li}>
              <rect x={l.x - 16} y={l.y0} width={LAD_W + 32} height={l.rows * LAD_ROW_H + 52} rx={12} fill="none" stroke={li === 0 ? colors.ACCENT : colors.SECONDARY} strokeWidth={1.4} />
              <text x={l.x} y={l.y0 + 26} fill={li === 0 ? colors.ACCENT : colors.SECONDARY} fontSize={13.5} fontFamily="ui-monospace, monospace">
                {l.label} — sorted by quantity
              </text>
            </g>
          ))}
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={280} y={210} width={720} height={250} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={258} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the two-step job
          </text>
          {[
            ['step 1', 'map: (category_id, product_id), quantity — reduce: sum'],
            ['step 2', 'map: (category_id, quantity), product_id — sort for free'],
            ['every hour', 'rerun over the sliding week → fresh leaderboards'],
          ].map(([k, v], i) => (
            <g key={k}>
              <text x={420} y={306 + i * 42} textAnchor="end" fill={colors.WARM} fontSize={13.5} fontFamily="ui-monospace, monospace">
                {k}
              </text>
              <text x={448} y={306 + i * 42} fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, monospace">
                {v}
              </text>
            </g>
          ))}
          <text x={640} y={432} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            SalesRanker, from sales_rank_mapreduce.py — run by the Sales Rank Service
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
