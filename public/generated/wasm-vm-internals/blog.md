# Linux in a Tab

*Grounded in [`~/Dev/wasm-vm`](https://github.com/BLamy/wasm-vm) — the RISC-V machine that boots unmodified Alpine riscv64 in a browser tab. Five subsystems: the chunked disk, the network, the snapshot, the time travel it is nearly capable of — and the swarm that could serve all of it.*

## Chapter 1 · Only the Blocks You Touch

The Alpine root filesystem wasm-vm boots is `alpine-rootfs.ext4` — 805,306,368 bytes of real ext4. Downloading that before showing a login prompt is the obvious design and a bad one: it is a minute of progress bar on a good connection and a closed tab on a bad one.

So the image is cut. `tools/build_image/build.sh` produces the artifact set described in `docs/design/image-pipeline.md`: a `manifest.json` with `image_len`, `chunk_size` and the ordered SHA-256 of every chunk, plus one immutable file per chunk under `chunks/`. At the committed 128 KiB chunk size that is 6,144 chunks — and because each is named by its own hash, identical chunks collapse: the real `releases/chunked-alpine/chunks/` holds **3,765 distinct objects**, every one of them safe to serve `Cache-Control: immutable` forever, since its name *is* its content.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-1-3.png" alt="The disk image drawn as a grid of 6,144 chunks with the dedupe count"><figcaption>6,144 chunks of 128 KiB, deduped to 3,765 content-addressed files.</figcaption></figure>

What makes this work is that Linux never asks for a disk image. It asks virtio-blk for a few kilobytes at an offset, and `ChunkIndex` (in `crates/storage`) turns that into one division: `offset / chunk_size` is the chunk, `offset % chunk_size` is how far into it.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-1-5.png" alt="A 4 KiB guest read resolved to chunk 67 by one division"><figcaption>One 4 KiB read, one chunk, one division — no index to consult.</figcaption></figure>

That chunk is fetched, hashed, and checked against the manifest before any byte reaches the guest. Every failure mode in `crates/storage` is a typed `ImageError` — `HashMismatch`, `TruncatedChunk`, `OffsetOutOfRange` — never a panic and never silently wrong data, because a hand-edited manifest and a flipped byte are both things a browser can be handed.

Then the payoff. `tools/build_image/record_boot_profile.sh` boots the image on the native CLI with `--profile-boot --blk-log`, stops at getty's `login:`, and writes the ordered first-touch chunk list to `boot-profile.json`. That file has **100 entries**.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-1-8.png" alt="The recorded 100-chunk boot profile lighting up across the image"><figcaption>The real recorded profile: 100 chunks — 12.5 MB of a 768 MB disk — reaches a login prompt.</figcaption></figure>

Two refinements keep it honest under load. `Readahead` in `crates/storage/src/prefetch.rs` treats three consecutive chunks as a stream (not a coincidence) and fetches the next four ahead of the guest, so copying a large file does not pay a round trip per block. And writes never invalidate any of it: the base image is immutable, so a write lands in a copy-on-write overlay at 4 KiB granularity (`OVERLAY_BLOCK = 4096`) and reads merge the overlay over the chunks beneath — the size chosen because dirtying a 128 KiB chunk for a 512-byte write would be roughly 256× write amplification.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-1-10.png" alt="Writes landing in a sparse 4 KiB copy-on-write overlay above the immutable chunks"><figcaption>Writes go to a sparse overlay; the cached chunks stay valid forever.</figcaption></figure>

## Chapter 2 · The Tab Is the Node

The guest is stock Alpine, which means it expects a network card, a DHCP server, a gateway and a resolver. It gets all four — from `crates/slirp`, a TCP/IP stack compiled into the emulator, using the QEMU-user conventions so guest images "just work": guest `10.0.2.15`, gateway `10.0.2.2`, DNS `10.0.2.3`, and a NAT flow table with idle timeouts. No TUN device, no privileged host networking, nothing that a browser could not do.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-2-1.png" alt="The guest, the slirp stack, and the provider drawn as three layers"><figcaption>Three layers: an unmodified guest, a stack with no privileges, a swappable provider.</figcaption></figure>

The important architectural move is that guest packets **terminate** at slirp. Nothing forwards raw ethernet out of the tab; a connection is unwrapped down to what it actually is — a request to reach one host on one port — and handed to a provider through the `OutboundConnector` seam.

Which provider is a choice: `offline` fails cleanly, `relay` goes through a WebSocket proxy (E3-T16), and `tailscale` hands the flow to a Worker that is itself a node on your tailnet (E3-T17). All three speak the same framed session protocol — `OPEN`, `OPEN_OK`, `DATA`, `WINDOW`, `SHUTDOWN_WR`, `CLOSE`, `RST`, plus `UDP_OPEN`/`UDP_DATA`/`UDP_CLOSE` — so the transport underneath is genuinely replaceable.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-2-4.png" alt="The framed protocol opcodes carried between the VM and the provider Worker"><figcaption>One small frame vocabulary, three interchangeable providers.</figcaption></figure>

Backpressure is not optional in a tab. Each stream starts with `INITIAL_WINDOW = 256 KiB` of credit; a guest that stops reading spends its credit and the sender stalls, bounding the memory one bad flow can pin while every other stream keeps moving. `MAX_STREAMS` is 1024 and datagrams are capped at 1,252 bytes — Tailscale's 1,280-byte TUN MTU minus the inner IPv4 and UDP headers.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-2-5.png" alt="Window credit draining until the sender stalls"><figcaption>256 KiB of credit per stream: a stalled reader stalls its own flow and nothing else.</figcaption></figure>

Names ride the same path. The guest queries `10.0.2.3` because that is what its DHCP lease said, and slirp resolves it through the active provider — so a MagicDNS name works inside an Alpine that has never heard of Tailscale, with browser DoH as the fallback when the provider is off. Select an exit node and the same machinery reaches the public internet (which is how `apk` works at all); select none and an outbound connection fails at the connector timeout instead of hanging.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-2-7.png" alt="A tailnet name resolved through the provider and an exit node routing to the internet"><figcaption>MagicDNS through 10.0.2.3, and an exit node for everything outside the tailnet.</figcaption></figure>

And the identity on the wire is the tab's own. The browser registers as exactly one named node with its own key; no backend impersonates it, and no tailnet credential is ever visible to the guest OS. E3-T17's adversarial check is the good kind: deny the browser node in the ACLs while leaving the relay allowed, and predict the outcome before reading the logs — anything that still gets through proves the identity was laundered, and refutes the design.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-2-9.png" alt="The control plane denying the browser node so the guest connection must fail"><figcaption>The test that makes "the tab is the node" a claim rather than a slogan.</figcaption></figure>

One practical note: the Tailscale runtime is a ~25 MB artifact, and selecting `relay` or `offline` must not request it at all — a stated acceptance criterion, not an aspiration.

## Chapter 3 · Freeze the Machine, Restore It Anywhere

A running VM is a program counter, thirty-two registers, guest RAM, and some devices holding a little state each — so all of it can be written down. `crates/core/src/resume.rs` defines the container: magic `WVMRESU1`, a version, and a sequence of tagged sections — CPU, RAM, CLINT, PLIC, UART, VIRTIO_BLK, VIRTIO_NET, RTC, CLOCK. A tag this build does not know is a loud failure, never a half-applied restore.

RAM is the awkward part, since most of it is zero. The container's codec collapses zero runs into `[kind 0][len]` with no payload, so a mostly-empty 128 MiB shrinks to roughly the size of its non-zero spans. The shipped busybox snapshot is 10,983,666 bytes — about 10.5 MB holding an entire operating system in mid-thought.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-3-2.png" alt="Machine components collapsing into a tagged container with RAM's zero runs elided"><figcaption>Every component becomes a tagged section; RAM's zeros become lengths.</figcaption></figure>

Restoring is where it gets dangerous, so the header binds three things: `core_hash` (which emulator build wrote it), `base_image_hash` (which kernel and initramfs it belongs to), and `overlay_generation` (which generation of your disk writes it saw). `SnapshotHeader::validate_for` refuses a mismatch with a typed error and the caller cold-boots. The reasoning is stated plainly in the source: restoring a snapshot whose overlay generation no longer matches the disk means the guest's page cache and the disk disagree — silent corruption, which is the one outcome worth an entire guard for.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-3-4.png" alt="The header's three coherence bindings, one of them mismatched"><figcaption>All three must match, or the machine boots the slow way instead.</figcaption></figure>

Persisting 10 MB in a browser has its own rule: never hold a second whole copy. `crates/storage/src/snapmeta.rs` streams the blob into IndexedDB in `SNAPSHOT_CHUNK` (1 MiB) pieces inside batched transactions, and the `meta` record binds the chunk set to its base image so a torn or half-published store is a typed `SnapshotStoreError` on the way back out — again, a reason to cold boot rather than resume something truncated.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-3-6.png" alt="The snapshot streamed into IndexedDB one megabyte at a time"><figcaption>Streamed in 1 MiB chunks; a missing or short piece is detected, not resumed.</figcaption></figure>

`web/boot-path.js` then reduces every page load to one ordered question, unit-tested as a pure function: is there a **user snapshot**? Else is the shipped **boot snapshot** coherent with this build? Else **cold boot**.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-3-7.png" alt="The three-way boot decision: user snapshot, shipped boot snapshot, cold boot"><figcaption>Three outcomes, and no way to end up half-restored.</figcaption></figure>

And that is the number that changes how the thing feels. Executing the boot is a kernel doing about forty seconds of real work; restoring the same machine takes about one, and the page says so: `[fast-boot: host ready in 1s (restored, no Linux boot)]`.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-3-8.png" alt="A forty-second cold boot bar against a one-second restore bar"><figcaption>The same machine, two ways to arrive at it.</figcaption></figure>

Some state is deliberately *not* restored from the blob: wall-clock time and entropy are live browser-backed sources read on demand, so a machine that wakes an hour later knows what time it is, and a fresh DHCP lease re-establishes the network rather than resuming a frozen one.

Which leaves portability. The blob is self-contained and identity-checked, so where it lives is an implementation detail — today `tools/build-boot-snapshot.sh` produces it at build time and `web/artifacts.json` publishes it as `releases/boot-snapshot/busybox-ready.snap.gz` for the page to fetch. Put the identical bytes in object storage and any browser running the matching build restores to the exact instruction you froze. Freezing a *user's* session and uploading it is the same mechanism with a different destination.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-3-10.png" alt="One snapshot blob restoring into several different browsers"><figcaption>One blob, many tabs, the same program counter.</figcaption></figure>

## Chapter 4 · Rewind: Keyframes and a Log

The project's stated goal, at the very top of `ROADMAP.md`, is a machine that is **time-travelable** — that's the "singularity condition". So it is worth asking plainly how far away that is, starting with the version of the idea that does not work.

Freeze the whole machine after every instruction. Each freeze is ~10.5 MB, and even a deliberately slow guest retires ten million instructions a second: about **100 TB per second** of history. It is not a storage problem, it is a category error — and almost every byte of each freeze is identical to the byte before it.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-4-2.png" alt="A runaway counter showing 100 terabytes per second for per-instruction snapshots"><figcaption>The naive design, priced honestly.</figcaption></figure>

The way out is the observation the whole emulator is built on: a machine is a *function*. Same state plus same inputs produces the same next state, so you don't record the machine — you record the arrows coming in from outside it. What was typed. When a disk read completed. What arrived from the network. The random bytes. Exactly when each interrupt landed.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-4-4.png" alt="The machine as a function with only external inputs recorded"><figcaption>Record the inputs; everything else is recomputable.</figcaption></figure>

That only works if the machine really is a function, and this is the part wasm-vm already did. `crates/core/tests/determinism.rs` reduces an entire run to one fingerprint — a rolling hash over every guest-visible retire effect, plus a SHA-256 of RAM, plus a final-state hash over the float registers, `fcsr`, privilege and CSRs — and asserts it against a frozen golden **natively and on wasm32**, over the whole riscv-tests corpus. Determinism here is a build gate, not an aspiration. `ROADMAP.md` puts the reason bluntly: *"a system that is only made deterministic at the end was never deterministic."*

<figure><img src="/generated/wasm-vm-internals/blog/chapter-4-5.png" alt="The determinism fingerprint: execution hash, memory digest, final state"><figcaption>One fingerprint per run, enforced across builds — the judge for any replay claim.</figcaption></figure>

One more decision makes a recording addressable: time is measured in **retired instructions**, never in seconds. "Instruction four billion" is a place you can return to; "half past two" is not. The trace format already defines retirement precisely — a faulting instruction does not retire and emits nothing — and the resume container already carries a `CLOCK` section so timer placement is instruction-exact across a restore.

Then the real design fits on a line: **keyframes every so often, a thin log of inputs in between.** Megabytes a minute instead of terabytes a second, because the expensive thing happens rarely and the cheap thing happens often.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-4-6.png" alt="A timeline of sparse keyframes with a thin log of input events between them"><figcaption>Sparse keyframes, a dense-but-tiny log.</figcaption></figure>

Every operation you'd want is then the same operation. To reach any moment: restore the nearest keyframe before it and replay the log forward. Reverse-step is just asking for the moment before this one. Reverse-continue is a bounded backwards search built from the same primitive.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-4-7.png" alt="Seeking backwards: restore the nearest keyframe, then replay forward to the target"><figcaption>Seek = nearest keyframe + replay forward. Everything else is that, twice.</figcaption></figure>

The keyframes can be much cheaper than they look, using two mechanisms already built for entirely different reasons: **E4-T17's page-granular dirty bitmaps** (added so the JIT can spot self-modifying code) say exactly which pages a delta keyframe must contain, and the **content-addressed `BlobStore`** (the thing that deduped 6,144 disk chunks to 3,765 objects) shares unchanged pages between keyframes for free.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-4-8.png" alt="Delta keyframes storing only changed pages, sharing the rest"><figcaption>Dirty-page maps plus content addressing make a chain of keyframes affordable.</figcaption></figure>

There is exactly one deliberate decision pointing the wrong way, and it's worth naming rather than discovering later. `web/loader.js` documents that after a restore the wall clock and `crypto.getRandomValues` are **live browser-backed sources**, and a fresh DHCP lease is taken — so a resumed session knows what time it is. That is correct for *resume* and fatal for *replay*, which must take those values from the log. So it becomes an explicit mode, not a default.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-4-9.png" alt="Two modes: resume reads live clocks, replay reads them from the log"><figcaption>Resume and replay want opposite things from the same code path.</figcaption></figure>

Which leaves an honest ledger. **Already here:** deterministic execution gated in CI; identical fingerprints native and in-browser; whole-machine keyframes at an instruction boundary; page-granular dirty bitmaps; a content-addressed store that dedupes; and a single hart — which is the version of this problem that is actually tractable, since SMP is where rr-style replay gets hard. **Still missing:** the input log and recorder, a replay mode that refuses live clocks, and seek/reverse-step with a surface to scrub.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-4-11.png" alt="The readiness ledger: six capabilities present, three missing"><figcaption>Six of nine, and the six are the hard ones.</figcaption></figure>

So this is not a time-traveling Linux yet. It is the *hard half* of one — the half most attempts get wrong by bolting determinism on at the end — and what remains is a recorder, not a rewrite. That work is now written down as **Epic 4.5 — Time Travel** in the wasm-vm backlog, sited immediately after the JIT epic, because the roadmap's own constraint is that determinism must survive translation.

## Chapter 5 · The Swarm Is the Mirror

Chapter 1 solved *how much* to download; this chapter is a design proposal about *where from*. Today the answer is one place: every chunk of `chunked-alpine` is fetched from the public R2 bucket (`web/main.js` points `R2_ASSETS` at it, with a CDN in front). That is fine until the image is popular. A thousand tabs booting means a thousand fetches of the *same* hundred hot chunks — the origin ships identical bytes a hundred thousand times, and both the bill and the tail latency scale with exactly the thing you want most: readers.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-5-2.png" alt="A thousand tabs all fetching the same hot chunks from one origin"><figcaption>One origin, many tabs: popularity is a cost, not an asset.</figcaption></figure>

The observation that unlocks the chapter is structural: **the chunk store already is a torrent.** A torrent is fixed-size pieces, each identified by its hash, listed in order — which is a field-for-field description of `ImageManifest` (`chunk_size: 131072`, ordered SHA-256 per chunk). BitTorrent v2 even hashes pieces with SHA-256, the same function the manifest already uses. Publishing the image as a torrent is not a re-architecture; it is a second transport for an artifact that was accidentally born torrent-shaped.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-5-3.png" alt="Side-by-side mapping: chunk = piece, manifest hash list = piece hashes"><figcaption>The mapping is a rename, not a redesign.</figcaption></figure>

So the design: a WebTorrent-style swarm of browser tabs, exchanging chunks directly over peer connections. Every tab that has booted this image already holds the hot set in its cache; peers announce which pieces they hold, and a chunk can come from the nearest tab instead of a distant origin. Crucially, R2 does not go away — it is demoted to the **web seed**, the permanent peer of last resort that speaks plain HTTP. An empty swarm at three in the morning degrades into exactly what ships today. The swarm is an accelerator, never a dependency.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-5-5.png" alt="The swarm of tabs with the bucket demoted to a dashed web-seed link"><figcaption>The bucket becomes one peer among many — the one that never goes offline.</figcaption></figure>

The lazy filesystem is what makes this client different from a stock torrent client. A stock client downloads pieces in whatever order suits the swarm; our guest issues reads with a *deadline* attached. So piece selection gets two tiers: a `virtio-blk` read promotes its piece to **critical** — requested from several peers *and* the web seed in parallel, first verified answer wins — while the background tier keeps filling in the rest of the image (rarest-first, so the swarm converges toward full copies) whenever no read is blocked. The guest only ever waits on its own reads, and those always jump the queue. `Readahead`'s run-of-three promotion slots straight into this: a detected stream promotes the next pieces out of the background tier before the guest asks.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-5-6.png" alt="A guest read marked critical jumping the piece queue, raced across peers and web seed"><figcaption>A read is a deadline: critical pieces race every source; background pieces wait.</figcaption></figure>

The swarm also produces a signal the origin never could: **per-piece availability** — how many peers hold each piece. The chunks on the boot path are held by nearly everyone, so the availability map is a crowd-sourced heat map of the image that rediscovers `boot-profile.json` on its own — and generalizes it, because it keeps learning after `login:`, covering whatever readers actually run. Read backwards, seeder counts are prefetch advice.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-5-8.png" alt="The chunk grid shaded by how many peers hold each piece; the boot path glows"><figcaption>Availability as a heat map: the swarm votes on what to prefetch.</figcaption></figure>

None of this touches the trust story, which is why it is cheap to entertain. Every chunk — from a peer or from R2 — passes `ImageManifest::verify_chunk` before a byte reaches the guest: length check, then SHA-256 against the manifest, with `HashMismatch` a typed error that drops the piece and re-requests. A malicious peer can waste a little time; it cannot corrupt the disk. And the moment a tab has verified a chunk, it can serve it: after one boot you hold the exact hundred pieces the next tab needs first. Every reader becomes a mirror of the hottest part of the image — the popular chunks become the cheapest ones.

<figure><img src="/generated/wasm-vm-internals/blog/chapter-5-10.png" alt="Your tab seeding the hot hundred chunks outward to newer peers"><figcaption>One manifest, two transports — and the most popular image is the fastest one to boot.</figcaption></figure>
