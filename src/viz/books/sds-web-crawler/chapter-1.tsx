// The Frontier: a billion links, one loop
//
// Backed by: solutions/system_design/web_crawler/README.md (Step 3, "Use case:
// Service crawls a list of urls") and web_crawler_snippets.py (Crawler.crawl,
// PagesDataStore.extract_max_priority_page / add_link_to_crawl /
// insert_crawled_link). The whole chapter is ONE machine: a dark web graph on
// the left, the frontier as a ranked ladder (links_to_crawl, a Redis sorted
// set) on the right, and the crawled_links ledger under it. We watch the crawl
// loop run: pop the top link, fetch, harvest child links back into the ladder,
// stamp the page + signature into the ledger — twice in detail, then a montage.
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
import { Packet } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The web — ~34 pages, seeded scatter layout with a minimum spacing, each
// linking to a few nearby pages. All precomputed; playback is pure.
// ---------------------------------------------------------------------------

const FIELD = { x0: 90, y0: 100, x1: 730, y1: 590 } as const;
const N_NODES = 34;
const rand = mulberry32(20260715);

interface PageNode {
  x: number;
  y: number;
  label: string;
  /** overall site popularity — the initial ranking of links_to_crawl */
  pop: number;
  /** content signature rendered as a tiny barcode */
  bars: number[];
}

const NODES: PageNode[] = (() => {
  const out: PageNode[] = [];
  while (out.length < N_NODES) {
    const x = FIELD.x0 + rand() * (FIELD.x1 - FIELD.x0);
    const y = FIELD.y0 + rand() * (FIELD.y1 - FIELD.y0);
    if (out.every((p) => (p.x - x) ** 2 + (p.y - y) ** 2 > 82 ** 2)) {
      const i = out.length;
      out.push({
        x,
        y,
        // the primer seeds the crawl with popular portals that link outward
        label: i === 0 ? 'yahoo' : i === 1 ? 'dmoz' : `page ${i}`,
        pop: i === 0 ? 0.97 : i === 1 ? 0.93 : 0.15 + rand() * 0.65,
        bars: Array.from({ length: 9 }, () => (rand() > 0.45 ? 1 : 0)),
      });
    }
  }
  return out;
})();

