/**
 * ch08-s08b — "snuffed a random half each time" (dawnGold; 12.4 s; plain cut in from the scale of ch08-s08).
 * The cathedral's two great halls in miniature, between its towers at dawn: below, a stub of the stencil courses
 * (conv5's six lit windows over the round picture window), never snuffed; above, the two great halls as looms of
 * lanterns (fc6, fc7); at the crown, the last hall of a thousand small lanterns (fc8, never snuffed).
 * Dropout is bound to real arithmetic (sets/ch08-s08b-halls): fixed seeded weights, a fresh random half of fc6 and
 * of fc7 zeroed per example, glow ← the unit's activation.
 *
 *   0 → 'halls'   low on the stub: a picture sits in the round window, every lantern in both halls lit; on 'halls'
 *                 the camera cranes up to frame the two halls and the crown.
 *   'snuffed'     a new thumbnail slides into the window; its light climbs, and exactly the lanterns the mask zeroes
 *                 in fc6 and then fc7 go dark, each with a wisp of smoke; light rises only through the survivors.
 *                 Label: dropout · p = 0.5 · the two big halls only (fc6, fc7).
 *   'time'        the next thumbnail, a DIFFERENT half goes dark (new seed); then about one example a second,
 *                 through the whole team sentence (several full snuff / relight cycles) and into the hold.
 *   'lantern'     one surviving fc7 lantern is ringed; on 'another' its thread reaches down for the fc6 neighbour it
 *                 leaned on, which has just gone dark, and finds nothing; it burns on by itself.
 *   hold          the snuffing goes on, music-led; the camera eases right, and at the frame edge the pressed leaf of
 *                 ch08-s08 (the memorised photograph) loosens and falls out of the knob mountain.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { LAYERS, defineShot, mixLab, overscan, withAlpha } from '../../../film';
import { forestBand, ridgeline } from '../../../film/silhouette/nature';
import { glow, knot, paperLantern, thread, threadPoint, weightColor } from '../../../film/silhouette/metaphors/kit';
import { FONT, legibleFont } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/silhouette/atmosphere';
import { GEO, N6, N7, N8, NS, STAGGER, WEIGHTS, beams, makeExamples, pos, tinyLantern, towers, wisp } from '../sets/ch08-s08b-halls';
import type { Example } from '../sets/ch08-s08b-halls';
import { knobMountain } from '../sets/ch08-s08-scale';
import { PICTURES, clamp01, inkLabel, lerp, monotone, picture, pulse, sm, tq12, win } from '../sets/ch08-s06-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s08b';
const FOCUS_EX = 3; // the example (0-based in `times`) whose snuffing the 'another' beat watches
const MOUNT = { x: 1190, y: 702 }; // the knob mountain's corner, ~140 px into the frame's lower right
const FC8_EVERY = 4; // fc7 → fc8 threads drawn to every 4th small lantern

interface B {
  D: number;
  halls: number;
  drop: number;
  like: number;
  lantern: number;
  another: number;
  leaf: number;
  ex: Example[];
  focus: { S: number; N: number };
  cam: { x: (t: number) => number; y: (t: number) => number; z: (t: number) => number };
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const halls = T.beat('halls');
    const drop = T.beat('drop');
    const again = T.beat('again');
    const on = T.word('L0830', 'on');
    const e3 = Math.max(on - 0.02, again + 1.6);
    // then about one example a second: under the whole team sentence ('Like' → 'work', several full snuff /
    // relight cycles) and on into the music-led hold under the falling leaf; the last lands over a second before the cut
    // the first snuff lands ON 'snuffed' (fc6 dark by ~1.85, fc7 by ~2.05); its light starts climbing on 'halls'
    const times = [drop - 0.08, again, (again + e3) / 2, e3];
    const like = T.word('L0830', 'Like');
    const another = T.word('L0830', 'another');
    const step = Math.max(0.85, Math.min(1.05, (T.line('L0830').end - like) / 4));
    // after the focus example the 'another' reach holds the stage ~1.25 s before the next example arrives
    for (let tt = Math.max(e3 + 0.9, another + 1.3); tt <= D - 1.15; tt += step) times.push(tt);
    const { ex, focus } = makeExamples(times, FOCUS_EX);
    const b: B = {
      D,
      halls,
      drop,
      like,
      lantern: T.word('L0830', 'lantern'),
      another: T.word('L0830', 'another'),
      leaf: T.beat('leaf'),
      ex,
      focus,
      cam: {
        // the drift right begins on 'Like' (the near column slides against the halls and the back wall)
        x: monotone([
          [0, 640],
          [like, 640],
          [D, 700],
        ]),
        y: monotone([
          [0, 516],
          [halls - 0.75, 512],
          [halls + 1.45, 356],
          [D, 344],
        ]),
        z: monotone([
          [0, 128],
          [halls - 0.75, 124],
          [halls + 1.45, 14],
          [D, 46],
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
    const cams = [camAt(0), camAt(b.halls + 1.45), camAt(b.D)];
    f.camera(cam);
    f.backlight({ sunX: 640, sunY: 660, sunRadius: 480, intensity: 0.6 });
    // L1: far hills and a town's trees under the dawn
    f.layer('L1', (c, env) => {
      const r = overscan(LAYERS.L1, cams, 40);
      f.cached(`${ID}/L1/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        ridgeline(cc, { x0: r.x, x1: r.x + r.w, y: 600, amp: 64, seed: 81, scale: 420, ground: 400 }, env);
        forestBand(cc, { x0: r.x, x1: r.x + r.w, y: 628, h: 30, kind: 'leafy', density: 3, seed: 82, ground: 300 }, env);
      })(c, r.x, r.y);
    });
    // L2: the halls' back wall, dark, cut by three tall lancets and an oculus (holes: the dawn shows through)
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, cams, 40);
      f.cached(`${ID}/L2/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        backWall(cc, env, r);
      })(c, r.x, r.y);
    });
    f.fog({ yCenter: 0.6 * 720, height: 0.4 * 720, alpha: 0.16, drift: 6 });
    // L3: the cathedral's two towers, framing the halls
    f.layer('L3', (c, env) => {
      const r = overscan(LAYERS.L3, cams, 40);
      f.cached(`${ID}/L3/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        towers(cc, env);
      })(c, r.x, r.y);
    });
    f.fog({ yCenter: 0.72 * 720, height: 0.2 * 720, alpha: 0.08, drift: 4 });

    const st = teach(t, b);
    f.layer('L4', (c, env) => {
      const r = overscan(LAYERS.L4, cams, 40);
      // lit panes behind the stub's window holes, then the static beams and stub over them
      stubLight(c, env, st);
      f.cached(`${ID}/L4/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        beams(cc, env);
      })(c, r.x, r.y);
      threads(c, env, st, t, b);
      lanterns(c, env, st, t, b);
      focusBeat(c, env, st, t, b);
      // the knob mountain at the frame edge, and its pressed leaf
      knobMountain(c, MOUNT.x, MOUNT.y, env, 1, f.pxScale);
      leaf(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // L5: a near cluster-column at the left edge (blurred), so the crane and the drift show three planes
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5-col/${env.mood.id}`, 260, 2200, (cc) => {
        cc.translate(130, 700);
        nearColumn(cc, env);
      })(c, -130 + 150, -700);
    });

    // ---------------------------------------------------------------- type (screen-locked)
    const la = win(t, b.drop + 0.1, b.drop + 0.7);
    if (la > 0.01) {
      inkLabel(f.c, 'dropout · p = 0.5 · the two big halls only (fc6, fc7)', 72, 92, {
        size: 24,
        font: `500 24px ${FONT.mono}`,
        color: mixLab('#efe3cf', f.mood.core, 0.25),
        plate: f.mood.ink,
        plateAlpha: 0.6,
        alpha: la,
      });
    }
    const ia = win(t, b.drop + 0.5, b.drop + 1.1) * 0.75;
    if (ia > 0.01) {
      const [font, size] = legibleFont(f.c, `500 16px ${FONT.mono}`, 'ILLUSTRATIVE');
      inkLabel(f.c, 'ILLUSTRATIVE', 1208, 92, {
        size,
        font,
        tracking: 2.5,
        align: 'right',
        color: withAlpha(mixLab(f.mood.rim, '#efe3cf', 0.4), 0.85),
        plate: f.mood.ink,
        plateAlpha: 0.45,
        alpha: ia,
      });
    }
  },
});

function backWall(c: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const wall = new Path2D();
  wall.rect(r.x, r.y, r.w, r.h);
  const lancet = (x: number, w: number, y0: number, y1: number) => {
    wall.moveTo(x - w / 2, y1);
    wall.lineTo(x - w / 2, y0 + w * 0.7);
    wall.quadraticCurveTo(x - w / 2, y0 + w * 0.1, x, y0 - w * 0.25);
    wall.quadraticCurveTo(x + w / 2, y0 + w * 0.1, x + w / 2, y0 + w * 0.7);
    wall.lineTo(x + w / 2, y1);
    wall.closePath();
  };
  for (const [x, w, y0] of [
    [640, 64, 150],
    [440, 46, 210],
    [840, 46, 210],
  ] as const)
    lancet(x, w, y0, 640);
  wall.moveTo(640 + 38, 70);
  wall.arc(640, 70, 38, 0, Math.PI * 2);
  // dark like s05's cathedral against its sky (the dawn gold reads only through the lancets)
  c.fillStyle = mixLab(env.fill('set'), env.mood.ink, 0.78);
  c.fill(wall, 'evenodd');
  // tracery in the lancets and the oculus: thin set bars
  c.fillStyle = mixLab(env.fill('set'), env.mood.ink, 0.4);
  for (const [x, y0] of [
    [640, 150],
    [440, 210],
    [840, 210],
  ] as const) {
    c.fillRect(x - 1.5, y0, 3, 640 - y0);
    for (let y = y0 + 90; y < 640; y += 110) c.fillRect(x - 32, y - 1.5, 64, 3);
  }
  c.fillRect(640 - 38, 69, 76, 2.5);
  c.fillRect(639, 32, 2.5, 76);
  // faint panelling cut-lines on the wall
  c.strokeStyle = withAlpha(env.mood.rim, 0.06);
  c.lineWidth = 1;
  for (let x = Math.floor(r.x / 120) * 120 + 20; x < r.x + r.w; x += 120) {
    if (Math.abs(x - 640) < 70 || Math.abs(x - 440) < 60 || Math.abs(x - 840) < 60) continue;
    c.strokeRect(x, 150, 96, 470);
  }
}

// ================================================================================================= TEACHING
interface LayerState {
  /** displayed glow per unit */
  g: number[];
  /** wisps: [unit, age] */
  wisps: [number, number][];
  /** the example index whose state is (becoming) current */
  k: number;
}
interface St {
  l6: LayerState;
  l7: LayerState;
  l8: LayerState;
  /** stub glow per window */
  s: number[];
  /** forward flow: position 0..3 of the light climbing (stub→fc6→fc7→fc8) for the latest example, or -1 */
  flow: number;
  flowK: number;
  /** picture window: current picture, previous picture and slide 0..1 */
  pic: number;
  prevPic: number;
  slide: number;
}

