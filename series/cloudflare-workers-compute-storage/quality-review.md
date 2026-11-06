# Series self-review

Reviewed 2026-11-06 by the authoring model, `gpt-6.1-terra`. The scores are an honest self-assessment, not an independent review. The current production branch's `docs/book-quality.md` defines a pass as every dimension at least 8 and a mean of at least 8.5. These scores **do not meet that rubric**: sound and sync are provisional because no human review of all chapters has been recorded.

| Book | Accuracy | Depth | Clarity | Story | Visual | Sync | Sound | Curiosity | Mean |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Workers Have No Server | 8.5 | 8 | 8.5 | 8 | 8 | 7.5 | 7.5 | 8 | 8.00 |
| Durable Objects Have an Address | 8.5 | 8.5 | 8.5 | 8 | 8 | 7.5 | 7.5 | 8 | 8.06 |
| A Place for Every Byte | 8.5 | 8.5 | 8.5 | 8 | 8 | 7.5 | 7.5 | 8.5 | 8.13 |
| Queues, Logs, and Durable Work | 8.5 | 8.5 | 8.5 | 8 | 8 | 7.5 | 7.5 | 8.5 | 8.13 |
| Beyond the Isolate | 8.5 | 8 | 8.5 | 8 | 8 | 7.5 | 7.5 | 8 | 8.00 |

The scenes use individual visual machines and subject-focused cameras; sampled frames were inspected and all chapters were scrubbed forward and backward. During review, overlapping final-frame labels, the Worker response timing, queue retry timing, and the distinction between a Durable Object and its container were corrected. Cloudflare's current documentation supports the specific claims in `sources.json`; K2's beta and retention limits are dated because they may change.

All 17 narration tracks have timestamp-derived cues and decode as non-silent audio. Their calculated speaking rates are approximately 139–168 words per minute; one track was regenerated more slowly with fresh alignment. The authoring agent cannot hear pronunciation or judge the full audiovisual performance from sampled frames, so the 7.5 sound and sync scores are deliberately provisional. A human playback review is needed for a complete subjective quality judgment. No separate fresh-eyes agent was used.
