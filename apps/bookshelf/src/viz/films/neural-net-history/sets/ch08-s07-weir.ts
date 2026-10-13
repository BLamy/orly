/**
 * ch08-s07 — the weir plate: two streams on parchment, ink and cut paper.
 *   upper lane  the older S-shaped switch (tanh): a gate whose pierced shape IS the S-curve; downstream the
 *               water is tanh(level), so a tall wave arrives flattened against the ceiling (+1)
 *   lower lane  the weir (the rectifier, max(0, x)): a lip at zero; downstream the water is max(0, level):
 *               below the lip stops dead, above it passes at full height
 * Levels are signed numbers drawn as water heights about each lane's zero line (A px per unit).
 *
 *   LANE = { x0, x1, gx, A, up: {y0}, lo: {y0} }
 *   stream(c, lane, level(x), F(v), o)    one lane's water (upstream raw, downstream F), its bed and banks
 *   sGate(c, x, y0, A, alpha)             the S-switch gate with its tanh curve pierced in it
 *   weirLip(c, x, y0, rise, kink)         the weir: a cut-paper wall up to the lip, rising in on 'weir'; `kink`
 *                                         0..1 cuts the max(0, x) kink through its face (the S gate's twin)
 *   paperLift(c)                          cut paper lifted off the plate: a 2-3 px soft shadow
 *   plotGlyph(c, kind, x, y, w, h, a)     a small faint ink plot: 'tanh' or 'relu' (the kinked line)
 *   paperBoat(c, x, y, s, a, tone)        a folded paper boat (cut paper) sitting on a surface at (x, y)
 *   plateBead(c, x, y, r, k)              the backward messenger on paper: ink bead in a gold ring (k = ring strength)
 *   finishFlag(c, x, y, a, raised)        a small pennant on a post
 */
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';

type C = CanvasRenderingContext2D;
const P = MOODS.parchment;
export const INK = P.ink;
const WATER = mixLab(P.set, '#9fb0b4', 0.35);

/** cut paper lifted a few mm off the plate: a soft 2-3 px shadow down and right (device px; cleared by restore) */
export function paperLift(c: C, k = 1): void {
  c.shadowColor = withAlpha(mixLab(INK, '#000000', 0.3), 0.32 * k);
  c.shadowBlur = 3.5;
  c.shadowOffsetX = 2.2;
  c.shadowOffsetY = 3;
}

export const LANE = { x0: 150, x1: 1150, gx: 610, A: 56, up: { y0: 262 }, lo: { y0: 488 } };

export interface StreamOpts {
  /** 0..1 the channel inks in from the left */
  draw?: number;
  /** water present (0..1) */
  water?: number;
  /** the downstream floor sits at the lip (weir) or at -1 (S gate) */
  floor: 'lip' | 'minus1';
  alpha?: number;
}

