# Istilda Importers — online store

A Next.js store for Istilda Importers with a customer shop and a password-protected admin area.

**Customers can**
- browse 12 categories (wigs/bundles/frontals, handbags, tote bags, electronic gadgets, electric gadgets, cosmetics, perfumes, elegant hats & fascinators, shoes, sandals, sweaters & tops, kitchen gadgets), search and sort
- pick sizes, colours or lengths where a product has options
- send an **order request** with their name, phone, delivery location and notes, either:
  - **on the website**, or
  - **on WhatsApp**: the order is saved first, then WhatsApp opens on their phone with the order already typed out to your number

Both kinds get an order reference (e.g. `IST-7KQ2MX`) and appear in the admin straight away. No payment is taken on the site; you confirm price, delivery and payment with the customer.

**In the admin (`/admin`) you can**
- add, edit and delete products: name, category, description, price, "was" price for sales, options, stock status, "Top pick", and up to 12 photos each (drag and drop; photos are resized automatically)
- see every order, filter by status or channel, call or WhatsApp the customer in one tap, move orders through *New → Contacted → Confirmed → Delivered* (or *Cancelled*) and keep private notes
- **log a WhatsApp order** that a customer sent you directly (not through the site), so every order is on record
- view **analytics**: visitors, page views, order requests, requested value, conversion, a daily traffic and orders chart, a shopping funnel, website vs WhatsApp orders, most viewed and most requested products, traffic sources, top pages and devices
- change your WhatsApp number, contact details, announcement bar, delivery text and admin password

Analytics are built in (no Google Analytics or other third-party trackers). Bots and your own visits while signed in are not counted.

---

## Run it with Docker (recommended)

You need Docker with Docker Compose. Docker runs three containers:

| Container | What it does |
| --- | --- |
| `istilda-web` | the website, on port 3000 (reachable only from the computer or server it runs on) |
| `istilda-db` | PostgreSQL 17, the database (not reachable from outside, only by the website) |
| `istilda-backup` | saves a full database backup to the `backups/` folder every day |

1. Create your settings file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set:
   - `ADMIN_PASSWORD` — the password for `/admin`
   - `WHATSAPP_NUMBER` — your WhatsApp number in international format, e.g. `254712345678` (you can also set this later in Admin › Settings)
   - `POSTGRES_PASSWORD` — a long random password for the database, letters and numbers only. Generate one with `openssl rand -hex 24`. **Set it once and don't change it afterwards**: the database keeps the password it was created with.

