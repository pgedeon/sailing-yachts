"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { trackExportDownload } from "@/lib/revenue-analytics";

interface CompareExportProps {
  yachtIds: number[];
  yachtNames: string[];
}

export function CompareExport({ yachtIds, yachtNames }: CompareExportProps) {
  const { data: session, status } = useSession();
  const [exporting, setExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const handleCsvExport = async () => {
    setDropdownOpen(false);

    if (status !== "authenticated") {
      setAuthPromptOpen(true);
      return;
    }

    setExporting(true);
    try {
      const response = await fetch(
        `/api/compare/export?ids=${yachtIds.join(",")}&format=csv`
      );
      if (response.status === 401) {
        setAuthPromptOpen(true);
        return;
      }
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers
        .get("Content-Disposition")
        ?.match(/filename="(.+)"/)?.[1] ||
        `comparison-${yachtNames.join("-vs-").replace(/\s+/g, "-").toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      trackExportDownload({
        format: "csv",
        yachtIds,
        page: "/compare",
      });
    } catch (err) {
      console.error("CSV export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handlePdfExport = () => {
    setDropdownOpen(false);

    if (status !== "authenticated") {
      setAuthPromptOpen(true);
      return;
    }

    // Add print-specific class to body
    document.body.classList.add("printing-compare");

    // Trigger browser print (user can save as PDF)
    window.print();

    // Remove class after print dialog closes
    setTimeout(() => {
      document.body.classList.remove("printing-compare");
    }, 1000);

    trackExportDownload({
      format: "pdf",
      yachtIds,
      page: "/compare",
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={exporting}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        title="Export comparison"
      >
        {exporting ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <span>Export</span>
            <svg
              className="w-3 h-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </>
        )}
      </button>

      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-500">
                {status === "authenticated"
                  ? `Signed in as ${session?.user?.email ?? "user"}`
                  : "Sign in to export"}
              </p>
            </div>
            <button
              onClick={handleCsvExport}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0-1.125c.621 0 1.125.504 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5c-.621 0-1.125.504-1.125 1.125m0 0v1.5m0-3.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125c.621 0 1.125.504 1.125 1.125"
                />
              </svg>
              <div>
                <div className="font-medium">Download CSV</div>
                <div className="text-xs text-gray-400">Spreadsheet-friendly</div>
              </div>
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={handlePdfExport}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <div>
                <div className="font-medium">Save as PDF</div>
                <div className="text-xs text-gray-400">Print-optimized report</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Auth prompt modal */}
      {authPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sign in to export
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Create a free account to download comparison reports, buyer checklists, and shortlist packs.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setAuthPromptOpen(false);
                    signIn();
                  }}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign in to export
                </button>
                <button
                  onClick={() => setAuthPromptOpen(false)}
                  className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
