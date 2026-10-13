/**
 * ch01-s07 — TITLE: WHO TAUGHT THE MACHINE? (card, candleAmber, ≈9.4 s; 1 s crossfade in from ch01-s06).
 *
 * −0.5 → 1.0   the same Chicago camera as ch01-s06 (sets/ch01-s06-chicago.ts chiCam) keeps pushing, now
 *              accelerating, into the lit top-floor window; the lamplight swells and floods the frame while the
 *              palette walks from night to candleAmber. Out of the flood settles a warm amber backlight, haze
 *              and drifting motes.
 * title (1.0)  a sheet of black card slides down into the light: OPAQUE from its first frame, position only, an
 *              ease-out of 0.45 s with a ≈ 4 px overshoot that settles on the twos. The title is CUT OUT of it;
 *              as it lands the lamp behind clicks on (two steps on the twos) and the light pours through the
 *              letters, the hottest values in frame (hairline rim on every cut edge, motes behind the letterforms,
 *              light wrap on the card's face). The lit band below sits ≈ 30% under the letters. The window it is
 *              held up in frames us, soft, on a nearer plane (stiles, head rail, meeting rail; ≈ 1.5× the card's
 *              parallax), with a thin haze between. A very small paper lantern hangs from the card on a thread.
 * subtitle (3) "A case history of neural networks, 1943–2026", Cormorant italic, near-black ink on the light.
 * hold         the light settles a little lower, so that…
 * wickCatch    …the lantern's wick catches: a pinpoint of flame and a tight halo, the paper stays dark (the
 *              motif's third note withheld). Held; from ≈ 8.75 s a slow fade to the warm dark, the pinpoint at
 *              full strength to the end (it lands inside ch02-s01's lit window through the crossfade).
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, crossfadeMood, defineShot, dustMotes, mixLab, paperLantern, toScreen, withAlpha } from '../../../film';
import type { Camera3, Frame, LayerSpec } from '../../../film';
import { CHI, CHI_NIGHT, chiCam, chicagoNight } from '../sets/ch01-s06-chicago';

const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const TITLE = ['WHO TAUGHT', 'THE MACHINE?'];
const SUB = 'A case history of neural networks, 1943–2026';
const SIZE = 104;
/** the card's resting lower edge (L4 world) and the lantern's thread */
const CARD_BOTTOM = 428;
const CARD = { x: -260, y: -260, w: 1800, h: CARD_BOTTOM + 30 + 260 };
const LANTERN = { x: 640, r: 20, hang: 40 };
/** the card's entry: OPAQUE from its first frame, driven by position only. It starts DROP_LEAD before the beat
 *  DROP_FROM above its rest and lands DROP_DUR later on an ease-out with a ≈ 4 px overshoot (back-out, s = 0.52);
 *  the overshoot and settle step on the twos */
const DROP_LEAD = 0.1;
const DROP_FROM = 470;
const DROP_DUR = 0.45;
const BACK_S = 0.52;
/** the window's frame in front of us (sash stiles, top rail, meeting rail): ≈ 1.5× the card's parallax */
const WIN_FG: LayerSpec = { id: 'winFg', z: 680, haze: 0, blur: 6 };
/** the subtitle's baseline and the window sill's top edge (L5) */
const SUB_Y = 592;
const SILL_Y = 612;
/** the flood: the window's lamplight fills the frame by FLOOD_FULL, the title room is fully settled by SETTLE */
const FLOOD_FULL = 0.7;
const SWITCH = 0.8;
const SETTLE = 1.7;
const RAYS = 9;
/** half-width of the Chicago → title-room dissolve around SWITCH */
const XF = 0.3;
/** a scratch copy of the composed Chicago frame for the dissolve (a buffer, not state: rewritten every use) */
let SNAP: HTMLCanvasElement | null = null;
function snapshot(c: CanvasRenderingContext2D): HTMLCanvasElement {
  const src = c.canvas as HTMLCanvasElement;
  if (!SNAP) SNAP = document.createElement('canvas');
  if (SNAP.width !== src.width || SNAP.height !== src.height) {
    SNAP.width = src.width;
    SNAP.height = src.height;
  }
  const g = SNAP.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'copy';
  g.drawImage(src, 0, 0);
  return SNAP;
}

