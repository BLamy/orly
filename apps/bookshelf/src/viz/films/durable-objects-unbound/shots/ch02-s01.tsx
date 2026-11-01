/**
 * ch02-s01 — Kenton Varda's desk, 28 September 2020 (duskRose, iris in): one object, in one place.
 *
 * KENTON VARDA'S STUDY (sets/ch02-s01-study.ts around sets/historyDesk.ts): he sits screen-left facing right,
 * the anglepoise warm on his right, a dusk window with a far city behind (L1 city, L2 wall + window holes, L3 floor
 * and bookcase, L4 desk, L5 shelf edge).
 *
 *   iris/date   the iris opens on the desk lamp (frame centre); date stamp '28 September 2020' top-right
 *   name        name card 'Kenton Varda · Cloudflare' mid-left; slow truck right + gentle dolly in
 *   globe       on 'identifier' the laptop's glow lifts and the camera pushes past his shoulder into it; at the
 *               white-out the scene is the paper globe on its turned stand (same room, by the window); the glow
 *               dissolves away in blots (an ink dissolve in light)
 *   plain       quote card Q01 upper-left
 *   one         on 'place' a single paper lantern lights on the globe; every other place stays a dark point
 *   converge    on 'request' paper slips lift from many places and all fly to that one lantern
 *   many        after 'coordinate' the globe turns: many lanterns, each lit in its own single place, each with its
 *               own few slips
 * No implementation badge (the 2020 post's idea, carried by its date stamp). Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, mixLab, nameCard, quoteCard, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { camAt, clamp01, glowDot, lerp, paper, seg, slip, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { STUDY, paintStudy } from '../sets/ch02-s01-study';
import { bakeRes, dateStamp, glowFill, h01 } from '../sets/ch02-s01-kit';

const ID = 'ch02-s01';
/** the globe (L4 world): centre and radius; it stands on a round side table by the window */
const G = { x: 1560, y: 292, R: 128 };
const TILT = 0.34;
const SPIN = 0.11;
/** the one lantern's place faces the camera around t ≈ 23 s */
const ONE = { lat: 0.5, lon: -SPIN * 23.2 };
interface Place {
  lat: number;
  lon: number;
}
const PLACES: Place[] = [ONE];
for (let i = 1; i < 46; i++) PLACES.push({ lat: (h01(i, 3) - 0.5) * 2.3, lon: (h01(i, 7) - 0.5) * Math.PI * 2 });
/** land patches (paper cut shapes on the globe, a cue that it turns) */
const LANDS = [
  { lat: 0.7, lon: -2.2, r: 0.42 },
  { lat: 0.2, lon: -2.9, r: 0.3 },
  { lat: -0.4, lon: -2.5, r: 0.34 },
  { lat: 0.45, lon: 0.4, r: 0.5 },
  { lat: -0.3, lon: 1.4, r: 0.38 },
  { lat: 0.1, lon: -1.2, r: 0.26 },
  { lat: -0.75, lon: -0.2, r: 0.3 },
];
function project(lat: number, lon: number, spin: number): { x: number; y: number; z: number } {
  const a = lon + spin;
  const x0 = Math.cos(lat) * Math.sin(a);
  const y0 = -Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(a);
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  return { x: G.x + G.R * (x0 * ct - y0 * st), y: G.y + G.R * (x0 * st + y0 * ct), z };
}

