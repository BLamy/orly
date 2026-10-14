/**
 * ch04-s01 / ch04-s02 shared: abstract, drawn stand-ins for product UI (director's note 2026-10-14: no rrweb footage in
 * the triplet's first two beats). Pure canvas painters in the promo look: white cards, soft plum shadows, grey skeleton
 * bars, one red-pink accent, green only for ✓.
 *
 *   browserWindow   a small abstract browser: title bar (three dots, a recording dot), skeleton page, progress → ✓
 *   addressBar      a wide abstract browser bar whose address rolls between values (slot-machine roll)
 *   moon            a thin crescent (the night beat)
 */
import { PROMO, easeInOut, easeOut, font, hexA } from '../../../film/promo';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

function shadowCard(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, lift = 1) {
  c.save();
  c.shadowColor = `rgba(40,10,60,${(0.2 * lift).toFixed(3)})`;
  c.shadowBlur = 30 * lift;
  c.shadowOffsetY = 12 * lift;
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
  c.restore();
  c.strokeStyle = 'rgba(20,18,22,.07)';
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, r);
  c.stroke();
}

function check(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, u: number) {
  const e = easeOut(clamp(u));
  if (e <= 0) return;
  c.save();
  c.globalAlpha *= e;
  c.fillStyle = PROMO.green;
  c.beginPath();
  c.arc(cx, cy, r * (0.6 + 0.4 * e), 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = r * 0.28;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const d = clamp((u - 0.25) / 0.6);
  c.beginPath();
  const p0 = { x: cx - r * 0.42, y: cy + r * 0.02 }, p1 = { x: cx - r * 0.1, y: cy + r * 0.34 }, p2 = { x: cx + r * 0.46, y: cy - r * 0.32 };
  c.moveTo(p0.x, p0.y);
  if (d < 0.4) c.lineTo(p0.x + (p1.x - p0.x) * (d / 0.4), p0.y + (p1.y - p0.y) * (d / 0.4));
  else {
    c.lineTo(p1.x, p1.y);
    const k = (d - 0.4) / 0.6;
    c.lineTo(p1.x + (p2.x - p1.x) * k, p1.y + (p2.y - p1.y) * k);
  }
  c.stroke();
  c.restore();
}

/**
 * A small abstract browser at (x, y) w × h. u: entrance (0 → 1, rises and sharpens); run: 0 → 1 the progress bar (a
 * page being exercised: the skeleton bars brighten as it passes); done: 0 → 1 the ✓ in the title bar. rec: recording
 * dot pulse phase (seconds). seed varies the skeleton.
 */
export function browserWindow(
  c: CanvasRenderingContext2D,
  o: { x: number; y: number; w: number; h: number; u: number; run: number; done: number; t: number; seed: number },
) {
  const u = clamp(o.u);
  if (u <= 0) return;
  const e = easeOut(u);
  const { w, h } = o;
  const x = o.x, y = o.y + (1 - e) * 26;
  c.save();
  c.globalAlpha *= e;
  if (e < 0.98) c.filter = `blur(${((1 - e) * 6).toFixed(2)}px)`;
  shadowCard(c, x, y, w, h, 10, 0.6 + 0.4 * e);
  // title bar
  const bar = 22;
  c.fillStyle = '#f4f2f6';
  c.beginPath();
  c.roundRect(x + 1, y + 1, w - 2, bar, [9, 9, 0, 0]);
  c.fill();
  c.fillStyle = 'rgba(20,18,22,.06)';
  c.fillRect(x + 1, y + bar, w - 2, 1);
  for (let i = 0; i < 3; i++) {
    c.fillStyle = '#d7d3db';
    c.beginPath();
    c.arc(x + 12 + i * 10, y + bar / 2 + 1, 3, 0, Math.PI * 2);
    c.fill();
  }
  // address skeleton
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(x + 46, y + 6, w - 92, 11, 5.5);
  c.fill();
  // recording dot (left of the ✓ slot) while running, ✓ when done
  const running = o.run > 0 && o.done <= 0;
  if (running) {
    const pulse = 0.55 + 0.45 * Math.cos(o.t * Math.PI * 2 * 1.1 + o.seed);
    c.fillStyle = hexA(PROMO.brand, pulse);
    c.beginPath();
    c.arc(x + w - 14, y + bar / 2 + 1, 3.6, 0, Math.PI * 2);
    c.fill();
  }
  check(c, x + w - 14, y + bar / 2 + 1, 7, o.done);
  // the page: skeleton bars, a hero block, a button
  const px = x + 14, pw = w - 28;
  let py = y + bar + 13;
  const run = clamp(o.run);
  const rows = [0.62, 0.9, 0.78, 0.5];
  const sh = (i: number) => 0.55 + 0.45 * Math.abs(Math.sin(o.seed * 3.1 + i * 1.7));
  c.fillStyle = '#eceaef';
  c.beginPath();
  c.roundRect(px, py, pw * 0.42, 9, 4.5);
  c.fill();
  py += 17;
  for (let i = 0; i < rows.length; i++) {
    const lit = clamp((run - i / rows.length) * rows.length);
    c.fillStyle = lit > 0 ? `rgb(${Math.round(236 - 18 * lit)},${Math.round(234 - 22 * lit)},${Math.round(239 - 14 * lit)})` : '#eeedf0';
    c.beginPath();
    c.roundRect(px, py, pw * rows[i] * sh(i), 6, 3);
    c.fill();
    py += 12;
  }
  // a button that gets 'clicked' when the run passes it
  const btnLit = clamp((run - 0.55) / 0.08) * (1 - clamp((run - 0.75) / 0.2));
  c.fillStyle = btnLit > 0 ? hexA(PROMO.brand, 0.18 + 0.5 * btnLit) : '#e4e1e8';
  c.beginPath();
  c.roundRect(px, py + 2, 46, 13, 6.5);
  c.fill();
  // progress hairline along the bottom
  if (run > 0) {
    c.fillStyle = hexA(PROMO.ink, 0.06);
    c.fillRect(x + 10, y + h - 9, w - 20, 3);
    c.fillStyle = o.done > 0 ? PROMO.green : PROMO.brand;
    c.fillRect(x + 10, y + h - 9, (w - 20) * easeInOut(run), 3);
  }
  c.restore();
}

/**
 * A wide abstract browser bar centred at cx, top y, width w: three dots, a lock glyph and an address that rolls from
 * one value to the next (values[i] arrives at ats[i], rolling up over `roll` s). u: entrance.
 */
export function addressBar(
  c: CanvasRenderingContext2D,
  o: { cx: number; y: number; w: number; u: number; t: number; values: string[]; ats: number[]; size?: number; roll?: number; accent?: number[] },
) {
  const u = clamp(o.u);
  if (u <= 0) return;
  const e = easeOut(u);
  const size = o.size ?? 34;
  const h = size * 2.3;
  const x = o.cx - o.w / 2, y = o.y + (1 - e) * 22;
  c.save();
  c.globalAlpha *= e;
  if (e < 0.98) c.filter = `blur(${((1 - e) * 7).toFixed(2)}px)`;
  shadowCard(c, x, y, o.w, h, h / 2, 1);
  for (let i = 0; i < 3; i++) {
    c.fillStyle = '#d7d3db';
    c.beginPath();
    c.arc(x + h * 0.55 + i * 18, y + h / 2, 5.5, 0, Math.PI * 2);
    c.fill();
  }
  // lock (only while the current address is https)
  let curL = 0;
  for (let i = 0; i < o.ats.length; i++) if (o.t >= o.ats[i]) curL = i;
  const lockA = o.values[curL]?.startsWith('https') ? 1 : 0;
  const lx = x + h * 0.55 + 3 * 18 + 22, ly = y + h / 2;
  c.save();
  c.globalAlpha *= lockA;
  c.strokeStyle = PROMO.mute;
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(lx, ly - 4, 5.5, Math.PI, 0);
  c.stroke();
  c.fillStyle = PROMO.mute;
  c.beginPath();
  c.roundRect(lx - 8, ly - 4, 16, 13, 3);
  c.fill();
  c.restore();

  // rolling address, clipped to the field
  const fx = lx + 24, fw = x + o.w - h * 0.5 - fx;
  c.save();
  c.beginPath();
  c.rect(fx, y + 4, fw, h - 8);
  c.clip();
  c.font = font(400, size);
  c.textBaseline = 'middle';
  const roll = o.roll ?? 0.26;
  let cur = 0;
  for (let i = 0; i < o.ats.length; i++) if (o.t >= o.ats[i]) cur = i;
  const k = o.ats.length ? easeInOut(clamp((o.t - o.ats[cur]) / roll)) : 1;
  const step = h; // a full-height push: the outgoing address leaves the field before the next one is readable
  const draw = (i: number, dy: number, a: number) => {
    if (i < 0 || a <= 0) return;
    const v = o.values[i];
    const acc = o.accent?.[i] ?? 0;
    c.globalAlpha = a;
    // host part in ink, scheme muted
    const m = v.match(/^(https?:\/\/)?(.*)$/)!;
    const scheme = m[1] ?? '';
    c.fillStyle = PROMO.mute;
    c.fillText(scheme, fx, y + h / 2 + dy);
    const sx = fx + c.measureText(scheme).width + size * 0.04;
    c.fillStyle = acc > 0 ? PROMO.brand : PROMO.ink;
    c.fillText(m[2], sx, y + h / 2 + dy);
  };
  if (cur === 0 && o.t < (o.ats[0] ?? 0)) draw(0, 0, 1);
  else {
    draw(cur - 1, -step * k, 1 - k);
    draw(cur, step * (1 - k), k);
  }
  c.restore();
  c.restore();
}

/** a thin crescent moon centred at (x, y), radius r, blurred in over u */
export function moon(c: CanvasRenderingContext2D, o: { x: number; y: number; r: number; u: number; color?: string }) {
  const u = clamp(o.u);
  if (u <= 0) return;
  const e = easeOut(u);
  c.save();
  c.globalAlpha *= e;
  if (e < 0.98) c.filter = `blur(${((1 - e) * 6).toFixed(2)}px)`;
  const y = o.y + (1 - e) * 10;
  c.beginPath();
  c.arc(o.x, y, o.r, 0, Math.PI * 2);
  c.clip();
  c.beginPath();
  c.arc(o.x, y, o.r, 0, Math.PI * 2);
  c.arc(o.x + o.r * 0.42, y - o.r * 0.28, o.r * 0.86, 0, Math.PI * 2, true);
  c.fillStyle = o.color ?? PROMO.ink;
  c.fill('evenodd');
  c.restore();
}
