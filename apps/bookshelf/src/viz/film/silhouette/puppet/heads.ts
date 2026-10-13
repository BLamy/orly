/**
 * Parametric PROFILE heads (style bible §4.1): skull, brow, nose, lips, chin,
 * jaw and throat as one smooth cut-out, plus facial hair and glasses.
 * No eyes, no mouth lines, never caricature: every parameter moves a landmark
 * a few percent of the head height, inside the range of real faces.
 *
 *   headArt(o)   -> { pieces, lens?, cuts, eye, top, chin }   (head-local, origin = neck-top pivot)
 *   HEAD_PIVOT   -> where the neck attaches, in head units (chin at y 0, ear at x 0)
 *
 * o: { h (head height, units), fig 'm'|'f', profile {nose, brow, chin, jaw} 0..1,
 *      facialHair, glasses, era }
 * Glasses are drawn as lit lenses (ink→rim mix) with an ink frame and a rim
 * temple arm, so they read at 64 px without punching through the layer.
 */
import type { PuppetSpec } from '../../contracts';
import type { Cut, Figure } from './body';
import { curve, ellipsePath, lerp, smooth, sxy, type Pt } from './rig';

/** neck-top pivot in head units (chin = y 0, ear canal = x 0, head height 1) */
export const HEAD_PIVOT: [number, number] = [-0.06, -0.3];

export interface HeadOpts {
  h: number;
  fig: Figure;
  profile?: PuppetSpec['profile'];
  facialHair?: PuppetSpec['facialHair'];
  glasses?: PuppetSpec['glasses'];
  era: PuppetSpec['era'];
}

export interface HeadArt {
  /** ink pieces, head-local units */
  pieces: Path2D[];
  /** lens shape (lit) and frame stroke, drawn after the ink */
  lens?: { fill: Path2D; frame: Path2D; frameW: number };
  cuts: Cut[];
  eye: [number, number];
  top: [number, number];
  chin: [number, number];
  /** skull landmarks used by hair/hats (head units, before scaling) */
}

/** The skull + face outline in head units (chin at y 0). */
export function profilePoints(fig: Figure, pr: PuppetSpec['profile'] = {}): Pt[] {
  const f = fig === 'f';
  const nose = pr.nose ?? (f ? 0.35 : 0.5);
  const brow = pr.brow ?? (f ? 0.2 : 0.5);
  const chin = pr.chin ?? (f ? 0.4 : 0.5);
  const jaw = pr.jaw ?? (f ? 0.3 : 0.5);
  const nx = 0.475 + nose * 0.05; // nose tip x
  const ny = -0.335 + nose * 0.012;
  const bx = 0.395 + brow * 0.024;
  const cx = 0.37 + chin * 0.035;
  return [
    [-0.3, -0.16],
    [-0.4, -0.3],
    [-0.455, -0.48],
    [-0.44, -0.7],
    [-0.33, -0.89],
    [-0.12, -0.995],
    [0.12, -0.975],
    [0.3, -0.87],
    [0.375, -0.72],
    [bx, -0.585, 0.9],
    [0.384 + brow * 0.006, -0.52, 0.7],
    [lerp(0.4, nx, 0.45), -0.445],
    [nx, ny, 0.55],
    [nx - 0.03, ny + 0.042, 0.6],
    [0.415, -0.272, 0.45],
    [0.428 - (f ? 0.004 : 0), -0.215, 0.85],
    [0.413, -0.184, 0.8],
    [0.418 - (f ? 0.004 : 0), -0.152, 0.85],
    [0.378 + chin * 0.008, -0.1, 0.8],
    [cx, -0.04, 0.85],
    [cx - 0.06, 0.006, 0.8],
    [0.22 - jaw * 0.04, 0.02 + jaw * 0.02],
    [0.13 - jaw * 0.02, 0.06],
    [0.06, 0.16, 0],
    [-0.22, 0.12, 0],
  ];
}

