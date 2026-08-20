// From Reset to Radio — chapter 2: The Scheduler Loom.
// Grounded in esp-idf 08e0d30a: components/esp_system/{port/cpu_start.c,startup.c},
// components/freertos/app_startup.c, and components/freertos/FreeRTOS-Kernel/tasks.c.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TASKS = [
  { label: 'main', color: colors.ACCENT, core: 0 },
  { label: 'wifi', color: colors.SECONDARY, core: 1 },
  { label: 'event', color: colors.WARM, core: 0 },
  { label: 'timer', color: colors.POSITIVE, core: 1 },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const core0U = tl.channel('core0U', 0), core1U = tl.channel('core1U', 0);
  const releaseU = tl.channel('releaseU', 0), mainU = tl.channel('mainU', 0);
  const schedulerU = tl.channel('schedulerU', 0), ticks = tl.channel('ticks', 0);
  const preemptU = tl.channel('preemptU', 0), blockU = tl.channel('blockU', 0);
  const appU = tl.channel('appU', 0), ecosystemU = tl.channel('ecosystemU', 0);
  const dimU = tl.channel('dimU', 0), endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.7, text: 'The application image wakes on processor core zero. It handles shared initialization while the second core waits at the gate.' });
  tl.tween(core0U, 1, { at: 0.8, dur: 0.7, ease: ease.enter }); tl.tween(core1U, 0.25, { at: 1.5, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 430, y: 350, k: 1.15 }, { at: 1.2, dur: 1.3, ease: ease.move }); tl.hold(6.1, 0.7);
  tl.caption({ at: 6.8, dur: 5.4, text: 'Early system initialization prepares both cores, then releases processor core one into its own startup entry point.' });
  tl.tween(releaseU, 1, { at: 7.3, dur: 1.5, ease: ease.move }); tl.tween(core1U, 1, { at: 8.0, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 8.8, dur: 1.3, ease: ease.move }); tl.hold(12.2, 0.7);
  tl.caption({ at: 12.9, dur: 5.4, text: 'Startup creates a task named main, pinned according to configuration, before either core begins ordinary scheduling.' });
  tl.tween(mainU, 1, { at: 13.4, dur: 0.7, ease: ease.pop }); tl.hold(18.3, 0.7);
  tl.caption({ at: 19.0, dur: 5.6, text: 'Free R T O S starts the scheduler. Each tick chooses the highest-priority ready task that is allowed on that core.' });
  tl.tween(schedulerU, 1, { at: 19.4, dur: 1.4, ease: ease.draw }); tl.tween(ticks, 8, { at: 20.0, dur: 4.2, ease: ease.linear });
  tl.tween(cam, { x: 650, y: 390, k: 1.08 }, { at: 20.5, dur: 1.3, ease: ease.move }); tl.hold(24.6, 0.7);
  tl.caption({ at: 25.3, dur: 5.4, text: 'When urgent Wi-Fi work becomes ready, it preempts lower-priority work instead of waiting for a polite opening.' });
  tl.tween(preemptU, 1, { at: 25.8, dur: 1.3, ease: ease.move }); tl.hold(30.7, 0.7);
  tl.caption({ at: 31.4, dur: 5.5, text: 'When a task waits for a queue or timer, it leaves the rail. Another ready task immediately uses the core.' });
  tl.tween(blockU, 1, { at: 31.9, dur: 1.4, ease: ease.move }); tl.hold(36.9, 0.7);
  tl.caption({ at: 37.6, dur: 5.4, text: 'The main task finally calls your application entry point. If it returns, that task deletes itself.' });
  tl.tween(appU, 1, { at: 38.1, dur: 0.7, ease: ease.enter }); tl.tween(cam, { x: 390, y: 315, k: 1.2 }, { at: 38.7, dur: 1.3, ease: ease.move }); tl.hold(43.0, 0.7);
  tl.caption({ at: 43.7, dur: 6.3, text: 'Your code is not the whole machine. It shares two execution rails with radio, event, timer, idle, and driver tasks.' });
  tl.tween(ecosystemU, 1, { at: 44.2, dur: 1.6, ease: ease.enter }); tl.tween(cam, CAMERA_HOME, { at: 44.8, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 47.0, dur: 1.0, ease: ease.move }); tl.tween(endU, 1, { at: 47.7, dur: 0.7, ease: ease.enter }); tl.hold(50.0, 1.0);
  return { tl, cam, core0U, core1U, releaseU, mainU, schedulerU, ticks, preemptU, blockU, appU, ecosystemU, dimU, endU };
}
const scene = buildScene();

