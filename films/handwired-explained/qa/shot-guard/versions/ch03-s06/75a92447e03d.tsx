/**
 * ch03-s06 — suspect tag 3 struck ("Somebody trained it": the README says none is trained), and the Notes plant hung on
 * the line (refrain 'Hang that on the line', third of four uses).
 *
 * WORKSHOP (staging.tagLine, ch03 variant): the canonical tag-keeper's workshop (sets/tagLine.ts: L2 the tall paned
 * window wall, L3 the bench with the HandwiredOS desk now lit from inside (the X-ray has begun: translucency .2),
 * L4 the copper line at 58 %, the Lifespan Rule on the bench edge), tags as the film left them (tagsAt): 1, qK, 2,
 * the 1992-2026 card, suspects 3, 4 (struck in ch03-s03) and 5, tag 6 and the blank why tag.
 * The camera works close on the line, so the near post (L6) and its pencil are past the lens and not painted: the red
 * pencil comes in and leaves from frame right, the narrator's hands from the frame's lower left (hands.entry).
 *   'tag3In' (0.2): cut in close on suspect tag 3 (its front in the film's hand, already read; its 'suspect' stamp; its
 *     knot eyelet visibly EMPTY: no holder card), tag 4's struck face beside it.
 *   'tag3' (L0311 'trained'): the camera settles onto tag 3.
 *   'flip3' ('README'): the narrator's hand pinches the tag and turns it over (the paper snap on the word); the red
 *     pencil comes in from frame right and writes the README's fragment on the back, “none is trained”, with its
 *     source under it, — the HandwiredOS README (the full sentence is spoken, not set); the back reads while the
 *     sentence is said.
 *   'strike3' (end of L0311): the narrator's hand turns the tag face-front again and the pencil strikes the front
 *     through once as the camera eases back to the row (tag 3 and the struck tag 4 side by side: the strike plays
 *     wider, not as ch03-s03's macro insert).
 *   'ours' (L0312 'ours'): the camera tips down to the empty eyelet and holds; it catches a small glint. Nobody tied
 *     this one on.
 *   'notes' (L0313 'Notes'): a slow push past the line, through the empty stretch right of tag 6, toward the desk on
 *     the bench: its Notes window (a sheet hung on fine threads, a short handwritten to-do list, the last line still
 *     soft: planted for ch12) catches the light.
 *   'holds' ('holds'): a small typed card slides in over the Notes window: “holds no text” — the HandwiredOS README.
 *   'hang' ('Hang'): the narrator's hand lifts a fresh blank tag from below frame and ties it on the line in the
 *     foreground (the tie click on 'line'); the card's fragment inks onto its front as the card lifts away. Hold on
 *     the new tag swinging gently on a slack thread (a plant has no date to measure).
 * Text: the back's fragment + source (flip3 → strike3) and the card (holds → hang), which passes to the new tag.
 * The new plant tag is not in sets/tagLine's registry: it hangs at PLANT_X, in the empty stretch right of tag 6.
 */
import { Timeline, ease } from '../../../core';
import { FONT, LAYERS, cam3Interp, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN, pencilRed, type HandsPose, type Pt } from '../sets/narratorHands';
import { SLOT_X, TAG, drawTag, lineYAt, tagAnchors, tagLineScene, tagStrike, tagsAt, type TagState } from '../sets/tagLine';
import { deskGeom, handwiredDesk } from '../sets/handwiredDesk';

const ID = 'ch03-s06';
/** the workshop's bench desk (sets/tagLine: handwiredDesk at (470, 400), w 300) and its Notes window (L3 px) */
const BENCH = { x: 470, y: 400, w: 300 } as const;
const NOTES = deskGeom(BENCH).win.notes;
const NOTES_C = { x: NOTES.x + NOTES.w / 2, y: NOTES.y + NOTES.h / 2 };
/** the new plant tag's slot: the empty stretch of line right of tag 6 */
const PLANT_X = 800;
const kz = (k: number) => 1000 - 1000 / k;

