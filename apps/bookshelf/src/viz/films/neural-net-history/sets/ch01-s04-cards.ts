/**
 * neural-net-history — the case card and the three suspect cards as ch01-s04 / ch01-s05 letter them.
 *
 * The same paper, tilt, contact shade, brass pin and paper-cut icons as the shared card painter
 * (sets/caseBoard drawCard), but lettered for the camera that introduces them: the case card set as
 * "WHO / TAUGHT IT?" (two clean lines, larger), and each suspect's name in Special Elite at 20 board units,
 * so its cap height clears the 22 px (1080p) floor on the stage while the camera is on the board.
 *
 *   ch01Card(c, slot, { x, y, light, rot?, pin?, alpha?, press? }, env)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { cardIcon, paperTone } from './caseBoard';
import type { SlotDef } from './studyState';

const LETTERING: Record<string, { lines: string[]; size: number }> = {
  K: { lines: ['WHO', 'TAUGHT IT?'], size: 24 },
  S1: { lines: ['RULES'], size: 20 },
  S2: { lines: ['KNOWLEDGE'], size: 20 },
  S3: { lines: ['LEARNING'], size: 20 },
};

export interface Ch01CardDraw {
  x: number;
  y: number;
  light: number;
  rot?: number;
  pin?: boolean;
  alpha?: number;
  /** 0..1 pressed flat onto the board (a touch larger while held off it) */
  lift?: number;
}

