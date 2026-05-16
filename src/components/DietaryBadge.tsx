const COLORS: Record<string, string> = {
  vegetarian:   'bg-green-900 text-green-300',
  vegan:        'bg-emerald-900 text-emerald-300',
  'gluten-free':'bg-yellow-900 text-yellow-300',
  'dairy-free': 'bg-blue-900 text-blue-300',
  'nut-free':   'bg-orange-900 text-orange-300',
  halal:        'bg-purple-900 text-purple-300',
  kosher:       'bg-pink-900 text-pink-300',
}

export function DietaryBadge({ tag }: { tag: string }) {
  const cls = COLORS[tag.toLowerCase()] ?? 'bg-gray-800 text-gray-300'
  return <span className={`badge ${cls}`}>{tag}</span>
}
