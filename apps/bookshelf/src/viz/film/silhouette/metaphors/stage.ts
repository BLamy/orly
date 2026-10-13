/**
 * metaphorBackdrop(c, mood, {pxScale, t?, sunX?, room?, floor?}) — a self-contained
 * backlit room (sky ramp, low sun, an arched window wall with holes, fog sheets,
 * a dark floor) for galleries and for shots that stage a machine without the
 * full architecture kit. Static art is cached per mood; only fog drift moves.
 * Real shots should prefer Frame.backlight / fog and the architecture kit.
 */
import type { MoodId, Palette } from '../../contracts';
import { mood as moodOf, mixLab, withAlpha } from '../palette';
import { cachedArt } from './kit';

const W = 1280;
const H = 720;

function arch(p: Path2D, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  p.moveTo(x, y + h);
  p.lineTo(x, y + r);
  // pointed (gothic) arch
  p.quadraticCurveTo(x, y + r * 0.15, x + r, y - r * 0.25);
  p.quadraticCurveTo(x + w, y + r * 0.15, x + w, y + r);
  p.lineTo(x + w, y + h);
  p.closePath();
}

function drawRoom(g: CanvasRenderingContext2D, m: Palette, room: boolean, floor: boolean) {
  const hz = m.horizon;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, m.sky[0]);
  sky.addColorStop(0.3, m.sky[1]);
  sky.addColorStop(0.5, m.sky[2]);
  sky.addColorStop(hz, m.sky[3]);
  sky.addColorStop(1, m.sky[2]);
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  const sun = g.createRadialGradient(W * 0.5, H * hz, 0, W * 0.5, H * hz, W * 0.55);
  sun.addColorStop(0, withAlpha(m.rim, 0.35));
  sun.addColorStop(1, withAlpha(m.rim, 0));
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);
  if (room) {
    // the far wall: tall gothic windows are holes (evenodd); mullions, transom and
    // tracery are the wall left standing between them (style bible §2.3)
    const wall = new Path2D();
    wall.rect(-10, -10, W + 20, H * 0.82);
    const bays = [190, 450, 830, 1090];
    const ww = 176;
    const spring = 205; // where the arch springs
    const bottom = H * 0.765;
    for (const cxw of bays) {
      const wx = cxw - ww / 2;
      const cols = 4;
      const gap = 3;
      const pw = (ww - gap * (cols - 1)) / cols;
      const rows = 7;
      const rh = (bottom - spring - 10) / rows;
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) wall.rect(wx + i * (pw + gap), spring + 10 + j * rh + 1.5, pw, rh - 3);
      // arch head: one pointed hole, a wall ring with a quatrefoil pierced through it
      const ay = spring + 6 - ww / 2;
      arch(wall, wx, ay, ww, ww / 2);
      const rr = ww * 0.19;
      const rc = { x: cxw, y: ay + ww * 0.21 };
      wall.moveTo(rc.x + rr, rc.y);
      wall.arc(rc.x, rc.y, rr, 0, Math.PI * 2);
      for (let k = 0; k < 4; k++) {
        const an = (k * Math.PI) / 2;
        const lx = rc.x + Math.cos(an) * rr * 0.42;
        const ly = rc.y + Math.sin(an) * rr * 0.42;
        wall.moveTo(lx + rr * 0.36, ly);
        wall.arc(lx, ly, rr * 0.36, 0, Math.PI * 2);
      }
      // the centre mullion and the two lancets under the rose stay wall
      wall.rect(cxw - 2.5, rc.y + rr, 5, spring + 6 - rc.y - rr);
      // trefoil piercing high on the wall above each bay
      for (let k = 0; k < 3; k++) {
        const an = -Math.PI / 2 + (k * Math.PI * 2) / 3;
        const tx = cxw + Math.cos(an) * 7;
        const ty = 52 + Math.sin(an) * 7;
        wall.moveTo(tx + 6, ty);
        wall.arc(tx, ty, 6, 0, Math.PI * 2);
      }
    }
    // wall darker up high, lifting toward the haze band
    const wg = g.createLinearGradient(0, 0, 0, H * 0.82);
    wg.addColorStop(0, mixLab(m.set, m.ink, 0.25));
    wg.addColorStop(0.55, mixLab(m.set, m.haze, 0.12));
    wg.addColorStop(1, mixLab(m.set, m.haze, 0.3));
    g.fillStyle = wg;
    g.fill(wall, 'evenodd');
    // pilasters and panel cut-lines
    g.strokeStyle = withAlpha(m.rim, 0.1);
    g.lineWidth = 1;
    for (const px of bays.flatMap((b) => [b - ww / 2 - 18, b + ww / 2 + 18])) {
      g.beginPath();
      g.moveTo(px, 76);
      g.lineTo(px, H * 0.8);
      g.stroke();
    }
    g.strokeRect(575, 150, 130, 190);
    g.strokeRect(583, 158, 114, 174);
    g.strokeRect(585, 370, 110, 160);
    // dado rail and cornice
    g.fillStyle = mixLab(m.set, m.ink, 0.35);
    g.fillRect(0, 22, W, 12);
    g.fillRect(0, 34, W, 3);
    g.fillRect(0, H * 0.785, W, 6);
  }
  // fog A
  const fog = g.createLinearGradient(0, H * 0.4, 0, H * 0.8);
  fog.addColorStop(0, withAlpha(m.haze, 0));
  fog.addColorStop(0.55, withAlpha(m.haze, 0.32));
  fog.addColorStop(1, withAlpha(m.haze, 0.12));
  g.fillStyle = fog;
  g.fillRect(0, H * 0.4, W, H * 0.4);
  if (floor) {
    const fl = g.createLinearGradient(0, H * 0.8, 0, H);
    fl.addColorStop(0, mixLab(m.set, m.ink, 0.55));
    fl.addColorStop(1, m.fg);
    g.fillStyle = fl;
    g.fillRect(0, H * 0.8, W, H * 0.2);
    // checker floor in perspective, faint
    g.save();
    g.beginPath();
    g.rect(0, H * 0.8, W, H * 0.2);
    g.clip();
    g.fillStyle = withAlpha(m.haze, 0.13);
    const vy = H * 0.45;
    for (let i = -14; i < 14; i++) {
      for (let j = 0; j < 6; j++) {
        if ((i + j) % 2) continue;
        const y0 = H * 0.8 + Math.pow(j / 6, 1.6) * H * 0.2;
        const y1 = H * 0.8 + Math.pow((j + 1) / 6, 1.6) * H * 0.2;
        const xa = (y: number, k: number) => W / 2 + (k * 90) * ((y - vy) / (H * 0.35));
        g.beginPath();
        g.moveTo(xa(y0, i), y0);
        g.lineTo(xa(y0, i + 1), y0);
        g.lineTo(xa(y1, i + 1), y1);
        g.lineTo(xa(y1, i), y1);
        g.closePath();
        g.fill();
      }
    }
    g.restore();
    // windows reflected in the polished floor
    if (room)
      for (const bx of [190, 450, 830, 1090]) {
        const rg = g.createLinearGradient(0, H * 0.8, 0, H);
        rg.addColorStop(0, withAlpha(m.sky[3], 0.16));
        rg.addColorStop(1, withAlpha(m.sky[3], 0));
        g.fillStyle = rg;
        g.beginPath();
        g.moveTo(bx - 88, H * 0.8);
        g.lineTo(bx + 88, H * 0.8);
        g.lineTo(bx + 88 + (bx - W / 2) * 0.35, H);
        g.lineTo(bx - 88 + (bx - W / 2) * 0.35, H);
        g.closePath();
        g.fill();
      }
  }
  if (room) {
    // framing pillars (the darkest layer, fg) at both edges
    g.fillStyle = m.fg;
    for (const [x0, dir] of [[0, 1], [W, -1]] as const) {
      g.beginPath();
      g.moveTo(x0, 0);
      g.lineTo(x0 + dir * 30, 0);
      g.lineTo(x0 + dir * 30, 60);
      g.lineTo(x0 + dir * 40, 66);
      g.lineTo(x0 + dir * 40, 74);
      g.lineTo(x0 + dir * 32, 78);
      g.lineTo(x0 + dir * 32, H - 70);
      g.lineTo(x0 + dir * 44, H - 60);
      g.lineTo(x0 + dir * 44, H);
      g.lineTo(x0, H);
      g.closePath();
      g.fill();
      g.strokeStyle = withAlpha(m.rim, 0.18);
      g.beginPath();
      g.moveTo(x0 + dir * 24, 84);
      g.lineTo(x0 + dir * 24, H - 76);
      g.stroke();
    }
  }
  // vignette (corners fall away; keeps the eye on the machine)
  const vg = g.createRadialGradient(W / 2, H * 0.52, H * 0.35, W / 2, H * 0.52, W * 0.75);
  vg.addColorStop(0, withAlpha(m.fg, 0));
  vg.addColorStop(1, withAlpha(m.fg, 0.45));
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);
}

