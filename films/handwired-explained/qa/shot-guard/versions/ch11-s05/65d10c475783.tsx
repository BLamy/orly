/**
 * ch11-s05 — STILL OPEN (scene, dawnGold; crossfade in from ch11-s04's blue plate; 19.13 s).
 *   L1110  "The third parser's final test hasn't run yet. That question stays open."
 *   L1110a "So does the lab's own list."
 *   L1110b "It says plainly: “a general JavaScript compiler” is “not delivered by these experiments.”"
 *
 * THE WORKSHOP AT FIRST LIGHT, 16 October 2026 (staging.tagLine ch11: canonical workshop going to dawnGold, the ledger
 * cabinet by the bench). Window wall (L2) with the dawn ridge beyond it (L1), the bench and pigeonholes (L3) under two
 * slanting beams, the copper line, the border tag and the lab's ledger cabinet (L4, the one sharp plane), the
 * narrator's chair back passing close to the lens (L5).
 *
 * TEACHES, word by word:
 *   loop (0.40)         the bison thread runs down from the border tag's lower edge, a short way, and ends not in a knot
 *                       but in a small OPEN loop that sways; its tiny label sets in as the narrator says 'third parser'
 *   (1.4 .. 4.6)        the camera follows the thread down and pulls back: the lab's ledger, a tall cabinet of four
 *                       labelled drawers (Known issues · Open decisions · Still open · Parked and deferred)
 *   drawer (4.66)       on 'question' the Still open drawer slides out (detent click: a small overshoot and settle) and
 *                       STAYS OPEN; a blank card's top edge waits inside; first light finds it
 *   ledger (8.30)       on 'list' a narrow slip rises in the open drawer and is pinned: still open: · scaling program
 *                       learning past a complete loss table · evidence from real human tasks
 *   notDelivered (12.65) on 'compiler' the waiting card rises and letters the lab's own fragment (Q125):
 *                       “…not delivered by these experiments.” — lab/status.md
 *   hold (17.02)        the slow drift toward the open drawer goes on; nothing closes (ch12-s01 opens on it, still open)
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import {
  FONT,
  LAYERS,
  PUPPET_NEAR_BLACK,
  cardProbe,
  defineShot,
  dustMotes,
  godRays,
  hash1,
  legibleSize,
  mixLab,
  overscan,
  textProbe,
  textRole,
  toScreen,
  windowBeam,
  windowWall,
  withAlpha,
  wrapLines,
} from '../../../film';
import timeline from '../timeline.json';
import { TAG, drawLine, drawTag, tagsAt, type TagState } from '../sets/tagLine';
import { CAB, inkCol, ledgerCabinet, paperCol, type Rect } from '../sets/ch11-s05-ledger';

const ID = 'ch11-s05';
type C2 = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const SHOT = (timeline as { shots: { id: string; start: number; end: number }[] }).shots.find((s) => s.id === ID)!;
const D = SHOT.end - SHOT.start;

// ---------------------------------------------------------------- the camera (pure function of t)
type Key = [number, number, number];
function hk(keys: Key[], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0, m0] = keys[i], [t1, v1, m1] = keys[i + 1];
    if (t <= t1) {
      const h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * m1;
    }
  }
  return keys[keys.length - 1][1];
}
/**
 * Close on the border tag and its bison thread; at 1.4 s the camera follows the thread down and eases back to the
 * whole cabinet, landing as the drawer opens on 'question'; after 'stays open' it pushes in on the open drawer and keeps
 * drifting toward it to the end (beat hold). Action-plane zoom k = lens·1000/(1000 − z): a little dolly with the
 * push, so the window wall, the bench and the chair slide against the cabinet.
 */