/** one lane: upstream water at level(x), downstream F(level(x)); the channel walls drawn as cut paper */
export function stream(c: C, y0: number, level: (x: number) => number, F: ((v: number) => number) | null, o: StreamOpts): void {
  const A = LANE.A;
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const d = o.draw ?? 1;
  const xEnd = LANE.x0 + (LANE.x1 - LANE.x0) * d;
  const bedUp = y0 + A * 1.35;
  const floorDn = o.floor === 'lip' ? y0 : y0 + A;
  c.save();
  c.globalAlpha *= a;
  // water body
  const wA = o.water ?? 1;
  if (wA > 0.01) {
    c.beginPath();
    const step = 4;
    c.moveTo(LANE.x0, bedUp);
    for (let x = LANE.x0; x <= xEnd; x += step) {
      const v = level(x);
      const out = x < LANE.gx || !F ? v : F(v);
      const bed = x < LANE.gx ? bedUp : floorDn;
      c.lineTo(x, Math.min(bed, y0 - A * out));
    }
    c.lineTo(xEnd, xEnd < LANE.gx ? bedUp : floorDn);
    if (xEnd > LANE.gx) {
      c.lineTo(LANE.gx, floorDn);
      c.lineTo(LANE.gx, bedUp);
    }
    c.closePath();
    c.fillStyle = withAlpha(WATER, 0.5 * wA);
    c.fill();
    // engraved hatching inside the water (horizontal, denser toward the bed)
    c.save();
    c.clip();
    c.strokeStyle = withAlpha(INK, 0.16 * wA);
    c.lineWidth = 0.8;
    c.beginPath();
    for (let yy = y0 - A * 2.6; yy < bedUp + 4; yy += 5) {
      const off = (yy * 7.3) % 23;
      for (let x = LANE.x0 + off; x < xEnd; x += 46) {
        c.moveTo(x, yy);
        c.lineTo(x + 22 + ((yy - y0) / A) * 6, yy);
      }
    }
    c.stroke();
    c.restore();
    // the surface line in ink
    c.beginPath();
    let first = true;
    for (let x = LANE.x0; x <= xEnd; x += step) {
      const v = level(x);
      const out = x < LANE.gx || !F ? v : F(v);
      const bed = x < LANE.gx ? bedUp : floorDn;
      const y = Math.min(bed, y0 - A * out);
      const dry = x >= LANE.gx && y >= floorDn - 0.5;
      if (dry) {
        first = true;
        continue;
      }
      if (first) c.moveTo(x, y);
      else c.lineTo(x, y);
      first = false;
    }
    c.strokeStyle = withAlpha(INK, 0.85 * wA);
    c.lineWidth = 2;
    c.stroke();
  }
  // the channel: bed and banks in cut paper (ink), lifted off the plate; the zero line dashed
  c.save();
  paperLift(c);
  c.fillStyle = withAlpha(INK, 0.9);
  c.fillRect(LANE.x0 - 6, bedUp, Math.min(LANE.gx, xEnd) - LANE.x0 + 6, 8);
  if (xEnd > LANE.gx) c.fillRect(LANE.gx, floorDn, xEnd - LANE.gx, o.floor === 'lip' ? 8 : 8);
  c.restore();
  c.setLineDash([5, 6]);
  c.strokeStyle = withAlpha(INK, 0.35);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(LANE.x0, y0);
  c.lineTo(xEnd, y0);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}

/** the S-switch gate: a cut-paper post with the tanh curve pierced through it; ceiling and floor marks */
export function sGate(c: C, x: number, y0: number, alpha: number): void {
  if (alpha <= 0.003) return;
  const A = LANE.A;
  c.save();
  c.globalAlpha *= alpha;
  // the ceiling (+1) and floor (-1) downstream: faint dashed rules
  c.setLineDash([2, 5]);
  c.strokeStyle = withAlpha(INK, 0.45);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x, y0 - A);
  c.lineTo(LANE.x1, y0 - A);
  c.stroke();
  c.setLineDash([]);
  // the gate: a slab with the S pierced in it
  const w = 54;
  const top = y0 - A * 1.6;
  const bot = y0 + A * 1.35 + 8;
  const slab = new Path2D();
  slab.rect(x - w / 2, top, w, bot - top);
  c.save();
  paperLift(c);
  c.fillStyle = withAlpha(INK, 0.88);
  c.fill(slab);
  c.fillRect(x - w / 2 - 5, top - 6, w + 10, 7);
  c.restore();
  cutEdge(c, x - w / 2, top, w, bot - top);
  // the pierced S-curve (tanh), as a light slot through the slab
  c.strokeStyle = P.haze;
  c.lineWidth = 4.6;
  c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i <= 24; i++) {
    const u = (i / 24) * 2 - 1;
    const px = x + u * (w / 2 - 6);
    const py = y0 - Math.tanh(u * 2.6) * A * 0.95;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.stroke();
  // a cap
  c.fillStyle = INK;
  c.fillRect(x - w / 2 - 5, top - 6, w + 10, 7);
  c.restore();
}

