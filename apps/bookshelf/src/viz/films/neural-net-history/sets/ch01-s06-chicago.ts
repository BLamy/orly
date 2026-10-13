/**
 * neural-net-history — CHICAGO AT NIGHT, 1940s (ch01-s06's landing image and ch01-s07's opening).
 *
 * The Rewind lands here: a 1940s brick walk-up on the right third, silhouetted against a duskRose sky that
 * deepens to night (CHI_NIGHT: the same hue family, a little cooler, its ramp walked down the ladder so the
 * building's ink still reads ΔL* ≥ 25 against the city glow). Planes, far to near:
 *   L1   stars, a thin moon, a far skyline of FLAT-TOPPED 1940s blocks, setback towers and roof tanks
 *   L2   a row of nearer walk-ups with a water tank
 *   L3   the El: a lattice-girder deck (X-braced, the dusk through its holes) on straight columns with knee
 *        braces, the same girder as ch02-s01's El; a dark, unlit train crawls along it left → right
 *   L4   the walk-up (the one sharp plane): cornice with brackets and a dentil course, stone lintels with
 *        keystones and sills, a fire escape cut in ink with lit edges, a rooftop tank; one top-floor window
 *        whose table lamp clicks on (the shot's one warm accent): a soft halo round the window, a warm catch on
 *        the sill and the fire escape's nearest rails (no beam down the facade)
 *   NEAR the roof we stand on: parapet and a chimney stack (z 360, ≈ 2× L5's parallax in the truck)
 *   L6   a clothesline across the top left, soft
 *
 * ONE CAMERA for both shots, a pure function of T = seconds from the s06 → s07 cut (negative in s06):
 * a slow truck and push toward the window through s06, then (s07) an accelerating dolly into the window
 * while the lamplight swells to fill the frame. Both shots evaluate the same chiCam(T), so the 1 s
 * crossfade between them is a true match-dissolve.
 *
 *   chicagoNight(f, { T, night, lamp, swell?, mood? })      paints L0 → L6 + the lamp practical
 *   chiBackdrop(f, { cams, key, T? })                       the far city alone (L1, L2, fog, L3 El): the
 *                                                           Rewind's lantern image hangs in front of it
 *   chiCam(T)            the shared camera
 *   CHI                  geometry (the lamp window, the building), CHI_NIGHT palette
 */
import type { Camera3, Frame, LayerSpec, PaintEnv, Palette } from '../../../film';
import { LAYERS, MOODS, toLayer, hash1, mixLab, moon, overscan, stars, withAlpha } from '../../../film';

type C = CanvasRenderingContext2D;
const D = MOODS.duskRose;
const WB = MOODS.winterBlue;

/** duskRose walked toward night: a little cooler, the ramp lowered; lights stay warm */
export const CHI_NIGHT: Palette = {
  ...D,
  id: 'chiNight',
  sky: [0, 1, 2, 3].map((i) => mixLab(mixLab(D.sky[i], WB.sky[i], 0.4), D.ink, [0.56, 0.46, 0.34, 0.24][i])) as Palette['sky'],
  set: mixLab(mixLab(D.set, WB.set, 0.3), D.ink, 0.22),
  setHaze: mixLab(mixLab(D.setHaze, WB.setHaze, 0.3), D.ink, 0.22),
  haze: mixLab(mixLab(D.haze, WB.haze, 0.3), D.ink, 0.26),
  rim: mixLab(D.rim, WB.rim, 0.25),
};

export const CHI = {
  /** the walk-up (L4 world) */
  bx0: 660,
  bx1: 1700,
  roofY: 262,
  /** window grid */
  cols: [708, 768, 878, 938, 1040, 1110, 1222, 1282, 1398, 1458, 1570, 1630],
  rows: [300, 400, 500, 600, 700],
  winW: 44,
  winH: 66,
  /** the lamp window: top floor, third column */
  lamp: { x: 878, y: 300, w: 44, h: 66, cx: 900, cy: 336 },
  /** the walk-up's rooftop water tank */
  tank: { x: 1210, w: 96 },
};

const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** Chicago appears at this T (s06's fifth-image end, when the narration enters: L0114 re-recorded, "We" at
 *  4.20 s of an 8.42 s shot, so T = 4.20 − 8.42 ≈ −4.22; the camera moves from the first Chicago frame) */
export const CHI_T0 = -4.22;
/** the linear push's origin, fixed so the hand-off into ch01-s07 (T ≥ 0) is unchanged by the re-recording */
const PUSH_T0 = -3.375;
/** the shared camera: slow truck + push in s06, an accelerating dolly into the window in s07 */
export function chiCam(T: number): Camera3 {
  const a = T - CHI_T0;
  // a gentle linear push (it starts a touch behind z 18, so it is moving from Chicago's first frame), plus a
  // cubic dolly that starts at rest 0.6 s before the cut
  const q = Math.max(0, (T + 0.6) / 1.8);
  const z = 18 + 28 * Math.max(CHI_T0 - PUSH_T0, T - PUSH_T0) + 680 * q * q * q;
  const w = T <= 0 ? 0.55 * sm(a / -CHI_T0) : 0.55 + 0.45 * sm(T / 1.2);
  return { x: lerp(700, CHI.lamp.cx, w), y: lerp(372, CHI.lamp.cy, w), z: Math.min(z, 900), lens: 1 };
}
export const CHI_CAMS: Camera3[] = [chiCam(CHI_T0), chiCam(-1), chiCam(0)];

