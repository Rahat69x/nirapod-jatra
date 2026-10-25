const fareEngine = require('../fare_engine.js');

const DHAKA_LANDMARKS = [
  { id: 'farmgate', nameBn: 'ফার্মগেট', nameEn: 'Farmgate', coords: [23.7561, 90.3872] },
  { id: 'gulshan1', nameBn: 'গুলশান ১', nameEn: 'Gulshan 1', coords: [23.7785, 90.4180] },
  { id: 'mirpur10', nameBn: 'মিরপুর ১০', nameEn: 'Mirpur 10', coords: [23.8069, 90.3686] },
  { id: 'motijheel', nameBn: 'মতিঝিল', nameEn: 'Motijheel', coords: [23.7260, 90.4180] }
];

console.log('Testing Farmgate -> Gulshan 1 Core Demo Flow:');
const start = DHAKA_LANDMARKS[0]; // Farmgate
const end = DHAKA_LANDMARKS[1];   // Gulshan 1
const distanceKm = 5.2; // OSRM / Haversine road distance
const conditions = { rain: false, peak: false, night: false };

// 1. Calculate CNG
const cng = fareEngine.calculateFareEngine('cng', distanceKm, 22, conditions);
console.log('CNG:', cng.minFare, '-', cng.maxFare, 'Official Meter:', cng.officialMeterFare);
console.log('  Breakdown: Base=' + cng.baseFare + ', Dist=' + cng.distanceCost + ', Cong=' + cng.congestionCost + ', Sub=' + cng.subtotalBeforeSurge);

// 2. Calculate Rickshaw
const rickshaw = fareEngine.calculateFareEngine('rickshaw', distanceKm, 35, conditions);
console.log('Rickshaw:', rickshaw.minFare, '-', rickshaw.maxFare, 'Allowed:', rickshaw.isDistanceAllowed);

// 3. Calculate Battery
const battery = fareEngine.calculateFareEngine('battery', distanceKm, 24, conditions);
console.log('Battery:', battery.minFare, '-', battery.maxFare, 'Allowed:', battery.isDistanceAllowed);

// 4. Calculate Multimodal (Rickshaw + MRT-6)
const multimodal = fareEngine.findMultimodalRoute(start, end);
console.log('Multimodal (MRT-6):', multimodal ? `${multimodal.totalMin} - ${multimodal.totalMax} (Start: ${multimodal.startStation.nameBn}, End: ${multimodal.endStation.nameBn})` : 'Not available');

// 5. Options Array and Sorting
const options = [
  { id: 'cng', nameBn: 'সিএনজি অটো', minFare: cng.minFare, maxFare: cng.maxFare, minutes: 22, transfers: 0, reason: 'দ্রুত ও সরাসরি যাত্রা', allowed: true, data: cng },
  { id: 'rickshaw', nameBn: 'সাধারণ রিকশা', minFare: rickshaw.minFare, maxFare: rickshaw.maxFare, minutes: 35, transfers: 0, reason: 'খোলা ও মাঝারি দূরত্বের যাত্রা', allowed: rickshaw.isDistanceAllowed, data: rickshaw },
  { id: 'battery', nameBn: 'ব্যাটারি ইজিবাইক', minFare: battery.minFare, maxFare: battery.maxFare, minutes: 24, transfers: 0, reason: 'সাশ্রয়ী ফিডার রুট', allowed: battery.isDistanceAllowed, data: battery }
];

if (multimodal) {
  options.push({
    id: 'multimodal',
    nameBn: 'রিকশা + এমআরটি-৬ মেট্রোরেল',
    minFare: multimodal.totalMin,
    maxFare: multimodal.totalMax,
    minutes: multimodal.totalMinutes,
    transfers: 2,
    reason: 'যানজটহীন সময় সাশ্রয়ী সমন্বিত যাত্রা',
    allowed: true,
    data: multimodal
  });
}

const allowedOptions = options.filter(o => o.allowed);
allowedOptions.sort((a, b) => a.minFare - b.minFare);

console.log('\nSorted options by cheapest:');
allowedOptions.forEach((o, i) => {
  console.log(`${i+1}. ${o.nameBn}: ৳${o.minFare}–${o.maxFare} (~${o.minutes} min) ${i === 0 ? '[সবচেয়ে সাশ্রয়ী]' : ''}`);
});

console.log('\nCheapest option:', allowedOptions[0].nameBn);
console.log('Test completed successfully!');
