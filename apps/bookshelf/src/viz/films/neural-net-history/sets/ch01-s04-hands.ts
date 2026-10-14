/**
 * neural-net-history — the detective's hands, ch01 cut (ch01-s04, ch01-s05). Cast id `narrator-hands`.
 *
 * Two steady, cuffed, mid-life hands entering from a frame edge at a FIXED forearm angle (about 30–40° off
 * the vertical), so only a short length of forearm is ever visible: a tweed jacket sleeve with a hard edge
 * (rim-lit), a shirt cuff showing past it (a band with one cufflink dot), the wrist, then an ARTICULATED hand:
 * a palm with four separate fingers (index, middle, ring, little; two phalanges each, so they can curl) and
 * a two-segment thumb, the gaps between them letting the backlight through. Paper is rigid: each shape is a
 * fixed sprite swapped on a hold (never morphed); the caller drives the wrist on twos.
 *
 *   drawArm(c, env, arm)          inside f.layer(...): sleeve → cuff → hand, at `arm.wrist`, forearm along `arm.dir`
 *   socketOf(arm)                 where a held card's edge / a pressed point sits (layer px)
 *   wristAt(target, dir, shape, len, side?, bend?)   the wrist that puts the socket on a target
 *   armDir(deg)                   a forearm direction from degrees off the vertical (+ = leaning right)
 *
 * Shapes: 'pinch' (a card held between thumb and index), 'press' (index out straight, the others folded),
 * 'flat' (palm down, fingers together: a flap pressed shut, a tap, a hand at rest on the folder), 'open'
 * (letting go, fingers apart), 'rest' (fingers loosely curled).
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';

type C = CanvasRenderingContext2D;
export type Pt = { x: number; y: number };
export type HandShape01 = 'pinch' | 'press' | 'flat' | 'open' | 'rest';
export interface Arm {
  /** wrist point (layer px) */
  wrist: Pt;
  /** forearm direction (radians, screen axes): from the frame edge toward the wrist */
  dir: number;
  shape: HandShape01;
  /** R = right hand (back of the hand to camera, thumb on the left when pointing up); L mirrors it */
  side?: 'R' | 'L';
  /** hand length, wrist → middle fingertip (layer px) */
  len: number;
  /** wrist bend relative to the forearm (radians, + = toward the thumb side) */
  bend?: number;
  /** a lift toward the lens (0..1): the hand grows a touch (a tap seen from above) */
  lift?: number;
  /** the lamp's direction (screen axes): a 1.5 px rim (1080p) is cut on the hand's contour facing it only */
  light?: Pt;
  /** 0..1: paper-cut detail lines on the back of the hand in the lamp's colour (a knuckle line across the four
   *  joints with a bump per knuckle, the splits between the fingers, the folded fingers' knuckles, the wrist
   *  crease), so a hand lying on a lit desk never reads as a mitten. Default 0 (none). */
  detail?: number;
}

/** a forearm direction from degrees off the vertical: 0 = straight up, +35 = up and to the right */
export const armDir = (deg: number) => -Math.PI / 2 + (deg * Math.PI) / 180;

// ---------------------------------------------------------------- the hand (unit = hand length)
// origin = wrist; +x along the hand toward the fingertips; -y = thumb side.
type P = [number, number];
interface Finger {
  base: P;
  /** proximal / distal lengths */
  l1: number;
  l2: number;
  /** proximal angle (radians off +x) and the curl at the middle joint */
  a: number;
  curl: number;
  w: number;
}
interface Sprite {
  fingers: Finger[];
  thumb: Finger;
  socket: P;
}
const PALM: P[] = [[-0.02, -0.17], [0.2, -0.205], [0.46, -0.175], [0.545, -0.095], [0.555, 0.04], [0.515, 0.13], [0.32, 0.195], [0.1, 0.19], [-0.02, 0.15]];
const BASES: P[] = [[0.5, -0.122], [0.53, -0.04], [0.52, 0.042], [0.48, 0.118]];
const LEN: [number, number][] = [[0.24, 0.18], [0.265, 0.2], [0.245, 0.18], [0.19, 0.14]];
const WID = [0.108, 0.114, 0.104, 0.09];
/** a finger; one that curls past ~70° folds under the palm, so only a knuckle stub shows */
const fingersOf = (a: number[], curl: number[]): Finger[] =>
  BASES.map((b, i) => {
    const folded = curl[i] > 1.2;
    return { base: b, l1: LEN[i][0] * (folded ? 0.5 : 1), l2: LEN[i][1] * (folded ? 0.45 : 1), a: a[i], curl: curl[i], w: WID[i] };
  });
