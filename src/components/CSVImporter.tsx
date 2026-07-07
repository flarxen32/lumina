"use client";

import { useState, useRef, useCallback } from "react";
import { Transaction } from "@/lib/types";
import { parseCSV, generateCSVTemplate } from "@/lib/csvParser";

interface Props {
  onImport: (transactions: Transaction[]) => void;
}

export default function CSVImporter({ onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setImported(null);

    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setError("Please upload a .csv file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const transactions = parseCSV(text);
        if (transactions.length === 0) {
          setError("No valid transactions found in CSV. Check column headers.");
          return;
        }
        onImport(transactions);
        setImported(transactions.length);
        setTimeout(() => {
          setOpen(false);
          setImported(null);
        }, 2000);
      } catch {
        setError("Failed to parse CSV file");
      }
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsText(file);
  }, [onImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const downloadTemplate = () => {
    const blob = new Blob([generateCSVTemplate()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lumina-csv-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-all"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.1))", border: "1px solid rgba(139,92,246,0.2)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Import CSV
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass rounded-2xl p-6 max-w-md w-full animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Import Revenue Data</h3>
              <button onClick={() => setOpen(false)} className="text-lumina-dim hover:text-lumina-text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-lumina-purple bg-lumina-purple/5"
                  : "border-lumina-border hover:border-lumina-dim"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />

              {imported !== null ? (
                <div className="text-lumina-revenue">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />
                  </svg>
                  <p className="font-semibold">{imported} transactions imported!</p>
                </div>
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-lumina-dim">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  <p className="text-sm font-medium mb-1">Drop CSV file here</p>
                  <p className="text-xs text-lumina-dim">or click to browse</p>
                </>
              )}
            </div>

            {error && (
              <div className="mt-3 text-sm text-lumina-danger bg-lumina-danger/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={downloadTemplate}
                className="text-xs text-lumina-dim hover:text-lumina-cyan transition-colors"
              >
                Download CSV template
              </button>
              <div className="text-xs text-lumina-dim">
                Columns: date, description, amount, source
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
