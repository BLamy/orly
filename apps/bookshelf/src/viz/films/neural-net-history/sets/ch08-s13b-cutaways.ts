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
 *       own' a mosaic of learned stencils rises out of the fog; on 'many layers deep' two more ranks of stencils rise
 *       behind it, smaller and hazier (layers, deep). Planes: L2 far range · L4 hills + the ranks · L5 near bank. Tiles are ILLUSTRATIVE (the ch08-s06 procedural set, not the real conv1 weights).
 *         o: { data, fire, rank1, rank2, rank3: 0..1 }
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
  f.setMood('duskRose');
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
/** three ranks of stencils, a stack receding up and to the right (layers, deep): all on the action plane, because
 *  the kit's back ridges are painted there too and would hide anything set behind them; depth reads by size, haze
 *  and overlap (the scene's parallax comes from L2 mountains · L4 · L5 bank) */
const RANKS = [
  { cols: 7, rows: 2, size: 54, gap: 8, cx: 790, top: 372, seed: 0, haze: 0 },
  { cols: 8, rows: 2, size: 40, gap: 6, cx: 880, top: 280, seed: 1, haze: 0.36 },
  { cols: 9, rows: 2, size: 30, gap: 5, cx: 960, top: 214, seed: 2, haze: 0.56 },
];
function rank(c: C, env: PaintEnv, i: number, k: number) {
  if (k <= 0.003) return;
  const R = RANKS[i];
  const atlas = tileAtlas(`${KEY}-fog-grey`, [1, 0.97, 0.9], 0.3);
  atlas.update('learned', () => ({ u: 1, seed: 7 }));
  const m = env.mood;
  const pitch = R.size + R.gap;
  const w = R.cols * pitch - R.gap;
  const x0 = R.cx - w / 2 + R.size / 2;
  // each tile rises out of the fog on twos-ish stagger (left to right), sliding up from below the fog line
  c.save();
  for (let r = 0; r < R.rows; r++) {
    for (let q = 0; q < R.cols; q++) {
      const n = r * R.cols + q;
      const lag = (q / R.cols) * 0.3 + (hash1(n, 11 + R.seed) + 1) * 0.05;
      const u = sm((k - lag) / 0.55);
      if (u <= 0) continue;
      const tk = (n * 7 + R.seed * 31) % TILE_N;
      const x = x0 + q * pitch;
      const y = R.top + r * pitch + R.size / 2 + (1 - u) * 150;
      c.globalAlpha = u * (i === 0 ? 0.95 : i === 1 ? 0.85 : 0.75);
      // the glass tile's lead frame and a little light through it, hazed with depth
      c.fillStyle = withAlpha(m.ink, 0.85);
      c.fillRect(x - R.size / 2 - 2, y - R.size / 2 - 2, R.size + 4, R.size + 4);
      atlas.draw(c, tk, x, y, R.size);
      if (R.haze > 0) {
        c.fillStyle = withAlpha(m.haze, R.haze);
        c.fillRect(x - R.size / 2 - 2, y - R.size / 2 - 2, R.size + 4, R.size + 4);
      }
    }
  }
  c.globalAlpha = 1;
  // the fog laps at the rank's foot (so it reads as rising OUT of it)
  const fy = R.top + R.rows * pitch + 6;
  c.translate(R.cx, fy);
  c.scale((w / 2 + 90) / 60, 1);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 60);
  g.addColorStop(0, withAlpha(m.haze, 0.7));
  g.addColorStop(0.55, withAlpha(m.haze, 0.45));
  g.addColorStop(1, withAlpha(m.haze, 0));
  c.fillStyle = g;
  c.fillRect(-60, -60, 120, 120);
  c.restore();
}

export function fogScene(f: Frame, cams: Camera3[], o: { t: number; data: number; fire: number; rank1: number; rank2: number; rank3: number }): void {
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
    // 'data': pictures drifting down into the fog (small pale prints, each with a dark subject cut in it)
    if (o.data > 0.01) {
      for (let i = 0; i < 26; i++) {
        const start = hash1(i, 21) * 0.6;
        const u = (o.data - start) / 0.9;
        if (u <= 0 || u >= 1) continue;
        const x = 520 + hash1(i, 22) * 620 + Math.sin(u * 5 + i) * 10;
        const y = 120 + u * 430;
        const a = sm(u / 0.15) * (1 - sm((u - 0.6) / 0.4));
        c.save();
        c.globalAlpha = a * 0.85;
        c.translate(x, y);
        c.rotate((hash1(i, 23) - 0.5) * 0.8 + u * (hash1(i, 24) - 0.5) * 2);
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
    }
    rank(c, env, 2, o.rank3);
    rank(c, env, 1, o.rank2);
    rank(c, env, 0, o.rank1);
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
