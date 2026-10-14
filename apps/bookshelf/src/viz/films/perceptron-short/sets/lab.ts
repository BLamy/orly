/**
 * perceptron-short — shared set: the Cornell Aeronautical Laboratory room, night (labGreen).
 * Used by ch01-s01 (title over the lab windows), ch01-s02 (the Mark I Perceptron) and the ch01-s03 bookend.
 *
 *   labRoom(f, { key, cams })      backlight · L1 far treeline · L2 back wall (tall venetian-blind
 *                                  window HOLES, glazed-tile dado, ceiling) · floor · fog A ·
 *                                  L3 hanging fluorescent fixtures (+ optional benches) · fog B
 *   …shot paints L4 (machine, puppet) and calls f.rim()…
 *   labTubes(f, { cams })          the fluorescent practicals (tube kind: steady, 1-frame dropouts)
 *   labNear(f, { key, cams, desk?, column? })   L5 near bench end (books, mug) / L6 steel column
 *   labHaze(f, { key, cams, k?, windows? })      a HAZE PLANE (z 1500, between the window wall and the
 *                                  machine): soft shafts falling from each window + a drifting bank, so
 *                                  the room has air between its planes and the camera sees it parallax
 *   labForeground(f, { key, cams, items })       a NEAR-BLACK near plane (z 480, 3 px blur, fast parallax):
 *                                  steel desk + swivel chair, a stool, a coiled cable on the floor; cut-paper
 *                                  edges, rim only on the window-facing (top) edges. Call after practicals.
 *
 * Window-facing edges only (review rounds 2-3): no prop in this set carries an all-round outline. Cut-lines
 * and rims (1-2 px) sit on top edges; the window openings carry no outline (labWall frameCuts: false), the
 * machine racks no inner light band (ch01-s02-machine bayFrame), and Rosenblatt's cut-lines fade away from the
 * windows (ch01-s02-rosenblatt ROSE_LIGHT, puppet o.light).
 *
 * Value hierarchy (review round 4), darkest to lightest: the figure (near-black PUPPET_NEAR_BLACK #0b0d0b, a
 * 1.5 px rim cut on its own contour on the window side only: the kit's edgeRim) < the near foreground plane
 * (nearBlack) ≈ the machine's ink, one step lighter than the figure, its rims 1-2 px on window-facing TOPS
 * only: every lab shot calls f.rim(SET_RIM) = straight up, the cabinet cornice rim no longer turns down a
 * corner, and no rack carries a side or bottom stroke (sideRim retired) < the back-wall rack, 16% into the
 * haze (BACK_RACK_HAZE, was 8%) < the hazed wall and the glass.
 *
 * Everything static is baked with f.cached (keyed by shot key + mood + overscan rect), so a shot
 * pays only for blits, fog, light and its own action plane. Pass the shot's camera keyframes as
 * `cams` so the art covers every framing the shot visits (overscan).
 *
 * Rest-screen geometry (CAMERA3_HOME): windows centred on x = 640 + k·LAB.pitch, glass from
 * LAB.winTop to LAB.winTop + LAB.winH; the wall meets the floor at LAB.wallFoot; the action-plane
 * floor (puppet feet / machine base) is LAB.floorY.
 */
import type { Camera3, Frame, LayerSpec } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { ceilingGrid, checkerFloor, labBench, labWall } from '../../../film/silhouette/architecture';
import { forestBand } from '../../../film/silhouette/nature';
import { fogBank } from '../../../film/silhouette/atmosphere';

export const LAB = {
  /** action-plane floor line (puppet feet, machine plinth) */
  floorY: 662,
  /** back wall meets the floor (L2) */
  wallFoot: 566,
  /** ceiling meets the back wall (L2) */
  wallTop: 58,
  pitch: 330,
  winW: 236,
  winTop: 112,
  winH: 352,
  /** glazed tile dado top (L2) */
  tileTop: 486,
  /** hanging fluorescent fixtures (L3 world): centres at 640 + 165 + k·330, tube y */
  tubeY: 64,
  tubeLen: 168,
  horizon: 380,
} as const;

