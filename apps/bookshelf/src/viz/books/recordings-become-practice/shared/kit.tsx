// Small book-local vocabulary. All animation comes from the sampled timeline.
import { Timeline, cameraInterp, ease, colors } from '../../../core';
import type { CameraState } from '../../../core';
import { captionPlan } from '../../next-useful-action/shared/profile-page';
export const C = { observation: '#38bdf8', model: '#a78bfa', good: '#34d399', pending: '#fbbf24', bad: '#fb7185', muted: '#8da2be', text: '#f1f5f9' };
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * clamp(u);
export const on = (p: number, beat: number) => clamp(p - beat);
export const span = (p: number, from: number, to: number) => on(p, from) * (1 - on(p, to));
export function chapter(captions: readonly string[]) {
  const tl = new Timeline();
  const plan = captionPlan(captions);
  const cam = tl.channel<CameraState>('cam', { x: 640, y: 360, k: 1 }, cameraInterp);
  const phase = tl.channel('phase', 0);
  captions.forEach((text, i) => {
    tl.caption({ at: plan.at[i], dur: plan.dur[i], text });
    tl.tween(phase, i + 1, { at: plan.at[i] + .35, dur: 1.25, ease: ease.move });
  });
  tl.tween(cam, { x: 640, y: 368, k: 1.025 }, { at: plan.at[2] + .5, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 640, y: 360, k: 1 }, { at: plan.at[5] + .5, dur: 1.2, ease: ease.move });
  tl.hold(plan.end, 1);
  return { tl, cam, phase, plan };
}
export function Header({ title, tag = 'PROPOSED · ILLUSTRATIVE FIXTURE' }: { title: string; tag?: string }) {
  return <g><text x={54} y={48} fill={C.text} fontSize={26} fontWeight={700}>{title}</text><text x={54} y={77} fill={C.pending} fontSize={12} fontFamily={colors.font.mono}>{tag}</text></g>;
}
export function Label({ x, y, children, color = C.text, size = 17, anchor = 'start' }: { x: number; y: number; children: React.ReactNode; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end' }) {
  return <text x={x} y={y} fill={color} fontSize={size} textAnchor={anchor}>{children}</text>;
}
export function Panel({ x, y, w, h, title, color = C.observation, opacity = 1, children }: { x: number; y: number; w: number; h: number; title: string; color?: string; opacity?: number; children?: React.ReactNode }) {
  if (opacity < .002) return null;
  return <g opacity={opacity}><rect x={x} y={y} width={w} height={h} rx={14} fill='#101a2e' stroke={color} strokeOpacity={.6}/><Label x={x + 18} y={y + 29} color={color} size={16}>{title}</Label>{children}</g>;
}
export function Chip({ x, y, w, text, color = C.observation, opacity = 1 }: { x: number; y: number; w: number; text: string; color?: string; opacity?: number }) {
  return <g opacity={opacity}><rect x={x} y={y} width={w} height={30} rx={8} fill='#0a1120' stroke={color}/><Label x={x + w / 2} y={y + 20} anchor='middle' size={13} color={color}>{text}</Label></g>;
}
export function Arrow({ x1, y1, x2, y2, color = C.observation, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; opacity?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return <g opacity={opacity} stroke={color} fill='none' strokeWidth={2}><path d={`M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`}/><path d={`M${x2-9*Math.cos(a-.5)},${y2-9*Math.sin(a-.5)} L${x2},${y2} L${x2-9*Math.cos(a+.5)},${y2-9*Math.sin(a+.5)}`}/></g>;
}
