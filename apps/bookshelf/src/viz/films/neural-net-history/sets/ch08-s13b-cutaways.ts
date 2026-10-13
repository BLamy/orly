/**
 * ch08-s13b — the two cutaways that answer 'Why choose the fog?' (review round 1, teacher + story: the thesis line
 * needs a picture, not the shelf).
 *
 *   bowlScene(f, cams, o)  THE RIVALS' CLEAN BOWL (duskRose, the ch06-s03 hall): one clean paper bowl (f(x) = x²) with
 *       a lit ball that rolls to its single bottom, standing on a footing of hand-cut tin stencils (the features were
 *       designed by hand); on 'cut by hand' an ink stamp BY HAND strikes the footing. Planes: L2 hall wall with arched
 *       window holes · L4 bowl + stencil footing · L5 the hall's chair backs · L6 a drape at the left edge.
 *         o: { ball: 0..1 (the roll; 1 = settled), footing: 0..1 (light on the stencils), stamp: 0..1 }
 *   fogScene(f, cams, o)   THE FOG (winterBlue, the ch05/ch08-s10 hills at night): the traveller settled in the valley,
 *       fog over everything; 'data' pictures drift down into the fog, 'fire' warms it from inside, and on 'cut its
 *       own' a big mosaic of learned stencils rises out of the fog (≈ 30 % of the frame); on 'many layers deep' it
 *       stacks itself into the ch08-s05 cathedral tower, and on 'deep learning' light climbs it to the crown.
 *       Planes: L1 sky · L2 far range · L4 hills + the mosaic/tower · L5 near bank. Tiles are ILLUSTRATIVE (the
 *       ch08-s06 procedural set, not the real conv1 weights).
 *         o: FogOpts { t, dataT (s), fire, snap 0..1, stackT (s), light 0..1 }
 * Both are pure functions of their inputs; static art is cached per mood.
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { MISTY_LR, mistyHills } from '../../../film/silhouette/metaphors/mistyHills';
import { mountains } from '../../../film/silhouette/nature';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { chairBack, drapery } from './occluders';
import { tinStencil, type StencilKind } from './ch08-s13-workshop';
import { TILE_N, tileAtlas } from './ch08-s06-filters';

type C = CanvasRenderingContext2D;
const KEY = 'ch08-s13b';
const sm = (x: number) => {
  const u = x < 0 ? 0 : x > 1 ? 1 : x;
  return u * u * (3 - 2 * u);
};

// ===================================================================================================== THE BOWL
export const BOWL = { cx: 640, hw: 300, rimY: 236, bot: 436, ledge: 470, floor: 610 };
const bowlY = (u: number) => BOWL.bot - (BOWL.bot - BOWL.rimY) * u * u;
const bx = (u: number) => BOWL.cx + u * BOWL.hw;
/** the stencil footing under the ledge: five tin plates standing side by side */
const FOOT: { x: number; kind: StencilKind; rot: number }[] = [
  { x: 420, kind: 'arrow', rot: -0.04 },
  { x: 530, kind: 'corner', rot: 0.03 },
  { x: 640, kind: 'comb', rot: -0.02 },
  { x: 750, kind: 'ring', rot: 0.04 },
  { x: 860, kind: 'cross', rot: -0.03 },
];
const FOOT_S = 50;
/** where the ball is (u along the bowl, -1..1): released at the left rim, rocking to rest at the bottom */
export function ballU(k: number): number {
  if (k <= 0) return -0.94;
  return -0.94 * Math.cos(k * Math.PI * 3.5) * Math.exp(-k * 3.2) * (1 - sm((k - 0.85) / 0.15));
}
export function ballPos(k: number): { x: number; y: number } {
  const u = ballU(k);
  return { x: bx(u), y: bowlY(u) - 14 };
}

