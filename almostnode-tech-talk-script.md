# almostnode — a tech‑talk narration (single voice)

> **Usage.** One narrator, read straight through (~16–18 min). Tech‑talk cadence — no
> source files, paths, or function names, just the ideas. Great as a voiceover for the
> video, any single‑voice TTS, or to record yourself. Section headers are only for
> navigation; the text is meant to flow continuously.

---

## Open

Let me describe a piece of software, and I want you to keep a running count of how many
times you think to yourself: *that's not possible.*

A complete development environment — an editor, package installs, a real dev server, hot
reload, an AI coding agent that edits your code and runs your commands, a VPN onto your
private network, and the ability to deploy a real app to real cloud infrastructure. All
of it running inside a single browser tab. No server doing the work behind the scenes.
Nothing installed on your machine.

It's called almostnode. And the name is the whole story, because almost everything in
this system is a very convincing illusion. There's a filesystem that isn't a disk. An
operating system that's just ordinary functions. A VPN that's WebAssembly. A browser
automation tool with no browser underneath it. And the trick — the thing that makes it
work — is that the *real* software running on top of all of this can't tell the
difference. So let's pull it apart, one layer at a time. Six of them.

---

## 1. The runtime — a Node-style world in a tab

Start at the bottom. Node — the runtime most server‑side JavaScript runs on — assumes
it's sitting on a computer. It wants a real filesystem; it wants to read a file and
execute it. A browser tab gives you none of that. So almostnode builds its own little
world in memory.

At the center is a virtual filesystem: an in‑memory filesystem that is the single source
of truth for everything. Your code, your dependencies, your configuration, your build
output — all of it lives there, as an object graph in the tab's memory. Nothing ever
touches your real disk. And critically, that filesystem is *watchable* — anything can
subscribe to "this just changed" — which, hold that thought, turns out to power half the
features we'll talk about.

Want to install a dependency? It fetches the real package, from the real public registry,
and unpacks it into that in‑memory filesystem. Real packages, fully resolved, with no
server in the middle.

Now, to actually run your code, there's a runtime. It reads a file out of the virtual
filesystem, rewrites the modern module syntax into the older style on the fly, wraps it
up, and evaluates it. It is, almost literally, a JavaScript engine running inside the
JavaScript engine the browser already gave you.

But here's the thing — there is no real Node here. So when your code reaches for one of
Node's built‑in capabilities, it doesn't hit the real thing; it hits a stand‑in. And the
stand‑in for the filesystem doesn't talk to a disk — it reads and writes that same
in‑memory filesystem. So the loop closes neatly: your code calls a built‑in, the built‑in
is a stand‑in, the stand‑in touches the virtual filesystem, and your code carries on,
none the wiser.

Now let's serve a live web app. almostnode runs a real dev server that reads your source
out of that in‑memory filesystem, exactly the way it would on a real machine. Except there
is no TCP, no socket. When the server "listens on a port," nothing actually binds — the
port just becomes a key in a lookup table, a *virtual* port.

So how does the preview load? The preview is an iframe, and a service worker — a piece of
the browser that can intercept network requests — catches the request before it ever
leaves. The browser genuinely believes it's loading an ordinary web page over the network.
The service worker reads the virtual port out of the request, hands it to the right dev
server, and that server does its work: it compiles your modern JavaScript and TypeScript
right there in the browser, using a bundler compiled to WebAssembly — no build server
anywhere — rewrites imports into bundles it can serve on demand, and wires in live
refresh. Then it returns a perfectly normal response — status, headers, body — back
through the service worker and into the iframe. As far as the page knows, it just talked
to a web server.

And hot reload needs no network at all. You edit a file, the filesystem fires a change
event, the dev server figures out the diff and pushes an update straight into the iframe,
and the component swaps in place without losing its state. No save‑to‑disk, no full
reload. If something's heavy, that same runtime can move off the main thread, so the
interface stays smooth, or run in an isolated frame to safely execute untrusted code.

So step back and look at what we've got: you write code into an in‑memory filesystem; a
runtime executes it against stand‑ins; installs pull real packages; and a dev server
serves a live, hot‑reloading app to an iframe through a service worker. A complete,
Node‑style stack — with no server — entirely inside one tab. That's layer one. The other
five build on it.

---

## 2. The keychain — secrets, without a disk

Here's a problem that falls right out of layer one. almostnode runs *real* command‑line
tools inside that sandbox — the kind of tools you'd use to talk to GitHub, or a cloud
provider, or an AI service. And those tools were written for a laptop. They expect to read
your credentials from a file on disk. But there is no disk, and you absolutely do not want
secrets sitting around in plain view in the page.

So, two moves. First, each sandbox gets its own virtual filesystem — and that's exactly
where credential files are allowed to live, right where the tools go looking for them.
Second, there's a keychain watching that filesystem.

