/**
 * ch12-s05 — BACK ON THE DESKTOP (scene, parchment; lamp change from ch12-s04's dawnGold; 5.50 s).
 *   L1208 "The notes window ends: “Wire one more neuron by hand”."
 *
 * The HandwiredOS desk as a toy theatre once more, plain (sets/ch01-s02-theatre + sets/handwiredDesk, the same
 * staging as ch01-s02): the warm paper-beige desktop with its faint dot grid, Monitor, Notes and Photos hanging by
 * fine threads, the dock of three tiles and the one copper wire under it catching the light. No X-ray, nothing lit
 * inside: just the desk. A slow push toward the Notes window (its sheet hangs in front of Photos here: the subject).
 * Its short to-do list, soft since ch01-s02, racks into focus line by line from the top; on 'Wire' the last line
 * sharpens in the window's own hand (Q088), as part of the window; the only caption is the small attribution.
 * Nothing else moves; Photos' twelve landscapes sit still.
 *
 * TEACHES, word by word:
 *   desk (0.40)   the lamp change has landed on the plain warm desk; the copper wire under the dock catches the light
 *   rack (0.81)   'notes': the Notes list racks into focus from the top
 *   last (1.89)   'Wire': the rack reaches the last line and it sharpens: Wire one more neuron by hand; the
 *                 attribution 'HandwiredOS · Notes' sets in, lower left
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, PUPPET_NEAR_BLACK, defineShot, drawTracked, legibleSize, mixLab, textProbe, textRole, toScreen, withAlpha } from '../../../film';
import { handwiredDesk } from '../sets/handwiredDesk';
import { DESK_G, PROSCENIUM, THEATRE, WIN, paperWindow, proscenium, stageFloor, theatreWall, windowThreads } from '../sets/ch01-s02-theatre';
import { deskDockGlyphs } from '../sets/ch01-s01-dock';
import { OS_COLORS } from '../sets/circuit';
import { camK, spline, win, type Key } from '../sets/ch12-s01-valley';

const ID = 'ch12-s05';
const THREAD_TOP = 112;
/** Q088, the last line of the Notes window's to-do list (its own text) */
const LAST = 'Wire one more neuron by hand';

