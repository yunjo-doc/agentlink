/*
 * agentlink 서버: 정적 파일 + 관리자 승인 방식 계정 API (외부 패키지 없음)
 *
 * 환경 변수
 *   ADMIN_EMAIL, ADMIN_PASSWORD  관리자 계정 (서버 시작 시 생성·갱신, 비밀번호 8자 이상)
 *   SESSION_SECRET               로그인 세션 서명 키 (없으면 재시작할 때마다 세션이 만료됨)
 *   DATA_DIR                     회원 데이터 저장 폴더 (기본 ./data)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSION_TTL = 7 * 24 * 3600 * 1000;
const COOKIE = 'al_session';
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) console.warn('[agentlink] SESSION_SECRET 미설정: 서버가 재시작되면 모든 로그인 세션이 만료됩니다.');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

/* ---------- 회원 저장소 (JSON 파일) ---------- */
let users = [];
try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { users = []; }

function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = USERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2));
  fs.renameSync(tmp, USERS_FILE);
}
const now = () => new Date().toISOString();
const newId = () => 'usr_' + crypto.randomBytes(6).toString('hex');

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}
function checkPassword(pw, u) {
  // 없는 계정도 같은 시간이 걸리게 해 가입 여부가 응답 시간으로 드러나지 않게 한다
  if (!u || !u.hash) { crypto.scryptSync(pw, 'dummy-salt', 64); return false; }
  return crypto.timingSafeEqual(crypto.scryptSync(pw, u.salt, 64), Buffer.from(u.hash, 'hex'));
}
const pub = (u) => ({ id: u.id, email: u.email, name: u.name, company: u.company, reason: u.reason, role: u.role, status: u.status, createdAt: u.createdAt, decidedAt: u.decidedAt || null });

// 관리자 계정은 환경 변수를 기준으로 매번 맞춘다 (비밀번호 변경도 환경 변수로)
(function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const pw = process.env.ADMIN_PASSWORD || '';
  if (!email || !pw) return console.warn('[agentlink] ADMIN_EMAIL / ADMIN_PASSWORD 미설정: 관리자 로그인을 사용할 수 없습니다.');
  if (pw.length < 8) return console.warn('[agentlink] ADMIN_PASSWORD는 8자 이상이어야 합니다. 관리자 계정을 만들지 않았습니다.');
  let u = users.find((x) => x.email === email);
  if (!u) {
    u = { id: newId(), email, name: '관리자', company: '', reason: '', createdAt: now() };
    users.push(u);
  }
  Object.assign(u, hashPassword(pw), { role: 'admin', status: 'approved' });
  persist();
  console.log(`[agentlink] 관리자 계정 준비됨: ${email}`);
})();

/* ---------- 세션 (HMAC 서명 쿠키) ---------- */
const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');

