/**
 * ch02-s03 — the output gate, 3 August 2021 (duskRose, inkBleed in): the Held Letter introduced.
 *
 * Same study (sets/ch02-s01-study.ts), a year on. The Room Lantern stands on the desk; the camera pushes from the
 * desk to the lantern until it fills the right two-thirds: its paper half cut away (inside, a member writes a line
 * into an open ledger with a quill: the storage write), and on its front the paper DOOR with the brass LATCH
 * (sets/heldLetter.ts lanternDoor / letter / latchPt).
 *
 *   date      '3 August 2021' top-right
 *   gate      quote card Q03 upper-left (cleared before the term tag paints there)
 *   held      the reply letter slides to the door and rests against the latch (the term tag paints top-left)
 *   done      the ledger ink dries (the wet sheen goes matte)
 *   lift      the latch swings up, the letter flies out of frame right
 *   fails     lampChange flicker to emberRed: the quill snaps, the new line smears
 *   errors    the two waiting letters turn to torn, red-edged error slips and fall away
 *   restart   the lantern's flame gutters and relights; the grade returns to duskRose
 *   tick      an inset of chapter 1's slip '#42 · the ferry is late' slides in beside the door, its tick struck,
 *             as the latch lifts behind it for the next good write
 * No implementation badge (the 2021 post's description). Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, defineShot, mixLab, quoteCard, toScreen, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { camAt, clamp01, lerp, paper, seg, slip, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { roomLantern, lanternPt } from '../sets/roomLantern';
import { lanternDoor, latchPt, letter } from '../sets/heldLetter';
import { paintStudy } from '../sets/ch02-s01-study';
import { dateStamp } from '../sets/ch02-s01-kit';

const ID = 'ch02-s03';
const L = { x: 492, y: 459, s: 2.0 };
/** the door on the lantern's lower right front (world) */
const DOOR = { x: 520, y: 439, s: 0.34 };
const LATCH = latchPt(DOOR);
/** the open ledger on the lantern's floor, lower left inside (world) */
const LEDGER = { x: 460, y: 436, w: 50, h: 19 };
const PEN = { x: 474, y: 426 };

const WIDE: Camera3 = { x: 600, y: 380, z: 110, lens: 1 };
const MID: Camera3 = { x: 560, y: 384, z: 240, lens: 1 };
const CLOSE: Camera3 = { x: 456, y: 384, z: 690, lens: 1 };
const TICK: Camera3 = { x: 466, y: 386, z: 720, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      date: T.beat('date'),
      gate: T.beat('gate'),
      held: T.beat('held'),
      done: T.beat('done'),
      lift: T.beat('lift'),
      errors: T.beat('errors'),
      restart: T.beat('restart'),
      tick: T.beat('tick'),
      fails: T.word('L0213', 'fails'),
      write: T.word('L0211', 'write'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: WIDE },
      { t: 3.4, cam: MID },
      { t: b.gate + 1.6, cam: CLOSE },
      { t: b.tick - 0.6, cam: { ...CLOSE, x: CLOSE.x + 4 } },
      { t: b.D, cam: TICK },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // the failure: flicker into emberRed on 'fails', back after the restart
    const flick = t > b.fails - 0.2 && t < b.fails + 0.5 ? (Math.sin(tq * 47) > 0 ? 1 : 0.4) : 1;
    const ember = seg(t, b.fails - 0.15, b.fails + 0.45) * flick * (1 - seg(t, b.restart + 0.5, b.restart + 1.6));
    const cut = seg(t, 6.5, 10.5);
    // the lantern's flame gutters on 'restarts' and relights
    const gut = t > b.restart - 0.1 && t < b.restart + 1.1 ? 0.15 + 0.85 * Math.abs(Math.sin((t - b.restart) * 3.2)) * (Math.sin(tq * 31) > 0 ? 1 : 0.6) : 1;
    paintStudy(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        era: 2021,
        lamp: 0.8 - 0.35 * seg(t, 4, 10),
        screen: 0.35,
        think: 0.1,
        beforeLight: () => {
          if (ember > 0.001) f.setMood('emberRed', { from: 'duskRose', u: Math.round(ember * 12) / 12 }); // quantised: each grade step bakes once
        },
      },
      {
        L4: (c, env) => {
          roomLantern(c, env, { ...L, lit: gut, members: 3, tq, cutaway: cut * 0.62, door: 0 });
          gate(c, env, t, tq, b, cut);
        },
      },
    );
    const fl = lanternPt(L, 'flame');
    f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 19, intensity: 0.42 * gut, radius: 44, layer: 'L4' });
    // ---------------------------------------------------------------- type
    const c = f.c;
    dateStamp(c, f.mood, { id: `${ID}-date`, text: '3 August 2021', x: 1222, y: 66, alpha: seg(t, b.date, b.date + 0.5) * (1 - seg(t, b.gate - 0.8, b.gate - 0.1)) });
    quoteCard(c, { quote: 'When a storage write operation is in progress, any new outgoing network messages will be held back', speaker: 'Kenton Varda, 2021', x: 70, y: 168, width: 470, align: 'left', at: b.gate - 0.1, dur: b.held - 0.45 - b.gate, fade: 0.4 }, { t, mood: f.mood });
    // the inset slip's text is drawn in world (it rides beside the door); nothing else here
    void toScreen;
    void LAYERS;
  },
});

