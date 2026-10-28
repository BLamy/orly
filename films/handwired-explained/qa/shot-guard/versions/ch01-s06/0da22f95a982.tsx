/**
 * ch01-s06 — TWO RAMPS AND A LEVER (plate, parchment; inkBleed in from the tag line; 21.1 s on the locked clock).
 * L0108 "A scrap of JavaScript a child could check. If a is more than four, ten. If not, twelve."
 * L0109 "Build it from ramps, the stuff of neural networks. Five gives ten; three, twelve."
 * L0110 "Give it four and a half." (1.8 s of silence)   L0111 "Eleven. Neither ten nor twelve."
 *
 * A lamp-lit parchment plate pinned behind the workbench (L2) carries the README's line in monospace across its top
 * (a sharp ink layer at the plate's depth). In front of it, at L4, the DEEP DIVE I machine (sets/rampBench): a floor
 * rule with unnumbered integer ticks, board one hinged at 4, board two at 5, the lever that reads the difference of
 * their heights (it can only rest between 0 and 1), and an output housing whose slot feeds a tray. Behind the boards, in the
 * L3 haze, the two belts run the whole shot, dim and unreadable (they are explained in ch04-s04). L5 is the near
 * bench edge, L6 the workshop's near post at frame right.
 *
 * TEACHES, word by word (every number the machine shows is COMPUTED by rampBench's FP32 maths, RB.result):
 *   plate (0.3)        the code line inks in, left to right
 *   check              a warm kick of lamplight runs along the code line
 *   'a … four'         a pencil underline grows under (a > 4); 'ten' under 10; 'not … twelve' under 12
 *   ramps              floor rule, boards, lever, housing and tray rise out of the plate (through a slot under the rule)
 *   (after ramps)      the narrator's hand sets the brass marble on the rule at 3.5 (lever reads 0)
 *   Five               the marble rolls to 5: board one stands a whole unit above board two, the lever swings fully
 *                      up as the marble crosses 4 → 5, and a 10 tile shoots out of the slot on 'ten' (clack)
 *   three              the 10 slides off the tray; the marble rolls back to 3, the lever falls to 0, a 12 drops on
 *                      'twelve' (clack)
 *   Give … half        the hand lifts the marble and sets it at 4.5, exactly between the hinges ('half' = release);
 *                      the lever stops halfway and trembles; the 12 slides off
 *   clack (silence)    a tile creeps half out of the slot, waits, and lands with one heavy clack: 11, the computed
 *                      0.5 × 10 + 0.5 × 12
 *   Eleven             the 11 catches the rim light and the plate inks its one result line: a = 4.5 → 11
 * Camera: locked off; a 3 % push across L0110 and the silence. Text: the code line and the result line only; the
 * 10 / 12 / 11 tiles are props; nothing names the boards, lever, belts or tray.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, cam3Interp, defineShot, hash1, mixLab, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { RB, belts, rampBench, tile } from '../sets/rampBench';

const ID = 'ch01-s06';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- geometry (L4 rest px)
/** the machine: rampBench's a = 4.5 point at BX, the floor rule at BY, scale S (209 px per unit) */
const BX = 522;
const BY = 598;
const S = 1.9;
const DOMAIN: [number, number] = [2.9, 5.6];
const xOf = (a: number) => RB.xOf({ x: BX, s: S }, a);
const X1 = xOf(DOMAIN[1]);
/** the lever pivot (rampBench: x1 + 70 s, y − 80 s) */
const LX = X1 + 70 * S;
const LY = BY - 80 * S;
/** the output housing at the lever's foot (tiles slide out of its slot) and the tray beside it */
const BOX = { x0: LX - 36, x1: LX + 46, top: BY - 92 };
const TRAY = { x0: BOX.x1, x1: BOX.x1 + 176 };
const TX = (TRAY.x0 + TRAY.x1) / 2 - 6;
const TILE_S = 2.0;
const MARBLE_R = 8 * S;
const HAND_S = 1.6;
/** the plate's ink layer: the plate's depth, but sharp (the type must read) */
const PLATE_INK: LayerSpec = { id: 'L2ink', z: LAYERS.L2.z, haze: 0.04, blur: 0 };
const CODE = 'const result = (a > 4) ? 10 : 12';
const CODE_Y = 104;
const CODE_PX = 38;
const RESULT_Y = 170;

