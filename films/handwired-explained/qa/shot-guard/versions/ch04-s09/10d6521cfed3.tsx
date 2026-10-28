/**
 * ch04-s09 — THE FALSE PROMISE (scene; parchment → candleAmber tint crossfade; crossfade in from ch04-s08; 25.2 s).
 * L0416 "Now break the promise: four and a half, down a wire tagged whole."
 * L0417 "Eleven again. A validator objects."
 * L0418 "As the docs put it, "Declarations are promises from the caller, not proofs.""
 * L0419 "Who tied it on? The caller. Who doubted it? The validator. How long it held? While the input stayed honest."
 *
 * The same bench, rig and wire as ch04-s08 (sets/ch04-s08-grid); over the first 3 s the lamp lowers the paper light to
 * a deeper amber. TEACHES, word by word (TE07; every value COMPUTED in FP32 by GRID):
 *   'break'      the narrator's hand sets the marble on the wire of a, right beside the 'grid 1' tag (beat push)
 *   'four … whole' the marble rolls along the tagged wire, DOWN its drop and along the rule to 4.5; board A reads a
 *                half (relu(5 − 4.5)), the copper thread carries it to board B, which reads a half too; the gate's
 *                panels stand half open
 *   'Eleven'     a 10 comes through pressed to a 5, a 12 to a 6; in the tray they fuse into 11, as in ch04-s06 (beat eleven)
 *   'validator'  a typed slip slides up from the foot of the frame, 'wire 0 must be a multiple of 1, got 4.5', and the
 *                machine's frame gives one sharp clack (a one-frame jolt) (beat validator)
 *   'Declarations' the camera travels up and left to tag 6 on the wire (the slip stays pinned at the foot of the
 *                frame); a short attribution sets in beside the tag: "promises from the caller, not proofs" — the docs
 *                (beat quote; verbatim substring of Q029)
 *   'caller'     the narrator's hand touches the knot where the tag was tied (beat caller)
 *   'doubted'    it turns the tag over; the red pencil (from the right) writes 'validator' on its back (beat flipTag)
 *   'honest'     the pencil is laid down beside the tag, without striking it (beat rest). Hold: the tag turning slowly.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, PaintEnv, Palette } from '../../../film';
import { cam3Interp, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { drawPencil, type ArmPose, type HandsPose, type Held, type Pt } from '../sets/narratorHands';
import { LAMP, PAPER, PAPER_INK, benchRoom, marble, nearEdge, nearPost, postCard, type RoomOpts } from '../sets/ch04-s06-bench';
import {
  BELT,
  G,
  GRID,
  beltThrow,
  copperLine,
  flightPos,
  gridReadings,
  gridRig,
  heroTile,
  linkRod,
  marbleOnPath,
  opsCounter,
  pathOfA,
  rangeCard,
  readmeRig,
  selectBelts,
  slabTile,
  tag6,
  tray,
  wireOfA,
  type RowSpec,
} from '../sets/ch04-s08-grid';

const ID = 'ch04-s09';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const HAND_S = 1.25;
const LEN = 118 * HAND_S;
const TS = G.TAG_S;
const A = 4.5;
const K_RANGE: Pt = { x: G.RANGE_X, y: G.WIRE.y };
const K_TAG: Pt = { x: G.TAG6_WIRE_X, y: G.WIRE.y };
const EYE: Pt = { x: K_TAG.x, y: K_TAG.y + 24 * TS };
/** the marble is set on the wire a little right of the tag's knot */
const P_START = 196;
const SLIP = 'wire 0 must be a multiple of 1, got 4.5';
/** where ch04-s08's camera ended (the crossfade lays rig over rig) */
const CAM0: Camera3 = { x: 670, y: 376, z: 60, lens: 1 };
/** at the rig for the false promise: far enough left that tag 6 ('grid 1', the subject of 'a wire tagged whole') and
 *  its README card sit wholly inside the frame, with the tray and the counter still in on the right */
