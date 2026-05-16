// ─── Row types ───────────────────────────────────────────────────────────────

export type PaymentStatus = 'unpaid' | 'paid' | 'comped'

export interface Attendee {
  id: string
  name: string
  email: string
  dietary_restrictions: string[]
  payment_status: PaymentStatus
  created_at: string
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  dietary_tags: string[]
  available: boolean
}

export type OrderStatus = 'pending' | 'preparing' | 'ready'

export interface Order {
  id: string
  attendee_id: string
  notes: string | null
  created_at: string
  status: OrderStatus
  ready_at: string | null      // ISO timestamp when marked ready
  email_sent: boolean          // whether the "ready" email was sent
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
}

// ─── Joined / view types ─────────────────────────────────────────────────────

export interface OrderItemWithMenu extends OrderItem {
  menu_items: MenuItem
}

export interface OrderWithItems extends Order {
  order_items: OrderItemWithMenu[]
  attendees: Attendee
}

export interface ShoppingListRow {
  name: string
  category: string
  total_quantity: number
}

// ─── Cart (local state only) ─────────────────────────────────────────────────

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

// ─── Supabase Database generic (used by createClient) ────────────────────────

export type Database = {
  public: {
    Tables: {
      attendees: {
        Row: Attendee
        Insert: Omit<Attendee, 'id' | 'created_at'>
        Update: Partial<Omit<Attendee, 'id' | 'created_at'>>
      }
      menu_items: {
        Row: MenuItem
        Insert: Omit<MenuItem, 'id'>
        Update: Partial<Omit<MenuItem, 'id'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at'>
        Update: Partial<Omit<Order, 'id' | 'created_at'>>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id'>
        Update: Partial<Omit<OrderItem, 'id'>>
      }
    }
    Views: {
      shopping_list: {
        Row: ShoppingListRow
      }
    }
  }
}
