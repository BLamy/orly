/**
 * ch12-s02 — the paper garden at dusk: a person ranks two scrolls, a balance-scale judge tips, the shears snip a
 * small bush into a topiary while a vast hedge stands untrimmed, and the judges' ribbons go to the small one
 * (duskRose, 15.92 s, crossfade in from the simulation stage).
 *
 * Staging (sets/ch12-s02-garden): the labeller (generic, at a laptop, front left) has two scrolls of soft,
 * illegible text hanging side by side on a little rod-frame on her desk. Behind her the VAST HEDGE (tag 175B),
 * shaggy and untrimmed. At right a small bush in a pot. A parchment plate hangs from above at upper right.
 *   'rankings' the labeller ranks one scroll above the other (it rises on its hanger); the plate unfurls: the
 *              three steps as three garden tools on pegs: a gardener's sketch (people write example answers),
 *              a pair of balance scales (the judge, a reward model learned from the rankings), the shears
 *   'judge'    the scales tip toward the ranked scroll (a tiny scroll in the left pan)
 *   'shaped'   the shears lift off the plate by themselves and snip the bush; every later ranking tips the
 *              scales and brings one more snip: clippings fall, the bush becomes a clean two-ball topiary (1.3B)
 *   'preferred' the shears hang back on their peg; a row of anonymous judges rises behind the low box hedge and
 *              each pins a rosette on the small topiary; the result is typed at the foot of the plate
 *   'model'    the paper's own caveat beneath it, held through the music-only hold
 * Camera: a slow truck right and push (x 600 → 690, z 0 → 70), from the labeller toward the topiary; from 'preferred'
 * a slow push onto the plate's captions and the ribboned topiary (x 930, z 190), held to the cut.
 * TEXT RULE: the two captions on the plate (result, caveat) and the prop tags 175B / 1.3B only.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, PuppetSpec } from '../../../film';
import { CAMERA3_HOME, FONT, MOODS, POSES, PUPPET_NEAR_BLACK, blendPose, createPuppet, defineShot, loopPose, mixLab, withAlpha, withLife } from '../../../film';
import { chair } from '../../../film/silhouette/props';
import { cast } from '../cast';
import { GARDEN, clippings, gardenBack, gardenPlate, plateToWorld, plateXf, rosette, scalesArt, shearsArt, sketchArt, tag, topiary, topiaryPt } from '../sets/ch12-s02-garden';
import { LAYERS, toScreen } from '../../../film';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch02-s05b-util';

type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
const ID = 'ch12-s02';

const CAM0: Camera3 = { ...CAMERA3_HOME, x: 600, y: 360, z: 0 };
const CAM1: Camera3 = { x: 690, y: 372, z: 70, lens: 1 };
/** (round 1) the size comparison is spoken at L1205 ('a hundred times larger'): CAM1 shows the whole topiary AND the
 *  hedge with its 175B tag, and is HELD until L1205 ends. Only then a slow push (≈ +4.5%) settles the final hold on
 *  the topiary, the ribbons and the caveat, with the whole desk still in frame (no tangent at the left edge) */
const CAM3: Camera3 = { x: 668, y: 362, z: 88, lens: 1 };
const CAMS = [CAM0, CAM1, CAM3];

