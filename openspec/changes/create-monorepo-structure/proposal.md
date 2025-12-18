# Create Monorepo Structure

## Summary
フロントエンドとバックエンドを統合したモノレポ構造を作成し、ワンコマンドで全システムを起動できるOSSプロジェクトとして構成する。

## Motivation
- 現在、フロントエンド（frontend branch）とバックエンド（feature/background branch）が別々の履歴で管理されている
- ユーザーが簡単にローカル環境でMASシステム全体を起動できるようにしたい
- 統一されたインストール・起動体験を提供し、OSSとしての使いやすさを向上させる

## Approach
1. npm workspacesを使用したモノレポ構造の採用
2. フロントエンドをweb/ディレクトリに配置
3. ルートpackage.jsonで統合起動スクリプトを提供
4. コンフリクト解決のための明確な命名規則とファイル配置

## Key Requirements
- `npm install && npm start`で全システムが起動
- フロントエンド、API、MASセッションが統合的に動作
- 既存のファイル構造を最大限維持
- 開発者に優しいセットアップ体験

## Risks & Mitigations
- **Risk**: unrelated historiesによるマージ困難
  - **Mitigation**: --allow-unrelated-historiesを使用し、手動でコンフリクト解決
- **Risk**: 重複ファイル（README.md, package.json等）のコンフリクト
  - **Mitigation**: 明確な優先順位ルールを定義
- **Risk**: パッケージ依存関係の競合
  - **Mitigation**: workspacesで分離管理