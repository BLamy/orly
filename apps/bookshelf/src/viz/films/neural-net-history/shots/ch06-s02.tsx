/**
 * ch06-s02 — a bank's back room, late 1990s: the cheque sorter runs warm while snow lies on a dark lecture hall
 * across the street (duskRose, crossfade in, 11.88 s). Used, not admired.
 *
 *   in            the back room at night under one pendant lamp: a long cheque sorter, belts and rollers in
 *                 silhouette, cheques flicking through one after another like playing cards. Above the read
 *                 station the same tiny pierced stencil-lantern as shot 1 flashes over the handwritten amount on
 *                 every cheque as it passes, and the amount appears in clean type on a small display.
 *   'descendant'  the date stamp 1998 (IBM Plex Mono)
 *   'reads'       the quote card rises over the machine: LeCun et al., 1998 (verbatim)
 *   'winter'      the camera drifts right, pulling back: through the tall window, across the street, a grand
 *                 lecture hall with tall dark windows under falling snow, its lamps out, a noticeboard frosted
 *                 over. The small label sets in low (fielded 1996 · ~1 US cheque in 10, per LeCun) and rides
 *                 the drift back inside; it holds through the music-only hold.
 *   'not'         back inside: the machine still running, warm.
 *
 * The binding: one stencil flash = one cheque read; the display's clean type is the reading of the hand above it.
 * The amounts are illustrative (no claim): the machine's own read-out, not a fact on screen.
 */
import { Timeline } from '../../../core';
import { hcl } from 'd3';
import { MOODS, FONT, capPx1080, defineShot, legibleSize, mixLab, quoteCard, snow, withAlpha, clock } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { clamp01, win, camPath, easeIO, h01, bake, screenPass, monoLabel, paperTone, scribble, sm } from '../sets/ch06-s01-kit';
import { stencilHood } from '../sets/ch06-s02-sorter';

type C = CanvasRenderingContext2D;
const ID = 'ch06-s02';

// ------------------------------------------------------------------------------------------- staging (L4 world)
const FLOOR = 650;
const TRACK = 468; // the cheques' bottom edge on the transport
const M = { x0: 40, x1: 1010 };
const HOPPER = { x0: 60, x1: 210 };
const READ_X = 458;
const POCKETS = { x0: 660, n: 8, w: 42 };
const CHQ = { w: 160, h: 54 }; // a bank cheque: a long ~3:1 slip
const RATE = 2.8; // cheques per second through the read station (round 2: ~15% more air between them)
const TRAVEL = { from: HOPPER.x1 - 10, to: POCKETS.x0 + 20 };
const SPEED = 300; // px/s along the transport
const LAMP = { x: 545, y: 150 };
const DISPLAY = { x: READ_X - 168, y: 352, w: 176, h: 48 };
const LIGHT = { x: 0.05, y: -1 };
/** the window on the back wall (L2 world) */
const WIN = { x: 760, y: 40, w: 700, h: 456 };
/** the clock hangs inside the lamp's cone, a silhouette against the light */
const CLOCK = { x: 715, y: 268 };

/** each cheque's handwritten amount (cheque i carries AMOUNTS[i mod n]); the display types the same number */
const AMOUNTS = ['48.00', '125.00', '72.19', '310.00', '15.60', '905.43', '64.00', '240.00', '120.75', '38.10', '7.99', '560.00'];
const amountOf = (i: number) => AMOUNTS[((i % AMOUNTS.length) + AMOUNTS.length) % AMOUNTS.length];
/** the boxed amount field: its centre's offset from the cheque centre (right end), and size (world px) */
const BOX = { dx: 48, dy: -27, w: 58, h: 24 };
/** the display updates this long after the lantern's flash (the read travels to it as a light trace) */
const LAG = 0.05;
const HAND = (px: number) => `italic 400 ${px}px ${FONT.fell}`;

// ------------------------------------------------------------------------------------------- cameras
const CM0: Camera3 = { x: 470, y: 392, z: 300, lens: 1 };
const CM1: Camera3 = { x: 520, y: 390, z: 262, lens: 1 };
/** the window look: a ~300-unit truck (not a whip), pulled back a touch so the warm machine stays in the left of
 * frame while the cold street fills the right: the two halves of the line in one picture */
const CW: Camera3 = { x: 940, y: 352, z: 290, lens: 1 };
const CM2: Camera3 = { x: 560, y: 394, z: 286, lens: 1 };
const CM3: Camera3 = { x: 584, y: 396, z: 304, lens: 1 };
const CAMS = [CM0, CM1, CW, CM2, CM3];

/** the street outside: duskRose cooled and desaturated (C* ≤ 10): the lamp stays the shot's one accent */
function coolTok(hex: string): string {
  const h = hcl(hex);
  return hcl(285, Math.min(9, h.c * 0.6), h.l).formatHex();
}
const DR = MOODS.duskRose;
const OUT = {
  sky: DR.sky.map(coolTok),
  set: coolTok(DR.set),
  setHaze: coolTok(DR.setHaze),
  haze: coolTok(DR.haze),
  fg: coolTok(DR.fg),
  rim: coolTok(DR.rim),
  core: coolTok(DR.core),
};

/** the quote card's end (its 0.5 s fade runs 5.7 → 6.2) */
const T6 = (b: B) => b.win + 0.2;
interface B {
  D: number;
  sorter: number;
  quote: number;
  win: number;
  tally: number;
  use: number;
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = { D, sorter: T.beat('sorter'), quote: T.beat('quote'), win: T.beat('window'), tally: T.beat('tally'), use: T.beat('use') };
    tl.hold(0, D);
    // the drift: slow creep on the machine → out to the window on 'winter' → back inside on 'not'
    // drift to the window on 'winter', a short look, and back inside so 'use' (8.65) lands on the running machine
    // drift out from just before 'A' (5.6), at rest on the window by ~6.9, hold 1.2 s, ease back to land ~9.8
    // (the machine never leaves the left of frame, so it is in view and running on 'not' and 'use')
    // round 2: the truck starts on 'A' (5.6), the window and the street fill more than half the frame by 6.9 and hold
    // through 'prestige' to ~7.9; the return starts on 'not' (8.22) and lands on the running machine by ~9.8
    const out0 = T.word('L0604', 'A') - 0.15;
    const notW = T.word('L0604', 'not');
    const cam = camPath([
      [0, CM0],
      [out0, CM1],
      [T.word('L0604', 'prestige') - 0.15, CW, easeIO],
      [notW - 0.1, CW],
      [notW + 1.6, CM2, easeIO],
      [D, CM3, easeIO],
    ]);
    return { tl, b, cam };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const cam = (scene.cam as (t: number) => Camera3)(t);
    f.camera(cam);
    f.backlight({ sunX: 1100, sunY: 300, sunRadius: 500, intensity: 0.2 });

