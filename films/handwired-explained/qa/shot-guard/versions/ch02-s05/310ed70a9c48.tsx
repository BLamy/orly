/**
 * ch02-s05 — March 2019: tag 2, with Sutton on its front and Brooks on its back, in equal light (duskRose card, paper
 * wipe in, 15.04 s).
 *
 * The line at the ch02 height, close on its far-left end where the oldest tags hang in tie order: tag 1 (its split
 * thread already measured on the rule), question card qK, and now tag 2 on a newer, finer thread. No figure, no
 * faces: cards and hands only.
 *   0.5  the narrator's hands (lower left) carry tag 2 up and tie it on, on its slot right of qK
 *   1.95 tag       its front inks: "Learn the weights; don't write them" (prop lettering, spoken aloud)
 *   5.45 sutton    the hands thread its knot card, "Sutton, 2019"; his name card sets on the left
 *   9.8  brooks    the hands flip the tag with a paper snap; the red-pencil hand (frame right) writes "Brooks, 2019"
 *                  on the back; his name card sets on the right, lit exactly as the first
 *   10.1 contested the label sets under the tag
 *   12.22 rest     the pencil does not strike: it is laid to rest leaning beside the tag, and the hand withdraws
 *   then           tag 2's thread (still held) drops to the Lifespan Rule at its age as of 27 Oct 2026, about seven
 *                  and a half years (between a year and a lifetime), ending in a glowing open tip with a copper arrow;
 *                  the camera eases back along the rule to see it land. The detent's third stroke is withheld.
 */
import { Timeline } from '../../../core';
import { FONT, defineShot, legibleSize, mixLab, nameCard, softPlate, textProbe, windowWall } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { hands } from '../cast';
import { drawPencil } from '../sets/narratorHands';
import { RULE, TAG, drawLine, drawRule, drawTags, tagAnchors, type TagState } from '../sets/tagLine';
import { PERIOD_DY, camAt, clamp01, knotCards, lerp, onPeriodLine, releaseSwing, seg, sm, twos, type CamKey } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch02-s05';
/** canonical (pre-translation) anchors of tag 2 */
const AN = tagAnchors({ id: '2' });
const W = (p: { x: number; y: number }) => ({ x: p.x, y: p.y + PERIOD_DY });
/** where the pencil comes to rest: leaning against the tag's right edge (the tagLine set's 'beside' pose) */
const REST = { x: AN.eye.x + TAG.w * 0.62, y: AN.bottom.y - 6 };
const REST_A = Math.PI * 0.5 + 0.28;
/** hand scale: an insert-sized hand under the push-in (the camera already magnifies ~1.8x) */
const HS = 0.6;

