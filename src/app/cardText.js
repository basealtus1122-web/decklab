// 카드 글자 정리: 번역 교정(src/data/card-fixes.json) 적용, 아이콘 표기 통일, 화면용 토큰 나누기
//
// 번역 시트마다 아이콘 표기가 달라서([★] ★ * (물리력) (에너지) (위기 아이콘) 1인원수 …) 한 가지로 맞춘다.
// 한글 표준 표기: [물리] [에너지] [정신] [만능] [별] [위기] [가속] [강화] [증폭] [수렁] [인원수] [부수] [고유]
// 영문(MarvelCDB)은 [physical] [energy] … 그대로 두고 화면에서 같은 아이콘으로 그린다.

/** 아이콘: 표준 한글 이름 → 영문 키, 설명 */
export const ICONS = {
  물리: { en: 'physical', title: '물리 자원' },
  에너지: { en: 'energy', title: '에너지 자원' },
  정신: { en: 'mental', title: '정신 자원' },
  만능: { en: 'wild', title: '만능 자원' },
  별: { en: 'star', title: '별 아이콘' },
  위기: { en: 'crisis', title: '위기 아이콘' },
  가속: { en: 'acceleration', title: '가속 아이콘' },
  강화: { en: 'boost', title: '강화 아이콘' },
  증폭: { en: 'amplify', title: '증폭 아이콘' },
  수렁: { en: 'hazard', title: '수렁 아이콘' },
  인원수: { en: 'per_hero', title: '플레이어 수만큼' },
  부수: { en: 'cost', title: '부수적 피해' },
  고유: { en: 'unique', title: '고유' },
};
const EN_TO_KO = Object.fromEntries(Object.entries(ICONS).map(([ko, v]) => [v.en, ko]));
EN_TO_KO.physics = '물리'; // MarvelCDB 오타

/** 영문 글자 속 아이콘 개수 (한글 키로) */
export function countEnIcons(en) {
  const n = {};
  for (const m of (en || '').matchAll(/\[([a-z_]+)\]/g)) {
    const ko = EN_TO_KO[m[1]];
    if (ko) n[ko] = (n[ko] || 0) + 1;
  }
  return n;
}

/** 한글 글자 속 표준 아이콘 개수 */
export function countKoIcons(ko) {
  const n = {};
  for (const m of (ko || '').matchAll(/(?<!\[)\[([^\[\]\n]{1,4})\](?!\])/g)) {
    if (ICONS[m[1]]) n[m[1]] = (n[m[1]] || 0) + 1;
  }
  return n;
}

// 어느 카드에나 적용하는 표기 통일
const RES_WORD = { 물리: '[물리]', 물리력: '[물리]', 정신: '[정신]', 정신력: '[정신]', 에너지: '[에너지]', 만능: '[만능]' };
const FIXED = [
  // 필수(물리) · 필수(정신 정신) 는 괄호를 살리고 안만 아이콘으로
  [/필수 ?\(((?:물리력?|정신력?|에너지|만능| )+)\)/g, (_, inner) => `필수(${inner.trim().split(/ +|(?<=[리신지능력])(?=[물정에만])/).map((w) => RES_WORD[w] || w).join('')})`],
  [/\[★\]|★/g, '[별]'],
  [/\(☆\)/g, '([부수])'],
  [/\(\*과 Y\)/g, '([별]과 [강화])'],
  [/\(정신 ?정신\)/g, '([정신][정신])'],
  [/\(물리력?\)/g, '[물리]'],
  [/\(정신력?\)/g, '[정신]'],
  [/\(에너지\)/g, '[에너지]'],
  [/\(만능자원\) ?/g, '[만능] 자원'],
  [/\(만능\)/g, '[만능]'],
  [/\((위기|가속|증폭|수렁) 아이콘\)/g, '[$1]'],
  [/\((위기|가속|강화|증폭|수렁)\)/g, '([$1])'],
  [/\(인원수\)/g, '[인원수]'],
  [/(\d) ?인원수(?! ?\])/g, '$1[인원수]'],
  [/(\d) \[인원수\]/g, '$1[인원수]'],
  [/\(플레이어 ?당\)/g, '[인원수]'],
  [/\(부수적 ?피해(아이콘)?\)/g, '([부수])'],
  [/(?<!\[)정신 ?정신(?= ?자원)/g, '[정신][정신]'],
];

