/**
 * The Mark I Perceptron (Cornell Aeronautical Laboratory, 1958–60), as documented:
 * a 20×20 photocell "retina" (400 S-units) in a camera on a stand, a plugboard of
 * randomly patched wires (S→A connections, 512 A-units), racks of motor-driven
 * potentiometers (the adaptive weights) and a control cabinet with the 8 response
 * lamps. Front elevations, real size at s = 1 (cabinets ≈ 185 cm).
 *
 *   photocellRetina({ x, y, cells?: ArrayLike<number> (400, 0..1, row-major), view?: 'front'|'side',
 *                      pierced?: false, stand?: true, tilt?: rad })
 *       anchors: eye (grid centre / lens), lens, cable              cell(o, i) -> world pt of cell i
 *   perceptronPatchboard({ x, y, seed?, wires?: 240, face?: 'lit'|'ink' })
 *       anchors: centre, top                                        (≈ 75 × 185 cm)
 *   perceptronPotRack({ x, y, cols?: 8, rows?: 10, weights?: ArrayLike<number> (-1..1), t-driven hum? })
 *       anchors: centre, top                                        knob(o, i) -> world pt of unit i
 *   perceptronConsole({ x, y, response?: ArrayLike<number> (8, 0..1), meters?: number[] (0..1) })
 *       anchors: lamps, meter, top
 *   markIPerceptron({ x, y, cells?, weights?, response?, seed?, retina?: true })
 *       the whole installation, ≈ 420 cm wide: retina on its stand at the left, cable run,
 *       patchboard, two pot racks, console. anchors: eye, patch, pots, lamps, console, cable
 *
 * Weights / cells / response are data: animate them from real perceptron updates (metaphors).
 */
