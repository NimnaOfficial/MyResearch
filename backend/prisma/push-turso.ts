import dotenv from 'dotenv';
dotenv.config();

import { execSync } from 'child_process';
import { createClient } from '@libsql/client';

async function pushTursoSchema() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('❌ Neither TURSO_DATABASE_URL nor DATABASE_URL is defined.');
    process.exit(1);
  }

  console.log('⚡ [TURSO MIGRATOR] Generating SQLite DDL from Prisma schema...');
  const diffOutput = execSync('npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script', {
    cwd: process.cwd(),
    encoding: 'utf-8',
  });

  // Filter out any Prisma CLI informational logs
  const sqlStatements = diffOutput
    .split('\n')
    .filter((line) => !line.trim().startsWith('◇') && !line.trim().startsWith('Loaded Prisma'))
    .join('\n');

  console.log(`⚡ [TURSO MIGRATOR] Connecting to Turso endpoint: ${url}`);
  const client = createClient({
    url,
    authToken: authToken || undefined,
  });

  try {
    console.log('⚡ [TURSO MIGRATOR] Executing DDL batch statements...');
    await client.executeMultiple(sqlStatements);
    console.log('✅ [TURSO MIGRATOR] Schema successfully applied to Turso database!');

    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    console.log('📋 Verified Tables:', tables.rows.map((r) => r.name).join(', '));
  } catch (err: any) {
    console.error('❌ [TURSO MIGRATOR ERROR]', err?.message || err);
    process.exit(1);
  }
}

pushTursoSchema();
