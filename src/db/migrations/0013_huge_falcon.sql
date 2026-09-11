ALTER TABLE "dossiers" ADD COLUMN "reserved_by" uuid;--> statement-breakpoint
ALTER TABLE "dossiers" ADD COLUMN "reserved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_reserved_by_users_id_fk" FOREIGN KEY ("reserved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dossiers_reserved_by_idx" ON "dossiers" USING btree ("reserved_by");