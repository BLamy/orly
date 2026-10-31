/**
 * neural-net-history — THE DARK ROOM (shared set): the prologue's cold open (ch01-s01, ch01-s02) and the
 * return to the scene (ch12-s06, the same composition, 30 November 2022). serverCyan.
 *
 * A tall paned window at the back onto a deep-blue city of stacked windows (lit fraction is a parameter:
 * a few lit in ch01, a flood in ch12-s06); fog lying at desk height, drifting left; an anonymous person
 * (cast 'chat-user') in strict right-facing profile at a modern desk; a laptop whose screen is the only
 * practical light; a mug. No logos, no brand shapes, nothing readable on the screen.
 *
 *   darkRoom(f, { key, cams, resolve, cityLit, cursor, typing, glow, person?, door? })
 *     resolve 0..1  the room resolving out of black around the cursor (ch01-s01)
 *     cityLit 0..1  fraction of city windows lit (ch12-s06 floods it)
 *     cursor        draw the blinking text cursor (half-second rhythm) in the screen
 *     typing        the person's hands on the keys (typing loop on twos)
 *     glow 0..1     screen brightness;  door 0..1  the chat box swings open like a door (ch12-s06)
 *   DARK.screen     the screen rectangle (world, L4) — push-in target; DARK_CAMS.wide / .screen
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { CAMERA3_HOME, LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { skyline } from '../../../film/silhouette/architecture';
import { stars } from '../../../film/silhouette/nature';
import { chair } from '../../../film/silhouette/props';
import { POSES, loopPose, withLife } from '../../../film/silhouette/puppet';
import { cast } from '../cast';

export const DARK = {
  floorY: 650,
  /** desk top surface (L4) */
  deskY: 488,
  deskX0: 520,
  deskX1: 980,
  /** the window hole in the back wall (L2 world) */
  window: { x: 760, y: 70, w: 380, h: 470 },
  /** the person's seat (feet x) */
  personX: 430,
  /** the laptop screen (front-on paper-theatre cheat: we see its glow; the person sees its face) */
  screen: { x: 640, y: 352, w: 168, h: 112 },
  mugX: 860,
} as const;

export const DARK_CAMS = {
  wide: { ...CAMERA3_HOME } as Camera3,
  /** the almost imperceptible push of ch01-s01 (lens 1.00 → 1.04) */
  push: { ...CAMERA3_HOME, lens: 1.04 } as Camera3,
  /** the screen filling the frame (ch01-s02 / ch12-s06 push-in end) */
  screen: { x: DARK.screen.x + DARK.screen.w / 2, y: DARK.screen.y + DARK.screen.h / 2, z: 760, lens: 1 } as Camera3,
};

export interface DarkRoomOpts {
  key: string;
  cams: Camera3[];
  resolve?: number;
  cityLit?: number;
  cursor?: boolean;
  typing?: boolean;
  glow?: number;
  person?: boolean;
  door?: number;
  /** extra drawing on L4 after the room (the shot's own beat) */
  extra?: (c: CanvasRenderingContext2D, env: PaintEnv) => void;
}

type C = CanvasRenderingContext2D;
const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

