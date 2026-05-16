import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