/** the card's deckled (hand-cut) lower edge, in card-local px */
let EDGE: Path2D | null = null;
function cardPath() {
  if (EDGE) return EDGE;
  const p = new Path2D();
  const by = CARD_BOTTOM - CARD.y;
  p.moveTo(0, 0);
  p.lineTo(CARD.w, 0);
  p.lineTo(CARD.w, by);
  for (let x = CARD.w; x >= 0; x -= 14) {
    const j = Math.sin(x * 0.013) * 2.2 + Math.sin(x * 0.071 + 1.3) * 1.1;
    p.lineTo(x, by + j);
  }
  p.closePath();
  EDGE = p;
  return p;
}
function titleLayout(c: CanvasRenderingContext2D) {
  // card-local coordinates of each line's centre baseline
  const cx = 640 - CARD.x;
  return TITLE.map((ln, i) => ({ ln, x: cx, y: 214 + i * 118 - CARD.y }));
}
function fontsReady() {
  try {
    return typeof document !== 'undefined' && document.fonts.check(`700 ${SIZE}px ${FONT.display}`);
  } catch {
    return false;
  }
}
function setTitleFont(c: CanvasRenderingContext2D) {
  c.font = `700 ${SIZE}px ${FONT.display}`;
  c.letterSpacing = `${SIZE * 0.07}px`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
}

/** the camera of the title room: a breath of a push, on ones */
function titleCam(t: number, D: number): Camera3 {
  const u = sm(t / D);
  return { x: 640 + 8 * u, y: 352 - 4 * u, z: 10 + 46 * u, lens: 1 };
}

