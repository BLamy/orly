/**
 * ch15 (Case Status: Open) — shared pieces for ch15-s01, s03, s04, s05, s06 (one animator's group).
 *
 *   goldMedallion(c, o, env)   a gold prize medallion in silhouette-theatre gold: beaded rim, a faint laurel, a BLANK
 *                              face, a ribbon loop; `turn` 0 (edge-on) → 1 (face-on); optional teaching marks on its
 *                              face: `hollow` (an engraved basin, the 1982 memory), `ball` (0..1 a paper ball rolling
 *                              into it and settling), `ribbon` (0..1 a thin paper ribbon folding into a knotted protein)
 *   label15(c, o, env)         a short screen-locked label on a soft ink plate (IBM Plex Mono, ≥ 19 px), with an in/out
 *                              envelope; one or two lines
 *   ribbonBanner(c, o, env)    a screen-locked paper ribbon (swallow-tailed) carrying a quotation in EB Garamond italic,
 *                              unrolling from the centre outward; `letters` fades the lettering alone
 *   luggageTag(c, o, env)      a manila luggage tag on a string that can FLIP over (0 → 1) to show its back side
 *   pulse(t, at, rise, fall)   a 0 → 1 → 0 envelope
 * Re-exports the ch13 group's helpers (time windows, screen pass, the mono date stamp, the stage painter).
 */
import type { Palette, PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, legibleSize, softPlate, wrapLines } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { clamp01, sm, win, lerp, tq12 } from './ch13-s01-kit';

export { clamp01, sm, win, lerp, tq12 };
export { screen, monoDate, bloom, longShadow, stage13, parchmentCard, WALL_FLAT } from './ch13-s01-kit';

type C = CanvasRenderingContext2D;

export function pulse(t: number, at: number, rise: number, fall: number): number {
  if (t <= at) return 0;
  if (t < at + rise) return sm((t - at) / rise);
  return 1 - sm((t - at - rise) / fall);
}

/** gold tones derived from the mood (no hard-coded saturated hex beyond a warm bias) */
export function goldTones(m: Palette) {
  const base = mixLab(m.halo, '#c99a3c', 0.35);
  return {
    hi: mixLab(m.core, '#fff1c4', 0.25),
    mid: base,
    lo: mixLab(base, m.set, 0.45),
    deep: mixLab(m.set, m.fg, 0.35),
    edge: mixLab(base, m.fg, 0.6),
  };
}

// ===================================================================================================== medallion
export interface MedallionDraw {
  x: number;
  y: number;
  /** radius (px in the current transform) */
  r: number;
  /** 0 edge-on … 1 face-on */
  turn?: number;
  alpha?: number;
  /** 0..1 the engraved hollow on the blank face */
  hollow?: number;
  /** 0..1 the paper ball's roll into the hollow (0 = at the rim, 1 = settled) */
  ball?: number;
  /** 0..1 the thin paper ribbon folding into a knotted protein (0 = a straight strip; < 0 hides it) */
  fold?: number;
  /** 0..1 a cool pale wash over the gold (the cooling net) */
  cool?: number;
  /** draw the ribbon loop + hanging cord above it */
  cord?: number;
  seed?: number;
}

/** the medallion's face profile: the hollow's depth at face-x u in -1..1 (a basin with a soft lip) */
const basin = (u: number) => {
  const a = Math.max(0, 1 - u * u);
  return a * a;
};

/** a knotted protein path on the unit face (precomputed): a few helical turns, a sheet hairpin, a loop back */
const PROTEIN: { x: number; y: number }[] = (() => {
  const pts: { x: number; y: number }[] = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    let x: number, y: number;
    if (u < 0.38) {
      // a helix running down-right, drawn as a flattened coil
      const v = u / 0.38;
      const a = v * Math.PI * 2 * 3.2;
      x = -0.55 + v * 0.62 + Math.cos(a) * 0.13;
      y = -0.45 + v * 0.55 + Math.sin(a) * 0.09;
    } else if (u < 0.62) {
      // a hairpin sheet back to the left
      const v = (u - 0.38) / 0.24;
      x = 0.07 + Math.sin(v * Math.PI) * 0.32 - v * 0.62;
      y = 0.1 + Math.sin(v * Math.PI * 3) * 0.06 + v * 0.18;
    } else {
      // a loop up and through the coil (the knot)
      const v = (u - 0.62) / 0.38;
      const a = -Math.PI * 0.2 + v * Math.PI * 1.55;
      x = -0.1 + Math.cos(a) * 0.42 * (1 - 0.25 * v);
      y = 0.02 - Math.sin(a) * 0.4 * (1 - 0.2 * v);
    }
    pts.push({ x, y });
  }
  return pts;
})();
/** the same ribbon laid straight across the face (the unfolded state) */
const STRAIGHT = PROTEIN.map((_, i) => ({ x: -0.62 + (1.24 * i) / (PROTEIN.length - 1), y: 0.06 + 0.04 * Math.sin(i * 0.11) }));

