// The Frontier: a billion links, one loop
//
// Backing files (donnemartin/system-design-primer):
//   solutions/system_design/web_crawler/README.md — "Use case: Service crawls
//   a list of urls" (links_to_crawl / crawled_links, Redis sorted sets, the
//   crawl loop, Reverse Index / Document Service queues, the usage math)
//   solutions/system_design/web_crawler/web_crawler_snippets.py — Crawler,
//   Page, PagesDataStore and their methods.
//
// The machine: a lattice of web pages on the left, the ranked frontier
// (`links_to_crawl`) as a living priority column on the right. One link is
// popped, fetched, its children fly back into the column, its contents fan
// out to the two index queues, and the link retires into `crawled_links`
// with a signature. Then the loop runs on its own and the web lights up.
import { CAMERA_HOME, MathLabel, Timeline, colors, ease, mulberry32 } from '../../core';
import { Camera, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, Packet, ServiceNode } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/* --------------------------------------------------------------------- */
/* The web lattice (left half). Seeded, precomputed, pure.                */
/* --------------------------------------------------------------------- */

interface Pt {
  x: number;
  y: number;
}

const rand = mulberry32(11);

/** ~40 pages on a jittered grid, x 80..520, y 110..580. */
export const LATTICE: Pt[] = (() => {
  const pts: Pt[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 6; c++) {
      pts.push({
        x: 84 + c * 84 + (rand() - 0.5) * 42,
        y: 116 + r * 76 + (rand() - 0.5) * 34,
      });
    }
  }
  return pts;
})();

/** Sparse links: each page points at a couple of nearby pages. */
export const LAT_EDGES: Array<[number, number]> = (() => {
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < LATTICE.length; i++) {
    const near = LATTICE.map((p, j) => ({ j, d: Math.hypot(p.x - LATTICE[i].x, p.y - LATTICE[i].y) }))
      .filter((n) => n.j !== i)
      .sort((a, b) => a.d - b.d);
    edges.push([i, near[0].j]);
    if (rand() > 0.45) edges.push([i, near[1 + Math.floor(rand() * 2)].j]);
  }
  return edges;
})();

/** The order pages light up as the loop churns (a seeded shuffle). */
const LIT_ORDER: number[] = (() => {
  const idx = LATTICE.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]).map(([, order]) => order);
})();

/** The page the first pop fetches: the lattice node nearest (470, 300). */
const FETCH_I = LATTICE.map((p, i) => ({ i, d: Math.hypot(p.x - 470, p.y - 300) })).sort(
  (a, b) => a.d - b.d,
)[0].i;
const FETCH = LATTICE[FETCH_I];

/** Targets for the closing self-running pops. */
const LOOP_TARGETS = [
  LATTICE.map((p, i) => ({ i, d: Math.hypot(p.x - 160, p.y - 180) })).sort((a, b) => a.d - b.d)[0].i,
  LATTICE.map((p, i) => ({ i, d: Math.hypot(p.x - 380, p.y - 500) })).sort((a, b) => a.d - b.d)[0].i,
  LATTICE.map((p, i) => ({ i, d: Math.hypot(p.x - 140, p.y - 420) })).sort((a, b) => a.d - b.d)[0].i,
];

/* --------------------------------------------------------------------- */
/* The frontier column (`links_to_crawl`) and the crawled table.          */
/* --------------------------------------------------------------------- */

export const COL = { x: 600, y0: 196, step: 44, wMin: 96, wMax: 268 };
const slotY = (r: number) => COL.y0 + r * COL.step;
const barW = (pr: number) => COL.wMin + (COL.wMax - COL.wMin) * pr;

/** Seed links (README: "seed the crawler with popular sites… Yahoo, DMOZ").
 *  r0 = rank before the children arrive, r1 = rank after (yahoo still #1). */