/** Directed links: each page points at 2–3 nearby pages. */
const EDGES: Array<[number, number]> = (() => {
  const es: Array<[number, number]> = [];
  for (let i = 0; i < N_NODES; i++) {
    const near = NODES.map((p, j) => ({ j, d: (p.x - NODES[i].x) ** 2 + (p.y - NODES[i].y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);
    const k = 2 + Math.floor(rand() * 2);
    for (let c = 0; c < k; c++) {
      const pick = near[Math.floor(rand() * near.length)].j;
      if (!es.some(([f, t]) => f === i && t === pick)) es.push([i, pick]);
    }
  }
  return es;
})();

const OUT: number[][] = NODES.map((_, i) => EDGES.filter(([f]) => f === i).map(([, t]) => t));

// ---------------------------------------------------------------------------
// The crawl simulation — the exact loop from web_crawler_snippets.py:
//   page = extract_max_priority_page(); crawl_page(page): children →
//   add_link_to_crawl, then remove_link_to_crawl + insert_crawled_link.
// We record, for every fetch, the ladder state before/after so the frontier
// can be rendered at any scrub position.
// ---------------------------------------------------------------------------

const LADDER_ROWS = 6;
const N_FETCH = 24; // how deep the montage runs

interface Row {
  node: number;
  isNew: boolean;
}

interface Fetch {
  node: number;
  kids: number[];
}

const FETCHES: Fetch[] = [];
/**
 * Ladder snapshots, 2 per fetch so the pop and the arriving children are
 * separate moments: [T0, P0, A0, P1, A1, …] where P = after the pop (top link
 * gone, children not yet added) and A = after add_link_to_crawl.
 */
const LSTATES: Row[][] = [];

(() => {
  const frontier: number[] = [0, 1, 2, 3, 4];
  const seen = new Set(frontier);
  const tops = (fresh: Set<number>): Row[] =>
    [...frontier]
      .sort((a, b) => NODES[b].pop - NODES[a].pop)
      .slice(0, LADDER_ROWS)
      .map((node) => ({ node, isNew: fresh.has(node) }));
  LSTATES.push(tops(new Set()));
  for (let k = 0; k < N_FETCH && frontier.length; k++) {
    frontier.sort((a, b) => NODES[b].pop - NODES[a].pop);
    const node = frontier.shift()!;
    LSTATES.push(tops(new Set())); // P_k — popped, children pending
    const kids = OUT[node].filter((c) => !seen.has(c));
    for (const c of kids) {
      seen.add(c);
      frontier.push(c);
    }
    FETCHES.push({ node, kids });
    LSTATES.push(tops(new Set(kids))); // A_k
  }
})();

// ---------------------------------------------------------------------------
// Layout — ladder (links_to_crawl) + ledger (crawled_links) on the right.
// ---------------------------------------------------------------------------

const LAD = { x: 815, y0: 132, w: 386, rowH: 46 } as const;
const LED = { x: 815, y0: 492, w: 386, rowH: 34 } as const;

const ladderRowY = (i: number): number => LAD.y0 + i * LAD.rowH;

const CAM_LADDER: CameraState = { x: 985, y: 255, k: 1.42 };
const CAM_FETCH: CameraState = { x: NODES[0].x + 160, y: NODES[0].y, k: 1.3 };
const CAM_LEDGER: CameraState = { x: 985, y: 520, k: 1.5 };
const CAM_MID: CameraState = { x: 700, y: 340, k: 1.08 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  graphU: ChannelRef<number>;
  ladderU: ChannelRef<number>;
  ledgerU: ChannelRef<number>;
  ladderK: ChannelRef<number>;
  pop0: ChannelRef<number>;
  kids0: ChannelRef<number>;
  stamp0: ChannelRef<number>;
  glow0: ChannelRef<number>;
  sigGlow: ChannelRef<number>;
  pop1: ChannelRef<number>;
  kids1: ChannelRef<number>;
  stamp1: ChannelRef<number>;
  montIdx: ChannelRef<number>;
  statsU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const graphU = tl.channel('graphU', 0); // web scatter reveal
  const ladderU = tl.channel('ladderU', 0); // frontier panel reveal
  const ledgerU = tl.channel('ledgerU', 0); // crawled_links panel reveal
  const ladderK = tl.channel('ladderK', 0); // which LSTATES snapshot shows
  const pop0 = tl.channel('pop0', 0); // fetch 0: top chip → page
  const kids0 = tl.channel('kids0', 0); // fetch 0: children → ladder
  const stamp0 = tl.channel('stamp0', 0); // fetch 0: ledger row lands
  const glow0 = tl.channel('glow0', 0); // highlight freshly slotted chips
  const sigGlow = tl.channel('sigGlow', 0); // the signature foreshadow
  const pop1 = tl.channel('pop1', 0); // fetch 1, compressed
  const kids1 = tl.channel('kids1', 0);
  const stamp1 = tl.channel('stamp1', 0);
  const montIdx = tl.channel('montIdx', 2); // montage: fetch counter 2 → N
  const statsU = tl.channel('statsU', 0); // 1,600/s · 4B/mo chips
  const closeU = tl.channel('closeU', 0); // quiet closing panel

  // — Beat 1 · the problem —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'You are asked to design a web crawler. A billion links to visit, and behind every one of them, pages linking to pages linking to more pages.',
  });
  tl.tween(graphU, 1, { at: 0.7, dur: 2.6, ease: ease.draw });
  tl.hold(7.5, 0.5);

  // — Beat 2 · the frontier —
  tl.caption({
    at: 8.0,
    dur: 7.5,
    text: 'The design starts with one list: links to crawl, ranked by overall site popularity. This ranked list is the frontier, everything the crawler still owes a visit.',
  });
  tl.tween(cam, { x: 900, y: 320, k: 1.18 }, { at: 8.2, dur: 1.5, ease: ease.move });
  tl.tween(ladderU, 1, { at: 8.8, dur: 1.2, ease: ease.enter });
  tl.hold(15.5, 0.5);

  // — Beat 3 · a sorted set —
  tl.caption({
    at: 16.0,
    dur: 6.5,
    text: 'You can seed it with big portals that link outward, and keep it in a sorted set, so the most promising link is always sitting on top.',
  });
  tl.tween(cam, CAM_LADDER, { at: 16.2, dur: 1.4, ease: ease.move });
  tl.hold(22.5, 0.5);

  // — Beat 4 · pop —
  tl.caption({
    at: 23.0,
    dur: 5.5,
    text: 'The crawler service runs one loop. First move: take the top ranked link off the frontier.',
  });
  tl.tween(pop0, 1, { at: 24.4, dur: 2.2, ease: ease.move });
  tl.set(ladderK, 1, 26.6); // P0 — popped, children pending
  tl.hold(28.5, 0.5);

  // — Beat 5 · fetch —
  tl.caption({
    at: 29.0,
    dur: 6.5,
    text: 'It fetches that page and reads two things out of it: the content itself, and every child link the page points to.',
  });
  tl.tween(cam, CAM_FETCH, { at: 29.2, dur: 1.4, ease: ease.move });
  tl.hold(35.5, 0.5);

  // — Beat 6 · children join —
  tl.caption({
    at: 36.0,
    dur: 6.5,
    text: 'Each child link is added back to the frontier and slotted in by rank. The web feeds the crawler the rest of the web.',
  });
  tl.tween(kids0, 1, { at: 36.4, dur: 2.6, ease: ease.linear });
  tl.set(ladderK, 2, 39.0); // A0 — children slotted in by rank
  tl.tween(glow0, 1, { at: 39.0, dur: 0.3, ease: ease.enter });
  tl.tween(cam, CAM_LADDER, { at: 37.2, dur: 1.4, ease: ease.move });
  tl.tween(glow0, 0, { at: 41.2, dur: 1.2, ease: ease.move });
  tl.hold(42.0, 0.5);

  // — Beat 7 · bookkeeping —
  tl.caption({
    at: 42.5,
    dur: 7,
    text: 'Then the bookkeeping: the link comes off the to do list, and the page is stamped into a second table, crawled links, together with a signature of its content.',
  });
  tl.tween(cam, CAM_LEDGER, { at: 42.7, dur: 1.4, ease: ease.move });
  tl.tween(ledgerU, 1, { at: 43.0, dur: 1.0, ease: ease.enter });
  tl.tween(stamp0, 1, { at: 44.2, dur: 1.2, ease: ease.move });
  tl.hold(49.5, 0.3);

  // — Beat 8 · foreshadow —
  tl.caption({ at: 50.0, dur: 3.6, text: 'That signature matters later. Hold that thought.' });
  tl.tween(sigGlow, 1, { at: 50.2, dur: 0.5, ease: ease.pop });
  tl.tween(sigGlow, 0, { at: 52.6, dur: 1.0, ease: ease.move });
  tl.hold(53.6, 0.4);

  // — Beat 9 · the loop repeats —
  tl.caption({
    at: 54.0,
    dur: 6.5,
    text: 'And the loop repeats. Pop the next winner, fetch it, harvest the children, stamp the record.',
  });
  tl.tween(cam, CAM_MID, { at: 54.2, dur: 1.5, ease: ease.move });
  tl.tween(pop1, 1, { at: 55.0, dur: 1.4, ease: ease.move });
  tl.set(ladderK, 3, 56.4); // P1
  tl.tween(kids1, 1, { at: 56.6, dur: 1.8, ease: ease.linear });
  tl.set(ladderK, 4, 58.4); // A1
  tl.tween(stamp1, 1, { at: 58.6, dur: 1.0, ease: ease.move });
  tl.hold(60.0, 0.5);

  // — Beat 10 · montage —
  tl.caption({
    at: 60.5,
    dur: 5.0,
    text: 'From here the machine takes over. Watch the frontier churn as the graph lights up.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 60.7, dur: 1.6, ease: ease.move });
  tl.tween(montIdx, N_FETCH, { at: 61.5, dur: 10.5, ease: ease.linear });

  // — Beat 11 · no route was planned —
  tl.caption({
    at: 66.0,
    dur: 6.5,
    text: "Notice what never happens: nobody plans a route through the web. The frontier's ranking is the route.",
  });

  // — Beat 12 · the numbers —
  tl.caption({
    at: 73.0,
    dur: 7,
    text: 'Run this loop across a fleet of crawler machines and the numbers get big: sixteen hundred pages written every second, four billion fetches a month.',
  });
  tl.tween(statsU, 1, { at: 73.6, dur: 0.9, ease: ease.pop });
  tl.hold(80.0, 0.5);

  // — Beat 13 · quiet close —
  tl.caption({
    at: 80.5,
    dur: 7,
    text: 'One ranked list, one loop, two tables. That is the whole skeleton. Everything else in this design is keeping this loop honest.',
  });
  tl.tween(closeU, 1, { at: 80.9, dur: 1.4, ease: ease.move });
  tl.hold(88.0, 1.5);

  return {
    tl,
    cam,
    graphU,
    ladderU,
    ledgerU,
    ladderK,
    pop0,
    kids0,
    stamp0,
    glow0,
    sigGlow,
    pop1,
    kids1,
    stamp1,
    montIdx,
    statsU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — every frame a pure function of the sampled channels.
// ---------------------------------------------------------------------------

/** ladderK / montage fetch count → LSTATES snapshot. */
function ladderState(idx: number): Row[] {
  return LSTATES[Math.max(0, Math.min(LSTATES.length - 1, Math.round(idx)))];
}

function Barcode({ x, y, bars, w = 44, h = 14, color = colors.WARM, opacity = 1 }: {
  x: number; y: number; bars: number[]; w?: number; h?: number; color?: string; opacity?: number;
}) {
  const bw = w / bars.length;
  return (
    <g opacity={opacity}>
      {bars.map((b, i) =>
        b ? <rect key={i} x={x + i * bw} y={y} width={bw * 0.62} height={h} fill={color} /> : null,
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const graphU = s.get(scene.graphU);
  const ladderU = s.get(scene.ladderU);
  const ledgerU = s.get(scene.ledgerU);
  const ladderK = s.get(scene.ladderK);
  const pop0 = s.get(scene.pop0);
  const kids0 = s.get(scene.kids0);
  const stamp0 = s.get(scene.stamp0);
  const glow0 = s.get(scene.glow0);
  const sigGlow = s.get(scene.sigGlow);
  const pop1 = s.get(scene.pop1);
  const kids1 = s.get(scene.kids1);
  const stamp1 = s.get(scene.stamp1);
  const montIdx = s.get(scene.montIdx);
  const statsU = s.get(scene.statsU);
  const closeU = s.get(scene.closeU);

  const montOn = montIdx > 2.02;
  // how many fetches are complete right now
  const crawledN = montOn
    ? Math.floor(montIdx)
    : (stamp0 >= 0.6 ? 1 : 0) + (stamp1 >= 0.6 ? 1 : 0);
  const litAt = (i: number): number => {
    const k = FETCHES.findIndex((f) => f.node === i);
    if (k < 0) return 0;
    if (k === 0) return pop0 >= 0.96 ? 1 : 0;
    if (k === 1) return pop1 >= 0.96 ? 1 : 0;
    return clamp01((montIdx - k) * 1.6);
  };

  // during the montage the ladder churns with the fetch counter (A states)
  const ladderRows = montOn ? ladderState(2 * Math.floor(montIdx)) : ladderState(ladderK);
  // rows scoot up while the top chip is being popped
  const scoot0 = ladderK < 0.5 ? clamp01(pop0 * 2) : 0;
  const scoot1 = ladderK >= 1.5 && ladderK < 2.5 ? clamp01(pop1 * 2) : 0;
  const scoot = montOn ? 0 : Math.max(scoot0, scoot1);
  const hideTop =
    !montOn &&
    ((ladderK < 0.5 && pop0 > 0) || (ladderK >= 1.5 && ladderK < 2.5 && pop1 > 0 && pop1 < 1));

  const fetch0 = FETCHES[0];
  const fetch1 = FETCHES[1];
  const dimAll = 1 - closeU * 0.86;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the web graph ---- */}
        <g opacity={dimAll}>
          {EDGES.map(([f, t], i) => {
            const lit = Math.max(litAt(f) * 0.5, 0);
            return (
              <line
                key={i}
                x1={NODES[f].x}
                y1={NODES[f].y}
                x2={NODES[t].x}
                y2={NODES[t].y}
                stroke={lit > 0.05 ? colors.ACCENT : colors.MUTED}
                strokeWidth={lit > 0.05 ? 1.3 : 0.7}
                opacity={graphU * (0.09 + lit * 0.5)}
              />
            );
          })}
          {NODES.map((p, i) => {
            const appear = clamp01(graphU * 1.6 - (i / N_NODES) * 0.6);
            const lit = litAt(i);
            const r = 4 + p.pop * 7 + lit * 2;
            return (
              <g key={i} opacity={appear}>
                {lit > 0.02 && (
                  <circle cx={p.x} cy={p.y} r={r + 7} fill={colors.ACCENT} opacity={0.16 * lit} />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={lit > 0.02 ? colors.ACCENT : colors.PANEL}
                  stroke={lit > 0.02 ? colors.ACCENT : colors.MUTED}
                  strokeWidth={1.2}
                  opacity={0.35 + 0.65 * Math.max(lit, p.pop * 0.6)}
                />
                {i < 2 && (
                  <text x={p.x} y={p.y - r - 7} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
          <text x={(FIELD.x0 + FIELD.x1) / 2} y={78} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={graphU * 0.9}>
            the web — every dot a page, every line a link
          </text>
        </g>

        {/* ---- the frontier ladder: links_to_crawl ---- */}
        <g opacity={ladderU * dimAll}>
          <text x={LAD.x} y={LAD.y0 - 30} fill={colors.TEXT} fontSize={16}>
            the frontier
          </text>
          <text x={LAD.x} y={LAD.y0 - 10} fill={colors.ACCENT} fontSize={12.5} fontFamily="ui-monospace, monospace">
            links_to_crawl · Redis sorted set
          </text>
          {ladderRows.map((row, i) => {
            if (i === 0 && hideTop) return null;
            const y = ladderRowY(i) - (i > 0 ? scoot * LAD.rowH : 0);
            const p = NODES[row.node];
            const newGlow = row.isNew ? glow0 : 0;
            return (
              <g key={`${row.node}-${i}`}>
                <rect
                  x={LAD.x}
                  y={y}
                  width={LAD.w}
                  height={LAD.rowH - 8}
                  rx={8}
                  fill={colors.PANEL}
                  stroke={newGlow > 0.02 ? colors.POSITIVE : i === 0 ? colors.ACCENT : colors.GRID}
                  strokeWidth={newGlow > 0.02 ? 1.8 : 1.2}
                />
                <text x={LAD.x + 14} y={y + 24} fill={colors.TEXT} fontSize={14}>
                  {p.label}
                </text>
                <rect x={LAD.x + 200} y={y + 13} width={150 * p.pop} height={12} rx={6} fill={i === 0 ? colors.ACCENT : colors.MUTED} opacity={0.75} />
              </g>
            );
          })}
          <text x={LAD.x + 200} y={LAD.y0 + LADDER_ROWS * LAD.rowH + 2} fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace" opacity={0.85}>
            extract_max_priority_page()
          </text>
        </g>

        {/* fetch 0: the popped chip flies to its page; children fly back */}
        {pop0 > 0 && pop0 < 1 && (
          <g opacity={1 - Math.max(0, pop0 - 0.85) / 0.15}>
            <rect
              x={LAD.x + (NODES[fetch0.node].x - LAD.x) * pop0}
              y={ladderRowY(0) + (NODES[fetch0.node].y - ladderRowY(0)) * pop0}
              width={LAD.w * (1 - pop0 * 0.8)}
              height={LAD.rowH - 8}
              rx={8}
              fill={colors.PANEL}
              stroke={colors.ACCENT}
              strokeWidth={1.5}
            />
          </g>
        )}
        {kids0 > 0 &&
          fetch0.kids.map((c, i) => (
            <Packet
              key={c}
              from={{ x: NODES[fetch0.node].x, y: NODES[fetch0.node].y }}
              to={{ x: LAD.x + 30, y: ladderRowY(2 + (i % 3)) + 16 }}
              u={clamp01(kids0 * (fetch0.kids.length + 0.6) - i)}
              r={6}
              color={colors.POSITIVE}
            />
          ))}
        {pop1 > 0 && pop1 < 1 && (
          <Packet
            from={{ x: LAD.x + 30, y: ladderRowY(0) + 16 }}
            to={{ x: NODES[fetch1.node].x, y: NODES[fetch1.node].y }}
            u={pop1}
            r={7}
            color={colors.ACCENT}
          />
        )}
        {kids1 > 0 &&
          fetch1.kids.map((c, i) => (
            <Packet
              key={c}
              from={{ x: NODES[fetch1.node].x, y: NODES[fetch1.node].y }}
              to={{ x: LAD.x + 30, y: ladderRowY(2 + (i % 3)) + 16 }}
              u={clamp01(kids1 * (fetch1.kids.length + 0.6) - i)}
              r={6}
              color={colors.POSITIVE}
            />
          ))}
        {(kids0 > 0.05 || kids1 > 0.05) && kids0 < 1 && (
          <text x={LAD.x + 30} y={ladderRowY(1) - 14} fill={colors.POSITIVE} fontSize={11.5} fontFamily="ui-monospace, monospace" opacity={Math.max(kids0 > 0 && kids0 < 1 ? 1 : 0, kids1 > 0 && kids1 < 1 ? 1 : 0)}>
            add_link_to_crawl(url)
          </text>
        )}

        {/* ---- the ledger: crawled_links ---- */}
        <g opacity={ledgerU * dimAll}>
          <text x={LED.x} y={LED.y0 - 12} fill={colors.WARM} fontSize={12.5} fontFamily="ui-monospace, monospace">
            crawled_links · url + signature
          </text>
          {Array.from({ length: Math.min(3, crawledN) }, (_, r) => {
            const f = FETCHES[crawledN - 1 - r];
            const u = r === 0 ? (montOn ? 1 : crawledN === 1 ? stamp0 : stamp1) : 1;
            const y = LED.y0 + r * LED.rowH;
            return (
              <g key={`${crawledN}-${r}`} opacity={u * (1 - r * 0.28)}>
                <rect x={LED.x} y={y + (1 - u) * -16} width={LED.w} height={LED.rowH - 6} rx={7} fill={colors.PANEL} stroke={r === 0 && sigGlow > 0.02 ? colors.WARM : colors.GRID} strokeWidth={r === 0 && sigGlow > 0.02 ? 2 : 1} />
                <text x={LED.x + 12} y={y + 19} fill={colors.TEXT} fontSize={12.5}>
                  {NODES[f.node].label}
                </text>
                <Barcode x={LED.x + LED.w - 64} y={y + 7} bars={NODES[f.node].bars} opacity={0.55 + 0.45 * (r === 0 ? sigGlow : 0)} />
              </g>
            );
          })}
          {crawledN > 0 && (
            <text x={LED.x + LED.w} y={LED.y0 + 3 * LED.rowH + 18} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
              insert_crawled_link(url, signature) · {crawledN} crawled
            </text>
          )}
        </g>

        {/* ---- scale stats ---- */}
        <g opacity={statsU * dimAll}>
          <rect x={200} y={606} width={230} height={30} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={315} y={626} textAnchor="middle" fill={colors.ACCENT} fontSize={14}>
            1,600 write requests / s
          </text>
          <rect x={450} y={606} width={230} height={30} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={565} y={626} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            4 billion links / month
          </text>
        </g>

        {/* ---- quiet closing panel ---- */}
        <g opacity={closeU}>
          <rect x={280} y={210} width={720} height={250} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={258} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the crawl loop
          </text>
          <rect x={330} y={300} width={180} height={54} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.4} />
          <text x={420} y={323} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontFamily="ui-monospace, monospace">
            links_to_crawl
          </text>
          <text x={420} y={341} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            ranked frontier
          </text>
          <line x1={510} y1={327} x2={560} y2={327} stroke={colors.MUTED} strokeWidth={1.5} />
          <rect x={560} y={294} width={160} height={66} rx={10} fill={colors.BG} stroke={colors.TEXT} strokeWidth={1.4} />
          <text x={640} y={321} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
            Crawler Service
          </text>
          <text x={640} y={341} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">
            crawl_page(page)
          </text>
          <line x1={720} y1={327} x2={770} y2={327} stroke={colors.MUTED} strokeWidth={1.5} />
          <rect x={770} y={300} width={180} height={54} rx={10} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
          <text x={860} y={323} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily="ui-monospace, monospace">
            crawled_links
          </text>
          <text x={860} y={341} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            url + signature
          </text>
          <text x={640} y={412} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontStyle="italic">
            pop the winner · fetch · feed the children back · stamp the record
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
