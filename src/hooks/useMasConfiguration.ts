import { useReducer, useCallback } from 'react';
import type { Agent, Unit, RunsRequest } from '../types/masApi';
import { isValidAgentId } from '../types/masApi';
import type { Template } from '../types/templates';
import { generatePromptFromTemplate } from '../utils/templates';
import { saveLastUsedTemplate, getTemplatePreferences } from '../services/templateStorage';

interface MasConfiguration {
  unitCount: number;
  metaManager?: Agent;
  units: Unit[];
  templatePreferences?: {
    includeHelp: boolean;
    language: 'ja' | 'en';
  };
}

type Action =
  | { type: 'SET_UNIT_COUNT'; payload: number }
  | { type: 'SET_META_MANAGER'; payload: { id: string; prompt: string } }
  | { type: 'SET_UNIT_MANAGER'; unitIndex: number; payload: { id: string; prompt: string } }
  | { type: 'SET_WORKER'; unitIndex: number; workerIndex: number; payload: { id: string; prompt: string } }
  | { type: 'ADD_WORKER'; unitIndex: number }
  | { type: 'REMOVE_WORKER'; unitIndex: number; workerIndex: number }
  | { type: 'APPLY_TEMPLATE'; agentKey: string; template: Template; variables: any }
  | { type: 'SET_TEMPLATE_PREFERENCES'; payload: { includeHelp?: boolean; language?: 'ja' | 'en' } }
  | { type: 'RESET' };

const createInitialState = (unitCount: number = 1): MasConfiguration => {
  const units: Unit[] = [];

  for (let i = 0; i < unitCount; i++) {
    const unitId = i + 1;
    const baseId = (i + 1) * 10;

    units.push({
      unitId,
      manager: {
        id: baseId.toString().padStart(2, '0'),
        prompt: ''
      },
      workers: [
        { id: (baseId + 1).toString().padStart(2, '0'), prompt: '' },
        { id: (baseId + 2).toString().padStart(2, '0'), prompt: '' },
        { id: (baseId + 3).toString().padStart(2, '0'), prompt: '' }
      ]
    });
  }

  const metaManager: Agent | undefined = unitCount >= 2
    ? { id: '00', prompt: '' }
    : undefined;

  // Load template preferences
  const prefs = getTemplatePreferences();

  return {
    unitCount,
    metaManager,
    units,
    templatePreferences: {
      includeHelp: prefs.includeHelpByDefault,
      language: prefs.defaultLanguage
    }
  };
};

const reducer = (state: MasConfiguration, action: Action): MasConfiguration => {
  switch (action.type) {
    case 'SET_UNIT_COUNT':
      return createInitialState(action.payload);

    case 'SET_META_MANAGER':
      return {
        ...state,
        metaManager: state.unitCount >= 2 ? action.payload : undefined
      };

    case 'SET_UNIT_MANAGER':
      return {
        ...state,
        units: state.units.map((unit, index) =>
          index === action.unitIndex
            ? { ...unit, manager: action.payload }
            : unit
        )
      };

    case 'SET_WORKER':
      return {
        ...state,
        units: state.units.map((unit, index) =>
          index === action.unitIndex
            ? {
                ...unit,
                workers: unit.workers.map((worker, wIndex) =>
                  wIndex === action.workerIndex
                    ? action.payload
                    : worker
                )
              }
            : unit
        )
      };

    case 'ADD_WORKER':
      return {
        ...state,
        units: state.units.map((unit, index) => {
          if (index === action.unitIndex && unit.workers.length < 5) {
            const newWorkerId = (unit.unitId * 10 + unit.workers.length + 1).toString().padStart(2, '0');
            return {
              ...unit,
              workers: [...unit.workers, { id: newWorkerId, prompt: '' }]
            };
          }
          return unit;
        })
      };

    case 'REMOVE_WORKER':
      return {
        ...state,
        units: state.units.map((unit, index) => {
          if (index === action.unitIndex && unit.workers.length > 1) {
            return {
              ...unit,
              workers: unit.workers.filter((_, wIndex) => wIndex !== action.workerIndex)
            };
          }
          return unit;
        })
      };

    case 'APPLY_TEMPLATE': {
      const { agentKey, template, variables } = action;
      const prompt = generatePromptFromTemplate(
        template,
        variables,
        state.templatePreferences?.includeHelp ?? true
      );

      // Save the template preference
      saveLastUsedTemplate(agentKey, template.id);

      // Apply template to appropriate agent
      if (agentKey === 'meta-manager' && state.metaManager) {
        return {
          ...state,
          metaManager: { ...state.metaManager, prompt }
        };
      }

      // Parse agent key for unit/worker updates
      const [unitStr, workerStr] = agentKey.split('-');
      const unitIndex = parseInt(unitStr) - 1;

      if (workerStr === undefined && unitIndex >= 0 && unitIndex < state.units.length) {
        // Manager update
        return {
          ...state,
          units: state.units.map((unit, index) =>
            index === unitIndex
              ? { ...unit, manager: { ...unit.manager, prompt } }
              : unit
          )
        };
      } else if (workerStr !== undefined) {
        // Worker update
        const workerIndex = parseInt(workerStr) - 1;
        return {
          ...state,
          units: state.units.map((unit, index) =>
            index === unitIndex
              ? {
                  ...unit,
                  workers: unit.workers.map((worker, wIndex) =>
                    wIndex === workerIndex
                      ? { ...worker, prompt }
                      : worker
                  )
                }
              : unit
          )
        };
      }

      return state;
    }

    case 'SET_TEMPLATE_PREFERENCES':
      return {
        ...state,
        templatePreferences: {
          ...state.templatePreferences,
          ...action.payload
        } as MasConfiguration['templatePreferences']
      };

    case 'RESET':
      return createInitialState(1);

    default:
      return state;
  }
};

