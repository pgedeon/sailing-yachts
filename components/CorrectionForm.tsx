"use client";

import { useState, useRef } from "react";
import { AlertTriangle, Send, X } from "lucide-react";

interface SpecField {
  name: string;
  label: string;
  currentValue: string | number | null;
}

interface CorrectionFormProps {
  yachtId: number;
  yachtSlug: string;
  specFields: SpecField[];
}

const CORRECTION_TYPES = [
  { value: "missing_specification", label: "Missing specification" },
  { value: "incorrect_value", label: "Incorrect value" },
  { value: "outdated_information", label: "Outdated information" },
  { value: "wrong_image", label: "Wrong image" },
  { value: "other", label: "Other" },
];

type FormStatus = "idle" | "submitting" | "success" | "error";

export function CorrectionForm({ yachtId, yachtSlug, specFields }: CorrectionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [correctionType, setCorrectionType] = useState("incorrect_value");
  const [fieldName, setFieldName] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [notes, setNotes] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  // Honeypot
  const [honeypot, setHoneypot] = useState("");

  const formRef = useRef<HTMLFormElement>(null);

  const selectedField = specFields.find((f) => f.name === fieldName);

  function resetForm() {
    setCorrectionType("incorrect_value");
    setFieldName("");
    setSuggestedValue("");
    setNotes("");
    setSourceUrl("");
    setSubmitterName("");
    setSubmitterEmail("");
    setHoneypot("");
    setStatus("idle");
    setErrorMessage("");
  }

  function handleClose() {
    setIsOpen(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yachtModelId: yachtId,
          correctionType,
          fieldName,
          currentValue: selectedField?.currentValue ?? null,
          suggestedValue,
          notes: notes || undefined,
          sourceUrl: sourceUrl || undefined,
          submitterName: submitterName || undefined,
          submitterEmail: submitterEmail || undefined,
          website: honeypot,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong");
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="suggest-correction-btn"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Suggest a Correction
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            className="bg-background border border-border rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
            data-testid="correction-form-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Suggest a Correction
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-md hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            {status === "success" ? (
              <div className="px-5 py-8 text-center">
                <div className="text-green-600 text-3xl mb-3">✓</div>
                <p className="font-semibold text-lg">Thank you!</p>
                <p className="text-muted-foreground mt-1">
                  Your correction has been submitted and will be reviewed by our team.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="px-5 py-4 space-y-4"
              >
                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {/* Correction type */}
                <div>
                  <label htmlFor="correction-type" className="block text-sm font-medium mb-1">
                    Correction type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="correction-type"
                    value={correctionType}
                    onChange={(e) => setCorrectionType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                    data-testid="correction-type-select"
                  >
                    {CORRECTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field name */}
                <div>
                  <label htmlFor="field-name" className="block text-sm font-medium mb-1">
                    Field <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="field-name"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                    data-testid="field-name-select"
                  >
                    <option value="">Select a field…</option>
                    {specFields.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current value (read-only) */}
                {selectedField && selectedField.currentValue !== null && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Current value
                    </label>
                    <div className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                      {String(selectedField.currentValue)}
                    </div>
                  </div>
                )}

                {/* Suggested value */}
                <div>
                  <label htmlFor="suggested-value" className="block text-sm font-medium mb-1">
                    Suggested value <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="suggested-value"
                    type="text"
                    value={suggestedValue}
                    onChange={(e) => setSuggestedValue(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Enter the correct value"
                    required
                    data-testid="suggested-value-input"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="correction-notes" className="block text-sm font-medium mb-1">
                    Notes
                  </label>
                  <textarea
                    id="correction-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                    placeholder="Any additional context…"
                    rows={3}
                  />
                </div>

                {/* Source URL */}
                <div>
                  <label htmlFor="correction-source" className="block text-sm font-medium mb-1">
                    Source URL
                  </label>
                  <input
                    id="correction-source"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="https://…"
                  />
                </div>

                {/* Submitter name */}
                <div>
                  <label htmlFor="submitter-name" className="block text-sm font-medium mb-1">
                    Your name <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <input
                    id="submitter-name"
                    type="text"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="John Doe"
                  />
                </div>

                {/* Submitter email */}
                <div>
                  <label htmlFor="submitter-email" className="block text-sm font-medium mb-1">
                    Your email <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <input
                    id="submitter-email"
                    type="email"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Error message */}
                {status === "error" && errorMessage && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    data-testid="correction-submit-btn"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {status === "submitting" ? "Submitting…" : "Submit Correction"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
