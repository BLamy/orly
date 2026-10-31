import type { GalleryModule } from './main';
import type { Camera3, MoodId } from '../contracts';
import { createFrame } from '../core/frame';
import { loadFilmFonts } from '../silhouette/type';
import { withAlpha } from '../silhouette/palette';
import { STUDY_ALL_CAMS, STUDY_CAMS, studyCase, studyNear, studyRoom, fileDesk, candleX, slotWorld, type OutsideKind } from '../../films/neural-net-history/sets/study';
import { shelfStateAt, yearAt } from '../../films/neural-net-history/sets/studyState';
import { hands } from '../../films/neural-net-history/cast';
import { candleStage, STAGE } from '../../films/neural-net-history/sets/candleStage';
import { cast } from '../../films/neural-net-history/cast';
import { POSES, withLife } from '../silhouette/puppet';
import { podium } from '../silhouette/props';
import { darkRoom, DARK_CAMS } from '../../films/neural-net-history/sets/darkRoom';
import { hallOfMirrors, HALL } from '../../films/neural-net-history/sets/hallOfMirrors';
import { indexTab } from '../../films/neural-net-history/sets/indexTab';

/**
 * neural-net-history shared sets through the real multiplane Frame (1920×1080).
 *   ?v=gate              THE SPINE GATE: the full wide at ch01-s05, ch05-s10, ch08-s14, ch12-s07, ch15-s08
 *                        (end states) + the hands at rest, one sheet
 *   ?v=full&shot=…       the full wide at a shot (&when=start|end)
 *   ?v=board&shot=…      the BOARD camera          ?v=shelf&shot=…&id=<candle>   the SHELF macro
 *   ?v=wall&shot=…&u=…   the WALL truck            ?v=xray&shot=…               the X-RAY plate
 *   ?v=file              the FILE (top-down)       ?v=stage&shot=…              the Edge of the Light stage
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

function outsideFor(shot: string): { mood: MoodId; kind: OutsideKind } {
  const y = yearAt(shot);
  if (y >= 1969 && y < 1981) return { mood: 'winterBlue', kind: 'snow' };
  if (y >= 2012 && y < 2020) return { mood: 'dawnGold', kind: 'dawn' };
  if (y >= 2022) return { mood: 'duskRose', kind: 'city' };
  return { mood: 'winterBlue', kind: 'night' };
}

function renderStudy(t: number, shot: string, when: 'start' | 'end', cam: Camera3, name: string, extra?: (f: ReturnType<typeof createFrame>) => void) {
  const c = buf(name);
  const f = createFrame({ c, pxScale: 1.5, t, fps: 24, seed: 1943, mood: 'candleAmber' });
  f.camera(cam);
  const key = `gal-${name}`;
  studyRoom(f, { key, cams: STUDY_ALL_CAMS, outside: outsideFor(shot) });
  studyCase(f, { shot, when, key });
  if (new URLSearchParams(location.search).get('near') !== '0') studyNear(f, { key, cams: STUDY_ALL_CAMS, file: true });
  extra?.(f);
  return c;
}

const g: GalleryModule = {
  title: 'sets: neural-net-history study',
  duration: 6,
  async setup() {
    await loadFilmFonts();
  },
  paint(c, genv) {
    const q = new URLSearchParams(location.search);
    const v = q.get('v') ?? 'gate';
    const shot = q.get('shot') ?? 'ch08-s14';
    const when = (q.get('when') ?? 'end') as 'start' | 'end';
    const t = genv.t;

    if (v === 'gate') {
      const gate = ['ch01-s05', 'ch05-s10', 'ch08-s14', 'ch12-s07', 'ch15-s08'];
      gate.forEach((s, i) => {
        const b = renderStudy(t, s, 'end', STUDY_CAMS.full, `gate${i}`);
        const x = (i % 3) * 426.67, y = Math.floor(i / 3) * 240 + 120;
        c.drawImage(b.canvas, x, y, 426.67, 240);
        c.fillStyle = 'rgba(0,0,0,.6)';
        c.fillRect(x, y, 150, 18);
        c.fillStyle = '#eee';
        c.font = '12px monospace';
        c.fillText(`${s} (end) · ${yearAt(s)}`, x + 5, y + 13);
      });
      // the hands at rest at the L5 entry, on the BOARD camera of the last state
      const b = renderStudy(t, 'ch15-s08', 'start', STUDY_CAMS.board, 'gateHands', (f) => {
        f.layer('L5', (cc, env) => hands.draw(cc, hands.act('rest', 0, { x: 700, y: 360 }), env));
      });
      c.drawImage(b.canvas, 853.33, 360, 426.67, 240);
      c.fillStyle = '#eee';
      c.font = '12px monospace';
      c.fillText('ch15-s08 (start) · BOARD cam · hands at rest', 858, 373);
      c.fillStyle = '#111';
      c.fillRect(0, 0, 1280, 120);
      c.fillRect(0, 600, 1280, 120);
      c.fillStyle = '#ddd';
      c.font = '16px monospace';
      c.fillText('SPINE GATE: board slots · shelf candles (sleeves/stubs) · Wall slips · X-ray bands · hands at rest', 20, 60);
      return;
    }

    let cam: Camera3 = STUDY_CAMS.full;
    if (v === 'board') cam = STUDY_CAMS.board;
    if (v === 'xray') cam = STUDY_CAMS.xray;
    if (v === 'wall') cam = STUDY_CAMS.wall(Number(q.get('u') ?? '0.3'));
    if (v === 'shelf') cam = STUDY_CAMS.shelf(candleX(shelfStateAt(shot, when), q.get('id') ?? 'logic') + 220);
    if (v === 'hands') {
      // the hands pinning a card into a slot on the BOARD camera, drawn in L4 so the pin lands
      const u = Number(q.get('u') ?? '0.4');
      const slot = (q.get('slot') ?? 'C2-b') as Parameters<typeof slotWorld>[0];
      const b = renderStudy(t, shot, 'start', STUDY_CAMS.board, 'hands', (f) => {
        const target = slotWorld(slot, 'pin');
        f.layer('L4', (cc, env) => hands.draw(cc, hands.act('pin', u, target, { entry: hands.entry(STUDY_CAMS.board, 'L4') }), env));
      });
      c.drawImage(b.canvas, 0, 0, 1280, 720);
      return;
    }
    if (v === 'dark' || v === 'hall') {
      const b = buf(v);
      const mood = v === 'dark' ? 'serverCyan' : 'dawnGold';
      const f = createFrame({ c: b, pxScale: 1.5, t, fps: 24, seed: 7, mood });
      const cam = { x: 640, y: 360, z: 0, lens: 1 };
      f.camera(cam);
      if (v === 'dark') darkRoom(f, { key: 'gal-dark', cams: [cam, DARK_CAMS.screen], cityLit: Number(q.get('lit') ?? '0.12'), typing: true, door: Number(q.get('door') ?? '0') });
      else
        hallOfMirrors(f, {
          key: 'gal-hall',
          cams: [cam],
          turn: Number(q.get('turn') ?? '0'),
          holdout: true,
          mid: (cc, env) => {
            podium(cc, { x: HALL.lecternX, y: HALL.floorY, s: 1 }, env);
            cast.hopfield.draw(cc, { x: HALL.lecternX + 60, y: HALL.floorY, facing: 'left', pose: withLife({ ...POSES.present, prev: POSES.present }, env.tq, 4) }, env);
          },
        });
      if (q.get('tab') !== null) indexTab(f.c, { title: 'Clue Three: The Messenger Who Runs Backward', number: 5, at: 0 }, { t: 1.2, mood: f.mood });
      c.drawImage(b.canvas, 0, 0, 1280, 720);
      return;
    }
    if (v === 'file') {
      const b = buf('file');
      const f = createFrame({ c: b, pxScale: 1.5, t, fps: 24, seed: 3, mood: 'candleAmber' });
      f.camera(STUDY_CAMS.board);
      f.backlight({ intensity: 0.2 });
      f.layer('L4', (cc, env) => {
        fileDesk(cc, { x: 640, y: 420, open: 0.4, filed: 2 }, env);
      });
      f.layer('L5', (cc, env) => hands.draw(cc, hands.act('fileFold', 0.4, { x: 640, y: 380 }), env));
      c.drawImage(b.canvas, 0, 0, 1280, 720);
      return;
    }
    if (v === 'stage') {
      const b = buf('stage');
      const f = createFrame({ c: b, pxScale: 1.5, t, fps: 24, seed: 5, mood: 'candleAmber' });
      f.camera({ x: 640, y: 360, z: 0, lens: 1 });
      const views = shelfStateAt(shot, when);
      const live = views.find((x) => x.state === 'live') ?? views[0];
      candleStage(f, {
        key: 'gal-stage',
        cams: [{ x: 640, y: 360, z: 0, lens: 1 }],
        candle: live,
        draw: (cc, env, geo) => {
          const life = (id: keyof typeof POSES, s: number) => withLife({ ...POSES[id], prev: POSES[id] }, env.tq, s);
          cast.mcculloch.draw(cc, { x: geo.poolX - 150, y: STAGE.floorY, facing: 'right', pose: life('present', 1) }, env);
          cast.pitts.draw(cc, { x: geo.poolX - 250, y: STAGE.floorY, facing: 'right', pose: life('listen', 2) }, env);
          cast.gerard.draw(cc, { x: geo.rimX + 40, y: STAGE.floorY, facing: 'right', pose: life('doubt', 3) }, env);
        },
      });
      c.drawImage(b.canvas, 0, 0, 1280, 720);
      return;
    }
    const b = renderStudy(t, shot, when, cam, `v-${v}`);
    c.drawImage(b.canvas, 0, 0, 1280, 720);
    c.fillStyle = withAlpha('#000000', 0.5);
    c.fillRect(0, 0, 330, 20);
    c.fillStyle = '#eee';
    c.font = '12px monospace';
    c.fillText(`${v} · ${shot} (${when}) · ${yearAt(shot)}`, 6, 14);
  },
};
export default g;
