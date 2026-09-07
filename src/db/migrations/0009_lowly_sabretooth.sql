DROP INDEX "dossiers_client_tax_year_idx";--> statement-breakpoint
ALTER TABLE "dossiers" ADD COLUMN "service_type" text DEFAULT 'declaration' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "dossiers_client_year_service_idx" ON "dossiers" USING btree ("client_id","tax_year","service_type");--> statement-breakpoint
CREATE INDEX "dossiers_service_type_idx" ON "dossiers" USING btree ("service_type");