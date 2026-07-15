// Duplicates: the signature says stop
//
// Backed by: solutions/system_design/web_crawler/README.md ("Handling
// duplicates" — infinite loop when the graph contains a cycle; MapReduce to
// keep addresses with frequency one; Jaccard / cosine similarity for content)
// and web_crawler_snippets.py (Page.signature, create_signature from url +
// contents, crawled_similar, reduce_priority_link_to_crawl) plus
// web_crawler_mapreduce.py (RemoveDuplicateUrls MRJob). The machine: a 3-page
// cycle traps the crawler dot in orbit; a page is pressed into a barcode
// signature, held against the crawled_links ledger, and on a match the link
// SINKS down the frontier — the orbit starves. Then the bulk half: url chips
// flow through map → shuffle → reduce, and only once-seen addresses survive.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The cycle — three pages, three links, no exit.
// ---------------------------------------------------------------------------

const CYC = [
  { x: 330, y: 170, label: 'foo' },
  { x: 175, y: 395, label: 'bar' },
  { x: 485, y: 395, label: 'baz' },
] as const;

/** Position on the cycle at lap-progress u (u in laps, 3 legs per lap). */
function orbitPos(u: number): { x: number; y: number } {
  const f = ((u % 1) + 1) % 1;
  const leg = Math.min(2, Math.floor(f * 3));
  const t = f * 3 - leg;
  const a = CYC[leg];
  const b = CYC[(leg + 1) % 3];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// ---------------------------------------------------------------------------
// The signature press + ledger of barcodes.
// ---------------------------------------------------------------------------

const rand = mulberry32(20260717);
const mkBars = (): number[] => Array.from({ length: 12 }, () => (rand() > 0.42 ? 1 : 0));

const PAGE = { x: 620, y: 120, w: 230, h: 190 } as const;
const CONTENT_W: number[] = Array.from({ length: 6 }, () => 0.55 + rand() * 0.4);

const LEDGER = { x: 915, y0: 132, w: 290, rowH: 42 } as const;
const LEDGER_ROWS = [
  { label: 'foo', bars: mkBars() },
  { label: 'bar', bars: mkBars() },
  { label: 'baz', bars: mkBars() },
  { label: 'page 7', bars: mkBars() },
  { label: 'page 12', bars: mkBars() },
];
const MATCH_ROW = 2; // the incoming page matches baz — the cycle's repeat
const INCOMING = LEDGER_ROWS[MATCH_ROW].bars;

// near-duplicate twin for the similarity beat: 11 of 12 bars agree
const NEAR = INCOMING.map((b, i) => (i === 7 ? 1 - b : b));

// the frontier stub — where the demoted link sinks
const FRONT = { x: 620, y0: 420, w: 230, rowH: 42 } as const;
const FRONT_ROWS = ['baz', 'page 9', 'page 4'];

// ---------------------------------------------------------------------------
// MapReduce — RemoveDuplicateUrls over a url stream.
// ---------------------------------------------------------------------------

const MR_IN = ['foo /a', 'bar /x', 'baz /k', 'bar /x', 'foo /c', 'bar /x', 'page 7'];
const MR_DUP = MR_IN.map((u, i) => MR_IN.indexOf(u) !== i || MR_IN.lastIndexOf(u) !== i);
const MR = { x0: 96, y0: 140, colW: 165, rowH: 40 } as const;

const CAM_CYCLE: CameraState = { x: 340, y: 300, k: 1.25 };
const CAM_PRESS: CameraState = { x: 760, y: 280, k: 1.3 };
const CAM_LEDGER: CameraState = { x: 950, y: 280, k: 1.35 };
const CAM_SINK: CameraState = { x: 730, y: 420, k: 1.3 };
const CAM_MR: CameraState = { x: 380, y: 300, k: 1.2 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  cycU: ChannelRef<number>;
  orbitP: ChannelRef<number>;
  orbitOp: ChannelRef<number>;
  pressU: ChannelRef<number>;
  sigU: ChannelRef<number>;
  ledgU: ChannelRef<number>;
  scanP: ChannelRef<number>;
  matchU: ChannelRef<number>;
  frontU: ChannelRef<number>;
  sinkU: ChannelRef<number>;
  mrU: ChannelRef<number>;
  mrP: ChannelRef<number>;
  simU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CYCLE, cameraInterp);
  const cycU = tl.channel('cycU', 0); // triangle draw-on
  const orbitP = tl.channel('orbitP', 0); // crawler laps (in laps)
  const orbitOp = tl.channel('orbitOp', 1); // orbit visibility
  const pressU = tl.channel('pressU', 0); // page card reveal
  const sigU = tl.channel('sigU', 0); // content → barcode compression
  const ledgU = tl.channel('ledgU', 0); // crawled_links ledger
  const scanP = tl.channel('scanP', 0); // incoming barcode scans the ledger
  const matchU = tl.channel('matchU', 0); // the match flash
  const frontU = tl.channel('frontU', 0); // frontier stub reveal
  const sinkU = tl.channel('sinkU', 0); // demoted chip sinks
  const mrU = tl.channel('mrU', 0); // map-reduce panel
  const mrP = tl.channel('mrP', 0); // chips flowing through the stages
  const simU = tl.channel('simU', 0); // similarity dial beat
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the cycle —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'The web graph has cycles. This page links to that one, that one links onward, and three hops later you are right back where you started.',
  });
  tl.tween(cycU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the orbit —
  tl.caption({
    at: 7.0,
    dur: 6.5,
    text: 'Follow links naively and the crawler orbits forever, burning fetch after fetch on pages it has already read. With a cycle in the graph, the loop never terminates.',
  });
  tl.tween(orbitP, 4, { at: 7.2, dur: 34, ease: ease.linear });
  tl.hold(13.5, 0.5);

  // — Beat 3 · the harder half —
  tl.caption({
    at: 14.0,
    dur: 6,
    text: 'Repeated addresses are the easy half. The harder half is repeated content: the same page body living at many different addresses.',
  });
  tl.tween(cam, CAM_PRESS, { at: 14.2, dur: 1.5, ease: ease.move });
  tl.tween(pressU, 1, { at: 14.9, dur: 0.9, ease: ease.enter });
  tl.hold(20.0, 0.4);

  // — Beat 4 · the signature —
  tl.caption({
    at: 20.5,
    dur: 6.5,
    text: 'So every fetched page gets a signature: a fingerprint computed from its address and its contents.',
  });
  tl.tween(sigU, 1, { at: 21.3, dur: 1.8, ease: ease.move });
  tl.hold(27.0, 0.4);

  // — Beat 5 · the question —
  tl.caption({
    at: 27.5,
    dur: 6.5,
    text: 'Before crawling a link, the loop asks the crawled links table one question: have we already seen something with a similar signature?',
  });
  tl.tween(cam, CAM_LEDGER, { at: 27.7, dur: 1.4, ease: ease.move });
  tl.tween(ledgU, 1, { at: 28.0, dur: 1.0, ease: ease.enter });
  tl.tween(scanP, 1, { at: 29.2, dur: 3.4, ease: ease.move });
  tl.tween(matchU, 1, { at: 32.8, dur: 0.5, ease: ease.pop });
  tl.hold(34.0, 0.4);

  // — Beat 6 · the demotion —
  tl.caption({
    at: 34.5,
    dur: 6.5,
    text: 'If the answer is yes, the page is not fetched again. Its link is pushed down the frontier instead, demoted below everything fresher.',
  });
  tl.tween(cam, CAM_SINK, { at: 34.7, dur: 1.4, ease: ease.move });
  tl.tween(frontU, 1, { at: 35.0, dur: 0.9, ease: ease.enter });
  tl.tween(sinkU, 1, { at: 36.4, dur: 1.6, ease: ease.move });
  tl.hold(41.0, 0.4);

  // — Beat 7 · the orbit starves —
  tl.caption({
    at: 41.5,
    dur: 5,
    text: 'That one demotion is what breaks the cycle. The orbit starves, and the loop moves on.',
  });
  tl.tween(cam, CAM_CYCLE, { at: 41.7, dur: 1.4, ease: ease.move });
  tl.tween(orbitOp, 0, { at: 42.6, dur: 2.2, ease: ease.move });
  tl.hold(46.4, 0.4);

  // — Beat 8 · bulk dedup —
  tl.caption({
    at: 46.9,
    dur: 7.5,
    text: 'For addresses in bulk, a billion links are cleaned offline: a map step tags every address with a one, and a reduce step keeps only the addresses seen exactly once.',
  });
  tl.tween(cycU, 0.1, { at: 47.1, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_MR, { at: 47.1, dur: 1.5, ease: ease.move });
  tl.tween(mrU, 1, { at: 47.6, dur: 1.0, ease: ease.enter });
  tl.tween(mrP, 1, { at: 48.8, dur: 4.6, ease: ease.move });
  tl.hold(54.4, 0.4);

  // — Beat 9 · similar, not equal —
  tl.caption({
    at: 54.9,
    dur: 6.5,
    text: 'For content, similar is a spectrum, so signatures are compared with similarity measures: the Jaccard index, or cosine similarity.',
  });
  tl.tween(cam, CAM_PRESS, { at: 55.1, dur: 1.5, ease: ease.move });
  tl.tween(simU, 1, { at: 55.8, dur: 1.0, ease: ease.enter });
  tl.hold(61.4, 0.4);

  // — Beat 10 · close —
  tl.caption({
    at: 61.9,
    dur: 6,
    text: 'One fingerprint per page, one question per link. The crawler remembers where it has been, so it can keep moving forward.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 62.1, dur: 1.6, ease: ease.move });
  tl.tween(closeU, 1, { at: 62.5, dur: 1.4, ease: ease.move });
  tl.hold(67.9, 1.4);

  return {
    tl,
    cam,
    cycU,
    orbitP,
    orbitOp,
    pressU,
    sigU,
    ledgU,
    scanP,
    matchU,
    frontU,
    sinkU,
    mrU,
    mrP,
    simU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Barcode({ x, y, bars, w = 96, h = 20, color = colors.WARM, opacity = 1 }: {
  x: number; y: number; bars: number[]; w?: number; h?: number; color?: string; opacity?: number;
}) {
  const bw = w / bars.length;
  return (
    <g opacity={opacity}>
      {bars.map((b, i) =>
        b ? <rect key={i} x={x + i * bw} y={y} width={bw * 0.6} height={h} fill={color} /> : null,
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cycU = s.get(scene.cycU);
  const orbitP = s.get(scene.orbitP);
  const orbitOp = s.get(scene.orbitOp);
  const pressU = s.get(scene.pressU);
  const sigU = s.get(scene.sigU);
  const ledgU = s.get(scene.ledgU);
  const scanP = s.get(scene.scanP);
  const matchU = s.get(scene.matchU);
  const frontU = s.get(scene.frontU);
  const sinkU = s.get(scene.sinkU);
  const mrU = s.get(scene.mrU);
  const mrP = s.get(scene.mrP);
  const simU = s.get(scene.simU);
  const closeU = s.get(scene.closeU);

  const op = orbitPos(orbitP);
  const wasted = Math.floor(orbitP * 3);
  const dimAll = 1 - closeU * 0.86;
  // the incoming barcode rides the scan down the ledger to its match row
  const scanY = LEDGER.y0 - 46 + scanP * (MATCH_ROW * LEDGER.rowH + 46 + 8);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the cycle ---- */}
          <g opacity={Math.max(cycU, 0.001)}>
            {CYC.map((a, i) => {
              const b = CYC[(i + 1) % 3];
              const u = clamp01(cycU * 3 - i);
              const mx = a.x + (b.x - a.x) * u;
              const my = a.y + (b.y - a.y) * u;
              return (
                <g key={i}>
                  <line x1={a.x} y1={a.y} x2={mx} y2={my} stroke={colors.MUTED} strokeWidth={1.6} opacity={0.6} />
                  {u > 0.95 && (
                    <polygon
                      points="0,-5 10,0 0,5"
                      transform={`translate(${a.x + (b.x - a.x) * 0.56}, ${a.y + (b.y - a.y) * 0.56}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI})`}
                      fill={colors.MUTED}
                      opacity={0.7}
                    />
                  )}
                </g>
              );
            })}
            {CYC.map((p, i) => (
              <g key={`n${i}`}>
                <circle cx={p.x} cy={p.y} r={26} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} opacity={clamp01(cycU * 3 - i * 0.6)} />
                <text x={p.x} y={p.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13} opacity={clamp01(cycU * 3 - i * 0.6)}>
                  {p.label}
                </text>
              </g>
            ))}
            <text x={330} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic" opacity={cycU}>
              a cycle — the graph&apos;s trap
            </text>
          </g>

          {/* the orbiting crawler + wasted-fetch meter */}
          {orbitP > 0 && orbitOp > 0.01 && (
            <g opacity={orbitOp}>
              <circle cx={op.x} cy={op.y} r={13} fill={colors.NEGATIVE} opacity={0.2} />
              <circle cx={op.x} cy={op.y} r={6.5} fill={colors.NEGATIVE} stroke={colors.BG} strokeWidth={1.5} />
              <rect x={230} y={470} width={200} height={34} rx={9} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.2} opacity={0.9} />
              <text x={330} y={492} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5}>
                wasted fetches: {wasted}
              </text>
            </g>
          )}

          {/* ---- the signature press ---- */}
          <g opacity={pressU}>
            <rect x={PAGE.x} y={PAGE.y} width={PAGE.w} height={PAGE.h * (1 - sigU * 0.55)} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={PAGE.x + 12} y={PAGE.y + 24} fill={colors.TEXT} fontSize={12.5} fontFamily="ui-monospace, monospace">
              page.contents
            </text>
            {CONTENT_W.map((w, i) => {
              const rowY = PAGE.y + 40 + i * 22 * (1 - sigU * 0.55);
              return (
                <rect
                  key={i}
                  x={PAGE.x + 14}
                  y={rowY}
                  width={(PAGE.w - 28) * w}
                  height={Math.max(2, 8 * (1 - sigU * 0.7))}
                  rx={3}
                  fill={colors.MUTED}
                  opacity={0.5 - sigU * 0.2}
                />
              );
            })}
            {/* the barcode it presses into */}
            <g opacity={sigU}>
              <Barcode x={PAGE.x + 62} y={PAGE.y + PAGE.h * (1 - sigU * 0.55) + 16} bars={INCOMING} />
              <text x={PAGE.x + PAGE.w / 2} y={PAGE.y + PAGE.h * (1 - sigU * 0.55) + 56} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="ui-monospace, monospace">
                create_signature · url + contents
              </text>
            </g>
          </g>

          {/* ---- the crawled_links ledger of barcodes ---- */}
          <g opacity={ledgU}>
            <text x={LEDGER.x} y={LEDGER.y0 - 60} fill={colors.WARM} fontSize={12.5} fontFamily="ui-monospace, monospace">
              crawled_links
            </text>
            {LEDGER_ROWS.map((r, i) => {
              const hit = i === MATCH_ROW ? matchU : 0;
              return (
                <g key={r.label}>
                  <rect x={LEDGER.x} y={LEDGER.y0 + i * LEDGER.rowH} width={LEDGER.w} height={LEDGER.rowH - 8} rx={8} fill={colors.PANEL} stroke={hit > 0.02 ? colors.NEGATIVE : colors.GRID} strokeWidth={hit > 0.02 ? 2 : 1} />
                  <text x={LEDGER.x + 12} y={LEDGER.y0 + i * LEDGER.rowH + 22} fill={colors.TEXT} fontSize={12}>
                    {r.label}
                  </text>
                  <Barcode x={LEDGER.x + LEDGER.w - 112} y={LEDGER.y0 + i * LEDGER.rowH + 7} bars={r.bars} w={96} h={18} opacity={0.75 + 0.25 * hit} />
                </g>
              );
            })}
            {/* the incoming signature, scanning down */}
            {scanP > 0 && (
              <g>
                <rect x={LEDGER.x - 130} y={scanY - 6} width={120} height={32} rx={7} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
                <Barcode x={LEDGER.x - 118} y={scanY} bars={INCOMING} w={96} h={20} />
                <text x={LEDGER.x + LEDGER.w / 2} y={LEDGER.y0 - 38} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace" opacity={scanP}>
                  crawled_similar(signature)
                </text>
              </g>
            )}
            {matchU > 0.02 && (
              <text x={LEDGER.x + LEDGER.w / 2} y={LEDGER.y0 + LEDGER_ROWS.length * LEDGER.rowH + 20} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5} opacity={matchU}>
                similar signature found — do not fetch
              </text>
            )}
          </g>

          {/* ---- the frontier stub: the demotion ---- */}
          <g opacity={frontU}>
            <text x={FRONT.x} y={FRONT.y0 - 12} fill={colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace">
              links_to_crawl
            </text>
            {FRONT_ROWS.map((label, i) => {
              // the matched link (row 0) sinks to the bottom; others slide up
              const y =
                i === 0
                  ? FRONT.y0 + sinkU * 2 * FRONT.rowH
                  : FRONT.y0 + i * FRONT.rowH - sinkU * FRONT.rowH;
              const demoted = i === 0;
              return (
                <g key={label}>
                  <rect x={FRONT.x} y={y} width={FRONT.w} height={FRONT.rowH - 8} rx={8} fill={colors.PANEL} stroke={demoted ? (sinkU > 0.1 ? colors.NEGATIVE : colors.ACCENT) : colors.GRID} strokeWidth={demoted ? 1.6 : 1} opacity={demoted ? 1 - sinkU * 0.35 : 1} />
                  <text x={FRONT.x + 12} y={y + 22} fill={colors.TEXT} fontSize={12.5} opacity={demoted ? 1 - sinkU * 0.3 : 1}>
                    {label}
                  </text>
                </g>
              );
            })}
            <text x={FRONT.x + FRONT.w / 2} y={FRONT.y0 + 3 * FRONT.rowH + 26} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace" opacity={sinkU}>
              reduce_priority_link_to_crawl(url)
            </text>
          </g>

          {/* ---- MapReduce: RemoveDuplicateUrls ---- */}
          <g opacity={mrU}>
            <text x={MR.x0} y={MR.y0 - 34} fill={colors.TEXT} fontSize={14.5}>
              bulk address dedup
            </text>
            <text x={MR.x0} y={MR.y0 - 14} fill={colors.SECONDARY} fontSize={11.5} fontFamily="ui-monospace, monospace">
              class RemoveDuplicateUrls(MRJob)
            </text>
            {['urls in', 'map: yield line, 1', 'reduce: total == 1'].map((h, c) => (
              <text key={h} x={MR.x0 + c * (MR.colW + 30) + 8} y={MR.y0 + 12} fill={colors.MUTED} fontSize={11}>
                {h}
              </text>
            ))}
            {MR_IN.map((u, i) => {
              // stage progress: each chip crosses map then reduce, staggered
              const p = clamp01(mrP * (MR_IN.length + 2.5) - i * 0.8);
              const col = p < 0.5 ? p * 2 : 1 + (p - 0.5) * 2; // 0→1 map, 1→2 reduce
              const x = MR.x0 + Math.min(col, 2) * (MR.colW + 30);
              const killed = MR_DUP[i] && col > 1.55;
              const y = MR.y0 + 26 + i * MR.rowH + (killed ? (col - 1.55) * 60 : 0);
              return (
                <g key={i} opacity={killed ? Math.max(0, 1 - (col - 1.55) * 2.4) : 1}>
                  <rect x={x} y={y} width={MR.colW - 16} height={MR.rowH - 12} rx={7} fill={colors.PANEL} stroke={killed ? colors.NEGATIVE : MR_DUP[i] ? colors.MUTED : colors.POSITIVE} strokeWidth={1.2} />
                  <text x={x + 10} y={y + 19} fill={colors.TEXT} fontSize={11.5} fontFamily="ui-monospace, monospace">
                    {col >= 0.98 ? `${u} · 1` : u}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ---- similar, not equal ---- */}
          <g opacity={simU}>
            <rect x={620} y={430} width={280} height={150} rx={12} fill={colors.PANEL} stroke={colors.GRID} opacity={0.96} />
            <Barcode x={648} y={456} bars={INCOMING} w={150} h={22} />
            <Barcode x={648} y={492} bars={NEAR} w={150} h={22} color={colors.SECONDARY} />
            <text x={836} y={488} textAnchor="middle" fill={colors.POSITIVE} fontSize={19}>
              0.92
            </text>
            <text x={836} y={506} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              similarity
            </text>
            <text x={760} y={556} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              Jaccard index · cosine similarity
            </text>
          </g>
        </g>

        {/* quiet close */}
        <g opacity={closeU}>
          <rect x={330} y={240} width={620} height={180} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            one fingerprint per page · one question per link
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontFamily="ui-monospace, monospace">
            crawled_similar(signature) → reduce_priority_link_to_crawl(url)
          </text>
          <text x={640} y={386} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            remember where you have been, and cycles starve on their own
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
