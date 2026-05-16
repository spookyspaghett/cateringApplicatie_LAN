# LAN Party Catering

A web app for managing food orders, attendees, dietary restrictions, and payments at LAN party events.

## Stack

- **React + TypeScript** via Vite
- **Tailwind CSS v3** for styling
- **Supabase** — Postgres database, Auth, and RLS
- **React Query** for server state
- **React Hook Form + Zod** for forms
- **Vercel** for deployment

---

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd lan-catering
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL editor** and run the entire contents of `supabase/schema.sql`.
   - This creates all tables, the shopping list view, RLS policies, and seeds 10 sample menu items.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your values from the Supabase dashboard -> Settings -> API:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Create an admin user

In the Supabase dashboard -> Authentication -> Users -> Invite user, add your admin email and set a password.

### 5. Run locally

```bash
npm run dev
```

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import the project at vercel.com/new.
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Every `git push` to `main` auto-deploys.
5. In Supabase -> Authentication -> URL Configuration, set:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with event info |
| `/register` | Attendee signup with dietary restrictions |
| `/menu?attendee=<id>` | Browse menu and place order |
| `/order/:id` | Order confirmation + print receipt |
| `/admin/login` | Admin sign in |
| `/admin` | Dashboard with stats and quick links |
| `/admin/attendees` | Attendee table with dietary flags |
| `/admin/orders` | Expandable order detail per attendee |
| `/admin/shopping` | Aggregated shopping list grouped by category |
| `/admin/payments` | Bulk payment status management |

---

## Database Schema

```
attendees       - name, email, dietary_restrictions[], payment_status
menu_items      - name, description, price, category, dietary_tags[], available
orders          - attendee_id, notes
order_items     - order_id, menu_item_id, quantity
shopping_list   - VIEW: aggregated quantity per menu item across all orders
```
