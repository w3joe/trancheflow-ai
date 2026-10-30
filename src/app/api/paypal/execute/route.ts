import { NextResponse } from "next/server";
import { executePayPalAgentAction } from "@/lib/paypal-agent";
import type { MilestoneTranche } from "@/types/contracts";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action: "RESTRUCTURE_INVOICE" | "BATCH_PAYOUT" | "OPEN_DISPUTE_HOLD";
      tranche: MilestoneTranche;
    };

    const trace = await executePayPalAgentAction(body.action, body.tranche);
    return NextResponse.json({ ok: true, trace });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Execution error" },
      { status: 500 }
    );
  }
}
