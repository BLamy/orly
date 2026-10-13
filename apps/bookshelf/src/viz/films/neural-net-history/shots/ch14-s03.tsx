/**
 * ch14-s03 — the price tag. A $5.576M price tag (a rental-price estimate for one final run) turns at the door of a
 * vast data hall on the right bank; the long pull back reveals two larger buildings in the haze behind it, the
 * research and the chips the price leaves out (winterBlue from frame 0: a hard cut, the door lamp the one local warm
 * practical; 19.33 s; in: cut).
 *
 *   tag       0.2        close on a small manila tag turning slowly on its string: $5.576M; the date stamp
 *   flip      'final'    the tag flips over: FINAL RUN ONLY · AT RENTAL PRICES
 *   pull      'million'  the camera pulls back, and back, until the tag is a fleck at the door of an enormous dark
 *                        building whose rows of tiny lit windows are server racks; it fills the frame and keeps going
 *   research  'research' a faint second building, larger, appears behind the first in the haze, with its label
 *   chips     'chips'    a third, larger still, its windows uncountable, with its label
 * The manila tag, lit by a small lamp at the door, is the one warm practical. No logos. Through the study WINDOW
 * (no shelf, no hands): the window's mullions stay at the frame's edges. Review r1: the pull is one steady log-scale
 * move from just before 'million' (trapezoid velocity, soft ends); the labels land screen-locked within 0.35 s of their
 * words; the wide shows the far LEFT shore across the water at the frame's left edge (the two-shores geography).
 */
import { Timeline } from '../../../core';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import type { Frame, Palette } from '../../../film';
import { FONT, LAYERS, MOODS, defineShot, makeEnv, mixLab, placeStamp, toLayer, toScreen, withAlpha } from '../../../film';
import { clamp01, h01, labelPlate, lerp, sm, tq12, win, windowFrame } from '../sets/ch14-s01-strait';

const ID = 'ch14-s03';
type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

/** the data hall's door and the tag on its string (action plane) */
const DOOR = { x: 700, y: 640, w: 46, h: 82 } as const;
const TAG: P = { x: 739, y: 612 };
const TAG_W = 58, TAG_H = 27;
const K0 = 5.6;
const K1 = 0.62;
/** the end frame: the door at screen (680, 600) */
const DOOR_S: P = { x: 680, y: 600 };
const WB = MOODS.winterBlue;

const camFor = (k: number, world: P, screen: P): Camera3 => {
  const z = 1000 - 1000 / k;
  return { x: world.x - (screen.x - 640) / k, y: world.y - (screen.y - 360) / k, z, lens: 1 };
};
const CAM_END = camFor(K1, { x: DOOR.x, y: DOOR.y }, DOOR_S);

/** the end frame's screen point → action-plane (L4) world point. All three buildings stand on the action plane so
 *  their layout holds through the whole pull (on L1/L2 the dolly's parallax would hide them behind the hall until
 *  the last second); depth is carried by haze, value and a fog sheet between them */
const endToWorld = (sx: number, sy: number): P => ({ x: DOOR.x + (sx - DOOR_S.x) / K1, y: DOOR.y + (sy - DOOR_S.y) / K1 });
const rectFromEnd = (x0: number, x1: number, top: number, base: number) => {
  const a = endToWorld(x0, top), b = endToWorld(x1, base);
  return { x0: a.x, x1: b.x, top: a.y, bot: b.y };
};
/** the hall (end frame: x 430…940, roof at 400); research behind-left (1.35× its height), chips behind-right (1.8×) */
const B1 = rectFromEnd(430, 940, 400, 600);
const B2 = rectFromEnd(236, 640, 300, 600);
const B3 = rectFromEnd(590, 1192, 240, 600);

