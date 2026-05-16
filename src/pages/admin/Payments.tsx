import { useState } from 'react'
import { useAttendees, useUpdatePaymentStatus } from '../../hooks/useAttendees'
import { AdminNav } from '../../components/AdminNav'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import type { PaymentStatus } from '../../lib/types'

const STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'text-red-400 bg-red-950 border-red-800',
  paid:   'text-green-400 bg-green-950 border-green-800',
  comped: 'text-blue-400 bg-blue-950 border-blue-800',
}

export default function AdminPayments() {
  const { data: attendees, isLoading, error } = useAttendees()
  const { mutateAsync: updatePayment, isPending } = useUpdatePaymentStatus()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkError, setBulkError] = useState('')
  const [bulkSuccess, setBulkSuccess] = useState('')

  if (isLoading) return <><AdminNav /><Spinner label="Loading payments…" /></>
  if (error) return <><AdminNav /><ErrorMessage message="Failed to load attendees." /></>

  const unpaidAttendees = attendees!.filter((a) => a.payment_status === 'unpaid')

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === unpaidAttendees.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(unpaidAttendees.map((a) => a.id)))
    }
  }

  async function bulkMarkPaid() {
    setBulkError('')
    setBulkSuccess('')
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          updatePayment({ id, payment_status: 'paid' })
        )
      )
      setBulkSuccess(`Marked ${selected.size} attendee(s) as paid.`)
      setSelected(new Set())
    } catch {
      setBulkError('Some updates failed — please try again.')
    }
  }

  const stats = {
    paid:   attendees!.filter((a) => a.payment_status === 'paid').length,
    unpaid: attendees!.filter((a) => a.payment_status === 'unpaid').length,
    comped: attendees!.filter((a) => a.payment_status === 'comped').length,
  }

  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold text-white mb-6">Payments</h1>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3 mb-8">
        {(['paid', 'unpaid', 'comped'] as PaymentStatus[]).map((status) => (
          <div
            key={status}
            className={`border rounded-full px-4 py-1.5 text-sm font-medium capitalize ${STATUS_COLORS[status]}`}
          >
            {stats[status]} {status}
          </div>
        ))}
      </div>

      {/* Bulk actions */}
      {unpaidAttendees.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded"
                checked={selected.size === unpaidAttendees.length && unpaidAttendees.length > 0}
                onChange={toggleAll}
              />
              <span className="text-sm text-gray-300">
                {selected.size === 0
                  ? `${unpaidAttendees.length} unpaid attendees`
                  : `${selected.size} selected`}
              </span>
            </div>
            <button
              onClick={bulkMarkPaid}
              disabled={selected.size === 0 || isPending}
              className="btn-primary"
            >
              {isPending ? 'Updating…' : `Mark ${selected.size || ''} as paid`}
            </button>
          </div>
          {bulkError && <div className="mt-3"><ErrorMessage message={bulkError} /></div>}
          {bulkSuccess && (
            <p className="mt-3 text-sm text-green-400">{bulkSuccess}</p>
          )}
        </div>
      )}

      {/* Full table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-[500px]">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              <th className="table-th w-10"></th>
              <th className="table-th">Name</th>
              <th className="table-th">Email</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {attendees!.map((a) => (
              <tr key={a.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                <td className="table-td">
                  {a.payment_status === 'unpaid' && (
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-500"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                    />
                  )}
                </td>
                <td className="table-td font-medium">{a.name}</td>
                <td className="table-td text-gray-400">{a.email}</td>
                <td className="table-td">
                  <span className={`badge border ${STATUS_COLORS[a.payment_status]} capitalize`}>
                    {a.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
