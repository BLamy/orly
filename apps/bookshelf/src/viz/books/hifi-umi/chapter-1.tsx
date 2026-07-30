// Teach Without the Robot — chapter 1: Six Views, One Instant.
//
// Grounded in arXiv:2607.25895, sec/03_data.tex "HiFi-UMI Capture Device"
// and "Processed-Data Quality", plus the official HiFi-UMI-2K dataset card.
// The paper specifies two head cameras, four hand cameras, one shared GPIO
// trigger, roughly 200° hand-camera coverage, and <40 μs cross-sensor offset.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Figure } from '../../primitives';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SENSORS = [
  { label: 'head_main', color: colors.ACCENT, offset: -34 },
  { label: 'head_stereo_right', color: colors.ACCENT, offset: 28 },
  { label: 'left_hand_up', color: colors.SECONDARY, offset: -19 },
  { label: 'left_hand_down', color: colors.SECONDARY, offset: 39 },
  { label: 'right_hand_up', color: colors.WARM, offset: 16 },
  { label: 'right_hand_down', color: colors.WARM, offset: -27 },
];
const VIEW_POS = [
  [500, 180], [780, 180], [400, 355], [455, 500], [825, 500], [880, 355],
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const humanU = tl.channel('humanU', 0);
  const blindU = tl.channel('blindU', 0);
  const viewsU = tl.channel('viewsU', 0);
  const figureU = tl.channel('figureU', 0);
  const clocksU = tl.channel('clocksU', 0);
  const syncU = tl.channel('syncU', 0);
  const pulseU = tl.channel('pulseU', 0);
  const qcU = tl.channel('qcU', 0);
  const episodeU = tl.channel('episodeU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.8, text: 'Start with a human demonstration in an ordinary room. No target robot, teleoperation rig, or instrumented workspace is required.' });
  tl.tween(humanU, 1, { at: 0.9, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.04 }, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.hold(6.3, 0.6);

  tl.caption({ at: 6.9, dur: 5.6, text: 'One wrist camera can lose contact behind the hand or object, leaving blind spots and weak depth cues exactly where manipulation happens.' });
  tl.tween(blindU, 1, { at: 7.4, dur: 1.4, ease: ease.draw });
  tl.hold(12.5, 0.6);

  tl.caption({ at: 13.1, dur: 5.8, text: 'High fidelity U M I uses two head views and two nonparallel fisheye views on each hand, for six views around the same motion.' });
  tl.tween(viewsU, 1, { at: 13.6, dur: 1.8, ease: ease.enter });
  tl.tween(blindU, 0, { at: 14.1, dur: 1.0, ease: ease.move });
  tl.hold(18.9, 0.6);

  tl.caption({ at: 19.5, dur: 5.5, text: 'The four hand cameras cover roughly two hundred degrees around each gripper, so contact stays visible through more of the gesture.' });
  tl.tween(figureU, 1, { at: 20.0, dur: 0.8, ease: ease.enter });
  tl.tween(cam, { x: 650, y: 345, k: 1.08 }, { at: 20.3, dur: 1.3, ease: ease.move });
  tl.hold(25.0, 0.6);

  tl.caption({ at: 25.6, dur: 5.6, text: 'But six sharp images still fail if each sensor describes a different instant. Software timestamps can leave action and observation out of step.' });
  tl.tween(figureU, 0.12, { at: 26.1, dur: 0.9, ease: ease.move });
  tl.tween(clocksU, 1, { at: 26.5, dur: 1.5, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 27.1, dur: 1.3, ease: ease.move });
  tl.hold(31.2, 0.6);

  tl.caption({ at: 31.8, dur: 5.6, text: 'A single shared hardware trigger sends one pulse to every camera, inertial sensor, and gripper encoder.' });
  tl.tween(pulseU, 1, { at: 32.3, dur: 2.0, ease: ease.linear });
  tl.hold(37.4, 0.6);

  tl.caption({ at: 38.0, dur: 5.4, text: 'The six sample trains snap onto one time axis, with measured cross-sensor offset below forty microseconds.' });
  tl.tween(syncU, 1, { at: 38.5, dur: 1.4, ease: ease.move });
  // Keep the head-camera glyphs below the persistent title/caption-safe band
  // while bringing the synchronization rows forward.
  tl.tween(cam, { x: 640, y: 390, k: 1.08 }, { at: 38.8, dur: 1.3, ease: ease.move });
  tl.hold(43.4, 0.6);

  tl.caption({ at: 44.0, dur: 6.0, text: 'During capture, the device also warns about underexposure, motion blur, excessive speed, and hands leaving the tracking field.' });
  tl.tween(qcU, 1, { at: 44.5, dur: 1.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 46.0, dur: 1.3, ease: ease.move });
  tl.hold(50.0, 0.6);

  tl.caption({ at: 50.6, dur: 6.2, text: 'One human gesture now leaves as six synchronized views with measured gripper state and explicit quality signals, ready for reconstruction.' });
  tl.tween(episodeU, 1, { at: 51.1, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 52.2, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 53.0, dur: 0.7, ease: ease.enter });
  tl.hold(56.8, 1.0);

  return { tl, cam, humanU, blindU, viewsU, figureU, clocksU, syncU, pulseU, qcU, episodeU, dimU, endU };
}

const scene = buildScene();

function Hand({ x, y, flip = 1, opacity }: { x: number; y: number; flip?: number; opacity: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip} 1)`} opacity={opacity}>
      <rect x={-34} y={-26} width={68} height={84} rx={26} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={2} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-30 + i * 16} y={-65 - i * 3} width={12} height={46 + i * 3} rx={6} fill={colors.PANEL} stroke={colors.TEXT} />)}
      <path d="M-30 5 C-66 -6 -72 28 -38 40" fill="none" stroke={colors.TEXT} strokeWidth={13} strokeLinecap="round" />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const humanU = s.get(scene.humanU);
  const viewsU = s.get(scene.viewsU);
  const clocksU = s.get(scene.clocksU);
  const syncU = s.get(scene.syncU);
  const pulseU = s.get(scene.pulseU);
  const qcU = s.get(scene.qcU);
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={54} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={750}>Six views, one instant</text>
        <text x={640} y={80} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>6 cameras · shared GPIO trigger · cross-sensor offset &lt; 40 μs</text>
      </g>
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <Hand x={550} y={330} opacity={humanU} />
          <Hand x={730} y={330} flip={-1} opacity={humanU} />
          <circle cx={640} cy={430} r={54} fill={colors.WARM} opacity={0.12 * humanU} />
          <rect x={604} y={405} width={72} height={46} rx={12} fill={colors.WARM} opacity={0.65 * humanU} />

          {s.get(scene.blindU) > 0 && (
            <path d="M730 330 A180 180 0 0 1 910 510 L730 330 Z" fill={colors.NEGATIVE} opacity={0.16 * s.get(scene.blindU)} stroke={colors.NEGATIVE} strokeDasharray="7 6" />
          )}

          {VIEW_POS.map(([x, y], i) => {
            const u = clamp01(viewsU * VIEW_POS.length - i);
            const color = SENSORS[i].color;
            return (
              <g key={SENSORS[i].label} opacity={u}>
                <line x1={x} y1={y} x2={i < 2 ? 640 : i < 4 ? 550 : 730} y2={330} stroke={color} strokeWidth={2} opacity={0.5} />
                <circle cx={x} cy={y} r={25} fill={colors.PANEL} stroke={color} strokeWidth={2} />
                <path d={`M${x - 10} ${y} Q${x} ${y - 9} ${x + 10} ${y} Q${x} ${y + 9} ${x - 10} ${y}`} fill="none" stroke={color} strokeWidth={2} />
              </g>
            );
          })}

          <Figure
            src="/generated/hifi-umi/figures/fig-03.png"
            x={760}
            y={105}
            w={405}
            h={235}
            reveal={s.get(scene.figureU)}
            opacity={s.get(scene.figureU)}
            caption="Paper Fig. 3 · capture device"
            accent={colors.SECONDARY}
          />

          {clocksU > 0 && (
            <g transform="translate(145 405)" opacity={clocksU}>
              {SENSORS.map((sensor, i) => {
                const y = i * 31;
                const offset = sensor.offset * (1 - syncU);
                return (
                  <g key={sensor.label}>
                    <text x={0} y={y + 5} fill={sensor.color} fontSize={10} fontFamily={MONO}>{sensor.label}</text>
                    <line x1={190} y1={y} x2={980} y2={y} stroke={colors.GRID} />
                    {Array.from({ length: 8 }, (_, j) => <circle key={j} cx={220 + j * 100 + offset} cy={y} r={4} fill={sensor.color} />)}
                  </g>
                );
              })}
              <line x1={220 + pulseU * 700} y1={-18} x2={220 + pulseU * 700} y2={176} stroke={colors.POSITIVE} strokeWidth={3} opacity={pulseU > 0 ? 1 : 0} />
              <text x={1010} y={88} fill={syncU > 0.5 ? colors.POSITIVE : colors.NEGATIVE} fontSize={12} fontFamily={MONO}>
                {syncU > 0.5 ? '< 40 μs' : 'misaligned'}
              </text>
            </g>
          )}

          {qcU > 0 && (
            <g opacity={qcU} transform="translate(255 545)">
              {['underexposure', 'motion blur', 'fast motion', 'tracking risk'].map((label, i) => (
                <g key={label} transform={`translate(${i * 205} 0)`}>
                  <rect width={180} height={38} rx={19} fill={colors.PANEL} stroke={colors.WARM} />
                  <circle cx={19} cy={19} r={6} fill={colors.WARM} />
                  <text x={34} y={24} fill={colors.TEXT} fontSize={11} fontFamily={MONO}>{label}</text>
                </g>
              ))}
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={225} y={242} width={830} height={180} rx={22} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
          <text x={640} y={304} textAnchor="middle" fill={colors.TEXT} fontSize={31} fontWeight={760}>One gesture, six aligned views</text>
          <text x={640} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={16}>wide coverage · hardware time · online quality control</text>
          <text x={640} y={389} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>HiFi-UMI capture → synchronized episode</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
