// ch05-s05 — unnarrated: the subtle beat, in a corner of a product shot, then the pull-back into ch06's collage.
// Continuous from ch05-s04: the bug-sync strip stays sharp; from frame 0 its crop's top edge eases down onto the title
// (the chips row and its 'Fixed' chip are wiped out from the top, gone by ≈ 0.08 s, before the pair can show), and it
// shrinks to ≈ 70 % at the upper left (title top at y ≈ 90); ch05-s04's overlay fades and the brand haze drains to
// light-grey studio paper by 3.5 s. At 0.1 s the agent pair (sets/ch05-s05-pair: the kit's pair, drawn locally) eases
// in mid-right, cards x ≈ 560..1160, y ≈ 400..483, a diagonal with the strip: the developer hands a '▶ replay
// recording' chip across, which slides UNDER the critic card (never over its eye); the critic answers a big coral
// '✕ not yet' pill; the developer's card shimmers (it works again); a fresh chip goes across and the critic answers a
// big green '✓ good' pill, its border turning green with it. The pair holds, fades from 5.9 s and is gone by 6.15 s,
// as one small green ✓ chip detaches from the verdict and drifts off the RIGHT edge. Only then (6.2 s) the strip
// becomes a tile showing its chips row with the real 'Fixed' chip and travels to ch06's tile D; the bug-react title
// tile (frozen at 3150, 'Open' chip, no player; its clipped 4th title line masked) slides in to ch06's tile C; the
// real Insights and runs tiles (ch06's tiles A/B, same takes, crops and t = 0 transforms) fan in behind them at
// ≈ 40-60 % and blurred, so the cut into ch06-s01 is a match.
// A generic depiction of the documented fix-and-rerun loop: unbranded, never the page's judges, linked to no bug.
import type { CSSProperties } from 'react';
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, easeInOut, easeOut, haze, hexA, smooth } from '../../../film/promo';
import { driftLines } from '../sets/brand';
import { TakeInter } from '../sets/ch05-s02-bug';
import { S04_AT, STRIP_BOX, STRIP_CROP, TITLE_CROP, paintRequests } from '../sets/ch05-s04-sync';
import { CARD_H, CARD_W, pair, pillCentre } from '../sets/ch05-s05-pair';
import { CROPS, MARKS, SLUG, type Crop } from '../sets/takes';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const START = 66.4167;

// ---- the agent pair (the kit's cards 230 × 92, gap 210, at scale 0.9 → 603 × 83 px; its verdicts are our own 21-px
//      pills): mid-right, x 560..1163 × y 400..483 (+ the pill to ≈ 532), on a diagonal with the strip at upper left
const PAIR = { x: 560, y: 400, k: 0.9 };
const EXCHANGES = [
  { at: 0.5, verdict: 'not yet', ok: false },
  { at: 2.8, verdict: 'good', ok: true },
];

// ---- the strip: a reference point (the title's first glyph, rec 537 × 117) placed at P with scale k
const REF = { x: 537, y: 117 };
/** continuity with ch05-s04's last frame (STRIP_BOX, k = 1100 / 900) */
const K0 = STRIP_BOX.w / STRIP_CROP.w;
const P0 = { x: STRIP_BOX.x + (REF.x - STRIP_CROP.x) * K0, y: STRIP_BOX.y + (REF.y - STRIP_CROP.y) * K0 };
/** shrunk to ≈ 70 % (770 px for the 900-px title crop) at the upper left, its top at y 90 */
const K1 = 770 / TITLE_CROP.w;
const P1 = { x: 64 + (REF.x - TITLE_CROP.x) * K1, y: 90 + (REF.y - TITLE_CROP.y) * K1 };
/** the chips wipe: the crop's top edge eases from the chips row (STRIP_CROP) down onto the title (TITLE_CROP) from
 *  frame 0 over 0.25 s with a steep ease-out, so the chip pills (rec y ≤ ≈ 104) are gone by ≈ 0.08 s, before the pair
 *  starts to show (0.1 s) */
