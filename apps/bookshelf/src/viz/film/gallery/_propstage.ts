/**
 * Shared backdrop for the props / machines galleries: a backlit room band
 * (window bays with the mood's sky ramp, a haze band at table height, a shelf
 * or floor line). Not a kit piece — gallery scaffolding only.
 */
import type { MoodId, PaintEnv } from '../contracts';
import { makeEnv, mood as getMood, withAlpha, mixLab } from '../silhouette/palette';

export function stageEnv(m: MoodId, t: number, layer: 'L2' | 'L3' | 'L4' = 'L4', seed = 1): PaintEnv {
  return makeEnv({ mood: m, layer, t, seed, pxScale: 1.5 });
}

/** paint a backlit band [y0,y1] with arched window bays; returns nothing. */
export function backdrop(c: CanvasRenderingContext2D, m: MoodId, y0: number, y1: number, o: { bays?: number; floorY?: number; label?: string } = {}) {
  const p = getMood(m);
  const H = y1 - y0;
  c.save();
  c.beginPath();
  c.rect(0, y0, 1280, H);
  c.clip();
  // wall
  c.fillStyle = p.set;
  c.fillRect(0, y0, 1280, H);
  // window bays (sky ramp, horizon brightest)
  const bays = o.bays ?? 5;
  const bw = 1280 / bays;
  const sky = c.createLinearGradient(0, y0, 0, y1);
  sky.addColorStop(0, p.sky[0]);
  sky.addColorStop(0.35, p.sky[1]);
  sky.addColorStop(p.horizon, p.sky[3]);
  sky.addColorStop(1, p.sky[2]);
  for (let i = 0; i < bays; i++) {
    const x = i * bw + bw * 0.12;
    const w = bw * 0.76;
    c.fillStyle = sky;
    c.beginPath();
    c.moveTo(x, y1);
    c.lineTo(x, y0 + H * 0.2 + w / 2);
    c.arc(x + w / 2, y0 + H * 0.2 + w / 2, w / 2, Math.PI, 0);
    c.lineTo(x + w, y1);
    c.closePath();
    c.fill();
    // mullions (hazed set)
    c.fillStyle = mixLab(p.set, p.haze, 0.35);
    for (let k = 1; k < 3; k++) c.fillRect(x + (w * k) / 3 - 2, y0 + H * 0.2, 4, H);
    for (let yy = y0 + H * 0.2 + w / 2 + 40; yy < y1; yy += 58) c.fillRect(x, yy, w, 3);
  }
  // haze band at table height
  const hz = c.createLinearGradient(0, y0 + H * 0.45, 0, y1);
  hz.addColorStop(0, withAlpha(p.haze, 0));
  hz.addColorStop(0.6, withAlpha(p.haze, 0.42));
  hz.addColorStop(1, withAlpha(p.haze, 0.2));
  c.fillStyle = hz;
  c.fillRect(0, y0, 1280, H);
  c.restore();
  if (o.floorY !== undefined) {
    c.fillStyle = p.fg;
    c.fillRect(0, o.floorY, 1280, y1 - o.floorY);
    c.fillStyle = withAlpha(p.rim, 0.25);
    c.fillRect(0, o.floorY, 1280, 0.8);
  }
  if (o.label) {
    c.fillStyle = withAlpha(p.core, 0.85);
    c.font = '600 13px Georgia';
    c.fillText(o.label, 12, y0 + 20);
  }
}

export function caption(c: CanvasRenderingContext2D, m: MoodId, x: number, y: number, s: string) {
  const p = getMood(m);
  c.fillStyle = withAlpha(p.rim, 0.75);
  c.font = 'italic 11px Georgia';
  c.textAlign = 'center';
  c.fillText(s, x, y);
  c.textAlign = 'left';
}
