import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://www.google.com');
  await page.screenshot({ path: 'google-homepage.png' });
  await browser.close();
  console.log('Googleのホームページのスクリーンショットをgoogle-homepage.pngに保存しました');
})();