export function bowlScene(f: Frame, cams: Camera3[], o: { ball: number; footing: number; stamp: number }): void {
  // review round 1 (continuity): pulled most of the way toward the study's candleAmber, so the rivals' hall reads
  // as a cutaway of this sequence, not a new one (a fixed blend: one palette, one bake)
  f.setMood('candleAmber', { from: 'duskRose', u: 0.62 });
  f.backlight({ sunX: 640, sunY: 230, sunRadius: 640, intensity: 0.8 });
  // L2: the hall's back wall, its tall arched windows as holes
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, cams, 60);
    f.cached(`${KEY}/bowl/L2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const p = new Path2D();
      p.rect(r.x, r.y, r.w, r.h);
      for (let i = -3; i <= 3; i++) {
        const x = 640 + i * 230 - 52, y = 90, w = 104, h = 330;
        p.moveTo(x, y + h);
        p.lineTo(x, y + w / 2);
        p.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
        p.lineTo(x + w, y + h);
        p.closePath();
      }
      cc.fillStyle = env.fill('set');
      cc.fill(p, 'evenodd');
      // mullions and transoms in the windows
      cc.fillStyle = env.fill('set');
      for (let i = -3; i <= 3; i++) {
        const x = 640 + i * 230;
        cc.fillRect(x - 2.5, 90, 5, 330);
        for (let k = 1; k < 5; k++) cc.fillRect(x - 52, 90 + 52 + k * 56, 104, 4);
      }
      // the wainscot and the dais below the windows
      cc.fillRect(r.x, 470, r.w, r.y + r.h - 470);
      cc.fillStyle = withAlpha(env.mood.rim, 0.12);
      cc.fillRect(r.x, 470, r.w, 2);
    }, { blur: 1.2 })(c, r.x, r.y);
  });
  f.fog('A');
  f.layer('L4', (c, env) => {
    const m = env.mood;
    const r = overscan(LAYERS.L4, cams, 40);
    // the floor of the hall
    c.fillStyle = mixLab(env.fill('ink'), m.set, 0.25);
    c.fillRect(r.x, BOWL.floor, r.w, r.y + r.h - BOWL.floor);
    f.cached(`${KEY}/bowl/L4/${m.id}`, 900, 420, (cc) => {
      cc.translate(-190, -220);
      // the paper bowl: a side-on landscape cut from one sheet, sitting on a ledge
      const ground = new Path2D();
      ground.moveTo(BOWL.cx - BOWL.hw - 120, BOWL.ledge);
      ground.bezierCurveTo(BOWL.cx - BOWL.hw - 90, BOWL.rimY + 50, BOWL.cx - BOWL.hw - 40, BOWL.rimY - 6, bx(-1), bowlY(-1));
      for (let i = -40; i <= 40; i++) ground.lineTo(bx(i / 40), bowlY(i / 40));
      ground.bezierCurveTo(BOWL.cx + BOWL.hw + 40, BOWL.rimY - 6, BOWL.cx + BOWL.hw + 90, BOWL.rimY + 50, BOWL.cx + BOWL.hw + 120, BOWL.ledge);
      ground.closePath();
      cc.fillStyle = mixLab(env.fill('ink'), m.set, 0.18);
      cc.fill(ground);
      // the clean edge, rim-lit: one smooth curve, one bottom
      cc.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.75);
      cc.lineWidth = 2;
      cc.beginPath();
      for (let i = -40; i <= 40; i++) {
        const x = bx(i / 40), y = bowlY(i / 40) + 1;
        if (i === -40) cc.moveTo(x, y);
        else cc.lineTo(x, y);
      }
      cc.stroke();
      // the ledge the bowl stands on
      cc.fillStyle = env.fill('ink');
      cc.fillRect(BOWL.cx - BOWL.hw - 150, BOWL.ledge, (BOWL.hw + 150) * 2, 12);
      cc.fillStyle = withAlpha(m.rim, 0.35);
      cc.fillRect(BOWL.cx - BOWL.hw - 150, BOWL.ledge, (BOWL.hw + 150) * 2, 1.4);
    })(c, 190, 220);
    // the footing: five hand-cut tin stencils standing under the ledge, tacked to it
    for (const s of FOOT) {
      const y = (BOWL.ledge + 12 + BOWL.floor) / 2;
      tinStencil(c, env, { x: s.x, y, s: FOOT_S, kind: s.kind, rot: s.rot, lit: 0.3 + 0.7 * o.footing });
      c.fillStyle = withAlpha(m.rim, 0.5 + 0.4 * o.footing);
      c.beginPath();
      c.arc(s.x - 30, y - FOOT_S + 6, 2.2, 0, Math.PI * 2);
      c.arc(s.x + 30, y - FOOT_S + 6, 2.2, 0, Math.PI * 2);
      c.fill();
    }
    // light falling on the footing (the stencils are what the bowl stands on)
    if (o.footing > 0.01) glow(c, 640, 540, 360, m.halo, 0.16 * o.footing);
    // the ball
    const bp = ballPos(o.ball);
    c.fillStyle = mixLab(m.core, '#fff4e4', 0.2);
    c.beginPath();
    c.arc(bp.x, bp.y, 12, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(m.ink, 0.35);
    c.lineWidth = 1;
    c.beginPath();
    c.arc(bp.x, bp.y, 12, 0, Math.PI * 2);
    c.moveTo(bp.x - 12, bp.y);
    c.quadraticCurveTo(bp.x, bp.y + 5, bp.x + 12, bp.y);
    c.stroke();
    // the stamp: BY HAND struck across the middle stencils in a muted oxblood ink
    if (o.stamp > 0.01) stamp(c, env, o.stamp);
  });
  f.rim({ x: 0, y: -1 });
  const bp = ballPos(o.ball);
  f.practical({ x: bp.x, y: bp.y, kind: 'lamp', seed: 1995, intensity: 0.55, radius: 70, layer: 'L4' });
  // L5: the backs of the hall's chairs, soft
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 40);
    f.cached(`${KEY}/bowl/L5/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 360, (cc) => {
      cc.translate(-r.x, -560);
      for (let x = r.x + 60; x < r.x + r.w; x += 250) chairBack(cc, { x, y: 900, s: 1.25, kind: 'spindle' }, env);
    }, { blur: 3 })(c, r.x, 560);
  });
  // L6: a heavy drape at the left edge
  f.layer('L6', (c, env) => {
    f.cached(`${KEY}/bowl/L6/${env.mood.id}`, 360, 1000, (cc) => {
      cc.translate(160, 100);
      drapery(cc, { x: -40, top: -100, bottom: 880, w: 150, side: 'left', folds: 5, seed: 13 }, env);
    }, { blur: 6 })(c, -160, -100);
  });
}

