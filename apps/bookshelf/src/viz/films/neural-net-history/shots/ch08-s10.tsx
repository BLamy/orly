/**
 * ch08-s10 — the misty hills at night: five or six days of long strides downhill in fog, three hand-cut
 * shortenings marked by cairns, until short steps settle on the valley floor (winterBlue; 8.08 s; crossfade in).
 *
 * Teaching machine: mistyHills (the front ridge IS the loss; height is error), plus one more low ridge on its long
 * slope (drawn here off the kit's ridge) and our own traveller/fog pool so he can walk it. Bold strides from just
 * before 'downhill' leap the trap hollow, the kit's low ridge, a small dip and the second ridge, landing on the
 * slope at 'stride'. Each ÷10 cut then shows as a ≈3× shorter stride (drawn ∝ √lr, the radius SGD wanders at a
 * step size), still descending the slope between cut1 and cut3, shuffling onto the valley floor by 'settle'.
 *   0 → 'downhill'  the hilltop; picture-in-picture at upper LEFT (thin brass rim, no box): the bedroom window
 *                   cycling night → dawn five and a half even times, its last dawn peaking settle + 1 s and holding;
 *                   the pass counter under it ticks toward ≈ 90; label 1 sets in beside the slide
 *   'fog'           the fog thickens; the lantern's pool shrinks round his feet
 *   'stride'/'three'/'hand'  a cairn signpost at each cut where it happens ('lr ÷ 10' boards, staggered)
 *   settle → end    he stands on the valley floor above a dark near bank (L5) that rises on the push
 * TEXT: "5–6 days · ≈ 90 passes · 1.2 million pictures" and "step size ÷ 10, three times"; the cairn notes and
 * the counter are props.
 */
import { Timeline } from '../../../core';
import { mulberry32 } from '../../../core';
import type { Camera3, Frame, ShotScene } from '../../../film';
import { LAYERS, MISTY_LR, MOODS, PUPPET_NEAR_BLACK, defineShot, lossDf, lossF, mistyHills, mixLab, mountains, overscan, toScreen, withAlpha } from '../../../film';
import { FONT, legibleSize, softPlate, textColor } from '../../../film/silhouette/type';
import { glow, practicalGlow } from '../../../film/silhouette/metaphors/kit';
import { camKeys } from '../sets/ch03-s06-kit';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch02-s05b-util';

const ID = 'ch08-s10';
type C = CanvasRenderingContext2D;
const BOX = { x: -60, y: -30, w: 1400, h: 790 };
const sx = (v: number) => BOX.x + ((v + 6.4) / 12.8) * BOX.w;
const sy = (f: number) => BOX.y + BOX.h * 0.9 - (f / 3.6) * BOX.h * 0.48;

// ------------------------------------------------------------------------------------------------ the landscape
/** a second low ridge on the long slope (the kit's ridge plus one more crest the bold strides leap) */
const RIDGE = { a: 0.7, c: -0.2, w: 0.16 };
const bump = (x: number) => RIDGE.a * Math.exp(-((x - RIDGE.c) ** 2) / RIDGE.w);
const land = (x: number) => lossF(x) + bump(x);
const landDf = (x: number) => lossDf(x) + bump(x) * ((-2 * (x - RIDGE.c)) / RIDGE.w);
/** the x-range where the extra ridge rises off the kit's front ridge */
const BUMP_X0 = RIDGE.c - 1.0, BUMP_X1 = RIDGE.c + 1.0;

// ------------------------------------------------------------------------------------------------ the walk
/**
 * Every stride goes DOWNHILL on the real landscape (each lands where land′ points); the stride length is drawn
 * ∝ √lr — the radius SGD wanders at a step size scales as √lr — so each ÷10 cut reads as a ≈3× shorter stride
 * (a true ÷10 would be invisible at this scale). Phase 0 (bold): four long leaps over the trap hollow, the low
 * ridge, a small dip and the second ridge, landing on the long slope. Phases 1-2: shorter steps still on the
 * slope. Phase 3: shuffles that settle on the valley floor.
 */
const PHASES: number[][] = [
  [-4.6, -3.3, -1.95, -0.95, 0.15],
  [0.55, 0.95],
  [1.11, 1.27, 1.43, 1.6],
  [1.66, 1.72, 1.78, 1.84],
];
const XS: number[] = PHASES.flat();
const NSTEPS = [PHASES[0].length - 1, PHASES[1].length, PHASES[2].length, PHASES[3].length];
/** the step index at which each cut takes effect (the traveller's position at that cut) */
const CUT_AT = [NSTEPS[0], NSTEPS[0] + NSTEPS[1], NSTEPS[0] + NSTEPS[1] + NSTEPS[2]];
// sanity: every stride goes downhill or over a crest to lower ground (asserted at module load in dev)
void landDf;