const thumb = (a: number, curl: number): Finger => ({ base: [0.14, -0.15], l1: 0.2, l2: 0.17, a, curl, w: 0.12 });

const SPRITES: Record<HandShape01, Sprite> = {
  // a card held by its edge: index and middle forward and a little curled, ring and little folded, the thumb
  // reaching across to meet the index
  pinch: { fingers: fingersOf([-0.16, -0.04, 0.1, 0.2], [0.4, 0.55, 2.2, 2.3]), thumb: thumb(-0.55, 0.55), socket: [0.6, -0.24] },
  // the index straight out, the others folded under the palm (knuckles only), the thumb tucked along the side
  press: { fingers: fingersOf([-0.05, 0.1, 0.16, 0.22], [0.02, 2.3, 2.35, 2.4]), thumb: thumb(-0.3, 0.45), socket: [0.94, -0.14] },
  // palm down, fingers together and straight, the thumb alongside
  flat: { fingers: fingersOf([-0.06, -0.015, 0.035, 0.09], [0.04, 0.03, 0.04, 0.06]), thumb: thumb(-0.62, 0.3), socket: [0.82, -0.02] },
  // letting go: fingers a little apart, the thumb away
  open: { fingers: fingersOf([-0.2, -0.065, 0.06, 0.19], [0.1, 0.08, 0.1, 0.15]), thumb: thumb(-0.85, 0.3), socket: [0.85, -0.12] },
  // relaxed: fingers loosely curled
  rest: { fingers: fingersOf([-0.08, 0.0, 0.07, 0.14], [0.6, 0.7, 0.8, 0.9]), thumb: thumb(-0.45, 0.35), socket: [0.72, 0] },
};

let HAND_CV: HTMLCanvasElement | null = null;
let RIM_CV: HTMLCanvasElement | null = null;
const fit = (cv: HTMLCanvasElement | null, w: number, h: number) => {
  if (cv && cv.width >= w && cv.height >= h) return cv;
  const n = document.createElement('canvas');
  n.width = Math.max(w, cv?.width ?? 0);
  n.height = Math.max(h, cv?.height ?? 0);
  return n;
};
const jointOf = (f: Finger): P => [f.base[0] + Math.cos(f.a) * f.l1, f.base[1] + Math.sin(f.a) * f.l1];
const tipOf = (f: Finger): P => {
  const j = jointOf(f);
  return [j[0] + Math.cos(f.a + f.curl) * f.l2, j[1] + Math.sin(f.a + f.curl) * f.l2];
};

function fingerPath(p: Path2D, f: Finger) {
  const j: P = [f.base[0] + Math.cos(f.a) * f.l1, f.base[1] + Math.sin(f.a) * f.l1];
  const a2 = f.a + f.curl;
  const tip: P = [j[0] + Math.cos(a2) * f.l2, j[1] + Math.sin(a2) * f.l2];
  p.moveTo(f.base[0], f.base[1]);
  p.lineTo(j[0], j[1]);
  p.lineTo(tip[0], tip[1]);
}
/** each shape's strokes, built once: [palm fill, finger strokes by width] */
const BUILT = new Map<HandShape01, { palm: Path2D; strokes: { p: Path2D; w: number }[] }>();
function built(shape: HandShape01) {
  let b = BUILT.get(shape);
  if (b) return b;
  const S = SPRITES[shape];
  const palm = new Path2D();
  const n = PALM.length;
  const mid = (a: P, q: P): P => [(a[0] + q[0]) / 2, (a[1] + q[1]) / 2];
  const m0 = mid(PALM[n - 1], PALM[0]);
  palm.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(PALM[i], PALM[(i + 1) % n]);
    palm.quadraticCurveTo(PALM[i][0], PALM[i][1], m[0], m[1]);
  }
  palm.closePath();
  const strokes = [...S.fingers, S.thumb].map((f) => {
    const p = new Path2D();
    fingerPath(p, f);
    return { p, w: f.w };
  });
  b = { palm, strokes };
  BUILT.set(shape, b);
  return b;
}

