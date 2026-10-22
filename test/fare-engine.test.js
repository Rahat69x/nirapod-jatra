// test/fare-engine.test.js
// Unit tests for Nirapod Jatra pure fare engine, surge caps, limits, fuzzy search & Dhaka routes

const assert = require('assert');

// 1. Bengali Numeral Conversion
function toBengaliNumber(input) {
  const map = { '0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯' };
  return String(input).replace(/[0-9]/g, d => map[d]);
}

// 1b. English Numeral Conversion
function toEnglishNumber(input) {
  const bnToEnMap = { '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9' };
  return String(input).replace(/[০-৯]/g, d => bnToEnMap[d]);
}

// 2. Haversine with Dhaka 1.38 Winding Factor
function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c) * 1.38;
}

// 3. Vehicle Configurations
const VEHICLE_CONFIGS = {
  cng: {
    id: 'cng',
    nameBn: 'সিএনজি অটো-রিকশা',
    nameEn: 'CNG Auto-Rickshaw',
    baseFare: 50,
    coveredKm: 2.0,
    perKmRate: 16,
    congestionRate: 3.5,
    rainSurge: 1.35,
    peakSurge: 1.25,
    nightSurge: 1.30,
    minFareFloor: 50,
    speedKmh: 18,
    maxDistanceKm: null
  },
  rickshaw: {
    id: 'rickshaw',
    nameBn: 'সাধারণ রিকশা',
    nameEn: 'Cycle Rickshaw',
    baseFare: 25,
    coveredKm: 1.0,
    perKmRate: 22,
    congestionRate: 0,
    rainSurge: 1.50,
    peakSurge: 1.20,
    nightSurge: 1.25,
    minFareFloor: 25,
    speedKmh: 10,
    maxDistanceKm: 7.0
  },
  battery: {
    id: 'battery',
    nameBn: 'ইজিবাইক/ব্যাটারি রিকশা',
    nameEn: 'Battery Rickshaw / Easybike',
    baseFare: 20,
    coveredKm: 1.0,
    perKmRate: 14,
    congestionRate: 0,
    rainSurge: 1.30,
    peakSurge: 1.20,
    nightSurge: 1.20,
    minFareFloor: 20,
    speedKmh: 14,
    maxDistanceKm: 10.0
  }
};

function estimateMinutes(distanceKm, vehicleId) {
  const cfg = VEHICLE_CONFIGS[vehicleId];
  const speed = cfg ? cfg.speedKmh : 15;
  return Math.max(3, Math.round((distanceKm / speed) * 60));
}

// 4. Pure Fare Calculation Function
function calculateFare(vehicleId, distanceKm, travelMinutes, conditions = {}) {
  const cfg = VEHICLE_CONFIGS[vehicleId];
  if (!cfg) return null;

  // Stacking surge with strict 1.90x cap
  let activeSurgeMultiplier = 1.0;
  if (conditions.rain) activeSurgeMultiplier *= cfg.rainSurge;
  if (conditions.peak) activeSurgeMultiplier *= cfg.peakSurge;
  if (conditions.night) activeSurgeMultiplier *= cfg.nightSurge;

  if (activeSurgeMultiplier > 1.90) {
    activeSurgeMultiplier = 1.90;
  }

  const billableKm = Math.max(0, distanceKm - cfg.coveredKm);
  const distanceCost = billableKm * cfg.perKmRate;
  const minutes = (travelMinutes && travelMinutes > 0) ? travelMinutes : estimateMinutes(distanceKm, vehicleId);
  const congestionCost = minutes * cfg.congestionRate;
  const rawFare = (cfg.baseFare + distanceCost + congestionCost) * activeSurgeMultiplier;

  let minFare = Math.round((rawFare * 0.90) / 5) * 5;
  let maxFare = Math.round((rawFare * 1.18) / 5) * 5;

  if (minFare < cfg.minFareFloor) minFare = cfg.minFareFloor;
  if (maxFare < minFare) maxFare = minFare + 10;

  const isEligible = cfg.maxDistanceKm ? distanceKm <= cfg.maxDistanceKm : true;

  return {
    vehicleId,
    distanceKm,
    travelMinutes: minutes,
    activeSurgeMultiplier: parseFloat(activeSurgeMultiplier.toFixed(2)),
    baseFare: cfg.baseFare,
    distanceCost,
    congestionCost,
    minFare,
    maxFare,
    isEligible
  };
}

