/**
 * neural-net-history — ch11-s08's figures at the rim of the scaling candle's light (paper cut-outs, L4):
 *   islands(c, env, o)        two small islands on the stage floor, an undersea telegraph cable drawn between them;
 *                             a tiny figure with a telegraph key on each; dot-dash pulses travel the cable
 *   octopus(c, env, o)        an octopus cut-out coiled round the cable, one arm tapping (on twos)
 *   bear(c, env, o)           a bear rising on the left island's beach (on twos)
 *   parrot(c, env, o)         a parrot on a T-perch above a strung line of type slugs that reshuffle (on twos)
 *   accountCard(c, env, o)    one of two equal plain cards (Gebru's departure: both accounts)
 */
import type { PaintEnv } from '../../../film';
import { hash1, mixLab, withAlpha } from '../../../film';
import { FONT } from '../../../film/silhouette/type';
import { MFONT, drawSlug } from '../../../film';

type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);

export const ISLES = { a: { x: 1090, y: 676 }, b: { x: 1420, y: 676 } } as const;
/** a point along the cable, u 0 (island a) → 1 (island b) */
export function cableAt(u: number) {
  const a = ISLES.a, b = ISLES.b;
  const x = a.x + 34 + (b.x - a.x - 68) * u;
  const y = a.y + 18 + 16 * Math.sin(Math.PI * u) + 3 * Math.sin(u * 9);
  return { x, y };
}

export interface IslandsDraw {
  t: number;
  tq: number;
  /** 0..1 pulse activity (both ways); pulses from the octopus copy the island's pattern */
  talk: number;
  /** after the bear: island a sends fast; the octopus sends nothing useful */
  alarm: number;
  light: number;
  /** shot time at which the octopus's half stalls (its reply scrambles) */
  stallAt?: number;
}
function isle(c: C, env: PaintEnv, x: number, y: number, flip: number, seed: number) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  // a low mound on the floor (seen nearly edge-on) and a beach lip
  c.beginPath();
  c.ellipse(x, y + 6, 58, 13, 0, Math.PI, 0);
  c.fill();
  c.beginPath();
  c.moveTo(x - 40, y + 2);
  c.quadraticCurveTo(x - 10, y - 26, x + 22, y - 2);
  c.closePath();
  c.fill();
  // a palm: a curved trunk and five fronds
  c.strokeStyle = ink;
  c.lineWidth = 3;
  c.lineCap = 'round';
  const tx = x - 6 * flip, ty = y - 8;
  const topX = tx + 14 * flip, topY = ty - 54;
  c.beginPath();
  c.moveTo(tx, ty);
  c.quadraticCurveTo(tx + 2 * flip, ty - 30, topX, topY);
  c.stroke();
  c.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.62 + 0.1 * hash1(i, seed);
    c.beginPath();
    c.moveTo(topX, topY);
    c.quadraticCurveTo(topX + Math.cos(a) * 16, topY + Math.sin(a) * 16 - 4, topX + Math.cos(a) * 26, topY + Math.sin(a) * 22 + 6);
    c.stroke();
  }
  // a tiny figure at a telegraph key
  const fx = x + 18 * flip, fy = y - 4;
  c.beginPath();
  c.arc(fx, fy - 21, 3.4, 0, Math.PI * 2);
  c.fill();
  c.fillRect(fx - 2.6, fy - 17, 5.2, 12);
  c.fillRect(fx - 2.2, fy - 6, 1.8, 7);
  c.fillRect(fx + 0.4, fy - 6, 1.8, 7);
  c.fillRect(fx + 6 * flip - 3, fy - 4, 7, 3);
}