function layerState(t: number, ex: Example[], key: 'g6' | 'g7' | 'g8', lag: number, snuffable: boolean): LayerState {
  let k = 0;
  for (let i = 1; i < ex.length; i++) if (t >= ex[i].t + lag) k = i;
  const n = ex[0][key].length;
  const g: number[] = new Array(n);
  const wisps: [number, number][] = [];
  const ds = t - (ex[k].t + lag);
  for (let i = 0; i < n; i++) {
    const cur = ex[k][key][i];
    const prev = k > 0 ? ex[k - 1][key][i] : cur;
    if (snuffable && prev > 0 && cur === 0) {
      g[i] = prev * (1 - clamp01(ds / 0.09));
      wisps.push([i, ds]);
    } else if (snuffable && prev === 0 && cur > 0) {
      // relit: a quick catch of the wick
      g[i] = cur * sm(ds / 0.22);
    } else g[i] = lerp(prev, cur, sm(ds / 0.25));
    // the wisp of the snuffing before this one may still be rising
    if (snuffable && k > 1) {
      const ds2 = t - (ex[k - 1].t + lag);
      if (ex[k - 2][key][i] > 0 && ex[k - 1][key][i] === 0 && ds2 < 1.6) wisps.push([i, ds2]);
    }
  }
  return { g, wisps, k };
}

