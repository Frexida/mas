import { z } from 'zod';

// Agent schema - match OpenAPI spec pattern
export const AgentSchema = z.object({
  id: z.string().regex(/^[0-9]{2}$/, 'Agent ID must be 2 digits'),
  prompt: z.string().min(1, 'Prompt is required')
});

// Unit schema
export const UnitSchema = z.object({
  unitId: z.number().int().min(1).max(4),
  manager: AgentSchema,
  workers: z.array(AgentSchema).min(1).max(5)
});

// Run request schema (based on OpenAPI spec - max 4 units)
export const RunRequestSchema = z.object({
  agents: z.object({
    metaManager: AgentSchema.optional(),
    units: z.array(UnitSchema).min(1).max(4)
  })
});

export type RunRequest = z.infer<typeof RunRequestSchema>;

// Run response schema
export const RunResponseSchema = z.object({
  sessionId: z.string(),
  tmuxSession: z.string(),
  workingDir: z.string(),
  startedAt: z.string(),
  status: z.enum(['starting', 'started', 'failed'])
});

export type RunResponse = z.infer<typeof RunResponseSchema>;