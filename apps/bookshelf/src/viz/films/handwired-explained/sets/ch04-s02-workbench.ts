/**
 * handwired-explained — THE BACKLIT WORKBENCH of Deep Dive I (ch04-s02 .. ch04-s05; free for later ch04 shots).
 *
 * script: "a long black bench before a tall window bay glowing warm at L2, a low haze at board height, a black post
 * at L6 framing the right edge, the formula on a small card clipped to the post".
 *
 *   import { WB, benchRoom, benchNear, numberRule, rig, ledger, postCard, marble } from '../sets/ch04-s02-workbench';
 *   benchRoom(f, { key });                                 // backlight, L2 window bay, haze at board height, L3 lamp + jars
 *   f.layer('L4', (c, env) => { benchTop(c, env); numberRule(c, env, {...}); rig(c, env, {...}); ledger(c, env, {...}); });
 *   f.rim({ x: 0, y: -1 });
 *   benchNear(f, { key, card: { lines, ink, paper } });     // L5 bench lip, L6 post, the clipped card (sharp, near)
 *
 * The machine is the README's (a > 4) ? 10 : 12 rewritten as ramps (TE01): board one hinged at 4 (max(0, a − 4)),
 * board two hinged at 5 (max(0, a − 5)), the lever that reads board one minus board two (clamp(a − 4, 0, 1)). Every
 * value the set prints is COMPUTED with rampBench's FP32 maths (RB), never typed in. Same silhouette language as
 * sets/rampBench (ch01-s06): near-black boards with a rim on the top edge, a copper pin at each hinge, a brass marble.
 *
 * Layout (L4 rest px): the number line maps a in [1.8, 6.4] to x in [360, 902] (U = 117.7 px per unit), the boards
 * stand on the bench top at y = 540, a paper rule with numerals runs along the bench's front edge (y 540 .. 588), a
 * far stub past a break carries a = 100 (ch04-s02). The ink ledger stands at the left (x 30 .. 340, y 348 .. 528).
 * The lever stands right of the boards (x 977). The post is at the right edge (L6); its card hangs at the upper right.
 */
import type { Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { hash1 } from '../../../film/core/frame';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, cardProbe, legibleSize, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf } from './narratorHands';
import { RB } from './rampBench';

type C = CanvasRenderingContext2D;

// ---------------------------------------------------------------- geometry
const S = 1.07;
const U = 110 * S;
const BX = 678;
const BY = 540;
/** the bench top: the paper rule stands on it, the boards stand on the rule (so their flats read against the glass) */
const BENCH = BY + 46;
const DOMAIN: [number, number] = [1.8, 6.4];
const xOfA = (a: number) => BX + (a - 4.5) * U;
const X0 = xOfA(DOMAIN[0]);
const X1 = xOfA(DOMAIN[1]);
/** the far stub past the break: a = 100 */
const FAR = { brk: 948, x: 1012, a: 100 } as const;
/** review r1 (ch04-s03): both boards stand on ONE baseline (board two sits a step behind, not raised), so 'wakes
 *  at five' is the only difference between them */
const BOARD_LIFT = 0;
/** the five stops of the ledger */
const STOPS = [3, 4, 5, 6, 100] as const;

export const WB = {
  S,
  U,
  BX,
  BY,
  BENCH,
  DOMAIN,
  X0,
  X1,
  FAR,
  STOPS,
  /** board k's flat top edge (y) and its top at a */
  boardBase: (k: number) => BY - 6 * S - BOARD_LIFT * k - 4 * S,
  boardTop: (k: number, a: number) => BY - 6 * S - BOARD_LIFT * k - 4 * S - RB.ramp(Math.min(a, DOMAIN[1]), 4 + k) * U,
  /** x of a on the rule (a = 100 sits on the far stub) */
  xOf: (a: number) => (a >= 50 ? FAR.x : xOfA(a)),
  /** the hinge pins */
  pin: (k: number) => ({ x: xOfA(4 + k), y: BY - 6 * S - BOARD_LIFT * k - 1 * S }),
  /** the lever (pivot) */
  lever: { x: 1088, y: BY - 74 * S, r: 54 * S },
  /** the ledger card (L4) */
  ledger: { x: 44, y: 348, w: 300, h: 180 },
  /** the post (L6) and the card's right edge / top (card layer) */
  post: { x: 1226 },
  card: { right: 1240, top: 82 },
  /** review r1: the marble is the hero of the read-off; 11 px (was 8.5) */
  MARBLE_R: 11 * S,
} as const;

/** the camera hand-offs between the bench shots (each shot starts on the last one's end framing) */
export const WB_CAM = {
  /** review r1: ch04-s02 ends pushed in on the marble, gauge and ledger (the action band at the optical centre) */
  s02End: { x: 520, y: 442, z: 84, lens: 1 },
  /** ch04-s03 pulls back from s02End to here (the path graph, both boards and the card in frame) */
  s03Wide: { x: 634, y: 356, z: 12, lens: 1 },
  s03End: { x: 632, y: 350, z: 40, lens: 1 },
} as const;

