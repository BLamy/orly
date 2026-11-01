import type { GalleryModule } from './main';
import type { Camera3, MoodId } from '../contracts';
import { CAMERA3_HOME } from '../contracts';
import { createFrame } from '../core/frame';
import { loadFilmFonts } from '../silhouette/type';
import { POSES, PUPPET_NEAR_BLACK } from '../silhouette/puppet';
import { cast, MOON_LIGHT, MOON_RIM } from '../../films/durable-objects-unbound/cast';
import { TOWN, paintTown, pulleyAt } from '../../films/durable-objects-unbound/sets/harbourTown';
import { plate, swapCard, tooth, wellBase, wellLive } from '../../films/durable-objects-unbound/sets/wellAndPlate';
import { roomLantern } from '../../films/durable-objects-unbound/sets/roomLantern';
import { leaseCandle } from '../../films/durable-objects-unbound/sets/leaseCandle';
import { book, ledger, ribbon, scroll } from '../../films/durable-objects-unbound/sets/walRibbon';
import { houseBell, lanternDoor, letter } from '../../films/durable-objects-unbound/sets/heldLetter';
import { copyistDesk, recordTile } from '../../films/durable-objects-unbound/sets/neighbours';
import { demonstratorHand, pinBoard } from '../../films/durable-objects-unbound/sets/demonstratorHand';
import { DESK, desk, deskAnchors, deskFigure, braid } from '../../films/durable-objects-unbound/sets/historyDesk';
import { cistern, epochShelf, orderLedger, proofSheets, shaftWalls, witnessBell } from '../../films/durable-objects-unbound/sets/wellCutaway';
import { badge, label, slip } from '../../films/durable-objects-unbound/sets/common';

/**
 * durable-objects-unbound shared sets through the real multiplane Frame (1920×1080), for the shots-stage QA:
 *   ?v=town&variant=night|celld|dawn&mood=winterBlue   the canonical harbour town at rest (geography lock)
 *   ?v=townPush                                         the ch01-s01 end framing (dolly in on House A's window)
 *   ?v=well&mood=winterBlue                             the Well, Plate and Tooth in close-up with cards
 *   ?v=props&mood=candleAmber                           lantern, candle, ribbon, scrolls, letter, bell, notebook desk
 *   ?v=desks&mood=candleAmber                           the two history desks and the braid
 *   ?v=cutaway                                          the serverCyan well cutaway and epoch shelves
 */
const W = 1920, H = 1080;
const bufs: Record<string, CanvasRenderingContext2D> = {};
function buf(name: string) {
  if (!bufs[name]) {
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    bufs[name] = cv.getContext('2d')!;
  }
  return bufs[name];
}
function frame(name: string, t: number, m: MoodId, cam: Camera3 = CAMERA3_HOME) {
  const c = buf(name);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, W, H);
  const f = createFrame({ c, pxScale: 1.5, t, fps: 24, seed: 2026, mood: m });
  f.camera(cam);
  return { f, c };
}

