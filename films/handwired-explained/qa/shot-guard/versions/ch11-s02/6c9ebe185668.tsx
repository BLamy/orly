/**
 * ch11-s02 — TAG 11 IS TIED ON, THE RULE FOR FAILURE FIXED FIRST (winterBlue, before dawn; cut in; 12.33 s).
 *   L1104 "Before testing, the lab tied on a tag: training can fill those entries. Then it fixed its rule for failure,
 *          and committed the test sets first."
 *
 * TAG-LINE STAGING, ch11 variant (WORKSHOP, BEFORE DAWN): the canonical workshop (sets/tagLine tagLineScene): L2 the
 * paned window wall, its cold blue beginning to warm toward the first dawnGold by the end; L3 the bench with the desk's
 * silhouette, the plates, the lamp (low) and the ledger cabinet beside it; L4 the copper line at 58 %, its tags as the
 * film left them, the Lifespan Rule; L6 the near post with the red pencil resting (the pencil hand does not appear).
 *
 * TEACHES (anchored to the words):
 *   0.5  ink        the narrator's hands carry a blank BORDER TAG in from the lower left (a dotted perforation down its
 *                   middle, the halves lettered JSON | TOML, a thinner third thread hanging from its lower edge, lettered
 *                   bison); its front inks in the house tag type while it is in the hands (a paraphrase, no quotes):
 *                   Gradient descent can fill a parser's unused entries. The camera pushes in to read it.
 *   2.32 tied       the hands tie it on (the knot pulls down: the detent's tie click); its first knot card threads on:
 *                   the recovery experiment. The front reads plainly while the narrator speaks the belief.
 *   8.08 failure    the hands slide a second card onto the eyelet behind the first: the rule for failure, fixed
 *                   beforehand (the repo's own phrase).
 *   9.08 committed  the camera tilts down and eases back to a small ledge beneath the line's post: three paper envelopes
 *                   (JSON, TOML, bison), each closed with a paper seal and a small blank date tab, and beside them a plain
 *                   crate of torn paper slips (the training data). Nobody opens them.
 *  10.60 drop       the tag's one lifespan thread drops to the Lifespan Rule and runs back to about twelve days, between
 *                   a week and a month, ending in a glowing open tip with its short copper arrow pointing right (tied
 *                   15 October, still held on 27 October 2026).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { defineShot, mixLab, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { RULE, SLOT_X, TAG, drawThread, lifeX, lineYAt, tagLineScene, tagsAt, type TagState } from '../sets/tagLine';
import { CARD_FS, KNOT_A, KNOT_B, borderTag, knotCards11, tagFrame } from '../sets/ch11-s02-border';
import { releaseSwing } from '../sets/ch02-s01-period';

const ID = 'ch11-s02';
type C2 = CanvasRenderingContext2D;
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

const X11 = SLOT_X['11'];
const KNOT11 = { x: X11, y: lineYAt(X11) };
const EYE11 = { x: X11, y: KNOT11.y + TAG.string };
/** the why tag hangs a little further right in this shot so tag 11's knot cards (hung to its right) clear it */
const WHY_X = 1180;

/** action-plane scale k about (x, y): dolly to k 1.2, lens beyond (the ch09-s03b camera) */
function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}
interface K {
  x: number;
  y: number;
  k: number;
}
const lerpK = (a: K, b: K, u: number): K => {
  // log-uniform zoom; the centre moves so the framed point travels straight
  const k = Math.exp(lerp(Math.log(a.k), Math.log(b.k), u));
  const f = (1 / a.k - 1 / k) / (1 / a.k - 1 / b.k || 1);
  return { x: lerp(a.x, b.x, a.k === b.k ? u : f), y: lerp(a.y, b.y, a.k === b.k ? u : f), k };
};
const OPEN: K = { x: 984, y: 462, k: 1.85 };
const READ: K = { x: 1060, y: 486, k: 3.0 };
const READ1: K = { x: 1064, y: 490, k: 3.08 };
const LEDGE: K = { x: 906, y: 522, k: 1.52 };
const LEDGE1: K = { x: 896, y: 526, k: 1.48 };

