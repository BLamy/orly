import { interpolateRgb } from 'd3';
import { MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { Vec } from '../../primitives';
import type { Op } from './scene';
import { CHIP, FINALE, FPP, GHOST, GHOSTS, M, STRIP, VERDICT, bitX, buildScene } from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** meter fill drifts sky → amber as the filter gets crowded */
const meterColor = (f: number) => interpolateRgb(colors.ACCENT, colors.WARM)(clamp01((f - 0.3) / 0.35));

/** A word chip: rounded rect sliding down from the top as u goes 0→1. */
function Chip({ x, text, color, u }: { x: number; text: string; color: string; u: number }) {
  if (u <= 0.002) return null;
  const y = CHIP.y - 26 * (1 - Math.min(1, u));
  return (
    <g opacity={clamp01(u)}>
      <rect x={x - CHIP.w / 2} y={y - CHIP.h / 2} width={CHIP.w} height={CHIP.h} rx={12} fill={colors.PANEL} stroke={color} strokeWidth={2} />
      <text x={x} y={y + 7} textAnchor="middle" fill={color} fontSize={22} fontWeight={600}>
        {text}
      </text>
    </g>
  );
}

/** One insert/query: chip, k hash arrows, result rings, verdict chip. */
function OpView({
  op,
  s,
  hashLabels,
  skipRing,
}: {
  op: Op;
  s: SceneState;
  /** h₁ h₂ h₃ labels (first insert only) */
  hashLabels?: string[];
  /** bit whose ring is handled specially (fox's dark bit 11) */
  skipRing?: number;
}) {
  const chipU = s.get(op.chip);
  if (chipU <= 0.002) return null;
  const chipY = CHIP.y - 26 * (1 - Math.min(1, chipU));
  const fade = clamp01(chipU);
  const glowU = op.glow ? clamp01(s.get(op.glow)) * fade : 0;
  const verdictV = op.verdict ? s.get(op.verdict) : 0;

  return (
    <g>
      {op.spec.bits.map((b, i) => (
        <Vec
          key={b}
          x1={op.spec.x}
          y1={chipY + CHIP.h / 2 + 4}
          x2={bitX(b)}
          y2={STRIP.y - 8}
          grow={s.get(op.arrows[i])}
          color={op.spec.color}
          width={2.5}
          head={9}
          label={hashLabels?.[i]}
          labelAt="mid"
          labelSize={16}
          opacity={0.9 * fade}
        />
      ))}
      {glowU > 0 &&
        op.spec.bits.map((b) =>
          b === skipRing ? null : (
            <rect
              key={`ring${b}`}
              x={bitX(b) - STRIP.cell / 2 - 5}
              y={STRIP.y - 5}
              width={STRIP.cell + 10}
              height={STRIP.cell + 10}
              rx={9}
              fill="none"
              stroke={colors.POSITIVE}
              strokeWidth={3}
              opacity={glowU}
            />
          ),
        )}
      <Chip x={op.spec.x} text={op.spec.label} color={op.spec.color} u={chipU} />
      {verdictV > 0.002 && op.spec.verdictText && (
        <g
          opacity={clamp01(verdictV) * fade}
          transform={`translate(${op.spec.x + VERDICT.dx + VERDICT.w / 2}, ${CHIP.y}) scale(${0.85 + 0.15 * verdictV})`}
        >
          <rect x={-VERDICT.w / 2} y={-VERDICT.h / 2} width={VERDICT.w} height={VERDICT.h} rx={10} fill={colors.PANEL} stroke={op.spec.verdictColor} strokeWidth={2} />
          <text textAnchor="middle" y={6} fill={op.spec.verdictColor} fontSize={19} fontWeight={600}>
            {op.spec.verdictText}
          </text>
        </g>
      )}
    </g>
  );
}

/** Pure render: SceneState in, SVG out. */
function renderFrame(s: SceneState) {
  const stripU = s.get(scene.stripU);
  const flash9 = clamp01(s.get(scene.flash9));
  const missEff = clamp01(s.get(scene.foxMiss)) * clamp01(s.get(scene.qfox.chip));

  // finale readouts — all precomputed in FPP, just indexed here
  const mathU = clamp01(s.get(scene.mathU));
  const meterU = clamp01(s.get(scene.meterU));
  const fillV = clamp01(s.get(scene.fillU));
  const row = FPP[Math.min(FPP.length - 1, Math.max(0, Math.round(s.get(scene.nIdx))))];

  return (
    <g>
      {/* ── the bit strip: 24 cells, staggered entrance from one channel ── */}
      {Array.from({ length: M }, (_, i) => {
        const u = clamp01((stripU * (M + 3) - i) / 3);
        if (u <= 0) return null;
        const v = s.get(scene.bits[i]); // may overshoot 1 (pop ease) — used for scale
        const vc = clamp01(v);
        let fill = colors.heat(vc);
        if (i === 9 && flash9 > 0) fill = interpolateRgb(fill, colors.WARM)(0.85 * flash9);
        const scale = (0.6 + 0.4 * u) * (1 + Math.max(0, v - 1) * 1.8) * (i === 11 ? 1 + 0.12 * missEff : 1);
        const cx = bitX(i);
        const cy = STRIP.y + STRIP.cell / 2;
        const digitFill = i === 11 && missEff > 0.05 ? colors.NEGATIVE : vc > 0.55 ? '#08101f' : colors.MUTED;
        return (
          <g key={i} opacity={u} transform={`translate(${cx}, ${cy}) scale(${scale})`}>
            <rect x={-STRIP.cell / 2} y={-STRIP.cell / 2} width={STRIP.cell} height={STRIP.cell} rx={8} fill={fill} stroke={colors.GRID} strokeWidth={1} />
            <text y={7} textAnchor="middle" fill={digitFill} fontSize={20} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
              {vc > 0.5 ? '1' : '0'}
            </text>
          </g>
        );
      })}
      {Array.from({ length: M }, (_, i) => {
        const u = clamp01((stripU * (M + 3) - i) / 3);
        if (u <= 0) return null;
        return (
          <text key={`ix${i}`} x={bitX(i)} y={STRIP.y + STRIP.cell + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11} opacity={0.85 * u}>
            {i}
          </text>
        );
      })}

      {/* bit 9's "already set!" blink (dog colliding with cat) */}
      {flash9 > 0.002 && (
        <rect x={bitX(9) - STRIP.cell / 2 - 5} y={STRIP.y - 5} width={STRIP.cell + 10} height={STRIP.cell + 10} rx={9} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={0.9 * flash9} />
      )}

      {/* ── the six operations ── */}
      <OpView op={scene.cat} s={s} hashLabels={['h₁', 'h₂', 'h₃']} />
      <OpView op={scene.dog} s={s} />
      <OpView op={scene.fish} s={s} />
      <OpView op={scene.qcat} s={s} />
      <OpView op={scene.qfox} s={s} skipRing={11} />
      <OpView op={scene.qcow} s={s} />

      {/* fox's dark bit 11 — one 0 is proof of absence */}
      {missEff > 0.002 && (
        <g opacity={missEff}>
          <rect x={bitX(11) - STRIP.cell / 2 - 10} y={STRIP.y - 10} width={STRIP.cell + 20} height={STRIP.cell + 20} rx={12} fill="none" stroke={colors.NEGATIVE} strokeWidth={10} opacity={0.22} />
          <rect x={bitX(11) - STRIP.cell / 2 - 6} y={STRIP.y - 6} width={STRIP.cell + 12} height={STRIP.cell + 12} rx={10} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
          <text x={bitX(11)} y={STRIP.y - 18} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={600}>
            still 0
          </text>
        </g>
      )}

      {/* beat 6 ghosts: who actually lit each of cow's bits */}
      {GHOSTS.map((g, gi) => {
        const gu = clamp01(s.get(scene.ghosts[gi]));
        if (gu <= 0.002) return null;
        const x = bitX(g.bit);
        return (
          <g key={g.word} opacity={gu}>
            <line x1={x} y1={STRIP.y + STRIP.cell + 28} x2={x} y2={GHOST.y - GHOST.h / 2} stroke={g.color} strokeWidth={1.5} opacity={0.8} />
            <rect x={x - GHOST.w / 2} y={GHOST.y - GHOST.h / 2} width={GHOST.w} height={GHOST.h} rx={8} fill={colors.PANEL} stroke={g.color} strokeWidth={1.5} />
            <text x={x} y={GHOST.y + 5} textAnchor="middle" fill={g.color} fontSize={15}>
              {g.word}
            </text>
          </g>
        );
      })}

      {/* ── finale: the fill-rate meter and the false-positive formula ── */}
      {mathU > 0.002 && (
        <MathLabel
          tex={`\\left(1-e^{-kn/m}\\right)^{k}\\;=\\;\\left(1-e^{-3\\cdot ${row.n}/24}\\right)^{3}\\;\\approx\\;${(row.p * 100).toFixed(1)}\\%`}
          x={640}
          y={FINALE.mathY}
          fontSize={26}
          opacity={mathU}
        />
      )}
      {meterU > 0.002 && (
        <g opacity={meterU}>
          <text x={FINALE.meterX - 14} y={FINALE.meterY + FINALE.meterH / 2 + 5} textAnchor="end" fill={colors.MUTED} fontSize={14}>
            n = {row.n} words inserted
          </text>
          <rect x={FINALE.meterX} y={FINALE.meterY} width={FINALE.meterW * meterU} height={FINALE.meterH} rx={7} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1} />
          <rect x={FINALE.meterX} y={FINALE.meterY} width={FINALE.meterW * meterU * fillV} height={FINALE.meterH} rx={7} fill={meterColor(fillV)} />
          <text x={FINALE.meterX + FINALE.meterW + 14} y={FINALE.meterY + FINALE.meterH / 2 + 5} textAnchor="start" fill={colors.TEXT} fontSize={14}>
            {Math.round(fillV * 100)}% of bits lit
          </text>
        </g>
      )}
    </g>
  );
}

export function BloomFilter() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/bloom-filter/overrides.json', slug: 'bloom-filter' }}>
        {renderFrame}
      </Player>
    </div>
  );
}
