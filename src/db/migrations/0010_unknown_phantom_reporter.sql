CREATE TABLE "assistance_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_chf" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"label" text NOT NULL,
	"method" text DEFAULT 'bank_transfer' NOT NULL,
	"amount_chf" integer NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dossiers" ADD COLUMN "answers" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "dossiers" ADD COLUMN "current_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assistance_subscriptions" ADD CONSTRAINT "assistance_subscriptions_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assistance_client_year_idx" ON "assistance_subscriptions" USING btree ("client_id","tax_year");--> statement-breakpoint
CREATE INDEX "payments_client_idx" ON "payments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "payments_year_idx" ON "payments" USING btree ("tax_year");