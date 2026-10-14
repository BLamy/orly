import type { GalleryModule } from './main';
import type { LayerId, MoodId, PaintEnv } from '../contracts';
import { LAYERS } from '../contracts';
import { makeEnv, mood, withAlpha } from '../silhouette/palette';
import { arcade, colonnade, doorway, framePillar, panelledWall, windowWall } from '../silhouette/architecture/walls';
import { boardFloor, checkerFloor } from '../silhouette/architecture/floors';
import { blackboardWall, bookshelfWall, staircase, tieredSeating } from '../silhouette/architecture/interiors';
import { bedroom2012, bedroomWall, ceilingGrid, cubicles, dataCentreAisle, glassAtrium, labBench, labWall, openOffice } from '../silhouette/architecture/modern';
import { collegeHall, elTrestle, skyline } from '../silhouette/architecture/exterior';
import { forestBand, tree } from '../silhouette/nature/trees';
import { mountains, snowfield } from '../silhouette/nature/terrain';
import { cloudBank, moon, stars } from '../silhouette/nature/sky';
import { drawOrnament, tasselFringe } from '../silhouette/ornament';
import { drawTurning } from '../silhouette/lathe';

// ---------------------------------------------------------------------------
// A tiny stand-in for the core Frame so set galleries can compose real multiplane rooms.
// ---------------------------------------------------------------------------
export interface Stage {
  c: CanvasRenderingContext2D;
  m: MoodId;
  t: number;
  pxScale: number;
}
/** world x/y on a layer for a given screen x/y (camera at home) */
export const wx = (id: LayerId, X: number) => 640 + ((X - 640) * LAYERS[id].z) / 1000;
export const wy = (id: LayerId, Y: number) => 360 + ((Y - 360) * LAYERS[id].z) / 1000;
export const wl = (id: LayerId, L: number) => (L * LAYERS[id].z) / 1000;
/** screen position of a world point on a layer (camera at home) */
export const sx = (id: LayerId, x: number) => 640 + ((x - 640) * 1000) / LAYERS[id].z;
export const sy = (id: LayerId, y: number) => 360 + ((y - 360) * 1000) / LAYERS[id].z;
/** a full-frame world rect for a layer, with overscan */
export const frameRect = (id: LayerId, over = 60) => ({ x: wx(id, -over), y: wy(id, -over), w: wl(id, 1280 + 2 * over), h: wl(id, 720 + 2 * over) });

export function backlight(s: Stage, sunX = 640, intensity = 1) {
  const { c } = s;
  const p = mood(s.m);
  const g = c.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, p.sky[0]);
  g.addColorStop(0.3, p.sky[1]);
  g.addColorStop(0.5, p.sky[2]);
  g.addColorStop(p.horizon, p.sky[3]);
  g.addColorStop(1, p.sky[2]);
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  const r = c.createRadialGradient(sunX, 720 * p.horizon, 0, sunX, 720 * p.horizon, 1280 * 0.55);
  r.addColorStop(0, withAlpha(p.rim, 0.35 * intensity));
  r.addColorStop(1, withAlpha(p.rim, 0));
  c.fillStyle = r;
  c.fillRect(0, 0, 1280, 720);
}

export function layer(s: Stage, id: LayerId, draw: (c: CanvasRenderingContext2D, env: PaintEnv) => void) {
  const { c } = s;
  const spec = LAYERS[id];
  const k = 1000 / spec.z;
  c.save();
  c.translate(640, 360);
  c.scale(k, k);
  c.translate(-640, -360);
  if (spec.blur > 0 && !(typeof location !== 'undefined' && location.search.includes('noblur'))) c.filter = `blur(${(spec.blur * s.pxScale) / 1.5}px)`;
  draw(c, makeEnv({ mood: s.m, layer: spec, t: s.t, pxScale: s.pxScale }));
  c.restore();
}

export function fog(s: Stage, yc: number, h: number, a: number) {
  const { c } = s;
  const p = mood(s.m);
  const g = c.createLinearGradient(0, yc - h / 2, 0, yc + h / 2);
  g.addColorStop(0, withAlpha(p.haze, 0));
  g.addColorStop(0.55, withAlpha(p.haze, a));
  g.addColorStop(1, withAlpha(p.haze, a * 0.4));
  c.fillStyle = g;
  c.fillRect(0, yc - h / 2, 1280, h);
}

