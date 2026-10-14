/**
 * ch08-s06 — "Nobody cut these stencils" (dawnGold; 12.1 s; plain cut in from the cathedral of ch08-s05).
 * 96 tiles of television snow are nudged, pass after pass, into the learned mosaic by the 1986 messenger.
 * The building is ch08-s05's cathedral (sets/ch08-s05-cathedral): same towers, same stepped courses, same rose
 * window with its jewelled ring and tracery, same ridge and trees behind it (sets/ch08-s06-rose).
 *
 *   0 → 'these'    CLOSE on s05's rose window: the husky photograph in its jewelled ring (where s05 left it).
 *   'these' →      "these stencils": the 96 jewels lift off the ring and fly into the glass, enlarging, and as
 *   'noise'        they travel they dissolve into static ("they began as noise"); the photograph fades out under
 *                  them. On 'noise' the glass is 96 panes of pure grey speckle, seething on twos ("television snow").
 *   'noise' →      a slow pull back (2.8 s) to the whole cathedral; light climbs the courses to the crown (the
 *   'messenger'    forward pass; no picture is ever shown in the glass, so it never reads as the net drawing one).
 *   'messenger'    the dark bead in its ring of light (ch05's design) appears at the crown and runs DOWN the
 *                  cathedral's axis: the crown, the two halls, the five stencil courses s05 just named, the plinth,
 *                  into the glass on "cut them". Each course flashes and jolts 2 px as the bead passes; on arrival
 *                  the seething snow freezes (still noise). Label: back-propagation, 1986 (beside the crown; it
 *                  fades before the camera moves).
 *   'nudge'        the camera eases back in onto the window (2.4 s) while the passes repeat, faster and faster.
 *                  The glass only ever shows the SAME 96-tile grid in intermediate states, each step landing on a
 *                  word: 'nudge' (8.29) ~40 % of the tiles click from noise to oriented strokes (mostly the grey
 *                  edge tiles, rippling out from where the bead sank), the rest stay noise; 'nudge' again (9.02)
 *                  ~70 %; the two quick passes after it only sharpen what is already structured.
 *   'mosaic'       the last pass lands: the remaining tiles resolve and every tile reaches full contrast; the bead
 *                  fades in the glass; the finished edge/colour mosaic (grey edges at every angle, soft colour
 *                  blobs, interleaved) holds, still, through the music: the chapter's thesis image.
 *                  ILLUSTRATIVE stamp on the ring (procedural tiles, not the real weights).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { defineShot, mixLab, withAlpha } from '../../../film';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { FONT, legibleFont } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/silhouette/atmosphere';
import { mixCam } from '../sets/ch08-s01-kit';
import { CAT, cathedral, type CathedralState } from '../sets/ch08-s05-cathedral';
import { tileAtlas, TILE_N } from '../sets/ch08-s06-filters';
import { clamp01, inkLabel, lerp, pulse, sm, win } from '../sets/ch08-s06-kit';
import {
  CELL,
  GL,
  JEWEL_SLOT,
  SLOTS,
  S06_TILE,
  beadAt,
  beadU,
  churchyardWall,
  fullCathedral,
  glassPane,
  jewel,
  jewelSprite,
  landscape,
  onScreen,
  porchColumns,
  ringGlass,
  forecourt,
  stageSpans,
} from '../sets/ch08-s06-rose';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s06';

// cameras: close on the rose window (k 3); a CUT on the line break to the whole cathedral (s05's last framing,
// drifting gently in); then the push back in to the glass from "cut them" so the last passes play at full size.
const CA0: Camera3 = { x: 640, y: 556, z: 640, lens: 1 };
const CA: Camera3 = { x: 640, y: 554, z: 667, lens: 1 };
const CAD: Camera3 = { x: 646, y: 553, z: 650, lens: 1 }; // a slow breath back while "television snow" is said
const CW0: Camera3 = { x: 634, y: 348, z: -30, lens: 1 };
const CW1: Camera3 = { x: 640, y: 354, z: 14, lens: 1 };
const CE: Camera3 = { x: 640, y: 556, z: 690, lens: 1 };
const CE1: Camera3 = { x: 648, y: 557, z: 700, lens: 1 }; // the hold's drift (the near posts slide against the wall)
const PUSH = 2.4;

interface Pass {
  start: number; // bead appears at the crown
  land: number; // bead sinks into the glass
  /** fraction of the 96 tiles that show learned structure after this pass (the same grid, never a picture) */
  F: number;
  /** contrast of the structured tiles after this pass (noise left in them = 1 - C) */
  C: number;
}
interface B {
  D: number;
  these: number;
  noise: number;
  snow: number;
  cut: number; // the in-shot cut to the wide
  push: number; // the push back in begins ("cut them")
  bead: number;
  nudge: number;
  mosaic: number;
  passes: Pass[];
}

