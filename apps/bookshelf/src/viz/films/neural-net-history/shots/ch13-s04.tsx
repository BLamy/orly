/**
 * ch13-s04 — not two teams: three camps. One wide paper stage, three lamps with overlapping pools: present harms at
 * one rim, LeCun at the other, and three 2018 Turing medallions over the men who shared them (duskRose; 24.25 s;
 * in: plain cut from the worry candle's stage).
 *
 * CAMERA: stage only. One continuous pull-back, then the pans, settling wide.
 *   0          close on the worry candle's pool: Hinton and Bengio inside it, facing the flame (as ch13-s03 left them)
 *   'three'    the pull-back reveals it is one of three lamps on a single wide stage; the pools overlap at their edges,
 *              and Hinton's long shadow falls across the present-harms pool too (people belonged to more than one lamp)
 *   'harms'    pan left: a plain reading lamp over a desk of papers; Timnit Gebru and Emily M. Bender in its light;
 *              name card; quote card “The harms from so-called AI are real and present…” (until the pan right)
 *   'lecun'    pan right: a hooded lamp barely lit; Yann LeCun at its rim, his back half to the worry candle; a server
 *              cabinet behind him, a small off-switch plate glinting; name card; quote card (until the medallions)
 *   'medals'   pull back wide: three small medallions stamped '2018' come down on threads above the stage; the name card
 *              2018 A.M. TURING AWARD · BENGIO · HINTON · LECUN
 *   'Two'…'apart'  two drift over Hinton and Bengio by the worry candle, the third over LeCun at his own lamp; settle
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv, Pose, ShotScene } from '../../../film';
import { candleFlame } from '../sets/beliefCandle';
import {
  FONT, LAYERS, PUPPET_NEAR_BLACK, anglepoiseLamp, defineShot, drawTracked, mixLab, nameCard, papers, serverRack, softPlate, textRole, toScreen, withAlpha, withLife, writingDesk,
} from '../../../film';
import { envelope, legibleSize, textColor } from '../../../film/silhouette/type';
import type { Palette } from '../../../film';
import { cast } from '../cast';
import { shelfStateAt, type CandleView } from '../sets/studyState';
import { frameOn, mixFrame } from '../sets/ch09-s03a-kit';
import { monotone } from '../sets/ch02-s05b-util';
import { BENGIO13, HINTON13, STAND13, nearPlane13, quoteCardAt, screen, stage13, tq12, win, sm, lerp, worryLetters } from '../sets/ch13-s01-kit';
import { BX13, CSX13, HX13, NEAR13, NEWEL13, SS13, STAGE_END13, STRIP_DONE, drawStrip, labHeads13, stageBays13 } from '../sets/ch13-s03-strip';

const ID = 'ch13-s04';
type C = CanvasRenderingContext2D;

const WORRY: CandleView = shelfStateAt(ID, 'start').find((v) => v.id === 'worry')!;
const SX = 640;
const SS = SS13;
const FY = 640;
// the worry lamp's pair (as ch13-s03 left them)
const HX = HX13;
const BX = BX13;
// round 1: the three pools overlap in DEPTH, not just side by side. The present-harms camp is a step DOWNSTAGE
// (lower on the boards, larger, sharper); the sceptic's lamp and cabinet a step UPSTAGE (smaller, hazier). Gebru,
// Bender and LeCun stand just outside the opening frame (it matches ch13-s03's last), so the pull-back REVEALS them
// at the frame edges as their lamps come up: no one dissolves in.
const HARMS_Y = FY + 28;
const HARMS_S = 1.08;
const DESK = { x: -30, y: HARMS_Y, s: HARMS_S, variant: 'pedestal' as const, w: 132 };
const GEBRU_X = -206;
const BENDER_X = 12;
// round 3: the reading lamp's pool is a real light (it was nearly invisible beside the candle's): brighter, paler
const HARMS_POOL = { x: -40, rx: 300, k: 0.9, y: HARMS_Y };
// the sceptic's lamp: a hooded floor lamp barely lit; LeCun inside its faint pool, facing out (his back half to the
// worry candle), clear of the server cabinet behind him
const UP_Y = FY - 22;
const UP_S = 0.88;
const HOOD = { x: 1232, y: UP_Y, h: 300 * UP_S };
const LECUN_X = 1290;
const LECUN_Y = FY - 10;
const RACK = { x: LECUN_X + 128, y: UP_Y - 4, s: 1.35 * UP_S };
// review r1 (lighting/story): the sceptic's lamp is 'barely lit': its pool at 40 % of round 3's, warmed to a neutral grey
// (the reading lamp's white pool stays the clear second light, the worry candle the warm centre)
// review r1 (LeCun's lamp at 'other'): it must read as a pool: a narrow cone down from the hood onto a floor ellipse that
// reaches under his feet at its rim; still the dimmest of the three lights
const HOOD_POOL = { x: 1236, rx: 200, k: 0.3, y: UP_Y };
const HOOD_I = 0.35;
/** the settle: wide (round 3: trucked left and a touch wider, so Gebru and Bender both stand clear of the left wing and
 *  LeCun of the right; the camera lowered, so the figures stand on the lower-third line over a dark lip) */
