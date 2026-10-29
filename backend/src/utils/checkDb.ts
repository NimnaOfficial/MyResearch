import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface DbCheckResult {
  ok: boolean;
  message: string;
}

export const checkDatabaseConnection = async (timeoutMs = 5000): Promise<DbCheckResult> => {
  const useRemoteTurso = process.env.USE_REMOTE_TURSO === 'true' && Boolean(process.env.TURSO_DATABASE_URL);

  let url: string;
  let authToken: string | undefined;

  if (useRemoteTurso) {
    url = process.env.TURSO_DATABASE_URL!;
    authToken = process.env.TURSO_AUTH_TOKEN;
  } else {
    const rawUrl = process.env.DATABASE_URL || 'file:./dev.db';
    if (rawUrl.startsWith('file:')) {
      const relativePath = rawUrl.replace(/^file:/, '');
      const absPath = path.isAbsolute(relativePath)
        ? relativePath
        : path.resolve(process.cwd(), relativePath);
      url = `file:${absPath.replace(/\\/g, '/')}`;
    } else {
      url = rawUrl;
    }
    authToken = undefined;
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

    const isLocal = url.startsWith('file:');
    const displayTarget = isLocal ? `Local SQLite (${path.basename(url)})` : `Turso Cloud (${url})`;

    return {
      ok: true,
      message: `Database connection verified: ${displayTarget}`,
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    return {
      ok: false,
      message: `Database probe failed: ${errMsg}`,
    };
  }
};
