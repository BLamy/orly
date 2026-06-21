# almostnode, explained — a source for an audio deep‑dive

> **Framing note for the narration.** This document is meant to be turned into a
> conversational, two‑host audio deep‑dive (think: a curious host and a skeptical
> engineer who keeps asking "wait, how is that even possible?"). Audience: a smart
> software engineer who has never looked inside a browser tab this deeply. Aim for
> ~15 minutes, roughly two to three minutes per topic, and keep returning to the
> one big idea: **an entire cloud development environment — files, a Node runtime,
> coding agents, a private network, and real cloud deploys — running inside a single
> browser tab, with nothing installed.** Lean into the surprises. Each section below
> ends with "the clever bit" and a few "questions worth asking" — use those as the
> natural beats where the hosts get curious and push on each other.

---

## The big idea (read this first)

Normally, "a dev environment" means a machine: a Linux box, a container, a laptop
with Node and Git installed, a database somewhere, a VPN to reach private services.
**almostnode** (the runtime; the product brand is "agent‑wasm") collapses all of that
into one browser tab. There is no server doing the work behind the scenes and no
container daemon. The filesystem is an object in memory. The "operating system"
calls are JavaScript functions. The coding agent is WebAssembly running in a worker.
The VPN is WireGuard compiled to WASM. And when it finally does reach out to the real
cloud, it's to provision actual infrastructure — a real Postgres, a real virtual
machine — from inside the page.

The recurring theme across all six topics is **"fake it convincingly enough that real
tools don't notice."** Real CLIs think they're reading real files. A real coding agent
thinks it's calling a real operating system. A real preview thinks it's a real browser
tab being driven by a real Playwright. Almost nothing is "real" in the conventional
sense — hence *almost*node — yet the tools that run on top of it can't tell the
difference. That tension is the heart of the story.

---

## 1. How almostnode runs — the runtime

**The problem.** Node.js assumes an operating system: a real filesystem, a process
model, the ability to `require()` a file off disk and run it. A browser tab has none
of that. So how do you run Node‑style code — installing npm packages, running a dev
server, executing your project — with only the APIs a web page is given?

**How it works.** When you open a project, almostnode calls something like
`createContainer()` and stands up a miniature operating system in memory:

- A **Virtual FS** holds everything — your source, `node_modules`, configs, build
  output — as an object graph in the tab's memory. Nothing touches your real disk.
  Crucially, the Virtual FS is *watchable*: anything can subscribe to "this file
  changed," which is what makes hot reload and the keychain (topic 2) possible.
- A **Runtime** actually executes code. To run a file it reads the bytes from the
  Virtual FS, rewrites any modern `import`/`export` (ES modules) into the older
  CommonJS form on the fly, wraps it, and evaluates it. It is, almost literally, a
  JavaScript engine running *inside* the JavaScript engine the browser already gave
  you.
- Around that sit roughly **forty Node "shims"** — stand‑ins for the built‑in modules
  Node programs expect (`fs`, `path`, `process`, and so on), reimplemented to talk to
  the Virtual FS instead of a real disk.
- A **package manager** installs real npm packages into the Virtual FS, in the
  browser, from the public registry.
- A **dev server** (Vite‑style) and a **Service Worker** team up to serve your running
  app, and **esbuild compiled to WebAssembly** does the fast bundling. When you save a
  file, the watcher fires and **hot module replacement** swaps the change in live.

**The clever bit.** Every layer is a polite lie that something real accepts as truth.
The shims convince npm packages they're on a normal machine; the Service Worker
convinces the browser your in‑memory app is a real website. The "computer" is a graph
of objects, and "running your code" is one JS engine interpreting code for another.

**Questions worth asking.**
- If the filesystem is just an object in memory, what happens when you refresh — and
  what would it take to make it persistent?
- Why rewrite ES modules to CommonJS at runtime instead of ahead of time?
- Where's the line between "this is a clever emulation" and "this is just… Node now"?

---

## 2. The keychain — secrets as files

**The problem.** almostnode runs *real* command‑line tools — `claude`, `gh` (GitHub),
`aws` — inside the browser sandbox. Those tools were written for a laptop: they expect
to read credentials **from disk** (a tokens file in your home directory). But there is
no disk, and you definitely don't want secrets sitting in plain memory or, worse, in
the page where any script could read them. So how do real CLIs get authenticated
without a real, secure disk?

**How it works.** Each sandbox gets its own Virtual FS, and that's where credential
files are allowed to live — exactly where the CLIs look for them. The **keychain** arms
file‑system watchers on that Virtual FS. The instant a managed credential file changes,
it snapshots every credential file and **encrypts the bundle into a vault**. The vault
is protected by a **passkey** — WebAuthn with the PRF extension, which lets your
device's secure hardware derive an encryption key — and the encrypted blob is stored in
the browser's `localStorage`. Decryption only happens locally, in memory, when a tool
actually needs the secret.