// review r1 (composition): the camera target raised (472 -> 380), so the floor and its pools sit lower in the wide and the
// empty dark apron shrinks from ~34 % to ~25 % of the frame (most of it lit floor, the lip below)
const WIDE: [number, number, number] = [548, 380, 0.68];
/** the worry candle's flame (the handoff into ch13-s06 pushes toward it) */
const WFLAME = candleFlame({ x: SX, y: FY, view: shelfStateAt('ch13-s04', 'start').find((v) => v.id === 'worry')!, s: SS });

/** the left-aligned lower-third cards start right of the newel's footprint (x < ~270 with its parallax) */
const NAME_X = 300;

const GEBRU = cast.gebru;
const BENDER = cast.bender;
const LECUN = cast['lecun-2020s'];

interface B {
  D: number;
  three: number;
  harms: number;
  lecun: number;
  medals: number;
  two: number;
  third: number;
  apart: number;
  /** 'Timnit' (L1310): the name card */
  timnit: number;
  /** 'The' (L1310, re-recorded with its quotation marks): the harms quote card lands on the quoted words */
  quoteA: number;
  /** 'Yann' (L1311): the name card */
  yann: number;
  /** 'called' (L1311): LeCun's quote card is up before he is quoted */
  quoteB: number;
}
interface Scene extends ShotScene {
  b: B;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
  /** round 3: each quote card anchored over its own camp (screen positions from the camp's toScreen() where the
   *  camera sits as the card is read) */
  cardA: { x: number; y: number };
  cardB: { x: number; y: number };
}

