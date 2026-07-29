// The Categorizer: 50,000 sellers, 12 megabytes, one dictionary
//
// Backed by: solutions/system_design/mint/README.md — the Category Service:
// a seller-to-category dictionary seeded with the most popular sellers
// (seller_category_map['Exxon'] = DefaultCategories.GAS,
// seller_category_map['Target'] = DefaultCategories.SHOPPING; ~50,000 sellers
// at < 255 bytes ≈ 12 MB, small enough for memory); the Categorizer.categorize
// fallback chain — seeded map, then the crowdsourced overrides heap
// (peek_min of users' manual overrides, which back-fills the map), else None;
// and the Budget template (Budget.create_budget_template allocating income:
// housing 40 percent, food 20, gas 10, shopping 20), with user overrides
// stored in budget_overrides rather than 100 million budget rows.
//
// ONE machine: a sorting funnel. Transactions fall in at the top; the seeded
// dictionary deflects the known sellers into category bins; an unknown seller
// pauses at the crowd-overrides heap, the crowd's top answer is peeked, the
// dictionary learns it, and the transaction lands. Then the budget template
// draws itself as bars over the bins.
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
// Categories, bins, and the falling transactions.
// ---------------------------------------------------------------------------

const CATS = [
  { name: 'HOUSING', share: 0.4, color: colors.ACCENT },
  { name: 'FOOD', share: 0.2, color: colors.POSITIVE },
  { name: 'GAS', share: 0.1, color: colors.WARM },
  { name: 'SHOPPING', share: 0.2, color: colors.SECONDARY },
] as const;

const BIN_X0 = 300;
const BIN_W = 190;
const BIN_GAP = 30;
const BIN_Y = 480;
const binX = (i: number): number => BIN_X0 + i * (BIN_W + BIN_GAP);

// the known transactions (seller → seeded category)
const KNOWN = [
  { seller: 'Exxon', amount: '$50', cat: 2 },
  { seller: 'Target', amount: '$25', cat: 3 },
  { seller: 'Acme Rent Co', amount: '$1,000', cat: 0 },
  { seller: 'Grocer', amount: '$100', cat: 1 },
] as const;
// the unknown seller resolved by the crowd
const UNKNOWN = { seller: 'Joes Diner', amount: '$18', cat: 1 } as const;

const FUNNEL = { x: 640, y: 130 } as const;
const HEAP = { x: 1040, y: 300 } as const;

