/**
 * handwired-explained — ch12-s06 / ch12-s07: the close insert on the copper wire under the dock.
 *
 * ch12-s06 is a macro on the HandwiredOS desk's one copper wire (OS18): the warm paper desk fills the frame, the
 * dock's three tiles stand soft at the upper left, the wire runs in from frame left to its end ring, and a short
 * length hooked through that ring is what the narrator's hands bend into the hinge. ch12-s07 opens on the same wire
 * as the last light in frame: its SVG overlay draws the wire at exactly the screen position s06 leaves it at, so it
 * survives the fadeBlack between the two shots and goes out on the relay clack ('out', 0.2 s into s07).
 *
 *   import { CLOSE, CLOSE_END_CAM, closeDesk, drawCopper, wireOnScreen } from '../sets/ch12-s06-close';
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { CAMERA3_HOME, LAYERS } from '../../../film/contracts';
import { toScreen } from '../../../film/core/multiplane';
import { hash1 } from '../../../film/core/frame';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { OS_COLORS } from './circuit';
import { dockGlyph } from './ch01-s01-dock';

type C = CanvasRenderingContext2D;
/** hash1 is in [-1, 1]: a 0..1 variant */
const h01 = (i: number, salt: number) => 0.5 + 0.5 * hash1(i, salt);
export type Pt = { x: number; y: number };

/** the insert's geometry (L4 rest px at CAMERA3_HOME) */
export const CLOSE = {
  /** the dock wire's height and its run in from beyond frame left to the end ring */
  wireY: 300,
  wireX0: -160,
  ringX: 566,
  ringR: 6,
  /** the short length hooked through the ring: its flat run to the corner, then the climb (45 deg, Deep Dive I) */
  flat: 104,
  climb: 112,
  /** the wire's stroke (stage px) */
  wireW: 4.2,
  /** the dock tiles above the wire (L3): size, pitch, centre x of the middle tile, top y */
  tile: 92,
  pitch: 124,
  dockCx: 132,
  tileTop: 168,
  /** the paper's lower edge and the stage lip below it (L5) */
  paperBottom: 668,
} as const;

/** ch12-s06's locked-off framing: about 9 % tighter than rest and 40 px lower, so wire, hinge and palm sit in the
 *  middle third */
export const CLOSE_START_CAM: Camera3 = { ...CAMERA3_HOME, x: 690, y: 400, z: 85 };
/** where ch12-s06's camera ends (a hair's drift on from the start, toward the open palm), so ch12-s07 can find the
 *  wire on screen */
export const CLOSE_END_CAM: Camera3 = { ...CAMERA3_HOME, x: 712, y: 410, z: 100 };

/** the dock wire's two ends on SCREEN for a camera (L4): ch12-s07's overlay lays the last light here */
export function wireOnScreen(cam: Camera3 = CLOSE_END_CAM) {
  const a = toScreen(LAYERS.L4, cam, CLOSE.wireX0, CLOSE.wireY);
  const b = toScreen(LAYERS.L4, cam, CLOSE.ringX, CLOSE.wireY);
  const k = toScreen(LAYERS.L4, cam, CLOSE.ringX + 10, CLOSE.wireY).x - b.x;
  return { x0: a.x, x1: b.x, y: a.y, ringR: CLOSE.ringR * (k / 10), w: CLOSE.wireW * (k / 10) };
}

/** the film's copper as the stylesheet lit it (the shared copperOf reads pale on parchment): body, shade, highlight */
export function copperTones(env: PaintEnv, glow = 0) {
  const body = mixLab(mixLab('#b0622c', OS_COLORS.copper, 0.35), env.mood.core, 0.08 + 0.3 * glow);
  return {
    body,
    shade: mixLab(body, '#2a140a', 0.45),
    hi: withAlpha(mixLab(body, '#fff3dc', 0.55 + 0.25 * glow), 0.9),
  };
}