const CAM_RIG: Camera3 = { x: 600, y: 344, z: 80, lens: 1 };
/** ch04-s08's card and counter positions (pulled in from the set's defaults) */
const CARD = { ...G.CARD, x: G.CARD.x - 120 };
const COUNTER = { x: G.COUNTER.x - 70, y: G.COUNTER.y + 28 };
/** the bench line under the tag at the closing camera (the L3 bench top seen from CAM_TAG's end), in L4 px */
const BENCH_L4 = 501;
const CAM_TAG: Camera3 = { x: 300, y: 384, z: 330, lens: 1 };

interface Beats {
  push: number;
  placeAt: number;
  rollAt: number;
  arrive: number;
  step10: number;
  step12: number;
  eleven: number;
  validator: number;
  quote: number;
  caller: number;
  touchIn: number;
  flipAt: number;
  flipEnd: number;
  writeAt: number;
  writeDur: number;
  rest: number;
  restAt: number;
}
const PLACE = 1.3;
const FLIP = 1.6;
const REST = 1.6;

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const push = T.beat('push');
    const eleven = T.beat('eleven');
    const rollAt = T.word('L0416', 'four') + 0.3;
    const arrive = T.word('L0416', 'tagged') - 0.1;
    const flipAt = T.beat('flipTag') - 0.5 * FLIP;
    // the pencil writes while the narrator says 'The validator'
    const w0 = T.word('L0419', 'The#2') - 0.15;
    const w1 = T.wordEnd('L0419', 'validator') + 0.05;
    const writeDur = (w1 - w0) / 0.45;
    const b: Beats = {
      push,
      placeAt: push - 0.5 * PLACE,
      rollAt,
      arrive,
      step10: arrive + 0.62,
      step12: arrive + 0.74,
      eleven,
      validator: T.beat('validator'),
      quote: T.beat('quote'),
      caller: T.beat('caller'),
      touchIn: T.beat('caller') - 0.75,
      flipAt,
      flipEnd: flipAt + FLIP,
      writeAt: w0 - 0.3 * writeDur,
      writeDur,
      rest: T.beat('rest'),
      restAt: T.beat('rest') - 0.5 * REST,
    };
    const cam = tl.channel<Camera3>('cam', CAM0, cam3Interp);
    tl.tween(cam, CAM_RIG, { at: rollAt - 0.6, dur: eleven - rollAt + 0.6, ease: ease.move });
    tl.tween(cam, CAM_TAG, { at: b.quote - 0.5, dur: 2.9, ease: ease.move });
    tl.tween(cam, { x: 292, y: 388, z: 352, lens: 1 }, { at: b.quote + 2.4, dur: D - b.quote - 2.4, ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b, D };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const cam = s.get(scene.cam);
    f.camera(cam);
    // the 3 s tint crossfade: the lamp lowers the paper light to a deeper amber
    const moodU = sm((t + 0.4) / 3.2);
    f.setMood('candleAmber', { from: 'parchment', u: moodU });
    const room: RoomOpts = { key: ID, from: 'parchment', to: 'candleAmber', u: moodU, sunX: 520 };
    benchRoom(f, room);
    f.practical({ x: LAMP.x, y: LAMP.y, kind: 'lamp', seed: LAMP.seed, intensity: 0.5 + 0.3 * moodU, radius: LAMP.radius, layer: 'L3' });
    f.fog({ yCenter: 540, height: 120, alpha: 0.12, drift: 8 });

    const hp = narratorPose(t, tq, b, cam);
    const pp = pencilPose(t, tq, b, cam);
    const st = machine(t, tq, b);
    // the validator's clack: the machine's frame jolts for one frame
    const jolt = t >= b.validator && t < b.validator + 1 / 24 ? 3 : t >= b.validator + 1 / 24 && t < b.validator + 2 / 24 ? -1 : 0;
    f.layer('L4', (c, env) => {
      copperLine(c, env);
      wireOfA(c, env, { glow: 0 });
      rangeCard(c, env, K_RANGE, { x: K_RANGE.x, y: K_RANGE.y + 16 }, { swing: 0.03 * Math.sin(tq * 1.7 + 0.7) });
      c.save();
      c.translate(0, jolt);
      readmeRig(c, env, { fold: 1 });
      gridRig(c, env, { show: 1, a: st.a, read: st.read, carry: st.carry });
      if (st.a !== undefined) {
        const R = gridReadings(st.a);
        linkRod(c, env, { x: R.bx, y: R.bTop });
      } else linkRod(c, env, { x: G.B.x0, y: G.BY - 6 - 4 - G.B.VB });
      selectBelts(c, env, t, st.rows, st.open, st.open12);
      trayTiles(c, env, t, tq, b);
      formulaCard(c, env, t, tq);
      opsCounter(c, env, { value: 2, spin: 1, x: COUNTER.x, y: COUNTER.y, id: `${ID}/ops` });
      c.restore();
      if (st.marble) marble(c, env, st.marble.x, st.marble.y, G.MARBLE_R, st.marble.x / G.MARBLE_R);
      drawTag(c, env, t, tq, b, hp);
      if (t >= b.quote - 0.2) attribution(c, env, t, b);
      // the pencil lying beside the tag once it has been laid down
      if (t >= b.rest) drawPencil(c, REST_AT, REST_ANGLE, 66, env);
      if (hp) hands.draw(c, hp, env, { heldDraw: (cc, at, held, e) => heldDraw(cc, e, at, held) });
      if (pp) hands.draw(c, pp, env);
    });
    f.rim({ x: 0, y: -1 });
    nearEdge(f, ID, room);
    nearPost(f, ID, room, 1186);
    // the lamp's falloff (as in ch04-s08): the right third of the room sinks
    const sc = f.c;
    sc.save();
    const fall = sc.createLinearGradient(700, 0, 1280, 0);
    fall.addColorStop(0, withAlpha(f.mood.ink, 0));
    fall.addColorStop(0.45, withAlpha(f.mood.ink, 0.1));
    fall.addColorStop(1, withAlpha(f.mood.ink, 0.2));
    sc.fillStyle = fall;
    sc.fillRect(700, 0, 580, 720);
    sc.restore();
    // the validator's slip, pinned at the foot of the frame (screen-locked)
    slip(f.c, f.mood, t, b);
  },
});

