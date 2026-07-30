// Teach Without the Robot — chapter 2: Reconstruct the Hands.
//
// Grounded in arXiv:2607.25895, sec/03_data.tex "Pose Acquisition and
// Accuracy", "Trajectory Reconstruction and Automatic Cleaning", and
// "Processed-Data Quality", plus paper Figure 2. The paper reports offline
// stereo-inertial SLAM, two fiducial marker cubes in one head-camera frame,
// native inter-gripper pose, and 3 mm local end-effector error.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Figure } from '../../primitives';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const HAND_PATH = Array.from({ length: 120 }, (_, i) => {
  const t = i / 119;
  const x = 185 + t * 785;
  const y = 390 + Math.sin(t * Math.PI * 6) * 68 + Math.sin(t * Math.PI * 16) * 18;
  return { x, y };
});
const DRIFT_PATH = HAND_PATH.map((p, i) => {
  const t = i / (HAND_PATH.length - 1);
  return { x: p.x + 72 * t * t, y: p.y - 82 * t + Math.sin(t * 8) * 24 };
});
const HEAD_PATH = Array.from({ length: 36 }, (_, i) => ({
  x: 265 + i * 20,
  y: 205 + Math.sin(i * 0.25) * 10,
}));

function lerpPoints(u: number) {
  return HAND_PATH.map((p, i) => {
    const d = DRIFT_PATH[i];
    return `${d.x + (p.x - d.x) * u},${d.y + (p.y - d.y) * u}`;
  }).join(' ');
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rawU = tl.channel('rawU', 0);
  const driftU = tl.channel('driftU', 0);
  const headU = tl.channel('headU', 0);
  const offlineU = tl.channel('offlineU', 0);
  const markersU = tl.channel('markersU', 0);
  const composeU = tl.channel('composeU', 0);
  const relativeU = tl.channel('relativeU', 0);
  const figureU = tl.channel('figureU', 0);
  const metricU = tl.channel('metricU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.7, text: 'Six synchronized videos still contain pixels, not the robot actions a policy needs.' });
  tl.tween(rawU, 1, { at: 0.9, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 355, k: 1.05 }, { at: 1.1, dur: 1.3, ease: ease.move });
  tl.hold(6.2, 0.6);

  tl.caption({ at: 6.8, dur: 5.7, text: 'Track each wrist independently and drift bends the path while the measured relationship between the two hands can wander.' });
  tl.tween(driftU, 1, { at: 7.3, dur: 1.4, ease: ease.move });
  tl.hold(12.5, 0.6);

  tl.caption({ at: 13.1, dur: 5.8, text: 'High fidelity U M I estimates a steadier head trajectory with offline stereo inertial mapping, using future observations as well as past ones.' });
  tl.tween(headU, 1, { at: 13.6, dur: 1.5, ease: ease.draw });
  tl.tween(offlineU, 1, { at: 14.1, dur: 2.1, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 285, k: 1.13 }, { at: 14.4, dur: 1.3, ease: ease.move });
  tl.hold(18.9, 0.6);

  tl.caption({ at: 19.5, dur: 5.7, text: 'The same head cameras see a marker cube on each hand, so both hands are localized in one shared camera frame.' });
  tl.tween(markersU, 1, { at: 20.0, dur: 1.3, ease: ease.enter });
  tl.hold(25.2, 0.6);

  tl.caption({ at: 25.8, dur: 5.8, text: 'Compose the global head motion with each hand to head pose, and two globally consistent hand trajectories emerge.' });
  tl.tween(composeU, 1, { at: 26.3, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 27.0, dur: 1.3, ease: ease.move });
  tl.hold(31.6, 0.6);

  tl.caption({ at: 32.2, dur: 5.7, text: 'Because both markers share that frame, intergripper pose is measured natively instead of reconstructed later from cross camera overlap.' });
  tl.tween(relativeU, 1, { at: 32.7, dur: 1.4, ease: ease.draw });
  tl.hold(37.9, 0.6);

  tl.caption({ at: 38.5, dur: 5.8, text: 'A dynamic sliding window protects local consistency while avoiding loop closure assumptions that moving objects would violate.' });
  tl.tween(figureU, 1, { at: 39.0, dur: 0.8, ease: ease.enter });
  tl.tween(cam, { x: 625, y: 365, k: 1.06 }, { at: 39.3, dur: 1.3, ease: ease.move });
  tl.hold(44.3, 0.6);

  tl.caption({ at: 44.9, dur: 5.8, text: 'That local precision preserves millimeter scale handwriting even while long horizon global drift is only bounded to the centimeter level.' });
  tl.tween(figureU, 1, { at: 45.4, dur: 0.6, ease: ease.pop });
  tl.hold(50.7, 0.6);

  tl.caption({ at: 51.3, dur: 6.0, text: 'Against tracking ground truth in the evaluated workspace, the recovered end effector has three millimeters of mean local translation error.' });
  tl.tween(metricU, 1, { at: 51.8, dur: 1.0, ease: ease.pop });
  tl.tween(dimU, 1, { at: 53.0, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 53.8, dur: 0.7, ease: ease.enter });
  tl.hold(57.3, 1.0);

  return { tl, cam, rawU, driftU, headU, offlineU, markersU, composeU, relativeU, figureU, metricU, dimU, endU };
}

const scene = buildScene();

function MarkerCube({ x, y, u, color }: { x: number; y: number; u: number; color: string }) {
  if (u <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.8 + 0.2 * u})`} opacity={u}>
      <path d="M0 -18 L18 -8 L18 12 L0 22 L-18 12 L-18 -8 Z" fill={colors.PANEL} stroke={color} strokeWidth={2} />
      <path d="M0 -18 L0 2 M-18 -8 L0 2 L18 -8 M0 2 L0 22" fill="none" stroke={color} strokeWidth={1.5} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const rawU = s.get(scene.rawU);
  const driftU = s.get(scene.driftU);
  const offlineU = s.get(scene.offlineU);
  const markersU = s.get(scene.markersU);
  const composeU = s.get(scene.composeU);
  const relativeU = s.get(scene.relativeU);
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);
  const reconstructed = composeU;
  const tracePoints = lerpPoints(reconstructed);
  const headIndex = Math.min(HEAD_PATH.length - 1, Math.floor(offlineU * HEAD_PATH.length));
  const head = HEAD_PATH[headIndex] ?? HEAD_PATH[0];
  const left = HAND_PATH[Math.min(HAND_PATH.length - 1, Math.floor(composeU * 72 + 24))];
  const right = HAND_PATH[Math.min(HAND_PATH.length - 1, Math.floor(composeU * 72 + 42))];

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={54} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={750}>Reconstruct both hands in one frame</text>
        <text x={640} y={80} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>offline stereo-inertial SLAM · fiducial cubes · native relative pose</text>
      </g>
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <rect x={130} y={120} width={1020} height={470} rx={24} fill={colors.PANEL} stroke={colors.GRID} />
          <polyline points={lerpPoints(0)} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} strokeDasharray="8 7" opacity={rawU * (0.35 + 0.5 * driftU) * (1 - 0.7 * composeU)} />
          <polyline points={tracePoints} fill="none" stroke={colors.ACCENT} strokeWidth={4} opacity={rawU} />
          <text x={160} y={565} fill={reconstructed > 0.5 ? colors.ACCENT : colors.NEGATIVE} fontSize={11} fontFamily={MONO}>
            {reconstructed > 0.5 ? 'globally consistent hand trajectory' : 'independent wrist estimate · drift'}
          </text>

          {s.get(scene.headU) > 0 && (
            <g opacity={s.get(scene.headU)}>
              <polyline points={HEAD_PATH.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={colors.POSITIVE} strokeWidth={3} strokeDasharray="6 5" />
              <g transform={`translate(${head.x} ${head.y})`}>
                <rect x={-34} y={-18} width={68} height={36} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
                <circle cx={-15} cy={0} r={7} fill={colors.POSITIVE} />
                <circle cx={15} cy={0} r={7} fill={colors.POSITIVE} />
                <text x={0} y={42} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily={MONO}>head stereo + IMU</text>
              </g>
              <path d={`M${head.x - 25} ${head.y + 20} Q470 280 ${left.x} ${left.y}`} fill="none" stroke={colors.SECONDARY} strokeWidth={2} opacity={markersU} />
              <path d={`M${head.x + 25} ${head.y + 20} Q760 280 ${right.x} ${right.y}`} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={markersU} />
            </g>
          )}

          <MarkerCube x={left.x} y={left.y} u={markersU} color={colors.SECONDARY} />
          <MarkerCube x={right.x} y={right.y} u={markersU} color={colors.WARM} />

          {relativeU > 0 && (
            <g opacity={relativeU}>
              <line x1={left.x} y1={left.y - 35} x2={right.x} y2={right.y - 35} stroke={colors.POSITIVE} strokeWidth={3} />
              <circle cx={left.x} cy={left.y - 35} r={5} fill={colors.POSITIVE} />
              <circle cx={right.x} cy={right.y - 35} r={5} fill={colors.POSITIVE} />
              <text x={(left.x + right.x) / 2} y={(left.y + right.y) / 2 - 56} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>T_left⁻¹ · T_right · native</text>
            </g>
          )}

          <Figure
            src="/generated/hifi-umi/figures/fig-02.png"
            x={735}
            y={155}
            w={370}
            h={250}
            reveal={s.get(scene.figureU)}
            opacity={s.get(scene.figureU)}
            caption="Paper Fig. 2 · millimeter-scale handwriting"
            accent={colors.WARM}
          />

          {s.get(scene.metricU) > 0 && (
            <g opacity={s.get(scene.metricU)} transform="translate(445 480)">
              <rect width={390} height={72} rx={18} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={195} y={31} textAnchor="middle" fill={colors.POSITIVE} fontSize={26} fontWeight={800}>3 mm</text>
              <text x={195} y={54} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>mean local end-effector translation error · ~2 m workspace</text>
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={225} y={242} width={830} height={180} rx={22} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
          <text x={640} y={304} textAnchor="middle" fill={colors.TEXT} fontSize={31} fontWeight={760}>The head frame holds both hands together</text>
          <text x={640} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={16}>offline reconstruction · native relative pose · local precision</text>
          <text x={640} y={389} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>pixels → calibrated bimanual trajectories</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
