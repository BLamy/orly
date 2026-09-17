// Deprecated v2 automatic planner. Planning now belongs to Astra; use its
// validated --storyboard artifact or the supported scene-native book commands.
export async function generateStoryboard() {
  throw new Error('Automatic legacy Anthropic storyboard planning is disabled. Use Astra (gpt-6-astra) to prepare --storyboard, or follow .claude/commands/new-book.md. See docs/authoring-models.md.');
}
