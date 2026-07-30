// Teach Without the Robot — chapter 3: Replay Before Training.
//
// Grounded in arXiv:2607.25895, sec/03_data.tex "Data-Quality Criteria" and
// "HiFi-UMI Data Processing Pipeline", plus paper Figure 4. Reconstruction
// passes approximately 98% of captures and simulated whole-body-control replay
// passes approximately 98% of those, for about 96% cumulative basic validity.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Figure } from '../../primitives';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const DOTS = Array.from({ length: 100 }, (_, i) => i);
const META = ['6-view video', 'trajectory', 'gripper state', 'language', 'subtask bounds', 'QC history'];

function startPos(i: number) {
  return { x: 125 + (i % 20) * 15, y: 235 + Math.floor(i / 20) * 18 };
}
function lanePos(i: number, x0: number) {
  return { x: x0 + (i % 14) * 12, y: 205 + Math.floor(i / 14) * 16 };
}
function ringPos(i: number) {
  const a = (i / 96) * Math.PI * 2 - Math.PI / 2;
  return { x: 865 + Math.cos(a) * 142, y: 375 + Math.sin(a) * 142 };
}
function lerp(a: number, b: number, u: number) { return a + (b - a) * u; }

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dotsU = tl.channel('dotsU', 0);
  const figureU = tl.channel('figureU', 0);
  const reconP = tl.channel('reconP', 0);
  const replayP = tl.channel('replayP', 0);
  const yieldU = tl.channel('yieldU', 0);
  const annotateU = tl.channel('annotateU', 0);
  const humanU = tl.channel('humanU', 0);
  const exportU = tl.channel('exportU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.8, text: 'A reconstructed trajectory is still only a claim that the motion can run on a robot.' });
  tl.tween(dotsU, 1, { at: 0.9, dur: 1.7, ease: ease.enter });
  tl.tween(cam, { x: 625, y: 355, k: 1.05 }, { at: 1.1, dur: 1.3, ease: ease.move });
  tl.hold(6.3, 0.6);

  tl.caption({ at: 6.9, dur: 5.8, text: 'Offline mapping and automatic cleaning form the first gate, recomputing abnormal estimates and removing detected failures.' });
  tl.tween(figureU, 1, { at: 7.4, dur: 0.8, ease: ease.enter });
  tl.tween(reconP, 1, { at: 8.0, dur: 2.5, ease: ease.linear });
  tl.hold(12.7, 0.6);

  tl.caption({ at: 13.3, dur: 5.3, text: 'About ninety-eight percent of raw captures survive trajectory reconstruction.' });
  tl.tween(cam, { x: 450, y: 365, k: 1.2 }, { at: 13.8, dur: 1.3, ease: ease.move });
  tl.hold(18.6, 0.6);

  tl.caption({ at: 19.2, dur: 5.8, text: 'Every survivor is then retargeted onto the target embodiment and replayed in simulation.' });
  tl.tween(replayP, 1, { at: 19.7, dur: 2.8, ease: ease.linear });
  tl.tween(cam, { x: 760, y: 365, k: 1.16 }, { at: 20.0, dur: 1.3, ease: ease.move });
  tl.hold(25.0, 0.6);

  tl.caption({ at: 25.6, dur: 5.9, text: 'Kinematically or dynamically infeasible motion is discarded before it can become a training label.' });
  tl.hold(31.5, 0.6);

  tl.caption({ at: 32.1, dur: 5.8, text: 'Replay passes about ninety-eight percent of reconstructed trajectories, so the two serial gates retain roughly ninety-six percent overall.' });
  tl.tween(yieldU, 1, { at: 32.6, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 33.0, dur: 1.3, ease: ease.move });
  tl.hold(37.9, 0.6);

  tl.caption({ at: 38.5, dur: 5.9, text: 'An annotation model drafts task text, subtask boundaries, object interactions, abnormal events, and an uncertainty score.' });
  tl.tween(annotateU, 1, { at: 39.0, dur: 1.5, ease: ease.enter });
  tl.hold(44.4, 0.6);

  tl.caption({ at: 45.0, dur: 5.8, text: 'Human reviewers concentrate on flagged captures and low confidence labels instead of inspecting every raw frame from scratch.' });
  tl.tween(humanU, 1, { at: 45.5, dur: 1.3, ease: ease.enter });
  tl.hold(50.8, 0.6);

  tl.caption({ at: 51.4, dur: 6.4, text: 'The final episode carries synchronized video, calibrated trajectories, gripper state, language, boundaries, and a traceable quality history.' });
  tl.tween(exportU, 1, { at: 51.9, dur: 1.7, ease: ease.move });
  tl.tween(dimU, 1, { at: 53.2, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 54.0, dur: 0.7, ease: ease.enter });
  tl.hold(57.8, 1.0);

  return { tl, cam, dotsU, figureU, reconP, replayP, yieldU, annotateU, humanU, exportU, dimU, endU };
}