function stamp(c: C, env: PaintEnv, k: number) {
  const m = env.mood;
  const hit = sm(k / 0.35);
  const sc = 1.35 - 0.35 * hit;
  c.save();
  c.translate(640, (BOWL.ledge + 12 + BOWL.floor) / 2 + 4);
  c.rotate(-0.07);
  c.scale(sc, sc);
  c.globalAlpha *= hit;
  const size = legibleSize(c, `700 30px ${FONT.typewriter}`, 30);
  c.font = `700 ${size}px ${FONT.typewriter}`;
  const w = c.measureText('BY HAND').width + 36, h = size * 1.6;
  const ink = mixLab(mixLab(m.ink, '#8a2c22', 0.7), m.rim, 0.15);
  // a paper label pasted over the tin, then the stamp on it
  c.fillStyle = mixLab(mixLab(m.halo, '#efe3cf', 0.55), m.rim, 0.2);
  c.fillRect(-w / 2 - 8, -h / 2 - 6, w + 16, h + 12);
  c.strokeStyle = withAlpha(ink, 0.9);
  c.lineWidth = 3;
  c.strokeRect(-w / 2, -h / 2, w, h);
  c.fillStyle = withAlpha(ink, 0.92);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('BY HAND', 0, 2);
  // ink speckle where the stamp did not take
  c.fillStyle = mixLab(mixLab(m.halo, '#efe3cf', 0.55), m.rim, 0.2);
  for (let i = 0; i < 18; i++) c.fillRect(-w / 2 + hash1(i, 3) * w, -h / 2 + hash1(i, 5) * h, 2.2, 1.6);
  c.restore();
}

