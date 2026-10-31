/**
 * handwired-explained — ch12-s01 .. ch12-s04: THE VALLEY AT DAWN and THE TAG-LOOM (staging.tagLine, ch12 variant).
 *
 * One world for the four valley shots, so the cut from the washing line (s01) to the re-hang (s02), the wave (s03) and
 * the settle (s04) never drifts between them:
 *
 *   L0  the dawnGold backlight, sun low over the valley
 *   L1  morning haze over the far ridges; the Window Calendar stands on the farthest ridge, its panes as the film left
 *       them (lit through 16 October; nothing new lights)
 *   L2  two nearer paper ridges, each a step darker than the one behind it
 *   L3  the valley floor rising to the near slope, a fence row far down the valley
 *   L4  the copper line (washing line, then the loom's top beam), the Lifespan Rule front-on on the valley floor, the
 *       tags, their threads; in s02..s04 six upright copper warps hang from the line (the loom's six frames)
 *   L5  near grass at the bottom corners (blurred) on the pull-backs
 *
 * GEOGRAPHY (L4 rest px): the line runs post to post from x -340 to 1620 at y 418 (58 % of frame: staging.tagLine
 * ch12); the Lifespan Rule hangs front-on, parallel to the picture plane, below it at y 940 (the threads drop to it),
 * log-scaled exactly as everywhere in the film (sets/tagLine lifeX). On the washing line the tags hang in film order,
 * 150 apart. The loom: six frames at COLX; a tag's frame is its DEPENDENCY DEPTH in the film's teaching order (the
 * outline's finaleDepthMap, Q039's rule applied to the film): frame 0 tags 1 and 4 (they need nothing); frame 1 tags
 * 2, 5 (need 1), 8 and the why tag (need 4); frame 2 tags 3 (needs 2) and 6 (needs 4 and 5); frame 3 tags 7 and 10
 * (need 6); frame 4 tags 9 (needs 5 and 7) and 11 (needs 8 and 10); frame 5 an empty copper hook in the hinge profile
 * (flat, then up: the ReLU emblem; ch12-s06's bent hinge pays it), needing 9 and 11. Every dependency thread runs
 * left to right. The layout is computed from DEPS / FRAME_OF below, never placed by eye.
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, toScreen } from '../../../film/core/multiplane';
import { hash1 } from '../../../film/core/frame';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { FONT, textRole } from '../../../film/silhouette/type';
import { SLOT_X, TAG, TAGS, drawLine, drawRule, drawTag, lifeX, lineYAt, tagsAt, type TagId, type TagState, type TipKind } from './tagLine';
import { copperOf, drawPencil, pencilRed, type Pt } from './narratorHands';

type C = CanvasRenderingContext2D;
export type { Pt };

// ---------------------------------------------------------------- small maths
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
function lw(c: C, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}

/** a smooth path through keyed values (Catmull-Rom tangents, flat at both ends) */
export type Key = [number, number];
export function spline(keys: Key[], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  const n = keys.length;
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
  const slope = (j: number) => {
    if (j <= 0 || j >= n - 1) return 0;
    const [ta, va] = keys[j - 1], [tb, vb] = keys[j + 1];
    // a key that is a local extreme holds (no overshoot)
    if ((keys[j][1] - va) * (vb - keys[j][1]) <= 0) return 0;
    return (vb - va) / (tb - ta);
  };
  const m0 = slope(i), m1 = slope(i + 1);
  const h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * m1;
}
/** a camera from the action-plane framing: centre (x, y), action-plane scale k, dolly z (parallax) */
export function camK(x: number, y: number, k: number, z: number): Camera3 {
  return { x, y, z, lens: (k * (1000 - z)) / 1000 };
}

// ---------------------------------------------------------------- geometry
export const LINE12 = { x0: -340, x1: 1620, y: 418, sag: 14 } as const;
export const RULE12 = { x0: -270, x1: 1550, y: 940 } as const;
export const lineY12 = (x: number) => lineYAt(x, LINE12);
/** the tags on the washing line, in film order (the lineage card and the untied question card are not in ch12) */
export const ORDER12: TagId[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'why'];
export const SLOT12 = Object.fromEntries(ORDER12.map((id, i) => [id, -185 + 150 * i])) as Record<TagId, number>;
/** the why tag is the small one */
export const scaleOf = (id: TagId) => (id === 'why' ? 0.72 : 1);
export const tagH = (id: TagId) => (TAGS[id].kind === 'question' || TAGS[id].kind === 'card' ? TAG.w * 0.62 : TAG.h) * scaleOf(id);
export const tagW = (id: TagId) => (TAGS[id].kind === 'question' || TAGS[id].kind === 'card' ? TAG.w * 0.62 : TAG.w) * scaleOf(id);

/** the canonical end-of-film states (every tag as the film left it) */
export function states12(): TagState[] {
  return tagsAt('ch12-s01', 'start')
    .filter((s) => s.id !== 'lineage' && s.id !== 'qK')
    .map((s) => ({ ...s, scale: scaleOf(s.id), swing: s.id === 'why' ? 0.03 : 0.018 }));
}

