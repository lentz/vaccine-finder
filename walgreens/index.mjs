// import { interval, from, of } from 'rxjs';
// import { delay, filter, map, repeat, switchMap, take, tap } from 'rxjs/operators';
import sgMail from '@sendgrid/mail';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: { width: 1100, height: 1500 },
});
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36');
await page.goto('https://www.walgreens.com/findcare/vaccination/covid-19?ban=covid_vaccine_landing_schedule');
const scheduleBtn = await page.waitForSelector('.getstarted-btn a');
await Promise.all([
  scheduleBtn.click(),
  page.waitForNavigation(),
]);
const zipCodeInput = await page.waitForSelector('#inputLocation');
await page.$eval('#inputLocation', el => el.value = '');
await zipCodeInput.type('20148');
await page.click('.LocationSearch_container button');

await page.waitForSelector('div.alert__red');

// interval(5000).pipe(
//   repeat(),
// )
// .subscribe(console.log);
