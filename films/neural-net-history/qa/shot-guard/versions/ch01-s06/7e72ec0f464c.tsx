/**
 * ch01-s06 — THE REWIND (montage, duskRose, ≈9.9 s; cut in from ch01-s05's full wide). Narration (round 3
 * re-take): L0114 "Our story starts all the way back in World War Two." · L0114b "To a lamp, in Chicago."
 *
 * 0 → goStone   the study EXACTLY as ch01-s05 leaves it (THE FULL WIDE, candleAmber, the same calls as its held wide:
 *               bare shelf plank, only W6 on the Wall, the night window in deep blue, lamp, file, chair). From the `rewind` beat it shudders like a stretched tape and
 *               s05's ghosts fade back IN (its fade played backwards) as the wide slips back the way it came. The
               tear catches the case card WHO TAUGHT IT? first and smears it into faint torn copies (texture
               in the rewind, never small reading type).
 * goStone…wick  five held paper-cut images, one per beat (0.75 s apart, the spacing the ch15 fast-forward
 *               reuses), each running BACKWARDS in strict reverse order of time (sets/ch01-s06-rewind.ts; the tape
 *               grade on the back plates, every hero cut-out at true ink): a Go stone lifts off a lit board into a
 *               hand · inside a dark tower two graphics cards' fans, backlit through the grille, spin down to still
 *               blades and the cyan status light goes out (≈ 1.75 s) · snow rises off a white field in streaks ·
 *               a motorised knob (knurled cap, shaft, motor) in a row of identical knobs unturns ≈ 90° · a paper
 *               lantern over the Chicago night goes dark, ember last, out ≈ 3.93 s under "Our story", so a beat of
 *               dark lantern holds before the cut on "starts" (the line enters 0.2 s into the fifth image). A torn-band tape shudder runs under all five and hits hardest on each
 *               cut. Nothing is captioned.
 * "starts"      the shudder stops on the last ember and we land in Chicago, 1940s (sets/ch01-s06-chicago.ts): a brick walk-up
 *               against a duskRose sky deepening to night, the El (ch02-s01's lattice girder) with a dark train
 *               crawling along it, a near roof and clothesline. On "Two" the stamp CHICAGO · 1940s types itself
 *               bottom left (sets/ch01-s06-stamp.ts, baseline y 604, above the caption band); on "Chicago" one
 *               lamp clicks on in a top-floor window: a soft halo, a warm catch on the sill and the fire escape's
 *               nearest rails (no beam), the shot's only warm accent. The camera trucks and pushes toward
 *               that window and hands its move to ch01-s07.
 */
import { Timeline } from '../../../core';
import { LAYERS, defineShot, toScreen } from '../../../film';
import type { Frame } from '../../../film';
import { caseStamp } from '../sets/ch01-s06-stamp';
import { STUDY, studyCase, studyRoom } from '../sets/study';
import { SLOTS, shelfStateAt, wallStateAt, type SlotId } from '../sets/studyState';
import { poolAt, DEFAULT_POOL } from '../sets/caseBoard';
import { candleShelf, shelfFlames, type CandleDraw, type ShelfDraw } from '../sets/beliefCandle';
import { study01Chair, study01Near, study01Shelves } from '../sets/ch01-s04-nearDesk';
import { ch01Card } from '../sets/ch01-s04-cards';
import { S05_END_CAM, backHaze, lampSpill, shelfBand, wideGrade, windowWash } from '../sets/ch01-s05-wide';
import { wallOfForecasts } from '../sets/wallOfForecasts';
import { REWIND_IMAGES, REWIND_STEP, paintRewindImage, tapeShudder } from '../sets/ch01-s06-rewind';
import { CHI_T0, chicagoNight } from '../sets/ch01-s06-chicago';

const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const STAMP = 'CHICAGO · 1940s';
/** the tape tear starts a hair before the `rewind` beat (3 frames), so the case card is fully torn on it */
const TEAR_LEAD = 0.13;

