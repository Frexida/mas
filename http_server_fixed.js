#!/usr/bin/env node
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.MAS_HTTP_PORT || 8765;
const HOST = process.env.MAS_HTTP_HOST || '0.0.0.0';
const SEND_MESSAGE = path.join(__dirname, 'send_message.sh');

http.createServer((req, res) => {
  // すべてのレスポンスにCORSヘッダーを追加
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  // OPTIONSリクエスト（CORS preflight）への対応
  if (req.method === 'OPTIONS') {
    res.writeHead(204); // No Content
    return res.end();
  }

  // /message エンドポイント
  if (req.url === '/message' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const {target, message, execute} = JSON.parse(body);
        if (!target || !message) {
          throw new Error('target and message are required');
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
          status: 'acknowledged',
          target,
          timestamp: new Date().toISOString()
        }));

        // バックグラウンドでメッセージを送信
        const args = ['-t', target, ...(execute ? ['-e'] : []), message];
        spawn(SEND_MESSAGE, args, {detached: true, stdio: 'ignore'}).unref();
      } catch (e) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: e.message}));
      }
    });
    return;
  }

  // その他のエンドポイント（未実装）
  res.writeHead(404, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.url} is not implemented`,
    availableEndpoints: ['POST /message']
  }));

}).listen(PORT, HOST, () => {
  console.log(`HTTP server listening on ${HOST}:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /message - Send message to tmux session');
});