/** the roof we stand on: nearer than L5, so the chimney slides ≈ 2× as fast as L5 would in the truck */
const NEAR: LayerSpec = { id: 'chiNear', z: 360, haze: 0, blur: 5 };
/** the clothesline: near, soft, but not so soft that the line itself dissolves */
const LINE: LayerSpec = { id: 'chiLine', z: 430, haze: 0, blur: 4 };

// ---------------------------------------------------------------- the El (L3 world)
/** the El's deck: lattice girder top at EL.deckY, straight columns with knee braces (ch02-s01's El) */
export const EL = { x0: -900, x1: 1100, deckY: 440, girderH: 30, bay: 28, cols: [-620, -330, -40, 250, 540, 830], colW: 18, knee: 52 };
/** the unlit train: lead car's front x on the deck at T, entering frame left ≈ 1.1 s after Chicago lands (on "war") */
const TRAIN = { cars: 3, carW: 150, carH: 46, gap: 8, x0: -40, v: 230, tIn: PUSH_T0 + 0.25 };

// ---------------------------------------------------------------- geometry (built once)
let G: {
  bldg: Path2D;
  panes: Path2D;
  bars: Path2D;
  stone: Path2D;
  escape: Path2D;
  escapeLit: Path2D;
  tank: Path2D;
  cuts: Path2D;
  mid: Path2D;
  midTank: Path2D;
  far: Path2D;
  farLit: Path2D;
  girder: Path2D;
  piers: Path2D;
  near: Path2D;
  nearRim: Path2D;
  line: Path2D;
  wash: Path2D;
} | null = null;

function tankPath(P: Path2D, x: number, base: number, w: number, h: number) {
  // stilts, a staved barrel, a conical cap
  const legH = h * 0.42;
  for (const lx of [x - w / 2 + w * 0.12, x + w / 2 - w * 0.12]) P.rect(lx - w * 0.04, base - legH, w * 0.08, legH);
  P.rect(x - w / 2 - 1, base - legH - 2, w + 2, 3);
  P.moveTo(x - w / 2, base - legH);
  P.lineTo(x - w / 2 + w * 0.05, base - h * 0.88);
  P.lineTo(x + w / 2 - w * 0.05, base - h * 0.88);
  P.lineTo(x + w / 2, base - legH);
  P.closePath();
  P.moveTo(x - w / 2 - 1, base - h * 0.87);
  P.lineTo(x, base - h);
  P.lineTo(x + w / 2 + 1, base - h * 0.87);
  P.closePath();
}

