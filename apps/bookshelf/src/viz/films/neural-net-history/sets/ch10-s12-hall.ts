/**
 * ch10-s12 — the hall of word-slips with a darker stone (one value step below the shared hallBackdrop), and the
 * hall's near foreground: a row of pew backs (L5, near-black) that anchors the value range of the "wall of light".
 *
 *   hallBackdropDark(f, id, cams, o)  same hall as sets/ch10-s06-kit hallBackdrop (L2 wall, fog A, L3 beam + slips,
 *                                     fog B) but the wall's stone/mullions are darkened ON THEIR OWN PIXELS
 *                                     (source-atop), so the glass stays bright and the tracery reads one step darker.
 *   pewBacks(f, id, cams, a)          L5 foreground: pew backs with finials along the bottom ~10% of frame.
 */
import type { Camera3, Frame } from '../../../film';
import { LAYERS, mixLab, overscan, toLayer, withAlpha, windowWall } from '../../../film';
import { hash1 } from '../../../film/silhouette/atmosphere';

export interface DarkHallOpts {
  /** darkening of the wall's own (stone) pixels, 0..1 */
  stone?: number;
  /** extra darkening over everything (behind a bright plate) */
  dim?: number;
  beamY?: number;
}

export function hallBackdropDark(f: Frame, id: string, cams: Camera3[], o: DarkHallOpts = {}): void {
  const beamY = o.beamY ?? 70;
  const stone = o.stone ?? 0.35;
  const dim = o.dim ?? 0;
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, cams, 60);
    const x0 = Math.floor(r.x / 300) * 300 - 150;
    const centers: number[] = [];
    for (let x = x0; x < r.x + r.w + 300; x += 300) centers.push(x);
    f.cached(`${id}/hallDark/L2/${env.mood.id}/${Math.round(r.x)}/${Math.round(r.w)}/${stone}/${dim}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      windowWall(
        cc,
        {
          x: r.x,
          y: r.y,
          w: r.w,
          h: r.h,
          centers,
          winW: 150,
          apex: -40,
          sill: 520,
          shape: 'pointed',
          lights: 2,
          panes: { cols: 2, rows: 11 },
          transoms: [0.42],
          tracery: 'trefoil',
          spandrel: 'trefoil',
          cornice: 0,
          wainscot: 120,
          shade: 0.5,
          seed: 1017,
        },
        env,
      );
      // the stone and the mullions one value step darker; the glass holes stay open
      cc.save();
      cc.globalCompositeOperation = 'source-atop';
      cc.fillStyle = withAlpha(env.mood.fg, stone);
      cc.fillRect(r.x, r.y, r.w, r.h);
      cc.restore();
      if (dim > 0) {
        cc.fillStyle = withAlpha(env.mood.fg, dim);
        cc.fillRect(r.x, r.y, r.w, r.h);
      }
    })(c, r.x, r.y);
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, cams, 60);
    f.cached(`${id}/hallDark/L3/${env.mood.id}/${Math.round(r.x)}/${Math.round(r.w)}/${beamY}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const set = env.fill('set');
      const fl = cc.createLinearGradient(0, 600, 0, r.y + r.h);
      fl.addColorStop(0, mixLab(set, env.mood.haze, 0.25));
      fl.addColorStop(1, mixLab(set, env.mood.fg, 0.5));
      cc.fillStyle = fl;
      cc.fillRect(r.x, 600, r.w, r.y + r.h - 600);
      cc.fillStyle = set;
      cc.fillRect(r.x, beamY - 9, r.w, 18);
      for (let x = Math.floor(r.x / 300) * 300; x < r.x + r.w; x += 300) {
        cc.beginPath();
        cc.moveTo(x - 16, beamY + 9);
        cc.lineTo(x + 16, beamY + 9);
        cc.lineTo(x + 6, beamY + 40);
        cc.lineTo(x - 6, beamY + 40);
        cc.closePath();
        cc.fill();
      }
      cc.strokeStyle = withAlpha(env.mood.rim, 0.25);
      cc.lineWidth = 1;
      cc.beginPath();
      cc.moveTo(r.x, beamY - 9.5);
      cc.lineTo(r.x + r.w, beamY - 9.5);
      cc.stroke();
      for (let x = Math.floor(r.x / 64) * 64, k = 0; x < r.x + r.w; x += 64, k++) {
        const h = 46 + 18 * hash1(k, 77);
        const len = 30 + 26 * hash1(k, 78);
        const w = 26 + 14 * hash1(k, 79);
        cc.strokeStyle = set;
        cc.lineWidth = 1.2;
        cc.beginPath();
        cc.moveTo(x, beamY + 9);
        cc.lineTo(x, beamY + 9 + len);
        cc.stroke();
        cc.fillStyle = mixLab(set, env.mood.haze, 0.2);
        const y = beamY + 9 + len;
        cc.beginPath();
        cc.moveTo(x - w / 2, y);
        cc.lineTo(x + w / 2, y);
        cc.lineTo(x + w / 2, y + h - 3);
        cc.lineTo(x, y + h);
        cc.lineTo(x - w / 2, y + h - 2);
        cc.closePath();
        cc.fill();
      }
    })(c, r.x, r.y);
  });
  f.fog('B');
}

