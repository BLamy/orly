# Look — replay-qa-promo (look: "promo")

The reference is a 30 s AI-product promo (`reference/contact-sheet.jpg`, frames `reference/f_*.jpg`). We keep its
register and pace, swap its subject for Replay QA, and stretch it to ~90 s.

## Register
- **Airy and confident.** Light-grey studio paper (`#e9e8ea`), lots of negative space, one idea per beat.
- **Soft colour hazes** (kit `haze`): `dawn` (lilac → peach with a rose glow) to open; `ember` (grey paper over a
  coral/orange/pink fire rising from the bottom) for the end card; `brand` (deep plum with Replay red-pink and violet)
  for the time-travel beat only.
- **Type is the hero.** Inter (Promo Sans), light/regular weights, slightly tight tracking, sentence case.
  - kinetic lines that arrive word by word, blurring in, with a white → peach → orange **colour sweep** over the tail
    ("Every deploy. Every PR. Every *night*.")
  - **bracketed phrases** `{ in one place }`, braces parting as the words arrive, small square **registration dots** at
    the corners (kit `bracket`, `squareDots`)
  - `{ introducing }` → the Replay mark + **Replay QA**
  - one **typed prompt** blown up full-frame with a caret (kit `typed`): the URL you point it at
  - a **resolving step list** like the reference's "Building Image" (kit `steps`): Exploring → Journeys → Runs → Bugs,
    grey detail text, ✓ marks landing, a shimmering "Working"
- **Hairline rules** across the frame in the haze shots (kit `hairlines`).
- **Product footage** is real: cleaned rrweb takes of qa.replay.io (`public/generated/replay-qa-promo/rr/*.json`),
  shown with `RrwebScreen` as floating screens (browser chrome optional, soft shadow, gentle 3-D tilt that settles),
  **cropped and zoomed** to the part that matters (a title, a status column, a schedule chip). Never a full desktop at
  thumbnail size for longer than a beat. The drawn cursor and click pulses come from the take.
- **Collage of proof** (the reference's photo collage → here: several screens/cards fanning out with kinetic words
  woven through them).
- **End card**: `ember` haze, a bracketed tagline with corner dots, the Replay mark, `qa.replay.io`.

## Motion
- Ease-outs, no bounces. Holds long enough to read (type: ≥ 1.2 s after the last word lands).
- Cuts and type hits on **downbeats** (the score is composed to the locked clock; cut on bar lines where possible).
- Transitions: `cut` most of the time, `blur` (blur dissolve) between registers, `whip` for the one fast reveal.
- The time-travel beat may **rewind**: a scrubber running backwards over the recording, frames stepping back.

## Colour accents
Replay red-pink `#f41c52` is the one saturated accent on paper. Green `#1f9d63` only for ✓ / "good". Coral for ✕.

## The three takes the message hangs on
| message | takes (marks) |
|---|---|
| point it at your app | `new-project` (typing → typed → hover-start) |
| fully managed, continuous | `explore` (play), `runs` (list → scrolled: PR #3 / PR #1 environments), `schedule` (polish, schedule = "Tue at 3:00 AM", add-env = "Add production, staging, development, preview, or local configuration."), `projects` (scrolled, filtered = per-PR projects), `insights` (stats, severity) |
| bugs that only exist in time | `bug-react` (open → report → actual → rootcause: 67 ms commit, 4 dropped frames), `bug-sync` (report → actual → rootcause: 258 re-fetches, checkpoint stuck at −1) |

The empty dark **Replay** player panel on the bug pages is where our own time-travel overlay can live.

## The subtle beat
Kit `agentPair`: a *developer* agent hands a `▶ replay recording` chip to a *critic* agent; the critic answers
"✕ not yet …" then "✓ good". Small (scale ≈ 0.6) in a corner of a product shot, 6–8 s, never the headline. (Grounded in
the product: bug pages show Requirements / Evidence / Acceptance **judges**; coding agents drive Replay QA through its API
and MCP server.)

## Never
Secrets, tokens, login variables, e-mail addresses (takes are redacted; do not add any), loading spinners, the
publisher name "O'Reilly", other companies' brands.
