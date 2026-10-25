const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Weather timeout and error message update
const oldWeatherRegex = /async function fetchLiveDhakaWeather\(\) \{[\s\S]*?console\.warn\('Weather auto-detect error:', e\);[\s\S]*?text\.innerHTML = `<i class="fa-solid fa-cloud-sun text-amber-500 mr-1"><\/i><span>ঢাকা \(২৮°C\)<\/span>`;[\s\S]*?\}[\s\S]*?\}/;

const newWeather = `async function fetchLiveDhakaWeather() {
      const badge = document.getElementById('liveWeatherBadge');
      const text = document.getElementById('weatherStatusText');
      const lang = state.language;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=23.8103&longitude=90.4125&current=temperature_2m,precipitation,weather_code', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        const current = data.current;
        const temp = Math.round(current.temperature_2m);
        const rain = current.precipitation;
        const code = current.weather_code;

        const isRaining = rain > 0.1 || (code >= 51 && code <= 99);
        state.liveWeather = { temp, isRaining, rain, code };

        const tempStr = lang === 'bn' ? \`\${toBengaliNumber(temp)}°C\` : \`\${temp}°C\`;

        if (badge) {
          badge.classList.remove('hidden');
          if (isRaining) {
            badge.innerHTML = \`<i class="fa-solid fa-cloud-showers-heavy text-amber-300 mr-1 animate-pulse"></i><span>\${lang === 'bn' ? 'বৃষ্টি (' + tempStr + ')' : 'Rain (' + tempStr + ')'}</span>\`;
            badge.className = 'text-[10px] bg-amber-400/25 text-amber-200 px-2 py-0.5 rounded-full border border-amber-300/40 flex items-center shrink-0 font-semibold';
          } else {
            badge.innerHTML = \`<i class="fa-solid fa-cloud-sun text-emerald-300 mr-1"></i><span>\${lang === 'bn' ? 'ঢাকা ' + tempStr : 'Dhaka ' + tempStr}</span>\`;
            badge.className = 'text-[10px] bg-white/15 text-emerald-100 px-2 py-0.5 rounded-full border border-white/20 flex items-center shrink-0 font-medium';
          }
        }

        if (text) {
          text.innerHTML = isRaining
            ? \`<i class="fa-solid fa-cloud-showers-heavy text-blue-500 mr-1"></i><span class="font-bold text-blue-600 dark:text-blue-400">\${lang === 'bn' ? 'বৃষ্টি (' + tempStr + ')' : 'Raining (' + tempStr + ')'}</span>\`
            : \`<i class="fa-solid fa-cloud-sun text-amber-500 mr-1"></i><span>\${lang === 'bn' ? 'পরিষ্কার (' + tempStr + ')' : 'Clear (' + tempStr + ')'}</span>\`;
        }

        if (isRaining && !state.conditions.rain) {
          toggleCondition('rain');
          showToast(lang === 'bn' ? \`ঢাকায় বৃষ্টি সনাক্ত হয়েছে (\${tempStr}) — রেইন সার্জ চালু করা হলো\` : \`Rain detected in Dhaka (\${tempStr}) — rain surge auto-applied\`);
        }
      } catch (e) {
        console.warn('Weather auto-detect error or timeout:', e.message);
        if (text) {
          text.innerHTML = \`<i class="fa-solid fa-cloud-slash text-slate-400 mr-1"></i><span class="text-slate-500">\${lang === 'bn' ? 'আবহাওয়া পাওয়া যায়নি' : 'Weather unavailable'}</span>\`;
        }
        if (badge) {
          badge.classList.remove('hidden');
          badge.className = 'text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 flex items-center shrink-0 font-medium';
          badge.innerHTML = \`<span>\${lang === 'bn' ? 'আবহাওয়া পাওয়া যায়নি' : 'Weather offline'}</span>\`;
        }
      }
    }`;

