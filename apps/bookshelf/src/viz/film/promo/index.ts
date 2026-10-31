/**
 * film/promo — the PROMO kit (product-marketing films; script.json "look": "promo").
 *
 *   look.ts         canvas painters: paper, haze, bracket, kinetic, typed, steps, pill, squareDots, hairlines, replayMark
 *   RrwebScreen     cleaned rrweb takes of the product as frame-exact DOM (shot.dom()), browser chrome, tilt, zoom, cursor
 *   agentPair       the subtle developer ↔ critic beat: a recording handed back and forth, verdicts
 *   transitions     'blur' (blur dissolve) and 'whip' (horizontal whip-pan with motion blur)
 *   finish          promo finish for look 'promo': a whisper of grain, no flicker, no vignette, no bloom
 *
 * Side effects (imported by film/setup.ts): registers the transitions, the promo finish and the promo fonts.
 * Guide: .claude/skills/film-promo/SKILL.md
 */
import type { FinishFn, TransitionFn } from '../contracts';
import { registerFonts, registerTransition, setLookFinish } from '../core/registry';
import { PROMO, PROMO_FONTS, blurText, easeOut, font, hexA, measure } from './look';

export * from './look';
export { RrwebScreen, loadTake, takeIfLoaded, mark, rrSrc } from './RrwebScreen';
export type { RrTake, RrwebScreenProps } from './RrwebScreen';

// ---------------------------------------------------------------- transitions
const blurDissolve: TransitionFn = (out, a, b, u, env) => {
  const { W, H } = env;
  const e = u * u * (3 - 2 * u);
  const peak = Math.sin(Math.PI * u) * 14; // px of blur at the midpoint (stage px)
  out.save();
  if (peak > 0.3) out.filter = `blur(${(peak * env.pxScale).toFixed(1)}px)`;
  out.drawImage(a, 0, 0, W, H);
  out.globalAlpha = e;
  out.drawImage(b, 0, 0, W, H);
  out.restore();
};
const whip: TransitionFn = (out, a, b, u, env) => {
  const { W, H } = env;
  const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const blur = Math.sin(Math.PI * u) * 28 * env.pxScale;
  out.save();
  if (blur > 0.5) out.filter = `blur(${blur.toFixed(1)}px)`;
  out.drawImage(a, -e * W, 0, W, H);
  out.drawImage(b, (1 - e) * W, 0, W, H);
  out.restore();
};
registerTransition('blur', blurDissolve, 0.6);
registerTransition('whip', whip, 0.45);

