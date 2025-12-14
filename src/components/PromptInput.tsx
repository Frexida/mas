import React from 'react';

interface PromptInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter prompt for this agent...",
  maxLength = 5000
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-gray-400">(ID: {id})</span>
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border resize-y min-h-[80px]"
      />
      <div className="mt-1 text-xs text-gray-500 text-right">
        {value.length} / {maxLength}
      </div>
    </div>
  );
};