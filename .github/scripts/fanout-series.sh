#!/usr/bin/env bash
# Fan a series plan out into per-book pipeline runs.
#
# The series generation step (new-series.md, CI path) writes /tmp/series-plan.json:
#   { "series": "…", "source": "<repo url>", "model": "claude-fable-5",
#     "books": [ { "order": 1, "title": "…", "subtitle": "…", "animal": "…",
#                  "accent": "#hex", "subsystem": "<what to explain>" }, … ] }
# For each book: create a new-book issue (form-shaped body). Issues created
# with GITHUB_TOKEN never fire issue events — BY DESIGN we do not dispatch
# them either: a collaborator applies the `build` label to start each book,
# so every autonomous run still has a human approval behind it.
set -euo pipefail

PLAN=/tmp/series-plan.json
if [ ! -f "$PLAN" ]; then
  echo "no series plan at $PLAN — the run authored directly; nothing to fan out"
  echo "fanned=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

jq -e '.series and (.books | length > 0)' "$PLAN" > /dev/null || {
  echo "::error::series plan is malformed"; cat "$PLAN"; exit 1; }

series=$(jq -r .series "$PLAN")
source_url=$(jq -r .source "$PLAN")
model=$(jq -r '.model // "claude-opus-4-8"' "$PLAN")
total=$(jq -r '.books | length' "$PLAN")
children=""

for i in $(seq 0 $((total - 1))); do
  book() { jq -r ".books[$i].$1 // \"\"" "$PLAN"; }
  order=$(book order); title=$(book title); subtitle=$(book subtitle)
  animal=$(book animal); accent=$(book accent); subsystem=$(book subsystem)
  [ -n "$subtitle" ] || subtitle="$series №$order"

  body=$(printf '%s\n' \
    "### Repo or source" "" "$source_url" "" \
    "### What to explain" "" \
    "$subsystem" "" \
    "This book is part of the series \"$series\" (book $order of $total) — pass --series \"$series\" --series-order $order to video.mjs." "" \
    "### Cover title" "" "$title" "" \
    "### Subtitle (optional)" "" "$subtitle" "" \
    "### Cover animal (optional)" "" "$animal" "" \
    "### Accent color (optional hex)" "" "$accent" "" \
    "### Model" "" "($model)")

  url=$(gh issue create --repo "$REPO" --label new-book \
    --title "📕 $title ($series №$order)" --body "$body")
  n="${url##*/}"
  echo "created #$n — $title (waiting for a human to apply the 'build' label)"
  children="$children #$n"
done

gh issue comment "$PARENT" --repo "$REPO" --body \
  "📚 Planned $total books:$children — apply the **build** label to each to start its pipeline run (one CI session per book; each opens its own PR, grouped on the shelf as **$series**)."
echo "fanned=true" >> "$GITHUB_OUTPUT"
