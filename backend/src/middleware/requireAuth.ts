// Legacy alias kept so existing imports keep working.
// `requireAuth` is now the same DB-backed, suspension-aware guard as `protect`
// (previously it only decoded the token and ignored suspended/deleted users).
// The Express.Request.user typing lives in auth.middleware.ts.
export { protect as requireAuth } from './auth.middleware';
