# Round 1 — resolution (head writer, 2026-11-01)

Review: `round-1.md` (independent Opus 5.5 reviewer, four lenses; scores accuracy 7, depth 8, clarity 7, story 7,
curiosity 8, visual 7, voice 7). Also resolved: `.orly-work/durable-film-integration-review.md` (five precision
checks). Every fix was checked against `research/` and, where code was at issue, the pinned sources.

## Critical — all fixed

| id | where | fix |
|---|---|---|
| C1 | ch05-s05 L0525–L0526 | celld reads the ownership record after a **bucket** proof (a fleet proof needs no read): L0526 now says "when the Well proves a write". L0525 no longer implies workerd's last defence is a clock: "the second look is". Staging shows a bucket proof before the look. |
| C2 | ch07-s04 L0722 + staging | epoch prefixes: a stale owner "can only add to an old shelf, never to the new owner's" (not "where the restore never looks"); shelf 8 untouched. |
| C3 | ch06-s05 L0621 + staging | the false-tick counterfactual now needs the whole house to freeze (a paused process) after sending the scroll, with A's candle burning past the band before B's legitimate claim. |
| C4 | ch05-s03 staging | the 4 s bracket still runs out in a 5.5 s gust; a 1 s retry lands after it, before the 12,000 ms notch. |
| C5 | ch02-s04 L0216, ch01-s03 L0113 | workerd ran a room, but as a single instance on one machine; the 2026 words are attributed to Ryan Dahl (his section of the joint post). L0113: "move between machines you run". Restaged tether. |
| C6 | ch04-s01 L0401–L0402 | the August date is now on celld's **release**; Ryan Dahl "had started it, and he later told us why" (the Q08 card no longer stands in for speech). |
| C7 | ch06-s04 L0619 | "The Well and the second look are" the tick, not the bucket alone. |
| C8 | ch08-s04 staging | dawn badge corrected to 'workerd · 28 Oct'. |

Additional historian correction found by the head writer while checking C5: in the 9 October 2026 joint post,
"Workerd is already open source, but its Durable Objects support is limited to a single instance." (Q07) is in
**Ryan Dahl's** section; the "one big gap … single-instance way, good enough for local testing" passage is in
**Kenton Varda's**. quotes.json Q07 speaker corrected (text unchanged, lock intact); Kenton's own sentence added as
Q26 (verified verbatim, appended to the lock); ch04-s02, at Kenton Varda's desk, now shows Q26; HI12 and the bible
updated.

## Issues — resolved

1 fixture continuity (B's flicker planted in ch01-s02 and paid off in L0531; ch07-s01 Plate C·9·from 7) · 2 L0720
"Now replay that night in celld's town" · 3 ch08 no longer repeats the plan; Q14 replaces the duplicate Q11 card · 4
L0415 names the "acquisitions" filing once, no terms · 5 L0802 tense · 6 L0804 adds leases and close clocks · 7
L0805 separates workerd's re-read from celld's sealing · 8 ch05 trimmed · 9 L0504/L0505: a brand-new room is born
already open; "at most one claimant wins" (safety, not liveness) · 10 L0715 "can ring" · 11 L0735 the 240-try limit
· 12 L0725 antecedent · 13 L0814 "does not run" · 14 L0210 "a later post" · 15 "tooth" spoken in L0307 · 16 "output
gate" spoken in L0211 · 17 the write-ahead log's commit mark is a red **stamp**; "seal" now means only celld's
sealing · 18 "the from tile" · 19 L0321 · 20 write-ahead log glossed in L0221 · 21 "Its keeper, the runtime" in
L0106 · 22–23 stale words in directions, music notes and visual cues resynced (a script check now finds 0 cue
words missing from narration) · 24–26 text loads reduced to ≤ 2 items; ch06-s01 stamp numbers bound to page counts
(6, then 7) · 27 Q21 trimmed to a verbatim fragment, upper right · 28 the celld successor is House C's node · 29
sender locked at the L4 window · 30 crane up 4 s · 31 the failing-renewal vignette fences at the 12,000 ms notch ·
32 tether restaged.

## Integration review — resolved

- ch05-s01: "at most one claimant wins" (safety), not "exactly one" (liveness).
- ch07-s03b L0719: "a fresh write's proof rests on two copies: the owner's and one neighbour's" (certified proof
  copies, not a physical-copy count); the one- vs two-follower distinction kept.
- ch07-s02 L0711: "a neighbour's disk **can** answer much sooner than the Well".
- ch08-s02 L0809: "The alarm tests check the cases they stage. They do not establish exactly-once effects for every
  application."
- ch08-s03 L0814: "make two rooms commit as one".
- Preserved and re-verified: claimed vs opened (ch05-s06; ch07-s01 now consistent at C·9·from 7); ch07-s06's
  damaged + complete → proceeds and incomplete + damaged → blocks.

## Not changed (deliberate)

- Runtime: about 3,280 words, estimated 27.0 min at 140 wpm (target 24, brief range 20–28, ceiling 28 set in
  meta.json `runtimeCeilingSec` 1680). The deep dives carry the extra words; the narrate stage measures the real pace,
  and if the chosen voice reads below about 135 wpm, trim holds first (ch01-s01 lead-in 6.5 s, ch08-s04 minDuration
  30 s), then lines.
- No second full review round was run in this recovery session. Scores above are round 1's (before the fixes); this
  stage does not claim a story-rubric pass.
