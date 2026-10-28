/**
 * ch05-s06 — the cold furnace: the GPU question planted.
 *
 * A paper foundry beside the matmul loom, in emberRed (low chroma; the chapter's only warm red, the furnace's own
 * light). The ch05 tag-line staging (THROUGH THE LOOM, 64 % frame height): the copper line runs in front of the loom
 * (L3, sets/matmulLoom from the real export, quietly running: a forward wave of light crosses its 130 frames every
 * 3.2 s from 'cpu' on) past the loom's END POST (L4, the red pencil resting on its peg) to an iron bracket on the
 * furnace's chimney; the stretch of line over the furnace is empty (tags 7-11 are not tied yet; the tags hang where
 * sets/tagLine tagsAt('ch05-s06') puts them). Depth: the foundry's arched window wall at L2, fog, the loom at L3, fog,
 * the action plane at L4 (post, line, furnace, threads, watches), a blurred hanging chain at L5.
 *
 * CAMERA (camera on ones, slow): opens on the loom's end post with the line and its tags across the top; from 1.3 s a
 * slow 5 s crane down and right to the furnace (M: the line and tags rise out of the top); from 9.8 s a gentle push
 * toward the furnace's mouth for 'one after another' (M2); from 14.3 s it lifts back up (F) so the empty stretch of
 * copper line hangs over the cooling furnace for 'Hang that on the line', and holds from 17.9 s.
 *
 * BEATS (all on the locked clock's words):
 *   'cpu' (0.5): a small brass PROCESSOR EMBLEM (a chip silhouette, pins, no lettering) slides onto the loom's end
 *     post and seats with a glint; the loom's wave starts: the loom is what runs, as JavaScript on the processor [CM04].
 *     The emblem catches each wave as it reaches the post.
 *   'gpu' ('graphics', 4.61): fourteen of the loom's threads run from the post into the furnace's mouth (they draw
 *     out over 0.8 s), the furnace roars (glow up, embers rise into the haze, the bellows pump), its OUTPUT GAUGE only
 *     crawls; the date stamp 16 SEP 2026 and the scope plate 'an older 14,019-operation build · one machine' slide in
 *     at the lower left and stay for the shot.
 *   'slow' ('fifteen', 6.87): THREE STOPWATCHES drop in on chains above the furnace, numeral-free; they start
 *     together and each hand sweeps at one common rate, so each stops at an angle in proportion to its measured time
 *     (2.2 ms -> 330 deg; 81 us -> 12 deg; ~140 us -> 21 deg): the two processor watches (Bun, then Chrome, a little
 *     slower) stop almost at once, the furnace's GPU watch sweeps on and on. The equation is set beneath them, each
 *     figure under its own watch: 'WebGPU 2.2 ms · CPU 81 µs (Bun) · ~140 µs (Chrome)' (one run, compared together
 *     [CM08]).
 *   'serial' ('after', 10.53): inside the mouth, in the push-in, the fed threads pass ONE AT A TIME in single file:
 *     the threads converge on one entry, a bead of light crosses the firebed alone along one groove (the grate's other
 *     grooves stay empty), the next waits its turn in the queue at the lip [CM08: one table's steps in a line in one
 *     shader]. (The single file runs from the first feed on; the push makes it legible.)
 *   'cool' ('for', 15.13): the furnace cools: the embers thin and go out, the glow drains from red to ash grey, the
 *     queue stops; the camera lifts to the copper line where nothing is tied yet (the question is spoken, not
 *     written); the loom keeps quietly working beside it. On 'line' the copper catches a little light.
 * TEXT: the date stamp and the scope plate (screen-locked, lower left, from 'gpu' to the end) and the equation under
 * the watches ('slow' to the lift). Tag fronts are texture. One accent: the furnace's ember glow (the GPU watch's
 * wedge borrows it).
 */
import { Timeline, ease } from '../../../core';
import {
  FONT,
  PUPPET_NEAR_BLACK,
  cam3Interp,
  defineShot,
  embers,
  legibleSize,
  mixLab,
  softPlate,
  textColor,
  textRole,
  windowWall,
  withAlpha,
} from '../../../film';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { LINE, drawLine, drawTags, lineYFor, tagsAt, type TagState } from '../sets/tagLine';
import { drawPencil } from '../sets/narratorHands';
import { matmulLoom, loomGeom } from '../sets/matmulLoom';
import { OS_COLORS } from '../sets/circuit';

const ID = 'ch05-s06';

// ---------------------------------------------------------------- camera (L4 world)
const O: Camera3 = { x: 820, y: 680, z: 150, lens: 1 };
const M: Camera3 = { x: 960, y: 880, z: 160, lens: 1 };
const M2: Camera3 = { x: 1010, y: 900, z: 240, lens: 1 };
const F: Camera3 = { x: 960, y: 720, z: 110, lens: 1 };