import type { PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import {
  type PropAt,
  CM,
  type Pt,
  bar,
  circle,
  cut,
  cutSide,
  defineProp,
  hash,
  inkLift,
  lamp,
  memo,
  poly,
  px,
  rect,
  rrect,
  toWorld,
} from './_kit';
import { mulberry32 } from '../../../core';

// ---------------------------------------------------------------------------
// shared cabinet shell (1950s lab rack: rounded top, louvres, plinth, handles)
// ---------------------------------------------------------------------------
function cabinet(w: number, h: number, key: string) {
  return memo(`pc:cab:${key}:${w}:${h}`, () => {
    const p = new Path2D();
    const hw = w / 2;
    // plinth and body
    rect(p, -hw + 2, -6, w - 4, 6);
    p.moveTo(-hw, -6);
    p.lineTo(-hw, -h + 5);
    p.quadraticCurveTo(-hw, -h, -hw + 5, -h);
    p.lineTo(hw - 5, -h);
    p.quadraticCurveTo(hw, -h, hw, -h + 5);
    p.lineTo(hw, -6);
    p.closePath();
    const cl = new Path2D();
    // top louvres
    for (let i = 0; i < 6; i++) {
      const y = -h + 7 + i * 1.8;
      cl.moveTo(-hw + 8, y);
      cl.lineTo(hw - 8, y);
    }
    // bottom kick louvres
    for (let i = 0; i < 4; i++) {
      const y = -16 + i * 2;
      cl.moveTo(-hw + 10, y);
      cl.lineTo(hw - 10, y);
    }
    // door seams: the two vertical ones hug the cabinet's side edges, so they are kept apart and drawn
    // only on the window-facing side when a cut light names one (else both, as before)
    const seamL = new Path2D();
    seamL.moveTo(-hw + 1.2, -h + 4);
    seamL.lineTo(-hw + 1.2, -7);
    const seamR = new Path2D();
    seamR.moveTo(hw - 1.2, -h + 4);
    seamR.lineTo(hw - 1.2, -7);
    cl.moveTo(-hw + 2, -h + 19);
    cl.lineTo(hw - 2, -h + 19);
    cl.moveTo(-hw + 2, -20);
    cl.lineTo(hw - 2, -20);
    return { p, cl, seamL, seamR };
  });
}

/** the cabinet's vertical door seams: only the side the cut light faces (both when it names none) */
function cutSeams(c: CanvasRenderingContext2D, env: PaintEnv, C: { seamL: Path2D; seamR: Path2D }, alpha: number, devicePx: number) {
  const side = cutSide();
  if (side === undefined || side < 0) cut(c, env, C.seamL, alpha, devicePx);
  if (side === undefined || side > 0) cut(c, env, C.seamR, alpha, devicePx);
}

// ---------------------------------------------------------------------------
// Retina: the 20×20 photocell camera on its stand
// ---------------------------------------------------------------------------
export interface RetinaOpts extends PropAt {
  /** 400 intensities 0..1, row-major (row 0 at top) */
  cells?: ArrayLike<number>;
  view?: 'front' | 'side';
  /** unlit cells as holes the backlight shows through */
  pierced?: boolean;
  stand?: boolean;
  /** camera tilt (side view), radians */
  tilt?: number;
}

const RET = { face: 40, cell: 1.55, pitch: 1.78, head: -150, standH: 104 };

function retinaFront() {
  return memo('ret:front', () => {
    const p = new Path2D();
    const F = RET.face;
    const hy = RET.head; // centre of the face
    // housing: a deep box seen nearly face-on, with a visible side depth on the left
    poly(p, [-F / 2 - 9, hy - F / 2 + 3, -F / 2, hy - F / 2, -F / 2, hy + F / 2, -F / 2 - 9, hy + F / 2 - 3]);
    rrect(p, -F / 2 - 1, hy - F / 2 - 1, F + 2, F + 2, 2);
    // lid lip + carrying handle on top
    rect(p, -F / 2 - 1.6, hy - F / 2 - 2.2, F + 3.2, 1.6);
    p.moveTo(-8, hy - F / 2 - 2);
    p.lineTo(-8, hy - F / 2 - 6);
    p.quadraticCurveTo(0, hy - F / 2 - 8.2, 8, hy - F / 2 - 6);
    p.lineTo(8, hy - F / 2 - 2);
    p.lineTo(6.6, hy - F / 2 - 2);
    p.lineTo(6.6, hy - F / 2 - 5.2);
    p.quadraticCurveTo(0, hy - F / 2 - 6.8, -6.6, hy - F / 2 - 5.2);
    p.lineTo(-6.6, hy - F / 2 - 2);
    p.closePath();
    // trunnion yoke & stand head
    rect(p, -F / 2 - 4, hy - 3, 3, 6);
    rect(p, F / 2 + 1, hy - 3, 3, 6);
    circle(p, -F / 2 - 2.5, hy, 2.6);
    circle(p, F / 2 + 2.5, hy, 2.6);
    p.moveTo(-F / 2 - 4, hy + 2);
    p.lineTo(-F / 2 - 4, hy + F / 2 + 6);
    p.lineTo(F / 2 + 4, hy + F / 2 + 6);
    p.lineTo(F / 2 + 4, hy + 2);
    p.lineTo(F / 2 + 1.5, hy + 2);
    p.lineTo(F / 2 + 1.5, hy + F / 2 + 3.4);
    p.lineTo(-F / 2 - 1.5, hy + F / 2 + 3.4);
    p.lineTo(-F / 2 - 1.5, hy + 2);
    p.closePath();
    // the cell plate (inset)
    const plate = new Path2D();
    rect(plate, -F / 2 + 2.2, hy - F / 2 + 2.2, F - 4.4, F - 4.4);
    const cl = new Path2D();
    rect(cl, -F / 2 + 1.2, hy - F / 2 + 1.2, F - 2.4, F - 2.4);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) circle(cl, sx * (F / 2 - 0.6), hy + sy * (F / 2 - 0.6), 0.35);
    cl.moveTo(-F / 2 - 8, hy - F / 2 + 6);
    cl.lineTo(-F / 2 - 1.5, hy - F / 2 + 4);
    return { p, plate, cl };
  });
}

function retinaSide() {
  return memo('ret:side', () => {
    const p = new Path2D();
    const hy = RET.head;
    // box body with the lens barrel and hood toward +x
    rrect(p, -24, hy - 19, 40, 38, 2);
    rect(p, 16, hy - 9, 7, 18);
    // lens barrel with a flared hood
    poly(p, [23, hy - 7.4, 31, hy - 7.4, 31, hy - 6.6, 36, hy - 6.6, 39, hy - 9.6, 40, hy - 9.6, 40, hy + 9.6, 39, hy + 9.6, 36, hy + 6.6, 31, hy + 6.6, 31, hy + 7.4, 23, hy + 7.4]);
    // trunnion + yoke down to the stand head
    circle(p, -4, hy, 3.4);
    rect(p, -7, hy + 18, 6, 9);
    // handles / cable gland at the back
    rrect(p, -29, hy - 4, 5, 8, 1.4);
    const cl = new Path2D();
    cl.moveTo(-22, hy - 12);
    cl.lineTo(14, hy - 12);
    cl.moveTo(-22, hy + 12);
    cl.lineTo(14, hy + 12);
    for (const x of [33, 35]) {
      cl.moveTo(x, hy - 6.4);
      cl.lineTo(x, hy + 6.4);
    }
    circle(cl, -4, hy, 1.8);
    return { p, cl };
  });
}

