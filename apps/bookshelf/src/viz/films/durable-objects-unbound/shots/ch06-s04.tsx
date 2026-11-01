/**
 * ch06-s04 — PROOF BEFORE RESPONSE in workerd (candleAmber, cut in).
 *
 * A vertical slice of the town (illustrative), one set for this shot: at the top, the Room Lantern's door in House A's
 * window (L4) with the Held Letter against its brass latch, House A's bell on its bracket, the badge 'workerd · 28 Oct'
 * by the door and a short run of the ribbon on the sill; below, the pulley line down to the wellhead, the Plate
 * (A · 7 · 7) on its frame and the keeper of House A with a lamp on a pole. L1 sky, L2 the ridge, L3 House A's wall
 * and the terrace's retaining wall, L5 a blurred shutter (top) and the railing (bottom).
 *
 *   written  4.93  the sender's slip flies in through the door; a page inks onto the sill's ribbon; the reply forms
 *                  behind the latch
 *   down     8.73  'cuts': the scissors snip just after the stamp; the scroll rides the pulley line; one continuous
 *                  ~4 s tilt follows it down to the wellhead
 *   look    14.99  the keeper raises its lamp on the pole to the Plate; the light falls on A · 7 · 7;
 *                  label 'upload → look again → bell'
 *   still   17.34  'A' glints; on 'seven' the epoch 7 glints
 *   bell    21.23  pull back to the two-level wide: House A's bell swings
 *   latch   22.36  the latch lifts; the letter flies out toward the sender's window
 *   tick    23.96  inset (upper right): the sender's slip takes its two-stroke tick
 *   local   26.15  back in on the door: a new page is done in the room's ledger, yet the latch stays shut (no bell
 *                  yet); the quote card sets upper left: '…cannot act on a value that a crash can still lose.'
 *   celld   30.68  a small labGreen inset (badge 'celld 0.6.3'): behind its latch a reply, a red-edged error slip and
 *                  a string of stream chunks, all held
 * Nothing below y 634 (the Well's base and railing sit in the caption band only as set dressing).
 */
import { Timeline } from '../../../core';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, mixLab, overscan, quoteCard, textSwap, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { cast } from '../cast';
import { badge, bakeRect, camAt, clamp01, cord, cordAt, glowDot, label, lerp, pulse, seg, slip, sm, tone, twos, type CamKey } from '../sets/common';
import { plate, wellBase, wellLive, tilePt } from '../sets/wellAndPlate';
import { bellSwing, houseBell, lanternDoor, latchPt, letter } from '../sets/heldLetter';
import { ledger, ribbon, scroll, type RibbonFrame } from '../sets/walRibbon';
import { scissors } from '../sets/ch06-s01-lanternRoom';

