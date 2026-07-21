import type { Meta, StoryObj } from '@storybook/react-vite';
import { MathLabel, Player, Timeline, colors, ease } from '../core';
import { EcCurve, ecPlot } from './ec-curve';

/**
 * EcCurve catalog: the secp256k1 shape y² = x³ + 7 over ℝ draws on, a chord
 * through P and Q reflects to P+Q (the group law), and a hop chain sketches
 * scalar multiplication d·G — the one-way street behind every nostr keypair.
 * (The real curve lives over a prime field; the smooth picture is the
 * standard pedagogical stand-in.)
 */
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const VIEW = { x: 240, y: 110, w: 800, h: 460 };
const P = ecPlot(VIEW);

// Group law geometry, computed for real on the ℝ curve: the line through
// P and Q meets the curve at a third point R; P+Q is R mirrored.
const PX = -1.8;
const QX = 2.4;
const PY = P.curveY(PX);
const QY = -P.curveY(QX);
const SLOPE = (QY - PY) / (QX - PX);
// x³ + 7 = (y₀ + m(x−x₀))² → x₁+x₂+x₃ = m²
const RX = SLOPE * SLOPE - PX - QX;
const RY = PY + SLOPE * (RX - PX);

// scalar-multiplication hop chain (illustrative x positions, real curve points)
const HOPS = [-1.7, -0.6, 1.1, 2.0, 2.7];

function buildDemo() {
  const tl = new Timeline();
  const curveU = tl.channel('curveU', 0);
  const ptsU = tl.channel('ptsU', 0);
  const chordU = tl.channel('chordU', 0);
  const sumU = tl.channel('sumU', 0);
  const hopU = tl.channel('hopU', 0);
  const texU = tl.channel('texU', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.8, text: 'The secp256k1 shape, y squared equals x cubed plus seven, drawn over the reals.' });
  tl.tween(curveU, 1, { at: 0.6, dur: 1.6, ease: ease.draw });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 5.0, text: 'The group law is geometry: a chord through P and Q meets the curve once more; mirror that point and you have P plus Q.' });
  tl.tween(ptsU, 1, { at: t - 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(chordU, 1, { at: t - 3.8, dur: 1.2, ease: ease.draw });
  tl.tween(sumU, 1, { at: t - 2.2, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 5.2, text: 'Repeat the move d times from the generator and you have scalar multiplication — easy forward, hopeless backward.' });
  tl.tween(hopU, 1, { at: t - 4.8, dur: 2.6, ease: ease.linear });
  tl.tween(texU, 1, { at: t - 1.6, dur: 0.6, ease: ease.enter });
  tl.hold(t, 1.2);

  return { tl, curveU, ptsU, chordU, sumU, hopU, texU };
}

const demo = buildDemo();

function Dot({ x, y, color, label, u }: { x: number; y: number; color: string; label: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <circle cx={x} cy={y} r={7} fill={color} />
      <text x={x + 14} y={y + 5} fill={color} fontSize={15} fontWeight={600}>{label}</text>
    </g>
  );
}

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => {
          const chordU = s.get(demo.chordU);
          const sumU = s.get(demo.sumU);
          const hopU = s.get(demo.hopU);
          const ex = (x: number) => P.sx(x);
          const chordFrom = { x: ex(PX), y: P.sy(PY) };
          const chordTo = { x: ex(QX), y: P.sy(QY) };
          return (
            <>
              <EcCurve view={VIEW} reveal={s.get(demo.curveU)} />
              {chordU > 0 && (
                <line
                  x1={chordFrom.x}
                  y1={chordFrom.y}
                  x2={chordFrom.x + (chordTo.x - chordFrom.x) * chordU}
                  y2={chordFrom.y + (chordTo.y - chordFrom.y) * chordU}
                  stroke={colors.WARM}
                  strokeWidth={1.6}
                  strokeDasharray="6 5"
                  opacity={0.8}
                />
              )}
              {sumU > 0 && (
                <line x1={ex(RX)} y1={P.sy(RY)} x2={ex(RX)} y2={P.sy(-RY)} stroke={colors.GRID} strokeWidth={1.2} strokeDasharray="3 4" opacity={sumU} />
              )}
              <Dot x={ex(PX)} y={P.sy(PY)} color={colors.ACCENT} label="P" u={s.get(demo.ptsU)} />
              <Dot x={ex(QX)} y={P.sy(QY)} color={colors.ACCENT} label="Q" u={s.get(demo.ptsU)} />
              <Dot x={ex(RX)} y={P.sy(-RY)} color={colors.POSITIVE} label="P+Q" u={sumU} />
              {HOPS.map((hx, i) => {
                const u = clamp01(hopU * HOPS.length - i);
                if (u <= 0 || i === 0) return null;
                const x0 = ex(HOPS[i - 1]);
                const y0 = P.sy(P.curveY(HOPS[i - 1]));
                const x1 = ex(hx);
                const y1 = P.sy(P.curveY(hx));
                const mx = (x0 + x1) / 2;
                const my = Math.min(y0, y1) - 46;
                return (
                  <path
                    key={i}
                    d={`M${x0},${y0} Q${mx},${my} ${x0 + (x1 - x0) * u},${y0 + (y1 - y0) * u}`}
                    fill="none"
                    stroke={colors.SECONDARY}
                    strokeWidth={1.8}
                    opacity={0.85}
                  />
                );
              })}
              <Dot x={ex(HOPS[0])} y={P.sy(P.curveY(HOPS[0]))} color={colors.SECONDARY} label="G" u={hopU > 0 ? 1 : 0} />
              <Dot
                x={ex(HOPS[HOPS.length - 1])}
                y={P.sy(P.curveY(HOPS[HOPS.length - 1]))}
                color={colors.WARM}
                label="d·G"
                u={clamp01(hopU * HOPS.length - (HOPS.length - 1))}
              />
              <MathLabel tex={'P = d \\cdot G'} x={1030} y={150} opacity={s.get(demo.texU)} />
            </>
          );
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/EcCurve',
  component: Demo,
};
export default meta;

export const GroupLaw: StoryObj<typeof Demo> = {};
