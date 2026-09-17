# Parent review — first pass (chapter 1)

Caption extraction: all 8 exact captions match; duration 90.2 seconds. Storybook renders without page errors.

Visual fixes required before acceptance (screenshots in evidence/next-useful-action/draft-chapter-1-cue-*.png):

- The work ribbon and its labels overlap the bottom caption text in cues 2, 3, 4, 5, and 7. The camera changes the effective screen coordinates: keeping world y <630 is insufficient. Keep all load-bearing ribbon labels at screen y <=575 (the native caption overlay can span multiple lines), e.g. move ribbon upward and/or adjust wide camera. Verify transformed positions, including mid-tween.
- At cue 4, the camera clips the left half of the profile page and its labels while they remain visible. At cue 6 the active task chip and focus legend are clipped on the right. When pushing in, completely hide irrelevant offstage layers or keep all active content in frame; do not leave cut words.
- Cue 6 at its sampled time shows the focus legend on top of partially visible route-lane text. Fade competing layers completely before the legend appears, or give the legend an opaque backdrop that fully contains its text.
- The closing frame is clean, but ensure end-of-caption and transition states remain clean too.

Keep the supplied narration unchanged. Retain the transforming ribbon/page mechanism and camera movement; fix camera framing and visual spacing rather than removing motion.
