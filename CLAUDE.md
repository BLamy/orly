# orly — the O'RLY explainer bookshelf

This repo is a **published library of generated explainers**. Each "book" is a
narrated, animated D3 data‑flow explainer of one subsystem of some codebase, bound
as an **O'RLY‑parody** O'Reilly‑style book. The shelf deploys to Cloudflare Workers:
**https://orly.brett-lamy.workers.dev/**

## Authoring model routing

Use **GPT-6 Astra (`gpt-6-astra`) for planning and Blender 3D modeling** and
**Claude Fable 5.1 (`claude-fable-5-1`) for D3/SVG animations**. Follow
[the authoring model workflow](docs/authoring-models.md) for handoffs, provider
provenance and hybrid scene verification. Always launch Claude with
`npx --yes @anthropic-ai/claude-code@latest`, never the installed global CLI.
Keep the exact requested model; save progress on a provider limit rather than
silently substituting. Astra may continue independent 3D/integration work.

## The main thing you do here
**Create a new book** when asked: run **`/new-book <repo> | <subsystem> | <title>`**
(see `.claude/commands/new-book.md`). It digests the repo, Astra writes the visual plan and Fable authors D3 scenes,
then the pipeline narrates it (ElevenLabs), generates an O'RLY cover (gpt‑image),
adds Noun Project icons, and you commit + push to redeploy.

## Architecture
- `generator/` — the pipeline (run via `npm run explain`):
  - `repo.mjs` digest · `storyboard.mjs` (retired automatic planner) · `validate.mjs`
    (cover‑first/reveal‑union checks + the **layered layout** that prevents node
    overlap and hidden arrows) · `tts.mjs` (ElevenLabs `convertWithTimestamps` →
    exact per‑step cues) · `noun.mjs` + `iconize.mjs` (icons for nodes/packets) ·
    `cover.mjs` + `seeds.mjs` (gpt‑image cover, seeded by parody covers, with a
    vision QA loop) · `transform.mjs` (→ manifest) · `library.mjs` · `cli.mjs`.
- `apps/bookshelf/src/` — the Vite/React app: `App.tsx` routes (shelf default / `?bundle=<slug>`
  explainer / `?book=almostnode` static); `library/` is the iBooks‑style shelf
  (canvas 3‑D books with the cover skewed on); `engine/` is the D3 slideshow
  (audio‑synced, icon‑aware); `stories/` are the built‑in almostnode chapters.
- `packages/mobile-ui/` — reusable mobile tab bar, collapsing header,
  hide-on-scroll state, and alphabetized list/index navigation.
- `public/generated/<slug>/` — each book's `manifest.json` + `audio/` + `animal.png`;
  `library.json` is the shelf registry.
- `apps/bookshelf/src/viz/` — the **3blue1brown-style animation suite** (pure `sample(t)`
  timeline engine, primitives, explainers), cataloged in Storybook
  (`npm run storybook`; the **Motion** panel edits timelines and saves timings
  back to each scene's `overrides.json`). **To author a new scene, use the
  `viz-scene` skill** (`.claude/skills/viz-scene/SKILL.md`) — it has the full
  API, conventions, and verification steps. Narration: in-browser voice while
  editing; ElevenLabs only at publish via `npm run viz:narrate`.

## Hard rules
- **Never** render the real publisher **"O'Reilly"** — only the parody **"O'RLY?"**.
  Covers are composited in‑browser (text is under our control); the gpt‑image QA
  loop rejects stray lettering in the animal.
- **Ground everything in real code** — no invented components/files/flows. The
  storyboard system prompt (`generator/prompts/storyboard.txt`) enforces this.
- Keys live in a **gitignored `.env`** (ElevenLabs, OpenAI, Noun Project). Never
  commit secrets. Planning uses Astra; D3 authoring uses the signed-in latest Claude CLI.
  See docs/authoring-models.md for CI credentials.

## Run locally
`npm run dev` → http://localhost:5173/ (shelf). Deploy is automatic on push to
`main` via `.github/workflows/deploy.yml` (`npm run build`, base `/`, then
`wrangler deploy` to the **`orly`** Worker). Book PRs get a Cloudflare **preview**
(`preview.yml`) and stay open; reply **@claude** on a book PR to revise it
(`comment-edit.yml`); merging redeploys production.
