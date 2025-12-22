/**
 * Template system type definitions for agent initialization
 */

export type TemplateRole = 'meta-manager' | 'manager' | 'worker';
export type TemplateLanguage = 'ja' | 'en';

export interface TemplateVariables {
  unitId?: number;
  agentId?: string;
  workerId?: number;
  helpCommand?: string;
}

export interface Template {
  id: string;
  role: TemplateRole;
  language: TemplateLanguage;
  name: string;
  content: string;
  includesHelp: boolean;
}

export interface TemplateConfig {
  templates: Template[];
  customTemplates?: Map<string, string>;
  defaultLanguage: TemplateLanguage;
  includeHelpByDefault: boolean;
}

export interface StoredTemplates {
  customTemplates: Record<string, string>;
  preferences: {
    defaultLanguage: TemplateLanguage;
    includeHelpByDefault: boolean;
    lastUsedTemplates: Record<string, string>;
  };
  version: string;
}