const CAMS = (b: { rest: number; D: number }): CamKey[] => [
  { t: 0, cam: { x: 300, y: 420, z: 400, lens: 1 } },
  { t: b.rest - 0.2, cam: { x: 312, y: 424, z: 452, lens: 1 } },
  { t: b.D + 0.4, cam: { x: 560, y: 446, z: 70, lens: 1 } },
];

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = { D: T.duration, tag: T.beat('tag'), sutton: T.beat('sutton'), brooks: T.beat('brooks'), contested: T.beat('contested'), rest: T.beat('rest'), them: T.wordEnd('L0210', 'them') };
    return { tl, b, cams: CAMS(b) };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam: Camera3 = camAt(sc.cams, t);
    f.camera(cam);
    f.backlight({ sunX: 520, intensity: 0.9 });

    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 2000, 960, (cc) => {
        cc.translate(360, 120);
        windowWall(cc, {
          x: -360, y: -120, w: 2000, h: 960, centers: [-120, 250, 640, 1030, 1420], winW: 230, apex: 40, sill: 560,
          shape: 'flat', lights: 3, panes: { cols: 1, rows: 7 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true, cornice: 60, wainscot: 0, glass: 0.6, seed: 2019,
        }, env);
      })(c, -360, -120);
    });
    f.fog('A');
    f.fog('B');

    // ---- actions (u on twos)
    const tieU = clamp01((tq - 0.45) / 2.5);
    const kcU = clamp01((tq - (b.sutton - 0.8)) / 1.6);
    const flipU = clamp01((tq - (b.brooks - 0.9)) / 1.8);
    const writeD = 1.6;
    const write0 = b.brooks + 0.15;
    const writeU = clamp01((tq - write0) / writeD);
    const writeEnd = write0 + 0.8 * writeD;
    const placed = tieU >= 0.55;
    const flip = flipU <= 0.38 ? 0 : flipU >= 0.62 ? 1 : (flipU - 0.38) / 0.24;
    const dropU = sm(clamp01((t - (b.rest + 0.45)) / 1.7));
    const resting = tq >= b.rest;

    f.layer('L4', (c, env) => {
      onPeriodLine(c, () => {
        drawLine(c, env, { metal: 'bronze', posts: 'none', x0: -500, x1: 1800, sag: 0, glow: 0.4 });
        drawRule(c, env, { y: RULE.y - PERIOD_DY });
        const states: TagState[] = [
          { id: '1', knot: ['McCulloch & Pitts, 1943', 'Kleene, 1951'], drop: [1, 1] },
          { id: 'qK' },
        ];
        if (placed) {
          states.push({
            id: '2',
            knot: [],
            ink: seg(t, b.tag + 0.05, b.them - 0.1),
            flip,
            backInk: writeU <= 0.3 ? 0 : clamp01((writeU - 0.3) / 0.45),
            drop: dropU,
            swing: releaseSwing(tq, 0.45 + 0.55 * 2.5, 0.14) + (flipU > 0.6 ? 0.05 * Math.exp(-(tq - (b.brooks + 0.2)) * 1.4) : 0),
            phase: Math.PI / 2 - (0.45 + 0.55 * 2.5) * 1.7,
            glow: 0.2 + 0.3 * seg(t, b.tag, b.tag + 0.4) * (1 - seg(t, b.tag + 1.2, b.tag + 2.4)),
          });
        }
        drawTags(c, env, states, { tq, ruleY: RULE.y - PERIOD_DY, pencil: 'none' });
        if (placed) knotCards(c, env, AN.eye, ['Sutton, 2019'], kcU >= 0.5 ? seg(kcU, 0.45, 0.6) : 0, 1);
        if (resting) drawPencil(c, REST, REST_A, 62, env);
      });
    });
    f.rim({ x: 0, y: -1 });

    // ---- the hands: narrator (lower left) ties, threads the card, flips; the pencil (frame right) writes, rests
    f.layer({ id: 'L4hands', z: 1000, haze: 0, blur: 0 }, (c, env) => {
      const E = hands.entry(cam, 'L4');
      const knot = W(AN.knot);
      if (tieU > 0 && tieU < 1) {
        const p = hands.act('tie', tieU, knot, { held: 'tag', scale: HS, entry: { R: E.R } });
        hands.draw(c, p, env, {
          heldDraw: (cc, at, _h, e2) => onPeriodLine(cc, () => drawTags(cc, e2, [{ id: '2', ink: 0, knot: [], x: at.x, y: at.y - PERIOD_DY, swing: 0.05 }], { tq, pencil: 'none' })),
        });
      }
      if (kcU > 0 && kcU < 1) {
        const p = hands.act('place', kcU, { x: W(AN.eye).x - 22, y: W(AN.eye).y + 2 }, { held: 'card', scale: HS, entry: { R: E.R } });
        hands.draw(c, p, env, { heldDraw: (cc, at, _h, e2) => knotCards(cc, e2, { x: at.x + 30, y: at.y }, ['Sutton, 2019'], 1, 1) });
      }
      if (flipU > 0 && flipU < 1) hands.draw(c, hands.act('flip', flipU, W(AN.eye), { scale: HS, entry: { R: E.R } }), env);
      // the red pencil: write the back, carry the pencil to its rest beside the tag, lay it down, withdraw
      const target = { x: W(AN.eye).x, y: W(AN.eye).y + 40 };
      const pOpts = { scale: HS, entry: E.pencil, writeW: TAG.w * 0.62 };
      if (writeU > 0 && tq < writeEnd) hands.draw(c, hands.pencil('write', writeU, target, pOpts), env);
      else if (tq >= writeEnd && tq < b.rest) {
        const end = hands.pencil('write', 0.8, target, pOpts);
        const sock0 = hands.socket(end)!;
        const off = { x: sock0.x - end.tip!.x, y: sock0.y - end.tip!.y };
        const u = sm((tq - writeEnd) / (b.rest - writeEnd));
        const tip = { x: lerp(end.tip!.x, W(REST).x, u), y: lerp(end.tip!.y, W(REST).y, u) - Math.sin(Math.PI * u) * 14 };
        const arm = hands.reach(E.pencil, { x: tip.x + off.x, y: tip.y + off.y }, 'pinch', 118 * HS, { sleeve: 'cuff', held: 'pencil', bend: 0.1 });
        hands.draw(c, { right: arm, scale: HS }, env);
      } else if (resting) {
        const u = 0.5 + 0.5 * clamp01((tq - b.rest) / 0.9);
        if (u < 1) hands.draw(c, hands.pencil('rest', u, W(REST), pOpts), env);
      }
    });

    // L5: a soft drape at frame right (near plane)
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 420, 1300, (cc) => {
        cc.translate(-1180, 300);
        cc.fillStyle = env.fill('fg');
        cc.beginPath();
        cc.moveTo(1600, -300);
        cc.lineTo(1250, -300);
        cc.bezierCurveTo(1230, 100, 1290, 420, 1236, 1000);
        cc.lineTo(1600, 1000);
        cc.closePath();
        cc.fill();
      })(c, 1180, -300);
    });

    // ---- type: two name cards in equal light (same size, same plate, same alpha), the label under the tag
    const tenv = { t, mood: f.mood, seed: 2019 };
    nameCard(f.c, { name: 'Rich Sutton', role: 'The Bitter Lesson · 13 March 2019', at: b.sutton, dur: b.D - b.sutton - 0.2, fade: 0.45 }, tenv);
    nameCard(f.c, { name: 'Rodney Brooks', role: 'A Better Lesson · 19 March 2019', align: 'right', at: b.brooks, dur: b.D - b.brooks - 0.2, fade: 0.45 }, tenv);
    const la = seg(t, b.contested, b.contested + 0.4) * (1 - seg(t, b.D - 0.8, b.D - 0.2));
    if (la > 0.01) contestedLabel(f.c, f.mood, la);
  },
});

/** the label under the tag (screen-locked, soft plate) */
function contestedLabel(c: C2, mood: PaintEnv['mood'], a: number) {
  const txt = 'the dominant view, but contested';
  const size = legibleSize(c, `italic 400 29px ${FONT.text}`, 29);
  c.save();
  c.globalAlpha = a;
  softPlate(c, 640, 548, 560, 100, mood.ink, 0.5);
  c.font = `italic 400 ${size}px ${FONT.text}`;
  c.fillStyle = mixLab('#efe3cf', mood.core, 0.2);
  c.textAlign = 'center';
  c.fillText(txt, 640, 558);
  const tw = c.measureText(txt).width;
  textProbe(c, `${ID}-contested`, 640 - tw / 2, 558 - size, tw, size * 1.2, a);
  c.restore();
}
