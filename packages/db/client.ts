import * as dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const psql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: psql });
