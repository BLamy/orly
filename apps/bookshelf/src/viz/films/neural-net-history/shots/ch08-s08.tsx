/**
 * ch08-s08 — "Too many knobs, too few labels" (dawnGold; 17.6 s; crossfade in from the weir plate).
 * A cut-paper balance scale against a tall arched window at dawn: sixty million knobs slam down one pan;
 * twelve million yes-or-no answers barely lift the other; then a hall of shifted, mirrored crops lifts it a little.
 *
 *   'Sixty'      a mountain of tiny potentiometer knobs (the Mark I's weights, sixty million numbers) drops onto
 *                the right pan; the beam slams over and bounces. Label (right part): vs ≈ 60,000,000 weights.
 *   'label'      label tokens fly into the left pan: lit discs, each with ten tiny yes/no toggles (one name in a
 *                thousand ≈ 10 bits). On "about ten yes-or-no answers" one token rises, enlarged, and its ten
 *                toggles flip on, one by one.
 *   'Twelve'     the tokens are counted into a stack; the label's left part sets in: 1.2 million labels × ≈ 10
 *                bits ≈ 12 million. The beam does not move.
 *   'memorise'   one training photograph flies in and is pressed flat into the knob mountain like a leaf in a
 *                book; on 'see' a ghost of a learned edge stencil beside it stays unlit.
 *   'cropped'    the camera turns to a hall of mirrors at the left: the husky, reflected into shifted 224-pixel
 *                crops of its 256-pixel picture; on 'mirrored' each flips left-right; label (low left, clear of the
 *                reel's 'overfitting' term tag): crops and mirrors:
 *                × 2048. Their light pours onto the left pan, which rises (not all the way).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { LAYERS, defineShot, mixLab, overscan, withAlpha } from '../../../film';
import { forestBand, ridgeline } from '../../../film/silhouette/nature';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { FONT } from '../../../film/silhouette/type';
import { SC, drawScale, knobMountain, mirror, scaleAnchors, token } from '../sets/ch08-s08-scale';
import { PICTURES, clamp01, inkLabel, lerp, monotone, sm, tq12, win } from '../sets/ch08-s06-kit';
import { hash1 } from '../../../film/silhouette/atmosphere';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s08';
const N_TOK = 12;
const THETA = 0.3;

interface B {
  D: number;
  slam: number;
  bits: number;
  about: number;
  ten: number;
  answers: number;
  twelve: number;
  memorise: number;
  see: number;
  mirror: number;
  flip: number;
  cam: { x: (t: number) => number; y: (t: number) => number; z: (t: number) => number };
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const mir = T.beat('mirror');
    const b: B = {
      D,
      slam: T.beat('scale') + 0.06,
      bits: T.beat('bits'),
      about: T.word('L0815', 'about'),
      ten: T.word('L0815', 'ten'),
      answers: T.wordEnd('L0815', 'answers'),
      twelve: T.beat('twelve'),
      memorise: T.beat('memorise'),
      see: T.word('L0815', 'see'),
      mirror: mir,
      flip: T.beat('flip'),
      cam: {
        x: monotone([
          [0, 646],
          [mir, 620],
          [mir + 2.0, 486],
          [D, 478],
        ]),
        y: monotone([
          [0, 360],
          [mir, 354],
          [mir + 2.0, 352],
          [D, 350],
        ]),
        z: monotone([
          [0, 0],
          [mir, 32],
          [mir + 2.0, 112],
          [D, 120],
        ]),
      },
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const camAt = (tt: number): Camera3 => ({ x: b.cam.x(tt), y: b.cam.y(tt), z: b.cam.z(tt), lens: 1 });
    const cam = camAt(t);
    const cams = [camAt(0), camAt(b.mirror), camAt(b.mirror + 1), camAt(b.D)];
    f.camera(cam);
    f.backlight({ sunX: 640, sunY: 400, sunRadius: 460, intensity: 1 });
    // L1: far hills through the window
    f.layer('L1', (c, env) => {
      const r = overscan(LAYERS.L1, cams, 40);
      f.cached(`${ID}/L1/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        ridgeline(cc, { x0: r.x, x1: r.x + r.w, y: 540, amp: 80, seed: 88, scale: 380, ground: 400 }, env);
        forestBand(cc, { x0: r.x, x1: r.x + r.w, y: 572, h: 30, kind: 'leafy', density: 3, seed: 89, ground: 300 }, env);
      })(c, r.x, r.y);
    });
    // L2: the back wall with one tall arched window (a hole), panelling as rim cut-lines
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, cams, 40);
      f.cached(`${ID}/L2/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        const wall = new Path2D();
        wall.rect(r.x, r.y, r.w, r.h);
        const wx0 = 380;
        const wx1 = 900;
        const wy0 = 40;
        const wy1 = 600;
        wall.moveTo(wx0, wy1);
        wall.lineTo(wx0, wy0 + 200);
        wall.quadraticCurveTo(wx0, wy0, (wx0 + wx1) / 2, wy0 - 30);
        wall.quadraticCurveTo(wx1, wy0, wx1, wy0 + 200);
        wall.lineTo(wx1, wy1);
        wall.closePath();
        cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.35);
        cc.fill(wall, 'evenodd');
        // mullions and transoms of the window (thin set bars)
        cc.fillStyle = env.fill('set');
        cc.fillRect((wx0 + wx1) / 2 - 3, wy0 - 30, 6, wy1 - wy0 + 30);
        for (const x of [wx0 + 130, wx1 - 130]) cc.fillRect(x - 2, wy0 + 20, 4, wy1 - wy0 - 20);
        for (const y of [wy0 + 200, wy0 + 380]) cc.fillRect(wx0, y - 2, wx1 - wx0, 4);
        cc.strokeStyle = withAlpha(env.mood.rim, 0.1);
        cc.lineWidth = 1;
        for (const x0 of [r.x + 40, wx1 + 60]) {
          for (let x = x0; x < (x0 < wx0 ? wx0 - 60 : r.x + r.w - 40); x += 150) {
            cc.strokeRect(x, 70, 120, 280);
            cc.strokeRect(x, 380, 120, 220);
          }
        }
      })(c, r.x, r.y);
    });
    f.fog('A');
    f.fog('B');

    const st = teach(t, b);
    f.layer('L4', (c, env) => {
      // the table top the scale stands on
      c.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.12);
      c.fillRect(-400, SC.baseY, 2100, 400);
      c.fillStyle = withAlpha(env.mood.rim, 0.3);
      c.fillRect(-400, SC.baseY, 2100, 1.2);
      // the mirror hall (behind the scale's left arm)
      if (st.hallA > 0.01) hall(c, env, t, b, st);
      drawScale(c, st.theta, env, (side, x, y) => {
        if (side === 1) {
          knobMountain(c, x, y + st.knobDy, env, st.knobA, f.pxScale);
          if (st.leaf) pressedLeaf(c, env, x, y, st);
        } else tokensInPan(c, env, x, y, t, b);
      });
      // the knob loupe: on "sixty million weights" a magnifier over the mountain shows what it is made of
      if (st.loupeA > 0.01) knobLoupe(c, env, t, st);
      // the enlarged callout token with its ten toggles
      if (st.callA > 0.01) {
        const A = scaleAnchors(st.theta).panL;
        const cx = lerp(A.x, 196, st.callU);
        const cy = lerp(A.y - 20, 474, st.callU);
        // a thread of light from the pan to the enlarged token (it is one of those)
        if (st.callU > 0.3) {
          c.strokeStyle = withAlpha(env.mood.halo, 0.45 * st.callA);
          c.setLineDash([3, 4]);
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(A.x - 30, A.y + 14);
          c.lineTo(cx + 40, cy - 50);
          c.stroke();
          c.setLineDash([]);
        }
        token(c, cx, cy, lerp(13, 74, st.callU), st.toggles, env, { alpha: st.callA });
      }
      // light pouring from the mirrors onto the left pan
      if (st.pour > 0.01) {
        const A = scaleAnchors(st.theta).panL;
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < MIRRORS.length; i++) {
          const m = MIRRORS[i];
          const g = c.createLinearGradient(m.x, m.y, A.x, A.y);
          g.addColorStop(0, withAlpha(env.mood.halo, 0.14 * st.pour));
          g.addColorStop(1, withAlpha(env.mood.core, 0.22 * st.pour));
          c.fillStyle = g;
          c.beginPath();
          c.moveTo(m.x - m.w * 0.35, m.y + m.h * 0.4);
          c.lineTo(m.x + m.w * 0.35, m.y + m.h * 0.4);
          c.lineTo(A.x + 40, A.y - 4);
          c.lineTo(A.x - 40, A.y - 4);
          c.closePath();
          c.fill();
        }
        c.restore();
        glow(c, A.x, A.y - 10, 120, env.mood.core, 0.3 * st.pour);
      }
    });
    f.rim({ x: 0, y: -1 });
    // L5: the table's near edge and two heavy curtains close to the lens (blurred): the right one frames the
    // scale and slides out as the camera turns to the mirrors; the left one slides in at the frame's edge
    f.layer('L5', (c, env) => {
      c.fillStyle = env.fill('fg');
      c.fillRect(-600, 700, 2600, 400);
      const r = overscan(LAYERS.L5, cams, 30);
      f.cached(`${ID}/L5-curtains/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        curtain(cc, env, -520, -92, r.y, r.y + r.h, 1);
        curtain(cc, env, 1196, 1700, r.y, r.y + r.h, -1);
      })(c, r.x, r.y);
    });

    // ---------------------------------------------------------------- type (screen-locked)
    const out = 1 - win(t, b.mirror - 0.4, b.mirror + 0.2);
    const aR = win(t, b.slam + 0.1, b.slam + 0.6) * out;
    const aL = win(t, b.twelve, b.twelve + 0.6) * out;
    if (aR > 0.01 || aL > 0.01) {
      // the right half stands alone (centred) until 'Twelve'; then it slides over and the left half and the
      // separator set in beside it (the separator never shows without its left half)
      const left = '1.2 million labels × ≈ 10 bits ≈ 12 million';
      const sep = '   ·   ';
      const right = 'vs ≈ 60,000,000 weights';
      const font = `500 21px ${FONT.mono}`;
      f.c.save();
      (f.c as C & { letterSpacing: string }).letterSpacing = '0px';
      f.c.font = font;
      const wl = f.c.measureText(left).width;
      const ws = f.c.measureText(sep).width;
      const wr = f.c.measureText(right).width;
      f.c.restore();
      const x0 = 640 - (wl + ws + wr) / 2;
      const slide = sm(win(t, b.twelve - 0.05, b.twelve + 0.45));
      const xr = lerp(640 - wr / 2, x0 + wl + ws, slide);
      const col = mixLab('#efe3cf', f.mood.core, 0.25);
      inkLabel(f.c, left, x0, 612, { size: 21, font, color: col, plate: f.mood.ink, plateAlpha: 0.6, alpha: aL });
      if (aL > 0.01) inkLabel(f.c, sep, x0 + wl, 612, { size: 21, font, color: col, alpha: aL * aR });
      inkLabel(f.c, right, xr, 612, { size: 21, font, color: col, plate: f.mood.ink, plateAlpha: 0.6 * (1 - aL * 0.5), alpha: aR });
    }
    // under the mirror hall, in the slot the scale's label has just vacated: the top-left corner belongs to the
    // reel's 'overfitting' term tag until about a second after 'cropped'
    const aM = win(t, b.mirror + 0.2, b.mirror + 0.8);
    if (aM > 0.01) {
      inkLabel(f.c, 'crops and mirrors: × 2048', 72, 612, {
        size: 24,
        font: `500 24px ${FONT.mono}`,
        color: mixLab('#efe3cf', f.mood.core, 0.25),
        plate: f.mood.ink,
        plateAlpha: 0.6,
        alpha: aM,
      });
    }
  },
});

// ================================================================================================= TEACHING
interface St {
  theta: number;
  knobA: number;
  knobDy: number;
  callA: number;
  callU: number;
  toggles: number;
  leaf: { u: number; x: number; y: number } | null;
  ghostA: number;
  hallA: number;
  pour: number;
  loupeA: number;
  panR: { x: number; y: number };
}

function teach(t: number, b: B): St {
  // the knob mountain falls onto the right pan on 'Sixty'
  const fallU = clamp01((t - (b.slam - 0.38)) / 0.38);
  const knobDy = -320 * (1 - fallU * fallU);
  const knobA = win(t, b.slam - 0.42, b.slam - 0.3);
  // the beam slams over with a damped bounce; the mirrors' light lifts the left pan part way
  let theta = 0;
  if (t > b.slam) {
    const d = t - b.slam;
    theta = THETA * (1 - Math.exp(-d / 0.09) * Math.cos(d * 16));
  }
  // the crops' light lands on the left pan, and the pan rises as it lands: about 38% of the slam back, still
  // knob-heavy, with a small bounce
  const pour = win(t, b.flip + 0.1, b.flip + 0.6);
  const r0 = b.flip + 0.45;
  if (t > r0) {
    const d = t - r0;
    const e = sm(clamp01(d / 0.75));
    theta = lerp(theta, THETA * 0.62, e) - 0.028 * Math.exp(-d / 0.35) * Math.sin(Math.min(d, 2.5) * 7.5) * clamp01(d / 0.2);
  }
  // callout token: rises on 'about', toggles flip from 'ten' to 'answers', sinks back before 'Twelve'
  const rise = win(t, b.about - 0.25, b.about + 0.35);
  const sink = win(t, b.twelve - 0.55, b.twelve - 0.1);
  const callU = rise * (1 - sink);
  const callA = rise * (1 - win(t, b.twelve - 0.35, b.twelve - 0.1));
  const per = Math.max(0.1, (b.answers - b.ten) / 10);
  const toggles = clamp01((tq12(t) - b.ten) / (per * 10)) * 10;
  // the pressed leaf
  let leaf: St['leaf'] = null;
  if (t > b.memorise - 0.6) {
    const u = clamp01((t - (b.memorise - 0.6)) / 1.2); // 0..0.5 flies in (lands on 'memorise'), 0.5..1 pressed in
    leaf = { u, x: 0, y: 0 };
  }
  const ghostA = win(t, b.see - 0.2, b.see + 0.3) * (1 - win(t, b.mirror - 0.5, b.mirror));
  const hallA = win(t, b.mirror - 0.3, b.mirror + 0.3);
  // the loupe over the knobs: from 'million' through 'weights', gone before the tokens fly
  const loupeA = win(t, b.slam + 0.45, b.slam + 0.8) * (1 - win(t, b.bits - 0.55, b.bits - 0.3));
  const panR = scaleAnchors(theta).panR;
  return { theta, knobA, knobDy, callA, callU, toggles, leaf, ghostA, hallA, pour, loupeA, panR };
}

/** the label tokens: fly into the left pan on 'label', and are counted into a stack on 'Twelve' */
function tokensInPan(c: C, env: PaintEnv, px: number, py: number, t: number, b: B) {
  const tq = tq12(t);
  for (let i = 0; i < N_TOK; i++) {
    const t0 = b.bits - 0.42 + i * 0.07; // the first token lands on 'label'
    const u = clamp01((tq - t0) / 0.42);
    if (u <= 0) continue;
    // resting place: a little heap in the pan
    const row = i < 6 ? 0 : i < 10 ? 1 : 2;
    const col = row === 0 ? i - 2.5 : row === 1 ? i - 6 - 1.5 : i - 10 - 0.5;
    const hx = px + col * 24 + (hash1(i, 31) - 0.5) * 6;
    const hy = py - 8 - row * 18;
    // stacked: a column of coins seen edge-on, counted from the bottom
    const s = clamp01((tq - (b.twelve - 0.1 + i * 0.05)) / 0.3);
    const sx = px - 54;
    const sy = py - 8 - i * 9;
    const fx = lerp(-80, hx, sm(u));
    const fy = lerp(140, hy, sm(u)) - Math.sin(Math.PI * u) * 120;
    const x = lerp(fx, sx, sm(s));
    const y = lerp(fy, sy, sm(s));
    if (s > 0.02) {
      // an edge-on coin
      c.save();
      c.fillStyle = mixLab(env.mood.halo, env.mood.core, 0.3);
      c.beginPath();
      c.ellipse(x, y, lerp(13, 22, s), lerp(13, 5, s), 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = env.fill('ink');
      c.lineWidth = 1;
      c.stroke();
      c.restore();
      if (i === N_TOK - 1) glow(c, sx, py - 60, 90, env.mood.halo, 0.22 * s);
    } else token(c, x, y, 13, 10, env, { lit: 0.9 });
  }
}

/** knobs that close over the pressed photograph's edges (offsets around an 84 px card) */
const CLOSERS = Array.from({ length: 18 }, (_, i) => {
  const side = i % 4;
  const u = (Math.floor(i / 4) + 0.5 + (hash1(i, 71) - 0.5) * 0.6) / 4.5;
  const e = 42 + (hash1(i, 72) - 0.5) * 6;
  const along = (u - 0.5) * 84;
  const x = side === 0 ? along : side === 1 ? e : side === 2 ? along : -e;
  const y = side === 0 ? -e : side === 1 ? along : side === 2 ? e : along;
  return { x, y, r: 7 + hash1(i, 73) * 3, a: hash1(i, 74) * 6.28, d: hash1(i, 75) * 0.35 };
});

function pressedLeaf(c: C, env: PaintEnv, px: number, py: number, st: St) {
  if (!st.leaf) return;
  const u = st.leaf.u;
  const m = env.mood;
  const cx = px + 2;
  const cy = py - 66; // in the mountain's face
  const fly = sm(clamp01(u / 0.5));
  const press = sm(clamp01((u - 0.5) / 0.5));
  const x = lerp(px - 440, cx, fly);
  const y = lerp(py - 330, cy - 6, fly) - Math.sin(Math.PI * fly) * 70 + 6 * press;
  const S = 84;
  c.save();
  c.translate(x, y);
  c.rotate(lerp(-0.4, 0.04, fly));
  // the card: bright as it flies, sinking into the knobs' darkness as it is pressed (never fully gone)
  c.fillStyle = mixLab(mixLab(m.halo, m.core, 0.4), mixLab(m.set, m.ink, 0.35), 0.62 * press);
  c.fillRect(-S / 2, -S / 2, S, S);
  c.save();
  c.scale(S / 100, S / 100);
  c.translate(-50, -50);
  c.fillStyle = mixLab(m.ink, m.set, 0.25);
  c.fill(PICTURES[0]);
  // the imprint: the husky's outline embossed in the knob bed, catching the rim light
  if (press > 0.01) {
    c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.5), 0.75 * press);
    c.lineWidth = 2.6;
    c.stroke(PICTURES[0]);
  }
  c.restore();
  // the knobs close over its edges
  if (press > 0.01) {
    const ink = env.fill('ink');
    for (const k of CLOSERS) {
      const e = sm(clamp01((press - k.d) / (1 - k.d)));
      if (e <= 0.01) continue;
      const kx = k.x * lerp(1.25, 0.98, e);
      const ky = k.y * lerp(1.25, 0.98, e);
      c.fillStyle = ink;
      c.beginPath();
      c.arc(kx, ky, k.r * e, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha(m.rim, 0.55 * e);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(kx, ky);
      c.lineTo(kx + Math.cos(k.a) * k.r * 0.8 * e, ky + Math.sin(k.a) * k.r * 0.8 * e);
      c.stroke();
    }
  }
  c.restore();
  // on 'see': a ghost of the learned edge stencil it should have learned instead, beside the imprint, unlit
  if (st.ghostA > 0.01) ghostStencil(c, env, cx + 104, cy - 18, st.ghostA);
}

