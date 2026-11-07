import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function measurePerformance() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const routes = [
    { name: 'Homepage', url: 'http://localhost:5173/' },
    { name: 'New Vehicles Catalogue', url: 'http://localhost:5173/vehicles' },
    { name: 'Vehicle Detail', url: 'http://localhost:5173/vehicles/vantara-aria' },
    { name: 'Certified Used Cars', url: 'http://localhost:5173/certified' },
    {
      name: 'Certified Detail',
      url: 'http://localhost:5173/certified/vantara-solis-ev-2023-up32ab1234',
    },
    { name: 'Test Drive Booking', url: 'http://localhost:5173/test-drive' },
    { name: 'Service Booking', url: 'http://localhost:5173/service' },
    { name: 'Staff Login', url: 'http://localhost:5173/staff/login' },
  ];

  const measurements = [];

  for (const r of routes) {
    const start = performance.now();
    await page.goto(r.url, { waitUntil: 'networkidle0' });
    const totalTimeMs = Math.round(performance.now() - start);

    const timing = JSON.parse(
      await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        return JSON.stringify({
          ttfb: Math.round(perf.responseStart - perf.requestStart),
          domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.startTime),
          load: Math.round(perf.loadEventEnd - perf.startTime),
        });
      }),
    );

    measurements.push({
      page: r.name,
      url: r.url,
      totalLoadMs: totalTimeMs,
      ttfbMs: timing.ttfb,
      domContentLoadedMs: timing.domContentLoaded,
      loadEventMs: timing.load,
    });

    console.log(
      `[${r.name}] Total: ${totalTimeMs}ms | TTFB: ${timing.ttfb}ms | DCL: ${timing.domContentLoaded}ms | Load: ${timing.load}ms`,
    );
  }

  // Measure Lead Assignment API latency
  const shRes = await fetch('http://127.0.0.1:4000/api/showrooms');
  const shData = await shRes.json();
  const realShowroomId = shData.data[0].id;

  const apiStart = performance.now();
  const testSuffix = Math.floor(10000 + Math.random() * 90000).toString();
  const res = await fetch('http://127.0.0.1:4000/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: `Perf Test ${testSuffix}`,
      phone: `99${testSuffix}000`,
      email: `perf.${testSuffix}@example.com`,
      showroomId: realShowroomId,
      privacyConsent: true,
    }),
  });
  const assignmentDurationMs = Math.round(performance.now() - apiStart);
  console.log(
    `[Lead Ingestion & Assignment API] Duration: ${assignmentDurationMs}ms (Status: ${res.status})`,
  );

  await browser.close();

  fs.writeFileSync(
    'submission/performance-audit.json',
    JSON.stringify({ measurements, assignmentDurationMs }, null, 2),
  );
}

measurePerformance();
