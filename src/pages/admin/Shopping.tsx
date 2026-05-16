import { useShoppingList } from '../../hooks/useShoppingList'
import { AdminNav } from '../../components/AdminNav'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'

export default function AdminShopping() {
  const { data: rows, isLoading, error } = useShoppingList()

  if (isLoading) return <><AdminNav /><Spinner label="Building shopping list…" /></>
  if (error) return <><AdminNav /><ErrorMessage message="Failed to load shopping list." /></>

  const byCategory: Record<string, typeof rows> = {}
  rows!.forEach((row) => {
    if (!byCategory[row.category]) byCategory[row.category] = []
    byCategory[row.category]!.push(row)
  })

  const grandTotal = rows!.reduce((sum, r) => sum + r.total_quantity, 0)

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Shopping List</h1>
          <p className="text-gray-400 text-sm mt-1">
            {grandTotal} total items across {rows!.length} unique menu items
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-secondary"
        >
          Print list
        </button>
      </div>

      {rows!.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No orders placed yet.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).sort().map(([category, items]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 capitalize">
                {category}
              </h2>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full">
                  <thead className="bg-gray-900 border-b border-gray-800">
                    <tr>
                      <th className="table-th">Item</th>
                      <th className="table-th text-right">Total needed</th>
                      <th className="table-th text-right">Checked off</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {items!.map((row) => (
                      <tr key={row.name} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                        <td className="table-td font-medium">{row.name}</td>
                        <td className="table-td text-right">
                          <span className="text-brand-400 font-bold text-lg">
                            ×{row.total_quantity}
                          </span>
                        </td>
                        <td className="table-td text-right">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