/** a run of copper wire (polyline) with its shaded underside, lit top edge and a soft cast shadow on the paper */
export function drawCopper(c: C, env: PaintEnv, pts: Pt[], o: { w?: number; glow?: number; shadow?: number; alpha?: number } = {}) {
  if (pts.length < 2) return;
  const w = o.w ?? CLOSE.wireW;
  const tone = copperTones(env, o.glow ?? 0);
  const path = (dx = 0, dy = 0) => {
    c.beginPath();
    c.moveTo(pts[0].x + dx, pts[0].y + dy);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x + dx, pts[i].y + dy);
  };
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const sh = o.shadow ?? 1;
  if (sh > 0) {
    // the cast shadow on the paper, a few px below-right (the morning light is upper left)
    c.strokeStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.5), 0.16 * sh);
    c.lineWidth = w * 2.2;
    path(4, 7);
    c.stroke();
    c.strokeStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.5), 0.12 * sh);
    c.lineWidth = w * 1.1;
    path(3, 5);
    c.stroke();
  }
  c.strokeStyle = tone.shade;
  c.lineWidth = w + 1.4;
  path(0, 0.5);
  c.stroke();
  c.strokeStyle = tone.body;
  c.lineWidth = w;
  path();
  c.stroke();
  c.strokeStyle = tone.hi;
  c.lineWidth = Math.max(1, w * 0.3);
  path(-0.3, -w * 0.28);
  c.stroke();
  c.restore();
}

/** the end ring (a small eye the short length hooks through) */
export function drawRing(c: C, env: PaintEnv, x: number, y: number, r = CLOSE.ringR, glow = 0) {
  const tone = copperTones(env, glow);
  c.save();
  c.strokeStyle = tone.shade;
  c.lineWidth = 3.6;
  c.beginPath();
  c.arc(x, y + 0.5, r, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = tone.body;
  c.lineWidth = 2.6;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = tone.hi;
  c.lineWidth = 1;
  c.beginPath();
  c.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.7);
  c.stroke();
  c.restore();
}

/**
 * The desk paper in close-up (L3, cached with a macro's soft focus): warm paper-beige lit from the upper left, the
 * real desk's faint dot grid, a few of the wallpaper's copper and indigo arcs far from the dock (the stylesheet
 * clears them round the dock), and the three dock tiles (pulse, page, picture) standing soft above the wire.
 */
export function closeDesk(f: Frame, c: C, env: PaintEnv, key: string) {
  const X = -260, Y = -200, W = 1800, H = CLOSE.paperBottom - Y;
  const draw = f.cached(`${key}/close-desk-v2/${env.mood.id}`, W, H, (cc) => {
    cc.translate(-X, -Y);
    const paper = mixLab(mixLab(OS_COLORS.desk, env.mood.halo, 0.3), env.mood.haze, env.layer.haze * 0.35);
    // morning light from the upper left: a warm pool, falling off to the lower right
    cc.fillStyle = paper;
    cc.fillRect(X, Y, W, H);
    const g = cc.createRadialGradient(260, 40, 40, 360, 160, 1250);
    g.addColorStop(0, withAlpha(mixLab(paper, env.mood.core, 0.55), 0.85));
    g.addColorStop(0.45, withAlpha(paper, 0));
    g.addColorStop(1, withAlpha(mixLab(paper, env.mood.set, 0.38), 0.95));
    cc.fillStyle = g;
    cc.fillRect(X, Y, W, H);
    // the morning window falling on the paper: four soft panes of warmer light, skewed, upper right
    cc.save();
    cc.filter = 'blur(26px)';
    cc.fillStyle = withAlpha(mixLab(env.mood.core, '#fff1cf', 0.4), 0.2);
    cc.setTransform(cc.getTransform().multiply(new DOMMatrix([1, 0.16, -0.32, 1, 0, 0])));
    for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) cc.fillRect(640 + i * 150, -150 + j * 210, 132, 190);
    cc.restore();
    // the lamp's falloff: the paper away from the pool (upper right) sits a step darker, so the light reads as a
    // practical pool on the wire rather than an even wall
    const fo = cc.createRadialGradient(1500, -160, 60, 1450, -120, 1000);
    fo.addColorStop(0, withAlpha(mixLab(paper, env.mood.set, 0.55), 0.5));
    fo.addColorStop(0.55, withAlpha(mixLab(paper, env.mood.set, 0.45), 0.24));
    fo.addColorStop(1, withAlpha(paper, 0));
    cc.fillStyle = fo;
    cc.fillRect(X, Y, W, H);
    // the paper's lower margin darkens a touch toward the stage lip
    const lo = cc.createLinearGradient(0, 470, 0, CLOSE.paperBottom);
    lo.addColorStop(0, withAlpha(env.mood.set, 0));
    lo.addColorStop(1, withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.2), 0.32));
    cc.fillStyle = lo;
    cc.fillRect(X, 470, W, CLOSE.paperBottom - 470);
    // wallpaper arcs: big, faint, away from the dock
    for (let i = 0; i < 26; i++) {
      const cx = 380 + h01(i, 3) * 1300;
      const cy = 520 + h01(i, 5) * 520;
      const r = 220 + h01(i, 7) * 520;
      if (cx - r < 300 && cy - r < 420) continue;
      const a0 = Math.PI * (1.05 + 0.35 * h01(i, 11));
      const a1 = a0 + Math.PI * (0.25 + 0.4 * h01(i, 13));
      cc.strokeStyle = withAlpha(h01(i, 17) > 0.42 ? OS_COLORS.copper : OS_COLORS.indigo, 0.07 + 0.04 * h01(i, 19));
      cc.lineWidth = 1.6 + 1.4 * h01(i, 23);
      cc.beginPath();
      cc.arc(cx, cy, r, a0, a1);
      cc.stroke();
    }
    // the dot grid (the real desk's 24 css px pitch at this scale)
    const pitch = 34;
    cc.fillStyle = withAlpha(OS_COLORS.ink, 0.1);
    for (let y = Y + 10; y < CLOSE.paperBottom - 6; y += pitch) for (let x = X + 6; x < X + W; x += pitch) cc.fillRect(x, y, 2.2, 2.2);
    // the dock tiles: warm white cards, a hair proud of the paper (soft shadow below-right), glyphs in ink
    for (let i = 0; i < 3; i++) {
      const s = CLOSE.tile;
      const x = CLOSE.dockCx + (i - 1) * CLOSE.pitch - s / 2;
      const y = CLOSE.tileTop;
      cc.fillStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.4), 0.22);
      cc.beginPath();
      cc.roundRect(x + 5, y + 8, s, s, s * 0.2);
      cc.fill();
      const tg = cc.createLinearGradient(0, y, 0, y + s);
      tg.addColorStop(0, mixLab(OS_COLORS.sheet, env.mood.core, 0.3));
      tg.addColorStop(1, mixLab(OS_COLORS.sheet, paper, 0.45));
      cc.fillStyle = tg;
      cc.beginPath();
      cc.roundRect(x, y, s, s, s * 0.2);
      cc.fill();
      cc.save();
      cc.translate(x, y);
      dockGlyph(cc, i, s, withAlpha(OS_COLORS.ink, 0.7), s * 0.045);
      cc.restore();
    }
  });
  draw(c, X, Y);
}

