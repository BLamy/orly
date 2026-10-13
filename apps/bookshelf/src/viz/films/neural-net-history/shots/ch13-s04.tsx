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
  FONT, PUPPET_NEAR_BLACK, anglepoiseLamp, defineShot, mixLab, nameCard, papers, quoteCard, serverRack, softPlate, withAlpha, withLife, writingDesk,
} from '../../../film';
import { cast } from '../cast';
import { shelfStateAt, type CandleView } from '../sets/studyState';
import { frameOn } from '../sets/ch09-s03a-kit';
import { monotone } from '../sets/ch02-s05b-util';
import { BENGIO13, HINTON13, STAND13, labHeads, longShadow, screen, stage13, tq12, win, sm, lerp, worryLetters } from '../sets/ch13-s01-kit';
import { STRIP_DONE, drawStrip } from '../sets/ch13-s03-strip';

const ID = 'ch13-s04';
type C = CanvasRenderingContext2D;

const WORRY: CandleView = shelfStateAt(ID, 'start').find((v) => v.id === 'worry')!;
const SX = 640;
const SS = 1.0;
const FY = 640;
// the worry lamp's pair (as ch13-s03 left them)
const HX = 474;
const BX = 368;
// round 1: the three pools overlap in DEPTH, not just side by side. The present-harms camp is a step DOWNSTAGE
// (lower on the boards, larger, sharper); the sceptic's lamp and cabinet a step UPSTAGE (smaller, hazier). Gebru,
// Bender and LeCun stand just outside the opening frame (it matches ch13-s03's last), so the pull-back REVEALS them
// at the frame edges as their lamps come up: no one dissolves in.
const HARMS_Y = FY + 28;
const HARMS_S = 1.08;
const DESK = { x: -30, y: HARMS_Y, s: HARMS_S, variant: 'pedestal' as const, w: 132 };
const GEBRU_X = -206;
const BENDER_X = 12;
const HARMS_POOL = { x: -40, rx: 310, k: 0.82, y: HARMS_Y };
// the sceptic's lamp: a hooded floor lamp barely lit; LeCun inside its faint pool, facing out (his back half to the
// worry candle), clear of the server cabinet behind him
const UP_Y = FY - 22;
const UP_S = 0.88;
const HOOD = { x: 1232, y: UP_Y, h: 300 * UP_S };
const LECUN_X = 1290;
const LECUN_Y = FY - 10;
const RACK = { x: LECUN_X + 128, y: UP_Y - 4, s: 1.35 * UP_S };
const HOOD_POOL = { x: 1250, rx: 230, k: 0.42, y: UP_Y };
/** the settle: wide, the floor line at ~70% of frame height */
const WIDE: [number, number, number] = [632, 440, 0.7];
/** the worry candle's flame (the handoff into ch13-s06 pushes toward it) */
const WFLAME = candleFlame({ x: SX, y: FY, view: shelfStateAt('ch13-s04', 'start').find((v) => v.id === 'worry')!, s: SS });

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
      [0, 640, 340, 1.08],
      [0.5, 640, 346, 1.06],
      [b.three + 1.0, ...WIDE],
      [b.harms - 0.05, 630, 442, 0.73],
      [b.harms + 2.4, 40, 456, 0.88],
      [b.lecun - 0.6, 56, 456, 0.89],
      [b.lecun + 2.0, 1170, 452, 0.88],
      [b.medals - 0.4, 1180, 452, 0.89],
      [b.medals + 2.4, ...WIDE],
      // the handoff: in the last second a 3% ease toward the worry candle's flame (ch13-s06 opens inside a flame)
      [D - 1.1, 636, 442, 0.705],
      [D, lerp(636, WFLAME.x, 0.25), lerp(442, WFLAME.y, 0.2), 0.726],
    ];
    const fx = monotone(keys.map((k) => [k[0], k[1]]));
    const fy = monotone(keys.map((k) => [k[0], k[2]]));
    const fk = monotone(keys.map((k) => [k[0], Math.log(k[3])]));
    const cam = (t: number) => frameOn({ x: fx(t), y: fy(t) }, { x: 640, y: 360 }, Math.exp(fk(t)));
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 24; i++) CAMS.push(cam((D * i) / 24));
    tl.hold(0, D);
    return { tl, b, cam, CAMS };
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
    const handoff = win(t, b.D - 1.1, b.D);
    stage13(f, {
      key: ID,
      cams: sc.CAMS,
      candle: WORRY,
      candleX: SX,
      s: SS,
      letters: 0,
      poolRx: 470,
      pools: [{ ...HARMS_POOL, k: HARMS_POOL.k * emerge }, { ...HOOD_POOL, k: HOOD_POOL.k * emerge }],
      motes: 0.7,
      // ch13-s03's strip rolls up into the flies, and its lab heads dim back into the haze, as the pull-back begins
      flat: (c, env) => stripRollUp(c, env, t),
      // the lab heads step back into the dark at upstage right (no dissolve: the haze takes them)
      back: (c, env) => labHeads(c, env, t, { labs: -10 }, 1, win(t, 0.05, 1.5)),
      depth: { fogA: 0.28, fogAY: 0.5 * 720, fogAH: 0.36 * 720, curtain: 'both', curtainW: 70, lipY: 676, ref: frameOn({ x: WIDE[0], y: WIDE[1] }, { x: 640, y: 360 }, WIDE[2]) },
      draw: (c, env) => {
        worryLetters(c, SX, FY, SS, 10.4, 0.85, env);
        // ---- the sceptic's corner, a step upstage (smaller, hazier): the cabinet, the hooded lamp
        const upEnv: PaintEnv = { ...env, fill: (r) => (r === 'ink' ? mixLab(env.fill('ink'), env.mood.haze, 0.3) : env.fill(r)) };
        c.save();
        c.filter = `blur(${(0.7 * env.pxScale).toFixed(2)}px)`;
        serverRack(c, { x: RACK.x, y: RACK.y, s: RACK.s, activity: 0.05, seed: 7 }, upEnv);
        offSwitch(c, upEnv, RACK.x - 14 * UP_S, RACK.y - 132 * UP_S, rackGlint);
        hoodedLamp(c, upEnv, HOOD.x, HOOD.y, HOOD.h);
        c.restore();
        // ---- the present-harms corner, a step downstage: desk, papers, the reading lamp
        writingDesk(c, DESK, env);
        const top = writingDesk.anchors(DESK).top;
        papers(c, { x: top.x - 30, y: top.y, s: 1.1 * HARMS_S, count: 5, seed: 23, mode: 'loose', tone: 'paper' }, env);
        anglepoiseLamp(c, { x: top.x + 44, y: top.y, s: 1.25 * HARMS_S, reach: 0.4, aim: 0.15, flip: true, lit: true, seed: 5 }, env);
        // ---- shadows first (all of them on the boards), then the figures
        const fig = (p: { draw: typeof HINTON13.draw }, x: number, facing: 'left' | 'right', pose: Pose, lightX: number, k = 1, y = FY, sc = 1, st = 0.95) => ({ p, x, facing, pose, lightX, k, y, sc, st });
        const life = (seed: number, head = 0) => withLife({ ...STAND13, angles: { ...STAND13.angles, head: (STAND13.angles.head ?? 0) + head } }, tq, seed, 0.85);
        const figs = [
          // Hinton's long shadow reaches across the present-harms pool (people belonged to more than one lamp)
          fig(HINTON13, HX, 'right', life(2023, 4), SX, 2.0, FY, 1, 1.25),
          fig(BENGIO13, BX, 'right', life(1964, 2), SX, 1.2),
          fig(GEBRU, GEBRU_X, 'right', life(1983, 2), HARMS_POOL.x, 0.9, HARMS_Y, HARMS_S),
          fig(BENDER, BENDER_X, 'left', life(1973, 4), HARMS_POOL.x, 0.9, HARMS_Y, HARMS_S),
          fig(LECUN, LECUN_X, 'right', life(1960, -2), HOOD_POOL.x, 1.1, LECUN_Y, 0.95),
        ];
        // upstage first, downstage last
        figs.sort((p, q) => p.y - q.y);
        for (const g of figs) {
          c.save();
          c.translate(0, g.y - FY);
          longShadow(c, env, g.x, g.lightX, (cc) => g.p.draw(cc, { x: 0, y: 0, facing: g.facing, pose: g.pose, ink: PUPPET_NEAR_BLACK, scale: g.sc }, env), g.st, g.k);
          c.restore();
        }
        for (const g of figs) {
          const lx = g.lightX < g.x ? -1 : 1;
          g.p.draw(c, { x: g.x, y: g.y, facing: g.facing, pose: g.pose, scale: g.sc, ink: PUPPET_NEAR_BLACK, light: { x: lx, y: -0.2, floor: 0.12 }, edgeRim: { x: lx, y: -0.35, px: 1.5, alpha: g.p === LECUN ? 0.35 : 0.65 } }, env);
        }
        // ---- the medallions on their threads
        medallions(c, env, t, b);
      },
    });
    // the reading lamp and the hooded lamp (practicals)
    const top = writingDesk.anchors(DESK).top;
    const bulb = anglepoiseLamp.anchors({ x: top.x + 44, y: top.y, s: 1.25, reach: 0.4, aim: 0.15, flip: true, lit: true, seed: 5 }).bulb;
    f.practical({ x: bulb.x, y: bulb.y + 4, kind: 'lamp', seed: 31, intensity: 0.85 * emerge, radius: 90 });
    f.practical({ x: HOOD.x - 26 * UP_S, y: HOOD.y - HOOD.h + 34 * UP_S, kind: 'lamp', seed: 47, intensity: 0.32 * emerge, radius: 60 });
    // the handoff: the worry candle's bloom rises as the camera eases toward it
    if (handoff > 0.01) f.practical({ x: WFLAME.x, y: WFLAME.y + 4, kind: 'candle', seed: 2099, intensity: 0.55 * handoff * handoff, radius: 150 });
    const env = { t, mood: f.mood };
    screen(f, (c) => {
      nameCard(c, { name: 'Timnit Gebru · Emily M. Bender', role: '', at: b.timnit - 0.1, dur: 3.6 }, env);
      // quote cards on a soft ink plate, rising as the narrator reaches the quoted words (L1310 and L1311 were
      // re-recorded with their quotation marks: 'The harms…' and 'preposterously ridiculous')
      const qa = b.quoteA - 0.3, qb = b.quoteB - 0.3;
      // round 1: the harms card sits above the head line (its attribution clear of the heads and the worry flame)
      plate(c, 900, 140, 620, 230, f.mood.ink, 0.42 * win(t, qa, qa + 0.4) * (1 - win(t, b.lecun - 0.2, b.lecun + 0.4)));
      quoteCard(c, {
        quote: 'The harms from so-called AI are real and present…',
        speaker: 'Gebru, Bender & McMillan-Major',
        x: 900, y: 140, width: 470, maxChars: 30, size: 28, at: qa, dur: b.lecun - qa, fade: 0.4, stagger: 0.3,
      }, env);
      nameCard(c, { name: 'Yann LeCun', role: '', at: b.yann - 0.1, dur: 3.4, align: 'right' }, env);
      // LeCun's card is up on 'called', before he is quoted
      plate(c, 400, 150, 580, 210, f.mood.ink, 0.42 * win(t, qb, qb + 0.4) * (1 - win(t, b.medals - 0.3, b.medals + 0.3)));
      quoteCard(c, {
        quote: '…just preposterously ridiculous.',
        speaker: 'Yann LeCun',
        x: 400, y: 150, width: 440, maxChars: 30, size: 30, at: qb, dur: b.medals - qb, fade: 0.4, stagger: 0.3,
      }, env);
      // raised clear of the bottom 12%
      nameCard(c, { name: '2018 A.M. Turing Award', role: 'Bengio · Hinton · LeCun', at: b.medals + 0.7, dur: 4.6, y: 578 }, env);
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
  g.addColorStop(0, withAlpha(env.mood.halo, 0.35));
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
function medallions(c: C, env: PaintEnv, t: number, b: B) {
  const drop = sm((t - b.medals) / 1.3);
  if (drop <= 0.002) return;
  const tq = tq12(t);
  const homes = [{ x: 572, y: 170 }, { x: 650, y: 162 }, { x: 728, y: 170 }];
  const dest = [{ x: HX + 4, y: 206 }, { x: BX + 4, y: 214 }, { x: LECUN_X + 4, y: 210 }];
  const two = b.two - 0.1, third = b.third - 0.18;
  const go = [sm((tq - two) / 0.65), sm((tq - two - 0.08) / 0.62), sm((tq - third) / (b.apart + 0.13 - third))];
  const m = env.mood;
  // round 1: flat medal discs, not lamps: about 45 px across at 1080p, a ribbon and a ring at the top, a dark struck
  // metal face (no inner glow), a lit rim on the lamp side with one edge glint, and the '2018' stamp
  const r = 21;
  for (let i = 0; i < 3; i++) {
    const u = go[i];
    const settle = Math.sin(Math.max(0, tq - (i === 2 ? third : two) - 0.6) * 4.5) * 5 * Math.exp(-Math.max(0, tq - (i === 2 ? third : two) - 0.6) * 1.8) * (u > 0.99 ? 1 : 0);
    const sway = Math.sin(t * 1.3 + i * 2) * 2.5 + settle;
    const x = lerp(homes[i].x, dest[i].x, u) + sway;
    const y = lerp(-160, lerp(homes[i].y, dest[i].y, u) - 26 * Math.sin(Math.PI * u), drop);
    const lamp = i === 2 && u < 0.5 ? LAMPS[0] : LAMPS[i];
    const ink = env.fill('ink');
    // the thread to the flies
    c.strokeStyle = withAlpha(m.rim, 0.35);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - sway * 0.6, -700);
    c.lineTo(x, y - r - 34);
    c.stroke();
    // the ribbon: a broad folded band, its lower edge notched in a V, a pale centre stripe (a medal, not a socket)
    const rw = 22, rt = y - r - 34, rb = y - r - 6;
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
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(x, y, r - 1.2, ang - 0.9, ang + 0.9);
    c.stroke();
    const gx = x + Math.cos(ang - 0.35) * (r - 1), gy = y + Math.sin(ang - 0.35) * (r - 1);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(gx, gy, 0, gx, gy, 7);
    gg.addColorStop(0, withAlpha(m.core, 0.85));
    gg.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = gg;
    c.fillRect(gx - 7, gy - 7, 14, 14);
    c.restore();
    // the struck inner ring and the '2018' stamp (raised: a dark cut with a lit upper lip)
    c.strokeStyle = withAlpha(m.fg, 0.5);
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x, y, r - 4.5, 0, Math.PI * 2);
    c.stroke();
    c.font = `700 ${(r * 0.62).toFixed(1)}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.7);
    c.fillText('2018', x - 0.5, y + r * 0.2 - 0.6);
    c.fillStyle = mixLab(m.fg, '#000000', 0.2);
    c.fillText('2018', x, y + r * 0.2);
  }
}

/** a soft ink plate under screen-locked text over art */
function plate(c: C, x: number, y: number, w: number, h: number, ink: string, a: number) {
  if (a <= 0.003) return;
  softPlate(c, x, y, w, h, ink, a);
}

/** ch13-s03's statement strip, rolling up into the flies in the first 0.6 s */
function stripRollUp(c: C, env: PaintEnv, t: number) {
  const u = sm(t / 0.6);
  if (u >= 0.999) return;
  drawStrip(c, env, t, STRIP_DONE, { rise: 380 * u, roll: u, alpha: 1 - 0.3 * u });
}

function pulse(t: number, at: number, rise: number, fall: number): number {
  if (t <= at) return 0;
  if (t < at + rise) return sm((t - at) / rise);
  return 1 - sm((t - at - rise) / fall);
}

void win;
