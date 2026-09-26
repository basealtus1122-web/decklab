// 덱랩 빌드: src/ 를 모아 배포용 index.html 한 장으로 만든다.
//   npm install        (처음 한 번)
//   npm run build      → index.html
//   npm run watch      → src/ 가 바뀔 때마다 다시 만든다
//   DEBUG=1 npm run build → 앱 코드를 압축하지 않는다 (오류 위치 찾을 때)
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const src = (...p) => path.join(root, 'src', ...p);
const read = (p) => fs.readFileSync(p, 'utf8');

// 인라인 <script>/<style> 안에서 태그가 닫히지 않게 한다
const inlineJs = (code) => code.replace(/<\/(script)/gi, '<\\/$1');
const inlineCss = (code) => code.replace(/<\/(style)/gi, '<\\/$1');

const appOptions = {
  entryPoints: [src('app', 'main.jsx')],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
  minify: !process.env.DEBUG,
  legalComments: 'none',
  jsx: 'transform',
  jsxFactory: '__jsx',
  jsxFragment: '__Fragment',
  inject: [src('app', 'jsx-shim.js')],
  // 데이터 CSV(히어로 수치 등)는 글자 그대로 들여와 앱에서 읽는다
  loader: { '.csv': 'text' },
  logLevel: 'warning',
};

function assemble(appCode) {
  const parts = {
    tailwind: inlineCss(read(src('vendor', 'tailwind.css'))),
    style: inlineCss(read(src('style.css'))),
    vendor: inlineJs(read(src('vendor', 'libs.js'))),
    app: inlineJs(appCode),
  };
  const html = read(src('index.html')).replace(/\/\*@(tailwind|style|vendor|app)\*\//g, (_, k) => parts[k]);
  fs.writeFileSync(path.join(root, 'index.html'), html);
  return html.length;
}

async function buildOnce() {
  const t = Date.now();
  const result = await esbuild.build(appOptions);
  const size = assemble(result.outputFiles[0].text);
  console.log(`index.html ${(size / 1024).toFixed(0)} KB (${Date.now() - t} ms)`);
}

if (process.argv.includes('--watch')) {
  await buildOnce();
  let timer = null;
  fs.watch(src(), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => buildOnce().catch((e) => console.error(e.message)), 100);
  });
  console.log('src/ 변경을 지켜보는 중… (Ctrl+C 로 종료)');
} else {
  await buildOnce();
}