/** the stage lip under the paper (L5, near and soft): the toy theatre's black card with a warm rim on its top */
export function stageLip(f: Frame, c: C, env: PaintEnv, key: string) {
  const draw = f.cached(`${key}/lip/${env.mood.id}`, 1900, 260, (cc) => {
    cc.translate(320, -CLOSE.paperBottom + 40);
    const top = CLOSE.paperBottom + 6;
    cc.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.fg, 0.25);
    cc.beginPath();
    cc.moveTo(-320, top + 8);
    cc.quadraticCurveTo(640, top - 6, 1580, top + 4);
    cc.lineTo(1580, top + 260);
    cc.lineTo(-320, top + 260);
    cc.closePath();
    cc.fill();
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.55);
    cc.lineWidth = 2.4;
    cc.beginPath();
    cc.moveTo(-320, top + 8);
    cc.quadraticCurveTo(640, top - 6, 1580, top + 4);
    cc.stroke();
  });
  draw(c, -320, CLOSE.paperBottom - 40);
}

/**
 * The Notes window's lower hem (L3, far and soft): the bottom of the paper window ch12-s05 pushed in on, hanging on
 * its thread above the dock at the upper right, a hair proud of the desk (soft shadow below-right). Its last to-do
 * lines are only grey strokes at this focus (nothing to read: the words were s05's).
 */
