// 덱 만들기, 규칙 검사, 파일 읽기/쓰기
import { ASPECTS, FACTION_LABEL, canInclude, cardName, copyLimit, isSignature } from './cards.js';

export const DECK_MIN = 40;
export const DECK_MAX = 50;

/** 히어로를 고른 새 덱. 전용 카드는 정해진 장수만큼 들어간다. */
export function newDeck(cards, heroId) {
  const hero = cards.find((c) => c.id === heroId);
  return {
    version: 1,
    name: `${cardName(hero)}의 덱`,
    hero: heroId,
    aspect: 'protection',
    secondAspect: 'justice',
    counts: Object.fromEntries(cards.filter((c) => isSignature(c, hero)).map((c) => [c.id, c.quantity])),
  };
}

/** 영속 카드를 뺀 덱 장수 */
export const deckSize = (cards, deck) => cards.reduce((n, c) => n + (c.permanent ? 0 : deck.counts[c.id] || 0), 0);

/** 덱에 든 카드 (카드 데이터 순서) */
export const deckCards = (cards, deck) => cards.filter((c) => deck.counts[c.id]);

/** 규칙 검사. 고칠 점을 문장 목록으로 돌려준다. */
export function validateDeck(cards, hero, deck) {
  const issues = [];
  const size = deckSize(cards, deck);
  if (size < DECK_MIN) issues.push(`덱에 ${DECK_MIN - size}장을 더 추가하세요. (${DECK_MIN}–${DECK_MAX}장)`);
  if (size > DECK_MAX) issues.push(`덱이 ${size - DECK_MAX}장 초과했습니다.`);

  const byName = {};
  for (const c of cards) {
    const n = deck.counts[c.id] || 0;
    if (!n) continue;
    byName[c.name] = (byName[c.name] || 0) + n;
    if (!canInclude(c, hero, deck)) issues.push(`${cardName(c)}: 선택한 히어로·성향에 맞지 않습니다.`);
  }
  for (const c of cards.filter((x) => deck.counts[x.id])) {
    const limit = copyLimit(c, hero);
    if (byName[c.name] > limit && !issues.some((m) => m.startsWith(cardName(c) + ': 수량'))) {
      issues.push(`${cardName(c)}: 수량 제한 ${limit}장을 초과했습니다.`);
    }
  }

  if (cards.some((c) => isSignature(c, hero) && (deck.counts[c.id] || 0) !== c.quantity)) {
    issues.push('히어로 전용 카드 구성을 확인하세요.');
  }
  if (hero.name === 'Gamora') {
    const offAspect = cards.reduce(
      (n, c) => n + ((c.faction !== 'hero' && c.faction !== 'basic' && c.faction !== deck.aspect && deck.counts[c.id]) || 0),
      0,
    );
    if (offAspect > 6) issues.push('가모라의 다른 성향 이벤트는 최대 6장입니다.');
  }
  if (hero.name === 'Spider-Woman' && deck.aspect === deck.secondAspect) {
    issues.push('스파이더우먼은 서로 다른 성향 2개를 선택해야 합니다.');
  }
  if (hero.name === 'Adam Warlock') {
    const perAspect = ASPECTS.map((a) => cards.reduce((n, c) => n + ((c.faction === a && deck.counts[c.id]) || 0), 0)).filter(
      (n) => n > 0,
    );
    if (perAspect.length > 4 || (perAspect.length === 4 && new Set(perAspect).size !== 1)) {
      issues.push("아담 워록은 성향 4개('풀 포함 5개 중)에서 같은 장수씩 넣어야 합니다.");
    }
  }
  return issues;
}

/** 덱 파일(JSON)을 검사해 덱으로 바꾼다. 틀리면 Error */
export function parseDeckFile(data, cards) {
  if (!data || typeof data !== 'object') throw Error('덱 파일 형식이 올바르지 않습니다.');
  if (
    data.version !== 1 ||
    typeof data.name !== 'string' ||
    data.name.length > 100 ||
    !cards.some((c) => c.id === data.hero && c.type === 'hero') ||
    !ASPECTS.includes(data.aspect) ||
    !data.counts ||
    typeof data.counts !== 'object' ||
    Array.isArray(data.counts)
  ) {
    throw Error('지원하지 않는 덱 파일입니다.');
  }
  const counts = {};
  for (const [id, n] of Object.entries(data.counts)) {
    if (!cards.some((c) => c.id === id && c.type !== 'hero') || !Number.isInteger(n) || n < 0 || n > 99) {
      throw Error('알 수 없는 카드 또는 잘못된 수량이 있습니다.');
    }
    if (n) counts[id] = n;
  }
  return {
    version: 1,
    name: data.name,
    hero: data.hero,
    aspect: data.aspect,
    secondAspect: ASPECTS.includes(data.secondAspect) ? data.secondAspect : 'justice',
    counts,
  };
}

/** 텍스트 목록 내보내기 */
export function deckText(cards, hero, deck) {
  const inDeck = deckCards(cards, deck);
  return (
    `${deck.name}\n히어로: ${cardName(hero)}\n성향: ${FACTION_LABEL[deck.aspect]}\n총 ${deckSize(cards, deck)}장 (영속 제외)\n\n` +
    inDeck.map((c) => `${deck.counts[c.id]}x ${cardName(c)} (${c.id})${c.permanent ? ' [영속]' : ''}`).join('\n')
  );
}

/** 글자를 파일로 내려받게 한다 */
export function downloadText(text, fileName, ext) {
  const url = URL.createObjectURL(
    new Blob([text], { type: ext === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = (fileName.replace(/[<>:"/\\|?*]/g, '_') || 'deck') + '.' + ext;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
