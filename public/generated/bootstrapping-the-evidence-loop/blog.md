# Bootstrapping the Evidence Loop

## 1. Initialize the Witness

The first test is not the beginning of a durable quality system. The beginning is a stable place for evidence to accumulate. Create one Replay QA project for one target, and keep its identifier in `.replay/config.json`. That file is deliberately small: it is a bookmark into Replay QA's catalog, not a local copy of the catalog and never a home for credentials.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-1-2.png" alt="A Replay QA project connected to a local project identifier"><figcaption>One stable project identity keeps later explorations, journeys, runs, and recordings in a single history.</figcaption></figure>

Project creation needs a stable target address. Instructions or a design document can seed an initial exploration, while duplicate-target rejection prevents the same application from accidentally splitting into parallel evidence histories. Existing journeys can then be queued against the active project.

The application's state has a separate authority. In the Slack clone, messages and task transitions live in Durable Streams. Replay QA records what happened in the browser; stream offsets and a reproducible digest explain how the backend reached its state. A ticket should cite both witnesses when its claim crosses both layers.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-1-9.png" alt="Replay QA evidence correlated with a Durable Streams timeline"><figcaption>The browser witness and the event-sourced state remain separate, but one ticket can bind them into a single evidence packet.</figcaption></figure>

## 2. Two Roads Into One Project

A hosted recording browser cannot ordinarily reach a private laptop application. Reverse-proxy onboarding creates that entrance. The developer runs the project-specific `replayqa proxy` command beside the app; the command supervises an allowlisted local proxy on port 8888 and a managed `frpc` client.

The active deployment provisions this path in AWS and Kubernetes. The gateway creates a session-scoped `frps` pod, a private ClusterIP name for tunnel data and health, and a per-session network-load-balancer service for the public control connection. The test container uses the ClusterIP data host; the client uses the load-balancer hostname. These are deliberately different addresses, so browser traffic and control traffic can be reasoned about separately.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-2-3.png" alt="AWS Kubernetes tunnel with a private data host and public control load balancer"><figcaption>The browser data plane stays private: test container → ClusterIP data host → frps → outbound tunnel → local allowlisted proxy → app. The public load balancer is for frpc control, not browser payloads.</figcaption></figure>

The load-balancer hostname is not instantly usable. Kubernetes can publish the hostname before public domain-name lookup returns an address. Replay QA stores the hostname, polls for DNS resolution, and withholds the client configuration until it resolves. That pause matters because handing an early negative answer to the Go resolver inside `frpc` can pin the failure across retries. A DNS wait is therefore retained as the same provisioning attempt rather than mistaken for a dead tunnel.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-2-6.png" alt="A DNS gate waiting for an AWS network load balancer hostname"><figcaption>Allocated is not ready: the hostname must resolve before the managed client receives its configuration.</figcaption></figure>

The client application is a second readiness gate. If the app has not started on the developer’s machine, the managed command can keep the tunnel provisioned and wait for the local target to become reachable. Ready is a conjunction: the host container serves, its public control port accepts a connection, and the `user-target` proxy reports online. Only then does the orchestrator dispatch a recording browser.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-2-7.png" alt="Three readiness gates for the tunnel and local target"><figcaption>A ready signal means AWS host, local target, and frpc connectivity have all crossed their gates.</figcaption></figure>

If `frpc` disconnects in the middle of a run, the health gate reports the proxy offline and the run suspends at a safe boundary. The lifecycle history records the disconnect. The managed client reconnects or restarts `frpc`; when the same session reports online again, the pause releases and the run resumes without replacing its project key or discarding evidence. A host that truly never serves is different: after the serving or public-control timeout, the gateway reaps it and a later poll can reprovision cleanly.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-2-8.png" alt="A tunnel disconnect suspending a run and resuming after frpc reconnects"><figcaption>Transient loss suspends and recovers in place; a dead host crosses a timeout and is reprovisioned.</figcaption></figure>

The Model Context Protocol server is a second road. It lets an agent list projects, journeys, test runs, and explorations, but its requests never traverse the `frpc` tunnel. The two roads meet only at the Replay QA project identifier: one carries browser traffic; the other controls and inspects the evidence catalog. Reverse-proxy projects are initialized through onboarding or the service interface, not through the public project-creation tool.