interface B {
  held: number;
  done: number;
  lift: number;
  errors: number;
  restart: number;
  tick: number;
  fails: number;
  write: number;
  gate: number;
}
/** the storage write, the door, the held letter, the errors and the released tick (world, L4) */
function gate(c: C2, env: PaintEnv, t: number, tq: number, b: B, cut: number): void {
  const ink = env.fill('ink');
  // ---- the ledger (open) and the quill
  if (cut > 0.02) {
    c.save();
    c.globalAlpha = cut;
    const pap = mixLab(paper(env, 0.1), '#f6e6c4', 0.2);
    // two open pages on a dark board
    c.fillStyle = ink;
    c.fillRect(LEDGER.x - LEDGER.w / 2 - 2, LEDGER.y, LEDGER.w + 4, 3);
    c.fillStyle = pap;
    c.beginPath();
    c.moveTo(LEDGER.x - LEDGER.w / 2, LEDGER.y);
    c.quadraticCurveTo(LEDGER.x - LEDGER.w / 4, LEDGER.y - LEDGER.h - 2, LEDGER.x, LEDGER.y - LEDGER.h + 2);
    c.quadraticCurveTo(LEDGER.x + LEDGER.w / 4, LEDGER.y - LEDGER.h - 2, LEDGER.x + LEDGER.w / 2, LEDGER.y);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha('#2a1d12', 0.5);
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(LEDGER.x, LEDGER.y);
    c.lineTo(LEDGER.x, LEDGER.y - LEDGER.h + 2);
    c.stroke();
    // earlier lines (dry)
    c.strokeStyle = withAlpha('#2a1d12', 0.55);
    c.lineWidth = 0.7;
    for (let r = 0; r < 3; r++) {
      const y = LEDGER.y - LEDGER.h + 6 + r * 3;
      c.beginPath();
      c.moveTo(LEDGER.x - LEDGER.w / 2 + 3, y + 1);
      c.lineTo(LEDGER.x - 3, y);
      c.stroke();
    }
    // the line being written: write 1 (the reply's write) then write 2 (fails, smears), then write 3 (after the restart)
    const ly = (r: number) => LEDGER.y - LEDGER.h + 6 + r * 3;
    const w1 = clamp01((tq - (b.write - 0.4)) / (b.done - 0.4 - (b.write - 0.4)));
    const dry1 = seg(t, b.done - 0.1, b.done + 0.6);
    inkLine(c, LEDGER.x + 3, ly(0), LEDGER.x + LEDGER.w / 2 - 3, w1, dry1, 0);
    const w2s = b.lift + 1.4;
    const w2 = clamp01((tq - w2s) / Math.max(0.5, b.fails - w2s)) * 0.7;
    const smear = seg(t, b.fails, b.fails + 0.5) * (1 - seg(t, b.restart + 0.2, b.restart + 0.8));
    if (t < b.restart + 0.8) inkLine(c, LEDGER.x + 3, ly(1), LEDGER.x + LEDGER.w / 2 - 3, w2, 0, smear);
    const w3 = clamp01((tq - (b.restart + 0.9)) / 0.6);
    const dry3 = seg(t, b.restart + 1.5, b.restart + 1.8);
    inkLine(c, LEDGER.x + 3, ly(1), LEDGER.x + LEDGER.w / 2 - 3, w3, dry3, 0);
    // the quill rides the line's nib (snaps on 'fails': two pieces fall)
    const snapped = t >= b.fails && t < b.restart + 0.8;
    const writing = t < b.done ? w1 : t < b.fails ? w2 : w3;
    const row = t < b.lift + 1.3 ? 0 : 1;
    const nib = { x: lerp(LEDGER.x + 3, LEDGER.x + LEDGER.w / 2 - 3, writing), y: ly(row) - 0.5 + Math.sin(tq * 14) * 0.35 * (writing > 0 && writing < 1 ? 1 : 0) };
    if (!snapped) quill(c, env, nib.x, nib.y, 0, 1);
    else {
      const fall = clamp01((t - b.fails) / 0.8);
      quill(c, env, nib.x + fall * 3, nib.y + fall * 12, 0.6 * fall, 1 - seg(t, b.restart, b.restart + 0.5), 'top');
      quill(c, env, nib.x - 1, nib.y + fall * 4, -0.3 * fall, 1 - seg(t, b.restart, b.restart + 0.5), 'nib');
    }
    // the member's arm reaching to the quill (from the left member)
    c.strokeStyle = mixLab(ink, '#3b2a1c', 0.2);
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(PEN.x - 22, PEN.y - 22);
    c.quadraticCurveTo(PEN.x - 14, PEN.y - 6, snapped ? PEN.x - 6 : nib.x - 4, snapped ? PEN.y + 2 : nib.y - 8);
    c.stroke();
    c.restore();
  }
  // ---- the door with its latch
  const lift1 = seg(t, b.lift - 0.15, b.lift + 0.35) * (1 - seg(t, b.lift + 1.1, b.lift + 1.6));
  const lift2 = seg(t, b.tick + 0.35, b.tick + 0.85);
  lanternDoor(c, env, { ...DOOR, latch: Math.max(lift1, lift2), glow: 0.7 * (t > b.restart - 0.1 && t < b.restart + 1.1 ? 0.4 : 1) });
  // ---- letters
  // 1: the reply to our sender: arrives at the latch on 'latch' (held), released on 'lifts'
  const arrive1 = sm(clamp01((tq - (b.held - 1.0)) / 0.95));
  const fly1 = clamp01((tq - (b.lift + 0.2)) / 1.1);
  if (arrive1 > 0 && fly1 < 1) {
    const from = { x: L.x + 6, y: L.y - 70 };
    const rest = { x: LATCH.x + 2, y: LATCH.y - 7 };
    const e = sm(fly1);
    const x = lerp(lerp(from.x, rest.x, arrive1), rest.x + 220, e);
    const y = lerp(from.y, rest.y, arrive1) - Math.sin(Math.PI * e) * 30;
    letter(c, env, { x, y, s: 0.42, rot: lerp(-0.4 * (1 - arrive1) - 0.12, 0.2, e), alpha: seg(t, b.held - 1.0, b.held - 0.7) });
  }
  // 2 and 3: two more replies wait behind the latch for the second write; they turn to errors and fall
  for (let i = 0; i < 2; i++) {
    const at = b.lift + 1.5 + i * 0.55;
    const arr = sm(clamp01((tq - at) / 0.8));
    if (arr <= 0) continue;
    const er = seg(t, b.errors - 0.1 + i * 0.18, b.errors + 0.3 + i * 0.18);
    const fall = clamp01((tq - (b.errors + 0.75 + i * 0.25)) / 1.0);
    if (fall >= 1) continue;
    const rest = { x: LATCH.x + 2 + i * 5, y: LATCH.y - 7 - i * 9 };
    const from = { x: L.x + 6, y: L.y - 72 };
    letter(c, env, {
      x: lerp(from.x, rest.x, arr) + fall * 10,
      y: lerp(from.y, rest.y, arr) + fall * fall * 70,
      s: 0.42,
      rot: -0.12 - i * 0.08 + fall * (1.4 + i),
      error: er,
      alpha: seg(t, at, at + 0.3) * (1 - sm(fall * 1.2)),
    });
  }
  // 4: after the restart a good write; its letter released as the tick strikes
  const arr4 = sm(clamp01((tq - (b.restart + 1.0)) / 0.8));
  const fly4 = clamp01((tq - (b.tick + 0.5)) / 1.1);
  if (arr4 > 0 && fly4 < 1) {
    const rest = { x: LATCH.x + 2, y: LATCH.y - 7 };
    const from = { x: L.x + 6, y: L.y - 72 };
    const e = sm(fly4);
    letter(c, env, { x: lerp(lerp(from.x, rest.x, arr4), rest.x + 220, e), y: lerp(from.y, rest.y, arr4) - Math.sin(Math.PI * e) * 30, s: 0.42, rot: lerp(-0.12, 0.2, e), alpha: seg(t, b.restart + 1.0, b.restart + 1.3) });
  }
  // ---- the inset: chapter 1's slip, its tick, beside the door
  const ins = sm(clamp01((tq - (b.tick - 0.3)) / 0.8));
  if (ins > 0) {
    const x = lerp(L.x + 150, L.x + 80, ins), y = L.y - 134;
    // a small dark mount behind it (an inset frame), then the slip with its text
    c.save();
    c.globalAlpha = ins;
    c.fillStyle = withAlpha(mixLab(ink, env.mood.fg, 0.4), 0.85);
    c.fillRect(x - 40, y - 18, 80, 36);
    c.strokeStyle = withAlpha(tone(env, '#e9cf8a', 0.2), 0.55);
    c.lineWidth = 0.6;
    c.strokeRect(x - 40, y - 18, 80, 36);
    c.restore();
    slip(c, env, { x, y, w: 72, text: true, tick: clamp01((tq - (b.tick + 0.25)) / 0.45), alpha: ins, id: `${ID}-slip` });
  }
}
/** an ink line written left → right to u; dry 0 = wet (dark with a sheen), 1 = matte; smear 0..1 */
function inkLine(c: C2, x0: number, y: number, x1: number, u: number, dry: number, smear: number): void {
  if (u <= 0.001) return;
  const x = lerp(x0, x1, u);
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = mixLab('#120a05', '#3a2a1c', dry);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x0, y);
  for (let k = 1; k <= 10; k++) {
    const xx = lerp(x0, x, k / 10);
    c.lineTo(xx, y + Math.sin(xx * 1.7) * 0.35);
  }
  c.stroke();
  if (dry < 0.98) {
    // the wet sheen
    c.strokeStyle = withAlpha('#fff4d8', 0.55 * (1 - dry));
    c.lineWidth = 0.3;
    c.beginPath();
    c.moveTo(x0, y - 0.35);
    c.lineTo(x, y - 0.35);
    c.stroke();
  }
  if (smear > 0.01) {
    c.fillStyle = withAlpha('#1c120a', 0.55 * smear);
    c.beginPath();
    c.ellipse((x0 + x) / 2 + 2 * smear, y + 1.5 * smear, (x - x0) / 2 + 3 * smear, 1 + 2.4 * smear, 0.08, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
/** a quill (nib at x, y), optionally only its top or nib piece (snapped) */
function quill(c: C2, env: PaintEnv, x: number, y: number, rot: number, a: number, piece: 'all' | 'top' | 'nib' = 'all'): void {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.rotate(-0.95 + rot);
  c.fillStyle = mixLab(paper(env, 0.2), '#d8c8a8', 0.3);
  if (piece !== 'nib') {
    c.beginPath();
    c.moveTo(piece === 'top' ? 8 : 2, 0);
    c.quadraticCurveTo(14, -3.2, 24, -1.2);
    c.quadraticCurveTo(15, 1.6, piece === 'top' ? 8 : 2, 0.5);
    c.closePath();
    c.fill();
  }
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(piece === 'nib' ? 7 : piece === 'top' ? 8 : 22, piece === 'nib' ? 0 : -0.5);
  if (piece === 'top') c.moveTo(8, 0);
  c.stroke();
  c.restore();
}
