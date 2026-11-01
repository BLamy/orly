/**
 * ch07-s01 — workerd's restore, step by step (winterBlue, iris in). Canonical harbour town, the night A went dark
 * (illustrative): House C holds the Plate at C · 9 · from 7 (claimed, NOT opened: crown lamp dark), A and B dark.
 *
 *   iris     the iris opens on House C's window lamp (C centred)
 *   badge    the crane down-left toward the square passes the wellhead badge 'workerd · 28 Oct'
 *   claim    arriving on the square: the Plate reads C · 9 · 7, crown unlit; the 9 and the 7 glint on 'nine' / 'seven'
 *   wipe     push in on C's window: the keeper tips its local ledger into the stove; it flares and curls to ash
 *   book     the Book of session 7 rides up C's pulley line
 *   scrolls  four tagged scrolls follow in order and hang in a chain under the pulley block
 *   skip     the keeper lays pages into the room's book; a page already laid flashes and is set aside unlaid
 *   gap      GHOST what-if (cold, desaturated; no red): the chain shows a dark gap where scroll 3 should hang;
 *            the keeper's hand stops mid-reach; label 'Missing scroll: the restore refuses'
 *   crc      still the ghost: scroll 4's knot glints, it crumples and drops out unreadable
 *   never    its page stays a blank outline over the book; the ghost dissolves, the true chain is whole
 *   replay   pages drop into the room's book as ink silhouettes; the members in the lantern never move
 *   back     slip #42 glows inside the lantern (the lantern has warmed as the pages came back)
 *   open     C sends its own small Book down the line (the camera follows it back to the square); the from tile
 *            turns 7 → 9 and only then the crown lamp lights
 * The C pulley line is drawn on the terrace plane (L3) so its riders keep the house's scale; its far end is re-projected
 * to the wellhead pulley (L4) every frame. Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { cast } from '../cast';
import { TOWN, paintTown } from '../sets/harbourTown';
import { WELL } from '../sets/wellAndPlate';
import { roomLantern } from '../sets/roomLantern';
import { book, scroll } from '../sets/walRibbon';
import { camAt, clamp01, cord, cordAt, glowDot, label, lerp, paper, pulse, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';

const ID = 'ch07-s01';
const C = TOWN.C;
/** the pulley block on C's sill (L3) and the wellhead pulley (L4) */
const BLOCK = { x: C.pulley.x, y: C.pulley.y };
const WELL_TOP_L4 = { x: TOWN.well.x + WELL.pulley.x, y: TOWN.well.y + WELL.pulley.y };
/** inside C's main window (L3): keeper (left of the mullion), stove (lower left), the Room Lantern (right) */
const KEEP = { x: 1067, y: 430, s: 0.26 };
const STOVE = { x: 1056, y: 387 };
const LANT = { x: 1091, y: 386, s: 0.37 };
/** the room's book on the sill, in front of the window */
const RBOOK = { x: 1084, y: 390 };
const ASIDE = { x: 1104, y: 389 };

const C0: Camera3 = { x: 1207, y: 360, z: 150, lens: 1 };
const WIDE: Camera3 = { x: 640, y: 395, z: 150, lens: 1 };
const WIDE2: Camera3 = { x: 630, y: 398, z: 178, lens: 1 };
const MED: Camera3 = { x: 1140, y: 372, z: 700, lens: 1 };
const END: Camera3 = { x: 664, y: 398, z: 205, lens: 1 };

