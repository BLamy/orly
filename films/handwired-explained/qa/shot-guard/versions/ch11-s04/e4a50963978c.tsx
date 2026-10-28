/**
 * ch11-s04 — TOML: STRUCK BY ITS OWN RULE, THEN SCOPED HONESTLY (plate, cooled to winterBlue; lampChange in; 21.75 s).
 *   L1107  "For TOML, another format: “By the rule fixed beforehand the track failed”."
 *   L1108  "It lost to a one-line hand-written fallback, every run."
 *   L1108a "The README is careful: the failure “does not say that training cannot work there.”"
 *   L1109  "This is how a belief should end: by a rule written before the test."
 *
 * The same parchment plate (sets/ch11-s03-plate), the dawnGold drained back to winterBlue by the lamp change. Tag 11
 * hangs at the right from its stub of line, the light now on its TOML half (the JSON half, riveted, in shade); its knot
 * card, the rule for failure, fixed beforehand, hangs beside it. The Lifespan Rule runs along the plate's foot, the
 * tag's one lifespan thread lying on it to about twelve days.
 *   0.3  toml      a short fragment of the TOML verdict (the narrator speaks it) sets in, upper left, with its attribution.
 *   4.62 failed    the knot card swings down on its thread and lies across the TOML half like a straightedge.
 *   5.77 lost      the red-pencil hand enters from frame right and strikes the TOML half through ONCE, its pencil running
 *                  along the card's edge (struck by its own pre-set rule, not by anyone's judgement); it withdraws right.
 *                  At the strike the TOML half's own strand parts from the tag's thread and runs back along the rule to
 *                  its measured lifespan, one to two days (tied 15 October, failed by 16 October), and ends there in a
 *                  cut tip; the JSON strand keeps its glowing open tip at about twelve days, its arrow pointing right.
 *  10.18 careful   as the narrator reads the lab's own scoping (spoken only, not set), the other half of the TOML result
 *                  sets in as one small label: gradient descent, then trial and error, trained with TOML mistakes, came
 *                  level with 39 hand rules.
 *  16.21 belief    the light evens out and the camera eases back: both halves side by side on their stub, the JSON half
 *                  riveted with its open tip at twelve days, the TOML half struck, its strand ended at one to two days.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { cardPaperAlpha, cardProbe, defineShot, ghostOk, mixLab, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { copperOf } from '../sets/narratorHands';
import { borderTag, tagFrame, tagLocal } from '../sets/ch11-s02-border';
import { PLATE_CAM, PLATE_INK, P_INK, TAG11_PLATE, drawStub, pFont, pInk, plateNear11, plateRoom11, stubY } from '../sets/ch11-s03-plate';
import { TICKS, drawRule, drawThread, lifeX, type TagState } from '../sets/tagLine';

const ID = 'ch11-s04';
type C2 = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- layout (plate px)
const QUOTE = { x: 124, y: 150 };
const LABEL = { x: 124, y: 392 };
const RULE_P = { x0: 110, x1: 1170, y: 548 };
const KNOT = { x: TAG11_PLATE.x, y: stubY(TAG11_PLATE.x) };
const S = TAG11_PLATE.scale;
const TW = 60 * S, TH = 86 * S;
/** the rule card: three lines, hanging from its own thread to the right of the tag (rest), then laid across */
const CARD_LINES = ['the rule for', 'failure, fixed', 'beforehand'];
const CARD = { w: 154, pad: 10 };
const CARD_HOLE_REST = { x: TAG11_PLATE.x + TW / 2 + 10, y: TAG11_PLATE.eyeY - 10 };

