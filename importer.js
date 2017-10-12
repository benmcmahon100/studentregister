require('dotenv').load();
const puppeteer = require('puppeteer');
const fs = require('fs-extra');

fs.readFile('./users.csv', 'utf-8').then(async (input) => {
  // Creates a browser window to be used for input
  // we don't run it headless-ly so it can be unstuck as needed
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // We're assuming data all on one line with each student ID separated by a comma
  // Disabling eslint because data is actually mutated
  // eslint-disable-next-line
  let data = input.split(/,/gi);

  // Going to loop to get a login screen
  await page.goto('https://loop.dcu.ie', { waitUntil: 'networkidle' });

  // Grabbing the login link from the landing page and making our way to the login form
  const link = await page.$eval('.loginrow > a', el => el.href);
  await page.goto(link, { waitUntil: 'networkidle' });

  setTimeout(async () => {
    // Focuses and inputs our user credentials from our env file
    await page.click('input[type="text"]');
    await page.type(process.env.username);
    await page.click('input[type="password"]');
    await page.type(process.env.password);
    await page.click('button[type="submit"]');

    setTimeout(() => {
      // This is a weird hacky fix because it didn't like going straight from loop to the system
      // It's not too bad because it only happens once
      page.goto('https://google.com', { waitUntil: 'networkidle' }).then(async () => {
        // Start looping through our IDs
        while (data.length > 0) {
          const studentID = data.shift();
          // Moves to the page that's used for inputting student IDs
          page.goto('https://websvc.dcu.ie/clubs/socs/register', { waitUntil: 'networkidle' })
            .then(async () => {
              // Inserts and submits the student ID
              console.log('processing student id ->', studentID);
              await page.waitForSelector('#form_id');
              await page.click('#form_id');
              await page.type(studentID);
              await page.click('button[type="submit"]');
              // Joins the member to the society
              await page.waitForSelector('input[type="checkbox"]');
              await page.click('input[type="checkbox"]');
              await page.click('button[type="submit"]');
            });
        }
      });
    }, 3000);
  }, 1000);
});
