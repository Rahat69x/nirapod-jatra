const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  { name: 'No Rina Begum', pass: !html.includes('Rina Begum') && !html.includes('রিনা বেগম') },
  { name: 'No BRAC / DMP', pass: !html.includes('BRAC / DMP') && !html.includes('ব্র্যাক / ডিএমপি') },
  { name: 'No DMP in contacts', pass: !html.includes('জাতীয় জরুরি সেবা (DMP)') },
  { name: 'No hardcoded Farmgate coords in SOS fallback', pass: !html.includes('23.7561° N, 90.3872° E (ফার্মগেট)') },
  { name: 'SOS Honesty Disclaimer Present', pass: html.includes('প্রোটোটাইপ: আপনার কন্টাক্ট বা ৯৯৯-এ কিছু পাঠানো হয়নি') },
  { name: 'SOS 999 Direct Call Present', pass: html.includes('href="tel:999"') },
  { name: 'SOS SMS Trigger Present', pass: html.includes('id="sosSmsBtn"') },
  { name: 'Community Ledger Stored Locally Disclaimer Present', pass: html.includes('ডেমো — শুধু আপনার ফোনে সংরক্ষিত') }
];

let allPassed = true;
checks.forEach(c => {
  console.log((c.pass ? 'PASS: ' : 'FAIL: ') + c.name);
  if (!c.pass) allPassed = false;
});

if (!allPassed) {
  process.exit(1);
} else {
  console.log('ALL PHASE 1A REGRESSION CHECKS PASSED!');
}