/** the order in which tiles find their structure: mostly the grey oriented-edge tiles first (k < 48), so the ~40 %
 *  step reads as "some tiles show strokes"; the toy vertical-edge tile (k 24, ch08-s04's hand stencil) is first */
const RANK: number[] = (() => {
  const key = Array.from({ length: TILE_N }, (_, k) => (k === 24 ? -1 : hash1(k, 6091) + (k < 48 ? 0 : 0.55)));
  const order = Array.from({ length: TILE_N }, (_, k) => k).sort((a, z) => key[a] - key[z]);
  const r = new Array<number>(TILE_N).fill(0);
  order.forEach((k, i) => (r[k] = i));
  return r;
})();
/** each tile's click delay after a landing: it ripples out from the glass centre, where the bead sinks */
const DELAY: number[] = (() => {
  const d = new Array<number>(TILE_N).fill(0);
  SLOTS.forEach((sl, j) => {
    d[S06_TILE(j)] = 0.18 * Math.min(1, Math.hypot(sl.x - GL.x, sl.y - GL.y) / GL.r) + 0.03 * hash1(j, 6097);
  });
  return d;
})();
/** each jewel's flight: lift-off delay (by angle, so the ring empties as a sweep) */
const FLY = Array.from({ length: 96 }, (_, q) => 0.05 + 0.5 * ((jewel(q).a / (Math.PI * 2) + 0.25) % 1) + 0.08 * hash1(q, 6071));
const FLY_DUR = 0.85;