export default defineShot<Scene>({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      three: T.beat('three'),
      harms: T.beat('harms'),
      lecun: T.beat('lecun'),
      medals: T.beat('medals'),
      two: T.word('L1312', 'Two'),
      third: T.word('L1312', 'third'),
      apart: T.beat('split'),
      timnit: T.word('L1310', 'Timnit'),
      quoteA: T.word('L1310', 'The'),
      yann: T.word('L1311', 'Yann'),
      quoteB: T.word('L1311', 'called'),
    };
    // opens exactly where ch13-s03 left the worry candle's stage (640, 340, 1.08), then one continuous pull-back
    const keys: [number, number, number, number][] = [
      [0, ...STAGE_END13],
      [0.5, 640, 340, 1.045],
      [b.three + 1.0, ...WIDE],
      [b.harms - 0.05, WIDE[0] - 6, WIDE[1] - 4, 0.7],
      [b.harms + 2.4, 40, 428, 0.88],
      // review r1 (hierarchy): while each camp is quoted, a slow ~8 % push onto its lamp (< 6 % of frame width per s)
      [b.lecun - 0.6, 14, 438, 0.95],
      [b.lecun + 2.0, 1170, 424, 0.88],
      [b.medals - 0.4, 1196, 432, 0.95],
      [b.medals + 2.4, ...WIDE],
      // the handoff: in the last second a 3% ease toward the worry candle's flame (ch13-s06 opens inside a flame)
      [D - 1.1, WIDE[0] + 4, WIDE[1] - 2, 0.685],
      [D, lerp(WIDE[0] + 4, WFLAME.x, 0.25), lerp(WIDE[1] - 2, WFLAME.y, 0.2), 0.705],
    ];
    const fx = monotone(keys.map((k) => [k[0], k[1]]));
    const fy = monotone(keys.map((k) => [k[0], k[2]]));
    const fk = monotone(keys.map((k) => [k[0], Math.log(k[3])]));
    const cam = (t: number) => frameOn({ x: fx(t), y: fy(t) }, { x: 640, y: 360 }, Math.exp(fk(t)));
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 24; i++) CAMS.push(cam((D * i) / 24));
    // the harms card centred over Gebru, Bender and their desk; LeCun's over him and his hooded lamp (the camera has
    // landed on each camp by the time its card is read); the card's foot clears the heads by ~20 px
    const HEAD = 345; // a standing figure's height at scale 1 (floor to crown, L4 px)
    const over = (cm: Camera3, x: number, crownY: number) => {
      const p = toScreen(LAYERS.L4, cm, x, crownY);
      return { x: Math.max(330, Math.min(950, p.x)), y: Math.max(112, p.y - 96) };
    };
    // (laid out for the end of each push, where the heads stand highest in frame)
    const cardA = over(cam(b.lecun - 0.6), (GEBRU_X + BENDER_X) / 2 + 8, HARMS_Y - HEAD * HARMS_S);
    // (centred a little toward the hood, so the speaker line clears the cabinet's top)
    const cardB = over(cam(b.medals - 0.4), HOOD.x - 50, Math.min(LECUN_Y - HEAD * 0.95, HOOD.y - HOOD.h));
    tl.hold(0, D);
    return { tl, b, cam, CAMS, cardA, cardB };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const tq = tq12(t);
    f.camera(sc.cam(t));
    f.setMood('duskRose');
    const rackGlint = 0.35 + 0.65 * pulse(t, b.lecun + 0.3, 0.25, 1.2);
    // the other two lamps come up out of the dark as the pull-back begins (the cut from ch13-s03 shows one pool)
    const emerge = win(t, 0.1, 1.5);
    // review r1 (three camps, not four): from 'Three' the lab heads ease back into the haze over 1.5 s, on twos: still
    // solid, but texture at the back of the worry pool, so the eye counts three pools of people
    const labBack = sm((tq - b.three) / 1.5);
    const handoff = win(t, b.D - 1.1, b.D);
    // the five figures (their shadows go on the boards in `draw`; they are painted after every lamp, in `front`)
    const fig = (p: { draw: typeof HINTON13.draw }, x: number, facing: 'left' | 'right', pose: Pose, lightX: number, k = 1, y = FY, sc = 1, st = 0.95) => ({ p, x, facing, pose, lightX, k, y, sc, st });
    const life = (seed: number, head = 0) => withLife({ ...STAND13, angles: { ...STAND13.angles, head: (STAND13.angles.head ?? 0) + head } }, tq, seed, 0.85);
    const figs = [
      fig(HINTON13, HX, 'right', life(2023, 4), SX, 2.0, FY, 1, 1.25),
      fig(BENGIO13, BX, 'right', life(1964, 2), SX, 1.2),
      fig(GEBRU, GEBRU_X, 'right', life(1983, 2), HARMS_POOL.x, 0.9, HARMS_Y, HARMS_S),
      fig(BENDER, BENDER_X, 'left', life(1973, 4), HARMS_POOL.x, 0.9, HARMS_Y, HARMS_S),
      fig(LECUN, LECUN_X, 'right', life(1960, -2), HOOD_POOL.x, 1.1, LECUN_Y, 0.95),
    ];
    // upstage first, downstage last
    figs.sort((p, q) => p.y - q.y);
    stage13(f, {
      key: ID,
      cams: sc.CAMS,
      candle: WORRY,
      candleX: SX,
      s: SS,
      letters: 0,
      poolRx: 470,
      candleSx: CSX13,
      pools: [{ ...HARMS_POOL, k: HARMS_POOL.k * emerge, tint: READ_TINT }, { ...HOOD_POOL, k: HOOD_POOL.k * emerge, tint: HOOD_TINT }],
      motes: 0.7,
      // review r1 (continuity): ch13-s03's strip flies out upward like a theatre drop as the pull-back begins (never a
      // dissolve); the three lab heads stay as small solid figures at the back of the worry pool (in `front`)
      flat: (c, env) => stripFlyOut(c, env, t),
      // round 3: three distinct lights on the backdrop: a warm horizon glow behind the worry candle, a paler neutral one
      // behind the reading lamp, a cool dim one behind the hooded lamp
      // (the same two pale window bays as ch13-s03's stage, far behind)
      backdrop: (c, env) => {
        stageBays13(c, env);
        lampGlows(c, env, emerge);
        // review r1 (artistry): the haze behind each group ~20 % brighter, so all of them are backlit
        groupGlows(c, env, emerge, labBack);
      },
      // the near plane is painted below (ch13-s03's, crossfading to this shot's)
      depth: { fogA: 0.24, fogAY: 0.58 * 720, fogAH: 0.36 * 720, near: 0 },
      // review r1 (mood): the stage's rose grade, as ch13-s03 ends (stage13's roseGrade)
      grade: 1,
      draw: (c, env) => {
        textRole(c, 'texture', () => worryLetters(c, SX, FY, SS, 10.4, 0.85, env));
        // ---- the sceptic's corner, a step upstage (smaller, hazier): the cabinet, the hooded lamp
        const upEnv: PaintEnv = { ...env, fill: (r) => (r === 'ink' ? mixLab(env.fill('ink'), env.mood.haze, 0.3) : env.fill(r)) };
        c.save();
        c.filter = `blur(${(0.7 * env.pxScale).toFixed(2)}px)`;
        serverRack(c, { x: RACK.x, y: RACK.y, s: RACK.s, activity: 0.05, seed: 7 }, upEnv);
        offSwitch(c, upEnv, RACK.x - 14 * UP_S, RACK.y - 132 * UP_S, rackGlint);
        hoodedLamp(c, upEnv, HOOD.x, HOOD.y, HOOD.h);
        c.restore();
        hoodCone(c, env, emerge);
        // ---- the present-harms corner, a step downstage: desk, papers, the reading lamp
        writingDesk(c, DESK, env);
        const top = writingDesk.anchors(DESK).top;
        papers(c, { x: top.x - 30, y: top.y, s: 1.1 * HARMS_S, count: 5, seed: 23, mode: 'loose', tone: 'paper' }, env);
        anglepoiseLamp(c, { x: top.x + 44, y: top.y, s: 1.25 * HARMS_S, reach: 0.4, aim: 0.15, flip: true, lit: true, seed: 5 }, env);
        // ---- shadows first (all of them on the boards); the figures are painted after every lamp (`front`)
        readingPool(c, env, emerge);
        for (const g of figs) if (g.p !== HINTON13) castShadow(c, env, g.x, g.y, g.lightX, g.k, g.sc, g.st);
        // review r1 (teaching): Hinton's long shadow runs leftward across the boards INTO the reading lamp's white pool
        // (people belonged to more than one lamp), ~45 % with a soft edge; it reaches as the pull-back reveals the pool
        hintonShadow(c, env, emerge, figs.find((g) => g.p === HINTON13)!.pose);
        // ---- the medallions on their threads
        medallions(c, env, t, b);
      },
      // the reading lamp and the hooded lamp, with the flame, before the figures (their halos never grey them)
      lights: () => {
        const top = writingDesk.anchors(DESK).top;
        const bulb = anglepoiseLamp.anchors({ x: top.x + 44, y: top.y, s: 1.25, reach: 0.4, aim: 0.15, flip: true, lit: true, seed: 5 }).bulb;
        f.practical({ x: bulb.x, y: bulb.y + 4, kind: 'lamp', seed: 31, intensity: 0.85 * emerge, radius: 90 });
        f.practical({ x: HOOD.x - 26 * UP_S, y: HOOD.y - HOOD.h + 34 * UP_S, kind: 'lamp', seed: 47, intensity: HOOD_I * emerge, radius: 56 });
      },
      // review r1 (value): every figure is true near-black, painted after the lamps; the three lab heads stand solid at
      // the back of the worry pool (upstage first, downstage last)
      front: (c, env) => {
        labHeads13(c, env, t, -10, labBack);
        for (const g of figs) {
          const lx = g.lightX < g.x ? -1 : 1;
          // LeCun: a crisp rim from his own hooded lamp (up and to his left), so he reads against light, not haze
          // round 3 kit pass: every rim 2.5 px, warm (the kit's lapel notch, coat skirt, shirt V + tie, cuffs and
          // glints ride on the cast's own specs)
          const rim = g.p === LECUN ? { x: -1, y: -0.55, px: 2.5, alpha: 0.9, warm: 0.6 } : { x: lx, y: -0.35, px: 2.5, alpha: 0.9, warm: 0.65 };
          g.p.draw(c, { x: g.x, y: g.y, facing: g.facing, pose: g.pose, scale: g.sc, ink: PUPPET_NEAR_BLACK, light: { x: lx, y: -0.2, floor: 0.12 }, edgeRim: rim }, env);
        }
      },
    });
    // the near plane: it opens on exactly ch13-s03's (both wings, the lip and the newel, laid out for its last camera) and
    // over the pull-back its layout morphs to this shot's own (round 3: the dark lip takes the bottom ~10% of the settled
    // wide). Review r1: ONE near plane whose reference camera and sizes morph, never two crossfading at half alpha (a
    // figure behind a half-faded wing read as a ghost). Round 3 hand-off: the carved newel at lower left is scaled to
    // NEWEL13 (0.6: its finial tops out ~ y 500, under every face and the medallions), and the lower-third cards are set
    // right of it (NAME_X), so it never covers one. Review r1 (clutter): slid 40 px toward the frame edge and pushed back
    // into the dark, as ch13-s03 ends
    const nu = win(t, 0.3, 2.6);
    const refA = frameOn({ x: STAGE_END13[0], y: STAGE_END13[1] }, { x: 640, y: 360 }, STAGE_END13[2]);
    const refB = frameOn({ x: WIDE[0], y: WIDE[1] }, { x: 640, y: 360 }, WIDE[2]);
    nearPlane13(f, {
      ...NEAR13,
      curtainW: lerp(NEAR13.curtainW, 64, nu),
      lipY: lerp(NEAR13.lipY, 652, nu),
      newel: true,
      newelScale: NEWEL13,
      newelDx: -40,
      newelDark: 1,
      ref: mixFrame(refA, refB, nu),
    }, sc.CAMS);
    // the handoff: the worry candle's bloom rises as the camera eases toward it
    if (handoff > 0.01) f.practical({ x: WFLAME.x, y: WFLAME.y + 4, kind: 'candle', seed: 2099, intensity: 0.55 * handoff * handoff, radius: 150 });
    const env = { t, mood: f.mood };
    screen(f, (c) => {
      nameCard(c, { name: 'Timnit Gebru · Emily M. Bender', role: '', at: b.timnit - 0.1, dur: 3.6, x: NAME_X }, env);
      // quote cards on a soft ink plate, rising as the narrator reaches the quoted words (L1310 and L1311 were
      // re-recorded with their quotation marks: 'The harms…' and 'preposterously ridiculous')
      const qa = b.quoteA - 0.3, qb = b.quoteB - 0.3;
      // round 1: the harms card sits above the head line (its attribution clear of the heads and the worry flame)
      // round 3: each card sits over its OWN camp: the harms card over Gebru, Bender and the desk at the reading lamp
      const A = sc.cardA, Bq = sc.cardB;
      plate(c, A.x, A.y, 620, 230, f.mood.ink, 0.42 * win(t, qa, qa + 0.4) * (1 - win(t, b.lecun - 0.2, b.lecun + 0.4)));
      // review r1: the open-quote mark and the first words ink together (quoteCardAt: each line at its own time)
      textRole(c, 'subject', () => quoteCardAt(c, {
        quote: 'The harms from so-called AI are real and present…',
        speaker: 'Gebru, Bender & McMillan-Major',
        x: A.x, y: A.y, width: 470, maxChars: 30, size: 28, at: qa, dur: b.lecun - qa, lineAt: [qa, qa + 0.3],
      }, env));
      // round 3: up a full ~3.5 s
      nameCard(c, { name: 'Yann LeCun', role: '', at: b.yann - 0.1, dur: 4.3, align: 'right' }, env);
      // LeCun's card is up on 'called', before he is quoted: over him and his hooded lamp
      plate(c, Bq.x, Bq.y, 580, 210, f.mood.ink, 0.42 * win(t, qb, qb + 0.4) * (1 - win(t, b.medals - 0.3, b.medals + 0.3)));
      textRole(c, 'subject', () => quoteCardAt(c, {
        quote: '…just preposterously ridiculous.',
        speaker: 'Yann LeCun',
        x: Bq.x, y: Bq.y, width: 440, maxChars: 30, size: 30, at: qb, dur: b.medals - qb, lineAt: [qb, qb + 0.3],
      }, env));
      // raised clear of the bottom 12%. Round 2 (historian + art): the three names are set in the card's own small
      // caps at the title's size (>= 22 px cap), not the small italic role line
      const tAt = b.medals + 0.7, tDur = 4.6;
      // review r1: below the feet line of the lowered wide (the floor now sits at ~y 537)
      nameCard(c, { name: '2018 A.M. Turing Award', role: '', at: tAt, dur: tDur, x: NAME_X, y: 578 }, env);
      turingNames(c, env, tAt, tDur, NAME_X, 578);
    });
  },
});

