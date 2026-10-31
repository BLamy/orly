/**
 * ch05-s03 — THE WANDERING DESK at the rim of the light (1978–1987): the painted backcloths that hang
 * behind the seated man and swap as his desk travels, the small Boltzmann net on the Pittsburgh desk, and
 * its thermometer tag.
 *
 *   BACKCLOTH            the cloth's size (local px)
 *   backcloth(f, c, kind, { x, y, alpha, t, env })   one painted cloth, hung from its batten on two cords;
 *                        kinds: 'blank' (the bare paper at Sussex) · 'sandiego' (palms, a low campus roofline)
 *                        · 'cambridge' (gothic window tracery) · 'pittsburgh' (bridges and mill stacks at
 *                        labGreen dusk) · 'toronto' (a study window, snow beginning, a generic skyline)
 *   boltzState(t, temp, from)   which of the six lanterns are lit at time t: random while hot, settling into
 *                        the net's preferred pattern as the temperature falls (an illustration of settling by
 *                        cooling; its learning rule is not shown)
 *   boltzNet(c, { x, y, on, k }, env)   the six lanterns on a wire stand, every pair joined by a thread
 *   thermoTag(c, { x, y, temp, k, alpha }, env)   a small standing card: a thermometer and the number
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { FONT } from '../../../film/silhouette/type';
import { glow, paperLantern } from '../../../film/silhouette/metaphors/kit';
import { snow } from '../../../film/silhouette/atmosphere';

type C = CanvasRenderingContext2D;
export type ClothKind = 'blank' | 'sandiego' | 'cambridge' | 'pittsburgh' | 'toronto';
export const BACKCLOTH = { w: 600, h: 380 };
const h01 = (i: number, s: number) => 0.5 + 0.5 * hash1(i, s);

function skyGrad(c: C, env: PaintEnv, w: number, h: number, warm = 0) {
  const m = env.mood;
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, m.sky[0]);
  g.addColorStop(0.4, m.sky[1]);
  g.addColorStop(0.72, mixLab(m.sky[3], m.halo, warm));
  g.addColorStop(1, m.sky[2]);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

function palm(c: C, x: number, base: number, h: number, lean: number, ink: string) {
  c.fillStyle = ink;
  c.strokeStyle = ink;
  // trunk: a slightly curving tapered band
  const top = { x: x + lean * h * 0.25, y: base - h };
  c.beginPath();
  c.moveTo(x - 6, base);
  c.quadraticCurveTo(x + lean * h * 0.05 - 4, base - h * 0.5, top.x - 2.5, top.y);
  c.lineTo(top.x + 2.5, top.y);
  c.quadraticCurveTo(x + lean * h * 0.05 + 4, base - h * 0.5, x + 6, base);
  c.closePath();
  c.fill();
  // fronds: drooping leaves, each a thin curved blade
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.42;
    const L = h * (0.24 + 0.04 * (k % 3));
    const ex = top.x + Math.cos(a) * L * 1.1;
    const ey = top.y + Math.sin(a) * L * 0.35 + L * 0.45 * Math.abs(Math.cos(a));
    c.beginPath();
    c.moveTo(top.x, top.y);
    c.quadraticCurveTo(top.x + Math.cos(a) * L * 0.6, top.y + Math.sin(a) * L * 0.75 - 8, ex, ey);
    c.quadraticCurveTo(top.x + Math.cos(a) * L * 0.5, top.y + Math.sin(a) * L * 0.5 - 2, top.x, top.y + 3);
    c.fill();
  }
}

function paintCloth(c: C, kind: ClothKind, env: PaintEnv) {
  const { w, h } = BACKCLOTH;
  const m = env.mood;
  const far = mixLab(m.set, m.haze, 0.45);
  const mid = mixLab(m.set, m.fg, 0.2);
  const near = mixLab(m.ink, m.set, 0.15);
  if (kind === 'blank') {
    // Sussex, where we left him: a dim winter night painted on the cloth, a few flakes, a low hedge line
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, mixLab(m.sky[0], m.set, 0.35));
    g.addColorStop(0.7, mixLab(m.sky[1], m.set, 0.3));
    g.addColorStop(1, mixLab(m.sky[1], m.set, 0.45));
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = mixLab(m.set, m.fg, 0.3);
    c.beginPath();
    c.moveTo(0, h * 0.84);
    for (let x = 0; x <= w; x += 14) c.lineTo(x, h * 0.82 - 8 * h01(x, 12));
    c.lineTo(w, h);
    c.lineTo(0, h);
    c.fill();
    c.fillStyle = withAlpha(m.rim, 0.35);
    for (let k = 0; k < 60; k++) c.fillRect(h01(k, 21) * w, h01(k, 22) * h * 0.85, 1.6, 1.6);
    return;
  }
  if (kind === 'sandiego') {
    skyGrad(c, env, w, h, 0.25);
    // a low sun behind haze
    const sg = c.createRadialGradient(w * 0.3, h * 0.66, 4, w * 0.3, h * 0.66, 120);
    sg.addColorStop(0, withAlpha(m.core, 0.55));
    sg.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = sg;
    c.fillRect(0, 0, w, h);
    // far mesa ridge
    c.fillStyle = far;
    c.beginPath();
    c.moveTo(0, h * 0.72);
    for (let x = 0; x <= w; x += 20) c.lineTo(x, h * 0.7 - 14 * Math.sin(x * 0.013) - 6 * Math.sin(x * 0.041));
    c.lineTo(w, h);
    c.lineTo(0, h);
    c.fill();
    // the low campus roofline: long flat blocks with window rows
    c.fillStyle = mid;
    c.fillRect(30, h * 0.74, 250, h * 0.26);
    c.fillRect(270, h * 0.78, 300, h * 0.22);
    c.fillRect(120, h * 0.7, 70, 14);
    c.fillStyle = withAlpha(m.halo, 0.45);
    for (let x = 40; x < 270; x += 18) c.fillRect(x, h * 0.79, 9, 6);
    for (let x = 282; x < 560; x += 18) c.fillRect(x, h * 0.83, 9, 6);
    palm(c, 110, h, 250, -0.2, near);
    palm(c, 470, h, 300, 0.25, near);
    palm(c, 540, h, 210, 0.1, near);
    return;
  }
  if (kind === 'cambridge') {
    // dusk sky behind a stone wall with one tall gothic window (a hole) and its tracery
    skyGrad(c, env, w, h, 0.1);
    const wall = new Path2D();
    wall.rect(0, 0, w, h);
    const cx = w / 2, ww = 230, spring = 150, sill = h - 26;
    // pointed arch: two arcs meeting at the apex
    const r = ww * 0.86;
    wall.moveTo(cx - ww / 2, sill);
    wall.lineTo(cx - ww / 2, spring);
    wall.arc(cx - ww / 2 + r, spring, r, Math.PI, Math.PI + Math.acos((r - ww / 2) / r));
    wall.arc(cx + ww / 2 - r, spring, r, -Math.acos((r - ww / 2) / r), 0);
    wall.lineTo(cx + ww / 2, sill);
    wall.closePath();
    c.fillStyle = mid;
    c.fill(wall, 'evenodd');
    // tracery: three mullions, a transom, quatrefoils in the head
    c.fillStyle = near;
    for (const dx of [-ww / 4, 0, ww / 4]) c.fillRect(cx + dx - 3.5, spring - 10, 7, sill - spring + 10);
    c.fillRect(cx - ww / 2, spring + 90, ww, 6);
    c.strokeStyle = near;
    c.lineWidth = 6;
    for (const [qx, qy, qr] of [[cx, spring - 62, 26], [cx - 52, spring - 18, 18], [cx + 52, spring - 18, 18]] as const) {
      c.beginPath();
      for (let k = 0; k < 4; k++) c.arc(qx + Math.cos((k * Math.PI) / 2) * qr * 0.5, qy + Math.sin((k * Math.PI) / 2) * qr * 0.5, qr * 0.5, 0, Math.PI * 2);
      c.stroke();
    }
    // pinnacles along the parapet
    c.fillStyle = mid;
    for (const px of [40, 150, 450, 560]) {
      c.beginPath();
      c.moveTo(px - 12, 50);
      c.lineTo(px, 0);
      c.lineTo(px + 12, 50);
      c.closePath();
      c.fill();
    }
    c.strokeStyle = withAlpha(m.rim, 0.18);
    c.lineWidth = 1.2;
    for (let y = 70; y < h; y += 34) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(cx - ww / 2 - 8, y);
      c.moveTo(cx + ww / 2 + 8, y);
      c.lineTo(w, y);
      c.stroke();
    }
    return;
  }
  if (kind === 'pittsburgh') {
    skyGrad(c, env, w, h, 0.18);
    // hills across the river
    c.fillStyle = far;
    c.beginPath();
    c.moveTo(0, h * 0.62);
    for (let x = 0; x <= w; x += 16) c.lineTo(x, h * 0.6 - 30 * Math.sin(x * 0.008 + 0.6) - 10 * Math.sin(x * 0.03));
    c.lineTo(w, h);
    c.lineTo(0, h);
    c.fill();
    // the mill: stacks with smoke, a blast-furnace bulk
    c.fillStyle = mid;
    c.fillRect(330, h * 0.5, 200, h * 0.24);
    for (const [sx, sh] of [[350, 150], [384, 175], [418, 160], [498, 130]] as const) {
      c.fillRect(sx, h * 0.74 - sh, 12, sh);
      // smoke: soft plumes drifting right
      for (let k = 0; k < 6; k++) {
        const r = 10 + k * 5;
        const sg = c.createRadialGradient(sx + 6 + k * 16, h * 0.74 - sh - 8 - k * 8, 0, sx + 6 + k * 16, h * 0.74 - sh - 8 - k * 8, r);
        sg.addColorStop(0, withAlpha(m.haze, 0.38 - k * 0.05));
        sg.addColorStop(1, withAlpha(m.haze, 0));
        c.fillStyle = sg;
        c.fillRect(sx - 40 + k * 16, h * 0.74 - sh - 60 - k * 8, 100, 100);
      }
      c.fillStyle = mid;
    }
    c.beginPath();
    c.ellipse(470, h * 0.52, 22, 40, 0, 0, Math.PI * 2);
    c.fill();
    // the river: a pale band with reflections
    c.fillStyle = mixLab(m.sky[2], m.set, 0.3);
    c.fillRect(0, h * 0.74, w, h * 0.12);
    c.strokeStyle = withAlpha(m.rim, 0.25);
    c.lineWidth = 1;
    for (let k = 0; k < 14; k++) {
      const y = h * 0.76 + (k % 4) * 8;
      const x = h01(k, 9) * w;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 30 + h01(k, 10) * 40, y);
      c.stroke();
    }
    // the bridge: an arched steel truss across the river, piers, deck
    c.strokeStyle = near;
    c.fillStyle = near;
    const deck = h * 0.7;
    c.fillRect(-10, deck, w + 20, 7);
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(20, deck);
    c.quadraticCurveTo(170, deck - 150, 320, deck);
    c.stroke();
    c.lineWidth = 2;
    for (let k = 1; k < 12; k++) {
      const u = k / 12;
      const x = 20 + 300 * u;
      const y = deck - 150 * 2 * u * (1 - u) * 1;
      c.beginPath();
      c.moveTo(x, deck);
      c.lineTo(x, y);
      if (k % 2) c.lineTo(x + 25, deck);
      c.stroke();
    }
    for (const px of [20, 320]) c.fillRect(px - 8, deck, 16, h - deck);
    // the near bank: dark
    c.fillStyle = near;
    c.fillRect(0, h * 0.86, w, h * 0.14);
    return;
  }
  // toronto: the study window (the cloth is the window wall), outside a generic skyline in the dusk
  skyGrad(c, env, w, h, 0.05);
  c.fillStyle = far;
  const rnd = (i: number) => h01(i, 71);
  let x = -10;
  let i = 0;
  while (x < w) {
    const bw = 30 + rnd(i) * 50;
    const bh = 60 + rnd(i + 100) * 150;
    c.fillRect(x, h * 0.86 - bh, bw - 4, bh);
    x += bw;
    i++;
  }
  c.fillStyle = withAlpha(m.halo, 0.5);
  for (let k = 0; k < 70; k++) {
    const wx = h01(k, 5) * w, wy = h * 0.86 - h01(k, 6) * 150;
    if (h01(k, 7) > 0.55) c.fillRect(wx, wy, 4, 5);
  }
}

/** the frame and battens (drawn every frame over the cloth): the window wall for Toronto */
function clothFrame(c: C, kind: ClothKind, env: PaintEnv) {
  const { w, h } = BACKCLOTH;
  const m = env.mood;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  if (kind === 'toronto') {
    // a study window: heavy frame, glazing bars, a sill, the wall around it
    const wall = new Path2D();
    wall.rect(-60, -40, w + 120, h + 90);
    wall.rect(60, 20, w - 120, h - 60);
    c.fillStyle = mixLab(m.set, m.fg, 0.35);
    c.fill(wall, 'evenodd');
    c.fillStyle = ink;
    c.fillRect(52, 12, w - 104, 10);
    c.fillRect(52, 12, 10, h - 44);
    c.fillRect(w - 62, 12, 10, h - 44);
    c.fillRect(40, h - 40, w - 80, 14);
    c.fillRect(w / 2 - 4, 20, 8, h - 60);
    for (const yy of [0.36, 0.68]) c.fillRect(60, 20 + (h - 60) * yy - 3, w - 120, 6);
    c.fillStyle = withAlpha(m.rim, 0.3);
    c.fillRect(40, h - 40, w - 80, 1.5);
    return;
  }
  // a painted cloth on a batten: a thin dark frame, two cords up into the flies
  c.fillRect(-6, -10, w + 12, 10);
  c.fillRect(-6, h, w + 12, 6);
  c.fillRect(-6, -10, 5, h + 16);
  c.fillRect(w + 1, -10, 5, h + 16);
  c.strokeStyle = ink;
  c.lineWidth = 1.5;
  for (const cx of [60, w - 60]) {
    c.beginPath();
    c.moveTo(cx, -10);
    c.lineTo(cx, -900);
    c.stroke();
  }
  c.fillStyle = withAlpha(m.rim, 0.22);
  c.fillRect(-6, -10, w + 12, 1.2);
}

