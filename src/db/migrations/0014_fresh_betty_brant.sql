CREATE TABLE "dossier_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dossier_comments" ADD CONSTRAINT "dossier_comments_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_comments" ADD CONSTRAINT "dossier_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dossier_comments_dossier_idx" ON "dossier_comments" USING btree ("dossier_id","created_at");