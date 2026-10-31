/**
 * ch06-s03b — the classical recipe as a two-stage paper machine (duskRose plate, cut in from ch06-s03's bowl, 21.0 s).
 * Same hall, same blackboard as ch06-s03; now a workbench below the board. Clear and fair: a recipe, not a verdict.
 * Round 3: re-anchored to the re-recorded L0607b / L0607c (every T.word resolves in the current clock).
 *
 * L0607b 'An expert chose what to measure, by hand; the machine only drew the line.'
 *   'expert'     STAGE ONE, at the left of the bench under a hanging work lamp: an expert's shirt-sleeved hand cuts a
 *                small TIN STENCIL with snips (ch08-s04's tin: same lattice, same round pierced holes), one window per
 *                word: an EDGE ('expert'), a CORNER ('chose'), a LOOP ('what'); the snips are laid down on 'measure'.
 *                A print (a teacup) slides under the plate on 'measure': its ink darkens the holes it covers and a row
 *                of numbers types onto a slip (the TRUE count of covered holes per shape). On 'by hand' the label
 *                'features, chosen by hand' brackets the slips; a second print (a bird) gives a second row under it.
 *   'learner'    the camera tracks right along the bench: STAGE TWO, a field of paper dots (warm one side, cool the
 *                other); a small brass ruler drops onto its pivot and swings,
 *   'line'       settles, and one straight chalk line is drawn along it; the ruler lifts clear so the line reads.
 * L0607c 'When no straight line would do, the kernel trick lifted one crowd up a hill, and one flat cut parted them.
 *         The learning was clean; the seeing was hand-made.'
 *   'When no'    the chalk line is wiped; the dots slide into a warm ring around a cool cluster; on 'would do' the
 *                ruler tries and wobbles (no angle works); on 'kernel' it is laid aside; date card 1992 · Boser,
 *                Guyon & Vapnik.
 *   'lifted'     the field rises into a terraced HILL (h = exp(−r²/σ²), side-lit): the warm ring stays low, the cool
 *                cluster rides up to the summit; label 'kernel trick'.
 *   'flat'       one flat sheet of vellum slides in and slices the hill between them; the cone and the cut HOLD
 *                together for > 3 s (to 'the seeing'), then the hill sinks and the cut is left as a closed chalk ring
 *                (exactly r0 = σ·√ln(1/h0), where the sheet met the hill).
 *   'clean'      the brass ruler and the vellum glow softly (the learning: tidy, provable).
 *   'hand-made'  the camera tracks back and LOCKS on a two-shot of the whole recipe: the lamp-lit tin and its labelled
 *                slips at the left, the field and its ring fully in frame at the right, and on the board above, the
 *                chalk record of the lift (hill, two crowds, one flat cut) drawn as the camera settles.
 *
 * TEXT: the date card and the label 'kernel trick' (script), plus the review's 'features, chosen by hand' readout label;
 * the slips' numbers are part of the machine.
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, MOODS, defineShot, dustMotes, legibleSize, mixLab, softPlate, textRole, toLayer, toScreen, windowWall, withAlpha } from '../../../film';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { bake, camPath, clamp01, easeIO, h01, lerp, monoLabel, screenPass, sm, tq12, win } from '../sets/ch06-s01-kit';
import {
  BIRD, CUP, CELL, DOTS, GAP, H0, LAYER_R, NL, PAD, PHI, PIERCE, PLATE_H, PLATE_W, R0, ROW_BIRD, ROW_CUP, SHAPES,
  hOf, layerOf, snipsArm, snipsAtRest, steadyArm, tinStencil,
} from '../sets/ch06-s03b-recipe';

type C = CanvasRenderingContext2D;
type P = { x: number; y: number };
const ID = 'ch06-s03b';

// ------------------------------------------------------------------------------------------------ staging (L4 world)
// round 4: the worktop's back edge raised 72 px (the board shows only as a dark band above it) and its front lowered
const BENCH = { back: 380, front: 640 };
/** the easel's front-left foot (the plate's ledge sits 14 px above it), at the back-left of the bench */
const ST = { x: 300, y: 470 };
const PLATE_TOP = ST.y - PLATE_H - 14;
/** the slips' rows: under the plate, lying on the bench */
const SLIP1 = { y: 502 };
const SLIP2 = { y: 538 };
/** the field: a paper sheet on the bench, seen obliquely (mild perspective), and the hill's height scale */
const F = { cx: 820, cy: 528, A: 236, B: 58, Hs: 158 };
const LAMP = { x: 420, y: 270 };
/** the snips are laid down in the lamp pool just left of the easel (round 4: in frame for the closing push-in) */
const SNIPS_REST = { x: 262, y: 506, rot: -0.42 };
const LIGHT = { x: -0.6, y: -1 };

const proj = (u: number, v: number, h = 0): P => ({ x: F.cx + F.A * u * (1 + 0.1 * v), y: F.cy + F.B * v - F.Hs * h });

// ------------------------------------------------------------------------------------------------ cameras
// round 4: the opening frames BOTH stages (the field is two-coloured from the first frame), tilted down so the board is
// only a dark band and the hall's arch heads read at the top (ch06-s03's gallery, down at the bench); a short track right
// to the field for the line; up for the hill; and after 'the seeing' a truck left and push in (~1.6×) onto the lamp-lit
// tin stencil and its snips, which hold the left-centre of the frame to the end.
const O0: Camera3 = { x: 700, y: 490, z: 200, lens: 1 };
const O1: Camera3 = { x: 712, y: 486, z: 214, lens: 1 };
const F0: Camera3 = { x: 800, y: 470, z: 260, lens: 1 };
const F1: Camera3 = { x: 820, y: 410, z: 240, lens: 1 };
const F2: Camera3 = { x: 805, y: 445, z: 225, lens: 1 };
const ES: Camera3 = { x: 461, y: 446, z: 444, lens: 1 };
const ES2: Camera3 = { x: 466, y: 446, z: 456, lens: 1 };
const lerpCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: lerp(a.lens, b.lens, u) });
/** the closing move passes this point accelerating (ease-in then ease-out with matched velocity: no stop) */
const EMID = lerpCam(F2, ES, 0.25);
const easeIn = (u: number) => clamp01(u) ** 2;
const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 2;

