/**
 * neural-net-history — THE LEADERBOARD OF LANTERNS in the Florence hall's dark (ch08-s12, ch08-s13; the
 * 2013 ghost in ch08-s13b). One animator's group: these helpers are shared by those three shots only.
 *
 * The board: paper lanterns hung on strings from a dark batten; each lantern's HEIGHT is a team's ILSVRC-2012
 * top-5 test error on a ruled pole (lower is better). The ruled pole hangs between the runner-up and the
 * lantern that falls.
 *
 *   LB                        geometry (L4 world px at CAMERA3_HOME)
 *   yOf(err)                  the ruler: error % → world y
 *   hallDark(f, { key, cams, glow })        backlight + L2 arcade wall (arches as holes) + fog A
 *   batten(c, env, cams)                    the beam the lanterns hang from
 *   rulerPole(c, env, o)                    the ruled pole; ticks every 1 %, numbers every 5 %, extra marks
 *   hungLantern(c, env, o)                  string from the batten + paperLantern, with sway on twos
 *   lanternTag(c, env, o)                   a small paper tag on a thread (SuperVision · Toronto, IDSIA…)
 *   bracketRule(c, env, o)                  the ruled bracket measuring a gap
 *   cathedralLantern(c, env, o)             a little gothic-cathedral-shaped lantern (the 2013 ghost board)
 *   audienceHeads(c, env, o)                heads and shoulders along the bottom of frame (L5), leaning on cue
 *
 * The entries' heights: ILSVRC-2012 classification, top-5 test error. Only 26.2 (second place) and 15.3
 * (SuperVision, Toronto) are named on screen; the others are unlabelled lanterns in the script's "about 26 to
 * 34 %" band.
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { arcade } from '../../../film/silhouette/architecture';
import { glow, paperLantern } from '../../../film/silhouette/metaphors/kit';
import { godRays, windowBeam } from '../../../film/silhouette/atmosphere';

type C = CanvasRenderingContext2D;

export const LB = {
  battenY: 30,
  rulerX: 838,
  /** error % at the top and the bottom of the ruled pole */
  top: 36,
  bottom: 12,
  /** px per percentage point */
  k: 24,
  y0: 110,
  /** lantern half-height */
  r: 27,
  /** the runner-up and the lantern that falls */
  runnerX: 742,
  alexX: 936,
  /** the falling lantern's furled height before its result is posted (above the ruler's top) */
  alexFurled: 74,
  /** where the lantern that falls hangs AMONG the others before 'fifteen' (nearly one height) */
  alexStartErr: 29.0,
  /** the other entries: a tight row in the 26-34 % band, close to the pole (unlabelled, illustrative heights) */
  others: [
    { x: 390, err: 33.6 },
    { x: 478, err: 29.6 },
    { x: 566, err: 31.4 },
    { x: 654, err: 28.0 },
  ],
  runnerErr: 26.2,
  alexErr: 15.3,
} as const;

export const yOf = (err: number) => LB.y0 + (LB.top - err) * LB.k;
/** the lantern body centre for a given error (the ruler reads the lantern's centre) */
export const lanternY = (err: number) => yOf(err);

const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);

