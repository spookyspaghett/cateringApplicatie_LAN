import { useState } from 'react'
import { useAttendees } from '../../hooks/useAttendees'
import { AdminNav } from '../../components/AdminNav'
import { DietaryBadge } from '../../components/DietaryBadge'
import { PaymentStatusSelect } from '../../components/PaymentStatusSelect'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'

export default function AdminAttendees() {
  const { data: attendees, isLoading, error } = useAttendees()
  const [search, setSearch] = useState('')

  if (isLoading) return <><AdminNav /><Spinner label="Loading attendees…" /></>
  if (error) return <><AdminNav /><ErrorMessage message="Failed to load attendees." /></>

  const filtered = attendees!.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">Attendees ({attendees!.length})</h1>
        <input
          className="input max-w-xs"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              {['Name', 'Email', 'Dietary restrictions', 'Payment', 'Registered'].map((h) => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((a) => (
              <tr key={a.id} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                <td className="table-td font-medium">{a.name}</td>
                <td className="table-td text-gray-400">{a.email}</td>
                <td className="table-td">
                  <div className="flex flex-wrap gap-1">
                    {a.dietary_restrictions.length === 0 ? (
                      <span className="text-gray-600 text-xs">None</span>
                    ) : (
                      a.dietary_restrictions.map((r) => <DietaryBadge key={r} tag={r} />)
                    )}
                  </div>
                </td>
                <td className="table-td">
                  <PaymentStatusSelect attendeeId={a.id} current={a.payment_status} />
                </td>
                <td className="table-td text-gray-500 text-xs">
                  {new Date(a.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8 text-sm">No attendees found.</p>
        )}
      </div>
    </div>
  )
}