if (oldWeatherRegex.test(html)) {
  html = html.replace(oldWeatherRegex, newWeather);
  console.log('Replaced fetchLiveDhakaWeather with timeout and honest fallback');
} else {
  console.error('Could not find oldWeatherRegex');
}

// 2. Add typed search inputs with live suggestions in Route Selection Card
const oldInputsGroupRegex = /<!-- Inputs Group with Swap Button -->[\s\S]*?<!-- Quick Tap Route Pills/;

const newInputsGroup = `<!-- Inputs Group with Swap Button & Live Fuzzy Search -->
          <div class="relative space-y-2">
            <!-- Pickup Point Input & Search -->
            <div class="relative">
              <div class="relative flex items-center mb-1">
                <span class="absolute left-3 text-emerald-600 text-sm">
                  <i class="fa-solid fa-magnifying-glass"></i>
                </span>
                <input type="text" id="startSearchInput" oninput="handlePlaceInput('start', this.value)" onfocus="handlePlaceInput('start', this.value)" placeholder="যাত্রা শুরু টাইপ করুন (যেমন: ফার্মগেট, মিরপুর ১০)..." data-i18n-placeholder="phStartSearch" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 transition">
              </div>
              <div id="startSuggestions" class="hidden absolute left-0 right-0 top-[38px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto"></div>

              <!-- Dropdown select fallback -->
              <div class="relative flex items-center">
                <span class="absolute left-3 text-emerald-600 text-sm">
                  <i class="fa-solid fa-location-dot"></i>
                </span>
                <select id="startSelect" aria-label="যাত্রা শুরু স্থান" onchange="onLandmarkSelect('start', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 focus:bg-white transition cursor-pointer">
                  <option value="" disabled selected data-i18n="pickupPlaceholder">বা তালিকা থেকে নির্বাচন করুন...</option>
                </select>
              </div>
            </div>
            <p id="startSelectError" class="hidden text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center space-x-1 pl-1" role="alert" aria-live="assertive">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
              <span id="startSelectErrorText" data-i18n="startPointRequired">অনুগ্রহ করে যাত্রা শুরুর স্থান নির্বাচন করুন</span>
            </p>

            <!-- Floating Swap Button -->
            <div class="flex justify-end pr-2 pt-0.5">
              <button type="button" id="swapRouteBtn" onclick="swapLocations()" aria-label="Swap pickup and destination" class="h-6 px-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-500 text-[10px] font-bold flex items-center space-x-1 transition active:scale-95">
                <i class="fa-solid fa-arrow-down-up-across-line text-[10px]"></i>
                <span data-i18n="btnSwapRoute">স্থান অদলবদল (Swap)</span>
              </button>
            </div>

            <!-- Destination Point Input & Search -->
            <div class="relative">
              <div class="relative flex items-center mb-1">
                <span class="absolute left-3 text-red-500 text-sm">
                  <i class="fa-solid fa-magnifying-glass"></i>
                </span>
                <input type="text" id="endSearchInput" oninput="handlePlaceInput('end', this.value)" onfocus="handlePlaceInput('end', this.value)" placeholder="গন্তব্য টাইপ করুন (যেমন: গুলশান ১, মতিঝিল)..." data-i18n-placeholder="phEndSearch" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-red-500 transition">
              </div>
              <div id="endSuggestions" class="hidden absolute left-0 right-0 top-[38px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto"></div>

              <!-- Dropdown select fallback -->
              <div class="relative flex items-center">
                <span class="absolute left-3 text-red-500 text-sm">
                  <i class="fa-solid fa-flag-checkered"></i>
                </span>
                <select id="endSelect" aria-label="গন্তব্যের স্থান" onchange="onLandmarkSelect('end', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 focus:bg-white transition cursor-pointer">
                  <option value="" disabled selected data-i18n="destPlaceholder">বা তালিকা থেকে নির্বাচন করুন...</option>
                </select>
              </div>
            </div>
            <p id="endSelectError" class="hidden text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center space-x-1 pl-1" role="alert" aria-live="assertive">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
              <span id="endSelectErrorText" data-i18n="destPointRequired">অনুগ্রহ করে গন্তব্যের স্থান নির্বাচন করুন</span>
            </p>
          </div>

          <!-- Quick Tap Route Pills`;

