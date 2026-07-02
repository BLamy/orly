import { colors } from '../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export interface GauntletGate {
  label: string;
  /**
   * gate state, sampled from a channel: 0 = pending, →1 = passed (green
   * check), →−1 = failed (red flash). Tween it back toward 0 to cool off.
   */
  state: number;
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * The gauntlet as gates on a rail: lint → agent sessions → replay
 * verification → PR → full suite → AI review → merge. A work-token travels
 * gate to gate (`u`, in gate units); ANY failure sends it back to the START
 * along the return arc (`arcU` + `arcFrom`) — with the failure report as
 * context. `deposit` pops a "+1 spec" chip at a gate: every critic promotion
 * makes the suite stricter, so each lap is harder to fool.
 */
export function GauntletRail({
  x,
  y,
  w,
  gates,
  u = -1,
  reveal = 1,
  arcU = 0,
  arcFrom = 0,
  deposit,
  tokenColor = colors.ACCENT,
  dim = 0,
}: {
  /** rail left end, stage coordinates (rail is horizontal at y) */
  x: number;
  y: number;
  w: number;
  gates: GauntletGate[];
  /** token position in gate units (0 = first gate); hidden while < 0 or riding the arc */
  u?: number;
  /** 0..1 draws the rail, then staggers gates in */
  reveal?: number;
  /** 0..1 return-arc ride from `arcFrom` back to gate 0 */
  arcU?: number;
  /** index of the gate that bounced the token */
  arcFrom?: number;
  /** "+1 spec" chip: pops above gate `gate` as `u` rises */
  deposit?: { gate: number; label: string; u: number };
  tokenColor?: string;
  dim?: number;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const alpha = 1 - 0.6 * clamp01(dim);
  const n = gates.length;
  const gx = (i: number) => x + (w / (n - 1)) * i;
  const aU = clamp01(arcU);
  const onArc = aU > 0 && aU < 1;
  const arcTop = y - 84;

  // return-arc quadratic: failing gate → start
  const ax0 = gx(arcFrom);
  const ax1 = gx(0);
  const axm = (ax0 + ax1) / 2;
  const q = 1 - aU;
  const arcX = q * q * ax0 + 2 * q * aU * axm + aU * aU * ax1;
  const arcY = q * q * y + 2 * q * aU * arcTop + aU * aU * y;

  return (
    <g opacity={alpha}>
      {/* the rail */}
      <line x1={x} y1={y} x2={x + w * rv} y2={y} stroke={colors.GRID} strokeWidth={2} strokeLinecap="round" />
      {/* return arc — visible while a bounce is in flight */}
      {onArc && (
        <path
          d={`M ${ax0} ${y} Q ${axm} ${arcTop} ${ax1} ${y}`}
          fill="none"
          stroke={colors.NEGATIVE}
          strokeWidth={1.5}
          strokeDasharray="3 7"
          opacity={0.55}
        />
      )}
      {/* gates */}
      {gates.map((gate, i) => {
        const su = clamp01(rv * (n + 2) - (i + 2));
        if (su <= 0) return null;
        const st = gate.state;
        const pass = clamp01(st);
        const fail = clamp01(-st);
        const color = fail > 0.01 ? colors.NEGATIVE : pass > 0.01 ? colors.POSITIVE : colors.MUTED;
        const cxi = gx(i);
        return (
          <g key={i} opacity={su}>
            {fail > 0.01 && <circle cx={cxi} cy={y} r={17} fill={colors.NEGATIVE} opacity={0.3 * fail} />}
            {pass > 0.01 && <circle cx={cxi} cy={y} r={15} fill={colors.POSITIVE} opacity={0.18 * pass} />}
            <circle cx={cxi} cy={y} r={9} fill={colors.BG} stroke={color} strokeWidth={2} />
            {pass > 0.01 && (
              <path
                d={`M ${cxi - 4} ${y} l 3 3.5 l 5.5 -7`}
                fill="none"
                stroke={colors.POSITIVE}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={pass}
              />
            )}
            {fail > 0.01 && (
              <g stroke={colors.NEGATIVE} strokeWidth={2.2} strokeLinecap="round" opacity={fail}>
                <line x1={cxi - 3.5} y1={y - 3.5} x2={cxi + 3.5} y2={y + 3.5} />
                <line x1={cxi + 3.5} y1={y - 3.5} x2={cxi - 3.5} y2={y + 3.5} />
              </g>
            )}
            <text
              x={cxi}
              y={y + (i % 2 === 0 ? 28 : 46)}
              textAnchor="middle"
              fill={fail > 0.3 ? colors.NEGATIVE : pass > 0.3 ? colors.TEXT : colors.MUTED}
              fontSize={12}
              fontWeight={pass > 0.3 || fail > 0.3 ? 700 : 400}
              fontFamily={mono}
            >
              {gate.label}
            </text>
            {i % 2 === 1 && <line x1={cxi} y1={y + 12} x2={cxi} y2={y + 33} stroke={colors.GRID} strokeWidth={1} />}
          </g>
        );
      })}
      {/* deposit chip — the suite just got stricter */}
      {deposit !== undefined && clamp01(deposit.u) > 0 && (
        <g
          transform={`translate(${gx(deposit.gate)}, ${y - 34 - 8 * clamp01(deposit.u)}) scale(${0.8 + 0.2 * clamp01(deposit.u)})`}
          opacity={clamp01(deposit.u)}
        >
          <line x1={0} y1={12} x2={0} y2={24} stroke={colors.POSITIVE} strokeWidth={1.5} strokeDasharray="2 3" />
          <rect x={-(deposit.label.length * 6.8 + 18) / 2} y={-12} width={deposit.label.length * 6.8 + 18} height={24} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.6} />
          <text y={4.5} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontWeight={700} fontFamily={mono}>
            {deposit.label}
          </text>
        </g>
      )}
      {/* the work-token: on the rail, or riding the return arc */}
      {onArc ? (
        <g>
          <circle cx={arcX} cy={arcY} r={7} fill={colors.NEGATIVE} />
          <circle cx={arcX} cy={arcY} r={11} fill={colors.NEGATIVE} opacity={0.25} />
        </g>
      ) : (
        u >= 0 &&
        rv >= 0.999 && (
          <g>
            {[0.24, 0.16, 0.08, 0].map((back, i) => {
              const p = Math.max(0, Math.min(n - 1, u - back));
              const main = back === 0;
              return (
                <circle
                  key={i}
                  cx={gx(p)}
                  cy={y}
                  r={main ? 7 : 5 - i}
                  fill={tokenColor}
                  opacity={main ? 1 : 0.14 + i * 0.1}
                />
              );
            })}
          </g>
        )
      )}
    </g>
  );
}
