ALTER TABLE "spaces" RENAME COLUMN "admin_user_id" TO "adminUserId";--> statement-breakpoint
ALTER TABLE "spaces" DROP CONSTRAINT "spaces_admin_user_id_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spaces" ADD CONSTRAINT "spaces_adminUserId_users_id_fk" FOREIGN KEY ("adminUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
