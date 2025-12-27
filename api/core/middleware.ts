import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import type { Context } from 'hono';

export const corsMiddleware = cors();
export const loggerMiddleware = logger();

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return c.json({
      error: err.message,
      status: err.status
    }, err.status);
  }

  console.error('Unhandled error:', err);
  return c.json({
    error: 'Internal Server Error',
    status: 500
  }, 500);
};