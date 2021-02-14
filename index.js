const sgMail = require('@sendgrid/mail');
const puppeteer = require('puppeteer');

require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    defaultViewport: { width: 1100, height: 1500 },
    headless: false,
  });

  while(true) {
    let page;
    try {
      page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36');

      console.log(new Date().toLocaleString(), 'Beginning vaccine check');
      await page.goto('https://www.riteaid.com/pharmacy/covid-qualifier', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#dateOfBirth', { timeout: 10000, visible: true });

      await page.type('#dateOfBirth', '08/25/1948');
      await page.click('#Occupation');
      await page.click('#noneoftheabove');
      await page.type('#city', 'Berwyn');
      await page.click('#mediconditions');
      await page.click('#noneoftheabove-medical');
      await page.focus('#eligibility_state');
      await page.type('#eligibility_state', 'Pennsylvania');
      await page.type('#zip', '19312');
      await page.click('#E_METHOD1');

      await page.click('#continue');
      await page.waitForSelector('.error-modal', { visible: true });
      const continueBtn = await page.waitForSelector('#learnmorebttn', { visible: true });
      await page.waitForTimeout(2000);
      await Promise.all([
        continueBtn.click(),
        page.waitForNavigation(),
      ]);

      // Select store page
      const findStoreBtn = await page.waitForSelector('#btn-find-store');
      await findStoreBtn.click();
      await page.waitForSelector('.covid-store__result', { visible: true });
      const selectStoreBtn = await page.waitForXPath('//a[contains(text(), "SELECT THIS STORE")]');
      await selectStoreBtn.click();
      await page.click('#continue');
      try {
        await page.waitForSelector('.covid-scheduler__invalid');
      } catch(err) {
        // Error message not found - possible availability
        console.log(new Date().toLocaleString(), 'Appointments found!');
        const screenshot = await page.screenshot({ encoding: 'base64' });
        await sgMail.send({
          attachments: [{
            filename: 'screenshot.png',
            type: 'image/png',
            content_id: 'screenshot',
            content: screenshot,
            disposition: 'inline',
          }],
          from: 'Vaccine Notifier <fantasynotify@mailinator.com>',
          html: `https://www.riteaid.com/pharmacy/covid-qualifier<br /><br /><img src="cid:screenshot" />`,
          subject: `Rite Aid vaccine appointments may be available!`,
          to: process.env.EMAILS,
        });
        process.exit();
      }

      await page.waitForTimeout(30000);
    } catch(err) {
      console.error(err);
    }
    await page.close();
  }
})().catch(console.error);
