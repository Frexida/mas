# Change: MAS (Multi-Agent System) APIのOpenAPI仕様書を追加

## Why
複数体のAIエージェントを並列で動作させるMASシステムのHTTP APIインターフェースを定義し、WebUIからエージェント構成を送信してシステムを起動できるようにする必要があります。

## What Changes
- MAS実行API（/runs）のOpenAPI仕様書を新規追加
- エージェント構成（metaManager、units、workers）のスキーマ定義を追加
- セッション管理とレスポンス構造を定義
- 既存の/message APIとの統合可能な設計

## Impact
- Affected specs: mas-api（新規追加）
- Affected code:
  - http_server.js（APIエンドポイント実装）
  - mas-run.sh（tmuxセッション起動）
  - openapi.yaml（仕様書の拡張）