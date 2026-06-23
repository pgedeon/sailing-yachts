"use client";

import { ShoppingBag, ExternalLink, Info } from "lucide-react";
import type { AffiliateCategory } from "@/lib/affiliate-recommendations";
import { getAffiliateDisclosure } from "@/lib/affiliate-recommendations";
import { trackAffiliateClick } from "@/lib/revenue-analytics";
import { useState } from "react";

interface AffiliateRecommendationsProps {
  categories: AffiliateCategory[];
}

export default function AffiliateRecommendations({ categories }: AffiliateRecommendationsProps) {
  const [showDisclosure, setShowDisclosure] = useState(false);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="affiliate-recommendations mt-10 sm:mt-12 no-print">
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="h-6 w-6 text-blue-700"  aria-hidden="true" />
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900">
            Recommended Gear & Equipment
          </h2>
        </div>

        {/* Affiliate disclosure (small, subtle) */}
        <div className="mb-4">
          <button
            onClick={() => setShowDisclosure(!showDisclosure)}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            type="button"
          >
            <Info className="h-3 w-3"  aria-hidden="true" />
            {showDisclosure ? "Hide" : "Show"} affiliate disclosure
          </button>
          {showDisclosure && (
            <p className="text-xs text-gray-600 mt-2 p-2 bg-white/50 rounded border border-gray-200">
              {getAffiliateDisclosure()}
            </p>
          )}
        </div>

        {/* Categories grid */}
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="category-section">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl" role="img" aria-label={category.label}>
                  {category.icon}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">{category.label}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {category.products.map((product) => (
                  <a
                    key={product.id}
                    href={product.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all group"
                    data-testid={`affiliate-product-${product.id}`}
                    onClick={() =>
                      trackAffiliateClick({
                        productId: product.id,
                        productName: product.name,
                        category: category.label,
                      })
                    }
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base">
                        {product.name}
                      </h4>
                      <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-blue-600 shrink-0 ml-2"  aria-hidden="true" />
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-medium text-blue-600">
                        {product.priceRange}
                      </span>
                      <span className="text-xs text-gray-500">Amazon</span>
                    </div>

                    {/* Recommended product examples */}
                    {product.recommendedProducts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Recommended:</p>
                        <div className="flex flex-wrap gap-1">
                          {product.recommendedProducts.slice(0, 2).map((rec, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                            >
                              {rec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom disclosure */}
        <div className="mt-6 pt-4 border-t border-blue-200 text-xs text-gray-600">
          {getAffiliateDisclosure()}
        </div>
      </div>
    </section>
  );
}