// ---------------------------------------------------------------- the loom (dependency depth)
export const COLX = [65, 295, 525, 755, 985, 1215] as const;
export const FRAME_OF: Partial<Record<TagId, number>> = { '1': 0, '4': 0, '2': 1, '5': 1, '8': 1, why: 1, '3': 2, '6': 2, '7': 3, '10': 3, '9': 4, '11': 4 };
/** dependency pairs (needed → needer), from the outline's finaleDepthMap; 'hook' = frame 5's empty hook */
export const DEPS: [TagId, TagId | 'hook'][] = [
  ['1', '2'], ['1', '5'], ['4', '8'], ['4', 'why'],
  ['2', '3'], ['4', '6'], ['5', '6'],
  ['6', '7'], ['6', '10'],
  ['5', '9'], ['7', '9'], ['8', '11'], ['10', '11'],
  ['9', 'hook'], ['11', 'hook'],
];
/** each frame's stack, top to bottom (ordered so the threads cross as little as possible) */
export const STACKS: TagId[][] = [['1', '4'], ['2', '5', '8', 'why'], ['3', '6'], ['7', '10'], ['9', '11'], []];
const PITCH = 116;
const STACK_MID = 635;
/** a tag's knot on its frame's warp */
export function loomKnot(id: TagId): Pt {
  const col = FRAME_OF[id] ?? 0;
  const st = STACKS[col];
  const j = st.indexOf(id);
  return { x: COLX[col], y: STACK_MID - ((st.length - 1) / 2 - j) * PITCH };
}
/** the empty hook in frame 5: where it hangs from the warp */
export const HOOK = { x: COLX[5], y: STACK_MID } as const;
/** the loom's bottom bar (the warps' weights hang just above the rule) */
export const LOOM_FOOT = 900;

/** eyelet of a tag tied at a knot */
export const eyeOf = (id: TagId, knot: Pt): Pt => ({ x: knot.x, y: knot.y + TAG.string * scaleOf(id) });
/** the side anchors of a tag body (for dependency threads), from its eyelet */
export function sideOf(id: TagId, eye: Pt, side: 'L' | 'R'): Pt {
  return { x: eye.x + (side === 'R' ? 1 : -1) * tagW(id) * 0.5, y: eye.y + tagH(id) * 0.5 };
}

/**
 * The empty hook in the hinge profile, hanging from the warp at (x, y): a short stem down, a short flat run to the
 * right, then a turn up (flat, then up: ReLU). `s` scales it; returns the path's points (world).
 */
export function hookPoints(x: number, y: number, s = 1): Pt[] {
  return [
    { x, y },
    { x, y: y + 20 * s },
    { x: x + 4 * s, y: y + 26 * s },
    { x: x + 26 * s, y: y + 26 * s },
    { x: x + 40 * s, y: y + 8 * s },
  ];
}
/** paint the hook: copper wire, its bare end glowing by `glow` (0..1) */
export function drawHook(c: C, env: PaintEnv, x: number, y: number, glow: number, s = 1, alpha = 1) {
  if (alpha <= 0) return;
  const pts = hookPoints(x, y, s);
  c.save();
  c.globalAlpha = alpha;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (glow > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const e = pts[pts.length - 1];
    const mid = pts[3];
    for (const [p, r, a] of [[mid, 46 * s, 0.3], [e, 30 * s, 0.55]] as const) {
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, withAlpha(env.mood.core, a * glow));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    }
    c.restore();
  }
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = Math.max(lw(c, 3.6), 2.6 * s);
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.stroke();
  c.strokeStyle = copperOf(env, 0.4 + 0.6 * glow);
  c.lineWidth = Math.max(lw(c, 2), 1.6 * s);
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.stroke();
  // the bare end: a bright bead
  const e = pts[pts.length - 1];
  c.fillStyle = mixLab(copperOf(env, 1), env.mood.core, 0.5 * glow);
  c.beginPath();
  c.arc(e.x, e.y, 2.2 * s, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------- the back planes (L0 .. L3)
export interface ValleyOpts {
  /** cache key salt (shot id) */
  key: string;
  /** every camera the shot uses (overscan for the cached planes) */
  cams: Camera3[];
  sunX?: number;
  /** 0..1 light growing through the shot */
  dawn?: number;
}
const ridgePts = (x0: number, x1: number, y: number, amp: number, seed: number, step = 14): Pt[] => {
  const pts: Pt[] = [];
  for (let x = x0; x <= x1 + step; x += step) {
    const n = Math.sin(x * 0.0042 + seed) * 0.6 + Math.sin(x * 0.011 + seed * 2.3) * 0.3 + Math.sin(x * 0.031 + seed * 5.1) * 0.1;
    pts.push({ x, y: y + amp * n });
  }
  return pts;
};
function fillRidge(c: C, pts: Pt[], bottom: number, col: string | CanvasGradient) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(pts[0].x, bottom);
  for (const p of pts) c.lineTo(p.x, p.y);
  c.lineTo(pts[pts.length - 1].x, bottom);
  c.closePath();
  c.fill();
}
/** a ridge's crest height at x (the same profile as ridgePts) */
export function ridgeAt(x: number, y: number, amp: number, seed: number): number {
  return y + amp * (Math.sin(x * 0.0042 + seed) * 0.6 + Math.sin(x * 0.011 + seed * 2.3) * 0.3 + Math.sin(x * 0.031 + seed * 5.1) * 0.1);
}
/** where the far Window Calendar stands (L2 rest px: on the first ridge, right of the line's last tags) */
export const CAL12 = { x: 1300 } as const;

/** one long paper cloud strip (L1), tapered at both ends; xs = the cache's x range */
function cloudStrip(cc: C, env: PaintEnv, rx: number, rw: number, cx: number, cy: number, w: number, h: number, seed: number) {
  const x0 = Math.max(rx, cx - w / 2), x1 = Math.min(rx + rw, cx + w / 2);
  if (x1 <= x0) return;
  const top: Pt[] = [], bot: Pt[] = [];
  for (let x = x0; x <= x1 + 0.1; x += 10) {
    const u = (x - (cx - w / 2)) / w;
    const taper = Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, u)))), 0.6);
    const n = 0.55 + 0.3 * Math.sin(x * 0.019 + seed * 3.1) + 0.15 * Math.sin(x * 0.051 + seed);
    top.push({ x, y: cy - h * n * taper });
    bot.push({ x, y: cy + h * 0.35 * taper });
  }
  cc.beginPath();
  top.forEach((p, i) => (i ? cc.lineTo(p.x, p.y) : cc.moveTo(p.x, p.y)));
  for (let i = bot.length - 1; i >= 0; i--) cc.lineTo(bot[i].x, bot[i].y);
  cc.closePath();
  cc.fillStyle = withAlpha(mixLab(env.mood.haze, env.mood.core, 0.28), 0.42);
  cc.fill();
  // the shaded underside: a thin darker cut along the bottom
  cc.strokeStyle = withAlpha(mixLab(env.mood.set, env.mood.haze, 0.72), 0.32);
  cc.lineWidth = 1.6;
  cc.beginPath();
  bot.forEach((p, i) => (i ? cc.lineTo(p.x, p.y) : cc.moveTo(p.x, p.y)));
  cc.stroke();
}

