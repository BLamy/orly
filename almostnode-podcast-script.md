# almostnode — a deep‑dive podcast script

> **How to use this with NotebookLM.** Upload this file as a source and generate an
> Audio Overview — NotebookLM will follow the flow and the two‑host dynamic below. Or,
> in the Audio Overview "Customize" box, paste: *"Follow the attached script's structure
> and tone: two hosts, Alex (curious) and Sam (the engineer who explains). ~18 minutes,
> conversational, emphasize the surprising parts."* You can also just read it aloud or
> drop it into any TTS. Two speakers: **ALEX** (host, asks the smart‑naïve questions)
> and **SAM** (engineer, explains and occasionally gets amazed too).

---

**ALEX:** Okay, I want to start with a claim that sounds fake. Ready?

**SAM:** Always.

**ALEX:** A full software development environment — the file system, a Node.js runtime,
an AI coding agent, a VPN into a private network, *and* the ability to deploy a real app
to the real cloud — all of it running inside a single browser tab. No server doing the
work in the background. Nothing installed.

**SAM:** Yeah. That's the thing we're talking about today. It's called almostnode.

**ALEX:** "Almost" node. I assume the name is doing a lot of work there.

**SAM:** It's the whole story, honestly. Almost everything in this system is a really
convincing fake. There's a filesystem that isn't a disk. An operating system that's just
JavaScript functions. A VPN that's WebAssembly. A Playwright that has no browser under
it. And the magic trick is — the *real* tools that run on top of all this can't tell.

**ALEX:** That's the through‑line? Fake it well enough that real software doesn't notice?

**SAM:** That's the whole philosophy. Let's just walk through it, because each layer pulls
the same trick in a slightly different way. Six pieces.

**ALEX:** Start me at the bottom. The runtime.

---

**SAM:** So. Node.js — the thing most backend JavaScript runs on — assumes it's on a
computer. It wants a real filesystem, it wants to read a file off disk and execute it. A
browser tab gives you none of that.

**ALEX:** Right, a web page can't just open `/home/me/project` and run it.

**SAM:** Exactly. So almostnode builds a little operating system in memory. There's a
**Virtual FS** — a virtual filesystem — and your code, your `node_modules`, your build
output, all of it lives there as basically a big object graph in the tab's memory.
Nothing ever touches your actual hard drive.

**ALEX:** Hold on — if my whole project is an object in memory, doesn't it vanish when I
refresh?

**SAM:** That's the right question to ask, and yes, that's a real design tension — it has
to be persisted somewhere deliberately. But here's the part that matters: that virtual
filesystem is *watchable*. Anything can subscribe to "hey, this file just changed." Hold
onto that, because it turns out to be the foundation for almost everything else.

**ALEX:** Noted. So files live in memory. How does code actually *run*?

**SAM:** There's a piece called the **Runtime**. To run a file, it reads the bytes out of
the virtual filesystem, rewrites the modern `import`/`export` syntax into the older
`require` style on the fly, wraps it up, and evaluates it.

**ALEX:** So it's… a JavaScript engine, running inside the JavaScript engine the browser
already has.

**SAM:** Literally. It's JavaScript all the way down. And then around that core there are
something like forty little "shims" — fake versions of Node's built‑in modules, `fs` and
`path` and `process` and so on — that quietly redirect to the virtual filesystem instead
of a real disk. There's a package manager that installs real npm packages, in the
browser. A Vite‑style dev server. esbuild — the bundler — compiled to WebAssembly so it's
fast. And when you save a file, that watcher fires and hot‑reloads the change instantly.

**ALEX:** So an npm package that thinks it's writing a file to disk…

**SAM:** …is writing into an object in memory and has no idea. That's the polite lie. And
it's the first of six.

---

**ALEX:** Okay, topic two. You teed up the keychain. Why do we even need one?

**SAM:** Because almostnode runs *real* command‑line tools inside that sandbox. The actual
`claude` CLI, the GitHub CLI, the AWS CLI. And those tools were written for a laptop —
they expect to read your credentials from a file on disk. Your home directory, a tokens
file, that kind of thing.

**ALEX:** And there's no disk. Again.

**SAM:** No disk. And you really don't want secrets just sitting around in the page in
plain text where any script could grab them. So here's the move: each sandbox gets its
own virtual filesystem, and that's exactly where the credential files are allowed to live
— right where the CLIs go looking. And then the **keychain** sits there watching that
filesystem.

**ALEX:** Using the "watchable" thing from before.

**SAM:** Using exactly that. The moment a credential file shows up or changes, the
keychain snapshots all the credentials and encrypts the whole bundle into a vault. And
the vault is locked with a passkey.

**ALEX:** A passkey — like the fingerprint / face‑unlock thing instead of a password.

