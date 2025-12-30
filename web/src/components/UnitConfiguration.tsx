import React from 'react';
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
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Unit {unitNumber}
      </h3>
      
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-800 mb-2">Manager</h4>
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
          <h4 className="text-md font-medium text-gray-800">
            Workers ({unit.workers.length})
          </h4>
          <div className="flex gap-2">
            {unit.workers.length < 5 && onAddWorker && (
              <button
                type="button"
                onClick={onAddWorker}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                + Add Worker
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
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors mt-6"
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