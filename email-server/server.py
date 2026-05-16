"""
LAN Party Catering — local email server
Runs on http://localhost:5001

Uses Gmail SMTP with an App Password (no third-party services needed).
Start with:  python server.py
"""

import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Config ────────────────────────────────────────────────────────────────────
# Use a Gmail App Password (NOT your normal Gmail password).
# How to get one:
#   1. Go to myaccount.google.com → Security → 2-Step Verification (enable it)
#   2. Go to myaccount.google.com → Security → App passwords
#   3. Create one called "LAN Catering", copy the 16-char password
#   4. Paste it below

# ── Pick one provider and fill in your credentials ───────────────────────────

# Option A: Gmail — App Password from myaccount.google.com → Security → App passwords
SMTP_HOST     = "smtp.gmail.com"
SMTP_PORT     = 587
SMTP_USER     = "example"  # ← your Gmail address
SMTP_PASSWORD = "xxxx xxxx xxxx xxxx"   # ← paste your 16-char App Password here

# Option B: Outlook / Hotmail — just your normal email + password, no setup needed
# SMTP_HOST     = "smtp-mail.outlook.com"
# SMTP_PORT     = 587```
# SMTP_USER     = "your@outlook.com"
# SMTP_PASSWORD = "your-password"

# Option C: Brevo (free, 300 emails/day) — sign up at brevo.com → SMTP & API → SMTP
# SMTP_HOST     = "smtp-relay.brevo.com"
# SMTP_PORT     = 587
# SMTP_USER     = "your@email.com"      # ← the email you signed up with
# SMTP_PASSWORD = "your-brevo-smtp-key" # ← the SMTP key from Brevo dashboard

FROM_NAME     = "LAN Party Catering"

PORT = 5001
# ─────────────────────────────────────────────────────────────────────────────


def send_email(to_email: str, to_name: str, order_id: str, items: str, total: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your order is ready, {to_name}! 🎮"
    msg["From"]    = f"{FROM_NAME} <{SMTP_USER}>"
    msg["To"]      = to_email

    plain = f"""Hi {to_name},

Your order #{order_id} is ready — head to the catering table to collect it!

Items:  {items}
Total:  {total}

GG! 🎮
"""

    html = f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#111;color:#eee;padding:32px;border-radius:12px">
  <h1 style="color:#38bdf8;margin-top:0">Your order is ready! 🎮</h1>
  <p>Hi <strong>{to_name}</strong>,</p>
  <p>Order <code style="background:#222;padding:2px 6px;border-radius:4px">#{order_id}</code>
     is ready — head to the catering table to collect it!</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr style="border-bottom:1px solid #333">
      <td style="padding:6px 0;color:#aaa">Items</td>
      <td style="padding:6px 0;text-align:right">{items}</td>
    </tr>
    <tr>
      <td style="padding:6px 0;color:#aaa">Total</td>
      <td style="padding:6px 0;text-align:right;color:#38bdf8;font-weight:bold">{total}</td>
    </tr>
  </table>
  <p style="color:#666;font-size:12px;margin-bottom:0">GG! 🎮</p>
</div>
"""

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.sendmail(SMTP_USER, to_email, msg.as_string())


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # CORS preflight
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path == "/send-email":
            length = int(self.headers.get("Content-Length", 0))
            body   = json.loads(self.rfile.read(length))

            try:
                send_email(
                    to_email=body["to_email"],
                    to_name=body["to_name"],
                    order_id=body["order_id"],
                    items=body["items"],
                    total=body["total"],
                )
                self._respond(200, {"ok": True})
                print(f"  ✓ Email sent to {body['to_email']}")
            except Exception as e:
                self._respond(500, {"ok": False, "error": str(e)})
                print(f"  ✗ Failed to send to {body['to_email']}: {e}")
        else:
            self._respond(404, {"error": "Not found"})

    def _respond(self, status: int, data: dict):
        payload = json.dumps(data).encode()
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, fmt, *args):
        # Cleaner console output
        print(f"  {self.address_string()} — {fmt % args}")


if __name__ == "__main__":
    # Quick config sanity check
    if SMTP_USER in ("your@gmail.com", "your@outlook.com", "your@email.com") or \
       SMTP_PASSWORD in ("xxxx xxxx xxxx xxxx", "your-password", "your-brevo-smtp-key"):
        print("⚠️  Edit SMTP_USER and SMTP_PASSWORD in server.py before starting!")
        raise SystemExit(1)

    print(f"📧 Email server running on http://localhost:{PORT}")
    print(f"   Sending from: {SMTP_USER}")
    print(f"   Press Ctrl+C to stop\n")
    HTTPServer(("localhost", PORT), Handler).serve_forever()