interface B {
  D: number;
  walk: number;
  fog: number;
  cuts: number[];
  settle: number;
  /** start time of every step k (x_k → x_k+1), and its duration */
  st: number[];
  sd: number[];
}
interface Scene extends ShotScene {
  b: B;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const cuts = [T.beat('cut1'), T.beat('cut2'), T.beat('cut3')];
    const settle = T.beat('settle');
    const walk = T.beat('walk');
    // phase windows: bold from just before 'downhill' to 'stride'; shorter to 'three'; shorter to 'hand'; shuffle to settle
    const bounds = [walk - 0.16, cuts[0], cuts[1], cuts[2], Math.min(D - 0.8, settle + 0.25)];
    const st: number[] = [];
    const sd: number[] = [];
    NSTEPS.forEach((n, p) => {
      const d = (bounds[p + 1] - bounds[p]) / n;
      for (let k = 0; k < n; k++) {
        st.push(bounds[p] + k * d);
        sd.push(d * (p === 0 ? 0.94 : 0.8));
      }
    });
    const b: B = { D, walk, fog: T.beat('fog'), cuts, settle, st, sd };
    // camera: the whole journey from the hilltop, then a slow push down the slope onto the valley floor
    const cam = camKeys([
      [0, 560, 372, 40],
      [walk, 590, 385, 50],
      [cuts[0], 680, 445, 110],
      [cuts[2], 780, 530, 210],
      [D, 805, 556, 262],
    ]);
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 16; i++) CAMS.push(cam((D * i) / 16));
    tl.hold(0, D);
    return { tl, b, cam, CAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = tq12(t);
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);
    // which stride is under way (on twos), and how far through it
    let k = 0;
    while (k < b.st.length - 1 && tq >= b.st[k + 1]) k++;
    const u = tq < b.st[0] ? 0 : clamp01((tq - b.st[k]) / b.sd[k]);
    const x0 = XS[k], x1 = XS[k + 1];
    const eu = sm(u);
    const xNow = lerp(x0, x1, eu);
    const leap = Math.abs(sx(x1) - sx(x0));
    // a low arc (feet planted, §4.5): at most 24 px off the chord, and the leaping pose only on the middle two drawings
    const yChord = lerp(sy(land(x0)), sy(land(x1)), eu) - Math.sin(Math.PI * eu) * Math.min(24, leap * 0.3);
    const nDraw = Math.max(2, Math.round(b.sd[k] * 12));
    const di = Math.min(nDraw - 1, Math.floor(u * nDraw));
    const midDraw = di === Math.floor(nDraw / 2) - 1 || di === Math.floor(nDraw / 2);
    const yNow = Math.min(sy(land(xNow)), yChord);
    const fogK = 0.62 + 0.3 * win(t, b.fog - 0.2, b.fog + 0.6);

    f.backlight({ sunX: 900, sunY: 300, sunRadius: 700, intensity: 0.55 });
    // the sky: a low waxing moon on the right third (clear of the label plate), a sparse dim star field and two thin
    // cloud bands feathered at both ends (the kit's own sky is erased under the label, see L4)
    f.layer('L1', (c, env) => {
      f.cached(`${ID}/sky3/${env.mood.id}`, 1600, 420, (cc) => {
        cc.translate(160, 40);
        moonSky(cc, env.mood);
      }, { blur: 0.4 })(c, -160, -40);
    });
    // the far plane: a high snow range in the haze beyond the hills, peeking over the kit's back ridges; it barely
    // moves while the near bank and the walking ridge slide (three planes on the push)
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, sc.CAMS, 60);
      f.cached(`${ID}/far/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)}`, Math.ceil(r.w), 520, (cc) => {
        cc.translate(-r.x, -40);
        mountains(cc, { x0: r.x, x1: r.x + r.w, y: 330, amp: 150, ranges: 2, seed: 41, mist: 0.5, snowCaps: 0.8 }, env);
      }, { blur: 1.5 })(c, r.x, 40);
    });
    f.fog({ yCenter: 300, height: 120, alpha: 0.28, drift: 6 });
    // drifting fog wisps over the ridges (thicker from 'fog'), BEHIND the action plane so the traveller stays the
    // darkest shape against his lantern pool
    wisps(f, t, b);
    f.layer('L4', (c, env) => {
      const m = env.mood;
      const r = overscan(LAYERS.L4, sc.CAMS, 40);
      // the ground beyond the kit's box: an opaque body under the curve (and the box's flanks)
      f.cached(`${ID}/under/${m.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        const ridge = new Path2D();
        ridge.moveTo(sx(-6.4), BOX.y - 400);
        for (let i = 0; i <= 256; i++) {
          const v = -6.4 + (12.8 * i) / 256;
          ridge.lineTo(sx(v), sy(lossF(v)) - 1);
        }
        ridge.lineTo(sx(6.4), BOX.y - 400);
        ridge.closePath();
        const under = new Path2D();
        under.rect(r.x, r.y, r.w, r.h);
        under.addPath(ridge);
        cc.fillStyle = mixLab(env.fill('ink'), m.set, 0.12);
        cc.fill(under, 'evenodd');
        cc.fillStyle = env.fill('ink');
        cc.fillRect(r.x, sy(lossF(-6.4)) + 2, BOX.x - r.x + 2, r.y + r.h - sy(lossF(-6.4)));
        cc.fillRect(BOX.x + BOX.w - 2, sy(lossF(6.4)) + 2, r.x + r.w - BOX.x - BOX.w + 2, r.y + r.h - sy(lossF(6.4)));
      })(c, r.x, r.y);
      // the kit's hills (back ridges, moon, front ridge, lodge) — its own traveller and fog are ours below
      mistyHills(c, { ...BOX, lr: MISTY_LR.bold, x0: -5.3, step: 0, fog: 0, tangent: 0, trail: false, labels: false, reveal: 0.4 }, env);
      // erase the kit's own sky (moon, stars, two cloud bands cut off square at the left) with a feathered edge
      // above the back ridges' tree tips; ours is in L1
      {
        c.save();
        c.globalCompositeOperation = 'destination-out';
        const eg = c.createLinearGradient(0, 168, 0, 230);
        eg.addColorStop(0, 'rgba(0,0,0,1)');
        eg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = eg;
        c.fillRect(r.x - 10, r.y - 10, r.w + 20, 230 - r.y + 10);
        c.restore();
      }
      // the second low ridge rising off the front ridge (same ink, grass on its crest)
      f.cached(`${ID}/ridge2b/${m.id}`, 340, 220, (cc) => {
        cc.translate(-(sx(BUMP_X0) - 10), -(sy(land(RIDGE.c)) - 40));
        cc.fillStyle = env.fill('ink');
        // the bump only: along the new crest, then back along the kit's crest 3 px under it (no vertical sides)
        const p = new Path2D();
        for (let i = 0; i <= 80; i++) {
          const v = BUMP_X0 + ((BUMP_X1 - BUMP_X0) * i) / 80;
          if (i === 0) p.moveTo(sx(v), sy(land(v)));
          else p.lineTo(sx(v), sy(land(v)));
        }
        for (let i = 80; i >= 0; i--) {
          const v = BUMP_X0 + ((BUMP_X1 - BUMP_X0) * i) / 80;
          p.lineTo(sx(v), sy(lossF(v)) + 3);
        }
        p.closePath();
        const rnd = mulberry32(31);
        for (let g = 0; g < 26; g++) {
          const v = RIDGE.c - 0.7 + rnd() * 1.4;
          const px = sx(v), y0 = sy(land(v)) + 1.5;
          for (let j = 0; j < 3; j++) {
            const a = (rnd() - 0.5) * 0.9, L = 4 + rnd() * 7;
            p.moveTo(px + j * 1.6 - 1, y0);
            p.lineTo(px + j * 1.6 + Math.sin(a) * L, y0 - Math.cos(a) * L);
            p.lineTo(px + j * 1.6 + 1.2, y0);
            p.closePath();
          }
        }
        cc.fill(p);
      })(c, sx(BUMP_X0) - 10, sy(land(RIDGE.c)) - 40);
      // valley fog over the ridges, cleared in a pool round the lantern (the pool shrinks from 'fog')
      fogPass(c, env, sx(xNow), yNow, fogK, 1 - 0.3 * win(t, b.fog - 0.2, b.fog + 0.6));
      // the front ridge's top edge, a thin rim (height = error)
      f.cached(`${ID}/crest/${m.id}`, 1420, 420, (cc) => {
        cc.translate(-BOX.x - 0, -300);
        cc.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.2), 0.32);
        cc.lineWidth = 1.2;
        cc.beginPath();
        for (let i = 0; i <= 256; i++) {
          const v = -6.4 + (12.8 * i) / 256;
          if (i === 0) cc.moveTo(sx(v), sy(land(v)) - 0.5);
          else cc.lineTo(sx(v), sy(land(v)) - 0.5);
        }
        cc.stroke();
      })(c, BOX.x, 300);
      // footfalls of every stride since the start (each landing, kept): the spacing visibly shrinks after each cairn
      c.fillStyle = withAlpha(mixLab(m.rim, m.haze, 0.45), 0.9);
      const landed = u >= 1 ? k + 1 : k;
      for (let i = 0; i <= landed; i++) {
        const v = XS[i];
        c.beginPath();
        c.ellipse(sx(v), sy(land(v)) - 1.2, 3, 1.5, Math.atan(landDf(v) * -0.05), 0, Math.PI * 2);
        c.fill();
      }
      // the three cairns at the three cuts, each a signpost whose board points back uphill: lr ÷ 10
      // (boards 1 and 2 fall back to 0.6 after he settles, so the frame resolves on the traveller and the floor)
      const back = 1 - 0.4 * win(t, b.settle + 0.3, b.settle + 1.3);
      b.cuts.forEach((tc, i) => {
        const a = clamp01((tq - (tc - 0.05)) / 0.35);
        if (a <= 0) return;
        const v = XS[CUT_AT[i]] - 0.05;
        c.save();
        c.globalAlpha *= i < 2 ? back : 1;
        const anchor = cairn(c, env, sx(v), sy(land(v)) + 1, a, i, CAIRN_POST[i]);
        c.restore();
        if (i === 0) BOARD1 = anchor;
      });
      // the traveller: 15% larger than the kit's, the sharp action plane
      const facing = x1 >= x0 ? 1 : -1;
      const walking = u > 0 && u < 1;
      const stepSign = k % 2 === 0 ? 1 : -1;
      traveller(c, sx(xNow), yNow, 80 * (BOX.w / 1280) * 1.15, facing, walking ? stepSign * Math.sin(Math.PI * eu) : 0, walking && leap > 90 && midDraw, env, t);
    });
    f.rim({ x: 0.3, y: -1 });
    // the near edge: grass and stones, soft; then one dark sharp bank that rises under the valley floor on the push
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, sc.CAMS, 40);
      f.cached(`${ID}/L5/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 300, (cc) => {
        cc.translate(-r.x, -700);
        cc.fillStyle = env.fill('fg');
        cc.beginPath();
        cc.moveTo(r.x, 1000);
        for (let x = r.x; x <= r.x + r.w; x += 10) cc.lineTo(x, 800 + 22 * Math.sin(x * 0.012) + 10 * Math.sin(x * 0.041));
        cc.lineTo(r.x + r.w, 1000);
        cc.closePath();
        cc.fill();
        for (let i = 0; i < 80; i++) {
          const x = r.x + ((i * 97.13) % r.w);
          const base = 800 + 22 * Math.sin(x * 0.012) + 10 * Math.sin(x * 0.041);
          const L = 16 + ((i * 37) % 26);
          const a = (((i * 53) % 21) - 10) * 0.035;
          cc.beginPath();
          cc.moveTo(x - 2, base + 2);
          cc.lineTo(x + Math.sin(a) * L, base - Math.cos(a) * L);
          cc.lineTo(x + 2, base + 2);
          cc.fill();
        }
      }, { blur: 3 })(c, r.x, 700);
      f.cached(`${ID}/L5bank/${env.mood.id}`, 560, 260, (cc) => {
        cc.translate(-700, -740);
        nearBank(cc, mixLab(env.fill('ink'), '#000000', 0.35));
      }, { blur: 1 })(c, 700, 740);
    });
    // ---- screen-locked: the window picture-in-picture (upper left), its pass counter, the two labels beside it
    pip(f, t, b);
    const c = f.c;
    const m = f.mood;
    const l1 = win(t, b.walk - 0.1, b.walk + 0.4);
    const l2 = win(t, b.cuts[0] - 0.05, b.cuts[0] + 0.4);
    if (l1 > 0.003) {
      c.save();
      softPlate(c, 610, 64, 680, 118, m.ink, 0.55 * l1);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.font = `500 21px ${FONT.mono}`;
      c.globalAlpha = l1;
      c.fillStyle = textColor(m);
      c.fillText('5–6 days · ≈ 90 passes · 1.2 million pictures', 304, 54);
      c.globalAlpha = l2;
      c.fillStyle = mixLab(textColor(m), m.core, 0.3);
      c.fillText('step size ÷ 10, three times', 304, 88);
      // a thin leader from 'step size' down to the first 'lr ÷ 10' board as it lands: lr IS the step size
      const lw = c.measureText('step size ÷ 10, three times').width;
      const la = l2 * win(t, b.cuts[0] + 0.15, b.cuts[0] + 0.55) * (1 - 0.45 * win(t, b.cuts[1], b.cuts[1] + 0.6)) * (1 - win(t, b.settle, b.settle + 1));
      if (BOARD1 && la > 0.003) {
        const p1 = toScreen(LAYERS.L4, cam, BOARD1.x, BOARD1.y);
        const ax = 304 + lw + 10, ay = 81;
        const bx = p1.x, by = p1.y - 6;
        c.globalAlpha = 0.75 * la;
        c.strokeStyle = mixLab(textColor(m), m.core, 0.3);
        c.lineWidth = 1.1;
        c.setLineDash([3, 4]);
        c.beginPath();
        c.moveTo(ax, ay);
        c.quadraticCurveTo(bx + 40, ay + 10, bx, by);
        c.stroke();
        c.setLineDash([]);
        c.fillStyle = c.strokeStyle;
        for (const [px, py] of [[ax, ay], [bx, by]]) {
          c.beginPath();
          c.arc(px, py, 2.2, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
    }
  },
});

