// Compose an O'Reilly-style book cover onto a canvas: white field, a colored
// "O'REILLY" banner, a colored title block (title + rule + subtitle), the
// generated animal engraving in the lower-right, and the author line. Publisher
// is always O'Reilly; author defaults to Brett Lamy.

export interface BookMeta {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  role: string;
  color: string; // banner/title-block hue
  animal: string; // path to the engraving png
  href: string;
}

// A colourful O'Reilly-ish palette (assign per book for a varied shelf).
export const PALETTE = [
  '#d6202b', '#1f6fb2', '#3a8b3a', '#e07b1a', '#6a3f9e',
  '#198a8a', '#b0277a', '#c79100', '#41607f', '#a01f3c',
];

export function colorForSlug(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";

function fitOneLine(
  ctx: CanvasRenderingContext2D, text: string, maxW: number,
  family: string, weight: string, startPx: number, minPx: number,
): number {
  let size = startPx;
  for (; size > minPx; size -= 1) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
  }
  ctx.font = `${weight} ${size}px ${family}`;
  return size;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

export function drawCover(
  ctx: CanvasRenderingContext2D, W: number, H: number, b: BookMeta,
  animal: HTMLImageElement | null,
) {
  const color = b.color || '#d6202b';

  // field
  ctx.fillStyle = '#fbfbf9';
  ctx.fillRect(0, 0, W, H);

  // animal engraving, anchored bottom-right (drawn before the title block)
  if (animal && animal.complete && animal.naturalWidth) {
    const aw = animal.naturalWidth, ah = animal.naturalHeight;
    const boxW = W * 0.9, boxH = H * 0.66;
    const s = Math.min(boxW / aw, boxH / ah);
    const dw = aw * s, dh = ah * s;
    ctx.drawImage(animal, W - dw - W * 0.01, H - dh - H * 0.005, dw, dh);
  }

  // top "O'REILLY" banner
  const bannerH = Math.round(H * 0.05);
  const bannerY = Math.round(H * 0.028);
  const bannerX = Math.round(W * 0.06);
  // Parody publisher — "O'RLY", never the real "O'Reilly".
  ctx.font = `800 ${Math.round(bannerH * 0.62)}px ${SANS}`;
  const orW = ctx.measureText("O'RLY").width;
  const bannerW = orW + bannerH * 1.3;
  ctx.fillStyle = color;
  ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText("O'RLY", bannerX + bannerH * 0.42, bannerY + bannerH * 0.56);
  ctx.font = `800 ${Math.round(bannerH * 0.5)}px ${SANS}`;
  ctx.fillText('?', bannerX + bannerH * 0.42 + orW + bannerH * 0.12, bannerY + bannerH * 0.56);

  // title block
  const padX = W * 0.045;
  const blockX = Math.round(W * 0.06);
  const blockW = Math.round(W * 0.8);
  const blockTop = Math.round(H * 0.135);
  const innerW = blockW - padX * 2;

  const titleSize = fitOneLine(ctx, b.title, innerW, SERIF, '400', Math.round(H * 0.13), Math.round(H * 0.05));
  ctx.font = `600 ${Math.round(H * 0.022)}px ${SANS}`;
  const subLines = wrapLines(ctx, b.subtitle.toUpperCase(), innerW).slice(0, 3);
  const subSize = Math.round(H * 0.022);
  const subLineH = subSize * 1.32;

  const titleH = titleSize * 1.02;
  const ruleGap = H * 0.022;
  const subTop = ruleGap + H * 0.02;
  const blockH = Math.round(H * 0.05 + titleH + subTop + subLines.length * subLineH + H * 0.03);

  ctx.fillStyle = color;
  ctx.fillRect(blockX, blockTop, blockW, blockH);

  // title
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `400 ${titleSize}px ${SERIF}`;
  const titleBaseline = blockTop + H * 0.05 + titleSize * 0.82;
  ctx.fillText(b.title, blockX + padX, titleBaseline);

  // thin rule
  const ruleY = titleBaseline + ruleGap;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1, H * 0.0015);
  ctx.beginPath();
  ctx.moveTo(blockX + padX, ruleY);
  ctx.lineTo(blockX + blockW - padX, ruleY);
  ctx.stroke();

  // subtitle
  ctx.font = `600 ${subSize}px ${SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  let sy = ruleY + subTop + subSize;
  for (const line of subLines) {
    ctx.fillText(line, blockX + padX, sy);
    sy += subLineH;
  }

  // author, bottom-right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1a1a1a';
  const nameSize = Math.round(H * 0.03);
  ctx.font = `400 ${nameSize}px ${SERIF}`;
  ctx.fillText(b.author, W - W * 0.045, H - H * 0.06);
  ctx.font = `700 ${Math.round(H * 0.016)}px ${SANS}`;
  ctx.fillStyle = '#444';
  ctx.fillText(b.role, W - W * 0.045, H - H * 0.035);
}
