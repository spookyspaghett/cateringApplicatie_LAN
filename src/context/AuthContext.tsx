import { createContext, useContext, useState, ReactNode } from 'react'
import { authStore } from '../lib/store'

interface AuthContextValue {
  isAdmin: boolean
  signIn: (password: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => authStore.isAuthed())

  function signIn(password: string) {
    authStore.signIn(password) // throws if wrong
    setIsAdmin(true)
  }

  function signOut() {
    authStore.signOut()
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
