/**
 * ch12-s07 — THE END (card, parchment; fadeBlack in from ch12-s06's held palm; 21.6 s; no narration).
 *
 *   (the fade)  as ch12-s06 darkens through the fadeBlack, the copper wire under the dock stays lit: this shot's SVG
 *               overlay lays a thin warm line over exactly where s06 leaves the wire on screen (sets/ch12-s06-close
 *               wireOnScreen at CLOSE_END_CAM), so the frame darkens to black AROUND it and it is the last light
 *   out (0.2)   a single relay clack (the score's last strike): the wire flicks once and goes out
 *   card (0.5)  the parchment end card comes up out of the black with the fade: the as-of line set plain in the house
 *               serif, the commit hash in monospace (PJ17)
 *   credits (6) a swap (no ghost text) to the credits in the house serif
 *   sources (13.5) a swap to the one static sources card: the address of the full list (the hash is on the end card)
 *   black (21.4) card and paper go down to black together. Silence after the clack; no final chord.
 * No logos, no publisher's name, no imprint. The parchment carries the title card's ghost (ch01-s08): the workshop's
 * window mullions at a breath of opacity, so the film's first card and last card share one sheet.
 */
import { Timeline } from '../../../core';
import type { Frame, PaintEnv } from '../../../film';
import { CAMERA3_HOME, FONT, MOODS, defineShot, drawTracked, hash1, legibleSize, mixLab, rule, textProbe, textRole, withAlpha } from '../../../film';
import { CLOSE_END_CAM, wireOnScreen } from '../sets/ch12-s06-close';

type C = CanvasRenderingContext2D;
const ID = 'ch12-s07';

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));

// the cards' words (script onScreenText, verbatim; laid out on rows)
const ASOF_1 = 'As of 27 October 2026,';
const ASOF_2A = 'main is still at ';
const ASOF_HASH = '257856e';
const ASOF_2B = '.';
const CREDITS: [string, string][] = [
  ['Written & coded by ', 'Claude Opus 5.5'],
  ['Voice: ', 'ElevenLabs'],
  ['Music: ', 'Strudel'],
];
const SOURCES_HEAD = 'SOURCES';
const SOURCES_URL = 'orly.brett-lamy.workers.dev/generated/handwired-explained/sources';

/** the wire as it leaves ch12-s06 (screen px) */
const WIRE = wireOnScreen(CLOSE_END_CAM);

interface Beats {
  out: number;
  card: number;
  credits: number;
  sources: number;
  black: number;
  /** the paper is laid under the black the instant the wire has gone out */
  on: number;
  D: number;
}

/** a card swap at beat B: out over [B - 0.5, B - 0.06], in over [B - 0.06, B + 0.6] */
function swap(t: number, B: number) {
  return { out: 1 - win(t, B - 0.5, B - 0.06), in: win(t, B - 0.06, B + 0.6) };
}

