import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-brand-500 font-bold text-lg tracking-tight">
            LAN Catering
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/menu" className="text-sm text-gray-300 hover:text-white transition-colors">
              Menu
            </Link>
            {isAdmin ? (
              <>
                <Link to="/admin" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Admin
                </Link>
                <button onClick={handleSignOut} className="btn-secondary text-xs px-3 py-1.5">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/admin/login" className="btn-secondary text-xs px-3 py-1.5">
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        LAN Party Catering &mdash; Fuel the frag fest
      </footer>
    </div>
  )
}