/**
 * The Window Calendar far off (L2 rest px, base centre at (x, baseY)): the long month block with its tall tower at the
 * right, cut from one card one step lighter than the ridge in front of it; its panes a dark grid (nothing new lights).
 */
function farCalendar(cc: C, env: PaintEnv, x: number, baseY: number) {
  const body = mixLab(env.fill('set'), env.mood.haze, 0.57);
  const pane = mixLab(env.fill('set'), env.mood.haze, 0.3);
  const block = { x0: x - 78, x1: x + 40, top: baseY - 74 };
  const tower = { x0: x + 46, x1: x + 76, top: baseY - 150 };
  cc.fillStyle = body;
  cc.beginPath();
  // the block with a shallow cornice, the tower with a stepped cap and a short mast
  cc.moveTo(block.x0, baseY + 30);
  cc.lineTo(block.x0, block.top);
  cc.lineTo(block.x0 - 4, block.top);
  cc.lineTo(block.x0 - 4, block.top - 5);
  cc.lineTo(block.x1 + 4, block.top - 5);
  cc.lineTo(block.x1 + 4, block.top);
  cc.lineTo(block.x1, block.top);
  cc.lineTo(block.x1, baseY - 40);
  cc.lineTo(tower.x0, baseY - 40);
  cc.lineTo(tower.x0, tower.top);
  cc.lineTo(tower.x0 + 4, tower.top - 7);
  cc.lineTo(tower.x0 + 13, tower.top - 7);
  cc.lineTo(tower.x0 + 14, tower.top - 22);
  cc.lineTo(tower.x0 + 16, tower.top - 22);
  cc.lineTo(tower.x0 + 17, tower.top - 7);
  cc.lineTo(tower.x1 - 4, tower.top - 7);
  cc.lineTo(tower.x1, tower.top);
  cc.lineTo(tower.x1, baseY + 30);
  cc.closePath();
  cc.fill();
  // the panes: five month columns on the block, two on the tower
  cc.fillStyle = pane;
  for (let m = 0; m < 5; m++) {
    const px = block.x0 + 8 + m * 22.4;
    for (let r = 0; r < 6; r++) cc.fillRect(px, block.top + 8 + r * 11, 7, 7);
    for (let r = 0; r < 6; r++) cc.fillRect(px + 9, block.top + 8 + r * 11, 7, 7);
  }
  for (let r = 0; r < 12; r++) for (const dx of [6, 17]) cc.fillRect(tower.x0 + dx, tower.top + 6 + r * 11, 7, 7);
  // the dawn catches the top edges
  cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.4);
  cc.lineWidth = 1.2;
  cc.beginPath();
  cc.moveTo(block.x0 - 4, block.top - 5);
  cc.lineTo(block.x1 + 4, block.top - 5);
  cc.moveTo(tower.x0 + 4, tower.top - 7);
  cc.lineTo(tower.x1 - 4, tower.top - 7);
  cc.stroke();
}

/** cache options with a resolution (the kit's cached() takes res; the Frame type lists only blur) */
const resOpt = (res: number): { blur?: number } => {
  const o: { blur?: number; res?: number } = { res };
  return o;
};
/** max layer scale over the cameras (cache resolution) */
const maxScale = (z: number, cams: Camera3[]) => cams.reduce((m, cam) => Math.max(m, toScreen({ z }, cam, 0, 0).k), 0);

