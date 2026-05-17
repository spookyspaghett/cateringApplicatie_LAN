import { useQuery } from '@tanstack/react-query'
import type { ShoppingListRow } from '../lib/types'

export function useShoppingList() {
  return useQuery({
    queryKey: ['shopping'],
    queryFn:  async (): Promise<ShoppingListRow[]> => {
      const res = await fetch('/api/shopping-list')
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      return res.json()
    },
  })
}
