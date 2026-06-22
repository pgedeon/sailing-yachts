"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Ship,
  Wind,
  Users,
  Wallet,
  Ruler,
  ArrowRight,
  ArrowLeft,
  Compass,
  Share2,
  Mail,
  Check,
  Loader2,
  ExternalLink,
  Star,
} from "lucide-react";
import { localePath } from "@/lib/i18n-paths";

// ─── Types ────────────────────────────────────────────────────────────
interface QuizAnswers {
  experience: string;
  sailingType: string;
  crewSize: string;
  budget: string;
  preferredLength: string;
  keelPreference: string;
  priority: string;
}

interface MatchedYacht {
  id: number;
  slug: string;
  modelName: string;
  manufacturerName: string;
  year: number | null;
  lengthOverall: number | null;
  cabins: number | null;
  keelType: string | null;
  hullMaterial: string | null;
  matchScore: number;
  matchReasons: string[];
  primaryImageUrl: string | null;
}

const defaultAnswers: QuizAnswers = {
  experience: "",
  sailingType: "",
  crewSize: "",
  budget: "",
  preferredLength: "",
  keelPreference: "",
  priority: "",
};

const STEPS = [
  "experience",
  "sailingType",
  "crewSize",
  "budget",
  "preferredLength",
  "keelPreference",
  "priority",
] as const;

type StepKey = (typeof STEPS)[number];

// ─── Step Config ──────────────────────────────────────────────────────
function getStepConfig(
  t: (key: string) => string
): Record<StepKey, { icon: React.ReactNode; question: string; options: { value: string; label: string; desc: string }[] }> {
  return {
    experience: {
      icon: <Compass className="w-6 h-6" />,
      question: t("steps.experience.question"),
      options: [
        { value: "beginner", label: t("steps.experience.beginner"), desc: t("steps.experience.beginnerDesc") },
        { value: "intermediate", label: t("steps.experience.intermediate"), desc: t("steps.experience.intermediateDesc") },
        { value: "advanced", label: t("steps.experience.advanced"), desc: t("steps.experience.advancedDesc") },
      ],
    },
    sailingType: {
      icon: <Wind className="w-6 h-6" />,
      question: t("steps.sailingType.question"),
      options: [
        { value: "coastal", label: t("steps.sailingType.coastal"), desc: t("steps.sailingType.coastalDesc") },
        { value: "offshore", label: t("steps.sailingType.offshore"), desc: t("steps.sailingType.offshoreDesc") },
        { value: "racing", label: t("steps.sailingType.racing"), desc: t("steps.sailingType.racingDesc") },
        { value: "cruising", label: t("steps.sailingType.cruising"), desc: t("steps.sailingType.cruisingDesc") },
      ],
    },
    crewSize: {
      icon: <Users className="w-6 h-6" />,
      question: t("steps.crewSize.question"),
      options: [
        { value: "solo", label: t("steps.crewSize.solo"), desc: t("steps.crewSize.soloDesc") },
        { value: "couple", label: t("steps.crewSize.couple"), desc: t("steps.crewSize.coupleDesc") },
        { value: "family", label: t("steps.crewSize.family"), desc: t("steps.crewSize.familyDesc") },
        { value: "group", label: t("steps.crewSize.group"), desc: t("steps.crewSize.groupDesc") },
      ],
    },
    budget: {
      icon: <Wallet className="w-6 h-6" />,
      question: t("steps.budget.question"),
      options: [
        { value: "budget", label: t("steps.budget.budget"), desc: t("steps.budget.budgetDesc") },
        { value: "midrange", label: t("steps.budget.midrange"), desc: t("steps.budget.midrangeDesc") },
        { value: "premium", label: t("steps.budget.premium"), desc: t("steps.budget.premiumDesc") },
        { value: "any", label: t("steps.budget.any"), desc: t("steps.budget.anyDesc") },
      ],
    },
    preferredLength: {
      icon: <Ruler className="w-6 h-6" />,
      question: t("steps.preferredLength.question"),
      options: [
        { value: "small", label: t("steps.preferredLength.small"), desc: t("steps.preferredLength.smallDesc") },
        { value: "medium", label: t("steps.preferredLength.medium"), desc: t("steps.preferredLength.mediumDesc") },
        { value: "large", label: t("steps.preferredLength.large"), desc: t("steps.preferredLength.largeDesc") },
        { value: "any", label: t("steps.preferredLength.any"), desc: t("steps.preferredLength.anyDesc") },
      ],
    },
    keelPreference: {
      icon: <Ship className="w-6 h-6" />,
      question: t("steps.keelPreference.question"),
      options: [
        { value: "fin", label: t("steps.keelPreference.fin"), desc: t("steps.keelPreference.finDesc") },
        { value: "wing", label: t("steps.keelPreference.wing"), desc: t("steps.keelPreference.wingDesc") },
        { value: "full", label: t("steps.keelPreference.full"), desc: t("steps.keelPreference.fullDesc") },
        { value: "any", label: t("steps.keelPreference.any"), desc: t("steps.keelPreference.anyDesc") },
      ],
    },
    priority: {
      icon: <Star className="w-6 h-6" />,
      question: t("steps.priority.question"),
      options: [
        { value: "performance", label: t("steps.priority.performance"), desc: t("steps.priority.performanceDesc") },
        { value: "comfort", label: t("steps.priority.comfort"), desc: t("steps.priority.comfortDesc") },
        { value: "value", label: t("steps.priority.value"), desc: t("steps.priority.valueDesc") },
        { value: "safety", label: t("steps.priority.safety"), desc: t("steps.priority.safetyDesc") },
      ],
    },
  };
}

