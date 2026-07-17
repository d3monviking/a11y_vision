"use client";

import { useCallback, useState } from "react";
import { ScanSearch, RotateCcw, AlertCircle } from "lucide-react";
import ImageDropzone from "@/components/ImageDropzone";
import LoadingTips from "@/components/LoadingTips";
import BoundingBoxOverlay from "@/components/BoundingBoxOverlay";
import ViolationList from "@/components/ViolationList";
import ContrastChecker from "@/components/ContrastChecker";

export default function VisualAuditor() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [violations, setViolations] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const handleFileSelected = useCallback((file, error) => {
    setFileError(error);
    setViolations(null);
    setScanError(null);
    setActiveId(null);

    if (!file) {
      if (error) setPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.onerror = () => setFileError("Couldn't read that file. Please try another image.");
    reader.readAsDataURL(file);
  }, []);

  const handleReset = () => {
    setPreviewUrl(null);
    setFileError(null);
    setViolations(null);
    setScanError(null);
    setActiveId(null);
  };

  const handleScan = async () => {
    if (!previewUrl) return;
    setIsScanning(true);
    setScanError(null);
    setViolations(null);

    try {
      const response = await fetch("/api/ai/visual-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: previewUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "The scan failed. Please try again.");
      }

      setViolations(data.violations);
    } catch (err) {
      setScanError(err.message || "Something went wrong while scanning. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="visual-auditor-heading">
        <h2 id="visual-auditor-heading" className="text-lg font-bold text-slate-900">
          Visual Auditor
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload a screenshot of a webpage and let AI visually scan it for WCAG accessibility
          violations.
        </p>

        <div className="mt-4">
          {!previewUrl ? (
            <ImageDropzone onFileSelected={handleFileSelected} error={fileError} />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={isScanning}
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ScanSearch className="h-4 w-4" aria-hidden="true" />
                  {isScanning ? "Scanning…" : violations ? "Re-scan Screenshot" : "Scan Screenshot"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isScanning}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Upload a different image
                </button>
              </div>

              {isScanning && <LoadingTips label="Scanning screenshot for accessibility issues" />}

              {scanError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  {scanError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Uploaded website screenshot being audited for accessibility issues"
                      className="block w-full select-none"
                    />
                    {violations && violations.length > 0 && (
                      <BoundingBoxOverlay
                        violations={violations}
                        activeId={activeId}
                        onActiveChange={setActiveId}
                      />
                    )}
                  </div>
                </div>

                <div>
                  {violations ? (
                    <>
                      <h3 className="mb-2 text-sm font-bold text-slate-800">
                        {violations.length} issue{violations.length === 1 ? "" : "s"} found
                      </h3>
                      <div className="max-h-[520px] overflow-y-auto pr-1 code-scroll">
                        <ViolationList
                          violations={violations}
                          activeId={activeId}
                          onActiveChange={setActiveId}
                        />
                      </div>
                    </>
                  ) : (
                    !isScanning && (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                        Click &ldquo;Scan Screenshot&rdquo; to run the AI accessibility audit.
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <ContrastChecker />
    </div>
  );
}
