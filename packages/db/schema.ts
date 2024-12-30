import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar, integer, check, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  accessToken: varchar({ length: 4096 }).unique(),
  picture: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const availabilities = pgTable(
  "availabilities",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("userId")
      .references(() => users.id)
      .notNull(),
    dayOfWeek: integer("dayOfWeek").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    {
      checkConstraint: check("day_or_week_check", sql`${table.dayOfWeek} >= 0 AND ${table.dayOfWeek} <= 6`),
    },
  ]
);

export const availabilitiesTimeSlots = pgTable("availabilities_time_slots", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  availabilityId: uuid("availabilityId")
    .references(() => availabilities.id)
    .notNull(),
  startTime: varchar({ length: 5 }).notNull(),
  endTime: varchar({ length: 5 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
