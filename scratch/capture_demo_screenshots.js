const fs = require('fs');
const path = require('path');
const { createPage } = require('./cdp_helper.js');

const ARTIFACTS_DIR = 'C:\\Users\\Rahat\\.gemini\\antigravity-ide\\brain\\d2014276-e9f2-40fe-aeaf-20ede12b7b80';

async function captureScreenshots() {
  console.log('Capturing 9 preview screenshots at 360 px...');
  
  const page = await createPage('http://localhost:3000/');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 780,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.eval('localStorage.clear(); setLanguage("bn");');
  await new Promise(r => setTimeout(r, 600));

  async function snap(filename, scrollY = 0) {
    if (scrollY > 0) {
      await page.eval(`window.scrollTo(0, ${scrollY})`);
      await new Promise(r => setTimeout(r, 400));
    }
    const res = await page.send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved: ${filename} (${fs.statSync(filePath).size} bytes)`);
  }

  // 1. Home
  await page.eval('window.scrollTo(0, 0)');
  await new Promise(r => setTimeout(r, 400));
  await snap('preview_01_home_360.png');

  // 2. Mobile Menu
  await page.eval('openMobileMenu()');
  await new Promise(r => setTimeout(r, 500));
  await snap('preview_02_mobile_menu_360.png');
  await page.eval('closeMobileMenu()');
  await new Promise(r => setTimeout(r, 400));

  // 3. Option Comparison with Cheapest Badge
  await page.eval('runFarmgateGulshanDemo()');
  await new Promise(r => setTimeout(r, 800));
  // Scroll to result card
  await page.eval('document.getElementById("resultCard").scrollIntoView({ behavior: "instant", block: "start" })');
  await new Promise(r => setTimeout(r, 500));
  await snap('preview_03_options_cheapest_360.png');

  // 4. Fare Breakdown with Source
  await page.eval('document.getElementById("resLineItemsList").scrollIntoView({ behavior: "instant", block: "center" })');
  await new Promise(r => setTimeout(r, 500));
  await snap('preview_04_fare_breakdown_360.png');

  // 5. Journey Steps
  await page.eval('document.getElementById("resJourneyStepsList").scrollIntoView({ behavior: "instant", block: "center" })');
  await new Promise(r => setTimeout(r, 500));
  await snap('preview_05_journey_steps_360.png');

  // 6. Share Buttons & Copied Toast
  await page.eval('copyTripShareText()');
  await page.eval('document.querySelector("[data-i18n=\\"btnShareTripPlan\\"]").scrollIntoView({ behavior: "instant", block: "center" })');
  await new Promise(r => setTimeout(r, 600));
  await snap('preview_06_share_message_360.png');

  // 7. SOS Screen
  await page.eval('openSosConfirmModal()');
  await page.eval('executeSosTrigger()');
  await new Promise(r => setTimeout(r, 500));
  await snap('preview_07_sos_screen_360.png');
  await page.eval('closeSosReceiptModal()');
  await new Promise(r => setTimeout(r, 400));

  // 8. Offline Notice / Simulation Mode
  await page.eval('window.dispatchEvent(new Event("offline"))');
  await new Promise(r => setTimeout(r, 600));
  await page.eval('window.scrollTo(0, 0)');
  await new Promise(r => setTimeout(r, 400));
  await snap('preview_08_offline_notice_360.png');

  await page.close();

  // 9. 404 Page
  const page404 = await createPage('http://localhost:3000/non-existent-page');
  await page404.send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 780,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1000));
  const res404 = await page404.send('Page.captureScreenshot', { format: 'png' });
  const p404 = path.join(ARTIFACTS_DIR, 'preview_09_404_page_360.png');
  fs.writeFileSync(p404, Buffer.from(res404.data, 'base64'));
  console.log(`Saved: preview_09_404_page_360.png (${fs.statSync(p404).size} bytes)`);
  await page404.close();

  console.log('All 9 preview screenshots captured successfully!');
}

captureScreenshots().catch(console.error);