const WIPE = 0.25;
function wipeCrop(t: number): Crop {
  const e = 1 - Math.pow(1 - clamp(t / WIPE), 5);
  const y = lerp(STRIP_CROP.y, TITLE_CROP.y, e);
  const bot = lerp(STRIP_CROP.y + STRIP_CROP.h, TITLE_CROP.y + TITLE_CROP.h, e);
  return { x: TITLE_CROP.x, y, w: TITLE_CROP.w, h: bot - y };
}
/** ch06-s01's tile D near its t = 0 (its TILES as of 2026-10-14: x 690 − 12, y 286, w 490 for crop syncChipsTitle;
 *  tilt ≈ −11.4°, roll −1°, scale ≈ 0.965) */
const D_CROP = CROPS.syncChipsTitle;
const KD = 490 / D_CROP.w;
const PD = { x: 678 + (REF.x - D_CROP.x) * KD, y: 286 + (REF.y - D_CROP.y) * KD };
const D_END = { tilt: -11.4, rz: -1, scale: 0.965 };
/** ch06-s01's tile C near its t = 0 (x 70 + 12, y 280, w 450, tilt ≈ +11.4°, roll 0.8°, scale ≈ 0.94) */
const C_CROP = CROPS.reactChipsTitle;
const C_BOX = { x: 82, y: 280, w: 450 };
const C_END = { tilt: 11.4, rz: 0.8, scale: 0.94 };
/** bug-react's title wraps to FOUR lines in the take's Inter; the crop (to rec y 224) clips the top of the 4th
 *  ('components', ink from ≈ rec 221): a white band over rec 213..224 hides it (line 3's descenders end ≈ 209) */
const C_MASK = { y0: 213, y1: C_CROP.y + C_CROP.h };

/** ch06-s01's tiles A (Insights stat tiles) and B (runs table top) at ITS t = 0 (settle = easeOut(0.25 / 0.6) ≈ 0.80,
 *  70 % opacity, ≈ 2 px blur): same takes, marks, crops and boxes as ch06-s01's TILES (as of 2026-10-14) */
const RUNS_CROP: Crop = { x: 612, y: 104, w: 642, h: 218 };
const S06 = 1 - Math.pow(1 - 0.25 / 0.6, 3);
const FAN = [
  { key: 'A', take: 'insights', at: MARKS.insights.stats, crop: CROPS.insightsStats, x: 66, y: 92, w: 560, tiltY: 9, rz: -1.2, depth: 0.93, from: { dx: 120, dy: 40, tilt: 6 }, enter: -90 },
  { key: 'B', take: 'runs', at: MARKS.runs.list, crop: RUNS_CROP, x: 712, y: 28, w: 380, tiltY: -10, rz: 1, depth: 1, from: { dx: -110, dy: 50, tilt: -4 }, enter: 90 },
] as const;

type Sc = { tl: Timeline; dur: number };

/** strip placement at t: shrink (0 → 0.8 s), hold, travel to tile D (5.8 → end) */
function stripAt(t: number, dur: number) {
  const s = easeInOut(clamp(t / 0.8));
  const m = easeInOut(clamp((t - 5.8) / (dur - 5.8)));
  const k = lerp(lerp(K0, K1, s), KD, m);
  const p = { x: lerp(lerp(P0.x, P1.x, s), PD.x, m), y: lerp(lerp(P0.y, P1.y, s), PD.y, m) };
  return { k, p, m };
}

const boxFor = (crop: Crop, k: number, p: { x: number; y: number }) => ({ x: p.x - (REF.x - crop.x) * k, y: p.y - (REF.y - crop.y) * k, w: crop.w * k });

