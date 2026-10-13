/**
 * ch14-s06 — night on the jetty, seen through the study window: three pinned pages (Bletchley, Lima, Washington)
 * lift in turn; a telephone handset with two name-plates is laid across the Go board and its cord glows to both
 * shores; far off the paper fence of rule pages still stands (winterBlue; 20.04 s; in: crossfade from ch14-s05).
 *
 *   pages      'Rivals'      the camera tracks along the jetty rail, three parchment pages pinned in a row
 *   bletchley  'Bletchley'   the first page, BLETCHLEY 2023, lifts into the lantern's light; a held moment
 *              (passing)     LIMA 2024 lifts as the camera passes
 *   samepage   'September'   WASHINGTON 2026 lifts; the camera arrives at the Go board: the right shore's two stones,
 *                            the left shore's one answer; the date stamp types in
 *   handset    'dialogue'    an old handset is laid across the board between them; its two brass name-plates catch
 *                            the light (one name from each government)
 *   incidents  'incidents'   the cord glows along its length, both ways, toward both shores
 *   chiprules  'chip'        far across the water the paper fence of rule pages is glimpsed, still standing
 *   (hold)                   the camera drifts to the jetty's end; the study window's reflection begins to rise
 *                            over the water (matched cut into ch14-s07)
 *
 * WINDOW RULE (ch14): the strait is always seen THROUGH the study window (its frame faint at the edges); no candles
 * and no hands in this shot. Both skylines' windows lit with exactly equal warmth. No flags, emblems or logos.
 */
import { Timeline } from '../../../core';
import type { Camera3 } from '../../../film';
import { LAYERS, annotation, defineShot, placeStamp, toScreen } from '../../../film';
import { monotone } from '../sets/ch02-s05b-util';
import {
  HZ, LANTERN, SHORE, across, boardStones, handset, handsetCords, handsetEnds, jetty, lerp, nearWater, railTop, sm,
  straitBack, tq12, win, windowFrame, type PageState,
} from '../sets/ch14-s05-strait';
import { CAM_OPEN, windowReflection } from '../sets/ch14-s07-window';

const ID = 'ch14-s06';

const PAGES = [
  { text: 'BLETCHLEY', year: '2023', u: 0.44 },
  { text: 'LIMA', year: '2024', u: 0.6 },
  { text: 'WASHINGTON', year: '2026', u: 0.76 },
];
const pageCentre = (u: number) => {
  const p = railTop(u);
  return { x: p.x, y: p.y + 54 };
};

