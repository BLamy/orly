/**
 * durable-objects-unbound — ch03 square helpers (author:ch02-ch03): keepers at the wellhead, marked sheets, the
 * keepers' forearms for close-ups. Everything else comes from the shared town (harbourTown.ts) and the Well
 * (wellAndPlate.ts), unchanged.
 *
 *   keeper(c, env, o)        a keeper puppet (keeper-a | keeper-b) in the square, moon-rimmed, posed by weights
 *   markedSheet(c, env, o)   an unrolled sheet with an ink stroke: 'fresh' (bold, wet sheen) | 'old' (faded) |
 *                            'fresh2' (the second write's mark); x, y = centre, w = width
 *   keeperArm(c, env, o)     a keeper's forearm + hand entering from the frame side (close-ups): side 'left' | 'right',
 *                            sleeve 'gilet' (A, shirtsleeve cuff) | 'coat' (B, overcoat cuff); the grip point at o.tip
 */
import { POSES, PUPPET_NEAR_BLACK, blendPose, mixLab, withAlpha, withLife } from '../../../film';
import type { PaintEnv, Pose } from '../../../film';
import { cast, MOON_LIGHT, MOON_RIM } from '../cast';
import { clamp01, paper, sm, type C2 } from './common';

export interface KeeperOpts {
  id: 'keeper-a' | 'keeper-b' | 'keeper-c';
  x: number;
  y: number;
  facing: 'left' | 'right';
  scale: number;
  tq: number;
  /** pose weights: present (hand forward, raised), lean (reach down to the well), point */
  present?: number;
  lean?: number;
  look?: number;
  alpha?: number;
  pose?: Pose;
}
export function keeperPose(o: Pick<KeeperOpts, 'present' | 'lean' | 'look' | 'tq' | 'pose' | 'id'>): Pose {
  let p: Pose = o.pose ?? POSES.stand;
  if ((o.present ?? 0) > 0) p = blendPose(p, POSES.present, clamp01(o.present ?? 0));
  if ((o.lean ?? 0) > 0) p = blendPose(p, POSES.lean, clamp01(o.lean ?? 0));
  if ((o.look ?? 0) > 0) p = blendPose(p, { ...p, angles: { ...p.angles, neck: -8, head: -14 } } as Pose, clamp01(o.look ?? 0));
  return withLife(p as Pose & { prev?: Pose }, o.tq, o.id === 'keeper-a' ? 11 : o.id === 'keeper-b' ? 13 : 17, 0.7);
}
export function keeper(c: C2, env: PaintEnv, o: KeeperOpts): void {
  const a = o.alpha ?? 1;
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  cast[o.id].draw(c, { x: o.x, y: o.y, facing: o.facing, pose: keeperPose(o), scale: o.scale, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: MOON_RIM }, env);
  c.restore();
}
export function keeperHand(o: KeeperOpts): { x: number; y: number } {
  return cast[o.id].anchor({ x: o.x, y: o.y, facing: o.facing, pose: keeperPose(o), scale: o.scale }, 'handF');
}

