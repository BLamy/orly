# `@orly/mobile-ui`

Reusable, book-agnostic mobile navigation primitives extracted from the O'RLY
bookshelf.

- `MobileTabBar` renders a configurable fixed tab bar.
- `useScrollChrome`, `blockChromeReveal`, and `scrollToTop` coordinate
  hide-on-scroll chrome.
- `CollapsingHeader` measures its live height and exposes it as a CSS custom
  property for sticky content.
- `alphabetize`, `AlphabetizedList`, and `AlphabetIndex` provide article-aware
  grouping, sticky letter headings, drag navigation, empty-letter fallback,
  and optional portal rendering.

Import `@orly/mobile-ui/styles.css` once in the consuming app, then theme the
components through their class names and CSS custom properties.
