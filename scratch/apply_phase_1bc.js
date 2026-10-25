const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add fare_engine.js script tag before inline script
if (!html.includes('<script src="fare_engine.js"></script>')) {
  html = html.replace(
    '  <!-- ============================================================== -->\n  <!-- JAVASCRIPT APPLICATION LOGIC                                    -->\n  <!-- ============================================================== -->\n  <script>',
    '  <script src="fare_engine.js"></script>\n  <!-- ============================================================== -->\n  <!-- JAVASCRIPT APPLICATION LOGIC                                    -->\n  <!-- ============================================================== -->\n  <script>'
  );
  console.log('Added fare_engine.js script tag');
}

// 2. Add "ডেমো চালান" button right above Route Selection Card
const demoButtonHtml = `        <!-- ONE-TAP 3-MINUTE DEMO BUTTON (OFFLINE READY) -->
        <div class="pt-1">
          <button type="button" id="btnRunDemo" onclick="runFarmgateGulshanDemo()" class="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold py-3 px-4 rounded-2xl shadow-lg shadow-emerald-700/25 flex items-center justify-center space-x-2 text-xs transition active:scale-95 border border-emerald-400/30">
            <i class="fa-solid fa-bolt text-amber-300 text-sm"></i>
            <span data-i18n="btnRunDemo">⚡ ৩-মিনিট ডেমো চালান: ফার্মগেট ➔ গুলশান ১ (অফলাইন প্রস্তুত)</span>
          </button>
        </div>

        <!-- Route Selection Card (Categorized Inputs + Swap Button + Presets) -->`;

if (!html.includes('id="btnRunDemo"')) {
  html = html.replace('        <!-- Route Selection Card (Categorized Inputs + Swap Button + Presets) -->', demoButtonHtml);
  console.log('Added demo button above route selection card');
}

// 3. Replace resultCard with the full multi-option comparison, cheapest badge, named lines breakdown, and journey steps
const oldResultCardRegex = /<div id="resultCard"[\s\S]*?<\/div>\s*<\/section>\s*<!-- ========================================== -->\s*<!-- TAB 2: CROWDSOURCED RATES/;

