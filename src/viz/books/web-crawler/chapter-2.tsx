// Duplicates: the signature says you've been here
//
// Backing files (donnemartin/system-design-primer):
//   solutions/system_design/web_crawler/README.md — "Handling duplicates"
//   (cycles, page signatures, crawled_similar, reduce_priority_link_to_crawl,
//   MapReduce URL dedup, Jaccard / cosine similarity)
//   solutions/system_design/web_crawler/web_crawler_snippets.py — Crawler.crawl
//   checks crawled_similar(page.signature) before crawl_page
//   solutions/system_design/web_crawler/web_crawler_mapreduce.py —
//   RemoveDuplicateUrls(MRJob): mapper yields (line, 1), reducer keeps total == 1.
//
// The machine: three pages linked in a ring trap the naive crawler in orbit;
// a fingerprint press squashes page content into a signature; the signature
// slides along crawled_links, matches, and the link is demoted — the orbit
// breaks. Then the batch view: map-reduce lanes collapse duplicate URLs, and
// two nearly identical dot-sets overlap into a similarity score.
import { CAMERA_HOME, MathLabel, Timeline, colors, ease, mulberry32 } from '../../core';
import { Camera, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, NodeBadge, pointAlong } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

interface Pt {
  x: number;
  y: number;
}

/* ---------------------------------------------------------------- */
/* The cycle ring (left) and the frontier mini-column (right).       */
/* ---------------------------------------------------------------- */

const RING: Array<{ url: string; x: number; y: number }> = [
  { url: 'foo.com', x: 330, y: 185 },
  { url: 'bar.com', x: 468, y: 425 },
  { url: 'baz.com', x: 192, y: 425 },
];
const ORBIT_PATH: Pt[] = [...RING, RING[0]];

/** Edge endpoints pulled back to the card boundary so arrowheads read. */
function trim(f: Pt, t: Pt): { from: Pt; to: Pt } {
  const dx = t.x - f.x;
  const dy = t.y - f.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    from: { x: f.x + (dx / len) * 66, y: f.y + (dy / len) * 30 },
    to: { x: t.x - (dx / len) * 66, y: t.y - (dy / len) * 30 },
  };
}
const RING_EDGES = RING.map((n, i) => trim(n, RING[(i + 1) % 3]));

const ORBIT_END = 7; // laps of orbitP; 3 fetches per lap
const COUNTER = { x: 330, y: 84 };

/** Mini frontier: foo.com is demoted to the bottom when its signature matches. */
const MINI = { x: 985, y0: 196, step: 46 };
const MINI_BARS = [
  { url: 'foo.com', pr: 0.72, r0: 0, r1: 2, demoted: true },
  { url: 'bar.com', pr: 0.55, r0: 1, r1: 0, demoted: false },
  { url: 'baz.com', pr: 0.41, r0: 2, r1: 1, demoted: false },
];

/* ---------------------------------------------------------------- */
/* The fingerprint press + the crawled_links strip (center).         */
/* ---------------------------------------------------------------- */

const CARD = { x: 660, y: 150, w: 240, h: 170 };
const CARD_LINES = [0.92, 0.7, 0.85, 0.55, 0.78, 0.62];
const SIG_CHIP = { x: CARD.x + CARD.w / 2, y: 366 };

const STRIP = { x: 640, y0: 452, step: 36, w: 260 };
const STORED = [
  { url: 'yahoo.com', sig: '9f31c2' },
  { url: 'dmoz.org', sig: '2c91af' },
  { url: 'foo.com', sig: '77d3a1' }, // the match — foo was crawled in chapter 1
];

/* ---------------------------------------------------------------- */
/* Off-stage right panel: map-reduce lanes, then the similarity sets. */
/* ---------------------------------------------------------------- */

const MR = { x0: 1560, yIn: 170, stepIn: 42, xLane: 1950, xOut: 2280 };
const MR_INPUT = ['foo.com', 'bar.com', 'foo.com', 'baz.com', 'bar.com', 'yahoo.com', 'foo.com', 'dmoz.org'];
/** Group rows by url → lane index + slot within the lane. */
const MR_KEYS = ['foo.com', 'bar.com', 'baz.com', 'yahoo.com', 'dmoz.org'];
const MR_COUNT: Record<string, number> = { 'foo.com': 3, 'bar.com': 2, 'baz.com': 1, 'yahoo.com': 1, 'dmoz.org': 1 };
const MR_SLOT: Array<{ lane: number; slot: number }> = (() => {
  const used: Record<string, number> = {};
  return MR_INPUT.map((url) => {
    const lane = MR_KEYS.indexOf(url);
    const slot = used[url] ?? 0;
    used[url] = slot + 1;
    return { lane, slot };
  });
})();
const laneY = (lane: number) => 190 + lane * 74;

