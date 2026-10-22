const fs = require('fs');
const assert = require('assert');

console.log('🧪 Starting End-to-End Core Flow Simulation Test for Nirapod Jatra...\n');

// 1. Read index.html and extract constants and functions
const html = fs.readFileSync('index.html', 'utf8');

// Extract script
const lastScriptOpen = html.lastIndexOf('<script>');
const lastScriptClose = html.lastIndexOf('</script>');
const jsCode = html.slice(lastScriptOpen + 8, lastScriptClose);

// Build mock browser environment
const domStore = {};
function createMockElement(id) {
  return {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    className: '',
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); },
      toggle(c) { if (this.classes.has(c)) { this.classes.delete(c); return false; } else { this.classes.add(c); return true; } }
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    scrollIntoView() {},
    querySelector() { return createMockElement('child'); },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
}

const mockDoc = {
  getElementById(id) {
    if (!domStore[id]) domStore[id] = createMockElement(id);
    return domStore[id];
  },
  querySelectorAll() { return []; },
  addEventListener() {},
  documentElement: { lang: 'bn' }
};

const mockWindow = {
  location: {
    origin: 'http://localhost:3000',
    pathname: '/',
    hash: ''
  },
  history: {
    replaceState(state, title, url) {
      if (url.startsWith('#')) mockWindow.location.hash = url;
    }
  },
  addEventListener() {},
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  }
};

const mockLeaflet = {
  map() {
    return {
      setView() { return this; },
      on() { return this; },
      removeLayer() {},
      fitBounds() {},
      invalidateSize() {}
    };
  },
  tileLayer() {
    return { addTo() { return this; } };
  },
  marker() {
    return { addTo() { return this; }, bindPopup() { return this; } };
  },
  divIcon() { return {}; },
  polyline() {
    return {
      addTo() { return this; },
      getBounds() { return {}; }
    };
  }
};

// Execute script in mock context
const sandbox = {
  document: mockDoc,
  window: mockWindow,
  localStorage: mockWindow.localStorage,
  navigator: { language: 'bn', clipboard: { writeText: async () => {} } },
  L: mockLeaflet,
  console: { log: () => {}, warn: () => {}, error: () => {} },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  fetch: async () => ({ ok: false }),
  AbortController: class { abort() {} get signal() { return {}; } }
};

const fn = new Function(...Object.keys(sandbox), jsCode + '\nreturn { state, DHAKA_LANDMARKS, searchLandmarks, normalizeSearchText, evaluateAllJourneyOptions, calculateFareEngine, calculateMultimodalMRT6, renderOptionsComparison, renderJourneySteps, buildTripPlanMessage, toBengaliNumber, formatCurrency, applyPresetRoute, selectOptionCard, initUrlHashRoute, updateUrlHash };');
const exported = fn(...Object.values(sandbox));

const {
  state,
  DHAKA_LANDMARKS,
  searchLandmarks,
  normalizeSearchText,
  evaluateAllJourneyOptions,
  calculateFareEngine,
  calculateMultimodalMRT6,
  renderOptionsComparison,
  renderJourneySteps,
  buildTripPlanMessage,
  toBengaliNumber,
  formatCurrency,
  applyPresetRoute,
  selectOptionCard,
  initUrlHashRoute,
  updateUrlHash
} = exported;

console.log('✅ PASS: JavaScript successfully executed in mock DOM environment.');

// STEP 1: TEST BANGLA SEARCH AND FUZZY/ALIAS MATCHING
console.log('\n--- Step 1: Bangla Search & Alias Matching ---');
const testQueries = [
  { q: 'ফার্মগেট', expectId: 'farmgate' },
  { q: 'ফার্মগেইট', expectId: 'farmgate' },
  { q: 'গুলশান ১', expectId: 'gulshan1' },
  { q: 'গুলশান 1', expectId: 'gulshan1' },
  { q: 'মিরপুর ১০', expectId: 'mirpur10' },
  { q: 'মতিঝিল', expectId: 'motijheel' },
  { q: 'ঢাবি', expectId: 'mrt_dhaka_univ' },
  { q: 'টিএসসি', expectId: 'mrt_dhaka_univ' },
  { q: 'ধানমন্ডি ২৭', expectId: 'dhanmondi27' }
];

