"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ACCESSIBILITY_TIPS } from "@/lib/tips";

/**
 * Displays a spinner alongside rotating accessibility tips while an
 * asynchronous AI operation is in progress.
 */
export default function LoadingTips({ label = "Scanning" }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ACCESSIBILITY_TIPS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-700">{label}…</p>
      <p className="max-w-md text-sm text-slate-500 transition-opacity duration-300">
        {ACCESSIBILITY_TIPS[tipIndex]}
      </p>
    </div>
  );
}
