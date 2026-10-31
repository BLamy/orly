/**
 * Machines 1940s–1990s (front elevations unless noted, real size at s = 1, y = floor/desk).
 *
 *   tubeRack({ x, y, shelves?: 5, perShelf?: 9, glow?: 0..1, seed? })    anchors: centre, top, glow
 *   tapeDrive({ x, y, spin?: rev/s (default 0.45), seed?, lamps?: 0..1 })  reels rotate by env.t, jerky
 *       anchors: reelL, reelR, head                                    (≈ 180 cm)
 *   console704({ x, y, activity?: 0..1, seed? })  operator's console: register lamps blink by env.t
 *       anchors: lamps, desk                                           (≈ 160 × 135 cm)
 *   mainframe704({ x, y, w?: 120, seed? })        frame cabinet with panel doors and indicator strip
 *   ibm704({ x, y, units?: Array<'tape'|'frame'|'console'>, spin?, activity?, seed? })
 *       an IBM-704-style machine room line-up (generic, no marks). anchors: console, firstReel
 *   crtTerminal({ x, y, view?: 'front'|'side', on?: true, phosphor?: 'green'|'amber'|'mood',
 *                 lines?: number (text rows shown), cursor?: true, keyboard?: true, seed? })
 *       anchors: screen (centre), screenTL, screenBR, glow, keys        (≈ 45 cm monitor on a desk)
 *   keyboard({ x, y, typing?: 0..1, seed? })      perspective top face; caps bob when typing
 *   workstation80s({ x, y, on?, phosphor?, lines?, seed? })   portrait monitor + deskside tower
 *       anchors: screen, screenTL, screenBR, tower                     (stands on the floor)
 *   checkScanner({ x, y, run?: true, seed? })     bank cheque reader/sorter; cheques travel by env.t
 *       anchors: readHead, hopper, pockets
 */
import type { PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import {
  type PropAt,
  blink,
  circle,
  cut,
  defineProp,
  ellipse,
  fbm,
  flicker,
  hash,
  inkLift,
  lamp,
  lathe,
  memo,
  paper,
  poly,
  rect,
  rrect,
  veil,
  wire,
  bar,
} from './_kit';

// ---------------------------------------------------------------------------
// Vacuum-tube rack
// ---------------------------------------------------------------------------
export interface TubeRackOpts extends PropAt {
  shelves?: number;
  perShelf?: number;
  glow?: number;
  seed?: number;
}

function tubeShape() {
  return memo('tube:shape', () => {
    // glass envelope (lathe) of an octal power tube
    const glass = lathe([[1.5, 0, 1], [1.6, -1.2], [1.9, -4], [1.9, -7.4], [1.6, -9.4], [1.0, -10.4], [0.3, -10.9, 1]]);
    const base = new Path2D();
    rrect(base, -1.75, 0, 3.5, 1.8, 0.5);
    const inner = new Path2D();
    rect(inner, -1.1, -7.4, 2.2, 5);
    rect(inner, -0.15, -9, 0.3, 1.8);
    rect(inner, -1.3, -2.2, 2.6, 0.5);
    const edge = new Path2D();
    edge.moveTo(1.25, -1.6);
    edge.quadraticCurveTo(1.7, -5, 1.25, -8.6);
    return { glass, base, inner, edge };
  });
}

function rackFrame(w: number, h: number, shelves: number) {
  return memo(`rack:${w}:${h}:${shelves}`, () => {
    const p = new Path2D();
    const hw = w / 2;
    // two upright rails with a top crossmember, plinth
    rect(p, -hw, -h, 5, h);
    rect(p, hw - 5, -h, 5, h);
    rect(p, -hw, -h, w, 6);
    rect(p, -hw - 1, -8, w + 2, 8);
    const sy: number[] = [];
    const span = h - 22;
    for (let i = 0; i < shelves; i++) {
      const y = -14 - (span * i) / shelves;
      sy.push(y);
      rect(p, -hw + 5, y - 3, w - 10, 3); // chassis tray
      rect(p, -hw + 5, y, w - 10, 6.5); // front panel under the tray
    }
    const cl = new Path2D();
    // rack screw holes on the rails
    for (let y = -h + 9; y < -10; y += 3.4) {
      circle(cl, -hw + 2.5, y, 0.3);
      circle(cl, hw - 2.5, y, 0.3);
    }
    for (const y of sy) {
      cl.moveTo(-hw + 6, y + 3.2);
      cl.lineTo(hw - 6, y + 3.2);
      for (const x of [-hw + 9, hw - 9]) circle(cl, x, y + 3.4, 0.9);
    }
    return { p, cl, sy };
  });
}

export const tubeRack = defineProp<TubeRackOpts, 'centre' | 'top' | 'glow'>(
  (c, o, env) => {
    const w = 60;
    const h = 182;
    const shelves = o.shelves ?? 5;
    const n = o.perShelf ?? 9;
    const R = rackFrame(w, h, shelves);
    const T = tubeShape();
    const ink = env.fill('ink');
    const g = o.glow ?? 1;
    const seed = o.seed ?? 4;
    // back wiring harness behind the tubes (sagging)
    c.save();
    c.strokeStyle = mixLab(ink, env.mood.set, 0.25);
    c.lineWidth = 0.5;
    c.beginPath();
    for (const y of R.sy) {
      for (let k = 0; k < 3; k++) {
        const yy = y - 12 - k * 4;
        c.moveTo(-w / 2 + 5, yy);
        c.bezierCurveTo(-10, yy + 5 + k, 10, yy + 4 - k, w / 2 - 5, yy + 1);
      }
    }
    c.stroke();
    c.restore();
    c.fillStyle = ink;
    c.fill(R.p);
    cut(c, env, R.cl, 0.3, 1);
    // tubes, transformers, capacitors per shelf
    const glass = new Path2D();
    const solid = new Path2D();
    const edges = new Path2D();
    const fil: Array<{ x: number; y: number; k: number }> = [];
    R.sy.forEach((y, si) => {
      const span = w - 16;
      for (let i = 0; i < n; i++) {
        const x = -span / 2 + (span * (i + 0.5)) / n;
        const kind = hash(si * 31 + i, seed);
        const m = new DOMMatrix().translate(x, y - 4.8);
        if (kind < 0.16) {
          // transformer can
          rrect(solid, x - 2.3, y - 9.5, 4.6, 6.5, 0.6);
          rect(solid, x - 1.6, y - 10.5, 3.2, 1);
        } else if (kind < 0.26) {
          // electrolytic capacitor
          rrect(solid, x - 1.2, y - 10, 2.4, 7, 0.6);
          circle(solid, x, y - 10, 0.5);
        } else {
          const sc = 0.75 + 0.35 * hash(si * 31 + i, seed + 1);
          const mm = m.scale(sc, sc);
          glass.addPath(T.glass, mm);
          solid.addPath(T.inner, mm);
          solid.addPath(T.base, mm);
          edges.addPath(T.edge, mm);
          fil.push({ x, y: y - 4.8 - 5 * sc, k: sc });
        }
      }
    });
    veil(c, env, glass, 0.16);
    c.fillStyle = ink;
    c.fill(solid);
    cut(c, env, edges, 0.5, 1.1);
    if (g > 0) {
      // filament glows: tiny hot cores + soft halos inside the glass
      c.save();
      c.globalCompositeOperation = 'lighter';
      fil.forEach((f, i) => {
        const k = g * (0.75 + 0.25 * flicker(env.t, seed + i)) * (0.8 + 0.4 * hash(i, seed + 9));
        const gr = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, 3.2 * f.k);
        gr.addColorStop(0, lamp(env, 0.9, 0.85 * k));
        gr.addColorStop(0.35, lamp(env, 0.4, 0.32 * k));
        gr.addColorStop(1, lamp(env, 0, 0));
        c.fillStyle = gr;
        c.fillRect(f.x - 3.2 * f.k, f.y - 3.2 * f.k, 6.4 * f.k, 6.4 * f.k);
      });
      c.restore();
    }
  },
  () => ({ centre: { x: 0, y: -90 }, top: { x: 0, y: -182 }, glow: { x: 0, y: -100 } }),
  () => ({ x: -31, y: -182, w: 62, h: 182 }),
);

