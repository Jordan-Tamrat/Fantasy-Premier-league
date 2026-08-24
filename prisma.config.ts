import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// This config is used only by the Prisma CLI (migrate, db seed, studio, ...).
// The running app connects separately via lib/prisma.ts, using the pooled
// DATABASE_URL. Migrations need a direct (non-pooled) connection because the
// shadow database Prisma creates for drift detection can't be created through
// Supabase's pgbouncer connection pooler.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
