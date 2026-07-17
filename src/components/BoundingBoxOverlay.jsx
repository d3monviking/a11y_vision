"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Renders accessibility violation bounding boxes on top of a screenshot using
 * relative percentage coordinates, so they remain aligned when the image
 * resizes. Each box is a focusable, keyboard-operable button that reveals a
 * tooltip describing the WCAG violation and remediation steps.
 */
export default function BoundingBoxOverlay({ violations, activeId, onActiveChange }) {
  const [internalActive, setInternalActive] = useState(null);
  const currentActive = activeId !== undefined ? activeId : internalActive;

  const setActive = (id) => {
    if (onActiveChange) onActiveChange(id);
    else setInternalActive(id);
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      {violations.map((violation, index) => {
        const { top, left, width, height } = violation.coordinates;
        const isActive = currentActive === violation.id;
        const tooltipBelow = top < 55;

        return (
          <div
            key={violation.id}
            className="pointer-events-auto absolute"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
          >
            <button
              type="button"
              aria-describedby={`violation-tooltip-${violation.id}`}
              aria-expanded={isActive}
              onMouseEnter={() => setActive(violation.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(violation.id)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(isActive ? null : violation.id)}
              className={`group relative h-full w-full rounded-sm border-2 transition-colors ${
                isActive
                  ? "border-red-500 bg-red-500/20"
                  : "border-red-400/80 bg-red-400/10 hover:border-red-500 hover:bg-red-500/20"
              }`}
            >
              <span
                className="absolute -top-3 -left-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-600 text-[11px] font-bold text-white shadow-sm"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="sr-only">
                Violation {index + 1}: {violation.issue} on {violation.element}
              </span>
            </button>

            {isActive && (
              <div
                id={`violation-tooltip-${violation.id}`}
                role="tooltip"
                className={`pointer-events-none absolute z-20 w-64 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg ${
                  tooltipBelow ? "top-full mt-2" : "bottom-full mb-2"
                } left-0`}
              >
                <div className="mb-1 flex items-start gap-1.5 text-xs font-semibold text-red-600">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  <span>{violation.wcag_rule}</span>
                </div>
                <p className="mb-1.5 text-sm font-semibold text-slate-800">{violation.issue}</p>
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Element:</span>{" "}
                  {violation.element}
                </p>
                <p className="mt-1.5 text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Fix:</span> {violation.remediation}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
