const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>RentAll Quick UI</title>
    <style>
      body { font-family: Arial, sans-serif; margin:20px; background:#f3f4f6 }
      .grid { display:grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap:12px }
      .card { background:#fff; border-radius:8px; padding:8px; box-shadow:0 2px 6px rgba(0,0,0,0.06) }
      .card img { width:100%; height:140px; object-fit:cover; border-radius:6px }
      .price { color:#2a9d8f; font-weight:700 }
    </style>
  </head>
  <body>
    <h1>RentAll - API Listings</h1>
    <div id="grid" class="grid">Loading...</div>
    <script>
      (async function(){
        try {
          const res = await fetch('http://localhost:3000/api/listings');
          const items = await res.json();
          const grid = document.getElementById('grid');
          grid.innerHTML = '';
          items.forEach(i => {
            const d = document.createElement('div'); d.className='card';
            d.innerHTML = '<img src="' + (i.image || '') + '" alt=""><h3>' + (i.title || '') + '</h3><p class="price">$' + (i.price || '') + '/day</p><p>' + (i.location || '') + '</p>';
            grid.appendChild(d);
          });
        } catch (e) {
          document.getElementById('grid').textContent = 'Error fetching API: '+e.message;
        }
        window.__done = true;
      })();
    </script>
  </body>
  </html>
  `;

  const out = path.join(__dirname, '..', 'screenshot.png');
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.setContent(html, { waitUntil: 'networkidle2' });
  // wait for our script to set window.__done
  await page.waitForFunction('window.__done === true', { timeout: 5000 }).catch(()=>{});
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log('Saved screenshot to', out);
})();
