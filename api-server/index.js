/**
 * LAN Party Catering — API + web server
 * Runs on port 3001, serves the React app from ../dist and all /api routes.
 * Start with:  node api-server/index.js
 */

import express       from 'express'
import mysql         from 'mysql2/promise'
import nodemailer    from 'nodemailer'
import bcrypt        from 'bcryptjs'
import { randomUUID }      from 'crypto'
import { fileURLToPath }   from 'url'
import { dirname, join }   from 'path'
import { existsSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load credentials from email-server/.env (gitignored, never committed) ────
const _envFile = join(__dirname, '../email-server/.env')
if (existsSync(_envFile)) {
  readFileSync(_envFile, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=')
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  })
}

// ── Config ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001

const DB_CONFIG = {
  host:               process.env.DB_HOST || 'localhost',
  port:               Number(process.env.DB_PORT) || 3307,
  user:               process.env.DB_USER || 'catering',
  password:           process.env.DB_PASS || 'catering123',
  database:           process.env.DB_NAME || 'lan_catering',
  waitForConnections: true,
  connectionLimit:    10,
}

// Credentials are loaded from email-server/.env automatically
const SMTP = {
  host:     'smtp.gmail.com',
  port:     587,
  user:     process.env.SMTP_USER     || '',
  password: process.env.SMTP_PASSWORD || '',
  fromName: 'LAN Party Catering',
}

// ── Database pool with retry ──────────────────────────────────────────────────

let pool = null

async function getPool() {
  if (pool) return pool
  pool = mysql.createPool(DB_CONFIG)

  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      await pool.query('SELECT 1')
      console.log('  ✓ Connected to MariaDB')
      return pool
    } catch {
      if (attempt === 30) {
        console.error('  ✗ Could not connect to MariaDB after 30 attempts. Is Docker running?')
        process.exit(1)
      }
      console.log(`  Waiting for database... (${attempt}/30)`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJson(val) {
  if (Array.isArray(val)) return val
  if (!val) return []
  try { return JSON.parse(val) } catch { return [] }
}

function toISO(val) {
  if (!val) return null
  if (val instanceof Date) return val.toISOString()
  return val
}

function mapAttendee(r) {
  // Strip password_hash so it never leaks out of the API
  const { password_hash, ...rest } = r
  return { ...rest, dietary_restrictions: parseJson(rest.dietary_restrictions), created_at: toISO(rest.created_at) }
}

function mapMenuItem(r) {
  return { ...r, price: Number(r.price), dietary_tags: parseJson(r.dietary_tags), available: Boolean(r.available) }
}

function mapOrder(r) {
  return { ...r, created_at: toISO(r.created_at), ready_at: toISO(r.ready_at), email_sent: Boolean(r.email_sent) }
}

// Join flat SQL rows into nested OrderWithItems objects
const ORDER_SELECT = `
  SELECT
    o.id, o.attendee_id, o.notes, o.created_at, o.status, o.ready_at, o.email_sent,
    a.id               AS att_id,       a.name            AS att_name,
    a.email            AS att_email,    a.dietary_restrictions AS att_dietary,
    a.payment_status   AS att_payment,  a.created_at      AS att_created,
    oi.id              AS item_id,      oi.menu_item_id,  oi.quantity,
    mi.id              AS mi_id,        mi.name           AS mi_name,
    mi.description     AS mi_desc,      mi.price          AS mi_price,
    mi.category        AS mi_cat,       mi.dietary_tags   AS mi_dietary,
    mi.available       AS mi_available
  FROM orders o
  JOIN attendees   a  ON a.id  = o.attendee_id
  LEFT JOIN order_items oi ON oi.order_id     = o.id
  LEFT JOIN menu_items  mi ON mi.id           = oi.menu_item_id
`

function hydrateOrders(rows) {
  const map = new Map()
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id:           row.id,
        attendee_id:  row.attendee_id,
        notes:        row.notes,
        created_at:   toISO(row.created_at),
        status:       row.status,
        ready_at:     toISO(row.ready_at),
        email_sent:   Boolean(row.email_sent),
        attendees: {
          id:                   row.att_id,
          name:                 row.att_name,
          email:                row.att_email,
          dietary_restrictions: parseJson(row.att_dietary),
          payment_status:       row.att_payment,
          created_at:           toISO(row.att_created),
        },
        order_items: [],
      })
    }
    if (row.item_id) {
      map.get(row.id).order_items.push({
        id:           row.item_id,
        order_id:     row.id,
        menu_item_id: row.menu_item_id,
        quantity:     row.quantity,
        menu_items: {
          id:          row.mi_id,
          name:        row.mi_name,
          description: row.mi_desc,
          price:       Number(row.mi_price),
          category:    row.mi_cat,
          dietary_tags: parseJson(row.mi_dietary),
          available:   Boolean(row.mi_available),
        },
      })
    }
  }
  return Array.from(map.values())
}

// ── Email ─────────────────────────────────────────────────────────────────────