interface B {
  D: number;
  expert: number;
  hand: number;
  machine: number;
  line: number;
  lineEnd: number;
  /** L0607c: 'When', 'no' (straight line), 'would' (do) */
  when: number;
  noLine: number;
  would: number;
  kernel: number;
  lift: number;
  flat: number;
  parted: number;
  clean: number;
  seeing: number;
  handmade: number;
  /** L0607c 'straight', and the line's smudge (on 'would do') */
  straight: number;
  smudge: number;
  nips: number[];
  photo1: number;
  photo2: number;
  /** a print's slide-in time (s) */
  slide: number;
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const expert = T.beat('expert');
    // round 3: re-anchored to the re-recorded lines. L0607b: 'An expert chose what to measure, by hand; the machine only
    // drew the line.' L0607c: 'When no straight line would do, the kernel trick lifted one crowd up a hill, and one flat
    // cut parted them. The learning was clean; the seeing was hand-made.'
    const measure = T.word('L0607b', 'measure');
    const b: B = {
      D,
      expert,
      hand: T.word('L0607b', 'hand'),
      machine: T.beat('learner'),
      line: T.beat('line'),
      lineEnd: T.line('L0607b').end,
      when: T.word('L0607c', 'When'),
      noLine: T.word('L0607c', 'no'),
      would: T.word('L0607c', 'would'),
      kernel: T.beat('kernel'),
      lift: T.beat('lift'),
      flat: T.beat('cut'),
      parted: T.word('L0607c', 'parted'),
      clean: T.beat('clean'),
      seeing: T.word('L0607c', 'seeing'),
      handmade: T.beat('handmade'),
      straight: T.word('L0607c', 'straight'),
      smudge: T.word('L0607c', 'would') - 0.18,
      // the three nips (edge, corner, loop) on 'expert', 'chose', 'what': the expert chooses the shapes
      nips: [expert + 0.12, T.word('L0607b', 'chose') + 0.04, T.word('L0607b', 'what') + 0.02],
      // print 1 (a cup) slides under the tin on 'measure'; print 2 (a bird) follows as 'the machine' begins, so the
      // label 'features, chosen by hand' has two readouts under it before the camera tracks to stage two
      photo1: measure - 0.12,
      photo2: measure + 1.2,
      slide: 0.5,
    };
    tl.hold(0, D);
    return {
      tl,
      b,
      cam: camPath([
        [0, O0],
        // a slow drift over stage one; then a short track right as 'the machine' takes over (the ruler swings)
        [b.hand + 0.1, O1, (u) => u],
        [b.line - 0.2, F0, easeIO],
        [b.lift - 0.1, F0],
        [b.lift + 1.4, F1, easeIO],
        [b.parted + 0.4, F1],
        [b.clean - 0.15, F2, easeIO],
        // 'the seeing was hand-made': truck left and push in on the stencil (accelerating through 'hand-made' − 0.2)
        [b.handmade - 0.95, F2],
        [b.handmade - 0.2, EMID, easeIn],
        [b.handmade + 2.1, ES, easeOut],
        [D, ES2],
      ]),
    };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as B;
    const cam = (scene.cam as (t: number) => Camera3)(t);
    f.camera(cam);
    // the sun low behind the stencil's end of the bench: the tin and the lamp read against the window light
    f.backlight({ sunX: 400, sunY: 430, sunRadius: 640, intensity: 0.85 });

    // ---------------- the hall (L2): ch06-s03's round-headed windows, the same wall
    f.layer('L2', (c, env) => {
      const r = { x: -520, y: -300, w: 2500, h: 1100 };
      bake(f, c, `${ID}/L2/${env.mood.id}`, r, (cc) =>
        windowWall(cc, { x: r.x, y: r.y, w: r.w, h: 720 - r.y, centers: [-510, -130, 250, 630, 1010, 1390, 1770], winW: 210, apex: 140, sill: 470, shape: 'round', lights: 2, panes: { cols: 3, rows: 9 }, transoms: [0.36], tracery: 'quatrefoil', spandrel: 'trefoil', cornice: 70, wainscot: 80 }, env),
      );
    });
    f.fog('A');
    // ---------------- the board (L3): Vapnik's blackboard, its last lecture faintly wiped (the street, the margin)
    f.layer('L3', (c, env) => {
      const r = { x: 500, y: 40, w: 860, h: 440 };
      bake(f, c, `${ID}/L3/${env.mood.id}`, r, (cc) => board(cc, env));
      // round 4: no chalk recap here (it competed with the closing beat); the board stays a dark band
    });
    f.fog('B');

    // ---------------- the action plane (L4): bench, stencil, field, hand
    f.layer('L4', (c, env) => {
      bake(f, c, `${ID}/L4bench/${env.mood.id}`, { x: -500, y: BENCH.back - 10, w: 2400, h: 900 - BENCH.back }, (cc) => bench(cc, env));
      lampPool(c, env, t, b);
      stageOne(c, env, t, tq, b);
      field(c, env, t, tq, b);
      pendant(c, env);
      hand(c, env, t, tq, b);
    });
    f.rim({ x: LIGHT.x, y: -1 });
    f.practical({ x: LAMP.x, y: LAMP.y + 30, kind: 'lamp', seed: 631, intensity: (0.62 + 0.1 * win(t, b.handmade, b.handmade + 1.2)) * breath(t, b), radius: 46 });

    // dust in the lamp's cone over the stencil (alive through the long hold)
    f.layer('L4', (c, env) => {
      dustMotes(c, { area: { x: 250, y: 300, w: 360, h: 170 }, count: 46, drift: { x: 2.5, y: -1.6 }, size: 1.05, brightness: 0.75, salt: 63 }, env);
    });

    // ---------------- near plane (L5): the near edge of the bench, blurred, its lip held at the bottom 10% of the frame
    // (its x slides with true L5 parallax against the bench and the wall; a pencil pot and a book stack ride on it)
    f.layer('L5', (c, env) => {
      const top = toLayer(LAYERS.L5, cam, 640, 646).y;
      f.cached(`${ID}/L5near/${env.mood.id}`, 3400, 520, (cc) => {
        cc.translate(900, 120);
        nearEdge(cc, env);
      })(c, -900, top - 120);
    });

