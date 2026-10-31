// ch04-s03 — third of the triplet: "And on every pull request. Each run is recorded, then reviewed. For what breaks,
// and what's slow."
// The real Test Runs table of 'Reminders · CI' (take 'runs', held at mark list 3668) floats in, tilted, and settles.
// On 'pull' it zooms 1.4× toward the first blue PR #3 badge; braces snap round the badge and a red-pink underline runs
// under it; on 'request' the pill 'a test run for every PR' slides in beside the table; the zoom eases back. On
// 'recorded' a '▶ recording' chip pops out of each of the eight run rows and stacks to the right; on 'reviewed' a green
// ✓ ticks onto the top chip (1.6×, a soft green ring pulse) and a green hairline sweeps down the eight reviewed chips;
// on 'For' a ninth, anonymous chip (from no row) joins the stack, its grey 'illustration' tag lands on 'breaks', and it
// turns red-pink on 'slow'. A tape-stop desaturates the table; the stack stays crisp for ch05-s01.
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, easeInOut, easeOut, font, hexA, icon, measure, smooth } from '../../../film/promo';
import { driftLines } from '../sets/brand';
import { MARKS, SLUG } from '../sets/takes';
import { SvgBraces, SvgChip, SvgUnderline, chipCheckAt, tw } from '../sets/ch04-s02-svg';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---- the table (recording px; MEASURED IN THE FILM HARNESS with a DOM probe at a single seek to list 3668: the page
// sits 63.5 px higher there than on the rr-sheet frames, so every y below is the sheet's minus ≈ 63.5; 'Test Runs'
// 501..584 × 54..75, header row 110..125, first PR #3 badge text 996..1031 × 153..168, rows every 46 px)
// The crop starts at x 488 so the heading has 13 px of card air; its right edge stays at 1370 (Journeys ≥ 1380 out).
// Shown 880 stage px wide (≈ 1:1) so the row text reads without the zoom.
// Test Runs heading + header row + eight rows (PR #3 ×6, Project default ×2 … PR #1); the Journeys column (x ≥ 1380),
// the chat column (x < 500) and the tab strip (y < 110) stay out.
const CROP = { x: 488, y: 48, w: 882, h: 462 };
const BOX = { x: 48, y: 138, w: 880 };
const K = BOX.w / CROP.w;
/** run rows: vertical centres (recording px) */
const ROWS = [160.5, 206.5, 252.5, 298.5, 344.5, 390.5, 436.5, 482.5];
/** the first PR #3 badge (recording px) */
const BADGE = { x0: 986, x1: 1042, y0: 149, y1: 172 };
/** the zoom's fixed point (recording px). The view is framed so the whole story of a row reads at once, 'PR #3: PR #3'
 *  description → blue PR #3 badge → ✓ Completed (visible x 605..1226), with the Environment / Status header row whole
 *  at the top and six full rows under it (visible y 83..413). 1.4× rather than the script's 1.6×: at 1.6× the
 *  descriptions fall outside the card and the left half of the view is blank. */
const ZOOM_AT = { x: 867.5, y: 170.5 };
const ZOOM = 1.4;
/** where a chip pops out of its row (stage x: at the card's right edge, clear of the Bugs counts) */
const POP_X = BOX.x + BOX.w - 30;

/** stage point of a recording point at zoom s (about ZOOM_AT), no tilt */
function toStage(px: number, py: number, s: number) {
  return {
    x: BOX.x + K * (ZOOM_AT.x + s * (px - ZOOM_AT.x) - CROP.x),
    y: BOX.y + K * (ZOOM_AT.y + s * (py - ZOOM_AT.y) - CROP.y),
  };
}

// ---- the right column: pill above, the chip stack under it
const COL_X = 950;
const PILL = { y: 184, size: 22, text: 'a test run for every PR' };
const CHIP_K = 1.15;
const STACK_Y0 = 240;
const STACK_STEP = 37;
/** the chip cascade on 'recorded': starts just before the word, the last of the eight has landed by ≈ 3.6 s */
const CHIP_LEAD = 0.05;
const CHIP_STAGGER = 0.07;
const CHIP_FLIGHT = 0.45;
const chipW = () => (tw('▶ recording', 12, 600, true) + 22) * CHIP_K;

function prPill(c: CanvasRenderingContext2D, t: number, at: number) {
  const u = clamp((t - at) / 0.45);
  if (u <= 0) return;
  const e = easeOut(u);
  const size = PILL.size;
  const twd = measure(c, PILL.text, size, 400);
  const ic = 22;
  const h = 46;
  const w = 18 + ic + 11 + twd + 22;
  // right edge kept inside the safe area (1240)
  const x = Math.min(COL_X, 1240 - w) + (1 - e) * 60;
  const y = PILL.y - h / 2;
  c.save();
  c.globalAlpha *= e;
  if (e < 0.98) c.filter = `blur(${((1 - e) * 5).toFixed(2)}px)`;
  c.fillStyle = 'rgba(255,255,255,.72)';
  c.beginPath();
  c.roundRect(x, y, w, h, h / 2);
  c.fill();
  c.strokeStyle = hexA(PROMO.ink, 0.16);
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, h / 2);
  c.stroke();
  icon(c, 'branch', x + 18 + ic / 2, PILL.y, ic, PROMO.ink, false);
  c.fillStyle = PROMO.ink;
  c.font = font(400, size);
  (c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(-0.022 * size).toFixed(2)}px`;
  c.textBaseline = 'middle';
  c.fillText(PILL.text, x + 18 + ic + 11, PILL.y + 1);
  c.restore();
}

/** the grey 'illustration' tag: a soft plate with mid-grey type (darker than the kit tag's mute, so it reads on paper) */
function illustrationTag(c: CanvasRenderingContext2D, x: number, y: number, u: number) {
  if (u <= 0) return;
  const e = easeOut(u);
  const size = 16;
  const text = 'illustration';
  const w = measure(c, text, size, 500) + size * 1.3;
  const h = size * 1.75;
  const xx = x + (1 - e) * 10;
  c.save();
  c.globalAlpha *= e;
  if (e < 0.98) c.filter = `blur(${((1 - e) * 4).toFixed(2)}px)`;
  c.fillStyle = 'rgba(255,255,255,.55)';
  c.beginPath();
  c.roundRect(xx, y - h / 2, w, h, 6);
  c.fill();
  c.strokeStyle = hexA(PROMO.ink, 0.14);
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(xx + 0.5, y - h / 2 + 0.5, w - 1, h - 1, 6);
  c.stroke();
  c.fillStyle = hexA(PROMO.ink, 0.66);
  c.font = font(500, size);
  (c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(-0.01 * size).toFixed(2)}px`;
  c.textBaseline = 'middle';
  c.fillText(text, xx + size * 0.65, y + 1);
  c.restore();
}

