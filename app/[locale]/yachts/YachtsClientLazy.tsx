// Lazy wrapper intentionally removed 2026-08-31: `ssr: false` wrapper (added in
// Next 14→15 upgrade #451) shipped zero yacht content in the HTML payload —
// crawlers and no-JS clients saw only nav + footer. YachtsClient is SSR-safe
// (all window/document access is inside effects/handlers). Import directly.
import YachtsClient from "./YachtsClient";

export default YachtsClient;
