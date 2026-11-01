/**
 * ch08-s02 — the dated small print, staged as objects in the canonical town (winterBlue, cut in).
 *
 * A slow truck left → right across the square and terrace (≤ 5 % width/s), the Well and Plate kept in frame.
 *   date        date stamp 'As of · 31 October 2026' upper left
 *   d28         the wellhead badge reads 'workerd · 28 Oct'; a small brass 'experimental' pennant stands on the Plate's
 *               frame; the alarm-bell bracket on the frame is EMPTY
 *   d31         the badge turns over to 'workerd · 31 Oct' and a small alarm bell is hung on the bracket
 *   tests       a clipboard of ink test sheets (no legible code) with a reading glass, on a post by the Well
 *   notrun      the switch beside it stays OFF, untouched; label 'Tests read, not run'
 *   once        the new bell rings once while a faint ghost of the same ring repeats beside it (firings seen, not one effect)
 *   supervisor  for one beat the terrace re-lamps labGreen, badge 'celld 0.6.3': a lamplighter waits beside B's fenced,
 *               dark house, then relights it
 *   lifecycle   a groundskeeper's rake comes along the square, stops at the roped-off records round the wellhead and
 *               goes round them
 *   sandbox     back to winterBlue: House A's door ringed by only a dotted outline of a fence (a wall to add from
 *               outside); label 'Not a sandbox on its own'
 * Labels upper right, one at a time; nothing below y 634.
 */