function camAt(t: number, b: B): Camera3 {
  if (t < b.cut) {
    const c = mixCam(CA0, CA, sm(t / Math.max(0.1, b.noise)));
    return mixCam(c, CAD, sm((t - b.snow) / (b.cut - b.snow + 1.2)));
  }
  const c = mixCam(CW0, CW1, sm((t - b.cut) / (b.push - b.cut + 0.6)));
  const e = mixCam(c, CE, sm((t - b.push) / PUSH));
  return mixCam(e, CE1, sm((t - b.push - PUSH) / Math.max(0.5, b.D - b.push - PUSH)));
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const bead = T.beat('bead');
    const nudge = T.beat('learn');
    const mosaic = T.beat('mosaic');
    const cutThem = T.word('L0812', 'cut');
    const nudge2 = T.word('L0812', 'nudge#2');
    // landings: "cut them", 'nudge', 'nudge' again, then faster and faster to 'mosaic'.
    // The grid's states: noise (snow freezes on "cut them") -> ~40 % structured on 'nudge' -> ~70 % on 'nudge'
    // again -> the two quick passes sharpen the structured tiles -> the full mosaic on 'mosaic'.
    const lands = [cutThem, nudge, nudge2, lerp(nudge2, mosaic, 0.36), lerp(nudge2, mosaic, 0.69), mosaic];
    const durs = [cutThem - bead, 0.8, 0.62, 0.46, 0.36, 0.3];
    const Fs = [0, 0.4, 0.7, 0.7, 0.7, 1];
    const Cs = [0, 0.8, 0.86, 0.91, 0.95, 1];
    const passes: Pass[] = lands.map((land, i) => ({ start: i === 0 ? bead : land - durs[i], land, F: Fs[i], C: Cs[i] }));
    const b: B = {
      D,
      these: T.word('L0811', 'these'),
      noise: T.beat('noise'),
      snow: T.word('L0811', 'snow'),
      cut: T.line('L0812').start - 0.14,
      push: cutThem,
      bead,
      nudge,
      mosaic,
      passes,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const cam = camAt(t, b);
    f.camera(cam);
    f.backlight({ sunX: 640, sunY: 470, sunRadius: 560, intensity: 0.95 });
    landscape(f, ID);
    // haze between the cathedral and the far ridge (as s05), and a thin low band at the horizon
    f.fog({ yCenter: 0.66 * 720, height: 0.36 * 720, alpha: 0.22, drift: 7 });
    f.fog({ yCenter: 0.52 * 720, height: 0.12 * 720, alpha: 0.1, drift: 4 });

    const st = teach(t, b);
    const atlas = tileAtlas(ID);
    atlas.update(st.key, st.tileState, st.snowTick);

    f.layer('L4', (c, env) => {
      forecourt(c, env);
      cathedral(c, env, st.cat);
      plinthNiches(c, env);
      ringGlass(c, env, 0.8 * win(t, b.these + 0.3, b.these + 1.3));
      glassPane(c, env, {
        atlas,
        tile: S06_TILE,
        cellA: st.cellA,
        photo: st.photo,
        light: 1,
        lift: st.lift,
      });
      // the bead sinking into the glass: a ring of light spreading across the panes
      if (st.ripple > 0.01) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = withAlpha(env.mood.core, 0.5 * st.ripple);
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(GL.x, GL.y, GL.r * (0.12 + 0.9 * (1 - st.ripple)), 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      // s05's jewels in flight into the glass
      flights(c, t, b, atlas);
      // the messenger: a constant on-screen size whatever the camera (ch05's backward pulse), with a short trail
      const ks = 1000 / (1000 - cam.z);
      for (const bd of st.beads) bigBead(c, bd.x, bd.y, ks, bd.k, bd.ghost, env);
    });
    f.rim({ x: 0, y: -1 });
    churchyardWall(f, cam);
    porchColumns(f, ID, cam);
    lampPosts(f, cam);

    // ---------------------------------------------------------------- type (screen-locked)
    // beside the crown, where the messenger appears; gone before the camera moves on 'nudge'
    const la = win(t, b.bead + 0.15, b.bead + 0.7) * (1 - win(t, b.push - 0.55, b.push - 0.05));
    if (la > 0.01) {
      inkLabel(f.c, 'back-propagation, 1986', 928, 86, {
        size: 27,
        font: `italic 400 27px ${FONT.text}`,
        color: mixLab(f.mood.core, '#efe3cf', 0.4),
        plate: f.mood.ink,
        plateAlpha: 0.5,
        alpha: la,
      });
    }
    const ia = win(t, b.mosaic + 0.1, b.mosaic + 0.7);
    if (ia > 0.01) {
      const p = onScreen(cam, GL.x, GL.y + GL.r + 15);
      // a stamp the viewer must read (procedural tiles, not the real weights): at the legibility floor
      const [font, size] = legibleFont(f.c, `500 18px ${FONT.mono}`, 'ILLUSTRATIVE');
      inkLabel(f.c, 'ILLUSTRATIVE', 640, Math.min(600, p.y + 8), {
        size,
        font,
        tracking: 2.5,
        align: 'center',
        color: withAlpha(mixLab(f.mood.rim, '#efe3cf', 0.4), 0.85),
        plate: f.mood.ink,
        plateAlpha: 0.5,
        alpha: ia * 0.85,
      });
    }
  },
});

// ================================================================================================= TEACHING
interface Bead {
  x: number;
  y: number;
  k: number;
  /** 0 = the bead itself; 1..3 = its trail ghosts */
  ghost: number;
}
interface St {
  key: string;
  tileState: (k: number) => { u: number; seed: number; snow?: number };
  snowTick: number;
  cat: CathedralState;
  cellA: (j: number) => number;
  photo: number;
  lift: (j: number) => number;
  beads: Bead[];
  ripple: number;
}

/** 0..1 how far jewel q has flown into the glass */
const flightU = (t: number, b: B, q: number) => clamp01((t - b.these - FLY[q]) / FLY_DUR);

