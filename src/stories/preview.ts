import type { Story } from '../types';

// Chapter: how the preview iframe is driven and recorded. Step order follows the
// narration audio: inspect → drive → record → replay.
export const previewStory: Story = {
  title: 'Driving & recording the preview',
  subtitle: 'Playwright, eruda, and rrweb watching a live preview iframe',

  nodes: [
    { id: 'devserver', label: 'Dev Server', kind: 'loadbalancer', x: 10, y: 20, sublabel: 'injects scripts' },
    { id: 'sw', label: 'Service Worker', kind: 'proxy', x: 10, y: 50, sublabel: 'console bridge' },
    { id: 'playwright', label: 'Playwright Shim', kind: 'worker', x: 10, y: 80, sublabel: 'DOM driver' },
    { id: 'iframe', label: 'Preview', kind: 'client', x: 38, y: 46, sublabel: 'the running app' },
    { id: 'eruda', label: 'eruda', kind: 'cache', x: 64, y: 22, sublabel: 'in-page devtools' },
    { id: 'rrweb', label: 'rrweb', kind: 'record', x: 64, y: 70, sublabel: 'session recorder' },
    { id: 'host', label: 'Workbench', kind: 'service', x: 40, y: 86, sublabel: 'host page' },
    { id: 'replay', label: 'Replay', kind: 'external', x: 88, y: 20, sublabel: 'dispatch.replay.io' },
  ],

  edges: [
    { id: 'devserver-iframe', from: 'devserver', to: 'iframe' },
    { id: 'sw-iframe', from: 'sw', to: 'iframe' },
    { id: 'iframe-eruda', from: 'iframe', to: 'eruda' },
    { id: 'iframe-rrweb', from: 'iframe', to: 'rrweb' },
    { id: 'eruda-host', from: 'eruda', to: 'host' },
    { id: 'rrweb-host', from: 'rrweb', to: 'host' },
    { id: 'playwright-iframe', from: 'playwright', to: 'iframe' },
    { id: 'host-playwright', from: 'host', to: 'playwright' },
    { id: 'host-replay', from: 'host', to: 'replay' },
  ],

  steps: [
    {
      id: 'cover',
      cue: 0,
      chapter: 'Chapter 4',
      cover: true,
      title: 'Driving & recording the preview',
      coverSubtitle: 'How the IDE drives, inspects, and replays the app it just built.',
      narration: 'Three tools watch one iframe: Playwright drives it, eruda inspects it, rrweb records it.',
    },
    {
      id: 'iframe',
      cue: 'sandboxed iframe',
      chapter: 'The preview',
      title: 'Your app lives in an iframe',
      narration:
        'The app you build renders inside a sandboxed `<iframe>`, served by the dev server from Chapter 1. It’s a real running page — but it’s *not* a real browser tab, which makes inspecting and driving it interesting.',
      reveal: ['iframe', 'devserver'],
      highlight: ['iframe', 'devserver'],
      messages: [{ from: 'devserver', to: 'iframe', kind: 'data', label: 'serve app' }],
    },
    {
      id: 'inject',
      cue: 'developer console',
      chapter: 'Inspecting it',
      title: 'eruda is injected into the page',
      narration:
        'As the **Service Worker** serves each HTML response, it injects **eruda** — an in-page devtools console — plus a small bridge script. Now the preview can be inspected from inside, with no real DevTools attached.',
      reveal: ['sw', 'eruda'],
      highlight: ['sw', 'iframe', 'eruda'],
      messages: [{ from: 'sw', to: 'iframe', kind: 'data', label: 'inject eruda' }],
    },
    {
      id: 'cdp',
      cue: 'every log every request',
      chapter: 'Inspecting it',
      title: 'It streams DevTools data back',
      narration:
        'eruda and the injected bridge wrap `console.*` and `fetch`/XHR, then post every log, network call, and error up to the host with `postMessage` (`almostnode-console`, `almostnode-network`) — a **CDP-style channel** that makes the iframe debuggable from the workbench.',
      reveal: ['host'],
      highlight: ['eruda', 'host'],
      messages: [{ from: 'eruda', to: 'host', kind: 'event', label: 'console · network' }],
    },
    {
      id: 'playwright',
      cue: 'browser automation shim',
      chapter: 'Driving it',
      title: 'Playwright drives — without a browser',
      narration:
        'To *act* on the page, almostnode ships a **Playwright-style shim**. There’s no real browser or CDP socket, so it reaches straight into the iframe’s DOM, walks it, and builds an accessibility snapshot with stable refs.',
      reveal: ['playwright'],
      highlight: ['host', 'playwright', 'iframe'],
      messages: [
        { from: 'host', to: 'playwright', kind: 'request', label: 'snapshot' },
        { from: 'playwright', to: 'iframe', kind: 'data', label: 'read DOM', delay: 850 },
      ],
    },
    {
      id: 'act',
      cue: 'real click inside',
      chapter: 'Driving it',
      title: 'Click and type, for real',
      narration:
        'Given a ref, `playwright click e3` / `fill` dispatches real DOM events inside the iframe — the app responds as if a user did it. Each command fires `emitCommand`, which the test-recorder listens to so it can write a spec from your actions.',
      highlight: ['playwright', 'iframe'],
      messages: [{ from: 'playwright', to: 'iframe', kind: 'request', label: 'click e3 · fill' }],
    },
    {
      id: 'rrweb',
      cue: 'third record',
      chapter: 'Recording it',
      title: 'rrweb records the session',
      narration:
        'The dev server also injects a capture script (`REPLAY_CAPTURE_SCRIPT`) that starts **rrweb**. It records every DOM mutation into a growing `simulationData` array — a structural recording, no video.',
      reveal: ['rrweb'],
      highlight: ['iframe', 'rrweb'],
      messages: [{ from: 'iframe', to: 'rrweb', kind: 'data', label: 'DOM mutations' }],
    },
    {
      id: 'interactions',
      cue: 'structural not a video',
      chapter: 'Recording it',
      title: 'Clicks, network, and errors too',
      narration:
        'Alongside the DOM, the script captures clicks, keydowns, scrolls, inputs, every `fetch`, and any thrown errors — all appended to `simulationData`. Together they’re everything you need to reconstruct exactly what happened.',
      highlight: ['rrweb'],
      badges: [{ node: 'rrweb', text: 'simulationData', tone: 'info' }],
    },
    {
      id: 'extract',
      cue: 'ask for the recording',
      chapter: 'The recording',
      title: 'Capturing the recording',
      narration:
        'Ask for the recording and the host sends a `@@replay-nut` message into the iframe; the capture script JSON-encodes `simulationData` and posts it back as a transferable `ArrayBuffer` (`extractRecording`). The whole session, in one buffer.',
      highlight: ['host', 'rrweb'],
      messages: [
        { from: 'host', to: 'rrweb', kind: 'request', label: '@@replay-nut', duration: 650 },
        { from: 'rrweb', to: 'host', kind: 'data', label: 'simulationData', delay: 750 },
      ],
    },
    {
      id: 'upload',
      cue: 'replay service',
      chapter: 'The recording',
      title: 'A replayable recording',
      narration:
        'The host gzips it and POSTs to **Replay** (`dispatch.replay.io`). Now there’s a **replayable recording**: rrweb-player re-animates the DOM stream pixel-perfect — scrub the timeline, no re-run — and Replay’s AI can `chat`/`analyze` it to debug what went wrong.',
      reveal: ['replay'],
      highlight: ['host', 'replay'],
      messages: [{ from: 'host', to: 'replay', kind: 'data', label: 'upload · gzip' }],
    },
    {
      id: 'sees',
      cue: 'eyes and hands',
      chapter: 'Why it matters',
      title: 'The agent can see and act',
      narration:
        'Put it together: eruda streams console + network back, the Playwright shim returns a DOM snapshot, and clicks go in. A coding **agent** (Chapter 3) can now *observe* the app it built and *drive* it — a real feedback loop, all in the tab.',
      highlight: ['eruda', 'host', 'playwright', 'iframe'],
      messages: [
        { from: 'eruda', to: 'host', kind: 'event', label: 'what happened', duration: 700 },
        { from: 'host', to: 'playwright', kind: 'request', label: 'do this', delay: 800 },
      ],
    },
    {
      id: 'recap',
      cue: 'watch its own work',
      chapter: 'The whole picture',
      title: 'One iframe, fully observable',
      narration:
        'A preview iframe the IDE can **drive** (a Playwright DOM shim), **inspect** (eruda streaming console + network back over a CDP-style bridge), and **record** (rrweb → `simulationData` → a replayable Replay recording). The app you built can be watched, tested, and debugged — without ever leaving the browser tab.',
      autoAdvanceMs: 9000,
      messages: [
        { from: 'devserver', to: 'iframe', kind: 'data', label: 'serve', delay: 0, duration: 480 },
        { from: 'sw', to: 'iframe', kind: 'data', label: 'inject', delay: 450, duration: 460 },
        { from: 'iframe', to: 'rrweb', kind: 'data', label: 'record', delay: 950, duration: 460 },
        { from: 'eruda', to: 'host', kind: 'event', label: 'inspect', delay: 1450, duration: 480 },
        { from: 'playwright', to: 'iframe', kind: 'request', label: 'drive', delay: 2000, duration: 480 },
        { from: 'rrweb', to: 'host', kind: 'data', label: 'capture', delay: 2550, duration: 480 },
        { from: 'host', to: 'replay', kind: 'data', label: 'replay', delay: 3050, duration: 520 },
      ],
    },
  ],
};