    // ---------------- type (screen-locked)
    screenPass(f, (c) => {
      const m = f.mood;
      // the date card, lower left, from 'kernel'
      // held at full value through 'flat' and 'cut' (8.38), leaving after 'clean'
      const da = win(t, b.kernel, b.kernel + 0.45) * (1 - win(t, b.clean, b.clean + 0.45));
      if (da > 0.01) {
        // round 4: the warm cream of the 'kernel trick' label, a firmer weight, on a soft dark plate (cap height ≥ 22 px)
        const size = legibleSize(c, `600 24px ${FONT.mono}`, 24);
        monoLabel(c, '1992 · Boser, Guyon & Vapnik', 60, 612, { mood: m, a: da, size, tracking: 0.04, plate: 0.9, color: mixLab('#f6ecd8', m.core, 0.25) });
      }
      // the term label for the lift, beside the hill's summit
      const la = win(t, b.lift + 0.25, b.lift + 0.75) * (1 - win(t, b.clean, b.clean + 0.45));
      if (la > 0.01) kernelLabel(c, f, cam, la);
      // round 3 (review): the readouts are labelled 'features, chosen by hand' under L0607b (both prints), and the
      // label returns on 'hand-made' for the locked two-shot
      const leave = b.photo2 + b.slide + 0.3;
      const fa = Math.max(win(t, b.hand - 0.25, b.hand + 0.15) * (1 - win(t, leave, leave + 0.4)), win(t, b.handmade + 0.15, b.handmade + 0.6));
      if (fa > 0.01) featuresLabel(c, f, cam, fa);
    });
  },
});

// ================================================================================================= the set
function board(c: C, env: PaintEnv) {
  const m = env.mood;
  // the board hangs between the hall's windows (as in ch06-s03), the windows' light either side of it
  const X0 = 560, X1 = 1300, Y0 = 92, Y1 = 446;
  c.fillStyle = env.fill('ink');
  c.fillRect(X0 - 16, Y0 - 16, X1 - X0 + 32, Y1 - Y0 + 24);
  const g = c.createLinearGradient(0, Y0, 0, Y1);
  g.addColorStop(0, mixLab(m.set, m.fg, 0.3));
  g.addColorStop(1, mixLab(m.set, m.fg, 0.5));
  c.fillStyle = g;
  c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  // wiped chalk: broad pale smudges, and the ghost of the last lecture's street (two kerbs, a centre line)
  for (let i = 0; i < 22; i++) {
    c.fillStyle = withAlpha('#e9e2d2', 0.012 + 0.018 * h01(i, 31));
    c.beginPath();
    c.ellipse(X0 + h01(i, 32) * (X1 - X0), Y0 + h01(i, 33) * (Y1 - Y0), 60 + 90 * h01(i, 34), 3 + 5 * h01(i, 35), (h01(i, 36) - 0.5) * 0.12, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = withAlpha('#e9e2d2', 0.05);
  c.lineWidth = 2.4;
  for (const dx of [-46, 0, 46]) {
    c.beginPath();
    c.moveTo(1010 + dx, Y0 + 40);
    c.lineTo(960 + dx, Y0 + 230);
    c.stroke();
  }
  // a ghost row of smudged symbols where the margin equation was (texture, not text)
  c.fillStyle = withAlpha('#e9e2d2', 0.06);
  for (let k = 0; k < 18; k++) c.fillRect(700 + k * 26 + 6 * h01(k, 37), 404 + 4 * h01(k, 38), 14 + 6 * h01(k, 39), 3);
  // the chalk tray
  c.fillStyle = env.fill('ink');
  c.fillRect(X0 - 24, Y1 + 2, X1 - X0 + 48, 10);
  c.fillStyle = withAlpha(m.rim, 0.4);
  c.fillRect(X0 - 24, Y1 + 2, X1 - X0 + 48, 1.2);
}

function bench(c: C, env: PaintEnv) {
  const m = env.mood;
  // the worktop seen from a little above: a long plane, darker toward the front edge, its front lip lit
  const g = c.createLinearGradient(0, BENCH.back, 0, BENCH.front);
  g.addColorStop(0, mixLab(m.set, m.setHaze, 0.35));
  g.addColorStop(1, mixLab(m.set, m.fg, 0.25));
  c.fillStyle = g;
  c.fillRect(-500, BENCH.back, 2400, BENCH.front - BENCH.back);
  // grain lines
  c.strokeStyle = withAlpha(m.fg, 0.18);
  c.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const y = BENCH.back + 12 + i * 16 + 3 * h01(i, 41);
    c.beginPath();
    c.moveTo(-500, y);
    for (let x = -500; x <= 1900; x += 60) c.lineTo(x, y + 1.5 * Math.sin(x / 140 + i));
    c.stroke();
  }
  // the back edge against the board, and the lit front lip
  c.fillStyle = env.fill('ink');
  c.fillRect(-500, BENCH.back - 4, 2400, 5);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(-500, BENCH.front, 2400, 1.6);
  // the apron below
  c.fillStyle = mixLab(env.fill('ink'), m.set, 0.12);
  c.fillRect(-500, BENCH.front + 1.6, 2400, 400);
  c.fillStyle = withAlpha(m.fg, 0.5);
  for (let x = -460; x < 1900; x += 330) c.fillRect(x, BENCH.front + 22, 2, 200);
}

/**
 * the bench's near edge (L5, blurred): a dark worktop lip across the whole set with a warm lamp line along its top, and
 * two low things on it (a pencil pot, a stack of two books) so the plane reads as it slides. Local px: the lip at y = 0.
 */
function nearEdge(c: C, env: PaintEnv) {
  const m = env.mood;
  const fg = env.fill('fg');
  c.fillStyle = fg;
  c.beginPath();
  c.moveTo(-900, 400);
  c.lineTo(-900, 4);
  for (let x = -900; x <= 2500; x += 100) c.lineTo(x, 1.5 * Math.sin(x / 260));
  c.lineTo(2500, 400);
  c.closePath();
  c.fill();
  // the lit lip (the work lamp along the edge), brighter toward the lamp end
  const g = c.createLinearGradient(-900, 0, 2500, 0);
  g.addColorStop(0, withAlpha(m.rim, 0.12));
  g.addColorStop(0.38, withAlpha(m.rim, 0.42));
  g.addColorStop(1, withAlpha(m.rim, 0.1));
  c.fillStyle = g;
  c.fillRect(-900, -1, 3400, 2.4);
  // a pencil pot (x ≈ 700) and a stack of two books (x ≈ 1060), low on the lip
  c.fillStyle = fg;
  c.fillRect(682, -34, 34, 36);
  for (const [dx, h, a] of [[-10, 58, -0.12], [-2, 66, 0.04], [7, 52, 0.16], [12, 61, 0.08]] as const) {
    c.save();
    c.translate(699 + dx, -30);
    c.rotate(a);
    c.fillRect(-1.6, -h + 30, 3.2, h - 30);
    c.restore();
  }
  c.fillRect(1000, -16, 150, 17);
  c.fillRect(1012, -30, 124, 15);
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(682, -34, 34, 1.4);
  c.fillRect(1012, -30, 124, 1.4);
}

/** the hanging work lamp over the stencil (the scene's practical) */
function pendant(c: C, env: PaintEnv) {
  const { x, y } = LAMP;
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 1.2, -600, 2.4, 600 + y);
  c.beginPath();
  c.moveTo(x - 46, y + 30);
  c.quadraticCurveTo(x - 36, y + 2, x - 9, y);
  c.lineTo(x + 9, y);
  c.quadraticCurveTo(x + 36, y + 2, x + 46, y + 30);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.85);
  c.beginPath();
  c.ellipse(x, y + 30, 38, 4, 0, 0, Math.PI * 2);
  c.fill();
}

