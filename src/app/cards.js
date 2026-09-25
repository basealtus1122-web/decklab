// 카드 이름표, 규칙, 검색
import { CARD_IMAGE_URL } from './config.js';
import { TRAIT_ALIASES, SUBDECK_OF, isExcludedSet } from '../data/search.js';

export { SUBDECK_OF, isExcludedSet };

export const ASPECTS = ['aggression', 'justice', 'leadership', 'protection', 'pool'];

export const FACTION_LABEL = {
  aggression: '용맹',
  justice: '정의',
  leadership: '통솔',
  protection: '수호',
  pool: "'풀",
  basic: '기본',
  hero: '히어로',
};
export const FACTION_ORDER = [...ASPECTS, 'basic', 'hero'];
export const FACTION_COLOR = {
  aggression: '#f65c65',
  justice: '#e8c44e',
  leadership: '#639ae8',
  protection: '#59bc95',
  pool: '#b07cf0',
  basic: '#9eafc8',
  hero: '#57b394',
};

export const TYPE_LABEL = {
  hero: '히어로',
  ally: '동료',
  event: '이벤트',
  support: '지원',
  upgrade: '업그레이드',
  resource: '자원',
  player_side_scheme: '플레이어 부가 음모',
};
export const TYPE_ORDER = ['ally', 'event', 'support', 'upgrade', 'resource', 'player_side_scheme', 'hero'];

export const RESOURCES = [
  ['physical', '물리'],
  ['energy', '에너지'],
  ['mental', '정신'],
  ['wild', '만능'],
];

export const cardName = (c) => c.nameKo || c.name;
export const costLabel = (c) => (c.cost === -1 ? 'X' : c.cost == null ? '—' : c.cost);

/** 히어로가 필요로 하는 성향 수 (보통 1, 스파이더우먼 2, 아담 워록 4) */
export const aspectCount = (hero) => (hero && hero.requirements && hero.requirements[0] && hero.requirements[0].aspects) || 1;

/** 히어로 전용 카드인가 (히어로와 같은 세트의 히어로 아닌 카드) */
export const isSignature = (card, hero) => !!hero && !!card.set && card.set === hero.set && card.type !== 'hero';

/** 같은 이름 카드를 덱에 몇 장까지 넣을 수 있나 */
export const copyLimit = (card, hero) =>
  hero && hero.name === 'Adam Warlock' && card.faction !== 'hero' ? 1 : card.limit || 3;

/** 이 히어로·성향 덱에 넣을 수 있는 카드인가 */
export function canInclude(card, hero, deck) {
  if (card.type === 'hero' || isExcludedSet(card.set)) return false;
  if (isSignature(card, hero)) return true;
  if (card.faction === 'hero') return false;
  const f = card.faction;
  switch (hero.name) {
    case 'Spider-Woman':
      if (f === deck.secondAspect) return true;
      break;
    case 'Adam Warlock':
      if (ASPECTS.includes(f)) return true;
      break;
    case 'Gamora':
      if (card.type === 'event' && /attack|thwart/i.test(card.traits)) return true;
      break;
    case 'Cyclops':
      if (card.type === 'ally' && /x-men/i.test(card.traits)) return true;
      break;
    case 'Cable':
      if (card.type === 'player_side_scheme') return true;
      break;
    case 'Maria Hill':
      if (card.type === 'support' && /S.H.I.E.L.D./i.test(card.traits)) return true;
      break;
    case 'Wonder Man':
      if (card.type === 'event' && (card.resources.energy || 0) > 0) return true;
      break;
  }
  return f === 'basic' || f === deck.aspect;
}

/** 히어로 목록: 세트마다 첫 히어로 면 하나씩, 한글 이름 있는 히어로 먼저 */
export function listHeroes(cards) {
  const first = {};
  for (const c of cards) {
    if (c.type === 'hero' && (!first[c.set] || c.id < first[c.set].id)) first[c.set] = c;
  }
  return cards
    .filter((c) => c.type === 'hero' && first[c.set] === c)
    .sort((a, b) => +!!b.nameKo - +!!a.nameKo || cardName(a).localeCompare(cardName(b), 'ko'));
}

/** 같은 세트의 다른 히어로 면 (앤트맨 거대화, 아이언하트 성장 단계 등) */
export const otherHeroFaces = (cards, hero) =>
  hero ? cards.filter((c) => c.type === 'hero' && c.set === hero.set && c.id !== hero.id).sort((a, b) => (a.id < b.id ? -1 : 1)) : [];

/** 히어로 부속 덱 카드 (주문 덱 등) */
export const subdeckCards = (cards, hero) => (hero ? cards.filter((c) => SUBDECK_OF[c.set] === hero.set) : []);

/** 카드 이미지 주소. 없으면 '' */
export function cardImage(card) {
  if (!card) return '';
  if (card.image) return card.image;
  return CARD_IMAGE_URL ? CARD_IMAGE_URL.replace('{id}', card.id) : '';
}

/** 히어로 카드(…a)의 일상 면 ID (…b) */
export const alterEgoId = (hero) => hero.id.replace(/[a-z]$/, 'b');

/** 검색어가 카드와 맞는가. 특성은 영문·한글 별칭으로도 찾는다(src/data/search.js). */
export function matchesQuery(card, query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return true;
  const haystack = [card.name, card.nameKo, card.text, card.textKo, card.traits, card.traitsKo].join(' ').toLowerCase();
  if (haystack.includes(q)) return true;
  const words = TRAIT_ALIASES[q];
  if (!words) return false;
  const traits = [card.traits, card.traitsKo, card.textKo].join(' ').toLowerCase();
  return words.some((w) => traits.includes(w));
}

// ---------------------------------------------------------------- 정렬

const costKey = (c) => (c.cost == null ? 900 : c.cost === -1 ? 800 : c.cost);

/** 자원 정렬 키: 첫 자원 종류(물리·에너지·정신·만능 순) → 개수. 자원 없으면 null */
function resourceKey(c) {
  const r = c.resources || {};
  const i = RESOURCES.findIndex(([k]) => r[k] > 0);
  if (i < 0) return null;
  const total = RESOURCES.reduce((s, [k]) => s + (r[k] || 0), 0);
  return i * 100 + total;
}

export const SORTS = [
  ['name', '이름'],
  ['cost', '비용'],
  ['resource', '자원'],
  ['faction', '성향'],
  ['type', '유형'],
];

/** 카드 목록 정렬. 비용 없는 카드·자원 없는 카드는 방향과 상관없이 뒤로 */
export function sortCards(list, key, dir) {
  const sign = dir === 'desc' ? -1 : 1;
  const byName = (a, b) => cardName(a).localeCompare(cardName(b), 'ko');
  return list.sort((a, b) => {
    let z = 0;
    if (key === 'cost') {
      const x = costKey(a);
      const y = costKey(b);
      if (x >= 800 || y >= 800) return x === y ? byName(a, b) : x - y;
      z = x - y;
    } else if (key === 'resource') {
      const x = resourceKey(a);
      const y = resourceKey(b);
      if (x == null || y == null) return x === y ? byName(a, b) : x == null ? 1 : -1;
      z = x - y;
    } else if (key === 'faction') {
      z = FACTION_ORDER.indexOf(a.faction) - FACTION_ORDER.indexOf(b.faction);
    } else if (key === 'type') {
      z = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
    }
    return (z || byName(a, b)) * sign;
  });
}
