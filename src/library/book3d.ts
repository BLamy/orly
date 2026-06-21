// Draw a 3-D book on the shelf: take a pre-composed cover canvas and skew it
// onto a tapered front face (right edge recedes), with a left spine, page
// edges, a sheen, and a soft shadow. Pure 2-D canvas.

export function drawBook3D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cover: HTMLCanvasElement,
  opts: { lift?: number } = {},
) {
  const lift = opts.lift ?? 0;
  y -= lift;
  const T = Math.max(7, w * 0.05); // spine thickness
  const taper = h * 0.03; // how much the right edge recedes

  // soft contact shadow
  ctx.save();
  ctx.filter = `blur(${Math.max(6, w * 0.05)}px)`;
  ctx.fillStyle = `rgba(20,16,12,${0.32 - lift * 0.01})`;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.52, y + h + 10 + lift, w * 0.52, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // spine (left side, receding back-left)
  ctx.fillStyle = 'rgba(26,22,18,0.92)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - T, y + T * 0.45);
  ctx.lineTo(x - T, y + h + T * 0.45);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // page block sliver on the right (cream), following the taper
  ctx.fillStyle = '#efe9da';
  ctx.beginPath();
  ctx.moveTo(x + w, y + taper);
  ctx.lineTo(x + w + T * 0.5, y + taper + T * 0.4);
  ctx.lineTo(x + w + T * 0.5, y + h - taper + T * 0.4);
  ctx.lineTo(x + w, y + h - taper);
  ctx.closePath();
  ctx.fill();

  // front cover — perspective skew via vertical strips (right edge recedes)
  const N = 56;
  const cw = cover.width, ch = cover.height;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + taper);
  ctx.lineTo(x + w, y + h - taper);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < N; i++) {
    const f = i / N;
    const dx = x + f * w;
    const dw = w / N + 0.8;
    const topY = y + taper * f;
    const hgt = h - 2 * taper * f;
    ctx.drawImage(cover, f * cw, 0, cw / N, ch, dx, topY, dw, hgt);
  }
  // sheen
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, 'rgba(255,255,255,0.16)');
  g.addColorStop(0.1, 'rgba(255,255,255,0)');
  g.addColorStop(0.85, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.14)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.restore();

  // left edge highlight where cover meets spine
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 0.5, y);
  ctx.lineTo(x + 0.5, y + h);
  ctx.stroke();

  // thin outline
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + taper);
  ctx.lineTo(x + w, y + h - taper);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.stroke();
}
