"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

interface SailboatArticle {
  id: string;
  title: string;
  description: string;
  url: string;
}

interface RelatedArticlesProps {
  manufacturer: string;
  lengthOverall: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  displacement: number | null;
}

export function RelatedArticles(yacht: RelatedArticlesProps) {
  const [articles, setArticles] = useState<SailboatArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      manufacturer: yacht.manufacturer || "",
      loa: String(yacht.lengthOverall ?? ""),
      rig: yacht.rigType || "",
      keel: yacht.keelType || "",
      hull: yacht.hullMaterial || "",
      cabins: String(yacht.cabins ?? ""),
      displacement: String(yacht.displacement ?? ""),
    });

    fetch(`/api/sailboat-articles?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles || []);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [
    yacht.manufacturer,
    yacht.lengthOverall,
    yacht.rigType,
    yacht.keelType,
    yacht.hullMaterial,
    yacht.cabins,
    yacht.displacement,
  ]);

  if (loading) {
    return (
      <div className="mt-10 sm:mt-12">
        <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Related Sailing Articles
        </h2>
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 bg-muted rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section
      className="related-articles-section mt-10 sm:mt-12"
      data-testid="related-articles-section"
    >
      <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
        <ExternalLink className="h-5 w-5" />
        Related Sailing Articles
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="related-article-card"
            className="group block border border-border rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base group-hover:text-blue-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                  {article.description}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 shrink-0 mt-0.5" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block px-1.5 py-0.5 bg-muted rounded text-[10px] font-medium">
                sailboats.fr
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