export function backcloth(f: Frame, c: C, kind: ClothKind, o: { x: number; y: number; alpha: number; t: number; env: PaintEnv; key: string; snow?: number }) {
  if (o.alpha <= 0.003) return;
  const { w, h } = BACKCLOTH;
  const env = o.env;
  c.save();
  c.globalAlpha *= o.alpha;
  c.translate(o.x, o.y);
  const pad = kind === 'toronto' ? 70 : 10;
  f.cached(`${o.key}/cloth/${kind}/${env.mood.id}`, w + pad * 2, h + pad * 2, (cc) => {
    cc.translate(pad, pad);
    cc.save();
    cc.beginPath();
    cc.rect(0, 0, w, h);
    cc.clip();
    paintCloth(cc, kind, env);
    cc.restore();
  })(c, -pad, -pad);
  if (kind === 'toronto' && (o.snow ?? 0) > 0) {
    c.save();
    c.beginPath();
    c.rect(60, 20, w - 120, h - 60);
    c.clip();
    c.globalAlpha *= o.snow ?? 1;
    snow(c, { area: { x: 40, y: -40, w: w - 80, h: h + 20 }, count: 70, salt: 87, color: env.mood.core }, env);
    c.restore();
  }
  clothFrame(c, kind, env);
  c.restore();
}

