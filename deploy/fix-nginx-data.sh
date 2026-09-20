#!/usr/bin/env bash
# Fix "403 Forbidden" on every /data/ asset (logo, fonts, videos, posters).
# Cause: nginx (user www-data) served /data/ straight from /root/app/..., which it cannot read.
# Fix:   proxy /data/ through the Next.js app on port 3002, in every server block certbot created.
#   run on the server:  bash deploy/fix-nginx-data.sh
set -euo pipefail
CONF=/etc/nginx/sites-available/levelupbusiness.site
DOMAIN=levelupbusiness.site
[ -f "$CONF" ] || { echo "missing $CONF"; exit 1; }
cp "$CONF" "$CONF.bak.$(date +%s)"

python3 - "$CONF" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p).read()
block = '''    location /data/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Range $http_range;
        proxy_buffering off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }'''
# replace every existing /data/ block (any content) with the proxied one
new, n = re.subn(r'[ \t]*location /data/ \{.*?\n[ \t]*\}', block, s, flags=re.S)
if n == 0:
    # no /data/ block at all: insert one before each "location / {"
    new, n = re.subn(r'([ \t]*location / \{)', block + '\n\n\\1', s)
open(p, 'w').write(new)
print(f"patched {n} server block(s)")
PY

nginx -t
systemctl reload nginx
echo "== verify"
for path in /data/levelup/logo-white.png /data/fonts/poppins.css /data/videos/levelup-journey.mp4; do
  printf "%-40s %s\n" "$path" "$(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN$path)"
done
echo "(all three should be 200)"