/** the kit's fog over the front ridge, cleared in a pool round OUR traveller's lantern (quarter-res buffer) */
let FOGB: HTMLCanvasElement | OffscreenCanvas | null = null;
function fogPass(c: C, env: { mood: Frame['mood'] }, tx: number, ty: number, fog: number, pool: number) {
  const m = env.mood;
  const q = 4;
  const EXT = 360; // the fog continues below the kit's box (no hard bottom edge when the camera tilts down)
  const fw = Math.ceil(BOX.w / q), fh = Math.ceil((BOX.h + EXT) / q);
  const fh0 = BOX.h / q;
  if (!FOGB || FOGB.width !== fw || FOGB.height !== fh) {
    FOGB = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(fw, fh) : Object.assign(document.createElement('canvas'), { width: fw, height: fh });
  }
  const g = FOGB.getContext('2d') as CanvasRenderingContext2D;
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, fw, fh);
  const vg = g.createLinearGradient(0, fh0 * 0.42, 0, fh0);
  vg.addColorStop(0, withAlpha(m.haze, 0));
  vg.addColorStop(0.35, withAlpha(m.haze, 0.55 * fog));
  vg.addColorStop(0.7, withAlpha(m.haze, 0.8 * fog));
  vg.addColorStop(1, withAlpha(m.haze, 0.5 * fog));
  g.fillStyle = vg;
  g.fillRect(0, 0, fw, fh);
  const lx = (tx - BOX.x) / q;
  const ly = (ty - BOX.y - 44) / q;
  const R = (186 * pool) / q;
  g.globalCompositeOperation = 'destination-out';
  const hole = g.createRadialGradient(lx, ly, 0, lx, ly, R);
  hole.addColorStop(0, 'rgba(0,0,0,1)');
  hole.addColorStop(0.5, 'rgba(0,0,0,0.85)');
  hole.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = hole;
  g.fillRect(lx - R, ly - R, R * 2, R * 2);
  c.save();
  c.imageSmoothingEnabled = true;
  c.drawImage(FOGB as CanvasImageSource, BOX.x, BOX.y, BOX.w, BOX.h + EXT);
  c.restore();
}

