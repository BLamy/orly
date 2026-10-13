/**
 * ch10-s10 — talk, think, six times over (serverCyan hall; 9.1 s; cut in). Each word-slip of the worked example spools
 * out a ribbon of light (its residual stream) through a great horizontal loom of six blocks: the 2017 reading half (the
 * encoder), so its threads reach BOTH ways. Numbers: sets/ch10-s10-loom (a real forward pass with seeded toy
 * weights; tagged ILLUSTRATIVE lower-right).
 *
 *   0 → 0.85   the shot opens on ch10-s06's toy row (crossed · the · river · bank on its parchment strip, with s05's
 *              mirrors and notes and s09's clock faces pinned above): the step back to the toy; the slips swing down
 *              into the loom's stack and the ribbons spool out
 *   'talk'     block 1's attention loom passes threads between the ribbons, both ways (alpha = a_ij)
 *   'thinks'   each ribbon brightens through its own small paper lantern (feed-forward; glow = activation)
 *   'Six'      the count: block 1 re-lights on the word, then the front crosses one block every 0.6 s (threads cross,
 *              then lanterns flash), each 'BLOCK n' header brightening as it is reached; block 6 by ≈ 7.2 s. The camera
 *              trucks right with the front through blocks 1-3, then eases back to reveal all six
 *   hold       on EVERY ribbon a thin bright core runs unbroken through all six blocks (the residual lane) beside the
 *              dimmed side-trips; the ILLUSTRATIVE tag holds lower-right; a 5% push in the last second
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { MOODS, defineShot, mixLab, withAlpha } from '../../../film';
import { glow, paperLantern } from '../../../film/silhouette/metaphors/kit';
import { softPlate } from '../../../film/silhouette/type';
import { encoderForward } from '../sets/ch10-s10-loom';
import { rimNear } from '../sets/rimNear';
import { clockFace } from '../sets/ch10-s09-clock';
import { INK, clamp01, hallBackdrop, ink, kMirror, lerp, monotone, sm, tq12, vNote, win, wordSlip } from '../sets/ch10-s06-kit';
import { parchmentPlate } from '../../../film/silhouette/metaphors/kit';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s10';
const CY = MOODS.serverCyan;
const CORE = mixLab(CY.core, '#ffffff', 0.25);

const TOK = ['crossed', 'the', 'river', 'bank'];
const T_ = TOK.length;
const L = 6;
const REC = encoderForward(T_, L);
const N_MAX = Math.max(...REC.norms.flat());
const FF_MAX = Math.max(...REC.ff.flat());

const LEFT = 250;
const RIGHT = 1250;
const BW = (RIGHT - LEFT) / L;
const rowY = (t: number) => 268 + t * 82;
const TOP = rowY(0) - 50;
const BOT = rowY(T_ - 1) + 40;
const attX = (l: number) => LEFT + l * BW + BW * 0.3;
const ffX = (l: number) => LEFT + l * BW + BW * 0.74;

/** when block l is counted: block 1 on 'Six' itself (re-lit), then one block every 0.6 s, the sixth by ≈ 7.2 s */
const countAt = (six: number, l: number) => six + 0.6 * l;
/** the toy row the shot opens on (ch10-s06's plate: crossed · the · river · bank in a line), in L4 world px */
const TOY = { y: 196, x: [172, 330, 488, 646], plate: { x: 70, y: 120, w: 700, h: 190 } };

interface B {
  D: number;
  talk: number;
  think: number;
  six: number;
  over: number;
  /** the front leaves block 6 */
  frontEnd: number;
  front: (t: number) => number;
  cam: (t: number) => Camera3;
}
/** A: close on the slips and block 1 (headers inside the safe area) · A2: the truck right with the front through blocks
 *  1-3 (≈ 7% of frame width per second) · B: eased back to all six for the lane hold · C: a 5% push in the last second */
