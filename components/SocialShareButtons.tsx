"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share2, Link as LinkIcon, Check } from "lucide-react";

// Brand icons (removed from lucide-react v1) — inline SVGs
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

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
      icon: <TwitterIcon className="h-4 w-4" aria-hidden="true" />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200",
    },
    {
      name: "Facebook",
      icon: <FacebookIcon className="h-4 w-4" aria-hidden="true" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
    },
    {
      name: "LinkedIn",
      icon: <LinkedinIcon className="h-4 w-4" aria-hidden="true" />,
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