const ID = 'ch06-s04';
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });
const DOOR = { x: 420, y: 520, s: 1.5 };
const LATCH = latchPt(DOOR);
const BELL = { x: 650, y: 300, s: 1.8 };
const RIB = { x: 580, y: 548, s: 0.95 };
const RIB_FRAMES: RibbonFrame[] = [{ kind: 'frame' }, { kind: 'frame', stamp: 7 }];
const PULLEY_A = { x: 790, y: 560 };
const WELLP = { x: 840, y: 1250, s: 1.4 };
const WELL_PULLEY = { x: WELLP.x, y: WELLP.y - 146 * WELLP.s };
const KEEPER = { x: 640, y: 1250, scale: 1.0 };
const SENDER_WIN = { x: 1240, y: 900 };
const LEDGER = { x: 236, y: 548, s: 1.2 };

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      workerd: T.word('L0614', 'workerd'),
      message: T.word('L0614', 'Message'),
      written: T.beat('written'),
      reply: T.word('L0614', 'reply'),
      down: T.beat('down'),
      scroll: T.word('L0615', 'scroll'),
      well: T.wordEnd('L0615', 'Well'),
      look: T.beat('look'),
      plateW: T.word('L0616', 'Plate'),
      still: T.beat('still'),
      A: T.word('L0616', 'A'),
      seven: T.word('L0616', 'seven'),
      bell: T.beat('bell'),
      latch: T.beat('latch'),
      tick: T.beat('tick'),
      local: T.beat('local'),
      celld: T.beat('celld'),
      celldW: T.word('L0619', "celld's"),
      errors: T.word('L0619', 'errors'),
      chunk: T.word('L0619', 'chunk'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: C(520, 410, 150) },
      { t: b.written + 0.4, cam: C(540, 420, 170) },
      { t: b.down - 0.3, cam: C(600, 440, 150) },
      { t: b.down + 3.9, cam: C(790, 1030, 160) },
      { t: b.look + 0.4, cam: C(800, 1000, 230) },
      { t: b.seven + 0.25, cam: C(805, 995, 240) },
      { t: b.bell - 0.1, cam: C(700, 740, -640) },
      { t: b.tick + 0.6, cam: C(690, 730, -630) },
      { t: b.local + 1.4, cam: C(250, 500, -120) },
      { t: b.D, cam: C(262, 500, -90) },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const all = cams.map((k) => k.cam);
    f.camera(cam);
    f.backlight({ sunX: 900, sunY: 250, intensity: 0.75 });
    // ---------------------------------------------------------------- far planes
    f.layer('L1', (c, env) => {
      const r = overscan(LAYERS.L1, all, 60);
      bakeRect(f, c, env, `ch06s04/L1/${Math.round(r.x)}`, r, (cc) => {
        // the low far shore with a few lamps (other people's machines)
        cc.fillStyle = env.fill('set');
        cc.beginPath();
        cc.moveTo(r.x, r.y + r.h);
        for (let x = r.x; x <= r.x + r.w; x += 10) cc.lineTo(x, 470 - 10 * Math.sin(x * 0.007) - 6 * Math.sin(x * 0.02));
        cc.lineTo(r.x + r.w, r.y + r.h);
        cc.closePath();
        cc.fill();
        for (let i = 0; i < 9; i++) {
          const x = r.x + ((i * 173) % Math.max(1, r.w));
          cc.fillStyle = withAlpha(tone(env, '#f6c27a', 0.2), 0.5);
          cc.fillRect(x, 468 - 8 * Math.sin(x * 0.007), 3, 3);
        }
      });
    });
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, all, 60);
      bakeRect(f, c, env, `ch06s04/L2/${Math.round(r.x)}`, r, (cc) => {
        cc.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.3);
        cc.beginPath();
        cc.moveTo(r.x, r.y + r.h);
        for (let x = r.x; x <= r.x + r.w; x += 8) cc.lineTo(x, 330 - 120 * clamp01((x - 300) / 1400) - 12 * Math.sin(x * 0.01));
        cc.lineTo(r.x + r.w, r.y + r.h);
        cc.closePath();
        cc.fill();
        // dim roofs on the ridge
        for (let x = 700; x < r.x + r.w; x += 70) {
          const top = 330 - 120 * clamp01((x - 300) / 1400) + 20;
          cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.25);
          cc.beginPath();
          cc.moveTo(x - 18, top + 30);
          cc.lineTo(x - 18, top + 12);
          cc.lineTo(x, top);
          cc.lineTo(x + 18, top + 12);
          cc.lineTo(x + 18, top + 30);
          cc.closePath();
          cc.fill();
        }
      });
    });
    f.fog('A');
    f.layer('L3', (c, env) => {
      const r = overscan(LAYERS.L3, all, 60);
      bakeRect(f, c, env, `ch06s04/L3/${Math.round(r.x)},${Math.round(r.y)}`, r, (cc) => {
        const set = mixLab(env.fill('set'), env.fill('ink'), 0.6);
        // House A's wall, its steep gable above the window
        cc.fillStyle = set;
        cc.beginPath();
        cc.moveTo(r.x, 900);
        cc.lineTo(r.x, 120);
        cc.lineTo(160, 120);
        cc.lineTo(400, -260);
        cc.lineTo(700, 120);
        cc.lineTo(720, 120);
        cc.lineTo(720, 900);
        cc.closePath();
        cc.fill();
        cc.strokeStyle = withAlpha(env.fill('rim'), 0.35);
        cc.lineWidth = 1.4;
        cc.beginPath();
        cc.moveTo(140, 128);
        cc.lineTo(400, -260);
        cc.stroke();
        // the window's warm interior behind the lantern
        const g = cc.createRadialGradient(420, 400, 10, 420, 400, 260);
        g.addColorStop(0, mixLab(tone(env, '#f2b45e', 0.1), '#fff2d6', 0.2));
        g.addColorStop(1, mixLab(tone(env, '#f2b45e', 0.1), env.mood.fg, 0.55));
        cc.fillStyle = g;
        cc.fillRect(230, 200, 380, 350);
        // the terrace and its retaining wall down to the square
        cc.fillStyle = mixLab(set, env.mood.fg, 0.2);
        cc.fillRect(r.x, 760, r.w, r.y + r.h - 760);
        cc.strokeStyle = withAlpha(env.fill('rim'), 0.12);
        cc.lineWidth = 1;
        for (let y = 800; y < r.y + r.h; y += 46) {
          cc.beginPath();
          cc.moveTo(r.x, y);
          cc.lineTo(r.x + r.w, y);
          cc.stroke();
        }
        cc.strokeStyle = withAlpha(env.fill('rim'), 0.3);
        cc.beginPath();
        cc.moveTo(r.x, 760);
        cc.lineTo(r.x + r.w, 760);
        cc.stroke();
      });
    });
    f.fog('B');
    // ---------------------------------------------------------------- the action plane
    const slipIn = seg(t, b.message - 0.2, b.written - 0.05);
    const inked = seg(t, b.written, b.written + 0.6);
    const stampU = seg(t, b.written + 0.9, b.written + 1.3);
    const replyA = seg(t, b.reply - 0.2, b.reply + 0.4);
    const snip = pulse(t, b.down - 0.05, 0.1, 0.15, 0.4);
    const ride = seg(t, b.down + 0.2, b.down + 3.7);
    const lower = seg(t, b.well, b.look - 0.3);
    const raise = seg(t, b.look - 0.2, b.look + 1.0) * (1 - seg(t, b.bell - 1.0, b.bell - 0.2) * 0.6);
    const ring = pulse(t, b.bell, 0.1, 0.5, 1.2);
    const latchU = seg(t, b.latch - 0.1, b.latch + 0.35) * (1 - seg(t, b.local - 1.0, b.local - 0.4));
    const fly = clamp01((t - (b.latch + 0.2)) / 1.4);
    const second = seg(t, b.local - 0.9, b.local - 0.3); // the next message's letter at the latch (coda)
    const pageDone = seg(t, b.local - 0.2, b.local + 0.5);
    let lampPos = { x: 0, y: 0 };
    f.layer('L4', (c, env) => {
      const ink = env.fill('ink');
      // the room's ledger on the sill (left of the door)
      ledger(c, env, { x: LEDGER.x, y: LEDGER.y, s: LEDGER.s, pages: 7, adding: pageDone });
      if (pageDone > 0.01) glowDot(c, LEDGER.x, LEDGER.y - 40, 44, tone(env, '#ffd890', 0.1), 0.45 * pulse(t, b.local + 0.1, 0.2, 0.5, 1.2));
      // the lantern's door, the latch and the held letters
      lanternDoor(c, env, { x: DOOR.x, y: DOOR.y, s: DOOR.s, latch: latchU, glow: 0.85 });
      if (replyA > 0.01 && fly < 1) {
        const u = sm(fly);
        letter(c, env, { x: lerp(LATCH.x + 6, SENDER_WIN.x, u), y: lerp(LATCH.y + 4, SENDER_WIN.y, u) - Math.sin(Math.PI * u) * 160, s: 1.25 * lerp(1, 0.6, u), rot: -0.12 + u * 0.4, alpha: replyA * (1 - seg(fly, 0.85, 1)) });
      }
      if (second > 0.01) letter(c, env, { x: LATCH.x + 6, y: LATCH.y + 4, s: 1.25, rot: -0.12, alpha: second });
      // the bell on its bracket
      houseBell(c, env, { x: BELL.x, y: BELL.y, s: BELL.s, swing: bellSwing(t, b.bell, 0.55), ring });
      // the badge by the door
      badge(c, env, { x: 196, y: 300, text: 'workerd · 28 Oct', s: 1.1, legible: true, glint: pulse(t, b.workerd, 0.25, 0.3, 0.8), swing: 0.03 * Math.sin(tq * 1.2), alpha: 1 - seg(t, b.local - 0.9, b.local - 0.3), id: `${ID}-badge` });
      // the sill's ribbon: a page inks on 'written', its stamp follows; the scissors snip after the stamp
      const frames: RibbonFrame[] = RIB_FRAMES.map((fr, i) => (i === 1 ? { ...fr, dim: 0 } : fr));
      if (ride <= 0.05) {
        ribbon(c, env, { x: RIB.x, y: RIB.y, s: RIB.s, frames, shown: 1 + inked, stampU: () => stampU, glow: 0.4 * pulse(t, b.written + 1.1, 0.2, 0.3, 0.8) });
      }
      scissors(c, env, { x: RIB.x + 118 * RIB.s, y: RIB.y - 4, s: 1.3, rot: Math.PI / 2 + 0.2, open: 0.9 * (1 - snip) * (1 - seg(t, b.down + 0.1, b.down + 0.5)) + 0.1, glint: snip });
      // the pulley line from the sill to the wellhead, the scroll riding it
      cord(c, PULLEY_A.x, PULLEY_A.y, WELL_PULLEY.x, WELL_PULLEY.y, 40, withAlpha(ink, 0.9), 1.6);
      c.fillStyle = ink;
      c.beginPath();
      c.arc(PULLEY_A.x, PULLEY_A.y, 6, 0, Math.PI * 2);
      c.fill();
      if (ride > 0.001 && lower < 1) {
        const p = lower > 0 ? { x: WELL_PULLEY.x, y: lerp(WELL_PULLEY.y + 18, WELLP.y - 50 * WELLP.s, sm(lower)) } : cordAt(PULLEY_A.x, PULLEY_A.y, WELL_PULLEY.x, WELL_PULLEY.y, 40, sm(ride));
        c.save();
        c.beginPath();
        c.rect(-2000, -2000, 5000, WELLP.y - 50 * WELLP.s + 2000);
        c.clip();
        scroll(c, env, { x: p.x + 6, y: p.y + 10, s: 1.6, rot: lower > 0 ? Math.PI / 2 : 1.2, tag: 1 });
        c.restore();
      }
      // the Well and the Plate
      wellBase(c, env, WELLP);
      wellLive(c, env, { ...WELLP, bucket: 0.3 + 0.6 * lower, glint: 0.4 });
      const lit = raise;
      plate(c, env, {
        ...WELLP,
        plate: { house: 'A', epoch: 7, from: 7, crown: 1, glint: [Math.max(0.35 * lit, pulse(t, b.A - 0.1, 0.15, 0.5, 1.0)), Math.max(0.35 * lit, pulse(t, b.seven - 0.1, 0.15, 0.5, 1.0)), 0.3 * lit], dim: 0.35 * (1 - lit) },
        legible: true,
        id: `${ID}-plate`,
      });
      // the keeper of House A with the lamp on its pole
      const kp = blendPose(POSES.stand, POSES.point, Math.floor(raise * 6) / 6);
      const ko = { x: KEEPER.x, y: KEEPER.y, facing: 'right' as const, pose: kp, scale: KEEPER.scale, ink: '#0b0d0b', light: { x: 0.6, y: -0.8, floor: 0.2 }, edgeRim: { x: 0.6, y: -0.8, px: 2.5, alpha: 0.85, warm: 0.7 } };
      cast['keeper-a'].draw(c, ko, env);
      const hand = cast['keeper-a'].anchor(ko, 'handF');
      const lamp = { x: lerp(hand.x - 40, tilePt(WELLP, 0).x - 50, sm(raise)), y: lerp(hand.y - 150, tilePt(WELLP, 0).y - 70, sm(raise)) };
      c.strokeStyle = ink;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(hand.x, hand.y);
      c.lineTo(lamp.x, lamp.y + 14);
      c.stroke();
      c.fillStyle = ink;
      c.fillRect(lamp.x - 9, lamp.y - 14, 18, 26);
      c.fillStyle = tone(env, '#ffd27a', 0.05);
      c.fillRect(lamp.x - 5, lamp.y - 9, 10, 15);
      lampPos = lamp;
      // the lamp's light falling across the tiles
      if (raise > 0.01) {
        const pc = tilePt(WELLP, 1);
        glowDot(c, pc.x, pc.y, 170, tone(env, '#ffcf7a', 0.05), 0.35 * raise);
      }
      // the sender's slip flying in through the door (from the harbour side)
      if (slipIn > 0.001 && slipIn < 1) {
        const u = sm(slipIn);
        slip(c, env, { x: lerp(1180, DOOR.x + 20, u), y: lerp(240, LATCH.y - 30, u) - Math.sin(Math.PI * u) * 60, w: 60 * lerp(1, 0.6, u), rot: -0.2 + u * 0.3, alpha: 1 - seg(slipIn, 0.85, 1) });
      }
    });
    f.rim({ x: 0, y: -1 });
    // the warm practical: the keeper's lamp
    f.practical({ x: lampPos.x, y: lampPos.y - 2, kind: 'lamp', seed: 91, intensity: 0.45 + 0.35 * raise, radius: 90, layer: 'L4' });
    f.layer('L5', (c, env) => {
      c.fillStyle = env.fill('fg');
      // a hinged shutter beside the window (top) and the railing along the square (bottom)
      c.fillRect(860, -500, 150, 980);
      c.fillRect(-600, 1700, 2600, 400);
      for (let x = -600; x < 2000; x += 46) c.fillRect(x, 1640, 14, 70);
      c.fillRect(-600, 1620, 2600, 24);
    });
    // ---------------------------------------------------------------- screen-locked: insets and type
    const ctx = f.c;
    // the tick inset (upper right): the sender's slip takes its tick
    const ti = seg(t, b.tick - 0.6, b.tick - 0.2) * (1 - seg(t, b.local - 0.8, b.local - 0.3));
    if (ti > 0.01) {
      const cx = 1060, cy = 150;
      ctx.save();
      ctx.globalAlpha = ti;
      ctx.fillStyle = withAlpha(f.mood.fg, 0.82);
      ctx.beginPath();
      ctx.roundRect(cx - 150, cy - 80, 300, 160, 14);
      ctx.fill();
      ctx.strokeStyle = withAlpha(tone({ mood: f.mood, layer: LAYERS.L4 } as never, '#b8934a', 0.2), 0.8);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = ti;
      const env = { mood: f.mood, fill: (r: string) => (r === 'ink' ? f.mood.ink : r === 'fg' ? f.mood.fg : f.mood.core), layer: LAYERS.L4 } as never;
      slip(ctx, env, { x: cx, y: cy, w: 210, tick: clamp01((t - b.tick) / 0.5), rot: -0.04 });
      ctx.restore();
    }
    // celld's inset (lower left): reply, error and stream chunks, all held behind its latch
    const ci = seg(t, b.celldW - 0.2, b.celldW + 0.4);
    if (ci > 0.01) {
      const x0 = 70, y0 = 370, w = 420, h = 240;
      ctx.save();
      ctx.globalAlpha = ci;
      ctx.fillStyle = withAlpha('#1c2a1e', 0.9);
      ctx.beginPath();
      ctx.roundRect(x0, y0, w, h, 14);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x0, y0, w, h, 14);
      ctx.clip();
      const gg = ctx.createRadialGradient(x0 + w * 0.4, y0 + h * 0.5, 10, x0 + w * 0.4, y0 + h * 0.5, w * 0.7);
      gg.addColorStop(0, withAlpha('#b8d890', 0.35));
      gg.addColorStop(1, withAlpha('#b8d890', 0));
      ctx.fillStyle = gg;
      ctx.fillRect(x0, y0, w, h);
      ctx.restore();
      ctx.strokeStyle = withAlpha('#a9b88a', 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x0, y0, w, h, 14);
      ctx.stroke();
      const env = { mood: { ...f.mood, fg: '#0c140e', core: '#dee0a5', ink: '#0e1210' }, fill: (r: string) => (r === 'ink' ? '#0e1210' : r === 'fg' ? '#0c140e' : '#2d372f'), layer: LAYERS.L4 } as never;
      // the latch bar across the front: everything waits behind it
      const items = seg(t, b.celldW, b.chunk + 0.4);
      letter(ctx, env, { x: x0 + 90, y: y0 + 120, s: 1.5, alpha: seg(items, 0, 0.25) });
      letter(ctx, env, { x: x0 + 200, y: y0 + 124, s: 1.5, error: 1, rot: 0.06, alpha: seg(t, b.errors - 0.2, b.errors + 0.3) });
      for (let k = 0; k < 5; k++) {
        const a = seg(t, b.chunk - 0.4 + k * 0.18, b.chunk - 0.1 + k * 0.18);
        ctx.save();
        ctx.globalAlpha = ci * a;
        ctx.fillStyle = '#e4dcc0';
        ctx.fillRect(x0 + 268 + k * 26, y0 + 104 + (k % 2) * 6, 20, 30);
        ctx.restore();
      }
      ctx.fillStyle = '#b8934a';
      ctx.fillRect(x0 + 30, y0 + 160, w - 60, 9);
      ctx.beginPath();
      ctx.arc(x0 + 30, y0 + 164, 9, 0, Math.PI * 2);
      ctx.fill();
      badge(ctx, env, { x: x0 + w / 2, y: y0 + 176, text: 'celld 0.6.3', s: 1.0, legible: true, alpha: 1, glint: 0.3, id: `${ID}-celld` });
      ctx.restore();
    }
    const sw = textSwap(t, b.local, 0.5);
    const la = seg(t, b.look - 0.1, b.look + 0.4) * sw.out * (1 - seg(t, b.tick - 0.4, b.tick + 0.2));
    label(ctx, f.mood, { id: `${ID}-look`, text: 'upload → look again → bell', x: 64, y: 92, alpha: la, italic: true });
    if (t > b.local - 0.05)
      quoteCard(ctx, { quote: '…cannot act on a value that a crash can still lose.', speaker: 'celld guarantees, v0.6.3', x: 300, y: 170, width: 440, size: 26, at: b.local, align: 'center', maxChars: 30 }, { t, mood: f.mood });
  },
});
