const { createPage } = require('./cdp_helper.js');

(async () => {
  const page = await createPage('http://localhost:3000/?test=' + Date.now());
  const consoleErrors = [];
  page.on('Runtime.consoleAPICalled', (params) => {
    if (params.type === 'error') {
      consoleErrors.push(params.args.map(a => a.value || a.description).join(' '));
    }
  });

  await new Promise(r => setTimeout(r, 1500));

  const title = await page.eval('document.title');
  const honestyNotice = await page.eval('document.getElementById("sosHonestyDisclaimer") ? document.getElementById("sosHonestyDisclaimer").textContent.trim() : null');
  const mockDriver = await page.eval('MOCK_DRIVERS_DB[2].driverNameBn');
  const dmpCheck = await page.eval('DEFAULT_SOS_CONTACTS[0].name');

  console.log('Page Title:', title);
  console.log('Honesty Notice:', honestyNotice);
  console.log('Driver 3 Name:', mockDriver);
  console.log('Default SOS Contact 1:', dmpCheck);
  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }

  await page.close();
  const passed = honestyNotice && mockDriver === 'কাল্পনিক চালক ৩ (ডেমো)' && dmpCheck === 'জাতীয় জরুরি সেবা (৯৯৯)';
  console.log('Phase 1A Browser Check Result:', passed ? 'PASS' : 'FAIL');
  process.exit(passed && consoleErrors.length === 0 ? 0 : 1);
})();
