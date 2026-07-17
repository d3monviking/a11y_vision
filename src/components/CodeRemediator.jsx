"use client";

import { useState } from "react";
import { Wand2, AlertCircle, Copy, Check, ClipboardList } from "lucide-react";
import LoadingTips from "@/components/LoadingTips";
import { highlightHtml } from "@/lib/highlightHtml";

const PLACEHOLDER_HTML = `<div class="card">
  <img src="logo.png">
  <input type="text">
  <div onclick="submitForm()">Submit</div>
</div>`;

export default function CodeRemediator() {
  const [inputHtml, setInputHtml] = useState("");
  const [isRemediating, setIsRemediating] = useState(false);
  const [correctedHtml, setCorrectedHtml] = useState(null);
  const [explanations, setExplanations] = useState([]);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleRemediate = async () => {
    if (!inputHtml.trim()) {
      setError("Please paste some HTML to audit first.");
      return;
    }

    setIsRemediating(true);
    setError(null);
    setCorrectedHtml(null);
    setExplanations([]);
    setCopied(false);

    try {
      const response = await fetch("/api/ai/code-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: inputHtml }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "The remediation request failed. Please try again.");
      }

      setCorrectedHtml(data.correctedHtml);
      setExplanations(data.explanations || []);
    } catch (err) {
      setError(err.message || "Something went wrong while remediating the code.");
    } finally {
      setIsRemediating(false);
    }
  };

  const handleCopy = async () => {
    if (!correctedHtml) return;
    try {
      await navigator.clipboard.writeText(correctedHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy to clipboard. Please copy the code manually.");
    }
  };

  return (
    <section aria-labelledby="code-remediator-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="code-remediator-heading" className="text-lg font-bold text-slate-900">
          Code Remediator
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Paste raw HTML and let AI rewrite it with accessibility fixes applied — missing labels,
          alt text, semantic elements, ARIA attributes, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <div className="flex flex-col">
          <label htmlFor="html-input" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Your HTML
          </label>
          <textarea
            id="html-input"
            value={inputHtml}
            onChange={(event) => setInputHtml(event.target.value)}
            placeholder={PLACEHOLDER_HTML}
            spellCheck={false}
            className="min-h-[320px] flex-1 resize-none rounded-xl border border-slate-300 bg-white p-4 font-mono text-sm text-slate-800 shadow-sm focus:border-brand-500"
            aria-describedby={error ? "code-remediator-error" : undefined}
          />
        </div>

        <div className="flex items-center justify-center lg:flex-col lg:gap-2">
          <button
            type="button"
            onClick={handleRemediate}
            disabled={isRemediating}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            {isRemediating ? "Remediating…" : "Remediate Code"}
          </button>
        </div>

        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Corrected HTML
            </span>
            {correctedHtml && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy
                  </>
                )}
              </button>
            )}
          </div>
          <div className="min-h-[320px] flex-1 overflow-auto rounded-xl border border-slate-300 bg-slate-900 p-4 code-scroll">
            {isRemediating ? (
              <LoadingTips label="Remediating HTML for accessibility" />
            ) : correctedHtml ? (
              <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                <code
                  className="font-mono text-slate-100"
                  dangerouslySetInnerHTML={{ __html: highlightHtml(correctedHtml) }}
                />
              </pre>
            ) : (
              <p className="text-sm text-slate-500">
                Corrected, accessible HTML will appear here after remediation.
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div
          id="code-remediator-error"
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {explanations.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <ClipboardList className="h-4 w-4 text-brand-600" aria-hidden="true" />
            What changed and why ({explanations.length})
          </h3>
          <ul className="flex flex-col gap-3">
            {explanations.map((explanation) => (
              <li
                key={explanation.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
              >
                <p className="font-semibold text-slate-800">{explanation.issue}</p>
                <p className="mt-1 text-slate-600">{explanation.fix}</p>
                <p className="mt-1.5 text-xs font-medium text-brand-700">{explanation.wcag_rule}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {correctedHtml && explanations.length === 0 && !isRemediating && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          No accessibility issues were found — your HTML looks good as-is.
        </div>
      )}
    </section>
  );
}
