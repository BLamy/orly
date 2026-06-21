#!/usr/bin/env bash
# Cheap pre-flight that runs BEFORE the expensive generation step. It proves the
# PR plumbing actually works — so a broken token, missing permission, or a syntax
# bug in the PR script fails here in seconds instead of AFTER burning generation
# spend. Inputs come from the environment (REPO, GH_TOKEN).
set -euo pipefail
: "${REPO:?REPO required}" "${GH_TOKEN:?GH_TOKEN required}"

echo "• syntax-checking the PR scripts…"
bash -n .github/scripts/open-book-pr.sh
bash -n .github/scripts/preflight-push.sh

echo "• checking gh CLI + pull-request API access…"
gh pr list --limit 1 >/dev/null

echo "• test-pushing a throwaway branch (then deleting it)…"
PRE="ci-preflight/${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
URL="https://x-access-token:${GH_TOKEN}@github.com/${REPO}.git"
git push "$URL" "HEAD:refs/heads/$PRE"
git push "$URL" --delete "$PRE"

echo "✓ pre-flight OK — scripts parse, push + gh work. Safe to generate."
