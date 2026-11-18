#!/bin/sh
# Makes the droplet update itself after every push to GitHub.
#   sudo sh scripts/install-auto-deploy.sh            install (checks every 2 minutes)
#   sudo sh scripts/install-auto-deploy.sh --remove   turn it off
# Watch it work:  journalctl -u istilda-auto-deploy -f
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo:  sudo sh scripts/install-auto-deploy.sh" >&2
  exit 1
fi

UNIT=istilda-auto-deploy
if [ "${1:-}" = "--remove" ]; then
  systemctl disable --now "$UNIT.timer" 2>/dev/null || true
  rm -f "/etc/systemd/system/$UNIT.service" "/etc/systemd/system/$UNIT.timer"
  systemctl daemon-reload
  echo "Automatic updates are off. Update by hand with: sh scripts/deploy.sh"
  exit 0
fi

DIR=$(cd "$(dirname "$0")/.." && pwd)
OWNER=$(stat -c %U "$DIR")
HOME_DIR=$(getent passwd "$OWNER" | cut -d: -f6)

# Checks before installing, so problems show up now and not silently later.
[ -f "$DIR/.env" ] || { echo "No .env in $DIR yet. Run sh scripts/setup-env.sh first." >&2; exit 1; }
if [ "$OWNER" != root ] && ! id -nG "$OWNER" | tr ' ' '\n' | grep -qx docker; then
  echo "$OWNER isn't in the docker group, so it can't restart the store." >&2
  exit 1
fi
if ! sudo -u "$OWNER" -H env GIT_TERMINAL_PROMPT=0 git -C "$DIR" fetch --quiet origin; then
  echo "$OWNER can't fetch from GitHub without typing a password." >&2
  echo "Use an SSH deploy key for the repository (see README, step 6), then run this again." >&2
  exit 1
fi
if ! sudo -u "$OWNER" -H git -C "$DIR" rev-parse '@{upstream}' >/dev/null 2>&1; then
  echo "The checked-out branch doesn't track a GitHub branch. Run: git branch -u origin/master" >&2
  exit 1
fi

cat > "/etc/systemd/system/$UNIT.service" <<UNITFILE
[Unit]
Description=Update the Istilda store when GitHub has a new version
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
User=$OWNER
Environment=HOME=$HOME_DIR
WorkingDirectory=$DIR
ExecStart=/bin/sh $DIR/scripts/auto-deploy.sh
UNITFILE

cat > "/etc/systemd/system/$UNIT.timer" <<UNITFILE
[Unit]
Description=Check GitHub for a new Istilda version every 2 minutes

[Timer]
OnBootSec=2min
OnUnitInactiveSec=2min

[Install]
WantedBy=timers.target
UNITFILE

systemctl daemon-reload
systemctl enable --now "$UNIT.timer"
echo "Done. The droplet now checks GitHub every 2 minutes and updates itself after each push."
echo "Watch it:  journalctl -u $UNIT -f      Turn off:  sudo sh scripts/install-auto-deploy.sh --remove"
