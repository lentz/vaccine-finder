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

      await page.type('#dateOfBirth', '08/20/1948');
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
      const stores = (await page.$$('.covid-store__store__content')).slice(0, 4);
      debugger
      for (const store of stores) {
        const storeName = await store.$eval('.covid-store__store__head span', (node) => node.innerText);
        console.log(new Date().toLocaleString(), 'Checking', storeName);
        const selectStoreBtn = await store.$('a.covid-store__store__anchor--unselected');
        await selectStoreBtn.click();
        await page.waitForTimeout(2000);
        await page.click('#continue');
        try {
          await page.waitForSelector('.covid-scheduler__invalid');
        } catch(err) {
          // Error message not found - possible availability
          console.log(new Date().toLocaleString(), `Appointments found at ${storeName}!`);
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
            html: `https://www.riteaid.com/pharmacy/covid-qualifier<br /><br />${storeName}<br /><br /><img src="cid:screenshot" />`,
            subject: `Rite Aid vaccine appointments available at ${storeName}!`,
            to: process.env.EMAILS.split(','),
          });
          process.exit();
        }
      }

      await page.waitForTimeout(30000);
    } catch(err) {
      console.error(err);
    }
    await page.close();
  }
})().catch(console.error);