const SEEDS = [
  { url: 'yahoo.com', pr: 0.98, r0: 0, r1: 0 },
  { url: 'dmoz.org', pr: 0.91, r0: 1, r1: 1 },
  { url: 'foo.com', pr: 0.72, r0: 2, r1: 3 },
  { url: 'bar.com', pr: 0.55, r0: 3, r1: 5 },
  { url: 'baz.com', pr: 0.41, r0: 4, r1: 7 },
];
/** Child links discovered on the fetched page (they fly back in ranked). */
const CHILDREN = [
  { url: 'yahoo.com/news', pr: 0.88, r1: 2 },
  { url: 'yahoo.com/finance', pr: 0.63, r1: 4 },
  { url: 'yahoo.com/sports', pr: 0.5, r1: 6 },
];

export const CRAWLED = { x: 985, y0: 196, step: 40, w: 250 };

/** The two downstream queues (snippets: reverse_index_queue / doc_index_queue). */
const Q_RI = { x: 1080, y: 468 };
const Q_DOC = { x: 1080, y: 560 };

/** Content fan-out paths route BELOW the column so nothing is crossed. */
const FAN_RI: Pt[] = [FETCH, { x: 600, y: 585 }, { x: 930, y: 540 }, { x: Q_RI.x - 110, y: Q_RI.y }];
const FAN_DOC: Pt[] = [FETCH, { x: 640, y: 600 }, { x: Q_DOC.x - 110, y: Q_DOC.y }];

const CAM_COLUMN: CameraState = { x: 655, y: 300, k: 1.32 };
const CAM_QUEUES: CameraState = { x: 800, y: 430, k: 1.14 };
const CAM_CRAWLED: CameraState = { x: 880, y: 320, k: 1.22 };

/* --------------------------------------------------------------------- */
/* Timeline                                                               */
/* --------------------------------------------------------------------- */

