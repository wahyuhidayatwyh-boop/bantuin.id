import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const connectionString = process.env.DATABASE_URL;

// Optimasi pool koneksi untuk lingkungan serverless Next.js
// Supabase Transaction Pooler memiliki batas koneksi klien (200).
// Batasi max: 2 per kontainer dan idleTimeout 5s agar koneksi segera dibebaskan kembali ke pooler.
const pool =
  globalForPrisma.pgPool ||
  new Pool({
    connectionString,
    max: 2,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
    ssl:
      connectionString &&
      (connectionString.includes("supabase") || connectionString.includes("pooler.supabase.com"))
        ? { rejectUnauthorized: false }
        : undefined,
  });

globalForPrisma.pgPool = pool;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Simpan singleton prisma di globalThis baik di development maupun production
globalForPrisma.prisma = prisma;

export default prisma;