function issueSession(res, req, u) {
  const data = b64(JSON.stringify({ uid: u.id, exp: Date.now() + SESSION_TTL }));
  setCookie(res, req, `${data}.${sign(data)}`, SESSION_TTL / 1000);
}
function setCookie(res, req, value, maxAge) {
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`);
}
function currentUser(req) {
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  if (!m) return null;
  const [data, sig] = m[1].split('.');
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(data, 'base64url').toString()); } catch (e) { return null; }
  if (payload.exp < Date.now()) return null;
  const u = users.find((x) => x.id === payload.uid);
  // 비활성화·삭제된 계정은 기존 세션도 즉시 무효
  return u && u.status === 'approved' ? u : null;
}

/* ---------- 로그인 시도 제한 ---------- */
const attempts = new Map();
function rateLimited(ip) {
  const t = Date.now();
  const a = attempts.get(ip);
  if (!a || a.reset < t) { attempts.set(ip, { count: 1, reset: t + 15 * 60 * 1000 }); return false; }
  a.count += 1;
  return a.count > 10;
}

/* ---------- API ---------- */
function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 10 * 1024) { reject(new Error('too_large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch (e) { reject(new Error('bad_json')); }
    });
    req.on('error', reject);
  });
}
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function api(req, res, p) {
  const method = req.method;
  // 상태를 바꾸는 요청은 JSON만 받는다 (다른 사이트의 폼 전송 차단)
  if (method !== 'GET' && !(req.headers['content-type'] || '').includes('application/json')) return json(res, 415, { error: 'json_required' });
  let body = {};
  if (method === 'POST') {
    try { body = await readBody(req); } catch (e) { return json(res, 400, { error: e.message }); }
  }
  const me = currentUser(req);

  if (method === 'GET' && p === '/api/me') return me ? json(res, 200, { user: pub(me) }) : json(res, 401, { error: 'unauthorized' });

  if (method === 'POST' && p === '/api/signup') {
    const email = str(body.email, 200).toLowerCase();
    const name = str(body.name, 50);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!EMAIL_RE.test(email) || !name) return json(res, 400, { error: 'invalid_input' });
    if (password.length < 8 || password.length > 128) return json(res, 400, { error: 'weak_password' });
    if (users.some((u) => u.email === email)) return json(res, 409, { error: 'email_exists' });
    if (users.filter((u) => u.status === 'pending').length >= 500) return json(res, 503, { error: 'too_many_pending' });
    users.push({ id: newId(), email, name, company: str(body.company, 100), reason: str(body.reason, 500), role: 'user', status: 'pending', createdAt: now(), ...hashPassword(password) });
    persist();
    return json(res, 201, { ok: true });
  }

  if (method === 'POST' && p === '/api/login') {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim();
    if (rateLimited(ip)) return json(res, 429, { error: 'rate_limited' });
    const u = users.find((x) => x.email === str(body.email, 200).toLowerCase());
    // 비밀번호가 맞을 때만 승인 상태를 알려준다 (가입 여부 노출 방지)
    if (!checkPassword(typeof body.password === 'string' ? body.password : '', u)) return json(res, 401, { error: 'invalid_credentials' });
    if (u.status !== 'approved') return json(res, 403, { error: u.status });
    issueSession(res, req, u);
    return json(res, 200, { user: pub(u) });
  }

  if (method === 'POST' && p === '/api/logout') {
    setCookie(res, req, '', 0);
    return json(res, 200, { ok: true });
  }

  if (method === 'DELETE' && p === '/api/me') {
    if (!me) return json(res, 401, { error: 'unauthorized' });
    if (me.role === 'admin') return json(res, 400, { error: 'admin_cannot_delete' });
    users = users.filter((u) => u.id !== me.id);
    persist();
    setCookie(res, req, '', 0);
    return json(res, 200, { ok: true });
  }

  if (p.startsWith('/api/admin/')) {
    if (!me) return json(res, 401, { error: 'unauthorized' });
    if (me.role !== 'admin') return json(res, 403, { error: 'forbidden' });

    if (method === 'GET' && p === '/api/admin/users') {
      return json(res, 200, { users: users.map(pub).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
    }
    const m = p.match(/^\/api\/admin\/users\/([\w-]+)(?:\/(approve|reject|disable|enable))?$/);
    if (m) {
      const target = users.find((u) => u.id === m[1]);
      if (!target) return json(res, 404, { error: 'not_found' });
      if (target.role === 'admin') return json(res, 400, { error: 'cannot_modify_admin' });
      if (method === 'DELETE' && !m[2]) {
        users = users.filter((u) => u.id !== target.id);
        persist();
        return json(res, 200, { ok: true });
      }
      if (method === 'POST' && m[2]) {
        target.status = { approve: 'approved', enable: 'approved', reject: 'rejected', disable: 'disabled' }[m[2]];
        target.decidedAt = now();
        target.decidedBy = me.email;
        persist();
        return json(res, 200, { user: pub(target) });
      }
    }
  }
  return json(res, 404, { error: 'not_found' });
}

/* ---------- 정적 파일 ---------- */
function serveStatic(req, res, urlPath) {
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(ROOT, path.normalize(urlPath));
  const rel = path.relative(ROOT, file);
  const parts = rel.split(path.sep);
  // 루트 밖 경로, 숨김 파일(.git 등), 회원 데이터, 서버 파일은 제공하지 않는다
  const blocked = rel.startsWith('..') || path.isAbsolute(rel) || parts.some((x) => x.startsWith('.')) ||
    ['data', 'node_modules'].includes(parts[0]) || file.startsWith(DATA_DIR) || ['server.js', 'package.json'].includes(rel);
  const type = TYPES[path.extname(file)];
  const index = () => send(res, path.join(ROOT, 'index.html'), TYPES['.html']);
  if (blocked || !type) return index();
  fs.stat(file, (err, st) => (err || !st.isFile() ? index() : send(res, file, type)));
}
function send(res, file, type) {
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': type.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { urlPath = '/'; }
  if (urlPath.startsWith('/api/')) {
    api(req, res, urlPath).catch((e) => { console.error(e); json(res, 500, { error: 'server_error' }); });
    return;
  }
  serveStatic(req, res, urlPath);
}).listen(PORT, () => console.log(`agentlink listening on ${PORT}`));
