import type { GalleryModule } from './main';
import type { MoodId, PaintEnv } from '../contracts';
import { backdrop, stageEnv } from './_propstage';
import * as P from '../silhouette/props';

// Machines line-ups. /film-gallery.html?g=machines&p=<perceptron|retina|vintage|crt|modern|gpu>&t=2
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

/** a 20×20 letter-ish pattern (a "T" sliding) for the retina */
function cells(t: number): number[] {
  const out = new Array(400).fill(0);
  const sh = Math.round(4 * Math.sin(t * 0.9));
  for (let r = 0; r < 20; r++)
    for (let k = 0; k < 20; k++) {
      const x = k - sh;
      const on = (r >= 3 && r <= 5 && x >= 4 && x <= 15) || (r >= 5 && r <= 16 && x >= 8 && x <= 11);
      out[r * 20 + k] = on ? 0.75 + 0.25 * Math.sin(t * 3 + k * 0.4) : 0;
    }
  return out;
}
const weights = (t: number) => Array.from({ length: 160 }, (_, i) => Math.sin(i * 1.7 + t * (0.3 + (i % 7) * 0.1)));

const PAGES: Record<string, (c: CanvasRenderingContext2D, t: number) => void> = {
  perceptron: (c, t) =>
    rows(c, t, [
      ['labGreen', 'Mark I Perceptron', (c, env, y, t) => {
        const o = { x: 680, y, s: 1.45, cells: cells(t), weights: weights(t), response: [0, 1, 0, 0, 0.6, 0, 0, 0].map((v, i) => (i === Math.floor(t * 2) % 8 ? 1 : v * 0)), seed: 2 };
        P.markIPerceptron(c, o, env);
      }],
    ]),
  retina: (c, t) =>
    rows(c, t, [
      ['labGreen', 'retina, patchboard, pot rack (hero)', (c, env, y, t) => {
        P.photocellRetina(c, { x: 200, y, s: 2.2, cells: cells(t) }, env);
        P.photocellRetina(c, { x: 470, y, s: 1.6, view: 'side', cells: cells(t) }, env);
        P.perceptronPatchboard(c, { x: 760, y, s: 1.95, seed: 3 }, env);
        P.perceptronPotRack(c, { x: 1080, y, s: 1.95, weights: weights(t) }, env);
      }],
    ]),
  vintage: (c, t) =>
    rows(c, t, [
      ['labGreen', 'tube racks and the 704 room', (c, env, y) => {
        P.tubeRack(c, { x: 70, y, s: 0.95 }, env);
        P.ibm704(c, { x: 690, y, s: 0.95 }, env);
      }],
      ['winterBlue', 'tape drive hero, tube rack', (c, env, y) => {
        P.tapeDrive(c, { x: 160, y, s: 0.95 }, env);
        P.tubeRack(c, { x: 360, y, s: 0.95, seed: 8 }, env);
        P.console704(c, { x: 640, y, s: 0.95 }, env);
        P.mainframe704(c, { x: 1000, y, s: 0.95 }, env);
      }],
    ]),
  crt: (c, t) =>
    rows(c, t, [
      ['labGreen', 'CRT terminals', (c, env, y) => {
        P.crtTerminal(c, { x: 150, y, s: 2.6, lines: Math.floor(t * 3) % 14 }, env);
        P.crtTerminal(c, { x: 420, y, s: 2.6, view: 'side' }, env);
        P.crtTerminal(c, { x: 660, y, s: 2.6, phosphor: 'amber', keyboard: false }, env);
        P.crtTerminal(c, { x: 920, y, s: 2.6, on: false }, env);
        P.keyboard(c, { x: 1160, y, s: 2.6, typing: 1 }, env);
      }],
      ['duskRose', 'workstation, cheque reader', (c, env, y) => {
        P.workstation80s(c, { x: 230, y, s: 1.2 }, env);
        P.checkScanner(c, { x: 880, y, s: 1.3 }, env);
      }],
    ]),
  gpu: (c, t) =>
    rows(c, t, [
      ['emberRed', 'GPU card hero', (c, env, y) => {
        P.gpuCard(c, { x: 400, y: y - 40, s: 10.5, spin: 0.6 }, env);
        P.gpuCard(c, { x: 1000, y: y - 150, s: 5, fans: 3, lit: 0, spin: 2.4 }, env);
        P.gpuCard(c, { x: 1000, y: y - 10, s: 5, fans: 1, spin: 0.3 }, env);
      }],
      ['candleAmber', 'bedroom 2012: tower with two GPUs, laptop, phone', (c, env, y) => {
        P.desktopTower(c, { x: 170, y, s: 3.3 }, env);
        P.laptop(c, { x: 480, y, s: 4.2, open: 0.5 + 0.5 * Math.sin(t * 0.7) }, env);
        P.laptop(c, { x: 800, y, s: 4.2, view: 'side' }, env);
        P.smartphone(c, { x: 1000, y, s: 10 }, env);
        P.smartphone(c, { x: 1120, y, s: 10, on: false }, env);
        P.smartphone(c, { x: 1200, y, s: 10, view: 'side' }, env);
      }],
    ]),
  modern: (c, t) =>
    rows(c, t, [
      ['serverCyan', 'server racks', (c, env, y) => {
        for (let i = 0; i < 7; i++) P.serverRack(c, { x: 100 + i * 120, y, s: 0.78, seed: 11 + i, activity: 0.3 + 0.1 * i }, env);
        P.serverRack(c, { x: 1150, y, s: 0.78, seed: 3, door: 0.6 }, env);
      }],
      ['serverCyan', 'package, wafer, die (top views)', (c, env, y) => {
        P.chip(c, { x: 200, y: y - 160, s: 14 }, env);
        P.chip(c, { x: 620, y: y - 160, s: 4.8, kind: 'wafer', progress: (t / 6) % 1 }, env);
        P.chip(c, { x: 1040, y: y - 160, s: 18, kind: 'die' }, env);
      }],
    ]),
};

const g: GalleryModule = {
  title: 'machines',
  duration: 6,
  fonts: ['600 13px Georgia', 'italic 11px Georgia'],
  paint(c, ge) {
    const p = new URLSearchParams(location.search).get('p') ?? 'perceptron';
    (PAGES[p] ?? PAGES.perceptron)(c, ge.t);
  },
};
export default g;
