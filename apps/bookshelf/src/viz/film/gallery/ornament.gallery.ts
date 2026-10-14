import type { GalleryModule } from './main';
import { makeEnv, withAlpha } from '../silhouette/palette';
import {
  acanthus, balustrade, crenellation, dentils, drawOrnament, eggAndDart, finial, foil, ornateFrame,
  palmette, pinnacle, rosette, roundel, scallopEdge, scroll, tasselFringe, volute,
} from '../silhouette/ornament';
import { drawTurning, type TurningKind } from '../silhouette/lathe';

// Ornament + lathe catalogue: every builder as an ink silhouette against a dusk backlight.
const g: GalleryModule = {
  title: 'ornament & lathe',
  duration: 1,
  fonts: ['600 13px Georgia'],
  paint(c) {
    const env = makeEnv({ mood: 'duskRose', layer: 'L4' });
    const m = env.mood;
    const sky = c.createLinearGradient(0, 0, 0, 720);
    sky.addColorStop(0, m.sky[0]);
    sky.addColorStop(0.3, m.sky[1]);
    sky.addColorStop(0.5, m.sky[2]);
    sky.addColorStop(0.6, m.sky[3]);
    sky.addColorStop(1, m.sky[2]);
    c.fillStyle = sky;
    c.fillRect(0, 0, 1280, 720);
    const label = (s: string, x: number, y: number) => {
      c.fillStyle = withAlpha(m.ink, 0.75);
      c.font = '600 13px Georgia';
      c.textAlign = 'center';
      c.fillText(s, x, y);
    };
    const D = (path: Path2D, x: number, y: number, rule: CanvasFillRule = 'evenodd') => drawOrnament(c, { path, x, y, role: 'ink', rule }, env);
    // row 1: tracery
    D(foil(40, 3), 80, 90); label('trefoil', 80, 160);
    D(foil(40, 4, -Math.PI / 4), 190, 90); label('quatrefoil', 190, 160);
    D(foil(40, 6), 300, 90); label('sexfoil', 300, 160);
    D(roundel(42, 4), 410, 90); label('roundel', 410, 160);
    D(roundel(42, 3), 520, 90); label('roundel 3', 520, 160);
    D(rosette(42, 8), 630, 90); label('rosette', 630, 160);
    D(rosette(42, 5), 740, 90); label('rosette 5', 740, 160);
    D(volute(38, {}), 850, 90); label('volute', 850, 160);
    D(volute(38, { dir: -1, turns: 2.8 }), 960, 90); label('volute 2.8', 960, 160);
    D(pinnacle({ h: 120 }), 1060, 145); label('pinnacle', 1060, 160);
    D(finial('flameUrn', 110), 1140, 145, 'nonzero'); label('flameUrn', 1140, 160);
    D(finial('acorn', 80), 1220, 145, 'nonzero'); label('acorn', 1220, 160);
    // row 2: scrolls, leaves
    D(scroll({ w: 140, h: 40, kind: 'C', thick: 9 }), 30, 280, 'nonzero'); label('C-scroll', 100, 300);
    D(scroll({ w: 140, h: 40, kind: 'S', thick: 9 }), 200, 280, 'nonzero'); label('S-scroll', 270, 300);
    D(acanthus({ len: 110, curl: 1.4 }), 400, 290); label('acanthus', 400, 305);
    D(acanthus({ len: 110, curl: -0.6, lobes: 5 }), 480, 290); label('acanthus', 480, 305);
    D(palmette({ r: 70, leaves: 9 }), 600, 285); label('palmette', 600, 305);
    D(ornateFrame({ w: 130, h: 90 }), 700, 200, 'nonzero'); label('ornate frame', 765, 330);
    D(eggAndDart({ w: 260, h: 22 }), 880, 200); label('egg and dart', 1010, 240);
    D(dentils({ w: 260, h: 14 }), 880, 250); label('dentils', 1010, 280);
    D(crenellation({ w: 260, h: 26, slits: true }), 880, 320); label('crenellation', 1010, 340);
    // row 3: fringes, balustrade
    D(scallopEdge({ w: 300, h: 5, pitch: 18 }), 30, 380); label('scallop lace', 180, 430);
    D(tasselFringe({ w: 300, pitch: 14, len: 30 }), 30, 450, 'nonzero'); label('tassel fringe', 180, 500);
    D(balustrade({ w: 360, h: 90 }), 380, 500, 'nonzero'); label('balustrade', 560, 520);
    D(balustrade({ w: 300, h: 70, slim: true, posts: false }), 780, 500, 'nonzero'); label('slim', 930, 520);
    // row 4: turnings
    const kinds: TurningKind[] = ['baluster', 'balusterSlim', 'candlestick', 'candlestickTall', 'vase', 'urn', 'chairLeg', 'column', 'lampBase', 'finial', 'finialAcorn', 'bedpost', 'newel', 'goblet', 'flask', 'beaker', 'bottle'];
    kinds.forEach((k, i) => {
      const x = 50 + i * 72;
      const h = k === 'column' || k === 'bedpost' || k === 'candlestickTall' ? 150 : k === 'flask' || k === 'beaker' || k === 'goblet' || k === 'bottle' ? 70 : 115;
      drawTurning(c, { kind: k, x, y: 690, h }, env);
      label(k.replace(/([a-z])([A-Z])/, '$1 $2').toLowerCase().replace('candlestick ', 'cstick '), x, 710);
    });
  },
};
export default g;