const KX: Key[] = [[0, 498, 0], [0.6, 500, 6], [4.7, 722, 0], [6.1, 724, 2], [8.8, 758, 0.6], [D, 764, 0]];
const KY: Key[] = [[0, 246, 0], [0.6, 249, 8], [4.7, 462, 0], [6.1, 464, 2], [8.8, 478, 0.5], [D, 486, 0]];
const KK: Key[] = [[0, 1.7, 0], [0.6, 1.69, -0.02], [4.7, 1.34, 0], [6.1, 1.345, 0.01], [8.8, 1.52, 0.012], [D, 1.66, 0]];
const kAt = (t: number) => hk(KK, t);
function camAt(t: number): Camera3 {
  const k = kAt(t);
  const z = Math.max(0, Math.min(115, (k - 1.3) * 170));
  return { x: hk(KX, t), y: hk(KY, t), z, lens: (k * (1000 - z)) / 1000 };
}
const CAMS: Camera3[] = Array.from({ length: 40 }, (_, i) => camAt((i / 39) * D));
const R1 = overscan(LAYERS.L1, CAMS, 40);
const R2 = overscan(LAYERS.L2, CAMS, 40);
const R3 = overscan(LAYERS.L3, CAMS, 40);
const R4 = overscan(LAYERS.L4, CAMS, 40);
const R5 = overscan(LAYERS.L5, CAMS, 60);

// ---------------------------------------------------------------- the line and the border tag (L4 rest px)
const LINE_Y = 70;
const TS = 1.15;
const T11 = { x: 430, y: LINE_Y + TAG.string * TS };
const WHY = { x: 548, y: LINE_Y + TAG.string * TS };
const TAG_H = TAG.h * TS;
const SW11 = { amp: 0.016, phase: 0.6 };
/** the tag's swing angle (the same formula drawTag uses), on twos */
const swingAt = (tq: number, amp: number, phase: number) => amp * Math.sin(tq * 1.7 + phase);
/** a point on the swung tag (tag-local x, y from the eyelet) → world */
const onTag = (eye: Pt, sw: number, x: number, y: number): Pt => ({ x: eye.x + Math.cos(sw) * x - Math.sin(sw) * y, y: eye.y + Math.sin(sw) * x + Math.cos(sw) * y });

const threadCol = (env: PaintEnv, a = 0.85) => withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), a);

// ---------------------------------------------------------------- what the drawer holds (script onScreenText)
const SLIP_HEAD = 'still open:';
const SLIP_ITEMS = ['scaling program learning past a complete loss table', 'evidence from real human tasks'];
const CARD_LINES = ['“…not delivered by', 'these experiments.”'];
const CARD_BY = '— lab/status.md';
/** the slip rises at least this high: over the drawer above's label (the open drawer stands in front of it) */
const SLIP_TOP = 416;
const SLIP_W = 188;
const CARD_W = 150;

interface Beats {
  loop: number;
  third: number;
  drawer: number;
  list: number;
  nd: number;
  hold: number;
}

