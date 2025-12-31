/**
 * TemplateSelector Component
 * Allows users to select and apply agent templates
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, FileText, Plus, Check } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  nameJa: string;
  category: 'meta' | 'manager' | 'worker';
  unit: 'meta' | 'design' | 'development' | 'business';
  agentId: string;
  description: string;
  descriptionJa: string;
}

interface TemplateSelectorProps {
  agentId: string;
  currentPrompt: string;
  onTemplateSelect: (prompt: string, templateId?: string) => void;
  disabled?: boolean;
  className?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  agentId,
  currentPrompt: _currentPrompt,
  onTemplateSelect,
  disabled = false,
  className = ''
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load available templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8765'}/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsDropdownOpen(false);

    if (templateId === 'custom') {
      // Clear prompt for custom input
      onTemplateSelect('', undefined);
      setPreviewContent(null);
      return;
    }

    // Find the selected template
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    try {
      // Load the full template content
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8765'}/templates/agent/${template.agentId}/prompt?lang=ja`
      );

      if (response.ok) {
        const data = await response.json();
        onTemplateSelect(data.prompt, templateId);
        setPreviewContent(data.prompt);
      }
    } catch (error) {
      console.error('Failed to load template prompt:', error);
    }
  };

  const togglePreview = () => {
    if (previewContent) {
      setShowPreview(!showPreview);
    }
  };

  // Find template for current agent
  const agentTemplates = templates.filter(t => t.agentId === agentId);
  const recommendedTemplate = agentTemplates.length > 0 ? agentTemplates[0] : null;

  // Get current selection display text
  const getSelectionText = () => {
    if (selectedTemplate === 'custom') {
      return 'カスタム（直接入力）';
    }
    const template = templates.find(t => t.id === selectedTemplate);
    return template ? `${template.nameJa} (${template.name})` : '選択してください';
  };

  return (
    <div className={`template-selector ${className}`}>
      {/* Template Selection Dropdown */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          テンプレート選択
        </label>

        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled || loading}
          className={`w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>{getSelectionText()}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
            <div className="py-1">
              {/* Custom Option */}
              <button
                onClick={() => handleTemplateSelect('custom')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-gray-500" />
                  <span>カスタム（直接入力）</span>
                </div>
                {selectedTemplate === 'custom' && <Check className="w-4 h-4 text-blue-600" />}
              </button>

              {/* Separator */}
              {templates.length > 0 && (
                <div className="border-t border-gray-200 my-1" />
              )}

              {/* Recommended Template */}
              {recommendedTemplate && (
                <>
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                    推奨テンプレート
                  </div>
                  <button
                    onClick={() => handleTemplateSelect(recommendedTemplate.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{recommendedTemplate.nameJa}</div>
                      <div className="text-sm text-gray-500">{recommendedTemplate.descriptionJa}</div>
                    </div>
                    {selectedTemplate === recommendedTemplate.id && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                </>
              )}

              {/* All Templates Grouped by Unit */}
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                すべてのテンプレート
              </div>
              {['meta', 'design', 'development', 'business'].map(unit => {
                const unitTemplates = templates.filter(t => t.unit === unit);
                if (unitTemplates.length === 0) return null;

                return (
                  <div key={unit}>
                    <div className="px-4 py-1 text-xs text-gray-400">
                      {unit === 'meta' && 'メタ管理'}
                      {unit === 'design' && 'デザインユニット'}
                      {unit === 'development' && '開発ユニット'}
                      {unit === 'business' && 'ビジネスユニット'}
                    </div>
                    {unitTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                      >
                        <div className="ml-2">
                          <div className="text-sm">
                            <span className="font-mono text-xs text-gray-500 mr-2">{template.agentId}</span>
                            {template.nameJa}
                          </div>
                        </div>
                        {selectedTemplate === template.id && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {previewContent && selectedTemplate !== 'custom' && (
        <div className="mt-3">
          <button
            onClick={togglePreview}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <FileText className="w-4 h-4" />
            <span>{showPreview ? 'プレビューを隠す' : 'テンプレート内容を確認'}</span>
          </button>

          {showPreview && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700 max-h-64 overflow-y-auto">
                {previewContent}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Info Message */}
      {selectedTemplate !== 'custom' && (
        <p className="mt-2 text-sm text-gray-600">
          テンプレートが適用されました。必要に応じて下のテキストエリアで編集できます。
        </p>
      )}
    </div>
  );
};

export default TemplateSelector;