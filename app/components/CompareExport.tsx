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
  const [pdfGateOpen, setPdfGateOpen] = useState(false);
  const [pdfEmail, setPdfEmail] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [pdfSuccess, setPdfSuccess] = useState(false);

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

  const handlePrintPdf = () => {
    setDropdownOpen(false);

    if (status !== "authenticated") {
      setAuthPromptOpen(true);
      return;
    }

    document.body.classList.add("printing-compare");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing-compare");
    }, 1000);

    trackExportDownload({
      format: "pdf",
      yachtIds,
      page: "/compare",
    });
  };

  const handlePdfReport = () => {
    setDropdownOpen(false);
    // Pre-fill email if logged in
    if (session?.user?.email) {
      setPdfEmail(session.user.email as string);
      setPdfName((session.user.name as string) || "");
    }
    setPdfGateOpen(true);
  };

  const submitPdfReport = async () => {
    setPdfError("");

    if (!pdfEmail) {
      setPdfError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(pdfEmail)) {
      setPdfError("Please enter a valid email address");
      return;
    }

    setExporting(true);
    try {
      const response = await fetch("/api/compare/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yachtIds,
          email: pdfEmail,
          name: pdfName || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Download failed" }));
        throw new Error(err.error || "Download failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers
        .get("Content-Disposition")
        ?.match(/filename="(.+)"/)?.[1] ||
        `comparison-${yachtNames.join("-vs-").replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setPdfSuccess(true);
      setTimeout(() => {
        setPdfSuccess(false);
        setPdfGateOpen(false);
      }, 2500);
    } catch (err: any) {
      setPdfError(err.message || "Failed to generate report");
    } finally {
      setExporting(false);
    }
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
             aria-hidden="true">
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
            <span>Generating...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
             aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <span>Export</span>
            <svg
              className="w-3 h-3 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
             aria-hidden="true">
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
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-500">
                {status === "authenticated"
                  ? `Signed in as ${session?.user?.email ?? "user"}`
                  : "Export options"}
              </p>
            </div>

            {/* Premium PDF Report — lead gated */}
            <button
              onClick={handlePdfReport}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors text-left border-b border-gray-100"
            >
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
               aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h8.25m-8.25 0H6.75a2.25 2.25 0 01-2.25-2.25V5.625A2.25 2.25 0 016.75 3.75h6.008a2.25 2.25 0 011.591.659l4.5 4.5c.413.413.641.974.641 1.56v6.751a2.25 2.25 0 01-2.25 2.25h-2.75M12 11.25l-3 3m0 0l-3-3m3 3V7.5"
                />
              </svg>
              <div>
                <div className="font-medium flex items-center gap-1.5">
                  PDF Report
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-700">PREMIUM</span>
                </div>
                <div className="text-xs text-gray-500">Branded report with specs & analysis</div>
              </div>
            </button>

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
               aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0-1.125c.621 0 1.125.504 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5c-.621 0-1.125.504-1.125 1.125m0 0v1.5m0-3.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125c.621 0 1.125.504 1.125 1.125"
                />
              </svg>
              <div>
                <div className="font-medium">Download CSV</div>
                <div className="text-xs text-gray-500">Spreadsheet-friendly</div>
              </div>
            </button>

            <div className="border-t border-gray-100" />
            <button
              onClick={handlePrintPdf}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
               aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
                />
              </svg>
              <div>
                <div className="font-medium">Quick Print</div>
                <div className="text-xs text-gray-500">Browser print dialog</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* PDF Report Lead Gate Modal */}
      {pdfGateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            {pdfSuccess ? (
              <div className="text-center py-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Report downloaded!</h3>
                <p className="text-sm text-gray-500">Check your downloads folder.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h8.25m-8.25 0H6.75a2.25 2.25 0 01-2.25-2.25V5.625A2.25 2.25 0 016.75 3.75h6.008a2.25 2.25 0 011.591.659l4.5 4.5c.413.413.641.974.641 1.56v6.751a2.25 2.25 0 01-2.25 2.25h-2.75" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Premium PDF Report
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Get a branded comparison report with detailed specs, best-value highlights, and buying checklist.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      value={pdfName}
                      onChange={(e) => setPdfName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={pdfEmail}
                      onChange={(e) => setPdfEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => e.key === "Enter" && submitPdfReport()}
                    />
                  </div>
                  {pdfError && (
                    <p className="text-xs text-red-600">{pdfError}</p>
                  )}
                  <p className="text-[11px] text-gray-400">
                    We&apos;ll send you occasional updates about these yachts. No spam, unsubscribe anytime.
                  </p>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={submitPdfReport}
                    disabled={exporting}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {exporting ? "Generating..." : "Download Report"}
                  </button>
                  <button
                    onClick={() => { setPdfGateOpen(false); setPdfError(""); }}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
                 aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sign in to export CSV
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Create a free account to download CSV data and other exports.
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
