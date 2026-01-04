# Design: Agent Message Logging and Monitoring

## Context

MASでは複数のエージェントがtmuxセッションを介してコミュニケーションを行っている。現在、メッセージは`api/core/routes/message.ts`を通じて送信されるが、送信後のログは残らない。

## Goals / Non-Goals

### Goals
- メッセージの完全な履歴を保存し取得可能にする
- Slack/Discord風のUIでメッセージ履歴を閲覧できるようにする
- 停滞検知と自動催促でコミュニケーションの流れを維持する
- **テスタブルな設計**

### Non-Goals
- メッセージの編集・削除機能
- リアルタイム通知（WebSocket）
- メッセージの暗号化

## Architecture

### レイヤー構成

```
┌─────────────────────────────────────────────────┐
│  Routes (HTTP handlers)                         │
│  - message.ts, messages.ts, monitor.ts          │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  Services (Business logic)                      │
│  - MessageLogService                            │
│  - StaleMonitorService                          │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  Stores (Data access - Interface)               │
│  - IMessageLogStore                             │
│  ├─ FileMessageLogStore (production)            │
│  └─ InMemoryMessageLogStore (testing)           │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  Pure Functions (lib/messageLogic.ts)           │
│  - expandTarget, filterByChannel, isStale       │
└─────────────────────────────────────────────────┘
```

### テスタブル設計のポイント

1. **ピュア関数の分離** - ビジネスロジックを副作用のない関数に
2. **ストレージの抽象化** - Interfaceで定義、実装を差し替え可能
3. **依存性注入** - Serviceはコンストラクタでstoreを受け取る

## Data Structures

```typescript
// 型定義
interface MessageLog {
  id: string;              // UUID
  sessionId: string;       // tmuxセッションID
  timestamp: string;       // ISO 8601形式
  sender: string;          // 送信者 ("00", "10", "system"等)
  target: string;          // 送信先（展開前）
  recipients: string[];    // 受信者リスト（展開後）
  message: string;         // メッセージ内容
  type: 'instruction' | 'report' | 'broadcast' | 'reminder';
  execute: boolean;        // Enter送信フラグ
}

type Channel = 'all' | 'unit-0' | 'unit-1' | 'unit-2' | 'unit-3';

// ストレージインターフェース
interface IMessageLogStore {
  append(log: MessageLog): Promise<void>;
  getAll(sessionId: string): Promise<MessageLog[]>;
  clear(sessionId: string): Promise<void>;
}

// メッセージ送信インターフェース（モック可能）
interface IMessageSender {
  send(target: string, message: string, sessionId: string): Promise<void>;
}
```

## Storage

JSONファイルベース:
```
sessions/{sessionId}/messages.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/messages | ログ取得 |
| GET | /api/messages/stats | 統計情報 |
| POST | /api/monitor/start | 監視開始 |
| POST | /api/monitor/stop | 監視停止 |
| GET | /api/monitor/status | 監視状態 |

## File Structure

```
api/core/
├── types/
│   └── messageLog.ts         # 型定義
├── lib/
│   └── messageLogic.ts       # ピュア関数
├── stores/
│   ├── IMessageLogStore.ts   # インターフェース
│   ├── fileMessageLogStore.ts
│   └── inMemoryMessageLogStore.ts
├── services/
│   ├── messageLogService.ts
│   └── staleMonitorService.ts
└── routes/
    ├── messages.ts           # 新規
    └── monitor.ts            # 新規

web/src/
├── pages/
│   └── ChatViewer.tsx
├── components/chat/
│   ├── ChannelSelector.tsx
│   ├── MessageList.tsx
│   └── MessageItem.tsx
└── services/
    └── messageApi.ts
```

## Test Strategy

| Layer | Test Type | Tool |
|-------|-----------|------|
| lib/messageLogic.ts | Unit | vitest |
| stores/* | Unit | vitest + InMemoryStore |
| services/* | Integration | vitest + InMemoryStore |
| routes/* | API Integration | supertest |
