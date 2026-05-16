import { useParams, Link } from 'react-router-dom'
import { useOrderById } from '../hooks/useOrders'
import { QueueStatus } from '../components/QueueStatus'
import { Spinner } from '../components/Spinner'
import { ErrorMessage } from '../components/ErrorMessage'

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, error } = useOrderById(id)

  if (isLoading) return <Spinner label="Loading your order…" />
  if (error || !order) return <ErrorMessage message="Could not find that order." />

  const total = order.order_items.reduce(
    (sum, item) => sum + item.menu_items.price * item.quantity,
    0
  )

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-white mb-2">Order confirmed!</h1>
        <p className="text-gray-400">
          Thanks, <strong className="text-white">{order.attendees.name}</strong>.
          We'll let you know when it's ready.
        </p>
      </div>

      {/* Live queue status — polls every 10s */}
      {id && <div className="mb-6"><QueueStatus orderId={id} /></div>}

      {/* Order summary */}
      <div className="card mb-6">
        <h2 className="font-semibold text-white mb-3">Your order</h2>
        <ul className="space-y-2">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-300">
                {item.quantity}× {item.menu_items.name}
              </span>
              <span className="text-gray-400">
                ${(item.menu_items.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-3 mt-3">
          <span>Total</span>
          <span className="text-brand-400">${total.toFixed(2)}</span>
        </div>
        {order.notes && (
          <p className="text-xs text-gray-500 mt-3">Note: {order.notes}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" className="btn-secondary text-center">Back to home</Link>
        <Link
          to={`/menu?attendee=${order.attendees.id}`}
          className="btn-secondary text-center"
        >
          🍕 Order more food
        </Link>
        <button onClick={() => window.print()} className="btn-primary">
          Print receipt
        </button>
      </div>
    </div>
  )
}