    // ---------------- outside (L1, seen only through the window hole): snow on the dark lecture hall, cold
    f.layer('L1', (c, env) => {
      const r = { x: 560, y: -160, w: 1300, h: 920 };
      bake(f, c, `${ID}/L1/hall4`, r, (cc) => streetView(cc, r));
      // FAR snow band (small, slow), behind the street fog
      c.save();
      c.beginPath();
      c.rect(r.x, r.y, r.w, r.h);
      c.clip();
      snow(c, { area: { x: r.x, y: r.y, w: r.w, h: r.h }, count: 300, fall: 40, wind: 8, size: 1.2, color: mixLab(OUT.core, OUT.rim, 0.5), salt: 61 }, env);
      // the street fog sheet between the two snow bands (low, at the hall's steps)
      const fg = c.createLinearGradient(0, 430, 0, 640);
      fg.addColorStop(0, withAlpha(OUT.haze, 0));
      fg.addColorStop(0.55, withAlpha(mixLab(OUT.haze, OUT.sky[2], 0.4), 0.55));
      fg.addColorStop(1, withAlpha(OUT.haze, 0.2));
      c.fillStyle = fg;
      c.fillRect(r.x, 430, r.w, 210);
      c.restore();
    });
    // ---------------- the back room (L2): panelled wall, the tall window HOLE, a wall clock
    f.layer('L2', (c, env) => {
      const r = { x: -420, y: -300, w: 2200, h: 1200 };
      bake(f, c, `${ID}/L2w/${env.mood.id}`, r, (cc) => backWall(cc, env, r));
      clock(c, { x: CLOCK.x, y: CLOCK.y, s: 1.2, time: 23.2, kind: 'wall' }, env);
    });
    // nearer snow, outside the glass (frost-side), only inside the window
    f.layer('L2', (c, env) => {
      c.save();
      c.beginPath();
      c.rect(WIN.x + 8, WIN.y + 8, WIN.w - 16, WIN.h - 16);
      c.clip();
      // NEAR snow band (bigger, faster), in front of the street fog
      snow(c, { area: { x: WIN.x, y: WIN.y - 40, w: WIN.w, h: WIN.h + 40 }, count: 46, fall: 80, wind: 14, size: 2.2, color: mixLab(OUT.core, OUT.rim, 0.25), salt: 62 }, env);
      c.restore();
    });
    f.fog({ yCenter: 480, height: 300, alpha: 0.2, drift: 5 });
    // ---------------- mid (L3): filing cabinets, a desk with a ledger, boxes of cheques
    f.layer('L3', (c, env) => {
      const r = { x: -400, y: 100, w: 2200, h: 700 };
      bake(f, c, `${ID}/L3/${env.mood.id}`, r, (cc) => midRoom(cc, env));
    });
    f.fog('B');
    // ---------------- the sorter (L4)
    f.layer('L4', (c, env) => {
      const r = { x: M.x0 - 20, y: 180, w: M.x1 - M.x0 + 60, h: FLOOR - 180 + 20 };
      bake(f, c, `${ID}/L4/sorter2/${env.mood.id}`, r, (cc) => sorterBody(cc, env));
      cheques(c, env, env.tq);
      // the read station hood over the track, the stencil-lantern on its arm, the display above
      readStation(c, env, env.tq);
      pendant(c, env);
    });
    f.rim({ x: 0, y: -1 }); // tops only: the machine's silhouette reads against the floor by its lit top edge
    f.practical({ x: LAMP.x, y: LAMP.y + 40, kind: 'lamp', seed: 98, intensity: 0.9, radius: 60 });
    const fl = flashAt(f.tq);
    if (fl.k > 0.02) f.practical({ x: GLINT_X, y: TRACK - CHQ.h + 12, kind: 'candle', seed: 99, intensity: 0.55 * fl.k, radius: 18 });
    f.practical({ x: DISPLAY.x, y: DISPLAY.y, kind: 'screen', seed: 97, intensity: 0.35, radius: 30 });
    // ---------------- near (L5): the end of a counter at frame bottom-left, a stool, blurred
    f.layer('L5', (c, env) => {
      const r = { x: -500, y: 560, w: 2400, h: 500 };
      bake(f, c, `${ID}/L5/${env.mood.id}`, r, (cc) => {
        cc.fillStyle = env.fill('fg');
        cc.fillRect(-500, 720, 760, 340);
        cc.fillRect(-500, 700, 780, 22);
        cc.fillRect(1500, 700, 30, 360);
        cc.fillRect(1430, 690, 170, 18);
      });
    });
    // L5: a wire sorting bin of cheques at the frame's left edge (blurred, the darkest value): the left occluder
    f.layer('L5', (c, env) => {
      const r = { x: -260, y: 400, w: 520, h: 640 };
      bake(f, c, `${ID}/L5bin/${env.mood.id}`, r, (cc) => sortingBin(cc, env));
    });
    // L5: the edge of a pilaster between the machine and the window: it slides across the frame on the drift
    // (true parallax against the wall and the street beyond)
    f.layer('L5', (c, env) => {
      const r = { x: 910, y: -500, w: 160, h: 1400 };
      bake(f, c, `${ID}/L5pillar2/${env.mood.id}`, r, (cc) => {
        cc.fillStyle = env.fill('fg');
        cc.fillRect(940, -500, 64, 1400);
        cc.fillRect(928, -500, 88, 60);
        cc.fillStyle = withAlpha(env.mood.halo, 0.12);
        cc.fillRect(940, -440, 2, 1340); // the lamp's faint graze on its near edge
      });
    });