**SAM:** Right, WebAuthn. There's an extension to it called PRF that lets your device's
secure hardware derive an actual encryption key. So the encrypted vault sits in the
browser's local storage, and it only ever gets decrypted locally, in memory, the instant
a tool actually needs the secret.

**ALEX:** Walk me through signing in, then. Concretely.

**SAM:** It's a cute little chain. You click "sign in" in the sidebar. That *runs a command
in the CLI*. The CLI does its normal thing and *writes a credentials file*. The watcher
*notices the new file* — and the keychain encrypts it into the vault. Nobody hand‑delivers
the secret anywhere. And OAuth logins take the exact same path: something writes the
tokens to a file, the watcher fires, it's encrypted. One pipeline for everything.

**ALEX:** So the trick here is turning "authenticate a bunch of different real tools" into
just "watch for a file and encrypt it."

**SAM:** That's the elegance of it. One choke point.

---

**ALEX:** Topic three — the part everyone actually wants. AI coding agents. In the tab.

**SAM:** Right. So you want a real agent — OpenAI's Codex, or one called opencode — living
in there, editing your files, running your commands. Codex is the wild one. Its core ships
as WebAssembly, and it runs in a Web Worker.

**ALEX:** Web Worker meaning… a background thread, so it doesn't freeze the page.

**SAM:** Exactly. But here's the catch, and it's a good one: WebAssembly in a worker is
sandboxed. It *can't* touch files. It *can't* hit the network. On its own it can do
basically nothing.

**ALEX:** So you've got this powerful AI agent that's been put in a padded room with no
doors.

**SAM:** [laughs] Pretty much. So how does it do anything? It *asks*. Every single side
effect — read a file, run a command, make a network request — is a message it sends to
something called the **Host Bridge**, running on the main thread. The bridge exposes a
small, specific menu of operations. The agent says "please read this file," the bridge
does it and hands back the result.

**ALEX:** That's basically… syscalls. Like how a normal program asks the operating system
to do the dangerous stuff.

**SAM:** That's a perfect way to put it. It's syscalls, except *you* built the operating
system, so you decide exactly what's on the menu. The agent is sandboxed by default and
earns each capability one explicit request at a time. From a security standpoint that's
really clean — a powerful, partly‑opaque program that genuinely cannot do anything you
didn't expose.

**ALEX:** And it authenticates how?

**SAM:** Same as topic two — the token's in a file, written when you connected the agent in
the keychain. The bridge reads it, refreshes it if it's gone stale, attaches it. opencode
is the other flavor — it runs as normal Node code on that runtime, and brings its own
WebAssembly where it needs it, like an in‑browser Postgres database. Both of them run the
same loop: think, call a tool, look at the result, think again.

**ALEX:** And when the agent needs the internet?

**SAM:** It doesn't get raw access. It goes through a swappable *networking layer*. That
can be a simple proxy — or it can be the full VPN setup, which is the next topic.

---

**ALEX:** Before the VPN — topic four — you said the agent can "see" the app it builds.
How? It's just code generating code.

**SAM:** This is my favorite part, actually. The app you build runs in a sandboxed iframe.
It's a real running page — but it is *not* a real browser tab. No DevTools to attach, no
debugger protocol, no real Playwright to drive it. And yet you need to inspect it, drive
it like a user, and record it. Three tools, one iframe.

**ALEX:** Start with inspect.

**SAM:** As the Service Worker serves each page, it injects a little in‑page dev console
called eruda, plus a bridge script. That bridge wraps the console and the network calls,
and posts every log, every request, every error up to the main app. It's a
DevTools‑*style* channel built entirely out of message passing.

**ALEX:** So it fakes the "open DevTools and watch the console" experience.

**SAM:** Without any DevTools, yeah. Then — driving. There's a Playwright‑style shim.
Real Playwright drives a real browser; this one has no browser at all. So it reaches
straight into the iframe's DOM, walks it, and builds an accessibility snapshot with
stable little labels — refs. So the agent can literally say "click element e3," and the
shim fires a real click inside the iframe. The app reacts like a human did it.

**ALEX:** And recording?

**SAM:** A tool called rrweb. It records every change to the page — every DOM mutation,
plus clicks, keystrokes, scrolls, network calls, errors — into a growing data structure.
And the key thing: it's *structural*, not a video. When you ask for it, it serializes the
whole session into one binary blob, gzips it, and uploads it to a service called Replay.
And now you've got a recording you can scrub through frame by frame — and Replay's AI can
analyze it to figure out what went wrong.

**ALEX:** So put the three together and the agent has eyes and hands.

