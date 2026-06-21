import type { Story } from '../types';

// Chapter 4: how the coding agents (Codex and opencode) work inside almostnode.
// Generated from packages/codex-wasm/src (app-server-browser-worker, host-bridge,
// browser-exec), apps/web-ide/src/chat/* (adapter-factory, agent-session-registry,
// codex-conversation-adapter), apps/web-ide/src/features/codex-auth.ts, and
// packages/opencode-mobile-runtime. Codex is a Rust core compiled to WASM that
// reaches files/shell/network only by sending `codex/host/request` messages to a
// host bridge; opencode is the real Node CLI running on almostnode with shims.
export const codingAgentsStory: Story = {
  title: 'How the coding agents work',
  subtitle: 'Codex and opencode — real CLI agents, running in the browser',

  nodes: [
    { id: 'chatui', label: 'Chat Panel', kind: 'client', x: 8, y: 24, sublabel: 'chat-screen.tsx' },
    { id: 'adapter', label: 'Adapter', kind: 'proxy', x: 8, y: 60, sublabel: 'per-harness' },
    { id: 'codex', label: 'Codex', kind: 'worker', x: 30, y: 26, sublabel: 'Rust → WASM' },
    { id: 'opencode', label: 'opencode', kind: 'worker', x: 30, y: 74, sublabel: 'Node + WASM' },
    { id: 'bridge', label: 'Host Bridge', kind: 'loadbalancer', x: 52, y: 30, sublabel: 'codex/host/*' },
    { id: 'vfs', label: 'Virtual FS', kind: 'database', x: 74, y: 20, sublabel: 'the project files' },
    { id: 'shell', label: 'Shell', kind: 'service', x: 74, y: 50, sublabel: 'container.run' },
    { id: 'proxy', label: 'Networking Layer', kind: 'cache', x: 74, y: 80, sublabel: 'Tailscale · CORS proxy' },
    { id: 'model', label: 'Model', kind: 'external', x: 93, y: 80, sublabel: 'ChatGPT / OpenAI' },
  ],

  edges: [
    { id: 'chatui-adapter', from: 'chatui', to: 'adapter' },
    { id: 'adapter-codex', from: 'adapter', to: 'codex' },
    { id: 'adapter-opencode', from: 'adapter', to: 'opencode', dashed: true },
    { id: 'codex-bridge', from: 'codex', to: 'bridge' },
    { id: 'bridge-vfs', from: 'bridge', to: 'vfs' },
    { id: 'bridge-shell', from: 'bridge', to: 'shell' },
    { id: 'bridge-proxy', from: 'bridge', to: 'proxy' },
    { id: 'proxy-model', from: 'proxy', to: 'model' },
    { id: 'opencode-vfs', from: 'opencode', to: 'vfs', dashed: true },
    { id: 'opencode-shell', from: 'opencode', to: 'shell', dashed: true },
    { id: 'opencode-proxy', from: 'opencode', to: 'proxy', dashed: true },
  ],

  steps: [
    {
      id: 'cover',
      cue: 0,
      chapter: 'Chapter 3',
      cover: true,
      title: 'How the coding agents work',
      coverSubtitle: 'Codex and opencode — real CLI coding agents, running inside a browser tab.',
      narration: 'A prompt becomes an agent that edits files and runs commands, in a loop.',
    },
    {
      id: 'agents',
      cue: "coding agent living in the tab",
      chapter: 'The cast',
      title: 'Real agents, in the browser',
      narration:
        '**Codex** — OpenAI’s coding agent, its Rust core compiled to **WebAssembly** — runs *inside* almostnode, with no server. It’s the same tool you’d run in a terminal, except the terminal is a browser tab. Its cousin **opencode** works the same way — we’ll get to it.',
      reveal: ['codex'],
      highlight: ['codex'],
    },
    {
      id: 'chat',
      cue: "chat panel",
      chapter: 'Driving the agent',
      title: 'You type in the chat panel',
      narration:
        'You talk to the agent through a **chat panel**. Each agent gets an **adapter** — chosen by its harness — that knows how to speak that agent’s particular dialect.',
      reveal: ['chatui', 'adapter'],
      highlight: ['chatui', 'adapter', 'codex'],
      messages: [{ from: 'chatui', to: 'adapter', kind: 'data', label: 'your prompt' }],
    },
    {
      id: 'stdin',
      cue: "types your prompt",
      chapter: 'Driving the agent',
      title: 'The prompt becomes keystrokes',
      narration:
        'Here’s the trick: the agent is really a **CLI running in a terminal tab**. The adapter submits your prompt by *typing it into the agent’s stdin* — `agentSessionRegistry.sendUserText()` sends it as a bracketed paste, then Enter.',
      highlight: ['adapter', 'codex'],
      badges: [{ node: 'codex', text: 'stdin', tone: 'info' }],
      messages: [{ from: 'adapter', to: 'codex', kind: 'data', label: 'sendUserText()' }],
    },
    {
      id: 'wasm',
      cue: "opaque webassembly",
      chapter: 'Inside Codex',
      title: 'Codex is WASM in a worker',
      narration:
        'Codex’s core is opaque **WASM**, running in a Web Worker kept off the UI thread. But WASM in a worker can’t touch files or the network on its own — so how does it actually *do* anything?',
      highlight: ['codex'],
      badges: [{ node: 'codex', text: 'Web Worker', tone: 'info' }],
    },
    {
      id: 'bridge',
      cue: "host bridge",
      chapter: 'Inside Codex',
      title: 'It asks a host bridge',
      narration:
        'It sends **host requests**. Every side effect is a message to the **Host Bridge** on the main thread, which exposes file, command, and network operations. The WASM stays sandboxed; the bridge does the real work.',
      reveal: ['bridge'],
      highlight: ['codex', 'bridge'],
      messages: [{ from: 'codex', to: 'bridge', kind: 'request', label: 'codex/host/request' }],
    },
    {
      id: 'model',
      cue: "call its model",
      chapter: 'Calling the model',
      title: 'Reach the model — through a proxy',
      narration:
        'To think, Codex has to call the model — `chatgpt.com/backend-api/codex` or `api.openai.com`. A browser can’t reach those cross-origin, so the request leaves via `network/fetch` through almostnode’s **networking layer**, which routes it over **Tailscale** or a **CORS proxy** (`NetworkProvider = \'browser\' | \'tailscale\'`).',
      reveal: ['proxy', 'model'],
      highlight: ['bridge', 'proxy', 'model'],
      badges: [{ node: 'proxy', text: 'egress', tone: 'warn' }],
      messages: [
        { from: 'bridge', to: 'proxy', kind: 'request', label: 'network/fetch' },
        { from: 'proxy', to: 'model', kind: 'request', label: 'POST /codex', delay: 850 },
      ],
    },
    {
      id: 'auth',
      cue: "sitting in a file",
      chapter: 'Calling the model',
      title: 'Auth comes from a file',
      narration:
        'How does it authenticate? The token lives in a file, written when you connect Codex in the **keychain** (Chapter 2). The bridge reads it, refreshing if stale, and attaches the bearer token — secrets as files, again.',
      highlight: ['codex', 'bridge'],
      badges: [{ node: 'codex', text: 'auth.json', tone: 'ok' }],
    },
    {
      id: 'stream',
      cue: "streams its reply back",
      chapter: 'Calling the model',
      title: 'The model streams back tool calls',
      narration:
        'The model streams its reply back — text *and* **tool calls**. Codex pulls the tool calls out (`extractResponsesToolCalls`) and gets ready to act: edit a file here, run a command there.',
      highlight: ['model', 'proxy', 'bridge', 'codex'],
      messages: [
        { from: 'model', to: 'proxy', kind: 'response', label: 'stream', duration: 700 },
        { from: 'proxy', to: 'bridge', kind: 'response', label: 'text + tool calls', delay: 800 },
        { from: 'bridge', to: 'codex', kind: 'data', delay: 1500 },
      ],
    },
    {
      id: 'fs',
      cue: "change a file becomes a patch",
      chapter: 'The agent acts',
      title: 'Editing the (virtual) filesystem',
      narration:
        'A tool call to change a file becomes `fs/applyPatch` on the bridge, which applies the unified diff to the **Virtual FS** — the very same in-memory filesystem from Chapter 1. The editor and the live preview update at once.',
      reveal: ['vfs'],
      highlight: ['codex', 'bridge', 'vfs'],
      messages: [
        { from: 'codex', to: 'bridge', kind: 'request', label: 'apply_patch', duration: 650 },
        { from: 'bridge', to: 'vfs', kind: 'data', label: 'write files', delay: 750 },
      ],
    },
    {
      id: 'shell',
      cue: "run a command opens a terminal",
      chapter: 'The agent acts',
      title: 'Running real commands',
      narration:
        'A tool call to run a command becomes `command/exec`: the bridge opens a **terminal session** in the container and runs it — `npm test`, `tsc`, `ls` — capturing stdout and stderr to feed back. Real commands, real output, no server.',
      reveal: ['shell'],
      highlight: ['codex', 'bridge', 'shell'],
      messages: [
        { from: 'codex', to: 'bridge', kind: 'request', label: 'shell_command', duration: 650 },
        { from: 'bridge', to: 'shell', kind: 'request', label: 'npm test', delay: 750, duration: 650 },
        { from: 'shell', to: 'bridge', kind: 'data', label: 'stdout', delay: 1550 },
      ],
    },
    {
      id: 'loop',
      cue: "think act observe",
      chapter: 'The agent acts',
      title: 'Results go back — and it loops',
      narration:
        'Each tool result is handed back to the model as a `function_call_output`. The model reads it and decides the next move — another edit, another command, or *done*. That **think → act → observe** loop is what turns a chat completion into an agent.',
      highlight: ['bridge', 'codex', 'proxy', 'model'],
      messages: [
        { from: 'bridge', to: 'codex', kind: 'data', label: 'result', duration: 600 },
        { from: 'codex', to: 'bridge', kind: 'request', label: 'next turn', delay: 700, duration: 600 },
        { from: 'bridge', to: 'proxy', kind: 'request', delay: 1350, duration: 550 },
        { from: 'proxy', to: 'model', kind: 'request', delay: 1900, duration: 550 },
      ],
    },
    {
      id: 'events',
      cue: "messages and tool call",
      chapter: 'Back to you',
      title: 'Every step streams to the UI',
      narration:
        'All the while, Codex emits **JSON-RPC** notifications — `turn/started`, `item/agentMessage/delta`, `item/completed`. The `CodexConversationAdapter` turns them into chat bubbles and **tool-call cards** — the edits and commands you watch scroll past, token by token.',
      highlight: ['codex', 'adapter', 'chatui'],
      messages: [
        { from: 'codex', to: 'adapter', kind: 'data', label: 'JSON-RPC events', duration: 700 },
        { from: 'adapter', to: 'chatui', kind: 'data', label: 'messages + tool cards', delay: 800 },
      ],
    },
    {
      id: 'opencode',
      cue: "sibling agent plugs",
      chapter: 'The other agent',
      title: 'opencode: same slots, different agent',
      narration:
        '**opencode** plugs into the same sockets — a different agent in the same slots. It’s the real opencode runtime on almostnode (with shims like `opencode-child-process` and `opencode-ripgrep`), and it ships **its own WASM** too — an embedded `pglite` Postgres and more. It edits the same VFS, runs the same shell, and is multi-provider — Claude, OpenAI, and others.',
      reveal: ['opencode'],
      highlight: ['opencode', 'adapter', 'vfs', 'shell'],
      messages: [
        { from: 'adapter', to: 'opencode', kind: 'data', label: 'prompt', duration: 600 },
        { from: 'opencode', to: 'vfs', kind: 'data', label: 'edit', delay: 700, duration: 600 },
        { from: 'opencode', to: 'shell', kind: 'request', label: 'run', delay: 1100, duration: 600 },
      ],
    },
    {
      id: 'recap',
      cue: "same machinery",
      chapter: 'The whole picture',
      title: 'An agent loop in a tab',
      narration:
        'A prompt becomes keystrokes to a CLI agent; the agent — Codex in **WASM**, or **opencode** — calls a model through almostnode’s **networking layer** (Tailscale or a CORS proxy), then edits the **VFS** and runs **shell** commands via a host bridge, looping think-act-observe, while every step streams back to the chat as messages and tool cards. A full coding agent, running in one browser tab.',
      autoAdvanceMs: 9500,
      messages: [
        { from: 'chatui', to: 'adapter', kind: 'data', label: 'prompt', delay: 0, duration: 480 },
        { from: 'adapter', to: 'codex', kind: 'data', delay: 450, duration: 460 },
        { from: 'codex', to: 'bridge', kind: 'request', delay: 950, duration: 460 },
        { from: 'bridge', to: 'proxy', kind: 'request', delay: 1450, duration: 460 },
        { from: 'proxy', to: 'model', kind: 'request', label: 'think', delay: 1950, duration: 480 },
        { from: 'bridge', to: 'vfs', kind: 'data', label: 'edit', delay: 2700, duration: 480 },
        { from: 'bridge', to: 'shell', kind: 'request', label: 'run', delay: 3150, duration: 480 },
        { from: 'codex', to: 'adapter', kind: 'data', label: 'stream', delay: 3800, duration: 520 },
        { from: 'adapter', to: 'chatui', delay: 4300, duration: 520 },
      ],
    },
  ],
};
