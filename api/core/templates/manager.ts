/**
 * Template Manager Module
 * Manages agent templates for MAS system
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface AgentTemplate {
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

export interface TemplateIndex {
  version: string;
  templates: Array<{
    id: string;
    agentId: string;
    name: string;
    nameJa: string;
    category: string;
    unit: string;
    path: string;
  }>;
}

class TemplateManager {
  private templatesRoot: string;
  private indexCache: TemplateIndex | null = null;
  private templateCache: Map<string, AgentTemplate> = new Map();

  constructor(templatesRoot?: string) {
    // Use environment variable or default path
    this.templatesRoot = templatesRoot ||
      process.env.MAS_TEMPLATES_ROOT ||
      path.join(process.cwd(), '..', 'templates');
  }

  /**
   * Load template index
   */
  async loadIndex(): Promise<TemplateIndex> {
    if (this.indexCache) {
      return this.indexCache;
    }

    const indexPath = path.join(this.templatesRoot, 'index.json');
    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      this.indexCache = JSON.parse(content);
      return this.indexCache!;
    } catch (error) {
      console.error('Failed to load template index:', error);
      // Return empty index if file doesn't exist
      return {
        version: '1.0.0',
        templates: []
      };
    }
  }

  /**
   * List all available templates
   */
  async listTemplates(): Promise<TemplateIndex['templates']> {
    const index = await this.loadIndex();
    return index.templates;
  }

  /**
   * Get templates grouped by unit
   */
  async getTemplatesByUnit(): Promise<Record<string, TemplateIndex['templates']>> {
    const templates = await this.listTemplates();
    const grouped: Record<string, TemplateIndex['templates']> = {};

    for (const template of templates) {
      if (!grouped[template.unit]) {
        grouped[template.unit] = [];
      }
      grouped[template.unit].push(template);
    }

    return grouped;
  }

  /**
   * Load a specific template by agent ID
   */
  async loadTemplate(agentId: string): Promise<AgentTemplate | null> {
    // Check cache first
    if (this.templateCache.has(agentId)) {
      return this.templateCache.get(agentId)!;
    }

    const index = await this.loadIndex();
    const templateInfo = index.templates.find(t => t.agentId === agentId);

    if (!templateInfo) {
      console.warn(`Template not found for agent ${agentId}`);
      return null;
    }

    const templatePath = path.join(this.templatesRoot, templateInfo.path);
    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      const template = JSON.parse(content) as AgentTemplate;

      // Cache the template
      this.templateCache.set(agentId, template);

      return template;
    } catch (error) {
      console.error(`Failed to load template for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Load a template by template ID
   */
  async loadTemplateById(templateId: string): Promise<AgentTemplate | null> {
    const index = await this.loadIndex();
    const templateInfo = index.templates.find(t => t.id === templateId);

    if (!templateInfo) {
      console.warn(`Template not found: ${templateId}`);
      return null;
    }

    return this.loadTemplate(templateInfo.agentId);
  }

  /**
   * Get template content (prompt) for an agent
   */
  async getTemplateContent(agentId: string, language: 'ja' | 'en' = 'ja'): Promise<string | null> {
    const template = await this.loadTemplate(agentId);

    if (!template) {
      return null;
    }

    // Return the prompt in the requested language, fallback to Japanese
    return template.prompt[language] || template.prompt.ja;
  }

  /**
   * Build dynamic UNITS structure from templates (replaces hardcoded UNITS in docs.ts)
   */
  async buildUnitsStructure(): Promise<Record<string, any>> {
    const templates = await this.listTemplates();
    const units: Record<string, any> = {};

    // Initialize units
    units['meta'] = {
      name: 'Meta Management',
      agents: []
    };
    units['design'] = {
      name: 'Design Unit',
      agents: []
    };
    units['development'] = {
      name: 'Development Unit',
      agents: []
    };
    units['business'] = {
      name: 'Business Unit',
      agents: []
    };

    // Populate agents from templates
    for (const template of templates) {
      const agent = {
        id: template.agentId,
        name: template.name
      };

      if (units[template.unit]) {
        units[template.unit].agents.push(agent);
      }
    }

    // Sort agents by ID within each unit
    for (const unit of Object.values(units)) {
      unit.agents.sort((a: any, b: any) => a.id.localeCompare(b.id));
    }

    return units;
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.indexCache = null;
    this.templateCache.clear();
  }

  /**
   * Save a custom template (for future extension)
   */
  async saveCustomTemplate(template: AgentTemplate, userId?: string): Promise<void> {
    const customDir = userId
      ? path.join(this.templatesRoot, 'custom', userId)
      : path.join(this.templatesRoot, 'custom');

    await fs.mkdir(customDir, { recursive: true });

    const templatePath = path.join(customDir, `${template.id}.json`);
    await fs.writeFile(templatePath, JSON.stringify(template, null, 2), 'utf-8');

    // Clear cache to force reload
    this.clearCache();
  }

  /**
   * Check if a template exists
   */
  async templateExists(agentId: string): Promise<boolean> {
    const template = await this.loadTemplate(agentId);
    return template !== null;
  }

  /**
   * Get template metadata without loading full content
   */
  async getTemplateMetadata(agentId: string): Promise<{
    name: string;
    nameJa: string;
    category: string;
    unit: string;
  } | null> {
    const index = await this.loadIndex();
    const templateInfo = index.templates.find(t => t.agentId === agentId);

    if (!templateInfo) {
      return null;
    }

    return {
      name: templateInfo.name,
      nameJa: templateInfo.nameJa,
      category: templateInfo.category,
      unit: templateInfo.unit
    };
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();

// Export class for testing or custom instances
export { TemplateManager };