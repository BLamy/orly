/**
 * Articulated silhouette puppets (style bible §4) — the cut-paper cast.
 *
 *   const ada = createPuppet({ id: 'ada', height: 300, build: 'average', era: '1950s',
 *     wardrobe: 'labCoat', hair: 'crewCut', glasses: 'browline', prop: 'clipboard' });
 *   ada.draw(c, { x, y, facing: 'right', pose: POSES.present }, env);   // x,y = feet (world)
 *   ada.anchor(o, 'handF')  ada.bounds(o)
 *
 * Spec notes
 *  - wardrobe: a WARDROBES name (wardrobe.ts). Append ':f' / ':m' to choose the
 *    figure explicitly ('hoodie:f'); skirts and dresses default to 'f'.
 *  - hair: HAIR_STYLES (hair.ts). facialHair, glasses, hat, prop, profile per contracts.
 *  - details: extra cut-line ids put first in the ≤ 8 budget (e.g. 'watchChain', 'crease').
 *  - The near hand carries the prop when its shape can hold (relaxed/grip/fist/pinch,
 *    or point for chalk/pen/pipe); otherwise the prop passes to the far hand.
 *
 * Draw: fills every part in env.fill('ink') back → front (rig.ts DRAW_ORDER), cut-lines
 * in env.fill('rim') at α .3–.55 in each part's local space, lenses lit. With o.light (a direction toward
 * the key light / windows) the cut-lines fade across the figure from full alpha on the lit side to
 * light.floor (default 0.12) on the far side: only window-facing edges catch light (no all-round outline). Facing 'left'
 * flips the rig but re-picks asymmetric details for that side (parting, pockets,
 * watch chain), never mirroring them. Secondary parts (hair falls, skirts and coat
 * hems, ties, hood strings, lanyards) hang by gravity and lag one twos-tick at 0.6
 * when the pose carries `prev` (poseTrack / walk / withLife do this for you).
 * Root: pose.root.x is FORWARD-relative stage px; pose.root.y (stage px, + = down)
 * disables auto-grounding (otherwise the lowest heel/toe sits on y).
 * Value hierarchy (review round 4): o.ink overrides the body fill (PUPPET_NEAR_BLACK makes the figure the
 * darkest shape in frame, a step below the set's ink), and o.edgeRim cuts a 1–2 px rim on the figure's own
 * contour on the window side only (an offscreen mask the size of the figure), independent of f.rim().
 *
 * Re-exports: poses (POSES, poseTrack, blendPose …), motion (withLife, talkBeats …),
 * walk (walkCycle …), WARDROBES, HAIR_STYLES, ERA_CAST (a ready line-up).
 */
