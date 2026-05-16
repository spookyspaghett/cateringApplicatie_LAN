import { useOrders } from '../../hooks/useOrders'
import { useUpdateOrderStatus, usePrepTime, emailConfigured } from '../../hooks/useOrderStatus'
import { AdminNav } from '../../components/AdminNav'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import type { OrderStatus, OrderWithItems } from '../../lib/types'

const STATUS_STEPS: OrderStatus[] = ['pending', 'preparing', 'ready']

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending:   'bg-yellow-950 text-yellow-400 border-yellow-800',
  preparing: 'bg-blue-950  text-blue-400  border-blue-800',
  ready:     'bg-green-950 text-green-400 border-green-800',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   '⏳ Pending',
  preparing: '👨‍🍳 Preparing',
  ready:     '✅ Ready',
}

function OrderRow({ order }: { order: OrderWithItems }) {
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus()

  const total = order.order_items.reduce(
    (sum, i) => sum + i.menu_items.price * i.quantity, 0
  )
  const status: OrderStatus = order.status ?? 'pending'
  const nextStatus = STATUS_STEPS[STATUS_STEPS.indexOf(status) + 1] as OrderStatus | undefined

  return (
    <div className={`card border-l-4 ${
      status === 'ready'     ? 'border-l-green-500' :
      status === 'preparing' ? 'border-l-blue-500'  : 'border-l-yellow-500'
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Attendee + order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{order.attendees.name}</span>
            <span className="text-gray-500 text-xs">{order.attendees.email}</span>
            {order.email_sent && (
              <span className="badge bg-gray-800 text-gray-400 border border-gray-700">
                📧 Email sent
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' · '}Order #{order.id.slice(0, 8).toUpperCase()}
          </div>

          <ul className="mt-2 space-y-0.5">
            {order.order_items.map((item) => (
              <li key={item.id} className="text-sm text-gray-300">
                {item.quantity}× {item.menu_items.name}
                <span className="text-gray-500 ml-1">
                  (${(item.menu_items.price * item.quantity).toFixed(2)})
                </span>
              </li>
            ))}
          </ul>

          {order.notes && (
            <p className="text-xs text-gray-500 mt-2 italic">"{order.notes}"</p>
          )}
        </div>

        {/* Status + actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-brand-400 font-bold">${total.toFixed(2)}</span>

          <span className={`badge border text-xs ${STATUS_STYLE[status]}`}>
            {STATUS_LABEL[status]}
          </span>

          {nextStatus && (
            <button
              onClick={() => updateStatus({ order, status: nextStatus })}
              disabled={isPending}
              className={`btn text-xs px-3 py-1.5 ${
                nextStatus === 'ready' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {isPending ? 'Updating…' : nextStatus === 'preparing' ? '👨‍🍳 Start preparing' : '✅ Mark ready'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const { data: orders, isLoading, error } = useOrders()
  const { data: prepMins, setMins }        = usePrepTime()

  if (isLoading) return <><AdminNav /><Spinner label="Loading orders…" /></>
  if (error)     return <><AdminNav /><ErrorMessage message="Failed to load orders." /></>

  const pending   = orders!.filter((o) => (o.status ?? 'pending') === 'pending')
  const preparing = orders!.filter((o) => (o.status ?? 'pending') === 'preparing')
  const ready     = orders!.filter((o) => (o.status ?? 'pending') === 'ready')

  function renderSection(title: string, items: OrderWithItems[], empty: string) {
    return (
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {title} ({items.length})
        </h2>
        {items.length === 0
          ? <p className="text-gray-600 text-sm">{empty}</p>
          : <div className="space-y-3">{items.map((o) => <OrderRow key={o.id} order={o} />)}</div>
        }
      </div>
    )
  }

  return (
    <div>
      <AdminNav />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">
          Orders ({orders!.length})
        </h1>

        {/* Prep time setting */}
        <div className="flex items-center gap-2 card !p-3">
          <label className="text-sm text-gray-400 whitespace-nowrap">⏱ Mins per order:</label>
          <input
            type="number"
            min={1}
            max={60}
            value={prepMins ?? 10}
            onChange={(e) => setMins(parseInt(e.target.value) || 10)}
            className="input w-16 text-center !py-1"
          />
          {!emailConfigured && (
            <span className="text-xs text-yellow-500" title="Configure EmailJS in src/lib/email.ts to enable emails">
              📧 Email off
            </span>
          )}
        </div>
      </div>

      {orders!.length === 0 ? (
        <p className="text-center text-gray-500 py-16">No orders yet.</p>
      ) : (
        <>
          {renderSection('⏳ Pending',   pending,   'Nothing waiting.')}
          {renderSection('👨‍🍳 Preparing', preparing, 'Nothing being prepared.')}
          {renderSection('✅ Ready',     ready,     'Nothing ready yet.')}
        </>
      )}
    </div>
  )
}
