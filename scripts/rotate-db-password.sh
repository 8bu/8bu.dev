#!/usr/bin/env bash
# Rotate the prod portf DB password with ZERO human knowledge of the value.
#
# The password is generated in-memory, applied to (1) the Postgres role on the
# VPS and (2) the Cloudflare Hyperdrive origin config, then discarded. Nobody —
# not even you — ever needs to save it: the app never touches the password, only
# Hyperdrive does, and Hyperdrive stores it server-side after this script sets it.
#
# It is NEVER printed on success, NEVER written to disk, and is fed to Postgres
# over ssh stdin (not argv, so it can't leak via `ps`/shell history). The one
# unavoidable exposure is the wrangler `--origin-password` argv on THIS machine
# for the ~seconds the command runs — acceptable on a single-user box.
#
# Safety: both writes must succeed. The role is changed first, then Hyperdrive.
# If the Hyperdrive write fails the role's new password is live but Hyperdrive
# still has the old one (prod DB unreachable) — the script retries, and only if
# it still can't recover does it print the password ONCE so you can fix it by
# hand. That is the sole path by which the value ever reaches your screen.
#
# Usage:  scripts/rotate-db-password.sh [-y]
#   -y   skip the confirmation prompt
#
# Override any of these via env if the topology changes:
set -euo pipefail

SSH_HOST="${SSH_HOST:-71z}"
DB_ROLE="${DB_ROLE:-portf_app}"
DB_NAME="${DB_NAME:-portf}"
HYPERDRIVE_ID="${HYPERDRIVE_ID:-41297ec8871b4cd28c77245a85cc7834}"
WRANGLER="${WRANGLER:-pnpm --filter @8budev/api exec wrangler}"
HEALTH_URL="${HEALTH_URL:-https://8bu.dev/api/healthz}"
CHAT_URL="${CHAT_URL:-https://8bu.dev/api/chat}"

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; BLUE=$'\033[0;34m'; NC=$'\033[0m'
info()  { printf '%s\n' "${BLUE}» $*${NC}"; }
ok()    { printf '%s\n' "${GREEN}✓ $*${NC}"; }
warn()  { printf '%s\n' "${YELLOW}! $*${NC}" >&2; }
err()   { printf '%s\n' "${RED}✗ $*${NC}" >&2; }

# Never let the shell trace the password if someone runs with `bash -x`.
case "$-" in *x*) err "refusing to run under 'set -x' (would leak the password)"; exit 1;; esac

cd "$(git rev-parse --show-toplevel)"

ASSUME_YES=0
[[ "${1:-}" == "-y" || "${1:-}" == "--yes" ]] && ASSUME_YES=1

if [[ "$ASSUME_YES" -ne 1 ]]; then
  printf '%s' "${YELLOW}Rotate ${DB_ROLE}@${DB_NAME} password now (prod, brief blip)? [y/N] ${NC}"
  read -r reply
  [[ "$reply" == "y" || "$reply" == "Y" ]] || { info "aborted."; exit 0; }
fi

# 1) Generate — held only in this variable, in this process.
NEW="$(openssl rand -hex 24)"
[[ -n "$NEW" ]] || { err "password generation failed"; exit 1; }

emergency_print() {
  err "COULD NOT sync Hyperdrive. The role password is ALREADY changed, so prod"
  err "is DOWN until Hyperdrive gets this value. Set it by hand, then it clears:"
  err "  ${WRANGLER} hyperdrive update ${HYPERDRIVE_ID} --origin-password=<below>"
  printf '%s\n' "${RED}EMERGENCY PASSWORD (copy now, shown once): ${NEW}${NC}" >&2
}

# 2) Postgres role — password piped over ssh stdin, not argv. Postgres does not
#    log ALTER ROLE ... PASSWORD in plaintext at default log_statement settings.
info "Setting ${DB_ROLE} password on ${SSH_HOST}…"
if ! printf "ALTER ROLE %s PASSWORD %s;\n" "$DB_ROLE" "'$NEW'" \
     | ssh "$SSH_HOST" "sudo -u postgres psql -q -v ON_ERROR_STOP=1 -d postgres" >/dev/null; then
  err "ALTER ROLE failed — password NOT applied anywhere. Nothing to recover; safe to retry."
  unset NEW
  exit 1
fi
ok "role password set."

# 3) Hyperdrive origin — PATCH preserves host/user/db/access creds. Retry a few
#    times before falling back to emergency print, since a transient failure here
#    strands prod on a password nobody knows.
info "Updating Hyperdrive ${HYPERDRIVE_ID}…"
hd_ok=0
for attempt in 1 2 3; do
  if $WRANGLER hyperdrive update "$HYPERDRIVE_ID" --origin-password="$NEW" >/dev/null 2>&1; then
    hd_ok=1; break
  fi
  warn "Hyperdrive update attempt ${attempt} failed; retrying…"
  sleep 3
done
if [[ "$hd_ok" -ne 1 ]]; then
  emergency_print
  unset NEW
  exit 1
fi
ok "Hyperdrive password updated (access creds preserved)."

# 4) Discard the password NOW — from here on we only verify, never need it again.
unset NEW

# 5) Verify prod. Hyperdrive opens fresh connections with the new password.
info "Verifying prod (allowing for connection-pool warm-up)…"
health_ok=0
for attempt in 1 2 3 4 5; do
  if curl -fsS "$HEALTH_URL" 2>/dev/null | grep -q '"db":"up"'; then health_ok=1; break; fi
  sleep 3
done
if [[ "$health_ok" -ne 1 ]]; then
  err "Health check still failing after retries. Both writes succeeded, so this is"
  err "likely pool lag — re-check ${HEALTH_URL} manually in a minute."
  exit 1
fi
ok "healthz: db up."

if curl -fsS -X POST "$CHAT_URL" -H 'Content-Type: application/json' \
     --data '{"message":"What is your tech stack?"}' 2>/dev/null | grep -q '"type":"metadata"'; then
  ok "chat retrieval served (DB reachable end-to-end)."
else
  warn "chat probe did not return metadata — verify manually, but healthz is green."
fi

ok "Rotation complete. New password applied to role + Hyperdrive and discarded. Nobody holds it."
