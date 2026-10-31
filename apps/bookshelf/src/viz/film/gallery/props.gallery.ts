import type { GalleryModule } from './main';
import type { MoodId, PaintEnv } from '../contracts';
import { backdrop, stageEnv } from './_propstage';
import * as P from '../silhouette/props';

// Props line-ups on backlit shelves, several moods.
//   /film-gallery.html?g=props&p=<lights|furniture|study|symbolic>&t=2
// ?t= drives flames, reels, page turns, papers, clocks.
type Row = (c: CanvasRenderingContext2D, env: PaintEnv, floor: number, t: number) => void;

function rows(c: CanvasRenderingContext2D, t: number, list: Array<[MoodId, string, Row]>) {
  const h = 720 / list.length;
  list.forEach(([m, label, row], i) => {
    const y0 = i * h;
    const floor = y0 + h - 22;
    backdrop(c, m, y0, y0 + h, { floorY: floor, label: `${label} · ${m}` });
    row(c, stageEnv(m, t, 'L4', 3 + i), floor, t);
  });
}

const PAGES: Record<string, (c: CanvasRenderingContext2D, t: number) => void> = {
  // the reference frame's table, rebuilt from kit props: chairs on L3 behind a haze band, table + candle on L4
  scene: (c, t) => {
    const m = 'duskRose' as const;
    backdrop(c, m, 0, 720, { floorY: 640, bays: 3 });
    const e3 = stageEnv(m, t, 'L3', 2);
    const e4 = stageEnv(m, t, 'L4', 2);
    const floor = 640;
    P.chair(c, { x: 380, y: floor - 30, s: 1.25, style: 'carved', view: 'front' }, e3);
    P.chair(c, { x: 900, y: floor - 30, s: 1.25, style: 'carved', view: 'front' }, e3);
    // haze sheet between the chairs and the table
    const g = c.createLinearGradient(0, 380, 0, 640);
    g.addColorStop(0, 'rgba(119,100,87,0)');
    g.addColorStop(0.5, 'rgba(119,100,87,0.38)');
    g.addColorStop(1, 'rgba(119,100,87,0.1)');
    c.fillStyle = g;
    c.fillRect(0, 380, 1280, 260);
    const tb = { x: 640, y: floor, s: 1.35, w: 330, sway: 1 };
    P.clothTable(c, tb, e4);
    const top = P.clothTable.anchors(tb).top.y;
    const cs = { x: 470, y: top, s: 1.6, seed: 5 };
    P.candlestick(c, cs, e4);
    P.books(c, { x: 760, y: top, s: 1.35, mode: 'stack', count: 3, seed: 7 }, e4);
    P.books(c, { x: 880, y: top, s: 1.35, mode: 'open', turn: (t * 0.25) % 1 }, e4);
    P.quillInkwell(c, { x: 640, y: top, s: 1.35 }, e4);
    P.chair(c, { x: 175, y: floor, s: 1.35, style: 'carved', view: 'side' }, e4);
    P.globe(c, { x: 1120, y: floor, s: 1.2, flip: true }, e4);
    const f = P.candlestick.anchors(cs).flame;
    P.propGlow(c, f.x, f.y, e4, { seed: 5, radius: 200 });
  },
  lights: (c, t) =>
    rows(c, t, [
      ['candleAmber', 'lights', (c, env, y) => {
        const cs = [
          { x: 90, variant: 'table' as const },
          { x: 200, variant: 'tall' as const },
          { x: 300, variant: 'chamber' as const },
        ];
        cs.forEach((o, i) => {
          const opt = { ...o, y, s: 1.6, seed: i + 2 };
          P.candlestick(c, opt, env);
          const a = P.candlestick.anchors(opt).flame;
          P.propGlow(c, a.x, a.y, env, { seed: i + 2, radius: 150 });
        });
        const ol = { x: 430, y, s: 1.6 };
        P.oilLamp(c, ol, env);
        P.propGlow(c, P.oilLamp.anchors(ol).flame.x, P.oilLamp.anchors(ol).flame.y, env, { seed: 9, radius: 170 });
        const bl = { x: 620, y, s: 1.6 };
        P.bankersLamp(c, bl, env);
        P.propGlow(c, P.bankersLamp.anchors(bl).bulb.x, P.bankersLamp.anchors(bl).bulb.y + 6, env, { flicker: false, radius: 140, intensity: 0.7 });
        const ap = { x: 820, y, s: 1.6, reach: 0.5 + 0.5 * Math.sin(t * 0.8) };
        P.anglepoiseLamp(c, ap, env);
        P.propGlow(c, P.anglepoiseLamp.anchors(ap).bulb.x, P.anglepoiseLamp.anchors(ap).bulb.y, env, { flicker: false, radius: 120, intensity: 0.8 });
        P.anglepoiseLamp(c, { x: 1150, y, s: 1.6, reach: 0.1, flip: true, lit: false }, env);
      }],
      ['duskRose', 'candlestick hero', (c, env, y) => {
        const o = { x: 300, y, s: 3.4, variant: 'table' as const, seed: 4 };
        P.candlestick(c, o, env);
        const a = P.candlestick.anchors(o);
        P.propGlow(c, a.flame.x, a.flame.y, env, { seed: 4, radius: 300 });
        const o2 = { x: 800, y, s: 3, variant: 'tall' as const, seed: 8, burn: 0.5 };
        P.candlestick(c, o2, env);
        const a2 = P.candlestick.anchors(o2);
        P.propGlow(c, a2.flame.x, a2.flame.y, env, { seed: 8, radius: 300 });
        const o3 = { x: 1100, y, s: 3.2, seed: 9 };
        P.oilLamp(c, o3, env);
        P.propGlow(c, P.oilLamp.anchors(o3).flame.x, P.oilLamp.anchors(o3).flame.y, env, { seed: 11, radius: 300 });
      }],
    ]),
  furniture: (c, t) =>
    rows(c, t, [
      ['duskRose', 'chairs', (c, env, y) => {
        const s = 1.5;
        P.chair(c, { x: 110, y, s, style: 'carved', view: 'front' }, env);
        P.chair(c, { x: 260, y, s, style: 'carved', view: 'side' }, env);
        P.chair(c, { x: 420, y, s, style: 'wooden', view: 'front' }, env);
        P.chair(c, { x: 560, y, s, style: 'wooden', view: 'side' }, env);
        P.chair(c, { x: 740, y, s, style: 'swivel' }, env);
        P.chair(c, { x: 920, y, s, style: 'modern' }, env);
        P.chair(c, { x: 1120, y, s, style: 'modern', flip: true }, env);
      }],
      ['candleAmber', 'desks and the tasselled table', (c, env, y) => {
        P.writingDesk(c, { x: 200, y, s: 1.1 }, env);
        P.writingDesk(c, { x: 560, y, s: 1.1, variant: 'rolltop', open: 0.5 + 0.5 * Math.sin(t) }, env);
        P.chair(c, { x: 820, y, s: 1.1, style: 'carved', view: 'front' }, env);
        P.clothTable(c, { x: 1010, y, s: 1.1, w: 200, sway: 1 }, env);
        const cs = { x: 960, y: P.clothTable.anchors({ x: 1010, y, s: 1.1, w: 200 }).top.y, s: 1.1 };
        P.candlestick(c, cs, env);
        const f = P.candlestick.anchors(cs).flame;
        P.propGlow(c, f.x, f.y, env, { seed: 3, radius: 160 });
      }],
    ]),
  study: (c, t) =>
    rows(c, t, [
      ['candleAmber', 'desk things (×3)', (c, env, y) => {
        const s = 3;
        P.books(c, { x: 90, y, s, mode: 'stack', count: 5 }, env);
        P.books(c, { x: 260, y, s, mode: 'open', turn: (t * 0.35) % 1, tone: 'paper' }, env);
        P.quillInkwell(c, { x: 420, y, s }, env);
        P.typewriter(c, { x: 610, y, s, carriage: (t * 0.2) % 1, typing: 1 }, env);
        P.rotaryPhone(c, { x: 830, y, s, lifted: Math.max(0, Math.sin(t * 0.8)) }, env);
        P.books(c, { x: 1060, y, s: 2.6, mode: 'row', count: 11, seed: 4 }, env);
        P.papers(c, { x: 1190, y, s: 2.4 }, env);
      }],
      ['duskRose', 'chalkboard, slide rule, clipboard, punch cards, flying papers', (c, env, y) => {
        P.chalkboard(c, { x: 150, y, s: 0.95 }, env);
        P.chalkboard(c, { x: 1150, y: y - 120, s: 0.8, stand: 'wall', w: 120, h: 70 }, env);
        P.slideRule(c, { x: 395, y: y - 268, s: 3.1, slide: 4 * Math.sin(t * 0.6), cursor: 0.5 + 0.3 * Math.sin(t * 0.4) }, env);
        P.clipboard(c, { x: 360, y, s: 3.4 }, env);
        P.punchCards(c, { x: 600, y, s: 3.4, mode: 'single' }, env);
        P.punchCards(c, { x: 640, y: y - 70, s: 3.4, mode: 'fan' }, env);
        P.punchCards(c, { x: 610, y: y - 210, s: 3.4, mode: 'deck', count: 200 }, env);
        P.papers(c, { x: 830, y: y - 20, s: 1.4, mode: 'flying', tone: 'paper', time: t, count: 9 }, env);
      }],
    ]),
  symbolic: (c, t) =>
    rows(c, t, [
      ['parchment', 'globe, chess, go, clocks', (c, env, y) => {
        P.globe(c, { x: 110, y, s: 2.4 }, env);
        P.chessboard(c, { x: 390, y, s: 4.2, position: 'midgame' }, env);
        P.goBoard(c, { x: 760, y, s: 3.2, count: 70 }, env);
        P.clock(c, { x: 1050, y: y - 200, s: 1.7, time: 10 + t * 0.5 }, env);
        P.clock(c, { x: 1060, y, s: 2.2, kind: 'mantel', time: 3 + t }, env);
        P.clock(c, { x: 1210, y: y - 30, s: 4, kind: 'pocket', time: 7.5 }, env);
      }],
      ['emberRed', 'newspaper, podium, microphones, medallions, go (top)', (c, env, y) => {
        P.newspaper(c, { x: 90, y, s: 2.7 }, env);
        P.podium(c, { x: 290, y, s: 1.25 }, env);
        P.microphone(c, { x: 440, y, s: 1.0, kind: 'ribbon' }, env);
        P.microphone(c, { x: 540, y, s: 3, kind: 'dynamic', stand: 'desk' }, env);
        P.microphone(c, { x: 640, y, s: 3, kind: 'condenser', stand: 'desk' }, env);
        P.medallion(c, { x: 770, y: y - 170, s: 6 }, env);
        P.medallion(c, { x: 770, y: y - 40, s: 4, tone: 'gold' }, env);
        P.goBoard(c, { x: 1060, y: y - 150, s: 3.4, view: 'top', count: 90, seed: 3 }, env);
      }],
    ]),
};

const g: GalleryModule = {
  title: 'props',
  duration: 6,
  fonts: ['600 13px Georgia', 'italic 11px Georgia'],
  paint(c, ge) {
    const p = new URLSearchParams(location.search).get('p') ?? 'lights';
    (PAGES[p] ?? PAGES.lights)(c, ge.t);
  },
};
export default g;
