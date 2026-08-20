// From Reset to Radio — chapter 4: The Packet Elevator.
// Grounded in esp-idf 08e0d30a: components/esp_event/esp_event.c,
// components/esp_wifi/src/wifi_default.c, components/esp_netif/lwip/esp_netif_lwip.c,
// components/esp_netif/lwip/netif/wlanif.c, and components/esp_wifi/include/esp_wifi.h.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const LAYERS = [
  { label: 'application socket', code: 'app task', y: 150, color: colors.ACCENT },
  { label: 'TCP/IP stack', code: 'lwIP · pbuf', y: 260, color: colors.SECONDARY },
  { label: 'network interface', code: 'esp-netif', y: 370, color: colors.WARM },
  { label: 'Wi-Fi driver', code: 'esp_wifi', y: 480, color: colors.POSITIVE },
  { label: 'radio hardware', code: '802.11 MAC / PHY', y: 590, color: colors.NEGATIVE },
];

export function buildScene() {
  const tl = new Timeline(); const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stackU = tl.channel('stackU', 0), initU = tl.channel('initU', 0), eventU = tl.channel('eventU', 0);
  const connectU = tl.channel('connectU', 0), dhcpU = tl.channel('dhcpU', 0), ipU = tl.channel('ipU', 0);
  const txU = tl.channel('txU', 0), radioU = tl.channel('radioU', 0), rxU = tl.channel('rxU', 0);
  const historyU = tl.channel('historyU', 0), dimU = tl.channel('dimU', 0), endU = tl.channel('endU', 0);
  tl.caption({ at: 0.4, dur: 5.8, text: 'A Wi-Fi connection begins by building a software stack: an event loop, a station interface, and the radio driver.' });
  tl.tween(stackU, 1, { at: 0.8, dur: 1.8, ease: ease.draw }); tl.tween(initU, 1, { at: 1.8, dur: 2.6, ease: ease.linear }); tl.hold(6.2, 0.7);
  tl.caption({ at: 6.9, dur: 5.6, text: 'Starting Wi-Fi posts events into a queue. A dedicated loop task removes them and calls registered handlers.' });
  tl.tween(eventU, 1, { at: 7.4, dur: 2.8, ease: ease.linear }); tl.tween(cam, { x: 700, y: 300, k: 1.04 }, { at: 8.0, dur: 1.3, ease: ease.move }); tl.hold(12.5, 0.7);
  tl.caption({ at: 13.2, dur: 5.5, text: 'A station-connected event brings the network interface up and begins the address negotiation.' });
  tl.tween(connectU, 1, { at: 13.7, dur: 1.4, ease: ease.enter }); tl.tween(dhcpU, 1, { at: 14.8, dur: 2.0, ease: ease.linear }); tl.hold(18.7, 0.7);
  tl.caption({ at: 19.4, dur: 5.3, text: 'When that negotiation completes, the got-address event marks the boundary between radio association and usable networking.' });
  tl.tween(ipU, 1, { at: 20.0, dur: 0.7, ease: ease.pop }); tl.tween(cam, CAMERA_HOME, { at: 20.8, dur: 1.3, ease: ease.move }); tl.hold(24.7, 0.7);
  tl.caption({ at: 25.4, dur: 5.6, text: 'Now follow one outgoing packet. The network stack stores its bytes in a packet buffer and lowers it toward the driver.' });
  tl.tween(txU, 1, { at: 25.9, dur: 4.8, ease: ease.linear }); tl.tween(cam, { x: 640, y: 370, k: 1.02 }, { at: 26.5, dur: 1.3, ease: ease.move }); tl.hold(31.0, 0.7);
  tl.caption({ at: 31.7, dur: 5.5, text: 'The wireless interface calls the network-interface transmit wrapper, which hands those bytes to the Wi-Fi driver.' });
  tl.tween(radioU, 1, { at: 32.2, dur: 2.0, ease: ease.draw }); tl.hold(37.2, 0.7);
  tl.caption({ at: 37.9, dur: 5.7, text: 'A received frame climbs the reverse path: the driver callback enters the network interface, then feeds the stack input function.' });
  tl.tween(rxU, 1, { at: 38.4, dur: 4.8, ease: ease.linear }); tl.tween(cam, CAMERA_HOME, { at: 39.2, dur: 1.3, ease: ease.move }); tl.hold(43.6, 0.7);
  tl.caption({ at: 44.3, dur: 6.8, text: 'That packet rides on everything we built: verified flash, scheduled tasks, short interrupts, queued events, and a layered network stack.' });
  tl.tween(historyU, 1, { at: 44.8, dur: 2.2, ease: ease.enter }); tl.tween(dimU, 1, { at: 47.2, dur: 1.0, ease: ease.move }); tl.tween(endU, 1, { at: 47.9, dur: 0.7, ease: ease.enter }); tl.hold(51.1, 1.0);
  return { tl, cam, stackU, initU, eventU, connectU, dhcpU, ipU, txU, radioU, rxU, historyU, dimU, endU };
}
const scene = buildScene();