function teach(t: number, b: B): St {
  // the grid's state: each landing is one discrete step of the SAME 96 tiles (a tile clicks from noise to its
  // oriented strokes when the landing's ripple reaches it), never a picture and never a continuous blend
  let ripple = 0;
  let moving = false;
  let landed = 0;
  for (const p of b.passes) {
    ripple = Math.max(ripple, pulse(t, p.land - 0.02, 0.06, 0.32));
    if (t >= p.land - 0.01 && t <= p.land + 0.32) moving = true;
    if (t >= p.land) landed++;
  }
  const tileU = (k: number) => {
    let u = 0;
    for (const p of b.passes) {
      const e = sm((t - p.land - DELAY[k]) / 0.08);
      if (e <= 0) break;
      const target = RANK[k] < p.F * TILE_N - 0.5 ? p.C : 0;
      u = lerp(u, target, e);
    }
    return u;
  };
  // television snow: from the jewels' arrival until the messenger, on twos
  const snowAmt = win(t, b.these + 0.6, b.noise) * (1 - win(t, b.bead - 0.3, b.passes[0].land)) * 0.7;
  const snowTick = snowAmt > 0.002 ? Math.floor(t * 12) : 0;
  const tileState = (k: number) => ({ u: tileU(k), seed: 1, snow: snowAmt });
  const key = `${moving ? t.toFixed(3) : landed}|${snowTick}|${snowAmt.toFixed(3)}`;
  // the cells fill as their jewels arrive
  const slotU = new Array<number>(96).fill(0);
  for (let q = 0; q < 96; q++) slotU[JEWEL_SLOT[q]] = sm(flightU(t, b, q));
  const cellA = (j: number) => (slotU[j] >= 0.999 ? 1 : 0);
  const photo = 1 - win(t, b.these + 0.35, b.noise - 0.15);
  // each landing flashes only the tiles that click into structure (rippling out with them); the others take a
  // faint tug, so the window never washes out and every intermediate state stays readable
  const lift = (j: number) => {
    const k = S06_TILE(j);
    let v = 0;
    let prevF = 0;
    for (const p of b.passes) {
      const fresh = RANK[k] >= prevF * TILE_N - 0.5 && RANK[k] < p.F * TILE_N - 0.5;
      const amt = p === b.passes[0] ? 0.3 : fresh ? 0.95 : 0.14;
      v = Math.max(v, amt * pulse(t, p.land + DELAY[k], 0.03, 0.22));
      prevF = p.F;
    }
    return v * (0.8 + 0.2 * hash1(j, 6081));
  };

  // forward light: a quick climb window → crown just before each bead (the forward pass goes up as light only,
  // the error comes back down as the bead)
  let front = -1;
  for (const p of b.passes) {
    const fw = p === b.passes[0] ? 0.75 : Math.min(0.42, (p.land - p.start) * 0.55);
    const a0 = p.start - fw;
    if (t >= a0 && t <= p.start + 0.1) front = Math.max(front, clamp01((t - a0) / fw));
  }
  // base light (s05's resting state), the climbing front, and each stage's tug as the bead passes
  const lit = [0.35, 0.35, 0.35, 0.35, 0.35, 0.6, 0.6, 0.3];
  if (front >= 0) {
    // stage order from the window up: conv1..conv5, fc6, fc7, crown → lit index 0..7
    for (let k = 0; k < 8; k++) lit[k] = Math.max(lit[k], 0.85 * Math.exp(-((k - front * 8.4 + 0.2) ** 2) / 0.9));
  }
  const course = [1, 1, 1, 1, 1];
  const hall = [1, 1];
  let crown = 1;
  const beads: Bead[] = [];
  b.passes.forEach((p, i) => {
    if (t < p.start - 0.02 || t > p.land + 0.45) return;
    const dur = p.land - p.start;
    const u = clamp01((t - p.start) / dur);
    const appear = sm((t - p.start) / 0.16);
    const fade = 1 - sm((t - p.land) / (i === b.passes.length - 1 ? 0.45 : 0.25));
    const q = beadAt(u);
    const sink = u > 0.95 ? 1 - (u - 0.95) * 12 : 1; // it sinks into the glass
    // the trail: three ghosts 0.06 s apart while it descends
    for (let g = 3; g >= 1; g--) {
      const ug = clamp01((t - g * 0.06 - p.start) / dur);
      if (ug <= 0.001 || ug >= 0.95 || u >= 1) continue;
      const qg = beadAt(ug);
      beads.push({ x: qg.x, y: qg.y, k: appear * fade * (0.62 - g * 0.16), ghost: g });
    }
    beads.push({ x: q.x, y: q.y, k: appear * fade * Math.max(0.25, sink), ghost: 0 });
    // the tug: each stage flashes for 0.15 s and jolts 2 px as the bead reaches it
    for (const sp of stageSpans) {
      const te = p.start + dur * clamp01(beadU(sp.y0 + 4));
      const fl = pulse(t, te, 0.03, 0.09) * appear;
      if (fl <= 0.002) continue;
      lit[sp.lit] = Math.max(lit[sp.lit], 0.35 + 0.65 * fl);
      if (sp.kind === 'course') course[sp.i] = Math.min(course[sp.i], 1 - (2 / 26) * fl);
      else if (sp.kind === 'hall') hall[sp.i] = Math.min(hall[sp.i], 1 - (2 / 22) * fl);
      else crown = Math.min(crown, 1 - (2 / 20) * fl);
    }
  });
  const cat = fullCathedral({ course, hall, crown, lit: lit.map(clamp01), t, threads: 0.42 });
  return { key, tileState, snowTick, cat, cellA, photo, lift, beads, ripple };
}

