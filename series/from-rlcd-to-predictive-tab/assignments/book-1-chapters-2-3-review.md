Fable visual correction pass for book 1 chapters 2 and 3. Return a JSON object in a fenced json block: {"edits":[{"file":"apps/bookshelf/src/viz/books/next-useful-action/chapter-N.tsx","old":"exact unique substring","new":"replacement"}],"rationale":"brief"}. Do not write files; parent applies after the original author finishes. Be concise and make targeted framing/visibility changes, not rewrites. Preserve all captions verbatim and the transforming visual mechanisms.

Read both chapter-2.tsx and chapter-3.tsx in that book directory and .agents/skills/viz-scene/SKILL.md. Read the actual screenshots in series/from-rlcd-to-predictive-tab/evidence/next-useful-action/draft-chapter-2-contact.png and draft-chapter-3-contact.png. They are 2-column, 4-row contact sheets of cue 1 through 8, sampled 3 seconds after each caption starts.

Required fixes:
- Chapter 2 cue 1 clips half the page at left while the page remains active. Fade irrelevant page layers during the zoom, or keep the full page visible.
- Chapter 3 cue 2 clips the task lens at right; cue 3 clips the focus lens at left. Their content remains active. Fade inactive lens content completely before zooming or keep both fully in frame.
- Chapter 3 cues 2/3 overlap captions with the lens bottom and lower labels/histogram. Cue 5 overlaps the last shared-foundation row with captions. Cue 6 clips the top of the still-active lenses. Cue 7 overlaps the foundation/roadmap bottom with captions. Cue 8 shows huge partially clipped old layer rows above the final focus.
- Reserve SCREEN y>=575 for multi-line narration, considering camera translation and zoom (world coordinates alone don't suffice). Keep active text fully inside screen. During zooms, hide inactive labels rather than leaving partially cut words. Keep previous layers <=0.15 and no text underneath captions. Camera motion is still required but can be modest and earned. When closing over old layers, fully hide them or use an opaque backdrop.

Base the replacements on exact source. Do not alter shared/profile-page.tsx or captions. Return the complete small patch and stop. No claimed verification; parent rerenders.