The sign‑in flow is a nice little dance: you click "sign in" in the sidebar, which
**runs a command in the CLI**; the CLI **writes a credentials file**; the **watcher
notices the new file** and the keychain encrypts it into the vault. OAuth tokens take
the *exact same path* — an orchestrator writes the tokens to a file on the Virtual FS,
the keychain snapshots the change, and it's encrypted into the vault like everything
else.

**The clever bit.** "Secrets as files" turns an awkward problem (authenticating real
tools with no disk) into one uniform pipeline: *file appears → watcher fires → encrypt
into a passkey‑guarded vault.* Everything — manual logins, OAuth callbacks, multiple
sandboxes — flows through that same choke point.

**Questions worth asking.**
- Why is "watch for a file, then encrypt it" a better design than handing secrets
  directly to each tool?
- What does a passkey/WebAuthn buy you that a password‑derived key wouldn't?
- If `localStorage` holds the encrypted vault, what's the threat model — what attack
  does this stop, and what does it *not* stop?

---

## 3. Coding agents — Codex and opencode

**The problem.** You want a real AI coding agent — OpenAI's Codex, or opencode — living
in the tab, editing files and running commands. But these agents are big, sometimes
compiled programs that expect a real OS. How do you run one safely in a web page and
still let it *do* things (touch files, run commands, hit the network)?

**How it works.** You talk to the agent through a **chat panel**, and each agent gets an
**adapter** — chosen by its "harness" — that knows how to speak that particular agent's
dialect. The interesting case is **Codex**, whose core is shipped as opaque
**WebAssembly** running in a **Web Worker**, deliberately kept off the main UI thread so
it can't freeze the interface. But here's the catch: WASM in a worker is sandboxed — it
*can't* touch files or the network on its own. So how does it accomplish anything?

It asks. Every side effect is a **host request**: the WASM sends a message to a **Host
Bridge** running on the main thread, and the bridge exposes a small menu of operations —
file access, command execution, network fetches. The WASM stays sealed in its sandbox;
the bridge does the real work and hands results back. Authentication follows the topic‑2
pattern: the token lives in a file (written when you connected the agent in the
keychain), the bridge reads it, refreshes it if it's stale, and attaches it.

**opencode** is the other shape: it runs as Node code (on the runtime from topic 1) and
brings its own WebAssembly where it needs it — for example, an in‑browser Postgres. Both
agents run the same **agentic loop**: think, call a tool, observe the result, repeat.

And when an agent needs to reach the outside world, it doesn't get raw network access —
it goes through a swappable **networking layer**. That layer can be a simple CORS proxy
or the full Tailscale path (topic 5), which is why egress is described as
"the networking layer," not just "a proxy."

**The clever bit.** The agent is sandboxed *by default* and earns capabilities only by
asking the host for them, one well‑defined request at a time. That's a clean security
boundary: a powerful, partly‑opaque program that literally cannot do anything you
haven't exposed through the bridge.

**Questions worth asking.**
- Why ship the agent's core as WebAssembly at all, rather than plain JavaScript?
- The "ask the host for every side effect" model — how is that different from a normal
  program's syscalls, and why is it safer here?
- If you can swap the networking layer under the agent, what does that let you do that a
  laptop agent can't?

---

## 4. Driving and recording the preview

**The problem.** The app you build renders in a sandboxed `<iframe>`. It's a real
running page — but it is *not* a real browser tab. There's no DevTools to attach, no
Chrome DevTools Protocol socket, no real Playwright browser to drive it. So how do you
*inspect* it, *drive* it like a user, and *record* it well enough to replay later?

**How it works.** Three tools watch the one iframe:

- **Inspect.** As the Service Worker serves each HTML response, it injects **eruda** (an
  in‑page DevTools console) plus a small bridge script. The bridge wraps `console.*` and
  `fetch`/XHR and posts every log, network call, and error up to the host page with
  `postMessage` (on channels like `almostnode-console` and `almostnode-network`). It's a
  DevTools‑Protocol‑*style* channel built entirely out of message passing.
- **Drive.** A **Playwright‑style shim** acts on the page. With no real browser or
  protocol socket, it reaches straight into the iframe's DOM, walks it, and builds an
  *accessibility snapshot with stable refs* — so an agent can say "click element e3" and
  the shim dispatches a real DOM click inside the iframe. The app responds as if a human
  did it; a test recorder can even watch those actions and write a spec.
- **Record.** The dev server injects a capture script that starts **rrweb**, which
  records every DOM mutation — plus clicks, keystrokes, scrolls, inputs, network calls,
  and errors — into a growing `simulationData` array. It's a *structural* recording, not
  a video. Ask for it and the host sends a `@@replay‑nut` message into the iframe; the
  script serializes everything and posts it back as one binary buffer. The host gzips it
  and uploads it to **Replay** (`dispatch.replay.io`), producing a **replayable
  recording** you can scrub frame‑by‑frame — and that Replay's AI can analyze to debug
  what went wrong.

