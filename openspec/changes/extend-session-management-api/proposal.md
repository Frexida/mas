# Extend Session Management API

## Summary
UIチームのセッション選択機能実装に対応するため、既存のMAS APIにセッション管理エンドポイントを追加する。これにより、UIからtmuxセッション一覧の取得、詳細情報の取得、既存セッションへの接続が可能になる。

## Problem
現在のMAS APIは新規セッション作成（`POST /runs`）とステータス確認（`GET /status`）のみをサポートしており、UIチームが実装した以下の機能に対応できない：
- 既存tmuxセッション一覧の取得
- 特定セッション詳細の取得
- 既存セッションへの接続/再利用

これにより、ユーザーは毎回新しいセッションを作成する必要があり、既存セッションを再利用できない。

## Solution
OpenAPI仕様を拡張し、以下の新規エンドポイントを追加する：

1. **GET /sessions** - 全tmuxセッション一覧を取得
2. **GET /sessions/:sessionId** - 特定セッションの詳細情報を取得
3. **POST /sessions/:sessionId/connect** - 既存セッションへ接続

これらのエンドポイントは既存の`/status`エンドポイントを拡張・改良したものとなり、より包括的なセッション管理を可能にする。

## Outcomes
- UIからtmuxセッション一覧を表示し、選択可能になる
- 既存セッションの再利用により、リソース効率が向上
- セッション管理のユーザビリティが大幅に改善
- 複数セッション間の切り替えが容易になる

## Scope
- OpenAPI仕様の更新（openapi.yaml）
- Hono APIサーバーへの新規ルート追加（/api/routes/sessions.ts）
- バリデーションスキーマの追加（/api/validators/sessions.ts）
- tmuxコマンドラッパーの拡張（セッション一覧取得機能）
- 既存の`/status`エンドポイントとの整合性確保

## Constraints
- 既存の`/runs`と`/message`エンドポイントとの後方互換性を維持
- tmuxセッション名の形式（mas-*）に依存
- セッションIDはUUID形式を維持
- HTTPステータスコードはREST標準に準拠