// ------------------------------------------------------------------------------------------- the hall
export interface HallDarkOpts {
  key: string;
  cams: Camera3[];
  /** 0..1 the warm late light through the arches */
  glow?: number;
  /** 0..1 how dark the hall is beyond the arches (the lanterns are the light) */
  dark?: number;
  /** fog sheet alpha (default 0.22) */
  fog?: number;
  /** the arches are tall WINDOWS (sills at y 470, mullions and transoms) with soft rays falling into the hall */
  windows?: boolean;
}
/** window bays of the hall's arcade: centres at 150 + 300·i, opening half-width 87, head at 163, sill at 470 */
export const HALL_WIN = { pitch: 300, x0: 150, half: 87, top: 163, spring: 250, sill: 470 } as const;
/** the Florence hall's dark: low backlight, an arcade wall whose arches are holes, fog */
export function hallDark(f: Frame, o: HallDarkOpts) {
  const g = o.glow ?? 1;
  f.backlight({ sunX: 760, sunY: 430, sunRadius: 640, intensity: 0.42 * g });
  const dk = o.dark ?? 0.72;
  if (dk > 0) {
    // the hall beyond the arches is dim: a deep veil over the backlight, thinnest low behind the board
    f.layer('L1', (c, env) => {
      const r = overscan(LAYERS.L1, o.cams, 40);
      const g2 = c.createLinearGradient(0, r.y, 0, r.y + r.h);
      const veil = mixLab(env.mood.fg, env.mood.set, 0.45);
      g2.addColorStop(0, withAlpha(veil, 0.92 * dk));
      g2.addColorStop(0.55, withAlpha(veil, 0.74 * dk));
      g2.addColorStop(1, withAlpha(veil, 0.84 * dk));
      c.fillStyle = g2;
      c.fillRect(r.x, r.y, r.w, r.h);
    });
  }
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    f.cached(`${o.key}/hall${o.windows ? 'W' : ''}/L2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      // a deep wall, and an arcade of tall round arches (holes: the hazed backlight shows through)
      const x0 = Math.floor((r.x - 200) / 300) * 300;
      const bays = Math.ceil((r.x + r.w + 200 - x0) / 300);
      arcade(cc, { x: x0, y: r.y - 10, w: bays * 300, h: r.h + 20, bays, spring: 250, floor: o.windows ? HALL_WIN.sill : 690, pier: 0.42, role: 'set', cutAlpha: 0.12 }, env);
      if (o.windows) {
        // glazing: a central mullion, two transoms, a sill ledge — the openings read as windows, not smears
        cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.3);
        for (let i = 0; i < bays; i++) {
          const cx = x0 + 300 * (i + 0.5);
          cc.fillRect(cx - 3, HALL_WIN.top, 6, HALL_WIN.sill - HALL_WIN.top);
          cc.fillRect(cx - HALL_WIN.half, 318, HALL_WIN.half * 2, 5);
          cc.fillRect(cx - HALL_WIN.half, 396, HALL_WIN.half * 2, 5);
          cc.fillRect(cx - HALL_WIN.half - 12, HALL_WIN.sill - 2, HALL_WIN.half * 2 + 24, 12);
        }
      }
      // the hall is in shadow: the wall falls off toward the top and the floor (the lanterns are the light)
      const sh = cc.createLinearGradient(0, r.y, 0, r.y + r.h);
      sh.addColorStop(0, withAlpha(env.mood.fg, 0.62));
      sh.addColorStop(0.45, withAlpha(env.mood.fg, 0.28));
      sh.addColorStop(0.7, withAlpha(env.mood.fg, 0.22));
      sh.addColorStop(1, withAlpha(env.mood.fg, 0.6));
      cc.fillStyle = sh;
      cc.fillRect(r.x, r.y, r.w, r.h);
      // a cornice band and a dado so the wall reads as architecture in the dark
      cc.fillStyle = withAlpha(env.mood.fg, 0.55);
      cc.fillRect(r.x, 40, r.w, 14);
      cc.fillRect(r.x, 690, r.w, r.y + r.h - 690);
      cc.fillStyle = withAlpha(env.mood.rim, 0.08);
      cc.fillRect(r.x, 54, r.w, 1.2);
    }, { blur: 1.5 })(c, r.x, r.y);
  });
  if (o.windows) {
    // soft rays from each window, slanting down into the hall's haze (L2 plane, screen-blended)
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, o.cams, 60);
      const beams = [];
      for (let cx = Math.floor((r.x - 300) / 300) * 300 + 150; cx < r.x + r.w + 300; cx += 300) {
        beams.push(windowBeam({ x: cx - HALL_WIN.half, y: HALL_WIN.top, w: HALL_WIN.half * 2, h: HALL_WIN.sill - HALL_WIN.top }, { x: -0.35, y: 1 }, 420, 1.25));
      }
      godRays(c, { beams, intensity: 0.2 * g, streaks: 3, mullions: 2, softness: 22, salt: 12 }, env);
    });
  }
  f.fog({ yCenter: 0.6 * 720, height: 0.46 * 720, alpha: o.fog ?? 0.22, drift: 6 });
}

// ------------------------------------------------------------------------------------------- the batten
export function batten(c: C, env: PaintEnv, x0: number, x1: number) {
  const y = LB.battenY;
  c.fillStyle = env.fill('ink');
  c.fillRect(x0, y - 9, x1 - x0, 12);
  // iron hooks every lantern slot (a row of small rings)
  c.fillStyle = withAlpha(env.mood.rim, 0.32);
  c.fillRect(x0, y + 2.4, x1 - x0, 1);
  // the hanging chains at the ends
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 2;
  for (const x of [x0 + 40, x1 - 40]) {
    c.beginPath();
    c.moveTo(x, y - 9);
    c.lineTo(x, y - 400);
    c.stroke();
  }
}

// ------------------------------------------------------------------------------------------- the ruler
export interface RulerOpts {
  /** 0..1 the ruler's lettering/ticks (fade in) */
  alpha?: number;
  /** highlighted readings: { err, a (0..1), label? } */
  marks?: { err: number; a: number; label?: string; faint?: boolean }[];
  /** extend the pole down to this error (default LB.bottom) */
  bottom?: number;
  /** the numbers' font px (default 19; size it to the legibility floor under the live camera) */
  fontPx?: number;
}
export function rulerPole(c: C, env: PaintEnv, o: RulerOpts = {}) {
  const a = o.alpha ?? 1;
  const x = LB.rulerX;
  const y0 = LB.battenY + 2, y1 = yOf(o.bottom ?? LB.bottom);
  const m = env.mood;
  c.save();
  // the pole: a slim ink lath hung from the batten
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 3.5, y0, 7, y1 - y0);
  c.globalAlpha *= a;
  // rim on its lit edge
  c.fillStyle = withAlpha(m.rim, 0.35);
  c.fillRect(x - 3.5, yOf(LB.top), 1.1, y1 - yOf(LB.top));
  // ticks every 1 %, longer every 5 % with numbers on the left
  c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.3), 0.6);
  c.lineWidth = 1.1;
  c.beginPath();
  for (let e = LB.top; e >= (o.bottom ?? LB.bottom) - 1e-6; e -= 1) {
    const y = yOf(e);
    const major = Math.abs(e % 5) < 1e-6;
    c.moveTo(x - (major ? 14 : 7), y);
    c.lineTo(x + (major ? 14 : 7), y);
  }
  c.stroke();
  const fpx = o.fontPx ?? 19;
  c.font = `500 ${fpx}px ${FONT.mono}`;
  c.textAlign = 'right';
  // alphabetic baseline, centred by hand (cap height ≈ 0.7 em): measured cap heights stay true in every tool
  c.textBaseline = 'alphabetic';
  for (let e = 35; e >= (o.bottom ?? LB.bottom); e -= 5) {
    // the 15/20/25/30 majors carry the reading: brighter, on a soft dark plate
    const key = e <= 30;
    const pr = fpx * 1.8, pcx = x - 19 - fpx * 1.0;
    const g = c.createRadialGradient(pcx, yOf(e), 0, pcx, yOf(e), pr);
    g.addColorStop(0, withAlpha(m.fg, 0.5));
    g.addColorStop(1, withAlpha(m.fg, 0));
    c.fillStyle = g;
    c.fillRect(pcx - pr, yOf(e) - pr, pr * 2, pr * 2);
    c.fillStyle = key ? mixLab(m.core, '#efe3cf', 0.35) : withAlpha(mixLab(m.rim, m.core, 0.25), 0.7);
    c.fillText(`${e}%`, x - 19, yOf(e) + fpx * 0.35);
  }
  // highlighted readings: a lit tick (and an optional small number on the right)
  for (const mk of o.marks ?? []) {
    if (mk.a <= 0.003) continue;
    const y = yOf(mk.err);
    c.save();
    c.globalAlpha *= mk.a;
    const col = mk.faint ? withAlpha(mixLab(m.rim, m.haze, 0.3), 0.75) : m.core;
    c.strokeStyle = col;
    c.lineWidth = mk.faint ? 1.4 : 2.2;
    c.beginPath();
    c.moveTo(x - 16, y);
    c.lineTo(x + 16, y);
    c.stroke();
    if (!mk.faint) glow(c, x, y, 26, m.halo, 0.35);
    if (mk.label) {
      c.font = `${mk.faint ? 400 : 500} ${mk.faint ? 19 : 20}px ${FONT.mono}`;
      c.textAlign = 'left';
      c.fillStyle = mk.faint ? withAlpha(mixLab(m.rim, m.haze, 0.2), 0.85) : mixLab(m.core, '#efe3cf', 0.3);
      c.textBaseline = 'alphabetic';
      c.fillText(mk.label, x + 20, y + (mk.faint ? 19 : 20) * 0.35);
    }
    c.restore();
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------- lanterns
export interface HungOpts {
  x: number;
  /** lantern body centre y */
  y: number;
  r?: number;
  act: number;
  flare?: number;
  /** sway seed and amplitude (px at the lantern) */
  seed: number;
  sway?: number;
  /** env.tq (paper on twos) */
  tq: number;
  alpha?: number;
  /** from this y (default the batten) */
  fromY?: number;
}
/** a lantern on its string from the batten, swaying gently on twos; returns its drawn centre */
export function hungLantern(c: C, env: PaintEnv, o: HungOpts): { x: number; y: number } {
  const r = o.r ?? LB.r;
  const sw = (o.sway ?? 2.2) * (Math.sin(o.tq * 1.3 + o.seed * 1.7) * 0.7 + Math.sin(o.tq * 0.71 + o.seed) * 0.3);
  const top = o.fromY ?? LB.battenY + 2;
  const cx = o.x + sw, cy = o.y;
  c.save();
  if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(o.x, top);
  c.lineTo(cx, cy - r * 1.32);
  c.stroke();
  paperLantern(c, { x: cx, y: cy, r, act: o.act, flare: o.flare ?? 0, tassel: true }, env);
  c.restore();
  return { x: cx, y: cy };
}

export interface TagOpts {
  x: number;
  y: number;
  text: string;
  /** 0..1 how far the tag has turned into the light (0 = edge-on, invisible) */
  turn: number;
  size?: number;
  rot?: number;
  len?: number;
  font?: string;
}
/** a small paper tag on a thread hanging from (x, y); it "turns into the light" (scaleX 0 → 1) */
export function lanternTag(c: C, env: PaintEnv, o: TagOpts) {
  if (o.turn <= 0.01) return;
  const size = o.size ?? 13;
  const font = o.font ?? `500 ${size}px ${FONT.mono}`;
  c.save();
  c.font = font;
  const lines = o.text.split('\n');
  const w = Math.max(...lines.map((l) => c.measureText(l).width)) + size * 1.3;
  const lh = size * 1.22;
  const h = size * 1.75 + (lines.length - 1) * lh;
  const len = o.len ?? 14;
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, len);
  c.stroke();
  c.translate(0, len);
  c.scale(Math.max(0.02, o.turn), 1);
  const paper = mixLab(mixLab(env.mood.halo, '#b08a52', 0.3), env.mood.rim, 0.45);
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.fillRect(-w / 2 + 2, 2, w, h);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(-w / 2, 4);
  c.lineTo(-w / 2 + 4, 0);
  c.lineTo(w / 2 - 4, 0);
  c.lineTo(w / 2, 4);
  c.lineTo(w / 2, h);
  c.lineTo(-w / 2, h);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.fg, 0.7);
  c.beginPath();
  c.arc(0, 3.4, 1.3, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(env.mood.ink, paper, 0.12);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  lines.forEach((l, i) => c.fillText(l, 0, size * 1.75 * 0.58 + i * lh + size * 0.35));
  c.restore();
}

// ------------------------------------------------------------------------------------------- bracket
export interface BracketOpts {
  x: number;
  y0: number;
  y1: number;
  /** 0..1 drawn length (from y0 down) */
  draw: number;
  text?: string;
  textA?: number;
  /** text side */
  side?: 'left' | 'right';
  /** the text's font px (default 22) */
  fontPx?: number;
}
export function bracketRule(c: C, env: PaintEnv, o: BracketOpts) {
  if (o.draw <= 0.003) return;
  const m = env.mood;
  const col = mixLab(m.core, '#efe3cf', 0.35);
  const yE = o.y0 + (o.y1 - o.y0) * clamp01(o.draw);
  c.save();
  c.strokeStyle = withAlpha(col, 0.9);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(o.x + 10, o.y0);
  c.lineTo(o.x, o.y0);
  c.lineTo(o.x, yE);
  if (o.draw >= 0.999) c.lineTo(o.x + 10, o.y1);
  c.stroke();
  // ruled hatch marks along it (an engraver's measure)
  c.lineWidth = 0.9;
  c.strokeStyle = withAlpha(col, 0.45);
  c.beginPath();
  for (let y = o.y0 + LB.k; y < yE - 2; y += LB.k) {
    c.moveTo(o.x - 4, y);
    c.lineTo(o.x + 4, y);
  }
  c.stroke();
  if (o.text && (o.textA ?? 0) > 0.003) {
    const mid = (o.y0 + o.y1) / 2;
    c.globalAlpha *= o.textA ?? 0;
    const bpx = o.fontPx ?? 22;
    c.font = `500 ${bpx}px ${FONT.mono}`;
    c.textBaseline = 'alphabetic';
    const left = (o.side ?? 'left') === 'left';
    c.textAlign = left ? 'right' : 'left';
    const tw = c.measureText(o.text).width;
    const px = left ? o.x - 14 - tw / 2 : o.x + 14 + tw / 2;
    // a soft plate under the number (the hall's dark is busy with fog)
    const g = c.createRadialGradient(px, mid, 0, px, mid, tw * 0.75);
    g.addColorStop(0, withAlpha(m.fg, 0.55));
    g.addColorStop(1, withAlpha(m.fg, 0));
    c.fillStyle = g;
    c.fillRect(px - tw, mid - tw * 0.75, tw * 2, tw * 1.5);
    c.fillStyle = col;
    c.fillText(o.text, left ? o.x - 14 : o.x + 14, mid + bpx * 0.35);
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------- 2013: cathedrals
export interface CathOpts {
  x: number;
  y: number;
  /** height of the little cathedral (px) */
  h: number;
  act: number;
  alpha?: number;
}
/** a tiny paper-cut cathedral lantern: a nave with a rose window and two towers, lit from within */
export function cathedralLantern(c: C, env: PaintEnv, o: CathOpts) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const m = env.mood;
  const h = o.h;
  const w = h * 0.86;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  glow(c, 0, -h * 0.35, h * 1.6, m.halo, 0.22 * o.act);
  const body = new Path2D();
  // towers
  body.rect(-w / 2, -h * 0.78, w * 0.24, h * 0.78);
  body.rect(w / 2 - w * 0.24, -h * 0.78, w * 0.24, h * 0.78);
  body.moveTo(-w / 2, -h * 0.78);
  body.lineTo(-w / 2 + w * 0.12, -h);
  body.lineTo(-w / 2 + w * 0.24, -h * 0.78);
  body.moveTo(w / 2 - w * 0.24, -h * 0.78);
  body.lineTo(w / 2 - w * 0.12, -h);
  body.lineTo(w / 2, -h * 0.78);
  // nave with a gable
  body.moveTo(-w * 0.27, 0);
  body.lineTo(-w * 0.27, -h * 0.52);
  body.lineTo(0, -h * 0.72);
  body.lineTo(w * 0.27, -h * 0.52);
  body.lineTo(w * 0.27, 0);
  body.closePath();
  c.fillStyle = env.fill('ink');
  c.fill(body);
  // the lit openings: a rose window and lancets (holes lit from within)
  c.fillStyle = withAlpha(mixLab(m.core, m.halo, 0.4), 0.25 + 0.7 * o.act);
  c.beginPath();
  c.arc(0, -h * 0.42, h * 0.09, 0, Math.PI * 2);
  c.fill();
  for (const sx of [-1, 1]) {
    const tx = sx * (w / 2 - w * 0.12);
    c.beginPath();
    c.moveTo(tx - h * 0.03, -h * 0.2);
    c.lineTo(tx - h * 0.03, -h * 0.5);
    c.lineTo(tx, -h * 0.56);
    c.lineTo(tx + h * 0.03, -h * 0.5);
    c.lineTo(tx + h * 0.03, -h * 0.2);
    c.closePath();
    c.fill();
  }
  c.fillRect(-h * 0.04, -h * 0.22, h * 0.08, h * 0.22);
  c.restore();
}

// ------------------------------------------------------------------------------------------- audience
export interface HeadsOpts {
  x0: number;
  x1: number;
  /** shoulder line y (world, L5) */
  y: number;
  /** 0..1 lean forward (up into the room, tipping toward targetX) */
  lean: number;
  /** what they lean toward (world x, L5) */
  targetX?: number;
  seed: number;
  tq: number;
  /** spacing (px) */
  pitch?: number;
}
/** rows of heads and shoulders seen from behind, cut out of black card; on `lean` they tip toward the board */
export function audienceHeads(c: C, env: PaintEnv, o: HeadsOpts) {
  const pitch = o.pitch ?? 92;
  c.fillStyle = env.fill('fg');
  let i = 0;
  for (let x = o.x0; x < o.x1; x += pitch) {
    i++;
    const j = hash1(i, o.seed);
    const k = hash1(i, o.seed + 7);
    const hx = x + (j - 0.5) * 30;
    const hy = o.y + (k - 0.5) * 18;
    const s = 0.9 + 0.25 * hash1(i, o.seed + 3);
    // each leans a little differently, and late (on twos)
    const delay = hash1(i, o.seed + 11) * 0.25;
    const ln = clamp01(o.lean * 1.2 - delay);
    const dir = o.targetX === undefined ? 1 : Math.sign(o.targetX - hx) || 1;
    const bob = 0.012 * Math.sin(o.tq * 0.9 + i * 1.7);
    c.save();
    c.translate(hx, hy + 60 * s - ln * (10 + 8 * j));
    c.rotate(dir * ln * (0.07 + 0.06 * j) + bob);
    c.scale(s, s);
    // shoulders
    c.beginPath();
    c.moveTo(-62, 80);
    c.quadraticCurveTo(-60, -8, -24, -22);
    c.lineTo(24, -22);
    c.quadraticCurveTo(60, -8, 62, 80);
    c.closePath();
    c.fill();
    // neck + head (an oval, hair variety)
    c.fillRect(-11, -34, 22, 16);
    c.beginPath();
    c.ellipse(0, -58, 25 + 6 * k, 30, 0, 0, Math.PI * 2);
    c.fill();
    if (j > 0.6) {
      c.beginPath();
      c.ellipse(-5, -78, 22, 12, -0.2, 0, Math.PI * 2);
      c.fill();
    } else if (k > 0.55) {
      // a ponytail or a collar
      c.beginPath();
      c.ellipse(-4, -30, 12, 18, 0.3, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
}

// ------------------------------------------------------------------------------------------- the audience (busts)
export interface BustOpts {
  /** screen-space band (the caller transforms) */
  x0: number;
  x1: number;
  /** shoulder line y */
  y: number;
  scale: number;
  pitch: number;
  /** 0..1 the lean toward targetX (already on twos) — each bust adds its own one or two drawings of delay */
  lean: (delayDrawings: number) => number;
  targetX: number;
  seed: number;
  tq: number;
  ink: string;
  /** max lean in degrees (default 7) */
  deg?: number;
}
/** busts seen from behind (head, neck, shoulder line, collar or a lock of hair), each leaning a little late */
export function audienceBusts(c: C, o: BustOpts) {
  c.fillStyle = o.ink;
  let i = 0;
  for (let x = o.x0; x < o.x1; x += o.pitch) {
    i++;
    const j = (hash1(i, o.seed) + 1) / 2;
    const k = (hash1(i, o.seed + 7) + 1) / 2;
    const hx = x + (j - 0.5) * o.pitch * 0.35;
    const s = o.scale * (0.92 + 0.16 * k);
    const late = 1 + Math.floor(j * 2);
    const ln = o.lean(late);
    const dir = Math.sign(o.targetX - hx) || 1;
    const ang = (dir * ln * ((o.deg ?? 7) - 1 + 2 * k) * Math.PI) / 180 + 0.008 * Math.sin(o.tq * 0.9 + i * 1.7);
    c.save();
    c.translate(hx, o.y + 90 * s);
    c.rotate(ang);
    c.scale(s, s);
    c.translate(0, -90);
    // shoulders and upper back: a broad rounded line, a little asymmetric
    const sl = 64 + 8 * j, sr = 64 + 8 * k;
    const p = new Path2D();
    p.moveTo(-sl - 6, 120);
    p.quadraticCurveTo(-sl - 4, 8, -sl + 14, -2);
    p.quadraticCurveTo(-30, -14, -12, -16);
    p.lineTo(12, -16);
    p.quadraticCurveTo(30, -14, sr - 14, -2);
    p.quadraticCurveTo(sr + 4, 8, sr + 6, 120);
    p.closePath();
    // neck (each sub-shape starts with its own moveTo: no stray connecting lines)
    p.rect(-10, -34, 20, 22);
    // head and ears
    const ov = (x: number, y: number, rx: number, ry: number) => {
      p.moveTo(x + rx, y);
      p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    };
    ov(0, -58, 21 + 4 * k, 27);
    ov(-22 - 3 * k, -54, 4, 7);
    ov(22 + 3 * k, -54, 4, 7);
    if (j > 0.62) {
      // hair gathered in a bun
      ov(2, -86, 11, 9);
    } else if (k > 0.6) {
      // a lock of long hair over one shoulder
      p.moveTo(-18, -66);
      p.quadraticCurveTo(-30, -24, -26, 6);
      p.lineTo(-12, 4);
      p.quadraticCurveTo(-14, -30, -6, -60);
      p.closePath();
    } else {
      // a jacket collar turned up round the nape (a soft rounded band)
      p.moveTo(-17, -12);
      p.quadraticCurveTo(-16, -30, 0, -29);
      p.quadraticCurveTo(16, -30, 17, -12);
      p.closePath();
    }
    c.fill(p);
    c.restore();
  }
}