**SAM:** That's exactly it. It can *see* the app — console and network streamed back. It
can *act* on it — real DOM events. And it can *prove what happened* — a replayable
recording. A real feedback loop, no real browser anywhere in sight. That's a big deal for
how much an AI coder can actually accomplish, because it's not flying blind.

---

**ALEX:** Okay. The VPN. Topic five. You keep saying the agent needs to reach private
stuff.

**SAM:** Right — internal APIs, a staging database, services that aren't on the public
internet. On a laptop you'd install a VPN. You can't install anything in a tab. And
there's a deeper problem: browsers physically *cannot* send UDP packets.

**ALEX:** And modern VPNs use UDP.

**SAM:** They love UDP. So this seems impossible. The solution: almostnode ships the
actual Tailscale client compiled to WebAssembly. To connect, it sends you over to
Tailscale to log in using that CLI — basically `tailscale up`. You authenticate, you're
connected to your tailnet — your private mesh of machines — and you pick your exit node,
which is the machine your traffic should look like it's coming from.

**ALEX:** And under the hood it's a real VPN protocol?

**SAM:** It's WireGuard. The real thing, just running in WebAssembly. And the UDP problem
gets solved by relaying — since the browser can't speak UDP, the WireGuard packets get
tunneled over a WebSocket to one of Tailscale's relay servers, called DERP, which forwards
them on. There's a little user‑space network stack handling the IP plumbing the operating
system would normally do.

**ALEX:** So the browser tab becomes an actual node on your private network.

**SAM:** A real, encrypted member of your mesh. Not a proxy, not a hack around it — a
genuine WireGuard tunnel, squeezed through a WebSocket because the browser won't hand it
UDP. From inside a tab, the agent can hit a service that only exists on your private
network.

---

**ALEX:** And then topic six is where it stops being "all in the tab," right? It reaches
out for real.

**SAM:** This is the one that made me sit up. The app‑builder. You describe an app in
plain English, and it goes and provisions and deploys *real cloud infrastructure* to build
it for you. Real money, real machines.

**ALEX:** From the browser.

**SAM:** From the browser. And it's a little relay race. First it unlocks a *separate*
passkey vault — its own, not the IDE's keychain — and decrypts your cloud tokens into
memory. Then it boots a tiny, stripped‑down almostnode container — no editor — and seeds
those credentials in, so you can run the real login CLIs. GitHub, Fly, Neon. And it
watches the virtual filesystem to re‑extract credentials as they change.

**ALEX:** There's the file‑watching trick again.

**SAM:** It's everywhere once you see it. Then it calls the Neon API to provision a real
Postgres database and mint a scoped key. There's a control plane — a kanban board, really
— where projects live in local storage and jobs live in the browser's database. You name a
project, write a prompt, hit launch, and a card shows up in the "starting" column.

**ALEX:** And then the actual building happens where?

**SAM:** Not in the tab. It bundles every credential and choice into a set of environment
variables, and then calls the Fly Machines API to boot an actual virtual machine running a
prebuilt builder image — with auto‑destroy turned on so it cleans itself up. That machine
clones a repo, calls Claude to generate the code, talks to its Neon database, and pushes
the result to a branch on GitHub. And the whole time, back in your browser, the control
plane is polling the machine's logs every few seconds and sliding that job card across the
board — starting, processing, done. Or error.

**ALEX:** So the browser's job is… orchestration. It's the conductor.

**SAM:** That's a great way to say it. The browser holds the secrets, makes the calls, and
watches. The heavy lifting is on a disposable machine in the cloud. And notice — the
riskiest step, spending real money on real infrastructure, is powered by the same
"secrets‑as‑files, watch the filesystem" machinery from topic two.

---

**ALEX:** So pull it together for me. Six pieces.

**SAM:** It's really one system told six times. The runtime builds an in‑memory computer —
and its watchable filesystem is the bedrock. The keychain uses that filesystem to turn "a
file appeared" into "a secret, locked behind a passkey." The agents run on the runtime,
authenticate through the keychain, and reach the world through a swappable networking
layer. The preview tooling gives those agents eyes and hands. Tailscale is the serious
version of that networking layer — a real VPN in WebAssembly. And the app‑builder takes
the whole pattern outward to command real clouds.

**ALEX:** And every single layer is the same magic trick.

**SAM:** Emulate the real thing so faithfully that real software never realizes it's
standing on a simulation. A real filesystem, a real OS, real DevTools, a real VPN, a real
cloud deploy — none of them quite real, all of them convincing. That's almostnode.

**ALEX:** I came in thinking the claim was fake. I'm leaving thinking the claim is fake —
and that's the point.

**SAM:** [laughs] That's exactly the point.

**ALEX:** Perfect place to stop. Thanks, Sam.

**SAM:** Anytime.
