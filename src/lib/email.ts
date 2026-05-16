// Local Python email server — run email-server/server.py before sending emails.
const EMAIL_SERVER = 'http://localhost:5001/send-email'

// emailConfigured is true when the server is reachable.
// We optimistically assume it's up; errors surface in the UI.
export const emailConfigured = true

export async function sendOrderReadyEmail(params: {
  to_name:  string
  to_email: string
  order_id: string
  items:    string
  total:    string
}): Promise<void> {
  const res = await fetch(EMAIL_SERVER, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(params),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? `Server returned ${res.status}`)
  }
}
