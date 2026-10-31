/**
 * ch01-s06 — TWO RAMPS AND A LEVER (plate, parchment; inkBleed in from the tag line; 21.1 s on the locked clock).
 * L0108 "A scrap of JavaScript a child could check. If a is more than four, ten. If not, twelve."
 * L0109 "Build it from ramps, the stuff of neural networks. Five gives ten; three, twelve."
 * L0110 "Give it four and a half." (1.8 s of silence)   L0111 "Eleven. Neither ten nor twelve."
 *
 * A lamp-lit parchment plate pinned behind the workbench (L2) carries the README's line in monospace across its top
 * (a sharp ink layer at the plate's depth). In front of it, at L4, the DEEP DIVE I machine (sets/rampBench): a floor
 * rule with unnumbered integer ticks, board one hinged at 4, board two at 5, the lever that reads the difference of
 * their heights (it can only rest between 0 and 1), and an output tray under a small hopper. Behind the boards, in the
 * L3 haze, the two belts run the whole shot, dim and unreadable (they are explained in ch04-s04). L5 is the near
 * bench edge, L6 the workshop's near post at frame right.
 *
 * TEACHES, word by word (every number the machine shows is COMPUTED by rampBench's FP32 maths, RB.result):
 *   plate (0.3)        the code line inks in, left to right
 *   check              a warm kick of lamplight runs along the code line
 *   'a … four'         a pencil underline grows under (a > 4); 'ten' under 10; 'not … twelve' under 12
 *   ramps              floor rule, boards, lever, hopper and tray rise out of the plate (through the rule's slot)
 *   (after ramps)      the narrator's hand sets the brass marble on the rule at 3.5 (lever reads 0)
 *   Five               the marble rolls to 5: board one stands a whole unit above board two, the lever swings fully
 *                      up as the marble crosses 4 → 5, and a 10 tile drops from the hopper on 'ten' (clack)
 *   three              the 10 slides off the tray; the marble rolls back to 3, the lever falls to 0, a 12 drops on
 *                      'twelve' (clack)
 *   Give … half        the hand lifts the marble and sets it at 4.5, exactly between the hinges ('half' = release);
 *                      the lever stops halfway and trembles; the 12 slides off
 *   clack (silence)    a tile creeps out of the hopper and lands with one heavy clack: 11, the computed
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
/** the machine: rampBench's a = 4.5 point at BX, the floor rule at BY, scale S */
const BX = 492;
const BY = 560;
const S = 1.2;
const DOMAIN: [number, number] = [2.5, 6.2];
const xOf = (a: number) => RB.xOf({ x: BX, s: S }, a);
const X1 = xOf(DOMAIN[1]);
/** the lever pivot (rampBench: x1 + 70 s, y − 80 s) */
const LX = X1 + 70 * S;
/** the output tray and the hopper above it */
const TX = 990;
const TRAY_W = 120;
const HOP = { x: TX, y: 392 };
const TILE_S = 1.55;
const MARBLE_R = 8 * S;
/** the plate's ink layer: the plate's depth, but sharp (the type must read) */
const PLATE_INK: LayerSpec = { id: 'L2ink', z: LAYERS.L2.z, haze: 0.04, blur: 0 };
const CODE = 'const result = (a > 4) ? 10 : 12';
const CODE_Y = 112;
const CODE_PX = 30;
const RESULT_Y = 172;

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
      c.globalAlpha = 0.34 + 0.2 * win(t, b.ramps, b.ramps + 1.4);
      belts(c, env, { x: 820, y: 318, s: 0.95, phase: t * 0.55, bit: RB.above4(aNow.lever), dim: true, len: 960 });
      c.restore();
    });
    f.fog('B');

    // ---------- L4: the machine
    const rise = win(tq, b.ramps, b.ramps + 1.1);
    const rise2 = win(tq, b.ramps + 0.25, b.ramps + 1.35);
    const leverIn = win(tq, b.ramps + 0.45, b.ramps + 1.5);
    const tremble = aNow.lever > 4 && aNow.lever < 5 ? 1 - win(t, b.clack - 0.05, b.clack + 0.25) : 0;
    f.layer('L4', (c, env) => {
      if (rise <= 0) return;
      c.save();
      // the machine rises out of the plate through the slot under the floor rule
      c.beginPath();
      c.rect(-200, -200, 1700, BY + 10 + 200);
      c.clip();
      c.globalAlpha = sm(rise * 1.6);
      // boards, rule and lever (the marble is drawn by rampBench only while it sits on the rule)
      rampBench(c, env, {
        x: BX,
        y: BY,
        s: S,
        a: aNow.onRule ? aNow.lever : -1e4,
        domain: DOMAIN,
        boards: 2,
        rise: Math.min(rise, rise2 * 1.0 + 0.0),
        lever: leverIn > 0.02,
        tremble,
        tq,
        tray: false,
      });
      c.restore();
      // the hopper and the tray (cut paper), rising with the boards
      const lift = (1 - leverIn) * 110;
      c.save();
      c.globalAlpha = sm(leverIn * 1.4);
      c.translate(0, lift);
      hopper(c, env);
      tray(c, env);
      tiles(c, env, t, tq, b);
      c.restore();
    });
    f.rim({ x: -0.3, y: -1 });
    // the lamp over the plate (a practical behind the action plane: its pool on the paper)
    f.practical({ x: 560, y: 96, kind: 'lamp', seed: 61, intensity: 0.32, radius: 90, layer: 'L2' });

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
    return hands.act('place', u, { x: xOf(A_START), y: BY - MARBLE_R }, { held: 'marble', scale: 1.1, entry });
  }
  if (t >= b.liftAt && t < b.liftAt + b.liftDur) {
    const u = (tq - b.liftAt) / b.liftDur;
    return hands.act('lift', u, { x: xOf(A_THREE), y: BY - MARBLE_R }, { held: 'marble', scale: 1.1, entry, dropAt: { x: xOf(A_HALF), y: BY - MARBLE_R } });
  }
  return null;
}

