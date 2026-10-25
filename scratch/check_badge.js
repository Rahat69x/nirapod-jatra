const { createPage } = require('./cdp_helper.js');
(async () => {
  const page = await createPage('http://localhost:3000/');
  await new Promise(r => setTimeout(r, 500));
  await page.eval('localStorage.clear(); location.reload();');
  await new Promise(r => setTimeout(r, 1200));

  const lang = await page.eval('state.language');
  await page.eval('runFarmgateGulshanDemo()');
  const badge = await page.eval('document.querySelector("#resOptionsComparisonList span")?.textContent.trim()');
  const cheapestBadge = await page.eval('Array.from(document.querySelectorAll("#resOptionsComparisonList span")).find(s => s.textContent.includes("সবচেয়ে সাশ্রয়ী"))?.textContent');
  
  console.log('Default cold-start state.language:', lang);
  console.log('Cheapest Badge text in Bangla:', cheapestBadge);
  await page.close();
  process.exit(lang === 'bn' && cheapestBadge ? 0 : 1);
})();