/** Similarity sets: 26 shingles per page, 24 shared. Jaccard = 24/28 ≈ 0.86. */
const N_SET = 26;
const N_SHARED = 24;
const srand = mulberry32(31);
const SETS = (() => {
  const home = (cx: number) =>
    Array.from({ length: N_SET }, (_, i) => {
      const a = (i / N_SET) * Math.PI * 2;
      const r = 46 + srand() * 52;
      return { x: cx + Math.cos(a) * r, y: 380 + Math.sin(a) * r * 0.82 };
    });
  const A_HOME = home(1720);
  const B_HOME = home(2160);
  // overlapped layout: shared shingles interleave in the lens, uniques flank it
  const lens = Array.from({ length: N_SHARED }, (_, i) => {
    const a = (i / N_SHARED) * Math.PI * 2;
    const r = 34 + srand() * 58;
    return { x: 1940 + Math.cos(a) * r, y: 384 + Math.sin(a) * r * 0.8 };
  });
  const A_OVER = A_HOME.map((p, i) => (i < N_SHARED ? lens[i] : { x: 1806 + (i - N_SHARED) * 26, y: 330 + (i - N_SHARED) * 88 }));
  const B_OVER = B_HOME.map((p, i) => (i < N_SHARED ? lens[i] : { x: 2076 - (i - N_SHARED) * 26, y: 330 + (i - N_SHARED) * 88 }));
  return { A_HOME, B_HOME, A_OVER, B_OVER };
})();

const CAM_RING: CameraState = { x: 360, y: 330, k: 1.35 };
const CAM_PRESS: CameraState = { x: 660, y: 340, k: 1.18 };
const CAM_PANEL: CameraState = { x: 1940, y: 375, k: 0.98 };

/* ---------------------------------------------------------------- */
/* Timeline                                                          */
/* ---------------------------------------------------------------- */