/** the floor's own plane (between L3 and L2 in depth; sharp, lightly hazed) */
export const LAB_FLOOR: LayerSpec = { id: 'labFloor', z: 1250, haze: 0.08, blur: 0 };

type C = CanvasRenderingContext2D;
const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void, blur?: number) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  }, blur === undefined ? undefined : { blur })(c, r.x, r.y);
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

/** window / fixture centres covering [x0, x1] */
function centres(x0: number, x1: number, phase: number): number[] {
  const out: number[] = [];
  const k0 = Math.floor((x0 - 640 - phase) / LAB.pitch) - 1;
  const k1 = Math.ceil((x1 - 640 - phase) / LAB.pitch) + 1;
  for (let k = k0; k <= k1; k++) out.push(640 + phase + k * LAB.pitch);
  return out;
}

export interface LabRoomOpts {
  /** cache salt, normally the shot id */
  key: string;
  /** the shot's camera keyframes (rest, end, any waypoints) */
  cams: Camera3[];
  /** backlight sun centre (stage px); default 640 */
  sunX?: number;
  /** backlight intensity (fade-ups); default 1 */
  light?: number;
  /** venetian blind openness 0..1; default 0.82 */
  blinds?: number;
  /** fraction of each window above the drawn-up blinds (bare glass); default 0.36 */
  raise?: number;
  /** L3 lab benches along the wall: left x of each (L3 world); default none */
  benches?: number[];
  /** fog A alpha multiplier; default 1 */
  fog?: number;
}

