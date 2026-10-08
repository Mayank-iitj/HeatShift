# HeatShift Setup Checklist

Complete these steps before deploying.

## Prerequisites

- [ ] AWS CLI installed and configured with `ap-south-1` region
- [ ] AWS SAM CLI installed (`sam --version`)
- [ ] Python 3.12 installed
- [ ] Node.js 18+ installed (for frontend)
- [ ] Docker installed (for `sam build --use-container`)

## AWS Account Setup

- [ ] Enable Bedrock model access in `ap-south-1`:
  - Go to AWS Console → Bedrock → Model access
  - Request access to `anthropic.claude-3-haiku-20240307-v1:0`
  - **Verification result:** _(fill in: granted / pending / using cross-region)_
  - If model is not available in `ap-south-1`, set up cross-region inference profile
    and update `BEDROCK_MODEL_ID` accordingly.

## Telegram Bot

- [ ] Create a Telegram bot via @BotFather:
  - Send `/newbot` to @BotFather
  - Choose name: `HeatShift Bot` (or similar)
  - Save the token
  - **Bot username:** _(fill in)_
- [ ] Store token in SSM Parameter Store:
  ```bash
  aws ssm put-parameter --name /heatshift/telegram-token --type SecureString --value "YOUR_TOKEN"
  ```
- [ ] Generate and store webhook secret:
  ```bash
  aws ssm put-parameter --name /heatshift/telegram-secret --type SecureString --value "$(openssl rand -hex 32)"
  ```
- [ ] Set webhook URL after deployment:
  ```bash
  curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<API_URL>/telegram/webhook&secret_token=<SECRET>"
  ```

## Deployment

- [ ] Copy `.env.example` to `.env` and fill in values
- [ ] Run `make build`
- [ ] Run `make deploy`
- [ ] Note the outputs:
  - REST API URL: _(fill in)_
  - WebSocket URL: _(fill in)_
  - CloudFront URL: _(fill in)_
- [ ] Set Telegram webhook URL (see above)
- [ ] Run `make seed` to create demo sites
- [ ] Run `make smoke` to verify deployment

## Verification

- [ ] Open CloudFront URL — dashboard loads
- [ ] Zones show current risk tiers
- [ ] Register a test site
- [ ] Link Telegram bot with `/start <CODE>`
- [ ] Trigger replan and verify alert received
- [ ] Start a replay and watch tiers change
- [ ] Confirm shift change and verify exposure counter updates

## Cost Monitoring

- [ ] Budget alarm set at $10/month
- [ ] CloudWatch dashboard accessible
- [ ] No NAT gateways or always-on compute provisioned