/** tag 3 (canonical anchors, L4 px) */
const A3 = tagAnchors({ id: '3' });
// ---- cameras (the action plane at k = 1000 / (1000 - z))
/** cut in close on tag 3, tag 4's struck face beside it; the front reads (k 2.3) */
const C0: Camera3 = { x: 455, y: 482, z: kz(2.3), lens: 1 };
/** 'trained': settled on tag 3 */
const C1: Camera3 = { x: 418, y: 487, z: kz(2.6), lens: 1 };
/** reading the back: a slow creep in */
const C2: Camera3 = { x: 416, y: 489, z: kz(2.78), lens: 1 };
/** the strike, wider: the row of knots with tags 3 and 4 hanging under it */
const C3: Camera3 = { x: 452, y: 446, z: kz(2.05), lens: 1 };
/** 'ours': tipped down to the empty eyelet */
const C4: Camera3 = { x: 418, y: 459, z: kz(2.7), lens: 1 };
/** 'notes': past the line to the Notes window, the new tag's slot in the foreground at right */
const C5: Camera3 = { x: 758, y: 466, z: kz(4), lens: 1 };
const C6: Camera3 = { x: 760, y: 467, z: kz(4.08), lens: 1 };

/** the typed card's plane: just in front of the desk, behind the line */
const CARD_L: LayerSpec = { id: `${ID}-card`, z: 1160, haze: 0.05, blur: 0 };

/** hand scale on the line (an insert-sized hand under the close framings) */
const HS = 0.62;
const LEN = HAND_LEN * HS;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpP = (a: Pt, b: Pt, u: number): Pt => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
/** a damped pendulum (radians) released at t0 from amplitude a0 */
const pend = (t: number, t0: number, a0: number, period: number, decay: number) =>
  t < t0 ? 0 : a0 * Math.exp(-(t - t0) * decay) * Math.cos(((t - t0) * Math.PI * 2) / period);
const kick = (t: number, t0: number, decay = 2) => (t < t0 ? 0 : smooth((t - t0) / 0.08) * Math.exp(-(t - t0) * decay));

/** the back of tag 3, in red pencil: the fragment and its source (script onScreenText, flip3) */
const BACK_QUOTE = '“none is trained”';
const BACK_SRC = '— the HandwiredOS README';
/** the card (holds) and the fragment it passes to the new tag (hang) */
const CARD_QUOTE = '“holds no text”';
const CARD_SRC = '— the HandwiredOS README';

interface Beats {
  D: number;
  tag3: number;
  flip3: number;
  strike3: number;
  ours: number;
  notes: number;
  holds: number;
  hang: number;
  /** the README sentence's last words (the back is read while they are said) */
  noneEnd: number;
  /** 'line' at the end of L0313: the tie click */
  line: number;
}