// ------------------------------------------------------------------ the Boltzmann net on the desk
/** the net's preferred (low-energy) pattern: what it settles into (3 bright, 3 dark) */
export const BOLTZ_PATTERN = [1, 0, 1, 0, 1, 0];
/**
 * Lantern brightness at time t (0.1..1). temp: the thermometer (20 hot … 10 settled). HOT: every two frames
 * (on twos) every lantern is re-rolled to a random brightness between 0.1 and 1; as the temperature falls,
 * fewer lanterns are re-rolled per tick and the rest sit in their preferred state; at 10 nothing flips.
 */
export function boltzState(t: number, temp: number, from: number): number[] {
  if (t < from) return BOLTZ_PATTERN.map(() => 0.12);
  const n = Math.floor((t - from) * 12 + 1e-6);
  const noise = Math.max(0, Math.min(1, (temp - 10) / 10));
  // while fully hot, at least three of the six blink bright on every tick (the three highest rolls)
  const rolls = BOLTZ_PATTERN.map((_, i) => h01(n * 11 + i * 5, 4042));
  const third = [...rolls].sort((a, b) => b - a)[2];
  return BOLTZ_PATTERN.map((p, i) => {
    const r = h01(n * 7 + i * 13, 4041);
    // hot: a re-rolled lantern blinks BRIGHT more often than not (on twos), so the flicker reads at a glance
    if (noise >= 0.99 || r < 0.9 * noise * noise + 0.1 * noise) {
      const q = rolls[i];
      return q > 0.4 || (noise >= 0.99 && q >= third) ? 0.85 + 0.15 * h01(n * 3 + i, 4043) : 0.1;
    }
    return p ? 1 : 0.1;
  });
}