const CAM_A: Camera3 = { x: 420, y: 350, z: 280, lens: 1 };
const CAM_A2: Camera3 = { x: 545, y: 352, z: 262, lens: 1 };
const CAM_B: Camera3 = { x: 690, y: 360, z: -40, lens: 1 };
const CAM_C: Camera3 = { x: 690, y: 368, z: 8, lens: 1 };
const CAMS = [CAM_A, CAM_A2, CAM_B, CAM_C];
const mixCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: 1 });

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const talk = T.beat('talk');
    const think = T.beat('think');
    const six = T.beat('sixBlocks');
    const D = T.duration;
    const over = T.word('L1021', 'over');
    // 'Six times over' is counted: block 1 re-lights on 'Six', then the front crosses one block every 0.6 s (its
    // threads cross, then its lanterns flash), the sixth by ≈ 7.2 s
    const pts: [number, number][] = [
      [0, LEFT - 90],
      [talk - 0.2, attX(0) - 34],
      [talk + 0.3, attX(0) + 36],
      [think - 0.3, ffX(0) - 24],
      [think + 0.1, ffX(0) + 52],
      [six - 0.1, ffX(0) + 64],
    ];
    for (let l = 1; l < L; l++) {
      const a = countAt(six, l);
      pts.push([a - 0.18, attX(l) - 34], [a + 0.1, attX(l) + 36], [a + 0.26, ffX(l) - 10], [a + 0.4, ffX(l) + 52]);
    }
    const frontEnd = countAt(six, L - 1) + 0.75;
    pts.push([frontEnd, RIGHT + 60]);
    const front = monotone(pts);
    const cam = (t: number): Camera3 => {
      let c = mixCam(CAM_A, CAM_A2, sm((t - (six - 0.2)) / 1.9));
      c = mixCam(c, CAM_B, sm((t - (six + 0.9)) / (frontEnd - six - 0.9)));
      return mixCam(c, CAM_C, sm((t - (D - 1.05)) / 1.0));
    };
    const b: B = { D, talk, think, six, over, frontEnd, front, cam };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const cam = b.cam(t);
    f.camera(cam);
    f.backlight({ sunX: 700, sunY: 420, sunRadius: 620, intensity: 0.42 });
    hallBackdrop(f, ID, CAMS, { beamY: 70, dim: 0.42 });
    f.layer('L4', (c, env) => loom(c, t, b, env, cam));
    f.rim({ x: 0, y: -1 });
    // (review) the deepest-black plane: a carved chair back at the lower-left corner, blurred on L5, so the pull-back
    // slides three planes (hall, loom, chair) against each other and the wide's empty floor band has a foreground
    rimNear(f, { kind: 'chair', side: 'left', ref: CAM_B, scale: 0.6 });
    // the label sets in once the pull-back has carried the block headers clear of the top band
    const la = win(t, b.six + 1.3, b.six + 1.75);
    if (la > 0) {
      softPlate(f.c, 640, 44, 660, 72, CY.fg, 0.6 * la);
      ink(f.c, 'attention → feed-forward, × 6', 640, 54, { size: 29, align: 'center', color: mixLab('#efe3cf', CY.core, 0.2), alpha: la, legible: true });
    }
    // (review round 4) the film's standard stamped tag, lower-right, from the moment the loom runs: the toy numbers
    // are illustrative (as in ch10-s06 and ch08-s09)
    const ta = win(t, b.talk - 0.3, b.talk + 0.2);
    if (ta > 0) {
      const tx = 1176;
      const ty = 604;
      const tagCol = mixLab(CY.rim, '#efe3cf', 0.45);
      const tagO = { font: 'sc' as const, size: 20, weight: 600, tracking: 2.5, align: 'right' as const, color: tagCol, legible: true };
      // (review) a stamped tag, not text over busy art: an opaque plate the size of the stroked box, feathered at its rim
      const tw0 = ink(f.c, 'ILLUSTRATIVE', tx, ty, { ...tagO, alpha: 0 });
      softPlate(f.c, tx - tw0 / 2 - 1, ty - 7.5, tw0 + 40, 52, CY.fg, 0.6 * ta);
      f.c.save();
      f.c.globalAlpha *= 0.85 * ta;
      f.c.fillStyle = CY.fg;
      f.c.fillRect(tx - tw0 - 10, ty - 24, tw0 + 18, 33);
      f.c.restore();
      const tw = ink(f.c, 'ILLUSTRATIVE', tx, ty, { ...tagO, alpha: 0.85 * ta });
      f.c.save();
      f.c.globalAlpha *= 0.5 * ta;
      f.c.strokeStyle = tagCol;
      f.c.lineWidth = 1.2;
      f.c.strokeRect(tx - tw - 10, ty - 24, tw + 18, 33);
      f.c.restore();
    }
  },
});

