# hard-attend

**Question:** How do a one-hot gather, a direct index read and a softmax gather compare when a query picks one of three items through dot-product scores?

**Mechanism:** `lab/hard-attend/hard-attend.ts` is plain browser JavaScript, "not a numeric program". There are three items (Aster=10, Banyan=20, Cobalt=30). `keyFor(j)` returns `(2j, -j²)` and the query is `(query, 1)`, so `scoreFor` gives `2·query·j − j²`. This parabola peaks at the item nearest the query. `winnerIndexFor` takes the first highest score (strict `>`, so ties stay left). `update()` computes three reads: the one-hot gather (bits times values, summed), the direct gather `values[winner]` (labelled `hardAttend` on the page), and `softmax(scores, beta)` times values. A query slider (0 to 2, step 0.01) and a "sharpness" beta slider (0.5 to 14) drive the page (`hard-attend.html:19-61`).

**Result:** No measured result. It is a teaching page, and "The folder has no tests." The page shows that the one-hot gather and the direct gather give the same value, and that the softmax read moves toward that value as sharpness rises.

**Status:** Historical. It "moved here from the repo root on September 16, 2026". The `hardAttend` operation was considered in the June 2026 plan, and status.md's parked entry "Revisit hardAttend" says its indexed-retrieval half is now covered by `circuit.indexRead` and gather lowering. Its scored-selection half is the open decision-8 experiment, with the caution "Compare alternatives without presuming that attention must emerge."

**Visual idea:** Draw the three parabolas `2·q·j − j²` as one score curve per item over a horizontal query axis. A query marker slides left to right, and at each moment the tallest curve lights its item. Below, three output gauges move together: the one-hot and direct gauges jump in steps (10, 20, 30), and the softmax gauge glides between them. Turn the sharpness knob up and the glide stiffens into the same steps.

**Sources:**
- lab/hard-attend/README.md:1-7
- lab/hard-attend/hard-attend.ts:1-80, 129-184
- lab/hard-attend/hard-attend.html:11-61 (grep of labels and sliders)
- lab/status.md:257
- commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
