# LAN Party Catering

A self-hosted web app for managing food orders, attendees, dietary restrictions, and payments at LAN party events. Runs entirely on a single Windows machine — no cloud services or databases required.

## Stack

- **React 18 + TypeScript** via Vite 4
- **Tailwind CSS v3** for styling
- **React Query** for data fetching and live polling
- **React Hook Form + Zod** for forms
- **localStorage** as the data store (no database setup needed)
- **Python stdlib** (`smtplib`) for sending order-ready emails via Gmail SMTP

---

## Requirements

- [Node.js](https://nodejs.org) (v18+)
- [Python](https://python.org) (v3.8+) — uses only the standard library, no pip installs needed

---

## Quick start (Windows)

Double-click **`launch.bat`**.

It will:
1. Check that Python and Node are installed
2. Run `npm install` automatically on first launch
3. Start the Python email server in the background (`localhost:5001`)
4. Start the Vite dev server in the background (`localhost:5173`)
5. Open your browser automatically
6. Print your local IP address so LAN attendees can connect

Press **any key** in the launcher window to stop both servers.

**Note:** Because data is stored in `localStorage`, each browser on each device has its own isolated data. For a shared setup where everyone sees the same orders, the app needs to run on a central machine and all attendees need to open the same browser session — or a backend/database solution would be needed.

---

## Email notifications

When an order is marked **Ready**, an email is automatically sent to the attendee.

Email is handled by a local Python script using Gmail SMTP — no third-party email service or API key needed.

### Setup

1. Open `email-server/server.py` and fill in your Gmail address and App Password at the top.
2. To get a Gmail App Password:
   - Go to [myaccount.google.com](https://myaccount.google.com) → Security → 2-Step Verification (enable it)
   - Then Security → App passwords → create one called "LAN Catering"
   - Paste the 16-character code into `SMTP_PASSWORD`
3. The launcher starts the email server automatically — no need to run it separately.

You can send a test email from the admin panel at `/admin/settings`.

---

## Admin panel

| URL | Password |
|-----|----------|
| `http://localhost:5173/admin` | `admin123` |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with event info |
| `/register` | Attendee sign-up with dietary restrictions |
| `/login` | Returning attendee login — view past orders or place a new one |
| `/menu?attendee=<id>` | Browse the menu and place an order |
| `/order/:id` | Order confirmation with live queue position and ETA |
| `/admin/login` | Admin sign-in |
| `/admin` | Dashboard with stats and quick links |
| `/admin/orders` | Order queue — mark orders as Preparing / Ready (triggers email) |
| `/admin/attendees` | Attendee list with dietary flags |
| `/admin/menu` | Add, edit, and toggle availability of menu items |
| `/admin/shopping` | Aggregated shopping list grouped by category |
| `/admin/payments` | Bulk payment status management |
| `/admin/settings` | Prep time setting and email test |

---

## Data model (localStorage)

```
lan_attendees    — name, email, dietary_restrictions[], payment_status
lan_menu_items   — name, description, price, category, dietary_tags[], available
lan_orders       — attendee_id, notes, status, ready_at, email_sent
lan_order_items  — order_id, menu_item_id, quantity
lan_prep_minutes — minutes per order (used for ETA calculation)
lan_admin_authed — admin session flag
```

The database is seeded automatically with 10 menu items on first load.

---

## Development

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
python email-server/server.py   # Email server on http://localhost:5001
```