function retinaStand() {
  return memo('ret:stand', () => {
    const p = new Path2D();
    const top = RET.head + RET.face / 2 + 6;
    // telescoping column with a clamp collar
    rect(p, -2.4, top, 4.8, -top - 22);
    rect(p, -3.2, top + 30, 6.4, -top - 52);
    rrect(p, -4.6, top + 26, 9.2, 5, 1);
    circle(p, 5.6, top + 28.5, 1.6);
    // tripod: three legs (one toward the camera, foreshortened)
    const hub = { x: 0, y: -22 };
    rrect(p, -5, hub.y - 4, 10, 6, 1.5);
    bar(p, hub.x - 2, hub.y, -34, 0, 2.6);
    bar(p, hub.x + 2, hub.y, 34, 0, 2.6);
    bar(p, hub.x, hub.y, 6, 1.6, 2.2);
    for (const fx of [-34, 34]) rrect(p, fx - 3, -1.4, 6, 1.8, 0.8);
    // spreader
    bar(p, -18, -11.2, 18, -11.2, 1.0);
    return p;
  });
}

function cellCentre(i: number): Pt {
  const r = Math.floor(i / 20);
  const c = i % 20;
  const off = ((20 - 1) * RET.pitch) / 2;
  return { x: -off + c * RET.pitch, y: RET.head - off + r * RET.pitch };
}

function drawRetina(c: CanvasRenderingContext2D, o: RetinaOpts, env: PaintEnv) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  if (o.stand !== false) c.fill(retinaStand());
  if (o.view === 'side') {
    const S = retinaSide();
    c.save();
    if (o.tilt) {
      c.translate(-4, RET.head);
      c.rotate(o.tilt);
      c.translate(4, -RET.head);
    }
    c.fillStyle = ink;
    c.fill(S.p);
    cut(c, env, S.cl, 0.32, 1.2);
    c.restore();
    return;
  }
  const F = retinaFront();
  c.fillStyle = ink;
  c.fill(F.p);
  // plate: a slightly lifted dark field so the cell grid reads
  c.fillStyle = inkLift(env, 0.32);
  c.fill(F.plate);
  // cells by intensity bucket (one fill per bucket)
  const cells = o.cells;
  const buckets: Path2D[] = [];
  const holes = new Path2D();
  const dark = new Path2D();
  const r = RET.cell / 2;
  for (let i = 0; i < 400; i++) {
    const v = cells ? Math.max(0, Math.min(1, cells[i] ?? 0)) : 0;
    const p = cellCentre(i);
    if (v < 0.04) {
      circle(o.pierced ? holes : dark, p.x, p.y, r);
      continue;
    }
    const b = Math.min(5, Math.floor(v * 6));
    (buckets[b] ??= new Path2D());
    circle(buckets[b], p.x, p.y, r);
  }
  c.fillStyle = ink;
  c.fill(dark);
  if (o.pierced) {
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.fill(holes);
    c.restore();
  }
  buckets.forEach((b, i) => {
    if (!b) return;
    const u = (i + 0.5) / 6;
    c.fillStyle = lamp(env, 0.2 + 0.8 * u, 0.35 + 0.65 * u);
    c.fill(b);
  });
  // a faint bloom over lit cells: one soft pass
  if (cells) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(env.mood.halo, 0.12);
    buckets.forEach((b, i) => {
      if (b && i >= 3) c.fill(b);
    });
    c.restore();
  }
  cut(c, env, F.cl, 0.36, 1.2);
}

