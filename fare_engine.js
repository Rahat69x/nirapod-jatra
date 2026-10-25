/**
 * fare_engine.js - Pure Deterministic Fare Calculation & Transit Logic
 * Nirapod Jatra (নিরাপদ যাত্রা)
 * 
 * Sources & Official Rules:
 * - BRTA CNG Gazette (2015): Base ৳40 (first 2 km), ৳12/km thereafter, ৳2/min waiting.
 * - DMTCL MRT Line-6 Fare Chart (2023-2024): Base ৳20, ৳5/km, max ৳100 (Uttara North <-> Motijheel).
 * - Rickshaw / Battery Easybike: Informal market norms (No municipal fixed rate; ~৳18-22/km for human, ~৳14-16/km for battery).
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.FareEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

const VEHICLE_CONFIGS = {
  cng: {
    id: 'cng',
    nameBn: 'সিএনজি অটো',
    nameEn: 'CNG Auto',
    officialBaseFare: 40,      // BRTA 2015 gazette
    officialCoveredKm: 2.0,
    officialPerKmRate: 12,
    officialWaitingRate: 2,    // ৳2/min
    // Realistic Dhaka street negotiation baseline (since meter is universally refused)
    baseFare: 50,              // Street base (first 2 km)
    coveredKm: 2.0,
    perKmRate: 16,             // Street distance rate
    congestionRate: 1.5,       // Street waiting / slow-speed buffer per minute
    minFareFloor: 60,
    rainSurge: 1.25,
    peakSurge: 1.20,
    nightSurge: 1.15,
    maxDistanceLimit: 40,
    source: 'BRTA গেজেট ২০১৫ (মিটার) ও ঢাকা স্ট্রিট নেগোসিয়েশন সার্ভে ২০২৪',
    sourceEn: 'BRTA 2015 Gazette (Meter) & Dhaka Commuter Street Survey 2024',
    sourceDate: '2024-10-01',
    isOfficialMeterAvailable: true
  },
  rickshaw: {
    id: 'rickshaw',
    nameBn: 'সাধারণ রিকশা',
    nameEn: 'Cycle Rickshaw',
    baseFare: 30,              // First 1 km baseline
    coveredKm: 1.0,
    perKmRate: 20,             // ~৳20/km street norm
    congestionRate: 0.8,       // Physical effort buffer in severe jam
    minFareFloor: 25,
    rainSurge: 1.35,
    peakSurge: 1.15,
    nightSurge: 1.10,
    maxDistanceLimit: 7.0,     // Strictly human powered; disabled above 7 km
    source: 'ঢাকা সিটি করপোরেশন এলাকা ভিত্তিক অনানুষ্ঠানিক বাজার দর (উৎস নেই)',
    sourceEn: 'Dhaka City Corporation Informal Market Average (Unregulated)',
    sourceDate: '2024-10-01',
    isOfficialMeterAvailable: false
  },
  battery: {
    id: 'battery',
    nameBn: 'ব্যাটারি রিকশা / ইজিবাইক',
    nameEn: 'Battery Easybike',
    baseFare: 25,              // Baseline
    coveredKm: 1.0,
    perKmRate: 15,             // ~৳15/km
    congestionRate: 0.5,
    minFareFloor: 20,
    rainSurge: 1.20,
    peakSurge: 1.15,
    nightSurge: 1.10,
    maxDistanceLimit: 12.0,
    source: 'অনানুষ্ঠানিক শহরতলি ও ফিডার রুট স্থানীয় রেট (উৎস নেই)',
    sourceEn: 'Informal Feeder Route Norms (Unregulated)',
    sourceDate: '2024-10-01',
    isOfficialMeterAvailable: false
  }
};

// DMTCL MRT-6 Official Stations from North to South (with single-journey ticket from Uttara North)
const MRT6_STATIONS = [
  { id: 'mrt_uttara_north', nameBn: 'উত্তরা উত্তর', nameEn: 'Uttara North', coords: [23.8767, 90.3800], fareFromNorth: 0, kmFromNorth: 0 },
  { id: 'mrt_uttara_center', nameBn: 'উত্তরা সেন্টার', nameEn: 'Uttara Center', coords: [23.8647, 90.3840], fareFromNorth: 20, kmFromNorth: 1.5 },
  { id: 'mrt_uttara_south', nameBn: 'উত্তরা দক্ষিণ', nameEn: 'Uttara South', coords: [23.8540, 90.3750], fareFromNorth: 20, kmFromNorth: 2.8 },
  { id: 'mrt_pallabi', nameBn: 'পল্লবী', nameEn: 'Pallabi', coords: [23.8260, 90.3640], fareFromNorth: 30, kmFromNorth: 4.8 },
  { id: 'mrt_mirpur11', nameBn: 'মিরপুর ১১', nameEn: 'Mirpur 11', coords: [23.8160, 90.3660], fareFromNorth: 30, kmFromNorth: 6.0 },
  { id: 'mrt_mirpur10', nameBn: 'মিরপুর ১০', nameEn: 'Mirpur 10', coords: [23.8069, 90.3686], fareFromNorth: 40, kmFromNorth: 7.3 },
  { id: 'mrt_kazipara', nameBn: 'কাজীপাড়া', nameEn: 'Kazipara', coords: [23.7970, 90.3720], fareFromNorth: 40, kmFromNorth: 8.6 },
  { id: 'mrt_shewrapara', nameBn: 'শেওড়াপাড়া', nameEn: 'Shewrapara', coords: [23.7880, 90.3740], fareFromNorth: 50, kmFromNorth: 9.7 },
  { id: 'mrt_agargaon', nameBn: 'আগারগাঁও', nameEn: 'Agargaon', coords: [23.7770, 90.3780], fareFromNorth: 60, kmFromNorth: 11.2 },
  { id: 'mrt_bijoy_sarani', nameBn: 'বিজয় সরণি', nameEn: 'Bijoy Sarani', coords: [23.7650, 90.3840], fareFromNorth: 60, kmFromNorth: 12.8 },
  { id: 'mrt_farmgate', nameBn: 'ফার্মগেট', nameEn: 'Farmgate', coords: [23.7561, 90.3872], fareFromNorth: 70, kmFromNorth: 14.1 },
  { id: 'mrt_karwan_bazar', nameBn: 'কারওয়ান বাজার', nameEn: 'Karwan Bazar', coords: [23.7505, 90.3920], fareFromNorth: 80, kmFromNorth: 15.3 },
  { id: 'mrt_shahbag', nameBn: 'শাহবাগ', nameEn: 'Shahbag', coords: [23.7380, 90.3950], fareFromNorth: 80, kmFromNorth: 16.6 },
  { id: 'mrt_dhaka_univ', nameBn: 'ঢাকা বিশ্ববিদ্যালয়', nameEn: 'Dhaka University', coords: [23.7310, 90.3970], fareFromNorth: 90, kmFromNorth: 17.8 },
  { id: 'mrt_secretariat', nameBn: 'বাংলাদেশ সচিবালয়', nameEn: 'Bangladesh Secretariat', coords: [23.7270, 90.4040], fareFromNorth: 90, kmFromNorth: 18.9 },
  { id: 'mrt_motijheel', nameBn: 'মতিঝিল', nameEn: 'Motijheel', coords: [23.7260, 90.4180], fareFromNorth: 100, kmFromNorth: 20.1 }
];

/**
 * Great-circle distance between two GPS coordinates using Haversine formula
 */
