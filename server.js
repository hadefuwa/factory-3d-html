const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const logDir = path.join(process.env.USERPROFILE || process.env.HOME, 'Documents', 'factory-3d-html', 'logs');
const logFile = path.join(logDir, 'app.log');

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function send(res, code, body, type='text/plain') {
  res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.url === '/log' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const line = `[${new Date().toISOString()}] ${data.message || ''}\n`;
        fs.appendFileSync(logFile, line);
        send(res, 200, 'ok');
      } catch (e) {
        send(res, 400, 'bad request');
      }
    });
    return;
  }

  // static file serving
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(root, decodeURIComponent(urlPath));
  if (!filePath.startsWith(root)) return send(res, 403, 'forbidden');

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'not found');
    const ext = path.extname(filePath).toLowerCase();
    const type = ext === '.html' ? 'text/html'
      : ext === '.js' ? 'application/javascript'
      : ext === '.css' ? 'text/css'
      : 'application/octet-stream';
    send(res, 200, data, type);
  });
});

const port = 8000;
server.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
  console.log(`Log file: ${logFile}`);
});
