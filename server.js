'use strict';

const http = require('http');

const port = Number.parseInt(process.env.PORT || '8080', 10);
const hostname = '0.0.0.0';

let healthy = true;

const server = http.createServer((req, res) => {
  let pathname = '/';

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    pathname = url.pathname;
  } catch (err) {
    res.statusCode = 400;
    res.end('bad request\n');
    return;
  }

  if (req.method === 'GET' && pathname === '/crash') {
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('crashing now\n');

    // Exit after response flushes
    setTimeout(() => {
      process.exit(1);
    }, 50);
    return;
  }

  if (req.method === 'GET' && pathname === '/healthz') {
    if (!healthy) {
      res.statusCode = 500;
      res.end('unhealthy\n');
      return;
    }
    res.statusCode = 200;
    res.end('ok\n');
    return;
  }

  res.statusCode = 200;
  res.end('hello\n');
});

server.listen(port, hostname, () => {
  console.log(`listening on http://${hostname}:${port}`);
});

// Handle graceful shutdown (Kubernetes friendly)
process.on('SIGTERM', () => {
  console.log('received SIGTERM, shutting down');
  healthy = false;
  server.close(() => {
    process.exit(0);
  });
});