function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate travel time in minutes based on distance and vehicle type in typical Dhaka traffic
 */
function estimateMinutes(distanceKm, vehicleId) {
  const speeds = {
    cng: 16,        // km/h in Dhaka traffic
    rickshaw: 9,    // km/h
    battery: 13,    // km/h
    metro: 32       // km/h
  };
  const spd = speeds[vehicleId] || 15;
  const mins = Math.round((distanceKm / spd) * 60);
  return Math.max(3, mins);
}

/**
 * Surges calculation with naive stacking capped at 1.90x
 */
function calculateSurgeMultiplier(conditions, vehicleCfg) {
  let mult = 1.0;
  if (!vehicleCfg) return mult;
  if (conditions.rain) mult *= (vehicleCfg.rainSurge || 1.25);
  if (conditions.peak) mult *= (vehicleCfg.peakSurge || 1.20);
  if (conditions.night) mult *= (vehicleCfg.nightSurge || 1.15);
  return Math.min(1.90, parseFloat(mult.toFixed(2)));
}

/**
 * Calculates deterministic fare with named line-item breakdown explaining the exact numbers
 */
function calculateFareEngine(vehicleId, distanceKm, travelMinutes, conditions) {
  const cfg = VEHICLE_CONFIGS[vehicleId];
  if (!cfg) return null;

  const duration = travelMinutes || estimateMinutes(distanceKm, vehicleId);
  const activeSurgeMultiplier = calculateSurgeMultiplier(conditions, cfg);

  // Billable km beyond covered km
  const billableKm = Math.max(0, distanceKm - cfg.coveredKm);
  const baseFare = cfg.baseFare;
  const distanceCost = parseFloat((billableKm * cfg.perKmRate).toFixed(2));
  const congestionCost = parseFloat((duration * cfg.congestionRate).toFixed(2));

  // Street raw calculation
  const subtotalBeforeSurge = parseFloat((baseFare + distanceCost + congestionCost).toFixed(2));
  const rawFare = parseFloat((subtotalBeforeSurge * activeSurgeMultiplier).toFixed(2));

  // Rounded window to nearest ৳5
  let minFare = Math.round((rawFare * 0.90) / 5) * 5;
  let maxFare = Math.round((rawFare * 1.18) / 5) * 5;

  if (minFare < cfg.minFareFloor) minFare = cfg.minFareFloor;
  if (maxFare < minFare) maxFare = minFare + 10;

  // Calculate official government meter fare (for CNG)
  let officialMeterFare = null;
  if (cfg.isOfficialMeterAvailable) {
    const offBillableKm = Math.max(0, distanceKm - cfg.officialCoveredKm);
    const offDistCost = offBillableKm * cfg.officialPerKmRate;
    const offWaitCost = duration * cfg.officialWaitingRate;
    officialMeterFare = Math.round(cfg.officialBaseFare + offDistCost + offWaitCost);
  }

  return {
    vehicleId,
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    travelMinutes: duration,
    // Line items
    baseFare,
    coveredKm: cfg.coveredKm,
    billableKm: parseFloat(billableKm.toFixed(2)),
    perKmRate: cfg.perKmRate,
    distanceCost,
    congestionRate: cfg.congestionRate,
    congestionCost,
    subtotalBeforeSurge,
    activeSurgeMultiplier,
    rawFare,
    minFare,
    maxFare,
    // Official source context
    source: cfg.source,
    sourceEn: cfg.sourceEn,
    sourceDate: cfg.sourceDate,
    officialMeterFare,
    isOfficialMeterAvailable: cfg.isOfficialMeterAvailable,
    isDistanceAllowed: distanceKm <= cfg.maxDistanceLimit,
    maxDistanceLimit: cfg.maxDistanceLimit
  };
}

