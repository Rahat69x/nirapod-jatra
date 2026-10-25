const { createPage } = require('./cdp_helper.js');

(async () => {
  console.log('--- TESTING PHASE 1B & 1C CORE DEMO FLOW IN BROWSER ---');
  const page = await createPage('http://localhost:3000/?test=' + Date.now());
  const consoleErrors = [];
  page.on('Runtime.consoleAPICalled', (params) => {
    if (params.type === 'error') {
      consoleErrors.push(params.args.map(a => a.value || a.description).join(' '));
    }
  });

  await new Promise(r => setTimeout(r, 1200));

  // 1. Check demo button exists
  const demoBtnText = await page.eval('document.getElementById("btnRunDemo")?.textContent.trim()');
  console.log('Demo Button Text:', demoBtnText);

  // 2. Click demo button
  await page.eval('runFarmgateGulshanDemo()');
  await new Promise(r => setTimeout(r, 1000));

  // 3. Check resultCard visible
  const isResultVisible = await page.eval('!document.getElementById("resultCard").classList.contains("hidden")');
  console.log('Result Card Visible:', isResultVisible);

  // 4. Check options rendered
  const optionsCount = await page.eval('document.querySelectorAll("#resOptionsComparisonList > div").length');
  console.log('Rendered Options Count:', optionsCount);

  // 5. Check cheapest badge
  const cheapestBadgeText = await page.eval('document.querySelector("#resOptionsComparisonList span")?.textContent.trim()');
  console.log('Cheapest Badge Text:', cheapestBadgeText);

  // 6. Check line items count
  const lineItemsCount = await page.eval('document.querySelectorAll("#resLineItemsList > div").length');
  console.log('Fare Breakdown Line Items Count:', lineItemsCount);

  // 7. Check official vs street note
  const officialNote = await page.eval('document.getElementById("officialFareComparisonNote")?.textContent.trim()');
  console.log('Official Fare Note:', officialNote);

  // 8. Check journey steps count
  const stepsCount = await page.eval('document.querySelectorAll("#resJourneyStepsList > div").length');
  console.log('Journey Steps Count:', stepsCount);

  // 9. Check share text
  const shareText = await page.eval('generateTripShareText()');
  console.log('Generated Share Text Sample:\n' + shareText.substring(0, 150) + '...');

  // 10. Check URL hash
  const currentHash = await page.eval('window.location.hash');
  console.log('Updated URL Hash:', currentHash);

  await page.close();

  // 11. Test that opening with hash loads the plan automatically in a fresh tab
  console.log('\n--- TESTING FRESH TAB HASH LOADING ---');
  const page2 = await createPage('http://localhost:3000/#start=farmgate&end=gulshan1&vehicle=cng');
  await new Promise(r => setTimeout(r, 1500));
  const hashResultVisible = await page2.eval('!document.getElementById("resultCard").classList.contains("hidden")');
  console.log('Plan auto-loaded from hash in fresh tab:', hashResultVisible);
  await page2.close();

  console.log('\nConsole Errors:', consoleErrors);
  const allPass = isResultVisible && optionsCount >= 3 && lineItemsCount >= 5 && stepsCount >= 3 && currentHash.includes('farmgate') && hashResultVisible && consoleErrors.length === 0;

  console.log('Core Demo Flow Test Result:', allPass ? 'PASS' : 'FAIL');
  process.exit(allPass ? 0 : 1);
})();
