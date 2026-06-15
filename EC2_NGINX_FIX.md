# Fixing "413 Request Entity Too Large" on EC2

## Why this happens

On your EC2 server, **Nginx sits in front of the Node app** as a reverse proxy.
Nginx's default upload limit (`client_max_body_size`) is **1 MB**. Any request
bigger than that is rejected by Nginx with **`413 Request Entity Too Large`**
*before it ever reaches Node* — so no amount of changing the Node code fixes it.

The app already keeps each photo upload well under 1 MB (binary, ~900 KB max),
but raising the Nginx limit removes the error permanently and gives headroom.

---

## The fix (run these on the EC2 server over SSH)

### 1. Open the Nginx config

```bash
sudo nano /etc/nginx/nginx.conf
```

### 2. Add `client_max_body_size` inside the `http { ... }` block

```nginx
http {
    # ... existing settings ...

    client_max_body_size 50M;   # <-- add this line
}
```

> If you use a per-site config instead (e.g. `/etc/nginx/sites-available/default`
> or `/etc/nginx/conf.d/your-site.conf`), add the same line inside the
> `server { ... }` block there.

### 3. Test the config and reload Nginx

```bash
sudo nginx -t            # should say "syntax is ok" / "test is successful"
sudo systemctl reload nginx
```

That's it — the `413 Request Entity Too Large` error is gone.

---

## Recommended full Nginx `server` block (reference)

If you want the complete proxy setup, it should look like this:

```nginx
server {
    listen 80;
    server_name your-domain-or-ip;

    client_max_body_size 50M;      # allow larger uploads

    location / {
        proxy_pass http://127.0.0.1:5001;   # your Node port (check server.js / PORT)
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

---

## Memory note (1 GB EC2)

The Node app's JSON body limit was lowered from `500mb` to `15mb` in
`backend/server.js`. On a 1 GB box, a 500 MB limit could let a few requests
exhaust all RAM and crash the process. Photos upload one-by-one as binary, so
15 MB is far more than the app ever needs for normal JSON requests.

If the Node process still gets killed under load, add a swap file as a safety net:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## After deploying code changes

Pull the latest code and restart the Node app (pm2 / systemd / however it runs):

```bash
cd /path/to/Manas-Mantra
git pull
npm install --prefix backend
npm install --prefix frontend && npm run build --prefix frontend
pm2 restart all      # or: sudo systemctl restart your-node-service
```