// ---------------------------------------------------------------- geography (L4 world unless noted)
/** the ch05 line height (staging.tagLine.variants: 64 %), as an offset from the canonical line */
const LINE_DY = lineYFor(ID) - LINE.y;
const LINE_Y = LINE.y + LINE_DY;
const POST = { x: 790, top: 392, floor: 1080 };
const EMBLEM = { x: POST.x, y: 760, s: 25 };
const FLOOR_Y = 1080;
/** the kiln: a squat domed brick body on a plinth, an arched mouth, a chimney at the right shoulder */
const KILN = { x0: 975, x1: 1245, crown: 818, shoulder: 885, base: 1040 };
const PLINTH = { x0: 955, x1: 1265, y0: 1040, y1: FLOOR_Y };
const MOUTH = { cx: 1110, hw: 62, spring: 940, rise: 50, sill: 1002 };
const CHIM = { x0: 1222, x1: 1262 };
const GAUGE = { x: 1018, y: 884, r: 19 };
/** where the fed threads leave the post and where they enter the mouth (one entry: single file) */
const ENTRY = { x: MOUTH.cx - MOUTH.hw + 4, y: 972 };
const N_THREADS = 14;
/** the loom behind (L3 rest coordinates) */
const LOOM3 = { x: 120, y: 520, w: 620, h: 440 };
/** watches and equation (a plane just in front of L4, unblurred, after the rim pass) */
const WATCH_L: LayerSpec = { id: `${ID}-watches`, z: 990, haze: 0, blur: 0 };
const EMBER_L: LayerSpec = { id: `${ID}-embers`, z: 985, haze: 0, blur: 0 };
const WATCH_Y = 695;
const WATCH_R = 42;
const EQ_CX = 1019;
const EQ_Y = 792;
const EQ_FONT = `500 21px ${FONT.text}`;
const EQ_SEGS = ['WebGPU 2.2 ms', 'CPU 81 µs (Bun)', '~140 µs (Chrome)'] as const;
const EQ_SEP = ' · ';
/** measured times (CM08), microseconds; a common sweep rate maps the slowest to 330 degrees */
const TIMES_US = [2200, 81, 140];
const SWEEP_MAX = 330;
const SWEEP_DUR = 2.0;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const hashN = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

interface Beats {
  cpu: number;
  gpu: number;
  slow: number;
  serial: number;
  cool: number;
  line: number;
  D: number;
}

export default defineShot({
  id: ID,
  mood: 'emberRed',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', O, cam3Interp);
    tl.tween(cam, M, { at: 1.3, dur: 5.1, ease: ease.move });
    tl.tween(cam, M2, { at: 9.8, dur: 3.2, ease: ease.move });
    tl.tween(cam, F, { at: 14.3, dur: 3.6, ease: ease.move });
    tl.hold(0, T.duration);
    const b: Beats = {
      cpu: T.beat('cpu'),
      gpu: T.beat('gpu'),
      slow: T.beat('slow'),
      serial: T.beat('serial'),
      cool: T.beat('cool'),
      line: T.word('L0510', 'line'),
      D: T.duration,
    };
    return { tl, cam, b };
  },
  paint(f, s, sc) {
    const t = f.t;
    const b = sc.b as Beats;
    f.camera(t <= 0 ? O : s.get(sc.cam));

    // ---- states (light on ones, cut-paper motion on twos)
    const tq = f.tq;
    const roar = smooth((t - b.gpu) / 0.7);
    const cooled = easeOut((t - b.cool) / 2.4);
    const flick = 0.06 * Math.sin(t * 23.1) * Math.sin(t * 7.3 + 1.1);
    const heat = Math.max(0.05, (0.26 + 0.74 * roar + flick * roar) * (1 - 0.94 * cooled));
    const feed = smooth((t - b.gpu) / 0.8);
    const emblemIn = smooth((t - (b.cpu - 0.05)) / 0.4);
    const wave = t < b.cpu ? undefined : ((t - b.cpu) / 3.2) % 1;
    const watchA = smooth((t - (b.slow - 0.3)) / 0.25) * (1 - smooth((t - 14.75) / 0.6));
    const plateU = smooth((t - b.gpu) / 0.55);
    const lineGlow = 0.45 + 0.25 * smooth((t - (b.line - 0.3)) / 0.5) * (1 - smooth((t - b.line - 0.6) / 1.2));

    f.backlight({ sunX: 900, intensity: 0.82 });

    // L2: the foundry's arched window wall
    f.layer('L2', (c, env) => foundryWall(f, c, env));
    f.fog('A');

    // L3: the loom behind, quietly running, and its floor
    f.layer('L3', (c, env) => {
      matmulLoom(f, c, env, { ...LOOM3, wave, gates: true, threads: 0.85, key: ID });
      loomFloor(c, env);
    });
    f.fog('B');

    // L4: the action plane
    f.layer('L4', (c, env) => {
      floor(f, c, env, heat);
      endPost(f, c, env);
      emblem(c, env, emblemIn, t, b, wave);
      kilnInside(c, env, heat, t, tq, b, cooled);
      kiln(f, c, env);
      bellows(c, env, tq, roar * (1 - cooled));
      gauge(c, env, t, tq, b, roar, cooled);
      feedThreads(c, env, feed, t, b, cooled);
      queue(c, env, t, tq, b, cooled);
      // the copper line (ch05 height) with its tags, tied off on the chimney's bracket
      c.save();
      c.translate(0, LINE_DY);
      drawLine(c, env, { posts: 'none', glow: lineGlow });
      drawTags(c, env, TAG_STATES, { tq: env.tq, pencil: 'none' });
      c.restore();
      chimneyBracket(c, env);
      // the red pencil resting on the loom's end post (staging.tagLine.variants ch05)
      drawPencil(c, { x: POST.x - 44, y: LINE_Y + 82 }, Math.PI - 0.1, 86, env);
    });
    f.rim({ x: 0, y: -1 });
    // the mouth's light (painted after L4: it wraps the kiln's lip, the post and the threads)
    f.practical({ x: MOUTH.cx, y: 960, kind: 'lamp', seed: 61, intensity: 0.25 + 0.75 * heat, radius: 64 + 26 * heat });

    // embers rising from the mouth into the haze (on ones: light)
    f.layer(EMBER_L, (c, env) => {
      embers(c, { x: MOUTH.cx, y: MOUTH.spring - MOUTH.rise + 6, spread: 120, count: 30, rise: 55, life: 2.6, wind: 5, size: 1.1, intensity: Math.max(0, heat - 0.2) * 1.15, salt: 506 }, env);
    });

    // L5: a hanging chain, near and soft, sliding across the left of frame
    f.layer('L5', (c, env) => nearChain(f, c, env));

    // the stopwatches and the equation
    if (watchA > 0.002) f.layer(WATCH_L, (c, env) => watches(c, env, t, tq, b, watchA));

    // screen-locked: the date stamp and the scope plate, lower left
    if (plateU > 0.002) scopePlate(f, plateU);
  },
});

