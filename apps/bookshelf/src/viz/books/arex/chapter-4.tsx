// The Answer Audits Itself — chapter 4: Keep the State, Lose the Clutter.
//
// Grounded in AREX paper §2.2.1 and the official repository README's
// context-management description. The learned update_context tool preserves
// verified findings/source ids, candidates, unresolved constraints, validity
// concerns, rejected candidates, and a next-step plan while removing
// redundant observations, superseded conclusions, and obsolete plans.
// The public quickstart exposes a summary model for visited pages but does not
// ship this paper-level autonomous context-update tool.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const RAW = [
  ['query A', 'keep'], ['page 1', 'keep'], ['duplicate', 'drop'], ['candidate A', 'drop'],
  ['query B', 'drop'], ['page 2', 'keep'], ['conflict', 'keep'], ['old plan', 'drop'],
  ['candidate B', 'keep'], ['page 3', 'keep'], ['duplicate', 'drop'], ['rejection', 'keep'],
  ['query C', 'drop'], ['page 4', 'keep'], ['obsolete', 'drop'], ['constraint ?', 'keep'],
  ['page 5', 'keep'], ['next plan', 'keep'],
] as const;
const STATE = [
  { label: 'verified findings + source ids', color: colors.POSITIVE },
  { label: 'current candidates', color: colors.ACCENT },
  { label: 'unresolved constraints', color: colors.WARM },
  { label: 'validity concerns', color: colors.NEGATIVE },
  { label: 'rejected candidates', color: colors.SECONDARY },
  { label: 'next-step plan', color: colors.TEXT },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rawU = tl.channel('rawU', 0);
  const noiseU = tl.channel('noiseU', 0);
  const semanticU = tl.channel('semanticU', 0);
  const foldU = tl.channel('foldU', 0);
  const stateU = tl.channel('stateU', 0);
  const appendU = tl.channel('appendU', 0);
  const repeatU = tl.channel('repeatU', 0);
  const boundaryU = tl.channel('boundaryU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.6, text: 'A long research run accumulates evidence, failed queries, conflicts, duplicates, and plans that no longer matter.' });
  tl.tween(rawU, 1, { at: 0.9, dur: 2.3, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.08 }, { at: 1.1, dur: 1.4, ease: ease.move });
  tl.hold(6.0, 0.5);

  tl.caption({ at: 6.5, dur: 5.2, text: 'Keeping every message can bury the next useful action. Blind truncation can discard the evidence needed later.' });
  tl.tween(noiseU, 1, { at: 7.0, dur: 1.1, ease: ease.move });
  tl.hold(11.7, 0.5);

  tl.caption({ at: 12.2, dur: 5.2, text: 'The paper gives the model a learned context-update tool, invoked when the research state meaningfully changes.' });
  tl.tween(semanticU, 1, { at: 12.8, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 650, y: 350, k: 1.15 }, { at: 13.0, dur: 1.4, ease: ease.move });
  tl.hold(17.4, 0.5);

  tl.caption({ at: 17.9, dur: 5.1, text: 'The ribbon folds by meaning, not by message age. Verified findings and source identifiers stay together.' });
  tl.tween(foldU, 1, { at: 18.5, dur: 2.0, ease: ease.move });
  tl.hold(23.0, 0.5);

  tl.caption({ at: 23.5, dur: 5.2, text: 'Current candidates, unresolved constraints, concerns, rejections, and the next plan also survive.' });
  tl.tween(stateU, 6, { at: 24.1, dur: 2.3, ease: ease.enter });
  tl.hold(28.7, 0.5);

  tl.caption({ at: 29.2, dur: 5.1, text: 'Duplicate observations, superseded conclusions, and obsolete plans fall away.' });
  tl.tween(noiseU, 2, { at: 29.8, dur: 1.4, ease: ease.move });
  tl.hold(34.3, 0.5);

  tl.caption({ at: 34.8, dur: 5.1, text: 'Fresh actions append after the compact state, so the model does not reconstruct progress from the full history.' });
  tl.tween(appendU, 1, { at: 35.4, dur: 1.8, ease: ease.draw });
  tl.hold(39.9, 0.5);

  tl.caption({ at: 40.4, dur: 5.2, text: 'The update may happen after resolving a subproblem, rejecting a candidate, reconciling a conflict, or changing the plan.' });
  tl.tween(repeatU, 1, { at: 41.0, dur: 1.5, ease: ease.linear });
  tl.hold(45.6, 0.5);

  tl.caption({ at: 46.1, dur: 6.6, text: "This learned mechanism belongs to the paper's full system. The public quickstart only ships a separate page-extraction summary path." });
  tl.tween(boundaryU, 1, { at: 46.7, dur: 0.9, ease: ease.enter });
  tl.tween(dimU, 1, { at: 48.1, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 49.0, dur: 0.7, ease: ease.enter });
  tl.hold(52.7, 1.0);

  return { tl, cam, rawU, noiseU, semanticU, foldU, stateU, appendU, repeatU, boundaryU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const rawU = s.get(scene.rawU);
  const foldU = s.get(scene.foldU);
  const stateU = s.get(scene.stateU);
  const noiseU = s.get(scene.noiseU);
  const mainOpacity = 1 - 0.86 * s.get(scene.dimU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={68} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={700}>Context as research state</text>
          <text x={640} y={95} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>paper mechanism · update_context(h⁽ᵏ⁾ₜ) → z⁽ᵏ⁾ₜ</text>

          <g opacity={1 - foldU * 0.88}>
            {RAW.map(([label, fate], i) => {
              const u = clamp01(rawU * 8 - i / 2.4);
              const row = Math.floor(i / 6);
              const col = i % 6;
              const x = 105 + col * 178;
              const y = 155 + row * 110;
              const dropping = fate === 'drop';
              const fall = dropping ? Math.max(0, noiseU - 1) * (70 + (i % 3) * 24) : 0;
              return (
                <g key={i} transform={`translate(${x} ${y + fall})`} opacity={u * (dropping ? 1 - Math.max(0, noiseU - 1) : 1)}>
                  <rect width={156} height={74} rx={11} fill={colors.PANEL} stroke={dropping ? colors.NEGATIVE : colors.POSITIVE} strokeOpacity={0.65} />
                  <text x={13} y={27} fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>{label}</text>
                  <text x={13} y={51} fill={dropping ? colors.NEGATIVE : colors.POSITIVE} fontSize={8.5} fontFamily={MONO}>{dropping ? 'superseded / redundant' : 'decision-relevant'}</text>
                </g>
              );
            })}
          </g>

          {s.get(scene.semanticU) > 0 && (
            <g opacity={s.get(scene.semanticU) * (1 - foldU * 0.6)}>
              <rect x={425} y={500} width={430} height={58} rx={16} fill={colors.SECONDARY} fillOpacity={0.1} stroke={colors.SECONDARY} />
              <text x={640} y={526} textAnchor="middle" fill={colors.TEXT} fontSize={12}>triggered by semantic progress</text>
              <text x={640} y={547} textAnchor="middle" fill={colors.SECONDARY} fontSize={9.5} fontFamily={MONO}>not a fixed token threshold</text>
            </g>
          )}

          {foldU > 0 && (
            <g opacity={foldU}>
              <path d={`M 170 355 C 310 ${470 - foldU * 180} 360 ${315 + foldU * 20} 475 250`} fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeDasharray="8 7" />
              <path d={`M 1110 355 C 970 ${470 - foldU * 180} 920 ${315 + foldU * 20} 805 250`} fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeDasharray="8 7" />
              <rect x={455} y={135} width={370} height={390} rx={18} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
              <text x={640} y={171} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={MONO}>refreshed research state</text>
              {STATE.map((item, i) => {
                const u = clamp01(stateU - i);
                return (
                  <g key={item.label} transform={`translate(483 ${198 + i * 48})`} opacity={u}>
                    <rect width={314} height={34} rx={8} fill={item.color} fillOpacity={0.09} stroke={item.color} strokeOpacity={0.7} />
                    <circle cx={17} cy={17} r={5} fill={item.color} />
                    <text x={32} y={21} fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>{item.label}</text>
                  </g>
                );
              })}
            </g>
          )}

          {s.get(scene.appendU) > 0 && (
            <g opacity={s.get(scene.appendU)}>
              <path d="M 825 468 C 900 468 920 468 980 468" fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} strokeDasharray="7 6" />
              {[0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${982 + i * 76} 438)`}>
                  <rect width={64} height={60} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} />
                  <text x={32} y={26} textAnchor="middle" fill={colors.POSITIVE} fontSize={8.5} fontFamily={MONO}>{['action', 'observe', 'plan'][i]}</text>
                  <text x={32} y={44} textAnchor="middle" fill={colors.MUTED} fontSize={8}>fresh</text>
                </g>
              ))}
            </g>
          )}

          {s.get(scene.repeatU) > 0 && (
            <g opacity={s.get(scene.repeatU)}>
              <path d="M 1115 415 C 1195 345 1195 245 1115 180" fill="none" stroke={colors.WARM} strokeWidth={2.5} strokeDasharray="7 6" />
              <path d="M 1115 180 l 7 16 l -18 -4 z" fill={colors.WARM} />
              <text x={1180} y={300} textAnchor="middle" fill={colors.WARM} fontSize={9.5} fontFamily={MONO} transform="rotate(-90 1180 300)">invoke again when state changes</text>
            </g>
          )}

          {s.get(scene.boundaryU) > 0 && (
            <g opacity={s.get(scene.boundaryU)}>
              <rect x={95} y={565} width={1090} height={42} rx={10} fill={colors.NEGATIVE} fillOpacity={0.07} stroke={colors.NEGATIVE} strokeOpacity={0.55} />
              <text x={640} y={591} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>paper update_context ≠ public quickstart EXTRACTOR_PROMPT page summary</text>
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={225} y={235} width={830} height={202} rx={20} fill={colors.PANEL} stroke={colors.ACCENT} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={700}>Keep the state, lose the clutter</text>
          <text x={640} y={343} textAnchor="middle" fill={colors.MUTED} fontSize={16}>verified evidence · unresolved constraints · next plan</text>
          <text x={640} y={382} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>paper §2.2.1 · autonomous context updating</text>
          <text x={640} y={408} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5}>paper mechanism; not included in the released quickstart</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
