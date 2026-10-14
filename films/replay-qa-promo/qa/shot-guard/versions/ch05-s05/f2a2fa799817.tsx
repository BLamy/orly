// ch05-s05 — unnarrated: the subtle beat, in a corner of a product shot, then the pull-back into ch06's collage.
// Continuous from ch05-s04: the bug-sync strip stays sharp, re-cropped to the TITLE ONLY (the chips row and its 'Fixed'
// chip are out of frame while the agents are on screen), and shrinks to ≈ 70 % toward the upper left; ch05-s04's
// overlay fades and the brand haze drains to light-grey studio paper. At 0.1 s the kit agent pair eases in at the
// lower right, over clear paper: the developer hands a '▶ replay recording' chip to the critic, who answers '✕ not yet';
// the developer's card shimmers (it works again); a fresh chip goes across and the critic answers '✓ good'. The pair
// holds, fades from 5.9 s and is gone by 6.15 s, as one small green ✓ chip detaches from the critic and drifts off the
// RIGHT edge. Only then (6.2 s) the strip becomes a tile showing its chips row with the real 'Fixed' chip and travels
// to its place in ch06's collage; the bug-react title tile (frozen at 3150, 'Open' chip, no player) slides in beside
// it; from 6.3 s both tilt (y ±12°) and blank tile edges fan out behind them, handing off to ch06-s01.
// A generic depiction of the documented fix-and-rerun loop: unbranded, never the page's judges, linked to no bug.
import type { CSSProperties } from 'react';
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, agentPair, easeInOut, easeOut, haze, hexA, smooth } from '../../../film/promo';
import { driftLines } from '../sets/brand';
import { TakeInter } from '../sets/ch05-s02-bug';
import { S04_AT, STRIP_BOX, STRIP_CROP, TITLE_CROP, paintRequests } from '../sets/ch05-s04-sync';
import { CROPS, MARKS, SLUG, type Crop } from '../sets/takes';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const START = 66.4167;

// ---- the agent pair (kit agentPair; cards 230 × 92, gap 210, at scale 0.9 → 603 × 83 px + the verdict pill: the
//      look asks for ≈ 0.6, but at 0.6 its verdict pills render at 8 px; 0.9 keeps them legible and still a corner beat)
const PAIR = { x: 598, y: 516, k: 0.9 };
const CARD_W = 230, CARD_H = 92, GAP = 210;

// ---- the strip: a reference point (the title's first glyph, rec 537 × 117) placed at P with scale k
const REF = { x: 537, y: 117 };
/** continuity with ch05-s04's last frame (STRIP_BOX, k = 1100 / 900) */
const K0 = STRIP_BOX.w / STRIP_CROP.w;
const P0 = { x: STRIP_BOX.x + (REF.x - STRIP_CROP.x) * K0, y: STRIP_BOX.y + (REF.y - STRIP_CROP.y) * K0 };
/** shrunk to ≈ 70 % (770 px for the 900-px title crop) at the upper left */
const K1 = 770 / TITLE_CROP.w;
const P1 = { x: 64 + (REF.x - TITLE_CROP.x) * K1, y: 58 + (REF.y - TITLE_CROP.y) * K1 };
/** ch06-s01's tile D at its t = 0 (x 690 − 12, y 250, w 490 for crop syncChipsTitle; tilt −11.4°, scale ≈ 0.97) */
const D_CROP = CROPS.syncChipsTitle;
const KD = 490 / D_CROP.w;
const PD = { x: 678 + (REF.x - D_CROP.x) * KD, y: 250 + (REF.y - D_CROP.y) * KD };
/** ch06-s01's tile C at its t = 0 (x 70 + 12, y 242, w 490, tilt +11.4°, scale ≈ 0.965) */
const C_CROP = CROPS.reactChipsTitle;
const C_BOX = { x: 82, y: 242, w: 490 };

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
    const hz = 1 - smooth((t - 0.25) / 2.6);
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
      agentPair(c, {
        t,
        x: PAIR.x,
        y: PAIR.y + (1 - easeOut(pin)) * 14,
        scale: PAIR.k,
        exchanges: [
          { at: 0.5, verdict: 'not yet', ok: false },
          { at: 2.8, verdict: 'good', ok: true },
        ],
        u: pu,
      });
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
      const x0 = PAIR.x + (CARD_W + GAP + CARD_W / 2) * PAIR.k;
      const y0 = PAIR.y + (CARD_H + 29) * PAIR.k;
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
    const crop = pull ? D_CROP : TITLE_CROP;
    const box = boxFor(crop, k, p);
    const h = crop.h * k;
    const tilt = -11.4 * easeOut(clamp((t - 6.3) / (sc.dur - 6.3)));
    const scale = lerp(1, 0.97, m);
    const blur = Math.sin(Math.PI * m) * 3;
    const stripWrap: CSSProperties = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1280,
      height: 720,
      transformOrigin: `${box.x + box.w / 2}px ${box.y + h / 2}px`,
      transform: `perspective(1800px) rotateY(${tilt.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
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
      transform: `translateX(${((1 - cs) * -640).toFixed(2)}px) perspective(1800px) rotateY(${(11.4 * easeOut(clamp((t - 6.3) / (sc.dur - 6.3)))).toFixed(3)}deg) scale(0.965)`,
      filter: cs < 0.95 ? `blur(${((1 - cs) * 10).toFixed(2)}px)` : undefined,
      pointerEvents: 'none',
    };
    // blank tile edges fanning out behind, where ch06-s01's top tiles will appear
    const fan = easeOut(clamp((t - 6.3) / (sc.dur - 6.3)));
    const blank = (key: string, x: number, y: number, w: number, hh: number, rot: number, dx: number): JSX.Element => (
      <div
        key={key}
        style={{
          position: 'absolute',
          left: x + dx * (1 - fan),
          top: y,
          width: w,
          height: hh,
          borderRadius: 10,
          background: '#ffffff',
          opacity: 0.4 * fan,
          filter: 'blur(5px)',
          transform: `perspective(1800px) rotateY(${rot}deg) scale(0.9)`,
          boxShadow: '0 16px 40px -16px rgba(40,10,60,.3)',
        }}
      />
    );
    const shadow = '0 30px 70px -24px rgba(40,10,60,.45), 0 8px 20px -10px rgba(40,10,60,.25), 0 0 0 1px rgba(20,18,22,.06)';
    return (
      <TakeInter>
        {t >= 6.3 && blank('A', 94, 96, 520, 60, 15, -80)}
        {t >= 6.3 && blank('B', 668, 50, 440, 131, -14, 80)}
        {t >= 6.2 - 0.6 && (
          <div style={{ ...cWrap, opacity: t >= 6.2 ? 1 : 0 }}>
            <RrwebScreen slug={SLUG} take="bug-react" at={MARKS['bug-react'].still} crop={C_CROP} box={C_BOX} chrome="none" radius={10} style={{ boxShadow: shadow }} />
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
