# Build Configuration Notes

## UI Consistency Fix (2025-12-21)

### Problem
UIレイアウトがローカル開発環境とCloudflare Pages本番環境で異なって表示される問題を修正しました。

**観測された差分:**
- ローカル: フルワイドレイアウト、セッション一覧が横並び
- Cloudflare Pages: 左寄せレイアウト、右側に余白、セッション一覧が縦積み

### Root Cause
Tailwind CSS v4を使用していましたが、明示的な設定ファイルがなく、開発環境と本番環境でデフォルト動作が異なっていました。

### Solution Implemented

1. **PostCSS設定** (`postcss.config.js`)
   - Tailwind v4用の`@tailwindcss/postcss`プラグインを設定
   - Autoprefixerを追加

2. **Vite設定更新** (`vite.config.ts`)
   - CSS処理オプションを明示的に設定
   - `cssMinify: true` - CSS圧縮を有効化
   - `cssCodeSplit: false` - CSS分割を無効化して一貫性を確保

3. **カスタムユーティリティクラス** (`src/index.css`)
   - `.layout-full-width` - 幅100%を保証
   - `.session-list-row` - セッション一覧の横並びレイアウト

4. **コンポーネント更新**
   - `App.tsx`: メインコンテナに`w-full layout-full-width`を追加
   - `SessionSelector.tsx`:
     - コンテナに`layout-full-width`を追加
     - セッション一覧に`session-list-row`と複数ブレークポイント対応

### Build Commands

```bash
# Development
npm run dev              # http://localhost:5173

# Production build
npm run build

# Preview production build locally
npm run preview          # http://localhost:4173

# Deploy to Cloudflare Pages
npm run deploy:cloudflare
```

### Testing Checklist
- [x] Dev server shows full-width layout
- [x] Production preview shows full-width layout
- [ ] Cloudflare Pages preview shows full-width layout
- [x] Session list displays in grid (2-4 columns based on screen size)
- [x] CSS utilities are preserved in production build

### Bundle Size Impact
- CSS: ~6.2KB (gzipped: 1.72KB)
- Minimal impact from additional utilities

### Notes for Future Development
- Tailwind v4では`@tailwindcss/postcss`プラグインが必要
- 明示的な設定ファイルなしでも動作するが、環境差分を防ぐため設定推奨
- カスタムユーティリティクラスで重要なレイアウトを保護