testQueries.forEach(t => {
  const matches = searchLandmarks(t.q);
  assert(matches.length > 0, `Search failed for: ${t.q}`);
  assert(matches.some(m => m.id === t.expectId), `Expected to find ${t.expectId} for query "${t.q}"`);
  console.log(`  ✅ Match: "${t.q}" -> ${matches[0].nameBn} (${matches[0].id})`);
});

// Empty query and non-match handling
assert.strictEqual(searchLandmarks('').length, 0, 'Empty search should yield 0 results');
assert.strictEqual(searchLandmarks('সিলেট স্টেশন').length, 0, 'Non-Dhaka search should yield 0 results');
console.log('  ✅ No match gracefully returns empty array without silent guessing.');

// STEP 2 & 3: COMPARE OPTIONS AND CHOOSE LOWEST ESTIMATED COST
console.log('\n--- Steps 2 & 3: Multi-Option Comparison & Lowest Cost Detection ---');
const sampleTrips = [
  {
    name: '১. ফার্মগেট ➔ গুলশান ১',
    start: DHAKA_LANDMARKS.find(l => l.id === 'farmgate'),
    end: DHAKA_LANDMARKS.find(l => l.id === 'gulshan1'),
    distanceKm: 5.2,
    durationMins: 22,
    expectedCheapest: 'battery'
  },
  {
    name: '২. মিরপুর ১০ ➔ মতিঝিল',
    start: DHAKA_LANDMARKS.find(l => l.id === 'mirpur10'),
    end: DHAKA_LANDMARKS.find(l => l.id === 'motijheel'),
    distanceKm: 13.8,
    durationMins: 33,
    expectedCheapest: 'multimodal'
  },
  {
    name: '৩. ধানমন্ডি ২৭ ➔ নিউ মার্কেট',
    start: DHAKA_LANDMARKS.find(l => l.id === 'dhanmondi27'),
    end: DHAKA_LANDMARKS.find(l => l.id === 'newmarket'),
    distanceKm: 2.8,
    durationMins: 15,
    expectedCheapest: 'battery'
  },
  {
    name: '৪. ফার্মগেট ➔ ঢাকা বিশ্ববিদ্যালয় টিএসসি',
    start: DHAKA_LANDMARKS.find(l => l.id === 'farmgate'),
    end: DHAKA_LANDMARKS.find(l => l.id === 'mrt_dhaka_univ'),
    distanceKm: 3.8,
    durationMins: 17,
    expectedCheapest: 'multimodal'
  },
  {
    name: '৫. উত্তরা সেক্টর ৩ ➔ বিমানবন্দর',
    start: DHAKA_LANDMARKS.find(l => l.id === 'uttara3'),
    end: DHAKA_LANDMARKS.find(l => l.id === 'airport'),
    distanceKm: 3.2,
    durationMins: 14,
    expectedCheapest: 'battery'
  }
];

sampleTrips.forEach(trip => {
  const evaluated = evaluateAllJourneyOptions(trip.start, trip.end, trip.distanceKm, trip.durationMins, { rain: false, peak: false, night: false });
  assert(evaluated.eligible.length > 0, `No eligible options for ${trip.name}`);
  const cheapest = evaluated.cheapestOption;
  assert(cheapest, `Cheapest option missing for ${trip.name}`);
  assert.strictEqual(cheapest.id, trip.expectedCheapest, `Cheapest mismatch for ${trip.name}: expected ${trip.expectedCheapest}, got ${cheapest.id}`);
  assert.strictEqual(cheapest.isCheapest, true, 'isCheapest flag must be true');

  console.log(`  ✅ ${trip.name}:`);
  console.log(`     * দূরত্ব: ${trip.distanceKm} কিমি | সাশ্রয়ী: ${cheapest.nameBn} (৳${cheapest.minFare}–${cheapest.maxFare}, ~${cheapest.travelMinutes} মিনিট)`);
  if (cheapest.timeTradeoffMins) {
    console.log(`     * ⏱️ সময় ট্রেড-অফ সূচক: +${cheapest.timeTradeoffMins} মিনিট বেশি লাগতে পারে`);
  }
});