/** action windows (seconds), all on twos */
function sched(b: Beats) {
  const flipD = 1.6;
  const flip0 = b.flip3 - 0.5 * flipD; // the snap (u .5) on 'README'
  const write0 = flip0 + 0.66 * flipD + 0.12; // the pencil comes in as the narrator's hand lets go
  const write1 = write0 + 0.42; // in at the first letter
  const write2 = b.strike3 - 1.45; // the last letter
  const backD = 1.3;
  const back0 = b.strike3 - 0.25 - 0.62 * backD; // turned face-front by strike3 - 0.25
  const strikeD = 1.25;
  const strike0 = b.strike3 + 0.05 - 0.47 * strikeD; // the stroke lands just after the line's last word
  const tieD = 1.9;
  const tie0 = b.line + 0.1 - 0.55 * tieD; // the knot pulled on 'line'
  return { flipD, flip0, write0, write1, write2, backD, back0, strikeD, strike0, tieD, tie0 };
}
type Sched = ReturnType<typeof sched>;

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = {
      D: T.duration,
      tag3: T.beat('tag3'),
      flip3: T.beat('flip3'),
      strike3: T.beat('strike3'),
      ours: T.beat('ours'),
      notes: T.beat('notes'),
      holds: T.beat('holds'),
      hang: T.beat('hang'),
      noneEnd: T.wordEnd('L0311', 'trained#2'),
      line: T.word('L0313', 'line'),
    };
    const cam = tl.channel<Camera3>('cam', C0, cam3Interp);
    tl.tween(cam, C1, { at: b.tag3 - 0.2, dur: 2.0, ease: ease.move });
    tl.tween(cam, C2, { at: b.tag3 + 1.8, dur: b.strike3 - 0.6 - (b.tag3 + 1.8), ease: ease.move });
    tl.tween(cam, C3, { at: b.strike3 - 0.55, dur: 1.9, ease: ease.move });
    tl.tween(cam, C4, { at: b.ours - 0.5, dur: 1.5, ease: ease.move });
    tl.tween(cam, C5, { at: b.notes - 0.3, dur: b.hang - 0.3 - (b.notes - 0.3), ease: ease.move });
    tl.tween(cam, C6, { at: b.hang - 0.3, dur: b.D - (b.hang - 0.3), ease: ease.move });
    tl.hold(0, T.duration);
    return { tl, cam, b, sc: sched(b) };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = f.tq;
    const { b, sc } = scene;
    const cam = s.get(scene.cam);
    f.camera(cam);
    const k4 = toScreen(LAYERS.L4, cam, 0, 0).k;

    // ---- tag 3's state (cut paper: on twos)
    const flipPose = tq > sc.flip0 && tq < sc.flip0 + sc.flipD ? hands.act('flip', (tq - sc.flip0) / sc.flipD, A3.eye, { scale: HS }) : null;
    const backPose = tq > sc.back0 && tq < sc.back0 + sc.backD ? hands.act('flip', (tq - sc.back0) / sc.backD, A3.eye, { scale: HS }) : null;
    let flip = 0;
    if (tq >= sc.flip0) flip = flipPose ? flipPose.flip ?? 0 : 1;
    if (tq >= sc.back0) flip = backPose ? 1 - (backPose.flip ?? 0) : 0;
    const handled = smooth((tq - sc.flip0 + 0.2) / 0.4) * (1 - smooth((tq - (sc.strike0 + 0.75 * sc.strikeD)) / 0.5));
    const swing3 = (1 - handled) * 0.022 * Math.sin(tq * 1.7 + 0.9) + pend(tq, b.flip3 + 0.2, 0.05, 0.8, 3) + pend(tq, b.strike3 + 0.08, 0.07, 1.0, 1.6);
    const strikeU = tq < sc.strike0 ? 0 : (tq - sc.strike0) / sc.strikeD;
    const strikePose = strikeU > 0 && strikeU < 1 ? hands.pencil('strike', strikeU, strikeGeom().centre, { scale: HS, strikeW: strikeGeom().w, strikeAngle: strikeGeom().angle, entry: hands.entry(cam, 'L4').pencil }) : null;
    const strike = tq < sc.strike0 ? 0 : strikePose ? strikePose.stroke ?? 0 : 1;
    const eyeGlint = kick(t, b.ours - 0.05, 1.3) * 0.9;

    // ---- the new plant tag and the typed card
    const tieU = (tq - sc.tie0) / sc.tieD;
    const tiePose = tieU > 0 && tieU < 1 ? hands.act('tie', tieU, { x: PLANT_X, y: lineYAt(PLANT_X) }, { held: 'tag', scale: HS * 1.05, entry: { R: hands.entry(cam, 'L4').R } }) : null;
    const placed = tieU >= 0.55;
    const click = sc.tie0 + 0.55 * sc.tieD;
    const plantInk = smooth((t - click - 0.05) / 0.55);
    const cardIn = smooth((t - b.holds + 0.12) / 0.3);
    // the card lifts away as the fragment inks onto the new tag (out at 0 within 4 frames of the ink passing 30 %)
    const cardOut = 1 - smooth((t - click + 0.05) / 0.32);
    const cardA = cardIn * cardOut;

    const states: TagState[] = tagsAt(ID, 'start').map((st) => {
      if (st.id !== '3') return { ...st, subject: false };
      return {
        ...st,
        flip,
        back: [],
        strike,
        swing: swing3,
        phase: Math.PI / 2 - tq * 1.7,
        subject: k4 >= 2.25 && flip < 0.5,
        glow: 0.08 * kick(t, b.tag3, 1.2),
      };
    });

    // the room: the bench desk lit from inside, its Notes window catching the light on 'notes'
    const notesRim = kick(t, b.notes - 0.1, 1.1);
    const fScene: Frame = Object.create(f);
    fScene.layer = (spec, draw) => {
      // the near post (L6) is past the lens in every framing here
      if (spec === 'L6') return;
      f.layer(spec, draw);
      if (spec === 'L3') typedCard(f, cam, t, cardA, b.holds);
    };
    tagLineScene(fScene, {
      variant: 'workshop',
      key: ID,
      tags: states,
      desk: false,
      pencilOnPost: false,
      lamp: 0.85,
      sunX: 560,
      line: { glow: 0.5 + 0.2 * kick(t, click, 1.5) },
      l3: (c, env) => {
        handwiredDesk(f, c, env, {
          ...BENCH,
          proscenium: true,
          lamp: 0.55 + 0.2 * notesRim,
          translucency: 0.2,
          focused: 'notes',
          notesLast: 0,
          windows: { notes: { rim: notesRim, swing: 0.012 * Math.sin(tq * 1.1) } },
          key: `${ID}/bench`,
          wallpaper: 0.8,
        });
        // the desk lit from inside: a warm bloom behind its paper (the X-ray has begun)
        const R = { x: BENCH.x, y: BENCH.y, w: BENCH.w, h: BENCH.w * 0.625 };
        c.save();
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(R.x + R.w * 0.55, R.y + R.h * 0.45, 0, R.x + R.w * 0.55, R.y + R.h * 0.45, R.w * 0.6);
        g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.1 + 0.1 * notesRim));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(R.x, R.y, R.w, R.h);
        c.restore();
      },
      l4: (c, env) => {
        // tag 3's back, upright and legible (the shared painter mirrors back text): the pencil's words
        const st3 = states.find((x) => x.id === '3')!;
        const writeP = backProgress(c, tq, sc);
        if (flip > 0.5) backText(c, env, { flip, swing: st3.swing ?? 0, ink: writeP.ink, subject: k4 >= 2.4 });
        // the empty eyelet's glint on 'ours'
        if (eyeGlint > 0.01) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          const e = { x: A3.eye.x, y: A3.eye.y + 7 };
          const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, 14);
          g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#fff4dc', 0.3), 0.55 * eyeGlint));
          g.addColorStop(1, withAlpha(env.mood.halo, 0));
          c.fillStyle = g;
          c.fillRect(e.x - 14, e.y - 14, 28, 28);
          c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.8 * eyeGlint);
          c.lineWidth = 1.2 / (Math.hypot(c.getTransform().a, c.getTransform().b) || 1) * 1.5;
          c.beginPath();
          c.arc(e.x, e.y, 5.4, Math.PI * 1.05, Math.PI * 1.95);
          c.stroke();
          c.restore();
        }
        // the new plant tag, once tied: slack thread (no date to measure), the fragment inking onto its face
        if (placed) {
          const sw = pend(tq, click, 0.16, 1.15, 0.9) + 0.016 * Math.sin(tq * 1.5 + 0.4);
          plantThread(c, env, sw);
          drawTag(c, env, plantState(plantInk, sw, 0.25 * kick(t, click, 1.4)), { tq });
          plantProbe(c, plantInk);
        }
        // ---- the hands: narrator (lower LEFT) flips, turns back, ties; the red pencil (frame RIGHT) writes, strikes
        if (flipPose) hands.draw(c, withEntry(flipPose, cam), env);
        if (backPose) hands.draw(c, withEntry(backPose, cam), env);
        const pp = pencilPose(cam, tq, sc, writeP, strikePose);
        if (pp) hands.draw(c, pp, env);
        if (tiePose) {
          hands.draw(c, tiePose, env, {
            heldDraw: (cc, at, held, e2) => {
              if (held !== 'tag') return;
              drawTag(cc, e2, plantState(0, 0.05 * Math.sin(tq * 3.1), 0), { at: { x: at.x, y: at.y - 4 }, knotAt: { x: at.x, y: at.y - 4 }, tq });
            },
          });
        }
      },
    });
  },
});

