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
  // プロジェクトルートの unit ディレクトリを参照
  const unitPath = path.join(process.cwd(), '..', 'unit', agentId, 'openspec');

  try {
    const files = await listFiles(unitPath);
    console.log(`[DEBUG] Reading from: ${unitPath}`);
    console.log(`[DEBUG] Files found:`, JSON.stringify(files, null, 2));
    return c.json({
      agentId,
      path: `unit/${agentId}/openspec/`,
      files
    });
  } catch (error) {
    console.error(`[ERROR] Failed to read documents from ${unitPath}:`, error);
    return c.json({ error: 'Failed to read documents' }, 404);
  }
});

// 特定のドキュメントを取得
app.get('/agent/:agentId/file/*', async (c) => {
  const agentId = c.req.param('agentId');
  // /docs プレフィックスも考慮
  const fullPath = c.req.path;
  const filePath = fullPath.replace(`/docs/agent/${agentId}/file/`, '').replace(`/agent/${agentId}/file/`, '');

  console.log(`[DEBUG] fullPath: ${fullPath}, filePath: ${filePath}`);

  // パストラバーサル保護
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
    return c.json({ error: 'Invalid file path' }, 400);
  }

  // プロジェクトルートの unit ディレクトリを参照
  const fullFilePath = path.join(process.cwd(), '..', 'unit', agentId, 'openspec', filePath);

  try {
    const content = await fs.readFile(fullFilePath, 'utf-8');
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
    console.error(`[ERROR] listFiles failed for ${dir}:`, error);
    return [];
  }

  return items;
}

export default app;