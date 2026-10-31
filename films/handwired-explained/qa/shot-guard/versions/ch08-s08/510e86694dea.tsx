/**
 * ch08-s08 — DECISIONS MADE, THE LIGHTS COME BACK ON, AND TAG 8 HANGS STRUCK. dawnGold morning, crossfade in from
 * ch08-s07's desk; 6.33 s on the locked clock (L0813 "In mid-September, he settled three questions." 0.80 → 2.92).
 *
 * A. THE DESK, CLOSE (sets/ch08-s07-desk; the hands still resting beside the keyboard, as s07 left them)
 *   desk      (0.20)  the date "14 SEPTEMBER 2026" sets top-left; a paper slip on the desk inks the three decisions'
 *                     label: "an index read · one comparison helper · JS writes springs"
 *   cards     (2.12)  three small paper question cards slide in from the left under Cheng's left hand, each coming to
 *                     rest above its own words on the slip
 *   stamp     (2.39)  the small stamp (ch08-s06's: a plain ring-and-tick, no words) presses each card in turn, the same
 *                     mark three times: the option the review had recommended (shown, never said)
 *   (2.64 → 3.36)     the camera rises; a near shelf passes the lens (an L6-style soft occluder, screen-locked) and
 *                     under it the shot moves to the workshop
 * B. THE THAWING WINDOW (staging tagLine variant 'ch08-late'): the workshop in morning dawnGold, the frost on its window
 *    wall thawing from the panes' edges, the Window Calendar (sets/windowCalendar, canonical grid, exact counts) seen
 *    through the clearing glass; the copper line at 52 % of frame height (the ch08 variant) with the canonical tags.
 *   relight   (3.13)  September's column relights bottom-up in a ripple, 58 panes (June 72, July 6, August dark with
 *                     snow on its sill, October's first six still dark: not yet); the date swaps to "SEPTEMBER 2026 · 58"
 *                     while the camera pulls back and settles onto the line in front of the building
 *   strike    (4.33)  the red-pencil hand enters from frame RIGHT and strikes tag 8's front through once
 *   rule      (4.93)  tag 8's thread, dropped in s03 to about eight weeks on the Lifespan Rule, glints once along its run
 *   (to 6.33)         hold; the frost beads on the post. Ends into ch09-s01's lampChange.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { FONT, cam3Interp, cardPaperAlpha, cardProbe, defineShot, hash1, legibleSize, mixLab, softPlate, textProbe, textRole, withAlpha } from '../../../film';
import { hands } from '../cast';
import { deskBack, deskFrameLine, deskFront, DESK } from '../sets/ch08-s07-desk';
import { windowCalendar } from '../sets/windowCalendar';
import { LINE, RULE, TAG, TAGS, drawLine, drawRule, drawTags, lifeX, tagAnchors, tagStrike, tagsAt, type TagState } from '../sets/tagLine';

type C2 = CanvasRenderingContext2D;
const ID = 'ch08-s08';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

interface Beats {
  D: number;
  desk: number;
  cards: number;
  stamp: number;
  relight: number;
  strike: number;
  rule: number;
  /** the hidden cut under the passing shelf */
  cut: number;
}

// ---------------------------------------------------------------- A. the desk
const CAM_A0: Camera3 = { x: 646, y: 536, z: 348, lens: 1 };
const CAM_A1: Camera3 = { x: 646, y: 530, z: 370, lens: 1 };
const LABEL_SEGS = ['an index read', 'one comparison helper', 'JS writes springs'];
const SEP = '  ·  ';
const SLIP_Y = 602; // baseline of the slip's text (L4 rest)
const CARD_TOP = 536;
const CARD_H = 38;
const CARD_W = 86;

// ---------------------------------------------------------------- B. the workshop
const CAL_L: LayerSpec = { id: 'cal', z: 2600, haze: 0.2, blur: 1 };
/** the calendar's base centre (CAL_L rest px) and its scale (one canonical grid, drawn twice the size: we are near) */
const CAL_AT = { x: 586, y: 474, s: 2 } as const;
/** the workshop's window holes (L2 rest px) */
const WINS = [300, 720, 1140].map((cx) => ({ x0: cx - 165, x1: cx + 165, y0: -120, y1: 500 }));
/** the line at 52 % (the ch08 variant): everything on the line is drawn with the canonical geometry, shifted up */
const DY = 720 * 0.52 - LINE.y;
const CAM_B0: Camera3 = { x: 724, y: 286, z: 560, lens: 1 };
const CAM_B1: Camera3 = { x: 792, y: 432, z: 520, lens: 1 };
/** after the strike: a slight pull back so the Lifespan Rule comes into frame for the thread's glint */
const CAM_B2: Camera3 = { x: 788, y: 452, z: 436, lens: 1 };
const CAM_B3: Camera3 = { x: 786, y: 454, z: 420, lens: 1 };
const STRIKE_D = 1.5;

