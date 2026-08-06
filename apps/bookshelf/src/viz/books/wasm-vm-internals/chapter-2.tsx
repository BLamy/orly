// The Tab Is the Node
//
// Backing source: ~/Dev/wasm-vm — `crates/slirp` (E3-T14/T15: a Rust TCP/IP stack
// giving the guest 10.0.2.0/24 with GUEST 10.0.2.15, GATEWAY 10.0.2.2, DNS
// 10.0.2.3, a NAT flow table, and the `OutboundConnector` seam), `web/
// tailscale-worker-core.js` + `docs/design/tailscale-worker-protocol.md` and
// `ws-proxy-protocol.md` (the framed session protocol: OPEN/OPEN_OK/DATA/
// WINDOW/SHUTDOWN_WR/CLOSE/RST plus UDP_OPEN/UDP_DATA/UDP_CLOSE, INITIAL_WINDOW
// = 256 KiB, MAX_STREAMS 1024, MAX_DATAGRAM 1252), and task E3-T17 (the browser
// tab registers as the tailnet node: custom control URL, persisted state,
// MagicDNS, exit nodes, providers `tailscale` | `relay` | `offline`, and the
// 25 MiB Tailscale artifact lazy-loaded only when that provider is selected).
//
// Centerpiece: one TCP connection descending through three layers, changing
// shape at every boundary — ethernet frame, socket, framed session, tailnet
// conn — and then the ACL test that proves whose identity is on the wire.
import {
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Three bands: the guest, the slirp stack, the provider — plus the tailnet.
// ---------------------------------------------------------------------------

const BAND_X = 210;
const BAND_W = 700;
const BANDS = [
  { key: 'guest', y: 108, h: 104, title: 'the guest — unmodified Alpine', sub: 'eth0 · 10.0.2.15 via DHCP · default route 10.0.2.2' },
  { key: 'slirp', y: 250, h: 116, title: 'slirp — a TCP/IP stack compiled into the VM', sub: 'gateway 10.0.2.2 · DNS 10.0.2.3 · NAT flow table · no TUN, no privileges' },
  { key: 'prov', y: 404, h: 116, title: 'the provider — tailscale | relay | offline', sub: 'a Worker in the same tab, holding the tailnet identity' },
] as const;
const bandOf = (k: string) => BANDS.find((b) => b.key === k)!;

// The packet's journey down the bands, and what it is called at each stop.
const STOPS = [
  { y: 160, label: 'TCP SYN to 100.x.y.z:443', color: colors.ACCENT },
  { y: 308, label: 'smoltcp socket · NAT flow entry', color: colors.SECONDARY },
  { y: 462, label: 'OPEN frame — stream id, host, port', color: colors.WARM },
];

// The framed protocol, drawn as a small legend.
const OPS = ['OPEN', 'DATA', 'WINDOW', 'SHUTDOWN_WR', 'CLOSE', 'RST'];
const INITIAL_WINDOW_KIB = 256;

const TAILNET = { x: 1000, y: 300 } as const;

const CAM_WIDE: CameraState = { x: 600, y: 320, k: 0.96 };
const CAM_GUEST: CameraState = { x: 560, y: 170, k: 1.5 };
const CAM_SLIRP: CameraState = { x: 560, y: 306, k: 1.42 };
const CAM_PROV: CameraState = { x: 600, y: 452, k: 1.36 };
const CAM_WINDOW: CameraState = { x: 600, y: 430, k: 1.16 };
const CAM_TAILNET: CameraState = { x: 880, y: 320, k: 1.1 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  guestU: ChannelRef<number>;
  dhcpU: ChannelRef<number>;
  slirpU: ChannelRef<number>;
  provU: ChannelRef<number>;
  packetU: ChannelRef<number>;
  frameU: ChannelRef<number>;
  windowU: ChannelRef<number>;
  creditU: ChannelRef<number>;
  dnsU: ChannelRef<number>;
  exitU: ChannelRef<number>;
  identityU: ChannelRef<number>;
  denyU: ChannelRef<number>;
  lazyU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const guestU = tl.channel('guestU', 0);
  const dhcpU = tl.channel('dhcpU', 0);
  const slirpU = tl.channel('slirpU', 0);
  const provU = tl.channel('provU', 0);
  const packetU = tl.channel('packetU', 0);
  const frameU = tl.channel('frameU', 0);
  const windowU = tl.channel('windowU', 0);
  const creditU = tl.channel('creditU', 1);
  const dnsU = tl.channel('dnsU', 0);
  const exitU = tl.channel('exitU', 0);
  const identityU = tl.channel('identityU', 0);
  const denyU = tl.channel('denyU', 0);
  const lazyU = tl.channel('lazyU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the guest believes in ethernet —
  tl.caption({
    at: 0.5,
    dur: 6.95,
    text: 'The Alpine image running here is unmodified, which means it expects an ordinary network card. It boots, it asks for an address the ordinary way, it gets ten dot zero dot two dot fifteen, and it has no idea it is inside a browser tab.',
  });
  tl.tween(guestU, 1, { at: 0.7, dur: 1.4, ease: ease.enter });
  tl.tween(dhcpU, 1, { at: 2.6, dur: 1.4, ease: ease.pop });
  tl.hold(6.9, 0.6);

  // — Beat 2 · slirp —
  tl.caption({
    at: 7.5,
    dur: 7.15,
    text: 'Underneath it is slirp: a complete network stack compiled into the emulator itself. It answers as the gateway, it answers as the name server, and it keeps a table of every open flow — all without a tap device or a single privileged operation.',
  });
  tl.tween(cam, CAM_SLIRP, { at: 7.7, dur: 1.6, ease: ease.move });
  tl.tween(slirpU, 1, { at: 8.4, dur: 1.4, ease: ease.enter });
  tl.hold(14.1, 0.6);

  // — Beat 3 · packets terminate here —
  tl.caption({
    at: 14.7,
    dur: 6.75,
    text: 'And that is the important move: the guest packets end here. Nothing forwards raw ethernet out of the tab. A connection is unwrapped down to what it really is — a request to reach one host on one port.',
  });
  tl.tween(cam, CAM_WIDE, { at: 14.9, dur: 1.6, ease: ease.move });
  tl.tween(packetU, 1, { at: 15.6, dur: 2.4, ease: ease.linear });
  tl.hold(20.9, 0.6);

  // — Beat 4 · the provider —
  tl.caption({
    at: 21.5,
    dur: 6.95,
    text: 'What happens to that request is a choice of provider. Offline means it fails cleanly. Relay sends it through a web socket proxy. And Tailscale hands it to a Worker that is itself a node on your tailnet.',
  });
  tl.tween(cam, CAM_PROV, { at: 21.7, dur: 1.6, ease: ease.move });
  tl.tween(provU, 1, { at: 22.4, dur: 1.4, ease: ease.enter });
  tl.hold(27.9, 0.6);

  // — Beat 5 · the framed protocol —
  tl.caption({
    at: 28.5,
    dur: 7.15,
    text: 'The two sides speak a small framed protocol over the message channel the browser itself provides. Open a stream, send data, grant window credit, half-close, close, reset. Same frames whether the far side is the relay or the tailnet — the provider is swappable by design.',
  });
  tl.tween(frameU, 1, { at: 29.0, dur: 2.0, ease: ease.pop });
  tl.hold(35.1, 0.6);

  // — Beat 6 · backpressure —
  tl.caption({
    at: 35.7,
    dur: 7.15,
    text: 'Window credit is what keeps a browser tab alive under load. Each stream starts with two hundred and fifty-six kilobytes of credit; a guest that stops reading spends its credit and stalls, and the memory it can pin is bounded while every other stream keeps flowing.',
  });
  tl.tween(cam, CAM_WINDOW, { at: 35.9, dur: 1.5, ease: ease.move });
  tl.tween(windowU, 1, { at: 36.6, dur: 1.0, ease: ease.enter });
  tl.tween(creditU, 0.08, { at: 38.0, dur: 2.4, ease: ease.linear });
  tl.hold(42.3, 0.6);

  // — Beat 7 · MagicDNS —
  tl.caption({
    at: 42.9,
    dur: 6.95,
    text: 'Names work the same way. The guest asks ten dot zero dot two dot three, because that is the resolver its lease gave it, and slirp answers by asking the tailnet — so a private tailnet name resolves inside an unmodified Alpine that has never heard of Tailscale.',
  });
  tl.tween(cam, CAM_TAILNET, { at: 43.1, dur: 1.6, ease: ease.move });
  tl.tween(creditU, 1, { at: 43.1, dur: 0.8, ease: ease.move });
  tl.tween(dnsU, 1, { at: 44.0, dur: 1.8, ease: ease.move });
  tl.hold(49.3, 0.6);

  // — Beat 8 · exit nodes —
  tl.caption({
    at: 49.9,
    dur: 6.75,
    text: 'Pick an exit node and the same path reaches the public internet, which is how the guest can run a package manager. Pick none, and a connection to the outside fails at the connector timeout instead of hanging forever.',
  });
  tl.tween(exitU, 1, { at: 50.4, dur: 1.6, ease: ease.move });
  tl.hold(56.1, 0.6);

  // — Beat 9 · whose identity —
  tl.caption({
    at: 56.7,
    dur: 7.15,
    text: 'And the identity on the wire is the tab itself. The browser registers as one named node with its own key; no backend impersonates it, and no tailnet credential is ever visible to the guest operating system.',
  });
  tl.tween(identityU, 1, { at: 57.2, dur: 1.4, ease: ease.pop });
  tl.hold(63.3, 0.6);

  // — Beat 10 · the proof —
  tl.caption({
    at: 63.9,
    dur: 6.95,
    text: 'That claim is testable, and the test is the good kind. Deny the browser node in the access rules while leaving the relay allowed. If anything still gets through, the identity was laundered somewhere — and the design is refuted.',
  });
  tl.tween(denyU, 1, { at: 64.4, dur: 1.6, ease: ease.pop });
  tl.hold(70.3, 0.6);

  // — Beat 11 · pay only if you use it —
  tl.caption({
    at: 70.9,
    dur: 6.75,
    text: 'One last detail that matters in a tab: the Tailscale runtime is about twenty-five megabytes, and it is only fetched when you actually choose that provider. Relay and offline never request it at all.',
  });
  tl.tween(cam, CAM_WIDE, { at: 71.1, dur: 1.6, ease: ease.move });
  tl.tween(lazyU, 1, { at: 72.0, dur: 1.4, ease: ease.enter });
  tl.hold(77.1, 0.6);

  // — Beat 12 · close —
  tl.caption({
    at: 77.7,
    dur: 5.8,
    text: 'A guest with an ordinary network, a stack with no privileges, and a tab that is a real node on your private network. Next: how to freeze all of it.',
  });
  tl.tween(dimAll, 0.12, { at: 78.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 79.2, dur: 0.9, ease: ease.enter });
  tl.hold(83.5, 1.6);

  return {
    tl, cam, guestU, dhcpU, slirpU, provU, packetU, frameU, windowU, creditU, dnsU, exitU,
    identityU, denyU, lazyU, dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Band({ b, u }: { b: (typeof BANDS)[number]; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={BAND_X} y={b.y} width={BAND_W} height={b.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={BAND_X + 16} y={b.y + 26} fill={colors.TEXT} fontSize={15} fontWeight={700}>
        {b.title}
      </text>
      <text x={BAND_X + 16} y={b.y + 48} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
        {b.sub}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const guestU = s.get(scene.guestU);
  const dhcpU = s.get(scene.dhcpU);
  const slirpU = s.get(scene.slirpU);
  const provU = s.get(scene.provU);
  const packetU = s.get(scene.packetU);
  const frameU = s.get(scene.frameU);
  const windowU = s.get(scene.windowU);
  const creditU = s.get(scene.creditU);
  const dnsU = s.get(scene.dnsU);
  const exitU = s.get(scene.exitU);
  const identityU = s.get(scene.identityU);
  const denyU = s.get(scene.denyU);
  const lazyU = s.get(scene.lazyU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const bandU = [guestU, slirpU, provU];

  // the packet's position: three stops, one per band
  const seg = clamp01(packetU) * (STOPS.length - 1);
  const si = Math.min(STOPS.length - 2, Math.floor(seg));
  const sf = seg - si;
  const py = lerp(STOPS[si].y, STOPS[si + 1].y, sf);
  const stopIdx = Math.round(seg);
  const px = BAND_X + 470;

  const provBand = bandOf('prov');

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {BANDS.map((b, i) => (
            <Band key={b.key} b={b} u={bandU[i]} />
          ))}

          {/* the DHCP lease landing in the guest */}
          {dhcpU > 0 && (
            <g opacity={dhcpU}>
              <rect x={BAND_X + BAND_W - 190} y={bandOf('guest').y + 22} width={172} height={54} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
              <text x={BAND_X + BAND_W - 104} y={bandOf('guest').y + 44} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
                DHCP lease
              </text>
              <text x={BAND_X + BAND_W - 104} y={bandOf('guest').y + 64} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                10.0.2.15/24
              </text>
            </g>
          )}

          {/* the descending connection, renamed at every layer */}
          {packetU > 0 && frameU < 0.15 && (
            <g>
              <line x1={px} y1={STOPS[0].y} x2={px} y2={py} stroke={colors.GRID} strokeWidth={2} strokeDasharray="5 5" />
              <circle cx={px} cy={py} r={9} fill={STOPS[stopIdx].color} />
              <text x={px + 18} y={py + 5} fill={STOPS[stopIdx].color} fontSize={13.5} fontWeight={600}>
                {STOPS[stopIdx].label}
              </text>
            </g>
          )}

          {/* the framed protocol legend */}
          {frameU > 0 && (
            <g opacity={frameU}>
              {OPS.map((op, i) => {
                const u = clamp01(frameU * 3 - i * 0.35);
                if (u <= 0) return null;
                return (
                  <g key={op} opacity={u}>
                    <rect x={BAND_X + 16 + i * 112} y={provBand.y + 66} width={104} height={30} rx={5} fill={colors.BG} stroke={colors.WARM} />
                    <text x={BAND_X + 68 + i * 112} y={provBand.y + 86} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily="monospace">
                      {op}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* the credit window */}
          {windowU > 0 && (
            <g opacity={windowU}>
              <rect x={BAND_X + 16} y={provBand.y + 118} width={420} height={26} rx={5} fill={colors.BG} stroke={colors.GRID} />
              <rect x={BAND_X + 18} y={provBand.y + 120} width={416 * clamp01(creditU)} height={22} rx={4} fill={creditU < 0.2 ? colors.NEGATIVE : colors.POSITIVE} />
              <text x={BAND_X + 452} y={provBand.y + 137} fill={creditU < 0.2 ? colors.NEGATIVE : colors.POSITIVE} fontSize={14} fontWeight={700}>
                {Math.round(INITIAL_WINDOW_KIB * clamp01(creditU))} KiB credit
                {creditU < 0.2 ? ' — sender stalls' : ''}
              </text>
            </g>
          )}

          {/* ---- the tailnet ---- */}
          {provU > 0 && (
            <g opacity={provU}>
              <circle cx={TAILNET.x} cy={TAILNET.y} r={54} fill="none" stroke={colors.SECONDARY} strokeWidth={2} strokeDasharray="7 6" />
              <text x={TAILNET.x} y={TAILNET.y - 66} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontWeight={700}>
                your tailnet
              </text>
              {dnsU > 0 && (
                <g opacity={dnsU}>
                  <text x={TAILNET.x} y={TAILNET.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                    db.tailnet.ts.net
                  </text>
                  <text x={TAILNET.x} y={TAILNET.y + 16} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                    100.72.19.4
                  </text>
                  <line x1={BAND_X + BAND_W + 8} y1={bandOf('slirp').y + 58} x2={TAILNET.x - 58} y2={TAILNET.y - 20} stroke={colors.SECONDARY} strokeWidth={1.6} strokeDasharray="4 4" opacity={dnsU} />
                  <text x={BAND_X + BAND_W + 16} y={bandOf('slirp').y + 46} fill={colors.SECONDARY} fontSize={12.5}>
                    DNS 10.0.2.3 → MagicDNS
                  </text>
                </g>
              )}
              {exitU > 0 && (
                <g opacity={exitU}>
                  <line x1={TAILNET.x + 54} y1={TAILNET.y + 30} x2={TAILNET.x + 54} y2={TAILNET.y + 96} stroke={colors.WARM} strokeWidth={2} />
                  <rect x={TAILNET.x - 22} y={TAILNET.y + 96} width={152} height={34} rx={7} fill={colors.BG} stroke={colors.WARM} />
                  <text x={TAILNET.x + 54} y={TAILNET.y + 118} textAnchor="middle" fill={colors.WARM} fontSize={13}>
                    exit node → internet
                  </text>
                </g>
              )}
              {identityU > 0 && (
                <g opacity={identityU}>
                  <rect x={TAILNET.x - 78} y={TAILNET.y - 44} width={156} height={30} rx={7} fill={colors.BG} stroke={denyU > 0.5 ? colors.NEGATIVE : colors.POSITIVE} strokeWidth={1.8} />
                  <text x={TAILNET.x} y={TAILNET.y - 24} textAnchor="middle" fill={denyU > 0.5 ? colors.NEGATIVE : colors.POSITIVE} fontSize={13} fontWeight={700}>
                    node: this browser tab
                  </text>
                </g>
              )}
              {denyU > 0 && (
                <g opacity={denyU}>
                  <text x={TAILNET.x} y={TAILNET.y + 168} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={700}>
                    ACL: deny this node → the guest connection must fail
                  </text>
                </g>
              )}
            </g>
          )}

          {/* lazy artifact */}
          {lazyU > 0 && (
            <g opacity={lazyU}>
              {[
                { name: 'tailscale', cost: '25 MB fetched', color: colors.SECONDARY },
                { name: 'relay', cost: '0 bytes', color: colors.POSITIVE },
                { name: 'offline', cost: '0 bytes', color: colors.POSITIVE },
              ].map((p, i) => {
                const u = clamp01(lazyU * 3 - i * 0.5);
                if (u <= 0) return null;
                return (
                  <g key={p.name} opacity={u}>
                    <rect x={BAND_X + 16 + i * 232} y={provBand.y + 160} width={214} height={44} rx={8} fill={colors.PANEL} stroke={p.color} />
                    <text x={BAND_X + 30 + i * 232} y={provBand.y + 188} fill={p.color} fontSize={14} fontFamily="monospace">
                      {p.name} · {p.cost}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={300} y={256} width={680} height={144} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              slirp terminates the packets · a Worker carries the identity
            </text>
            <text x={640} y={354} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the tab is the node
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
