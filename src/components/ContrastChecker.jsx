"use client";

import { useMemo, useState } from "react";
import { Pipette, CheckCircle2, XCircle } from "lucide-react";
import { contrastRatio, evaluateContrast, parseColorToRgb } from "@/lib/contrast";

const DEFAULT_FOREGROUND = "#0F172A";
const DEFAULT_BACKGROUND = "#FFFFFF";

function ColorSwatchInput({ label, value, onChange, onPick, pickerSupported, pickerBusy }) {
  return (
    <div className="flex-1">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span
          className="h-9 w-9 flex-shrink-0 rounded-md border border-slate-300 shadow-sm"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm font-mono uppercase text-slate-800 focus:border-brand-500"
          aria-label={`${label} hex color value`}
          maxLength={9}
        />
        {pickerSupported && (
          <button
            type="button"
            onClick={onPick}
            disabled={pickerBusy}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Pick ${label.toLowerCase()} from screen with eyedropper`}
            title={`Pick ${label.toLowerCase()} from screen`}
          >
            <Pipette className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

function ResultBadge({ passed, label }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
        passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {passed ? (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {label}: {passed ? "Pass" : "Fail"}
    </div>
  );
}

/**
 * Color contrast checker built on the native browser EyeDropper API.
 * Falls back to manual hex entry in browsers that don't support it yet
 * (EyeDropper is currently Chromium-only).
 */
export default function ContrastChecker() {
  const [foreground, setForeground] = useState(DEFAULT_FOREGROUND);
  const [background, setBackground] = useState(DEFAULT_BACKGROUND);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [pickError, setPickError] = useState(null);

  const pickerSupported = typeof window !== "undefined" && "EyeDropper" in window;

  const ratio = useMemo(() => {
    if (!parseColorToRgb(foreground) || !parseColorToRgb(background)) return null;
    return contrastRatio(foreground, background);
  }, [foreground, background]);

  const results = useMemo(() => evaluateContrast(ratio), [ratio]);

  const handlePick = async (setter) => {
    setPickError(null);
    try {
      // eslint-disable-next-line no-undef
      const eyeDropper = new EyeDropper();
      setPickerBusy(true);
      const result = await eyeDropper.open();
      setter(result.sRGBHex.toUpperCase());
    } catch (err) {
      // AbortError happens when the user presses Escape — not a real error.
      if (err?.name !== "AbortError") {
        setPickError("Couldn't read that color. Please try again.");
      }
    } finally {
      setPickerBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="contrast-checker-heading"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <h3 id="contrast-checker-heading" className="text-sm font-bold text-slate-800">
        Color Contrast Checker
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        {pickerSupported
          ? "Use the eyedropper to sample foreground and background colors from anywhere on your screen, or type hex values directly."
          : "Your browser doesn't support the native EyeDropper API yet (currently Chrome/Edge only). Enter hex color values manually instead."}
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <ColorSwatchInput
          label="Foreground (text)"
          value={foreground}
          onChange={setForeground}
          onPick={() => handlePick(setForeground)}
          pickerSupported={pickerSupported}
          pickerBusy={pickerBusy}
        />
        <ColorSwatchInput
          label="Background"
          value={background}
          onChange={setBackground}
          onPick={() => handlePick(setBackground)}
          pickerSupported={pickerSupported}
          pickerBusy={pickerBusy}
        />
      </div>

      {pickError && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {pickError}
        </p>
      )}

      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <div
          className="mb-3 flex items-center justify-center rounded-md border border-slate-200 py-6 text-lg font-semibold"
          style={{ backgroundColor: background, color: foreground }}
        >
          Sample Text Preview
        </div>

        {ratio !== null ? (
          <>
            <p className="text-center text-2xl font-bold text-slate-800">
              {ratio.toFixed(2)}
              <span className="text-sm font-medium text-slate-500">:1</span>
            </p>
            <p className="mb-3 text-center text-xs text-slate-500">Contrast ratio</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ResultBadge passed={results.normalAA} label="AA Normal" />
              <ResultBadge passed={results.normalAAA} label="AAA Normal" />
              <ResultBadge passed={results.largeAA} label="AA Large" />
              <ResultBadge passed={results.largeAAA} label="AAA Large" />
            </div>
          </>
        ) : (
          <p className="text-center text-sm text-slate-500">
            Enter two valid colors to calculate the contrast ratio.
          </p>
        )}
      </div>
    </section>
  );
}
