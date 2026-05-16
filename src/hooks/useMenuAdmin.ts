import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { menuStore } from '../lib/store'
import type { MenuItem } from '../lib/types'

export function useAllMenuItems() {
  return useQuery({
    queryKey: ['menu', 'all'],
    queryFn: () => menuStore.listAll(),
  })
}

export function useUpdateMenuItem() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; values: Partial<Omit<MenuItem, 'id'>> }>({
    mutationFn: async ({ id, values }) => menuStore.update(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] })
      qc.invalidateQueries({ queryKey: ['shopping'] })
    },
  })
}

export function useAddMenuItem() {
  const qc = useQueryClient()
  return useMutation<MenuItem, Error, Omit<MenuItem, 'id'>>({
    mutationFn: async (values) => menuStore.insert(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  })
}

export function useDeleteMenuItem() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => menuStore.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  })
}