export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const latU = tl.channel('latU', 0); // lattice dots + links draw in
  const statU = tl.channel('statU', 0); // the big usage numbers
  const colU = tl.channel('colU', 0); // frontier column frame
  const barsU = tl.channel('barsU', 0); // seed bars stagger (0..5)
  const popHi = tl.channel('popHi', 0); // top bar highlight + pop chip
  const fetchU = tl.channel('fetchU', 0); // packet column → page
  const pageGlow = tl.channel('pageGlow', 0);
  const pageChipU = tl.channel('pageChipU', 0); // Page(url, contents, child_urls)
  const backP = tl.channel('backP', 0); // child sparks page → column (0..1)
  const insertU = tl.channel('insertU', 0); // bars re-rank, children slot in
  const qU = tl.channel('qU', 0); // the two queues reveal
  const fanU = tl.channel('fanU', 0); // contents → queues (0..1)
  const crawledU = tl.channel('crawledU', 0); // crawled_links panel
  const retireU = tl.channel('retireU', 0); // yahoo bar → crawled row
  const sigU = tl.channel('sigU', 0); // the signature chip pop
  const loopP = tl.channel('loopP', 0); // closing self-running pops (0..3)
  const litP = tl.channel('litP', 0); // lattice lights up (0..1)

  // ---- beat 1: the job, in numbers -------------------------------------
  tl.caption({
    at: 0.3,
    dur: 7.0,
    text: "A billion links. Crawl them all, keep them fresh, and feed a search engine answering forty thousand queries a second. That's the job — let's build the machine.",
  });
  tl.tween(latU, 1, { at: 0.6, dur: 2.4, ease: ease.draw });
  tl.tween(statU, 1, { at: 2.4, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 7.7,
    dur: 5.4,
    text: "Here's a corner of the web: pages, and links between them. The crawler's whole life is deciding which link to follow next.",
  });
  tl.hold(13.1, 0.5);

  // ---- beat 2: the frontier — a ranked to-do list ------------------------
  tl.caption({
    at: 13.6,
    dur: 5.8,
    text: 'So the design starts with a ranked to-do list: every link still waiting sits in one store, sorted by priority.',
  });
  tl.tween(statU, 0, { at: 13.8, dur: 0.7, ease: ease.enter });
  tl.tween(colU, 1, { at: 14.6, dur: 1.0, ease: ease.draw });
  tl.tween(barsU, 5, { at: 15.2, dur: 1.8, ease: ease.enter });
  tl.caption({
    at: 19.8,
    dur: 6.4,
    text: 'We seed it with popular sites that link outward. Then the crawl service runs one loop, and step one is: take the highest priority link off the top.',
  });
  tl.tween(popHi, 1, { at: 23.4, dur: 0.6, ease: ease.pop });
  tl.hold(26.2, 0.5);

  // ---- beat 3: pop + fetch ----------------------------------------------
  tl.tween(cam, CAM_COLUMN, { at: 26.7, dur: 1.3, ease: ease.move });
  tl.tween(fetchU, 1, { at: 27.6, dur: 1.6, ease: ease.linear });
  tl.tween(pageGlow, 1, { at: 29.0, dur: 0.4, ease: ease.pop });
  tl.caption({
    at: 29.4,
    dur: 5.6,
    text: 'Fetch that page. It comes back holding everything we came for: its contents, and every link it points to.',
  });
  tl.tween(pageChipU, 1, { at: 30.2, dur: 0.6, ease: ease.enter });
  tl.hold(35.2, 0.4);

  // ---- beat 4: children fly back into the frontier -----------------------
  tl.caption({
    at: 35.6,
    dur: 6.0,
    text: 'Each child link goes straight back into the to-do list, slotted in at its own priority. The frontier feeds itself.',
  });
  tl.tween(backP, 1, { at: 36.2, dur: 2.4, ease: ease.linear });
  tl.tween(insertU, 1, { at: 38.2, dur: 1.4, ease: ease.move });
  tl.tween(pageChipU, 0, { at: 40.4, dur: 0.5, ease: ease.enter });
  tl.hold(41.8, 0.4);

  // ---- beat 5: contents fan out to the two queues ------------------------
  tl.tween(cam, CAM_QUEUES, { at: 42.2, dur: 1.3, ease: ease.move });
  tl.tween(qU, 1, { at: 42.6, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 43.0,
    dur: 7.0,
    text: 'The contents fan out to two queues: one builds the reverse index that powers search, the other saves a static title and snippet for the results page.',
  });
  tl.tween(fanU, 1, { at: 44.0, dur: 2.6, ease: ease.linear });
  tl.hold(50.2, 0.5);

  // ---- beat 6: the link retires with a signature --------------------------
  tl.tween(cam, CAM_CRAWLED, { at: 50.7, dur: 1.3, ease: ease.move });
  tl.tween(crawledU, 1, { at: 51.0, dur: 0.9, ease: ease.draw });
  tl.caption({
    at: 51.6,
    dur: 6.2,
    text: 'Then the link retires. It leaves the to-do list and lands in the crawled table, filed with a signature of what the page contained.',
  });
  tl.tween(retireU, 1, { at: 52.6, dur: 1.5, ease: ease.move });
  tl.tween(sigU, 1, { at: 54.4, dur: 0.5, ease: ease.pop });
  tl.caption({ at: 58.2, dur: 3.6, text: "Hold on to that signature — it's the hero of the next chapter." });
  tl.hold(61.8, 0.5);

  // ---- beat 7: the loop runs on its own ----------------------------------
  tl.tween(cam, CAMERA_HOME, { at: 62.3, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 63.0,
    dur: 5.2,
    text: "And that's the whole loop. Pop, fetch, discover, index, retire. Run it again.",
  });
  tl.tween(loopP, 3, { at: 64.2, dur: 8.4, ease: ease.linear });
  tl.tween(litP, 0.8, { at: 64.2, dur: 12.5, ease: ease.linear });
  tl.caption({
    at: 68.6,
    dur: 7.2,
    text: "Run it four billion times a month at half a megabyte a page, and you're writing two petabytes of web into storage every month.",
  });
  tl.caption({
    at: 76.4,
    dur: 6.2,
    text: 'One list, one loop, and the web gets eaten a page at a time. Next problem: the web loops back on itself.',
  });
  tl.hold(82.4, 1.2);

  return {
    tl,
    cam,
    latU,
    statU,
    colU,
    barsU,
    popHi,
    fetchU,
    pageGlow,
    pageChipU,
    backP,
    insertU,
    qU,
    fanU,
    crawledU,
    retireU,
    sigU,
    loopP,
    litP,
  };
}

const scene = buildScene();

/* --------------------------------------------------------------------- */
/* Render helpers                                                         */
/* --------------------------------------------------------------------- */

