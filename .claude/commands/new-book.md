---
description: Generate a new O'RLY explainer "book" from a repo + subsystem and publish it to the shelf
---

# /new-book — add a book to the O'RLY shelf

Turn a GitHub repo (or local path) + a subsystem into a narrated, animated D3
explainer with an O'RLY‑parody cover, and publish it to https://blamy.github.io/orly/.

**Arguments:** `$ARGUMENTS` — ideally `<repo-url-or-path> | <subsystem prompt> [| <short title>] [| <animal>]`.
If they're missing or unclear, ask the user for the repo and which subsystem to explain.

Keys come from the gitignored `.env` (`ELEVENLABS_API_KEY`, `OPENAI_API_KEY`,
`NOUN_PROJECT_KEY/SECRET`). The storyboard is written by **you (Claude Code)** —
no `ANTHROPIC_API_KEY` needed.

## Steps

1. **Pick a slug** (kebab‑case, unique) and a short cover **title** (e.g. "Koa.js").

2. **Digest the repo** with the real pipeline (don't hand‑roll it):
   ```bash
   node -e "import('./generator/repo.mjs').then(m=>{const d=m.acquireAndDigest({repo:process.argv[1],prompt:process.argv[2]});require('fs').writeFileSync('/tmp/nb-digest.txt',d.digest);console.error('digest:',d.chosen.length,'files,',d.digest.length,'chars');})" "<REPO>" "<SUBSYSTEM PROMPT>"
   ```

3. **Write the storyboard.** Read `generator/prompts/storyboard.txt` (the system
   prompt — obey every rule) and `generator/storyboard.schema.json` (conform
   exactly), plus `/tmp/nb-digest.txt`. Ground EVERYTHING in the digest (real
   file/function/type names). Optionally also set each node's `iconTerm` (e.g.
   "key", "database", "clock") and a `iconTerm` on auth/data messages.
   Write the JSON to `/tmp/nb-storyboard.json`, then validate + auto‑fix layout:
   ```bash
   node -e "import('./generator/validate.mjs').then(m=>{const fs=require('fs');const sb=JSON.parse(fs.readFileSync('/tmp/nb-storyboard.json','utf8'));const v=m.validateStoryboard(sb);fs.writeFileSync('/tmp/nb-storyboard.json',JSON.stringify(sb,null,2));console.log(JSON.stringify(v))})"
   ```
   Fix every error and re‑validate until `ok:true`.
   *(For higher quality you may instead run a Workflow that generates the
   storyboard and adversarially verifies its fidelity to the code — see the
   koa-storyboard-test workflow as a template.)*

4. **Build the book** (TTS + cover + icons + library), no browser:
   ```bash
   node generator/cli.mjs --storyboard /tmp/nb-storyboard.json --slug "<SLUG>" --title "<TITLE>" --prompt "<SUBSYSTEM PROMPT>"
   ```
   This narrates each chapter (ElevenLabs, exact cues), generates an O'RLY‑parody
   cover (gpt‑image animal **seeded** by a random parody cover + a vision **QA
   loop** that rejects any real‑publisher/stray text), fetches Noun Project icons
   for nodes + packets, and upserts the book into `public/generated/library.json`.

5. **Publish** (triggers the Pages redeploy):
   ```bash
   git add public/generated && git commit -m "book: <TITLE>" && git push
   ```

6. Tell the user the live URL: `https://blamy.github.io/orly/?bundle=<SLUG>`
   (and optionally open it locally with `npm run dev` + `?bundle=<SLUG>`).

## Rules
- **Never** show the real publisher "O'Reilly" anywhere — only the parody "O'RLY?".
  The cover chrome is composited in‑browser (you control the text); the gpt‑image
  step's QA loop guards against stray lettering in the animal.
- Keep it grounded: no invented components, files, or data flows.