/** backlight → fog B: everything behind the action plane. Call first, after f.camera(). */
export function labRoom(f: Frame, o: LabRoomOpts) {
  const blinds = o.blinds ?? 0.82;
  // night glow behind the blinds: the sun ellipse sits at window mid-height and is wide, so every
  // window reads as the brightest thing in the room (bible §2.1: glass ≈ L* 60, wall ≈ L* 27–34)
  f.backlight({ sunX: o.sunX ?? 640, sunY: 330, sunRadius: 860, intensity: 1.5 * (o.light ?? 1) });

  // L1 — a far treeline under the night sky, seen only through the blinds
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 60);
    bake(f, c, `${o.key}/lab/L1/${env.mood.id}/${rk(r)}`, r, (cc) => {
      // a soft night glow outside (screen-wide band, brightest low): lifts the glass to ≈ L* 55–62
      cc.save();
      const gl = cc.createLinearGradient(0, LAB.winTop - 40, 0, LAB.winTop + LAB.winH + 20);
      gl.addColorStop(0, withAlpha(env.mood.halo, 0.12));
      gl.addColorStop(0.72, withAlpha(env.mood.halo, 0.55));
      gl.addColorStop(1, withAlpha(env.mood.halo, 0.4));
      cc.fillStyle = gl;
      cc.fillRect(r.x, LAB.winTop - 40, r.w, LAB.winH + 60);
      cc.restore();
      forestBand(cc, { x0: r.x, x1: r.x + r.w, y: 452, h: 40, kind: 'mixed', density: 2.6, seed: 58, ground: 300 }, env);
    });
  });

  // L2 — ceiling + back wall with tall blind windows (holes), tile dado
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 48);
    const wins = centres(r.x, r.x + r.w, 0);
    bake(f, c, `${o.key}/lab/L2/${env.mood.id}/${rk(r)}/${blinds}/${o.raise ?? 0.36}`, r, (cc) => {
      ceilingGrid(cc, { x0: r.x, x1: r.x + r.w, yTop: Math.min(r.y, -40), yBack: LAB.wallTop, horizon: LAB.horizon, vpX: 640, tile: 110 }, env);
      labWall(cc, {
        x: r.x,
        y: LAB.wallTop,
        w: r.w,
        h: LAB.wallFoot - LAB.wallTop,
        windows: wins,
        winW: LAB.winW,
        winTop: LAB.winTop,
        winH: LAB.winH,
        blinds,
        tileTop: LAB.tileTop,
        tile: 15,
        // review round 3: no all-round light cut-line around the openings (the reveals and sill below carry the
        // depth; only the sill top, which faces the glass, keeps a 1 px rim)
        frameCuts: false,
      }, env);
      // upper sashes: blinds drawn up to `raise`, so bare glass (six lights) glows above the slats
      const raise = LAB.winH * (o.raise ?? 0.36);
      const deep = mixLab(env.fill('set'), env.mood.fg, 0.45);
      cc.save();
      cc.globalCompositeOperation = 'destination-out';
      for (const x of wins) cc.fillRect(x - LAB.winW / 2, LAB.winTop, LAB.winW, raise);
      cc.restore();
      cc.fillStyle = env.fill('set');
      for (const x of wins) {
        const x0 = x - LAB.winW / 2;
        cc.fillRect(x0 + LAB.winW * 0.25 - 1.5, LAB.winTop, 3, raise);
        cc.fillRect(x0 + LAB.winW * 0.75 - 1.5, LAB.winTop, 3, raise);
        cc.fillRect(x0, LAB.winTop + raise * 0.5 - 1.5, LAB.winW, 3);
        // the raised blind: a tight stack of slats + bottom rail, cords hanging
        cc.fillStyle = deep;
        cc.fillRect(x0 + 2, LAB.winTop + raise - 4, LAB.winW - 4, 16);
        cc.fillStyle = env.fill('set');
      }
      // deep window reveals + sills: a darker frame band so each opening reads as a recess
      cc.fillStyle = deep;
      for (const x of wins) {
        const x0 = x - LAB.winW / 2;
        cc.fillRect(x0 - 10, LAB.winTop - 10, LAB.winW + 20, 10); // head
        cc.fillRect(x0 - 10, LAB.winTop, 10, LAB.winH); // jambs
        cc.fillRect(x0 + LAB.winW, LAB.winTop, 10, LAB.winH);
        cc.fillRect(x0 - 16, LAB.winTop + LAB.winH, LAB.winW + 32, 9); // sill
        cc.fillRect(x - 3, LAB.winTop, 6, LAB.winH); // centre mullion (two sashes)
        cc.fillRect(x0, LAB.winTop + LAB.winH * 0.5 - 3, LAB.winW, 6); // meeting rail
      }
      // skirting
      cc.fillRect(r.x, LAB.wallFoot - 12, r.w, 12);
      cc.fillStyle = withAlpha(env.mood.rim, 0.1);
      for (const x of wins) cc.fillRect(x - LAB.winW / 2 - 16, LAB.winTop + LAB.winH, LAB.winW + 32, 1.2);
    });
  });

  // floor — a 1950s linoleum tile, low contrast, faint sheen under each window
  f.layer(LAB_FLOOR, (c, env) => {
    const r = overscan(LAB_FLOOR, o.cams, 60);
    const y0 = LAB.wallFoot - 2;
    const fr: Rect = { x: r.x, y: y0, w: r.w, h: Math.max(160, r.y + r.h - y0) };
    const wins = centres(r.x, r.x + r.w, 0);
    bake(f, c, `${o.key}/lab/floor/${env.mood.id}/${rk(fr)}`, fr, (cc) => {
      checkerFloor(cc, {
        x0: fr.x,
        x1: fr.x + fr.w,
        yBack: y0,
        yFront: fr.y + fr.h,
        horizon: LAB.horizon,
        vpX: 640,
        tile: 64,
        contrast: 0.22,
        sheen: wins.map((x) => ({ x, w: LAB.winW * 0.8 })),
      }, env);
    });
  });

  f.fog({ yCenter: 720 * 0.6, height: 720 * 0.4, alpha: 0.22 * (o.fog ?? 1) });

  // L3 — hanging fluorescent fixtures across the room (+ optional benches)
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, o.cams, 40);
    const tubes = centres(r.x, r.x + r.w, LAB.pitch / 2);
    const benches = o.benches ?? [];
    bake(f, c, `${o.key}/lab/L3/${env.mood.id}/${rk(r)}/${benches.join(',')}`, r, (cc) => {
      cc.fillStyle = env.fill('set');
      const L = LAB.tubeLen;
      for (const x of tubes) {
        cc.fillRect(x - L * 0.36 - 0.8, r.y, 1.6, LAB.tubeY - r.y); // chains
        cc.fillRect(x + L * 0.36 - 0.8, r.y, 1.6, LAB.tubeY - r.y);
        cc.fillRect(x - L / 2, LAB.tubeY, L, 7); // housing
        cc.beginPath();
        cc.moveTo(x - L / 2 - 6, LAB.tubeY + 7);
        cc.lineTo(x + L / 2 + 6, LAB.tubeY + 7);
        cc.lineTo(x + L / 2 - 2, LAB.tubeY + 13);
        cc.lineTo(x - L / 2 + 2, LAB.tubeY + 13);
        cc.closePath();
        cc.fill();
      }
      for (const bx of benches) labBench(cc, { x: bx, y: 640, w: 380, seed: Math.round(bx) & 31, sink: bx % 2 === 0 }, env);
    });
    // the tubes themselves glow on ones (core colour; the practical adds the halo)
    c.fillStyle = withAlpha(env.mood.core, 0.92);
    for (const x of tubes) c.fillRect(x - LAB.tubeLen / 2 + 5, LAB.tubeY + 13, LAB.tubeLen - 10, 3.4);
  });

  f.fog({ yCenter: 720 * 0.7, height: 720 * 0.22, alpha: 0.12 * (o.fog ?? 1) });
}