// 5. Multimodal MRT-6 Estimator
function calculateMultimodalMRT6(startCoords, endCoords, totalDistanceKm, conditions = {}) {
  // MRT-6 Stations list
  const MRT_STATIONS = [
    { id: 'mrt_uttara_north', nameBn: 'উত্তরা উত্তর', coords: [23.8767, 90.3879], index: 0 },
    { id: 'mrt_uttara_center', nameBn: 'উত্তরা সেন্টার', coords: [23.8643, 90.3888], index: 1 },
    { id: 'mrt_uttara_south', nameBn: 'উত্তরা দক্ষিণ', coords: [23.8504, 90.3881], index: 2 },
    { id: 'mrt_pallabi', nameBn: 'পল্লবী', coords: [23.8315, 90.3644], index: 3 },
    { id: 'mrt_mirpur11', nameBn: 'মিরপুর ১১', coords: [23.8188, 90.3659], index: 4 },
    { id: 'mrt_mirpur10', nameBn: 'মিরপুর ১০', coords: [23.8069, 90.3687], index: 5 },
    { id: 'mrt_kazipara', nameBn: 'কাজীপাড়া', coords: [23.7946, 90.3725], index: 6 },
    { id: 'mrt_shewrapara', nameBn: 'শেওড়াপাড়া', coords: [23.7876, 90.3734], index: 7 },
    { id: 'mrt_agargaon', nameBn: 'আগারগাঁও', coords: [23.7782, 90.3789], index: 8 },
    { id: 'mrt_bijoy_sarani', nameBn: 'বিজয় সরণি', coords: [23.7667, 90.3875], index: 9 },
    { id: 'mrt_farmgate', nameBn: 'ফার্মগেট', coords: [23.7561, 90.3872], index: 10 },
    { id: 'mrt_karwan_bazar', nameBn: 'কাওরান বাজার', coords: [23.7508, 90.3927], index: 11 },
    { id: 'mrt_shahbagh', nameBn: 'শাহবাগ', coords: [23.7381, 90.3958], index: 12 },
    { id: 'mrt_dhaka_univ', nameBn: 'ঢাকা বিশ্ববিদ্যালয়', coords: [23.7314, 90.3958], index: 13 },
    { id: 'mrt_secretariat', nameBn: 'বাংলাদেশ সচিবালয়', coords: [23.7289, 90.4072], index: 14 },
    { id: 'mrt_motijheel', nameBn: 'মতিঝিল', coords: [23.7290, 90.4176], index: 15 }
  ];

  let nearestStart = null, minStartDist = 999;
  let nearestEnd = null, minEndDist = 999;

  for (const st of MRT_STATIONS) {
    const dStart = calculateHaversine(startCoords[0], startCoords[1], st.coords[0], st.coords[1]) / 1.38;
    if (dStart < minStartDist) {
      minStartDist = dStart;
      nearestStart = st;
    }
    const dEnd = calculateHaversine(endCoords[0], endCoords[1], st.coords[0], st.coords[1]) / 1.38;
    if (dEnd < minEndDist) {
      minEndDist = dEnd;
      nearestEnd = st;
    }
  }

  // Eligible if both ends within 3.5 km of distinct stations and distance is meaningful
  const isCorridor = nearestStart && nearestEnd && (nearestStart.id !== nearestEnd.id) && (minStartDist <= 3.5) && (minEndDist <= 3.5);

  if (!isCorridor) {
    return { isEligible: false };
  }

  const stationCount = Math.abs(nearestStart.index - nearestEnd.index);
  // Official MRT-6 fare formula: Base ৳20 (covers up to 2 stations), then +৳10 per ~2-3 stations, capped at ৳100 (Uttara North to Motijheel)
  let officialMetroFare = 20;
  if (stationCount > 2) officialMetroFare = 30;
  if (stationCount > 5) officialMetroFare = 40;
  if (stationCount > 8) officialMetroFare = 50;
  if (stationCount > 11) officialMetroFare = 70;
  if (stationCount >= 14) officialMetroFare = 100;

  // Leg 1 Rickshaw to Metro
  const leg1Fare = minStartDist < 0.6 ? 0 : Math.max(25, Math.round((25 + (minStartDist - 0.5) * 20) / 5) * 5);
  const leg1Mins = Math.max(3, Math.round(minStartDist * 6));

  // Leg 2 Metro ride (avg 2.2 mins per station)
  const metroMins = Math.max(5, Math.round(stationCount * 2.3));

  // Leg 3 Rickshaw or walk from Metro
  const leg3Fare = minEndDist < 0.6 ? 0 : Math.max(25, Math.round((25 + (minEndDist - 0.5) * 20) / 5) * 5);
  const leg3Mins = Math.max(3, Math.round(minEndDist * 6));

  const totalMinFare = leg1Fare + officialMetroFare + leg3Fare;
  const totalMaxFare = totalMinFare + (leg1Fare > 0 ? 10 : 0) + (leg3Fare > 0 ? 10 : 0);
  const totalMins = leg1Mins + metroMins + leg3Mins + 4; // 4 min buffer

  return {
    isEligible: true,
    vehicleId: 'multimodal',
    nameBn: 'রিকশা + মেট্রোরেল (MRT-6)',
    nearestStartStation: nearestStart.nameBn,
    nearestEndStation: nearestEnd.nameBn,
    minStartDist: parseFloat(minStartDist.toFixed(1)),
    minEndDist: parseFloat(minEndDist.toFixed(1)),
    stationCount,
    officialMetroFare,
    leg1Fare,
    leg3Fare,
    minFare: totalMinFare,
    maxFare: totalMaxFare,
    travelMinutes: totalMins,
    reasonBn: 'মেট্রোরেলে ট্রাফিকের দীর্ঘ জ্যাম ও সিগন্যাল পুরোপুরি এড়ানো যায়'
  };
}

