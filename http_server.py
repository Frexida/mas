#!/usr/bin/env python3
"""
mas-tmux HTTP Server
POSTリクエストを受け取ってエージェントにメッセージを送信
"""

import json
import subprocess
import sys
import os
import signal
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
from pathlib import Path

# 設定
PORT = int(os.environ.get("MAS_HTTP_PORT", 8765))
SCRIPT_DIR = Path(__file__).parent.resolve()
SEND_MESSAGE = SCRIPT_DIR / "send_message.sh"
LOG_FILE = Path(os.environ.get("MAS_HTTP_LOG", "/tmp/mas_http_server.log"))
PID_FILE = Path(os.environ.get("MAS_HTTP_PID", "/tmp/mas_http_server.pid"))

def log(message):
    """ログ出力"""
    with open(LOG_FILE, "a") as f:
        f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}\n")

class RequestHandler(BaseHTTPRequestHandler):
    """HTTPリクエストハンドラー"""

    def do_POST(self):
        """POSTリクエスト処理"""
        # パスをチェック
        if self.path != "/message":
            self.send_error(400, "Only POST /message is supported")
            log(f"Invalid path: {self.path}")
            return

        # Content-Lengthを取得
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            self.send_error(400, "Request body is required")
            return

        # ボディを読む
        body = self.rfile.read(content_length)
        log(f"Request received: POST {self.path}")
        log(f"Body: {body.decode('utf-8')}")

        # JSONパース
        try:
            data = json.loads(body)
        except json.JSONDecodeError as e:
            self.send_error(400, f"Invalid JSON: {e}")
            log(f"JSON parse error: {e}")
            return

        # 必須フィールドの確認
        target = data.get("target")
        message = data.get("message")
        execute = data.get("execute", False)

        if not target or not message:
            error_msg = {"error": "target and message are required"}
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(error_msg).encode())
            log(f"Missing required fields: target={target}, message={message}")
            return

        # 成功レスポンスを返す
        response = {
            "status": "acknowledged",
            "message": "Message received and sent to agent",
            "target": target,
            "timestamp": datetime.now().isoformat()
        }

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode())

        # バックグラウンドでメッセージ送信
        try:
            cmd = [str(SEND_MESSAGE), "-t", target]
            if execute:
                cmd.append("-e")
            cmd.append(message)

            # 非同期実行
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            log(f"Message sent to {target}: {message}")
        except Exception as e:
            log(f"Error sending message: {e}")

    def log_message(self, format, *args):
        """アクセスログをカスタムログに転送"""
        log(f"{self.client_address[0]} - {format % args}")

def cleanup(signum, frame):
    """シグナルハンドラー"""
    log("Shutting down HTTP server")
    if PID_FILE.exists():
        PID_FILE.unlink()
    sys.exit(0)

def main():
    """メイン処理"""
    # ログファイル作成
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    LOG_FILE.touch()

    # send_message.shの存在確認
    if not SEND_MESSAGE.exists():
        log(f"Error: send_message.sh not found at {SEND_MESSAGE}")
        print(f"Error: send_message.sh not found", file=sys.stderr)
        sys.exit(1)

    # PIDファイル作成
    with open(PID_FILE, "w") as f:
        f.write(str(os.getpid()))

    # シグナルハンドラー設定
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    # HTTPサーバー起動
    log(f"Starting HTTP server on port {PORT}")
    server = HTTPServer(("", PORT), RequestHandler)
    log(f"HTTP server listening on port {PORT}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        cleanup(None, None)

if __name__ == "__main__":
    main()