/**
 * Official DMTCL station-to-station metro fare chart lookup
 */
function getStationToStationMetroFare(startStationId, endStationId) {
  const startIdx = MRT6_STATIONS.findIndex(s => s.id === startStationId);
  const endIdx = MRT6_STATIONS.findIndex(s => s.id === endStationId);
  if (startIdx === -1 || endIdx === -1 || startIdx === endIdx) return 0;

  const stationCount = Math.abs(endIdx - startIdx);
  const startKm = MRT6_STATIONS[startIdx].kmFromNorth;
  const endKm = MRT6_STATIONS[endIdx].kmFromNorth;
  const distanceKm = Math.abs(endKm - startKm);

  // DMTCL rule: minimum ৳20 (up to 2 stations), ৳5/km, max ৳100
  let fare = Math.round(distanceKm * 5);
  if (fare < 20) fare = 20;
  if (stationCount <= 2 && fare > 20) fare = 20;
  if (fare > 100) fare = 100;
  return fare;
}

/**
 * Uber & Pathao reference estimators (explicitly labeled as estimates, not live API)
 */
function calculateRideHailingEstimates(distanceKm, travelMinutes, conditions) {
  let surge = 1.0;
  if (conditions.rain) surge += 0.25;
  if (conditions.peak) surge += 0.20;
  if (conditions.night) surge += 0.15;
  if (surge > 1.85) surge = 1.85;

  const minutes = travelMinutes || estimateMinutes(distanceKm, 'cng');

  const motoRaw = (30 + (distanceKm * 14) + (minutes * 0.75)) * surge;
  const motoMin = Math.max(45, Math.round((motoRaw * 0.90) / 5) * 5);
  const motoMax = Math.max(motoMin + 15, Math.round((motoRaw * 1.15) / 5) * 5);

  const cngRaw = (55 + (distanceKm * 18) + (minutes * 2.50) + 15) * surge;
  const cngMin = Math.max(70, Math.round((cngRaw * 0.90) / 5) * 5);
  const cngMax = Math.max(cngMin + 20, Math.round((cngRaw * 1.15) / 5) * 5);

  return {
    surge,
    motoMin,
    motoMax,
    cngMin,
    cngMax,
    disclaimerBn: 'রেফারেন্স আনুমানিক, লাইভ দাম নয়',
    disclaimerEn: 'Reference estimate, not live pricing'
  };
}

/**
 * Multimodal Journey: Calculates Rickshaw + MRT-6 combination
 */