/** backlight, L1 haze + far ridges + the Window Calendar, L2 ridges, fog A, L3 valley floor, fog B */
export function valleyBack(f: Frame, o: ValleyOpts) {
  const dawn = o.dawn ?? 1;
  f.backlight({ sunX: o.sunX ?? 760, sunY: 400, intensity: 0.85 + 0.15 * dawn });
  const R1 = overscan(LAYERS.L1, o.cams, 40);
  const R2 = overscan(LAYERS.L2, o.cams, 40);
  const R3 = overscan(LAYERS.L3, o.cams, 40);
  const res1 = Math.min(1, maxScale(LAYERS.L1.z, o.cams) * 1.2);
  const res2 = Math.min(1, maxScale(LAYERS.L2.z, o.cams) * 1.1);
  const res3 = Math.min(1.1, maxScale(LAYERS.L3.z, o.cams) * 1.05);
  f.layer('L1', (c, env) => {
    f.cached(`hw-ch12-valley/${o.key}/L1/${env.mood.id}`, R1.w, R1.h, (cc) => {
      cc.translate(-R1.x, -R1.y);
      // a bank of morning haze lying over the low sky
      const hz = env.fill('haze');
      const veil = cc.createLinearGradient(0, 120, 0, 420);
      veil.addColorStop(0, withAlpha(hz, 0));
      veil.addColorStop(0.55, withAlpha(hz, 0.28));
      veil.addColorStop(1, withAlpha(hz, 0.45));
      cc.fillStyle = veil;
      cc.fillRect(R1.x, 120, R1.w, 300);
      // long paper cloud strips in the high sky (pierced paper, pale on top, a shade darker underneath): they give
      // the top of frame a far plane of its own instead of an empty gradient
      for (const [cx, cy, w, h, seed] of [[180, 168, 760, 16, 1], [1010, 132, 980, 13, 2], [620, 236, 640, 11, 3], [1480, 214, 720, 14, 4], [-420, 222, 620, 12, 5]] as const) {
        cloudStrip(cc, env, R1.x, R1.w, cx, cy, w, h, seed);
      }
      const bottom = R1.y + R1.h;
      fillRidge(cc, ridgePts(R1.x, R1.x + R1.w, 352, 26, 0.4, 18), bottom, mixLab(env.mood.set, env.mood.haze, 0.86));
      fillRidge(cc, ridgePts(R1.x, R1.x + R1.w, 392, 30, 2.6, 18), bottom, mixLab(env.mood.set, env.mood.haze, 0.76));
    }, resOpt(res1))(c, R1.x, R1.y);
  });
  f.layer('L2', (c, env) => {
    f.cached(`hw-ch12-valley/${o.key}/L2/${env.mood.id}`, R2.w, R2.h, (cc) => {
      cc.translate(-R2.x, -R2.y);
      const bottom = R2.y + R2.h;
      // the Window Calendar stands behind the first ridge's crest (its foot hidden by the ridge, so it is seated on it):
      // a cut-paper silhouette one step lighter than that ridge and darker than the haze, its panes a dark grid (as the
      // film left it: nothing new lights)
      farCalendar(cc, env, CAL12.x, ridgeAt(CAL12.x, 640, 40, 4.2) + 4);
      fillRidge(cc, ridgePts(R2.x, R2.x + R2.w, 640, 40, 4.2, 12), bottom, mixLab(env.fill('set'), env.mood.haze, 0.5));
      // a stand of paper trees on the second ridge (pierced: the haze shows between the trunks)
      const r2 = ridgePts(R2.x, R2.x + R2.w, 700, 36, 1.3, 12);
      fillRidge(cc, r2, bottom, mixLab(env.fill('set'), env.mood.haze, 0.3));
      cc.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.3);
      for (let i = 0; i < 70; i++) {
        const x = R2.x + ((i * 173.3) % R2.w);
        const k = Math.floor((x - R2.x) / 12);
        const base = r2[Math.max(0, Math.min(r2.length - 1, k))].y + 4;
        const h = 22 + 18 * (0.5 + 0.5 * hash1(i, 1201));
        cc.beginPath();
        cc.moveTo(x, base - h);
        cc.lineTo(x + h * 0.22, base);
        cc.lineTo(x - h * 0.22, base);
        cc.closePath();
        cc.fill();
      }
    }, resOpt(res2))(c, R2.x, R2.y);
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    f.cached(`hw-ch12-valley/${o.key}/L3/${env.mood.id}`, R3.w, R3.h, (cc) => {
      cc.translate(-R3.x, -R3.y);
      const bottom = R3.y + R3.h;
      // the valley floor: a long low slope, darker toward the lens
      const pts = ridgePts(R3.x, R3.x + R3.w, 805, 22, 3.3, 12);
      const g = cc.createLinearGradient(0, 770, 0, 1200);
      g.addColorStop(0, mixLab(env.fill('set'), env.mood.haze, 0.12));
      g.addColorStop(0.45, mixLab(env.fill('set'), env.fill('ink'), 0.4));
      g.addColorStop(1, mixLab(env.fill('set'), env.fill('ink'), 0.75));
      fillRidge(cc, pts, bottom, g);
      // a fence row far down the valley (rhythm), its posts catching the light on top
      cc.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.25);
      for (let x = R3.x + 20; x < R3.x + R3.w; x += 58) {
        const k = Math.floor((x - R3.x) / 12);
        const y = pts[Math.max(0, Math.min(pts.length - 1, k))].y + 6;
        cc.fillRect(x - 2, y - 26, 4, 30);
      }
      cc.strokeStyle = withAlpha(env.mood.rim, 0.22);
      cc.lineWidth = 1;
      cc.beginPath();
      for (const p of pts) cc.lineTo(p.x, p.y + 0.5);
      cc.stroke();
    }, resOpt(res3))(c, R3.x, R3.y);
  });
  f.fog('B');
}

/** L5: soft near grass at the two bottom corners (seen only on the wides; rest-screen px, tops near y 1330..1400 so
 *  at the s01 / s02 wides they sit in the bottom 10 % of frame, clear of the rule's ends) */