// ------------------------------------------------------------------------------------------- geometry (memoized)
interface Hall {
  body: Path2D;
  lights: Path2D;
  slots: Path2D;
}
interface WinSpec {
  cx: number;
  ry: number;
  w: number;
  h: number;
  /** rows per band (then one blank floor band); 0 = no banding */
  band: number;
  /** fraction of windows lit */
  lit: number;
}
function hallGeom(r: { x0: number; x1: number; top: number; bot: number }, pitch: WinSpec, seed: number, roof: 'units' | 'stepped' | 'sheds', detailNear?: P): Hall {
  const body = new Path2D();
  const lights = new Path2D();
  const slots = new Path2D();
  body.rect(r.x0, r.top, r.x1 - r.x0, r.bot - r.top + 2);
  const W = r.x1 - r.x0;
  if (roof === 'units') {
    // a parapet and a few roof units (cooling) for silhouette
    for (let x = r.x0 + 40; x < r.x1 - 60; x += 130 + 70 * h01(Math.floor(x), seed)) {
      const w = 30 + 40 * h01(Math.floor(x), seed + 1);
      body.rect(x, r.top - 8 - 6 * h01(Math.floor(x), seed + 2), w, 9 + 6 * h01(Math.floor(x), seed + 2));
    }
  } else if (roof === 'stepped') {
    // the research building: a stepped roofline, a lantern of skylights and a slim mast
    body.rect(r.x0 + W * 0.08, r.top - 40, W * 0.5, 41);
    body.rect(r.x0 + W * 0.2, r.top - 72, W * 0.22, 33);
    body.rect(r.x0 + W * 0.3, r.top - 130, 3, 60);
  } else {
    // the chip fab: a long sawtooth of shed roofs and two stacks
    const n = 14;
    for (let i = 0; i < n; i++) {
      const x = r.x0 + (W * i) / n;
      body.moveTo(x, r.top + 1);
      body.lineTo(x, r.top - 34);
      body.lineTo(x + W / n, r.top + 1);
      body.closePath();
    }
    body.rect(r.x0 + W * 0.66, r.top - 120, 16, 121);
    body.rect(r.x0 + W * 0.74, r.top - 96, 12, 97);
  }
  const rows = Math.floor((r.bot - r.top - 30) / pitch.ry);
  const cols = Math.floor((W - 20) / pitch.cx);
  for (let j = 0; j < rows; j++) {
    if (pitch.band > 0 && j % (pitch.band + 1) === pitch.band) continue;
    const y = r.top + 18 + j * pitch.ry;
    for (let i = 0; i < cols; i++) {
      const x = r.x0 + 10 + i * pitch.cx;
      if (detailNear && Math.abs(x - detailNear.x) < DOOR.w && y > detailNear.y - DOOR.h - 10) continue;
      if (h01(i + j * 977, seed + 5) > pitch.lit) continue;
      lights.rect(x, y, pitch.w, pitch.h);
      if (detailNear && Math.hypot(x - detailNear.x, y - detailNear.y) < 260) {
        // rack units inside the near windows: dark slot lines
        for (let q = 1; q < 4; q++) slots.rect(x, y + (pitch.h * q) / 4 - 0.25, pitch.w, 0.5);
      }
    }
  }
  return { body, lights, slots };
}
/** the hall: windows grouped in rack-row bands (three rows, then a blank floor), about half as many as before */
const G1 = hallGeom(B1, { cx: 14, ry: 14, w: 4.4, h: 6.6, band: 3, lit: 0.42 }, 2401, 'units', { x: DOOR.x, y: DOOR.y });
/** research: sparse windows */
const G2 = hallGeom(B2, { cx: 22, ry: 26, w: 5, h: 8, band: 0, lit: 0.3 }, 2402, 'stepped');
/** chips: windows past counting */
/** (review r1: a third of the old density, banded into floors, so it reads as a vast hall and not as moiré) */
const G3 = hallGeom(B3, { cx: 10, ry: 11, w: 3.4, h: 4.4, band: 5, lit: 0.72 }, 2403, 'sheds');

