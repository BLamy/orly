/**
 * ch01-s08 — THE TITLE CARD (card, parchment; inkBleed in from the workshop wide; 10.3 s, no narration).
 *
 * The lamp shifts back from candleAmber to parchment as the card opens. The copper line runs across the lower third,
 * over a warm shadow (the bench below it); from the dark at frame right, behind a blurred near post, a dozen BLANK
 * tags slide in along it on their strings as one train, decelerate, swing forward on the stop and settle on twos,
 * evenly spaced, unwritten (planted: the epilogue's washing line, and the blank tag in the viewer's hand). Above, on
 * the parchment, ink bleeds in:
 *   title (0.6)     HANDWIRED, large serif capitals (detent 'tie')
 *   flip (1.0)      Promises, Not Proofs, italic, beneath a fleuron rule (detent 'flip')
 *   subtitle (1.3)  the subtitle in small roman, two lines
 * The full card holds for a long read; the tags have stopped swinging by the end. The type lifts off the paper in the
 * last second so the match dissolve into ch02-s01 carries only the line.
 *
 * Review round 1 (reviser): the near post is a cut-paper turned post (finial, collar, shaft) at frame right with a
 * defined edge, the copper line tied round it, the tags coming out from behind it; below the line a dark bench-top
 * silhouette with a thin warm rim on its top only gives the card one true black mass; the workshop's paned window
 * mullions ghost into the upper parchment at about 6 % through the lamp's crossfade (the room carries across the
 * inkBleed); each bleed lasts about 0.55 s so title, flip and subtitle land as separate reveals.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, MOODS, cam3Interp, defineShot, drawTracked, hash1, legibleSize, mixLab, rule, textRole, withAlpha } from '../../../film';
import { toLayer, toScreen } from '../../../film/core/multiplane';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf } from '../sets/narratorHands';
import { TAG, drawLine, drawTag, lineYAt, type TagState } from '../sets/tagLine';

const ID = 'ch01-s08';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const TITLE = 'HANDWIRED';
const TITLE2 = 'Promises, Not Proofs';
const SUB = ['How a program becomes a hand-wired neural network,', 'told in the things people were sure of'];

/** the copper line across the lower third */
const LINE = { x0: -90, x1: 1370, y: 486, sag: 9 };
const N_TAGS = 12;
const TAG_X0 = 104;
const TAG_PITCH = 95.6;
/** the train's run in from behind the near post */
const RUN = 1320;
const ARRIVE_DUR = 3.7;
/** the near post (L5 rest px): finial centre x and y; drawn sharper than L5's depth blur so its cut edge reads */
const POST = { x: 1205, y: 440 };
const POST_LAYER: LayerSpec = { id: 'L5post', z: LAYERS.L5.z, haze: 0, blur: 1.6 };
/** the bench top behind the line (L3 rest px) */
const BENCH_Y = 560;
/** each line of type bleeds in over this long (separate reveals, not one dissolve) */
const BLEED = 0.55;

interface Beats {
  tags: number;
  title: number;
  flip: number;
  subtitle: number;
  out: number;
  D: number;
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: Beats = { tags: T.beat('tags'), title: T.beat('title'), flip: T.beat('flip'), subtitle: T.beat('subtitle'), out: D - 1.35, D };
    const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
    tl.tween(cam, { ...CAMERA3_HOME, z: 36, x: CAMERA3_HOME.x - 8 }, { at: 0, dur: D, ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    // the lamp shifts back from the workshop's candleAmber to the parchment of the plates
    const u = win(t, 0, 1.4);
    if (u < 1) f.setMood('parchment', { from: 'candleAmber', u });
    f.camera(s.get(scene.cam));
    f.backlight({ sunX: 640, sunY: 230, intensity: 1 });

    // ---------- L2: the parchment's grain, and the workshop's window mullions ghosting through (the room carried
    // across the inkBleed: about 6 % through the lamp's crossfade, settling to a breath of it on the card)
    f.layer('L2', (c, env) => {
      const m = env.mood;
      // a soft wall shadow just above the bench (the bench's own edge is cut in L3)
      const g = c.createLinearGradient(0, 380, 0, 600);
      g.addColorStop(0, withAlpha(m.set, 0));
      g.addColorStop(1, withAlpha(mixLab(m.set, m.fg, 0.35), 0.35));
      c.fillStyle = g;
      c.fillRect(-120, 380, 1520, 420);
      f.cached(`${ID}/grain`, 1520, 880, (cc) => {
        cc.translate(120, 80);
        grain(cc);
      })(c, -120, -80);
      const ghost = 0.06 * (1 - 0.5 * win(t, 1.6, 3.4));
      c.save();
      c.globalAlpha *= ghost;
      f.cached(`${ID}/mullions`, 1520, 640, (cc) => {
        cc.translate(120, 80);
        mullions(cc);
      })(c, -120, -80);
      c.restore();
    });
    f.fog('A');

    // ---------- L3: the bench top behind the line, one true black mass with a warm rim on its top only
    // (two rects and a line, drawn live: its colours follow the lamp's crossfade)
    f.layer('L3', (c, env) => bench(c, env));

    // ---------- L4: the copper line and the train of blank tags
    f.layer('L4', (c, env) => {
      drawLine(c, env, { ...LINE, posts: 'none', glow: 0.75 });
      for (const st of tagTrain(tq, b)) {
        const x = st.x!;
        if (x < -60 || x > 1360) continue;
        const knot = { x, y: lineYAt(x, LINE) };
        drawTag(c, env, st, { at: { x, y: knot.y + TAG.string }, knotAt: knot, tq });
      }
    });
    f.rim({ x: 0, y: -1 });

    // ---------- L5: the dark the tags slide out of, behind the near post (soft, at L5's depth)
    const cam = s.get(scene.cam);
    f.layer('L5', (c, env) => {
      const g = c.createLinearGradient(POST.x + 10, 0, 1340, 0);
      g.addColorStop(0, withAlpha(env.mood.fg, 0));
      g.addColorStop(0.5, withAlpha(env.mood.fg, 0.45));
      g.addColorStop(1, withAlpha(env.mood.fg, 0.85));
      c.fillStyle = g;
      c.fillRect(POST.x + 10, 300, 1340 - POST.x, 500);
    });
    // ---------- the near post itself: a cut-paper turned post, the copper line tied round it
    f.layer(POST_LAYER, (c, env) => nearPost(c, env, cam));

    // ---------- the type (screen-locked, ink bleeding into the parchment)
    typeCard(f.c, t, b);
  },
});

