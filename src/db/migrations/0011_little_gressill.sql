ALTER TABLE "payments" ADD COLUMN "dossier_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "stripe_session_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_dossier_idx" ON "payments" USING btree ("dossier_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_stripe_session_id_unique" UNIQUE("stripe_session_id");