// ---------------------------------------------------------------- the machine
function machine(t: number, tq: number, b: Beats) {
  let marblePt: Pt | null = null;
  let a: number | undefined;
  let read = 0;
  let carry = 0;
  if (t >= b.push) {
    const p1 = pathOfA(A);
    let p = P_START;
    if (t >= b.rollAt) {
      // it gathers speed along the level wire and down the drop, then slows to rest on the rule
      const u = clamp01((t - b.rollAt) / (b.arrive - b.rollAt));
      p = lerp(P_START, p1, sm(u) * 0.6 + u * u * 0.4);
    }
    marblePt = marbleOnPath(p);
    if (t >= b.arrive) {
      a = A;
      read = win(t, b.arrive, b.arrive + 0.2);
      carry = win(t, b.arrive + 0.18, b.arrive + 0.38);
    }
  }
  // the gate goes from s08's last setting (bit 0: 12 open) to the half the bit now reads
  const bit = GRID.bit(A);
  const open = lerp(0, bit, win(tq, b.arrive + 0.38, b.arrive + 0.6));
  const open12 = lerp(1, 1 - bit, win(tq, b.arrive + 0.38, b.arrive + 0.6));
  const half = (v: number, o: number) => GRID.fmt(Math.fround(v * o));
  const rows: RowSpec[] = [
    { v: 10, y: G.Y10, steps: [b.step10], lab: [half(10, bit)], fr: [bit] },
    { v: 12, y: G.Y12, steps: [b.step12], lab: [half(12, 1 - bit)], fr: [1 - bit] },
  ];
  return { marble: marblePt, a, read, carry, open, open12, rows };
}