export function valleyNear(f: Frame, key: string, alpha = 1, o: { band?: number } = {}) {
  if (alpha <= 0) return;
  f.layer('L5', (c, env) => {
    // one continuous dark paper-cut bank of grass across the bottom (rest px; its crest near y bandY): the nearest
    // plane of the valley, so the wide reads in depth (ch12-s01's wide)
    if (o.band !== undefined) {
      const bandY = o.band;
      const band = f.cached(`hw-ch12-valley/${key}/L5band/${bandY}/${env.mood.id}`, 3200, 420, (cc) => {
        cc.translate(1000, -(bandY - 120));
        cc.fillStyle = PUPPET_NEAR_BLACK;
        cc.beginPath();
        cc.moveTo(-1000, bandY + 300);
        for (let x = -1000; x <= 2200; x += 6) {
          const i = Math.round((x + 1000) / 6);
          const swell = 26 * Math.sin(x * 0.0031 + 0.8) + 12 * Math.sin(x * 0.0093 + 2.1);
          const h = 10 + 26 * (0.5 + 0.5 * hash1(i, 1211)) * (0.6 + 0.4 * Math.sin(x * 0.02));
          cc.lineTo(x, bandY + 18 - swell - h);
          cc.lineTo(x + 3, bandY + 18 - swell - h * 0.35);
        }
        cc.lineTo(2200, bandY + 300);
        cc.closePath();
        cc.fill();
      });
      c.save();
      c.globalAlpha = alpha;
      band(c, -1000, bandY - 120);
      c.restore();
    }
    const draw = f.cached(`hw-ch12-valley/${key}/L5b/${env.mood.id}`, 2600, 300, (cc) => {
      cc.translate(700, -1300);
      cc.fillStyle = PUPPET_NEAR_BLACK;
      for (const [x0, x1, dir] of [[-700, -120, 1], [1400, 1900, -1]] as const) {
        cc.beginPath();
        cc.moveTo(x0, 1600);
        for (let x = x0; x <= x1; x += 7) {
          const i = Math.round((x - x0) / 7);
          const edge = dir > 0 ? (x - x0) / (x1 - x0) : (x1 - x) / (x1 - x0);
          const h = (1 - edge) * 70 + 14 + 36 * (0.5 + 0.5 * hash1(i, 1207 + dir));
          cc.lineTo(x, 1420 - h + edge * 60);
          cc.lineTo(x + 3.5, 1420 - h * 0.55 + edge * 60);
        }
        cc.lineTo(x1, 1600);
        cc.closePath();
        cc.fill();
      }
    });
    c.save();
    c.globalAlpha = alpha;
    draw(c, -700, 1300);
    c.restore();
  });
}

// ---------------------------------------------------------------- line, rule, threads, tips
export function drawLine12(c: C, env: PaintEnv, glow = 0.6) {
  drawLine(c, env, { x0: LINE12.x0, x1: LINE12.x1, y: LINE12.y, sag: LINE12.sag, posts: 'post', glow });
}
/** the Lifespan Rule hung front-on from the two posts; labels 0..1 */
export function drawRule12(c: C, env: PaintEnv, labels = 1, alpha = 1) {
  if (alpha <= 0) return;
  // two short cords from the posts to the rule's ends
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.7 * alpha);
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  c.moveTo(LINE12.x0 + 6, RULE12.y - 30);
  c.lineTo(RULE12.x0, RULE12.y + 2);
  c.moveTo(LINE12.x1 - 6, RULE12.y - 30);
  c.lineTo(RULE12.x1, RULE12.y + 2);
  c.stroke();
  drawRule(c, env, { x0: RULE12.x0, x1: RULE12.x1, y: RULE12.y, labels, alpha });
}
export const lifeX12 = (days: number) => lifeX(days, RULE12);
/** dims the hung rule toward the mood's ink by k (0..1; .4 = about 60 % value): it sinks behind the loom's foot */
export function shadeRule12(c: C, env: PaintEnv, k: number) {
  if (k <= 0) return;
  c.fillStyle = withAlpha(mixLab(env.mood.ink, PUPPET_NEAR_BLACK, 0.3), clamp01(k));
  c.fillRect(RULE12.x0 - 1, RULE12.y - 1, RULE12.x1 - RULE12.x0 + 2, 33);
}
const threadCol = (env: PaintEnv, a = 0.85) => withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), a);

/**
 * Where a strand's tip sits: on the rule's top edge at its lifespan x. Strands whose lifespans land within 40 px of
 * each other (6, 10 and 11's JSON half at about thirteen days; tag 1's two strands near a lifetime) stack upward in
 * steps of TIP_PITCH, so each end shows on its own.
 */
export const TIP_PITCH = 26;
export function tipPt(lx: number, lane: number): Pt {
  return { x: lx, y: RULE12.y - 3 - (TIP_STACK[lane] ?? 0) * TIP_PITCH };
}
/** kept for callers that only need a tip's height */
export const laneY = (lane: number) => RULE12.y - 3 - (TIP_STACK[lane] ?? 0) * TIP_PITCH;

/**
 * A lifespan thread: ONE straight run from a tag's bottom down to its tip on the rule (the threads fan from the line
 * to the rule, so each belief visibly hangs over the time it held). `via` bends it round obstacles (the loom's tags in
 * s04). u = 0..1 progress along the thread; alpha fades it.
 */
export function thread12(c: C, env: PaintEnv, from: Pt, lx: number, lane: number, u = 1, alpha = 1, via: Pt[] = []) {
  const U = clamp01(u);
  if (U <= 0 || alpha <= 0) return;
  const pts = [from, ...via, tipPt(lx, lane)];
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  let len = U * segs.reduce((a, b) => a + b, 0);
  c.save();
  c.globalAlpha *= alpha;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(from.x, from.y);
  for (let i = 0; i < segs.length && len > 0; i++) {
    const k = Math.min(1, len / Math.max(1e-6, segs[i]));
    c.lineTo(lerp(pts[i].x, pts[i + 1].x, k), lerp(pts[i].y, pts[i + 1].y, k));
    len -= segs[i];
  }
  // a fine dark under-cut so the pale thread reads over the pale rule and the haze alike
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.28);
  c.lineWidth = Math.max(lw(c, 2.6), 1.6);
  c.stroke();
  c.strokeStyle = threadCol(env);
  c.lineWidth = Math.max(lw(c, 1.3), 0.9);
  c.stroke();
  c.restore();
}
/**
 * A thread's tip: open (a small warm bloom and a copper arrow pointing right: still held), cut or frayed (ended).
 * o.glow scales the bloom (0..1); the bloom stays small (r 11·s, alpha .45·glow) so it never outshines the action.
 */
