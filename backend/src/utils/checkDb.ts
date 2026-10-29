import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

export interface DbCheckResult {
  ok: boolean;
  message: string;
}

export const checkDatabaseConnection = async (timeoutMs = 6000): Promise<DbCheckResult> => {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    return { ok: false, message: 'TURSO_DATABASE_URL is not defined in environment.' };
  }

  try {
    const client = createClient({
      url,
      authToken: authToken || undefined,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Connection timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    await Promise.race([client.execute('SELECT 1 as ping'), timeoutPromise]);

    return {
      ok: true,
      message: `Turso Cloud Database verified (${url}).`,
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    return {
      ok: false,
      message: `Turso probe failed: ${errMsg}`,
    };
  }
};