/** the tray: ch04-s08's last 12 slides off; the 5 and the 6 land and fuse into 11 on 'Eleven' */
function trayTiles(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  tray(c, env, G.TX, G.TY, G.TW, 30, G.BY);
  const old = win(t, 0.15, 0.75);
  if (old < 1) {
    c.save();
    c.globalAlpha *= 1 - sm((old - 0.55) / 0.45);
    heroTile(c, env, G.TX + old * (G.TW / 2 + 50), G.TY - 5 + sm((old - 0.5) / 0.5) * 50, '12', { s: G.TILE_S });
    c.restore();
  }
  const bit = GRID.bit(A);
  const x0 = G.SX + BELT.P - BELT.D0;
  const parts = [
    { lab: GRID.fmt(Math.fround(12 * (1 - bit))), fr: 1 - bit, y0: G.Y12, th: beltThrow([b.step12], 0, G.Y12), slot: G.TX - 30 },
    { lab: GRID.fmt(Math.fround(10 * bit)), fr: bit, y0: G.Y10, th: beltThrow([b.step10], 0, G.Y10), slot: G.TX + 30 },
  ];
  if (t < b.eleven) {
    for (const p of parts) {
      if (t < p.th.off) continue;
      const q = flightPos(t, p.th.off, p.y0, x0, p.slot);
      let x = q.x, y = q.y;
      if (t >= p.th.land) {
        const dt = tq - p.th.land;
        y = G.TY - 5 - (dt >= 0 && dt < 1 / 12 ? 4 : dt < 2 / 12 ? 1 : 0);
        x = lerp(p.slot, G.TX + (p.slot < G.TX ? -27 : 27), win(t, b.eleven - 0.2, b.eleven));
      }
      slabTile(c, env, x, y, p.lab, p.fr, { s: G.TILE_S });
    }
    return;
  }
  // the fused answer (COMPUTED: 11), a heavy clack on twos, catching the lamp
  const dt = tq - b.eleven;
  const y = G.TY - 5 - (dt < 1 / 12 ? 7 : dt < 2 / 12 ? 2 : 0);
  const glow = win(t, b.eleven - 0.05, b.eleven + 0.25) * (1 - 0.55 * win(t, b.eleven + 0.6, b.eleven + 1.8));
  heroTile(c, env, G.TX, y, GRID.fmt(GRID.result(A)), { s: G.TILE_S * 1.08, glow });
}

function formulaCard(c: C, env: PaintEnv, t: number, tq: number) {
  // the card stays from ch04-s08, leaving with the camera; it is unclipped as the tag scene takes over
  const card = CARD;
  postCard(c, env, {
    id: `${ID}/card`,
    x: card.x,
    y: card.y,
    w: card.w,
    h: card.h,
    paper: 1,
    swing: Math.sin(tq * 1.3) * 0.006,
    clipTo: { x: card.x + card.w / 2 + 30, y: -60 },
    size: 22,
    lead: 32,
    lines: [
      { text: 'ramp = relu(5 − a)', ink: 1 },
      { text: 'bit = relu(1 − ramp)', ink: 1 },
    ],
  });
  void t;
}

// ---------------------------------------------------------------- tag 6 on the wire
function tagFlip(t: number, b: Beats, hp: HandsPose | null): number {
  if (t < b.flipAt) return 0;
  if (hp && hp.flip !== undefined && t < b.flipEnd) return hp.flip;
  return 1;
}
function drawTag(c: C, env: PaintEnv, t: number, tq: number, b: Beats, hp: HandsPose | null) {
  const flip = tagFlip(t, b, hp);
  // the tag turns slowly on the wire in the closing hold; it kicks when it is touched and when it is turned
  const kick = Math.exp(-Math.max(0, tq - b.caller) * 2.4) * (tq >= b.caller ? 1 : 0) + Math.exp(-Math.max(0, tq - b.flipEnd) * 2) * (tq >= b.flipEnd ? 0.7 : 0);
  const late = win(t, b.rest, b.rest + 1.2);
  const swing = (0.018 + 0.03 * late) * Math.sin(tq * (1.7 - 0.6 * late) + 2.1) + 0.04 * kick * Math.sin(tq * 9);
  const backInk = pencilStroke(t, b);
  tag6(c, env, { knot: K_TAG, eye: EYE, grid: 1, flip, back: 'validator', backInk, swing, glow: 0.25 * win(t, b.quote, b.quote + 1) * (1 - win(t, b.caller, b.caller + 2)), id: `${ID}/tag6`, subject: true });
}
function heldDraw(c: C, env: PaintEnv, at: Pt, held: Held) {
  if (held === 'marble') marble(c, env, at.x, at.y + 6, G.MARBLE_R, 0);
}

