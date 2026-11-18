import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = await realpath(new URL('./game/', import.meta.url));
const option = process.argv.indexOf('--port');
const port = option === -1 ? 8080 : Number(process.argv[option + 1]);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Expected --port followed by a port from 1 to 65535');
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2',
};
const inside = (file: string) => file.startsWith(root + sep);
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
    const candidate = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!inside(candidate)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const file = await realpath(candidate);
    if (!inside(file)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const data = await readFile(file);
    response.writeHead(200, { 'content-type': mime[extname(file).toLowerCase()] || 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}).listen(port, () => console.log(`Serving game/ at http://localhost:${port}`));