function geo() {
  if (G) return G;
  const { bx0, bx1, roofY } = CHI;
  // ---------------- the walk-up: body, parapet, a projecting cornice on brackets, chimneys
  const bldg = new Path2D();
  bldg.rect(bx0, roofY, bx1 - bx0, 900);
  bldg.rect(bx0 - 14, roofY - 8, bx1 - bx0 + 14, 12); // cornice cap
  bldg.rect(bx0 - 9, roofY + 4, bx1 - bx0 + 9, 10); // cornice fascia
  for (let x = bx0 + 2; x < bx1; x += 22) {
    // scrolled brackets under the cornice
    bldg.moveTo(x, roofY + 14);
    bldg.lineTo(x + 8, roofY + 14);
    bldg.quadraticCurveTo(x + 8, roofY + 24, x + 3, roofY + 26);
    bldg.lineTo(x, roofY + 26);
    bldg.closePath();
  }
  bldg.rect(1000, roofY - 26, 150, 20);
  bldg.rect(1040, roofY - 38, 70, 14);
  bldg.rect(760, roofY - 62, 34, 56); // chimney
  bldg.rect(756, roofY - 68, 42, 8);
  bldg.rect(1480, roofY - 44, 26, 38);
  bldg.rect(1476, roofY - 50, 34, 7);
  const panes = new Path2D();
  const bars = new Path2D();
  const cuts = new Path2D();
  // stone dressings: lintels with keystones and sills (a value step above the brick), a dentil course
  const stone = new Path2D();
  const win = (x: number, y: number) => {
    stone.rect(x - 6, y - 13, CHI.winW + 12, 8);
    stone.moveTo(x + CHI.winW / 2 - 5, y - 15);
    stone.lineTo(x + CHI.winW / 2 + 5, y - 15);
    stone.lineTo(x + CHI.winW / 2 + 3.5, y - 3);
    stone.lineTo(x + CHI.winW / 2 - 3.5, y - 3);
    stone.closePath();
    stone.rect(x - 5, y + CHI.winH + 1, CHI.winW + 10, 5);
  };
  for (const y of CHI.rows) {
    for (const x of CHI.cols) {
      win(x, y);
      if (x === CHI.lamp.x && y === CHI.lamp.y) continue;
      panes.rect(x, y, CHI.winW, CHI.winH);
      bars.rect(x + CHI.winW / 2 - 1.5, y, 3, CHI.winH);
      bars.rect(x, y + CHI.winH / 2 - 1.5, CHI.winW, 3);
    }
  }
  for (let x = bx0 + 4; x < bx1; x += 9) stone.rect(x, roofY + 32, 5, 5); // dentils
  stone.rect(bx0, roofY + 40, bx1 - bx0, 2.5); // frieze line
  for (const y of [392, 492, 592]) stone.rect(bx0, y - 26, bx1 - bx0, 2); // string courses between floors
  cuts.moveTo(bx0 - 14, roofY - 8);
  cuts.lineTo(bx1, roofY - 8);
  // ---------------- fire escape over the 1040/1110 bay
  const escape = new Path2D();
  const escapeLit = new Path2D();
  const ex0 = 1018, ex1 = 1176;
  const plat = [376, 476, 576, 676];
  plat.forEach((py, i) => {
    escape.rect(ex0, py, ex1 - ex0, 5);
    escape.rect(ex0, py - 34, ex1 - ex0, 3);
    escapeLit.rect(ex0, py - 0.5, ex1 - ex0, 1.4);
    escapeLit.rect(ex0, py - 34.5, ex1 - ex0, 1.2);
    for (let x = ex0; x <= ex1; x += 11) escape.rect(x, py - 34, 1.8, 34);
    // a bracket under each platform back to the wall
    escape.moveTo(ex0 + 6, py + 5);
    escape.lineTo(ex0 + 40, py + 5);
    escape.lineTo(ex0 + 6, py + 30);
    escape.closePath();
    escape.moveTo(ex1 - 6, py + 5);
    escape.lineTo(ex1 - 40, py + 5);
    escape.lineTo(ex1 - 6, py + 30);
    escape.closePath();
    if (i > 0) {
      const up = plat[i - 1];
      const l = i % 2 ? ex0 + 18 : ex1 - 18;
      const r = i % 2 ? ex1 - 30 : ex0 + 30;
      const dirx = Math.sign(r - l);
      for (let k = 0; k < 2; k++) {
        const off = k * 6;
        const p = new Path2D();
        p.moveTo(l, py - off);
        p.lineTo(r, up + 4 - off);
        p.lineTo(r + dirx * 3, up + 4 - off);
        p.lineTo(l + dirx * 3, py - off);
        p.closePath();
        escape.addPath(p);
      }
      const lit = new Path2D();
      lit.moveTo(l, py - 6.5);
      lit.lineTo(r, up - 2.5);
      lit.lineTo(r + dirx * 1.4, up - 2.5);
      lit.lineTo(l + dirx * 1.4, py - 6.5);
      lit.closePath();
      escapeLit.addPath(lit);
      for (let k = 1; k < 9; k++) {
        const x = lerp(l, r, k / 9);
        const y = lerp(py, up + 4, k / 9);
        escape.rect(x - 6, y - 1, 12, 2.2);
      }
    }
  });
  escape.rect(ex1 - 26, 680, 2.2, 80);
  escape.rect(ex1 - 12, 680, 2.2, 80);
  for (let y = 690; y < 760; y += 12) escape.rect(ex1 - 26, y, 16, 1.8);
  // ---------------- the rooftop water tank
  const tank = new Path2D();
  const { x: tx, w: tw } = CHI.tank;
  const tTop = roofY - 150;
  const tBot = roofY - 60;
  for (const lx of [tx - tw / 2 + 6, tx - 12, tx + 12, tx + tw / 2 - 6]) tank.rect(lx - 2.5, tBot, 5, roofY - 8 - tBot);
  const brace = (x0: number, y0: number, x1: number, y1: number) => {
    const p = new Path2D();
    const nx = -(y1 - y0), ny = x1 - x0;
    const L = Math.hypot(nx, ny);
    const ox = (nx / L) * 1.2, oy = (ny / L) * 1.2;
    p.moveTo(x0 + ox, y0 + oy);
    p.lineTo(x1 + ox, y1 + oy);
    p.lineTo(x1 - ox, y1 - oy);
    p.lineTo(x0 - ox, y0 - oy);
    p.closePath();
    tank.addPath(p);
  };
  brace(tx - tw / 2 + 6, tBot + 4, tx + tw / 2 - 6, roofY - 12);
  brace(tx + tw / 2 - 6, tBot + 4, tx - tw / 2 + 6, roofY - 12);
  tank.rect(tx - tw / 2 - 4, tBot - 4, tw + 8, 6);
  tank.moveTo(tx - tw / 2, tBot);
  tank.lineTo(tx - tw / 2 + 4, tTop);
  tank.lineTo(tx + tw / 2 - 4, tTop);
  tank.lineTo(tx + tw / 2, tBot);
  tank.closePath();
  tank.moveTo(tx - tw / 2 - 2, tTop + 2);
  tank.lineTo(tx, tTop - 34);
  tank.lineTo(tx + tw / 2 + 2, tTop + 2);
  tank.closePath();
  tank.rect(tx - 1.5, tTop - 44, 3, 12);
  for (const hy of [0.22, 0.5, 0.78]) {
    const y = lerp(tTop, tBot, hy);
    cuts.moveTo(tx - tw / 2 + 2, y);
    cuts.lineTo(tx + tw / 2 - 2, y);
  }
  // ---------------- L2: the nearer roofs to the left (walk-ups and a warehouse, one tank, chimneys)
  const mid = new Path2D();
  const roofs: [number, number, number][] = [
    [-520, 250, 380],
    [-270, 230, 330],
    [-40, 200, 395],
    [160, 180, 352],
    [340, 230, 410],
    [570, 160, 372],
  ];
  for (const [x, w, y] of roofs) {
    mid.rect(x, y, w, 900);
    mid.rect(x - 6, y - 6, w + 12, 10);
    for (let k = 0; k < 2; k++) {
      const cx = x + w * (0.22 + 0.5 * k) + hash1(x + k, 3) * 12;
      const ch = 26 + 14 * (0.5 + 0.5 * hash1(x + k, 4));
      mid.rect(cx, y - ch, 16, ch);
    }
  }
  const midTank = new Path2D();
  tankPath(midTank, 60, 395, 64, 128);
  // ---------------- L1: the far city. Flat tops only (1940s Chicago: walk-ups, lofts, setback towers with
  // flat crowns, roof tanks); no spires, no domes
  const far = new Path2D();
  const farLit = new Path2D();
  const base = 600;
  let x = -760;
  let i = 0;
  while (x < 2060) {
    const r1 = 0.5 + 0.5 * hash1(i, 4101);
    const r2 = 0.5 + 0.5 * hash1(i, 4102);
    const r3 = 0.5 + 0.5 * hash1(i, 4103);
    const w = 34 + 70 * r1;
    // a few tall setback towers (the Loop) cluster left of centre; the rest are low blocks
    const loop = Math.exp(-(((x - 260) / 520) ** 2));
    const tall = r3 > 0.78 - 0.3 * loop;
    const h = tall ? 120 + 130 * r2 * (0.5 + 0.5 * loop) : 34 + 60 * r2;
    far.rect(x, base - h, w, 600);
    if (tall) {
      // one or two setbacks, each a narrower flat block, and a flat penthouse
      const s1 = w * 0.72;
      const h1 = 18 + 26 * r1;
      far.rect(x + (w - s1) / 2, base - h - h1, s1, h1 + 2);
      if (r2 > 0.45) {
        const s2 = s1 * 0.6;
        far.rect(x + (w - s2) / 2, base - h - h1 - 14 - 10 * r3, s2, 16 + 10 * r3);
      }
    } else if (r1 > 0.62) {
      tankPath(far, x + w * (0.3 + 0.4 * r3), base - h, 16, 34);
    } else {
      far.rect(x + w * 0.2, base - h - 9, 6, 9); // a chimney
    }
    // lit windows: sparse
    const rows = Math.floor((h - 10) / 13);
    const colsN = Math.floor((w - 8) / 10);
    for (let ry = 0; ry < rows; ry++) {
      for (let cx = 0; cx < colsN; cx++) {
        if (hash1(i * 97 + ry * 13 + cx, 4104) > 0.86) farLit.rect(x + 6 + cx * 10, base - h + 8 + ry * 13, 4, 6);
      }
    }
    x += w + (r3 > 0.7 ? 6 + 10 * r1 : 0);
    i++;
  }
  // ---------------- L3: the El girder (X-braced lattice, the dusk through its holes) and its piers
  const girder = new Path2D();
  const y0 = EL.deckY, y1 = EL.deckY + EL.girderH;
  girder.rect(EL.x0, y0, EL.x1 - EL.x0, EL.girderH);
  for (let gx = EL.x0; gx < EL.x1; gx += EL.bay) {
    const b = EL.bay;
    girder.moveTo(gx + 4, y0 + 5);
    girder.lineTo(gx + b / 2 - 2, y0 + EL.girderH / 2);
    girder.lineTo(gx + 4, y1 - 5);
    girder.closePath();
    girder.moveTo(gx + b - 4, y0 + 5);
    girder.lineTo(gx + b / 2 + 2, y0 + EL.girderH / 2);
    girder.lineTo(gx + b - 4, y1 - 5);
    girder.closePath();
  }
  const piers = new Path2D();
  piers.rect(EL.x0, y0 - 6, EL.x1 - EL.x0, 6); // ties
  for (const cx of EL.cols) {
    // a straight column with a base course, a cap beam under the girder, and two angled knee-brace struts
    const hw = EL.colW / 2;
    girder.rect(cx - hw, y1 + 7, EL.colW, 700);
    piers.rect(cx - 30, y1, 60, 7);
    const strut = (x0: number, yA: number, x1: number, yB: number, w: number) => {
      const p = new Path2D();
      p.moveTo(x0, yA);
      p.lineTo(x1, yB);
      p.lineTo(x1, yB + w);
      p.lineTo(x0, yA + w);
      p.closePath();
      piers.addPath(p);
    };
    for (const s of [-1, 1]) strut(cx + s * hw, y1 + EL.knee * 0.8, cx + s * EL.knee, y1 + 2, 5);
  }
  // lattice in the column webs: small cut diamonds (the dusk shows through), on the first 220 px
  for (const cx of EL.cols) {
    for (let yy = y1 + 16; yy < y1 + 236; yy += 18) {
      girder.moveTo(cx, yy);
      girder.lineTo(cx + 3.5, yy + 8);
      girder.lineTo(cx, yy + 16);
      girder.lineTo(cx - 3.5, yy + 8);
      girder.closePath();
    }
  }
  // ---------------- NEAR: the roof we stand on: parapet with coping, a chimney stack with two pots
  const near = new Path2D();
  const ref = chiCam(-1.6);
  const at = (sx: number, sy: number) => toLayer(NEAR, ref, sx, sy);
  const P0 = at(-60, 650), P1 = at(560, 650), P2 = at(640, 690), P3 = at(1500, 900);
  near.rect(P0.x - 600, P0.y, P1.x - P0.x + 600, 900);
  near.rect(P0.x - 600, P0.y - 10, P1.x - P0.x + 606, 12);
  near.rect(P1.x, P2.y, P3.x - P1.x, 900);
  const C0 = at(150, 520), C1 = at(262, 650);
  const cw = C1.x - C0.x;
  near.rect(C0.x, C0.y, cw, C1.y - C0.y + 20);
  near.rect(C0.x - 8, C0.y - 12, cw + 16, 14);
  near.rect(C0.x + cw * 0.14, C0.y - 52, cw * 0.24, 42);
  near.rect(C0.x + cw * 0.1, C0.y - 56, cw * 0.32, 7);
  near.rect(C0.x + cw * 0.58, C0.y - 40, cw * 0.22, 30);
  near.rect(C0.x + cw * 0.55, C0.y - 44, cw * 0.28, 6);
  const nearRim = new Path2D();
  nearRim.rect(P0.x - 600, P0.y - 10, P1.x - P0.x + 606, 1.6);
  nearRim.rect(C0.x - 8, C0.y - 12, cw + 16, 1.6);
  // ---------------- L6: a clothesline across the top left (a sheet, a shirt, a towel), soft
  const line = new Path2D();
  const wash = new Path2D();
  {
    const L6at = (sx: number, sy: number) => toLayer(LINE, ref, sx, sy);
    const A = L6at(-80, 40), B = L6at(560, -6);
    const sag = 58;
    const yAt = (u: number) => lerp(A.y, B.y, u) + sag * 4 * u * (1 - u);
    const xAt = (u: number) => lerp(A.x, B.x, u);
    const n = 40;
    line.moveTo(xAt(0), yAt(0) - 2);
    for (let k = 1; k <= n; k++) line.lineTo(xAt(k / n), yAt(k / n) - 2);
    for (let k = n; k >= 0; k--) line.lineTo(xAt(k / n), yAt(k / n) + 2);
    line.closePath();
    const hang = (u0: number, u1: number, h: number, kind: 'sheet' | 'shirt' | 'towel') => {
      const xa = xAt(u0), xb = xAt(u1), ya = yAt(u0), yb = yAt(u1);
      if (kind === 'shirt') {
        const w = xb - xa;
        wash.moveTo(xa, ya);
        wash.lineTo(xb, yb);
        wash.lineTo(xb + w * 0.18, yb + h * 0.38);
        wash.lineTo(xb - w * 0.12, yb + h * 0.32);
        wash.lineTo(xb - w * 0.1, yb + h);
        wash.lineTo(xa + w * 0.1, ya + h);
        wash.lineTo(xa + w * 0.12, ya + h * 0.32);
        wash.lineTo(xa - w * 0.18, ya + h * 0.38);
        wash.closePath();
      } else {
        wash.moveTo(xa, ya);
        for (let k = 1; k <= 8; k++) wash.lineTo(lerp(xa, xb, k / 8), yAt(lerp(u0, u1, k / 8)));
        const hb = kind === 'sheet' ? h : h * 0.7;
        wash.lineTo(xb + 2, yb + hb * 0.96);
        for (let k = 8; k >= 0; k--) wash.lineTo(lerp(xa, xb, k / 8), lerp(ya, yb, k / 8) + hb + 4 * Math.sin(k * 1.9));
        wash.closePath();
      }
    };
    hang(0.04, 0.13, 64, 'towel');
    hang(0.15, 0.24, 70, 'shirt');
    hang(0.9, 0.95, 40, 'towel');
  }
  G = { bldg, panes, bars, stone, escape, escapeLit, tank, cuts, mid, midTank, far, farLit, girder, piers, near, nearRim, line, wash };
  return G;
}

