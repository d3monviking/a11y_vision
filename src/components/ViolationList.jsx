"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * Text-based list of detected violations, kept in sync with the bounding box
 * overlay. This ensures the audit results are fully available to screen
 * reader and keyboard-only users, not just visually via the overlay.
 */
export default function ViolationList({ violations, activeId, onActiveChange }) {
  if (violations.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">
          No visual accessibility violations were detected in this screenshot.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2" aria-label="Detected accessibility violations">
      {violations.map((violation, index) => {
        const isActive = activeId === violation.id;
        return (
          <li key={violation.id}>
            <button
              type="button"
              onMouseEnter={() => onActiveChange(violation.id)}
              onMouseLeave={() => onActiveChange(null)}
              onFocus={() => onActiveChange(violation.id)}
              onBlur={() => onActiveChange(null)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                isActive
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/50"
              }`}
            >
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  {violation.wcag_rule}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-slate-800">
                  {violation.issue}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Element:</span>{" "}
                  {violation.element}
                </span>
                <span className="mt-1 block text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Fix:</span>{" "}
                  {violation.remediation}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