/** size held at the legibility floor for the camera scale kRef (grows on screen as the camera pushes in) */
function held(c: C2, font: string, base: number, text: string, k: number, kRef: number): number {
  return Math.max(base, legibleSize(c, font, 0, text) * (k / kRef));
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      loop: T.beat('loop'),
      third: T.word('L1110', 'third'),
      drawer: T.beat('drawer'),
      list: T.beat('ledger'),
      nd: T.beat('notDelivered'),
      hold: T.beat('hold'),
    };
    const kRef = { bison: kAt(b.third + 0.5), labels: Math.min(kAt(4.7), kAt(6.1)) * 0.995, slip: kAt(b.list), card: kAt(b.nd) };
    const tags = tagsAt(ID, 'start').filter((s) => s.id === '11' || s.id === 'why');
    return { tl, b, kRef, tags };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const kRef = sc.kRef as { bison: number; labels: number; slip: number; card: number };
    const tags = sc.tags as TagState[];
    const t = f.t;
    const tq = q2(t);
    const cam = camAt(t);
    f.camera(cam);
    const k4 = toScreen(LAYERS.L4, cam, 0, 0).k;
    // first light keeps growing through the shot
    const dawn = 0.55 + 0.45 * win(t, 0, D);
    const openU = drawerOpen(tq, b.drawer);
    const lit = win(t, b.drawer + 0.2, b.drawer + 2.2);
    // the first light reaches the cabinet's face as the camera arrives at it (label inserts out of shadow)
    const light = win(t, 2.2, 4.2);

    f.backlight({ sunX: 500, sunY: 455, intensity: 0.82 + 0.22 * dawn });
    // L1: the dawn ridge beyond the glass (ch12's hills, first seen here)
    f.layer('L1', (c, env) => {
      f.cached(`${ID}/L1/${env.mood.id}`, R1.w, R1.h, (cc) => {
        cc.translate(-R1.x, -R1.y);
        ridges(cc, env, R1);
      })(c, R1.x, R1.y);
    });
    // L2: the workshop's tall paned window wall
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, R2.w, R2.h, (cc) => {
        cc.translate(-R2.x, -R2.y);
        windowWall(cc, {
          x: R2.x, y: R2.y, w: R2.w, h: R2.h, centers: [-380, -40, 300, 640, 980, 1320, 1660].filter((x) => x > R2.x - 200 && x < R2.x + R2.w + 200),
          winW: 238, apex: 20, sill: 540, shape: 'flat', lights: 3, panes: { cols: 1, rows: 7 }, transoms: [], tracery: 'none', spandrel: 'none',
          pilasters: true, cornice: 0, wainscot: 0, glass: 0.55, seed: 23,
        }, env);
      })(c, R2.x, R2.y);
    });
    f.fog('A');
    // L3: the bench (left) and the pigeonhole rack (right), under two slanting beams of first light
    f.layer('L3', (c, env) => {
      godRays(c, {
        beams: [windowBeam({ x: 150, y: 30, w: 170, h: 420 }, { x: 0.5, y: 1 }, 820, 1.5), windowBeam({ x: 480, y: 30, w: 170, h: 420 }, { x: 0.5, y: 1 }, 820, 1.5)],
        intensity: 0.2 + 0.16 * dawn, mullions: 6, streaks: 3, salt: 115,
      }, env);
      f.cached(`${ID}/L3/${env.mood.id}`, R3.w, R3.h, (cc) => {
        cc.translate(-R3.x, -R3.y);
        benchAndRack(cc, env, R3);
      })(c, R3.x, R3.y);
      dustMotes(c, { area: { x: 200, y: 160, w: 900, h: 480 }, count: 40, size: 1.2, brightness: 0.45 * dawn, drift: { x: 2.2, y: -1.1 }, beam: windowBeam({ x: 480, y: 30, w: 170, h: 420 }, { x: 0.5, y: 1 }, 820, 1.5), salt: 1105 }, env);
    });
    f.fog('B');

    f.layer('L4', (c, env) => {
      // the floor the cabinet stands on, a faint pool of first light on it
      c.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.35);
      c.fillRect(R4.x, CAB.floor, R4.w, R4.y + R4.h - CAB.floor);
      const pool = c.createRadialGradient(820, CAB.floor + 30, 10, 820, CAB.floor + 30, 420);
      pool.addColorStop(0, withAlpha(env.mood.halo, 0.16 * dawn));
      pool.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = pool;
      c.fillRect(380, CAB.floor, 880, 120);
      c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.35);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(R4.x, CAB.floor + 0.5);
      c.lineTo(R4.x + R4.w, CAB.floor + 0.5);
      c.stroke();

      // the copper line, high, and the border tag (with the blank why tag to its right)
      drawLine(c, env, { x0: R4.x - 60, x1: R4.x + R4.w + 60, y: LINE_Y, sag: 0, posts: 'none', glow: 0.35 + 0.3 * dawn });
      const sw = swingAt(tq, SW11.amp, SW11.phase);
      // tag 11's two lifespan strands (JSON still held, TOML ended) fall away to the rule, below frame
      for (const [dx, a] of [[-9 * TS, 0.7], [9 * TS, 0.5]] as const) {
        const p = onTag(T11, sw, dx, TAG_H);
        c.strokeStyle = threadCol(env, a);
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.bezierCurveTo(p.x, p.y + 120, p.x + dx * 0.3, p.y + 300, p.x + dx * 0.4, R4.y + R4.h);
        c.stroke();
      }
      for (const st of tags) {
        const at = st.id === '11' ? T11 : WHY;
        const s: TagState = { ...st, x: at.x, scale: TS, swing: st.id === '11' ? SW11.amp : 0.02, phase: st.id === '11' ? SW11.phase : 2.1, drop: undefined };
        if (st.id === 'why') {
          // its slack thread (a question, no lifespan)
          const bot = { x: at.x, y: at.y + TAG_H };
          c.strokeStyle = threadCol(env);
          c.lineWidth = 1.1;
          c.beginPath();
          c.moveTo(bot.x, bot.y);
          c.bezierCurveTo(bot.x - 6, bot.y + 22, bot.x + 12, bot.y + 26, bot.x + 4, bot.y + 36);
          c.stroke();
        }
        if (st.id === '11') s.knot = ['the recovery experiment'];
        drawTag(c, env, s, { at, knotAt: { x: at.x, y: LINE_Y }, tq });
        if (st.id === '11') ruleCardAcross(c, env, sw);
      }
      // the bison thread: from the border tag's lower edge, a short way down, ending in an open loop
      bisonThread(c, env, t, tq, sw, b, k4, kRef.bison);

      // the lab's ledger
      const labelSize = held(c, `500 17px ${FONT.text}`, 15, 'Parked and deferred', k4, kRef.labels);
      ledgerCabinet(f, c, env, {
        key: ID,
        open: openU,
        labelSize,
        lit,
        light,
        inside: (cc, fr, slot) => {
          drawerLight(cc, env, fr, lit * dawn);
          ledgerSlip(cc, env, t, b, fr, k4, kRef.slip);
          labelCard(cc, env, t, b, fr, slot, openU, k4, kRef.card);
        },
      });
      drawerDust(c, env, t, b.drawer + 0.3);
    });
    f.rim({ x: 0, y: -1 });
    // L5: the narrator's chair back, passing close to the lens (lower left)
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, R5.w, R5.h, (cc) => {
        cc.translate(-R5.x, -R5.y);
        chairBack(cc, env);
      })(c, R5.x, R5.y);
    });
  },
});

