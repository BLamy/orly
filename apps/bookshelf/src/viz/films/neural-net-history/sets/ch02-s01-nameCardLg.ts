/**
 * ch02-s01 (also used by ch02-s04, ch02-s05): the kit's nameCard set at the style bible's size.
 *
 * The kit card draws its name at 26 px small caps and its role at 19 px italic in stage px, which lands at
 * roughly 22 / 17 px of glyph height at 1080p: under the 26 px floor. This scales the whole card (type,
 * rule, lozenge and plate) about its anchor so the name's small caps read at ~34 px and the role at ~26 px
 * at 1080p. The anchor (x, y) is the name's baseline at its leading edge, exactly as for nameCard; the card
 * grows away from it (rightwards for a left card, leftwards for a right one, and downwards).
 *
 *   nameCardLg(c, { name, role, x, y, align, at, dur }, { t, mood })
 *   nameCardDepth(o, k?)  -> how far below y the role line's baseline sits (stage px), for safe-area checks
 */
import { nameCard } from '../../../film';
import type { NameCardOpts, TypeEnv } from '../../../film';

/** the scale that brings the kit card to the bible's 34 / 26 px at 1080p */
export const NAME_CARD_K = 1.42;

export function nameCardLg(c: CanvasRenderingContext2D, o: NameCardOpts, env: TypeEnv, k = NAME_CARD_K): void {
  const right = o.align === 'right';
  const x = o.x ?? (right ? 1232 : 56);
  const y = o.y ?? 610;
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  c.translate(-x, -y);
  nameCard(c, { ...o, x, y }, env);
  c.restore();
}

/** the role line's baseline below the anchor (stage px) at scale k: keep y + depth < 634 (bottom 12% clear) */
export function nameCardDepth(k = NAME_CARD_K): number {
  return (11 + 19 + 9) * k;
}