/** the anonymous judges (generic 2020s figures, varied cuts; no likenesses) */
const JUDGE_SPECS: PuppetSpec[] = [
  { id: 'judge-a', height: 300, build: 'average', era: '2020s', wardrobe: 'cardigan', hair: 'bob', facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.4, brow: 0.35, chin: 0.45, jaw: 0.35 }, prop: 'none', details: [] },
  { id: 'judge-b', height: 312, build: 'tall', era: '2020s', wardrobe: 'quarterZip', hair: 'crewCut', facialHair: 'none', glasses: 'rectangular', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 }, prop: 'none', details: [] },
  { id: 'judge-c', height: 296, build: 'slight', era: '2020s', wardrobe: 'tshirt:f', hair: 'ponytail', facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.42, brow: 0.3, chin: 0.42, jaw: 0.35 }, prop: 'none', details: [] },
  { id: 'judge-d', height: 306, build: 'stocky', era: '2020s', wardrobe: 'hoodie', hair: 'curly', facialHair: 'beard', glasses: 'none', hat: 'none', profile: { nose: 0.55, brow: 0.5, chin: 0.5, jaw: 0.55 }, prop: 'none', details: [] },
];
const JUDGES = JUDGE_SPECS.map((s) => createPuppet(s));
const JUDGE_X = [1004, 1082, 1160, 1238];
const JUDGE_FEET = 600;
const JUDGE_S = 0.6;
/** where each rosette lands on the topiary */
const SPOTS: Pt[] = [
  { x: 960, y: 470 },
  { x: 908, y: 506 },
  { x: 944, y: 372 },
  { x: 902, y: 448 },
].map(topiaryPt);
/** the shears' scale at the bush (the topiary is drawn at GARDEN.topiary.s) */
const SH_S = 1.12;

interface B {
  D: number;
  rank: number;
  judge: number;
  snip: number;
  preferred: number;
  caveat: number;
  /** the end of L1205 (the size comparison): the push waits for it */
  cmpEnd: number;
  /** ranking events and which scroll is ranked above */
  ranks: number[];
  ranked: number[];
  /** snip events (one per ranking) */
  snips: number[];
  shearsLift: number;
  shearsHome: number;
  pins: number[];
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const rank = T.beat('rank');
    const snip = T.beat('snip');
    const preferred = T.beat('preferred');
    const ranks = [rank, snip + 0.42, snip + 1.08, snip + 1.72, snip + 2.34];
    const snips = [snip, ...ranks.slice(1).map((r) => r + 0.38)];
    const b: B = {
      D,
      rank,
      judge: T.beat('judge'),
      snip,
      preferred,
      caveat: T.beat('caveat'),
      cmpEnd: T.line('L1205').end,
      ranks,
      ranked: [0, 1, 0, 0, 1],
      snips,
      shearsLift: snip - 0.72,
      shearsHome: Math.min(preferred - 1.0, snips[snips.length - 1] + 0.3),
      pins: [0, 1, 2, 3].map((k) => preferred - 0.36 + k * 0.42),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    const tq = tq12(t);
    const u = sm(t / (b.preferred - 0.3));
    const u2 = sm((t - b.cmpEnd - 0.1) / Math.max(1, b.D - 0.6 - b.cmpEnd));
    const c1: Camera3 = { x: lerp(CAM0.x, CAM1.x, u), y: lerp(CAM0.y, CAM1.y, u), z: lerp(CAM0.z, CAM1.z, u), lens: 1 };
    const cam: Camera3 = u2 > 0 ? { x: lerp(c1.x, CAM3.x, u2), y: lerp(c1.y, CAM3.y, u2), z: lerp(c1.z, CAM3.z, u2), lens: 1 } : c1;
    f.camera(cam);
    f.setMood('duskRose');
    gardenBack(f, { key: ID, cams: CAMS });
    // L3: the judges rise behind the low box hedge (they are hazed, anonymous, a step behind the action)
    f.layer('L3', (c, env) => judgesArt(c, env, b, tq));
    // L4: the action plane
    let snipsDone = 0;
    for (const s of b.snips) snipsDone += sm((t - s) / 0.16);
    const rough = clamp01(1 - snipsDone / b.snips.length);
    f.layer('L4', (c, env) => {
      topiary(c, env, rough, 1202);
      tag(c, env, GARDEN.topiary.x + 56, GARDEN.topiary.y - 96, '1.3B', -0.05, 26);
      for (let k = 0; k < b.pins.length; k++) rosette(c, env, SPOTS[k].x, SPOTS[k].y, win(t, b.pins[k] + 0.3, b.pins[k] + 0.4), k);
      clippings(c, env, t, b.snips, topiaryPt({ x: GARDEN.topiary.x, y: GARDEN.topiary.y - 230 }));
      deskAndLabeller(c, env, b, t, tq);
      plateAndTools(c, env, b, t, tq);
    });
    f.rim({ x: 0.2, y: -1 });
    // the laptop's faint screen glow on the labeller (a practical, low)
    f.practical({ x: 318, y: 548, kind: 'screen', seed: 1212, intensity: 0.22, radius: 24 });
    // rosettes in flight (L4, after the rim so they read as small bright accents)
    f.layer('L4', (c, env) => {
      for (let k = 0; k < b.pins.length; k++) {
        const v = (t - b.pins[k]) / 0.4;
        if (v <= 0 || v >= 1) continue;
        const hand = judgeHand(k, b, tq);
        const p = { x: lerp(hand.x, SPOTS[k].x, sm(v)), y: lerp(hand.y, SPOTS[k].y, sm(v)) - 50 * Math.sin(Math.PI * v) };
        rosette(c, env, p.x, p.y, 1, k);
      }
    });
    // L5: a near rose-bush silhouette at the lower-left corner and one at the right edge, blurred
    f.layer('L5', (c, env) => {
      const draw = f.cached(`${ID}/L5/${env.mood.id}`, 1800, 500, (cc) => {
        cc.translate(300, 0);
        cc.fillStyle = env.fill('fg');
        for (const [x0, w] of [[-260, 300], [1260, 360]] as const) {
          cc.beginPath();
          cc.moveTo(x0, 500);
          for (let i = 0; i <= 18; i++) {
            const x = x0 + (w * i) / 18;
            cc.lineTo(x, 300 + 80 * Math.abs(Math.sin(i * 0.9 + x0)) - (i > 3 && i < 15 ? 90 : 0));
          }
          cc.lineTo(x0 + w, 500);
          cc.closePath();
          cc.fill();
        }
      });
      draw(c, -300, 380);
    });
    // (round 1) the final hold resolves on the topiary, its ribbons and the caveat: the rest of the frame dims ≈ 15%
    const dim = sm((t - b.cmpEnd - 0.2) / 1.4);
    if (dim > 0) {
      const ctr = toScreen(LAYERS.L4, cam, GARDEN.topiary.x + 4, 330);
      const c = f.c;
      c.save();
      const g = c.createRadialGradient(ctr.x, ctr.y, 170, ctr.x, ctr.y, 560);
      g.addColorStop(0, withAlpha(MOODS.duskRose.fg, 0));
      g.addColorStop(1, withAlpha(MOODS.duskRose.fg, 0.17 * dim));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }
  },
});