// the push: the wide toy theatre (ch01-s02's framing) toward the Notes window, quicker at first so the last line
// reads by 'Wire', then still slower
const KX: Key[] = [[0, 640], [0.3, 640], [1.95, 712], [5.5, 736]];
const KY: Key[] = [[0, 360], [0.3, 360], [1.95, 300], [5.5, 288]];
const KK: Key[] = [[0, 1.0], [0.3, 1.0], [1.95, 1.62], [5.5, 1.96]];
const KZ: Key[] = [[0, 0], [0.3, 0], [1.95, 170], [5.5, 240]];
const camAt = (t: number): Camera3 => camK(spline(KX, t), spline(KY, t), spline(KK, t), spline(KZ, t));
/** the action-plane scale at 'Wire' (the attribution is sized to read from there on) */
const K_LAST = 1.62;
const ATTR = 'HandwiredOS · Notes';

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return { tl, desk: T.beat('desk'), rack: T.beat('rack'), last: T.beat('last'), D: T.duration };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const desk = sc.desk as number, rack = sc.rack as number, last = sc.last as number, D = sc.D as number;
    f.camera(camAt(t));

    f.backlight({ sunX: 640, intensity: 0.8 });
    f.layer('L2', (c, env) => theatreWall(f, c, env));
    f.fog('A');
    // L3: the desk flat (its windows hang in front at L4), plain: no X-ray; the wire under the dock catches the light
    const wire = 0.35 + 0.45 * win(t, desk - 0.2, desk + 0.9);
    f.layer('L3', (c, env) => {
      stageFloor(c, env);
      handwiredDesk(f, c, env, {
        ...THEATRE.desk,
        proscenium: false,
        windows: { monitor: { alpha: 0 }, notes: { alpha: 0 }, photos: { alpha: 0 } },
        wire,
        key: ID,
      });
      deskDockGlyphs(c, DESK_G.tiles, 0, OS_COLORS.ink, 0.82);
    });
    f.fog({ yCenter: 600, height: 110, alpha: 0.1, drift: 6 });

    // L4: Monitor and Photos still; Notes in front, its list racking into focus from the top
    const rackU = win(t, rack - 0.05, last - 0.05);
    const lastU = win(t, last - 0.05, last + 0.4);
    f.layer('L4', (c, env) => {
      windowThreads(c, env, WIN.monitor, {}, THREAD_TOP);
      windowThreads(c, env, WIN.photos, {}, THREAD_TOP);
      windowThreads(c, env, WIN.notes, {}, THREAD_TOP);
      paperWindow(c, env, 'monitor', WIN.monitor, {}, { footer: 1 });
      paperWindow(c, env, 'photos', WIN.photos, {}, { photosClock: 99, photosRate: 12 });
      notesRack(c, env, rackU, lastU, f.pxScale);
      // the small attribution, set on the desk just above the Notes window, from 'Wire' (sized to read at 'Wire')
      attribution(c, env, win(t, last + 0.1, last + 0.5) * (1 - win(t, D - 0.4, D)), toScreen(LAYERS.L4, camAt(t), 0, 0).k, K_LAST);
    });
    f.rim({ x: 0, y: -1 });
    f.layer(PROSCENIUM, (c, env) => proscenium(c, env, { title: 'HandwiredOS', titleA: 0 }));
    // L5: the workbench's near edge, dark and soft, at the lower left (ch01-s02's)
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/bench/${env.mood.id}`, 460, 220, (cc) => {
        cc.fillStyle = PUPPET_NEAR_BLACK;
        cc.beginPath();
        cc.moveTo(0, 70);
        cc.lineTo(330, 92);
        cc.quadraticCurveTo(352, 94, 360, 112);
        cc.lineTo(392, 220);
        cc.lineTo(0, 220);
        cc.closePath();
        cc.fill();
        cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.4);
        cc.lineWidth = 2.5;
        cc.beginPath();
        cc.moveTo(0, 70);
        cc.lineTo(330, 92);
        cc.quadraticCurveTo(352, 94, 360, 112);
        cc.stroke();
      }, { blur: 8 })(c, -120, 560);
    });

  },
});

/**
 * The Notes window, in front: drawn soft (blurred) below the rack line and sharp above it; its last line (the
 * theatre's faint fifth scribble) is the real text, Q088, sharpening with lastU.
 */
function notesRack(c: CanvasRenderingContext2D, env: PaintEnv, rackU: number, lastU: number, pxScale: number) {
  const r = WIN.notes;
  const th = Math.max(12, r.h * 0.085);
  const lh = (r.h - th) * 0.15;
  const rackY = r.y + th + (r.h - th) * rackU;
  const drawWin = () => paperWindow(c, env, 'notes', r, {}, { focused: true });
  // soft below the rack line
  if (rackU < 1) {
    c.save();
    c.beginPath();
    c.rect(r.x - 20, rackY, r.w + 40, r.h + 40);
    c.clip();
    c.filter = `blur(${(2.2 * pxScale).toFixed(2)}px)`;
    drawWin();
    c.restore();
  }
  // sharp above it
  c.save();
  c.beginPath();
  c.rect(r.x - 20, r.y - 20, r.w + 40, rackY - r.y + 20);
  c.clip();
  drawWin();
  c.restore();
  // the last line: paper over the theatre's faint fifth scribble, then the window's own words in its pen hand
  const sheet = mixLab(mixLab(OS_COLORS.sheet, env.mood.halo, 0.26), env.mood.haze, env.layer.haze * 0.6);
  const ink = mixLab(OS_COLORS.ink, env.mood.ink, 0.3);
  const y5 = r.y + th + lh * 5;
  const x0 = r.x + r.w * 0.155;
  c.fillStyle = sheet;
  c.fillRect(x0 - 1, y5 - lh * 0.62, r.x + r.w * 0.95 - x0, lh * 0.82);
  c.save();
  textRole(c, lastU > 0.5 ? 'subject' : 'texture', () => {
    let size = 15;
    c.font = `italic 400 ${size}px ${FONT.fell}`;
    const maxW = r.w * 0.79;
    const w0 = c.measureText(LAST).width;
    if (w0 > maxW) size = (size * maxW) / w0;
    c.font = `italic 400 ${size.toFixed(2)}px ${FONT.fell}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    if (lastU < 0.98) c.filter = `blur(${((1 - lastU) * 3 * pxScale).toFixed(2)}px)`;
    c.fillStyle = withAlpha(ink, 0.4 + 0.55 * lastU);
    c.fillText(LAST, x0 + 2, y5);
    c.filter = 'none';
    textProbe(c, `${ID}-q088`, x0, y5 - size, maxW, size * 1.2, 0.4 + 0.6 * lastU);
  });
  c.restore();
}

/** 'HandwiredOS · Notes' in small caps, right-aligned over the Notes window's top edge, on the desk paper */
function attribution(c: CanvasRenderingContext2D, env: PaintEnv, a: number, k: number, kRef: number) {
  if (a <= 0) return;
  const r = WIN.notes;
  c.save();
  textRole(c, 'subject', () => {
    const size = Math.max(10, legibleSize(c, `500 13px ${FONT.sc}`, 13, ATTR) * (k / kRef));
    c.globalAlpha = a * 0.72;
    c.fillStyle = mixLab(OS_COLORS.ink, env.mood.ink, 0.3);
    const w = drawTracked(c, ATTR, r.x + r.w, r.y - 7, { font: `500 ${size.toFixed(2)}px ${FONT.sc}`, size, tracking: 0.1, align: 'right' });
    textProbe(c, `${ID}-attr`, r.x + r.w - w, r.y - 7 - size, w, size * 1.2, a);
  });
  c.restore();
}
