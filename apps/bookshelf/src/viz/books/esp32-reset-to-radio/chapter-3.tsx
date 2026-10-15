// From Reset to Radio — chapter 3: The Interrupt Handoff.
// Grounded in esp-idf 08e0d30a: components/esp_hw_support/intr_alloc.c,
// components/esp_driver_uart/src/uart.c, and components/esp_event/esp_event.c.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const BYTES = [0x45, 0x53, 0x50, 0x33, 0x32, 0x0a];
// The interrupt route as wire segments: FIFO out, matrix crossing, ISR in.
const ROUTE: [number, number][] = [[505, 340], [635, 340], [635, 394], [807, 394]];
function routeAt(f: number): [number, number] {
  const lens = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]));
  let d = clamp01(f) * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const u = clamp01(d / lens[i]), a = ROUTE[i], b = ROUTE[i + 1];
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    }
    d -= lens[i];
  }
  return ROUTE[ROUTE.length - 1];
}

export function buildScene() {
  const tl = new Timeline(); const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const uartU = tl.channel('uartU', 0), bytesU = tl.channel('bytesU', 0), fifoU = tl.channel('fifoU', 0);
  const allocU = tl.channel('allocU', 0), routeU = tl.channel('routeU', 0), isrU = tl.channel('isrU', 0);
  const drainU = tl.channel('drainU', 0), queueU = tl.channel('queueU', 0), taskU = tl.channel('taskU', 0);
  const eventU = tl.channel('eventU', 0), dimU = tl.channel('dimU', 0), endU = tl.channel('endU', 0);
  tl.caption({ at: 0.4, dur: 5.5, text: 'Peripherals do not wait for your loop. Serial bytes can arrive while both cores are busy elsewhere.' });
  tl.tween(uartU, 1, { at: 0.8, dur: 0.7, ease: ease.enter }); tl.tween(bytesU, 1, { at: 1.5, dur: 3.0, ease: ease.linear }); tl.hold(5.9, 0.7);
  tl.caption({ at: 6.6, dur: 5.2, text: 'A hardware first-in, first-out buffer catches the burst, buying software a small pocket of time.' });
  tl.tween(fifoU, 1, { at: 7.0, dur: 1.4, ease: ease.draw }); tl.tween(cam, { x: 420, y: 340, k: 1.08 }, { at: 7.8, dur: 1.3, ease: ease.move }); tl.hold(11.8, 0.7);
  tl.caption({ at: 12.5, dur: 5.5, text: 'The interrupt allocator chooses a compatible processor interrupt and reserves the route for this source.' });
  tl.tween(allocU, 1, { at: 13.0, dur: 1.4, ease: ease.enter }); tl.tween(cam, CAMERA_HOME, { at: 13.8, dur: 1.3, ease: ease.move }); tl.hold(18.0, 0.7);
  tl.caption({ at: 18.7, dur: 5.4, text: 'When the receive-buffer threshold trips, the interrupt matrix carries that source to the chosen core.' });
  tl.tween(routeU, 1, { at: 19.2, dur: 2.4, ease: ease.linear }); tl.hold(24.1, 0.7);
  tl.caption({ at: 24.8, dur: 5.4, text: 'The interrupt service routine runs immediately, but it stays short: acknowledge, drain, record, leave.' });
  tl.tween(isrU, 1, { at: 25.3, dur: 0.6, ease: ease.pop }); tl.tween(drainU, 1, { at: 26.0, dur: 2.0, ease: ease.linear });
  tl.tween(cam, { x: 650, y: 340, k: 1.05 }, { at: 25.8, dur: 1.3, ease: ease.move }); tl.hold(30.2, 0.7);
  tl.caption({ at: 30.9, dur: 5.5, text: 'A queue carries the heavier work out of interrupt context and wakes a blocked consumer task.' });
  tl.tween(queueU, 1, { at: 31.4, dur: 1.4, ease: ease.draw }); tl.tween(taskU, 1, { at: 32.4, dur: 1.0, ease: ease.pop }); tl.hold(36.4, 0.7);
  tl.caption({ at: 37.1, dur: 5.4, text: 'The event loop uses the same idea: posting copies an event into a queue; the loop task dispatches handlers later.' });
  tl.tween(eventU, 1, { at: 37.6, dur: 2.2, ease: ease.move }); tl.tween(cam, CAMERA_HOME, { at: 38.5, dur: 1.3, ease: ease.move }); tl.hold(42.5, 0.7);
  tl.caption({ at: 43.2, dur: 6.0, text: 'Fast interrupts capture the moment. Scheduled tasks spend the time. That handoff keeps the chip responsive.' });
  tl.tween(dimU, 1, { at: 43.8, dur: 1.0, ease: ease.move }); tl.tween(endU, 1, { at: 44.5, dur: 0.7, ease: ease.enter }); tl.hold(49.2, 1.0);
  return { tl, cam, uartU, bytesU, fifoU, allocU, routeU, isrU, drainU, queueU, taskU, eventU, dimU, endU };
}
const scene = buildScene();