// ================================================================================================ labeller + scrolls
const labeller = cast.labeller;
function labellerPose(b: B, tq: number): Pose {
  const typing = loopPose('type', POSES.type, tq);
  // on each ranking she reaches toward the scrolls (on twos), holds, returns
  let k = 0;
  for (const r of b.ranks) k = Math.max(k, win(tq, r - 0.42, r - 0.12) * (1 - win(tq, r + 0.32, r + 0.62)));
  const reach: Pose = { ...POSES.point, angles: { ...POSES.sit.angles, ...pick(POSES.point.angles), shoulderF: -62, elbowF: 18, wristF: 6, head: -6, neck: -4 }, handF: 'point', root: POSES.sit.root };
  const p = k > 0 ? blendPose(typing, reach, k) : typing;
  return withLife({ ...p, prev: p }, tq, 1204);
}
const pick = (a: Pose['angles']) => ({ shoulderF: a.shoulderF, elbowF: a.elbowF, wristF: a.wristF });

function deskAndLabeller(c: C, env: PaintEnv, b: B, t: number, tq: number) {
  const D = GARDEN.desk;
  const ink = env.fill('ink');
  // the desk: a small garden table, a slim slab on two legs
  c.fillStyle = ink;
  c.fillRect(D.x0, D.y, D.x1 - D.x0, 9);
  c.fillRect(D.x0 + 30, D.y + 9, 7, 140);
  c.fillRect(D.x1 - 40, D.y + 9, 7, 140);
  c.fillStyle = withAlpha(env.mood.rim, 0.3);
  c.fillRect(D.x0, D.y - 0.5, D.x1 - D.x0, 1.2);
  // the laptop (side view: base and lid)
  c.fillStyle = ink;
  c.fillRect(270, D.y - 5, 88, 5);
  c.beginPath();
  c.moveTo(354, D.y - 4);
  c.lineTo(362, D.y - 4);
  c.lineTo(346, D.y - 70);
  c.lineTo(339, D.y - 69);
  c.closePath();
  c.fill();
  // the rod-frame with the two scrolls
  const R = GARDEN.scrollRod;
  c.fillRect(R.x0 - 4, R.y - 4, 4, D.y - R.y + 4);
  c.fillRect(R.x1, R.y - 4, 4, D.y - R.y + 4);
  c.fillRect(R.x0 - 8, R.y - 6, R.x1 - R.x0 + 16, 4);
  for (let i = 0; i < 2; i++) scroll(c, env, b, t, tq, i);
  // the chair and the labeller (strict right-facing profile, near-black, window-side rim)
  chair(c, { x: GARDEN.labeller.x - 28, y: GARDEN.labeller.y, s: 0.95, style: 'swivel', view: 'side' }, env);
  labeller.draw(c, {
    x: GARDEN.labeller.x,
    y: GARDEN.labeller.y,
    facing: 'right',
    pose: labellerPose(b, tq),
    scale: GARDEN.labeller.s,
    ink: PUPPET_NEAR_BLACK,
    light: { x: 1, y: -0.6, floor: 0.2 },
    edgeRim: { x: 1, y: -0.8, px: 1.6 },
  }, env);
}