/** fluorescent practicals on the L3 fixtures (call after f.rim()). */
export function labTubes(f: Frame, o: { cams: Camera3[]; intensity?: number; radius?: number }) {
  const r = overscan(LAYERS.L3, o.cams, 40);
  for (const x of centres(r.x, r.x + r.w, LAB.pitch / 2)) {
    const k = Math.round((x - 640 - LAB.pitch / 2) / LAB.pitch);
    f.practical({ x, y: LAB.tubeY + 15, kind: 'tube', seed: 400 + k * 7, intensity: o.intensity ?? 0.42, radius: o.radius ?? 80, layer: 'L3' });
  }
}

export interface LabNearOpts {
  key: string;
  cams: Camera3[];
  /** L5 near bench end: left x, width (default 560), top y (default 652) — books, clipboard, mug */
  desk?: { x: number; w?: number; top?: number };
  /** L6 steel column crossing the frame at this world x */
  column?: { x: number };
}

/** near framing: blurred bench end (L5) and/or a dark steel column (L6). Call after practicals. */
export function labNear(f: Frame, o: LabNearOpts) {
  if (o.desk) {
    const d = o.desk;
    const w = d.w ?? 560;
    f.layer('L5', (c, env) => {
      const r: Rect = { x: d.x - 20, y: 560, w: w + 40, h: 300 };
      bake(f, c, `${o.key}/lab/L5bench/${env.mood.id}/${d.x}/${w}`, r, (cc) => {
        // a near bench end crossing the bottom of frame: slab, apron, a leg, and what sits on it
        const top = d.top ?? 652;
        cc.fillStyle = env.fill('fg');
        cc.fillRect(d.x, top, w, 12); // slab
        cc.fillRect(d.x + 8, top + 12, w - 16, 70); // apron + drawers
        cc.fillRect(d.x + w - 40, top + 12, 26, 200); // leg
        // books lying flat, a clipboard, a mug
        const bx = d.x + w * 0.18;
        cc.fillRect(bx, top - 14, 120, 14);
        cc.fillRect(bx + 8, top - 25, 104, 11);
        cc.fillRect(bx + 3, top - 36, 112, 11);
        cc.fillRect(d.x + w * 0.55, top - 4, 92, 4); // clipboard
        cc.fillRect(d.x + w * 0.55 + 36, top - 9, 20, 5);
        const mx = d.x + w * 0.78;
        cc.fillRect(mx, top - 30, 26, 30); // mug
        cc.beginPath();
        cc.arc(mx + 28, top - 16, 9, -Math.PI / 2, Math.PI / 2);
        cc.lineWidth = 5;
        cc.strokeStyle = env.fill('fg');
        cc.stroke();
        cc.fillStyle = withAlpha(env.mood.rim, 0.08);
        cc.fillRect(d.x, top, w, 1.5);
      });
    });
  }
  if (o.column) {
    const x = o.column.x;
    f.layer('L6', (c, env) => {
      bake(f, c, `${o.key}/lab/L6col/${env.mood.id}/${x}`, { x: x - 90, y: -200, w: 180, h: 1120 }, (cc) => {
        cc.fillStyle = env.fill('fg');
        cc.fillRect(x - 34, -200, 68, 1120); // web
        cc.fillRect(x - 52, -200, 14, 1120); // flanges
        cc.fillRect(x + 38, -200, 14, 1120);
        // (review round 4: no rim down the column's side edge; set pieces carry light on window-facing tops only)
      });
    });
  }
}