// ---------------------------------------------------------------- the drawer's motion (on twos)
/** 0 shut → 1 out: a firm pull with a small overshoot, then the detent seats it (a short damped settle); it stays */
function drawerOpen(tq: number, at: number): number {
  const a = at - 0.08;
  const u = clamp01((tq - a) / 0.42);
  if (u <= 0) return 0;
  const s = 1.6;
  const v = 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); // easeOutBack
  const tc = a + 0.42;
  const settle = tq > tc ? 0.035 * Math.exp(-(tq - tc) * 9) * Math.cos((tq - tc) * 34) : 0;
  return v + settle;
}

/**
 * As ch11-s04 left it: the knot's second card (the rule for failure, fixed beforehand) swung down on its thread and
 * lies across the TOML half like a straightedge, the red strike running along its edge. Its type is texture here.
 */
function ruleCardAcross(c: C2, env: PaintEnv, sw: number) {
  const w = TAG.w * TS, h = TAG_H;
  const p0 = { x: w * 0.05, y: h * 0.85 }, p1 = { x: w * 0.46, y: h * 0.3 };
  const a = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  const L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  c.save();
  c.translate(T11.x, T11.y);
  c.rotate(sw);
  // its thread from the eyelet to the card's upper end
  const top = { x: p0.x + Math.cos(a) * L * 1.08 + 4 * Math.cos(a + Math.PI / 2), y: p0.y + Math.sin(a) * L * 1.08 + 4 * Math.sin(a + Math.PI / 2) };
  c.strokeStyle = threadCol(env, 0.8);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(0, 7 * TS);
  c.quadraticCurveTo(top.x - 2, 4 * TS, top.x, top.y);
  c.stroke();
  c.translate(p0.x, p0.y);
  c.rotate(a);
  const cw = L * 1.18, ch = 7.5 * TS;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(-L * 0.1 + 1, 1.2 + 1.5, cw, ch);
  c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.haze, env.layer.haze * 0.6);
  c.fillRect(-L * 0.1, 1.2, cw, ch);
  textRole(c, 'texture', () => {
    c.font = `600 ${(4.4 * TS).toFixed(2)}px ${FONT.sc}`;
    c.fillStyle = withAlpha(inkCol(env), 0.75);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillText('the rule for failure, fixed beforehand', -L * 0.1 + 2.5, 1.2 + ch / 2 + 0.3, cw - 5);
  });
  c.restore();
}