/** the new plant tag: a fresh manila tag (no stamp, no holder card), the card's fragment on its front */
function plantState(ink: number, swing: number, glow: number): TagState {
  // drawn through the registry's plain tag shape ('7' carries no stamp or grommet); every field it prints is overridden
  return { id: '7', x: PLANT_X, front: CARD_QUOTE, knot: [], back: [], ink, swing, phase: 0, glow, subject: true };
}
/** its slack thread: a short loop under the tag, as the suspects hang (no drop to the rule) */
function plantThread(c: CanvasRenderingContext2D, env: PaintEnv, swing: number) {
  const eye = { x: PLANT_X, y: lineYAt(PLANT_X) + TAG.string };
  const bx = eye.x - Math.sin(swing) * TAG.h, by = eye.y + Math.cos(swing) * TAG.h;
  c.strokeStyle = withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.85);
  c.lineWidth = Math.max(1.2 / (Math.hypot(c.getTransform().a, c.getTransform().b) || 1), 0.4);
  c.beginPath();
  c.moveTo(bx, by);
  c.bezierCurveTo(bx - 6, by + 22, bx + 12, by + 26, bx + 4, by + 38);
  c.stroke();
}
function plantProbe(c: CanvasRenderingContext2D, ink: number) {
  const eye = { x: PLANT_X, y: lineYAt(PLANT_X) + TAG.string };
  textProbe(c, `${ID}-plant`, eye.x - TAG.w * 0.42, eye.y + 26, TAG.w * 0.84, 26, ink);
}