// ---------------------------------------------------------------- the computed answers (FP32, rampBench maths)
const A_FIVE = 5;
const A_THREE = 3;
const A_HALF = 4.5;
const A_START = 3.5;
const OUT = {
  five: RB.fmt(RB.result(A_FIVE)),
  three: RB.fmt(RB.result(A_THREE)),
  half: RB.fmt(RB.result(A_HALF)),
};
const RESULT_LINE = `a = ${RB.fmt(A_HALF)} → ${OUT.half}`;

interface Beats {
  plate: number;
  check: number;
  ulA: [number, number];
  ulTen: number;
  ulTwelve: [number, number];
  ulOut: number;
  ramps: number;
  placeAt: number;
  rollFive: [number, number];
  tenDrop: number;
  tenOff: number;
  rollThree: [number, number];
  twelveDrop: number;
  liftAt: number;
  liftDur: number;
  twelveOff: number;
  half: number;
  clack: number;
  eleven: number;
  neither: number;
  pushAt: number;
  pushEnd: number;
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const half = T.beat('half');
    const liftDur = 2.5;
    const b: Beats = {
      plate: T.beat('plate'),
      check: T.beat('check'),
      // 'If a is more than four': the underline grows under (a > 4) from 'a' to the end of 'four'
      ulA: [T.word('L0108', 9) - 0.12, T.wordEnd('L0108', 'four')],
      ulTen: T.word('L0108', 'ten') - 0.1,
      // 'If not, twelve': under 12 from 'not' to 'twelve'
      ulTwelve: [T.word('L0108', 'not') - 0.05, T.wordEnd('L0108', 'twelve')],
      ulOut: T.line('L0108').end + 0.35,
      ramps: T.beat('ramps') - 0.15,
      placeAt: T.beat('ramps') + 0.95,
      // the marble arrives at 5 a beat before 'ten' (the lever is up as the tile falls)
      rollFive: [T.beat('five') - 0.12, T.word('L0109', 'gives') + 0.05],
      tenDrop: T.word('L0109', 'ten'),
      tenOff: T.beat('three') - 0.22,
      rollThree: [T.beat('three') - 0.05, T.word('L0109', 'twelve') - 0.1],
      twelveDrop: T.word('L0109', 'twelve') + 0.02,
      // the lift lets the marble go ('released' at u = .62) on 'half'
      liftAt: half - 0.62 * liftDur,
      liftDur,
      twelveOff: half - 0.62 * liftDur + 0.5,
      half,
      clack: T.beat('clack'),
      eleven: T.beat('eleven'),
      neither: T.word('L0111', 'Neither'),
      pushAt: T.line('L0110').start - 0.2,
      pushEnd: Math.min(D - 0.5, T.beat('eleven') + 0.6),
    };
    const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
    tl.tween(cam, { ...CAMERA3_HOME, z: 30, y: CAMERA3_HOME.y + 6 }, { at: b.pushAt, dur: b.pushEnd - b.pushAt, ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b, D };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const cam = s.get(scene.cam);
    f.camera(cam);
    f.backlight({ sunX: 560, sunY: 250, intensity: 1 });

    // ---------- L2: the plate pinned behind the bench (cached)
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 1480, 860, (cc) => {
        cc.translate(100, 70);
        plateBack(cc, env);
      })(c, -100, -70);
    });

    // ---------- the plate's ink: the README's line, its pencil underlines, and the one result line
    f.layer(PLATE_INK, (c, env) => plateInk(c, env, t, b));
    f.fog({ yCenter: 300, height: 260, alpha: 0.16, drift: 6 });

    // ---------- L3: the two belts, dim in the haze (never stopping; not explained here)
    const aNow = marbleA(tq, b);
    f.layer('L3', (c, env) => {
      c.save();
      c.globalAlpha = 0.3 + 0.2 * win(t, b.ramps, b.ramps + 1.4);
      belts(c, env, { x: 760, y: 252, s: 0.8, phase: t * 0.55, bit: RB.above4(Math.max(0, aNow.lever)), dim: true, len: 1080 });
      c.restore();
    });
    f.fog('B');

    // ---------- L4: the machine
    const rise = win(tq, b.ramps, b.ramps + 1.2);
    const leverIn = win(tq, b.ramps + 0.4, b.ramps + 1.5);
    const tremble = aNow.onRule && aNow.lever > 4 && aNow.lever < 5 ? 1 - win(t, b.clack - 0.05, b.clack + 0.3) : 0;
    f.layer('L4', (c, env) => {
      if (rise <= 0) return;
      c.save();
      // the machine rises out of the plate through a slot under the floor rule
      c.beginPath();
      c.rect(-200, -200, 1700, BY + 12 + 200);
      c.clip();
      c.globalAlpha = sm(rise * 1.5);
      // boards, rule and lever (the marble is drawn by rampBench only while it sits on the rule)
      rampBench(c, env, {
        x: BX,
        y: BY,
        s: S,
        a: aNow.onRule ? aNow.lever : -1e4,
        domain: DOMAIN,
        boards: 2,
        rise,
        lever: leverIn > 0.02,
        tremble,
        tq,
        tray: false,
      });
      // the output housing at the lever's foot, the tray, and the tiles that slide out of the housing's slot
      c.translate(0, (1 - leverIn) * 140);
      tray(c, env);
      tiles(c, env, t, tq, b);
      housing(c, env);
      c.restore();
    });
    f.rim({ x: -0.3, y: -1 });
    // the lamp over the plate (a practical behind the action plane: its pool on the paper)
    f.practical({ x: 600, y: -40, kind: 'lamp', seed: 61, intensity: 0.4, radius: 150, layer: 'L2' });

    // ---------- L5: the near bench edge (blurred)
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 1700, 300, (cc) => {
        cc.translate(220, -560);
        benchEdge(cc, env);
      })(c, -220, 560);
    });
    // the narrator's hand over the bench edge (L4, so the marble lands without parallax slip)
    const hp = handPose(t, tq, b, cam);
    if (hp) f.layer('L4', (c, env) => hands.draw(c, hp, env));
    // ---------- L6: the workshop's near post at frame right (no pencil yet: it first appears in ch01-s07)
    f.layer('L6', (c, env) => {
      f.cached(`${ID}/L6/${env.mood.id}`, 260, 1000, (cc) => {
        cc.translate(-1100, 60);
        nearPost(cc, env);
      })(c, 1100, -60);
    });
  },
});