interface B {
  D: number;
  tag: number;
  flip: number;
  pull: number;
  research: number;
  chips: number;
  pullEnd: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  kOf: (t: number) => number;
  [k: string]: unknown;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = { D, tag: T.beat('tag'), flip: T.beat('flip'), pull: T.beat('pull'), research: T.beat('research'), chips: T.beat('chips'), pullEnd: Math.min(D - 1.2, T.beat('chips') + 0.45) };
    // log-scale zoom: a near-still creep on the tag, then ONE steady pull back from 0.2 s before 'million' to the
    // wide (a trapezoid velocity profile in log scale: 0.9 s to get going, 1.8 s to settle, constant between, so the
    // reveal grows evenly and never jumps), then a slow settle
    const P0 = b.pull - 0.2;
    const P1 = b.pullEnd;
    const ta = 0.9, td = 1.8;
    const Tp = P1 - P0;
    const v = 1 / (Tp - ta / 2 - td / 2);
    const prog = (e: number) => {
      if (e <= 0) return 0;
      if (e >= Tp) return 1;
      if (e < ta) return (v * e * e) / (2 * ta);
      if (e < Tp - td) return v * (ta / 2 + (e - ta));
      const r = Tp - e;
      return 1 - (v * r * r) / (2 * td);
    };
    const l0 = Math.log(K0 * 1.04), lA = Math.log(K0), lB = Math.log(K1), lC = Math.log(K1 * 0.97);
    const kOf = (t: number) => Math.exp(t < P0 ? lerp(l0, lA, t / P0) : t < P1 ? lerp(lA, lB, prog(t - P0)) : lerp(lB, lC, clamp01((t - P1) / Math.max(0.1, D - P1))));
    tl.hold(0, D);
    return { tl, b, kOf };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const tq = tq12(t);
    const cam = camAt(sc, t);
    f.camera(cam);
    f.backlight({ sunX: 930, sunY: 300, sunRadius: 820, intensity: 0.7 });
    // the reveals: research (behind-left) on 'research', chips (behind-right) on 'chips', each fading and rising in
    const a2 = win(t, b.research - 0.2, b.research + 0.7);
    const a3 = win(t, b.chips - 0.2, b.chips + 0.7);
    f.layer('L4', (c, env) => {
      farShore(c, env, Math.max(a2, win(t, b.chips, b.pullEnd)));
      hall(c, env, G3, a3, t, 3, 26 * (1 - a3));
      hall(c, env, G2, a2, t, 2, 22 * (1 - a2));
    });
    // haze between the far buildings and the hall
    f.fog({ yCenter: 330, height: 260, alpha: 0.26 * Math.max(a2, a3), drift: 4 });
    // L4: the hall, its door and lamp, the tag; the water at its foot
    f.layer('L4', (c, env) => {
      water(c, env, t);
      hall(c, env, G1, 1, t, 1, 0);
      doorHaze(c, env);
      lampCone(c, env, t);
      door(c, env, t);
      priceTag(c, env, t, b);
    });
    f.rim({ x: 0.3, y: -1 });
    f.practical({ x: DOOR.x - 2, y: DOOR.y - DOOR.h - 12, kind: 'lamp', seed: 2412, intensity: 0.9, radius: 18 });
    f.fog({ yCenter: 640, height: 110, alpha: 0.16 * win(t, b.pull + 1.5, b.pull + 4), drift: 7 });
    // the quay's lamp post and railing on their own nearer plane (z 950): a blurred dark post at the close-up's
    // right edge that the pull-back slides in past the hall (8.5-11 s), until it is a small post beside the door
    quayRail(f, t, cam, camAt(sc, b.D), clamp01(Math.log(K0 / sc.kOf(t)) / Math.log(K0 / K1)));
    windowFrame(f, {});
    // type: the date stamp on the close-up; the two labels as their buildings appear
    const env = { t, mood: f.mood };
    placeStamp(f.c, { place: '26 December 2024', date: 'DeepSeek V3 technical report', year: 2024, x: 104, y: 664, at: b.tag + 0.2, dur: b.pull - b.tag + 0.2, fade: 0.5 }, env);
    // the labels hang off their buildings by short leaders (they ride with the camera's settle)
    // review r1: the pull now finishes 0.45 s after 'hardware' (its last 1.8 s a gentle settle), so each label rides
    // its building only while the camera is all but still, and is fully in by +0.25 s of its word
    const L4 = LAYERS.L4;
    const r2 = toScreen(L4, cam, B2.x0 + (B2.x1 - B2.x0) * 0.42, B2.top - 40);
    const r3 = toScreen(L4, cam, B3.x0 + (B3.x1 - B3.x0) * 0.42, B3.top - 34);
    leaderLabel(f.c, f.mood, ['EXCLUDES PRIOR RESEARCH', 'THE REPORT’S CAVEAT'], r2, { x: r2.x - 4, y: r2.y - 62 }, win(t, b.research - 0.1, b.research + 0.25));
    leaderLabel(f.c, f.mood, ['~50,000 CHIPS', '(SEMIANALYSIS EST.)'], r3, { x: r3.x + 30, y: r3.y - 64 }, win(t, b.chips - 0.1, b.chips + 0.25));
  },
});

/** the far LEFT shore across the strait (review r1: the two-shores geography holds in the wide): a low, heavily hazed
 *  skyline at the frame's left edge in the final wide, standing on a band of pale water beyond the research building
 *  (end-frame px, on the action plane like the three buildings, so its place holds through the pull) */
