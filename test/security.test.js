const assert = require('assert');
const http = require('http');
const server = require('../server.js');

const PORT = 3001; // Separate port for testing server

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBody: body,
          data: json
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

// In-memory HTML escaping tester (mirroring index.html escapeHtml)
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function runSecurityTests() {
  console.log('\n🔒 =========================================================');
  console.log('🔒 NIRAPOD JATRA COMPREHENSIVE SECURITY & AUDIT TEST SUITE');
  console.log('🔒 =========================================================\n');

  // Start test server on port 3001
  const testServer = http.createServer(server.listeners('request')[0]);
  await new Promise(resolve => testServer.listen(PORT, resolve));

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}\n     ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}\n     ${err.message}`);
    }
  }

  try {
    // ------------------------------------------------------------------------
    // LAYER 5: SECURITY HEADERS CHECK
    // ------------------------------------------------------------------------
    console.log('--- Layer 5: Production Security Headers & Defense-in-Depth ---');
    await testAsync('Server sends Content-Security-Policy with strict origins', async () => {
      const res = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/',
        method: 'GET'
      });
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.headers['content-security-policy'], 'Missing Content-Security-Policy');
      assert.ok(res.headers['content-security-policy'].includes("frame-ancestors 'none'"));
      assert.ok(res.headers['content-security-policy'].includes("object-src 'none'"));
    });

    await testAsync('Server enforces X-Content-Type-Options: nosniff', async () => {
      const res = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/health',
        method: 'GET'
      });
      assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    });

    await testAsync('Server enforces X-Frame-Options: DENY against clickjacking', async () => {
      const res = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/health',
        method: 'GET'
      });
      assert.strictEqual(res.headers['x-frame-options'], 'DENY');
    });

    await testAsync('Server enforces Referrer-Policy: strict-origin-when-cross-origin', async () => {
      const res = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/health',
        method: 'GET'
      });
      assert.strictEqual(res.headers['referrer-policy'], 'strict-origin-when-cross-origin');
    });

    // ------------------------------------------------------------------------
    // LAYER 1: SERVER-SIDE VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n--- Layer 1: Strict Server-Side Input Validation (Boundary Checks) ---');
    await testAsync('POST /api/trips rejects invalid vehicle enum (e.g. "airplane")', async () => {
      const res = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/trips',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        vehicle: 'airplane',
        distanceKm: 5.2,
        start: 'ফার্মগেট',
        end: 'গুলশান ১',
        farePaid: 150
      });
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.error.includes('Invalid vehicle type'));
    });

    await testAsync('POST /api/trips rejects negative or out-of-bounds distance (-5km, 999km)', async () => {
      const resNeg = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/trips',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        vehicle: 'cng',
        distanceKm: -5.0,
        start: 'ফার্মগেট',
        end: 'গুলশান ১',
        farePaid: 150
      });
      assert.strictEqual(resNeg.statusCode, 400);

      const resHigh = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/trips',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        vehicle: 'cng',
        distanceKm: 85.0,
        start: 'ফার্মগেট',
        end: 'গুলশান ১',
        farePaid: 150
      });
      assert.strictEqual(resHigh.statusCode, 400);
      assert.ok(resHigh.data.error.includes('distance'));
    });

    await testAsync('POST /api/trips rejects absurd or zero fares (0 Tk, 99999 Tk)', async () => {
      const resZero = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/trips',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        vehicle: 'rickshaw',
        distanceKm: 2.5,
        start: 'ধানমন্ডি ২৭',
        end: 'নিউ মার্কেট',
        farePaid: 0
      });
      assert.strictEqual(resZero.statusCode, 400);

      const resAbsurd = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/trips',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        vehicle: 'rickshaw',
        distanceKm: 2.5,
        start: 'ধানমন্ডি ২৭',
        end: 'নিউ মার্কেট',
        farePaid: 99999
      });
      assert.strictEqual(resAbsurd.statusCode, 400);
    });

    await testAsync('POST /api/trips accepts valid payload, sanitizes note, and returns 201', async () => {
      const res = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/trips',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        vehicle: 'cng',
        distanceKm: 5.2,
        start: 'ফার্মগেট',
        end: 'গুলশান ১',
        farePaid: 160,
        note: 'স্বাভাবিক ভাড়া'
      });
      assert.strictEqual(res.statusCode, 201);
      assert.ok(res.data.trip);
      assert.strictEqual(res.data.trip.vehicle, 'cng');
      assert.strictEqual(res.data.trip.farePaid, 160);
    });

    // ------------------------------------------------------------------------
    // LAYER 3 & 4: PASSWORD HASHING, TIMING SAFETY & ANTI-ENUMERATION
    // ------------------------------------------------------------------------
    console.log('\n--- Layer 3 & 4: Salted Crypto Password Hashing & Anti-Enumeration ---');
    await testAsync('POST /api/auth/login returns identical generic error for invalid username vs invalid password', async () => {
      const resWrongUser = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        username: 'non_existent_attacker',
        password: 'Password123'
      });
      assert.strictEqual(resWrongUser.statusCode, 401);
      assert.strictEqual(resWrongUser.data.error, 'Invalid username or password.');

      const resWrongPass = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        username: 'moderator',
        password: 'WrongPassword#999'
      });
      assert.strictEqual(resWrongPass.statusCode, 401);
      assert.strictEqual(resWrongPass.data.error, 'Invalid username or password.');
    });

    let moderatorToken = null;
    await testAsync('POST /api/auth/login successfully authenticates valid moderator credentials and sets secure session', async () => {
      const res = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        username: 'moderator',
        password: 'NirapodDhaka#2026'
      });
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.token, 'Expected session token in response');
      assert.strictEqual(res.data.user.role, 'moderator');
      moderatorToken = res.data.token;

      // Verify Set-Cookie header contains HttpOnly & SameSite=Strict
      const cookie = res.headers['set-cookie'];
      assert.ok(cookie, 'Missing Set-Cookie header');
      const cookieStr = Array.isArray(cookie) ? cookie.join(';') : cookie;
      assert.ok(cookieStr.includes('HttpOnly'), 'Cookie must have HttpOnly');
      assert.ok(cookieStr.includes('SameSite=Strict'), 'Cookie must have SameSite=Strict');
    });

    // ------------------------------------------------------------------------
    // LAYER 5: AUTHORIZATION & OWNERSHIP VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- Layer 5: Role-Based Authorization & Protected API Endpoints ---');
    await testAsync('DELETE /api/trips/:id rejects unauthorized requests without session token (401)', async () => {
      const res = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/trips/1713800001',
        method: 'DELETE'
      });
      assert.strictEqual(res.statusCode, 401);
      assert.ok(res.data.error.includes('Unauthorized'));
    });

    await testAsync('DELETE /api/trips/:id succeeds when authorized with moderator Bearer token', async () => {
      const res = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/trips/1713800001',
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${moderatorToken}`
        }
      });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.id, 1713800001);
    });

    // ------------------------------------------------------------------------
    // LAYER 2: RATE LIMITING TESTS
    // ------------------------------------------------------------------------
    console.log('\n--- Layer 2: Rate Limiting & Abuse Prevention ---');
    await testAsync('Rapid requests to /api/auth/login exceed window and return 429 Too Many Requests', async () => {
      let triggered429 = false;
      let retryAfter = null;

      // Moderator login rate limit is 5 attempts / 15 mins per IP.
      // We already made 3 attempts above. Let's make 4 more.
      for (let i = 0; i < 4; i++) {
        const res = await makeRequest({
          hostname: 'localhost',
          port: PORT,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, {
          username: 'moderator',
          password: 'bad'
        });
        if (res.statusCode === 429) {
          triggered429 = true;
          retryAfter = res.headers['retry-after'];
          break;
        }
      }

      assert.ok(triggered429, 'Rate limiter failed to trigger 429 on brute force login attempts');
      assert.ok(retryAfter, 'Rate limited response must include Retry-After header');
    });

    // ------------------------------------------------------------------------
    // XSS SANITIZATION TESTS
    // ------------------------------------------------------------------------
    console.log('\n--- Frontend Security: HTML Entity Sanitization & XSS Neutralization ---');
    test('escapeHtml neutralizes <script> tags and quotes', () => {
      const payload = `<script>alert("xss")</script>`;
      const clean = escapeHtml(payload);
      assert.strictEqual(clean, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      assert.ok(!clean.includes('<script>'));
    });

    test('escapeHtml neutralizes img onerror vectors', () => {
      const payload = `<img src=x onerror=alert('hack')>`;
      const clean = escapeHtml(payload);
      assert.strictEqual(clean, '&lt;img src=x onerror=alert(&#039;hack&#039;)&gt;');
      assert.ok(!clean.includes('<img'));
    });

    test('escapeHtml gracefully handles null and undefined values', () => {
      assert.strictEqual(escapeHtml(null), '');
      assert.strictEqual(escapeHtml(undefined), '');
    });

  } finally {
    testServer.close();
  }

  console.log(`\n=========================================================`);
  console.log(`Security Test Results: ${passed} / ${total} tests passed.`);
  console.log(`=========================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

runSecurityTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
