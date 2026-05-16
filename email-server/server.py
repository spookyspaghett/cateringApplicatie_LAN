"""
LAN Party Catering — local email server
Runs on http://localhost:5001

Uses Gmail SMTP with an App Password (no third-party services needed).
Start with:  python server.py
"""

import smtplib
import json
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Load credentials from email-server/.env (never committed to git) ──────────
_env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(_env_file):
    with open(_env_file) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith('#') and '=' in _line:
                _k, _v = _line.split('=', 1)
                os.environ.setdefault(_k.strip(), _v.strip())

# ── Config ────────────────────────────────────────────────────────────────────
# Credentials are read from email-server/.env — copy .env.example to .env
# and fill in your Gmail address and App Password.
#
# How to get a Gmail App Password:
#   1. Go to myaccount.google.com → Security → 2-Step Verification (enable it)
#   2. Go to myaccount.google.com → Security → App passwords
#   3. Create one called "LAN Catering", copy the 16-char password
#   4. Paste it into email-server/.env

SMTP_HOST     = "smtp.gmail.com"
SMTP_PORT     = 587
SMTP_USER     = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
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
        print(f"  {self.address_string()} — {fmt % args}")


if __name__ == "__main__":
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️  No credentials found.")
        print("   Copy email-server/.env.example to email-server/.env")
        print("   and fill in your Gmail address and App Password.")
        raise SystemExit(1)

    print(f"📧 Email server running on http://localhost:{PORT}")
    print(f"   Sending from: {SMTP_USER}")
    print(f"   Press Ctrl+C to stop\n")
    HTTPServer(("localhost", PORT), Handler).serve_forever()