/** the weir: a cut-paper wall from the bed up to the lip (at zero), rising in */
export function weirLip(c: C, x: number, y0: number, rise: number, kink = 0): void {
  if (rise <= 0.003) return;
  const A = LANE.A;
  const bed = y0 + A * 1.35 + 8;
  const lip = y0 + (1 - rise) * (A * 1.35);
  c.save();
  c.save();
  paperLift(c);
  c.fillStyle = INK;
  c.beginPath();
  c.moveTo(x - 20, bed);
  c.lineTo(x - 20, lip + 10);
  c.quadraticCurveTo(x - 18, lip, x - 6, lip);
  c.lineTo(x + 4, lip);
  c.quadraticCurveTo(x + 16, lip + 3, x + 22, lip + 14);
  c.lineTo(x + 26, bed);
  c.closePath();
  c.fill();
  c.restore();
  // the cut edge catching the plate lamp: a 2 px lighter line along the lip and the upstream face
  c.strokeStyle = withAlpha(mixLab(P.haze, P.halo, 0.4), 0.55);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - 19, bed - 4);
  c.lineTo(x - 19, lip + 10);
  c.quadraticCurveTo(x - 17, lip + 1, x - 6, lip + 1);
  c.lineTo(x + 4, lip + 1);
  c.quadraticCurveTo(x + 15, lip + 4, x + 20, lip + 14);
  c.stroke();
  // the rectifier's kink, max(0, x), pierced through the weir's face as a light slot (as the S on the old gate)
  if (kink > 0.003) {
    const zy = lip + 64;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const u = (i / 24) * 2 - 1;
      pts.push([x + 3 + u * 16, zy - Math.max(0, u) * 50]);
    }
    const n = Math.max(1, Math.round(24 * kink));
    c.strokeStyle = P.haze;
    c.lineWidth = 4.6;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      if (i === 0) c.moveTo(pts[i][0], pts[i][1]);
      else c.lineTo(pts[i][0], pts[i][1]);
    }
    c.stroke();
  } else {
    // stone courses (cut-lines in the paper's light) until the kink is cut
    c.strokeStyle = withAlpha(P.haze, 0.5);
    c.lineWidth = 1;
    c.beginPath();
    for (let yy = lip + 18; yy < bed - 4; yy += 14) {
      c.moveTo(x - 18, yy);
      c.lineTo(x + 22, yy);
    }
    c.stroke();
  }
  c.restore();
}

/** a small faint plot: 'tanh' (S-curve) or 'relu' (the kinked line), with axes */
export function plotGlyph(c: C, kind: 'tanh' | 'relu', x: number, y: number, w: number, h: number, a: number, draw = 1): void {
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = withAlpha(INK, 0.5);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - w / 2, y);
  c.lineTo(x + w / 2, y);
  c.moveTo(x, y - h / 2);
  c.lineTo(x, y + h / 2);
  c.stroke();
  c.strokeStyle = INK;
  c.lineWidth = 2.2;
  c.beginPath();
  const n = 40;
  for (let i = 0; i <= Math.round(n * draw); i++) {
    const u = (i / n) * 2 - 1;
    const v = kind === 'tanh' ? Math.tanh(u * 2.4) * 0.8 : Math.max(0, u) * 0.95;
    const px = x + (u * w) / 2;
    const py = y - (v * h) / 2;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.stroke();
  c.restore();
}

/** a folded paper boat sitting on a surface at (x, y) */
export function paperBoat(c: C, x: number, y: number, s: number, a: number, tone: string, lean = 0): void {
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.rotate(lean);
  c.scale(s, s);
  paperLift(c);
  c.fillStyle = tone;
  c.beginPath();
  c.moveTo(-22, -6);
  c.lineTo(22, -6);
  c.lineTo(14, 4);
  c.lineTo(-14, 4);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-12, -6);
  c.lineTo(0, -28);
  c.lineTo(12, -6);
  c.closePath();
  c.fill();
  // folds (light cut-lines)
  c.shadowColor = 'transparent';
  c.strokeStyle = withAlpha(P.haze, 0.7);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(0, -28);
  c.lineTo(0, -6);
  c.moveTo(-22, -6);
  c.lineTo(-6, 4);
  c.moveTo(22, -6);
  c.lineTo(6, 4);
  c.stroke();
  c.restore();
}