/** tag 8's lane on the rule's face (drawTags stacks thread runs in tag order) */
const T8_LANE = (() => {
  let lane = 0;
  for (const st of tagsAt(ID, 'start')) {
    const def = TAGS[st.id];
    if (def.slack || def.kind === 'question' || def.kind === 'card') continue;
    if (!def.strands || st.drop === undefined) continue;
    if (st.id === '8') return lane;
    lane += def.strands.length;
  }
  return lane;
})();

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const beats: Beats = {
      D: T.duration,
      desk: T.beat('desk'),
      cards: T.beat('cards'),
      stamp: T.beat('stamp'),
      relight: T.beat('relight'),
      strike: T.beat('strike'),
      rule: T.beat('rule'),
      cut: 2.99,
    };
    tl.hold(0, T.duration);
    return { tl, beats };
  },
  paint(f, _s, scene) {
    const b = scene.beats as Beats;
    const t = f.t;
    if (t < b.cut) paintDesk(f, t, b);
    else paintWorkshop(f, t, b);
    occluder(f, t, b);
    dates(f, t, b);
  },
});

// ================================================================ A. the desk
function paintDesk(f: Frame, t: number, b: Beats) {
  const tq = f.tq;
  const rise = clamp01((t - 2.64) / (b.cut + 0.05 - 2.64));
  const base = cam3Interp(CAM_A0, CAM_A1)(sm(t / 2.8));
  const cam: Camera3 = { ...base, y: base.y - 210 * rise * rise };
  f.camera(cam);
  deskBack(f, { key: ID, lamp: 0.7 });
  f.layer('L4', (c, env) =>
    deskFront(c, env, {
      tq,
      hands: { rest: 1, agentRim: 0.75, typing: false },
      screen: 0.6,
      under: (cc, e) => {
        slip(cc, e, t, b);
        cards(cc, e, t, tq, b);
      },
      over: (cc, e) => stampTool(cc, e, tq, b),
    }),
  );
  f.layer('L5', (c, env) => deskFrameLine(c, env, { tq }));
}

/** the slip's segment centres (L4 rest x), measured in the slip's own font */
function slipLayout(c: C2) {
  const size = legibleSize(c, `500 17px ${FONT.text}`, 17);
  const font = `500 ${size}px ${FONT.text}`;
  c.save();
  c.font = font;
  const ws = LABEL_SEGS.map((s) => c.measureText(s).width);
  const sw = c.measureText(SEP).width;
  c.restore();
  const total = ws.reduce((a, w) => a + w, 0) + 2 * sw;
  let x = DESK.x - total / 2;
  const centres: number[] = [];
  const starts: number[] = [];
  ws.forEach((w) => {
    starts.push(x);
    centres.push(x + w / 2);
    x += w + sw;
  });
  return { size, font, ws, sw, total, centres, starts, x0: DESK.x - total / 2 };
}