function paintTitleRoom(f: Frame, t: number, sc: { title: number; subtitle: number; wick: number; dur: number }, under: () => void) {
  f.setMood('candleAmber');
  const cam = titleCam(t, sc.dur);
  f.camera(cam);
  const m = f.mood;
  // the light settles a little before the wick catches, so the pinpoint reads
  const Lt = 1 - 0.55 * sm((t - (sc.wick - 2.9)) / 2.8);
  // the card's entry: position only (opaque throughout); the overshoot and settle on the twos
  const t0 = sc.title - DROP_LEAD;
  const land = t0 + DROP_DUR;
  const tc = t < t0 + DROP_DUR * 0.7 ? t : Math.floor(t * 12 + 1e-9) / 12;
  const u = (tc - t0) / DROP_DUR;
  const v = Math.min(0, Math.max(-1, u - 1));
  const e = u <= 0 ? 0 : u >= 1 ? 1 : 1 + (BACK_S + 1) * v * v * v + BACK_S * v * v;
  // the light behind the card switches on through the letters as it lands (two steps on the twos)
  const lq = Math.floor(t * 12 + 1e-9) / 12 - Math.floor(land * 12 + 1e-9) / 12;
  const lampUp = lq < 0 ? 0 : lq < 1 / 12 ? 0.5 : lq < 2 / 12 ? 1.1 : 1;
  f.backlight({ sunX: 640, sunY: 270, sunRadius: 760, intensity: 1.25 * Lt * (0.5 + 0.5 * Math.min(1, lampUp)) });
  // the lamp behind the card: a broad warm source the letters open onto, hottest behind the title
  f.practical({ x: 640, y: 270, kind: 'lamp', seed: 71, intensity: 1.0 * Lt * lampUp, radius: 190, layer: 'L2' });
  f.fog({ yCenter: 0.6 * 720, height: 0.42 * 720, alpha: 0.16, drift: 6 });
  // …and the room itself dims to amber-brown (behind the card, so the letter-light dims with it)
  const dimA = 0.68 * (1 - Lt);
  if (dimA > 0.002) {
    f.c.save();
    f.c.fillStyle = withAlpha(mixLab(m.ink, m.halo, 0.12), dimA);
    f.c.fillRect(0, 0, 1280, 720);
    f.c.restore();
  }
  // motes drifting in the light (seen through the letterforms and in the lit air below the card)
  f.layer('L3', (c, env) => {
    dustMotes(c, { area: { x: -200, y: -120, w: 1700, h: 960 }, count: 170, drift: { x: 5, y: -3 }, size: 1.3, brightness: 1.25 * Lt, salt: 11 }, env);
  });
  // the flood of lamplight settling, BEHIND the card (paper is opaque: the card never washes out)
  under();
  // the card: lowered on its fly-line from the `title` beat, overshoot, sway to rest
  const dy = -DROP_FROM * (1 - e);
  const rot = 0;
  const caught = t >= sc.wick;
  const flame = caught ? sm((t - sc.wick) / 0.18) : 0;
  const lantY = CARD_BOTTOM + dy + LANTERN.hang + LANTERN.r * 1.2;
  f.layer('L4', (c, env) => {
    if (u <= 0) return;
    const ready = fontsReady();
    const key = `nnh-ch01-s07-card2-${env.mood.id}-${ready ? 1 : 0}`;
    const drawCard = f.cached(key, CARD.w, CARD.h, (cc) => {
      cc.fillStyle = env.fill('ink');
      cc.fill(cardPath());
      if (!ready) return;
      // cut the letters out of the card
      cc.globalCompositeOperation = 'destination-out';
      setTitleFont(cc);
      for (const l of titleLayout(cc)) cc.fillText(l.ln, l.x, l.y);
      // hairline rim on every cut edge, and along the card's hand-cut lower edge
      // (source-atop: only the half of the stroke that lies on the card survives, so the glyphs' internal
      // overlapping contours never show as lines across the lit letters)
      cc.globalCompositeOperation = 'source-atop';
      cc.strokeStyle = withAlpha(env.mood.rim, 0.7);
      cc.lineWidth = 2.2;
      for (const l of titleLayout(cc)) cc.strokeText(l.ln, l.x, l.y);
      cc.globalCompositeOperation = 'source-over';
      cc.strokeStyle = withAlpha(env.mood.rim, 0.4);
      cc.lineWidth = 1.4;
      cc.beginPath();
      const by = CARD_BOTTOM - CARD.y;
      for (let x = CARD.w; x >= 0; x -= 14) {
        const j = Math.sin(x * 0.013) * 2.2 + Math.sin(x * 0.071 + 1.3) * 1.1;
        if (x === CARD.w) cc.moveTo(x, by + j - 0.5);
        else cc.lineTo(x, by + j - 0.5);
      }
      cc.stroke();
    });
    // the light that comes through the letters spills a little onto the card's face (light wrap)
    const drawSpill = f.cached(`nnh-ch01-s07-spill-${env.mood.id}-${ready ? 1 : 0}`, CARD.w, CARD.h, (cc) => {
      if (!ready) return;
      cc.fillStyle = env.mood.halo;
      setTitleFont(cc);
      for (const l of titleLayout(cc)) cc.fillText(l.ln, l.x, l.y);
    }, { blur: 9 });
    c.save();
    c.translate(640, CARD_BOTTOM + dy);
    c.rotate(rot);
    c.translate(-640, -(CARD_BOTTOM + dy));
    drawCard(c, CARD.x, CARD.y + dy);
    const on = Math.min(1, lampUp);
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.3 * Lt * on;
    drawSpill(c, CARD.x, CARD.y + dy);
    // the letters are the hottest thing in frame: the lamp's core pushed into the cut-outs themselves
    const drawHeat = f.cached(`nnh-ch01-s07-heat-${env.mood.id}-${ready ? 1 : 0}`, CARD.w, CARD.h, (cc) => {
      if (!ready) return;
      const g = cc.createRadialGradient(640 - CARD.x, 270 - CARD.y, 40, 640 - CARD.x, 270 - CARD.y, 560);
      g.addColorStop(0, env.mood.core);
      g.addColorStop(1, mixLab(env.mood.core, env.mood.halo, 0.5));
      cc.fillStyle = g;
      setTitleFont(cc);
      for (const l of titleLayout(cc)) cc.fillText(l.ln, l.x, l.y);
    });
    c.globalAlpha = 0.55 * Lt * lampUp;
    drawHeat(c, CARD.x, CARD.y + dy);
    // shafts: the letter-light carried forward through the haze, spreading from the lamp behind the card
    // (all RAYS copies baked into one bitmap, drawn once)
    const drawRays = f.cached(`nnh-ch01-s07-rays-${env.mood.id}-${ready ? 1 : 0}`, CARD.w, CARD.h + 120, (cc) => {
      if (!ready) return;
      cc.fillStyle = env.mood.halo;
      setTitleFont(cc);
      const ox = 640 - CARD.x;
      const oy = 270 - CARD.y;
      for (let i = 1; i <= RAYS; i++) {
        const k = 1 + i * 0.034;
        cc.save();
        cc.globalAlpha = 0.075 * (1 - i / (RAYS + 1));
        cc.translate(ox, oy + i * 7);
        cc.scale(k, k);
        cc.translate(-ox, -oy);
        for (const l of titleLayout(cc)) cc.fillText(l.ln, l.x, l.y);
        cc.restore();
      }
    }, { blur: 9 });
    c.globalAlpha = Lt * on;
    drawRays(c, CARD.x, CARD.y + dy);
    c.restore();
    // the small lantern on its thread, unlit until the wick catches
    paperLantern(c, { x: LANTERN.x, y: lantY, r: LANTERN.r, act: 0.1 * flame, hang: LANTERN.hang, tassel: true, halo: 0.2 }, env);
  });
  f.rim({ x: 0, y: -1 });
  // the light under the card falls off with distance from its deckled edge, and the whole band sits ≈ 30%
  // below the letters, so the eye stays on the title: the lantern gets a stage, not a spotlight
  if (u > 0) {
    const c = f.c;
    const edge = toScreen(LAYERS.L4, cam, 640, CARD_BOTTOM + dy).y;
    c.save();
    const g = c.createLinearGradient(0, edge, 0, 660);
    g.addColorStop(0, withAlpha(m.ink, 0.26));
    g.addColorStop(0.5, withAlpha(m.ink, Math.max(0, 0.42 - 0.22 * (1 - Lt))));
    g.addColorStop(1, withAlpha(m.ink, Math.max(0, 0.6 - 0.36 * (1 - Lt))));
    c.fillStyle = g;
    c.fillRect(0, edge, 1280, 720 - edge);
    c.globalCompositeOperation = 'lighter';
    const h = c.createLinearGradient(0, edge, 0, edge + 70);
    h.addColorStop(0, withAlpha(m.halo, 0.12 * Lt));
    h.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = h;
    c.fillRect(0, edge, 1280, 70);
    c.restore();
  }
  // the window we came through: its sill (L5) and jambs (L6), soft at the frame's edges
  f.layer('L5', (c, env) => {
    f.cached(`nnh-ch01-s07-sill2-${env.mood.id}`, 1900, 160, (cc) => {
      // the sill board: a lit top face (the lamp skims it), its nosing, and the dark apron below
      cc.fillStyle = mixLab(env.fill('fg'), env.mood.halo, 0.38);
      cc.fillRect(0, 20, 1900, 10);
      cc.fillStyle = env.fill('fg');
      cc.fillRect(0, 29, 1900, 131);
      cc.fillStyle = withAlpha(env.mood.rim, 0.85);
      cc.fillRect(0, 19, 1900, 3);
      cc.fillStyle = withAlpha(env.mood.rim, 0.14);
      cc.fillRect(0, 29, 1900, 1.2);
    })(c, -300, SILL_Y - 20);
  });
  // the window the card is held up in: a thin haze, then its frame soft in the foreground (stiles, head
  // rail, the meeting rail low across the sill) on a nearer plane, so the push opens it ≈ 1.5× the card
  {
    const c = f.c;
    c.save();
    c.fillStyle = withAlpha(mixLab(m.halo, m.haze, 0.5), 0.08);
    c.fillRect(0, 0, 1280, 720);
    c.restore();
  }
  f.layer(WIN_FG, (c, env) => {
    f.cached(`nnh-ch01-s07-winfg-${env.mood.id}`, 1800, 1200, (cc) => {
      cc.translate(260, 300);
      cc.fillStyle = env.fill('fg');
      cc.fillRect(-260, -300, 1800, 316); // head rail (bottom edge at y 16)
      cc.fillRect(-260, -300, 316, 1200); // left stile (inner edge at x 56)
      cc.fillRect(1226, -300, 400, 1200); // right stile (inner edge at x 1226)
      cc.fillRect(-260, 668, 1800, 40); // meeting rail
      cc.fillRect(-260, 708, 1800, 200);
      // the sash's inner bead catches the lamp
      cc.fillStyle = withAlpha(env.mood.rim, 0.32);
      cc.fillRect(56, 16, 1170, 2);
      cc.fillRect(54, 16, 2, 652);
      cc.fillRect(1224, 16, 2, 652);
      cc.fillRect(56, 667, 1170, 2);
    })(c, -260, -300);
  });
  // subtitle: ink on the light
  const sA = sm((t - (sc.subtitle - 0.2)) / 0.8);
  if (sA > 0) {
    const c = f.c;
    c.save();
    c.font = `italic 600 36px ${FONT.display}`;
    c.letterSpacing = '0.6px';
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.globalAlpha = sA;
    c.fillStyle = m.ink;
    c.fillText(SUB, 640, SUB_Y + (1 - sA) * 5);
    c.restore();
  }
  return { flame, lantY, cam };
}

