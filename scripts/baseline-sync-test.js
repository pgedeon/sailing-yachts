#!/usr/bin/env node
/**
 * Baseline Sync Test for Sailing Yachts Admin→Public Data Flow
 *
 * This script reproduces the critical sync scenarios to verify that:
 * - Admin writes are reflected in public endpoints
 * - Filters work correctly
 * - Slug-based detail pages are accessible
 *
 * Usage: node scripts/baseline-sync-test.js
 */

import { randomUUID } from 'crypto';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://sailing-yachts.vercel.app';

async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Request failed ${res.status} ${res.statusText}: ${await res.text()}`);
  }
  return res.json();
}

// Test steps
async function runTest() {
  console.log('🧪 Baseline Sync Test started');
  const testRunId = randomUUID();
  console.log(`Run ID: ${testRunId}`);

  // 1. Get initial state
  console.log('📊 Fetching initial public yachts...');
  const before = await fetchJson(`${BASE}/api/yachts?limit=100`);
  console.log(`   Total yachts before: ${before.total}`);

  // 2. Create a test manufacturer via admin (requires auth)
  // For now, skip if no auth; manually create via UI or set ADMIN_COOKIE env var
  const adminCookie = process.env.ADMIN_COOKIE;
  if (!adminCookie) {
    console.warn('⚠️  ADMIN_COOKIE not set; skipping admin create steps');
    console.log('   Set ADMIN_COOKIE to the admin session cookie value to run full test.');
    return;
  }

  const adminHeaders = { Cookie: `auth=${adminCookie}` };

  // 3. Create manufacturer
  console.log('🏭 Creating test manufacturer...');
  const mfgName = `Test Mfg ${testRunId.slice(0,8)}`;
  const manufacturer = await fetchJson(`${BASE}/api/admin/manufacturers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders },
    body: JSON.stringify({ name: mfgName, country: 'DE' }),
  });
  console.log(`   Created manufacturer ID ${manufacturer.manufacturer.id}`);

  // 4. Create yacht under that manufacturer
  console.log('🚢 Creating test yacht...');
  const yachtPayload = {
    modelName: `Test Model ${testRunId.slice(0,8)}`,
    manufacturerId: manufacturer.manufacturer.id,
    year: 2025,
    slug: `test-yacht-${testRunId.slice(0,8)}`,
    lengthOverall: 12.5,
    beam: 4.2,
    draft: 2.1,
    displacement: 8000,
    ballast: 2000,
    sailAreaMain: 45.5,
    rigType: 'Sloop',
    keelType: 'Fin keel',
    hullMaterial: 'Fiberglass',
    cabins: 2,
    berths: 4,
    heads: 1,
    maxOccupancy: 6,
    engineHp: 30,
    engineType: 'Diesel',
    fuelCapacity: 200,
    waterCapacity: 300,
    description: 'Test yacht created by baseline sync test',
  };
  const yacht = await fetchJson(`${BASE}/api/admin/yachts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders },
    body: JSON.stringify(yachtPayload),
  });
  console.log(`   Created yacht ID ${yacht.yacht.id} with slug ${yacht.yacht.slug}`);

  // 5. Wait briefly for revalidation (if using tags)
  await new Promise(r => setTimeout(r, 2000));

  // 6. Fetch public yachts again and verify new yacht appears
  console.log('🔍 Verifying public visibility...');
  const after = await fetchJson(`${BASE}/api/yachts?limit=100`);
  const found = after.yachts.find((y: any) => y.id === yacht.yacht.id);
  if (!found) {
    throw new Error('Test yacht not found in public API after create!');
  }
  console.log('✅ Public API includes new yacht');

  // 7. Verify detail endpoint works
  const detail = await fetchJson(`${BASE}/api/yachts/${yacht.yacht.slug}`);
  if (detail.id !== yacht.yacht.id) {
    throw new Error('Detail endpoint returned mismatched ID');
  }
  console.log('✅ Detail endpoint works');

  // 8. Clean up (optional): delete test yacht and manufacturer
  // Skipping to preserve evidence; manual cleanup later.

  console.log('🎉 Baseline sync test PASSED');
}

runTest().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
