/**
 * Single source of truth for the backend base URL.
 *
 * - Local dev:   set NEXT_PUBLIC_API_URL=http://localhost:5000 in frontend/.env.local
 * - Production:  set NEXT_PUBLIC_API_URL in Vercel (falls back to the live Render API if unset)
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

/** Reads the stored session token (browser only). */
export const getToken = (): string | null =>
  typeof window === 'undefined' ? null : localStorage.getItem('matrix_token');

/** Builds an Authorization header object when a token exists. */
export const authHeaders = (token: string | null = getToken()): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};