/** the tag 3 strike geometry (world, unswung) */
function strikeGeom() {
  return tagStrike({ id: '3' });
}

/** a hands pose re-aimed from the frame's lower-left entry for this camera */
function withEntry(p: HandsPose, cam: Camera3): HandsPose {
  // hands.act was called with the default entry; recompute from the frame-anchored entry so the sleeve always runs
  // off the lower-left corner of the FRAME whatever the camera does
  const sock = hands.socket(p);
  if (!sock || !p.right) return p;
  return { ...p, right: hands.reach(hands.entry(cam, 'L4').R, sock, p.right.shape, HAND_LEN * (p.scale ?? 1), { sleeve: 'linen', held: p.right.held, bend: p.right.bend }) };
}

// ---------------------------------------------------------------- tag 3's back: layout and the pencil's path
interface Row {
  text: string;
  /** tag-local baseline and left x */
  x: number;
  y: number;
  w: number;
  font: string;
}
const QUOTE_FS = 10;
const SRC_FS = 8.8;
/** the back's rows in tag-local coords (origin: the eyelet's top centre, unswung, unflipped) */
function backRows(c: CanvasRenderingContext2D): Row[] {
  const maxW = TAG.w * 0.88;
  const rows: Row[] = [];
  const wrap = (text: string, font: string) => {
    c.font = font;
    const out: string[] = [];
    let line = '';
    for (const w of text.split(' ')) {
      const tr = line ? `${line} ${w}` : w;
      if (c.measureText(tr).width > maxW && line) {
        out.push(line);
        line = w;
      } else line = tr;
    }
    if (line) out.push(line);
    return out;
  };
  const qf = `italic ${QUOTE_FS}px ${FONT.fell}`;
  const sf = `italic ${SRC_FS}px ${FONT.fell}`;
  let y = 21 + QUOTE_FS * 0.85;
  for (const l of wrap(BACK_QUOTE, qf)) {
    c.font = qf;
    const w = c.measureText(l).width;
    rows.push({ text: l, x: -w / 2, y, w, font: qf });
    y += QUOTE_FS * 1.08;
  }
  y += 2.6;
  for (const l of wrap(BACK_SRC, sf)) {
    c.font = sf;
    const w = Math.min(c.measureText(l).width, maxW * 1.04);
    rows.push({ text: l, x: -w / 2, y, w, font: sf });
    y += SRC_FS * 1.06;
  }
  return rows;
}

/** the write's progress: characters inked (0..1 of all) and the pencil tip (tag-local) */
function backProgress(c: CanvasRenderingContext2D, tq: number, sc: Sched): { ink: number; tip: Pt | null; rows: Row[] } {
  const rows = backRows(c);
  const total = rows.reduce((n, r) => n + r.text.length, 0);
  if (tq < sc.write1) return { ink: 0, tip: null, rows };
  const u = clamp01((tq - sc.write1) / (sc.write2 - sc.write1));
  // each row gets time in proportion to its length, with a short carriage return between rows
  const cr = 0.035;
  const span = 1 - cr * (rows.length - 1);
  let acc = 0;
  let done = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const du = (span * r.text.length) / total;
    if (u <= acc + du || i === rows.length - 1) {
      const p = clamp01((u - acc) / du);
      const ph = p * r.text.length * Math.PI * 1.6;
      const tip = { x: r.x + r.w * p + Math.cos(ph) * 0.9, y: r.y - 2.6 + Math.sin(ph) * 1.6 };
      return { ink: (done + p * r.text.length) / total, tip: u >= 1 ? null : tip, rows };
    }
    acc += du;
    done += r.text.length;
    if (u < acc + cr) {
      // the carriage return: the lead lifts and moves to the next row's start
      const p = (u - acc) / cr;
      const n = rows[i + 1];
      return { ink: done / total, tip: { x: lerp(r.x + r.w, n.x, smooth(p)), y: lerp(r.y, n.y, smooth(p)) - 2.6 - Math.sin(Math.PI * p) * 2.5 }, rows };
    }
    acc += cr;
  }
  return { ink: 1, tip: null, rows };
}

