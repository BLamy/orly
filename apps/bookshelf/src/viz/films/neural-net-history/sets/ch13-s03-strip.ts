/**
 * ch13-s03 / ch13-s04 — the Statement on AI Risk strip on the worry candle's stage: unrolls across the backdrop as the
 * flame push lands (ch13-s03), carries the opening clause word for word and the pen-written signatures (Hinton first,
 * Bengio second, then Demis Hassabis, Sam Altman, Dario Amodei), and rolls up into the flies as ch13-s04 pulls back.
 */
import type { PaintEnv, Pose } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, cardProbe, drawTracked } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK, withLife } from '../../../film';
import { cast } from '../cast';
import { LAB_POS, STAND13, capSize, clamp01, penLine, tq12 } from './ch13-s01-kit';

type C = CanvasRenderingContext2D;
/** round 3: shortened (250 → 214 px) and hung a little higher, so the taller worry candle's flame clears it */
export const STRIP13 = { x0: 168, x1: 1112, y0: 22, y1: 236 };
/** the worry candle's stage, shared by ch13-s03 and ch13-s04 (which opens on ch13-s03's last frame). Round 3: the
 *  candle 'stands huge' (1.3x: its flame above the figures' heads), and the signatories stand INSIDE its pool,
 *  ~80 px nearer the flame than in round 2 */
export const SS13 = 1.5;
/** review r1 (ch13-s03, 'stands huge'): the worry candle on the stage is ~1.5x round 3's width (SS13 1.3 -> 1.5 is 1.15x its
 *  height; this widens it the rest of the way), so it reads as the belief the figures gather around, not a pole. Its
 *  flame now stands in front of the strip's lower edge, where the second signature row leaves the centre clear */
export const CSX13 = (1.55 * 1.3) / 1.5;
export const HX13 = 554;
export const BX13 = 448;
/** round 3 hand-off: the carved newel at lower left, at 0.6 of rimNear's size (its finial tops out ~ y 500), so it
 *  crosses only the legs of a figure walking in at the left and never a face, a name card or the medallions */
export const NEWEL13 = 0.6;
/** the stage's settled camera at ch13-s03's last frame (ch13-s04 opens exactly here) */
export const STAGE_END13: [number, number, number] = [640, 336, 1.06];
/** the near plane at ch13-s03's end (both wings and the lip, laid out for STAGE_END13): ch13-s04 opens on exactly this
 *  and crossfades to its own wide-shot near plane over the pull-back */
export const NEAR13 = { curtain: 'both' as const, curtainW: 74, lipY: 692, newelScale: NEWEL13 };

/** the far plane on the stage (L2, drawn after the curtain): two tall lancet bays let into the dark paper curtain,
 *  pale and backlit (L* ~40-48), three lights each under a pointed head, their lower thirds lost in the floor haze */
const BAYS13 = [{ x: 236, w: 118 }, { x: 1052, w: 118 }];
export function stageBays13(c: C, env: PaintEnv) {
  const m = env.mood;
  const glass = mixLab(mixLab(m.setHaze, m.halo, 0.32), m.sky[2], 0.2);
  const top = 150, bot = 640;
  c.save();
  for (const bay of BAYS13) {
    const x0 = bay.x - bay.w / 2, x1 = bay.x + bay.w / 2;
    const spring = top + bay.w * 0.62;
    const path = () => {
      c.beginPath();
      c.moveTo(x0, bot);
      c.lineTo(x0, spring);
      c.quadraticCurveTo(x0, top + 14, bay.x, top);
      c.quadraticCurveTo(x1, top + 14, x1, spring);
      c.lineTo(x1, bot);
      c.closePath();
    };
    // the glass: brighter low (the light behind the stage), falling off toward the head
    const g = c.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, withAlpha(glass, 0.3));
    g.addColorStop(0.55, withAlpha(glass, 0.55));
    g.addColorStop(1, withAlpha(glass, 0.4));
    c.fillStyle = g;
    path();
    c.fill();
    // three lights: two mullions, transoms, a small trefoil in the head (the curtain's ink)
    c.fillStyle = withAlpha(mixLab(m.fg, m.set, 0.4), 0.92);
    for (let i = 1; i < 3; i++) c.fillRect(x0 + (bay.w * i) / 3 - 3, spring - 8, 6, bot - spring + 8);
    for (const ty of [spring + 120, spring + 260]) c.fillRect(x0, ty - 2.5, bay.w, 5);
    c.beginPath();
    c.arc(bay.x, spring - 18, 12, 0, Math.PI * 2);
    c.lineWidth = 5;
    c.strokeStyle = c.fillStyle;
    c.stroke();
    // the reveal: a dark jamb either side
    c.fillRect(x0 - 8, spring, 8, bot - spring);
    c.fillRect(x1, spring, 8, bot - spring);
  }
  c.restore();
}


