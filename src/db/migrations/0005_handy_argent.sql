CREATE INDEX "audit_log_action_ip_idx" ON "audit_log" USING btree ("action","ip","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_action_actor_idx" ON "audit_log" USING btree ("action","actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "documents_dossier_id_idx" ON "documents" USING btree ("dossier_id");--> statement-breakpoint
CREATE INDEX "documents_owner_id_idx" ON "documents" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "dossiers_client_id_idx" ON "dossiers" USING btree ("client_id","tax_year");--> statement-breakpoint
CREATE INDEX "dossiers_tax_year_idx" ON "dossiers" USING btree ("tax_year");--> statement-breakpoint
CREATE INDEX "otp_codes_user_purpose_idx" ON "otp_codes" USING btree ("user_id","purpose","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");