#!/usr/bin/env bash
#
# Deletes the Neon database branch the Vercel integration made for one merged
# PR's preview deployments ("preview/<git branch>"), and nothing else.
#
# Every guard below fails closed: if anything is unexpected, it deletes nothing.
#
# Env:
#   NEON_API_KEY     Neon API key (secret)
#   NEON_PROJECT_ID  Neon project id
#   HEAD_REF         The merged PR's head (source) branch name
#   NEON_API_URL     Optional override, for tests
set -euo pipefail

API="${NEON_API_URL:-https://console.neon.tech/api/v2}"

# Git branches whose Neon branches must never be touched, with or without the
# preview/ prefix.
PROTECTED_GIT_BRANCHES=(main master dev develop development production prod staging)

fail() { echo "::error::$*"; exit 1; }
skip() { echo "::notice::$*"; exit 0; }

[[ -n "${NEON_API_KEY:-}" ]] || fail "NEON_API_KEY is not set."
[[ -n "${NEON_PROJECT_ID:-}" ]] || fail "NEON_PROJECT_ID is not set."
[[ -n "${HEAD_REF:-}" ]] || fail "HEAD_REF is empty."

# Only ordinary branch names: no whitespace, no "..", nothing that could
# change what the request means.
[[ "$HEAD_REF" =~ ^[A-Za-z0-9._/-]+$ ]] || fail "Refusing unusual branch name: $HEAD_REF"
[[ "$HEAD_REF" != *..* ]] || fail "Refusing branch name containing '..': $HEAD_REF"

lower_ref="$(tr '[:upper:]' '[:lower:]' <<<"$HEAD_REF")"
for p in "${PROTECTED_GIT_BRANCHES[@]}"; do
  [[ "$lower_ref" != "$p" ]] || skip "PR came from protected branch '$HEAD_REF'; nothing deleted."
done

TARGET="preview/${HEAD_REF}"
[[ "$TARGET" == preview/?* ]] || fail "Target '$TARGET' is not a preview branch."

auth=(-H "Authorization: Bearer ${NEON_API_KEY}" -H "Accept: application/json")

branches_json="$(curl -fsS "${auth[@]}" "${API}/projects/${NEON_PROJECT_ID}/branches")" \
  || fail "Could not list Neon branches."

# Exact name match only (the API's own search is a substring match).
matches="$(jq -c --arg name "$TARGET" '[.branches[] | select(.name == $name)]' <<<"$branches_json")"
count="$(jq 'length' <<<"$matches")"

[[ "$count" -gt 0 ]] || skip "No Neon branch named '$TARGET'; nothing to delete."
[[ "$count" -eq 1 ]] || fail "Found $count Neon branches named '$TARGET'; refusing to guess."

branch="$(jq -c '.[0]' <<<"$matches")"
id="$(jq -r '.id' <<<"$branch")"
name="$(jq -r '.name' <<<"$branch")"

# Re-check the branch Neon actually returned, not just the name we asked for.
[[ "$name" == "$TARGET" ]] || fail "Name mismatch ($name vs $TARGET)."
[[ "$name" == preview/* ]] || fail "'$name' is not a preview branch."
[[ "$(jq -r '.default // false' <<<"$branch")" == "false" ]] || fail "'$name' is the default branch."
[[ "$(jq -r '.primary // false' <<<"$branch")" == "false" ]] || fail "'$name' is the primary branch."
[[ "$(jq -r '.protected // false' <<<"$branch")" == "false" ]] || fail "'$name' is protected."
[[ "$id" =~ ^br-[a-z0-9-]+$ ]] || fail "Unexpected branch id '$id'."

lower_name="$(tr '[:upper:]' '[:lower:]' <<<"$name")"
for p in "${PROTECTED_GIT_BRANCHES[@]}"; do
  [[ "$lower_name" != "$p" && "$lower_name" != "preview/$p" ]] || fail "'$name' is protected."
done

echo "Deleting Neon branch '$name' ($id)"
curl -fsS -X DELETE "${auth[@]}" "${API}/projects/${NEON_PROJECT_ID}/branches/${id}" >/dev/null \
  || fail "Neon refused to delete '$name'."
echo "Deleted '$name'."