// ---------------------------------------------------------------------------
// Tape drive (IBM 727-style: two reels behind glass, vacuum columns below)
// ---------------------------------------------------------------------------
export interface TapeDriveOpts extends PropAt {
  spin?: number;
  seed?: number;
  lamps?: number;
}

const TD = { w: 76, h: 182, reelY: -136, reelR: 13.5, reelDX: 17 };

function tapeCab() {
  return memo('td:cab', () => {
    const hw = TD.w / 2;
    const p = new Path2D();
    rect(p, -hw, -TD.h, TD.w, TD.h - 4);
    rect(p, -hw + 2, -4, TD.w - 4, 4);
    // window for the reels (hole) and two vacuum-column windows
    const holes = new Path2D();
    rrect(holes, -hw + 4.5, -TD.h + 13, TD.w - 9, 40, 2);
    rect(holes, -hw + 14, -TD.h + 64, 12, 52);
    rect(holes, hw - 26, -TD.h + 64, 12, 52);
    const cl = new Path2D();
    rect(cl, -hw + 3.2, -TD.h + 11.7, TD.w - 6.4, 42.6);
    cl.moveTo(-hw + 2, -TD.h + 58);
    cl.lineTo(hw - 2, -TD.h + 58);
    cl.moveTo(-hw + 2, -TD.h + 121);
    cl.lineTo(hw - 2, -TD.h + 121);
    cl.moveTo(0, -TD.h + 122);
    cl.lineTo(0, -6);
    rect(cl, -hw + 3, -TD.h + 122, hw - 4, TD.h - 128);
    rect(cl, 1, -TD.h + 122, hw - 4, TD.h - 128);
    for (const x of [-4, 4]) rect(cl, x - 0.5, -40, 1, 8);
    // head assembly between the reels
    const head = new Path2D();
    rrect(head, -5, TD.reelY + 6, 10, 9, 1);
    rect(head, -1.5, TD.reelY + 15, 3, 4);
    for (const x of [-9, 9]) circle(head, x, TD.reelY + 16, 1.3);
    return { p, holes, cl, head };
  });
}

function reel() {
  return memo('td:reel', () => {
    // flange with three windows and a hub (the classic tape-reel silhouette)
    const p = new Path2D();
    circle(p, 0, 0, TD.reelR);
    for (let k = 0; k < 3; k++) {
      const a0 = (k * Math.PI * 2) / 3 + 0.22;
      const a1 = a0 + (Math.PI * 2) / 3 - 0.44;
      const r0 = 4.4;
      const r1 = TD.reelR - 2.2;
      p.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0);
      p.arc(0, 0, r0, a0, a1);
      p.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
      p.arc(0, 0, r1, a1, a0, true);
      p.closePath();
    }
    circle(p, 0, 0, 1.4);
    return p;
  });
}

/** jerky tape motion: accumulated angle with start/stop bursts */
function reelAngle(t: number, spin: number, seed: number) {
  // integrate a stepped speed profile (24 steps/s) — cheap closed form per step
  const steps = Math.floor(t * 4);
  let a = 0;
  for (let i = 0; i < steps; i++) a += speedAt(i, seed) * 0.25;
  a += speedAt(steps, seed) * (t * 4 - steps) * 0.25;
  return a * spin * Math.PI * 2;
}
function speedAt(i: number, seed: number) {
  const h = hash(i, seed);
  return h < 0.3 ? 0 : h < 0.55 ? -0.6 : 1 + h;
}