export interface BackdropOpts {
  pxScale: number;
  t?: number;
  room?: boolean;
  floor?: boolean;
  /** fog drift strength (default 1) */
  fog?: number;
}
export function metaphorBackdrop(c: CanvasRenderingContext2D, mood: MoodId | Palette, o: BackdropOpts): void {
  const m = moodOf(mood);
  const room = o.room !== false;
  const floor = o.floor !== false;
  cachedArt(c, `backdrop:${m.id}:${room}:${floor}`, 0, 0, W, H, o.pxScale, (g) => drawRoom(g, m, room, floor));
  // drifting fog B (the only ambient motion)
  const t = o.t ?? 0;
  const fa = o.fog ?? 1;
  if (fa > 0) {
    for (let i = 0; i < 3; i++) {
      const x = ((t * (6 + i * 3) + i * 420) % (W + 600)) - 300;
      const y = H * (0.66 + i * 0.05);
      const g = c.createRadialGradient(x, y, 0, x, y, 420);
      g.addColorStop(0, withAlpha(m.haze, 0.1 * fa));
      g.addColorStop(1, withAlpha(m.haze, 0));
      c.save();
      c.translate(x, y);
      c.scale(1, 0.22);
      c.translate(-x, -y);
      c.fillStyle = g;
      c.fillRect(x - 420, y - 420, 840, 840);
      c.restore();
    }
  }
}
