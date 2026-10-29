import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Determine whether to use local SQLite or remote Turso
// Defaults to 100% LOCAL SQLite file (dev.db) unless explicitly configured otherwise
const useRemoteTurso = process.env.USE_REMOTE_TURSO === 'true' && Boolean(process.env.TURSO_DATABASE_URL);

let url: string;
let authToken: string | undefined;

if (useRemoteTurso) {
  url = process.env.TURSO_DATABASE_URL!;
  authToken = process.env.TURSO_AUTH_TOKEN;
} else {
  // 100% Local SQLite Mode
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

// 1. Initialize the Prisma 7 LibSQL Driver Adapter with connection config
const adapter = new PrismaLibSql({
  url,
  authToken,
});

// 2. Inject the adapter into the Prisma Client constructor
const prisma = new PrismaClient({ adapter } as any);

export default prisma;
