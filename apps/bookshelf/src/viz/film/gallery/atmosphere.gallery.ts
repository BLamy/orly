import type { GalleryModule, GalleryEnv } from './main';
import type { MoodId, Palette, PaintEnv } from '../contracts';
import { makeEnv, mood, mixLab, withAlpha } from '../silhouette/palette';
import { dustMotes, embers, fogBank, godRays, paperSheets, rain, smoke, snow, sparks, windowBeam, hash1, type Rect } from '../silhouette/atmosphere';

// ---------------------------------------------------------------------------
// gallery-only test backdrops (the real sets live in silhouette/architecture)
// ---------------------------------------------------------------------------
export function backlight(c: CanvasRenderingContext2D, P: Palette, sunX = 640) {
  const g = c.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, P.sky[0]);
  g.addColorStop(0.3, P.sky[1]);
  g.addColorStop(0.5, P.sky[2]);
  g.addColorStop(P.horizon, P.sky[3]);
  g.addColorStop(1, P.sky[2]);
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  const r = c.createRadialGradient(sunX, 720 * P.horizon, 0, sunX, 720 * P.horizon, 700);
  r.addColorStop(0, withAlpha(P.rim, 0.35));
  r.addColorStop(1, withAlpha(P.rim, 0));
  c.fillStyle = r;
  c.fillRect(0, 0, 1280, 720);
}
/** gothic-arch window openings used by the room backdrop */
export const ROOM_WINDOWS: Rect[] = [
  { x: 150, y: 110, w: 190, h: 400 },
  { x: 545, y: 90, w: 190, h: 420 },
  { x: 940, y: 110, w: 190, h: 400 },
];
function archPath(c: CanvasRenderingContext2D, r: Rect) {
  const sp = r.w * 0.55;
  c.moveTo(r.x, r.y + r.h);
  c.lineTo(r.x, r.y + sp);
  c.quadraticCurveTo(r.x, r.y + sp * 0.15, r.x + r.w / 2, r.y);
  c.quadraticCurveTo(r.x + r.w, r.y + sp * 0.15, r.x + r.w, r.y + sp);
  c.lineTo(r.x + r.w, r.y + r.h);
  c.closePath();
}
/** a dusky panelled room: backlight through arched, mullioned windows, a haze band, a checker floor */
export function room(c: CanvasRenderingContext2D, P: Palette) {
  backlight(c, P);
  const wall = new Path2D();
  wall.rect(-10, -10, 1300, 600);
  for (const r of ROOM_WINDOWS) {
    // glazing: panes as holes, bars remain as wall
    const cols = 3;
    const rows = 6;
    const pw = (r.w - 8 * (cols + 1)) / cols;
    const ph = (r.h - r.w * 0.55 - 8 * rows) / rows;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) wall.rect(r.x + 8 + i * (pw + 8), r.y + r.w * 0.55 + 8 * j + j * ph, pw, ph);
    const tr = new Path2D();
    // tracery head: three lobed openings
    for (const [dx, dy, rr] of [
      [0.5, 0.27, 0.13],
      [0.27, 0.42, 0.1],
      [0.73, 0.42, 0.1],
    ]) {
      wall.moveTo(r.x + r.w * dx + r.w * rr, r.y + r.w * dy);
      wall.arc(r.x + r.w * dx, r.y + r.w * dy, r.w * rr, 0, Math.PI * 2);
    }
    void tr;
  }
  const wg = c.createLinearGradient(0, 0, 0, 600);
  wg.addColorStop(0, mixLab(P.set, P.fg, 0.25));
  wg.addColorStop(0.75, mixLab(P.set, P.haze, 0.12));
  c.fillStyle = wg;
  c.fill(wall, 'evenodd');
  // pilasters
  c.fillStyle = mixLab(P.set, P.fg, 0.45);
  for (const x of [40, 430, 825, 1220]) c.fillRect(x, 0, 26, 600);
  // haze band at table height
  const hz = c.createLinearGradient(0, 300, 0, 600);
  hz.addColorStop(0, withAlpha(P.haze, 0));
  hz.addColorStop(0.55, withAlpha(P.haze, 0.32));
  hz.addColorStop(1, withAlpha(P.haze, 0.12));
  c.fillStyle = hz;
  c.fillRect(0, 300, 1280, 300);
  // floor: perspective checker
  c.fillStyle = mixLab(P.ink, P.set, 0.55);
  c.fillRect(0, 580, 1280, 140);
  c.fillStyle = mixLab(P.ink, P.set, 0.25);
  for (let row = 0; row < 5; row++) {
    const y0 = 580 + row * row * 6 + row * 14;
    const y1 = 580 + (row + 1) * (row + 1) * 6 + (row + 1) * 14;
    for (let i = -12; i < 14; i++) {
      if ((i + row) % 2) continue;
      const sx = (k: number, y: number) => 640 + (k * 60 - 0) * (1 + (y - 580) / 90);
      c.beginPath();
      c.moveTo(sx(i, y0), y0);
      c.lineTo(sx(i + 1, y0), y0);
      c.lineTo(sx(i + 1, y1), y1);
      c.lineTo(sx(i, y1), y1);
      c.fill();
    }
  }
}
/** a silhouetted skyline/street for exterior tests */
export function street(c: CanvasRenderingContext2D, P: Palette, seed = 3) {
  backlight(c, P, 820);
  // far roofs (hazed)
  c.fillStyle = mixLab(P.set, P.haze, 0.6);
  c.beginPath();
  c.moveTo(0, 720);
  let x = 0;
  let i = 0;
  while (x < 1300) {
    const w = 60 + hash1(i, seed) * 90;
    const h = 330 + hash1(i + 50, seed) * 140;
    c.lineTo(x, h);
    if (hash1(i + 9, seed) > 0.5) c.lineTo(x + w / 2, h - 40);
    c.lineTo(x + w, h);
    x += w;
    i++;
  }
  c.lineTo(1300, 720);
  c.fill();
  // near terrace with windows + chimneys
  c.fillStyle = mixLab(P.set, P.ink, 0.6);
  c.beginPath();
  c.moveTo(-10, 720);
  c.lineTo(-10, 420);
  c.lineTo(180, 360);
  c.lineTo(370, 420);
  c.lineTo(370, 720);
  c.closePath();
  c.rect(300, 330, 26, 50);
  c.rect(880, 300, 30, 60);
  c.moveTo(800, 720);
  c.lineTo(800, 400);
  c.lineTo(1000, 330);
  c.lineTo(1290, 400);
  c.lineTo(1290, 720);
  c.fill();
  c.fillStyle = mixLab(P.halo, P.core, 0.3);
  for (const [wx, wy] of [
    [60, 470],
    [150, 470],
    [240, 470],
    [880, 460],
    [1000, 460],
    [1120, 460],
  ]) {
    c.globalAlpha = 0.85;
    c.fillRect(wx, wy, 34, 52);
  }
  c.globalAlpha = 1;
  c.fillStyle = P.fg;
  c.fillRect(-10, 640, 1300, 90);
}