export const tapeDrive = defineProp<TapeDriveOpts, 'reelL' | 'reelR' | 'head'>(
  (c, o, env) => {
    const C = tapeCab();
    const ink = env.fill('ink');
    const seed = o.seed ?? 2;
    const shell = new Path2D();
    shell.addPath(C.p);
    shell.addPath(C.holes);
    // glass behind the windows: a hazed interior so reels read as silhouettes
    c.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.haze, 0.5), 0.55);
    c.fill(C.holes);
    // vacuum-column tape loops (depth varies with t)
    const hw = TD.w / 2;
    const loop = (x: number, ph: number) => {
      const d = 22 + 16 * fbm(env.t * 0.9 + ph, seed + ph * 10);
      c.beginPath();
      c.moveTo(x - 4.4, -TD.h + 64);
      c.lineTo(x - 4.4, -TD.h + 64 + d);
      c.arc(x, -TD.h + 64 + d, 4.4, Math.PI, 0, true);
      c.lineTo(x + 4.4, -TD.h + 64);
      c.stroke();
    };
    c.save();
    c.strokeStyle = ink;
    c.lineWidth = 0.6;
    loop(-hw + 20, 0.3);
    loop(hw - 20, 1.7);
    c.restore();
    c.fillStyle = ink;
    c.fill(shell, 'evenodd');
    cut(c, env, C.cl, 0.3, 1);
    // reels
    const ang = reelAngle(env.t, o.spin ?? 0.45, seed);
    const R = reel();
    for (const [i, sx] of [-1, 1].entries()) {
      c.save();
      c.translate(sx * TD.reelDX, TD.reelY);
      // tape pack (wound radius trades between reels slowly)
      const pack = 6 + 4.5 * (0.5 + 0.5 * Math.sin(env.t * 0.05 + i * Math.PI));
      c.fillStyle = mixLab(ink, env.mood.set, 0.3);
      c.beginPath();
      c.arc(0, 0, pack, 0, Math.PI * 2);
      c.fill();
      c.rotate(ang * (1 + i * 0.07));
      c.fillStyle = ink;
      c.fill(R, 'evenodd');
      c.restore();
    }
    // tape from the packs down to the head
    c.save();
    c.strokeStyle = ink;
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(-TD.reelDX - 10, TD.reelY + 2);
    c.lineTo(-9, TD.reelY + 17.3);
    c.lineTo(9, TD.reelY + 17.3);
    c.lineTo(TD.reelDX + 10, TD.reelY + 2);
    c.stroke();
    c.restore();
    c.fillStyle = ink;
    c.fill(C.head);
    // lamps: ready / select / tape indicate
    const L = o.lamps ?? 1;
    for (let i = 0; i < 4; i++) {
      const on = L > 0 && (i === 0 || blink(i, env.t, seed, 0.5 * L, 1.5));
      const p = new Path2D();
      circle(p, -9 + i * 6, -TD.h + 6.5, 1.1);
      c.fillStyle = on ? lamp(env, 0.85) : inkLift(env, 0.35);
      c.fill(p);
    }
  },
  () => ({ reelL: { x: -TD.reelDX, y: TD.reelY }, reelR: { x: TD.reelDX, y: TD.reelY }, head: { x: 0, y: TD.reelY + 12 } }),
  () => ({ x: -TD.w / 2, y: -TD.h, w: TD.w, h: TD.h }),
);

// ---------------------------------------------------------------------------
// 704-style operator's console and frame cabinet
// ---------------------------------------------------------------------------
export interface Console704Opts extends PropAt {
  activity?: number;
  seed?: number;
}

const CS = { w: 160, deskH: 76, panelTop: -138 };

function consoleGeom() {
  return memo('c704', () => {
    const p = new Path2D();
    const hw = CS.w / 2;
    // desk with a writing ledge, modesty panel, legs
    rect(p, -hw - 3, -CS.deskH - 2.5, CS.w + 6, 2.5);
    rect(p, -hw, -CS.deskH, 34, CS.deskH);
    rect(p, hw - 34, -CS.deskH, 34, CS.deskH);
    rect(p, -hw + 34, -CS.deskH, CS.w - 68, 12);
    // raked panel housing rising from the back of the desk
    poly(p, [-hw + 6, -CS.deskH - 2.5, hw - 6, -CS.deskH - 2.5, hw - 10, CS.panelTop, -hw + 10, CS.panelTop]);
    rect(p, -hw + 8, CS.panelTop - 3, CS.w - 16, 3);
    const lampsAt: Array<{ x: number; y: number }> = [];
    // register rows of 36 lamps (accumulator, MQ, storage …), grouped in threes
    const rows = 7;
    for (let r = 0; r < rows; r++) {
      const y = CS.panelTop + 7 + r * 6.4;
      const inset = 14 + r * 0.2;
      const span = CS.w - 2 * inset - 10;
      for (let i = 0; i < 36; i++) lampsAt.push({ x: -hw + inset + 5 + (i * span) / 35 + Math.floor(i / 3) * 0, y });
    }
    const cl = new Path2D();
    for (let r = 0; r < rows; r++) {
      const y = CS.panelTop + 10.2 + r * 6.4;
      cl.moveTo(-hw + 16, y);
      cl.lineTo(hw - 16, y);
    }
    // toggle switches + buttons on the desk front of the panel
    const sw = new Path2D();
    for (let i = 0; i < 36; i++) {
      const x = -hw + 20 + (i * (CS.w - 40)) / 35;
      rect(sw, x - 0.3, -CS.deskH - 9, 0.6, 3.4);
      circle(sw, x, -CS.deskH - 9, 0.55);
    }
    for (let i = 0; i < 10; i++) rrect(cl, -hw + 30 + i * 10, -CS.deskH - 15.5, 6, 3.6, 0.8);
    // drawer seams
    for (const x0 of [-hw, hw - 34]) for (let k = 1; k < 4; k++) {
      cl.moveTo(x0 + 2, -CS.deskH + k * 18);
      cl.lineTo(x0 + 32, -CS.deskH + k * 18);
    }
    return { p, lampsAt, cl, sw };
  });
}

