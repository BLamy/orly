/**
 * ch08-s13b — two candles go out (hand-cut stencils at thirteen rings, fiddly nets after ten to fifteen years),
 * the fog question is answered in two pictures (the rivals' clean bowl on hand-cut stencils; the fog where the net
 * cut its own, many layers deep), LEARNED FEATURES is lit on 'deep learning', and the light finally finds Hinton
 * standing at his desk (candleAmber, STUDY LOCK → dawnGold on the stage; 38.25 s; crossfade in from the workshop).
 *
 * ROUND 2 (verdict, teacher T205 + art): THE FOG holds through the whole thesis line to 29.2 s; on 'cut its own'
 * (25.8) a 12 x 5 mosaic of learned stencils (ch08-s06 tiles) rises out of it, ≈ 30 % of the frame; on 'many layers
 * deep' (26.9) it stacks itself course by course into the ch08-s05 stepped tower, lit from base to crown on 'deep
 * learning' (28.4). The shelf returns only in the pause before L0832b: the new candle is lit at ≈ 30.0 (the CHM card
 * rises with it), the flame push at ≈ 31.5 lands on the stage under 'And Hinton?'. On the stage the pool widens from
 * 'Now' (35.9); Hinton steps out of the dark into it on 'found' (36.7) and is fully lit on 'him' (37.1), held to the
 * end (≈ 1.2 s: the clock is locked). Legibility: board cards and wax lettering are texture; the fog card (camera
 * pushed in on 'Why choose the fog?'), the re-inked tags (12 px) and a belief plate on 'fiddly-nets' are subjects.
 * ROUND 1 (review verdict, teacher + story; clock of 2026-10-12, L0832b now 'And Hinton?'): L0832 plays over two
 * cutaways instead of the shelf — 'Why' → THE CLEAN BOWL (sets/ch08-s13b-cutaways, duskRose: a ball rolls to its
 * one bottom; on 'stencils' the camera tilts down to the footing of hand-cut tin stencils, stamped BY HAND on 'cut')
 * ~5.3 s; 'In the fog' → THE FOG (winterBlue hills: pictures fall into the fog on 'data', it warms on 'fire', on
 * 'cut' a mosaic of learned stencils rises out of it, two more ranks rise behind on 'many layers', three depth
 * planes) ~4.6 s; back to the shelf on 'deep', where the new candle is lit on 'deep learning' with the fog card
 * lying answered at the dark sleeve's foot. The board unpin is cut (the shelf only carries L0826/L0831 and the new
 * candle). On the stage, the widening pool reaches HINTON standing at the far rim beside his desk on 'Now' (never
 * seated). The candle naming rule (CANDLE_CUES timing) is drawn by this shot's own cards for both candles (the
 * fiddly-nets span as spoken, 10–15 years by field; kit card off with named: {}). Near plane on the stage: the proscenium border and the footlight rail (L5).
 *
 * (The notes below describe the shelf passages; the 'choose'/'bowl' board unpin they mention is superseded above.)
 * CAMERA: reverse FLAME PUSH out of the expert-features candle's flame → SHELF (low macro) → a crane up to the
 * BOARD (the Q3 unpin as an insert) → down with the falling card to SHELF → a truck right to the new candle →
 * FLAME PUSH onto its CANDLE STAGE → the widen to the empty desk at the far rim of its pool.
 *   0 → 1.6     the workshop's last slant narrows to a flame; we pull back out of it (crossfadeMood dawnGold →
 *               candleAmber, 1.2 s): it is the expert-features candle's flame on the shelf, 12 rings burned,
 *               burning down its thirteenth; the 1990s candle beside it, its sleeve fifteen rings long
 *   'thirteen'  the expert-features candle gutters and goes out with 13 rings burned (1999 → 2012): a dark 13-ring
 *               sleeve, a thread of smoke; its hanging tag is re-inked 1999 – 2012 · 13
 *   'next'      in the smoke a ghost of the 2013 leaderboard forms: five lanterns hanging in a row, all small
 *               cathedrals; it thins away (no caption)
 *   'Beside it' a small paper tag hung from the shelf under the 1990s candle turns into the light:
 *               speech first: / Android voice search, July 2012
 *   'fiddly'    the 1990s candle's flame bends and goes out (16 rings, the frayed rim); its tag is re-inked
 *               mid-1990s – 2012 / 10–15 years, by field. The two dark sleeves stand side by side as two bars
 *   'choose'    the camera cranes up to the board: the hands unpin the oxblood-thread card WHY WOULD ANYONE CHOOSE
 *               THE FOG? from Q3 and let it go; it flutters down into the lamp's pool, the camera following
 *   'bowl'      it lands at the foot of the dark expert-features sleeve, beside a small hand-cut tin stencil
 *   'data'      the hands strike a match and light the NEW candle (its lettering painted on the wax, tag 2012, no
 *               sleeve, its flame on the top ring); the Computer History Museum card (its 'before' sentence) rises
 *               beside it and stays up to the end
 *   'own'       a faint learned-filter tile (a grey striped edge) glints in the new candle's wax
 *   'push'      FLAME PUSH into the new flame (candleAmber → dawnGold) and out onto its candle stage, the card held
 *   'desk'      the camera widens on the stage to the far rim of the pool: the plain wooden desk from ch04-s08,
 *               empty, its reading lamp dark since 1976 (L0832b is spoken over the dark desk)
 *   'Now'       the new candle's pool widens just enough to reach the desk; its little reading lamp clicks on
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down
 * one ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve.
 * TEXT: the speech tag (label, world-space, until the crane) and the CHM 'before' quote. Tags and the candle's
 * lettering are props.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, ShotScene } from '../../../film';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, anglepoiseLamp, chair, defineShot, mixLab, quoteCard, textRole, toLayer, toScreen, walkTo, withAlpha, withLife, writingDesk } from '../../../film';
import { FONT, legibleSize, softPlate } from '../../../film/silhouette/type';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { SPECS, cast } from '../cast';
import { STUDY, STUDY_WALL, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { BOARD, LIT_HEIGHT, Q_SLOTS, RING_PX, boardStateAt, candleNamingAt, shelfStateAt, type BoardState, type CandleView } from '../sets/studyState';
import { bowlScene, fogScene } from '../sets/ch08-s13b-cutaways';
import { valance } from '../sets/occluders';
import { beliefCandle, candleFlame, candleShelf, type ShelfDraw } from '../sets/beliefCandle';
import { DEFAULT_POOL, caseBoard, drawCard, oxblood, poolAt } from '../sets/caseBoard';
import { beliefLabel } from '../sets/ch07-s01-kit';
import { candleStage, type StageGeo } from '../sets/candleStage';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { cathedralLantern } from '../sets/ch08-s12-lanterns';
import { tinStencil } from '../sets/ch08-s13-workshop';
import { camKeys } from '../sets/ch03-s06-kit';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch02-s05b-util';
import { pulse } from '../sets/ch05-s01-kit';
import { screenPass } from '../sets/ch06-s01-kit';
import { createFrame } from '../../../film/core/frame';
import { makeCanvas } from '../../../film/silhouette/atmosphere';

const ID = 'ch08-s13b';
type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

// ------------------------------------------------------------------------------------------------ the shelf
const V0 = shelfStateAt(ID, 'start');
const V1 = shelfStateAt(ID, 'end');
const view = (vs: CandleView[], id: string) => vs.find((v) => v.id === id)!;
const SY = STUDY.shelf.y;
const SS = STUDY.shelf.s;
const EXP_X = candleX(V0, 'experts');
const FID_X = candleX(V0, 'fiddly');
const NEW_X = candleX(V1, 'learned');
const EXP0 = view(V0, 'experts');
const FID0 = view(V0, 'fiddly');
const NEW1: CandleView = { ...view(V1, 'learned'), tag: '2012' };
const NEW_UNLIT: CandleView = { ...NEW1, state: 'unlit' };
const EXP_FLAME0 = candleFlame({ x: EXP_X, y: SY, view: EXP0, s: SS });
const NEW_FLAME = candleFlame({ x: NEW_X, y: SY, view: NEW1, s: SS });
/** the small hand-cut tin stencil leaning in the empty slot between the two old candles */
const TIN = { x: (FID_X + EXP_X) / 2 - 22, y: SY - 22, s: 19 };
/** the fog card: its place on the oxblood thread (Q3) and where it lands */
const Q_DEF = { id: 'Q-Q3', w: 168, h: 44, icon: 'question' as const, text: 'WHY WOULD ANYONE CHOOSE THE FOG?' };
const LAND = { x: EXP_X + 6, y: SY - 22, rot: -0.1 };
/** the macro on the new candle: its flame and the whole of its wax lettering in frame, the lettering ≥ 22 px cap */
const MACRO = { x: 134, y: SY - 148, z: 590 };

