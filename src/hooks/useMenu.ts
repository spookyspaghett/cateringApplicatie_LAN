import { useQuery } from '@tanstack/react-query'
import { menuStore } from '../lib/store'

export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: () => menuStore.list(),
  })
}
