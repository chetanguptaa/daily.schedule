import { type InferSelectModel } from "drizzle-orm";
import { users } from "./schema";

export interface IUser extends InferSelectModel<typeof users> {}