function sendEmail({ to_email, to_name, order_id, items, total }) {
  const transporter = nodemailer.createTransport({
    host:   SMTP.host,
    port:   SMTP.port,
    secure: false,
    auth:   { user: SMTP.user, pass: SMTP.password },
  })

  const plain = `Hi ${to_name},\n\nYour order #${order_id} is ready — head to the catering table!\n\nItems: ${items}\nTotal: ${total}\n\nGG! 🎮`

  const html = `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#111;color:#eee;padding:32px;border-radius:12px">
  <h1 style="color:#38bdf8;margin-top:0">Your order is ready! 🎮</h1>
  <p>Hi <strong>${to_name}</strong>,</p>
  <p>Order <code style="background:#222;padding:2px 6px;border-radius:4px">#${order_id}</code>
     is ready — head to the catering table to collect it!</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr style="border-bottom:1px solid #333">
      <td style="padding:6px 0;color:#aaa">Items</td>
      <td style="padding:6px 0;text-align:right">${items}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#aaa">Total</td>
      <td style="padding:6px 0;text-align:right;color:#38bdf8;font-weight:bold">${total}</td>
    </tr>
  </table>
  <p style="color:#666;font-size:12px;margin-bottom:0">GG! 🎮</p>
</div>`

  return transporter.sendMail({
    from:    `"${SMTP.fromName}" <${SMTP.user}>`,
    to:      to_email,
    subject: `Your order is ready, ${to_name}! 🎮`,
    text:    plain,
    html,
  })
}

// ── Express app ───────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())

// CORS — needed when Vite dev server (port 5173) calls this server (port 3001)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Global error handler so unhandled throws return JSON instead of crashing
app.use((err, req, res, _next) => {
  console.error('API error:', err.message)
  res.status(500).json({ error: err.message })
})

// ── Attendees ─────────────────────────────────────────────────────────────────

app.get('/api/attendees', async (req, res, next) => {
  try {
    const db = await getPool()
    const [rows] = await db.query('SELECT * FROM attendees ORDER BY created_at DESC')
    res.json(rows.map(mapAttendee))
  } catch (err) { next(err) }
})

// Verify email + password. Returns the attendee (without password hash) on success.
app.post('/api/attendees/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    const db = await getPool()
    const [rows] = await db.query(
      'SELECT * FROM attendees WHERE LOWER(email) = ?',
      [String(email).toLowerCase()]
    )
    // Same generic error for "no user" and "wrong password" so attackers can't
    // tell which one is wrong (avoids user enumeration).
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const ok = await bcrypt.compare(password, rows[0].password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    res.json(mapAttendee(rows[0]))
  } catch (err) { next(err) }
})

// Light endpoint: just this attendee's orders (no joins), for the login page
app.get('/api/attendees/:id/orders', async (req, res, next) => {
  try {
    const db = await getPool()
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE attendee_id = ? ORDER BY created_at DESC',
      [req.params.id]
    )
    res.json(rows.map(mapOrder))
  } catch (err) { next(err) }
})

app.post('/api/attendees', async (req, res, next) => {
  try {
    const { name, email, password, dietary_restrictions = [] } = req.body
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }
    const db = await getPool()
    const id = randomUUID()
    const password_hash = await bcrypt.hash(password, 10)
    await db.query(
      'INSERT INTO attendees (id, name, email, password_hash, dietary_restrictions) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, password_hash, JSON.stringify(dietary_restrictions)]
    )
    const [rows] = await db.query('SELECT * FROM attendees WHERE id = ?', [id])
    res.status(201).json(mapAttendee(rows[0]))
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An attendee with this email is already registered.' })
    }
    next(err)
  }
})