export interface StripTimes {
  stageT: number;
  sig1: number;
  sig2: number;
  labs: number;
}
/** the strip as it stands at the end of ch13-s03 (every line written) */
export const STRIP_DONE: StripTimes = { stageT: -100, sig1: -100, sig2: -100, labs: -100 };

/** the parchment strip: unrolls from its left rod to the right as the push lands (review r1: it opened from the centre,
 *  and under the flame push's lens the frame showed a slit of clipped glyphs). The clause is printed on the paper and
 *  comes out from under the travelling roll in reading order: the roll is painted over the paper's leading edge, so no
 *  cut glyph ever shows at a bare edge */
const UNROLL = 1.0;
export function drawStrip(c: C, env: PaintEnv, t: number, b: StripTimes, o: { rise?: number; roll?: number; alpha?: number } = {}) {
  const x = clamp01((t - b.stageT) / UNROLL);
  if (x <= 0.002) return;
  // ease-out: the roll leaves fast and settles against the far end
  const u = 1 - (1 - x) * (1 - x);
  const { x0, x1 } = STRIP13;
  // rolling up into the flies (ch13-s04's opening): the strip rises and its bottom rolls up toward its top rod
  const y0 = STRIP13.y0 - (o.rise ?? 0);
  const y1 = y0 + (STRIP13.y1 - STRIP13.y0) * (1 - 0.85 * (o.roll ?? 0));
  const cx = (x0 + x1) / 2;
  const xr = x0 + (x1 - x0) * u;
  const rr = 9 + 9 * (1 - u);
  const P = MOODS.parchment;
  const m = env.mood;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  // shadow and paper
  c.fillStyle = withAlpha(m.fg, 0.45);
  c.fillRect(x0 + 6, y0 + 8, xr - x0, y1 - y0);
  const paper = mixLab(P.sky[2], m.halo, 0.22);
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, mixLab(paper, m.set, 0.32));
  g.addColorStop(0.55, paper);
  g.addColorStop(1, mixLab(paper, m.core, 0.12));
  c.fillStyle = g;
  c.fillRect(x0, y0, xr - x0, y1 - y0);
  // the clause (word for word, not narrated), on the unrolled paper only
  const ink = mixLab(P.ink, m.fg, 0.1);
  c.save();
  c.beginPath();
  c.rect(x0 + 6, y0, Math.max(0, xr - x0 - 6), y1 - y0);
  c.clip();
  // round 3 (cards carry their text): the first glyph is out from under the roll within ~0.1 s of the paper
  cardProbe(c, 'ch13-strip', x0, y0, xr - x0, y1 - y0, 1, clamp01((xr - 330) / 20));
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.font = `italic 400 35px ${FONT.text}`;
  c.fillText('“Mitigating the risk of extinction from AI', cx, y0 + 54);
  c.fillText('should be a global priority…”', cx, y0 + 97);
  c.fillStyle = withAlpha(ink, 0.85);
  // the attribution, set in full small-cap capitals at the legibility floor (23 px cap at 1080p under the camera)
  const aSize = capSize(c, `500 18px ${FONT.sc}`, 23, env.pxScale || 1.5);
  drawTracked(c, '— STATEMENT ON AI RISK', cx, y0 + 131, { font: `500 ${aSize}px ${FONT.sc}`, size: aSize, tracking: 0.14, align: 'center' });
  c.fillStyle = withAlpha(ink, 0.25);
  c.fillRect(cx - 300, y0 + 143, 600, 0.8);
  c.restore();
  // the rod at the left and the travelling roll over the paper's leading edge (fat while most of the paper is on it)
  const roller = (ex: number, r: number) => {
    const rg = c.createLinearGradient(ex - r, 0, ex + r, 0);
    rg.addColorStop(0, mixLab(paper, m.fg, 0.45));
    rg.addColorStop(0.5, mixLab(paper, m.rim, 0.25));
    rg.addColorStop(1, mixLab(paper, m.fg, 0.45));
    c.fillStyle = rg;
    c.fillRect(ex - r, y0 - 6, 2 * r, y1 - y0 + 12);
  };
  roller(x0, 9);
  roller(xr, rr);
  // the threads it hangs by (the right one rides the roll)
  c.strokeStyle = withAlpha(m.rim, 0.25);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0 + 30, y0);
  c.lineTo(x0 + 60, -400);
  c.moveTo(xr - 30, y0);
  c.lineTo(xr - 60 * u, -400);
  c.stroke();
  c.restore();
  // the signatures in the pen hand, one after another
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.beginPath();
  c.rect(x0 - 20, y0, xr - x0 + 40, y1 - y0);
  c.clip();
  const pen = withAlpha(mixLab(P.ink, '#1a2a44', 0.35), 0.9);
  const sy1 = y0 + 174, sy2 = y0 + 204;
  // Hinton's line is written as his name is said, finished on 'first'
  penLine(c, 'Geoffrey Hinton', cx - 130, sy1, 27, b.sig1 - 0.8, 0.75, t, pen, 'center');
  penLine(c, 'Yoshua Bengio', cx + 130, sy1, 27, b.sig2 - 0.05, 0.6, t, pen, 'center');
  // review r1: the second row leaves its centre clear for the (larger) worry candle's flame in front of the strip
  penLine(c, 'Demis Hassabis', cx - 300, sy2, 23, b.labs - 0.05, 0.55, t, pen, 'center');
  penLine(c, 'Sam Altman', cx - 128, sy2, 23, b.labs + 0.35, 0.45, t, pen, 'center');
  penLine(c, 'Dario Amodei', cx + 200, sy2, 23, b.labs + 0.7, 0.5, t, pen, 'center');
  c.restore();
}

