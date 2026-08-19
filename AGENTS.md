# orly — the O'RLY explainer bookshelf

This repo is a **published library of generated explainers**. Each "book" is a
narrated, animated D3 data‑flow explainer of one subsystem of some codebase, bound
as an **O'RLY‑parody** O'Reilly‑style book. The shelf deploys to Cloudflare Workers:
**https://orly.brett-lamy.workers.dev/**

## The main thing you do here
**Create a new book** when asked: run **`/new-book <repo> | <subsystem> | <title>`**
(see `.claude/commands/new-book.md`). It digests the repo, you write the storyboard,
then the pipeline narrates it (ElevenLabs), generates an O'RLY cover (Codex
built-in ImageGen when available; API fallback otherwise), adds Noun Project
icons, and you commit + push to redeploy.

## Architecture
- `generator/` — the pipeline (run via `npm run explain`):
  - `repo.mjs` digest · `storyboard.mjs` (Anthropic API path) · `validate.mjs`
    (cover‑first/reveal‑union checks + the **layered layout** that prevents node
    overlap and hidden arrows) · `tts.mjs` (ElevenLabs `convertWithTimestamps` →
    exact per‑step cues) · `noun.mjs` + `iconize.mjs` (icons for nodes/packets) ·
    `cover.mjs` + `seeds.mjs` (API fallback for the cover, seeded by parody
    covers, with a vision QA loop) · `transform.mjs` (→ manifest) ·
    `library.mjs` · `cli.mjs`.
- `apps/bookshelf/src/` — the Vite/React app: `App.tsx` routes (shelf default / `?bundle=<slug>`
  explainer / `?book=almostnode` static); `library/` is the iBooks‑style shelf
  (canvas 3‑D books with the cover skewed on); `engine/` is the D3 slideshow
  (audio‑synced, icon‑aware); `stories/` are the built‑in almostnode chapters.
- `packages/mobile-ui/` — reusable mobile tab bar, collapsing header,
  hide-on-scroll state, and alphabetized list/index navigation.
- `public/generated/<slug>/` — each book's `manifest.json` + `audio/` + `animal.png`;
  `blog.md` is the written companion post and `library.json` is the shelf registry.
- `apps/bookshelf/src/viz/` — the **3blue1brown-style animation suite** (pure `sample(t)`
  timeline engine, primitives, explainers), cataloged in Storybook
  (`npm run storybook`; the **Motion** panel edits timelines and saves timings
  back to each scene's `overrides.json`). **To author a new scene, use the
  `viz-scene` skill** (`.Codex/skills/viz-scene/SKILL.md`) — it has the full
  API, conventions, and verification steps. Narration: in-browser voice while
  editing; ElevenLabs only at publish via `npm run viz:narrate`.

## Hard rules
- **Never** render the real publisher **"O'Reilly"** — only the parody **"O'RLY?"**.
  Covers are composited in‑browser (text is under our control); cover art must
  contain no lettering.
- **Always use Codex built-in ImageGen for cover animals when it is available.**
  Generate only the animal on a uniform pure-white (`#FFFFFF`) field—never tan,
  cream, ivory, textured paper, a vignette, or a scene—and visually reject any
  lettering before creating the committed `animal.webp`. Run `video.mjs` with
  `--no-cover` when that asset is already prepared. Use the `cover.mjs` API path
  only when built-in ImageGen is unavailable.
- **Ground everything in real code** — no invented components/files/flows. The
  storyboard system prompt (`generator/prompts/storyboard.txt`) enforces this.
- Keys live in a **gitignored `.env`** (ElevenLabs, OpenAI, Noun Project). Never
  commit secrets. The storyboard step uses **you (Codex)**, so no Anthropic
  key is required.

## Blog posts are live Docstream viz sections

- The latest published packages are `@brett_lamy/docstream` **0.3.2** and
  `@brett_lamy/viz-engine` **0.2.1**. `BlogPanel.tsx` uses Docstream's
  `VizEmbed` component to mount the real scene viewer inside the markdown flow.
- Blog cue windows are a **blog-only consumer** of `manifest.chapters[].cues`.
  They must never retime, replace, or silence the normal narrated chapter
  player. The chapter MP3 and manifest remain the source of truth for the
  video.
- `blog.md` uses the repo-local block syntax below; the renderer turns each
  block into a live, silent, autoplaying, looping `VizEmbed` section. It does
  not create a PNG, GIF, MP4, or WebM asset:
  ```md
  {% viz scene="books/example/chapter-1" cue="0" from="0.000" to="7.500" title="What this beat shows" %}
  {% endviz %}

  The paragraph immediately after the block explains the animation.
  ```
- `scene` is the exact manifest scene id; `from`/`to` are the manifest cue
  times in seconds. The blog renderer slices only that window, hides chapter
  navigation/captions/audio, and lets the scene's own timeline decide which
  SVG elements are relevant. If a beat has distracting persistent elements,
  fix the scene's timeline/render visibility rather than exporting a crop.
- Convert legacy cue figures with `node generator/blog-viz.mjs --slug <slug>`.
  The compatibility name `generator/screenshot-chapters.mjs` delegates to the
  same live-viz conversion and must not be used to generate stills.
- Do not use Docstream's direct-video `{% embed %}` syntax for these posts:
  that is for actual media files. Viz sections are React `VizEmbed` blocks
  bridged by `BlogPanel`, which is the supported way to embed a live
  `viz-engine` scene in this markdown document.

## Run locally
`npm run dev` → http://localhost:5173/ (shelf). Deploy is automatic on push to
`main` via `.github/workflows/deploy.yml` (`npm run build`, base `/`, then
`wrangler deploy` to the **`orly`** Worker). Book PRs get a Cloudflare **preview**
(`preview.yml`) and stay open; reply **@Codex** on a book PR to revise it
(`comment-edit.yml`); merging redeploys production.