// ---------------------------------------------------------------- the marble's story (pure, on twos)
/** where the marble is: lever = the a the machine reads; onRule = it sits on the rule (else it is in the hand) */
function marbleA(t: number, b: Beats): { lever: number; onRule: boolean } {
  const placed = b.placeAt + 0.5 * 1.5;
  if (t < placed) return { lever: -1e4, onRule: false };
  if (t < b.rollFive[0]) return { lever: A_START, onRule: true };
  if (t < b.rollThree[0]) return { lever: lerp(A_START, A_FIVE, roll(t, b.rollFive)), onRule: true };
  const lifted = b.liftAt + 0.36 * b.liftDur;
  if (t < lifted) return { lever: lerp(A_FIVE, A_THREE, roll(t, b.rollThree)), onRule: true };
  const released = b.liftAt + 0.62 * b.liftDur;
  if (t < released) return { lever: -1e4, onRule: false };
  return { lever: A_HALF, onRule: true };
}
/** a marble roll: a push, a glide, a soft stop */
function roll(t: number, [a, z]: [number, number]): number {
  const u = clamp01((t - a) / (z - a));
  return 1 - Math.pow(1 - u, 2.4) * (1 - 0.15 * u);
}

function handPose(t: number, tq: number, b: Beats, cam: Camera3) {
  const entry = hands.entry(cam, 'L4');
  const placeDur = 1.5;
  if (t >= b.placeAt && t < b.placeAt + placeDur) {
    const u = (tq - b.placeAt) / placeDur;
    return hands.act('place', u, { x: xOf(A_START), y: BY - MARBLE_R }, { held: 'marble', scale: HAND_S, entry });
  }
  if (t >= b.liftAt && t < b.liftAt + b.liftDur) {
    const u = (tq - b.liftAt) / b.liftDur;
    return hands.act('lift', u, { x: xOf(A_THREE), y: BY - MARBLE_R }, { held: 'marble', scale: HAND_S, entry, dropAt: { x: xOf(A_HALF), y: BY - MARBLE_R } });
  }
  return null;
}

