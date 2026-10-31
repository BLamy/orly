/**
 * ch05-s05 — THE NOTES PAYOFF, AS A FLASHBACK (scene, serverCyan; crossfade in from the desk; 12.08 s).
 *   L0507 "And the Notes window? On the thirteenth of October its text moved to the browser, and the loom shed most of
 *          its threads."
 *
 * Planted in ch03-s06. The camera pushes in on the desk's Notes window (sets/handwiredDesk, the same desk as ch05-s04)
 * and the lamp cools back to serverCyan as we pass through its paper. Behind it stands a GHOST LOOM: the same loom form
 * (sets/ch05-s01-loom3d) in a paler, cooler tint with softened edges. No export of the 13 October build exists, so its
 * threads are NOT individual weights: its thread DENSITY is drawn in proportion to the operation counts (the pinned
 * export's threads, multiplied by 19,851 / 4,646), and a small label says so: density ~ operations. Its end-post counter
 * reads 19,851 live operations (that day, after Files merged into Monitor). Notes stands in the foreground as a backlit
 * sheet with the ghost loom visible through it; a 13 OCT 2026 date stamp, and in the upper corner a small inset of the
 * Window Calendar (sets/windowCalendar) with its 13 October column dark but for one lit pane.
 *
 * TEACHES, word by word:
 *   date (0.4)       the push into Notes; through its paper by ~1.6 s: ghost loom, stamp, inset, counter, density label
 *   browser (5.77)   Notes' laid-out lines fold away; a plain, blank-edged browser text box with a caret takes their place
 *   shed (7.34)      most ghost threads go slack and fall away like cut warp threads, drifting down through the haze;
 *                    density falls in proportion (19,851 → 4,251: about four threads in five); whole frames empty. The
 *                    counter rolls 19,851 → 4,251 and the label reads 19,851 → 4,251 · about 4.7× smaller
 *   now (8.67)       the ghost tint dissolves back to the PINNED loom in its data-bound colours (the real export) and the
 *                    counter ticks up 4,251 → 4,646, with the plate 4,646 · pinned 27 Oct. Hold, the native text box
 *                    glowing in the Notes window in front of it.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, cam3Interp, defineShot, legibleSize, mixLab, textProbe, textRole, textSwap, toScreen, withAlpha } from '../../../film';
import type { Frame, LayerSpec } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { CIRCUIT, OS_COLORS } from '../sets/circuit';
import { deskGeom, handwiredDesk } from '../sets/handwiredDesk';
import { windowCalendar } from '../sets/windowCalendar';
import { loomRoom } from '../sets/ch05-s01-room';
import { LOOM, arcSlots, frameX, frameZ, loom3Flat, project, screenSpace, slotEnds, slotSign } from '../sets/ch05-s01-loom3d';

type C2 = CanvasRenderingContext2D;
const ID = 'ch05-s05';
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** the counts (OS03, OS04, OS02): 13 October after Files merged into Monitor; after the text moved; pinned 27 Oct */
const OPS_13 = 19851, OPS_AFTER = 4251, OPS_PINNED = 4646;
/** the ghost's thread density: the pinned export's threads multiplied in proportion to the operation counts */
const DENS = OPS_13 / OPS_PINNED;
const KEEP = OPS_AFTER / OPS_13;

/** the desk (as ch05-s04 leaves it) and its Notes window */
const DESK = { x: 230, y: 40, w: 820 };
const NOTES = deskGeom(DESK).win.notes;
/** Notes in the foreground once we are through its paper (screen px) */
const NB = { x: 76, y: 112, w: 372, h: 360 };
/** the ghost loom's fixed camera (it stands right of Notes; its end post just clear of the sheet) */
const LC: Camera3 = C(330, 340, -200);
const POST = project({ x: frameX(-1), y: LOOM.yc, z: frameZ(-1) }, LC);
const GHOST: LayerSpec = { id: 'ghost-loom', z: 1700, haze: 0.2, blur: 0 };

