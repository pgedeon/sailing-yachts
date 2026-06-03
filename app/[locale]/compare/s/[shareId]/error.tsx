"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { localePath } from "@/lib/i18n-paths";

export default function SharedCompareError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Compare");

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-16 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {t("sharedComparison.errorTitle")}
      </h2>
      <p className="text-gray-600 mb-6">
        {t("sharedComparison.errorMessage")}
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {t("sharedComparison.tryAgain")}
        </button>
        <Link
          href={localePath("en", "/compare")}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
        >
          {t("sharedComparison.newComparison")}
        </Link>
      </div>
    </div>
  );
}
