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

export const getFrontendUrl = (requestOrigin?: string): string => {
  // 1. If dynamic origin is available from incoming client request headers
  if (requestOrigin) {
    try {
      const parsed = new URL(requestOrigin);
      const originOnly = parsed.origin.replace(/\/+$/, '');
      if (
        isTrustedPreviewOrigin(originOnly) ||
        originOnly.includes('csx-pedia.vercel.app') ||
        originOnly.includes('localhost')
      ) {
        return originOnly;
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // 2. Environment variable check
  const inCloudOrProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.VERCEL;
  const configured = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
  if (configured) {
    if (inCloudOrProd && configured.includes('localhost')) {
      console.warn('[CONFIG WARNING] FRONTEND_URL points to localhost on cloud host. Overriding with https://csx-pedia.vercel.app');
      return 'https://csx-pedia.vercel.app';
    }
    return configured;
  }

  // 3. Fallback: production cloud vs local development
  return inCloudOrProd
    ? 'https://csx-pedia.vercel.app'
    : 'http://localhost:3000';
};

/** Origins allowed to call the API from a browser. */
export const getAllowedOrigins = (): string[] => {
  const extra = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return Array.from(
    new Set([
      getFrontendUrl(),
      'https://csx-pedia.vercel.app',
      'https://csxpidia.vercel.app',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...extra,
    ])
  );
};

/** Vercel production & preview deployments of the frontend (e.g. https://*.vercel.app) */
export const isTrustedPreviewOrigin = (origin: string): boolean =>
  /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$/i.test(origin);

/** Fail fast at boot when the server would otherwise run insecurely or broken. */
export const validateEnv = (): void => {
  const problems: string[] = [];

  if (!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) {
    problems.push('DATABASE_URL or TURSO_DATABASE_URL is missing.');
  }
  if (isProduction && !process.env.JWT_SECRET) {
    problems.push('JWT_SECRET is missing (required in production).');
  }

  if (problems.length > 0) {
    problems.forEach((p) => console.error(`[CONFIG ERROR] ${p}`));
    throw new Error('Invalid server configuration. See errors above.');
  }

  if (!process.env.BREVO_API_KEY && !process.env.EMAIL_RELAY_URL && !process.env.RESEND_API_KEY) {
    console.warn('[CONFIG] None of BREVO_API_KEY, EMAIL_RELAY_URL, or RESEND_API_KEY are configured.');
  }
};