export const console704 = defineProp<Console704Opts, 'lamps' | 'desk'>(
  (c, o, env) => {
    const G = consoleGeom();
    const ink = env.fill('ink');
    c.fillStyle = ink;
    c.fill(G.p);
    c.fill(G.sw);
    cut(c, env, G.cl, 0.28, 1);
    const act = o.activity ?? 0.45;
    const seed = o.seed ?? 6;
    const on = new Path2D();
    const off = new Path2D();
    G.lampsAt.forEach((q, i) => circle(blink(i, env.t, seed, act, 4) ? on : off, q.x, q.y, 0.95));
    c.fillStyle = inkLift(env, 0.3);
    c.fill(off);
    c.fillStyle = lamp(env, 0.9);
    c.fill(on);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = lamp(env, 0.3, 0.18);
    c.lineWidth = 1.4;
    c.strokeStyle = lamp(env, 0.3, 0.12);
    c.stroke(on);
    c.restore();
  },
  () => ({ lamps: { x: 0, y: CS.panelTop + 26 }, desk: { x: 0, y: -CS.deskH - 2.5 } }),
  () => ({ x: -CS.w / 2 - 3, y: CS.panelTop - 3, w: CS.w + 6, h: -CS.panelTop + 3 }),
);

export interface FrameOpts extends PropAt {
  w?: number;
  seed?: number;
}
export const mainframe704 = defineProp<FrameOpts, 'centre' | 'top'>(
  (c, o, env) => {
    const w = o.w ?? 120;
    const G = memo(`frame704:${w}`, () => {
      const p = new Path2D();
      rect(p, -w / 2, -182, w, 178);
      rect(p, -w / 2 + 2, -4, w - 4, 4);
      const cl = new Path2D();
      const doors = Math.max(2, Math.round(w / 40));
      for (let i = 0; i < doors; i++) {
        const x = -w / 2 + (w * i) / doors;
        rect(cl, x + 2, -170, w / doors - 4, 162);
        rect(cl, x + w / doors - 6, -96, 1.2, 10);
        for (let k = 0; k < 8; k++) {
          cl.moveTo(x + 6, -160 + k * 1.8);
          cl.lineTo(x + w / doors - 6, -160 + k * 1.8);
        }
      }
      cl.moveTo(-w / 2 + 1, -175);
      cl.lineTo(w / 2 - 1, -175);
      return { p, cl };
    });
    c.fillStyle = env.fill('ink');
    c.fill(G.p);
    cut(c, env, G.cl, 0.26, 1);
    const on = new Path2D();
    for (let i = 0; i < 18; i++) if (blink(i, env.t, o.seed ?? 3, 0.4, 2)) circle(on, -w / 2 + 8 + i * ((w - 16) / 17), -178.5, 0.8);
    c.fillStyle = lamp(env, 0.85);
    c.fill(on);
  },
  () => ({ centre: { x: 0, y: -90 }, top: { x: 0, y: -182 } }),
  (o) => ({ x: -(o.w ?? 120) / 2, y: -182, w: o.w ?? 120, h: 182 }),
);

export interface Ibm704Opts extends PropAt {
  units?: Array<'tape' | 'frame' | 'console'>;
  spin?: number;
  activity?: number;
  seed?: number;
}
const UNIT_W = { tape: 84, frame: 128, console: 176 };
export const ibm704 = defineProp<Ibm704Opts, 'console' | 'firstReel'>(
  (c, o, env) => {
    const units = o.units ?? ['tape', 'tape', 'tape', 'frame', 'console'];
    const total = units.reduce((a, u) => a + UNIT_W[u], 0);
    const K = 320 / 175;
    c.save();
    c.scale(1 / K, 1 / K);
    let x = -total / 2;
    units.forEach((u, i) => {
      const cx = (x + UNIT_W[u] / 2) * K;
      const seed = (o.seed ?? 1) * 17 + i;
      if (u === 'tape') tapeDrive(c, { x: cx, y: 0, spin: (o.spin ?? 0.45) * (0.8 + 0.4 * hash(i, 5)), seed }, env);
      else if (u === 'frame') mainframe704(c, { x: cx, y: 0, seed }, env);
      else console704(c, { x: cx, y: 0, activity: o.activity, seed }, env);
      x += UNIT_W[u];
    });
    c.restore();
  },
  (o) => {
    const units = o.units ?? ['tape', 'tape', 'tape', 'frame', 'console'];
    const total = units.reduce((a, u) => a + UNIT_W[u], 0);
    let x = -total / 2;
    let cons = { x: 0, y: -100 };
    let reel = { x: 0, y: TD.reelY };
    let gotReel = false;
    for (const u of units) {
      if (u === 'console') cons = { x: x + UNIT_W[u] / 2, y: CS.panelTop + 26 };
      if (u === 'tape' && !gotReel) {
        reel = { x: x + UNIT_W[u] / 2 - TD.reelDX, y: TD.reelY };
        gotReel = true;
      }
      x += UNIT_W[u];
    }
    return { console: cons, firstReel: reel };
  },
  (o) => {
    const units = o.units ?? ['tape', 'tape', 'tape', 'frame', 'console'];
    const total = units.reduce((a, u) => a + UNIT_W[u], 0);
    return { x: -total / 2, y: -184, w: total, h: 184 };
  },
);

// ---------------------------------------------------------------------------
// CRT terminal (and the 80s workstation monitor)
// ---------------------------------------------------------------------------
export interface CrtOpts extends PropAt {
  view?: 'front' | 'side';
  on?: boolean;
  phosphor?: 'green' | 'amber' | 'mood';
  /** number of text rows shown (fake text bars; real text comes from the type module) */
  lines?: number;
  cursor?: boolean;
  keyboard?: boolean;
  seed?: number;
}

function phosphorColor(env: PaintEnv, kind: CrtOpts['phosphor'], u: number, a = 1) {
  const base = kind === 'amber' ? '#ffc070' : kind === 'mood' ? env.mood.core : '#9ef5b4';
  const hot = mixLab(base, env.mood.core, kind === 'mood' ? 0 : 0.25);
  const dim = mixLab(hot, env.fill('ink'), 0.72);
  return withAlpha(mixLab(dim, hot, u), a);
}

