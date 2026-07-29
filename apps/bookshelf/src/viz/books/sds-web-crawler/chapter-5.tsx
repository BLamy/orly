// The Index: where search fits
//
// Backed by: solutions/system_design/web_crawler/README.md — crawl_page adds
// jobs to the Reverse Index Service queue and Document Service queue
// (web_crawler_snippets.py: reverse_index_queue.generate(page),
// doc_index_queue.generate(page)); "User inputs a search term" use case:
// Client → Web Server (reverse proxy) → Query API (parses: removes markup,
// breaks text into terms, fixes typos, normalizes capitalization) → Reverse
// Index Service (ranks matches) + Document Service (static titles/snippets);
// sample query "hello world" returning foo/bar/baz; Memory Cache for popular
// queries; 40,000 search requests per second. The machine: the crawl loop
// feeds two queues, a word×page matrix fills (the index inverted), a query
// rides in, term rows intersect, titles attach — then the whole book recaps
// on one quiet journey strip.
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
import { Connection, Packet, RequestFlow, ServiceNode, TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const fract = (v: number): number => v - Math.floor(v);

// ---------------------------------------------------------------------------
// Layout + the inverted index data.
// ---------------------------------------------------------------------------

const CRAWLER = { x: 170, y: 150 } as const;
const RIS = { x: 590, y: 140 } as const; // Reverse Index Service
const DOCS = { x: 1030, y: 140 } as const; // Document Service

const TERMS = ['hello', 'world', 'system', 'design', 'scale', 'cache'];
const PAGES = ['foo', 'bar', 'baz', 'p7', 'p9', 'p12'];
// membership: which pages contain each term ("hello world" must hit foo/bar/baz
// — the README's sample response returns exactly those three)
const rand = mulberry32(20260718);
const MEMBER: number[][] = TERMS.map((_, t) =>
  PAGES.map((_, p) => {
    if (t === 0 && p <= 3) return 1;
    if (t === 1 && p <= 2) return 1;
    if (t <= 1) return 0;
    return rand() > 0.55 ? 1 : 0;
  }),
);
const MAT = { x0: 470, y0: 268, cell: 42 } as const;

// the search path along the bottom
const CLIENT = { x: 150, y: 545 } as const;
const WEB = { x: 390, y: 545 } as const;
const QAPI = { x: 640, y: 545 } as const;
const CACHE = { x: 880, y: 545 } as const;

// results (titles + snippets are the Document Service's static products)
const RESULTS = [
  { page: 'foo', title: "foo's title", snip: "foo's snippet" },
  { page: 'bar', title: "bar's title", snip: "bar's snippet" },
  { page: 'baz', title: "baz's title", snip: "baz's snippet" },
];

// the recap journey strip
const JOURNEY = [
  { label: 'the frontier', sub: 'ranked links' },
  { label: 'politeness', sub: 'timed visits' },
  { label: 'the signature', sub: 'no repeats' },
  { label: 'the refresh', sub: 'clocks feed links' },
  { label: 'the index', sub: 'words → pages' },
];

const CAM_CRAWL: CameraState = { x: 330, y: 200, k: 1.3 };
const CAM_MATRIX: CameraState = { x: 640, y: 320, k: 1.22 };
const CAM_DOCS: CameraState = { x: 1000, y: 300, k: 1.25 };
const CAM_SEARCH: CameraState = { x: 520, y: 470, k: 1.18 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  crawlU: ChannelRef<number>;
  loopPhase: ChannelRef<number>;
  queuesU: ChannelRef<number>;
  jobsP: ChannelRef<number>;
  fillP: ChannelRef<number>;
  invSweep: ChannelRef<number>;
  docU: ChannelRef<number>;
  searchU: ChannelRef<number>;
  reqP: ChannelRef<number>;
  parseU: ChannelRef<number>;
  matchU: ChannelRef<number>;
  resultsU: ChannelRef<number>;
  cacheP: ChannelRef<number>;
  statsU: ChannelRef<number>;
  recapU: ChannelRef<number>;
  journeyP: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CRAWL, cameraInterp);
  const crawlU = tl.channel('crawlU', 0); // crawler + its loop ring
  const loopPhase = tl.channel('loopPhase', 0); // the ring spins all chapter
  const queuesU = tl.channel('queuesU', 0); // the two queue edges
  const jobsP = tl.channel('jobsP', 0); // page jobs streaming down both
  const fillP = tl.channel('fillP', 0); // the inverted index fills
  const invSweep = tl.channel('invSweep', 0); // "inside out" row sweep
  const docU = tl.channel('docU', 0); // title/snippet cards
  const searchU = tl.channel('searchU', 0); // bottom search path reveal
  const reqP = tl.channel('reqP', 0); // client → web → query api
  const parseU = tl.channel('parseU', 0); // query → clean terms
  const matchU = tl.channel('matchU', 0); // term rows intersect columns
  const resultsU = tl.channel('resultsU', 0); // assembled results panel
  const cacheP = tl.channel('cacheP', 0); // the cached round trip
  const statsU = tl.channel('statsU', 0); // 40k searches/s chip
  const recapU = tl.channel('recapU', 0); // journey strip panel
  const journeyP = tl.channel('journeyP', 0); // stages light 0..5
  const endU = tl.channel('endU', 0); // final title

  // — Beat 1 · fuel for search —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'The crawler was never the product. Every page it fetches is fuel for the thing users actually touch: search.',
  });
  tl.tween(crawlU, 1, { at: 0.7, dur: 0.9, ease: ease.enter });
  tl.tween(loopPhase, 20, { at: 0.7, dur: 84, ease: ease.linear });
  tl.hold(6.5, 0.5);

  // — Beat 2 · two hand-offs —
  tl.caption({
    at: 7.0,
    dur: 6.5,
    text: 'Inside the crawl step there are two hand offs: every fetched page adds one job to the reverse index queue, and one to the document queue.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 7.2, dur: 1.5, ease: ease.move });
  tl.tween(queuesU, 1, { at: 7.6, dur: 1.4, ease: ease.draw });
  tl.tween(jobsP, 6, { at: 9.0, dur: 26, ease: ease.linear });
  tl.hold(13.5, 0.5);

  // — Beat 3 · the reverse index —
  tl.caption({
    at: 14.0,
    dur: 6.5,
    text: 'The reverse index service builds the heart of search: for every word, the list of pages that contain it.',
  });
  tl.tween(cam, CAM_MATRIX, { at: 14.2, dur: 1.5, ease: ease.move });
  tl.tween(fillP, 1, { at: 14.9, dur: 3.6, ease: ease.linear });
  tl.hold(20.1, 0.4);

  // — Beat 4 · inside out —
  tl.caption({
    at: 20.6,
    dur: 5.5,
    text: 'It is the ordinary index turned inside out. Pages list their words; this lists, for each word, its pages.',
  });
  tl.tween(invSweep, 1, { at: 21.2, dur: 2.4, ease: ease.move });
  tl.hold(25.7, 0.4);

  // — Beat 5 · the document service —
  tl.caption({
    at: 26.2,
    dur: 6,
    text: "The document service stores the static parts: each page's title and a snippet, generated once at crawl time, not once per query.",
  });
  tl.tween(cam, CAM_DOCS, { at: 26.4, dur: 1.5, ease: ease.move });
  tl.tween(docU, 1, { at: 27.0, dur: 1.6, ease: ease.enter });
  tl.hold(31.8, 0.4);

  // — Beat 6 · a user searches —
  tl.caption({
    at: 32.3,
    dur: 6,
    text: 'Now a user searches for hello world. The request rides through the web server to the query service.',
  });
  tl.tween(cam, CAM_SEARCH, { at: 32.5, dur: 1.5, ease: ease.move });
  tl.tween(searchU, 1, { at: 32.7, dur: 1.0, ease: ease.enter });
  tl.tween(reqP, 1, { at: 34.0, dur: 2.6, ease: ease.linear });
  tl.hold(37.9, 0.4);

  // — Beat 7 · parsing —
  tl.caption({
    at: 38.4,
    dur: 6,
    text: 'The query service tidies the query first: strip the markup, split the text into terms, fix the typos, normalize the case.',
  });
  tl.tween(parseU, 1, { at: 39.2, dur: 1.4, ease: ease.move });
  tl.hold(44.0, 0.4);

  // — Beat 8 · intersect and rank —
  tl.caption({
    at: 44.5,
    dur: 6.5,
    text: 'The reverse index service finds the pages matching both terms, ranks them, and returns the winners.',
  });
  tl.tween(cam, CAM_MATRIX, { at: 44.7, dur: 1.5, ease: ease.move });
  tl.tween(matchU, 1, { at: 45.4, dur: 2.6, ease: ease.move });
  tl.hold(50.6, 0.4);

  // — Beat 9 · results assemble —
  tl.caption({
    at: 51.1,
    dur: 6,
    text: "The document service attaches each winner's title and snippet, and the results page assembles itself.",
  });
  tl.tween(resultsU, 1, { at: 51.7, dur: 1.4, ease: ease.move });
  tl.hold(56.7, 0.4);

  // — Beat 10 · the memory cache —
  tl.caption({
    at: 57.2,
    dur: 7,
    text: 'Popular queries never travel that far again: a memory cache serves repeats straight from memory, which matters when forty thousand searches arrive every second.',
  });
  tl.tween(cam, CAM_SEARCH, { at: 57.4, dur: 1.4, ease: ease.move });
  tl.tween(cacheP, 1, { at: 58.4, dur: 3.0, ease: ease.linear });
  tl.tween(statsU, 1, { at: 61.6, dur: 0.7, ease: ease.pop });
  tl.hold(63.8, 0.4);

  // — Beat 11 · step back —
  tl.caption({ at: 64.3, dur: 4.5, text: 'Step back, and run the whole machine end to end one more time.' });
  tl.tween(cam, CAMERA_HOME, { at: 64.5, dur: 1.6, ease: ease.move });
  tl.tween(recapU, 1, { at: 65.4, dur: 1.2, ease: ease.move });
  tl.hold(68.4, 0.4);

  // — Beat 12 · the journey —
  tl.caption({
    at: 68.9,
    dur: 9.5,
    text: 'A ranked frontier chooses the next link. The fetch is polite to its host. The signature check refuses duplicates. The clock brings pages back before they rot. And every fetch feeds the index that answers the next search.',
  });
  tl.tween(journeyP, 5, { at: 69.3, dur: 8.6, ease: ease.linear });
  tl.hold(78.6, 0.4);

  // — Beat 13 · solved —
  tl.caption({
    at: 79.1,
    dur: 5.5,
    text: 'That is the web crawler, solved: one loop, kept honest, at planetary scale.',
  });
  tl.tween(endU, 1, { at: 79.6, dur: 1.0, ease: ease.enter });
  tl.hold(84.4, 1.4);

  return {
    tl,
    cam,
    crawlU,
    loopPhase,
    queuesU,
    jobsP,
    fillP,
    invSweep,
    docU,
    searchU,
    reqP,
    parseU,
    matchU,
    resultsU,
    cacheP,
    statsU,
    recapU,
    journeyP,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** mini glyphs for the recap strip — pure decorative shapes */
function JourneyGlyph({ i, x, y, lit }: { i: number; x: number; y: number; lit: number }) {
  const c = lit > 0.5 ? colors.ACCENT : colors.MUTED;
  const op = 0.35 + 0.65 * lit;
  if (i === 0)
    return (
      <g opacity={op}>
        {[0, 1, 2].map((r) => (
          <rect key={r} x={x - 20} y={y - 18 + r * 13} width={40 - r * 8} height={8} rx={4} fill={c} />
        ))}
      </g>
    );
  if (i === 1) return <TimerArc cx={x} cy={y} r={16} u={0.7} color={c} width={3.5} opacity={op} />;
  if (i === 2)
    return (
      <g opacity={op}>
        {[0, 1, 2, 3, 4, 5].map((b) => (
          <rect key={b} x={x - 18 + b * 6.5} y={y - 14} width={b % 2 ? 2.5 : 4} height={28} fill={c} />
        ))}
      </g>
    );
  if (i === 3)
    return (
      <g opacity={op}>
        <circle cx={x} cy={y} r={16} fill="none" stroke={c} strokeWidth={2.5} />
        <line x1={x} y1={y} x2={x} y2={y - 10} stroke={c} strokeWidth={2.5} />
        <line x1={x} y1={y} x2={x + 7} y2={y + 3} stroke={c} strokeWidth={2.5} />
      </g>
    );
  return (
    <g opacity={op}>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <circle key={k} cx={x - 13 + (k % 3) * 13} cy={y - 7 + Math.floor(k / 3) * 14} r={4} fill={c} />
      ))}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const crawlU = s.get(scene.crawlU);
  const loopPhase = s.get(scene.loopPhase);
  const queuesU = s.get(scene.queuesU);
  const jobsP = s.get(scene.jobsP);
  const fillP = s.get(scene.fillP);
  const invSweep = s.get(scene.invSweep);
  const docU = s.get(scene.docU);
  const searchU = s.get(scene.searchU);
  const reqP = s.get(scene.reqP);
  const parseU = s.get(scene.parseU);
  const matchU = s.get(scene.matchU);
  const resultsU = s.get(scene.resultsU);
  const cacheP = s.get(scene.cacheP);
  const statsU = s.get(scene.statsU);
  const recapU = s.get(scene.recapU);
  const journeyP = s.get(scene.journeyP);
  const endU = s.get(scene.endU);

  const dimAll = 1 - recapU * 0.88;
  const jobU = fract(jobsP); // one page job forever in flight on each queue
  // the matrix steps back while the query is being parsed, and again under results
  const matDim = (1 - resultsU * 0.75) * (1 - clamp01(parseU - matchU) * 0.7);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- crawler + its loop ring ---- */}
          <g opacity={crawlU}>
            <ServiceNode x={CRAWLER.x} y={CRAWLER.y} kind="server" label="Crawler Service" sublabel="the loop" u={crawlU} />
            <circle
              cx={CRAWLER.x}
              cy={CRAWLER.y - 58}
              r={17}
              fill="none"
              stroke={colors.ACCENT}
              strokeWidth={3}
              strokeDasharray="70 37"
              strokeDashoffset={-loopPhase * 30}
              opacity={0.85}
            />
          </g>

          {/* ---- the two queues ---- */}
          <g opacity={queuesU}>
            <Connection from={{ x: CRAWLER.x + 90, y: CRAWLER.y - 14 }} to={{ x: RIS.x - 84, y: RIS.y - 14 }} u={queuesU} color={colors.SECONDARY} label="reverse_index_queue" labelSize={10.5} />
            <Connection from={{ x: CRAWLER.x + 90, y: CRAWLER.y + 18 }} to={{ x: DOCS.x - 88, y: DOCS.y + 18 }} u={queuesU} color={colors.TEAL} label="doc_index_queue" labelSize={10.5} />
            {jobsP > 0 && jobsP < 5.98 && (
              <>
                <Packet from={{ x: CRAWLER.x + 90, y: CRAWLER.y - 14 }} to={{ x: RIS.x - 84, y: RIS.y - 14 }} u={jobU} r={5} color={colors.SECONDARY} />
                <Packet from={{ x: CRAWLER.x + 90, y: CRAWLER.y + 18 }} to={{ x: DOCS.x - 88, y: DOCS.y + 18 }} u={fract(jobsP + 0.4)} r={5} color={colors.TEAL} />
              </>
            )}
            <ServiceNode x={RIS.x} y={RIS.y} kind="search" label="Reverse Index" sublabel="Service" u={queuesU} />
            <ServiceNode x={DOCS.x} y={DOCS.y} kind="storage" label="Document" sublabel="Service" u={queuesU} />
          </g>

          {/* ---- the inverted index matrix ---- */}
          <g opacity={matDim}>
            {TERMS.map((t, ti) => {
              // "hello"/"world" rows glow during the match beat
              const rowGlow = matchU > 0.02 && ti <= 1 ? clamp01(matchU * 2 - ti * 0.4) : 0;
              const sweep = invSweep > 0.02 && ti === 1 ? invSweep : 0;
              return (
                <g key={t}>
                  <text
                    x={MAT.x0 - 14}
                    y={MAT.y0 + ti * MAT.cell + 26}
                    textAnchor="end"
                    fill={rowGlow > 0.1 || sweep > 0.1 ? colors.WARM : colors.MUTED}
                    fontSize={13}
                    fontFamily="ui-monospace, monospace"
                    opacity={clamp01(fillP * 3 - ti * 0.3)}
                  >
                    {t}
                  </text>
                  {PAGES.map((p, pi) => {
                    const idx = ti * PAGES.length + pi;
                    const u = clamp01(fillP * (TERMS.length * PAGES.length) * 0.6 - idx * 0.55);
                    const on = MEMBER[ti][pi] === 1;
                    const hit = rowGlow > 0.1 && on;
                    const winner = matchU > 0.6 && pi <= 2 && ti <= 1 && on;
                    return (
                      <rect
                        key={p}
                        x={MAT.x0 + pi * MAT.cell}
                        y={MAT.y0 + ti * MAT.cell + 6}
                        width={MAT.cell - 8}
                        height={MAT.cell - 8}
                        rx={5}
                        fill={on ? (winner ? colors.WARM : hit || (sweep > 0.1 && on) ? colors.WARM : colors.ACCENT) : colors.PANEL}
                        opacity={u * (on ? (hit || winner ? 0.95 : 0.55) : 0.25)}
                      />
                    );
                  })}
                </g>
              );
            })}
            {PAGES.map((p, pi) => (
              <text
                key={p}
                x={MAT.x0 + pi * MAT.cell + (MAT.cell - 8) / 2}
                y={MAT.y0 - 8}
                textAnchor="middle"
                fill={matchU > 0.6 && pi <= 2 ? colors.WARM : colors.MUTED}
                fontSize={12}
                fontFamily="ui-monospace, monospace"
                opacity={clamp01(fillP * 3 - pi * 0.2)}
              >
                {p}
              </text>
            ))}
            <text x={MAT.x0 + (PAGES.length * MAT.cell) / 2} y={MAT.y0 - 52} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic" opacity={fillP}>
              the reverse index — every word knows its pages
            </text>
            {matchU > 0.6 && (
              <g opacity={clamp01((matchU - 0.6) * 3) * matDim}>
                {[0, 1, 2].map((pi) => (
                  <text key={pi} x={MAT.x0 + pi * MAT.cell + (MAT.cell - 8) / 2} y={MAT.y0 - 28} textAnchor="middle" fill={colors.WARM} fontSize={13}>
                    #{pi + 1}
                  </text>
                ))}
              </g>
            )}
          </g>

          {/* ---- the document cards ---- */}
          <g opacity={docU}>
            {RESULTS.map((r2, i) => (
              <g key={r2.page} opacity={clamp01(docU * 2.2 - i * 0.5)}>
                <rect x={905} y={252 + i * 74} width={266} height={60} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={921} y={276 + i * 74} fill={colors.TEXT} fontSize={13}>
                  {r2.title}
                </text>
                <text x={921} y={296 + i * 74} fill={colors.MUTED} fontSize={11.5} fontStyle="italic">
                  {r2.snip}
                </text>
              </g>
            ))}
            <text x={1038} y={240} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              titles + snippets · static, made at crawl time
            </text>
          </g>

          {/* ---- the search path ---- */}
          <g opacity={searchU}>
            <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="Client" u={searchU} />
            <ServiceNode x={WEB.x} y={WEB.y} kind="gateway" label="Web Server" sublabel="reverse proxy" u={searchU} />
            <ServiceNode x={QAPI.x} y={QAPI.y} kind="server" label="Query API" u={searchU} />
            <ServiceNode x={CACHE.x} y={CACHE.y} kind="cache" label="Memory Cache" sublabel="popular queries" u={searchU} />
            <Connection from={{ x: CLIENT.x + 60, y: CLIENT.y }} to={{ x: WEB.x - 70, y: WEB.y }} u={searchU} color={colors.MUTED} dim={0.5} />
            <Connection from={{ x: WEB.x + 70, y: WEB.y }} to={{ x: QAPI.x - 62, y: QAPI.y }} u={searchU} color={colors.MUTED} dim={0.5} />
            <Connection from={{ x: QAPI.x + 62, y: QAPI.y }} to={{ x: CACHE.x - 74, y: CACHE.y }} u={searchU} color={colors.MUTED} dim={0.5} />
            <RequestFlow
              path={[
                { x: CLIENT.x + 60, y: CLIENT.y },
                { x: WEB.x, y: WEB.y },
                { x: QAPI.x, y: QAPI.y },
              ]}
              u={reqP}
              color={colors.WARM}
              label="hello world"
            />
            {/* the parsed terms */}
            <g opacity={parseU}>
              <rect x={QAPI.x - 156} y={QAPI.y - 138} width={312} height={84} rx={10} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.2} opacity={0.96} />
              {['hello', 'world'].map((t, i) => (
                <g key={t}>
                  <rect x={QAPI.x - 66 + i * 70} y={QAPI.y - 96} width={62} height={28} rx={7} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.3} />
                  <text x={QAPI.x - 35 + i * 70} y={QAPI.y - 77} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily="ui-monospace, monospace">
                    {t}
                  </text>
                </g>
              ))}
              <text x={QAPI.x} y={QAPI.y - 112} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                strip markup · split terms · fix typos · normalize case
              </text>
              {matchU > 0.02 && (
                <line x1={QAPI.x} y1={QAPI.y - 106} x2={MAT.x0 + 100} y2={MAT.y0 + TERMS.length * MAT.cell + 8} stroke={colors.WARM} strokeWidth={1.2} opacity={0.4 * matchU * matDim} />
              )}
            </g>
            {/* the cached round trip */}
            {cacheP > 0 && (
              <RequestFlow
                path={[
                  { x: CLIENT.x + 60, y: CLIENT.y },
                  { x: WEB.x, y: WEB.y },
                  { x: QAPI.x, y: QAPI.y },
                  { x: CACHE.x - 40, y: CACHE.y },
                ]}
                u={cacheP}
                roundTrip
                color={colors.WARM}
                responseColor={colors.POSITIVE}
                responseLabel="cached"
              />
            )}
            <g opacity={statsU}>
              <rect x={1000} y={520} width={196} height={30} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={1098} y={540} textAnchor="middle" fill={colors.ACCENT} fontSize={13}>
                40,000 searches / s
              </text>
            </g>
          </g>

          {/* ---- assembled results ---- */}
          <g opacity={resultsU}>
            <rect x={440} y={250} width={300} height={244} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
            <text x={590} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
              results · hello world
            </text>
            {RESULTS.map((r2, i) => (
              <g key={r2.page} opacity={clamp01(resultsU * 2.4 - i * 0.55)}>
                <text x={464} y={316 + i * 56} fill={colors.WARM} fontSize={12.5}>
                  #{i + 1}
                </text>
                <text x={492} y={316 + i * 56} fill={colors.TEXT} fontSize={13}>
                  {r2.title}
                </text>
                <text x={492} y={334 + i * 56} fill={colors.MUTED} fontSize={11.5} fontStyle="italic">
                  {r2.snip}
                </text>
              </g>
            ))}
          </g>
        </g>

        {/* ---- the recap journey ---- */}
        <g opacity={recapU}>
          <rect x={170} y={210} width={940} height={280} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={258} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the whole machine, once through
          </text>
          {JOURNEY.map((j, i) => {
            const x = 285 + i * 178;
            const lit = clamp01(journeyP - i);
            return (
              <g key={j.label}>
                <JourneyGlyph i={i} x={x} y={330} lit={lit} />
                <text x={x} y={382} textAnchor="middle" fill={lit > 0.5 ? colors.TEXT : colors.MUTED} fontSize={13.5}>
                  {j.label}
                </text>
                <text x={x} y={402} textAnchor="middle" fill={colors.MUTED} fontSize={11} opacity={0.4 + 0.6 * lit}>
                  {j.sub}
                </text>
                {i < 4 && (
                  <line x1={x + 44} y1={330} x2={x + 134} y2={330} stroke={lit > 0.9 ? colors.ACCENT : colors.GRID} strokeWidth={1.6} opacity={0.4 + 0.6 * clamp01(journeyP - i - 0.5)} />
                )}
              </g>
            );
          })}
          <text x={640} y={452} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={endU}>
            the web crawler, solved — one loop, kept honest, at planetary scale
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
