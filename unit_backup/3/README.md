# Unit 3 - Accounting Worker

## 概要
このディレクトリは mas-tmux システムの Unit 3 として、Accounting Workerの役割を担当します。

## 役割
### Accounting Worker (会計ワーカー)
- コスト効率性の観点からの提案
- リソース配分の最適化
- ROIと投資対効果の評価

**使用モデル**: Claude Sonnet

## 使用方法
```bash
# このディレクトリに移動
cd unit/3

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
