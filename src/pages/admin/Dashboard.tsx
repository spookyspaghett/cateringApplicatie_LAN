import { Link } from 'react-router-dom'
import { useAttendees } from '../../hooks/useAttendees'
import { useOrders } from '../../hooks/useOrders'
import { useShoppingList } from '../../hooks/useShoppingList'
import { AdminNav } from '../../components/AdminNav'
import { Spinner } from '../../components/Spinner'

export default function AdminDashboard() {
  const { data: attendees, isLoading: aLoading } = useAttendees()
  const { data: orders, isLoading: oLoading } = useOrders()
  const { data: shopping } = useShoppingList()

  if (aLoading || oLoading) return <Spinner label="Loading dashboard…" />

  const paid    = attendees?.filter((a) => a.payment_status === 'paid').length ?? 0
  const unpaid  = attendees?.filter((a) => a.payment_status === 'unpaid').length ?? 0
  const comped  = attendees?.filter((a) => a.payment_status === 'comped').length ?? 0
  const totalRevenue = orders?.reduce((sum, o) =>
    sum + o.order_items.reduce((s, i) => s + i.menu_items.price * i.quantity, 0), 0
  ) ?? 0

  const stats = [
    { label: 'Total attendees', value: attendees?.length ?? 0, color: 'text-white' },
    { label: 'Paid',           value: paid,                   color: 'text-green-400' },
    { label: 'Unpaid',         value: unpaid,                 color: 'text-red-400' },
    { label: 'Comped',         value: comped,                 color: 'text-blue-400' },
    { label: 'Orders placed',  value: orders?.length ?? 0,    color: 'text-white' },
    { label: 'Total order value', value: `$${totalRevenue.toFixed(2)}`, color: 'text-brand-400' },
  ]

  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="card">
            <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-white mb-3">Quick links</h2>
          <ul className="space-y-2">
            {[
              { to: '/admin/attendees', label: 'Manage attendees' },
              { to: '/admin/orders',    label: 'View all orders' },
              { to: '/admin/shopping',  label: 'Shopping list' },
              { to: '/admin/payments',  label: 'Update payments' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
                  {label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {shopping && shopping.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-white mb-3">Top items needed</h2>
            <ul className="space-y-1">
              {shopping.slice(0, 5).map((row) => (
                <li key={row.name} className="flex justify-between text-sm">
                  <span className="text-gray-300">{row.name}</span>
                  <span className="text-brand-400 font-medium">×{row.total_quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
