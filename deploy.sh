#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# -- output helpers ---------------------------------------------------------
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; BLUE=$'\033[0;34m'; NC=$'\033[0m'
print_success() { printf '%s\n' "${GREEN}✓ $*${NC}"; }
print_error()   { printf '%s\n' "${RED}✗ $*${NC}" >&2; }
print_warning() { printf '%s\n' "${YELLOW}! $*${NC}"; }
print_info()    { printf '%s\n' "${BLUE}» $*${NC}"; }

# shellcheck disable=SC2086
WRANGLER="pnpm --filter @8budev/api exec wrangler"

confirm() {
  local reply
  read -rp "$1 [y/N] " reply
  [[ "$reply" == "y" || "$reply" == "Y" ]]
}

run_gates() {
  print_info "Running standing gates…"
  pnpm -r typecheck \
    && pnpm lint \
    && pnpm format:check \
    && pnpm -r --workspace-concurrency=1 test \
    && pnpm --filter @8budev/web build \
    && pnpm --filter @8budev/web test:ssg
  print_success "Gates green."
}

deploy_web_pages() {
  run_gates
  print_info "Building @8budev/web…"
  pnpm --filter @8budev/web build
  print_info "Deploying web → Pages (portf project → 8bu.dev)…"
  # TanStack Start prerender output lives in dist/client. Absolute path: $WRANGLER
  # runs from services/api (pnpm --filter), so a relative path resolves wrong
  # under wrangler v4.
  # shellcheck disable=SC2086
  $WRANGLER pages deploy "$(pwd)/apps/web/dist/client" --project-name portf --branch production
  print_success "web Pages deployed."
}

deploy_api_worker() {
  run_gates
  print_info "Deploying portf-api Worker (env.portf → route 8bu.dev/api/*)…"
  (cd services/api && pnpm exec wrangler deploy -e portf)
  print_success "portf-api deployed."
}

deploy_all() {
  run_gates
  pnpm --filter @8budev/web build
  # shellcheck disable=SC2086
  $WRANGLER pages deploy apps/web/dist/client --project-name portf --branch production
  (cd services/api && pnpm exec wrangler deploy -e portf)
  print_success "Full deploy complete: https://8bu.dev"
}

run_migration() {
  # The live Neon `portf` DB already has 001-004/010 applied; this should be a
  # no-op (all skipped). URL pasted hidden — never persisted to disk.
  local db_url
  print_info "Paste the Neon DIRECT (non-pooled) URL for the portf DB (input hidden):"
  read -rsp "  portf DATABASE_URL: " db_url; printf '\n'
  if [[ -z "$db_url" ]]; then print_error "Empty URL — aborting."; return 1; fi
  print_info "Running migrations against portf…"
  DATABASE_URL="$db_url" node_modules/.bin/tsx packages/db/src/migrate.ts up
  print_success "Migrations applied (or already up-to-date)."
}

status() {
  # shellcheck disable=SC2086
  { print_info "wrangler account:"; $WRANGLER whoami || true; }
  print_info "portf /healthz:"; curl -fsS https://8bu.dev/api/healthz || print_warning "portf health unreachable"
  printf '\n'
}

menu() {
  cat <<'MENU'

8bu.dev deploy - Cloudflare + Neon (manual)
  2) Deploy web      → Pages (portf → 8bu.dev)
  4) Deploy portf-api → Worker (env.portf, route 8bu.dev/api/*)
  6) Deploy ALL (gates → 2,4)
  7) Run Neon migration (portf)
  9) Status
 10) Run standing gates only
  0) Exit
MENU
  printf 'Choose: '
}

main() {
  local choice
  while true; do
    menu
    read -r choice
    case "$choice" in
      2) deploy_web_pages ;;
      4) deploy_api_worker ;;
      6) confirm "Deploy EVERYTHING to production (8bu.dev)?" && deploy_all ;;
      7) run_migration ;;
      9) status ;;
      10) run_gates ;;
      0) print_info "Bye."; exit 0 ;;
      *) print_error "Invalid choice." ;;
    esac
  done
}

main "$@"
