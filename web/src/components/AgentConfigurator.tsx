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
  onBack?: () => void;
}

export const AgentConfigurator: React.FC<AgentConfiguratorProps> = ({ onSubmitSuccess, onBack }) => {
  const {
    configuration,
    setUnitCount,
    setMetaManager,
    setUnitManager,
    setWorker,
    addWorker,
    removeWorker,
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
    <div className="w-full h-full">
      {!sessionData ? (
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-mas-text">Multi-agent system configuration</h1>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-mas-text-secondary hover:text-mas-text border border-mas-border rounded-md hover:bg-mas-bg-subtle transition-colors"
              >
                Back to sessions
              </button>
            )}
          </div>

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
                onAddWorker={() => addWorker(index)}
                onRemoveWorker={(workerIndex) => removeWorker(index, workerIndex)}
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-mas-bg-panel border border-mas-border rounded-md">
              <p className="text-sm text-mas-status-error whitespace-pre-wrap">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting || !isValid()}
              className="w-full sm:w-auto px-6 py-3 bg-mas-blue text-mas-bg-root font-semibold rounded-md hover:bg-mas-blue-soft disabled:bg-mas-bg-subtle disabled:text-mas-text-muted disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating session...' : 'Create session'}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-mas-text mb-6">Session active</h1>
          <SessionDisplay session={sessionData} />
          <MessageSender
            tmuxSession={sessionData.tmuxSession}
          />
          <button
            onClick={() => {
              setSessionData(null);
              setError(null);
            }}
            className="mt-4 px-4 py-2 bg-mas-bg-subtle text-mas-text-secondary border border-mas-border rounded-md hover:bg-mas-bg-panel hover:text-mas-text transition-colors"
          >
            Configure new session
          </button>
        </div>
      )}
    </div>
  );
};