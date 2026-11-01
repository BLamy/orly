/**
 * ch03-s04 — WHO REFEREES THE REFEREE? (serverCyan, cut). A vertical crane down into the Well: the canonical square
 * (sets/harbourTown.ts) above, and below the wellhead the stone dissolves into the CUTAWAY (sets/wellCutaway.ts:
 * cisterns, the witness's bell and flag, the order ledger, the proof sheets; serverCyan glints only here). It is a
 * METAPHOR of S3's internals as Werner Vogels described them in 2021, never a claim about S3's real layout.
 *
 *   (open)     close on the wellhead's mouth
 *   (referee)  the camera cranes down; the stone dissolves into the section
 *   name       at the top of the shaft, in a cellar landing beside the cutaway, Werner Vogels stands at a lectern-height
 *              desk (generic, dignified, no likeness); name card 'Werner Vogels · Amazon CTO'
 *   caches     deeper: three cistern-lamps brighten together, the same faint mark reflected in each; quote Q17
 *   order      a narrow paper ledger on a ledge advances one line per change
 *   witness    a sheet drops past the witness on his mid-ledge: he rings once and his flag goes up; below, a cistern
 *              about to hand up an old copy tugs a cord up to the flag, sees it raised, and its old copy dims while
 *              the fresh one is fetched (the read barrier)
 *   proofs     parchment proof sheets are pinned along the shaft wall, outnumbering the ledges; quote Q18 replaces Q17
 *   inside     the camera cranes back up to the square: three houses, three pulley lines to the one wellhead; a faint
 *              cyan pulse in the Well's mouth
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, defineShot, mixLab, nameCard, podium, quoteCard, toScreen, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { SEA_CYAN, badge, camAt, clamp01, cord, glowDot, lerp, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { TOWN, l3ToL4, paintTown } from '../sets/harbourTown';
import { WELL, plate, tooth, wellBase, wellLive } from '../sets/wellAndPlate';
import { cistern, orderLedger, proofSheets, witnessBell } from '../sets/wellCutaway';
import { scroll } from '../sets/walRibbon';
import { cast } from '../cast';
import { bakeRes, h01 } from '../sets/ch02-s01-kit';

const ID = 'ch03-s04';
const W = TOWN.well;
const SH = { x0: 232, x1: 632, top: W.y + 2, bottom: 1700 };
const ALCOVE = { x0: 650, x1: 920, y0: 650, y1: 860 };
const VOG = { x: 770, y: ALCOVE.y1 };
const CIS = [
  { x: 300, y: 850 },
  { x: 470, y: 960 },
  { x: 300, y: 1120 },
];
const WIT = { x: 520, y: 1100 };
const LEDGER = { x: 400, y: 1210 };
const PROOF = { x: 600, y: 780 };

const MOUTH: Camera3 = { x: 432, y: 560, z: 430, lens: 1 };
const VCAM: Camera3 = { x: 610, y: 762, z: 220, lens: 1 };
const DEEP: Camera3 = { x: 350, y: 996, z: 226, lens: 1 };
const SQUARE: Camera3 = { x: 610, y: 382, z: 70, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      name: T.beat('name'),
      caches: T.beat('caches'),
      order: T.beat('order'),
      witness: T.beat('witness'),
      proofs: T.beat('proofs'),
      inside: T.beat('inside'),
      referee: T.word('L0319', 'referee'),
      stale: T.word('L0321', 'stale'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: MOUTH },
      { t: b.referee - 0.1, cam: { ...MOUTH, z: MOUTH.z + 10 } },
      { t: b.name - 0.1, cam: VCAM },
      { t: b.caches - 1.9, cam: { ...VCAM, x: VCAM.x - 10, y: VCAM.y + 8 } },
      { t: b.caches - 0.2, cam: DEEP },
      { t: b.inside - 0.3, cam: { ...DEEP, y: DEEP.y + 16, z: DEEP.z + 14 } },
      { t: b.inside + 3.9, cam: SQUARE },
      { t: b.D, cam: { ...SQUARE, z: SQUARE.z + 10 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // the stone dissolves into the section as the crane starts; it closes again as the crane rises out
    const section = seg(t, b.referee + 0.2, b.referee + 2.6) * (1 - seg(t, b.inside + 2.2, b.inside + 3.6));
    const pulse = 0.5 + 0.5 * Math.sin((t - b.inside) * 2.4);
    // L1-L3 from the canonical town; the shaft's far back wall lives in L3 (it parallaxes behind the section)
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 0.8, B: 0.6, C: 0.7 },
        plate: null,
        tooth: null,
        sender: false,
        skip: { L4: true, L5: true, L6: true },
      },
      { L3: (c, env) => (section > 0.005 ? shaftBack(c, env, section) : undefined) },
    );
    f.fog('B');
    f.layer('L4', (c, env) => {
      squareAndSection(f, c, env, cam, section);
      if (section > 0.005) cutaway(f, c, env, t, tq, cam, section, b);
      // the Well itself, on top of the section's lip
      wellLive(c, env, { x: W.x, y: W.y, bucket: 0.3, glint: 0.3 });
      plate(c, env, { x: W.x, y: W.y, plate: { house: 'A', epoch: '', from: '', crown: 0, dim: 0.4 } });
      tooth(c, env, { x: W.x, y: W.y, tooth: { shutter: 1, pin: 1, showPin: false } });
      badge(c, env, { x: W.x + WELL.hookR.x + 6, y: W.y + WELL.hookR.y - 2, text: 'Amazon S3', legible: false, glint: 0.3, swing: 0.03 * Math.sin(tq * 1.3) });
      // the three pulley lines converge on the one wellhead
      for (const h of ['A', 'B', 'C'] as const) {
        const a0 = l3ToL4(cam, TOWN[h].pulley);
        const top = { x: W.x + WELL.pulley.x, y: W.y + WELL.pulley.y };
        cord(c, a0.x, a0.y, top.x, top.y, h === 'A' ? 26 : h === 'B' ? 34 : 46, withAlpha(env.fill('ink'), 0.85), 1.1, 1);
      }
      // the cyan pulse in the Well's mouth (the machinery still turning) once we are back up
      const back = seg(t, b.inside + 2.4, b.inside + 3.6);
      if (back > 0.01) glowDot(c, W.x, W.y - WELL.ringH, 46, tone(env, SEA_CYAN, 0.2), 0.45 * back * pulse);
    });
    f.rim({ x: 0, y: -1 });
    if (cam.z < 400 && section > 0.01) {
      f.layer('L5', (c, env) => {
        c.save();
        c.globalAlpha = section;
        bakeRes(f, c, env, `${ID}-near`, { x: -400, y: 800, w: 1600, h: 900 }, (cc) => nearRocks(cc, env));
        c.restore();
      });
    }
    // ---------------------------------------------------------------- type
    const c = f.c;
    const vs = toScreen(LAYERS.L4, cam, VOG.x, ALCOVE.y1 + 10);
    nameCard(c, { name: 'Werner Vogels', role: 'Amazon CTO', x: Math.min(1000, Math.max(640, vs.x - 90)), y: Math.min(600, vs.y + 70), at: b.name - 0.1, dur: 4.6, fade: 0.4 }, { t, mood: f.mood });
    quoteCard(c, { quote: '…a witness to writes, notified every time an object changes.', speaker: 'Werner Vogels, 2021', x: 56, y: 150, width: 360, align: 'left', at: b.caches - 0.1, dur: b.proofs - 0.7 - b.caches, fade: 0.4 }, { t, mood: f.mood });
    quoteCard(c, { quote: 'They were more work, in fact, than the actual implementation itself.', speaker: 'Werner Vogels', x: 56, y: 150, width: 360, align: 'left', at: b.proofs + 0.05, dur: b.inside - 0.5 - b.proofs, fade: 0.4 }, { t, mood: f.mood });
  },
});

interface B {
  caches: number;
  order: number;
  witness: number;
  proofs: number;
  stale: number;
  name: number;
}
/** the section below the wellhead: back wall (its own slow parallax), stone faces, cellar landing, the machinery */
function cutaway(f: Parameters<typeof bakeRes>[0], c: C2, env: PaintEnv, t: number, tq: number, cam: Camera3, a: number, b: B): void {
  const ink = env.fill('ink');
  const cy = tone(env, SEA_CYAN, 0.2);
  c.save();
  c.globalAlpha = a;
  void cam;
  // Werner Vogels at his lectern-height desk on the landing
  podium(c, { x: VOG.x - 44, y: VOG.y, mic: false, w: 46, s: 0.62 }, env);
  cast['werner-vogels'].draw(c, { x: VOG.x + 4, y: VOG.y, facing: 'left', pose: POSES.stand, scale: 0.56, ink: PUPPET_NEAR_BLACK, light: { x: -0.8, y: -0.3, floor: 0.15 }, edgeRim: { x: -0.85, y: -0.4, px: 2.5, alpha: 0.85, warm: 0.3 } }, env);
  // ledges with the machinery
  c.fillStyle = mixLab(env.fill('set'), ink, 0.5);
  for (const p of [...CIS, WIT, LEDGER]) c.fillRect(p.x - 64, p.y, 128, 10);
  // caches: lamps brighten together on 'agree', the same faint mark in each
  const agree = seg(t, b.caches - 0.15, b.caches + 0.5);
  const stale = seg(t, b.witness + 0.6, b.witness + 0.9) * (1 - seg(t, b.witness + 2.2, b.witness + 3.1));
  CIS.forEach((p, i) => cistern(c, env, { x: p.x, y: p.y, lamp: 0.3 + 0.7 * agree, mark: agree, stale: i === 2 ? stale : 0, s: 1 }));
  // the order ledger: one line per change
  const lines = t < b.order - 0.1 ? 2 : 2 + Math.min(9, (tq - (b.order - 0.1)) / 0.8);
  orderLedger(c, env, { x: LEDGER.x, y: LEDGER.y, lines, s: 1.1 });
  // the witness: a sheet drops past him from above; he rings once; his flag goes up
  const drop = clamp01((tq - (b.witness - 0.7)) / 0.75);
  const ring = Math.sin(Math.PI * seg(t, b.witness - 0.05, b.witness + 0.6));
  const flag = seg(t, b.witness, b.witness + 0.3) * (1 - seg(t, b.proofs + 2.5, b.proofs + 3.2));
  const wo = { x: WIT.x, y: WIT.y, facing: 'left' as const, pose: POSES.present, scale: 0.85, ink: PUPPET_NEAR_BLACK, light: { x: -0.4, y: -0.9, floor: 0.15 }, edgeRim: { x: -0.3, y: -1, px: 2.25, alpha: 0.85, warm: 0.2 } };
  cast.witness.draw(c, wo, env);
  const hand = cast.witness.anchor(wo, 'handF');
  witnessBell(c, env, { x: hand.x, y: hand.y + 8, s: 1.2, ring: ring + 0.4 * Math.sin(Math.PI * seg(t, b.order - 0.1, b.order + 0.5)), flag });
  if (drop > 0 && drop < 1) scroll(c, env, { x: WIT.x - 34, y: lerp(SH.top + 40, WIT.y - 20, drop * drop), s: 0.9, rot: drop * 3 });
  // the read barrier: the low cistern tugs a cord to the flag, sees it raised; its old copy dims, a fresh one is fetched
  const tug = seg(t, b.witness + 0.7, b.witness + 1.2);
  const flagPt = { x: hand.x + 24 * 1.2 + 6, y: hand.y + 8 - 38 * 1.2 };
  const lampPt = { x: CIS[2].x - 29, y: CIS[2].y - 70 };
  if (tug > 0.01) {
    const taut = Math.sin(Math.PI * seg(t, b.witness + 1.1, b.witness + 1.6));
    cord(c, lampPt.x, lampPt.y, flagPt.x, flagPt.y, 30 * (1 - taut * 0.8), withAlpha(cy, 0.8), 1.2, tug);
  }
  const fetch = clamp01((tq - (b.witness + 2.4)) / 1.4);
  if (fetch > 0 && fetch < 1.2) scroll(c, env, { x: lerp(WIT.x - 34, CIS[2].x + 22, sm(fetch)), y: lerp(WIT.y - 12, CIS[2].y - 66, sm(fetch)) - Math.sin(Math.PI * fetch) * 30, s: 0.6, rot: -0.3 });
  // proof sheets pinned along the wall: more of them than there are ledges
  const n = t < b.proofs - 0.2 ? 0 : Math.min(12, (tq - (b.proofs - 0.2)) / 0.28);
  if (n > 0) proofSheets(c, env, { x: PROOF.x, y: PROOF.y, n, s: 1 });
  c.restore();
  // glints (the cache lamps' halos are drawn by cistern(); the flag catches the light)
  if (flag > 0.05) glowDot(c, flagPt.x, flagPt.y, 16, cy, 0.5 * flag * a);
  void b.stale;
  void b.name;
}

