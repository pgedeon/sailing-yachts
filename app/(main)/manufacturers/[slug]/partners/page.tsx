import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";

import {
  generateBreadcrumbJsonLd,
  generateLocalBusinessJsonLd,
  getSiteUrl,
} from "@/lib/seo";
import {
  getPartnerOffersByManufacturerId,
} from "@/lib/partner-offers";
import { getManufacturerBySlug } from "@/lib/manufacturers";

// ISR: Revalidate partner pages every 6 hours
export const revalidate = 21600;

// Cache partner offers query with tag for invalidation
async function getPartnerPageData(slug: string) {
  return unstable_cache(
    async () => {
      const manufacturer = await getManufacturerBySlug(slug);
      if (!manufacturer) return null;

      const partnerOffers = await getPartnerOffersByManufacturerId(manufacturer.id);

      return { manufacturer, partnerOffers };
    },
    [`manufacturer-partners:${slug}`],
    { tags: [`manufacturer:${slug}`, "partner-offers"], revalidate: 21600 }
  )();
}

interface PartnersPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PartnersPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPartnerPageData(slug);

  if (!data || !data.manufacturer) {
    return {
      title: "Manufacturer Not Found",
      description: "The requested sailing yacht manufacturer could not be found.",
    };
  }

  const manufacturer = data.manufacturer;
  const title = `${manufacturer.name} Partners & Dealers | Authorized Dealers, Brokers & Services`;
  const description = manufacturer.description
    ? `${manufacturer.description} - Find authorized ${manufacturer.name} dealers, brokers, service centers, and yacht sales partners.`
    : `Discover authorized ${manufacturer.name} dealers, brokers, service centers, and yacht sales partners worldwide.`;

  return {
    title,
    description,
    keywords: [
      manufacturer.name,
      `${manufacturer.name} dealers`,
      `${manufacturer.name} brokers`,
      `${manufacturer.name} service centers`,
      `${manufacturer.name} authorized`,
      `${manufacturer.name} partners`,
      "yacht dealer",
      "boat broker",
      "marine services",
    ],
    openGraph: {
      title,
      description,
      url: getSiteUrl(`/manufacturers/${slug}/partners`),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [{ url: getSiteUrl("/api/og"), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getSiteUrl("/api/og")],
    },
    alternates: {
      canonical: getSiteUrl(`/manufacturers/${slug}/partners`),
    },
  };
}