// ---------------------------------------------------------------------------
const SOLO = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('q') : null;
function quad(c: CanvasRenderingContext2D, qx: number, qy: number, m: MoodId, t: number, draw: (c: CanvasRenderingContext2D, env: PaintEnv, P: Palette) => void) {
  if (SOLO !== null && Number(SOLO) !== qx + qy * 2) return;
  c.save();
  if (SOLO === null) {
    c.translate(qx * 640, qy * 360);
    c.scale(0.5, 0.5);
  }
  c.beginPath();
  c.rect(0, 0, 1280, 720);
  c.clip();
  const env = makeEnv({ mood: m, t, seed: 7 + qx + qy * 2 });
  draw(c, env, mood(m));
  c.restore();
}
function label(c: CanvasRenderingContext2D, text: string, x: number, y: number) {
  c.font = '500 15px "Cormorant SC"';
  c.letterSpacing = '2px';
  c.fillStyle = 'rgba(245,230,200,0.85)';
  c.fillText(text, x + 14, y + 24);
  c.letterSpacing = '0px';
}

/** ?perf=1: per-painter cost at the gallery resolution (median of 15 frames, after warm-up) */
function perf(c: CanvasRenderingContext2D, ge: GalleryEnv) {
  const P = mood('duskRose');
  const beams = ROOM_WINDOWS.map((r) => windowBeam(r, { x: -0.4, y: 1 }, 560, 1.25));
  const cases: [string, (env: PaintEnv) => void][] = [
    ['room backdrop (test)', () => room(c, P)],
    ['godRays x3', (e) => godRays(c, { beams, mullions: 2 }, e)],
    ['dustMotes 160', (e) => dustMotes(c, { beam: beams[1], count: 160 }, e)],
    ['snow 420 + settle', (e) => snow(c, { settle: { y: 640 } }, e)],
    ['rain 240 + splashes', (e) => rain(c, { splashY: 640 }, e)],
    ['embers 36', (e) => embers(c, { x: 400, y: 500 }, e)],
    ['sparks 28', (e) => sparks(c, { x: 400, y: 500, t0: e.t - 0.3 }, e)],
    ['smoke candle', (e) => smoke(c, { x: 300, y: 470 }, e)],
    ['smoke pipe', (e) => smoke(c, { x: 300, y: 470, kind: 'pipe' }, e)],
    ['smoke steam', (e) => smoke(c, { x: 300, y: 470, kind: 'steam' }, e)],
    ['smoke chimney', (e) => smoke(c, { x: 300, y: 470, kind: 'chimney' }, e)],
    ['paperSheets 12', (e) => paperSheets(c, {}, e)],
    ['fogBank 3 layers', (e) => fogBank(c, { y: 600 }, e)],
  ];
  const rows: string[] = [];
  for (const [name, fn] of cases) {
    const times: number[] = [];
    for (let i = 0; i < 18; i++) {
      const e = makeEnv({ mood: 'duskRose', t: ge.t + i / 24, seed: 3 });
      const t0 = performance.now();
      fn(e);
      c.getImageData(0, 0, 1, 1);
      if (i >= 3) times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    rows.push(`${name.padEnd(22, ' ')} ${times[times.length >> 1].toFixed(2)} ms`);
  }
  c.fillStyle = 'rgba(0,0,0,0.75)';
  c.fillRect(0, 0, 1280, 720);
  c.font = '400 20px "IBM Plex Mono"';
  c.fillStyle = '#f0e6d0';
  rows.forEach((r, i) => c.fillText(r, 60, 70 + i * 34));
}

const g: GalleryModule = {
  title: 'atmosphere',
  duration: 6,
  fonts: ['500 15px "Cormorant SC"', '400 20px "IBM Plex Mono"'],
  paint(c, ge: GalleryEnv) {
    const t = ge.t;
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('perf')) return perf(c, ge);
    // 1. interior: god rays + dust + candle smoke + pipe smoke
    quad(c, 0, 0, 'duskRose', t, (c, env, P) => {
      room(c, P);
      const dir = { x: -0.42, y: 1 };
      const beams = ROOM_WINDOWS.map((r) => windowBeam(r, dir, 560, 1.25));
      godRays(c, { beams, intensity: 0.42, mullions: 2 }, env);
      dustMotes(c, { beam: beams[1], count: 160 }, env);
      dustMotes(c, { beam: beams[2], count: 110, salt: 3 }, env);
      // candlestick + flame
      c.fillStyle = P.ink;
      c.fillRect(296, 520, 8, 110);
      c.fillRect(280, 625, 40, 8);
      c.fillRect(294, 492, 12, 30);
      c.fillStyle = P.core;
      c.beginPath();
      c.ellipse(300, 482, 3.2, 9, 0, 0, Math.PI * 2);
      c.fill();
      smoke(c, { x: 300, y: 470, kind: 'candle', height: 200 }, env);
      smoke(c, { x: 1010, y: 430, kind: 'pipe', drift: -40 }, env);
      fogBank(c, { y: 640, height: 110, density: 0.35, speed: 9 }, env);
    });
    // 2. winter: snow + settling + fog bank + chimney
    quad(c, 1, 0, 'winterBlue', t, (c, env, P) => {
      street(c, P);
      snow(c, { depthRange: [0, 0.55], count: 180 }, env);
      smoke(c, { x: 313, y: 330, kind: 'chimney', height: 230, drift: 90 }, env);
      fogBank(c, { y: 600, height: 130, density: 0.5 }, env);
      snow(c, { depthRange: [0.55, 1], count: 140, settle: { y: 642, depth: 22, rate: 6 }, salt: 9 }, env);
    });
    // 3. night rain (labGreen)
    quad(c, 0, 1, 'labGreen', t, (c, env, P) => {
      street(c, P, 11);
      rain(c, { count: 320, splashY: 646, angle: 12 }, env);
      smoke(c, { x: 893, y: 300, kind: 'steam', height: 150, drift: 30, scale: 1.6 }, env);
    });
    // 4. forge / ember red: embers, sparks, falling papers
    quad(c, 1, 1, 'emberRed', t, (c, env, P) => {
      backlight(c, P, 400);
      c.fillStyle = mixLab(P.set, P.ink, 0.5);
      c.beginPath();
      c.moveTo(260, 720);
      c.lineTo(300, 520);
      c.lineTo(500, 520);
      c.lineTo(540, 720);
      c.fill();
      const fire = c.createRadialGradient(400, 515, 0, 400, 515, 120);
      fire.addColorStop(0, withAlpha(P.core, 0.9));
      fire.addColorStop(0.3, withAlpha(P.halo, 0.5));
      fire.addColorStop(1, withAlpha(P.halo, 0));
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = fire;
      c.fillRect(260, 380, 280, 200);
      c.globalCompositeOperation = 'source-over';
      embers(c, { x: 400, y: 515, spread: 120, count: 48 }, env);
      sparks(c, { x: 820, y: 560, t0: Math.floor(t / 1.5) * 1.5, count: 30, angle: -20 }, env);
      c.fillStyle = P.ink;
      c.fillRect(760, 570, 140, 34); // anvil
      c.fillRect(800, 600, 60, 120);
      paperSheets(c, { count: 9, size: 40, area: { x: 0, y: -60, w: 1280, h: 840 } }, env);
      paperSheets(c, { count: 4, size: 28, tone: 'lit', salt: 4 }, env);
    });
    if (SOLO !== null) return;
    label(c, 'god rays · dust · candle & pipe smoke · fog bank', 0, 0);
    label(c, 'snow (2 depth passes, settling) · chimney · fog bank', 640, 0);
    label(c, 'rain · splashes · steam', 0, 360);
    label(c, 'embers · sparks (burst every 1.5 s) · paper sheets', 640, 360);
  },
};
export default g;