export const useMasConfiguration = () => {
  const [state, dispatch] = useReducer(reducer, createInitialState(1));

  const setUnitCount = useCallback((count: number) => {
    dispatch({ type: 'SET_UNIT_COUNT', payload: count });
  }, []);

  const setMetaManager = useCallback((id: string, prompt: string) => {
    dispatch({ type: 'SET_META_MANAGER', payload: { id, prompt } });
  }, []);

  const setUnitManager = useCallback((unitIndex: number, id: string, prompt: string) => {
    dispatch({ type: 'SET_UNIT_MANAGER', unitIndex, payload: { id, prompt } });
  }, []);

  const setWorker = useCallback((unitIndex: number, workerIndex: number, id: string, prompt: string) => {
    dispatch({ type: 'SET_WORKER', unitIndex, workerIndex, payload: { id, prompt } });
  }, []);

  const addWorker = useCallback((unitIndex: number) => {
    dispatch({ type: 'ADD_WORKER', unitIndex });
  }, []);

  const removeWorker = useCallback((unitIndex: number, workerIndex: number) => {
    dispatch({ type: 'REMOVE_WORKER', unitIndex, workerIndex });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const applyTemplate = useCallback((agentKey: string, template: Template, variables: any) => {
    dispatch({ type: 'APPLY_TEMPLATE', agentKey, template, variables });
  }, []);

  const setTemplatePreferences = useCallback((prefs: { includeHelp?: boolean; language?: 'ja' | 'en' }) => {
    dispatch({ type: 'SET_TEMPLATE_PREFERENCES', payload: prefs });
  }, []);

  const isValid = useCallback((): boolean => {
    // Check meta-manager if present
    if (state.metaManager) {
      if (!isValidAgentId(state.metaManager.id) || !state.metaManager.prompt) {
        return false;
      }
    }

    // Check all units
    for (const unit of state.units) {
      // Check manager
      if (!isValidAgentId(unit.manager.id) || !unit.manager.prompt) {
        return false;
      }

      // Check workers
      for (const worker of unit.workers) {
        if (!isValidAgentId(worker.id) || !worker.prompt) {
          return false;
        }
      }
    }

    return true;
  }, [state]);

  const toRunsRequest = useCallback((): RunsRequest => {
    return {
      agents: {
        metaManager: state.metaManager,
        units: state.units
      }
    };
  }, [state]);

  return {
    configuration: state,
    setUnitCount,
    setMetaManager,
    setUnitManager,
    setWorker,
    addWorker,
    removeWorker,
    reset,
    applyTemplate,
    setTemplatePreferences,
    isValid,
    toRunsRequest
  };
};