/** the hooded lamp: a tall floor stand with a deep hood pointing down and to the left, barely lit */
function hoodedLamp(c: C, env: PaintEnv, x: number, y: number, h: number) {
  const ink = env.fill('ink');
  c.save();
  c.fillStyle = ink;
  // weighted base and pole
  c.beginPath();
  c.ellipse(x, y - 3, 30, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - 2.5, y - h, 5, h);
  // the arm, the hood (a deep cone, mouth turned down-left)
  c.fillRect(x - 30, y - h, 32, 4);
  c.translate(x - 30, y - h + 2);
  c.rotate(0.5);
  c.beginPath();
  c.moveTo(-6, -10);
  c.lineTo(10, -10);
  c.lineTo(26, 40);
  c.quadraticCurveTo(2, 50, -22, 40);
  c.closePath();
  c.fill();
  // the faint glow at its mouth
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(2, 44, 0, 2, 44, 30);
  g.addColorStop(0, withAlpha(mixLab(env.mood.halo, HOOD_TINT, 0.6), 0.2));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(-30, 14, 64, 60);
  c.restore();
}

/** a small off-switch plate on the cabinet's flank, glinting */
function offSwitch(c: C, env: PaintEnv, x: number, y: number, g: number) {
  c.save();
  c.fillStyle = mixLab(env.mood.setHaze, env.mood.rim, 0.25 + 0.3 * g);
  c.fillRect(x - 9, y - 13, 18, 26);
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 3, y - 8, 6, 9);
  c.fillStyle = withAlpha(env.mood.core, 0.6 * g);
  c.fillRect(x - 9, y - 13, 18, 1.4);
  if (g > 0.4) {
    c.globalCompositeOperation = 'lighter';
    const r = 22 * g;
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, withAlpha(env.mood.core, 0.45 * (g - 0.3)));
    gr.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = gr;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.restore();
}