const newResultCard = `<div id="resultCard" class="hidden fade-slide-up bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/50 shadow-xl overflow-hidden p-4 space-y-4">
          <!-- Top Row: Route Summary, Distance, Time, and Routing Mode Badge -->
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div class="flex items-center space-x-2">
              <span id="resDistanceBadge" class="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs px-2.5 py-1 rounded-lg num-font flex items-center space-x-1">
                <i class="fa-solid fa-location-arrow text-[10px]"></i>
                <span id="resDistanceText">৫.২ কিমি</span>
              </span>
              <span id="resDurationBadge" class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs px-2.5 py-1 rounded-lg num-font flex items-center space-x-1">
                <i class="fa-solid fa-clock text-[10px]"></i>
                <span id="resDurationText">২২ মিনিট</span>
              </span>
            </div>
            <!-- Mode tag (OSRM / Offline Haversine) -->
            <span id="resRoutingModeBadge" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              <i class="fa-solid fa-wifi mr-1"></i>ওএসআরএম রুট
            </span>
          </div>

          <!-- SECTION 1: SIDE-BY-SIDE TRANSIT OPTIONS COMPARISON (SORTED BY COST) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
                <i class="fa-solid fa-scale-balanced text-emerald-600"></i>
                <span data-i18n="optionsComparisonTitle">বাহন ও বিকল্পের তুলনা (কম খরচের ক্রমে সাজানো)</span>
              </label>
              <span class="text-[10px] text-slate-400 font-semibold" data-i18n="tapToSelect">ট্যাপ করে সিলেক্ট করুন</span>
            </div>
            
            <!-- Dynamic Grid of Transit Options -->
            <div id="resOptionsComparisonList" class="space-y-2">
              <!-- Dynamically populated via JS with CNG, Rickshaw, Battery, and Rickshaw+MRT6 -->
            </div>

            <!-- Time vs Cost Trade-off Notice (if cheapest option takes much longer) -->
            <div id="timeTradeoffNotice" class="hidden bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
              <i class="fa-solid fa-hourglass-half text-amber-600 mt-0.5 shrink-0"></i>
              <span id="timeTradeoffText" class="leading-snug"></span>
            </div>
          </div>

          <!-- SECTION 2: NAMED LINE-ITEMS FARE BREAKDOWN (TRANSPARENCY & GAP EXPLANATION) -->
          <div class="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <i class="fa-solid fa-file-invoice-dollar text-emerald-600"></i>
                <span data-i18n="fareBreakdownTitle">ভাড়ার বিস্তারিত হিসাব (স্বচ্ছতার জন্য)</span>
              </span>
              <span id="resFareSourceBadge" class="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full">
                অনানুষ্ঠানিক দরকষাকষি রেট (আনুমানিক)
              </span>
            </div>

            <!-- Line Items Table -->
            <div class="space-y-1.5 text-xs border-t border-slate-200 dark:border-slate-700 pt-2" id="resLineItemsList">
              <!-- Dynamically rendered via JS -->
            </div>

            <!-- Official vs Negotiation Context Notice -->
            <div id="officialFareComparisonNote" class="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 leading-snug space-y-1">
              <!-- Dynamic note explaining ৳101 vs ৳120-145 and official meter -->
            </div>

            <!-- Source & Date line -->
            <div class="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span id="resFareSourceText">উৎস: BRTA গেজেট ২০১৫ (মিটার) ও ঢাকা স্ট্রিট সার্ভে ২০২৪</span>
              <span id="resFareDateText" class="num-font">শেষ আপডেট: ২০২৪-১০-০১</span>
            </div>
          </div>

          <!-- SECTION 3: NUMBERED BANGLA JOURNEY STEPS -->
          <div class="bg-white dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <i class="fa-solid fa-shoe-prints text-emerald-600"></i>
                <span data-i18n="journeyStepsTitle">যাত্রাপথের বাস্তবসম্মত ধাপসমূহ</span>
              </span>
              <span class="text-[10px] text-slate-400 font-semibold" data-i18n="stepsTotal">মোট ধাপ</span>
            </div>
            
            <div id="resJourneyStepsList" class="space-y-2 text-xs pt-1">
              <!-- Dynamically rendered numbered steps -->
            </div>
          </div>

          <!-- SECTION 4: RIDE-HAILING BENCHMARKS (UBER & PATHAO REFERENCE ESTIMATES) -->
          <div class="bg-slate-50 dark:bg-slate-900/90 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <i class="fa-solid fa-scale-balanced text-emerald-600"></i>
                <span data-i18n="rideHailingTitle">উবার ও পাঠাও খরচ তুলনা (রেফারেন্স আনুমানিক, লাইভ দাম নয়)</span>
              </span>
              <span class="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full" data-i18n="appVsStreetBadge">অ্যাপ রেফারেন্স</span>
            </div>

            <!-- 3-Column Comparative Grid -->
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
              <!-- Pathao / Uber Moto -->
              <div class="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between shadow-xs">
                <div class="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <i class="fa-solid fa-motorcycle text-amber-500 text-xs"></i>
                  <span class="text-[10px] font-bold" data-i18n="uberMoto">পাঠাও/উবার বাইক</span>
                </div>
                <span id="resUberMotoFare" class="font-extrabold text-slate-900 dark:text-slate-100 num-font text-xs">৳ ৯০ - ১১৫</span>
                <span class="text-[9px] text-slate-400 mt-0.5" data-i18n="motoSub">বাইক • ১ জন</span>
              </div>

              <!-- Uber / Pathao CNG -->
              <div class="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between shadow-xs">
                <div class="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <i class="fa-solid fa-taxi text-emerald-500 text-xs"></i>
                  <span class="text-[10px] font-bold" data-i18n="uberCng">উবার/পাঠাও সিএনজি</span>
                </div>
                <span id="resUberCngFare" class="font-extrabold text-slate-900 dark:text-slate-100 num-font text-xs">৳ ১৭০ - ২১০</span>
                <span class="text-[9px] text-slate-400 mt-0.5" data-i18n="cngSub">অ্যাপ ৩-হুইলার</span>
              </div>

              <!-- UberX / Pathao Car -->
              <div class="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between shadow-xs">
                <div class="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <i class="fa-solid fa-car text-blue-500 text-xs"></i>
                  <span class="text-[10px] font-bold" data-i18n="uberCar">উবারএক্স / কার</span>
                </div>
                <span id="resUberCarFare" class="font-extrabold text-slate-900 dark:text-slate-100 num-font text-xs">৳ ২৬০ - ৩১০</span>
                <span class="text-[9px] text-slate-400 mt-0.5" data-i18n="carSub">এসি কার • ৪ জন</span>
              </div>
            </div>

            <!-- Dynamic App Comparison Tip -->
            <div class="text-[10px] text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200/70 dark:border-slate-700/70 flex items-start space-x-1.5 leading-snug">
              <i class="fa-solid fa-lightbulb text-amber-500 shrink-0 mt-0.5"></i>
              <span id="resUberTipText">অ্যাপের দাম বৃষ্টি বা জ্যামের সময় পরিবর্তনশীল হয়। এখানে দেওয়া দামটি আনুমানিক রেফারেন্স।</span>
            </div>
          </div>

          <!-- SECTION 5: SAMPLE NEGOTIATION SCRIPT + WEB SPEECH TTS -->
          <div class="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                <i class="fa-solid fa-comments text-emerald-600"></i>
                <span data-i18n="negotiationTitle">দরকষাকষির নমুনা উদাহরণ (রেফারেন্স)</span>
              </div>
              <!-- Audio Guide TTS Button -->
              <button type="button" id="btnPlayNegotiationAudio" onclick="toggleNegotiationAudio()" aria-label="Play negotiation script aloud" class="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-sm">
                <i id="audioSpeakerIcon" class="fa-solid fa-volume-high text-[11px]"></i>
                <span id="audioBtnText" data-i18n="listenVoice">শুনে নিন</span>
              </button>
            </div>
            <p id="resNegotiationScript" class="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-inner">
              কথোপকথনের নমুনা লোড হচ্ছে...
            </p>
          </div>

          <!-- SECTION 6: TRIP SHARING ACTION BUTTONS (WEB SHARE API + WHATSAPP/SMS/COPY) -->
          <div class="space-y-1.5 pt-1">
            <button type="button" onclick="shareTripViaNativeShare()" class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-2 shadow-md active:scale-95">
              <i class="fa-solid fa-share-nodes text-sm"></i>
              <span data-i18n="btnShareTripPlan">সম্পূর্ণ যাত্রাপরিকল্পনা শেয়ার করুন (Share Plan)</span>
            </button>

            <div class="grid grid-cols-3 gap-1.5">
              <button type="button" onclick="shareTripViaWhatsApp()" class="py-2.5 px-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold rounded-xl transition flex items-center justify-center space-x-1 shadow-xs active:scale-95">
                <i class="fa-brands fa-whatsapp text-xs text-emerald-600"></i>
                <span data-i18n="shareWhatsapp">হোয়াটসঅ্যাপ</span>
              </button>
              <button type="button" onclick="shareTripViaSms()" class="py-2.5 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[11px] font-bold rounded-xl transition flex items-center justify-center space-x-1 shadow-xs active:scale-95">
                <i class="fa-solid fa-comment-sms text-xs text-amber-500"></i>
                <span data-i18n="shareSms">এসএমএস</span>
              </button>
              <button type="button" onclick="copyTripShareText()" class="py-2.5 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[11px] font-bold rounded-xl transition flex items-center justify-center space-x-1 shadow-xs active:scale-95">
                <i class="fa-solid fa-copy text-xs text-emerald-600"></i>
                <span data-i18n="shareCopy">কপি</span>
              </button>
            </div>
          </div>

          <!-- CTA to contribute to community feed (Opens Quick-Report Modal) -->
          <button type="button" onclick="openQuickReportModal()" class="w-full py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 active:scale-95">
            <i class="fa-solid fa-hand-holding-dollar text-emerald-600 dark:text-emerald-400"></i>
            <span data-i18n="btnShareTrip">আমি এই ট্রিপে কত দিয়েছি জানান</span>
          </button>
        </div>

      </section>

      <!-- ========================================== -->
      <!-- TAB 2: CROWDSOURCED RATES`;

if (oldResultCardRegex.test(html)) {
  html = html.replace(oldResultCardRegex, newResultCard);
  console.log('Replaced resultCard with comprehensive multi-option comparison and breakdown');
} else {
  console.error('Could not match oldResultCardRegex');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Phase 1B & 1C HTML structure applied!');
