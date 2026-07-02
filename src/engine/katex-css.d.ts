// The app deliberately doesn't pull in vite/client ambient types (see the
// ASSET_BASE cast in Presentation.tsx), so declare the one CSS module the
// engine dynamically imports for viz steps (Vite handles it at build time).
declare module 'katex/dist/katex.min.css';