interface Beats {
  D: number;
  toml: number;
  card: number;
  strike: number;
  scope: number;
  both: number;
  strikeAt: number;
  strikeDur: number;
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const strike = T.beat('strike');
    const strikeDur = 2.3;
    const b: Beats = {
      D: T.duration,
      toml: T.beat('toml'),
      card: T.beat('card'),
      strike,
      scope: T.beat('scope'),
      both: T.beat('both'),
      // the lead touches the paper (strike u = .35) on 'lost'
      strikeAt: strike - 0.35 * strikeDur,
      strikeDur,
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    // a touch closer on the plate, easing back on 'belief' to show both halves together
    const back = smr((t - (b.both - 0.2)) / 3.4);
    const cam: Camera3 = { x: lerp(652, PLATE_CAM.x, back), y: lerp(352, PLATE_CAM.y, back), z: lerp(22, PLATE_CAM.z, back), lens: 1 };
    f.camera(cam);
    plateRoom11(f);

    const st: TagState = { id: '11', x: TAG11_PLATE.x, y: TAG11_PLATE.eyeY, scale: S, knot: [], swing: 0.008, phase: 0.6, rivet: 1 };
    const fo = { knotAt: KNOT, tq };
    // the strike line across the TOML half (sets/tagLine drawTag's border strike: (.05w, .85h) -> (.46w, .3h))
    const p0 = tagLocal(st, fo, TW * 0.05, TH * 0.85);
    const p1 = tagLocal(st, fo, TW * 0.46, TH * 0.3);
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const uS = clamp01((tq - b.strikeAt) / b.strikeDur);
    const pp = tq >= b.strikeAt && uS < 0.93 ? hands.pencil('strike', uS, mid, { strikeW: len, strikeAngle: ang, scale: 1.25, entry: { x: 1460, y: 900 } }) : null;
    const stroke = tq < b.strikeAt ? 0 : pp ? pp.stroke ?? 0 : 1;
    st.tomlStrike = stroke;

    f.layer(PLATE_INK, (c, env) => {
      // the verdict: a short verbatim fragment and its attribution (the narrator speaks it)
      const qa = seg(t, b.toml - 0.05, b.toml + 0.5);
      pInk(c, '“the track failed”', QUOTE.x, QUOTE.y, { font: 'displayItalic', size: 60, weight: 600, alpha: qa, id: `${ID}-quote` });
      pInk(c, '— the recovery parser README, TOML', QUOTE.x + 4, QUOTE.y + 46, { font: 'italic', size: 24, alpha: qa, color: mixLab(P_INK, '#4a5560', 0.35), id: `${ID}-attr` });
      // the Lifespan Rule along the plate's foot, and the tag's strands on it
      drawRule(c, env, { x0: RULE_P.x0, x1: RULE_P.x1, y: RULE_P.y, labels: 0 });
      // its four labels in the plate's own ink (the set's pale labels are for the dark workshop)
      for (const tk of TICKS) if (tk.label) pInk(c, tk.label, lifeX(tk.days, { x0: RULE_P.x0, x1: RULE_P.x1 }), RULE_P.y + 52, { font: 'italic', size: 17, align: 'center', alpha: 0.62, legible: false });
      strands(c, env, st, t, b);
      // the tag on its stub: the light on the TOML half until 'belief', then even
      drawStub(c, env, copperOf(env, 0.4));
      const shade = 0.85 * (1 - seg(t, b.both - 0.1, b.both + 1.2));
      borderTag(c, env, st, { ...fo, shade: { half: 'json', u: shade }, bison: 1, bisonLen: 22 });
      ruleCard(c, env, t, tq, b, st, p0, ang, len);
      scopeLabel(c, env, t, b);
      if (pp) hands.draw(c, pp, env);
    });
    plateNear11(f);
  },
});

/**
 * The tag's lifespan strands on the plate's rule: one thread to about twelve days until the strike; then the TOML
 * strand parts (it moves to its own lane, from the TOML half) and runs back to one to two days, ending in a cut tip.
 */
function strands(c: C2, env: PaintEnv, st: TagState, t: number, b: Beats) {
  const fr = tagFrame(st, { knotAt: KNOT, tq: twos(t) });
  const bottom = { x: fr.eye.x, y: fr.eye.y + fr.h };
  const r = { x0: RULE_P.x0, x1: RULE_P.x1 };
  const part = seg(t, b.strike + 0.15, b.strike + 0.6);
  const run = seg(t, b.strike + 0.3, b.strike + 1.7);
  // JSON: from the JSON half, to about twelve days, open (still held as of 27 October 2026)
  drawThread(c, env, { x: bottom.x - 16 * part, y: bottom.y }, lifeX(12, r), 'open', 1, { ruleY: RULE_P.y });
  if (part > 0.001) {
    const lx = lerp(lifeX(12, r), lifeX(1.5, r), run);
    drawThread(c, env, { x: bottom.x + 16 * part, y: bottom.y }, lx, 'cut', 1, { ruleY: RULE_P.y + 6 * part });
  }
}