/** three medallions, each stamped '2018', on threads from the flies: they come down together over the worry candle;
 *  on 'Two signed' two drift to hang over Hinton and Bengio, on 'The third stood apart' the third swings across to
 *  hang over LeCun at his own lamp. Each disc catches a rim of light from its nearest lamp. */
const LAMPS = [{ x: SX, y: 360 }, { x: SX, y: 360 }, { x: HOOD.x - 26, y: FY - HOOD.h + 34 }];
/** review r1 (medallions): 1.7x larger (r 21 -> 36 L4 px, ~50 px across at 1080 in the wide) */
const MED_R = 36;
/** each man's crown (L4), standing: the medallions settle ~70 L4 px (~70 px at 1080 in the wide) above them */
const crownOf = (p: typeof HINTON13, x: number, y: number, scale = 1) => p.bounds({ x, y, facing: 'right', pose: STAND13, scale }).y;
const MED_DEST = [
  { x: HX + 2, y: crownOf(HINTON13, HX, FY) - 70 - MED_R },
  { x: BX + 2, y: crownOf(BENGIO13, BX, FY) - 70 - MED_R },
  { x: LECUN_X + 4, y: crownOf(LECUN, LECUN_X, LECUN_Y, 0.95) - 70 - MED_R },
];
function medallions(c: C, env: PaintEnv, t: number, b: B) {
  const drop = sm((t - b.medals) / 1.3);
  if (drop <= 0.002) return;
  const tq = tq12(t);
  const homes = [{ x: 562, y: 150 }, { x: 640, y: 142 }, { x: 718, y: 150 }];
  const dest = MED_DEST;
  // two drift to Hinton and Bengio on 'Two signed'; the third swings across to LeCun on 'The third stood apart' and is
  // settled by ~23.9 s (at least 0.7 s of stillness before the outgoing transition)
  const two = b.two - 0.1, third = b.third - 0.3, end3 = Math.min(b.apart - 0.06, b.D - 1.05);
  const starts = [two, two + 0.08, third];
  const ends = [two + 0.65, two + 0.08 + 0.62, end3];
  const m = env.mood;
  const r = MED_R;
  for (let i = 0; i < 3; i++) {
    const u = sm((tq - starts[i]) / (ends[i] - starts[i]));
    // a short damped settle (3 px, ~0.25 s), then still
    const since = tq - ends[i];
    const settle = since > 0 ? Math.sin(since * 22) * 3 * Math.exp(-since * 14) : 0;
    // a gentle sway only while they hang together over the candle; none once each has arrived
    const sway = Math.sin(t * 1.3 + i * 2) * 2 * (1 - u) + settle;
    const x = lerp(homes[i].x, dest[i].x, u) + sway;
    const y = lerp(-180, lerp(homes[i].y, dest[i].y, u) - 26 * Math.sin(Math.PI * u), drop);
    const lamp = i === 2 && u < 0.5 ? LAMPS[0] : LAMPS[i];
    const ink = env.fill('ink');
    // the thread to the flies
    c.strokeStyle = withAlpha(m.rim, 0.35);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - sway * 0.6, -700);
    c.lineTo(x, y - r - 40);
    c.stroke();
    // the ribbon: a broad folded band, its lower edge notched in a V, a pale centre stripe (a medal, not a socket)
    const rw = 30, rt = y - r - 40, rb = y - r - 6;
    c.fillStyle = mixLab(ink, m.set, 0.3);
    c.beginPath();
    c.moveTo(x - rw / 2, rt);
    c.lineTo(x + rw / 2, rt);
    c.lineTo(x + rw / 2, rb);
    c.lineTo(x, rb - 6);
    c.lineTo(x - rw / 2, rb);
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.5), 0.45);
    c.fillRect(x - 2.5, rt, 5, rb - rt - 5);
    c.fillStyle = withAlpha(m.rim, 0.4);
    c.fillRect(x - rw / 2, rt, rw, 1.2);
    // the suspension ring
    c.strokeStyle = mixLab(m.halo, m.set, 0.4);
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y - r - 3, 4, 0, Math.PI * 2);
    c.stroke();
    // the disc: dark struck metal, a flat face
    const ang = Math.atan2(lamp.y - y, lamp.x - x);
    const face = c.createLinearGradient(x + Math.cos(ang) * r, y + Math.sin(ang) * r, x - Math.cos(ang) * r, y - Math.sin(ang) * r);
    face.addColorStop(0, mixLab(m.set, m.halo, 0.42));
    face.addColorStop(1, mixLab(m.set, m.fg, 0.55));
    c.fillStyle = face;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = mixLab(m.fg, m.set, 0.3);
    c.lineWidth = 1.6;
    c.stroke();
    // the lit rim on the lamp side, and one edge glint
    c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.35), 0.95);
    c.lineWidth = 3;
    c.beginPath();
    c.arc(x, y, r - 1.2, ang - 0.9, ang + 0.9);
    c.stroke();
    const gx = x + Math.cos(ang - 0.35) * (r - 1), gy = y + Math.sin(ang - 0.35) * (r - 1);
    c.save();
    c.globalCompositeOperation = 'lighter';
    // review r1: a warm rim glint, larger
    const gg = c.createRadialGradient(gx, gy, 0, gx, gy, 13);
    gg.addColorStop(0, withAlpha(mixLab(m.core, m.halo, 0.25), 0.95));
    gg.addColorStop(0.35, withAlpha(m.halo, 0.45));
    gg.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = gg;
    c.fillRect(gx - 13, gy - 13, 26, 26);
    c.restore();
    // the struck inner ring and the '2018' stamp (raised: a dark cut with a lit upper lip)
    c.strokeStyle = withAlpha(m.fg, 0.5);
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x, y, r - 6, 0, Math.PI * 2);
    c.stroke();
    c.font = `700 ${(r * 0.66).toFixed(1)}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.7);
    c.fillText('2018', x - 0.5, y + r * 0.2 - 0.6);
    c.fillStyle = mixLab(m.fg, '#000000', 0.2);
    c.fillText('2018', x, y + r * 0.2);
  }
}

/** the Turing card's second line: BENGIO · HINTON · LECUN in the name card's small caps, at the title's size, under its
 *  rule (the card's plate covers it) */
function turingNames(c: C, env: { t: number; mood: Palette }, at: number, dur: number, x: number, y: number) {
  const A = envelope(env.t, at + 0.3, dur - 0.3, 0.4);
  if (A <= 0.003) return;
  const text = 'bengio · hinton · lecun';
  const size = legibleSize(c, `600 26px ${FONT.sc}`, 26, text);
  const k = Math.min(1, Math.max(0, (env.t - at - 0.3) / 0.5));
  c.save();
  c.globalAlpha = A * (k * k * (3 - 2 * k)) * 0.95;
  c.fillStyle = textColor(env.mood);
  textRole(c, 'subject', () => drawTracked(c, text, x, y + 11 + size + 14, { font: `600 ${size}px ${FONT.sc}`, size, tracking: 0.1, align: 'left' }));
  c.restore();
}

/** a soft ink plate under screen-locked text over art */
function plate(c: C, x: number, y: number, w: number, h: number, ink: string, a: number) {
  if (a <= 0.003) return;
  softPlate(c, x, y, w, h, ink, a);
}

/** ch13-s03's statement strip, flown out upward like a theatre drop (review r1: no dissolve). It starts exactly where
 *  ch13-s03 left it and accelerates up into the flies, gone above the frame's top by ~1.6 s, as 'Three' lands */
function stripFlyOut(c: C, env: PaintEnv, t: number) {
  const u = Math.min(1, Math.max(0, t / 1.6));
  if (u >= 0.999) return;
  const e = u * u * (1.6 - 0.6 * u);
  drawStrip(c, env, t, STRIP_DONE, { rise: 560 * e });
}

/** the haze behind each group, ~20 % brighter (L2, additive): the worry pair, the present-harms pair, LeCun */
function groupGlows(c: C, env: PaintEnv, emerge: number, labBack: number) {
  const m = env.mood;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const glow = (x: number, y: number, rx: number, ry: number, col: string, a: number) => {
    if (a <= 0.003) return;
    c.save();
    c.translate(x, y);
    c.scale(rx / ry, 1);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, ry);
    g.addColorStop(0, withAlpha(col, a));
    g.addColorStop(0.55, withAlpha(col, a * 0.5));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(-ry, -ry, 2 * ry, 2 * ry);
    c.restore();
  };
  const warm = mixLab(m.halo, m.rim, 0.35);
  glow((HX + BX) / 2, 430, 260, 210, warm, 0.13);
  glow(870, 440, 200, 170, warm, 0.08 * (1 - labBack));
  glow((GEBRU_X + BENDER_X) / 2, 440, 280, 210, mixLab(READ_TINT, m.halo, 0.4), 0.13 * emerge);
  glow(LECUN_X, 440, 200, 190, mixLab(HOOD_TINT, m.halo, 0.5), 0.11 * emerge);
  c.restore();
}

/** Hinton's long shadow: his own figure laid along the boards from his heels, away from the worry flame, across into the
 *  reading lamp's white pool (people belonged to more than one lamp). Review r1: ~60 %, soft-edged, long enough that its
 *  head lies in the desk's light (tip at x ~ -20, inside the reading pool), so the pan on 'harms' frames it touching
 *  Gebru and Bender's light */
function hintonShadow(c: C, env: PaintEnv, k: number, pose: Pose) {
  if (k <= 0.01) return;
  c.save();
  c.filter = `blur(${(2 * env.pxScale).toFixed(2)}px)`;
  // it reaches as the pull-back reveals the pool: the kit's long-shadow shear, but with ~2.5x the floor depth across the
  // body (the plain shear laid him down as a hairline at this distance), ~60 % at its strongest
  const len = (1.3 + Math.min(1.4, Math.abs(HX - SX) / 300)) * 1.06;
  c.globalAlpha *= 0.6 * k;
  c.translate(HX, FY + 2);
  c.transform(0, 0.4, len, -0.1 * len, 0, 0);
  HINTON13.draw(c, { x: 0, y: 0, facing: 'right', pose, ink: PUPPET_NEAR_BLACK }, env);
  c.restore();
}

/** the hooded lamp's narrow cone down onto the boards and its floor ellipse (additive, neutral grey, the dimmest light):
 *  the ellipse's right rim runs under LeCun's feet */
function hoodCone(c: C, env: PaintEnv, k: number) {
  const a = HOOD_I * k;
  if (a <= 0.01) return;
  const m = env.mood;
  const col = mixLab(HOOD_TINT, m.halo, 0.35);
  const mx = HOOD.x - 49, my = HOOD.y - HOOD.h + 42;
  // (the boards start at the stage floor line: the ellipse lies there, centred a step right of the pole, under him)
  const fx = 1258, fy = FY + 5;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.filter = `blur(${(3 * env.pxScale).toFixed(2)}px)`;
  const g = c.createLinearGradient(0, my, 0, fy);
  g.addColorStop(0, withAlpha(col, 0.42 * a));
  g.addColorStop(0.6, withAlpha(col, 0.2 * a));
  g.addColorStop(1, withAlpha(col, 0.12 * a));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(mx - 8, my);
  c.lineTo(mx + 10, my);
  c.lineTo(fx + 70, fy);
  c.lineTo(fx - 110, fy);
  c.closePath();
  c.fill();
  c.filter = 'none';
  c.translate(fx, fy + 4);
  c.scale(1, 0.15);
  const R = 128;
  const e = c.createRadialGradient(0, 0, 0, 0, 0, R);
  e.addColorStop(0, withAlpha(col, 1.3 * a));
  e.addColorStop(0.7, withAlpha(col, 0.85 * a));
  e.addColorStop(0.9, withAlpha(col, 0.35 * a));
  e.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = e;
  c.fillRect(-R, -R, 2 * R, 2 * R);
  c.restore();
}

const READ_TINT = '#e9dcc0';
const HOOD_TINT = '#a9a69f';
/** the backdrop's three lights (L2, after the curtain): a broad low horizon glow behind each lamp, in its own colour */
function lampGlows(c: C, env: PaintEnv, emerge: number) {
  const m = env.mood;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const glow = (x: number, y: number, rx: number, ry: number, col: string, a: number) => {
    if (a <= 0.003) return;
    c.save();
    c.translate(x, y);
    c.scale(rx / ry, 1);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, ry);
    g.addColorStop(0, withAlpha(col, a));
    g.addColorStop(0.5, withAlpha(col, a * 0.45));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(-ry, -ry, 2 * ry, 2 * ry);
    c.restore();
  };
  // the worry candle: warm, the strongest
  glow(SX, 560, 520, 210, mixLab(m.halo, m.core, 0.35), 0.3);
  // the reading lamp: paler, neutral paper-white
  glow(HARMS_POOL.x + 20, 570, 360, 170, mixLab(READ_TINT, m.halo, 0.3), 0.22 * emerge);
  // the hooded lamp: cool and dim
  glow(HOOD_POOL.x - 10, 560, 300, 150, mixLab(HOOD_TINT, m.haze, 0.3), 0.06 * emerge);
  c.restore();
}

/** the reading lamp's own crisp pool on the boards, under the desk (additive), so it reads as a third light */
function readingPool(c: C, env: PaintEnv, k: number) {
  if (k <= 0.01) return;
  const top = writingDesk.anchors(DESK).top;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(top.x + 20, HARMS_Y + 12);
  c.scale(1, 0.17);
  const R = 250;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, withAlpha(mixLab(READ_TINT, env.mood.core, 0.3), 0.26 * k));
  g.addColorStop(0.6, withAlpha(READ_TINT, 0.12 * k));
  g.addColorStop(0.85, withAlpha(READ_TINT, 0.07 * k));
  g.addColorStop(1, withAlpha(READ_TINT, 0));
  c.fillStyle = g;
  c.fillRect(-R, -R, 2 * R, 2 * R);
  c.restore();
}

/** a figure's cast shadow on the boards: a tapered polygon from the feet away from the light, softly blurred, alpha
 *  ~0.5 at the feet fading along its length, widening (in floor depth) as it goes */
function castShadow(c: C, env: PaintEnv, x: number, y: number, lightX: number, lenK: number, s: number, strength: number) {
  const dir = x >= lightX ? 1 : -1;
  const L = (150 + Math.min(260, Math.abs(x - lightX) * 0.9)) * lenK * s;
  const x1 = x + dir * L;
  const w0 = 6 * s, w1 = (16 + 0.07 * L) * s;
  c.save();
  c.filter = `blur(${(3.2 * env.pxScale).toFixed(2)}px)`;
  const g = c.createLinearGradient(x, 0, x1, 0);
  const ink = mixLab(env.mood.fg, '#000000', 0.45);
  g.addColorStop(0, withAlpha(ink, 0.6 * strength));
  g.addColorStop(0.45, withAlpha(ink, 0.4 * strength));
  g.addColorStop(1, withAlpha(ink, 0));
  c.fillStyle = g;
  const yb = y + 3, drop = 0.05 * L;
  c.beginPath();
  c.moveTo(x - dir * 10 * s, yb - w0 * 0.4);
  c.lineTo(x1, yb + drop - w1);
  c.quadraticCurveTo(x1 + dir * 14 * s, yb + drop, x1, yb + drop + w1 * 0.7);
  c.lineTo(x - dir * 10 * s, yb + w0);
  c.closePath();
  c.fill();
  c.restore();
}

function pulse(t: number, at: number, rise: number, fall: number): number {
  if (t <= at) return 0;
  if (t < at + rise) return sm((t - at) / rise);
  return 1 - sm((t - at - rise) / fall);
}

void win;
