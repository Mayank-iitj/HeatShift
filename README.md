# HeatShift

An AI-driven, hyper-local heat risk management platform built on AWS, designed to protect outdoor and vulnerable labor forces during extreme heat waves.

Winner of the **WeMakeDevs x AWS Environmental Hacks** (Track 02: Heat and Water).

## Overview

HeatShift shifts work hours away from deadly heat peaks dynamically. Instead of static, generalized weather warnings, HeatShift:
1. Ingests hourly forecast and reanalysis data from Open-Meteo for 12 local zones.
2. Computes the **Stull Wet-Bulb Approximation (2011)** and applies vulnerability offsets (unshaded conditions, heavy labor, age demographics) to determine a rigorous risk tier (0-3).
3. Uses the **Strands Agents SDK** and **Amazon Bedrock (Claude 3 Haiku)** to intelligently replan work shifts away from Tier 2/3 hours.
4. Strictly enforces work safety via **Cedar Policies** (`cedarpy`), ensuring the LLM cannot hallucinate an unsafe shift.
5. Automatically notifies managers via **Telegram** with bilingual instructions and tracks confirmed **Exposure Hours Avoided**.

## Architecture

![Architecture](docs/architecture.png)
*(Note: Create an architecture.png for the repo!)*

- **Backend:** AWS SAM (Serverless Application Model)
- **Compute:** AWS Lambda, Step Functions (Replay Mode)
- **Database:** DynamoDB (Single-table patterns with Streams)
- **Auth/Policy:** Cedar
- **Frontend:** Next.js (Tailwind, Shadcn), hosted on S3 + CloudFront

## Features
- **LIVE & REPLAY Modes:** View current data or replay the peak 2024 Delhi Heat Wave.
- **Dynamic Risk Engine:** Not just temperature—accounts for humidity and human factors.
- **Agentic Planning:** Bedrock + Strands creates optimal, safe work-rest cycles.
- **Policy-as-Code Validation:** Cedar guarantees plans meet safety rules.
- **Bilingual Alerts:** English and Hindi support for broader accessibility.

## Setup Instructions

See [SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md) for detailed deployment steps.

### Quick Start
```bash
# 1. Build the backend
make build

# 2. Deploy to AWS
make deploy

# 3. Seed demo data
make seed

# 4. Start frontend locally
cd frontend
npm install
npm run dev
```

## Repository Structure
- `backend/`: Lambda functions, common layer, and Cedar policies.
- `frontend/`: Next.js application.
- `statemachines/`: ASL definitions for Step Functions.
- `scripts/`: Data pipeline and smoke tests.
- `docs/`: Architecture decisions, checklists.
- `data/`: Zone definitions and heuristic configs.

## License
MIT License. See [LICENSE](LICENSE) for details.
# HeatShift
