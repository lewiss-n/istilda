#!/bin/sh
# Creates .env on the server with strong random passwords. Run once, from the project folder:
#   sh scripts/setup-env.sh
set -eu
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  echo ".env already exists, so nothing was changed."
  echo "Edit it with:  nano .env"
  exit 1
fi

rand() { head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n' | cut -c1-"$1"; }

printf "Your domain, without https:// (e.g. istilda.co.ke): "
read -r domain
printf "Your WhatsApp number in international format (e.g. 254712345678): "
read -r whatsapp
domain=$(printf '%s' "$domain" | sed -e 's#^https\{0,1\}://##' -e 's#/*$##')
whatsapp=$(printf '%s' "$whatsapp" | tr -cd '0-9')

admin_password=$(rand 20)

umask 077
cat > .env <<ENV
# Created by scripts/setup-env.sh. Keep this file private.

# Admin login for https://$domain/admin (you can change it later in Admin > Settings).
ADMIN_PASSWORD=$admin_password

# Your WhatsApp number, e.g. 254712345678.
WHATSAPP_NUMBER=$whatsapp

# The store's public address.
SITE_URL=https://$domain

# Signs admin logins.
SESSION_SECRET=$(rand 64)

# The site is served over HTTPS by Nginx Proxy Manager.
COOKIE_SECURE=true

# Database password. Set once; don't change it after the first start.
POSTGRES_PASSWORD=$(rand 48)

# Days of daily database backups to keep in ./backups.
BACKUP_KEEP_DAYS=14

# Docker network shared with Nginx Proxy Manager.
PROXY_NETWORK=proxy
ENV

echo
echo "Created .env"
echo "Your admin password is:  $admin_password"
echo "Save it in your password manager now. It's also in .env."