interface Beats {
  D: number;
  ink: number;
  tie: number;
  rule: number;
  seal: number;
  drop: number;
  entries: number;
  tieAt: number;
  tieDur: number;
  cardAt: number;
  cardDur: number;
}

function camAt(t: number, b: Beats): Camera3 {
  let k: K;
  if (t < 0.55) k = lerpK(OPEN, OPEN, 0);
  else if (t < b.tie + 0.3) k = lerpK(OPEN, READ, smr((t - 0.55) / (b.tie + 0.3 - 0.55)));
  else if (t < b.seal - 0.15) k = lerpK(READ, READ1, smr((t - (b.tie + 0.3)) / (b.seal - 0.15 - (b.tie + 0.3))));
  else if (t < b.drop + 0.6) k = lerpK(READ1, LEDGE, smr((t - (b.seal - 0.15)) / (b.drop + 0.6 - (b.seal - 0.15))));
  else k = lerpK(LEDGE, LEDGE1, smr((t - (b.drop + 0.6)) / Math.max(0.5, b.D - (b.drop + 0.6))));
  return camK(k.x, k.y, k.k);
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const tie = T.beat('tie');
    const rule = T.beat('rule');
    const tieDur = 3.0, cardDur = 2.0;
    const b: Beats = {
      D: T.duration,
      ink: T.beat('ink'),
      tie,
      rule,
      seal: T.beat('seal'),
      drop: T.beat('drop'),
      entries: T.wordEnd('L1104', 'entries'),
      // the knot pulls (tie u = .55) on 'tied'; the card is set on the eyelet (place u = .5) on 'failure'
      tieAt: tie - 0.55 * tieDur,
      tieDur,
      cardAt: rule - 0.5 * cardDur,
      cardDur,
    };
    const others = tagsAt(ID, 'start').map((st, i) => ({ ...st, x: st.id === 'why' ? WHY_X : st.x, swing: 0.018, phase: i * 1.37 }));
    return { tl, b, others };
  },
  paint(f, _s, sc) {
    const { b, others } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(t, b);
    f.camera(cam);
    // the cold blue night begins, by the end, to take the first warmth of dawn
    f.setMood('dawnGold', { from: 'winterBlue', u: 0.22 * seg(t, b.seal - 1, b.D) });

    // ---- the hands: tie (carrying the tag in from the lower left), then the second card
    const entry = hands.entry(cam, 'L4');
    const uTie = clamp01((tq - b.tieAt) / b.tieDur);
    const tieP = tq >= b.tieAt && uTie < 1 ? hands.act('tie', uTie, KNOT11, { held: 'none', scale: 0.82, entry }) : null;
    const tied = tq >= b.tie;
    const uCard = clamp01((tq - b.cardAt) / b.cardDur);
    const cardP = tq >= b.cardAt && uCard < 1 ? hands.act('place', uCard, cardAnchorB(), { held: 'none', scale: 0.82, entry }) : null;

    // ---- tag 11's state
    let st11: TagState | null = null;
    let knotAt = KNOT11;
    if (tied) {
      st11 = { id: '11', knot: [], swing: releaseSwing(tq, b.tie, 0.14), phase: 0.3, subject: t > b.tie && t < b.seal + 0.2 };
    } else if (tieP) {
      const sk = hands.socket(tieP) ?? KNOT11;
      knotAt = { x: sk.x, y: sk.y };
      st11 = { id: '11', knot: [], x: sk.x, y: sk.y + TAG.string, swing: 0.1, phase: 0.3, alpha: seg(uTie, 0.02, 0.16) };
    }
    const ink = seg(t, b.ink + 0.3, b.tie - 0.1);
    // the knot cards: the first threads on with the tie, the second is carried in and set on the eyelet on 'failure'
    const kinA = seg(tq, b.tie + 0.05, b.tie + 0.5);
    let cardB: { kin: number; dx: number; dy: number; loose: boolean } | null = null;
    if (cardP) {
      const sk = hands.socket(cardP) ?? cardAnchorB();
      const placed = uCard >= 0.5;
      const an = cardAnchorB();
      cardB = placed ? { kin: 1, dx: 0, dy: 0, loose: false } : { kin: seg(uCard, 0.05, 0.2), dx: sk.x - an.x, dy: sk.y - an.y, loose: true };
    } else if (tq >= b.cardAt + b.cardDur) cardB = { kin: 1, dx: 0, dy: 0, loose: false };
    // the lifespan thread drops at the end of the line
    const dropU = seg(t, b.drop - 0.1, b.drop + 1.15);

    tagLineScene(f, {
      variant: 'workshop',
      key: ID,
      tags: others,
      lamp: 0.32,
      sunX: 900,
      l3: (c, env) => ledgerCabinet(f, c, env),
      l4: (c, env) => {
        ledge(f, c, env);
        if (st11) {
          const fr = tagFrame(st11, { knotAt, tq });
          if (tied && dropU > 0) {
            const bottom = { x: fr.eye.x, y: fr.eye.y + fr.h };
            drawThread(c, env, bottom, lifeX(12), 'open', dropU, { lane: 8 });
          }
          borderTag(c, env, st11, { knotAt, tq, ink, subject: !!st11.subject, bison: seg(t, b.ink + 0.2, b.ink + 1.0), bisonLen: 26 });
          const s = 1;
          const cards = [{ text: KNOT_A, kin: kinA }];
          const list = cardB ? [...cards, { text: KNOT_B, kin: cardB.kin, dx: cardB.dx, dy: cardB.dy, loose: cardB.loose }] : cards;
          if (tied) knotCards11(c, env, fr.eye, list, s, !!st11.subject);
          else if (cardB) knotCards11(c, env, EYE11, [{ text: KNOT_B, kin: cardB.kin, dx: cardB.dx, dy: cardB.dy, loose: true }], s, false);
          tieFlash(c, env, t, b.tie);
        }
        if (tieP) hands.draw(c, tieP, env);
        if (cardP) hands.draw(c, cardP, env);
      },
    });
  },
});