/** the tags on the line as the film has left them by this shot, each with its own slow swing */
const TAG_STATES: TagState[] = tagsAt(ID, 'end').map((st, i) => ({ ...st, swing: 0.018, phase: i * 1.37 }));

// ---------------------------------------------------------------- palette helpers
const brass = (env: PaintEnv, lift = 0) => mixLab(mixLab('#b08d4a', env.mood.halo, 0.28), '#f3dfae', lift);
const ash = (env: PaintEnv) => mixLab(env.mood.haze, '#7c7874', 0.55);
/** the fire's colour at a heat (drains to ash grey as it cools) */
const fire = (env: PaintEnv, heat: number, k: number) => {
  const hot = mixLab(env.mood.halo, env.mood.core, k);
  return mixLab(ash(env), hot, clamp01(heat * 1.15));
};

function lw(c: CanvasRenderingContext2D, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}

// ---------------------------------------------------------------- L2 / L3
function foundryWall(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv) {
  const X0 = 40, Y0 = 120, W = 1560, H = 1000;
  f.cached(`${ID}/L2/${env.mood.id}`, W, H, (cc) => {
    cc.translate(-X0, -Y0);
    windowWall(cc, {
      x: X0, y: Y0, w: W, h: H, centers: [250, 600, 950, 1300], winW: 196, apex: 250, sill: 800,
      shape: 'round', lights: 2, panes: { cols: 2, rows: 7 }, transoms: [], tracery: 'none', spandrel: 'none',
      pilasters: true, cornice: 44, wainscot: 150, glass: 0.55, seed: 61,
    }, env);
    // the foundry floor far behind, dark
    cc.fillStyle = mixLab(env.fill('set'), env.mood.ink, 0.35);
    cc.fillRect(X0, 960, W, Y0 + H - 960);
  })(c, X0, Y0);
}

function loomFloor(c: CanvasRenderingContext2D, env: PaintEnv) {
  const g = c.createLinearGradient(0, 990, 0, 1220);
  g.addColorStop(0, mixLab(env.fill('set'), env.fill('ink'), 0.4));
  g.addColorStop(1, env.fill('ink'));
  c.fillStyle = g;
  c.fillRect(-200, 990, 1900, 260);
}

// ---------------------------------------------------------------- L4: floor, post, emblem
function floor(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, heat: number) {
  f.cached(`${ID}/floor/${env.mood.id}`, 1700, 420, (cc) => {
    cc.translate(100, -FLOOR_Y);
    const g = cc.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y + 420);
    g.addColorStop(0, mixLab(env.mood.ink, env.mood.set, 0.35));
    g.addColorStop(1, PUPPET_NEAR_BLACK);
    cc.fillStyle = g;
    cc.fillRect(-100, FLOOR_Y, 1700, 420);
    // flagstone seams running back toward the wall
    cc.strokeStyle = withAlpha(env.mood.rim, 0.07);
    cc.lineWidth = 1;
    cc.beginPath();
    for (let i = -10; i <= 22; i++) {
      const bx = 1100 + i * 90;
      cc.moveTo(1100 + (bx - 1100) * 0.55, FLOOR_Y);
      cc.lineTo(bx, FLOOR_Y + 420);
    }
    for (const y of [FLOOR_Y + 30, FLOOR_Y + 80, FLOOR_Y + 160, FLOOR_Y + 290]) {
      cc.moveTo(-100, y);
      cc.lineTo(1600, y);
    }
    cc.stroke();
  })(c, -100, FLOOR_Y);
  // the mouth's light pooling on the flagstones
  const r = 260 + 120 * heat;
  const g = c.createRadialGradient(MOUTH.cx, FLOOR_Y + 8, 0, MOUTH.cx, FLOOR_Y + 8, r);
  g.addColorStop(0, withAlpha(fire(env, heat, 0.3), 0.3 * heat));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g;
  c.fillRect(MOUTH.cx - r, FLOOR_Y, 2 * r, r * 0.6);
  c.restore();
}