/** the card plane: near the post, but sharp (the type must read) */
export const CARD_LAYER: LayerSpec = { id: 'wbCard', z: 470, haze: 0, blur: 0 };

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
function lw(c: C, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}
const paperOf = (env: PaintEnv, k = 0) => mixLab(mixLab('#eadcbc', env.mood.halo, 0.22), env.mood.set, 0.12 + k);
const inkOf = (env: PaintEnv) => mixLab('#22180f', env.mood.ink, 0.25);
const rimOf = (env: PaintEnv, a = 0.85) => withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), a);

// ---------------------------------------------------------------- the room (backlight, L2 bay, haze, L3)
export interface RoomOpts {
  key: string;
  /** lamp intensity (the hanging lamp over the bench, L3), default 0.55 */
  lamp?: number;
  /** the sun ellipse x (stage px) */
  sunX?: number;
}
export function benchRoom(f: Frame, o: RoomOpts) {
  f.backlight({ sunX: o.sunX ?? 640, sunY: 330, intensity: 1 });
  f.layer('L2', (c, env) => {
    f.cached(`ch04wb/L2/${env.mood.id}`, 2000, 1200, (cc) => {
      cc.translate(360, 240);
      bayWall(cc, env);
    })(c, -360, -240);
  });
  // the low haze lying at board height
  f.fog({ yCenter: 470, height: 230, alpha: 0.26, drift: 5 });
  f.layer('L3', (c, env) => {
    f.cached(`ch04wb/L3/${env.mood.id}`, 1900, 1000, (cc) => {
      cc.translate(300, 300);
      backShelf(cc, env);
    })(c, -300, -300);
  });
  f.fog('B');
  // the hanging lamp's glow: behind the action plane, painted before L4
  f.practical({ x: 236, y: 156, kind: 'lamp', seed: 47, intensity: o.lamp ?? 0.55, radius: 120, layer: 'L3' });
}

/** L2: a dark panelled wall with a tall three-light window bay (round-headed lights, leaded panes) cut as holes */
function bayWall(c: C, env: PaintEnv) {
  const wall = mixLab(mixLab('#4b3828', env.mood.set, 0.12), PUPPET_NEAR_BLACK, 0.18);
  const p = new Path2D();
  p.rect(-360, -240, 2000, 1200);
  const lights = [
    { cx: 330, w: 236 },
    { cx: 640, w: 252 },
    { cx: 950, w: 236 },
  ];
  const top = 40;
  const sill = 600;
  const bar = 4.5;
  for (const L of lights) {
    const r = L.w / 2;
    const x0 = L.cx - r;
    const spring = top + r;
    // panes: 2 columns, 8 rows below the spring; the arched head in 2 panes
    const mull = 14;
    const pw = (L.w - mull) / 2;
    const rows = 8;
    const ph = (sill - spring - bar * (rows - 1)) / rows;
    for (let i = 0; i < 2; i++) {
      const px = x0 + i * (pw + mull);
      for (let j = 0; j < rows; j++) {
        const py = spring + 6 + j * (ph + bar);
        p.rect(px, py, pw, ph - 2);
      }
    }
    // the head: two quarter-round panes either side of the mullion
    for (let i = 0; i < 2; i++) {
      const sub = new Path2D();
      const a0 = i === 0 ? Math.PI : Math.PI * 1.5 + 0.06;
      const a1 = i === 0 ? Math.PI * 1.5 - 0.06 : Math.PI * 2;
      const cx = L.cx + (i === 0 ? -mull / 2 : mull / 2);
      sub.moveTo(cx, spring);
      sub.arc(L.cx, spring, r - 2, a0, a1);
      sub.closePath();
      p.addPath(sub);
    }
  }
  c.fillStyle = wall;
  c.fill(p, 'evenodd');
  // old glass: a faint warm tint varying pane to pane (inside the holes)
  for (const L of lights) {
    for (let j = 0; j < 9; j++) {
      const k = hash1(j + L.cx, 7);
      c.fillStyle = withAlpha(k > 0.5 ? '#fff3dc' : '#8a6a44', 0.04 + 0.05 * k);
      c.fillRect(L.cx - L.w / 2, top + L.w / 2 + j * 62, L.w, 58);
    }
  }
  // cut-lines: the bay's reveal and pilaster edges, the cornice, a dado line (rim, quiet)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.16);
  c.lineWidth = 1.2;
  c.beginPath();
  for (const L of lights) {
    const r = L.w / 2 + 12;
    c.moveTo(L.cx - r, sill);
    c.lineTo(L.cx - r, top + r - 12);
    c.arc(L.cx, top + r - 12, r, Math.PI, Math.PI * 2);
    c.lineTo(L.cx + r, sill);
  }
  c.moveTo(-360, 8);
  c.lineTo(1640, 8);
  c.moveTo(-360, 16);
  c.lineTo(1640, 16);
  c.stroke();
  // the wall darkens toward the ceiling
  const g = c.createLinearGradient(0, -240, 0, 300);
  g.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.45));
  g.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
  c.save();
  c.fillStyle = g;
  c.fill(p, 'evenodd');
  c.restore();
}