/** an unlit edge stencil: oriented grey stripes at a third of full strength inside a dashed frame */
function ghostStencil(c: C, env: PaintEnv, x: number, y: number, a: number) {
  const m = env.mood;
  const S = 64;
  c.save();
  c.globalAlpha *= a;
  c.beginPath();
  c.rect(x - S / 2, y - S / 2, S, S);
  c.save();
  c.clip();
  c.fillStyle = withAlpha(mixLab(m.set, m.ink, 0.3), 0.8);
  c.fillRect(x - S / 2, y - S / 2, S, S);
  c.translate(x, y);
  c.rotate(-0.55);
  for (let i = -5; i <= 5; i++) {
    c.fillStyle = withAlpha(i % 2 === 0 ? mixLab(m.halo, '#d8d2c4', 0.5) : m.ink, i % 2 === 0 ? 0.34 : 0.3);
    c.fillRect(i * 9 - 4.5, -S, 9, S * 2);
  }
  c.restore();
  c.setLineDash([5, 4]);
  c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), 0.85);
  c.lineWidth = 1.6;
  c.strokeRect(x - S / 2 - 4, y - S / 2 - 4, S + 8, S + 8);
  c.setLineDash([]);
  c.restore();
}

/** the knob loupe: a magnifier over the knob mountain, twelve potentiometer knobs at full size, each turning a
 *  little on twos (every weight is a knob the learning turns) */