**The clever bit.** Put the three together — inspect, drive, record — and a coding agent
gets a genuine feedback loop: it can *see* the app it just built (console + network
streamed back), *act* on it (real DOM events), and *prove what happened* (a replayable
recording), all without ever leaving the tab. No real browser, no real DevTools, no real
Playwright — and yet, functionally, all three.

**Questions worth asking.**
- Why is a structural DOM recording (rrweb) more useful than a screen video for
  debugging?
- The Playwright shim has no browser underneath it — what can it do that real Playwright
  can't, and where does the illusion break down?
- How much does "the agent can watch and drive its own output" change what an AI coder
  can accomplish?

---

## 5. Tailscale — a private network, in WebAssembly

**The problem.** The agent and your app often need to reach **private** services — an
internal API, a database, a staging box — that aren't on the public internet. On a
laptop you'd install a VPN. You can't install anything in a browser tab. And worse,
browsers fundamentally **cannot send UDP packets**, which is exactly what modern VPNs
use. So how do you join a private network from a web page?

**How it works.** almostnode ships a **Tailscale client compiled to WebAssembly** (the
real `tailscale` CLI logic, as WASM). To connect, it sends you to **Tailscale to log
in** using that CLI — effectively `tailscale up`. You authenticate, you're **connected
to your tailnet** (your private mesh of machines), and you **pick your exit node** — the
machine your traffic should appear to come from. Under the hood it's **WireGuard**, the
same VPN protocol you'd run natively, just running inside the page.

The UDP problem is solved by relaying. Because the browser can't speak UDP, the WireGuard
packets are tunneled over a **WebSocket** to a **DERP** relay (Tailscale's relay
servers), which forwards them on. A user‑space network stack ("netstack") handles the IP
plumbing that the OS would normally do. The result: from inside a browser tab, the agent
can `curl` a service that only exists on your private network.

**The clever bit.** This is a genuine, encrypted WireGuard tunnel — not a proxy, not a
hack — running in WASM and squeezed through a WebSocket because the browser won't let it
use UDP. A web page becomes a real node on your private mesh network.

**Questions worth asking.**
- Why can't a browser send UDP, and why does that single limitation force the whole
  WebSocket‑relay design?
- What's the difference between this and just routing requests through a CORS proxy
  (which is the other option in the networking layer)?
- "Pick your exit node" — why does where your traffic *appears* to come from matter for a
  coding agent?

---

## 6. The app‑builder — from a prompt to real infrastructure

**The problem.** Everything so far lives *inside* the tab. The app‑builder crosses the
line: you describe an app in plain language, and it provisions and deploys **real cloud
infrastructure** to build it for you. How do you safely orchestrate real clouds —
spending real money, creating real databases — from a browser?

**How it works.** It's a relay race of credentials and provisioning:

1. **Unlock a standalone vault.** Separate from the IDE keychain, the app‑builder has its
   own passkey‑encrypted vault. WebAuthn unlocks it and decrypts your cloud tokens into
   memory.
2. **A tiny container runs the logins.** It boots a *lightweight* almostnode container
   (no editor) and seeds the decrypted credentials in, so you can run the real login CLIs
   — `gh auth login`, `fly auth login`, `neon` — and it watches the Virtual FS to
   re‑extract credentials as they change (topic 2, again).
3. **Provision a real database.** It calls the **Neon** API (`console.neon.tech`) to
   create a project and mint a scoped key — a real Postgres, provisioned from a tab.
4. **The control plane.** A kanban board tracks work: *projects* live in local storage,
   *jobs* in the browser's database. You name a project, write an initial prompt, hit
   launch, and a job appears in the "starting" column.
5. **Bundle everything into env vars.** A helper assembles every credential and choice
   into environment variables — the Fly token, the Neon key and project id, a GitHub
   token, an Anthropic API key, plus the job id and your prompt.
6. **Launch a Fly machine.** It calls the **Fly Machines API** (`api.machines.dev`) to
   boot a virtual machine running a prebuilt builder image, with all those env vars and
   "auto‑destroy" turned on. The remote builder is now live.
7. **The builder works; the board watches.** Inside the machine, the builder clones its
   repo and runs: it calls **Claude** to generate code, talks to its **Neon** Postgres,
   and pushes the result to a branch on **GitHub**. Back in the browser, the control
   plane polls Fly's logs every few seconds and slides the job card across columns —
   starting → processing → idle, or error.

