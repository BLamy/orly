# Release build — 2026-11-01

`npm exec -- nx run bookshelf:build --skip-nx-cache` passed, including its dependency task and the production `tsc && vite build`. Vite transformed 9,708 modules and generated the production service worker.

This disk-constrained checkout used an invocation-local, Claude-authored preload that sends public-to-dist file copies through native APFS `clonefile(2)`. Its private helper checks passed 56/56, with no physical-copy fallback. The real build cloned 8,078 public files. Repository build configuration and dependencies were unchanged.

All 234 files in this film's built public package are byte-identical to their source public files; the built library registry also matches. The built manifest is format 3, kind film, locked timing, runtime 1439.4167 seconds, and points to the passing round-2 review. The full movie remains outside the static assets.

Full review: round 1, mean 8.56/10, no critical issues. The bounded round-2 review verified all eight visual fixes in the refreshed MP4 and retained the original scores without re-grading. Machine QA: 40 pass, 6 warn, 0 fail. Human listening remains pending and unsigned.

The post-publish finalizer is preserved, byte for byte from Claude's final assembly, at `../../finalize-publish.mjs`; `../../PUBLISH.md` documents its use. This resolves the historical final-assembly report's private-script reproducibility limit.
