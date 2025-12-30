#!/usr/bin/env tsx
/**
 * Convert existing workflow markdown files to JSON templates
 */

import { promises as fs } from 'fs';
import path from 'path';

interface AgentTemplate {
  id: string;
  name: string;
  nameJa: string;
  category: 'meta' | 'manager' | 'worker';
  unit: 'meta' | 'design' | 'development' | 'business';
  agentId: string;
  description: string;
  descriptionJa: string;
  prompt: {
    ja: string;
    en?: string;
  };
  workflowSource: string;
}

const AGENT_DEFINITIONS = [
  { id: '00', name: 'Meta Manager', nameJa: 'メタマネージャー', category: 'meta', unit: 'meta', file: '00_meta_manager.md' },
  { id: '10', name: 'Design Manager', nameJa: 'デザインマネージャー', category: 'manager', unit: 'design', file: '10_design_manager.md' },
  { id: '11', name: 'UI Designer', nameJa: 'UIデザイナー', category: 'worker', unit: 'design', file: '11-13_design_workers.md', section: 'Unit 11' },
  { id: '12', name: 'UX Designer', nameJa: 'UXデザイナー', category: 'worker', unit: 'design', file: '11-13_design_workers.md', section: 'Unit 12' },
  { id: '13', name: 'Visual Designer', nameJa: 'ビジュアルデザイナー', category: 'worker', unit: 'design', file: '11-13_design_workers.md', section: 'Unit 13' },
  { id: '20', name: 'Dev Manager', nameJa: '開発マネージャー', category: 'manager', unit: 'development', file: '20_dev_manager.md' },
  { id: '21', name: 'Frontend Developer', nameJa: 'フロントエンド開発者', category: 'worker', unit: 'development', file: '21-23_dev_workers.md', section: 'Unit 21' },
  { id: '22', name: 'Backend Developer', nameJa: 'バックエンド開発者', category: 'worker', unit: 'development', file: '21-23_dev_workers.md', section: 'Unit 22' },
  { id: '23', name: 'DevOps Engineer', nameJa: 'DevOpsエンジニア', category: 'worker', unit: 'development', file: '21-23_dev_workers.md', section: 'Unit 23' },
  { id: '30', name: 'Business Manager', nameJa: '経営・会計マネージャー', category: 'manager', unit: 'business', file: '30_business_manager.md' },
  { id: '31', name: 'Accounting', nameJa: '会計担当', category: 'worker', unit: 'business', file: '31-33_business_workers.md', section: 'Unit 31' },
  { id: '32', name: 'Strategy', nameJa: '戦略担当', category: 'worker', unit: 'business', file: '31-33_business_workers.md', section: 'Unit 32' },
  { id: '33', name: 'Analysis', nameJa: '分析担当', category: 'worker', unit: 'business', file: '31-33_business_workers.md', section: 'Unit 33' },
];

async function extractSection(content: string, sectionName: string): string {
  const lines = content.split('\n');
  let inSection = false;
  let sectionContent: string[] = [];
  const sectionPattern = new RegExp(`^##\\s+${sectionName}`, 'i');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (sectionPattern.test(line)) {
      inSection = true;
      continue;
    }

    if (inSection) {
      // Stop at next section of same or higher level
      if (line.match(/^##\s+Unit\s+\d+/)) {
        break;
      }
      sectionContent.push(line);
    }
  }

  return sectionContent.join('\n').trim();
}

function extractDescription(content: string): { description: string, descriptionJa: string } {
  // Extract role/description section
  const roleMatch = content.match(/###\s*あなたの役割\s*\n(.*?)(?=\n###|\n##|$)/s);
  const descriptionJa = roleMatch ? roleMatch[1].trim() : 'プロジェクトのエージェント';

  // Simple English translation (in production, use proper translation)
  const description = descriptionJa
    .replace(/専門家として/, 'as a specialist')
    .replace(/を統括します/, 'manages')
    .replace(/設計します/, 'designs')
    .replace(/構築します/, 'builds')
    .replace(/推進します/, 'promotes');

  return { description, descriptionJa };
}

function generatePrompt(agent: typeof AGENT_DEFINITIONS[0], content: string): { ja: string, en?: string } {
  const jaPrompt = `あなたはエージェント${agent.id}「${agent.nameJa}」です。

${content}

## 基本ルール
1. 常に自分の役割と責任範囲を意識して行動する
2. 指示系統に従い、適切な相手とコミュニケーションを取る
3. mas sendコマンドを使用して他のエージェントと連携する
4. 成果物は自分の作業ディレクトリに保存する
5. 定期的に進捗を報告する`;

  // For MVP, we'll only provide Japanese prompts
  // English can be added later
  return { ja: jaPrompt };
}

async function convertWorkflowToTemplate(agent: typeof AGENT_DEFINITIONS[0]): Promise<AgentTemplate> {
  const workflowPath = path.join('/home/mtdnot/dev/anag/mas/workflows', agent.file);
  const content = await fs.readFile(workflowPath, 'utf-8');

  // Extract section if specified
  const sectionContent = agent.section
    ? await extractSection(content, agent.section)
    : content;

  const { description, descriptionJa } = extractDescription(sectionContent);
  const prompt = generatePrompt(agent, sectionContent);

  return {
    id: `${agent.id}-${agent.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: agent.name,
    nameJa: agent.nameJa,
    category: agent.category as 'meta' | 'manager' | 'worker',
    unit: agent.unit as 'meta' | 'design' | 'development' | 'business',
    agentId: agent.id,
    description,
    descriptionJa,
    prompt,
    workflowSource: agent.file
  };
}

async function main() {
  console.log('Converting workflow files to JSON templates...');

  // Create templates directory
  const templatesDir = '/home/mtdnot/dev/anag/mas/templates/system/agents';
  await fs.mkdir(templatesDir, { recursive: true });

  // Convert each agent
  const templates: AgentTemplate[] = [];

  for (const agent of AGENT_DEFINITIONS) {
    console.log(`Converting ${agent.id}: ${agent.name}...`);
    try {
      const template = await convertWorkflowToTemplate(agent);
      templates.push(template);

      // Save individual template file
      const templatePath = path.join(templatesDir, `${agent.id}-${agent.name.toLowerCase().replace(/\s+/g, '-')}.json`);
      await fs.writeFile(templatePath, JSON.stringify(template, null, 2), 'utf-8');
      console.log(`  ✓ Saved ${templatePath}`);
    } catch (error) {
      console.error(`  ✗ Failed to convert ${agent.id}:`, error);
    }
  }

  // Create index file
  const indexPath = path.join('/home/mtdnot/dev/anag/mas/templates', 'index.json');
  const index = {
    version: '1.0.0',
    templates: templates.map(t => ({
      id: t.id,
      agentId: t.agentId,
      name: t.name,
      nameJa: t.nameJa,
      category: t.category,
      unit: t.unit,
      path: `system/agents/${t.id}.json`
    }))
  };
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`\n✓ Created index at ${indexPath}`);

  console.log(`\n✓ Successfully converted ${templates.length} templates`);
}

main().catch(console.error);