#!/bin/sh
# Updates the live store to the latest code on GitHub, and also does the first launch.
# Run from the project folder on the droplet:
#   sh scripts/deploy.sh
#
# It downloads the image GitHub built for your latest commit (see .github/workflows) instead
# of building it here, so a 1 GB droplet doesn't run out of memory. If GitHub is still building,
# it waits. Your database, photos and backups are kept.
#
# Automatic updates after every push: sudo sh scripts/install-auto-deploy.sh
#
# To build on the server anyway (needs about 2 GB of RAM or swap):
#   BUILD_ON_SERVER=yes sh scripts/deploy.sh
set -eu
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "No .env yet. Create it first with:  sh scripts/setup-env.sh" >&2
  exit 1
fi

envval() { sed -n "s/^$1=//p" .env 2>/dev/null | tr -d '\r' | tail -n 1; }

# On the server, ignore docker-compose.override.yml (it builds locally). Older .env files
# from before this change don't have the setting yet, so add it.
if ! grep -q '^COMPOSE_FILE=' .env; then
  printf '\n# Use only docker-compose.yml on the server (download the image, never build it here).\nCOMPOSE_FILE=docker-compose.yml\n' >> .env
  echo "==> Added COMPOSE_FILE=docker-compose.yml to .env"
fi
WEB_PORT=$(envval WEB_PORT)
WEB_IMAGE=$(envval WEB_IMAGE)
WEB_IMAGE=${WEB_IMAGE:-ghcr.io/lewiss-n/istilda:latest}

docker network inspect "$(envval PROXY_NETWORK | grep . || echo proxy)" >/dev/null 2>&1 \
  || docker network create "$(envval PROXY_NETWORK | grep . || echo proxy)" >/dev/null

echo "==> Getting the latest code"
git pull --ff-only
COMMIT=$(git rev-parse HEAD)

if [ "${BUILD_ON_SERVER:-no}" = "yes" ]; then
  echo "==> Building on this server (needs about 2 GB of RAM or swap)"
  docker compose -f docker-compose.yml -f docker-compose.override.yml up -d --build --remove-orphans
else
  echo "==> Downloading the image GitHub built for commit ${COMMIT%"${COMMIT#???????}"}"
  tries=0
  while :; do
    if ! docker compose pull --quiet 2>/tmp/istilda-pull.log; then
      if grep -qiE 'denied|unauthorized|forbidden' /tmp/istilda-pull.log; then
        echo "Couldn't download $WEB_IMAGE: access denied." >&2
        echo "If the GitHub repository is private, log in once with:" >&2
        echo "  docker login ghcr.io -u <your-github-username>" >&2
        echo "using a GitHub token with the read:packages permission as the password (see README)." >&2
        exit 1
      fi
      if grep -qiE 'not found|manifest unknown' /tmp/istilda-pull.log; then
        built=""
      else
        cat /tmp/istilda-pull.log >&2
        exit 1
      fi
    else
      built=$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$WEB_IMAGE" 2>/dev/null || true)
    fi
    [ "$built" = "$COMMIT" ] && break
    tries=$((tries + 1))
    # Automatic updates check once and try again on their next round instead of waiting here.
    if [ "${WAIT_FOR_BUILD:-yes}" = "no" ]; then
      echo "    GitHub hasn't finished building this version yet; will try again later."
      exit 3
    fi
    if [ "$tries" -ge 30 ]; then
      echo "GitHub hasn't finished an image for your latest commit after 15 minutes." >&2
      echo "Check the Actions tab of your repository on GitHub for a failed build, then run this again." >&2
      exit 1
    fi
    [ "$tries" -eq 1 ] && echo "    GitHub is still building this version; waiting (checking every 30 seconds)..."
    sleep 30
  done
  echo "==> Starting the new version (the site restarts for a few seconds)"
  docker compose up -d --no-build --remove-orphans
fi

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