/** L3: the shaft's far back wall (lit by the cache lamps), block courses and far ledges; seen only through the cut */
function shaftBack(c: C2, env: PaintEnv, a: number): void {
  c.save();
  c.globalAlpha = a;
  const back = mixLab(env.fill('set'), env.mood.haze, 0.45);
  c.fillStyle = back;
  c.fillRect(-300, 560, 1700, 2200);
  c.strokeStyle = withAlpha(tone(env, SEA_CYAN, 0.3), 0.14);
  c.lineWidth = 1;
  for (let y = 560; y < 2760; y += 30) {
    c.beginPath();
    c.moveTo(-300, y);
    c.lineTo(1400, y);
    c.stroke();
    for (let x = -300 + ((y / 30) % 2) * 36; x < 1400; x += 72) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + 30);
      c.stroke();
    }
  }
  c.fillStyle = mixLab(back, env.mood.fg, 0.4);
  for (let k = 0; k < 10; k++) c.fillRect(k % 2 ? 300 : 120, 700 + k * 150, 220, 7);
  // a soft cyan wash from below (the cisterns' lamps)
  const g = c.createLinearGradient(0, 700, 0, 1600);
  g.addColorStop(0, withAlpha(tone(env, SEA_CYAN, 0.3), 0));
  g.addColorStop(1, withAlpha(tone(env, SEA_CYAN, 0.3), 0.18));
  c.fillStyle = g;
  c.fillRect(-300, 700, 1700, 900);
  c.restore();
}
/** L4: the square's ground strip and, below it, the earth with the shaft and the cellar landing cut out */
function squareAndSection(f: Parameters<typeof bakeRes>[0], c: C2, env: PaintEnv, cam: Camera3, section: number): void {
  const ink = env.fill('ink');
  bakeRes(f, c, env, `${ID}-ground`, { x: -400, y: 560, w: 1900, h: 1300 }, (cc) => {
    const g = cc.createLinearGradient(0, 580, 0, 640);
    g.addColorStop(0, mixLab(env.fill('set'), ink, 0.55));
    g.addColorStop(1, mixLab(env.fill('set'), ink, 0.75));
    const p = new Path2D();
    p.moveTo(-400, 588);
    p.quadraticCurveTo(640, 578, 1500, 590);
    p.lineTo(1500, 1860);
    p.lineTo(-400, 1860);
    p.closePath();
    p.rect(SH.x0, SH.top, SH.x1 - SH.x0, SH.bottom - SH.top);
    p.rect(ALCOVE.x0 - 18, ALCOVE.y0, ALCOVE.x1 - ALCOVE.x0 + 18, ALCOVE.y1 - ALCOVE.y0);
    cc.fillStyle = g;
    cc.fill(p, 'evenodd');
    // stone courses in section (faint)
    cc.strokeStyle = withAlpha(env.fill('rim'), 0.07);
    cc.lineWidth = 1;
    for (let y = 650; y < 1860; y += 30) {
      cc.beginPath();
      cc.moveTo(-400, y);
      cc.lineTo(SH.x0, y);
      cc.moveTo(SH.x1, y);
      cc.lineTo(ALCOVE.x0 - 18, y);
      cc.moveTo(ALCOVE.x1, y);
      cc.lineTo(1500, y);
      cc.stroke();
    }
    // the landing's floor and the shaft's lining
    cc.fillStyle = mixLab(env.fill('set'), ink, 0.6);
    cc.fillRect(SH.x1, ALCOVE.y1, ALCOVE.x1 - SH.x1, 14);
    cc.fillRect(SH.x0 - 10, SH.top, 10, SH.bottom - SH.top);
    cc.fillRect(SH.x1, SH.top, 10, ALCOVE.y0 - SH.top);
    cc.fillRect(SH.x1, ALCOVE.y1, 10, SH.bottom - ALCOVE.y1);
    // the cut edges glint cyan
    cc.strokeStyle = withAlpha(tone(env, SEA_CYAN, 0.3), 0.45);
    cc.lineWidth = 1.5;
    for (const x of [SH.x0, SH.x1 + 10]) {
      cc.beginPath();
      for (let y = SH.top + 4; y <= SH.bottom; y += 12) cc.lineTo(x + Math.sin(y * 0.13) * 3, y);
      cc.stroke();
    }
  });
  bakeRes(f, c, env, `${ID}-wellbase`, { x: W.x - 130, y: W.y - 300, w: 260, h: 312 }, (cc) => wellBase(cc, env, { x: W.x, y: W.y }));
  // the stone over the cut, dissolving as the crane goes down (and closing as it rises)
  if (section < 0.995) {
    c.save();
    c.globalAlpha = 1 - section;
    c.fillStyle = mixLab(env.fill('set'), ink, 0.75);
    c.fillRect(SH.x0 - 1, SH.top, SH.x1 - SH.x0 + 12, SH.bottom - SH.top);
    c.fillRect(ALCOVE.x0 - 19, ALCOVE.y0, ALCOVE.x1 - ALCOVE.x0 + 20, ALCOVE.y1 - ALCOVE.y0 + 1);
    c.restore();
  }
  void cam;
}
/** L5: rough near-stone fragments along the crane's path (they slide fast past the lens) */
function nearRocks(c: C2, env: PaintEnv): void {
  c.fillStyle = env.fill('fg');
  const lines = [
    [{ x: -190, y: 1500 }, { x: 200, y: 900 }],
    [{ x: 600, y: 1500 }, { x: 990, y: 900 }],
  ];
  for (const [a, b] of lines) {
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      const x = lerp(a.x, b.x, u) + (a.x > 0 ? 40 : -40), y = lerp(a.y, b.y, u);
      const r = 18 + 22 * h01(i, a.x > 0 ? 7 : 3);
      c.beginPath();
      for (let k = 0; k < 9; k++) {
        const ang = (k / 9) * Math.PI * 2;
        const rr = r * (0.7 + 0.5 * h01(i * 9 + k, 11));
        c.lineTo(x + Math.cos(ang) * rr * 0.7, y + Math.sin(ang) * rr);
      }
      c.closePath();
      c.fill();
    }
  }
}