// ---------------------------------------------------------------- the dozen blank tags
/** one train sliding in from the right, slowing to a stop; each tag swings forward on the stop, then settles */
function tagTrain(tq: number, b: Beats): TagState[] {
  const u = clamp01((tq - b.tags) / ARRIVE_DUR);
  const off = RUN * Math.pow(1 - u, 3);
  const arrive = b.tags + ARRIVE_DUR;
  const out: TagState[] = [];
  for (let i = 0; i < N_TAGS; i++) {
    const x = TAG_X0 + i * TAG_PITCH + off;
    // on the run they trail a little; the stop throws them forward; the swing dies away by the end
    const after = Math.max(0, tq - arrive + 0.5);
    const amp = tq < arrive - 0.5 ? 0.05 : 0.15 * Math.exp(-after * 0.85);
    const lag = i * 0.07; // each tag a hair behind its neighbour
    const phase = Math.PI / 2 - 1.7 * (arrive - 0.15 + lag);
    out.push({ id: 'why', x, swing: amp * (1 + 0.15 * Math.sin(i * 2.3)), phase });
  }
  return out;
}

// ---------------------------------------------------------------- the type
function bleed(c: C, t: number, at: number, dur = 1.0) {
  const k = win(t, at, at + dur);
  if (k <= 0) return 0;
  const blur = (1 - k) * 5;
  c.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  return k;
}
function typeCard(c: C, t: number, b: Beats) {
  const out = 1 - win(t, b.out, b.out + 0.8);
  if (out <= 0) return;
  // the plate's own ink, steady through the lamp's shift (no colour pop as the mood settles)
  const ink = MOODS.parchment.ink;
  c.save();
  textRole(c, 'subject', () => {
    c.textBaseline = 'alphabetic';
    // HANDWIRED
    let k = bleed(c, t, b.title - 0.05, BLEED);
    if (k > 0) {
      c.globalAlpha = k * out;
      c.fillStyle = ink;
      drawTracked(c, TITLE, 640, 196, { font: `600 98px ${FONT.display}`, size: 98, tracking: 0.14, align: 'center' });
    }
    // the fleuron rule and Promises, Not Proofs
    k = bleed(c, t, b.flip - 0.05, BLEED);
    if (k > 0) {
      c.filter = 'none';
      c.globalAlpha = out;
      rule(c, 640, 228, 440, { color: ink, ornament: 'fleuron', grow: k, alpha: 0.85 });
      bleed(c, t, b.flip - 0.05, BLEED);
      c.globalAlpha = k * out;
      c.fillStyle = ink;
      drawTracked(c, TITLE2, 640, 288, { font: `italic 500 48px ${FONT.display}`, size: 48, tracking: 0.02, align: 'center' });
    }
    // the subtitle, small roman, two lines
    k = bleed(c, t, b.subtitle - 0.05, BLEED);
    if (k > 0) {
      const base = `400 24px ${FONT.text}`;
      const size = legibleSize(c, base, 24);
      c.globalAlpha = k * out * 0.92;
      c.fillStyle = mixLab(ink, '#5a4632', 0.25);
      SUB.forEach((ln, i) => drawTracked(c, ln, 640, 338 + i * size * 1.32, { font: `400 ${size}px ${FONT.text}`, size, tracking: 0.01, align: 'center' }));
    }
  });
  c.filter = 'none';
  c.restore();
}

