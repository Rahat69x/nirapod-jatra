const fs = require('fs');
const path = require('path');
const { createPage } = require('./cdp_helper.js');

const ARTIFACTS_DIR = 'C:\\Users\\Rahat\\.gemini\\antigravity-ide\\brain\\d2014276-e9f2-40fe-aeaf-20ede12b7b80';

async function run() {
  const widths = [320, 360, 390, 768];
  const summary = {};

  for (const w of widths) {
    const page = await createPage('http://localhost:3000/');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 850,
      deviceScaleFactor: 2,
      mobile: w < 600
    });
    await new Promise(r => setTimeout(r, 600));

    // Clear state so it starts fresh in Bengali
    await page.eval(`
      localStorage.clear();
      sessionStorage.clear();
      window.location.hash = '';
      const tc = document.getElementById('toastContainer');
      if (tc) tc.innerHTML = '';
      if (typeof setLanguage === 'function') setLanguage('bn');
    `);
    await new Promise(r => setTimeout(r, 400));

    // Measure metrics
    const metrics = await page.eval(`(() => {
      const brand = document.getElementById('brandLogoLink')?.getBoundingClientRect();
      const themeBtn = document.getElementById('themeToggleBtn')?.getBoundingClientRect();
      const langBtn = document.getElementById('langToggleBtn')?.getBoundingClientRect();
      const menuBtn = document.getElementById('mobileMenuBtn')?.getBoundingClientRect();
      const pillBn = document.getElementById('langPillBn')?.getBoundingClientRect();
      const pillEn = document.getElementById('langPillEn')?.getBoundingClientRect();
      const subtitle = document.querySelector('header [data-i18n="appSubtitle"]')?.getBoundingClientRect();
      const banner = document.querySelector('header [data-i18n="bannerProblem"]')?.getBoundingClientRect();
      const weather = document.getElementById('liveWeatherBadge')?.getBoundingClientRect();
      const header = document.querySelector('header')?.getBoundingClientRect();

      const docScrollWidth = document.documentElement.scrollWidth;
      const winInnerWidth = window.innerWidth;
      const bodyScrollWidth = document.body.scrollWidth;

      // Check any element overflowing viewport
      const overflowing = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > winInnerWidth + 0.5) {
          overflowing.push({
            tag: el.tagName,
            id: el.id || '',
            class: (el.className || '').toString().slice(0, 50),
            right: Math.round(r.right),
            width: Math.round(r.width)
          });
        }
      });

      return {
        brand: brand ? { w: Math.round(brand.width), h: Math.round(brand.height) } : null,
        themeBtn: themeBtn ? { w: Math.round(themeBtn.width), h: Math.round(themeBtn.height) } : null,
        langBtn: langBtn ? { w: Math.round(langBtn.width), h: Math.round(langBtn.height) } : null,
        menuBtn: menuBtn ? { w: Math.round(menuBtn.width), h: Math.round(menuBtn.height) } : null,
        pillBn: pillBn ? { w: Math.round(pillBn.width), h: Math.round(pillBn.height) } : null,
        pillEn: pillEn ? { w: Math.round(pillEn.width), h: Math.round(pillEn.height) } : null,
        subtitle: subtitle ? { w: Math.round(subtitle.width), h: Math.round(subtitle.height) } : null,
        banner: banner ? { w: Math.round(banner.width), h: Math.round(banner.height) } : null,
        weather: weather ? { w: Math.round(weather.width), h: Math.round(weather.height) } : null,
        header: header ? { w: Math.round(header.width), h: Math.round(header.height) } : null,
        docScrollWidth,
        bodyScrollWidth,
        winInnerWidth,
        hasHorizontalScroll: docScrollWidth > winInnerWidth,
        overflowCount: overflowing.length,
        overflowing: overflowing.slice(0, 5)
      };
    })()`);

    summary[w] = metrics;
    console.log(`\n=== Viewport ${w}px ===`);
    console.log('Document scrollWidth vs innerWidth:', metrics.docScrollWidth, 'vs', metrics.winInnerWidth);
    console.log('Has horizontal scroll?', metrics.hasHorizontalScroll);
    console.log('Control heights (theme, lang, menu):', metrics.themeBtn?.h, metrics.langBtn?.h, metrics.menuBtn?.h);
    console.log('Language pills [বাং, EN]:', metrics.pillBn, metrics.pillEn);
    console.log('Overflowing elements count:', metrics.overflowCount);
    if (metrics.overflowCount > 0) {
      console.log('Sample overflowing elements:', metrics.overflowing);
    }

    // Capture screenshot of header region (0, 0, w, 220)
    const ss = await page.send('Page.captureScreenshot', {
      clip: { x: 0, y: 0, width: w, height: 230, scale: 2 }
    });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, `header_after_${w}px.png`), Buffer.from(ss.data, 'base64'));
    console.log(`Saved screenshot: header_after_${w}px.png`);

    // If 360px, also test switching to English and taking screenshot
    if (w === 360) {
      await page.eval(`
        const langBtn = document.getElementById('langToggleBtn');
        if (langBtn) langBtn.click();
      `);
      await new Promise(r => setTimeout(r, 400));
      const ssEn = await page.send('Page.captureScreenshot', {
        clip: { x: 0, y: 0, width: w, height: 230, scale: 2 }
      });
      fs.writeFileSync(path.join(ARTIFACTS_DIR, `header_after_360px_en.png`), Buffer.from(ssEn.data, 'base64'));
      console.log(`Saved screenshot: header_after_360px_en.png (English mode)`);
    }

    await page.close();
  }

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
}

run().catch(err => {
  console.error('Error running verification:', err);
  process.exit(1);
});