export function islands(c: C, env: PaintEnv, o: IslandsDraw) {
  const m = env.mood;
  // the sea between them: a flat paper strip with a few cut wave lines
  const sx = (ISLES.a.x + ISLES.b.x) / 2, sy = ISLES.a.y + 22;
  const sg = c.createLinearGradient(0, sy - 34, 0, sy + 34);
  sg.addColorStop(0, mixLab(m.setHaze, m.halo, 0.45 * o.light));
  sg.addColorStop(1, mixLab(m.set, m.setHaze, 0.5));
  c.fillStyle = sg;
  c.beginPath();
  c.ellipse(sx, sy, (ISLES.b.x - ISLES.a.x) / 2 + 90, 34, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(m.fg, 0.35);
  c.lineWidth = 0.8;
  for (let i = 0; i < 7; i++) {
    const wx = ISLES.a.x + 30 + i * 46 + 8 * Math.sin(o.t * 0.7 + i), wy = ISLES.a.y + 8 + (i % 3) * 9;
    c.beginPath();
    c.moveTo(wx, wy);
    c.quadraticCurveTo(wx + 6, wy - 3, wx + 12, wy);
    c.quadraticCurveTo(wx + 18, wy + 3, wx + 24, wy);
    c.stroke();
  }
  isle(c, env, ISLES.a.x, ISLES.a.y, 1, 3);
  isle(c, env, ISLES.b.x, ISLES.b.y, -1, 5);
  // the cable: a dark line across the floor between the two islands
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 2.2;
  c.beginPath();
  for (let i = 0; i <= 40; i++) {
    const p = cableAt(i / 40);
    if (i === 0) c.moveTo(p.x, p.y);
    else c.lineTo(p.x, p.y);
  }
  c.stroke();
  c.strokeStyle = withAlpha(m.rim, 0.3 * o.light);
  c.lineWidth = 0.8;
  c.stroke();
  // pulses: dot-dash marks travelling along the cable. Island a → octopus (0 → .5), octopus → island b (.5 → 1):
  // the octopus re-sends the same pattern it heard (it copies the shape). After the bear, a's pulses run fast and
  // the octopus's side goes quiet but for a few stray dots.
  if (o.talk <= 0.01) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const pattern = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0];
  // island a keeps sending (faster once the bear is there); the octopus's half copies it perfectly until the alarm,
  // then STALLS: its last pulses freeze on the cable and dim, and one scrambled burst of dashes jitters at its arm
  const speed = 0.18 + 0.22 * o.alarm;
  const tStall = o.stallAt ?? Infinity;
  for (let k = 0; k < 14; k++) {
    const phase = (o.t * speed + k / 14) % 1;
    const dash = pattern[k % pattern.length] === 1;
    drawPulse(c, env, phase * 0.5, dash, o.talk);
    if (o.t < tStall) drawPulse(c, env, 0.5 + phase * 0.5, dash, o.talk);
    else {
      const frozen = ((tStall * 0.18 + k / 14) % 1) * 0.5 + 0.5;
      // round-1 revise: the octopus's half goes DARK (nothing useful to send), not merely dim
      const dark = Math.max(0, 1 - (o.t - tStall) / 0.5);
      if (dark > 0.01) drawPulse(c, env, frozen, dash, o.talk * dark);
    }
  }
  if (o.t >= tStall && o.t < tStall + 1.2) {
    // the scrambled reply: short dashes at odd angles, re-drawn on twos (nothing useful to send)
    const p = cableAt(0.56);
    const fr = Math.floor(o.tq * 12);
    c.fillStyle = withAlpha(env.mood.core, 0.85 * o.talk * (1 - Math.max(0, (o.t - tStall - 0.5) / 0.7)));
    for (let j = 0; j < 7; j++) {
      const a = hash1(j * 7 + fr, 41) * Math.PI;
      const r = 5 + 9 * (hash1(j + fr * 3, 43) * 0.5 + 0.5);
      c.save();
      c.translate(p.x + Math.cos(a) * r, p.y - 4 + Math.sin(a) * r * 0.5);
      c.rotate(a * 2);
      c.fillRect(-3, -0.8, 6, 1.6);
      c.restore();
    }
  }
  c.restore();
}
function drawPulse(c: C, env: PaintEnv, u: number, dash: boolean, a: number) {
  const p = cableAt(u);
  const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 5);
  g.addColorStop(0, withAlpha(env.mood.core, 0.4 * a));
  g.addColorStop(1, withAlpha(env.mood.core, 0));
  c.fillStyle = g;
  c.fillRect(p.x - 5, p.y - 5, 10, 10);
  c.fillStyle = withAlpha(env.mood.core, 0.9 * a);
  if (dash) c.fillRect(p.x - 4, p.y - 1, 8, 2);
  else c.fillRect(p.x - 1.2, p.y - 1.2, 2.4, 2.4);
}