export interface ChicagoOpts {
  /** seconds from the s06 → s07 cut (negative in s06) */
  T: number;
  /** 0 = duskRose dusk … 1 = night */
  night: number;
  /** the lamp in the window, 0..1 (≥ 1 while it swells in s07) */
  lamp: number;
  /** s07: 0..1 the lamplight swelling to fill the frame (raises the room light and the city glow) */
  swell?: number;
  /** palette override (s07 crossfades CHI_NIGHT → candleAmber) */
  mood?: Palette;
}

const rk = (r: { x: number; y: number; w: number; h: number }) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

export interface BackdropOpts {
  cams: Camera3[];
  key: string;
  /** night 0..1 (stars + moon) */
  night?: number;
  /** Chicago's clock (draws the train on the El); omit for no train */
  T?: number;
  /** fog multiplier */
  fog?: number;
  /** bake the static art even under a mixed palette id (a constant crossfadeMood) */
  bake?: boolean;
}
/** the far city alone: L1 (stars, moon, skyline), L2 (nearer roofs), a fog sheet, L3 (the El + its train) */
export function chiBackdrop(f: Frame, o: BackdropOpts) {
  const g = geo();
  const m = f.mood;
  const N = Math.max(0, Math.min(1, o.night ?? 0));
  const stable = o.bake ?? !m.id.includes('@');
  const art = (c: C, key: string, L: LayerSpec, pad: number, draw: (cc: C) => void) => {
    if (!stable) return draw(c);
    const r = overscan(L, o.cams, pad);
    f.cached(`nnh-chi-${o.key}-${key}-${m.id}-${N.toFixed(2)}-${rk(r)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      draw(cc);
    })(c, r.x, r.y);
  };
  f.layer('L1', (c0, env) => art(c0, 'L1', LAYERS.L1, 60, (c) => {
    if (N > 0.02) {
      c.save();
      c.globalAlpha = N;
      stars(c, { x: -500, y: -200, w: 2300, h: 520, count: 120, seed: 1943, twinkle: 0 }, env);
      c.restore();
      moon(c, { x: 300, y: 118, r: 15, phase: 0.22, halo: 1.1 * N, craters: false }, env);
    }
    c.fillStyle = env.fill('set');
    c.fill(g.far);
    c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.3), 0.18 + 0.32 * N);
    c.fill(g.farLit);
  }));
  f.layer('L2', (c0, env) => art(c0, 'L2', LAYERS.L2, 40, (c) => {
    c.fillStyle = env.fill('set');
    c.fill(g.mid);
    c.fill(g.midTank);
  }));
  f.fog({ yCenter: 0.66 * 720, height: 0.36 * 720, alpha: 0.24 * (o.fog ?? 1), drift: 7 });
  f.layer('L3', (c0, env) => {
    art(c0, 'L3', LAYERS.L3, 40, (c) => {
      c.fillStyle = env.fill('ink');
      c.fill(g.girder, 'evenodd');
      c.fill(g.piers);
      // the running rail catches the sky
      c.fillStyle = withAlpha(env.mood.rim, 0.3);
      c.fillRect(EL.x0, EL.deckY - 7, EL.x1 - EL.x0, 1.4);
    });
    if (o.T !== undefined) drawTrain(c0, env, o.T);
  });
}

/** the El train: dark, unlit cars crawling left → right along the deck (L3, live) */
function drawTrain(c: C, env: PaintEnv, T: number) {
  const lead = TRAIN.x0 + TRAIN.v * (T - TRAIN.tIn);
  const span = TRAIN.cars * (TRAIN.carW + TRAIN.gap);
  if (lead < EL.x0 - 40 || lead - span > EL.x1) return;
  const rail = EL.deckY - 6;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  for (let i = 0; i < TRAIN.cars; i++) {
    const x1 = lead - i * (TRAIN.carW + TRAIN.gap);
    const x = x1 - TRAIN.carW;
    const top = rail - 8 - TRAIN.carH;
    c.beginPath();
    c.roundRect(x, top, TRAIN.carW, TRAIN.carH + 2, [9, 9, 1, 1]);
    c.fill();
    c.fillRect(x - TRAIN.gap, top + TRAIN.carH - 18, TRAIN.gap, 5);
    for (const bx of [x + 14, x + TRAIN.carW - 42]) {
      c.fillRect(bx, rail - 10, 28, 6);
      c.beginPath();
      c.arc(bx + 7, rail - 3.5, 3.5, 0, Math.PI * 2);
      c.arc(bx + 21, rail - 3.5, 3.5, 0, Math.PI * 2);
      c.fill();
    }
  }
  // the dusk skims the car roofs; the dark window bands are cut-lines, never lit
  c.fillStyle = withAlpha(env.mood.rim, 0.24);
  for (let i = 0; i < TRAIN.cars; i++) {
    const x = lead - i * (TRAIN.carW + TRAIN.gap) - TRAIN.carW;
    c.fillRect(x + 8, rail - 8 - TRAIN.carH, TRAIN.carW - 16, 1.3);
  }
  c.strokeStyle = withAlpha(env.mood.rim, 0.1);
  c.lineWidth = 1;
  for (let i = 0; i < TRAIN.cars; i++) {
    const x = lead - i * (TRAIN.carW + TRAIN.gap) - TRAIN.carW;
    const top = rail - 8 - TRAIN.carH;
    for (let k = 0; k < 7; k++) c.strokeRect(x + 12 + k * 19.5, top + 11, 12, 18);
  }
  c.fillStyle = ink;
}

export function chicagoNight(f: Frame, o: ChicagoOpts) {
  const g = geo();
  const N = Math.max(0, Math.min(1, o.night));
  const sw = o.swell ?? 0;
  const pal = o.mood ?? (N <= 0 ? D : N >= 1 ? CHI_NIGHT : null);
  if (pal) f.setMood(pal);
  else f.setMood(CHI_NIGHT, { from: 'duskRose', u: N });
  const cam = chiCam(o.T);
  f.camera(cam);
  const m = f.mood;
  // the city glow sits low behind the walk-up's left shoulder
  f.backlight({ sunX: 760, sunY: 470, sunRadius: 820, intensity: 0.75 + 0.35 * sw });
  chiBackdrop(f, { cams: CHI_CAMS, key: 'night', night: N, T: o.T });
  f.fog('B');

  // L4: the walk-up
  const k = Math.max(0, Math.min(1, o.lamp));
  f.layer('L4', (c, env) => drawWalkUp(c, env, g, o.lamp, m));
  f.rim({ x: -0.75, y: -0.35 });
  if (o.lamp > 0.01) {
    const L = CHI.lamp;
    f.practical({ x: L.cx - 9, y: L.y + 48, kind: 'lamp', seed: 71, intensity: 0.8 * k + 0.6 * sw, radius: 39 + 60 * sw });
    // the window's light in the night haze: a soft halo round the opening (no beam: a lamp indoors throws no
    // shaft down a facade), a warm catch along the stone sill, and a faint glow on the near end of the fire
    // escape's top platform, the nearest metal to the window
    f.layer('L4', (c) => {
      const h = CHI_NIGHT.halo;
      const A = Math.min(1, k) * (0.75 + 0.25 * Math.min(1, sw * 2));
      c.save();
      c.globalCompositeOperation = 'lighter';
      // the halo: an ellipse a little wider than tall, centred on the glass
      c.save();
      c.translate(L.cx, L.cy);
      c.scale(1.25, 1);
      const hr = 96 + 60 * sw;
      const hg = c.createRadialGradient(0, 0, 20, 0, 0, hr);
      hg.addColorStop(0, withAlpha(h, 0.26 * A));
      hg.addColorStop(0.45, withAlpha(h, 0.1 * A));
      hg.addColorStop(1, withAlpha(h, 0));
      c.fillStyle = hg;
      c.fillRect(-hr, -hr, 2 * hr, 2 * hr);
      c.restore();
      // the sill: its top edge lit, and a short soft spill under it
      const sy = L.y + L.h + 2;
      c.fillStyle = withAlpha(h, 0.55 * A);
      c.fillRect(L.x - 5, sy, L.w + 10, 1.6);
      const sg = c.createLinearGradient(0, sy, 0, sy + 26);
      sg.addColorStop(0, withAlpha(h, 0.14 * A));
      sg.addColorStop(1, withAlpha(h, 0));
      c.fillStyle = sg;
      c.fillRect(L.x - 12, sy, L.w + 24, 26);
      // the fire escape's top platform: its rails catch the lamp at the window end, falling off along the bay
      const ex0 = 1018, ex1 = 1110;
      const eg = c.createLinearGradient(ex0, 0, ex1, 0);
      eg.addColorStop(0, withAlpha(h, 0.42 * A));
      eg.addColorStop(1, withAlpha(h, 0));
      c.fillStyle = eg;
      c.fillRect(ex0, 341.5, ex1 - ex0, 1.4);
      c.fillRect(ex0, 375.5, ex1 - ex0, 1.6);
      const fg2 = c.createRadialGradient(ex0 + 6, 360, 4, ex0 + 6, 360, 70);
      fg2.addColorStop(0, withAlpha(h, 0.08 * A));
      fg2.addColorStop(1, withAlpha(h, 0));
      c.fillStyle = fg2;
      c.fillRect(ex0 - 70, 290, 140, 140);
      c.restore();
    });
  }

  // L5 → NEAR: the roof we stand on, then (L6) the clothesline; both gone once the dolly has passed them
  const nearDepth = NEAR.z - cam.z;
  if (nearDepth > 90) {
    f.layer(NEAR, (c0, env) => {
      const r = overscan(NEAR, CHI_CAMS.slice(0, 2), 40);
      const draw = (c: C) => {
        c.fillStyle = env.fill('fg');
        c.fill(g.near);
        c.fillStyle = withAlpha(env.mood.rim, 0.2);
        c.fill(g.nearRim);
      };
      if (m.id.includes('@')) draw(c0);
      else f.cached(`nnh-chi-near-${m.id}-${N.toFixed(2)}-${rk(r)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        draw(cc);
      })(c0, r.x, r.y);
    });
  }
  if (LINE.z - cam.z > 90) {
    f.layer(LINE, (c, env) => {
      c.fillStyle = env.fill('fg');
      c.fill(g.line);
      c.fill(g.wash);
    });
  }
}