const SUSPECTS: SlotId[] = ['S1', 'S2', 'S3'];
/** ch01-s05's duration: the shared wide's fog wisps keep drifting on its clock across the cut */
const S05_D = 9.333;
const POOL = { ...DEFAULT_POOL, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y, r: STUDY.pool.r };
/** nothing on the shelf is labelled (as in ch01-s05's glimpse): no lettering, blank base tags */
const UNLETTERED: Record<string, Partial<CandleDraw>> = Object.fromEntries(shelfStateAt('ch01-s05', 'start').map((v) => [v.id, { letters: 0, view: { ...v, tag: v.tag ? ' ' : '' } }]));
/**
 * the study EXACTLY as ch01-s05 leaves it: the same calls as its held full wide (sets/ch01-s05-wide: the night
 * window in deep blue, the wall band behind the shelf, the amber backlight haze, the grade, the lamp's spill; the
 * same desk, lamp, file and chair; the same cards), so the cut continues the hold. Then the rewind: from just
 * before the `rewind` beat the tape tears, s05's ghosts fade back IN (its fade played backwards) and the wide
 * slips back the way it came.
 */
function paintStudy(f: Frame, t: number, rewindAt: number, goAt: number) {
  f.setMood('candleAmber');
  const back = sm((t - rewindAt) / 0.4);
  const full = S05_END_CAM;
  const cam = { ...full, x: full.x + 26 * back, y: full.y - 14 * back, z: full.z + 22 * back };
  f.camera(cam);
  const cams = [full, cam, { ...full, x: full.x + 30, y: full.y - 16, z: full.z + 26 }];
  studyRoom(f, { key: 'ch01-s06', cams, outside: { mood: 'winterBlue', kind: 'city', city: 0.3 } });
  study01Shelves(f, { key: 'ch01-s06', cams });
  windowWash(f, cam);
  const ghost = sm((t - rewindAt) / Math.max(0.05, goAt - rewindAt));
  // review r1 (study rewind): the ghost SLEEVES come back first and fast (≈ 0.6 by 0.3 s), and the shelf flames
  // are held back until the sleeves read (from ≈ 0.32 s), so no flame ever floats mid-wall as a stray spark
  const sleeveGhost = sm((t - rewindAt + 0.02) / 0.12);
  const flameGhost = sm((t - rewindAt - 0.07) / 0.15) * sleeveGhost;
  const views = shelfStateAt('ch01-s05', 'start');
  const shelf: ShelfDraw = { ...STUDY.shelf, views, ghost: 0, drawFlames: false, named: {}, over: UNLETTERED };
  const slips = wallStateAt('ch01-s05', 'start');
  const ghostSlots = slips.filter((v) => v.ghost).map((v) => v.slot);
  studyCase(f, {
    shot: 'ch01-s05',
    when: 'end',
    key: 'ch01-s06',
    shelf: false,
    wall: false,
    flames: false,
    board: { hide: [...SUSPECTS, 'K'] },
    extra: (c, env) => {
      const wallO = { ...STUDY.wall, slips, light: 1 };
      wallOfForecasts(c, { ...wallO, hide: ghostSlots }, env);
      if (ghost > 0.01) {
        c.save();
        c.globalAlpha *= ghost;
        wallOfForecasts(c, wallO, env);
        c.restore();
      }
      shelfBand(c, env);
      candleShelf(c, { ...shelf, only: [] }, env);
      if (sleeveGhost > 0.01) {
        c.save();
        c.globalAlpha *= 0.88 * sleeveGhost;
        candleShelf(c, shelf, env);
        c.restore();
      }
      // the cards: the first things the tape tear catches. From just before the rewind beat each smears sideways
      // into torn copies (each faint), so in the rewind the pinned cards are texture, never small reading type
      const tear = sm((t - (rewindAt - TEAR_LEAD)) / 0.1);
      for (const id of [...SUSPECTS, 'K'] as SlotId[]) {
        const S = SLOTS[id];
        const kx = STUDY.board.x + S.x, ky = STUDY.board.y + S.y;
        const kd = { x: kx, y: ky, light: poolAt(POOL, S.x, S.y) };
        if (tear <= 0) {
          ch01Card(c, S, kd, env);
          continue;
        }
        c.save();
        c.globalAlpha *= 1 - 0.92 * tear;
        ch01Card(c, S, kd, env);
        c.restore();
        for (const [dx, dy] of [[-12, 0], [-5, 1.5], [6, -1], [14, 0.5]] as const) {
          c.save();
          c.globalAlpha *= 0.24 * tear;
          ch01Card(c, S, { ...kd, x: kx + dx * tear, y: ky + dy * tear }, env);
          c.restore();
        }
      }
    },
  });
  if (flameGhost > 0.02) {
    for (const fl of shelfFlames(shelf)) f.practical({ x: fl.x, y: fl.y + 6, kind: 'candle', seed: fl.seed, intensity: 0.75 * flameGhost, radius: 36 });
  }
  // fog lying along the shelf, the amber backlight, the near desk + lamp + file, the lamp's spill, the grade and
  // the chair: exactly as ch01-s05's held wide
  const sy = toScreen(LAYERS.L4, cam, 0, STUDY.shelf.y).y;
  f.fog({ yCenter: sy - 10, height: 150, alpha: 0.4, drift: 8 });
  backHaze(f, 1);
  study01Near(f, { key: 'ch01-s06', cams, lamp: 1, file: true, alpha: 1 });
  lampSpill(f, cam, 1);
  wideGrade(f, cam, 1, t + S05_D);
  study01Chair(f, { key: 'ch01-s06', cams, alpha: 1 });
}

