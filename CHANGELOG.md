# Changelog - Nirapod Jatra (নিরাপদ যাত্রা)

All notable changes and architectural improvements implemented for the hackathon prototype demo are documented in this file.

---

### [demo-ready-v1.0.0] - 2026-10-25

#### 1. Pure Engine Extraction & Architecture
- **Added [`fare_engine.js`](fare_engine.js):** Extracted deterministic fare calculation, Haversine × 1.38 distance modeling, MRT-6 station fare matrix, surge calculations, and Bengali numeral conversions into a pure UMD module compatible with both Node.js (`module.exports`) and browser environments (`window.FareEngine`).
- **Rationale:** Enables deterministic unit testing without DOM dependencies, ensuring 100% calculation accuracy.

#### 2. Honesty, Safety & Disclaimers Audit (Phase 1A)
- **SOS Prototype Clarification:** Replaced all misleading claims that emergency signals were "sent" or contacts were "notified" with the honest statement: *"প্রোটোটাইপ: আপনার কন্টাক্ট বা ৯৯৯-এ কোনো ব্যাকএন্ড সংকেত স্বয়ংক্রিয়ভাবে পাঠানো হয়নি"*.
- **Real Action Buttons:** Provided a direct `tel:999` call button and a native `sms:?body=...` composer button labeled *"প্রস্তুত"* (ready to send) without claiming automatic background transmission.
- **Removed Hardcoded Coordinates:** Removed fallback coordinates (`23.7561° N, 90.3872° E`) from error displays; now explicitly shows *"অনুমতি দেওয়া হয়নি / অপ্রাপ্য"* when geolocation permission is not granted.
- **Mock Driver Data Anonymization:** Replaced real-sounding names (including Rina Begum) with clearly fictional identifiers (*কাল্পনিক চালক ১-৪ (ডেমো)*); labeled data *"ডেমো ডেটা — কাল্পনিক চালক"* and the QR scanner *"সিমুলেশন"*.
- **Partnership Disclaimers:** Renamed the BRAC/DMP card to *"ভবিষ্যৎ ধারণা — কোনো অংশীদারিত্ব নেই"* and removed specific organizational claims.
- **Ride-Hailing Benchmarks:** Relabeled Uber and Pathao figures to *"রেফারেন্স আনুমানিক, লাইভ দাম নয়"*.
- **Community Ledger Transparency:** Explicitly labeled the local ledger as *"ডেমো — শুধু আপনার ফোনে সংরক্ষিত (ক্লাউডে পাঠানো হয় না)"*.

#### 3. Fare Transparency & Comparative Demo Flow (Phase 1B & 1C)
- **Side-by-Side Transit Comparison:** Replaced isolated single-vehicle calculation with comparative cards displaying CNG, Cycle Rickshaw, Battery Easybike, and Multimodal MRT-6 simultaneously.
- **Cheapest Option Badge:** Automatically identifies and highlights the lowest-cost viable mode with a prominent **"সবচেয়ে সাশ্রয়ী"** badge.
- **Human Limit Validation:** Automatically disables Cycle Rickshaws for journeys > 7.0 km with an informative notice: *"দূরত্ব ৭ কিমি-এর বেশি — রিকশা অনুপযুক্ত"*.
- **Named Line-Items Fare Breakdown:** Decomposed total estimated fare into:
  - Base Fare (first 2 km: ৳50.00)
  - Distance Charge (৳16.00/km)
  - Traffic Congestion Delay Buffer (৳1.50/min for ~22 min traffic)
  - Weather/Peak Surge Modifier (rigidly capped at 1.90x)
  - **Result:** Fully explains the ৳101.20 base vs ৳120–145 street negotiation gap.
- **Numbered Journey Steps:** Added step-by-step Bangla commute instructions detailing pickup, route, distance, travel time, and sub-costs.
- **Trip Plan Sharing:** Integrated native Web Share API with WhatsApp and SMS fallbacks. Encodes commute state into URL hash (`#start=farmgate&end=gulshan1&vehicle=cng`) for persistent tab restoration.
- **One-Tap Demo Button:** Added `⚡ ৩-মিনিট ডেমো চালান: ফার্মগেট ➔ গুলশান ১ (অফলাইন প্রস্তুত)` to instantly run a cold-start demonstration without manual typing.

#### 4. Reliability, Search & Security (Phase 1D & Phase 2)
- **Live Bangla Fuzzy Search:** Implemented instant dropdown autocomplete supporting Bengali numerals, aliases (ফার্মগেট, গুলশান ১, মিরপুর ১০), and English spelling variations.
- **Weather Timeout Fail-Safe:** Added a 5-second `AbortController` timeout for Open-Meteo requests with fallback to manual rain surge toggles and clear status messaging.
- **Routing Fallback:** Automated fallback from OSRM to Haversine × 1.38 with a distinct badge: *"মোটামুটি হিসাব (অফলাইন)"*.
- **PWA Service Worker:** Implemented `sw.js` with Network-first navigation for fresh app shell delivery and Cache-first runtime asset caching.
- **Ledger Security:** Sanitized all inputs with `escapeHtml` to prevent XSS attacks; added length limits (60 chars for places, 200 chars for comments), numeric ranges (৳1–5000 fare, 0.1–60 km), and a 30-day automatic data expiration policy. Added a one-click *"আমার লোকাল ডেটা মুছুন"* button to clear stored data.

#### 5. Layout, Accessibility & Assets (20-Point Cleanup)
- **Viewport Zoom Enabled:** Removed `maximum-scale=1.0` and `user-scalable=no` to allow 200% accessibility zoom.
- **Zero Horizontal Overflow:** Verified across 320, 360, 390, 412, and 768 px viewports.
- **Accessible Mobile Menu:** Modal drawer with `aria-expanded`, ESC key handler, 44 px touch targets, and links to existing sections only.
- **Branded Assets:** Added original emerald `#059669` favicons (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`).
- **Custom 404 Page:** Created bilingual, responsive [`404.html`](404.html) with `noindex` tag and relative asset routing.
- **Clean Footer:** Updated footer with dynamic JS copyright year (fallback 2026), official 999 helpline link, and GitHub repository links.

#### 6. Quality Assurance & Automated Testing
- **Automated Test Suite:** Created [`scratch/run_full_test_suite.js`](scratch/run_full_test_suite.js) executing all T1–T10 test suites via headless Chrome DevTools Protocol (CDP).
- **Test Results:** 27 out of 27 tests passing (100% Green). Documented in [`TEST_REPORT.md`](TEST_REPORT.md).
