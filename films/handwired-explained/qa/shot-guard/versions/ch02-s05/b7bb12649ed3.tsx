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
import { FONT, LAYERS, defineShot, legibleSize, mixLab, nameCard, softPlate, textProbe, toLayer, toScreen, windowWall, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { textRole } from '../../../film/silhouette/type';
import { hands } from '../cast';
import { drawPencil, pencilRed } from '../sets/narratorHands';
import { RULE, SLOT_X, TAG, drawLine, drawRule, drawTags, tagAnchors, type TagState } from '../sets/tagLine';
import { PERIOD_DY, camAt, clamp01, knotCards, lerp, onPeriodLine, releaseSwing, seg, sm, twos, type CamKey } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch02-s05';
/** canonical (pre-translation) anchors of tag 2 */
const AN = tagAnchors({ id: '2' });
const W = (p: { x: number; y: number }) => ({ x: p.x, y: p.y + PERIOD_DY });
/** review r1: the line's own POST (a turned wooden post of the room, world px at L4) just right of tag 2: the red pencil
 *  is laid to rest on its collar, leaning on the shaft */
const POST = { x: AN.eye.x + 64, top: W(AN.knot).y - 40, collar: W(AN.eye).y + 112, hw: 6 };
/** where the pencil's lead comes to rest (world) and its lean (the body runs up and a little right, onto the shaft) */
const REST_W = { x: POST.x - POST.hw - 7, y: POST.collar - 1 };
const REST_A = Math.PI / 2 + 0.11;
/** hand scale: an insert-sized hand under the push-in */
const HS = 0.6;
/** fixed entries (world, L4): the narrator's hand rises from just below the frame under tag 2 (up from behind the sill),
 *  the pencil hand from below frame right */
const HAND_ENTRY = { x: AN.eye.x + 22, y: 655 };
const PENCIL_ENTRY = { x: AN.eye.x + 150, y: 668 };
/** tag 2's back text (drawn here, upright: see backText) */
const BACK = ['Brooks, 2019'];

/** review r1: push in so the three tags and the line fill the middle third (~2.2x on the action plane, centred on qK) */
const CX = (SLOT_X['1'] + SLOT_X['2']) / 2 + 12;
const kz = (k: number) => 1000 - 1000 / k;
/** the end framing: the rule's right half (the year and lifetime ticks) and tag 2, the rule above the bottom 12 % */
const END_K = 1.08;
const CAMS = (b: { rest: number; D: number }): CamKey[] => [
  { t: 0, cam: { x: CX - 8, y: 424, z: kz(2.16), lens: 1 } },
  { t: b.rest + 0.1, cam: { x: CX + 6, y: 428, z: kz(2.24), lens: 1 } },
  { t: b.rest + 1.6, cam: { x: 712, y: 432, z: kz(END_K), lens: 1 } },
  { t: b.D + 0.4, cam: { x: 714, y: 433, z: kz(END_K * 1.01), lens: 1 } },
];

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = { D: T.duration, tag: T.beat('tag'), sutton: T.beat('sutton'), brooks: T.beat('brooks'), contested: T.beat('contested'), rest: T.beat('rest'), them: T.wordEnd('L0210', 'them'), replied: T.word('L0210b', 'replied') };
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
    const backInk = writeU <= 0.3 ? 0 : clamp01((writeU - 0.3) / 0.45);
    // review r1: the thread drops once the pencil is at rest and lands between the year and lifetime ticks with ~1 s held
    const dropU = sm(clamp01((t - (b.rest + 0.3)) / 1.3));
    const resting = tq >= b.rest;
    const swing2 = releaseSwing(tq, 0.45 + 0.55 * 2.5, 0.14) + (flipU > 0.6 ? 0.05 * Math.exp(-(tq - (b.brooks + 0.2)) * 1.4) : 0);
    const phase2 = Math.PI / 2 - (0.45 + 0.55 * 2.5) * 1.7;
    const subject = toScreen(LAYERS.L4, cam, 0, 0).k >= 1.5;

    f.layer('L4', (c, env) => {
      // the room's post first (the line runs over its finial; the rule passes in front of its foot)
      linePost(c, env);
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
            // review r1: the back's red-pencil words are drawn below, upright and larger (the shared painter mirrors them)
            backInk: 0,
            drop: dropU,
            swing: swing2,
            phase: phase2,
            glow: 0.2 + 0.3 * seg(t, b.tag, b.tag + 0.4) * (1 - seg(t, b.tag + 1.2, b.tag + 2.4)),
            subject,
          });
        }
        drawTags(c, env, states, { tq, ruleY: RULE.y - PERIOD_DY, pencil: 'none' });
        if (placed) {
          knotCards(c, env, AN.eye, ['Sutton, 2019'], kcU >= 0.5 ? seg(kcU, 0.45, 0.6) : 0, 1);
          if (flip > 0.5 && backInk > 0) backText(c, env, { flip, swing: swing2 * Math.sin(tq * 1.7 + phase2), ink: backInk, subject });
        }
      });
      // the red pencil laid to rest on the post's collar, leaning on its shaft (no strike)
      if (resting) drawPencil(c, REST_W, REST_A, 62, env);
    });
    f.rim({ x: 0, y: -1 });

    // ---- the hands: narrator (from BELOW, close under the tag) ties, threads the card, flips; the pencil (frame right)
    // writes, rests. review r1: short entries, so only the hand and cuff come into shot, clear of the lower-left card
    f.layer({ id: 'L4hands', z: 1000, haze: 0, blur: 0 }, (c, env) => {
      const ER = HAND_ENTRY;
      const EP = PENCIL_ENTRY;
      const knot = W(AN.knot);
      if (tieU > 0 && tieU < 1) {
        const p = hands.act('tie', tieU, knot, { held: 'tag', scale: HS, entry: { R: ER } });
        hands.draw(c, p, env, {
          heldDraw: (cc, at, _h, e2) => onPeriodLine(cc, () => drawTags(cc, e2, [{ id: '2', ink: 0, knot: [], x: at.x, y: at.y - PERIOD_DY, swing: 0.05 }], { tq, pencil: 'none' })),
        });
      }
      if (kcU > 0 && kcU < 1) {
        const p = hands.act('place', kcU, { x: W(AN.eye).x - 22, y: W(AN.eye).y + 2 }, { held: 'card', scale: HS, entry: { R: ER } });
        hands.draw(c, p, env, { heldDraw: (cc, at, _h, e2) => knotCards(cc, e2, { x: at.x + 30, y: at.y }, ['Sutton, 2019'], 1, 1) });
      }
      if (flipU > 0 && flipU < 1) hands.draw(c, hands.act('flip', flipU, W(AN.eye), { scale: HS, entry: { R: ER } }), env);
      // the red pencil: write the back, carry the pencil to the post, lay it down, withdraw
      const target = { x: W(AN.eye).x, y: W(AN.eye).y + 40 };
      const pOpts = { scale: HS, entry: EP, writeW: TAG.w * 0.62 };
      if (writeU > 0 && tq < writeEnd) hands.draw(c, hands.pencil('write', writeU, target, pOpts), env);
      else if (tq >= writeEnd && tq < b.rest) {
        const end = hands.pencil('write', 0.8, target, pOpts);
        const sock0 = hands.socket(end)!;
        const off = { x: sock0.x - end.tip!.x, y: sock0.y - end.tip!.y };
        const u = sm((tq - writeEnd) / (b.rest - writeEnd));
        const tip = { x: lerp(end.tip!.x, REST_W.x, u), y: lerp(end.tip!.y, REST_W.y, u) - Math.sin(Math.PI * u) * 14 };
        const arm = hands.reach(EP, { x: tip.x + off.x, y: tip.y + off.y }, 'pinch', 118 * HS, { sleeve: 'cuff', held: 'pencil', bend: 0.1 });
        hands.draw(c, { right: arm, scale: HS }, env);
      } else if (resting) {
        const u = 0.5 + 0.5 * clamp01((tq - b.rest) / 0.9);
        if (u < 1) hands.draw(c, hands.pencil('rest', u, REST_W, pOpts), env);
      }
    });

    // L5: the room's curtain edge at frame right (screen-anchored, a little clamped parallax), soft and near
    f.layer('L5', (c, env) => {
      const p0 = toLayer(LAYERS.L5, cam, 0, 0);
      const k = toLayer(LAYERS.L5, cam, 1, 0).x - p0.x;
      const dx = Math.max(-20, Math.min(20, -(cam.x - CX) * 0.03));
      c.save();
      c.translate(p0.x, p0.y);
      c.scale(k, k);
      c.translate(dx, 0);
      curtainEdge(c, env);
      // the window sill running across the foot of the frame: the hands rise from behind it
      sill(c, env, Math.max(-12, Math.min(12, (cam.y - 428) * 0.2)));
      c.restore();
    });

    // ---- type: two name cards in EQUAL light (same size, plate, fade; both full by 'replied'), raised clear of the
    // bottom 12 %; they and the label are gone before the rule comes up
    const tenv = { t, mood: f.mood, seed: 2019 };
    const cardsOut = b.rest + 1.0;
    const suttonAt = T_SUTTON(b);
    const brooksAt = b.replied - 0.9;
    nameCard(f.c, { name: 'Rich Sutton', role: 'The Bitter Lesson · 13 March 2019', y: 580, at: suttonAt, dur: cardsOut - suttonAt, fade: 0.45 }, tenv);
    nameCard(f.c, { name: 'Rodney Brooks', role: 'A Better Lesson · 19 March 2019', align: 'right', y: 580, at: brooksAt, dur: cardsOut - brooksAt, fade: 0.45 }, tenv);
    const la = seg(t, b.contested, b.contested + 0.4) * (1 - seg(t, b.rest + 0.55, b.rest + 1.0));
    if (la > 0.01) contestedLabel(f.c, f.mood, la);
  },
});