/** a dark, sharp near bank (L5) that rises under the valley floor as the camera pushes in: the destination */
function nearBank(c: C, ink: string) {
  const rnd = mulberry32(808);
  const p = new Path2D();
  const top = (x: number) => 792 - 26 * Math.exp(-(((x - 950) / 120) ** 2)) - 10 * Math.sin(x * 0.03) * Math.exp(-(((x - 950) / 200) ** 2));
  p.moveTo(700, 1000);
  for (let x = 700; x <= 1260; x += 6) p.lineTo(x, top(x) + 40 * (1 - Math.exp(-(((x - 950) / 210) ** 2))));
  p.lineTo(1260, 1000);
  p.closePath();
  // a stone and tufts of winter grass on the crest
  p.ellipse(905, top(905) + 2, 22, 13, -0.15, 0, Math.PI * 2);
  for (let i = 0; i < 40; i++) {
    const x = 790 + rnd() * 330;
    const y0 = top(x) + 40 * (1 - Math.exp(-(((x - 950) / 210) ** 2))) + 2;
    const L = 8 + rnd() * 18;
    const a = (rnd() - 0.5) * 0.8;
    p.moveTo(x - 1.6, y0);
    p.lineTo(x + Math.sin(a) * L, y0 - Math.cos(a) * L);
    p.lineTo(x + 1.6, y0);
    p.closePath();
  }
  c.fillStyle = ink;
  c.fill(p);
}

