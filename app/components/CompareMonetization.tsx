"use client";

import { trackLeadSubmit, trackInquiryModalOpen, trackGuideCtaClick } from "@/lib/revenue-analytics";

import { useState } from "react";
import { ShoppingBag, Mail, Phone, Info, ExternalLink, Clock, CheckCircle2 } from "lucide-react";
import AffiliateRecommendations from "./AffiliateRecommendations";
import { getAffiliateRecommendations, type AffiliateCategory } from "@/lib/affiliate-recommendations";
import { calculatePriceTier, type PriceTier } from "@/lib/price-tier";

interface Yacht {
  id: number;
  manufacturer: string;
  modelName: string;
  lengthOverall: number | null;
  displacement: number | null;
  beam: number | null;
  cabins: number | null;
  hullMaterial: string | null;
  keelType: string | null;
  rigType: string | null;
}

interface CompareMonetizationProps {
  yachts: Yacht[];
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  yachtIds: string;
}

/**
 * CompareMonetization component adds monetization CTAs to comparison pages:
 * - Affiliate gear recommendations based on yacht characteristics
 * - Dealer/broker lead inquiry forms
 * - Contextual CTAs based on comparison results
 */
export function CompareMonetization({ yachts }: CompareMonetizationProps) {
  const [activeTab, setActiveTab] = useState<"affiliate" | "inquiry">("affiliate");
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  // Generate affiliate recommendations for all compared yachts
  const allAffiliateCategories: AffiliateCategory[] = [];
  for (const yacht of yachts) {
    const priceTier = calculatePriceTier({
      lengthOverall: yacht.lengthOverall,
      displacement: yacht.displacement,
      beam: yacht.beam,
      cabins: yacht.cabins,
      hullMaterial: yacht.hullMaterial,
      keelType: yacht.keelType,
      rigType: yacht.rigType,
    });
    const categories = getAffiliateRecommendations({
      ...yacht,
      priceTier: priceTier.tier as PriceTier,
    });
    allAffiliateCategories.push(...categories);
  }

  // Deduplicate affiliate categories by product name
  const uniqueAffiliateCategories: AffiliateCategory[] = [];
  const seenProducts = new Set<string>();
  for (const category of allAffiliateCategories) {
    const uniqueProducts = category.products.filter(p => {
      if (seenProducts.has(p.name)) return false;
      seenProducts.add(p.name);
      return true;
    });
    if (uniqueProducts.length > 0) {
      uniqueAffiliateCategories.push({
        ...category,
        products: uniqueProducts,
      });
    }
  }

  // Determine contextual messaging
  const avgLength = yachts.reduce((sum, y) => sum + (y.lengthOverall || 0), 0) / yachts.length;
  const allPremium = yachts.every(y => {
    const tier = calculatePriceTier({
      lengthOverall: y.lengthOverall,
      displacement: y.displacement,
      beam: y.beam,
      cabins: y.cabins,
      hullMaterial: y.hullMaterial,
      keelType: y.keelType,
      rigType: y.rigType,
    });
    return ["premium", "luxury"].includes(tier.tier);
  });

  const contextualMessage = allPremium
    ? "Comparing premium yachts? Our partner brokers can help you find the perfect match with available inventory and financing options."
    : avgLength > 12
    ? "Looking at cruising-sized yachts? Connect with dealers for demo sails and availability."
    : "Not sure which yacht is right for you? Talk to a broker who can help narrow down your options.";

  const handleInquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryError(null);

    const formData = new FormData(e.currentTarget);
    const data: LeadFormData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      message: formData.get("message") as string,
      yachtIds: yachts.map(y => y.id).join(","),
    };

    try {
      // Send to lead capture API
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
      }

      trackLeadSubmit({ leadType: "dealer_inquiry", yachtIds: yachts.map(y => y.id) });
      setInquirySubmitted(true);
    } catch (error) {
      setInquiryError("Unable to submit inquiry. Please try again.");
    } finally {
      setInquiryLoading(false);
    }
  };

  return (
    <div className="compare-monetization space-y-8">
      {/* Contextual CTA Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-lg font-semibold mb-1">Still deciding?</p>
            <p className="text-blue-100 text-sm">{contextualMessage}</p>
          </div>
          <button
            onClick={() => { setShowInquiryModal(true); trackInquiryModalOpen({ yachtIds: yachts.map(y => y.id), source: "broker_cta_banner" }); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Talk to a Broker
          </button>
        </div>
      </div>

      {/* Service CTAs: Insurance & Charter/Demo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Insurance CTA */}
        <a
          href="https://www.sailboats.fr/insurance"
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all"
          data-testid="cta-insurance"
          onClick={() => trackGuideCtaClick({ ctaType: "insurance", targetUrl: "/insurance" })}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Yacht Insurance</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Get competitive quotes for marine insurance tailored to your chosen yacht.
          </p>
          <span className="text-xs text-blue-600 font-medium group-hover:underline">Get a quote →</span>
        </a>

        {/* Charter / Demo Sail CTA */}
        <a
          href="https://www.sailboats.fr/charter"
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all"
          data-testid="cta-charter-demo"
          onClick={() => trackGuideCtaClick({ ctaType: "charter_demo", targetUrl: "/charter" })}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Charter & Demo Sails</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Test before you buy — find charter companies offering these models near you.
          </p>
          <span className="text-xs text-blue-600 font-medium group-hover:underline">Find charters →</span>
        </a>

        {/* Financing CTA */}
        <a
          href="https://www.sailboats.fr/financing"
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all"
          data-testid="cta-financing"
          onClick={() => trackGuideCtaClick({ ctaType: "financing", targetUrl: "/financing" })}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Marine Financing</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Explore financing options and monthly payment estimates for your top picks.
          </p>
          <span className="text-xs text-blue-600 font-medium group-hover:underline">Explore options →</span>
        </a>
      </div>

      {/* Monetization Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("affiliate")}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "affiliate"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4" />
              Recommended Gear
            </span>
          </button>
          <button
            onClick={() => { setShowInquiryModal(true); trackInquiryModalOpen({ yachtIds: yachts.map(y => y.id), source: "inquiry_tab" }); }}
            className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
              showInquiryModal
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              Request Info
            </span>
          </button>
        </div>
      </div>

      {/* Affiliate Recommendations Tab */}
      {activeTab === "affiliate" && (
        <AffiliateRecommendations categories={uniqueAffiliateCategories} />
      )}

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Request More Information</h2>
              <button
                onClick={() => {
                  setShowInquiryModal(false);
                  setInquirySubmitted(false);
                  setInquiryError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              {inquirySubmitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inquiry Submitted</h3>
                  <p className="text-gray-600 mb-4">
                    A broker will contact you shortly to help with your yacht selection.
                  </p>
                  <button
                    onClick={() => {
                      setShowInquiryModal(false);
                      setInquirySubmitted(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Yachts Summary */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">Inquiring about:</p>
                    <ul className="space-y-1">
                      {yachts.map(yacht => (
                        <li key={yacht.id} className="text-sm text-gray-700">
                          • {yacht.manufacturer} {yacht.modelName}
                          {yacht.lengthOverall && ` (${yacht.lengthOverall}m)`}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Inquiry Form */}
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-none"
                        placeholder="Tell us more about what you're looking for..."
                      />
                    </div>

                    {inquiryError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {inquiryError}
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        Your inquiry will be routed to partner brokers and dealers. We may share your contact
                        information with relevant brokers to help you find the right yacht.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowInquiryModal(false);
                          setInquiryError(null);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={inquiryLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {inquiryLoading ? (
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Submitting...
                          </span>
                        ) : (
                          "Submit Inquiry"
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
