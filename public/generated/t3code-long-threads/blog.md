This is the written companion to *T3 Code: Long Threads*. The narrated scenes answer one question about the T3 Code web app: how a long conversation opens quickly, how its history loads in pieces, and how its timeline scrolls while a reply streams in. Each claim traces to a line range in the pinned commit `cc59f99e735300120a6fc74d9a0b9df7c98fa81c` of `pingdotgg/t3code`, and the sources page under the player lists each quoted line. Where a statement is our own reading rather than something the code says, the post says so.

## 1. Opening from a saved copy

### A saved copy shows before the server answers

The thread state reads a saved copy of the thread before it asks the server for anything (`packages/client-runtime/src/state/threads.ts`, line 213). That copy sits in the browser's IndexedDB, under a key made of the environment and the thread (`apps/web/src/connection/storage.ts`, lines 43 and 361). A saved record that the current decoder cannot read is discarded rather than used (`packages/client-runtime/src/platform/orchestrationCache.ts`, line 36).

{% viz scene="books/t3code-long-threads/chapter-1" section="chapter-1-saved-copy" cue="0" from="0.000" to="20.132" title="A saved copy shows before the server answers" %}
{% endviz %}

The status reads `cached` while a saved copy exists and no live data has arrived (`threads.ts`, line 61). The status changes to live when the server's synchronized marker arrives (`threads.ts`, line 603). Reading those transitions, the rows shown at first are not yet confirmed by the server. That is our reading of the code, not a quoted rule.

### Replay a short gap, or send one fresh window for a wide one

Once the thread has data, the subscription asks for events after the saved sequence number (`threads.ts`, line 1017). The server replays the gap only while it stays within 128 events and about a megabyte (`apps/server/src/orchestration-v2/ThreadStream.ts`, lines 18 and 20). Replayed events go out on the same stream as live events, ahead of the live tail (`apps/server/src/ws.ts`, lines 1026 to 1028).

{% viz scene="books/t3code-long-threads/chapter-1" section="chapter-1-replay-gap" cue="3" from="20.132" to="39.787" title="Replay a short gap, or send one fresh window" %}
{% endviz %}

When the gap is over those limits, `decideThreadResume` picks a snapshot instead (`ThreadStream.ts`, lines 108 and 111). A very stale copy therefore costs one fresh window rather than a long replay.

### No saved copy, a bounded window, and the ladder

With no thread data in memory, the client asks for the bounded thread snapshot over HTTP first (`threads.ts`, lines 953 and 968). That request gives up after six seconds (`packages/client-runtime/src/state/boundedThreadSnapshotHttp.ts`, line 18). If the snapshot is unavailable, the thread state falls through to the socket (`threads.ts`, line 1005), and the socket sends the same bounded window when the client accepts one (`ws.ts`, lines 919 and 704). That window holds the newest ten user turns, kept to about a megabyte (`apps/server/src/orchestration-v2/threadHistoryPaging.ts`, lines 16 and 19). The contract calls such a projection a bounded window, not a complete timeline (`packages/contracts/src/orchestrationV2.ts`, line 3793).

{% viz scene="books/t3code-long-threads/chapter-1" section="chapter-1-no-copy-ladder" cue="6" from="39.787" to="74.350" title="No saved copy, a bounded window, and the ladder" %}
{% endviz %}

Switching threads uses the same idea in the browser. The app keeps the rows of up to sixteen thread timelines (`apps/web/src/components/ChatView.logic.ts`, line 345). While the next thread loads with no entries, the remembered rows are shown (`ChatView.logic.ts`, line 402; `apps/web/src/components/chat/ThreadTimeline.tsx`, line 44). Taken together, the three paths form a ladder: the saved copy first, a replay for a short gap, and a fresh window only past the limit. That summary is our reading of those paths.

## 2. Paging long history with a cursor

### Pages walk backward and stop at the first limit

