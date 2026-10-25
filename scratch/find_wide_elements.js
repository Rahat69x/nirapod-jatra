const { createPage } = require('./cdp_helper.js');

async function check() {
  const page = await createPage('http://localhost:3000/');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 800));

  const results = await page.eval(`(() => {
    const wideElements = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.scrollWidth > 320) {
        wideElements.push({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          offsetWidth: el.offsetWidth
        });
      }
    });
    return {
      bodyScrollWidth: document.body.scrollWidth,
      docScrollWidth: document.documentElement.scrollWidth,
      wideElements: wideElements.slice(0, 15)
    };
  })()`);

  console.log('Results at 320px:', JSON.stringify(results, null, 2));
  await page.close();
}

check().catch(console.error);