export default async function PartnersPage({
  params,
}: PartnersPageProps) {
  const { slug } = await params;
  const data = await getPartnerPageData(slug);

  if (!data || !data.manufacturer) {
    notFound();
  }

  const { manufacturer, partnerOffers } = data;

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Manufacturers", path: "/manufacturers" },
    { name: manufacturer.name, path: `/manufacturers/${slug}` },
    { name: "Partners & Dealers" },
  ]);

  // Aggregate data for schema
  const hasOffers = partnerOffers.length > 0;
  const activeDealers = partnerOffers.filter(offer => offer.isActive);
  const serviceCenters = activeDealers.filter(offer => offer.offerType === 'service' || offer.offerType === 'repair');
  const dealers = activeDealers.filter(offer => offer.offerType === 'new_sales' || offer.offerType === 'used_sales');
  const brokers = activeDealers.filter(offer => offer.offerType === 'brokerage');

  const firstOffer = partnerOffers[0];

  const localBusinessJsonLd = generateLocalBusinessJsonLd({
    name: `${manufacturer.name} Authorized Partners`,
    description: `Authorized ${manufacturer.name} dealers, brokers, and service centers worldwide`,
    url: getSiteUrl(`/manufacturers/${slug}/partners`),
    address: {
      city: firstOffer?.locationCity ?? undefined,
      country: firstOffer?.locationCountry ?? manufacturer.country ?? undefined,
    },
    contact: {
      email: firstOffer?.email ?? undefined,
      phone: firstOffer?.phone ?? undefined,
    },
    openingHours: partnerOffers.map(offer => ({
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "18:00",
    })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/manufacturers"
                className="hover:text-foreground transition-colors"
              >
                Manufacturers
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/manufacturers/${slug}`}
                className="hover:text-foreground transition-colors"
              >
                {manufacturer.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium">
              Partners & Dealers
            </li>
          </ol>
        </nav>

        <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Official Network
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {manufacturer.name} Partners & Dealers
              </h1>
              <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
                Connect with authorized {manufacturer.name} dealers, brokers, and service centers worldwide.
                All partners are verified and offer genuine {manufacturer.name} products and services.
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">Active Partners</div>
              <div className="mt-1 text-lg font-semibold">
                {activeDealers.length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">Authorized Dealers</div>
              <div className="mt-1 text-lg font-semibold">
                {dealers.length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">Service Centers</div>
              <div className="mt-1 text-lg font-semibold">
                {serviceCenters.length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">Brokers</div>
              <div className="mt-1 text-lg font-semibold">
                {brokers.length}
              </div>
            </div>
          </div>
        </section>

        {!hasOffers ? (
          <section className="mt-10 sm:mt-12 text-center py-12">
            <div className="rounded-xl border border-dashed border-border p-8 text-muted-foreground">
              <h2 className="text-xl font-semibold mb-2">Partner Network Coming Soon</h2>
              <p>We're building out the official {manufacturer.name} partner network. Check back soon for authorized dealers, brokers, and service centers in your area.</p>
            </div>
          </section>
        ) : (
          <>
            {/* Quick Filters */}
            <section className="mt-8 sm:mt-10 bg-muted/30 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Find Partners By:</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/manufacturers/${slug}/partners?type=all`}
                  className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  All Partners
                </Link>
                <Link
                  href={`/manufacturers/${slug}/partners?type=dealer`}
                  className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  Dealers & Sales
                </Link>
                <Link
                  href={`/manufacturers/${slug}/partners?type=service`}
                  className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  Service Centers
                </Link>
                <Link
                  href={`/manufacturers/${slug}/partners?type=broker`}
                  className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  Brokers
                </Link>
                <Link
                  href={`/manufacturers/${slug}/partners?type=parts`}
                  className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  Parts & Chandlery
                </Link>
              </div>
            </section>

            {/* Partner Grid */}
            <section className="mt-10 sm:mt-12">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Authorized Partners</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeDealers.length} verified {manufacturer.name} partners worldwide
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {activeDealers.map((offer) => (
                  <PartnerCard key={offer.id} offer={offer} manufacturer={manufacturer.name} />
                ))}
              </div>
            </section>

            {/* About Partner Program */}
            <section className="mt-12 sm:mt-16 bg-sky-50 rounded-2xl p-8">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">Why Choose an Official {manufacturer.name} Partner?</h2>
                <p className="text-muted-foreground mb-6">
                  All authorized partners meet our stringent standards for quality, service, and customer satisfaction.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">✓</span>
                    </div>
                    <h3 className="font-semibold mb-2">Genuine Products</h3>
                    <p className="text-sm text-muted-foreground">Authentic {manufacturer.name} parts and equipment</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">⚡</span>
                    </div>
                    <h3 className="font-semibold mb-2">Expert Support</h3>
                    <p className="text-sm text-muted-foreground">Factory-trained technicians and support staff</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">🛡️</span>
                    </div>
                    <h3 className="font-semibold mb-2">Warranty Protection</h3>
                    <p className="text-sm text-muted-foreground">Full manufacturer warranty coverage</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

// Partner Card Component
function PartnerCard({ offer, manufacturer }: { offer: any; manufacturer: string }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new_sales':
      case 'used_sales':
        return '🚤';
      case 'service':
      case 'repair':
        return '🔧';
      case 'brokerage':
        return '📊';
      case 'parts':
        return '⚙️';
      case 'charter':
        return '⛵';
      case 'consultation':
        return '💬';
      default:
        return '🏢';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'new_sales':
        return 'New Sales';
      case 'used_sales':
        return 'Used Sales';
      case 'service':
        return 'Service Center';
      case 'repair':
        return 'Repair Shop';
      case 'brokerage':
        return 'Yacht Broker';
      case 'parts':
        return 'Parts & Chandlery';
      case 'charter':
        return 'Charter Company';
      case 'consultation':
        return 'Consultation';
      default:
        return 'Partner';
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 4) return { label: 'Verified', color: 'bg-green-100 text-green-800' };
    if (confidence >= 3) return { label: 'High Confidence', color: 'bg-blue-100 text-blue-800' };
    if (confidence >= 2) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low Confidence', color: 'bg-gray-100 text-gray-800' };
  };

  const confidenceBadge = getConfidenceBadge(offer.sourceConfidence || 3);

  const isActive = offer.isActive;
  const isValid = offer.validityStart ? new Date() >= new Date(offer.validityStart) : true;
  const isExpired = offer.validityEnd ? new Date() >= new Date(offer.validityEnd) : false;

  return (
    <div className={`rounded-xl border border-border bg-card overflow-hidden shadow-sm ${isActive && isValid && !isExpired ? 'hover:shadow-md hover:border-sky-200 transition-all' : 'opacity-60'}`}>
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getTypeIcon(offer.offerType)}</span>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                {offer.dealerName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${confidenceBadge.color}`}>
                  {confidenceBadge.label}
                </span>
                {!isActive && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
                {isExpired && (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                    Expired
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Service Types */}
        <div className="flex flex-wrap gap-1">
          <span className="text-xs bg-sky-100 text-sky-800 px-2 py-1 rounded">
            {getTypeLabel(offer.offerType)}
          </span>
          {offer.specializations?.slice(0, 2).map((spec: string, index: number) => (
            <span key={index} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
              {spec}
            </span>
          ))}
          {offer.specializations && offer.specializations.length > 2 && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
              +{offer.specializations.length - 2} more
            </span>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="p-5">
        {offer.contactName && (
          <div className="text-sm font-medium mb-2">{offer.contactName}</div>
        )}

        <div className="space-y-2 text-sm">
          {offer.email && (
            <a
              href={`mailto:${offer.email}`}
              className="text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-2"
            >
              📧 {offer.email}
            </a>
          )}
          {offer.phone && (
            <a
              href={`tel:${offer.phone}`}
              className="text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-2"
            >
              📞 {offer.phone}
            </a>
          )}
          {offer.websiteUrl && (
            <a
              href={offer.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-2"
            >
              🌐 Website →
            </a>
          )}
        </div>

        {/* Location */}
        {(offer.locationCity || offer.locationCountry) && (
          <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
            📍 {offer.locationCity && `${offer.locationCity}, `}
            {offer.locationCountry}
          </div>
        )}

        {/* Service Area */}
        {offer.serviceArea && (
          <div className="mt-2 text-sm text-muted-foreground">
            🎯 Service Area: {offer.serviceArea}
          </div>
        )}

        {/* Price Range */}
        {(offer.priceRangeMin || offer.priceRangeMax) && (
          <div className="mt-3 text-sm font-medium text-sky-700">
            💰 Price Range: {formatPrice(offer.priceRangeMin, offer.priceRangeMax, offer.currency)}
          </div>
        )}

        {/* Validity */}
        {offer.validityStart && (
          <div className="mt-2 text-xs text-muted-foreground">
            📅 Valid from {new Date(offer.validityStart).toLocaleDateString()}
            {offer.validityEnd && ` to ${new Date(offer.validityEnd).toLocaleDateString()}`}
          </div>
        )}

        {/* Description */}
        {offer.offerDescription && (
          <div className="mt-3 text-sm text-muted-foreground line-clamp-3">
            {offer.offerDescription}
          </div>
        )}

        {/* Source Disclosure */}
        <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          📊 Data from {offer.dataSource}
          {offer.dataSourceUrl && (
            <a
              href={offer.dataSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-700 ml-1"
            >
              🔗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function formatPrice(min: number | null, max: number | null, currency: string = 'EUR'): string {
  if (!min && !max) return 'Price on request';
  if (!max && min) return `${currency}${min.toLocaleString()}`;
  if (!min && max) return `Up to ${currency}${max.toLocaleString()}`;
  if (min && max) return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
  return 'Price on request';
}