History arrives page by page through a cursor-based endpoint (`packages/contracts/src/environmentHttp.ts`, line 718). The first window holds the newest ten user turns (`threadHistoryPaging.ts`, line 16). A page is selected by walking backward from the newest row (`threadHistoryPaging.ts`, line 332). The walk stops at the first limit it reaches: an item count (line 337) or the byte budget (line 338).

{% viz scene="books/t3code-long-threads/chapter-2" section="chapter-2-pages-walk" cue="0" from="0.000" to="18.773" title="Pages walk backward and stop at the first limit" %}
{% endviz %}

Four limits apply: user turns (line 16), rows (line 17 for windows without user turns, and line 18 for turn windows), raw turns (line 29), and about a megabyte of encoded data (line 19).

### Load earlier sends the cursor back

Load earlier turns is the button in the timeline header (`apps/web/src/components/chat/MessagesTimeline.tsx`, lines 1387 and 1388). The next page starts from the history cursor (`packages/client-runtime/src/state/threads.ts`, line 674). The page stops early when the next row would push its encoded bytes past the limit (`threadHistoryPaging.ts`, line 338). The cursor records the snapshot sequence and the oldest row on the page (`threadHistoryPaging.ts`, lines 132, 134, and 368).

{% viz scene="books/t3code-long-threads/chapter-2" section="chapter-2-load-earlier-cursor" cue="3" from="18.773" to="40.705" title="Load earlier sends the cursor back" %}
{% endviz %}

The client keeps the cursor as a plain string and sends it back unchanged (`packages/client-runtime/src/state/threadHistoryHttp.ts`, lines 20 and 30). The page's rows go in front of the rows already on screen (`packages/client-runtime/src/state/threadHistoryMerge.ts`, line 116). Each row is keyed by its source thread and item (lines 42 and 85), so a repeated row is not shown twice.

### Search widens a page, and a long run folds

A search for older text asks for a page through the matched message. `apps/web/src/components/chat/useThreadFindNavigation.ts` (line 271) calls `historyControls.onLoadEarlier(match.entryId)`, and the server widens the targeted page to at most forty user turns (`threadHistoryPaging.ts`, line 441). When one run holds more than one hundred fifty finished work rows, they fold into an anchor row that carries its own deferred-work cursor (`threadHistoryPaging.ts`, lines 22, 232, and 240).

{% viz scene="books/t3code-long-threads/chapter-2" section="chapter-2-search-fold" cue="6" from="40.705" to="64.180" title="Search widens a page, and a long run folds" %}
{% endviz %}

Expanding the folded block loads its rows by work anchor (`MessagesTimeline.tsx`, line 1598) and shows a loading skeleton (line 1623). If the load fails, the block offers a retry (line 1610).

### New events join the window by sequence number

New events arrive over the thread subscription stream (`packages/client-runtime/src/state/threads.ts`, line 938). An event whose sequence is at or below the one already applied is skipped (`threads.ts`, line 486).

{% viz scene="books/t3code-long-threads/chapter-2" section="chapter-2-live-window" cue="9" from="64.180" to="77.880" title="New events join the window by sequence number" %}
{% endviz %}

Read together, the pages and the live stream make a long thread a window with a cursor behind it. Each load adds one bounded page behind the window (`threadHistoryPaging.ts`, line 415). That reading of the paging policy is our own.

## 3. Mounting only the rows you can see

### Only the rows near the viewport are mounted

A thread can hold hundreds of rows, while the screen shows only a few. A loaded window can carry up to five hundred turn items (`threadHistoryPaging.ts`, line 18). The timeline renders its rows with the LegendList virtual list (`MessagesTimeline.tsx`, line 52), pinned at version 3.3.5 (`pnpm-workspace.yaml`, line 56). The library's draw distance defaults to 250 pixels (`patches/@legendapp__list@3.3.5.patch`, line 793), and the timeline does not override it.

{% viz scene="books/t3code-long-threads/chapter-3" section="chapter-3-near-viewport" cue="0" from="0.000" to="15.209" title="Only the rows near the viewport are mounted" %}
{% endviz %}