// 6. Fuzzy Landmark Search & Alias Resolution
function normalizeSearchText(text) {
  if (!text) return '';
  const bnToEnMap = { '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9' };
  let s = String(text).toLowerCase().trim();
  s = s.replace(/[০-৯]/g, d => bnToEnMap[d]);
  s = s.replace(/[\-\_\,\.\(\)\/]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

const TEST_LANDMARKS = [
  { id: 'farmgate', nameBn: 'ফার্মগেট মোড়', nameEn: 'Farmgate', aliases: ['ফার্মগেট', 'ফার্মগেইট', 'farmgate', 'farm gate'] },
  { id: 'mrt_farmgate', nameBn: 'ফার্মগেট (মেট্রো)', nameEn: 'Farmgate MRT', aliases: ['ফার্মগেট মেট্রো', 'farmgate metro', 'ফার্মগেট স্টেশন'] },
  { id: 'gulshan1', nameBn: 'গুলশান ১ সার্কেল', nameEn: 'Gulshan 1 Circle', aliases: ['গুলশান ১', 'গুলশান 1', 'গুলশান-১', 'gulshan 1', 'gulshan1', 'গুলশান'] },
  { id: 'mirpur10', nameBn: 'মিরপুর ১০ গোলচত্বর', nameEn: 'Mirpur 10 Roundabout', aliases: ['মিরপুর ১০', 'মিরপুর 10', 'মিরপুর-১০', 'mirpur 10', 'mirpur10', 'মিরপুর'] },
  { id: 'motijheel', nameBn: 'মতিঝিল শাপলা চত্বর', nameEn: 'Motijheel Shapla Chottor', aliases: ['মতিঝিল', 'শাপলা চত্বর', 'motijheel', 'shapla chottor'] },
  { id: 'dhanmondi27', nameBn: 'ধানমন্ডি ২৭', nameEn: 'Dhanmondi 27', aliases: ['ধানমন্ডি ২৭', 'ধানমন্ডি 27', 'ধানমন্ডি-২৭', 'dhanmondi 27', 'ধানমন্ডি'] },
  { id: 'newmarket', nameBn: 'নিউ মার্কেট', nameEn: 'New Market', aliases: ['নিউ মার্কেট', 'নিউমার্কেট', 'new market', 'newmarket'] },
  { id: 'airport', nameBn: 'হযরত শাহজালাল বিমানবন্দর', nameEn: 'Hazrat Shahjalal Airport', aliases: ['বিমানবন্দর', 'এয়ারপোর্ট', 'airport'] },
  { id: 'uttara3', nameBn: 'উত্তরা সেক্টর ৩', nameEn: 'Uttara Sector 3', aliases: ['উত্তরা ৩', 'উত্তরা 3', 'উত্তরা সেক্টর ৩', 'uttara 3', 'uttara sector 3'] },
  { id: 'mrt_dhaka_univ', nameBn: 'ঢাকা বিশ্ববিদ্যালয় টিএসসি', nameEn: 'Dhaka Univ TSC', aliases: ['টিএসসি', 'ঢাকা বিশ্ববিদ্যালয়', 'ঢাবি', 'tsc', 'dhaka university'] }
];

function searchLandmarks(query) {
  const norm = normalizeSearchText(query);
  if (!norm) return [];

  return TEST_LANDMARKS.filter(l => {
    const bnNorm = normalizeSearchText(l.nameBn);
    const enNorm = normalizeSearchText(l.nameEn);
    if (bnNorm.includes(norm) || enNorm.includes(norm)) return true;
    return l.aliases.some(alias => {
      const aNorm = normalizeSearchText(alias);
      return aNorm.includes(norm) || norm.includes(aNorm);
    });
  });
}

// ==========================================
// TEST SUITE EXECUTION
// ==========================================
console.log('🚀 Running Nirapod Jatra Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Reason: ${err.message}`);
  }
}

// Test 1: Bengali & English Numeral Formatting
runTest('Bengali and English numeral conversion matches correctly', () => {
  assert.strictEqual(toBengaliNumber('12345'), '১২৩৪৫');
  assert.strictEqual(toBengaliNumber('0'), '০');
  assert.strictEqual(toBengaliNumber('5.2 কিমি'), '৫.২ কিমি');
  assert.strictEqual(toEnglishNumber('১২৩৪৫'), '12345');
  assert.strictEqual(toEnglishNumber('০'), '0');
  assert.strictEqual(toEnglishNumber('৫.২ কিমি'), '5.2 কিমি');
});

// Test 2: CNG Fare Formula
runTest('CNG fare formula: 5.2 km with 22 mins travel time', () => {
  // Base 50 (covers 2 km) + 3.2 km * 16 = 51.2 + 22 mins * 3.5 = 77. Total raw: 50 + 51.2 + 77 = 178.2
  // Min (0.90) = 160.38 -> 160, Max (1.18) = 210.27 -> 210
  const cng = calculateFare('cng', 5.2, 22, { rain: false, peak: false, night: false });
  assert.strictEqual(cng.baseFare, 50);
  assert.strictEqual(cng.minFare, 160);
  assert.strictEqual(cng.maxFare, 210);
});

// Test 3: Surge Multiplier Stacking & 1.90x Cap
runTest('Surge multiplier stacks and rigidly caps at 1.90x', () => {
  // Rain 1.35 * Peak 1.25 * Night 1.30 = 2.193 -> Cap at 1.90
  const cngSurge = calculateFare('cng', 5.2, 22, { rain: true, peak: true, night: true });
  assert.strictEqual(cngSurge.activeSurgeMultiplier, 1.90);
});

// Test 4: Rickshaw Distance Limit
runTest('Cycle Rickshaw enforces <= 7.0 km limit', () => {
  const shortTrip = calculateFare('rickshaw', 3.5, 20);
  assert.strictEqual(shortTrip.isEligible, true);

  const longTrip = calculateFare('rickshaw', 8.5, 50);
  assert.strictEqual(longTrip.isEligible, false);
});

// Test 5: Battery Easybike Distance Limit
runTest('Battery Easybike enforces <= 10.0 km limit', () => {
  const midTrip = calculateFare('battery', 6.0, 30);
  assert.strictEqual(midTrip.isEligible, true);

  const tooLongTrip = calculateFare('battery', 12.0, 60);
  assert.strictEqual(tooLongTrip.isEligible, false);
});

// Test 6: Haversine Distance Fallback
runTest('Haversine distance between Farmgate and Motijheel reflects 1.38 winding factor', () => {
  const dist = calculateHaversine(23.7561, 90.3872, 23.7290, 90.4176);
  // Straight line is ~4.4 km, with 1.38 factor is ~6.1 km
  assert.ok(dist >= 5.5 && dist <= 7.0, `Calculated distance: ${dist}`);
});

// Test 7: Fuzzy Matching & Bangla Alias Resolution
runTest('Fuzzy matching matches Bangla text, numbers, and aliases', () => {
  // Farmgate
  const res1 = searchLandmarks('ফার্মগেট');
  assert.ok(res1.some(l => l.id === 'farmgate'));

  // Gulshan 1 with Bangla digit
  const res2 = searchLandmarks('গুলশান ১');
  assert.ok(res2.some(l => l.id === 'gulshan1'));

  // Mirpur 10 with English digit
  const res3 = searchLandmarks('মিরপুর 10');
  assert.ok(res3.some(l => l.id === 'mirpur10'));

  // Dhobi / TSC
  const res4 = searchLandmarks('টিএসসি');
  assert.ok(res4.some(l => l.id === 'mrt_dhaka_univ'));
});

// Test 8: 5 Sample Dhaka Journeys Comparison & Cheapest Selection
console.log('\n--- 5 Sample Dhaka Journeys Evaluation ---');

const SAMPLE_JOURNEYS = [
  {
    name: '১. ফার্মগেট ➔ গুলশান ১',
    start: [23.7561, 90.3872],
    end: [23.7788, 90.4173],
    distKm: 5.2,
    mins: 22
  },
  {
    name: '২. মিরপুর ১০ ➔ মতিঝিল (দূরপাল্লার মেট্রো করিডোর)',
    start: [23.8069, 90.3687],
    end: [23.7290, 90.4176],
    distKm: 13.8,
    mins: 55
  },
  {
    name: '৩. ধানমন্ডি ২৭ ➔ নিউ মার্কেট (স্বল্প দূরত্ব)',
    start: [23.7539, 90.3705],
    end: [23.7333, 90.3846],
    distKm: 2.8,
    mins: 15
  },
  {
    name: '৪. ফার্মগেট ➔ ঢাকা বিশ্ববিদ্যালয় টিএসসি (মেট্রো রুট)',
    start: [23.7561, 90.3872],
    end: [23.7314, 90.3958],
    distKm: 3.8,
    mins: 18
  },
  {
    name: '৫. উত্তরা সেক্টর ৩ ➔ বিমানবন্দর',
    start: [23.8681, 90.3986],
    end: [23.8433, 90.3978],
    distKm: 3.2,
    mins: 14
  }
];

SAMPLE_JOURNEYS.forEach(j => {
  runTest(`Journey: ${j.name}`, () => {
    const cng = calculateFare('cng', j.distKm, j.mins);
    const rickshaw = calculateFare('rickshaw', j.distKm, j.mins);
    const battery = calculateFare('battery', j.distKm, j.mins);
    const metro = calculateMultimodalMRT6(j.start, j.end, j.distKm);

    const eligible = [];
    if (cng.isEligible) eligible.push({ id: 'cng', name: 'সিএনজি', minFare: cng.minFare, maxFare: cng.maxFare, mins: cng.travelMinutes });
    if (rickshaw.isEligible) eligible.push({ id: 'rickshaw', name: 'রিকশা', minFare: rickshaw.minFare, maxFare: rickshaw.maxFare, mins: rickshaw.travelMinutes });
    if (battery.isEligible) eligible.push({ id: 'battery', name: 'ইজিবাইক', minFare: battery.minFare, maxFare: battery.maxFare, mins: battery.travelMinutes });
    if (metro.isEligible) eligible.push({ id: 'multimodal', name: 'মেট্রোরেল বিকল্প', minFare: metro.minFare, maxFare: metro.maxFare, mins: metro.travelMinutes });

    eligible.sort((a, b) => a.minFare - b.minFare);
    const cheapest = eligible[0];

    console.log(`      * দূরত্ব: ${j.distKm} কিমি | উপলব্ধ বিকল্প: ${eligible.map(e => `${e.name} (৳${e.minFare})`).join(', ')}`);
    console.log(`      * সবচেয়ে সাশ্রয়ী: ${cheapest.name} (৳${cheapest.minFare}–${cheapest.maxFare}, ~${cheapest.mins} মিনিট)`);
    assert.ok(cheapest !== undefined && cheapest.minFare > 0);
  });
});

console.log(`\nResults: ${passedTests} / ${totalTests} tests passed.\n`);
if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