function Packet({ u, reverse = false }: { u: number; reverse?: boolean }) { const p = clamp01(u), q = reverse ? 1 - p : p; const y = 150 + q * 440; return <g opacity={u > 0 ? 1 : 0} transform={`translate(640 ${y})`}><rect x={-54} y={-19} width={108} height={38} rx={10} fill={reverse ? colors.ACCENT : colors.POSITIVE} /><text y={5} textAnchor="middle" fill={colors.BG} fontFamily={MONO} fontSize={12} fontWeight={800}>{reverse ? 'RX frame' : 'TX pbuf'}</text></g>; }
export function Render({ s }: { s: SceneState }) {
  const main = 1 - 0.9 * s.get(scene.dimU), stack = s.get(scene.stackU);
  return <><rect width={1280} height={720} fill={colors.BG} /><g opacity={main}><text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={800}>The packet elevator</text><text x={640} y={74} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={12}>socket ⇄ lwIP ⇄ esp-netif ⇄ Wi-Fi driver ⇄ radio</text></g><Camera {...s.get(scene.cam)}><g opacity={main}>
    {LAYERS.map((l, i) => { const p = clamp01(stack * LAYERS.length - i); return <g key={l.label} opacity={p}><rect x={320} y={l.y - 38} width={640} height={76} rx={18} fill={colors.PANEL} stroke={l.color} strokeWidth={2.5} /><text x={350} y={l.y - 4} fill={colors.TEXT} fontSize={18} fontWeight={750}>{l.label}</text><text x={930} y={l.y + 6} textAnchor="end" fill={l.color} fontFamily={MONO} fontSize={13}>{l.code}</text></g>; })}
    <g opacity={s.get(scene.initU)}><text x={1040} y={140} fill={colors.ACCENT} fontFamily={MONO} fontSize={12}>esp_event_loop_create_default()</text><text x={1040} y={176} fill={colors.WARM} fontFamily={MONO} fontSize={12}>esp_netif_create_default_wifi_sta()</text><text x={1040} y={212} fill={colors.POSITIVE} fontFamily={MONO} fontSize={12}>esp_wifi_start()</text></g>
    {s.get(scene.eventU) > 0 && <g opacity={s.get(scene.eventU)}><rect x={1010} y={250} width={210} height={78} rx={16} fill={colors.PANEL} stroke={colors.WARM} /><text x={1115} y={280} textAnchor="middle" fill={colors.WARM} fontFamily={MONO} fontSize={12}>event queue</text><circle cx={1025 + 170 * s.get(scene.eventU)} cy={305} r={9} fill={colors.WARM} /></g>}
    {s.get(scene.connectU) > 0 && <g opacity={s.get(scene.connectU)}><text x={1010} y={382} fill={colors.POSITIVE} fontFamily={MONO} fontSize={12}>WIFI_EVENT_STA_CONNECTED</text><path d={`M1010 400 h${170 * s.get(scene.dhcpU)}`} stroke={colors.POSITIVE} strokeWidth={6} /><text x={1010} y={427} fill={colors.MUTED} fontFamily={MONO} fontSize={11}>DHCP client</text></g>}
    {s.get(scene.ipU) > 0 && <g opacity={s.get(scene.ipU)}><rect x={1010} y={458} width={210} height={64} rx={15} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={3} /><text x={1115} y={496} textAnchor="middle" fill={colors.ACCENT} fontFamily={MONO} fontSize={12}>IP_EVENT_STA_GOT_IP</text></g>}
    <Packet u={s.get(scene.txU)} /> <Packet u={s.get(scene.rxU)} reverse />
    {s.get(scene.radioU) > 0 && <g opacity={s.get(scene.radioU)}><path d="M640 625 q42 -52 84 0 M664 625 q18 -24 36 0" fill="none" stroke={colors.POSITIVE} strokeWidth={5} /><text x={640} y={664} textAnchor="middle" fill={colors.POSITIVE} fontFamily={MONO} fontSize={12}>esp_netif_transmit_wrap()</text></g>}
    {s.get(scene.historyU) > 0 && <g opacity={s.get(scene.historyU)}>{['verified flash','FreeRTOS tasks','interrupt handoff','event queue'].map((v,i)=><g key={v} transform={`translate(${90 + i*290} 96)`}><circle r={10} fill={[colors.WARM,colors.ACCENT,colors.NEGATIVE,colors.SECONDARY][i]} /><text x={18} y={5} fill={colors.MUTED} fontSize={13}>{v}</text></g>)}</g>}
  </g></Camera>{s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}><rect x={185} y={228} width={910} height={214} rx={28} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={3} /><text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={38} fontWeight={830}>From reset to radio</text><text x={640} y={352} textAnchor="middle" fill={colors.POSITIVE} fontSize={22}>One packet crosses the whole machine.</text><text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13}>boot → schedule → interrupt → event → lwIP → antenna</text></g>}</>;
}
export const vizScene = () => scene;
