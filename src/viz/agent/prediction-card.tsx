import { colors } from '../core';
import { wrapMessage } from './message';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const FONT = 15;
const LINE_H = 20;
const PAD = 12;
const HEAD_H = 30;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/** Total height a PredictionCard occupies (observed line included when shown). */
export function predictionCardHeight(text: string, w: number, hasObserved = false): number {
  return HEAD_H + wrapMessage(text, w).length * LINE_H + PAD + (hasObserved ? 30 : 0);
}

/**
 * Predict-then-verify, as a card: the critic writes a falsifiable prediction
 * and timestamps it BEFORE inspecting any state — the "predicted @ t" chip
 * lands first, then the prediction streams in under it. Only afterwards does
 * an observed-value line appear, and a HELD/FAILED stamp pops. Findings cite
 * point links, so the optional link chip pins the claim to the recording.
 */
export function PredictionCard({
  x,
  y,
  w,
  text,
  stamp = 'predicted',
  stampU = 0,
  u = 1,
  observed,
  observedU = 0,
  verdict,
  verdictKind = 'held',
  verdictU = 0,
  link,
  linkU = 0,
  enter = 1,
  dim = 0,
}: {
  /** top-left, stage coordinates */
  x: number;
  y: number;
  w: number;
  /** the falsifiable prediction */
  text: string;
  /** the before-chip text (e.g. 'predicted @ 12.4s') */
  stamp?: string;
  /** 0..1 before-chip pop — tween this BEFORE `u` */
  stampU?: number;
  /** 0..1 prediction text reveal (streaming) */
  u?: number;
  /** observed-value line (e.g. 'observed: wire 99.00') */
  observed?: string;
  /** 0..1 observed line reveal */
  observedU?: number;
  /** verdict stamp text (defaults to HELD/FAILED via kind) */
  verdict?: string;
  verdictKind?: 'held' | 'failed';
  /** 0..1 verdict pop */
  verdictU?: number;
  /** point-link chip text (e.g. '⌖ 12.4s') */
  link?: string;
  /** 0..1 link chip reveal */
  linkU?: number;
  /** 0..1 card entrance */
  enter?: number;
  dim?: number;
}) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const alpha = e * (1 - 0.6 * clamp01(dim));
  const lines = wrapMessage(text, w);
  const hasObserved = observed !== undefined;
  const h = predictionCardHeight(text, w, hasObserved);
  const total = lines.reduce((n, l) => n + Math.max(1, l.length), 0);
  const shown = Math.round(clamp01(u) * total);
  const sU = clamp01(stampU);
  const oU = clamp01(observedU);
  const vU = clamp01(verdictU);
  const lU = clamp01(linkU);
  const vColor = verdictKind === 'held' ? colors.POSITIVE : colors.NEGATIVE;
  const vText = verdict ?? (verdictKind === 'held' ? 'HELD' : 'FAILED');
  const chipW = stamp.length * 6.8 + 16;

  let cum = 0;
  const rendered = lines.map((line, i) => {
    const take = Math.max(0, Math.min(Math.max(1, line.length), shown - cum));
    cum += Math.max(1, line.length);
    return (
      <text key={i} x={PAD} y={HEAD_H + (i + 0.72) * LINE_H} fill={colors.TEXT} fontSize={FONT} fontFamily={mono}>
        {line.slice(0, take)}
      </text>
    );
  });

  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={alpha}>
      <rect width={w} height={h} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} strokeOpacity={0.55} />
      <text x={PAD} y={21} fill={colors.SECONDARY} fontSize={12} fontWeight={700} letterSpacing={1} fontFamily={mono}>
        prediction
      </text>
      {/* the before-chip: timestamped BEFORE the state is inspected */}
      {sU > 0 && (
        <g transform={`translate(${w - chipW - PAD}, ${7 + (1 - sU) * -6}) scale(${0.85 + 0.15 * sU})`} opacity={sU}>
          <rect width={chipW} height={18} rx={9} fill={colors.SECONDARY} opacity={0.18} />
          <text x={chipW / 2} y={13} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontWeight={700} fontFamily={mono}>
            {stamp}
          </text>
        </g>
      )}
      {rendered}
      {/* observed line — only after the prediction is on record */}
      {hasObserved && oU > 0 && (
        <g transform={`translate(${PAD}, ${h - 24})`} opacity={oU}>
          <line x1={0} y1={-20} x2={w - PAD * 2} y2={-20} stroke={colors.GRID} strokeWidth={1} />
          <text y={0} fill={colors.MUTED} fontSize={13} fontFamily={mono}>
            {observed}
          </text>
        </g>
      )}
      {/* point-link chip */}
      {link !== undefined && lU > 0 && (
        <g transform={`translate(${w - PAD}, ${h - 28})`} opacity={lU}>
          <rect x={-(link.length * 6.8 + 16)} y={-6} width={link.length * 6.8 + 16} height={20} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
          <text x={-(link.length * 6.8 + 16) / 2} y={8} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={mono}>
            {link}
          </text>
        </g>
      )}
      {/* verdict stamp */}
      {vU > 0 && (
        <g transform={`translate(${w / 2}, ${h / 2}) rotate(-8) scale(${0.7 + 0.3 * vU})`} opacity={vU}>
          <rect x={-vText.length * 7.5 - 14} y={-19} width={vText.length * 15 + 28} height={38} rx={7} fill={colors.BG} opacity={0.5} />
          <rect x={-vText.length * 7.5 - 14} y={-19} width={vText.length * 15 + 28} height={38} rx={7} fill="none" stroke={vColor} strokeWidth={3} />
          <text y={7.5} textAnchor="middle" fill={vColor} fontSize={21} fontWeight={800} letterSpacing={2.5} fontFamily={mono}>
            {vText}
          </text>
        </g>
      )}
    </g>
  );
}
