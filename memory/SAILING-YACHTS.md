# Sailing Yachts — Session Memory

## Latest Session: 2026-05-30 02:20

### Issue Worked On
- **Issue #354** — P22.2: Image CDN optimization — convert raw <img> to next/image with blur placeholders
- **PR #355** — merged (squash)

### What Was Implemented
1. **Shared Image Utils** (`lib/image-utils.ts`):
   - `SHIMMER_BLUR` — compact shimmer blur placeholder (20x20 gray gradient)
   - `FALLBACK_IMAGE` — inline SVG fallback as data URI
   - Replaces duplicated constants in YachtImage.tsx

2. **Converted 20+ raw `<img>` tags to `<Image>` from next/image across 17 files**:
   - Client components: RelatedManufacturers, SameSizeAlternatives, BuyingGuideYachtList, MediaGallery, VideoEmbed, HeaderAuthControls, ManufacturerLogo
   - Server components: manufacturers/[slug], manufacturers/[slug]/[sizeCategory], best/[slug], search-intent/[slug], best-value/[slug], cheaper-alternatives-to/[slug], guides, guides/[slug]
   - Admin: yachts/[id]/edit
   - All images get automatic AVIF/WebP optimization via Next.js Image CDN
   - Proper `sizes` attributes for responsive loading
   - `placeholder="blur"` with shimmer blur on all images

3. **Config updates**:
   - Added `img.youtube.com` to next.config.js remote patterns
   - MediaGallery lightbox uses `unoptimized` for full-resolution display
   - ManufacturerLogo uses `useState` for error fallback instead of DOM manipulation

4. **Test updates**:
   - Updated video-embed.unit.test.ts to verify Image optimization instead of `loading="lazy"`

### Build/Test Results
- Typecheck: ✅ PASS
- Build: ✅ PASS
- Tests: ✅ 1422 passed (3 pre-existing failures: media-accessibility SVG/icon, table-of-contents SocialShareButtons import)

### Deploy Status
- PR merged to main
- Vercel – sailing-yachts: ✅ deployed

### Live Verification Results
- **/**: ✅ OK
- **/en/yachts**: ✅ OK
- **/en/compare**: ✅ OK
- **/en/guides**: ✅ OK
- **/en/manufacturers/beneteau**: ✅ OK
- **/yachts/beneteau-oceanis-40-1**: ✅ OK
- **/en/guides/beginners-guide-sailing**: ✅ OK
- **/api/yachts**: ❌ 500 (Neon DB quota exceeded — pre-existing)
- All pages: 0 "Application error" instances

### Phase Status
- Phase 14–19: ✅ COMPLETE
- Phase 20 (Content Enrichment): 🔄 ACTIVE
  - P20.1: 🔲 TODO (auto-generated yacht descriptions — needs LLM pipeline)
  - P20.2–P20.5: ✅ COMPLETE
- Phase 21 (Data Quality): 🔲 PLANNED
- Phase 22 (Performance): 🔄 ACTIVE
  - P22.1: 🔲 TODO (Edge runtime for API routes)
  - P22.2: ✅ COMPLETE (Image CDN optimization)
  - P22.3: ✅ COMPLETE (ISR audit)
  - P22.4: ✅ COMPLETE (Bundle size optimization)
  - P22.5: ✅ COMPLETE (Core Web Vitals monitoring)
- Phase 23–27: 🔲 PLANNED

### Technical Notes
- Neon DB quota STILL EXCEEDED — all dynamic/first-time ISR renders fail for uncached pages
- CWV data is in-memory only — resets on cold starts
- All `<img>` tags now converted to `next/image` — no raw `<img>` remaining in app/components
- Shared `lib/image-utils.ts` provides SHIMMER_BLUR and FALLBACK_IMAGE constants
- YouTube thumbnails now proxied through Next.js Image optimization

### Next Recommended Tasks
1. **P22.1 — Edge runtime**: Convert key public API routes from pool to db (drizzle) for lower latency
2. **P21.1 — Data completeness scoring**: Admin dashboard for data quality (read-only, no DB writes needed for display)
3. **P20.1 — Auto-generated descriptions**: Needs LLM pipeline design (complex, may need user input)
