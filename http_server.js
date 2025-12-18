#!/usr/bin/env node
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.MAS_HTTP_PORT || 8765;
const HOST = process.env.MAS_HTTP_HOST || '0.0.0.0';  // 全てのインターフェースでリッスン
const SEND_MESSAGE = path.join(__dirname, 'send_message.sh');

http.createServer((req, res) => {
  // CORSヘッダーを追加（必要に応じて）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエストへの対応（CORS preflight）
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }
  if (req.method !== 'POST' || req.url !== '/message') {
    res.writeHead(400, {'Content-Type': 'application/json'});
    return res.end(JSON.stringify({error: 'Only POST /message is supported'}));
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const {target, message, execute} = JSON.parse(body);
      if (!target || !message) throw new Error('target and message required');

      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({status: 'acknowledged', target, timestamp: new Date().toISOString()}));

      const args = ['-p', target, ...(execute ? ['-e'] : []), message];
      console.log(`Executing: ${SEND_MESSAGE} ${args.join(' ')}`);
      const child = spawn(SEND_MESSAGE, args, {detached: true, stdio: ['ignore', 'pipe', 'pipe']});

      // デバッグ用: stdoutとstderrをログ出力
      child.stdout?.on('data', (data) => {
        console.log(`[send_message stdout]: ${data}`);
      });

      child.stderr?.on('data', (data) => {
        console.error(`[send_message stderr]: ${data}`);
      });

      child.on('error', (error) => {
        console.error(`[send_message error]: ${error.message}`);
      });

      child.unref();
    } catch (e) {
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: e.message}));
    }
  });
}).listen(PORT, HOST, () => console.log(`HTTP server listening on ${HOST}:${PORT}`));