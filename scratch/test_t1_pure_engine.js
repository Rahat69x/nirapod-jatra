const assert = require('assert');
const {
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
} = require('c:/project 03/jatra/fare_engine.js');

const findings = [];
let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    findings.push({ name, error: err.message });
  }
}

console.log('--- RUNNING T1 UNIT TESTS FOR PURE TRANSIT ENGINE ---');

// 1. Base fare + per km calculation
runTest('CNG base fare at 0 km and exactly 2 km', () => {
  const f0 = calculateFareEngine('cng', 0, 5, { rain: false, peak: false, night: false });
  assert.strictEqual(f0.baseFare, 50);
  assert.strictEqual(f0.billableKm, 0);
  assert.strictEqual(f0.distanceCost, 0);

  const f2 = calculateFareEngine('cng', 2.0, 10, { rain: false, peak: false, night: false });
  assert.strictEqual(f2.billableKm, 0);
  assert.strictEqual(f2.distanceCost, 0);
});

runTest('CNG line item breakdown at 5.2 km explains ৳101 vs ৳120-145', () => {
  const f52 = calculateFareEngine('cng', 5.2, 18, { rain: false, peak: false, night: false });
  assert.strictEqual(f52.baseFare, 50);
  assert.strictEqual(f52.billableKm, 3.2);
  assert.strictEqual(f52.distanceCost, 51.2); // 3.2 * 16
  assert.strictEqual(f52.congestionCost, 27);  // 18 mins * 1.5
  assert.strictEqual(f52.subtotalBeforeSurge, 128.2);
  // Base + Distance alone is 101.2!
  assert.strictEqual(f52.baseFare + f52.distanceCost, 101.2);
  // Full range is 120 - 150
  assert.strictEqual(f52.minFare, 115);
  assert.strictEqual(f52.maxFare, 150);
});

// 2. Surges alone and stacked
runTest('Surge multiplier capped at 1.90x', () => {
  const cfg = VEHICLE_CONFIGS.cng;
  const noSurge = calculateSurgeMultiplier({ rain: false, peak: false, night: false }, cfg);
  assert.strictEqual(noSurge, 1.0);

  const rainOnly = calculateSurgeMultiplier({ rain: true, peak: false, night: false }, cfg);
  assert.strictEqual(rainOnly, 1.25);

  const allSurge = calculateSurgeMultiplier({ rain: true, peak: true, night: true }, cfg);
  // 1.25 * 1.20 * 1.15 = 1.725 <= 1.90
  assert(allSurge <= 1.90, 'All surge must be <= 1.90');

  // Extreme artificial surge test
  const extremeCfg = { rainSurge: 1.5, peakSurge: 1.5, nightSurge: 1.5 };
  const capped = calculateSurgeMultiplier({ rain: true, peak: true, night: true }, extremeCfg);
  assert.strictEqual(capped, 1.90);
});

// 3. Vehicle constraints (Rickshaw limit <= 7 km)
runTest('Rickshaw distance limit boundary check', () => {
  const rUnder = calculateFareEngine('rickshaw', 5.0, 30, { rain: false, peak: false, night: false });
  assert.strictEqual(rUnder.isDistanceAllowed, true);

  const rOver = calculateFareEngine('rickshaw', 8.5, 55, { rain: false, peak: false, night: false });
  assert.strictEqual(rOver.isDistanceAllowed, false);
});

// 4. Bengali numeral conversion both ways
runTest('Bengali numeral bidirectional conversion', () => {
  assert.strictEqual(toBengaliNumber(12345), '১২৩৪৫');
  assert.strictEqual(toBengaliNumber('40.5'), '৪০.৫');
  assert.strictEqual(parseBengaliNumber('১২৩৪৫'), 12345);
  assert.strictEqual(parseBengaliNumber('৪০.৫'), 40.5);
});

// 5. DMTCL Official Metro Fare Matrix
runTest('DMTCL MRT-6 Official Fares', () => {
  // Uttara North to Motijheel is ৳100
  const endToEnd = getStationToStationMetroFare('mrt_uttara_north', 'mrt_motijheel');
  assert.strictEqual(endToEnd, 100);

  // Uttara North to Uttara Center (1 station) is minimum ৳20
  const shortTrip = getStationToStationMetroFare('mrt_uttara_north', 'mrt_uttara_center');
  assert.strictEqual(shortTrip, 20);

  // Farmgate to Motijheel (~6 km, 5 stations) is ~৳30-35
  const fgToMotijheel = getStationToStationMetroFare('mrt_farmgate', 'mrt_motijheel');
  assert(fgToMotijheel >= 25 && fgToMotijheel <= 40, `Farmgate to Motijheel was ${fgToMotijheel}`);
});

// 6. Fuzzy place matching with misspellings and Bengali digits
runTest('Fuzzy place matching with aliases & Bengali digits', () => {
  const landmarks = [
    { id: 'farmgate', nameBn: 'ফার্মগেট', nameEn: 'Farmgate', aliases: ['ফার্মগেইট', 'farm gate'] },
    { id: 'gulshan1', nameBn: 'গুলশান ১', nameEn: 'Gulshan 1', aliases: ['গুলশান-১', 'gulshan-1', 'gulshan 1'] },
    { id: 'mirpur10', nameBn: 'মিরপুর ১০', nameEn: 'Mirpur 10', aliases: ['মিরপুর-১০', 'mirpur 10'] },
    { id: 'motijheel', nameBn: 'মতিঝিল', nameEn: 'Motijheel', aliases: ['মতিঝিল বা/এ', 'motijheel c/a'] },
    { id: 'uttara3', nameBn: 'উত্তরা সেক্টর ৩', nameEn: 'Uttara Sector 3', aliases: ['উত্তরা ৩', 'uttara 3'] },
    { id: 'dhanmondi27', nameBn: 'ধানমন্ডি ২৭', nameEn: 'Dhanmondi 27', aliases: ['ধানমন্ডি-২৭', 'dhanmondi 27'] }
  ];

  assert.strictEqual(fuzzyMatchPlace('ফার্মগেইট', landmarks)[0]?.id, 'farmgate');
  assert.strictEqual(fuzzyMatchPlace('gulshan 1', landmarks)[0]?.id, 'gulshan1');
  assert.strictEqual(fuzzyMatchPlace('গুলশান 1', landmarks)[0]?.id, 'gulshan1'); // mixed digit
  assert.strictEqual(fuzzyMatchPlace('মিরপুর 10', landmarks)[0]?.id, 'mirpur10');
  assert.strictEqual(fuzzyMatchPlace('মতিঝিল', landmarks)[0]?.id, 'motijheel');
  assert.strictEqual(fuzzyMatchPlace('ধানমন্ডি', landmarks)[0]?.id, 'dhanmondi27');
});

// 7. Multimodal route calculation near corridor
runTest('Multimodal route for Farmgate to Dhaka University', () => {
  const start = { lat: 23.7561, lng: 90.3872, name: 'Farmgate' };
  const end = { lat: 23.7310, lng: 90.3970, name: 'Dhaka University' };
  const mm = findMultimodalRoute(start, end);
  assert(mm !== null, 'Multimodal route should exist along MRT-6 corridor');
  assert(mm.metroFare > 0, 'Metro fare must be > 0');
  assert.strictEqual(mm.startStation.id, 'mrt_farmgate');
  assert.strictEqual(mm.endStation.id, 'mrt_dhaka_univ');
});

console.log(`\nT1 Results: ${passed}/${total} tests passed. Failures: ${findings.length}`);
if (findings.length > 0) process.exit(1);