// ------------------------------------------------------------------------------------------------ the stage
const ST_X = 430;
/** the stage candle a little smaller (narrower) than before so it reads as a candle, not a post; the desk larger */
const ST_S = 1.08;
const DESK_X = 1046;
/** Hinton's mark: the far rim of the pool, just past the desk's lamp end */
const HINTON_X = 1176;
/** his one step in from the dark (a walk on twos, settling on his mark) */
const HINTON_WALK = (at: number) => walkTo(SPECS.hinton, { x0: HINTON_X + 74, x1: HINTON_X, at, scale: 1.12 });
/** the stage pool a touch softer (flame strength into candleStage) */
const STAGE_FK = 0.84;
const STAGE_VIEW: CandleView = { ...NEW1 };

interface B {
  D: number;
  out: number;
  flip: number;
  speech: number;
  fiddly: number;
  /** cutaways: shelf → bowl, bowl → fog, fog → shelf */
  cutA: number;
  cutB: number;
  cutC: number;
  bowl: number;
  stencils: number;
  stampAt: number;
  data: number;
  fire: number;
  rank1: number;
  rank2: number;
  rank3: number;
  /** the fog's thesis picture: the mosaic stacks into the cathedral tower ('many layers deep'), lit on 'deep learning' */
  stack: number;
  tower: number;
  truck0: number;
  lit: number;
  own: number;
  deep: number;
  push0: number;
  stageT: number;
  desk: number;
  /** 'Thirty-six': the widen has landed on the dark desk at the far rim */
  thirtySix: number;
  lamp: number;
  /** Hinton steps out of the dark into the widening pool on 'found', fully lit on 'him' */
  found: number;
  him: number;
}
interface Scene extends ShotScene {
  b: B;
  study: (t: number) => Camera3;
  stage: (t: number) => Camera3;
  bowlCam: (t: number) => Camera3;
  fogCam: (t: number) => Camera3;
  SCAMS: Camera3[];
  GCAMS: Camera3[];
  BCAMS: Camera3[];
  FCAMS: Camera3[];
  named: (t: number) => Record<string, number>;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const W = (w: string) => T.word('L0832', w);
    // ROUND 2 (teacher T205): the fog plate holds through the whole thesis line ('... many layers deep: deep
    // learning', to 29.07 + a breath), so 'deep learning' lands on its own picture; we return to the shelf only for
    // the pause before L0832b, where the new candle is lit (the taper is already reaching as we cut back)
    const cutC = Math.max(T.wordEnd('L0832', -1) + 0.16, 29.2);
    // REVIEW (round 1): back on the shelf we are already in MACRO on the new candle; it is lit at cutC + 0.45 and the
    // camera HOLDS ≈ 0.95 s so its wax lettering (the new belief) reads at ≥ 22 px; the flame push lands on the stage
    // under 'And Hinton?', and the widen puts the empty, dark desk at the pool's far rim by 'Thirty-six'
    const lit = cutC + 0.45;
    const push0 = lit + 0.95;
    const stageT = push0 + 0.8;
    const thirtySix = T.word('L0832b', 'Thirty-six');
    const b: B = {
      D,
      out: T.beat('out'),
      flip: T.beat('flip'),
      speech: T.beat('speech'),
      fiddly: T.beat('fiddly'),
      cutA: W('Why') - 0.12,
      cutB: W('In') - 0.15,
      cutC,
      bowl: T.beat('bowl'),
      stencils: W('stencils'),
      stampAt: W('cut') - 0.05,
      data: T.beat('newcandle') - 0.2,
      fire: W('fire') - 0.1,
      rank1: W('cut#2') - 0.15,
      rank2: W('many') - 0.25,
      rank3: W('many') + 0.08,
      stack: W('many') - 0.2,
      tower: W('deep#2') - 0.15,
      truck0: cutC,
      lit,
      own: lit + 0.6,
      deep: lit + 0.25,
      push0,
      stageT,
      desk: stageT + 0.05,
      thirtySix,
      lamp: T.beat('desklamp'),
      found: T.word('L0832b', 'found'),
      him: T.word('L0832b', 'him'),
    };
    // ---- the study camera (keys: t, x, y, z)
    const S_A = { x: 700, y: 812, z: 440 };
    const study = camKeys([
      [0, EXP_FLAME0.x, EXP_FLAME0.y - 2, 880],
      [0.55, EXP_FLAME0.x - 6, EXP_FLAME0.y + 6, 780],
      [1.75, S_A.x, S_A.y, S_A.z],
      [b.out + 0.4, 706, 812, 452],
      [b.flip + 0.6, 712, 792, 444],
      [b.speech - 0.2, 650, 818, 456],
      // after 'fiddly' a held framing on both dark sleeves side by side (≈ 2 s), then on toward the question
      [b.fiddly + 0.6, 652, 836, 470],
      [b.fiddly + 2.6, 654, 838, 474],
      // 'Why choose the fog?': a slow push toward the board's top edge, the fog card on the thread readable
      [b.cutA, 664, 830, 500],
      // back from the fog straight into MACRO on the new candle (flame and the whole of its lettering in frame),
      // settling as it is lit, held so the lettering reads, then the flame push
      // (the candle on the left third, the CHM card in the open wall right of it; the answered fog card lies out of
      // frame left, so the macro carries two text items)
      [b.cutC, NEW_X + MACRO.x - 14, MACRO.y + 6, MACRO.z - 50],
      [b.lit, NEW_X + MACRO.x, MACRO.y, MACRO.z],
      [b.push0, NEW_X + MACRO.x - 10, MACRO.y - 4, MACRO.z + 12],
      [b.stageT, NEW_FLAME.x, NEW_FLAME.y - 4, 905],
    ]);
    // ---- the stage camera
    const g = stageGeoFor(1);
    // out of the flame and back to the whole pool: the candle at left, the empty desk dark at its far rim, landed by
    // 'Thirty-six'; a held drift through the line; on 'Now' the pool (and the frame) widen a little more
    const stage = camKeys([
      [b.stageT, ST_X, g.flame.y + 18, 820],
      [b.stageT + 0.3, ST_X + 30, g.flame.y + 60, 640],
      [b.thirtySix - 0.1, 742, 482, 290],
      [b.lamp, 752, 478, 236],
      [D, 772, 474, 120],
    ]);
    // ---- the cutaways' cameras: the bowl (a slow push, then a tilt down to its stencil footing on 'stencils');
    // the fog (a slow push toward the valley as the stencils rise)
    const bowlCam = camKeys([
      [b.cutA, 640, 344, 20],
      [b.stencils - 0.35, 640, 356, 60],
      [b.stencils + 0.9, 640, 452, 150],
      [b.cutB, 640, 462, 172],
    ]);
    // the fog: a slow push toward the valley as the pictures fall; on 'cut its own' the camera settles square on the
    // mosaic; on 'many layers deep' it eases back and up so the whole tower stands in the frame, then holds
    const fogCam = camKeys([
      [b.cutB, 700, 372, 10],
      [b.rank1, 660, 360, 70],
      [b.stack + 0.2, 650, 352, 64],
      [b.tower + 0.4, 640, 330, 20],
      [b.cutC, 640, 326, 10],
    ]);
    const BCAMS: Camera3[] = [];
    const FCAMS: Camera3[] = [];
    for (let i = 0; i <= 8; i++) {
      BCAMS.push(bowlCam(b.cutA + ((b.cutB - b.cutA) * i) / 8));
      FCAMS.push(fogCam(b.cutB + ((b.cutC - b.cutB) * i) / 8));
    }
    const SCAMS: Camera3[] = [];
    for (let i = 0; i <= 120; i++) SCAMS.push(study((b.stageT * i) / 120));
    const GCAMS: Camera3[] = [];
    for (let i = 0; i <= 10; i++) GCAMS.push(stage(b.stageT + ((D - b.stageT) * i) / 10));
    tl.hold(0, D);
    // the candle naming rule (studyState CANDLE_CUES timing), drawn by this shot's own cards: the fiddly-nets span
    // as spoken (10–15 years, by field) is not the kit's single date range, and both cards then share one style
    const named = (t: number): Record<string, number> => candleNamingAt(ID, T, t);
    return { tl, b, study, stage, bowlCam, fogCam, SCAMS: SCAMS.filter((c) => c.z < 600), GCAMS: GCAMS.filter((c) => c.z < 600), BCAMS, FCAMS, named };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t >= b.cutA && t < b.cutB) paintBowl(f, sc, t);
    else if (t >= b.cutB && t < b.cutC) paintFog(f, sc, t);
    else if (t < b.stageT) paintStudy(f, sc, t);
    else paintStage(f, sc, t);
    // REVIEW (round 1, palette): into and out of the fog the pictures DISSOLVE over 0.6 s (winterBlue ↔ the amber
    // of the bowl and the shelf cross in Lab on screen), never a hard cut: the other picture is painted into its own
    // frame and laid over at the crossing's weight (each side held at its edge time, so neither camera jumps)
    for (const [cut, before, after] of [
      [b.cutB, (g: Frame) => paintBowl(g, sc, Math.min(t, b.cutB - 1 / 48)), (g: Frame) => paintFog(g, sc, Math.max(t, b.cutB))],
      [b.cutC, (g: Frame) => paintFog(g, sc, Math.min(t, b.cutC - 1 / 48)), (g: Frame) => paintStudy(g, sc, Math.max(t, b.cutC))],
    ] as const) {
      const u = clamp01((t - (cut - XF / 2)) / XF);
      if (u <= 0 || u >= 1) continue;
      const k = sm(u);
      if (t < cut) overlayFrame(f, after, k);
      else overlayFrame(f, before, 1 - k);
    }
    // a soft dip at the bowl's join (never to full black): 0.2 s either side of the cut
    for (const cut of [b.cutA]) {
      const k = 1 - clamp01(Math.abs(t - cut) / 0.2);
      if (k <= 0.002) continue;
      screenPass(f, (c) => {
        c.fillStyle = withAlpha(f.mood.ink, 0.82 * sm(k));
        c.fillRect(0, 0, 1280, 720);
      });
    }
    // (round 2: no caption plates for the two old candles — their beliefs are painted on the wax, legible at this
    // framing, and the script's text rule keeps the shelf to the props)
    // the opening: the workshop's slanting light narrows to a single small flame (an iris and a closing god-ray
    // over the crossfade), then we pull back out of the flame as the dark lifts
    if (t < 1.6) openingIris(f, sc, t);
    // the truck to the new candle: the board's top edge (a cold window card) stays in the dark
    if (t >= b.cutC && t < b.stageT) {
      screenPass(f, (c) => {
        const g = c.createLinearGradient(0, 0, 0, 80);
        g.addColorStop(0, withAlpha(f.mood.ink, 0.92));
        g.addColorStop(1, withAlpha(f.mood.ink, 0));
        c.fillStyle = g;
        c.fillRect(0, 0, 1280, 80);
      });
    }
    // the bright pass over the push's cut: rises into the flame, peaks on the cut, falls as the stage pulls back
    const flash = t < b.stageT ? win(t, b.stageT - 0.28, b.stageT) : 1 - win(t, b.stageT, b.stageT + 0.3);
    const open = 1 - win(t, 0.6, 1.3);
    for (const [k] of [[flash], [open * 0.3]] as const) {
      if (k <= 0.002) continue;
      screenPass(f, (c) => {
        const P = f.mood;
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(640, 360, 20, 640, 360, 900);
        g.addColorStop(0, withAlpha(P.core, 0.8 * k));
        g.addColorStop(0.4, withAlpha(mixLab(P.core, P.halo, 0.5), 0.5 * k));
        g.addColorStop(1, withAlpha(P.halo, 0.22 * k));
        c.fillStyle = g;
        c.fillRect(0, 0, 1280, 720);
      });
    }
    // the CHM card: rises beside the new candle on 'data' and is held at screen level to the end
    screenPass(f, (c) => {
      quoteCard(c, {
        quote: 'Before AlexNet, almost none of the leading computer vision papers used neural nets.',
        speaker: 'Computer History Museum',
        source: '2025',
        // right of the flame through the shelf and the push; as the stage widens it glides left and up, clear of
        // Hinton at the pool's far rim
        x: lerp(990, 700, sm((t - b.desk) / 2.2)),
        y: lerp(214, 190, sm((t - b.desk) / 2.2)),
        width: 430,
        maxChars: 30,
        size: 27,
        at: b.lit - 0.1,
        stagger: 0.3,
      }, { t, mood: f.mood, seed: 2025 });
    });
  },
});

