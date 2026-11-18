#!/bin/bash
# Creates a non-root user for day-to-day work on the droplet: deploying, Docker, logs.
#
# Step 1, as root:
#   bash create-dev-user.sh              creates a user called "dev"
#   bash create-dev-user.sh lewis        or pick the name
#
# It gives the user: your SSH key(s) from root, sudo (with its own password), Docker access,
# the GitHub deploy key if you set one up, and moves /root/istilda into the user's home.
#
# Step 2, only after you've logged in as the new user in a NEW terminal and run `sudo whoami`:
#   sudo bash create-dev-user.sh --lock-root
# This turns off SSH logins as root and with passwords (keys only).
#
# Safe to run again.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root (or with sudo)." >&2
  exit 1
fi

reload_ssh() {
  systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || service ssh reload
}

# ------------------------------------------------------------------------------------------
# Step 2: lock root
# ------------------------------------------------------------------------------------------
if [ "${1:-}" = "--lock-root" ]; then
  # Refuse unless some sudo user other than root can log in with a key.
  ok_user=""
  for u in $(getent group sudo | cut -d: -f4 | tr ',' ' '); do
    home=$(getent passwd "$u" | cut -d: -f6)
    if [ -s "$home/.ssh/authorized_keys" ]; then ok_user="$u"; break; fi
  done
  if [ -z "$ok_user" ]; then
    echo "No sudo user with an SSH key found. Run step 1 first, so you aren't locked out." >&2
    exit 1
  fi
  echo "==> '$ok_user' can log in with a key and use sudo."

  # Files in sshd_config.d are read in name order and the first value wins, so "00-" beats
  # DigitalOcean's 50-cloud-init.conf, which turns password logins on.
  mkdir -p /etc/ssh/sshd_config.d
  cat > /etc/ssh/sshd_config.d/00-istilda-hardening.conf <<'CONF'
# Added by create-dev-user.sh --lock-root
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
CONF
  if [ -f /etc/ssh/sshd_config ] && ! grep -Eq '^\s*Include\s+/etc/ssh/sshd_config.d/\*\.conf' /etc/ssh/sshd_config; then
    sed -i '1i Include /etc/ssh/sshd_config.d/*.conf' /etc/ssh/sshd_config
  fi
  if ! sshd -t; then
    rm -f /etc/ssh/sshd_config.d/00-istilda-hardening.conf
    echo "The SSH settings didn't validate, so nothing was changed." >&2
    exit 1
  fi
  reload_ssh
  echo
  echo "Done: root can no longer log in over SSH, and passwords are off (keys only)."
  echo "Keep this session open and check in a NEW terminal:  ssh $ok_user@<droplet-ip>"
  echo "To undo:  rm /etc/ssh/sshd_config.d/00-istilda-hardening.conf && systemctl reload ssh"
  exit 0
fi

# ------------------------------------------------------------------------------------------
# Step 1: create the user
# ------------------------------------------------------------------------------------------
NAME="${1:-dev}"
if ! printf '%s' "$NAME" | grep -Eq '^[a-z_][a-z0-9_-]{0,31}$'; then
  echo "Use a lowercase name with letters, numbers, - or _ (e.g. dev, lewis)." >&2
  exit 1
fi
if [ "$NAME" = "root" ]; then
  echo "Pick a name other than root." >&2
  exit 1
fi

if id "$NAME" >/dev/null 2>&1; then
  echo "==> User '$NAME' already exists; updating its access"
  created=no
else
  echo "==> Creating user '$NAME'"
  adduser --disabled-password --gecos "" "$NAME" >/dev/null
  created=yes
fi
HOME_DIR=$(getent passwd "$NAME" | cut -d: -f6)

# sudo, and Docker without sudo. Note: Docker access is as powerful as root, so guard this account.
usermod -aG sudo "$NAME"
getent group docker >/dev/null || groupadd docker
usermod -aG docker "$NAME"
echo "==> '$NAME' can use sudo and docker"