/** review r1: Sutton's card sets just before his name is said */
const T_SUTTON = (b: { sutton: number }) => b.sutton - 0.2;

/** tag 2's back, upright: the red-pencil words at ~13 px (canonical coords, inside onPeriodLine). The tag is scaled by
 *  |cos(pi flip)| (never mirrored), so the words are set unmirrored in the same frame */
function backText(c: C2, env: PaintEnv, o: { flip: number; swing: number; ink: number; subject: boolean }) {
  const s = 1;
  const w = TAG.w * s;
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * o.flip)));
  c.save();
  c.translate(AN.eye.x, AN.eye.y);
  c.rotate(o.swing);
  c.scale(sx, 1);
  textRole(c, o.subject ? 'subject' : 'texture', () => {
    const fs = 13 * s;
    c.font = `italic ${fs.toFixed(2)}px ${FONT.fell}`;
    c.fillStyle = pencilRed(env, 0.95);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const rows: string[] = [];
    for (const l of BACK) {
      // wrap to the tag's width
      let line = '';
      for (const word of l.split(' ')) {
        const tr = line ? `${line} ${word}` : word;
        if (c.measureText(tr).width > w * 0.86 && line) {
          rows.push(line);
          line = word;
        } else line = tr;
      }
      if (line) rows.push(line);
    }
    let budget = Math.ceil(rows.reduce((n, l) => n + l.length, 0) * clamp01(o.ink));
    rows.forEach((ln, i) => {
      if (budget <= 0) return;
      const tw = c.measureText(ln).width;
      c.fillText(ln.slice(0, budget), -tw / 2, 30 * s + fs * 0.85 + i * fs * 1.12);
      budget -= ln.length;
    });
    const tw = Math.max(...rows.map((r) => c.measureText(r).width));
    textProbe(c, `${ID}-back`, -tw / 2, 30 * s, tw, fs * 1.12 * rows.length + fs * 0.3, clamp01(o.ink));
  });
  c.restore();
}