type Sc = {
  bPr: number;
  bPill: number;
  bChips: number;
  bCheck: number;
  bFresh: number;
  bBreaks: number;
  bSlow: number;
  bStack: number;
  bTape: number;
  zoomBack: number;
  dur: number;
};

/** zoom factor at t: 1 → 1.4 from 'pull', back to 1 between 'request' and 'recorded' */
function zoomAt(t: number, sc: Sc) {
  const zin = easeInOut(clamp((t - sc.bPr + 0.04) / 0.5));
  const zout = easeInOut(clamp((t - sc.zoomBack) / 0.4));
  return 1 + (ZOOM - 1) * zin * (1 - zout);
}

/** the tape-stop: 0 → 1 over the shot's last ~0.5 s */
const tapeStop = (t: number, sc: Sc) => smooth((t - sc.bTape + 0.25) / Math.max(0.2, sc.dur - sc.bTape + 0.25));

/** stack slot i (0 top … 8 the fresh one); the stack tightens a touch at the end of the line */
function slot(i: number, t: number, sc: Sc) {
  const tight = easeInOut(clamp((t - sc.bStack) / 0.45));
  const step = STACK_STEP - 4 * tight;
  const mid = STACK_Y0 + STACK_STEP * 4; // tighten about the stack's middle
  const y = STACK_Y0 + i * STACK_STEP;
  return { x: COL_X + chipW() / 2, y: lerp(y, mid + (i - 4) * step, tight) };
}