export function tip12(c: C, env: PaintEnv, x: number, lane: number, tip: TipKind, o: { glow?: number; s?: number; alpha?: number } = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  const s = o.s ?? 1;
  const e = tipPt(x, lane);
  c.save();
  c.globalAlpha *= a;
  if (tip === 'open') {
    const gl = o.glow ?? 1;
    const r = 11 * s;
    if (gl > 0) {
      const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
      g.addColorStop(0, withAlpha(env.mood.core, 0.45 * gl));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = g;
      c.fillRect(e.x - r, e.y - r, r * 2, r * 2);
      c.restore();
    }
    // the copper arrow, pointing right (still growing): a dark under-cut, then the copper
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const L = 30 * s, hw = 5.5 * s;
    const arrow = () => {
      c.beginPath();
      c.moveTo(e.x, e.y);
      c.lineTo(e.x + L, e.y);
      c.moveTo(e.x + L - hw * 1.2, e.y - hw);
      c.lineTo(e.x + L, e.y);
      c.lineTo(e.x + L - hw * 1.2, e.y + hw);
    };
    arrow();
    c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.55);
    c.lineWidth = Math.max(lw(c, 4.2), 3.6 * s);
    c.stroke();
    arrow();
    c.strokeStyle = copperOf(env, 0.75 + 0.25 * Math.min(1, gl));
    c.lineWidth = Math.max(lw(c, 2.4), 2 * s);
    c.stroke();
    c.fillStyle = mixLab(env.mood.core, '#ffffff', 0.2);
    c.beginPath();
    c.arc(e.x, e.y, 2.6 * s, 0, Math.PI * 2);
    c.fill();
  } else if (tip === 'cut') {
    c.strokeStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.4), 0.95);
    c.lineWidth = Math.max(lw(c, 2.4), 2 * s);
    c.beginPath();
    c.moveTo(e.x - 5 * s, e.y - 4 * s);
    c.lineTo(e.x + 5 * s, e.y + 2 * s);
    c.stroke();
  } else {
    c.strokeStyle = threadCol(env);
    c.lineWidth = Math.max(lw(c, 1.2), 0.9);
    c.beginPath();
    for (let k = -2; k <= 2; k++) {
      c.moveTo(e.x, e.y - 5 * s);
      c.lineTo(e.x + k * 3 * s, e.y + 2 * s - Math.abs(k) * s);
    }
    c.stroke();
  }
  c.restore();
}

/** every strand of the ch12 tags with its lane on the rule (stable across s01 .. s04) */
export interface StrandRef {
  id: TagId;
  i: number;
  days: number;
  tip: TipKind;
  lane: number;
  /** x offset from the tag's centre where the strand leaves its bottom edge */
  dx: number;
}
export const STRANDS: StrandRef[] = (() => {
  const out: StrandRef[] = [];
  let lane = 0;
  for (const id of ORDER12) {
    const sd = TAGS[id].strands;
    if (!sd || TAGS[id].slack) continue;
    sd.forEach((s, i) => out.push({ id, i, days: s.days, tip: s.tip, lane: lane++, dx: sd.length > 1 ? (i === 0 ? -8 : 8) : 0 }));
  }
  return out;
})();
/** each lane's stack step on the rule (0 = on the rule's edge): coincident lifespans climb, in lane order */
const TIP_STACK: number[] = (() => {
  const out: number[] = [];
  const xs = STRANDS.map((s) => lifeX12(s.days));
  STRANDS.forEach((s, i) => {
    let k = 0;
    for (let j = 0; j < i; j++) if (Math.abs(xs[j] - xs[i]) < 40) k++;
    out[s.lane] = k;
  });
  return out;
})();

/** the slack loop under a slack (suspect) or question tag; no lifespan */
export function slackLoop(c: C, env: PaintEnv, bottom: Pt, s = 1, alpha = 1) {
  c.strokeStyle = threadCol(env, 0.85 * alpha);
  c.lineWidth = Math.max(lw(c, 1.2), 0.8);
  c.beginPath();
  c.moveTo(bottom.x, bottom.y);
  c.bezierCurveTo(bottom.x - 6 * s, bottom.y + 22 * s, bottom.x + 12 * s, bottom.y + 26 * s, bottom.x + 4 * s, bottom.y + 38 * s);
  c.stroke();
}
/** tag 11's third thread, lettered bison: a short run ending in an open loop (an aspiration not yet tested) */
export function bisonLoop(c: C, env: PaintEnv, bottom: Pt, tq: number, alpha = 1) {
  const sway = 0.12 * Math.sin(tq * 1.3 + 0.7);
  const end = { x: bottom.x + 30 * Math.sin(sway), y: bottom.y + 30 };
  c.strokeStyle = threadCol(env, 0.8 * alpha);
  c.lineWidth = Math.max(lw(c, 1.2), 0.8);
  c.beginPath();
  c.moveTo(bottom.x, bottom.y);
  c.quadraticCurveTo(bottom.x + 2, bottom.y + 16, end.x, end.y);
  c.stroke();
  c.beginPath();
  c.arc(end.x, end.y + 5, 5, 0, Math.PI * 2);
  c.stroke();
}

/** draw a tag hanging with its eyelet at eye and its string from knot */
export function tag12(c: C, env: PaintEnv, st: TagState, eye: Pt, knot: Pt, tq: number) {
  drawTag(c, env, { ...st, x: eye.x }, { at: eye, knotAt: knot, tq });
}
/** the nanoGPT question card hanging slack beneath tag 10 (from its lower right corner) */
export function nanoUnder(c: C, env: PaintEnv, st: TagState, eye10: Pt, tq: number) {
  const s10 = 1;
  const corner = { x: eye10.x + TAG.w * 0.32 * s10, y: eye10.y + TAG.h * s10 - 3 };
  const sway = 0.05 * Math.sin(tq * 1.5 + 2.2);
  const eye = { x: corner.x + 6 + 18 * Math.sin(sway), y: corner.y + 16 };
  drawTag(c, env, { ...st, x: eye.x, swing: 0.04, phase: 2.2 }, { at: eye, knotAt: corner, tq });
}

