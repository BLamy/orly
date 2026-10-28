/**
 * ch01-s01 — the film's first image: one copper thread draws itself across the dark and turns out to be the wire
 * under a paper dock (no narration, no type).
 *
 * Black for a breath; at 'haze' (0.6 s) the low haze lifts in the backlight (parchment held very low: the frame stays
 * almost black with a warm floor). At 'fuse' (1.2 s) a single copper thread draws itself from frame left at 58 % of
 * frame height like a slow fuse, a bright bead at its tip, the haze glowing faintly where it has passed. At 'dock'
 * (5.0 s) it stops just past centre at the wire's end ring, and three paper tiles fold up out of the dark above its
 * right half (pulse, page, picture glyphs), laid out exactly as the desk's dock sits over its wire (handwiredDesk
 * fractions) at the scale ch01-s02 opens on, so the crossfade lands the tiles on the real dock. At 'clack' (5.7 s)
 * the wire's halo steps up once and settles. Camera: a near-still dolly (z 0 → 22) so the motes, the haze and the
 * wire slide a hair against each other.
 */
import { Timeline, ease } from '../../../core';
import { CAMERA3_HOME, cam3Interp, defineShot, dustMotes, fbm, mixLab, withAlpha, PUPPET_NEAR_BLACK } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { drawLine } from '../sets/tagLine';
import { OS_COLORS } from '../sets/circuit';

/** the copper thread (L4): from beyond frame left to the wire's end ring just past centre */
const LINE_Y = 418;
const X0 = -80;
const X_END = 724;
/** the dock over the wire, in s02's opening scale (L3 scale 1.29 of the desk's 34.2 px tiles at 1.35 pitch) */
const TILE = 44;
const PITCH = 59.6;
const DOCK_CX = 606;
const TILE_BOTTOM = LINE_Y - 14;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

/** a tile's cut-out glyph (pulse line · page · picture), drawn in tile-local px (0..TILE) */
function glyph(c: CanvasRenderingContext2D, kind: number, col: string) {
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = 2.2;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const s = TILE;
  c.beginPath();
  if (kind === 0) {
    // the pulse line (Monitor)
    c.moveTo(s * 0.18, s * 0.55);
    c.lineTo(s * 0.36, s * 0.55);
    c.lineTo(s * 0.45, s * 0.3);
    c.lineTo(s * 0.56, s * 0.74);
    c.lineTo(s * 0.64, s * 0.5);
    c.lineTo(s * 0.82, s * 0.5);
    c.stroke();
  } else if (kind === 1) {
    // the page (Notes): a sheet with a folded corner and three lines
    c.moveTo(s * 0.3, s * 0.2);
    c.lineTo(s * 0.6, s * 0.2);
    c.lineTo(s * 0.72, s * 0.32);
    c.lineTo(s * 0.72, s * 0.8);
    c.lineTo(s * 0.3, s * 0.8);
    c.closePath();
    c.stroke();
    c.lineWidth = 1.6;
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      c.moveTo(s * 0.38, s * (0.44 + i * 0.11));
      c.lineTo(s * 0.64, s * (0.44 + i * 0.11));
    }
    c.stroke();
  } else {
    // the picture (Photos): a frame, a hill and a sun
    c.rect(s * 0.2, s * 0.26, s * 0.6, s * 0.48);
    c.stroke();
    c.beginPath();
    c.moveTo(s * 0.2, s * 0.74);
    c.lineTo(s * 0.42, s * 0.5);
    c.lineTo(s * 0.56, s * 0.62);
    c.lineTo(s * 0.66, s * 0.54);
    c.lineTo(s * 0.8, s * 0.7);
    c.lineTo(s * 0.8, s * 0.74);
    c.closePath();
    c.fill();
    c.beginPath();
    c.arc(s * 0.66, s * 0.38, s * 0.06, 0, Math.PI * 2);
    c.fill();
  }
}