/** how long before example i's fc6 switch its light starts to climb from the stub (the first starts on 'halls') */
const lead = (b: B, i: number) => (i === 1 ? Math.max(0.3, b.ex[1].t - b.halls) : 0.3);

function teach(t: number, b: B): St {
  const ex = b.ex;
  const l6 = layerState(t, ex, 'g6', 0, true);
  const l7 = layerState(t, ex, 'g7', STAGGER, true);
  const l8 = layerState(t, ex, 'g8', 2 * STAGGER, false);
  // the stub glows with the picture's six features, pulsing as each new picture arrives
  let kp = 0;
  for (let i = 1; i < ex.length; i++) if (t >= ex[i].t - lead(b, i)) kp = i;
  const arrive = kp > 0 ? pulse(t, ex[kp].t - lead(b, kp), 0.12, 0.45) : 0;
  const s = ex[kp].a0.map((a, i) => {
    const prev = kp > 0 ? ex[kp - 1].a0[i] : a;
    return lerp(prev, a, sm((t - (ex[kp].t - lead(b, kp))) / 0.2)) * (0.8 + 0.35 * arrive);
  });
  // the forward climb of the newest example: 0 at the stub (t - 0.3) → 1 at fc6 (t) → 2 at fc7 → 3 at fc8
  let flow = -1;
  let flowK = 0;
  for (let i = 1; i < ex.length; i++) {
    const L = lead(b, i);
    const t0 = ex[i].t - L;
    const t3 = ex[i].t + 2 * STAGGER;
    if (t >= t0 && t <= t3 + 0.05) {
      flowK = i;
      flow = t < ex[i].t ? (t - t0) / L : 1 + (t - ex[i].t) / STAGGER;
    }
  }
  // the picture window: the next picture slides in over the 0.3 s before its light starts to climb
  let kw = 0;
  for (let i = 1; i < ex.length; i++) if (t >= ex[i].t - lead(b, i) - 0.3) kw = i;
  const slide = kw > 0 ? sm((t - (ex[kw].t - lead(b, kw) - 0.3)) / 0.3) : 1;
  return { l6, l7, l8, s, flow, flowK, pic: ex[kw].pic, prevPic: kw > 0 ? ex[kw - 1].pic : ex[kw].pic, slide };
}

