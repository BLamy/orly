/**
 * handwired-explained — ch08-s02 / ch08-s03: THE COLD WINDOW (script meta staging.tagLine, variant ch08).
 * The tag-line workshop in winterBlue: a tall paned window wall at L2 whose lower panes are frosted, and through its
 * glass, far off in the haze, the Window Calendar (Device 2) with its dark August column and snow on the sill. Under the
 * windows a desk bay (its own soft depth, out of focus): a desk lamp, a logo-less laptop and, at its keyboard, the two
 * paper hand rigs (cast author-hands and the paler agent-hand, sets/narratorHands deskHands). The copper line hangs at
 * the chapter's height (52 %, sets/tagLine VARIANT_LINE_Y: shots translate their L4 by COLD_DY), frost on the posts.
 *
 *   coldRoom(f, { key, dawn, lamp, desk })   backlight, far calendar + sky, L2 wall, fog A, L3 shelf, desk bay, fog B,
 *                                            the desk lamp's practical (before L4, so the tags occlude it)
 *   frostPosts(c, env)                       frost caps and beads on the line's two posts (draw in L4, translated)
 *   coldNear(f, key)                         L6 near post at frame right, frosted (soft)
 *
 * dawn 0..1: the window behind the line lightens from night blue (0) to a pale cold grey (1) (ch08-s03's lamp change).
 */
