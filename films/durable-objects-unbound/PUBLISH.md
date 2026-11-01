# Publish this film

Run both commands from the repository root:

```sh
node generator/film/publish.mjs --slug durable-objects-unbound
node films/durable-objects-unbound/finalize-publish.mjs
```

The second command is the exact Claude Code Opus 5.5 finalizer used for the delivered film. It corrects film-specific credits and copies the existing L0404 narration into the published chapter-4 blurb. It preserves the locked story, narration, score and clock.

The final-assembly report's private-script limitation is resolved by preserving that script here. Keep the full master at `render/film.mp4`; it exceeds the Workers per-asset limit. The hosted film player uses the Canvas shots and mastered audio stems.
