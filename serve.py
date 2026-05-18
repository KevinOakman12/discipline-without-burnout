"""
Лёгкий локальный HTTPS-сервер для разработки Mini App.

Telegram открывает WebApp только по HTTPS. Этот скрипт:
  1. Генерирует self-signed сертификат (если его ещё нет).
  2. Поднимает HTTPS-сервер на 0.0.0.0:8443.

Для теста бота с локального сервера используй туннель ngrok / cloudflared,
который выдаст публичный HTTPS-URL и проксирует на localhost:8443.

Usage:
    python serve.py            # https://localhost:8443/index.html
    python serve.py 9000       # https://localhost:9000/index.html
"""

from __future__ import annotations

import http.server
import socketserver
import ssl
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
CERT = ROOT / "_local-cert.pem"
KEY = ROOT / "_local-key.pem"


def ensure_cert() -> None:
    if CERT.exists() and KEY.exists():
        return
    print("[serve] generating self-signed cert (one-time)...")
    cmd = [
        "openssl", "req", "-x509", "-newkey", "rsa:2048",
        "-keyout", str(KEY), "-out", str(CERT),
        "-days", "365", "-nodes",
        "-subj", "/CN=localhost",
    ]
    try:
        subprocess.run(cmd, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        print(f"[serve] cannot create cert via openssl: {e}", file=sys.stderr)
        print("[serve] falling back to plain HTTP — useful only in a browser, NOT Telegram.")
        return


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8443
    ensure_cert()

    handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.ThreadingTCPServer(("0.0.0.0", port), handler)
    scheme = "http"

    if CERT.exists() and KEY.exists():
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(certfile=str(CERT), keyfile=str(KEY))
        httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
        scheme = "https"

    url = f"{scheme}://localhost:{port}/index.html"
    print(f"[serve] {url}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()


if __name__ == "__main__":
    main()
