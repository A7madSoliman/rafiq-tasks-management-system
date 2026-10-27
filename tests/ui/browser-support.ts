import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createServer, type Server } from 'node:http';
import ts from 'typescript';

export const browserPath = [
  process.env.TASKLY_BROWSER_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].find((path): path is string => Boolean(path && existsSync(path)));

// A small CommonJS bundle keeps these browser regressions dependency-free.
// Next routing is a host adapter; React and all application hooks are real.
function fixtureBundle() {
  const modules: string[] = [];
  const ids = new Map<string, number>();
  function add(filename: string): number {
    const cached = ids.get(filename);
    if (cached !== undefined) return cached;
    const id = modules.length;
    ids.set(filename, id);
    modules.push('');
    let source =
      filename === 'next/navigation'
        ? 'exports.usePathname = () => "/project"; const router = {replace(){},refresh(){},push(){}}; exports.useRouter = () => router;'
        : filename === 'next/link'
          ? 'module.exports = function Link(props) { return require("react").createElement("a", {...props, onClick(event){ event.preventDefault(); props.onClick?.(event); }}); };'
          : filename.endsWith('.svg')
            ? 'module.exports = function Icon() { return null; };'
            : readFileSync(filename, 'utf8');
    if (/\.tsx?$/.test(filename)) {
      source = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2020,
          esModuleInterop: true,
        },
        fileName: filename,
      }).outputText;
    }
    const requireFromFile = createRequire(
      filename.includes('/') || filename.includes('\\')
        ? resolve(filename.startsWith('next/') ? 'package.json' : filename)
        : resolve('package.json'),
    );
    source = source.replace(/require\(["']([^"']+)["']\)/g, (_, specifier: string) => {
      let dependency: string;
      if (specifier === 'next/navigation' || specifier === 'next/link') dependency = specifier;
      else if (specifier.startsWith('@/') || specifier.startsWith('.')) {
        const base = specifier.startsWith('@/')
          ? resolve('src', specifier.slice(2))
          : resolve(dirname(filename), specifier);
        dependency =
          [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, join(base, 'index.ts')].find(
            (candidate) => existsSync(candidate) && /\.[cm]?[jt]sx?$|\.svg$/.test(candidate),
          ) ?? base;
      } else dependency = requireFromFile.resolve(specifier);
      return `load(${add(dependency)})`;
    });
    modules[id] = `function(module,exports,load){${source}\n}`;
    return id;
  }
  const entry = add(resolve('tests/ui/focus-fixture.tsx'));
  return `const process={env:{NODE_ENV:'production'}};const modules=[${modules.join(',')}],cache={};function load(id){if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};modules[id](m,m.exports,load);return m.exports;}load(${entry});`;
}

export class Browser {
  private process?: ChildProcess;
  private server?: Server;
  private profile?: string;
  private socket?: WebSocket;
  private sequence = 0;
  private pending = new Map<
    number,
    { resolve: (value: Record<string, unknown>) => void; reject: (error: Error) => void }
  >();
  private url = '';
  private errors: unknown[] = [];

  async start() {
    const bundle = fixtureBundle();
    this.server = createServer((request, response) => {
      response.setHeader(
        'Content-Type',
        request.url === '/fixture.js' ? 'text/javascript' : 'text/html',
      );
      response.end(
        request.url === '/fixture.js'
          ? bundle
          : `<!doctype html><html><head><style>
        [class~="hidden"]{display:none} [role="dialog"]{background:white;padding:16px}
        @media(min-width:768px){[class~="md:hidden"]{display:none}[class~="md:block"]{display:block}[class~="md:flex"]{display:flex}}
        @media(min-width:1024px){[class~="lg:hidden"]{display:none}[class~="lg:flex"]{display:flex}}
        </style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`,
      );
    });
    await new Promise<void>((resolve) => this.server!.listen(0, '127.0.0.1', resolve));
    const address = this.server.address();
    if (!address || typeof address === 'string') throw new Error('No fixture server address');
    this.url = `http://127.0.0.1:${address.port}`;
    this.profile = mkdtempSync(join(tmpdir(), 'taskly-focus-'));
    this.process = spawn(
      browserPath!,
      [
        '--headless=new',
        '--remote-debugging-port=0',
        `--user-data-dir=${this.profile}`,
        '--no-first-run',
        '--no-default-browser-check',
        'about:blank',
      ],
      { windowsHide: true },
    );
    const endpoint = await new Promise<string>((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => reject(new Error('Browser startup timed out')), 15000);
      this.process!.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      this.process!.stderr!.on('data', (chunk) => {
        output += String(chunk);
        const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) {
          clearTimeout(timeout);
          resolve(match[1]);
        }
      });
    });
    const pages = (await fetch(
      `${endpoint.replace('ws:', 'http:').split('/devtools/')[0]}/json/list`,
    ).then((response) => response.json())) as { type: string; webSocketDebuggerUrl: string }[];
    this.socket = new WebSocket(pages.find((page) => page.type === 'page')!.webSocketDebuggerUrl);
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.method === 'Runtime.exceptionThrown')
        this.errors.push(message.params.exceptionDetails);
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    await new Promise<void>((resolve, reject) => {
      this.socket!.addEventListener('open', () => resolve(), { once: true });
      this.socket!.addEventListener('error', () => reject(new Error('Browser connection failed')), {
        once: true,
      });
    });
    await this.command('Runtime.enable');
  }

  async command(method: string, params: object = {}) {
    const id = ++this.sequence;
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket!.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate<T = unknown>(expression: string): Promise<T> {
    const result = await this.command('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return (result.result as { value: T }).value;
  }

  async waitFor(expression: string) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await this.evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error(`Browser condition timed out: ${expression}\n${JSON.stringify(this.errors)}`);
  }

  async reset() {
    this.errors = [];
    await this.command('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const url = `${this.url}/?case=${this.sequence}`;
    await this.command('Page.navigate', { url });
    await this.waitFor(
      `location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && Boolean(document.querySelector('#open-epic'))`,
    );
  }

  async key(key: 'Tab' | 'Escape', shift = false) {
    const code = key === 'Tab' ? 9 : 27;
    await this.command('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code: key,
      windowsVirtualKeyCode: code,
      modifiers: shift ? 8 : 0,
    });
    await this.command('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code: key,
      windowsVirtualKeyCode: code,
      modifiers: shift ? 8 : 0,
    });
  }

  async stop() {
    this.socket?.close();
    if (this.process && this.process.exitCode === null) {
      const exited = new Promise<void>((resolve) => this.process!.once('exit', () => resolve()));
      this.process.kill();
      await exited;
    }
    await new Promise<void>((resolve) =>
      this.server ? this.server.close(() => resolve()) : resolve(),
    );
    if (this.profile) {
      if (!resolve(this.profile).startsWith(resolve(tmpdir(), 'taskly-focus-'))) {
        throw new Error('Refusing to remove a profile outside the browser test directory');
      }
      rmSync(this.profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  }
}