interface B {
  D: number;
  pages: number;
  lift: [number, number, number];
  samepage: number;
  handset: number;
  incidents: number;
  chip: number;
  end2: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  cam: (t: number) => Camera3;
  [k: string]: unknown;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      pages: T.beat('pages'),
      lift: [T.beat('bletchley') - 0.1, T.word('L1414', 'twenty-three') + 0.25, T.beat('samepage') - 0.1],
      samepage: T.beat('samepage'),
      handset: T.beat('handset'),
      incidents: T.beat('incidents'),
      chip: T.beat('chiprules'),
      end2: T.line('L1415').end,
    };
    const P1 = pageCentre(PAGES[0].u);
    // camera (L4 world centre, dolly z): along the rail to page one (hold), on along the pages to the board, back a
    // little for the cords, up for the far fence, then a drift to the jetty's end (CAM_OPEN = ch14-s07's first frame)
    const keys: [number, number, number, number][] = [
      // open wider and further left: both skylines flank the rail on 'Rivals'
      [0, P1.x - 30, P1.y - 150, 240],
      [b.lift[0] - 2.2, P1.x - 10, P1.y - 80, 300],
      [b.lift[0] - 0.2, P1.x + 14, P1.y - 52, 350],
      [b.lift[0] + 0.45, P1.x + 20, P1.y - 56, 350],
      [b.samepage + 0.8, 580, 560, 306],
      [b.handset - 0.3, 632, 500, 350],
      [b.incidents + 0.4, 660, 466, 236],
      [b.chip + 0.5, 642, 336, 172],
      [b.chip + 2.0, 646, 338, 170],
      [D, CAM_OPEN.x, CAM_OPEN.y, CAM_OPEN.z],
    ];
    const fx = monotone(keys.map((k) => [k[0], k[1]]));
    const fy = monotone(keys.map((k) => [k[0], k[2]]));
    const fz = monotone(keys.map((k) => [k[0], k[3]]));
    const cam = (t: number): Camera3 => ({ x: fx(t), y: fy(t), z: fz(t), lens: 1 });
    tl.hold(0, D);
    return { tl, b, cam };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = tq12(t);
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);

    // ------------------------------------------------------------- far: night sky, both shores, water, the far fence
    const fence = 0.3 + 0.7 * win(t, b.chip - 0.3, b.chip + 0.6) - 0.25 * win(t, b.chip + 2.4, b.chip + 3.6);
    // on 'chip' the fence's page tops catch a cool rim for a held moment, so each rule page reads
    const fenceHi = win(t, b.chip - 0.1, b.chip + 0.4) * (1 - win(t, b.chip + 1.6, b.chip + 2.4));
    straitBack(f, { key: 'night', fence, fenceHi, sunX: 640, sun: 0.55 });
    f.fog({ yCenter: HZ + 6, height: 70, alpha: 0.18, drift: 5 });

    // the study window's reflection begins to rise over the water in the hold (ch14-s07 opens on it)
    const rA = win(t, b.D - 1.7, b.D) * 0.36;
    if (rA > 0.003) windowReflection(f, { alpha: rA, rise: 1, lit: 0, fed: 1, strike: null, cam });

    f.layer('L3', (c, env) => nearWater(c, env, -400, 1700, 470, 1200));
    f.fog('B');

    // ------------------------------------------------------------- the jetty: pages on the rail, board, handset, cords
    const pages: PageState[] = PAGES.map((p, i) => ({ ...p, lift: sm((tq - b.lift[i]) / 0.5) }));
    const drop = sm((tq - (b.handset - 0.45)) / 0.85);
    const plates = win(t, b.handset + 0.3, b.handset + 0.9);
    const reveal = sm((t - (b.handset + 0.35)) / 1.1);
    const glow = win(t, b.incidents - 0.15, b.incidents + 1.4) * (1 - 0.55 * win(t, b.incidents + 2.6, b.incidents + 4));
    const ends = handsetEnds();
    f.layer('L4', (c, env) => {
      jetty(c, env, {
        pages,
        lantern: 1,
        onBoard: (cc, e2) => {
          boardStones(cc, e2);
          handsetCords(cc, e2, {
            ends,
            farL: across(LAYERS.L1, LAYERS.L4, cam, { x: SHORE.L.x1 - 40, y: HZ + 4 }),
            farR: across(LAYERS.L1, LAYERS.L4, cam, { x: SHORE.R.x0 + 40, y: HZ + 4 }),
            reveal: drop >= 0.999 ? reveal : 0,
            glow,
            t,
          });
          handset(cc, e2, { drop, plates });
        },
      });
    });
    f.rim({ x: 0.3, y: -1 });
    f.practical({ x: LANTERN.x, y: LANTERN.y, kind: 'lamp', seed: 1406, intensity: 0.62, radius: 34 });

    // ------------------------------------------------------------- the study window (screen-locked), then type
    windowFrame(f);
    const c = f.c;
    c.save();
    c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
    const env = { t, mood: f.mood, seed: 1415 };
    placeStamp(c, { place: 'Washington', date: '23–25 September 2026', year: 2026, at: b.samepage + 0.1, dur: b.handset - 0.6 - b.samepage, fade: 0.6, align: 'right', x: 1210, y: 624 }, env);
    // the two names on the brass plates, one from each government, led to their plates
    const pl = toScreen(LAYERS.L4, cam, ends.plateL.x, ends.plateL.y);
    const pr = toScreen(LAYERS.L4, cam, ends.plateR.x, ends.plateR.y);
    const at = b.handset + 0.35;
    // both labels are gone before the final drift (title safe: they never follow the plates past the margin)
    const dur = b.end2 + 0.3 - at;
    const SAFE = 80;
    const txL = Math.max(SAFE + 330, pl.x - 90);
    const txR = Math.min(1280 - SAFE - 200, pr.x + 120);
    annotation(c, { text: 'SUPER INTELLIGENCE DIALOGUE (US)', x: pl.x, y: pl.y, tx: txL, ty: pl.y - 150, at, dur, size: 20, fade: 0.5 }, env);
    annotation(c, { text: 'AI DIALOGUE (CHINA)', x: pr.x, y: pr.y, tx: txR, ty: pr.y - 196, at: at + 0.25, dur: dur - 0.25, size: 20, fade: 0.5 }, env);
    c.restore();
    void lerp;
  },
});
