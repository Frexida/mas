# Tasks: Add Agent Message Logging and Monitoring

## 1. Message Logging Core
- [x] 1.1 Create `MessageLog` interface in `api/core/types/messageLog.ts`
- [x] 1.2 Create message log storage service in `api/core/services/messageLogService.ts`
  - appendLog(log): メッセージ追加
  - getLogs(sessionId, options): ログ取得（フィルタ、ページネーション付き）
  - getLogsByChannel(sessionId, channel): チャンネルフィルタ
- [x] 1.3 Update `api/core/routes/message.ts` to log messages on send
- [x] 1.4 Add unit tests for messageLogService

## 2. Message Logs API
- [x] 2.1 Create `api/core/routes/messages.ts` for log retrieval
  - GET /api/messages?sessionId=&channel=&limit=&before=
- [x] 2.2 Add message statistics endpoint
  - GET /api/messages/stats?sessionId=
- [x] 2.3 Register routes in main app
- [x] 2.4 Add API integration tests

## 3. Chat Viewer UI
- [x] 3.1 Create `web/src/pages/ChatViewer.tsx` page component
- [x] 3.2 Create `web/src/components/chat/ChannelSelector.tsx`
  - all, unit-0, unit-1, unit-2, unit-3 チャンネル選択
- [x] 3.3 Create `web/src/components/chat/MessageList.tsx`
  - メッセージ一覧表示（送信者アバター、タイムスタンプ、内容）
- [x] 3.4 Create `web/src/components/chat/MessageItem.tsx`
  - 個別メッセージの表示コンポーネント
- [x] 3.5 Create `web/src/services/messageApi.ts`
  - API呼び出しサービス
- [x] 3.6 Add `/chat` route to `web/src/App.tsx`
- [x] 3.7 Add Chat link to Header navigation

## 4. Stale Message Monitor
- [x] 4.1 Create `api/core/services/staleMonitorService.ts`
  - checkStaleMessages(logs): 停滞チェック
  - sendReminder(sessionId, target, type): 催促送信
- [x] 4.2 Create monitoring scheduler in `api/core/services/monitorScheduler.ts`
  - 30秒間隔でアクティブセッションをチェック
- [x] 4.3 Add monitor enable/disable API endpoint
  - POST /api/monitor/start?sessionId=
  - POST /api/monitor/stop?sessionId=
- [x] 4.4 Add monitoring status to session info
- [x] 4.5 Add unit tests for stale detection logic
- [x] 4.6 Add integration tests for reminder sending

## 5. UI Integration
- [x] 5.1 Add monitor toggle to session page
- [x] 5.2 Add reminder indicator in chat view (system messages highlighted)
- [ ] 5.3 Add stale warning badge to agents with pending reminders (deferred - optional enhancement)

## 6. Documentation & Cleanup
- [ ] 6.1 Update API documentation
- [ ] 6.2 Add usage examples to README