/** the loom's end post: a tall turned post with collars, a peg for the pencil and a mounting plate */
function endPost(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv) {
  f.cached(`${ID}/post/${env.mood.id}`, 80, FLOOR_Y - POST.top + 40, (cc) => {
    cc.translate(-(POST.x - 40), -(POST.top - 20));
    const x = POST.x;
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.beginPath();
    cc.ellipse(x, POST.top - 6, 9, 11, 0, 0, Math.PI * 2);
    cc.rect(x - 4, POST.top + 2, 8, 8);
    cc.rect(x - 11, POST.top + 9, 22, 7);
    cc.rect(x - 7, POST.top + 14, 14, FLOOR_Y - POST.top - 14);
    // collars and the base
    for (const y of [LINE_Y - 14, 640, 980]) cc.rect(x - 10, y, 20, 7);
    cc.rect(x - 16, FLOOR_Y - 26, 32, 26);
    cc.rect(x - 12, FLOOR_Y - 34, 24, 9);
    // the pencil's peg (a short arm to the left)
    cc.rect(x - 22, LINE_Y + 84, 18, 4);
    // the emblem's mounting plate
    cc.rect(x - 15, EMBLEM.y - 34, 30, 68);
    cc.fill();
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
    cc.lineWidth = 1.6;
    cc.beginPath();
    cc.arc(x, POST.top - 6, 9, Math.PI * 1.1, Math.PI * 1.9);
    cc.moveTo(x - 10, 640);
    cc.lineTo(x + 10, 640);
    cc.moveTo(x - 10, 980);
    cc.lineTo(x + 10, 980);
    cc.stroke();
  })(c, POST.x - 40, POST.top - 20);
}

/** the brass processor emblem: a chip silhouette (package, pins on four sides, the die), no lettering */
function emblem(c: CanvasRenderingContext2D, env: PaintEnv, u: number, t: number, b: Beats, wave: number | undefined) {
  if (u <= 0) return;
  const s = EMBLEM.s;
  // slides in from the right and seats (on twos), with a small overshoot
  const k = clamp01(u);
  const dx = (1 - k) * 34 - Math.sin(k * Math.PI) * 3;
  const glint = Math.exp(-Math.max(0, t - (b.cpu + 0.4)) * 3.5) * (t > b.cpu + 0.4 ? 1 : 0);
  // the wave reaching the post lights the emblem a little (the loom runs on it)
  const near = wave === undefined ? 0 : Math.max(0, 1 - Math.abs(wave - 0.97) / 0.06);
  const lift = 0.15 + 0.5 * glint + 0.35 * near;
  c.save();
  c.globalAlpha = k;
  c.translate(EMBLEM.x + dx, EMBLEM.y);
  const body = brass(env, lift * 0.5);
  // pins
  c.fillStyle = mixLab(body, env.mood.ink, 0.25);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const p = -s * 0.62 + (i * s * 1.24) / (n - 1);
    c.fillRect(p - 1.6, -s - 6, 3.2, 7);
    c.fillRect(p - 1.6, s - 1, 3.2, 7);
    c.fillRect(-s - 6, p - 1.6, 7, 3.2);
    c.fillRect(s - 1, p - 1.6, 7, 3.2);
  }
  // package
  c.fillStyle = body;
  c.beginPath();
  c.roundRect(-s, -s, 2 * s, 2 * s, 3);
  c.fill();
  // the die, inset, and an index notch
  c.fillStyle = mixLab(body, env.mood.ink, 0.45);
  c.fillRect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9);
  c.strokeStyle = withAlpha(mixLab(body, '#fff4d8', 0.5), 0.7);
  c.lineWidth = lw(c, 1.2);
  c.strokeRect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9);
  c.fillStyle = mixLab(body, env.mood.ink, 0.5);
  c.beginPath();
  c.arc(-s * 0.72, -s * 0.72, 2.6, 0, Math.PI * 2);
  c.fill();
  // top edge catches the light
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.8);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(-s + 2, -s);
  c.lineTo(s - 2, -s);
  c.stroke();
  if (lift > 0.2) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(-s * 0.3, -s * 0.4, 0, -s * 0.3, -s * 0.4, s * 1.6);
    g.addColorStop(0, withAlpha(brass(env, 0.7), 0.35 * (lift - 0.15)));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(-s * 2, -s * 2, s * 4, s * 4);
  }
  c.restore();
}

// ---------------------------------------------------------------- the kiln
function mouthPath(inset = 0): Path2D {
  const p = new Path2D();
  const x0 = MOUTH.cx - MOUTH.hw + inset, x1 = MOUTH.cx + MOUTH.hw - inset;
  p.moveTo(x0, MOUTH.sill);
  p.lineTo(x0, MOUTH.spring);
  p.ellipse(MOUTH.cx, MOUTH.spring, MOUTH.hw - inset, MOUTH.rise - inset, 0, Math.PI, 0);
  p.lineTo(x1, MOUTH.sill);
  p.closePath();
  return p;
}
const VENTS = [1040, 1075, 1110, 1145, 1180].map((x) => ({ x, y: 846 + Math.abs(x - 1110) * 0.22 }));