## 3. The Catalog Remembers

Exploration is reconnaissance. It browses beyond the paths the team already knows, records what it encountered, and proposes useful regression journeys. That origin recording is valuable, but it is not certification. It explains why a test exists; it does not prove that a saved contract ran repeatably.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-3-1.png" alt="An exploration trail marked as discovery rather than certification"><figcaption>Exploration discovers behavior. Certification begins only after that behavior becomes a named, versioned journey.</figcaption></figure>

Useful findings become persistent journeys. Each saved shape is retained as a journey version, and creating or updating a journey automatically schedules a recorded test run for that exact version. The result is an honest pair of artifacts: an exploration recording for provenance and a journey-run recording for execution evidence.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-3-5.png" alt="Journey versions connected to exact recorded test runs"><figcaption>Specifications and executions grow side by side, so a new version does not erase the evidence attached to the old one.</figcaption></figure>

Later explorations widen the map and refresh journeys as the product changes. The public LoopQA Model Context Protocol surface currently inspects the catalog rather than providing a public start-exploration button, so automation should keep that boundary explicit instead of inventing a capability that is not there.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-3-9.png" alt="Current exploration entry points and the public MCP boundary"><figcaption>The catalog compounds over time while exploration entry points and inspection tools remain clearly separated.</figcaption></figure>

## 4. The Critic Holds the Tape

At the end of each ticket, the builder makes one final run from the exact code it intends to submit. Browser behavior becomes a Replay QA recording. Backend behavior becomes an append-only stream range and a state digest. These artifacts travel with the claim.

This resembles the family of repeat-until-green workflows often called Ralph loops, with two additions: a witness and an independent judge. The critic receives the exact recording instead of redriving the app and hoping to recreate the same world. It predicts what should be visible at a moment, then interrogates the recording's console, network, interactions, and rendered state around that point.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-4-4.png" alt="A critic checking a prediction against a fixed Replay recording"><figcaption>The critic cross-examines the builder's fixed tape; it does not silently replace the evidence with a fresh run.</figcaption></figure>

On the backend, the critic independently replays the cited Durable Streams range and recomputes the digest. Then it performs a sensitivity check by changing an input or sabotaging a disposable copy. If the detector cannot be made to fail, a green result is not strong evidence.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-4-7.png" alt="A sensitivity probe causing a refuted verdict"><figcaption>A useful verifier must demonstrate that it can go red when the protected behavior is broken.</figcaption></figure>

Refutations append to history. They do not erase the original run. The ticket reopens, the builder produces fresh evidence, and only a fresh critic can append `verified`. Determinism comes from the controlled setup—exact code head, seeded state, versioned journey, and reproducible stream replay—not from pretending every recording is inherently deterministic.

## 5. Every Epic Widens the Net

Ticket evidence should be narrow enough to explain one change. An epic gate has a different job: find failures created by the composition of many individually correct tickets. It begins with a fresh exploration against the exact epic head, promotes useful discoveries into journeys, and refreshes journeys whose behavior changed.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-5-4.png" alt="A fresh exploration widening a regression matrix"><figcaption>The capstone deliberately reaches outside the diagonal of ticket-owned tests and adds newly discovered paths.</figcaption></figure>

Today, that full regression sweep must be explicit. The public Model Context Protocol surface has no run-all operation, and the ordinary queue is eligibility-based: it favors never-run journeys, repaired bugs, and infrastructure retries rather than forcing already-green journeys to execute again. The epic driver therefore lists every standing journey, retriggers each one at the epic head, and waits for every run to become terminal.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-5-7.png" alt="Every named journey fanning into one exact epic head"><figcaption>A real epic regression is an explicit enumeration and fan-out, not an optimistic reading of the ordinary queue.</figcaption></figure>

The gate closes only when every browser claim has a recording identifier, every state claim rebuilds from its cited stream offsets, and a fresh critic attacks the composed result. A refutation returns with a recording point, an event offset, and a failing journey. A verification leaves the next epic a larger catalog than the one this epic inherited.

<figure><img src="/generated/bootstrapping-the-evidence-loop/blog/chapter-5-10.png" alt="A verified epic head with a larger regression catalog"><figcaption>Initialize once. Explore to discover. Regress to remember. Criticize to trust.</figcaption></figure>