export default defineShot({
  id: 'ch01-s07',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return { tl, title: T.beat('title'), subtitle: T.beat('subtitle'), wick: T.beat('wickCatch'), dur: T.duration };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const c = f.c;
    let flame = 0;
    let lantY = 0;
    // the flood of lamplight: a bloom from the window that fills, then settles into the room (behind the card)
    const flood = 0.8 * (t < SWITCH ? sm((t + 0.25) / (SWITCH + 0.25)) : 1 - sm((t - SWITCH) / (SETTLE - SWITCH)));
    const win = toScreen(LAYERS.L4, chiCam(t), CHI.lamp.cx, CHI.lamp.cy);
    const k = sm((t - 0.5) / 1.0);
    const wx = win.x + (640 - win.x) * k;
    const wy = win.y + (290 - win.y) * k;
    const flooded = () => {
      if (flood <= 0.002) return;
      const m = f.mood;
      c.save();
      const R = 90 + 900 * sm(flood * 1.15);
      const g = c.createRadialGradient(wx, wy, 0, wx, wy, R);
      g.addColorStop(0, withAlpha(m.core, Math.min(1, flood * 1.2)));
      g.addColorStop(0.3, withAlpha(mixLab(m.core, m.halo, 0.45), Math.min(1, flood * 1.05)));
      g.addColorStop(0.7, withAlpha(m.halo, 0.85 * flood));
      g.addColorStop(1, withAlpha(mixLab(m.halo, m.haze, 0.5), 0.7 * flood * flood));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
      // the white-out is light filling AIR: haze drifting and motes turning in it
      const tex = flood * sm((t - 0.5) / 0.3);
      if (tex > 0.01) {
        f.fog({ yCenter: 380, height: 620, alpha: 0.3 * tex, drift: 11 });
        f.layer('L3', (cc, env) => {
          dustMotes(cc, { area: { x: -200, y: -120, w: 1700, h: 960 }, count: 150, drift: { x: 7, y: -4 }, size: 2.0, brightness: 1.6 * tex, salt: 12, color: env.mood.rim }, env);
        });
      }
    };
    const chicago = () => {
      // Chicago: the camera keeps pushing into the window as its lamplight swells
      const amber = sm((t + 0.4) / 1.3);
      const mood = crossfadeMood(CHI_NIGHT, 'candleAmber', amber);
      chicagoNight(f, { T: t, night: 1, lamp: 1, swell: sm((t + 0.5) / 1.3), mood });
      flooded();
    };
    const room = () => {
      const r = paintTitleRoom(f, t, scene, flooded);
      flame = r.flame;
      lantY = r.lantY;
    };
    // Chicago dissolves into the title room at the flood's peak (both painted, Chicago laid over the room)
    const w = sm((t - (SWITCH - XF)) / (2 * XF));
    if (w <= 0) chicago();
    else if (w >= 1) room();
    else {
      chicago();
      const snap = snapshot(c);
      room();
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 1 - w;
      c.drawImage(snap, 0, 0);
      c.restore();
    }
    // the slow fade to the warm dark; the pinpoint flame outlasts it
    const F = sm((t - (scene.wick + 0.35)) / 0.5);
    if (F > 0) {
      c.save();
      c.globalAlpha = 0.94 * F;
      c.fillStyle = mixLab(f.mood.ink, f.mood.halo, 0.1);
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }
    if (flame > 0) {
      const p = toScreen(LAYERS.L4, titleCam(t, scene.dur), LANTERN.x, lantY + LANTERN.r * 0.3);
      const A = flame * (1 - sm((t - (scene.dur + 0.1)) / 0.4));
      const m = f.mood;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const GR = 18;
      const g = c.createRadialGradient(p.x, p.y - 3, 0, p.x, p.y - 3, GR);
      g.addColorStop(0, withAlpha(m.core, 0.85 * A));
      g.addColorStop(0.3, withAlpha(m.halo, 0.32 * A));
      g.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.x - GR, p.y - 3 - GR, 2 * GR, 2 * GR);
      c.globalCompositeOperation = 'source-over';
      // the pinpoint: a tiny teardrop, flickering on the twos
      const tq = Math.floor(t * 12) / 12;
      const fl = 1 + 0.08 * Math.sin(tq * 23.7) * Math.sin(tq * 7.1);
      c.fillStyle = withAlpha(m.core, A);
      c.beginPath();
      c.moveTo(p.x, p.y - 6.6 * fl);
      c.quadraticCurveTo(p.x + 2.8, p.y - 0.6, p.x, p.y + 2.1);
      c.quadraticCurveTo(p.x - 2.8, p.y - 0.6, p.x, p.y - 6.6 * fl);
      c.fill();
      c.restore();
    }
  },
});