# A password, needed for sudo only (SSH logins use keys).
if [ "$created" = "yes" ]; then
  if [ -t 0 ]; then
    echo "==> Choose a password for '$NAME' (used for sudo, not for logging in):"
    until passwd "$NAME"; do echo "Try again."; done
  else
    pw=$(head -c 18 /dev/urandom | base64 | tr -d '/+=' | cut -c1-20)
    echo "$NAME:$pw" | chpasswd
    echo "==> Sudo password for '$NAME':  $pw   (save it now; change it with: passwd)"
  fi
fi

# SSH keys: same keys that log in as root today.
install -d -m 700 -o "$NAME" -g "$NAME" "$HOME_DIR/.ssh"
touch "$HOME_DIR/.ssh/authorized_keys"
if [ -s /root/.ssh/authorized_keys ]; then
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    grep -qxF "$line" "$HOME_DIR/.ssh/authorized_keys" || printf '%s\n' "$line" >> "$HOME_DIR/.ssh/authorized_keys"
  done < /root/.ssh/authorized_keys
  echo "==> Copied root's SSH key(s) to '$NAME'"
else
  echo "==> Root has no SSH keys to copy. Add yours to $HOME_DIR/.ssh/authorized_keys before step 2."
fi

# GitHub deploy key, so the user can pull updates (scripts/deploy.sh).
if [ -f /root/.ssh/istilda_deploy ]; then
  install -m 600 -o "$NAME" -g "$NAME" /root/.ssh/istilda_deploy "$HOME_DIR/.ssh/istilda_deploy"
  [ -f /root/.ssh/istilda_deploy.pub ] && install -m 644 -o "$NAME" -g "$NAME" /root/.ssh/istilda_deploy.pub "$HOME_DIR/.ssh/istilda_deploy.pub"
  touch "$HOME_DIR/.ssh/config"
  if ! grep -q "Host github-istilda" "$HOME_DIR/.ssh/config"; then
    printf 'Host github-istilda\n  HostName github.com\n  User git\n  IdentityFile ~/.ssh/istilda_deploy\n  IdentitiesOnly yes\n' >> "$HOME_DIR/.ssh/config"
  fi
  if [ -f /root/.ssh/known_hosts ]; then
    touch "$HOME_DIR/.ssh/known_hosts"
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      grep -qxF "$line" "$HOME_DIR/.ssh/known_hosts" || printf '%s\n' "$line" >> "$HOME_DIR/.ssh/known_hosts"
    done < /root/.ssh/known_hosts
  fi
  echo "==> Copied the GitHub deploy key"
fi
chown -R "$NAME:$NAME" "$HOME_DIR/.ssh"
chmod 600 "$HOME_DIR/.ssh/authorized_keys"
[ -f "$HOME_DIR/.ssh/config" ] && chmod 600 "$HOME_DIR/.ssh/config"

# Move the store's folder from root's home, so the new user runs it from now on.
if [ -d /root/istilda ] && [ ! -e "$HOME_DIR/istilda" ]; then
  echo "==> Moving /root/istilda to $HOME_DIR/istilda"
  mv /root/istilda "$HOME_DIR/istilda"
  chown -R "$NAME:$NAME" "$HOME_DIR/istilda"
  if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^istilda-'; then
    echo "==> Re-attaching the running store to its new folder (no rebuild, data kept)"
    (cd "$HOME_DIR/istilda" && docker compose up -d >/dev/null 2>&1) || echo "   Run 'docker compose up -d' in ~/istilda as $NAME to finish."
  fi
fi

echo
echo "Done. Now, keeping this session open, open a NEW terminal and check:"
echo "  ssh $NAME@<droplet-ip>"
echo "  sudo whoami        (should print: root)"
echo "  docker ps          (should work without sudo)"
echo "When all three work, lock root logins with:"
echo "  sudo bash create-dev-user.sh --lock-root"
