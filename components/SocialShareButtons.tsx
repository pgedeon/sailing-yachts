"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share2, Twitter, Facebook, Linkedin, Link as LinkIcon, Check } from "lucide-react";

interface SocialShareButtonsProps {
  /** Full URL of the current page */
  url: string;
  /** Share title, e.g. "Beneteau Oceanis 40.1 (2024)" */
  title: string;
  /** Optional short description */
  description?: string;
  /** Extra CSS classes */
  className?: string;
}

export default function SocialShareButtons({
  url,
  title,
  description,
  className = "",
}: SocialShareButtonsProps) {
  const t = useTranslations("SocialShare");
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = description ? encodeURIComponent(description) : "";

  const shareLinks = [
    {
      name: "Twitter",
      icon: <Twitter className="h-4 w-4" aria-hidden="true" />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200",
    },
    {
      name: "Facebook",
      icon: <Facebook className="h-4 w-4" aria-hidden="true" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-4 w-4" aria-hidden="true" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200",
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`social-share-buttons flex items-center gap-2 ${className}`}
      data-testid="social-share-buttons"
    >
      <Share2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {t("share")}:
      </span>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-muted-foreground transition-colors ${link.color}`}
          aria-label={t("shareOn", { platform: link.name })}
          title={t("shareOn", { platform: link.name })}
        >
          {link.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopyLink}
        className={`inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-md border border-border text-sm transition-colors ${
          copied
            ? "bg-green-50 text-green-600 border-green-200"
            : "text-muted-foreground hover:bg-muted"
        }`}
        aria-label={t("copyLink")}
        title={t("copyLink")}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline text-xs">{t("copied")}</span>
          </>
        ) : (
          <>
            <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline text-xs">{t("copy")}</span>
          </>
        )}
      </button>
    </div>
  );
}