/** the backward messenger on paper: an ink bead in a ring of gold (k = how much tug it still carries) */
export function plateBead(c: C, x: number, y: number, r: number, k: number, a = 1): void {
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha *= a;
  // the ring of light: a gold halo and ring whose size and strength carry the tug
  const R = r * (1.2 + 1.6 * k);
  const g = c.createRadialGradient(x, y, r * 0.6, x, y, R * 1.9);
  g.addColorStop(0, withAlpha(P.halo, 0.85 * k));
  g.addColorStop(0.5, withAlpha(P.halo, 0.35 * k));
  g.addColorStop(1, withAlpha(P.halo, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, R * 1.9, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(P.halo, '#b07a1e', 0.5), 0.25 + 0.75 * k);
  c.lineWidth = 1 + 2.2 * k;
  c.beginPath();
  c.arc(x, y, R, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = INK;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** a pennant on a post (raised = 0..1 the flag dips as a boat crosses) */
export function finishFlag(c: C, x: number, y: number, a: number, wave = 0): void {
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha *= a;
  c.save();
  paperLift(c, 0.8);
  c.fillStyle = INK;
  c.fillRect(x - 1.2, y - 52, 2.4, 52);
  c.beginPath();
  c.moveTo(x + 1, y - 52);
  c.quadraticCurveTo(x + 14, y - 47 + wave * 3, x + 26, y - 44);
  c.quadraticCurveTo(x + 14, y - 40 - wave * 3, x + 1, y - 36);
  c.closePath();
  c.fill();
  c.restore();
  // a chequer line across the stream (the finish)
  c.setLineDash([4, 4]);
  c.strokeStyle = withAlpha(INK, 0.5);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x, y - 30);
  c.lineTo(x, y + 90);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}

/** a 2 px lighter cut edge along the top and the lamp-side (left) of a cut-paper slab */
export function cutEdge(c: C, x: number, y: number, w: number, h: number): void {
  c.save();
  c.strokeStyle = withAlpha(mixLab(P.haze, P.halo, 0.4), 0.5);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x + 1, y + h - 2);
  c.lineTo(x + 1, y + 1);
  c.lineTo(x + w - 1, y + 1);
  c.stroke();
  c.restore();
}

/** a boat's wake as cut paper: three little curls peeling back off the stern, lifted off the plate.
 *  k = 0..1 strength (0 when the boat is stopped), speed = relative length of the wake */
export function wakeCurls(c: C, x: number, y: number, s: number, k: number, t: number, speed = 1): void {
  if (k <= 0.01) return;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.globalAlpha *= k;
  const paper = mixLab(P.haze, '#ffffff', 0.25);
  for (let i = 0; i < 3; i++) {
    const ph = (t * 2.2 * (0.6 + speed) + i / 3) % 1; // each curl peels away from the stern and fades
    const dx = -18 - (10 + 34 * speed) * (i / 3 + ph / 3);
    const r = (6 + 5 * speed) * (0.7 + 0.5 * ph);
    const a = (1 - ph) * (0.9 - i * 0.2);
    if (a <= 0.02) continue;
    c.save();
    c.globalAlpha *= a;
    paperLift(c, 0.8);
    c.fillStyle = paper;
    // a curl: a crescent of paper, rolled back on itself
    c.beginPath();
    c.arc(dx, 1, r, Math.PI * 0.95, Math.PI * 2.05);
    c.arc(dx + r * 0.35, 1, r * 0.62, Math.PI * 2.05, Math.PI * 0.95, true);
    c.closePath();
    c.fill();
    c.restore();
    c.strokeStyle = withAlpha(INK, 0.8 * a);
    c.lineWidth = 1.3;
    c.beginPath();
    c.arc(dx, 1, r, Math.PI * 0.95, Math.PI * 2.05);
    c.stroke();
  }
  c.restore();
}