/** where the second card's thread meets it, at rest (its corner hole): the hand sets it there */
function cardAnchorB() {
  return { x: EYE11.x + 16 + 9 + 3, y: EYE11.y - 4 + 2.2 + 0.62 * cardH() };
}
/** the first card's height: two lines of the knot type plus margins (sets/ch11-s02-border cardRect) */
function cardH() {
  return 2 * CARD_FS * 1.08 + 4.6;
}

/** the knot pulling down on 'tied': a small flash on the line (the detent's tie click) */
function tieFlash(c: C2, env: PaintEnv, t: number, at: number) {
  const u = (t - (at + 0.02)) / 0.35;
  if (u < 0 || u > 1) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(KNOT11.x, KNOT11.y, 0, KNOT11.x, KNOT11.y, 14);
  g.addColorStop(0, withAlpha(env.mood.core, 0.6 * (1 - u)));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(KNOT11.x - 14, KNOT11.y - 14, 28, 28);
  c.restore();
}

// ---------------------------------------------------------------- the ledge, the sealed envelopes, the crate
const LEDGE_G = { x0: 1064, x1: 1212, y: 586 };
function ledge(f: Parameters<typeof tagLineScene>[0], c: C2, env: PaintEnv) {
  f.cached(`${ID}/ledge/${env.mood.id}`, 190, 90, (cc) => {
    cc.translate(-1050, -520);
    drawLedge(cc, env);
  }, { res: 3 } as { blur?: number })(c, 1050, 520);
}
function drawLedge(c: C2, env: PaintEnv) {
  const ink = PUPPET_NEAR_BLACK;
  const rimC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.75);
  const paper = mixLab(mixLab('#cfb07a', env.mood.halo, 0.3), env.mood.haze, 0.06);
  // the crate of torn slips (right, against the post)
  const cx = 1166, cw = 40, chh = 22;
  for (let i = 0; i < 9; i++) {
    const x = cx + 3 + i * 4.2, hgt = 6 + ((i * 37) % 9);
    c.fillStyle = mixLab(paper, '#efe6d2', 0.3);
    c.beginPath();
    c.moveTo(x, LEDGE_G.y - chh + 2);
    c.lineTo(x + 1.2, LEDGE_G.y - chh - hgt);
    c.lineTo(x + 2.6, LEDGE_G.y - chh - hgt + 2.4);
    c.lineTo(x + 3.8, LEDGE_G.y - chh - hgt - 1);
    c.lineTo(x + 4.6, LEDGE_G.y - chh + 2);
    c.closePath();
    c.fill();
  }
  c.fillStyle = mixLab(env.mood.set, ink, 0.55);
  c.fillRect(cx, LEDGE_G.y - chh, cw, chh);
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 0.8;
  c.strokeRect(cx + 2.5, LEDGE_G.y - chh + 3, cw - 5, chh - 6);
  c.strokeStyle = rimC;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(cx, LEDGE_G.y - chh);
  c.lineTo(cx + cw, LEDGE_G.y - chh);
  c.stroke();
  // three envelopes standing on edge, leaning a little, each sealed with a round paper seal and a blank date tab
  [1076, 1104, 1132].forEach((x, i) => {
    c.save();
    c.translate(x + 12, LEDGE_G.y);
    c.rotate(-0.05 + i * 0.045);
    const w = 25, h = 32;
    c.fillStyle = withAlpha(ink, 0.35);
    c.fillRect(-w / 2 + 2, -h + 2, w, h);
    const g = c.createLinearGradient(0, -h, 0, 0);
    g.addColorStop(0, mixLab(paper, env.mood.core, 0.18));
    g.addColorStop(1, mixLab(paper, env.mood.set, 0.25));
    c.fillStyle = g;
    c.fillRect(-w / 2, -h, w, h);
    // the flap's fold
    c.strokeStyle = withAlpha(mixLab('#4a3420', env.mood.ink, 0.3), 0.55);
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-w / 2, -h + 1);
    c.lineTo(0, -h + 11);
    c.lineTo(w / 2, -h + 1);
    c.stroke();
    // the paper seal on the flap's point
    c.fillStyle = mixLab('#efe6d2', env.mood.halo, 0.25);
    c.beginPath();
    c.arc(0, -h + 11, 3.6, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(mixLab('#4a3420', env.mood.ink, 0.3), 0.6);
    c.beginPath();
    c.arc(0, -h + 11, 3.6, 0, Math.PI * 2);
    c.stroke();
    // the blank date tab standing up from the top edge
    c.fillStyle = mixLab('#efe6d2', env.mood.halo, 0.2);
    c.fillRect(w / 2 - 9, -h - 5, 7, 6);
    c.strokeStyle = rimC;
    c.beginPath();
    c.moveTo(-w / 2, -h);
    c.lineTo(w / 2 - 9, -h);
    c.stroke();
    c.restore();
  });
  // the ledge: a plank on a bracket fixed to the post
  c.fillStyle = ink;
  c.fillRect(LEDGE_G.x0, LEDGE_G.y, LEDGE_G.x1 - LEDGE_G.x0, 6);
  c.beginPath();
  c.moveTo(1178, LEDGE_G.y + 6);
  c.lineTo(1206, LEDGE_G.y + 6);
  c.lineTo(1206, LEDGE_G.y + 34);
  c.closePath();
  c.fill();
  c.strokeStyle = rimC;
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(LEDGE_G.x0, LEDGE_G.y);
  c.lineTo(LEDGE_G.x1, LEDGE_G.y);
  c.stroke();
}

/** L3: the ledger cabinet beside the bench (ch11 staging): a tall paper cabinet of four drawers, shut */
function ledgerCabinet(f: Parameters<typeof tagLineScene>[0], c: C2, env: PaintEnv) {
  f.cached(`${ID}/cab/${env.mood.id}`, 150, 300, (cc) => {
    cc.translate(-690, -262);
    cc.fillStyle = env.fill('set');
    cc.fillRect(700, 282, 120, 276);
    cc.fillRect(694, 272, 132, 12);
    cc.strokeStyle = withAlpha(env.mood.rim, 0.18);
    cc.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) {
      cc.strokeRect(710, 296 + k * 64, 100, 54);
      cc.beginPath();
      cc.arc(760, 323 + k * 64, 3, 0, Math.PI * 2);
      cc.stroke();
      cc.strokeRect(744, 302 + k * 64, 32, 9);
    }
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
    cc.beginPath();
    cc.moveTo(694, 272);
    cc.lineTo(826, 272);
    cc.stroke();
  })(c, 690, 262);
}

void RULE;
