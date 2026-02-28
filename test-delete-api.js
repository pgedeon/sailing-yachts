const fetch = require('node-fetch');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('fetch-cookie');

// Get the admin auth cookie from the session (we'd need to login first)
// Simpler: use curl with cookie from browser? Let's just test the endpoint structure

// Instead: test if Vercel's deployed delete endpoint works
const yachtId = 30; // Test Yacht 001
const deleteUrl = `https://sailing-yachts.vercel.app/api/admin/yachts/${yachtId}/delete`;

console.log('DELETE', deleteUrl);
// Need admin cookie - can't test without it
console.log('Note: Requires admin authentication cookie');
