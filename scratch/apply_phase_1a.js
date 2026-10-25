const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. MOCK_DRIVERS_DB replacement
const oldDriversRegex = /const MOCK_DRIVERS_DB = \[[\s\S]*?\];/;
const newDriversDb = `const MOCK_DRIVERS_DB = [
      {
        plate: 'ঢাকা মেট্রো-থ ১১-১২৩৪',
        driverNameBn: 'কাল্পনিক চালক ১ (ডেমো)',
        driverNameEn: 'Demo Driver 1 (Fictional)',
        rating: 4.8,
        activeYears: 3,
        reportsCount: 0,
        vehicleType: 'সিএনজি অটো',
        safetyScore: 96,
        isVerified: true
      },
      {
        plate: 'ঢাকা মেট্রো-চ ২২-৫৬৭৮',
        driverNameBn: 'কাল্পনিক চালক ২ (ডেমো)',
        driverNameEn: 'Demo Driver 2 (Fictional)',
        rating: 4.5,
        activeYears: 2,
        reportsCount: 1,
        vehicleType: 'সিএনজি অটো',
        safetyScore: 88,
        isVerified: true
      },
      {
        plate: 'ঢাকা মেট্রো-গ ৩৩-৯০১২',
        driverNameBn: 'কাল্পনিক চালক ৩ (ডেমো)',
        driverNameEn: 'Demo Driver 3 (Fictional)',
        rating: 4.9,
        activeYears: 4,
        reportsCount: 0,
        vehicleType: 'সিএনজি অটো (ডেমো নারী চালক)',
        safetyScore: 99,
        isVerified: true
      },
      {
        plate: 'ঢাকা মেট্রো-হ ৪৪-৩৪৩৪',
        driverNameBn: 'কাল্পনিক চালক ৪ (ডেমো)',
        driverNameEn: 'Demo Driver 4 (Fictional)',
        rating: 4.7,
        activeYears: 2,
        reportsCount: 0,
        vehicleType: 'ব্যাটারিচালিত অটো',
        safetyScore: 94,
        isVerified: true
      }
    ];`;

if (oldDriversRegex.test(html)) {
  html = html.replace(oldDriversRegex, newDriversDb);
  console.log('Replaced MOCK_DRIVERS_DB');
} else {
  console.error('Could not find MOCK_DRIVERS_DB');
}

// 2. DEFAULT_SOS_CONTACTS
html = html.replace(
  "{ name: 'জাতীয় জরুরি সেবা (DMP)', phone: '999', isFixed: true }",
  "{ name: 'জাতীয় জরুরি সেবা (৯৯৯)', phone: '999', isFixed: true }"
);

// 3. Safety Vision Card (BRAC / DMP removal)
html = html.replace(
  `            <span class="font-bold block" data-i18n="safetyVisionBadge">হ্যাকাথন ভিশন / দ্বিতীয় ধাপ প্রোটোটাইপ</span>
            <p class="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-snug" data-i18n="safetyVisionDesc">
              যাত্রীদের ব্যক্তিগত নিরাপত্তা নিশ্চিত করতে ব্র্যাক / ডিএমপি ডাটাবেজ ইন্টিগ্রেশনের পরিকল্পিত মডেল। নিচের ডেমো ডাটা দিয়ে পরীক্ষা করুন।
            </p>`,
  `            <span class="font-bold block" data-i18n="safetyVisionBadge">ভবিষ্যৎ ধারণা — কোনো অংশীদারিত্ব নেই</span>
            <p class="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-snug" data-i18n="safetyVisionDesc">
              যাত্রীদের নিরাপত্তা নিশ্চিতকরণে প্রাতিষ্ঠানিক ডাটাবেজ ইন্টিগ্রেশনের একটি ভবিষ্যৎ ধারণা। বর্তমানে কোনো প্রাতিষ্ঠানিক অংশীদারিত্ব নেই। নিচের কাল্পনিক ডেমো তথ্য দিয়ে পরীক্ষা করুন।
            </p>`
);

// 4. Driver verification badge and card
html = html.replace(
  `<span class="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">ডেমো সক্রিয়</span>`,
  `<span class="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full font-bold">ডেমো ডেটা — কাল্পনিক চালক</span>`
);

