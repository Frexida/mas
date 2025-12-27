import { Hono } from 'hono';
import { promises as fs } from 'fs';
import path from 'path';

const app = new Hono();

// ユニット構造の定義
const UNITS = {
  'meta': {
    name: 'Meta Management',
    agents: [
      { id: '00', name: 'Meta Manager' }
    ]
  },
  'design': {
    name: 'Design Unit',
    agents: [
      { id: '10', name: 'Design Manager' },
      { id: '11', name: 'UI Designer' },
      { id: '12', name: 'UX Designer' },
      { id: '13', name: 'Visual Designer' }
    ]
  },
  'development': {
    name: 'Development Unit',
    agents: [
      { id: '20', name: 'Dev Manager' },
      { id: '21', name: 'Frontend Dev' },
      { id: '22', name: 'Backend Dev' },
      { id: '23', name: 'DevOps' }
    ]
  },
  'business': {
    name: 'Business Unit',
    agents: [
      { id: '30', name: 'Business Manager' },
      { id: '31', name: 'Accounting' },
      { id: '32', name: 'Strategy' },
      { id: '33', name: 'Analysis' }
    ]
  }
};

// ユニット構造を取得
app.get('/structure', (c) => {
  return c.json(UNITS);
});

// エージェントのドキュメント一覧を取得
app.get('/agent/:agentId', async (c) => {
  const agentId = c.req.param('agentId');
  const sessionId = c.req.query('sessionId');

  // セッションIDがある場合はセッション固有のパスを使用
  let unitPath;
  if (sessionId) {
    const workspaceRoot = process.env.MAS_WORKSPACE_ROOT || process.cwd();
    unitPath = path.join(workspaceRoot, 'sessions', sessionId, 'unit', agentId, 'openspec');
    console.log('[DEBUG] Session docs path:', {
      sessionId,
      workspaceRoot,
      unitPath,
      exists: await fs.access(unitPath).then(() => true).catch(() => false)
    });
  } else {
    // 後方互換性のため、sessionIdなしの場合は従来のパス
    unitPath = path.join(process.cwd(), 'unit', agentId, 'openspec');
  }

  try {
    const files = await listFiles(unitPath);
    return c.json({
      agentId,
      path: `unit/${agentId}/openspec/`,
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
    const workspaceRoot = process.env.MAS_WORKSPACE_ROOT || process.cwd();
    fullPath = path.join(workspaceRoot, 'sessions', sessionId, 'unit', agentId, 'openspec', filePath);
  } else {
    // 後方互換性のため、sessionIdなしの場合は従来のパス
    fullPath = path.join(process.cwd(), 'unit', agentId, 'openspec', filePath);
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