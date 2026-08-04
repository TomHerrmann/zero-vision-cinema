#!/usr/bin/env bash
#
# Run a command against PRODUCTION: pull the env vars from Vercel, run, then
# always delete the pulled file — including on failure or Ctrl-C, via the EXIT
# trap. Keeping production secrets on disk only for the life of one command is
# the point; don't replace this with a bare `vercel env pull`.
#
#   scripts/with-prod-env.sh tsx --env-file=.env.production.local script.tsx
#
# Also exports NODE_ENV=production, which is not cosmetic: payload.config.ts
# passes no `push` option to vercelPostgresAdapter, so without it Payload treats
# the connection as a dev database and tries to push schema changes — against
# production that means offering to DROP columns.
#
# Vars marked "Sensitive" in Vercel are write-only: the deployment gets the real
# value at runtime, but `env pull` returns the literal string [SENSITIVE], and
# whatever needs them then fails as if the credential were wrong. Set
# PROD_ENV_FALLBACK to a comma-separated list of names to fill those from your
# local .env.local instead:
#
#   PROD_ENV_FALLBACK=QSTASH_TOKEN scripts/with-prod-env.sh …
#
# Only do that where the local credential addresses the same upstream account as
# production's. It is deliberately opt-in and per-variable — a blanket fallback
# would quietly run production work against, say, a Stripe test key.
set -euo pipefail

ENV_FILE=".env.production.local"

cleanup() {
  rm -f "$ENV_FILE"
}
trap cleanup EXIT

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <command> [args...]" >&2
  exit 2
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI not found — install it with \`npm i -g vercel\`." >&2
  exit 1
fi

echo "Pulling production env from Vercel…" >&2
if ! vercel env pull "$ENV_FILE" --environment=production --yes >/dev/null 2>&1; then
  echo "Failed to pull production env. Is the project linked (\`vercel link\`)?" >&2
  exit 1
fi

read_env_value() {
  grep -m1 "^$1=" "$2" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'"
}

# Shell env beats tsx's --env-file, so exporting here overrides the placeholder.
declare -a FILLED=()
if [ -n "${PROD_ENV_FALLBACK:-}" ] && [ -f .env.local ]; then
  for var in ${PROD_ENV_FALLBACK//,/ }; do
    value=$(read_env_value "$var" .env.local)
    if [ -n "$value" ]; then
      export "$var=$value"
      FILLED+=("$var")
    else
      echo "PROD_ENV_FALLBACK names $var, but .env.local has no value for it." >&2
      exit 1
    fi
  done
fi

if [ ${#FILLED[@]} -gt 0 ]; then
  echo "Using local .env.local values for: ${FILLED[*]}" >&2
fi

# Warn about anything still unusable, minus what we just filled in.
SENSITIVE=$(grep -E '=\"?\[SENSITIVE\]\"?$' "$ENV_FILE" | cut -d= -f1 || true)
for var in "${FILLED[@]:-}"; do
  [ -n "$var" ] && SENSITIVE=$(echo "$SENSITIVE" | grep -vx "$var" || true)
done

if [ -n "$SENSITIVE" ]; then
  echo "" >&2
  echo "⚠️  Marked Sensitive in Vercel and therefore NOT pulled — these arrive as" >&2
  echo "    the literal string [SENSITIVE], and anything needing one will fail as" >&2
  echo "    if the credential were wrong:" >&2
  echo "$SENSITIVE" | sed 's/^/      /' >&2
  echo "    Fill a specific one with PROD_ENV_FALLBACK=NAME if the local value" >&2
  echo "    targets the same account." >&2
  echo "" >&2
fi

NODE_ENV=production "$@"
