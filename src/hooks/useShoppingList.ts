import { useQuery } from '@tanstack/react-query'
import { menuStore, orderItemStore } from '../lib/store'
import type { ShoppingListRow } from '../lib/types'

export function useShoppingList() {
  return useQuery({
    queryKey: ['shopping'],
    queryFn: (): ShoppingListRow[] => {
      const items = orderItemStore.list()
      const menu  = menuStore.list()
      const totals: Record<string, ShoppingListRow> = {}

      for (const item of items) {
        const mi = menu.find((m) => m.id === item.menu_item_id)
        if (!mi) continue
        if (!totals[mi.id]) {
          totals[mi.id] = { name: mi.name, category: mi.category, total_quantity: 0 }
        }
        totals[mi.id].total_quantity += item.quantity
      }

      return Object.values(totals).sort((a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      )
    },
  })
}
