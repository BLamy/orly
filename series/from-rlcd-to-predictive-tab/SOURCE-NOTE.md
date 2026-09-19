# Source snapshot and concurrent development

The supplied narration identifies a September 16, 2026 source snapshot through six SHA-256 hashes. All six matched at initial preparation. During book 2 authoring, another process changed the active native engine and schema in the Qwen project. This task did not modify that project.

The native diff introduces complete-candidate scoring, isolated candidate cache copies, and exact-length suffix buckets. These are implementation changes, not independently verified outcomes of this visualization task. The charter, scope decision, prompt builder, and browser prototype still matched their original hashes at the drift check.

The Qwen project's preserved E0-T01 original-source evidence contains byte-exact copies of the engine and schema used by the narration. Those files, plus the other four still-matching sources, are now copied into `source-snapshot/`. `provenance.json` records their hashes and origins. `verify-contract.mjs --sources` validates those pinned sources. `--live-sources` separately checks the active external paths and intentionally fails when they differ.

No spoken edit is required: book 2 explicitly says “The imported native reference” when describing the known defects, and that imported snapshot remains available and verifiable. Every companion post carries a dated source note so readers do not mistake the series for a status report on newer working files. The original script and its hashes are unchanged. Subsequent Fable assignments use the pinned snapshots for narration grounding.
