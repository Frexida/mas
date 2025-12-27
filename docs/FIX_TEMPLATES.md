# 修正テンプレート集

## Issue #7: Session Restore Fix

### 修正ファイル: `api/routes/sessions.ts`

```typescript
// Line 142付近を修正
sessionsRoute.post('/:sessionId/restore', async (c) => {
  const { sessionId } = c.req.param();

  try {
    // セッション状態の確認
    const sessionPath = path.join(SESSION_DIR, sessionId, 'session.json');
    if (!fs.existsSync(sessionPath)) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));

    // terminatedとstoppedの両方を許可
    if (sessionData.status !== 'terminated' && sessionData.status !== 'stopped') {
      return c.json({
        error: `Cannot restore session in ${sessionData.status} state. Session must be terminated or stopped.`
      }, 400);
    }

    // 復元処理
    sessionData.status = 'idle';
    sessionData.restoredAt = new Date().toISOString();
    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));

    return c.json({ success: true, session: sessionData });
  } catch (error) {
    return c.json({ error: 'Failed to restore session' }, 500);
  }
});
```

## Issue #8: App Rename

### 一括置換スクリプト

```bash
#!/bin/bash
# refactor-app-rename.sh

echo "Renaming mas-ui-app to mas..."

# package.json files
find . -name "package.json" -type f -exec sed -i 's/"mas-ui-app"/"mas"/g' {} +

# TypeScript/JavaScript files
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  xargs grep -l "mas-ui-app" | \
  xargs sed -i 's/mas-ui-app/mas/g'

# Documentation files
find . -name "*.md" | xargs grep -l "mas-ui-app" | \
  xargs sed -i 's/mas-ui-app/mas/g'

echo "Rename complete!"
```

## Issue #9: Docs Viewer Fix

### 修正ファイル1: `api/routes/docs.ts`

```typescript
import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';

const docsRoute = new Hono();

// ドキュメント構造を返すエンドポイント
docsRoute.get('/structure', (c) => {
  try {
    const docsDir = path.join(process.cwd(), 'docs');
    const files = fs.readdirSync(docsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        name: file.replace('.md', ''),
        path: `/docs/${file}`,
        title: file.replace('.md', '').replace(/_/g, ' ')
      }));

    // 必ず JSON を返す
    c.header('Content-Type', 'application/json');
    return c.json({
      success: true,
      sections: files
    });
  } catch (error) {
    c.header('Content-Type', 'application/json');
    return c.json({
      success: false,
      error: 'Failed to load documentation structure'
    }, 500);
  }
});

// ドキュメント内容を返すエンドポイント
docsRoute.get('/:docName', (c) => {
  const { docName } = c.req.param();
  try {
    const docPath = path.join(process.cwd(), 'docs', `${docName}.md`);
    if (!fs.existsSync(docPath)) {
      return c.json({ error: 'Document not found' }, 404);
    }

    const content = fs.readFileSync(docPath, 'utf-8');
    c.header('Content-Type', 'application/json');
    return c.json({
      success: true,
      title: docName.replace(/_/g, ' '),
      content
    });
  } catch (error) {
    return c.json({ error: 'Failed to load document' }, 500);
  }
});

export default docsRoute;
```

### 修正ファイル2: `web/src/components/DocumentViewer.tsx`

```typescript
useEffect(() => {
  const fetchStructure = async () => {
    try {
      const response = await fetch(`${API_BASE}/docs/structure`);

      // Content-Type チェック
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.sections) {
        setSections(data.sections);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch document structure:', error);
      setError(error.message);
    }
  };

  fetchStructure();
}, []);
```

## Issue #10: UI Consistency Fix

### 修正ファイル1: `web/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    // CSS分割を無効化して一貫性を保つ
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '5173'),
    host: '0.0.0.0'
  }
});
```

### 修正ファイル2: `web/tailwind.config.js`

```javascript
module.exports = {
  // content設定を統一（重要！）
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // カスタムクラスを確実に含める
      container: {
        center: true,
        padding: '1rem',
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px'
        }
      }
    },
  },
  plugins: [],
  // 本番でもクラスを削除しない設定
  safelist: [
    'container',
    'mx-auto',
    'max-w-7xl',
    'w-full'
  ]
};
```

## Git Commands for Each Issue

```bash
# Issue #7 - Session Restore
cd ../mas-worktrees/fix-session-restore
git add api/routes/sessions.ts
git commit -m "fix: allow restoring terminated and stopped sessions

- Modified session restore endpoint to accept both states
- Improved error messages for invalid states
- Added restoredAt timestamp

Fixes #7"

# Issue #8 - App Rename
cd ../mas-worktrees/refactor-app-rename
git add .
git commit -m "refactor: rename app from mas-ui-app to mas

- Updated all package.json files
- Replaced references in source code
- Updated documentation

Fixes #8"

# Issue #9 - Docs Viewer
cd ../mas-worktrees/fix-docs-viewer
git add api/routes/docs.ts web/src/components/DocumentViewer.tsx
git commit -m "fix: resolve document viewer JSON parse errors

- Ensure API returns JSON with correct Content-Type
- Add proper error handling in frontend
- Fix empty content display issue

Fixes #9"

# Issue #10 - UI Consistency
cd ../mas-worktrees/fix-ui-consistency
git add web/vite.config.ts web/tailwind.config.js
git commit -m "fix: unify UI between local and production builds

- Disable CSS code splitting for consistency
- Add safelist for critical Tailwind classes
- Standardize build output structure

Fixes #10"
```