    // ---------------- the rack to 'outside': while the camera rests on the window the cold street light gains on the
    // right of frame and the warm room settles a little (light, not distance, sells the outside)
    const look = clamp01(1 - Math.abs(cam.x - CW.x) / (CW.x - CM1.x));
    if (look > 0.01)
      screenPass(f, (c) => {
        const g = c.createLinearGradient(560, 0, 1280, 0);
        g.addColorStop(0, withAlpha(OUT.sky[2], 0));
        g.addColorStop(1, withAlpha(OUT.sky[2], 0.16 * look));
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = g;
        c.fillRect(560, 0, 720, 720);
        c.globalCompositeOperation = 'source-over';
        const v = c.createLinearGradient(0, 0, 640, 0);
        v.addColorStop(0, withAlpha(f.mood.fg, 0.18 * look));
        v.addColorStop(1, withAlpha(f.mood.fg, 0));
        c.fillStyle = v;
        c.fillRect(0, 0, 640, 720);
      });

    // ---------------- type
    screenPass(f, (c) => {
      const env = { t, mood: f.mood, seed: 98 };
      // the date stamp (Plex Mono, the era face from 1990)
      const da = win(t, b.sorter, b.sorter + 0.5) * (1 - win(t, b.win - 0.4, b.win + 0.1));
      monoLabel(c, '1998', 1232, 84, { align: 'right', mood: f.mood, a: da, size: legibleSize(c, `500 22px ${FONT.mono}`, 22), tracking: 0.12 });
      // the card sits top-left over the dark wall, clear of the pendant (which hangs to its right)
      quoteCard(c, {
        quote: 'It is deployed commercially and reads several million checks per day.',
        speaker: 'LeCun et al., 1998',
        x: 330,
        y: 112,
        width: 500,
        size: 28,
        at: b.quote,
        // it leaves across 5.7–6.2, while the drift is still gathering (not during its fastest part)
        dur: T6(b) - b.quote,
        fade: 0.5,
        stagger: 0.3,
      }, env);
      // the tally sits low, below the roller rail, on a dark paper strip with soft ends (clear of belt and cheques)
      const la = win(t, b.tally - 0.04, b.tally + 0.3) * (1 - win(t, b.D - 0.4, b.D - 0.08));
      if (la > 0.003) {
        const sz = legibleSize(c, `500 21px ${FONT.mono}`, 21);
        const yL = 622;
        c.save();
        c.globalAlpha = la;
        const sw = 700, sh = sz + 26;
        const sg = c.createLinearGradient(640 - sw / 2, 0, 640 + sw / 2, 0);
        sg.addColorStop(0, withAlpha(f.mood.fg, 0));
        sg.addColorStop(0.12, withAlpha(f.mood.fg, 0.6));
        sg.addColorStop(0.88, withAlpha(f.mood.fg, 0.6));
        sg.addColorStop(1, withAlpha(f.mood.fg, 0));
        c.fillStyle = sg;
        c.fillRect(640 - sw / 2, yL - sz * 0.35 - sh / 2, sw, sh);
        c.fillStyle = withAlpha(f.mood.rim, 0.18);
        c.fillRect(640 - sw * 0.4, yL - sz * 0.35 - sh / 2, sw * 0.8, 1);
        c.restore();
        monoLabel(c, 'fielded 1996 · ~1 US cheque in 10, per LeCun', 640, yL, { mood: f.mood, a: la, size: sz, tracking: 0.02, align: 'center', plate: 0 });
      }
    });
    void sm;
  },
});

