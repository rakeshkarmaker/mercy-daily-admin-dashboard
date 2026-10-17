// Production static server with SPA fallback for Hostinger's Node.js interface.
// Serves dist/ and rewrites unknown paths (e.g. /signin) to /index.html so
// TanStack Router can take over. Listens on Hostinger's assigned PORT.
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
};

function send(res, file) {
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(DIST, urlPath);
    // Serve real files (assets, favicon, robots.txt, ...)
    if (urlPath !== '/' && fs.existsSync(file) && fs.statSync(file).isFile()) return send(res, file);
    // Everything else -> SPA entry point
    return send(res, path.join(DIST, 'index.html'));
}).listen(PORT, () => console.log(`Serving dist/ on port ${PORT}`));