/** s05's ring jewels lift off and fly into the glass, enlarging and turning to static as they go */
function flights(c: C, t: number, b: B, atlas: ReturnType<typeof tileAtlas>) {
  if (t < b.these - 0.1 || t > b.these + 0.8 + FLY_DUR) {
    if (t < b.these) ringJewels(c, () => 1);
    return;
  }
  const spr = jewelSprite();
  ringJewels(c, (q) => (flightU(t, b, q) > 0 ? 0 : 1));
  for (let q = 0; q < 96; q++) {
    const u = flightU(t, b, q);
    if (u <= 0 || u >= 1) continue;
    const e = sm(u);
    const jw = jewel(q);
    const sl = SLOTS[JEWEL_SLOT[q]];
    // a little arc outward-then-in (paper lifted off the tracery)
    const x = lerp(jw.x, sl.x, e);
    const y = lerp(jw.y, sl.y, e) - Math.sin(Math.PI * e) * 6;
    const size = lerp(jw.size, CELL - 0.9, e);
    const rot = lerp(jw.a + Math.PI / 2, 0, e);
    const d = sm(clamp01(u * 1.6));
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.imageSmoothingEnabled = false;
    c.globalAlpha = 1 - d;
    c.drawImage(spr, (q % 12) * 11, Math.floor(q / 12) * 11, 11, 11, -size / 2, -size / 2, size, size);
    c.globalAlpha = d;
    const k = S06_TILE(JEWEL_SLOT[q]);
    c.drawImage(atlas.canvas, (k % 16) * 11, Math.floor(k / 16) * 11, 11, 11, -size / 2, -size / 2, size, size);
    c.restore();
  }
  void glow;
}

/** s05's jewelled ring (the 96 tiny tiles on the tracery), drawn exactly as s05 draws them */
function ringJewels(c: C, alpha: (q: number) => number) {
  const spr = jewelSprite();
  for (let q = 0; q < 96; q++) {
    const a = alpha(q);
    if (a <= 0.003) continue;
    const jw = jewel(q);
    c.save();
    c.globalAlpha *= a;
    c.translate(jw.x, jw.y);
    c.rotate(jw.a + Math.PI / 2);
    c.imageSmoothingEnabled = false;
    c.drawImage(spr, (q % 12) * 11, Math.floor(q / 12) * 11, 11, 11, -jw.size / 2, -jw.size / 2, jw.size, jw.size);
    c.restore();
  }
}

// ================================================================================================= PAINTERS
/** The messenger bead, sized in SCREEN px (ks = the action-plane scale): a dark core (r 9) in a bright ring (r 14),
 *  an ink keyline that separates it from the bright hall band and the glass, and a 0.5-alpha halo (r 26). Ghosts
 *  (the trail) are the ring only, smaller and fainter. */