// =========================================================================================== the outside
function streetView(c: C, r: { x: number; y: number; w: number; h: number }) {
  const P = OUT;
  // a night sky over the street, cool and quiet, brightest low behind the hall (the town's glow)
  const g = c.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, mixLab(P.sky[0], P.fg, 0.3));
  g.addColorStop(0.4, P.sky[1]);
  g.addColorStop(0.7, P.sky[2]);
  g.addColorStop(1, P.sky[1]);
  c.fillStyle = g;
  c.fillRect(r.x, r.y, r.w, r.h);
  // the grand lecture hall across the street: portico, pediment, a long rank of tall dark windows, steps
  const hall = mixLab(P.set, P.sky[1], 0.12);
  // round 2: the hall's tall windows are near-ink (lamps out: not admired)
  const dark = mixLab(P.fg, P.set, 0.1);
  const snowC = mixLab(P.rim, P.core, 0.4);
  const x0 = 700, x1 = 1640, base = 548, eave = 214;
  const cx = (x0 + x1) / 2;
  // the body with the windows as HOLES (dark glass inside: lamps out)
  c.fillStyle = dark;
  c.fillRect(x0, eave, x1 - x0, base - eave);
  const body = new Path2D();
  body.rect(x0, eave, x1 - x0, base - eave);
  const n = 9;
  const pitch = (x1 - x0 - 80) / (n - 1);
  for (let i = 0; i < n; i++) {
    const wx = x0 + 40 + i * pitch;
    const ww = 26, top = eave + 70, bot = base - 70;
    body.moveTo(wx - ww, bot);
    body.lineTo(wx - ww, top);
    body.arc(wx, top, ww, Math.PI, 0);
    body.lineTo(wx + ww, bot);
    body.closePath();
  }
  c.fillStyle = hall;
  c.fill(body, 'evenodd');
  // glazing bars, barely visible in the dark glass; snow on every sill
  for (let i = 0; i < n; i++) {
    const wx = x0 + 40 + i * pitch;
    c.fillStyle = withAlpha(hall, 0.7);
    c.fillRect(wx - 1.2, eave + 50, 2.4, base - eave - 120);
    c.fillRect(wx - 26, eave + 160, 52, 2.4);
    c.fillRect(wx - 26, eave + 230, 52, 2.4);
    c.fillStyle = snowC;
    c.fillRect(wx - 32, base - 72, 64, 4);
  }
  // pediment + entablature
  c.fillStyle = hall;
  c.beginPath();
  c.moveTo(cx - 260, eave);
  c.lineTo(cx, eave - 120);
  c.lineTo(cx + 260, eave);
  c.closePath();
  c.fill();
  c.fillRect(x0 - 20, eave - 14, x1 - x0 + 40, 18);
  // a tympanum roundel (a dark oculus)
  c.fillStyle = dark;
  c.beginPath();
  c.arc(cx, eave - 44, 20, 0, Math.PI * 2);
  c.fill();
  // the portico: six columns standing proud of the centre bays
  c.fillStyle = mixLab(hall, P.sky[2], 0.15);
  for (let k = 0; k < 6; k++) c.fillRect(cx - 250 + k * 100 - 9, eave + 4, 18, base - eave - 4);
  // snow on the cornice and along the pediment's rakes
  c.strokeStyle = snowC;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(cx - 268, eave - 16);
  c.lineTo(cx, eave - 128);
  c.lineTo(cx + 268, eave - 16);
  c.stroke();
  c.fillStyle = snowC;
  c.fillRect(x0 - 22, eave - 17, x1 - x0 + 44, 4);
  // two lamp brackets either side of the door, unlit
  c.fillStyle = dark;
  for (const lx of [cx - 300, cx + 300]) {
    c.fillRect(lx - 1.5, 400, 3, 26);
    c.beginPath();
    c.moveTo(lx - 9, 400);
    c.lineTo(lx + 9, 400);
    c.lineTo(lx + 6, 382);
    c.lineTo(lx - 6, 382);
    c.closePath();
    c.fill();
    c.fillStyle = snowC;
    c.fillRect(lx - 8, 379, 16, 3);
    c.fillStyle = dark;
  }
  // steps and the street, snow-covered
  c.fillStyle = hall;
  for (let k = 0; k < 4; k++) c.fillRect(cx - 280 - k * 14, base + k * 10, 560 + k * 28, 10);
  c.fillStyle = mixLab(snowC, P.sky[2], 0.45);
  c.fillRect(r.x, base + 40, r.w, r.y + r.h - base - 40);
  // the frosted noticeboard on its posts by the steps (left of them, in the window's view): a pale rime cap
  const nb = { x: 800, y: 418, w: 96, h: 64 };
  c.fillStyle = dark;
  c.fillRect(nb.x + 6, nb.y + nb.h, 5, 110);
  c.fillRect(nb.x + nb.w - 11, nb.y + nb.h, 5, 110);
  c.fillRect(nb.x - 6, nb.y - 6, nb.w + 12, nb.h + 12);
  c.fillStyle = mixLab(P.sky[2], snowC, 0.38);
  c.fillRect(nb.x, nb.y, nb.w, nb.h);
  // frost feathering in from the frame's corners, and a pinned notice gone grey beneath it
  c.fillStyle = withAlpha(mixLab(P.sky[1], P.set, 0.4), 0.55);
  c.fillRect(nb.x + 18, nb.y + 14, 34, 40);
  c.fillRect(nb.x + 58, nb.y + 18, 24, 22);
  for (let i = 0; i < 34; i++) {
    c.fillStyle = withAlpha(snowC, 0.35 + 0.45 * h01(i, 81));
    c.beginPath();
    const ex = h01(i, 82) < 0.5 ? 0 : 1;
    c.arc(nb.x + (ex ? nb.w - h01(i, 85) * 26 : h01(i, 85) * 26), nb.y + h01(i, 83) * nb.h, 2 + 5 * h01(i, 84), 0, Math.PI * 2);
    c.fill();
  }
  // the rime: a thick pale cap of snow along the top, lumpy, with icicle drips
  c.fillStyle = mixLab(snowC, '#ffffff', 0.25);
  c.beginPath();
  c.moveTo(nb.x - 9, nb.y - 5);
  for (let k = 0; k <= 12; k++) c.lineTo(nb.x - 9 + (k / 12) * (nb.w + 18), nb.y - 11 - 5 * h01(k, 86));
  c.lineTo(nb.x + nb.w + 9, nb.y - 3);
  c.closePath();
  c.fill();
  for (let k = 0; k < 6; k++) c.fillRect(nb.x + 8 + k * 15, nb.y - 4, 2, 4 + 7 * h01(k, 87));
  // two dead lamp-posts in front of the colonnade: cast-iron standards with UNLIT glass globes, snow-capped
  for (const lx of [910, 1262]) {
    c.fillStyle = dark;
    c.fillRect(lx - 3, 330, 6, base + 36 - 330);
    c.fillRect(lx - 9, base + 20, 18, 16);
    c.fillRect(lx - 7, 330, 14, 6);
    // the globe: dark cold glass (a slightly lighter disc than the ink, no glow), a highlight of reflected snow
    c.fillStyle = mixLab(P.set, P.sky[1], 0.25);
    c.beginPath();
    c.arc(lx, 312, 17, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = dark;
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = withAlpha(snowC, 0.4);
    c.beginPath();
    c.arc(lx - 6, 306, 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = snowC;
    c.beginPath();
    c.ellipse(lx, 296, 11, 4, 0, Math.PI, 0);
    c.fill();
  }
  // street lamps along the kerb, out
  c.fillStyle = dark;
  for (const lx of [640, 1700]) {
    c.fillRect(lx, 300, 6, 290);
    c.beginPath();
    c.moveTo(lx - 14, 306);
    c.lineTo(lx + 20, 306);
    c.lineTo(lx + 12, 282);
    c.lineTo(lx - 6, 282);
    c.closePath();
    c.fill();
    c.fillStyle = snowC;
    c.fillRect(lx - 8, 278, 26, 4);
    c.fillStyle = dark;
  }
  // bare trees along the street (cold, still)
  c.strokeStyle = dark;
  c.lineCap = 'round';
  for (const [tx, th] of [[600, 330], [1760, 300]] as const) {
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(tx, base + 40);
    c.lineTo(tx + 4, base + 40 - th);
    c.stroke();
    c.lineWidth = 2.5;
    for (let k = 0; k < 9; k++) {
      const yy = base + 40 - th * (0.35 + 0.07 * k);
      const dir = k % 2 ? 1 : -1;
      c.beginPath();
      c.moveTo(tx + 3, yy);
      c.quadraticCurveTo(tx + dir * 30, yy - 30, tx + dir * (50 + 20 * h01(k, 7)), yy - 60 - 20 * h01(k, 8));
      c.stroke();
    }
  }
}

// =========================================================================================== the room
function backWall(c: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const m = env.mood;
  const wall = env.fill('set');
  // the wall with the tall window as a HOLE (evenodd), the sash frame left in the hole
  const p = new Path2D();
  p.rect(r.x, r.y, r.w, r.h);
  p.rect(WIN.x, WIN.y, WIN.w, WIN.h);
  c.fillStyle = wall;
  c.fill(p, 'evenodd');
  // the wall stays at the set value: only a small, local spill from the pendant (the cone does the lighting)
  const g = c.createRadialGradient(LAMP.x, 300, 20, LAMP.x, 300, 300);
  g.addColorStop(0, withAlpha(mixLab(m.set, m.halo, 0.25), 0.55));
  g.addColorStop(1, withAlpha(m.set, 0));
  c.save();
  c.fillStyle = g;
  const holes = new Path2D();
  holes.rect(r.x, r.y, r.w, r.h);
  holes.rect(WIN.x, WIN.y, WIN.w, WIN.h);
  c.clip(holes, 'evenodd');
  c.fillRect(r.x, r.y, r.w, r.h);
  c.restore();
  // the upper wall sinks into the dark (≈ 20% down), so the pendant's pool and the cold window are the two lights
  {
    const dg = c.createLinearGradient(0, -300, 0, 330);
    dg.addColorStop(0, withAlpha(m.fg, 0.42));
    dg.addColorStop(0.6, withAlpha(m.fg, 0.22));
    dg.addColorStop(1, withAlpha(m.fg, 0));
    c.save();
    const holes2 = new Path2D();
    holes2.rect(r.x, r.y, r.w, r.h);
    holes2.rect(WIN.x, WIN.y, WIN.w, WIN.h);
    c.clip(holes2, 'evenodd');
    c.fillStyle = dg;
    c.fillRect(r.x, -300, r.w, 630);
    c.restore();
  }
  // wainscot panels below the dado rail
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(r.x, 470, r.w, 3);
  c.strokeStyle = withAlpha(m.rim, 0.12);
  c.lineWidth = 1.2;
  for (let x = -400; x < 1800; x += 150) c.strokeRect(x + 12, 488, 126, 130);
  // the window: sash frame, glazing bars (a 3 × 4 grid), sill
  c.fillStyle = mixLab(wall, m.fg, 0.3);
  const fr = 12;
  c.fillRect(WIN.x - fr, WIN.y - fr, WIN.w + 2 * fr, fr);
  c.fillRect(WIN.x - fr, WIN.y + WIN.h, WIN.w + 2 * fr, fr + 6);
  c.fillRect(WIN.x - fr, WIN.y, fr, WIN.h);
  c.fillRect(WIN.x + WIN.w, WIN.y, fr, WIN.h);
  for (let k = 1; k < 3; k++) c.fillRect(WIN.x + (WIN.w * k) / 3 - 3, WIN.y, 6, WIN.h);
  for (let k = 1; k < 4; k++) c.fillRect(WIN.x, WIN.y + (WIN.h * k) / 4 - 3, WIN.w, 6);
  c.fillRect(WIN.x, WIN.y + WIN.h / 2 - 6, WIN.w, 12); // the meeting rail
  // frost in the lower corners of the panes (a cut-paper rime)
  c.fillStyle = withAlpha(mixLab(OUT.rim, OUT.core, 0.4), 0.3);
  for (let i = 0; i < 3; i++) {
    const px = WIN.x + (WIN.w * i) / 3;
    c.beginPath();
    c.moveTo(px + 3, WIN.y + WIN.h);
    for (let k = 0; k <= 10; k++) c.lineTo(px + 3 + (k / 10) * (WIN.w / 3 - 6), WIN.y + WIN.h - 6 - 22 * Math.abs(Math.sin(k * 1.7 + i)) * (1 - Math.abs(k - 5) / 6));
    c.lineTo(px + WIN.w / 3 - 3, WIN.y + WIN.h);
    c.closePath();
    c.fill();
  }
  // the window's rim catching the outside light
  c.fillStyle = withAlpha(OUT.rim, 0.35);
  c.fillRect(WIN.x - fr, WIN.y + WIN.h + fr + 5, WIN.w + 2 * fr, 1.5);
}

function midRoom(c: C, env: PaintEnv) {
  const ink = env.fill('ink');
  // filing cabinets at left, boxes of cheques stacked on them
  c.fillStyle = ink;
  for (let i = 0; i < 3; i++) {
    const x = -300 + i * 96;
    c.fillRect(x, 470, 88, 150);
  }
  for (let i = 0; i < 5; i++) c.fillRect(-296 + i * 52, 440 - (i % 2) * 14, 46, 30 + (i % 2) * 14);
  c.fillStyle = withAlpha(env.mood.rim, 0.2);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) c.fillRect(-270 + i * 96, 490 + k * 34, 34, 3);
  // the room's floor
  c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.45);
  c.fillRect(-400, 620, 2200, 300);
  // a desk under the window with a ledger and a desk lamp, off
  c.fillStyle = ink;
  c.fillRect(1240, 520, 300, 14);
  c.fillRect(1250, 534, 12, 90);
  c.fillRect(1520, 534, 12, 90);
  c.fillRect(1300, 506, 90, 14);
}

