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
 * L5 pew backs: a row of near-black pew ends and backs whose tops sit ~9% above the frame's bottom edge for the
 * CURRENT camera (vertically pinned to the frame so the bottom 10% always carries the dark anchor; horizontal
 * parallax is true L5 parallax). a = 0..1 rises the row in (from below).
 */
export function pewBacks(f: Frame, id: string, cams: Camera3[], a: number): void {
  if (a <= 0.01) return;
  const cam = f.cam;
  f.layer('L5', (c, env) => {
    const bottom = toLayer(LAYERS.L5, cam, 640, 720).y;
    const top = toLayer(LAYERS.L5, cam, 640, 720 - 66 * a).y;
    const r = overscan(LAYERS.L5, cams, 80);
    const W = Math.ceil(r.w);
    const H = 140;
    const draw = f.cached(`${id}/pews/${env.mood.id}/${Math.round(r.x)}/${W}`, W, H, (cc) => {
      const fg = env.fill('fg');
      cc.fillStyle = fg;
      // the continuous pew back (a low rail), with a moulded top edge
      cc.fillRect(0, 22, W, H - 22);
      // pew ends every ~230 px: a tall rounded end with a finial
      for (let x = -40, k = 0; x < W + 240; x += 230 + 30 * hash1(k, 31), k++) {
        const w = 34;
        cc.beginPath();
        cc.moveTo(x - w / 2, H);
        cc.lineTo(x - w / 2, 16);
        cc.quadraticCurveTo(x - w / 2, 0, x, 0);
        cc.quadraticCurveTo(x + w / 2, 0, x + w / 2, 16);
        cc.lineTo(x + w / 2, H);
        cc.closePath();
        cc.fill();
        cc.beginPath();
        cc.arc(x, -6, 6, 0, Math.PI * 2);
        cc.fill();
      }
      // a faint rim on the top edge, from the windows
      cc.fillStyle = withAlpha(env.mood.rim, 0.18);
      cc.fillRect(0, 22, W, 1.2);
    });
    // the rail top (art y 22) lands on `top`; the art runs well past the frame's bottom edge
    void bottom;
    draw(c, r.x, top - 22);
  });
}