const DESK_START: Camera3 = { x: 612, y: 384, z: 0, lens: 1 };
const DESK_END: Camera3 = { x: 690, y: 374, z: 96, lens: 1 };
const GLOBE_A: Camera3 = { x: 1452, y: 318, z: 318, lens: 1 };
const GLOBE_B: Camera3 = { x: 1478, y: 314, z: 372, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      date: T.beat('date'),
      name: T.beat('name'),
      globe: T.beat('globe'),
      plain: T.beat('plain'),
      one: T.beat('one'),
      converge: T.beat('converge'),
      many: T.beat('many'),
      coordinate: T.word('L0205', 'coordinate'),
    };
    const scr = STUDY.anchors.screen;
    const PUSH: Camera3 = { x: scr.x + 6, y: scr.y - 2, z: 660, lens: 1 };
    const swap = b.globe + 1.35;
    const deskCams: CamKey[] = [
      { t: 0, cam: DESK_START },
      { t: b.globe - 1.2, cam: DESK_END },
      { t: swap, cam: PUSH },
    ];
    const globeCams: CamKey[] = [
      { t: swap, cam: GLOBE_A },
      { t: b.D, cam: GLOBE_B },
    ];
    return { tl, b, swap, deskCams, globeCams, PUSH };
  },
  paint(f, _s, sc) {
    const { b, swap, deskCams, globeCams, PUSH } = sc;
    const t = f.t;
    const tq = twos(t);
    const inGlobe = t >= swap;
    const cam = inGlobe ? camAt(globeCams, t) : camAt(deskCams, t);
    const cams = inGlobe ? [GLOBE_A, GLOBE_B] : [DESK_START, DESK_END, PUSH];
    const spin = SPIN * t;
    const screenLift = seg(t, b.globe - 0.4, b.globe + 0.6);
    const think = 0.35 + 0.25 * seg(t, b.name, b.name + 1.2) - 0.2 * seg(t, b.globe - 2.5, b.globe - 1.2);
    // the one lantern, the slips, the many
    const oneLit = seg(t, b.one - 0.15, b.one + 0.5);
    const manyStart = b.coordinate + 0.35;
    paintStudy(
      f,
      { cam, cams, era: 2020, lamp: 1, screen: 0.55 + 0.45 * screenLift, think, deskOn: !inGlobe },
      {
        L4back: (c, env) => {
          if (inGlobe) return;
          // the laptop's light lifts and spreads on the wall and desk behind him (never over the figure)
          const up = seg(t, b.globe - 0.3, swap - 0.2);
          const scr = STUDY.anchors.screen;
          glowFill(c, scr.x + 4, scr.y, 40 + 150 * up, mixLab('#e2cfb0', env.mood.core, 0.5), 0.2 * screenLift + 0.22 * up);
        },
        L4: (c, env) => {
          if (!inGlobe) return;
          sideTable(f, c, env);
          paperGlobe(c, env, spin, t);
          // dark places (every other point stays dark), the lit ones, and their slips
          const lit: number[] = PLACES.map(() => 0);
          lit[0] = oneLit;
          // the many: places that face the camera at the end light one after another from 'coordinate'
          let k = 0;
          for (let i = 1; i < PLACES.length && k < 13; i++) {
            const p = project(PLACES[i].lat, PLACES[i].lon, SPIN * (b.D - 0.4));
            if (p.z < 0.3) continue;
            lit[i] = seg(t, manyStart + k * 0.07, manyStart + k * 0.07 + 0.3);
            k++;
          }
          for (let i = PLACES.length - 1; i >= 0; i--) {
            const p = project(PLACES[i].lat, PLACES[i].lon, spin);
            if (p.z <= 0.04) continue;
            placeLantern(c, env, p.x, p.y, p.z, lit[i], i === 0 ? 2.1 : 1);
            if (i > 0 && lit[i] > 0.05) {
              // each of the many has its own few slips circling it
              for (let j = 0; j < 2; j++) {
                const a = tq * 1.6 + j * Math.PI + i;
                slip(c, env, { x: p.x + Math.cos(a) * 11 * p.z, y: p.y - 6 + Math.sin(a) * 4, w: 6, alpha: lit[i] * 0.9 * p.z, rot: 0.2 * Math.sin(a) });
              }
            }
          }
          // converge: slips lift from many places and fly to the one lantern
          const tgt = project(ONE.lat, ONE.lon, spin);
          const N = 11;
          for (let i = 0; i < N; i++) {
            const st = b.converge - 0.15 + i * 0.3;
            const u = clamp01((tq - st) / 1.7);
            if (u <= 0 || u >= 1) continue;
            const from = PLACES[3 + i * 3];
            const p0 = project(from.lat, from.lon, SPIN * st);
            // the far ones come from beyond the rim (requests from the other side of the world)
            const sx = p0.z > 0.1 ? p0.x : G.x + Math.sign(p0.x - G.x || 1) * (G.R + 40);
            const sy = p0.z > 0.1 ? p0.y : p0.y;
            const e = sm(u);
            const out = Math.sin(Math.PI * e) * 46;
            const nx = (sx + tgt.x) / 2 - G.x, ny = (sy + tgt.y) / 2 - G.y;
            const nl = Math.hypot(nx, ny) || 1;
            const x = lerp(sx, tgt.x, e) + (nx / nl) * out;
            const y = lerp(sy, tgt.y, e) + (ny / nl) * out - 4;
            slip(c, env, { x, y, w: 15, rot: (1 - e) * 0.6 * (i % 2 ? 1 : -1), alpha: sm(u * 5) * (1 - sm((u - 0.88) * 8.3)) });
          }
        },
        L5: (c, env) => {
          if (!inGlobe) return;
          // the study's shelf edge at the left of the globe framing (the near occluder)
          bakeRes(f, c, env, `${ID}-shelf`, { x: 1300, y: -260, w: 300, h: 1300 }, (cc) => shelfEdge(cc, env));
        },
      },
    );
    // practicals: the one lantern's warm light (the shot's warm accent after the desk lamp leaves frame)
    if (inGlobe) {
      const p = project(ONE.lat, ONE.lon, spin);
      if (p.z > 0.05 && oneLit > 0.02) {
        const arrive = Array.from({ length: 11 }, (_, i) => clamp01((tq - (b.converge - 0.15 + i * 0.3 + 1.6)) / 0.1) * (1 - clamp01((tq - (b.converge + i * 0.3 + 1.95)) / 0.4))).reduce((a, v) => a + v, 0);
        f.practical({ x: p.x, y: p.y - 4, kind: 'candle', seed: 9, intensity: 0.42 * oneLit * p.z + 0.12 * Math.min(1, arrive), radius: 30, layer: 'L4' });
      }
    }
    // ---------------------------------------------------------------- the dissolve: through a dark ink tone, < 0.6 s
    // (the screen's glow itself is drawn BEHIND the figure in L4back, so he stays the darkest shape in frame)
    const c = f.c;
    const inkTone = mixLab(f.mood.fg, '#3a2a20', 0.35);
    if (!inGlobe) {
      const close = seg(t, swap - 0.3, swap);
      if (close > 0.001) {
        c.save();
        c.fillStyle = withAlpha(inkTone, close);
        c.fillRect(0, 0, 1280, 720);
        c.restore();
      }
    } else {
      // blots of ink clear one by one, revealing the globe
      const u = (t - swap) / 0.8;
      if (u < 1.05) {
        c.save();
        c.fillStyle = withAlpha(inkTone, 1 - seg(u, 0.0, 0.35));
        c.fillRect(0, 0, 1280, 720);
        for (let i = 0; i < 9; i++) {
          const a = 1 - seg(u, 0.1 + h01(i, 2) * 0.45, 0.3 + h01(i, 2) * 0.65);
          if (a <= 0.01) continue;
          c.fillStyle = withAlpha(inkTone, a);
          c.beginPath();
          const cx = 120 + h01(i, 5) * 1040, cy = 80 + h01(i, 6) * 520, r = 200 + h01(i, 8) * 160;
          for (let k = 0; k <= 16; k++) {
            const an = (k / 16) * Math.PI * 2;
            const rr = r * (1 + 0.16 * Math.sin(an * 5 + i));
            c.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr);
          }
          c.closePath();
          c.fill();
        }
        c.restore();
      }
    }
    // ---------------------------------------------------------------- type
    const dA = seg(t, b.date, b.date + 0.5) * (1 - seg(t, b.globe - 0.4, b.globe + 0.3));
    dateStamp(c, f.mood, { id: `${ID}-date`, text: '28 September 2020', x: 1222, y: 66, alpha: dA });
    nameCard(c, { name: 'Kenton Varda', role: 'Cloudflare', x: 64, y: 262, at: b.name - 0.1, dur: 4.4, fade: 0.4 }, { t, mood: f.mood });
    quoteCard(c, { quote: '…only one location in the whole world at a time.', speaker: 'Kenton Varda, 2020', x: 84, y: 158, width: 470, align: 'left', at: b.plain - 0.15, dur: b.many - 1.4 - b.plain, fade: 0.5 }, { t, mood: f.mood });
  },
});

