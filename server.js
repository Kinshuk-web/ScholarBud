// ============================================================
//  ScholarBud secure API proxy
// ------------------------------------------------------------
//  Holds your Gemini / Sarvam / YouTube API keys on the SERVER,
//  so they are never shipped to the browser or visible in the
//  page source. The front-end (ScholarBud.html) calls these
//  endpoints instead of talking to the AI providers directly.
//
//  Zero external dependencies: runs on plain Node.js (>=18).
//    node server.js
// ============================================================

const http = require('http');
const https = require('https');
const tls = require('tls');
const fs = require('fs');
const path = require('path');

// ---------- tiny .env loader (no dotenv dependency) ----------
function loadEnv() {
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}
loadEnv();

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const SARVAM_CHAT_MODEL = process.env.SARVAM_CHAT_MODEL || 'sarvam-105b';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',').map(s => s.trim()).filter(Boolean);

// ---------- outbound HTTP via core https (no undici/wasm needed) ----------
// Honours HTTPS_PROXY if set (some corporate/sandbox networks require it).
const OUTBOUND_PROXY = process.env.HTTPS_PROXY || process.env.https_proxy || '';

function connectViaProxy(proxyUrl, host, port) {
  return new Promise((resolve, reject) => {
    const p = new URL(proxyUrl);
    const req = http.request({
      host: p.hostname, port: p.port || 3128, method: 'CONNECT',
      path: host + ':' + port, headers: { Host: host + ':' + port }
    });
    req.on('connect', (res, socket) => {
      if (res.statusCode !== 200) { socket.destroy(); return reject(new Error('proxy CONNECT ' + res.statusCode)); }
      const tlsSock = tls.connect({ socket, servername: host }, () => resolve(tlsSock));
      tlsSock.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

async function outbound(method, urlStr, headers, bodyObj) {
  const url = new URL(urlStr);
  const data = bodyObj != null ? JSON.stringify(bodyObj) : null;
  const opts = {
    method,
    hostname: url.hostname,
    path: url.pathname + url.search,
    headers: Object.assign({}, headers)
  };
  if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
  if (OUTBOUND_PROXY && url.protocol === 'https:') {
    const sock = await connectViaProxy(OUTBOUND_PROXY, url.hostname, url.port || 443);
    opts.createConnection = () => sock;
  }
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('upstream timeout')));
    if (data) req.write(data);
    req.end();
  });
}
function parseJson(s) { try { return JSON.parse(s); } catch { return {}; } }

// ---------- very small in-memory rate limiter ----------
const hits = new Map();
function rateLimited(ip, max = 60, windowMs = 60000) {
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, t: now };
  if (now - rec.t > windowMs) { rec.n = 0; rec.t = now; }
  rec.n++;
  hits.set(ip, rec);
  return rec.n > max;
}

function cors(res, origin) {
  const allow = ALLOWED_ORIGINS.includes('*') ? '*' : (ALLOWED_ORIGINS.includes(origin) ? origin : '');
  if (allow) res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function readBody(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// ---------- API handlers ----------
async function handleGemini(req, res) {
  if (!GEMINI_API_KEY) return json(res, 500, { error: 'Server is missing GEMINI_API_KEY' });
  let body;
  try { body = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: 'Bad JSON' }); }

  const model = (body && body.model) || GEMINI_MODEL;
  const payload = (body && body.payload) || {};
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const r = await outbound('POST', url, { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }, payload);
  res.writeHead(r.status, { 'Content-Type': 'application/json' });
  res.end(r.body); // pass Gemini's JSON straight through
}

async function handleSarvamChat(req, res) {
  if (!SARVAM_API_KEY) return json(res, 500, { error: 'Server is missing SARVAM_API_KEY' });
  let body;
  try { body = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: 'Bad JSON' }); }

  const messages = (body && body.messages) || [];
  const model = (body && body.model) || SARVAM_CHAT_MODEL;
  const r = await outbound('POST', 'https://api.sarvam.ai/v1/chat/completions',
    { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
    { messages, model });
  const data = parseJson(r.body);
  if (r.status < 200 || r.status >= 300) return json(res, r.status, { error: (data.error && data.error.message) || 'Sarvam chat error' });
  const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
  return json(res, 200, { content });
}