// Distance constraints validation
console.log('\n--- Vehicle Distance Limits Validation ---');
const longTrip = evaluateAllJourneyOptions(
  DHAKA_LANDMARKS.find(l => l.id === 'mirpur10'),
  DHAKA_LANDMARKS.find(l => l.id === 'motijheel'),
  13.8, 33, { rain: false, peak: false, night: false }
);
assert(!longTrip.eligible.some(o => o.id === 'rickshaw'), 'Rickshaw should NOT be eligible for 13.8km');
assert(!longTrip.eligible.some(o => o.id === 'battery'), 'Battery Easybike should NOT be eligible for 13.8km');
assert(longTrip.ineligible.some(o => o.id === 'rickshaw'), 'Rickshaw must be in ineligible list with explanation');
assert(longTrip.ineligible.some(o => o.id === 'battery'), 'Battery must be in ineligible list with explanation');
console.log('  ✅ Rickshaw (>7km) and Battery (>10km) correctly excluded on 13.8km route.');

// STEP 4: JOURNEY STEPS GENERATION
console.log('\n--- Step 4: Step-by-Step Bangla Journey Plan ---');
const metroTrip = sampleTrips[1];
const metroEval = evaluateAllJourneyOptions(metroTrip.start, metroTrip.end, metroTrip.distanceKm, metroTrip.durationMins, { rain: false, peak: false, night: false });
const chosenMetro = metroEval.cheapestOption;
state.startPoint = metroTrip.start;
state.endPoint = metroTrip.end;
state.availableOptions = metroEval;
state.selectedOptionId = 'multimodal';
state.activeRouteData = { distanceKm: metroTrip.distanceKm, durationMinutes: metroTrip.durationMins };
renderJourneySteps(chosenMetro, state.activeRouteData);

const stepsHtml = mockDoc.getElementById('journeyStepsList').innerHTML;
assert(stepsHtml.includes('>১<'), 'Step 1 badge missing in journey steps');
assert(stepsHtml.includes('>২<'), 'Step 2 badge missing in journey steps');
assert(stepsHtml.includes('>৩<'), 'Step 3 badge missing in journey steps');
assert(stepsHtml.includes('মেট্রোরেলে'), 'Metro step missing in journey steps');
assert(stepsHtml.includes('মোট আনুমানিক হিসাব'), 'Total summary footer missing in journey steps');
console.log('  ✅ Numbered 1-2-3 journey steps with modes, stations, times, and costs generated.');

// STEP 5: SHARE THE PLAN (WEB SHARE, WHATSAPP, SMS, URL HASH)
console.log('\n--- Step 5: Sharing Plan & URL Hash Encoding ---');
const shareMsg = buildTripPlanMessage(chosenMetro, state.activeRouteData);
assert(shareMsg.includes('নিরাপদ যাত্রা'), 'Brand title missing in share message');
assert(shareMsg.includes('৯৯৯'), '999 helpline missing in share message');
assert(shareMsg.includes('আনুমানিক'), 'আনুমানিক estimate disclaimer missing in share message');
assert(shareMsg.includes('#from='), 'Map link with URL hash missing in share message');
console.log('  ✅ Generated Bangla Share Message:\n');
console.log(shareMsg.split('\n').map(l => '     | ' + l).join('\n'));

// Test URL Hash serialization & restoration
updateUrlHash();
assert(mockWindow.location.hash.includes('from=mirpur10'), 'URL hash missing from parameter');
assert(mockWindow.location.hash.includes('to=motijheel'), 'URL hash missing to parameter');
assert(mockWindow.location.hash.includes('mode=multimodal'), 'URL hash missing mode parameter');
console.log('\n  ✅ Plan successfully encoded into URL Hash:', mockWindow.location.hash);

// Simulate opening the link in another session
mockWindow.location.hash = '#from=farmgate&to=gulshan1&mode=battery';
const restored = initUrlHashRoute();
assert.strictEqual(restored, true, 'initUrlHashRoute failed to restore route from URL hash');
assert.strictEqual(state.startPoint.landmarkId, 'farmgate', 'Start point not restored');
assert.strictEqual(state.endPoint.landmarkId, 'gulshan1', 'End point not restored');
console.log('  ✅ Successfully restored plan from URL hash: Farmgate ➔ Gulshan 1');

console.log('\n🎉 ALL 5 CORE FLOW STEPS AND 5 DHAKA SAMPLE COMMUTES VERIFIED SUCCESSFULLY!\n');
