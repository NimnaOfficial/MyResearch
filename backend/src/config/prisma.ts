import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';

dotenv.config();

// Cloud-Hosted Database Architecture (Turso libSQL Cloud DB)
const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'libsql://nima-platform-nimna-plat.aws-ap-south-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN;

// 1. Initialize the Prisma 7 LibSQL Driver Adapter targeting Cloud Turso
const adapter = new PrismaLibSql({
  url,
  authToken: authToken || undefined,
});

// 2. Inject the adapter into the Prisma Client constructor
const prisma = new PrismaClient({ adapter } as any);

export default prisma;