/** the last light: 1 while the frame darkens round it, a flick on the clack, then out */
function wireLight(t: number, out: number): number {
  if (t < out) return 1;
  const k = t - out;
  if (k < 0.03) return 1 + 0.5 * (k / 0.03);
  return 1.5 * Math.exp(-(k - 0.03) * 48);
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const out = T.beat('out');
    const b: Beats = { out, card: T.beat('card'), credits: T.beat('credits'), sources: T.beat('sources'), black: T.beat('black'), on: out + 0.12, D };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b;
    f.camera(CAMERA3_HOME);
    if (t < b.on) {
      // black: the wire is the overlay's, above the fade
      f.layer('L1', (c, env) => {
        c.fillStyle = mixLab(env.mood.fg, '#000000', 0.5);
        c.fillRect(-200, -200, 1680, 1120);
      });
      return;
    }
    // the lamp drifts across the sheet, very slowly (a held card that still breathes)
    const u = (t - b.on) / (b.D - b.on);
    f.backlight({ sunX: 560 + 140 * u, sunY: 300, intensity: 1 });
    f.layer('L2', (c, env) => {
      sheet(f, c, env);
      // the lamp's pool drifting slowly across the sheet (live: one gradient)
      const lx = 520 + 240 * u;
      const g = c.createRadialGradient(lx, 330, 0, lx, 330, 560);
      g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#fff6e2', 0.4), 0.22));
      g.addColorStop(1, withAlpha(env.mood.core, 0));
      c.fillStyle = g;
      c.fillRect(-120, -80, 1520, 880);
    });

    // ---- the type (screen-locked); each card's words swap with no ghost text
    const c = f.c;
    const ink = MOODS.parchment.ink;
    // sequential swaps: the outgoing words are gone the frame the incoming ones begin (no ghost text)
    const s2 = swap(t, b.credits);
    const s3 = swap(t, b.sources);
    const aAsof = s2.out;
    const aCred = s2.in * s3.out;
    const aSrc = s3.in;
    textRole(c, 'subject', () => {
      if (aAsof > 0.001) asOfCard(c, ink, aAsof);
      if (aCred > 0.001) creditsCard(c, ink, aCred);
      if (aSrc > 0.001) sourcesCard(c, ink, aSrc);
    });

    // ---- fade to black: card and paper go down together
    const k = win(t, b.black - 0.85, b.black);
    if (k > 0) {
      c.save();
      c.fillStyle = withAlpha(mixLab(f.mood.fg, '#000000', 0.5), k);
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }
  },
  overlay(s, scene) {
    const k = wireLight(s.t, scene.b.out);
    if (k <= 0.002) return null;
    const { x0, x1, y, ringR } = WIRE;
    const core = Math.min(1, k);
    const hot = Math.max(0, k - 1) * 2;
    const glow = (w: number, a: number, col: string) => (
      <line x1={x0} y1={y} x2={x1 - ringR} y2={y} stroke={col} strokeWidth={w} strokeOpacity={a} strokeLinecap="round" />
    );
    return (
      <g>
        <defs>
          <radialGradient id="ch12s07-end" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffd9a6" stopOpacity={0.55 * core + 0.3 * hot} />
            <stop offset="1" stopColor="#c87a3e" stopOpacity={0} />
          </radialGradient>
        </defs>
        {glow(26, 0.05 * core + 0.06 * hot, '#c87a3e')}
        {glow(12, 0.1 * core + 0.1 * hot, '#d38a4c')}
        {glow(5, 0.32 * core + 0.2 * hot, '#d9935a')}
        {glow(2.6, 0.95 * core, '#c97a40')}
        {glow(1.1, 0.8 * core, '#ffe8c6')}
        <circle cx={x1} cy={y} r={ringR} fill="none" stroke="#c97a40" strokeWidth={2.2} strokeOpacity={0.95 * core} />
        <ellipse cx={x1} cy={y} rx={38 + 20 * hot} ry={22 + 10 * hot} fill="url(#ch12s07-end)" />
      </g>
    );
  },
});

// ---------------------------------------------------------------- the sheet
/** parchment fibres and the title card's ghost mullions (baked once), and a lamp-lit falloff to the corners */
function sheet(f: Frame, c: C, env: PaintEnv) {
  f.cached(`${ID}/sheet/${env.mood.id}`, 1520, 880, (cc) => {
    cc.translate(120, 80);
    // the sheet itself, opaque (no backlight horizon running through the card like a fold): warm at the centre
    const base = cc.createRadialGradient(640, 300, 80, 640, 380, 980);
    base.addColorStop(0, mixLab(env.mood.sky[1], env.mood.core, 0.35));
    base.addColorStop(0.6, env.mood.sky[1]);
    base.addColorStop(1, mixLab(env.mood.sky[3], env.mood.set, 0.25));
    cc.fillStyle = base;
    cc.fillRect(-120, -80, 1520, 880);
    // the workshop's paned windows as bare mullions, a breath of them, fading toward the foot of the sheet
    cc.save();
    cc.globalAlpha = 0.045;
    // fading toward the foot of the sheet
    const mg = cc.createLinearGradient(0, -80, 0, 640);
    mg.addColorStop(0, 'rgba(58,38,20,1)');
    mg.addColorStop(0.35, 'rgba(58,38,20,0.9)');
    mg.addColorStop(1, 'rgba(58,38,20,0)');
    cc.fillStyle = mg;
    for (const cx of [-80, 250, 640, 1030, 1360]) {
      const w = 230, x0 = cx - w / 2;
      cc.fillRect(x0 - 10, -60, 10, 620);
      cc.fillRect(x0 + w, -60, 10, 620);
      cc.fillRect(cx - 4, -60, 8, 620);
      for (let j = 0; j <= 7; j++) cc.fillRect(x0, -20 + j * 72, w, 5);
    }
    cc.restore();
    // fibres
    for (let i = 0; i < 560; i++) {
      const x = (0.5 + 0.5 * hash1(i, 31)) * 1520 - 120;
      const y = (0.5 + 0.5 * hash1(i, 37)) * 880 - 80;
      const a = (0.5 + 0.5 * hash1(i, 41)) * Math.PI;
      const l = 4 + (0.5 + 0.5 * hash1(i, 43)) * 16;
      cc.strokeStyle = hash1(i, 47) > 0 ? 'rgba(110,86,52,0.07)' : 'rgba(255,250,236,0.09)';
      cc.lineWidth = 0.7;
      cc.beginPath();
      cc.moveTo(x, y);
      cc.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      cc.stroke();
    }
    // the lamp's falloff: the sheet's corners a step down
    const g = cc.createRadialGradient(640, 330, 260, 640, 360, 900);
    g.addColorStop(0, withAlpha(env.mood.set, 0));
    g.addColorStop(1, withAlpha(mixLab(env.mood.set, env.mood.fg, 0.3), 0.55));
    cc.fillStyle = g;
    cc.fillRect(-120, -80, 1520, 880);
  })(c, -120, -80);
}

