import React, { useState, useEffect } from 'react';
import type { Template, TemplateRole, TemplateLanguage } from '../types/templates';
import {
  getTemplate,
  detectLanguage,
  getRoleDisplayName
} from '../utils/templates';
import { getTemplatePreferences } from '../services/templateStorage';
import TemplatePreview from './TemplatePreview';

interface TemplateSelectorProps {
  role: TemplateRole;
  onTemplateSelect: (template: Template) => void;
  currentPrompt?: string;
  agentId?: string; // Currently unused but kept for future use
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  role,
  onTemplateSelect,
  currentPrompt
}) => {
  const [language, setLanguage] = useState<TemplateLanguage>('ja');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Load user preferences
    const preferences = getTemplatePreferences();
    setLanguage(preferences.defaultLanguage || detectLanguage());
  }, []);

  useEffect(() => {
    // Update selected template when language or role changes
    const template = getTemplate(role, language);
    setSelectedTemplate(template || null);
  }, [role, language]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as TemplateLanguage;
    setLanguage(newLang);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const hasContent = currentPrompt && currentPrompt.trim().length > 0;

  return (
    <div className="template-selector">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          テンプレート:
        </label>

        <select
          value={language}
          onChange={handleLanguageChange}
          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600
                   rounded-md focus:ring-blue-500 focus:border-blue-500
                   dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="ja">日本語</option>
          <option value="en">English</option>
        </select>

        {selectedTemplate && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getRoleDisplayName(role, language)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUseTemplate}
          disabled={!selectedTemplate}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md
                   hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-colors duration-200"
        >
          {hasContent ? 'テンプレートで置換' : 'テンプレートを使用'}
        </button>

        {selectedTemplate && (
          <button
            type="button"
            onClick={handlePreview}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md
                     hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300
                     dark:hover:bg-gray-600 transition-colors duration-200"
          >
            プレビュー
          </button>
        )}

        {hasContent && (
          <span className="text-xs text-orange-600 dark:text-orange-400">
            ※現在の内容が置き換えられます
          </span>
        )}
      </div>

      {showPreview && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => setShowPreview(false)}
          onUse={() => {
            handleUseTemplate();
            setShowPreview(false);
          }}
        />
      )}
    </div>
  );
};

export default TemplateSelector;