function sorterBody(c: C, env: PaintEnv) {
  const ink = env.fill('ink');
  const m = env.mood;
  c.fillStyle = ink;
  // the long cabinet (rounded ends), a kick plate, panel doors as cut-lines
  const top = TRACK + 6;
  c.beginPath();
  c.roundRect(M.x0, top, M.x1 - M.x0, FLOOR - top - 14, 8);
  c.fill();
  c.fillRect(M.x0 + 12, FLOOR - 16, M.x1 - M.x0 - 24, 16);
  // the transport rail, the belt rollers under it (pierced: light between them)
  c.fillRect(M.x0, TRACK, M.x1 - M.x0, 6);
  // the feed hopper (left): a sloped tray with a stack of cheques leaning in it
  c.beginPath();
  c.moveTo(HOPPER.x0, TRACK);
  c.lineTo(HOPPER.x0 + 8, TRACK - 70);
  c.lineTo(HOPPER.x0 + 18, TRACK - 70);
  c.lineTo(HOPPER.x0 + 14, TRACK);
  c.closePath();
  c.fill();
  // the roller band under the transport: the belt's rollers against the lit inside of the machine (pierced)
  c.fillStyle = withAlpha(mixLab(m.set, m.halo, 0.45), 0.9);
  c.fillRect(M.x0 + 200, TRACK + 12, M.x1 - M.x0 - 230, 20);
  c.fillStyle = ink;
  for (let x = M.x0 + 206; x < M.x1 - 30; x += 26) {
    c.beginPath();
    c.arc(x + 10, TRACK + 22, 8.5, 0, Math.PI * 2);
    c.fill();
  }
  // the pocket windows along the front: sorted cheques behind glass, lamp-lit
  for (let i = 0; i < POCKETS.n; i++) {
    const x = POCKETS.x0 + i * POCKETS.w + 5;
    c.fillStyle = withAlpha(mixLab(m.set, m.halo, 0.3), 0.85);
    c.fillRect(x, TRACK + 46, POCKETS.w - 10, 44);
    c.fillStyle = withAlpha(paperTone(env, 0.55), 0.9);
    const n = 3 + Math.floor(h01(i, 41) * 4);
    for (let k = 0; k < n; k++) c.fillRect(x + 3 + k * 4, TRACK + 58 - k * 1.5, 2.2, 32 + k * 1.5);
    c.fillStyle = ink;
  }
  // the pocket bank (right): eight pockets with dividers
  for (let i = 0; i <= POCKETS.n; i++) c.fillRect(POCKETS.x0 + i * POCKETS.w - 2, TRACK - 52, 4, 52);
  c.fillRect(POCKETS.x0 - 2, TRACK - 4, POCKETS.n * POCKETS.w + 4, 6);
  // operator's ledge and a keypad
  c.fillRect(M.x0 + 120, top + 40, 200, 10);
  c.fillStyle = withAlpha(m.rim, 0.22);
  c.lineWidth = 1;
  for (let i = 0; i < 6; i++) c.fillRect(M.x0 + 140 + i * 24, top + 30, 16, 6);
  // panel seams and louvres (cut-lines)
  c.strokeStyle = withAlpha(m.rim, 0.16);
  for (let x = M.x0 + 340; x < M.x1 - 40; x += 160) c.strokeRect(x, top + 30, 140, FLOOR - top - 70);
  c.fillStyle = withAlpha(m.rim, 0.12);
  for (let k = 0; k < 6; k++) c.fillRect(M.x0 + 30, top + 80 + k * 14, 60, 2);
  c.fillStyle = withAlpha(m.rim, 0.4);
  c.fillRect(M.x0 + 6, TRACK, M.x1 - M.x0 - 12, 1.4);
  // round 2: the cabinet's cut-paper top rim (the paper's cut edge catching the pendant), so its silhouette reads
  // against the floor: the lit lip over the cabinet top and over the kick plate, tops only
  c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), 0.55);
  c.fillRect(M.x0 + 8, top, M.x1 - M.x0 - 16, 2);
  c.fillStyle = withAlpha(m.rim, 0.22);
  c.fillRect(M.x0 + 14, FLOOR - 16, M.x1 - M.x0 - 28, 1.4);
  c.fillRect(M.x0 + 120, top + 40, 200, 1.2);
  // the stack in the hopper (lamp-lit paper edges)
  c.fillStyle = paperTone(env, 0.6);
  for (let i = 0; i < 9; i++) {
    const x = HOPPER.x0 + 24 + i * 7;
    c.beginPath();
    c.moveTo(x, TRACK);
    c.lineTo(x + 4, TRACK);
    c.lineTo(x - 14, TRACK - CHQ.h);
    c.lineTo(x - 18, TRACK - CHQ.h);
    c.closePath();
    c.fill();
  }
}

