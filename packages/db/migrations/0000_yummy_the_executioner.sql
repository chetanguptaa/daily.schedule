CREATE TABLE IF NOT EXISTS "space_members" (
	"spaceId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	CONSTRAINT "space_members_userId_spaceId_pk" PRIMARY KEY("userId","spaceId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"admin_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"picture" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "space_members" ADD CONSTRAINT "space_members_spaceId_spaces_id_fk" FOREIGN KEY ("spaceId") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "space_members" ADD CONSTRAINT "space_members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spaces" ADD CONSTRAINT "spaces_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