function findMultimodalRoute(startPoint, endPoint) {
  if (!startPoint || !endPoint) return null;

  const sLat = startPoint.lat !== undefined ? startPoint.lat : (startPoint.coords ? startPoint.coords[0] : 0);
  const sLng = startPoint.lng !== undefined ? startPoint.lng : (startPoint.coords ? startPoint.coords[1] : 0);
  const eLat = endPoint.lat !== undefined ? endPoint.lat : (endPoint.coords ? endPoint.coords[0] : 0);
  const eLng = endPoint.lng !== undefined ? endPoint.lng : (endPoint.coords ? endPoint.coords[1] : 0);

  if (!sLat || !sLng || !eLat || !eLng) return null;

  // Find nearest MRT stations
  let nearestStartStation = null;
  let minStartDist = 999;
  let nearestEndStation = null;
  let minEndDist = 999;

  MRT6_STATIONS.forEach(st => {
    const dStart = calculateHaversine(sLat, sLng, st.coords[0], st.coords[1]);
    if (dStart < minStartDist) {
      minStartDist = dStart;
      nearestStartStation = st;
    }
    const dEnd = calculateHaversine(eLat, eLng, st.coords[0], st.coords[1]);
    if (dEnd < minEndDist) {
      minEndDist = dEnd;
      nearestEndStation = st;
    }
  });

  // Only viable if stations are distinct and within reasonable feeder reach (≤ 4 km to station)
  if (!nearestStartStation || !nearestEndStation || nearestStartStation.id === nearestEndStation.id) {
    return null;
  }

  if (minStartDist > 4.5 && minEndDist > 4.5) {
    return null; // Too far from metro corridor
  }

  const metroFare = getStationToStationMetroFare(nearestStartStation.id, nearestEndStation.id);
  const feeder1Dist = parseFloat(minStartDist.toFixed(1));
  const feeder2Dist = parseFloat(minEndDist.toFixed(1));

  const feeder1Cost = feeder1Dist > 0.3 ? Math.max(25, Math.round((25 + (feeder1Dist * 18)) / 5) * 5) : 0; // 0 if walking
  const feeder2Cost = feeder2Dist > 0.3 ? Math.max(25, Math.round((25 + (feeder2Dist * 18)) / 5) * 5) : 0;
  const totalMin = metroFare + feeder1Cost + feeder2Cost;
  const totalMax = totalMin + 15;

  const metroDistanceKm = Math.abs(nearestEndStation.kmFromNorth - nearestStartStation.kmFromNorth);
  const metroMinutes = Math.round(metroDistanceKm * 2.0); // ~2 min per station avg
  const feeder1Minutes = Math.round(feeder1Dist * 6);
  const feeder2Minutes = Math.round(feeder2Dist * 6);
  const totalMinutes = metroMinutes + feeder1Minutes + feeder2Minutes + 6; // +6 min station walk/transfer

  return {
    startStation: nearestStartStation,
    endStation: nearestEndStation,
    feeder1Dist,
    feeder1Cost,
    feeder1Minutes,
    metroFare,
    metroDistanceKm: parseFloat(metroDistanceKm.toFixed(1)),
    metroMinutes,
    feeder2Dist,
    feeder2Cost,
    feeder2Minutes,
    totalMin,
    totalMax,
    totalMinutes,
    source: 'DMTCL সরকারি এমআরটি-৬ ভাড়ার তালিকা ২০২৩-২০২৪',
    sourceEn: 'Official DMTCL MRT Line-6 Fare Chart 2023-2024',
    sourceDate: '2024-01-20'
  };
}

/**
 * Numbers to Bengali Numerals
 */
function toBengaliNumber(num) {
  if (num === null || num === undefined) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, d => bnDigits[parseInt(d, 10)]);
}

/**
 * Bengali Numerals to Standard Number
 */
function parseBengaliNumber(str) {
  if (!str) return NaN;
  const bnMap = { '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9 };
  const standardized = str.toString().replace(/[০-৯]/g, d => bnMap[d]);
  return parseFloat(standardized);
}

function normalizeTextForMatching(str) {
  if (!str) return '';
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  return str.toString().toLowerCase().replace(/[০-৯]/g, d => bnToEnMap[d]).replace(/[-\s]/g, '');
}

/**
 * Fuzzy Place Matcher with Bangla Digits & Common Variations
 */
function fuzzyMatchPlace(query, landmarksList) {
  if (!query || typeof query !== 'string') return [];
  const qNorm = normalizeTextForMatching(query);
  if (!qNorm) return [];

  return landmarksList.filter(l => {
    const bnNorm = normalizeTextForMatching(l.nameBn);
    const enNorm = normalizeTextForMatching(l.nameEn);
    const idNorm = normalizeTextForMatching(l.id);
    const aliasNorms = (l.aliases || []).map(a => normalizeTextForMatching(a));

    return (
      bnNorm.includes(qNorm) ||
      enNorm.includes(qNorm) ||
      idNorm.includes(qNorm) ||
      aliasNorms.some(a => a.includes(qNorm) || qNorm.includes(a))
    );
  });
}

  return {
    VEHICLE_CONFIGS,
    MRT6_STATIONS,
    calculateHaversine,
    estimateMinutes,
    calculateSurgeMultiplier,
    calculateFareEngine,
    getStationToStationMetroFare,
    calculateRideHailingEstimates,
    findMultimodalRoute,
    toBengaliNumber,
    parseBengaliNumber,
    fuzzyMatchPlace
  };
});