/** the falling threads: a seeded sample of the ghost's threads that are shed (drawn live as they drop) */
interface Strand {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  sign: number;
  t0: number;
  spin: number;
}
const hashU = (i: number, s: number) => {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s + 17, 0xc2b2ae35);
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2d);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};
const STRANDS: Strand[] = (() => {
  const out: Strand[] = [];
  const [k0, k1] = [arcSlots(0)[0], arcSlots(CIRCUIT.layers.length - 1)[1]];
  for (let q = k0; q < k1; q++) {
    if (hashU(q, 91) > 0.07) continue;
    const [a, b] = slotEnds(q);
    const p0 = project(a, LC), p1 = project(b, LC);
    out.push({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, sign: slotSign(q), t0: hashU(q, 92), spin: hashU(q, 93) - 0.5 });
  }
  return out;
})();

interface Beats {
  D: number;
  through: number;
  browser: number;
  shed: number;
  now: number;
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, through: 1.45, browser: T.beat('box'), shed: T.beat('shed'), now: T.beat('now') };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    // the lamp cools back to serverCyan as we pass through Notes' paper
    const cool = smr((t - 0.15) / 1.7);
    if (cool < 1) f.setMood('serverCyan', { from: 'candleAmber', u: cool });
    // the push into Notes (from ch05-s04's resting camera), then a slow drift
    const nc = { x: NOTES.x + NOTES.w / 2, y: NOTES.y + NOTES.h / 2 };
    const cam = t < 1.9 ? cam3Interp(C(640, 352, -20), C(nc.x, nc.y + 4, 480))(smr(t / 1.9)) : cam3Interp(C(nc.x, nc.y + 4, 480), C(nc.x + 2, nc.y + 4, 500))(sm((t - 1.9) / (b.D - 1.9)));
    f.camera(cam);
    const deskA = 1 - seg(t, 1.1, 1.75);
    const loomA = seg(t, 0.95, 1.7);
    // Notes: from its place on the desk (under the push) to the foreground sheet
    const n0 = toScreen(LAYERS.L4, cam, NOTES.x, NOTES.y), n1 = toScreen(LAYERS.L4, cam, NOTES.x + NOTES.w, NOTES.y + NOTES.h);
    const mv = smr((t - 1.15) / 1.0);
    const nr = { x: n0.x + (NB.x - n0.x) * mv, y: n0.y + (NB.y - n0.y) * mv, w: n1.x - n0.x + (NB.w - (n1.x - n0.x)) * mv, h: n1.y - n0.y + (NB.h - (n1.y - n0.y)) * mv };
    // the story's channels (threads fall on twos)
    const shedU = seg(t, b.shed - 0.1, b.shed + 1.3);
    const nowU = seg(t, b.now + 0.05, b.now + 1.25);
    const fold = smr((tq - (b.browser - 0.15)) / 0.55);
    const box = seg(t, b.browser + 0.15, b.browser + 0.55);

    // the loom's dark workshop comes up behind the sheet as we pass through it
    if (loomA > 0.01) loomRoom(f, LC, { key: ID, cams: [C(640, 352, -20), C(nc.x, nc.y + 4, 480), C(nc.x + 2, nc.y + 4, 500)], sunX: 900, tubes: 0.55 * loomA, light: 0.6 + 0.15 * (1 - loomA) });
    else f.backlight({ sunX: 860, intensity: 0.75 });
    // ---- phase A: the desk under the push
    if (deskA > 0.01) {
      f.layer('L4', (c, env) => {
        c.save();
        c.globalAlpha = deskA;
        handwiredDesk(f, c, env, { ...DESK, key: ID, lamp: 0.92, wire: 0.25, windows: { notes: { alpha: 1 - mv } } });
        c.restore();
      });
    }
    // ---- phase B: the ghost loom behind (baked, screen-locked; a 3 % push for life), then the pinned loom
    if (loomA > 0.01) {
      f.layer(GHOST, (c, env) => {
        c.save();
        screenSpace(c, GHOST, cam);
        const k = 1 + 0.03 * sm((t - 1.6) / (b.D - 1.6));
        c.translate(640, 380);
        c.scale(k, k);
        c.translate(-640, -380);
        const dense = loomA * (1 - shedU) * (1 - nowU);
        const sparse = loomA * shedU * (1 - nowU);
        const pinned = loomA * nowU;
        const bake = (key: string, o: { ghost: number; density?: number; keep?: number }, blur: number) =>
          f.cached(`${ID}/${key}/${env.mood.id}`, 1280, 720, (cc) => {
            loom3Flat(cc, env, { cam: LC, threads: o.ghost ? 0.85 : 1, ghost: o.ghost, density: o.density, keep: o.keep });
          }, { blur });
        if (dense > 0.005) {
          c.globalAlpha = dense;
          bake('dense', { ghost: 1, density: DENS }, 1.6)(c, 0, 0);
        }
        if (sparse > 0.005) {
          c.globalAlpha = sparse;
          bake('sparse', { ghost: 1, density: DENS, keep: KEEP }, 1.6)(c, 0, 0);
        }
        if (pinned > 0.005) {
          c.globalAlpha = pinned;
          bake('pinned', { ghost: 0 }, 0.4)(c, 0, 0);
        }
        c.globalAlpha = 1;
        // the cut threads, drifting down through the haze
        if (shedU > 0 && t < b.shed + 3.2) falling(c, env, tq - b.shed);
        // a faint paper grain over the flashback (it lifts with the ghost tint)
        if (1 - nowU > 0.01) grain(c, env, loomA * (1 - nowU));
        c.restore();
      });
      f.fog('B');
      // the counter on the end post, and the labels under it
      f.layer('L4', (c, env) => {
        c.save();
        screenSpace(c, LAYERS.L4, cam);
        counter(c, env, t, b, loomA);
        notesSheet(c, env, nr, mv, fold, box, t, tq, b);
        c.restore();
      });
      f.rim({ x: 0.6, y: -0.8 });
      const ts = { t, mood: f.mood };
      dateStamp(f.c, ts.mood, t, loomA, nowU);
      calendarInset(f, t, loomA * (1 - nowU));
    }
  },
});

