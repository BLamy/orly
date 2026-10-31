/**
 * ch13-s01 — the case's two question cards on the 2012 stage's Wall flat (review round 3, story: "the film's second
 * through-line question is spoken in L1303b but never pinned").
 *
 * The case card WHO TAUGHT IT? (the film's first through-line question) comes up in the candle's light on 'reopens',
 * and on 'second question' the detective's hand pins its companion beside it, in the same typed hand and on the same
 * card stock (paperTone / Special Elite, K's 19-unit size, the brass pin). Both stay up to the end of the shot.
 *
 *   questionCard(c, env, { x, y, k, text, light, alpha, pin })   one card, centre (x, y), k = px per board unit
 *   QCARD                                                          the card's board size (170 × 112, as K)
 *
 * Draw it in the Wall flat's own coordinates (the shot maps WALL_FLAT → screen and paints it above the near plane, so
 * the cards ride the wall under the camera drift and are never fogged or cut by the curtain). Card and text fade
 * together (the kit card-entry rule) and every card is reported to the card audit with cardProbe.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, cardProbe, textRole } from '../../../film/silhouette/type';
import { paperTone } from './caseBoard';
import { capSize } from './ch13-s01-kit';

type C = CanvasRenderingContext2D;
export const QCARD = { w: 170, h: 112 } as const;

export interface QuestionCardDraw {
  /** card centre (layer px) */
  x: number;
  y: number;
  /** px per board unit */
  k: number;
  text: string;
  /** 0..1 lamp light on the paper */
  light?: number;
  alpha?: number;
  /** draw the brass pin (false while a hand carries it) */
  pin?: boolean;
  /** a small tilt (radians) */
  rot?: number;
  /** where the pin goes, in board units in from the card's top-RIGHT corner (default: top centre, as K) */
  pinAt?: { x: number; y: number };
  /** the audit id */
  id?: string;
}

/** the pin's offset below the card's top edge, in board units (the pin point is (x, y - (QCARD.h / 2 - PIN_DY) k)) */
export const PIN_DY = 7;

export function questionCard(c: C, env: PaintEnv, o: QuestionCardDraw) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const k = o.k;
  const w = QCARD.w * k, h = QCARD.h * k;
  const light = o.light ?? 0.8;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  // the case board's card stock, pulled a little toward neutral card so the duskRose stage does not turn it pink
  const paper = mixLab(paperTone(env, light), '#d9d0bd', 0.2);
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.fillRect(-w / 2 + 2.5 * k, -h / 2 + 3.5 * k, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = withAlpha(env.mood.rim, 0.28 * light);
  c.fillRect(-w / 2, -h / 2, w, 1.2 * k);
  // the type: Special Elite at K's 19-unit size, never under a 24 px cap at 1080p (the reader must read it)
  const ink = mixLab(env.mood.ink, paper, 0.06);
  const font0 = `400 ${(19 * k).toFixed(1)}px ${FONT.typewriter}`;
  const size = capSize(c, font0, 24, env.pxScale || 1.5);
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const lines = wrap(c, o.text, w * 0.86);
  const lh = size * 1.12;
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  textRole(c, 'subject', () => lines.forEach((l, i) => c.fillText(l, 0, 3 * k + (i - (lines.length - 1) / 2) * lh)));
  cardProbe(c, o.id ?? 'questionCard', -w / 2, -h / 2, w, h, 1, 1);
  if (o.pin !== false) {
    c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
    const px = o.pinAt ? w / 2 - o.pinAt.x * k : 0;
    const py = o.pinAt ? -h / 2 + o.pinAt.y * k : -h / 2 + PIN_DY * k;
    c.beginPath();
    c.arc(px, py, 4.2 * k, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(env.mood.core, 0.55 * (0.3 + light));
    c.beginPath();
    c.arc(px - 1.2 * k, py - 1.2 * k, 1.6 * k, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** break on spaces, but keep each question whole where it fits (HOW FAR? / HOW FAST?) */
function wrap(c: C, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const out: string[] = [];
  let line = '';
  words.forEach((wd, i) => {
    const tryL = line ? `${line} ${wd}` : wd;
    if (line && c.measureText(tryL).width > maxW) {
      out.push(line);
      line = wd;
    } else line = tryL;
    // a question mark closes a line
    if (line.endsWith('?') && i < words.length - 1) {
      out.push(line);
      line = '';
    }
  });
  if (line) out.push(line);
  return out;
}