/** tag-local → world for tag 3 (eyelet origin, swing, flip squash) */
function tagToWorld(p: Pt, swing: number, flip: number): Pt {
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  const x = p.x * sx, y = p.y;
  return { x: A3.eye.x + x * Math.cos(swing) - y * Math.sin(swing), y: A3.eye.y + x * Math.sin(swing) + y * Math.cos(swing) };
}

/** the red pencil's pose with its lead at `tip` (world): the rig's own reach, aimed from the frame-right entry */
function pencilAt(tip: Pt, entry: Pt): HandsPose {
  const W = TAG.w * 0.6;
  return hands.pencil('write', 0.2999, { x: tip.x + W / 2, y: tip.y + LEN * 0.05 }, { scale: HS, entry, writeW: W });
}

/**
 * The pencil through the shot: in from frame right to the first letter (write0 → write1), writing row by row
 * (→ write2), lifting off to hover clear at the tag's right while the narrator's hand turns it face-front, then the
 * rig's own strike (stroke on strike3), and out to frame right.
 */
function pencilPose(cam: Camera3, tq: number, sc: Sched, wp: { tip: Pt | null; rows: Row[] }, strikePose: HandsPose | null): HandsPose | null {
  const E = hands.entry(cam, 'L4').pencil;
  if (tq < sc.write0) return null;
  const first = wp.rows[0];
  const startW = tagToWorld({ x: first.x, y: first.y - 2.6 }, 0, 1);
  if (tq < sc.write1) {
    // approach: the rig's write approach (u 0 → .3) onto the first letter
    const u = (0.3 * (tq - sc.write0)) / (sc.write1 - sc.write0);
    const W = TAG.w * 0.6;
    return hands.pencil('write', Math.min(0.2999, u), { x: startW.x + W / 2, y: startW.y + LEN * 0.05 }, { scale: HS, entry: E, writeW: W });
  }
  if (tq < sc.write2 && wp.tip) return pencilAt(tagToWorld(wp.tip, 0, 1), E);
  // hover clear of the tag's right edge, then onto the strike's start (lifted), then the rig's strike
  const last = wp.rows[wp.rows.length - 1];
  const endW = tagToWorld({ x: last.x + last.w, y: last.y - 2.6 }, 0, 1);
  const hover = { x: A3.eye.x + TAG.w * 0.95, y: A3.eye.y + TAG.h * 0.55 };
  const sg = strikeGeom();
  const p0 = { x: sg.centre.x - (Math.cos(sg.angle) * sg.w) / 2, y: sg.centre.y - (Math.sin(sg.angle) * sg.w) / 2 - LEN * 0.08 };
  const sAt = sc.strike0 + 0.3 * sc.strikeD;
  if (tq < sAt) {
    const toHover = smooth((tq - sc.write2) / 0.5);
    const toStart = smooth((tq - (sAt - 0.45)) / 0.45);
    const p = lerpP(lerpP(endW, hover, toHover), p0, toStart);
    p.y -= Math.sin(Math.PI * toHover) * 6 + Math.sin(Math.PI * toStart) * 5;
    return pencilAt(p, E);
  }
  return strikePose;
}

