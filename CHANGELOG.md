# Changelog

All notable changes to the **Nirapod Jatra (নিরাপদ যাত্রা)** project will be documented in this file.

## [1.1.0] - 2026-10-23

### Added
- **Multi-Tier Map Architecture:**
  - Integrated Apple MapKit JS (Tier 1) with token authorization callback.
  - Seamless fallback to Leaflet + OpenStreetMap (Tier 2) with dark-mode tile inversion.
  - Tier 3 Text-Only guidance fallback (`#mapTextFallback`) for environments without map tile rendering.
  - Added "Apple Maps-এ খুলুন" (`#btnOpenAppleMaps`) button linking directly to external Apple Maps directions.
- **Stage Presentation Demo Action:**
  - Added `#btnRunStageDemo` button ("ডেমো চালান") executing Farmgate ➔ Gulshan 1 instant demonstration within 2 seconds.
- **Bi-Directional Numeral Conversion:**
  - Implemented `toEnglishNumber()` converting Bengali digits (`০-৯`) to ASCII digits (`0-9`) alongside `toBengaliNumber()`.
- **Impeccable Design System:**
  - Scaffolding of `tokens.css`, `tokens.js`, `PRODUCT.md`, and `DESIGN.md`.
- **Documentation & Packaging:**
  - Added Capacitor / TWA Android APK build guide with origin allowlisting in `README.md`.
  - Added Apple Maps landmark coverage test table in `README.md`.
  - Added comprehensive `TEST_REPORT.md` tracking Round 1 baseline vs Final verification across 35 test cases.

### Changed
- **Fare Breakdown Box:**
  - Itemized named monetary Taka sums: Base Fare (৳50), Distance Charge (৳51.2), and Traffic Congestion Buffer (৳59.5) to clarify why a 5.2 km CNG trip estimates ৳145–190.
- **Security & Geolocation:**
  - Removed hard-coded Farmgate GPS coordinates on geolocation permission denial; now accurately displays `"জিপিএস অনুমতি নেই / জিপিএস বন্ধ"`.
  - Hardened `.gitignore` to prevent leakage of `.p8`, `.env`, and secret keys.
  - Updated CSP in `server.js` to whitelist Apple MapKit JS origins (`https://cdn.apple-mapkit.com`, `https://*.apple-mapkit.com`, `https://*.apple.com`).
- **Roadmap & Disclaimers:**
  - Updated Roadmap item 5 to `"ভবিষ্যৎ ধারণা — কোনো অংশীদারিত্ব নেই"` (Future Concept — No Official Partnership).
  - Clarified demonstration driver profiles as fictional mocks with explicit disclaimer notices.
  - Renamed street negotiation advice to `"দরকষাকষির নমুনা স্ক্রিপ্ট (উদাহরণ):"`.

### Fixed
- Resolved all 8 defect items identified during Phase 1 baseline QA audit (T1.5, T1.8, T3.2, T3.3, T4.1, T5.4, T5.5, T6.2, T9.2, T10.1).
- Maintained 100% test pass rate across 33 automated tests in `npm test`.
