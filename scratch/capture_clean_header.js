const fs = require('fs');
const path = require('path');
const { createPage } = require('./cdp_helper.js');

const ARTIFACTS_DIR = 'C:\\Users\\Rahat\\.gemini\\antigravity-ide\\brain\\d2014276-e9f2-40fe-aeaf-20ede12b7b80';

async function run() {
  const widths = [320, 360, 390, 768];
  for (const w of widths) {
    const page = await createPage('http://localhost:3000/');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 800,
      deviceScaleFactor: 2,
      mobile: w < 600
    });
    await new Promise(r => setTimeout(r, 600));
    await page.eval(`
      localStorage.clear();
      sessionStorage.clear();
      window.location.hash = '';
      const t = document.getElementById('toast');
      if (t) t.remove();
    `);
    await new Promise(r => setTimeout(r, 400));

    // Measure elements
    const metrics = await page.eval(`(() => {
      const brand = document.getElementById('brandLogoLink')?.getBoundingClientRect();
      const themeBtn = document.getElementById('themeToggleBtn')?.getBoundingClientRect();
      const langBtn = document.getElementById('langToggleBtn')?.getBoundingClientRect();
      const menuBtn = document.getElementById('mobileMenuBtn')?.getBoundingClientRect();
      const banner = document.querySelector('header .bg-white\\\\/10')?.getBoundingClientRect();
      const weather = document.getElementById('liveWeatherBadge')?.getBoundingClientRect();
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      
      // Check overflowing elements
      const overflowing = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > winWidth + 1) {
          overflowing.push({ tag: el.tagName, id: el.id, class: el.className, right: r.right, width: r.width });
        }
      });

      return {
        brand, themeBtn, langBtn, menuBtn, banner, weather,
        docWidth, winWidth, overflowing: overflowing.slice(0, 10)
      };
    })()`);

    console.log(`\n=== Viewport ${w}px ===`);
    console.log('Document scrollWidth vs innerWidth:', metrics.docWidth, metrics.winWidth);
    console.log('Theme button rect:', metrics.themeBtn);
    console.log('Lang button rect:', metrics.langBtn);
    console.log('Menu button rect:', metrics.menuBtn);
    console.log('Brand rect:', metrics.brand);
    console.log('Overflowing elements count:', metrics.overflowing.length);
    if (metrics.overflowing.length > 0) {
      console.log('Top overflowing elements:', metrics.overflowing);
    }

    const res = await page.send('Page.captureScreenshot', {
      clip: { x: 0, y: 0, width: w, height: 200, scale: 2 }
    });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, `header_clean_${w}px.png`), Buffer.from(res.data, 'base64'));
    await page.close();
  }
}

run().catch(console.error);
