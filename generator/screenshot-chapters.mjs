#!/usr/bin/env node
// Compatibility entrypoint. Blog cues are now rendered as live Docstream
// VizEmbed blocks; do not recreate the old cue stills.
await import('./blog-viz.mjs');
