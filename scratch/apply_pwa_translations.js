const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add PWA Install Banner & Outdated Data notice inside tabFare
const pwaBannerHtml = `
        <!-- PWA Install Banner & Offline Version Notice -->
        <div id="pwaInstallPromptCard" class="hidden bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-sm">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-mobile-screen-button text-emerald-600 text-base"></i>
            <div>
              <strong class="block text-xs" data-i18n="pwaInstallTitle">হোম স্ক্রিনে ইনস্টল করুন</strong>
              <span class="text-[10px] text-emerald-700 dark:text-emerald-300" data-i18n="pwaInstallDesc">অফলাইনে দ্রুত ব্যবহারের জন্য নিরাপদ যাত্রা ওয়েব অ্যাপ ইনস্টল করুন।</span>
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
  html = html.replace('<section id="tabFare" class="space-y-3.5 transition-all">', '<section id="tabFare" class="space-y-3.5 transition-all">' + pwaBannerHtml);
  console.log('Added PWA Banner and Data Notice to tabFare');
}

// 2. Add keys to translations.bn
const bnKeys = `        dataVersionNotice: 'অফলাইন ডেটা সংস্করণ: ২০২৪.১০ (শেষ আপডেট: ০১ অক্টোবর ২০২৪)',
        pwaInstallTitle: 'হোম স্ক্রিনে ইনস্টল করুন',
        pwaInstallDesc: 'অফলাইনে দ্রুত ব্যবহারের জন্য নিরাপদ যাত্রা ওয়েব অ্যাপ ইনস্টল করুন।',
        btnInstallPwa: 'ইনস্টল',
        btnRunDemo: '⚡ ৩-মিনিট ডেমো চালান: ফার্মগেট ➔ গুলশান ১ (অফলাইন প্রস্তুত)',
        phStartSearch: 'যাত্রা শুরু টাইপ করুন (যেমন: ফার্মগেট, মিরপুর ১০)...',
        phEndSearch: 'গন্তব্য টাইপ করুন (যেমন: গুলশান ১, মতিঝিল)...',
        btnSwapRoute: 'স্থান অদলবদল (Swap)',
        optionsComparisonTitle: 'বাহন ও বিকল্পের তুলনা (কম খরচের ক্রমে সাজানো)',
        tapToSelect: 'ট্যাপ করে সিলেক্ট করুন',
        fareBreakdownTitle: 'ভাড়ার বিস্তারিত হিসাব (স্বচ্ছতার জন্য)',
        journeyStepsTitle: 'যাত্রাপথের বাস্তবসম্মত ধাপসমূহ',
        stepsTotal: 'মোট ধাপ',
        btnShareTripPlan: 'সম্পূর্ণ যাত্রাপরিকল্পনা শেয়ার করুন (Share Plan)',
        btnClearAllData: 'আমার লোকাল ডেটা মুছুন (Clear All My Data)',`;

const enKeys = `        dataVersionNotice: 'Offline Data Version: 2024.10 (Last Updated: 01 Oct 2024)',
        pwaInstallTitle: 'Install on Home Screen',
        pwaInstallDesc: 'Install Nirapod Jatra web app for instant offline transit estimates.',
        btnInstallPwa: 'Install',
        btnRunDemo: '⚡ Run 3-Min Demo: Farmgate ➔ Gulshan 1 (Offline Ready)',
        phStartSearch: 'Type pickup point (e.g. Farmgate, Mirpur 10)...',
        phEndSearch: 'Type destination (e.g. Gulshan 1, Motijheel)...',
        btnSwapRoute: 'Swap Route',
        optionsComparisonTitle: 'Compare Transit Options (Sorted by Cost)',
        tapToSelect: 'Tap card to view details',
        fareBreakdownTitle: 'Fare Breakdown (Named Line Items)',
        journeyStepsTitle: 'Realistic Journey Itinerary Steps',
        stepsTotal: 'Total Steps',
        btnShareTripPlan: 'Share Complete Commute Plan',
        btnClearAllData: 'Clear All My Local Data',`;

if (!html.includes('dataVersionNotice:')) {
  html = html.replace("safetyTipsTitle: 'যাত্রীদের ৫টি আবশ্যিক নিরাপত্তা পরামর্শ',", "safetyTipsTitle: 'যাত্রীদের ৫টি আবশ্যিক নিরাপত্তা পরামর্শ',\n" + bnKeys);
  html = html.replace("safetyTipsTitle: '5 Essential Commuter Safety Tips',", "safetyTipsTitle: '5 Essential Commuter Safety Tips',\n" + enKeys);
  console.log('Added translation keys for both bn and en');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Translations and PWA banners integrated successfully!');