// ---------------------------------------------------------------- the falling threads
function falling(c: C2, env: PaintEnv, dt: number) {
  for (const sign of [-1, 1]) {
    c.strokeStyle = withAlpha(mixLab(sign > 0 ? mixLab(OS_COLORS.copper, env.mood.core, 0.4) : mixLab(OS_COLORS.indigo, env.mood.rim, 0.4), mixLab(env.mood.rim, '#ffffff', 0.3), 0.7), 0.5);
    c.lineWidth = 0.7;
    c.beginPath();
    for (const s of STRANDS) {
      if (s.sign !== sign) continue;
      const u = dt - s.t0 * 1.1;
      if (u <= 0 || u > 2.2) continue;
      const drop = 0.5 * 260 * u * u;
      const sway = Math.sin(u * 3 + s.spin * 6) * 10 * u;
      const mx = (s.x0 + s.x1) / 2 + sway, my = (s.y0 + s.y1) / 2 + drop;
      // slack: the thread sags as it falls (a hanging curve), its ends drawing together a little
      const half = Math.hypot(s.x1 - s.x0, s.y1 - s.y0) / 2 * (1 - 0.25 * Math.min(1, u));
      const ang = Math.atan2(s.y1 - s.y0, s.x1 - s.x0) + s.spin * u * 0.6;
      const ax = mx - Math.cos(ang) * half, ay = my - Math.sin(ang) * half;
      const bx = mx + Math.cos(ang) * half, by = my + Math.sin(ang) * half;
      if (my > 760) continue;
      c.moveTo(ax, ay);
      c.quadraticCurveTo(mx, my + 18 * Math.min(1, u * 1.5), bx, by);
    }
    c.stroke();
  }
}

function grain(c: C2, env: PaintEnv, a: number) {
  c.fillStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.4), 0.05 * a);
  for (let i = 0; i < 260; i++) {
    const x = hashU(i, 7) * 1280, y = hashU(i, 8) * 720;
    c.fillRect(x, y, 1.2, 1.2);
  }
}