import type { Facing, HandShape, Pose, Puppet, PuppetDrawOpts, PuppetSpec, PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { makeCanvas } from '../atmosphere';
import { armArt, bodyFor, legArt, shoeArt, shoeContacts, type Body, type Cut, type Figure, type LimbArt } from './body';
import { HEAD_PIVOT, headArt, type HeadArt } from './heads';
import { hairArt, hatArt, type HairArt, type HatArt } from './hair';
import { HOLDING_SHAPES, handArt, propArt } from './hands';
import { ang, DEG, lerp, mApply, mMul, mRotate, mTranslate, strHash, UNIT_H, type M } from './rig';
import { hangers, lowerArt, lowerCuts, neckArt, torsoArt, wardrobeFor, type Hanger, type PartArt, type WardrobeDef } from './wardrobe';

export type { Body, Figure } from './body';
export { WARDROBES, wardrobeFor } from './wardrobe';
export { HAIR_STYLES } from './hair';
export { JOINT_LIMITS, UNIT_H, clampAngle } from './rig';
export * from './poses';
export * from './motion';
export * from './walk';

/** near-black figure fill (review round 4, value hierarchy): darker than any mood's set ink, never #000 */
export const PUPPET_NEAR_BLACK = '#0b0d0b';

/** A pose that also remembers the pose one twos-tick earlier (for secondary lag). */
export interface PuppetPose extends Pose {
  prev?: Pose;
  /** forward root velocity, stage px/s (walks): hanging parts trail it */
  drift?: number;
  /** typing loop drawing index */
  loop?: number;
}

interface Built {
  spec: PuppetSpec;
  w: WardrobeDef;
  b: Body;
  head: HeadArt;
  hair: HairArt;
  hat?: HatArt;
  armF: { upper: LimbArt; fore: LimbArt };
  armB: { upper: LimbArt; fore: LimbArt };
  legF: { thigh: LimbArt; shin: LimbArt };
  legB: { thigh: LimbArt; shin: LimbArt };
  shoeF: LimbArt;
  shoeB: LimbArt;
  torso: Record<Facing, PartArt>;
  neck: PartArt;
  hangers: Hanger[];
  allowed: Record<Facing, Set<string>>;
  handLen: number;
  seed: number;
}

function parseWardrobe(name: string): { name: string; fig?: Figure } {
  const m = /^(.*):(f|m)$/.exec(name);
  return m ? { name: m[1], fig: m[2] as Figure } : { name };
}

function build(spec: PuppetSpec): Built {
  const pw = parseWardrobe(spec.wardrobe);
  const w = wardrobeFor(pw.name);
  const fig: Figure = pw.fig ?? w.fig;
  const b = bodyFor(spec, fig);
  const seed = strHash(spec.id);
  const head = headArt({ h: b.head, fig, profile: spec.profile, facialHair: spec.facialHair, glasses: spec.glasses, era: spec.era });
  const hair = hairArt(spec.hair, { h: b.head, fig, seed });
  const hat = hatArt(spec.hat, spec.era, b.head);
  if (spec.glasses && spec.glasses !== 'none') {
    // the temple arm already draws the side of the face; a hairline across it reads as a strap
    hair.cuts = hair.cuts.filter((c) => c.id !== 'hairline');
    hair.cutsFacingLeft = hair.cutsFacingLeft?.filter((c) => c.id !== 'hairline');
  }
  if (hat) {
    hair.cuts = hair.cuts.filter((c) => c.id === 'hairline');
    hair.cutsFacingLeft = hair.cutsFacingLeft?.filter((c) => c.id === 'hairline');
  }
  const built: Built = {
    spec,
    w,
    b,
    head,
    hair,
    hat,
    armF: armArt(b, w.sleeve, true),
    armB: armArt(b, w.sleeve, false),
    legF: legArt(b, w.trousers, true),
    legB: legArt(b, w.trousers, false),
    shoeF: shoeArt(w.shoes, true),
    shoeB: shoeArt(w.shoes, false),
    torso: { right: torsoArt(b, w, 'right'), left: torsoArt(b, w, 'left') },
    neck: neckArt(b, w),
    hangers: hangers(b, w),
    allowed: { right: new Set(), left: new Set() },
    handLen: b.upperArm * 0.46,
    seed,
  };
  for (const f of ['right', 'left'] as Facing[]) built.allowed[f] = budget(built, f);
  return built;
}

/** Choose ≤ 8 cut-line ids (style bible §2.6), signature details first. */
function budget(B: Built, facing: Facing): Set<string> {
  const present = new Set<string>();
  const add = (cs: Cut[] | undefined) => cs?.forEach((c) => present.add(c.id));
  const hairCuts = facing === 'left' && B.hair.cutsFacingLeft ? B.hair.cutsFacingLeft : B.hair.cuts;
  add(B.head.cuts);
  add(hairCuts);
  add(B.hair.fall?.cuts);
  add(B.hat?.cuts);
  add(B.torso[facing].cuts);
  add(B.neck.cuts);
  for (const p of [B.armF.upper, B.armF.fore, B.legF.thigh, B.legF.shin, B.shoeF]) add(p.cuts);
  for (const h of B.hangers) if (!h.hiddenUnder) add(h.cuts);
  B.torso[facing].lights?.forEach((l) => present.add(l.id));
  const w = B.w;
  const order = [
    'glassesArm',
    ...(B.spec.details ?? []),
    'armSeam',
    ...w.details.slice(0, 2),
    'part',
    'hairline',
    'hatBand',
    'roll',
    ...w.details.slice(2, 4),
    'strings',
    'lanyard',
    'beardEdge',
    'beardLocks',
    'curls',
    'locks',
    'bunRing',
    'comb',
    'sweep',
    'turtleFold',
    'tie',
    ...w.details.slice(4),
    'shirtCollar',
    'collar',
    'capSeam',
    'beanieFold',
    'hatPinch',
    'crease',
  ];
  const out = new Set<string>();
  for (const id of order) {
    if (out.size >= 8) break;
    if (present.has(id)) out.add(id);
  }
  // lower-garment details are built per frame; reserve them if budget remains
  for (const id of ['hemLine', 'coatPocket']) if (out.size < 8 && w.lower && w.details.includes(id)) out.add(id);
  return out;
}

const cache = new Map<string, Built>();
function builtFor(spec: PuppetSpec): Built {
  const key = JSON.stringify(spec);
  let b = cache.get(key);
  if (!b) {
    b = build(spec);
    cache.set(key, b);
  }
  return b;
}

// ---------------------------------------------------------------- forward kinematics
interface Rig {
  root: M;
  torso: M;
  neck: M;
  head: M;
  shF: M;
  elF: M;
  wrF: M;
  shB: M;
  elB: M;
  wrB: M;
  hipF: M;
  knF: M;
  anF: M;
  hipB: M;
  knB: M;
  anB: M;
}

function fk(B: Built, p: Pose, dy: number): Rig {
  const b = B.b;
  const root = mTranslate([1, 0, 0, 1, 0, 0], 0, -b.hipY + dy);
  const torso = mRotate(root, ang(p, 'torso') * DEG);
  const neck = mRotate(mTranslate(torso, b.neckBase[0], b.neckBase[1]), ang(p, 'neck') * DEG);
  const head = mRotate(mTranslate(neck, b.neckLean, -b.neckLen), ang(p, 'head') * DEG);
  const arm = (s: 'F' | 'B') => {
    const sh = mRotate(mTranslate(torso, b.shoulder[0] + (s === 'B' ? -1.5 : 0), b.shoulder[1]), -ang(p, `shoulder${s}`) * DEG);
    const el = mRotate(mTranslate(sh, 0, b.upperArm), -ang(p, `elbow${s}`) * DEG);
    const wr = mRotate(mTranslate(el, 0, b.foreArm), -ang(p, `wrist${s}`) * DEG);
    return [sh, el, wr];
  };
  const leg = (s: 'F' | 'B') => {
    const hp = s === 'F' ? b.hipF : b.hipB;
    const hip = mRotate(mTranslate(root, hp[0], hp[1]), -ang(p, `hip${s}`) * DEG);
    const kn = mRotate(mTranslate(hip, 0, b.thigh), -ang(p, `knee${s}`) * DEG);
    const an = mRotate(mTranslate(kn, 0, b.shin), -ang(p, `ankle${s}`) * DEG);
    return [hip, kn, an];
  };
  const [shF, elF, wrF] = arm('F');
  const [shB, elB, wrB] = arm('B');
  const [hipF, knF, anF] = leg('F');
  const [hipB, knB, anB] = leg('B');
  return { root, torso, neck, head, shF, elF, wrF, shB, elB, wrB, hipF, knF, anF, hipB, knB, anB };
}

/** vertical offset (units) that puts the lowest heel/toe on the ground */
function groundDy(B: Built, p: Pose): number {
  const r = fk(B, p, 0);
  const cts = shoeContacts(B.w.shoes);
  let maxY = -Infinity;
  for (const m of [r.anF, r.anB]) for (const q of [cts.heel, cts.toe]) maxY = Math.max(maxY, mApply(m, q[0], q[1]).y);
  return -maxY;
}

function rootDy(B: Built, p: Pose, k: number): number {
  return p.root?.y !== undefined ? p.root.y / k : groundDy(B, p);
}

/** the puppet → world matrix (feet origin, facing flip, scale) */
function worldM(B: Built, o: PuppetDrawOpts): { W: M; k: number } {
  const k = (B.spec.height / UNIT_H) * (o.scale ?? 1);
  const sg = o.facing === 'left' ? -1 : 1;
  const rx = (o.pose.root?.x ?? 0) * sg;
  return { W: [sg * k, 0, 0, k, o.x + rx, o.y], k };
}

const angleOf = (m: M) => Math.atan2(m[1], m[0]) / DEG;

// ---------------------------------------------------------------- drawing
/** the spec's posture signature on top of any pose (stoop / chin), on the pose and its lag copy */
function signed(B: Built, pose: Pose): Pose {
  const sg = B.spec.signature;
  if (!sg || (!sg.stoop && !sg.chinUp) || (pose as { __signed?: boolean }).__signed) return pose;
  const add = (q: Pose): Pose => ({
    ...q,
    angles: {
      ...q.angles,
      torso: (q.angles.torso ?? 0) + (sg.stoop ?? 0) * 0.55,
      neck: (q.angles.neck ?? 0) + (sg.stoop ?? 0) * 0.45,
      head: (q.angles.head ?? 0) - (sg.chinUp ?? 0),
    },
  });
  const pp = pose as PuppetPose;
  return { ...add(pp), ...(pp.prev ? { prev: add(pp.prev) } : {}), __signed: true } as PuppetPose;
}

function drawPuppet(B: Built, c: CanvasRenderingContext2D, o0: PuppetDrawOpts, env: PaintEnv) {
  const o = B.spec.signature ? { ...o0, pose: signed(B, o0.pose) } : o0;
  const p = o.pose as PuppetPose;
  const { W, k } = worldM(B, o);
  const dy = rootDy(B, p, k);
  const R = fk(B, p, dy);
  const facing = o.facing;
  const allowed = B.allowed[facing];
  const ink = o.ink ?? env.fill('ink');
  const rim = env.fill('rim');
  const cutsOn = o.cutLines !== false && k * UNIT_H > 90;
  const cutAlpha = k * UNIT_H > 180 ? 0.88 : 0.62;
  const base = c.getTransform();
  const BM: M = [base.a, base.b, base.c, base.d, base.e, base.f];
  const set = (m: M) => {
    curM = m;
    const t = mMul(BM, mMul(W, m));
    c.setTransform(t[0], t[1], t[2], t[3], t[4], t[5]);
  };
  const fill = (pieces: Path2D[]) => {
    for (const q of pieces) c.fill(q);
  };
  // directional cut-light: world-space end points across the figure (lit side → far side); each part maps
  // them into its own local space so one gradient spans the whole figure
  const L = o.light && Math.hypot(o.light.x, o.light.y) > 1e-6 ? o.light : null;
  let litA: [number, number] | null = null;
  let litB: [number, number] | null = null;
  if (L) {
    const bb = boundsOf(B, o);
    const n = Math.hypot(L.x, L.y);
    const ux = L.x / n;
    const uy = L.y / n;
    const half = Math.abs(ux) * bb.w * 0.5 + Math.abs(uy) * bb.h * 0.5;
    const cx = bb.x + bb.w / 2;
    const cy = bb.y + bb.h / 2;
    litA = [cx + ux * half, cy + uy * half];
    litB = [cx - ux * half, cy - uy * half];
  }
  const floor = Math.max(0, Math.min(1, L?.floor ?? 0.12));
  let curM: M = [1, 0, 0, 1, 0, 0];
  const cutStyle = (): string | CanvasGradient => {
    if (!litA || !litB) return rim;
    const T = mMul(W, curM);
    const det = T[0] * T[3] - T[1] * T[2] || 1e-9;
    const toLocal = ([x, y]: [number, number]) => {
      const dx = x - T[4];
      const dy2 = y - T[5];
      return [(T[3] * dx - T[2] * dy2) / det, (-T[1] * dx + T[0] * dy2) / det];
    };
    const [ax, ay] = toLocal(litA);
    const [bx, by] = toLocal(litB);
    const g = c.createLinearGradient(ax, ay, bx, by);
    g.addColorStop(0, rim);
    g.addColorStop(0.35, withAlpha(rim, 0.35 + 0.65 * floor));
    g.addColorStop(1, withAlpha(rim, floor));
    return g;
  };
  const cuts = (cs: Cut[] | undefined) => {
    if (!cutsOn || !cs) return;
    const style = cutStyle();
    for (const ct of cs) {
      if (!allowed.has(ct.id) && !ct.id.startsWith('prop:')) continue;
      const a = (ct.alpha ?? 0.48) * cutAlpha;
      if (a <= 0) continue;
      c.globalAlpha = a;
      if (ct.mode === 'fill') {
        c.fillStyle = style;
        c.fill(ct.path);
      } else {
        c.strokeStyle = style;
        c.lineWidth = (ct.w ?? 1) / k;
        c.stroke(ct.path);
      }
    }
    c.globalAlpha = 1;
    c.fillStyle = ink;
  };
  const part = (m: M, art: { pieces: Path2D[]; cuts?: Cut[] }, withCuts = true) => {
    set(m);
    fill(art.pieces);
    if (withCuts) cuts(art.cuts);
  };

  c.fillStyle = ink;
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // secondary drivers: gravity + one twos-tick lag at 0.6 (bible §4.2)
  const prev = p.prev;
  const torsoNow = ang(p, 'torso');
  const torsoEff = prev ? lerp(torsoNow, ang(prev, 'torso'), 0.6) : torsoNow;
  const headWorld = (q: Pose) => ang(q, 'torso') + ang(q, 'neck') + ang(q, 'head');
  const headEff = prev ? lerp(headWorld(p), headWorld(prev), 0.6) : headWorld(p);
  const trail = Math.max(-7, Math.min(7, ((p.drift ?? 0) / Math.max(k, 0.1)) * 0.04));

  // typing loop drawing
  const loop = p.loop ?? Math.floor(env.tq * 6);

  // which hand holds the prop
  const prop = B.spec.prop && B.spec.prop !== 'none' ? propArt(B.spec.prop) : undefined;
  const hF: HandShape = p.handF ?? 'relaxed';
  const hB: HandShape = p.handB ?? 'relaxed';
  const pointy = B.spec.prop === 'chalk' || B.spec.prop === 'pen' || B.spec.prop === 'pipe';
  const canHold = (h: HandShape) => HOLDING_SHAPES.includes(h) || (pointy && (h === 'point' || h === 'chin'));
  const propHand: 'F' | 'B' | null = prop ? (canHold(hF) ? 'F' : canHold(hB) ? 'B' : null) : null;

  const drawHand = (wr: M, shape: HandShape, hasProp: boolean) => {
    const shp: HandShape = hasProp && shape === 'relaxed' ? 'grip' : shape;
    const ha = handArt(shp, B.handLen, loop);
    if (hasProp && prop) {
      let pm = mTranslate(wr, ha.socket[0], ha.socket[1]);
      if (prop.upright) pm = mRotate(pm, -angleOf(pm) * DEG);
      else if (B.spec.prop === 'book' || B.spec.prop === 'clipboard' || B.spec.prop === 'laptop' || B.spec.prop === 'papers') pm = mRotate(pm, -angleOf(pm) * 0.8 * DEG - 6 * DEG);
      set(pm);
      fill(prop.pieces);
      if (prop.lights.length) {
        c.fillStyle = mixLab(ink, rim, 0.75);
        c.globalAlpha = 1;
        for (const l of prop.lights) {
          c.globalAlpha = l.alpha;
          c.fill(l.path);
        }
        c.globalAlpha = 1;
        c.fillStyle = ink;
      }
      cuts(prop.cuts);
    }
    set(wr);
    fill(ha.pieces);
  };

  // 1. far leg
  part(R.hipB, B.legB.thigh, false);
  part(R.knB, B.legB.shin, false);
  part(R.anB, B.shoeB, false);
  // 2. far arm
  part(R.shB, B.armB.upper, false);
  part(R.elB, B.armB.fore, false);
  drawHand(R.wrB, hB, propHand === 'B');
  // 3. near leg
  part(R.hipF, B.legF.thigh);
  part(R.knF, B.legF.shin);
  part(R.anF, B.shoeF);
  // 4. hood / back extras live in the torso pieces; 5. torso
  const torso = B.torso[facing];
  part(R.torso, torso);
  if (torso.lights && cutsOn) {
    for (const l of torso.lights) {
      if (!allowed.has(l.id)) continue;
      c.globalAlpha = l.alpha * cutAlpha;
      c.fillStyle = rim;
      c.fill(l.path);
    }
    c.globalAlpha = 1;
    c.fillStyle = ink;
  }
  // 6. lower garment (per frame, lagging)
  if (B.w.lower) {
    const lagU = prev ? 0.35 : 0;
    const la = {
      torso: torsoNow,
      hipF: prev ? lerp(ang(p, 'hipF'), ang(prev, 'hipF'), lagU) : ang(p, 'hipF'),
      hipB: prev ? lerp(ang(p, 'hipB'), ang(prev, 'hipB'), lagU) : ang(p, 'hipB'),
    };
    const lp = lowerArt(B.b, B.w, la);
    if (lp) {
      set(R.root);
      c.fill(lp);
      cuts(lowerCuts(B.b, B.w, la, allowed));
    }
  }
  // 7. long hair / ponytail fall (behind the head, over the back)
  const fall = B.hair.fall;
  if (fall) {
    const pv = fall.pivot;
    const hx = (pv[0] - HEAD_PIVOT[0]) * B.b.head;
    const hy = (pv[1] - HEAD_PIVOT[1]) * B.b.head;
    const rot = -0.55 * headEff - trail * 0.6;
    const fm = mTranslate(mRotate(mTranslate(R.head, hx, hy), rot * DEG), -hx, -hy);
    part(fm, { pieces: fall.pieces, cuts: fall.cuts });
  }
  // 8. neck, head, hair, hat, glasses
  part(R.neck, B.neck);
  set(R.head);
  fill(B.head.pieces);
  const hs = B.spec.signature?.hairScale ?? 1;
  if (Math.abs(hs - 1) > 1e-3) {
    // hair mass grows about the crown (head-local): the signature reads at 64 px
    const hu = B.b.head;
    const cx = (0 - HEAD_PIVOT[0]) * hu;
    const cy = (-0.62 - HEAD_PIVOT[1]) * hu;
    set(mMul(R.head, [hs, 0, 0, hs, cx * (1 - hs), cy * (1 - hs)] as M));
    fill(B.hair.pieces);
    set(R.head);
  } else fill(B.hair.pieces);
  if (B.hat) fill(B.hat.pieces);
  if (B.head.lens) {
    const L = B.head.lens;
    c.fillStyle = mixLab(ink, rim, 0.42);
    c.fill(L.fill);
    c.strokeStyle = ink;
    c.lineWidth = L.frameW;
    c.stroke(L.frame);
    c.fillStyle = ink;
  }
  cuts(B.head.cuts);
  cuts(facing === 'left' && B.hair.cutsFacingLeft ? B.hair.cutsFacingLeft : B.hair.cuts);
  if (B.hat) cuts(B.hat.cuts);
  // 9. hanging extras on the chest (tie, strings, lanyard)
  for (const h of B.hangers) {
    const swing = Math.max(h.rest, torsoEff + trail);
    if (h.hiddenUnder && swing < 12) continue;
    const hm = mRotate(mTranslate(R.torso, h.pivot[0], h.pivot[1]), -swing * DEG);
    set(hm);
    fill(h.pieces);
    if (allowed.has(h.id)) cuts(h.cuts.map((ct) => ({ ...ct, id: h.id })));
  }
  // 10. near arm + hand + prop
  part(R.shF, B.armF.upper);
  part(R.elF, B.armF.fore);
  drawHand(R.wrF, hF, propHand === 'F');

  c.setTransform(base);
}

// ---------------------------------------------------------------- window-side contour rim
let rimMask: HTMLCanvasElement | null = null;
let rimOut: HTMLCanvasElement | null = null;
const fit = (cv: HTMLCanvasElement | null, w: number, h: number) => {
  if (!cv || cv.width < w || cv.height < h) return makeCanvas(Math.max(w, cv?.width ?? 0), Math.max(h, cv?.height ?? 0));
  return cv;
};
/** the figure, then a crescent cut on its contour facing o.edgeRim (mask minus the mask shifted away from it) */
function drawWithEdgeRim(B: Built, c: CanvasRenderingContext2D, o: PuppetDrawOpts, env: PaintEnv) {
  drawPuppet(B, c, o, env);
  const er = o.edgeRim!;
  const n = Math.hypot(er.x, er.y);
  if (n < 1e-6 || (er.alpha ?? 0.6) <= 0) return;
  const dev = (env.pxScale || 1.5) / 1.5;
  const off = (er.px ?? 1.5) * dev;
  const T = c.getTransform();
  const bb = boundsOf(B, o);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of [[bb.x, bb.y], [bb.x + bb.w, bb.y], [bb.x, bb.y + bb.h], [bb.x + bb.w, bb.y + bb.h]]) {
    const px = T.a * x + T.c * y + T.e;
    const py = T.b * x + T.d * y + T.f;
    x0 = Math.min(x0, px);
    y0 = Math.min(y0, py);
    x1 = Math.max(x1, px);
    y1 = Math.max(y1, py);
  }
  const pad = Math.ceil(off) + 4;
  x0 = Math.floor(x0) - pad;
  y0 = Math.floor(y0) - pad;
  const w = Math.ceil(x1) + pad - x0;
  const h = Math.ceil(y1) + pad - y0;
  if (w <= 0 || h <= 0 || w > 8192 || h > 8192) return;
  rimMask = fit(rimMask, w, h);
  rimOut = fit(rimOut, w, h);
  const m = rimMask.getContext('2d')!;
  m.setTransform(1, 0, 0, 1, 0, 0);
  m.clearRect(0, 0, w, h);
  m.setTransform(T.a, T.b, T.c, T.d, T.e - x0, T.f - y0);
  drawPuppet(B, m, { ...o, cutLines: false, ink: '#000' }, env);
  const r = rimOut.getContext('2d')!;
  r.setTransform(1, 0, 0, 1, 0, 0);
  r.globalCompositeOperation = 'source-over';
  r.clearRect(0, 0, w, h);
  r.drawImage(rimMask, 0, 0, w, h, 0, 0, w, h);
  r.globalCompositeOperation = 'source-in';
  r.fillStyle = env.fill('rim');
  r.fillRect(0, 0, w, h);
  r.globalCompositeOperation = 'destination-out';
  r.drawImage(rimMask, 0, 0, w, h, (-er.x / n) * off, (-er.y / n) * off, w, h);
  r.globalCompositeOperation = 'source-over';
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha *= Math.min(1, er.alpha ?? 0.6);
  c.drawImage(rimOut, 0, 0, w, h, x0, y0, w, h);
  c.restore();
}