export function boltzNet(c: C, o: { x: number; y: number; on: number[]; k?: number; alpha?: number }, env: PaintEnv) {
  const k = o.k ?? 1;
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const m = env.mood;
  const ink = env.fill('ink');
  const P = [0, 1, 2, 3, 4, 5].map((i) => ({ x: o.x + ((i % 3) - 1) * 34 * k, y: o.y + (i < 3 ? -22 : 22) * k + ((i % 3) === 1 ? (i < 3 ? -8 : 8) * k : 0) }));
  c.save();
  c.globalAlpha *= a;
  // the wire stand: a small base and an upright frame
  c.fillStyle = ink;
  c.fillRect(o.x - 52 * k, o.y + 46 * k, 104 * k, 4 * k);
  c.fillRect(o.x - 50 * k, o.y - 46 * k, 2.2 * k, 92 * k);
  c.fillRect(o.x + 48 * k, o.y - 46 * k, 2.2 * k, 92 * k);
  c.fillRect(o.x - 50 * k, o.y - 46 * k, 100 * k, 2 * k);
  // threads between every pair (symmetric connections): their warmth follows the dimmer of the two ends,
  // so they flicker with the lanterns while hot and hold steady once settled
  const warm = mixLab(m.rim, m.core, 0.4);
  for (let i = 0; i < 6; i++)
    for (let j = i + 1; j < 6; j++) {
      const both = Math.min(o.on[i], o.on[j]);
      c.strokeStyle = both > 0.3 ? withAlpha(warm, 0.2 + 0.6 * both) : withAlpha(ink, 0.8);
      c.lineWidth = (0.9 + 0.6 * both) * k;
      c.beginPath();
      c.moveTo(P[i].x, P[i].y);
      c.lineTo(P[j].x, P[j].y);
      c.stroke();
    }
  for (let i = 0; i < 6; i++) paperLantern(c, { x: P[i].x, y: P[i].y, r: 8.5 * k, act: o.on[i], tassel: false, halo: 0.35 }, env);
  c.restore();
}