// ---------------------------------------------------------------- the bison thread
const BISON = { u: 0.62 };
function bisonThread(c: C2, env: PaintEnv, t: number, tq: number, sw: number, b: Beats, k: number, kRef: number) {
  const run = win(t, b.loop - 0.05, b.loop + 1.35);
  if (run <= 0) return;
  const p0 = onTag(T11, sw, 0, TAG_H);
  const sway = 3.2 * Math.sin(tq * 1.25 + 0.4);
  const e = { x: 482 + sway, y: 330 + 0.8 * Math.sin(tq * 2.5) };
  const c1 = { x: p0.x + 2, y: p0.y + 54 }, c2 = { x: e.x - 30 - sway * 0.3, y: e.y - 64 };
  const bez = (u: number): Pt => {
    const v = 1 - u;
    return {
      x: v * v * v * p0.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * e.x,
      y: v * v * v * p0.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * e.y,
    };
  };
  const ru = Math.min(1, run / 0.86);
  c.save();
  c.strokeStyle = threadCol(env, 0.92);
  c.lineWidth = 1.3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(p0.x, p0.y);
  for (let i = 1; i <= 28; i++) {
    const p = bez((i / 28) * ru);
    c.lineTo(p.x, p.y);
  }
  c.stroke();
  // the open loop: the thread turns round on itself and stops short (no knot): an aspiration not yet tested
  const lu = clamp01((run - 0.86) / 0.14);
  if (lu > 0) {
    const r = 9.5;
    const cx = e.x + 2, cy = e.y + r;
    const a0 = -Math.PI / 2 - 0.2;
    c.beginPath();
    c.moveTo(e.x, e.y);
    const sweep = lu * Math.PI * 1.62;
    for (let i = 0; i <= 18; i++) {
      const a = a0 - (sweep * i) / 18;
      c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    c.stroke();
    // the cut end, a hair of fibre
    if (lu >= 1) {
      const a = a0 - sweep;
      const q = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(q.x, q.y);
      c.lineTo(q.x + 2.2, q.y - 1.8);
      c.moveTo(q.x, q.y);
      c.lineTo(q.x + 2.6, q.y + 0.4);
      c.stroke();
    }
  }
  // its tiny label, tied on beside the loop: the thread's name
  const la = win(t, b.loop + 1.0, b.loop + 1.3);
  if (la > 0) {
    const tie = bez(BISON.u);
    const role = k >= kRef * 0.98 ? 'subject' : 'texture';
    const fs = held(c, `italic 400 14px ${FONT.text}`, 12, 'bison', k, kRef);
    c.font = `italic 400 ${fs}px ${FONT.text}`;
    const w = c.measureText('bison').width + 12, h = fs + 8;
    const sw2 = 0.05 * Math.sin(tq * 1.6 + 1.1);
    const x0 = tie.x + 12, y0 = tie.y + 4;
    // its string
    c.strokeStyle = threadCol(env, 0.8 * la);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(tie.x, tie.y);
    c.lineTo(x0 + 3, y0 + 3);
    c.stroke();
    c.save();
    c.translate(x0, y0);
    c.rotate(sw2);
    c.globalAlpha = la;
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
    c.fillRect(1.5, 2, w, h);
    c.fillStyle = paperCol(env, 0.4);
    c.fillRect(0, 0, w, h);
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.8);
    c.beginPath();
    c.arc(3.5, 3.5, 1.2, 0, Math.PI * 2);
    c.fill();
    textRole(c, role, () => {
      c.font = `italic 400 ${fs}px ${FONT.text}`;
      c.fillStyle = inkCol(env);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillText('bison', 7, h / 2 + fs * 0.32);
    });
    cardProbe(c, `${ID}-bison`, 0, 0, w, h, la, la);
    c.restore();
  }
  c.restore();
}

// ---------------------------------------------------------------- inside the open drawer
/** first light reaching into the open drawer (additive, behind the papers) */
function drawerLight(c: C2, env: PaintEnv, fr: Rect, a: number) {
  if (a <= 0.003) return;
  const cx = fr.x + fr.w * 0.5, cy = fr.y - 40;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(cx, cy, 10, cx, cy, 230);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.2 * a));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(cx - 240, cy - 200, 480, 330);
  c.restore();
}

