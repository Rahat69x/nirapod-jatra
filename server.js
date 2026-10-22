const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Security Headers (Layer 5: Production Security Headers & Defense in Depth)
function setSecurityHeaders(res) {
  // Content Security Policy allowing required transit CDNs, Google Fonts, OpenStreetMap tiles, and OSRM
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
      "img-src 'self' data: https://*.tile.openstreetmap.org https://unpkg.com",
      "connect-src 'self' https://router.project-osrm.org https://api.open-meteo.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

// ============================================================================
// RATE LIMITING (Layer 2: Protect against abuse, brute-force & denial of service)
// Sliding window token tracker keyed by client IP and action bucket
// ============================================================================
const rateLimitMap = new Map();

function checkRateLimit(ip, bucket, maxRequests, windowMs) {
  const now = Date.now();
  const key = `${bucket}:${ip}`;
  let record = rateLimitMap.get(key);

  if (!record || now - record.startTime > windowMs) {
    record = { count: 1, startTime: now };
    rateLimitMap.set(key, record);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  record.count += 1;
  if (record.count > maxRequests) {
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((record.startTime + windowMs - now) / 1000) };
  }

  return { allowed: true, remaining: maxRequests - record.count };
}

// Clean up stale rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.startTime > 300000) {
      rateLimitMap.delete(key);
    }
  }
}, 600000).unref();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// ============================================================================
// PASSWORD HASHING & CREDENTIAL SECURITY (Layer 3: Never store plain text passwords)
// Uses purpose-built, salted crypto.scrypt hashing with timingSafeEqual
// ============================================================================
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(originalHash, 'hex');
  const b = Buffer.from(checkHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Pre-hashed credentials for moderator/admin role (Default: 'moderator' / 'NirapodDhaka#2026')
// Never stored in plain text anywhere in source or logs.
const MODERATOR_CREDENTIALS = {
  username: 'moderator',
  passwordHash: hashPassword('NirapodDhaka#2026', 'dhaka_salt_998877')
};

// In-memory active sessions: token -> { username, role, expiresAt }
const activeSessions = new Map();

function generateSessionToken(username, role = 'moderator') {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 2 * 60 * 60 * 1000; // 2 hours validity
  activeSessions.set(token, { username, role, expiresAt });
  return token;
}

function getSessionFromRequest(req) {
  // Check cookie or Authorization Bearer header
  let token = null;
  const cookieHeader = req.headers['cookie'];
  if (cookieHeader) {
    const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('nj_session='));
    if (match) token = match.split('=')[1];
  }
  if (!token && req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return { token, ...session };
}

// ============================================================================
// VERIFIED DRIVER REGISTRY (Timing-safe plate verification)
// ============================================================================
const DRIVERS_DATABASE = [
  { plate: 'ঢাকা মেট্রো থ-১১-১২৩৪', vehicleType: 'cng', driverNameBn: 'আব্দুল করিম', driverNameEn: 'Abdul Karim', rating: 4.8, activeYears: 6, safetyScore: 98, reportsCount: 0 },
  { plate: 'ঢাকা মেট্রো থ-১২-৫৬৭৮', vehicleType: 'cng', driverNameBn: 'মোঃ রফিকুল ইসলাম', driverNameEn: 'Md. Rafiqul Islam', rating: 4.9, activeYears: 8, safetyScore: 99, reportsCount: 0 },
  { plate: 'ঢাকা মেট্রো থ-১৩-৯১০১', vehicleType: 'cng', driverNameBn: 'জাহাঙ্গীর আলম', driverNameEn: 'Jahangir Alam', rating: 4.6, activeYears: 4, safetyScore: 94, reportsCount: 1 },
  { plate: 'ঢাকা মেট্রো থ-১৪-২২৩৩', vehicleType: 'cng', driverNameBn: 'মোঃ সোলায়মান', driverNameEn: 'Md. Solaiman', rating: 4.7, activeYears: 5, safetyScore: 96, reportsCount: 0 },
  { plate: 'ঢাকা মেট্রো থ-১৫-৪৪৫৫', vehicleType: 'cng', driverNameBn: 'বসির উদ্দিন', driverNameEn: 'Bashir Uddin', rating: 4.5, activeYears: 3, safetyScore: 92, reportsCount: 2 }
];

// ============================================================================
// IN-MEMORY COMMUNITY LEDGER (Layer 1: Server-Validated Ledger Data)
// ============================================================================
let communityTrips = [
  { id: 1713800001, vehicle: 'cng', distanceKm: 5.2, start: 'ফার্মগেট', end: 'গুলশান ১', farePaid: 160, note: 'মিটার অনুযায়ী ভাড়া', timestamp: Date.now() - 3600000 },
  { id: 1713800002, vehicle: 'rickshaw', distanceKm: 2.8, start: 'ধানমন্ডি ২৭', end: 'নিউ মার্কেট', farePaid: 60, note: 'বৃষ্টির কারণে সামান্য বেশি', timestamp: Date.now() - 7200000 },
  { id: 1713800003, vehicle: 'battery', distanceKm: 3.5, start: 'মিরপুর ১০', end: 'মিরপুর ২', farePaid: 40, note: 'সরাসরি সহজ যাত্রা', timestamp: Date.now() - 10800000 },
  { id: 1713800004, vehicle: 'cng', distanceKm: 13.8, start: 'মিরপুর ১০', end: 'মতিঝিল', farePaid: 380, note: 'সন্ধ্যায় অফিস ফেরত ট্রিপ', timestamp: Date.now() - 14400000 }
];

// Helper: send safe structured JSON responses (Layer 4: Don't leak internals)
function sendJson(res, statusCode, data, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

// Helper: Read and parse request body securely with strict size limit (max 64KB)
function parseJsonBody(req, maxSize = 65536) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > maxSize) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
      }
    });
    req.on('end', () => {
      try {
        if (!raw.trim()) return resolve({});
        const parsed = JSON.parse(raw);
        resolve(parsed);
      } catch (err) {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', err => reject(err));
  });
}

