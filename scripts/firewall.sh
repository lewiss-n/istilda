#!/bin/bash
# Locks down the droplet: only SSH (and the website's ports 80/443) are reachable from the internet.
# Also closes the gap where Docker skips UFW for ports published by containers.
#
# Run as root on the droplet:
#   bash scripts/firewall.sh
#
# Options (set before the command):
#   ALLOW_WEB=no       block 80/443 too (SSH only). Default: yes, the store needs them.
#   ADMIN_IP=1.2.3.4   also allow Nginx Proxy Manager's admin panel (port 81) from this one address.
#                      Find yours by searching "what is my ip". Default: port 81 closed to everyone.
#
# Example:  ADMIN_IP=41.90.12.34 bash scripts/firewall.sh
# Safe to run again; it replaces its own rules each time.
set -euo pipefail

ALLOW_WEB="${ALLOW_WEB:-yes}"
ADMIN_IP="${ADMIN_IP:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root (or with sudo)." >&2
  exit 1
fi

if [ -n "$ADMIN_IP" ] && ! printf '%s' "$ADMIN_IP" | grep -Eq '^[0-9]{1,3}(\.[0-9]{1,3}){3}(/[0-9]{1,2})?$'; then
  echo "ADMIN_IP doesn't look like an IPv4 address: $ADMIN_IP" >&2
  exit 1
fi

# Which port SSH really listens on, so we never lock you out.
SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port /{print $2; exit}')"
SSH_PORT="${SSH_PORT:-22}"
echo "==> SSH is on port $SSH_PORT; it stays open."

if ! command -v ufw >/dev/null 2>&1; then
  echo "==> Installing ufw"
  apt-get update -qq && apt-get install -y -qq ufw >/dev/null
fi

# --- 1. Rules for the server itself ---------------------------------------------------------
echo "==> Setting the firewall: block incoming, allow outgoing"
ufw --force reset >/dev/null           # start clean (keeps this script's results predictable)
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw default deny routed >/dev/null

# SSH with brute-force protection: more than 6 new connections in 30 s from one address is refused.
ufw limit "$SSH_PORT"/tcp comment 'SSH' >/dev/null

# --- 2. Make Docker obey the firewall -------------------------------------------------------
# Docker inserts its own rules ahead of UFW, so a published container port (like Nginx Proxy
# Manager's 80, 443 and 81) is open to the world whatever UFW says. These rules send that
# traffic through UFW's checks too (the approach from github.com/chaifeng/ufw-docker).
AFTER=/etc/ufw/after.rules
if [ ! -f "$AFTER.istilda-backup" ]; then cp "$AFTER" "$AFTER.istilda-backup"; fi
# Remove our block if it's there from an earlier run, then add it fresh.
sed -i '/^# BEGIN UFW AND DOCKER/,/^# END UFW AND DOCKER/d' "$AFTER"
cat >> "$AFTER" <<'RULES'
# BEGIN UFW AND DOCKER
*filter
:ufw-user-forward - [0:0]
:ufw-docker-logging-deny - [0:0]
:DOCKER-USER - [0:0]
-A DOCKER-USER -j ufw-user-forward

-A DOCKER-USER -j RETURN -s 10.0.0.0/8
-A DOCKER-USER -j RETURN -s 172.16.0.0/12
-A DOCKER-USER -j RETURN -s 192.168.0.0/16

-A DOCKER-USER -p udp -m udp --sport 53 --dport 1024:65535 -j RETURN

-A DOCKER-USER -j ufw-docker-logging-deny -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -d 192.168.0.0/16
-A DOCKER-USER -j ufw-docker-logging-deny -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -d 10.0.0.0/8
-A DOCKER-USER -j ufw-docker-logging-deny -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -d 172.16.0.0/12
-A DOCKER-USER -j ufw-docker-logging-deny -p udp -m udp --dport 0:32767 -d 192.168.0.0/16
-A DOCKER-USER -j ufw-docker-logging-deny -p udp -m udp --dport 0:32767 -d 10.0.0.0/8
-A DOCKER-USER -j ufw-docker-logging-deny -p udp -m udp --dport 0:32767 -d 172.16.0.0/12

-A DOCKER-USER -j RETURN

-A ufw-docker-logging-deny -m limit --limit 3/min --limit-burst 10 -j LOG --log-prefix "[UFW DOCKER BLOCK] "
-A ufw-docker-logging-deny -j DROP

COMMIT
# END UFW AND DOCKER
RULES

# --- 3. What the public may reach -----------------------------------------------------------
if [ "$ALLOW_WEB" = "yes" ]; then
  echo "==> Allowing the website: ports 80 and 443"
  ufw allow 80/tcp comment 'HTTP' >/dev/null
  ufw allow 443/tcp comment 'HTTPS' >/dev/null
  # Same ports when they're served by a container (Nginx Proxy Manager).
  ufw route allow proto tcp from any to any port 80 comment 'HTTP to Docker' >/dev/null
  ufw route allow proto tcp from any to any port 443 comment 'HTTPS to Docker' >/dev/null
else
  echo "==> ALLOW_WEB=no: ports 80 and 443 stay closed"
fi

if [ -n "$ADMIN_IP" ]; then
  echo "==> Allowing Nginx Proxy Manager's admin panel (port 81) from $ADMIN_IP only"
  ufw allow from "$ADMIN_IP" to any port 81 proto tcp comment 'NPM admin' >/dev/null
  ufw route allow proto tcp from "$ADMIN_IP" to any port 81 comment 'NPM admin to Docker' >/dev/null
else
  echo "==> Port 81 (Nginx Proxy Manager admin) closed to everyone"
fi

# --- 4. Switch on -------------------------------------------------------------------------
echo "==> Turning the firewall on"
ufw --force enable >/dev/null
ufw reload >/dev/null

echo
ufw status verbose
echo
echo "Done. Before closing this session, open a NEW terminal and check you can still log in:"
echo "  ssh root@<droplet-ip>"
echo "If anything goes wrong, turn the firewall off with:  ufw disable"