const scene = buildScene();

function Gate({ x, label, value, u, color }: { x: number; label: string; value: string; u: number; color: string }) {
  return (
    <g opacity={u}>
      <path d={`M${x} 170 L${x + 34} 210 L${x + 34} 480 L${x} 520 L${x - 34} 480 L${x - 34} 210 Z`} fill={colors.PANEL} stroke={color} strokeWidth={2} />
      <text x={x} y={245} textAnchor="middle" fill={color} fontSize={11} fontWeight={700} fontFamily={MONO} transform={`rotate(-90 ${x} 245)`}>{label}</text>
      <text x={x} y={455} textAnchor="middle" fill={color} fontSize={18} fontWeight={800}>{value}</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const dotsU = s.get(scene.dotsU);
  const reconP = s.get(scene.reconP);
  const replayP = s.get(scene.replayP);
  const yieldU = s.get(scene.yieldU);
  const annotateU = s.get(scene.annotateU);
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={54} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={750}>Replay before training</text>
        <text x={640} y={80} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>reconstruct 98% · replay 98% · cumulative basic validity ≈ 96%</text>
      </g>
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <Gate x={430} label="SLAM + CLEAN" value="98%" u={clamp01(reconP * 2)} color={colors.ACCENT} />
          <Gate x={690} label="WBC REPLAY" value="98%" u={clamp01(replayP * 2)} color={colors.SECONDARY} />

          {DOTS.map((i) => {
            const p0 = startPos(i);
            const p1 = lanePos(i, 465);
            const p2 = lanePos(i, 725);
            const fail1 = i >= 98;
            const fail2 = i >= 96 && i < 98;
            let x = lerp(p0.x, fail1 ? 430 : p1.x, reconP);
            let y = lerp(p0.y, fail1 ? 555 + (i - 98) * 16 : p1.y, reconP);
            if (reconP > 0.99 && replayP > 0) {
              x = lerp(p1.x, fail2 ? 690 : p2.x, replayP);
              y = lerp(p1.y, fail2 ? 555 + (i - 96) * 16 : p2.y, replayP);
            }
            if (yieldU > 0 && i < 96) {
              const ring = ringPos(i);
              x = lerp(p2.x, ring.x, yieldU);
              y = lerp(p2.y, ring.y, yieldU);
            }
            const failed = (fail1 && reconP > 0.7) || (fail2 && replayP > 0.7);
            return <circle key={i} cx={x} cy={y} r={4.2} fill={failed ? colors.NEGATIVE : colors.ACCENT} opacity={clamp01(dotsU * 8 - (i % 8)) * (failed ? 0.8 : 0.72)} />;
          })}

          <Figure
            src="/generated/hifi-umi/figures/fig-04.png"
            x={130}
            y={120}
            w={310}
            h={190}
            reveal={s.get(scene.figureU)}
            opacity={0.95 * (1 - yieldU)}
            caption="Paper Fig. 4 · data flywheel"
            accent={colors.WARM}
          />

          {yieldU > 0 && (
            <g opacity={yieldU}>
              <text x={865} y={365} textAnchor="middle" fill={colors.POSITIVE} fontSize={32} fontWeight={850}>≈96%</text>
              <text x={865} y={393} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>98% × 98%</text>
            </g>
          )}

          {META.map((label, i) => {
            const u = clamp01(annotateU * META.length - i);
            const col = i % 2;
            const row = Math.floor(i / 2);
            return (
              <g key={label} opacity={u} transform={`translate(${975 + col * 135} ${245 + row * 70})`}>
                <rect x={-58} y={-17} width={116} height={34} rx={17} fill={colors.PANEL} stroke={i < 2 ? colors.ACCENT : colors.WARM} />
                <text y={4} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily={MONO}>{label}</text>
              </g>
            );
          })}

          {s.get(scene.humanU) > 0 && (
            <g opacity={s.get(scene.humanU)} transform="translate(1035 485)">
              <circle cx={0} cy={-22} r={16} fill={colors.SECONDARY} />
              <path d="M-28 32 Q0 -6 28 32" fill={colors.SECONDARY} opacity={0.7} />
              <text x={0} y={58} textAnchor="middle" fill={colors.SECONDARY} fontSize={10} fontFamily={MONO}>review flags + uncertainty</text>
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={225} y={238} width={830} height={188} rx={22} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
          <text x={640} y={299} textAnchor="middle" fill={colors.TEXT} fontSize={31} fontWeight={760}>A training episode has receipts</text>
          <text x={640} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={16}>reconstruction · executable replay · labels · review history</text>
          <text x={640} y={386} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>raw capture → replay-validated export</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