const FAR = (() => {
  const body = new Path2D();
  const lights = new Path2D();
  const a = endToWorld(0, 0);
  const sc = 1 / K1;
  const base = 583;
  let x = -40;
  let i = 0;
  while (x < 250) {
    const w = 10 + 16 * h01(i, 2471);
    const h = 16 + 48 * h01(i, 2472) * (0.55 + 0.45 * sm((x + 40) / 160));
    const p = endToWorld(x, base - h);
    body.rect(p.x, p.y, w * sc, (h + 3) * sc);
    if (h01(i, 2473) > 0.6) body.rect(p.x + w * sc * 0.45, p.y - 12 * sc, 1.2 * sc, 12 * sc);
    for (let r = 0; r < Math.floor(h / 8); r++)
      for (let q = 0; q < Math.floor(w / 5); q++) if (h01(q + r * 7 + i * 97, 2474) < 0.16) lights.rect(p.x + (2 + q * 5) * sc, p.y + (5 + r * 8) * sc, 1.4 * sc, 2 * sc);
    x += w + (h01(i, 2475) < 0.3 ? 4 : 0.5);
    i++;
  }
  void a;
  const water = { a: endToWorld(-60, base), b: endToWorld(260, 600) };
  return { body, lights, water };
})();
function farShore(c: C, env: PaintEnv, a: number) {
  if (a <= 0.003) return;
  const m = env.mood;
  c.save();
  c.globalAlpha = a;
  // the far water: a pale band that mirrors the sky low on the horizon
  const wg = c.createLinearGradient(0, FAR.water.a.y, 0, FAR.water.b.y);
  wg.addColorStop(0, mixLab(WB.sky[3], WB.haze, 0.3));
  wg.addColorStop(1, mixLab(WB.sky[2], WB.set, 0.4));
  c.fillStyle = wg;
  c.fillRect(FAR.water.a.x, FAR.water.a.y, FAR.water.b.x - FAR.water.a.x, FAR.water.b.y - FAR.water.a.y);
  // the city, hazed to two steps above the research building
  c.fillStyle = mixLab(m.set, WB.sky[2], 0.72);
  c.fill(FAR.body);
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = withAlpha(mixLab(WB.core, WB.halo, 0.4), 0.22);
  c.fill(FAR.lights);
  c.restore();
}

/** the door lamp's cone of light in the haze, down the wall and over the step: the close-up's depth (a lit volume
 *  in front of the facade, falling off with distance from the lamp) */
function lampCone(c: C, env: PaintEnv, t: number) {
  const d = DOOR;
  const warm = mixLab(MOODS.candleAmber.halo, MOODS.candleAmber.rim, 0.4);
  const lx = d.x, ly = d.y - d.h - 11;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const flick = 1 + 0.02 * Math.sin(t * 6.3);
  const g = c.createRadialGradient(lx, ly, 2, lx, ly + 40, 130);
  g.addColorStop(0, withAlpha(warm, 0.16 * flick));
  g.addColorStop(0.5, withAlpha(warm, 0.05 * flick));
  g.addColorStop(1, withAlpha(warm, 0));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(lx - 6, ly);
  c.lineTo(lx + 6, ly);
  c.lineTo(lx + 70, d.y + 6);
  c.lineTo(lx - 66, d.y + 6);
  c.closePath();
  c.fill();
  c.restore();
  // and the facade darkens with height and distance from it (a vertical haze falloff: the wall recedes)
  const v = c.createLinearGradient(0, d.y - d.h - 140, 0, d.y - d.h - 20);
  v.addColorStop(0, withAlpha(env.mood.ink, 0.28));
  v.addColorStop(1, withAlpha(env.mood.ink, 0));
  c.fillStyle = v;
  c.fillRect(d.x - 260, d.y - d.h - 140, 520, 120);
}

/** a dark hall: its mass, then rows of tiny lit windows (server racks), lit by one rhythm. which: 1 the hall (near,
 *  darkest), 2 research (hazed ~55% toward the sky), 3 chips (hazed less, its windows uncountable). rise: px it still
 *  has to rise as it fades in */
function hall(c: C, env: PaintEnv, g: Hall, a: number, t: number, which: number, rise: number) {
  if (a <= 0.003) return;
  const m = env.mood;
  const W = makeEnv({ mood: 'winterBlue', layer: 'L4' });
  c.save();
  c.globalAlpha = a;
  c.translate(0, rise);
  c.fillStyle = which === 1 ? mixLab(W.fill('set'), WB.ink, 0.5) : which === 2 ? mixLab(W.fill('set'), WB.sky[2], 0.55) : mixLab(W.fill('set'), WB.sky[1], 0.3);
  c.fill(g.body);
  c.globalCompositeOperation = 'lighter';
  const pulse = 0.9 + 0.1 * Math.sin(t * 1.1 + which);
  c.fillStyle = withAlpha(mixLab(WB.core, WB.halo, 0.45), (which === 1 ? 0.3 : which === 2 ? 0.2 : 0.3) * pulse);
  c.fill(g.lights);
  c.globalCompositeOperation = 'source-over';
  if (which !== 1) {
    // the roofline catches the cold sky
    c.strokeStyle = withAlpha(WB.rim, 0.22);
    c.lineWidth = 1.2;
    c.stroke(g.body);
  }
  if (which === 1) {
    c.fillStyle = withAlpha(W.fill('ink'), 0.85);
    c.fill(g.slots);
    // the facade falls off into the dark away from the door lamp (the lamp is the close-up's one practical)
    c.save();
    c.clip(g.body);
    const fo = c.createRadialGradient(DOOR.x + 10, DOOR.y - DOOR.h, 50, DOOR.x + 10, DOOR.y - DOOR.h, 260);
    fo.addColorStop(0, withAlpha(WB.ink, 0));
    fo.addColorStop(1, withAlpha(WB.ink, 0.5));
    c.fillStyle = fo;
    c.fillRect(B1.x0, B1.top - 20, B1.x1 - B1.x0, B1.bot - B1.top + 30);
    c.restore();
    // a few rack LEDs blinking near the door (seen only in the close-up)
    for (let i = 0; i < 40; i++) {
      const x = DOOR.x - 230 + h01(i, 61) * 460;
      const y = DOOR.y - 250 + h01(i, 62) * 230;
      const on = Math.sin(t * (2 + 3 * h01(i, 63)) + i) > 0.2;
      if (!on || Math.abs(x - DOOR.x) < DOOR.w) continue;
      c.fillStyle = withAlpha(m.core, 0.75);
      c.fillRect(x, y, 0.9, 0.9);
    }
  }
  c.restore();
}

