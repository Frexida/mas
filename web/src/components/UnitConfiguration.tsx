import React, { useState } from 'react';
import { PromptInput } from './PromptInput';
import type { Unit } from '../types/agent.ts';

interface UnitConfigurationProps {
  unitNumber: number;
  unit: Unit;
  onManagerChange: (prompt: string) => void;
  onWorkerChange: (workerIndex: number, prompt: string) => void;
  onAddWorker?: () => void;
  onRemoveWorker?: (workerIndex: number) => void;
}

export const UnitConfiguration: React.FC<UnitConfigurationProps> = ({
  unitNumber,
  unit,
  onManagerChange,
  onWorkerChange,
  onAddWorker,
  onRemoveWorker
}) => {
  const [commonPrompt, setCommonPrompt] = useState('');
  const [showCommonPrompt, setShowCommonPrompt] = useState(false);

  // 共通プロンプトを全エージェントに適用
  const applyCommonPrompt = () => {
    if (!commonPrompt.trim()) return;

    const prefix = commonPrompt.trim() + '\n\n---\n\n';

    // マネージャーに適用
    const newManagerPrompt = prefix + unit.manager.prompt;
    onManagerChange(newManagerPrompt);

    // 全ワーカーに適用
    unit.workers.forEach((worker, index) => {
      const newWorkerPrompt = prefix + worker.prompt;
      onWorkerChange(index, newWorkerPrompt);
    });

    // 適用後にクリア
    setCommonPrompt('');
    setShowCommonPrompt(false);
  };

  return (
    <div className="border border-mas-border rounded-lg p-4 mb-4 bg-mas-bg-panel">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-mas-text">
          Unit {unitNumber}
        </h3>
        <button
          type="button"
          onClick={() => setShowCommonPrompt(!showCommonPrompt)}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            showCommonPrompt
              ? 'bg-mas-blue text-mas-bg-root'
              : 'bg-mas-bg-subtle text-mas-text-secondary hover:bg-mas-bg-root hover:text-mas-text border border-mas-border'
          }`}
        >
          {showCommonPrompt ? 'Close' : 'Common prompt'}
        </button>
      </div>

      {/* 共通プロンプト入力エリア */}
      {showCommonPrompt && (
        <div className="mb-4 p-3 bg-mas-bg-subtle border border-mas-border rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-mas-text-secondary">
              Common prompt (applies to all agents in this unit)
            </span>
          </div>
          <textarea
            value={commonPrompt}
            onChange={(e) => setCommonPrompt(e.target.value)}
            placeholder="Enter a prompt that will be prepended to all agents in this unit..."
            className="w-full h-24 px-3 py-2 bg-mas-bg-root border border-mas-border rounded-md text-mas-text placeholder-mas-text-muted focus:outline-none focus:border-mas-blue resize-none text-sm"
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={applyCommonPrompt}
              disabled={!commonPrompt.trim()}
              className="px-4 py-1.5 text-sm bg-mas-blue text-mas-bg-root rounded hover:bg-mas-blue-soft disabled:bg-mas-bg-subtle disabled:text-mas-text-muted disabled:cursor-not-allowed transition-colors"
            >
              Apply to all agents
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-md font-medium text-mas-text-secondary mb-2">Manager</h4>
        <PromptInput
          id={unit.manager.id}
          label={`Unit ${unitNumber} Manager`}
          value={unit.manager.prompt}
          onChange={onManagerChange}
          placeholder="Enter the manager's role and responsibilities..."
          role="manager"
          unitId={unitNumber}
          showTemplateSelector={true}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-mas-text-secondary">
            Workers ({unit.workers.length})
          </h4>
          <div className="flex gap-2">
            {unit.workers.length < 5 && onAddWorker && (
              <button
                type="button"
                onClick={onAddWorker}
                className="px-3 py-1 text-sm bg-mas-status-ok text-mas-bg-root rounded hover:opacity-90 transition-colors"
              >
                + Add worker
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-3">
          {unit.workers.map((worker, index) => (
            <div key={worker.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <PromptInput
                  id={worker.id}
                  label={`Worker ${index + 1}`}
                  value={worker.prompt}
                  onChange={(prompt) => onWorkerChange(index, prompt)}
                  placeholder="Enter the worker's specific tasks..."
                  role="worker"
                  unitId={unitNumber}
                  workerId={index + 1}
                  showTemplateSelector={true}
                />
              </div>
              {unit.workers.length > 1 && onRemoveWorker && (
                <button
                  type="button"
                  onClick={() => onRemoveWorker(index)}
                  className="px-3 py-2 text-sm bg-mas-status-error text-mas-bg-root rounded hover:opacity-90 transition-colors mt-6"
                  title="Remove this worker"
                >
                  × Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