export const photocellRetina = Object.assign(
  defineProp<RetinaOpts, 'eye' | 'lens' | 'cable'>(
    (c, o, env) => drawRetina(c, o, env),
    (o) => ({
      eye: { x: o.view === 'side' ? 40 : 0, y: RET.head },
      lens: { x: o.view === 'side' ? 40 : 0, y: RET.head },
      cable: { x: o.view === 'side' ? -29 : -RET.face / 2 - 9, y: RET.head },
    }),
    () => ({ x: -36, y: RET.head - RET.face / 2 - 5, w: 78, h: -RET.head + RET.face / 2 + 5 }),
  ),
  {
    /** world position of retina cell i (front view) */
    cell(o: RetinaOpts, i: number): Pt {
      const p = cellCentre(i);
      return toWorld(o, p.x, p.y);
    },
  },
);

// ---------------------------------------------------------------------------
// Plugboard: jacks + a dense random tangle (the random S→A wiring)
// ---------------------------------------------------------------------------
export interface PatchboardOpts extends PropAt {
  seed?: number;
  wires?: number;
  face?: 'lit' | 'ink';
}

const PB = { w: 78, h: 186, panelTop: -168, panelBot: -28, cols: 26, rows: 32 };

function patchPaths(seed: number, n: number) {
  return memo(`pb:${seed}:${n}`, () => {
    const C = cabinet(PB.w, PB.h, 'pb');
    const panel = new Path2D();
    const pl = -PB.w / 2 + 6;
    const pw = PB.w - 12;
    rect(panel, pl, PB.panelTop, pw, PB.panelBot - PB.panelTop);
    const jacks = new Path2D();
    const jx = (i: number) => pl + 2.5 + (i * (pw - 5)) / (PB.cols - 1);
    const jy = (j: number) => PB.panelTop + 3 + (j * (PB.panelBot - PB.panelTop - 6)) / (PB.rows - 1);
    for (let i = 0; i < PB.cols; i++) for (let j = 0; j < PB.rows; j++) circle(jacks, jx(i), jy(j), 0.42);
    // panel bezel + engraved strips
    const cl = new Path2D();
    cl.rect(pl - 1.2, PB.panelTop - 1.2, pw + 2.4, PB.panelBot - PB.panelTop + 2.4);
    // the tangle: back layer (thin, lifted), mid layer (ink), a few heavy front cords.
    // Cords mostly patch nearby jacks (with some long throws) and always sag under
    // gravity, so the mass reads as hanging patch cords, not scribble.
    const rnd = mulberry32(seed * 7919 + 13);
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 1.6;
    const back = new Path2D();
    const front = new Path2D();
    const heavy = new Path2D();
    const plugs = new Path2D();
    const clampI = (v: number, n: number) => Math.max(0, Math.min(n - 1, Math.round(v)));
    for (let k = 0; k < n; k++) {
      const ai = Math.floor(rnd() * PB.cols);
      const aj = Math.floor(rnd() * (PB.rows - 2));
      const far = rnd() < 0.28;
      const bi = clampI(ai + gauss() * (far ? 9 : 3.5), PB.cols);
      const bj = clampI(aj + gauss() * (far ? 10 : 3) + (far ? 0 : 1), PB.rows);
      const a = { x: jx(ai), y: jy(aj) };
      const b = { x: jx(bi), y: jy(bj) };
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const droop = 2.5 + d * (0.35 + rnd() * 0.4) + rnd() * 5;
      const s1 = rnd() < 0.5 ? -1 : 1;
      const out = 1.5 + rnd() * 3;
      const r = rnd();
      const p = r < 0.34 ? back : r < 0.9 ? front : heavy;
      const lo = Math.max(a.y, b.y) + droop;
      p.moveTo(a.x, a.y + 1.2);
      p.bezierCurveTo(a.x + s1 * out, lo, b.x - s1 * out, lo, b.x, b.y + 1.2);
      if (p !== back) for (const q of [a, b]) rrect(plugs, q.x - 0.6, q.y - 0.5, 1.2, 2.3, 0.4);
    }
    // a few long loops that hang below the panel, out in front of the cabinet
    const loops = new Path2D();
    for (let k = 0; k < 9; k++) {
      const a = { x: jx(Math.floor(rnd() * PB.cols)), y: jy(PB.rows - 1 - Math.floor(rnd() * 5)) };
      const b = { x: jx(Math.floor(rnd() * PB.cols)), y: jy(PB.rows - 1 - Math.floor(rnd() * 5)) };
      const drop = 6 + rnd() * 10;
      loops.moveTo(a.x, a.y);
      loops.bezierCurveTo(a.x + (rnd() - 0.5) * 6, a.y + drop, b.x + (rnd() - 0.5) * 6, b.y + drop, b.x, b.y);
    }
    return { C, panel, jacks, cl, back, front, heavy, plugs, loops };
  });
}