/**
 * L5 pew backs (reviser r1: real carved pews, a true near plane): near-black pew backs whose capping rail sits ~96 px
 * (720p; ~144 px at 1080p) above the frame's bottom edge for the CURRENT camera (vertically pinned so the bottom of
 * frame always carries the dark anchor; horizontal parallax is true L5 parallax). Each bay of the back is a sunk
 * panel PIERCED with a quatrefoil (the hall glows through the holes); pew ends rise above the rail every ~240 px,
 * each with a carved poppyhead finial. a = 0..1 rises the row in (from below).
 */
export function pewBacks(f: Frame, id: string, cams: Camera3[], a: number): void {
  if (a <= 0.01) return;
  const cam = f.cam;
  const RISE = 96;
  f.layer('L5', (c, env) => {
    const top = toLayer(LAYERS.L5, cam, 640, 720 - RISE * a).y;
    const r = overscan(LAYERS.L5, cams, 80);
    const W = Math.ceil(r.w);
    const H = 230;
    const RAIL = 40; // the capping rail's top, in art px (the pew ends and finials stand above it)
    const draw = f.cached(`${id}/pews2/${env.mood.id}/${Math.round(r.x)}/${W}`, W, H, (cc) => {
      const fg = env.fill('fg');
      const rimC = env.mood.rim;
      cc.fillStyle = fg;
      // the back: one slab from the rail down, each bay pierced with a quatrefoil (cut out, so the hall shows through)
      cc.fillRect(0, RAIL + 10, W, H - RAIL - 10);
      cc.save();
      cc.globalCompositeOperation = 'destination-out';
      for (let x = 14; x + 60 < W; x += 60) {
        const cx = x + 30, cy = RAIL + 50;
        const lr = 9.5, off = 8.5;
        for (const [dx, dy] of [[0, -off], [off, 0], [0, off], [-off, 0]]) {
          cc.beginPath();
          cc.arc(cx + dx, cy + dy, lr, 0, Math.PI * 2);
          cc.fill();
        }
      }
      cc.restore();
      // the quatrefoils' solid centres (the carving's boss) and the bays' framing stiles
      for (let x = 14; x + 60 < W; x += 60) {
        const cx = x + 30, cy = RAIL + 50;
        cc.beginPath();
        cc.arc(cx, cy, 4.2, 0, Math.PI * 2);
        cc.fill();
        cc.fillRect(x - 3, RAIL + 10, 6, H);
      }
      // the capping rail: a moulded top (a bead over a cavetto) a little wider than the back
      cc.beginPath();
      cc.moveTo(0, RAIL + 14);
      cc.lineTo(0, RAIL + 4);
      cc.quadraticCurveTo(0, RAIL, 6, RAIL);
      cc.lineTo(W, RAIL);
      cc.lineTo(W, RAIL + 14);
      cc.closePath();
      cc.fill();
      // pew ends every ~240 px: a tall end with a shaped shoulder and a carved poppyhead (three-lobed) finial
      const ends: number[] = [];
      for (let x = 30, k = 0; x < W + 240; x += 232 + 26 * hash1(k, 31), k++) ends.push(x);
      for (const x of ends) {
        const w = 40;
        cc.beginPath();
        cc.moveTo(x - w / 2, H);
        cc.lineTo(x - w / 2, 30);
        cc.quadraticCurveTo(x - w / 2, 18, x - w / 2 + 8, 16);
        cc.lineTo(x + w / 2 - 8, 16);
        cc.quadraticCurveTo(x + w / 2, 18, x + w / 2, 30);
        cc.lineTo(x + w / 2, H);
        cc.closePath();
        cc.fill();
        // neck + poppyhead: a central bud and two curled side leaves
        cc.fillRect(x - 4, 6, 8, 12);
        cc.beginPath();
        cc.ellipse(x, -4, 6.5, 11, 0, 0, Math.PI * 2);
        cc.fill();
        for (const s of [-1, 1]) {
          cc.beginPath();
          cc.moveTo(x, 10);
          cc.quadraticCurveTo(x + s * 15, 10, x + s * 15, -3);
          cc.quadraticCurveTo(x + s * 15, -10, x + s * 9, -8);
          cc.quadraticCurveTo(x + s * 11, 1, x + s * 3, 4);
          cc.closePath();
          cc.fill();
        }
        // a pierced trefoil in the end's face
        cc.save();
        cc.globalCompositeOperation = 'destination-out';
        for (const [dx, dy] of [[0, -5], [-5, 3], [5, 3]]) {
          cc.beginPath();
          cc.arc(x + dx, 52 + dy, 4.6, 0, Math.PI * 2);
          cc.fill();
        }
        cc.restore();
      }
      // a faint rim on the top edges, from the windows
      cc.fillStyle = withAlpha(rimC, 0.22);
      cc.fillRect(6, RAIL, W, 1.3);
      for (const x of ends) cc.fillRect(x - 12, 16, 24, 1.1);
    });
    // the rail top (art y RAIL) lands on `top`; the art runs well past the frame's bottom edge
    draw(c, r.x, top - RAIL);
  });
}
