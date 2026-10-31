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
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Palette } from '../../../film';
import { CAMERA3_HOME, FONT, cam3Interp, defineShot, drawTracked, hash1, legibleSize, mixLab, rule, textRole, titleColor, withAlpha } from '../../../film';
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
    const u = win(t, 0, 1.8);
    if (u < 1) f.setMood('parchment', { from: 'candleAmber', u });
    f.camera(s.get(scene.cam));
    f.backlight({ sunX: 640, sunY: 230, intensity: 1 });

    // ---------- L2: the parchment's grain and the warm shadow of the bench below the line
    f.layer('L2', (c, env) => {
      const m = env.mood;
      const g = c.createLinearGradient(0, 0, 0, 760);
      g.addColorStop(0, withAlpha(m.set, 0));
      g.addColorStop(0.5, withAlpha(m.set, 0.0));
      g.addColorStop(0.66, withAlpha(mixLab(m.set, m.fg, 0.35), 0.55));
      g.addColorStop(1, withAlpha(mixLab(m.set, m.fg, 0.7), 0.92));
      c.fillStyle = g;
      c.fillRect(-120, -80, 1520, 880);
      f.cached(`${ID}/grain`, 1520, 880, (cc) => {
        cc.translate(120, 80);
        grain(cc);
      })(c, -120, -80);
    });

    // ---------- L4: the copper line and the train of blank tags
    f.layer('L4', (c, env) => {
      drawLine(c, env, { ...LINE, posts: 'none', glow: 0.55 });
      for (const st of tagTrain(tq, b)) {
        const x = st.x!;
        if (x < -60 || x > 1360) continue;
        const knot = { x, y: lineYAt(x, LINE) };
        drawTag(c, env, st, { at: { x, y: knot.y + TAG.string }, knotAt: knot, tq });
      }
    });
    f.rim({ x: 0, y: -1 });

    // ---------- L5: the near post at frame right, the dark the tags slide out of
    f.layer('L5', (c, env) => {
      const g = c.createLinearGradient(1090, 0, 1330, 0);
      g.addColorStop(0, withAlpha(env.mood.fg, 0));
      g.addColorStop(0.55, withAlpha(env.mood.fg, 0.5));
      g.addColorStop(1, withAlpha(env.mood.fg, 0.9));
      c.fillStyle = g;
      c.fillRect(1090, 330, 260, 450);
      c.fillStyle = env.fill('fg');
      c.beginPath();
      c.ellipse(1256, 446, 26, 18, 0, 0, Math.PI * 2);
      c.rect(1228, 456, 56, 14);
      c.rect(1236, 470, 40, 330);
      c.fill();
    });

    // ---------- the type (screen-locked, ink bleeding into the parchment)
    typeCard(f.c, t, b, f.mood);
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
function typeCard(c: C, t: number, b: Beats, m: Palette) {
  const out = 1 - win(t, b.out, b.out + 0.8);
  if (out <= 0) return;
  const ink = titleColor(m);
  c.save();
  textRole(c, 'subject', () => {
    c.textBaseline = 'alphabetic';
    // HANDWIRED
    let k = bleed(c, t, b.title - 0.05, 1.1);
    if (k > 0) {
      c.globalAlpha = k * out;
      c.fillStyle = ink;
      drawTracked(c, TITLE, 640, 196, { font: `600 98px ${FONT.display}`, size: 98, tracking: 0.14, align: 'center' });
    }
    // the fleuron rule and Promises, Not Proofs
    k = bleed(c, t, b.flip - 0.05, 1.0);
    if (k > 0) {
      c.filter = 'none';
      c.globalAlpha = out;
      rule(c, 640, 228, 440, { color: ink, ornament: 'fleuron', grow: k, alpha: 0.85 });
      bleed(c, t, b.flip - 0.05, 1.0);
      c.globalAlpha = k * out;
      c.fillStyle = ink;
      drawTracked(c, TITLE2, 640, 288, { font: `italic 500 48px ${FONT.display}`, size: 48, tracking: 0.02, align: 'center' });
    }
    // the subtitle, small roman, two lines
    k = bleed(c, t, b.subtitle - 0.05, 1.0);
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

