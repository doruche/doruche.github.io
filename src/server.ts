import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { watch } from 'chokidar';
import sirv from 'sirv';
import { build } from './build.ts';

const directory = mkdtempSync(join(tmpdir(), 'primitive-preview-'));
process.on('exit', () => rmSync(directory, { recursive: true, force: true }));
const output = join(directory, 'site');
let base: string | undefined;
const serve = sirv(output, { dev: true });
const watcher = watch(['site.yaml', 'content', 'theme', 'assets'], { ignoreInitial: true });
function rebuild() {
  try {
    const previous = base;
    base = build(output);
    if (base !== previous) console.log(`Preview: http://127.0.0.1:${port}${base}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
  }
}
watcher.on('ready', rebuild).on('all', rebuild);

const port = Number(process.env.PORT ?? 4000);
const server = createServer((request, response) => {
  const path = request.url ?? '/';
  if (!base) {
    response.writeHead(503).end('Waiting for a successful build. See the terminal for details.');
  } else if (path === '/' && base !== '/') {
    response.writeHead(302, { Location: base }).end();
  } else if (path.startsWith(base)) {
    request.url = '/' + path.slice(base.length);
    serve(request, response);
  } else {
    response.writeHead(404).end();
  }
});
server.listen(port, '127.0.0.1');
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());
