/**
 * Type adapters for compatibility between old and new API structures
 */

import type { Agent, Unit as MasUnit } from '../types/masApi';
import type { AgentPrompt, Unit as LegacyUnit } from '../types/agent';

/**
 * Convert MAS API Agent to legacy AgentPrompt
 */
export function agentToAgentPrompt(agent: Agent, role: 'meta-manager' | 'manager' | 'worker'): AgentPrompt {
  return {
    id: agent.id,
    prompt: agent.prompt,
    role
  };
}

/**
 * Convert legacy AgentPrompt to MAS API Agent
 */
export function agentPromptToAgent(agentPrompt: AgentPrompt): Agent {
  return {
    id: agentPrompt.id,
    prompt: agentPrompt.prompt
  };
}

/**
 * Convert MAS API Unit to legacy Unit
 */
export function masUnitToLegacyUnit(unit: MasUnit): LegacyUnit {
  return {
    manager: agentToAgentPrompt(unit.manager, 'manager'),
    workers: unit.workers.map(w => agentToAgentPrompt(w, 'worker'))
  };
}

/**
 * Convert legacy Unit to MAS API Unit
 */
export function legacyUnitToMasUnit(unit: LegacyUnit, unitId: number): MasUnit {
  return {
    unitId,
    manager: agentPromptToAgent(unit.manager),
    workers: unit.workers.map(agentPromptToAgent)
  };
}