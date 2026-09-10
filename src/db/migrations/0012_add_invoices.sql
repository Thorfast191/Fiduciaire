CREATE TABLE "invoice_counters" (
	"year" integer PRIMARY KEY NOT NULL,
	"last_seq" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "invoice_number" text;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_number_unique" UNIQUE("invoice_number");