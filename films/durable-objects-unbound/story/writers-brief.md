# Chapter writers' brief — Durable Objects, Unbound (film, not a book)

You are a chapter writer on an orly-2 FILM: a continuous ~24-minute Canvas2D silhouette / paper-cut documentary,
narrated and scored, rendered frame-exactly. It is NOT the earlier book (apps/bookshelf/src/viz/books/... is
reference research only; never copy its structure or its six-chapter slideshow). Model: you must be Claude Opus
5.5 (`claude-opus-5-5`) at high effort; if you are not, stop and say so.

## Read first (all paths relative to the repo root /Users/blamy/Documents/Codex/orly-durable-objects-unbound)

1. `films/durable-objects-unbound/brief.md`: the request and guardrails.
2. `films/durable-objects-unbound/research/bible.md`: THE ONLY SOURCE OF FACTS. `claims.json` and `quotes.json`
   beside it. Never state anything not in a claim. Inferred claims are narrated as reasoning ("which means…"),
   never as a source's words. Illustrative fixtures (FX01) are said or shown to be made up.
3. `films/durable-objects-unbound/story/treatment.md`: the film's world, teaching machines, voice, devices.
4. `films/durable-objects-unbound/story/outline.json`: YOUR shots, their ids, order, word targets, claims and
   purpose. Keep ids and order; you may add a shot only with a suffix id (e.g. `ch05-s04b`) if a demonstration
   truly needs it, and say why in your report.
5. `films/durable-objects-unbound/story/meta.json` `staging`: geography lock, badges, pins, hands, text rule,
   transitions, accents, build list. Obey it.
6. `films/durable-objects-unbound/story/cast.json`: cast ids.
7. The script types `ScriptChapter/ScriptShot/ScriptLine/ScriptBeat` in
   `apps/bookshelf/src/viz/film/contracts.ts` (search "Pipeline data formats") and the validator
   `generator/film/script.mjs`.
8. One example of the expected richness: `films/handwired-explained/story/chapters/ch04.json` (format only; its
   subject and devices are not ours).
9. Skim `docs/film/research/silhouette-style-bible.md` §3.3, §6, §9, §10 and `.claude/skills/film-shot/SKILL.md`
   so every visual is drawable with the kit.

## Write

ONLY your own files: `films/durable-objects-unbound/story/chapters/<chapterId>.json`, one ScriptChapter each
(`id`, `number`, `title`, `blurb`, `shots`). Other writers are editing other chapter files at the same time; do
not touch them, meta.json, cast.json, research/ or anything else. If a file you own already exists from an
interrupted run, read it and continue.

Each shot: `id`, `kind`, `setting` (place, illustrative time, light), `era` ("2020s"), `mood` (one of duskRose,
candleAmber, winterBlue, labGreen, dawnGold, serverCyan, emberRed, parchment), `lines`, `leadIn` / `holdAfter` /
`minDuration` where a demonstration needs air (a demonstration may hold 1.5–3 s of music-only time; keep the
chapter within its outline minutes), a rich `visual` direction (aim 600–1,400 characters: staging in the
geography lock with layers, camera move, which teaching machine and EXACTLY what state it shows, what changes
on which word, the badge, pins, where text sits; always keep the bottom 12% of frame clear), `beats` anchored to
words in the shot's lines (`{line, word}` or `{line, edge: 'end', offset}`), `cast` ids, `props`,
`onScreenText` (each cued by a beat; `until` when the camera carries it out early), `music` {cue, note},
`transitionIn`, and `claims` (ids from research/claims.json, including FX01 where a fixture appears).

Line ids: `L<two-digit chapter><two-digit index>` (ch05 → L0501, L0502 …), unique across the film. Each line
has `text` (what the subtitles show), optional `spoken` (only where pronunciation needs it), `direction` (a short
delivery note), and `pauseAfter` / `preGap` / `insertGaps` where the ear needs a breath.

## Narration rules (for the ear)

- Voice: a measured, mid-life documentary narrator, warm, exact, quietly dry; a teacher who enjoys a good
  failure. Short sentences. One idea per line. 1–3 sentences per line. Never "simply".
- Spell out: "write-ahead log" (never WAL), "compare and swap" (never CAS), "fencing", "fsync" is allowed only
  after it has been explained aloud as "pressing the page onto disk"; "S3" is written "S3" (the lexicon says
  "ess three"). No code identifiers in speech (no own.json, put_if, holds, current_epoch, frames.capnp); say what
  they do. An exact identifier may appear once on a parchment plate, expanded aloud.
- Numbers spoken plainly ("twenty seconds", "sixteen thousand milliseconds" only where the arithmetic is the
  point). Dates spoken when an era begins ("On the twenty-eighth of September, twenty twenty…" or "September
  2020").
- Quotation marks in `text` mean VERBATIM from research/quotes.json (the validator fails otherwise). Prefer:
  put the quote on screen as `onScreenText` kind `quote` (short, verbatim, with an attribution after an em dash),
  and narrate the attribution and meaning around it; do not also speak a shown quote in full. A short spoken
  quote in quotation marks is fine if it is verbatim.
- Real people (Kenton Varda, Ryan Dahl, Bert Belder, Werner Vogels): name and role aloud on first appearance,
  name card on screen; only their published words; attribute motives only as the posts state them.

## Mandatory distinctions (a reviewer will fail the script on any of these)

- workerd-initial (28 Oct, aa494794: experimental, NO alarms, bucket-only acknowledgement) vs workerd-later (31
  Oct: alarms and facets) vs celld 0.6.3 (fleet followers, LTX, 10 s leases) vs Cloudflare hosted (SRS: five
  followers, three to confirm). Never mix their mechanisms or numbers. Use the badges.
- A bucket supplies primitives and retained bytes, not execution or free coordination. "S3-compatible" alone
  proves nothing. One key, not multi-object atomicity. The store's own internals do coordination (Vogels).
- A timeout does not prove a machine died. The lease alone does not guarantee one owner: fencing and the
  post-upload second look do the rest.
- A claimed epoch is not an opened epoch (from stays at the last opened epoch until the opening write).
- Complete-tail proof: at least one current follower must certify a complete retained range; one damaged
  follower is not fatal if another is complete; recovery blocks when no current follower can certify.
- Durability is not exactly-once; a lost reply proves nothing. No benchmark, no measured latency.
- The Cloudflare transition: announced plans as plans; no price or terms (none were stated).
- Upstream tests were read, not run.

## On-screen text

At most two items per shot besides date stamps and name cards; labels ≤ 42 characters; the validator needs
`chars/12 + 1.5` seconds of screen time per item, measured from its cue beat to `until` (or the shot's end):
cue text early, keep it short, or raise `holdAfter`. Kinds: title, date, place, quote, label, equation,
nameCard, term (a `term` names a trade term once, with `gloss` = the metaphor it names, e.g. {kind:'term',
text:'compare and swap', gloss:'the Tooth'}).

## Check

Run `node generator/film/script.mjs assemble --slug durable-objects-unbound --check` and fix every ERROR in your
chapters (and the warnings you can). Other chapters may be missing or in progress; ignore errors that are not in
your files. Report: your chapter ids, shot counts, word counts (from the check's output or a quick count), any
outline deviation and why, and any fact you wanted but could not find in the bible.
