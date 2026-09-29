# DWAYT store — GitHub Pages version (no Supabase, no backend)

Just static files. Upload them to GitHub and turn on Pages.

## Setup (5 minutes)

1. Open `config.js` and **change ADMIN_PASSWORD** (and ADMIN_EMAIL if you want).
2. Upload everything in this folder **plus your `images/` folder** to a GitHub repo.
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `(root)` → Save.
4. **EmailJS (important):** open your EmailJS template and add `{{order_code}}` somewhere in the email that goes to YOU (the owner). That code is how orders reach your admin page.

## Your links

- Store: `https://YOUR-USERNAME.github.io/YOUR-REPO/`
- Admin: `https://YOUR-USERNAME.github.io/YOUR-REPO/admin.html` (not linked on the store)

## How it works (no server, so please read)

Without a backend, each browser keeps its own data. DWAYT connects you and your customers like this:

1. **Customer orders** → the order is saved on their device and the email you already get now also contains an **ORDER CODE**.
2. **You** open `admin.html` → paste the code(s) under *1 / IMPORT NEW ORDERS*. The order appears in your list and stock goes down.
3. You change status (TO SHIP / TO RECEIVE / COMPLETED / CANCELLED), mark GCash/Maya payments as PAID, edit reference numbers, and edit stock.
4. Click *2 / DOWNLOAD store-data.json* → upload it to the repo (replace the old one). Customers now see your new stock, and **TRACK ORDER** shows the latest status on any device.

Customer emails are never put in `store-data.json` (only a scrambled hash used to match the order number + email).

## Good to know

- Always manage the store from the **same browser on the same device**. Clearing that browser's site data deletes your orders and stock edits. Keep the order emails as your backup.
- The admin login is a light gate only (the password is in `config.js`, which is public). Nothing sensitive is stored on GitHub, but don't reuse a real password.
- Stock is only exact for you. Two customers can order the last item before you publish. Import orders often and publish.
- Don't upload `.env`, `_env`, `orders.json`, `supabase.sql`, `db.js` (delete the old ones).

## Files

- New: `store.js` (replaces `db.js`), `config.js` (new content)
- Changed: `script.js`, `admin.js`, `admin.html`, `index.html` (only script tags)
- Untouched design: `style.css`, `mobile.css`, `admin.css`, `products.js`
- Deleted: `db.js`, `supabase.sql`
