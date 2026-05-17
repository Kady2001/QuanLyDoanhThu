// Lightweight shared backend for Nexus Gear.
// Run with: node server.js

const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const DB_FILE = path.join(ROOT, 'shared-database.json');
const LOCK_TTL_MS = 45_000;

let database = loadDatabase();
let editLock = null;

function loadDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return normalizeDatabase(parsed);
  } catch (error) {
    console.error('Failed to load shared database:', error);
    return null;
  }
}

function normalizeState(state) {
  return {
    units: Array.isArray(state?.units) ? state.units : [],
    productLines: Array.isArray(state?.productLines) ? state.productLines : [],
    categories: Array.isArray(state?.categories) ? state.categories : [],
    affiliateIncomes: Array.isArray(state?.affiliateIncomes) ? state.affiliateIncomes : [],
    dashboardSettings: {
      includePendingAffiliateInProfit: Boolean(state?.dashboardSettings?.includePendingAffiliateInProfit),
    },
    snapshots: Array.isArray(state?.snapshots) ? state.snapshots : [],
  };
}

function normalizeDatabase(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    version: Number.isFinite(value.version) ? value.version : 1,
    updatedAt: value.updatedAt || new Date().toISOString(),
    state: normalizeState(value.state),
  };
}

async function saveDatabase() {
  if (!database) return;
  const tempFile = `${DB_FILE}.tmp`;
  await fsp.writeFile(tempFile, JSON.stringify(database, null, 2), 'utf8');
  await fsp.rename(tempFile, DB_FILE);
}

function expireLockIfNeeded() {
  if (editLock && Date.now() >= editLock.expiresAt) {
    editLock = null;
  }
}

function publicLock() {
  expireLockIfNeeded();
  if (!editLock) return null;
  return {
    ownerId: editLock.ownerId,
    ownerName: editLock.ownerName,
    acquiredAt: editLock.acquiredAt,
    expiresAt: editLock.expiresAt,
  };
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function statePayload() {
  return {
    initialized: Boolean(database),
    version: database?.version || 0,
    updatedAt: database?.updatedAt || null,
    state: database?.state || null,
    lock: publicLock(),
  };
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ({
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
  })[ext] || 'application/octet-stream';
}

async function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/Nexus Gear.html' : decodeURIComponent(pathname);
  const filePath = path.resolve(ROOT, `.${requested}`);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) throw new Error('Not a file');
    res.writeHead(200, {
      'Content-Type': mimeType(filePath),
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/state') {
    json(res, 200, statePayload());
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/bootstrap') {
    const body = await readJson(req);
    expireLockIfNeeded();
    if (!editLock || editLock.ownerId !== body.clientId) {
      json(res, 423, { error: 'edit lock required', ...statePayload() });
      return true;
    }
    if (database) {
      json(res, 409, statePayload());
      return true;
    }
    database = {
      version: 1,
      updatedAt: new Date().toISOString(),
      state: normalizeState(body.state),
    };
    await saveDatabase();
    json(res, 201, statePayload());
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/lock/acquire') {
    const body = await readJson(req);
    const clientId = String(body.clientId || '').trim();
    if (!clientId) {
      json(res, 400, { error: 'clientId is required' });
      return true;
    }
    expireLockIfNeeded();
    const now = Date.now();
    if (!editLock || editLock.ownerId === clientId) {
      editLock = {
        ownerId: clientId,
        ownerName: String(body.clientName || `Thiết bị ${clientId.slice(-4)}`),
        acquiredAt: editLock?.acquiredAt || now,
        expiresAt: now + LOCK_TTL_MS,
      };
      json(res, 200, { granted: true, lock: publicLock() });
      return true;
    }
    json(res, 423, { granted: false, lock: publicLock() });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/lock/heartbeat') {
    const body = await readJson(req);
    expireLockIfNeeded();
    if (!editLock || editLock.ownerId !== body.clientId) {
      json(res, 423, { granted: false, lock: publicLock() });
      return true;
    }
    editLock.expiresAt = Date.now() + LOCK_TTL_MS;
    json(res, 200, { granted: true, lock: publicLock() });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/lock/release') {
    const body = await readJson(req);
    expireLockIfNeeded();
    if (editLock?.ownerId === body.clientId) editLock = null;
    json(res, 200, { released: true, lock: publicLock() });
    return true;
  }

  if (req.method === 'PUT' && pathname === '/api/state') {
    const body = await readJson(req);
    expireLockIfNeeded();
    if (!editLock || editLock.ownerId !== body.clientId) {
      json(res, 423, { error: 'edit lock required', ...statePayload() });
      return true;
    }
    if (!database) {
      json(res, 409, { error: 'database not initialized', ...statePayload() });
      return true;
    }
    if (Number(body.version) !== database.version) {
      json(res, 409, { error: 'version conflict', ...statePayload() });
      return true;
    }
    database = {
      version: database.version + 1,
      updatedAt: new Date().toISOString(),
      state: normalizeState(body.state),
    };
    await saveDatabase();
    json(res, 200, statePayload());
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      const handled = await handleApi(req, res, url.pathname);
      if (!handled) json(res, 404, { error: 'not found' });
      return;
    }
    await serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error(error);
    json(res, 500, { error: 'internal server error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Nexus Gear shared server listening on http://127.0.0.1:${PORT}`);
});