// ---------------------------------------------------------------- the end-post counter and its labels
function counter(c: C2, env: PaintEnv, t: number, b: Beats, a: number) {
  if (a <= 0.01) return;
  const roll = smr((twos(t) - b.shed) / 1.2);
  const tick = smr((twos(t) - (b.now + 0.25)) / 1.0);
  const n = t < b.now ? OPS_13 + (OPS_AFTER - OPS_13) * roll : OPS_AFTER + (OPS_PINNED - OPS_AFTER) * tick;
  const x = POST.x + 24, y = 548;
  const brass = mixLab('#a8844a', env.mood.halo, 0.25);
  c.save();
  c.globalAlpha = a;
  // the plate, bolted to the post, sized to its widest reading
  const s1 = legibleSize(c, `600 22px ${FONT.sc}`, 22, '19,851 live operations');
  c.font = `600 ${s1.toFixed(2)}px ${FONT.sc}`;
  const w = c.measureText('19,851 live operations').width + 40, h = Math.max(50, s1 * 1.9);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(POST.x - 6, y + h / 2 - 3, 32, 6);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.45);
  c.fillRect(x + 3, y + 4, w, h);
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, mixLab(brass, env.mood.core, 0.2));
  g.addColorStop(1, mixLab(brass, env.mood.set, 0.35));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.6);
  c.lineWidth = 1;
  c.strokeRect(x + 3, y + 3, w - 6, h - 6);
  const inkC = mixLab('#2a1d10', env.mood.ink, 0.3);
  textRole(c, 'subject', () => {
    c.font = `600 ${s1.toFixed(2)}px ${FONT.sc}`;
    c.fillStyle = inkC;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(`${fmt(n)} live operations`, x + w / 2, y + h / 2 + 1);
    textProbe(c, `${ID}-counter`, x + 8, y + 6, w - 16, h - 12, 1);
  });
  // the labels under the plate: density ~ operations (until the shed), then the shed's figures; and, on 'now', the
  // pinned plate's second line
  const sw = textSwap(t, b.shed + 0.15);
  const pinA = seg(t, b.now + 0.9, b.now + 1.3);
  const shedA = sw.in * (1 - seg(t, b.now + 1.3, b.now + 1.6));
  textRole(c, 'subject', () => {
    const s2 = legibleSize(c, `italic 400 19px ${FONT.text}`, 19, 'density ~ operations');
    c.font = `italic 400 ${s2.toFixed(2)}px ${FONT.text}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const lx = x + 4, ly = y + h + 30;
    const col = mixLab(env.mood.core, '#ffffff', 0.2);
    const plate = (wd: number, al: number) => {
      c.fillStyle = withAlpha(mixLab(env.mood.ink, env.mood.fg, 0.4), 0.6 * al);
      c.beginPath();
      c.roundRect(lx - 10, ly - s2 * 1.05, wd + 20, s2 * 1.5, 5);
      c.fill();
    };
    const dA = sw.out * seg(t, 1.5, 1.9);
    if (dA > 0.01) {
      const tw = c.measureText('density ~ operations').width;
      plate(tw, dA);
      c.fillStyle = withAlpha(col, dA);
      c.fillText('density ~ operations', lx, ly);
      textProbe(c, `${ID}-density`, lx, ly - s2, tw, s2 * 1.2, dA);
    }
    if (shedA > 0.01) {
      const txt = '19,851 → 4,251 · about 4.7× smaller';
      const tw = c.measureText(txt).width;
      plate(tw, shedA);
      c.fillStyle = withAlpha(col, shedA);
      c.fillText(txt, lx, ly);
      textProbe(c, `${ID}-shed`, lx, ly - s2, tw, s2 * 1.2, shedA);
    }
    if (pinA > 0.01) {
      const txt = 'pinned 27 Oct';
      c.font = `600 ${s2.toFixed(2)}px ${FONT.sc}`;
      const tw = c.measureText(txt).width;
      // engraved on the plate's lower edge, as a second brass strip
      c.fillStyle = withAlpha(mixLab(brass, env.mood.set, 0.25), pinA);
      c.fillRect(x + w - tw - 30, y + h + 2, tw + 24, s2 * 1.45);
      c.fillStyle = withAlpha(inkC, pinA);
      c.textAlign = 'left';
      c.fillText(txt, x + w - tw - 18, y + h + 2 + s2 * 1.08);
      textProbe(c, `${ID}-pinned`, x + w - tw - 18, y + h + 2, tw, s2 * 1.3, pinA);
    }
  });
  c.restore();
}

// ---------------------------------------------------------------- Notes, in the foreground
function notesSheet(c: C2, env: PaintEnv, r: { x: number; y: number; w: number; h: number }, mv: number, fold: number, box: number, t: number, tq: number, b: Beats) {
  if (mv <= 0.001) return;
  const back = mv; // how much it reads as a backlit sheet (vs. the desk's opaque window)
  c.save();
  c.globalAlpha = Math.min(1, mv * 3);
  const sheet = mixLab(mixLab(OS_COLORS.sheet, env.mood.halo, 0.3), env.mood.set, 0.25 * back);
  const ink = mixLab(OS_COLORS.ink, env.mood.ink, 0.3);
  // the backlit sheet: translucent so the ghost loom shows through it
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(r.x + 6, r.y + 8, r.w, r.h);
  c.fillStyle = withAlpha(sheet, 1 - 0.32 * back);
  c.beginPath();
  c.roundRect(r.x, r.y, r.w, r.h, r.w * 0.02);
  c.fill();
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.6);
  c.lineWidth = 1.4;
  c.stroke();
  // the title strip and its three rings
  const th = r.h * 0.085;
  c.fillStyle = mixLab(sheet, OS_COLORS.desk, 0.3);
  c.fillRect(r.x, r.y, r.w, th);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 ${(th * 0.62).toFixed(2)}px ${FONT.display}`, th * 0.62, 'Notes');
    c.font = `600 ${size.toFixed(2)}px ${FONT.display}`;
    c.fillStyle = withAlpha(ink, 0.9);
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText('Notes', r.x + r.w * 0.04, r.y + th * 0.55);
    textProbe(c, `${ID}-notes-title`, r.x + r.w * 0.04, r.y, c.measureText('Notes').width, th, 1);
  });
  c.strokeStyle = withAlpha(ink, 0.45);
  c.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(r.x + r.w - th * (0.55 + i * 0.75), r.y + th * 0.5, th * 0.17, 0, Math.PI * 2);
    c.stroke();
  }
  // its laid-out text (the program's own layout: illegible pen lines, texture), folding away upward on 'browser'
  const body = { x: r.x, y: r.y + th, w: r.w, h: r.h - th };
  if (fold < 1) {
    c.save();
    c.beginPath();
    c.rect(body.x, body.y, body.w, body.h);
    c.clip();
    const lh = body.h * 0.12;
    for (let i = 0; i < 6; i++) {
      // each line folds up into the one above it, top line last (like a paper blind)
      const fi = clamp01(fold * 1.6 - (5 - i) * 0.12);
      const y = body.y + lh * (i + 1) * (1 - fi) + lh * 0.3 * fi;
      const a = 1 - fi;
      if (a <= 0.01) continue;
      c.strokeStyle = withAlpha(ink, 0.55 * a);
      c.lineWidth = 1.5;
      c.beginPath();
      const len = body.w * (0.5 + ((i * 29) % 7) * 0.05);
      for (let k = 0; k <= 40; k++) {
        const x = body.x + body.w * 0.08 + (len * k) / 40;
        const yy = y + (Math.sin(k * 1.9 + i) * lh * 0.12 - Math.abs(Math.sin(k * 0.7 + i * 3)) * lh * 0.12) * (1 - fi);
        if (k === 0) c.moveTo(x, yy);
        else c.lineTo(x, yy);
      }
      c.stroke();
    }
    c.restore();
  }
  // the native browser text box: a plain blank-edged rectangle cut-out, with a caret
  if (box > 0) {
    const bx = { x: body.x + body.w * 0.07, y: body.y + body.h * 0.08, w: body.w * 0.86, h: body.h * 0.8 };
    const glow = seg(t, b.now + 0.6, b.now + 1.6);
    if (glow > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(bx.x + bx.w / 2, bx.y + bx.h / 2, 0, bx.x + bx.w / 2, bx.y + bx.h / 2, bx.w * 0.7);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.22 * glow));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(bx.x - bx.w * 0.2, bx.y - bx.h * 0.2, bx.w * 1.4, bx.h * 1.4);
      c.restore();
    }
    c.fillStyle = withAlpha(mixLab('#ffffff', env.mood.core, 0.25), 0.85 * box);
    c.fillRect(bx.x, bx.y, bx.w, bx.h);
    c.strokeStyle = withAlpha(mixLab(OS_COLORS.ink, env.mood.ink, 0.3), 0.75 * box);
    c.lineWidth = 1.2;
    c.strokeRect(bx.x, bx.y, bx.w, bx.h);
    // the caret blinks (on and off every half second)
    if (Math.floor(tq * 2) % 2 === 0) {
      c.fillStyle = withAlpha(OS_COLORS.ink, 0.85 * box);
      c.fillRect(bx.x + 14, bx.y + 14, 1.8, 22);
    }
  }
  c.restore();
}

