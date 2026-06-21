import type { Story } from '../types';

// Chapter: how Tailscale works inside almostnode. Built from
// packages/tailscale-connect (@tailscale/connect WASM) and
// packages/almostnode/src/network/* (NetworkController + TailscaleConnectAdapter
// + worker). You log in with the Tailscale CLI (it sends you to Tailscale to
// authenticate), connect to your tailnet, and pick an exit node. Because a
// browser tab can't open UDP, WireGuard packets tunnel over a WebSocket to DERP.
export const tailscaleStory: Story = {
  title: 'How Tailscale works',
  subtitle: 'Putting a browser tab on a private VPN — with no native networking',

  nodes: [
    { id: 'sandbox', label: 'Browser Sandbox', kind: 'client', x: 9, y: 24, sublabel: 'your code' },
    { id: 'controller', label: 'Network Controller', kind: 'proxy', x: 9, y: 54, sublabel: 'almostnode/network' },
    { id: 'wasm', label: 'Tailscale client', kind: 'worker', x: 9, y: 84, sublabel: 'tailscale CLI · WASM' },
    { id: 'tailscale', label: 'Tailscale', kind: 'loadbalancer', x: 44, y: 16, sublabel: 'login · your tailnet' },
    { id: 'derp', label: 'DERP Relay', kind: 'external', x: 50, y: 60, sublabel: 'WebSocket relay' },
    { id: 'exit', label: 'Exit Node', kind: 'database', x: 84, y: 60, sublabel: 'on your tailnet' },
  ],

  edges: [
    { id: 'sandbox-controller', from: 'sandbox', to: 'controller' },
    { id: 'controller-wasm', from: 'controller', to: 'wasm' },
    { id: 'wasm-tailscale', from: 'wasm', to: 'tailscale' },
    { id: 'wasm-derp', from: 'wasm', to: 'derp' },
    { id: 'derp-exit', from: 'derp', to: 'exit' },
  ],

  steps: [
    {
      id: 'cover',
      cue: 0,
      chapter: 'Chapter 5',
      cover: true,
      title: 'How Tailscale works',
      coverSubtitle: 'Joining your private tailnet from inside a browser tab — without native networking.',
      narration: 'A sandbox logs in with the Tailscale CLI and reaches your tailnet through an encrypted tunnel.',
    },
    {
      id: 'problem',
      cue: "reach something private",
      chapter: 'The problem',
      title: 'A sandbox wants on your tailnet',
      narration:
        'Code in an almostnode sandbox sometimes needs to reach things on your Tailscale **tailnet** — a private service, or the whole internet through an **exit node**. But it’s trapped in a browser tab, which can’t open raw sockets. How does it join the VPN at all?',
      reveal: ['sandbox', 'exit'],
      highlight: ['sandbox', 'exit'],
    },
    {
      id: 'login',
      cue: "real vpn client",
      chapter: 'Logging in',
      title: 'Log in with the Tailscale CLI',
      narration:
        'You start the **Tailscale CLI** in the sandbox — `tailscale up`. It sends you to **Tailscale** to log in: a browser tab opens, you authenticate with your account, and you approve this new node. No keys to copy or paste.',
      reveal: ['wasm', 'tailscale'],
      highlight: ['wasm', 'tailscale'],
      badges: [{ node: 'wasm', text: 'tailscale up', tone: 'info' }],
      messages: [{ from: 'wasm', to: 'tailscale', kind: 'request', label: 'login' }],
    },
    {
      id: 'connected',
      cue: "on your private network",
      chapter: 'Logging in',
      title: 'Connected to your tailnet',
      narration:
        'Once you’ve authenticated, you’re **connected**. Tailscale sends back your **tailnet** — every device, its `100.x` address, and DNS — so the client knows exactly what’s reachable and who the exit nodes are.',
      highlight: ['tailscale', 'wasm'],
      badges: [{ node: 'tailscale', text: 'connected', tone: 'ok' }],
      messages: [{ from: 'tailscale', to: 'wasm', kind: 'response', label: 'your tailnet' }],
    },
    {
      id: 'client',
      cue: "this is real wireguard",
      chapter: 'The client',
      title: 'It’s WireGuard, in WASM',
      narration:
        'That CLI is really **`@tailscale/connect`** — Tailscale’s Go client compiled to **WASM**: userspace WireGuard plus a TCP/IP `netstack`. almostnode’s **Network Controller** wires it in so your code’s `fetch()` can flow through the tunnel.',
      reveal: ['controller'],
      highlight: ['sandbox', 'controller', 'wasm'],
      messages: [
        { from: 'sandbox', to: 'controller', kind: 'data', label: 'fetch routing' },
        { from: 'controller', to: 'wasm', kind: 'data', label: 'start', delay: 700 },
      ],
    },
    {
      id: 'no-udp',
      cue: "raw udp packets",
      chapter: 'The hard part',
      title: 'But browsers can’t do UDP',
      narration:
        'WireGuard normally rides on raw **UDP** — which a browser tab simply cannot send. A normal VPN client is impossible here. Tailscale’s trick is to change the *transport*, not the protocol.',
      highlight: ['wasm'],
      badges: [{ node: 'wasm', text: 'no UDP', tone: 'warn' }],
    },
    {
      id: 'derp',
      cue: "plain websocket",
      chapter: 'The hard part',
      title: 'Encrypted packets over WebSocket',
      narration:
        'So the client encrypts each packet with **userspace WireGuard**, then tunnels it over a plain **WebSocket** to a **DERP relay** — Tailscale’s always-reachable relay. The ciphertext rides WebSocket frames instead of UDP datagrams.',
      reveal: ['derp'],
      highlight: ['wasm', 'derp'],
      badges: [{ node: 'derp', text: 'WebSocket', tone: 'ok' }],
      messages: [{ from: 'wasm', to: 'derp', kind: 'data', label: 'WireGuard / WS' }],
    },
    {
      id: 'exit',
      cue: "you pick an exit",
      chapter: 'Reaching the tailnet',
      title: 'Pick your exit node',
      narration:
        'Now you **pick an exit node** from your tailnet. The client routes traffic to it — encrypted, over WireGuard, relayed by DERP — and the node forwards it on. Your requests come out of *its* IP, as if you were sitting right there.',
      highlight: ['wasm', 'derp', 'exit'],
      badges: [{ node: 'exit', text: 'selected', tone: 'ok' }],
      messages: [
        { from: 'wasm', to: 'derp', kind: 'data', label: 'traffic', duration: 600 },
        { from: 'derp', to: 'exit', kind: 'data', label: '→ exit node', delay: 700, duration: 600 },
      ],
    },
    {
      id: 'netstack',
      cue: "never sees any of this",
      chapter: 'Reaching the tailnet',
      title: 'fetch() that just works',
      narration:
        'Your code never sees any of this. It calls `fetch(...)`; the Network Controller hands it to the WASM `netstack`, which dials through the tunnel and returns a normal `Response` — from a private service or out via your exit node.',
      highlight: ['sandbox', 'controller', 'wasm', 'exit'],
      messages: [
        { from: 'sandbox', to: 'controller', kind: 'request', label: 'fetch()', duration: 600 },
        { from: 'controller', to: 'wasm', kind: 'request', label: 'dial', delay: 650, duration: 600 },
        { from: 'wasm', to: 'controller', kind: 'data', label: 'Response', delay: 1550, duration: 600 },
        { from: 'controller', to: 'sandbox', kind: 'data', label: 'Response', delay: 2200, duration: 600 },
      ],
    },
    {
      id: 'recap',
      cue: "real encrypted vpn",
      chapter: 'The whole picture',
      title: 'A VPN in a browser tab',
      narration:
        'You run **`tailscale up`**, log in at **Tailscale**, and you’re on your **tailnet**; you **pick an exit node**; and since a tab can’t do UDP, the **WASM** client encrypts with WireGuard and tunnels over a **WebSocket to DERP**, out to the node. Your `fetch()` reaches the tailnet as if you were on a native VPN client.',
      autoAdvanceMs: 9500,
      messages: [
        { from: 'wasm', to: 'tailscale', kind: 'request', label: 'login', delay: 0, duration: 520 },
        { from: 'tailscale', to: 'wasm', kind: 'response', label: 'tailnet', delay: 520, duration: 520 },
        { from: 'wasm', to: 'derp', kind: 'data', label: 'WireGuard / WS', delay: 1200, duration: 560 },
        { from: 'derp', to: 'exit', kind: 'data', label: '→ exit node', delay: 1800, duration: 560 },
      ],
    },
  ],
};
