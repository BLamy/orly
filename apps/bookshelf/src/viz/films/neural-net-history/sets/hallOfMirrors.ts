/**
 * neural-net-history — THE HALL OF MIRRORS, Versailles (shared set: ch05-s01, summer 1981; ch15-s01, the
 * medallion's rim match-cuts into it and the mirrored figures turn at last toward the physicist). dawnGold.
 *
 * A long multiplane gallery: L1 tall arched windows burning with low sun; L2 the mirrored arcade opposite
 * (every mirror a slightly warped cut-out panel that repeats the room, in which the audience multiplies);
 * L3 the lectern and easel at mid-floor (the shot draws the speaker and his easel); L4 rows of seated
 * paper-cut silhouettes with their backs to us; L5 two chandeliers as black filigree, swinging very slightly.
 *
 *   hallOfMirrors(f, { key, cams, turn, fade, sway, lecternX, … , mid?, action? })
 *     turn 0..1      the reflected heads turning TOWARD the lectern, one by one in a seeded order
 *                    (0 = every reflected head turned away: toward the windows, the chandeliers, each other)
 *     holdout        one mirrored figure at the rim stays turned away (ch15-s01)
 *     fade 0..1      the reflections fading mirror by mirror from the far end (ch05-s01)
 *   HALL.arch(i)     the i-th mirror arch (for the medallion-rim match cut): { cx, spring, w, top }
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';

export const HALL = {
  floorY: 660,
  /** mirror arches on L2: centres every `pitch` from x0 */
  x0: -400,
  pitch: 230,
  count: 12,
  archW: 150,
  spring: 250,
  sill: 560,
  /** the lectern (L3 world x) */
  lecternX: 520,
  arch(i: number) {
    const cx = this.x0 + i * this.pitch;
    return { cx, spring: this.spring, w: this.archW, top: this.spring - this.archW / 2 };
  },
};

export interface HallOpts {
  key: string;
  cams: Camera3[];
  turn?: number;
  holdout?: boolean;
  fade?: number;
  /** chandelier sway phase (pass env.t-driven or leave default) */
  sway?: number;
  /** extra drawing on L3 (the lectern, the easel, the speaker) */
  mid?: (c: CanvasRenderingContext2D, env: PaintEnv) => void;
  /** extra drawing on L4 after the audience */
  action?: (c: CanvasRenderingContext2D, env: PaintEnv) => void;
  /** number of audience rows on L4 (default 2) */
  rows?: number;
}

type C = CanvasRenderingContext2D;
const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

function archPath(p: Path2D, cx: number, w: number, spring: number, sill: number) {
  p.moveTo(cx - w / 2, sill);
  p.lineTo(cx - w / 2, spring);
  p.arc(cx, spring, w / 2, Math.PI, 0);
  p.lineTo(cx + w / 2, sill);
  p.closePath();
}

/**
 * A seated bust: shoulders, neck, head. facing +1 right / -1 left = a profile (brow, nose, chin, hair at
 * the back); 0 = the back of the head (to us). `lit` (0..1) catches the light on the face edge: a head
 * turned toward the lit lectern shows it.
 */
function bust(c: C, x: number, y: number, s: number, facing: number, ink: string, lit = 0, light = '#fff') {
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(x - 22 * s, y);
  c.quadraticCurveTo(x - 22 * s, y - 34 * s, x - 10 * s, y - 40 * s);
  c.lineTo(x + 10 * s, y - 40 * s);
  c.quadraticCurveTo(x + 22 * s, y - 34 * s, x + 22 * s, y);
  c.closePath();
  c.fill();
  c.fillRect(x - 4.5 * s, y - 50 * s, 9 * s, 12 * s);
  const F = facing;
  c.beginPath();
  if (F === 0) {
    c.ellipse(x, y - 60 * s, 10 * s, 12 * s, 0, 0, Math.PI * 2);
  } else {
    // profile: back of the skull, crown, brow, nose, lips, chin, jaw
    const p = (dx: number, dy: number) => [x + F * dx * s, y + dy * s] as const;
    c.moveTo(...p(-9, -54));
    c.quadraticCurveTo(...p(-12, -66), ...p(-4, -72));
    c.quadraticCurveTo(...p(6, -74), ...p(9, -66));
    c.lineTo(...p(10, -62));
    c.lineTo(...p(14, -57));
    c.lineTo(...p(10, -55));
    c.lineTo(...p(11, -52));
    c.quadraticCurveTo(...p(9, -47), ...p(3, -48));
    c.lineTo(...p(-4, -48));
    c.closePath();
  }
  c.fill();
  if (F !== 0 && lit > 0) {
    c.strokeStyle = withAlpha(light, 0.75 * lit);
    c.lineWidth = Math.max(0.8, 1.4 * s);
    c.beginPath();
    c.moveTo(x + F * 9 * s, y - 66 * s);
    c.lineTo(x + F * 10 * s, y - 62 * s);
    c.lineTo(x + F * 14 * s, y - 57 * s);
    c.lineTo(x + F * 10 * s, y - 55 * s);
    c.lineTo(x + F * 11 * s, y - 52 * s);
    c.stroke();
  }
}