/** a breath of haze in front of the facade around the door, so the door stands off the wall */
function doorHaze(c: C, env: PaintEnv) {
  const m = env.mood;
  const g = c.createRadialGradient(DOOR.x + 8, DOOR.y - DOOR.h * 0.55, 10, DOOR.x + 8, DOOR.y - DOOR.h * 0.55, 150);
  g.addColorStop(0, withAlpha(m.haze, 0.34));
  g.addColorStop(1, withAlpha(m.haze, 0));
  c.fillStyle = g;
  c.fillRect(DOOR.x - 150, DOOR.y - DOOR.h - 150, 310, 300);
}

/** the camera at time t: the tag's screen point slides from frame centre to its fleck position as the scale
 *  falls (log) */
function camAt(sc: Scene, t: number): Camera3 {
  const k = sc.kOf(t);
  const u = clamp01(Math.log(K0 / k) / Math.log(K0 / K1));
  const tagS: P = { x: lerp(640, DOOR_S.x + (TAG.x - DOOR.x) * K1, sm(u)), y: lerp(372, DOOR_S.y + (TAG.y - DOOR.y) * K1, sm(u)) };
  return camFor(k, TAG, tagS);
}

/** the quay's lamp post and railing, on their own plane between the camera and the hall (z 950, true parallax).
 *  Authored in END-frame screen px from the post's foot (it stands on the quay at end-screen (740, 600), just
 *  right of the door and its tag; the rail runs off to the right, never across the door). In the close-up it is a
 *  big blurred dark post at the right edge; the pull slides it in past the hall, shrinking faster than the hall,
 *  until it is a small post beside the door (round 2: the near occluder during 8.5-11 s; 3 planes) */