Watch how a sign‑in actually works, because it's elegant. You click "sign in" in the
sidebar. The sidebar doesn't write the secret itself — instead it *runs the tool's normal
login command*. The tool does the real login and writes its credential file, into the
virtual filesystem. And the keychain, which has been watching, sees that file appear and
snapshots it. It doesn't grab everything indiscriminately — only the specific, registered
locations where credentials are supposed to live.

Now it needs to encrypt that snapshot, which means it needs a key — and here's the part I
love: it never stores one. It asks your passkey. The same hardware‑backed authentication
you use for fingerprint or face unlock hands back a secret, and from that secret it
derives an encryption key. The snapshot is encrypted and tucked into the browser's local
storage — just the ciphertext and the bits needed to decrypt it later. The key itself
only ever lives in memory, and it vanishes the moment you close the tab.

Reopen the environment tomorrow and the filesystem starts completely empty. The keychain
reads the encrypted vault, prompts your passkey, decrypts the snapshot, and writes the
credential files back into the filesystem. And as far as the tool is concerned, its
credentials were simply *there*, on disk, like always. It never sees the vault, never sees
the passkey, never knows any encryption happened. It just opens a file and reads it.

A few refinements make it robust. Some flows need to start a sandbox *before* you've
tapped your passkey, so there's a fast, live‑only mirror that disappears when the tab
closes. You can run several sandboxes at once, and on unlock every one of them gets the
restored credentials, with a newest‑wins rule so the freshest token always wins. And
beyond the built‑in tools, you can connect outside services through a standard
authorization popup — and those tokens take the exact same journey: they land as a file,
the keychain snapshots the change, and it's encrypted into the vault. While you're
unlocked, it quietly refreshes tokens before they expire, so long sessions never silently
die.

So that's the keychain: secrets come in through a sign‑in or an authorization flow, land
as ordinary files where tools expect them, and get mirrored — encrypted — into a
passkey‑protected vault, across every sandbox you have open. No server ever sees them.

---

## 3. The coding agents — a real agent, asking permission

Now the part everyone actually wants: an AI coding agent, living in the tab, editing your
files and running your commands. The headline one is OpenAI's Codex, whose core is
compiled to WebAssembly and runs right inside almostnode — the same tool you'd run in a
terminal, except the terminal is a browser tab. And there's a sibling agent that works the
same way; more on it in a second.

You talk to the agent through a chat panel, and each agent gets an adapter that knows how
to speak its particular dialect. And here's a fun detail: the agent is really a
command‑line program running in a terminal. So when you send a message, the adapter
*types your prompt into the agent's input*, as if you'd pasted it and hit enter.

Now, Codex's core is opaque WebAssembly running on a background thread, kept off the
interface so it can't freeze anything. But WebAssembly on a background thread is sealed
in — it can't touch files, it can't touch the network, on its own it can do nothing at
all. So how does it accomplish anything? It asks. Every single side effect — read a file,
run a command, make a network request — becomes a message to a host bridge running on the
main thread, and the bridge exposes a small, specific menu of operations. The agent stays
sandboxed; the bridge does the real work and hands back the result. If you've ever thought
about how a normal program asks the operating system to do the dangerous things — this is
exactly that, except *you* built the operating system, so you decide what's on the menu.

To think, the agent has to call its model — and a browser can't reach those services
directly across origins, so the request goes out through a swappable networking layer,
which routes it either over a simple proxy or over a full VPN. And it authenticates the
way everything else does: the token is sitting in a file, put there when you connected the
agent through the keychain. The bridge reads it, refreshes it if it's gone stale, and
attaches it.

The model streams its reply back — text, *and* tool calls. The agent pulls out the tool
calls and acts. A request to change a file becomes a patch applied to that same in‑memory
filesystem from layer one — so your editor and your live preview both update at once. A
request to run a command opens a terminal session and actually runs it — your tests, your
type‑checker, a quick directory listing — and captures the output. Each result is handed
back to the model, which reads it and decides the next move: another edit, another
command, or "done." That loop — think, act, observe, repeat — is the whole thing that
turns a chat completion into an *agent*. And every step of it streams into the chat as
messages and tool‑call cards, the edits and commands scrolling past as they happen.

The sibling agent plugs into the exact same sockets — a different brain in the same body.
It runs as normal code on the runtime, brings its own WebAssembly where it needs it,
including an embedded database, edits the same filesystem, runs the same shell, and can
talk to multiple model providers. Same machinery, different agent.

---

## 4. The preview — giving the agent eyes and hands

I said the agent can *see* the app it builds. Let me show you how, because it's one of my
favorite tricks. The app you build runs in a sandboxed iframe. It's a real running page —
but it is *not* a real browser tab. There's no developer tools to attach, no debugging
socket, no real browser‑automation tool to drive it. And yet you need to inspect it, drive
it like a user, and record it. Three jobs, one iframe.

First, inspect. As the service worker serves each page, it injects a small in‑page
developer console, plus a bridge. That bridge wraps the page's console and its network
calls and forwards every log, every request, every error up to the main application —
a developer‑tools‑style channel built entirely out of message passing. No real developer
tools required.

