const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace renderCalculationResult and related trip rendering functions
const oldRenderCalcRegex = /function renderCalculationResult\(result\) \{[\s\S]*?function renderCommunityFeed\(\)/;

const newRenderCalc = `// Cached Farmgate -> Gulshan 1 Route for offline / zero-network instant demo
    const CACHED_DEMO_ROUTE = {
      startId: 'farmgate',
      endId: 'gulshan1',
      distanceKm: 5.2,
      durationMinutes: 22,
      mode: 'osrm',
      coordinates: [
        [23.7561, 90.3872],
        [23.7590, 90.3900],
        [23.7650, 90.3950],
        [23.7700, 90.4020],
        [23.7750, 90.4100],
        [23.7785, 90.4180]
      ]
    };

    function runFarmgateGulshanDemo() {
      const startLandmark = DHAKA_LANDMARKS.find(l => l.id === 'farmgate') || {
        id: 'farmgate', nameBn: 'ফার্মগেট', nameEn: 'Farmgate', coords: [23.7561, 90.3872]
      };
      const endLandmark = DHAKA_LANDMARKS.find(l => l.id === 'gulshan1') || {
        id: 'gulshan1', nameBn: 'গুলশান ১', nameEn: 'Gulshan 1', coords: [23.7785, 90.4180]
      };

      state.startPoint = {
        landmarkId: startLandmark.id,
        name: state.language === 'bn' ? startLandmark.nameBn : startLandmark.nameEn,
        lat: startLandmark.coords[0],
        lng: startLandmark.coords[1]
      };

      state.endPoint = {
        landmarkId: endLandmark.id,
        name: state.language === 'bn' ? endLandmark.nameBn : endLandmark.nameEn,
        lat: endLandmark.coords[0],
        lng: endLandmark.coords[1]
      };

      updateDropdownSelections();
      updateMapMarkers();
      validateRouteInputs();

      // Render cached route coordinates immediately on map
      renderRouteOnMap(CACHED_DEMO_ROUTE);

      // Perform full multi-option calculation
      executeMultiOptionCalculation(CACHED_DEMO_ROUTE);

      showToast(state.language === 'bn' ? 'ফার্মগেট ➔ গুলশান ১ ডেমো রুট সফলভাবে লোড হয়েছে' : 'Demo route loaded: Farmgate ➔ Gulshan 1', 'success');
    }

    function executeMultiOptionCalculation(routeData) {
      const dist = routeData.distanceKm;
      const mins = routeData.durationMinutes;
      const cond = state.conditions;
      const lang = state.language;

      // Pure engine calculations
      const engine = (typeof FareEngine !== 'undefined') ? FareEngine : {
        calculateFareEngine: typeof calculateFareEngine === 'function' ? calculateFareEngine : null,
        findMultimodalRoute: typeof findMultimodalRoute === 'function' ? findMultimodalRoute : null,
        calculateRideHailingEstimates: typeof calculateRideHailingEstimates === 'function' ? calculateRideHailingEstimates : null,
        toBengaliNumber: typeof toBengaliNumber === 'function' ? toBengaliNumber : (n => n)
      };

      const cngData = engine.calculateFareEngine('cng', dist, mins, cond);
      const rickshawData = engine.calculateFareEngine('rickshaw', dist, Math.round(mins * 1.5), cond);
      const batteryData = engine.calculateFareEngine('battery', dist, Math.round(mins * 1.1), cond);
      const multimodalData = engine.findMultimodalRoute(state.startPoint, state.endPoint);

      const optionsList = [
        {
          id: 'cng',
          nameBn: 'সিএনজি অটো-রিকশা',
          nameEn: 'CNG Auto-Rickshaw',
          icon: 'fa-solid fa-taxi text-emerald-600',
          minFare: cngData.minFare,
          maxFare: cngData.maxFare,
          minutes: mins,
          transfers: 0,
          walkingMeters: 50,
          reasonBn: 'দ্রুত ও সরাসরি গন্তব্যে পৌঁছায় (মিটারহীন দরকষাকষি)',
          reasonEn: 'Fastest direct ride (negotiated rate)',
          allowed: true,
          data: cngData
        },
        {
          id: 'rickshaw',
          nameBn: 'সাধারণ রিকশা',
          nameEn: 'Cycle Rickshaw',
          icon: 'fa-solid fa-bicycle text-amber-600',
          minFare: rickshawData.minFare,
          maxFare: rickshawData.maxFare,
          minutes: Math.round(mins * 1.5),
          transfers: 0,
          walkingMeters: 20,
          reasonBn: 'মাঝারি দূরত্বের খোলা বাহন (শারীরিক পরিশ্রম নির্ভর)',
          reasonEn: 'Pedal-powered open vehicle for short-to-mid trips',
          allowed: dist <= 7.0,
          disabledReasonBn: 'দূরত্ব ৭ কিমি-এর বেশি — রিকশা অনুপযুক্ত',
          disabledReasonEn: 'Distance exceeds 7 km human limit',
          data: rickshawData
        },
        {
          id: 'battery',
          nameBn: 'ব্যাটারি রিকশা / ইজিবাইক',
          nameEn: 'Battery Easybike',
          icon: 'fa-solid fa-bolt text-blue-600',
          minFare: batteryData.minFare,
          maxFare: batteryData.maxFare,
          minutes: Math.round(mins * 1.1),
          transfers: 0,
          walkingMeters: 30,
          reasonBn: 'স্বল্প খরচে সাশ্রয়ী স্থানীয় সংযোগ',
          reasonEn: 'Low-cost motorized feeder trip',
          allowed: dist <= 12.0,
          disabledReasonBn: 'দূরত্ব ১২ কিমি-এর বেশি — ব্যাটারি রিকশার সীমার বাইরে',
          disabledReasonEn: 'Distance exceeds 12 km battery range',
          data: batteryData
        }
      ];

      if (multimodalData) {
        optionsList.push({
          id: 'multimodal',
          nameBn: 'রিকশা + এমআরটি-৬ মেট্রোরেল',
          nameEn: 'Rickshaw + MRT-6 Metro',
          icon: 'fa-solid fa-train-subway text-purple-600',
          minFare: multimodalData.totalMin,
          maxFare: multimodalData.totalMax,
          minutes: multimodalData.totalMinutes,
          transfers: 2,
          walkingMeters: 150,
          reasonBn: 'যানজটমুক্ত দ্রুততম ভ্রমণ (মেট্রোরেল করিডোর)',
          reasonEn: 'Traffic-free commute via MRT-6 corridor',
          allowed: true,
          data: multimodalData
        });
      }

      // Sort allowed options by minFare ascending
      const viableOptions = optionsList.filter(o => o.allowed);
      viableOptions.sort((a, b) => a.minFare - b.minFare);

      state.calculatedOptions = optionsList;
      state.viableOptions = viableOptions;
      state.cheapestOption = viableOptions[0];

      // If currently selected vehicle isn't chosen yet, pick cheapest
      if (!state.selectedVehicle || !optionsList.find(o => o.id === state.selectedVehicle && o.allowed)) {
        state.selectedVehicle = state.cheapestOption.id;
      }

      state.lastResult = {
        distanceKm: dist,
        durationMinutes: mins,
        mode: routeData.mode
      };

      renderMultiOptionUI();
      updateUrlHash();
    }

    function selectActiveOption(optionId) {
      const opt = (state.calculatedOptions || []).find(o => o.id === optionId);
      if (!opt || !opt.allowed) return;
      state.selectedVehicle = optionId;
      renderMultiOptionUI();
      updateUrlHash();
    }

    function renderMultiOptionUI() {
      const resultCard = document.getElementById('resultCard');
      const resDistanceText = document.getElementById('resDistanceText');
      const resDurationText = document.getElementById('resDurationText');
      const resRoutingModeBadge = document.getElementById('resRoutingModeBadge');
      const optionsContainer = document.getElementById('resOptionsComparisonList');
      const timeTradeoffNotice = document.getElementById('timeTradeoffNotice');
      const timeTradeoffText = document.getElementById('timeTradeoffText');
      const lineItemsContainer = document.getElementById('resLineItemsList');
      const officialNote = document.getElementById('officialFareComparisonNote');
      const sourceBadge = document.getElementById('resFareSourceBadge');
      const sourceText = document.getElementById('resFareSourceText');
      const dateText = document.getElementById('resFareDateText');
      const stepsContainer = document.getElementById('resJourneyStepsList');
      const lang = state.language;

      if (!state.lastResult || !state.viableOptions) return;

      const dist = state.lastResult.distanceKm;
      const mins = state.lastResult.durationMinutes;

      // Distance and duration
      resDistanceText.textContent = lang === 'bn' ? \`\${toBengaliNumber(dist)} কিমি\` : \`\${dist} km\`;
      resDurationText.textContent = lang === 'bn' ? \`\${toBengaliNumber(mins)} মিনিট\` : \`\${mins} mins\`;

      // Routing Mode badge
      if (state.lastResult.mode === 'osrm') {
        resRoutingModeBadge.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
        resRoutingModeBadge.innerHTML = \`<i class="fa-solid fa-route mr-1"></i>\${lang === 'bn' ? 'ওএসআরএম রুট' : 'OSRM Route'}\`;
      } else {
        resRoutingModeBadge.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
        resRoutingModeBadge.innerHTML = \`<i class="fa-solid fa-compass mr-1"></i>\${lang === 'bn' ? 'মোটামুটি হিসাব (অফলাইন)' : 'Approximate Route (Offline)'}\`;
      }

      // Render Options Comparison Cards
      const cheapest = state.cheapestOption;
      optionsContainer.innerHTML = state.calculatedOptions.map(opt => {
        const isSelected = opt.id === state.selectedVehicle;
        const isCheapest = opt.id === cheapest.id;

        if (!opt.allowed) {
          return \`
            <div class="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 opacity-60">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <i class="\${opt.icon}"></i>
                  <span class="font-bold text-xs text-slate-500">\${lang === 'bn' ? opt.nameBn : opt.nameEn}</span>
                </div>
                <span class="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
                  \${lang === 'bn' ? opt.disabledReasonBn : opt.disabledReasonEn}
                </span>
              </div>
            </div>
          \`;
        }

        const fareText = \`\${formatCurrency(opt.minFare, lang)} – \${formatCurrency(opt.maxFare, lang)}\`;
        const timeText = lang === 'bn' ? \`~\${toBengaliNumber(opt.minutes)} মিনিট\` : \`~\${opt.minutes} mins\`;
        const transferText = opt.transfers === 0
          ? (lang === 'bn' ? 'সরাসরি (০ বদল)' : 'Direct (0 transfers)')
          : (lang === 'bn' ? \`\${toBengaliNumber(opt.transfers)}টি ট্রানজিট বদল\` : \`\${opt.transfers} transfers\`);

        return \`
          <div onclick="selectActiveOption('\${opt.id}')" class="cursor-pointer p-3.5 rounded-2xl border-2 transition-all \${
            isSelected
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800'
          }">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <i class="\${opt.icon} text-base"></i>
                </div>
                <div>
                  <div class="flex items-center space-x-1.5">
                    <h4 class="text-xs font-extrabold text-slate-900 dark:text-slate-100">\${lang === 'bn' ? opt.nameBn : opt.nameEn}</h4>
                    \${isCheapest ? \`<span class="bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">\${lang === 'bn' ? 'সবচেয়ে সাশ্রয়ী' : 'Cheapest Option'}</span>\` : ''}
                  </div>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400">\${lang === 'bn' ? opt.reasonBn : opt.reasonEn}</span>
                </div>
              </div>
              <div class="text-right shrink-0">
                <span class="block text-sm font-black text-emerald-700 dark:text-emerald-400 num-font">\${fareText}</span>
                <span class="text-[10px] text-slate-500">\${timeText} • \${transferText}</span>
              </div>
            </div>
          </div>
        \`;
      }).join('');

      // Time vs Cost Trade-off Notice
      const fastest = [...state.viableOptions].sort((a, b) => a.minutes - b.minutes)[0];
      if (cheapest && fastest && cheapest.id !== fastest.id && (cheapest.minutes - fastest.minutes) >= 8) {
        const diffMins = cheapest.minutes - fastest.minutes;
        timeTradeoffNotice.classList.remove('hidden');
        timeTradeoffText.innerHTML = lang === 'bn'
          ? \`<strong>💡 সময় বনাম সাশ্রয় ট্রেড-অফ:</strong> <strong>\${cheapest.nameBn}</strong> সবচেয়ে সাশ্রয়ী হলেও <strong>\${fastest.nameBn}</strong>-এর চেয়ে এতে প্রায় <strong>\${toBengaliNumber(diffMins)} মিনিট</strong> বেশি সময় লাগতে পারে।\`
          : \`<strong>💡 Time vs Cost Trade-off:</strong> While <strong>\${cheapest.nameEn}</strong> is the cheapest, it takes ~<strong>\${diffMins} mins longer</strong> than <strong>\${fastest.nameEn}</strong>.\`;
      } else {
        timeTradeoffNotice.classList.add('hidden');
      }

      // Active Option Breakdown
      const activeOpt = state.calculatedOptions.find(o => o.id === state.selectedVehicle) || cheapest;
      renderDetailedBreakdown(activeOpt);
      renderJourneySteps(activeOpt);

      // Ride-Hailing Benchmarks
      const rh = (typeof FareEngine !== 'undefined' ? FareEngine : window).calculateRideHailingEstimates(dist, mins, state.conditions);
      const resUberMotoFare = document.getElementById('resUberMotoFare');
      const resUberCngFare = document.getElementById('resUberCngFare');
      const resUberCarFare = document.getElementById('resUberCarFare');
      if (resUberMotoFare) resUberMotoFare.textContent = \`\${formatCurrency(rh.motoMin, lang)} - \${formatCurrency(rh.motoMax, lang)}\`;
      if (resUberCngFare) resUberCngFare.textContent = \`\${formatCurrency(rh.cngMin, lang)} - \${formatCurrency(rh.cngMax, lang)}\`;
      if (resUberCarFare) resUberCarFare.textContent = \`\${formatCurrency(rh.carMin, lang)} - \${formatCurrency(rh.carMax, lang)}\`;

      // Negotiation script
      const scriptElem = document.getElementById('resNegotiationScript');
      if (scriptElem) {
        if (lang === 'bn') {
          scriptElem.textContent = \`প্রথমে \${formatCurrency(activeOpt.minFare, 'bn')} বলুন। ড্রাইভার \${formatCurrency(activeOpt.maxFare + 30, 'bn')} চাইতে পারে। শেষ পর্যন্ত \${formatCurrency(Math.round((activeOpt.minFare + activeOpt.maxFare)/2), 'bn')} এর মধ্যে রফা করার চেষ্টা করুন (এটি একটি নমুনা উদাহরণ)।\`;
        } else {
          scriptElem.textContent = \`Offer \${formatCurrency(activeOpt.minFare, 'en')} first. The driver may ask \${formatCurrency(activeOpt.maxFare + 30, 'en')}. Settle around \${formatCurrency(Math.round((activeOpt.minFare + activeOpt.maxFare)/2), 'en')} (sample negotiation script).\`;
        }
      }

      resultCard.classList.remove('hidden');
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function renderDetailedBreakdown(activeOpt) {
      const container = document.getElementById('resLineItemsList');
      const officialNote = document.getElementById('officialFareComparisonNote');
      const sourceBadge = document.getElementById('resFareSourceBadge');
      const sourceText = document.getElementById('resFareSourceText');
      const dateText = document.getElementById('resFareDateText');
      const lang = state.language;

      if (activeOpt.id === 'multimodal') {
        const m = activeOpt.data;
        sourceBadge.className = 'text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold px-2 py-0.5 rounded-full';
        sourceBadge.textContent = lang === 'bn' ? 'সরকারি অনুমোদিত মেট্রো রেট' : 'Official DMTCL Metro Rate';
        sourceText.textContent = lang === 'bn' ? 'উৎস: DMTCL সরকারি এমআরটি-৬ ভাড়ার তালিকা ২০২৩-২০২৪' : 'Source: Official DMTCL MRT-6 Chart';
        dateText.textContent = lang === 'bn' ? 'শেষ আপডেট: ২০২৪-০১-২০' : 'Updated: 2024-01-20';

        container.innerHTML = \`
          <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
            <span>\${lang === 'bn' ? '১. রিকশা সংযোগ ১ (' + m.startStation.nameBn + ' স্টেশন পর্যন্ত ' + toBengaliNumber(m.feeder1Dist) + ' কিমি)' : '1. Feeder Rickshaw to ' + m.startStation.nameEn + ' (' + m.feeder1Dist + ' km)'}</span>
            <span class="font-bold num-font">~\${formatCurrency(m.feeder1Cost, lang)}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
            <span>\${lang === 'bn' ? '২. এমআরটি-৬ ট্রেন টিকিট (' + m.startStation.nameBn + ' ➔ ' + m.endStation.nameBn + ')' : '2. MRT-6 Single Ticket (' + m.startStation.nameEn + ' ➔ ' + m.endStation.nameEn + ')'}</span>
            <span class="font-bold text-emerald-700 dark:text-emerald-400 num-font">\${formatCurrency(m.metroFare, lang)} (\${lang === 'bn' ? 'সরকারি' : 'Official'})</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
            <span>\${lang === 'bn' ? '৩. রিকশা সংযোগ ২ (' + m.endStation.nameBn + ' থেকে গন্তব্য ' + toBengaliNumber(m.feeder2Dist) + ' কিমি)' : '3. Dropoff Feeder from ' + m.endStation.nameEn + ' (' + m.feeder2Dist + ' km)'}</span>
            <span class="font-bold num-font">~\${formatCurrency(m.feeder2Cost, lang)}</span>
          </div>
          <div class="flex justify-between py-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
            <span>\${lang === 'bn' ? 'মোট সমন্বিত আনুমানিক খরচ:' : 'Total Multimodal Est. Cost:'}</span>
            <span class="num-font">\${formatCurrency(m.totalMin, lang)} – \${formatCurrency(m.totalMax, lang)}</span>
          </div>
        \`;

        officialNote.innerHTML = lang === 'bn'
          ? \`<i class="fa-solid fa-circle-check text-purple-600 mr-1"></i>এমআরটি-৬ টিকিটের হার ডিএমটিসিএল অনুমোদিত সরকারি ভাড়ার চার্ট অনুযায়ী নির্ভুল। রিকশা ফিডার রেট আনুমানিক।\`
          : \`<i class="fa-solid fa-circle-check text-purple-600 mr-1"></i>MRT-6 fare is exact according to official DMTCL chart. Feeder rickshaw fares are estimated.\`;
        return;
      }

      // Single vehicle named lines breakdown
      const d = activeOpt.data;
      sourceBadge.className = 'text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full';
      sourceBadge.textContent = lang === 'bn' ? 'অনানুষ্ঠানিক দরকষাকষি রেট (আনুমানিক)' : 'Informal Negotiation Rate (Est.)';
      sourceText.textContent = lang === 'bn' ? \`উৎস: \${d.source}\` : \`Source: \${d.sourceEn}\`;
      dateText.textContent = lang === 'bn' ? \`শেষ আপডেট: \${toBengaliNumber(d.sourceDate)}\` : \`Updated: \${d.sourceDate}\`;

      const baseText = lang === 'bn' ? \`বেস ভাড়া (প্রথম \${toBengaliNumber(d.coveredKm)} কিমি)\` : \`Base Fare (First \${d.coveredKm} km)\`;
      const distText = lang === 'bn' ? \`দূরত্বের চার্জ (\${toBengaliNumber(d.billableKm)} কিমি × ৳\${toBengaliNumber(d.perKmRate)}/কিমি)\` : \`Distance Charge (\${d.billableKm} km × ৳\${d.perKmRate}/km)\`;
      const congText = lang === 'bn' ? \`যানজট বাফারিং (~\${toBengaliNumber(d.travelMinutes)} মিনিট × ৳\${toBengaliNumber(d.congestionRate)}/মিনিট)\` : \`Congestion Buffer (~\${d.travelMinutes} mins × ৳\${d.congestionRate}/min)\`;
      const surgeText = lang === 'bn' ? \`সার্জ গুণিতক (বৃষ্টি/পিক/নাইট)\` : \`Surge Multiplier (Rain/Peak/Night)\`;

      container.innerHTML = \`
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
          <span>\${baseText}</span>
          <span class="font-bold num-font">\${formatCurrency(d.baseFare, lang)}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
          <span>\${distText}</span>
          <span class="font-bold num-font">+\${formatCurrency(d.distanceCost, lang)}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
          <span>\${congText}</span>
          <span class="font-bold num-font">+\${formatCurrency(d.congestionCost, lang)}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
          <span>\${surgeText}</span>
          <span class="font-bold num-font">\${toBengaliNumber(d.activeSurgeMultiplier.toFixed(2))}x</span>
        </div>
        <div class="flex justify-between py-1 font-semibold text-slate-700 dark:text-slate-300">
          <span>\${lang === 'bn' ? 'সম্ভাব্য মোট ভিত্তি (Subtotal):' : 'Estimated Base Subtotal:'}</span>
          <span class="num-font">\${formatCurrency(d.subtotalBeforeSurge, lang)}</span>
        </div>
        <div class="flex justify-between py-1.5 font-black text-emerald-800 dark:text-emerald-300 text-sm border-t border-slate-200 dark:border-slate-700">
          <span>\${lang === 'bn' ? 'প্রস্তাবিত দরকষাকষি সীমা:' : 'Negotiation Target Range:'}</span>
          <span class="num-font">\${formatCurrency(d.minFare, lang)} – \${formatCurrency(d.maxFare, lang)} (\${lang === 'bn' ? 'আনুমানিক' : 'est.'})</span>
        </div>
      \`;

      if (d.isOfficialMeterAvailable && d.officialMeterFare) {
        officialNote.innerHTML = lang === 'bn'
          ? \`<i class="fa-solid fa-triangle-exclamation text-amber-500 mr-1"></i><strong>সরকারি বনাম স্ট্রিট রিয়েলিটি:</strong> বিআরটিএ ২০১৫ গেজেটের মিটার রেট প্রায় <strong>\${formatCurrency(d.officialMeterFare, 'bn')}</strong> (বেস ৳৪০ + ৳১২/কিমি + ৳২/মিনিট)। তবে ঢাকায় চালকরা মিটারে না যাওয়ায় যানজট বাফারিং যুক্ত করে <strong>\${formatCurrency(d.minFare, 'bn')}–\${formatCurrency(d.maxFare, 'bn')}</strong> বাস্তবসম্মত দরকষাকষি সীমা দেখানো হয়েছে।\`
          : \`<i class="fa-solid fa-triangle-exclamation text-amber-500 mr-1"></i><strong>Official vs Reality:</strong> BRTA 2015 gazette meter rate is ~<strong>\${formatCurrency(d.officialMeterFare, 'en')}</strong>. Because drivers universally refuse meters, realistic street bargaining is estimated at <strong>\${formatCurrency(d.minFare, 'en')}–\${formatCurrency(d.maxFare, 'en')}</strong> with congestion buffer.\`;
      } else {
        officialNote.innerHTML = lang === 'bn'
          ? \`<i class="fa-solid fa-circle-info text-blue-500 mr-1"></i>রিকশা ও ব্যাটারিচালিত বাহনের কোনো সরকারি মিটার হার নেই। সিটি করপোরেশন এলাকার বাস্তব যাত্রী অভিজ্ঞতা ও দূরত্বের ভিত্তিতে এই আনুমানিক সীমা তৈরি।\`
          : \`<i class="fa-solid fa-circle-info text-blue-500 mr-1"></i>Rickshaws and easybikes are not meter-regulated. This range reflects commuter norms.\`;
      }
    }

    function renderJourneySteps(activeOpt) {
      const container = document.getElementById('resJourneyStepsList');
      const lang = state.language;
      const startName = state.startPoint ? state.startPoint.name : (lang === 'bn' ? 'শুরুর স্থান' : 'Pickup');
      const endName = state.endPoint ? state.endPoint.name : (lang === 'bn' ? 'গন্তব্য' : 'Destination');
      const dist = state.lastResult ? state.lastResult.distanceKm : 5.2;
      const mins = activeOpt.minutes;

      if (activeOpt.id === 'multimodal') {
        const m = activeOpt.data;
        container.innerHTML = \`
          <div class="flex items-start space-x-2.5">
            <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">১</span>
            <div class="space-y-0.5">
              <strong class="text-slate-800 dark:text-slate-100 block">\${lang === 'bn' ? 'ফিডার রিকশা গ্রহণ: ' + startName + ' থেকে ' + m.startStation.nameBn + ' স্টেশন' : 'Take feeder rickshaw from ' + startName + ' to ' + m.startStation.nameEn}</strong>
              <p class="text-[11px] text-slate-500">\${lang === 'bn' ? 'দূরত্ব: ' + toBengaliNumber(m.feeder1Dist) + ' কিমি • সময়: ~' + toBengaliNumber(m.feeder1Minutes) + ' মিনিট • আনুমানিক ভাড়া: ~' + formatCurrency(m.feeder1Cost, 'bn') : 'Dist: ' + m.feeder1Dist + ' km • ~' + m.feeder1Minutes + ' mins • ~' + formatCurrency(m.feeder1Cost, 'en')}</p>
            </div>
          </div>
          <div class="flex items-start space-x-2.5">
            <span class="w-5 h-5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">২</span>
            <div class="space-y-0.5">
              <strong class="text-slate-800 dark:text-slate-100 block">\${lang === 'bn' ? 'মেট্রোরেল (MRT-6) বোর্ডিং: ' + m.startStation.nameBn + ' ➔ ' + m.endStation.nameBn : 'Board MRT-6 at ' + m.startStation.nameEn + ' towards ' + m.endStation.nameEn}</strong>
              <p class="text-[11px] text-slate-500">\${lang === 'bn' ? 'দূরত্ব: ' + toBengaliNumber(m.metroDistanceKm) + ' কিমি • টিকিট: ৳' + toBengaliNumber(m.metroFare) + ' (সরকারি রেট) • সময়: ~' + toBengaliNumber(m.metroMinutes) + ' মিনিট' : 'Dist: ' + m.metroDistanceKm + ' km • Ticket: ৳' + m.metroFare + ' (Official) • ~' + m.metroMinutes + ' mins'}</p>
            </div>
          </div>
          <div class="flex items-start space-x-2.5">
            <span class="w-5 h-5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">৩</span>
            <div class="space-y-0.5">
              <strong class="text-slate-800 dark:text-slate-100 block">\${lang === 'bn' ? 'স্টেশনে প্রস্থান: ' + m.endStation.nameBn + ' স্টেশনে নামুন' : 'Exit at ' + m.endStation.nameEn + ' Station'}</strong>
              <p class="text-[11px] text-slate-500">\${lang === 'bn' ? 'নিচতলায় এসে গেট পাঞ্চ করুন ও ফিডার রিকশা নিন' : 'Tap out at fare gates and head to ground floor'}</p>
            </div>
          </div>
          <div class="flex items-start space-x-2.5">
            <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">৪</span>
            <div class="space-y-0.5">
              <strong class="text-slate-800 dark:text-slate-100 block">\${lang === 'bn' ? 'শেষ ধাপ: ' + endName + '-এ পৌঁছান' : 'Final Step: Reach ' + endName}</strong>
              <p class="text-[11px] text-slate-500">\${lang === 'bn' ? 'দূরত্ব: ' + toBengaliNumber(m.feeder2Dist) + ' কিমি • সময়: ~' + toBengaliNumber(m.feeder2Minutes) + ' মিনিট • আনুমানিক ফিডার ভাড়া: ~' + formatCurrency(m.feeder2Cost, 'bn') : 'Dist: ' + m.feeder2Dist + ' km • ~' + m.feeder2Minutes + ' mins • ~' + formatCurrency(m.feeder2Cost, 'en')}</p>
            </div>
          </div>
        \`;
        return;
      }

      const vName = lang === 'bn' ? activeOpt.nameBn : activeOpt.nameEn;
      container.innerHTML = \`
        <div class="flex items-start space-x-2.5">
          <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">১</span>
          <div class="space-y-0.5">
            <strong class="text-slate-800 dark:text-slate-100 block">\${lang === 'bn' ? 'বোর্ডিং: ' + startName + ' থেকে ' + vName + ' নিন' : 'Board ' + vName + ' from ' + startName}</strong>
            <p class="text-[11px] text-slate-500">\${lang === 'bn' ? 'ওঠার আগে দাম ঠিক করুন (বোর্ডিং বিবরণ: যাচাই করা হয়নি)' : 'Agree on fare before riding (boarding point: unverified)'}</p>
          </div>
        </div>
        <div class="flex items-start space-x-2.5">
          <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">২</span>
          <div class="space-y-0.5">
            <strong class="text-slate-800 dark:text-slate-100 block">\${lang === 'bn' ? 'যাত্রাপথ ও রুট পর্যবেক্ষণ' : 'En Route'}</strong>
            <p class="text-[11px] text-slate-500">\${lang === 'bn' ? 'দূরত্ব: ' + toBengaliNumber(dist) + ' কিমি • সম্ভাব্য সময়: ~' + toBengaliNumber(mins) + ' মিনিট (ম্যাপে নজর রাখুন)' : 'Distance: ' + dist + ' km • Est. time: ~' + mins + ' mins'}</p>
          </div>
        </div>
        <div class="flex items-start space-x-2.5">
          <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">৩</span>
          <div class="space-y-0.5">
            <strong class="text-slate-800 dark:text-slate-100 block">\${lang === 'bn' ? 'গন্তব্যে পৌঁছানো: ' + endName : 'Destination: Reach ' + endName}</strong>
            <p class="text-[11px] text-slate-500">\${lang === 'bn' ? 'আনুমানিক প্রদেয় ভাড়া: ' + formatCurrency(activeOpt.minFare, 'bn') + ' – ' + formatCurrency(activeOpt.maxFare, 'bn') + ' (জরুরিতে ৯৯৯)' : 'Estimated payable fare: ' + formatCurrency(activeOpt.minFare, 'en') + ' – ' + formatCurrency(activeOpt.maxFare, 'en') + ' (Emergency: 999)'}</p>
          </div>
        </div>
      \`;
    }

    function updateUrlHash() {
      if (!state.startPoint || !state.endPoint) return;
      const sId = state.startPoint.landmarkId || 'start';
      const eId = state.endPoint.landmarkId || 'end';
      const vId = state.selectedVehicle || 'cng';
      const hashStr = \`start=\${sId}&end=\${eId}&vehicle=\${vId}\`;
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + hashStr);
      } else {
        window.location.hash = hashStr;
      }
    }

    function generateTripShareText() {
      const lang = state.language;
      const startName = state.startPoint ? state.startPoint.name : 'ফার্মগেট';
      const endName = state.endPoint ? state.endPoint.name : 'গুলশান ১';
      const dist = state.lastResult ? state.lastResult.distanceKm : 5.2;
      const mins = state.lastResult ? state.lastResult.durationMinutes : 22;
      const activeOpt = (state.calculatedOptions || []).find(o => o.id === state.selectedVehicle) || {
        nameBn: 'সিএনজি অটো', minFare: 120, maxFare: 145
      };

      const fareStr = \`\${formatCurrency(activeOpt.minFare, lang)} - \${formatCurrency(activeOpt.maxFare, lang)}\`;
      const mapsLink = \`https://www.google.com/maps/dir/?api=1&origin=\${state.startPoint ? state.startPoint.lat + ',' + state.startPoint.lng : ''}&destination=\${state.endPoint ? state.endPoint.lat + ',' + state.endPoint.lng : ''}\`;
      const planUrl = \`\${window.location.origin}\${window.location.pathname}#start=\${state.startPoint?.landmarkId || 'farmgate'}&end=\${state.endPoint?.landmarkId || 'gulshan1'}&vehicle=\${state.selectedVehicle}\`;

      if (lang === 'bn') {
        return \`🛡️ *নিরাপদ যাত্রা — ট্রিপ পরিকল্পনা*
📍 শুরু: \${startName}
🏁 গন্তব্য: \${endName}
🛺 নির্বাচিত বাহন: \${activeOpt.nameBn}
💰 আনুমানিক ন্যায্য ভাড়া: \${fareStr} (আনুমানিক)
⏱️ সময়: ~\${toBengaliNumber(mins)} মিনিট • দূরত্ব: \${toBengaliNumber(dist)} কিমি
🚦 ধাপ ১: \${startName} থেকে বোর্ডিং (যাচাই করা হয়নি)
🚦 ধাপ ২: মূল রুট হয়ে \${endName}-এ পৌঁছান
🚨 জরুরি পুলিশ হেল্পলাইন: ৯৯৯
📱 লাইভ ট্রিপ প্ল্যান দেখুন: \${planUrl}
🗺️ গুগল ম্যাপস: \${mapsLink}\`;
      } else {
        return \`🛡️ *Nirapod Jatra — Commute Plan*
📍 Pickup: \${startName}
🏁 Destination: \${endName}
🛺 Vehicle: \${activeOpt.nameEn || activeOpt.nameBn}
💰 Fair Fare: \${fareStr} (est.)
⏱️ Time: ~\${mins} mins • Distance: \${dist} km
🚨 Emergency Helpline: 999
📱 View plan in web app: \${planUrl}
🗺️ Map: \${mapsLink}\`;
      }
    }

    async function shareTripViaNativeShare() {
      const shareData = {
        title: 'নিরাপদ যাত্রা — ট্রিপ বিবরণ',
        text: generateTripShareText(),
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          showToast(state.language === 'bn' ? 'যাত্রাপরিকল্পনা সফলভাবে শেয়ার হয়েছে' : 'Plan shared successfully!', 'success');
          return;
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('Native share failed, using fallback:', err);
          }
        }
      }
      // Fallback to clipboard
      await copyTripShareText();
    }

    function shareTripViaWhatsApp() {
      const text = generateTripShareText();
      const url = \`https://api.whatsapp.com/send?text=\${encodeURIComponent(text)}\`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    function shareTripViaSms() {
      const text = generateTripShareText();
      const url = \`sms:?body=\${encodeURIComponent(text)}\`;
      window.location.href = url;
    }

    async function copyTripShareText() {
      const text = generateTripShareText();
      const lang = state.language;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          showToast(lang === 'bn' ? 'যাত্রার বিবরণ ও লিংক ক্লিপবোর্ডে কপি হয়েছে' : 'Trip plan copied to clipboard!', 'success');
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showToast(lang === 'bn' ? 'যাত্রার বিবরণ ক্লিপবোর্ডে কপি হয়েছে' : 'Trip plan copied to clipboard!', 'success');
        }
      } catch (e) {
        showToast(lang === 'bn' ? 'কপি করা যায়নি — ম্যানুয়ালি কপি করুন' : 'Could not copy', 'error');
      }
    }

    function handleUrlHashOnLoad() {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const startId = params.get('start') || params.get('from');
      const endId = params.get('end') || params.get('to');
      const vehicle = params.get('vehicle');

      if (startId && endId) {
        const startLandmark = DHAKA_LANDMARKS.find(l => l.id === startId);
        const endLandmark = DHAKA_LANDMARKS.find(l => l.id === endId);
        if (startLandmark && endLandmark) {
          state.startPoint = {
            landmarkId: startLandmark.id,
            name: state.language === 'bn' ? startLandmark.nameBn : startLandmark.nameEn,
            lat: startLandmark.coords[0],
            lng: startLandmark.coords[1]
          };
          state.endPoint = {
            landmarkId: endLandmark.id,
            name: state.language === 'bn' ? endLandmark.nameBn : endLandmark.nameEn,
            lat: endLandmark.coords[0],
            lng: endLandmark.coords[1]
          };
          if (vehicle) state.selectedVehicle = vehicle;
          updateDropdownSelections();
          updateMapMarkers();
          validateRouteInputs();
          requestRouteAndCalculate();
        }
      }
    }

    function renderCommunityFeed()`;

if (oldRenderCalcRegex.test(html)) {
  html = html.replace(oldRenderCalcRegex, newRenderCalc);
  console.log('Replaced renderCalculationResult with complete multi-option calculation engine');
} else {
  console.error('Could not find oldRenderCalcRegex in index.html');
}

// In requestRouteAndCalculate, replace calculateFareEngine call with executeMultiOptionCalculation
const oldReqRouteRegex = /const fareResult = calculateFareEngine\([\s\S]*?renderCalculationResult\(state\.lastResult\);/;
const newReqRoute = `executeMultiOptionCalculation(routeData);`;

if (oldReqRouteRegex.test(html)) {
  html = html.replace(oldReqRouteRegex, newReqRoute);
  console.log('Updated requestRouteAndCalculate to invoke executeMultiOptionCalculation');
} else {
  console.error('Could not find oldReqRouteRegex in index.html');
}

// In initApp or at the end of setup, invoke handleUrlHashOnLoad()
if (!html.includes('handleUrlHashOnLoad()')) {
  html = html.replace(
    '// 9. Fetch Live Dhaka Weather (Open-Meteo API)',
    '// 8.5 Handle URL Hash Plan Loading\n    handleUrlHashOnLoad();\n\n    // 9. Fetch Live Dhaka Weather (Open-Meteo API)'
  );
  console.log('Added handleUrlHashOnLoad() call during initialization');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Phase 1B & 1C Javascript applied successfully!');