// ===================================================================================================== THE FOG
/** the kit's box, wider than the stage so the push toward the valley never shows past its flanks */
const HILLS = { x: -90, w: 1460 };
/** the valley floor: x ≈ 1.96 → sx */
export const VALLEY = { x: HILLS.x + ((1.96 + 6.4) / 12.8) * HILLS.w, y: 636 };
/**
 * THE THESIS PICTURE (review round 3, story + art + teacher T306: 'the net cut its own' needs its own image).
 *   prints  'given data': small pictures drift down into the fog and hover in it, drifting (the specks)
 *   snap    'cut' (25.82): twelve of the drifting pictures SNAP into one row of learned edge stencils, the first
 *           stencil row (the grey oriented edges of the ch08-s06 mosaic, GPU-1 tiles, ILLUSTRATIVE); the rest sink
 *           back into the fog. The row hangs large in the fog through 'its own'.
 *   stack   'many layers' (26.88): the row settles as the base course and the tower of ch08-s05 STACKS over it,
 *           course by course rising out of the fog (wide to narrow, then the crown), complete by 'deep learning'
 *   light   'deep learning' (28.4): light climbs the tower course by course to the crown
 */
const TW = { cx: 640, base: 522, size: 30, pitch: 34, ledge: 8 };
/** the first stencil row while it hangs alone in the fog (before it settles as the base course) */
const ROW = { n: 12, size: 52, pitch: 58, y: 430 };
/** the twelve learned EDGE stencils of the first row (GPU-1 tiles: grey oriented stripes and edges) */
const ROW_K = Array.from({ length: ROW.n }, (_, q) => (q * 4 + 1) % 48);
/** the tower's courses, bottom up: [cols, rows]; courses 3-5 share one width (the 13 · 13 · 13 shaft), then the crown */
const COURSES: [number, number][] = [[12, 2], [8, 2], [4, 2], [4, 1], [4, 1], [3, 1], [1, 1]];
interface Slot { x: number; y: number; ci: number }
const TOWER_SLOTS: Slot[] = [];
const COURSE_BOX: { x0: number; x1: number; y0: number; y1: number }[] = [];
{
  let y = TW.base;
  COURSES.forEach(([cols, rows], ci) => {
    const w = cols * TW.pitch;
    const y1 = y;
    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) TOWER_SLOTS.push({ x: TW.cx - w / 2 + TW.pitch / 2 + q * TW.pitch, y: y - TW.pitch / 2 - r * TW.pitch, ci });
    }
    y -= rows * TW.pitch;
    COURSE_BOX.push({ x0: TW.cx - w / 2, x1: TW.cx + w / 2, y0: y, y1 });
    // the crown's two tiers sit straight on each other; every other course has a stone ledge above it
    if (ci < COURSES.length - 2) y -= TW.ledge;
  });
}
const TOWER_TOP = COURSE_BOX[COURSE_BOX.length - 1].y0;
/** when course ci starts to rise, after 'many layers' (s); each takes STAGE_D: the crown lands ≈ 1.55 s in */
const courseAt = (ci: number) => 0.12 + ci * 0.17;
const STAGE_D = 0.45;
/** how far the row has settled into the base course (0..1), from 'many layers' */
const settleOf = (stackT: number) => sm(stackT / 0.5);
/** a course's stone has risen behind its tiles (0..1) */
const landedOf = (ci: number, stackT: number) => (ci === 0 ? settleOf(stackT) : sm((stackT - courseAt(ci) - 0.2) / 0.25));

