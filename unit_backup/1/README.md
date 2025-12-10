# Unit 1 - Development Worker

## 概要
このディレクトリは mas-tmux システムの Unit 1 として、Development Workerの役割を担当します。

## 役割
### Development Worker (開発ワーカー)
- 技術的な実装観点からの提案
- コード品質とアーキテクチャの検討
- パフォーマンスと保守性の評価

**使用モデル**: Claude Sonnet

## 使用方法
```bash
# このディレクトリに移動
cd unit/1

# Claude Codeでタスクを実行
clauded /openspec:proposal "タスクの内容"
```

## OpenSpec設定
このディレクトリはOpenSpecで管理されています。
- ツール: Claude
- 仕様とコンテキストは `.openspec/` ディレクトリに保存されます

## 関連ファイル
- `../../setup_mas_tmux.sh` - tmuxセッションのセットアップ
- `../../send_message.sh` - ペイン間のメッセージ送信
