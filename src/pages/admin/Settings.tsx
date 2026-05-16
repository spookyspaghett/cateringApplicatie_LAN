import { useState } from 'react'
import { sendOrderReadyEmail } from '../../lib/email'
import { usePrepTime } from '../../hooks/useOrderStatus'
import { AdminNav } from '../../components/AdminNav'

type TestState = 'idle' | 'sending' | 'ok' | 'error'

export default function AdminSettings() {
  const { data: prepMins, setMins } = usePrepTime()

  const [testEmail, setTestEmail] = useState('')
  const [testState, setTestState] = useState<TestState>('idle')
  const [testError, setTestError] = useState('')

  async function sendTest() {
    if (!testEmail) return
    setTestState('sending')
    setTestError('')
    try {
      await sendOrderReadyEmail({
        to_name:  'Test Attendee',
        to_email: testEmail,
        order_id: 'TEST001',
        items:    '2× Margherita Pizza, 1× Craft Beer',
        total:    '$29.00',
      })
      setTestState('ok')
    } catch (err: unknown) {
      console.error('Email error:', err)
      setTestState('error')
      setTestError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      {/* ── Prep time ─────────────────────────────────────────── */}
      <section className="card mb-6">
        <h2 className="font-semibold text-white mb-1">⏱ Prep time per order</h2>
        <p className="text-sm text-gray-400 mb-4">
          Used to calculate the estimated wait shown to attendees on their confirmation page.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={60}
            value={prepMins ?? 10}
            onChange={(e) => setMins(parseInt(e.target.value) || 10)}
            className="input w-24 text-center"
          />
          <span className="text-gray-400 text-sm">minutes per order</span>
        </div>
      </section>

      {/* ── Email server ───────────────────────────────────────── */}
      <section className="card mb-6">
        <h2 className="font-semibold text-white mb-1">📧 Local email server</h2>
        <p className="text-sm text-gray-400 mb-5">
          Emails are sent by a local Python script — no third-party service needed.
          Run it once before the event and leave it open in a terminal.
        </p>

        <ol className="space-y-3 text-sm text-gray-300 mb-6">
          {[
            <>
              Open <code className="bg-gray-800 px-1 rounded text-gray-300">email-server/server.py</code> and
              fill in your Gmail address and App Password at the top.
            </>,
            <>
              To get a Gmail App Password:{' '}
              <strong className="text-white">myaccount.google.com → Security → 2-Step Verification</strong>{' '}
              (enable it), then{' '}
              <strong className="text-white">Security → App passwords</strong> → create one called "LAN Catering".
              Paste the 16-char code into <code className="bg-gray-800 px-1 rounded text-gray-300">SMTP_PASSWORD</code>.
            </>,
            <>
              Open a terminal and run:{' '}
              <code className="bg-gray-800 px-2 py-0.5 rounded text-gray-200">python email-server/server.py</code>.
              You should see{' '}
              <span className="text-green-400">📧 Email server running on http://localhost:5001</span>.
            </>,
            <>
              Leave that terminal open. Use the test below to confirm it's working.
            </>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <h3 className="font-medium text-white mb-2">Send a test email</h3>
        <div className="flex gap-2 flex-wrap">
          <input
            type="email"
            className="input max-w-xs"
            placeholder="your@email.com"
            value={testEmail}
            onChange={(e) => { setTestEmail(e.target.value); setTestState('idle') }}
          />
          <button
            onClick={sendTest}
            disabled={!testEmail || testState === 'sending'}
            className="btn-primary"
          >
            {testState === 'sending' ? 'Sending…' : 'Send test email'}
          </button>
        </div>

        {testState === 'ok' && (
          <div className="mt-3 rounded-lg border border-green-800 bg-green-950 px-4 py-3 text-sm text-green-300">
            ✅ Test email sent to <strong>{testEmail}</strong> — check your inbox (and spam folder).
          </div>
        )}
        {testState === 'error' && (
          <div className="mt-3 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300 space-y-1">
            <p><strong>Failed to send.</strong> Is the Python server running?</p>
            <p className="font-mono text-xs opacity-80">{testError}</p>
            <p className="text-xs text-red-400">
              Run <code className="bg-red-900 px-1 rounded">python email-server/server.py</code> in a terminal first.
            </p>
          </div>
        )}
      </section>

      {/* ── Full flow test guide ───────────────────────────────── */}
      <section className="card">
        <h2 className="font-semibold text-white mb-1">🧪 How to test the full flow</h2>
        <p className="text-sm text-gray-400 mb-4">
          Use two browser tabs side-by-side to simulate an attendee and the admin at the same time.
        </p>
        <ol className="space-y-2 text-sm text-gray-300">
          {[
            <>Open <strong className="text-white">Tab 1</strong> → go to <code className="bg-gray-800 px-1 rounded">/register</code> and sign up with a real email address.</>,
            <>Add some items and place the order. You'll land on the confirmation page showing your live queue position.</>,
            <>Open <strong className="text-white">Tab 2</strong> → go to <code className="bg-gray-800 px-1 rounded">/admin/orders</code> → sign in (<code className="bg-gray-800 px-1 rounded">admin123</code>).</>,
            <>Click <strong className="text-white">"Start preparing"</strong> on the order. Switch to Tab 1 — within 10 seconds it updates to 👨‍🍳.</>,
            <>Click <strong className="text-white">"Mark ready"</strong>. Tab 1 goes green ✅ and the Python server sends the email automatically.</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
