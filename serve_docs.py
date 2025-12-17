#!/usr/bin/env python3
"""
Simple HTTP server for serving API documentation
"""
import http.server
import socketserver
import sys

PORT = 8080
HOST = '0.0.0.0'  # すべてのインターフェースでリッスン

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORSヘッダーを追加
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        """ログメッセージをカスタマイズ"""
        sys.stdout.write(f"[{self.address_string()}] {format % args}\n")
        sys.stdout.flush()

# TCPサーバーを作成
with socketserver.TCPServer((HOST, PORT), MyHTTPRequestHandler) as httpd:
    httpd.socket.setsockopt(socketserver.socket.SOL_SOCKET, socketserver.socket.SO_REUSEADDR, 1)
    print(f"ドキュメントサーバーを起動しました")
    print(f"アドレス: http://{HOST}:{PORT}")
    print(f"")
    print(f"アクセス可能なドキュメント:")
    print(f"  - Swagger UI: http://192.168.11.7:{PORT}/api-docs.html")
    print(f"  - ReDoc:      http://192.168.11.7:{PORT}/api-redoc.html")
    print(f"  - OpenAPI:    http://192.168.11.7:{PORT}/openapi.yaml")
    print(f"")
    print(f"ローカルアクセス:")
    print(f"  - http://localhost:{PORT}/api-docs.html")
    print(f"")
    print(f"Ctrl+C で停止します...")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nサーバーを停止しました")
        sys.exit(0)