function drawWalkUp(c: C, env: PaintEnv, g: NonNullable<typeof G>, lamp: number, m: Palette) {
  const ink = env.fill('ink');
  // the brick sits a hair above ink so the ink fire escape, the stone and the cornice read on it
  const brick = mixLab(ink, m.set, 0.12);
  const glass = mixLab(ink, m.sky[1], 0.22);
  c.fillStyle = brick;
  c.fill(g.bldg);
  c.fillStyle = ink;
  c.fill(g.tank);
  // stone dressings: lintels + keystones, sills, dentils, string courses
  c.fillStyle = mixLab(brick, m.set, 0.32);
  c.fill(g.stone);
  c.fillStyle = glass;
  c.fill(g.panes);
  const L = CHI.lamp;
  const k = Math.max(0, Math.min(1, lamp));
  if (k <= 0) {
    c.fillStyle = glass;
    c.fillRect(L.x, L.y, L.w, L.h);
  } else {
    const gr = c.createLinearGradient(0, L.y, 0, L.y + L.h);
    gr.addColorStop(0, mixLab(glass, m.halo, k * 0.85));
    gr.addColorStop(0.55, mixLab(glass, m.core, k * 0.95));
    gr.addColorStop(1, mixLab(glass, m.halo, k));
    c.fillStyle = gr;
    c.fillRect(L.x, L.y, L.w, L.h);
  }
  // the room behind: a half-drawn blind and the table lamp (ink against the lit pane)
  c.fillStyle = ink;
  c.fillRect(L.x, L.y, L.w, 13);
  c.fillRect(L.x + L.w / 2 - 6, L.y + 13, 12, 2.2);
  const lx = L.cx - 9;
  c.beginPath();
  c.moveTo(lx - 7, L.y + 52);
  c.lineTo(lx - 4.5, L.y + 40);
  c.lineTo(lx + 4.5, L.y + 40);
  c.lineTo(lx + 7, L.y + 52);
  c.closePath();
  c.fillStyle = k > 0 ? mixLab(ink, m.halo, 0.32 * k) : ink;
  c.fill();
  c.fillStyle = ink;
  c.fillRect(lx - 1, L.y + 52, 2, 9);
  c.fillRect(lx - 5, L.y + 60, 10, 3);
  c.fillRect(L.x, L.y + L.h - 3, L.w, 3);
  c.fillRect(L.x + L.w / 2 - 1.5, L.y + 13, 3, L.h - 13);
  c.fillRect(L.x, L.y + L.h / 2 - 1.5, L.w, 3);
  c.fill(g.bars);
  // the fire escape: true ink, its platform edges and stair stringers catching the sky
  c.fill(g.escape);
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fill(g.escapeLit);
  // cut-lines: cornice top, tank hoops
  c.strokeStyle = withAlpha(m.rim, 0.2);
  c.lineWidth = 1.1;
  c.stroke(g.cuts);
  if (k > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const sy = L.y + L.h + 4;
    c.save();
    c.translate(L.cx, sy);
    c.scale(1, 0.8);
    const sp = c.createRadialGradient(0, 0, 2, 0, 0, 104);
    sp.addColorStop(0, withAlpha(m.halo, 0.3 * k));
    sp.addColorStop(0.45, withAlpha(m.halo, 0.11 * k));
    sp.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = sp;
    c.fillRect(-104, -30, 208, 140);
    c.restore();
    c.fillStyle = withAlpha(mixLab(m.halo, m.core, 0.3), 0.55 * k);
    c.fillRect(L.x - 5, sy - 1, L.w + 10, 2);
    c.restore();
  }
}