function l4ToL3(cam: Camera3, p: { x: number; y: number }) {
  const sp = toScreen(LAYERS.L4, cam, p.x, p.y);
  return toLayer(LAYERS.L3, cam, sp.x, sp.y);
}
const SAG = 40;
/** a point on C's pulley line in L3 coords: u 0 = the block on C's sill, 1 = the wellhead pulley */
let FAR: { x: number; y: number } | null = null;
function lineAt(cam: Camera3, u: number) {
  const w = FAR ?? l4ToL3(cam, WELL_TOP_L4);
  return cordAt(BLOCK.x, BLOCK.y, w.x, w.y, SAG, clamp01(u));
}
/** a small rider hanging under the line at u */
function rider(c: C2, env: PaintEnv, cam: Camera3, u: number, draw: (x: number, y: number) => void) {
  const p = lineAt(cam, u);
  c.strokeStyle = withAlpha(env.fill('ink'), 0.9);
  c.lineWidth = 0.5;
  c.beginPath();
  c.moveTo(p.x, p.y);
  c.lineTo(p.x, p.y + 3.5);
  c.stroke();
  draw(p.x, p.y + 3.5);
}
const h1 = (i: number) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      badge: T.beat('badge'),
      claim: T.beat('claim'),
      nine: T.word('L0701', 'nine'),
      seven: T.word('L0701', 'seven'),
      wipe: T.beat('wipe'),
      book: T.beat('book'),
      scrolls: T.beat('scrolls'),
      skip: T.beat('skip'),
      gap: T.beat('gap'),
      crc: T.beat('crc'),
      never: T.beat('never'),
      replay: T.beat('replay'),
      back: T.beat('back'),
      only: T.word('L0707', 'only'),
      ownBook: T.word('L0707', 'book'),
      open: T.beat('open'),
      l704end: T.line('L0704').end,
    };
    const cams: CamKey[] = [
      { t: 0, cam: C0 },
      { t: 0.7, cam: { ...C0, z: C0.z + 4 } },
      { t: b.claim + 0.8, cam: WIDE },
      { t: b.seven + 0.45, cam: WIDE2 },
      { t: b.wipe - 1.01, cam: MED },
      { t: b.only - 0.45, cam: MED },
      { t: b.open + 0.3, cam: WIDE },
      { t: b.D, cam: END },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // ---- the ghost what-if (gap → never): cold, desaturated, the dark slot in the chain
    const ghost = seg(t, b.gap - 0.25, b.gap + 0.5) * (1 - seg(t, b.never + 0.55, b.never + 1.3));
    // ---- the Book of session 7 rides up (u 1 → 0), is taken in, its pages laid
    const bookUp = 1 - sm((tq - (b.book - 0.9)) / 1.55);
    const bookIn = seg(tq, b.book + 0.65, b.book + 1.05);
    // ---- four scrolls ride up in order and hang in a chain under the block
    const chainU = (i: number) => 0.035 + 0.026 * i;
    const scrollU = (i: number) => {
      const st = b.scrolls - 0.75 + i * 0.3;
      const k = sm((tq - st) / 1.35);
      return lerp(1, chainU(i), k);
    };
    // when each scroll is taken in by the keeper (scroll 3 and 4 wait through the ghost)
    const takeAt = [b.skip - 0.75, b.skip + 0.85, b.replay + 0.25, b.replay + 1.2];
    const taken = (i: number) => seg(tq, takeAt[i], takeAt[i] + 0.35);
    // the keeper's reach: toward the chain for each take, then forward to the book as pages are laid
    let reach = 0;
    for (const at of [b.book + 0.6, ...takeAt]) reach = Math.max(reach, pulse(tq, at - 0.3, 0.3, 0.25, 0.45));
    let lay = 0;
    for (const at of [b.book + 1.15, takeAt[0] + 0.45, takeAt[1] + 0.45, b.replay + 0.7, b.replay + 1.65, b.replay + 2.4]) lay = Math.max(lay, pulse(tq, at, 0.25, 0.4, 0.4));
    // the ghost freezes the hand mid-reach toward the empty slot
    const frozen = seg(t, b.gap + 0.1, b.gap + 0.45) * (1 - seg(t, b.never + 0.6, b.never + 1.0));
    const reachNow = Math.max(reach * (1 - frozen), 0.7 * frozen);
    // ---- the local ledger tipped into the stove
    const tipAt = b.wipe + 0.75;
    const tip = seg(tq, tipAt - 0.05, tipAt + 0.5);
    const burn = pulse(t, tipAt + 0.45, 0.25, 0.5, 1.4);
    const ledgerA = 1 - seg(t, tipAt + 0.55, tipAt + 0.95);
    // ---- the room's book fills; the lantern warms as the pages come back
    const pagesLaid = 1 + 2 * seg(t, b.book + 1.0, b.book + 1.6) + seg(t, takeAt[0] + 0.4, takeAt[0] + 0.8) + seg(t, takeAt[1] + 0.4, takeAt[1] + 0.8) + 4 * seg(t, b.replay, b.replay + 3.0);
    const warm = 0.22 + 0.35 * seg(t, b.replay, b.back) + 0.43 * seg(t, b.back - 0.2, b.back + 0.6);
    const slipGlow = seg(t, b.back - 0.15, b.back + 0.4);
    // ---- C's own Book goes down (u 0 → 1), the from tile turns, then the crown lights
    const ownOut = seg(tq, b.only + 0.2, b.only + 0.7);
    const ownDown = sm((tq - (b.ownBook - 0.6)) / (b.open - 0.35 - (b.ownBook - 0.6)));
    const flipU = clamp01((t - (b.open + 0.05)) / 0.5);
    const crown = seg(t, b.open + 0.6, b.open + 1.1);
    const bucketDown = seg(t, b.open - 0.3, b.open + 0.9);

    const drawInterior = (c: C2, env: PaintEnv) => {
          // inside C's main window, clipped to the opening (dynamic art in a blurred layer sits above the baked
          // wall, so the window does its own masking): stove, keeper, the Room Lantern (members never move)
          const wn = C.main;
          const ink = env.fill('ink');
          c.save();
          c.beginPath();
          c.rect(wn.x - wn.w / 2, wn.y - wn.h / 2, wn.w, wn.h);
          c.clip();
          // the stove: iron body, flue, a glowing door (behind the keeper)
          c.fillStyle = mixLab(ink, env.mood.fg, 0.1);
          c.fillRect(STOVE.x - 4.5, STOVE.y - 13, 9, 13);
          c.fillRect(STOVE.x - 5.5, STOVE.y - 14.5, 11, 2);
          c.fillRect(STOVE.x - 2.6, STOVE.y - 40, 2.2, 26);
          const doorG = 0.35 + 0.65 * burn;
          c.fillStyle = mixLab(ink, tone(env, '#ff9a4a', 0.05), 0.5 * doorG + 0.15);
          c.fillRect(STOVE.x - 2.8, STOVE.y - 9, 5.6, 5);
          if (burn > 0.01) glowDot(c, STOVE.x, STOVE.y - 8, 16, tone(env, '#ffa050', 0.05), 0.85 * burn);
          // ash curling up past the flue
          if (t > tipAt + 0.5 && t < tipAt + 3.2) {
            for (let i = 0; i < 9; i++) {
              const st = tipAt + 0.5 + i * 0.16;
              const u = (tq - st) / 1.6;
              if (u <= 0 || u >= 1) continue;
              c.fillStyle = withAlpha(mixLab(ink, env.mood.haze, 0.35), 0.8 * (1 - u));
              c.fillRect(STOVE.x - 2 + Math.sin(u * 6 + i) * 2.5 + u * 4 * (h1(i) - 0.3), STOVE.y - 16 - u * 24, 1.2, 1.2);
            }
          }
          roomLantern(c, env, { x: LANT.x, y: LANT.y, s: LANT.s, lit: warm, members: 4, tq: 0, door: 0, hook: false, slips: [{ x: 0.15, y: 0.55, tick: 1, alpha: slipGlow }] });
          if (slipGlow > 0.01) glowDot(c, LANT.x + 0.15 * 60 * 0.32 * LANT.s, LANT.y - 10 * LANT.s - 0.55 * 62 * LANT.s, 9, tone(env, '#ffe2a0', 0.05), 0.7 * slipGlow * (0.85 + 0.15 * Math.sin(t * 3)));
          const hold = seg(tq, b.wipe - 0.7, b.wipe - 0.2) * (1 - seg(tq, tipAt + 0.5, tipAt + 1.1));
          const pose = blendPose(blendPose(blendPose(POSES.stand, POSES.write, 0.55 * reachNow), POSES.write, lay * 0.9), POSES.present, hold);
          const ko = { x: KEEP.x, y: KEEP.y, facing: (hold > 0.5 ? 'left' : 'right') as 'left' | 'right', pose, scale: KEEP.s, ink: PUPPET_NEAR_BLACK, light: { x: 1, y: -0.3, floor: 0.2 }, edgeRim: { x: 1, y: -0.35, px: 2.5, alpha: 0.9, warm: 0.75 } };
          cast['keeper-c'].draw(c, ko, env);
          // the local ledger: held up, tipped into the stove
          if (ledgerA > 0.01 && t > b.wipe - 0.6) {
            const hand = cast['keeper-c'].anchor(ko, 'handF');
            const hx = Math.max(STOVE.x + 2, Math.min(hand.x, KEEP.x - 3)), hy = Math.min(hand.y - 2, 364);
            const x = lerp(hx, STOVE.x + 1, tip), y = lerp(hy, STOVE.y - 15, tip);
            c.save();
            c.globalAlpha = ledgerA * seg(t, b.wipe - 0.6, b.wipe - 0.2);
            c.translate(x, y);
            c.rotate(-1.4 * tip);
            c.fillStyle = mixLab(tone(env, '#5a3d24', 0.15), env.mood.fg, 0.2);
            c.fillRect(-4.5, -3.2, 9, 6.4);
            c.fillStyle = paper(env, 0.1);
            c.fillRect(-3.8, -2.3, 7.6, 1.2);
            c.restore();
          }
          c.restore();
          // the window's own mullions and sill (over the interior)
          const set = mixLab(env.fill('set'), env.fill('ink'), 0.62);
          c.fillStyle = set;
          c.fillRect(wn.x - 1.2, wn.y - wn.h / 2, 2.4, wn.h);
          c.fillRect(wn.x - wn.w / 2 - 5, wn.y + wn.h / 2, wn.w + 10, 5);
        
    };
    const drawChain = (c: C2, env: PaintEnv) => {
          // C's pulley line on the terrace plane, its far end held on the wellhead pulley
          const w = FAR ?? l4ToL3(cam, WELL_TOP_L4);
          cord(c, BLOCK.x, BLOCK.y, w.x, w.y, SAG, withAlpha(env.fill('ink'), 0.9), 0.7);
          const ink = env.fill('ink');
          // the Book of session 7 rides up
          if (bookUp > 0.002 || bookIn < 1) {
            if (bookIn < 0.999 && t > b.book - 1) {
              if (bookIn <= 0.001) rider(c, env, cam, Math.max(0.02, bookUp), (x, y) => book(c, env, { x, y: y + 9, s: 0.36, tag: 'session 7', tagAlpha: 0.9 }));
              else {
                const a = lineAt(cam, 0.02);
                book(c, env, { x: lerp(a.x, RBOOK.x - 14, bookIn), y: lerp(a.y + 12, RBOOK.y - 2, bookIn), s: 0.36, alpha: 1 - seg(bookIn, 0.7, 1) });
              }
            }
          }
          // the chain of four scrolls (ghost: scroll 3 missing, scroll 4 damaged and dropped)
          for (let i = 0; i < 4; i++) {
            if (t < b.scrolls - 0.8) break;
            const tk = taken(i);
            if (tk >= 0.999) continue;
            const u = scrollU(i);
            const missing = i === 2 ? ghost : 0;
            const damaged = i === 3 ? ghost * seg(t, b.crc - 0.1, b.crc + 0.3) : 0;
            const fall = i === 3 ? ghost * seg(tq, b.crc + 0.75, b.crc + 1.9) : 0;
            const p = lineAt(cam, u);
            const ga = 1 - missing;
            if (missing > 0.01) {
              // the empty slot: a dark gap with a faint outline where the scroll should hang
              c.save();
              c.globalAlpha = missing;
              c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.4), 0.55);
              c.setLineDash([1.6, 1.4]);
              c.lineWidth = 0.5;
              c.strokeRect(p.x - 7.5, p.y + 3, 15, 5);
              c.setLineDash([]);
              c.fillStyle = withAlpha(mixLab(ink, '#000', 0.4), 0.55);
              c.fillRect(p.x - 7, p.y + 3.5, 14, 4);
              c.restore();
            }
            if (ga <= 0.01) continue;
            const ox = lerp(0, RBOOK.x - 22 - p.x, sm(tk)) + fall * -6;
            const oy = lerp(0, RBOOK.y - 6 - p.y, sm(tk)) + fall * fall * 60;
            if (fall < 0.01) {
              c.strokeStyle = withAlpha(ink, 0.9 * (1 - tk));
              c.lineWidth = 0.4;
              c.beginPath();
              c.moveTo(p.x, p.y);
              c.lineTo(p.x, p.y + 3.5);
              c.stroke();
            }
            scroll(c, env, { x: p.x + ox, y: p.y + 5.5 + oy, s: 0.34, rot: -0.08 + fall * 2.2, tag: 1, frayed: damaged, glint: i === 3 ? ghost * pulse(t, b.crc - 0.05, 0.2, 0.4, 0.6) : 0, alpha: ga * (1 - seg(tk, 0.75, 1)) * (1 - seg(fall, 0.6, 1)) });
          }
          // the room's book on the sill: pages laid as ink silhouettes
          const rb = { x: RBOOK.x, y: RBOOK.y };
          c.fillStyle = paper(env, 0.12);
          c.beginPath();
          c.moveTo(rb.x - 10, rb.y);
          c.quadraticCurveTo(rb.x - 5, rb.y - 3, rb.x, rb.y - 1);
          c.quadraticCurveTo(rb.x + 5, rb.y - 3, rb.x + 10, rb.y);
          c.lineTo(rb.x + 10, rb.y + 1.6);
          c.lineTo(rb.x - 10, rb.y + 1.6);
          c.closePath();
          c.fill();
          c.fillStyle = mixLab(tone(env, '#5a3d24', 0.15), env.mood.fg, 0.3);
          c.fillRect(rb.x - 10.5, rb.y + 1.4, 21, 1.4);
          const n = Math.min(9, pagesLaid);
          for (let k = 0; k < Math.floor(n); k++) {
            c.fillStyle = withAlpha(mixLab('#2a2016', env.mood.fg, 0.2), 0.7);
            c.fillRect(rb.x - 9 + (k % 2) * 10.5, rb.y - 1.6 - Math.floor(k / 2) * 0.55, 7.5, 0.5);
          }
          // pages in flight from the keeper's hand to the book (ink silhouettes)
          const flights: number[] = [b.book + 1.1, b.book + 1.3, takeAt[0] + 0.45, takeAt[1] + 0.45];
          for (let k = 0; k < 8; k++) flights.push(b.replay + 0.1 + k * 0.36);
          const from = { x: KEEP.x + 9, y: 373 };
          flights.forEach((st, k) => {
            const u = (tq - st) / 0.55;
            if (u <= 0 || u >= 1) return;
            const x = lerp(from.x, rb.x - 4 + (k % 3) * 4, u), y = lerp(from.y, rb.y - 2, u) - Math.sin(Math.PI * u) * 5;
            c.save();
            c.translate(x, y);
            c.rotate(Math.sin(u * 7 + k) * 0.5);
            c.fillStyle = withAlpha(mixLab(env.fill('ink'), '#2a2016', 0.3), 0.92);
            c.fillRect(-2.6, -1.8, 5.2, 3.6);
            c.restore();
          });
          // skip: a page already laid flashes and is set aside, unlaid
          const sk = clamp01((tq - (b.skip - 0.25)) / 1.0);
          if (sk > 0 && t < b.skip + 6) {
            const flash = pulse(t, b.skip - 0.05, 0.15, 0.3, 0.6);
            const toAside = seg(sk, 0.45, 1);
            const x = lerp(rb.x - 1, ASIDE.x, toAside), y = lerp(rb.y - 6, ASIDE.y - 1.5, toAside) - Math.sin(Math.PI * toAside) * 4;
            c.save();
            c.translate(x, y);
            c.rotate(0.25 * toAside);
            c.fillStyle = mixLab(paper(env, 0.1), '#fff4d8', 0.6 * flash);
            c.fillRect(-2.8, -2, 5.6, 4);
            c.restore();
            if (flash > 0.01) glowDot(c, x, y, 9, tone(env, '#f6e0a0', 0.1), 0.8 * flash);
          }
          // never: the damaged scroll's page is a blank outline over the book
          const blank = ghost * seg(t, b.never - 0.15, b.never + 0.25);
          if (blank > 0.01) {
            c.save();
            c.globalAlpha = blank;
            c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.3), 0.8);
            c.lineWidth = 0.45;
            c.setLineDash([1.2, 1]);
            c.strokeRect(rb.x - 4, rb.y - 13, 8, 6);
            c.setLineDash([]);
            c.restore();
          }
          // C's own small Book goes down the line
          if (ownOut > 0.001 && ownDown < 0.999) {
            if (ownDown <= 0.001) {
              const a = lineAt(cam, 0.02);
              book(c, env, { x: lerp(RBOOK.x - 12, a.x, ownOut), y: lerp(RBOOK.y - 2, a.y + 12, ownOut), s: 0.3 });
            } else rider(c, env, cam, Math.max(0.02, ownDown), (x, y) => book(c, env, { x, y: y + 8, s: 0.3 + 0.1 * ownDown }));
          }
          // the pulley block's iron cheek over the line
          c.fillStyle = ink;
          c.beginPath();
          c.arc(BLOCK.x, BLOCK.y, 2.6, 0, Math.PI * 2);
          c.fill();
        
    };
    // ---- the restore, cut in close on C's window (the interior and the chain at 6.5x on the action plane)
    const inset = t >= b.wipe - 1.0 && t < b.only - 0.45;
    if (inset) {
      const drift = seg(t, b.wipe - 1.0, b.only - 0.45);
      const K = 6.5 + 0.35 * drift;
      const ctr = { x: 1050 + 6 * drift, y: 374 };
      const at = { x: 640, y: 340 };
      FAR = { x: 520, y: 480 };
      f.camera({ x: 640, y: 360, z: 0, lens: 1 });
      f.backlight({ sunX: TOWN.moon.x, sunY: TOWN.moon.y + 30, intensity: 0.7 });
      f.layer('L2', (c, env) => {
        // the night beyond C's terrace: the ridge and a few far roofs above the wall line
        c.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.3);
        c.fillRect(-200, 120, 1700, 900);
      });
      f.fog('A');
      f.layer('L4', (c, env) => {
        c.save();
        c.translate(at.x, at.y);
        c.scale(K, K);
        c.translate(-ctr.x, -ctr.y);
        const wn = C.main;
        // the lit room behind the window
        c.save();
        c.beginPath();
        c.rect(wn.x - wn.w / 2, wn.y - wn.h / 2, wn.w, wn.h);
        c.clip();
        const g = c.createRadialGradient(wn.x + 8, wn.y, 2, wn.x, wn.y, 40);
        g.addColorStop(0, mixLab(tone(env, '#f2b45e', 0.1), '#fff2d6', 0.15 + 0.25 * warm));
        g.addColorStop(1, mixLab(tone(env, '#f2b45e', 0.1), env.mood.fg, 0.55));
        c.fillStyle = g;
        c.fillRect(wn.x - wn.w / 2, wn.y - wn.h / 2, wn.w, wn.h);
        c.restore();
        drawInterior(c, env);
        // C's facade around the window (a hole for the room), the sill and the pulley block
        const wall = new Path2D();
        wall.rect(ctr.x - 300, ctr.y - 200, 600, 400);
        wall.rect(wn.x - wn.w / 2, wn.y - wn.h / 2, wn.w, wn.h);
        c.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.62);
        c.fill(wall, 'evenodd');
        // stone courses on the facade (faint, rim-lit tops)
        c.save();
        c.clip(wall, 'evenodd');
        c.strokeStyle = withAlpha(env.fill('rim'), 0.1);
        c.lineWidth = 0.25;
        for (let y = ctr.y - 200; y < ctr.y + 200; y += 7) {
          c.beginPath();
          c.moveTo(ctr.x - 300, y);
          c.lineTo(ctr.x + 300, y);
          c.stroke();
          for (let x = ctr.x - 300 + ((y / 7) % 2) * 6; x < ctr.x + 300; x += 12) {
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x, y + 7);
            c.stroke();
          }
        }
        c.restore();
        c.strokeStyle = withAlpha(env.fill('rim'), 0.35);
        c.lineWidth = 0.35;
        c.strokeRect(wn.x - wn.w / 2, wn.y - wn.h / 2, wn.w, wn.h);
        c.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.75);
        c.fillRect(wn.x - wn.w / 2 - 5, wn.y + wn.h / 2, wn.w + 10, 5);
        c.fillRect(BLOCK.x - 1, BLOCK.y - 10, 2, 8);
        drawChain(c, env);
        c.restore();
      });
      f.rim({ x: 0, y: -1 });
      f.layer('L5', (c, env) => {
        // a blurred shutter edge at the right and the rope's near loop at the left (out of focus)
        c.fillStyle = env.fill('fg');
        c.fillRect(1196, -100, 200, 900);
        c.strokeStyle = env.fill('fg');
        c.lineWidth = 10;
        c.beginPath();
        c.moveTo(-40, 120);
        c.quadraticCurveTo(70, 420, 20, 760);
        c.stroke();
      });
      // the ghost what-if: cold and desaturated over the chain only (no red)
      if (ghost > 0.01) {
        const cc = f.c;
        const gx0 = at.x + (960 - ctr.x) * K, gx1 = at.x + (1046 - ctr.x) * K;
        const gy0 = at.y + (380 - ctr.y) * K, gy1 = at.y + (412 - ctr.y) * K;
        const ell = () => {
          cc.beginPath();
          cc.ellipse((gx0 + gx1) / 2, (gy0 + gy1) / 2, (gx1 - gx0) / 2, (gy1 - gy0) * 0.75, 0, 0, Math.PI * 2);
        };
        cc.save();
        cc.globalCompositeOperation = 'saturation';
        cc.globalAlpha = 0.8 * ghost;
        cc.fillStyle = '#808080';
        ell();
        cc.fill();
        cc.globalCompositeOperation = 'multiply';
        cc.globalAlpha = 0.3 * ghost;
        cc.filter = 'blur(18px)';
        cc.fillStyle = '#9fb4c8';
        ell();
        cc.fill();
        cc.restore();
      }
      FAR = null;
      const la = seg(t, b.gap - 0.15, b.gap + 0.3) * (1 - seg(t, b.crc - 0.6, b.crc - 0.15));
      label(f.c, f.mood, { id: `${ID}-missing`, text: 'Missing scroll: the restore refuses', x: 64, y: 92, alpha: la, italic: true });
      return;
    }
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 0, B: 0, C: 1 },
        lines: { C: 0 },
        plate: {
          house: 'C',
          epoch: 9,
          from: flipU < 0.5 ? 7 : 9,
          crown,
          flip: [1, 1, flipU < 1 && t > b.open ? flipU : 1],
          glint: [0, pulse(t, b.nine - 0.1, 0.2, 0.35, 0.6), pulse(t, b.seven - 0.1, 0.2, 0.35, 0.6) + 0.8 * pulse(t, b.open + 0.3, 0.2, 0.3, 0.8)],
        },
        plateLegible: true,
        tooth: null,
        well: { bucket: lerp(0.32, 1, bucketDown), load: bucketDown > 0.01 && bucketDown < 0.99 ? 'book' : 'none', glint: 0.35 },
        badge: { text: 'workerd · 28 Oct', legible: true, glint: pulse(t, b.badge + 1.2, 0.3, 0.5, 0.8) },
        lampPostLit: 0.45,
        skip: { L6: true },
      },
      {
        L3back: (c, env) => drawInterior(c, env),
        L3: (c, env) => drawChain(c, env),
      },
    );
  },
});