// ---- the drifting pictures ('given data')
const PRINTS = 26;
const h01 = (i: number, k: number) => (hash1(i, k) + 1) / 2;
/** a picture's place while it drifts (dt s after 'data'): it falls into the fog and hovers there, drifting */
function printAt(i: number, dt: number): { x: number; y: number; rot: number; a: number } {
  const s0 = 0.05 + 0.55 * h01(i, 21);
  const u = Math.max(0, Math.min(1, (dt - s0) / 1.5));
  const fall = 1 - Math.pow(1 - u, 2.4);
  const hover = 330 + 120 * h01(i, 25);
  const x = 470 + 700 * h01(i, 22) + Math.sin(dt * 0.9 + i) * 10;
  const y = 110 + (hover - 110) * fall + Math.sin(dt * 1.3 + i * 1.7) * 4 * u;
  const rot = (h01(i, 23) - 0.5) * 0.8 + Math.sin(dt * 0.7 + i) * 0.15;
  return { x, y, rot, a: sm((dt - s0) / 0.25) };
}
/** the twelve pictures that become the first row: picked across the spread, assigned to columns by their x */
const SNAPPERS: number[] = (() => {
  const all = Array.from({ length: PRINTS }, (_, i) => ({ i, x: 470 + 700 * h01(i, 22) }));
  all.sort((p, q) => p.x - q.x);
  const pick: number[] = [];
  for (let q = 0; q < ROW.n; q++) pick.push(all[Math.round((q * (PRINTS - 1)) / (ROW.n - 1))].i);
  return pick;
})();
function drawPrint(c: C, m: PaintEnv['mood'], i: number, x: number, y: number, rot: number, a: number, sc = 1) {
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha = a * 0.85;
  c.translate(x, y);
  c.rotate(rot);
  c.scale(sc, sc);
  c.fillStyle = mixLab(m.halo, '#eef2f5', 0.5);
  c.fillRect(-9, -7, 18, 14);
  c.fillStyle = withAlpha(m.ink, 0.7);
  if (i % 3 === 0) {
    c.beginPath();
    c.arc(0, 1, 4, 0, Math.PI * 2);
    c.fill();
  } else if (i % 3 === 1) c.fillRect(-5, -2, 10, 8);
  else {
    c.beginPath();
    c.moveTo(-7, 6);
    c.lineTo(-1, -4);
    c.lineTo(6, 6);
    c.fill();
  }
  c.restore();
}

/** a stencil tile on its dark mount, with the climbing light over it */
function drawTile(c: C, m: PaintEnv['mood'], atlas: ReturnType<typeof tileAtlas>, k: number, x: number, y: number, size: number, a: number, lk: number) {
  if (a <= 0.003) return;
  c.globalAlpha = a * 0.96;
  c.fillStyle = withAlpha(m.ink, 0.85);
  c.fillRect(x - size / 2 - 2, y - size / 2 - 2, size + 4, size + 4);
  atlas.draw(c, k, x, y, size);
  if (lk > 0.003) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = a;
    c.fillStyle = withAlpha(mixLab(m.core, '#f2d6a0', 0.55), 0.3 * lk);
    c.fillRect(x - size / 2, y - size / 2, size, size);
    c.restore();
  }
  c.globalAlpha = 1;
}

