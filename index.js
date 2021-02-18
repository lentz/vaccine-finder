const { interval, from, of } = require('rxjs');
const { delay, filter, map, repeat, switchMap, take, tap } = require('rxjs/operators');
const got = require('got');
const sgMail = require('@sendgrid/mail');
const puppeteer = require('puppeteer');

require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const stores = [
  {
    active: true,
    number: 1144,
    address: '500 Chesterbrook Blvd Ste 2, Chesterbrook, PA 19087',
  },
  {
    active: true,
    number: 11119,
    address: '644 West Lancaster Ave., Wayne, PA 19087',
  },
  {
    active: true,
    number: 995,
    address: '237 East Lancaster Avenue, Wayne, PA 19087',
  },
  {
    active: true,
    number: 11158,
    address: '160 North Gulph Road Ste1088, King Of Prussia, PA 19406',
  },
];

async function checkRiteAidV2() {
  for (const store of stores) {
    try {
      console.log(new Date().toLocaleString(), `Checking ${store.address}`);
      const checkResp = await got(
        'https://www.riteaid.com/services/ext/v2/vaccine/checkSlots',
        {
          headers: {
            cookie: 'check=true;',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
            referer: 'https://www.riteaid.com/pharmacy/apt-scheduler',
          },
          searchParams: { storeNumber: store.number },
        },
      ).json();

      if (checkResp.Data.slots['1'] !== false) {
        console.log(`Appointments found at Rite Aid ${store.address}`);
        console.log(checkResp);
      }
    } catch(err) {
      console.error(`Error checking ${store.number}: ${err.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

interval(5000).pipe(
  take(stores.length),
  map((val) => stores[val]),
  filter((store) => store.active),
  switchMap((store) => from(got(
    'https://www.riteaid.com/services/ext/v2/vaccine/checkSlots',
    {
      headers: {
        cookie: 'check=true;',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
        referer: 'https://www.riteaid.com/pharmacy/apt-scheduler',
      },
      searchParams: { storeNumber: store.number },
    },
  ).json())),
  repeat(),
)
.subscribe(console.log);
