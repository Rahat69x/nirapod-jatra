# নিরাপদ যাত্রা (Nirapod Jatra)
**Fair Fare Companion & Transparency Engine for Dhaka's Transit Ecosystem**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-059669?style=for-the-badge&logo=github)](https://rahat69x.github.io/nirapod-jatra/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Rahat69x/nirapod-jatra)

🌐 **Live Website:** [https://rahat69x.github.io/nirapod-jatra/](https://rahat69x.github.io/nirapod-jatra/)  
📂 **GitHub Repository:** [https://github.com/Rahat69x/nirapod-jatra](https://github.com/Rahat69x/nirapod-jatra)

---

## 1. Problem Statement
In Dhaka, Bangladesh, millions of commuters rely daily on informal transport (CNG auto-rickshaws, cycle rickshaws, and battery-operated easybikes). Because these vehicles operate without functioning digital meters, GPS tracking, or standardized rate cards, overcharging is rampant—disproportionately affecting tourists, women, students, and night commuters. Existing ride-hailing platforms (Uber, Pathao) exclude this informal segment. **Nirapod Jatra** solves this information asymmetry: before a passenger steps into a vehicle, it calculates a transparent, ground-reality fare range, integrates Dhaka Metro Rail (MRT-6) alternatives, and provides crowdsourced community intelligence to keep prices honest.

---

## 2. Implemented Features & Architecture

### 📱 Uber & Pathao Ride-Hailing Benchmarks & Price Comparison
- **3-Tier App Cost Matrix:** Real-time fare benchmarks for **Pathao / Uber Moto**, **Uber / Pathao CNG**, and **UberX / Pathao Car** dynamically computed for every trip based on real road distance, travel duration, and Dhaka traffic surge pricing.
- **App vs. Street Savings Advisor:** Dynamic comparison indicators highlighting how much money commuters save (typically ৳30-60 on CNG and ৳20-35 on battery rickshaws) by negotiating street fares instead of paying surge-inflated platform rates.
- **Community Ledger App Benchmarks:** Every entry in the crowdsourced Community Ledger includes an inline Uber & Pathao price reference badge (e.g., `🏍️ ৳৫০-৬৫ • 🛺 ৳১০০-১২২`), enabling passengers to instantly evaluate reported street fares against current app rates.
- **Ride-Hailing Comparison in Trip Sharing:** WhatsApp and SMS ride updates automatically include the corresponding Uber & Pathao benchmark estimates so family and friends have complete transit context.

### 🚆 Core Fare Engine & Transit Network
- **Deterministic Fare Matrix:** Mathematical pricing model for 3 vehicle categories (CNG, Cycle Rickshaw, Battery Auto) including covered-distance base fares, per-KM rates, congestion delay buffers, and capped multi-surge stacking (rigidly capped at `1.90x`).
- **Dhaka Metro Rail (MRT-6) & Multimodal Advisor:** Full integration of all 16 MRT Line 6 stations (Uttara North to Motijheel). For journeys >4.2 km near the metro corridor, the app automatically calculates and suggests a multimodal route (*Rickshaw to Metro Station + MRT-6*) highlighting estimated Taka savings (৳) and road congestion bypass minutes!
- **Categorized Transit Picker:** Dropdowns organized via `<optgroup>` across *Dhaka Metro Rail Stations (MRT-6)*, *Major Hubs & Terminals*, and *Universities & Landmarks*.
- **Interactive Leaflet + OpenStreetMap:** Real-time routing through public OSRM with automatic fail-safe fallback to street-winding Haversine (`1.38x` urban road factor) for zero-downtime offline resilience.
- **Pin Drop & Custom Markers:** Direct map-tap pickup/dropoff selection with interactive green/red pin placement.

### 🎙️ Web Speech Audio Guide (Bangla & English TTS)
- **Spoken Negotiation Scripts:** Interactive speaker button (`শুনে নিন / Listen Audio`) using the browser's native `SpeechSynthesis` Web Speech API to read out smart bargaining advice aloud in natural cadence.
- **Audio Wave Animation:** Real-time visual feedback indicating speech playback state.

### 🌦️ Live Dhaka Weather Auto-Detection (Open-Meteo)
- **Zero-Key Real-Time Weather:** Live integration with Open-Meteo API fetching Dhaka's current temperature and precipitation index.
- **Auto-Surge Recommendation:** When rain is detected in Dhaka, the app automatically alerts the commuter and activates the Rain Surge modifier with live temperature badges.

### 🚨 Enhanced Commuter Safety Toolkit
- **Audible Distress Siren (Web Audio API):** Piercing alternating dual-tone emergency siren (750 Hz – 1150 Hz) synthesized directly in browser audio without external audio downloads—100% functional offline!
- **One-Tap WhatsApp & SMS Ride Sharing:** Generates instant trip alerts containing pickup, dropoff, vehicle type, fair fare range, emergency helpline (999), live web hash route link, and external Apple Maps directions.
- **Driver Plate & Vehicle Verification:** Searchable demonstration mock database of fictional driver profiles (with explicit demo disclaimer notice) displaying safety scores, ratings, and active years, with an animated laser QR scanner simulation.
- **5 Essential Commuter Safety Tips:** Collapsible guidance checklist covering door locks, route tracking, fare fixing, and night commuting practices.
- **Emergency SOS Prototype:** High-alert pulsing trigger modal with live GPS coordinates (or graceful "জিপিএস অনুমতি নেই / জিপিএস বন্ধ" indicator on denial), 999 Police Helpline integration, and an editable trusted contacts manager (up to 4 contacts).

### 🗺️ Multi-Tier Map Architecture (Apple Maps MapKit JS & Fallbacks)
- **Tier 1 (Apple Maps):** MapKit JS integration with authorization callback token support for high-fidelity vector tiles.
- **Tier 2 (Leaflet + OpenStreetMap):** Seamless fallback with custom markers and dark mode tile inversion when Apple Maps credentials are omitted.
- **Tier 3 (Text-Only Mode):** Offline text guidance fallback when WebGL or map canvas is unavailable.
- **Direct Apple Maps Navigation Links:** External link button ("Apple Maps-এ খুলুন") opening `https://maps.apple.com/?saddr={lat},{lon}&daddr={lat},{lon}&dirflg=d` on iOS, macOS, Android, and web.

#### Apple Maps Coverage Test (2026-10-23)
| Landmark | Coordinates | Query Aliases | Apple Maps Result | Fallback Status |
| :--- | :--- | :--- | :---: | :---: |
| Farmgate (ফার্মগেট) | 23.7561° N, 90.3872° E | "ফার্মগেইট", "farmgate" | MATCH | Leaflet + OSM Active |
| Gulshan 1 (গুলশান ১) | 23.7785° N, 90.4182° E | "গুলশান 1", "gulshan1" | MATCH | Leaflet + OSM Active |
| Motijheel (মতিঝিল) | 23.7290° N, 90.4176° E | "শাপলা চত্বর", "motijheel" | MATCH | Leaflet + OSM Active |
| Mirpur 10 (মিরপুর ১০) | 23.8069° N, 90.3687° E | "মিরপুর 10", "mirpur10" | MATCH | Leaflet + OSM Active |
| Uttara Sector 3 | 23.8683° N, 90.3986° E | "uttara 3", "উত্তরা ৩" | MATCH | Leaflet + OSM Active |
| Dhaka Airport (বিমানবন্দর) | 23.8434° N, 90.4030° E | "airport", "বিমানবন্দর" | MATCH | Leaflet + OSM Active |

### 🌙 AMOLED Night Ride Dark Mode
- **Sleek Night Theme Toggle:** Instant header switcher between Light Mode and AMOLED Slate-950 Dark Mode.
- **Night-Vision Map Styling:** Custom CSS filter applied to Leaflet OpenStreetMap tiles for reduced eye strain during late-night rides.
- **Auto Night-Time Detection:** Automatically recommends dark mode if accessed between 8:00 PM and 6:00 AM.
- **Bilingual Engine:** Zero-reload toggling between Bangla (`বাং`) and English (`ENG`) with bi-directional Bengali numeral conversion (`১২৩৪৫৬৭৮৯০` ⮂ `0123456789`).

---

## 3. Technology Stack
- **Architecture:** Zero-build, single-file HTML5 web application ([`index.html`](file:///c:/New%20folder/nirapod-jatra/index.html)).
- **Styling:** Tailwind CSS CDN (with Dark Mode class support), Impeccable Design System ([`tokens.css`](file:///c:/New%20folder/nirapod-jatra/tokens.css)), Font Awesome 6.5.1 icons, Google Fonts (*Hind Siliguri* & *Inter*).
- **APIs & Web Standards:** Apple MapKit JS, Leaflet.js 1.9.4, OpenStreetMap, OSRM Routing Machine, Open-Meteo Weather API, Web Speech Synthesis API, Web Audio API (`AudioContext`).
- **Algorithms:** Haversine distance with Dhaka urban winding coefficient (`1.38`), deterministic congestion modeling.
- **Storage:** Client-side HTML5 `localStorage` persistence (`nirapod_theme`, `nirapod_lang`, `nirapod_trips`, `nirapod_contacts`).

---

## 4. How to Run Locally & Build Android APK

### Web Application Run
1. Double-click [`index.html`](file:///c:/New%20folder/nirapod-jatra/index.html) to open it in any modern browser (`file:///...`).
2. Or serve it via the production security-hardened server:
   ```bash
   node server.js
   ```
3. Open `http://localhost:3000` in your desktop or mobile browser.

### 📱 Android APK Build Guide (Capacitor / TWA)
To package Nirapod Jatra as an Android APK:
1. Initialize Capacitor in the project root:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Nirapod Jatra" "com.nirapodjatra.app" --web-dir "."
   npx cap add android
   ```
2. Configure `capacitor.config.json` with strict origin allowances:
   ```json
   {
     "appId": "com.nirapodjatra.app",
     "appName": "Nirapod Jatra",
     "webDir": ".",
     "server": {
       "androidScheme": "https",
       "allowNavigation": [
         "https://rahat69x.github.io",
         "https://*.apple-mapkit.com",
         "https://*.apple.com",
         "https://*.tile.openstreetmap.org",
         "https://api.open-meteo.com",
         "https://router.project-osrm.org"
       ]
     }
   }
   ```
3. Build and package APK:
   ```bash
   npx cap sync android
   npx cap open android
   # Build -> Build Bundle(s) / APK(s) -> Build APK(s) in Android Studio
   ```

---

## 5. Future Scope (Post-Hackathon Roadmap)

1. **Real Driver-Side Onboarding & Live GPS Meter Mode:** Phase 2 would let actual CNG/rickshaw drivers register a vehicle, receive a printable QR sticker, and run a lightweight companion web app that shares live trip location—turning the static fare estimate into a dynamic digital meter without requiring expensive in-vehicle hardware.
2. **City-Wide Expansion Beyond Dhaka:** Expand the fare matrix, landmarks, and congestion modeling to Chittagong, Sylhet, and Rajshahi by enabling local route captains to seed municipal pricing tables.
3. **SMS / USSD Fallback for Feature-Phone Users:** Dedicated `*XXX#` USSD or plain SMS gateway (*"Send pickup & dropoff, receive fair fare range"*) reaching elderly, low-income, and rural commuters without smartphones or mobile data.
4. **Verified-Driver Trust Score Fed by Real Community Ratings:** Machine-learning audit layer aggregating real rider ratings and trip reports over time, featuring spoof detection and driver safety tier badges.
5. **DMP & BRTA Grievance Coordination (Future Concept — No Official Partnership):** Conceptual architecture for incident reporting with transport authorities and law enforcement.
