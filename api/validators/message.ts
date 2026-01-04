import { z } from 'zod';

export const MessageRequestSchema = z.object({
  target: z.string().min(1, 'Target is required'),
  message: z.string().min(1, 'Message is required'),
  execute: z.boolean().optional().default(true),
  session: z.string().min(1, 'Session is required'),
  sender: z.string().optional().default('unknown')
});

export type MessageRequest = z.infer<typeof MessageRequestSchema>;

export const MessageResponseSchema = z.object({
  status: z.enum(['acknowledged', 'failed']),
  timestamp: z.string(),
  target: z.string(),
  session: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional()
});

export type MessageResponse = z.infer<typeof MessageResponseSchema>;