// 5. QR Scanner title
html = html.replace(
  `<span data-i18n="qrScanTitle">স্মার্ট কিউআর স্ক্যানার (সিমুলেশন)</span>`,
  `<span data-i18n="qrScanTitle">স্মার্ট কিউআর স্ক্যানার (সিমুলেশন)</span>`
);

// 6. SOS Confirm & Receipt Modal (Real actions only, tel:999, native SMS, honesty disclaimer, no fake coords)
const oldSosReceipt = `<div id="sosReceiptModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-emerald-200 dark:border-emerald-800 space-y-3.5 fade-slide-up max-h-[90vh] overflow-y-auto overscroll-contain">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <span class="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
            <i class="fa-solid fa-circle-check text-emerald-600"></i>
            <span data-i18n="sosSentTitle">জরুরি সংকেত প্রস্তুত (প্রোটোটাইপ)</span>
          </span>
          <button type="button" onclick="closeSosReceiptModal()" class="text-slate-400 hover:text-slate-600 text-xs">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
          <div class="flex justify-between items-center text-slate-600">
            <span data-i18n="sosReceiptGps">শনাক্তকৃত জিপিএস:</span>
            <span id="sosReceiptCoords" class="font-mono font-bold text-slate-900 num-font">23.7561° N, 90.3872° E</span>
          </div>
          <div class="flex justify-between items-center text-slate-600">
            <span data-i18n="sosReceiptTime">সময়:</span>
            <span id="sosReceiptTimeVal" class="font-bold text-slate-900 num-font">এখনই</span>
          </div>
          <div class="flex justify-between items-center text-slate-600">
            <span data-i18n="sosReceiptPolice">জাতীয় হেল্পলাইন:</span>
            <a href="tel:999" class="font-bold text-red-600 dark:text-red-400 font-mono underline hover:text-red-700 inline-flex items-center space-x-1" aria-label="জরুরি পুলিশ ৯৯৯ এ কল করুন"><i class="fa-solid fa-phone text-xs mr-1"></i>৯৯৯ (সরাসরি কল)</a>
          </div>
        </div>

        <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 leading-snug">
          <i class="fa-solid fa-info-circle text-emerald-600 mr-1"></i>
          <span data-i18n="sosReceiptMessage">বিশ্বস্ত নম্বরগুলোতে আপনার লাইভ ট্র্যাকিং লিংক ও টেক্সট এসএমএস প্রস্তুত হয়েছে। জরুরি মুহূর্তে সরাসরি ৯৯৯ ডায়াল করুন।</span>
        </div>

        <button type="button" onclick="closeSosReceiptModal()" class="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition" data-i18n="btnClose">ঠিক আছে</button>
      </div>
    </div>`;

const newSosReceipt = `<div id="sosReceiptModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-red-200 dark:border-red-900 space-y-3.5 fade-slide-up max-h-[90vh] overflow-y-auto overscroll-contain">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <span class="text-xs font-bold text-red-700 dark:text-red-400 flex items-center space-x-1.5">
            <i class="fa-solid fa-triangle-exclamation text-red-600"></i>
            <span data-i18n="sosSentTitle">জরুরি সংকেত প্রস্তুত (প্রোটোটাইপ)</span>
          </span>
          <button type="button" onclick="closeSosReceiptModal()" class="text-slate-400 hover:text-slate-600 text-xs" aria-label="বন্ধ করুন">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Honesty Warning Box -->
        <div class="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 leading-snug space-y-1">
          <div class="font-bold flex items-center space-x-1.5 text-amber-800 dark:text-amber-300">
            <i class="fa-solid fa-shield-halved"></i>
            <span>প্রোটোটাইপ সততা নোটিশ:</span>
          </div>
          <p id="sosHonestyDisclaimer" data-i18n="sosHonestyDisclaimer">
            প্রোটোটাইপ: আপনার কন্টাক্ট বা ৯৯৯-এ কিছু পাঠানো হয়নি। নিচের অ্যাকশন ব্যবহার করে নিজে কল বা এসএমএস পাঠান।
          </p>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div class="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span data-i18n="sosReceiptGps">শনাক্তকৃত জিপিএস:</span>
            <span id="sosReceiptCoords" class="font-mono font-bold text-slate-900 dark:text-slate-100 num-font text-right">অনুমতি চাওয়া হচ্ছে...</span>
          </div>
          <div class="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span data-i18n="sosReceiptTime">সময়:</span>
            <span id="sosReceiptTimeVal" class="font-bold text-slate-900 dark:text-slate-100 num-font">এখনই</span>
          </div>
        </div>

        <!-- Real Actions Only -->
        <div class="space-y-2 pt-1">
          <!-- Real 999 Call Button -->
          <a href="tel:999" class="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md transition">
            <i class="fa-solid fa-phone text-amber-300"></i>
            <span data-i18n="btnCall999Direct">৯৯৯-এ সরাসরি কল করুন</span>
          </a>

          <!-- Native SMS App Trigger with Prefilled Message -->
          <a id="sosSmsBtn" href="sms:?body=%E0%A6%86%E0%A6%AE%E0%A6%BF%20%E0%A6%85%E0%A6%A8%E0%A6%BF%E0%A6%B0%E0%A6%BE%E0%A6%AA%E0%A6%A6%20%E0%A6%AC%E0%A7%8B%E0%A6%A7%20%E0%A6%95%E0%A6%B0%E0%A6%9B%E0%A6%BF" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-sm transition">
            <i class="fa-solid fa-comment-sms text-amber-300"></i>
            <span data-i18n="btnOpenSmsApp">এসএমএস প্রস্তুত (পাঠাতে ট্যাপ করুন)</span>
          </a>

          <button type="button" onclick="closeSosReceiptModal()" class="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition" data-i18n="btnClose">বন্ধ করুন</button>
        </div>
      </div>
    </div>`;

