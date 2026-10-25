const fs = require('fs');
const path = require('path');
const { createPage } = require('./cdp_helper.js');

const ARTIFACTS_DIR = 'C:\\Users\\Rahat\\.gemini\\antigravity-ide\\brain\\d2014276-e9f2-40fe-aeaf-20ede12b7b80';

async function capture() {
  const widths = [320, 360, 390, 768];
  for (const w of widths) {
    const page = await createPage('http://localhost:3000/');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 700,
      deviceScaleFactor: 2,
      mobile: w < 600
    });
    await new Promise(r => setTimeout(r, 1000));
    const res = await page.send('Page.captureScreenshot', {
      clip: { x: 0, y: 0, width: w, height: 260, scale: 2 }
    });
    const outFile = path.join(ARTIFACTS_DIR, `header_before_${w}px.png`);
    fs.writeFileSync(outFile, Buffer.from(res.data, 'base64'));
    console.log(`Saved header_before_${w}px.png`);
    await page.close();
  }
}

capture().catch(console.error);