import type { Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { windowWall } from '../../../film/silhouette/architecture';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { FONT, cardProbe, legibleSize, textRole } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { toLayer, toScreen } from '../../../film/core/multiplane';
import { LAYERS } from '../../../film/contracts';
import { LINE, RULE, TAGS, lifeX, lineYFor, tagAnchors, type TagState } from './tagLine';
import { windowCalendar } from './windowCalendar';
import { deskHands } from './narratorHands';

type C = CanvasRenderingContext2D;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** the chapter's line height (52 %) as an offset on the canonical tag-line geometry */
export const COLD_DY = lineYFor('ch08-s02') - LINE.y;

/** the far plane the calendar stands on, seen through the glass */
export const COLD_FAR: LayerSpec = { id: 'coldFar', z: 3200, haze: 0.42, blur: 2 };
/** the desk bay: between the wall and the line, deliberately soft (out of focus behind the sharp tag) */
export const COLD_DESK: LayerSpec = { id: 'coldDesk', z: 1600, haze: 0.32, blur: 2.6 };
/** the desk (front edge of the laptop base), desk-layer px; the lamp head */
export const DESK = { x: 566, y: 364, w: 108 } as const;
export const DESK_LAMP = { x: 492, y: 292 } as const;
/** window centres on the L2 wall (rest px) */
const WIN_CX = [-180, 190, 560, 930, 1300];
const WIN = { w: 250, apex: 30, sill: 520 };

export interface ColdRoomOpts {
  key: string;
  /** 0 night blue → 1 pale cold grey dawn */
  dawn?: number;
  /** desk lamp 0..1 */
  lamp?: number;
  /** the hands at the laptop: typing (s02) or none (s03, the desk empty at dawn) */
  desk?: { tq: number; hands: boolean; screen?: number };
}

export function coldRoom(f: Frame, o: ColdRoomOpts) {
  const dawn = clamp01(o.dawn ?? 0);
  // dawn re-bakes the sky in 12 steps, not every frame
  const dq = Math.round(dawn * 12) / 12;
  f.backlight({ sunX: 780, sunY: 300, intensity: 0.72 + 0.28 * dq });
  // ---- the far plane: a dawn wash over the night sky, then the calendar standing in the haze
  f.layer(COLD_FAR, (c, env) => {
    if (dq > 0) {
      c.save();
      const g = c.createLinearGradient(0, -400, 0, 1300);
      g.addColorStop(0, withAlpha(mixLab(env.mood.sky[1], '#c4cccf', 0.7), 0.9 * dq));
      g.addColorStop(0.5, withAlpha(mixLab(env.mood.sky[3], '#e0e4e3', 0.75), 0.96 * dq));
      g.addColorStop(1, withAlpha(mixLab(env.mood.sky[2], '#cdd2d2', 0.65), 0.92 * dq));
      c.fillStyle = g;
      c.fillRect(-2200, -400, 5600, 1700);
      c.restore();
    }
    // a low far ridge of roofs, and the Window Calendar framed by the second window from the right
    f.cached(`ch08cold/far/${env.mood.id}`, 5000, 420, (cc) => {
      cc.translate(2200, -600);
      cc.fillStyle = env.fill('set');
      cc.beginPath();
      cc.moveTo(-2200, 1020);
      for (let x = -2200; x <= 2800; x += 60) cc.lineTo(x, 760 + 26 * Math.sin(x * 0.011) + 18 * hash1(Math.floor(x / 60), 4));
      cc.lineTo(2800, 1020);
      cc.closePath();
      cc.fill();
    })(c, -2200, 600);
    c.save();
    c.translate(CAL_AT.x, CAL_AT.y);
    c.scale(CAL_AT.s, CAL_AT.s);
    c.fillStyle = env.fill('ink');
    c.fillRect(-190, -4, 380, 700);
    windowCalendar(f, c, env, { x: 0, y: 0, fill: { jun: 1, jul: 1 }, snow: true, warm: 0.7, key: 'ch08cold' });
    c.restore();
  });
  // ---- L2: the window wall, frosted low on the glass
  f.layer('L2', (c, env) => {
    f.cached(`ch08cold/L2/${env.mood.id}`, 2400, 1100, (cc) => {
      cc.translate(560, 250);
      wall(cc, env);
    })(c, -560, -250);
  });
  f.fog('A');
  // ---- L3: a long shelf under the windows (parchment plates, jars), the room's mid plane
  f.layer('L3', (c, env) => {
    f.cached(`ch08cold/L3/${env.mood.id}`, 2400, 420, (cc) => {
      cc.translate(560, -440);
      shelf(cc, env);
    })(c, -560, 440);
  });
  // ---- the desk bay (soft): lamp, laptop and the two hand rigs
  f.layer(COLD_DESK, (c, env) => {
    deskBay(f, c, env, o);
  });
  f.fog('B');
  // the desk lamp and the laptop screen: practicals behind the action plane (painted before L4)
  const lamp = clamp01(o.lamp ?? 0.85);
  // (the desk bay is its own depth: map its lamp and screen onto L3 for the practical painter)
  const onL3 = (x: number, y: number) => {
    const s = toScreen(COLD_DESK, f.cam, x, y);
    return toLayer(LAYERS.L3, f.cam, s.x, s.y);
  };
  if (lamp > 0.01) {
    const p = onL3(DESK_LAMP.x + 4, DESK_LAMP.y + 20);
    f.practical({ x: p.x, y: p.y, kind: 'lamp', seed: 83, intensity: 0.7 * lamp, radius: 62, layer: 'L3' });
  }
  if (o.desk && (o.desk.screen ?? 1) > 0.01) {
    const p = onL3(DESK.x, DESK.y - DESK.w * 0.3);
    f.practical({ x: p.x, y: p.y, kind: 'screen', seed: 85, intensity: 0.32 * (o.desk.screen ?? 1), radius: 44, layer: 'L3' });
  }
}

/** where the calendar stands on the far plane: in the glass above the line, right of the tag, at the mid-shot
 *  (s02's end framing = s03's opening), its main block ~300 px wide on screen there */
const CAL_CAM = { x: 796, y: 404, z: 165, lens: 2.5 };
const CAL_AT = (() => {
  const p = toLayer(COLD_FAR, CAL_CAM, 1030, 290);
  const k = toScreen(COLD_FAR, CAL_CAM, 0, 0).k;
  return { x: p.x, y: p.y, s: 300 / (353 * k) };
})();

function wall(c: C, env: PaintEnv) {
  windowWall(c, {
    x: -560, y: -250, w: 2400, h: 1100, centers: WIN_CX, winW: WIN.w, apex: WIN.apex, sill: WIN.sill,
    shape: 'flat', lights: 3, panes: { cols: 1, rows: 7 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true,
    cornice: 50, wainscot: 0, glass: 1, seed: 808,
  }, env);
  // frost: a pale bloom creeping in from each window's lower corners and along its sill (ch08: the cold window)
  for (const cx of WIN_CX) {
    for (const side of [-1, 1]) {
      const fx = cx + side * WIN.w * 0.5, fy = WIN.sill;
      const g = c.createRadialGradient(fx, fy, 6, fx, fy, 150);
      g.addColorStop(0, withAlpha('#f2f6f8', 0.34));
      g.addColorStop(0.5, withAlpha('#f2f6f8', 0.1));
      g.addColorStop(1, withAlpha('#f2f6f8', 0));
      c.fillStyle = g;
      c.fillRect(fx - 160, fy - 170, 320, 172);
    }
    const g2 = c.createLinearGradient(0, WIN.sill - 70, 0, WIN.sill);
    g2.addColorStop(0, withAlpha('#eef3f6', 0));
    g2.addColorStop(1, withAlpha('#eef3f6', 0.22));
    c.fillStyle = g2;
    c.fillRect(cx - WIN.w / 2, WIN.sill - 70, WIN.w, 70);
    // fern-like frost scratches on the lowest panes (cut-lines)
    c.strokeStyle = withAlpha('#f4f8fa', 0.16);
    c.lineWidth = 0.8;
    c.beginPath();
    for (let i = 0; i < 22; i++) {
      const x0 = cx - WIN.w / 2 + 8 + (hash1(i, Math.round(cx)) * 0.5 + 0.5) * (WIN.w - 16);
      const y0 = WIN.sill - 2;
      const a = -Math.PI / 2 + hash1(i, 7) * 0.9;
      const l = 14 + 26 * (hash1(i, 9) * 0.5 + 0.5);
      c.moveTo(x0, y0);
      c.lineTo(x0 + Math.cos(a) * l, y0 + Math.sin(a) * l);
      c.moveTo(x0 + Math.cos(a) * l * 0.5, y0 + Math.sin(a) * l * 0.5);
      c.lineTo(x0 + Math.cos(a - 0.6) * l * 0.8, y0 + Math.sin(a - 0.6) * l * 0.8);
    }
    c.stroke();
  }
  // the wall under the sills, in shadow
  c.fillStyle = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(-560, WIN.sill + 4, 2400, 600);
}

function shelf(c: C, env: PaintEnv) {
  const ink = env.fill('set');
  // the long shelf board and its brackets
  c.fillStyle = ink;
  c.fillRect(-560, 548, 2400, 12);
  for (let x = -520; x < 1840; x += 260) {
    c.beginPath();
    c.moveTo(x, 560);
    c.lineTo(x + 4, 560);
    c.lineTo(x + 30, 600);
    c.lineTo(x + 24, 600);
    c.closePath();
    c.fill();
  }
  // jars, a row of books, rolled plates (texture silhouettes along the shelf)
  for (let i = 0; i < 26; i++) {
    const x = -500 + i * 92 + 20 * hash1(i, 3);
    const k = Math.floor((hash1(i, 5) * 0.5 + 0.5) * 3);
    if (k === 0) {
      c.fillRect(x, 520, 18, 28);
      c.fillRect(x + 3, 514, 12, 6);
    } else if (k === 1) {
      for (let j = 0; j < 5; j++) c.fillRect(x + j * 6, 516 + (j % 2) * 4, 5, 32 - (j % 2) * 4);
    } else {
      c.beginPath();
      c.ellipse(x + 10, 538, 14, 10, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  // rim on the shelf's edge (tops only)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.45);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-560, 548.5);
  c.lineTo(1840, 548.5);
  c.stroke();
  // the bench body below, darker
  c.fillStyle = mixLab(ink, env.mood.fg, 0.4);
  c.fillRect(-560, 600, 2400, 260);
}

function deskBay(f: Frame, c: C, env: PaintEnv, o: ColdRoomOpts) {
  // the desk top under the window, a lamp on a weighted foot, the laptop
  f.cached(`ch08cold/desk/${env.mood.id}`, 520, 260, (cc) => {
    cc.translate(-(DESK.x - 300), -(DESK.y - 120));
    const ink = env.fill('ink');
    cc.fillStyle = ink;
    cc.fillRect(DESK.x - 150, DESK.y, 300, 7);
    cc.fillRect(DESK.x - 136, DESK.y + 7, 8, 110);
    cc.fillRect(DESK.x + 128, DESK.y + 7, 8, 110);
    // the anglepoise: foot, two arms, a shade tipped down toward the keys
    const L = DESK_LAMP;
    cc.fillRect(L.x - 40, DESK.y - 6, 34, 6);
    cc.lineWidth = 4;
    cc.strokeStyle = ink;
    cc.lineCap = 'round';
    cc.beginPath();
    cc.moveTo(L.x - 23, DESK.y - 5);
    cc.lineTo(L.x - 38, L.y + 40);
    cc.lineTo(L.x - 6, L.y + 4);
    cc.stroke();
    cc.beginPath();
    cc.moveTo(L.x - 14, L.y - 4);
    cc.lineTo(L.x + 20, L.y + 6);
    cc.lineTo(L.x + 12, L.y + 26);
    cc.lineTo(L.x - 8, L.y + 18);
    cc.closePath();
    cc.fill();
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.5);
    cc.lineWidth = 1.2;
    cc.beginPath();
    cc.moveTo(DESK.x - 150, DESK.y + 0.5);
    cc.lineTo(DESK.x + 150, DESK.y + 0.5);
    cc.stroke();
  })(c, DESK.x - 300, DESK.y - 120);
  const d = o.desk;
  if (!d) return;
  // the typists' forearms pass behind the desk's top edge (clipped there), so only hands and keys read
  c.save();
  c.beginPath();
  c.rect(DESK.x - 300, DESK.y - 300, 600, 302);
  c.clip();
  // the laptop (lid, lit screen, base) from the shared rig; the hands are drawn here, lying FLAT on the keys
  deskHands(c, { x: DESK.x, y: DESK.y, w: DESK.w, tq: d.tq, author: 'off', agent: 'off', screen: d.screen ?? 1 }, env);
  if (d.hands) flatHands(c, env, d.tq);
  c.restore();
}

/**
 * Two author hands and the paler agent hand lying flat over the keys, seen from behind the typist at keyboard height:
 * low rounded backs with the knuckle line on top, wrists running off toward us (clipped by the desk edge). Typing is a
 * two-drawing tap cycle on twos: on alternate twos one finger of each hand lifts a hair and drops.
 */
function flatHands(c: C, env: PaintEnv, tq: number) {
  const w = DESK.w;
  const deck = DESK.y - w * 0.045;
  const ink = env.fill('ink');
  const pale = mixLab(ink, env.mood.set, 0.35);
  const step = Math.floor(tq * 12 + 1e-6);
  const tap = step % 2;
  const pick = Math.floor(step / 2);
  const hand = (cx: number, hw: number, col: string, salt: number, mirror: number) => {
    const h = hw * 0.62;
    const lifted = tap ? Math.floor((hash1(pick, salt) * 0.5 + 0.5) * 4) : -1;
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(cx - hw, deck + 1);
    // the outer edge rising to the knuckle line
    c.quadraticCurveTo(cx - hw * 0.98, deck - h * 0.75, cx - hw * 0.7, deck - h * 0.92);
    // four knuckles / finger backs along the top, one of them lifted on the tap drawing
    for (let k = 0; k < 4; k++) {
      const kx = cx + mirror * (-hw * 0.7 + (k + 0.5) * hw * 0.36);
      const up = k === lifted ? h * 0.32 : 0;
      c.quadraticCurveTo(kx - mirror * hw * 0.09, deck - h * (1.12 - 0.06 * k) - up, kx + mirror * hw * 0.18, deck - h * (0.94 - 0.04 * k) - up * 0.5);
    }
    // the thumb side, dropping to the deck
    c.quadraticCurveTo(cx + hw * 0.95, deck - h * 0.45, cx + hw, deck + 1);
    c.closePath();
    c.fill();
    // the wrist and forearm running toward us, under the desk edge
    c.fillRect(cx - hw * 0.5, deck, hw * 1.0, 40);
  };
  hand(DESK.x - w * 0.2, w * 0.085, ink, 11, 1);
  hand(DESK.x + w * 0.04, w * 0.085, ink, 23, -1);
  hand(DESK.x + w * 0.29, w * 0.075, pale, 37, -1);
}

/**
 * A tag's knot card hung one row LOWER than the set hangs it (the set's own stacking offset for a second card): used
 * for tag 7, whose long card ('HandwiredOS's own design') otherwise covers tag 6's ('the README'). Pass the tag's state
 * with knot: [] to drawTags and draw its card here, after.
 */
export function lowerKnotCard(c: C, env: PaintEnv, st: TagState, rows = 1) {
  const label = TAGS[st.id].knot[0];
  if (!label) return;
  const s = st.scale ?? 1;
  const eye = tagAnchors(st).eye;
  const kin = clamp01(st.knotIn ?? 1) * clamp01(st.alpha ?? 1);
  if (kin <= 0) return;
  c.save();
  c.globalAlpha = kin;
  textRole(c, st.subject ? 'subject' : 'texture', () => {
    const fs = 6.6 * s;
    c.font = `600 ${fs.toFixed(2)}px ${FONT.sc}`;
    const tw = c.measureText(label).width;
    const cw = tw + 8 * s, ch = fs + 6 * s;
    const kx = eye.x - cw - 6 * s - rows * 4 * s, ky = eye.y - ch * 0.4 + rows * (ch + 2 * s);
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
    c.fillRect(kx + 1.5 * s, ky + 2 * s, cw, ch);
    c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.haze, env.layer.haze * 0.6);
    c.fillRect(kx, ky, cw, ch);
    c.strokeStyle = withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.85);
    c.lineWidth = 0.9 / (Math.hypot(c.getTransform().a, c.getTransform().b) || 1);
    c.beginPath();
    c.moveTo(kx + cw, ky + ch * 0.5);
    c.lineTo(eye.x, eye.y + 7 * s);
    c.stroke();
    c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
    c.textBaseline = 'middle';
    c.fillText(label, kx + 4 * s, ky + ch * 0.55);
  });
  c.restore();
}

/** tag 8's thread lane on the rule for a set of states (as drawTags counts it) */
function tag8Lane(states: TagState[]) {
  let lane = 0;
  for (const st of states) {
    if (st.id === '8') break;
    const def = TAGS[st.id];
    if (def.slack || def.kind === 'question' || def.kind === 'card' || !def.strands || st.drop === undefined) continue;
    lane += def.strands.length;
  }
  return lane;
}
/**
 * The drop fraction at which tag 8's thread has hung straight down and just turned onto the rule: its START, the
 * thread's foot at the rule (8 July). s02 ends with the thread hanging there; s03 drops it on from there.
 */
export function tag8Touch(states: TagState[]): number {
  const an = tagAnchors({ id: '8' });
  const ry = RULE.y + 5 + tag8Lane(states) * 2.6;
  const R = 10;
  const drop = Math.max(0, ry - R - an.bottom.y);
  const run = Math.max(0, Math.abs(lifeX(57, RULE) - an.bottom.x) - R);
  const corner = (Math.PI / 2) * R;
  return (drop + corner * 0.75) / (drop + corner + run);
}
/** where tag 8's thread meets the rule (tag-line space): its foot */
export function tag8Foot(): { x: number; y: number } {
  const an = tagAnchors({ id: '8' });
  return { x: an.bottom.x, y: RULE.y };
}

/** frost caps on the line's two turned posts and beads down their shafts (draw in L4 translated by COLD_DY) */
export function frostPosts(c: C, env: PaintEnv, melt = 0) {
  const y = LINE.y;
  const col = withAlpha(mixLab('#f2f6f8', env.mood.rim, 0.25), 0.85 * (1 - melt));
  c.fillStyle = col;
  for (const px of [LINE.x0, LINE.x1]) {
    c.beginPath();
    c.ellipse(px, y - 27, 6.5, 3, 0, Math.PI, 0);
    c.fill();
    c.fillRect(px - 8, y - 11.5, 16, 1.6);
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.arc(px + (i % 2 ? 3.6 : -3.4), y + 6 + i * 23 + 6 * hash1(i, px), 1.1, 0, Math.PI * 2);
      c.fill();
    }
  }
}

/** L6: the near post at frame right, frosted along its cap (soft; the red pencil is NOT resting on it in ch08) */
export function coldNear(f: Frame, key: string) {
  f.layer('L6', (c, env) => {
    f.cached(`ch08cold/L6/${key}/${env.mood.id}`, 220, 960, (cc) => {
      cc.translate(-1120, -20);
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.ellipse(1218, 452, 26, 18, 0, 0, Math.PI * 2);
      cc.rect(1190, 462, 56, 14);
      cc.rect(1198, 476, 40, 480);
      cc.rect(1186, 600, 64, 16);
      cc.fill();
      cc.fillStyle = withAlpha(mixLab('#f2f6f8', env.mood.rim, 0.3), 0.5);
      cc.beginPath();
      cc.ellipse(1218, 438, 22, 6, 0, Math.PI, 0);
      cc.fill();
    })(c, 1120, 20);
  });
}

// ---------------------------------------------------------------- tag 8's knot card (ch08-s02 threads it on; s03 keeps it)
/** who tied tag 8 on (script ch08-s02 nameCard), threaded on the knot from above */
export const KNOT_LINES = ['tied on by: unnamed participants', 'not attributable to Cheng'];
export interface KnotCardOpts {
  /** the knot on the line (tag-line space, before COLD_DY) */
  knot: { x: number; y: number };
  /** 0..1 presence (it threads down from above as it comes in) */
  a: number;
  paper: number;
  ink1: number;
  ink2: number;
  /** horizontal sway (stage px) */
  sway: number;
  /** subject text (legible) or texture (small, when the camera is wide) */
  legible: boolean;
  /** lift the card up its thread (stage px), making room for a strip under it */
  lift?: number;
  /** 0..1 a glint of window light across the card */
  glint?: number;
  /** probe id for the cards audit */
  id: string;
  /** the action plane's current scale (toScreen(L4, cam).k): the card keeps ONE world size, legible from KNOT_K_REF up */
  k: number;
}
/** the smallest action-plane scale at which tag 8's knot card and strip must read (s02's end, s03's mid-shot) */
export const KNOT_K_REF = 2.8;
/** a font size that holds one world size for any camera and reaches the legibility floor from KNOT_K_REF up */
export function heldSize(c: C, font: string, base: number, text: string, k: number): number {
  return Math.max(base, legibleSize(c, font, 0, text) * (k / KNOT_K_REF));
}
/** returns the card's rect (for pinning things under it) */
export function knotCard(c: C, env: PaintEnv, o: KnotCardOpts) {
  const fonts = { sc: FONT.sc, text: FONT.text };
  c.save();
  const f1 = heldSize(c, `600 8.2px ${fonts.sc}`, 6, KNOT_LINES[0], o.k);
  const f2 = heldSize(c, `italic 400 7.4px ${fonts.text}`, 5.4, KNOT_LINES[1], o.k);
  c.font = `600 ${f1}px ${fonts.sc}`;
  const w1 = c.measureText(KNOT_LINES[0]).width;
  c.font = `italic 400 ${f2}px ${fonts.text}`;
  const w2 = c.measureText(KNOT_LINES[1]).width;
  const cw = Math.max(w1, w2) + 14, ch = f1 * 1.25 + f2 * 1.3 + 9;
  const drop = (1 - o.a) * -26;
  const x0 = o.knot.x - cw / 2 + o.sway, y0 = o.knot.y - 20 - ch + drop - (o.lift ?? 0);
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.9 * o.a);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(o.knot.x - 4, y0 + ch);
  c.lineTo(o.knot.x, o.knot.y);
  c.lineTo(o.knot.x + 4, y0 + ch);
  c.stroke();
  c.globalAlpha = o.paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(x0 + 1.5, y0 + 2, cw, ch);
  c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.18), env.mood.core, 0.12);
  c.fillRect(x0, y0, cw, ch);
  if ((o.glint ?? 0) > 0.003) {
    const g = c.createLinearGradient(x0, y0, x0 + cw, y0 + ch);
    const u = o.glint ?? 0;
    g.addColorStop(Math.max(0, u - 0.2), withAlpha('#ffffff', 0));
    g.addColorStop(u, withAlpha('#ffffff', 0.35 * Math.sin(Math.PI * u)));
    g.addColorStop(Math.min(1, u + 0.2), withAlpha('#ffffff', 0));
    c.fillStyle = g;
    c.fillRect(x0, y0, cw, ch);
  }
  c.strokeStyle = withAlpha('#2a1d14', 0.35);
  c.lineWidth = 0.6;
  c.strokeRect(x0, y0, cw, ch);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.8);
  c.beginPath();
  c.arc(o.knot.x, y0 + ch - 3.2, 1.3, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  textRole(c, o.legible ? 'subject' : 'texture', () => {
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(mixLab('#2a1d14', env.mood.ink, 0.2), o.ink1);
    c.font = `600 ${f1}px ${fonts.sc}`;
    c.fillText(KNOT_LINES[0], x0 + cw / 2, y0 + 4 + f1);
    c.fillStyle = withAlpha(mixLab('#4a3626', env.mood.ink, 0.2), o.ink2);
    c.font = `italic 400 ${f2}px ${fonts.text}`;
    c.fillText(KNOT_LINES[1], x0 + cw / 2, y0 + 4 + f1 * 1.25 + f2 * 1.05);
  });
  cardProbe(c, o.id, x0, y0, cw, ch, o.paper, o.ink1);
  c.restore();
  return { x: x0, y: y0, w: cw, h: ch };
}
