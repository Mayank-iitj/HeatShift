<div align="center">
  <img src="frontend/public/sun.svg" alt="HeatShift Logo" width="120" />
  <h1><strong>HeatShift</strong></h1>
  <p><strong>AI-Driven, Hyper-Local Heat Risk Management Platform</strong></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
  [![AWS SAM](https://img.shields.io/badge/AWS-SAM-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/serverless/sam/)
  [![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Cedar](https://img.shields.io/badge/Policy-Cedar-be123c)](https://www.cedarpolicy.com/)
  
  <br />
  <em>Winner of the WeMakeDevs x AWS Environmental Hacks (Track 02: Heat and Water).</em>
  <br /><br />
</div>

---

## 🌪️ The Problem
Climate change is exacerbating extreme heat waves, transforming outdoor labor from difficult to deadly. Generalized, city-wide weather warnings fall short because micro-climates, human demographics, and specific labor conditions dictate the true risk.

## 🛡️ The Solution
**HeatShift** is a state-of-the-art platform that dynamically shifts work hours away from deadly heat peaks. By combining hyper-local weather reanalysis, advanced risk algorithms, and autonomous AI agents, it guarantees the safety of vulnerable outdoor workforces.

---

## ✨ Premium Features

- **AI-Agentic Planning** 🧠  
  Uses **Amazon Bedrock (Claude 3 Haiku)** via the **Strands Agents SDK** to intelligently and dynamically replan work-rest cycles around peak heat hours.
  
- **Policy-as-Code Safety Vault** 🔒  
  LLMs can hallucinate. HeatShift prevents this by running all AI-generated schedules through rigorous **Cedar Policies**, guaranteeing that no unsafe shift ever makes it to the workforce.

- **Hyper-Local Risk Engine** 🌡️  
  We calculate the **Stull Wet-Bulb Approximation (2011)** for 12 local zones and apply real-world offsets (lack of shade, heavy labor, age demographics) to generate an accurate Risk Tier (0-3).

- **Cinematic, High-End UI/UX** 🎨  
  An ultra-premium Next.js frontend built to wow.
  - Interactive **WebGL Plasma** backgrounds powered by `ogl`
  - Fluid **GSAP** driven dropdown `CardNav`
  - Spring-physics **Magnetic** buttons and trailing **Custom Cursors**
  - Smooth reveal animations via `motion/react`

- **Bilingual & Multi-Channel Alerts** 📲  
  Automatically dispatches localized alerts to site managers in both English and Hindi via **Telegram Webhooks**.

---

## 🏗️ Architecture & Tech Stack

The architecture is heavily optimized for scalability, relying completely on Serverless patterns.

### 🎨 Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Vanilla CSS Modules
- **Animations & WebGL:** GSAP, Framer Motion (`motion/react`), `ogl` (React Bits)
- **Icons:** Lucide-React & React-Icons

### ⚙️ Backend (AWS SAM)
- **Compute:** AWS Lambda, AWS Step Functions (for Replay Mode)
- **Database:** DynamoDB (Single-table design with DynamoDB Streams for event-driven flows)
- **AI / LLM:** Amazon Bedrock (`anthropic.claude-3-haiku-20240307-v1:0`)
- **Policy Engine:** `cedarpy` (AWS Cedar)
- **Infrastructure as Code:** AWS SAM (`template.yaml`)

---

## 🚀 Quick Start Guide

### 1. Backend Deployment
Deploy the full serverless stack to AWS using the SAM CLI:
```bash
# Install Python dependencies
make install

# Build the SAM application
make build

# Deploy to AWS (interactive)
sam deploy --guided
```

### 2. Seed Demo Data
To test the platform, populate DynamoDB with initial zones and demo configurations:
```bash
make seed
```

### 3. Frontend Development
Launch the cinematic UI locally:
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:3000` to interact with the platform.

---

## 📂 Repository Structure

| Directory | Description |
|-----------|-------------|
| `/backend` | Core Lambda functions, common utilities, and the Bedrock AI Agent. |
| `/backend/policies` | `.cedar` policy files defining the rigid safety constraints. |
| `/frontend` | The Next.js web application and premium UI components. |
| `/statemachines` | ASL JSON definitions for the Step Functions replay engine. |
| `/scripts` | Data ingestion pipelines, smoke tests, and DynamoDB seeders. |
| `/docs` | Setup checklists and architecture diagrams. |

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

<div align="center">
  <br />
  <i>Protecting the vulnerable. One shift at a time.</i>
</div>