function drawPatch(c: CanvasRenderingContext2D, o: PatchboardOpts, env: PaintEnv) {
  const P = patchPaths(o.seed ?? 1, o.wires ?? 240);
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fill(P.C.p);
  cut(c, env, P.C.cl, 0.26, 1.1);
  cutSeams(c, env, P.C, 0.26, 1.1);
  const lit = o.face !== 'ink';
  // floodlit panel face (dull aluminium), so the dark wires read against it
  c.fillStyle = lit ? mixLab(env.mood.haze, env.mood.rim, 0.22) : inkLift(env, 0.35);
  c.fill(P.panel);
  if (lit) {
    const g = c.createLinearGradient(0, PB.panelTop, 0, PB.panelBot);
    g.addColorStop(0, withAlpha(env.mood.rim, 0.16));
    g.addColorStop(1, withAlpha(env.fill('ink'), 0.4));
    c.fillStyle = g;
    c.fill(P.panel);
  }
  c.fillStyle = ink;
  c.fill(P.jacks);
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = mixLab(ink, lit ? env.mood.haze : env.mood.set, 0.5);
  c.lineWidth = 0.32;
  c.stroke(P.back);
  c.strokeStyle = ink;
  c.lineWidth = 0.42;
  c.stroke(P.front);
  c.lineWidth = 0.75;
  c.stroke(P.heavy);
  c.fillStyle = ink;
  c.fill(P.plugs);
  // cords hanging in front of the dark cabinet base: rim-lit edges so they read
  c.strokeStyle = withAlpha(env.mood.rim, 0.32);
  c.lineWidth = Math.max(0.5, px(c, 1.3));
  c.stroke(P.loops);
  c.restore();
  cut(c, env, P.cl, 0.4, 1.2);
}

export const perceptronPatchboard = defineProp<PatchboardOpts, 'centre' | 'top'>(
  drawPatch,
  () => ({ centre: { x: 0, y: (PB.panelTop + PB.panelBot) / 2 }, top: { x: 0, y: -PB.h } }),
  () => ({ x: -PB.w / 2, y: -PB.h, w: PB.w, h: PB.h }),
);

// ---------------------------------------------------------------------------
// Potentiometer racks (the weights)
// ---------------------------------------------------------------------------
export interface PotRackOpts extends PropAt {
  cols?: number;
  rows?: number;
  /** cols*rows weights in -1..1 (pointer angle ±135°) */
  weights?: ArrayLike<number>;
  seed?: number;
}

const POT = { w: 70, h: 186, top: -168, bot: -26, r: 2.5 };

function potLayout(cols: number, rows: number) {
  return memo(`pot:lay:${cols}:${rows}`, () => {
    const pts: Pt[] = [];
    const x0 = -POT.w / 2 + 7;
    const x1 = POT.w / 2 - 7;
    const y0 = POT.top + 6;
    const y1 = POT.bot - 6;
    for (let r = 0; r < rows; r++)
      for (let k = 0; k < cols; k++) pts.push({ x: x0 + ((x1 - x0) * k) / Math.max(1, cols - 1), y: y0 + ((y1 - y0) * r) / Math.max(1, rows - 1) });
    return pts;
  });
}