function anchorOf(B: Built, o: PuppetDrawOpts, which: 'handF' | 'handB' | 'head' | 'eye'): { x: number; y: number } {
  const p = signed(B, o.pose);
  const { W, k } = worldM(B, o);
  const R = fk(B, p, rootDy(B, p, k));
  const at = (m: M, x: number, y: number) => mApply(mMul(W, m), x, y);
  const hp = HEAD_PIVOT;
  const hu = B.b.head;
  if (which === 'head') return at(R.head, (0.0 - hp[0]) * hu, (-0.55 - hp[1]) * hu);
  if (which === 'eye') return at(R.head, (0.33 - hp[0]) * hu, (-0.5 - hp[1]) * hu);
  const shape = (which === 'handF' ? p.handF : p.handB) ?? 'relaxed';
  const wr = which === 'handF' ? R.wrF : R.wrB;
  const L = B.handLen;
  const prop = B.spec.prop && B.spec.prop !== 'none' ? propArt(B.spec.prop) : undefined;
  if (prop && which === 'handF' && (HOLDING_SHAPES.includes(shape) || shape === 'point')) {
    const ha = handArt(shape === 'relaxed' ? 'grip' : shape, L);
    return at(wr, ha.socket[0] + prop.tip[0], ha.socket[1] + prop.tip[1]);
  }
  if (shape === 'point') return at(wr, 0.1 * L, 1.12 * L);
  if (shape === 'open') return at(wr, 0.05 * L, 0.95 * L);
  return at(wr, 0.03 * L, 0.55 * L);
}