/** the fog's dissolves (s) */
const XF = 0.6;
function paintBowl(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  f.camera(sc.bowlCam(t));
  bowlScene(f, sc.BCAMS, {
    ball: clamp01((t - b.cutA - 0.15) / (b.bowl + 0.5 - b.cutA)),
    footing: win(t, b.stencils - 0.2, b.stencils + 0.6),
    stamp: clamp01((tq12(t) - b.stampAt) / 0.4),
  });
}
function paintFog(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  f.camera(sc.fogCam(t));
  fogScene(f, sc.FCAMS, {
    t,
    data: clamp01((t - b.data) / 1.6),
    fire: win(t, b.fire - 0.1, b.fire + 0.7),
    // 'cut its own': the mosaic of learned stencils rises out of the fog (over ~0.9 s, left to right)
    rise: clamp01((t - b.rank1) / 0.9),
    // 'many layers deep': the mosaic stacks itself, course by course, into the cathedral tower (ch08-s05)
    stack: clamp01((tq12(t) - b.stack) / 1.45),
    // 'deep learning': light climbs the tower from its base course to the crown
    light: clamp01((t - b.tower) / 0.9),
  });
}
/** paint another picture into its own frame and lay it over this one at alpha a */
let SUB: HTMLCanvasElement | null = null;
function overlayFrame(f: Frame, paint: (g: Frame) => void, a: number) {
  const c = f.c;
  const cv = c.canvas;
  if (!SUB || SUB.width !== cv.width || SUB.height !== cv.height) SUB = makeCanvas(cv.width, cv.height);
  const g = SUB.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
  g.clearRect(0, 0, SUB.width, SUB.height);
  const sf = createFrame({ c: g, pxScale: f.pxScale, t: f.t, fps: f.fps, frame: f.frame, seed: f.seed, mood: f.mood, weave: 0 });
  paint(sf);
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = a;
  c.globalCompositeOperation = 'source-over';
  c.filter = 'none';
  c.drawImage(SUB, 0, 0);
  c.restore();
}

