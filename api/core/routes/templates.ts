/**
 * Template API Routes
 * Provides endpoints for agent template management
 */

import { Hono } from 'hono';
import { templateManager } from '../templates/manager.js';

const app = new Hono();

/**
 * GET /templates
 * List all available templates
 */
app.get('/', async (c) => {
  try {
    const templates = await templateManager.listTemplates();
    return c.json({
      templates,
      total: templates.length
    });
  } catch (error) {
    console.error('Failed to list templates:', error);
    return c.json({ error: 'Failed to list templates' }, 500);
  }
});

/**
 * GET /templates/by-unit
 * Get templates grouped by unit
 */
app.get('/by-unit', async (c) => {
  try {
    const grouped = await templateManager.getTemplatesByUnit();
    return c.json(grouped);
  } catch (error) {
    console.error('Failed to get templates by unit:', error);
    return c.json({ error: 'Failed to get templates by unit' }, 500);
  }
});

/**
 * GET /templates/agent/:agentId
 * Get template for a specific agent ID
 */
app.get('/agent/:agentId', async (c) => {
  const agentId = c.req.param('agentId');

  try {
    const template = await templateManager.loadTemplate(agentId);

    if (!template) {
      return c.json({ error: `Template not found for agent ${agentId}` }, 404);
    }

    return c.json(template);
  } catch (error) {
    console.error(`Failed to load template for agent ${agentId}:`, error);
    return c.json({ error: 'Failed to load template' }, 500);
  }
});

/**
 * GET /templates/:templateId
 * Get a specific template by template ID
 */
app.get('/:templateId', async (c) => {
  const templateId = c.req.param('templateId');

  try {
    const template = await templateManager.loadTemplateById(templateId);

    if (!template) {
      return c.json({ error: `Template not found: ${templateId}` }, 404);
    }

    return c.json(template);
  } catch (error) {
    console.error(`Failed to load template ${templateId}:`, error);
    return c.json({ error: 'Failed to load template' }, 500);
  }
});

/**
 * GET /templates/agent/:agentId/prompt
 * Get just the prompt content for an agent
 */
app.get('/agent/:agentId/prompt', async (c) => {
  const agentId = c.req.param('agentId');
  const language = (c.req.query('lang') || 'ja') as 'ja' | 'en';

  try {
    const prompt = await templateManager.getTemplateContent(agentId, language);

    if (!prompt) {
      return c.json({ error: `Prompt not found for agent ${agentId}` }, 404);
    }

    return c.json({
      agentId,
      language,
      prompt
    });
  } catch (error) {
    console.error(`Failed to get prompt for agent ${agentId}:`, error);
    return c.json({ error: 'Failed to get prompt' }, 500);
  }
});

/**
 * GET /templates/agent/:agentId/metadata
 * Get template metadata without full content
 */
app.get('/agent/:agentId/metadata', async (c) => {
  const agentId = c.req.param('agentId');

  try {
    const metadata = await templateManager.getTemplateMetadata(agentId);

    if (!metadata) {
      return c.json({ error: `Metadata not found for agent ${agentId}` }, 404);
    }

    return c.json({
      agentId,
      ...metadata
    });
  } catch (error) {
    console.error(`Failed to get metadata for agent ${agentId}:`, error);
    return c.json({ error: 'Failed to get metadata' }, 500);
  }
});

/**
 * POST /templates/custom
 * Save a custom template (for future extension)
 */
app.post('/custom', async (c) => {
  try {
    const template = await c.req.json();
    const userId = c.req.header('x-user-id'); // In production, get from auth

    // Validate template structure
    if (!template.id || !template.name || !template.agentId || !template.prompt) {
      return c.json({ error: 'Invalid template structure' }, 400);
    }

    await templateManager.saveCustomTemplate(template, userId);

    return c.json({
      message: 'Template saved successfully',
      templateId: template.id
    });
  } catch (error) {
    console.error('Failed to save custom template:', error);
    return c.json({ error: 'Failed to save template' }, 500);
  }
});

/**
 * DELETE /templates/cache
 * Clear template cache (useful for development)
 */
app.delete('/cache', (c) => {
  templateManager.clearCache();
  return c.json({ message: 'Template cache cleared' });
});

export default app;