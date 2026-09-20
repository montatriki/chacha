# Deploying to levelupbusiness.site

The server already runs two PM2 apps (`levelup` on 3000, `levelup-ai` on 3001). This site runs as a third,
`levelup-com`, on **port 3002**, behind nginx on the domain **levelupbusiness.site**.

## 1. DNS (Namecheap → Advanced DNS)

Delete the parking records and add these, where `SERVER_IP` is the server's public IPv4:

| Type  | Host | Value       | TTL       |
| ----- | ---- | ----------- | --------- |
| A     | @    | SERVER_IP   | Automatic |
| A     | www  | SERVER_IP   | Automatic |

Remove the `CNAME www → parkingpage.namecheap.com` and the `URL Redirect @` records; they conflict with the A records.
Propagation usually takes a few minutes, up to an hour. Check with `dig +short levelupbusiness.site`.

## 2. Server (as root)

```bash
cd /root/app/chahca/chacha        # the clone you already made
git pull
bash deploy/deploy.sh install     # deps, build, nginx site, pm2 app on 3002, Let's Encrypt cert
```

Certbot needs DNS to be live first. If it fails, rerun after propagation:

```bash
certbot --nginx -d levelupbusiness.site -d www.levelupbusiness.site
```

## 3. Updates

```bash
cd /root/app/chahca/chacha && bash deploy/deploy.sh update
```

## Notes

- `.env.local` is not in git. The site needs no secrets to run; only the optional Higgsfield scripts use `HF_CREDENTIALS`.
- Videos are served by nginx directly from `public/data/` with range support and long caching, so the Node process stays light.
- Logs: `pm2 logs levelup-com`. Port check: `curl -I http://127.0.0.1:3002/`.