interface TaperPose {
  tip: P;
  hand: P;
  edge: P;
  /** world px per screen px (keeps the hand a constant on-screen size) */
  u: number;
}
/** where the hand and taper are (L4 world), or null when off screen */
function taperPose(t: number, b: B, cam: Camera3): TaperPose | null {
  const t0 = b.lit - 0.95, t1 = b.lit - 0.06, t2 = b.lit + 0.22, t3 = b.lit + 0.78;
  if (t <= t0 || t >= t3) return null;
  const tq = tq12(t);
  // 0 = off the right edge … 1 = the taper's flame at the wick
  const k = tq < t1 ? 1 - Math.pow(1 - clamp01((tq - t0) / (t1 - t0)), 2.2) : tq < t2 ? 1 : 1 - Math.pow(clamp01((tq - t2) / (t3 - t2)), 1.8);
  const o = toLayer(LAYERS.L4, cam, 0, 0), p = toLayer(LAYERS.L4, cam, 100, 0);
  const u = (p.x - o.x) / 100;
  const rightEdge = toLayer(LAYERS.L4, cam, 1300, 0).x;
  const wick = { x: NEW_FLAME.x + 2, y: NEW_FLAME.y + 6 };
  const L = 300 * u; // the taper, ~300 screen px
  const off = rightEdge + 40 * u - wick.x; // how far right the tip starts
  const tip = { x: wick.x + (1 - k) * off, y: wick.y + (1 - k) * 30 * u };
  const hand = { x: tip.x + L * 0.97, y: tip.y + L * 0.2 };
  const edge = { x: rightEdge + 60 * u, y: hand.y + 70 * u };
  return { tip, hand, edge, u };
}
/** a recognisable hand-and-taper silhouette: a cuffed forearm from the right edge, fingers pinching a long thin
 *  lighting taper, its small flame at the tip */
function drawTaper(c: C, env: PaintEnv, p: TaperPose) {
  const m = env.mood;
  const ink = mixLab(env.fill('ink'), '#000000', 0.3);
  const u = p.u;
  const ang = Math.atan2(p.hand.y - p.tip.y, p.hand.x - p.tip.x);
  // the taper: a thin pale wax spill
  c.save();
  c.strokeStyle = mixLab(m.setHaze, m.halo, 0.35);
  c.lineCap = 'round';
  c.lineWidth = 3.2 * u;
  c.beginPath();
  c.moveTo(p.tip.x + Math.cos(ang) * 4 * u, p.tip.y + Math.sin(ang) * 4 * u);
  c.lineTo(p.hand.x - Math.cos(ang) * 6 * u, p.hand.y - Math.sin(ang) * 6 * u);
  c.stroke();
  // its flame
  c.fillStyle = m.core;
  c.beginPath();
  c.moveTo(p.tip.x, p.tip.y - 15 * u);
  c.quadraticCurveTo(p.tip.x + 5 * u, p.tip.y - 4 * u, p.tip.x, p.tip.y + 2 * u);
  c.quadraticCurveTo(p.tip.x - 5 * u, p.tip.y - 4 * u, p.tip.x, p.tip.y - 15 * u);
  c.fill();
  // the forearm (a sleeve with a cuff), from the right edge to the wrist
  const wr = { x: p.hand.x + 44 * u, y: p.hand.y + 12 * u };
  const nx = -(p.edge.y - wr.y), ny = p.edge.x - wr.x;
  const nl = Math.hypot(nx, ny) || 1;
  const w0 = 14 * u, w1 = 20 * u;
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(wr.x + (nx / nl) * w0, wr.y + (ny / nl) * w0);
  c.lineTo(p.edge.x + (nx / nl) * w1, p.edge.y + (ny / nl) * w1);
  c.lineTo(p.edge.x - (nx / nl) * w1, p.edge.y - (ny / nl) * w1);
  c.lineTo(wr.x - (nx / nl) * w0, wr.y - (ny / nl) * w0);
  c.closePath();
  c.fill();
  // the cuff
  c.save();
  c.translate(wr.x + 10 * u, wr.y + 3 * u);
  c.rotate(Math.atan2(p.edge.y - wr.y, p.edge.x - wr.x));
  c.fillStyle = mixLab(ink, m.set, 0.25);
  c.fillRect(-2 * u, -20 * u, 9 * u, 40 * u);
  c.restore();
  // the hand: back of the hand, the thumb and forefinger pinching the taper, the other fingers curled under
  c.save();
  c.translate(p.hand.x, p.hand.y);
  c.rotate(ang - Math.PI + 0.12);
  c.scale(u * 1.35, u * 1.35);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-34, -12);
  c.quadraticCurveTo(-18, -20, -2, -12); // knuckles of the back of the hand
  c.quadraticCurveTo(8, -8, 9, -2); // forefinger over the taper
  c.quadraticCurveTo(10, 3, 4, 4);
  c.lineTo(-2, 3);
  c.quadraticCurveTo(4, 8, 2, 13); // curled middle fingers
  c.quadraticCurveTo(-6, 18, -14, 15);
  c.quadraticCurveTo(-24, 16, -32, 12);
  c.quadraticCurveTo(-40, 4, -34, -12);
  c.closePath();
  c.fill();
  // the thumb, pressing from below
  c.beginPath();
  c.moveTo(-16, 6);
  c.quadraticCurveTo(-4, 10, 6, 6);
  c.quadraticCurveTo(8, 9, 4, 11);
  c.quadraticCurveTo(-8, 15, -18, 12);
  c.closePath();
  c.fill();
  c.restore();
  // a hairline rim on the hand's flame side
  glow(c, p.tip.x, p.tip.y - 6 * u, 22 * u, m.halo, 0.35);
  c.restore();
}

function stageGeoFor(pool: number): { flame: P } {
  const f = candleFlame({ x: ST_X, y: 640, view: STAGE_VIEW, s: ST_S });
  void pool;
  return { flame: f };
}

