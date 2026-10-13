/**
 * neural-net-history — ch11-s02's two quotation cards, pinned side by side below column C4 (level, same size):
 *   CARD19  the crisp 2019 card (IBM Plex Mono): GPT-2 is trained with a simple objective: predict the next word…
 *           (OpenAI, 2019 at the foot). 'predict the next word' can catch the lamp; each word can underline the next.
 *   CARD85  the yellowed 1985 card from the manila file (VT323, phosphor green on old stock): …practically nothing
 *           that current AI technology could draw from the raw text. (Lenat et al. (Cyc), 1985 at the foot); the key
 *           words underlined in faded ink.
 * World units are the study's L4 (rest-screen px at the BOARD camera). Later study shots in ch11 draw them too.
 */
import type { PaintEnv } from '../../../film';
import { hash1, mixLab, withAlpha } from '../../../film';
import { FONT } from '../../../film/silhouette/type';
import { DEFAULT_POOL, oxblood, poolAt } from './caseBoard';
import { STUDY } from './study';
import { boardStateAt, type BoardState, type Moment } from './studyState';

type C = CanvasRenderingContext2D;
export interface QuoteCardGeo {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: '2019' | '1985';
}
export const CARD19: QuoteCardGeo = { x: 886, y: 474, w: 152, h: 146, kind: '2019' };
export const CARD85: QuoteCardGeo = { x: 1058, y: 474, w: 152, h: 146, kind: '1985' };

const L19 = ['GPT-2 is trained', 'with a simple', 'objective: predict', 'the next word…'];
const SRC19 = 'OpenAI, 2019';
const L85 = ['…practically nothing', 'that current AI', 'technology could', 'draw from the raw', 'text.'];
const SRC85_LINES = ['Lenat et al. (Cyc),', '1985'] as const;
/** the words the 2019 card chains through, and which are 'predict the next word' */
const PREDICT = new Set([7, 8, 9, 10]);

export interface QuoteCardDraw {
  light: number;
  /** 2019: 'predict the next word' catches the lamp 0..1 */
  highlight?: number;
  /** 2019: 0..1 progress of each word underlining the next (old look; kept for other shots) */
  chain?: number;
  /** 2019: every next word its own answer: hops so far (float, one per word) from word `hopFrom` (default 1, 'is'):
   *  an arc runs from the word to the NEXT word, which lifts and gets a tick (its answer) */
  hop?: number;
  hopFrom?: number;
  /** 0..1 the hop marks fade out */
  hopFade?: number;
  /** 1985: faded underline under the key words 0..1 */
  underline?: number;
  /** soft focus (px) */
  blur?: number;
  alpha?: number;
}

interface WordBox {
  x: number;
  y: number;
  w: number;
}