function boundsOf(B: Built, o: PuppetDrawOpts) {
  const p = signed(B, o.pose);
  const { W, k } = worldM(B, o);
  const R = fk(B, p, rootDy(B, p, k));
  const hp = HEAD_PIVOT;
  const hu = B.b.head;
  const L = B.handLen;
  const pts: { x: number; y: number }[] = [];
  const add = (m: M, x: number, y: number) => pts.push(mApply(mMul(W, m), x, y));
  for (const [x, y] of [[-0.56, -0.6], [0.56, -0.35], [0.0, -1.12], [0.3, 0.3], [-0.6, 0.6]]) add(R.head, (x - hp[0]) * hu, (y - hp[1]) * hu);
  if (B.hat) add(R.head, (0 - hp[0]) * hu, (-1.3 - hp[1]) * hu);
  for (const [x, y] of [[-24, -100], [24, -70], [-22, 16], [20, 16]]) add(R.torso, x, y);
  for (const m of [R.wrF, R.wrB]) add(m, 0.1 * L, 1.15 * L);
  for (const m of [R.elF, R.elB, R.knF, R.knB]) add(m, 0, 0);
  for (const m of [R.anF, R.anB]) {
    add(m, -10, 8);
    add(m, 34, 8);
  }
  if (B.w.lower) {
    const h = B.w.lower.hem + 4;
    add(R.root, -24 - B.w.lower.flare, h);
    add(R.root, 22 + B.w.lower.flare, h);
  }
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const q of pts) {
    x0 = Math.min(x0, q.x);
    y0 = Math.min(y0, q.y);
    x1 = Math.max(x1, q.x);
    y1 = Math.max(y1, q.y);
  }
  const pad = 3 * k;
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}