// ===================================================================================================== THE STUDY
function paintStudy(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.study(t);
  f.camera(cam);
  // STUDY LOCK: the crossfade in from the workshop's dawnGold; the push out toward the stage's dawnGold
  if (t < 2) f.setMood('candleAmber', { from: 'dawnGold', u: win(t, 0, 1.2) });
  else if (t > b.push0) f.setMood('dawnGold', { from: 'candleAmber', u: win(t, b.push0 + 0.1, b.stageT + 0.4) });
  studyRoom(f, { key: ID, cams: sc.SCAMS, outside: { mood: 'winterBlue', kind: 'city', city: 0.3 } });
  // value structure: the wall one step darker (~15 %) so the dark sleeves and the flames carry the frame
  f.layer(STUDY_WALL, (c, env) => {
    c.fillStyle = withAlpha(mixLab(env.mood.fg, '#000000', 0.3), 0.17);
    c.fillRect(-2000, -2000, 6000, 5000);
  });

  // ---- the two old candles: burning down their last ring, then out
  const expBurn = clamp01(t / (b.out - 0.15));
  // the gutter starts at 'thirteen' − 0.2 and the flame is dead ON 'thirteen' (+0.1)
  const expK = 1 - sm((t - b.out + 0.2) / 0.3);
  const expOut = t >= b.out + 0.12;
  const fidBurn = clamp01(t / (b.fiddly - 0.1));
  const bend = sm((t - b.fiddly + 0.12) / 0.3);
  const fidK = 1 - sm((t - b.fiddly - 0.12) / 0.38);
  const fidOut = t >= b.fiddly + 0.5;
  const views = V0.map((v) => {
    if (v.id === 'experts') return { ...(expOut ? view(V1, 'experts') : v), tag: '' };
    if (v.id === 'fiddly') return { ...(fidOut ? view(V1, 'fiddly') : v), tag: '' };
    return v;
  });
  // ---- the fog card: answered during the cutaways (off the board from 'Why'), lying at the dark sleeve's foot after
  const answered = t >= b.cutA;
  const startB = boardStateAt(ID, 'start');
  const boardState = answered ? { ...startB, questions: startB.questions.filter((q) => q.slot !== 'Q3') } : startB;
  // ---- the new candle: unlit, then lit on 'deep learning'
  const newK = t < b.lit ? 0 : Math.min(1, 0.5 + 0.5 * sm((t - b.lit) / 0.35));
  // the narrator's hand with a lighting taper: in from the right edge, the taper's flame to the wick on the name,
  // out again by lit + 0.8
  const taper = taperPose(t, b, cam);

  const shelfDraw: ShelfDraw = {
    ...STUDY.shelf,
    views,
    drawFlames: false,
    named: {},
    over: {
      experts: expOut ? { smoke: 1.6 } : { burn: expBurn, flame: Math.max(0.001, expK) },
      fiddly: fidOut ? { smoke: 1.4 } : { burn: fidBurn, flame: Math.max(0.001, fidK) },
    },
  };
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    flames: false,
    board: false,
    shelf: false,
    extra: (c, env) => {
      // ROUND 2 (legibility): the board's old cards and the candles' wax lettering are TEXTURE here (drawn on this
      // layer's own context so the role holds); the subjects are drawn as such: the fog card on the thread (pushed
      // in on 'Why choose the fog?'), the re-inked tags, and the fiddly-nets belief plate on its name
      textRole(c, 'texture', () => {
        caseBoard(c, { ...STUDY.board, state: boardState, pool: BOARD_POOL }, env);
        candleShelf(c, shelfDraw, env);
      });
      if (!answered) textRole(c, 'subject', () => q3Card(c, env, boardState));
      // the tin stencil leaning in the empty slot (the clean bowl stood on stencils cut by hand)
      const glint = 0.45 + 0.55 * pulse(t, b.cutC + 0.1, 0.25, 0.9);
      tinStencil(c, env, { x: TIN.x, y: TIN.y, s: TIN.s, kind: 'comb', rot: 0.12, lit: glint });
      // the ghost of the 2013 leaderboard in the snuffed candle's smoke (no caption)
      ghostBoard(c, env, t, b);
      // the two dark sleeves as two bars: deepened and ring-scored once each candle is out
      if (expOut) sleeveBar(c, env, EXP_X, view(V1, 'experts').rings, win(t, b.out + 0.4, b.out + 1.2));
      if (fidOut) sleeveBar(c, env, FID_X, view(V1, 'fiddly').rings, win(t, b.fiddly + 0.5, b.fiddly + 1.2));
      // hanging tags under the shelf: re-inked at the beats
      shelfTag(c, env, EXP_X, ['lit 1999'], ['1999 – 2012 · 13'], win(t, b.out + 0.55, b.out + 1.3), tq, 0);
      shelfTag(c, env, FID_X, ['lit mid-1990s'], ['mid-1990s – 2012', '10–15 years, by field'], win(t, b.fiddly + 0.6, b.fiddly + 1.5), tq, 1);
      // the speech tag, turning into the light as 'Beside it' begins
      speechTag(c, env, t, tq, b);
      // the new candle: unlit and waiting, then lit (lettering painted on the wax; tag 2012)
      // (blank wax and no tag until the hands strike: its belief and its year appear only as it is lit)
      const nv = t < b.lit ? NEW_UNLIT : NEW1;
      const letters = 0.9 * win(t, b.lit + 0.05, b.lit + 0.6);
      beliefCandle(c, { x: NEW_X, y: SY, view: t < b.lit ? { ...nv, tag: '' } : nv, s: SS, flame: newK, letters: 0, drawFlame: false }, env);
      waxCandle(c, { x: NEW_X, y: SY, view: nv, s: SS, flame: newK, letters: 0 }, env);
      // its lettering, a size up and in a firmer ink than the kit's (the new belief is READ in the macro)
      if (letters > 0.01) textRole(c, 'subject', () => waxLetters(c, env, NEW_X, SY, NEW1.text ?? '', letters));
      learnedTile(c, env, t, b, newK);
      // the fog card: in the hand (the hands draw it), falling, lying
      if (answered) fogCard(c, env);
      if (taper) {
        c.save();
        c.filter = `blur(${(0.8 * env.pxScale).toFixed(2)}px)`;
        drawTaper(c, env, taper);
        c.restore();
      }
    },
  });
  // ---- practicals: the old flames (with the gutter and the bend), the other live candles, the match, the new flame
  if (expK > 0.02) {
    const p = candleFlame({ x: EXP_X, y: SY, view: EXP0, s: SS, burn: expBurn });
    f.practical({ x: p.x, y: p.y - 4 + 5 * (1 - expK), kind: 'candle', seed: 1999, intensity: 0.95 * expK, radius: 30 + 14 * expK });
  }
  if (fidK > 0.02) {
    const p = candleFlame({ x: FID_X, y: SY, view: FID0, s: SS, burn: fidBurn });
    f.practical({ x: p.x + 5 * bend, y: p.y - 4 + 4 * bend, kind: 'candle', seed: 1996, intensity: 0.9 * fidK, radius: 28 + 12 * fidK });
  }
  for (const v of V0) {
    if (v.state !== 'live' || v.id === 'experts' || v.id === 'fiddly') continue;
    const p = candleFlame({ x: candleX(V0, v.id), y: SY, view: v, s: SS });
    f.practical({ x: p.x, y: p.y - 4, kind: 'candle', seed: 300 + v.slot * 7, intensity: 0.5, radius: 28 });
  }
  // the candles this shot is not about drop back into the haze (a soft veil of the wall's tone over each, on the
  // blurred near pass), so the expert-features and fiddly-nets sleeves read as the two bars side by side
  {
    const others = V0.filter((v) => v.id !== 'experts' && v.id !== 'fiddly' && v.id !== 'learned' && v.state !== 'unlit');
    f.layer('L5', (c, env) => {
      const veil = mixLab(mixLab(env.mood.set, env.mood.fg, 0.3), env.mood.haze, 0.25);
      for (const v of others) {
        const x = candleX(V0, v.id);
        const a = toScreen(LAYERS.L4, cam, x - 30 * SS, SY - LIT_HEIGHT * SS - 46);
        const z = toScreen(LAYERS.L4, cam, x + 30 * SS, SY - 3);
        if (z.x < -40 || a.x > 1320) continue;
        const A = toLayer(LAYERS.L5, cam, a.x, a.y), Z = toLayer(LAYERS.L5, cam, z.x, z.y);
        c.fillStyle = withAlpha(veil, 0.5);
        c.fillRect(A.x, A.y, Z.x - A.x, Z.y - A.y);
      }
    });
  }
  if (taper) f.practical({ x: taper.tip.x, y: taper.tip.y - 5, kind: 'candle', seed: 2011, intensity: 0.8 + 0.4 * pulse(t, b.lit - 0.05, 0.08, 0.4), radius: 30 });
  if (newK > 0) {
    const lift = 0.18 * pulse(t, b.deep, 0.5, 1.4);
    f.practical({ x: NEW_FLAME.x, y: NEW_FLAME.y - 2, kind: 'candle', seed: 2012, intensity: (0.92 + lift) * newK, radius: 44 + 14 * newK + 30 * lift });
  }
  // the near desk only while we are on the old candles and the board: past the truck its corner would sit as a
  // featureless dark block beside the new candle and the CHM card
  if (cam.z < 560 && t < b.truck0) studyNear(f, { key: ID, cams: sc.SCAMS, file: true });
}