/** a red pencil resting against a tag's right edge (contested) */
export function pencilBeside(c: C, env: PaintEnv, eye: Pt, id: TagId, alpha = 1) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha *= alpha;
  drawPencil(c, { x: eye.x + tagW(id) * 0.62, y: eye.y + tagH(id) - 6 }, Math.PI * 0.5 + 0.28, 62, env);
  c.restore();
}

/** the warp of one loom frame: a copper thread from the line down to the foot, with a small paper weight */
export function drawWarp(c: C, env: PaintEnv, col: number, o: { u?: number; slack?: number; glow?: number; alpha?: number; tq?: number } = {}) {
  const u = clamp01(o.u ?? 1);
  const a = o.alpha ?? 1;
  if (u <= 0 || a <= 0) return;
  const x = COLX[col];
  const top = lineY12(x);
  const bot = top + (LOOM_FOOT - top) * u;
  const slack = o.slack ?? 0;
  const sway = slack * 9 * Math.sin((o.tq ?? 0) * 1.1 + col * 1.7);
  c.save();
  c.globalAlpha = a;
  // the upright frame: two fine dark rails either side of the warp (ch05's frames, much thinner here), a top cap
  const rail = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.55);
  c.strokeStyle = withAlpha(rail, 0.8 * u);
  c.lineWidth = Math.max(lw(c, 2.4), 1.2);
  c.beginPath();
  for (const dx of [-40, 40]) {
    c.moveTo(x + dx, top + 10);
    c.lineTo(x + dx, bot);
  }
  c.moveTo(x - 44, top + 10);
  c.lineTo(x + 44, top + 10);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45 * u);
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  c.moveTo(x - 44, top + 9);
  c.lineTo(x + 44, top + 9);
  c.stroke();
  // the warp itself (a slight bow while slack): a dark wire with a copper face, so it reads against the haze
  const gl = o.glow ?? 0;
  const path = () => {
    c.beginPath();
    c.moveTo(x, top);
    c.quadraticCurveTo(x + sway, (top + bot) / 2, x, bot);
  };
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.75);
  c.lineWidth = Math.max(lw(c, 3), 1.6);
  path();
  c.stroke();
  c.strokeStyle = copperOf(env, 0.45 + 0.55 * gl);
  c.lineWidth = Math.max(lw(c, 1.5), 0.9);
  path();
  c.stroke();
  if (gl > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(env.mood.core, 0.18 * gl);
    c.lineWidth = lw(c, 8);
    path();
    c.stroke();
    c.restore();
  }
  if (u >= 0.98) {
    // the weight: a small paper-and-copper bob, and the frame's foot bar
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.beginPath();
    c.moveTo(x - 7, bot);
    c.lineTo(x + 7, bot);
    c.lineTo(x + 5, bot + 14);
    c.lineTo(x - 5, bot + 14);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(copperOf(env, 0.4), 0.8);
    c.lineWidth = lw(c, 1.4);
    c.beginPath();
    c.moveTo(x - 7, bot + 0.5);
    c.lineTo(x + 7, bot + 0.5);
    c.stroke();
  }
  c.restore();
}

/**
 * SKIP THREADS (a dependency that spans more than one frame) never run straight behind an unrelated tag: tag rows line
 * up across frames, so a mid-height thread from 5 to 9 would pass behind 3 and 7 and read as a chain the model does
 * not have. Each one is routed through a clear corridor at this rest y: 5 → 9 over the top rows (above 3's and 7's
 * knots), 4 → 6 through the gap between frame 1's middle rows (between 5 and 8), 8 → 11 under the bottom rows (below
 * 6, and below 10's nanoGPT card). Computed for the loom's geometry (STACKS, PITCH, TAG).
 */
const DEP_VIA: Record<string, number> = { '5>9': STACK_MID - PITCH * 0.5 - 95, '4>6': STACK_MID + 69, '8>11': STACK_MID + PITCH * 1.5 + 65 };
export const depVia = (a: TagId, z: TagId | 'hook'): number | undefined => DEP_VIA[`${a}>${z}`];

/** the polyline of a dependency thread from a to b (rest px), routed through `via` when given, sagged by `sag` px */
function depPath(a: Pt, b: Pt, sag: number, via?: number): Pt[] {
  const pts: Pt[] = [];
  const cub = (p: Pt, q: Pt, n: number, first: boolean) => {
    const dx = (q.x - p.x) * 0.45;
    for (let i = first ? 0 : 1; i <= n; i++) {
      const s = i / n, it = 1 - s;
      pts.push({
        x: it * it * it * p.x + 3 * it * it * s * (p.x + dx) + 3 * it * s * s * (q.x - dx) + s * s * s * q.x,
        y: it * it * it * p.y + 3 * it * it * s * p.y + 3 * it * s * s * q.y + s * s * s * q.y,
      });
    }
  };
  if (via === undefined) cub(a, b, 20, true);
  else {
    // leave the source frame and enter the target frame between the rails (rails sit at COLX ± 40)
    const next = COLX.find((x) => x > a.x + 1) ?? b.x;
    const prev = [...COLX].reverse().find((x) => x < b.x - 1) ?? a.x;
    const m1 = { x: next - 46, y: via }, m2 = { x: prev + 46, y: via };
    cub(a, m1, 10, true);
    for (let i = 1; i <= 6; i++) pts.push({ x: lerp(m1.x, m2.x, i / 6), y: via });
    cub(m2, b, 10, false);
  }
  if (sag) {
    const x0 = a.x, x1 = b.x;
    for (const p of pts) {
      const s = clamp01((p.x - x0) / Math.max(1, x1 - x0));
      p.y += sag * 3 * s * (1 - s);
    }
  }
  return pts;
}

