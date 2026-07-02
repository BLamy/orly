import { colors } from '../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** Role → chip color, matching Anthropic message roles (tool = tool_result block). */
export const ROLE_COLOR: Record<MessageRole, string> = {
  system: colors.MUTED,
  user: colors.ACCENT,
  assistant: colors.SECONDARY,
  tool: colors.WARM,
};

const ROLE_LABEL: Record<MessageRole, string> = {
  system: 'system',
  user: 'user',
  assistant: 'assistant',
  tool: 'tool_result',
};

const FONT = 15;
const CHAR_W = FONT * 0.602; // ui-monospace advance width
const LINE_H = 20;
const PAD = 12;
const HEADER_H = 24;

/** Word-wrap for the card's monospace body (long words are hard-sliced). */
export function wrapMessage(text: string, w: number): string[] {
  const maxChars = Math.max(4, Math.floor((w - PAD * 2) / CHAR_W));
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      let piece = word;
      while (piece.length > maxChars) {
        if (line) lines.push(line);
        lines.push(piece.slice(0, maxChars));
        piece = piece.slice(maxChars);
        line = '';
      }
      if (!line) line = piece;
      else if (line.length + 1 + piece.length <= maxChars) line += ` ${piece}`;
      else {
        lines.push(line);
        line = piece;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Total height a MessageCard will occupy — use it to stack a transcript. */
export function messageCardHeight(text: string, w: number): number {
  return HEADER_H + wrapMessage(text, w).length * LINE_H + PAD;
}

/**
 * One transcript message — a role chip plus monospace body whose text
 * streams in character-by-character from a single `u` channel (the visual
 * for `content_block_delta` / tau's MessageDeltaEvent). A caret marks the
 * write head while 0 < u < 1. `enter` is card entrance; `dim` fades history.
 */
export function MessageCard({
  x,
  y,
  w,
  role,
  text,
  u = 1,
  enter = 1,
  glow = 0,
  dim = 0,
  label,
}: {
  /** top-left, stage coordinates */
  x: number;
  y: number;
  w: number;
  role: MessageRole;
  text: string;
  /** 0..1 fraction of the body text revealed (streaming) */
  u?: number;
  /** 0..1 card entrance */
  enter?: number;
  /** 0..1 emphasis halo */
  glow?: number;
  /** 0..1 fades the card (older turns) */
  dim?: number;
  /** override the role chip text (e.g. 'assistant · thinking') */
  label?: string;
}) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const color = ROLE_COLOR[role];
  const lines = wrapMessage(text, w);
  const h = HEADER_H + lines.length * LINE_H + PAD;
  const total = lines.reduce((n, l) => n + Math.max(1, l.length), 0);
  const shown = Math.round(clamp01(u) * total);
  const alpha = e * (1 - 0.6 * clamp01(dim));
  const chip = label ?? ROLE_LABEL[role];
  const chipW = chip.length * 7.2 + 14;

  let cum = 0;
  let caret: { lx: number; ly: number } | null = null;
  const rendered = lines.map((line, i) => {
    const lineLen = Math.max(1, line.length);
    const take = Math.max(0, Math.min(lineLen, shown - cum));
    const visible = line.slice(0, take);
    if (clamp01(u) < 1 && caret === null && cum + lineLen >= shown) {
      caret = { lx: PAD + take * CHAR_W, ly: HEADER_H + i * LINE_H + 3 };
    }
    cum += lineLen;
    return (
      <text
        key={i}
        x={PAD}
        y={HEADER_H + (i + 0.72) * LINE_H}
        fill={colors.TEXT}
        fontSize={FONT}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {visible}
      </text>
    );
  });

  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={alpha}>
      {glow > 0 && (
        <rect x={-5} y={-5} width={w + 10} height={h + 10} rx={13} fill="none" stroke={color} strokeWidth={2} opacity={0.5 * clamp01(glow)} />
      )}
      <rect width={w} height={h} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.5} strokeOpacity={0.55} />
      <rect x={PAD - 3} y={7} width={chipW} height={16} rx={8} fill={color} opacity={0.16} />
      <text x={PAD + chipW / 2 - 3} y={19} textAnchor="middle" fill={color} fontSize={11} fontWeight={700} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
        {chip}
      </text>
      {rendered}
      {caret !== null && (
        <rect x={(caret as { lx: number; ly: number }).lx + 1} y={(caret as { lx: number; ly: number }).ly} width={7.5} height={LINE_H - 5} fill={color} opacity={0.85} />
      )}
    </g>
  );
}