/**
 * The ledger slip (beat ledger, on 'list'): lab/status.md's own list of what is still open, a narrow slip that rises in
 * the open drawer, is pinned, and inks its two items. Paper and its printed heading arrive together.
 */
function ledgerSlip(c: C2, env: PaintEnv, t: number, b: Beats, fr: Rect, k: number, kRef: number) {
  const rise = win(t, b.list - 0.3, b.list + 0.2);
  if (rise <= 0) return;
  const fh = held(c, `600 13px ${FONT.sc}`, 12, SLIP_HEAD, k, kRef);
  const fi = held(c, `italic 400 13px ${FONT.text}`, 12, SLIP_ITEMS[0], k, kRef);
  const lh = fi * 1.18;
  const fontI = `italic 400 ${fi}px ${FONT.text}`;
  const lines: { text: string; item: number; first: boolean }[] = [];
  SLIP_ITEMS.forEach((it, i) => wrapLines(c, it, fontI, SLIP_W - 30, 999).forEach((ln, j) => lines.push({ text: ln, item: i, first: j === 0 })));
  const visH = Math.max(12 + fh * 1.25 + lines.length * lh + 10, fr.y - SLIP_TOP);
  const x0 = fr.x + 14;
  const y0 = lerp(fr.y + 4, fr.y - visH, rise);
  const h = visH + 40;
  c.save();
  // paper (a little shadow onto the drawer's inside), its pin
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x0 + 2, y0 + 2.5, SLIP_W, h);
  c.fillStyle = paperCol(env, 0.55);
  c.fillRect(x0, y0, SLIP_W, h);
  // ledger rules (faint)
  c.strokeStyle = withAlpha('#7d6a52', 0.22);
  c.lineWidth = 0.5;
  c.beginPath();
  for (let i = 0; i < lines.length + 1; i++) {
    const y = y0 + 12 + fh * 1.25 + i * lh + 3.5;
    c.moveTo(x0 + 6, y);
    c.lineTo(x0 + SLIP_W - 6, y);
  }
  c.stroke();
  const pin = win(t, b.list + 0.15, b.list + 0.3);
  if (pin > 0) {
    const pr = 2.6 * (1 + 0.5 * Math.sin(Math.PI * pin) * (pin < 1 ? 1 : 0));
    c.fillStyle = mixLab('#b08d4a', env.mood.core, 0.25);
    c.beginPath();
    c.arc(x0 + SLIP_W / 2, y0 + 5.5, pr, 0, Math.PI * 2);
    c.fill();
  }
  const headInk = win(t, b.list - 0.2, b.list - 0.1);
  textRole(c, 'subject', () => {
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.font = `600 ${fh}px ${FONT.sc}`;
    c.fillStyle = inkCol(env, 0.9 * headInk);
    c.fillText(SLIP_HEAD, x0 + 10, y0 + 12 + fh * 0.9);
    // the items ink in as the narrator names the list (by characters, item after item)
    const total = lines.reduce((n, l) => n + l.text.length, 0);
    let budget = Math.floor(total * win(t, b.list, b.list + 1.0) + 1e-6);
    c.font = fontI;
    lines.forEach((ln, i) => {
      if (budget <= 0) return;
      const y = y0 + 12 + fh * 1.25 + (i + 0.82) * lh;
      c.fillStyle = inkCol(env, 0.95);
      if (ln.first) c.fillText('·', x0 + 10, y);
      c.fillText(ln.text.slice(0, budget), x0 + 20, y);
      budget -= ln.text.length;
    });
  });
  cardProbe(c, `${ID}-slip`, x0, y0, SLIP_W, Math.min(visH, fr.y - y0), rise, headInk);
  textProbe(c, `${ID}-slip-items`, x0 + 10, y0 + 12 + fh * 1.25, SLIP_W - 20, lines.length * lh, win(t, b.list, b.list + 0.15));
  c.restore();
}

/**
 * The label card: it waits in the drawer from the moment it opens (only its top edge shows, a blank tab), and on
 * 'compiler' (beat notDelivered) it rises and letters the lab's own fragment (Q125) with its attribution.
 */