function CodeChip({ x, y, text, u, color = colors.ACCENT }: { x: number; y: number; text: string; u: number; color?: string }) {
  if (u <= 0.002) return null;
  const w = text.length * 7.4 + 20;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={y - 13} width={w} height={26} rx={6} fill={colors.PANEL} stroke={color} strokeOpacity={0.55} />
      <text x={x} y={y + 4.5} textAnchor="middle" fill={color} fontSize={12.5} fontFamily="ui-monospace, monospace">
        {text}
      </text>
    </g>
  );
}

function FrontierBar({
  x,
  y,
  url,
  pr,
  hi = 0,
  o = 1,
  w,
}: {
  x: number;
  y: number;
  url: string;
  pr: number;
  hi?: number;
  o?: number;
  w?: number;
}) {
  if (o <= 0.002) return null;
  const width = w ?? barW(pr);
  return (
    <g opacity={o}>
      {hi > 0.002 && (
        <rect x={x - 5} y={y - 21} width={width + 10} height={42} rx={11} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={hi * 0.9} />
      )}
      <rect x={x} y={y - 16} width={width} height={32} rx={8} fill={colors.ACCENT} opacity={0.16 + pr * 0.24} />
      <rect x={x} y={y - 16} width={width} height={32} rx={8} fill="none" stroke={colors.ACCENT} strokeOpacity={0.5} />
      <text x={x + 10} y={y + 4.5} fill={colors.TEXT} fontSize={13} fontFamily="ui-monospace, monospace">
        {url}
      </text>
      <text x={x + width - 8} y={y + 4.5} textAnchor="end" fill={colors.MUTED} fontSize={12}>
        {pr.toFixed(2)}
      </text>
    </g>
  );
}

const STATS = [
  { big: '1,000,000,000', small: 'links to crawl' },
  { big: '4,000,000,000', small: 'pages crawled each month' },
  { big: '2 PB', small: 'of page content stored, monthly' },
];

