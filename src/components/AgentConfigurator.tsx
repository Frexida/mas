import React, { useState } from 'react';
import { UnitSelector } from './UnitSelector';
import { MetaManagerInput } from './MetaManagerInput';
import { UnitConfiguration } from './UnitConfiguration';
import { useAgentConfiguration } from '../hooks/useAgentConfiguration';
import { submitConfiguration } from '../services/api';
import type { ApiResponse } from '../types/agent.ts';

interface AgentConfiguratorProps {
  onSubmitSuccess: (response: ApiResponse) => void;
}

export const AgentConfigurator: React.FC<AgentConfiguratorProps> = ({ onSubmitSuccess }) => {
  const {
    configuration,
    setUnitCount,
    setMetaManager,
    setUnitManager,
    setWorker,
    isValid
  } = useAgentConfiguration();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitConfiguration(configuration);
      onSubmitSuccess(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Multi-Agent System Configuration</h1>
      
      <UnitSelector
        value={configuration.unitCount}
        onChange={setUnitCount}
      />

      {configuration.unitCount >= 2 && configuration.metaManager && (
        <MetaManagerInput
          metaManager={configuration.metaManager}
          onChange={setMetaManager}
        />
      )}

      <div className="space-y-4">
        {configuration.units.map((unit, index) => (
          <UnitConfiguration
            key={index}
            unitNumber={index + 1}
            unit={unit}
            onManagerChange={(prompt) => setUnitManager(index, prompt)}
            onWorkerChange={(workerIndex, prompt) => setWorker(index, workerIndex, prompt)}
          />
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting || !isValid()}
          className={`w-full py-3 px-4 text-white font-medium rounded-md transition-colors ${
            isSubmitting || !isValid()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Configuration'}
        </button>
      </div>
    </form>
  );
};