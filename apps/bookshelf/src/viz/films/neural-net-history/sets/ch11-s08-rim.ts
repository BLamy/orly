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
import { hash1, mixLab, paperTexture, withAlpha } from '../../../film';
import { FONT } from '../../../film/silhouette/type';
import { MFONT, drawSlug } from '../../../film';

type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);

export const ISLES = { a: { x: 1090, y: 676 }, b: { x: 1420, y: 676 } } as const;
/** round-2 revise: the cable LANDS on both islands, at each telegraph key (beside the tiny operator), runs down the
 *  beach into the sea and sags across the floor between them */
const KEY_A = { x: ISLES.a.x + 25, y: ISLES.a.y - 3 };
const KEY_B = { x: ISLES.b.x - 25, y: ISLES.b.y - 3 };
/** a point along the cable, u 0 (island a's key) → 1 (island b's key) */
export function cableAt(u: number) {
  const x = KEY_A.x + (KEY_B.x - KEY_A.x) * u;
  const s = Math.sin(Math.PI * u);
  const y = KEY_A.y + 37 * Math.pow(s, 0.55) + 2.5 * Math.sin(u * 9) * s;
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
  /** shot time the bear rises (round-3 review): from here the islander's half of the cable (island a → octopus) flashes
   *  a fast, IRREGULAR pulse (the alarm), while the octopus's half (octopus → island b) answers with the SAME regular
   *  dash pattern it was copying before (the shape without the meaning) until `replyUntil`, then goes dark */
  stallAt?: number;
  /** shot time the octopus's regular reply stops (default stallAt + 1.6) */
  replyUntil?: number;
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
  c.strokeStyle = withAlpha(m.rim, 0.45 * o.light);
  c.lineWidth = 0.8;
  c.stroke();
  // where it comes ashore, a small clamp at each key so the landing reads
  c.fillStyle = env.fill('ink');
  for (const k of [KEY_A, KEY_B]) c.fillRect(k.x - 2.5, k.y - 2.5, 5, 4);
  // pulses: dot-dash marks travelling along the cable. Island a → octopus (0 → .5), octopus → island b (.5 → 1):
  // the octopus re-sends the same pattern it heard (it copies the shape perfectly). Round-3 review: when the bear
  // rises, the islander's half flashes the ALARM (fast, irregular), and the octopus's half keeps answering with the
  // same regular pattern as before (shape without meaning), then goes dark. No text.
  if (o.talk <= 0.01) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const pattern = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0];
  const speed = 0.18;
  const tStall = o.stallAt ?? Infinity;
  const tReply = o.replyUntil ?? tStall + 1.6;
  // the islander's half: regular until the bear; then the regular marks clear off within 0.15 s as the alarm takes over
  const calm = o.t < tStall ? 1 : 1 - clamp01((o.t - tStall) / 0.15);
  // the octopus's half: the same regular pattern, on and on, until it simply stops (dark over 0.35 s)
  const reply = 1 - clamp01((o.t - tReply) / 0.35);
  for (let k = 0; k < 14; k++) {
    const phase = (o.t * speed + k / 14) % 1;
    const dash = pattern[k % pattern.length] === 1;
    if (calm > 0.01) drawPulse(c, env, phase * 0.5, dash, o.talk * calm);
    if (reply > 0.01) drawPulse(c, env, 0.5 + phase * 0.5, dash, o.talk * reply);
  }
  if (o.t >= tStall) {
    // the alarm: fast, uneven, bright marks racing from the islander's key toward the octopus (on twos)
    const tq = Math.floor(o.t * 12) / 12;
    const up = clamp01((o.t - tStall) / 0.12);
    for (let k = 0; k < 11; k++) {
      const ph = (tq * (0.95 + 0.35 * (0.5 + 0.5 * hash1(k, 81))) + 0.37 * (0.5 + 0.5 * hash1(k, 82)) + k * 0.083) % 1;
      const dash = hash1(k * 7 + Math.floor(tq * 4), 83) > 0.1;
      const flick = 0.65 + 0.35 * (0.5 + 0.5 * hash1(k + Math.floor(tq * 12) * 13, 84));
      drawPulse(c, env, ph * 0.5, dash, o.talk * up * flick * 1.25, 1.45);
    }
  }
  c.restore();
}
function drawPulse(c: C, env: PaintEnv, u: number, dash: boolean, a: number, k = 1) {
  const p = cableAt(u);
  const R = 5 * k;
  const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
  g.addColorStop(0, withAlpha(env.mood.core, Math.min(1, 0.4 * a)));
  g.addColorStop(1, withAlpha(env.mood.core, 0));
  c.fillStyle = g;
  c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
  c.fillStyle = withAlpha(env.mood.core, Math.min(1, 0.9 * a));
  // (the alarm's marks are uneven in length as well as in spacing)
  if (dash) c.fillRect(p.x - 4 * k, p.y - k, 8 * k * (k > 1 ? 0.6 + 0.8 * Math.abs(Math.sin(u * 97)) : 1), 2 * k);
  else c.fillRect(p.x - 1.2 * k, p.y - 1.2 * k, 2.4 * k, 2.4 * k);
}

