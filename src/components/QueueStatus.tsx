import { useLiveOrder, useQueueInfo } from '../hooks/useOrderStatus'
import type { OrderStatus } from '../lib/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: string; color: string; bg: string }> = {
  pending:   { label: 'In queue',   icon: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-950 border-yellow-800' },
  preparing: { label: 'Preparing',  icon: '👨‍🍳', color: 'text-blue-400',   bg: 'bg-blue-950 border-blue-800'   },
  ready:     { label: 'Ready! 🎉',  icon: '✅', color: 'text-green-400',  bg: 'bg-green-950 border-green-800'  },
}

export function QueueStatus({ orderId }: { orderId: string }) {
  const { data: order }    = useLiveOrder(orderId)
  const { data: queueInfo } = useQueueInfo(orderId)

  if (!order || !queueInfo) return null

  const status = order.status ?? 'pending'
  const cfg    = STATUS_CONFIG[status]

  return (
    <div className={`rounded-xl border p-5 ${cfg.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{cfg.icon}</span>
        <div>
          <div className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</div>
          <div className="text-xs text-gray-400">Updates every 10 seconds</div>
        </div>
      </div>

      {status !== 'ready' && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{queueInfo.position + 1}</div>
            <div className="text-xs text-gray-400 mt-0.5">Queue position</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">~{queueInfo.etaMinutes}m</div>
            <div className="text-xs text-gray-400 mt-0.5">Estimated wait</div>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <p className="text-green-300 text-sm mt-1">
          Your order is ready — head to the catering table to collect it!
        </p>
      )}

      {status === 'preparing' && (
        <p className={`text-sm mt-1 ${cfg.color}`}>
          Your order is being prepared right now.
        </p>
      )}
    </div>
  )
}