export function notesHem(f: Frame, c: C, env: PaintEnv, key: string) {
  const X = 760, Y = -330, W = 560, H = 600;
  const draw = f.cached(
    `${key}/notes-hem/${env.mood.id}`,
    W,
    H,
    (cc) => {
      cc.translate(-X, -Y);
      const x0 = 840, x1 = 1250, yb = 176;
      const paper = mixLab(mixLab(OS_COLORS.sheet, env.mood.core, 0.25), env.mood.set, 0.12);
      // its shadow on the desk paper
      cc.fillStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.4), 0.2);
      cc.beginPath();
      cc.roundRect(x0 + 12, Y, x1 - x0, yb - Y + 14, 10);
      cc.fill();
      // the window card (its top is far above frame)
      const g = cc.createLinearGradient(0, Y, 0, yb);
      g.addColorStop(0, mixLab(paper, env.mood.core, 0.2));
      g.addColorStop(1, mixLab(paper, env.mood.set, 0.22));
      cc.fillStyle = g;
      cc.beginPath();
      cc.roundRect(x0, Y, x1 - x0, yb - Y, 10);
      cc.fill();
      // the last soft to-do strokes (grey, out of focus: not text)
      cc.strokeStyle = withAlpha(OS_COLORS.ink, 0.22);
      cc.lineCap = 'round';
      cc.lineWidth = 5;
      for (let i = 0; i < 3; i++) {
        const y = yb - 118 + i * 34;
        const w = [270, 220, 300][i];
        cc.beginPath();
        cc.moveTo(x0 + 46, y);
        cc.lineTo(x0 + 46 + w, y);
        cc.stroke();
      }
      // its thread, running up out of frame from the window's far corner
      cc.strokeStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.5), 0.35);
      cc.lineWidth = 1.4;
      cc.beginPath();
      cc.moveTo(x1 - 30, Y);
      cc.lineTo(x1 - 30, Y - 40);
      cc.stroke();
    },
    { blur: 5 },
  );
  draw(c, X, Y);
}

/** the lip's lit top edge, crisp (screen-locked, 1.5 px at 1080p): the toy theatre's card edge catching the lamp */
export function lipRim(c: C, mood: PaintEnv['mood'], cam: Camera3, alpha = 1) {
  const top = CLOSE.paperBottom + 6;
  const P = (x: number, y: number) => toScreen(LAYERS.L5, cam, x, y);
  const a = P(-320, top + 8), m = P(640, top - 6), b = P(1580, top + 4);
  c.save();
  c.lineCap = 'round';
  const warm = mixLab(mood.rim, mood.core, 0.55);
  c.strokeStyle = withAlpha(warm, 0.22 * alpha);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(a.x, a.y + 0.5);
  c.quadraticCurveTo(m.x, m.y + 0.5, b.x, b.y + 0.5);
  c.stroke();
  c.strokeStyle = withAlpha(warm, 0.75 * alpha);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.quadraticCurveTo(m.x, m.y, b.x, b.y);
  c.stroke();
  c.restore();
}

/** a soft vignette (screen-locked), heavier in the upper right away from the lamp */
export function closeVignette(f: Frame, c: C, mood: PaintEnv['mood'], key: string) {
  const draw = f.cached(`${key}/vignette/${mood.id}`, 1280, 720, (cc) => {
    const dark = mixLab(mood.set, PUPPET_NEAR_BLACK, 0.55);
    const g = cc.createRadialGradient(470, 330, 260, 560, 380, 900);
    g.addColorStop(0, withAlpha(dark, 0));
    g.addColorStop(0.55, withAlpha(dark, 0.1));
    g.addColorStop(1, withAlpha(dark, 0.42));
    cc.fillStyle = g;
    cc.fillRect(0, 0, 1280, 720);
    const r = cc.createRadialGradient(1300, -40, 40, 1300, -40, 700);
    r.addColorStop(0, withAlpha(dark, 0.22));
    r.addColorStop(1, withAlpha(dark, 0));
    cc.fillStyle = r;
    cc.fillRect(0, 0, 1280, 720);
  });
  draw(c, 0, 0);
}

/**
 * The narrator's sleeve widening toward the elbow (L4): a near-black wedge laid over the linen beyond the roll, so the
 * forearms taper (wrist about 60 % of the sleeve at the frame edge) instead of reading as two parallel bars.
 * `wrist`/`angle` are the arm's (hands.reach); len = the hand length.
 */
export function taperSleeve(c: C, wrist: Pt, angle: number, len: number) {
  const ux = Math.cos(angle), uy = Math.sin(angle);
  const px = -uy, py = ux;
  const at = (lx: number, hw: number, side: number) => ({ x: wrist.x + ux * lx * len + px * hw * len * side, y: wrist.y + uy * lx * len + py * hw * len * side });
  const x0 = -1.5, x1 = -9;
  const h0 = 0.32, h1 = 0.32 + 0.085 * (x0 - x1);
  const pts = [at(x0, h0, 1), at(-3.2, 0.32 + 0.085 * 1.7, 1), at(x1, h1, 1), at(x1, h1, -1), at(-3.2, 0.32 + 0.085 * 1.7, -1), at(x0, h0, -1)];
  c.save();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
  c.closePath();
  c.fill();
  c.restore();
}
