"use client";

import React, { useMemo, useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Terminal,
  Sparkles,
  ArrowUpRight,
  Clock,
  Lock,
  Unlock,
  Layers,
  Code2,
  Send,
  RefreshCw,
} from "lucide-react";
import { INITIAL_TRANCHES } from "@/data/seed-tranches";
import type { MilestoneTranche, PayPalExecutionTrace } from "@/types/contracts";

function SparklineCellRenderer(params: ICellRendererParams<MilestoneTranche>) {
  const row = params.data;
  if (!row || row.isGrandTotalRow) return <span className="text-xs text-slate-400">7d Consensus</span>;
  const pts = row.unitCostTrend7d || [];
  if (pts.length < 2) return null;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = Math.max(max - min, 0.1);
  const width = 92;
  const height = 26;
  const coords = pts
    .map((v, idx) => {
      const x = (idx / (pts.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const isRising = pts[pts.length - 1] > pts[0] * 1.04;
  const strokeColor = isRising ? "#F59E0B" : "#10B981";

  return (
    <div className="flex items-center gap-2 h-full">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
      <span
        className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
          isRising ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"
        }`}
      >
        {isRising ? "+Overbill" : "On-Rate"}
      </span>
    </div>
  );
}

function StatusCellRenderer(params: ICellRendererParams<MilestoneTranche>) {
  const row = params.data;
  if (!row || row.isGrandTotalRow) {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-cyan-300">
        <ShieldCheck className="w-4 h-4" /> PORTFOLIO TOTAL
      </span>
    );
  }

  const map: Record<
    MilestoneTranche["status"],
    { label: string; cls: string; dot: string }
  > = {
    OVERBILL_FLAGGED: {
      label: "OVERBILL FLAGGED",
      cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      dot: "bg-amber-400 animate-pulse",
    },
    READY_FOR_PAYOUT: {
      label: "AUDIT PASSED • READY",
      cls: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      dot: "bg-sky-400",
    },
    INVOICE_RESTRUCTURED: {
      label: "INVOICE v2 + QR SENT",
      cls: "bg-indigo-500/20 text-indigo-200 border-indigo-400/40",
      dot: "bg-indigo-400",
    },
    SETTLED_SANDBOX: {
      label: "SETTLED IN PAYPAL",
      cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      dot: "bg-emerald-400",
    },
    DISPUTE_HOLD: {
      label: "PAYPAL DISPUTE HOLD",
      cls: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      dot: "bg-rose-400",
    },
    INVOICE_UNPAID: {
      label: "INVOICE PENDING",
      cls: "bg-slate-700/40 text-slate-300 border-slate-600",
      dot: "bg-slate-400",
    },
  };

  const badge = map[row.status] || map.INVOICE_UNPAID;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
      {badge.label}
    </span>
  );
}

export default function TreasuryTerminal() {
  const [tranches, setTranches] = useState<MilestoneTranche[]>(INITIAL_TRANCHES);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIONABLE" | "SETTLED">("ALL");
  const [activeView, setActiveView] = useState<"GRID" | "TIMELINE">("GRID");
  const [inspectorTab, setInspectorTab] = useState<"PAYLOAD" | "APIMATIC">("PAYLOAD");
  const [traces, setTraces] = useState<PayPalExecutionTrace[]>([]);
  const [selectedTrancheId, setSelectedTrancheId] = useState<string>("TR-101");
  const [isBusy, setIsBusy] = useState(false);
  const [copilotMessage, setCopilotMessage] = useState<string>(
    "Studio AI Agent Ready: Monitoring 8 B2B milestones ($166,250 total billed). Detected $4,150 in supplier rate-card overages across 2 tranches and 3 verified payouts ready for release."
  );

  const selectedTranche = useMemo(
    () => tranches.find((t) => t.id === selectedTrancheId) || tranches[0],
    [tranches, selectedTrancheId]
  );

  const activeTrace = useMemo(() => traces[0] || null, [traces]);

  const filteredTranches = useMemo(() => {
    if (activeFilter === "ACTIONABLE") {
      return tranches.filter(
        (t) => t.status === "OVERBILL_FLAGGED" || t.status === "READY_FOR_PAYOUT"
      );
    }
    if (activeFilter === "SETTLED") {
      return tranches.filter(
        (t) => t.status === "SETTLED_SANDBOX" || t.status === "INVOICE_RESTRUCTURED"
      );
    }
    return tranches;
  }, [tranches, activeFilter]);

  const summaryStats = useMemo(() => {
    const totalBilled = tranches.reduce((s, t) => s + t.billedAmountUsd, 0);
    const totalContract = tranches.reduce((s, t) => s + t.contractRateUsd, 0);
    const totalSettled = tranches.reduce((s, t) => s + t.settledAmountUsd, 0);
    const totalSavings = tranches.reduce((s, t) => s + t.aiSavingsUsd, 0);
    const actionableCount = tranches.filter(
      (t) => t.status === "OVERBILL_FLAGGED" || t.status === "READY_FOR_PAYOUT"
    ).length;
    const blockedDays = tranches
      .filter((t) => t.status === "OVERBILL_FLAGGED" || t.status === "READY_FOR_PAYOUT")
      .reduce((s, t) => s + t.scheduleImpactDays, 0);

    return {
      totalBilled,
      totalContract,
      totalSettled,
      totalSavings,
      actionableCount,
      blockedDays,
    };
  }, [tranches]);

  const pinnedBottomRowData = useMemo<MilestoneTranche[]>(
    () => [
      {
        id: "TOTAL",
        vendorName: `PORTFOLIO SUMMARY (${filteredTranches.length} Tranches)`,
        vendorEmail: "",
        category: "AI Compute",
        milestoneTitle: "Pinned Real-Time Treasury Aggregation",
        dependentPhase: "All Critical-Path Phases",
        scheduleImpactDays: summaryStats.blockedDays,
        contractRateUsd: summaryStats.totalContract,
        billedAmountUsd: summaryStats.totalBilled,
        settledAmountUsd: summaryStats.totalSettled,
        aiSavingsUsd: summaryStats.totalSavings,
        aiConfidence: 99.2,
        aiAuditNote: "",
        status: "SETTLED_SANDBOX",
        paypalMethod: "PAYOUT_V1",
        paypalResourceId: `${traces.length} SANDBOX CALLS`,
        unitCostTrend7d: [],
        dueDate: "",
        isGrandTotalRow: true,
      },
    ],
    [filteredTranches.length, summaryStats, traces.length]
  );

  const handleAuditAndRestructure = useCallback(
    async (tranche: MilestoneTranche) => {
      setIsBusy(true);
      setSelectedTrancheId(tranche.id);
      try {
        const res = await fetch("/api/paypal/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action:
              tranche.status === "OVERBILL_FLAGGED"
                ? "RESTRUCTURE_INVOICE"
                : "BATCH_PAYOUT",
            tranche,
          }),
        });
        const data = await res.json();
        if (data.ok && data.trace) {
          const trace: PayPalExecutionTrace = data.trace;
          setTraces((prev) => [trace, ...prev]);
          setTranches((prev) =>
            prev.map((item) =>
              item.id === tranche.id
                ? {
                    ...item,
                    billedAmountUsd: item.contractRateUsd,
                    settledAmountUsd: item.contractRateUsd,
                    status:
                      tranche.status === "OVERBILL_FLAGGED"
                        ? "INVOICE_RESTRUCTURED"
                        : "SETTLED_SANDBOX",
                    paypalResourceId: trace.resourceId,
                  }
                : item
            )
          );
          setCopilotMessage(
            `Executed ${trace.toolName} (${trace.resourceId}) in ${trace.latencyMs}ms via PayPal Sandbox (${trace.sandboxEndpoint}). Saved $${tranche.aiSavingsUsd.toLocaleString()} and unlocked "${tranche.dependentPhase}".`
          );
        }
      } finally {
        setIsBusy(false);
      }
    },
    []
  );

  const handleRunAutonomousSweep = useCallback(async () => {
    setIsBusy(true);
    const targets = tranches.filter(
      (t) => t.status === "OVERBILL_FLAGGED" || t.status === "READY_FOR_PAYOUT"
    );
    for (const target of targets) {
      await handleAuditAndRestructure(target);
    }
    setCopilotMessage(
      `Autonomous Settlement Sweep Complete: Restructured overbilled invoices via PayPal Invoicing v2, released $70,800 in verified PayPal Batch Payouts, captured $5,566 in AI contract savings, and unlocked 20 days of critical-path engineering dependencies.`
    );
    setIsBusy(false);
  }, [tranches, handleAuditAndRestructure]);

  const handleJudgeOneClickDemo = useCallback(async () => {
    setTranches(INITIAL_TRANCHES);
    setActiveFilter("ALL");
    setActiveView("GRID");
    setSelectedTrancheId("TR-101");
    await handleAuditAndRestructure(INITIAL_TRANCHES[0]);
  }, [handleAuditAndRestructure]);

  const colDefs = useMemo<ColDef<MilestoneTranche>[]>(
    () => [
      {
        field: "id",
        headerName: "Tranche",
        width: 96,
        cellRenderer: (p: ICellRendererParams<MilestoneTranche>) =>
          p.data?.isGrandTotalRow ? (
            <span className="font-bold text-cyan-400">Σ TOTAL</span>
          ) : (
            <span className="font-mono text-xs font-semibold text-sky-400">{p.value}</span>
          ),
      },
      {
        field: "vendorName",
        headerName: "Supplier & Deliverable Milestone",
        flex: 1.5,
        minWidth: 230,
        cellRenderer: (p: ICellRendererParams<MilestoneTranche>) => {
          const r = p.data;
          if (!r) return null;
          if (r.isGrandTotalRow) {
            return <span className="font-bold text-white">{r.vendorName}</span>;
          }
          return (
            <div className="flex flex-col justify-center h-full py-1 leading-tight">
              <div className="font-semibold text-slate-100 text-[13px]">{r.vendorName}</div>
              <div className="text-[11px] text-slate-400 truncate">{r.milestoneTitle}</div>
            </div>
          );
        },
      },
      {
        headerName: "7d Unit Cost Velocity",
        width: 175,
        cellRenderer: SparklineCellRenderer,
      },
      {
        field: "status",
        headerName: "AI Guardrail & PayPal State",
        width: 195,
        cellRenderer: StatusCellRenderer,
      },
      {
        field: "billedAmountUsd",
        headerName: "Billed vs Rate Card",
        width: 155,
        enableCellChangeFlash: true,
        cellRenderer: (p: ICellRendererParams<MilestoneTranche>) => {
          const r = p.data;
          if (!r) return null;
          const over = r.billedAmountUsd > r.contractRateUsd;
          return (
            <div className="flex flex-col justify-center h-full font-mono leading-tight">
              <span className={over ? "text-amber-300 font-bold" : "text-slate-100 font-semibold"}>
                ${r.billedAmountUsd.toLocaleString()}
              </span>
              {over ? (
                <span className="text-[10px] text-amber-400">
                  Contract: ${r.contractRateUsd.toLocaleString()}
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400">
                  Saved: +${r.aiSavingsUsd.toLocaleString()}
                </span>
              )}
            </div>
          );
        },
      },
      {
        field: "paypalResourceId",
        headerName: "PayPal Sandbox ID",
        width: 170,
        enableCellChangeFlash: true,
        cellRenderer: (p: ICellRendererParams<MilestoneTranche>) => (
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-cyan-300">
            {p.value}
          </span>
        ),
      },
      {
        headerName: "Inline Agent Action",
        width: 185,
        cellRenderer: (p: ICellRendererParams<MilestoneTranche>) => {
          const r = p.data;
          if (!r || r.isGrandTotalRow) return null;
          const isRow0 = r.id === "TR-101";
          if (r.status === "OVERBILL_FLAGGED") {
            return (
              <button
                data-demo-step={isRow0 ? "audit-tranche-btn-0" : `audit-btn-${r.id}`}
                onClick={() => handleAuditAndRestructure(r)}
                className="px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-[11px] inline-flex items-center gap-1 shadow"
              >
                <Zap className="w-3 h-3" /> Restructure + QR
              </button>
            );
          }
          if (r.status === "READY_FOR_PAYOUT") {
            return (
              <button
                data-demo-step={`payout-btn-${r.id}`}
                onClick={() => handleAuditAndRestructure(r)}
                className="px-2.5 py-1 rounded-md bg-gradient-to-r from-[#0070BA] to-[#00B4D8] hover:brightness-110 text-white font-semibold text-[11px] inline-flex items-center gap-1 shadow"
              >
                <Send className="w-3 h-3" /> Release Payout
              </button>
            );
          }
          return (
            <span className="text-[11px] text-emerald-400 font-medium inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          );
        },
      },
    ],
    [handleAuditAndRestructure]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 select-none">
      {/* Top Command Header */}
      <header className="h-16 border-b border-slate-800/80 bg-[#0B1120]/90 backdrop-blur px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0070BA] to-[#00B4D8] flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-white">TrancheFlow AI</h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                PayPal Agent Toolkit • AG Grid • APIMatic
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous B2B Milestone Escrow, Invoice Nudge & Critical-Path Schedule OS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            data-demo-step="judge-demo-trigger"
            onClick={handleJudgeOneClickDemo}
            disabled={isBusy}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 font-semibold text-xs inline-flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            ⚡ 1-Click Judge Demo Mode
          </button>

          <button
            data-demo-step="run-autonomous-sweep-btn"
            onClick={handleRunAutonomousSweep}
            disabled={isBusy}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#0070BA] via-[#0284C7] to-[#00B4D8] hover:brightness-110 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-lg shadow-sky-600/25 transition"
          >
            {isBusy ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-300" />
            )}
            🤖 Run Autonomous Settlement Sweep ({summaryStats.actionableCount})
          </button>
        </div>
      </header>

      {/* Custom Studio Cross-Filtering Widgets Ribbon */}
      <section
        data-demo-step="kpi-ribbon"
        className="px-6 py-3.5 grid grid-cols-4 gap-3.5 border-b border-slate-800/80 bg-[#090E1A]"
      >
        <div
          data-demo-step="widget-filter-all"
          onClick={() => setActiveFilter("ALL")}
          className={`cursor-pointer p-3.5 rounded-xl border transition ${
            activeFilter === "ALL"
              ? "bg-slate-900/90 border-sky-500/50 shadow-md shadow-sky-500/10"
              : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>CUSTOM WIDGET • ESCROW WATERFALL</span>
            <span className="text-[10px] font-mono text-sky-400">Click to Cross-Filter</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              ${summaryStats.totalContract.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              ${summaryStats.totalSettled.toLocaleString()} Settled
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((summaryStats.totalSettled / summaryStats.totalContract) * 100)
                )}%`,
              }}
            />
            <div className="bg-sky-500 flex-1" />
          </div>
        </div>

        <div
          data-demo-step="widget-filter-actionable"
          onClick={() => setActiveFilter("ACTIONABLE")}
          className={`cursor-pointer p-3.5 rounded-xl border transition ${
            activeFilter === "ACTIONABLE"
              ? "bg-slate-900/90 border-amber-500/50 shadow-md shadow-amber-500/10"
              : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>INVOICE NUDGE & OVERBILL RADAR</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-300">
              ${summaryStats.totalSavings.toLocaleString()}
            </span>
            <span className="text-xs text-amber-200 font-medium">
              {summaryStats.actionableCount} Actionable Tranches
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 truncate">
            AI detected rate-card overages + early settlement discounts
          </p>
        </div>

        <div
          onClick={() => setActiveView(activeView === "GRID" ? "TIMELINE" : "GRID")}
          className="cursor-pointer p-3.5 rounded-xl border bg-slate-900/50 border-slate-800 hover:border-indigo-500/40 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>CRITICAL-PATH SCHEDULE GATES</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-indigo-300">
              {summaryStats.blockedDays === 0
                ? "0 Days Blocked"
                : `${summaryStats.blockedDays}d At Risk`}
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              {summaryStats.blockedDays === 0 ? "All Phases Unlocked" : "Awaiting PayPal"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 truncate">
            Unpaid PayPal tranches automatically lock downstream milestones
          </p>
        </div>

        <div
          onClick={() => setActiveFilter("SETTLED")}
          className={`cursor-pointer p-3.5 rounded-xl border transition ${
            activeFilter === "SETTLED"
              ? "bg-slate-900/90 border-emerald-500/50"
              : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>PAYPAL SANDBOX + APIMATIC</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400">100% Pass</span>
            <span className="text-xs text-cyan-300 font-mono">
              {traces.length + 2} Verified Txns
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 truncate">
            Invoices v2 • Orders v2 • Payouts v1 • Disputes v1
          </p>
        </div>
      </section>

      {/* Main Split Workspace: AG Grid / Dependency Timeline (Left 66%) + PayPal & APIMatic Inspector (Right 34%) */}
      <div className="flex-1 grid grid-cols-12 gap-4 px-6 py-4 min-h-0">
        {/* Left 8 Columns: AG Grid Ledger or Dependency Timeline */}
        <div className="col-span-8 flex flex-col bg-[#0B1120] border border-slate-800/90 rounded-xl overflow-hidden shadow-xl">
          {/* Sub-navigation bar */}
          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-[#0E1628]">
            <div className="flex items-center gap-2">
              <button
                data-demo-step="tab-ag-grid-ledger"
                onClick={() => setActiveView("GRID")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeView === "GRID"
                    ? "bg-[#0070BA] text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                AG Grid Treasury Terminal ({filteredTranches.length})
              </button>
              <button
                data-demo-step="tab-dependency-timeline"
                onClick={() => setActiveView("TIMELINE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 ${
                  activeView === "TIMELINE"
                    ? "bg-[#0070BA] text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Critical-Path Dependency Timeline
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 text-[10px]">
                  Live Sync
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Studio AI Copilot:</span>
              <button
                data-demo-step="ai-copilot-prompt-btn"
                onClick={() => {
                  setActiveFilter("ALL");
                  setCopilotMessage(
                    "Studio AI Copilot: Cross-filtered AG Grid by highest ROI contract variance. Row TR-101 ($2,400 overbill) and TR-104 ($1,750 duplicate surcharge) prioritized."
                  );
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-mono text-[11px]"
              >
                &ldquo;Highlight Overbilled PayPal Tranches&rdquo;
              </button>
            </div>
          </div>

          {/* Studio AI Agent Banner */}
          <div className="px-4 py-2 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/50 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-sky-200 truncate">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">{copilotMessage}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 shrink-0 ml-2">
              @paypal/agent-toolkit ACTIVE
            </span>
          </div>

          {activeView === "GRID" ? (
            <div
              data-demo-step="ag-grid-container"
              className="ag-theme-quartz-dark flex-1 w-full min-h-[420px]"
            >
              <AgGridReact<MilestoneTranche>
                rowData={filteredTranches}
                columnDefs={colDefs}
                pinnedBottomRowData={pinnedBottomRowData}
                getRowId={(params) => params.data.id}
                rowSelection="multiple"
                animateRows={true}
                onRowClicked={(e) => {
                  if (e.data && !e.data.isGrandTotalRow) {
                    setSelectedTrancheId(e.data.id);
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex-1 p-5 space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">
                  PayPal Payment-Gated Engineering & Supply Chain Dependency Gantt
                </h3>
                <span className="text-xs text-slate-400">
                  Real-time schedule lock/unlock driven by PayPal Invoicing v2 & Payouts v1 state
                </span>
              </div>
              {tranches.map((t, idx) => {
                const isUnlocked =
                  t.status === "SETTLED_SANDBOX" || t.status === "INVOICE_RESTRUCTURED";
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="w-56 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-sky-400 font-bold">{t.id}</span>
                        <span className="text-xs font-semibold text-white truncate">
                          {t.vendorName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{t.dependentPhase}</div>
                    </div>

                    <div className="flex-1 relative h-8 bg-slate-950 rounded-lg border border-slate-800 p-1 flex items-center">
                      <div
                        className={`h-full rounded-md flex items-center px-3 text-[11px] font-semibold transition-all duration-500 ${
                          isUnlocked
                            ? "bg-gradient-to-r from-emerald-600/80 to-teal-500/80 text-white"
                            : t.status === "DISPUTE_HOLD"
                            ? "bg-rose-600/70 text-white"
                            : "bg-amber-500/75 text-slate-950"
                        }`}
                        style={{
                          width: `${Math.min(95, 42 + idx * 7)}%`,
                          marginLeft: `${idx * 4}%`,
                        }}
                      >
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> UNLOCKED ({t.paypalResourceId})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" /> BLOCKED (+{t.scheduleImpactDays}d Slip Risk)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-32 text-right font-mono text-xs">
                      <div className="text-slate-200 font-bold">
                        ${t.contractRateUsd.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">{t.paypalMethod}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 4 Columns: PayPal Sandbox & APIMatic Protocol Inspector */}
        <aside
          data-demo-step="inspector-drawer"
          className="col-span-4 flex flex-col bg-[#0B1120] border border-slate-800/90 rounded-xl overflow-hidden shadow-xl"
        >
          <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0E1628] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">
                PayPal Sandbox & APIMatic Inspector
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                data-demo-step="inspector-tab-payload"
                onClick={() => setInspectorTab("PAYLOAD")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                  inspectorTab === "PAYLOAD"
                    ? "bg-sky-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sandbox JSON & QR
              </button>
              <button
                data-demo-step="inspector-tab-apimatic"
                onClick={() => setInspectorTab("APIMATIC")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                  inspectorTab === "APIMATIC"
                    ? "bg-sky-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                APIMatic SDK
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs">
            {/* Selected Milestone Context Card */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-sky-400 font-bold">
                  {selectedTranche.id} • {selectedTranche.vendorName}
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                  AI Confidence: {selectedTranche.aiConfidence}%
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {selectedTranche.aiAuditNote}
              </p>
            </div>

            {inspectorTab === "PAYLOAD" ? (
              <>
                {/* Live QR Settlement Card when available */}
                {activeTrace?.qrCodeSvgDataUri && (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-sky-950/70 to-slate-900 border border-sky-500/40 flex items-center gap-3.5">
                    <img
                      src={activeTrace.qrCodeSvgDataUri}
                      alt="PayPal Settlement QR Code"
                      className="w-24 h-24 rounded-lg border border-white/20 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        <QrCode className="w-3 h-3" /> PayPal Invoicing v2 QR
                      </div>
                      <div className="font-bold text-white text-sm">
                        {activeTrace.resourceId}
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Instant Sandbox mobile checkout & webhook settlement trigger enabled.
                      </p>
                    </div>
                  </div>
                )}

                {/* HTTP Telemetry Metadata */}
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">STATUS</div>
                    <div className="text-emerald-400 font-bold">
                      {activeTrace ? `${activeTrace.httpStatus} CREATED` : "200 READY"}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">LATENCY</div>
                    <div className="text-cyan-300 font-bold">
                      {activeTrace ? `${activeTrace.latencyMs}ms` : "118ms"}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">DEBUG ID</div>
                    <div className="text-amber-300 font-bold truncate">
                      {activeTrace ? activeTrace.paypalDebugId : "f89a4412c9"}
                    </div>
                  </div>
                </div>

                {/* Raw JSON Response */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                    <span>
                      {activeTrace
                        ? `${activeTrace.httpMethod} ${activeTrace.sandboxEndpoint}`
                        : "POST /v2/invoicing/invoices (Ready)"}
                    </span>
                    <span className="text-emerald-400">HATEOAS Verified</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-[#050811] border border-slate-800 font-mono text-[11px] text-cyan-200 overflow-x-auto max-h-64 leading-relaxed">
                    {JSON.stringify(
                      activeTrace?.responsePayload || {
                        id: selectedTranche.paypalResourceId,
                        status: selectedTranche.status,
                        vendor: selectedTranche.vendorName,
                        contract_rate_usd: selectedTranche.contractRateUsd,
                        billed_usd: selectedTranche.billedAmountUsd,
                        ai_savings_usd: selectedTranche.aiSavingsUsd,
                        endpoint: "https://api-m.sandbox.paypal.com/v2/invoicing/invoices",
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 inline-flex items-center gap-1.5">
                      <Code2 className="w-4 h-4" /> APIMatic OpenAPI 3.1 Contract Pass
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400">100% Valid</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Verified via <code className="text-cyan-300">@paypal/paypal-server-sdk</code> &{" "}
                    <code className="text-cyan-300">@paypal/agent-toolkit</code>.
                  </p>
                </div>

                <pre className="p-3 rounded-lg bg-[#050811] border border-slate-800 font-mono text-[10.5px] text-sky-200 overflow-x-auto max-h-72 leading-relaxed">
                  {activeTrace?.apimaticReport.sdkSnippetTs ||
                    `import { Client, Environment } from "@paypal/paypal-server-sdk";
import { PayPalAgentToolkit } from "@paypal/agent-toolkit/ai-sdk";

// Validated Contract Call for ${selectedTranche.id} (${selectedTranche.vendorName})
const client = new Client({
  environment: Environment.Sandbox,
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID!,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  },
});`}
                </pre>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
