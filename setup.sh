#!/usr/bin/env bash
#
# kostas-app one-shot local setup.
#   ./setup.sh          install deps, start local infra, run migrations
#   ./setup.sh --run    do all of the above, then start the dev server
#   ./setup.sh --help   show this message
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

RUN_AFTER_SETUP=false
for arg in "$@"; do
  case "$arg" in
    --run)
      RUN_AFTER_SETUP=true
      ;;
    --help|-h)
      sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (use --help)" >&2
      exit 1
      ;;
  esac
done

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
die() { printf '\033[1;31mError: %s\033[0m\n' "$1" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required but not installed. $2"
}

# ---------------------------------------------------------------------------
log "Checking prerequisites"

require_cmd node "Install Node.js >= 20.9.0: https://nodejs.org"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "Node.js >= 20.9.0 required, found $(node -v)"

require_cmd docker "Install Docker (with Compose v2): https://docs.docker.com/get-docker/"
docker compose version >/dev/null 2>&1 || die "docker compose (v2) not available — update Docker."
docker info >/dev/null 2>&1 || die "Docker daemon isn't running. Start Docker Desktop / the docker service and re-run."

if ! command -v pnpm >/dev/null 2>&1; then
  log "pnpm not found, enabling via corepack"
  require_cmd corepack "Install Node.js >= 20.9.0 (ships with corepack) or install pnpm manually: https://pnpm.io/installation"
  corepack enable
fi
PNPM_VERSION="$(node -p "require('./package.json').packageManager" | cut -d'@' -f2)"
corepack prepare "pnpm@${PNPM_VERSION}" --activate

echo "  node:   $(node -v)"
echo "  pnpm:   $(pnpm -v)"
echo "  docker: $(docker --version)"

# ---------------------------------------------------------------------------
log "Setting up environment file"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "  created .env from .env.example (edit it if you need non-default values)"
else
  echo "  .env already exists, leaving it as-is"
fi

# ---------------------------------------------------------------------------
log "Starting local infrastructure (Postgres + Redis)"

docker compose -f docker/docker-compose.yml up -d --wait
echo "  postgres + redis are up and healthy"

# ---------------------------------------------------------------------------
log "Installing dependencies"

pnpm install

# ---------------------------------------------------------------------------
log "Running database migrations"

pnpm db:migrate

log "Seeding database"
pnpm db:seed || echo "  (seed script failed or found no seed data — safe to ignore on repeat runs)"

# ---------------------------------------------------------------------------
log "Setup complete"

echo "  Run 'pnpm dev' to start the app, or re-run this script with --run."
echo "  Stop local infra any time with: docker compose -f docker/docker-compose.yml down"

if [ "$RUN_AFTER_SETUP" = true ]; then
  log "Starting dev server (pnpm dev)"
  exec pnpm dev
fi