/** one dock tile folding up about its bottom edge (fold 0 = flat, out of sight; 1 = upright) */
function dockTile(c: CanvasRenderingContext2D, env: PaintEnv, cx: number, fold: number, kind: number, glow: number) {
  if (fold <= 0.01) return;
  const k = Math.sin((fold * Math.PI) / 2);
  c.save();
  c.translate(cx, TILE_BOTTOM);
  c.scale(1, k);
  c.translate(-TILE / 2, -TILE);
  // the card: warm white, lit from the wire below (brighter at its foot) and from the haze behind (its top rim)
  const paper = mixLab('#fffdf8', env.mood.halo, 0.25);
  const g = c.createLinearGradient(0, 0, 0, TILE);
  g.addColorStop(0, mixLab(paper, PUPPET_NEAR_BLACK, 0.55 - 0.25 * glow));
  g.addColorStop(1, mixLab(paper, PUPPET_NEAR_BLACK, 0.25 - 0.2 * glow));
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(0, 0, TILE, TILE, TILE * 0.2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.75 * k);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(TILE * 0.18, 0.7);
  c.lineTo(TILE * 0.82, 0.7);
  c.stroke();
  glyph(c, kind, withAlpha(OS_COLORS.ink, 0.82));
  c.restore();
}

export default defineShot({
  id: 'ch01-s01',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
    tl.tween(cam, { ...CAMERA3_HOME, x: 652, z: 22 }, { at: 0, dur: T.duration, ease: ease.linear });
    tl.hold(0, T.duration);
    return {
      tl,
      cam,
      haze: T.beat('haze'),
      fuse: T.beat('fuse'),
      dock: T.beat('dock'),
      clack: T.beat('clack'),
      dur: T.duration,
    };
  },
  paint(f, s, scene) {
    const t = f.t;
    const { haze, fuse, dock, clack } = scene;
    f.camera(s.get(scene.cam));
    f.backlight({ sunX: 600, intensity: 0.25 });
    // the haze lifts (0 → 1 from the 'haze' beat), the fuse runs, the clack steps the halo up once
    const lift = smooth((t - haze) / 2.2);
    const run = clamp01((t - fuse) / (dock - fuse));
    const drawU = 1 - Math.pow(1 - run, 1.35) * (1 - run * 0.15);
    const tipX = X0 + (X_END - X0) * clamp01(drawU);
    const clackK = t >= clack ? Math.exp(-(t - clack) * 3.2) : 0;
    const settle = t >= clack ? 0.18 * smooth((t - clack) / 0.5) : 0;
    const glow = run > 0 ? 0.45 + 0.1 * smooth((t - dock) / 0.6) + 0.5 * clackK + settle : 0;

    // L1: the void. Near-black warm card over the low parchment backlight; 25 % of the backlight lets through as
    // the haze lifts, gathered into a warm band at the horizon and a warm floor.
    f.layer('L1', (c, env) => {
      const dark = mixLab(env.mood.ink, '#000000', 0.45);
      c.fillStyle = withAlpha(dark, 1 - 0.06 * lift);
      c.fillRect(-200, -200, 1680, 1120);
      if (lift > 0) {
        const band = f.cached(`ch01-s01/haze/${env.mood.id}`, 1800, 420, (cc) => {
          // a drifting fbm haze bank: soft and wide, brightest just above the horizon
          for (let i = 0; i < 90; i++) {
            const x = (i / 90) * 1800;
            const h = 0.5 + 0.5 * fbm(i * 0.21, 31);
            const g = cc.createRadialGradient(x, 210, 0, x, 210, 150 + 70 * h);
            g.addColorStop(0, withAlpha(env.mood.halo, 0.035 * h));
            g.addColorStop(1, withAlpha(env.mood.halo, 0));
            cc.fillStyle = g;
            cc.fillRect(x - 230, 0, 460, 420);
          }
        });
        c.save();
        c.globalAlpha = lift;
        band(c, -260 - t * 6, LINE_Y - 230);
        // the warm floor
        const fl = c.createLinearGradient(0, 520, 0, 760);
        fl.addColorStop(0, withAlpha(env.mood.halo, 0));
        fl.addColorStop(1, withAlpha(mixLab(env.mood.halo, '#6b4a2c', 0.55), 0.13));
        c.fillStyle = fl;
        c.fillRect(-200, 520, 1680, 260);
        c.restore();
      }
    });

    // L3: the haze glowing faintly where the fuse has passed (additive, a soft band that cools behind the tip)
    f.layer('L3', (c, env) => {
      if (run <= 0) return;
      // a run of soft round glows along the passed wire, warmest just behind the tip (no hard edge anywhere)
      c.save();
      c.globalCompositeOperation = 'lighter';
      const x0 = -120;
      const warm = mixLab(env.mood.halo, OS_COLORS.copper, 0.35);
      for (let x = x0; x <= tipX; x += 36) {
        const near = clamp01(1 - (tipX - x) / 420);
        const a = 0.018 + 0.03 * near + 0.02 * glow;
        const r = 64 + 30 * near;
        const g = c.createRadialGradient(x, LINE_Y, 0, x, LINE_Y, r);
        g.addColorStop(0, withAlpha(warm, a));
        g.addColorStop(1, withAlpha(warm, 0));
        c.fillStyle = g;
        c.fillRect(x - r, LINE_Y - r, 2 * r, 2 * r);
      }
      c.restore();
    });

    // L4: the wire, its end ring, the bead, the dock tiles
    f.layer('L4', (c, env) => {
      if (run > 0) {
        drawLine(c, env, { x0: X0, x1: X_END, y: LINE_Y, sag: 0, posts: 'none', draw: drawU, glow: Math.min(1, glow) });
        // the copper body under the bright top edge: on the parchment mood the shared copper reads pale, so the
        // first image lays the real wire colour (the stylesheet's copper, lit) along its lower half
        const dev = Math.hypot(c.getTransform().a, c.getTransform().b) || 1;
        c.strokeStyle = mixLab('#b8642f', env.mood.core, 0.12 + 0.25 * Math.min(1, glow));
        c.lineWidth = 1.5 / dev;
        c.beginPath();
        c.moveTo(X0, LINE_Y + 0.7);
        c.lineTo(tipX, LINE_Y + 0.7);
        c.stroke();
        // the end ring (the desk wire's small ring), seated when the fuse reaches it
        const seat = smooth((t - dock + 0.1) / 0.3);
        if (seat > 0) {
          c.strokeStyle = withAlpha(mixLab(OS_COLORS.copper, env.mood.core, 0.35 + 0.3 * glow), seat);
          c.lineWidth = 2;
          c.beginPath();
          c.arc(X_END + 3.5, LINE_Y, 3.5, 0, Math.PI * 2);
          c.stroke();
        }
        // the bright bead at the tip (on ones; flickers like a fuse), fading into the ring at the stop
        const bead = run < 1 ? 1 : Math.exp(-(t - dock) * 4);
        if (bead > 0.01) {
          const fl = 1 + 0.12 * fbm(Math.floor(t * 24) * 0.37, 7);
          c.save();
          c.globalCompositeOperation = 'lighter';
          const r = 20 * fl;
          const g = c.createRadialGradient(tipX, LINE_Y, 0, tipX, LINE_Y, r);
          g.addColorStop(0, withAlpha(env.mood.core, 0.85 * bead));
          g.addColorStop(0.25, withAlpha(mixLab(env.mood.halo, OS_COLORS.copper, 0.3), 0.35 * bead));
          g.addColorStop(1, withAlpha(env.mood.halo, 0));
          c.fillStyle = g;
          c.fillRect(tipX - r, LINE_Y - r, 2 * r, 2 * r);
          c.fillStyle = withAlpha('#fff8ea', 0.95 * bead);
          c.beginPath();
          c.arc(tipX, LINE_Y, 2.3, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
      }
      // the three dock tiles fold up out of the dark, on twos, staggered left to right
      for (let i = 0; i < 3; i++) {
        const u = clamp01((env.tq - dock - i * 0.12) / 0.42);
        const fold = u <= 0 ? 0 : 1 - Math.pow(1 - u, 3) + 0.06 * Math.sin(u * Math.PI) * (1 - u);
        dockTile(c, env, DOCK_CX + (i - 1) * PITCH, Math.min(1, fold), i, Math.min(1, glow));
      }
    });
    f.rim({ x: 0, y: 1 });

    // the clack: the wire's halo steps up once and settles (screen-space glow on the wire's right half)
    if (clackK > 0.01 || settle > 0) {
      f.practical({ x: 660, y: LINE_Y, kind: 'led', seed: 5, intensity: 0.25 + 0.9 * clackK + settle, radius: 46, layer: 'L4' });
    }

    // L5: a few out-of-focus motes catching the haze in front of the wire
    f.layer('L5', (c, env) => {
      if (lift <= 0) return;
      dustMotes(c, { area: { x: -100, y: 200, w: 1480, h: 400 }, count: 14, size: 2.6, brightness: 0.22 * lift, drift: { x: 2.5, y: -1 }, salt: 11 }, env);
    });
  },
});