function Box({ x, y, w, label, color, u }: { x: number; y: number; w: number; label: string; color: string; u: number }) { const p = clamp01(u); return <g opacity={p} transform={`translate(${x} ${y}) scale(${0.84 + 0.16 * p})`}><rect x={-w / 2} y={-34} width={w} height={68} rx={15} fill={colors.PANEL} stroke={color} strokeWidth={2.5} /><text y={5} textAnchor="middle" fill={color} fontFamily={MONO} fontSize={14}>{label}</text></g>; }
export function Render({ s }: { s: SceneState }) {
  const main = 1 - s.get(scene.dimU), bytes = s.get(scene.bytesU), drain = s.get(scene.drainU), route = s.get(scene.routeU);
  return <><rect width={1280} height={720} fill={colors.BG} /><g opacity={main}><text x={640} y={54} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={800}>The interrupt handoff</text><text x={640} y={80} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={14}>peripheral → ISR → queue → task</text></g><Camera {...s.get(scene.cam)}><g opacity={main}>
    <Box x={145} y={340} w={170} label="UART peripheral" color={colors.ACCENT} u={s.get(scene.uartU)} />
    <g opacity={s.get(scene.uartU)}><rect x={60} y={430} width={190} height={44} rx={12} fill={colors.PANEL} stroke={colors.GRID} /><text x={155} y={458} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={14}>core 0 · busy</text><rect x={60} y={490} width={190} height={44} rx={12} fill={colors.PANEL} stroke={colors.GRID} /><text x={155} y={518} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={14}>core 1 · busy</text></g>
    <g opacity={s.get(scene.fifoU)}><rect x={255} y={292} width={250} height={96} rx={16} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} /><text x={380} y={278} textAnchor="middle" fill={colors.WARM} fontFamily={MONO} fontSize={14}>RX FIFO</text></g>
    {BYTES.map((b, i) => { const raw = clamp01(bytes * BYTES.length - i); return <g key={i} opacity={raw * (1 - drain)} transform={`translate(${283 + i * 38} 340)`}><rect x={-15} y={-22} width={30} height={44} rx={6} fill={colors.BG} stroke={colors.ACCENT} /><text y={5} textAnchor="middle" fill={colors.ACCENT} fontFamily={MONO} fontSize={12}>{b.toString(16).toUpperCase()}</text></g>; })}
    <Box x={635} y={205} w={210} label="esp_intr_alloc()" color={colors.SECONDARY} u={s.get(scene.allocU)} />
    <line x1={635} y1={239} x2={635} y2={288} stroke={colors.SECONDARY} strokeWidth={2} strokeDasharray="6 5" opacity={s.get(scene.allocU)} />
    <g opacity={s.get(scene.allocU)}><rect x={560} y={290} width={150} height={200} rx={18} fill={colors.PANEL} stroke={colors.GRID} /><text x={635} y={318} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={14}>interrupt matrix</text>{[340, 394, 448].map(y => <line key={y} x1={580} y1={y} x2={690} y2={y} stroke={colors.MUTED} strokeOpacity={0.5} strokeWidth={2} />)}{[605, 635, 665].map(x => <line key={x} x1={x} y1={330} x2={x} y2={458} stroke={colors.MUTED} strokeOpacity={0.5} strokeWidth={2} />)}{[340, 394, 448].map(y => [605, 635, 665].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r={3} fill={colors.MUTED} />))}</g>
    {route > 0 && <g><path d="M505 340 H635 V394 H807" fill="none" stroke={colors.SECONDARY} strokeWidth={4} /><circle cx={635} cy={340} r={6} fill={colors.SECONDARY} /><circle cx={635} cy={394} r={6} fill={colors.SECONDARY} /><circle cx={routeAt(route)[0]} cy={routeAt(route)[1]} r={10} fill={colors.SECONDARY} /></g>}
    <Box x={885} y={394} w={155} label="UART ISR" color={colors.NEGATIVE} u={s.get(scene.isrU)} />
    <g opacity={s.get(scene.isrU)}><text x={885} y={350} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={14}>chosen core</text></g>
    <g opacity={s.get(scene.queueU)}><path d="M962 394 H1080 V450" fill="none" stroke={colors.POSITIVE} strokeWidth={4} strokeDasharray="8 6" /><rect x={1010} y={450} width={140} height={56} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} /><text x={1080} y={484} textAnchor="middle" fill={colors.POSITIVE} fontFamily={MONO} fontSize={14}>UART queue</text><path d="M1080 506 V532" fill="none" stroke={colors.POSITIVE} strokeWidth={4} strokeDasharray="8 6" /></g>
    <Box x={1080} y={566} w={180} label="consumer task" color={colors.POSITIVE} u={s.get(scene.taskU)} />
    {s.get(scene.eventU) > 0 && <g opacity={s.get(scene.eventU)}><path d="M850 205 H1075" stroke={colors.WARM} strokeWidth={4} strokeDasharray="8 6" /><circle cx={850 + 210 * s.get(scene.eventU)} cy={205} r={10} fill={colors.WARM} /><text x={955} y={184} textAnchor="middle" fill={colors.WARM} fontFamily={MONO} fontSize={14}>esp_event_post_to()</text><rect x={1075} y={185} width={160} height={40} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} /><text x={1155} y={210} textAnchor="middle" fill={colors.WARM} fontFamily={MONO} fontSize={14}>event queue</text></g>}
  </g></Camera>{s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}><rect x={205} y={238} width={870} height={190} rx={26} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={3} /><text x={640} y={305} textAnchor="middle" fill={colors.TEXT} fontSize={36} fontWeight={820}>Capture now. Work later.</text><text x={640} y={355} textAnchor="middle" fill={colors.POSITIVE} fontSize={21}>Interrupts preserve the instant; queues preserve the work.</text><text x={640} y={397} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={15}>ISR → xQueueSendFromISR() → ready task</text></g>}</>;
}
export const vizScene = () => scene;
