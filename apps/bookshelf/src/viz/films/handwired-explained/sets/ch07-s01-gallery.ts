/**
 * handwired-explained — ch07's tag-line variant BY THE GALLERY (staging.tagLine.variants.ch07; owned by the
 * ch07-s01..s05 author, shared by ch07-s01 and ch07-s05, and free for ch07-s11).
 *
 * "line across the learned gallery's stage, the valves' dark shapes below": the workshop's tall paned window wall at
 * dawn (L2); in front of it (L3) the learned gallery's paper stage, a puppet booth with a 5:4 opening whose paper
 * backdrop is lit from behind, on two trestles; under its apron a shelf of small dark ReGLU valve silhouettes (Deep
 * Dive III's machine, many of them, none lit); the bench edge the Lifespan Rule lies along. The copper line (L4,
 * drawn by sets/tagLine) crosses in front of the stage opening; the stage's RIGHT proscenium post stands just right of
 * tag 10's slot, where the red pencil comes to rest in ch07-s05 (GALLERY.post).
 *
 *   galleryBack(f, { key, lamp? })    backlight · L2 · fog A · L3 stage, valves, bench · fog B · the stage's practical
 *   then tagLineScene(f, { variant: 'none', ... }) for the line, rule, tags, hands.
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { windowWall } from '../../../film/silhouette/architecture';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';

type C = CanvasRenderingContext2D;

/** stage geometry (L3 rest px) */
export const GALLERY = {
  x0: 570,
  x1: 1030,
  postW: 26,
  top: 140,
  floor: 466,
  bench: 594,
  /** where the red pencil rests: on the right proscenium post's ledge (L4 rest px, just in front of it) */
  post: { x: 1017, y: 455 },
} as const;