2. Create the network the website shares with Nginx Proxy Manager (once per machine; it's harmless if it already exists):
   ```bash
   docker network create proxy
   ```

3. Build and start:
   ```bash
   docker compose up -d --build
   ```
   On first start the website creates all its database tables automatically.

4. Open **http://localhost:3000** for the store and **http://localhost:3000/admin** for the admin.

Your data survives restarts, rebuilds and updates:
- the database is in the Docker volume `istilda_istilda-postgres`
- product photos are in the Docker volume `istilda_istilda-data`

**Updating after code changes:** `docker compose up -d --build` on your own computer (`docker-compose.override.yml` builds from your local code), or `sh scripts/deploy.sh` on a server (it also pulls the latest code from GitHub). New database changes are applied automatically on start.

**Logs:** `docker compose logs -f web`

### Backups

**Database:** the `backup` container saves `backups/istilda-<date>.dump` once a day and keeps the last 14 days (change with `BACKUP_KEEP_DAYS` in `.env`). Copy that folder somewhere off the server regularly, e.g. to cloud storage.

To take one right now:
```bash
docker compose exec db pg_dump -U istilda -d istilda --format=custom > backups/manual.dump
```

To restore a backup (this replaces the current data):
```bash
docker compose stop web
docker compose exec -T db pg_restore -U istilda -d istilda --clean --if-exists < backups/istilda-2026-11-01_0300.dump
docker compose start web
```

**Product photos:** back up the `istilda_istilda-data` volume:
```bash
docker run --rm -v istilda_istilda-data:/data -v "$PWD/backups":/backup busybox tar czf /backup/photos-backup.tgz -C /data uploads
```

### Upgrading from the earlier SQLite version

If you already ran the earlier version and added products or received orders, move them across once:

1. Add `POSTGRES_PASSWORD` to your `.env`, then `docker compose up -d --build`.
2. Copy your old data into PostgreSQL:
   ```bash
   docker compose exec web node scripts/import-sqlite.mjs
   ```
   It copies products, photos' records, orders, settings (including a changed admin password) and analytics. It only runs while the new database has no products or orders, so it can't overwrite anything. Your photos are already in the `istilda_istilda-data` volume and keep working.

### Deploy on a DigitalOcean droplet with Nginx Proxy Manager

This is the production setup. Nginx Proxy Manager handles your domain and the free HTTPS certificate; the store itself is never exposed to the internet directly:

```
visitors ──https──▶ Nginx Proxy Manager (ports 80, 443)
                          │  "proxy" Docker network
                          ▼
                    istilda-web:3000 ──private network──▶ istilda-db (PostgreSQL)
                                                          istilda-backup (daily dumps)
```

**1. Create the droplet.** Ubuntu 24.04 LTS. **1 GB RAM is enough**: the droplet never builds the site. GitHub builds it each time you push (`.github/workflows/docker-image.yml`) and the droplet just downloads the result. Running, the whole store uses about 300–400 MB. Frankfurt (FRA1) or London (LON1) are the closest regions to Kenya. Add your SSH key. Turning on DigitalOcean's droplet backups is worth it.

Add 2 GB of swap as a safety net so a busy moment slows the droplet down instead of freezing it:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf && sudo sysctl -p /etc/sysctl.d/99-swap.conf
```

**2. Point your domain at it.** At your domain registrar, add `A` records for `@` and `www` with the droplet's IP address.

**3. Firewall.** In DigitalOcean, create a Cloud Firewall for the droplet that allows inbound **22** (SSH), **80** and **443** only. Allow **81** (Nginx Proxy Manager's admin panel) only from your own IP, and only while you need it. Use DigitalOcean's firewall rather than plain `ufw`: Docker bypasses `ufw` rules for ports it publishes. For a second layer on the droplet itself, run `bash scripts/firewall.sh` (or `ADMIN_IP=your.ip bash scripts/firewall.sh` to allow port 81 from your address only): it allows only SSH, 80 and 443, and makes Docker obey the same rules.

**4. Install Docker:**
```bash
curl -fsSL https://get.docker.com | sh
```

**5. Create the shared network and connect Nginx Proxy Manager to it:**
```bash
docker network create proxy
```
- **Nginx Proxy Manager not installed yet?** Use the ready-made setup in `deploy/nginx-proxy-manager/`: copy that folder to the server, then run `docker compose up -d` inside it. Its admin panel is at `http://YOUR_DROPLET_IP:81`; change the default login straight away.
- **Already running it?** Connect it: `docker network connect proxy <its container name>` (`docker ps` shows the name). To keep the connection when Nginx Proxy Manager is recreated, also add the network to its own `docker-compose.yml`:
  ```yaml
  services:
    app:            # your Nginx Proxy Manager service
      networks: [proxy]
  networks:
    proxy:
      external: true
  ```
  Alternatively, leave Nginx Proxy Manager as it is and put the name of its existing network (from `docker network ls`) in `PROXY_NETWORK` in `.env`.

**6. Get the code and create the settings file:**
```bash
git clone https://github.com/lewiss-n/istilda.git
cd istilda
sh scripts/setup-env.sh
```
If the repository is private, sign in with your GitHub username and a personal access token as the password. The setup script asks for your domain and WhatsApp number, creates `.env` with strong random passwords, and shows your admin password once. Save it in your password manager.

**7. Start the store.** First check that GitHub has built the image: on your repository's **Actions** tab, the latest "Build Docker image" run should have a green tick (it takes about 3–5 minutes after a push).

If your repository is **private**, the image is private too, so log the droplet in to GitHub's image registry once. Create a token at GitHub › Settings › Developer settings › Personal access tokens › **Tokens (classic)** with only the **`read:packages`** permission, then:
```bash
docker login ghcr.io -u lewiss-n
```
and paste the token as the password. Then start the store:
```bash
sh scripts/deploy.sh
```
It downloads the image, starts everything and waits until the store reports healthy (`curl http://127.0.0.1:3000/api/health` should answer `{"ok":true,"database":"up"}`).

**8. Add the proxy host in Nginx Proxy Manager.** Go to **Hosts › Proxy Hosts › Add Proxy Host**:

| Field | Value |
| --- | --- |
| Domain Names | `yourdomain.co.ke` and `www.yourdomain.co.ke` |
| Scheme | `http` |
| Forward Hostname / IP | `istilda-web` |
| Forward Port | `3000` |
| Block Common Exploits | on |

On the **SSL** tab choose **Request a new SSL Certificate**, turn on **Force SSL**, **HTTP/2 Support** and **HSTS Enabled**, agree to the terms and save.

**9. Done.** Open `https://yourdomain.co.ke` and `https://yourdomain.co.ke/admin`.

**Updating later:** push your changes to GitHub, then on the server run:
```bash
cd ~/istilda && sh scripts/deploy.sh
```
It pulls the latest code, downloads the image GitHub built for it (waiting if GitHub is still building), restarts the store, waits until it reports healthy, and cleans up old images. Your database, photos and backups are kept. Nothing is built on the droplet, so it stays responsive.

**Automatic updates (recommended).** Make the droplet update itself after every push, once:
```bash
sudo sh scripts/install-auto-deploy.sh
```
Every 2 minutes the droplet checks GitHub. When there's a new commit and GitHub has finished building its image, it runs `deploy.sh` by itself, so a push goes live about 5–7 minutes later with nothing to do on the server. The droplet only reaches out to GitHub; GitHub gets no access to the droplet. Watch it with `journalctl -u istilda-auto-deploy -f`; turn it off with `sudo sh scripts/install-auto-deploy.sh --remove`. It needs the SSH deploy key from step 6 (so it can fetch without a password) and, for a private repository, the `docker login` from step 7, both done as the user who owns the project folder.

**No GitHub Actions?** Build on your own computer and copy the image over instead (in Git Bash or WSL, not PowerShell, which corrupts the file):
```bash
docker build -t ghcr.io/lewiss-n/istilda:latest .
docker save ghcr.io/lewiss-n/istilda:latest | gzip > istilda.tar.gz
scp istilda.tar.gz dev@YOUR_DROPLET_IP:~/
```
then on the droplet: `gunzip -c ~/istilda.tar.gz | docker load && cd ~/istilda && docker compose up -d --no-build`.

**Keeping backups off the server.** Daily database dumps collect in `~/istilda/backups` on the droplet. If the droplet is lost, so are they, so copy them elsewhere regularly, for example from your own computer:
```bash
scp -r root@YOUR_DROPLET_IP:~/istilda/backups ./istilda-backups
```

**If something's wrong**

| You see | Fix |
| --- | --- |
| `network proxy declared as external, but could not be found` | Run `docker network create proxy` once, then start again. |
| 502 Bad Gateway from Nginx Proxy Manager | Nginx Proxy Manager isn't on the `proxy` network (step 5), or the store isn't running: check `docker compose ps` and `docker compose logs web`. |
| The droplet freezes during an update | It's building instead of downloading. Make sure `.env` has `COMPOSE_FILE=docker-compose.yml` (`deploy.sh` adds it) and use `sh scripts/deploy.sh`, not `docker compose up --build`. |
| `deploy.sh` says access denied | The image is private: run `docker login ghcr.io -u lewiss-n` with a `read:packages` token (step 7). |
| `deploy.sh` keeps waiting for GitHub | The build on GitHub failed or hasn't started. Open the **Actions** tab on GitHub to see why. |
| Admin login says "Too many wrong attempts" for everyone | You put Cloudflare's proxy in front of the site. Set `CLIENT_IP_HEADER=cf-connecting-ip` in `.env` and restart. |

**Good practice**
- Use a long, unique admin password. Wrong passwords are limited to 6 tries per 15 minutes per visitor, tracked in the database.
- Keep `.env` private: it holds your admin and database passwords. The setup script makes it readable by its owner only.
- Leave `DEMO_MODE` out on the real store.

### Using a hosted PostgreSQL instead

You can point the website at a managed database (for example Neon, Supabase, DigitalOcean or AWS RDS) instead of the `db` container. Set `DATABASE_URL` for the `web` service to the provider's connection string, add `DATABASE_SSL=true` if they require SSL, and remove the `db` and `backup` services (the provider handles backups).

---

## Show a demo on Vercel

Vercel is a quick way to put a working demo online and share a link before you set up the real server. The **production setup stays Docker** (above); the same code runs in both places and picks the right storage on its own:

| | Demo on Vercel | Production with Docker |
| --- | --- | --- |
| Database | Neon PostgreSQL (from Vercel's Storage tab) | PostgreSQL container, daily backups |
| Product photos | Vercel Blob | `istilda-data` volume on your server |
| Daily clean-up | Vercel Cron (`vercel.json`) | Timer inside the server |

### Steps

1. **Put the project on GitHub.** Create a repository (private is fine) and push this folder to it. `.env` is excluded automatically, so your passwords aren't uploaded.
2. **Import it into Vercel.** In Vercel choose **Add New › Project**, pick the repository and click **Deploy**. The first deploy builds fine; pages will show an error until the next two steps are done.
3. **Add the database.** In the project, open **Storage › Create Database**, choose **Neon** (PostgreSQL), pick a region (for Kenya, a Europe region such as Frankfurt is closest) and connect it to the project. This adds `DATABASE_URL` for you.
4. **Add photo storage.** Still in **Storage**, create a **Blob** store and connect it. This adds `BLOB_READ_WRITE_TOKEN`.
5. **Add settings.** In **Settings › Environment Variables** add:

   | Name | Value |
   | --- | --- |
   | `ADMIN_PASSWORD` | a password for the demo admin (different from your real one) |
   | `DEMO_MODE` | `true` |
   | `WHATSAPP_NUMBER` | your WhatsApp number, e.g. `254712345678` |
   | `SESSION_SECRET` | a long random string, e.g. from `openssl rand -hex 32` |
   | `CRON_SECRET` | another long random string (Vercel uses it to call the daily clean-up) |

6. **Match the regions.** In **Settings › Functions**, set the function region to the same region as your Neon database. Every page talks to the database, so this keeps pages fast.
7. **Redeploy.** Open **Deployments**, click the menu on the latest one and choose **Redeploy**. On first start the database tables are created automatically.

### What demo mode does (`DEMO_MODE=true`)

- Fills an empty store with 15 sample products and 2 sample orders, once, so there's something to click through. They show branded category tiles instead of photos; add a product with real photos to show off uploads. Delete the samples whenever you like and they won't come back.
- Shows a notice at the top of the shop: *“Demo store: products and prices are samples. Orders you send here are for testing only.”*
- Asks search engines not to index the site, so the demo never competes with your real store.
- Locks the admin password (it's set only by `ADMIN_PASSWORD`), so someone you share the login with can't lock you out.

Orders sent from the demo are real requests in the demo database, and the WhatsApp button really opens a chat with `WHATSAPP_NUMBER`.

### Good to know

- **Vercel plans.** Vercel's free Hobby plan is for personal, non-commercial use only. For a business demo, check whether your use fits, or use a Pro plan (it has a free trial).
- **Photos.** Uploads are resized in the browser first (Vercel accepts at most 4.5 MB per upload), then saved to Blob. Large phone photos work.
- **Going to production.** Set up Docker as described above with `DEMO_MODE` left out. Start the real store fresh, without the demo data. If you do want to carry products over, copy the database with `pg_dump`/`pg_restore` and download the photos from the Blob store into the `istilda-data` volume's `uploads` folder. File names are the same in both places.
- **Running production on Vercel instead of Docker** also works: the same steps without `DEMO_MODE`, on a Pro plan. Backups then come from Neon's own point-in-time restore instead of the backup container.

---

## Run it without Docker (for development)

Requires Node.js 22 and a PostgreSQL 14+ database.

```bash
npm install
cp .env.example .env
# in .env set ADMIN_PASSWORD and
# DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/istilda
npm run dev
```

Open http://localhost:3000. Tables are created on first start; product photos go in the `data/` folder.

Production without Docker: `npm run build`, then `npm start`.

---

## Settings reference (`.env`)

| Variable | Required | What it does |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Yes | Password for `/admin`. After you change the password in Admin › Settings, the new one is used instead. |
| `POSTGRES_PASSWORD` | With Docker | Password for the database container. Set once. |
| `DATABASE_URL` | Without Docker | PostgreSQL connection string. Docker sets it for you. |
| `DATABASE_SSL` | No | `true` for hosted databases that require SSL. |
| `DATABASE_POOL_SIZE` | No | Maximum database connections the website opens (default 10). |
| `WHATSAPP_NUMBER` | No | Your WhatsApp number, e.g. `254712345678`. Admin › Settings overrides it. Without a number, WhatsApp buttons are hidden. |
| `SESSION_SECRET` | No | Signs admin logins. If empty, a random one is created and stored in the database. |
| `COOKIE_SECURE` | No | `true` once you're on HTTPS. Left empty, it's detected automatically. |
| `SITE_URL` | In production | Your store's address, e.g. `https://istilda.co.ke`. Used for links shared on WhatsApp and social media, and for `/sitemap.xml`. |
| `PROXY_NETWORK` | No | Docker network shared with Nginx Proxy Manager (default `proxy`). |
| `COMPOSE_FILE` | Server only | `docker-compose.yml`: use the image GitHub built and never build on the server. `setup-env.sh` and `deploy.sh` add it. Leave it out on your own computer. |
| `WEB_IMAGE` | No | Image to download (default `ghcr.io/lewiss-n/istilda:latest`). Pin a version with `ghcr.io/lewiss-n/istilda:<commit sha>`. |
| `WEB_PORT` | No | Port the website uses on the server itself, for checks with `curl` (default 3000). Not reachable from the internet. |
| `CLIENT_IP_HEADER` | No | Only with Cloudflare's proxy in front: `cf-connecting-ip`, so login limits apply per visitor. |
| `BACKUP_KEEP_DAYS` | No | Days of daily backups to keep (default 14). |
| `ANALYTICS_RETENTION_DAYS` | No | Analytics older than this are deleted automatically (default 400). |
| `STORE_TIMEZONE` | No | Time zone for the analytics charts (default `Africa/Nairobi`). |
| `DATA_DIR` | No | Where product photos are kept. Docker sets this to `/app/data`. |
| `DEMO_MODE` | No | `true` on a demo deployment: notice for visitors, sample data, no search indexing, password locked. |
| `BLOB_READ_WRITE_TOKEN` | On Vercel | Set by connecting a Vercel Blob store. When present, photos are stored in Blob instead of on disk. |
| `CRON_SECRET` | On Vercel | Protects the daily clean-up endpoint that Vercel Cron calls. |
| `POSTGRES_URL` | No | Used if `DATABASE_URL` isn't set (some Vercel database integrations use this name). |
| `DATABASE_POOLER` | No | `true` if your `DATABASE_URL` goes through PgBouncer. Detected automatically for Neon and Supabase pooled hosts. |

---

## Where things are

```
src/app/(shop)/          customer pages: home, shop, product, cart, checkout, order confirmation
src/app/admin/           admin login and panel (dashboard, orders, products, settings)
src/app/admin/actions.ts all admin actions (save product, update order, settings…)
src/app/api/orders/      receives order requests from the website and WhatsApp checkout
src/app/api/track/       records anonymous analytics events
src/lib/                 database, products, orders, analytics, auth, settings
src/lib/migrations.ts    the database schema; add new migrations at the end of the list
src/lib/storage.ts       photo storage: Vercel Blob or local disk
src/lib/demo.ts          demo mode and its sample data
vercel.json              Vercel settings (the daily clean-up schedule)
scripts/import-sqlite.mjs  one-off import from the earlier SQLite version
scripts/setup-env.sh     creates .env on a new server
scripts/deploy.sh        updates a server to the latest code (downloads the image, never builds)
scripts/install-auto-deploy.sh  makes the server update itself after every push
scripts/auto-deploy.sh   what the automatic updates run every 2 minutes
.github/workflows/       GitHub builds the Docker image on every push
docker-compose.override.yml  local-only: builds the image from your code
scripts/firewall.sh      locks the droplet down to SSH, 80 and 443 (Docker included)
scripts/create-dev-user.sh  creates a non-root user for running the store, then turns off root logins
deploy/nginx-proxy-manager/  ready-made Nginx Proxy Manager setup
src/lib/categories.ts    the category list: edit this to rename or add categories
src/app/globals.css      brand colours and fonts
```

Built with Next.js 16, React 19, Tailwind CSS 4, PostgreSQL (node-postgres), sharp for image resizing and Vercel Blob for photo storage on Vercel. Fonts are Archivo and DM Sans, bundled with the site.
