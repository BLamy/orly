// JsonDoc — syntax-highlighted JSON on the SVG stage, built for MORPHS.
//
// The layout is computed ONCE at module scope by `layoutJson(value, opts)`:
// every token gets a stage-coordinate box and a JSON path ('pubkey',
// 'tags[0][1]', …). Scenes then use `layout.anchor(path)` to fly a value OUT
// of the document (TokenFlight), grow it into another visualization, and fly
// it back — the enabling API for "JSON ↔ picture" storytelling.
//
// Render is pure: `reveal` staggers lines in, `focus` spotlights paths while
// everything else drops to a whisper, `hidden` blanks the exact value tokens
// that are currently mid-flight (a dashed slot is drawn in their place).
import { colors } from '../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

export type JsonTokenKind = 'key' | 'string' | 'number' | 'literal' | 'punct';

export interface JsonToken {
  text: string;
  kind: JsonTokenKind;
  /** JSON path of the value this token belongs to ('' = the root). */
  path: string;
  col: number;
}

export interface JsonLine {
  tokens: JsonToken[];
  /** stage y of the line's text baseline */
  y: number;
}

export interface JsonAnchor {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

export interface JsonLayout {
  lines: JsonLine[];
  x: number;
  fontSize: number;
  charW: number;
  lineH: number;
  width: number;
  height: number;
  /** Stage box of the VALUE at `path` (or the bbox of a whole subtree). */
  anchor(path: string): JsonAnchor;
}

export interface JsonLayoutOpts {
  x?: number;
  y?: number;
  fontSize?: number;
  /** line height in px (default 1.55 × fontSize) */
  lineH?: number;
  /** spaces per indent level */
  indent?: number;
  /** display transform for long values (abbreviating hex, truncating prose) */
  abbrev?: (path: string, raw: string) => string;
  /** inline an array when all items are primitives and it fits (default 46 chars) */
  inlineArrayMax?: number;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// Rough advance width of common monospace stacks at 1px font-size.
const CHAR_W = 0.602;

const isPrimitive = (v: JsonValue): v is string | number | boolean | null =>
  v === null || typeof v !== 'object';

export function layoutJson(value: JsonValue, opts: JsonLayoutOpts = {}): JsonLayout {
  const x0 = opts.x ?? 100;
  const y0 = opts.y ?? 140;
  const fontSize = opts.fontSize ?? 15;
  const lineH = opts.lineH ?? fontSize * 1.55;
  const indent = opts.indent ?? 2;
  const inlineMax = opts.inlineArrayMax ?? 46;
  const abbrev = opts.abbrev ?? ((_p: string, raw: string) => raw);

  const lines: JsonLine[] = [];
  let cur: JsonToken[] = [];
  let col = 0;

  const push = (text: string, kind: JsonTokenKind, path: string) => {
    cur.push({ text, kind, path, col });
    col += text.length;
  };
  const newline = (level: number) => {
    lines.push({ tokens: cur, y: y0 + lines.length * lineH + fontSize });
    cur = [];
    col = level * indent;
  };

  const prim = (v: string | number | boolean | null, path: string) => {
    if (typeof v === 'string') push(`"${abbrev(path, v)}"`, 'string', path);
    else if (typeof v === 'number') push(String(v), 'number', path);
    else push(String(v), 'literal', path);
  };

  const inlineLen = (arr: JsonValue[], path: string): number =>
    arr.reduce<number>((n, item, i) => {
      const p = `${path}[${i}]`;
      const s = isPrimitive(item)
        ? typeof item === 'string'
          ? abbrev(p, item).length + 2
          : String(item).length
        : Infinity;
      return n + s + 2;
    }, 2);

  const emit = (v: JsonValue, path: string, level: number, trailing: string) => {
    if (isPrimitive(v)) {
      prim(v, path);
      if (trailing) push(trailing, 'punct', path);
      return;
    }
    if (Array.isArray(v)) {
      const canInline = v.every(isPrimitive) && inlineLen(v, path) <= inlineMax;
      if (canInline) {
        push('[', 'punct', path);
        v.forEach((item, i) => {
          prim(item as string | number | boolean | null, `${path}[${i}]`);
          if (i < v.length - 1) push(', ', 'punct', path);
        });
        push(`]${trailing}`, 'punct', path);
        return;
      }
      push('[', 'punct', path);
      newline(level + 1);
      v.forEach((item, i) => {
        emit(item, `${path}[${i}]`, level + 1, i < v.length - 1 ? ',' : '');
        newline(i < v.length - 1 ? level + 1 : level);
      });
      push(`]${trailing}`, 'punct', path);
      return;
    }
    const entries = Object.entries(v);
    push('{', 'punct', path);
    newline(level + 1);
    entries.forEach(([k, item], i) => {
      const p = path ? `${path}.${k}` : k;
      push(`"${k}"`, 'key', p);
      push(': ', 'punct', p);
      emit(item, p, level + 1, i < entries.length - 1 ? ',' : '');
      newline(i < entries.length - 1 ? level + 1 : level);
    });
    push(`}${trailing}`, 'punct', path);
  };

  emit(value, '', 0, '');
  lines.push({ tokens: cur, y: y0 + lines.length * lineH + fontSize });

  const charW = fontSize * CHAR_W;
  const width = Math.max(...lines.map((l) => l.tokens.reduce((m, t) => Math.max(m, t.col + t.text.length), 0))) * charW;
  const height = lines.length * lineH;

  const tokenBox = (line: JsonLine, t: JsonToken): JsonAnchor => {
    const x = x0 + t.col * charW;
    const w = t.text.length * charW;
    const y = line.y - fontSize;
    return { x, y, w, h: lineH, cx: x + w / 2, cy: y + lineH / 2 };
  };

  const anchor = (path: string): JsonAnchor => {
    // exact value tokens first; else the bbox of the whole subtree
    const exact: JsonAnchor[] = [];
    const subtree: JsonAnchor[] = [];
    for (const line of lines) {
      for (const t of line.tokens) {
        if (t.path === path && t.kind !== 'key' && t.kind !== 'punct') exact.push(tokenBox(line, t));
        if (t.path === path || t.path.startsWith(`${path}[`) || t.path.startsWith(`${path}.`))
          subtree.push(tokenBox(line, t));
      }
    }
    const boxes = exact.length ? exact : subtree;
    if (!boxes.length) return { x: x0, y: y0, w: 0, h: 0, cx: x0, cy: y0 };
    const x = Math.min(...boxes.map((b) => b.x));
    const y = Math.min(...boxes.map((b) => b.y));
    const x2 = Math.max(...boxes.map((b) => b.x + b.w));
    const y2 = Math.max(...boxes.map((b) => b.y + b.h));
    return { x, y, w: x2 - x, h: y2 - y, cx: (x + x2) / 2, cy: (y + y2) / 2 };
  };

  return { lines, x: x0, fontSize, charW, lineH, width, height, anchor };
}

export const JSON_TOKEN_COLOR: Record<JsonTokenKind, string> = {
  key: colors.ACCENT,
  string: colors.POSITIVE,
  number: colors.WARM,
  literal: colors.SECONDARY,
  punct: colors.MUTED,
};

const onPath = (tokenPath: string, path: string) =>
  tokenPath === path || tokenPath.startsWith(`${path}[`) || tokenPath.startsWith(`${path}.`);

export interface JsonDocProps {
  layout: JsonLayout;
  /** 0..1 staggers lines in from the top */
  reveal?: number;
  /** paths to spotlight; everything else drops to `dim` */
  focus?: string[];
  /** opacity of non-focused tokens while `focus` is active (default 0.22) */
  dim?: number;
  /** 0..1 blend into the focused state, so a spotlight can fade in/out */
  focusU?: number;
  /** exact-value paths currently flown out — their tokens blank to a dashed slot */
  hidden?: string[];
  opacity?: number;
}

export function JsonDoc({
  layout,
  reveal = 1,
  focus,
  dim = 0.22,
  focusU = 1,
  hidden,
  opacity = 1,
}: JsonDocProps) {
  if (opacity <= 0 || reveal <= 0) return null;
  const n = layout.lines.length;
  return (
    <g opacity={opacity}>
      {layout.lines.map((line, i) => {
        const lu = clamp01(reveal * n * 1.15 - i);
        if (lu <= 0) return null;
        return (
          <g key={i} opacity={lu} transform={`translate(0, ${(1 - lu) * -6})`}>
            {line.tokens.map((t, j) => {
              const focused = !focus || focus.some((f) => onPath(t.path, f));
              const isHidden =
                hidden?.some((h) => t.path === h && t.kind !== 'key' && t.kind !== 'punct') ?? false;
              const op = focused ? 1 : 1 - (1 - dim) * clamp01(focusU);
              const x = layout.x + t.col * layout.charW;
              if (isHidden) {
                return (
                  <rect
                    key={j}
                    x={x}
                    y={line.y - layout.fontSize + 2}
                    width={t.text.length * layout.charW}
                    height={layout.fontSize + 4}
                    rx={4}
                    fill="none"
                    stroke={colors.MUTED}
                    strokeDasharray="4 4"
                    opacity={0.5 * op}
                  />
                );
              }
              return (
                <text
                  key={j}
                  x={x}
                  y={line.y}
                  fill={JSON_TOKEN_COLOR[t.kind]}
                  fontSize={layout.fontSize}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  opacity={op}
                >
                  {t.text}
                </text>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
