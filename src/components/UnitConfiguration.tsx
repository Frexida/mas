import React from 'react';
import { PromptInput } from './PromptInput';
import type { Unit } from '../types/agent.ts';

interface UnitConfigurationProps {
  unitNumber: number;
  unit: Unit;
  onManagerChange: (prompt: string) => void;
  onWorkerChange: (workerIndex: number, prompt: string) => void;
}

export const UnitConfiguration: React.FC<UnitConfigurationProps> = ({
  unitNumber,
  unit,
  onManagerChange,
  onWorkerChange
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
        />
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-800 mb-2">Workers</h4>
        <div className="grid gap-3">
          {unit.workers.map((worker, index) => (
            <PromptInput
              key={worker.id}
              id={worker.id}
              label={`Worker ${index + 1}`}
              value={worker.prompt}
              onChange={(prompt) => onWorkerChange(index, prompt)}
              placeholder="Enter the worker's specific tasks..."
            />
          ))}
        </div>
      </div>
    </div>
  );
};