#!/bin/sh
# Run every few minutes by the istilda-auto-deploy timer (see install-auto-deploy.sh).
# If GitHub has a newer commit than the version that's running, and GitHub has finished
# building its image, it runs deploy.sh. Otherwise it does nothing.
set -eu
cd "$(dirname "$0")/.."

# One run at a time.
exec 9>"${TMPDIR:-/tmp}/istilda-auto-deploy.lock"
flock -n 9 || exit 0

export GIT_TERMINAL_PROMPT=0
git fetch --quiet origin
TARGET=$(git rev-parse '@{upstream}')
RUNNING=$(docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' istilda-web 2>/dev/null || true)

[ "$TARGET" = "$RUNNING" ] && exit 0

echo "New version on GitHub: ${TARGET%"${TARGET#???????}"} (running: ${RUNNING:-none})"
status=0
WAIT_FOR_BUILD=no sh scripts/deploy.sh || status=$?
# 3 = GitHub is still building; the next round picks it up.
[ "$status" -eq 3 ] && exit 0
exit "$status"
