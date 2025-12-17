import React, { useState } from 'react';
import { UnitSelector } from './UnitSelector';
import { MetaManagerInput } from './MetaManagerInput';
import { UnitConfiguration } from './UnitConfiguration';
import { SessionDisplay } from './SessionDisplay';
import { MessageSender } from './MessageSender';
import { useMasConfiguration } from '../hooks/useMasConfiguration';
import { createRunWithRetry } from '../services/masApi';
import { validateRunsRequest, formatValidationErrors } from '../utils/validation';
import type { RunsResponse, ErrorResponse } from '../types/masApi';

interface AgentConfiguratorProps {
  onSubmitSuccess: (response: RunsResponse | ErrorResponse) => void;
}

export const AgentConfigurator: React.FC<AgentConfiguratorProps> = ({ onSubmitSuccess }) => {
  const {
    configuration,
    setUnitCount,
    setMetaManager,
    setUnitManager,
    setWorker,
    isValid,
    toRunsRequest
  } = useMasConfiguration();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<RunsResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid()) {
      setError('Please fill in all required fields');
      return;
    }

    const request = toRunsRequest();
    const validation = validateRunsRequest(request);

    if (!validation.valid) {
      setError(formatValidationErrors(validation.errors));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await createRunWithRetry(request);

      if ('error' in response) {
        const errorMsg = typeof response.error === 'string' ? response.error : 'An error occurred';
        setError(errorMsg);
        onSubmitSuccess(response);
      } else {
        setSessionData(response);
        onSubmitSuccess(response);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit configuration';
      setError(errorMessage);
      onSubmitSuccess({ error: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMetaManagerChange = (prompt: string) => {
    if (configuration.metaManager) {
      setMetaManager(configuration.metaManager.id, prompt);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {!sessionData ? (
        <form onSubmit={handleSubmit} className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Multi-Agent System Configuration</h1>

          <UnitSelector
            value={configuration.unitCount}
            onChange={setUnitCount}
          />

          {configuration.unitCount >= 2 && configuration.metaManager && (
            <MetaManagerInput
              metaManager={{
                id: configuration.metaManager.id,
                prompt: configuration.metaManager.prompt,
                role: 'meta-manager'
              }}
              onChange={handleMetaManagerChange}
            />
          )}

          <div className="space-y-4">
            {configuration.units.map((unit, index) => (
              <UnitConfiguration
                key={unit.unitId}
                unitNumber={unit.unitId}
                unit={{
                  manager: {
                    ...unit.manager,
                    role: 'manager' as const
                  },
                  workers: unit.workers.map(w => ({
                    ...w,
                    role: 'worker' as const
                  }))
                }}
                onManagerChange={(prompt) => setUnitManager(index, unit.manager.id, prompt)}
                onWorkerChange={(workerIndex, prompt) =>
                  setWorker(index, workerIndex, unit.workers[workerIndex].id, prompt)
                }
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 whitespace-pre-wrap">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting || !isValid()}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating Session...' : 'Create Session'}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Active</h1>
          <SessionDisplay session={sessionData} />
          <MessageSender
            tmuxSession={sessionData.tmuxSession}
          />
          <button
            onClick={() => {
              setSessionData(null);
              setError(null);
            }}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Configure New Session
          </button>
        </div>
      )}
    </div>
  );
};