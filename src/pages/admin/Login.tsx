import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ErrorMessage } from '../../components/ErrorMessage'

export default function AdminLogin() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      signIn(password)
      navigate('/admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold text-white mb-2">Admin login</h1>
      <p className="text-gray-400 mb-8">Restricted to event organisers.</p>
      <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Default: <code className="text-gray-400">admin123</code></p>
        </div>
        {error && <ErrorMessage message={error} />}
        <button type="submit" className="btn-primary">
          Sign in
        </button>
      </form>
    </div>
  )
}
