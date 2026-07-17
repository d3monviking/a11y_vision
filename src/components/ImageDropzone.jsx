"use client";

import { useRef, useState } from "react";
import { UploadCloud, ImageIcon } from "lucide-react";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ImageDropzone({ onFileSelected, error }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndEmit = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onFileSelected(null, "Please upload a PNG, JPEG, or WEBP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      onFileSelected(null, "Image is too large. Please upload a file under 10MB.");
      return;
    }
    onFileSelected(file, null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    validateAndEmit(file);
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    validateAndEmit(file);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a website screenshot. Click to browse, or drag and drop a PNG, JPEG, or WEBP file."
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-slate-700">
          Drag & drop a screenshot here, or click to browse
        </p>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
          PNG, JPEG, or WEBP — up to 10MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