if (oldInputsGroupRegex.test(html)) {
  html = html.replace(oldInputsGroupRegex, newInputsGroup);
  console.log('Replaced route input group with typed fuzzy search and dropdown fallbacks');
} else {
  console.error('Could not find oldInputsGroupRegex');
}

// 3. Update validateRouteInputs to check for < 300m trip and boundary conditions
const oldValidateRegex = /const straightDistKm = calculateHaversine\(state\.startPoint\.lat[\s\S]*?btn\.disabled = false;\s*statusBadge\.textContent = lang === 'bn' \? 'রুট প্রস্তুত' : 'Route Ready';\s*return true;\s*\}/;

const newValidate = `const straightDistKm = calculateHaversine(state.startPoint.lat, state.startPoint.lng, state.endPoint.lat, state.endPoint.lng) / 1.38;
      if (straightDistKm < 0.05) {
        noticeBox.className = 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 rounded-xl p-2.5 text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-2';
        noticeBox.classList.remove('hidden');
        noticeText.textContent = translations[lang].samePointError;
        btn.disabled = true;
        return false;
      }

      if (straightDistKm < 0.30) {
        noticeBox.className = 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800/60 rounded-xl p-2.5 text-xs text-blue-800 dark:text-blue-300 flex items-center space-x-2';
        noticeBox.classList.remove('hidden');
        noticeText.textContent = lang === 'bn'
          ? 'দূরত্ব অত্যন্ত কম (৩০০ মিটারের কম) — হেঁটে যাওয়াই সাশ্রয়ী ও সুবিধাজনক।'
          : 'Trip is under 300 meters — walking is faster, free and recommended.';
      } else if (straightDistKm > 40) {
        noticeBox.className = 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center space-x-2';
        noticeBox.classList.remove('hidden');
        noticeText.textContent = translations[lang].tooLongError;
        btn.disabled = true;
        return false;
      }

      btn.disabled = false;
      statusBadge.textContent = lang === 'bn' ? 'রুট প্রস্তুত' : 'Route Ready';
      return true;
    }`;

if (oldValidateRegex.test(html)) {
  html = html.replace(oldValidateRegex, newValidate);
  console.log('Updated validateRouteInputs with 300m boundary notice');
} else {
  console.error('Could not find oldValidateRegex');
}