/** review r1 (ch13-s03 'heads', ch13-s04 opening): the three lab heads (Hassabis, Altman, Dario Amodei) at LAB_POS, equal
 *  in light with Hinton and Bengio: PUPPET_NEAR_BLACK and the same 2.5 px warm rim toward the flame. They step out of the
 *  dark from `start` in three drawings on twos (the ink deepening from the backdrop's haze), each 0.08 s after the last,
 *  all solid by start + 0.58 s. `back` (0..1, ch13-s04): they ease back into the haze as texture (solid, never
 *  translucent: the ink goes toward the backdrop's value, the rim goes out, a small step upstage) */
export function labIn13(t: number, start: number, i: number) {
  return clamp01((tq12(t) - (start + 0.08 * i)) / 0.42);
}
export function labHeads13(c: C, env: PaintEnv, t: number, start: number, back = 0) {
  const tq = tq12(t);
  const LAB = [cast.hassabis, cast.altman, cast['amodei-dario']];
  const haze = mixLab(env.mood.set, env.mood.haze, 0.5);
  for (let i = 0; i < 3; i++) {
    const e = labIn13(t, start, i);
    if (e <= 0.001) continue;
    const st = e >= 1 ? 1 : Math.ceil(e * 3) / 3;
    const r = clamp01(back * 1.15 - 0.08 * i);
    const P = LAB_POS[i];
    const ink = mixLab(PUPPET_NEAR_BLACK, haze, Math.max(0.6 * (1 - st), 0.62 * r));
    const pz: Pose = withLife({ ...STAND13 }, tq, 300 + i * 17, 0.8);
    const sc = P.s * (1 - 0.08 * r);
    // (the kit floors any rim to 80 %, so it is simply on from the second drawing and off once they ease back)
    const o = { x: P.x + 8 * (1 - st) + 26 * r, y: P.y - 3 * (1 - st) - 12 * r, facing: 'left' as const, pose: pz, scale: sc };
    LAB[i].draw(c, { ...o, ink, light: { x: -1, y: -0.2, floor: 0.12 }, edgeRim: { x: -1, y: -0.35, px: 2.5, alpha: st > 0.5 && r < 0.34 ? 0.9 : 0, warm: 0.65 } }, env);
  }
}
