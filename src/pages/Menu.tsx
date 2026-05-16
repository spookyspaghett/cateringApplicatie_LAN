import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMenu } from '../hooks/useMenu'
import { useSubmitOrder } from '../hooks/useOrders'
import { DietaryBadge } from '../components/DietaryBadge'
import { Spinner } from '../components/Spinner'
import { ErrorMessage } from '../components/ErrorMessage'
import type { CartItem, MenuItem } from '../lib/types'

export default function Menu() {
  const [params] = useSearchParams()
  const attendeeId = params.get('attendee')
  const navigate = useNavigate()

  const { data: items, isLoading, error } = useMenu()
  const { mutateAsync: submitOrder, isPending: submitting } = useSubmitOrder()

  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [orderError, setOrderError] = useState('')

  if (isLoading) return <Spinner label="Loading menu…" />
  if (error) return <ErrorMessage message="Failed to load menu." />

  const categories = ['all', ...Array.from(new Set(items!.map((i) => i.category)))]
  const visible = activeCategory === 'all' ? items! : items!.filter((i) => i.category === activeCategory)

  function getQty(id: string) {
    return cart.find((c) => c.menuItem.id === id)?.quantity ?? 0
  }

  function adjust(item: MenuItem, delta: number) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id)
      if (!existing) {
        if (delta <= 0) return prev
        return [...prev, { menuItem: item, quantity: delta }]
      }
      const next = existing.quantity + delta
      if (next <= 0) return prev.filter((c) => c.menuItem.id !== item.id)
      return prev.map((c) => c.menuItem.id === item.id ? { ...c, quantity: next } : c)
    })
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  async function handleSubmit() {
    if (!attendeeId) {
      navigate('/register')
      return
    }
    if (cart.length === 0) {
      setOrderError('Add at least one item to your order.')
      return
    }
    try {
      setOrderError('')
      const order = await submitOrder({ attendeeId, cart, notes }) as { id: string }
      navigate(`/order/${order.id}`)
    } catch (err: unknown) {
      setOrderError(err instanceof Error ? err.message : 'Failed to submit order.')
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left: menu */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-white mb-2">Menu</h1>
        <p className="text-gray-400 mb-6">Pick your fuel for the day.</p>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map((item) => {
            const qty = getQty(item.id)
            return (
              <div key={item.id} className="card flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.dietary_tags.map((t) => <DietaryBadge key={t} tag={t} />)}
                    </div>
                  </div>
                  <span className="text-brand-400 font-bold shrink-0">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  {qty === 0 ? (
                    <button
                      onClick={() => adjust(item, 1)}
                      className="btn-primary w-full"
                    >
                      Add to order
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => adjust(item, -1)}
                        className="btn-secondary w-9 h-9 rounded-full text-lg !px-0"
                      >
                        −
                      </button>
                      <span className="text-white font-bold w-6 text-center">{qty}</span>
                      <button
                        onClick={() => adjust(item, 1)}
                        className="btn-primary w-9 h-9 rounded-full text-lg !px-0"
                      >
                        +
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: cart */}
      <div className="lg:w-80 shrink-0">
        <div className="card sticky top-20">
          <h2 className="font-bold text-white mb-4">Your order ({cartCount})</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">Nothing added yet.</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {cart.map((c) => (
                <li key={c.menuItem.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {c.quantity}× {c.menuItem.name}
                  </span>
                  <span className="text-gray-400">
                    ${(c.menuItem.price * c.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2 mt-2">
                <span>Total</span>
                <span className="text-brand-400">${cartTotal.toFixed(2)}</span>
              </li>
            </ul>
          )}

          <div className="mb-3">
            <label className="label">Special notes</label>
            <textarea
              className="input resize-none h-20"
              placeholder="Allergies, preferences, delivery notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {orderError && <ErrorMessage message={orderError} />}

          {!attendeeId && (
            <p className="text-yellow-400 text-xs mb-3">
              You need to register before placing an order.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
            className="btn-primary w-full mt-2"
          >
            {submitting ? 'Submitting…' : attendeeId ? 'Place order' : 'Register first →'}
          </button>
        </div>
      </div>
    </div>
  )
}