// 4. Implement handlePlaceInput, selectPlaceFromSuggestion, and close suggestions on click outside
const fuzzySearchFunctions = `
    function handlePlaceInput(type, query) {
      const suggestionsBox = document.getElementById(type + 'Suggestions');
      const lang = state.language;

      if (!query || query.trim().length === 0) {
        if (suggestionsBox) {
          suggestionsBox.classList.add('hidden');
          suggestionsBox.innerHTML = '';
        }
        return;
      }

      const engine = (typeof FareEngine !== 'undefined') ? FareEngine : {
        fuzzyMatchPlace: typeof fuzzyMatchPlace === 'function' ? fuzzyMatchPlace : () => []
      };
      const matches = engine.fuzzyMatchPlace(query.trim(), DHAKA_LANDMARKS);

      if (!suggestionsBox) return;
      suggestionsBox.classList.remove('hidden');

      if (matches.length === 0) {
        suggestionsBox.innerHTML = \`
          <div class="px-3 py-2 text-xs text-rose-600 dark:text-rose-400 font-semibold text-center bg-rose-50/50 dark:bg-rose-950/30">
            <i class="fa-solid fa-circle-exclamation mr-1"></i>
            <span>\${lang === 'bn' ? 'কোনো স্থান মেলেনি — কাছাকাছি স্থান বা ড্রপডাউন নির্বাচন করুন' : 'No matching place found — select nearby place or use dropdown'}</span>
          </div>
        \`;
        return;
      }

      suggestionsBox.innerHTML = matches.slice(0, 6).map(l => {
        const name = lang === 'bn' ? l.nameBn : l.nameEn;
        const sub = lang === 'bn' ? l.nameEn : l.nameBn;
        const catIcon = l.category === 'metro' ? 'fa-train-subway text-purple-600' : (l.category === 'hub' ? 'fa-building text-blue-600' : 'fa-location-dot text-emerald-600');
        return \`
          <div onclick="selectPlaceFromSuggestion('\${type}', '\${l.id}')" class="px-3 py-2.5 text-xs hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-none flex items-center justify-between transition">
            <div class="flex items-center space-x-2">
              <i class="fa-solid \${catIcon} text-xs"></i>
              <span class="font-bold text-slate-800 dark:text-slate-100">\${name}</span>
              <span class="text-[10px] text-slate-400">(\${sub})</span>
            </div>
            <span class="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">\${l.category}</span>
          </div>
        \`;
      }).join('');
    }

    function selectPlaceFromSuggestion(type, landmarkId) {
      const landmark = DHAKA_LANDMARKS.find(l => l.id === landmarkId);
      if (!landmark) return;

      const input = document.getElementById(type + 'SearchInput');
      const suggestionsBox = document.getElementById(type + 'Suggestions');
      if (input) input.value = state.language === 'bn' ? landmark.nameBn : landmark.nameEn;
      if (suggestionsBox) suggestionsBox.classList.add('hidden');

      onLandmarkSelect(type, landmarkId);
    }

    document.addEventListener('click', (e) => {
      const startBox = document.getElementById('startSuggestions');
      const startInput = document.getElementById('startSearchInput');
      const endBox = document.getElementById('endSuggestions');
      const endInput = document.getElementById('endSearchInput');

      if (startBox && !startBox.contains(e.target) && e.target !== startInput) {
        startBox.classList.add('hidden');
      }
      if (endBox && !endBox.contains(e.target) && e.target !== endInput) {
        endBox.classList.add('hidden');
      }
    });
`;

if (!html.includes('function handlePlaceInput')) {
  html = html.replace('function onLandmarkSelect', fuzzySearchFunctions + '\n    function onLandmarkSelect');
  console.log('Added handlePlaceInput and selectPlaceFromSuggestion functions');
}

// Update onLandmarkSelect to also update the search input text
html = html.replace(
  `      if (type === 'start') {
        state.startPoint = pointData;
      } else {
        state.endPoint = pointData;
      }`,
  `      if (type === 'start') {
        state.startPoint = pointData;
        const sInput = document.getElementById('startSearchInput');
        if (sInput) sInput.value = pointData.name;
      } else {
        state.endPoint = pointData;
        const eInput = document.getElementById('endSearchInput');
        if (eInput) eInput.value = pointData.name;
      }`
);

// 5. Ledger safety: escape user text, length & numeric validation, 30-day auto expiry, and Clear All Data button
const escapeHelperHtml = `
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function clearAllUserData() {
      const confirmMsg = state.language === 'bn'
        ? 'আপনি কি নিশ্চিত যে আপনার সমস্ত সংরক্ষিত লোকাল ডেটা (ভাড়ার হিসেব, কন্টাক্ট, প্রেফারেন্স) মুছে ফেলতে চান?'
        : 'Are you sure you want to delete all locally stored data on this device?';
      if (!confirm(confirmMsg)) return;

      localStorage.removeItem(STORAGE_KEY_LANG);
      localStorage.removeItem(STORAGE_KEY_THEME);
      localStorage.removeItem(STORAGE_KEY_COMMUNITY);
      localStorage.removeItem(STORAGE_KEY_CONTACTS);
      localStorage.removeItem('nj_community_trips');
      localStorage.removeItem('nj_language');

      state.communityTrips = [...SEED_COMMUNITY_TRIPS];
      state.sosContacts = [...DEFAULT_SOS_CONTACTS];
      state.language = 'bn';
      state.theme = 'light';

      applyTheme('light');
      applyTranslations('bn');
      renderCommunityFeed();
      renderSosContacts();

      showToast(state.language === 'bn' ? 'আপনার সমস্ত লোকাল ডেটা সফলভাবে মুছে ফেলা হয়েছে' : 'All local data has been cleared', 'success');
    }
`;

