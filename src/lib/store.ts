import type { Attendee, MenuItem, Order, OrderItem, OrderStatus } from './types'

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
  attendees:   'lan_attendees',
  menuItems:   'lan_menu_items',
  orders:      'lan_orders',
  orderItems:  'lan_order_items',
  adminAuth:   'lan_admin_authed',
  prepMinutes: 'lan_prep_minutes',
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function uuid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

// ─── Seed ────────────────────────────────────────────────────────────────────

const SEED_MENU: Omit<MenuItem, 'id'>[] = [
  { name: 'Margherita Pizza',  description: 'Classic tomato and mozzarella',         price: 12.00, category: 'food',  dietary_tags: ['vegetarian'],              available: true },
  { name: 'BBQ Chicken Pizza', description: 'Smoky BBQ sauce, chicken, red onion',   price: 14.00, category: 'food',  dietary_tags: [],                          available: true },
  { name: 'Vegan Wrap',        description: 'Falafel, hummus, salad in a tortilla',  price: 11.00, category: 'food',  dietary_tags: ['vegan', 'gluten-free'],    available: true },
  { name: 'Chicken Wings (6)', description: 'Crispy wings with choice of sauce',     price:  9.00, category: 'food',  dietary_tags: ['gluten-free'],             available: true },
  { name: 'Loaded Nachos',     description: 'Cheese, jalapeños, sour cream, salsa', price:  8.00, category: 'snack', dietary_tags: ['vegetarian','gluten-free'], available: true },
  { name: 'Mixed Nuts',        description: 'Salted cashews, almonds, peanuts',      price:  4.00, category: 'snack', dietary_tags: ['vegan', 'gluten-free'],    available: true },
  { name: 'Energy Drink',      description: '500ml, assorted flavours',              price:  3.50, category: 'drink', dietary_tags: [],                          available: true },
  { name: 'Water Bottle',      description: '750ml still water',                     price:  2.00, category: 'drink', dietary_tags: ['vegan', 'gluten-free'],    available: true },
  { name: 'Craft Beer',        description: 'Local pale ale 330ml',                  price:  5.00, category: 'drink', dietary_tags: ['vegan', 'gluten-free'],    available: true },
  { name: 'Soft Drink',        description: 'Cola, lemonade, or orange',             price:  2.50, category: 'drink', dietary_tags: ['vegan', 'gluten-free'],    available: true },
]

export function seedIfEmpty(): void {
  if (read<MenuItem>(KEYS.menuItems).length === 0) {
    write(KEYS.menuItems, SEED_MENU.map((m) => ({ ...m, id: uuid() })))
  }
}

// ─── Attendees ────────────────────────────────────────────────────────────────

export const attendeeStore = {
  list(): Attendee[] {
    return read<Attendee>(KEYS.attendees).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  insert(values: { name: string; email: string; dietary_restrictions: string[] }): Attendee {
    const all = read<Attendee>(KEYS.attendees)
    if (all.some((a) => a.email === values.email)) {
      throw new Error('An attendee with this email is already registered.')
    }
    const record: Attendee = { id: uuid(), payment_status: 'unpaid', created_at: now(), ...values }
    write(KEYS.attendees, [...all, record])
    return record
  },

  updatePayment(id: string, payment_status: Attendee['payment_status']): void {
    const all = read<Attendee>(KEYS.attendees)
    write(KEYS.attendees, all.map((a) => a.id === id ? { ...a, payment_status } : a))
  },
}

// ─── Menu items ───────────────────────────────────────────────────────────────

export const menuStore = {
  list(): MenuItem[] {
    return read<MenuItem>(KEYS.menuItems).filter((m) => m.available)
  },

  listAll(): MenuItem[] {
    return read<MenuItem>(KEYS.menuItems).sort((a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
    )
  },

  insert(values: Omit<MenuItem, 'id'>): MenuItem {
    const all = read<MenuItem>(KEYS.menuItems)
    const record: MenuItem = { ...values, id: uuid() }
    write(KEYS.menuItems, [...all, record])
    return record
  },

  update(id: string, values: Partial<Omit<MenuItem, 'id'>>): void {
    const all = read<MenuItem>(KEYS.menuItems)
    write(KEYS.menuItems, all.map((m) => m.id === id ? { ...m, ...values } : m))
  },

  remove(id: string): void {
    write(KEYS.menuItems, read<MenuItem>(KEYS.menuItems).filter((m) => m.id !== id))
  },
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orderStore = {
  list(): Order[] {
    return read<Order>(KEYS.orders).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  },

  insert(attendee_id: string, notes: string): Order {
    const all = read<Order>(KEYS.orders)
    const record: Order = {
      id: uuid(),
      attendee_id,
      notes: notes || null,
      created_at: now(),
      status: 'pending',
      ready_at: null,
      email_sent: false,
    }
    write(KEYS.orders, [...all, record])
    return record
  },

  findById(id: string): Order | null {
    return read<Order>(KEYS.orders).find((o) => o.id === id) ?? null
  },

  updateStatus(id: string, status: OrderStatus): Order {
    const all = read<Order>(KEYS.orders)
    const updated = all.map((o) =>
      o.id === id
        ? { ...o, status, ready_at: status === 'ready' ? now() : o.ready_at }
        : o
    )
    write(KEYS.orders, updated)
    return updated.find((o) => o.id === id)!
  },

  markEmailSent(id: string): void {
    const all = read<Order>(KEYS.orders)
    write(KEYS.orders, all.map((o) => o.id === id ? { ...o, email_sent: true } : o))
  },

  queuePosition(id: string): number {
    const orders = read<Order>(KEYS.orders).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return 0
    return orders
      .slice(0, idx)
      .filter((o) => o.status === 'pending' || o.status === 'preparing')
      .length
  },
}

// ─── Order items ──────────────────────────────────────────────────────────────

export const orderItemStore = {
  list(): OrderItem[] {
    return read<OrderItem>(KEYS.orderItems)
  },

  insertMany(items: Omit<OrderItem, 'id'>[]): OrderItem[] {
    const all = read<OrderItem>(KEYS.orderItems)
    const records = items.map((i) => ({ ...i, id: uuid() }))
    write(KEYS.orderItems, [...all, ...records])
    return records
  },

  forOrder(orderId: string): OrderItem[] {
    return read<OrderItem>(KEYS.orderItems).filter((i) => i.order_id === orderId)
  },
}

// ─── Prep time setting ────────────────────────────────────────────────────────

export const settingsStore = {
  getPrepMinutes(): number {
    return parseInt(localStorage.getItem(KEYS.prepMinutes) ?? '10', 10)
  },
  setPrepMinutes(mins: number): void {
    localStorage.setItem(KEYS.prepMinutes, String(mins))
  },
}

// ─── Admin auth ───────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = 'admin123'

export const authStore = {
  isAuthed(): boolean {
    return localStorage.getItem(KEYS.adminAuth) === 'true'
  },
  signIn(password: string): void {
    if (password !== ADMIN_PASSWORD) throw new Error('Incorrect password')
    localStorage.setItem(KEYS.adminAuth, 'true')
  },
  signOut(): void {
    localStorage.removeItem(KEYS.adminAuth)
  },
}
