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
  /** 2019: 0..1 progress of the gold sheen sweeping 'predict the next word' (outside 0..1: none) */
  sheen?: number;
  /** 2019: every next word its own answer: hops so far (float, up to 5) from word `hopFrom` (default 6, 'objective:'):
   *  a lamp-gold underline under word n arcs on to word n+1 */
  hop?: number;
  hopFrom?: number;
  /** the hop line width in card units (default: 3 px at 1080p under the current transform) */
  hopLw?: number;
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

/** the 'predict the next word' rows: one box per line, in reading order (card units) */
function predictRows(words: WordBox[], size: number): { x: number; y: number; w: number }[] {
  const rows: { x: number; y: number; w: number }[] = [];
  for (const i of PREDICT) {
    const wb = words[i];
    const r = rows.find((q) => Math.abs(q.y - wb.y) < 1);
    if (r) r.w = wb.x + wb.w - r.x;
    else rows.push({ x: wb.x, y: wb.y, w: wb.w });
  }
  void size;
  return rows;
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
    // 'predict the next word' catches the lamp (review round 3): a feathered warm glow CLIPPED TO THE CARD behind
    // those words only (6-8 px of soft falloff at 1080p, never a hard-edged box), then a short gold sheen that sweeps
    // across them in reading order ('predict' → 'the next word…')
    const hl = o.highlight ?? 0;
    const sheen = o.sheen ?? -1;
    const devPx = Math.max(0.2, Math.hypot(c.getTransform().a, c.getTransform().b)); // device px per card unit
    const toDev1080 = (px1080: number) => (px1080 * (env.pxScale || 1.5)) / 1.5; // 1080p px → device px
    const rows = predictRows(words, size);
    if (hl > 0.01 || (sheen > 0 && sheen < 1)) {
      c.save();
      c.beginPath();
      c.rect(x0 + 0.5, y0 + 0.5, g.w - 1, g.h - 1);
      c.clip();
      if (hl > 0.01) {
        const feather = toDev1080(7); // the falloff, in device px
        c.filter = `blur(${(feather + (o.blur ?? 0) * devPx * 0.5).toFixed(2)}px)`;
        c.fillStyle = withAlpha(mixLab(m.halo, '#f2c56a', 0.55), 0.55 * hl);
        for (const r of rows) {
          c.beginPath();
          c.roundRect(r.x - 2, r.y - size * 0.95, r.w + 4, size * 1.3, 3);
          c.fill();
        }
        c.filter = 'none';
      }
      if (sheen > 0 && sheen < 1) {
        // one band travelling the concatenated rows (reading order), clipped to the soft word boxes
        const total = rows.reduce((a, r) => a + r.w + 8, 0);
        let pos = -14 + (total + 28) * sheen;
        c.globalCompositeOperation = 'lighter';
        for (const r of rows) {
          const bx = r.x - 4 + pos;
          pos -= r.w + 8;
          if (bx < r.x - 20 || bx > r.x + r.w + 24) continue;
          c.save();
          c.beginPath();
          c.roundRect(r.x - 3, r.y - size * 1.0, r.w + 6, size * 1.4, 3);
          c.clip();
          const band = c.createLinearGradient(bx - 9, 0, bx + 9, 0);
          band.addColorStop(0, withAlpha('#ffd27a', 0));
          band.addColorStop(0.5, withAlpha('#ffd27a', 0.55));
          band.addColorStop(1, withAlpha('#ffd27a', 0));
          c.fillStyle = band;
          c.fillRect(bx - 10, r.y - size * 1.1, 20, size * 1.6);
          c.restore();
        }
      }
      c.restore();
    }
    // every next word its own right answer (review round 3): a lamp-gold underline (3 px at 1080p) runs under word n
    // and arcs on to word n+1, one hop at a time; earlier hops stay, dimmed
    const hop = o.hop ?? 0;
    const from = o.hopFrom ?? 6;
    const hopK = 1 - (o.hopFade ?? 0);
    const hj = Math.floor(hop);
    const hf = hop - hj;
    const ansIdx = hop > 0 && hopK > 0 && hf > 0.55 ? Math.min(words.length - 1, from + hj + 1) : -1;
    const liftK = ansIdx >= 0 ? Math.sin(Math.min(1, (hf - 0.55) / 0.45) * Math.PI) * hopK : 0;
    // the words
    let k = 0;
    L19.forEach((ln) => {
      for (const wd of ln.split(' ')) {
        const wb = words[k];
        // (one weight throughout, a preloaded face: the lamp's glow and a deeper ink carry the emphasis)
        c.fillStyle = PREDICT.has(k) && hl > 0.01 ? mixLab(inkCol, '#000000', 0.45 * hl) : inkCol;
        c.font = `500 ${size}px ${FONT.mono}`;
        c.fillText(wd, wb.x, wb.y - (k === ansIdx ? 1.6 * liftK : 0));
        k++;
      }
    });
    if (hop > 0 && hopK > 0) {
      const gold = mixLab('#b9831f', m.halo, 0.12);
      const lw = Math.max(0.6, o.hopLw ?? toDev1080(3) / devPx);
      c.save();
      c.strokeStyle = gold;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.lineWidth = lw;
      const last = words.length - 1;
      for (let j = 0; j <= hj && from + j <= last; j++) {
        const a = words[from + j];
        const cur = j === hj;
        c.globalAlpha = hopK * (cur ? 1 : 0.5);
        // the underline under word n (first 55 % of its hop)
        const uu = cur ? Math.min(1, hf / 0.55) : 1;
        const uy = a.y + 2.6;
        if (uu > 0) {
          c.beginPath();
          c.moveTo(a.x, uy);
          c.lineTo(a.x + a.w * uu, uy);
          c.stroke();
        }
        // the arc on to word n+1 (the rest of the hop)
        if (from + j + 1 > last || from + j + 1 >= from + 5) continue;
        const ua = cur ? Math.max(0, Math.min(1, (hf - 0.55) / 0.45)) : 1;
        if (ua <= 0) continue;
        const nb = words[from + j + 1];
        const vy = nb.y + 2.6;
        const P0 = { x: a.x + a.w, y: uy };
        const P3 = { x: nb.x, y: vy };
        const same = Math.abs(a.y - nb.y) < 1;
        // same line: a small hop up over the space; next line: out past the word, down the gap and back to the margin
        const P1 = same ? { x: P0.x + 3, y: uy - size * 0.9 } : { x: P0.x + 10, y: uy + size * 0.7 };
        const P2 = same ? { x: P3.x - 3, y: vy - size * 0.9 } : { x: P3.x - 14, y: vy - size * 0.9 };
        c.beginPath();
        c.moveTo(P0.x, P0.y);
        const n = 18;
        for (let q = 1; q <= n * ua; q++) {
          const v = q / n, w = 1 - v;
          c.lineTo(w * w * w * P0.x + 3 * w * w * v * P1.x + 3 * w * v * v * P2.x + v * v * v * P3.x, w * w * w * P0.y + 3 * w * w * v * P1.y + 3 * w * v * v * P2.y + v * v * v * P3.y);
        }
        c.stroke();
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
    // the lines; each underline starts exactly under its first letter
    // (review round 3: the 'from' underline started at the space before it)
    const u = o.underline ?? 0;
    const UL: Record<number, [string, string]> = { 0: ['practically', 'nothing'], 3: ['from', 'raw'], 4: ['text.', ''] };
    c.fillStyle = inkCol;
    L85.forEach((ln, i) => {
      const y = top + i * lh;
      const ul = UL[i];
      if (!ul) {
        c.fillText(ln, x0 + 10, y);
        return;
      }
      const ia = ln.indexOf(ul[0]);
      // (search for the end word AFTER the start word: 'raw' also occurs inside 'draw', which ran the 'from the raw'
      // underline backwards over the space before 'from')
      const ib = ul[1] ? ln.indexOf(ul[1], ia) + ul[1].length : ln.length;
      // (measured at 100 px and scaled, so hinted advances at the small nominal size cannot drift the offsets)
      c.font = `400 100px ${FONT.phosphor}`;
      const kk = size / 100;
      const full = c.measureText(ln).width * kk;
      const xa = x0 + 10 + full - c.measureText(ln.slice(ia)).width * kk;
      const xb = x0 + 10 + full - (ib < ln.length ? c.measureText(ln.slice(ib)).width * kk : 0);
      c.font = `400 ${size}px ${FONT.phosphor}`;
      c.fillText(ln, x0 + 10, y);
      if (u > 0) {
        // faded ink: 'practically nothing' and 'from the raw text'
        c.save();
        c.strokeStyle = withAlpha(oxblood(env, 0.05), 0.8);
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(xa + 0.6, y + 2.5 + 0.4 * Math.sin(xa));
        c.lineTo(xa + 0.6 + (xb - xa - 0.6) * u, y + 2.1);
        c.stroke();
        c.restore();
        c.fillStyle = inkCol;
      }
    });
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