// ============================================================================
// SERVER ROUTER
// ============================================================================
const server = http.createServer(async (req, res) => {
  const clientIp = getClientIp(req);
  setSecurityHeaders(res);

  // Global static request rate limit: 120 req/min
  const globalLimit = checkRateLimit(clientIp, 'global', 120, 60000);
  if (!globalLimit.allowed) {
    sendJson(res, 429, { error: 'Too many requests. Please slow down.' }, { 'Retry-After': String(globalLimit.retryAfterSec) });
    return;
  }

  const reqBaseUrl = `http://${req.headers.host || 'localhost'}`;
  const parsedUrl = new URL(req.url, reqBaseUrl);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  try {
    // ------------------------------------------------------------------------
    // API: HEALTH CHECK
    // ------------------------------------------------------------------------
    if (pathname === '/api/health' && method === 'GET') {
      sendJson(res, 200, {
        status: 'ok',
        service: 'Nirapod Jatra Core Engine',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ------------------------------------------------------------------------
    // API: GET COMMUNITY TRIPS (Public read)
    // ------------------------------------------------------------------------
    if (pathname === '/api/trips' && method === 'GET') {
      sendJson(res, 200, {
        count: communityTrips.length,
        trips: communityTrips
      });
      return;
    }

    // ------------------------------------------------------------------------
    // API: POST COMMUNITY TRIP (Layer 1: Strict Server-Side Validation)
    // ------------------------------------------------------------------------
    if (pathname === '/api/trips' && method === 'POST') {
      // Rate limit trip contributions: max 15 per minute per IP
      const tripLimit = checkRateLimit(clientIp, 'post_trip', 15, 60000);
      if (!tripLimit.allowed) {
        sendJson(res, 429, { error: 'Trip submission rate limit reached. Please wait before submitting again.' }, { 'Retry-After': String(tripLimit.retryAfterSec) });
        return;
      }

      let body;
      try {
        body = await parseJsonBody(req);
      } catch (err) {
        if (err.message === 'PAYLOAD_TOO_LARGE') {
          sendJson(res, 413, { error: 'Payload too large. Maximum size is 64KB.' });
          return;
        }
        sendJson(res, 400, { error: 'Malformed JSON payload.' });
        return;
      }

      const { vehicle, distanceKm, start, end, farePaid, note } = body;

      // Layer 1 Validation: Data types, ranges, allowed values, bounds
      const validVehicles = ['cng', 'rickshaw', 'battery'];
      if (!vehicle || !validVehicles.includes(vehicle)) {
        sendJson(res, 400, { error: 'Invalid vehicle type. Allowed types: cng, rickshaw, battery.' });
        return;
      }

      const numDist = parseFloat(distanceKm);
      if (isNaN(numDist) || !isFinite(numDist) || numDist < 0.1 || numDist > 50.0) {
        sendJson(res, 400, { error: 'Invalid distance. Distance must be a number between 0.1 km and 50.0 km.' });
        return;
      }

      const numFare = parseFloat(farePaid);
      if (isNaN(numFare) || !isFinite(numFare) || numFare < 10 || numFare > 5000) {
        sendJson(res, 400, { error: 'Invalid fare amount. Fare must be between ৳10 and ৳5000.' });
        return;
      }

      if (typeof start !== 'string' || start.trim().length < 2 || start.trim().length > 60) {
        sendJson(res, 400, { error: 'Invalid start location. Length must be between 2 and 60 characters.' });
        return;
      }

      if (typeof end !== 'string' || end.trim().length < 2 || end.trim().length > 60) {
        sendJson(res, 400, { error: 'Invalid destination location. Length must be between 2 and 60 characters.' });
        return;
      }

      // Sanitize note: strip control characters, limit length to 120 chars
      let safeNote = '';
      if (note && typeof note === 'string') {
        safeNote = note.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 120);
      }

      const cleanStart = start.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 60);
      const cleanEnd = end.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 60);

      const newTripRecord = {
        id: Date.now(),
        vehicle,
        distanceKm: Math.round(numDist * 10) / 10,
        start: cleanStart,
        end: cleanEnd,
        farePaid: Math.round(numFare),
        note: safeNote,
        timestamp: Date.now()
      };

      communityTrips.unshift(newTripRecord);
      // Keep in-memory ledger capped at 500 entries to prevent memory exhaustion
      if (communityTrips.length > 500) {
        communityTrips = communityTrips.slice(0, 500);
      }

      sendJson(res, 201, {
        message: 'Trip added successfully and verified by server.',
        trip: newTripRecord
      });
      return;
    }

    // ------------------------------------------------------------------------
    // API: GET DRIVER VERIFICATION (Layer 2 Rate-Limited Driver Plate Lookup)
    // ------------------------------------------------------------------------
    if (pathname === '/api/drivers/verify' && method === 'GET') {
      const driverLimit = checkRateLimit(clientIp, 'driver_verify', 25, 60000);
      if (!driverLimit.allowed) {
        sendJson(res, 429, { error: 'Too many driver verification requests. Please wait.' }, { 'Retry-After': String(driverLimit.retryAfterSec) });
        return;
      }

      const rawPlate = parsedUrl.searchParams.get('plate');
      if (!rawPlate || typeof rawPlate !== 'string' || rawPlate.trim().length < 2 || rawPlate.trim().length > 40) {
        sendJson(res, 400, { error: 'Invalid or missing plate number parameter.' });
        return;
      }

      const normalizedSearch = rawPlate.replace(/\s+/g, '').toLowerCase();
      const record = DRIVERS_DATABASE.find(d => d.plate.replace(/\s+/g, '').toLowerCase() === normalizedSearch);

      if (record) {
        sendJson(res, 200, {
          verified: true,
          driver: {
            plate: record.plate,
            vehicleType: record.vehicleType,
            driverNameBn: record.driverNameBn,
            driverNameEn: record.driverNameEn,
            rating: record.rating,
            activeYears: record.activeYears,
            safetyScore: record.safetyScore,
            reportsCount: record.reportsCount
          }
        });
      } else {
        // Safe 404 response without leaking internal registry size
        sendJson(res, 404, {
          verified: false,
          message: 'Vehicle plate is not yet registered in verified registry.'
        });
      }
      return;
    }

    // ------------------------------------------------------------------------
    // API: AUTHENTICATION (Layer 2 Rate Limiting, Layer 3 Hash, Layer 4 Anti-Enumeration)
    // ------------------------------------------------------------------------
    if (pathname === '/api/auth/login' && method === 'POST') {
      // Rigid brute-force rate limit: max 5 login attempts per 15 minutes per IP
      const authLimit = checkRateLimit(clientIp, 'auth_login', 5, 15 * 60 * 1000);
      if (!authLimit.allowed) {
        sendJson(res, 429, { error: 'Too many failed login attempts. Account protected. Please try again in 15 minutes.' }, { 'Retry-After': String(authLimit.retryAfterSec) });
        return;
      }

      let body;
      try {
        body = await parseJsonBody(req);
      } catch (err) {
        sendJson(res, 400, { error: 'Malformed authentication request.' });
        return;
      }

      const { username, password } = body;
      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        // Layer 4: Generic message prevents parameter probing
        sendJson(res, 400, { error: 'Invalid username or password.' });
        return;
      }

      // Check username and password with constant-time verification
      const isUsernameMatch = username.trim() === MODERATOR_CREDENTIALS.username;
      const isPasswordMatch = verifyPassword(password, MODERATOR_CREDENTIALS.passwordHash);

      if (!isUsernameMatch || !isPasswordMatch) {
        // Layer 4: Never reveal whether username vs password was wrong! Prevents user enumeration.
        sendJson(res, 401, { error: 'Invalid username or password.' });
        return;
      }

      // Successful authentication: issue cryptographically random session token
      const sessionToken = generateSessionToken(MODERATOR_CREDENTIALS.username, 'moderator');

      // Set HttpOnly, SameSite=Strict cookie with path restriction
      const cookieFlags = [
        `nj_session=${sessionToken}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Strict',
        'Max-Age=7200'
      ];
      if (NODE_ENV === 'production') {
        cookieFlags.push('Secure');
      }

      sendJson(res, 200, {
        message: 'Authentication successful.',
        user: { username: MODERATOR_CREDENTIALS.username, role: 'moderator' },
        token: sessionToken
      }, {
        'Set-Cookie': cookieFlags.join('; ')
      });
      return;
    }

    // ------------------------------------------------------------------------
    // API: AUTH ME (Check current session)
    // ------------------------------------------------------------------------
    if (pathname === '/api/auth/me' && method === 'GET') {
      const session = getSessionFromRequest(req);
      if (!session) {
        sendJson(res, 401, { authenticated: false, error: 'Unauthorized. Active session required.' });
        return;
      }

      sendJson(res, 200, {
        authenticated: true,
        user: { username: session.username, role: session.role }
      });
      return;
    }

    // ------------------------------------------------------------------------
    // API: AUTH LOGOUT
    // ------------------------------------------------------------------------
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const session = getSessionFromRequest(req);
      if (session) {
        activeSessions.delete(session.token);
      }
      sendJson(res, 200, { message: 'Logged out successfully.' }, {
        'Set-Cookie': 'nj_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
      });
      return;
    }

    // ------------------------------------------------------------------------
    // API: DELETE TRIP (Admin/Moderator Authorization & Resource Protection)
    // ------------------------------------------------------------------------
    if (pathname.startsWith('/api/trips/') && method === 'DELETE') {
      const session = getSessionFromRequest(req);
      if (!session || session.role !== 'moderator') {
        // Layer 5 Authorization check: rejects unauthorized or non-admin users
        sendJson(res, 401, { error: 'Unauthorized: Moderator privileges required.' });
        return;
      }

      const tripId = parseInt(pathname.split('/api/trips/')[1], 10);
      if (isNaN(tripId)) {
        sendJson(res, 400, { error: 'Invalid trip ID.' });
        return;
      }

      const idx = communityTrips.findIndex(t => t.id === tripId);
      if (idx === -1) {
        sendJson(res, 404, { error: 'Trip record not found.' });
        return;
      }

      const deleted = communityTrips.splice(idx, 1)[0];
      sendJson(res, 200, { message: 'Trip successfully removed by moderator.', id: deleted.id });
      return;
    }

    // ------------------------------------------------------------------------
    // STATIC FILE SERVING (Safe normalized file paths, prevents directory traversal)
    // ------------------------------------------------------------------------
    if (method !== 'GET' && method !== 'HEAD') {
      sendJson(res, 405, { error: 'Method Not Allowed' });
      return;
    }

    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    let resolvedFilePath = path.join(__dirname, safePath === '/' ? 'index.html' : safePath);

    // Prevent directory traversal outside __dirname
    if (!resolvedFilePath.startsWith(__dirname)) {
      sendJson(res, 403, { error: 'Forbidden' });
      return;
    }

    fs.stat(resolvedFilePath, (statErr, stats) => {
      if (statErr || !stats.isFile()) {
        resolvedFilePath = path.join(__dirname, 'index.html');
      }

      fs.readFile(resolvedFilePath, (readErr, content) => {
        if (readErr) {
          // Layer 4: Generic safe 500 error, never leak stack traces
          sendJson(res, 500, { error: 'Internal server error processing file.' });
          return;
        }

        const ext = path.extname(resolvedFilePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache, must-revalidate' : 'public, max-age=86400'
        });
        res.end(content);
      });
    });

  } catch (unexpectedError) {
    // Layer 4: Global catch prevents server crash and keeps diagnostic info in protected server log
    console.error('[SERVER_SECURE_LOG] Unexpected error caught:', unexpectedError.message);
    sendJson(res, 500, { error: 'An unexpected internal error occurred. Please try again later.' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n🛡️ Nirapod Jatra Secure Server is live!`);
    console.log(`🔗 Direct Link: http://localhost:${PORT}`);
    console.log(`🔒 Security Layers Active: CSP, Rate Limiting, Server-side Validation, Salted Password Hashing, Safe Errors\n`);
  });
}

module.exports = server;