export interface OctopusDraw {
  tq: number;
  /** 0..1 tapping (it stops, puzzled, after the bear) */
  tap: number;
  /** 0..1 the puzzled tilt of the mantle (≈10°) */
  puzzled: number;
  /** 0..1 the tapping arm lifted and held still over the cable (it has nothing to send) */
  hover?: number;
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
  const lift = o.tap * (beat ? 7 : 0) + (o.hover ?? 0) * 9;
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(6, -14);
  c.quadraticCurveTo(22, -26 - lift, 26, -2 - lift * 0.4);
  c.stroke();
  // the mantle: a rounded bulb leaning back, tilted when puzzled
  c.save();
  c.translate(0, -16);
  c.rotate(-0.35 + 0.175 * o.puzzled);
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

/**
 * Round-2 revise: a BEAR, unmistakably: reared up on the left island's beach, broad and heavy (≈1.6× the first cut's
 * body, ≈1.3× its height), a shoulder hump behind the neck, a broad head with short round ears set low and a blunt
 * muzzle, forelegs spread wide with claws. It rises on twos.
 */
export interface BearDraw {
  /** where it stands (diorama px) and its size (1 = the first cut, ≈110 px tall) */
  x?: number;
  y?: number;
  s?: number;
  /** 1 faces right (toward the cable), -1 faces left */
  facing?: 1 | -1;
}
/** round-3 review: default placement is SMALL (≈1.15× the tiny islander), standing on the left island's beach just
 *  beyond the islander, facing him (it had been taller than Bender and merged with her silhouette) */
export const BEAR_AT = { x: ISLES.a.x + 44, y: ISLES.a.y - 6, s: 0.26, facing: -1 as const };
export function bear(c: C, env: PaintEnv, rise: number, o: BearDraw = BEAR_AT) {
  if (rise <= 0.01) return;
  const x = o.x ?? BEAR_AT.x, y = o.y ?? BEAR_AT.y, s = o.s ?? BEAR_AT.s, facing = o.facing ?? BEAR_AT.facing;
  c.save();
  c.translate(x, y + 50 * s * (1 - rise));
  c.scale(s * facing, s);
  c.globalAlpha *= Math.min(1, rise * 2);
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.beginPath();
  // hind legs: thick, short, planted wide (pads flat on the sand)
  c.moveTo(-30, 0);
  c.lineTo(-29, -10);
  c.quadraticCurveTo(-36, -30, -33, -50); // haunch and rump
  c.quadraticCurveTo(-30, -72, -22, -84); // back rising to the hump
  c.quadraticCurveTo(-17, -97, -6, -97); // the shoulder hump
  c.quadraticCurveTo(-2, -97, 0, -95); // nape dips
  c.quadraticCurveTo(1, -108, 11, -108); // crown of the broad, round head
  c.quadraticCurveTo(20, -108, 23, -101); // brow
  c.lineTo(28, -99); // the muzzle: short, deep and blunt
  c.quadraticCurveTo(33, -98, 33, -93); // the nose, square-ish
  c.quadraticCurveTo(33, -87, 26, -86);
  c.quadraticCurveTo(20, -84, 17, -81); // heavy jaw
  c.quadraticCurveTo(22, -70, 20, -56); // throat and chest
  c.quadraticCurveTo(22, -36, 14, -22); // the big belly
  c.quadraticCurveTo(12, -12, 14, 0); // front of the near hind leg
  c.lineTo(-1, 0);
  c.lineTo(-3, -13);
  c.lineTo(-11, -13);
  c.lineTo(-13, 0);
  c.closePath();
  c.fill();
  // ears: short and round, set low on the back of the head
  c.beginPath();
  c.arc(1, -105, 4.6, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(10, -108, 4.4, 0, Math.PI * 2);
  c.fill();
  // forelegs spread wide: one reaching forward toward the cable, one back and up; thick, with claws
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = ink;
  for (const [ax, ay, ex, ey, px, py] of [
    [10, -78, 30, -74, 44, -84],
    [-14, -82, -36, -90, -46, -104],
  ] as const) {
    c.lineWidth = 11;
    c.beginPath();
    c.moveTo(ax, ay);
    c.quadraticCurveTo(ex, ey, px, py);
    c.stroke();
    c.lineWidth = 1.6;
    const dx = Math.sign(px - ax);
    for (let k = -1; k <= 1; k++) {
      c.beginPath();
      c.moveTo(px + dx * 4, py + k * 3);
      c.lineTo(px + dx * 9, py + k * 3.6 - 2);
      c.stroke();
    }
  }
  // the lit edge along the hump and back, toward the candle
  c.strokeStyle = withAlpha(env.mood.rim, 0.5);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-34, -46);
  c.quadraticCurveTo(-30, -72, -22, -84);
  c.quadraticCurveTo(-17, -97, -6, -97);
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
/** round-2 revise: a paper prop in the world, not a slide: paper grain, a pin at its top, the candle's light falling
 *  off across it (lit edge toward the flame, the far corner in shadow), and its peak a step below white. Both cards
 *  get exactly the same treatment. */
export function accountCard(c: C, env: PaintEnv, o: AccountCardDraw) {
  if (o.rise <= 0.01) return;
  const m = env.mood;
  const y = o.y + (1 - o.rise) * 30;
  const x0 = o.x - o.w / 2, y0 = y - o.h / 2;
  c.save();
  c.globalAlpha *= clamp01(o.rise * 1.4);
  c.fillStyle = withAlpha(m.fg, 0.45);
  c.fillRect(x0 + 4, y0 + 5, o.w, o.h);
  c.fillStyle = mixLab(mixLab('#d8cfbc', m.set, 0.5), mixLab('#e2d6c0', m.halo, 0.28), Math.min(1, 0.25 + o.light));
  c.fillRect(x0, y0, o.w, o.h);
  paperTexture(c, { x: x0, y: y0, w: o.w, h: o.h }, { alpha: 0.6, offset: { x: o.x * 2, y: 0 } });
  // the light falls off across the card, away from the flame (upper left lit, lower right in shadow)
  const fo = c.createLinearGradient(x0, y0, x0 + o.w, y0 + o.h);
  fo.addColorStop(0, withAlpha(m.fg, 0));
  fo.addColorStop(0.55, withAlpha(m.fg, 0.12));
  fo.addColorStop(1, withAlpha(m.fg, 0.38));
  c.fillStyle = fo;
  c.fillRect(x0, y0, o.w, o.h);
  // the pin
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.beginPath();
  c.arc(o.x, y0 + 7, 3.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(m.rim, 0.6);
  c.beginPath();
  c.arc(o.x - 1, y0 + 6, 1.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#1d1a20';
  const fs = o.size ?? 15;
  c.font = `500 ${fs}px ${FONT.mono}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const lh = fs * 1.34;
  o.lines.forEach((l, i) => c.fillText(l, o.x, y + 4 + (i - (o.lines.length - 1) / 2) * lh));
  c.restore();
}
