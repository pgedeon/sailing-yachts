/**
 * P21.4: Price Aggregation Types
 *
 * Types for the price data aggregation pipeline.
 */

export type PriceCondition = 'new' | 'used' | 'broker';

export interface PriceProviderResult {
  provider: string;
  yachtSlug: string;
  yachtModelId: number;
  modelName: string;
  manufacturerName: string;
  year: number;
  priceMin: number;
  priceMax: number;
  currency: string;
  condition: PriceCondition;
  sourceUrl: string | null;
  confidenceScore: number;
  listingCount: number;
  fetchedAt: Date;
}

export interface PriceProvider {
  name: string;
  description: string;
  isAvailable(): Promise<boolean>;
  fetchPrices(candidates: PriceCandidate[]): Promise<PriceProviderResult[]>;
}

export interface PriceCandidate {
  id: number;
  slug: string;
  modelName: string;
  manufacturerName: string;
  year: number;
  lengthOverall: number | null;
  displacement: number | null;
  beam: number | null;
  cabins: number | null;
  existingPriceCount: number;
}

export interface AggregationRun {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  status: 'running' | 'completed' | 'failed';
  provider: string;
  candidatesTotal: number;
  resultsFound: number;
  pricesCreated: number;
  pricesUpdated: number;
  errors: string[];
}

export interface AggregationStatus {
  totalYachts: number;
  yachtsWithPrices: number;
  yachtsWithoutPrices: number;
  coveragePercent: number;
  byCondition: Record<PriceCondition, number>;
  byCurrency: Record<string, number>;
  byProvider: Record<string, number>;
  recentRuns: AggregationRun[];
}