app.patch('/api/attendees/:id/payment', async (req, res, next) => {
  try {
    const db = await getPool()
    await db.query('UPDATE attendees SET payment_status = ? WHERE id = ?', [req.body.payment_status, req.params.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ── Menu items ────────────────────────────────────────────────────────────────

app.get('/api/menu-items', async (req, res, next) => {
  try {
    const db = await getPool()
    const [rows] = await db.query('SELECT * FROM menu_items WHERE available = TRUE ORDER BY category, name')
    res.json(rows.map(mapMenuItem))
  } catch (err) { next(err) }
})

app.get('/api/menu-items/all', async (req, res, next) => {
  try {
    const db = await getPool()
    const [rows] = await db.query('SELECT * FROM menu_items ORDER BY category, name')
    res.json(rows.map(mapMenuItem))
  } catch (err) { next(err) }
})

app.post('/api/menu-items', async (req, res, next) => {
  try {
    const { name, description, price, category, dietary_tags = [], available = true } = req.body
    const db = await getPool()
    const id = randomUUID()
    await db.query(
      'INSERT INTO menu_items (id, name, description, price, category, dietary_tags, available) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, description ?? null, price, category, JSON.stringify(dietary_tags), available]
    )
    const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [id])
    res.status(201).json(mapMenuItem(rows[0]))
  } catch (err) { next(err) }
})

app.put('/api/menu-items/:id', async (req, res, next) => {
  try {
    const { name, description, price, category, dietary_tags, available } = req.body
    const db = await getPool()
    await db.query(
      'UPDATE menu_items SET name=?, description=?, price=?, category=?, dietary_tags=?, available=? WHERE id=?',
      [name, description ?? null, price, category, JSON.stringify(dietary_tags ?? []), available, req.params.id]
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

app.delete('/api/menu-items/:id', async (req, res, next) => {
  try {
    const db = await getPool()
    await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ── Orders ────────────────────────────────────────────────────────────────────

app.get('/api/orders', async (req, res, next) => {
  try {
    const db = await getPool()
    const [rows] = await db.query(ORDER_SELECT + ' ORDER BY o.created_at ASC')
    res.json(hydrateOrders(rows))
  } catch (err) { next(err) }
})

app.get('/api/orders/:id', async (req, res, next) => {
  try {
    const db = await getPool()
    const [rows] = await db.query(ORDER_SELECT + ' WHERE o.id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' })
    res.json(hydrateOrders(rows)[0])
  } catch (err) { next(err) }
})

app.post('/api/orders', async (req, res, next) => {
  try {
    const { attendee_id, notes, items = [] } = req.body
    const db   = await getPool()
    const conn = await db.getConnection()
    const orderId = randomUUID()

    try {
      await conn.beginTransaction()
      await conn.query(
        'INSERT INTO orders (id, attendee_id, notes) VALUES (?, ?, ?)',
        [orderId, attendee_id, notes || null]
      )
      if (items.length > 0) {
        const values = items.map(i => [randomUUID(), orderId, i.menu_item_id, i.quantity])
        await conn.query('INSERT INTO order_items (id, order_id, menu_item_id, quantity) VALUES ?', [values])
      }
      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId])
    res.status(201).json(mapOrder(rows[0]))
  } catch (err) { next(err) }
})

app.patch('/api/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const db = await getPool()
    const readyAt = status === 'ready' ? new Date() : null
    await db.query('UPDATE orders SET status = ?, ready_at = ? WHERE id = ?', [status, readyAt, req.params.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

app.patch('/api/orders/:id/email-sent', async (req, res, next) => {
  try {
    const db = await getPool()
    await db.query('UPDATE orders SET email_sent = TRUE WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

app.get('/api/orders/:id/queue', async (req, res, next) => {
  try {
    const db = await getPool()
    const [[{ position }]] = await db.query(
      `SELECT COUNT(*) AS position FROM orders
       WHERE created_at < (SELECT created_at FROM orders WHERE id = ?)
       AND status IN ('pending', 'preparing')`,
      [req.params.id]
    )
    const [[{ value }]] = await db.query("SELECT value FROM settings WHERE `key` = 'prep_minutes'")
    const prepMinutes = parseInt(value, 10)
    const etaMinutes  = (Number(position) + 1) * prepMinutes
    res.json({ position: Number(position), etaMinutes, prepMinutes })
  } catch (err) { next(err) }
})

// ── Settings ──────────────────────────────────────────────────────────────────

app.get('/api/settings/prep-minutes', async (req, res, next) => {
  try {
    const db = await getPool()
    const [[row]] = await db.query("SELECT value FROM settings WHERE `key` = 'prep_minutes'")
    res.json({ value: parseInt(row.value, 10) })
  } catch (err) { next(err) }
})

app.put('/api/settings/prep-minutes', async (req, res, next) => {
  try {
    const db = await getPool()
    await db.query(
      "INSERT INTO settings (`key`, value) VALUES ('prep_minutes', ?) ON DUPLICATE KEY UPDATE value = ?",
      [String(req.body.value), String(req.body.value)]
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ── Shopping list ─────────────────────────────────────────────────────────────

app.get('/api/shopping-list', async (req, res, next) => {
  try {
    const db = await getPool()
    const [rows] = await db.query(`
      SELECT mi.name, mi.category, SUM(oi.quantity) AS total_quantity
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      GROUP BY mi.id, mi.name, mi.category
      ORDER BY mi.category, mi.name
    `)
    res.json(rows.map(r => ({ ...r, total_quantity: Number(r.total_quantity) })))
  } catch (err) { next(err) }
})

// ── Email ─────────────────────────────────────────────────────────────────────

app.post('/api/send-email', async (req, res, next) => {
  try {
    await sendEmail(req.body)
    console.log(`  ✓ Email sent to ${req.body.to_email}`)
    res.json({ ok: true })
  } catch (err) {
    console.error(`  ✗ Email failed: ${err.message}`)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ── Serve React frontend (production) ─────────────────────────────────────────

const distPath = join(__dirname, '../dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  // All non-API routes return index.html (React Router handles them)
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))
} else {
  app.get('/', (req, res) => res.send(
    '<p>Frontend not built yet. Run <code>npm run build</code> first.</p>'
  ))
}

// ── Start ─────────────────────────────────────────────────────────────────────

console.log('\n🍕 LAN Party Catering — API Server')
console.log(`   Connecting to database at ${DB_CONFIG.host}...\n`)

getPool().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server ready on http://0.0.0.0:${PORT}`)
    console.log(`   Attendees on any device can open: http://<your-ip>:${PORT}`)
    console.log(`   Press Ctrl+C to stop\n`)
  })
})
