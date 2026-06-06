"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { EmailYachtDialog } from "./EmailYachtDialog";

interface EmailYachtButtonProps {
  yachtSlug: string;
  yachtName: string;
  className?: string;
}

export function EmailYachtButton({
  yachtSlug,
  yachtName,
  className = "",
}: EmailYachtButtonProps) {
  const t = useTranslations("EmailYacht");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 ${className}`}
        aria-label={t("button")}
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t("button")}</span>
      </button>
      <EmailYachtDialog
        yachtSlug={yachtSlug}
        yachtName={yachtName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