function potPaths(cols: number, rows: number) {
  return memo(`pot:${cols}:${rows}`, () => {
    const C = cabinet(POT.w, POT.h, 'pot');
    const pts = potLayout(cols, rows);
    const pitchX = (POT.w - 14) / Math.max(1, cols - 1);
    const r = Math.min(POT.r, pitchX * 0.36);
    // open rack: the chassis shelves are holes so light rakes between the motor cans
    const bay = new Path2D();
    rect(bay, -POT.w / 2 + 3.5, POT.top - 2, POT.w - 7, POT.bot - POT.top + 4);
    const shelves = new Path2D();
    const cans = new Path2D();
    const ring = new Path2D();
    const ticks = new Path2D();
    const pitchY = (POT.bot - POT.top - 12) / Math.max(1, rows - 1);
    for (let rr = 0; rr < rows; rr++) {
      const y = POT.top + 6 + rr * pitchY + r + 1.6;
      rect(shelves, -POT.w / 2 + 3.5, y, POT.w - 7, 1.1);
    }
    for (const p of pts) {
      // motor can (behind), gear box, then the potentiometer face
      rrect(cans, p.x - r * 0.95, p.y - r * 1.25, r * 1.9, r * 2.5, r * 0.4);
      circle(cans, p.x, p.y, r);
      circle(ring, p.x, p.y, r * 0.78);
      for (let k = -3; k <= 3; k++) {
        const a = -Math.PI / 2 + (k / 3) * (Math.PI * 0.75);
        ticks.moveTo(p.x + Math.cos(a) * r * 0.62, p.y + Math.sin(a) * r * 0.62);
        ticks.lineTo(p.x + Math.cos(a) * r * 0.78, p.y + Math.sin(a) * r * 0.78);
      }
    }
    // vertical cable looms between columns
    const looms = new Path2D();
    for (let k = 0; k < cols - 1; k++) {
      const x = pts[k].x + pitchX / 2;
      looms.moveTo(x, POT.top - 1);
      looms.lineTo(x, POT.bot + 1);
    }
    return { C, bay, shelves, cans, ring, ticks, looms, pts, r };
  });
}

function drawPots(c: CanvasRenderingContext2D, o: PotRackOpts, env: PaintEnv) {
  const cols = o.cols ?? 8;
  const rows = o.rows ?? 10;
  const P = potPaths(cols, rows);
  const ink = env.fill('ink');
  // cabinet with the bay cut out (evenodd), then the inner rack
  const shell = new Path2D();
  shell.addPath(P.C.p);
  shell.addPath(P.bay);
  c.fillStyle = ink;
  c.fill(shell, 'evenodd');
  // dim back plate so the open rack still separates from the room
  c.fillStyle = withAlpha(inkLift(env, 0.5), 0.55);
  c.fill(P.bay);
  c.fillStyle = ink;
  c.fill(P.shelves);
  c.save();
  c.strokeStyle = ink;
  c.lineWidth = 0.9;
  c.stroke(P.looms);
  c.restore();
  c.fill(P.cans);
  cut(c, env, P.C.cl, 0.26, 1.1);
  cutSeams(c, env, P.C, 0.26, 1.1);
  cut(c, env, P.ring, 0.34, 1.0);
  cut(c, env, P.ticks, 0.3, 0.9);
  // pointers: the weights
  const w = o.weights;
  const ptr = new Path2D();
  const hub = new Path2D();
  P.pts.forEach((p, i) => {
    const v = w ? Math.max(-1, Math.min(1, w[i] ?? 0)) : (hash(i, o.seed ?? 5) - 0.5) * 1.6;
    const a = -Math.PI / 2 + v * Math.PI * 0.75;
    ptr.moveTo(p.x - Math.cos(a) * P.r * 0.2, p.y - Math.sin(a) * P.r * 0.2);
    ptr.lineTo(p.x + Math.cos(a) * P.r * 0.72, p.y + Math.sin(a) * P.r * 0.72);
    circle(hub, p.x, p.y, P.r * 0.16);
  });
  c.save();
  c.strokeStyle = withAlpha(env.mood.rim, 0.85);
  c.lineWidth = Math.max(px(c, 1.6), P.r * 0.14);
  c.lineCap = 'round';
  c.stroke(ptr);
  c.restore();
  c.fillStyle = withAlpha(env.mood.rim, 0.6);
  c.fill(hub);
}

export const perceptronPotRack = Object.assign(
  defineProp<PotRackOpts, 'centre' | 'top'>(
    drawPots,
    () => ({ centre: { x: 0, y: (POT.top + POT.bot) / 2 }, top: { x: 0, y: -POT.h } }),
    () => ({ x: -POT.w / 2, y: -POT.h, w: POT.w, h: POT.h }),
  ),
  {
    /** world position of potentiometer unit i */
    knob(o: PotRackOpts, i: number): Pt {
      const p = potLayout(o.cols ?? 8, o.rows ?? 10)[i] ?? { x: 0, y: 0 };
      return toWorld(o, p.x, p.y);
    },
  },
);

// ---------------------------------------------------------------------------
// Control cabinet: meters, switches, the 8 response lamps
// ---------------------------------------------------------------------------
export interface ConsoleOpts extends PropAt {
  response?: ArrayLike<number>;
  meters?: number[];
}

const CON = { w: 92, h: 150 };