/** the paper slip on the desk: the three decisions' label, inked left to right as the shot opens */
function slip(c: C2, env: PaintEnv, t: number, b: Beats) {
  const L = slipLayout(c);
  const inkAt = b.desk + 0.1;
  const paper = cardPaperAlpha(t, inkAt, 0.3) * (1 - seg(t, 2.8, 2.97));
  if (paper <= 0.01) return;
  const ink = seg(t, inkAt, inkAt + 1.1);
  const x0 = L.x0 - 22, x1 = L.x0 + L.total + 22;
  const y0 = SLIP_Y - L.size * 1.05, y1 = SLIP_Y + L.size * 0.55;
  c.save();
  c.globalAlpha = paper;
  // the slip lies on the desk: a pale strip a hair off square, its far edge lit
  c.fillStyle = withAlpha('#000000', 0.25);
  c.fillRect(x0 + 3, y0 + 4, x1 - x0, y1 - y0);
  c.fillStyle = mixLab(mixLab('#e6d4ab', env.mood.halo, 0.25), env.mood.ink, 0.12);
  c.beginPath();
  c.moveTo(x0 + 6, y0);
  c.lineTo(x1, y0 + 1.5);
  c.lineTo(x1 - 4, y1);
  c.lineTo(x0, y1 - 1);
  c.closePath();
  c.fill();
  c.restore();
  cardProbe(c, `${ID}-slip`, x0, y0, x1 - x0, y1 - y0, paper, ink > 0 ? 1 : 0);
  textRole(c, 'subject', () => {
    c.save();
    c.globalAlpha = paper;
    c.font = L.font;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.beginPath();
    c.rect(L.x0 - 4, y0 - 6, (L.total + 8) * ink, y1 - y0 + 12);
    c.clip();
    c.fillStyle = mixLab('#20160e', env.mood.ink, 0.2);
    let x = L.x0;
    LABEL_SEGS.forEach((s, i) => {
      c.fillText(s, x, SLIP_Y);
      x += L.ws[i];
      if (i < 2) {
        c.fillText(SEP, x, SLIP_Y);
        x += L.sw;
      }
    });
    c.restore();
    textProbe(c, `${ID}-label`, L.x0, SLIP_Y - L.size * 0.8, L.total, L.size, paper * (ink > 0.3 ? 1 : ink));
  });
}

/** card k's centre x and slide (from under the left hand) at time t */
function cardPos(c: C2, k: number, t: number, b: Beats) {
  const L = slipLayout(c);
  const to = L.centres[k];
  const t0 = b.cards - 0.3 + k * 0.07;
  const u = smr((t - t0) / 0.42);
  const from = DESK.x - DESK.w * 0.95;
  return { x: lerp(from, to, u), on: t >= t0, u };
}
function cardStampAt(b: Beats, k: number) {
  return b.stamp + k * 0.17;
}

