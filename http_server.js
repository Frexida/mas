#!/usr/bin/env node
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.MAS_HTTP_PORT || 8765;
const SEND_MESSAGE = path.join(__dirname, 'send_message.sh');

http.createServer((req, res) => {
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

      const args = ['-t', target, ...(execute ? ['-e'] : []), message];
      spawn(SEND_MESSAGE, args, {detached: true, stdio: 'ignore'}).unref();
    } catch (e) {
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: e.message}));
    }
  });
}).listen(PORT, () => console.log(`HTTP server on port ${PORT}`));