function labelCard(c: C2, env: PaintEnv, t: number, b: Beats, fr: Rect, slot: Rect, open: number, k: number, kRef: number) {
  if (open <= 0.05) return;
  const fq = held(c, `italic 400 13.5px ${FONT.text}`, 12.5, CARD_LINES[1], k, kRef);
  const fb = held(c, `italic 400 12.5px ${FONT.text}`, 11.5, CARD_BY, k, kRef);
  const visH = 12 + fq * 1.22 * CARD_LINES.length + fb * 1.3 + 10;
  const x0 = fr.x + fr.w - 14 - CARD_W;
  const rise = win(t, b.nd - 0.3, b.nd + 0.3);
  // waiting: its top edge stands a few px proud of the drawer front (rises with the drawer)
  const wait = Math.min(1, open) * 7;
  const y0 = lerp(fr.y - wait, fr.y - visH, rise);
  const h = visH + 40;
  c.save();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x0 + 2, y0 + 2.5, CARD_W, h);
  c.fillStyle = paperCol(env, 0.6);
  c.fillRect(x0, y0, CARD_W, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0 + 1, y0 + 0.5);
  c.lineTo(x0 + CARD_W - 1, y0 + 0.5);
  c.stroke();
  const inkAt = b.nd - 0.04;
  const ink = clamp01((t - inkAt) / 0.12);
  if (ink > 0) {
    textRole(c, 'subject', () => {
      c.textBaseline = 'alphabetic';
      c.textAlign = 'left';
      // the card letters itself, character by character, as the narrator reaches 'compiler'
      const total = CARD_LINES.reduce((n, l) => n + l.length, 0) + CARD_BY.length;
      let budget = Math.max(1, Math.floor(total * win(t, inkAt, inkAt + 0.9) + 1e-6));
      c.font = `italic 400 ${fq}px ${FONT.text}`;
      c.fillStyle = inkCol(env, 0.95 * ink);
      const wMax = Math.max(...CARD_LINES.map((l) => c.measureText(l).width));
      const lx = x0 + (CARD_W - wMax) / 2;
      CARD_LINES.forEach((ln, i) => {
        if (budget <= 0) return;
        c.fillText(ln.slice(0, budget), lx, y0 + 12 + fq * (0.86 + i * 1.22));
        budget -= ln.length;
      });
      if (budget > 0) {
        c.font = `italic 400 ${fb}px ${FONT.text}`;
        c.fillStyle = inkCol(env, 0.78 * ink);
        c.textAlign = 'right';
        c.fillText(CARD_BY.slice(0, budget), x0 + CARD_W - 12, y0 + 12 + fq * 1.22 * CARD_LINES.length + fb * 1.05);
      }
    });
  }
  // probed only once it rises (until then it is a blank tab below the reading line, not a card)
  if (rise > 0) cardProbe(c, `${ID}-card`, x0, y0, CARD_W, Math.max(0, Math.min(visH, slot.y + slot.h - y0)), rise, ink);
  c.restore();
}