/** the five small cathedral lanterns of 2013, forming in the snuffed candle's smoke and thinning away: drawn
 *  as smoke-light (pale bodies, lit openings, additive halo), hung from a wavering smoke thread just under the
 *  candles' tops so they read against the dark wall, not on the board's ledge */
function ghostBoard(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.flip - 0.2, b.flip + 0.7) * (1 - win(t, b.flip + 2.2, b.flip + 3.4));
  if (a <= 0.003) return;
  const m = env.mood;
  const top = SY - LIT_HEIGHT * SS;
  const rise = 14 * win(t, b.flip - 0.2, b.flip + 3.4);
  const y0 = top + 26 - rise;
  const smoke = mixLab(mixLab(m.haze, m.halo, 0.45), '#fff4e0', 0.15);
  const ghostEnv: PaintEnv = { ...env, fill: (r) => (r === 'ink' ? withAlpha(smoke, 0.55) : env.fill(r)) };
  c.save();
  // a soft column of smoke-light behind the row so it lifts off the wall
  glow(c, EXP_X, y0 + 52, 170, m.halo, 0.12 * a);
  // the smoke-drawn batten
  c.strokeStyle = withAlpha(smoke, 0.5 * a);
  c.lineWidth = 1.3;
  c.beginPath();
  for (let i = 0; i <= 28; i++) {
    const x = EXP_X - 140 + i * 10;
    const y = y0 + Math.sin(i * 0.7 + t * 1.3) * 2.2;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  for (let i = 0; i < 5; i++) {
    const x = EXP_X - 112 + i * 56 + Math.sin(t * 0.9 + i) * 2.5;
    const hy = y0 + 64 + (i % 2) * 5;
    const fade = 1 - 0.18 * i * win(t, b.flip + 2.0, b.flip + 3.4);
    c.strokeStyle = withAlpha(smoke, 0.4 * a * fade);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(x, y0);
    c.lineTo(x, hy - 40);
    c.stroke();
    cathedralLantern(c, ghostEnv, { x, y: hy, h: 40, act: 0.9, alpha: 0.85 * a * fade });
  }
  c.restore();
}

/** a paper tag hanging on a short thread from the shelf's front edge under a candle; re-inked (old → new) at u */
function shelfTag(c: C, env: PaintEnv, x: number, oldLines: string[], newLines: string[], u: number, tq: number, seed: number) {
  const m = env.mood;
  // read when re-inked ('ten to fifteen years, field by field'): 12 px at L4 = 22+ px cap at the shelf camera
  const size = 12;
  c.save();
  c.font = `500 ${size}px ${FONT.mono}`;
  const lines = u > 0.02 ? newLines : oldLines;
  const w = Math.max(...newLines.map((l) => c.measureText(l).width), ...oldLines.map((l) => c.measureText(l).width)) + 14;
  const h = 8 + lines.length * size * 1.3 + 2;
  const hy = SY + 16;
  c.translate(x + 4, hy);
  c.rotate(0.03 * Math.sin(tq * 1.1 + seed * 2) + (seed ? -0.02 : 0.02));
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(0, -6);
  c.lineTo(0, 6);
  c.stroke();
  const paper = mixLab(mixLab(m.halo, '#b08a52', 0.3), m.rim, 0.42);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-w / 2 + 2, 8, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, 6, w, h);
  c.fillStyle = withAlpha(m.fg, 0.7);
  c.beginPath();
  c.arc(0, 9, 1.2, 0, Math.PI * 2);
  c.fill();
  const ink = mixLab(m.ink, paper, 0.1);
  c.textAlign = 'center';
  // alphabetic baseline, centred by hand (measured cap heights stay true in every tool)
  c.textBaseline = 'alphabetic';
  const bl = size * 0.35;
  if (u <= 0.02) {
    c.fillStyle = ink;
    oldLines.forEach((l, i) => c.fillText(l, 0, 6 + 6 + size * 0.65 + i * size * 1.3 + bl));
  } else {
    // the old text struck through, the new inked over it left to right
    newLines.forEach((l, i) => {
      const n = Math.ceil(l.length * clamp01(u * 1.15 - i * 0.15));
      c.fillStyle = ink;
      c.fillText(l, 0, 6 + 6 + size * 0.65 + i * size * 1.3 + bl);
      // a paper mask over the part not yet inked (keeps the centring stable)
      const full = c.measureText(l).width;
      const done = c.measureText(l.slice(0, n)).width;
      c.fillStyle = paper;
      c.fillRect(-full / 2 + done, 6 + 6 + i * size * 1.3 - 1, full - done + 1, size * 1.3);
    });
  }
  c.restore();
}

/** the speech tag on its thread under the 1990s candle: turns into the light as 'Beside it' begins */
function speechTag(c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const turn = win(t, b.speech - 0.1, b.speech + 0.55);
  // on screen until 'choose' (the fog card): it fades over 0.4 s from fogcard − 0.2
  const gone = win(t, b.cutA - 0.6, b.cutA - 0.2);
  if (turn <= 0.01 || gone >= 0.999) return;
  const m = env.mood;
  const lines = ['speech first:', 'Android voice search,', 'July 2012'];
  const size = legibleSize(c, `500 14px ${FONT.mono}`, 14);
  c.save();
  c.font = `500 ${size}px ${FONT.mono}`;
  const w = Math.max(...lines.map((l) => c.measureText(l).width)) + 18;
  const h = 10 + lines.length * size * 1.35;
  // hung higher, from a pin on the wall left of the fiddly-nets candle (clear of its lettering), its foot above
  // the shelf lip
  const ax = FID_X - 122, ay = SY - 132;
  const len = 20;
  c.globalAlpha *= 1 - gone;
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(ax, ay - 4, 1.8, 0, Math.PI * 2);
  c.fill();
  c.translate(ax, ay);
  c.rotate(0.05 * Math.sin(tq * 0.9) * (1 - 0.6 * turn));
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(0, -4);
  c.lineTo(0, len);
  c.stroke();
  c.translate(0, len);
  c.scale(Math.max(0.03, turn), 1);
  const paper = mixLab(mixLab(m.halo, '#b08a52', 0.25), m.rim, 0.5 + 0.2 * turn);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-w / 2 + 2.5, 2.5, w, h);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(-w / 2, 5);
  c.lineTo(-w / 2 + 5, 0);
  c.lineTo(w / 2 - 5, 0);
  c.lineTo(w / 2, 5);
  c.lineTo(w / 2, h);
  c.lineTo(-w / 2, h);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(m.fg, 0.7);
  c.beginPath();
  c.arc(0, 3.6, 1.3, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(m.ink, paper, 0.1);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  lines.forEach((l, i) => c.fillText(l, 0, 6 + size * 0.75 + i * size * 1.35 + size * 0.35));
  c.restore();
}

