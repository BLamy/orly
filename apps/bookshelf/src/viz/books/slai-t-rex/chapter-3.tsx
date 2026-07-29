// Training T-Rex — chapter 3: A Dataset That Rejects Itself.
//
// Grounded in sft_data_construction/src/or_data_distill/pipeline.py,
// sft_data_construction/README.md, and seeds/public_seed.jsonl. The runnable
// pipeline normalizes an OR intermediate representation, renders problem and
// answer messages, calls validate_sft_record, applies problem-token Jaccard
// similarity, writes accepted/rejected/surplus files, and returns accepted
// synthetic IRs to the parent pool.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const AXES = ['mode', 'domain', 'structure', 'difficulty', 'data interface', 'answer style'];
const CANDIDATES = [
  { x: 420, y: 318, good: true },
  { x: 500, y: 270, good: false },
  { x: 575, y: 350, good: true },
  { x: 652, y: 286, good: false },
  { x: 730, y: 340, good: true },
];

function crystalPath(cx: number, cy: number, r: number, u: number): string {
  return AXES.map((_, i) => {
    const a = -Math.PI / 2 + (i / AXES.length) * Math.PI * 2;
    const rr = r * (0.45 + 0.55 * clamp01(u + (i % 2) * 0.12));
    return `${i ? 'L' : 'M'} ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
  }).join(' ') + ' Z';
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const seedU = tl.channel('seedU', 0);
  const irU = tl.channel('irU', 0);
  const synthU = tl.channel('synthU', 0);
  const renderU = tl.channel('renderU', 0);
  const qualityU = tl.channel('qualityU', 0);
  const similarityU = tl.channel('similarityU', 0);
  const routesU = tl.channel('routesU', 0);
  const poolU = tl.channel('poolU', 0);
  const countU = tl.channel('countU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.7, text: 'The public seed set begins with real optimization problems. One asks how to blend three funds while respecting sector ranges.' });
  tl.tween(seedU, 1, { at: 0.9, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 410, y: 330, k: 1.18 }, { at: 1.1, dur: 1.4, ease: ease.move });
  tl.hold(6.2, 0.5);

  tl.caption({ at: 6.7, dur: 5.6, text: 'The distiller factors that example into six explicit dimensions: mode, domain, structure, difficulty, data interface, and answer style.' });
  tl.tween(irU, 1, { at: 7.3, dur: 1.5, ease: ease.draw });
  tl.hold(12.3, 0.5);

  tl.caption({ at: 12.8, dur: 5.2, text: 'That intermediate representation is the crystal. Controlled generation perturbs its structure into candidate modeling tasks.' });
  tl.tween(synthU, 1, { at: 13.4, dur: 2.2, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 330, k: 1.08 }, { at: 13.7, dur: 1.4, ease: ease.move });
  tl.hold(18.0, 0.5);

  tl.caption({ at: 18.5, dur: 5.5, text: 'Each candidate renders into exactly two messages: a user problem and an assistant modeling answer.' });
  tl.tween(renderU, 1, { at: 19.1, dur: 1.4, ease: ease.move });
  tl.hold(24.0, 0.5);

  tl.caption({ at: 24.5, dur: 5.5, text: 'The first gate checks the intermediate representation and the final supervised record. Broken contracts leave through the red exit.' });
  tl.tween(qualityU, 1, { at: 25.1, dur: 2.0, ease: ease.linear });
  tl.hold(30.0, 0.5);

  tl.caption({ at: 30.5, dur: 5.4, text: 'Survivors face a second gate: token-set Jaccard similarity. A near-duplicate is rejected even when its schema is perfect.' });
  tl.tween(similarityU, 1, { at: 31.1, dur: 1.8, ease: ease.move });
  tl.hold(35.9, 0.5);

  tl.caption({ at: 36.4, dur: 5.3, text: 'The pipeline keeps three ledgers: accepted examples, rejected attempts, and valid surplus beyond the requested quota.' });
  tl.tween(routesU, 1, { at: 37.0, dur: 1.8, ease: ease.draw });
  tl.hold(41.7, 0.5);

  tl.caption({ at: 42.2, dur: 5.4, text: 'Accepted synthetic structures rejoin the parent pool. The next round can explore farther without forgetting the original seeds.' });
  tl.tween(poolU, 1, { at: 42.8, dur: 2.0, ease: ease.move });
  tl.hold(47.6, 0.5);

  tl.caption({ at: 48.1, dur: 5.0, text: 'Progress counts accepted examples, not raw attempts. The manifest records every accepted, rejected, and surplus row.' });
  tl.tween(countU, 1, { at: 48.7, dur: 1.0, ease: ease.enter });
  tl.hold(53.1, 0.5);

  tl.caption({ at: 53.6, dur: 6.2, text: 'This is a flywheel with brakes. It expands the modeling space only through examples that survive both quality and similarity gates.' });
  tl.tween(cam, CAMERA_HOME, { at: 54.0, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 54.4, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 55.3, dur: 0.8, ease: ease.enter });
  tl.hold(59.8, 1.0);

  return { tl, cam, seedU, irU, synthU, renderU, qualityU, similarityU, routesU, poolU, countU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const seedU = s.get(scene.seedU);
  const irU = s.get(scene.irU);
  const synthU = s.get(scene.synthU);
  const qualityU = s.get(scene.qualityU);
  const similarityU = s.get(scene.similarityU);
  const routesU = s.get(scene.routesU);
  const poolU = s.get(scene.poolU);
  const mainOpacity = 1 - 0.86 * s.get(scene.dimU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={70} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={700}>The self-filtering SFT flywheel</text>
          <text x={640} y={96} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>or_data_distill.pipeline</text>

          {seedU > 0 && (
            <g opacity={seedU}>
              <rect x={95} y={180} width={260} height={230} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={225} y={214} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontWeight={700}>public_seed_00e524…</text>
              <text x={118} y={249} fill={colors.TEXT} fontSize={12}>portfolio weights sum to one</text>
              <text x={118} y={276} fill={colors.TEXT} fontSize={12}>sector minimums and maximums</text>
              <text x={118} y={303} fill={colors.TEXT} fontSize={12}>minimize total cost</text>
              <text x={118} y={341} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>EquityFund · BondFund</text>
              <text x={118} y={361} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>MoneyMarket</text>
              <path d={`M 355 294 C 390 294 405 294 ${430 * irU} 294`} stroke={colors.GRID} strokeWidth={2} fill="none" />
            </g>
          )}

          {irU > 0 && (
            <g opacity={irU}>
              <path d={crystalPath(475, 294, 92, irU)} fill={colors.SECONDARY} fillOpacity={0.15} stroke={colors.SECONDARY} strokeWidth={2} />
              {AXES.map((label, i) => {
                const a = -Math.PI / 2 + (i / AXES.length) * Math.PI * 2;
                return (
                  <g key={label}>
                    <line x1={475} y1={294} x2={475 + Math.cos(a) * 92 * irU} y2={294 + Math.sin(a) * 92 * irU} stroke={colors.GRID} />
                    <text x={475 + Math.cos(a) * 122} y={299 + Math.sin(a) * 112} textAnchor="middle" fill={colors.MUTED} fontSize={9}>{label}</text>
                  </g>
                );
              })}
              <text x={475} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily={MONO}>IR</text>
            </g>
          )}

          {CANDIDATES.map((c, i) => {
            const u = clamp01(synthU * 6 - i);
            if (u <= 0) return null;
            const x = c.x + 235;
            return (
              <g key={i} opacity={u}>
                <path d={crystalPath(x, c.y, 38, 0.55 + i * 0.08)} fill={c.good ? colors.ACCENT : colors.WARM} fillOpacity={0.12} stroke={c.good ? colors.ACCENT : colors.WARM} />
                {s.get(scene.renderU) > 0 && (
                  <g opacity={s.get(scene.renderU)}>
                    <rect x={x - 42} y={405 + (i % 2) * 42} width={84} height={27} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
                    <text x={x} y={423 + (i % 2) * 42} textAnchor="middle" fill={colors.TEXT} fontSize={8.5}>user → assistant</text>
                  </g>
                )}
              </g>
            );
          })}

          {qualityU > 0 && (
            <g opacity={qualityU}>
              <rect x={612} y={145} width={390} height={43} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} />
              <text x={807} y={172} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>validate_ir → validate_sft_record</text>
              <path d="M 710 190 L 710 480" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="7 6" />
              <text x={688} y={505} textAnchor="end" fill={colors.NEGATIVE} fontSize={11}>rejected.jsonl</text>
            </g>
          )}

          {similarityU > 0 && (
            <g opacity={similarityU}>
              <rect x={850} y={205} width={245} height={72} rx={12} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={972} y={233} textAnchor="middle" fill={colors.WARM} fontSize={12} fontWeight={700}>similarity gate</text>
              <text x={972} y={257} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>|tokens ∩ tokens| / |tokens ∪ tokens|</text>
            </g>
          )}

          {routesU > 0 && (
            <g opacity={routesU}>
              {[
                { x: 705, c: colors.POSITIVE, label: 'sft.jsonl' },
                { x: 880, c: colors.NEGATIVE, label: 'rejected.jsonl' },
                { x: 1055, c: colors.WARM, label: 'surplus_sft.jsonl' },
              ].map((r) => (
                <g key={r.label}>
                  <rect x={r.x - 75} y={520} width={150} height={46} rx={10} fill={r.c} fillOpacity={0.12} stroke={r.c} />
                  <text x={r.x} y={548} textAnchor="middle" fill={r.c} fontSize={10.5} fontFamily={MONO}>{r.label}</text>
                </g>
              ))}
            </g>
          )}

          {poolU > 0 && (
            <g opacity={poolU}>
              <path d={`M 705 520 C 570 ${610 - 120 * poolU} 505 ${520 - 200 * poolU} 480 360`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} strokeDasharray="6 6" />
              <text x={470} y={487} fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>accepted_synthetic_pool.jsonl ↺</text>
            </g>
          )}
          {s.get(scene.countU) > 0 && (
            <g opacity={s.get(scene.countU)}>
              <rect x={405} y={575} width={470} height={38} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={640} y={599} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>accepted_count / accepted_target_count · manifest.json</text>
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={235} y={244} width={810} height={180} rx={18} fill={colors.PANEL} stroke={colors.SECONDARY} />
          <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={700}>A flywheel with brakes</text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={16}>generate → render → validate → compare → accept</text>
          <text x={640} y={387} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>accepted · rejected · surplus · provenance</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