export function createPuppet(spec: PuppetSpec): Puppet {
  const B = builtFor(spec);
  return {
    spec,
    draw: (c, o, env) => {
      // signature rim: a back-top contour cut (backlit cut-paper) unless the shot sets its own edgeRim
      const sr = spec.signature?.rim;
      if (!o.edgeRim && sr) {
        const back = o.facing === 'right' ? -0.55 : 0.55;
        o = { ...o, edgeRim: sr === true ? { x: back, y: -1, px: 1.6, alpha: 0.7 } : sr };
      }
      return o.edgeRim ? drawWithEdgeRim(B, c, o, env) : drawPuppet(B, c, o, env);
    },
    bounds: (o) => boundsOf(B, o),
    anchor: (o, which) => anchorOf(B, o, which),
  };
}

/** World heel/toe contact points of both feet at a pose (staging, stairs, QA of planted walks). */
export function feet(spec: PuppetSpec, o: PuppetDrawOpts): { F: { heel: { x: number; y: number }; toe: { x: number; y: number } }; B: { heel: { x: number; y: number }; toe: { x: number; y: number } } } {
  const B = builtFor(spec);
  const { W, k } = worldM(B, o);
  const R = fk(B, o.pose, rootDy(B, o.pose, k));
  const c = shoeContacts(B.w.shoes);
  const at = (m: M, q: [number, number]) => mApply(mMul(W, m), q[0], q[1]);
  return { F: { heel: at(R.anF, c.heel), toe: at(R.anF, c.toe) }, B: { heel: at(R.anB, c.heel), toe: at(R.anB, c.toe) } };
}

