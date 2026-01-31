const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { logError } = require('./error-log');

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
  console.log(`Error log: ${path.join(__dirname, 'app-errors.log')}`);
}).on('error', (err) => {
  logError(`Server error: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${port} is already in use.`);
    console.error(`Run: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force\n`);
  }
  process.exit(1);
});

// ============================================
// WebSocket Server for Real-Time Data Injection
// ============================================

let wss;
try {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('[WebSocket] Received data:', data);

        // Broadcast to all connected clients (including the 3D view)
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'factoryData',
              data: data,
              timestamp: new Date().toISOString()
            }));
          }
        });

        // Log to file
        const logLine = `[${new Date().toISOString()}] WebSocket data: ${JSON.stringify(data)}\n`;
        fs.appendFileSync(logFile, logLine);
      } catch (e) {
        console.error('[WebSocket] Parse error:', e.message);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error.message);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Smart Factory Digital Twin',
      timestamp: new Date().toISOString()
    }));
  });

  console.log(`WebSocket server running on port ${port}`);
  console.log('\n=== Digital Twin Data Injection API ===');
  console.log('WebSocket: ws://127.0.0.1:' + port);
  console.log('\nExample data format:');
  console.log(JSON.stringify({
    equipment: {
      gantry: { status: 'active' },
      conveyor1: { status: 'running' }
    },
    throughput: 12.5
  }, null, 2));
  console.log('\n======================================\n');
} catch (e) {
  console.error('[WebSocket] Failed to create WebSocket server:', e.message);
  console.log('WebSocket features will not be available');
  console.log('Run "npm install" to install dependencies\n');
}
