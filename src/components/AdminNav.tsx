import { NavLink } from 'react-router-dom'

const links = [
  { to: '/admin',           label: 'Dashboard',  end: true },
  { to: '/admin/attendees', label: 'Attendees' },
  { to: '/admin/orders',    label: 'Orders' },
  { to: '/admin/menu',      label: 'Menu items' },
  { to: '/admin/shopping',  label: 'Shopping List' },
  { to: '/admin/payments',  label: 'Payments' },
  { to: '/admin/settings',  label: '⚙ Settings' },
]

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-1 mb-8 border-b border-gray-800 pb-4">
      {links.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