// =====================================================================================================
// air and foreground (review round 1, set craft): three or more planes moving at different speeds
// =====================================================================================================

/** the haze plane: between the window wall (L2, z 1800) and the fixtures/benches (L3, z 1300) */
export const LAB_HAZE: LayerSpec = { id: 'labHaze', z: 1520, haze: 0, blur: 0 };
/** the near plane: closer than the action plane, softly out of focus (props read as cut card). Review round 2:
 *  pulled closer (z 560 → 480: it now slides ≈1.4× faster than before against the action plane) and softer */
export const LAB_NEAR: LayerSpec = { id: 'labNear', z: 480, haze: 0, blur: 3.0 };
/** near-black for the foreground plane: below the mood's fg, so the furniture separates from the ink racks */
export const nearBlack = (fg: string) => mixLab(fg, '#000000', 0.6);

export interface LabHazeOpts {
  key: string;
  cams: Camera3[];
  /** overall strength 0..1.5 (default 1) */
  k?: number;
  /** window centre x (L2 world) that is hottest (default 640) */
  hot?: number;
}

/**
 * Haze plane (z 1520): for every window, a soft wedge of light falling forward and down through the
 * room (baked, blurred), brighter under the hot window, plus a slow drifting bank at sill height.
 * It moves at its own parallax speed, between the wall and the machine.
 */
export function labHaze(f: Frame, o: LabHazeOpts) {
  const k = o.k ?? 1;
  if (k <= 0.002) return;
  const hot = o.hot ?? 640;
  f.layer(LAB_HAZE, (c, env) => {
    const r = overscan(LAB_HAZE, o.cams, 80);
    const wins = centres(r.x, r.x + r.w, 0);
    const col = mixLab(env.mood.haze, env.mood.halo, 0.45);
    c.save();
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = Math.min(1, k);
    bake(f, c, `${o.key}/lab/haze/${env.mood.id}/${rk(r)}/${hot}`, r, (cc) => {
      for (const wx of wins) {
        const hk = Math.max(0.45, 1 - Math.abs(wx - hot) / (LAB.pitch * 2.2));
        const y0 = LAB.winTop + LAB.winH * 0.3;
        const y1 = LAB.floorY + 30;
        const g = cc.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, withAlpha(col, 0));
        g.addColorStop(0.25, withAlpha(col, 0.2 * hk));
        g.addColorStop(0.7, withAlpha(col, 0.12 * hk));
        g.addColorStop(1, withAlpha(col, 0));
        cc.fillStyle = g;
        cc.beginPath();
        cc.moveTo(wx - LAB.winW * 0.46, y0);
        cc.lineTo(wx + LAB.winW * 0.46, y0);
        cc.lineTo(wx + LAB.winW * 0.2 - 40, y1);
        cc.lineTo(wx - LAB.winW * 1.05 - 40, y1);
        cc.closePath();
        cc.fill();
      }
      // a low luminous band of air at sill height, between the glass and the machine
      const b = cc.createLinearGradient(0, LAB.winTop + LAB.winH - 60, 0, LAB.wallFoot + 40);
      b.addColorStop(0, withAlpha(col, 0));
      b.addColorStop(0.5, withAlpha(col, 0.16));
      b.addColorStop(1, withAlpha(col, 0));
      cc.fillStyle = b;
      cc.fillRect(r.x, LAB.winTop + LAB.winH - 60, r.w, LAB.wallFoot - LAB.winTop - LAB.winH + 100);
    }, 14);
    c.restore();
    fogBank(c, { y: LAB.winTop + LAB.winH + 30, height: 120, speed: 7, density: 0.22 * k, x0: r.x - 60, x1: r.x + r.w + 60, color: mixLab(env.mood.haze, env.mood.halo, 0.25), salt: 23 }, env);
  });
}

