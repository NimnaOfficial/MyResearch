import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

// Ensure the connection string is read as a string type for TypeScript
const connectionString = `${process.env.DATABASE_URL}`;

// 1. Initialize a native PostgreSQL connection pool
const pool = new Pool({ connectionString });

// 2. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Inject the adapter into the Prisma Client constructor
const prisma = new PrismaClient({ adapter } as any);

export default prisma;