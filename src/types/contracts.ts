export type TrancheStatus =
  | "OVERBILL_FLAGGED"
  | "READY_FOR_PAYOUT"
  | "INVOICE_UNPAID"
  | "DISPUTE_HOLD"
  | "SETTLED_SANDBOX"
  | "INVOICE_RESTRUCTURED";

export type PayPalMethodType = "INVOICE_V2" | "ORDER_V2" | "PAYOUT_V1" | "DISPUTE_V1";

export interface MilestoneTranche {
  id: string;
  vendorName: string;
  vendorEmail: string;
  category: "AI Compute" | "Hardware & IoT" | "Security Audit" | "Design & Frontend" | "Logistics";
  milestoneTitle: string;
  dependentPhase: string;
  scheduleImpactDays: number;
  contractRateUsd: number;
  billedAmountUsd: number;
  settledAmountUsd: number;
  aiSavingsUsd: number;
  aiConfidence: number;
  aiAuditNote: string;
  status: TrancheStatus;
  paypalMethod: PayPalMethodType;
  paypalResourceId: string;
  unitCostTrend7d: number[];
  dueDate: string;
  isGrandTotalRow?: boolean;
}

export interface ApimaticValidationReport {
  valid: boolean;
  schemaVersion: string;
  endpoint: string;
  checkedFields: string[];
  sdkSnippetTs: string;
  curlSnippet: string;
}

export interface PayPalExecutionTrace {
  traceId: string;
  timestamp: string;
  toolName:
    | "paypal_create_invoice"
    | "paypal_send_invoice_reminder"
    | "paypal_generate_invoice_qr"
    | "paypal_create_order"
    | "paypal_create_payout_batch"
    | "paypal_open_dispute_hold";
  httpMethod: "POST" | "GET";
  sandboxEndpoint: string;
  httpStatus: number;
  latencyMs: number;
  paypalDebugId: string;
  mode: "LIVE_SANDBOX" | "DETERMINISTIC_VCR_SANDBOX";
  resourceId: string;
  qrCodeSvgDataUri?: string;
  hateoasLinks: Array<{ href: string; rel: string; method: string }>;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  apimaticReport: ApimaticValidationReport;
}