export function ch01Card(c: CanvasRenderingContext2D, def: SlotDef, o: Ch01CardDraw, env: PaintEnv) {
  const w = def.w, h = def.h;
  const seedRot = hash1(def.id.length * 31 + def.id.charCodeAt(def.id.length - 1), 17) * 0.025;
  const L = LETTERING[def.id] ?? { lines: [def.text ?? ''], size: 14 };
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.translate(o.x, o.y);
  c.rotate(seedRot + (o.rot ?? 0));
  const s = 1 + 0.035 * (o.lift ?? 0);
  c.scale(s, s);
  const paper = paperTone(env, o.light);
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.fillRect(-w / 2 + 2.5 + 4 * (o.lift ?? 0), -h / 2 + 3.5 + 5 * (o.lift ?? 0), w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = withAlpha(env.mood.rim, 0.25 * o.light);
  c.fillRect(-w / 2, -h / 2, w, 1.2);
  const ink = mixLab(env.mood.ink, paper, 0.08);
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  if (def.icon === 'typed') {
    const lh = L.size * 1.18;
    c.font = `400 ${L.size}px ${FONT.typewriter}`;
    L.lines.forEach((ln, i) => c.fillText(ln, 0, 4 + (i - (L.lines.length - 1) / 2) * lh));
  } else {
    // the paper-cut object above, the name below it, large
    const iconH = h * 0.5;
    const own = def.icon === 'key-tree' || def.icon === 'lantern';
    if (own) ch01Icon(c, def.icon, 0, -h / 2 + 3 + iconH / 2, Math.min(w * 0.72, iconH * 1.3), env, ink, paper);
    else cardIcon(c, def.icon, 0, -h / 2 + 6 + iconH / 2, Math.min(w * 0.7, iconH), env, ink, { lit: 0 });
    let size = L.size;
    c.font = `400 ${size}px ${FONT.typewriter}`;
    const tw = c.measureText(L.lines[0]).width;
    if (tw > w * 0.96) {
      size *= (w * 0.96) / tw;
      c.font = `400 ${size}px ${FONT.typewriter}`;
    }
    c.fillStyle = ink;
    c.fillText(L.lines[0], 0, h / 2 - 15);
  }
  if (o.pin !== false) {
    c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
    c.beginPath();
    c.arc(0, -h / 2 + 7, 4.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(env.mood.core, 0.55 * (0.3 + o.light));
    c.beginPath();
    c.arc(-1.2, -h / 2 + 5.8, 1.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/**
 * The two suspect icons as ch01 introduces them (review round 1: the shared ones read as a cocoa bean and as
 * antlers at board distance). Drawn in a 100-unit box centred on (cx, cy), ~1.3x the shared icons' size:
 *   key-tree  a fine branching tree with a clear key laid across its trunk: a ring bow with a hole cut through
 *             it, a straight shank, a two-step bit; a paper-coloured keyline separates the key from the branches
 *   lantern   an UNLIT paper lantern: hanging loop, top cap, a barrel body with four vertical ribs cut through
 *             to the paper, bottom cap and a short tassel
 */
function ch01Icon(c: CanvasRenderingContext2D, icon: string, cx: number, cy: number, size: number, env: PaintEnv, ink: string, paper: string) {
  const s = size / 100;
  c.save();
  c.translate(cx, cy);
  c.scale(s, s);
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (icon === 'key-tree') {
    // the tree: a trunk forking twice, fine branches, small round leaf-clusters at the tips
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(0, 44);
    c.lineTo(0, 2);
    c.stroke();
    c.lineWidth = 2.6;
    c.beginPath();
    const fork = (x: number, y: number, a: number, len: number, depth: number) => {
      const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len;
      c.moveTo(x, y);
      c.lineTo(x2, y2);
      if (depth > 0) {
        fork(x2, y2, a - 0.42, len * 0.66, depth - 1);
        fork(x2, y2, a + 0.42, len * 0.66, depth - 1);
      } else tips.push([x2, y2]);
    };
    const tips: [number, number][] = [];
    fork(0, 6, -0.62, 26, 1);
    fork(0, 6, 0.62, 26, 1);
    fork(0, 2, 0, 22, 1);
    c.stroke();
    for (const [x, y] of tips) {
      c.beginPath();
      c.arc(x, y, 3.6, 0, Math.PI * 2);
      c.fill();
    }
    // the key, laid across the trunk: keyline first (paper), then the key (ink); the bow's hole shows the card
    const key = new Path2D();
    key.arc(-30, 26, 12, 0, Math.PI * 2);
    key.rect(-19, 23, 56, 6.5);
    key.rect(25, 29, 5, 9);
    key.rect(32, 29, 5, 6);
    c.strokeStyle = paper;
    c.lineWidth = 4;
    c.stroke(key);
    c.fillStyle = ink;
    c.fill(key);
    c.fillStyle = paper;
    c.beginPath();
    c.arc(-30, 26, 5.4, 0, Math.PI * 2);
    c.fill();
  } else {
    // the lantern: loop, cap, barrel body, cap, tassel
    c.lineWidth = 2.6;
    c.beginPath();
    c.ellipse(0, -46, 5.5, 5, 0, 0, Math.PI * 2);
    c.stroke();
    c.fillRect(-13, -41, 26, 7);
    c.fillRect(-9, -42.5, 18, 2.5);
    const body = new Path2D();
    body.moveTo(-15, -34);
    body.bezierCurveTo(-34, -26, -34, 22, -15, 30);
    body.lineTo(15, 30);
    body.bezierCurveTo(34, 22, 34, -26, 15, -34);
    body.closePath();
    c.fill(body);
    c.fillRect(-13, 30, 26, 7);
    c.fillRect(-1.5, 37, 3, 6);
    c.beginPath();
    c.moveTo(-4, 43);
    c.lineTo(4, 43);
    c.lineTo(5, 50);
    c.lineTo(-5, 50);
    c.closePath();
    c.fill();
    // four vertical ribs cut through to the paper, following the barrel (unlit: no glow)
    c.save();
    c.clip(body);
    c.strokeStyle = withAlpha(paper, 0.7);
    c.lineWidth = 2.2;
    for (const k of [-0.62, -0.2, 0.2, 0.62]) {
      c.beginPath();
      c.moveTo(15 * k, -34);
      c.bezierCurveTo(31 * k, -24, 31 * k, 20, 15 * k, 30);
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}
