# নিরাপদ যাত্রা (Nirapod Jatra)
**Fair Fare Companion & Transparency Engine for Dhaka's Informal Commuters**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-059669?style=for-the-badge&logo=github)](https://rahat69x.github.io/nirapod-jatra/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Rahat69x/nirapod-jatra)
[![Test Suite](https://img.shields.io/badge/Tests-27%2F27%20PASS-emerald?style=for-the-badge&logo=checkmarx)](TEST_REPORT.md)
[![Platform](https://img.shields.io/badge/Platform-Installable%20Web%20App%20(PWA)-blue?style=for-the-badge)](manifest.json)

---

## 1. What the App Does

In Dhaka, Bangladesh, over 8 million daily commuters depend on informal public transport—CNG auto-rickshaws, cycle rickshaws, and battery-powered easybikes. Because these vehicles operate almost entirely without functioning digital meters or fixed pricing, passengers face routine arbitrary overcharging, exacerbated during rain, office peak hours, and late-night travel.

**Nirapod Jatra (নিরাপদ যাত্রা)** is a lightweight, zero-install fair-fare calculator and commuter safety companion designed specifically for Dhaka's ground realities. Before stepping into a vehicle, a rider can:
1. Select or type origin and destination in Bangla or English.
2. Compare all transit modes side-by-side (CNG, Rickshaw, Battery Easybike, and MRT-6 Metro Multimodal).
3. Identify the cheapest option instantly with a **"সবচেয়ে সাশ্রয়ী"** badge and time trade-off analysis.
4. Inspect a line-by-line fare breakdown explaining base charges, per-km rates, traffic delay buffers, and capped weather surges.
5. Review numbered journey steps and share the commute plan via WhatsApp, SMS, Web Share API, or a persistent URL hash.
6. Access commuter safety tools including a Web Audio emergency distress siren, verified 999 helpline dialing, and pre-filled emergency SMS.

---

## 2. REAL vs. DEMO Feature Matrix

We believe in complete honesty with hackathon judges and users. The table below outlines what is fully functional today versus what is a simulation or future concept:

| Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| **Deterministic Fare Engine** | **REAL (Works Today)** | Pure mathematical engine calculating base fare, per-km rates, congestion delay buffer, and weather/night surge (capped at 1.90x). |
| **Comparative Multi-Mode Picker** | **REAL (Works Today)** | Side-by-side comparison of CNG, Cycle Rickshaw (capped at 7 km), Battery Easybike (capped at 12 km), and Multimodal MRT-6. |
| **Dhaka Metro Rail (MRT-6)** | **REAL (Works Today)** | Full station-to-station DMTCL fare matrix for all 16 stations from Uttara North to Motijheel. Auto-calculates feeder rickshaw + metro + feeder rickshaw when viable. |
| **Line-by-Line Fare Breakdown** | **REAL (Works Today)** | Explicit itemization (Base Fare, Distance Charge, Congestion Delay Buffer, Surge Multiplier) explaining the ৳101 base vs ৳120–145 street negotiation gap. |
| **Routing & Offline Fallback** | **REAL (Works Today)** | Leaflet + OpenStreetMap routing with public OSRM. Automatic fallback to Haversine × 1.38 urban road factor when offline or when OSRM fails. |
| **Bangla Fuzzy Search** | **REAL (Works Today)** | Live autocomplete matching Bengali numerals, aliases (ফার্মগেট, গুলশান ১, মিরপুর ১০), and English names. |
| **Web Share & State Hash** | **REAL (Works Today)** | Web Share API with WhatsApp and SMS fallbacks. Trip state encoded in URL hash (`#start=farmgate&end=gulshan1&vehicle=cng`) so recipients open the identical plan. |
| **Web Audio Emergency Siren** | **REAL (Works Today)** | Synthesizes an alternating dual-tone distress siren (750 Hz – 1150 Hz) directly via the browser's Web Audio API with zero external media files. Works 100% offline. |
| **PWA & Offline App Shell** | **REAL (Works Today)** | Service Worker (`sw.js`) precaches app shell, deterministic fare engine, MRT-6 table, and Leaflet assets for offline commutes. |
| **Local Community Ledger** | **REAL (Works Today)** | Local crowdsourced fare log stored securely in browser `localStorage`. Sanitized with `escapeHtml` against XSS, input range bounds, and 30-day automatic expiration. |
| **Emergency SOS Dialing & SMS** | **REAL (Works Today)** | Direct `tel:999` emergency call button and native `sms:?body=...` composer button with prefilled message marked "প্রস্তুত" (ready to send). |
| **Emergency SOS Cloud Dispatch** | **DEMO (Prototype)** | Explicitly labeled: *"প্রোটোটাইপ: আপনার কন্টাক্ট বা ৯৯৯-এ কোনো ব্যাকএন্ড সংকেত স্বয়ংক্রিয়ভাবে পাঠানো হয়নি"*. No background server notifications are claimed. |
| **Driver Plate & QR Scanner** | **DEMO (Simulation)** | Fictional driver records (*কাল্পনিক চালক ১-৪*) labeled *"ডেমো ডেটা — কাল্পনিক চালক"*. Camera QR scanner is an animated visual simulation. |
| **Institutional Integration** | **PLANNED (Future)** | Labeled *"ভবিষ্যৎ ধারণা — কোনো অংশীদারিত্ব নেই"*. Vision for future BRTA digital meter pairing and DMP verification. |
| **USSD / Offline SMS Service** | **PLANNED (Future)** | Non-smartphone feature placeholder labeled *"USSD বা এসএমএস সেবা (পরিকল্পনা)"*. |

---

## 3. Fare Methodology & Verified Sources

Every price in Nirapod Jatra is an estimate and explicitly labeled **"আনুমানিক"**. Fares are never presented as live platform dispatch prices.

| Transit Mode | Pricing Logic | Official / Reference Rate | Source Citation & Verification Date |
| :--- | :--- | :--- | :--- |
| **CNG Auto-Rickshaw** | Base: ৳50 (first 2 km)<br>Per KM: ৳16/km<br>Congestion Buffer: ৳1.50/min<br>Surge: 1.15x–1.25x (Cap: 1.90x) | **Official BRTA Base**<br>Street negotiated rate: ৳120–145 for ~5 km | [BRTA Official CNG Fare Gazetted Circular](http://www.brta.gov.bd) (Verified: October 2026). Explains the street gap via Dhaka traffic delays (~22 mins). |
| **MRT-6 Metro Rail** | Distance-based station matrix:<br>Min: ৳20 (1-2 stations)<br>Max: ৳100 (Full Line)<br>Uttara North ⇄ Motijheel: ৳100 | **Official DMTCL Tariff** | [Dhaka Mass Transit Company Limited (DMTCL)](https://dmtcl.gov.bd) Official MRT-6 Fare Chart (Verified: October 2026). |
| **Cycle Rickshaw** | Short trip base: ৳20–25<br>Per KM: ৳15–20/km<br>Human distance limit: ≤ 7.0 km | **Negotiable Street Norm**<br>(Unofficial benchmark) | Dhaka Urban Transport Studies (DUTP / empirical Dhaka commuter surveys). Labeled: *"আনুমানিক দরকষাকষির ভিত্তি — কোনো সরকারি মিটার নেই"*. |
| **Battery Easybike** | Feeder base: ৳15–20<br>Per KM: ৳10–12/km<br>Battery range limit: ≤ 12.0 km | **Local Street Norm**<br>(Unofficial benchmark) | Suburban feeder empirical norms (Mirpur, Uttara, Mohammadpur). Labeled: *"আনুমানিক স্থানীয় সংযোগ দর"*. |
| **Ride-Hailing (Uber/Pathao)** | Moto: ৳30 base + ৳12/km<br>CNG: ৳50 base + ৳18/km<br>Car: ৳80 base + ৳22/km | **Reference Estimate**<br>(Indicative comparison only) | Ride-hailing fare structure benchmarks. Explicitly badged: *"রেফারেন্স আনুমানিক, লাইভ দাম নয়"*. |

---

## 4. Supported Locations & Dhaka Coverage

The app supports comprehensive Dhaka landmarks with bilingual matching and Bengali numeral normalization:
- **MRT-6 Metro Stations (16 Stations):** Uttara North, Uttara Center, Uttara South, Pallabi, Mirpur 11, Mirpur 10, Kazipara, Shewrapara, Agargaon, Bijoy Sarani, Farmgate, Karwan Bazar, Shahbagh, Dhaka University, Bangladesh Secretariat, Motijheel.
- **Major Hubs & Commercial Areas:** Farmgate, Gulshan 1, Gulshan 2, Banani, Mohakhali, Karwan Bazar, Motijheel, New Market, Elephant Road, Dhanmondi 27, Science Lab, Mirpur 1, Mirpur 10, Uttara North.
- **Terminals & Interchanges:** Gabtoli, Sayedabad, Mohakhali Bus Terminal, Kamalapur Railway Station.

---

## 5. Platform Architecture: Installable Web App (PWA)

- **Deliverable:** Installable Progressive Web App (PWA).
- **Standards:** Compliant Web App Manifest (`manifest.json`) with `standalone` display mode, emerald theme `#059669`, and high-resolution icons (192×192, 512×512, SVG, ICO).
- **Service Worker:** Custom `sw.js` providing:
  - Network-first navigation strategy to guarantee instant delivery of app updates.
  - Cache-first strategy for static runtime assets (Leaflet maps, Tailwind CSS, Font Awesome icons).
  - Offline calculation engine ensuring that even with zero internet connectivity, fare estimation and MRT-6 lookups execute cleanly.
- **APK Status:** No native APK is bundled. The application is delivered and verified as an installable Progressive Web App (PWA) that installs directly to the Android/iOS home screen via the browser.

---

## 6. How to Run Locally

### Prerequisites
- Node.js (v18+ recommended) or Python 3.

### Running with Node.js
```bash
# Clone the repository
git clone https://github.com/Rahat69x/nirapod-jatra.git
cd nirapod-jatra

# Switch to the demo-ready branch
git checkout hackathon/demo-ready

# Start local server (no external dependencies needed)
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running with Python
```bash
python -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. How to Run Automated Tests

The repository contains an automated end-to-end regression test suite verifying all 27 critical requirements across calculation fidelity, mobile responsiveness, edge cases, honesty disclaimers, and security:

```bash
# Execute full T1-T10 automated test suite via Chrome DevTools Protocol (CDP)
node scratch/run_full_test_suite.js
```

### Verified Test Results Summary:
- **T1: Pure Transit Calculation Unit Tests:** 7/7 PASS (Base fare, 5.2 km CNG gap breakdown, surge caps, rickshaw limits, numeral roundtrips, fuzzy place matching, MRT-6 multimodal).
- **T2: 360 px Demo Flow Across 5 Journeys:** 5/5 PASS (Farmgate->Gulshan 1, Mirpur 10->Motijheel MRT-6, Dark Mode, English toggle, URL hash state).
- **T3: Failure & Boundary Edge Cases:** 4/4 PASS (Same point error, <300m walking notice, >40km boundary warning, denied GPS handling).
- **T4: Honesty & Disclaimers Audit:** 4/4 PASS (Zero real-sounding names, no unverified partnerships, SOS prototype notice, local ledger notice).
- **T5: Security & Privacy Audit:** 2/2 PASS (Zero XSS vulnerabilities via `escapeHtml`, zero secrets/tokens in code or history).
- **T6: Layout & Responsiveness:** 2/2 PASS (Zero horizontal scroll across 320/360/390/412/768 px viewports, 200% zoom enabled).
- **T7: Assets & 404 Verification:** 1/1 PASS (Favicons, apple-touch-icon, bilingual custom `404.html` with noindex).
- **T8: PWA & Service Worker:** 1/1 PASS (Valid manifest, standalone display, active `sw.js` cache).
- **T10: 3-Minute Demo Rehearsal Stopwatch:** 1/1 PASS (Cold start < 15s, complete demo stages executed).
- **Total:** **27/27 PASS (100% Green)**. Detailed records are documented in [TEST_REPORT.md](TEST_REPORT.md).

---

## 8. Mobile Demo Preview (360 px Viewport)

| Home & Commuter Setup | Options Comparison & Cheapest Badge | Fare Breakdown & Source |
| :---: | :---: | :---: |
| ![Home Screen](preview_01_home_360.png) | ![Options Comparison](preview_03_options_cheapest_360.png) | ![Fare Breakdown](preview_04_fare_breakdown_360.png) |

| Journey Steps & Route | Share Plan via WhatsApp/SMS | Honest SOS Prototype Modal |
| :---: | :---: | :---: |
| ![Journey Steps](preview_05_journey_steps_360.png) | ![Share Plan](preview_06_share_message_360.png) | ![SOS Screen](preview_07_sos_screen_360.png) |

| Mobile Navigation Menu | Offline Notice Mode | Custom Bilingual 404 Page |
| :---: | :---: | :---: |
| ![Mobile Menu](preview_02_mobile_menu_360.png) | ![Offline Notice](preview_08_offline_notice_360.png) | ![404 Page](preview_09_404_page_360.png) |

---

## 9. License & Attribution

- **Project:** Nirapod Jatra (নিরাপদ যাত্রা)
- **Copyright:** © 2026 Nirapod Jatra
- **Emergency Helpline:** 999 (National Emergency Service, Bangladesh)
