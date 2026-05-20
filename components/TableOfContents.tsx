"use client";

import { useTranslations } from "next-intl";

interface TableOfContentsProps {
  sections: { id: string; label: string }[];
  activeId?: string;
}

export default function TableOfContents({
  sections,
  activeId,
}: TableOfContentsProps) {
  const t = useTranslations("TableOfContents");

  if (sections.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className="hidden lg:block sticky top-24"
      aria-label={t("label")}
      data-testid="table-of-contents"
    >
      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-semibold mb-3">{t("heading")}</h3>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => handleClick(section.id)}
                className={`text-left text-sm transition-colors w-full hover:text-primary ${
                  activeId === section.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