// ---------------------------------------------------------------- the tiles: out of the slot, off the tray, the 11
interface TileEv {
  label: string;
  /** lands in the tray (the clack) */
  land: number;
  /** slides off the tray's open end (Infinity = stays) */
  off: number;
  /** seconds it creeps half out of the slot before it comes the rest of the way */
  creep: number;
  heavy?: boolean;
}
const SLIDE = 0.24;
function tileEvents(b: Beats): TileEv[] {
  return [
    { label: OUT.five, land: b.tenDrop, off: b.tenOff, creep: 0 },
    { label: OUT.three, land: b.twelveDrop, off: b.twelveOff, creep: 0 },
    { label: OUT.half, land: b.clack, off: Infinity, creep: 0.85, heavy: true },
  ];
}
/** a tile's bottom-centre while inside the slot / in the tray */
const SLOT_Y = BY - 14;
const TRAY_Y = BY - 7;
function tiles(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const tw = 34 * TILE_S;
  const inside = BOX.x1 - tw / 2 - 4; // fully hidden behind the housing's face
  const half = BOX.x1 + tw * 0.08; // half out
  for (const e of tileEvents(b)) {
    const slideAt = e.land - SLIDE;
    const creepAt = slideAt - e.creep;
    if (tq < creepAt - 1e-6) continue;
    let x: number;
    let y = SLOT_Y;
    let a = 1;
    let glow = 0;
    let tilt = 0;
    if (e.creep > 0 && tq < slideAt) {
      // creeping out of the slot, then a held breath half out (the lever trembles above it)
      x = lerp(inside, half, sm((tq - creepAt) / (e.creep * 0.7)));
    } else if (tq < e.land) {
      const u = clamp01((tq - slideAt) / SLIDE);
      x = lerp(e.creep > 0 ? half : inside, TX, u * u * (3 - 2 * u) * 0.35 + u * 0.65);
      y = lerp(SLOT_Y, TRAY_Y, u * u);
    } else {
      // the clack: one small bounce on twos, then still
      const dt = tq - e.land;
      x = TX;
      y = TRAY_Y - (dt < 1 / 12 ? (e.heavy ? 6 : 3) : dt < 2 / 12 ? (e.heavy ? 2 : 1) : 0);
      if (tq >= e.off) {
        // slides off the tray's open far end, tips and falls behind the bench
        const u = clamp01((tq - e.off) / 0.45);
        x = TX + u * (TRAY.x1 - TX + 50);
        tilt = sm((u - 0.5) / 0.5) * 0.9;
        y = TRAY_Y + sm((u - 0.6) / 0.4) * 70;
        a = 1 - sm((u - 0.5) / 0.45);
        if (a <= 0) continue;
      }
      if (e.heavy) glow = win(t, b.eleven - 0.25, b.eleven + 0.45) * (1 - 0.3 * win(t, b.neither + 0.3, b.neither + 1.6));
    }
    c.save();
    c.globalAlpha *= a;
    // the housing's face hides the part of the tile still inside the slot
    c.beginPath();
    c.rect(BOX.x1, -400, 1200, 1600);
    c.clip();
    c.translate(x, y);
    c.rotate(tilt);
    if (glow > 0) {
      // the rim light catching the 11: a warm halo behind the tile (the plate's lamp)
      const g = c.createRadialGradient(0, -26, 4, 0, -26, 90);
      g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.6 * glow));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(-100, -120, 200, 200);
    }
    tile(c, env, 0, 0, e.label, { s: TILE_S, glow, subject: true });
    c.restore();
  }
}

/** the output housing at the lever's foot: a cut-paper cabinet with a slot in its right face */
function housing(c: C, env: PaintEnv) {
  const ink = PUPPET_NEAR_BLACK;
  const rimC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.85);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(BOX.x0, BY);
  c.lineTo(BOX.x0, BOX.top + 10);
  c.lineTo(BOX.x0 + 10, BOX.top);
  c.lineTo(BOX.x1 - 10, BOX.top);
  c.lineTo(BOX.x1, BOX.top + 10);
  c.lineTo(BOX.x1, BY);
  c.closePath();
  c.fill();
  // pierced detail: a small round port and two vents (the plate shows through)
  c.fillStyle = mixLab(env.mood.sky[3], env.mood.core, 0.35);
  c.beginPath();
  c.arc((BOX.x0 + BOX.x1) / 2 - 8, BOX.top + 26, 7, 0, Math.PI * 2);
  c.fill();
  c.fillRect(BOX.x0 + 12, BOX.top + 46, 22, 3);
  c.fillRect(BOX.x0 + 12, BOX.top + 54, 22, 3);
  // the top edge and the slot's lip on the right face (rim-lit)
  c.strokeStyle = rimC;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(BOX.x0 + 10, BOX.top);
  c.lineTo(BOX.x1 - 10, BOX.top);
  c.moveTo(BOX.x1 - 4, SLOT_Y - 26 * TILE_S - 6);
  c.lineTo(BOX.x1 + 3, SLOT_Y - 26 * TILE_S - 6);
  c.stroke();
}