/** the cheque index passing the read station at time t (and how far it is through the flash) */
/** the read: a ~0.1 s glint over the amount, starting on the same tick the display updates (u = READ_U) */
/** the upright window under the lantern (d = x − READ_X − 6): a cheque snaps upright as its amount box comes under
 * the lantern (d = UP.a), is read a moment later (d = D_READ) and flicks on at d = UP.b; only one stands at a time */
const UP = { a: -52, b: 20 };
const D_READ = -46;
const READ_U = 0.5 + ((6 + D_READ) * RATE) / SPEED;
/** the phase at which a cheque arrives (snaps upright) under the light: from here to its read the display blanks */
const ARRIVE_U = 0.5 + ((6 + UP.a) * RATE) / SPEED;
const GLINT_X = READ_X + 44;
function flashAt(tq: number): { i: number; k: number } {
  const ph = tq * RATE;
  const i = Math.floor(ph);
  const u = ph - i;
  const dt = (u - READ_U) / RATE; // seconds since the read
  const k = dt >= -1e-6 && dt < 0.105 ? 1 - 0.35 * (dt / 0.105) : 0;
  return { i, k };
}

function cheques(c: C, env: PaintEnv, t: number) {
  // each cheque stands on edge on the transport; it passes the read station when (t*RATE) crosses its index
  const m = env.mood;
  // the handwritten amount's size: ~24 px cap on a 1080p frame at this camera (a hand you can read under the lantern)
  const handPx = Math.min(26, (17 * 24) / Math.max(1, capPx1080(c, HAND(17))));
  const ph = t * RATE;
  const first = Math.floor(ph - (READ_X - TRAVEL.from) / SPEED * RATE) - 1;
  const last = Math.floor(ph + (TRAVEL.to - READ_X) / SPEED * RATE) + 1;
  for (let i = first; i <= last + 2; i++) {
    // cheque i is centred on READ_X at time (i + .5) / RATE
    const x = READ_X + (t - (i + 0.5) / RATE) * SPEED;
    if (x < TRAVEL.from - 40) continue;
    let y = TRACK;
    let sx = 1;
    let xx = x;
    // the flick: waiting cheques lean back ~18°, each snaps upright under the lantern and flicks forward ~18°
    const d = x - (READ_X + 6);
    const rot = d < UP.a ? -0.31 * clamp01((UP.a - d) / 30) : d > UP.b ? 0.31 * clamp01((d - UP.b) / 30) : 0;
    if (x > TRAVEL.to) {
      // it flicks into its pocket like a dealt card: a small hop as it turns edge-on and drops into the slot
      const u = clamp01((x - TRAVEL.to) / 110);
      const pocket = Math.abs(((i * 5) % POCKETS.n) + POCKETS.n) % POCKETS.n;
      const px = POCKETS.x0 + pocket * POCKETS.w + POCKETS.w / 2;
      xx = TRAVEL.to + (px - TRAVEL.to) * u;
      y = TRACK - 22 * Math.sin(u * Math.PI * 0.8) + 30 * u * u;
      sx = Math.max(0.08, Math.cos(u * Math.PI * 0.5));
      if (u >= 1) continue;
    }
    chequeFace(c, env, xx, y, sx, i, x > TRAVEL.to ? 0.31 : rot, handPx);
  }
  // the cheques already sorted, standing in the pockets (static heights, seeded)
  c.fillStyle = paperTone(env, 0.35);
  for (let k = 0; k < POCKETS.n; k++) {
    const n = 2 + Math.floor(h01(k, 31) * 4);
    for (let j = 0; j < n; j++) c.fillRect(POCKETS.x0 + k * POCKETS.w + 6 + j * 3, TRACK - 22 - j * 1.5, 2.2, 20);
  }
  void m;
}