export default defineShot({
  id: 'ch04-s03',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const sc: Sc = {
      bPr: T.beat('b-pr'),
      bPill: T.beat('b-pill'),
      bChips: T.beat('b-chips'),
      bCheck: T.beat('b-check'),
      bFresh: T.beat('b-fresh'),
      bBreaks: T.word('L0404', 'breaks'),
      bSlow: T.beat('b-slow'),
      bStack: T.beat('b-stack'),
      bTape: T.beat('b-tapestop'),
      // between 'request' (ends 1.86) and 'recorded' (2.73): back to the full table well before the chips pop
      zoomBack: T.wordEnd('L0403', 'request') + 0.15,
      dur: T.duration,
    };
    return { tl, ...sc };
  },
  paint(f, _s, sc) {
    const c = f.c;
    const t = f.t;
    c.fillStyle = PROMO.paper;
    c.fillRect(0, 0, 1280, 720);
    // the same two hairlines (ch04-s01 offset 9.79 + 4.833 + ch04-s02's 3.125), slowing in the tape-stop
    const ts = tapeStop(t, sc);
    const tw0 = sc.bTape - 0.25;
    const tt = t < tw0 ? t : tw0 + (t - tw0) * (1 - 0.5 * ts);
    driftLines(c, tt + 17.748, { n: 2, color: '#a9a4ae', alpha: 0.32, speed: 1.4, seed: 3, y0: 60, y1: 680 });

    prPill(c, t, sc.bPill - 0.06);

    // the fresh chip's grey 'illustration' tag (right of slot 8), landing on 'breaks': the truth label for a chip that
    // is an illustration, not a finding
    const p8 = slot(8, t, sc);
    illustrationTag(c, p8.x + chipW() / 2 + 16, p8.y, clamp((t - sc.bBreaks + 0.08) / 0.3));
  },
  overlay(s, sc) {
    const t = s.t;
    const z = zoomAt(t, sc);
    // braces + underline on the first PR #3 badge, following the zoom; they leave with the zoom-back
    const a = toStage(BADGE.x0, BADGE.y0, z);
    const b = toStage(BADGE.x1, BADGE.y1, z);
    const bu = clamp((t - sc.bPr + 0.02) / 0.34);
    const bout = clamp((t - sc.zoomBack) / 0.25);
    const ul = clamp((t - sc.bPr - 0.12) / 0.32);
    const bh = b.y - a.y;
    // each run row glows faintly red-pink as its chip pops out of it
    const flashes = ROWS.map((ry, i) => {
      const at = sc.bChips - CHIP_LEAD + i * CHIP_STAGGER;
      const v = clamp((t - at + 0.03) / 0.08) * (1 - clamp((t - at - 0.08) / 0.55));
      if (v <= 0) return null;
      const top = toStage(CROP.x, ry - 23, 1), bot = toStage(CROP.x + CROP.w, ry + 23, 1);
      return <rect key={`f${i}`} x={top.x} y={top.y} width={bot.x - top.x} height={bot.y - top.y} fill={PROMO.brand} opacity={0.075 * v} />;
    });
    const chips = ROWS.map((ry, i) => {
      const at = sc.bChips - CHIP_LEAD + i * CHIP_STAGGER;
      const u = clamp((t - at) / CHIP_FLIGHT);
      if (u <= 0) return null;
      const pop = easeOut(clamp(u / 0.22));
      const fly = easeInOut(clamp((u - 0.18) / 0.82));
      const o = { x: POP_X, y: toStage(CROP.x, ry, 1).y };
      const p = slot(i, t, sc);
      const x = lerp(o.x, p.x, fly);
      const y = lerp(o.y, p.y, fly) - Math.sin(Math.PI * fly) * 14;
      const check = i === 0 ? clamp((t - sc.bCheck + 0.04) / 0.22) : 0;
      return <SvgChip key={i} x={x} y={y} u={pop} scale={CHIP_K * lerp(0.7, 1, pop)} check={check} checkScale={i === 0 ? 1.6 : 1} />;
    });
    // 'reviewed': a soft green ring pulses off the top chip's ✓ (0.3 s), and a green hairline sweeps down the left edge
    // of the eight recorded chips (0.35 s): the stack was reviewed. It fades with the tape-stop so the stack hands off clean.
    const s0 = slot(0, t, sc);
    const s7 = slot(7, t, sc);
    const ck = chipCheckAt(s0.x, s0.y, CHIP_K);
    const ring = clamp((t - sc.bCheck - 0.06) / 0.3);
    const chipH = 26 * CHIP_K;
    const sweep = easeOut(clamp((t - sc.bCheck) / 0.35));
    const ts = tapeStop(t, sc);
    const lineX = COL_X - 12;
    const lineY0 = s0.y - chipH / 2, lineY1 = s7.y + chipH / 2;
    const review = (
      <g>
        {ring > 0 && ring < 1 && (
          <circle cx={ck.x} cy={ck.y} r={8 * CHIP_K * 1.6 * (1 + 1.3 * easeOut(ring))} fill="none" stroke={PROMO.green} strokeWidth={2.2 * (1 - ring) + 0.4} opacity={0.55 * (1 - ring)} />
        )}
        {sweep > 0 && (
          <g opacity={0.85 * (1 - ts)}>
            <rect x={lineX - 1} y={lineY0} width={2} height={(lineY1 - lineY0) * sweep} rx={1} fill={PROMO.green} />
            <rect x={lineX - 3} y={lineY0 + (lineY1 - lineY0) * sweep - 3} width={6} height={6} fill={PROMO.green} opacity={1 - sweep * 0.6} />
          </g>
        )}
      </g>
    );
    // the ninth chip, from no row: slides in from the right onto the end of the stack, tints on 'slow'
    const fu = clamp((t - sc.bFresh + 0.04) / 0.5);
    const p8 = slot(8, t, sc);
    const fresh =
      fu > 0 ? (
        <SvgChip
          x={lerp(p8.x + 120, p8.x, easeOut(fu))}
          y={p8.y}
          u={easeOut(clamp(fu / 0.6))}
          scale={CHIP_K}
          tint={easeInOut(clamp((t - sc.bSlow + 0.04) / 0.3))}
          blur={(1 - easeOut(fu)) * 6}
        />
      ) : null;
    return (
      <g>
        {flashes}
        <SvgBraces x0={a.x} x1={b.x} y={(a.y + b.y) / 2} size={bh * 1.9} u={bu} out={bout} pad={bh * 0.35} />
        <SvgUnderline x0={a.x + 2} x1={b.x - 2} y={b.y + bh * 0.42} u={ul} out={bout} width={3.5} />
        {chips}
        {review}
        {fresh}
      </g>
    );
  },
  dom(s, sc) {
    const t = s.t;
    const u = clamp((t - 0.05) / 0.6);
    const e = easeOut(u);
    const a = easeOut(clamp((t - 0.02) / 0.3));
    const ts = tapeStop(t, sc);
    const z = zoomAt(t, sc);
    const filters: string[] = [];
    if (a < 0.98) filters.push(`blur(${((1 - a) * 8).toFixed(2)}px)`);
    if (ts > 0.01) filters.push(`saturate(${(1 - 0.75 * ts).toFixed(3)})`, `brightness(${(1 + 0.04 * ts).toFixed(3)})`);
    return (
      <RrwebScreen
        slug={SLUG}
        take="runs"
        // held at 'list': the take's frames from 2900 to 3668 are identical (nothing scrolls), and a single seek keeps
        // the harness layout the probe measured
        at={MARKS.runs.list}
        crop={CROP}
        box={{ x: BOX.x, y: BOX.y + (1 - e) * 24, w: BOX.w }}
        chrome="none"
        radius={12}
        opacity={a * (1 - 0.12 * ts)}
        tilt={{ x: 5 * (1 - e), y: -12 * (1 - e) }}
        zoom={{ x: ZOOM_AT.x, y: ZOOM_AT.y, scale: z }}
        style={{
          filter: filters.length ? filters.join(' ') : undefined,
          boxShadow: '0 30px 70px -24px rgba(40,10,60,.36), 0 8px 20px -10px rgba(40,10,60,.2), 0 0 0 1px rgba(20,18,22,.05)',
        }}
      />
    );
  },
});

