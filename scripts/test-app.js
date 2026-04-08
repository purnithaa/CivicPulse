/**
 * CivicPulse app test script
 * Tests pages and API endpoints
 */
const BASE = process.env.TEST_BASE || 'https://civicpulse-app.vercel.app';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  ${e.message}`);
    return false;
  }
}

async function fetchOk(url, options = {}) {
  const res = await fetch(url, { ...options, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

async function run() {
  console.log(`\nTesting CivicPulse at: ${BASE}\n`);
  let passed = 0, total = 0;

  // Pages
  const pages = [
    '/',
    '/welcome',
    '/login',
    '/login?role=citizen',
    '/login?role=staff',
    '/login?role=admin',
    '/home',
    '/map',
    '/report',
    '/my-reports',
    '/profile',
    '/staff',
    '/staff/login',
    '/staff/issues',
    '/staff/leave',
    '/staff/profile',
    '/admin',
    '/admin/issues',
    '/admin/staff',
    '/admin/analytics',
    '/admin/settings',
  ];

  console.log('--- Pages ---');
  for (const path of pages) {
    total++;
    const ok = await test(`GET ${path}`, () => fetchOk(`${BASE}${path}`));
    if (ok) passed++;
  }

  // API endpoints
  console.log('\n--- APIs ---');
  const apiTests = [
    ['GET /api/issues', () => fetchOk(`${BASE}/api/issues`)],
    ['GET /api/stats', () => fetchOk(`${BASE}/api/stats`)],
    ['POST /api/auth/citizen (empty body)', () =>
      fetch(`${BASE}/api/auth/citizen`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => { if (r.status !== 200 && r.status !== 400) throw new Error(`HTTP ${r.status}`); })],
    ['POST /api/auth/staff (empty body)', () =>
      fetch(`${BASE}/api/auth/staff`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => { if (r.status !== 200 && r.status !== 400) throw new Error(`HTTP ${r.status}`); })],
    ['GET /api/staff', () => fetchOk(`${BASE}/api/staff`).catch(() => fetch(`${BASE}/api/staff`).then(r => { if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`); }))],
  ];

  for (const [name, fn] of apiTests) {
    total++;
    const ok = await test(name, fn);
    if (ok) passed++;
  }

  console.log(`\n--- Result: ${passed}/${total} passed ---\n`);
  process.exit(passed === total ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(1); });
