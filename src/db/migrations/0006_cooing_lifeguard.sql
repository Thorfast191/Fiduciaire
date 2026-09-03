CREATE TABLE "dossier_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"sent_by" uuid NOT NULL,
	"kind" text NOT NULL,
	"message" text,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dossier_notifications" ADD CONSTRAINT "dossier_notifications_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_notifications" ADD CONSTRAINT "dossier_notifications_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dossier_notifications_dossier_idx" ON "dossier_notifications" USING btree ("dossier_id","created_at");