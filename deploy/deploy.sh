#!/usr/bin/env bash
# One-shot install / update of the Level Up Com site on the server.
#   first time:  bash deploy/deploy.sh install
#   updates:     bash deploy/deploy.sh update
# Assumes: repo cloned at /root/app/chahca/chacha, node 20+, pm2 and nginx installed,
# and DNS for levelupbusiness.site pointing at this server.
set -euo pipefail
APP_DIR="${APP_DIR:-/root/app/chahca/chacha}"
DOMAIN="levelupbusiness.site"
MODE="${1:-update}"

cd "$APP_DIR"
echo "== pulling latest"
git pull --ff-only origin main

echo "== installing dependencies"
npm ci --no-audit --no-fund

echo "== building"
rm -rf .next
npm run build

if [ "$MODE" = "install" ]; then
  echo "== nginx site"
  cp deploy/nginx-levelupbusiness.site.conf /etc/nginx/sites-available/$DOMAIN
  ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
  nginx -t && systemctl reload nginx

  echo "== pm2 app on port 3002"
  pm2 start ecosystem.config.js
  pm2 save

  echo "== TLS certificate (Let's Encrypt)"
  if command -v certbot >/dev/null; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --redirect -m "${CERTBOT_EMAIL:-admin@$DOMAIN}" || echo "certbot failed: check that DNS already points here, then rerun: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  else
    echo "certbot not installed: apt install certbot python3-certbot-nginx, then: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  fi
else
  echo "== restarting pm2 app"
  pm2 restart levelup-com --update-env || pm2 start ecosystem.config.js
  pm2 save
fi

echo "== status"
pm2 status
curl -s -o /dev/null -w "local http://127.0.0.1:3002/ -> %{http_code}\n" http://127.0.0.1:3002/
echo "done: https://$DOMAIN"
