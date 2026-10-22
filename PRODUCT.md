# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are daily Dhaka commuters—including students, women, office workers, shift workers, and late-night travelers—who rely on Dhaka's informal transit ecosystem (CNG auto-rickshaws, traditional cycle rickshaws, battery easybikes, and MRT-6 Metro Rail). These riders frequently face arbitrary price quotes, aggressive overcharging during rain or rush hours, lack of working digital meters, and safety concerns when traveling alone or after dark.

## Product Purpose

Nirapod Jatra (নিরাপদ যাত্রা) exists to eliminate information asymmetry and overcharging in Dhaka's street transport before a commuter steps into a vehicle. It provides:
1. Instant, deterministic fair-fare ranges based on true road distance, vehicle speeds, and congestion buffers.
2. Multimodal Dhaka Metro Rail (MRT-6) recommendations that bypass traffic gridlock and save money.
3. Culturally grounded bargaining advice and Bangla spoken guides to empower confident street negotiation.
4. Civic safety utilities (audible offline distress siren, emergency contacts, 999 hotline integration, and community trip ledger).

Success means a commuter enters their journey in natural Bangla, immediately sees the lowest-cost option, knows the fair price range with full mathematical transparency, and travels safely.

## Positioning

Unlike proprietary ride-hailing apps (Uber, Pathao) that charge dynamic algorithm surges and ignore the informal rickshaw/easybike economy, Nirapod Jatra is a zero-dependency, open-source, civic-minded companion built for the Dhaka street reality. It calculates honest street fares, integrates official MRT-6 fares, operates completely client-side with offline fallbacks, and never requires an account or collects personal data.

## Operating Context

- **Environment:** High-stress, noisy street corners, crowded bus stops, and metro station exits in Dhaka.
- **Connectivity:** Unstable mobile 3G/4G or complete offline conditions during transit.
- **Lighting:** Glaring midday sunlight or dim nighttime street lighting.
- **Device:** Mostly handheld smartphones (360px–430px viewport width) operated one-handed, as well as desktop planning.
- **Language:** Conversational everyday Bangla as the primary language, with English and Bengali numerals (`০-৯`).

## Capabilities and Constraints

- **Capabilities:**
  - Natural Bangla fuzzy search with alias matching (e.g. "ফার্মগেট", "গুলশান ১", "ঢাবি").
  - Deterministic fare calculation engine with strict 1.90x surge multiplier ceiling.
  - Multi-vehicle comparison matrix (CNG, Cycle Rickshaw, Battery Easybike, Multimodal Metro).
  - Leaflet / OpenStreetMap interactive routing with OSRM and Haversine x1.38 fallback.
  - Prepared for Apple Maps (MapKit JS) integration with Leaflet fallback.
  - Real-time weather detection via Open-Meteo for rain surge recommendations.
  - Client-side Web Audio API distress siren (100% offline, dual-tone 750Hz–1150Hz).
  - Web Speech synthesis for natural Bangla negotiation advice playback.
  - URL hash trip sharing (`#from=...&to=...&mode=...`) and WhatsApp/SMS export.
  - Client-side community trip ledger and trusted emergency contacts stored strictly in `localStorage`.
- **Constraints:**
  - Zero server secrets: no API keys or `.p8` private keys committed to the repository.
  - Zero-build web application: must run out-of-the-box in modern browsers and via simple static hosting (GitHub Pages).
  - Maximum 7.0 km distance limit for cycle rickshaws; 10.0 km for battery easybikes.
  - Privacy-first: all user inputs and location coordinates stay strictly on the user's device.

## Brand Commitments

- **Name:** নিরাপদ যাত্রা (Nirapod Jatra)
- **Tagline:** ঢাকা শহরের ন্যায্য ভাড়া ও নিরাপত্তা সঙ্গী (Fair-fare and safety companion for Dhaka commuters)
- **Primary Color:** Dhaka Metro MRT-6 Emerald (`#059669`)
- **Accent Color:** Dhaka Rickshaw Hood Amber (`#f59e0b`)
- **Emergency Color:** Distress Crimson (`#dc2626`)
- **Tone:** Empathetic, trustworthy, street-smart, transparent, and authoritative.

## Evidence on Hand

- Fully operational core journey engine in [index.html](file:///c:/New%20folder/nirapod-jatra/index.html) tested with 33 passing automated test suites.
- 16 MRT Line 6 metro stations accurately mapped with official distance-tier fare rules (৳20 to ৳100).
- Authentic benchmark data for Dhaka street transport (BRTA guidelines and crowdsourced averages).
- Seeded Dhaka community trips across major corridors (Farmgate, Gulshan, Mirpur, Motijheel, Dhanmondi, Uttara).

## Product Principles

1. **Honesty Over Hype:** All fares are clearly labeled as estimates ("আনুমানিক"). No artificial claims of "live official GPS tracking" without verified vehicle sensors.
2. **Accessible in Real Street Conditions:** High contrast, legible typography, 44px minimum tap targets, and clean readability without overwhelming visual noise.
3. **Bangla-First Dignity:** Native Bengali typography (Hind Siliguri) rendered cleanly without broken ligatures or unnatural uppercase styling.
4. **Resilience by Design:** Every external dependency (routing, weather, maps) has a deterministic local fallback that works offline.
5. **Zero Data Exploitation:** User journeys, locations, and contacts belong entirely to the user's phone.

## Accessibility & Inclusion

- WCAG AA compliance for color contrast across both Light and AMOLED Dark themes.
- Touch targets sized at 44×44px or greater for touch accuracy while walking.
- Full screen-reader accessible names and ARIA landmark roles.
- Respect for `prefers-reduced-motion` to prevent motion sickness during transit.