// ---------------------------------------------------------------- the tiles: drop, slide off, the 11
interface TileEv {
  label: string;
  /** lands on the tray */
  land: number;
  /** slides off the tray's open end (Infinity = stays) */
  off: number;
  /** seconds it creeps out of the hopper before falling */
  creep: number;
  heavy?: boolean;
}
const FALL = 0.26;
function tileEvents(b: Beats): TileEv[] {
  return [
    { label: OUT.five, land: b.tenDrop, off: b.tenOff, creep: 0.22 },
    { label: OUT.three, land: b.twelveDrop, off: b.twelveOff, creep: 0.22 },
    { label: OUT.half, land: b.clack, off: Infinity, creep: 0.75, heavy: true },
  ];
}
function tiles(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const floor = BY - 8;
  const mouth = HOP.y + 26;
  for (const e of tileEvents(b)) {
    const fallAt = e.land - FALL;
    const creepAt = fallAt - e.creep;
    if (tq < creepAt) continue;
    let x = TX;
    let y: number;
    let a = 1;
    let glow = 0;
    let tilt = 0;
    if (tq < fallAt) {
      // creeping out of the hopper mouth (clipped by the hopper's lip: drawn under it)
      y = mouth + 6 + 34 * win(tq, creepAt, fallAt) * (e.heavy ? 0.7 : 0.4);
      a = sm((tq - creepAt) / 0.12);
    } else if (tq < e.land) {
      const u = (tq - fallAt) / FALL;
      const y0 = mouth + 6 + 34 * (e.heavy ? 0.7 : 0.4);
      y = y0 + (floor - y0) * u * u;
    } else {
      // the clack: one small bounce on twos, then still
      const dt = tq - e.land;
      y = floor - (dt < 1 / 12 ? (e.heavy ? 5 : 3) : dt < 2 / 12 ? (e.heavy ? 1.5 : 1) : 0);
      if (tq >= e.off) {
        // slides off the tray's open right end, tips and falls behind the bench
        const u = clamp01((tq - e.off) / 0.42);
        x = TX + u * (TRAY_W + 40);
        tilt = sm((u - 0.55) / 0.45) * 0.9;
        y = floor + sm((u - 0.6) / 0.4) * 60;
        a = 1 - sm((u - 0.55) / 0.4);
        if (a <= 0) continue;
      }
      if (e.heavy) glow = win(t, b.eleven - 0.25, b.eleven + 0.45) * (1 - 0.35 * win(t, b.neither + 0.3, b.neither + 1.6));
    }
    c.save();
    c.globalAlpha *= a;
    if (tq < fallAt) {
      // only the part below the hopper's mouth shows
      c.beginPath();
      c.rect(TX - 60, mouth, 120, 400);
      c.clip();
    }
    c.translate(x, y);
    c.rotate(tilt);
    if (glow > 0) {
      // the rim light catching the 11: a warm halo behind the tile (the plate's lamp)
      const g = c.createRadialGradient(0, -20, 4, 0, -20, 70);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.55 * glow));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(-80, -100, 160, 160);
    }
    tile(c, env, 0, 0, e.label, { s: TILE_S, glow, subject: true });
    c.restore();
  }
}