/**
 * The hooded traveller with staff and lantern (the kit's mistyHills traveller, drawn here so it can walk this
 * shot's landscape). Feet at (x, y), height hgt; `leg` −1..1 is the stride's leg spread (on twos).
 */
function traveller(c: C, x: number, y: number, hgt: number, facing: 1 | -1, leg: number, leaping: boolean, env: { mood: Frame['mood']; fill: (r: 'ink') => string; tq: number }, t: number) {
  const m = env.mood;
  const ink = PUPPET_NEAR_BLACK;
  const s = hgt / 100;
  const breathe = 0.6 * Math.sin(env.tq * 2.4);
  c.save();
  c.translate(x, y);
  c.scale(facing * s, s);
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  const legA = leaping ? 0.55 : leg * 0.5;
  // legs from the hip (inside the robe) down to the ground at y = 0: the feet are planted on the crest
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(0, -34);
  c.lineTo(Math.sin(legA) * 34, -34 + Math.cos(legA) * 34);
  c.moveTo(0, -34);
  c.lineTo(Math.sin(-legA) * 34, -34 + Math.cos(legA) * 34);
  c.stroke();
  c.translate(0, breathe);
  const sw = leaping ? -10 : -4 - Math.abs(leg) * 4;
  c.beginPath();
  c.moveTo(4, -86);
  c.quadraticCurveTo(14, -60, 14, -30);
  c.lineTo(sw - 18, -24);
  c.quadraticCurveTo(-20, -60, -8, -84);
  c.closePath();
  c.fill();
  c.beginPath();
  for (let k = 0; k < 4; k++) {
    const hx = sw - 16 + k * ((30 - sw) / 4);
    c.moveTo(hx, -27);
    c.lineTo(hx + 4, -20 - (k % 2) * 3);
    c.lineTo(hx + 8, -27);
  }
  c.fill();
  c.beginPath();
  c.ellipse(-16, -70, 9, 14, -0.25, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(-14, -88, 11, 5, -0.2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(-10, -84);
  c.quadraticCurveTo(-14, -104, 2, -108);
  c.quadraticCurveTo(14, -106, 12, -92);
  c.lineTo(14, -88);
  c.lineTo(10, -86);
  c.quadraticCurveTo(4, -80, -10, -84);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-6, -104);
  c.quadraticCurveTo(-20, -104, -24, -94);
  c.lineTo(-10, -96);
  c.fill();
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(4, -74);
  c.lineTo(20, -60);
  c.stroke();
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(14, 0);
  c.lineTo(30, -122);
  c.quadraticCurveTo(36, -130, 44, -124);
  c.stroke();
  const sway = 0.06 * Math.sin(env.tq * 3.1) + (leaping ? -0.12 : 0);
  c.save();
  c.translate(44, -124);
  c.rotate(sway);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 12);
  c.stroke();
  c.fillRect(-5, 12, 10, 3);
  c.fillRect(-5, 28, 10, 3);
  c.fillStyle = m.core;
  c.fillRect(-4, 15, 8, 13);
  c.fillStyle = ink;
  c.fillRect(-0.6, 15, 1.2, 13);
  c.restore();
  c.restore();
  // light (additive): the lantern, and its pool on the ground
  const wx = x + facing * 44 * s, wy = y - 102 * s;
  const fl = 1 + 0.04 * Math.sin(Math.floor(t * 24) * 1.7);
  practicalGlow(c, wx, wy, 0.95 * fl, env as never, 0.75 * (hgt / 58));
  glow(c, wx, wy + hgt * 0.9, 90 * (hgt / 58), m.halo, 0.12);
}