// 영문에 아이콘이 있는데 한글에 모자랄 때, 글자로 적힌 곳을 아이콘으로 바꾼다 (모자란 개수만큼)
// 자원 이름 뒤에 이런 말이 오면 아이콘 자리로 본다: "에너지 자원", "정신력 또는 만능 이라면", 줄 머리의 "물리 -" 등
const AFTER_RES = '(?= ?(자원|아이콘|-|—|또는|이라면|인 카드|으로|\\[(물리|에너지|정신|만능)\\]))';
const word = (w, after) => new RegExp(`(?<![\\[\\p{L}])${w}${after}`, 'gu');
const WORDS = {
  물리: word('물리력?', AFTER_RES),
  정신: word('정신력?', AFTER_RES),
  에너지: word('에너지', AFTER_RES),
  만능: word('만능', AFTER_RES),
  위기: word('위기', '(?= ?아이콘)'),
  가속: word('가속', '(?= ?아이콘)'),
  증폭: word('증폭', '(?= ?아이콘)'),
  수렁: word('수렁', '(?= ?아이콘)'),
};
// 영문에 [cost](부수적 피해) 아이콘이 있으면 한글 "부수적 피해" 뒤에 붙인다
const COST_WORD = /부수적 피해(?!\(\[부수\]\))/;

/** re 에 맞는 곳을 앞에서부터 limit 번만 바꾼다. to 안의 $1 같은 되참조도 푼다 */
function replaceUpTo(text, re, limit, to) {
  let left = limit;
  return text.replace(re, (...args) => (left-- > 0 ? to.replace(/\$(\d)/g, (_, i) => args[i] ?? '') : args[0]));
}

/** 한글 효과 글자의 아이콘 표기를 통일하고, 영문과 비교해 빠진 아이콘을 채운다 */
export function normalizeKo(ko, en) {
  if (!ko) return ko;
  let s = ko;
  for (const [re, to] of FIXED) s = s.replace(re, to);
  const want = countEnIcons(en);
  const lack = (k) => (want[k] || 0) - (countKoIcons(s)[k] || 0);
  // 줄 머리의 * 는 별 아이콘 (번역 시트에서 ★ 대신 쓴 것)
  if (lack('별') > 0) s = replaceUpTo(s, /(^|\n)\* ?/g, lack('별'), '$1[별] ');
  for (const [k, re] of Object.entries(WORDS)) {
    const n = lack(k);
    if (n > 0) s = replaceUpTo(s, re, n, `[${k}]`);
  }
  if (lack('부수') > 0) s = s.replace(COST_WORD, '부수적 피해([부수])');
  return s;
}

/** 교정 적용 + 아이콘 정리. 원본 배열은 건드리지 않는다 */
export function prepareCards(raw, fixes) {
  const byId = new Map(fixes.map((f) => [f.id, f]));
  return raw.map((card) => {
    const f = byId.get(card.id);
    const c = { ...card };
    if (f) {
      for (const k of ['text', 'alterText', 'textKo', 'alterTextKo', 'nameKo']) if (k in f) c[k] = f[k];
      for (const [from, to] of f.replace || []) {
        if (!(c.textKo || '').includes(from)) console.warn(`[card-fixes] ${card.id}: "${from}" 를 찾지 못함`);
        else c.textKo = c.textKo.replace(from, to);
      }
      if (f.textKo !== undefined) {
        c.sheet = '덱랩 교정';
        c.row = null;
      }
    }
    c.textKo = normalizeKo(c.textKo, c.text);
    if (c.alterTextKo) c.alterTextKo = normalizeKo(c.alterTextKo, c.alterText);
    return c;
  });
}

/**
 * 화면용 토큰으로 나눈다.
 *   [[공중]] / [[Aerial]]  → { trait }
 *   [에너지] / [energy]     → { icon: '에너지' }
 *   [aerial] (영문 오타)     → { trait }
 */
export function tokenize(text) {
  const out = [];
  let last = 0;
  for (const m of (text || '').matchAll(/\[\[([^\]]+)\]\]|\[([^\[\]\n]{1,20})\]/g)) {
    const [whole, trait, inner] = m;
    let token = null;
    if (trait) token = { trait };
    else if (ICONS[inner]) token = { icon: inner };
    else if (EN_TO_KO[inner]) token = { icon: EN_TO_KO[inner] };
    else if (/^[a-z][a-z .-]*$/.test(inner)) token = { trait: inner };
    if (!token) continue;
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push(token);
    last = m.index + whole.length;
  }
  if (last < (text || '').length) out.push({ text: text.slice(last) });
  return out;
}
