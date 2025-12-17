# HTTP Server External Access Setup

## 概要
mas-tmux HTTP APIサーバーを外部ネットワークからアクセス可能にするための設定ガイドです。

## サーバーの起動方法

### デフォルト設定（全インターフェースで待ち受け）
```bash
./http_server.js
```
これにより、サーバーは `0.0.0.0:8765` でリッスンします。

### カスタムポート/ホストの指定
```bash
# 特定のポートで起動
MAS_HTTP_PORT=3000 ./http_server.js

# 特定のホストで起動（ローカルのみ）
MAS_HTTP_HOST=127.0.0.1 ./http_server.js

# 特定のIPアドレスでのみ待ち受け
MAS_HTTP_HOST=192.168.1.100 MAS_HTTP_PORT=8080 ./http_server.js
```

## ファイアウォール設定

### Linux (iptables)
```bash
# ポート8765を開く
sudo iptables -A INPUT -p tcp --dport 8765 -j ACCEPT

# 特定のIPアドレスからのみ許可
sudo iptables -A INPUT -p tcp --dport 8765 -s 192.168.1.0/24 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8765 -j DROP
```

### Linux (firewalld)
```bash
# ポート8765を開く
sudo firewall-cmd --zone=public --add-port=8765/tcp --permanent
sudo firewall-cmd --reload
```

### Linux (ufw)
```bash
# ポート8765を開く
sudo ufw allow 8765/tcp

# 特定のIPアドレスからのみ許可
sudo ufw allow from 192.168.1.0/24 to any port 8765
```

## セキュリティに関する重要事項

### 1. 認証の実装を推奨
現在のHTTPサーバーには認証機能がありません。本番環境で使用する場合は、以下のいずれかの実装を推奨します：
- APIキー認証
- Basic認証
- OAuth 2.0
- JWT トークン

### 2. HTTPS/TLSの使用
機密データを扱う場合は、HTTPSを使用してください。nginxやApacheなどのリバースプロキシを使用して、SSL/TLS終端処理を行うことを推奨します。

### nginx リバースプロキシ設定例：
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /mas/ {
        proxy_pass http://localhost:8765/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. レート制限
DoS攻撃を防ぐため、レート制限の実装を推奨します。

### 4. ログ記録
全てのAPIアクセスをログに記録し、異常なアクセスパターンを監視してください。

### 5. 最小権限の原則
- サーバープロセスは専用の非特権ユーザーで実行してください
- 必要最小限のディレクトリアクセス権限のみを付与してください

## APIの使用例

### 外部からメッセージを送信
```bash
# ローカルネットワークから
curl -X POST http://192.168.1.100:8765/message \
  -H "Content-Type: application/json" \
  -d '{"target": "window1", "message": "Hello from external network"}'

# インターネットから（パブリックIPアドレスを使用）
curl -X POST http://your-public-ip:8765/message \
  -H "Content-Type: application/json" \
  -d '{"target": "all", "message": "Broadcast message", "execute": true}'
```

### JavaScriptからの使用（CORS対応済み）
```javascript
fetch('http://your-server:8765/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    target: 'window1',
    message: 'Hello from web browser'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## トラブルシューティング

### ポートが既に使用されている場合
```bash
# 使用中のポートを確認
lsof -i :8765
# または
netstat -tulpn | grep 8765

# 別のポートで起動
MAS_HTTP_PORT=8766 ./http_server.js
```

### 外部からアクセスできない場合
1. ファイアウォールの設定を確認
2. サーバーが正しいホスト（0.0.0.0）でリッスンしているか確認
3. ルーターのポートフォワーディング設定を確認（インターネットからのアクセスの場合）

## 環境変数一覧

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| MAS_HTTP_PORT | 8765 | HTTPサーバーのポート番号 |
| MAS_HTTP_HOST | 0.0.0.0 | バインドするホストアドレス |