/** the kiln silhouette (cached): body with the mouth and the crown's vents cut through, plinth, chimney, door */
function kiln(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv) {
  const X0 = 940, Y0 = -260, W = 340, H = FLOOR_Y - Y0 + 4;
  f.cached(`${ID}/kiln/${env.mood.id}`, W, H, (cc) => {
    cc.translate(-X0, -Y0);
    const ink = mixLab(PUPPET_NEAR_BLACK, env.mood.ink, 0.5);
    const p = new Path2D();
    p.moveTo(KILN.x0, KILN.base);
    p.lineTo(KILN.x0, KILN.shoulder);
    p.bezierCurveTo(KILN.x0, 842, 1058, KILN.crown, MOUTH.cx, KILN.crown);
    p.bezierCurveTo(1162, KILN.crown, KILN.x1, 842, KILN.x1, KILN.shoulder);
    p.lineTo(KILN.x1, KILN.base);
    p.closePath();
    p.addPath(mouthPath());
    for (const v of VENTS) {
      p.moveTo(v.x + 4.5, v.y);
      p.arc(v.x, v.y, 4.5, 0, Math.PI * 2);
    }
    cc.fillStyle = ink;
    cc.fill(p, 'evenodd');
    // plinth and chimney
    cc.beginPath();
    cc.rect(PLINTH.x0, PLINTH.y0, PLINTH.x1 - PLINTH.x0, PLINTH.y1 - PLINTH.y0);
    cc.rect(PLINTH.x0 - 6, PLINTH.y0 - 6, PLINTH.x1 - PLINTH.x0 + 12, 8);
    cc.rect(CHIM.x0, Y0, CHIM.x1 - CHIM.x0, 900 - Y0);
    cc.rect(CHIM.x0 - 7, 846, CHIM.x1 - CHIM.x0 + 14, 14);
    for (let y = 700; y > Y0; y -= 150) cc.rect(CHIM.x0 - 4, y, CHIM.x1 - CHIM.x0 + 8, 8);
    cc.fill();
    // the iron door, swung open to the left of the mouth (in perspective: a narrow slab)
    cc.beginPath();
    cc.moveTo(MOUTH.cx - MOUTH.hw - 2, MOUTH.spring - MOUTH.rise * 0.7);
    cc.lineTo(MOUTH.cx - MOUTH.hw - 34, MOUTH.spring - MOUTH.rise * 0.55);
    cc.lineTo(MOUTH.cx - MOUTH.hw - 34, MOUTH.sill - 6);
    cc.lineTo(MOUTH.cx - MOUTH.hw - 2, MOUTH.sill);
    cc.closePath();
    cc.fill();
    // cut-lines: brick courses on the body (faint), voussoirs round the mouth, the crown's top edge, the plinth lip
    cc.save();
    cc.clip(p, 'evenodd');
    cc.strokeStyle = withAlpha(env.mood.rim, 0.08);
    cc.lineWidth = 1;
    cc.beginPath();
    for (let y = 864, r = 0; y < KILN.base; y += 19, r++) {
      cc.moveTo(KILN.x0, y);
      cc.lineTo(KILN.x1, y);
      for (let x = KILN.x0 + (r % 2 ? 18 : 0); x < KILN.x1; x += 36) {
        cc.moveTo(x, y);
        cc.lineTo(x, y + 19);
      }
    }
    cc.stroke();
    cc.restore();
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.42);
    cc.lineWidth = 1.4;
    cc.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      const ca = Math.cos(a), sa = Math.sin(a);
      cc.moveTo(MOUTH.cx + ca * (MOUTH.hw + 2), MOUTH.spring + sa * (MOUTH.rise + 2));
      cc.lineTo(MOUTH.cx + ca * (MOUTH.hw + 15), MOUTH.spring + sa * (MOUTH.rise + 15));
    }
    cc.stroke();
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6);
    cc.lineWidth = 2;
    cc.beginPath();
    cc.moveTo(KILN.x0, KILN.shoulder);
    cc.bezierCurveTo(KILN.x0, 842, 1058, KILN.crown, MOUTH.cx, KILN.crown);
    cc.bezierCurveTo(1162, KILN.crown, KILN.x1, 842, KILN.x1, KILN.shoulder);
    cc.moveTo(PLINTH.x0 - 6, PLINTH.y0 - 6);
    cc.lineTo(PLINTH.x1 + 6, PLINTH.y0 - 6);
    cc.stroke();
  })(c, X0, Y0);
}

/**
 * Inside the kiln, painted BEFORE its silhouette so it shows only through the mouth and the crown's vents: the fire's
 * glow (drains to ash grey on 'cool'), the firebed with its grate grooves, and the single file: one bead of light
 * crossing the bed along the middle groove at a time.
 */
