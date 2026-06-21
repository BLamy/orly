import type { Story } from '../types';

// Chapter: the app-builder / control-plane flow. Generated from
// apps/web-ide/src/app-builder/* — standalone-vault.ts (passkey unlock),
// lightweight-container.ts (in-browser login CLIs), neon-provisioning.ts
// (console.neon.tech/api/v2), control-plane-store.ts (projects + jobs),
// launch-fly-machine.ts (api.machines.dev → ghcr.io/replayio/app-building),
// and fly-logs-panel.tsx (polling). It builds in the browser, deploys to real infra.
export const appBuilderStory: Story = {
  title: 'The app-builder & control plane',
  subtitle: 'From a browser prompt to a real Fly machine with a real database',

  nodes: [
    { id: 'ui', label: 'App Builder', kind: 'client', x: 9, y: 24, sublabel: 'build → deploy' },
    { id: 'vault', label: 'Standalone Vault', kind: 'vault', x: 9, y: 60, sublabel: 'passkey creds' },
    { id: 'container', label: 'Lightweight Container', kind: 'service', x: 31, y: 44, sublabel: 'login CLIs' },
    { id: 'control', label: 'Control Plane', kind: 'loadbalancer', x: 41, y: 16, sublabel: 'jobs board' },
    { id: 'machine', label: 'Fly Machine', kind: 'worker', x: 64, y: 40, sublabel: 'remote builder' },
    { id: 'neon', label: 'Neon', kind: 'database', x: 55, y: 74, sublabel: 'Postgres' },
    { id: 'model', label: 'Anthropic', kind: 'external', x: 90, y: 22, sublabel: 'Claude' },
    { id: 'github', label: 'GitHub', kind: 'external', x: 90, y: 60, sublabel: 'the code' },
  ],

  edges: [
    { id: 'ui-vault', from: 'ui', to: 'vault' },
    { id: 'vault-container', from: 'vault', to: 'container' },
    { id: 'ui-container', from: 'ui', to: 'container' },
    { id: 'container-neon', from: 'container', to: 'neon' },
    { id: 'ui-control', from: 'ui', to: 'control' },
    { id: 'control-machine', from: 'control', to: 'machine' },
    { id: 'machine-model', from: 'machine', to: 'model' },
    { id: 'machine-neon', from: 'machine', to: 'neon' },
    { id: 'machine-github', from: 'machine', to: 'github' },
  ],

  steps: [
    {
      id: 'cover',
      cue: 0,
      chapter: 'Chapter 6',
      cover: true,
      title: 'The app-builder & control plane',
      coverSubtitle: 'Build an app from a prompt in the browser — then ship it to real cloud infra.',
      narration: 'From a passkey-locked vault to a running Fly machine with its own Postgres.',
    },
    {
      id: 'idea',
      cue: "real cloud infrastructure",
      chapter: 'The idea',
      title: 'From the browser to the cloud',
      narration:
        'Everything so far ran *inside* the tab. The **app-builder** crosses the line: you describe an app, and it provisions and deploys **real cloud infrastructure** — a Fly machine, a Neon Postgres, a GitHub repo — to build it for you.',
      reveal: ['ui'],
      highlight: ['ui'],
    },
    {
      id: 'vault',
      cue: "separate passkey",
      chapter: 'Credentials',
      title: 'Unlock a standalone vault',
      narration:
        'First it needs cloud credentials. A **standalone vault** — its own passkey-encrypted store, separate from the IDE keychain — is unlocked with WebAuthn, decrypting your tokens into memory.',
      reveal: ['vault'],
      highlight: ['ui', 'vault'],
      messages: [{ from: 'ui', to: 'vault', kind: 'request', label: 'unlock' }],
    },
    {
      id: 'container',
      cue: "editorless sandbox",
      chapter: 'Credentials',
      title: 'A tiny container runs the logins',
      narration:
        'It boots a **lightweight almostnode container** (no editor) and seeds the decrypted files in. There you run real login CLIs — `gh auth login`, `fly auth login`, `neon` — and it watches the VFS to re-extract credentials as they change.',
      reveal: ['container'],
      highlight: ['vault', 'container'],
      badges: [{ node: 'container', text: 'gh · fly · neon', tone: 'info' }],
      messages: [
        { from: 'vault', to: 'container', kind: 'data', label: 'seed creds' },
        { from: 'ui', to: 'container', kind: 'request', label: 'gh auth login', delay: 900 },
      ],
    },
    {
      id: 'neon',
      cue: "real managed database",
      chapter: 'Provisioning',
      title: 'Provision a real Postgres',
      narration:
        'Need a database? The builder calls the **Neon** API (`console.neon.tech/api/v2`) to create a project and mint a scoped API key (`provisionNeonProjectAndKey`). A real Postgres, provisioned from a browser tab.',
      reveal: ['neon'],
      highlight: ['container', 'neon'],
      messages: [
        { from: 'container', to: 'neon', kind: 'request', label: 'POST /projects' },
        { from: 'neon', to: 'container', kind: 'response', label: 'project + key', delay: 1000 },
      ],
    },
    {
      id: 'control',
      cue: "kanban",
      chapter: 'The control plane',
      title: 'A board of projects & jobs',
      narration:
        'The **control plane** is a kanban board: **projects** live in local storage, **jobs** in the browser database. You name a project, write an initial prompt, and hit launch — that creates a job in the “starting” column.',
      reveal: ['control'],
      highlight: ['ui', 'control'],
      messages: [{ from: 'ui', to: 'control', kind: 'data', label: 'create job' }],
    },
    {
      id: 'env',
      cue: "bundle of settings",
      chapter: 'The control plane',
      title: 'Bundle everything into env vars',
      narration:
        'For the worker, it assembles every credential and selection into environment variables — `buildWorkerEnv`: `FLY_API_TOKEN`, `NEON_API_KEY`, `NEON_PROJECT_ID`, `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, plus `JOB_ID` and your `INITIAL_PROMPT`.',
      highlight: ['control'],
      badges: [{ node: 'control', text: 'buildWorkerEnv', tone: 'info' }],
    },
    {
      id: 'launch',
      cue: "virtual machine in the cloud",
      chapter: 'Deploying',
      title: 'Launch a Fly machine',
      narration:
        'Then it calls the **Fly Machines API** (`api.machines.dev/v1` → `POST /apps/{app}/machines`) to boot a machine running the `ghcr.io/replayio/app-building` image, with all those env vars and `auto_destroy` on. The remote builder is now live.',
      reveal: ['machine'],
      highlight: ['control', 'machine'],
      messages: [{ from: 'control', to: 'machine', kind: 'data', label: 'POST /machines' }],
    },
    {
      id: 'build',
      chapter: 'Deploying',
      title: 'The remote builder gets to work',
      narration:
        'Inside the machine, the builder clones its repo and runs — calling **Claude** (`ANTHROPIC_API_KEY`) to generate code, talking to its **Neon** Postgres, and pushing the result to a `job/…` branch on **GitHub**. Everything it needs was baked into the env.',
      reveal: ['model', 'github'],
      highlight: ['machine', 'model', 'neon', 'github'],
      messages: [
        { from: 'machine', to: 'model', kind: 'request', label: 'generate', duration: 650 },
        { from: 'machine', to: 'neon', kind: 'data', label: 'migrate', delay: 750, duration: 600 },
        { from: 'machine', to: 'github', kind: 'data', label: 'git push', delay: 1400, duration: 600 },
      ],
    },
    {
      id: 'monitor',
      chapter: 'Watching it',
      title: 'The board tracks every job',
      narration:
        'Back in the browser, the control plane polls **Fly logs** every few seconds (`fetchFlyLogsSince`) and moves the job card across columns — `starting → processing → idle`, or `error`. You watch a real deployment from a kanban board in your tab.',
      highlight: ['machine', 'control'],
      messages: [{ from: 'machine', to: 'control', kind: 'event', label: 'logs · status' }],
    },
    {
      id: 'recap',
      chapter: 'The whole picture',
      title: 'A prompt becomes infrastructure',
      narration:
        'A passkey unlocks a **vault**; a tiny **container** logs into the clouds; the builder provisions a **Neon** database; the **control plane** bundles it all into a **Fly machine** that calls **Claude**, runs the DB, and pushes to **GitHub** — while a kanban board tracks it. From a browser prompt to running infrastructure.',
      autoAdvanceMs: 9500,
      messages: [
        { from: 'ui', to: 'vault', kind: 'request', label: 'unlock', delay: 0, duration: 460 },
        { from: 'vault', to: 'container', kind: 'data', label: 'creds', delay: 420, duration: 460 },
        { from: 'container', to: 'neon', kind: 'request', label: 'provision', delay: 900, duration: 480 },
        { from: 'ui', to: 'control', kind: 'data', label: 'launch', delay: 1450, duration: 460 },
        { from: 'control', to: 'machine', kind: 'data', label: 'Fly machine', delay: 1950, duration: 500 },
        { from: 'machine', to: 'model', kind: 'request', label: 'build', delay: 2550, duration: 480 },
        { from: 'machine', to: 'github', kind: 'data', label: 'ship', delay: 3100, duration: 500 },
      ],
    },
  ],
};
