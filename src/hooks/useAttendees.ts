import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attendeeStore } from '../lib/store'
import type { Attendee, PaymentStatus } from '../lib/types'

export function useAttendees() {
  return useQuery({
    queryKey: ['attendees'],
    queryFn: () => attendeeStore.list(),
  })
}

export function useRegisterAttendee() {
  const qc = useQueryClient()
  return useMutation<
    Attendee,
    Error,
    { name: string; email: string; password: string; dietary_restrictions: string[] }
  >({
    mutationFn: async (values) => attendeeStore.insert(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendees'] }),
  })
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; payment_status: PaymentStatus }>({
    mutationFn: async ({ id, payment_status }) => attendeeStore.updatePayment(id, payment_status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendees'] }),
  })
}