function consolePaths() {
  return memo('pc:console', () => {
    const p = new Path2D();
    const hw = CON.w / 2;
    // desk-height base with a sloped control panel and an upright meter bridge
    rect(p, -hw + 2, -6, CON.w - 4, 6);
    rect(p, -hw, -86, CON.w, 80);
    poly(p, [-hw, -86, hw, -86, hw - 4, -104, -hw + 4, -104]);
    rrect(p, -hw + 4, -CON.h, CON.w - 8, 48, 3);
    const cl = new Path2D();
    // meter windows
    const meters = new Path2D();
    for (let i = 0; i < 3; i++) rrect(meters, -hw + 10 + i * 26, -CON.h + 7, 20, 13, 1.5);
    // lamp sockets row on the bridge
    const sockets = new Path2D();
    for (let i = 0; i < 8; i++) circle(sockets, -hw + 13 + i * ((CON.w - 26) / 7), -CON.h + 33, 2.0);
    cl.addPath(sockets);
    // toggles on the slope
    const toggles = new Path2D();
    for (let i = 0; i < 12; i++) {
      const x = -hw + 9 + i * ((CON.w - 18) / 11);
      rect(toggles, x - 0.4, -99, 0.8, 4);
      circle(toggles, x, -99, 0.7);
    }
    for (let i = 0; i < 4; i++) circle(cl, -hw + 16 + i * 20, -92, 2.4);
    // doors and handles on the base
    cl.moveTo(0, -84);
    cl.lineTo(0, -8);
    rect(cl, -hw + 3, -82, hw - 4.5, 74);
    rect(cl, 1.5, -82, hw - 4.5, 74);
    rect(cl, -4.5, -50, 1.2, 9);
    rect(cl, 3.3, -50, 1.2, 9);
    return { p, cl, meters, sockets, toggles };
  });
}

function drawConsole(c: CanvasRenderingContext2D, o: ConsoleOpts, env: PaintEnv) {
  const P = consolePaths();
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fill(P.p);
  // meter faces (lit cream) with needles
  c.fillStyle = mixLab(env.mood.haze, env.mood.rim, 0.45);
  c.fill(P.meters);
  const hw = CON.w / 2;
  c.save();
  c.strokeStyle = ink;
  c.lineWidth = 0.35;
  for (let i = 0; i < 3; i++) {
    const v = o.meters?.[i] ?? 0.3 + 0.2 * i;
    const cx = -hw + 20 + i * 26;
    const cy = -CON.h + 19;
    const a = -Math.PI / 2 + (v - 0.5) * 1.6;
    c.beginPath();
    c.arc(cx, cy, 8, -Math.PI / 2 - 0.85, -Math.PI / 2 + 0.85);
    c.stroke();
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10);
    c.stroke();
  }
  c.restore();
  c.fillStyle = ink;
  c.fill(P.toggles);
  cut(c, env, P.cl, 0.32, 1.1);
  // response lamps
  for (let i = 0; i < 8; i++) {
    const v = Math.max(0, Math.min(1, o.response?.[i] ?? 0));
    const x = -hw + 13 + i * ((CON.w - 26) / 7);
    const y = -CON.h + 33;
    const p = new Path2D();
    circle(p, x, y, 1.45);
    c.fillStyle = v > 0.02 ? lamp(env, 0.3 + 0.7 * v, 0.4 + 0.6 * v) : inkLift(env, 0.3);
    c.fill(p);
    if (v > 0.3) {
      const g = c.createRadialGradient(x, y, 0, x, y, 6);
      g.addColorStop(0, lamp(env, 0.8, 0.35 * v));
      g.addColorStop(1, lamp(env, 0.2, 0));
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = g;
      c.fillRect(x - 6, y - 6, 12, 12);
      c.restore();
    }
  }
}

export const perceptronConsole = defineProp<ConsoleOpts, 'lamps' | 'meter' | 'top'>(
  drawConsole,
  () => ({ lamps: { x: 0, y: -CON.h + 33 }, meter: { x: -CON.w / 2 + 20, y: -CON.h + 14 }, top: { x: 0, y: -CON.h } }),
  () => ({ x: -CON.w / 2, y: -CON.h, w: CON.w, h: CON.h }),
);