export type LabNearItem =
  | { kind: 'desk'; x: number; w?: number; s?: number; flip?: boolean }
  | { kind: 'chair'; x: number; s?: number; flip?: boolean }
  | { kind: 'stool'; x: number; s?: number }
  /** y: the surface the coil lies on (default the floor; e.g. a stool seat) */
  | { kind: 'coil'; x: number; s?: number; y?: number };

export interface LabForegroundOpts {
  key: string;
  cams: Camera3[];
  items: readonly LabNearItem[];
  /** floor line on the near plane (rest-screen y; default 742 = just below frame, items rise into it) */
  floor?: number;
  /** the plane (default LAB_NEAR, z 480). A shot whose camera dollies deep uses a farther one (e.g. z 700). */
  plane?: LayerSpec;
}

/** world y of a stool's seat top for item scale s (labForeground units), on floor y */
export const stoolSeatY = (floor: number, s = 1) => floor - (62 + 7) * s * 2.2;

const hj = (i: number, s: number) => {
  let x = Math.imul(i ^ 0x2545f491, 0x9e3779b1) ^ Math.imul(s + 7, 0x85ebca6b);
  x ^= x >>> 15;
  x = Math.imul(x, 0x2c1b3c6d);
  x ^= x >>> 12;
  return ((x >>> 0) / 4294967296) * 2 - 1;
};

/** a cut-card polygon: the straight edges of `pts` re-cut by hand (small deterministic wobble) */
function cutPoly(p: Path2D, pts: [number, number][], seed: number, wob = 1.1) {
  pts.forEach(([x, y], i) => {
    const [nx, ny] = pts[(i + 1) % pts.length];
    const L = Math.hypot(nx - x, ny - y);
    const n = Math.max(1, Math.round(L / 18));
    for (let j = 0; j < n; j++) {
      const u = j / n;
      const px = x + (nx - x) * u + (j ? hj(i * 31 + j, seed) * wob : 0);
      const py = y + (ny - y) * u + (j ? hj(i * 37 + j, seed + 1) * wob : 0);
      if (i === 0 && j === 0) p.moveTo(px, py);
      else p.lineTo(px, py);
    }
  });
  p.closePath();
}

function stoolArt(c: CanvasRenderingContext2D, x: number, y: number, s: number, ink: string, rim: string) {
  const p = new Path2D();
  const sh = 62 * s; // seat height
  // round seat seen nearly edge-on: a thick slab with a rolled edge
  cutPoly(p, [[x - 24 * s, y - sh - 7 * s], [x + 24 * s, y - sh - 7 * s], [x + 22 * s, y - sh], [x - 22 * s, y - sh]], 41, 0.8 * s);
  // three splayed legs + a foot ring
  for (const [a, b] of [
    [-16, -30],
    [16, 30],
    [-3, -4],
  ]) {
    cutPoly(p, [[x + a * s - 2.2 * s, y - sh], [x + a * s + 2.2 * s, y - sh], [x + b * s + 2 * s, y], [x + b * s - 2.6 * s, y]], 43 + a, 0.6 * s);
  }
  cutPoly(p, [[x - 24 * s, y - sh * 0.36], [x + 24 * s, y - sh * 0.36], [x + 24 * s, y - sh * 0.36 + 3 * s], [x - 24 * s, y - sh * 0.36 + 3 * s]], 47, 0.5 * s);
  c.fillStyle = ink;
  c.fill(p);
  c.fillStyle = rim;
  c.fillRect(x - 23 * s, y - sh - 7.6 * s, 46 * s, 1.4);
}

