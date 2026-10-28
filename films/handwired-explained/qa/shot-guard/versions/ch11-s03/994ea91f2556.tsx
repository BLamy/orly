/**
 * ch11-s03 — JSON: "A CLEAR SUCCESS", AND A FAIR TALLY (plate, first dawnGold light; paper wipe in; 13.0 s).
 *   L1105 "JSON: “a clear success.”"
 *   L1106 "Though on new kinds of mistake, and on whole payloads written by agents, hand-written rules still won."
 *
 * A parchment plate warmed by the first dawnGold light (sets/ch11-s03-plate), the camera holding still so the plate
 * can be read (a breath of drift only). Tag 11 hangs at the right from a short stub of copper line, the light on its
 * JSON half (the TOML half in shade).
 *   0.3  plate     the README's verdict as a short fragment only (the narrator speaks it): “a clear success”, serif,
 *                  in quotation marks, with its attribution.
 *   2.23 success   the narrator's hands punch a copper rivet through the JSON half's corner (dry clack; kept).
 *   4.23 Though    a three-row tally strip slides up into the plate's lower left: paper bars on a ruled ground, lengths
 *                  exact to the numbers (% of payloads entirely right; final test run once; trained = mean of five
 *                  runs). Row one, familiar mistakes: trained 79.8 against hand rules 79.6, effectively a tie. Row two
 *                  (on "mistake"), unseen mistake types: 68.9 against 87.2. Each figure prints at its bar's tip as the
 *                  bar arrives; the bars grow from zero on twos.
 *   8.21 agents    row three grows: agent-written payloads, 46.3 against 56.7.
 *  10.85 won       the hand-rules figures of the two rows they won take a short ink underline.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { cardPaperAlpha, cardProbe, defineShot, mixLab, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { copperOf } from '../sets/narratorHands';
import { KNOT_A, KNOT_B, borderTag, knotCards11, tagFrame, tagLocal } from '../sets/ch11-s02-border';
import { PLATE_CAM, PLATE_INK, P_COPPER, P_INK, TAG11_PLATE, drawStub, pInk, plateNear11, plateRoom11, stubY } from '../sets/ch11-s03-plate';
import type { TagState } from '../sets/tagLine';

const ID = 'ch11-s03';
type C2 = CanvasRenderingContext2D;
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- the facts (script ch11-s03, claims LB21 / LB19)
const ROWS = [
  { name: 'familiar mistakes', trained: 79.8, hand: 79.6 },
  { name: 'unseen mistake types', trained: 68.9, hand: 87.2 },
  { name: 'agent-written payloads', trained: 46.3, hand: 56.7 },
] as const;
const fmt = (v: number) => v.toFixed(1);

// ---------------------------------------------------------------- layout (plate px)
const QUOTE = { x: 124, y: 150 };
const STRIP = { x: 100, y: 332, w: 760, h: 272 };
const BAR = { x0: 400, perPct: 3.9, th: 17, gap: 5 };
const rowY = (k: number) => STRIP.y + 76 + k * 66;
const KNOT = { x: TAG11_PLATE.x, y: stubY(TAG11_PLATE.x) };

interface Beats {
  D: number;
  plate: number;
  rivet: number;
  tally: number;
  mistake: number;
  agents: number;
  won: number;
  rivetAt: number;
  rivetDur: number;
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const rivet = T.beat('rivet');
    const rivetDur = 2.0;
    const b: Beats = {
      D: T.duration,
      plate: T.beat('plate'),
      rivet,
      tally: T.beat('tally'),
      mistake: T.word('L1106', 'mistake'),
      agents: T.beat('agents'),
      won: T.word('L1106', 'won'),
      // the punch comes down (rivet u = .49) on 'success'
      rivetAt: rivet - 0.49 * rivetDur,
      rivetDur,
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    // the camera holds: a breath of drift only
    const cam: Camera3 = { ...PLATE_CAM, x: PLATE_CAM.x + 4 * Math.sin(t * 0.21), z: PLATE_CAM.z + 10 * sm(t / b.D) };
    f.camera(cam);
    plateRoom11(f);

    const st: TagState = {
      id: '11', x: TAG11_PLATE.x, y: TAG11_PLATE.eyeY, scale: TAG11_PLATE.scale, knot: [], swing: 0.012, phase: 0.6,
      rivet: seg(tq, b.rivet - 0.02, b.rivet + 0.2),
    };
    const uR = clamp01((tq - b.rivetAt) / b.rivetDur);
    const rivetPt = tagLocal(st, { knotAt: KNOT, tq }, -TAG11_PLATE.scale * 60 * 0.3, 16 * TAG11_PLATE.scale);
    // the hands come up from below the plate, left of the tag (the lower left of this inset), not from the frame's far
    // corner: the forearm then stays short instead of spanning the whole sheet
    const hp = tq >= b.rivetAt && uR < 0.93 ? hands.act('rivet', uR, rivetPt, { scale: 1.4, entry: { R: { x: 720, y: 930 }, L: { x: 600, y: 980 } } }) : null;

    f.layer(PLATE_INK, (c, env) => {
      // the verdict: a short verbatim fragment and its attribution (the narrator speaks it)
      const qa = seg(t, b.plate - 0.05, b.plate + 0.5);
      pInk(c, '“a clear success”', QUOTE.x, QUOTE.y, { font: 'displayItalic', size: 60, weight: 600, alpha: qa, id: `${ID}-quote` });
      pInk(c, '— recovery parser README, 16 Oct 2026', QUOTE.x + 4, QUOTE.y + 46, { font: 'italic', size: 24, alpha: qa, color: mixLab(P_INK, '#6b5a44', 0.35), id: `${ID}-attr` });
      // tag 11 at the right on its stub of line: the light on the JSON half
      drawStub(c, env, copperOf(env, 0.5));
      thread(c, env, st, tq);
      borderTag(c, env, st, { knotAt: KNOT, tq, shade: { half: 'toml', u: 0.85 }, bison: 1, bisonLen: 22 });
      textRole(c, 'texture', () => knotCards11(c, env, tagFrame(st, { knotAt: KNOT, tq }).eye, [{ text: KNOT_A, kin: 1 }, { text: KNOT_B, kin: 1 }], 1.2, false));
      rivetClack(c, env, rivetPt, t, b.rivet);
      tally(c, env, t, tq, b);
      if (hp) hands.draw(c, hp, env);
    });
    plateNear11(f);
  },
});

/** the tag's one lifespan thread, hanging down out of the inset (the rule is not on this plate) */
function thread(c: C2, env: PaintEnv, st: TagState, tq: number) {
  const fr = tagFrame(st, { knotAt: KNOT, tq });
  const x = fr.eye.x, y0 = fr.eye.y + fr.h;
  const g = c.createLinearGradient(0, y0, 0, y0 + 90);
  g.addColorStop(0, withAlpha(mixLab('#8a7656', env.mood.ink, 0.2), 0.8));
  g.addColorStop(1, withAlpha(mixLab('#8a7656', env.mood.ink, 0.2), 0));
  c.strokeStyle = g;
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(x, y0);
  c.lineTo(x, y0 + 90);
  c.stroke();
}