/** L3: a hanging enamel lamp over the bench's left end, a few jars and a coil of wire on a back shelf at the right */
function backShelf(c: C, env: PaintEnv) {
  const ink = env.fill('set');
  const dark = mixLab(ink, PUPPET_NEAR_BLACK, 0.35);
  c.fillStyle = dark;
  // the lamp cord and shade
  c.fillRect(234, -300, 3, 432);
  c.beginPath();
  c.moveTo(220, 128);
  c.lineTo(252, 128);
  c.lineTo(254, 138);
  c.lineTo(292, 158);
  c.lineTo(180, 158);
  c.lineTo(218, 138);
  c.closePath();
  c.fill();
  // the back shelf at the right, just above the bench line
  c.fillRect(1040, 512, 330, 7);
  // jars (pierced: a lighter band of glass at each shoulder)
  const jars = [
    [1068, 44, 26],
    [1104, 30, 22],
    [1188, 58, 30],
    [1232, 36, 24],
  ] as const;
  for (const [x, h, w] of jars) {
    c.fillStyle = dark;
    c.beginPath();
    c.roundRect(x - w / 2, 512 - h, w, h, 4);
    c.fill();
    c.fillRect(x - w * 0.3, 512 - h - 6, w * 0.6, 7);
    c.fillStyle = withAlpha(mixLab(env.mood.sky[3], env.mood.core, 0.2), 0.35);
    c.fillRect(x - w / 2 + 4, 512 - h + 8, w - 8, 3);
  }
  // a small bench vise on the shelf (jaw, screw and handle bar)
  c.fillStyle = dark;
  c.fillRect(1134, 478, 30, 34);
  c.fillRect(1128, 470, 18, 12);
  c.fillRect(1152, 470, 18, 12);
  c.fillRect(1160, 488, 30, 5);
  c.fillRect(1188, 478, 4, 26);
}

// ---------------------------------------------------------------- the bench, the rule (L4)
/** the bench top and body, edge-on (cached by the caller's f.cached or drawn directly) */
export function benchTop(c: C, env: PaintEnv) {
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-500, BENCH, 2400, 600);
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.fg, 0.4);
  c.fillRect(-500, BENCH + 40, 2400, 600);
  c.strokeStyle = rimOf(env, 0.5);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(-500, BENCH);
  c.lineTo(1900, BENCH);
  c.stroke();
}