Each row starts from an estimate of ninety pixels (`MessagesTimeline.tsx`, line 1314). The code notes that index and end scrolling start from those estimated sizes (`apps/web/src/components/chat/useTimelinePositionRestore.ts`, line 11).

### Measured heights replace the estimate

The timeline's size-change handler receives each measured change (`MessagesTimeline.tsx`, lines 945 and 1345). A change in content size moves the scroll position (line 966), so the rows below a measured row can slide. A restore corrects against the DOM until the viewport holds its target for two frames (`useTimelinePositionRestore.ts`, lines 12 and 38), and the loop gives up after sixty frames (line 8).

{% viz scene="books/t3code-long-threads/chapter-3" section="chapter-3-measure-restore" cue="2" from="15.209" to="35.468" title="Measured heights replace the estimate" %}
{% endviz %}

The list averages measured heights by row type (`MessagesTimeline.tsx`, line 1416). The row type combines the message role with a length bucket (line 1420), so user messages, short replies, and long replies keep separate averages. Reading the code, that keeps later estimates close to what those rows measure. That is our reading.

### Pinned ends, and rows whose audio is playing

The first and last message rows are always rendered (`MessagesTimeline.tsx`, lines 789 and 790). The code gives the reason: screen readers reach headings only through the DOM, so keeping both ends mounted lets heading navigation wrap (lines 787 and 788). Rows whose audio is playing join that set (line 797), and each row's playing state is tracked from its playback events (`onAudioPlaybackChange`, line 1200).

{% viz scene="books/t3code-long-threads/chapter-3" section="chapter-3-pins-audio" cue="5" from="35.468" to="47.194" title="Pinned ends, and rows whose audio is playing" %}
{% endviz %}

### The minimap and the lane width

The minimap's items are the user messages (`apps/web/src/components/chat/timelineMinimapItems.ts`, line 23). Its refresh runs on the next animation frame after a scroll or size change (`MessagesTimeline.tsx`, line 886), and each strip records whether it is in view (line 869). The width of the content lane is watched with a resize observer (line 982; `apps/web/src/lib/observeResize.ts`, line 16), and it is not measured again on every streamed content frame (line 977).

{% viz scene="books/t3code-long-threads/chapter-3" section="chapter-3-minimap-lane" cue="7" from="47.194" to="66.641" title="The minimap and the lane width" %}
{% endviz %}

The list keeps a position for every row, and the scroll anchor reads the position of any row index (`packages/client-runtime/src/work-log/scrollAnchor.ts`, line 5). LegendList also recycles row containers before React commits their positions (`MessagesTimeline.tsx`, line 885).

## 4. Following the live end, and letting go

### Following is a mode, and scrolling away releases it

While a reply streams in, the timeline is following. The list is told to keep the end in view on data changes and item layout changes (`MessagesTimeline.tsx`, lines 193 and 195), and the live-follow flag is true only in the following mode (`apps/web/src/components/chat/useTimelineFollow.ts`, line 211). A thread opens in following mode unless its remembered position is not at the end (`useTimelineFollow.ts`, line 191). Wheel up, the page and arrow keys, and scrollbar input release the follow when they move the view away from the end (`apps/web/src/components/chat/timelineViewport.ts`, lines 189, 191, and 193).

{% viz scene="books/t3code-long-threads/chapter-4" section="chapter-4-following-mode" cue="0" from="0.000" to="22.036" title="Following is a mode, and scrolling away releases it" %}
{% endviz %}

Follow has two states with transitions between them (`timelineViewport.ts`, lines 211 and 212). After a release, the code cancels queued list scrolls and rewrites `scrollTop` to halt a smooth scroll (`useTimelineFollow.ts`, lines 251 and 266). That is why the view stays where the reader left it, which is our reading of those lines.

### The pill returns, and load earlier keeps the place

