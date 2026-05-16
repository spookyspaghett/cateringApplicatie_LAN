import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-8">
      <div>
        <div className="text-6xl mb-4">🎮</div>
        <h1 className="text-4xl font-bold text-white mb-3">LAN Party Catering</h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Register your seat, pick your food, and we'll handle the fuel for the frag fest.
          Dietary needs? We've got you covered.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/register" className="btn-primary text-base px-6 py-3">
          Register &amp; Order
        </Link>
        <Link to="/login" className="btn-secondary text-base px-6 py-3">
          Already registered
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-2xl w-full">
        {[
          { icon: '🍕', title: 'Food for gamers', desc: 'Pizzas, wings, wraps, drinks & snacks' },
          { icon: '🌿', title: 'Dietary friendly', desc: 'Vegan, gluten-free, halal, and more' },
          { icon: '💳', title: 'Pay your way', desc: 'Pay upfront or settle on the day' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card text-left">
            <div className="text-2xl mb-2">{icon}</div>
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