const QUAY_Z = 950;
const QUAY_FOOT: P = { x: 740, y: 600 };
const QUAY_RAIL: Array<[number, number]> = [];
for (let x = 14; x <= 700; x += 15) QUAY_RAIL.push([x, 0]);
function quayRail(f: Frame, t: number, cam: Camera3, camEnd: Camera3, pullU: number) {
  const kEnd = toScreen({ z: QUAY_Z }, camEnd, 0, 0).k;
  const foot = toLayer({ z: QUAY_Z }, camEnd, QUAY_FOOT.x, QUAY_FOOT.y);
  const kNow = toScreen({ z: QUAY_Z }, cam, 0, 0).k;
  // depth of field: the nearer it is, the softer (on twos-ish steps of 0.5 px)
  const blur = Math.round(Math.min(7, Math.max(0, (kNow / kEnd - 1.4) * 0.55)) * 2) / 2;
  const spec: LayerSpec = { id: 'ch14s03Quay', z: QUAY_Z, haze: 0.02, blur };
  f.layer(spec, (c, env) => {
    const ink = mixLab(env.fill('ink'), '#000000', 0.25);
    const rim = withAlpha(WB.rim, 0.42);
    c.save();
    c.translate(foot.x, foot.y);
    c.scale(1 / kEnd, 1 / kEnd);
    c.fillStyle = ink;
    // the near embankment the railing stands on (its top edge at the hall's quay line in the end frame), so the
    // post's foot is never seen floating as the camera trucks down
    // (a pier deck on piles, running off the frame's right edge)
    // review r1: in the close-up the deck would be a black slab over a third of the frame, so it comes in only as
    // the pull gets going (the post, its chain and the rail are the close-up's near silhouette)
    const deckA = sm((pullU - 0.12) / 0.3);
    if (deckA > 0.003) {
      c.globalAlpha = deckA;
      c.fillRect(-20, 0, 720, 26);
      for (let x = -8; x < 700; x += 46) c.fillRect(x, 26, 5, 300);
      c.fillStyle = withAlpha(WB.rim, 0.3);
      c.fillRect(-20, -0.3, 720, 0.6);
      c.globalAlpha = 1;
    }
    c.fillStyle = ink;
    // a mooring chain hangs from the post in a slack catenary off to the right: round links, the cold sky on their
    // tops (in the close-up it is the readable shape at the lower right)
    {
      const x0 = 3, y0 = -40, x1 = 60, y1 = -30, sag = 16;
      const n = 13;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const x = lerp(x0, x1, u);
        const y = lerp(y0, y1, u) + sag * 4 * u * (1 - u);
        const ang = Math.atan2(y1 - y0 + sag * 4 * (1 - 2 * u), x1 - x0);
        c.save();
        c.translate(x, y);
        c.rotate(ang + (i % 2 ? Math.PI / 2 : 0));
        c.lineWidth = 0.9;
        c.strokeStyle = ink;
        c.beginPath();
        c.ellipse(0, 0, 2.6, 1.5, 0, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = withAlpha(WB.rim, 0.35);
        c.lineWidth = 0.3;
        c.beginPath();
        c.ellipse(0, 0, 2.6, 1.5, 0, Math.PI * 1.1, Math.PI * 1.9);
        c.stroke();
        c.restore();
      }
      // the ring on the post the chain hangs from
      c.strokeStyle = ink;
      c.lineWidth = 1;
      c.beginPath();
      c.arc(3.2, -41, 2.2, 0, Math.PI * 2);
      c.stroke();
    }
    // the post: a tapered iron column on a plinth, a short crook arm and an unlit lantern cage (the tag's lamp
    // stays the one warm practical)
    c.fillRect(-5, -6, 10, 6);
    c.beginPath();
    c.moveTo(-3.4, -6);
    c.lineTo(-2.2, -76);
    c.lineTo(2.2, -76);
    c.lineTo(3.4, -6);
    c.closePath();
    c.fill();
    c.fillRect(-1.2, -84, 2.4, 9);
    c.beginPath();
    c.moveTo(-5, -84);
    c.lineTo(5, -84);
    c.lineTo(3.5, -94);
    c.lineTo(-3.5, -94);
    c.closePath();
    c.fill();
    c.fillRect(-4.5, -96, 9, 2);
    // the railing: a top and a mid rail running right from the post, thin balusters
    c.fillRect(0, -22, 700, 2.2);
    c.fillRect(0, -11, 700, 1.4);
    for (const [x] of QUAY_RAIL) c.fillRect(x - 0.6, -22, 1.2, 22);
    // the cold sky catches the top edges and the post's left flank; rain runs down the rail in thin streaks
    c.fillStyle = rim;
    c.fillRect(0, -22.4, 700, 0.6);
    c.fillRect(-2.5, -76, 0.5, 70);
    c.fillRect(-3.5, -94.3, 7, 0.5);
    c.fillStyle = withAlpha(WB.rim, 0.22);
    for (let i = 0; i < 26; i++) {
      const x = 6 + h01(i, 91) * 290;
      const y0 = -20 + h01(i, 92) * 6;
      const len = 3 + h01(i, 93) * 9;
      const slide = ((t * (0.8 + h01(i, 94)) + h01(i, 95) * 3) % 3) * 4;
      c.fillRect(x, y0 + slide, 0.4, len);
    }
    c.restore();
  });
}

