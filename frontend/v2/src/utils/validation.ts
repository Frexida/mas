/**
 * Validation utilities for MAS API
 */

import type {
  Agent,
  Unit,
  RunsRequest
} from '../types/masApi';
import {
  isValidAgentId,
  isValidPromptLength,
  isValidUnitCount,
  isValidWorkerCount,
  MAX_PROMPT_LENGTH,
  MIN_PROMPT_LENGTH,
} from '../types/masApi';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates an Agent object
 */
export function validateAgent(agent: Agent, role: string = 'Agent'): ValidationResult {
  const errors: string[] = [];

  if (!agent.id) {
    errors.push(`${role}: ID is required`);
  } else if (!isValidAgentId(agent.id)) {
    errors.push(`${role}: ID must be a 2-digit number (e.g., "00", "11")`);
  }

  if (!agent.prompt) {
    errors.push(`${role}: Prompt is required`);
  } else if (!isValidPromptLength(agent.prompt)) {
    errors.push(`${role}: Prompt must be ${MIN_PROMPT_LENGTH}-${MAX_PROMPT_LENGTH} characters (current: ${agent.prompt.length})`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a Unit object
 */
export function validateUnit(unit: Unit, index: number): ValidationResult {
  const errors: string[] = [];
  const unitLabel = `Unit ${index + 1}`;

  // Validate unitId
  if (unit.unitId < 1 || unit.unitId > 4) {
    errors.push(`${unitLabel}: unitId must be between 1 and 4`);
  }

  // Validate manager
  const managerValidation = validateAgent(unit.manager, `${unitLabel} Manager`);
  errors.push(...managerValidation.errors);

  // Validate workers
  if (!unit.workers || !Array.isArray(unit.workers)) {
    errors.push(`${unitLabel}: Workers array is required`);
  } else if (!isValidWorkerCount(unit.workers.length)) {
    errors.push(`${unitLabel}: Must have 1-5 workers (current: ${unit.workers.length})`);
  } else {
    unit.workers.forEach((worker, idx) => {
      const workerValidation = validateAgent(worker, `${unitLabel} Worker ${idx + 1}`);
      errors.push(...workerValidation.errors);
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a complete RunsRequest
 */
export function validateRunsRequest(request: RunsRequest): ValidationResult {
  const errors: string[] = [];

  if (!request.agents) {
    errors.push('Agents configuration is required');
    return { valid: false, errors };
  }

  // Validate metaManager if present
  if (request.agents.metaManager) {
    const metaValidation = validateAgent(request.agents.metaManager, 'Meta Manager');
    errors.push(...metaValidation.errors);
  }

  // Validate units
  if (!request.agents.units || !Array.isArray(request.agents.units)) {
    errors.push('Units array is required');
  } else if (!isValidUnitCount(request.agents.units.length)) {
    errors.push(`Must have 1-4 units (current: ${request.agents.units.length})`);
  } else {
    request.agents.units.forEach((unit, index) => {
      const unitValidation = validateUnit(unit, index);
      errors.push(...unitValidation.errors);
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return `• ${errors.join('\n• ')}`;
}

/**
 * Gets character count display for prompt
 */
export function getPromptCharacterDisplay(prompt: string): {
  count: number;
  max: number;
  isValid: boolean;
  percentage: number;
} {
  const count = prompt.length;
  return {
    count,
    max: MAX_PROMPT_LENGTH,
    isValid: isValidPromptLength(prompt),
    percentage: (count / MAX_PROMPT_LENGTH) * 100
  };
}