const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('framenavigated', frame => {
      if(frame === page.mainFrame()) {
          console.log('NAVIGATED TO:', frame.url());
      }
  });

  console.log('Visiting auth.html (Already logged in from previous test)...');
  await page.goto('http://localhost:5000/auth.html');
  
  await page.waitForTimeout(10000); // Wait 10 seconds to observe any redirects or reloads
  console.log('Done waiting.');
  
  await browser.close();
})();
