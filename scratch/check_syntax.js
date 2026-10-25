const { createPage } = require('./cdp_helper.js');

(async () => {
  const page = await createPage('http://localhost:3000/?check=' + Date.now());
  await new Promise(r => setTimeout(r, 1500));

  const t = await page.eval('typeof handlePlaceInput');
  const win = await page.eval('typeof window.handlePlaceInput');
  console.log('typeof handlePlaceInput:', t, 'typeof window.handlePlaceInput:', win);

  await page.close();
})();