export interface OctopusDraw {
  tq: number;
  /** 0..1 tapping (it stops, puzzled, after the bear) */
  tap: number;
  /** 0..1 the puzzled lift of the mantle */
  puzzled: number;
}
export function octopus(c: C, env: PaintEnv, o: OctopusDraw) {
  const p = cableAt(0.5);
  const ink = env.fill('ink');
  c.save();
  c.translate(p.x, p.y);
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  // eight arms: they spread from under the mantle, wrap the cable (which passes through them) and curl at the tips
  for (let i = 0; i < 8; i++) {
    const s = i < 4 ? -1 : 1;
    const k = i % 4;
    const spread = (6 + k * 7) * s;
    c.lineWidth = 3.6 - k * 0.5;
    c.beginPath();
    c.moveTo(s * 2, -12);
    c.bezierCurveTo(spread * 0.4, -2, spread * 0.9, 4 + k, spread, 2 - k * 1.5);
    c.quadraticCurveTo(spread + s * 5, -4 - k, spread + s * 1, -7 - k);
    c.stroke();
  }
  // the tapping arm reaches to the cable and taps it (on twos)
  const beat = Math.floor(o.tq * 6) % 2;
  const lift = o.tap * (beat ? 7 : 0);
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(6, -14);
  c.quadraticCurveTo(22, -26 - lift, 26, -2 - lift * 0.4);
  c.stroke();
  // the mantle: a rounded bulb leaning back, tilted when puzzled
  c.save();
  c.translate(0, -16);
  c.rotate(-0.35 + 0.35 * o.puzzled);
  c.beginPath();
  c.moveTo(-9, 2);
  c.bezierCurveTo(-16, -10, -14, -34, 0, -36);
  c.bezierCurveTo(14, -34, 16, -10, 9, 2);
  c.closePath();
  c.fill();
  // the eye (a hole showing the light behind: the one eye-glint of the chapter, a moment of not knowing)
  c.fillStyle = withAlpha(env.mood.rim, 0.55 + 0.35 * o.puzzled);
  c.beginPath();
  c.arc(5, -6, 1.8, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.restore();
}

/** a bear standing up on the left island's beach: ears, a long snout, forepaws raised (it rises on twos) */
export function bear(c: C, env: PaintEnv, rise: number) {
  if (rise <= 0.01) return;
  const x = ISLES.a.x - 26, y = ISLES.a.y - 2;
  c.save();
  c.translate(x, y + 40 * (1 - rise));
  c.globalAlpha *= Math.min(1, rise * 2);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  // hind legs planted, a heavy body standing upright, head turned toward the cable (right)
  c.moveTo(-12, 0);
  c.lineTo(-13, -14);
  c.quadraticCurveTo(-19, -30, -15, -46); // rump and back
  c.quadraticCurveTo(-12, -60, -4, -64); // shoulder
  c.lineTo(-3, -70); // nape
  c.quadraticCurveTo(0, -76, 6, -76); // crown
  c.lineTo(9, -75);
  c.lineTo(17, -71); // snout
  c.lineTo(18, -67);
  c.lineTo(8, -65); // jaw
  c.quadraticCurveTo(8, -58, 10, -54); // chest
  c.quadraticCurveTo(12, -40, 9, -24); // belly
  c.quadraticCurveTo(8, -12, 7, 0);
  c.lineTo(1, 0);
  c.lineTo(-1, -12);
  c.lineTo(-5, -12);
  c.lineTo(-6, 0);
  c.closePath();
  c.fill();
  // ears
  c.beginPath();
  c.arc(-1, -76, 2.8, 0, Math.PI * 2);
  c.arc(4, -78, 2.6, 0, Math.PI * 2);
  c.fill();
  // forepaws raised (two short arms reaching up and forward, claws)
  c.lineCap = 'round';
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 4.2;
  for (const [ax, ay, bx, by] of [[4, -56, 15, -64], [2, -50, 16, -54]] as const) {
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(bx, by);
    c.stroke();
    c.lineWidth = 1;
    for (let k = -1; k <= 1; k++) {
      c.beginPath();
      c.moveTo(bx + 1, by + k * 1.4);
      c.lineTo(bx + 4, by + k * 1.8 - 1);
      c.stroke();
    }
    c.lineWidth = 4.2;
  }
  c.strokeStyle = withAlpha(env.mood.rim, 0.45);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-14, -44);
  c.quadraticCurveTo(-11, -60, -3, -65);
  c.stroke();
  c.restore();
}