// ---------------------------------------------------------------------------
// The installation
// ---------------------------------------------------------------------------
export interface MarkIOpts extends PropAt {
  cells?: ArrayLike<number>;
  weights?: ArrayLike<number>;
  response?: ArrayLike<number>;
  meters?: number[];
  seed?: number;
  /** include the retina on its stand at the left (default true) */
  retina?: boolean;
}

const LAYOUT = { retina: -175, patch: -70, pot1: 14, pot2: 88, console: 176 };

function cableRun() {
  return memo('mk1:cable', () => {
    const p = new Path2D();
    // a fat cable bundle from the camera's back, down the stand, across the floor, into the plugboard
    const x0 = LAYOUT.retina - RET.face / 2 - 9;
    const y0 = RET.head;
    p.moveTo(x0, y0);
    p.bezierCurveTo(x0 - 14, y0 + 6, x0 - 16, -40, x0 - 6, -6);
    p.bezierCurveTo(x0 + 6, 2, LAYOUT.patch - 60, -1, LAYOUT.patch - 30, -3);
    p.bezierCurveTo(LAYOUT.patch - 26, -4, LAYOUT.patch - 22, -12, LAYOUT.patch - 22, -30);
    // cables between cabinets (draped over the tops)
    const tops = [LAYOUT.patch, LAYOUT.pot1, LAYOUT.pot2, LAYOUT.console];
    const p2 = new Path2D();
    for (let i = 0; i < tops.length - 1; i++) {
      const a = tops[i] + 20;
      const b = tops[i + 1] - 20;
      const ya = i === 2 ? -186 : -186;
      const yb = i + 1 === 3 ? -CON.h : -186;
      p2.moveTo(a, ya + 2);
      p2.bezierCurveTo(a + 6, ya - 10, b - 6, yb - 10, b, yb + 2);
      p2.moveTo(a - 4, ya + 2);
      p2.bezierCurveTo(a + 4, ya - 14, b - 2, yb - 13, b + 4, yb + 2);
    }
    return { p, p2 };
  });
}

export const markIPerceptron = defineProp<MarkIOpts, 'eye' | 'patch' | 'pots' | 'lamps' | 'console' | 'cable'>(
  (c, o, env) => {
    const C = cableRun();
    c.save();
    c.strokeStyle = env.fill('ink');
    c.lineCap = 'round';
    c.lineWidth = 2.2;
    c.stroke(C.p);
    c.lineWidth = 1.1;
    c.stroke(C.p2);
    c.restore();
    // sub-units apply their own CM scale: step back to px for them
    c.save();
    c.scale(1 / CM, 1 / CM);
    const at = (x: number) => ({ x: x * CM, y: 0 });
    perceptronPatchboard(c, { ...at(LAYOUT.patch), seed: o.seed ?? 1 }, env);
    const n = 80;
    const w = o.weights;
    const w1 = w ? Array.from({ length: n }, (_, i) => w[i] ?? 0) : undefined;
    const w2 = w ? Array.from({ length: n }, (_, i) => w[n + i] ?? 0) : undefined;
    perceptronPotRack(c, { ...at(LAYOUT.pot1), weights: w1, seed: (o.seed ?? 1) + 3 }, env);
    perceptronPotRack(c, { ...at(LAYOUT.pot2), weights: w2, seed: (o.seed ?? 1) + 4 }, env);
    perceptronConsole(c, { ...at(LAYOUT.console), response: o.response, meters: o.meters }, env);
    if (o.retina !== false) photocellRetina(c, { ...at(LAYOUT.retina), cells: o.cells }, env);
    c.restore();
  },
  () => ({
    eye: { x: LAYOUT.retina, y: RET.head },
    patch: { x: LAYOUT.patch, y: (PB.panelTop + PB.panelBot) / 2 },
    pots: { x: (LAYOUT.pot1 + LAYOUT.pot2) / 2, y: (POT.top + POT.bot) / 2 },
    lamps: { x: LAYOUT.console, y: -CON.h + 33 },
    console: { x: LAYOUT.console, y: -100 },
    cable: { x: LAYOUT.retina - 30, y: -4 },
  }),
  (o) => {
    const x0 = o.retina === false ? LAYOUT.patch - PB.w / 2 : LAYOUT.retina - 40;
    return { x: x0, y: -190, w: LAYOUT.console + CON.w / 2 - x0, h: 190 };
  },
);

/** Mark I sub-unit positions (local cm) for staging puppets beside each part. */
export const MARK_I_LAYOUT = LAYOUT;