// ---------------------------------------------------------------- finish
/** promo finish: clean frames with a whisper of static grain (seeded per frame), so gradients never band */
let grainTile: HTMLCanvasElement | null = null;
const promoFinish: FinishFn = (out, env) => {
  if (typeof document === 'undefined') return;
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = grainTile.height = 128;
    const g = grainTile.getContext('2d')!;
    const img = g.createImageData(128, 128);
    let s = 0x9e3779b9;
    for (let i = 0; i < img.data.length; i += 4) {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      const v = 128 + ((s >>> 0) % 64) - 32;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  out.save();
  out.globalAlpha = 0.035;
  out.globalCompositeOperation = 'overlay';
  const ox = (env.frame * 37) % 128, oy = (env.frame * 61) % 128;
  const pat = out.createPattern(grainTile, 'repeat');
  if (pat) {
    out.translate(-ox, -oy);
    out.fillStyle = pat;
    out.fillRect(0, 0, env.W + 128, env.H + 128);
  }
  out.restore();
};
setLookFinish('promo', promoFinish, null);
registerFonts(...PROMO_FONTS);

// ---------------------------------------------------------------- the agent pair (subtle beat)
export interface AgentExchange {
  /** film/shot-local seconds the recording leaves the developer */
  at: number;
  /** what the critic says back (short) */
  verdict: string;
  ok: boolean;
}

/**
 * Two small agent cards (developer left, critic right) and a recording chip that travels from the developer to the
 * critic on each exchange; the critic answers with a verdict pill (✕ red / ✓ green) and the chip returns. Meant to sit
 * small in a corner (scale ~0.6) or as one quiet beat. Pure function of t.
 */
export function agentPair(
  c: CanvasRenderingContext2D,
  o: {
    t: number;
    x: number;
    y: number;
    scale?: number;
    exchanges: AgentExchange[];
    labels?: [string, string];
    chip?: string;
    u?: number;
  },
) {
  const u = o.u ?? 1;
  if (u <= 0) return;
  const k = o.scale ?? 1;
  const [devL, critL] = o.labels ?? ['developer', 'critic'];
  c.save();
  c.globalAlpha *= easeOut(u);
  c.translate(o.x, o.y);
  c.scale(k, k);
  const cardW = 230, cardH = 92, gap = 210;
  const card = (x: number, label: string, glyph: 'code' | 'eye', active: number) => {
    c.save();
    c.shadowColor = 'rgba(40,10,60,.18)';
    c.shadowBlur = 24;
    c.shadowOffsetY = 8;
    c.fillStyle = '#fff';
    c.beginPath();
    c.roundRect(x, 0, cardW, cardH, 16);
    c.fill();
    c.restore();
    c.strokeStyle = hexA(PROMO.brand, 0.2 + 0.6 * active);
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(x + 0.5, 0.5, cardW - 1, cardH - 1, 16);
    c.stroke();
    // avatar
    c.fillStyle = glyph === 'code' ? hexA(PROMO.violet, 0.18) : hexA(PROMO.orange, 0.18);
    c.beginPath();
    c.arc(x + 40, cardH / 2, 22, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = glyph === 'code' ? PROMO.violet : PROMO.orange;
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    if (glyph === 'code') {
      c.moveTo(x + 33, cardH / 2 - 7); c.lineTo(x + 26, cardH / 2); c.lineTo(x + 33, cardH / 2 + 7);
      c.moveTo(x + 47, cardH / 2 - 7); c.lineTo(x + 54, cardH / 2); c.lineTo(x + 47, cardH / 2 + 7);
    } else {
      c.ellipse(x + 40, cardH / 2, 11, 7, 0, 0, Math.PI * 2);
      c.moveTo(x + 43, cardH / 2); c.arc(x + 40, cardH / 2, 3, 0, Math.PI * 2);
    }
    c.stroke();
    c.fillStyle = PROMO.ink;
    c.font = font(600, 17);
    c.fillText(label, x + 74, cardH / 2 - 4);
    c.fillStyle = PROMO.mute;
    c.font = font(400, 13, true);
    c.fillText('agent', x + 74, cardH / 2 + 16);
  };
  const devX = 0, critX = cardW + gap;
  // which exchange is live
  let live = -1;
  for (let i = 0; i < o.exchanges.length; i++) if (o.t >= o.exchanges[i].at) live = i;
  const ex = live >= 0 ? o.exchanges[live] : null;
  const lt = ex ? o.t - ex.at : 0;
  card(devX, devL, 'code', ex ? Math.max(0, 1 - lt / 0.6) : 0);
  card(critX, critL, 'eye', ex ? Math.min(1, Math.max(0, (lt - 0.7) / 0.3)) : 0);
  // the rail
  c.strokeStyle = PROMO.faint;
  c.setLineDash([3, 6]);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(devX + cardW + 12, cardH / 2);
  c.lineTo(critX - 12, cardH / 2);
  c.stroke();
  c.setLineDash([]);
  if (ex) {
    // chip: dev → critic over 0.75 s (arc), verdict at 0.9 s, chip back by 1.9 s
    const go = Math.min(1, lt / 0.75);
    const back = Math.max(0, Math.min(1, (lt - 1.3) / 0.6));
    const p = back > 0 ? 1 - back : go;
    const ep = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const x0 = devX + cardW + 4, x1 = critX - 4;
    const cx = x0 + (x1 - x0) * ep;
    const cy = cardH / 2 - Math.sin(Math.PI * ep) * 26;
    const label = o.chip ?? '▶ replay recording';
    const w = measure(c, label, 12, 600, true) + 22;
    c.save();
    c.fillStyle = PROMO.ink;
    c.beginPath();
    c.roundRect(cx - w / 2, cy - 13, w, 26, 13);
    c.fill();
    c.fillStyle = '#fff';
    c.font = font(600, 12, true);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, cx, cy + 1);
    c.restore();
    // verdict pill under the critic
    const vu = Math.max(0, Math.min(1, (lt - 0.85) / 0.25));
    if (vu > 0) {
      const col = ex.ok ? PROMO.green : PROMO.coral;
      const text = `${ex.ok ? '✓' : '✕'}  ${ex.verdict}`;
      const vw = measure(c, text, 14, 500) + 26;
      c.save();
      c.globalAlpha *= easeOut(vu);
      c.fillStyle = hexA(col, 0.12);
      c.beginPath();
      c.roundRect(critX + cardW / 2 - vw / 2, cardH + 14, vw, 30, 15);
      c.fill();
      c.restore();
      blurText(c, text, critX + cardW / 2, cardH + 34, { size: 14, weight: 500, u: vu, color: col, align: 'center', rise: 4 });
    }
  }
  c.restore();
}
