import { sql, asc, eq, and, gte, lte, isNull, or, desc, count, ilike, SQL, inArray } from "drizzle-orm";

import { db, manufacturers, partnerOffers } from "@/lib/db";
import { slugify } from "@/lib/utils/slugify";

export interface PartnerOfferSummary {
  id: number;
  manufacturerId: number;
  dealerName: string;
  dealerType: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  serviceArea: string | null;
  specializations: string[];
  offerType: string;
  offerTitle: string;
  offerDescription: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  currency: string;
  validityStart: Date | null;
  validityEnd: Date | null;
  sourceConfidence: number;
  dataSource: string;
  dataSourceUrl: string | null;
  lastVerifiedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerOfferDetail extends PartnerOfferSummary {
  manufacturerName: string;
}

export interface PartnerStats {
  total: number;
  active: number;
  byType: Record<string, number>;
}

function parseSpecializations(value: string | string[] | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export async function getPartnerOffersByManufacturerId(
  manufacturerId: number,
  filters?: {
    onlyActive?: boolean;
    offerTypes?: string[];
    location?: string;
    serviceArea?: string;
  }
): Promise<PartnerOfferSummary[]> {
  const whereConditions: SQL[] = [
    eq(partnerOffers.manufacturerId, manufacturerId),
  ];

  // Filter for active offers if requested
  if (filters?.onlyActive !== false) {
    whereConditions.push(eq(partnerOffers.isActive, true));
  }

  // Filter by offer types
  if (filters?.offerTypes && filters.offerTypes.length > 0) {
    // Use sql template literal to bypass type checking for enum columns
    const placeholders = filters.offerTypes.map(() => '?').join(', ');
    whereConditions.push(
      sql`partner_offers.offer_type IN (${sql.raw(placeholders)})` as unknown as SQL
    );
  }

  // Filter by location (country/city)
  if (filters?.location) {
    whereConditions.push(
      or(
        eq(partnerOffers.locationCountry, filters.location),
        eq(partnerOffers.locationCity, filters.location)
      ) as SQL
    );
  }

  // Filter by service area
  if (filters?.serviceArea) {
    whereConditions.push(
      or(
        eq(partnerOffers.serviceArea, filters.serviceArea),
        ilike(partnerOffers.serviceArea, `%${filters.serviceArea}%`)
      ) as SQL
    );
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const rows = await db
    .select({
      id: partnerOffers.id,
      manufacturerId: partnerOffers.manufacturerId,
      dealerName: partnerOffers.dealerName,
      dealerType: partnerOffers.dealerType,
      contactName: partnerOffers.contactName,
      email: partnerOffers.email,
      phone: partnerOffers.phone,
      websiteUrl: partnerOffers.websiteUrl,
      locationCity: partnerOffers.locationCity,
      locationCountry: partnerOffers.locationCountry,
      serviceArea: partnerOffers.serviceArea,
      specializations: partnerOffers.specializations,
      offerType: partnerOffers.offerType,
      offerTitle: partnerOffers.offerTitle,
      offerDescription: partnerOffers.offerDescription,
      priceRangeMin: partnerOffers.priceRangeMin,
      priceRangeMax: partnerOffers.priceRangeMax,
      currency: partnerOffers.currency,
      validityStart: partnerOffers.validityStart,
      validityEnd: partnerOffers.validityEnd,
      sourceConfidence: partnerOffers.sourceConfidence,
      dataSource: partnerOffers.dataSource,
      dataSourceUrl: partnerOffers.dataSourceUrl,
      lastVerifiedAt: partnerOffers.lastVerifiedAt,
      isActive: partnerOffers.isActive,
      createdAt: partnerOffers.createdAt,
      updatedAt: partnerOffers.updatedAt,
    })
    .from(partnerOffers)
    .where(whereClause)
    .orderBy(desc(partnerOffers.isActive), desc(partnerOffers.sourceConfidence), asc(partnerOffers.dealerName));

  return rows.map((row: any): PartnerOfferSummary => ({
    ...row,
    specializations: parseSpecializations(row.specializations),
  }));
}

export async function getPartnerOfferById(id: number): Promise<PartnerOfferDetail | null> {
  const [offer] = await db
    .select({
      id: partnerOffers.id,
      manufacturerId: partnerOffers.manufacturerId,
      dealerName: partnerOffers.dealerName,
      dealerType: partnerOffers.dealerType,
      contactName: partnerOffers.contactName,
      email: partnerOffers.email,
      phone: partnerOffers.phone,
      websiteUrl: partnerOffers.websiteUrl,
      locationCity: partnerOffers.locationCity,
      locationCountry: partnerOffers.locationCountry,
      serviceArea: partnerOffers.serviceArea,
      specializations: partnerOffers.specializations,
      offerType: partnerOffers.offerType,
      offerTitle: partnerOffers.offerTitle,
      offerDescription: partnerOffers.offerDescription,
      priceRangeMin: partnerOffers.priceRangeMin,
      priceRangeMax: partnerOffers.priceRangeMax,
      currency: partnerOffers.currency,
      validityStart: partnerOffers.validityStart,
      validityEnd: partnerOffers.validityEnd,
      sourceConfidence: partnerOffers.sourceConfidence,
      dataSource: partnerOffers.dataSource,
      dataSourceUrl: partnerOffers.dataSourceUrl,
      lastVerifiedAt: partnerOffers.lastVerifiedAt,
      isActive: partnerOffers.isActive,
      createdAt: partnerOffers.createdAt,
      updatedAt: partnerOffers.updatedAt,
      manufacturerName: manufacturers.name,
    })
    .from(partnerOffers)
    .innerJoin(manufacturers, eq(partnerOffers.manufacturerId, manufacturers.id))
    .where(eq(partnerOffers.id, id))
    .limit(1);

  if (!offer) return null;

  return {
    ...offer,
    specializations: parseSpecializations(offer.specializations),
  };
}

export async function getPartnerStats(manufacturerId: number): Promise<PartnerStats> {
  const [totalResult] = await db
    .select({ count: count() })
    .from(partnerOffers)
    .where(eq(partnerOffers.manufacturerId, manufacturerId));

  const [activeResult] = await db
    .select({ count: count() })
    .from(partnerOffers)
    .where(
      and(
        eq(partnerOffers.manufacturerId, manufacturerId),
        eq(partnerOffers.isActive, true)
      )
    );

  const offersByType = await db
    .select({
      offerType: partnerOffers.offerType,
      count: count(),
    })
    .from(partnerOffers)
    .where(eq(partnerOffers.manufacturerId, manufacturerId))
    .groupBy(partnerOffers.offerType);

  const byType: Record<string, number> = {};
  for (const { offerType, count: typeCount } of offersByType) {
    byType[offerType] = typeCount;
  }

  return {
    total: totalResult?.count ?? 0,
    active: activeResult?.count ?? 0,
    byType,
  };
}

export async function getActivePartnerOffersCount(): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(partnerOffers)
    .where(eq(partnerOffers.isActive, true));

  return result?.count ?? 0;
}

export async function getPartnerOffersByType(
  offerType: string,
  limit = 10
): Promise<PartnerOfferSummary[]> {
  const rows = await db
    .select({
      id: partnerOffers.id,
      manufacturerId: partnerOffers.manufacturerId,
      dealerName: partnerOffers.dealerName,
      dealerType: partnerOffers.dealerType,
      contactName: partnerOffers.contactName,
      email: partnerOffers.email,
      phone: partnerOffers.phone,
      websiteUrl: partnerOffers.websiteUrl,
      locationCity: partnerOffers.locationCity,
      locationCountry: partnerOffers.locationCountry,
      serviceArea: partnerOffers.serviceArea,
      specializations: partnerOffers.specializations,
      offerType: partnerOffers.offerType,
      offerTitle: partnerOffers.offerTitle,
      offerDescription: partnerOffers.offerDescription,
      priceRangeMin: partnerOffers.priceRangeMin,
      priceRangeMax: partnerOffers.priceRangeMax,
      currency: partnerOffers.currency,
      validityStart: partnerOffers.validityStart,
      validityEnd: partnerOffers.validityEnd,
      sourceConfidence: partnerOffers.sourceConfidence,
      dataSource: partnerOffers.dataSource,
      dataSourceUrl: partnerOffers.dataSourceUrl,
      lastVerifiedAt: partnerOffers.lastVerifiedAt,
      isActive: partnerOffers.isActive,
      createdAt: partnerOffers.createdAt,
      updatedAt: partnerOffers.updatedAt,
    })
    .from(partnerOffers)
    .where(
      and(
        eq(partnerOffers.isActive, true),
        eq(partnerOffers.offerType, offerType as any)
      )
    )
    .orderBy(desc(partnerOffers.sourceConfidence), asc(partnerOffers.dealerName))
    .limit(limit);

  return rows.map((row: any): PartnerOfferSummary => ({
    ...row,
    specializations: parseSpecializations(row.specializations),
  }));
}

export async function searchPartnerOffers(
  query: string,
  filters?: {
    offerType?: string;
    dealerType?: string;
    location?: string;
    limit?: number;
  }
): Promise<PartnerOfferSummary[]> {
  const searchLimit = filters?.limit ?? 20;
  const whereConditions: SQL[] = [eq(partnerOffers.isActive, true)];

  if (query) {
    whereConditions.push(
      or(
        ilike(partnerOffers.dealerName, `%${query}%`),
        ilike(partnerOffers.offerTitle, `%${query}%`),
        ilike(partnerOffers.offerDescription, `%${query}%`),
        ilike(partnerOffers.locationCity, `%${query}%`),
        ilike(partnerOffers.locationCountry, `%${query}%`)
      ) as SQL
    );
  }

  if (filters?.offerType) {
    whereConditions.push(eq(partnerOffers.offerType, filters.offerType as any));
  }

  if (filters?.dealerType) {
    whereConditions.push(eq(partnerOffers.dealerType, filters.dealerType as any));
  }

  if (filters?.location) {
    whereConditions.push(
      or(
        ilike(partnerOffers.locationCity, `%${filters.location}%`),
        ilike(partnerOffers.locationCountry, `%${filters.location}%`),
        ilike(partnerOffers.serviceArea, `%${filters.location}%`)
      ) as SQL
    );
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const rows = await db
    .select({
      id: partnerOffers.id,
      manufacturerId: partnerOffers.manufacturerId,
      dealerName: partnerOffers.dealerName,
      dealerType: partnerOffers.dealerType,
      contactName: partnerOffers.contactName,
      email: partnerOffers.email,
      phone: partnerOffers.phone,
      websiteUrl: partnerOffers.websiteUrl,
      locationCity: partnerOffers.locationCity,
      locationCountry: partnerOffers.locationCountry,
      serviceArea: partnerOffers.serviceArea,
      specializations: partnerOffers.specializations,
      offerType: partnerOffers.offerType,
      offerTitle: partnerOffers.offerTitle,
      offerDescription: partnerOffers.offerDescription,
      priceRangeMin: partnerOffers.priceRangeMin,
      priceRangeMax: partnerOffers.priceRangeMax,
      currency: partnerOffers.currency,
      validityStart: partnerOffers.validityStart,
      validityEnd: partnerOffers.validityEnd,
      sourceConfidence: partnerOffers.sourceConfidence,
      dataSource: partnerOffers.dataSource,
      dataSourceUrl: partnerOffers.dataSourceUrl,
      lastVerifiedAt: partnerOffers.lastVerifiedAt,
      isActive: partnerOffers.isActive,
      createdAt: partnerOffers.createdAt,
      updatedAt: partnerOffers.updatedAt,
    })
    .from(partnerOffers)
    .where(whereClause)
    .orderBy(desc(partnerOffers.sourceConfidence), desc(partnerOffers.createdAt))
    .limit(searchLimit);

  return rows.map((row: any): PartnerOfferSummary => ({
    ...row,
    specializations: parseSpecializations(row.specializations),
  }));
}