import { Timeline } from '../../../core';
import { POSES, PUPPET_NEAR_BLACK, defineShot, placeStamp, textSwap, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { cast } from '../cast';
import { TOWN, paintTown } from '../sets/harbourTown';
import { badge as drawBadge, brass, camAt, clamp01, glowDot, label, lerp, paper, pulse, seg, tone, twos, type C2, type CamKey } from '../sets/common';
import { WELL } from '../sets/wellAndPlate';
import { bellSwing, houseBell } from '../sets/heldLetter';

const ID = 'ch08-s02';
const W = { x: TOWN.well.x, y: TOWN.well.y };
const BRACKET = { x: W.x + WELL.hookR.x + 8, y: W.y + WELL.hookR.y - 4 };
const POST = { x: W.x + 132, y: W.y };

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      date: T.beat('date'),
      d28: T.beat('d28'),
      d31: T.beat('d31'),
      tests: T.beat('tests'),
      notrun: T.beat('notrun'),
      once: T.beat('once'),
      supervisor: T.beat('supervisor'),
      lifecycle: T.beat('lifecycle'),
      sandbox: T.beat('sandbox'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: { x: 470, y: 404, z: 220, lens: 1 } },
      { t: b.notrun + 1.0, cam: { x: 520, y: 404, z: 230, lens: 1 } },
      { t: b.supervisor - 0.2, cam: { x: 640, y: 396, z: 140, lens: 1 } },
      { t: b.sandbox - 1.6, cam: { x: 660, y: 396, z: 130, lens: 1 } },
      { t: b.D, cam: { x: 470, y: 400, z: 190, lens: 1 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam: Camera3 = camAt(cams, t);
    const green = seg(t, b.supervisor - 1.2, b.supervisor + 0.3) * (1 - seg(t, b.sandbox - 1.6, b.sandbox - 0.1));
    const turn = seg(t, b.d31 - 0.15, b.d31 + 0.35); // the badge turning over
    const bellIn = seg(t, b.d31 + 0.1, b.d31 + 0.7);
    const sw = bellSwing(t, b.once, 0.45);
    const ghost = bellSwing(t, b.once + 0.75, 0.3);
    const bLit = seg(t, b.supervisor + 1.0, b.supervisor + 1.4);
    const rakeU = clamp01((t - (b.lifecycle - 1.8)) / 4.2);
    const fence = seg(t, b.sandbox - 0.2, b.sandbox + 1.2);
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        mood: { from: 'winterBlue', to: 'labGreen', u: green },
        lamps: { A: 0.9, B: green > 0.5 ? bLit : 0.9, C: 0.9, Cup: 0.6 },
        lanterns: [{ house: 'C', lit: 0.9, members: 4, tq, door: 0, s: 0.55 }],
        variant: green > 0.5 ? 'celld' : 'night',
        plate: green > 0.5 ? { house: '', epoch: '', from: '', crown: 0.6, dim: 0.2 } : { house: 'C', epoch: 9, from: 9, crown: 1, dim: 0.25 },
        tooth: { shutter: 0, pin: 1, showPin: false },
        well: { bucket: 0.3, glint: 0.4 },
        badge: null,
        lampPostLit: 0.45,
      },
      {
        L3: (c, env) => {
          // the supervisor beat: a lamplighter waits by B's fenced, dark house, then relights it
          if (green > 0.02) {
            const d = TOWN.B.door;
            const lift = seg(t, b.supervisor + 0.4, b.supervisor + 1.1);
            c.save();
            c.globalAlpha = green;
            cast['keeper-c'].draw(c, { x: d.x - 40, y: TOWN.B.base, facing: 'right', pose: POSES.stand, scale: 0.3, ink: PUPPET_NEAR_BLACK, edgeRim: { x: -0.7, y: -0.7, px: 2.5, alpha: 0.85, warm: 0.6 } }, env);
            c.restore();
            c.save();
            c.globalAlpha = green;
            c.strokeStyle = env.fill('ink');
            c.lineWidth = 1.6;
            const w = TOWN.B.main;
            const tip = { x: lerp(d.x - 30, w.x - 18, lift), y: lerp(TOWN.B.base - 40, w.y + 6, lift) };
            c.beginPath();
            c.moveTo(d.x - 34, TOWN.B.base - 30);
            c.lineTo(tip.x, tip.y);
            c.stroke();
            // the fence that marks the house as fenced (a self-fenced node), low pickets
            c.strokeStyle = withAlpha(env.fill('ink'), 0.9);
            for (let x = TOWN.B.cx - 90; x <= TOWN.B.cx + 90; x += 12) {
              c.beginPath();
              c.moveTo(x, TOWN.B.base + 6);
              c.lineTo(x, TOWN.B.base - 10);
              c.stroke();
            }
            c.restore();
            glowDot(c, tip.x, tip.y, 8, tone(env, '#ffcf7a', 0.05), green * lift);
            drawBadge(c, env, { x: TOWN.B.pulley.x, y: TOWN.B.pulley.y + 4, text: 'celld 0.6.3', s: 0.55, legible: false, alpha: green });
          }
          // sandbox: House A's door ringed only by a dotted outline of a fence
          if (fence > 0.01) {
            const d = TOWN.A.door;
            c.save();
            c.globalAlpha = fence;
            c.strokeStyle = tone(env, '#e8dcc0', 0.3);
            c.lineWidth = 1.6;
            c.setLineDash([3, 5]);
            c.beginPath();
            c.moveTo(d.x - 34, TOWN.A.base + 8);
            c.lineTo(d.x - 34, d.y - d.h / 2 - 14);
            c.lineTo(d.x + 34, d.y - d.h / 2 - 14);
            c.lineTo(d.x + 34, TOWN.A.base + 8);
            c.stroke();
            c.restore();
          }
        },
        L4: (c, env) => {
          // the wellhead badge, turning over from 28 Oct to 31 Oct
          const hk = { x: W.x + WELL.hook.x + 7, y: W.y + WELL.hook.y - 2 };
          const k = Math.abs(Math.cos(Math.PI * turn));
          c.save();
          c.translate(hk.x, hk.y);
          c.scale(Math.max(0.05, k), 1);
          drawBadge(c, env, { x: 0, y: 0, text: turn < 0.5 ? 'workerd · 28 Oct' : 'workerd · 31 Oct', s: 0.85, legible: true, id: `${ID}-badge`, alpha: seg(t, b.d28 - 0.3, b.d28 + 0.3) * (1 - green) }); // never beside celld's badge
          c.restore();
          // the 'experimental' pennant on the frame's finial
          const pen = seg(t, b.d28 - 0.2, b.d28 + 0.4) * (1 - green);
          if (pen > 0.01) {
            const top = { x: W.x, y: W.y + WELL.crown.y - 30 };
            c.save();
            c.globalAlpha = pen;
            c.fillStyle = env.fill('ink');
            c.fillRect(top.x - 1, top.y - 26, 2, 26);
            c.fillStyle = brass(env, 0.5);
            const fl = Math.sin(t * 2.3) * 2;
            c.beginPath();
            c.moveTo(top.x + 1, top.y - 26);
            c.lineTo(top.x + 22, top.y - 21 + fl);
            c.lineTo(top.x + 1, top.y - 16);
            c.closePath();
            c.fill();
            c.restore();
          }
          // the alarm bracket (empty on 28 Oct) and, from 31 Oct, its bell
          c.save();
          c.strokeStyle = env.fill('ink');
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(BRACKET.x - 8, BRACKET.y);
          c.lineTo(BRACKET.x + 16, BRACKET.y);
          c.lineTo(BRACKET.x + 16, BRACKET.y + 4);
          c.stroke();
          c.restore();
          if (bellIn > 0.01) {
            const ring = pulse(t, b.once, 0.1, 0.4, 0.8);
            houseBell(c, env, { x: BRACKET.x + 16, y: BRACKET.y + 4 - (1 - bellIn) * 20, s: 0.9, swing: sw, ring, alpha: bellIn * (1 - green) });
            // the ghost of the same ring, faint, beside it
            const g = pulse(t, b.once + 0.75, 0.1, 0.5, 1.2);
            if (g > 0.01) houseBell(c, env, { x: BRACKET.x + 44, y: BRACKET.y + 4, s: 0.9, swing: ghost, ring: g, alpha: 0.32 * g });
          }
          c.save();
          c.globalAlpha = 1 - green;
          clipboardPost(c, env, t);
          c.restore();
          // the roped-off records round the wellhead base, and the groundskeeper's rake going round them
          const rope = seg(t, b.lifecycle - 2.2, b.lifecycle - 1.4) * (1 - seg(t, b.sandbox - 0.6, b.sandbox + 0.4));
          if (rope > 0.01) {
            c.save();
            c.globalAlpha = rope;
            c.fillStyle = env.fill('ink');
            const posts = [W.x - 104, W.x - 52, W.x + 52, W.x + 104];
            for (const px of posts) c.fillRect(px - 2, W.y - 26, 4, 26);
            c.strokeStyle = tone(env, '#c9b48a', 0.3);
            c.lineWidth = 1.2;
            c.beginPath();
            c.moveTo(posts[0], W.y - 22);
            for (const px of posts.slice(1)) c.quadraticCurveTo(px - 26, W.y - 14, px, W.y - 22);
            c.stroke();
            c.restore();
            if (rakeU > 0 && rakeU < 1) {
              // the rake travels from the right, stops at the rope, then goes round it (up and over the posts' line)
              const xA = W.x + 260, xStop = W.x + 120, xEnd = W.x - 220;
              const u1 = clamp01(rakeU / 0.4), hold = rakeU > 0.4 && rakeU < 0.55, u2 = clamp01((rakeU - 0.55) / 0.45);
              const x = rakeU <= 0.4 ? lerp(xA, xStop, u1) : hold ? xStop : lerp(xStop, xEnd, u2);
              const y = W.y + 6 + Math.sin(Math.PI * u2) * 18;
              c.save();
              c.strokeStyle = env.fill('ink');
              c.lineWidth = 2;
              c.beginPath();
              c.moveTo(x, y);
              c.lineTo(x + 40, y - 70);
              c.stroke();
              c.lineWidth = 1.2;
              for (let i = -3; i <= 3; i++) {
                c.beginPath();
                c.moveTo(x + i * 3, y);
                c.lineTo(x + i * 3, y + 6);
                c.stroke();
              }
              c.fillRect(x - 11, y - 1, 22, 2);
              c.restore();
            }
          }
        },
      },
    );
    // ---------------------------------------------------------------- type
    placeStamp(f.c, { place: 'As of', date: '31 October 2026', year: 2026, x: 48, y: 64, at: b.date, fade: 0.5, cps: 20 }, { t, mood: f.mood, seed: 31 });
    const s2 = textSwap(t, b.sandbox, 0.4);
    const a1 = seg(t, b.notrun - 0.15, b.notrun + 0.4) * s2.out * (1 - seg(t, b.supervisor - 1.4, b.supervisor - 0.6));
    label(f.c, f.mood, { id: `${ID}-notrun`, text: 'Tests read, not run', x: 1216, y: 96, align: 'right', alpha: a1 });
    label(f.c, f.mood, { id: `${ID}-sandbox`, text: 'Not a sandbox on its own', x: 1216, y: 96, align: 'right', alpha: s2.in });

    /** the clipboard of test sheets and a reading glass on a post by the Well, and the OFF switch beside it */
    function clipboardPost(c: C2, env: PaintEnv, tt: number): void {
      const a = seg(tt, b.tests - 0.3, b.tests + 0.4);
      c.save();
      c.fillStyle = env.fill('ink');
      c.fillRect(POST.x - 3, POST.y - 150, 6, 150);
      c.restore();
      if (a <= 0.01) return;
      c.save();
      c.globalAlpha = a;
      const bx = POST.x - 22, by = POST.y - 150;
      c.fillStyle = env.fill('ink');
      c.fillRect(bx, by, 44, 58);
      c.fillStyle = paper(env, 0.15);
      c.fillRect(bx + 3, by + 6, 38, 48);
      c.strokeStyle = withAlpha('#2a2016', 0.55);
      c.lineWidth = 0.8;
      for (let r = 0; r < 7; r++) {
        c.beginPath();
        c.moveTo(bx + 7, by + 12 + r * 6);
        c.lineTo(bx + 7 + 26 - ((r * 7) % 11), by + 12 + r * 6);
        c.stroke();
      }
      c.fillStyle = brass(env, 0.5);
      c.fillRect(bx + 14, by - 2, 16, 6);
      // the reading glass lying on the sheets
      c.strokeStyle = brass(env, 0.6);
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(bx + 28, by + 36, 8, 0, Math.PI * 2);
      c.moveTo(bx + 34, by + 42);
      c.lineTo(bx + 42, by + 52);
      c.stroke();
      // the switch: a small lever plate, OFF (lever down), never touched
      const sx = POST.x + 30, sy = POST.y - 112;
      const sa = seg(tt, b.notrun - 0.3, b.notrun + 0.3);
      c.globalAlpha = a * Math.max(0.35, sa);
      c.fillStyle = env.fill('ink');
      c.fillRect(sx - 9, sy - 14, 18, 28);
      c.strokeStyle = brass(env, 0.6);
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx + 2, sy + 12);
      c.stroke();
      c.restore();
    }
  },
});