export default defineShot({
  id: 'ch05-s05',
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return { tl, dur: T.duration };
  },
  paint(f, _s, sc) {
    const c = f.c;
    const t = f.t;
    // the brand haze drains to paper
    const hz = 1 - smooth((t - 0.25) / 3.25);
    c.fillStyle = PROMO.paper;
    c.fillRect(0, 0, 1280, 720);
    if (hz > 0) {
      c.save();
      c.globalAlpha = hz;
      c.fillStyle = '#24102b';
      c.fillRect(0, 0, 1280, 720);
      c.restore();
      haze(c, { t: t + START, preset: 'brand', u: hz });
      c.save();
      c.globalAlpha = hz;
      driftLines(c, t + START, { n: 5, alpha: 0.12, speed: 0.8, seed: 5, y0: 40, y1: 690 });
      c.restore();
    }
    // the paper's hairlines, continuous into ch06-s01 (its clock: t − dur + 31.2)
    c.save();
    c.globalAlpha = 1 - hz;
    driftLines(c, t - sc.dur + 31.2, { n: 3, color: '#a9a4ae', alpha: 0.3, speed: 1.2, seed: 3, y0: 60, y1: 680 });
    c.restore();

    // ch05-s04's overlay, carried across the cut and fading first
    paintRequests(c, S04_AT.dur + t, 1 - smooth(t / 0.45));

    // ---- the agent pair: in at 0.1, out 5.9 → 6.15
    const pin = clamp((t - 0.1) / 0.4);
    const pout = clamp((t - 5.9) / 0.25);
    const pu = pin * (1 - pout);
    if (pu > 0) {
      pair(c, { t, x: PAIR.x, y: PAIR.y + (1 - easeOut(pin)) * 14, scale: PAIR.k, exchanges: EXCHANGES, u: pu });
      // the developer works again between the verdict and the fresh chip: a light runs round its card's border
      const sh = clamp((t - 1.95) / 0.85);
      if (sh > 0 && sh < 1) {
        const a = Math.sin(Math.PI * sh) * pu;
        c.save();
        c.translate(PAIR.x, PAIR.y);
        c.scale(PAIR.k, PAIR.k);
        const gx = -60 + (CARD_W + 120) * ((t - 1.95) * 1.6 % 1);
        const g = c.createLinearGradient(gx - 60, 0, gx + 60, 0);
        g.addColorStop(0, hexA(PROMO.violet, 0));
        g.addColorStop(0.5, hexA(PROMO.violet, 0.95 * a));
        g.addColorStop(1, hexA(PROMO.violet, 0));
        c.strokeStyle = g;
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(0.5, 0.5, CARD_W - 1, CARD_H - 1, 16);
        c.stroke();
        c.restore();
      }
    }
    // ---- the green ✓ chip: detaches from the critic as the pair fades and drifts off the right edge by 6.15 s
    const cu = clamp((t - 5.9) / 0.25);
    if (cu > 0 && cu < 1) {
      const pc = pillCentre({ x: PAIR.x, y: PAIR.y, scale: PAIR.k });
      const x0 = pc.x;
      const y0 = pc.y;
      const e = cu * cu;
      const x = lerp(x0, 1320, e);
      const y = y0 - Math.sin(Math.PI * cu) * 10;
      c.save();
      if (cu > 0.15) c.filter = `blur(${(e * 3).toFixed(2)}px)`;
      c.fillStyle = PROMO.green;
      c.beginPath();
      c.arc(x, y, 13, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#fff';
      c.lineWidth = 2.4;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(x - 5.5, y);
      c.lineTo(x - 1.5, y + 4.5);
      c.lineTo(x + 6, y - 4.5);
      c.stroke();
      c.restore();
    }
  },
  dom(s, sc) {
    const t = s.t;
    const { k, p, m } = stripAt(t, sc.dur);
    const pull = t >= 6.2;
    const crop = pull ? D_CROP : wipeCrop(t);
    const box = boxFor(crop, k, p);
    const h = crop.h * k;
    const tu = easeOut(clamp((t - 6.3) / (sc.dur - 6.3)));
    const tilt = D_END.tilt * tu;
    const scale = lerp(1, D_END.scale, m);
    const blur = Math.sin(Math.PI * m) * 3;
    const stripWrap: CSSProperties = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1280,
      height: 720,
      transformOrigin: `${box.x + box.w / 2}px ${box.y + h / 2}px`,
      transform: `perspective(1800px) rotateY(${tilt.toFixed(3)}deg) rotateZ(${(D_END.rz * tu).toFixed(3)}deg) scale(${scale.toFixed(4)})`,
      filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
      pointerEvents: 'none',
    };
    // the bug-react tile slides in from the left at the pull-back
    const cs = easeOut(clamp((t - 6.2) / (sc.dur - 6.2)));
    const cH = (C_CROP.h * C_BOX.w) / C_CROP.w;
    const cWrap: CSSProperties = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1280,
      height: 720,
      transformOrigin: `${C_BOX.x + C_BOX.w / 2}px ${C_BOX.y + cH / 2}px`,
      transform: `translateX(${((1 - cs) * -640).toFixed(2)}px) perspective(1800px) rotateY(${(C_END.tilt * tu).toFixed(3)}deg) rotateZ(${(C_END.rz * tu).toFixed(3)}deg) scale(${C_END.scale})`,
      filter: cs < 0.95 ? `blur(${((1 - cs) * 10).toFixed(2)}px)` : undefined,
      pointerEvents: 'none',
    };
    // ch06-s01's real top tiles (A Insights, B runs) fanning in behind, landing on ch06's t = 0 transforms: ≈ 40 %
    // and well blurred while they travel, ≈ 60 % / 2.6 px on the last frame (ch06 opens them at 70 % / 2 px)
    const fan = easeOut(clamp((t - 6.2) / (sc.dur - 6.2)));
    const fanTile = (d: (typeof FAN)[number]): JSX.Element => {
      const h = (d.crop.h * d.w) / d.crop.w;
      const dx = d.from.dx * (1 - S06) + d.enter * (1 - fan);
      const dy = d.from.dy * (1 - S06);
      const tiltY = d.tiltY + d.from.tilt * (1 - S06) + (d.tiltY > 0 ? 8 : -8) * (1 - fan);
      const k = d.depth * lerp(0.9, 1, S06);
      return (
        <div
          key={d.key}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1280,
            height: 720,
            transformOrigin: `${d.x + d.w / 2}px ${d.y + h / 2}px`,
            transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) perspective(1800px) rotateY(${tiltY.toFixed(2)}deg) rotateZ(${d.rz}deg) scale(${k.toFixed(4)})`,
            filter: `blur(${(2.6 + 4 * (1 - fan)).toFixed(2)}px)`,
            opacity: lerp(0.4, 0.6, fan * fan) * clamp(fan * 4),
            pointerEvents: 'none',
          }}
        >
          <RrwebScreen slug={SLUG} take={d.take} at={d.at} crop={d.crop} box={{ x: d.x, y: d.y, w: d.w }} chrome="none" radius={10} style={{ boxShadow: '0 16px 44px -16px rgba(40,10,60,.3), 0 6px 16px -8px rgba(40,10,60,.2), 0 0 0 1px rgba(20,18,22,.06)' }} />
        </div>
      );
    };
    const shadow = '0 30px 70px -24px rgba(40,10,60,.45), 0 8px 20px -10px rgba(40,10,60,.25), 0 0 0 1px rgba(20,18,22,.06)';
    const kC = C_BOX.w / C_CROP.w;
    return (
      <TakeInter>
        {/* mounted (invisible) from 5.6 s so their takes are loaded before they show */}
        {t >= 5.6 && FAN.map((d) => <div key={d.key} style={{ opacity: t >= 6.2 ? 1 : 0 }}>{fanTile(d)}</div>)}
        {t >= 6.2 - 0.6 && (
          <div style={{ ...cWrap, opacity: t >= 6.2 ? 1 : 0 }}>
            <RrwebScreen slug={SLUG} take="bug-react" at={MARKS['bug-react'].still} crop={C_CROP} box={C_BOX} chrome="none" radius={10} style={{ boxShadow: shadow }} />
            <div
              style={{
                position: 'absolute',
                left: C_BOX.x + 2,
                top: C_BOX.y + (C_MASK.y0 - C_CROP.y) * kC,
                width: C_BOX.w - 4,
                height: (C_MASK.y1 - C_MASK.y0) * kC,
                background: '#ffffff',
                borderRadius: '0 0 8px 8px',
              }}
            />
          </div>
        )}
        <div style={stripWrap}>
          <RrwebScreen
            slug={SLUG}
            take="bug-sync"
            at={MARKS['bug-sync'].report}
            crop={crop}
            box={box}
            chrome="none"
            radius={lerp(14, 10, m)}
            style={{ boxShadow: shadow }}
          />
        </div>
      </TakeInter>
    );
  },
});
