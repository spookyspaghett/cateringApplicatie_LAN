/**
 * API client — all data goes through the Express server at /api.
 * In production the frontend is served by the same server, so /api is relative.
 * In development, Vite proxies /api → http://localhost:3001 (see vite.config.ts).
 */

import type { Attendee, MenuItem, Order, OrderStatus, OrderWithItems } from './types'

const API = '/api'

// ── Generic fetch helper ──────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Attendees ─────────────────────────────────────────────────────────────────

export const attendeeStore = {
  list: () =>
    request<Attendee[]>('/attendees'),

  findByEmail: async (email: string): Promise<Attendee | null> => {
    const res = await fetch(`${API}/attendees/by-email/${encodeURIComponent(email)}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return res.json()
  },

  insert: (values: { name: string; email: string; dietary_restrictions: string[] }) =>
    request<Attendee>('/attendees', { method: 'POST', body: JSON.stringify(values) }),

  updatePayment: (id: string, payment_status: Attendee['payment_status']) =>
    request<void>(`/attendees/${id}/payment`, {
      method: 'PATCH',
      body:   JSON.stringify({ payment_status }),
    }),
}

// ── Menu items ────────────────────────────────────────────────────────────────

export const menuStore = {
  list: () =>
    request<MenuItem[]>('/menu-items'),

  listAll: () =>
    request<MenuItem[]>('/menu-items/all'),

  insert: (values: Omit<MenuItem, 'id'>) =>
    request<MenuItem>('/menu-items', { method: 'POST', body: JSON.stringify(values) }),

  update: (id: string, values: Partial<Omit<MenuItem, 'id'>>) =>
    request<void>(`/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(values) }),

  remove: (id: string) =>
    request<void>(`/menu-items/${id}`, { method: 'DELETE' }),
}

// ── Orders ────────────────────────────────────────────────────────────────────

export const orderStore = {
  list: () =>
    request<OrderWithItems[]>('/orders'),

  findById: async (id: string): Promise<OrderWithItems | null> => {
    const res = await fetch(`${API}/orders/${id}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return res.json()
  },

  listForAttendee: (attendeeId: string) =>
    request<Order[]>(`/attendees/${attendeeId}/orders`),

  insert: (
    attendee_id: string,
    notes: string,
    items: Array<{ menu_item_id: string; quantity: number }>,
  ) =>
    request<Order>('/orders', {
      method: 'POST',
      body:   JSON.stringify({ attendee_id, notes, items }),
    }),

  updateStatus: (id: string, status: OrderStatus) =>
    request<void>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  markEmailSent: (id: string) =>
    request<void>(`/orders/${id}/email-sent`, { method: 'PATCH' }),

  getQueueInfo: (id: string) =>
    request<{ position: number; etaMinutes: number; prepMinutes: number }>(`/orders/${id}/queue`),
}

// ── Settings ──────────────────────────────────────────────────────────────────

export const settingsStore = {
  getPrepMinutes: () =>
    request<{ value: number }>('/settings/prep-minutes').then(d => d.value),

  setPrepMinutes: (mins: number) =>
    request<void>('/settings/prep-minutes', { method: 'PUT', body: JSON.stringify({ value: mins }) }),
}

// ── Admin auth (stays local — just a browser flag) ────────────────────────────

const ADMIN_PASSWORD = 'admin123'

export const authStore = {
  isAuthed:  () => localStorage.getItem('lan_admin_authed') === 'true',
  signIn(password: string) {
    if (password !== ADMIN_PASSWORD) throw new Error('Incorrect password')
    localStorage.setItem('lan_admin_authed', 'true')
  },
  signOut() {
    localStorage.removeItem('lan_admin_authed')
  },
}