**The clever bit.** A passkey unlocks a vault; a throwaway container logs into the
clouds; a database is provisioned; a control plane bundles it all into a disposable VM
that calls an AI model and ships code to GitHub — and you watch the whole real
deployment from a kanban board in a browser tab. The same "secrets as files / watch the
Virtual FS" machinery from topic 2 quietly powers the riskiest step.

**Questions worth asking.**
- Why use a *separate* vault for the app‑builder instead of reusing the IDE keychain?
- The actual building happens on a remote Fly machine, not in the tab — so what *is* the
  browser's job here, and why keep it in the browser at all?
- "Auto‑destroy" machines and scoped, short‑lived keys — what failure modes is that
  guarding against?

---

## How the six pieces connect

It's one system, told in six passes:

- The **runtime** (1) creates the in‑memory computer — and its *watchable Virtual FS* is
  the foundation everything else builds on.
- The **keychain** (2) uses that watchable filesystem to turn "a file appeared" into "a
  secret, safely encrypted behind a passkey."
- The **agents** (3) run on the runtime, authenticate via the keychain, and reach the
  world through a swappable networking layer.
- The **preview tooling** (4) gives those agents eyes and hands — see the app, drive it,
  record it — using the same Service Worker that serves it.
- **Tailscale** (5) is the serious option for that networking layer: a real WireGuard VPN
  in WASM, so the agent can reach private services.
- The **app‑builder** (6) takes the whole pattern outward, using the same vault‑and‑watch
  machinery to safely command real clouds.

The unifying trick, again: **emulate the real thing precisely enough that real software
accepts the emulation** — a real filesystem, a real OS, real DevTools, a real VPN, a real
cloud — none of them quite real, all of them convincing.

---

## Key terms (a quick glossary for the hosts)

- **WebAssembly (WASM):** a way to run compiled languages (Rust, Go, C++) at near‑native
  speed inside the browser. Used here for the Codex agent, the Tailscale client, and
  esbuild.
- **Web Worker:** a background thread in the browser, so heavy work doesn't freeze the
  UI. Codex's WASM core runs in one.
- **Virtual FS:** an in‑memory, watchable stand‑in for a real filesystem.
- **Shim:** a drop‑in replacement for a real API (here, Node's built‑in modules) that
  redirects to the emulated environment.
- **Service Worker:** browser‑provided code that can intercept network requests — used to
  serve the preview and inject tooling.
- **Passkey / WebAuthn (PRF):** hardware‑backed authentication; the PRF extension lets the
  device derive an encryption key, which protects the credential vault.
- **WireGuard / DERP:** WireGuard is the VPN protocol; DERP is Tailscale's relay that
  forwards packets when a direct (UDP) connection isn't possible — as in a browser.
- **rrweb:** records DOM changes and interactions as structured data, enabling exact
  replay without a video.
- **Control plane:** the dashboard layer that tracks and orchestrates jobs (here, a kanban
  board of build jobs).

---

## Questions worth exploring (great for the interactive Q&A)

These are good prompts for a listener to ask the hosts, or for the hosts to debate:

1. What is the single biggest reason to put *all* of this in a browser tab instead of a
   cloud VM the user connects to? Convenience, security, cost, or something else?
2. The whole system is built on convincing emulations. Where is that genuinely *better*
   than the real thing — and where is it strictly a workaround?
3. Secrets live as files in an in‑memory filesystem, encrypted behind a passkey. Walk
   through what an attacker would actually have to do to steal a credential.
4. A coding agent here can see, drive, and record its own app. How does that change what
   "an AI that writes code" can realistically accomplish versus one that only emits text?
5. Browsers can't send UDP, so a real VPN gets tunneled over WebSockets to a relay. What
   other "the browser won't let you" limits shaped these designs?
6. The app‑builder spends real money on real infrastructure from a tab. What guardrails
   would you want before trusting that, and which ones are already here?
7. If you had to remove one of the six pieces, which is the keystone — the one the others
   can't live without?

---

## The one‑paragraph summary (a good closing beat)

almostnode is a complete development environment that lives inside a single browser tab.
A runtime emulates Node — its filesystem is an object in memory, its OS calls are
JavaScript. Real command‑line tools authenticate through a keychain that watches that
filesystem and locks every credential into a passkey‑protected vault. Coding agents like
Codex run as sandboxed WebAssembly and earn the right to touch files, run commands, or
hit the network only by asking a host bridge. The app they build runs in an iframe the
system can inspect, drive, and record — giving the agent a real feedback loop. When it
needs private services, a full WireGuard VPN runs in WASM, tunneled over WebSockets
because browsers can't speak UDP. And when you ask for a whole app, the app‑builder
unlocks a separate vault, logs into the clouds, provisions a real Postgres, and launches
a disposable virtual machine that calls Claude and ships code to GitHub — all watched
from a kanban board in the tab. The through‑line: emulate each real thing so faithfully
that real software never realizes it's standing on a simulation.