/** tag 3's back, upright: the fragment in red pencil and its source under it (inside L4, tag-local) */
function backText(c: CanvasRenderingContext2D, env: PaintEnv, o: { flip: number; swing: number; ink: number; subject: boolean }) {
  if (o.ink <= 0) return;
  const rows = backRows(c);
  const total = rows.reduce((n, r) => n + r.text.length, 0);
  let budget = Math.ceil(total * clamp01(o.ink));
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * o.flip)));
  c.save();
  c.translate(A3.eye.x, A3.eye.y);
  c.rotate(o.swing);
  c.scale(sx, 1);
  textRole(c, o.subject ? 'subject' : 'texture', () => {
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = pencilRed(env, 0.95);
    for (const r of rows) {
      if (budget <= 0) break;
      c.font = r.font;
      const part = r.text.slice(0, budget);
      // squeeze a row that would overrun the tag (the source's long word) rather than shrink it under the floor
      const nat = c.measureText(r.text).width;
      c.save();
      if (nat > r.w + 0.5) {
        c.translate(r.x, 0);
        c.scale(r.w / nat, 1);
        c.fillText(part, 0, r.y);
      } else c.fillText(part, r.x, r.y);
      c.restore();
      budget -= r.text.length;
    }
    const top = rows[0].y - QUOTE_FS;
    const bot = rows[rows.length - 1].y + 2;
    textProbe(c, `${ID}-back`, -TAG.w * 0.44, top, TAG.w * 0.88, bot - top, clamp01(o.ink));
  });
  c.restore();
}

/**
 * The small typed card that slides in over the Notes window on 'holds' (its own plane just in front of the desk):
 * “holds no text” in type, the source under it. Paper and type arrive together; it lifts away on the tie click as its
 * fragment inks onto the new tag.
 */
function typedCard(f: Frame, cam: Camera3, t: number, a: number, holds: number) {
  if (a <= 0.003) return;
  f.layer(CARD_L, (c, env) => {
    // anchored over the Notes window as the end camera sees it
    const nc = toScreen(LAYERS.L3, C6, NOTES_C.x, NOTES_C.y);
    const at = toLayer(CARD_L, C6, nc.x, nc.y + 18);
    const slide = 1 - smooth((t - holds + 0.12) / 0.5);
    const lift = 0;
    const cx = at.x + 34 * slide, cy = at.y - lift;
    const rot = -0.035 + 0.025 * (1 - slide);
    c.save();
    c.globalAlpha = a;
    c.translate(cx, cy);
    c.rotate(rot);
    textRole(c, 'subject', () => {
      const qf0 = `${7.2}px ${FONT.typewriter}`;
      const qs = legibleSize(c, qf0, 7.2, CARD_QUOTE);
      const sf0 = `italic ${7.4}px ${FONT.text}`;
      const ss = legibleSize(c, sf0, 7.4, CARD_SRC);
      c.font = `${qs}px ${FONT.typewriter}`;
      const qw = c.measureText(CARD_QUOTE).width;
      c.font = `italic ${ss}px ${FONT.text}`;
      const sw = c.measureText(CARD_SRC).width;
      const w = Math.max(qw, sw) + qs * 2.2;
      const h = qs * 1.25 + ss * 1.3 + qs * 1.5;
      // a soft shadow on the sheet behind, then the card (a cream index card, one rule)
      c.fillStyle = withAlpha('#0b0d0b', 0.22);
      c.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
      c.fillStyle = mixLab(mixLab('#f2e8d2', env.mood.halo, 0.18), env.mood.haze, 0.05);
      c.fillRect(-w / 2, -h / 2, w, h);
      c.strokeStyle = withAlpha(mixLab('#a64d1d', env.mood.halo, 0.4), 0.35);
      c.lineWidth = 0.4;
      c.beginPath();
      c.moveTo(-w / 2 + qs * 0.6, -h / 2 + qs * 0.55);
      c.lineTo(w / 2 - qs * 0.6, -h / 2 + qs * 0.55);
      c.stroke();
      cardProbe(c, `${ID}-card`, -w / 2, -h / 2, w, h, 1, 1);
      c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.25);
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.font = `${qs}px ${FONT.typewriter}`;
      const qy = -h / 2 + qs * 0.75 + qs * 1.05;
      c.fillText(CARD_QUOTE, 0, qy);
      c.font = `italic ${ss}px ${FONT.text}`;
      c.fillStyle = withAlpha(mixLab('#1d140d', env.mood.ink, 0.25), 0.85);
      c.fillText(CARD_SRC, 0, qy + ss * 1.35);
      textProbe(c, `${ID}-card`, -w / 2, -h / 2, w, h, 1);
    });
    c.restore();
  });
}
