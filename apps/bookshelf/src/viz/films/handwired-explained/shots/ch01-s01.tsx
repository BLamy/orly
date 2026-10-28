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
 * the wire's halo steps up once and settles. Camera: a near-still dolly (z 0 → 34) so the motes, the haze and the
 * wire slide a hair against each other, with a faint far floor edge (L2) behind and a dark blurred bench edge (L5)
 * in the lower-right corner in front, so three planes part.
 * Review r1: far plane + near occluder; tiles cut card (warm top rim, cast shadow, grain; TILE stays 44 to match
 * ch01-s02's opening scale); the dolly is z 0 → 34 (the depth audit now sees it move; ch01-s02's START
 * re-solved to match); the clack's practical steps up harder and wider (0.35 + 1.3·k, radius 70).
 */
import { Timeline, ease } from '../../../core';
import { CAMERA3_HOME, cam3Interp, defineShot, dustMotes, fbm, hash1, mixLab, withAlpha, PUPPET_NEAR_BLACK } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { drawLine } from '../sets/tagLine';
import { OS_COLORS } from '../sets/circuit';
import { dockGlyph } from '../sets/ch01-s01-dock';

/** the copper thread (L4): from beyond frame left to the wire's end ring just past centre */
const LINE_Y = 418;
/** the end of the near-still dolly (ch01-s02 opens on the desk dock exactly where this camera leaves the tiles) */
const S01_END = { x: 652, y: 360, z: 34, lens: 1 };
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

/** the paper grain on a tile: a few hundred faint fibres and flecks, seeded (baked once per mood) */
function grain(c: CanvasRenderingContext2D, dark: string, light: string) {
  for (let i = 0; i < 160; i++) {
    const x = (0.5 + 0.5 * hash1(i, 41)) * TILE;
    const y = (0.5 + 0.5 * hash1(i, 43)) * TILE;
    const r = 0.35 + 0.35 * (0.5 + 0.5 * hash1(i, 47));
    c.fillStyle = withAlpha(i % 3 === 0 ? light : dark, 0.05 + 0.05 * (0.5 + 0.5 * hash1(i, 53)));
    c.fillRect(x, y, r * (i % 5 === 0 ? 3.2 : 1), r);
  }
}

/** one dock tile folding up about its bottom edge (fold 0 = flat, out of sight; 1 = upright): cut card, a warm rim
 *  along its top edge, a soft cast shadow on the haze behind, a faint paper grain */
function dockTile(c: CanvasRenderingContext2D, env: PaintEnv, grainAt: (c: CanvasRenderingContext2D, x: number, y: number) => void, cx: number, fold: number, kind: number, glow: number) {
  if (fold <= 0.01) return;
  const k = Math.sin((fold * Math.PI) / 2);
  const dev = Math.hypot(c.getTransform().a, c.getTransform().b) || 1;
  // the cast shadow: the wire below throws the card's shadow up and back onto the haze (it grows as the card stands)
  c.save();
  c.translate(cx, TILE_BOTTOM);
  c.scale(1, k);
  c.translate(-TILE / 2, -TILE);
  c.shadowColor = withAlpha('#000000', 0.55 * k);
  c.shadowBlur = 6 * dev;
  c.shadowOffsetX = 2 * dev;
  c.shadowOffsetY = -5 * dev * k;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5);
  c.beginPath();
  c.roundRect(1, 1, TILE - 2, TILE - 2, TILE * 0.2);
  c.fill();
  c.restore();

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
  c.save();
  c.clip();
  grainAt(c, 0, 0);
  c.restore();
  // the warm rim: the card's cut top edge catches the haze light (1.8 px, following the rounded corners)
  c.strokeStyle = withAlpha(mixLab(mixLab(env.mood.rim, OS_COLORS.copper, 0.3), '#fff1d8', 0.35), 0.9 * k);
  c.lineWidth = 1.8;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(TILE * 0.2, TILE * 0.2, TILE * 0.2, Math.PI * 1.15, Math.PI * 1.5);
  c.lineTo(TILE * 0.8, 0);
  c.arc(TILE * 0.8, TILE * 0.2, TILE * 0.2, Math.PI * 1.5, Math.PI * 1.85);
  c.stroke();
  dockGlyph(c, kind, TILE, withAlpha(OS_COLORS.ink, 0.82), 2.2);
  c.restore();
}