/** front-view CRT geometry; big = workstation monitor */
function crtFront(big: boolean) {
  return memo(`crt:front:${big}`, () => {
    const W = big ? 50 : 46;
    const H = big ? 52 : 37;
    const top = big ? -66 : -50;
    const p = new Path2D();
    // the housing: front bezel + a deep hood stepping back on the right (3/4 read)
    rrect(p, -W / 2, top, W, H, 3.2);
    poly(p, [W / 2 - 2, top + 2, W / 2 + 13, top + 6, W / 2 + 13, top + H - 6, W / 2 - 2, top + H - 1]);
    // pedestal / plinth with a tilt foot
    if (big) {
      poly(p, [-6, top + H, 6, top + H, 9, -5.4, -9, -5.4]);
      rrect(p, -16, -5.6, 32, 5.6, 1.6);
    } else {
      poly(p, [-W / 2 + 4, top + H, W / 2 - 4, top + H, W / 2 - 2, -1.5, -W / 2 + 2, -1.5]);
      rect(p, -W / 2 + 3, -1.5, W - 6, 1.5);
    }
    // screen: barrel-shaped glass (bulging sides)
    const sw = W - (big ? 9 : 10);
    const sh = H - (big ? 9 : 11);
    const sx = -sw / 2;
    const sy = top + (big ? 4 : 4.4);
    const s = new Path2D();
    const b = 1.2;
    s.moveTo(sx + 3, sy);
    s.quadraticCurveTo(0, sy - b, sx + sw - 3, sy);
    s.quadraticCurveTo(sx + sw, sy, sx + sw, sy + 3);
    s.quadraticCurveTo(sx + sw + b, sy + sh / 2, sx + sw, sy + sh - 3);
    s.quadraticCurveTo(sx + sw, sy + sh, sx + sw - 3, sy + sh);
    s.quadraticCurveTo(0, sy + sh + b, sx + 3, sy + sh);
    s.quadraticCurveTo(sx, sy + sh, sx, sy + sh - 3);
    s.quadraticCurveTo(sx - b, sy + sh / 2, sx, sy + 3);
    s.quadraticCurveTo(sx, sy, sx + 3, sy);
    s.closePath();
    const cl = new Path2D();
    // bezel bevel and vent slots on the hood
    rrect(cl, sx - 1.6, sy - 1.6, sw + 3.2, sh + 3.2, 3.6);
    for (let k = 0; k < 6; k++) {
      const x = W / 2 + 2 + k * 1.8;
      cl.moveTo(x, top + 8 + k * 0.6);
      cl.lineTo(x, top + 15 + k * 0.6);
    }
    if (!big) {
      // brand-free badge strip + knobs under the screen
      circle(cl, W / 2 - 5, top + H - 3.2, 0.9);
      circle(cl, W / 2 - 9, top + H - 3.2, 0.9);
    }
    return { p, s, cl, sx, sy, sw, sh, top, W, H };
  });
}

function crtSide() {
  return memo('crt:side', () => {
    // profile: barrel-glass face (right), deep hood tapering to the yoke at the back,
    // swivel neck on a plinth, and the detached low keyboard wedge in front
    const p = new Path2D();
    p.moveTo(16.4, -49.6);
    p.quadraticCurveTo(18.4, -34, 16.4, -18.4);
    p.lineTo(14.8, -17.6);
    p.lineTo(1, -18.6);
    p.bezierCurveTo(-6, -19.4, -12, -22, -16.5, -26);
    p.lineTo(-21.5, -27);
    p.lineTo(-21.5, -36.5);
    p.lineTo(-16.5, -37.8);
    p.bezierCurveTo(-12, -44, -4, -49.6, 2, -50.6);
    p.lineTo(14.8, -50.4);
    p.closePath();
    rrect(p, -24, -36, 3.2, 8.4, 1); // yoke / tube neck cap at the back
    // swivel neck + plinth
    poly(p, [-5.5, -18.6, 3.5, -18.4, 2.4, -6.2, -4.4, -6.2]);
    poly(p, [-12, -1, 10.5, -1, 8.6, -6.4, -10.2, -6.4]);
    rrect(p, -12.6, -1.2, 23.6, 1.2, 0.5);
    // keyboard wedge (profile), keycap tops
    poly(p, [22, -1, 44, -1, 44, -2.2, 23.4, -5.2, 22, -4.8]);
    for (let k = 0; k < 6; k++) {
      const x = 24.4 + k * 3.2;
      const y = -5.1 + k * 0.48;
      rrect(p, x, y - 0.9, 2.5, 1.1, 0.35);
    }
    const cl = new Path2D();
    // bezel seam, hood moulding, vents
    cl.moveTo(13.6, -50.2);
    cl.quadraticCurveTo(15.2, -34, 13.6, -18);
    cl.moveTo(-14, -38.6);
    cl.lineTo(-14, -25.2);
    for (let k = 0; k < 7; k++) {
      cl.moveTo(-1 - k * 2.2, -47.6 + k * 1.3);
      cl.lineTo(-1 - k * 2.2, -41.6 + k * 1.3);
    }
    cl.moveTo(-9.6, -3.4);
    cl.lineTo(8.2, -3.4);
    const cord = new Path2D();
    cord.moveTo(22.2, -2.2);
    cord.bezierCurveTo(16, -0.4, 14, -0.6, 10.5, -1.6);
    const glass = new Path2D();
    glass.moveTo(16.6, -49);
    glass.quadraticCurveTo(18.5, -34, 16.6, -19);
    return { p, cl, glass, cord };
  });
}

