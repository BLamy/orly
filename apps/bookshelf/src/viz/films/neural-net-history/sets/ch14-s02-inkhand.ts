/**
 * ch14-s02 / ch14-s04b / ch14-s07 — the narrator's hand AS THE GLASS SHOWS IT (review round 3/4: "a faint grey
 * ghost" → a clear ink silhouette cut out by a candleAmber rim). The hand is drawn twice on the sheet it lives on:
 * first a candleAmber copy nudged a pixel or two toward the lamp (that copy's visible sliver IS the rim, on the
 * lit contour only), then the ink hand over it. The sheet's own alpha (≈ 35 %, the WINDOW RULE) then sets how dark
 * the hand reads over the strait.
 *
 *   inkHand(c, pose, env, { light, rimPx, lit })
 *     light  direction toward the key (default up-right, the lamp side)
 *     rimPx  rim width in the sheet's units (default 1.6)
 *     lit    0..1: the match is burning (the rim warms toward the flame's core)
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab } from '../../../film/silhouette/palette';
import { hands } from '../cast';

type Pose = NonNullable<ReturnType<typeof hands.act>>;

export function inkHand(c: CanvasRenderingContext2D, pose: Pose, env: PaintEnv, o: { light?: { x: number; y: number }; rimPx?: number; lit?: number } = {}) {
  const am = MOODS.candleAmber;
  const lk = Math.max(0, Math.min(1, o.lit ?? 0));
  const rimCol = mixLab(am.rim, am.core, 0.3 + 0.35 * lk);
  const L = o.light ?? { x: 0.55, y: -0.85 };
  const n = Math.hypot(L.x, L.y) || 1;
  const d = o.rimPx ?? 1.6;
  // the rim copy: amber everywhere, no flame (the match flame is drawn once, by the ink pass)
  const rimEnv: PaintEnv = { ...env, mood: { ...env.mood, rim: rimCol }, fill: (r) => (r === 'ink' ? rimCol : env.fill(r)) };
  const unlit: Pose = pose.right ? { ...pose, right: { ...pose.right, lit: 0 } } : pose;
  c.save();
  c.translate((L.x / n) * d, (L.y / n) * d);
  hands.draw(c, unlit, rimEnv);
  c.restore();
  // the ink hand: the darkest shape in the glass; its own cut-lines in a warm hairline
  const ink = mixLab(env.mood.ink, '#000000', 0.35);
  const inkEnv: PaintEnv = { ...env, mood: { ...env.mood, rim: mixLab(rimCol, ink, 0.25) }, fill: (r) => (r === 'ink' ? ink : env.fill(r)) };
  hands.draw(c, pose, inkEnv);
}
