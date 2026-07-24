// Root barrel: the core timeline/player plus every SVG/canvas primitive.
// Subpath entries: '3b1bd3/draw' (imperative D3 helpers), '3b1bd3/narrator'
// (Web Speech narration), '3b1bd3/acts' (act-based compat layer), and
// '3b1bd3/storybook' (Motion editor addon — the only entry that imports
// 'storybook/*').
export * from './core';
export * from './primitives';