function kilnInside(c: CanvasRenderingContext2D, env: PaintEnv, heat: number, t: number, tq: number, b: Beats, cooled: number) {
  const cx = MOUTH.cx;
  // the cavity behind everything: dark, then the glow
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.2);
  c.fillRect(KILN.x0 + 4, 830, KILN.x1 - KILN.x0 - 8, MOUTH.sill - 830);
  const g = c.createRadialGradient(cx, 975, 4, cx, 960, 150);
  g.addColorStop(0, withAlpha(fire(env, heat, 0.75), 0.95));
  g.addColorStop(0.35, withAlpha(fire(env, heat, 0.35), 0.85));
  g.addColorStop(1, withAlpha(fire(env, heat * 0.6, 0), 0.25 + 0.3 * heat));
  c.fillStyle = g;
  c.fillRect(KILN.x0 + 4, 830, KILN.x1 - KILN.x0 - 8, MOUTH.sill - 830);
  // the back wall's flame tongues (cut paper, on twos)
  c.fillStyle = withAlpha(fire(env, heat, 0.9), 0.55 * heat);
  c.beginPath();
  for (let i = 0; i < 7; i++) {
    const x = cx - 52 + i * 17;
    const h = (22 + 18 * hashN(i * 3.1 + Math.floor(tq * 12) * 0.37)) * heat;
    c.moveTo(x - 7, 992);
    c.quadraticCurveTo(x - 3, 992 - h * 0.6, x + 1 + 3 * Math.sin(tq * 9 + i), 992 - h);
    c.quadraticCurveTo(x + 4, 992 - h * 0.5, x + 8, 992);
  }
  c.fill();
  // the firebed: a grate of five grooves; only the middle one is ever used
  const gy = [956, 966, 976, 986];
  c.strokeStyle = withAlpha(mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.3), 0.9);
  c.lineWidth = 3.2;
  c.beginPath();
  for (const y of gy) {
    c.moveTo(cx - MOUTH.hw, y + 5);
    c.lineTo(cx + MOUTH.hw, y + 5);
  }
  c.stroke();
  // the active groove glows faintly once the feed is on
  const on = smooth((t - b.gpu - 0.6) / 0.6) * (1 - cooled);
  if (on > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(fire(env, heat, 0.6), 0.35 * on);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - MOUTH.hw, ENTRY.y);
    c.lineTo(cx + MOUTH.hw, ENTRY.y);
    c.stroke();
    // the bead crossing alone
    const bd = beadAt(t, b);
    if (bd) {
      const x = cx - MOUTH.hw + 2 + bd.u * (MOUTH.hw * 2 - 4);
      const col = bd.k % 3 === 2 ? mixLab(OS_COLORS.indigo, env.mood.core, 0.55) : mixLab(OS_COLORS.copper, env.mood.core, 0.55);
      const gl = c.createRadialGradient(x, ENTRY.y, 0, x, ENTRY.y, 16);
      gl.addColorStop(0, withAlpha(mixLab(col, '#fff4dc', 0.4), 0.9 * on));
      gl.addColorStop(1, withAlpha(col, 0));
      c.fillStyle = gl;
      c.fillRect(x - 16, ENTRY.y - 16, 32, 32);
      c.fillStyle = withAlpha(mixLab(col, '#fff4dc', 0.6), on);
      c.beginPath();
      c.arc(x, ENTRY.y, 3.6, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
}

/** the single file: bead k enters at FEED0 + k·P and crosses in P seconds (stepping on twos); stops on 'cool' */
const BEAD_P = 0.5;
function beadAt(t: number, b: Beats): { k: number; u: number } | null {
  const t0 = b.gpu + 0.9;
  const tq = Math.floor(t * 12) / 12;
  if (tq < t0 || tq > b.cool + 0.6) return null;
  const k = Math.floor((tq - t0) / BEAD_P);
  return { k, u: ((tq - t0) - k * BEAD_P) / BEAD_P };
}

/** the queue at the lip: the beads waiting their turn nose to tail on the one entry (in front of the kiln) */
function queue(c: CanvasRenderingContext2D, env: PaintEnv, t: number, tq: number, b: Beats, cooled: number) {
  const on = smooth((t - b.gpu - 0.6) / 0.6);
  if (on <= 0) return;
  const bd = beadAt(t, b);
  // each step the queue shuffles forward one place (eased over the first third of the step, on twos)
  const stepU = bd ? smooth(bd.u * 3) : 1;
  const k0 = bd ? bd.k : 0;
  const heatA = 1 - 0.7 * cooled;
  c.save();
  for (let j = 0; j < 6; j++) {
    const slot = j + 1 - stepU;
    const p = threadPoint(7, 1 - slot * 0.055);
    const col = (k0 + 1 + j) % 3 === 2 ? mixLab(OS_COLORS.indigo, env.mood.rim, 0.45) : mixLab(OS_COLORS.copper, env.mood.rim, 0.4);
    c.fillStyle = withAlpha(col, on * heatA * (1 - j * 0.11));
    c.beginPath();
    c.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** a point on fed thread i at u (0 = at the post, 1 = at the one entry) */
function threadPoint(i: number, u: number): { x: number; y: number } {
  const p0 = { x: POST.x + 8, y: 792 + i * 8 };
  const p1 = ENTRY;
  const cx = (p0.x + p1.x) / 2 + 20, cy = Math.max(p0.y, p1.y) + 46 - i * 1.5;
  const v = 1 - u;
  return { x: v * v * p0.x + 2 * v * u * cx + u * u * p1.x, y: v * v * p0.y + 2 * v * u * cy + u * u * p1.y };
}

/** the loom's threads fed from the post into the kiln (drawn out on 'gpu'), pulses of light running in along them */
function feedThreads(c: CanvasRenderingContext2D, env: PaintEnv, feed: number, t: number, b: Beats, cooled: number) {
  if (feed <= 0) return;
  const steps = 28;
  const run = 1 - cooled;
  c.save();
  for (let i = 0; i < N_THREADS; i++) {
    const sub = i % 3 === 2;
    const col = sub ? mixLab(OS_COLORS.indigo, env.mood.rim, 0.45) : mixLab(OS_COLORS.copper, env.mood.rim, 0.42);
    const d = clamp01(feed * 1.15 - i * 0.012);
    c.strokeStyle = withAlpha(col, 0.55 + 0.1 * run);
    c.lineWidth = lw(c, 1.2);
    c.beginPath();
    for (let k = 0; k <= steps * d; k++) {
      const p = threadPoint(i, k / steps);
      if (k === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    }
    c.stroke();
    // a pulse running in toward the kiln
    if (run > 0.02 && d >= 1) {
      const ph = ((t - b.gpu) / 1.7 + i * 0.237) % 1;
      const p = threadPoint(i, ph);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(mixLab(col, '#fff0d8', 0.45), 0.6 * run * Math.sin(ph * Math.PI));
      c.beginPath();
      c.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }
  c.restore();
}

/** a cut-paper bellows on the kiln's left, pumping on twos while it roars */
function bellows(c: CanvasRenderingContext2D, env: PaintEnv, tq: number, pump: number) {
  const ang = 0.16 + 0.12 * pump * (0.5 + 0.5 * Math.sin(tq * 2 * Math.PI * 1.1));
  const hx = 978, hy = 1016;
  c.save();
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.ink, 0.5);
  c.beginPath();
  // nozzle into the kiln's side
  c.rect(hx - 6, hy - 3, 10, 6);
  // lower board, resting on the floor
  c.moveTo(hx - 4, hy + 2);
  c.lineTo(hx - 70, FLOOR_Y - 8);
  c.lineTo(hx - 74, FLOOR_Y - 2);
  c.lineTo(hx - 2, hy + 8);
  c.closePath();
  c.fill();
  // the upper board, hinged at the nozzle, and the leather between (on twos)
  const ex = hx - 4 - Math.cos(ang) * 74, ey = hy + 2 + Math.sin(-ang) * 74 + 22;
  c.beginPath();
  c.moveTo(hx - 4, hy - 2);
  c.lineTo(ex, ey - 6);
  c.lineTo(ex - 3, ey);
  c.lineTo(hx - 70, FLOOR_Y - 8);
  c.lineTo(hx - 4, hy + 2);
  c.closePath();
  c.fill();
  // the handle
  c.fillRect(ex - 18, ey - 5, 18, 4);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.moveTo(hx - 4, hy - 2);
  c.lineTo(ex, ey - 6);
  c.stroke();
  c.restore();
}

/** the output gauge on the kiln's face: no numerals; its needle only crawls while the kiln roars */
function gauge(c: CanvasRenderingContext2D, env: PaintEnv, t: number, tq: number, b: Beats, roar: number, cooled: number) {
  const { x, y, r } = GAUGE;
  const a0 = (-215 * Math.PI) / 180, span = (250 * Math.PI) / 180;
  const crawl = 0.085 * smooth((t - b.gpu - 0.3) / (b.cool - b.gpu)) + 0.004 * roar * (1 - cooled) * Math.sin(tq * 19);
  const a = a0 + span * Math.max(0, crawl);
  c.save();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(x, y, r + 4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(brass(env, 0.15), env.mood.ink, 0.25);
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7);
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  for (let i = 0; i <= 10; i++) {
    const q = a0 + (span * i) / 10;
    c.moveTo(x + Math.cos(q) * r * 0.72, y + Math.sin(q) * r * 0.72);
    c.lineTo(x + Math.cos(q) * r * 0.9, y + Math.sin(q) * r * 0.9);
  }
  c.stroke();
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = lw(c, 2.2);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82);
  c.stroke();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(x, y, 2.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** an iron bracket on the chimney: where the copper line is tied off */
function chimneyBracket(c: CanvasRenderingContext2D, env: PaintEnv) {
  const x1 = LINE.x1, y = LINE_Y;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.rect(x1 + 3, y - 2.5, CHIM.x0 - x1 - 3, 5);
  c.rect(CHIM.x0 - 4, y - 12, 6, 24);
  c.fill();
  c.strokeStyle = mixLab(OS_COLORS.copper, env.mood.rim, 0.45);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.arc(x1, y, 4, 0, Math.PI * 2);
  c.stroke();
}

// ---------------------------------------------------------------- L5
function nearChain(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv) {
  f.cached(`${ID}/chain/${env.mood.id}`, 60, 2600, (cc) => {
    cc.translate(30, 0);
    cc.strokeStyle = env.mood.fg;
    cc.lineWidth = 7;
    for (let y = 0, i = 0; y < 2480; y += 30, i++) {
      cc.beginPath();
      if (i % 2) cc.ellipse(0, y + 15, 4, 17, 0, 0, Math.PI * 2);
      else cc.ellipse(0, y + 15, 10, 17, 0, 0, Math.PI * 2);
      cc.stroke();
    }
    // the hook at the bottom
    cc.lineWidth = 12;
    cc.beginPath();
    cc.arc(-6, 2520, 24, -Math.PI * 0.5, Math.PI * 0.9);
    cc.stroke();
  })(c, 700 - 30, -500);
}

// ---------------------------------------------------------------- the stopwatches and the equation
function watches(c: CanvasRenderingContext2D, env: PaintEnv, t: number, tq: number, b: Beats, A: number) {
  c.save();
  c.font = EQ_FONT;
  const ws = EQ_SEGS.map((sg) => c.measureText(sg).width);
  const wSep = c.measureText(EQ_SEP).width;
  const total = ws[0] + ws[1] + ws[2] + 2 * wSep;
  const x0 = EQ_CX - total / 2;
  const centres = [x0 + ws[0] / 2, x0 + ws[0] + wSep + ws[1] / 2, x0 + ws[0] + wSep + ws[1] + wSep + ws[2] / 2];
  c.restore();
  const start = b.slow + 0.2;
  const rate = SWEEP_MAX / SWEEP_DUR;
  centres.forEach((x, i) => {
    // drop in on the chain (on twos), staggered, then settle with a small swing
    const td = tq - (b.slow - 0.32 + i * 0.07);
    const u = clamp01(td / 0.4);
    const back = 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2);
    const dy = -340 * (1 - back);
    const sway = 3.5 * Math.exp(-Math.max(0, td - 0.4) * 2.4) * Math.sin(Math.max(0, td - 0.4) * 7.5);
    const final = (TIMES_US[i] / TIMES_US[0]) * SWEEP_MAX;
    const ang = Math.min(final, Math.max(0, t - start) * rate);
    const stopped = t - start > final / rate;
    const click = stopped ? Math.exp(-(t - start - final / rate) * 6) : 0;
    stopwatch(c, env, x + sway, WATCH_Y + dy, ang, i === 0, click, A);
  });
  // the equation, each figure under its own watch, on a soft plate
  const inkA = smooth((t - (b.slow + 0.12)) / 0.35) * A;
  if (inkA > 0.002) {
    c.save();
    c.globalAlpha = inkA;
    softPlate(c, EQ_CX, EQ_Y - 7, total + 120, 64, env.mood.ink, 0.62);
    textRole(c, 'subject', () => {
      const sz = legibleSize(c, EQ_FONT, 21, 'W');
      c.font = `500 ${sz}px ${FONT.text}`;
      c.textBaseline = 'alphabetic';
      c.textAlign = 'left';
      c.fillStyle = textColor(env.mood);
      // re-measure at the drawn size so the figures stay centred under the watches
      const w2 = EQ_SEGS.map((sg) => c.measureText(sg).width);
      const s2 = c.measureText(EQ_SEP).width;
      const tot = w2[0] + w2[1] + w2[2] + 2 * s2;
      let x = EQ_CX - tot / 2;
      EQ_SEGS.forEach((sg, i) => {
        c.fillStyle = i === 0 ? mixLab(textColor(env.mood), env.mood.core, 0.35) : textColor(env.mood);
        c.fillText(sg, x, EQ_Y);
        x += w2[i];
        if (i < 2) {
          c.fillStyle = withAlpha(textColor(env.mood), 0.6);
          c.fillText(EQ_SEP, x, EQ_Y);
          x += s2;
        }
      });
    });
    c.restore();
  }
}

/** one numeral-free stopwatch: chain, crown and button, case, pale face with sixty ticks, the elapsed wedge, hand */
function stopwatch(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, deg: number, gpu: boolean, click: number, A: number) {
  const R = WATCH_R;
  c.save();
  c.globalAlpha = A;
  // the chain up out of frame
  c.strokeStyle = withAlpha(mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.3), 0.95);
  c.lineWidth = lw(c, 2.2);
  c.setLineDash([5, 3]);
  c.beginPath();
  c.moveTo(x, y - R - 16);
  c.lineTo(x, y - R - 700);
  c.stroke();
  c.setLineDash([]);
  // crown, bow and button
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.rect(x - 5, y - R - 12, 10, 10);
  c.moveTo(x + 7, y - R - 14);
  c.arc(x, y - R - 14, 7, 0, Math.PI * 2);
  c.rect(x + R * 0.62, y - R * 0.86, 8, 6);
  c.fill();
  // case
  c.beginPath();
  c.arc(x, y, R, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(gpu ? mixLab(env.mood.halo, env.mood.core, 0.3) : brass(env, 0.3), 0.75);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.arc(x, y, R - 1, Math.PI * 1.08, Math.PI * 1.92);
  c.stroke();
  // face
  const face = mixLab(mixLab('#eadcbc', env.mood.halo, 0.3), '#fff6e2', 0.15 * click);
  const r = R - 6;
  c.fillStyle = face;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  // the elapsed wedge: proportion only
  if (deg > 0.2) {
    c.fillStyle = gpu ? withAlpha(mixLab(env.mood.halo, env.mood.rim, 0.25), 0.78) : withAlpha(mixLab(brass(env), env.mood.ink, 0.15), 0.85);
    c.beginPath();
    c.moveTo(x, y);
    c.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + (deg * Math.PI) / 180);
    c.closePath();
    c.fill();
  }
  // ticks (no numerals)
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.72);
  c.beginPath();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const r0 = i % 5 === 0 ? r * 0.8 : r * 0.9;
    c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    c.lineTo(x + Math.cos(a) * r * 0.97, y + Math.sin(a) * r * 0.97);
  }
  c.lineWidth = lw(c, 1);
  c.stroke();
  // the hand
  const a = -Math.PI / 2 + (deg * Math.PI) / 180;
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = lw(c, 2.4);
  c.beginPath();
  c.moveTo(x - Math.cos(a) * r * 0.16, y - Math.sin(a) * r * 0.16);
  c.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
  c.stroke();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(x, y, 3.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------- screen-locked plate
function scopePlate(f: Frame, u: number) {
  const c = f.c;
  const env = f.mood;
  const x = 48 - 26 * (1 - u);
  c.save();
  c.globalAlpha = u;
  softPlate(c, 300, 600, 640, 120, env.ink, 0.6);
  textRole(c, 'subject', () => {
    const ds = legibleSize(c, `500 19px ${FONT.mono}`, 19);
    c.font = `500 ${ds}px ${FONT.mono}`;
    c.letterSpacing = `${(ds * 0.12).toFixed(2)}px`;
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.fillStyle = textColor(env);
    c.fillText('16 SEP 2026', x, 584);
    c.letterSpacing = '0px';
    const w = c.measureText('16 SEP 2026').width + ds * 1.3;
    c.fillStyle = withAlpha(textColor(env), 0.55);
    c.fillRect(x, 584 - ds - 9, w * u, 0.9);
    c.fillRect(x, 584 - ds - 13, 0.9, 8);
    const ss = legibleSize(c, `italic 500 23px ${FONT.text}`, 23);
    c.font = `italic 500 ${ss}px ${FONT.text}`;
    c.fillStyle = textColor(env);
    c.fillText('an older 14,019-operation build · one machine', x, 617);
  });
  c.restore();
}

/** (exported for the sheet/QA harness: the loom geometry this shot uses) */
export const ch05s06LoomGeom = loomGeom(LOOM3);