// ---------------------------------------------------------------- the cards
function asOfCard(c: C, ink: string, a: number) {
  c.save();
  c.globalAlpha = a;
  c.fillStyle = ink;
  c.textBaseline = 'alphabetic';
  rule(c, 640, 262, 300, { color: ink, ornament: 'fleuron', alpha: 0.7 });
  // set plain in the house serif (preloaded faces only: FILM_FONTS)
  const size = legibleSize(c, `400 44px ${FONT.text}`, 44);
  const serif = `400 ${size}px ${FONT.text}`;
  drawTracked(c, ASOF_1, 640, 352, { font: serif, size, tracking: 0.01, align: 'center' });
  // the second row: serif, the hash in monospace, the full stop in serif again
  const mono = `500 ${Math.round(size * 0.9)}px ${FONT.mono}`;
  c.font = serif;
  const wA = c.measureText(ASOF_2A).width;
  const wB = c.measureText(ASOF_2B).width;
  c.font = mono;
  const wH = c.measureText(ASOF_HASH).width;
  const x0 = 640 - (wA + wH + wB) / 2;
  c.textAlign = 'left';
  c.font = serif;
  c.fillText(ASOF_2A, x0, 424);
  c.font = mono;
  c.fillText(ASOF_HASH, x0 + wA, 424);
  c.font = serif;
  c.fillText(ASOF_2B, x0 + wA + wH, 424);
  rule(c, 640, 470, 300, { color: ink, ornament: 'none', alpha: 0.5 });
  c.restore();
  textProbe(c, `${ID}-asof`, 640 - 330, 300, 660, 140, a);
}

function creditsCard(c: C, ink: string, a: number) {
  c.save();
  c.globalAlpha = a;
  c.textBaseline = 'alphabetic';
  const sizes = [40, 33, 33];
  const ys = [326, 392, 448];
  CREDITS.forEach(([role, name], i) => {
    const size = legibleSize(c, `500 ${sizes[i]}px ${FONT.text}`, sizes[i]);
    const roleFont = `italic 400 ${size}px ${FONT.text}`;
    const nameFont = `500 ${size}px ${FONT.text}`;
    c.font = roleFont;
    const wr = c.measureText(role).width;
    c.font = nameFont;
    const wn = c.measureText(name).width;
    const x0 = 640 - (wr + wn) / 2;
    c.textAlign = 'left';
    c.font = roleFont;
    c.fillStyle = mixLab(ink, '#6a5236', 0.35);
    c.fillText(role, x0, ys[i]);
    c.font = nameFont;
    c.fillStyle = ink;
    c.fillText(name, x0 + wr, ys[i]);
  });
  rule(c, 640, 254, 220, { color: ink, ornament: 'diamond', alpha: 0.6 });
  c.restore();
  textProbe(c, `${ID}-credits`, 640 - 360, 280, 720, 180, a);
}

function sourcesCard(c: C, ink: string, a: number) {
  c.save();
  c.globalAlpha = a;
  c.fillStyle = ink;
  c.textBaseline = 'alphabetic';
  const hs = legibleSize(c, `600 40px ${FONT.display}`, 40);
  drawTracked(c, SOURCES_HEAD, 640, 330, { font: `600 ${hs}px ${FONT.display}`, size: hs, tracking: 0.32, align: 'center' });
  rule(c, 640, 362, 300, { color: ink, ornament: 'fleuron', alpha: 0.7 });
  const us = legibleSize(c, `400 26px ${FONT.mono}`, 26, SOURCES_URL);
  c.font = `400 ${us}px ${FONT.mono}`;
  c.textAlign = 'center';
  c.fillStyle = mixLab(ink, '#4a3826', 0.2);
  c.fillText(SOURCES_URL, 640, 420);
  c.restore();
  textProbe(c, `${ID}-sources`, 640 - 480, 290, 960, 150, a);
}
