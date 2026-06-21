# orly — the O'RLY explainer bookshelf

This repo is a **published library of generated explainers**. Each "book" is a
narrated, animated D3 data‑flow explainer of one subsystem of some codebase, bound
as an **O'RLY‑parody** O'Reilly‑style book. The shelf deploys to GitHub Pages:
**https://blamy.github.io/orly/**

## The main thing you do here
**Create a new book** when asked: run **`/new-book <repo> | <subsystem> | <title>`**
(see `.claude/commands/new-book.md`). It digests the repo, you write the storyboard,
then the pipeline narrates it (ElevenLabs), generates an O'RLY cover (gpt‑image),
adds Noun Project icons, and you commit + push to redeploy.

## Architecture
- `generator/` — the pipeline (run via `npm run explain`):
  - `repo.mjs` digest · `storyboard.mjs` (Anthropic API path) · `validate.mjs`
    (cover‑first/reveal‑union checks + the **layered layout** that prevents node
    overlap and hidden arrows) · `tts.mjs` (ElevenLabs `convertWithTimestamps` →
    exact per‑step cues) · `noun.mjs` + `iconize.mjs` (icons for nodes/packets) ·
    `cover.mjs` + `seeds.mjs` (gpt‑image cover, seeded by parody covers, with a
    vision QA loop) · `transform.mjs` (→ manifest) · `library.mjs` · `cli.mjs`.
- `src/` — the Vite/React app: `App.tsx` routes (shelf default / `?bundle=<slug>`
  explainer / `?book=almostnode` static); `library/` is the iBooks‑style shelf
  (canvas 3‑D books with the cover skewed on); `engine/` is the D3 slideshow
  (audio‑synced, icon‑aware); `stories/` are the built‑in almostnode chapters.
- `public/generated/<slug>/` — each book's `manifest.json` + `audio/` + `animal.png`;
  `library.json` is the shelf registry.

## Hard rules
- **Never** render the real publisher **"O'Reilly"** — only the parody **"O'RLY?"**.
  Covers are composited in‑browser (text is under our control); the gpt‑image QA
  loop rejects stray lettering in the animal.
- **Ground everything in real code** — no invented components/files/flows. The
  storyboard system prompt (`generator/prompts/storyboard.txt`) enforces this.
- Keys live in a **gitignored `.env`** (ElevenLabs, OpenAI, Noun Project). Never
  commit secrets. The storyboard step uses **you (Claude Code)**, so no Anthropic
  key is required.

## Run locally
`npm run dev` → http://localhost:5173/ (shelf). Deploy is automatic on push to
`main` via `.github/workflows/deploy.yml` (built with `PAGES=1`, base `/orly/`).
