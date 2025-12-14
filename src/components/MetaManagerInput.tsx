import React from 'react';
import { PromptInput } from './PromptInput';
import type { AgentPrompt } from '../types/agent.ts';

interface MetaManagerInputProps {
  metaManager: AgentPrompt;
  onChange: (prompt: string) => void;
}

export const MetaManagerInput: React.FC<MetaManagerInputProps> = ({ metaManager, onChange }) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-3">Meta Manager</h3>
      <p className="text-sm text-blue-700 mb-3">
        Coordinates multiple units when 2 or more units are configured
      </p>
      <PromptInput
        id={metaManager.id}
        label="Meta Manager"
        value={metaManager.prompt}
        onChange={onChange}
        placeholder="Enter the meta manager's coordination prompt..."
      />
    </div>
  );
};