# TrancheFlow AI — Autonomous B2B Milestone Escrow, Invoice Nudge & Schedule Dependency OS

> **Built for the PayPal AI Hackathon** • Powered by **PayPal Agent Toolkit (`@paypal/agent-toolkit`)**, **PayPal REST Sandbox APIs (Invoicing v2, Orders v2, Payouts v1, Disputes v1)**, **AG Grid (`ag-grid-react`)**, and **APIMatic (`@paypal/paypal-server-sdk`)**.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](./LICENSE)
[![PayPal Sandbox](https://img.shields.io/badge/PayPal-Agent_Toolkit_&_REST_v2-0070BA)](https://developer.paypal.com)
[![AG Grid](https://img.shields.io/badge/AG_Grid-v32_Enterprise_Polish-00B4D8)](https://www.ag-grid.com)
[![APIMatic](https://img.shields.io/badge/APIMatic-OpenAPI_3.1_Validated-10B981)](https://www.apimatic.io)

---

## 1. The Problem We Solve
Mid-market operations, hardware, and AI engineering teams manage dozens of milestone-based vendor contracts simultaneously. Today, finance teams manually audit invoices against rate cards in static spreadsheets, chase unpaid co-op tranches, and manually release supplier payouts—while engineering managers have zero visibility into how an unpaid or disputed PayPal invoice blocks downstream project dependencies.

**TrancheFlow AI** unifies **B2B Treasury Management**, **Autonomous PayPal Money Movement**, and **Critical-Path Schedule Governance** into a single self-healing financial terminal:
1. **Autonomous Rate-Card Guardrails & Invoice v2 Restructure:** AI agents audit every incoming supplier milestone against signed contract rate cards. When an overage or duplicate surcharge is detected (e.g., `+$2,400` GPU cluster overbill), TrancheFlow automatically invokes **PayPal Invoicing v2 (`/v2/invoicing/invoices`)** to issue a corrected milestone invoice, dispatches a smart reminder with a 2% early-settlement incentive, and renders a live **PayPal Settlement QR Code**.
2. **Autonomous PayPal Batch Payouts & Escrow Orders:** When deliverables pass verification, the agent executes **PayPal Payouts v1 (`/v1/payments/payouts`)** and **PayPal Orders v2 (`/v2/checkout/orders`)** in real time.
3. **Payment-Gated Dependency Timeline:** Unpaid or disputed PayPal tranches automatically lock dependent engineering phases and quantify schedule slip risk (`+4d` to `+7d`). The millisecond a PayPal Sandbox invoice or payout settles, downstream phases automatically unlock.

---

## 2. System Architecture

```mermaid
graph LR
  A[B2B Milestones & Contracts] --> B[AG Grid Treasury Terminal]
  B --> C[TrancheFlow AI Agent Engine]
  C --> D[@paypal/agent-toolkit & REST v2]
  C --> E[APIMatic Schema & SDK Validator]
  D --> F[PayPal Invoices v2 & QR Codes]
  D --> G[PayPal Orders v2 & Batch Payouts]
  F --> B
  G --> B
```

---

## 3. Sponsor Integrations & Direct Code Deep-Links

| Sponsor / Track | Packages & Endpoints Used | Direct Source Code Deep-Link | Role on Critical Path |
| :--- | :--- | :--- | :--- |
| **PayPal Developer Platform & Agentic Commerce** | `@paypal/agent-toolkit`, `/v2/invoicing/invoices`, `/v2/checkout/orders`, `/v1/payments/payouts`, `/v1/customer/disputes` | [`src/lib/paypal-agent.ts`](./src/lib/paypal-agent.ts) & [`src/app/api/paypal/execute/route.ts`](./src/app/api/paypal/execute/route.ts) | Executes autonomous invoice restructuring, live QR code generation, escrow order capture, and batch vendor payouts with deterministic VCR fallback. |
| **AG Grid** | `ag-grid-react`, `ag-grid-community` | [`src/components/TreasuryTerminal.tsx`](./src/components/TreasuryTerminal.tsx) | Primary interactive treasury ledger featuring custom 7-day SVG cost velocity sparkline cells, AI policy status pills, pinned bottom grand-total aggregation row, `enableCellChangeFlash` animations, and cross-filtering custom widgets. |
| **APIMatic** | `@paypal/paypal-server-sdk` | [`src/lib/apimatic-validator.ts`](./src/lib/apimatic-validator.ts) | Validates every outgoing PayPal v2 Invoicing, v2 Orders, and v1 Payouts payload against APIMatic's OpenAPI 3.1 contract specification and generates live TypeScript SDK & cURL verification code. |

---

## 4. ⚡ 1-Click Judge Testing Instructions

No login, signup, or credit card entry is required to evaluate TrancheFlow AI:
1. Open the live hosted URL (or run `npm install && npm run dev` locally).
2. Click **`⚡ 1-Click Judge Demo Mode`** in the top-right command bar to seed 8 active B2B engineering & supply-chain tranches (`$164,500` contract volume) and execute an instant autonomous audit on Row `TR-101`.
3. Click **`Restructure + QR`** on any `OVERBILL FLAGGED` row in the **AG Grid** table to generate a corrected **PayPal Sandbox Invoice v2 + QR Code** and inspect the raw JSON response and `PAYPAL-DEBUG-ID` in the right-hand **Protocol Inspector**.
4. Click **`🤖 Run Autonomous Settlement Sweep`** to batch-settle all actionable milestones via PayPal Sandbox APIs, watch AG Grid cells flash emerald green, and switch to the **`Critical-Path Dependency Timeline`** tab to see all blocked engineering phases unlock.

---

## 5. Local Development & Optional Live Sandbox Keys

```bash
git clone https://github.com/w3joe/trancheflow-ai.git
cd trancheflow-ai
npm install
# Optional: Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local for live Sandbox credentials
# (Deterministic Sandbox VCR mode runs out-of-the-box with zero config)
npm run dev
```

## License
MIT License — see [`LICENSE`](./LICENSE).