function chequeFace(c: C, env: PaintEnv, x: number, y: number, sx: number, i: number, rot: number, handPx: number) {
  const m = env.mood;
  const near = Math.max(0, 1 - Math.abs(x - READ_X) / 260);
  const W = CHQ.w, H = CHQ.h;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(sx, 1);
  c.fillStyle = paperTone(env, (0.45 + 0.45 * near) * (0.6 + 0.4 * sx));
  c.fillRect(-W / 2, -H, W, H);
  c.strokeStyle = withAlpha(m.ink, 0.45);
  c.lineWidth = 0.8;
  c.strokeRect(-W / 2, -H, W, H);
  if (sx > 0.35) {
    const ink = m.ink;
    // the bank's printed name block (top-left) and the date rule (top-right)
    c.fillStyle = withAlpha(ink, 0.5);
    c.fillRect(-W / 2 + 6, -H + 6, 34, 2.2);
    c.fillRect(-W / 2 + 6, -H + 10, 22, 1);
    c.fillRect(W / 2 - 40, -H + 9, 32, 0.9);
    // PAY TO THE ORDER OF: a tiny printed lead-in, then the long payee rule
    c.fillRect(-W / 2 + 6, -H + 25, 10, 1.4);
    c.fillStyle = withAlpha(ink, 0.4);
    c.fillRect(-W / 2 + 18, -H + 27, W - 92, 0.9);
    scribble(c, -W / 2 + 22, -H + 25, 46, 700 + i, { color: withAlpha(ink, 0.7), lw: 0.9, h: 5 });
    // the written-out amount line and the signature line (lower right)
    c.fillRect(-W / 2 + 6, -H + 38, W - 70, 0.9);
    c.fillRect(W / 2 - 52, -12, 46, 0.9);
    scribble(c, W / 2 - 50, -13, 34, 900 + i, { color: withAlpha(ink, 0.6), lw: 0.9, h: 5 });
    // the MICR band along the bottom edge: the routing / account / serial glyphs as squat blocks with the
    // characteristic transit marks between groups
    c.fillStyle = withAlpha(ink, 0.62);
    let mx = -W / 2 + 8;
    for (let g = 0; g < 3; g++) {
      c.fillRect(mx, -7, 2, 4);
      c.fillRect(mx + 3, -6, 1.4, 2);
      mx += 7;
      const n = g === 0 ? 9 : g === 1 ? 8 : 4;
      for (let k = 0; k < n; k++) {
        const hh = 2.5 + 2 * h01(k + g * 11, 31 + (i % 7));
        c.fillRect(mx, -3 - hh, 2.4, hh);
        mx += 4;
      }
      mx += 5;
    }
    // the boxed amount field at the right end: a printed '$', the box, and the HANDWRITTEN amount in it
    const bx = BOX.dx - BOX.w / 2, by = BOX.dy - BOX.h / 2;
    c.strokeStyle = withAlpha(ink, 0.6);
    c.lineWidth = 0.9;
    c.strokeRect(bx, by, BOX.w, BOX.h);
    c.font = `600 9px ${FONT.mono}`;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    c.fillText('$', bx - 2, BOX.dy + 1);
    c.font = HAND(handPx);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(mixLab(ink, '#1d2238', 0.35), 0.92);
    c.save();
    c.translate(BOX.dx, BOX.dy + handPx * 0.32);
    c.rotate(-0.04 + 0.05 * (h01(i, 77) - 0.5));
    c.fillText(amountOf(i), 0, 0, BOX.w - 4);
    c.restore();
  }
  c.restore();
}