export function goldMedallion(c: C, o: MedallionDraw, env: PaintEnv) {
  const al = o.alpha ?? 1;
  if (al <= 0.003) return;
  const m = env.mood;
  const G = goldTones(m);
  const turn = clamp01(o.turn ?? 1);
  const sx = Math.max(0.06, Math.sin((turn * Math.PI) / 2));
  const r = o.r;
  c.save();
  c.globalAlpha *= al;
  c.translate(o.x, o.y);
  // the cord and ribbon loop (always face-on: it hangs from the loop at the top)
  const cord = o.cord ?? 0;
  if (cord > 0.01) {
    c.save();
    c.globalAlpha *= cord;
    c.strokeStyle = withAlpha(mixLab(m.fg, m.set, 0.3), 0.95);
    c.lineWidth = Math.max(1, r * 0.035);
    c.beginPath();
    c.moveTo(0, -r * 1.12);
    c.lineTo(0, -r * 4.5);
    c.stroke();
    c.restore();
  }
  // the ring at the top
  c.fillStyle = G.lo;
  c.beginPath();
  c.ellipse(0, -r * 1.06, r * 0.13 * Math.max(0.5, sx), r * 0.13, 0, 0, Math.PI * 2);
  c.ellipse(0, -r * 1.06, r * 0.07 * Math.max(0.5, sx), r * 0.07, 0, 0, Math.PI * 2);
  c.fill('evenodd');
  c.scale(sx, 1);
  // edge thickness: a darker crescent showing while it turns
  if (sx < 0.98) {
    c.fillStyle = G.edge;
    c.beginPath();
    c.ellipse(r * 0.09 * (1 - sx) / sx, 0, r, r, 0, 0, Math.PI * 2);
    c.fill();
  }
  // the disc: raking gold, brighter toward the upper left (the lamp side)
  const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r * 1.05);
  g.addColorStop(0, G.hi);
  g.addColorStop(0.45, G.mid);
  g.addColorStop(1, G.lo);
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  // the rim: a raised band, beaded
  c.strokeStyle = withAlpha(G.deep, 0.75);
  c.lineWidth = Math.max(1, r * 0.035);
  c.beginPath();
  c.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(G.hi, 0.55);
  c.lineWidth = Math.max(0.8, r * 0.018);
  c.beginPath();
  c.arc(0, 0, r * 0.97, Math.PI * 0.9, Math.PI * 1.75);
  c.stroke();
  c.fillStyle = withAlpha(G.deep, 0.55);
  const nb = 44;
  for (let k = 0; k < nb; k++) {
    const a = (k / nb) * Math.PI * 2;
    c.beginPath();
    c.arc(Math.cos(a) * r * 0.915, Math.sin(a) * r * 0.915, Math.max(0.6, r * 0.022), 0, Math.PI * 2);
    c.fill();
  }
  // a faint laurel low on the face (two arcs of leaves, cut-line only)
  c.strokeStyle = withAlpha(G.deep, 0.42);
  c.lineWidth = Math.max(0.7, r * 0.014);
  for (const side of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const a = Math.PI / 2 + side * (0.35 + k * 0.17);
      const rr = r * 0.74;
      const lx = Math.cos(a) * rr, ly = Math.sin(a) * rr;
      c.beginPath();
      c.ellipse(lx, ly, r * 0.06, r * 0.022, a + side * 1.1, 0, Math.PI * 2);
      c.stroke();
    }
  }
  // the hollow (engraved basin) and the ball
  const hol = clamp01(o.hollow ?? 0);
  if (hol > 0.01) {
    const W = r * 0.7, D = r * 0.36, y0 = -r * 0.04;
    // the basin's shadowed floor
    c.save();
    c.globalAlpha *= hol;
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const u = -1 + (2 * i) / 40;
      const yy = y0 + basin(u) * D;
      if (i === 0) c.moveTo(u * W, yy);
      else c.lineTo(u * W, yy);
    }
    for (let i = 40; i >= 0; i--) {
      const u = -1 + (2 * i) / 40;
      c.lineTo(u * W, y0 + basin(u) * D * 0.55 + r * 0.05);
    }
    c.closePath();
    c.fillStyle = withAlpha(G.deep, 0.32);
    c.fill();
    // the engraved line (dark cut + bright lip below it)
    c.lineWidth = Math.max(1, r * 0.022);
    c.strokeStyle = withAlpha(G.deep, 0.85);
    c.beginPath();
    for (let i = 0; i <= 50; i++) {
      const u = -1.18 + (2.36 * i) / 50;
      const yy = y0 + basin(Math.max(-1, Math.min(1, u))) * D;
      if (i === 0) c.moveTo(u * W, yy);
      else c.lineTo(u * W, yy);
    }
    c.stroke();
    c.strokeStyle = withAlpha(G.hi, 0.6);
    c.lineWidth = Math.max(0.7, r * 0.012);
    c.beginPath();
    for (let i = 0; i <= 50; i++) {
      const u = -1.18 + (2.36 * i) / 50;
      const yy = y0 + basin(Math.max(-1, Math.min(1, u))) * D + r * 0.022;
      if (i === 0) c.moveTo(u * W, yy);
      else c.lineTo(u * W, yy);
    }
    c.stroke();
    c.restore();
    const bu = o.ball;
    if (bu !== undefined && bu >= 0) {
      // the ball starts on the left lip, rolls down, overshoots, rocks and settles at the bottom
      const b = clamp01(bu);
      const settle = b < 0.55 ? -1.05 + 1.05 * sm(b / 0.55) * 1.32 : 0.33 * Math.cos(((b - 0.55) / 0.45) * Math.PI * 2.5) * Math.exp(-((b - 0.55) / 0.45) * 3.2);
      const u = Math.max(-1.05, Math.min(1, settle));
      const br = Math.max(2.5, r * 0.07);
      const bx = u * W, by = y0 + basin(Math.max(-1, Math.min(1, u))) * D - br * 0.95;
      c.save();
      c.globalAlpha *= clamp01(b * 8) * hol;
      c.fillStyle = mixLab(MOODS.parchment.sky[1], m.halo, 0.25);
      c.beginPath();
      c.arc(bx, by, br, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha(G.deep, 0.6);
      c.lineWidth = Math.max(0.7, br * 0.14);
      c.stroke();
      c.fillStyle = withAlpha('#ffffff', 0.45);
      c.beginPath();
      c.arc(bx - br * 0.32, by - br * 0.35, br * 0.28, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }
  // the protein ribbon
  const fd = o.fold;
  if (fd !== undefined && fd >= 0) {
    const u = sm(clamp01(fd));
    c.save();
    c.lineJoin = 'round';
    c.lineCap = 'round';
    const pts = PROTEIN.map((p, i) => {
      const s = STRAIGHT[i];
      // the fold travels along the ribbon from one end (a curl running down it)
      const k = sm(clamp01(u * 1.6 - (i / PROTEIN.length) * 0.6));
      return { x: lerp(s.x, p.x, k) * r, y: lerp(s.y, p.y, k) * r };
    });
    const path = () => {
      c.beginPath();
      pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    };
    // shadow, paper body, lit edge
    c.translate(r * 0.02, r * 0.025);
    path();
    c.strokeStyle = withAlpha(G.deep, 0.45);
    c.lineWidth = Math.max(2, r * 0.07);
    c.stroke();
    c.translate(-r * 0.02, -r * 0.025);
    path();
    c.strokeStyle = mixLab(MOODS.parchment.sky[1], m.halo, 0.3);
    c.lineWidth = Math.max(1.6, r * 0.052);
    c.stroke();
    path();
    c.strokeStyle = withAlpha(G.deep, 0.35);
    c.lineWidth = Math.max(0.5, r * 0.01);
    c.stroke();
    c.restore();
  }
  // the cool pale wash (the cooling net): the gold goes pale, then returns
  const cool = clamp01(o.cool ?? 0);
  if (cool > 0.01) {
    c.fillStyle = withAlpha(mixLab(MOODS.winterBlue.rim, '#eef2f4', 0.4), 0.42 * cool);
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ===================================================================================================== labels
export interface Label15 {
  text: string;
  /** an optional second line (smaller, italic EB Garamond) */
  sub?: string;
  x: number;
  y: number;
  at: number;
  /** fade-out start (absolute shot time) */
  until?: number;
  align?: CanvasTextAlign;
  size?: number;
  /** font family for the main line (default IBM Plex Mono) */
  font?: string;
}
export function label15(c: C, o: Label15, env: { t: number; mood: Palette }) {
  const t = env.t;
  const A = win(t, o.at, o.at + 0.5) * (o.until !== undefined ? 1 - win(t, o.until, o.until + 0.5) : 1);
  if (A <= 0.003) return;
  const m = env.mood;
  // both lines at the kit's legibility floor (22 px cap height at 1080p)
  const size = legibleSize(c, `500 ${o.size ?? 20}px ${o.font ?? FONT.mono}`, o.size ?? 20);
  const font = `500 ${size}px ${o.font ?? FONT.mono}`;
  const ssz = legibleSize(c, `italic 400 ${Math.round(size * 0.95)}px ${FONT.text}`, Math.round(size * 0.95));
  const sfont = `italic 400 ${ssz}px ${FONT.text}`;
  c.save();
  c.font = font;
  (c as C & { letterSpacing: string }).letterSpacing = '0.6px';
  const w = c.measureText(o.text).width;
  c.font = sfont;
  const ws = o.sub ? c.measureText(o.sub).width : 0;
  const al = o.align ?? 'center';
  const W = Math.max(w, ws);
  const cx = al === 'center' ? o.x : al === 'left' ? o.x + W / 2 : o.x - W / 2;
  const H = o.sub ? size * 2.6 : size * 1.4;
  softPlate(c, cx, o.y - size * 0.35 + (o.sub ? size * 0.6 : 0), W + 140, H + 70, m.ink, 0.66 * A);
  const k = win(t, o.at, o.at + 0.6);
  c.globalAlpha = A * k;
  c.textAlign = al;
  c.textBaseline = 'alphabetic';
  c.font = font;
  c.fillStyle = mixLab(m.core, '#ffffff', 0.25);
  c.fillText(o.text, o.x, o.y + (1 - k) * 4);
  if (o.sub) {
    c.globalAlpha = A * win(t, o.at + 0.25, o.at + 0.85);
    c.font = sfont;
    (c as C & { letterSpacing: string }).letterSpacing = '0px';
    c.fillStyle = mixLab(m.rim, '#ffffff', 0.25);
    c.fillText(o.sub, o.x, o.y + size * 0.3 + ssz * 1.05);
  }
  c.restore();
}

// ===================================================================================================== ribbon banner
export interface RibbonBanner {
  text: string;
  attrib?: string;
  x: number;
  y: number;
  width: number;
  /** 0..1 the unroll */
  open: number;
  /** 0..1 the lettering (fades alone) */
  letters: number;
  /** overall alpha */
  alpha?: number;
  size?: number;
}
export function ribbonBanner(c: C, o: RibbonBanner, env: { t: number; mood: Palette }) {
  const A = (o.alpha ?? 1) * clamp01(o.open * 4);
  if (A <= 0.003) return;
  const m = env.mood;
  const P = MOODS.parchment;
  // the quotation and its attribution at the kit's legibility floor (22 px cap height at 1080p)
  const size = legibleSize(c, `italic 400 ${o.size ?? 23}px ${FONT.text}`, o.size ?? 23);
  const font = `italic 400 ${size}px ${FONT.text}`;
  const asz = legibleSize(c, `500 ${Math.round(size * 0.72)}px ${FONT.sc}`, Math.round(size * 0.72), 'nobel');
  const lines = wrapLines(c, o.text, font, o.width - 80);
  const lh = size * 1.3;
  const H = lines.length * lh + (o.attrib ? asz * 1.3 + 8 : 0) + 30;
  const half = (o.width / 2) * sm(o.open);
  c.save();
  softPlate(c, o.x, o.y, o.width + 200, H + 120, m.fg, 0.4 * A);
  c.globalAlpha = A;
  const paper = mixLab(P.sky[1], m.halo, 0.22);
  const shade = mixLab(paper, m.set, 0.45);
  const top = o.y - H / 2, bot = o.y + H / 2;
  // swallow tails behind each end (folded under)
  for (const side of [-1, 1]) {
    const ex = o.x + side * half;
    c.fillStyle = shade;
    c.beginPath();
    c.moveTo(ex - side * 8, top + 10);
    c.lineTo(ex + side * 34, top + 10);
    c.lineTo(ex + side * 20, o.y + 5);
    c.lineTo(ex + side * 34, bot + 10);
    c.lineTo(ex - side * 8, bot + 10);
    c.closePath();
    c.fill();
  }
  // the ribbon body with a slight wave
  c.fillStyle = paper;
  c.beginPath();
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const x = o.x - half + (2 * half * i) / n;
    const y = top + Math.sin(i * 0.55) * 2.2;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  for (let i = n; i >= 0; i--) {
    const x = o.x - half + (2 * half * i) / n;
    c.lineTo(x, bot + Math.sin(i * 0.55 + 0.6) * 2.2);
  }
  c.closePath();
  c.fill();
  // the two rolls at the unrolling ends
  for (const side of [-1, 1]) {
    const ex = o.x + side * half;
    const rr = 7 + 5 * (1 - o.open);
    const gx = c.createLinearGradient(ex - rr, 0, ex + rr, 0);
    gx.addColorStop(0, shade);
    gx.addColorStop(0.5, paper);
    gx.addColorStop(1, shade);
    c.fillStyle = gx;
    c.fillRect(ex - rr, top - 3, rr * 2, H + 6);
  }
  // fibre edge tone
  c.fillStyle = withAlpha('#7a5a30', 0.12);
  c.fillRect(o.x - half, top, 2 * half, 4);
  c.fillRect(o.x - half, bot - 4, 2 * half, 4);
  // lettering, clipped to the unrolled part
  const L = clamp01(o.letters);
  if (L > 0.003) {
    c.save();
    c.beginPath();
    c.rect(o.x - half + 10, top, 2 * half - 20, H);
    c.clip();
    c.globalAlpha = A * L;
    c.fillStyle = withAlpha(P.ink, 0.9);
    c.font = font;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    lines.forEach((ln, i) => {
      const txt = (i === 0 ? '“' : '') + ln + (i === lines.length - 1 ? '”' : '');
      c.fillText(txt, o.x, top + 14 + size + i * lh);
    });
    if (o.attrib) {
      c.globalAlpha = A * L * 0.85;
      c.font = `500 ${asz}px ${FONT.sc}`;
      (c as C & { letterSpacing: string }).letterSpacing = '1.5px';
      c.fillText(o.attrib.toLowerCase(), o.x, top + 14 + size + (lines.length - 1) * lh + asz * 1.3 + 8);
    }
    c.restore();
  }
  c.restore();
}

// ===================================================================================================== luggage tag
export interface TagDraw {
  /** the string's top (where it ties on) */
  x: number;
  y: number;
  w?: number;
  h?: number;
  front: string;
  back?: string;
  /** 0 front … 1 back (a flip about the tag's vertical axis) */
  flip?: number;
  /** swing angle (radians) */
  swing?: number;
  /** lamp light on the tag 0..1 */
  light?: number;
  /** string length */
  str?: number;
  size?: number;
}
export function luggageTag(c: C, o: TagDraw, env: PaintEnv) {
  const m = env.mood;
  const w = o.w ?? 150, h = o.h ?? 46;
  const L = o.light ?? 1;
  const str = o.str ?? 26;
  const fl = clamp01(o.flip ?? 0);
  const sx = Math.cos(fl * Math.PI);
  const face = sx >= 0 ? o.front : o.back ?? '';
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.swing ?? 0);
  // the string
  c.strokeStyle = withAlpha(mixLab(m.rim, m.set, 0.4), 0.8);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(3, str * 0.5, (-w / 2 + 14) * Math.abs(Math.cos(clamp01(o.flip ?? 0) * Math.PI)), str + 14);
  c.stroke();
  c.restore();
  // the tag body: a manila rectangle with clipped top corners and a reinforced eyelet
  const manila = mixLab(mixLab(MOODS.parchment.sky[2], '#b08a52', 0.45), m.set, 0.55 - 0.45 * L);
  const back = mixLab(manila, m.set, 0.18);
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.swing ?? 0);
  c.translate(0, str);
  c.scale(Math.max(0.04, Math.abs(sx)), 1);
  const hw = w / 2;
  c.fillStyle = sx >= 0 ? manila : back;
  c.beginPath();
  c.moveTo(-hw + 12, 0);
  c.lineTo(hw - 12, 0);
  c.lineTo(hw, 12);
  c.lineTo(hw, h);
  c.lineTo(-hw, h);
  c.lineTo(-hw, 12);
  c.closePath();
  c.fill();
  // the reinforced eyelet sits on the tag's left shoulder, clear of the lettering
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.beginPath();
  c.arc(-hw + 14, 14, 4.2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(manila, m.fg, 0.35), 0.8);
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(-hw + 14, 14, 6.4, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = withAlpha(m.rim, 0.5 * L);
  c.fillRect(-hw + 12, 0, w - 24, 1);
  if (face && Math.abs(sx) > 0.25) {
    const size = o.size ?? 17;
    c.fillStyle = withAlpha(MOODS.parchment.ink, 0.88 * Math.min(1, 0.35 + L));
    c.font = `500 ${size}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    (c as C & { letterSpacing: string }).letterSpacing = '0.5px';
    let s2 = size;
    while (c.measureText(face).width > w - 40 && s2 > 11) {
      s2 -= 0.5;
      c.font = `500 ${s2}px ${FONT.mono}`;
    }
    c.fillText(face, 10, h * 0.6);
  }
  c.restore();
  void hash1;
}
