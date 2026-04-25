"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { trackExportDownload } from "@/lib/revenue-analytics";

interface BuyerChecklistProps {
  yachtIds: number[];
  yachtNames: string[];
}

interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  // Budget & Financing
  { id: "budget", category: "Budget & Financing", label: "Total budget including equipment and registration", checked: false },
  { id: "insurance", category: "Budget & Financing", label: "Insurance quotes obtained", checked: false },
  { id: "berth-cost", category: "Budget & Financing", label: "Annual berth/mooring costs confirmed", checked: false },
  { id: "maintenance", category: "Budget & Financing", label: "Annual maintenance budget estimated (typically 10% of value)", checked: false },
  // Hull & Structure
  { id: "hull-inspection", category: "Hull & Structure", label: "Hull condition inspected (osmosis, gelcoat blisters)", checked: false },
  { id: "deck-hardware", category: "Hull & Structure", label: "Deck hardware condition checked (winches, cleats, tracks)", checked: false },
  { id: "rig-inspection", category: "Hull & Structure", label: "Standing rigging inspected (age, corrosion, tension)", checked: false },
  { id: "sails", category: "Hull & Structure", label: "Sail condition assessed (age, shape, repairs)", checked: false },
  // Systems
  { id: "engine-hours", category: "Systems", label: "Engine hours verified and service history reviewed", checked: false },
  { id: "electrical", category: "Systems", label: "Electrical system tested (batteries, wiring, navigation)", checked: false },
  { id: "plumbing", category: "Systems", label: "Plumbing system checked (water tanks, bilge pumps, heads)", checked: false },
  { id: "navigation", category: "Systems", label: "Navigation electronics tested (chartplotter, VHF, AIS)", checked: false },
  // Safety
  { id: "safety-gear", category: "Safety", label: "Safety equipment inventory (life jackets, flares, liferaft)", checked: false },
  { id: "fire-extinguishers", category: "Safety", label: "Fire extinguishers inspected and in date", checked: false },
  { id: "gas-system", category: "Safety", label: "Gas system leak-tested with certificate", checked: false },
  // Legal & Documentation
  { id: "registration", category: "Legal & Documentation", label: "Registration documents verified", checked: false },
  { id: "survey", category: "Legal & Documentation", label: "Professional survey completed", checked: false },
  { id: "sea-trial", category: "Legal & Documentation", label: "Sea trial completed satisfactorily", checked: false },
  { id: "title-check", category: "Legal & Documentation", label: "Title/ownership verified (no liens/encumbrances)", checked: false },
];

export function BuyerChecklist({ yachtIds, yachtNames }: BuyerChecklistProps) {
  const { status } = useSession();
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);
  const [notes, setNotes] = useState("");
  const [showAuthHint, setShowAuthHint] = useState(false);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handlePrint = () => {
    if (status !== "authenticated") {
      setShowAuthHint(true);
      return;
    }

    document.body.classList.add("printing-checklist");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing-checklist");
    }, 1000);

    trackExportDownload({
      format: "pdf",
      yachtIds,
      page: "/compare",
    });
  };

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-5" data-testid="buyer-checklist">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Buyer&apos;s Checklist</h3>
          <p className="text-sm text-gray-500">
            {checkedCount}/{items.length} items completed
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors print:hidden"
          aria-label="Print checklist"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {/* Auth hint */}
      {showAuthHint && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
          <p className="text-sm text-blue-700">
            Sign in to print your checklist and save your progress.
          </p>
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => signIn()}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Sign in
            </button>
            <button
              onClick={() => setShowAuthHint(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Yachts being compared */}
      <div className="mb-4 print:mb-2">
        <p className="text-sm text-gray-600 font-medium">Comparing:</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {yachtNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 print:hidden">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(checkedCount / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist items by category */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1">
              {category}
            </h4>
            <ul className="space-y-1.5">
              {items
                .filter((i) => i.category === category)
                .map((item) => (
                  <li key={item.id}>
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleItem(item.id)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 print:hidden"
                      />
                      <span
                        className={`text-sm ${
                          item.checked
                            ? "text-gray-500 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {item.checked ? "✓ " : "○ "}
                        {item.label}
                      </span>
                    </label>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Notes field */}
      <div className="mt-4 pt-3 border-t border-gray-100 print:hidden">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your notes, questions for the broker, or things to remember..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      {notes && (
        <div className="mt-2 print:block hidden">
          <p className="text-sm font-medium text-gray-700">Notes:</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  );
}