function thesis(c: C, env: PaintEnv, o: FogOpts) {
  const m = env.mood;
  const dt = o.dataT;
  const snap = o.snap;
  const S = o.stackT;
  const nC = COURSES.length;
  // ---- the drifting pictures: the ones that do not become the row sink back into the fog as the row snaps
  if (dt > 0) {
    for (let i = 0; i < PRINTS; i++) {
      if (snap > 0 && SNAPPERS.includes(i)) continue;
      const p = printAt(i, dt);
      const gone = sm(snap / 0.6);
      drawPrint(c, m, i, p.x, p.y + 30 * gone, p.rot, p.a * (1 - gone));
    }
  }
  if (snap <= 0 && S <= -0.5) return;
  const atlas = tileAtlas(`${KEY}-fog-grey`, [1, 0.97, 0.9], 0.3);
  atlas.update('learned', () => ({ u: 1, seed: 7 }));
  const settle = settleOf(S);
  // ---- the tower's dark stone: each course a cut-paper block a little wider than its tiles, a ledge above it, and a
  // spire over the crown; it rises course by course as the tiles arrive
  if (S > 0) {
    const ink = env.fill('ink');
    COURSE_BOX.forEach((bx, ci) => {
      const a = landedOf(ci, S);
      if (a <= 0.003) return;
      const lift = (1 - a) * 18;
      c.globalAlpha = a;
      c.fillStyle = ink;
      c.fillRect(bx.x0 - 10, bx.y0 - 6 + lift, bx.x1 - bx.x0 + 20, bx.y1 - bx.y0 + 10);
      if (ci < nC - 2) {
        c.fillRect(bx.x0 - 20, bx.y0 - TW.ledge - 4 + lift, bx.x1 - bx.x0 + 40, TW.ledge + 2);
        // little pinnacles at the ledge ends (the s05 façade's stepped corners)
        for (const ex of [bx.x0 - 20, bx.x1 + 12]) c.fillRect(ex, bx.y0 - TW.ledge - 22 + lift, 8, 20);
      }
      c.fillStyle = withAlpha(m.rim, 0.35 * a);
      c.fillRect(bx.x0 - 10, bx.y0 - 6 + lift, bx.x1 - bx.x0 + 20, 1.2);
    });
    const sa = landedOf(nC - 1, S);
    if (sa > 0.003) {
      c.globalAlpha = sa;
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(TW.cx - 12, TOWER_TOP - 6);
      c.lineTo(TW.cx, TOWER_TOP - 70 + (1 - sa) * 30);
      c.lineTo(TW.cx + 12, TOWER_TOP - 6);
      c.closePath();
      c.fill();
    }
    c.globalAlpha = 1;
  }
  const lightOf = (ci: number) => sm((o.light * (nC + 1) - ci) / 1.2);
  // ---- the upper courses: each is SET DOWN onto the course below (lowered from above into its slots), course by course
  if (S > 0) {
    for (let j = ROW.n; j < TOWER_SLOTS.length; j++) {
      const sl = TOWER_SLOTS[j];
      const q = j % 12;
      const st = courseAt(sl.ci) + (q / 12) * 0.08;
      const u = sm((S - st) / STAGE_D);
      if (u <= 0) continue;
      const x = sl.x;
      const y = sl.y - (1 - u) * 70;
      const size = TW.size * (1.12 - 0.12 * u);
      drawTile(c, m, atlas, (j * 7) % TILE_N, x, y, size, sm(u / 0.35), u * lightOf(sl.ci));
    }
  }
  // ---- the first stencil row: snapped out of the drifting pictures on 'cut', hanging large in the fog, then
  // settling as the tower's base course on 'many layers'
  for (let q = 0; q < ROW.n; q++) {
    const i = SNAPPERS[q];
    // a short stagger from the middle out, so the snap reads as one gesture
    const lag = Math.abs(q - (ROW.n - 1) / 2) * 0.012;
    const e0 = Math.max(0, Math.min(1, (snap - lag) / 0.85));
    if (e0 <= 0) continue;
    // a snap: fast in, a hair of overshoot, settled
    const e = e0 < 1 ? 1 - Math.pow(1 - e0, 3) * Math.cos(e0 * 2.2) : 1;
    const p = printAt(i, Math.max(0, dt));
    const rx = TW.cx + (q - (ROW.n - 1) / 2) * ROW.pitch;
    const sl = TOWER_SLOTS[q];
    const tx = rx + (sl.x - rx) * settle;
    const ty = ROW.y + (sl.y - ROW.y) * settle;
    const size0 = ROW.size + (TW.size - ROW.size) * settle;
    const x = p.x + (tx - p.x) * e;
    const y = p.y + (ty - p.y) * e;
    const size = 16 + (size0 - 16) * e;
    // the picture turns into the stencil as it lands
    drawPrint(c, m, i, x, y, p.rot * (1 - e), p.a * (1 - sm(e0 / 0.6)), size / 16);
    drawTile(c, m, atlas, ROW_K[q], x, y, size, sm(e0 / 0.5), lightOf(0) * settle);
    // the cut: a pale edge flash as each stencil lands
    const flash = e0 >= 1 ? Math.exp(-(snap - lag - 0.85) * 3.5) : 0;
    if (flash > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(mixLab(m.core, '#eef2f5', 0.4), 0.55 * flash * (1 - settle));
      c.lineWidth = 1.6;
      c.strokeRect(x - size / 2 - 2, y - size / 2 - 2, size + 4, size + 4);
      c.restore();
    }
  }
  c.globalAlpha = 1;
  // the crown's glow as the light arrives, and a soft warm aura round the whole lit tower
  if (o.light > 0.003) {
    const crown = sm((o.light - 0.75) / 0.25);
    glow(c, TW.cx, TOWER_TOP + 20, 120, mixLab(m.core, '#f2d6a0', 0.5), 0.35 * crown);
    glow(c, TW.cx, (TOWER_TOP + TW.base) / 2, 360, m.halo, 0.12 * o.light);
  }
  // the fog laps at the foot (the row hangs IN it; the tower stands in it)
  const k = sm(S / 0.8);
  const footY = ROW.y + ROW.size / 2 + 14 + (TW.base + 4 - (ROW.y + ROW.size / 2 + 14)) * k;
  const halfW = 400 - 170 * k;
  c.save();
  c.translate(TW.cx, footY);
  c.scale((halfW + 90) / 60, 1);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 60);
  g.addColorStop(0, withAlpha(m.haze, 0.75));
  g.addColorStop(0.55, withAlpha(m.haze, 0.45));
  g.addColorStop(1, withAlpha(m.haze, 0));
  c.fillStyle = g;
  c.fillRect(-60, -60, 120, 120);
  c.restore();
}