function paintScreen(c: CanvasRenderingContext2D, env: PaintEnv, F: ReturnType<typeof crtFront>, o: CrtOpts) {
  const on = o.on !== false;
  const kind = o.phosphor ?? 'green';
  if (!on) {
    c.fillStyle = inkLift(env, 0.3);
    c.fill(F.s);
    // dead-glass reflection
    const r = new Path2D();
    ellipse(r, F.sx + F.sw * 0.3, F.sy + F.sh * 0.25, F.sw * 0.22, F.sh * 0.1, -0.3);
    veil(c, env, r, 0.07);
    return;
  }
  const seed = o.seed ?? 7;
  const k = 0.97 + 0.03 * Math.sin(env.t * 50 + seed); // a whisper of refresh shimmer
  const cx = F.sx + F.sw / 2;
  const cy = F.sy + F.sh / 2;
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, F.sw * 0.7);
  g.addColorStop(0, phosphorColor(env, kind, 0.42 * k));
  g.addColorStop(0.7, phosphorColor(env, kind, 0.3 * k));
  g.addColorStop(1, phosphorColor(env, kind, 0.12));
  c.fillStyle = g;
  c.fill(F.s);
  c.save();
  c.clip(F.s);
  // scanlines
  c.fillStyle = withAlpha(env.fill('ink'), 0.16);
  for (let y = F.sy; y < F.sy + F.sh; y += 0.7) c.fillRect(F.sx - 1, y, F.sw + 2, 0.3);
  // text rows
  const rows = Math.max(0, Math.floor(o.lines ?? 9));
  const lh = 2.15;
  const x0 = F.sx + 2.6;
  const maxW = F.sw - 5.2;
  c.fillStyle = phosphorColor(env, kind, 1, 0.92);
  let lastX = x0;
  let lastY = F.sy + 3;
  for (let r = 0; r < rows && F.sy + 3 + r * lh < F.sy + F.sh - 3; r++) {
    const y = F.sy + 3 + r * lh;
    let x = x0 + (hash(r, seed + 3) < 0.25 ? 2.4 : 0);
    const len = maxW * (0.3 + 0.65 * hash(r, seed));
    while (x < x0 + len) {
      const wl = 0.8 + 2.6 * hash(Math.floor(x * 10) + r * 97, seed);
      c.fillRect(x, y, Math.min(wl, x0 + len - x), 1.0);
      x += wl + 0.75;
    }
    lastX = x;
    lastY = y;
  }
  if (o.cursor !== false && Math.floor(env.t * 1.9) % 2 === 0) c.fillRect(rows ? lastX + 0.2 : x0, rows ? lastY : F.sy + 3, 1.1, 1.3);
  c.restore();
  // glass highlight + bloom on the bezel
  const hl = new Path2D();
  hl.moveTo(F.sx + 2, F.sy + 5);
  hl.quadraticCurveTo(F.sx + 1.2, F.sy + F.sh / 2, F.sx + 2, F.sy + F.sh - 5);
  cut(c, env, hl, 0.25, 1.4);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const b = c.createRadialGradient(cx, cy, F.sw * 0.3, cx, cy, F.sw * 0.85);
  b.addColorStop(0, phosphorColor(env, kind, 0.6, 0.1));
  b.addColorStop(1, phosphorColor(env, kind, 0.2, 0));
  c.fillStyle = b;
  c.fillRect(cx - F.sw, cy - F.sw, F.sw * 2, F.sw * 2);
  c.restore();
}

export interface KeyboardOpts extends PropAt {
  typing?: number;
  seed?: number;
  w?: number;
}

function drawKeyboard(c: CanvasRenderingContext2D, env: PaintEnv, o: KeyboardOpts) {
  const w = o.w ?? 46;
  const G = memo(`kbd:${w}`, () => {
    // seen from slightly above: a trapezoid deck, front edge, caps in perspective rows
    const p = new Path2D();
    poly(p, [-w / 2, 0, w / 2, 0, w / 2 - 2.4, -5.6, -w / 2 + 2.4, -5.6]);
    const deck = new Path2D();
    poly(deck, [-w / 2 + 1.6, -1.6, w / 2 - 1.6, -1.6, w / 2 - 3.2, -5, -w / 2 + 3.2, -5]);
    const caps: Array<{ x: number; y: number; w: number; h: number }> = [];
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const v = r / (rows - 1);
      const y = -1.9 - v * 2.9;
      const half = w / 2 - 2 - v * 1.6;
      const n = 14;
      const cw = (2 * half) / n;
      for (let i = 0; i < n; i++) {
        const wide = r === 0 && i >= 4 && i <= 9;
        if (r === 0 && i > 4 && i <= 9) continue;
        caps.push({ x: -half + i * cw + 0.12, y: y - 0.62, w: (wide ? cw * 6 : cw) - 0.24, h: 0.55 });
      }
    }
    return { p, deck, caps };
  });
  c.fillStyle = env.fill('ink');
  c.fill(G.p);
  c.fillStyle = inkLift(env, 0.32);
  c.fill(G.deck);
  c.fillStyle = env.fill('ink');
  const ty = o.typing ?? 0;
  const tq = Math.floor(env.t * 12);
  for (let i = 0; i < G.caps.length; i++) {
    const q = G.caps[i];
    const down = ty > 0 && hash(i * 7 + tq * 131, o.seed ?? 2) < ty * 0.06;
    c.fillRect(q.x, q.y + (down ? 0.25 : 0), q.w, q.h);
  }
}

export const keyboard = defineProp<KeyboardOpts, 'centre' | 'home'>(
  (c, o, env) => drawKeyboard(c, env, o),
  () => ({ centre: { x: 0, y: -3 }, home: { x: 0, y: -3.6 } }),
  (o) => ({ x: -(o.w ?? 46) / 2, y: -6, w: o.w ?? 46, h: 6 }),
);

