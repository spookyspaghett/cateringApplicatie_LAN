import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderStore } from '../lib/store'
import type { CartItem, Order, OrderWithItems } from '../lib/types'

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn:  () => orderStore.list(),
  })
}

export function useOrderById(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    enabled:  !!id,
    queryFn:  (): Promise<OrderWithItems | null> => orderStore.findById(id!),
  })
}

export function useSubmitOrder() {
  const qc = useQueryClient()
  return useMutation<Order, Error, { attendeeId: string; cart: CartItem[]; notes: string }>({
    mutationFn: async ({ attendeeId, cart, notes }) =>
      orderStore.insert(
        attendeeId,
        notes,
        cart.map(c => ({ menu_item_id: c.menuItem.id, quantity: c.quantity })),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['shopping'] })
    },
  })
}