// ---------------------------------------------------------------- 13 OCT 2026, and the Window Calendar inset
function dateStamp(c: C2, mood: PaintEnv['mood'], t: number, a: number, nowU: number) {
  const al = seg(t, 1.4, 1.9) * a * (1 - nowU);
  if (al <= 0.01) return;
  c.save();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 24px ${FONT.mono}`, 24, '13 OCT 2026');
    c.font = `500 ${size.toFixed(2)}px ${FONT.mono}`;
    const tw = c.measureText('13 OCT 2026').width;
    const x = NB.x + 4, y = 560;
    c.fillStyle = withAlpha(mixLab(mood.ink, mood.fg, 0.4), 0.6 * al);
    c.beginPath();
    c.roundRect(x - 12, y - size * 1.05, tw + 24, size * 1.5, 5);
    c.fill();
    c.fillStyle = withAlpha(mixLab(mood.core, '#ffffff', 0.2), al);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText('13 OCT 2026', x, y);
    textProbe(c, `${ID}-date`, x, y - size, tw, size * 1.2, al);
  });
  c.restore();
}

/** the Window Calendar, small, in the upper right: the 13-16 October tower dark but for 13 October's one lit pane */
function calendarInset(f: Frame, t: number, a: number) {
  const al = seg(t, 1.5, 2.1) * a;
  if (al <= 0.01) return;
  f.layer({ id: 'cal-inset', z: 1000, haze: 0, blur: 0 }, (c, env) => {
    c.save();
    screenSpace(c, LAYERS.L4, f.cam);
    c.globalAlpha = al;
    const px = 1062, py = 34, pw = 160, ph = 196;
    c.fillStyle = withAlpha(mixLab(env.mood.ink, env.mood.fg, 0.4), 0.7);
    c.beginPath();
    c.roundRect(px, py, pw, ph, 8);
    c.fill();
    c.strokeStyle = withAlpha(env.mood.rim, 0.35);
    c.lineWidth = 1;
    c.stroke();
    c.save();
    c.beginPath();
    c.rect(px + 4, py + 4, pw - 8, ph - 8);
    c.clip();
    c.translate(px + pw / 2, py + ph - 10);
    c.scale(0.3, 0.3);
    windowCalendar(f, c, env, { x: 0, y: 0, fill: { jun: 1, jul: 1, aug: 1, sep: 1, oct: 1 }, tower: 0, towerShell: 1, glowPane: ['d13', 0, 1], warm: 0.5, key: `${ID}-cal` });
    c.restore();
    c.restore();
  });
}