export const crtTerminal = defineProp<CrtOpts, 'screen' | 'screenTL' | 'screenBR' | 'glow' | 'keys'>(
  (c, o, env) => {
    const ink = env.fill('ink');
    if (o.view === 'side') {
      const S = crtSide();
      c.fillStyle = ink;
      c.fill(S.p);
      wire(c, env, S.cord, 0.45);
      cut(c, env, S.cl, 0.26, 1);
      if (o.on !== false) {
        c.save();
        c.strokeStyle = phosphorColor(env, o.phosphor ?? 'green', 0.9, 0.9);
        c.lineWidth = 0.7;
        c.stroke(S.glass);
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(19, -32, 0, 19, -32, 26);
        g.addColorStop(0, phosphorColor(env, o.phosphor ?? 'green', 0.7, 0.32));
        g.addColorStop(1, phosphorColor(env, o.phosphor ?? 'green', 0.3, 0));
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(17.5, -49);
        c.lineTo(42, -58);
        c.lineTo(42, -10);
        c.lineTo(17.5, -19);
        c.closePath();
        c.fill();
        c.restore();
      }
      return;
    }
    const F = crtFront(false);
    c.fillStyle = ink;
    c.fill(F.p);
    cut(c, env, F.cl, 0.26, 1);
    paintScreen(c, env, F, o);
    if (o.keyboard !== false) {
      c.save();
      c.translate(-5, 0);
      drawKeyboard(c, env, { x: 0, y: 0, typing: o.on === false ? 0 : 0.6, seed: o.seed });
      c.restore();
      // coiled cord
      c.save();
      c.strokeStyle = ink;
      c.lineWidth = 0.35;
      c.beginPath();
      for (let i = 0; i <= 30; i++) {
        const u = i / 30;
        const x = 15 + u * 5 + Math.cos(u * 40) * 0.6;
        const y = -2.4 - u * 1.8 + Math.sin(u * 40) * 0.5;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.restore();
    }
  },
  (o) => {
    if (o.view === 'side') return { screen: { x: 17, y: -34 }, screenTL: { x: 17, y: -49 }, screenBR: { x: 17, y: -19 }, glow: { x: 24, y: -34 }, keys: { x: 32, y: -4 } };
    const F = crtFront(false);
    return {
      screen: { x: F.sx + F.sw / 2, y: F.sy + F.sh / 2 },
      screenTL: { x: F.sx, y: F.sy },
      screenBR: { x: F.sx + F.sw, y: F.sy + F.sh },
      glow: { x: F.sx + F.sw / 2, y: F.sy + F.sh / 2 },
      keys: { x: -5, y: -3 },
    };
  },
  (o) => (o.view === 'side' ? { x: -24, y: -51, w: 68, h: 51 } : { x: -23, y: -50, w: 59, h: 50 }),
);

// ---------------------------------------------------------------------------
// 1980s workstation: portrait monitor on a desk-height stand + deskside tower
// ---------------------------------------------------------------------------
export interface WorkstationOpts extends PropAt {
  on?: boolean;
  phosphor?: CrtOpts['phosphor'];
  lines?: number;
  seed?: number;
}

export const workstation80s = defineProp<WorkstationOpts, 'screen' | 'screenTL' | 'screenBR' | 'tower'>(
  (c, o, env) => {
    const ink = env.fill('ink');
    const G = memo('ws80', () => {
      const p = new Path2D();
      // a plain table
      rect(p, -60, -74, 120, 3);
      rect(p, -57, -71, 3, 71);
      rect(p, 54, -71, 3, 71);
      rect(p, -54, -71, 108, 5);
      // deskside tower to the right, under the table end
      rect(p, 62, -96, 34, 96);
      const cl = new Path2D();
      for (let k = 0; k < 5; k++) rect(cl, 66, -90 + k * 7, 26, 4.6);
      for (let k = 0; k < 14; k++) {
        cl.moveTo(66, -44 + k * 2.6);
        cl.lineTo(92, -44 + k * 2.6);
      }
      return { p, cl };
    });
    c.fillStyle = ink;
    c.fill(G.p);
    cut(c, env, G.cl, 0.26, 1);
    const on = new Path2D();
    if (o.on !== false) circle(on, 89, -60, 0.7);
    c.fillStyle = lamp(env, 0.9);
    c.fill(on);
    // monitor on the table
    c.save();
    c.translate(-4, -74);
    const F = crtFront(true);
    c.fillStyle = ink;
    c.fill(F.p);
    cut(c, env, F.cl, 0.26, 1);
    paintScreen(c, env, F, { ...o, lines: o.lines ?? 18, phosphor: o.phosphor ?? 'mood' });
    c.restore();
    // keyboard + mouse
    c.save();
    c.translate(-14, -74);
    drawKeyboard(c, env, { x: 0, y: 0, w: 42, typing: o.on === false ? 0 : 0.5, seed: o.seed });
    c.restore();
    const m = new Path2D();
    ellipse(m, 20, -75.2, 2.6, 1.3);
    c.fillStyle = ink;
    c.fill(m);
    c.save();
    c.strokeStyle = ink;
    c.lineWidth = 0.3;
    c.beginPath();
    c.moveTo(22.4, -75.6);
    c.bezierCurveTo(28, -78, 26, -73.6, 32, -75);
    c.stroke();
    c.restore();
  },
  () => {
    const F = crtFront(true);
    return {
      screen: { x: -4 + F.sx + F.sw / 2, y: -74 + F.sy + F.sh / 2 },
      screenTL: { x: -4 + F.sx, y: -74 + F.sy },
      screenBR: { x: -4 + F.sx + F.sw, y: -74 + F.sy + F.sh },
      tower: { x: 79, y: -60 },
    };
  },
  () => ({ x: -60, y: -142, w: 156, h: 142 }),
);

// ---------------------------------------------------------------------------
// Cheque reader / sorter (bank document processor, 1990s)
// ---------------------------------------------------------------------------
export interface CheckScannerOpts extends PropAt {
  run?: boolean;
  seed?: number;
}

const CK = { w: 170, h: 84, track: -84 };

export const checkScanner = defineProp<CheckScannerOpts, 'readHead' | 'hopper' | 'pockets'>(
  (c, o, env) => {
    const ink = env.fill('ink');
    const G = memo('chk', () => {
      const p = new Path2D();
      // cabinet with a rounded front, kick plate
      rrect(p, -CK.w / 2, -CK.h + 4, CK.w, CK.h - 8, 3);
      rect(p, -CK.w / 2 + 3, -4, CK.w - 6, 4);
      // feed hopper (left), read station hood (middle), pocket bank (right)
      poly(p, [-CK.w / 2 + 4, CK.track, -CK.w / 2 + 30, CK.track, -CK.w / 2 + 30, CK.track - 4, -CK.w / 2 + 4, CK.track - 14]);
      rrect(p, -22, CK.track - 22, 26, 22, 2.5);
      rect(p, -18, CK.track - 26, 6, 4);
      const pockets = new Path2D();
      for (let i = 0; i < 8; i++) {
        const x = 18 + i * 8.4;
        poly(pockets, [x, CK.track, x + 1.2, CK.track, x + 2.4, CK.track - 13, x + 1.2, CK.track - 13]);
      }
      p.addPath(pockets);
      // track rail
      rect(p, -CK.w / 2 + 4, CK.track, CK.w - 8, 2.2);
      // operator ledge with a keypad, and pocket windows along the front
      rect(p, -CK.w / 2 - 4, CK.track + 20, 62, 2.4);
      poly(p, [-CK.w / 2 - 4, CK.track + 22.4, -CK.w / 2 + 58, CK.track + 22.4, -CK.w / 2 + 52, CK.track + 28, -CK.w / 2 + 2, CK.track + 28]);
      const cl = new Path2D();
      cl.moveTo(-CK.w / 2 + 3, CK.track + 6);
      cl.lineTo(CK.w / 2 - 3, CK.track + 6);
      for (let i = 0; i < 12; i++) rrect(cl, -CK.w / 2 + 4 + (i % 6) * 8.4, CK.track + 9.4 + Math.floor(i / 6) * 4.8, 6.6, 3.4, 0.6);
      for (let i = 0; i < 8; i++) rect(cl, 16.5 + i * 8.4, CK.track + 9, 6.8, 13);
      rect(cl, -CK.w / 2 + 8, CK.track + 34, 76, 40);
      rect(cl, -CK.w / 2 + 90, CK.track + 34, 72, 40);
      cl.moveTo(-CK.w / 2 + 46, CK.track + 34);
      cl.lineTo(-CK.w / 2 + 46, CK.track + 74);
      cl.moveTo(-CK.w / 2 + 126, CK.track + 34);
      cl.lineTo(-CK.w / 2 + 126, CK.track + 74);
      // small CRT/status panel on the hood
      const scr = new Path2D();
      rect(scr, -19, CK.track - 19, 12, 7);
      // operator's terminal on a swing arm above the hopper
      rrect(p, -CK.w / 2 - 2, CK.track - 52, 30, 23, 2.4);
      poly(p, [-CK.w / 2 + 4, CK.track - 29, -CK.w / 2 + 22, CK.track - 29, -CK.w / 2 + 19, CK.track - 26, -CK.w / 2 + 7, CK.track - 26]);
      bar(p, -CK.w / 2 + 13, CK.track - 26, -CK.w / 2 + 34, CK.track - 14, 2.2);
      bar(p, -CK.w / 2 + 34, CK.track - 14, -CK.w / 2 + 34, CK.track, 2.6);
      const term = new Path2D();
      rrect(term, -CK.w / 2 + 1.5, CK.track - 49, 23, 17, 1.6);
      // pocket windows (front, at track level): stacks of sorted cheques behind glass
      const win = new Path2D();
      for (let i = 0; i < 8; i++) rect(win, 16.5 + i * 8.4, CK.track + 9, 6.8, 13);
      return { p, cl, scr, term, win };
    });
    // stacked cheques in the hopper and in the pockets (paper tone)
    const pap = new Path2D();
    for (let i = 0; i < 7; i++) {
      const x = -CK.w / 2 + 8 + i * 2.6;
      poly(pap, [x, CK.track - 1, x + 1.8, CK.track - 1, x - 1.2, CK.track - 8.6, x - 3, CK.track - 8.6]);
    }
    for (let i = 0; i < 8; i++) {
      const x = 18 + i * 8.4 + 3;
      const n = 1 + Math.floor(hash(i, o.seed ?? 3) * 3);
      for (let k = 0; k < n; k++) rect(pap, x + k * 1.1, CK.track - 7 - k * 0.4, 0.8, 6.6);
    }
    // travelling cheques through the read station
    if (o.run !== false) {
      const speed = 38;
      for (let k = 0; k < 4; k++) {
        const u = ((env.t * speed + k * 34) % 136) / 136;
        const x = -CK.w / 2 + 30 + u * 136 * 0.68;
        rect(pap, x, CK.track - 7.4, 15, 7.2);
      }
    }
    c.fillStyle = paper(env, 0.9);
    c.fill(pap);
    c.fillStyle = ink;
    c.fill(G.p);
    c.fillStyle = inkLift(env, 0.3);
    c.fill(G.win);
    c.fillStyle = paper(env, 0.55);
    for (let i = 0; i < 8; i++) {
      const lvl = 0.25 + 0.65 * hash(i * 3 + Math.floor(env.t * 0.5 + hash(i, 9) * 4), o.seed ?? 3);
      const hh = 12 * lvl;
      c.fillRect(17.3 + i * 8.4, CK.track + 21.6 - hh, 5.2, hh);
    }
    cut(c, env, G.cl, 0.26, 1);
    // operator terminal: phosphor screen with a few status rows
    const tOn = o.run !== false;
    c.fillStyle = tOn ? phosphorColor(env, 'green', 0.35) : inkLift(env, 0.3);
    c.fill(G.term);
    if (tOn) {
      c.fillStyle = phosphorColor(env, 'green', 1, 0.85);
      for (let r = 0; r < 5; r++) {
        const w = 6 + 12 * hash(r + Math.floor(env.t * 2) * (r === 4 ? 1 : 0), 21);
        c.fillRect(-CK.w / 2 + 4, CK.track - 46.4 + r * 3, w, 1.1);
      }
    }
    // read lamp + status screen
    const on = o.run !== false;
    c.fillStyle = on ? lamp(env, 0.6, 0.85) : inkLift(env, 0.3);
    c.fill(G.scr);
    if (on) {
      const k = 0.85 + 0.15 * flicker(env.t, 4);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(0, CK.track - 1, 0, CK.track - 12);
      g.addColorStop(0, lamp(env, 0.9, 0.6 * k));
      g.addColorStop(1, lamp(env, 0.5, 0));
      c.fillStyle = g;
      c.fillRect(-9, CK.track - 12, 6, 11);
      c.restore();
    }
  },
  () => ({ readHead: { x: -6, y: CK.track - 4 }, hopper: { x: -CK.w / 2 + 16, y: CK.track - 6 }, pockets: { x: 48, y: CK.track - 6 } }),
  () => ({ x: -CK.w / 2 - 4, y: CK.track - 52, w: CK.w + 4, h: -CK.track + 52 }),
);