/** gallery stand-in for a practical light: soft halo + hot core, additive */
export function glow(s: Stage, x: number, y: number, r: number, k = 1) {
  const { c } = s;
  const p = mood(s.m);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(p.core, 0.55 * k));
  g.addColorStop(0.08, withAlpha(p.halo, 0.35 * k));
  g.addColorStop(0.4, withAlpha(p.halo, 0.1 * k));
  g.addColorStop(1, withAlpha(p.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
}

export function vignette(s: Stage) {
  const { c } = s;
  const g = c.createRadialGradient(640, 380, 300, 640, 380, 900);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
}

// ---------------------------------------------------------------------------
// Rooms. t selects the room: floor(t) -> index.
// ---------------------------------------------------------------------------
type Room = { name: string; m: MoodId; paint(s: Stage): void };

const greatHall: Room = {
  name: 'great hall (duskRose)',
  m: 'duskRose',
  paint(s) {
    backlight(s, 560);
    layer(s, 'L2', (c, env) => {
      const x0 = wx('L2', -40);
      const x1 = wx('L2', 1320);
      const y0 = wy('L2', -20);
      const yb = wy('L2', 560);
      windowWall(c, {
        x: x0, y: y0, w: x1 - x0, h: yb - y0,
        centers: [wx('L2', 150), wx('L2', 490), wx('L2', 830), wx('L2', 1170)],
        winW: wl('L2', 215), apex: wy('L2', 40), sill: wy('L2', 470),
        shape: 'round', lights: 2, panes: { cols: 3, rows: 9 }, transoms: [0.36],
        tracery: 'quatrefoil', spandrel: 'trefoil', cornice: wl('L2', 70), wainscot: wl('L2', 80),
      }, env);
    });
    checkerFloor(s.c, { x0: 0, x1: 1280, yBack: 560, yFront: 720, horizon: 420, vpX: 640, tile: 92, focal: 620, sheen: [{ x: 150, w: 90 }, { x: 490, w: 90 }, { x: 830, w: 90 }] }, makeEnv({ mood: s.m, layer: 'L3' }));
    fog(s, 720 * 0.6, 720 * 0.4, 0.3);
    layer(s, 'L3', (c, env) => {
      // long table with a tassel fringe and candlesticks
      const tx = wx('L3', 330);
      const tw = wl('L3', 640);
      const ty = wy('L3', 520);
      c.fillStyle = env.fill('ink');
      c.fillRect(tx, ty, tw, wl('L3', 14));
      drawOrnament(c, { path: tasselFringe({ w: tw, pitch: 13, len: 30, band: 5 }), x: tx, y: ty + wl('L3', 14), role: 'ink', rule: 'nonzero' }, env);
      c.fillRect(tx + 20, ty, 18, wl('L3', 200));
      c.fillRect(tx + tw - 38, ty, 18, wl('L3', 200));
      drawTurning(c, { kind: 'candlestickTall', x: wx('L3', 470), y: ty, h: 120 }, env);
      drawTurning(c, { kind: 'urn', x: wx('L3', 800), y: ty, h: 60 }, env);
    });
    glow(s, 470, sy('L3', wy('L3', 520) - 120 * 0.93), 120);
    fog(s, 720 * 0.7, 720 * 0.22, 0.12);
    layer(s, 'L6', (c, env) => framePillar(c, { x: wx('L6', 1235), y0: wy('L6', -50), y1: wy('L6', 760), w: wl('L6', 70) }, env));
    vignette(s);
  },
};

const library: Room = {
  name: 'library with stair (candleAmber)',
  m: 'candleAmber',
  paint(s) {
    backlight(s, 640, 0.9);
    layer(s, 'L2', (c, env) => {
      const R = frameRect('L2');
      const yb = wy('L2', 575);
      // a tall round-headed window between two bookcases
      windowWall(c, { x: R.x, y: R.y, w: R.w, h: yb - R.y, centers: [wx('L2', 640)], winW: wl('L2', 230), apex: wy('L2', 70), sill: wy('L2', 470), shape: 'round', lights: 3, panes: { cols: 2, rows: 8 }, transoms: [0.3], tracery: 'roundel', spandrel: 'none', crest: false, pilasters: false, cornice: wl('L2', 60), wainscot: wl('L2', 70) }, env);
      bookshelfWall(c, { x: wx('L2', -40), y: wy('L2', 30), w: wl('L2', 520), h: yb - wy('L2', 30), seed: 4, bays: 3, backTone: 0.34 }, env);
      bookshelfWall(c, { x: wx('L2', 800), y: wy('L2', 30), w: wl('L2', 520), h: yb - wy('L2', 30), seed: 9, bays: 3, backTone: 0.34 }, env);
    });
    boardFloor(s.c, { x0: 0, x1: 1280, yBack: 575, yFront: 720, horizon: 420, vpX: 640, board: 46 }, makeEnv({ mood: s.m, layer: 'L3' }));
    fog(s, 720 * 0.5, 720 * 0.5, 0.16);
    layer(s, 'L4', (c, env) => {
      // a dog-leg stair up to the gallery, rim-lit by the window
      staircase(c, { x: -30, y: 655, steps: 10, rise: 34, run: 44, rail: 92, perTread: 2, role: 'ink' }, env);
      // writing table with candlestick, lamp and a stack of folios
      const ty = 560;
      c.fillStyle = env.fill('ink');
      c.fillRect(790, ty, 270, 11);
      c.fillRect(800, ty + 11, 250, 16);
      for (const lx of [806, 1036]) drawTurning(c, { kind: 'chairLeg', x: lx, y: 655, h: 655 - ty - 26, w: 14 }, env);
      c.fillRect(800, 628, 250, 5);
      drawTurning(c, { kind: 'candlestick', x: 850, y: ty, h: 74 }, env);
      drawTurning(c, { kind: 'lampBase', x: 1000, y: ty, h: 52 }, env);
      c.fillRect(905, ty - 9, 58, 9);
      c.fillRect(912, ty - 16, 46, 7);
      c.fillRect(902, ty - 22, 50, 6);
    });
    glow(s, 850, 560 - 74 * 0.97, 160);
    fog(s, 720 * 0.86, 720 * 0.2, 0.06);
    layer(s, 'L6', (c, env) => framePillar(c, { x: wx('L6', 1260), y0: wy('L6', -50), y1: wy('L6', 780), w: wl('L6', 70) }, env));
    vignette(s);
  },
};

const lab: Room = {
  name: '1950s lab (labGreen)',
  m: 'labGreen',
  paint(s) {
    backlight(s, 640, 0.8);
    layer(s, 'L1', (c, env) => skyline(c, { style: 'chicago1940', x0: wx('L1', -50), x1: wx('L1', 1330), y: wy('L1', 470), height: wl('L1', 200), seed: 3, lit: 0.25 }, env));
    layer(s, 'L2', (c, env) => {
      const R = frameRect('L2');
      labWall(c, { x: R.x, y: wy('L2', 70), w: R.w, h: wy('L2', 575) - wy('L2', 70), windows: [wx('L2', 300), wx('L2', 640), wx('L2', 980)], winW: wl('L2', 240), winTop: wy('L2', 150), winH: wl('L2', 250), blinds: 0.55, tileTop: wy('L2', 440), tubes: [wx('L2', 300), wx('L2', 980)], tubeY: wy('L2', 100) }, env);
    });
    ceilingGrid(s.c, { x0: 0, x1: 1280, yTop: 0, yBack: 70, horizon: 380, vpX: 640, tile: 120 }, makeEnv({ mood: s.m, layer: 'L2' }));
    boardFloor(s.c, { x0: 0, x1: 1280, yBack: 575, yFront: 720, horizon: 380, vpX: 640, board: 70, length: 70 }, makeEnv({ mood: s.m, layer: 'L3' }));
    fog(s, 720 * 0.6, 720 * 0.4, 0.26);
    layer(s, 'L3', (c, env) => {
      labBench(c, { x: wx('L3', 120), y: wy('L3', 640), w: wl('L3', 420), seed: 3 }, env);
      labBench(c, { x: wx('L3', 760), y: wy('L3', 640), w: wl('L3', 420), seed: 8, shelf: false }, env);
    });
    fog(s, 720 * 0.7, 720 * 0.22, 0.12);
    vignette(s);
  },
};

const lecture: Room = {
  name: 'lecture hall (winterBlue)',
  m: 'winterBlue',
  paint(s) {
    backlight(s, 640, 0.8);
    layer(s, 'L2', (c, env) => {
      const R = frameRect('L2');
      blackboardWall(c, { x: R.x, y: R.y, w: R.w, h: wy('L2', 560) - R.y, boards: 3, boardTop: wy('L2', 250), boardH: wl('L2', 220), chalk: 'network', clerestory: 6 }, env);
    });
    boardFloor(s.c, { x0: 0, x1: 1280, yBack: 560, yFront: 720, horizon: 400, vpX: 640, board: 50 }, makeEnv({ mood: s.m, layer: 'L3' }));
    fog(s, 720 * 0.55, 720 * 0.4, 0.22);
    layer(s, 'L3', (c, env) => {
      // lectern
      c.fillStyle = env.fill('ink');
      c.beginPath();
      const lx = wx('L3', 900);
      const ly = wy('L3', 620);
      c.moveTo(lx - 34, ly);
      c.lineTo(lx - 26, ly - 110);
      c.lineTo(lx - 44, ly - 124);
      c.lineTo(lx + 44, ly - 124);
      c.lineTo(lx + 26, ly - 110);
      c.lineTo(lx + 34, ly);
      c.fill();
    });
    layer(s, 'L5', (c, env) => tieredSeating(c, { x0: wx('L5', -80), x1: wx('L5', 1360), y: wy('L5', 640), tiers: 3, tierH: 50 }, env));
    vignette(s);
  },
};

const college: Room = {
  name: 'college hall, summer evening (dawnGold)',
  m: 'dawnGold',
  paint(s) {
    backlight(s, 760, 1);
    layer(s, 'L1', (c, env) => cloudBank(c, { x0: wx('L1', -100), x1: wx('L1', 1400), y: wy('L1', 140), h: wl('L1', 40), count: 5, seed: 7, tone: 0.4 }, env));
    layer(s, 'L2', (c, env) => {
      forestBand(c, { x0: wx('L2', -60), x1: wx('L2', 1340), y: wy('L2', 520), h: wl('L2', 120), kind: 'leafy', density: 1.6, seed: 2, ground: 400 }, env);
      collegeHall(c, { x: wx('L2', 640), y: wy('L2', 540), w: wl('L2', 720), h: wl('L2', 190), lit: 0.35, seed: 4 }, env);
    });
    fog(s, 720 * 0.66, 720 * 0.3, 0.2);
    layer(s, 'L4', (c, env) => {
      c.fillStyle = env.fill('set');
      c.fillRect(-200, 600, 1700, 300);
      tree(c, { x: 150, y: 610, h: 520, kind: 'elm', seed: 11, leaves: 0.8 }, env);
      tree(c, { x: 1150, y: 615, h: 470, kind: 'elm', seed: 4, leaves: 0.75 }, env);
    });
    vignette(s);
  },
};

const datacentre: Room = {
  name: 'data-centre aisle (serverCyan)',
  m: 'serverCyan',
  paint(s) {
    s.c.fillStyle = mood(s.m).fg;
    s.c.fillRect(0, 0, 1280, 720);
    dataCentreAisle(s.c, { x0: 0, x1: 1280, y0: 0, y1: 720, vpX: 700, vpY: 380, racks: 14, seed: 5 }, makeEnv({ mood: s.m, layer: 'L3', t: s.t }));
    fog(s, 720 * 0.55, 720 * 0.5, 0.18);
    vignette(s);
  },
};

const chicago: Room = {
  name: 'Chicago study, 1940s (emberRed)',
  m: 'emberRed',
  paint(s) {
    backlight(s, 640, 1);
    layer(s, 'L1', (c, env) => {
      skyline(c, { style: 'chicago1940', x0: wx('L1', -50), x1: wx('L1', 1330), y: wy('L1', 520), height: wl('L1', 300), seed: 12, lit: 0.4 }, env);
      elTrestle(c, { x0: wx('L1', -50), x1: wx('L1', 1330), y: wy('L1', 560), h: wl('L1', 60), train: { cars: 4, x: wx('L1', 200) + s.t * 60 } }, env);
    });
    layer(s, 'L2', (c, env) => {
      const R = frameRect('L2');
      windowWall(c, { x: R.x, y: R.y, w: R.w, h: wy('L2', 580) - R.y, centers: [wx('L2', 340), wx('L2', 940)], winW: wl('L2', 330), apex: wy('L2', 90), sill: wy('L2', 470), shape: 'flat', lights: 2, mullion: wl('L2', 14), panes: { cols: 2, rows: 3 }, transoms: [0.5], spandrel: 'none', crest: false, pilasters: true, cornice: wl('L2', 50), wainscot: wl('L2', 90) }, env);
      doorway(c, { x: wx('L2', 640), y: wy('L2', 580), w: wl('L2', 120), h: wl('L2', 260), style: 'panelled', open: 0.35 }, env);
    });
    boardFloor(s.c, { x0: 0, x1: 1280, yBack: 580, yFront: 720, horizon: 420, vpX: 640, board: 40 }, makeEnv({ mood: s.m, layer: 'L3' }));
    fog(s, 720 * 0.62, 720 * 0.35, 0.2);
    layer(s, 'L6', (c, env) => framePillar(c, { x: wx('L6', 1250), y0: wy('L6', -50), y1: wy('L6', 780), w: wl('L6', 80) }, env));
    vignette(s);
  },
};

const office80s: Room = {
  name: '1980s office (labGreen)',
  m: 'labGreen',
  paint(s) {
    backlight(s, 640, 0.7);
    layer(s, 'L2', (c, env) => {
      const R = frameRect('L2');
      labWall(c, { x: R.x, y: wy('L2', 120), w: R.w, h: wy('L2', 580) - wy('L2', 120), windows: [wx('L2', 200), wx('L2', 520), wx('L2', 840), wx('L2', 1160)], winW: wl('L2', 250), winTop: wy('L2', 170), winH: wl('L2', 240), blinds: 0.35, tileTop: wy('L2', 600) }, env);
    });
    ceilingGrid(s.c, { x0: 0, x1: 1280, yTop: 0, yBack: 120, horizon: 400, vpX: 640, tile: 110, troffers: 3 }, makeEnv({ mood: s.m, layer: 'L2' }));
    boardFloor(s.c, { x0: 0, x1: 1280, yBack: 580, yFront: 720, horizon: 400, vpX: 640, board: 60, length: 60 }, makeEnv({ mood: s.m, layer: 'L3' }));
    fog(s, 720 * 0.6, 720 * 0.4, 0.22);
    layer(s, 'L4', (c, env) => cubicles(c, { x0: -60, x1: 1340, y: 690, h: 165, count: 4, seed: 2 }, env));
    vignette(s);
  },
};

const bedroom: Room = {
  name: '2012 student bedroom (candleAmber + cyan accent)',
  m: 'candleAmber',
  paint(s) {
    backlight(s, 380, 0.6);
    layer(s, 'L1', (c, env) => {
      skyline(c, { style: 'megacity', x0: wx('L1', 100), x1: wx('L1', 700), y: wy('L1', 470), height: wl('L1', 160), seed: 5, lit: 0.5 }, env);
    });
    layer(s, 'L2', (c, env) => {
      const R = frameRect('L2');
      bedroomWall(c, { x: R.x, y: R.y, w: R.w, h: wy('L2', 590) - R.y, window: { x: wx('L2', 230), y: wy('L2', 150), w: wl('L2', 280), h: wl('L2', 260) }, poster: { x: wx('L2', 860), y: wy('L2', 160), w: wl('L2', 120), h: wl('L2', 170) } }, env);
    });
    boardFloor(s.c, { x0: 0, x1: 1280, yBack: 590, yFront: 720, horizon: 420, vpX: 640, board: 44 }, makeEnv({ mood: s.m, layer: 'L3' }));
    fog(s, 720 * 0.65, 720 * 0.3, 0.1);
    layer(s, 'L4', (c, env) => bedroom2012(c, { x: 40, y: 668, w: 1200, seed: 3 }, makeEnv({ mood: { ...env.mood, core: '#92edea', halo: '#36a0a3' }, layer: env.layer, t: s.t })));
    vignette(s);
  },
};

const atrium: Room = {
  name: 'glass atrium (duskRose)',
  m: 'duskRose',
  paint(s) {
    backlight(s, 640, 1);
    layer(s, 'L1', (c, env) => skyline(c, { style: 'bayArea', x0: wx('L1', -50), x1: wx('L1', 1330), y: wy('L1', 560), height: wl('L1', 240), seed: 8, lit: 0.3 }, env));
    layer(s, 'L2', (c, env) => {
      const R = frameRect('L2');
      glassAtrium(c, { x: R.x, y: R.y, w: R.w, h: wy('L2', 600) - R.y, floors: 2, seed: 2 }, env);
    });
    checkerFloor(s.c, { x0: 0, x1: 1280, yBack: 600, yFront: 720, horizon: 420, vpX: 640, tile: 120, focal: 700, contrast: 0.25 }, makeEnv({ mood: s.m, layer: 'L3' }));
    fog(s, 720 * 0.62, 720 * 0.35, 0.18);
    layer(s, 'L3', (c, env) => openOffice(c, { x0: wx('L3', 0), x1: wx('L3', 1280), y: wy('L3', 660), count: 3, seed: 4 }, env));
    vignette(s);
  },
};

const cities: Room = {
  name: 'skylines: megacity (far) and Chicago 1940 (near), night (emberRed)',
  m: 'emberRed',
  paint(s) {
    backlight(s, 640, 1);
    layer(s, 'L1', (c, env) => {
      stars(c, { x: wx('L1', 0), y: wy('L1', 0), w: wl('L1', 1280), h: wl('L1', 260), count: 120, seed: 9 }, env);
      moon(c, { x: wx('L1', 260), y: wy('L1', 120), r: 90, phase: 0.2 }, env);
      skyline(c, { style: 'megacity', x0: wx('L1', -50), x1: wx('L1', 1330), y: wy('L1', 470), height: wl('L1', 320), seed: 2, lit: 0.45 }, env);
    });
    fog(s, 720 * 0.62, 720 * 0.3, 0.25);
    layer(s, 'L3', (c, env) => skyline(c, { style: 'chicago1940', x0: wx('L3', -50), x1: wx('L3', 1330), y: wy('L3', 660), height: wl('L3', 300), seed: 21, lit: 0.3 }, env));
    vignette(s);
  },
};

const cloister: Room = {
  name: 'cloister arcade in snow (winterBlue)',
  m: 'winterBlue',
  paint(s) {
    backlight(s, 640, 0.9);
    layer(s, 'L1', (c, env) => {
      mountains(c, { x0: wx('L1', -50), x1: wx('L1', 1330), y: wy('L1', 520), amp: wl('L1', 160), ranges: 3, seed: 5, mist: 0.6, snowCaps: 0.8 }, env);
    });
    layer(s, 'L2', (c, env) => {
      snowfield(c, { x0: wx('L2', -60), x1: wx('L2', 1340), y: wy('L2', 520), depth: wl('L2', 300), seed: 3, drifts: 4 }, env);
      forestBand(c, { x0: wx('L2', -60), x1: wx('L2', 1340), y: wy('L2', 525), h: wl('L2', 80), kind: 'bare', density: 2.5, seed: 6, snow: 0.6, ground: 6 }, env);
    });
    fog(s, 720 * 0.6, 720 * 0.3, 0.2);
    layer(s, 'L3', (c, env) => {
      const R = frameRect('L3');
      arcade(c, { x: R.x, y: R.y, w: R.w, h: wy('L3', 640) - R.y, bays: 5, spring: wy('L3', 300), shape: 'pointed', rise: wl('L3', 150), pier: 0.2, floor: wy('L3', 600) }, env);
      colonnade(c, { x0: wx('L3', 120), x1: wx('L3', 1160), y: wy('L3', 600), h: wl('L3', 240), count: 6, order: 'gothic', entablature: 0 }, env);
    });
    layer(s, 'L5', (c, env) => {
      c.fillStyle = env.fill('fg');
      c.fillRect(wx('L5', -100), wy('L5', 640), wl('L5', 1500), wl('L5', 200));
    });
    vignette(s);
  },
};

const ROOMS: Room[] = [greatHall, library, lab, lecture, college, datacentre, chicago, office80s, bedroom, atrium, cities, cloister];

const g: GalleryModule = {
  title: 'composed sets, one per mood',
  duration: ROOMS.length,
  fonts: ['600 16px Georgia'],
  paint(c, env) {
    const i = Math.min(ROOMS.length - 1, Math.floor(env.t + 1e-6));
    const room = ROOMS[i];
    const s: Stage = { c, m: room.m, t: env.t, pxScale: env.pxScale };
    room.paint(s);
    let label = room.name;
    // ?perf=1: time warm repaints of this room (diagnostic only; painters themselves stay clock-free)
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('perf')) {
      const n = 8;
      c.getImageData(0, 0, 1, 1);
      const t0 = performance.now();
      for (let k = 0; k < n; k++) room.paint(s);
      c.getImageData(0, 0, 1, 1);
      label += `  |  ${((performance.now() - t0) / n).toFixed(1)} ms/frame`;
    }
    c.fillStyle = 'rgba(255,240,220,0.75)';
    c.font = '600 16px Georgia';
    c.fillText(label, 18, 704);
  },
};
export default g;
