import { localePath } from "@/lib/i18n-paths";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  generateBreadcrumbJsonLd,
  generateLocalBusinessJsonLd,
  getSiteUrl,
  buildLocaleAlternates,
} from "@/lib/seo";
import {
  getPartnerOffersByManufacturerId,
} from "@/lib/partner-offers";
import { getManufacturerBySlug } from "@/lib/manufacturers";
import { getPartnersParams } from "@/lib/static-params";

export const revalidate = 3600;


// ISR: Revalidate partner pages every 6 hours



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
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  return getPartnersParams();
}

export async function generateMetadata(props: PartnersPageProps): Promise<Metadata> {
  const params = await props.params;
  const { slug, 
locale } = params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Manufacturers" });
  const data = await getPartnerPageData(slug);

  if (!data || !data.manufacturer) {
    notFound();
  }

  const manufacturer = data.manufacturer;
  const title = t("partners.meta.title", { name: manufacturer.name });
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
    alternates: buildLocaleAlternates(`/manufacturers/${slug}/partners`),
  };
}

export default async function PartnersPage(props: PartnersPageProps) {
  const params = await props.params;
  const { slug, locale } = params;
  const t = await getTranslations({ locale, namespace: "Manufacturers" });
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
  ], locale);

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
              <Link href={localePath(locale, "/")} className="hover:text-foreground transition-colors">
                {t("partners.breadcrumb.home")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={localePath(locale, "/manufacturers")}
                className="hover:text-foreground transition-colors"
              >
                {t("partners.breadcrumb.manufacturers")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={localePath(locale, `/manufacturers/${slug}`)}
                className="hover:text-foreground transition-colors"
              >
                {manufacturer.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium">
              {t("partners.breadcrumb.partners")}
            </li>
          </ol>
        </nav>

        <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            {t("partners.officialNetwork")}
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {t("partners.title", { name: manufacturer.name })}
              </h1>
              <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
                {t("partners.description", { name: manufacturer.name })}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">{t("partners.stats.activePartners")}</div>
              <div className="mt-1 text-lg font-semibold">
                {activeDealers.length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">{t("partners.stats.authorizedDealers")}</div>
              <div className="mt-1 text-lg font-semibold">
                {dealers.length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">{t("partners.stats.serviceCenters")}</div>
              <div className="mt-1 text-lg font-semibold">
                {serviceCenters.length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">{t("partners.stats.brokers")}</div>
              <div className="mt-1 text-lg font-semibold">
                {brokers.length}
              </div>
            </div>
          </div>
        </section>

        {!hasOffers ? (
          <section className="mt-10 sm:mt-12 text-center py-12">
            <div className="rounded-xl border border-dashed border-border p-8 text-muted-foreground">
              <h2 className="text-xl font-semibold mb-2">{t("partners.empty.title", { name: manufacturer.name })}</h2>
              <p>{t("partners.empty.description", { name: manufacturer.name })}</p>
            </div>
          </section>
        ) : (
          <>
            {/* Quick Filters */}
            <section className="mt-8 sm:mt-10 bg-muted/30 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">{t("partners.filters.title")}</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={localePath(locale, `/manufacturers/${slug}/partners?type=all`)}
                  className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  {t("partners.filters.all")}
                </Link>
                <Link
                  href={localePath(locale, `/manufacturers/${slug}/partners?type=dealer`)}
                  className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  {t("partners.filters.dealersSales")}
                </Link>
                <Link
                  href={localePath(locale, `/manufacturers/${slug}/partners?type=service`)}
                  className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  {t("partners.filters.serviceCenters")}
                </Link>
                <Link
                  href={localePath(locale, `/manufacturers/${slug}/partners?type=broker`)}
                  className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  {t("partners.filters.brokers")}
                </Link>
                <Link
                  href={localePath(locale, `/manufacturers/${slug}/partners?type=parts`)}
                  className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  {t("partners.filters.partsChandlery")}
                </Link>
              </div>
            </section>

            {/* Partner Grid */}
            <section className="mt-10 sm:mt-12">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{t("partners.authorizedPartners")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("partners.verifiedPartnersWorldwide", { count: activeDealers.length, name: manufacturer.name })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {activeDealers.map((offer) => (
                  <PartnerCard key={offer.id} offer={offer} manufacturer={manufacturer.name} t={t} />
                ))}
              </div>
            </section>

            {/* About Partner Program */}
            <section className="mt-12 sm:mt-16 bg-sky-50 rounded-2xl p-8">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">{t("partners.whyChoose.title", { name: manufacturer.name })}</h2>
                <p className="text-muted-foreground mb-6">
                  {t("partners.whyChoose.description")}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">✓</span>
                    </div>
                    <h3 className="font-semibold mb-2">{t("partners.whyChoose.genuineProducts")}</h3>
                    <p className="text-sm text-muted-foreground">{t("partners.whyChoose.genuineDescription", { name: manufacturer.name })}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">⚡</span>
                    </div>
                    <h3 className="font-semibold mb-2">{t("partners.whyChoose.expertSupport")}</h3>
                    <p className="text-sm text-muted-foreground">{t("partners.whyChoose.expertDescription")}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">🛡️</span>
                    </div>
                    <h3 className="font-semibold mb-2">{t("partners.whyChoose.warrantyProtection")}</h3>
                    <p className="text-sm text-muted-foreground">{t("partners.whyChoose.warrantyDescription")}</p>
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
function PartnerCard({ offer, manufacturer, t }: { offer: any; manufacturer: string; t: any }) {
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
        return t("partners.card.typeLabels.newSales");
      case 'used_sales':
        return t("partners.card.typeLabels.usedSales");
      case 'service':
        return t("partners.card.typeLabels.service");
      case 'repair':
        return t("partners.card.typeLabels.repair");
      case 'brokerage':
        return t("partners.card.typeLabels.brokerage");
      case 'parts':
        return t("partners.card.typeLabels.parts");
      case 'charter':
        return t("partners.card.typeLabels.charter");
      case 'consultation':
        return t("partners.card.typeLabels.consultation");
      default:
        return t("partners.card.typeLabels.partner");
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 4) return { label: t("partners.card.confidence.verified"), color: 'bg-green-100 text-green-800' };
    if (confidence >= 3) return { label: t("partners.card.confidence.high"), color: 'bg-blue-100 text-blue-800' };
    if (confidence >= 2) return { label: t("partners.card.confidence.moderate"), color: 'bg-yellow-100 text-yellow-800' };
    return { label: t("partners.card.confidence.low"), color: 'bg-gray-100 text-gray-800' };
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
                    {t("partners.card.inactive")}
                  </span>
                )}
                {isExpired && (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                    {t("partners.card.expired")}
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
              {t("partners.card.more", { count: offer.specializations.length - 2 })}
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
              🌐 {t("partners.card.website")}
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
            🎯 {t("partners.card.serviceArea", { area: offer.serviceArea })}
          </div>
        )}

        {/* Price Range */}
        {(offer.priceRangeMin || offer.priceRangeMax) && (
          <div className="mt-3 text-sm font-medium text-sky-700">
            💰 {t("partners.card.priceRange", { range: formatPrice(offer.priceRangeMin, offer.priceRangeMax, offer.currency) })}
          </div>
        )}

        {/* Validity */}
        {offer.validityStart && (
          <div className="mt-2 text-xs text-muted-foreground">
            📅 {t("partners.card.validFrom", { start: new Date(offer.validityStart).toLocaleDateString() })}
            {offer.validityEnd ? t("partners.card.validTo", { end: new Date(offer.validityEnd).toLocaleDateString() }) : ""}
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
          📊 {t("partners.card.dataFrom", { source: offer.dataSource })}
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
