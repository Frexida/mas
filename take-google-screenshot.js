import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('https://www.google.com');
  await page.screenshot({ path: 'google-homepage.png' });
  await browser.close();
  console.log('Screenshot saved as google-homepage.png');
})();