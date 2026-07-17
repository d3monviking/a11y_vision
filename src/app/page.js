"use client";

import { useState } from "react";
import { Eye, ScanSearch, Code2 } from "lucide-react";
import TabsNav from "@/components/TabsNav";
import VisualAuditor from "@/components/VisualAuditor";
import CodeRemediator from "@/components/CodeRemediator";

const TABS = [
  { id: "visual", label: "Visual Auditor", icon: ScanSearch },
  { id: "code", label: "Code Remediator", icon: Code2 },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("visual");

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Eye className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">A11yVision</h1>
            <p className="text-xs text-slate-500">
              AI-Powered Web Accessibility Visual Auditor &amp; Code Remediator
            </p>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <TabsNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        <div
          role="tabpanel"
          id="panel-visual"
          aria-labelledby="tab-visual"
          hidden={activeTab !== "visual"}
          className="mt-6"
        >
          {activeTab === "visual" && <VisualAuditor />}
        </div>

        <div
          role="tabpanel"
          id="panel-code"
          aria-labelledby="tab-code"
          hidden={activeTab !== "code"}
          className="mt-6"
        >
          {activeTab === "code" && <CodeRemediator />}
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400 sm:px-6">
        A11yVision audits are AI-generated estimates — always validate critical fixes with manual
        testing and real assistive technology.
      </footer>
    </div>
  );
}
