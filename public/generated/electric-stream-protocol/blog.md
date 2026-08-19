# The Stream Is the Product

Most software treats its event log as plumbing. The database is the product, the API is the product, and the log is the thing we keep around in case somebody needs to debug it later.

Electric Forest starts from the opposite premise: the stream is the product. The UI, the audit trail, the replay, the branch view, and the Git export are all projections of the same ordered history.

{% hint style="info" %}
The short version: a mutation enters one dispatch door, becomes a durable event with an offset and digest, and every view gets to converge by replaying that history. Git remains useful at the edge, but it is no longer asked to be the live system of record.
{% endhint %}

{% viz scene="books/electric-stream-protocol/chapter-1" cue="0" from="0.000" to="60.200" title="A mutation becomes a durable stream event" %}
{% endviz %}

## The usual architecture diagram is missing time

An ordinary system diagram shows boxes and arrows: a client calls an API, the API writes a database, and a worker updates a cache. It is useful, but it hides the question that matters when the system is distributed:

> What exactly happened, in what order, and how can another reader reconstruct the same result later?

The stream answers that question directly. A writer does not hand a mutable object to a collection of special-case consumers. It proposes a typed event. The dispatch door validates it, assigns its position, and appends the canonical bytes. From there, the stream is an addressable source of truth.

![A writer appends one accepted mutation to the stream](/generated/electric-stream-protocol/blog/chapter-1-2.png)

That distinction sounds small, but it changes the shape of the whole product. A reader can start at offset zero, start at its checkpoint, or resume after a network interruption. It does not need a private synchronization rule for every feature. The same event history is available to all of them.

## One event, many views

The protocol has a deliberately narrow core:

```text
dispatch(command)
  -> validate(command)
  -> canonicalize(command)
  -> append(event, offset)
  -> reduce(event)
  -> publish(state, digest)
```

The important word is `append`. A current screen is not the authority. A cache is not the authority. Even a materialized table is a projection that can be rebuilt when its reducer changes. The event is the durable fact; the view is the useful consequence.

{% viz scene="books/electric-stream-protocol/chapter-2" cue="0" from="0.000" to="53.200" title="One ordered event fans out into current state, audit, and replay" %}
{% endviz %}

In the animation above, one accepted event feeds three consumers:

| Projection | What it gives you | How it stays honest |
| --- | --- | --- |
| Current screen | the state a person wants to use | reduce the event sequence deterministically |
| Audit view | what changed and when | retain the original offset and canonical payload |
| Replay view | why the state looks this way | replay the same events and compare the digest |

This is the first major difference from a conventional CRUD application. The system does not need to reverse-engineer history from the final row. History is already a first-class, queryable surface.

## Convergence is not a feeling

Distributed systems often use the word *converged* to mean that two screens look the same after a while. That is a useful smoke test, but it is not a proof. Two screens can look identical while carrying different hidden metadata, skipped events, or stale local assumptions.

Electric Forest makes convergence concrete. Every participant has an offset. Every reduced state can have a canonical digest. A peer that reconnects does not simply ask for “the latest thing”; it asks for the suffix after its known offset, replays it, and checks the resulting digest.

{% viz scene="books/electric-stream-protocol/chapter-3" cue="0" from="0.000" to="59.200" title="Offsets, quorum, and offline recovery are visible protocol state" %}
{% endviz %}

The quorum animation is intentionally explicit about the uncomfortable case: one participant is offline. The healthy participants can still establish the transaction boundary, while the offline participant retains a precise obligation to catch up. When it returns, the protocol can say which suffix it missed and whether replay produced the expected digest.

That gives us better failure language:

- not “the client seemed stale,” but “the client stopped at offset 42”;
- not “the data eventually matched,” but “replay from offset 42 produced digest `7a19`”;
- not “the retry probably worked,” but “the same event was not appended twice.”

The event log is therefore also an evidence log. The product stores the thing a critic needs in order to interrogate the claim.

## Branches are views, not copies