export interface FogOpts {
  t: number;
  /** seconds since 'given data' (negative before) */
  dataT: number;
  fire: number;
  /** 0..1 the snap of the first stencil row on 'cut' (≈ 0.4 s) */
  snap: number;
  /** seconds since 'many layers' (negative before) */
  stackT: number;
  light: number;
}

export function fogScene(f: Frame, cams: Camera3[], o: FogOpts): void {
  f.setMood('winterBlue');
  f.backlight({ sunX: 900, sunY: 300, sunRadius: 700, intensity: 0.5 });
  // our own sky (the kit's is erased in L4: its two cloud bands end in a hard edge): a moon under thin cloud, stars
  f.layer('L1', (c, env) => {
    f.cached(`${KEY}/fog/sky/${env.mood.id}`, 1700, 420, (g) => {
      g.translate(200, 40);
      const m = env.mood;
      const mx = 960, my = 130, mr = 24;
      const mh = g.createRadialGradient(mx, my, mr, mx, my, mr * 7);
      mh.addColorStop(0, withAlpha(m.rim, 0.28));
      mh.addColorStop(1, withAlpha(m.rim, 0));
      g.fillStyle = mh;
      g.fillRect(mx - mr * 7, my - mr * 7, mr * 14, mr * 14);
      g.fillStyle = mixLab(m.rim, m.core, 0.6);
      g.beginPath();
      g.arc(mx, my, mr, 0, Math.PI * 2);
      g.fill();
      g.save();
      g.beginPath();
      g.arc(mx, my, mr + 0.5, 0, Math.PI * 2);
      g.clip();
      g.fillStyle = withAlpha(m.sky[1], 0.6);
      g.beginPath();
      g.arc(mx - mr * 0.45, my - mr * 0.1, mr * 0.95, 0, Math.PI * 2);
      g.fill();
      g.restore();
      for (let k = 0; k < 80; k++) {
        const x = -180 + ((hash1(k, 51) + 1) / 2) * 1640, y = -30 + Math.pow((hash1(k, 52) + 1) / 2, 1.3) * 280;
        g.fillStyle = withAlpha(m.core, (0.1 + 0.15 * (hash1(k, 53) + 1)) * (1 - (y + 30) / 320));
        g.fillRect(x, y, 1, 1);
      }
      for (const [cx, cy, rx, ry, a] of [[980, 148, 380, 8, 0.26], [560, 196, 520, 8, 0.18]] as const) {
        g.save();
        g.translate(cx, cy);
        g.scale(rx / ry, 1);
        const cg = g.createRadialGradient(0, 0, 0, 0, 0, ry);
        cg.addColorStop(0, withAlpha(m.haze, a));
        cg.addColorStop(1, withAlpha(m.haze, 0));
        g.fillStyle = cg;
        g.fillRect(-ry, -ry, 2 * ry, 2 * ry);
        g.restore();
      }
    }, { blur: 0.4 })(c, -200, -40);
  });
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, cams, 60);
    f.cached(`${KEY}/fog/L2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)}`, Math.ceil(r.w), 520, (cc) => {
      cc.translate(-r.x, -40);
      mountains(cc, { x0: r.x, x1: r.x + r.w, y: 330, amp: 150, ranges: 2, seed: 41, mist: 0.7, snowCaps: 0.8 }, env);
    }, { blur: 1.5 })(c, r.x, 40);
  });
  f.fog({ yCenter: 300, height: 120, alpha: 0.28, drift: 6 });
  f.layer('L4', (c, env) => {
    const m = env.mood;
    const r = overscan(LAYERS.L4, cams, 40);
    // the ground under the kit's box
    c.fillStyle = env.fill('ink');
    c.fillRect(r.x, 700, r.w, r.y + r.h - 700);
    // the warm fire inside the fog (on 'fire'): a soft glow under the fog, in the valley
    if (o.fire > 0.01) glow(c, VALLEY.x, VALLEY.y - 60, 300, m.halo, 0.22 * o.fire);
    mistyHills(c, { x: HILLS.x, y: 0, w: HILLS.w, h: 720, lr: MISTY_LR.bold, x0: -5.3, step: 40, fog: 0.92, tangent: 0, trail: false, labels: false, reveal: 1 }, env);
    // erase the kit's own sky above the back ridges' tree tips (feathered); ours is in L1
    {
      c.save();
      c.globalCompositeOperation = 'destination-out';
      const eg = c.createLinearGradient(0, 196, 0, 232);
      eg.addColorStop(0, 'rgba(0,0,0,1)');
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = eg;
      c.fillRect(r.x - 10, r.y - 10, r.w + 20, 232 - r.y + 10);
      c.restore();
    }
    // 'data': the pictures drifting down into the fog, and the thesis picture (thesis)
    thesis(c, env, o);
  });
  f.rim({ x: 0.3, y: -1 });
  if (o.fire > 0.01) f.practical({ x: VALLEY.x, y: VALLEY.y - 40, kind: 'lamp', seed: 2012, intensity: 0.4 * o.fire, radius: 160, layer: 'L4' });
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 40);
    f.cached(`${KEY}/fog/L5/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 320, (cc) => {
      cc.translate(-r.x, -700);
      cc.fillStyle = mixLab(env.fill('fg'), '#000000', 0.3);
      cc.beginPath();
      cc.moveTo(r.x, 1020);
      for (let x = r.x; x <= r.x + r.w; x += 10) cc.lineTo(x, 790 - 40 * Math.exp(-(((x - 200) / 260) ** 2)) + 12 * Math.sin(x * 0.02));
      cc.lineTo(r.x + r.w, 1020);
      cc.closePath();
      cc.fill();
      for (let i = 0; i < 70; i++) {
        const x = r.x + ((i * 97.13) % r.w);
        const base = 790 - 40 * Math.exp(-(((x - 200) / 260) ** 2)) + 12 * Math.sin(x * 0.02);
        const L = 14 + ((i * 37) % 24);
        const a = (((i * 53) % 21) - 10) * 0.035;
        cc.beginPath();
        cc.moveTo(x - 2, base + 2);
        cc.lineTo(x + Math.sin(a) * L, base - Math.cos(a) * L);
        cc.lineTo(x + 2, base + 2);
        cc.fill();
      }
    }, { blur: 3 })(c, r.x, 700);
  });
  void o.t;
}
