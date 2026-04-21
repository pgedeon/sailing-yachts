// API Contract Tests
// These tests verify that API responses match their expected contracts

import { test, expect } from '@playwright/test';
import { validateYachtContract, validateApiResponseContract, validateSearchSuggestionContract } from '../lib/api-contracts';

test.describe('API Contract Tests', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  test.describe('/api/yachts endpoint', () => {
    test('should return valid yacht contract response', async () => {
      const response = await fetch(`${BASE_URL}/api/yachts?limit=5`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Validate the overall response structure
      expect(validateApiResponseContract(data)).toBe(true);
      
      // Validate each yacht in the response
      if (data.yachts) {
        data.yachts.forEach((yacht: any, index: number) => {
          expect(validateYachtContract(yacht), `Yacht at index ${index} should match contract`).toBe(true);
          
          // Validate specific required fields
          expect(yacht).toHaveProperty('id');
          expect(yacht).toHaveProperty('manufacturer');
          expect(yacht).toHaveProperty('modelName');
          expect(typeof yacht.id).toBe('number');
          expect(typeof yacht.manufacturer).toBe('string');
          expect(typeof yacht.modelName).toBe('string');
        });
      }
      
      // Validate pagination structure
      if (data.total !== undefined) {
        expect(typeof data.total).toBe('number');
        expect(data.total).toBeGreaterThanOrEqual(0);
      }
      if (data.page !== undefined) {
        expect(typeof data.page).toBe('number');
        expect(data.page).toBeGreaterThanOrEqual(1);
      }
      if (data.limit !== undefined) {
        expect(typeof data.limit).toBe('number');
        expect(data.limit).toBeGreaterThan(0);
      }
    });

    test('should handle filter parameters correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/yachts?limit=5&filters[rigType]=sloop&filters[lengthMin]=10&filters[lengthMax]=20`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(validateApiResponseContract(data)).toBe(true);
      
      // Verify filters are applied (length should be within range)
      if (data.yachts) {
        data.yachts.forEach((yacht: any) => {
          if (yacht.lengthOverall) {
            expect(yacht.lengthOverall).toBeGreaterThanOrEqual(10);
            expect(yacht.lengthOverall).toBeLessThanOrEqual(20);
          }
        });
      }
    });

    test('should return valid distinct values', async () => {
      const response = await fetch(`${BASE_URL}/api/yachts?limit=1`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      if (data.distinct) {
        expect(Array.isArray(data.distinct.rigTypes)).toBe(true);
        expect(Array.isArray(data.distinct.keelTypes)).toBe(true);
        expect(Array.isArray(data.distinct.hullMaterials)).toBe(true);
        
        // Check that arrays contain only strings
        data.distinct.rigTypes.forEach((type: any) => {
          expect(typeof type).toBe('string');
        });
        data.distinct.keelTypes.forEach((type: any) => {
          expect(typeof type).toBe('string');
        });
        data.distinct.hullMaterials.forEach((material: any) => {
          expect(typeof material).toBe('string');
        });
      }
    });
  });

  test.describe('/api/search endpoint', () => {
    test('should return valid search response with suggestions', async () => {
      const response = await fetch(`${BASE_URL}/api/search?q=test&mode=autocomplete&limit=5`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Validate the overall response structure
      expect(data).toHaveProperty('query');
      expect(data).toHaveProperty('suggestions');
      expect(typeof data.query).toBe('string');
      expect(Array.isArray(data.suggestions)).toBe(true);
      
      // Validate each suggestion
      data.suggestions.forEach((suggestion: any, index: number) => {
        expect(validateSearchSuggestionContract(suggestion), `Suggestion at index ${index} should match contract`).toBe(true);
        
        // Validate required fields
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('display');
        expect(suggestion).toHaveProperty('modelName');
        expect(suggestion).toHaveProperty('manufacturer');
        expect(typeof suggestion.id).toBe('number');
        expect(typeof suggestion.display).toBe('string');
        expect(typeof suggestion.modelName).toBe('string');
        expect(typeof suggestion.manufacturer).toBe('string');
      });
    });

    test('should return valid search response with full results', async () => {
      const response = await fetch(`${BASE_URL}/api/search?q=test&mode=full&limit=3`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Validate the overall response structure
      expect(data).toHaveProperty('query');
      expect(data).toHaveProperty('yachts');
      expect(data).toHaveProperty('total');
      expect(typeof data.query).toBe('string');
      expect(Array.isArray(data.yachts)).toBe(true);
      expect(typeof data.total).toBe('number');
      
      // Validate each yacht
      if (data.yachts) {
        data.yachts.forEach((yacht: any, index: number) => {
          expect(validateYachtContract(yacht), `Yacht at index ${index} should match contract`).toBe(true);
        });
      }
    });

    test('should handle empty search results gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/search?q=nonexistentyacht12345&mode=full&limit=5`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(data.yachts).toEqual([]);
      expect(data.total).toBe(0);
      expect(data.query).toBe('nonexistentyacht12345');
    });

    test('should reject queries with less than 2 characters', async () => {
      const response = await fetch(`${BASE_URL}/api/search?q=a&mode=full`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(data.yachts).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  test.describe('/api/manufacturers endpoint', () => {
    test('should return valid manufacturers response', async () => {
      const response = await fetch(`${BASE_URL}/api/manufacturers`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      
      // Validate manufacturer structure if any manufacturers exist
      if (data.length > 0) {
        const manufacturer = data[0];
        expect(manufacturer).toHaveProperty('id');
        expect(manufacturer).toHaveProperty('name');
        expect(typeof manufacturer.id).toBe('number');
        expect(typeof manufacturer.name).toBe('string');
      }
    });
  });

  test.describe('/api/v1/yachts endpoint', () => {
    test('should return valid v1 yacht response', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/yachts?limit=3`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // V1 API should return an array of yachts
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const yacht = data[0];
        expect(validateYachtContract(yacht)).toBe(true);
      }
    });
  });

  test.describe('Error handling', () => {
    test('should return valid error response structure', async () => {
      // Test with invalid parameters that might cause errors
      const response = await fetch(`${BASE_URL}/api/yachts?limit=99999`);
      expect(response.status).toBe(200); // Should still work but might return empty results
      
      const data = await response.json();
      
      // Even in error cases, response should be valid
      expect(validateApiResponseContract(data)).toBe(true);
    });
  });

  test.describe('Performance and pagination', () => {
    test('should handle pagination correctly', async () => {
      const page1Response = await fetch(`${BASE_URL}/api/yachts?limit=5&page=1`);
      expect(page1Response.status).toBe(200);
      
      const page1Data = await page1Response.json();
      
      expect(validateApiResponseContract(page1Data)).toBe(true);
      if (page1Data.page) expect(page1Data.page).toBe(1);
      if (page1Data.limit) expect(page1Data.limit).toBe(5);
      
      // Get second page if available
      if (page1Data.totalPages && page1Data.totalPages > 1) {
        const page2Response = await fetch(`${BASE_URL}/api/yachts?limit=5&page=2`);
        expect(page2Response.status).toBe(200);
        
        const page2Data = await page2Response.json();
        
        expect(validateApiResponseContract(page2Data)).toBe(true);
        if (page2Data.page) expect(page2Data.page).toBe(2);
        
        // Ensure we're not getting duplicate yachts
        if (page1Data.yachts && page2Data.yachts) {
          const page1Ids = page1Data.yachts.map((y: any) => y.id);
          const page2Ids = page2Data.yachts.map((y: any) => y.id);
          const intersection = page1Ids.filter(id => page2Ids.includes(id));
          expect(intersection).toHaveLength(0); // No duplicate IDs between pages
        }
      }
    });
  });
});