export interface RuleOpts {
  /** 0..1: the rule slides into place / inks its numerals */
  show: number;
  /** the far stub (break + 100) 0..1 */
  far?: number;
  /** a column to light (a stop value) and its strength */
  lit?: { a: number; k: number } | null;
}
/** the paper number line along the bench's front edge: integer ticks, numerals, a break and the far 100 */
export function numberRule(c: C, env: PaintEnv, o: RuleOpts) {
  if (o.show <= 0) return;
  const y = BY;
  const h = 46;
  const xa = X0 - 22;
  const far = o.far ?? 0;
  const xb = far > 0 ? FAR.x + 34 : X1 + 22;
  c.save();
  c.globalAlpha *= o.show;
  // the paper strip, a hair off level, with its shadow on the bench face
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5);
  c.fillRect(xa + 3, y + 4, xb - xa, h);
  c.fillStyle = paperOf(env);
  c.fillRect(xa, y, xb - xa, h);
  // the break: a torn gap in the strip between the last tick and the far stub
  if (far > 0) {
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.beginPath();
    c.moveTo(FAR.brk - 10, y - 1);
    c.lineTo(FAR.brk - 3, y + h + 1);
    c.lineTo(FAR.brk + 5, y + h + 1);
    c.lineTo(FAR.brk - 2, y - 1);
    c.closePath();
    c.fill();
  }
  const ink = inkOf(env);
  c.strokeStyle = withAlpha(ink, 0.85);
  c.lineWidth = lw(c, 1.5);
  c.beginPath();
  for (let k = Math.ceil(DOMAIN[0]); k <= Math.floor(DOMAIN[1]); k++) {
    const x = xOfA(k);
    c.moveTo(x, y);
    c.lineTo(x, y + 10);
  }
  // half ticks
  for (let k = Math.ceil(DOMAIN[0] * 2); k <= Math.floor(DOMAIN[1] * 2); k++) {
    if (k % 2 === 0) continue;
    const x = xOfA(k / 2);
    c.moveTo(x, y);
    c.lineTo(x, y + 5);
  }
  if (far > 0) {
    c.moveTo(FAR.x, y);
    c.lineTo(FAR.x, y + 10);
  }
  c.stroke();
  // the lit column (the marble's stop)
  if (o.lit && o.lit.k > 0) {
    const x = WB.xOf(o.lit.a);
    const g = c.createRadialGradient(x, y + 28, 2, x, y + 28, 34);
    g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.6), 0.6 * o.lit.k));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - 40, y, 80, h);
  }
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 21px ${FONT.mono}`, 21);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    for (let k = Math.ceil(DOMAIN[0]); k <= Math.floor(DOMAIN[1]); k++) c.fillText(String(k), xOfA(k), y + 36);
    if (far > 0) {
      c.globalAlpha *= far;
      c.fillText(String(FAR.a), FAR.x, y + 36);
    }
    c.textAlign = 'left';
  });
  c.restore();
}

// ---------------------------------------------------------------- the rig: boards, pins, lever, hatch (L4)
export interface RigOpts {
  /** board one: grow 0..1 from the copper hinge (ch04-s02) — 1 = full board; omit = full */
  grow?: number;
  /** board two rises 0..1 (ch04-s03) */
  two?: number;
  /** lever in 0..1 and the a it reads (it reads board one − board two at the marble) */
  lever?: number;
  leverA?: number;
  /** red pencil hatch on board one's slope between the hinges 0..1 */
  hatch?: number;
  /** copper glint at board one's corner 0..1 */
  glint?: number;
}
/** a board's outline (rampBench's shape): flat to its hinge, a 45° climb to the domain's end */
function boardPath(k: number): Path2D {
  const hinge = 4 + k;
  const by = BY - 6 * S - k * BOARD_LIFT;
  const top = (a: number) => by - RB.ramp(a, hinge) * U;
  const p = new Path2D();
  p.moveTo(X0, by + 6 * S);
  p.lineTo(X0, by - 4 * S);
  p.lineTo(xOfA(hinge), by - 4 * S);
  p.lineTo(X1, top(DOMAIN[1]) - 4 * S);
  p.lineTo(X1, top(DOMAIN[1]) + 9 * S);
  p.lineTo(xOfA(hinge) + 5 * S, by + 6 * S);
  p.closePath();
  return p;
}
const BOARD = [boardPath(0), boardPath(1)];
function boardEdge(k: number): Path2D {
  const hinge = 4 + k;
  const by = BY - 6 * S - k * BOARD_LIFT;
  const p = new Path2D();
  p.moveTo(X0, by - 4 * S);
  p.lineTo(xOfA(hinge), by - 4 * S);
  p.lineTo(X1, by - RB.ramp(DOMAIN[1], hinge) * U - 4 * S);
  return p;
}
const EDGE = [boardEdge(0), boardEdge(1)];

export function rig(c: C, env: PaintEnv, o: RigOpts) {
  const ink = PUPPET_NEAR_BLACK;
  // board two first (it stands behind, a step lighter)
  const two = clamp01(o.two ?? 0);
  if (two > 0) {
    c.save();
    c.translate(0, (1 - sm(two)) * 70);
    c.globalAlpha *= sm(two * 1.6);
    c.beginPath();
    c.rect(-200, -300, 1800, BY - 4 - -300);
    c.clip();
    c.fillStyle = mixLab(ink, env.mood.set, 0.22);
    c.fill(BOARD[1]);
    c.strokeStyle = rimOf(env, 0.7);
    c.lineWidth = lw(c, 2.2);
    c.stroke(EDGE[1]);
    pin(c, env, 1, 0);
    c.restore();
  }
  // board one: grows out of the bent copper hinge about its corner (thickness and all: the wire IS a small board)
  const g = o.grow ?? 1;
  if (g > 0) {
    const P = WB.pin(0);
    const k = 0.3 + 0.7 * sm(g);
    c.save();
    c.translate(P.x, P.y);
    c.scale(k, k);
    c.translate(-P.x, -P.y);
    const copper = copperOf(env, 0.35);
    c.fillStyle = g >= 1 ? ink : mixLab(copper, ink, sm((g - 0.15) / 0.7));
    c.fill(BOARD[0]);
    c.strokeStyle = g >= 1 ? rimOf(env) : withAlpha(mixLab(copper, mixLab(env.mood.rim, env.mood.core, 0.6), sm(g)), 0.9);
    c.lineWidth = lw(c, 2.4);
    c.stroke(EDGE[0]);
    // the hatch on the slope (ch04-s03 'caveat')
    if ((o.hatch ?? 0) > 0) hatch(c, env, o.hatch ?? 0);
    c.restore();
    pin(c, env, 0, o.glint ?? 0);
  }
  if ((o.lever ?? 0) > 0) lever(c, env, o.lever ?? 0, o.leverA ?? 0);
}

function pin(c: C, env: PaintEnv, k: number, glint: number) {
  const P = WB.pin(k);
  if (glint > 0) {
    const gr = c.createRadialGradient(P.x, P.y, 1, P.x, P.y, 34);
    gr.addColorStop(0, withAlpha(mixLab(copperOf(env, 1), env.mood.core, 0.5), 0.75 * glint));
    gr.addColorStop(1, withAlpha(copperOf(env, 0.5), 0));
    c.fillStyle = gr;
    c.fillRect(P.x - 36, P.y - 36, 72, 72);
  }
  c.fillStyle = copperOf(env, 0.5 + 0.5 * glint);
  c.beginPath();
  c.arc(P.x, P.y, 4.4 * S, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha('#fff1d6', 0.55);
  c.beginPath();
  c.arc(P.x - 1.3, P.y - 1.4, 1.4, 0, Math.PI * 2);
  c.fill();
}

/** red pencil hatching along board one's slope between the hinges (the one stretch never meant to be read) */
/** review r1: the red-pencil caveat on board one's 4 → 5 slope: 9 strokes at 45° (2 px, muted brick #8a3b2e at 75 %),
 *  laid stroke by stroke as u runs 0 → 1 */
export const HATCH = { n: 9, col: '#8a3b2e', alpha: 0.75 } as const;
function hatch(c: C, env: PaintEnv, u: number) {
  const by = BY - 6 * S;
  c.strokeStyle = withAlpha(HATCH.col, HATCH.alpha);
  c.lineWidth = lw(c, 2);
  c.lineCap = 'round';
  c.beginPath();
  const n = HATCH.n;
  for (let i = 0; i < n; i++) {
    const k = clamp01(u * n - i);
    if (k <= 0) break;
    const a = 4 + (i + 0.5) / n;
    const x = xOfA(a);
    const y = by - RB.ramp(a, 4) * U - 4 * S;
    // a 45° stroke across the slope (the slope climbs at 45°, so the stroke crosses it square), drawn on as k runs
    c.moveTo(x - 8, y - 8);
    c.lineTo(x - 8 + 16 * k, y - 8 + 16 * k);
  }
  c.stroke();
  void env;
}

/** the lever (rampBench's): a needle on a stand that can only rest between 0 (up-left) and 1 (up-right) */
export function lever(c: C, env: PaintEnv, show: number, a: number, at: { x: number; y: number; r: number; foot?: number } = WB.lever) {
  const bit = RB.above4(a);
  const LX = at.x, LY = at.y, R = at.r;
  const foot = at.foot ?? BENCH;
  c.save();
  c.globalAlpha *= sm(show);
  c.translate(0, (1 - sm(show)) * 40);
  const ang = -Math.PI * 0.75 + bit * Math.PI * 0.5;
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.75);
  c.lineWidth = lw(c, 1.8);
  c.beginPath();
  c.arc(LX, LY, R, -Math.PI * 0.75, -Math.PI * 0.25);
  for (const t of [0, 1]) {
    const q = -Math.PI * 0.75 + t * Math.PI * 0.5;
    c.moveTo(LX + Math.cos(q) * (R - 7), LY + Math.sin(q) * (R - 7));
    c.lineTo(LX + Math.cos(q) * (R + 7), LY + Math.sin(q) * (R + 7));
  }
  c.stroke();
  // the gauge's two numerals (0 and 1): the lever can only rest between them
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 20px ${FONT.mono}`, 20);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.2), 0.95);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const t of [0, 1]) {
      const q = -Math.PI * 0.75 + t * Math.PI * 0.5;
      c.fillText(String(t), LX + Math.cos(q) * (R + 22), LY + Math.sin(q) * (R + 22));
    }
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
  });
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(LX + Math.cos(ang + Math.PI / 2) * 4, LY + Math.sin(ang + Math.PI / 2) * 4);
  c.lineTo(LX + Math.cos(ang) * (R + 3), LY + Math.sin(ang) * (R + 3));
  c.lineTo(LX + Math.cos(ang - Math.PI / 2) * 4, LY + Math.sin(ang - Math.PI / 2) * 4);
  c.closePath();
  c.fill();
  c.strokeStyle = rimOf(env, 0.7);
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  c.moveTo(LX, LY);
  c.lineTo(LX + Math.cos(ang) * (R + 3), LY + Math.sin(ang) * (R + 3));
  c.stroke();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(LX, LY, 8.5 * S, 0, Math.PI * 2);
  c.fill();
  c.fillRect(LX - 4.5 * S, LY, 9 * S, foot - LY);
  c.fillRect(LX - 16 * S, foot - 6, 32 * S, 6);
  c.fillStyle = copperOf(env, 0.3);
  c.beginPath();
  c.arc(LX, LY, 3.2 * S, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------- the marble
/** the brass marble (rampBench's): centre (x, y), radius r; roll = the angle its seam has turned */
export function marble(c: C, env: PaintEnv, x: number, y: number, r: number, roll = 0) {
  const gr = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, mixLab(env.mood.core, '#ffffff', 0.25));
  gr.addColorStop(0.45, mixLab('#b8893e', env.mood.halo, 0.3));
  gr.addColorStop(1, mixLab('#5b3f18', PUPPET_NEAR_BLACK, 0.4));
  c.fillStyle = gr;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha('#3b2a12', 0.55);
  c.lineWidth = lw(c, 1.3);
  c.beginPath();
  c.ellipse(x, y, r * 0.92, r * 0.32, roll, 0, Math.PI);
  c.stroke();
}

