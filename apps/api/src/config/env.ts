import { z } from 'zod';

/**
 * Environment schema for the API. Validated once at process start so a
 * misconfigured deploy fails fast instead of at first request.
 * Keys added by later E1 tasks are documented in `apps/api/.env.example`.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid API environment variables:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