/** the attribution beside the tag: the docs' words, on a small lamplit card (verbatim substring of Q029) */
function attribution(c: C, env: PaintEnv, t: number, b: Beats) {
  const inkAt = b.quote + 0.35;
  const paper = cardPaperAlpha(t, inkAt);
  if (paper <= 0.001) return;
  const x = 300, y = 318;
  c.save();
  const fs = legibleSize(c, `italic 500 26px ${FONT.display}`, 26);
  // the attribution is set in small caps: size it on its own (lower-case) glyphs so its caps clear the floor
  const fs2 = legibleSize(c, `500 18px ${FONT.sc}`, 18, '— the docs') * 1.05;
  const lines = ['“promises from the caller,', 'not proofs”'];
  c.font = `italic 500 ${fs}px ${FONT.display}`;
  const tw = Math.max(...lines.map((l) => c.measureText(l).width));
  const w = tw + 34, h = fs * 2.5 + fs2 * 1.5 + 18;
  const ink = cardInkAlpha(t, inkAt);
  c.globalAlpha *= paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.28);
  c.fillRect(x + 3, y + 4, w, h);
  c.fillStyle = mixLab(mixLab(PAPER, env.mood.halo, 0.25), env.mood.core, 0.12);
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, PAPER_INK, 0.4), 0.45);
  c.lineWidth = 1;
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  c.globalAlpha = 1;
  cardProbe(c, `${ID}/quote`, x, y, w, h, paper, ink * paper);
  textRole(c, 'subject', () => {
    c.fillStyle = withAlpha(PAPER_INK, ink * paper);
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.font = `italic 500 ${fs}px ${FONT.display}`;
    lines.forEach((l, i) => c.fillText(l, x + 16, y + 12 + fs * (0.95 + i * 1.12)));
    const a2 = win(t, inkAt + 0.5, inkAt + 0.9);
    c.font = `500 ${fs2}px ${FONT.sc}`;
    c.fillStyle = withAlpha(mixLab(PAPER_INK, '#8a4421', 0.5), a2 * paper);
    c.fillText('— the docs', x + 16, y + 12 + fs * 2.35 + fs2 * 0.9);
    textProbe(c, `${ID}/quote/l`, x + 16, y + 12, tw, fs * 2.2, ink * paper);
  });
  c.restore();
}

