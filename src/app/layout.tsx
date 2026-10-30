import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrancheFlow AI — PayPal Agentic Commerce & AG Grid Treasury OS",
  description:
    "Autonomous B2B Milestone Escrow, Invoice Nudge & Schedule Dependency OS powered by PayPal Agent Toolkit, AG Grid & APIMatic.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070B14] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
