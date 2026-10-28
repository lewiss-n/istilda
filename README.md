# Istilda Importers — online store

A Next.js store for Istilda Importers with a customer shop and a password-protected admin area.

**Customers can**
- browse 11 categories (wigs/bundles/frontals, handbags, tote bags, gadgets, cosmetics, perfumes, hats & fascinators, shoes, sandals, sweaters & tops, kitchen gadgets), search and sort
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
| `istilda-web` | the website, on port 3000 |
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

2. Build and start:
   ```bash
   docker compose up -d --build
   ```
   On first start the website creates all its database tables automatically.

3. Open **http://localhost:3000** for the store and **http://localhost:3000/admin** for the admin.

Your data survives restarts, rebuilds and updates:
- the database is in the Docker volume `istilda-postgres`
- product photos are in the Docker volume `istilda-data`

**Updating after code changes:** `docker compose up -d --build` (new database changes are applied automatically on start)

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

**Product photos:** back up the `istilda-data` volume:
```bash
docker run --rm -v istilda-data:/data -v "$PWD":/backup busybox tar czf /backup/photos-backup.tgz -C /data uploads
```

### Upgrading from the earlier SQLite version

If you already ran the earlier version and added products or received orders, move them across once:

1. Add `POSTGRES_PASSWORD` to your `.env`, then `docker compose up -d --build`.
2. Copy your old data into PostgreSQL:
   ```bash
   docker compose exec web node scripts/import-sqlite.mjs
   ```
   It copies products, photos' records, orders, settings (including a changed admin password) and analytics. It only runs while the new database has no products or orders, so it can't overwrite anything. Your photos are already in the `istilda-data` volume and keep working.

### Going live

- Put the site behind HTTPS (for example with your hosting provider, Caddy or nginx as a reverse proxy) and point your domain at it.
- Once it's on HTTPS, set `COOKIE_SECURE=true` in `.env` so admin logins only travel over secure connections.
- Use a long, unique `ADMIN_PASSWORD`. Wrong passwords are limited to 6 tries per 15 minutes per address (tracked in the database).
- Keep `.env` private: it holds your admin and database passwords.

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

- Fills an empty store with 14 sample products and 2 sample orders, once, so there's something to click through. They show branded category tiles instead of photos; add a product with real photos to show off uploads. Delete the samples whenever you like and they won't come back.
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
src/lib/categories.ts    the category list: edit this to rename or add categories
src/app/globals.css      brand colours and fonts
```

Built with Next.js 16, React 19, Tailwind CSS 4, PostgreSQL (node-postgres), sharp for image resizing and Vercel Blob for photo storage on Vercel. Fonts are Archivo and DM Sans, bundled with the site.