/** Seat height (stage px above the feet) for a puppet in a given sitting pose. */
export function seatHeight(spec: PuppetSpec, pose: Pose): number {
  const B = builtFor(spec);
  const k = spec.height / UNIT_H;
  const dy = groundDy(B, pose);
  const R = fk(B, pose, dy);
  // the underside of the thigh at mid-length
  const q = mApply(R.hipF, -13, B.b.thigh * 0.45);
  return -q.y * k;
}

/** A ready cast for galleries and tests: ten era characters, 1940s → 2020s. */
export const ERA_CAST: (PuppetSpec & { label: string })[] = [
  { label: '1940s', id: 'cast-40m', height: 312, build: 'average', era: '1940s', wardrobe: 'doubleBreasted', hair: 'slicked', hat: 'fedora', facialHair: 'moustache', prop: 'pipe', profile: { nose: 0.55, brow: 0.6, chin: 0.55, jaw: 0.6 } },
  { label: '1940s', id: 'cast-40f', height: 290, build: 'slight', era: '1940s', wardrobe: 'skirtSuit', hair: 'waves', prop: 'pen', profile: { nose: 0.3, brow: 0.2, chin: 0.45, jaw: 0.3 } },
  { label: '1950s', id: 'cast-50m', height: 318, build: 'tall', era: '1950s', wardrobe: 'labCoat', hair: 'crewCut', glasses: 'browline', prop: 'clipboard', profile: { nose: 0.45, brow: 0.55, chin: 0.6, jaw: 0.6 } },
  { label: '1950s', id: 'cast-50f', height: 288, build: 'average', era: '1950s', wardrobe: 'cardiganDress', hair: 'bun', prop: 'cards', profile: { nose: 0.4, brow: 0.25, chin: 0.4, jaw: 0.3 } },
  { label: '1960s', id: 'cast-60m', height: 306, build: 'stocky', era: '1960s', wardrobe: 'turtleneck', hair: 'bald', glasses: 'heavy', prop: 'chalk', profile: { nose: 0.6, brow: 0.5, chin: 0.45, jaw: 0.5 } },
  { label: '1970s', id: 'cast-70f', height: 296, build: 'slight', era: '1970s', wardrobe: 'blouseTrousers', hair: 'long', prop: 'mug', profile: { nose: 0.35, brow: 0.2, chin: 0.35, jaw: 0.25 } },
  { label: '1970s', id: 'cast-70m', height: 310, build: 'average', era: '1970s', wardrobe: 'sweaterVest', hair: 'shaggy', facialHair: 'fullBeard', glasses: 'rectangular', prop: 'papers', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 } },
  { label: '1980s', id: 'cast-80f', height: 292, build: 'average', era: '1980s', wardrobe: 'powerSuit', hair: 'perm', prop: 'book', profile: { nose: 0.35, brow: 0.25, chin: 0.45, jaw: 0.3 } },
  { label: '2010s', id: 'cast-10m', height: 314, build: 'average', era: '2010s', wardrobe: 'hoodie', hair: 'messy', facialHair: 'beard', glasses: 'rectangular', prop: 'laptop', profile: { nose: 0.5, brow: 0.45, chin: 0.5, jaw: 0.55 } },
  { label: '2020s', id: 'cast-20f', height: 294, build: 'average', era: '2020s', wardrobe: 'quarterZipF', hair: 'ponytail', glasses: 'round', prop: 'phone', profile: { nose: 0.4, brow: 0.2, chin: 0.4, jaw: 0.3 } },
];