const g: GalleryModule = {
  title: 'sets: durable-objects-unbound',
  duration: 6,
  async setup() {
    await loadFilmFonts();
  },
  paint(out, genv) {
    const q = new URLSearchParams(location.search);
    const v = q.get('v') ?? 'town';
    const t = genv.t;
    const blit = (c: CanvasRenderingContext2D) => out.drawImage(c.canvas, 0, 0, 1280, 720);
    if (v === 'town' || v === 'townPush') {
      const variant = (q.get('variant') ?? 'night') as 'night' | 'celld' | 'dawn';
      const m = (q.get('mood') ?? (variant === 'celld' ? 'labGreen' : variant === 'dawn' ? 'dawnGold' : 'winterBlue')) as MoodId;
      const cam: Camera3 = v === 'townPush' ? { x: 300, y: 380, z: 260, lens: 1 } : CAMERA3_HOME;
      const { f, c } = frame('town', t, m, cam);
      paintTown(
        f,
        {
          cam,
          cams: [CAMERA3_HOME, cam],
          variant,
          lamps: { A: 1, B: 0.15, C: variant === 'night' ? 0 : 1, Bup: variant === 'celld' ? 1 : 0, Cup: variant === 'celld' ? 1 : 0 },
          lanterns: [{ house: variant === 'dawn' ? 'C' : 'A', lit: 1, members: 4, tq: genv.tq, door: 0 }],
          plate: { house: 'A', epoch: 7, from: 7, crown: 1, captions: 0 },
          tooth: { shutter: 0, pin: 1, showPin: false },
          well: { bucket: 0.35, glint: 0.6 },
          badge: { text: variant === 'celld' ? 'celld 0.6.3' : 'workerd · 28 Oct', legible: true },
          lampPostLit: 0.6,
        },
        {
          L4back: (cc, env) => {
            cast.sender.draw(cc, { x: TOWN.sender.seat.x, y: TOWN.sender.seat.y, facing: 'left', pose: POSES.sit, scale: TOWN.sender.seatScale, ink: PUPPET_NEAR_BLACK, edgeRim: { x: 0.8, y: -0.5, px: 2.5, alpha: 0.85, warm: 0.7 } }, env);
          },
          L4: (cc, env) => {
            // keeper A at the wellhead and the sender in the cottage window
            cast['keeper-a'].draw(cc, { x: 352, y: 612, facing: 'right', pose: POSES.stand, scale: 0.62, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: MOON_RIM }, env);
            const p = pulleyAt(cam, 'C', 0.4);
            scroll(cc, env, { x: p.x, y: p.y + 6, s: 0.8, tag: 1 });
            slip(cc, env, { x: 980, y: 520, w: 46, tick: 1 });
          },
        },
      );
      blit(c);
      out.save();
      label(out, f.mood, { id: 'g1', text: 'the Plate · who owns the room', x: 860, y: 96, alpha: 1 });
      out.restore();
      return;
    }
    if (v === 'well') {
      const m = (q.get('mood') ?? 'winterBlue') as MoodId;
      const { f, c } = frame('well', t, m);
      f.backlight({ sunX: 300, sunY: 300 });
      f.fog('A');
      f.layer('L4', (cc, env) => {
        const o = { x: 520, y: 700, s: 2.6 };
        wellBase(cc, env, o);
        wellLive(cc, env, { ...o, bucket: 0.2, load: 'scroll', glint: 0.5 });
        plate(cc, env, { ...o, plate: { house: 'B', epoch: 8, from: 7, crown: 0, captions: 1, notch: 12, glint: [0.6, 0, 0] }, legible: true, id: 'gp' });
        tooth(cc, env, { ...o, tooth: { shutter: 0.3, pin: 0.5, pinOut: 0.5, flash: 0.6, flashKind: 'click' } });
        swapCard(cc, env, { x: 980, y: 380, s: 3, house: 'A', notch: 12, legible: true, id: 'gc1' });
        swapCard(cc, env, { x: 1120, y: 470, s: 3, house: 'B', notch: 12, punched: 1, rot: 0.3 });
        badge(cc, env, { x: 1050, y: 160, text: 'Amazon S3', s: 1.6, legible: true, id: 'gb' });
        demonstratorHand(cc, env, { tip: { x: 1000, y: 600 }, reach: 1, shape: 'pinch', holding: 'pin', s: 1.2 });
      });
      f.rim({ x: 0, y: -1 });
      blit(c);
      return;
    }
    if (v === 'props') {
      const m = (q.get('mood') ?? 'candleAmber') as MoodId;
      const { f, c } = frame('props', t, m);
      f.backlight({ sunX: 640 });
      f.fog('A');
      f.layer('L4', (cc, env) => {
        roomLantern(cc, env, { x: 140, y: 330, s: 2.2, lit: 1, members: 4, tq: genv.tq, door: 0.6, threads: 0.6, slips: [{ x: 0.2, y: 0.5, tick: 1 }] });
        leaseCandle(cc, env, { x: 360, y: 330, s: 1.6, nowMs: 9000, band: 1, notch: 1, latch: { pin: 1, open: 0 } });
        leaseCandle(cc, env, { x: 460, y: 330, s: 1.6, nowMs: 3000, variant: 'celld', notch: 1 });
        ribbon(cc, env, { x: 540, y: 150, s: 1.4, labels: 1, legible: true, glow: 0.6, id: 'gr', frames: [{ kind: 'leader' }, { kind: 'frame' }, { kind: 'frame' }, { kind: 'frame', stamp: 6 }, { kind: 'frame' }, { kind: 'frame', stamp: 7 }] });
        scroll(cc, env, { x: 600, y: 300, s: 2, tag: 1 });
        scroll(cc, env, { x: 720, y: 300, s: 2, tag: 1, frayed: 1 });
        book(cc, env, { x: 840, y: 320, s: 2, tag: 'session 7', legible: true, id: 'gbk' });
        ledger(cc, env, { x: 1000, y: 320, s: 1.6, pages: 6, adding: 0.5 });
        lanternDoor(cc, env, { x: 200, y: 640, s: 1.4, latch: 0.2 });
        letter(cc, env, { x: 260, y: 560, s: 1.4 });
        letter(cc, env, { x: 380, y: 560, s: 1.4, error: 1 });
        houseBell(cc, env, { x: 480, y: 470, s: 2, swing: 0.3, ring: 1 });
        copyistDesk(cc, env, { x: 760, y: 640, s: 1.6, notebook: { band: 'complete', lines: 5, newest: 1, sealed: 1 }, press: { turn: 0.6, locked: 1 } });
        copyistDesk(cc, env, { x: 1080, y: 640, s: 1.6, notebook: { band: 'damaged', lines: 4 }, press: { turn: 0, locked: 0 } });
        recordTile(cc, env, { x: 1160, y: 420, s: 2, state: 'open' });
        slip(cc, env, { x: 1120, y: 120, w: 220, tick: 1, text: true, id: 'gs' });
      });
      f.rim({ x: 0, y: -1 });
      blit(c);
      return;
    }
    if (v === 'desks') {
      const m = (q.get('mood') ?? 'candleAmber') as MoodId;
      const { f, c } = frame('desks', t, m);
      f.backlight({ sunX: 640, intensity: 0.6 });
      f.fog('A');
      f.layer('L4', (cc, env) => {
        desk(cc, env, DESK.kenton);
        deskFigure(cc, env, { ...DESK.kenton, tq: genv.tq });
        desk(cc, env, DESK.ryan);
        deskFigure(cc, env, { ...DESK.ryan, tq: genv.tq, think: 0.5 });
        const a = deskAnchors(DESK.kenton).ropeHook, b = deskAnchors(DESK.ryan).ropeHook;
        braid(cc, env, { a, b, u: 1.5 });
      });
      f.rim({ x: 0, y: -1 });
      for (const d of [DESK.kenton, DESK.ryan]) {
        const a = deskAnchors(d);
        f.practical({ x: a.bulb.x, y: a.bulb.y, kind: 'lamp', seed: d.x, intensity: 0.9 });
      }
      blit(c);
      return;
    }
    if (v === 'cutaway') {
      const { f, c } = frame('cut', t, 'serverCyan');
      f.backlight({ sunX: 640, intensity: 0.5 });
      f.layer('L2', (cc, env) => shaftWalls(cc, env, { x: 640, y0: -40, y1: 800, w: 520 }));
      f.fog('A');
      f.layer('L3', (cc, env) => {
        cistern(cc, env, { x: 520, y: 260, lamp: 1, mark: 1 });
        cistern(cc, env, { x: 760, y: 460, lamp: 1, mark: 1, stale: 0.6 });
        cistern(cc, env, { x: 540, y: 660, lamp: 0.6, mark: 1 });
        orderLedger(cc, env, { x: 820, y: 240, lines: 6.5 });
        proofSheets(cc, env, { x: 300, y: 120, n: 8 });
      });
      f.layer('L4', (cc, env) => {
        cast.witness.draw(cc, { x: 640, y: 420, facing: 'right', pose: POSES.stand, ink: PUPPET_NEAR_BLACK, edgeRim: { x: 0.2, y: -1, px: 2.5, alpha: 0.85, warm: 0.2 } }, env);
        witnessBell(cc, env, { x: 690, y: 330, ring: 1, flag: 1 });
        epochShelf(cc, env, { x: 860, y: 600, w: 260, label: 'epoch 7', labelLegible: true, id: 'gsh', items: [{ kind: 'book' }, { kind: 'scroll', tag: 1 }, { kind: 'scroll', tag: 1 }, { kind: 'scroll', ghost: true }] });
        badge(cc, env, { x: 1000, y: 60, text: 'celld 0.6.3', legible: true });
        pinBoard(cc, env, { x: 300, y: 560, pins: [{ alpha: 1 }, { alpha: 1 }, { alpha: 1 }, { alpha: 0.5 }], s: 0.8 });
      });
      f.rim({ x: 0, y: -1 });
      blit(c);
      return;
    }
  },
};
export default g;