/** the rivet's dry clack: a brief copper flash and two flecks of paper dust */
function rivetClack(c: C2, env: PaintEnv, p: { x: number; y: number }, t: number, at: number) {
  const u = (t - at) / 0.35;
  if (u < 0 || u > 1) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
  g.addColorStop(0, withAlpha(env.mood.core, 0.55 * (1 - u)));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(p.x - 26, p.y - 26, 52, 52);
  c.restore();
}

/** the tally strip: three rows of paper bars on a ruled ground (trained = copper paper, hand rules = ink paper) */
function tally(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const inkAt = b.tally + 0.08;
  const paper = cardPaperAlpha(t, inkAt);
  if (paper <= 0.001) return;
  const rise = (1 - seg(t, b.tally - 0.25, b.tally + 0.45)) * 26;
  const trainedCol = mixLab(P_COPPER, '#b8763e', 0.35);
  const handCol = mixLab(P_INK, '#3a3128', 0.3);
  c.save();
  c.translate(0, rise);
  // the strip: a paler slip of paper with fine rules, pinned at its top corners
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.16 * paper);
  c.fillRect(STRIP.x + 4, STRIP.y + 5, STRIP.w, STRIP.h);
  c.fillStyle = withAlpha(mixLab('#f2e8d2', env.mood.core, 0.2), 0.96 * paper);
  c.fillRect(STRIP.x, STRIP.y, STRIP.w, STRIP.h);
  c.strokeStyle = withAlpha('#7c6a52', 0.18 * paper);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let y = STRIP.y + 58; y < STRIP.y + STRIP.h - 6; y += 11) {
    c.moveTo(STRIP.x + 14, y);
    c.lineTo(STRIP.x + STRIP.w - 14, y);
  }
  c.stroke();
  // the zero line the bars grow from
  c.strokeStyle = withAlpha(P_INK, 0.45 * paper);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(BAR.x0, STRIP.y + 56);
  c.lineTo(BAR.x0, STRIP.y + STRIP.h - 14);
  c.stroke();
  const ink = clamp01((t - inkAt) / (3 / 24));
  // the header: "% of payloads entirely right · [copper] trained vs [ink] hand rules"
  const hy = STRIP.y + 38;
  const sw = (x: number, col: string) => {
    c.fillStyle = withAlpha(col, ink);
    c.fillRect(x, hy - 13, 22, 12);
  };
  let x = STRIP.x + 22;
  x += pInk(c, '% of payloads entirely right ·', x, hy, { font: 'italic', size: 23, alpha: ink, id: `${ID}-h1` }) + 12;
  sw(x, trainedCol);
  x += 28;
  x += pInk(c, 'trained vs', x, hy, { font: 'italic', size: 23, alpha: ink, id: `${ID}-h2` }) + 10;
  sw(x, handCol);
  x += 28;
  pInk(c, 'hand rules', x, hy, { font: 'italic', size: 23, alpha: ink, id: `${ID}-h3` });
  cardProbe(c, `${ID}-strip`, STRIP.x, STRIP.y, STRIP.w, STRIP.h, paper * 0.96, ink);
  // the rows: each grows from zero on twos as the narrator reaches it
  const starts = [b.tally + 0.2, b.mistake - 0.05, b.agents - 0.05];
  ROWS.forEach((r, k) => {
    const g0 = starts[k];
    const u = clamp01((tq - g0) / 0.75);
    const nameA = seg(t, g0 - 0.1, g0 + 0.15);
    if (nameA <= 0.001) return;
    const y = rowY(k);
    pInk(c, r.name, BAR.x0 - 16, y + BAR.th + BAR.gap / 2 + 7, { font: 'italic', size: 22, alpha: nameA, align: 'right', id: `${ID}-row${k}` });
    const grow = 1 - Math.pow(1 - u, 2.2);
    ([['trained', r.trained, trainedCol, 0], ['hand', r.hand, handCol, 1]] as const).forEach(([kind, v, col, i]) => {
      const by = y + i * (BAR.th + BAR.gap);
      const L = v * BAR.perPct * grow;
      if (L > 0.5) {
        c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18);
        c.fillRect(BAR.x0 + 2, by + 2, L, BAR.th);
        c.fillStyle = col;
        c.fillRect(BAR.x0, by, L, BAR.th);
        // the paper's torn end and a lighter top edge
        c.fillStyle = withAlpha('#fff7e6', 0.22);
        c.fillRect(BAR.x0, by, L, 2);
      }
      // the figure prints at the tip as the bar arrives
      const fa = seg(tq, g0 + 0.6, g0 + 0.85);
      if (fa > 0.001) {
        const fx = BAR.x0 + v * BAR.perPct + 9;
        const w = pInk(c, fmt(v), fx, by + BAR.th - 1.5, { font: 'serif', size: 22, weight: 600, alpha: fa, color: kind === 'trained' ? mixLab(P_COPPER, P_INK, 0.35) : P_INK, id: `${ID}-v${k}${i}` });
        // on 'won': the hand-rules figures of the rows the hand rules won take a short ink underline
        if (kind === 'hand' && k > 0) {
          const ul = seg(t, b.won - 0.1, b.won + 0.35);
          if (ul > 0.001) {
            c.strokeStyle = withAlpha(P_INK, 0.8);
            c.lineWidth = 1.6;
            c.beginPath();
            c.moveTo(fx, by + BAR.th + 3);
            c.lineTo(fx + w * ul, by + BAR.th + 3);
            c.stroke();
          }
        }
      }
    });
  });
  c.restore();
}