/** three small paper question cards lying on the desk (foreshortened), each with a printed question mark */
function cards(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const fade = 1 - seg(t, 2.8, 2.97);
  for (let k = 0; k < 3; k++) {
    const p = cardPos(c, k, tq, b);
    if (!p.on) continue;
    const cx = p.x;
    const yT = CARD_TOP, yB = CARD_TOP + CARD_H;
    const wT = CARD_W * 0.9, wB = CARD_W;
    c.save();
    c.globalAlpha = fade;
    c.fillStyle = withAlpha('#000000', 0.3);
    c.beginPath();
    c.moveTo(cx - wT / 2 + 3, yT + 4);
    c.lineTo(cx + wT / 2 + 3, yT + 4);
    c.lineTo(cx + wB / 2 + 3, yB + 4);
    c.lineTo(cx - wB / 2 + 3, yB + 4);
    c.closePath();
    c.fill();
    c.fillStyle = mixLab(mixLab('#efe2c2', env.mood.halo, 0.2), env.mood.ink, 0.08);
    c.beginPath();
    c.moveTo(cx - wT / 2, yT);
    c.lineTo(cx + wT / 2, yT);
    c.lineTo(cx + wB / 2, yB);
    c.lineTo(cx - wB / 2, yB);
    c.closePath();
    c.fill();
    // printed: a question mark at the left, two ruled lines (foreshortened)
    c.save();
    c.translate(cx, (yT + yB) / 2);
    c.scale(1, 0.55);
    textRole(c, 'texture', () => {
      c.font = `600 34px ${FONT.display}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = withAlpha('#2a1d14', 0.8);
      c.fillText('?', -wB * 0.27, 2);
    });
    c.fillStyle = withAlpha('#2a1d14', 0.25);
    c.fillRect(-wB * 0.08, -10, wB * 0.4, 2.4);
    c.fillRect(-wB * 0.08, 4, wB * 0.3, 2.4);
    // the stamp's mark (dark ink, the same mark on each card), from its press on
    const at = cardStampAt(b, k);
    if (tq >= at) {
      const a = 0.85 * seg(tq, at, at + 0.05);
      ringTick(c, wB * 0.22, 0, 16, withAlpha(mixLab('#21170f', '#3a2a40', 0.25), a));
    }
    c.restore();
    c.restore();
  }
}

/** the stamp's impression: a ring and a tick (no words) */
function ringTick(c: C2, x: number, y: number, r: number, col: string) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.1);
  c.strokeStyle = col;
  c.lineWidth = r * 0.16;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = r * 0.2;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(-r * 0.42, r * 0.05);
  c.lineTo(-r * 0.12, r * 0.38);
  c.lineTo(r * 0.48, -r * 0.38);
  c.stroke();
  c.restore();
}

/** the small stamp (ch08-s06's): comes down from above, presses each card in turn, lifts away up */
function stampTool(c: C2, env: PaintEnv, tq: number, b: Beats) {
  const s0 = cardStampAt(b, 0), s2 = cardStampAt(b, 2);
  const enter = s0 - 0.32;
  const gone = s2 + 0.45;
  if (tq < enter || tq > gone) return;
  // which card, and the height above it: a press of 2 frames, a 0.17 s hop between cards
  let h: number;
  let x: number;
  const cx = (k: number) => cardPos(c, k, tq, b).x + CARD_W * 0.22;
  const yAt = CARD_TOP + CARD_H / 2;
  if (tq < s0) {
    h = 380 * (1 - sm((tq - enter) / (s0 - enter)));
    x = cx(0);
  } else if (tq < s2) {
    const k = Math.min(1, Math.floor((tq - s0) / 0.17));
    const u = (tq - cardStampAt(b, k)) / 0.17;
    x = lerp(cx(k), cx(k + 1), sm((u - 0.15) / 0.75));
    h = u < 0.12 ? 0 : 34 * Math.sin(Math.PI * clamp01((u - 0.12) / 0.88));
  } else {
    x = cx(2);
    h = tq < s2 + 0.08 ? 0 : 420 * sm((tq - s2 - 0.08) / 0.37);
  }
  const y = yAt - h;
  c.save();
  c.translate(x, y);
  c.scale(0.9, 0.9);
  const ink = '#0b0d0b';
  c.fillStyle = ink;
  c.fillRect(-25, -8, 50, 8);
  c.fillRect(-22, -22, 44, 14);
  c.beginPath();
  c.moveTo(-9, -22);
  c.quadraticCurveTo(-4, -42, -7, -60);
  c.lineTo(7, -60);
  c.quadraticCurveTo(4, -42, 9, -22);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(0, -72, 14, 13, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.8);
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(0, -72, 13, Math.PI * 1.15, Math.PI * 1.85);
  c.moveTo(-22, -22);
  c.lineTo(22, -22);
  c.stroke();
  c.restore();
}

// ================================================================ B. the workshop, the calendar, the line
function camB(t: number, b: Beats): Camera3 {
  const t1 = b.cut + 1.1;
  const t2 = b.strike + 0.22;
  const t3 = b.rule + 0.2;
  if (t < t1) return cam3Interp(CAM_B0, CAM_B1)(smr((t - b.cut) / (t1 - b.cut)) * 0.8 + sm((t - b.cut) / (t1 - b.cut)) * 0.2);
  if (t < t2) return CAM_B1;
  if (t < t3) return cam3Interp(CAM_B1, CAM_B2)(sm((t - t2) / (t3 - t2)));
  return cam3Interp(CAM_B2, CAM_B3)(sm((t - t3) / (b.D - t3)));
}

function paintWorkshop(f: Frame, t: number, b: Beats) {
  const tq = f.tq;
  const cam = camB(t, b);
  f.camera(cam);
  f.backlight({ sunX: 760, sunY: 330, intensity: 1 });
  // the Window Calendar beyond the glass: September relights bottom-up (58 panes, the first on 3 September)
  const sepU = clamp01((t - (b.relight + 0.12)) / 1.15);
  f.layer(CAL_L, (c, env) => {
    c.save();
    c.translate(CAL_AT.x, CAL_AT.y);
    c.scale(CAL_AT.s, CAL_AT.s);
    windowCalendar(f, c, env, { x: 0, y: 0, fill: { jun: 1, jul: 1, aug: 0, sep: Math.pow(sepU, 0.85), oct: 0 }, snow: true, warm: 0.85, key: ID });
    c.restore();
    // the relight's ripple: a soft warm bloom riding the newest panes up the column
    if (sepU > 0 && sepU < 1.05) {
      const top = CAL_AT.y - CAL_AT.s * (10 + 9.8 * Math.ceil((58 * sepU) / 6));
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(CAL_AT.x + 136, top, 4, CAL_AT.x + 136, top, 90);
      g.addColorStop(0, withAlpha(env.mood.core, 0.3 * (1 - sepU * 0.6)));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(CAL_AT.x + 36, top - 90, 200, 180);
      c.restore();
    }
  });
  // the workshop's window wall (holes), its frost thawing from the panes' edges
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/L2/${env.mood.id}`, 1900, 1200, (cc) => {
      cc.translate(330, 300);
      workshopWall(cc, env);
    })(c, -330, -300);
    frost(c, env, clamp01((t - b.cut) / (b.D - b.cut)));
  });
  f.fog({ yCenter: 470, height: 260, alpha: 0.16, drift: 6 });
  f.layer('L3', (c, env) => {
    f.cached(`${ID}/L3/${env.mood.id}`, 1900, 420, (cc) => {
      cc.translate(330, -440);
      bench(cc, env);
    })(c, -330, 440);
  });
  f.fog('B');
  // the line, the rule, the tags; the pencil's strike and the thread's glint
  const strikeU = clamp01((tq - (b.strike - 0.35 * STRIKE_D)) / STRIKE_D);
  const sk = tagStrike({ id: '8' } as TagState);
  const pp = strikeU > 0 && strikeU < 1 ? hands.pencil('strike', strikeU, sk.centre, { strikeW: sk.w, strikeAngle: sk.angle, scale: 1.05, entry: entryLocal(cam) }) : null;
  const stroke = strikeU >= 0.47 ? 1 : pp?.stroke ?? 0;
  const kick = t > b.strike ? 0.06 * Math.exp(-(t - b.strike) * 2.4) * Math.sin((t - b.strike) * 8) : 0;
  const tags = tagsAt(ID, 'start').map((st) => (st.id === '8' ? { ...st, strike: stroke, swing: 0.022 + kick, phase: 0.4 } : st));
  f.layer('L4', (c, env) => {
    c.save();
    c.translate(0, DY);
    drawLine(c, env, { glow: 0.6 });
    beads(c, env, t, b);
    drawRule(c, env, { labels: 1 });
    drawTags(c, env, tags, { tq });
    glint(c, env, t, b);
    if (pp) hands.draw(c, pp, env);
    c.restore();
  });
  f.rim({ x: 0, y: -1 });
  f.layer('L6', (c, env) => nearPost(c, env));
}