/** the fog card, answered: lying at the foot of the dark expert-features sleeve, beside the tin stencil */
function fogCard(c: C, env: PaintEnv) {
  const { x, y, rot } = LAND;
  drawCard(c, Q_DEF, { x, y, k: STUDY.board.k, light: 0.75, pin: false, rot }, env);
  // its little oxblood clip-string still on it
  c.save();
  c.translate(x, y - 22);
  c.rotate(rot);
  c.strokeStyle = oxblood(env, 0.2);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(3, -8);
  c.stroke();
  c.restore();
}

/** the fiddly-nets belief plate: offset from its candle's top (screen px) */
const PLATE_DX = -250;
const PLATE_Y = 150;
/** the board's lamp pool, exactly as studyCase passes it (lamp 1) */
const BOARD_POOL = { ...DEFAULT_POOL, ...STUDY.pool, k: 1, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };
/** the fog card on the oxblood thread (Q3), drawn over the board's own copy as the subject (same place, same paper) */
function q3Card(c: C, env: PaintEnv, st: BoardState) {
  const q = st.questions.find((qq) => qq.slot === 'Q3');
  if (!q) return;
  const { x, y, k } = STUDY.board;
  const bx = Q_SLOTS.Q3;
  const qy = y + BOARD.threadY * k + Math.sin(((bx - 40) / 920) * Math.PI) * 10 * k;
  const light = poolAt(BOARD_POOL, bx, BOARD.threadY + 40);
  drawCard(c, { id: 'Q-Q3', w: 168, h: 44, icon: 'question', text: q.text }, { x: x + bx * k, y: qy + 10 * k + 22 * k, k, light, pin: false }, env);
}

/** the new candle's lettering, cut into the wax up its length (as waxCandle draws it, 9 px, firmer ink) */
function waxLetters(c: C, env: PaintEnv, x: number, y: number, text: string, a: number) {
  const m = env.mood;
  c.save();
  c.translate(x, y - 10 * SS);
  c.rotate(-Math.PI / 2);
  c.font = `500 ${9 * SS}px ${FONT.typewriter}`;
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.fillStyle = withAlpha(mixLab(m.ink, '#000000', 0.25), 0.92 * a);
  c.fillText(text, 0, 0.5 * SS);
  c.restore();
}

/** a faint learned-filter tile (a grey striped edge) glinting in the new candle's wax on 'own' */
function learnedTile(c: C, env: PaintEnv, t: number, b: B, newK: number) {
  const g = pulse(t, b.own - 0.2, 0.3, 1.4);
  const a = newK * (0.18 + 0.55 * g + 0.12 * win(t, b.own, b.own + 1.6));
  if (a <= 0.01) return;
  const m = env.mood;
  // above the end of the lettering, just under the flame: it glints in the macro hold
  const x = NEW_X, y = SY - LIT_HEIGHT * SS + 15;
  const s = 9;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.rotate(0.06);
  c.fillStyle = withAlpha(mixLab(m.setHaze, m.rim, 0.25), 0.9);
  c.fillRect(-s, -s, 2 * s, 2 * s);
  c.fillStyle = withAlpha(m.fg, 0.75);
  for (let i = -3; i <= 3; i++) {
    c.save();
    c.beginPath();
    c.rect(-s, -s, 2 * s, 2 * s);
    c.clip();
    c.translate(i * 6.5, 0);
    c.rotate(0.5);
    c.fillRect(-1.6, -s * 2, 3.2, s * 4);
    c.restore();
  }
  c.strokeStyle = withAlpha(m.rim, 0.5 + 0.5 * g);
  c.lineWidth = 0.9;
  c.strokeRect(-s, -s, 2 * s, 2 * s);
  c.restore();
  void RING_PX;
}

// ===================================================================================================== THE STAGE
function paintStage(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.stage(t);
  f.camera(cam);
  f.setMood('dawnGold', { from: 'candleAmber', u: win(t, b.push0 + 0.1, b.stageT + 0.4) });
  // the pool widens from 'Now' and reaches the far rim by 'found'
  const reach = sm((t - (b.lamp - 0.1)) / Math.max(0.6, b.found + 0.1 - (b.lamp - 0.1)));
  // the lamp clicks on: a short stutter on twos, then steady
  const lu = (tq - (b.lamp + 0.1)) / 0.35;
  const lampK = lu <= 0 ? 0 : lu < 0.25 ? 0.9 : lu < 0.5 ? 0.25 : lu < 1 ? 1 : 1;
  const pool = 1.0 + 0.72 * reach;
  const geo = candleStage(f, {
    key: ID,
    cams: sc.GCAMS,
    candle: STAGE_VIEW,
    candleX: ST_X,
    s: ST_S,
    flame: STAGE_FK,
    pool,
    letters: 0,
    draw: (c, env, g) => {
      // the candle as WAX (a lip, a melt cup and a drip, the lettering cut into it) over the stage's ink stub
      waxCandle(c, { x: ST_X, y: g.floorY, view: STAGE_VIEW, s: ST_S, flame: 1, letters: 0.85 }, env);
      desk(c, env, g, t, lampK);
      // Hinton (never seated): ROUND 2 (art): he steps out of the dark into the widening pool on 'found', and is
      // fully lit on 'him'; the lamp behind him then cuts his contour out of the wall. Held to the shot's end.
      const found = sm((t - (b.found - 0.12)) / (b.him + 0.04 - (b.found - 0.12)));
      const w = HINTON_WALK(b.found - 0.3)(t);
      const hp = w.walking ? w.pose : withLife({ ...w.pose }, tq, 1947, 0.7);
      // nothing stands in the dark before he steps: he emerges out of it as the step begins
      const emerge = sm((t - (b.found - 0.5)) / 0.35);
      c.save();
      c.globalAlpha *= emerge;
      cast.hinton.draw(c, {
        x: w.x,
        y: g.floorY,
        facing: 'left',
        pose: hp,
        scale: 1.12,
        ink: PUPPET_NEAR_BLACK,
        light: { x: -1, y: -0.3, floor: 0 },
        edgeRim: { x: -1, y: -0.35, px: 1.8, alpha: 0.9 * found },
      }, env);
      c.restore();
      // until 'found' the far rim of the pool is near black: a veil over the wall AND the figure (same value, so even
      // the stage's rim pass finds no contour); the widening pool pushes its edge back, 'found' dissolves it
      {
        const dk = 1 - found;
        if (dk > 0.003) {
          // the pool's falloff: everything right of the desk's lamp end sinks to near black, floor to flies
          const nb = mixLab(env.mood.ink, '#000000', 0.3);
          // the edge of the dark retreats as the pool widens from 'Now' (the desk and its lamp come into the light);
          // the figure past it stays dark until the veil itself lifts on 'found'
          const x0 = DESK_X + 20 + 90 * reach, x1 = HINTON_X - 40 + 24 * reach;
          const vg = c.createLinearGradient(x0, 0, x1, 0);
          vg.addColorStop(0, withAlpha(nb, 0));
          vg.addColorStop(1, withAlpha(nb, 0.97 * dk));
          c.fillStyle = vg;
          c.fillRect(x0, g.floorY - 1200, 3000, 1200 + 4);
        }
      }
    },
  });
  // the near plane: the stage's proscenium border along the top and its footlight rail along the bottom (L5, soft),
  // sliding past as the camera widens to the desk
  const endCam = sc.stage(b.D);
  f.layer('L5', (c, env) => {
    const a = toLayer(LAYERS.L5, endCam, 0, 0);
    const z = toLayer(LAYERS.L5, endCam, 1280, 720);
    f.cached(`${ID}/stage/L5/${env.mood.id}/${Math.round(a.x)},${Math.round(z.x)}`, Math.ceil(z.x - a.x + 400), Math.ceil(z.y - a.y + 300), (cc) => {
      cc.translate(-(a.x - 200), -(a.y - 100));
      // the proscenium's scalloped border along the top (it lifts out of frame while we are close to the flame)
      valance(cc, { x0: a.x - 200, x1: z.x + 200, y: a.y + 8, depth: 30 }, env);
      // the footlight rail: a low dark lip with small hooded footlights
      const ry = z.y - 34;
      cc.fillStyle = mixLab(env.fill('fg'), '#000000', 0.2);
      cc.fillRect(a.x - 200, ry, z.x - a.x + 400, z.y - ry + 200);
      for (let x = a.x + 60; x < z.x; x += 150) {
        cc.beginPath();
        cc.ellipse(x, ry, 22, 10, 0, Math.PI, 0);
        cc.fill();
      }
      cc.fillStyle = withAlpha(env.mood.rim, 0.25);
      cc.fillRect(a.x - 200, ry, z.x - a.x + 400, 1.5);
    }, { blur: 4 })(c, a.x - 200, a.y - 100);
  });
  if (lampK > 0) {
    const top = writingDesk.anchors(DESK_OPTS).top;
    const bulb = anglepoiseLamp.anchors({ ...LAMP_OPTS(top), lit: true }).bulb;
    f.practical({ x: bulb.x, y: bulb.y + 4, kind: 'lamp', seed: 1976, intensity: 1.05 * lampK, radius: 120 });
  }
  void geo;
}