/** the line's post: a turned wooden post standing up through the frame, its finial above the line, a collar the pencil
 *  stands on (world px, L4) */
function linePost(c: C2, env: PaintEnv) {
  const { x, top, collar, hw } = POST;
  const ink = mixLab(env.fill('ink'), env.mood.set, 0.15);
  c.save();
  c.fillStyle = ink;
  // the shaft, down past the frame
  c.fillRect(x - hw, top + 18, hw * 2, 900);
  // the finial: a turned knob on a neck
  c.beginPath();
  c.ellipse(x, top + 6, hw * 1.35, hw * 1.6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - hw * 0.6, top + 10, hw * 1.2, 10);
  c.fillRect(x - hw * 1.4, top + 18, hw * 2.8, 4);
  // the collar the pencil stands on
  c.fillRect(x - hw - 10, collar, hw * 2 + 20, 5);
  c.fillRect(x - hw - 6, collar + 5, hw * 2 + 12, 4);
  // window-side rim (the backlight is up-left)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x - hw + 0.6, top + 22);
  c.lineTo(x - hw + 0.6, 760);
  c.moveTo(x - hw * 1.3, top + 2);
  c.quadraticCurveTo(x - hw * 0.8, top - hw * 1.4, x + hw * 0.4, top - hw * 1.5);
  c.moveTo(x - hw - 10, collar + 0.5);
  c.lineTo(x + hw + 10, collar + 0.5);
  c.stroke();
  c.restore();
}

/** L5 (screen px after the anchoring transform): the room's curtain edge at frame right, gathered, with a few folds */
function curtainEdge(c: C2, env: PaintEnv) {
  c.fillStyle = env.fill('fg');
  c.beginPath();
  c.moveTo(1400, -60);
  c.lineTo(1192, -60);
  c.bezierCurveTo(1178, 160, 1214, 380, 1196, 560);
  c.bezierCurveTo(1186, 660, 1200, 740, 1190, 800);
  c.lineTo(1400, 800);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 2;
  for (const dx of [22, 50]) {
    c.beginPath();
    c.moveTo(1196 + dx, -60);
    c.bezierCurveTo(1188 + dx, 200, 1214 + dx, 420, 1200 + dx, 800);
    c.stroke();
  }
}

/** L5 (screen px): the near window sill along the bottom of the frame, a moulded edge catching the dusk on top */
function sill(c: C2, env: PaintEnv, dy: number) {
  const y = 616 + dy;
  c.fillStyle = env.fill('fg');
  c.fillRect(-80, y, 1440, 200);
  c.fillRect(-80, y - 8, 1440, 10);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-80, y - 7);
  c.lineTo(1360, y - 7);
  c.stroke();
  c.strokeStyle = withAlpha(env.mood.rim, 0.14);
  c.beginPath();
  c.moveTo(-80, y + 10);
  c.lineTo(1360, y + 10);
  c.stroke();
}

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
