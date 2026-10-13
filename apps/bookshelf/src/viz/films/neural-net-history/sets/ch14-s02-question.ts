/**
 * ch14-s02 (planted) / ch14-s07 (paid off) — the Act 3 question card CAN A FENCE AROUND CHIPS HOLD?
 *
 * The case's question cards hang on the oxblood thread; in ch14 the study is seen only through its window, so this
 * card hangs from the window's own top rail (the near L1 occluder, part of the study, so it is not a reflection) on
 * an oxblood thread, in the same typed hand and on the same card stock as the case card WHO TAUGHT IT? (
 * paperTone / typedText from the case board, K's 19-unit type). Screen-locked: draw it after windowFrame.
 *
 *   fenceQuestionCard(c, env, { x, y, k, drop, sway, stamp })
 *     x, y   the card's centre at rest (stage px); k = px per board unit (1.55 ≈ a 264 × 174 px card)
 *     drop   0..1: the card drops a short way on its thread and settles (one overshoot), fading in WITH its question
 *     sway   radians of gentle swing (pass a slow sine)
 *     stamp  0..1: STATUS: OPEN stamp ink (ch14-s07's payoff)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, cardProbe, textRole } from '../../../film/silhouette/type';
import { oxblood, paperTone, typedText } from './caseBoard';

export const FENCE_QUESTION = 'CAN A FENCE AROUND CHIPS HOLD?';
const DEF = { w: 170, h: 112 } as const;

export interface FenceCardDraw {
  x: number;
  y: number;
  k?: number;
  drop?: number;
  sway?: number;
  stamp?: number;
  /** 0..1 light on the card (dawn through the glass) */
  light?: number;
  alpha?: number;
}

const sm = (x: number) => {
  const u = Math.max(0, Math.min(1, x));
  return u * u * (3 - 2 * u);
};

export function fenceQuestionCard(c: CanvasRenderingContext2D, env: PaintEnv, o: FenceCardDraw) {
  const k = o.k ?? 1.55;
  const drop = o.drop ?? 1;
  if (drop <= 0) return;
  const h = DEF.h * k;
  // drop with one small overshoot (paper on a thread), then rest. Review round 3 (kit card-entry rule): the card
  // used to fall from above the frame, so its blank lower edge hung in view before the question came on screen (a
  // grey strip at ch14-s07 13.71 s). It now drops a short way (46 px) while card AND question fade in together.
  const u = Math.max(0, Math.min(1, drop));
  const over = u < 0.7 ? sm(u / 0.7) * 1.06 : 1.06 - 0.06 * sm((u - 0.7) / 0.3);
  const top = o.y - 46 * k;
  const y = top + (o.y - top) * over;
  const pinY = y - h / 2 + 7 * k;
  const fadeIn = sm(u / 0.45);
  c.save();
  c.globalAlpha *= (o.alpha ?? 1) * fadeIn;
  // the oxblood thread from the window's top rail down to the pin
  c.strokeStyle = oxblood(env, 0.2);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(o.x, -4);
  c.lineTo(o.x + Math.sin(o.sway ?? 0) * (pinY + 4), pinY);
  c.stroke();
  c.translate(o.x, pinY);
  c.rotate(o.sway ?? 0);
  c.translate(-o.x, -pinY);
  const light = o.light ?? 0.8;
  const w = DEF.w * k;
  // the case board's card stock (drawCard's paper, shadow, rim and brass pin), drawn here unrotated so the type and
  // the stamp sit square on it
  // the case board's paper tone, pulled toward a neutral card stock so the dawn does not turn it into a yellow accent
  const paper = mixLab(paperTone(env, light), '#d9d0bd', 0.45);
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.fillRect(o.x - w / 2 + 2.5 * k, y - h / 2 + 3.5 * k, w, h);
  c.fillStyle = paper;
  c.fillRect(o.x - w / 2, y - h / 2, w, h);
  cardProbe(c, 'fenceQuestionCard', o.x - w / 2, y - h / 2, w, h, 1, 1);
  c.fillStyle = withAlpha(env.mood.rim, 0.25 * light);
  c.fillRect(o.x - w / 2, y - h / 2, w, 1.2 * k);
  const ink = mixLab(env.mood.ink, paper, 0.08);
  // the question, typed as WHO TAUGHT IT? is (Special Elite, K's 19-unit size): the reader must read it
  textRole(c, 'subject', () => typedText(c, FENCE_QUESTION, o.x, y + 4 * k, w * 0.84, h * 0.7, ink, 19 * k));
  if (o.stamp && o.stamp > 0) {
    // STATUS: OPEN, as the case card K gets it (ch15-s09)
    c.save();
    c.translate(o.x, y);
    c.rotate(-0.12);
    c.globalAlpha *= o.stamp;
    c.strokeStyle = '#b3261e';
    c.fillStyle = '#b3261e';
    c.lineWidth = 2.4 * k;
    c.strokeRect(-w * 0.38, h * 0.08, w * 0.76, h * 0.3);
    textRole(c, 'subject', () => {
      c.font = `400 ${15 * k}px ${FONT.typewriter}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('STATUS: OPEN', 0, h * 0.23);
    });
    c.restore();
  }
  // brass pin
  c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
  c.beginPath();
  c.arc(o.x, pinY, 4.2 * k, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.55 * (0.3 + light));
  c.beginPath();
  c.arc(o.x - 1.2 * k, pinY - 1.2 * k, 1.6 * k, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
