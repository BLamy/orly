/**
 * neural-net-history — the Wall of Forecasts (staging.wallOfForecasts): slots W1–W8 left to right from
 * the lamp outward, pinned beside the Case Board on its right. Paper slips that can be pinned, yellow,
 * curl, glint, sit in deep shadow (W6: only its lower corner catches the lamp), or come down (a bare pin).
 *
 *   wallOfForecasts(c, { x, y, k, slips, light? }, env)   the panel and every slip from wallStateAt(...)
 *   drawSlip(c, slipView, { x, y, k, light, ... }, env)   one slip (a shot animating a pin/lift/float)
 *   wallSlotAt(o, 'W3')                                   the slot's pin point in layer px
 *
 * Wall units: the panel is WALL.w × WALL.h (620 × 470), origin top-left; k = layer px per unit.
 * Light falls off from the lamp side (left) outward; W6 is in deep shadow by rule.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { typedText, paperTone } from './caseBoard';
import type { SlipView, WallSlot } from './studyState';

export const WALL = { w: 620, h: 470 } as const;
const ORDER: WallSlot[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
/** slip centre (wall units) and size */
export const WALL_SLOTS: Record<WallSlot, { x: number; y: number; w: number; h: number }> = Object.fromEntries(
  ORDER.map((id, i) => {
    const long = id === 'W3' || id === 'W4' || id === 'W7';
    return [id, { x: 76 + i * 67, y: i % 2 === 0 ? 150 : 318, w: long ? 128 : 116, h: long ? 96 : 76 }];
  }),
) as Record<WallSlot, { x: number; y: number; w: number; h: number }>;

/** lamp light on a slot (0..1): from the lamp side outward; W6 in deep shadow */
export function slotLight(slot: WallSlot, lampK = 1): number {
  const i = ORDER.indexOf(slot);
  if (slot === 'W6') return 0.06 * lampK;
  return lampK * Math.max(0.12, 0.95 - i * 0.1);
}

export interface WallDraw {
  x: number;
  y: number;
  k: number;
  slips: SlipView[];
  /** lamp intensity 0..1 */
  light?: number;
  /** hide these slots (animated by the shot) */
  hide?: WallSlot[];
  /** glint strength per slot this frame (0..1), e.g. { W5: 0.8 } */
  glint?: Partial<Record<WallSlot, number>>;
  /** draw the EMPTY slots' bare pins in one left-to-right row at this wall-unit height (e.g. W1's pin row,
   *  WALL_SLOTS.W1.y - WALL_SLOTS.W1.h / 2 + 6), so the waiting slots read as a row (ch02-s05b, ch02-s08) */
  emptyRow?: number;
}

export function wallSlotAt(o: Pick<WallDraw, 'x' | 'y' | 'k'>, slot: WallSlot) {
  const s = WALL_SLOTS[slot];
  return { x: o.x + s.x * o.k, y: o.y + (s.y - s.h / 2 + 6) * o.k };
}

export interface SlipDraw {
  x: number;
  y: number;
  k: number;
  light: number;
  /** 0..1 curl of the bottom corner */
  curl?: number;
  /** 0..1 yellowing */
  yellow?: number;
  rot?: number;
  alpha?: number;
  pin?: boolean;
  glint?: number;
  ghost?: boolean;
  /** W6 rule: deep shadow, only the lower corner half-lit */
  shadow?: boolean;
}

export function drawSlip(c: CanvasRenderingContext2D, v: Pick<SlipView, 'slot' | 'who' | 'text' | 'due'>, o: SlipDraw, env: PaintEnv) {
  const sz = WALL_SLOTS[v.slot];
  const w = sz.w * o.k, h = sz.h * o.k;
  const seedRot = hash1(ORDER.indexOf(v.slot), 23) * 0.04;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.translate(o.x, o.y);
  c.rotate(seedRot + (o.rot ?? 0) + (o.curl ?? 0) * 0.05);
  let paper = paperTone(env, o.light);
  if (o.yellow) paper = mixLab(paper, mixLab(env.mood.halo, '#8a6a2a', 0.5), 0.5 * o.yellow);
  if (o.shadow) paper = mixLab(env.mood.set, env.mood.fg, 0.25);
  if (o.ghost) {
    c.strokeStyle = withAlpha(env.mood.rim, 0.32);
    c.lineWidth = 1.1 * o.k;
    c.strokeRect(-w / 2, -h / 2, w, h);
    c.fillStyle = withAlpha(env.mood.haze, 0.18);
    c.fillRect(-w / 2, -h / 2, w, h);
    c.restore();
    return;
  }
  // contact shadow, paper, curled corner
  c.fillStyle = withAlpha(env.mood.fg, 0.3);
  c.fillRect(-w / 2 + 2 * o.k, -h / 2 + 3 * o.k, w, h);
  const curl = (o.curl ?? 0) * Math.min(w, h) * 0.45;
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(-w / 2, -h / 2);
  c.lineTo(w / 2, -h / 2);
  c.lineTo(w / 2, h / 2 - curl);
  c.lineTo(w / 2 - curl, h / 2);
  c.lineTo(-w / 2, h / 2);
  c.closePath();
  c.fill();
  if (curl > 0) {
    // the rolled corner shows its paler underside
    c.fillStyle = mixLab(paper, env.mood.rim, 0.25);
    c.beginPath();
    c.moveTo(w / 2, h / 2 - curl);
    c.quadraticCurveTo(w / 2 - curl * 0.2, h / 2 - curl * 0.2, w / 2 - curl, h / 2);
    c.quadraticCurveTo(w / 2 - curl * 0.55, h / 2 - curl * 0.75, w / 2, h / 2 - curl);
    c.fill();
  }
  if (o.shadow) {
    // only the lower corner catches the lamp: its words unreadable
    const g = c.createRadialGradient(-w / 2, h / 2, 0, -w / 2, h / 2, w * 0.55);
    g.addColorStop(0, withAlpha(paperTone(env, 0.55), 0.95));
    g.addColorStop(1, withAlpha(paperTone(env, 0.55), 0));
    c.fillStyle = g;
    c.fillRect(-w / 2, -h / 2, w, h);
  } else {
    const ink = mixLab(env.mood.ink, paper, 0.1);
    if (v.who) {
      // the who-line always fits on its own slip (a long name list shrinks rather than running off the paper)
      c.font = `400 ${8.5 * o.k}px ${FONT.typewriter}`;
      const room = w - 14 * o.k;
      const tw = c.measureText(v.who).width;
      if (tw > room) c.font = `400 ${(8.5 * o.k * room) / tw}px ${FONT.typewriter}`;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillStyle = ink;
      c.fillText(v.who, -w / 2 + 7 * o.k, -h / 2 + 15 * o.k);
      c.fillRect(-w / 2 + 7 * o.k, -h / 2 + 21 * o.k, w - 14 * o.k, 0.7 * o.k);
    }
    typedText(c, v.text, 0, (v.who ? 9 : 2) * o.k, w * 0.86, h * (v.who ? 0.55 : 0.7), ink, 10 * o.k);
    if (v.due) {
      c.font = `400 ${8 * o.k}px ${FONT.typewriter}`;
      c.textAlign = 'right';
      c.fillStyle = withAlpha(ink, 0.8);
      c.fillText(`DUE ${v.due}`, w / 2 - 7 * o.k, h / 2 - 8 * o.k);
    }
  }
  if (o.pin !== false) pinHead(c, 0, -h / 2 + 6 * o.k, o.k, env, o.light, o.glint ?? 0);
  c.restore();
}