export default defineShot({
  id: 'ch01-s06',
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const starts = REWIND_IMAGES.map((id) => T.beat(id));
    const wickEnd = starts[4] + REWIND_STEP;
    return {
      tl,
      dur: T.duration,
      rewind: T.beat('rewind'),
      starts,
      /** L0114 re-narrated (round 3, user wording): "Our story starts all the way back in World War Two."
       *  then L0114b "To a lamp, in Chicago." Everything below rides T.word, so a slower re-take moves it.
       *  The line enters 0.2 s into the fifth image, so the wick's reverse plays out under "Our story…"
       *  (ember out ≈ 3.93); the cut to 1940s Chicago lands on "starts" (0.1 s ahead of the word), never
       *  before the fifth image's beat is spent and never later than "back" */
      chi: Math.min(T.word('L0114', 'back'), Math.max(wickEnd, T.word('L0114', 'starts') - 0.1)),
      /** CHICAGO · 1940s types itself on "Two" (the stamp beat), a hair ahead so the first key lands on it */
      stamp: T.word('L0114', 'Two') - 0.06,
      /** the window lamp clicks on (on the twos) on "Chicago" in L0114b */
      lampOn: T.word('L0114b', 'Chicago') - 0.04,
    };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const { starts, chi, dur } = scene;
    const T = t - dur; // Chicago's clock: seconds from the cut into ch01-s07
    let shudder = 0;
    if (t < starts[0] - 1e-3) {
      paintStudy(f, t, scene.rewind, starts[0]);
      shudder = 0.75 * sm((t - scene.rewind + TEAR_LEAD) / 0.12);
    } else if (t < chi - 1e-3) {
      // 1e-3 s of slack: the clock's shot starts are rounded to 0.1 ms, so the beat's own frame must not land a
      // hair short of its image and show the previous one for a frame
      const k = Math.min(4, Math.floor((t - starts[0] + 1e-3) / REWIND_STEP));
      const local = Math.max(0, t - starts[k]);
      // played backwards: forward progress runs 1 → 0 across the image's beat
      const u = 1 - local / REWIND_STEP;
      const uq = 1 - (Math.floor(local * 12 + 1e-9) / 12) / REWIND_STEP;
      paintRewindImage(f, REWIND_IMAGES[k], u, uq);
      // steady under the images, hardest across each cut (two frames either side)
      const toCut = Math.min(local, REWIND_STEP - local);
      shudder = 0.34 + 0.66 * (1 - sm(toCut / 0.09));
      if (k === 4) shudder *= 1 - sm((local - 0.24) / 0.2); // dies with the last ember (out ≈ 3.93 s, under "Our story")
    } else {
      // the duskRose sky deepens to night over ~1.6 s; the lamp clicks on (on the twos) on "Chicago"
      const night = sm((t - chi) / 1.7);
      const tq = Math.floor(t * 12 + 1e-9) / 12;
      const dt = tq - Math.floor(scene.lampOn * 12 + 1e-9) / 12;
      const lamp = dt < 0 ? 0 : dt < 1 / 12 ? 0.55 : dt < 2 / 12 ? 1.12 : 1;
      chicagoNight(f, { T: Math.max(CHI_T0, T), night, lamp });
      // the stamp types on "Two", holds, and is gone before the crossfade into the title
      const A = sm((t - scene.stamp) / 0.15) * (1 - sm((t - (dur - 0.55)) / 0.4));
      // round 4 (L0114 retake, "Two" 6.742): 1e-3 s of slack so the frame ON "Two" (local 6.75, which the rounded
      // shot start hands us as 6.74996) counts as its own twos step and the first key strikes on it, not a frame late
      caseStamp(f.c, STAMP, { t: t + 1e-3, at: scene.stamp, A, mood: f.mood });
    }
    tapeShudder(f, shudder, 1943, -1);
  },
});
