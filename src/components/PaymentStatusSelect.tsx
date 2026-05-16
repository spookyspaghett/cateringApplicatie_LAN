import type { PaymentStatus } from '../lib/types'
import { useUpdatePaymentStatus } from '../hooks/useAttendees'

const OPTIONS: { value: PaymentStatus; label: string; cls: string }[] = [
  { value: 'unpaid', label: 'Unpaid', cls: 'text-red-400' },
  { value: 'paid',   label: 'Paid',   cls: 'text-green-400' },
  { value: 'comped', label: 'Comped', cls: 'text-blue-400' },
]

interface Props {
  attendeeId: string
  current: PaymentStatus
}

export function PaymentStatusSelect({ attendeeId, current }: Props) {
  const mutation = useUpdatePaymentStatus()
  const opt = OPTIONS.find((o) => o.value === current)

  return (
    <select
      value={current}
      disabled={mutation.isPending}
      onChange={(e) =>
        mutation.mutate({ id: attendeeId, payment_status: e.target.value as PaymentStatus })
      }
      className={`bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs ${opt?.cls ?? ''} focus:outline-none focus:ring-1 focus:ring-brand-500`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value} className={o.cls}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