/** the rule card: hanging beside the TOML half, legible; on 'failed' it swings down and lies across it as a straightedge */
function ruleCard(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, st: TagState, p0: Pt, ang: number, len: number) {
  const eye = tagFrame(st, { knotAt: KNOT, tq }).eye;
  const fs = parseFloat((/(\d+(?:\.\d+)?)px/.exec(pFont(c, { font: 'italic', size: 24 }, 'the rule for')) ?? [])[1] ?? '24');
  const H = CARD_LINES.length * fs * 1.1 + CARD.pad * 1.4;
  const W = Math.max(CARD.w, len * 1.02);
  // the swing (on twos): rest -> laid along the strike line (its top edge on the line, the card below-right of it)
  const u = clamp01((tq - (b.card - 0.15)) / 0.6);
  let e = u < 1 ? 1 - Math.pow(1 - u, 3) + 0.08 * Math.sin(u * Math.PI) : 1;
  // once the stroke is drawn the card swings back up to hang beside the tag, so the struck half shows
  const back = clamp01((tq - (b.strike + 0.75)) / 0.7);
  if (back > 0) e *= 1 - (back * back * (3 - 2 * back));
  const rest = { x: CARD_HOLE_REST.x, y: CARD_HOLE_REST.y, a: 0.04 + 0.02 * Math.sin(tq * 1.3) };
  const laid = { x: p0.x - Math.sin(ang) * 2, y: p0.y + Math.cos(ang) * 2, a: ang };
  const x = lerp(rest.x, laid.x, e), y = lerp(rest.y, laid.y, e);
  const a = lerp(rest.a, laid.a, e);
  // its thread from the tag's eyelet to the card's corner hole
  c.strokeStyle = withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, 0.02), 0.85);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(eye.x + 2, eye.y + 3);
  c.lineTo(x, y);
  c.stroke();
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(3, 4, W, H);
  c.fillStyle = mixLab(mixLab('#f1e8d4', env.mood.core, 0.15), env.mood.haze, 0.05);
  c.fillRect(0, 0, W, H);
  // the edge the pencil runs along (the top edge, once laid)
  c.strokeStyle = withAlpha(mixLab('#6a5a46', P_INK, 0.3), 0.5);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 0.5);
  c.lineTo(W, 0.5);
  c.stroke();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7);
  c.beginPath();
  c.arc(6, 6, 2.2, 0, Math.PI * 2);
  c.fill();
  // three lines of ONE card (turned with it); laid across the tag it is opaque paper over the tag's front (a deliberate
  // occlusion, not two readable layers), so its lettering is drawn as ghostOk
  ghostOk(c, () => CARD_LINES.forEach((l, k) => pInk(c, l, CARD.pad + 4, CARD.pad * 0.6 + fs * (0.92 + k * 1.1), { font: 'italic', size: 24 })));
  c.restore();
  void t;
}

/** the other half of the TOML result, set as one small label on the lower half when the narrator reads the scoping */
function scopeLabel(c: C2, env: PaintEnv, t: number, b: Beats) {
  const inkAt = b.scope + 0.1;
  const A = cardPaperAlpha(t, inkAt, 0.45);
  if (A <= 0.001) return;
  const l1 = 'gradient descent, then trial and error, trained with TOML';
  const l2 = 'mistakes: level with 39 hand rules';
  const w1 = pInk(c, l1, LABEL.x, LABEL.y, { font: 'italic', size: 25, alpha: A, id: `${ID}-scope1` });
  pInk(c, l2, LABEL.x, LABEL.y + 36, { font: 'italic', size: 25, alpha: A, id: `${ID}-scope2` });
  // a short rule under it, ink on the plate (no paper: it is lettered straight on the sheet)
  c.strokeStyle = withAlpha(P_INK, 0.35 * A);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(LABEL.x, LABEL.y + 52);
  c.lineTo(LABEL.x + w1 * 0.3, LABEL.y + 52);
  c.stroke();
  cardProbe(c, `${ID}-scope`, LABEL.x, LABEL.y - 22, w1, 60, 0, A);
  void env;
}
