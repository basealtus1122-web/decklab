// 카드 번역 점검: npm run check
// 카드 데이터를 새로 뽑았을 때 돌려서, 잘못 붙은 번역과 빠진 아이콘을 찾는다.
// 걸린 카드는 src/data/card-fixes.json 에 교정을 넣는다.
import fs from 'node:fs';
import { prepareCards, countEnIcons, countKoIcons } from '../src/app/cardText.js';

const root = new URL('../', import.meta.url);
const read = (p) => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const cards = prepareCards(read('src/data/cards.json'), read('src/data/card-fixes.json'));

// 한글에만 있으면 조우 카드(빌런·하수인·시나리오) 번역이 붙었을 가능성이 큰 말
// 키워드로 쓰인 경우(줄 머리, 쌍점)만 본다. "장착된 하수인이 격파될 때," 같은 문장은 괜찮다
const KEYWORD = (w) => new RegExp(`(^|\\n)\\s*\\*?\\s*${w}( \\([^)]*\\))?:`);
const ENCOUNTER_ONLY = [
  ['공개될 때', /When Revealed/i, KEYWORD('공개될 때')],
  ['강제 반응', /Forced Response/i, KEYWORD('강제 반응')],
  ['강제 난입', /Forced Interrupt/i, KEYWORD('강제 난입')],
  ['승점', /Victory \d/i, /(^|\n)\s*(경호|의연|속공|악당|강인)?\.? ?승점 \d/],
  ['격파될 때', /When Defeated/i, KEYWORD('격파될 때')],
  ['강화', /Boost|\[star\]/i, KEYWORD('강화')],
  ['쇄도', /Surge/i, /쇄도/],
];
// 카드에 인쇄된 음모 아이콘을 번역에 덧붙인 경우처럼, 한글 쪽이 더 많은 것은 문제로 보지 않는다
const KO_EXTRA_OK = new Set(['위기', '가속', '증폭', '수렁', '별', '강화']);

const suspects = [];
const icons = [];
for (const c of cards) {
  for (const [en, ko] of [
    ['text', 'textKo'],
    ['alterText', 'alterTextKo'],
  ]) {
    const e = c[en] || '';
    const k = c[ko] || '';
    if (!k || k === e) continue;
    const why = ENCOUNTER_ONLY.filter(([, re, kre]) => kre.test(k) && !re.test(e)).map(([label]) => label);
    if (why.length) suspects.push(`${c.id} ${c.name} / ${c.nameKo} (${c.sheet || '정발'}${c.row ? ' ' + c.row + '행' : ''}): 한글에만 ${why.join(', ')}`);
    const a = countEnIcons(e);
    const b = countKoIcons(k);
    const diff = [...new Set([...Object.keys(a), ...Object.keys(b)])]
      .filter((i) => (a[i] || 0) > (b[i] || 0) || ((b[i] || 0) > (a[i] || 0) && !KO_EXTRA_OK.has(i)))
      .map((i) => `${i} 영문 ${a[i] || 0} / 한글 ${b[i] || 0}`);
    if (diff.length) icons.push(`${c.id} ${c.name} / ${c.nameKo} [${ko}]: ${diff.join(', ')}`);
  }
}

console.log(`카드 ${cards.length}장 점검`);
console.log(`\n잘못 붙은 번역 의심 ${suspects.length}장`);
suspects.forEach((s) => console.log('  ' + s));
console.log(`\n아이콘 개수가 다른 카드 ${icons.length}장`);
icons.forEach((s) => console.log('  ' + s));
if (!suspects.length && !icons.length) console.log('\n문제 없음');
