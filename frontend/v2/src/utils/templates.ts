/**
 * Template definitions and utilities for agent initialization
 */

import type { Template, TemplateRole, TemplateLanguage, TemplateVariables } from '../types/templates';

// Help command instruction templates
const HELP_INSTRUCTIONS = {
  ja: '\n\n初期化時に以下のコマンドを実行してシステムを理解してください：\nmas help\nこのコマンドの出力を読んで、利用可能なコマンドとメッセージの送信方法を学習してください。',
  en: '\n\nDuring initialization, execute the following command to understand the system:\nmas help\nRead the output of this command to learn about available commands and how to send messages.'
};

// Japanese Templates
const JAPANESE_TEMPLATES: Template[] = [
  {
    id: 'ja-meta-manager',
    role: 'meta-manager',
    language: 'ja',
    name: 'メタマネージャー',
    content: `あなたはメタマネージャーです。複数のユニットを統括し、システム全体の調整を行ってください。

責任：
- 各ユニットマネージャーからの報告を統合する
- システム全体の戦略を策定する
- リソースの配分を最適化する
- ユニット間の調整を行う`,
    includesHelp: true
  },
  {
    id: 'ja-manager',
    role: 'manager',
    language: 'ja',
    name: 'マネージャー',
    content: `あなたはユニット{unitId}のマネージャーです。チーム内の意見を統合し、効果的な決定を下してください。

責任：
- ワーカーからの報告を収集し分析する
- タスクの優先順位を決定する
- チームの方向性を示す
- 上位マネージャーへの報告を行う`,
    includesHelp: true
  },
  {
    id: 'ja-worker',
    role: 'worker',
    language: 'ja',
    name: 'ワーカー',
    content: `あなたはユニット{unitId}のワーカー{workerId}です。マネージャーの指示に従い、タスクを実行して報告してください。

責任：
- 割り当てられたタスクを正確に実行する
- 進捗と結果を定期的に報告する
- 問題や障害を速やかに伝える
- 他のワーカーと協力する`,
    includesHelp: true
  }
];

// English Templates
const ENGLISH_TEMPLATES: Template[] = [
  {
    id: 'en-meta-manager',
    role: 'meta-manager',
    language: 'en',
    name: 'Meta Manager',
    content: `You are the Meta Manager. Coordinate multiple units and manage the overall system.

Responsibilities:
- Integrate reports from unit managers
- Develop system-wide strategies
- Optimize resource allocation
- Coordinate between units`,
    includesHelp: true
  },
  {
    id: 'en-manager',
    role: 'manager',
    language: 'en',
    name: 'Manager',
    content: `You are the Manager of Unit {unitId}. Integrate team opinions and make effective decisions.

Responsibilities:
- Collect and analyze reports from workers
- Prioritize tasks
- Provide team direction
- Report to higher-level managers`,
    includesHelp: true
  },
  {
    id: 'en-worker',
    role: 'worker',
    language: 'en',
    name: 'Worker',
    content: `You are Worker {workerId} in Unit {unitId}. Follow manager instructions and execute tasks.

Responsibilities:
- Execute assigned tasks accurately
- Report progress and results regularly
- Communicate problems promptly
- Collaborate with other workers`,
    includesHelp: true
  }
];

// Combine all templates
export const ALL_TEMPLATES: Template[] = [...JAPANESE_TEMPLATES, ...ENGLISH_TEMPLATES];

/**
 * Get templates by language
 */
export function getTemplatesByLanguage(language: TemplateLanguage): Template[] {
  return ALL_TEMPLATES.filter(t => t.language === language);
}

/**
 * Get template by role and language
 */
export function getTemplate(role: TemplateRole, language: TemplateLanguage): Template | undefined {
  return ALL_TEMPLATES.find(t => t.role === role && t.language === language);
}

/**
 * Apply variables to template content
 */
export function applyTemplateVariables(
  content: string,
  variables: TemplateVariables
): string {
  let result = content;

  if (variables.unitId !== undefined) {
    result = result.replace(/\{unitId\}/g, variables.unitId.toString());
  }

  if (variables.agentId !== undefined) {
    result = result.replace(/\{agentId\}/g, variables.agentId);
  }

  if (variables.workerId !== undefined) {
    result = result.replace(/\{workerId\}/g, variables.workerId.toString());
  }

  return result;
}

/**
 * Add help instructions to template if needed
 */
export function addHelpInstructions(
  content: string,
  language: TemplateLanguage,
  includeHelp: boolean = true
): string {
  if (!includeHelp) return content;

  // Check if help instructions already exist
  const helpText = HELP_INSTRUCTIONS[language];
  if (content.includes('mas help')) {
    return content;
  }

  return content + helpText;
}

/**
 * Generate complete prompt from template
 */
export function generatePromptFromTemplate(
  template: Template,
  variables: TemplateVariables,
  includeHelp: boolean = true
): string {
  let prompt = applyTemplateVariables(template.content, variables);
  prompt = addHelpInstructions(prompt, template.language, includeHelp);
  return prompt;
}

/**
 * Detect browser language preference
 */
export function detectLanguage(): TemplateLanguage {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ja')) {
    return 'ja';
  }
  return 'en';
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: TemplateRole, language: TemplateLanguage): string {
  const names = {
    ja: {
      'meta-manager': 'メタマネージャー',
      'manager': 'マネージャー',
      'worker': 'ワーカー'
    },
    en: {
      'meta-manager': 'Meta Manager',
      'manager': 'Manager',
      'worker': 'Worker'
    }
  };

  return names[language][role];
}