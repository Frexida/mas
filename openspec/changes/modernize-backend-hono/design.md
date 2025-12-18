# Design: HonoベースAPIサーバーとシェルスクリプトモジュール化

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                  Client Layer                      │
│      (Web UI, CLI Tools, External APIs)           │
└──────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│           API Layer (TypeScript/Hono)              │
│  ┌────────────────────────────────────────────┐  │
│  │  Hono Server (api/server.ts)               │  │
│  │  - CORS, Validation, Error Handling        │  │
│  │  - /message, /runs, /status endpoints      │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│         Shell Script Modules (lib/*.sh)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ tmux.sh  │ │ agent.sh │ │ message.sh   │    │
│  │          │ │          │ │              │    │
│  │ - create │ │ - init   │ │ - route      │    │
│  │ - attach │ │ - start  │ │ - send       │    │
│  │ - split  │ │ - stop   │ │ - broadcast  │    │
│  └──────────┘ └──────────┘ └──────────────┘    │
│  ┌──────────┐ ┌──────────────────────────┐     │
│  │session.sh│ │     project.sh (既存)     │     │
│  └──────────┘ └──────────────────────────┘     │
└──────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│              Infrastructure Layer                  │
│    (tmux sessions, clauded processes, files)      │
└──────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. 最小限のTypeScript化

**Decision**: API層のみTypeScript化し、コア処理はシェルスクリプトを維持

**Rationale**:
- tmux操作はシェルスクリプトが最適
- CLIツールとしての柔軟性を維持
- 既存の実績あるロジックを活用
- 学習コストの最小化

**Implementation**:
```typescript
// api/routes/runs.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const RunRequestSchema = z.object({
  agents: z.object({
    metaManager: z.object({
      id: z.string(),
      prompt: z.string()
    }).optional(),
    units: z.array(z.object({
      unitId: z.number(),
      manager: z.object({
        id: z.string(),
        prompt: z.string()
      }),
      workers: z.array(z.object({
        id: z.string(),
        prompt: z.string()
      }))
    }))
  })
});

const app = new Hono();

app.post('/', async (c) => {
  const body = await c.req.json();
  const validated = RunRequestSchema.parse(body);

  // シェルスクリプトに委譲
  const configPath = `/tmp/mas-config-${Date.now()}.json`;
  await fs.writeFile(configPath, JSON.stringify(validated));

  const { stdout } = await execAsync(`./mas.sh start --config ${configPath}`);

  return c.json({
    sessionId: extractSessionId(stdout),
    status: 'started'
  });
});
```

### 2. シェルスクリプトのモジュール分割

**Decision**: 機能ごとに独立したシェルスクリプトモジュールに分割

**Structure**:
```bash
# lib/tmux.sh - tmux操作専用モジュール
#!/bin/bash

TMUX_SESSION_PREFIX="${TMUX_SESSION_PREFIX:-mas-}"

create_session() {
    local session_name="$1"
    tmux new-session -d -s "$session_name" -n meta
}

create_window() {
    local session_name="$1"
    local window_name="$2"
    local window_index="$3"
    tmux new-window -t "$session_name:$window_index" -n "$window_name"
}

split_panes() {
    local session_name="$1"
    local window_index="$2"

    # 4ペインレイアウトの作成
    tmux split-window -t "$session_name:$window_index" -h
    tmux split-window -t "$session_name:$window_index.0" -v
    tmux split-window -t "$session_name:$window_index.1" -v
    tmux select-layout -t "$session_name:$window_index" tiled
}

attach_session() {
    local session_name="$1"
    tmux attach-session -t "$session_name"
}
```

```bash
# lib/agent.sh - エージェント管理モジュール
#!/bin/bash

source "$(dirname "$0")/lib/tmux.sh"

init_agent() {
    local unit_dir="$1"
    local unit_num="$2"
    local model="$3"
    local prompt="$4"

    # エージェントディレクトリの準備
    mkdir -p "$unit_dir/$unit_num"
    echo "$prompt" > "$unit_dir/$unit_num/INSTRUCTIONS.md"
}

start_agent() {
    local session_name="$1"
    local window="$2"
    local pane="$3"
    local unit_dir="$4"
    local unit_num="$5"
    local model="$6"

    tmux send-keys -t "$session_name:$window.$pane" \
        "cd $unit_dir/$unit_num && clauded --model $model" C-m
}

stop_agent() {
    local session_name="$1"
    local window="$2"
    local pane="$3"

    tmux send-keys -t "$session_name:$window.$pane" C-c
}
```

### 3. APIサーバーの実装方針

**Decision**: Honoの軽量性を活かしたシンプルな実装

**Features**:
- Zodによるスキーマバリデーション
- 構造化されたエラーハンドリング
- CORSサポート
- ログミドルウェア

```typescript
// api/server.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

import messageRoute from './routes/message';
import runsRoute from './routes/runs';
import statusRoute from './routes/status';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Error handling
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Routes
app.route('/message', messageRoute);
app.route('/runs', runsRoute);
app.route('/status', statusRoute);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

const port = process.env.MAS_API_PORT || 8765;
console.log(`Server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
```

### 4. 既存スクリプトとの統合

**Decision**: 既存のmas.shをエントリーポイントとして維持し、内部でモジュールを呼び出す

```bash
#!/bin/bash
# mas.sh - リファクタリング版

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# モジュールの読み込み
source "$SCRIPT_DIR/lib/tmux.sh"
source "$SCRIPT_DIR/lib/agent.sh"
source "$SCRIPT_DIR/lib/message.sh"
source "$SCRIPT_DIR/lib/session.sh"
source "$SCRIPT_DIR/lib/project.sh"

# コマンドの実装
cmd_start() {
    local config_file="${1:-}"

    # セッション作成
    local session_name=$(generate_session_name)
    create_session "$session_name"

    # ウィンドウ作成
    create_windows "$session_name"

    # エージェント起動
    if [[ -n "$config_file" ]]; then
        start_agents_from_config "$session_name" "$config_file"
    else
        start_default_agents "$session_name"
    fi

    # HTTPサーバー起動
    start_api_server "$session_name"

    echo "$session_name"
}

cmd_send() {
    local target="$1"
    local message="$2"

    # message.shのルーティング関数を呼び出し
    route_message "$target" "$message"
}

# メイン処理
main() {
    local cmd="${1:-}"
    shift

    case "$cmd" in
        start)  cmd_start "$@" ;;
        send)   cmd_send "$@" ;;
        stop)   cmd_stop "$@" ;;
        status) cmd_status "$@" ;;
        *)      cmd_help ;;
    esac
}

main "$@"
```

## Technology Choices

### APIサーバー技術スタック

- **Hono**: 軽量・高速なWebフレームワーク
- **TypeScript**: API層の型安全性
- **Zod**: ランタイムバリデーション
- **Bun/Node.js**: JavaScript実行環境

### シェルスクリプト環境

- **Bash 4.0+**: 標準的なシェル
- **tmux**: セッション管理
- **jq**: JSON処理（オプション）

## Migration Strategy

### Phase 1: APIサーバー構築（3-5日）

1. Honoプロジェクトのセットアップ
2. 既存の`/message`エンドポイント移植
3. `/runs`エンドポイントの新規実装
4. バリデーションとエラーハンドリング

### Phase 2: シェルスクリプトモジュール化（3-5日）

1. `lib/tmux.sh`の作成（tmux操作の分離）
2. `lib/agent.sh`の作成（エージェント管理）
3. `lib/message.sh`の作成（メッセージルーティング）
4. `mas.sh`のリファクタリング

### Phase 3: 統合テスト（2-3日）

1. API経由でのエージェント起動テスト
2. メッセージ送信の動作確認
3. 既存機能の互換性確認
4. ドキュメント更新

## Testing Approach

### APIテスト

```typescript
// api/tests/message.test.ts
import { describe, test, expect } from 'bun:test';
import app from '../server';

describe('POST /message', () => {
  test('sends message to agent', async () => {
    const response = await app.request('/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: '00',
        message: 'Test message'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('sent');
  });
});
```

### シェルスクリプトテスト

```bash
#!/bin/bash
# tests/test_tmux.sh

source ../lib/tmux.sh

test_create_session() {
    local test_session="test-mas-$$"

    create_session "$test_session"

    if tmux has-session -t "$test_session" 2>/dev/null; then
        echo "✓ Session created successfully"
        tmux kill-session -t "$test_session"
    else
        echo "✗ Failed to create session"
        return 1
    fi
}

test_create_session
```

## Security Considerations

1. **入力検証**: Zodによる厳格なスキーマ検証
2. **コマンドインジェクション対策**: シェルコマンドの適切なエスケープ
3. **CORS設定**: 必要なオリジンのみ許可
4. **エラー情報**: 本番環境では詳細なエラー情報を隠蔽

## Future Considerations

1. **WebSocketサポート**: リアルタイムな状態更新（必要に応じて）
2. **認証機能**: APIキーやJWT（必要に応じて）
3. **メトリクス収集**: Prometheus形式（必要に応じて）
4. **ログ集約**: 構造化ログの外部送信（必要に応じて）