export function headArt(o: HeadOpts): HeadArt {
  const h = o.h;
  const [px, py] = HEAD_PIVOT;
  const S = (pts: Pt[]) => sxy(pts, h, -px * h, -py * h);
  const P = (x: number, y: number): [number, number] => [(x - px) * h, (y - py) * h];
  const cuts: Cut[] = [];
  const pieces: Path2D[] = [smooth(S(profilePoints(o.fig, o.profile)))];
  const pr = o.profile ?? {};
  const chin = 0.37 + (pr.chin ?? (o.fig === 'f' ? 0.4 : 0.5)) * 0.035;
  const fh = o.facialHair ?? 'none';
  const pencil = o.era === '1940s' || o.era === '1950s';
  if (fh === 'moustache' || fh === 'goatee' || fh === 'beard') {
    const m: Pt[] = pencil && fh === 'moustache'
      ? [[0.4, -0.268], [0.452, -0.236, 0.6], [0.438, -0.222, 0.5], [0.4, -0.234]]
      : [[0.39, -0.272], [0.455, -0.245, 0.7], [0.462, -0.208, 0.6], [0.43, -0.198, 0.6], [0.39, -0.215]];
    pieces.push(smooth(S(m)));
  }
  if (fh === 'goatee') {
    pieces.push(smooth(S([[0.37, -0.15], [0.42, -0.135], [chin + 0.035, -0.06, 0.8], [chin + 0.01, 0.045, 0.7], [chin - 0.08, 0.04], [0.3, -0.05]])));
  }
  if (fh === 'beard') {
    // close-trimmed beard: thickens the jaw and squares the chin
    pieces.push(smooth(S([[-0.02, -0.5], [0.03, -0.3], [0.14, -0.2], [0.33, -0.14], [0.415, -0.15], [chin + 0.035, -0.07, 0.8], [chin + 0.025, 0.035, 0.7], [chin - 0.08, 0.075], [0.16, 0.08], [0.02, 0.0], [-0.08, -0.3]])));
    cuts.push({ id: 'beardEdge', path: curve(S([[0.0, -0.48], [0.06, -0.3], [0.2, -0.2], [0.33, -0.18]])), alpha: 0.32 });
  }
  if (fh === 'fullBeard') {
    pieces.push(smooth(S([[0.405, -0.272], [0.448, -0.255, 0.7], [0.456, -0.215, 0.7], [0.425, -0.19], [0.4, -0.2]])));
    pieces.push(
      smooth(S([
        [-0.03, -0.52], [0.04, -0.34], [0.18, -0.22], [0.33, -0.17, 0.8], [0.405, -0.135], [chin + 0.035, -0.07, 0.8], [chin + 0.045, 0.05],
        [chin + 0.01, 0.15, 0.8], [chin - 0.07, 0.205, 0.8], [0.2, 0.19], [0.1, 0.13], [0.03, 0.04], [-0.08, -0.28],
      ])),
    );
    cuts.push({ id: 'beardLocks', path: curve(S([[0.31, -0.02], [0.32, 0.08], [0.29, 0.16]])), alpha: 0.3 });
  }
  if (fh === 'stubble') {
    pieces.push(smooth(S([[0.05, -0.3], [0.2, -0.12], [chin + 0.008, -0.04], [chin - 0.05, 0.016], [0.14, 0.07], [0.04, -0.1]])));
  }
  let lens: HeadArt['lens'];
  const g = o.glasses ?? 'none';
  if (g !== 'none') {
    // lens sits just in front of the eye, its front edge outside the brow–cheek hollow
    const cx = 0.392;
    const cy = -0.49;
    // seen in profile the lens is foreshortened: narrow and tall, just ahead of the eye
    const dims: Record<string, [number, number, number]> = {
      round: [0.042, 0.062, 0.014],
      browline: [0.046, 0.054, 0.018],
      heavy: [0.05, 0.06, 0.026],
      rimless: [0.042, 0.05, 0.008],
      rectangular: [0.046, 0.044, 0.014],
    };
    const [rx, ry, fw] = dims[g] ?? dims.round;
    if (g === 'rectangular' || g === 'heavy' || g === 'browline') {
      const r = g === 'rectangular' ? 0.012 : 0.02;
      const x0 = (cx - rx - px) * h;
      const y0 = (cy - ry - py) * h;
      const x1 = (cx + rx - px) * h;
      const y1 = (cy + ry - py) * h;
      const rr = r * h;
      const p = new Path2D();
      p.moveTo(x0 + rr, y0);
      p.lineTo(x1 - rr, y0);
      p.quadraticCurveTo(x1, y0, x1, y0 + rr);
      p.lineTo(x1, y1 - rr * (g === 'browline' ? 2 : 1));
      p.quadraticCurveTo(x1, y1, x1 - rr * 2, y1);
      p.lineTo(x0 + rr * 2, y1);
      p.quadraticCurveTo(x0, y1, x0, y1 - rr * 2);
      p.lineTo(x0, y0 + rr);
      p.quadraticCurveTo(x0, y0, x0 + rr, y0);
      p.closePath();
      lens = { fill: p, frame: p, frameW: fw * h };
    } else {
      const p = ellipsePath(...P(cx, cy), rx * h, ry * h);
      lens = { fill: p, frame: p, frameW: fw * h };
    }
    const arm = curve(S([[cx - rx, cy - ry * 0.6], [0.15, -0.53], [-0.04, -0.5], [-0.09, -0.44]]));
    cuts.push({ id: 'glassesArm', path: arm, alpha: 0.4, w: g === 'heavy' ? 1.5 : 1.1 });
    if (g === 'browline' || g === 'heavy') {
      // the heavy upper rim reads as a dark brow bar outside the lens
      const bar = smooth(S([[cx - rx - 0.004, cy - ry - 0.012, 0], [cx + rx + 0.006, cy - ry - 0.012, 0], [cx + rx + 0.006, cy - ry * 0.35, 0], [cx - rx - 0.004, cy - ry * 0.35, 0]]));
      pieces.push(bar);
    }
  }
  return {
    pieces,
    lens,
    cuts,
    eye: P(0.33, -0.5),
    top: P(-0.1, -1.0),
    chin: P(chin - 0.02, 0),
  };
}