Git is an excellent mental model for content-addressed history. Commits point to trees, trees point to blobs, and branches give a team named views over a graph. But Git is optimized for exchanging snapshots and commit graphs, not for acting as the live coordination layer for every reader on a network.

![A commit graph, tree, object network, and key/value store share one visible state](/generated/electric-stream-protocol/blog/chapter-4-3.png)

{% viz scene="books/electric-stream-protocol/chapter-4" cue="0" from="0.000" to="55.200" title="Git-shaped branches remain useful while the stream owns the history" %}
{% endviz %}

The stream-native version keeps the helpful parts of Git while changing what a branch means:

| Git-shaped concept | Stream-native interpretation |
| --- | --- |
| Commit | a durable, ordered mutation or a named checkpoint over mutations |
| Branch | a view or working context with an explicit parent offset |
| Merge | a protocol operation that can surface conflict state and evidence |
| Checkout | selecting a reducer view, snapshot, or replay position |
| Object database | durable event bytes plus derived state and digests |

The difference is not that one graph is “better” than another. The difference is where authority lives. A Git export is a useful artifact for code hosts, review tools, and humans who already know the commands. It is a mirror of the stream, not a second truth that can silently drift from it.

## Git at the edge

This is why compatibility matters. People should not have to throw away `clone`, a working tree, or the tools that understand Git in order to get a live, replayable system.

{% viz scene="books/electric-stream-protocol/chapter-5" cue="0" from="0.000" to="52.200" title="Keep Git at the edge; put the live history underneath" %}
{% endviz %}

The intended flow is familiar:

```sh
git clone git@example.com:team/project.git
cd project

# A post-clone activation discovers the stream identity and installs a bridge.
# The exact hook is deployment-specific; the protocol boundary is not.

git add src/feature.ts
git commit -m "add feature"
git push
```

After activation, the Git-origin mutation enters the same dispatch door as a browser action, a worker action, or an imported event. The bridge is an adapter, not a privileged alternate history.

That is the practical path to an “electric” repository:

1. preserve the commands and files people already understand;
2. install a small local bridge after clone;
3. turn writes into validated stream events;
4. expose offsets, digests, and replay state where the user can see them;
5. keep export and mirror available whenever a conventional Git tool is required.

The hook creates the feeling of electricity because it makes the ordinary folder a participant in a live protocol. It does not have to replace Git, and it should not pretend that a local hook alone can solve distributed consistency. The stream is what gives the hook something durable to join.

## Why this is different

### 1. The source of truth is readable

In a CRUD system, the source of truth is often a row after a sequence of opaque side effects. In a stream-native system, the source of truth is an ordered event history that can be inspected, replayed, and hashed.

### 2. Every view has a reconstruction story

The current UI is not special. It is one reducer output. The audit trail, the offline client, the branch view, and the critic’s replay can all explain where their state came from.

### 3. Synchronization has coordinates

Offsets and digests give disagreement a location. That turns “something got out of sync” into a falsifiable statement about a suffix, an event, or the first divergent reduction.

### 4. Evidence is part of the product

The system is designed to preserve the trace that proves a behavior, not merely to hope that a log line survives after the fact. A durable stream can carry its own history of mutations and the state fingerprints produced by replay.

### 5. Git remains a first-class boundary

Compatibility is not an afterthought. A Git clone can be the front door, a conventional branch can be exported, and a code host can remain part of the workflow. The difference is that these artifacts connect to an authoritative stream instead of competing with one.

## The architectural bet

The bet is simple enough to state:

> Make the mutation history durable, ordered, replayable, and visible—and let every other product surface be a projection of that history.

That is why the diagrams in this book are animated. The movement is not decoration. A packet has an offset. A peer has a catch-up obligation. A digest is the result of reducing a prefix. A branch is a view over history. When the picture moves, it is showing the protocol doing work.

The resulting system feels different because it does not ask the user to trust a hidden synchronization layer. It gives them a live stream, a visible state transition, and a way to replay the claim.

Git is still there. The stream is what makes the repository electric.