export function darkRoom(f: Frame, o: DarkRoomOpts) {
  const R = o.resolve ?? 1;
  const glow = o.glow ?? 1;
  const W = DARK.window;
  f.backlight({ sunX: W.x + W.w / 2, sunY: 420, sunRadius: 520, intensity: 0.85 * R });
  // L1: the city through the window (lit fraction quantised so the bake changes in steps)
  const lit = Math.round((o.cityLit ?? 0.12) * 40) / 40;
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 60);
    bake(f, c, `${o.key}/dark/L1/${env.mood.id}/${lit}/${rk(r)}`, r, (cc) => {
      stars(cc, { x: r.x, y: r.y, w: r.w, h: 260, count: 70, seed: 26, twinkle: 0 }, env);
      skyline(cc, { style: 'megacity', x0: r.x, x1: r.x + r.w, y: 600, height: 380, seed: 2026, lit, ground: 500 }, env);
    });
  });
  // L2: the back wall with the tall paned window HOLE; mullions as rim hairlines
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    bake(f, c, `${o.key}/dark/L2/${env.mood.id}/${rk(r)}`, r, (cc) => {
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.35);
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(W.x, W.y, W.w, W.h);
      cc.fill('evenodd');
      cc.fillStyle = env.fill('ink');
      const bar = 6;
      for (let i = 1; i < 4; i++) cc.fillRect(W.x + (W.w * i) / 4 - bar / 2, W.y, bar, W.h);
      for (let j = 1; j < 5; j++) cc.fillRect(W.x, W.y + (W.h * j) / 5 - bar / 2, W.w, bar);
      cc.fillRect(W.x - 10, W.y - 10, W.w + 20, 10);
      cc.fillRect(W.x - 18, W.y + W.h, W.w + 36, 12);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.32);
      cc.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        cc.beginPath();
        cc.moveTo(W.x + (W.w * i) / 4 - bar / 2, W.y);
        cc.lineTo(W.x + (W.w * i) / 4 - bar / 2, W.y + W.h);
        cc.stroke();
      }
      // the floor line
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.6);
      cc.fillRect(r.x, 600, r.w, r.y + r.h - 600);
    });
  });
  // fog lying at desk height across the floor, drifting left
  f.fog({ yCenter: DARK.deskY + 30, height: 170, alpha: 0.26 * R, drift: -7 });
  f.layer('L4', (c, env) => {
    c.save();
    c.globalAlpha *= R;
    // the desk: a slim modern slab on two legs
    c.fillStyle = env.fill('ink');
    c.fillRect(DARK.deskX0, DARK.deskY, DARK.deskX1 - DARK.deskX0, 10);
    c.fillRect(DARK.deskX0 + 20, DARK.deskY + 10, 8, DARK.floorY - DARK.deskY - 10);
    c.fillRect(DARK.deskX1 - 28, DARK.deskY + 10, 8, DARK.floorY - DARK.deskY - 10);
    c.fillRect(DARK.deskX0 + 20, DARK.deskY + 120, DARK.deskX1 - DARK.deskX0 - 40, 5);
    c.fillStyle = withAlpha(env.mood.rim, 0.3);
    c.fillRect(DARK.deskX0, DARK.deskY, DARK.deskX1 - DARK.deskX0, 1);
    // the laptop, seen as a lit frame (no logo): base on the desk, lid with the screen
    const S = DARK.screen;
    c.fillStyle = env.fill('ink');
    c.fillRect(S.x - 14, S.y - 10, S.w + 28, S.h + 20);
    c.beginPath();
    c.moveTo(S.x - 30, DARK.deskY);
    c.lineTo(S.x + S.w + 30, DARK.deskY);
    c.lineTo(S.x + S.w + 14, S.y + S.h + 10);
    c.lineTo(S.x - 14, S.y + S.h + 10);
    c.closePath();
    c.fill();
    const door = Math.max(0, Math.min(1, o.door ?? 0));
    const C = MOODS.serverCyan;
    const g = c.createLinearGradient(S.x, S.y, S.x, S.y + S.h);
    g.addColorStop(0, withAlpha(mixLab(C.halo, C.core, 0.35), 0.9 * glow));
    g.addColorStop(1, withAlpha(mixLab(C.halo, C.set, 0.2), 0.95 * glow));
    if (door > 0) {
      // the box swings open like a door (hinged on its left edge): the opening shows warm light
      c.fillStyle = withAlpha(MOODS.candleAmber.core, 0.95);
      c.fillRect(S.x, S.y, S.w, S.h);
      const w = S.w * Math.cos(door * Math.PI * 0.45);
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(S.x, S.y);
      c.lineTo(S.x + w, S.y - door * 14);
      c.lineTo(S.x + w, S.y + S.h + door * 14);
      c.lineTo(S.x, S.y + S.h);
      c.closePath();
      c.fill();
    } else {
      c.fillStyle = g;
      c.fillRect(S.x, S.y, S.w, S.h);
    }
    // the cursor: a pinprick blinking on a steady half-second rhythm (on ones)
    if (o.cursor !== false) {
      const on = Math.floor(env.t * 2) % 2 === 0;
      if (on) {
        c.fillStyle = withAlpha(C.core, 1);
        c.fillRect(S.x + 22, S.y + S.h - 30, 4, 12);
      }
    }
    // the mug
    c.fillStyle = env.fill('ink');
    c.fillRect(DARK.mugX, DARK.deskY - 34, 26, 34);
    c.lineWidth = 5;
    c.strokeStyle = env.fill('ink');
    c.beginPath();
    c.arc(DARK.mugX + 30, DARK.deskY - 18, 9, -Math.PI / 2, Math.PI / 2);
    c.stroke();
    // the chair and the person (strict right-facing profile)
    if (o.person !== false) {
      chair(c, { x: DARK.personX - 30, y: DARK.floorY, s: 1, style: 'swivel', view: 'side' }, env);
      const base = o.typing ? loopPose('type', POSES.type, env.tq) : POSES.sit;
      const pose = withLife({ ...base, prev: base }, env.tq, 26);
      cast['chat-user'].draw(c, { x: DARK.personX, y: DARK.floorY, facing: 'right', pose }, env);
    }
    o.extra?.(c, env);
    c.restore();
  });
  f.rim({ x: 1, y: -0.2 });
  // the screen: the room's only practical — a soft spill (no hot core: a screen is a surface, not a bulb),
  // falling toward the person
  const S = DARK.screen;
  f.layer('L4', (c, env) => {
    const k = glow * R * (1 + 0.015 * Math.sin(env.t * 9));
    c.save();
    c.globalCompositeOperation = 'lighter';
    const cx = S.x + S.w * 0.35, cy = S.y + S.h * 0.55;
    const g = c.createRadialGradient(cx, cy, S.w * 0.3, cx, cy, 420);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.22 * k));
    g.addColorStop(0.4, withAlpha(env.mood.halo, 0.08 * k));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(cx - 420, cy - 420, 840, 840);
    c.restore();
  });
}
