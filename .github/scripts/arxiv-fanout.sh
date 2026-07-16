#!/usr/bin/env bash
# Fan the weekly arXiv discovery plan out into issues, and build ONE book.
#
# The discovery step (arxiv-weekly.yml) writes /tmp/arxiv-plan.json:
#   { "week": "2026-W29",
#     "candidates": [ { "rank": 1, "arxiv_id": "2607.12345", "paper_title": "…",
#                       "authors": "…", "concept": "…", "why_teachable": "…",
#                       "coverage": "not covered — nearest is <slug>: <why distinct>",
#                       "book_title": "…", "subsystem": "<what to explain>" }, … ] }
#
# Every candidate becomes a `new-book` + `paper-candidate` issue. Issues created
# with GITHUB_TOKEN never fire issue events, so filing them triggers nothing —
# BY DESIGN (the discovery bot is not a collaborator; a human can start any of
# them later by applying the `build` label). Only the rank-1 candidate is then
# built, by explicitly dispatching new-book.yml on its issue number — one paper
# a week, the rest of the ranking preserved as tickets.
set -euo pipefail

PLAN=/tmp/arxiv-plan.json
if [ ! -f "$PLAN" ]; then
  echo "::warning::no discovery plan at $PLAN — nothing to file this week"
  exit 0
fi

jq -e '.candidates | length > 0' "$PLAN" > /dev/null || {
  echo "::warning::discovery found no new teachable concepts this week"
  exit 0
}

week=$(jq -r '.week // "this week"' "$PLAN")
total=$(jq -r '.candidates | length' "$PLAN")
top_issue=""
summary=""

for i in $(seq 0 $((total - 1))); do
  cand() { jq -r ".candidates[$i].$1 // \"\"" "$PLAN"; }
  rank=$(cand rank); id=$(cand arxiv_id); paper=$(cand paper_title)
  authors=$(cand authors); concept=$(cand concept)
  why=$(cand why_teachable); coverage=$(cand coverage)
  title=$(cand book_title); subsystem=$(cand subsystem)

  body=$(printf '%s\n' \
    "### Repo or source" "" "https://arxiv.org/abs/$id" "" \
    "### What to explain" "" \
    "$subsystem" "" \
    "Paper: \"$paper\" — $authors (arXiv:$id)." "" \
    "Teachable concept: $concept" "" \
    "Why teachable: $why" "" \
    "Coverage check: $coverage" "" \
    "This book is part of the series \"Fresh from arXiv\" — pass --series \"Fresh from arXiv\" and the next free --series-order to video.mjs." "" \
    "### Cover title" "" "$title" "" \
    "### Subtitle (optional)" "" "Fresh from arXiv · $id" "" \
    "### Model" "" "(claude-opus-4-8)")

  url=$(gh issue create --repo "$REPO" --label new-book --label paper-candidate \
    --title "📕 $title (arXiv:$id, $week rank $rank)" --body "$body")
  n="${url##*/}"
  echo "created #$n — rank $rank: $paper"
  summary="$summary
- rank $rank: #$n — $paper (arXiv:$id)"
  [ "$rank" = "1" ] && top_issue="$n"
done

if [ -n "$top_issue" ]; then
  echo "dispatching new-book.yml for rank-1 issue #$top_issue"
  gh workflow run new-book.yml --repo "$REPO" --ref main -f issue_number="$top_issue"
  gh issue comment "$top_issue" --repo "$REPO" --body \
    "🔬 This week's pick ($week) — build dispatched automatically. The other ranked candidates were filed as inert tickets (apply the **build** label to run any of them):$summary"
else
  echo "::warning::no rank-1 candidate in the plan — filed tickets only"
fi
