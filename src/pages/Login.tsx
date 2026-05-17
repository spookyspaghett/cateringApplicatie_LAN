import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { attendeeStore, orderStore } from '../lib/store'
import { ErrorMessage } from '../components/ErrorMessage'
import type { Attendee, Order } from '../lib/types'

export default function AttendeeLogin() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [attendee, setAttendee] = useState<Attendee | null>(null)
  const [orders, setOrders]     = useState<Order[]>([])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const found = await attendeeStore.findByEmail(email.trim())

      if (!found) {
        setError("We couldn't find anyone registered with that email.")
        return
      }

      const myOrders = await orderStore.listForAttendee(found.id)

      setAttendee(found)
      setOrders(myOrders)

      if (myOrders.length === 0) {
        navigate(`/menu?attendee=${found.id}`)
      }
    } catch {
      setError('Something went wrong. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  // ── Choice screen shown after email lookup ──────────────────
  if (attendee && orders.length > 0) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">
          Welcome back, {attendee.name}!
        </h1>
        <p className="text-gray-400 mb-8">What would you like to do?</p>

        <div className="flex flex-col gap-3 mb-6">
          <Link
            to={`/menu?attendee=${attendee.id}`}
            className="btn-primary text-center py-3 text-base"
          >
            🍕 Place a new order
          </Link>

          {orders.length === 1 ? (
            <Link
              to={`/order/${orders[0].id}`}
              className="btn-secondary text-center py-3 text-base"
            >
              View my order
            </Link>
          ) : (
            <div className="card">
              <p className="text-sm text-gray-400 mb-3">Your previous orders:</p>
              <ul className="space-y-2">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      to={`/order/${o.id}`}
                      className="flex items-center justify-between rounded-lg bg-gray-800 hover:bg-gray-700 px-4 py-2.5 transition-colors"
                    >
                      <span className="text-sm text-gray-200">
                        Order #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        <span className={
                          o.status === 'ready'     ? 'text-green-400' :
                          o.status === 'preparing' ? 'text-blue-400'  : 'text-yellow-400'
                        }>
                          {o.status === 'ready' ? '✅ Ready' : o.status === 'preparing' ? '👨‍🍳 Preparing' : '⏳ Pending'}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() => { setAttendee(null); setOrders([]); setEmail('') }}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Not you?
        </button>
      </div>
    )
  }

  // ── Email form ───────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Already registered?</h1>
      <p className="text-gray-400 mb-8">
        Enter your email to view your order or place a new one.
      </p>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-5">
        <div>
          <label className="label">Email address</label>
          <input
            className="input"
            type="email"
            autoFocus
            required
            placeholder="ada@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
          />
        </div>

        {error && <ErrorMessage message={error} />}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Looking up…' : 'Continue →'}
        </button>

        <p className="text-center text-sm text-gray-500">
          New here?{' '}
          <Link to="/register" className="text-brand-400 hover:underline">
            Register instead
          </Link>
        </p>
      </form>
    </div>
  )
}