/** a breath of dust lifted out of the slot as the drawer comes out, drifting up through the light */
function drawerDust(c: C2, env: PaintEnv, t: number, t0: number) {
  const age = t - t0;
  if (age <= 0 || age > 4) return;
  const a = win(age, 0, 0.25) * (1 - win(age, 0.8, 3.8));
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.halo, 0.4), 0.5 * a);
  for (let i = 0; i < 16; i++) {
    const hx = (hash1(i, 1105) + 1) / 2, hy = (hash1(i, 1106) + 1) / 2, hz = (hash1(i, 1107) + 1) / 2;
    const x = 600 + hx * 340 + (hx - 0.5) * 14 * age + 3 * Math.sin(age * 1.3 + i);
    const y = 512 - (5 + 9 * hy) * age - hz * 10;
    c.beginPath();
    c.arc(x, y, 0.8 + hz * 0.9, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ---------------------------------------------------------------- static layers
/** L1: three paper ridges at dawn, paler with distance (seen only through the glass) */
function ridges(c: C2, env: PaintEnv, r: Rect) {
  const ridge = (y: number, amp: number, seed: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(r.x, r.y + r.h);
    for (let x = r.x; x <= r.x + r.w + 20; x += 16) c.lineTo(x, y + amp * Math.sin(x * 0.005 + seed) + amp * 0.45 * Math.sin(x * 0.013 + seed * 2.3));
    c.lineTo(r.x + r.w + 20, r.y + r.h);
    c.closePath();
    c.fill();
  };
  ridge(470, 20, 0.7, mixLab(env.mood.set, env.mood.haze, 0.82));
  ridge(505, 24, 2.1, mixLab(env.mood.set, env.mood.haze, 0.66));
  ridge(545, 18, 3.9, mixLab(env.mood.set, env.mood.haze, 0.5));
}

/** L3: the bench at left with parchment plates pinned above it; a tall pigeonhole rack at right */
function benchAndRack(c: C2, env: PaintEnv, r: Rect) {
  const ink = env.fill('set');
  // plates pinned above the bench (texture, no words)
  for (const [x, y, w, h] of [[40, 430, 110, 78], [190, 448, 92, 62], [330, 436, 100, 70]]) {
    c.fillStyle = mixLab(mixLab('#e2cfa4', env.mood.halo, 0.4), env.mood.haze, 0.4);
    c.fillRect(x, y, w, h);
    c.fillStyle = withAlpha(env.mood.ink, 0.2);
    for (let i = 0; i < 4; i++) c.fillRect(x + w * 0.12, y + h * (0.22 + i * 0.17), w * (0.7 - (i % 2) * 0.2), 1.6);
  }
  // the bench, edge-on, from the left edge to x 520
  c.fillStyle = ink;
  c.fillRect(r.x, 556, 520 - r.x, 14);
  c.fillStyle = mixLab(ink, env.mood.fg, 0.35);
  c.fillRect(r.x, 570, 510 - r.x, r.y + r.h - 570);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(r.x, 556);
  c.lineTo(520, 556);
  c.stroke();
  // a jar of pencils and a stack of papers on the bench
  c.fillStyle = ink;
  c.fillRect(120, 520, 22, 36);
  for (let i = 0; i < 5; i++) c.fillRect(122 + i * 4, 492 + (i % 2) * 6, 1.8, 30);
  c.fillRect(380, 540, 86, 16);
  c.fillRect(386, 532, 74, 8);
  // the pigeonhole rack: a tall dark case with square cells, a few papers rolled in them
  const rx = 1080, ry = 250, rw = Math.max(300, r.x + r.w - rx), rh = r.y + r.h - ry;
  c.fillStyle = ink;
  c.fillRect(rx, ry, rw, rh);
  c.fillRect(rx - 8, ry - 10, rw + 16, 12);
  c.fillStyle = mixLab(ink, env.mood.haze, 0.18);
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 6; col++) {
      const cx = rx + 12 + col * 52, cy = ry + 14 + row * 56;
      c.fillRect(cx, cy, 42, 44);
      if (hash1(row * 7 + col, 77) > 0.2) {
        c.fillStyle = mixLab(mixLab('#e2cfa4', env.mood.halo, 0.4), env.mood.haze, 0.55);
        c.beginPath();
        c.ellipse(cx + 21, cy + 36, 15, 6, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = mixLab(ink, env.mood.haze, 0.18);
      }
    }
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.45);
  c.beginPath();
  c.moveTo(rx - 8, ry - 10);
  c.lineTo(rx + rw + 8, ry - 10);
  c.stroke();
}

/** L5: a ladder-back chair's top, close to the lens at lower left (blurred by the layer) */
function chairBack(c: C2, env: PaintEnv) {
  c.fillStyle = env.fill('fg');
  c.beginPath();
  // two stiles with turned finials
  for (const x of [250, 560]) {
    c.ellipse(x, 600, 11, 15, 0, 0, Math.PI * 2);
    c.rect(x - 9, 612, 18, 420);
  }
  c.fill();
  // three curved slats between them
  for (const [y, h] of [[640, 26], [700, 22], [756, 20]]) {
    c.beginPath();
    c.moveTo(250, y);
    c.quadraticCurveTo(405, y - 22, 560, y);
    c.lineTo(560, y + h);
    c.quadraticCurveTo(405, y + h - 22, 250, y + h);
    c.closePath();
    c.fill();
  }
}
