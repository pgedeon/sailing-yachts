"use client";

import { useLocale } from "next-intl";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { localePath } from "@/lib/i18n-paths";

interface PrivacySettings {
  analyticsOptOut: boolean;
  communicationOptOut: boolean;
  dataSharingConsent: boolean;
  deletionRequestedAt: string | null;
  deletionScheduledAt: string | null;
}

export default function PrivacySettings() {
  const locale = useLocale();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "scheduled">("idle");
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/user/account");
      if (res.status === 401) return;
      const data = await res.json();
      if (data.privacySettings) {
        setSettings(data.privacySettings);
        if (data.privacySettings.deletionScheduledAt) {
          setDeleteStep("scheduled");
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  async function toggleSetting(field: keyof Pick<PrivacySettings, "analyticsOptOut" | "communicationOptOut" | "dataSharingConsent">) {
    if (!settings || saving) return;
    setSaving(field);
    try {
      const res = await fetch("/api/user/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !settings[field] }),
      });
      if (res.ok) {
        setSettings((prev) => prev ? { ...prev, [field]: !prev[field] } : prev);
        showMessage("success", "Setting updated");
      } else {
        showMessage("error", "Failed to update setting");
      }
    } catch {
      showMessage("error", "Network error");
    } finally {
      setSaving(null);
    }
  }

  async function exportData() {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch("/api/user/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sailing-yachts-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showMessage("success", "Data exported successfully");
      } else {
        showMessage("error", "Failed to export data");
      }
    } catch {
      showMessage("error", "Network error");
    } finally {
      setExporting(false);
    }
  }

  async function requestDeletion() {
    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteStep("scheduled");
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                deletionRequestedAt: new Date().toISOString(),
                deletionScheduledAt: data.deletionScheduledAt,
              }
            : prev
        );
        showMessage("success", data.message);
      } else {
        showMessage("error", data.error || "Failed to request deletion");
      }
    } catch {
      showMessage("error", "Network error");
    }
  }

  async function cancelDeletion() {
    setCanceling(true);
    try {
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteStep("idle");
        setSettings((prev) =>
          prev
            ? { ...prev, deletionRequestedAt: null, deletionScheduledAt: null }
            : prev
        );
        showMessage("success", data.message);
      } else {
        showMessage("error", data.error || "Failed to cancel deletion");
      }
    } catch {
      showMessage("error", "Network error");
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8 text-gray-500">
        Unable to load privacy settings. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="privacy-settings">
      {/* Status message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Data Export Section */}
      <div className="border border-gray-200 rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              📦 Export Your Data
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Download all your data including favorites, saved searches, comparisons, and account settings as a JSON file.
            </p>
          </div>
          <button
            onClick={exportData}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap shrink-0"
            data-testid="export-data-btn"
          >
            {exporting ? "Exporting..." : "Download Data"}
          </button>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="border border-gray-200 rounded-lg p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">🔒 Privacy Settings</h3>

        {/* Analytics Opt-out */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="analytics-opt-out">
              Analytics Opt-out
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Disable anonymous usage analytics tracking.
            </p>
          </div>
          <button
            id="analytics-opt-out"
            role="switch"
            aria-checked={settings.analyticsOptOut}
            onClick={() => toggleSetting("analyticsOptOut")}
            disabled={saving !== null}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.analyticsOptOut ? "bg-blue-600" : "bg-gray-200"
            }`}
            data-testid="toggle-analytics"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.analyticsOptOut ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Communication Opt-out */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="communication-opt-out">
              Marketing Communications
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Opt out of marketing emails. You will still receive essential service notifications.
            </p>
          </div>
          <button
            id="communication-opt-out"
            role="switch"
            aria-checked={!settings.communicationOptOut}
            onClick={() => toggleSetting("communicationOptOut")}
            disabled={saving !== null}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              !settings.communicationOptOut ? "bg-blue-600" : "bg-gray-200"
            }`}
            data-testid="toggle-communications"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                !settings.communicationOptOut ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Data Sharing Consent */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="data-sharing">
              Data Sharing with Partners
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Allow sharing anonymized preference data with partners to improve recommendations.
            </p>
          </div>
          <button
            id="data-sharing"
            role="switch"
            aria-checked={settings.dataSharingConsent}
            onClick={() => toggleSetting("dataSharingConsent")}
            disabled={saving !== null}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.dataSharingConsent ? "bg-blue-600" : "bg-gray-200"
            }`}
            data-testid="toggle-data-sharing"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.dataSharingConsent ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Data Retention Info */}
      <div className="border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-3">📋 Data Retention</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Account data:</strong> Retained while your account is active.
          </p>
          <p>
            <strong>Favorites & searches:</strong> Stored until you delete them or close your account.
          </p>
          <p>
            <strong>Alert history:</strong> Retained for 90 days for deduplication, then automatically deleted.
          </p>
          <p>
            <strong>Push subscriptions:</strong> Deleted when you unsubscribe or close your account.
          </p>
          <p className="mt-2">
            You can request deletion of your account and all associated data at any time.
            After requesting deletion, you have a <strong>30-day grace period</strong> to change your mind.
          </p>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="border border-red-200 rounded-lg p-5 bg-red-50/50">
        <h3 className="font-semibold text-red-800 mb-2">⚠️ Delete Account</h3>

        {deleteStep === "idle" && (
          <>
            <p className="text-sm text-red-700 mb-4">
              Permanently delete your account and all associated data. This action starts a 30-day grace period
              during which you can cancel by signing back in.
            </p>
            <button
              onClick={() => setDeleteStep("confirm")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              data-testid="request-deletion-btn"
            >
              Request Account Deletion
            </button>
          </>
        )}

        {deleteStep === "confirm" && (
          <div className="space-y-3">
            <p className="text-sm text-red-800 font-medium">
              Are you sure? This will deactivate your account and schedule permanent deletion in 30 days.
            </p>
            <p className="text-sm text-red-700">
              You will lose access to your favorites, saved searches, comparisons, and alert preferences.
            </p>
            <div className="flex gap-3">
              <button
                onClick={requestDeletion}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                data-testid="confirm-deletion-btn"
              >
                Yes, Delete My Account
              </button>
              <button
                onClick={() => setDeleteStep("idle")}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {deleteStep === "scheduled" && settings.deletionScheduledAt && (
          <div className="space-y-3">
            <p className="text-sm text-red-800 font-medium">
              ⏰ Account deletion scheduled for{" "}
              <strong>{new Date(settings.deletionScheduledAt).toLocaleDateString()}</strong>.
            </p>
            <p className="text-sm text-red-700">
              Your account has been deactivated. You can cancel the deletion before this date.
            </p>
            <button
              onClick={cancelDeletion}
              disabled={canceling}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors text-sm font-medium"
              data-testid="cancel-deletion-btn"
            >
              {canceling ? "Canceling..." : "Cancel Deletion & Reactivate Account"}
            </button>
          </div>
        )}
      </div>

      {/* Legal links */}
      <div className="text-xs text-gray-400 text-center pt-2">
        See our{" "}
        <Link href={localePath(locale, "/privacy")} className="underline hover:text-gray-600">
          Privacy Policy
        </Link>{" "}
        for full details on data handling.
        If the Privacy Policy page doesn&apos;t exist yet, contact us at privacy@sailboats.fr.
      </div>
    </div>
  );
}