function hopper(c: C, env: PaintEnv) {
  const ink = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.12);
  c.fillStyle = ink;
  // a funnel on a thin bracket from the lever's stand
  c.beginPath();
  c.moveTo(HOP.x - 46, HOP.y - 34);
  c.lineTo(HOP.x + 46, HOP.y - 34);
  c.lineTo(HOP.x + 34, HOP.y + 26);
  c.lineTo(HOP.x - 34, HOP.y + 26);
  c.closePath();
  c.fill();
  c.fillRect(HOP.x - 50, HOP.y - 42, 100, 9);
  // the bracket back to the lever stand
  c.fillRect(LX, HOP.y - 6, HOP.x - 46 - LX, 5);
  // pierced detail: three slots through the funnel (the backlight shows through)
  c.fillStyle = withAlpha(mixLab(env.mood.sky[3], env.mood.core, 0.3), 0.85);
  for (let i = -1; i <= 1; i++) c.fillRect(HOP.x + i * 18 - 3, HOP.y - 22, 6, 30);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.7);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(HOP.x - 50, HOP.y - 42);
  c.lineTo(HOP.x + 50, HOP.y - 42);
  c.stroke();
}

function tray(c: C, env: PaintEnv) {
  const ink = PUPPET_NEAR_BLACK;
  const y = BY;
  c.fillStyle = ink;
  c.beginPath();
  // a shallow tray, open at its right end (where the old tiles slide off)
  c.moveTo(TX - TRAY_W / 2 - 8, y - 34);
  c.lineTo(TX - TRAY_W / 2, y - 34);
  c.lineTo(TX - TRAY_W / 2 + 4, y - 6);
  c.lineTo(TX + TRAY_W / 2 + 20, y - 6);
  c.lineTo(TX + TRAY_W / 2 + 20, y);
  c.lineTo(TX - TRAY_W / 2 - 4, y);
  c.closePath();
  c.fill();
  // feet
  c.fillRect(TX - TRAY_W / 2 + 6, y, 8, 6);
  c.fillRect(TX + TRAY_W / 2 + 4, y, 8, 6);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.7);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(TX - TRAY_W / 2 - 8, y - 34);
  c.lineTo(TX - TRAY_W / 2, y - 34);
  c.moveTo(TX - TRAY_W / 2 + 4, y - 6);
  c.lineTo(TX + TRAY_W / 2 + 20, y - 6);
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
  c.fillStyle = mixLab(env.fill('set'), env.mood.sky[2], 0.35);
  c.fillRect(-100, -70, 1480, 860);
  // the sheet, a hair off square, with a deckled edge
  c.save();
  c.translate(640, 380);
  c.rotate(-0.006);
  const W = 1080, H = 760;
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
  const g = c.createRadialGradient(-80, -170, 40, -40, -60, 760);
  g.addColorStop(0, mixLab('#f6eedd', env.mood.core, 0.25));
  g.addColorStop(0.55, mixLab('#eadbbd', env.mood.sky[1], 0.2));
  g.addColorStop(1, mixLab('#d6c09a', env.mood.set, 0.25));
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
  for (const [x, y] of [[112, 18], [1168, 14]] as const) {
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
  c.moveTo(-220, 612);
  c.lineTo(1480, 600);
  c.lineTo(1480, 860);
  c.lineTo(-220, 860);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.55);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-220, 612);
  c.lineTo(1480, 600);
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