The scroll-to-end indicator appears after a 150-millisecond debounce (`useTimelineFollow.ts`, line 70) and is labelled "Scroll to end" (`apps/web/src/components/chat/TimelineOverlays.tsx`, line 45). While released, the list is not told to maintain the end (`MessagesTimeline.tsx`, line 1328), so the reply keeps growing below the view. That is our reading. Load earlier turns prepends older rows (`packages/client-runtime/src/state/threads.ts`, line 782), and the list is configured to keep visible content in place for data and size changes (`MessagesTimeline.tsx`, line 832). A saved place is a row id and an offset within that row (`apps/web/src/components/chat/timelineScrollAnchoring.ts`, lines 95 and 96).

{% viz scene="books/t3code-long-threads/chapter-4" section="chapter-4-pill-keep-place" cue="3" from="22.036" to="44.095" title="The pill returns, and load earlier keeps the place" %}
{% endviz %}

The keep-in-place behavior is LegendList's, pinned at version 3.3.5 (`pnpm-workspace.yaml`, line 56). Its internals are not in this repository, so this post describes what the timeline asks for, not how the library does it.

### A sent message anchors, and tool activity releases it

A run that starts while following anchors its user message near the top (`useTimelineFollow.ts`, line 294). The anchored end space is computed from the anchor index and a 24-pixel anchor offset (`MessagesTimeline.tsx`, line 823; `timelineScrollAnchoring.ts`, line 38). That leaves empty space below the message for the reply to grow into. When the running turn shows a tool or command entry, the anchor is released (`apps/web/src/components/ChatView.logic.ts`, line 288), and the list scrolls to the end (`useTimelineFollow.ts`, lines 527 and 534).

{% viz scene="books/t3code-long-threads/chapter-4" section="chapter-4-anchor-tools" cue="6" from="44.095" to="57.864" title="A sent message anchors, and tool activity releases it" %}
{% endviz %}

### Re-arm the follow, restore the place, and remember a hundred threads

The scroll-to-end button calls `scrollToEnd` with animation (`apps/web/src/components/ChatView.tsx`, line 3492). `scrollToEnd` marks the visit as following (`useTimelineFollow.ts`, line 328) and animates the scroll unless the reader prefers reduced motion (line 339). Switching threads and coming back restores the saved row in a layout effect, so it lands before the first paint (`MessagesTimeline.tsx`, lines 725 and 729). The restore scrolls to the saved row with its saved offset (`useTimelinePositionRestore.ts`, line 112).

{% viz scene="books/t3code-long-threads/chapter-4" section="chapter-4-rearm-restore" cue="8" from="57.864" to="84.288" title="Re-arm the follow, restore the place, remember a hundred threads" %}
{% endviz %}

Saved places are capped at one hundred threads (`timelineScrollAnchoring.ts`, line 126). A thread's resume state is kept under a five-minute idle time-to-live (`packages/client-runtime/src/state/threadRetention.ts`, line 1; `threads.ts`, line 1071). Scrolling away releases the follow, and reaching the end brings it back (`timelineViewport.ts`, lines 233 and 239). Taken together, following is a mode rather than a scroll position. That is our reading of the transitions.

## Sources

The main sources are the T3 Code repository at commit `cc59f99e735300120a6fc74d9a0b9df7c98fa81c`. The thread state, its cache, and its history merge are in `packages/client-runtime/src/state/` (`threads.ts`, `threadHistoryMerge.ts`, `threadHistoryHttp.ts`, `boundedThreadSnapshotHttp.ts`, and `threadRetention.ts`), with the browser database in `apps/web/src/connection/storage.ts`. The server's replay, snapshot, and paging code is in `apps/server/src/ws.ts`, `apps/server/src/orchestration-v2/ThreadStream.ts`, and `apps/server/src/orchestration-v2/threadHistoryPaging.ts`. The chat timeline is in `apps/web/src/components/chat/` (`MessagesTimeline.tsx`, `useTimelineFollow.ts`, `timelineViewport.ts`, `timelineScrollAnchoring.ts`, `useTimelinePositionRestore.ts`, and `timelineMinimapItems.ts`). The list library is `@legendapp/list` at version 3.3.5, pinned in `pnpm-workspace.yaml` and patched in `patches/@legendapp__list@3.3.5.patch`. Each claim, with its quote and line range, is on the sources page under the player.
