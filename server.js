// 정적 파일 서버 (Render 등 Web Service 배포용, 외부 패키지 없음)
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { urlPath = '/'; }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(ROOT, path.normalize(urlPath));
  // 루트 밖 경로, 숨김 파일(.git 등), 서버 파일은 제공하지 않는다
  const rel = path.relative(ROOT, file);
  const blocked = rel.startsWith('..') || rel.split(path.sep).some((p) => p.startsWith('.')) || ['server.js', 'package.json'].includes(rel);
  const type = TYPES[path.extname(file)];
  if (blocked || !type) return send(res, path.join(ROOT, 'index.html'), TYPES['.html']);
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, path.join(ROOT, 'index.html'), TYPES['.html']);
    send(res, file, type);
  });
}).listen(PORT, () => console.log(`agentlink listening on ${PORT}`));

function send(res, file, type) {
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': type.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600' });
  fs.createReadStream(file).pipe(res);
}
