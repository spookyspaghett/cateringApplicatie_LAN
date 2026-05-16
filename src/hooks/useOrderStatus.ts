import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderStore, settingsStore } from '../lib/store'
import { sendOrderReadyEmail, emailConfigured } from '../lib/email'
import type { Order, OrderStatus, OrderWithItems } from '../lib/types'

// Live-polling hook for a single order status — used on the confirmation page.
// Uses a DIFFERENT query key from useOrderById to avoid cache shape conflicts.
export function useLiveOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order-status', id],
    enabled: !!id,
    refetchInterval: 10_000,
    queryFn: (): Order | null => (id ? orderStore.findById(id) : null),
  })
}

// Queue position + ETA for a given order
export function useQueueInfo(orderId: string | undefined) {
  return useQuery({
    queryKey: ['queue', orderId],
    enabled: !!orderId,
    refetchInterval: 10_000,
    queryFn: () => {
      if (!orderId) return null
      const position    = orderStore.queuePosition(orderId)
      const prepMinutes = settingsStore.getPrepMinutes()
      const etaMinutes  = (position + 1) * prepMinutes
      return { position, etaMinutes, prepMinutes }
    },
  })
}

// Prep time setting
export function usePrepTime() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['settings', 'prepMinutes'],
    queryFn: () => settingsStore.getPrepMinutes(),
  })
  const mutation = useMutation<void, Error, number>({
    mutationFn: async (mins) => settingsStore.setPrepMinutes(mins),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
  return { ...query, setMins: mutation.mutate }
}

// Admin: update order status + trigger email
export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation<
    void,
    Error,
    { order: OrderWithItems; status: OrderStatus }
  >({
    mutationFn: async ({ order, status }) => {
      orderStore.updateStatus(order.id, status)

      if (status === 'ready' && !order.email_sent) {
        const items = order.order_items
          .map((i) => `${i.quantity}× ${i.menu_items.name}`)
          .join(', ')
        const total = '$' + order.order_items
          .reduce((s, i) => s + i.menu_items.price * i.quantity, 0)
          .toFixed(2)

        await sendOrderReadyEmail({
          to_name:  order.attendees.name,
          to_email: order.attendees.email,
          order_id: order.id.slice(0, 8).toUpperCase(),
          items,
          total,
        })
        orderStore.markEmailSent(order.id)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order-status'] })
      qc.invalidateQueries({ queryKey: ['queue'] })
    },
  })
}

export { emailConfigured }
