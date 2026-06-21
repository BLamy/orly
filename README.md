# orly 📚

A bookshelf of **generated explainers**. Point Claude Code at any GitHub repo and
a subsystem, and it writes an O’Reilly‑style "book": a narrated, animated D3
data‑flow explainer — with AI‑generated animal cover art — and publishes it to a
GitHub Pages bookshelf.

**Live:** https://blamy.github.io/orly/

## What's a "book"?
- A multi‑chapter **D3 slideshow**: nodes/edges that build up in time, animated
  message packets, a camera that frames each step.
- **Narration** by ElevenLabs, with slides synced to the audio (exact cues from
  TTS character timestamps).
- An **O’Reilly‑style cover**: a `gpt-image-1` woodcut animal, composited with the
  publisher banner + title + author and skewed onto a 3‑D book on the shelf.

## Make a new book
Open Claude Code in this directory and run **`/new-book`** (see
`.claude/commands/new-book.md`), or directly:

```bash
npm run explain -- --repo https://github.com/koajs/koa \
                   --prompt "how a request flows through the middleware onion" \
                   --title "Koa.js" --open
```

Keys live in a gitignored `.env` (`ELEVENLABS_API_KEY`, `OPENAI_API_KEY`,
`NOUN_PROJECT_KEY/SECRET`; the storyboard is written by Claude Code, or set
`ANTHROPIC_API_KEY` to use the API). See `generator/README.md` for the full
pipeline.

Built with [Claude Code](https://claude.com/claude-code).
