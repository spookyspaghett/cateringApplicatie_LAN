// Email is sent by the Express server — no separate Python process needed.
// Relative URL works because the frontend is served by the same Express server.

export const emailConfigured = true

export async function sendOrderReadyEmail(params: {
  to_name:  string
  to_email: string
  order_id: string
  items:    string
  total:    string
}): Promise<void> {
  const res = await fetch('/api/send-email', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(params),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? `Server returned ${res.status}`)
  }
}