// ---------------------------------------------------------------- the validator's slip (screen-locked)
function slip(c: C, mood: Palette, t: number, b: Beats) {
  const inkAt = b.validator + 0.12;
  const paper = cardPaperAlpha(t, inkAt, 0.25);
  if (paper <= 0.001) return;
  const rise = 1 - sm((t - (b.validator - 0.2)) / 0.4);
  c.save();
  const size = legibleSize(c, `500 20px ${FONT.mono}`, 20);
  c.font = `500 ${size}px ${FONT.mono}`;
  const tw = c.measureText(SLIP).width;
  const w = tw + 40, h = size * 1.9;
  // pinned at the foot of the frame, lifted clear of the bench edge; as the camera climbs to the tag it slides right
  // so the tag and the pencil laid under it keep the left of the frame
  const slide = win(t, b.quote - 0.5, b.quote + 2.4);
  const x = lerp(640 - w / 2, 1220 - w, slide), y = 566 - h + rise * 110;
  c.globalAlpha = paper;
  // a soft dark plate under the slip so it reads off the ramp and the marble behind it
  const pad = 22;
  const g = c.createLinearGradient(0, y - pad, 0, y + h + pad);
  g.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0));
  g.addColorStop(0.3, withAlpha(PUPPET_NEAR_BLACK, 0.42));
  g.addColorStop(0.7, withAlpha(PUPPET_NEAR_BLACK, 0.42));
  g.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(x - pad, y - pad, w + pad * 2, h + pad * 2, pad);
  c.fill();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
  c.fillRect(x + 3, y + 4, w, h);
  c.fillStyle = mixLab(mixLab('#f1e8d4', mood.halo, 0.15), mood.core, 0.08);
  c.fillRect(x, y, w, h);
  // a torn top edge and a tractor-feed margin of holes (a typed line from a test run)
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18);
  for (let i = 0; i < 2; i++) {
    const sx = i === 0 ? x + 9 : x + w - 9;
    for (let yy = y + 8; yy < y + h - 4; yy += 11) {
      c.beginPath();
      c.arc(sx, yy, 2.2, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.globalAlpha = 1;
  const ink = cardInkAlpha(t, inkAt);
  cardProbe(c, `${ID}/slip`, x, y, w, h, paper, ink * paper);
  textRole(c, 'subject', () => {
    c.fillStyle = withAlpha('#1b1510', ink * paper);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillText(SLIP, x + 20, y + h / 2 + 1);
  });
  c.restore();
}

// ---------------------------------------------------------------- the hands
function mixArm(a: ArmPose, z: ArmPose, k: number): ArmPose {
  let da = z.angle - a.angle;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  const e = sm(k);
  return { ...(e < 0.5 ? a : z), wrist: { x: lerp(a.wrist.x, z.wrist.x, e), y: lerp(a.wrist.y, z.wrist.y, e) }, angle: a.angle + da * e, bend: lerp(a.bend ?? 0, z.bend ?? 0, e) };
}
/** the narrator: sets the marble on the wire ('break'); later touches the knot ('caller') and turns the tag over */
function narratorPose(t: number, tq: number, b: Beats, cam: Camera3): HandsPose | null {
  const entry = hands.entry(cam, 'L4');
  const o = { scale: HAND_S, entry };
  if (t >= b.placeAt && t < b.placeAt + PLACE) return hands.act('place', (tq - b.placeAt) / PLACE, marbleOnPath(P_START), { ...o, held: 'marble' });
  if (t >= b.touchIn && t < b.flipAt + 0.3 * FLIP) {
    // in from the lower left to the knot (a press of two fingers), hold, then down to the tag's corner
    const knotAt = { x: K_TAG.x - 4, y: K_TAG.y + 6 };
    const off = { x: entry.R.x + (knotAt.x - entry.R.x) * 0.3, y: entry.R.y + (knotAt.y - entry.R.y) * 0.3 };
    const press = hands.reach(entry.R, knotAt, 'press', LEN, { sleeve: 'linen', bend: -0.1 });
    const flipP = hands.act('flip', 0.3, FLIP_TARGET, o);
    let right: ArmPose;
    if (tq < b.caller) right = mixArm(hands.reach(entry.R, off, 'rest', LEN, { sleeve: 'linen' }), press, (tq - b.touchIn) / (b.caller - b.touchIn));
    else if (tq < b.caller + 0.5) right = press;
    else right = mixArm(press, flipP.right!, (tq - b.caller - 0.5) / (b.flipAt + 0.3 * FLIP - b.caller - 0.5));
    return { right, scale: HAND_S, presence: 1 };
  }
  if (t >= b.flipAt + 0.3 * FLIP && t < b.flipEnd) return hands.act('flip', (tq - b.flipAt) / FLIP, FLIP_TARGET, o);
  return null;
}
const FLIP_TARGET: Pt = { x: EYE.x, y: EYE.y + 40 };
/** where the red pencil is laid: flat on the bench plate under the tag, point toward it, set down, not striking */
const REST_AT: Pt = { x: EYE.x + 40, y: BENCH_L4 };
const REST_ANGLE = Math.PI * 0.5 + 0.16 - 1.5;

/** the red pencil (frame right): writes 'validator' on the tag's back, then is laid down beside it */
function pencilPose(t: number, tq: number, b: Beats, cam: Camera3): HandsPose | null {
  const entry = hands.entry(cam, 'L4').pencil;
  const fs = 15 * TS;
  const W = 60 * TS * 0.62;
  const line = { x: EYE.x, y: EYE.y + 30 * TS + fs * 0.9 };
  if (t >= b.writeAt && t < b.writeAt + b.writeDur) return hands.pencil('write', (tq - b.writeAt) / b.writeDur, line, { scale: HAND_S, entry, writeW: W });
  if (t >= b.restAt && t < b.restAt + REST) {
    const p = hands.pencil('rest', (tq - b.restAt) / REST, REST_AT, { scale: HAND_S, entry, restAngle: REST_ANGLE });
    return p;
  }
  return null;
}
function pencilStroke(t: number, b: Beats): number {
  if (t < b.writeAt) return 0;
  const u = (t - b.writeAt) / b.writeDur;
  return clamp01((u - 0.3) / 0.45);
}
