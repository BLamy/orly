import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  FLEX,
  FLEX_ITERS,
  NARROW,
  NARROW_ITERS,
  buildScene,
  dOf,
  dY,
  fakePdf,
  pdfY,
  realPdf,
  snapAt,
  trX,
  trY,
  xAxis,
} from './scene';
import type { GanSnap } from './scene';

/**
 * The GAN Game — forger versus detective.
 * Pure render: the fake density, the detective's verdict curve, and the
 * center trace all replay the two RECORDED adversarial runs in scene.ts
 * (flexible forger -> blurry compromise; narrow forger -> mode collapse).
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/gan/overrides.json', slug: 'gan' };

function curvePath(f: (x: number) => number, yScale: (v: number) => number, reveal = 1): string {
  const N = 120;
  const n = Math.max(2, Math.round(N * reveal));
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = -4.2 + (8.4 * i) / N;
    d += `${i === 0 ? 'M' : 'L'}${xAxis(x).toFixed(1)} ${yScale(f(x)).toFixed(1)}`;
  }
  return d;
}

function muTracePath(run: GanSnap[], upTo: number): string {
  const n = Math.max(1, Math.min(run.length - 1, Math.round(upTo)));
  let d = `M${trX(0).toFixed(1)} ${trY(run[0].mu).toFixed(1)}`;
  for (let i = 4; i <= n; i += 4) d += `L${trX(i).toFixed(1)} ${trY(run[i].mu).toFixed(1)}`;
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const realU = s.get(scene.realU);
  const fakeU = s.get(scene.fakeU);
  const dU = s.get(scene.dU);
  const runSel = s.get(scene.runSel);
  const prog = s.get(scene.prog);
  const traceU = s.get(scene.traceU);
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const narrow = runSel > 0.5;
  const run = narrow ? NARROW : FLEX;
  const iters = narrow ? NARROW_ITERS : FLEX_ITERS;
  const snap = snapAt(run, prog);
  const iterShown = Math.min(iters, Math.max(0, Math.round(prog)));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* shared x axis */}
          <line x1={xAxis(-4.2)} y1={pdfY(0)} x2={xAxis(4.2)} y2={pdfY(0)} stroke={colors.GRID} strokeWidth={1.5} opacity={realU} />
          {[-4, -2, 0, 2, 4].map((x) => (
            <text key={x} x={xAxis(x)} y={pdfY(0) + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={realU}>
              {x}
            </text>
          ))}

          {/* real density — the truth to be forged */}
          {realU > 0 && (
            <g>
              <path d={curvePath(realPdf, pdfY, realU)} fill="none" stroke={colors.ACCENT} strokeWidth={3} opacity={0.95} />
              <text x={xAxis(-2)} y={pdfY(realPdf(-2)) - 12} textAnchor="middle" fill={colors.ACCENT} fontSize={14} opacity={realU}>
                real
              </text>
            </g>
          )}

          {/* fake density — the forger, replayed */}
          {fakeU > 0 && (
            <g>
              <path d={curvePath((x) => fakePdf(x, snap), pdfY, fakeU)} fill="none" stroke={colors.WARM} strokeWidth={3} opacity={0.95} />
              <text x={xAxis(snap.mu)} y={pdfY(fakePdf(snap.mu, snap)) - 12} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                forger
              </text>
            </g>
          )}

          {/* the detective's verdict D(x) */}
          {dU > 0 && (
            <g opacity={dU}>
              <line x1={xAxis(-4.2)} y1={dY(0.5)} x2={xAxis(4.2)} y2={dY(0.5)} stroke={colors.GRID} strokeWidth={1} strokeDasharray="4 5" />
              <path d={curvePath((x) => dOf(x, snap), dY, dU)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.6} opacity={0.9} />
              <text x={xAxis(-4.1)} y={dY(1) - 8} fill={colors.NEGATIVE} fontSize={13}>
                detective’s verdict — 1 real, 0 fake
              </text>
            </g>
          )}

          {/* the forger-center trace (mode collapse chart) */}
          {traceU > 0 && (
            <g opacity={traceU}>
              <line x1={trX(0)} y1={trY(0)} x2={trX(NARROW_ITERS)} y2={trY(0)} stroke={colors.GRID} strokeWidth={1} />
              {[2, -2].map((m) => (
                <line key={m} x1={trX(0)} y1={trY(m)} x2={trX(NARROW_ITERS)} y2={trY(m)} stroke={colors.ACCENT} strokeWidth={1} strokeDasharray="4 5" opacity={0.6} />
              ))}
              <path d={muTracePath(NARROW, narrow ? prog : 0)} fill="none" stroke={colors.WARM} strokeWidth={2.4} />
              <text x={trX(NARROW_ITERS / 2)} y={trY(-3.4) + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                forger center over time
              </text>
              <text x={trX(NARROW_ITERS) + 4} y={trY(2) + 4} fill={colors.ACCENT} fontSize={12}>
                +2
              </text>
              <text x={trX(NARROW_ITERS) + 4} y={trY(-2) + 4} fill={colors.ACCENT} fontSize={12}>
                −2
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math + badge */}
      <MathLabel
        tex={'\\min_G \\max_D\\; \\mathbb{E}[\\log D(x)] + \\mathbb{E}[\\log(1-D(G(z)))]'}
        x={990}
        y={64}
        fontSize={18}
        opacity={s.get(scene.texU) * dimU}
      />
      {badgeU > 0 && (
        <g opacity={badgeU}>
          <rect x={48} y={584} width={300} height={38} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={609} fill={colors.TEXT} fontSize={15}>
            {`${narrow ? 'narrow forger' : 'flexible forger'} · round ${iterShown} / ${iters}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={220} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The GAN Game
          </text>
          <MathLabel
            tex={'\\text{no likelihood — a forger judged by a learned critic}'}
            x={640}
            y={345}
            fontSize={20}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            flexible forger → a blur across both modes · narrow forger → one mode, the other vanishes
          </text>
        </g>
      )}
    </>
  );
}

export function Gan() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export { Frame as Render };
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