/**
 * A reading bar at the marble: board k's height above its own flat (copper for board one, pale for board two),
 * growing `u` 0..1 of the way up. a = 100 reads off the top of the frame (dashed, with an arrow).
 */
export function readingBar(c: C, env: PaintEnv, k: number, a: number, u: number, alpha = 1, dx = 0) {
  if (u <= 0 || alpha <= 0) return;
  const x = WB.xOf(a) + dx;
  // review r1 (ch04-s02): the gauge stands on the number line and reaches the board's surface at the marble
  const base = BY - 1;
  const col = k === 0 ? copperOf(env, 0.75) : mixLab(mixLab('#efe2c4', env.mood.halo, 0.3), env.mood.core, 0.2);
  c.save();
  c.globalAlpha *= alpha;
  c.lineCap = 'butt';
  if (a >= 50) {
    // the far reading: up, off the top of the frame
    const top = base - (base + 120) * sm(u);
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = lw(c, 7);
    c.beginPath();
    c.moveTo(x, base);
    c.lineTo(x, top);
    c.stroke();
    c.strokeStyle = col;
    c.lineWidth = lw(c, 4);
    c.setLineDash([lw(c, 10), lw(c, 6)]);
    c.beginPath();
    c.moveTo(x, base);
    c.lineTo(x, top);
    c.stroke();
    c.setLineDash([]);
    c.restore();
    return;
  }
  const surf = WB.boardBase(k);
  const top = base - (base - surf + RB.ramp(a, 4 + k) * U) * sm(u);
  if (base - top > 0.5) {
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = lw(c, 8);
    c.beginPath();
    c.moveTo(x, base);
    c.lineTo(x, top);
    c.stroke();
    c.strokeStyle = col;
    c.lineWidth = lw(c, 5);
    c.beginPath();
    c.moveTo(x, base);
    c.lineTo(x, top);
    c.stroke();
  }
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = lw(c, 6);
  c.beginPath();
  c.moveTo(x - 10, top);
  c.lineTo(x + 10, top);
  c.stroke();
  c.strokeStyle = col;
  c.lineWidth = lw(c, 3.2);
  c.beginPath();
  c.moveTo(x - 9, top);
  c.lineTo(x + 9, top);
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- the ink ledger (L4, standing at the left)
export type LedgerRow = 'ramp4' | 'ramp5' | 'lever';
export interface LedgerOpts {
  /** paper opacity (use cardPaperAlpha against the header's ink time) */
  paper: number;
  /** header ink 0..1 */
  head: number;
  /** rows shown, each with per-cell ink 0..1 (5 cells: a = 3, 4, 5, 6, 100) */
  rows: { kind: LedgerRow; label?: number; cells: number[] }[];
  /** the highlighted column (index into STOPS) and its strength */
  col?: { i: number; k: number } | null;
  id?: string;
  /** review r1 (ch04-s03): 0..1 steps the ledger back once it has done its job: paper to ~85 %, ink to warm grey */
  dim?: number;
}
export const ledgerValue = (kind: LedgerRow, a: number) =>
  RB.fmt(kind === 'ramp4' ? RB.ramp(a, 4) : kind === 'ramp5' ? RB.ramp(a, 5) : RB.above4(a));

export function ledger(c: C, env: PaintEnv, o: LedgerOpts) {
  if (o.paper <= 0) return;
  const L = WB.ledger;
  const dim = clamp01(o.dim ?? 0);
  const ink = mixLab(inkOf(env), '#8c7f6c', 0.7 * dim);
  c.save();
  // the black wire stand it leans in
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(L.x + 30, L.y + L.h - 4, 8, BENCH - (L.y + L.h) + 4);
  c.fillRect(L.x + L.w - 38, L.y + L.h - 4, 8, BENCH - (L.y + L.h) + 4);
  c.fillRect(L.x + 14, BENCH - 6, L.w - 28, 6);
  c.globalAlpha *= o.paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.45);
  c.fillRect(L.x + 4, L.y + 5, L.w, L.h);
  c.fillStyle = withAlpha(paperOf(env, 0.02), 1 - 0.15 * dim);
  c.fillRect(L.x, L.y, L.w, L.h);
  // ruled lines (the ledger's grid)
  const rowH = 38;
  const head = L.y + 46;
  const lab = 58;
  const colW = (L.w - lab - 12) / 5;
  const cx = (i: number) => L.x + lab + colW * (i + 0.5);
  if (o.col && o.col.k > 0) {
    c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), 0.45 * o.col.k);
    c.fillRect(cx(o.col.i) - colW / 2 + 2, L.y + 8, colW - 4, L.h - 16);
  }
  c.strokeStyle = withAlpha(ink, 0.35);
  c.lineWidth = lw(c, 1.1);
  c.beginPath();
  c.moveTo(L.x + 10, head);
  c.lineTo(L.x + L.w - 10, head);
  c.moveTo(L.x + lab - 4, L.y + 10);
  c.lineTo(L.x + lab - 4, L.y + L.h - 10);
  for (let r = 1; r < 4; r++) {
    c.moveTo(L.x + 10, head + r * rowH);
    c.lineTo(L.x + L.w - 10, head + r * rowH);
  }
  c.stroke();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 21px ${FONT.mono}`, 21);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(ink, o.head);
    c.fillText('a', L.x + lab / 2 - 2, head - 13);
    STOPS.forEach((a, i) => c.fillText(String(a), cx(i), head - 13));
    textProbe(c, `${o.id ?? 'ledger'}-head`, L.x, L.y, L.w, 46, o.head);
    o.rows.forEach((row, r) => {
      const y = head + (r + 1) * rowH - 11;
      // the row's key: a little ink glyph of the part it reads (no words)
      glyph(c, env, row.kind, L.x + lab / 2 - 2, y - 7, Math.max(...row.cells, 0) > 0 ? 1 : 0.5);
      row.cells.forEach((u, i) => {
        if (u <= 0) return;
        c.fillStyle = withAlpha(row.kind === 'lever' ? mixLab(ink, '#7a3e1e', 0.35) : ink, sm(u));
        c.fillText(ledgerValue(row.kind, STOPS[i]), cx(i), y + (1 - sm(u)) * 4);
      });
      textProbe(c, `${o.id ?? 'ledger'}-row${r}`, L.x + lab, y - 20, L.w - lab, 26, Math.max(0, ...row.cells.map(sm)));
    });
    c.textAlign = 'left';
  });
  cardProbe(c, o.id ?? 'ledger', L.x, L.y, L.w, L.h, 1, o.head);
  c.restore();
}

/** the row keys: a tiny ramp hinged early (board one), hinged late (board two), the lever's needle */
function glyph(c: C, env: PaintEnv, kind: LedgerRow, x: number, y: number, a: number) {
  const ink = inkOf(env);
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = kind === 'ramp5' ? withAlpha(ink, 0.6) : ink;
  c.lineWidth = lw(c, 3);
  c.lineJoin = 'round';
  c.beginPath();
  if (kind === 'lever') {
    // a little lever: a stand, a pivot, a needle between two ticks
    c.moveTo(x, y + 12);
    c.lineTo(x, y + 3);
    c.lineTo(x + 10, y - 7);
    c.moveTo(x - 13, y - 4);
    c.lineTo(x - 9, y);
    c.moveTo(x + 13, y - 4);
    c.lineTo(x + 9, y);
    c.moveTo(x - 7, y + 12);
    c.lineTo(x + 7, y + 12);
  } else {
    const h = kind === 'ramp4' ? -2 : 6;
    c.moveTo(x - 18, y + 8);
    c.lineTo(x + h, y + 8);
    c.lineTo(x + 18, y + 8 - (18 - h));
  }
  c.stroke();
  if (kind !== 'lever') {
    c.fillStyle = copperOf(env, 0.4);
    c.beginPath();
    c.arc(x + (kind === 'ramp4' ? -2 : 6), y + 8, 2.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ---------------------------------------------------------------- the near plane: bench lip (L5), post (L6), card
export interface CardText {
  lines: string[];
  /** ink 0..1 of each line (or one value for all) */
  ink: number | number[];
}
export interface NearOpts {
  key: string;
  /** the clipped card: paper opacity and its text layers (several = a swap; give each its own ink) */
  card?: { paper: number; texts: CardText[]; id?: string; width?: number; keepIn?: boolean };
  /** extra drawing in L5 (the narrator's hands while they cross the lens) */
  l5?: (c: C, env: PaintEnv) => void;
}
export function benchNear(f: Frame, o: NearOpts) {
  f.layer('L5', (c, env) => {
    f.cached(`ch04wb/L5/${env.mood.id}`, 2000, 500, (cc) => {
      cc.translate(400, -560);
      nearLip(cc, env);
    })(c, -400, 560);
    o.l5?.(c, env);
  });
  f.layer('L6', (c, env) => {
    f.cached(`ch04wb/L6/${env.mood.id}`, 520, 1500, (cc) => {
      cc.translate(-1180, 400);
      post(cc, env);
    })(c, 1180, -400);
  });
  const card = o.card;
  if (card && card.paper > 0) f.layer(CARD_LAYER, (c, env) => postCard(c, env, card));
}

/** L5: the bench's near lip across the bottom (very dark, blurred) with a spool of copper wire at the left */
function nearLip(c: C, env: PaintEnv) {
  c.fillStyle = mixLab(env.mood.fg, PUPPET_NEAR_BLACK, 0.5);
  c.beginPath();
  c.moveTo(-400, 690);
  c.lineTo(1700, 684);
  c.lineTo(1700, 1100);
  c.lineTo(-400, 1100);
  c.closePath();
  c.fill();
  // a spool of copper wire lying at the near left (a near occluder: one more plane)
  const fg = mixLab(env.mood.fg, PUPPET_NEAR_BLACK, 0.3);
  c.fillStyle = fg;
  // flanges (two discs seen edge-on) and the wound barrel between them
  c.beginPath();
  c.ellipse(40, 640, 14, 52, 0, 0, Math.PI * 2);
  c.ellipse(150, 640, 14, 52, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(40, 602, 110, 76);
  c.strokeStyle = withAlpha(copperOf(env, 0.25), 0.5);
  c.lineWidth = 2.6;
  for (let i = 0; i < 7; i++) {
    c.beginPath();
    c.moveTo(46, 608 + i * 10);
    c.quadraticCurveTo(95, 604 + i * 10, 144, 608 + i * 10);
    c.stroke();
  }
}

/** L6: the black post framing the right edge (a squared post with a chamfer cut-line on its lit edge) */
function post(c: C, env: PaintEnv) {
  const x = WB.post.x;
  c.fillStyle = env.fill('fg');
  c.fillRect(x, -400, 400, 1500);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(x + 1, -400);
  c.lineTo(x + 1, 1100);
  c.stroke();
  // a bracket and a bolt at bench height
  c.fillStyle = env.fill('fg');
  c.fillRect(x - 26, 520, 30, 18);
}

/** the small card clipped to the post (CARD_LAYER: sharp), its lines in mono, right-aligned at the post */
export function postCard(c: C, env: PaintEnv, o: { paper: number; texts: CardText[]; id?: string; width?: number; keepIn?: boolean }) {
  const font = (sz: number) => `500 ${sz}px ${FONT.mono}`;
  const size = legibleSize(c, font(25), 25);
  c.save();
  c.font = font(size);
  // the card fits the text that is showing (a swap resizes it smoothly, weighted by each text's ink)
  const lineH = size * 1.42;
  let sw = 0;
  let sh = 0;
  let wsum = 0;
  let maxN = 1;
  for (const tx of o.texts) {
    const k = Array.isArray(tx.ink) ? Math.max(0, ...tx.ink) : tx.ink;
    let tw = 0;
    for (const l of tx.lines) tw = Math.max(tw, c.measureText(l).width);
    maxN = Math.max(maxN, tx.lines.length);
    if (k <= 0.001) continue;
    sw += k * tw;
    sh += k * tx.lines.length;
    wsum += k;
  }
  const textW = wsum > 0 ? sw / wsum : 0;
  const nLines = wsum > 0 ? sh / wsum : 1;
  const w = Math.max(o.width ?? 0, textW + 44);
  const h = nLines * lineH + 30;
  void maxN;
  let right = WB.card.right;
  let y = WB.card.top;
  if (o.keepIn) {
    // review r1: through a push-in the near card would slide off the frame's edge; hold it inside the safe area
    // (right edge <= 1244 px, top >= 30 px on the 1280 x 720 stage) by sliding it along the post
    const m = c.getTransform();
    const sx = c.canvas.width / 1280;
    const sy = c.canvas.height / 720;
    if (m.a > 0 && m.d > 0) {
      const devRight = m.a * right + m.c * y + m.e;
      const maxRight = 1244 * sx;
      if (devRight > maxRight) right -= (devRight - maxRight) / m.a;
      const devTop = m.b * right + m.d * y + m.f;
      const minTop = 30 * sy;
      if (devTop < minTop) y += (minTop - devTop) / m.d;
    }
  }
  const x = right - w;
  const rot = -0.012;
  c.translate(x + w, y);
  c.rotate(rot);
  c.translate(-(x + w), -y);
  c.globalAlpha *= o.paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.4);
  c.fillRect(x + 5, y + 6, w, h);
  c.fillStyle = paperOf(env, -0.02);
  c.fillRect(x, y, w, h);
  // a pinhole and a faint rule under the first line
  c.strokeStyle = withAlpha(inkOf(env), 0.18);
  c.lineWidth = lw(c, 1);
  c.strokeRect(x + 6, y + 6, w - 12, h - 12);
  let firstInk = 0;
  textRole(c, 'subject', () => {
    c.font = font(size);
    c.textBaseline = 'alphabetic';
    c.textAlign = 'center';
    o.texts.forEach((tx, ti) => {
      tx.lines.forEach((l, i) => {
        const a = Array.isArray(tx.ink) ? tx.ink[i] ?? 0 : tx.ink;
        if (i === 0) firstInk = Math.max(firstInk, a);
        if (a <= 0) return;
        c.fillStyle = withAlpha(inkOf(env), a);
        c.fillText(l, x + w / 2, y + 15 + lineH * (i + 0.78));
      });
      const a0 = Array.isArray(tx.ink) ? Math.max(0, ...tx.ink) : tx.ink;
      textProbe(c, `${o.id ?? 'wbcard'}-t${ti}`, x, y, w, h, a0);
    });
    c.textAlign = 'left';
  });
  cardProbe(c, o.id ?? 'wbcard', x, y, w, h, 1, firstInk);
  c.globalAlpha = 1;
  // the bulldog clip on the post, over the card's corner
  const cx = x + w - 18;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(cx - 20, y - 10);
  c.lineTo(cx + 26, y - 10);
  c.lineTo(cx + 22, y + 18);
  c.lineTo(cx - 16, y + 18);
  c.closePath();
  c.fill();
  c.strokeStyle = rimOf(env, 0.6);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.moveTo(cx - 20, y - 10);
  c.lineTo(cx + 26, y - 10);
  c.moveTo(cx - 8, y - 10);
  c.quadraticCurveTo(cx + 2, y - 30, cx + 12, y - 10);
  c.stroke();
  c.restore();
}

/** layers re-exported for the shots */
export const WB_LAYERS = { CARD: CARD_LAYER, L4: LAYERS.L4 };