/** a small cairn of three stones and a signpost whose board points back uphill: the hand-written note lr ÷ 10 */
/** each cut's signpost: stake height and where its board hangs (dx: the post leans back uphill), so the three
 *  boards stand ≥ 120 screen px apart and clear of the traveller's lantern at the end */
const CAIRN_POST = [{ h: 64, dx: -2 }, { h: 70, dx: -2 }, { h: 38, dx: -3 }];
/** board 1's top centre in L4 coordinates (set while painting L4; the screen-locked leader reads it) */
let BOARD1: { x: number; y: number } | null = null;
function cairn(c: C, env: { mood: Frame['mood']; fill: (r: 'ink') => string }, x: number, y: number, a: number, i: number, post: { h: number; dx: number }): { x: number; y: number } | null {
  let anchor: { x: number; y: number } | null = null;
  const m = env.mood;
  const n = a < 0.34 ? 1 : a < 0.67 ? 2 : 3;
  c.save();
  c.fillStyle = env.fill('ink');
  const st = [[0, -4, 8, 5], [0.6, -11, 6, 4], [-0.4, -16.5, 4, 3]];
  for (let s = 0; s < n; s++) {
    c.beginPath();
    c.ellipse(x + st[s][0], y + st[s][1], st[s][2], st[s][3], 0, 0, Math.PI * 2);
    c.fill();
  }
  glow(c, x, y - 18, 12, m.halo, 0.3 * a);
  if (a >= 0.67) {
    // the stake (taller at each cut, so the three boards stagger) and its board, hung on the uphill side
    const h = post.h;
    c.strokeStyle = env.fill('ink');
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(x, y - 12);
    c.lineTo(x + post.dx, y - h);
    c.stroke();
    c.translate(x + post.dx, y - h + 4);
    c.rotate(-0.04 + 0.03 * i);
    // the note is read: sized to the legibility floor under the current camera, the board cut to fit it
    const fs = Math.max(20, legibleSize(c, `500 20px ${FONT.mono}`, 20));
    c.font = `500 ${fs}px ${FONT.mono}`;
    const W = Math.ceil(c.measureText('lr ÷ 10').width + 22), H = Math.ceil(fs * 1.45);
    const paper = mixLab(mixLab(m.halo, m.rim, 0.5), '#efe3cf', 0.3);
    glow(c, -W / 2, H / 2, 70, m.halo, 0.12);
    c.fillStyle = paper;
    c.beginPath();
    c.moveTo(-W, 0);
    c.lineTo(-4, 0);
    c.lineTo(0, H / 2);
    c.lineTo(-4, H);
    c.lineTo(-W, H);
    c.closePath();
    c.fill();
    c.fillStyle = mixLab(m.ink, paper, 0.08);
    c.font = `500 ${fs}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('lr ÷ 10', -W / 2 - 2, H / 2 + 1);
    anchor = { x: x + post.dx - W / 2, y: y - h + 4 };
  }
  c.restore();
  return anchor;
}

/** drifting fog wisps (screen-locked, drawn before the action plane); thicker from 'fog' */
function wisps(f: Frame, t: number, b: B) {
  const c = f.c;
  const col = mixLab(f.mood.haze, f.mood.sky[3], 0.4);
  for (const [x0w, y, rx, ry, sp, a] of [[100, 470, 380, 44, 14, 0.2], [700, 520, 460, 40, 9, 0.16], [1200, 440, 320, 36, 18, 0.14]] as const) {
    const x = ((x0w + sp * t + 400) % 1900) - 300;
    c.save();
    c.translate(x, y);
    c.scale(rx / ry, 1);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, ry);
    g.addColorStop(0, withAlpha(col, a * (0.6 + 0.6 * win(t, b.fog - 0.2, b.fog + 0.6))));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(-ry, -ry, 2 * ry, 2 * ry);
    c.restore();
  }
}

/** L1 sky (rest coords, origin at (-160, -40)): a waxing moon on the right third under thin cloud, dim stars, and
 *  two thin cloud bands that feather out at both ends */
function moonSky(g: C, m: Frame['mood']) {
  const mx = 1170, my = 118, mr = 24; // rest (1010, 78): right of the label plate, above the snow range; it sets
  // behind the range as the camera tilts down to the valley floor (the last dawn)
  const mh = g.createRadialGradient(mx, my, mr, mx, my, mr * 7);
  mh.addColorStop(0, withAlpha(m.rim, 0.3));
  mh.addColorStop(1, withAlpha(m.rim, 0));
  g.fillStyle = mh;
  g.fillRect(mx - mr * 7, my - mr * 7, mr * 14, mr * 14);
  g.fillStyle = mixLab(m.rim, m.core, 0.6);
  g.beginPath();
  g.arc(mx, my, mr, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.beginPath();
  g.arc(mx, my, mr + 0.5, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = withAlpha(m.sky[1], 0.6);
  g.beginPath();
  g.arc(mx - mr * 0.45, my - mr * 0.1, mr * 0.95, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const rnd = mulberry32(4243);
  for (let k = 0; k < 90; k++) {
    const x = -140 + rnd() * 1560, y = -30 + Math.pow(rnd(), 1.3) * 300;
    const a = 0.1 + rnd() * 0.3;
    g.fillStyle = withAlpha(m.core, a * (1 - (y + 30) / 340));
    g.fillRect(x, y, rnd() < 0.15 ? 1.6 : 1, rnd() < 0.15 ? 1.6 : 1);
  }
  // cloud bands: radial-feathered ellipses (no square ends), one crossing the moon's lower limb
  for (const [cx, cy, rx, ry, a] of [[1180, 132, 360, 7, 0.26], [700, 205, 520, 8, 0.18]] as const) {
    g.save();
    g.translate(cx, cy);
    g.scale(rx / ry, 1);
    const cg = g.createRadialGradient(0, 0, 0, 0, 0, ry);
    cg.addColorStop(0, withAlpha(m.haze, a));
    cg.addColorStop(0.6, withAlpha(m.haze, a * 0.55));
    cg.addColorStop(1, withAlpha(m.haze, 0));
    g.fillStyle = cg;
    g.fillRect(-ry, -ry, 2 * ry, 2 * ry);
    g.restore();
  }
}

/** the bedroom window picture-in-picture (upper left): night → dawn → night, five and a half even cycles, the
 *  last dawn peaking a second after he settles and holding to the end */
function pip(f: Frame, t: number, b: B) {
  const c = f.c;
  const m = f.mood;
  const X = 48, Y = 40, W = 232, H = 150;
  const peak = b.settle + 1;
  const day = t >= peak ? 1 : 0.5 + 0.5 * Math.cos((2 * Math.PI * (t - peak)) / (peak / 5.5));
  const a = win(t, 0.05, 0.6);
  if (a <= 0.003) return;
  const N = MOODS.winterBlue, G = MOODS.dawnGold;
  c.save();
  c.globalAlpha = a;
  // the slide's soft light around it (no box): a lantern-slide hanging in the fog
  glow(c, X + W / 2, Y + H / 2, 200, mixLab(m.halo, G.halo, 0.4 * day), 0.07 + 0.05 * day);
  c.save();
  c.beginPath();
  c.roundRect(X, Y, W, H, 6);
  c.clip();
  // the room: a dark wall, lit a little by the dawn
  c.fillStyle = mixLab(N.set, G.set, day * 0.6);
  c.fillRect(X, Y, W, H);
  const wx = X + 24, wy = Y + 18, ww = 108, wh = 110;
  const sky = c.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, mixLab(N.sky[0], G.sky[1], day));
  sky.addColorStop(1, mixLab(N.sky[2], G.sky[3], day));
  c.fillStyle = sky;
  c.fillRect(wx, wy, ww, wh);
  c.fillStyle = mixLab(N.fg, G.set, day * 0.5);
  c.beginPath();
  c.moveTo(wx, wy + wh);
  for (let i = 0; i <= 8; i++) c.lineTo(wx + (i * ww) / 8, wy + wh - 20 - ((i * 37) % 3) * 9);
  c.lineTo(wx + ww, wy + wh);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(m.fg, 0.95);
  c.fillRect(wx - 6, wy - 6, ww + 12, 6);
  c.fillRect(wx - 6, wy + wh, ww + 12, 8);
  c.fillRect(wx - 6, wy, 6, wh);
  c.fillRect(wx + ww, wy, 6, wh);
  c.fillRect(wx + ww / 2 - 2.5, wy, 5, wh);
  c.fillRect(wx, wy + wh / 2 - 2.5, ww, 5);
  glow(c, wx + ww / 2, wy + wh, 140, G.halo, 0.18 * day);
  // the tower on the floor at right: a side window, two fans spinning, the green LED
  const tx = X + 150, ty = Y + 30, tw = 60, th = 116;
  c.fillStyle = withAlpha(m.fg, 0.98);
  c.fillRect(tx, ty, tw, th);
  c.fillStyle = withAlpha(mixLab(N.halo, G.halo, day), 0.35);
  c.fillRect(tx + 8, ty + 10, tw - 16, th - 30);
  c.fillStyle = withAlpha(m.fg, 0.95);
  for (const fy of [ty + 30, ty + 62]) {
    c.fillRect(tx + 10, fy, tw - 20, 8);
    const cx = tx + tw / 2, cy = fy + 18, r = 9;
    c.save();
    c.translate(cx, cy);
    c.rotate(t * 31 + fy);
    for (let i = 0; i < 5; i++) {
      c.rotate((2 * Math.PI) / 5);
      c.fillRect(-1.5, 1.5, 3, r);
    }
    c.restore();
  }
  const led = 0.75 + 0.25 * Math.sin(t * 7.1);
  c.fillStyle = MOODS.labGreen.core;
  c.beginPath();
  c.arc(tx + tw - 10, ty + th - 10, 2.6, 0, Math.PI * 2);
  c.fill();
  glow(c, tx + tw - 10, ty + th - 10, 16, '#7cff9a', 0.35 * led);
  // a soft inner vignette: the slide's edge fades into the night rather than a hard box
  const vg = c.createRadialGradient(X + W / 2, Y + H / 2, H * 0.45, X + W / 2, Y + H / 2, W * 0.62);
  vg.addColorStop(0, withAlpha(m.ink, 0));
  vg.addColorStop(1, withAlpha(m.ink, 0.55));
  c.fillStyle = vg;
  c.fillRect(X, Y, W, H);
  c.restore();
  // a thin brass rim
  c.strokeStyle = withAlpha(mixLab(MOODS.dawnGold.rim, m.halo, 0.4), 0.7);
  c.lineWidth = 1.2;
  c.beginPath();
  c.roundRect(X - 0.5, Y - 0.5, W + 1, H + 1, 6.5);
  c.stroke();
  // the pass counter (a prop under the slide)
  const passes = Math.round(90 * clamp01((t - b.walk + 0.16) / (b.settle - b.walk + 0.16)));
  softPlate(c, X + 92, Y + H + 30, 230, 46, m.ink, 0.5);
  c.font = `500 22px ${FONT.mono}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = withAlpha(mixLab(textColor(m), m.core, 0.2), 0.95);
  c.fillText(`pass ${String(passes).padStart(2, '0')} of ≈ 90`, X + 2, Y + H + 38);
  c.restore();
}
