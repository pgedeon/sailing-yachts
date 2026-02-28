# Fix Admin 401 Unauthorized Errors

## Problem
When clicking edit on yachts or spec categories in admin, API calls return 401:
- GET /api/admin/yachts/26 401 (Unauthorized)
- GET /api/admin/spec-categories/59 401 (Unauthorized)

## Root Cause
The authenticated session is not being included in fetch requests to admin API routes.

## Investigation Steps
1. Find API calls in admin frontend code:
   - Look in `app/admin/` components and actions
   - Search for fetch calls to `/api/admin/yachts/` and `/api/admin/spec-categories/`

2. Check authentication mechanism:
   - Is NextAuth being used? Check for `getSession()` or `useSession()`
   - Are cookies being sent? Check if `credentials: 'include'` is set
   - Are tokens used? Check Authorization header

3. Verify API route protection:
   - Check `pages/api/admin/*.js` or `app/api/admin/*/route.ts`
   - Ensure auth middleware validates session correctly

## Common Fixes
- For cookie-based auth (NextAuth): Add `credentials: 'include'` to fetch options
- For token-based auth: Include `Authorization: Bearer <token>` header
- Ensure API routes call `getSession()` or `auth()` correctly

## Test After Fix
1. Start dev server: `npm run dev`
2. Login to admin
3. Navigate to yachts and click edit - should load without 401
4. Check Network tab - API calls should return 200

## Deliverables
- Fixed code in relevant files
- Updated PROJECT.md with explanation
- Confirmation that admin edit pages work
