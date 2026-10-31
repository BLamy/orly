# Publication playback repair — September 30, 2026

Live verification found a shared defect in the new recordings and the unchanged
first book. The static host returned HTTP 200 with the entire MP3 for a valid
`Range: bytes=500000-600000` request. Chromium reported `seekable: [[0, 0]]`,
even after buffering the complete recording. Changing the player slider updated
the scene but clamped the media clock to zero; ordinary playback still advanced.
This is an observed response/client interaction, not a claim about all browsers
or Cloudflare products. All 19 published recordings matched their release hashes.

The chapter player now probes `bytes=0-0`. A valid HTTP 206 retains normal native
streaming. An HTTP 200 reuses that response's complete body as a local Blob media
URL, so the media clock can seek. Playback waits for the recording; previous
loads abort and object URLs are released on chapter change or player unmount.
The existing media-error handling remains available on a fetch failure.

This changes the reader only. Worker configuration, hosting destinations,
credentials, permissions, recording bytes and manifests stay as deployed. On a
host without range support, the tradeoff is downloading one complete chapter
before playback. The existing player already preloaded the recording, but could
start before completing that download.

The browser regression forces an HTTP 200 recording response, seeks forward and
backward, checks real decoded PCM on the unmuted output path, and confirms URL
cleanup across chapter changes and responsive-shell unmounts. Native streaming
also passes all 19 chapters and 150 cue checks against the production build.
Live results are retained separately under `evidence/`.

References: [HTTP range semantics](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests),
[media seekable ranges](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seekable),
[Blob media URLs](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static),
and [URL cleanup](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static).