/** which ranking is current at tq (−1 before the first) */
function currentRank(b: B, tq: number) {
  let k = -1;
  for (let i = 0; i < b.ranks.length; i++) if (tq >= b.ranks[i] - 0.05) k = i;
  return k;
}

function scroll(c: C, env: PaintEnv, b: B, t: number, tq: number, i: number) {
  const S = GARDEN.scrolls[i];
  const R = GARDEN.scrollRod;
  const k = currentRank(b, tq);
  // the ranked scroll rises on its hanger and stays up until the next pair arrives (a quick roll-and-drop)
  let lift = 0;
  let swap = 0;
  if (k >= 0 && b.ranked[k] === i) {
    const next = b.ranks[k + 1] ?? Infinity;
    lift = 30 * sm((tq - b.ranks[k] + 0.05) / 0.25) * (1 - sm((tq - next + 0.32) / 0.2));
  }
  for (let j = 1; j < b.ranks.length; j++) swap = Math.max(swap, 1 - Math.abs(tq - (b.ranks[j] - 0.2)) / 0.16);
  const h = GARDEN.scrollH * (1 - 0.7 * clamp01(swap));
  const top = R.y - lift;
  const m = env.mood;
  const paper = mixLab(MOODS.parchment.sky[1], m.halo, 0.25);
  c.save();
  // cords from the rod
  c.strokeStyle = withAlpha(env.fill('ink'), 0.8);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(S.x - S.w / 2 + 6, R.y - 2);
  c.lineTo(S.x - S.w / 2 + 6, top + 2);
  c.moveTo(S.x + S.w / 2 - 6, R.y - 2);
  c.lineTo(S.x + S.w / 2 - 6, top + 2);
  c.stroke();
  c.fillStyle = paper;
  c.fillRect(S.x - S.w / 2, top + 4, S.w, h);
  // soft, illegible lines of text (blurred strokes)
  c.fillStyle = withAlpha(MOODS.parchment.ink, 0.32);
  for (let l = 0; l < 11; l++) {
    const y = top + 16 + l * 12;
    if (y > top + h - 6) break;
    const w = (S.w - 16) * (0.55 + 0.45 * Math.abs(Math.sin(l * 2.3 + i * 1.7 + (k + 1) * 0.9)));
    c.fillRect(S.x - S.w / 2 + 8, y, w, 3);
  }
  // rollers top and bottom
  c.fillStyle = env.fill('ink');
  c.fillRect(S.x - S.w / 2 - 5, top, S.w + 10, 6);
  c.fillRect(S.x - S.w / 2 - 5, top + 4 + h, S.w + 10, 7);
  // (round 1) the ranked one gets a bold ink TICK, drawn on in 0.16 s as the ranking lands (the beat the snip answers)
  if (lift > 1 && k >= 0) {
    const d = clamp01((tq - b.ranks[k] + 0.02) / 0.16);
    const P0 = { x: S.x - 16, y: top + 34 }, P1 = { x: S.x - 4, y: top + 48 }, P2 = { x: S.x + 22, y: top + 14 };
    c.strokeStyle = withAlpha(MOODS.parchment.ink, 0.92);
    c.lineWidth = 4.2;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(P0.x, P0.y);
    const a1 = clamp01(d / 0.35);
    c.lineTo(lerp(P0.x, P1.x, a1), lerp(P0.y, P1.y, a1));
    if (d > 0.35) {
      const a2 = clamp01((d - 0.35) / 0.65);
      c.lineTo(lerp(P1.x, P2.x, a2), lerp(P1.y, P2.y, a2));
    }
    c.stroke();
  }
  c.restore();
  void t;
}

