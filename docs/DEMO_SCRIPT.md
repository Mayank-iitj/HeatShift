# HeatShift — Demo Video Script
**Hackathon:** WeMakeDevs x AWS (Track 02: Heat and Water)
**Duration:** ~3 minutes

---

### [0:00 - 0:30] Hook & Problem Statement
**(Visuals: High-impact title slide "HeatShift". Cut to dashboard showing Delhi heat map with Red "Extreme" zones).**

*Speaker:* "Every summer, extreme heat waves bring city infrastructure and outdoor labor to a standstill. In Delhi alone, temperatures regularly exceed 45 degrees Celsius, creating life-threatening conditions for construction workers, delivery personnel, and street vendors. But what if we could intelligently shift work schedules to safely navigate these extremes?"

*Speaker:* "Meet HeatShift. HeatShift is an AI-driven, hyper-local heat risk management platform built on AWS. It uses real-time forecast data, dynamically plans safe shifts, and strictly enforces work safety policies using Cedar."

### [0:30 - 1:15] The Architecture & Live Data
**(Visuals: Quick architecture diagram showing Open-Meteo -> DynamoDB -> Step Functions -> Lambda -> WebSocket -> Next.js. Transition to the live dashboard).**

*Speaker:* "The dashboard you see here is powered by real data. There are no hardcoded mocks. We continuously ingest hourly forecasts from Open-Meteo and compute a rigorous, localized heat-risk tier for 12 zones in Delhi using the Stull wet-bulb approximation formula."

*Speaker:* "Notice the persistent badge in the top right. Right now, it says `LIVE`. But for this demo, we've built a historical `REPLAY` mode using AWS Step Functions and ERA5 ground-truth data from the peak of the 2024 heat wave, letting us see HeatShift in action under extreme stress."

### [1:15 - 2:00] AI Planning & Cedar Validation
**(Visuals: Click on a "Replan" button for a specific construction site. Show the Bedrock trace modal. Show the generated schedule).**

*Speaker:* "When a zone enters Tier 2 or 3, HeatShift springs into action. Using the Strands Agent SDK and Amazon Bedrock, our system acts as a planner. It analyzes the site's vulnerability—like unshaded labor or older worker demographics—and reschedules the shift to cooler hours."

*Speaker:* "But AI can hallucinate, right? Not here. Every single work block proposed by the LLM must pass a strict authorization check governed by Cedar safety policies. If a proposed shift violates a rule—like scheduling heavy labor during peak sun—the agent is forced to repair the plan until Cedar explicitly permits it."

### [2:00 - 2:30] Alerting & Action
**(Visuals: Show Telegram split-screen. A notification pops up in Telegram with the new shift and an inline confirm button. The user clicks "Confirm Shift Change").**

*Speaker:* "Once a safe plan is formulated, it's instantly dispatched to site managers via Telegram and WebSocket. The manager reviews the bilingual instructions—including nearest cooling points—and confirms."

**(Visuals: Dashboard exposure metrics increment dynamically).**

*Speaker:* "The moment they confirm, HeatShift calculates the exact number of exposure hours avoided. Our backend dynamically tracks these metrics, proving the tangible safety impact."

### [2:30 - 3:00] Conclusion & Backtest
**(Visuals: Show a snippet of the backtest.json terminal output or a chart).**

*Speaker:* "We didn't just build this on a hunch. We ran a full backtest against 90 days of historical data, scoring our Open-Meteo ingestion against ERA5 reanalysis to ensure high recall for heat event prediction."

*Speaker:* "HeatShift proves that with AWS, Cedar, and agentic AI, we can stop reacting to extreme heat, and start adapting to it intelligently. Thank you."