/** a two-line mono label on a soft dark plate, tied to its building by a short leader with a dot at the roof */
function leaderLabel(c: C, m: Palette, lines: string[], anchor: P, at: P, a: number) {
  if (a <= 0.003) return;
  // round-2 legibility: both labels are read (21.5 px mono ≥ 22 px cap at 1080p)
  const size = 21.5;
  c.save();
  c.font = `500 ${size}px ${FONT.mono}`;
  (c as C & { letterSpacing?: string }).letterSpacing = '1.1px';
  const w = Math.max(...lines.map((l) => c.measureText(l).width));
  const h = lines.length * size * 1.3;
  // keep the label inside the safe area (inside the window's mullions) while the camera still settles
  at = { x: Math.min(1160 - w / 2, Math.max(112 + w / 2, at.x)), y: Math.max(76, at.y) };
  labelPlate(c, m, at.x, at.y - h / 2 + size * 0.3, w * 0.8 + 70, h * 2.2, a * 1.25);
  // leader: from the plate's lower edge to the roof point
  c.globalAlpha = a * 0.8;
  c.strokeStyle = mixLab('#e8e2d2', m.rim, 0.3);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(at.x, at.y + 10);
  c.lineTo(anchor.x, anchor.y - 3);
  c.stroke();
  c.fillStyle = c.strokeStyle;
  c.beginPath();
  c.arc(anchor.x, anchor.y, 2.6, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = a;
  c.fillStyle = mixLab('#efe4cf', m.core, 0.25);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  lines.forEach((ln, i) => c.fillText(ln, at.x, at.y - (lines.length - 1 - i) * size * 1.3));
  c.restore();
}

/** the water at the hall's foot, its lights trembling on it */
function water(c: C, env: PaintEnv, t: number) {
  const m = env.mood;
  const g = c.createLinearGradient(0, DOOR.y, 0, DOOR.y + 400);
  g.addColorStop(0, mixLab(m.set, m.haze, 0.3));
  g.addColorStop(0.3, mixLab(m.set, m.fg, 0.5));
  g.addColorStop(1, m.fg);
  c.fillStyle = g;
  c.fillRect(-1200, DOOR.y, 4000, 600);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 140; i++) {
    const x = B1.x0 + h01(i, 71) * (B1.x1 - B1.x0);
    const y = DOOR.y + 6 + h01(i, 72) * 60;
    c.fillStyle = withAlpha(m.halo, 0.12 * (0.6 + 0.4 * Math.sin(t * 1.7 + i)));
    c.fillRect(x + Math.sin(t * 1.3 + i) * 1.5, y, 1.4, 6 + 10 * h01(i, 73));
  }
  c.restore();
  // a quay lip under the hall
  c.fillStyle = env.fill('ink');
  c.fillRect(B1.x0, DOOR.y - 2, B1.x1 - B1.x0, 6);
}

/** the door: a dark opening with a steel frame, a small lamp above it; its warm pool on the step */
function door(c: C, env: PaintEnv, t: number) {
  const m = env.mood;
  const d = DOOR;
  c.save();
  c.fillStyle = env.fill('ink');
  c.fillRect(d.x - d.w / 2 - 5, d.y - d.h - 6, d.w + 10, d.h + 6);
  c.fillStyle = mixLab(m.ink, m.fg, 0.6);
  c.fillRect(d.x - d.w / 2, d.y - d.h, d.w, d.h);
  // a cold rim on the frame's top and left edges (the sky behind the camera's shoulder)
  c.fillStyle = withAlpha(WB.rim, 0.55);
  c.fillRect(d.x - d.w / 2 - 5, d.y - d.h - 6, d.w + 10, 0.6);
  c.fillRect(d.x - d.w / 2 - 5, d.y - d.h - 6, 0.6, d.h + 6);
  c.fillStyle = withAlpha(WB.rim, 0.3);
  c.fillRect(d.x - d.w / 2 - 0.6, d.y - d.h, 0.5, d.h);
  // review r1: the lamp above rims the frame warm: its top edge, and both jambs, fading down from the head
  {
    const warmR = mixLab(MOODS.candleAmber.rim, MOODS.candleAmber.core, 0.3);
    c.fillStyle = withAlpha(warmR, 0.75);
    c.fillRect(d.x - d.w / 2 - 5, d.y - d.h - 6.4, d.w + 10, 0.7);
    for (const ex of [d.x - d.w / 2 - 0.2, d.x + d.w / 2 - 0.4]) {
      const jg = c.createLinearGradient(0, d.y - d.h, 0, d.y - d.h * 0.35);
      jg.addColorStop(0, withAlpha(warmR, 0.6));
      jg.addColorStop(1, withAlpha(warmR, 0));
      c.fillStyle = jg;
      c.fillRect(ex, d.y - d.h, 0.6, d.h * 0.65);
    }
    // the leaves' top rails catch it too
    c.fillStyle = withAlpha(warmR, 0.35);
    c.fillRect(d.x - d.w / 2, d.y - d.h, d.w, 0.5);
  }
  // door leaves, a push bar
  c.strokeStyle = withAlpha(m.rim, 0.18);
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(d.x, d.y - d.h);
  c.lineTo(d.x, d.y);
  c.moveTo(d.x - d.w / 2 + 3, d.y - d.h * 0.45);
  c.lineTo(d.x - 3, d.y - d.h * 0.45);
  c.stroke();
  // the lamp housing above the door
  c.fillStyle = env.fill('ink');
  c.fillRect(d.x - 7, d.y - d.h - 15, 14, 4);
  const warm = mixLab(MOODS.candleAmber.core, MOODS.candleAmber.halo, 0.3);
  c.fillStyle = withAlpha(warm, 0.9);
  c.fillRect(d.x - 5, d.y - d.h - 11.5, 10, 2.2);
  // the warm light it throws down the door and across the step and the tag
  c.globalCompositeOperation = 'lighter';
  const pool = c.createRadialGradient(d.x + 10, d.y - d.h + 10, 0, d.x + 10, d.y - d.h + 10, 90);
  pool.addColorStop(0, withAlpha(warm, 0.22 * (1 + 0.03 * Math.sin(t * 7.1))));
  pool.addColorStop(1, withAlpha(warm, 0));
  c.fillStyle = pool;
  c.fillRect(d.x - 90, d.y - d.h - 80, 200, 190);
  c.restore();
}

