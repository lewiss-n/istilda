#!/bin/sh
# Updates the live store to the latest code on GitHub. Run from the project folder:
#   sh scripts/deploy.sh
# Your database, photos and backups are kept.
set -eu
cd "$(dirname "$0")/.."
WEB_PORT=$(sed -n 's/^WEB_PORT=//p' .env 2>/dev/null | tr -d '\r' | tail -n 1)

echo "==> Getting the latest code"
git pull --ff-only

echo "==> Rebuilding (the site stays up while this runs, then restarts for a few seconds)"
docker compose up -d --build --remove-orphans

echo "==> Removing old images to free disk space"
docker image prune -f >/dev/null

echo "==> Waiting for the store to report healthy"
i=0
until curl -fsS "http://127.0.0.1:${WEB_PORT:-3000}/api/health" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 40 ]; then
    echo "The store didn't come up. Recent logs:"
    docker compose logs --tail=50 web
    exit 1
  fi
  sleep 3
done
echo "==> Done. The store is up."
docker compose ps