function tray(c: C, env: PaintEnv) {
  const ink = PUPPET_NEAR_BLACK;
  const y = BY;
  c.fillStyle = ink;
  c.beginPath();
  // a shallow tray from the housing's face, open at its far end (where old tiles slide off)
  c.moveTo(TRAY.x0, y - 18);
  c.lineTo(TRAY.x0 + 6, y - 6);
  c.lineTo(TRAY.x1, y - 6);
  c.lineTo(TRAY.x1, y - 1);
  c.lineTo(TRAY.x0, y);
  c.closePath();
  c.fill();
  c.fillRect(TRAY.x0 + 20, y, 8, 7);
  c.fillRect(TRAY.x1 - 26, y - 2, 8, 9);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.75);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(TRAY.x0 + 6, y - 6);
  c.lineTo(TRAY.x1, y - 6);
  c.stroke();
}

// ---------------------------------------------------------------- the plate's ink
function plateInk(c: C, env: PaintEnv, t: number, b: Beats) {
  const ink = mixLab(env.mood.ink, '#3a2a1c', 0.25);
  const font = `500 ${CODE_PX}px ${FONT.mono}`;
  c.save();
  c.font = font;
  c.textBaseline = 'alphabetic';
  const w = c.measureText(CODE).width;
  const x0 = 640 - w / 2;
  const adv = (i: number) => c.measureText(CODE.slice(0, i)).width;
  // the 'check' kick: a band of warm lamplight runs along the line
  const kick = win(t, b.check - 0.1, b.check + 0.25) * (1 - win(t, b.check + 0.5, b.check + 1.4));
  if (kick > 0) {
    const sweep = x0 - 60 + (w + 120) * win(t, b.check - 0.1, b.check + 0.9);
    const g = c.createRadialGradient(sweep, CODE_Y - 10, 4, sweep, CODE_Y - 10, 190);
    g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.55 * kick));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(sweep - 200, CODE_Y - 80, 400, 120);
  }
  // the line inks in left to right from the plate beat (a soft wet edge)
  const inkU = win(t, b.plate - 0.2, b.plate + 0.85);
  if (inkU > 0) {
    textRole(c, 'subject', () => {
      c.save();
      const edge = x0 - 40 + (w + 80) * inkU;
      const g = c.createLinearGradient(edge - 40, 0, edge, 0);
      g.addColorStop(0, ink);
      g.addColorStop(1, withAlpha(ink, 0));
      c.fillStyle = inkU >= 1 ? ink : g;
      c.fillText(CODE, x0, CODE_Y);
      c.restore();
    });
  }
  // pencil underlines that teach the reading, word by word (gone before the machine rises)
  const out = 1 - win(t, b.ulOut, b.ulOut + 0.6);
  if (out > 0) {
    const pen = withAlpha(mixLab('#6b4a2c', env.mood.ink, 0.25), 0.8 * out);
    const span = (tok: string) => {
      const i = CODE.indexOf(tok);
      return [x0 + adv(i) - 2, x0 + adv(i + tok.length) + 2] as const;
    };
    const ul = (tok: string, u: number, seed: number) => {
      if (u <= 0) return;
      const [a, z] = span(tok);
      const y = CODE_Y + 9;
      c.strokeStyle = pen;
      c.lineWidth = 2.1;
      c.lineCap = 'round';
      c.beginPath();
      const n = 14;
      for (let k = 0; k <= n; k++) {
        const x = a + (z - a) * (k / n) * u;
        const yy = y + Math.sin(k * 0.9 + seed) * 0.8 + (k / n) * 1.2;
        if (k === 0) c.moveTo(x, yy);
        else c.lineTo(x, yy);
      }
      c.stroke();
    };
    ul('(a > 4)', win(t, b.ulA[0], b.ulA[1]), 1);
    ul('10', win(t, b.ulTen, b.ulTen + 0.3), 2);
    ul('12', win(t, b.ulTwelve[0], b.ulTwelve[1]), 3);
  }
  // the one result line: a = 4.5 → 11, on 'Eleven'
  const r = win(t, b.eleven - 0.12, b.eleven + 0.5);
  if (r > 0) {
    textRole(c, 'subject', () => {
      c.font = `500 ${CODE_PX}px ${FONT.mono}`;
      const rw = c.measureText(RESULT_LINE).width;
      c.fillStyle = withAlpha(mixLab(ink, '#7a3e1e', 0.25), r);
      c.fillText(RESULT_LINE, 640 - rw / 2, RESULT_Y);
    });
  }
  c.restore();
}