/** a little standing card on the desk: a thermometer and the number beside it */
export function thermoTag(c: C, o: { x: number; y: number; temp: number; k?: number; alpha?: number; flash?: number }, env: PaintEnv) {
  const k = o.k ?? 1;
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const m = env.mood;
  const paper = mixLab(m.halo, m.rim, 0.5);
  const ink = m.ink;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  // the card: a folded tent standing on the desk
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(-28 * k + 3, -64 * k + 3, 66 * k, 64 * k);
  c.fillStyle = paper;
  c.fillRect(-28 * k, -64 * k, 66 * k, 64 * k);
  // thermometer: stem and bulb; the column falls with the temperature (10 → 20 maps to 25% → 90%)
  const stemTop = -56 * k, stemBot = -14 * k;
  c.fillStyle = withAlpha(ink, 0.85);
  c.fillRect(-18 * k, stemTop, 6 * k, stemBot - stemTop);
  c.beginPath();
  c.arc(-15 * k, -11 * k, 6 * k, 0, Math.PI * 2);
  c.fill();
  const u = 0.25 + 0.65 * Math.max(0, Math.min(1, (o.temp - 10) / 10));
  c.fillStyle = mixLab(m.halo, m.core, 0.35);
  c.fillRect(-16.5 * k, stemBot - (stemBot - stemTop) * u, 3 * k, (stemBot - stemTop) * u);
  c.beginPath();
  c.arc(-15 * k, -11 * k, 3.6 * k, 0, Math.PI * 2);
  c.fill();
  // the number (VT323, the decade's face)
  c.fillStyle = ink;
  c.font = `400 ${30 * k}px ${FONT.phosphor}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(String(Math.round(o.temp)), -6 * k, -22 * k);
  if ((o.flash ?? 0) > 0) glow(c, 10 * k, -34 * k, 40 * k, m.halo, 0.25 * (o.flash ?? 0));
  c.restore();
}