if (!html.includes('function escapeHtml')) {
  html = html.replace('function appendCommunityTrip', escapeHelperHtml + '\n    function appendCommunityTrip');
  console.log('Added escapeHtml and clearAllUserData functions');
}

// Update handleCommunitySubmit to enforce field limits and numeric ranges
const oldHandleCommunityRegex = /function handleCommunitySubmit\(e\) \{[\s\S]*?appendCommunityTrip\(newTrip\);/;

const newHandleCommunity = `function handleCommunitySubmit(e) {
      e.preventDefault();

      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn && submitBtn.disabled) return;

      const vehicle = document.getElementById('comVehicle').value;
      const distanceKm = parseFloat(document.getElementById('comDistance').value);
      const start = document.getElementById('comStart').value.trim();
      const end = document.getElementById('comEnd').value.trim();
      const farePaid = parseFloat(document.getElementById('comFare').value);
      const note = document.getElementById('comNote').value.trim();
      const lang = state.language;

      if (!vehicle || isNaN(distanceKm) || isNaN(farePaid) || !start || !end) {
        showToast(lang === 'bn' ? 'সঠিক তথ্য প্রদান করুন' : 'Please provide valid trip information', 'error');
        return;
      }

      // Enforce strict numeric ranges & character limits
      if (distanceKm < 0.1 || distanceKm > 60) {
        showToast(lang === 'bn' ? 'দূরত্ব ০.১ থেকে ৬০ কিমি-এর মধ্যে হতে হবে' : 'Distance must be between 0.1 and 60 km', 'error');
        return;
      }

      if (farePaid < 1 || farePaid > 5000) {
        showToast(lang === 'bn' ? 'ভাড়া ১ থেকে ৫,০০০ টাকার মধ্যে হতে হবে' : 'Fare must be between 1 and 5000 Taka', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        setTimeout(() => { submitBtn.disabled = false; }, 1000);
      }

      const newTrip = {
        id: Date.now(),
        vehicle,
        distanceKm: parseFloat(distanceKm.toFixed(1)),
        start: start.substring(0, 60),
        end: end.substring(0, 60),
        farePaid: Math.round(farePaid),
        note: note ? note.substring(0, 200) : '',
        timestamp: Date.now()
      };

      appendCommunityTrip(newTrip);`;

if (oldHandleCommunityRegex.test(html)) {
  html = html.replace(oldHandleCommunityRegex, newHandleCommunity);
  console.log('Updated handleCommunitySubmit with bounds and character limits');
} else {
  console.error('Could not find oldHandleCommunityRegex');
}

// Update renderCommunityFeed to use escapeHtml and 30-day auto-expiry
html = html.replace(
  '${trip.start} ➔ ${trip.end}',
  '${escapeHtml(trip.start)} ➔ ${escapeHtml(trip.end)}'
);
html = html.replace(
  '${trip.note ? \'"\' + trip.note + \'"\' : (lang === \'bn\' ? \'নিয়মিত ট্রিপ\' : \'Regular ride\')}',
  '${trip.note ? \'"\' + escapeHtml(trip.note) + \'"\' : (lang === \'bn\' ? \'নিয়মিত ট্রিপ\' : \'Regular ride\')}'
);

// 30-day auto-expiry in init
html = html.replace(
  'state.communityTrips = JSON.parse(savedTrips);',
  `const parsed = JSON.parse(savedTrips);
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          state.communityTrips = parsed.filter(t => t.timestamp && t.timestamp > thirtyDaysAgo);`
);

// 6. Add "আমার ডেটা মুছুন" button in Community feed and Safety sections
const clearDataBtnHtml = `
            <!-- Clear My Data Button (Local Privacy Control) -->
            <div class="pt-2 text-center">
              <button type="button" onclick="clearAllUserData()" class="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold inline-flex items-center space-x-1.5 py-1 px-2.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 transition active:scale-95">
                <i class="fa-solid fa-trash-can text-xs"></i>
                <span data-i18n="btnClearAllData">আমার লোকাল ডেটা মুছুন (Clear All My Data)</span>
              </button>
            </div>
`;

if (!html.includes('btnClearAllData')) {
  html = html.replace('<!-- Live Community Feed List -->', clearDataBtnHtml + '\n            <!-- Live Community Feed List -->');
  console.log('Added clearAllUserData button in community tab');
}

// 7. Register Service Worker and PWA Install Prompt in JS init
const pwaInitJs = `
      // 2.5 Service Worker Registration for PWA Offline Functionality
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js').then((reg) => {
            console.log('[PWA] Service Worker registered successfully with scope:', reg.scope);
          }).catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
        });
      }

      // PWA Install Prompt Handler
      let deferredInstallPrompt = null;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        const banner = document.getElementById('pwaInstallPromptCard');
        if (banner) banner.classList.remove('hidden');
      });

      window.installPwaApplication = function() {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          deferredInstallPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('[PWA] User accepted install prompt');
            }
            deferredInstallPrompt = null;
            const banner = document.getElementById('pwaInstallPromptCard');
            if (banner) banner.classList.add('hidden');
          });
        } else {
          showToast(state.language === 'bn' ? 'ব্রাউজার মেনু থেকে "Install" বা "Add to Home Screen" নির্বাচন করুন' : 'Select "Install" or "Add to Home Screen" from your browser menu', 'info');
        }
      };
`;

if (!html.includes('[PWA] Service Worker registered')) {
  html = html.replace('// 3. Load or seed community trips', pwaInitJs + '\n      // 3. Load or seed community trips');
  console.log('Added Service Worker registration and install prompt handler');
}

// 8. Add PWA Install Banner & Outdated Data notice in DOM
const pwaBannerHtml = `
      <!-- PWA Install Banner & Offline Version Notice -->
      <div id="pwaInstallPromptCard" class="hidden bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-sm">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-mobile-screen-button text-emerald-600 text-base"></i>
          <div>
            <strong class="block text-xs" data-i18n="pwaInstallTitle">হোম স্ক্রিনে ইনস্টল করুন</strong>
            <span class="text-[10px] text-emerald-700 dark:text-emerald-300" data-i18n="pwaInstallDesc">অফলাইনে দ্রুত ন্যায্য ভাড়া দেখতে অ্যাপটি ইনস্টল করুন।</span>
          </div>
        </div>
        <button type="button" onclick="installPwaApplication()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition active:scale-95 shrink-0" data-i18n="btnInstallPwa">
          ইনস্টল
        </button>
      </div>

      <!-- Outdated Data Version Notice -->
      <div class="text-[10px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-center space-x-1.5 pt-0.5">
        <i class="fa-solid fa-clock-rotate-left text-slate-400"></i>
        <span data-i18n="dataVersionNotice">অফলাইন ডেটা সংস্করণ: ২০২৪.১০ (শেষ আপডেট: ০১ অক্টোবর ২০২৪)</span>
      </div>
`;

if (!html.includes('id="pwaInstallPromptCard"')) {
  html = html.replace('<!-- Tab 1: Fair Fare Calculator -->', pwaBannerHtml + '\n        <!-- Tab 1: Fair Fare Calculator -->');
  console.log('Added PWA Install Banner and Outdated Data notice to DOM');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Phase 1D & Phase 2 applied successfully!');
