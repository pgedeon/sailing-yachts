"use client";

import { useLocale } from "next-intl";
import React from "react";
import { useFavorites } from "@/lib/useFavorites";
import { localePath } from "@/lib/i18n-paths";

export function FavoritesBadge() {
  const locale = useLocale();
  const { count } = useFavorites();

  return (
    <a
      href={localePath(locale, "/favorites")}
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative"
    >
      Favorites
      {count > 0 && (
        <span className="absolute -top-2 -right-4 ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </a>
  );
}