export function drawQuoteCard(c: C, env: PaintEnv, g: QuoteCardGeo, o: QuoteCardDraw) {
  const m = env.mood;
  const old = g.kind === '1985';
  const x0 = g.x - g.w / 2, y0 = g.y - g.h / 2;
  const L = Math.max(0, Math.min(1.2, o.light));
  c.save();
  if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
  if ((o.blur ?? 0) > 0.15) c.filter = `blur(${(o.blur ?? 0).toFixed(2)}px)`;
  // shadow, paper
  c.fillStyle = withAlpha(m.fg, 0.38);
  c.fillRect(x0 + 3, y0 + 4, g.w, g.h);
  const paper = old ? mixLab(mixLab('#cdb67a', m.set, 0.5), mixLab('#e2cf98', m.halo, 0.25), Math.min(1, 0.2 + L)) : mixLab(mixLab('#e9e2d0', m.set, 0.55), mixLab('#f6f0e2', m.halo, 0.15), Math.min(1, 0.2 + L));
  c.fillStyle = paper;
  c.fillRect(x0, y0, g.w, g.h);
  if (old) {
    // foxing and a darker age band at the edges
    for (let i = 0; i < 18; i++) {
      c.fillStyle = withAlpha('#8a6a30', 0.08 + 0.06 * (hash1(i, 31) * 0.5 + 0.5));
      c.beginPath();
      c.arc(x0 + (0.5 + 0.5 * hash1(i, 32)) * g.w, y0 + (0.5 + 0.5 * hash1(i, 33)) * g.h, 1 + 2.5 * (0.5 + 0.5 * hash1(i, 34)), 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = withAlpha('#6e5222', 0.25);
    c.lineWidth = 3;
    c.strokeRect(x0 + 1.5, y0 + 1.5, g.w - 3, g.h - 3);
  } else {
    // a printed rule under the head margin
    c.fillStyle = withAlpha(oxblood(env, 0.2), 0.45);
    c.fillRect(x0 + 10, y0 + 13, g.w - 20, 0.9);
  }
  // the pin
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.beginPath();
  c.arc(g.x, y0 + 7, 3.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(m.core, 0.55);
  c.beginPath();
  c.arc(g.x - 1, y0 + 6, 1.3, 0, Math.PI * 2);
  c.fill();

  const inkCol = old ? '#1d5226' : '#1d2236';
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  if (!old) {
    const size = 11.4;
    c.font = `500 ${size}px ${FONT.mono}`;
    const lh = size * 1.55;
    const top = y0 + 32;
    const words: WordBox[] = [];
    L19.forEach((ln, i) => {
      let x = x0 + 11;
      const y = top + i * lh;
      for (const wd of ln.split(' ')) {
        const w = c.measureText(wd).width;
        words.push({ x, y, w });
        x += w + c.measureText(' ').width;
      }
    });
    // 'predict the next word' catches the lamp: a warm wash behind those words
    const hl = o.highlight ?? 0;
    if (hl > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (const i of PREDICT) {
        const wb = words[i];
        const gg = c.createRadialGradient(wb.x + wb.w / 2, wb.y - size * 0.35, 1, wb.x + wb.w / 2, wb.y - size * 0.35, wb.w * 0.9 + 8);
        gg.addColorStop(0, withAlpha(m.core, 0.75 * hl));
        gg.addColorStop(1, withAlpha(m.core, 0));
        c.fillStyle = gg;
        c.fillRect(wb.x - 12, wb.y - size * 1.4, wb.w + 24, size * 2.1);
      }
      c.restore();
    }
    // every next word its own answer: which word is lifting right now (the answer of the current hop)
    const hop = o.hop ?? 0;
    const from = o.hopFrom ?? 1;
    const hopK = 1 - (o.hopFade ?? 0);
    const hj = Math.floor(hop);
    const hf = hop - hj;
    const ansIdx = hop > 0 && hopK > 0 ? Math.min(words.length - 1, from + hj + 1) : -1;
    // the answer's lift: up 2.5 px with a lamp glint behind it while its hop lands (hf 0.4 → 1)
    const liftK = ansIdx >= 0 ? Math.sin(Math.min(1, Math.max(0, (hf - 0.35) / 0.65)) * Math.PI) * hopK : 0;
    if (liftK > 0.01) {
      const wb = words[ansIdx];
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gg = c.createRadialGradient(wb.x + wb.w / 2, wb.y - size * 0.4, 1, wb.x + wb.w / 2, wb.y - size * 0.4, wb.w * 0.8 + 10);
      gg.addColorStop(0, withAlpha(m.core, 0.8 * liftK));
      gg.addColorStop(1, withAlpha(m.core, 0));
      c.fillStyle = gg;
      c.fillRect(wb.x - 14, wb.y - size * 1.6, wb.w + 28, size * 2.4);
      c.restore();
    }
    // the words
    let k = 0;
    L19.forEach((ln) => {
      for (const wd of ln.split(' ')) {
        const wb = words[k];
        // (one weight throughout, a preloaded face: the lamp's wash and a deeper ink carry the emphasis)
        c.fillStyle = PREDICT.has(k) && hl > 0.01 ? mixLab(inkCol, '#000000', 0.45 * hl) : inkCol;
        c.font = `500 ${size}px ${FONT.mono}`;
        c.fillText(wd, wb.x, wb.y - (k === ansIdx ? 2.5 * liftK : 0));
        k++;
      }
    });
    // the hops: an arc from each asking word to the next (drawn on in the hop's first half), a tick over the answer
    if (hop > 0 && hopK > 0) {
      c.save();
      c.strokeStyle = oxblood(env, 0.15);
      c.lineCap = 'round';
      for (let j = 0; j <= hj && from + j + 1 < words.length; j++) {
        const a = words[from + j], nb = words[from + j + 1];
        const cur = j === hj;
        const u = cur ? Math.min(1, hf / 0.45) : 1;
        if (u <= 0) continue;
        c.globalAlpha = hopK * (cur ? 1 : 0.4);
        c.lineWidth = cur ? 1.5 : 1;
        const ax = a.x + a.w / 2, ay = a.y - size - 1;
        const bx = nb.x + nb.w / 2, by = nb.y - size - 1;
        const same = Math.abs(a.y - nb.y) < 1;
        const cx = same ? (ax + bx) / 2 : Math.max(ax, bx) + 26, cy = same ? Math.min(ay, by) - 9 : (ay + by) / 2 - 4;
        c.beginPath();
        c.moveTo(ax, ay);
        const n = 14;
        for (let q = 1; q <= n * u; q++) {
          const v = q / n, w = 1 - v;
          c.lineTo(w * w * ax + 2 * w * v * cx + v * v * bx, w * w * ay + 2 * w * v * cy + v * v * by);
        }
        c.stroke();
        if (u >= 1) {
          // the arrowhead / tick: this next word is its answer
          c.beginPath();
          c.moveTo(bx - 3, by - 3.5);
          c.lineTo(bx, by);
          c.lineTo(bx + 3, by - 3.5);
          c.stroke();
        }
      }
      c.restore();
    }
    // each word underlines the word after it (its own right answer)
    const ch = o.chain ?? 0;
    if (ch > 0) {
      const N = words.length;
      const p = ch * (N - 1);
      const cur = Math.min(N - 2, Math.floor(p));
      const fr = p - cur;
      c.strokeStyle = oxblood(env, 0.1);
      c.lineWidth = 1.3;
      c.lineCap = 'round';
      for (let j = 0; j <= cur; j++) {
        const nb = words[j + 1];
        const u = j < cur ? 1 : Math.min(1, fr * 1.6);
        c.beginPath();
        c.moveTo(nb.x, nb.y + 3);
        c.lineTo(nb.x + nb.w * u, nb.y + 3);
        c.stroke();
      }
      // the little hook from the asking word to its answer (only the current pair)
      if (ch < 1) {
        const a = words[cur], nb = words[cur + 1];
        const ax = a.x + a.w / 2, bx = nb.x + nb.w / 2;
        const sameLine = Math.abs(a.y - nb.y) < 1;
        c.globalAlpha *= 0.85;
        c.beginPath();
        if (sameLine) {
          c.moveTo(ax, a.y - size + 1);
          c.quadraticCurveTo((ax + bx) / 2, a.y - size - 7, bx, nb.y - size + 1);
        } else {
          c.moveTo(a.x + a.w + 2, a.y - 3);
          c.quadraticCurveTo(a.x + a.w + 12, (a.y + nb.y) / 2, bx, nb.y - size + 1);
        }
        c.stroke();
      }
    }
    // the source at the foot, legible at a medium (≥ 26 px at 1080p from the PAIR camera)
    c.font = `italic 500 ${11.5}px ${FONT.mono}`;
    c.fillStyle = withAlpha(inkCol, 0.85);
    c.fillText(SRC19, x0 + 11, y0 + g.h - 12);
  } else {
    const size = 15.2;
    c.font = `400 ${size}px ${FONT.phosphor}`;
    const lh = size * 1.12;
    const top = y0 + 30;
    c.fillStyle = inkCol;
    L85.forEach((ln, i) => c.fillText(ln, x0 + 10, top + i * lh));
    // faded underlines: 'practically nothing' and 'from the raw text'
    const u = o.underline ?? 0;
    if (u > 0) {
      c.strokeStyle = withAlpha(oxblood(env, 0.05), 0.8);
      c.lineWidth = 1.5;
      const seg = (line: number, from: string, to: string) => {
        const ln = L85[line];
        const a = c.measureText(ln.slice(0, ln.indexOf(from))).width;
        const b = to ? c.measureText(ln.slice(0, ln.indexOf(to) + to.length)).width : c.measureText(ln).width;
        const y = top + line * lh + 2.5;
        c.beginPath();
        c.moveTo(x0 + 10 + a, y + 0.4 * Math.sin(a));
        c.lineTo(x0 + 10 + a + (b - a) * u, y - 0.4);
        c.stroke();
      };
      seg(0, 'practically', 'nothing');
      seg(3, 'from', 'raw');
      seg(4, 'text.', '');
    }
    // the source at the foot, on two lines so it can be set large (≥ 26 px at 1080p from the PAIR camera)
    c.font = `400 ${14.5}px ${FONT.phosphor}`;
    c.fillStyle = withAlpha(inkCol, 0.88);
    const [s1, s2] = SRC85_LINES;
    c.fillText(s1, x0 + 10, y0 + g.h - 24);
    c.fillText(s2, x0 + 10, y0 + g.h - 9);
  }
  c.restore();
}

// =====================================================================================================
// THE LINEAGE (pinned in ch11-s02): a GENERATING WIKIPEDIA · 2018 card clear of C3's DATA card, and GPT as its own
// card at the head of C4. ch11's study shots draw these in place of the studyState's small C4-lineage card.
// =====================================================================================================
export const GW_CARD = { x: 884, y: 112, w: 116, h: 64 };
export const GPT_CARD = { x: 936, y: 198, w: 80, h: 46 };
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };

/** a small lineage card: lamp-lit paper, a brass pin, mono capitals */
export function lineageCard(c: C, env: PaintEnv, g: { x: number; y: number; w: number; h: number }, lines: string[], size: number, glow: number) {
  const m = env.mood;
  const x0 = g.x - g.w / 2, y0 = g.y - g.h / 2;
  const light = poolAt(POOL, g.x - STUDY.board.x, g.y - STUDY.board.y) + glow;
  c.save();
  c.fillStyle = withAlpha(m.fg, 0.36);
  c.fillRect(x0 + 3, y0 + 3, g.w, g.h);
  c.fillStyle = mixLab(mixLab('#e2d6b8', m.set, 0.5), mixLab('#f2e8cc', m.halo, 0.2), Math.min(1, 0.25 + light));
  c.fillRect(x0, y0, g.w, g.h);
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.beginPath();
  c.arc(g.x, y0 + 7, 3.4, 0, Math.PI * 2);
  c.fill();
  c.font = `500 ${size}px ${FONT.mono}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#1d2236';
  const lh = size * 1.2;
  const top = g.y + 5 - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => {
    const tw = c.measureText(l).width;
    const sc = Math.min(1, (g.w - 10) / tw);
    c.save();
    c.translate(g.x, top + i * lh);
    c.scale(sc, 1);
    c.fillText(l, 0, 0);
    c.restore();
  });
  c.restore();
}
export const GW_LINES = ['GENERATING', 'WIKIPEDIA · 2018'];
/** the oxblood thread from C3-d up the gutter, through GW, to GPT (world points) */
export const LINEAGE_PATH = [
  { x: 780, y: 445 },
  { x: 850, y: 380 },
  { x: 852, y: 210 },
  { x: GW_CARD.x - 30, y: GW_CARD.y + GW_CARD.h / 2 - 4 },
  { x: GW_CARD.x + 30, y: GW_CARD.y + GW_CARD.h / 2 - 4 },
  { x: GPT_CARD.x - 16, y: GPT_CARD.y - GPT_CARD.h / 2 + 7 },
];
/** both lineage cards and their thread, as pinned (for the ch11 study shots after s02) */
export function drawLineage(c: C, env: PaintEnv) {
  c.save();
  c.strokeStyle = oxblood(env, 0.4);
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  LINEAGE_PATH.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.stroke();
  c.restore();
  lineageCard(c, env, GW_CARD, GW_LINES, 12.6, 0.15);
  lineageCard(c, env, GPT_CARD, ['GPT'], 21, 0.15);
}
/** the board state for a ch11 study shot, without the studyState's small C4-lineage card (drawn by drawLineage) */
export function ch11Board(shot: string, when: Moment): BoardState {
  const st = boardStateAt(shot, when);
  return { ...st, cards: st.cards.filter((k) => k.id !== 'C4-lineage'), threads: st.threads.filter(([a, b]) => a !== 'C4-lineage' && b !== 'C4-lineage') };
}