// ------------------------------------------------------------------ the globe and its table
function paperGlobe(c: C2, env: PaintEnv, spin: number, t: number): void {
  const ink = env.fill('ink');
  const pap = paper(env, 0.3);
  // the meridian bracket behind (the far half of the ring)
  c.save();
  c.translate(G.x, G.y);
  c.rotate(TILT);
  c.strokeStyle = ink;
  c.lineWidth = 7;
  c.beginPath();
  c.arc(0, 0, G.R + 12, -Math.PI / 2, Math.PI / 2, true);
  c.stroke();
  c.restore();
  // the sphere: paper lit from the desk lamp at the left
  const g = c.createRadialGradient(G.x - G.R * 0.45, G.y - G.R * 0.35, G.R * 0.1, G.x, G.y, G.R * 1.05);
  g.addColorStop(0, mixLab(pap, '#fff0d4', 0.25));
  g.addColorStop(0.55, mixLab(pap, env.mood.fg, 0.25));
  g.addColorStop(1, mixLab(pap, env.mood.fg, 0.72));
  c.fillStyle = g;
  c.beginPath();
  c.arc(G.x, G.y, G.R, 0, Math.PI * 2);
  c.fill();
  // land patches (cut paper a shade darker), only the near hemisphere
  c.save();
  c.beginPath();
  c.arc(G.x, G.y, G.R - 0.5, 0, Math.PI * 2);
  c.clip();
  for (const L of LANDS) {
    c.beginPath();
    let any = false;
    for (let k = 0; k <= 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const wob = 1 + 0.25 * Math.sin(a * 3 + L.lon * 5);
      const p = project(L.lat + Math.sin(a) * L.r * wob * 0.8, L.lon + (Math.cos(a) * L.r * wob) / Math.max(0.3, Math.cos(L.lat)), spin);
      if (p.z > 0) any = true;
      const q = p.z > 0 ? p : { ...p, x: G.x + (p.x - G.x) * 1.02, y: G.y + (p.y - G.y) * 1.02 };
      if (k === 0) c.moveTo(q.x, q.y);
      else c.lineTo(q.x, q.y);
    }
    if (!any) continue;
    c.closePath();
    c.fillStyle = withAlpha(mixLab(pap, '#5b4632', 0.45), 0.55);
    c.fill();
  }
  // graticule: parallels and turning meridians (front hemisphere only)
  c.strokeStyle = withAlpha(mixLab('#2a1d14', env.mood.fg, 0.2), 0.32);
  c.lineWidth = 1;
  for (const lat of [-1.05, -0.52, 0, 0.52, 1.05]) {
    c.beginPath();
    let on = false;
    for (let k = 0; k <= 48; k++) {
      const p = project(lat, (k / 48) * Math.PI * 2, spin);
      if (p.z > 0) {
        if (!on) c.moveTo(p.x, p.y);
        else c.lineTo(p.x, p.y);
        on = true;
      } else on = false;
    }
    c.stroke();
  }
  for (let m = 0; m < 12; m++) {
    const lon = (m / 12) * Math.PI * 2;
    c.beginPath();
    let on = false;
    for (let k = 0; k <= 24; k++) {
      const p = project(-Math.PI / 2 + (k / 24) * Math.PI, lon, spin);
      if (p.z > 0) {
        if (!on) c.moveTo(p.x, p.y);
        else c.lineTo(p.x, p.y);
        on = true;
      } else on = false;
    }
    c.stroke();
  }
  c.restore();
  // the lamp's rim on the lit edge
  c.strokeStyle = withAlpha(mixLab(env.fill('rim'), '#ffe2b0', 0.4), 0.55);
  c.lineWidth = 2;
  c.beginPath();
  c.arc(G.x, G.y, G.R - 1, Math.PI * 0.85, Math.PI * 1.45);
  c.stroke();
  // the near half of the meridian bracket + its pivots
  c.save();
  c.translate(G.x, G.y);
  c.rotate(TILT);
  c.strokeStyle = ink;
  c.lineWidth = 6;
  c.beginPath();
  c.arc(0, 0, G.R + 12, -Math.PI / 2 - 0.02, Math.PI / 2 + 0.02, false);
  c.stroke();
  c.fillStyle = ink;
  for (const sy of [-1, 1]) {
    c.beginPath();
    c.arc(0, sy * (G.R + 12), 6, 0, Math.PI * 2);
    c.fill();
  }
  // degree ticks
  c.strokeStyle = withAlpha(env.fill('rim'), 0.35);
  c.lineWidth = 1;
  for (let k = -8; k <= 8; k++) {
    const a = (k / 18) * Math.PI;
    c.beginPath();
    c.moveTo(Math.cos(a) * (G.R + 9.5), Math.sin(a) * (G.R + 9.5));
    c.lineTo(Math.cos(a) * (G.R + 14.5), Math.sin(a) * (G.R + 14.5));
    c.stroke();
  }
  c.restore();
  void t;
}
/** the globe's turned stand and the small round side table under it (static: baked) */
function sideTable(f: Parameters<typeof bakeRes>[0], c: C2, env: PaintEnv): void {
  bakeRes(f, c, env, `${ID}-stand`, { x: G.x - 220, y: G.y - G.R - 40, w: 440, h: 520 }, (cc) => {
    const ink = env.fill('ink');
    cc.fillStyle = ink;
    // the bracket's foot: a swan neck from the lower pivot down to a turned column
    const piv = { x: G.x - Math.sin(TILT) * (G.R + 12), y: G.y + Math.cos(TILT) * (G.R + 12) };
    cc.strokeStyle = ink;
    cc.lineWidth = 7;
    cc.lineCap = 'round';
    cc.beginPath();
    cc.moveTo(piv.x, piv.y);
    cc.bezierCurveTo(piv.x + 10, piv.y + 26, G.x, G.y + G.R + 28, G.x, G.y + G.R + 44);
    cc.stroke();
    // turned column (lathe profile) and a tripod foot
    const top = G.y + G.R + 40, foot = G.y + G.R + 120;
    const prof = [[5, 0], [9, 6], [6, 14], [11, 30], [8, 46], [14, 62], [7, 70], [18, 78], [20, 80]];
    cc.beginPath();
    cc.moveTo(G.x, top);
    for (const [r, y] of prof) cc.lineTo(G.x + r, top + y);
    for (let i = prof.length - 1; i >= 0; i--) cc.lineTo(G.x - prof[i][0], top + prof[i][1]);
    cc.closePath();
    cc.fill();
    cc.beginPath();
    cc.moveTo(G.x - 46, foot + 6);
    cc.quadraticCurveTo(G.x - 20, foot - 6, G.x, foot - 4);
    cc.quadraticCurveTo(G.x + 20, foot - 6, G.x + 46, foot + 6);
    cc.lineTo(G.x + 40, foot + 8);
    cc.lineTo(G.x - 40, foot + 8);
    cc.closePath();
    cc.fill();
    // the side table: a round top seen nearly edge-on, a pedestal and three splayed feet
    const ty = foot + 8;
    cc.beginPath();
    cc.ellipse(G.x, ty + 4, 150, 12, 0, 0, Math.PI * 2);
    cc.fill();
    cc.fillRect(G.x - 150, ty + 2, 300, 10);
    cc.fillRect(G.x - 9, ty + 10, 18, 190);
    cc.beginPath();
    cc.moveTo(G.x - 9, ty + 170);
    cc.quadraticCurveTo(G.x - 60, ty + 190, G.x - 92, ty + 220);
    cc.lineTo(G.x + 92, ty + 220);
    cc.quadraticCurveTo(G.x + 60, ty + 190, G.x + 9, ty + 170);
    cc.closePath();
    cc.fill();
    cc.strokeStyle = withAlpha(env.fill('rim'), 0.45);
    cc.lineWidth = 1.4;
    cc.beginPath();
    cc.ellipse(G.x, ty + 4, 150, 12, 0, Math.PI, Math.PI * 1.9);
    cc.stroke();
  });
}
/** a small paper lantern on the globe's surface: dark (a possible place) or lit (the object's one place) */
function placeLantern(c: C2, env: PaintEnv, x: number, y: number, z: number, lit: number, big: number): void {
  const s = (0.55 + 0.45 * z) * big;
  const w = 6 * s, h = 8.5 * s;
  const ink = env.fill('ink');
  c.save();
  const core = tone(env, '#ffc46e', 0.06);
  c.fillStyle = mixLab(mixLab(ink, '#3a2c20', 0.4), mixLab(core, '#fff3da', 0.35), lit);
  c.globalAlpha = 0.55 + 0.45 * Math.max(z, lit);
  c.beginPath();
  c.ellipse(x, y - h * 0.55, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = ink;
  c.fillRect(x - w * 0.36, y - h * 1.08, w * 0.72, h * 0.16);
  c.fillRect(x - w * 0.4, y - h * 0.1, w * 0.8, h * 0.18);
  c.restore();
  if (lit > 0.02) glowDot(c, x, y - h * 0.55, 16 * s, core, 0.75 * lit * (0.5 + 0.5 * z));
}
function shelfEdge(c: C2, env: PaintEnv): void {
  c.fillStyle = env.fill('fg');
  c.fillRect(1300, -260, 150, 1300);
  for (const y of [40, 270, 500]) {
    c.fillRect(1440, y, 100, 14);
    let x = 1444;
    let k = y;
    while (x < 1530) {
      const w = 8 + ((k * 7) % 9), h = 40 + ((k * 13) % 34);
      c.fillRect(x, y - h, w, h);
      x += w + 2;
      k += 3;
    }
  }
}
