import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Runtime queries go through the pooled DATABASE_URL (Supabase pgbouncer).
// Migrations use a separate direct connection — see prisma.config.ts.
//
// rejectUnauthorized: false because Supabase's pooler presents a certificate
// Node's default trust store doesn't validate (SELF_SIGNED_CERT_IN_CHAIN) —
// the connection is still encrypted, just not chain-verified. This is the
// standard, widely-documented way to connect node-postgres to Supabase.
function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