/** the lamp's cone and its pool on the bench around the stencil */
function lampPool(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const k = (0.9 + 0.12 * win(t, b.handmade, b.handmade + 1.2)) * breath(t, b);
  c.save();
  c.globalCompositeOperation = 'lighter';
  // the cone (soft, in the haze)
  const cone = c.createLinearGradient(0, LAMP.y + 30, 0, ST.y + 20);
  cone.addColorStop(0, withAlpha(m.halo, 0.16 * k));
  cone.addColorStop(1, withAlpha(m.halo, 0.03 * k));
  c.fillStyle = cone;
  c.beginPath();
  c.moveTo(LAMP.x - 38, LAMP.y + 30);
  c.lineTo(LAMP.x + 38, LAMP.y + 30);
  c.lineTo(LAMP.x + 200, ST.y + 20);
  c.lineTo(LAMP.x - 200, ST.y + 20);
  c.closePath();
  c.fill();
  // the pool on the worktop
  c.translate(LAMP.x - 10, 500);
  c.scale(1, 0.32);
  const g = c.createRadialGradient(0, 0, 10, 0, 0, 300);
  g.addColorStop(0, withAlpha(m.halo, 0.32 * k));
  g.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = g;
  c.fillRect(-300, -300, 600, 600);
  c.restore();
}

// ================================================================================================= stage one
/** pierced holes so far: each window opens over its nip (edge 3, corner 5, loop 8) */
function piercedAt(tq: number, b: B) {
  const counts = SHAPES.map((s) => s.mask.reduce((n, v) => n + v, 0));
  let n = 0;
  for (let w = 0; w < 3; w++) n += counts[w] * clamp01((tq - (b.nips[w] - 0.04)) / 0.26);
  return n;
}

function windowCx(w: number) {
  return ST.x + PAD + w * (CELL * 3 + GAP) + (CELL * 3) / 2;
}

