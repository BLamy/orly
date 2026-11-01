/**
 * ch07-s03b — celld's town (illustrative), labGreen: the arithmetic of the fleet, counted in house lamps (cut in;
 * the first two seconds wipe behind the L6 lamp-post as the camera settles; then near-locked with a slow dolly in).
 *
 *   (wipe)     0–2 s   the lamp-post slides off frame right; only House A is lit, B and C dark
 *   self       2.88    an empty ink ring closes round A's own notebook on its sill: the owner's copy is never a vote;
 *                      label 'The owner never counts itself'
 *   alone      4.54    no neighbour cord to follow: A's scroll makes the whole slow trip down its pulley line
 *   wellproof  8.86    the Well's bucket comes up with its proof; only then does A's bell ring
 *   two       10.81    B lights; one cord strings A → B; the page rides it, copyist-1 presses, the bell rings sooner
 *   three     15.08    C lights; a second cord; the next page rides both; two presses; three page silhouettes stand on
 *                      A's, B's and C's sills (three copies)
 *   until     18.42    back to two lit houses: C's lamp, cord and copy fade
 *   twoPlaces 22.20    a thin gold outline joins only A's and B's copies; the Well holds nothing of the page;
 *                      label 'one neighbour: a two-copy proof'
 * Badge 'celld 0.6.3' stays on the wellhead, unnamed (art). Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { POSES, PUPPET_NEAR_BLACK, mixLab, defineShot, textSwap, withAlpha } from '../../../film';
import { cast } from '../cast';
import type { Camera3 } from '../../../film';
import { TOWN, l3ToL4, paintTown, pulleyAt } from '../sets/harbourTown';
import { GOLD, camAt, clamp01, cord, cordAt, glowDot, label, lerp, paper, pulse, seg, tone, twos, type CamKey } from '../sets/common';
import { bellSwing, houseBell } from '../sets/heldLetter';
import { scroll } from '../sets/walRibbon';
import { A_BELL, CELLD_TINT, copyistWindow, ownerNotebook, sillPage, tabGlint } from '../sets/ch07-s03-celldTown';

const ID = 'ch07-s03b';
const WIPE: Camera3 = { x: 836, y: 402, z: 180, lens: 1 };
const TWO: Camera3 = { x: 662, y: 400, z: 196, lens: 1 };
/** A's sill (the owner's own notebook), bell, pulley line and the wellhead in one medium */
const A_MED: Camera3 = { x: 340, y: 448, z: 420, lens: 1 };
const END: Camera3 = { x: 640, y: 398, z: 250, lens: 1 };
/** a copy standing on each main sill (L3), right of the window centre */
const SILL_PAGE = {
  A: { x: TOWN.A.main.x + 16, y: TOWN.A.main.y + TOWN.A.main.h / 2 },
  B: { x: TOWN.B.main.x + 16, y: TOWN.B.main.y + TOWN.B.main.h / 2 },
  C: { x: TOWN.C.main.x + 16, y: TOWN.C.main.y + TOWN.C.main.h / 2 },
};

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      self: T.beat('self'),
      alone: T.beat('alone'),
      wellproof: T.beat('wellproof'),
      two: T.beat('two'),
      three: T.beat('three'),
      until: T.beat('until'),
      twoPlaces: T.beat('twoPlaces'),
      proof2: T.word('L0718', 'proof'),
      copies3: T.word('L0718', 'copies'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: WIPE },
      { t: b.self - 0.1, cam: A_MED },
      { t: b.wellproof + 1.0, cam: { ...A_MED, x: A_MED.x + 10, z: A_MED.z + 12 } },
      { t: b.two + 1.4, cam: TWO },
      { t: b.D, cam: END },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // ---- houses lighting (flicker on, on twos)
    const flick = (at: number) => {
      const u = clamp01((tq - at) / 0.5);
      return u <= 0 || u >= 1 ? u : u * (Math.sin(tq * 53) > 0 ? 1 : 0.4);
    };
    const litB = flick(b.two - 0.15);
    const litC = flick(b.three - 0.15) * (1 - seg(t, b.until + 0.1, b.until + 0.9));
    // ---- alone: the slow way down and up again
    const down = clamp01((tq - (b.alone + 0.2)) / 3.1);
    const bucket = t < b.alone + 3.3 ? 0.3 : t < b.wellproof - 0.6 ? lerp(0.3, 0.95, seg(t, b.alone + 3.3, b.alone + 3.6)) : lerp(0.95, 0.25, seg(t, b.wellproof - 0.6, b.wellproof - 0.05));
    const proofGlint = pulse(t, b.wellproof - 0.1, 0.2, 0.5, 0.9);
    // ---- the bell: once for the Well's proof, once (sooner) for B's press, once for B + C
    const bell1 = b.wellproof + 0.12, bell2 = b.proof2 + 0.05, bell3 = b.copies3 + 0.35;
    const swing = bellSwing(t, bell1, 0.5) + bellSwing(t, bell2, 0.5) + bellSwing(t, bell3, 0.5);
    const ring = Math.max(pulse(t, bell1, 0.15, 0.3, 1), pulse(t, bell2, 0.15, 0.3, 1), pulse(t, bell3, 0.15, 0.3, 1));
    // ---- cords and pages
    const cordB = seg(t, b.two + 0.3, b.two + 0.9);
    const cordC = seg(t, b.three + 0.25, b.three + 0.8) * (1 - seg(t, b.until + 0.2, b.until + 1.0));
    const page2 = clamp01((tq - (b.two + 1.1)) / 0.8); // A → B
    const page3B = clamp01((tq - (b.three + 0.9)) / 0.6), page3C = clamp01((tq - (b.three + 0.9)) / 0.8);
    const turnB = Math.max(clamp01((tq - (b.two + 2.0)) / 0.6) * (t < b.three + 1.5 ? 1 : 0), clamp01((tq - (b.three + 1.6)) / 0.5));
    const turnC = clamp01((tq - (b.three + 1.75)) / 0.5);
    const lockB = t < b.three + 1.5 ? seg(t, b.two + 2.6, b.two + 2.8) : seg(t, b.three + 2.1, b.three + 2.3);
    const lockC = seg(t, b.three + 2.25, b.three + 2.45);
    const copies = {
      A: seg(t, b.copies3 - 0.3, b.copies3),
      B: seg(t, b.copies3 - 0.15, b.copies3 + 0.15),
      C: seg(t, b.copies3, b.copies3 + 0.3) * (1 - seg(t, b.until + 0.2, b.until + 1.0)),
    };
    const gold = seg(t, b.twoPlaces - 0.1, b.twoPlaces + 0.8);
    const ringU = seg(t, b.self - 0.2, b.self + 0.5);

    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        variant: 'celld',
        neighbourCords: 0,
        lamps: { A: 1, B: 0.1 * litB, C: 0.1 * litC, Bup: litB, Cup: litC },
        lampTint: { A: '#efcf8a', Bup: CELLD_TINT, Cup: CELLD_TINT, B: CELLD_TINT, C: CELLD_TINT },
        lanterns: [{ house: 'A', lit: 1 + 0.15 * ring, members: 4, tq, door: 0, colour: 'green' }],
        plate: { house: 'A', epoch: '', from: '', crown: 0.35, dim: 0.35 },
        tooth: null,
        well: { bucket, load: t > b.alone + 3.3 && t < b.wellproof - 0.3 ? 'scroll' : 'none', glint: 0.3 + proofGlint },
        badge: { text: 'celld 0.6.3', legible: false },
        lampPostLit: 0.35,
      },
      {
        L3back: (c, env) => {
          if (litB > 0.01)
            copyistWindow(c, env, 'B', { tq, present: litB, notebook: { band: 'complete', lines: 4 + lockB }, press: { turn: turnB, locked: lockB }, pressing: seg(t, b.two + 1.8, b.two + 2.0) * (1 - seg(t, b.two + 2.6, b.two + 3.0)) + seg(t, b.three + 1.4, b.three + 1.6) * (1 - seg(t, b.three + 2.1, b.three + 2.5)) });
          if (litC > 0.01)
            copyistWindow(c, env, 'C', { tq, present: litC, notebook: { band: 'complete', lines: 4 + lockC }, press: { turn: turnC, locked: lockC }, pressing: seg(t, b.three + 1.55, b.three + 1.75) * (1 - seg(t, b.three + 2.25, b.three + 2.6)) });
        },
        L3: (c, env) => {
          ownerNotebook(c, env, { ring: ringU });
          // the empty ring, drawn large enough to read in the medium: the owner's own copy is never a vote
          if (ringU > 0.01) {
            const sx = TOWN.A.sill.x - 12, sy = TOWN.A.sill.y - 5;
            c.save();
            c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.9 * (1 - seg(t, b.two - 0.4, b.two + 0.4)));
            c.lineWidth = 2.6;
            c.beginPath();
            c.ellipse(sx, sy, 17, 12, 0, -1.2, -1.2 + Math.PI * 2 * ringU);
            c.stroke();
            c.restore();
          }
          tabGlint(c, env, 'B', lockB * litB);
          tabGlint(c, env, 'C', lockC * litC);
          for (const h of ['A', 'B', 'C'] as const) sillPage(c, env, { ...SILL_PAGE[h], h: 20, alpha: copies[h], glow: h === 'C' ? 0 : gold * 0.6 });
          houseBell(c, env, { ...A_BELL, s: 1.15, swing, ring });
        },
        L4back: (c, env) => {
          cast.sender.draw(c, { x: TOWN.sender.seat.x, y: TOWN.sender.seat.y, facing: 'left', pose: POSES.sit, scale: TOWN.sender.seatScale, ink: PUPPET_NEAR_BLACK, edgeRim: { x: -0.8, y: -0.5, px: 2.5, alpha: 0.85, warm: 0.65 } }, env);
        },
        L4: (c, env) => {
          const a = l3ToL4(cam, TOWN.A.sill);
          const col = withAlpha(tone(env, '#c9d6a8', 0.25), 0.9);
          for (const [h, u] of [['B', cordB], ['C', cordC]] as const) {
            if (u <= 0.01) continue;
            const e = l3ToL4(cam, TOWN[h].sill);
            cord(c, a.x, a.y, e.x, e.y, 22, col, 0.9, u);
          }
          // pages riding the cords
          const ride = (h: 'B' | 'C', u: number) => {
            if (u <= 0 || u >= 1) return;
            const e = l3ToL4(cam, TOWN[h].sill);
            const p = cordAt(a.x, a.y, e.x, e.y, 22, u);
            c.fillStyle = paper(env, 0.02);
            c.fillRect(p.x - 8, p.y - 20, 16, 19);
          };
          ride('B', page2);
          ride('B', page3B);
          ride('C', page3C);
          // alone: the scroll's slow trip down A's pulley line
          if (down > 0 && down < 1) {
            const p = pulleyAt(cam, 'A', down);
            scroll(c, env, { x: p.x + 2, y: p.y + 6, s: 1.0, rot: 0.3, tag: 1 });
          } else if (t > b.alone - 1.5 && down <= 0) {
            const p = pulleyAt(cam, 'A', 0);
            scroll(c, env, { x: p.x + 2, y: p.y + 6, s: 1.0, tag: 1, alpha: seg(t, b.alone - 1.5, b.alone - 0.9) });
          }
          // twoPlaces: a thin gold outline joins A's and B's copies (and nothing at the Well)
          if (gold > 0.01) {
            const pa = l3ToL4(cam, SILL_PAGE.A), pb = l3ToL4(cam, SILL_PAGE.B);
            const g = tone(env, GOLD, 0.15);
            c.save();
            c.strokeStyle = withAlpha(g, 0.9 * gold);
            c.lineWidth = 1.4;
            for (const p of [pa, pb]) {
              c.beginPath();
              c.ellipse(p.x, p.y - 8, 11, 13, 0, 0, Math.PI * 2);
              c.stroke();
            }
            c.setLineDash([5, 4]);
            const u = seg(t, b.twoPlaces, b.twoPlaces + 1.0);
            cord(c, pa.x + 11, pa.y - 8, pb.x - 11, pb.y - 8, -26, withAlpha(g, 0.85 * gold), 1.3, u);
            c.restore();
            glowDot(c, pb.x, pb.y - 8, 26, g, 0.25 * gold);
          }
        },
      },
    );
    // ---------------------------------------------------------------- labels (upper right; never two at once)
    const sw = textSwap(t, b.twoPlaces, 0.4);
    const a1 = seg(t, b.self - 0.2, b.self + 0.3) * (1 - seg(t, 9.8, 10.4)) * sw.out;
    label(f.c, f.mood, { id: `${ID}-self`, text: 'The owner never counts itself', x: 1220, y: 92, align: 'right', alpha: a1 });
    const a2 = sw.in;
    label(f.c, f.mood, { id: `${ID}-two`, text: 'one neighbour: a two-copy proof', x: 1220, y: 92, align: 'right', alpha: a2 });
  },
});