function bigBead(c: C, x: number, y: number, ks: number, k: number, ghost: number, env: PaintEnv): void {
  if (k <= 0.003) return;
  const m = env.mood;
  const u = 1 / ks;
  if (ghost > 0) {
    glow(c, x, y, 16 * u, m.rim, 0.35 * k);
    c.save();
    c.globalAlpha *= Math.min(1, k);
    c.strokeStyle = m.core;
    c.lineWidth = 2.2 * u;
    c.beginPath();
    c.arc(x, y, (11 - ghost * 1.5) * u, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    return;
  }
  glow(c, x, y, 34 * u, m.rim, 0.5 * k);
  glow(c, x, y, 20 * u, m.core, 0.35 * k);
  c.save();
  c.globalAlpha *= Math.min(1, k);
  // ink keyline outside the ring
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 3 * u;
  c.beginPath();
  c.arc(x, y, 16.5 * u, 0, Math.PI * 2);
  c.stroke();
  // the ring of light
  c.strokeStyle = m.core;
  c.lineWidth = 3.6 * u;
  c.beginPath();
  c.arc(x, y, 13 * u, 0, Math.PI * 2);
  c.stroke();
  // the dark bead
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(x, y, 9.5 * u, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** s05's blind arcade on the plinth, carved as value-step relief instead of outline strokes: each niche is a
 *  recess one step lighter than the wall (warm reflected light from the rose), with a cast-shadow crescent under
 *  its head and left jamb and a lit sill. Same geometry as sets/ch08-s05-cathedral (x 390 + 36k, w 28). */
const NICHES: Path2D[] = (() => {
  const out: Path2D[] = [];
  const P = CAT.rose;
  for (let k = 0; k < 14; k++) {
    const ax = CAT.cx - 250 + k * 36;
    if (Math.abs(ax + 14 - P.x) < P.r + 44) continue;
    const p = new Path2D();
    p.moveTo(ax, CAT.ground - 14);
    p.lineTo(ax, CAT.plinth.y + 40);
    p.quadraticCurveTo(ax + 14, CAT.plinth.y + 18, ax + 28, CAT.plinth.y + 40);
    p.lineTo(ax + 28, CAT.ground - 14);
    p.closePath();
    out.push(p);
  }
  return out;
})();
const NICHE_X: number[] = Array.from({ length: 14 }, (_, k) => CAT.cx - 250 + k * 36).filter((ax) => Math.abs(ax + 14 - CAT.rose.x) >= CAT.rose.r + 44);

function plinthNiches(c: C, env: PaintEnv): void {
  const m = env.mood;
  const ink = env.fill('ink');
  NICHES.forEach((p, i) => {
    const ax = NICHE_X[i];
    const near = 1 - Math.min(1, Math.abs(ax + 14 - CAT.rose.x) / 260); // nearer the rose = more reflected light
    c.save();
    c.clip(p);
    const g = c.createLinearGradient(0, CAT.plinth.y + 18, 0, CAT.ground - 14);
    g.addColorStop(0, mixLab(ink, m.set, 0.18));
    g.addColorStop(1, mixLab(ink, mixLab(m.set, m.halo, 0.25 * near), 0.42 + 0.18 * near));
    c.fillStyle = g;
    c.fillRect(ax - 2, CAT.plinth.y + 10, 32, 140);
    // the cast shadow under the arch head and down the left jamb: the arch minus itself shifted (5, 7)
    const sh = new Path2D();
    sh.rect(ax - 10, CAT.plinth.y, 60, 180);
    sh.addPath(p, new DOMMatrix().translate(5, 7));
    c.fillStyle = withAlpha(ink, 0.92);
    c.fill(sh, 'evenodd');
    c.restore();
    // cover s05's outline stroke with the wall face (the relief replaces it)
    c.strokeStyle = ink;
    c.lineWidth = 1.4;
    c.stroke(p);
    // the lit sill
    c.fillStyle = withAlpha(mixLab(m.halo, m.rim, 0.5), 0.22 + 0.2 * near);
    c.fillRect(ax + 1, CAT.ground - 16, 26, 2);
  });
}

/** two forecourt lamp-posts on a near plane (z 900): small iron posts flanking the rose in the wide, big blurred
 *  dark shafts at the frame edges in the close holds, so every hold keeps three planes */
const POST_SPEC: LayerSpec = { id: 'N6', z: 900, haze: 0, blur: 4 };
function lampPosts(f: Frame, cam: Camera3): void {
  f.layer(POST_SPEC, (c, env) => {
    const fg = env.fill('fg');
    for (const x of [505, 776]) {
      c.fillStyle = fg;
      c.fillRect(x - 5, 482, 10, 260);
      c.fillRect(x - 8, 700, 16, 40);
      c.fillRect(x - 7, 520, 14, 4);
      // the lantern head: a little cage with a warm core
      c.beginPath();
      c.moveTo(x - 9, 482);
      c.lineTo(x - 7, 462);
      c.lineTo(x + 7, 462);
      c.lineTo(x + 9, 482);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(x - 9, 462);
      c.lineTo(x, 452);
      c.lineTo(x + 9, 462);
      c.closePath();
      c.fill();
      c.fillStyle = withAlpha(env.mood.halo, 0.8);
      c.fillRect(x - 5, 465, 10, 14);
      glow(c, x, 472, 26, env.mood.core, 0.25);
    }
  });
  void cam;
}
