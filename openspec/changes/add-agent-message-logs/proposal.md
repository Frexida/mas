# Change: Add Agent Message Logging and Monitoring

## Why

エージェント間のコミュニケーションを可視化し、停滞を防ぐ必要がある。現状、エージェント間のメッセージは送信後に追跡できず、どのエージェントが誰に何を送ったかの履歴が残らない。また、指示や報告が滞った場合にユーザーが気づくことができず、タスクの遅延につながっている。

## What Changes

### 1. メッセージログ機能
- メッセージ送信時に送信者、受信者、タイムスタンプ、内容をログとして保存
- セッションごとにログを管理
- APIでログを取得可能にする

### 2. チャットビューワーUI
- Slack/Discord風のチャンネルベースUI
- チャンネル種別:
  - `all`: 全メッセージを時系列表示
  - `unit-0` ~ `unit-3`: ユニット内のメッセージを表示
- `/chat` ルートで既存のDocumentViewerと同様のアクセス

### 3. 停滞メッセージ監視機能
- バックエンドでポーリング監視（30秒間隔）
- 3分間メッセージがない場合にシステムから自動催促
- 催促パターン:
  - 指示が送られていない → 「タスクの割り振りを完了してください」
  - 報告がない → 「進捗を報告してください」

## Impact

- Affected specs: 新規3つ (`message-logging`, `chat-viewer`, `stale-message-monitor`)
- Affected code:
  - `api/core/routes/message.ts` - ログ保存処理追加
  - `api/core/routes/` - 新規エンドポイント追加
  - `web/src/pages/` - ChatViewer UI追加
  - `web/src/App.tsx` - ルート追加
