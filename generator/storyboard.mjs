// Deprecated v2 automatic planner. Planning is an Opus 5.5 session launched through
// generator/run-opus.mjs; use its validated --storyboard artifact or the supported
// scene-native book commands.
export async function generateStoryboard() {
  throw new Error('Automatic legacy storyboard planning is disabled. Author --storyboard with Opus 5.5 (node generator/run-opus.mjs --role planning) or follow .claude/commands/new-book.md. See docs/authoring-models.md.');
}
