ALTER TABLE "users" ADD COLUMN "accessToken" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_accessToken_unique" UNIQUE("accessToken");