export default defineShot({
  id: 'ch01-s01',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
    // a near-still dolly, just enough to part the planes (ch01-s02's START is solved for this end camera)
    tl.tween(cam, S01_END, { at: 0, dur: T.duration, ease: ease.linear });
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

    // L2: the far plane. A very faint floor edge in the haze (the bench top far behind the wire, value at most
    // ink + 6 %), so the near-still dolly slides it against the wire and the motes.
    f.layer('L2', (c, env) => {
      if (lift <= 0) return;
      const far = f.cached(`ch01-s01/far/${env.mood.id}`, 1900, 300, (cc) => {
        const ink = mixLab(env.mood.ink, '#000000', 0.45);
        const edge = mixLab(ink, env.mood.halo, 0.06);
        const floor = mixLab(ink, env.mood.halo, 0.04);
        // the floor plane below the edge, fading toward the frame bottom
        const g = cc.createLinearGradient(0, 40, 0, 300);
        g.addColorStop(0, withAlpha(floor, 0.95));
        g.addColorStop(1, withAlpha(floor, 0));
        cc.fillStyle = g;
        cc.fillRect(0, 40, 1900, 260);
        // the edge itself: a soft lit lip, brightest in the middle where the haze gathers
        const e = cc.createLinearGradient(0, 0, 1900, 0);
        e.addColorStop(0, withAlpha(edge, 0));
        e.addColorStop(0.3, withAlpha(edge, 0.9));
        e.addColorStop(0.7, withAlpha(edge, 0.9));
        e.addColorStop(1, withAlpha(edge, 0));
        cc.fillStyle = e;
        cc.fillRect(0, 38, 1900, 3);
      });
      c.save();
      c.globalAlpha = lift;
      far(c, -310, 485 - 40);
      c.restore();
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
      const grainAt = f.cached(`ch01-s01/grain/${env.mood.id}`, TILE, TILE, (cc) => grain(cc, PUPPET_NEAR_BLACK, '#fff6e6'), { blur: 0 });
      for (let i = 0; i < 3; i++) {
        const u = clamp01((env.tq - dock - i * 0.12) / 0.42);
        const fold = u <= 0 ? 0 : 1 - Math.pow(1 - u, 3) + 0.06 * Math.sin(u * Math.PI) * (1 - u);
        dockTile(c, env, grainAt, DOCK_CX + (i - 1) * PITCH, Math.min(1, fold), i, Math.min(1, glow));
      }
    });
    f.rim({ x: 0, y: 1 });

    // the clack: the wire's halo steps up once and settles (screen-space glow on the wire's right half)
    if (clackK > 0.01 || settle > 0) {
      f.practical({ x: 660, y: LINE_Y, kind: 'led', seed: 5, intensity: 0.35 + 1.3 * clackK + settle, radius: 70, layer: 'L4' });
    }

    // L5: a few out-of-focus motes catching the haze in front of the wire
    f.layer('L5', (c, env) => {
      // a dark out-of-focus bench edge in the lower-right corner (the nearest plane; the dolly slides it fastest)
      const bench = f.cached(`ch01-s01/bench/${env.mood.id}`, 300, 200, (cc) => {
        cc.fillStyle = PUPPET_NEAR_BLACK;
        cc.beginPath();
        cc.moveTo(40, 64);
        cc.lineTo(300, 40);
        cc.lineTo(300, 200);
        cc.lineTo(0, 200);
        cc.lineTo(0, 92);
        cc.quadraticCurveTo(4, 70, 40, 64);
        cc.fill();
        // its top edge catches the wire's warm light
        cc.strokeStyle = withAlpha(mixLab(env.mood.halo, OS_COLORS.copper, 0.4), 0.35);
        cc.lineWidth = 2;
        cc.beginPath();
        cc.moveTo(14, 70);
        cc.lineTo(40, 64);
        cc.lineTo(300, 40);
        cc.stroke();
      }, { blur: 9 });
      bench(c, 1112, 560);
      if (lift <= 0) return;
      dustMotes(c, { area: { x: -100, y: 200, w: 1480, h: 400 }, count: 14, size: 2.6, brightness: 0.22 * lift, drift: { x: 2.5, y: -1 }, salt: 11 }, env);
    });
  },
});
