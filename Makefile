# Goldsainte backend deploy helpers
# Target Supabase project (the one client.ts is pinned to with real user data)
SUPABASE_PROJECT_REF ?= ktzsgqrqvwtxlimctkaf
SUPABASE ?= npx supabase

.PHONY: help link login deploy-functions deploy-function db-push db-diff secrets-pull deploy

help:
	@echo "Goldsainte backend deploy targets (project: $(SUPABASE_PROJECT_REF))"
	@echo ""
	@echo "  make login              Interactive supabase login (one-time per machine)"
	@echo "  make link               Link the local repo to the production Supabase project"
	@echo "  make deploy-functions   Deploy ALL edge functions in supabase/functions/"
	@echo "  make deploy-function FN=name   Deploy a single edge function"
	@echo "  make db-push            Apply local migrations to the production database"
	@echo "  make db-diff            Show pending schema differences (no changes applied)"
	@echo "  make secrets-set KV='K1=v1 K2=v2'   Set edge-function secrets"
	@echo "  make deploy             Full backend deploy: link + db-push + deploy-functions"

login:
	$(SUPABASE) login

link:
	$(SUPABASE) link --project-ref $(SUPABASE_PROJECT_REF)

deploy-functions:
	$(SUPABASE) functions deploy --project-ref $(SUPABASE_PROJECT_REF)

deploy-function:
	@if [ -z "$(FN)" ]; then echo "Usage: make deploy-function FN=function-name"; exit 1; fi
	$(SUPABASE) functions deploy $(FN) --project-ref $(SUPABASE_PROJECT_REF)

db-push:
	$(SUPABASE) db push --project-ref $(SUPABASE_PROJECT_REF)

db-diff:
	$(SUPABASE) db diff --linked

secrets-set:
	@if [ -z "$(KV)" ]; then echo "Usage: make secrets-set KV='KEY1=val1 KEY2=val2'"; exit 1; fi
	$(SUPABASE) secrets set --project-ref $(SUPABASE_PROJECT_REF) $(KV)

deploy: link db-push deploy-functions
	@echo "✅ Backend deploy complete for $(SUPABASE_PROJECT_REF)"