export function hallOfMirrors(f: Frame, o: HallOpts) {
  const turn = Math.max(0, Math.min(1, o.turn ?? 0));
  const fade = Math.max(0, Math.min(1, o.fade ?? 0));
  f.backlight({ sunX: 900, sunY: 360, sunRadius: 700, intensity: 1.1 });

  // L1: the tall arched windows (the low sun), seen as bright arches in a dark wall at the far side
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 60);
    bake(f, c, `${o.key}/hall/L1/${env.mood.id}/${rk(r)}`, r, (cc) => {
      cc.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.2);
      const p = new Path2D();
      p.rect(r.x, r.y, r.w, r.h);
      for (let x = Math.floor(r.x / 180) * 180; x < r.x + r.w; x += 180) archPath(p, x + 90, 96, 210, 600);
      cc.fill(p, 'evenodd');
    });
  });

  // L2: the mirrored arcade. Each mirror shows the room again: a hazed copy of the windows and the
  // reflected audience (heads turned by `turn`). Static frame + arches baked; reflections per frame.
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    const glass = new Path2D();
    for (let i = 0; i < HALL.count; i++) {
      const a = HALL.arch(i);
      archPath(glass, a.cx, a.w, a.spring, HALL.sill);
    }
    // mirror glass: a warm, slightly darker copy of the backlight
    c.save();
    c.clip(glass);
    const g = c.createLinearGradient(0, 100, 0, HALL.sill);
    g.addColorStop(0, mixLab(env.mood.sky[1], env.mood.set, 0.25));
    g.addColorStop(0.7, mixLab(env.mood.sky[3], env.mood.set, 0.2));
    g.addColorStop(1, mixLab(env.mood.sky[2], env.mood.set, 0.3));
    c.fillStyle = g;
    c.fillRect(r.x, 0, r.w, HALL.sill + 10);
    // reflected windows (the room repeating), warped slightly
    c.fillStyle = withAlpha(env.mood.halo, 0.25);
    for (let i = 0; i < HALL.count; i++) {
      const a = HALL.arch(i);
      const p = new Path2D();
      archPath(p, a.cx + 18 * Math.sin(i * 1.7), a.w * 0.36, a.spring + 40, HALL.sill - 120);
      c.fill(p);
    }
    // reflected audience: several rows of small busts per mirror, heads turned by `turn`
    const ink = mixLab(env.fill('ink'), env.mood.haze, 0.35);
    for (let i = 0; i < HALL.count; i++) {
      const a = HALL.arch(i);
      // fade from the far end (the right): mirror i disappears when fade passes its threshold
      const thr = 1 - i / HALL.count;
      const vis = fade > 0 ? Math.max(0, Math.min(1, (thr - fade) * HALL.count + 1)) : 1;
      if (vis <= 0) continue;
      c.save();
      c.globalAlpha *= vis;
      for (let row = 2; row >= 0; row--) {
        const n = 3 + row;
        for (let k = 0; k < n; k++) {
          const id = i * 100 + row * 10 + k;
          const x = a.cx - a.w / 2 + 14 + ((k + 0.5) * (a.w - 28)) / n + hash1(id, 5) * 3;
          const y = HALL.sill - 6 - row * 30;
          const s = 0.66 - row * 0.1;
          // away: toward the windows / each other (seeded); toward: the lectern
          const toward = a.cx < HALL.lecternX ? 1 : -1;
          const away = hash1(id, 9) > 0 ? -toward : 0;
          const order = hash1(id, 13) * 0.5 + 0.5;
          const isHoldout = o.holdout && i === HALL.count - 3 && row === 0 && k === 0;
          const turned = !isHoldout && turn > order;
          const facing = turned ? toward : away;
          bust(c, x, y, s, facing, ink, turned ? 1 : 0, env.mood.core);
        }
      }
      c.restore();
    }
    c.restore();
    // the arcade itself: piers, gilded frames, a cornice (baked)
    bake(f, c, `${o.key}/hall/L2frame/${env.mood.id}/${rk(r)}`, r, (cc) => {
      const wall = new Path2D();
      wall.rect(r.x, r.y, r.w, r.h);
      for (let i = 0; i < HALL.count; i++) {
        const a = HALL.arch(i);
        archPath(wall, a.cx, a.w, a.spring, HALL.sill);
      }
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.2);
      cc.fill(wall, 'evenodd');
      cc.strokeStyle = withAlpha(env.mood.rim, 0.22);
      cc.lineWidth = 2;
      for (let i = 0; i < HALL.count; i++) {
        const a = HALL.arch(i);
        const p = new Path2D();
        archPath(p, a.cx, a.w + 10, a.spring, HALL.sill + 4);
        cc.stroke(p);
        // mirror mullions (the panels of Versailles' mirrors)
        cc.strokeStyle = withAlpha(env.mood.fg, 0.55);
        cc.lineWidth = 2;
        for (let j = 1; j < 4; j++) {
          cc.beginPath();
          cc.moveTo(a.cx - a.w / 2, a.spring + ((HALL.sill - a.spring) * j) / 4);
          cc.lineTo(a.cx + a.w / 2, a.spring + ((HALL.sill - a.spring) * j) / 4);
          cc.stroke();
        }
        cc.beginPath();
        cc.moveTo(a.cx, a.top);
        cc.lineTo(a.cx, HALL.sill);
        cc.stroke();
        cc.strokeStyle = withAlpha(env.mood.rim, 0.22);
      }
      cc.fillStyle = env.fill('ink');
      cc.fillRect(r.x, HALL.sill, r.w, 18);
      cc.fillRect(r.x, 60, r.w, 22);
    });
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    // the parquet floor plane (lit sheen) and whatever the shot puts at mid-floor (lectern, easel, speaker)
    c.fillStyle = mixLab(env.fill('set'), env.mood.halo, 0.12);
    c.fillRect(-2000, HALL.floorY - 40, 6000, 600);
    o.mid?.(c, env);
  });
  f.fog('B');
  // L4: rows of seated silhouettes with their backs to us (heads only above the chair backs)
  f.layer('L4', (c, env) => {
    const ink = env.fill('ink');
    const rows = o.rows ?? 2;
    for (let row = 0; row < rows; row++) {
      for (let k = -8; k < 14; k++) {
        const id = row * 100 + k + 50;
        const x = k * 92 + (row % 2) * 46 + hash1(id, 3) * 8;
        const y = 760 + row * 40;
        bust(c, x, y, 1.15 + row * 0.12, 0, ink);
        // chair back cresting rail
        c.fillRect(x - 26, y - 34, 52, 6);
      }
    }
    o.action?.(c, env);
  });
  f.rim({ x: 0.3, y: -1 });
  // L5: two chandeliers as black filigree, swinging very slightly (on ones)
  f.layer('L5', (c, env) => {
    const sw = o.sway ?? Math.sin(env.t * 0.9) * 0.025;
    for (const [cx, seed] of [[180, 1], [1120, 2]] as const) {
      c.save();
      c.translate(cx, -40);
      c.rotate(sw * (seed === 1 ? 1 : -0.8));
      c.fillStyle = env.fill('fg');
      c.fillRect(-2, 0, 4, 120);
      c.beginPath();
      c.ellipse(0, 150, 70, 26, 0, 0, Math.PI * 2);
      c.ellipse(0, 150, 54, 16, 0, 0, Math.PI * 2);
      c.fill('evenodd');
      for (let j = -3; j <= 3; j++) {
        c.beginPath();
        c.moveTo(j * 22, 150);
        c.quadraticCurveTo(j * 30, 190, j * 16, 205);
        c.lineWidth = 4;
        c.strokeStyle = env.fill('fg');
        c.stroke();
        c.fillRect(j * 16 - 3, 120, 6, 30);
        c.beginPath();
        c.arc(j * 16, 205, 4, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
  });
}