function coilArt(c: CanvasRenderingContext2D, x: number, y: number, s: number, ink: string, rim: string) {
  // a coiled cable lying on the floor: loops seen in perspective (flat ellipses), a lead running off
  c.save();
  c.strokeStyle = ink;
  c.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const rx = (46 + i * 3.2 + hj(i, 51) * 2) * s;
    const ry = (9 + i * 0.7) * s;
    c.lineWidth = 4.6 * s;
    c.beginPath();
    c.ellipse(x + hj(i, 52) * 3 * s, y - ry - i * 2.2 * s, rx, ry, hj(i, 53) * 0.05, 0, Math.PI * 2);
    c.stroke();
  }
  c.lineWidth = 4.2 * s;
  c.beginPath();
  c.moveTo(x + 50 * s, y - 14 * s);
  c.bezierCurveTo(x + 90 * s, y - 4 * s, x + 120 * s, y + 6 * s, x + 190 * s, y + 4 * s);
  c.stroke();
  // the plug
  c.fillStyle = ink;
  c.fillRect(x + 186 * s, y - 3 * s, 16 * s, 10 * s);
  c.fillRect(x + 200 * s, y - 1 * s, 6 * s, 2 * s);
  c.fillRect(x + 200 * s, y + 3 * s, 6 * s, 2 * s);
  // rim on the top loop only (it faces the windows)
  c.strokeStyle = rim;
  c.lineWidth = 1.2;
  c.beginPath();
  c.ellipse(x, y - (9 + 5 * 0.7) * s - 5 * 2.2 * s - 2.2 * s, (46 + 16) * s, (9 + 3.5) * s, 0, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  c.restore();
}

/** a 1950s steel desk end in elevation: slab, a drawer pedestal, a modesty panel, a kick plinth */
function deskArt(c: CanvasRenderingContext2D, x: number, y: number, s: number, w: number, flip: boolean, ink: string, rim: string) {
  const d = flip ? -1 : 1;
  const top = y - 132 * s;
  const L = x - (w / 2) * s;
  const R = x + (w / 2) * s;
  const p = new Path2D();
  cutPoly(p, [[L - 4 * s, top - 9 * s], [R + 4 * s, top - 9 * s], [R + 4 * s, top], [L - 4 * s, top]], 61, 0.9 * s); // slab
  const pw = 74 * s; // pedestal
  const px0 = d > 0 ? R - pw - 6 * s : L + 6 * s;
  cutPoly(p, [[px0, top], [px0 + pw, top], [px0 + pw, y - 7 * s], [px0, y - 7 * s]], 62, 0.8 * s);
  cutPoly(p, [[px0 + 3 * s, y - 7 * s], [px0 + pw - 3 * s, y - 7 * s], [px0 + pw - 3 * s, y], [px0 + 3 * s, y]], 63, 0.5 * s); // kick
  const ox = d > 0 ? L + 8 * s : R - 30 * s; // the open end: a modesty panel and a leg
  cutPoly(p, [[ox, top], [ox + 22 * s, top], [ox + 22 * s, y], [ox, y]], 64, 0.8 * s);
  cutPoly(p, [[Math.min(ox, px0), top], [Math.max(ox, px0) + 22 * s, top], [Math.max(ox, px0) + 22 * s, top + 28 * s], [Math.min(ox, px0), top + 28 * s]], 65, 0.6 * s);
  c.fillStyle = ink;
  c.fill(p);
  // drawer pulls: small notches cut out of the pedestal face (the haze shows through)
  c.save();
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 3; i++) {
    const yy = top + (24 + i * 34) * s;
    c.fillRect(px0 + pw / 2 - 9 * s, yy, 18 * s, 2.6 * s);
  }
  c.restore();
  c.fillStyle = rim;
  c.fillRect(L - 4 * s, top - 9.6 * s, R - L + 8 * s, 1.6);
}