function stageOne(c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const m = env.mood;
  // round 2: print 1 (the cup) slides in under the tin FROM THE RIGHT on 'features' (0.8 s): it is seen whole on the
  // bench first, then the holes show its paper or its ink. In the hold, it is drawn out to the left and print 2 (the
  // bird) slides in from the right the same way.
  const IN = PLATE_W + 90;
  const slideIn = (at: number) => IN * (1 - sm(clamp01((tq - at) / b.slide)));
  let photo = null as typeof CUP | null;
  let dx = 0;
  const outAt = b.photo2 - 0.4;
  if (tq >= b.photo2) {
    photo = BIRD;
    dx = slideIn(b.photo2);
  } else if (tq >= outAt) {
    photo = CUP;
    dx = -(PLATE_W + 60) * sm(clamp01((tq - outAt) / 0.36));
    if (tq - outAt >= 0.36) photo = null;
  } else if (tq >= b.photo1) {
    photo = CUP;
    dx = slideIn(b.photo1);
  }
  // the numbers type as the print settles; each window's covered holes are ringed as its number lands
  const row1At = b.photo1 + b.slide + 0.1;
  const row2At = b.photo2 + b.slide + 0.1;
  const NUM = 0.16;
  const countOf = (at: number, fadeAt: number) => [0, 1, 2].map((w) => win(tq, at + w * NUM - 0.02, at + w * NUM + 0.08) * (1 - 0.7 * win(tq, fadeAt, fadeAt + 0.8)));
  const count = photo === BIRD ? countOf(row2At, row2At + 1.6) : photo === CUP ? countOf(row1At, outAt - 0.1) : undefined;
  // the tin's pierced windows brighten on 'hand-made' (the seeing was cut by hand)
  const glowK = 0.8 + 0.3 * win(t, b.handmade - 0.1, b.handmade + 0.8);
  tinStencil(c, env, { x: ST.x, y: ST.y, pierced: piercedAt(tq, b), photo, dx, lit: 1, glowK, count });

  // the slips: a short row of numbers per print, typed one number per window
  const row = (y: number, vals: number[], at: number, a: number) => {
    if (a <= 0.01) return;
    const shown = tq >= at ? Math.min(3, 1 + Math.floor((tq - at) / NUM + 1e-6)) : 0;
    if (shown <= 0) return;
    c.save();
    c.globalAlpha *= a;
    // the paper slip lying on the bench (a slightly foreshortened rectangle)
    const x0 = ST.x - 6, w = PLATE_W + 12, h = 30;
    c.fillStyle = mixLab(MOODS.parchment.sky[3], m.halo, 0.35);
    c.beginPath();
    c.moveTo(x0 + 6, y - h / 2);
    c.lineTo(x0 + w + 6, y - h / 2);
    c.lineTo(x0 + w, y + h / 2);
    c.lineTo(x0, y + h / 2);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(MOODS.parchment.ink, 0.3);
    c.lineWidth = 1;
    c.stroke();
    const size = legibleSize(c, `600 22px ${FONT.mono}`, 22);
    c.font = `600 ${size}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = MOODS.parchment.ink;
    for (let w = 0; w < shown; w++) c.fillText(String(vals[w]), windowCx(w) + 3, y + size * 0.36);
    c.restore();
  };
  row(SLIP1.y, ROW_CUP, row1At, 1);
  row(SLIP2.y, ROW_BIRD, row2At, win(tq, row2At - 0.1, row2At + 0.05));

  // the snips laid down beside the stencil once the cutting is done
  const restAt = b.nips[2] + 0.42;
  // their blades catch the lamp on 'hand-made' and keep a low glint through the hold
  if (tq >= restAt) snipsAtRest(c, env, SNIPS_REST.x, SNIPS_REST.y, SNIPS_REST.rot, win(t, b.handmade - 0.1, b.handmade + 0.7) * (1 - 0.55 * win(t, b.handmade + 1.2, b.handmade + 3)));
}

/** the work lamp breathes through the music-only hold (a slow swell, ±8%) */
function breath(t: number, b: B) {
  const T0 = b.handmade + 0.6;
  const k = win(t, T0, T0 + 1);
  return 1 + 0.08 * k * Math.sin((2 * Math.PI * (t - T0)) / 3.4);
}

/** the expert's arm: arrives on 'expert', nips three windows, lays the snips down, withdraws (on twos) */
function hand(c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const a0 = b.expert - 0.62;
  const restAt = b.nips[2] + 0.42;
  // both hands stay in frame to just after 'hand' (2.46), then withdraw together
  const leave = Math.max(restAt + 0.1, b.hand + 0.15);
  const gone = leave + 0.5;
  if (tq < a0 || tq > gone) return;
  const cuff = mixLab(MOODS.parchment.sky[2], env.mood.halo, 0.35);
  // the steadying hand on the tin's left post, from the lower left (arrives with the snips, leaves with them)
  {
    const post = { x: ST.x - 4, y: PLATE_TOP + PLATE_H * 0.62 };
    const entry = { x: post.x - 330, y: 900 };
    const inU = sm(clamp01((tq - a0) / 0.5));
    const outU = sm(clamp01((tq - leave) / 0.5));
    const k = inU * (1 - outU);
    const at = { x: lerp(entry.x + 40, post.x, k), y: lerp(entry.y - 80, post.y, k) };
    steadyArm(c, env, { at, entry, ink: PUPPET_NEAR_BLACK, cuff });
  }
  const entry = { x: 700, y: 940 };
  const nipTip = (w: number) => ({ x: windowCx(w) + CELL * 1.5 + 3, y: PLATE_TOP + PAD + CELL * 2.2 });
  let tip: P;
  let open = 0;
  let holding = true;
  if (tq < b.nips[0]) {
    const u = sm((tq - a0) / (b.nips[0] - a0));
    tip = { x: lerp(entry.x - 120, nipTip(0).x, u), y: lerp(entry.y - 220, nipTip(0).y, u) };
    open = u;
  } else if (tq < b.nips[2] + 0.12) {
    // between nips: open, travel to the next window, close on the nip
    let w = 0;
    while (w < 2 && tq >= b.nips[w + 1]) w++;
    const since = tq - b.nips[w];
    const next = w < 2 ? b.nips[w + 1] : b.nips[2] + 0.12;
    const u = sm(clamp01((tq - b.nips[w] - 0.08) / Math.max(0.05, next - b.nips[w] - 0.12)));
    const p0 = nipTip(w), p1 = nipTip(Math.min(2, w + 1));
    tip = { x: lerp(p0.x, p1.x, u), y: lerp(p0.y, p1.y, u) - 6 * Math.sin(Math.PI * u) };
    open = since < 0.08 ? 0 : clamp01((since - 0.08) / 0.12) * (w < 2 ? 1 - clamp01((tq - (next - 0.08)) / 0.08) : 0.4);
  } else if (tq < restAt) {
    const u = sm((tq - (b.nips[2] + 0.12)) / (restAt - b.nips[2] - 0.12));
    tip = { x: lerp(nipTip(2).x, SNIPS_REST.x + 34, u), y: lerp(nipTip(2).y, SNIPS_REST.y, u) };
  } else if (tq < leave) {
    // the snips laid down, the hand rests by them a beat
    holding = false;
    tip = { x: SNIPS_REST.x + 40, y: SNIPS_REST.y - 6 };
  } else {
    holding = false;
    const u = sm((tq - leave) / (gone - leave));
    tip = { x: lerp(SNIPS_REST.x + 40, entry.x, u), y: lerp(SNIPS_REST.y - 6, entry.y + 60, u) };
  }
  snipsArm(c, env, { tip, entry, open, ink: PUPPET_NEAR_BLACK, holding, cuff });
  void t;
}

// ================================================================================================= stage two + the lift
interface FieldState {
  morph: number;
  lift: number;
  vellum: number;
  vh: number;
  ring: number;
  cutGlow: number;
  clean: number;
}

function fieldState(t: number, tq: number, b: B): FieldState {
  // the hill rises on 'lifted' and holds, with the vellum cut through it, until 'the seeing' (≥ 3 s of cone + cut)
  const lift = sm((tq - (b.lift - 0.05)) / 1.0) * (1 - sm((tq - (b.seeing + 0.1)) / 0.75));
  const vellum = sm((tq - (b.flat - 0.12)) / 0.55);
  return {
    // 'straight line would do': the crowds mix into a warm ring around a cool cluster, across the still-drawn line
    morph: sm((tq - (b.straight - 0.05)) / 0.9),
    lift,
    vellum,
    vh: H0 * lift,
    ring: clamp01((t - (b.flat + 0.35)) / 0.6),
    cutGlow: win(t, b.flat + 0.3, b.parted + 0.2),
    // the clean glow fades with the closing dim (to 0.4 over 1.2 s from 'hand-made' − 0.2, then on down)
    clean: win(t, b.clean - 0.15, b.clean + 0.5) * (1 - 0.6 * sm(clamp01((t - (b.handmade - 0.2)) / 1.2))) * (1 - 0.6 * win(t, b.handmade + 1.0, b.handmade + 2.6)),
  };
}

const dotPos = (i: number, morph: number) => {
  const d = DOTS[i];
  return { u: lerp(d.lin.u, d.ring.u, morph), v: lerp(d.lin.v, d.ring.v, morph) };
};

function ellipsePath(c: C, r: number, h: number, half = false) {
  const N = 56;
  c.beginPath();
  for (let i = 0; i <= (half ? N / 2 : N); i++) {
    const a = (i / N) * Math.PI * 2;
    const p = proj(r * Math.cos(a), r * Math.sin(a), h);
    if (i === 0) c.moveTo(p.x, p.y);
    else c.lineTo(p.x, p.y);
  }
}

function field(c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const m = env.mood;
  const S = fieldState(t, tq, b);
  // the sheet (flat, on the bench): a pale paper rectangle in perspective, with a soft contact shadow
  const corners = [proj(-1.18, -1.12), proj(1.18, -1.12), proj(1.18, 1.12), proj(-1.18, 1.12)];
  c.save();
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.beginPath();
  corners.forEach((p, i) => (i ? c.lineTo(p.x + 5, p.y + 5) : c.moveTo(p.x + 5, p.y + 5)));
  c.closePath();
  c.fill();
  const pg = c.createLinearGradient(corners[0].x, 0, corners[1].x, 0);
  pg.addColorStop(0, mixLab(mixLab(m.setHaze, m.halo, 0.45), MOODS.parchment.sky[2], 0.25));
  pg.addColorStop(1, mixLab(m.setHaze, m.halo, 0.2));
  c.fillStyle = pg;
  c.beginPath();
  corners.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.45);
  c.lineWidth = 1.2;
  c.stroke();
  c.restore();

  // stage two's chalk line: drawn along the settled ruler ON 'line', across the whole dot field, and held at full
  // strength while the crowds start to mix across it (no straight line will do); smudged out on 'would do'
  const TH = PHI + Math.PI / 2;
  const lineU = clamp01((t - (b.line - 0.16)) / 0.3);
  const sm0 = clamp01((t - b.smudge) / 0.6);
  if (lineU > 0 && sm0 < 1) {
    const L = 1.17;
    const a = proj(-L * Math.cos(TH), -L * Math.sin(TH));
    const e = proj(L * Math.cos(TH), L * Math.sin(TH));
    const end = { x: lerp(a.x, e.x, lineU), y: lerp(a.y, e.y, lineU) };
    c.save();
    c.lineCap = 'round';
    // the smudge: the stroke widens, greys and fades as a thumb drags it sideways
    const fade = 1 - sm(sm0);
    c.strokeStyle = withAlpha(mixLab('#f1ead8', m.setHaze, 0.5 * sm0), 0.22 * fade + 0.1 * sm0 * (1 - sm0));
    c.lineWidth = 7 + 22 * sm0;
    c.beginPath();
    c.moveTo(a.x + 10 * sm0, a.y);
    c.lineTo(end.x + 10 * sm0, end.y);
    c.stroke();
    c.strokeStyle = withAlpha('#fbf5e6', 0.98 * fade);
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(end.x, end.y);
    c.stroke();
    c.restore();
  }

  // the dots and the hill: terrace by terrace, outer (low) to inner (high); the vellum between the two crowds
  const dotsBy: number[][] = Array.from({ length: NL }, () => []);
  for (let i = 0; i < DOTS.length; i++) {
    const p = dotPos(i, S.morph);
    dotsBy[layerOf(Math.hypot(p.u, p.v))].push(i);
  }
  const terraceH = (k: number) => hOf(LAYER_R[k]) * S.lift;
  const layerA = sm(clamp01(S.lift * 5));
  let vellumDrawn = S.vellum <= 0.001;
  for (let k = 0; k < NL; k++) {
    const H = terraceH(k);
    if (!vellumDrawn && H > S.vh + 1e-4) {
      vellum(c, env, S);
      vellumDrawn = true;
    }
    if (layerA > 0.01) terrace(c, env, k, H, k === 0 ? 0 : terraceH(k - 1), layerA);
    for (const i of dotsBy[k]) {
      const p = dotPos(i, S.morph);
      const above = S.vellum > 0.5 && H > S.vh;
      dot(c, env, proj(p.u, p.v, H), DOTS[i].warm, above ? S.cutGlow : 0);
    }
  }
  if (!vellumDrawn) vellum(c, env, S);

  // round 4: from 'hand-made' − 0.2 the clean half dims to 0.4 over 1.2 s (the light belongs to the hand-cut stencil):
  // a multiply veil over exactly the sheet, so the bench around it is untouched
  const dim = 1 - 0.6 * sm(clamp01((t - (b.handmade - 0.2)) / 1.2));
  if (dim < 0.999) {
    const q = [proj(-1.2, -1.15), proj(1.2, -1.15), proj(1.2, 1.15), proj(-1.2, 1.15)];
    c.save();
    c.globalCompositeOperation = 'multiply';
    const v = Math.round(255 * dim);
    c.fillStyle = `rgb(${v},${v},${v})`;
    c.beginPath();
    q.forEach((p, i) => (i ? c.lineTo(p.x, p.y + (i > 1 ? 4 : -4)) : c.moveTo(p.x, p.y - 4)));
    c.closePath();
    c.fill();
    c.restore();
  }

  // the ruler: drops on 'machine', swings, settles on 'line'; wobbles on 'would do' and is laid aside on 'kernel'
  c.save();
  c.globalAlpha *= 0.4 + 0.6 * dim;
  ruler(c, env, t, tq, b, S);
  c.restore();
}

function terrace(c: C, env: PaintEnv, k: number, H: number, Hb: number, a: number) {
  const m = env.mood;
  const r = LAYER_R[k];
  const top = (NL - k) / NL; // 1 at the outermost
  c.save();
  c.globalAlpha *= a;
  // the slab's side band (front half), side-lit from the left
  if (H - Hb > 0.002) {
    const N = 56;
    c.beginPath();
    for (let i = 0; i <= N / 2; i++) {
      const ang = (i / N) * Math.PI * 2;
      const p = proj(r * Math.cos(ang), r * Math.sin(ang), H);
      if (i === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    }
    for (let i = N / 2; i >= 0; i--) {
      const ang = (i / N) * Math.PI * 2;
      const p = proj(r * Math.cos(ang), r * Math.sin(ang), Hb);
      c.lineTo(p.x, p.y);
    }
    c.closePath();
    const L = proj(-r, 0), R = proj(r, 0);
    const g = c.createLinearGradient(L.x, 0, R.x, 0);
    g.addColorStop(0, mixLab(m.halo, m.rim, 0.35));
    g.addColorStop(0.45, mixLab(m.setHaze, m.halo, 0.3));
    g.addColorStop(1, mixLab(m.set, m.fg, 0.35));
    c.fillStyle = g;
    c.fill();
  }
  // the top face: paper, lighter toward the summit
  ellipsePath(c, r, H);
  c.closePath();
  c.fillStyle = mixLab(mixLab(m.setHaze, m.halo, 0.4 + 0.35 * (1 - top)), MOODS.parchment.sky[2], 0.2);
  c.fill();
  // the cut edge catches the light along its front
  ellipsePath(c, r, H, true);
  c.strokeStyle = withAlpha(m.rim, 0.55);
  c.lineWidth = 1.1;
  c.stroke();
  c.restore();
}

function dot(c: C, env: PaintEnv, p: P, warm: boolean, glowK: number) {
  const m = env.mood;
  const cool = MOODS.winterBlue;
  const col = warm ? mixLab(m.halo, m.core, 0.4) : mixLab(cool.rim, cool.core, 0.2);
  if (glowK > 0.01) glow(c, p.x, p.y - 2, 26, warm ? m.core : cool.core, 0.45 * glowK);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.beginPath();
  c.ellipse(p.x + 2, p.y + 3, 8.5, 4.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(p.x, p.y - 2, 8.5, 6.5, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(m.ink, 0.75);
  c.lineWidth = 1.3;
  c.stroke();
  c.fillStyle = withAlpha('#ffffff', 0.35);
  c.beginPath();
  c.ellipse(p.x - 2.5, p.y - 4.5, 3, 1.6, -0.3, 0, Math.PI * 2);
  c.fill();
}

/** the flat vellum sheet at the cut height, sliding in from the right; the chalk ring where it meets the hill */
function vellum(c: C, env: PaintEnv, S: FieldState) {
  const m = env.mood;
  if (S.vellum > 0.001) {
    const du = (1 - S.vellum) * 2.9;
    const q = [proj(-1.24 + du, -1.16, S.vh), proj(1.24 + du, -1.16, S.vh), proj(1.24 + du, 1.16, S.vh), proj(-1.24 + du, 1.16, S.vh)];
    c.save();
    // round 4: the sheet floats at 42% of the hill's height: a hard shadow drops from its front edge onto the lower
    // slopes and the field (the lamp is high and to the left), and the space under it is a shade darker
    const drop = 8 + 0.3 * (S.vh * F.Hs);
    c.fillStyle = withAlpha(m.fg, 0.16 * S.vellum);
    c.beginPath();
    q.forEach((p, i) => (i ? c.lineTo(p.x + 8, p.y + drop) : c.moveTo(p.x + 8, p.y + drop)));
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha(mixLab(m.fg, m.ink, 0.5), 0.5 * S.vellum);
    c.beginPath();
    c.moveTo(q[3].x, q[3].y);
    c.lineTo(q[2].x, q[2].y);
    c.lineTo(q[2].x + 8, q[2].y + drop);
    c.lineTo(q[3].x + 8, q[3].y + drop);
    c.closePath();
    c.fill();
    c.beginPath();
    q.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.closePath();
    c.fillStyle = withAlpha(mixLab(m.rim, '#f4efe4', 0.5), 0.3 + 0.12 * S.clean);
    c.fill();
    c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.4 + 0.5 * S.clean), 0.75);
    c.lineWidth = 1.6 + 1.4 * S.clean;
    c.stroke();
    // its leading (front) edge: a bright paper lip
    c.strokeStyle = withAlpha(m.core, 0.5 + 0.4 * S.clean);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(q[3].x, q[3].y);
    c.lineTo(q[2].x, q[2].y);
    c.stroke();
    if (S.clean > 0.01) {
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(m.halo, 0.3 * S.clean);
      c.lineWidth = 9;
      c.beginPath();
      q.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
      c.closePath();
      c.stroke();
    }
    c.restore();
  }
  // the chalk ring: where the vellum meets the hill (r0), drawn on as the sheet settles; it stays on the flat field
  if (S.ring > 0) {
    const N = 64;
    const n = Math.max(1, Math.floor(N * S.ring));
    c.save();
    c.lineCap = 'round';
    // a soft chalk bloom under a bright 2 px line: the cut, where the sheet meets the hill
    c.strokeStyle = withAlpha(mixLab('#f1ead8', m.core, 0.3), 0.28);
    c.lineWidth = 7;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = 1.9 + (i / N) * Math.PI * 2.04;
      const rr = R0 * (1 + 0.025 * Math.sin(a * 3));
      const p = proj(rr * Math.cos(a), rr * Math.sin(a), S.vh);
      if (i === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    }
    c.stroke();
    c.strokeStyle = withAlpha('#fbf5e6', 0.98);
    c.lineWidth = 2.2;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = 1.9 + (i / N) * Math.PI * 2.04;
      const rr = R0 * (1 + 0.025 * Math.sin(a * 3));
      const p = proj(rr * Math.cos(a), rr * Math.sin(a), S.vh);
      if (i === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    }
    c.stroke();
    c.restore();
  }
}

function ruler(c: C, env: PaintEnv, t: number, tq: number, b: B, S: FieldState) {
  const m = env.mood;
  if (tq < b.machine - 0.2) return;
  const TH = PHI + Math.PI / 2;
  const drop = sm((tq - (b.machine - 0.2)) / 0.3);
  const s = Math.max(0, tq - b.machine);
  let th = TH + 0.95 * Math.exp(-2.1 * s) * Math.cos(5.2 * s) * (1 - sm((tq - (b.line - 0.35)) / 0.35));
  // on 'straight line would do': it comes down on the mixed crowds and tries (a wobble: no angle works), then on
  // 'kernel' it is laid aside at the sheet's front right
  const tryAt = b.straight + 0.92;
  const tryU = win(tq, tryAt, tryAt + 0.2) * (1 - sm((tq - (b.kernel - 0.15)) / 0.3));
  th += tryU * 0.55 * Math.sin((tq - tryAt) * 11);
  const aside = sm((tq - (b.kernel - 0.05)) / 0.55);
  const pu = lerp(0, 0.62, aside), pv = lerp(0, 1.42, aside);
  th = lerp(th, 0, aside);
  const len = lerp(1.0, 0.5, aside);
  // once the line is drawn the ruler lifts clear of it (so the chalk line reads), then comes down again to try the ring
  const hover = sm((tq - (b.line + 0.12)) / 0.3) * (1 - sm((tq - (tryAt - 0.15)) / 0.2));
  const lift = (1 - drop) * 60 + 34 * hover;
  const piv = proj(pu, pv);
  const a = proj(pu - len * Math.cos(th), pv - len * Math.sin(th));
  const e = proj(pu + len * Math.cos(th), pv + len * Math.sin(th));
  const brass = mixLab(mixLab(m.halo, m.core, 0.3), '#b88a3c', 0.35);
  c.save();
  c.translate(0, -lift);
  c.globalAlpha *= drop;
  c.lineCap = 'butt';
  // shadow on the sheet
  c.strokeStyle = withAlpha(m.fg, 0.3 * (1 - 0.7 * hover));
  c.lineWidth = 8 + 6 * hover;
  c.beginPath();
  c.moveTo(a.x + 4 + 10 * hover, a.y + 6 + lift);
  c.lineTo(e.x + 4 + 10 * hover, e.y + 6 + lift);
  c.stroke();
  // the brass bar: a dark edge, a bright face, tick marks
  c.strokeStyle = mixLab(m.ink, '#5a4120', 0.3);
  c.lineWidth = 9;
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(e.x, e.y);
  c.stroke();
  c.strokeStyle = brass;
  c.lineWidth = 5;
  c.stroke();
  const n = 14;
  c.strokeStyle = withAlpha(m.ink, 0.6);
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 1; i < n; i++) {
    const x = lerp(a.x, e.x, i / n), y = lerp(a.y, e.y, i / n);
    c.moveTo(x, y - 2.5);
    c.lineTo(x, y + (i % 2 ? 0 : 2.5));
  }
  c.stroke();
  // the pivot pin
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(piv.x, piv.y, 5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(brass, m.core, 0.4);
  c.beginPath();
  c.arc(piv.x, piv.y, 2.2, 0, Math.PI * 2);
  c.fill();
  // 'clean': it glows softly
  if (S.clean > 0.01) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(m.halo, 0.45 * S.clean);
    c.lineWidth = 14;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(e.x, e.y);
    c.stroke();
  }
  c.restore();
}

// ================================================================================================= type
function kernelLabel(c: C, f: Frame, cam: Camera3, a: number) {
  const m = f.mood;
  // the leader lands on the hill's shoulder, just right of the summit (the terrace at r ≈ 0.15)
  const tip = proj(0.17, 0.02, hOf(LAYER_R[NL - 2]));
  const s = toScreen(LAYERS.L4, cam, tip.x, tip.y);
  const font = `italic 400 30px ${FONT.text}`;
  const size = legibleSize(c, font, 30);
  const x = s.x + 120, y = s.y - 44;
  c.save();
  c.globalAlpha = a;
  c.font = `italic 400 ${size}px ${FONT.text}`;
  const w = c.measureText('kernel trick').width;
  softPlate(c, x + w / 2, y - size * 0.3, w + 100, size + 50, m.ink, 0.74);
  c.strokeStyle = withAlpha(m.rim, 0.75);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - 8, y - size * 0.3);
  c.lineTo(s.x + 6, s.y - 4);
  c.stroke();
  c.fillStyle = mixLab('#f6ecd8', m.core, 0.25);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText('kernel trick', x, y);
  c.restore();
}

/** the readouts' label, under the two slips (screen-locked, follows the slips with the camera); a thin chalk bracket */
function featuresLabel(c: C, f: Frame, cam: Camera3, a: number) {
  const m = f.mood;
  const l = toScreen(LAYERS.L4, cam, ST.x - 6, SLIP2.y + 19);
  const r = toScreen(LAYERS.L4, cam, ST.x + PLATE_W + 12, SLIP2.y + 19);
  const font = `italic 400 28px ${FONT.text}`;
  const size = legibleSize(c, font, 28);
  const y = Math.min(720 * 0.88 - 6, l.y + size * 1.15);
  c.save();
  c.globalAlpha = a;
  textRole(c, 'subject', () => {
    c.font = `italic 400 ${size}px ${FONT.text}`;
    const text = 'features, chosen by hand';
    const w = c.measureText(text).width;
    // left-set from the slips' left edge (its right end then stays clear of the field sheet's front corner)
    const x0 = l.x - 4;
    softPlate(c, x0 + w / 2, y - size * 0.3, w + 90, size + 44, m.ink, 0.72);
    // the bracket: both rows are this
    c.strokeStyle = withAlpha(m.rim, 0.7);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(l.x, l.y - 8);
    c.lineTo(l.x, l.y);
    c.lineTo(r.x, r.y);
    c.lineTo(r.x, r.y - 8);
    c.stroke();
    c.fillStyle = mixLab('#f6ecd8', m.core, 0.25);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText(text, x0, y);
  });
  c.restore();
}

void PIERCE;
