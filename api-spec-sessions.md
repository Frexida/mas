# Session Management API Specification

## Overview
セッション管理機能のためのAPIエンドポイント仕様書

## Endpoints

### 1. GET /sessions
**セッション一覧の取得**

#### Request
```http
GET /sessions?status=active&limit=50&offset=0
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | フィルター条件 (`active`, `inactive`, `terminated`) |
| limit | integer | No | 取得件数上限 (default: 50, max: 100) |
| offset | integer | No | スキップ件数 (pagination用) |

#### Response
```json
{
  "sessions": [
    {
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "tmuxSession": "mas-session-001",
      "workingDir": "/home/user/projects/mas",
      "startedAt": "2024-12-18T10:30:00Z",
      "status": "active",
      "lastActivity": "2024-12-18T10:35:00Z",
      "agentCount": 5
    }
  ],
  "count": 1
}
```

#### Status Codes
- `200 OK` - 成功
- `500 Internal Server Error` - サーバーエラー

---

### 2. GET /sessions/:sessionId
**特定セッションの詳細取得**

#### Request
```http
GET /sessions/550e8400-e29b-41d4-a716-446655440000
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | uuid | Yes | セッションID |

#### Response
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "tmuxSession": "mas-session-001",
  "workingDir": "/home/user/projects/mas",
  "startedAt": "2024-12-18T10:30:00Z",
  "status": "active",
  "lastActivity": "2024-12-18T10:35:00Z",
  "agentCount": 5
}
```

#### Status Codes
- `200 OK` - 成功
- `404 Not Found` - セッションが見つからない
- `500 Internal Server Error` - サーバーエラー

---

### 3. POST /sessions/:sessionId/connect
**既存セッションへの接続**

#### Request
```http
POST /sessions/550e8400-e29b-41d4-a716-446655440000/connect
Content-Type: application/json

{
  "reconnect": false
}
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | uuid | Yes | 接続するセッションID |

#### Request Body (Optional)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reconnect | boolean | No | 既に接続済みの場合でも再接続するか (default: false) |

#### Response
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "tmuxSession": "mas-session-001",
  "workingDir": "/home/user/projects/mas",
  "startedAt": "2024-12-18T10:30:00Z"
}
```

#### Status Codes
- `200 OK` - 接続成功
- `404 Not Found` - セッションが見つからない
- `409 Conflict` - セッションが終了済みまたは利用不可
- `500 Internal Server Error` - サーバーエラー

---

## Data Models

### SessionInfo
```typescript
interface SessionInfo {
  sessionId: string;        // UUID
  tmuxSession: string;       // tmuxセッション名
  workingDir: string;        // 作業ディレクトリ
  startedAt: string;         // 作成日時 (ISO 8601)
  status: SessionStatus;     // セッションステータス
  lastActivity?: string;     // 最終アクティビティ日時 (ISO 8601)
  agentCount?: number;       // エージェント数
}
```

### SessionStatus
```typescript
type SessionStatus = 'active' | 'inactive' | 'terminated';
```

### SessionListResponse
```typescript
interface SessionListResponse {
  sessions: SessionInfo[];   // セッション一覧
  count: number;             // 総件数
}
```

### RunsResponse (Connect Response)
```typescript
interface RunsResponse {
  sessionId: string;         // UUID
  tmuxSession: string;        // tmuxセッション名
  workingDir: string;         // 作業ディレクトリ
  startedAt: string;          // 作成日時 (ISO 8601)
}
```

### ErrorResponse
```typescript
interface ErrorResponse {
  error: string;             // エラーメッセージ
  code?: string;             // エラーコード
}
```

---

## Implementation Notes

### Session Status の判定基準
- **active**: tmuxプロセスが稼働中で、エージェントが応答可能
- **inactive**: tmuxプロセスは存在するが、一定時間アクティビティがない
- **terminated**: tmuxプロセスが終了している

### セッションIDの形式
- UUID v4形式を使用
- 例: `550e8400-e29b-41d4-a716-446655440000`

### tmuxセッション名の形式
- 英数字、ハイフン、アンダースコアのみ許可
- パターン: `^[a-zA-Z0-9-_]+$`
- 例: `mas-session-001`

### タイムスタンプ形式
- ISO 8601形式 (RFC 3339)
- 例: `2024-12-18T10:30:00Z`

### エラーコード例
- `SESSION_NOT_FOUND` - セッションが見つからない
- `SESSION_TERMINATED` - セッションが終了済み
- `SESSION_UNAVAILABLE` - セッションが利用不可
- `INVALID_SESSION_ID` - セッションID形式が不正

---

## Security Considerations

1. **認証・認可**
   - 必要に応じてAPIキー認証またはJWT認証を実装
   - ユーザーは自身のセッションのみアクセス可能にする

2. **Rate Limiting**
   - セッション一覧取得: 1分あたり60リクエストまで
   - 個別セッション取得: 1分あたり120リクエストまで

3. **セッションタイムアウト**
   - 非アクティブなセッションは一定時間後に自動終了
   - デフォルト: 30分間アクティビティがない場合

---

## Testing

### cURLコマンド例

```bash
# セッション一覧取得
curl -X GET "https://mas-api.frexida.com/sessions?status=active"

# 特定セッション取得
curl -X GET "https://mas-api.frexida.com/sessions/550e8400-e29b-41d4-a716-446655440000"

# セッションに接続
curl -X POST "https://mas-api.frexida.com/sessions/550e8400-e29b-41d4-a716-446655440000/connect" \
  -H "Content-Type: application/json" \
  -d '{"reconnect": false}'
```