// ================================================================================================= the loom
function loom(c: C, t: number, b: B, env: PaintEnv, cam: Camera3) {
  const tq = tq12(t);
  const ink0 = env.fill('ink');
  const fx = b.front(t);
  const litAt = (x: number) => sm(clamp01((fx - x + 10) / 60));
  // the hold: the lane is picked out, threads and lanterns dim to 0.4
  const lane = win(t, b.frontEnd - 0.15, b.frontEnd + 0.5);
  const dimHold = 1 - 0.6 * lane;
  // stage position of an L4 world point (for safe-area checks on the block headers)
  const sc = 1000 / (1000 - cam.z);
  const toStage = (x: number, y: number) => ({ x: (x - cam.x) * sc + 640, y: (y - cam.y) * sc + 360 });

  // ---------------------------------------------------------------- frames of the six looms (behind)
  for (let l = 0; l < L; l++) {
    const x0 = attX(l) - BW * 0.16;
    const x1 = attX(l) + BW * 0.16;
    c.save();
    c.fillStyle = ink0;
    for (const px of [x0, x1]) {
      c.fillRect(px - 4, TOP - 40, 8, BOT - TOP + 120);
      c.beginPath();
      c.arc(px, TOP - 46, 7, 0, Math.PI * 2);
      c.fill();
    }
    c.fillRect(x0 - 10, TOP - 34, x1 - x0 + 20, 9);
    c.fillRect(x0 - 10, BOT + 52, x1 - x0 + 20, 8);
    c.fillRect(ffX(l) - 24, TOP - 34, 48, 7);
    c.strokeStyle = withAlpha(env.mood.rim, 0.12);
    c.lineWidth = 0.8;
    c.beginPath();
    for (let k = 1; k < 8; k++) {
      const px = x0 + ((x1 - x0) * k) / 8;
      c.moveTo(px, TOP - 25);
      c.lineTo(px, BOT + 52);
    }
    c.stroke();
    c.restore();
    // headers show only while wholly inside the safe area (≥ 36 px from the top, 64 px from the sides)
    const hx = LEFT + l * BW + BW * 0.5;
    const hp = toStage(hx, TOP - 62);
    const half = 66 * sc; // the header raised to the legibility floor (~24 px small caps)
    const safe = clamp01((hp.y - 18 * sc - 36) / 14) * clamp01((hp.x - half - 64) / 24) * clamp01((1216 - hp.x - half) / 24);
    // each header brightens as the front reaches its block (block 1's on 'Six' itself): the count is read
    const reach = l === 0 ? win(t, b.six - 0.1, b.six + 0.1) : win(fx, attX(l) - 50, attX(l) - 10);
    const hot = reach * (1 - 0.7 * (l === 0 ? win(t, b.six + 0.5, b.six + 1.1) : win(fx, ffX(l) + 60, ffX(l) + 230)));
    // (the headers wait for the count: before it, 'talk' and 'think alone' own the top of block 1)
    const shown = safe * win(t, b.six - 0.3, b.six);
    if (shown > 0.003) {
      if (hot > 0.02) glow(c, hx, TOP - 69, 54, CY.core, 0.35 * hot * shown);
      ink(c, `BLOCK ${l + 1}`, hx, TOP - 62, { font: 'sc', size: 19, weight: 600, tracking: 2.5, align: 'center', color: mixLab(env.mood.rim, '#ffffff', 0.15 + 0.6 * hot), alpha: (0.55 + 0.45 * hot) * shown, legible: true });
    }
  }

  // ---------------------------------------------------------------- attention threads, both ways
  // block 1 is re-lit on 'Six' (the count starts there): its threads pulse, then its lanterns flash
  const recount = win(t, b.six - 0.05, b.six + 0.12) * (1 - win(t, b.six + 0.3, b.six + 0.65));
  const recountFF = win(t, b.six + 0.22, b.six + 0.36) * (1 - win(t, b.six + 0.5, b.six + 0.9));
  for (let l = 0; l < L; l++) {
    const lit = Math.min(1, litAt(attX(l) - 20) + (l === 0 ? 0.8 * recount : 0));
    const xL = attX(l) - BW * 0.15;
    const xR = attX(l) + BW * 0.15;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < T_; i++)
      for (let j = 0; j < T_; j++) {
        if (i === j) continue;
        const w = REC.att[l][i][j];
        // i reads j: the thread leaves row j and arrives on row i; i < j bows right, i > j bows left
        const bow = i < j ? 14 : -14;
        const col = mixLab(CY.halo, CORE, lit);
        // a thread flashes as the front crosses its block
        const cross = l === 0 ? recount : win(fx, attX(l) - 30, attX(l) + 10) * (1 - win(fx, attX(l) + 60, ffX(l) + 120));
        c.strokeStyle = withAlpha(mixLab(col, '#ffffff', 0.4 * cross), Math.min(1, (0.06 + 0.85 * w) * lit + 0.35 * cross) * dimHold);
        c.lineWidth = 0.6 + w * 4.5;
        c.beginPath();
        c.moveTo(xL, rowY(j));
        c.bezierCurveTo(attX(l) + bow, rowY(j), attX(l) + bow, rowY(i), xR, rowY(i));
        c.stroke();
      }
    c.restore();
    if (l === 0) {
      const a = win(t, b.talk - 0.1, b.talk + 0.5) * (1 - win(t, b.six - 0.5, b.six - 0.2));
      ink(c, 'talk', attX(0) + 8, TOP - 76, { italic: true, size: 23, align: 'right', color: CORE, alpha: a, legible: true });
      const a2 = win(t, b.think - 0.1, b.think + 0.5) * (1 - win(t, b.six - 0.5, b.six - 0.2));
      ink(c, 'think alone', ffX(0) - 12, TOP - 76, { italic: true, size: 23, align: 'left', color: CORE, alpha: a2, legible: true });
    }
  }

  // ---------------------------------------------------------------- ribbons (residual streams)
  const spool = win(t, 0.55, 0.95);
  c.save();
  c.globalAlpha *= spool;
  for (let r = 0; r < T_; r++) {
    const y = rowY(r);
    let xPrev = LEFT - 70;
    for (let l = 0; l <= L; l++) {
      const xEnd = l < L ? ffX(l) + 16 : RIGHT + 40;
      const w = 3 + 9 * (REC.norms[l][r] / N_MAX);
      const lit0 = litAt(xPrev);
      const lit1 = litAt(xEnd);
      const base = mixLab(env.fill('set'), env.mood.haze, 0.25);
      const g = c.createLinearGradient(xPrev, 0, xEnd, 0);
      // ahead of the front a ribbon is dim (0.3); behind it, lit; in the hold the bodies drop to ≈ 0.35 so the lane's
      // 2 px white core reads as one unbroken line beside the dimmed side-trips
      const keep = 1 - 0.65 * lane;
      g.addColorStop(0, withAlpha(mixLab(base, CORE, 0.12 + 0.7 * lit0), (0.3 + 0.7 * lit0) * keep));
      g.addColorStop(1, withAlpha(mixLab(base, CORE, 0.12 + 0.7 * lit1), (0.3 + 0.7 * lit1) * keep));
      c.save();
      c.fillStyle = g;
      c.beginPath();
      c.roundRect(xPrev, y - w / 2, xEnd - xPrev, w, w / 2);
      c.fill();
      const xl = Math.min(xEnd, fx);
      if (xl > xPrev) {
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = withAlpha(CORE, 0.5 * (1 - 0.8 * lane));
        c.lineWidth = Math.max(1, w * 0.3);
        c.beginPath();
        c.moveTo(xPrev, y);
        c.lineTo(xl, y);
        c.stroke();
      }
      c.restore();
      xPrev = xEnd;
    }
    // shimmer travelling along the lit part (on ones; it is light)
    c.save();
    for (let k = 0; k < 7; k++) {
      const sx = LEFT - 60 + ((t * 110 + k * 170 + r * 41) % (RIGHT - LEFT + 100));
      if (sx > fx) continue;
      glow(c, sx, y, 14, CY.core, 0.22 * dimHold);
    }
    c.restore();
    // the front's bright head: a 40 px streak of core light riding the front
    const headA = clamp01((fx - (LEFT - 60)) / 40) * (1 - clamp01((fx - RIGHT) / 50)) * (1 - lane);
    if (headA > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const hg = c.createLinearGradient(fx - 40, 0, fx, 0);
      hg.addColorStop(0, withAlpha(CORE, 0));
      hg.addColorStop(1, withAlpha('#ffffff', 0.9 * headA));
      c.strokeStyle = hg;
      c.lineWidth = 4;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(fx - 40, y);
      c.lineTo(fx, y);
      c.stroke();
      c.restore();
      glow(c, fx, y, 30, CY.core, 0.55 * headA);
    }
    // the highway lane: in the hold a thin bright core runs unbroken through every block on EVERY ribbon, beside the
    // side-trips into threads and lanterns (the architecture, not one word)
    if (lane > 0) {
      const run = sm(clamp01((t - b.frontEnd + 0.15 - r * 0.06) / 1.3));
      const xe = LEFT - 60 + (RIGHT - LEFT + 100) * run;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(CY.core, 0.32 * lane);
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(LEFT - 60, y);
      c.lineTo(xe, y);
      c.stroke();
      c.strokeStyle = withAlpha(mixLab(CY.core, '#ffffff', 0.75), lane);
      c.lineWidth = 2;
      c.stroke();
      c.restore();
      glow(c, xe, y, 36, CY.core, 0.45 * lane * (1 - run * 0.7));
    }
  }

  c.restore();

  // ---------------------------------------------------------------- feed-forward lanterns and write-back strands
  for (let l = 0; l < L; l++) {
    const lit = litAt(ffX(l));
    for (let r = 0; r < T_; r++) {
      const y = rowY(r);
      // each block's lanterns fire as the front passes (a flash over the steady glow), dimmed in the hold
      const fire = Math.max(win(fx, ffX(l) - 10, ffX(l) + 30) * (1 - win(fx, ffX(l) + 70, ffX(l) + 220)), l === 0 ? recountFF : 0);
      const act = Math.min(1, (REC.ff[l][r] / FF_MAX) * lit + 0.6 * fire) * dimHold;
      const ly = y - 28;
      c.save();
      c.strokeStyle = ink0;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(ffX(l), r === 0 ? TOP - 27 : rowY(r - 1) + 12);
      c.lineTo(ffX(l), ly - 15);
      c.stroke();
      c.restore();
      paperLantern(c, { x: ffX(l), y: ly, r: 12, act, tassel: false, halo: 0.5 }, env);
      c.save();
      c.globalAlpha *= (0.3 + 0.7 * lit) * dimHold;
      c.strokeStyle = mixLab(CY.halo, CORE, lit);
      c.lineWidth = 0.6 + 3 * (REC.dFF[l][r] / N_MAX);
      c.beginPath();
      c.moveTo(ffX(l), ly + 12);
      c.quadraticCurveTo(ffX(l) + 4, y, ffX(l) + 16, y);
      c.stroke();
      c.restore();
    }
  }

  // ---------------------------------------------------------------- the word-slips that spool the ribbons
  // they open as ch10-s06's toy row (crossed · the · river · bank on a strip of its parchment plate, each with s05's
  // mirror and sealed note; s09's clock faces faintly pinned on), then swing down into the loom's stack (on twos)
  const go = sm(clamp01((tq - 0.2) / 0.62));
  const plateA = 1 - win(t, 0.25, 0.75);
  if (plateA > 0.003) {
    c.save();
    c.globalAlpha *= plateA;
    parchmentPlate(c, { ...TOY.plate, seed: 1006 }, env);
    c.restore();
  }
  for (let r = 0; r < T_; r++) {
    const sway = 0.02 * Math.sin(tq * 1.3 + r * 1.7) + 0.12 * Math.sin(Math.PI * go) * (r % 2 ? 1 : -1);
    const x = lerp(TOY.x[r], LEFT - 110, go);
    const y = lerp(TOY.y, rowY(r) - 26, go) - 30 * Math.sin(Math.PI * go);
    const w = Math.max(48, 26 + TOK[r].length * 25 * 0.5);
    const tok = 1 - win(t, 0.3, 0.8);
    if (tok > 0.003) {
      kMirror(c, x - w / 2 - 16, y + 24, 0, 1.1, tok, INK, env);
      vNote(c, x + w / 2 - 14, y + 64, 0.45, tok, 0.04, env);
    }
    wordSlip(c, { x, y, text: TOK[r], size: 25, h: 50, rot: sway, lit: 0.25 * lane });
    // ch10-s09's clock faces, faintly pinned on for the first second (each set by its place in line)
    const ck = 0.7 * (1 - win(t, 0.4, 1.1));
    // (pinned just above the slip's top-right corner, as in s09, clear of the lettering)
    if (ck > 0.003) clockFace(c, x + w / 2 - 12, y - 27, 20, r, ck, env.mood.rim);
  }
}
