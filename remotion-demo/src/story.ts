// Same declarative shape as the D3 engine's Story spec: nodes + edges + ordered
// steps that progressively `reveal` nodes and fire `messages` (animated packets).
// This is the "How almostnode runs" chapter, ported so we can compare Remotion's
// output and authoring model against the D3 system.

export type Kind = 'client' | 'service' | 'database' | 'worker' | 'proxy';

export interface Node {
  id: string;
  label: string;
  sub?: string;
  kind: Kind;
  x: number; // 0..100
  y: number; // 0..100
}

export interface Edge {
  id: string;
  from: string;
  to: string;
}

export interface Msg {
  from: string;
  to: string;
  label?: string;
}

export interface Step {
  id: string;
  title: string;
  caption: string; // the spoken/displayed narration
  cover?: boolean;
  reveal?: string[];
  messages?: Msg[];
}

export interface Story {
  title: string;
  subtitle: string;
  nodes: Node[];
  edges: Edge[];
  steps: Step[];
}

export const COLORS: Record<Kind, string> = {
  client: '#4b8df8',
  service: '#e53e68',
  database: '#10a37f',
  worker: '#f28a2e',
  proxy: '#6b58ff',
};

export const story: Story = {
  title: 'How almostnode runs',
  subtitle: 'A Node-style runtime living entirely inside one browser tab.',

  nodes: [
    { id: 'tab', label: 'Browser Tab', sub: 'one page', kind: 'client', x: 12, y: 50 },
    { id: 'core', label: 'almostnode', sub: 'the runtime', kind: 'service', x: 33, y: 50 },
    { id: 'vfs', label: 'Virtual FS', sub: 'files in memory', kind: 'database', x: 57, y: 26 },
    { id: 'runtime', label: 'Runtime', sub: 'runs your code', kind: 'worker', x: 57, y: 74 },
    { id: 'sw', label: 'Service Worker', sub: 'serves preview', kind: 'proxy', x: 82, y: 50 },
  ],

  edges: [
    { id: 'tab-core', from: 'tab', to: 'core' },
    { id: 'core-vfs', from: 'core', to: 'vfs' },
    { id: 'core-runtime', from: 'core', to: 'runtime' },
    { id: 'runtime-vfs', from: 'runtime', to: 'vfs' },
    { id: 'core-sw', from: 'core', to: 'sw' },
  ],

  steps: [
    {
      id: 'cover',
      cover: true,
      title: 'How almostnode runs',
      caption: 'A Node-style runtime living entirely inside one browser tab.',
    },
    {
      id: 'boot',
      title: 'It boots in the tab',
      caption:
        'almostnode boots inside a single browser tab — no server, no container daemon. The whole Node-like runtime is just JavaScript running in the page.',
      reveal: ['tab', 'core'],
      messages: [{ from: 'tab', to: 'core', label: 'open' }],
    },
    {
      id: 'vfs',
      title: 'Everything is a file in memory',
      caption:
        'Your code, node_modules, and build output live in a Virtual FS — an object graph in the tab’s memory. Nothing ever touches your real disk.',
      reveal: ['vfs'],
      messages: [{ from: 'core', to: 'vfs', label: 'write files' }],
    },
    {
      id: 'runtime',
      title: 'A JS engine inside the JS engine',
      caption:
        'To run a file, the Runtime reads it from the VFS, rewrites ESM imports to CommonJS on the fly, and executes it — a JavaScript engine running inside the JavaScript engine.',
      reveal: ['runtime'],
      messages: [
        { from: 'core', to: 'runtime', label: 'run' },
        { from: 'runtime', to: 'vfs', label: 'read' },
      ],
    },
    {
      id: 'preview',
      title: 'Previews with no web server',
      caption:
        'A Service Worker intercepts requests and serves your app straight from the VFS — a live preview, with no real web server anywhere.',
      reveal: ['sw'],
      messages: [{ from: 'core', to: 'sw', label: 'serve' }],
    },
    {
      id: 'recap',
      title: 'A dev environment in one tab',
      caption:
        'One tab: a Virtual FS, a Runtime, and a Service Worker — a whole dev environment with nothing installed.',
      messages: [
        { from: 'tab', to: 'core' },
        { from: 'core', to: 'vfs' },
        { from: 'core', to: 'runtime' },
        { from: 'core', to: 'sw' },
      ],
    },
  ],
};