export type Mark = 'fresh' | 'old' | 'fresh2';
export function markedSheet(c: C2, env: PaintEnv, o: { x: number; y: number; w: number; mark: Mark; rot?: number; alpha?: number; wet?: number }): void {
  const a = o.alpha ?? 1;
  if (a <= 0.01) return;
  const w = o.w, h = w * 0.68;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  // the sheet, rolled at both ends
  c.fillStyle = o.mark === 'old' ? mixLab(paper(env, 0.25), '#b8ad94', 0.35) : mixLab(paper(env, 0.05), '#fbf1da', 0.3);
  c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = mixLab(paper(env, 0.35), env.mood.fg, 0.2);
  c.fillRect(-w / 2 - w * 0.06, -h / 2 - h * 0.04, w * 0.08, h * 1.08);
  c.fillRect(w / 2 - w * 0.02, -h / 2 - h * 0.04, w * 0.08, h * 1.08);
  // the mark
  c.lineCap = 'round';
  if (o.mark === 'old') {
    c.strokeStyle = withAlpha('#5b5448', 0.55);
    c.lineWidth = w * 0.07;
    c.beginPath();
    c.moveTo(-w * 0.28, h * 0.1);
    c.lineTo(w * 0.26, -h * 0.05);
    c.stroke();
  } else {
    c.strokeStyle = '#140c06';
    c.lineWidth = w * 0.1;
    c.beginPath();
    if (o.mark === 'fresh') {
      c.moveTo(-w * 0.3, h * 0.22);
      c.bezierCurveTo(-w * 0.1, -h * 0.45, w * 0.05, h * 0.45, w * 0.3, -h * 0.22);
    } else {
      c.moveTo(-w * 0.28, -h * 0.22);
      c.lineTo(w * 0.26, -h * 0.22);
      c.lineTo(-w * 0.24, h * 0.22);
      c.lineTo(w * 0.3, h * 0.22);
    }
    c.stroke();
    const wet = clamp01(o.wet ?? 0);
    if (wet > 0.01) {
      c.strokeStyle = withAlpha('#ffffff', 0.45 * wet);
      c.lineWidth = w * 0.025;
      c.stroke();
    }
  }
  c.restore();
}

export interface ArmOpts {
  tip: { x: number; y: number };
  side: 'left' | 'right';
  sleeve: 'gilet' | 'coat';
  /** forearm angle from horizontal (rad, + = the elbow lower than the hand) */
  angle?: number;
  s?: number;
  alpha?: number;
}
/** a keeper's forearm and hand (cut paper, near black, moon-rimmed on its top edge), holding something at tip */
export function keeperArm(c: C2, env: PaintEnv, o: ArmOpts): void {
  const a = o.alpha ?? 1;
  if (a <= 0.01) return;
  const s = o.s ?? 1;
  const dir = o.side === 'left' ? 1 : -1; // the arm points toward +x when it comes from the left
  c.save();
  c.globalAlpha *= a;
  c.translate(o.tip.x, o.tip.y);
  c.scale(dir * s, s);
  c.rotate(o.angle ?? 0.18);
  const ink = PUPPET_NEAR_BLACK;
  c.fillStyle = ink;
  // hand: a gripping fist with the thumb over (the card is held between thumb and fingers at 0,0)
  c.beginPath();
  c.ellipse(-12, 2, 16, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(-6, -8);
  c.quadraticCurveTo(4, -10, 6, -3);
  c.lineTo(0, -2);
  c.closePath();
  c.fill();
  // forearm back to the frame edge
  c.beginPath();
  c.moveTo(-22, -10);
  c.lineTo(-520, -24);
  c.lineTo(-520, 26);
  c.lineTo(-22, 12);
  c.closePath();
  c.fill();
  // the cuff
  if (o.sleeve === 'gilet') {
    // shirtsleeve rolled: a pale cuff band
    c.fillStyle = mixLab(paper(env, 0.4), env.mood.fg, 0.35);
    c.beginPath();
    c.moveTo(-120, -14);
    c.lineTo(-150, -16);
    c.lineTo(-150, 18);
    c.lineTo(-120, 16);
    c.closePath();
    c.fill();
  } else {
    // overcoat: a heavy turned-back cuff with a button
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(-70, -18);
    c.lineTo(-130, -22);
    c.lineTo(-130, 24);
    c.lineTo(-70, 20);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(env.mood.rim, 0.45);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-70, -18);
    c.lineTo(-70, 20);
    c.stroke();
    c.fillStyle = withAlpha(env.mood.rim, 0.5);
    c.beginPath();
    c.arc(-100, 0, 2.2, 0, Math.PI * 2);
    c.fill();
  }
  // moon rim on the top edge
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.2), 0.8);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-520, -24);
  c.lineTo(-22, -10);
  c.quadraticCurveTo(-14, -14, -4, -10);
  c.stroke();
  c.restore();
  void sm;
}
