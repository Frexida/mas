import { useReducer, useCallback } from 'react';
import type { AgentConfiguration, Unit, AgentPrompt } from '../types/agent.ts';

type Action =
  | { type: 'SET_UNIT_COUNT'; payload: number }
  | { type: 'SET_META_MANAGER'; payload: string }
  | { type: 'SET_UNIT_MANAGER'; unitIndex: number; payload: string }
  | { type: 'SET_WORKER'; unitIndex: number; workerIndex: number; payload: string }
  | { type: 'RESET' };

const createInitialState = (unitCount: number = 1): AgentConfiguration => {
  const units: Unit[] = [];
  
  for (let i = 0; i < unitCount; i++) {
    const unitId = (i + 1) * 10;
    units.push({
      manager: {
        id: unitId.toString(),
        prompt: '',
        role: 'manager'
      },
      workers: [
        { id: `${unitId + 1}`, prompt: '', role: 'worker' },
        { id: `${unitId + 2}`, prompt: '', role: 'worker' },
        { id: `${unitId + 3}`, prompt: '', role: 'worker' }
      ]
    });
  }

  const metaManager: AgentPrompt | undefined = unitCount >= 2 
    ? { id: '00', prompt: '', role: 'meta-manager' }
    : undefined;

  return {
    unitCount,
    metaManager,
    units
  };
};

const reducer = (state: AgentConfiguration, action: Action): AgentConfiguration => {
  switch (action.type) {
    case 'SET_UNIT_COUNT':
      return createInitialState(action.payload);
    
    case 'SET_META_MANAGER':
      if (!state.metaManager) return state;
      return {
        ...state,
        metaManager: { ...state.metaManager, prompt: action.payload }
      };
    
    case 'SET_UNIT_MANAGER':
      return {
        ...state,
        units: state.units.map((unit, index) => 
          index === action.unitIndex
            ? { ...unit, manager: { ...unit.manager, prompt: action.payload } }
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
                    ? { ...worker, prompt: action.payload }
                    : worker
                )
              }
            : unit
        )
      };
    
    case 'RESET':
      return createInitialState(1);
    
    default:
      return state;
  }
};

export const useAgentConfiguration = () => {
  const [state, dispatch] = useReducer(reducer, createInitialState(1));

  const setUnitCount = useCallback((count: number) => {
    dispatch({ type: 'SET_UNIT_COUNT', payload: count });
  }, []);

  const setMetaManager = useCallback((prompt: string) => {
    dispatch({ type: 'SET_META_MANAGER', payload: prompt });
  }, []);

  const setUnitManager = useCallback((unitIndex: number, prompt: string) => {
    dispatch({ type: 'SET_UNIT_MANAGER', unitIndex, payload: prompt });
  }, []);

  const setWorker = useCallback((unitIndex: number, workerIndex: number, prompt: string) => {
    dispatch({ type: 'SET_WORKER', unitIndex, workerIndex, payload: prompt });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const isValid = useCallback(() => {
    // Check if meta manager has prompt when required
    if (state.unitCount >= 2 && state.metaManager && !state.metaManager.prompt.trim()) {
      return false;
    }

    // Check if all units have prompts
    for (const unit of state.units) {
      if (!unit.manager.prompt.trim()) return false;
      for (const worker of unit.workers) {
        if (!worker.prompt.trim()) return false;
      }
    }

    return true;
  }, [state]);

  return {
    configuration: state,
    setUnitCount,
    setMetaManager,
    setUnitManager,
    setWorker,
    reset,
    isValid
  };
};