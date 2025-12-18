/**
 * Template storage service for managing custom templates and preferences
 */

import type { StoredTemplates, TemplateLanguage } from '../types/templates';

const STORAGE_KEY = 'mas_agent_templates';
const STORAGE_VERSION = '1.0.0';

/**
 * Get stored templates from localStorage
 */
export function getStoredTemplates(): StoredTemplates | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredTemplates;

    // Version check for future migrations
    if (parsed.version !== STORAGE_VERSION) {
      // Handle migration if needed in future
      console.log('Template storage version mismatch, using defaults');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Error loading stored templates:', error);
    return null;
  }
}

/**
 * Save templates to localStorage
 */
export function saveTemplates(templates: StoredTemplates): void {
  try {
    const toStore = {
      ...templates,
      version: STORAGE_VERSION
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Error saving templates:', error);
  }
}

/**
 * Get custom template by key
 */
export function getCustomTemplate(key: string): string | undefined {
  const stored = getStoredTemplates();
  return stored?.customTemplates[key];
}

/**
 * Save custom template
 */
export function saveCustomTemplate(key: string, content: string): void {
  const stored = getStoredTemplates() || createDefaultStorage();
  stored.customTemplates[key] = content;
  saveTemplates(stored);
}

/**
 * Delete custom template
 */
export function deleteCustomTemplate(key: string): void {
  const stored = getStoredTemplates();
  if (stored && stored.customTemplates[key]) {
    delete stored.customTemplates[key];
    saveTemplates(stored);
  }
}

/**
 * Get template preferences
 */
export function getTemplatePreferences() {
  const stored = getStoredTemplates();
  return stored?.preferences || createDefaultPreferences();
}

/**
 * Update template preferences
 */
export function updateTemplatePreferences(updates: Partial<StoredTemplates['preferences']>): void {
  const stored = getStoredTemplates() || createDefaultStorage();
  stored.preferences = {
    ...stored.preferences,
    ...updates
  };
  saveTemplates(stored);
}

/**
 * Save last used template for a specific agent
 */
export function saveLastUsedTemplate(agentKey: string, templateId: string): void {
  const stored = getStoredTemplates() || createDefaultStorage();
  stored.preferences.lastUsedTemplates[agentKey] = templateId;
  saveTemplates(stored);
}

/**
 * Get last used template for a specific agent
 */
export function getLastUsedTemplate(agentKey: string): string | undefined {
  const stored = getStoredTemplates();
  return stored?.preferences.lastUsedTemplates[agentKey];
}

/**
 * Clear all stored templates
 */
export function clearStoredTemplates(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export templates for backup
 */
export function exportTemplates(): string {
  const stored = getStoredTemplates() || createDefaultStorage();
  return JSON.stringify(stored, null, 2);
}

/**
 * Import templates from backup
 */
export function importTemplates(json: string): boolean {
  try {
    const imported = JSON.parse(json) as StoredTemplates;

    // Validate structure
    if (!imported.customTemplates || !imported.preferences) {
      throw new Error('Invalid template format');
    }

    // Set current version
    imported.version = STORAGE_VERSION;

    saveTemplates(imported);
    return true;
  } catch (error) {
    console.error('Error importing templates:', error);
    return false;
  }
}

/**
 * Create default storage structure
 */
function createDefaultStorage(): StoredTemplates {
  return {
    customTemplates: {},
    preferences: createDefaultPreferences(),
    version: STORAGE_VERSION
  };
}

/**
 * Create default preferences
 */
function createDefaultPreferences(): StoredTemplates['preferences'] {
  // Detect browser language
  const browserLang = navigator.language.toLowerCase();
  const defaultLanguage: TemplateLanguage = browserLang.startsWith('ja') ? 'ja' : 'en';

  return {
    defaultLanguage,
    includeHelpByDefault: true,
    lastUsedTemplates: {}
  };
}