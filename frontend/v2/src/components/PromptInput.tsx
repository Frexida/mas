import React, { useState, useCallback } from 'react';
import TemplateSelector from './TemplateSelector';
import type { Template, TemplateRole } from '../types/templates';
import { generatePromptFromTemplate } from '../utils/templates';

interface PromptInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  role?: TemplateRole;
  unitId?: number;
  workerId?: number;
  showTemplateSelector?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter prompt for this agent...",
  maxLength = 5000,
  role,
  unitId,
  workerId,
  showTemplateSelector = false
}) => {
  const [showResetButton, setShowResetButton] = useState(false);
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);

  const handleTemplateSelect = useCallback((template: Template) => {
    const variables = {
      unitId,
      workerId,
      agentId: id
    };
    const prompt = generatePromptFromTemplate(template, variables, true);
    onChange(prompt);
    setOriginalTemplate(template);
    setShowResetButton(true);
  }, [id, unitId, workerId, onChange]);

  const handleReset = () => {
    if (originalTemplate) {
      handleTemplateSelect(originalTemplate);
    }
  };

  const handleTextChange = (newValue: string) => {
    onChange(newValue);
    // Keep reset button visible if we have an original template
    if (originalTemplate) {
      setShowResetButton(true);
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-gray-400">(ID: {id})</span>
      </label>

      {showTemplateSelector && role && (
        <div className="mb-2">
          <TemplateSelector
            role={role}
            onTemplateSelect={handleTemplateSelect}
            currentPrompt={value}
            agentId={id}
          />
        </div>
      )}

      <textarea
        id={id}
        value={value}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border resize-y min-h-[80px]"
      />

      <div className="mt-1 flex justify-between items-center">
        <div>
          {showResetButton && originalTemplate && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              デフォルトに戻す
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {value.length} / {maxLength}
        </div>
      </div>
    </div>
  );
};