Second, drive. There's a browser‑automation shim with no browser beneath it. Real
automation drives a real browser; this one reaches straight into the iframe's page,
walks its structure, and builds an accessibility snapshot with stable little labels. So
the agent can say "click this element," and the shim fires a *real* click inside the page.
The app reacts exactly as if a person did it.

Third, record. A recorder captures every change to the page — every structural mutation,
plus clicks, keystrokes, scrolls, inputs, network calls, and errors — into a growing data
structure. And the key thing is it's *structural*, not a video. Ask for the recording and
it gets serialized into a single compact bundle, compressed, and uploaded to a replay
service — and now you have a recording you can scrub through moment by moment, that an AI
can analyze to figure out what went wrong.

Put the three together and the agent has eyes and hands. It can *see* the app — console
and network streamed back. It can *act* on it — real interactions. And it can *prove what
happened* — a replayable recording. A genuine feedback loop, with no real browser anywhere
in sight. That's a big deal, because it means the agent isn't writing code blind; it can
watch its own work and respond to it.

---

## 5. Tailscale — a private network, in WebAssembly

Sometimes the agent, or your app, needs to reach something *private* — an internal
service, a staging database, something that isn't on the public internet — or it needs to
route its traffic out through a specific machine. On a laptop you'd run a VPN. You can't
install anything in a tab. And there's a deeper problem: a browser tab fundamentally
*cannot* send the kind of raw network packets a modern VPN relies on.

The solution is to bring the real VPN client along, compiled to WebAssembly. To connect,
you start it, and it sends you over to authenticate with your account and approve this new
device — no keys to copy and paste. Once you're authenticated, you're on your private
network, and it learns the whole map: every device, its address, and which machines can
serve as exits.

Underneath, this is real WireGuard — the same VPN protocol you'd run natively — just
running in WebAssembly, with its own little network stack handling the plumbing the
operating system would normally do. But WireGuard normally rides on raw UDP packets,
which the browser simply won't send. So the trick is to change the *transport*, not the
protocol: the client encrypts each packet with WireGuard exactly as usual, and then
tunnels the ciphertext over a plain WebSocket to one of the VPN's always‑reachable relay
servers, which forwards it on. The encryption is identical; only the pipe is different.

Then you pick an exit — a machine on your network — and your traffic is routed to it,
encrypted the whole way, and comes out of *its* address, as if you were sitting right
next to it. And your code never sees any of this. It makes an ordinary request; the client
dials through the tunnel and hands back an ordinary response — whether that's from a
private service, or from the wider internet by way of your chosen exit. A real,
encrypted VPN, in a browser tab, because someone refused to take "browsers can't do UDP"
for an answer.

---

## 6. The app-builder — from a prompt to real infrastructure

Everything so far has lived *inside* the tab. This last layer deliberately crosses the
line. You describe an app in plain language, and it goes out and provisions and deploys
*real* cloud infrastructure to build it for you. Real machines, real money.

It runs like a relay race. First it unlocks a *separate* passkey‑protected vault — its
own, distinct from the development keychain — and decrypts your cloud credentials into
memory. Then it boots a stripped‑down, editor‑less sandbox and seeds those credentials in,
so you can run the real login flows for your cloud and code providers, watching for the
credentials as they appear. With those in hand, it provisions a real, managed database and
mints a scoped key for it — an actual production database, created from a browser tab.

It tracks all of this on a board — a kanban of projects and jobs. You name a project,
write a prompt, hit launch, and a card appears in the "starting" column. Behind that card,
it gathers every credential and choice into a bundle of settings and boots an actual
virtual machine in the cloud, running a prebuilt builder image, set to clean itself up
when it's done. That remote machine clones a repository, calls a large language model to
generate the code, talks to the database it was just given, and pushes the result up to a
branch on your code host. And the whole time, back in your browser, the board is polling
the machine's logs every few seconds and sliding the card across the columns — starting,
processing, done, or error.

So notice the division of labor: the heavy lifting happens on a disposable machine in the
cloud, but the *orchestration* — holding the secrets, making the calls, watching the
progress — stays in the browser. And the riskiest step of all, spending real money on real
infrastructure, is powered by the very same "watch for a credential, lock it behind a
passkey" machinery from layer two.

---

## Close

So that's the tour, and it's really one system told six times. A runtime builds an
in‑memory computer, and its watchable filesystem is the bedrock. A keychain uses that
filesystem to turn a credential file into a secret locked behind your passkey. Coding
agents run on the runtime, authenticate through the keychain, and earn every capability by
asking a host bridge for it. The preview tooling gives those agents eyes and hands. A real
VPN, in WebAssembly, lets them reach private networks. And the app‑builder takes the whole
pattern outward to command real clouds.

And every single layer is the same magic trick: emulate the real thing so faithfully that
the real software standing on top never realizes it's standing on a simulation. A real
filesystem, a real operating system, real developer tools, a real VPN, a real cloud
deploy — none of them quite real, all of them convincing. That's almostnode. And that's
why the name is the punchline.