// ---------------------------------------------------------------- static art
/** the parchment plate pinned to the back of the workshop, under the lamp */
function plateBack(c: C, env: PaintEnv) {
  // the surround: the wall behind the bench, a step darker than the plate
  c.fillStyle = mixLab(env.fill('set'), '#4a3826', 0.42);
  c.fillRect(-100, -70, 1480, 860);
  // the sheet, a hair off square, with a deckled edge
  c.save();
  c.translate(640, 380);
  c.rotate(-0.006);
  const W = 1010, H = 800;
  const edge = (n: number, seed: number) => 2.2 * (hash1(n, seed) - 0.5);
  c.beginPath();
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) pts.push([-W / 2 + (W * i) / 60, -H / 2 + edge(i, 3)]);
  for (let i = 0; i <= 40; i++) pts.push([W / 2 + edge(i, 5), -H / 2 + (H * i) / 40]);
  for (let i = 60; i >= 0; i--) pts.push([-W / 2 + (W * i) / 60, H / 2 + edge(i, 7)]);
  for (let i = 40; i >= 0; i--) pts.push([-W / 2 + edge(i, 9), -H / 2 + (H * i) / 40]);
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  // its soft shadow on the wall
  c.save();
  c.translate(5, 7);
  c.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.ink, 0.45), 0.35);
  c.fill();
  c.restore();
  const g = c.createRadialGradient(-40, -300, 30, -20, -120, 820);
  g.addColorStop(0, mixLab('#f8f0df', env.mood.core, 0.3));
  g.addColorStop(0.45, mixLab('#ecdfc3', env.mood.sky[1], 0.15));
  g.addColorStop(0.8, mixLab('#d2bb92', env.mood.set, 0.3));
  g.addColorStop(1, mixLab('#b39a72', env.mood.set, 0.5));
  c.fillStyle = g;
  c.fill();
  c.clip();
  // fibres
  for (let i = 0; i < 420; i++) {
    const x = (hash1(i, 11) - 0.5) * W;
    const y = (hash1(i, 13) - 0.5) * H;
    const a = hash1(i, 17) * Math.PI;
    const l = 4 + hash1(i, 19) * 14;
    c.strokeStyle = withAlpha(hash1(i, 23) > 0.5 ? '#8f7650' : '#fffaf0', 0.08 + 0.08 * hash1(i, 29));
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  // a faint drafting grid (the plate's ruling), quieter toward the edges
  c.strokeStyle = withAlpha('#9c8460', 0.07);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let x = -W / 2 + 40; x < W / 2; x += 40) {
    c.moveTo(x, -H / 2 + 150);
    c.lineTo(x, H / 2);
  }
  for (let y = -H / 2 + 150; y < H / 2; y += 40) {
    c.moveTo(-W / 2 + 30, y);
    c.lineTo(W / 2 - 30, y);
  }
  c.stroke();
  // the margin rule under the header (where the code sits)
  c.strokeStyle = withAlpha('#7d6343', 0.22);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(-W / 2 + 60, -H / 2 + 130);
  c.lineTo(W / 2 - 60, -H / 2 + 130);
  c.stroke();
  c.restore();
  // brass pins at the top corners
  for (const [x, y] of [[148, 6], [1132, 2]] as const) {
    c.fillStyle = mixLab('#a07a3c', env.mood.halo, 0.25);
    c.beginPath();
    c.arc(x, y, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha('#fff6e0', 0.6);
    c.beginPath();
    c.arc(x - 1.4, y - 1.4, 1.6, 0, Math.PI * 2);
    c.fill();
  }
}

/** L5: the bench's near edge across the bottom of frame (blurred, near-black) */
function benchEdge(c: C, env: PaintEnv) {
  c.fillStyle = mixLab(env.mood.fg, env.mood.ink, 0.5);
  c.beginPath();
  c.moveTo(-220, 646);
  c.lineTo(1480, 636);
  c.lineTo(1480, 860);
  c.lineTo(-220, 860);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.55);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-220, 646);
  c.lineTo(1480, 636);
  c.stroke();
}

/** L6: the turned near post at frame right (the workshop's; the pencil will rest here from ch01-s07) */
function nearPost(c: C, env: PaintEnv) {
  c.fillStyle = env.fill('fg');
  c.beginPath();
  c.ellipse(1222, 446, 28, 19, 0, 0, Math.PI * 2);
  c.rect(1192, 456, 60, 15);
  c.rect(1200, 470, 44, 520);
  c.rect(1188, 600, 68, 18);
  c.fill();
}
