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
 *
 * Review r1: a lower eye line (horizon ≈ 44 %, the jetty in at a gentler angle, the post lantern in frame at top
 * right, its warm light on the pages' lantern-facing edges); on 'both' and 'signed' two ink seals press onto the
 * BLETCHLEY page, one from each shore's side; on 'incidents' a pulse runs out along each cord from the handset to its
 * skyline and lands there (no static glows at the cradle); the far fence reads as pinned paper on a tie line, its cool
 * rim pulsed once on 'chip' and held to 'unchanged' + 0.5 s; the date stamp lands on 'September'; pages that leave the
 * frame fade to texture; the reflected candles come in faintly from 18.3 s.
 */
import { Timeline } from '../../../core';
import type { Camera3 } from '../../../film';
import { LAYERS, annotation, defineShot, placeStamp, toScreen } from '../../../film';
import { monotone } from '../sets/ch02-s05b-util';
import {
  HZ, LANTERN, SHORE, across, boardStones, clamp01, handset, handsetCords, handsetEnds, jetty, nearWater, pageEdgeAlpha,
  railLampPoint, sm, straitBack, tq12, win, windowFrame, type PageState,
} from '../sets/ch14-s05-strait';
import { CAM_OPEN, windowReflection } from '../sets/ch14-s07-window';

const ID = 'ch14-s06';

const PAGES = [
  { text: 'BLETCHLEY', year: '2023', u: 0.44 },
  { text: 'LIMA', year: '2024', u: 0.6 },
  { text: 'WASHINGTON', year: '2026', u: 0.76 },
];
interface B {
  D: number;
  pages: number;
  /** 'both' / 'signed': the two seals press onto the BLETCHLEY page */
  seals: [number, number];
  /** 'unchanged': the far fence held to here + 0.5 s */
  unchanged: number;
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
      seals: [T.word('L1414', 'both') - 0.12, T.word('L1414', 'signed') - 0.1],
      unchanged: T.word('L1415', 'unchanged'),
      lift: [T.beat('bletchley') - 0.3, T.word('L1414', 'twenty-three') + 0.25, T.beat('samepage') - 0.3],
      samepage: T.beat('samepage'),
      handset: T.beat('handset'),
      incidents: T.beat('incidents'),
      chip: T.beat('chiprules'),
      end2: T.line('L1415').end,
    };
    // camera (L4 world centre, dolly z), from a LOW eye line (review r1: the horizon near 42 %, the pages standing
    // against the haze and the skylines, the rail lamp lighting them from between the first two): a slow push to page one (hold), on
    // along the pages to the board, back a little for the cords, up for the far fence, then a drift to the jetty's
    // end (CAM_OPEN = ch14-s07's first frame)
    const keys: [number, number, number, number][] = [
      [0, 300, 740, 100],
      [b.lift[0] - 2.2, 285, 748, 140],
      [b.lift[0] - 0.2, 272, 752, 180],
      [b.lift[0] + 0.45, 268, 752, 184],
      // 'September': WASHINGTON 2026 lifts with the board beside it in frame; held close enough to read the page
      [b.samepage + 0.8, 500, 640, 230],
      [b.samepage + 2.2, 520, 612, 240],
      [b.handset - 0.3, 630, 520, 310],
      [b.incidents + 0.4, 650, 470, 236],
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
    // on 'chip' the fence comes up and is held, whole, to 'unchanged' + 0.5 s, then settles back into the haze
    const holdEnd = b.unchanged + 0.5;
    const fence = 0.3 + 0.7 * win(t, b.chip - 0.3, b.chip + 0.5) - 0.3 * win(t, holdEnd, holdEnd + 1.2);
    // one cool rim pulse on 'chip', so each pinned page reads
    const fenceHi = win(t, b.chip - 0.1, b.chip + 0.3) * (1 - 0.7 * win(t, b.chip + 0.8, b.chip + 1.6)) * (1 - win(t, holdEnd, holdEnd + 0.8));
    straitBack(f, { key: 'night', fence, fenceHi, sunX: 640, sun: 0.55 });
    f.fog({ yCenter: HZ + 6, height: 70, alpha: 0.18, drift: 5 });

    // the study window's reflection begins to rise over the water in the hold (ch14-s07 opens on it): faint from
    // 18.3 s, then up to ch14-s07's opening strength at the cut
    const rA = 0.25 * win(t, 18.2, 18.9) + 0.11 * win(t, b.D - 0.9, b.D);
    if (rA > 0.003) windowReflection(f, { alpha: rA, rise: 1, lit: 0, fed: 1, strike: null, cam });

    f.layer('L3', (c, env) => nearWater(c, env, -400, 1700, 470, 1200));
    f.fog('B');

    // ------------------------------------------------------------- the jetty: pages on the rail, board, handset, cords
    const pages: PageState[] = PAGES.map((p, i) => {
      const alpha = pageEdgeAlpha(p.u, cam);
      return {
        ...p,
        lift: sm((tq - b.lift[i]) / 0.5),
        alpha,
        role: alpha < 0.6 ? 'texture' : 'subject',
        // one seal from each shore's side, pressed on 'both' and on 'signed' (the declaration both had signed)
        seals: i === 0 ? b.seals.map((s0, k) => ({ side: (k === 0 ? -1 : 1) as -1 | 1, u: clamp01((tq - s0) / 0.4) })) : undefined,
      };
    });
    const drop = sm((tq - (b.handset - 0.45)) / 0.85);
    const plates = win(t, b.handset + 0.3, b.handset + 0.9);
    const reveal = sm((t - (b.handset + 0.35)) / 1.1);
    // 'incidents': a pulse runs out along each cord from the handset to its shore (1.2 s) and lands there; the cord
    // keeps a faint even light behind it (the channel, open both ways)
    const pulse = clamp01((t - (b.incidents - 0.15)) / 1.2);
    const glow = win(t, b.incidents, b.incidents + 1.2) * (1 - 0.4 * win(t, b.incidents + 2.5, b.incidents + 4));
    const land = win(t, b.incidents + 0.85, b.incidents + 1.35) * (1 - 0.45 * win(t, b.incidents + 2.8, b.incidents + 4.5));
    const ends = handsetEnds();
    f.layer('L4', (c, env) => {
      jetty(c, env, {
        pages,
        lantern: 1,
        railLamp: 1,
        onBoard: (cc, e2) => {
          boardStones(cc, e2);
          handsetCords(cc, e2, {
            ends,
            // out to each city (where ch14-s05's threads landed), so the pulse is seen to travel to both shores
            farL: across(LAYERS.L1, LAYERS.L4, cam, { x: SHORE.L.cx + 40, y: HZ + 2 }),
            farR: across(LAYERS.L1, LAYERS.L4, cam, { x: SHORE.R.cx - 40, y: HZ + 2 }),
            reveal: drop >= 0.999 ? reveal : 0,
            glow,
            pulse: pulse > 0 && pulse < 1 ? pulse : 0,
            land,
            t,
          });
          handset(cc, e2, { drop, plates });
        },
      });
    });
    f.rim({ x: 0.3, y: -1 });
    f.practical({ x: LANTERN.x, y: LANTERN.y, kind: 'lamp', seed: 1406, intensity: 0.62, radius: 34 });
    const rl = railLampPoint();
    f.practical({ x: rl.x, y: rl.y, kind: 'lamp', seed: 1407, intensity: 0.55, radius: 26 });

    // ------------------------------------------------------------- the study window (screen-locked), then type
    windowFrame(f);
    const c = f.c;
    c.save();
    c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
    const env = { t, mood: f.mood, seed: 1415 };
    // lands on 'September' (its 0.6 s set-in centred on the word)
    placeStamp(c, { place: 'Washington', date: '23–25 September 2026', year: 2026, at: b.samepage - 0.3, dur: b.handset - 0.2 - b.samepage, fade: 0.45, align: 'right', x: 1210, y: 624 }, env);
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
  },
});
