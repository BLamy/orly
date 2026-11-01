/**
 * ch06-s03 — scrolls and Books in the Well (winterBlue; cut in, L6 lamp-post sliding out as the occluder wipe).
 *
 * PART 1 (the canonical town, 0 → 'version'): the camera trucks left behind the L6 lamp-post onto House A's pulley
 * line. send: the cut lengths, rolled into one scroll, ride A's pulley line down to the wellhead, where the keeper of
 * House A hooks it on the Well's rope and lowers it into the mouth. merge ('newest'): two copies of the same page
 * meet beside the wellhead and the older presses under the newer (each page once, newest version).
 * MATCH CUT on the scroll's descent into
 * PART 2 (the Well's side, cut away; serverCyan glints only here): L2 the far wall of the shaft (later one recess
 * lit labGreen), L3 the cut stone faces and the cold lamp, L4 the stone shelf 'epoch 7' with its Book and scrolls,
 * the rope at the left, L5 blurred hanging roots at the left edge.
 *   cord      8.15  push in: the hanging scroll's knot-tag (tally + length mark) glints on 'checksum', marks on 'length';
 *                   label 'scrolls: gzip, checksum + length'; the scroll swings onto the shelf
 *   refuse   13.06  a frayed, short scroll is lifted; its knot will not untie; it is set aside unopened
 *   book     18.46  the shelf's first item, a bound Book, glints; more scrolls pile in
 *   compact  23.65  a new Book comes down the rope and is placed first; only then are the old Book and scrolls swept
 *   badge    27.83  'workerd · 28 Oct' swings on the shelf's end; label 'workerd: its own format · celld: LTX'
 *   ltx      28.77  a distant recess on the far wall lights labGreen: a different, flat-tied bundle, 'celld 0.6.3'; fades
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, mixLab, textSwap, toLayer, withAlpha } from '../../../film';
import type { Camera3, Frame } from '../../../film';
import { cast, MOON_LIGHT, MOON_RIM } from '../cast';
import { TOWN, paintTown, pulleyAt } from '../sets/harbourTown';
import { WELL } from '../sets/wellAndPlate';
import { badge, bakeRect, camAt, clamp01, glowDot, label, lerp, pulse, seg, sm, tone, twos, SEA_CYAN, type CamKey } from '../sets/common';
import { book, scroll } from '../sets/walRibbon';
import { epochShelf } from '../sets/wellCutaway';

const ID = 'ch06-s03';
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });
const PULLEY = { x: TOWN.well.x + WELL.pulley.x, y: TOWN.well.y + WELL.pulley.y };
const MOUTH_Y = TOWN.well.y - WELL.ringH - 4;
// part 2 geometry (its own world, rest-screen px)
const ROPE_X = 470;
const SH = { x: 540, y: 470, s: 1.5, w: 570 };
const slotX = (i: number) => SH.x + 40 + i * 66;
const SCROLL_Y = SH.y - 8 * SH.s;
const REJECT = { x: 1120, y: 560 };
const GREEN = { x: 260, y: 250 };

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      send: T.beat('send'),
      scrolls: T.word('L0610', 'scrolls'),
      merge: T.beat('merge'),
      cutAt: T.wordEnd('L0610', 'version') + 0.05,
      cord: T.beat('cord'),
      checksum: T.word('L0611', 'checksum'),
      length: T.word('L0611', 'length'),
      damaged: T.word('L0611', 'damaged'),
      refuse: T.beat('refuse'),
      wrong: T.wordEnd('L0611', 'wrong'),
      book: T.beat('book'),
      inherited: T.wordEnd('L0612', 'inherited'),
      newBook: T.word('L0612', 'new'),
      compact: T.beat('compact'),
      cleared: T.word('L0612', 'cleared'),
      badge: T.beat('badge'),
      ltx: T.beat('ltx'),
      LTX: T.wordEnd('L0613', 'LTX'),
    };
    const cams1: CamKey[] = [
      { t: 0, cam: C(760, 430, 80) },
      { t: b.send + 0.4, cam: C(450, 458, 150) },
      { t: b.scrolls + 1.2, cam: C(420, 480, 190) },
      { t: b.cutAt, cam: C(440, 520, 250) },
    ];
    const cams2: CamKey[] = [
      { t: b.cutAt, cam: C(500, 250, 220) },
      { t: b.cord - 0.2, cam: C(500, 290, 290) },
      { t: b.cord + 1.0, cam: C(500, 310, 380) },
      { t: b.length + 0.5, cam: C(510, 316, 380) },
      { t: b.length + 2.4, cam: C(720, 430, 250) },
      { t: b.refuse + 0.8, cam: C(760, 440, 260) },
      { t: b.wrong + 0.5, cam: C(800, 450, 230) },
      { t: b.book + 0.6, cam: C(660, 430, 270) },
      { t: b.newBook - 0.4, cam: C(650, 410, 220) },
      { t: b.cleared + 1.0, cam: C(720, 420, 210) },
      { t: b.badge + 0.2, cam: C(800, 430, 230) },
      { t: b.ltx + 1.6, cam: C(640, 380, 90) },
      { t: b.D, cam: C(650, 384, 110) },
    ];
    return { tl, b, cams1, cams2 };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    if (t < b.cutAt) paintTownPart(f, sc, t);
    else paintCutaway(f, sc, t);
    // ---------------------------------------------------------------- type (upper left; never two at once)
    const sw = textSwap(t, b.badge - 0.1, 0.4);
    const a1 = seg(t, b.cord - 0.1, b.cord + 0.35) * sw.out * (1 - seg(t, b.book - 1.2, b.book - 0.6));
    label(f.c, f.mood, { id: `${ID}-cord`, text: 'scrolls: gzip, checksum + length', x: 64, y: 92, alpha: a1, italic: true });
    const a2 = sw.in * (1 - seg(t, b.D - 0.8, b.D - 0.2) * 0.85);
    label(f.c, f.mood, { id: `${ID}-format`, text: 'workerd: its own format · celld: LTX', x: 64, y: 92, alpha: a2, italic: true });
  },
});

type SC = { b: Record<string, number>; cams1: CamKey[]; cams2: CamKey[] };

// ------------------------------------------------------------------ PART 1: the town
function paintTownPart(f: Frame, sc: SC, t: number): void {
  const { b, cams1 } = sc;
  const cam = camAt(cams1, t);
  const tq = twos(t);
  const ride = seg(t, b.send - 0.1, b.scrolls + 0.6); // along A's pulley line
  const lower = seg(t, b.scrolls + 0.9, b.cutAt - 0.1); // down the Well's rope into the mouth
  paintTown(
    f,
    {
      cam,
      cams: cams1.map((k) => k.cam),
      lamps: { A: 1, B: 0.12, C: 0 },
      lanterns: [{ house: 'A', lit: 1, members: 4, tq, door: 0, s: 0.68 }],
      plate: { house: 'A', epoch: 7, from: 7, crown: 1, dim: 0.35 },
      tooth: null,
      well: { bucket: 0.15 + 0.85 * lower, glint: 0.4 },
      lampPostLit: 0.5,
    },
    {
      L4: (c, env) => {
        // the keeper of House A at the wellhead, taking the scroll and lowering it
        const work = Math.floor(seg(t, b.scrolls + 0.3, b.scrolls + 0.9) * 6) / 6 * (1 - Math.floor(seg(t, b.cutAt - 0.6, b.cutAt) * 6) / 6);
        const kp = blendPose(POSES.stand, POSES.present, work);
        cast['keeper-a'].draw(c, { x: 344, y: TOWN.well.y, facing: 'right', pose: kp, scale: 0.62, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: MOON_RIM }, env);
        // the scroll: down A's pulley line, then on the rope into the mouth
        if (ride > 0.001) {
          let p: { x: number; y: number };
          if (lower <= 0) p = pulleyAt(cam, 'A', sm(ride));
          else p = { x: PULLEY.x, y: lerp(PULLEY.y + 14, MOUTH_Y + 30, sm(lower)) };
          c.save();
          c.beginPath();
          c.rect(-2000, -2000, 5000, MOUTH_Y + 2000 + 4);
          c.clip();
          scroll(c, env, { x: p.x, y: p.y + 6, s: 1.1, rot: lower > 0 ? Math.PI / 2 : -0.25, tag: 1 });
          c.restore();
        }
        // merge: two copies of one page; the older presses under the newer
        const m = seg(t, b.merge - 0.6, b.merge - 0.1) * (1 - seg(t, b.cutAt - 0.5, b.cutAt - 0.1));
        if (m > 0.01) {
          const mu = seg(t, b.merge - 0.1, b.merge + 0.6);
          const cx = 540, cy = 420;
          const pageCard = (x: number, y: number, dim: number, a: number) => {
            c.save();
            c.globalAlpha = a;
            c.fillStyle = mixLab(tone(env, '#e9dcc0', 0.25), env.mood.fg, 0.1 + dim);
            c.fillRect(x - 24, y - 17, 48, 34);
            c.strokeStyle = withAlpha('#2a2016', 0.5);
            c.lineWidth = 1;
            for (let r = 0; r < 4; r++) {
              c.beginPath();
              c.moveTo(x - 18, y - 9 + r * 6);
              c.lineTo(x + 14 - ((r * 7) % 11), y - 9 + r * 6);
              c.stroke();
            }
            c.restore();
          };
          pageCard(cx - 36 * (1 - mu) + 4 * mu, cy + 4 * mu, 0.35, m * (1 - 0.8 * mu));
          pageCard(cx + 30 * (1 - mu), cy, 0, m);
          glowDot(c, cx, cy, 34, tone(env, '#e8e0c8', 0.2), 0.35 * pulse(t, b.merge + 0.4, 0.15, 0.2, 0.6) * m);
        }
      },
    },
  );
}

// ------------------------------------------------------------------ PART 2: the cutaway
function paintCutaway(f: Frame, sc: SC, t: number): void {
  const { b, cams2 } = sc;
  const cam = camAt(cams2, t);
  const tq = twos(t);
  f.camera(cam);
  f.backlight({ sunX: 640, sunY: 120, intensity: 0.35 });
  const greenA = seg(t, b.ltx - 0.2, b.ltx + 0.5) * (1 - seg(t, b.LTX + 0.3, b.LTX + 1.3));
  f.layer('L2', (c, env) => {
    const r = { x: -500, y: -400, w: 2300, h: 1500 };
    bakeRect(f, c, env, `ch06s03/far/${r.x}`, r, (cc) => {
      cc.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.22);
      cc.fillRect(r.x, r.y, r.w, r.h);
      cc.strokeStyle = withAlpha(env.fill('rim'), 0.16);
      cc.lineWidth = 1.2;
      for (let y = r.y; y < r.y + r.h; y += 38) {
        cc.beginPath();
        cc.moveTo(r.x, y);
        cc.lineTo(r.x + r.w, y);
        cc.stroke();
        for (let x = r.x + ((y / 38) % 2) * 45; x < r.x + r.w; x += 90) {
          cc.beginPath();
          cc.moveTo(x, y);
          cc.lineTo(x, y + 38);
          cc.stroke();
        }
      }
      // a dark recess (the far shelf), unlit until celld's beat
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.7);
      cc.fillRect(GREEN.x - 80, GREEN.y - 56, 170, 60);
      cc.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.3);
      cc.fillRect(GREEN.x - 88, GREEN.y + 4, 186, 8);
    });
    if (greenA > 0.01) {
      // celld's shelf: a flat bundle tied crosswise (a different format), lit labGreen, its own badge
      glowDot(c, GREEN.x + 5, GREEN.y - 26, 120, tone(env, '#b8d890', 0.05), 0.55 * greenA);
      c.save();
      c.globalAlpha = greenA;
      c.fillStyle = mixLab(tone(env, '#d8e0b8', 0.1), env.mood.fg, 0.2);
      c.fillRect(GREEN.x - 50, GREEN.y - 22, 110, 26);
      c.fillRect(GREEN.x - 44, GREEN.y - 34, 98, 12);
      c.strokeStyle = withAlpha('#2c3a24', 0.8);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(GREEN.x - 50, GREEN.y - 34);
      c.lineTo(GREEN.x + 60, GREEN.y + 4);
      c.moveTo(GREEN.x + 60, GREEN.y - 34);
      c.lineTo(GREEN.x - 50, GREEN.y + 4);
      c.stroke();
      c.restore();
      badge(c, env, { x: GREEN.x + 5, y: GREEN.y + 14, text: 'celld 0.6.3', s: 1.6, legible: true, alpha: greenA, glint: 0.3, id: `${ID}-celld` });
    }
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    const r = { x: -500, y: -400, w: 2300, h: 1500 };
    bakeRect(f, c, env, `ch06s03/faces/${r.x}`, r, (cc) => {
      // the cut stone faces either side of the open section, and two ledges
      const set = mixLab(env.fill('set'), env.fill('ink'), 0.45);
      cc.fillStyle = set;
      cc.fillRect(r.x, r.y, 60 - r.x, r.h);
      cc.fillRect(1230, r.y, r.x + r.w - 1230, r.h);
      cc.fillRect(r.x, r.y, r.w, 400 + 20);
      cc.fillRect(r.x, 650, r.w, 500);
      // the arch of the cut over the section
      cc.beginPath();
      cc.moveTo(60, 20);
      cc.quadraticCurveTo(645, 110, 1230, 20);
      cc.lineTo(1230, 0);
      cc.lineTo(60, 0);
      cc.closePath();
      cc.fill();
      // the rough cut edge, catching cyan
      cc.strokeStyle = withAlpha(tone(env, SEA_CYAN, 0.3), 0.3);
      cc.lineWidth = 1.5;
      for (const ex of [60, 1230]) {
        cc.beginPath();
        for (let y = 20; y <= 650; y += 12) {
          const x = ex + Math.sin(y * 0.13) * 3;
          if (y === 20) cc.moveTo(x, y);
          else cc.lineTo(x, y);
        }
        cc.stroke();
      }
      cc.beginPath();
      cc.moveTo(60, 650);
      cc.lineTo(1230, 650);
      cc.stroke();
    });
  });
  // the cold lamp in the shaft (the only light; cyan allowed in the cutaway)
  f.practical({ x: 980, y: 120, kind: 'lamp', seed: 83, intensity: 0.5, radius: 110, layer: 'L3' });
  f.fog('B');
  f.layer('L4', (c, env) => {
    const ink = env.fill('ink');
    // the rope from above
    const hookY = ropeHook(t, b);
    c.strokeStyle = ink;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(ROPE_X, -600);
    c.lineTo(ROPE_X, hookY);
    c.stroke();
    c.fillStyle = ink;
    c.beginPath();
    c.arc(ROPE_X, hookY + 4, 4, 0, Math.PI);
    c.fill();
    // the shelf 'epoch 7'
    epochShelf(c, env, { x: SH.x, y: SH.y, w: SH.w, s: SH.s, label: 'epoch 7', labelLegible: true, items: [], id: `${ID}-shelf` });
    // the reject ledge (lower right)
    c.fillStyle = ink;
    c.fillRect(REJECT.x - 70, REJECT.y, 150, 8);
    // --- items
    const sweep = seg(t, b.cleared - 0.1, b.cleared + 1.1);
    const swept = (i: number) => ({ dx: sweep * (140 + i * 20), a: 1 - sm(clamp01(sweep * 1.4 - i * 0.04)) });
    // the old Book (slot 1) and its scrolls
    const bookGlint = pulse(t, b.book - 0.1, 0.25, 0.6, 0.9);
    {
      const s = swept(1);
      book(c, env, { x: slotX(1) + s.dx, y: SH.y, s: SH.s * 1.1, alpha: s.a });
      if (bookGlint > 0.01) glowDot(c, slotX(1), SH.y - 16, 36, tone(env, '#e8dcc0', 0.2), 0.4 * bookGlint * s.a);
    }
    const existing = [2, 3, 4];
    for (const i of existing) {
      if (i === 3) continue; // the frayed one, drawn below
      const s = swept(i);
      scroll(c, env, { x: slotX(i) + s.dx, y: SCROLL_Y, s: SH.s, tag: 1, alpha: s.a });
    }
    // the frayed scroll (slot 3): lifted on 'damaged', tugged at the knot on 'refuses', set aside
    {
      const lift = seg(t, b.refuse - 0.7, b.refuse - 0.1);
      const aside = seg(t, b.refuse + 1.0, b.refuse + 2.0);
      const tug = t > b.refuse - 0.2 && t < b.refuse + 1.0 ? Math.sin(tq * 30) * 3 : 0;
      const x = lerp(lerp(slotX(3), slotX(3) + 10, lift), REJECT.x, sm(aside));
      const y = lerp(lerp(SCROLL_Y, SCROLL_Y - 70, lift), REJECT.y - 8, sm(aside)) - Math.sin(Math.PI * aside) * 40;
      const s = lerp(SH.s, 2.8, lift * (1 - aside));
      scroll(c, env, { x: x + tug, y, s: Math.max(SH.s, s), frayed: 1, tag: 1, glint: pulse(t, b.refuse, 0.1, 0.3, 0.5), alpha: 1 - 0.45 * aside, tint: aside > 0.5 ? 'ghost' : 'none' });
    }
    // the new scroll: hanging on the rope (close-up), then onto slot 5
    {
      const down = seg(t, b.cutAt, b.cord - 0.3);
      const onShelf = seg(t, b.length + 0.5, b.length + 1.7);
      if (onShelf < 1 || true) {
        const hx = ROPE_X, hy = lerp(-120, 300, sm(down));
        const x = lerp(hx, slotX(5), sm(onShelf));
        const y = lerp(hy + 20, SCROLL_Y, sm(onShelf)) - Math.sin(Math.PI * onShelf) * 50;
        const s = lerp(4.6, SH.s, sm(onShelf));
        const s2 = swept(5);
        const sw = onShelf < 1 ? Math.sin(tq * 2.2) * 0.04 * (1 - onShelf) : 0;
        scroll(c, env, { x: x + (onShelf >= 1 ? s2.dx : 0), y, s, rot: sw, tag: 1, glint: Math.max(pulse(t, b.checksum - 0.1, 0.2, 0.5, 0.8), 0.6 * pulse(t, b.cord, 0.3, 0.6, 0.8)), alpha: onShelf >= 1 ? s2.a : 1 });
        // the length mark: a brass hairline drawn along the scroll on 'length'
        const lm = pulse(t, b.length - 0.1, 0.4, 0.5, 0.6) * (1 - onShelf);
        if (lm > 0.01) {
          c.save();
          c.globalAlpha = lm;
          c.strokeStyle = tone(env, '#f0d48a', 0.1);
          c.lineWidth = 2;
          const L = 40 * s;
          c.beginPath();
          c.moveTo(x - L / 2, y - 12 * s);
          c.lineTo(x - L / 2 + L * seg(t, b.length - 0.1, b.length + 0.4), y - 12 * s);
          c.moveTo(x - L / 2, y - 15 * s);
          c.lineTo(x - L / 2, y - 9 * s);
          c.stroke();
          c.restore();
        }
      }
    }
    // more scrolls pile in (slots 6, 7, 8) after the Book is shown
    for (let k = 0; k < 2; k++) {
      const at = b.inherited - 1.2 + k * 0.5;
      const u = seg(t, at, at + 0.5);
      if (u <= 0.001) continue;
      const s = swept(6 + k);
      scroll(c, env, { x: slotX(6 + k) + 60 * (1 - u) + s.dx, y: SCROLL_Y, s: SH.s, tag: 1, alpha: u * s.a });
    }
    // the new Book: down the rope on 'new Book', placed first (slot 0) on 'before'
    {
      const down = seg(t, b.newBook - 0.6, b.newBook + 0.5);
      const place = seg(t, b.newBook + 0.6, b.compact);
      if (down > 0.001) {
        const x = lerp(ROPE_X, slotX(0), sm(place));
        const y = lerp(lerp(-80, 300, sm(down)) + 30, SH.y, sm(place)) - Math.sin(Math.PI * place) * 40;
        book(c, env, { x, y, s: SH.s * 1.1 });
        glowDot(c, x, y - 16, 40, tone(env, '#e8dcc0', 0.2), 0.4 * pulse(t, b.compact, 0.2, 0.4, 0.8));
      }
    }
    // workerd's badge on the shelf's end
    const ba = seg(t, b.badge - 0.3, b.badge + 0.2);
    badge(c, env, { x: SH.x + SH.w - 70, y: SH.y + 10, text: 'workerd · 28 Oct', s: 1.15, legible: true, alpha: ba, glint: pulse(t, b.badge, 0.2, 0.3, 0.8), swing: 0.18 * Math.exp(-Math.max(0, tq - b.badge) * 1.5) * Math.sin(Math.max(0, tq - b.badge) * 6), id: `${ID}-workerd` });
  });
  f.rim({ x: 0, y: -1 });
  if (cam.z < 300)
    f.layer('L5', (c, env) => {
      // blurred hanging roots crossing the foreground
      c.strokeStyle = env.fill('fg');
      c.lineCap = 'round';
      const roots = [
        { x: 300, len: 520, w: 9 },
        { x: 352, len: 380, w: 6 },
        { x: 1030, len: 300, w: 8 },
      ];
      for (const r of roots) {
        c.lineWidth = r.w;
        c.beginPath();
        c.moveTo(r.x, -900);
        c.bezierCurveTo(r.x + 30, -300, r.x - 26, r.len - 300, r.x + 12, r.len - 400);
        c.stroke();
      }
    });
}
function ropeHook(t: number, b: Record<string, number>): number {
  // the rope's hook follows whatever it is lowering: the scroll, then the new Book
  const down = seg(t, b.cutAt, b.cord - 0.3);
  const up = seg(t, b.length + 0.5, b.length + 1.7);
  let y = lerp(-140, 300, sm(down));
  y = lerp(y, 160, sm(up));
  const bd = seg(t, b.newBook - 0.6, b.newBook + 0.5);
  if (bd > 0) y = lerp(lerp(-100, 300, sm(bd)), 160, seg(t, b.newBook + 0.6, b.compact));
  return y;
}