function handAngle(a: Arm) {
  const flip = a.side === 'L' ? -1 : 1;
  return { ang: a.dir + (a.bend ?? 0) * -flip, flip };
}

/** where the held thing / the pressed point is (layer px) */
export function socketOf(a: Arm): Pt {
  const { ang, flip } = handAngle(a);
  const s = SPRITES[a.shape].socket;
  const k = a.len * (1 + 0.06 * (a.lift ?? 0));
  const lx = s[0] * k, ly = s[1] * k * flip;
  return { x: a.wrist.x + lx * Math.cos(ang) - ly * Math.sin(ang), y: a.wrist.y + lx * Math.sin(ang) + ly * Math.cos(ang) };
}

/** the wrist that puts the socket on a target, for a forearm along `dir` */
export function wristAt(target: Pt, dir: number, shape: HandShape01, len: number, side: 'R' | 'L' = 'R', bend = 0): Pt {
  const s = socketOf({ wrist: { x: 0, y: 0 }, dir, shape, len, side, bend });
  return { x: target.x - s.x, y: target.y - s.y };
}

export function drawArm(c: C, env: PaintEnv, a: Arm) {
  const ink = env.fill('ink');
  const rim = env.mood.rim;
  const { ang, flip } = handAngle(a);
  const L = a.len * (1 + 0.06 * (a.lift ?? 0));
  const ux = Math.cos(a.dir), uy = Math.sin(a.dir);
  const nx = -uy, ny = ux;
  const W = a.wrist;
  const at = (k: number, side: number, w: number): Pt => ({ x: W.x + ux * k * L + nx * side * w * L, y: W.y + uy * k * L + ny * side * w * L });
  // the jacket sleeve: from far beyond the frame edge to its hard edge 0.34 L behind the wrist
  const back = 9; // hand lengths: always well past the frame edge
  const sleeve = new Path2D();
  const s0 = at(-back, 1, 0.34), s1 = at(-0.34, 1, 0.27), s2 = at(-0.34, -1, 0.27), s3 = at(-back, -1, 0.34);
  sleeve.moveTo(s0.x, s0.y);
  sleeve.lineTo(s1.x, s1.y);
  const sc = at(-0.3, 0, 0);
  sleeve.quadraticCurveTo(sc.x, sc.y, s2.x, s2.y);
  sleeve.lineTo(s3.x, s3.y);
  sleeve.closePath();
  // the shirt cuff: a narrower band showing past the sleeve edge
  const cuff = new Path2D();
  const c0 = at(-0.38, 1, 0.215), c1 = at(-0.13, 1, 0.205), c2 = at(-0.13, -1, 0.205), c3 = at(-0.38, -1, 0.215);
  cuff.moveTo(c0.x, c0.y);
  cuff.lineTo(c1.x, c1.y);
  cuff.lineTo(c2.x, c2.y);
  cuff.lineTo(c3.x, c3.y);
  cuff.closePath();
  // the wrist: narrower still, into the heel of the hand
  const wrist = new Path2D();
  const w0 = at(-0.15, 1, 0.16), w1 = at(0.06, 1, 0.155), w2 = at(0.06, -1, 0.155), w3 = at(-0.15, -1, 0.16);
  wrist.moveTo(w0.x, w0.y);
  wrist.lineTo(w1.x, w1.y);
  wrist.lineTo(w2.x, w2.y);
  wrist.lineTo(w3.x, w3.y);
  wrist.closePath();

  c.save();
  c.fillStyle = ink;
  c.fill(sleeve);
  c.restore();
  // the cuff, the wrist and the hand are cut as ONE paper piece offscreen: the gaps between the fingers and
  // the crotch of the thumb are cut through (paper-cut knuckle notches, so the hand never reads as a mitten),
  // then, with `light`, a 1.5 px rim is cut on the contour facing the lamp only
  const T = c.getTransform();
  const R = 1.35 * L;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [px, py] of [[W.x - R, W.y - R], [W.x + R, W.y - R], [W.x - R, W.y + R], [W.x + R, W.y + R]]) {
    const dx = T.a * px + T.c * py + T.e, dy = T.b * px + T.d * py + T.f;
    x0 = Math.min(x0, dx); y0 = Math.min(y0, dy); x1 = Math.max(x1, dx); y1 = Math.max(y1, dy);
  }
  x0 = Math.max(0, Math.floor(x0) - 4);
  y0 = Math.max(0, Math.floor(y0) - 4);
  x1 = Math.min(c.canvas.width, Math.ceil(x1) + 4);
  y1 = Math.min(c.canvas.height, Math.ceil(y1) + 4);
  const bw = x1 - x0, bh = y1 - y0;
  if (bw > 0 && bh > 0) {
    HAND_CV = fit(HAND_CV, bw, bh);
    const m = HAND_CV.getContext('2d')!;
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = 'source-over';
    m.clearRect(0, 0, bw, bh);
    m.setTransform(T.a, T.b, T.c, T.d, T.e - x0, T.f - y0);
    m.fillStyle = ink;
    m.fill(cuff);
    m.fill(wrist);
    const B = built(a.shape);
    m.save();
    m.translate(W.x, W.y);
    m.rotate(ang);
    m.scale(L, L * flip);
    m.fill(B.palm);
    m.strokeStyle = ink;
    m.lineCap = 'round';
    m.lineJoin = 'round';
    for (const st of B.strokes) {
      m.lineWidth = st.w;
      m.stroke(st.p);
    }
    // the cuts: a fine gap between each pair of extended fingers (from the tips back to the knuckles) and a
    // wedge at the crotch of the thumb
    m.globalCompositeOperation = 'destination-out';
    m.lineCap = 'butt';
    m.lineWidth = 0.02;
    const S = SPRITES[a.shape];
    m.beginPath();
    for (let i = 0; i < 3; i++) {
      const f0 = S.fingers[i], f1 = S.fingers[i + 1];
      if (f0.curl > 1.2 || f1.curl > 1.2) continue;
      const t0 = tipOf(f0), t1 = tipOf(f1);
      const j0 = jointOf(f0), j1 = jointOf(f1);
      const bx = (f0.base[0] + f1.base[0]) / 2 + 0.03, by = (f0.base[1] + f1.base[1]) / 2;
      m.moveTo(bx, by);
      m.lineTo((j0[0] + j1[0]) / 2, (j0[1] + j1[1]) / 2);
      m.lineTo((t0[0] + t1[0]) / 2 + 0.06 * Math.cos((f0.a + f1.a) / 2), (t0[1] + t1[1]) / 2 + 0.06 * Math.sin((f0.a + f1.a) / 2));
    }
    m.stroke();
    {
      // the thumb's crotch: a wedge between the thumb and the index, cut in from outside the hand
      const th = S.thumb;
      const tj = jointOf(th);
      const ix = S.fingers[0].base;
      m.beginPath();
      m.moveTo(0.3, -0.172);
      m.lineTo(ix[0] + 0.04, ix[1] - 0.075);
      m.lineTo(tj[0] + 0.1, tj[1] - 0.02);
      m.closePath();
      m.fill();
    }
    if (a.detail && a.detail > 0) {
      // the detail lines, kept inside the piece (source-atop), in a lamp-warm value a few steps above the ink
      m.globalCompositeOperation = 'source-atop';
      m.strokeStyle = withAlpha(mixLab(ink, mixLab(rim, env.mood.core, 0.3), 0.5), 0.6 * a.detail);
      m.lineCap = 'round';
      m.lineJoin = 'round';
      m.lineWidth = 0.011;
      m.beginPath();
      // the finger splits: between each pair of adjacent fingers, from the knuckle line out to the tips
      for (let i = 0; i < 3; i++) {
        const f0 = S.fingers[i], f1 = S.fingers[i + 1];
        const j0 = jointOf(f0), j1 = jointOf(f1);
        const bx = (f0.base[0] + f1.base[0]) / 2, by = (f0.base[1] + f1.base[1]) / 2;
        if (f0.curl > 1.2 || f1.curl > 1.2) {
          // a folded neighbour: a short split from the knuckle line only
          m.moveTo(bx - 0.02, by);
          m.lineTo(bx + 0.05, by);
          continue;
        }
        const t0 = tipOf(f0), t1 = tipOf(f1);
        m.moveTo(bx, by);
        m.lineTo((j0[0] + j1[0]) / 2, (j0[1] + j1[1]) / 2);
        m.lineTo((t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2);
      }
      m.stroke();
      // the knuckle line: a shallow arc behind the four joints, a small bump over each knuckle; the middle
      // joints of the extended fingers as short ticks; the folded fingers' knuckles as hooks at their stubs
      m.lineWidth = 0.009;
      m.beginPath();
      const kn = BASES.map((b) => [b[0] - 0.05, b[1]] as P);
      m.moveTo(kn[0][0], kn[0][1] - 0.05);
      for (let i = 0; i < kn.length; i++) {
        const [kx, ky] = kn[i];
        m.lineTo(kx, ky - 0.035);
        m.quadraticCurveTo(kx + 0.035, ky, kx, ky + 0.035);
      }
      m.stroke();
      m.beginPath();
      for (const f of S.fingers) {
        const j = jointOf(f);
        const n = f.a + Math.PI / 2;
        if (f.curl > 1.2) {
          m.moveTo(j[0] + Math.cos(n) * f.w * 0.4, j[1] + Math.sin(n) * f.w * 0.4);
          m.quadraticCurveTo(j[0] + Math.cos(f.a) * 0.03, j[1] + Math.sin(f.a) * 0.03, j[0] - Math.cos(n) * f.w * 0.4, j[1] - Math.sin(n) * f.w * 0.4);
        } else {
          m.moveTo(j[0] + Math.cos(n) * f.w * 0.3, j[1] + Math.sin(n) * f.w * 0.3);
          m.lineTo(j[0] - Math.cos(n) * f.w * 0.3, j[1] - Math.sin(n) * f.w * 0.3);
        }
      }
      // the thumb's joint and the wrist crease
      {
        const tj = jointOf(S.thumb);
        const n = S.thumb.a + Math.PI / 2;
        m.moveTo(tj[0] + Math.cos(n) * 0.035, tj[1] + Math.sin(n) * 0.035);
        m.lineTo(tj[0] - Math.cos(n) * 0.035, tj[1] - Math.sin(n) * 0.035);
        m.moveTo(0.02, -0.12);
        m.quadraticCurveTo(0.05, 0, 0.02, 0.12);
      }
      m.stroke();
    }
    m.restore();
    m.globalCompositeOperation = 'source-over';
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(HAND_CV, 0, 0, bw, bh, x0, y0, bw, bh);
    c.restore();
    if (a.light) {
      // the rim: the piece minus itself shifted away from the lamp (1.5 px at 1080p), in the mood's rim colour
      const n = Math.hypot(a.light.x, a.light.y) || 1;
      const off = 1.5 * ((env.pxScale || 1.5) / 1.5);
      RIM_CV = fit(RIM_CV, bw, bh);
      const r = RIM_CV.getContext('2d')!;
      r.setTransform(1, 0, 0, 1, 0, 0);
      r.globalCompositeOperation = 'source-over';
      r.clearRect(0, 0, bw, bh);
      r.drawImage(HAND_CV, 0, 0, bw, bh, 0, 0, bw, bh);
      r.globalCompositeOperation = 'source-in';
      r.fillStyle = mixLab(rim, env.mood.core, 0.25);
      r.fillRect(0, 0, bw, bh);
      r.globalCompositeOperation = 'destination-out';
      r.drawImage(HAND_CV, 0, 0, bw, bh, (-a.light.x / n) * off, (-a.light.y / n) * off, bw, bh);
      r.globalCompositeOperation = 'source-over';
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha *= 0.8;
      c.drawImage(RIM_CV, 0, 0, bw, bh, x0, y0, bw, bh);
      c.restore();
    }
  }
  c.save();
  // cut-lines (3): the sleeve's hard edge, the cuff's edge, one cufflink; plus two sleeve buttons
  const lw = Math.max(1, L * 0.008);
  c.lineWidth = lw;
  c.strokeStyle = withAlpha(rim, 0.5);
  c.beginPath();
  c.moveTo(s1.x, s1.y);
  c.quadraticCurveTo(sc.x, sc.y, s2.x, s2.y);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(rim, env.mood.core, 0.3), 0.4);
  c.beginPath();
  c.moveTo(c1.x, c1.y);
  c.lineTo(c2.x, c2.y);
  c.stroke();
  c.fillStyle = withAlpha(mixLab(rim, env.mood.core, 0.4), 0.55);
  const link = at(-0.25, -flip, 0.12);
  c.beginPath();
  c.arc(link.x, link.y, Math.max(1.3, L * 0.016), 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(rim, 0.3);
  for (const k of [-0.55, -0.68]) {
    const b = at(k, flip, 0.2);
    c.beginPath();
    c.arc(b.x, b.y, Math.max(1.2, L * 0.014), 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