if (html.includes(oldSosReceipt)) {
  html = html.replace(oldSosReceipt, newSosReceipt);
  console.log('Replaced sosReceiptModal');
} else {
  console.error('Could not find exact oldSosReceipt');
}

// 7. Update executeSosTrigger in JS
const oldExecuteSosRegex = /function executeSosTrigger\(\) \{[\s\S]*?function closeSosReceiptModal\(\)/;
const newExecuteSos = `function executeSosTrigger() {
      closeSosConfirmModal();

      const receiptModal = document.getElementById('sosReceiptModal');
      const coordsVal = document.getElementById('sosReceiptCoords');
      const timeVal = document.getElementById('sosReceiptTimeVal');
      const smsBtn = document.getElementById('sosSmsBtn');
      const lang = state.language;

      const now = new Date();
      timeVal.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      function updateSmsButton(coordsText) {
        let msg = '';
        if (lang === 'bn') {
          msg = \`[জরুরি সাহায্য / প্রোটোটাইপ] আমি এই মুহূর্তে অনিরাপদ বোধ করছি। লোকেশন: \${coordsText}। জরুরি প্রয়োজনে ৯৯৯ নম্বরে যোগাযোগ করুন। - নিরাপদ যাত্রা\`;
        } else {
          msg = \`[Emergency SOS / Prototype] I feel unsafe right now. Location: \${coordsText}. Call 999 if needed. - Nirapod Jatra\`;
        }
        if (smsBtn) {
          smsBtn.href = \`sms:?body=\${encodeURIComponent(msg)}\`;
        }
      }

      // Initial state before GPS resolution
      coordsVal.textContent = lang === 'bn' ? 'অনুমতি চাওয়া হচ্ছে...' : 'Requesting permission...';
      updateSmsButton(lang === 'bn' ? 'অনুমতি প্রক্রিয়াধীন' : 'Permission pending');

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const lat = pos.coords.latitude.toFixed(4);
            const lng = pos.coords.longitude.toFixed(4);
            const verifiedCoords = \`\${lat}° N, \${lng}° E\`;
            coordsVal.textContent = verifiedCoords;
            updateSmsButton(verifiedCoords);
          },
          err => {
            console.warn('Geolocation denied or unavailable in SOS:', err);
            // NEVER show hardcoded coordinates as user location
            const unavailableMsg = lang === 'bn' ? 'অনুমতি দেওয়া হয়নি / অপ্রাপ্য' : 'Permission not granted / unavailable';
            coordsVal.textContent = unavailableMsg;
            updateSmsButton(unavailableMsg);
            if (err.code === 1) {
              showToast(translations[lang].locDenied, 'error');
            } else {
              showToast(translations[lang].locUnavailable, 'warning');
            }
          },
          { timeout: 4000, enableHighAccuracy: true }
        );
      } else {
        const noGeoMsg = lang === 'bn' ? 'জিপিএস সমর্থিত নয়' : 'GPS not supported';
        coordsVal.textContent = noGeoMsg;
        updateSmsButton(noGeoMsg);
        showToast(translations[lang].locUnavailable, 'warning');
      }

      receiptModal.classList.remove('hidden');
    }

    function closeSosReceiptModal()`;

if (oldExecuteSosRegex.test(html)) {
  html = html.replace(oldExecuteSosRegex, newExecuteSos);
  console.log('Replaced executeSosTrigger');
} else {
  console.error('Could not find executeSosTrigger');
}

// 8. Update Uber / Pathao label to explicitly say "রেফারেন্স আনুমানিক, লাইভ দাম নয়"
html = html.replace(
  `<span data-i18n="rideHailingTitle">উবার ও পাঠাও খরচ তুলনা</span>`,
  `<span data-i18n="rideHailingTitle">উবার ও পাঠাও খরচ তুলনা (রেফারেন্স আনুমানিক, লাইভ দাম নয়)</span>`
);
html = html.replace(
  `rideHailingTitle: 'উবার ও পাঠাও খরচ তুলনা',`,
  `rideHailingTitle: 'উবার ও পাঠাও খরচ তুলনা (রেফারেন্স আনুমানিক, লাইভ দাম নয়)',`
);
html = html.replace(
  `rideHailingTitle: 'Uber & Pathao Estimates',`,
  `rideHailingTitle: 'Uber & Pathao Comparison (Reference estimate, not live pricing)',`
);

// 9. Community Ledger: Stored locally disclaimer
html = html.replace(
  `communitySubtitle: 'সাধারণ যাত্রীদের দেওয়া বাস্তব ভাড়ার তথ্য। আপনার অভিজ্ঞতাও যুক্ত করুন এবং অতিরিক্ত ভাড়া প্রতিরোধ করুন।',`,
  `communitySubtitle: 'ডেমো — শুধু আপনার ফোনে সংরক্ষিত (ক্লাউডে পাঠানো হয় না)। আপনার স্থানীয় ভাড়ার তথ্য যুক্ত করুন।',`
);
html = html.replace(
  `communitySubtitle: 'Real fare data reported by daily commuters. Contribute your ride to build transparency.',`,
  `communitySubtitle: 'Demo — stored on your device only (not shared to cloud). Save your local fare experiences.',`
);

// 10. Update translations dictionary for safetyVisionBadge, safetyVisionDesc, sosHonestyDisclaimer, etc.
html = html.replace(
  `safetyVisionBadge: 'হ্যাকাথন ভিশন / দ্বিতীয় ধাপ প্রোটোটাইপ',`,
  `safetyVisionBadge: 'ভবিষ্যৎ ধারণা — কোনো অংশীদারিত্ব নেই',`
);
html = html.replace(
  `safetyVisionDesc: 'যাত্রীদের ব্যক্তিগত নিরাপত্তা নিশ্চিত করতে ব্র্যাক / ডিএমপি ডাটাবেজ ইন্টিগ্রেশনের পরিকল্পিত মডেল। নিচের ডেমো ডাটা দিয়ে পরীক্ষা করুন।',`,
  `safetyVisionDesc: 'যাত্রীদের নিরাপত্তা নিশ্চিতকরণে প্রাতিষ্ঠানিক ডাটাবেজ ইন্টিগ্রেশনের একটি ভবিষ্যৎ ধারণা। বর্তমানে কোনো প্রাতিষ্ঠানিক অংশীদারিত্ব নেই। নিচের কাল্পনিক ডেমো তথ্য দিয়ে পরীক্ষা করুন।',`
);

html = html.replace(
  `safetyVisionBadge: 'Phase 2 Prototype / Vision',`,
  `safetyVisionBadge: 'Future Concept — No Partnership',`
);
html = html.replace(
  `safetyVisionDesc: 'Planned framework for BRAC / DMP database verification to protect vulnerable riders. Test with mock records below.',`,
  `safetyVisionDesc: 'A conceptual model for institutional database verification. There is currently no official partnership. Test with fictional mock data below.',`
);

// Roadmap item 5 (no false partnership claims)
html = html.replace(
  `<strong class="block text-[11px]" data-i18n="rm5Title">ডিএমপি ও বিআরটিএ-তে সরাসরি অভিযোগ দাখিল</strong>
                <p class="text-[10px] text-indigo-700 dark:text-indigo-300" data-i18n="rm5Desc">আইনশৃঙ্খলা রক্ষাকারী বাহিনী ও বিআরটিএ-এর সাথে অফিশিয়াল পার্টনারশিপে ডিজিটাল কেস রেজিস্ট্রি।</p>`,
  `<strong class="block text-[11px]" data-i18n="rm5Title">আইনশৃঙ্খলা বাহিনী ও সংস্থায় অভিযোগ মডেল (ভবিষ্যৎ পরিকল্পনা)</strong>
                <p class="text-[10px] text-indigo-700 dark:text-indigo-300" data-i18n="rm5Desc">যাত্রীদের অভিযোগ সরাসরি সংশ্লিষ্ট কর্তৃপক্ষের উন্মুক্ত অভিযোগ সেবায় পৌঁছে দেয়ার ভবিষ্যৎ পরিকল্পনা।</p>`
);
html = html.replace(
  `rm5Title: 'ডিএমপি ও বিআরটিএ-তে সরাসরি অভিযোগ দাখিল',`,
  `rm5Title: 'আইনশৃঙ্খলা বাহিনী ও সংস্থায় অভিযোগ মডেল (ভবিষ্যৎ পরিকল্পনা)',`
);
html = html.replace(
  `rm5Desc: 'আইনশৃঙ্খলা রক্ষাকারী বাহিনী ও বিআরটিএ-এর সাথে অফিশিয়াল পার্টনারশিপে ডিজিটাল কেস রেজিস্ট্রি।',`,
  `rm5Desc: 'যাত্রীদের অভিযোগ সরাসরি সংশ্লিষ্ট কর্তৃপক্ষের উন্মুক্ত অভিযোগ সেবায় পৌঁছে দেয়ার ভবিষ্যৎ পরিকল্পনা।',`
);
html = html.replace(
  `rm5Title: 'Direct Law-Enforcement (DMP) & BRTA Incident Reporting',`,
  `rm5Title: 'Law-Enforcement Incident Model (Future Plan)',`
);
html = html.replace(
  `rm5Desc: 'Direct grievance registry via official partnership with law-enforcement & regulators.',`,
  `rm5Desc: 'Conceptual framework for forwarding commuter reports to public grievance channels.',`
);

// SOS wording translations
html = html.replace(
  `sosSentTitle: 'জরুরি সংকেত প্রস্তুত (প্রোটোটাইপ)',`,
  `sosSentTitle: 'জরুরি সংকেত প্রস্তুত (প্রোটোটাইপ)',
        sosHonestyDisclaimer: 'প্রোটোটাইপ: আপনার কন্টাক্ট বা ৯৯৯-এ কিছু পাঠানো হয়নি। নিচের অ্যাকশন ব্যবহার করে নিজে কল বা এসএমএস পাঠান।',
        btnCall999Direct: '৯৯৯-এ সরাসরি কল করুন',
        btnOpenSmsApp: 'এসএমএস প্রস্তুত (পাঠাতে ট্যাপ করুন)',`
);
html = html.replace(
  `sosSentTitle: 'Emergency SOS Alert Ready (Prototype)',`,
  `sosSentTitle: 'Emergency SOS Alert Ready (Prototype)',
        sosHonestyDisclaimer: 'Prototype: Nothing has been sent to your contacts or 999. Use the real actions below to call or send an SMS yourself.',
        btnCall999Direct: 'Call 999 Direct',
        btnOpenSmsApp: 'SMS Ready (Tap to open SMS app)',`
);

// Negotiation script reworded as example
html = html.replace(
  `<span data-i18n="negotiationTitle">দরকষাকষির কৌশল</span>`,
  `<span data-i18n="negotiationTitle">দরকষাকষির নমুনা উদাহরণ</span>`
);
html = html.replace(
  `negotiationTitle: 'দরকষাকষির কৌশল',`,
  `negotiationTitle: 'দরকষাকষির নমুনা উদাহরণ (রেফারেন্স)',`
);
html = html.replace(
  `negotiationTitle: 'Smart Bargaining Script',`,
  `negotiationTitle: 'Sample Negotiation Script (Example)',`
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html for Phase 1A!');