/**
 * A dependency thread from a tag's right edge (a) to its needer's left edge (b), left to right; u = 0..1 drawn from a,
 * sag = 0..1 slack (before the loom tensions), lit = 0..1 copper light along it (the wave), bead = 0..1 the wave's
 * leading bead along the thread (undefined = none), via = the routed corridor of a skip thread (depVia).
 */
export function depThread(c: C, env: PaintEnv, a: Pt, b: Pt, o: { u?: number; sag?: number; alpha?: number; lit?: number; bead?: number; via?: number } = {}) {
  const u = clamp01(o.u ?? 1);
  const al = o.alpha ?? 1;
  if (u <= 0 || al <= 0) return;
  const sag = (o.sag ?? 0) * (14 + Math.abs(b.x - a.x) * 0.06);
  const pts = depPath(a, b, sag, o.via);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1];
  const at = (d: number): Pt => {
    let i = 1;
    while (i < pts.length - 1 && cum[i] < d) i++;
    const k = clamp01((d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]));
    return { x: lerp(pts[i - 1].x, pts[i].x, k), y: lerp(pts[i - 1].y, pts[i].y, k) };
  };
  const lit = clamp01(o.lit ?? 0);
  const L = u * total;
  c.save();
  c.globalAlpha *= al;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length && cum[i - 1] < L; i++) {
    const q = cum[i] <= L ? pts[i] : at(L);
    c.lineTo(q.x, q.y);
  }
  // a dark thread with a copper face (it reads against the haze); the wave lights the copper
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.55 * (1 - lit * 0.6));
  c.lineWidth = Math.max(lw(c, 2.6), 1.2);
  c.stroke();
  c.strokeStyle = withAlpha(copperOf(env, 0.4 + 0.6 * lit), 0.85 + 0.15 * lit);
  c.lineWidth = Math.max(lw(c, 1.3 + 0.9 * lit), 0.8);
  c.stroke();
  if (lit > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(env.mood.core, 0.25 * lit);
    c.lineWidth = lw(c, 7);
    c.stroke();
    c.restore();
  }
  if (o.bead !== undefined && o.bead > 0 && o.bead < 1) {
    const q = at(o.bead * L);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, 18);
    g.addColorStop(0, withAlpha(env.mood.core, 0.9));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(q.x - 18, q.y - 18, 36, 36);
    c.restore();
  }
  c.restore();
}

/** the swing drawTag gives a tag (so overlays on its face move with it) */
const swingOf = (st: TagState, tq: number) => (st.swing ?? 0.025) * Math.sin(tq * 1.7 + (st.phase ?? SLOT_X[st.id] * 0.013));
/** a tag's body outline in its own frame (eyelet at the origin) */
function bodyPath(c: C, id: TagId, s: number) {
  const def = TAGS[id];
  const small = def.kind === 'question' || def.kind === 'card';
  const w = (small ? TAG.w * 0.62 : TAG.w) * s;
  const h = (small ? TAG.w * 0.62 : TAG.h) * s;
  c.beginPath();
  if (small) {
    c.rect(-w / 2, 0, w, h);
    return;
  }
  const k = w * 0.2;
  c.moveTo(-w / 2 + k, 0);
  c.lineTo(w / 2 - k, 0);
  c.lineTo(w / 2, k);
  c.lineTo(w / 2, h);
  c.lineTo(-w / 2, h);
  c.lineTo(-w / 2, k);
  c.closePath();
}
/**
 * Puts a tag in shadow: its whole body (or its right half: 11's TOML half) multiplied toward the mood's ink by k
 * (k .45 = about 55 % value). Paint after the tag (tag12) with the same state and tq.
 */
export function tagShade(c: C, env: PaintEnv, st: TagState, eye: Pt, k: number, tq: number, rightHalf = false) {
  if (k <= 0) return;
  const s = st.scale ?? 1;
  c.save();
  c.translate(eye.x, eye.y);
  c.rotate(swingOf(st, tq));
  if (rightHalf) {
    c.beginPath();
    c.rect(0, -2, TAG.w * s, TAG.h * s + 4);
    c.clip();
  }
  bodyPath(c, st.id, s);
  c.fillStyle = withAlpha(mixLab(env.mood.ink, PUPPET_NEAR_BLACK, 0.3), clamp01(k));
  c.fill();
  c.restore();
}
/**
 * The why tag's front: a faint red-pencil '?' (the stranger's question shows through), so it never reads as a blank tag
 * (ch12-s06's blank tag stays the only one). sx = the tag's turn (cos), 1 = front square on.
 */
export function whyFace(c: C, env: PaintEnv, st: TagState, eye: Pt, tq: number, a = 1, sx = 1) {
  if (a <= 0 || sx <= 0.05) return;
  const s = st.scale ?? scaleOf('why');
  c.save();
  c.translate(eye.x, eye.y);
  c.rotate(swingOf(st, tq));
  c.scale(sx, 1);
  textRole(c, 'texture', () => {
    c.font = `italic 400 ${(40 * s).toFixed(1)}px ${FONT.fell}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = pencilRed(env, 0.42 * a);
    c.fillText('?', 1, TAG.h * s * 0.78);
  });
  c.restore();
}

/** an additive halo behind a tag (it glows from behind: the wave's light); s = tag scale */
export function tagHalo(c: C, env: PaintEnv, eye: Pt, id: TagId, k: number) {
  if (k <= 0) return;
  const cx = eye.x, cy = eye.y + tagH(id) * 0.5;
  const r = 70 * scaleOf(id);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, withAlpha(env.mood.core, 0.42 * k));
  g.addColorStop(0.5, withAlpha(env.mood.halo, 0.2 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(cx - r, cy - r, r * 2, r * 2);
  c.restore();
}