export interface ParrotDraw {
  x: number;
  y: number;
  tq: number;
  /** 0..1 how active (repeating) */
  talk: number;
  light: number;
  /** draw the slug row under the perch (default true; false when the shot strings it on its own plane) */
  slugs?: boolean;
}
const SLUG_ORDER = [
  [0, 1, 2, 3, 4],
  [3, 0, 4, 1, 2],
  [1, 4, 0, 2, 3],
  [2, 3, 1, 4, 0],
  [4, 2, 3, 0, 1],
  [0, 4, 1, 3, 2],
];
export function parrot(c: C, env: PaintEnv, o: ParrotDraw) {
  const ink = env.fill('ink');
  const m = env.mood;
  const { x, y } = o;
  c.fillStyle = ink;
  // the T-perch on a stand
  c.fillRect(x - 3, y, 6, 640 - y);
  c.fillRect(x - 26, y - 3, 52, 6);
  c.fillRect(x - 22, 634, 44, 6);
  // the parrot facing right: body, long tail, head with a hooked beak; head bobs with each repetition
  const step = Math.floor(o.tq * 2.2);
  const bob = o.talk * (step % 2 ? 3 : 0);
  c.beginPath();
  c.moveTo(x - 4, y - 2);
  c.quadraticCurveTo(x - 22, y + 30, x - 30, y + 54); // tail
  c.lineTo(x - 22, y + 54);
  c.quadraticCurveTo(x - 8, y + 26, x + 4, y - 2);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(x + 2, y - 18, 11, 18, 0.25, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.translate(x + 8, y - 36 + bob);
  c.beginPath();
  c.arc(0, 0, 9, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(7, -3);
  c.quadraticCurveTo(17, -2, 14, 8);
  c.lineTo(9, 3);
  c.closePath();
  c.fill();
  c.restore();
  // feet gripping the perch
  c.fillRect(x - 2, y - 4, 3, 4);
  c.fillRect(x + 4, y - 4, 3, 4);
  c.strokeStyle = withAlpha(m.rim, 0.35 * o.light);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - 6, y - 10);
  c.quadraticCurveTo(x - 2, y - 24, x + 6, y - 30);
  c.stroke();
  if (o.slugs === false) return;
  // the line of type slugs strung below the perch (when not drawn on their own plane: see parrotSlugs)
  parrotSlugs(c, env, { x: x + 30, y: y + 44, tq: o.tq, talk: o.talk, from: x + 22 });
}

export interface ParrotSlugsDraw {
  /** left end of the row (or its centre with align 'center') and the slugs' top (world px of the plane drawn on) */
  x: number;
  y: number;
  tq: number;
  talk: number;
  align?: 'left' | 'center';
  /** where the string starts (default: the row's left end) */
  from?: number;
  /** slug font size (default 15) */
  size?: number;
}
/** the slugs the parrot repeats: the same cast type as the composing stick in ch11-s03, reshuffled every 0.5 s (on
 *  twos), strung on a thread. Returns the row's width. */
export function parrotSlugs(c: C, env: PaintEnv, o: ParrotSlugsDraw): number {
  const ink = env.fill('ink');
  const ord = SLUG_ORDER[Math.floor(o.tq / 0.5) % SLUG_ORDER.length];
  const size = o.size ?? 15, sh = size * 2, gap = size * 0.27;
  c.save();
  c.font = `500 ${size}px ${SERIF}`;
  const ws = PARROT_WORDS.map((w) => c.measureText(w).width + size * 0.8);
  c.restore();
  const total = ord.reduce((a, i) => a + ws[i] + gap, 0) - gap;
  const x0 = o.align === 'center' ? o.x - total / 2 : o.x;
  const y0 = o.y;
  c.strokeStyle = withAlpha(ink, 0.9);
  c.lineWidth = Math.max(1, size / 15);
  c.beginPath();
  c.moveTo(o.from ?? x0 - 8, y0 - sh * 0.2);
  c.lineTo(x0 + total + 6, y0 - sh * 0.2);
  c.stroke();
  let sx = x0;
  for (const i of ord) {
    drawSlug(c, sx, y0, ws[i], sh, ' ' + PARROT_WORDS[i], size, 0.35 + 0.45 * o.talk, env);
    sx += ws[i] + gap;
  }
  return total;
}
/** words from the composing stick in ch11-s03 ('The animal didn't cross the street because it was too…') */
const PARROT_WORDS = ['street', 'the', 'too', 'animal', 'because'];
const SERIF = MFONT.serif;

export interface AccountCardDraw {
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  rise: number;
  light: number;
  /** font size (world px) */
  size?: number;
}
export function accountCard(c: C, env: PaintEnv, o: AccountCardDraw) {
  if (o.rise <= 0.01) return;
  const m = env.mood;
  const y = o.y + (1 - o.rise) * 30;
  c.save();
  c.globalAlpha *= clamp01(o.rise * 1.4);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(o.x - o.w / 2 + 3, y - o.h / 2 + 4, o.w, o.h);
  c.fillStyle = mixLab(mixLab('#e9e2d0', m.set, 0.45), mixLab('#f2ebdc', m.halo, 0.2), Math.min(1, 0.3 + o.light));
  c.fillRect(o.x - o.w / 2, y - o.h / 2, o.w, o.h);
  c.fillStyle = '#1d1a20';
  const fs = o.size ?? 15;
  c.font = `500 ${fs}px ${FONT.mono}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const lh = fs * 1.34;
  o.lines.forEach((l, i) => c.fillText(l, o.x, y + (i - (o.lines.length - 1) / 2) * lh));
  c.restore();
}
