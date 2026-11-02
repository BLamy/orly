# Agent Desktop: from snapshots to safe actions

Agent Desktop turns native accessibility trees into observations an agent can act on. Its interesting work happens in the gap between an old observation and a changing desktop: qualifying refs, corroborating identity, constraining side effects, and reporting what can actually be known after an action. These live sections follow that pipeline at a pinned source revision.

### The agent owns the loop

Agent Desktop exposes a desktop as structured observations and operations. It does not decide the next step for an agent. The agent asks for a snapshot, chooses an element, requests an action, and observes again. A snapshot begins by selecting a window; several matching windows produce an ambiguity response with candidates. The operating system then supplies an accessibility tree whose roles, names and available actions describe controls without requiring pixel matching. Actionable or drillable nodes receive refs qualified by their snapshot, so an element number cannot silently refer to whichever observation happened most recently.

{% viz scene="books/agent-desktop/chapter-1" section="chapter-1-observation-loop" cue="0" from="0.000" to="40.542" title="The agent owns the loop" %}
{% endviz %}

The scene follows the Finder example from the [project quick start](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/README.md#L40-L78). Its desktop is an illustration of that contract, not a recording of an executed command. A qualified ref identifies an observation to resolve, not an eternally valid screen control.

### A snapshot carries evidence and limits

The printed ref is the compact front of a saved evidence map. The map retains the source process and window, identity fields, geometry and tree location so a later command can seek the live target. Observation itself has limits: a full snapshot can report a partial tree when its budget expires. A skeleton provides a shallow map of a dense window, and a root ref lets the caller drill into one region. That drill replaces descendants in an existing map only after the subtree observation completes; an unfinished drill must not erase refs it could not reconstruct.

{% viz scene="books/agent-desktop/chapter-1" section="chapter-1-evidence-map" cue="5" from="40.542" to="80.666" title="A snapshot carries evidence and limits" %}
{% endviz %}

These are different completeness contracts: [full snapshot formatting](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/core/src/commands/snapshot.rs#L125-L150) reports the partial boundary, while [root snapshot replacement](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/core/src/snapshot/snapshot_ref.rs#L30-L107) requires completion before mutation. After an action, another snapshot supplies fresh application evidence.

### A location is a candidate, not an identity

Between observation and action, a row can move, disappear or be replaced. Resolution therefore starts with the selected snapshot namespace and the saved entry, not a fresh search for anything with a familiar label. Process-generation evidence helps reject a recycled process number. Source-window and tree-path evidence narrow the search. But a positional path only locates a candidate: if another row slides into that position, the resolver still has to corroborate its identity. That distinction makes refusal useful. Acting on a convenient replacement would turn a stale observation into an unintended instruction.

{% viz scene="books/agent-desktop/chapter-2" section="chapter-2-location-versus-identity" cue="0" from="0.000" to="46.149" title="A location is a candidate, not an identity" %}
{% endviz %}

The [Mac resolver](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/macos/src/tree/resolve/mod.rs#L49-L134) checks process identity and uses a path fast path before broader search. The [project identity vocabulary](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/CONCEPTS.md#L90-L116) explicitly separates locating a candidate from proving that it is the saved target.

### Evidence can match, disagree, or be missing

The shared matcher gives retained native-object identity precedence when it is present. Otherwise it examines a typed native identifier or role-appropriate stable text. An identifier is evidence within a larger resolution process, not a universal uniqueness guarantee. Text values in editable controls are especially weak identity material: the user is expected to change them, and some accessibility names merely repeat that value. A missed positional path can trigger a bounded broader search. [Geometry can narrow several candidates that already match identity evidence](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/macos/src/tree/resolve/resolve_classify.rs#L65-L115). Only refs without meaningful identity may rely on geometry alone; geometry cannot rescue contradictory identity evidence.

{% viz scene="books/agent-desktop/chapter-2" section="chapter-2-identity-evidence" cue="5" from="46.149" to="94.644" title="Evidence can match, disagree, or be missing" %}
{% endviz %}

The [shared identity matcher](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/core/src/refs/ref_identity.rs#L50-L84) preserves uncertainty, and its [mutable text rules](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/core/src/refs/ref_identity.rs#L217-L259) avoid using changing values as stable labels. A missing match produces a stale refusal. If the available evidence still leaves competing matches, resolution is ambiguous; the caller should observe again and use fresh refs.

### Permission, readiness, and exclusivity are separate

A valid target does not automatically authorize every way of acting on it. Headless ref actions use semantic accessibility operations without implicit focus stealing or pointer movement, and fail closed when that path is unavailable. Headed mode permits broader side effects, but the action and platform still determine the mechanism. Readiness checks then evaluate the requested operation against live evidence. Temporary conditions can be polled under a deadline; unsupported actions and policy refusals do not become supported merely by waiting. The interaction lease is acquired after this readiness auto-wait, and dispatch resolves the target again under the lease.

{% viz scene="books/agent-desktop/chapter-3" section="chapter-3-policy-and-readiness" cue="0" from="0.000" to="60.603" title="Permission, readiness, and exclusivity are separate" %}
{% endviz %}

The [interaction policy](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/CONCEPTS.md#L223-L236) is a side-effect contract. The [poll loop](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/core/src/ref_action/ref_action_poll.rs#L18-L26) deliberately leaves the lease free during readiness auto-wait. [Stability sampling](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/core/src/ref_action/mod.rs#L263-L298) and [post-action settling](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/core/src/actions/post_action.rs#L55-L73) may still occur under the lease. Re-resolution under that lease closes the gap between a readiness observation and dispatch; it does not make an entire agent workflow atomic.

### A failed reply may follow a delivered action

The result has more than one question to answer. Did input reach the application? Could the tool confirm an effect? Would repeating the request be safe? These questions cannot be replaced by a single success flag. Stateful actions read back element state after dispatch, but even a confirmed field value does not prove that the application saved a document or completed a workflow. A refusal known to deliver nothing is marked safe to retry. Uncertain or already-delivered input is marked unsafe to repeat because a second attempt could duplicate the effect.

{% viz scene="books/agent-desktop/chapter-3" section="chapter-3-delivery-and-verification" cue="6" from="60.603" to="96.827" title="A failed reply may follow a delivered action" %}
{% endviz %}

The [delivery semantics table](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/core/src/actions/delivery_semantics.rs#L36-L54) determines retry disposition independently of the error name. The [post-action verification code](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/core/src/actions/post_action.rs#L95-L138) explicitly distinguishes element verification from application commit. The external agent should inspect this evidence and observe the application again.

### Short commands can share a native object owner

A common core contract connects to separate Mac, Windows and Linux adapters; their capability surfaces still differ. On the Mac, eligible command-line invocations reuse a private host bound to the snapshot namespace and binary build. The command process may finish while this host continues owning retained accessibility objects. That ownership prevents a removed row from quietly rebinding to a surviving row with the same identifier. It also has a lifecycle: after fifteen idle minutes the host exits, and refs depending on its retained native objects become stale. A fresh owner does not revive the old tokens.

{% viz scene="books/agent-desktop/chapter-4" section="chapter-4-native-owner" cue="0" from="0.000" to="64.969" title="Short commands can share a native object owner" %}
{% endviz %}

The [endpoint identity](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/src/command_host/command_host_endpoint.rs#L6-L40) includes namespace and executable metadata. The [retained-owner tests](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/crates/macos/src/tree/resolve/retained_tests.rs#L63-L129) cover expiry and identity precedence. If a reply is lost, the [client reports uncertain delivery](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/src/command_host/command_host_client.rs#L56-L65) rather than automatically replaying the command.

### The platform boundary remains visible

Headless names an interaction policy here, not a virtual or absent desktop. Linux still requires a user graphical session and its accessibility service, while permissions and supported mechanisms vary across operating systems. A valid ref can therefore reach a permission or capability refusal. The final loop combines all four chapters: observe a scoped tree, resolve a ref against live identity, act under the selected policy, inspect delivery and verification evidence, then observe again. The private host preserves native identity where needed; the agent remains responsible for deciding what those observations mean for its task.

{% viz scene="books/agent-desktop/chapter-4" section="chapter-4-contract-boundary" cue="7" from="64.969" to="91.672" title="The platform boundary remains visible" %}
{% endviz %}

This account is pinned to [the inspected revision](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/README.md#L12-L36), with the [platform support table](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/README.md#L124-L137) as the boundary on portability claims. It explains the command and identity pipeline, rather than claiming universal headless operation, idempotent actions, or verified application success.

Sources: [the project quick start and platform matrix](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/README.md#L12-L137), [the identity and reliability vocabulary](https://github.com/vercel-labs/agent-desktop/blob/9eb9b296192fcb70bda25e918cd6dd66abfa3d0d/CONCEPTS.md#L90-L249), and the implementation and tests linked in each section. All source links name commit 9eb9b296192fcb70bda25e918cd6dd66abfa3d0d. The moving desktops are explanatory illustrations, not recordings of executed desktop commands.