async function handleSarvamTTS(req, res) {
  if (!SARVAM_API_KEY) return json(res, 500, { error: 'Server is missing SARVAM_API_KEY' });
  let body;
  try { body = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: 'Bad JSON' }); }

  const payload = {
    text: String((body && body.text) || '').slice(0, 2500),
    language_code: (body && body.language_code) || 'en-IN',
    speaker: (body && body.speaker) || 'shubh',
    model: (body && body.model) || 'bulbul:v3'
  };
  if (!payload.text) return json(res, 400, { error: 'text is required' });

  const r = await outbound('POST', 'https://api.sarvam.ai/text-to-speech',
    { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
    payload);
  const data = parseJson(r.body);
  if (r.status < 200 || r.status >= 300) return json(res, r.status, { error: (data.error && data.error.message) || 'Sarvam TTS error' });
  return json(res, 200, { audioBase64: (data.audios && data.audios[0]) || '' });
}

async function handleYouTube(req, res, url) {
  if (!YOUTUBE_API_KEY) return json(res, 500, { error: 'Server is missing YOUTUBE_API_KEY' });
  const q = url.searchParams.get('q') || '';
  if (!q) return json(res, 400, { error: 'q is required' });

  const api = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6'
    + '&q=' + encodeURIComponent(q) + '&key=' + YOUTUBE_API_KEY;
  const r = await outbound('GET', api, {}, null);
  const data = parseJson(r.body);
  if (r.status < 200 || r.status >= 300) return json(res, r.status, { error: (data.error && data.error.message) || 'YouTube error' });

  const results = (data.items || []).map(it => {
    const sn = it.snippet || {};
    const th = sn.thumbnails || {};
    const pick = th.medium || th.high || th.default || {};
    return {
      videoId: it.id && it.id.videoId,
      title: sn.title || 'Untitled',
      channel: sn.channelTitle || '',
      thumbnail: pick.url || ('https://i.ytimg.com/vi/' + (it.id && it.id.videoId) + '/mqdefault.jpg')
    };
  });
  return json(res, 200, { results });
}

// ---------- static file serving ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.wav': 'audio/wav'
};

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/ScholarBud.html';
  const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
  const file = path.join(__dirname, safe);
  if (!file.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}

// ---------- router ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  cors(res, req.headers.origin);

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const ip = req.socket.remoteAddress || 'unknown';
  if (url.pathname.startsWith('/api/') && rateLimited(ip)) {
    return json(res, 429, { error: 'Too many requests, slow down.' });
  }

  try {
    if (url.pathname === '/api/gemini' && req.method === 'POST') return await handleGemini(req, res);
    if (url.pathname === '/api/sarvam/chat' && req.method === 'POST') return await handleSarvamChat(req, res);
    if (url.pathname === '/api/sarvam/tts' && req.method === 'POST') return await handleSarvamTTS(req, res);
    if (url.pathname === '/api/youtube' && req.method === 'GET') return await handleYouTube(req, res, url);
    if (url.pathname === '/api/health') {
      return json(res, 200, {
        ok: true,
        gemini: !!GEMINI_API_KEY, sarvam: !!SARVAM_API_KEY, youtube: !!YOUTUBE_API_KEY
      });
    }
    return serveStatic(req, res, url);
  } catch (e) {
    console.error('[proxy] error:', e.message);
    return json(res, 500, { error: 'Internal proxy error' });
  }
});

server.listen(PORT, () => {
  console.log(`ScholarBud proxy running on http://localhost:${PORT}`);
  console.log(`  Gemini key:  ${GEMINI_API_KEY ? 'loaded' : 'MISSING'}`);
  console.log(`  Sarvam key:  ${SARVAM_API_KEY ? 'loaded' : 'MISSING'}`);
  console.log(`  YouTube key: ${YOUTUBE_API_KEY ? 'loaded' : 'MISSING'}`);
});
