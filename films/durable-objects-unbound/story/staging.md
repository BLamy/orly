# Staging and build list — for the shots stage

The canonical staging lives in `story/meta.json` `staging` (it is spread into `script.json`): `geography` (the
harbour town lock and per-chapter variants), `badges`, `pins`, `hands`, `fixtures`, `textRule`, `transitions`,
`accentBudget`, `creditsSources`, `sourcesCard` and `buildList`. The visual grammar and teaching machines are in
`story/treatment.md`. This note is the short version for shot authors.

## The through-line

One promised message (#42 "the ferry is late", illustrative) in one paper-lantern chat room, in a paper-cut harbour
town where every machine is a lamp-lit house (A, B, C), the bucket is the town Well and the ownership record is
the brass Plate above it. Every mechanism is a physical machine with a fixed place in the town, and each deep dive
is taught twice: once with a red-tagged **pin** pulled (the failure replays in emberRed), once with it reseated.

## Build before any shot (shared modules, `sets/`)

| module | first / main shots |
|---|---|
| harbourTown (night · celld · dawn variants; house lamps; pulley lines) | ch01, ch03, ch05–ch08 |
| roomLantern (members, slips with ticks, door latch) | ch01, ch02-s02/s03, ch06, ch07-s07, ch08-s04 |
| wellAndPlate (Plate house·epoch·from + crown lamp; Tooth slot, shutter, notched cards; badge hook) | ch01-s03 onward |
| wellCutaway (cisterns, witness bell, order ledger, proof sheets) | ch03-s04 |
| leaseCandle (20 s scale, 4 s band, 12,000 ms notch; workerd only) | ch05 |
| walRibbon (32 B leader, 24 B tabs, pages, red ink commit stamps; scrolls, knot-tags, Books) | ch02-s05, ch06, ch07-s01 |
| heldLetter (latch, bell, error slips) | ch02-s03, ch06-s04/s05 |
| neighbours (copyists, book presses = fsync, notebooks complete / incomplete / damaged, wax seals) | ch07-s02..s07 |
| pinBoard + demonstratorHand (lower right only) | ch03-s02, ch05-s04, ch05-s06, ch06-s05, ch07-s04, ch08-s01 |
| historyDesk (Kenton Varda screen-left, Ryan Dahl screen-right; two-lamp braid) | ch02, ch04, ch08-s03 |
| parchmentPlates (lease ruler, WAL layout, Plate states, recovery gate, commit strip) | ch04-s04, ch05-s02, ch05-s06, ch06-s01, ch07-s05 |

## Never

- Mix badges: workerd's 20 s / 16,000 / 12,000 ms numbers never beside 'celld 0.6.3'; LTX never beside workerd;
  the hosted relay (five followers, three to confirm) is 'Cloudflare, hosted' only.
- Show an epoch as opened while its crown lamp is dark, or let C recover anything but the last *opened* epoch.
- Show a single damaged follower blocking recovery while another follower's notebook is complete.
- Put text or key action below y 634, or more than two text items per shot besides date stamps and name cards.
- Draw a likeness of a real person, or give one words beyond quotes.json.
