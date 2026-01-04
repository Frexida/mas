import React, { useState, useCallback } from 'react';
import TemplateSelector from './TemplateSelector';

interface PromptInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  role?: string;
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
  role: _role,
  unitId: _unitId,
  workerId: _workerId,
  showTemplateSelector = false
}) => {
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [originalValue, setOriginalValue] = useState<string>('');

  const handleTemplateSelect = useCallback((prompt: string, templateId?: string) => {
    onChange(prompt);
    setTemplateId(templateId);
    if (templateId) {
      setOriginalValue(prompt);
    }
  }, [onChange]);

  const handleReset = () => {
    if (originalValue) {
      onChange(originalValue);
    }
  };

  const handleTextChange = (newValue: string) => {
    onChange(newValue);
  };

  // Determine if the current value differs from the template
  const hasBeenModified = templateId && originalValue && value !== originalValue;

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-mas-text-secondary mb-1">
        {label} <span className="text-mas-text-muted">(ID: {id})</span>
      </label>

      {showTemplateSelector && (
        <div className="mb-2">
          <TemplateSelector
            agentId={id}
            currentPrompt={value}
            onTemplateSelect={handleTemplateSelect}
          />
        </div>
      )}

      <textarea
        id={id}
        value={value}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1 block w-full rounded-md bg-mas-bg-panel border-mas-border shadow-sm focus:border-mas-blue focus:ring-mas-blue sm:text-sm px-3 py-2 border resize-y min-h-[120px] text-mas-text placeholder-mas-text-muted"
      />

      <div className="mt-1 flex justify-between items-center">
        <div>
          {hasBeenModified && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-mas-blue hover:text-mas-blue-soft"
            >
              Reset to template
            </button>
          )}
        </div>
        <div className="text-xs text-mas-text-muted">
          {value.length} / {maxLength}
        </div>
      </div>
    </div>
  );
};