// ================================================================================================= PAINT
function stubLight(c: C, env: PaintEnv, st: St) {
  const m = env.mood;
  for (let i = 0; i < NS; i++) {
    const p = pos.stub(i);
    const a = clamp01(st.s[i]);
    c.fillStyle = mixLab(mixLab(m.halo, m.ink, 0.5), m.core, 0.25 + 0.6 * a);
    c.fillRect(p.x - 10, p.y - 18, 20, 34);
    glow(c, p.x, p.y, 34, m.halo, 0.32 * a);
  }
  // the round picture window: the newest thumbnail slides in from the left, the last one slides out right
  const W = GEO.win;
  c.save();
  c.beginPath();
  c.arc(W.x, W.y, W.r + 1, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = mixLab(m.halo, m.core, 0.35);
  c.fillRect(W.x - W.r - 2, W.y - W.r - 2, W.r * 2 + 4, W.r * 2 + 4);
  const ink = mixLab(m.ink, m.set, 0.3);
  const light = mixLab(m.halo, m.core, 0.45);
  const sz = W.r * 1.9;
  const dx = (1 - st.slide) * sz;
  if (st.slide < 1) picture(c, st.prevPic, W.x + (sz - dx) * 1.05, W.y, sz, ink, light, 1);
  picture(c, st.pic, W.x - dx * 1.05, W.y, sz, ink, light, 1);
  c.restore();
  glow(c, W.x, W.y, W.r * 2.6, m.halo, 0.22);
}

const lit = (g: number) => (g > 0.02 ? 1 : 0);

function threads(c: C, env: PaintEnv, st: St, t: number, b: B) {
  const m = env.mood;
  const r = GEO.r;
  const { W1, W2, W3 } = WEIGHTS;
  // the web sits about 30% quieter than the lanterns; during the 'another' reach it dims to 30% so one thread reads
  const k = 0.7 * (1 - 0.7 * focusDim(t, b));
  const draw = (x0: number, y0: number, x1: number, y1: number, w: number, a0: number, on: number) => {
    const a = a0 * k;
    thread(
      c,
      {
        x0,
        y0,
        x1,
        y1,
        sag: 3,
        w: 0.5 + Math.min(1.3, Math.abs(w) * 1.2),
        color: mixLab(weightColor(m, w), m.core, 0.35 * on),
        alpha: a,
      },
      env,
    );
  };
  // stub → fc6 (every window feeds every lantern; a dark lantern takes no light)
  for (let j = 0; j < N6; j++) {
    const q = pos.fc6(j);
    const on = st.l6.g[j];
    for (let i = 0; i < NS; i++) {
      const p = pos.stub(i);
      draw(p.x, p.y - 16, q.x, q.y + r * 0.95, W1[j][i], 0.05 + 0.26 * on, on);
    }
  }
  // fc6 → fc7: lit only where both ends burn
  for (let j = 0; j < N7; j++) {
    const q = pos.fc7(j);
    for (let i = 0; i < N6; i++) {
      const p = pos.fc6(i);
      const on = Math.min(st.l6.g[i], st.l7.g[j]);
      draw(p.x, p.y - r * 1.1, q.x, q.y + r * 0.95, W2[j][i], 0.035 + 0.24 * on, on);
    }
  }
  // fc7 → fc8 (to every 4th small lantern; the crown is never snuffed)
  for (let j = 0; j < N8; j += FC8_EVERY) {
    const q = pos.fc8(j);
    for (let i = 0; i < N7; i++) {
      const p = pos.fc7(i);
      const on = st.l7.g[i];
      draw(p.x, p.y - r * 1.1, q.x, q.y + 6, W3[j][i], 0.03 + 0.16 * on, on);
    }
  }
  // the forward light of the newest example climbs only through the survivors
  if (st.flow >= 0) {
    const e = b.ex[st.flowK];
    const seg = Math.floor(st.flow);
    const u = sm(st.flow - seg);
    if (seg === 0) {
      for (let j = 0; j < N6; j++) {
        if (!e.m6[j]) continue;
        const q = pos.fc6(j);
        for (let i = 0; i < NS; i++) {
          const p = pos.stub(i);
          const T = { x0: p.x, y0: p.y - 16, x1: q.x, y1: q.y + r * 0.95, sag: 3 };
          const pt = threadPoint(T, u);
          knot(c, pt.x, pt.y, 2 + 1.6 * clamp01(W1[j][i]), 0.35 + 0.5 * clamp01(W1[j][i] * e.a0[i]), env);
        }
      }
    } else if (seg === 1) {
      for (let j = 0; j < N7; j++) {
        if (!e.m7[j]) continue;
        const q = pos.fc7(j);
        for (let i = 0; i < N6; i++) {
          if (!lit(e.g6[i])) continue;
          const p = pos.fc6(i);
          const pt = threadPoint({ x0: p.x, y0: p.y - r * 1.1, x1: q.x, y1: q.y + r * 0.95, sag: 3 }, u);
          knot(c, pt.x, pt.y, 2 + 1.6 * clamp01(W2[j][i]), 0.3 + 0.55 * clamp01(W2[j][i] * e.g6[i]), env);
        }
      }
    } else if (seg === 2) {
      for (let j = 0; j < N8; j += FC8_EVERY) {
        const q = pos.fc8(j);
        for (let i = 0; i < N7; i++) {
          if (!lit(e.g7[i])) continue;
          const p = pos.fc7(i);
          const pt = threadPoint({ x0: p.x, y0: p.y - r * 1.1, x1: q.x, y1: q.y + 6, sag: 3 }, u);
          knot(c, pt.x, pt.y, 1.8, 0.25 + 0.4 * e.g7[i], env);
        }
      }
    }
  }
}

/** 0..1: the web dims while the ringed survivor reaches for its dark neighbour (1.2 s from 'another') */
const focusDim = (t: number, b: B) => win(t, b.another - 0.12, b.another + 0.12) * (1 - win(t, b.another + 1.0, b.another + 1.25));

function lanterns(c: C, env: PaintEnv, st: St, t: number, b: B) {
  const r = GEO.r;
  const S = b.focus.S;
  const solo = soloFlare(t, b);
  for (let i = 0; i < N6; i++) {
    const p = pos.fc6(i);
    paperLantern(c, { x: p.x, y: p.y, r, act: st.l6.g[i], tassel: false }, env);
  }
  for (let i = 0; i < N7; i++) {
    const p = pos.fc7(i);
    paperLantern(c, { x: p.x, y: p.y, r, act: st.l7.g[i], tassel: false, flare: i === S ? solo : 0 }, env);
  }
  for (let i = 0; i < N8; i++) {
    const p = pos.fc8(i);
    tinyLantern(c, env, p.x, p.y, st.l8.g[i]);
  }
  // smoke from the snuffed wicks
  for (const [i, age] of st.l6.wisps) {
    const p = pos.fc6(i);
    wisp(c, env, p.x, p.y - r * 0.6, age, 600 + i + st.l6.k * 13);
  }
  for (const [i, age] of st.l7.wisps) {
    const p = pos.fc7(i);
    wisp(c, env, p.x, p.y - r * 0.6, age, 700 + i + st.l7.k * 13);
  }
}

// ------------------------------------------------------------------------------------------------ 'another'
function soloFlare(t: number, b: B): number {
  const reachEnd = b.another + 0.55;
  return win(t, reachEnd + 0.1, reachEnd + 0.45) * (1 - win(t, reachEnd + 0.9, reachEnd + 1.4)) * 0.8;
}

/** the ringed survivor S reaches down its thread for N, which has just gone dark, and finds nothing */
function focusBeat(c: C, env: PaintEnv, st: St, t: number, b: B) {
  const m = env.mood;
  const r = GEO.r;
  const S = pos.fc7(b.focus.S);
  const N = pos.fc6(b.focus.N);
  const e4 = b.ex[FOCUS_EX + 2]?.t ?? b.D;
  const ring = win(t, b.lantern - 0.15, b.lantern + 0.3) * (1 - win(t, e4 - 0.45, e4 - 0.1));
  if (ring > 0.01) {
    c.save();
    c.globalAlpha *= ring;
    c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.4), 0.85);
    c.lineWidth = 1.4;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.arc(S.x, S.y, r * 1.85, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }
  // the reach: ONE bright thread stretches from S down to N (just gone dark), catches nothing, and its tip
  // sparks out at the dark lantern; the web around it is dimmed to 30% (threads()) for 1.2 s; then it falls slack
  const t0 = b.another - 0.08;
  const t1 = b.another + 0.42;
  if (t > t0 && t < b.another + 1.25) {
    const u = sm((t - t0) / (t1 - t0));
    const slack = sm(clamp01((t - t1 - 0.5) / 0.45));
    const fade = 1 - win(t, b.another + 0.95, b.another + 1.25);
    const T = { x0: S.x, y0: S.y + r * 0.95, x1: N.x, y1: N.y - r * 1.1 - 2, sag: 4 + 26 * slack };
    const rimC = mixLab(m.rim, m.core, 0.35);
    glowThread(c, env, T, u, fade, rimC);
    thread(c, { ...T, w: 2.8, color: rimC, alpha: 0.95 * fade, draw: u }, env);
    const tip = threadPoint(T, u);
    knot(c, tip.x, tip.y, 4, 0.95 * fade * (1 - 0.6 * slack), env);
    // at N: nothing there. A spark-out (a burst of short rays that gutter) and a cold ring opening
    if (t > t1) {
      const v = clamp01((t - t1) / 0.55);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(rimC, 0.9 * (1 - v));
      c.lineWidth = 1.8;
      c.lineCap = 'round';
      c.beginPath();
      for (let q = 0; q < 8; q++) {
        const an = (q / 8) * Math.PI * 2 + 0.3;
        const r0 = r * (0.3 + 0.9 * v);
        const r1 = r0 + 9 * (1 - v);
        c.moveTo(N.x + Math.cos(an) * r0, N.y + Math.sin(an) * r0);
        c.lineTo(N.x + Math.cos(an) * r1, N.y + Math.sin(an) * r1);
      }
      c.stroke();
      c.restore();
      glow(c, N.x, N.y, r * 2, m.core, 0.35 * (1 - v));
      c.save();
      c.strokeStyle = withAlpha(m.rim, 0.75 * (1 - clamp01((t - t1) / 0.9)));
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(N.x, N.y, r * (1.1 + 1.2 * clamp01((t - t1) / 0.9)), 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
  }
  void st;
}

/** a soft halo along the reaching thread (drawn under it) */
function glowThread(c: C, env: PaintEnv, T: { x0: number; y0: number; x1: number; y1: number; sag: number }, u: number, a: number, col: string) {
  if (a <= 0.01) return;
  for (let i = 1; i <= 6; i++) {
    const q = (i / 6) * u;
    const p = threadPoint(T, q);
    glow(c, p.x, p.y, 16, col, 0.12 * a);
  }
  void env;
}

/** the near cluster-column (L5): a shaft with an attached colonnette, a moulded capital and a base */
function nearColumn(c: C, env: PaintEnv) {
  c.fillStyle = env.fill('fg');
  c.fillRect(-40, -700, 80, 2200);
  c.fillRect(34, -700, 14, 2200);
  c.fillRect(-56, 120, 112, 18);
  c.fillRect(-50, 140, 100, 9);
  c.fillRect(-60, 760, 120, 26);
  c.strokeStyle = withAlpha(env.mood.rim, 0.12);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(40, -700);
  c.lineTo(40, 1500);
  c.stroke();
}

// ------------------------------------------------------------------------------------------------ the leaf
/** the memorised photograph, pressed flat into the knob mountain (ch08-s08), loosens and drifts down out of the
 *  frame (1.2 s, a slow pendulum fall with a little rotation), catching the light as it turns face-up */
function leaf(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const tq = tq12(t);
  // loosens just before the beat and has fallen clear by ~0.6 s before the cut (the shot ends on stillness)
  const t0 = Math.min(b.leaf - 0.55, b.D - 1.95);
  const loosen = sm((tq - t0) / 0.45);
  const fall = clamp01((tq - t0 - 0.4) / 1.2);
  const topX = MOUNT.x - 30;
  const topY = MOUNT.y - 124;
  // it pops up out of the knobs (a little lift), then falls leftward through the haze, swinging, and stays in frame
  const lift = sm(clamp01((tq - t0 - 0.15) / 0.45));
  const swing = Math.sin(fall * Math.PI * 2.2);
  const x = topX - 14 * loosen - 30 * lift - 150 * fall + 30 * swing * fall;
  const y = topY - 8 * loosen - 70 * lift * (1 - fall) + 50 * fall * fall; // ends ~40 px above the frame's bottom
  const hazeA = 1 - 0.55 * sm(clamp01((fall - 0.55) / 0.45)); // sinking into the haze
  const s = 62;
  const face = 1 - 0.6 * Math.abs(Math.sin(fall * Math.PI * 2.2)) * fall; // edge-on at the turns
  const catchLight = fall > 0 ? 0.5 + 0.5 * Math.cos(fall * Math.PI * 2.2) : 0;
  c.save();
  c.globalAlpha *= hazeA;
  c.translate(x, y);
  c.rotate(lerp(0.05, -0.3, loosen) + 0.45 * swing * fall);
  c.scale(1, lerp(0.2, 1, loosen) * face);
  if (catchLight > 0.05) glow(c, 0, 0, s * 1.3, m.core, 0.35 * catchLight * loosen);
  c.fillStyle = mixLab(mixLab(m.halo, m.core, 0.35), m.core, 0.4 * catchLight);
  c.fillRect(-s / 2, -s / 2, s, s);
  c.scale(s / 100, s / 100);
  c.translate(-50, -50);
  c.fillStyle = mixLab(m.ink, m.set, 0.25);
  c.fill(PICTURES[0]);
  c.restore();
  void hash1;
}
