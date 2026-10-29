import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret-change-me';
let warnedAboutSecret = false;

/**
 * Single source of truth for the JWT signing secret.
 * - Production: JWT_SECRET is mandatory (checked at boot by validateEnv()).
 * - Development: falls back to an obviously insecure key and warns once.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) return secret;

  if (isProduction) {
    throw new Error('JWT_SECRET is not configured.');
  }
  if (!warnedAboutSecret) {
    console.warn('[SECURITY] JWT_SECRET is not set. Using an insecure development fallback.');
    warnedAboutSecret = true;
  }
  return DEV_FALLBACK_SECRET;
};

export const getFrontendUrl = (): string =>
  (process.env.FRONTEND_URL || 'https://csxpidia.vercel.app').replace(/\/+$/, '');

/** Origins allowed to call the API from a browser. */
export const getAllowedOrigins = (): string[] => {
  const extra = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return Array.from(
    new Set([getFrontendUrl(), 'http://localhost:3000', 'http://127.0.0.1:3000', ...extra])
  );
};

/** Vercel preview deployments of the frontend (e.g. https://csxpidia-git-main-xyz.vercel.app) */
export const isTrustedPreviewOrigin = (origin: string): boolean =>
  /^https:\/\/csxpidia[a-z0-9-]*\.vercel\.app$/i.test(origin);

/** Fail fast at boot when the server would otherwise run insecurely or broken. */
export const validateEnv = (): void => {
  const problems: string[] = [];

  if (!process.env.DATABASE_URL) problems.push('DATABASE_URL is missing.');
  if (isProduction && !process.env.JWT_SECRET) problems.push('JWT_SECRET is missing (required in production).');

  if (problems.length > 0) {
    problems.forEach((p) => console.error(`[CONFIG ERROR] ${p}`));
    throw new Error('Invalid server configuration. See errors above.');
  }

  if (!process.env.EMAIL_RELAY_URL) {
    console.warn('[CONFIG] EMAIL_RELAY_URL is not set. Falling back to the legacy built-in relay URL - please configure it.');
  }
};
