.PHONY: test deploy build frontend frontend-deploy clean lint local-api seed smoke

# ── Variables ──
STACK_NAME ?= heatshift
REGION ?= ap-south-1
S3_BUCKET ?= $(STACK_NAME)-deploy-$(REGION)
FRONTEND_BUCKET ?= $(STACK_NAME)-frontend

# ── Backend ──

install:
	pip install -r backend/requirements.txt
	pip install -r requirements-dev.txt

test:
	python -m pytest tests/ -v --tb=short

test-coverage:
	python -m pytest tests/ -v --cov=backend --cov-report=term-missing

lint:
	python -m ruff check backend/ tests/ scripts/

build:
	sam build --use-container

validate:
	sam validate --lint

deploy: build
	sam deploy \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--resolve-s3 \
		--capabilities CAPABILITY_IAM \
		--parameter-overrides \
			BedrockModelId=$(BEDROCK_MODEL_ID) \
			TelegramTokenSSMKey=$(TELEGRAM_TOKEN_SSM_KEY) \
			TelegramSecretSSMKey=$(TELEGRAM_SECRET_SSM_KEY) \
			FrontendBucketName=$(FRONTEND_BUCKET) \
			BudgetAlarmEmail=$(BUDGET_EMAIL) \
		--no-confirm-changeset

deploy-quick: build
	sam deploy --no-confirm-changeset

local-api:
	sam local start-api --warm-containers EAGER

# ── Data ──

build-replay:
	python scripts/build_replay_dataset.py

build-backtest:
	python scripts/build_backtest.py

build-cooling:
	python scripts/build_cooling_points.py

seed:
	python scripts/seed_demo.py

# ── Frontend ──

frontend:
	cd frontend && npm install && npm run build

frontend-dev:
	cd frontend && npm run dev

frontend-deploy: frontend
	aws s3 sync frontend/out/ s3://$(FRONTEND_BUCKET)/ --delete
	aws cloudfront create-invalidation \
		--distribution-id $$(aws cloudformation describe-stacks \
			--stack-name $(STACK_NAME) \
			--query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
			--output text) \
		--paths "/*"

# ── Smoke test ──

smoke:
	python scripts/smoke_test.py

# ── Layer ──

build-layer:
	mkdir -p layers/common/python/backend/common
	cp backend/common/*.py layers/common/python/backend/common/
	cp backend/__init__.py layers/common/python/backend/
	echo "" > layers/common/python/backend/common/__init__.py
	cp -r config/ layers/common/python/config/
	cp -r data/ layers/common/python/data/
	pip install -r backend/requirements.txt -t layers/common/python/ --quiet

# ── Clean ──

clean:
	rm -rf .aws-sam/
	rm -rf frontend/out/ frontend/.next/
	rm -rf layers/
	find . -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