/** the manila tag on its string (review r1: the string is TIED TO THE EYELET, and the tag hangs, swings and turns
 *  from that eyelet): turning slowly (on twos); on 'final' it flips to its back about the eyelet */
const DROOP = 0.16;
const EYE: P = { x: TAG.x - (TAG_W / 2 - 6) * Math.cos(DROOP), y: TAG.y - (TAG_W / 2 - 6) * Math.sin(DROOP) };
const KNOT: P = { x: EYE.x + 3, y: EYE.y - 22 };
function priceTag(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const tq = tq12(t);
  const yaw = 0.42 * Math.sin(tq * 0.85 + 0.4) + Math.PI * sm((tq - (b.flip - 0.12)) / 0.62);
  const sx = Math.cos(yaw);
  const back = sx < 0;
  // the whole tag swings on its string: ±6° about the knot, a 3 s period; the tag itself rocks a little about the
  // eyelet, lagging the swing
  const swing = 0.1 * Math.sin((tq * 2 * Math.PI) / 3 + 0.6);
  const rock = 0.06 * Math.sin((tq * 2 * Math.PI) / 3 - 0.5);
  const manila = mixLab('#c9a56a', MOODS.candleAmber.halo, 0.25);
  c.save();
  c.translate(KNOT.x, KNOT.y);
  c.rotate(swing);
  c.translate(-KNOT.x, -KNOT.y);
  const str = withAlpha(mixLab(m.rim, manila, 0.4), 0.9);
  c.fillStyle = env.fill('ink');
  c.fillRect(KNOT.x - 1.2, KNOT.y - 2.4, 2.4, 3);
  // the tag, pivoting on its eyelet
  c.save();
  c.translate(EYE.x, EYE.y);
  c.rotate(DROOP + rock);
  c.scale(Math.max(0.04, Math.abs(sx)), 1);
  const w = TAG_W, h = TAG_H;
  const L = -6; // the tag's left end, from the eyelet
  const shade = 0.78 + 0.22 * Math.abs(sx);
  c.fillStyle = mixLab(m.ink, manila, shade);
  c.beginPath();
  c.moveTo(L + 7, -h / 2);
  c.lineTo(L + w, -h / 2);
  c.lineTo(L + w, h / 2);
  c.lineTo(L + 7, h / 2);
  c.lineTo(L, h / 2 - 7);
  c.lineTo(L, -h / 2 + 7);
  c.closePath();
  c.fill();
  // the lamp above catches its top edge
  c.fillStyle = withAlpha(mixLab(MOODS.candleAmber.rim, manila, 0.3), 0.7);
  c.fillRect(L + 7, -h / 2, w - 7, 0.5);
  // the reinforcement ring and eyelet (the string passes through it)
  c.fillStyle = mixLab(manila, '#ffffff', 0.15);
  c.beginPath();
  c.arc(0, 0, 3.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(m.ink, m.fg, 0.5);
  c.beginPath();
  c.arc(0, 0, 1.4, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = str;
  c.lineWidth = 0.4;
  c.beginPath();
  c.arc(0, -0.6, 1.5, Math.PI * 1.05, Math.PI * 2.1);
  c.stroke();
  // lettering (the back reads the right way round once flipped); centred on the body right of the eyelet
  const cx = L + w / 2 + 3.5;
  const ink = mixLab('#2a1d10', manila, 0.08);
  c.fillStyle = withAlpha(ink, 0.92);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  if (!back) {
    c.font = `600 11.4px ${FONT.mono}`;
    c.fillText('$5.576M', cx, 0.6);
  } else {
    c.font = `500 4.7px ${FONT.mono}`;
    c.fillText('FINAL RUN ONLY', cx - 0.5, -4.4);
    c.fillText('AT RENTAL PRICES', cx - 0.5, 4.6);
    c.fillRect(cx - 20.5, -0.2, 40, 0.3);
  }
  c.restore();
  // the string, over the tag's face: from the knot on the door frame down into the eyelet (it is tied there)
  c.strokeStyle = str;
  c.lineWidth = 0.45;
  c.beginPath();
  c.moveTo(KNOT.x, KNOT.y);
  c.quadraticCurveTo(KNOT.x - 1, (KNOT.y + EYE.y) / 2, EYE.x + 0.3, EYE.y - 0.9);
  c.stroke();
  c.restore();
}