/** the pencil's entry (frame lower right) in the line's shifted L4 coordinates */
function entryLocal(cam: Camera3) {
  const e = hands.entry(cam, 'L4').pencil;
  return { x: e.x, y: e.y - DY };
}

/** L2: the workshop wall, three tall flat-headed windows (holes) with mullions and deep sills */
function workshopWall(c: C2, env: PaintEnv) {
  const wall = env.fill('set');
  c.fillStyle = wall;
  c.beginPath();
  c.rect(-330, -300, 1900, 1200);
  for (const w of WINS) c.rect(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0);
  c.fill('evenodd');
  const ink = mixLab(wall, env.mood.ink, 0.5);
  c.fillStyle = ink;
  for (const w of WINS) {
    const cols = 2, rows = 6;
    for (let i = 1; i < cols; i++) c.fillRect(lerp(w.x0, w.x1, i / cols) - 4, w.y0, 8, w.y1 - w.y0);
    for (let j = 1; j < rows; j++) c.fillRect(w.x0, lerp(w.y0, w.y1, j / rows) - 3, w.x1 - w.x0, 6);
    // the frame and the sill
    c.fillRect(w.x0 - 4, w.y0, 8, w.y1 - w.y0);
    c.fillRect(w.x1 - 4, w.y0, 8, w.y1 - w.y0);
    c.fillRect(w.x0 - 18, w.y1, w.x1 - w.x0 + 36, 14);
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.6);
  c.lineWidth = 1.5;
  c.beginPath();
  for (const w of WINS) {
    c.moveTo(w.x0 - 18, w.y1 + 0.5);
    c.lineTo(w.x1 + 18, w.y1 + 0.5);
  }
  c.stroke();
  // the morning falling on the piers between the windows (a soft warm lift)
  for (const w of WINS) {
    const g = c.createLinearGradient(w.x1, 0, w.x1 + 90, 0);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.14));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(w.x1 + 4, w.y0, 90, w.y1 - w.y0);
  }
}