function pinHead(c: CanvasRenderingContext2D, x: number, y: number, k: number, env: PaintEnv, light: number, glint: number) {
  c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
  c.beginPath();
  c.arc(x, y, 4 * k, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.5 * (0.3 + light));
  c.beginPath();
  c.arc(x - 1.1 * k, y - 1.1 * k, 1.5 * k, 0, Math.PI * 2);
  c.fill();
  if (glint > 0) {
    // the pin glints: a small four-point star in the core colour
    c.save();
    c.globalCompositeOperation = 'lighter';
    const r = 16 * k * glint;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(env.mood.core, 0.9 * glint));
    g.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
    c.strokeStyle = withAlpha(env.mood.core, 0.8 * glint);
    c.lineWidth = 1 * k;
    c.beginPath();
    c.moveTo(x - r, y);
    c.lineTo(x + r, y);
    c.moveTo(x, y - r * 0.7);
    c.lineTo(x, y + r * 0.7);
    c.stroke();
    c.restore();
  }
}

export function wallOfForecasts(c: CanvasRenderingContext2D, o: WallDraw, env: PaintEnv) {
  const { x, y, k } = o;
  const lamp = o.light ?? 1;
  // the panel: a dark papered strip, warmed on its lamp side
  const W = WALL.w * k, H = WALL.h * k;
  const dark = mixLab(env.mood.set, env.mood.fg, 0.4);
  c.fillStyle = dark;
  c.fillRect(x, y, W, H);
  const g = c.createLinearGradient(x, 0, x + W, 0);
  g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.35), 0.75 * lamp));
  g.addColorStop(0.55, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.2), 0.3 * lamp));
  g.addColorStop(1, withAlpha(dark, 0));
  c.fillStyle = g;
  c.fillRect(x, y, W, H);
  // a faint papered stripe
  c.fillStyle = withAlpha(env.mood.fg, 0.12);
  for (let i = 0; i < 31; i++) c.fillRect(x + (i * W) / 31, y, 1.2 * k, H);
  // moulding top and bottom
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 6 * k, y - 10 * k, W + 12 * k, 10 * k);
  c.fillRect(x - 6 * k, y + H, W + 12 * k, 8 * k);
  c.fillStyle = withAlpha(env.mood.rim, 0.3 * lamp);
  c.fillRect(x - 6 * k, y - 10 * k, W + 12 * k, 1 * k);

  const hide = new Set(o.hide ?? []);
  for (const v of o.slips) {
    if (hide.has(v.slot)) continue;
    const s = WALL_SLOTS[v.slot];
    const px = x + s.x * k, py = y + s.y * k;
    const light = slotLight(v.slot, lamp);
    if (v.state === 'empty' || v.state === 'down' || v.state === 'gone') {
      // a bare pin (W8 waits empty until ch15; a slip that came down leaves its pin)
      const pinY = o.emptyRow !== undefined ? y + o.emptyRow * k : py - (s.h / 2) * k + 6 * k;
      pinHead(c, px, pinY, k, env, light, 0);
      continue;
    }
    drawSlip(c, v, {
      x: px,
      y: py,
      k,
      light,
      ghost: v.ghost,
      shadow: v.state === 'shadow',
      yellow: v.state === 'yellowed' || v.state === 'curled' ? 1 : 0,
      curl: v.state === 'curled' ? 1 : v.state === 'yellowed' ? 0.4 : 0,
      glint: (o.glint?.[v.slot] ?? 0) || (v.glint ? 1 : 0),
    }, env);
  }
}
