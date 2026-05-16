import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminGuard } from './components/AdminGuard'

import Landing           from './pages/Landing'
import Register          from './pages/Register'
import AttendeeLogin     from './pages/Login'
import Menu              from './pages/Menu'
import OrderConfirmation from './pages/OrderConfirmation'

import AdminLogin     from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminAttendees from './pages/admin/Attendees'
import AdminOrders    from './pages/admin/Orders'
import AdminMenuItems from './pages/admin/MenuItems'
import AdminSettings  from './pages/admin/Settings'
import AdminShopping  from './pages/admin/Shopping'
import AdminPayments  from './pages/admin/Payments'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route path="/login" element={<Layout><AttendeeLogin /></Layout>} />
      <Route path="/menu" element={<Layout><Menu /></Layout>} />
      <Route path="/order/:id" element={<Layout><OrderConfirmation /></Layout>} />

      {/* Admin auth */}
      <Route path="/admin/login" element={<Layout><AdminLogin /></Layout>} />

      {/* Protected admin */}
      <Route
        path="/admin"
        element={<Layout><AdminGuard><AdminDashboard /></AdminGuard></Layout>}
      />
      <Route
        path="/admin/attendees"
        element={<Layout><AdminGuard><AdminAttendees /></AdminGuard></Layout>}
      />
      <Route
        path="/admin/orders"
        element={<Layout><AdminGuard><AdminOrders /></AdminGuard></Layout>}
      />
      <Route
        path="/admin/menu"
        element={<Layout><AdminGuard><AdminMenuItems /></AdminGuard></Layout>}
      />
      <Route
        path="/admin/settings"
        element={<Layout><AdminGuard><AdminSettings /></AdminGuard></Layout>}
      />
      <Route
        path="/admin/shopping"
        element={<Layout><AdminGuard><AdminShopping /></AdminGuard></Layout>}
      />
      <Route
        path="/admin/payments"
        element={<Layout><AdminGuard><AdminPayments /></AdminGuard></Layout>}
      />

      {/* Fallback */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
      <div className="text-5xl">404</div>
      <h1 className="text-2xl font-bold text-white">Page not found</h1>
      <a href="/" className="btn-primary mt-2">Go home</a>
    </div>
  )
}