/** frost on the glass (L2), thawing: a pale bloom in each pane's lower corners and along the frames, shrinking as
 *  the morning warms (u 0 → 1), with a few beads of melt left behind on the lower bars */
function frost(c: C2, env: PaintEnv, u: number) {
  const k = 1 - 0.7 * sm(u);
  const pale = mixLab(env.mood.core, '#f4f8fa', 0.5);
  c.save();
  for (const w of WINS) {
    c.save();
    c.beginPath();
    c.rect(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0);
    c.clip();
    for (const [cx, cy] of [[w.x0, w.y1], [w.x1, w.y1], [w.x0, w.y0 + 160], [w.x1, w.y0 + 160]] as const) {
      const r = 150 * k;
      const g = c.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      g.addColorStop(0, withAlpha(pale, 0.3 * k));
      g.addColorStop(1, withAlpha(pale, 0));
      c.fillStyle = g;
      c.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    }
    // beads of melt along the lowest bar
    c.fillStyle = withAlpha(pale, 0.55 * (0.4 + 0.6 * sm(u)));
    for (let i = 0; i < 9; i++) {
      const bx = w.x0 + 18 + i * ((w.x1 - w.x0 - 36) / 8) + 6 * hash1(i, 3);
      c.beginPath();
      c.arc(bx, w.y1 - 6, 1.6 + 0.6 * hash1(i, 5), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  c.restore();
}

/** L3: the workbench with its parchment plates pinned along the back edge (the canonical workshop's bench) */
function bench(c: C2, env: PaintEnv) {
  const ink = env.fill('set');
  const plates = [[40, 484, 120, 80], [210, 498, 96, 64], [900, 488, 110, 74], [1060, 478, 130, 88]];
  for (const [x, y, w, h] of plates) {
    c.fillStyle = mixLab(mixLab('#e2cfa4', env.mood.halo, 0.4), env.mood.haze, 0.35);
    c.fillRect(x, y, w, h);
    c.fillStyle = withAlpha(env.mood.ink, 0.22);
    for (let i = 0; i < 4; i++) c.fillRect(x + w * 0.12, y + h * (0.22 + i * 0.17), w * (0.7 - (i % 2) * 0.2), 1.6);
  }
  c.fillStyle = ink;
  c.fillRect(-330, 560, 1900, 14);
  c.fillStyle = mixLab(ink, env.mood.fg, 0.35);
  c.fillRect(-330, 574, 1900, 300);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.55);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-330, 560);
  c.lineTo(1570, 560);
  c.stroke();
}

/** frost melting to beads on the right post's finial and collar (the posts at the line's ends) */
function beads(c: C2, env: PaintEnv, t: number, b: Beats) {
  const px = LINE.x1;
  const y = LINE.y;
  const u = clamp01((t - b.cut) / (b.D - b.cut));
  const pale = mixLab(env.mood.core, '#f4f8fa', 0.45);
  const pts: [number, number, number][] = [[px - 5, y - 26, 1.9], [px + 4, y - 17, 1.6], [px - 7, y - 8, 1.7], [px + 6, y - 6, 1.5], [px - 2, y + 4, 2]];
  pts.forEach(([x, yy, r], i) => {
    const drip = sm(u * 1.4 - i * 0.12) * 6;
    c.fillStyle = withAlpha(pale, 0.75);
    c.beginPath();
    c.arc(x, yy + drip, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha('#ffffff', 0.8);
    c.beginPath();
    c.arc(x - r * 0.35, yy + drip - r * 0.35, r * 0.35, 0, Math.PI * 2);
    c.fill();
  });
}

/** tag 8's thread glints once: a bead of light runs along its run on the rule to the cut tip at about eight weeks */
function glint(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = (t - b.rule) / 0.55;
  if (u < -0.05 || u > 1.9) return;
  const an = tagAnchors({ id: '8' } as TagState);
  const ry = RULE.y + 5 + T8_LANE * 2.6;
  const lx = lifeX(TAGS['8'].strands![0].days);
  const R = 10;
  // path: down from the tag's bottom, round the corner, along the rule (leftward) to lx
  const drop = ry - R - an.bottom.y;
  const run = an.bottom.x - R - lx;
  const total = drop + (Math.PI / 2) * R + run;
  const at = (s: number) => {
    if (s <= drop) return { x: an.bottom.x, y: an.bottom.y + s };
    s -= drop;
    const corner = (Math.PI / 2) * R;
    if (s <= corner) {
      const a = s / R;
      return { x: an.bottom.x - R + R * Math.cos(a), y: ry - R + R * Math.sin(a) };
    }
    s -= corner;
    return { x: an.bottom.x - R - Math.min(s, run), y: ry };
  };
  c.save();
  c.globalCompositeOperation = 'lighter';
  if (u <= 1) {
    const p = at(sm(u) * total);
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 24);
    g.addColorStop(0, withAlpha(env.mood.core, 1));
    g.addColorStop(0.25, withAlpha(env.mood.halo, 0.5));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - 24, p.y - 24, 48, 48);
  }
  // the tip flares as the bead arrives, then fades
  const fl = u > 0.85 ? Math.exp(-(u - 0.95) * (u - 0.95) * 30) : 0;
  if (fl > 0.01) {
    const g = c.createRadialGradient(lx, ry, 0, lx, ry, 34);
    g.addColorStop(0, withAlpha(env.mood.core, 0.95 * fl));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(lx - 34, ry - 34, 68, 68);
  }
  c.restore();
  void TAG;
}

