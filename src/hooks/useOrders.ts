import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attendeeStore, menuStore, orderStore, orderItemStore } from '../lib/store'
import type { CartItem, Order, OrderWithItems } from '../lib/types'

function hydrateOrders(): OrderWithItems[] {
  const orders    = orderStore.list()
  const attendees = attendeeStore.list()
  const items     = orderItemStore.list()
  const menu      = menuStore.list()

  return orders
    .map((order) => {
      const attendee = attendees.find((a) => a.id === order.attendee_id)
      if (!attendee) return null
      const orderItems = items
        .filter((i) => i.order_id === order.id)
        .map((i) => {
          const menuItem = menu.find((m) => m.id === i.menu_item_id)!
          return { ...i, menu_items: menuItem }
        })
      return { ...order, attendees: attendee, order_items: orderItems }
    })
    .filter(Boolean) as OrderWithItems[]
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: hydrateOrders,
  })
}

export function useOrderById(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    enabled: !!id,
    queryFn: (): OrderWithItems | null => {
      if (!id) return null
      const order    = orderStore.findById(id)
      if (!order) return null
      const attendee = attendeeStore.list().find((a) => a.id === order.attendee_id)
      if (!attendee) return null
      const menu     = menuStore.list()
      const orderItems = orderItemStore.forOrder(id).map((i) => ({
        ...i,
        menu_items: menu.find((m) => m.id === i.menu_item_id)!,
      }))
      return { ...order, attendees: attendee, order_items: orderItems }
    },
  })
}

export function useSubmitOrder() {
  const qc = useQueryClient()
  return useMutation<Order, Error, { attendeeId: string; cart: CartItem[]; notes: string }>({
    mutationFn: async ({ attendeeId, cart, notes }) => {
      const order = orderStore.insert(attendeeId, notes)
      orderItemStore.insertMany(
        cart.map((c) => ({ order_id: order.id, menu_item_id: c.menuItem.id, quantity: c.quantity }))
      )
      return order
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['shopping'] })
    },
  })
}