function CoreRail({ y, label, u, ticks, children }: { y: number; label: string; u: number; ticks: number; children?: React.ReactNode }) {
  return <g opacity={u}><rect x={170} y={y - 46} width={940} height={92} rx={22} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={2} /><text x={105} y={y + 6} fill={colors.TEXT} fontWeight={800} fontSize={21}>{label}</text><line x1={210} x2={1060} y1={y} y2={y} stroke={colors.GRID} strokeWidth={4} />{Array.from({ length: 9 }, (_, i) => <line key={i} x1={220 + i * 103} x2={220 + i * 103} y1={y - 12} y2={y + 12} stroke={i <= ticks ? colors.ACCENT : colors.GRID} strokeWidth={3} />)}{children}</g>;
}
function Task({ x, y, label, color, u = 1 }: { x: number; y: number; label: string; color: string; u?: number }) { const p = clamp01(u); return <g opacity={p} transform={`translate(${x} ${y}) scale(${0.84 + p * 0.16})`}><rect x={-60} y={-28} width={120} height={56} rx={13} fill={colors.BG} stroke={color} strokeWidth={2.5} /><text y={5} textAnchor="middle" fill={color} fontFamily={MONO} fontSize={14}>{label}</text></g>; }

export function Render({ s }: { s: SceneState }) {
  const main = 1 - 0.9 * s.get(scene.dimU), tick = Math.floor(s.get(scene.ticks));
  const shift = s.get(scene.preemptU), block = s.get(scene.blockU);
  return <><rect width={1280} height={720} fill={colors.BG} /><g opacity={main}><text x={640} y={54} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={800}>The scheduler loom</text><text x={640} y={80} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={12}>ready → running → blocked → ready</text></g><Camera {...s.get(scene.cam)}><g opacity={main}>
    <CoreRail y={255} label="CPU 0" u={s.get(scene.core0U)} ticks={tick}><Task x={360 + 150 * shift} y={255 - 90 * block} label="main" color={colors.ACCENT} u={s.get(scene.mainU)} /><Task x={670 - 160 * shift} y={255} label="event" color={colors.WARM} u={s.get(scene.schedulerU)} /></CoreRail>
    <CoreRail y={455} label="CPU 1" u={s.get(scene.core1U)} ticks={tick}><Task x={520 - 120 * shift} y={455} label="wifi" color={colors.SECONDARY} u={s.get(scene.schedulerU)} /><Task x={810} y={455} label="timer" color={colors.POSITIVE} u={s.get(scene.ecosystemU)} /></CoreRail>
    {s.get(scene.releaseU) > 0 && <g opacity={s.get(scene.releaseU)}><path d="M410 303 C410 350 540 350 540 407" fill="none" stroke={colors.POSITIVE} strokeWidth={4} strokeDasharray="8 6" /><text x={475} y={345} textAnchor="middle" fill={colors.POSITIVE} fontFamily={MONO} fontSize={12}>call_start_cpu1</text></g>}
    {block > 0 && <g opacity={block}><rect x={420} y={120} width={180} height={58} rx={14} fill={colors.PANEL} stroke={colors.MUTED} /><text x={510} y={155} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13}>BLOCKED: queue</text></g>}
    {s.get(scene.appU) > 0 && <g opacity={s.get(scene.appU)}><rect x={210} y={112} width={230} height={66} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2.5} /><text x={325} y={151} textAnchor="middle" fill={colors.ACCENT} fontFamily={MONO} fontSize={15}>app_main()</text></g>}
    {s.get(scene.ecosystemU) > 0 && TASKS.map((t, i) => <circle key={t.label} cx={1115} cy={160 + i * 70} r={9 + 8 * clamp01(s.get(scene.ecosystemU) * 4 - i)} fill={t.color} />)}
  </g></Camera>{s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}><rect x={205} y={238} width={870} height={190} rx={26} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={3} /><text x={640} y={305} textAnchor="middle" fill={colors.TEXT} fontSize={36} fontWeight={820}>Two cores, many tasks</text><text x={640} y={355} textAnchor="middle" fill={colors.ACCENT} fontSize={21}>FreeRTOS turns readiness and priority into motion.</text><text x={640} y={397} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13}>vTaskStartScheduler() → main_task() → app_main()</text></g>}</>;
}
export const vizScene = () => scene;
