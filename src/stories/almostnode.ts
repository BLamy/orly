import type { Story } from '../types';

// Chapter 1: how almostnode (brand "agent-wasm") works — a browser-native
// Node.js runtime. Generated from packages/almostnode/src: createContainer,
// VirtualFS, Runtime, the 43 shims, PackageManager, ViteDevServer/NextDevServer,
// the esbuild-wasm transform pipeline, and the Service Worker + ServerBridge
// that make a virtual dev server look real to a preview iframe.
export const almostnodeStory: Story = {
  title: 'How almostnode works',
  subtitle: 'A full Node.js dev environment, running in one browser tab',

  nodes: [
    { id: 'editor', label: 'Editor', kind: 'client', x: 8, y: 20, sublabel: 'you write code' },
    { id: 'runtime', label: 'Runtime', kind: 'service', x: 50, y: 20, sublabel: 'runtime.ts' },
    { id: 'shims', label: 'Node Shims', kind: 'worker', x: 72, y: 20, sublabel: '43 modules' },
    { id: 'registry', label: 'npm Registry', kind: 'external', x: 8, y: 48, sublabel: 'the outside world' },
    { id: 'vfs', label: 'Virtual FS', kind: 'database', x: 29, y: 48, sublabel: 'in-memory disk' },
    { id: 'devserver', label: 'Dev Server', kind: 'loadbalancer', x: 73, y: 46, sublabel: 'Vite / Next' },
    { id: 'iframe', label: 'Preview', kind: 'client', x: 93, y: 46, sublabel: '<iframe>' },
    { id: 'pm', label: 'Package Manager', kind: 'queue', x: 8, y: 76, sublabel: 'npm install' },
    { id: 'transforms', label: 'Transforms', kind: 'cache', x: 54, y: 70, sublabel: 'esbuild-wasm' },
    { id: 'sw', label: 'Service Worker', kind: 'proxy', x: 84, y: 70, sublabel: 'request bridge' },
  ],

  edges: [
    { id: 'editor-vfs', from: 'editor', to: 'vfs' },
    { id: 'registry-pm', from: 'registry', to: 'pm' },
    { id: 'pm-vfs', from: 'pm', to: 'vfs' },
    { id: 'vfs-runtime', from: 'vfs', to: 'runtime' },
    { id: 'runtime-shims', from: 'runtime', to: 'shims' },
    { id: 'shims-vfs', from: 'shims', to: 'vfs', dashed: true },
    { id: 'devserver-vfs', from: 'devserver', to: 'vfs' },
    { id: 'devserver-transforms', from: 'devserver', to: 'transforms' },
    { id: 'iframe-sw', from: 'iframe', to: 'sw' },
    { id: 'sw-devserver', from: 'sw', to: 'devserver' },
    { id: 'devserver-iframe', from: 'devserver', to: 'iframe' },
  ],

  steps: [
    {
      id: 'cover',
      cue: 0,
      chapter: 'Chapter 1',
      cover: true,
      title: 'How almostnode works',
      coverSubtitle: 'A full Node.js dev environment — with no backend, running in one browser tab.',
      narration: 'Editor, npm, a real dev server, hot reload — all emulated in the browser.',
    },
    {
      id: 'intro',
      cue: 'little world',
      chapter: 'The idea',
      title: 'Node.js, but in the browser',
      narration:
        'almostnode runs a real coding environment — editor, `npm install`, dev servers — with **no backend at all**. It begins with `createContainer()`, which hands you a **Virtual FS**: an in-memory filesystem that is the single source of truth.',
      reveal: ['editor', 'vfs'],
      highlight: ['editor', 'vfs'],
      messages: [{ from: 'editor', to: 'vfs', kind: 'data', label: 'write files' }],
    },
    {
      id: 'vfs',
      cue: 'real disk',
      chapter: 'The filesystem',
      title: 'Everything is a file in memory',
      narration:
        'Your code, `node_modules`, configs, build output — all of it lives in the **Virtual FS**. Nothing touches your real disk; the whole project is an object graph in the tab’s memory, and changes are watchable for hot reload.',
      highlight: ['vfs'],
      badges: [{ node: 'vfs', text: 'in-memory', tone: 'info' }],
    },
    {
      id: 'install',
      cue: 'install a dependency',
      chapter: 'Bringing in packages',
      title: 'npm install, inside the tab',
      narration:
        'Ask for a package and the **Package Manager** fetches the real tarball straight from the **npm registry** and unpacks it into `/node_modules` in the VFS. Real packages, resolved and installed with no server in the middle.',
      reveal: ['pm', 'registry'],
      highlight: ['pm', 'registry', 'vfs'],
      messages: [
        { from: 'registry', to: 'pm', kind: 'data', label: 'tarball' },
        { from: 'pm', to: 'vfs', kind: 'data', label: '/node_modules', delay: 950 },
      ],
    },
    {
      id: 'run',
      cue: 'actually run your code',
      chapter: 'Running code',
      title: 'The Runtime executes your code',
      narration:
        'To run a file, the **Runtime** reads it from the VFS, rewrites any ESM `import` / `export` into CommonJS on the fly, wraps it, and executes it — a JavaScript engine running inside the JavaScript engine.',
      reveal: ['runtime'],
      highlight: ['runtime', 'vfs'],
      messages: [{ from: 'vfs', to: 'runtime', kind: 'data', label: 'load app.js' }],
    },
    {
      id: 'shims',
      cue: 'no real node',
      chapter: 'Running code',
      title: 'There is no Node — only shims',
      narration:
        'When your code calls `require(\'fs\')`, there is no Node.js underneath. almostnode answers with one of **43 shims** — `fs`, `path`, `http`, `crypto`, `events` — each re-implementing Node’s API against the browser.',
      reveal: ['shims'],
      highlight: ['runtime', 'shims'],
      messages: [{ from: 'runtime', to: 'shims', kind: 'request', label: "require('fs')" }],
    },
    {
      id: 'shims-vfs',
      cue: 'reads and writes that same',
      chapter: 'Running code',
      title: 'Shims read the same filesystem',
      narration:
        'The `fs` shim (`createFsShim`) doesn’t talk to a disk — it reads and writes the very same **VirtualFS**. `writeFileSync` just mutates the in-memory tree. The loop closes: code → shim → VFS → code.',
      highlight: ['shims', 'vfs'],
      messages: [{ from: 'shims', to: 'vfs', kind: 'data', label: 'read / write' }],
    },
    {
      id: 'devserver',
      cue: 'serve a live web app',
      chapter: 'A real dev server',
      title: 'Now serve a live app',
      narration:
        'Building a web app? almostnode runs a **dev server** — `ViteDevServer` or `NextDevServer` — that reads your source out of the VFS, exactly like Vite would on a real machine.',
      reveal: ['devserver'],
      highlight: ['devserver', 'vfs'],
      messages: [{ from: 'devserver', to: 'vfs', kind: 'data', label: 'read source' }],
    },
    {
      id: 'listen',
      cue: 'nothing actually binds',
      chapter: 'A real dev server',
      title: 'A server with no socket',
      narration:
        'But there is no TCP. When code calls `http.listen(3000)`, nothing binds a port — the `http` shim simply registers the server with almostnode’s **ServerBridge** under a *virtual* port. Port 3000 is now a key in a map.',
      highlight: ['devserver'],
      badges: [{ node: 'devserver', text: 'port 3000', tone: 'info' }],
    },
    {
      id: 'preview',
      cue: 'preview is an iframe',
      chapter: 'The preview',
      title: 'The iframe asks for the page',
      narration:
        'The preview is an `<iframe>` pointed at `/__virtual__/3000/`. A **Service Worker** intercepts that fetch — the browser believes it is loading an ordinary URL over the network.',
      reveal: ['iframe', 'sw'],
      highlight: ['iframe', 'sw'],
      messages: [{ from: 'iframe', to: 'sw', kind: 'request', label: '/__virtual__/3000/' }],
    },
    {
      id: 'route',
      cue: 'reads the virtual port',
      chapter: 'The preview',
      title: 'Routing by virtual port',
      narration:
        'The Service Worker parses the port out of the URL and hands the request to the bridge, which calls the matching dev server’s `handleRequest()`. `/__virtual__/3000/` resolves to the server registered on port 3000.',
      highlight: ['sw', 'devserver'],
      messages: [{ from: 'sw', to: 'devserver', kind: 'request', label: 'handleRequest()' }],
    },
    {
      id: 'transforms',
      cue: 'compiled to webassembly',
      chapter: 'The preview',
      title: 'JSX & TypeScript, compiled in-browser',
      narration:
        'Before replying, the dev server runs its transform pipeline: **esbuild-wasm** compiles JSX/TS → JS, imports like `react` are rewritten to on-demand bundles (`redirectNpmImports`), and React Refresh is injected — all in WebAssembly, no build server.',
      reveal: ['transforms'],
      highlight: ['devserver', 'transforms'],
      badges: [{ node: 'transforms', text: 'esbuild-wasm', tone: 'ok' }],
      messages: [
        { from: 'devserver', to: 'transforms', kind: 'request', label: 'JSX / TS' },
        { from: 'transforms', to: 'devserver', kind: 'data', label: 'compiled JS', delay: 950 },
      ],
    },
    {
      id: 'response',
      cue: 'perfectly normal response',
      chapter: 'The preview',
      title: 'A real HTTP response',
      narration:
        'The dev server returns a normal HTTP response — status, headers, body — back through the Service Worker and into the iframe. As far as the page knows, it just talked to a web server.',
      highlight: ['devserver', 'iframe'],
      messages: [{ from: 'devserver', to: 'iframe', kind: 'data', label: '200 OK · HTML/JS' }],
    },
    {
      id: 'hmr',
      cue: 'hot reload needs no network',
      chapter: 'Staying live',
      title: 'Hot reload with no network',
      narration:
        'Edit a file and the VFS fires a change event. The dev server diffs it and posts an HMR update straight into the iframe; **React Refresh** swaps the component without losing state. No save-to-disk, no full reload.',
      highlight: ['vfs', 'devserver', 'iframe'],
      messages: [
        { from: 'vfs', to: 'devserver', kind: 'event', label: 'file changed', duration: 700 },
        { from: 'devserver', to: 'iframe', kind: 'data', label: 'HMR update', delay: 850 },
      ],
    },
    {
      id: 'worker',
      cue: 'off the main thread',
      chapter: 'Keeping it smooth',
      title: 'Optional: off the main thread',
      narration:
        'For heavy work the same Runtime can run inside a **Web Worker** (`WorkerRuntime`) so the UI stays responsive, or in a cross-origin iframe (`SandboxRuntime`) to safely run untrusted code. Same API, different thread.',
      highlight: ['runtime'],
      badges: [{ node: 'runtime', text: 'web worker', tone: 'info' }],
    },
    {
      id: 'recap',
      cue: 'step back and look',
      chapter: 'The whole picture',
      title: 'A dev environment in a tab',
      narration:
        'You write code into the **VFS**; the **Runtime** runs it against **shims**; `npm install` pulls real packages; and a **dev server** serves a live, hot-reloading app to an iframe through a **Service Worker** — a complete Node-style stack with no server, all inside one browser tab.',
      autoAdvanceMs: 9000,
      messages: [
        { from: 'editor', to: 'vfs', kind: 'data', label: 'edit', delay: 0, duration: 480 },
        { from: 'registry', to: 'pm', kind: 'data', label: 'install', delay: 450, duration: 480 },
        { from: 'pm', to: 'vfs', kind: 'data', delay: 900, duration: 480 },
        { from: 'vfs', to: 'runtime', kind: 'data', label: 'run', delay: 1400, duration: 480 },
        { from: 'runtime', to: 'shims', kind: 'request', delay: 1850, duration: 460 },
        { from: 'iframe', to: 'sw', kind: 'request', label: 'fetch', delay: 2500, duration: 480 },
        { from: 'sw', to: 'devserver', kind: 'request', delay: 2950, duration: 460 },
        { from: 'devserver', to: 'iframe', kind: 'data', label: 'render', delay: 3450, duration: 520 },
      ],
    },
  ],
};