// ================================================================================================ the plate + tools
function plateAndTools(c: C, env: PaintEnv, b: B, t: number, tq: number) {
  const open = sm((tq - (b.rank - 0.15)) / 0.6);
  gardenPlate(c, env, open);
  if (open < 0.6) return;
  const toolA = win(t, b.rank + 0.2, b.rank + 0.6);
  const P = GARDEN.pegs;
  const PM = MOODS.parchment;
  const R = GARDEN.plate;
  const tip = scaleTip(b, tq);
  c.save();
  plateXf(c);
  c.globalAlpha *= toolA;
  // pegs
  c.fillStyle = env.fill('ink');
  for (const p of P) {
    c.beginPath();
    c.arc(p.x, p.y, 4, 0, Math.PI * 2);
    c.fill();
  }
  sketchArt(c, env, P[0].x, P[0].y);
  // the scales: tip toward the ranked scroll on each judgement (damped, on twos)
  scalesArt(c, env, P[1].x, P[1].y, tip, win(tq, b.judge - 0.2, b.judge + 0.1));
  // the order of the method as cut-paper pips under the pegs (one, two, three dots: a picture, not lettering)
  c.fillStyle = withAlpha(PM.ink, 0.55);
  for (let i = 0; i < 3; i++) {
    for (let d = 0; d <= i; d++) {
      c.beginPath();
      c.arc(P[i].x + (d - i / 2) * 11, R.y + 150, 3, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
  // the shears: on their peg, then flying on their own to the bush, snipping, and home again
  const sh = shearsAt(b, t, tq);
  // (round 1) no tether: the shears move on their own, leaving only a faint dotted flight trail (≤ 0.4 s)
  flightTrail(c, env, b, t, sh);
  shearsArt(c, env, sh.x, sh.y, sh.s, sh.rot, sh.open);
  // the captions at the foot of the plate (ink on parchment)
  const a1 = win(t, b.preferred - 0.05, b.preferred + 0.45);
  const a2 = win(t, b.caveat - 0.05, b.caveat + 0.5);
  c.save();
  plateXf(c);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  const cx = R.x + R.w / 2;
  if (a1 > 0) {
    c.globalAlpha = a1;
    c.fillStyle = withAlpha(PM.ink, 0.95);
    c.font = `600 23px ${FONT.display}`;
    c.fillText('1.3B InstructGPT preferred to 175B GPT-3', cx, R.y + 184);
    // (round 1) the source line above the legibility floor (plate drawn 1.12×: ≈ 25 px cap height at 1080p)
    c.font = `500 21px ${FONT.mono}`;
    c.fillStyle = withAlpha(PM.ink, 0.82);
    c.fillText('Ouyang et al. (OpenAI) · March 2022', cx, R.y + 207);
  }
  if (a2 > 0) {
    c.globalAlpha = a2;
    c.fillStyle = withAlpha(PM.ink, 0.55);
    c.fillRect(cx - 110, R.y + 216, 220, 0.9);
    c.fillStyle = withAlpha(PM.ink, 0.92);
    c.font = `500 22px ${FONT.text}`;
    c.fillText('labellers agreed with each other', cx, R.y + 239);
    c.fillText('about 73% of the time', cx, R.y + 261);
  }
  c.restore();
}

/** a faint dotted trail behind the flying shears: where they were over the last 0.4 s (on twos), fading out */
function flightTrail(c: C, env: PaintEnv, b: B, t: number, sh: { x: number; y: number }) {
  if (t < b.shearsLift || t > b.shearsHome + 1.0) return;
  c.save();
  c.fillStyle = mixLab(env.mood.rim, env.mood.halo, 0.4);
  for (let j = 1; j <= 8; j++) {
    const dt = j * 0.05;
    const tp = t - dt;
    const q = shearsAt(b, tp, tq12(tp));
    if (Math.hypot(q.x - sh.x, q.y - sh.y) < 10 * j * 0.6) continue;
    c.globalAlpha = 0.42 * (1 - dt / 0.4);
    c.beginPath();
    c.arc(q.x, q.y, 2.1, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** the beam's tilt: + = left pan down (toward the left scroll); a damped swing to each new judgement */
function scaleTip(b: B, tq: number): number {
  const times = [b.judge, ...b.ranks.slice(1).map((r) => r + 0.12)];
  let prev = 0;
  let tip = 0;
  for (let i = 0; i < times.length; i++) {
    if (tq < times[i]) break;
    const target = b.ranked[i] === 0 ? 0.26 : -0.26; // (round 1) ≈ 15°, with a visible overshoot and settle
    const d = tq - times[i];
    tip = target + (prev - target) * Math.exp(-d * 4) * Math.cos(d * 9);
    prev = target;
  }
  return tip;
}

function shearsAt(b: B, t: number, tq: number): { x: number; y: number; s: number; rot: number; open: number } {
  const hp = plateToWorld({ x: GARDEN.pegs[2].x - 4, y: GARDEN.pegs[2].y + 66 });
  const home = { x: hp.x, y: hp.y, s: 0.95, rot: Math.PI / 2 + 0.12 + GARDEN.plate.tilt, open: 0.45 };
  if (tq < b.shearsLift) return home;
  // snip spots around the bush, one per snip
  const spots: Pt[] = [
    { x: 1004, y: 452 },
    { x: 860, y: 520 },
    { x: 990, y: 372 },
    { x: 874, y: 394 },
    { x: 1010, y: 540 },
  ].map(topiaryPt);
  const T0 = b.shearsLift;
  const s0 = b.snips[0];
  const flyIn = (u: number) => {
    const p = { x: lerp(home.x, spots[0].x + 24, sm(u)), y: lerp(home.y, spots[0].y, sm(u)) - 60 * Math.sin(Math.PI * u) };
    return { ...p, s: lerp(home.s, SH_S, sm(u)), rot: lerp(home.rot, Math.PI - 0.45, sm(u)), open: 0.9 * sm(u) };
  };
  if (tq < s0 - 0.08) return flyIn((tq - T0) / (s0 - 0.08 - T0));
  // between snips: move to the next spot with blades open, close sharply on the snip (on twos)
  for (let k = 0; k < b.snips.length; k++) {
    const sk = b.snips[k];
    const next = b.snips[k + 1];
    const end = next ?? b.shearsHome;
    if (tq < end || k === b.snips.length - 1) {
      const from = spots[k];
      const to = next !== undefined ? spots[k + 1] : null;
      const close = 1 - sm((tq - sk + 0.08) / 0.08);
      if (!to) {
        // the last snip, then home to the peg
        const v = clamp01((tq - b.shearsHome) / 0.6);
        if (tq < b.shearsHome) return { x: from.x + 24, y: from.y, s: SH_S, rot: Math.PI - 0.45, open: tq < sk ? 0.9 : 0.9 * sm((tq - sk - 0.1) / 0.15) * 0.4 };
        return { x: lerp(from.x + 24, home.x, sm(v)), y: lerp(from.y, home.y, sm(v)) - 50 * Math.sin(Math.PI * v), s: lerp(SH_S, home.s, sm(v)), rot: lerp(Math.PI - 0.45, home.rot + Math.PI * 2, sm(v)), open: 0.35 * (1 - v) };
      }
      if (tq < sk + 0.12) return { x: from.x + 24, y: from.y, s: SH_S, rot: Math.PI - 0.45, open: 0.9 * clamp01(close) };
      const v = clamp01((tq - sk - 0.12) / Math.max(0.1, end - sk - 0.2));
      return { x: lerp(from.x, to.x, sm(v)) + 24, y: lerp(from.y, to.y, sm(v)), s: SH_S, rot: Math.PI - 0.45 + 0.25 * Math.sin(Math.PI * v), open: 0.9 * sm(v * 2) };
    }
  }
  void t;
  return home;
}

// ================================================================================================ the judges
function judgeHand(k: number, b: B, tq: number): Pt {
  const p = judgePose(k, b, tq);
  return JUDGES[k].anchor({ x: JUDGE_X[k], y: judgeY(k, b, tq), facing: 'left', pose: p, scale: JUDGE_S }, 'handF');
}
function judgeY(k: number, b: B, tq: number) {
  const rise = sm((tq - (b.preferred - 1.15 + k * 0.1)) / 0.5);
  return JUDGE_FEET + 170 * (1 - rise);
}
function judgePose(k: number, b: B, tq: number): Pose {
  const give = win(tq, b.pins[k] - 0.25, b.pins[k] + 0.05) * (1 - win(tq, b.pins[k] + 0.6, b.pins[k] + 0.9));
  const base = POSES.stand;
  const reach: Pose = { ...base, angles: { ...base.angles, shoulderF: -78, elbowF: 12, wristF: 4, torso: 4 }, handF: 'pinch' };
  const p = give > 0 ? blendPose(base, reach, give) : base;
  return withLife({ ...p, prev: p }, tq, 1220 + k * 7);
}
function judgesArt(c: C, env: PaintEnv, b: B, tq: number) {
  if (tq < b.preferred - 1.2) return;
  for (let k = JUDGES.length - 1; k >= 0; k--) {
    JUDGES[k].draw(c, { x: JUDGE_X[k], y: judgeY(k, b, tq), facing: 'left', pose: judgePose(k, b, tq), scale: JUDGE_S, light: { x: -0.4, y: -1, floor: 0.3 } }, env);
  }
  // the box hedge in front of their legs is part of the cached L3 (drawn before): redraw its top band over them
  const J = GARDEN.jury;
  c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.3);
  c.fillRect(J.x0, J.y + 2, J.x1 - J.x0, 200);
  c.fillStyle = withAlpha(env.mood.rim, 0.2);
  c.fillRect(J.x0, J.y + 1, J.x1 - J.x0, 1.2);
}
