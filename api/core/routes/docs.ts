import { Hono } from 'hono';
import { promises as fs } from 'fs';
import path from 'path';
import { templateManager } from '../templates/manager.js';

const app = new Hono();

// ユニット構造を取得（動的にテンプレートから生成）
app.get('/structure', async (c) => {
  const units = await templateManager.buildUnitsStructure();
  return c.json(units);
});

// エージェントのドキュメント一覧を取得
app.get('/agent/:agentId', async (c) => {
  const agentId = c.req.param('agentId');
  const sessionId = c.req.query('sessionId');

  // セッションIDがある場合はセッション固有のパスを使用
  let unitPath;
  if (sessionId) {
    // Fix: Use the parent directory of the API (which is the MAS project root)
    const workspaceRoot = process.env.MAS_WORKSPACE_ROOT || path.join(process.cwd(), '..');
    // OpenSpecの成果物はエージェントのルートディレクトリに生成されるため、openspecディレクトリではなく親ディレクトリを参照
    unitPath = path.join(workspaceRoot, 'sessions', sessionId, 'unit', agentId);
    console.log('[DEBUG] Session docs path:', {
      sessionId,
      workspaceRoot,
      cwd: process.cwd(),
      unitPath,
      exists: await fs.access(unitPath).then(() => true).catch(() => false)
    });
  } else {
    // 後方互換性のため、sessionIdなしの場合は従来のパス
    unitPath = path.join(process.cwd(), 'unit', agentId);
  }

  try {
    const files = await listFiles(unitPath);
    return c.json({
      agentId,
      path: `unit/${agentId}/`,
      files
    });
  } catch (error) {
    return c.json({ error: 'Failed to read documents' }, 404);
  }
});

// 特定のドキュメントを取得
app.get('/agent/:agentId/file/*', async (c) => {
  const agentId = c.req.param('agentId');
  const sessionId = c.req.query('sessionId');

  // Honoでワイルドカードパラメータを取得する正しい方法
  // URLからagentId/fileの部分を除去してファイルパスを取得
  const url = c.req.url;
  const match = url.match(/\/agent\/[^\/]+\/file\/([^?]+)/);
  const filePath = match ? match[1] : undefined;

  console.log('[DEBUG] File request:', {
    agentId,
    filePath,
    sessionId,
    url: c.req.url,
    params: c.req.param(),
    match
  });

  // filePathが取得できない場合の処理
  if (!filePath) {
    console.error('[ERROR] filePath is undefined');
    return c.json({ error: 'File path is required' }, 400);
  }

  // パストラバーサル保護
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
    return c.json({ error: 'Invalid file path' }, 400);
  }

  // セッションIDがある場合はセッション固有のパスを使用
  let fullPath;
  if (sessionId) {
    // Fix: Use the parent directory of the API (which is the MAS project root)
    const workspaceRoot = process.env.MAS_WORKSPACE_ROOT || path.join(process.cwd(), '..');
    // OpenSpecの成果物はエージェントのルートディレクトリに生成されるため、openspecディレクトリではなく親ディレクトリを参照
    fullPath = path.join(workspaceRoot, 'sessions', sessionId, 'unit', agentId, filePath);
  } else {
    // 後方互換性のため、sessionIdなしの場合は従来のパス
    fullPath = path.join(process.cwd(), 'unit', agentId, filePath);
  }

  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return c.json({
      agentId,
      path: filePath,
      content
    });
  } catch (error) {
    return c.json({ error: 'File not found' }, 404);
  }
});

// ディレクトリを再帰的に読み取る
async function listFiles(dir: string, basePath: string = ''): Promise<any> {
  const items = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        const children = await listFiles(path.join(dir, entry.name), relativePath);
        items.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
          children
        });
      } else if (entry.name.endsWith('.md')) {
        items.push({
          name: entry.name,
          type: 'file',
          path: relativePath
        });
      }
    }
  } catch (error) {
    // ディレクトリが存在しない場合は空配列を返す
    return [];
  }

  return items;
}

export default app;