// ─── Main Component ───────────────────────────────────────────────────
export default function QuizClient() {
  const t = useTranslations("Quiz");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(defaultAnswers);
  const [results, setResults] = useState<MatchedYacht[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stepConfig = getStepConfig(t);
  const stepKey = STEPS[currentStep];
  const config = stepConfig[stepKey];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;
  const canProceed = answers[stepKey] !== "";

  const handleAnswer = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [stepKey]: value }));
    },
    [stepKey]
  );

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      // Submit quiz
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answers),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Failed to get results" }));
          throw new Error(data.error || "Failed to get results");
        }
        const data = await res.json();
        setResults(data.yachts ?? []);

        // Build shareable URL
        const encoded = btoa(JSON.stringify(answers));
        const url = new URL(window.location.href);
        url.searchParams.set("r", encoded);
        setShareUrl(url.toString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, answers]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("shareTitle"),
          text: t("shareText"),
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  }, [shareUrl, t]);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;
      try {
        await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            source: "quiz",
          }),
        });
        setEmailSubmitted(true);
      } catch {
        // Silently handle — email is optional
      }
    },
    [email]
  );

  // ─── Results View ─────────────────────────────────────────────────
  if (results !== null) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-sky-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Compass className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t("results.title")}
            </h1>
            <p className="text-gray-600">{t("results.subtitle")}</p>
          </div>

          {/* Results Cards */}
          {results.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-600">{t("results.noResults")}</p>
              <button
                onClick={() => {
                  setResults(null);
                  setCurrentStep(0);
                  setAnswers(defaultAnswers);
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {t("results.retry")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((yacht, idx) => (
                <div
                  key={yacht.id}
                  className={`bg-white rounded-xl border ${
                    idx === 0
                      ? "border-blue-300 ring-2 ring-blue-100"
                      : "border-gray-200"
                  } p-5 sm:p-6 transition hover:shadow-md`}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank badge */}
                    <div
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0
                          ? "bg-blue-600 text-white"
                          : idx === 1
                          ? "bg-gray-200 text-gray-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      #{idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {yacht.manufacturerName} {yacht.modelName}
                            {yacht.year ? ` (${yacht.year})` : ""}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                            {yacht.lengthOverall && (
                              <span>
                                {yacht.lengthOverall}&apos; LOA
                              </span>
                            )}
                            {yacht.cabins && (
                              <span>{yacht.cabins} cabins</span>
                            )}
                            {yacht.keelType && <span>{yacht.keelType} keel</span>}
                            {yacht.hullMaterial && (
                              <span>{yacht.hullMaterial}</span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(yacht.matchScore)}%
                          </div>
                          <div className="text-xs text-gray-400">
                            {t("results.match")}
                          </div>
                        </div>
                      </div>

                      {/* Match reasons */}
                      {yacht.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {yacht.matchReasons.map((reason, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs"
                            >
                              <Check className="w-3 h-3" />
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="mt-4">
                        <a
                          href={localePath("en", `/yachts/${yacht.slug}`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                        >
                          {t("results.viewYacht")}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Share + Email Section */}
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {/* Share */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                {t("results.share")}
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                {t("results.shareDesc")}
              </p>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                {t("results.shareButton")}
              </button>
            </div>

            {/* Email capture */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t("results.saveResults")}
              </h3>
              {emailSubmitted ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  {t("results.emailSuccess")}
                </p>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-2">
                  <p className="text-sm text-gray-500">
                    {t("results.emailDesc")}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      {t("results.send")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Retake quiz */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setResults(null);
                setCurrentStep(0);
                setAnswers(defaultAnswers);
                setEmailSubmitted(false);
                setEmail("");
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
            >
              {t("results.retake")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Quiz Steps ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-sky-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Ship className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>
              {t("step")} {currentStep + 1} / {STEPS.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              {config.icon}
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {config.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {config.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[stepKey] === option.value
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                    : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      answers[stepKey] === option.value
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[stepKey] === option.value && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {option.desc}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                currentStep === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              {t("back")}
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed || loading}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium transition ${
                !canProceed || loading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("analyzing")}
                </>
              ) : isLastStep ? (
                <>
                  {t("getResults")}
                  <Compass className="w-4 h-4" />
                </>
              ) : (
                <>
                  {t("next")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
