"use client";

import { useRef } from "react";

/**
 * Accessible tabs navigation following the WAI-ARIA Tabs pattern:
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */
export default function TabsNav({ tabs, activeTab, onChange }) {
  const tabRefs = useRef([]);

  const handleKeyDown = (event, index) => {
    let nextIndex = null;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      onChange(tabs[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label="A11yVision tools"
      className="flex gap-2 rounded-xl bg-slate-100 p-1.5"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[index] = el)}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none sm:min-w-[220px] ${
              isActive
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
            }`}
          >
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