function renderFrame(s: SceneState) {
  const latU = s.get(scene.latU);
  const statU = s.get(scene.statU);
  const colU = s.get(scene.colU);
  const barsU = s.get(scene.barsU);
  const popHi = s.get(scene.popHi);
  const fetchU = s.get(scene.fetchU);
  const pageGlow = s.get(scene.pageGlow);
  const pageChipU = s.get(scene.pageChipU);
  const backP = s.get(scene.backP);
  const insertU = s.get(scene.insertU);
  const qU = s.get(scene.qU);
  const fanU = s.get(scene.fanU);
  const crawledU = s.get(scene.crawledU);
  const retireU = s.get(scene.retireU);
  const sigU = s.get(scene.sigU);
  const loopP = s.get(scene.loopP);
  const litP = s.get(scene.litP);

  /** Is lattice page i lit (crawled) right now? */
  const litOf = (i: number) => {
    if (i === FETCH_I) return pageGlow;
    for (let k = 0; k < 3; k++) {
      if (LOOP_TARGETS[k] === i) return clamp01((loopP - k) * 2.5);
    }
    return clamp01(litP * LATTICE.length - LIT_ORDER[i]) * clamp01(loopP);
  };

  /** Bar vertical position through re-rank + retire. */
  const seedY = (b: (typeof SEEDS)[number]) => slotY(lerp(lerp(b.r0, b.r1, insertU), Math.max(0, b.r1 - 1), retireU));

  // the retiring yahoo bar morphs into a crawled_links row
  const yahoo = SEEDS[0];
  const retX = lerp(COL.x, CRAWLED.x, retireU);
  const retY = lerp(slotY(0), CRAWLED.y0, retireU);
  const retW = lerp(barW(yahoo.pr), CRAWLED.w, retireU);

  // closing pops: packet from the column top toward each loop target
  const popPackets = [0, 1, 2].map((k) => {
    const phase = clamp01(loopP - k);
    return { u: phase < 0.55 ? phase / 0.55 : -1, tgt: LATTICE[LOOP_TARGETS[k]] };
  });

  const crawledRows: Array<{ url: string; sig: string; u: number }> = [
    { url: 'dmoz.org', sig: '2c91af', u: clamp01((loopP - 0.6) * 2) },
    { url: 'yahoo.com/news', sig: 'e04b77', u: clamp01((loopP - 1.6) * 2) },
    { url: 'foo.com', sig: '77d3a1', u: clamp01((loopP - 2.6) * 2) },
  ];

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ---------- the web lattice ---------- */}
      {LAT_EDGES.map(([a, b], e) => {
        const u = clamp01(latU * LAT_EDGES.length * 0.5 - e * 0.5);
        const lit = Math.min(litOf(a), litOf(b));
        return (
          <line
            key={`e${e}`}
            x1={LATTICE[a].x}
            y1={LATTICE[a].y}
            x2={lerp(LATTICE[a].x, LATTICE[b].x, u)}
            y2={lerp(LATTICE[a].y, LATTICE[b].y, u)}
            stroke={lit > 0.5 ? colors.ACCENT : colors.GRID}
            strokeWidth={1}
            opacity={u * (0.35 + lit * 0.45)}
          />
        );
      })}
      {LATTICE.map((p, i) => {
        const u = clamp01(latU * LATTICE.length * 0.6 - i * 0.6);
        const lit = litOf(i);
        return (
          <g key={`n${i}`} opacity={u}>
            {lit > 0.02 && <circle cx={p.x} cy={p.y} r={9 + lit * 4} fill={colors.ACCENT} opacity={lit * 0.28} />}
            <circle cx={p.x} cy={p.y} r={4} fill={lit > 0.4 ? colors.ACCENT : colors.MUTED} opacity={0.55 + lit * 0.45} />
          </g>
        );
      })}
      <text x={90} y={80} fill={colors.MUTED} fontSize={15} opacity={latU}>
        the web — 1,000,000,000 links
      </text>

      {/* ---------- beat-1 usage numbers ---------- */}
      {statU > 0.002 && (
        <g opacity={statU}>
          {STATS.map((st, i) => (
            <g key={i}>
              <text x={930} y={222 + i * 104} textAnchor="middle" fill={colors.TEXT} fontSize={40} fontWeight={700}>
                {st.big}
              </text>
              <text x={930} y={252 + i * 104} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
                {st.small}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* ---------- the frontier column ---------- */}
      {colU > 0.002 && (
        <g opacity={colU}>
          <text x={COL.x} y={150} fill={colors.TEXT} fontSize={17} fontFamily="ui-monospace, monospace">
            links_to_crawl
          </text>
          <text x={COL.x} y={170} fill={colors.MUTED} fontSize={12.5}>
            Redis sorted set — ranked by priority
          </text>
          <line x1={COL.x - 14} y1={182} x2={COL.x - 14} y2={556} stroke={colors.GRID} strokeWidth={1.5} />
        </g>
      )}
      {SEEDS.slice(1).map((b, i) => (
        <FrontierBar key={b.url} x={COL.x} y={seedY(b)} url={b.url} pr={b.pr} o={clamp01(barsU - (i + 1))} />
      ))}
      {CHILDREN.map((b, i) => (
        <FrontierBar
          key={b.url}
          x={COL.x - (1 - insertU) * 60}
          y={slotY(lerp(b.r1, b.r1 - 1, retireU))}
          url={b.url}
          pr={b.pr}
          o={clamp01(insertU * 3 - i) * clamp01(backP * 3 - i)}
        />
      ))}
      {/* yahoo.com: the popped, fetched, and finally retired link */}
      <FrontierBar
        x={retX}
        y={retY}
        url="yahoo.com"
        pr={yahoo.pr}
        w={retW}
        hi={popHi * (1 - retireU)}
        o={clamp01(barsU)}
      />
      {sigU > 0.002 && (
        <g opacity={sigU}>
          <rect x={CRAWLED.x + CRAWLED.w - 74} y={CRAWLED.y0 - 11} width={68} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.7} />
          <text x={CRAWLED.x + CRAWLED.w - 40} y={CRAWLED.y0 + 4} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="ui-monospace, monospace">
            sig 9f31c2
          </text>
        </g>
      )}
      <CodeChip x={790} y={116} text="extract_max_priority_page()" u={popHi * (1 - retireU) * (1 - crawledU)} color={colors.WARM} />
      <CodeChip x={800} y={560} text="add_link_to_crawl(url)" u={clamp01(backP * 2) * (1 - insertU)} />

      {/* ---------- pop + fetch packet ---------- */}
      <Packet from={{ x: COL.x + 40, y: slotY(0) }} to={FETCH} u={fetchU} r={8} color={colors.WARM} label="GET yahoo.com" labelSize={12} />
      {pageChipU > 0.002 && <CodeChip x={FETCH.x + 40} y={FETCH.y - 40} text="Page(url, contents, child_urls)" u={pageChipU} />}

      {/* child sparks flying back into the column */}
      {CHILDREN.map((b, i) => (
        <Packet
          key={b.url}
          from={FETCH}
          to={{ x: COL.x + 60, y: slotY(b.r1) }}
          u={clamp01(backP * 1.6 - i * 0.3)}
          r={5.5}
          color={colors.ACCENT}
        />
      ))}

      {/* ---------- the two downstream queues ---------- */}
      <ServiceNode x={Q_RI.x} y={Q_RI.y} kind="queue" label="Reverse Index Service" sublabel="reverse_index_queue" w={220} u={qU} glow={clamp01(fanU * 1.4 - 0.4) * (1 - fanU) * 2} />
      <ServiceNode x={Q_DOC.x} y={Q_DOC.y} kind="queue" label="Document Service" sublabel="doc_index_queue" w={220} u={qU} glow={clamp01(fanU * 1.4 - 0.55) * (1 - fanU) * 2} />
      {fanU > 0.002 && fanU < 1 && (
        <g>
          <Packet from={FAN_RI[0]} to={FAN_RI[3]} u={fanU} r={7} color={colors.POSITIVE} label="contents" labelSize={11} />
          <Packet from={FAN_DOC[0]} to={FAN_DOC[2]} u={clamp01(fanU * 1.15 - 0.15)} r={7} color={colors.POSITIVE} />
        </g>
      )}

      {/* ---------- crawled_links ---------- */}
      {crawledU > 0.002 && (
        <g opacity={crawledU}>
          <text x={CRAWLED.x} y={150} fill={colors.TEXT} fontSize={17} fontFamily="ui-monospace, monospace">
            crawled_links
          </text>
          <text x={CRAWLED.x} y={170} fill={colors.MUTED} fontSize={12.5}>
            processed links + page signatures
          </text>
          <line x1={CRAWLED.x - 14} y1={182} x2={CRAWLED.x - 14} y2={380} stroke={colors.GRID} strokeWidth={1.5} />
          <CodeChip x={CRAWLED.x + 118} y={404} text="insert_crawled_link(url, signature)" u={clamp01(retireU * 2)} color={colors.WARM} />
        </g>
      )}
      {crawledRows.map((r, i) => (
        <g key={r.url} opacity={r.u * crawledU}>
          <rect x={CRAWLED.x} y={CRAWLED.y0 + (i + 1) * CRAWLED.step - 14} width={CRAWLED.w} height={28} rx={7} fill={colors.SECONDARY} opacity={0.14} />
          <text x={CRAWLED.x + 10} y={CRAWLED.y0 + (i + 1) * CRAWLED.step + 4} fill={colors.TEXT} fontSize={12.5} fontFamily="ui-monospace, monospace">
            {r.url}
          </text>
          <text x={CRAWLED.x + CRAWLED.w - 10} y={CRAWLED.y0 + (i + 1) * CRAWLED.step + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
            {r.sig}
          </text>
        </g>
      ))}

      {/* ---------- the closing self-running pops ---------- */}
      {popPackets.map((p, k) =>
        p.u >= 0 ? <Packet key={k} from={{ x: COL.x + 40, y: slotY(0) }} to={p.tgt} u={p.u} r={6.5} color={colors.WARM} /> : null,
      )}
      <MathLabel tex="\text{crawl}() : \text{pop} \to \text{fetch} \to \text{discover} \to \text{retire}" x={342} y={56} fontSize={17} opacity={clamp01(loopP * 1.4)} />
    </Camera>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