function knobLoupe(c: C, env: PaintEnv, t: number, st: St) {
  const m = env.mood;
  const a = st.loupeA;
  const R = 84;
  const lx = 1058;
  const ly = 186;
  const tx = st.panR.x + 30;
  const ty = st.panR.y - 96;
  const tq = tq12(t);
  c.save();
  c.globalAlpha *= a;
  // the sight line from the loupe down to the mountain
  c.strokeStyle = withAlpha(m.halo, 0.5);
  c.setLineDash([3, 4]);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(lx - R * 0.55, ly + R * 0.8);
  c.lineTo(tx, ty);
  c.stroke();
  c.setLineDash([]);
  c.strokeStyle = withAlpha(m.halo, 0.6);
  c.beginPath();
  c.arc(tx, ty, 16, 0, Math.PI * 2);
  c.stroke();
  // the glass: lit from behind, the knobs dark on it
  glow(c, lx, ly, R * 1.7, m.halo, 0.22);
  c.save();
  c.beginPath();
  c.arc(lx, ly, R, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.fillRect(lx - R, ly - R, R * 2, R * 2);
  const ink = env.fill('ink');
  for (let i = 0; i < 12; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const kx = lx + (col - 1.5) * 38 + (row % 2) * 8 - 4;
    const ky = ly + (row - 1) * 40;
    const r = 15;
    // knurled skirt
    c.fillStyle = ink;
    c.beginPath();
    for (let j = 0; j < 24; j++) {
      const an = (j / 24) * Math.PI * 2;
      const rr = j % 2 ? r : r + 1.8;
      c.lineTo(kx + Math.cos(an) * rr, ky + 3 + Math.sin(an) * rr);
    }
    c.closePath();
    c.fill();
    // the cap with a rim highlight
    c.fillStyle = mixLab(ink, m.set, 0.25);
    c.beginPath();
    c.arc(kx, ky, r * 0.72, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(m.rim, 0.6);
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(kx, ky, r * 0.72, Math.PI * 1.05, Math.PI * 1.7);
    c.stroke();
    // the pointer notch, turning a little
    const an = hash1(i, 91) * Math.PI * 2 + 0.35 * Math.sin(tq * 2.2 + i * 1.7);
    c.strokeStyle = mixLab(m.core, m.halo, 0.4);
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(kx + Math.cos(an) * r * 0.15, ky + Math.sin(an) * r * 0.15);
    c.lineTo(kx + Math.cos(an) * r * 0.62, ky + Math.sin(an) * r * 0.62);
    c.stroke();
  }
  c.restore();
  // the loupe's rim and handle
  c.strokeStyle = ink;
  c.lineWidth = 7;
  c.beginPath();
  c.arc(lx, ly, R + 3, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(lx, ly, R + 6, Math.PI * 1.1, Math.PI * 1.65);
  c.stroke();
  c.fillStyle = ink;
  c.save();
  c.translate(lx + R * 0.72, ly + R * 0.72);
  c.rotate(-Math.PI / 4);
  c.fillRect(-7, 0, 14, 64);
  c.restore();
  c.restore();
}

// ------------------------------------------------------------------------------------------------ mirror hall
// a wall of six arched mirrors, two rows of three, down and left (x 15–270, y 270–530): clear of the reel's
// term tag (top-left) and of the left pan's chains (x ≥ 285)
const SHIFT: [number, number][] = [[-13, 9], [12, -10], [-11, -12], [14, 8], [-12, 11], [11, -9]];
const MIRRORS = [0, 1, 2, 3, 4, 5].map((i) => {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return { x: 52 + col * 90, y: 332 + row * 140, w: 74, h: 118, dx: SHIFT[i][0], dy: SHIFT[i][1], flips: (row + col) % 2 === 1 };
});

function hall(c: C, env: PaintEnv, t: number, b: B, st: St) {
  const m = env.mood;
  // farthest first
  for (let i = MIRRORS.length - 1; i >= 0; i--) {
    const M = MIRRORS[i];
    const on = win(t, b.mirror + i * 0.08, b.mirror + i * 0.08 + 0.3);
    // a card-flip on 'mirrored' (0.25 s each, staggered 0.08 s): the alternate crops turn to face the other way,
    // so both orientations stand side by side through the hold
    const flipU = M.flips ? clamp01((t - (b.flip + i * 0.08)) / 0.25) : 0;
    mirror(
      c,
      M.x,
      M.y,
      M.w,
      M.h,
      env,
      (cc) => {
        // the husky, a 224 crop of its 256 picture shifted by (dx, dy) in each glass; flipped on 'mirrored'
        const s = M.w * 1.12;
        cc.save();
        // each crop is the same picture shifted inside its frame (224 of 256): ±10–14 px, visible against the
        // frame edge; the card flips about the mirror's own axis
        cc.translate(M.x, M.y);
        const sx = Math.cos(Math.PI * flipU);
        cc.scale(Math.abs(sx) < 0.02 ? 0.02 : sx, 1);
        cc.translate(M.dx * Math.min(1, M.w / 80), M.dy * Math.min(1, M.w / 80));
        cc.fillStyle = mixLab(m.halo, m.core, 0.55 * on);
        cc.fillRect(-s / 2, -s / 2, s, s);
        cc.scale(s / 100, s / 100);
        cc.translate(-50, -50);
        cc.fillStyle = mixLab(m.ink, m.set, 0.3);
        cc.fill(PICTURES[0]);
        cc.restore();
      },
      st.hallA,
    );
    if (on > 0.01) glow(c, M.x, M.y, M.w * 1.3, m.halo, 0.22 * on * st.hallA);
  }
}

/** a heavy drape hanging close to the lens (L5): folds as darker and lighter vertical bands, a tie-back */
function curtain(c: C, env: PaintEnv, x0: number, x1: number, y0: number, y1: number, side: 1 | -1) {
  const fg = env.fill('fg');
  c.fillStyle = fg;
  c.beginPath();
  // the drape swags toward its tie-back at y 470 on the inner edge
  const inner = side === 1 ? x1 : x0;
  const outer = side === 1 ? x0 : x1;
  c.moveTo(outer, y0);
  c.lineTo(inner, y0);
  c.quadraticCurveTo(inner - side * 40, 300, inner - side * 70, 470);
  c.quadraticCurveTo(inner - side * 30, 600, inner + side * 10, y1);
  c.lineTo(outer, y1);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(env.mood.rim, 0.08);
  c.lineWidth = 6;
  c.beginPath();
  for (let k = 1; k < 5; k++) {
    const x = outer + ((inner - outer) * k) / 5.4;
    c.moveTo(x, y0);
    c.quadraticCurveTo(x + side * 6, 470, x - side * 4, y1);
  }
  c.stroke();
  // the tie-back
  c.fillStyle = mixLab(fg, env.mood.set, 0.25);
  c.fillRect(Math.min(inner - side * 90, inner - side * 40), 462, 50, 14);
}