export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_RING, cameraInterp);
  const ringU = tl.channel('ringU', 0); // ring cards + edges
  const orbitP = tl.channel('orbitP', 0); // laps around the cycle
  const counterU = tl.channel('counterU', 0);
  const cardU = tl.channel('cardU', 0); // the page-content card
  const squashU = tl.channel('squashU', 0); // content → signature chip
  const stripU = tl.channel('stripU', 0); // crawled_links strip
  const slideU = tl.channel('slideU', 0); // chip slides to the strip
  const matchHi = tl.channel('matchHi', 0); // the stored match lights up
  const miniU = tl.channel('miniU', 0); // mini frontier reveal
  const demoteU = tl.channel('demoteU', 0); // foo sinks to the bottom
  const mrU = tl.channel('mrU', 0); // input rows appear (0..8)
  const mrMapU = tl.channel('mrMapU', 0); // rows regroup into key lanes
  const mrRedU = tl.channel('mrRedU', 0); // verdicts: keep only total == 1
  const mrFade = tl.channel('mrFade', 0); // map-reduce quiets down
  const setsU = tl.channel('setsU', 0); // the two shingle sets
  const overlapU = tl.channel('overlapU', 0); // sets slide into the lens
  const simU = tl.channel('simU', 0); // similarity meter fills to 0.86
  const verdictU = tl.channel('verdictU', 0);

  // ---- beat 1: the trap ---------------------------------------------------
  tl.caption({
    at: 0.3,
    dur: 5.6,
    text: "Chapter one's loop has a fatal flaw: the web isn't a list, it's a graph — and graphs have cycles.",
  });
  tl.tween(ringU, 1, { at: 0.6, dur: 1.6, ease: ease.draw });
  tl.caption({
    at: 6.5,
    dur: 5.8,
    text: 'Three pages, each linking to the next, around and around. The naive crawler happily follows — and never comes out.',
  });
  tl.tween(counterU, 1, { at: 7.0, dur: 0.6, ease: ease.enter });
  tl.tween(orbitP, ORBIT_END, { at: 7.2, dur: 29.0, ease: ease.linear });
  tl.caption({
    at: 12.9,
    dur: 5.8,
    text: "Fetch counts climb, the frontier never drains, and you're paying to download the same three pages forever.",
  });
  tl.hold(18.9, 0.5);

  // ---- beat 2: the fingerprint press --------------------------------------
  tl.tween(cam, CAM_PRESS, { at: 19.4, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 19.8,
    dur: 6.6,
    text: "The way out is that signature from chapter one. Squash each page's address and contents down into one short fingerprint.",
  });
  tl.tween(cardU, 1, { at: 20.6, dur: 0.7, ease: ease.enter });
  tl.tween(squashU, 1, { at: 23.2, dur: 1.6, ease: ease.move });
  tl.hold(26.9, 0.4);

  // ---- beat 3: check before you crawl --------------------------------------
  tl.caption({
    at: 27.3,
    dur: 5.6,
    text: 'Now the loop checks before it crawls: have we already stored something with a similar signature?',
  });
  tl.tween(stripU, 1, { at: 27.6, dur: 0.9, ease: ease.draw });
  tl.tween(slideU, 1, { at: 29.0, dur: 1.6, ease: ease.move });
  tl.tween(matchHi, 1, { at: 30.8, dur: 0.5, ease: ease.pop });
  tl.hold(33.3, 0.4);

  // ---- beat 4: demote, don't delete ----------------------------------------
  tl.caption({
    at: 33.7,
    dur: 6.4,
    text: "A match doesn't delete the link — it demotes it. The offending page sinks to the bottom of the pile, and the loop moves on.",
  });
  tl.tween(miniU, 1, { at: 34.0, dur: 0.8, ease: ease.enter });
  tl.tween(demoteU, 1, { at: 35.6, dur: 1.7, ease: ease.move });
  tl.caption({ at: 40.7, dur: 4.0, text: 'That breaks the orbit. Three fetches, not three thousand.' });
  tl.hold(44.7, 0.6);

  // ---- beat 5: the batch version — map reduce -------------------------------
  tl.tween(cam, CAM_PANEL, { at: 45.3, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 45.7,
    dur: 8.0,
    text: 'There is a batch version of the same idea. With a billion URLs in the list, duplicates hide in plain sight — so a map reduce job groups identical URLs and keeps only the ones that appear exactly once.',
  });
  tl.tween(mrU, 8, { at: 46.4, dur: 1.6, ease: ease.enter });
  tl.tween(mrMapU, 1, { at: 48.8, dur: 1.8, ease: ease.move });
  tl.tween(mrRedU, 1, { at: 51.4, dur: 1.6, ease: ease.enter });
  tl.hold(54.1, 0.4);

  // ---- beat 6: near-duplicates — Jaccard overlap ----------------------------
  tl.tween(mrFade, 1, { at: 54.5, dur: 0.8, ease: ease.move });
  tl.caption({
    at: 54.7,
    dur: 6.6,
    text: 'Content is slipperier than URLs, though. The same article can live at two different addresses — so we compare the fingerprints themselves with a similarity score.',
  });
  tl.tween(setsU, 1, { at: 55.4, dur: 1.2, ease: ease.enter });
  tl.tween(overlapU, 1, { at: 57.6, dur: 1.8, ease: ease.move });
  tl.caption({
    at: 61.9,
    dur: 6.0,
    text: 'Two pages whose signatures overlap past a threshold count as one page: crawl the first, demote the second.',
  });
  tl.tween(simU, 1, { at: 62.4, dur: 1.6, ease: ease.draw });
  tl.tween(verdictU, 1, { at: 65.4, dur: 0.5, ease: ease.pop });
  tl.hold(68.3, 0.5);

  // ---- beat 7: close ---------------------------------------------------------
  tl.tween(cam, CAM_RING, { at: 68.8, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 69.4,
    dur: 5.4,
    text: 'The crawler now remembers where it has been. Next question: when should it go back?',
  });
  tl.hold(74.8, 1.0);

  return {
    tl,
    cam,
    ringU,
    orbitP,
    counterU,
    cardU,
    squashU,
    stripU,
    slideU,
    matchHi,
    miniU,
    demoteU,
    mrU,
    mrMapU,
    mrRedU,
    mrFade,
    setsU,
    overlapU,
    simU,
    verdictU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- */
/* Render                                                            */
/* ---------------------------------------------------------------- */

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

function renderFrame(s: SceneState) {
  const ringU = s.get(scene.ringU);
  const orbitP = s.get(scene.orbitP);
  const counterU = s.get(scene.counterU);
  const cardU = s.get(scene.cardU);
  const squashU = s.get(scene.squashU);
  const stripU = s.get(scene.stripU);
  const slideU = s.get(scene.slideU);
  const matchHi = s.get(scene.matchHi);
  const miniU = s.get(scene.miniU);
  const demoteU = s.get(scene.demoteU);
  const mrU = s.get(scene.mrU);
  const mrMapU = s.get(scene.mrMapU);
  const mrRedU = s.get(scene.mrRedU);
  const mrFade = s.get(scene.mrFade);
  const setsU = s.get(scene.setsU);
  const overlapU = s.get(scene.overlapU);
  const simU = s.get(scene.simU);
  const verdictU = s.get(scene.verdictU);

  // the orbit stops once the demotion lands
  const orbitAlive = 1 - demoteU;
  const lap = orbitP % 1;
  const orbitPos = pointAlong(ORBIT_PATH, lap);
  const fetches = Math.min(Math.floor(orbitP * 3), Math.floor(lerp(ORBIT_END, 1.0, demoteU) * 3));

  // fingerprint press: content lines compress toward the chip
  const pressLines = CARD_LINES.map((w, i) => {
    const y0 = CARD.y + 26 + i * 24;
    const y1 = SIG_CHIP.y - 8;
    return { w: lerp(w, 0.12, squashU), y: lerp(y0, y1, squashU), o: lerp(1, i === 0 ? 1 : 0.12, squashU) };
  });

  // the traveling signature chip
  const chipX = SIG_CHIP.x;
  const chipY = lerp(SIG_CHIP.y, STRIP.y0 + 2 * STRIP.step, slideU);
  const chipXs = lerp(chipX, STRIP.x + STRIP.w + 56, slideU);

  const miniY = (b: (typeof MINI_BARS)[number]) => MINI.y0 + lerp(b.r0, b.r1, demoteU) * MINI.step;

  const simVal = 0.86 * simU;

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ---------- the ring trap ---------- */}
      {RING_EDGES.map((e, i) => (
        <Connection key={i} from={e.from} to={e.to} u={clamp01(ringU * 3 - i)} flow={orbitP * 2 * orbitAlive} color={colors.MUTED} width={1.8} arrow />
      ))}
      {RING.map((n, i) => (
        <NodeBadge
          key={n.url}
          x={n.x}
          y={n.y}
          w={128}
          h={52}
          label={n.url}
          color={colors.ACCENT}
          u={clamp01(ringU * 3 - i * 0.7)}
          glow={orbitAlive * clamp01(1 - Math.min(Math.abs(lap - i / 3), Math.abs(lap - i / 3 - 1)) * 7) * clamp01(orbitP)}
        />
      ))}
      {orbitAlive > 0.02 && orbitP > 0.01 && orbitP < ORBIT_END - 0.01 && (
        <circle cx={orbitPos.x} cy={orbitPos.y} r={8} fill={colors.WARM} opacity={orbitAlive} />
      )}
      {counterU > 0.002 && (
        <g opacity={counterU}>
          <rect x={COUNTER.x - 92} y={COUNTER.y - 20} width={184} height={40} rx={9} fill={colors.PANEL} stroke={demoteU > 0.5 ? colors.POSITIVE : colors.NEGATIVE} strokeOpacity={0.7} />
          <text x={COUNTER.x} y={COUNTER.y + 5} textAnchor="middle" fill={demoteU > 0.5 ? colors.POSITIVE : colors.NEGATIVE} fontSize={15} fontFamily="ui-monospace, monospace">
            {demoteU > 0.5 ? 'fetches: 3 — stopped' : `fetches: ${fetches}`}
          </text>
        </g>
      )}

      {/* ---------- the fingerprint press ---------- */}
      {cardU > 0.002 && (
        <g opacity={cardU * (1 - matchHi * 0.82) * (1 - mrFade * 0.9)}>
          <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={CARD.x + 12} y={CARD.y - 10} fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, monospace">
            foo.com — url + contents
          </text>
          {pressLines.map((l, i) => (
            <rect key={i} x={CARD.x + 16} y={l.y} width={(CARD.w - 32) * l.w} height={9} rx={4} fill={colors.ACCENT} opacity={0.5 * l.o * cardU} />
          ))}
          <CodeChip x={SIG_CHIP.x} y={CARD.y + CARD.h + 26} text="create_signature()" u={clamp01(squashU * 2)} color={colors.SECONDARY} />
          {squashU > 0.6 && slideU < 0.98 && (
            <g opacity={clamp01((squashU - 0.6) * 3)}>
              <rect x={chipXs - 52} y={chipY - 12} width={104} height={24} rx={6} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={chipXs} y={chipY + 4} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="ui-monospace, monospace">
                sig 77d3a1
              </text>
            </g>
          )}
        </g>
      )}

      {/* ---------- the crawled_links strip ---------- */}
      {stripU > 0.002 && (
        <g opacity={stripU * (1 - mrFade * 0.9)}>
          <text x={STRIP.x} y={STRIP.y0 - 26} fill={colors.TEXT} fontSize={15} fontFamily="ui-monospace, monospace">
            crawled_links
          </text>
          {STORED.map((r, i) => {
            const hit = r.url === 'foo.com' ? matchHi : 0;
            return (
              <g key={r.url}>
                <rect x={STRIP.x} y={STRIP.y0 + i * STRIP.step - 14} width={STRIP.w} height={28} rx={7} fill={hit > 0.02 ? colors.NEGATIVE : colors.SECONDARY} opacity={0.13 + hit * 0.25} />
                <text x={STRIP.x + 10} y={STRIP.y0 + i * STRIP.step + 4} fill={colors.TEXT} fontSize={12.5} fontFamily="ui-monospace, monospace">
                  {r.url}
                </text>
                <text x={STRIP.x + STRIP.w - 10} y={STRIP.y0 + i * STRIP.step + 4} textAnchor="end" fill={hit > 0.02 ? colors.NEGATIVE : colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
                  {r.sig}
                </text>
              </g>
            );
          })}
          <CodeChip x={STRIP.x + STRIP.w / 2} y={STRIP.y0 + 3 * STRIP.step + 14} text="crawled_similar(signature)" u={clamp01(slideU * 2)} color={colors.NEGATIVE} />
        </g>
      )}

      {/* ---------- the mini frontier + the demotion ---------- */}
      {miniU > 0.002 && (
        <g opacity={miniU}>
          <text x={MINI.x} y={MINI.y0 - 46} fill={colors.TEXT} fontSize={15} fontFamily="ui-monospace, monospace">
            links_to_crawl
          </text>
          {MINI_BARS.map((b) => {
            const pr = b.demoted ? lerp(b.pr, 0.05, demoteU) : b.pr;
            const w = 96 + 168 * pr;
            return (
              <g key={b.url}>
                <rect x={MINI.x} y={miniY(b) - 16} width={w} height={32} rx={8} fill={b.demoted && demoteU > 0.5 ? colors.NEGATIVE : colors.ACCENT} opacity={0.16 + pr * 0.24} />
                <rect x={MINI.x} y={miniY(b) - 16} width={w} height={32} rx={8} fill="none" stroke={b.demoted && demoteU > 0.5 ? colors.NEGATIVE : colors.ACCENT} strokeOpacity={0.5} />
                <text x={MINI.x + 10} y={miniY(b) + 4.5} fill={colors.TEXT} fontSize={13} fontFamily="ui-monospace, monospace">
                  {b.url}
                </text>
                <text x={MINI.x + w - 8} y={miniY(b) + 4.5} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                  {pr.toFixed(2)}
                </text>
              </g>
            );
          })}
          <CodeChip x={1050} y={MINI.y0 + 3 * MINI.step + 6} text="reduce_priority_link_to_crawl(url)" u={clamp01(demoteU * 2)} color={colors.NEGATIVE} />
        </g>
      )}

      {/* ---------- off-stage right: map-reduce lanes ---------- */}
      <g opacity={1 - mrFade * 0.92}>
        {mrU > 0.02 && (
          <g>
            <text x={MR.x0} y={120} fill={colors.TEXT} fontSize={16} fontFamily="ui-monospace, monospace">
              RemoveDuplicateUrls(MRJob)
            </text>
            <text x={MR.x0} y={142} fill={colors.MUTED} fontSize={12.5}>
              mapper: yield (line, 1) · reducer: keep total == 1
            </text>
          </g>
        )}
        {MR_INPUT.map((url, i) => {
          const u = clamp01(mrU - i);
          const { lane, slot } = MR_SLOT[i];
          const x = lerp(MR.x0, MR.xLane + slot * 118, mrMapU);
          const y = lerp(MR.yIn + i * MR.stepIn, laneY(lane), mrMapU);
          const dup = MR_COUNT[url] > 1;
          const dead = dup ? mrRedU : 0;
          return (
            <g key={i} opacity={u * (1 - dead * 0.72)}>
              <rect x={x} y={y - 14} width={108} height={28} rx={7} fill={dup && mrRedU > 0.5 ? colors.NEGATIVE : colors.ACCENT} opacity={0.16} />
              <rect x={x} y={y - 14} width={108} height={28} rx={7} fill="none" stroke={dup && mrRedU > 0.5 ? colors.NEGATIVE : colors.ACCENT} strokeOpacity={0.5} />
              <text x={x + 54} y={y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily="ui-monospace, monospace">
                {url}
              </text>
              {mrMapU > 0.9 && slot === 0 && (
                <text x={MR.xLane - 16} y={y + 4} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace" opacity={clamp01((mrMapU - 0.9) * 10)}>
                  ({url}, {MR_COUNT[url]})
                </text>
              )}
            </g>
          );
        })}
        {mrRedU > 0.02 &&
          MR_KEYS.map((url, k) => {
            const keep = MR_COUNT[url] === 1;
            return (
              <text
                key={url}
                x={MR.xOut + 120}
                y={laneY(k) + 4}
                textAnchor="middle"
                fill={keep ? colors.POSITIVE : colors.NEGATIVE}
                fontSize={13}
                fontFamily="ui-monospace, monospace"
                opacity={mrRedU}
              >
                {keep ? `✓ keep ${url}` : `✗ total = ${MR_COUNT[url]}`}
              </text>
            );
          })}
      </g>

      {/* ---------- off-stage right: the similarity lens ---------- */}
      {setsU > 0.002 && (
        <g opacity={setsU}>
          <text x={1720} y={250} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={1 - overlapU * 0.4}>
            page A fingerprint
          </text>
          <text x={2160} y={250} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={1 - overlapU * 0.4}>
            page B fingerprint
          </text>
          {SETS.A_HOME.map((p, i) => {
            const q = SETS.A_OVER[i];
            const shared = i < N_SHARED;
            return (
              <circle key={`a${i}`} cx={lerp(p.x, q.x, overlapU)} cy={lerp(p.y, q.y, overlapU)} r={4.5} fill={shared && overlapU > 0.6 ? colors.WARM : colors.ACCENT} opacity={0.85} />
            );
          })}
          {SETS.B_HOME.map((p, i) => {
            const q = SETS.B_OVER[i];
            const shared = i < N_SHARED;
            return (
              <circle
                key={`b${i}`}
                cx={lerp(p.x, q.x, overlapU)}
                cy={lerp(p.y, q.y, overlapU)}
                r={4.5}
                fill={shared && overlapU > 0.6 ? colors.WARM : colors.SECONDARY}
                opacity={shared ? 0.85 * (1 - overlapU * 0.55) : 0.85}
              />
            );
          })}
          <MathLabel tex="J(A,B)=\frac{|A\cap B|}{|A\cup B|}" x={1940} y={168} fontSize={22} opacity={overlapU} />
          {/* the similarity meter */}
          <g opacity={clamp01(simU * 3)}>
            <rect x={1700} y={536} width={480} height={12} rx={6} fill={colors.GRID} opacity={0.5} />
            <rect x={1700} y={536} width={480 * simVal} height={12} rx={6} fill={simVal > 0.8 ? colors.NEGATIVE : colors.WARM} />
            <line x1={1700 + 480 * 0.8} y1={528} x2={1700 + 480 * 0.8} y2={556} stroke={colors.TEXT} strokeWidth={1.5} />
            <text x={1700 + 480 * 0.8} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
              threshold 0.80
            </text>
            <text x={1700} y={578} fill={colors.TEXT} fontSize={13.5}>
              Jaccard similarity {simVal.toFixed(2)}
            </text>
            <text x={2180} y={578} textAnchor="end" fill={colors.MUTED} fontSize={12.5}>
              (or cosine similarity)
            </text>
          </g>
          {verdictU > 0.002 && (
            <g opacity={verdictU}>
              <rect x={1830} y={588} width={220} height={30} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} />
              <text x={1940} y={608} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5}>
                duplicate — demote it
              </text>
            </g>
          )}
        </g>
      )}
    </Camera>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