/** the workshop's paned windows as bare mullions and transoms (as in sets/tagLine's wall), fading toward the line */
function mullions(c: C) {
  const ink = '#3a2614';
  c.fillStyle = ink;
  for (const cx of [-80, 250, 640, 1030, 1360]) {
    const w = 230, x0 = cx - w / 2;
    // the window's frame, its two lights' central mullion and the seven-pane transoms
    c.fillRect(x0 - 10, -60, 10, 620);
    c.fillRect(x0 + w, -60, 10, 620);
    c.fillRect(cx - 4, -60, 8, 620);
    for (let j = 0; j <= 7; j++) c.fillRect(x0, -20 + j * 72, w, 5);
  }
  // fade toward the line: the room is a memory above, gone by the tags
  c.globalCompositeOperation = 'destination-in';
  const g = c.createLinearGradient(0, -80, 0, 470);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.7)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(-120, -80, 1520, 640);
  c.globalCompositeOperation = 'source-over';
}
/** L3: the bench top behind the line: a near-black cut edge with a thin warm rim on its top only */
function bench(c: C, env: PaintEnv) {
  const body = mixLab(PUPPET_NEAR_BLACK, env.mood.fg, 0.2);
  c.fillStyle = body;
  c.fillRect(-160, BENCH_Y, 1600, 320);
  // the bench top's thickness, a hair lighter, then its lip
  c.fillStyle = mixLab(body, env.mood.set, 0.12);
  c.fillRect(-160, BENCH_Y, 1600, 10);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.55), 0.8);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(-160, BENCH_Y);
  c.lineTo(1440, BENCH_Y);
  c.stroke();
}
/** the near post (cut paper: finial, collar, shaft, bead) and the copper line tied round it, wraps on the near face */
function nearPost(c: C, env: PaintEnv, cam: Camera3) {
  const { x, y } = POST;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  // finial: a ball on a short neck
  c.ellipse(x, y, 17, 19, 0, 0, Math.PI * 2);
  c.rect(x - 7, y + 14, 14, 10);
  // collar: two rings
  c.rect(x - 24, y + 24, 48, 9);
  c.rect(x - 19, y + 33, 38, 6);
  // the shaft, with a turned bead lower down
  c.rect(x - 15, y + 39, 30, 420);
  c.rect(x - 22, y + 150, 44, 12);
  c.rect(x - 18, y + 162, 36, 6);
  c.fill();
  // the warm rim on the light-facing (left, top) edges
  const m = c.getTransform();
  const px = 1 / (Math.hypot(m.a, m.b) || 1);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.85);
  c.lineWidth = 2.4 * px;
  c.beginPath();
  c.arc(x, y, 18, Math.PI * 0.95, Math.PI * 1.75);
  c.moveTo(x - 24, y + 24);
  c.lineTo(x + 18, y + 24);
  c.moveTo(x - 15, y + 40);
  c.lineTo(x - 15, y + 150);
  c.moveTo(x - 22, y + 150);
  c.lineTo(x + 14, y + 150);
  c.stroke();
  // the copper line's height at the post, carried from the action plane (L4) to this plane
  const sx = toScreen(LAYERS.L5, cam, x, y).x;
  const l4 = toLayer(LAYERS.L4, cam, sx, 0);
  const ly4 = lineYAt(l4.x, LINE);
  const ly = toLayer(LAYERS.L5, cam, sx, toScreen(LAYERS.L4, cam, l4.x, ly4).y).y;
  // three wraps round the shaft and a short tail, copper with a bright top edge
  const cop = copperOf(env, 0.75);
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const wy = ly - 3 + i * 3.4;
    c.strokeStyle = cop;
    c.lineWidth = 2.6 * px;
    c.beginPath();
    c.moveTo(x - 16, wy + 1.2);
    c.quadraticCurveTo(x, wy - 1.6, x + 16, wy + 1.2);
    c.stroke();
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.6);
  c.lineWidth = 1 * px;
  c.beginPath();
  c.moveTo(x - 15, ly - 4);
  c.quadraticCurveTo(x, ly - 6.6, x + 15, ly - 4);
  c.stroke();
  // the knot's tail hanging on the near face
  c.strokeStyle = cop;
  c.lineWidth = 2.2 * px;
  c.beginPath();
  c.moveTo(x - 4, ly + 5);
  c.quadraticCurveTo(x - 8, ly + 14, x - 5, ly + 22);
  c.stroke();
}

/** paper fibres (neutral, mood-independent) */
function grain(c: C) {
  for (let i = 0; i < 520; i++) {
    const x = hash1(i, 31) * 1520;
    const y = hash1(i, 37) * 880;
    const a = hash1(i, 41) * Math.PI;
    const l = 4 + hash1(i, 43) * 16;
    c.strokeStyle = hash1(i, 47) > 0.5 ? 'rgba(110,86,52,0.07)' : 'rgba(255,250,236,0.09)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
}