const CAM_FUNNEL: CameraState = { x: 640, y: 260, k: 1.2 };
const CAM_HEAP: CameraState = { x: 950, y: 300, k: 1.35 };
const CAM_BINS: CameraState = { x: 640, y: 430, k: 1.18 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rigU: ChannelRef<number>;
  mapU: ChannelRef<number>;
  dropK: ChannelRef<number>;
  unkU: ChannelRef<number>;
  heapU: ChannelRef<number>;
  peekU: ChannelRef<number>;
  learnU: ChannelRef<number>;
  landU: ChannelRef<number>;
  budU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rigU = tl.channel('rigU', 0); // funnel + bins
  const mapU = tl.channel('mapU', 0); // the dictionary panel
  const dropK = tl.channel('dropK', 0); // known transactions drop, 0..4
  const unkU = tl.channel('unkU', 0); // unknown tx falls and pauses
  const heapU = tl.channel('heapU', 0); // the overrides heap panel
  const peekU = tl.channel('peekU', 0); // peek_min flash
  const learnU = tl.channel('learnU', 0); // dictionary learns the seller
  const landU = tl.channel('landU', 0); // unknown tx lands in FOOD
  const budU = tl.channel('budU', 0); // budget template bars
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the question —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'Every extracted transaction arrives as four fields: who spent, when, at which seller, and how much. The one thing it does not say is what kind of spending it was.',
  });
  tl.tween(rigU, 1, { at: 0.8, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_FUNNEL, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the dictionary —
  tl.caption({
    at: 7.0,
    dur: 7,
    text: 'The category service answers with a dictionary: seller to category. Exxon means gas. Target means shopping. Seed it with the fifty thousand most popular sellers and it fits in about twelve megabytes of memory.',
  });
  tl.tween(mapU, 1, { at: 7.6, dur: 1.2, ease: ease.enter });
  tl.hold(14.0, 0.5);

  // — Beat 3 · known sellers sort ---
  tl.caption({
    at: 14.5,
    dur: 7,
    text: 'So most transactions just fall through the funnel. The dictionary reads the seller and deflects each one into its bin: gas, shopping, housing, food. One lookup each, no thinking required.',
  });
  tl.tween(cam, CAM_BINS, { at: 14.9, dur: 1.5, ease: ease.move });
  tl.tween(dropK, 4, { at: 15.2, dur: 5.4, ease: ease.linear });
  tl.hold(21.5, 0.5);

  // — Beat 4 · the unknown seller —
  tl.caption({
    at: 22.0,
    dur: 6,
    text: 'Then a stranger shows up. A little diner nobody seeded. The dictionary shrugs, and the transaction hangs there, uncategorized.',
  });
  tl.tween(cam, CAM_FUNNEL, { at: 22.2, dur: 1.4, ease: ease.move });
  tl.tween(unkU, 1, { at: 23.2, dur: 1.6, ease: ease.move });
  tl.hold(28.0, 0.5);

  // — Beat 5 · the crowd —
  tl.caption({
    at: 28.5,
    dur: 7.5,
    text: 'This is where the users quietly train the system. Every manual category override anyone has ever made for that seller sits in a heap, and peeking the top of the heap is constant time.',
  });
  tl.tween(cam, CAM_HEAP, { at: 28.7, dur: 1.4, ease: ease.move });
  tl.tween(heapU, 1, { at: 29.3, dur: 1.2, ease: ease.enter });
  tl.tween(peekU, 1, { at: 32.6, dur: 0.8, ease: ease.pop });
  tl.hold(36.0, 0.5);

  // — Beat 6 · learn + land —
  tl.caption({
    at: 36.5,
    dur: 7,
    text: 'The crowd says food. The dictionary writes that answer down, so the next diner transaction never has to ask, and this one finally lands in its bin.',
  });
  tl.tween(learnU, 1, { at: 37.4, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_BINS, { at: 39.0, dur: 1.4, ease: ease.move });
  tl.tween(landU, 1, { at: 40.0, dur: 1.6, ease: ease.move });
  tl.hold(43.5, 0.5);

  // — Beat 7 · the budget template —
  tl.caption({
    at: 44.0,
    dur: 7.5,
    text: 'Categories exist to be compared against a budget. Rather than store a hundred million budget rows, the service starts everyone from a template scaled by income: forty percent housing, twenty food, ten gas, twenty shopping.',
  });
  tl.tween(budU, 1, { at: 45.0, dur: 2.0, ease: ease.draw });
  tl.hold(51.5, 0.5);

  // — Beat 8 · overrides —
  tl.caption({
    at: 52.0,
    dur: 5.5,
    text: 'Only the users who change a number get a stored override. Defaults are computed. Exceptions are saved. That is how ten categories times ten million users stays cheap.',
  });
  tl.hold(57.5, 0.5);

  // — Beat 9 · close —
  tl.caption({
    at: 58.0,
    dur: 6.5,
    text: 'A dictionary for the common case, a crowd for the strangers, a template for the budget. Next chapter, the month gets added up, and the app decides when to tap you on the shoulder.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 58.2, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 58.8, dur: 1.4, ease: ease.move });
  tl.hold(64.5, 1.5);

  return { tl, cam, rigU, mapU, dropK, unkU, heapU, peekU, learnU, landU, budU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rigU = s.get(scene.rigU);
  const mapU = s.get(scene.mapU);
  const dropK = s.get(scene.dropK);
  const unkU = s.get(scene.unkU);
  const heapU = s.get(scene.heapU);
  const peekU = s.get(scene.peekU);
  const learnU = s.get(scene.learnU);
  const landU = s.get(scene.landU);
  const budU = s.get(scene.budU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- funnel + bins ---- */}
        <g opacity={rigU * dimAll}>
          <text x={FUNNEL.x} y={FUNNEL.y - 60} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
            transactions, straight from the banks
          </text>
          <text x={FUNNEL.x} y={FUNNEL.y - 40} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
            created_at · seller · amount
          </text>
          {/* funnel walls */}
          <line x1={FUNNEL.x - 130} y1={FUNNEL.y - 20} x2={FUNNEL.x - 30} y2={FUNNEL.y + 70} stroke={colors.GRID} strokeWidth={2} />
          <line x1={FUNNEL.x + 130} y1={FUNNEL.y - 20} x2={FUNNEL.x + 30} y2={FUNNEL.y + 70} stroke={colors.GRID} strokeWidth={2} />
          {/* bins */}
          {CATS.map((c, i) => (
            <g key={c.name}>
              <rect x={binX(i)} y={BIN_Y} width={BIN_W} height={90} rx={10} fill={colors.PANEL} stroke={c.color} strokeWidth={1.4} />
              <text x={binX(i) + BIN_W / 2} y={BIN_Y + 26} textAnchor="middle" fill={c.color} fontSize={12.5} fontFamily="ui-monospace, monospace">
                {c.name}
              </text>
            </g>
          ))}
        </g>

        {/* ---- the dictionary panel ---- */}
        <g opacity={mapU * dimAll}>
          <rect x={120} y={200} width={280} height={140} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
          <text x={140} y={228} fill={colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace">
            seller_category_map
          </text>
          <text x={140} y={254} fill={colors.TEXT} fontSize={11} fontFamily="ui-monospace, monospace">
            'Exxon' → GAS
          </text>
          <text x={140} y={276} fill={colors.TEXT} fontSize={11} fontFamily="ui-monospace, monospace">
            'Target' → SHOPPING
          </text>
          <g opacity={learnU}>
            <text x={140} y={298} fill={colors.POSITIVE} fontSize={11} fontFamily="ui-monospace, monospace">
              'Joes Diner' → FOOD   (learned)
            </text>
          </g>
          <text x={140} y={326} fill={colors.MUTED} fontSize={10}>
            50,000 sellers · ~12 MB · in memory
          </text>
        </g>

        {/* ---- known transactions drop ---- */}
        {KNOWN.map((k, i) => {
          const u = clamp01(dropK - i);
          if (u <= 0) return null;
          const from = { x: FUNNEL.x, y: FUNNEL.y + 40 };
          const to = { x: binX(k.cat) + BIN_W / 2, y: BIN_Y + 54 };
          const x = lerp(from.x, to.x, u);
          const y = from.y + (to.y - from.y) * (u * u); // gravity-ish
          const done = u >= 1;
          return (
            <g key={i} opacity={dimAll * (done ? 0.85 : 1)}>
              <rect x={x - 56} y={y - 15} width={112} height={30} rx={7} fill={colors.BG} stroke={CATS[k.cat].color} strokeWidth={1.3} />
              <text x={x} y={y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={9.5} fontFamily="ui-monospace, monospace">
                {k.seller} · {k.amount}
              </text>
            </g>
          );
        })}

        {/* ---- the unknown transaction ---- */}
        {unkU > 0 && (() => {
          const hang = { x: FUNNEL.x + 120, y: 300 };
          const to = { x: binX(UNKNOWN.cat) + BIN_W / 2, y: BIN_Y + 54 };
          const x = landU > 0 ? lerp(hang.x, to.x, landU) : lerp(FUNNEL.x, hang.x, unkU);
          const y = landU > 0 ? lerp(hang.y, to.y, landU * landU) : lerp(FUNNEL.y + 40, hang.y, unkU);
          return (
            <g opacity={dimAll}>
              <rect x={x - 56} y={y - 15} width={112} height={30} rx={7} fill={colors.BG} stroke={landU > 0.8 ? CATS[1].color : colors.NEGATIVE} strokeWidth={1.5} />
              <text x={x} y={y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={9.5} fontFamily="ui-monospace, monospace">
                {UNKNOWN.seller} · {UNKNOWN.amount}
              </text>
              {landU < 0.2 && unkU > 0.9 && (
                <text x={x} y={y - 24} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  not in seller_category_map
                </text>
              )}
            </g>
          );
        })()}

        {/* ---- the overrides heap ---- */}
        <g opacity={heapU * dimAll}>
          <rect x={HEAP.x - 130} y={HEAP.y - 90} width={260} height={190} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.3} />
          <text x={HEAP.x} y={HEAP.y - 64} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontFamily="ui-monospace, monospace">
            crowd_overrides['Joes Diner']
          </text>
          {/* tiny heap triangle */}
          {[
            { x: HEAP.x, y: HEAP.y - 28, t: 'FOOD × 212', top: true },
            { x: HEAP.x - 55, y: HEAP.y + 16, t: 'SHOPPING × 3', top: false },
            { x: HEAP.x + 55, y: HEAP.y + 16, t: 'GAS × 1', top: false },
          ].map((n, i) => (
            <g key={i}>
              {i > 0 && <line x1={HEAP.x} y1={HEAP.y - 20} x2={n.x} y2={n.y - 10} stroke={colors.GRID} strokeWidth={1.2} />}
              <rect x={n.x - 52} y={n.y - 12} width={104} height={26} rx={6} fill={colors.BG} stroke={n.top && peekU > 0.05 ? colors.POSITIVE : colors.GRID} strokeWidth={n.top && peekU > 0.05 ? 2 : 1.1} />
              <text x={n.x} y={n.y + 5} textAnchor="middle" fill={n.top ? colors.TEXT : colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
                {n.t}
              </text>
            </g>
          ))}
          <text x={HEAP.x} y={HEAP.y + 68} textAnchor="middle" fill={peekU > 0.05 ? colors.POSITIVE : colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
            peek_min() · O(1)
          </text>
        </g>

        {/* ---- the budget template bars ---- */}
        <g opacity={budU * dimAll}>
          {CATS.map((c, i) => {
            const h = 140 * c.share * budU;
            return (
              <g key={c.name}>
                <rect x={binX(i) + 24} y={BIN_Y - 16 - h} width={BIN_W - 48} height={h} rx={6} fill={c.color} opacity={0.4} />
                <text x={binX(i) + BIN_W / 2} y={BIN_Y - 24 - h} textAnchor="middle" fill={c.color} fontSize={11.5} fontFamily="ui-monospace, monospace">
                  income × .{Math.round(c.share * 10)}
                </text>
              </g>
            );
          })}
          <text x={640} y={BIN_Y - 180} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            create_budget_template() — overrides saved in budget_overrides
          </text>
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={290} y={220} width={700} height={230} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={270} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            how a transaction learns its name
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontFamily="ui-monospace, monospace">
            seller_category_map → crowd overrides heap → None
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontStyle="italic">
            defaults are computed, exceptions are stored
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