export function galleryBack(f: Frame, o: { key: string; lamp?: number; sunX?: number; pad?: number }) {
  const pad = o.pad ?? 320;
  f.backlight({ sunX: o.sunX ?? 760, intensity: 1 });
  f.layer('L2', (c, env) => {
    f.cached(`ch07gal/L2/${env.mood.id}/${pad}`, 1280 + 2 * pad, 760 + pad, (cc) => {
      cc.translate(pad, pad / 2);
      windowWall(cc, {
        x: -pad, y: -60, w: 1280 + 2 * pad, h: 760, centers: [-150, 210, 600, 990, 1380], winW: 220, apex: 40, sill: 560,
        shape: 'flat', lights: 3, panes: { cols: 1, rows: 7 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true,
        cornice: 60, wainscot: 0, glass: 0.6, seed: 71,
      }, env);
    })(c, -pad, -pad / 2);
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    f.cached(`ch07gal/L3/${env.mood.id}/${pad}`, 1280 + 2 * pad, 640, (cc) => {
      cc.translate(pad, -100);
      stage(cc, env, pad);
    })(c, -pad, 100);
  });
  f.fog('B');
  // the stage's backdrop is lit from behind: a soft practical glow inside the opening (behind the action plane)
  f.practical({ x: 800, y: 300, kind: 'lamp', seed: 91, intensity: (o.lamp ?? 0.7) * 0.16, radius: 90, layer: 'L3' });
}

/**
 * ch07-s02's valve as a small flat silhouette standing on y = base (left end at x; s = its scale against the plate's
 * rest geometry): inlet pipe, trough with the collar, the sluice gate standing above the trough, the hinge-shaped cam
 * and rod under it, three dials on their stalks, the tray at the outlet.
 */
function valveSil(c: C, x: number, base: number, s: number, col: string) {
  c.save();
  c.translate(x, base);
  c.scale(s, s);
  c.translate(-168, -560);
  c.fillStyle = col;
  c.beginPath();
  // feet and base board
  c.rect(160, 548, 920, 12);
  // inlet pipe and trough walls
  c.rect(168, 296, 70, 22);
  c.rect(236, 248, 754, 18);
  c.rect(236, 312, 754, 22);
  c.rect(236, 248, 12, 86);
  c.rect(978, 248, 12, 86);
  // the collar
  c.rect(282, 232, 30, 116);
  // the gate: a tall paper sluice above the trough, its frame posts
  c.rect(626, 150, 28, 186);
  c.rect(610, 140, 60, 14);
  c.rect(674, 170, 8, 300);
  // rod down to the cam, the cam (flat, then a 45° climb)
  c.rect(636, 334, 8, 100);
  c.moveTo(520, 452);
  c.lineTo(640, 452);
  c.lineTo(700, 392);
  c.lineTo(740, 392);
  c.lineTo(740, 470);
  c.lineTo(520, 470);
  c.closePath();
  // the tray
  c.rect(1012, 340, 8, 104);
  c.rect(1072, 340, 8, 104);
  c.rect(1012, 436, 68, 10);
  c.rect(1040, 446, 12, 104);
  // three dials on stalks
  for (const dx of [296, 528, 752]) {
    c.moveTo(dx + 28, 510);
    c.arc(dx, 510, 28, 0, Math.PI * 2);
    c.rect(dx - 4, 536, 8, 16);
  }
  c.fill();
  c.restore();
}

function stage(c: C, env: PaintEnv, pad: number) {
  const G = GALLERY;
  const ink = env.fill('set');
  const dark = mixLab(ink, PUPPET_NEAR_BLACK, 0.35);
  // the paper backdrop inside the opening, lit from behind (translucent: warm at the centre)
  const ox0 = G.x0 + G.postW, ox1 = G.x1 - G.postW;
  const g = c.createRadialGradient((ox0 + ox1) / 2, 300, 20, (ox0 + ox1) / 2, 300, 300);
  // (review r1: the backdrop was the brightest, largest shape in frame and pulled the eye off the subject: dimmed ~28 %)
  const dim = (col: string) => mixLab(col, mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.3), 0.3);
  g.addColorStop(0, dim(mixLab(mixLab('#e4cc9a', env.mood.halo, 0.4), env.mood.sky[2], 0.35)));
  g.addColorStop(0.6, dim(mixLab(mixLab('#bfa071', env.mood.halo, 0.3), env.mood.sky[1], 0.45)));
  g.addColorStop(1, dim(mixLab(mixLab('#8a7050', env.mood.set, 0.5), env.mood.sky[1], 0.3)));
  c.fillStyle = g;
  c.fillRect(ox0, G.top, ox1 - ox0, G.floor - G.top);
  // the paper's fibres and a faint seam
  c.strokeStyle = withAlpha(env.mood.set, 0.12);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo((ox0 + ox1) / 2 + 40, G.top);
  c.lineTo((ox0 + ox1) / 2 + 36, G.floor);
  c.stroke();
  // the valves' dark shapes on the stage itself, backlit by the paper (ch07-s02's ReGLU valve in miniature, hazed
  // about 40 % toward the backdrop): what the copper line crosses in front of
  const vInk = mixLab(dark, mixLab(env.mood.sky[1], env.mood.halo, 0.3), 0.3);
  const vBack = mixLab(dark, mixLab(env.mood.sky[1], env.mood.halo, 0.3), 0.42);
  for (const [vx, s, col] of [[604, 0.1, vBack], [690, 0.118, vInk], [802, 0.112, vInk], [906, 0.1, vBack]] as const) {
    valveSil(c, vx, G.floor, s, col);
  }
  // the proscenium: two posts, a valance with a scalloped fringe, the apron
  c.fillStyle = ink;
  c.beginPath();
  c.rect(G.x0, G.top - 24, G.postW, G.bench - G.top + 24);
  c.rect(G.x1 - G.postW, G.top - 24, G.postW, G.bench - G.top + 24);
  c.rect(G.x0 - 14, G.top - 44, G.x1 - G.x0 + 28, 26);
  // finials
  c.ellipse(G.x0 + G.postW / 2, G.top - 54, 12, 12, 0, 0, Math.PI * 2);
  c.ellipse(G.x1 - G.postW / 2, G.top - 54, 12, 12, 0, 0, Math.PI * 2);
  c.fill();
  // the valance: scallops cut from its lower edge (pierced: the backdrop shows between them)
  c.beginPath();
  const vx0 = ox0, vx1 = ox1, vy = G.top - 18;
  c.moveTo(vx0, vy);
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = vx0 + ((vx1 - vx0) * i) / n, b = vx0 + ((vx1 - vx0) * (i + 1)) / n;
    c.lineTo(a, vy + 26);
    c.quadraticCurveTo((a + b) / 2, vy + 46, b, vy + 26);
  }
  c.lineTo(vx1, vy);
  c.closePath();
  c.fill();
  // tassels under the scallop points
  for (let i = 0; i <= n; i++) {
    const x = vx0 + ((vx1 - vx0) * i) / n;
    c.fillRect(x - 1, vy + 26, 2, 12);
    c.beginPath();
    c.ellipse(x, vy + 41, 3, 4, 0, 0, Math.PI * 2);
    c.fill();
  }
  // the apron (stage floor edge) and its board
  c.fillRect(G.x0 - 18, G.floor, G.x1 - G.x0 + 36, 16);
  c.fillStyle = dark;
  c.fillRect(G.x0 - 6, G.floor + 16, G.x1 - G.x0 + 12, 10);
  // two trestles (A-legs) under the apron
  c.fillStyle = ink;
  for (const tx of [G.x0 + 70, G.x1 - 70]) {
    c.beginPath();
    c.moveTo(tx - 6, G.floor + 20);
    c.lineTo(tx + 6, G.floor + 20);
    c.lineTo(tx + 40, G.bench);
    c.lineTo(tx + 30, G.bench);
    c.lineTo(tx, G.floor + 46);
    c.lineTo(tx - 30, G.bench);
    c.lineTo(tx - 40, G.bench);
    c.closePath();
    c.fill();
    c.fillRect(tx - 32, G.bench - 40, 64, 5);
  }
  // the valves' dark shapes on a shelf between the trestles: small troughs with gate posts, unlit
  c.fillRect(G.x0 + 90, 556, G.x1 - G.x0 - 180, 6);
  for (let i = 0; i < 5; i++) {
    const vx = G.x0 + 128 + i * ((G.x1 - G.x0 - 256) / 4);
    c.fillStyle = dark;
    c.fillRect(vx - 26, 536, 52, 20);
    c.fillRect(vx - 3, 514, 6, 42);
    c.fillRect(vx - 8, 512, 16, 4);
    c.beginPath();
    c.arc(vx + 18, 548, 6, 0, Math.PI * 2);
    c.fill();
  }
  // rim on the proscenium's top edges only
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(G.x0 - 14, G.top - 44);
  c.lineTo(G.x1 + 14, G.top - 44);
  c.moveTo(G.x0 - 18, G.floor);
  c.lineTo(G.x1 + 18, G.floor);
  c.stroke();
  // the bench the rule lies along (edge-on, across the frame)
  c.fillStyle = ink;
  c.fillRect(-pad, G.bench, 1280 + 2 * pad, 12);
  c.fillStyle = mixLab(ink, env.mood.fg, 0.4);
  c.fillRect(-pad, G.bench + 12, 1280 + 2 * pad, 200);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-pad, G.bench);
  c.lineTo(1280 + pad, G.bench);
  c.stroke();
}
