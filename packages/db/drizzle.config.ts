import * as dotenv from "dotenv";
dotenv.config();

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