/** the desk 25 % larger than before: the payoff object */
const DESK_OPTS = { x: DESK_X, y: 640, s: 1.28, variant: 'pedestal' as const, w: 132 };
const LAMP_OPTS = (top: P) => ({ x: top.x + 50, y: top.y, s: 1.3, reach: 0.3, aim: 0.1, flip: true, seed: 9 });

/** the plain wooden desk from ch04-s08 at the far rim of the pool: empty chair, the reading lamp */
function desk(c: C, env: PaintEnv, g: StageGeo, t: number, lampK: number) {
  const fy = g.floorY;
  const lit = g.inPool(DESK_X);
  // the chair, pushed in, empty
  chair(c, { x: DESK_X - 104, y: fy, s: 1.25, style: 'wooden', view: 'side', flip: true }, env);
  writingDesk(c, DESK_OPTS, env);
  const top = writingDesk.anchors(DESK_OPTS).top;
  // the reading lamp's warm spill on the wall behind the desk (under the lamp, before it is drawn)
  if (lampK > 0) {
    const bulb = anglepoiseLamp.anchors({ ...LAMP_OPTS(top), lit: true }).bulb;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const wg = c.createRadialGradient(bulb.x - 10, bulb.y - 20, 4, bulb.x - 10, bulb.y - 20, 210);
    wg.addColorStop(0, withAlpha(env.mood.halo, 0.32 * lampK));
    wg.addColorStop(0.5, withAlpha(env.mood.halo, 0.1 * lampK));
    wg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = wg;
    c.fillRect(bulb.x - 230, bulb.y - 240, 440, 400);
    c.restore();
  }
  anglepoiseLamp(c, { ...LAMP_OPTS(top), lit: lampK > 0.5 }, env);
  // the far half of the desk in shadow until the pool reaches it
  const sh = c.createLinearGradient(DESK_X - 90, 0, DESK_X + 64, 0);
  sh.addColorStop(0, withAlpha(env.mood.ink, 0));
  sh.addColorStop(1, withAlpha(env.mood.ink, 0.8 * (1 - lit)));
  c.fillStyle = sh;
  c.fillRect(DESK_X - 90, top.y - 3, 180, fy - top.y + 3);
  // the lamp's small pool on the desk top
  if (lampK > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(top.x + 20, top.y + 1);
    c.scale(1, 0.12);
    const pg = c.createRadialGradient(0, 0, 0, 0, 0, 120);
    pg.addColorStop(0, withAlpha(env.mood.core, 0.45 * lampK));
    pg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = pg;
    c.fillRect(-120, -120, 240, 240);
    c.restore();
  }
  void t;
  void toScreen;
}

/** the opening iris: a dark veil with a soft round aperture closing onto the expert-features flame, and a slanting
 *  god-ray (the workshop window's light) narrowing to it; the veil lifts as the camera pulls back out of the flame */
function openingIris(f: Frame, sc: Scene, t: number) {
  const cam = sc.study(t);
  const fp = candleFlame({ x: EXP_X, y: SY, view: EXP0, s: SS, burn: clamp01(t / (sc.b.out - 0.15)) });
  const p = toScreen(LAYERS.L4, cam, fp.x, fp.y);
  const close = sm(t / 0.65);
  const veil = 1 - win(t, 0.8, 1.55);
  if (veil <= 0.003) return;
  screenPass(f, (c) => {
    const m = f.mood;
    const R = lerp(170, 42, close) + 420 * win(t, 0.8, 1.55);
    const g = c.createRadialGradient(p.x, p.y, R * 0.35, p.x, p.y, R * 1.25);
    g.addColorStop(0, withAlpha(m.ink, 0));
    g.addColorStop(1, withAlpha(mixLab(m.ink, '#000000', 0.2), 0.95 * veil));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
    // the slanting window light, narrowing from a broad shaft to the flame
    const ray = (1 - win(t, 0.55, 1.1)) * veil;
    if (ray > 0.003) {
      const src = { x: p.x - 760, y: p.y - 520 };
      const dx = p.x - src.x, dy = p.y - src.y, L = Math.hypot(dx, dy);
      const nx = -dy / L, ny = dx / L;
      const w0 = lerp(300, 18, close), w1 = lerp(120, 4, close);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const lg = c.createLinearGradient(src.x, src.y, p.x, p.y);
      lg.addColorStop(0, withAlpha(m.halo, 0));
      lg.addColorStop(0.6, withAlpha(m.halo, 0.16 * ray));
      lg.addColorStop(1, withAlpha(m.core, 0.3 * ray));
      c.fillStyle = lg;
      c.filter = `blur(${(10 * f.pxScale).toFixed(1)}px)`;
      c.beginPath();
      c.moveTo(src.x + nx * w0, src.y + ny * w0);
      c.lineTo(p.x + nx * w1, p.y + ny * w1);
      c.lineTo(p.x - nx * w1, p.y - ny * w1);
      c.lineTo(src.x - nx * w0, src.y - ny * w0);
      c.closePath();
      c.fill();
      c.restore();
    }
  });
}

/** a put-out candle's ghost sleeve as a BAR: deepened and scored ring by ring (the years it was held) */
function sleeveBar(c: C, env: PaintEnv, x: number, rings: number, a: number) {
  if (a <= 0.003 || rings <= 0) return;
  const m = env.mood;
  const top = SY - LIT_HEIGHT * SS;
  const hw = 19 * SS;
  const h = rings * RING_PX * SS;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = withAlpha(mixLab(m.ink, '#000000', 0.2), 0.42);
  c.fillRect(x - hw, top, hw * 2, h);
  c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.5), 0.4);
  c.lineWidth = 1.2;
  c.beginPath();
  for (let k = 0; k <= rings; k++) {
    const y = top + k * RING_PX * SS;
    c.moveTo(x - hw, y);
    c.lineTo(x + hw, y);
  }
  c.moveTo(x - hw, top);
  c.lineTo(x - hw, top + h);
  c.moveTo(x + hw, top);
  c.lineTo(x + hw, top + h);
  c.stroke();
  c.restore();
}