function readStation(c: C, env: PaintEnv, t: number) {
  const ink = env.fill('ink');
  const m = env.mood;
  // the read hood over the transport and the arm carrying the lantern
  c.fillStyle = ink;
  // the read post and the gallows arm the lantern hangs from (by its ring)
  const armY = TRACK - CHQ.h - 30 - 74;
  c.fillRect(READ_X - 40, armY, 14, TRACK - armY);
  c.fillRect(READ_X - 40, armY, GLINT_X - READ_X + 44, 8);
  c.fillRect(GLINT_X - 1, armY + 6, 2, 12);
  // the display on a swing arm from the read hood
  c.fillRect(DISPLAY.x + DISPLAY.w / 2, DISPLAY.y - 3, READ_X - 40 - (DISPLAY.x + DISPLAY.w / 2), 6);
  c.fillRect(READ_X - 46, DISPLAY.y - 6, 10, TRACK - CHQ.h - 30 - DISPLAY.y + 6);
  c.beginPath();
  c.roundRect(DISPLAY.x - DISPLAY.w / 2 - 8, DISPLAY.y - DISPLAY.h / 2 - 8, DISPLAY.w + 16, DISPLAY.h + 16, 5);
  c.fill();
  const fl = flashAt(t);
  // the screen: the amount, in clean type, from the moment the lantern flashes over it
  c.fillStyle = mixLab(m.fg, m.set, 0.4);
  c.fillRect(DISPLAY.x - DISPLAY.w / 2, DISPLAY.y - DISPLAY.h / 2, DISPLAY.w, DISPLAY.h);
  const ph = t * RATE;
  // the display types the cheque the lantern has just read, LAG s after its flash (the same number, in clean type)
  // round 2: the number on screen always belongs to the cheque under the light: from a cheque's arrival under the
  // lantern until its flash reaches the display, the screen blanks ('$ ---.--', dim); then it shows THAT cheque
  const j = Math.floor(ph - ARRIVE_U);
  const blank = ph - j < READ_U + LAG * RATE;
  const amt = blank ? '$ ---.--' : `$ ${amountOf(j)}`;
  c.save();
  c.font = `500 ${legibleSize(c, `500 26px ${FONT.mono}`, 26)}px ${FONT.mono}`;
  c.textAlign = 'right';
  c.textBaseline = 'middle';
  c.fillStyle = blank ? withAlpha(mixLab(m.core, m.set, 0.55), 0.55) : mixLab(m.core, '#ffe6b0', 0.3);
  c.shadowColor = withAlpha(m.core, blank ? 0 : 0.6);
  c.shadowBlur = 5;
  c.fillText(amt, DISPLAY.x + DISPLAY.w / 2 - 12, DISPLAY.y + 2);
  c.restore();
  // the tiny pierced tin lantern (the same as shot 1), its stencil flashing over the amount
  stencilHood(c, env, GLINT_X, TRACK - CHQ.h - 30, 1.0, fl.k);
  if (fl.k > 0.02) {
    // its patterned light falling on the amount box of the cheque below
    c.save();
    c.globalCompositeOperation = 'lighter';
    const lx = GLINT_X, ly = TRACK - CHQ.h + 13;
    const g = c.createRadialGradient(lx, ly, 2, lx, ly, 46);
    g.addColorStop(0, withAlpha(m.core, 0.7 * fl.k));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(lx - 50, ly - 50, 100, 100);
    // the stencil's 3 × 3 pattern projected on the amount (a beam, then a grid of spots)
    c.fillStyle = withAlpha(m.core, 0.55 * fl.k);
    c.beginPath();
    c.moveTo(lx - 30, TRACK - CHQ.h - 12);
    c.lineTo(lx + 30, TRACK - CHQ.h - 12);
    c.lineTo(lx + 20, ly + 4);
    c.lineTo(lx - 20, ly + 4);
    c.closePath();
    c.globalAlpha = 0.35;
    c.fill();
    c.restore();
  }
  // the read travels to the display: a faint light trace from the lantern along the arm to the screen
  {
    const ph2 = t * RATE;
    const since = (ph2 - Math.floor(ph2 - READ_U) - READ_U) / RATE; // seconds since the last flash
    if (since >= 0 && since < LAG + 0.08) {
      const u = clamp01(since / LAG);
      const ax = GLINT_X, ay = TRACK - CHQ.h - 52;
      const dx = DISPLAY.x + DISPLAY.w / 2 + 6, dy = DISPLAY.y;
      const fade = since > LAG ? 1 - (since - LAG) / 0.08 : 1;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(m.core, 0.22 * fade);
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(ax, ay);
      c.quadraticCurveTo((ax + dx) / 2, Math.min(ay, dy) - 26, dx, dy);
      c.stroke();
      // the bead of light running along it
      const qx = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * ((ax + dx) / 2) + u * u * dx;
      const qy = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * (Math.min(ay, dy) - 26) + u * u * dy;
      const g = c.createRadialGradient(qx, qy, 0, qx, qy, 9);
      g.addColorStop(0, withAlpha(m.core, 0.8 * fade));
      g.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = g;
      c.fillRect(qx - 10, qy - 10, 20, 20);
      c.restore();
    }
  }
}

function pendant(c: C, env: PaintEnv) {
  // a shaded pendant lamp hanging from the ceiling over the machine
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(LAMP.x - 1.5, -400, 3, 400 + LAMP.y);
  c.beginPath();
  c.moveTo(LAMP.x - 64, LAMP.y + 44);
  c.quadraticCurveTo(LAMP.x - 50, LAMP.y + 4, LAMP.x - 12, LAMP.y);
  c.lineTo(LAMP.x + 12, LAMP.y);
  c.quadraticCurveTo(LAMP.x + 50, LAMP.y + 4, LAMP.x + 64, LAMP.y + 44);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.85);
  c.beginPath();
  c.ellipse(LAMP.x, LAMP.y + 44, 52, 5, 0, 0, Math.PI * 2);
  c.fill();
  // the cone of light under the shade
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, LAMP.y + 44, 0, TRACK + 20);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.22));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(LAMP.x - 56, LAMP.y + 44);
  c.lineTo(LAMP.x + 56, LAMP.y + 44);
  c.lineTo(LAMP.x + 300, TRACK + 20);
  c.lineTo(LAMP.x - 300, TRACK + 20);
  c.closePath();
  c.fill();
  c.restore();
}


/** an L5 wire sorting bin of cheques, its near corner crossing the frame's left edge (blurred by the layer) */
function sortingBin(c: C, env: PaintEnv) {
  const ink = env.fill('fg');
  c.fillStyle = ink;
  // the bin's body and its slanted wire rim
  c.beginPath();
  c.moveTo(-260, 1040);
  c.lineTo(-260, 560);
  c.lineTo(96, 528);
  c.lineTo(112, 1040);
  c.closePath();
  c.fill();
  // the cheques standing in it (their tops above the rim, a ragged edge)
  for (let i = 0; i < 26; i++) {
    const x = -250 + i * 13.5;
    const h = 22 + 18 * h01(i, 51);
    c.fillRect(x, 548 - (x + 260) * 0.09 - h, 9, h + 6);
  }
  // the wire mesh as a few holes (the far light through it)
  c.fillStyle = withAlpha(env.mood.halo, 0.08);
  for (let k = 0; k < 5; k++) c.fillRect(-240 + k * 66, 620, 2, 300);
}