/** a steel office swivel chair, side view (faces +x unless flip): curved back on a post, cushion, column, star base on casters */
function chairArt(c: CanvasRenderingContext2D, x: number, y: number, s: number, flip: boolean, ink: string, rim: string) {
  const d = flip ? -1 : 1;
  const X = (u: number) => x + d * u * s;
  const p = new Path2D();
  const seat = y - 50 * s;
  cutPoly(p, [[X(-24), seat - 9 * s], [X(22), seat - 10 * s], [X(25), seat - 2 * s], [X(-22), seat + 1 * s]], 71, 0.7 * s); // cushion
  cutPoly(p, [[X(-4), seat], [X(4), seat], [X(3), y - 12 * s], [X(-3), y - 12 * s]], 72, 0.4 * s); // column
  // back: a tilted, curved panel on a bent post
  cutPoly(p, [[X(-30), seat - 52 * s], [X(-20), seat - 56 * s], [X(-17), seat - 30 * s], [X(-26), seat - 26 * s]], 73, 0.6 * s);
  cutPoly(p, [[X(-22), seat - 28 * s], [X(-19), seat - 28 * s], [X(-12), seat - 4 * s], [X(-16), seat - 4 * s]], 74, 0.3 * s);
  // star base: two legs seen in elevation + casters
  cutPoly(p, [[X(-3), y - 14 * s], [X(3), y - 14 * s], [X(28), y - 7 * s], [X(28), y - 4 * s], [X(-28), y - 4 * s], [X(-28), y - 7 * s]], 75, 0.4 * s);
  for (const u of [-25, 25]) {
    p.moveTo(X(u) + 3.6 * s, y - 3.6 * s);
    p.arc(X(u), y - 3.6 * s, 3.6 * s, 0, Math.PI * 2);
  }
  c.fillStyle = ink;
  c.fill(p);
  // rim: the top of the back and the cushion (window-facing)
  c.strokeStyle = rim;
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(X(-30), seat - 52.6 * s);
  c.lineTo(X(-20), seat - 56.6 * s);
  c.moveTo(X(-22), seat - 10 * s);
  c.lineTo(X(20), seat - 10.6 * s);
  c.stroke();
}

/**
 * The near plane (z 560, 2.2 px blur): dark cut-card furniture crossing the bottom of frame, all hand-cut
 * here (chunky members: thin kit hairlines go grey under the near blur). Rim only on the window-facing
 * top edges. Static: baked once per key.
 */
export function labForeground(f: Frame, o: LabForegroundOpts) {
  const floor = o.floor ?? 742;
  const plane = o.plane ?? LAB_NEAR;
  f.layer(plane, (c, env) => {
    const r = overscan(plane, o.cams, 40);
    const ink = nearBlack(env.fill('fg'));
    const rim = withAlpha(env.mood.rim, 0.26);
    const key = o.items.map((i) => `${i.kind}${Math.round(i.x)}${'s' in i ? i.s ?? '' : ''}${'flip' in i && i.flip ? 'f' : ''}${'y' in i ? i.y ?? '' : ''}`).join(',');
    const art: Rect = { x: r.x - 80, y: 380, w: r.w + 160, h: floor - 380 + 120 };
    bake(f, c, `${o.key}/lab/near2/${plane.id}/${env.mood.id}/${rk(art)}/${floor}/${key}`, art, (cc) => {
      for (const it of o.items) {
        const s = it.s ?? 1;
        if (it.kind === 'desk') deskArt(cc, it.x, floor, s * 1.6, it.w ?? 150, !!it.flip, ink, rim);
        else if (it.kind === 'chair') chairArt(cc, it.x, floor, s * 2.3, !!it.flip, ink, rim);
        else if (it.kind === 'stool') stoolArt(cc, it.x, floor, s * 2.2, ink, rim);
        else coilArt(cc, it.x, (it.y ?? floor) - 6, s * 1.6, ink, rim);
      }
    });
  });
}