/** L6: the near post at frame right (soft) */
function nearPost(c: C2, env: PaintEnv) {
  c.fillStyle = env.fill('fg');
  c.beginPath();
  c.ellipse(1250, 452, 26, 18, 0, 0, Math.PI * 2);
  c.rect(1222, 462, 56, 14);
  c.rect(1230, 476, 40, 430);
  c.rect(1218, 600, 64, 16);
  c.fill();
}

// ================================================================ screen-locked: the passing shelf and the dates
/** a near shelf passing the lens as the camera rises (soft, screen-locked: an L6-depth occluder): covers the cut */
function occluder(f: Frame, t: number, b: Beats) {
  const t0 = 2.64, t1 = 3.36;
  if (t < t0 || t > t1) return;
  const u = (t - t0) / (t1 - t0);
  const H = 1000;
  const top = lerp(-H - 20, 760, u);
  const c = f.c;
  c.save();
  const g = c.createLinearGradient(0, top, 0, top + H);
  const ink = f.mood.fg;
  g.addColorStop(0, withAlpha(ink, 0));
  g.addColorStop(0.09, withAlpha(ink, 0.98));
  g.addColorStop(0.9, withAlpha(ink, 0.98));
  g.addColorStop(1, withAlpha(ink, 0));
  c.fillStyle = g;
  c.fillRect(-20, top, 1320, H);
  // the shelf's front edge catching the lamp (its leading, lower edge)
  const e = top + H * 0.9;
  const eg = c.createLinearGradient(0, e - 14, 0, e + 4);
  eg.addColorStop(0, withAlpha(f.mood.rim, 0));
  eg.addColorStop(0.7, withAlpha(f.mood.rim, 0.22));
  eg.addColorStop(1, withAlpha(f.mood.rim, 0));
  c.fillStyle = eg;
  c.fillRect(-20, e - 14, 1320, 18);
  c.restore();
  void b;
}

/** "14 SEPTEMBER 2026" on the desk, swapping to "SEPTEMBER 2026 · 58" with the relight (never both at once) */
function dates(f: Frame, t: number, b: Beats) {
  const c = f.c;
  const a1 = seg(t, b.desk - 0.05, b.desk + 0.35) * (1 - seg(t, 2.6, 2.84));
  const a2 = seg(t, b.relight + 0.15, b.relight + 0.55) * (1 - seg(t, b.D - 0.6, b.D - 0.15));
  const one = (txt: string, a: number, id: string) => {
    if (a <= 0.01) return;
    c.save();
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `500 21px ${FONT.mono}`, 21);
      const font = `500 ${size}px ${FONT.mono}`;
      c.font = font;
      c.letterSpacing = '2px';
      const w = c.measureText(txt).width;
      c.globalAlpha = a;
      softPlate(c, 52 + w / 2, 62, w + 140, size + 56, f.mood.ink, 0.5);
      c.fillStyle = mixLab('#efe6d2', f.mood.core, 0.25);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillText(txt, 52, 70);
      textProbe(c, id, 52, 70 - size, w, size * 1.2, a);
    });
    c.restore();
  };
  one('14 SEPTEMBER 2026', a1, `${ID}-date1`);
  one('SEPTEMBER 2026 · 58', a2, `${ID}-date2`);
}
