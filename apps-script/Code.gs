/**
 * 덱랩 덱 저장소 — Google Apps Script 웹 앱
 *
 * 로그인 없이 "덱 코드(공개) + 편집 키(비밀)" 두 개로 주인을 가린다.
 *  - 덱 코드만 가진 사람: 보기, 복사
 *  - 편집 키까지 가진 사람: 수정, 삭제
 *
 * 시트 두 장을 쓴다.
 *  - decks     : 덱 본문. 편집 키는 여기 없다.
 *  - edit_keys : 덱 코드별 편집 키 원문. 분실 시 복구용.
 *                이 스프레드시트를 누구와도 공유하지 말 것
 *                (시트를 숨겨도 보기 권한자는 다시 펼칠 수 있다).
 */

// 사이트 주소를 넣어두면 edit_keys 시트에 바로 여는 편집 링크가 같이 기록된다.
const SITE_URL = 'https://basealtus1122-web.github.io/decklab/';

const SHEET_DECKS = 'decks';
const SHEET_KEYS = 'edit_keys';
const DECK_HEADERS = ['덱코드', '덱이름', '메모', '히어로ID', '히어로', '성향', '두번째성향',
  '카드구성', '카드목록', '복사원본', '공개', '삭제', '만든날', '수정날'];
const KEY_HEADERS = ['덱코드', '편집키', '덱이름', '만든날', '편집링크'];
const COL = { code: 0, name: 1, memo: 2, heroId: 3, heroName: 4, aspect: 5, second: 6,
  counts: 7, summary: 8, copiedFrom: 9, isPublic: 10, deleted: 11, createdAt: 12, updatedAt: 13 };

// 헷갈리는 0/O, 1/I 는 뺐다
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_RE = /^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
const CARD_RE = /^[0-9]{5}[a-z]?$/;
const ASPECTS = ['aggression', 'justice', 'leadership', 'protection', 'pool'];
const LIMIT = { name: 100, memo: 5000, heroName: 100, summary: 20000, cards: 300, list: 200 };
const STATS_CACHE_SEC = 600;

/** 처음 한 번 편집기에서 실행 — 권한 승인 + 시트 생성 */
function setup() {
  ensureSheets_();
}

function doGet(e) {
  return handle_((e && e.parameter) || {});
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: '요청 형식이 올바르지 않습니다.' });
  }
  return handle_(body);
}

function handle_(p) {
  try {
    ensureSheets_();
    switch (p.action) {
      case 'create': return json_(create_(p.deck));
      case 'update': return json_(update_(p.code, p.editKey, p.deck));
      case 'delete': return json_(remove_(p.code, p.editKey));
      case 'get': return json_(get_(p.code));
      case 'verify': return json_({ ok: true, valid: checkKey_(p.code, p.editKey) });
      case 'list': return json_(list_(p));
      case 'stats': return json_(stats_());
      default: return json_({ ok: false, error: '알 수 없는 요청입니다.' });
    }
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

// ---------------------------------------------------------------- 쓰기

function create_(deck) {
  const d = clean_(deck);
  return withLock_(() => {
    const decks = sheet_(SHEET_DECKS);
    const keys = sheet_(SHEET_KEYS);
    const code = newCode_(decks);
    const key = newKey_();
    const now = now_();
    writeRow_(decks, decks.getLastRow() + 1, deckRow_(code, d, d.copiedFrom, '', now, now));
    writeRow_(keys, keys.getLastRow() + 1, [code, key, d.name, now, editLink_(code, key)]);
    dropStats_();
    return { ok: true, code: code, editKey: key };
  });
}

function update_(code, editKey, deck) {
  const d = clean_(deck);
  return withLock_(() => {
    const decks = sheet_(SHEET_DECKS);
    const row = findRow_(decks, code);
    if (!row) throw new Error('덱을 찾을 수 없습니다.');
    if (!checkKey_(code, editKey)) throw new Error('편집 키가 맞지 않습니다.');
    const cur = readRow_(decks, row);
    if (cur[COL.deleted] === 'Y') throw new Error('삭제된 덱입니다.');
    writeRow_(decks, row, deckRow_(cur[COL.code], d, cur[COL.copiedFrom], '', cur[COL.createdAt], now_()));
    const keys = sheet_(SHEET_KEYS);
    const kr = findRow_(keys, code);
    if (kr) keys.getRange(kr, 3).setValue(d.name);
    dropStats_();
    return { ok: true, code: cur[COL.code] };
  });
}

function remove_(code, editKey) {
  return withLock_(() => {
    const decks = sheet_(SHEET_DECKS);
    const row = findRow_(decks, code);
    if (!row) throw new Error('덱을 찾을 수 없습니다.');
    if (!checkKey_(code, editKey)) throw new Error('편집 키가 맞지 않습니다.');
    // 실수 복구가 가능하게 지우지 않고 표시만 한다. 시트에서 '삭제' 칸을 비우면 되살아난다.
    decks.getRange(row, COL.deleted + 1).setValue('Y');
    decks.getRange(row, COL.updatedAt + 1).setValue(now_());
    dropStats_();
    return { ok: true };
  });
}

// ---------------------------------------------------------------- 읽기

function get_(code) {
  const decks = sheet_(SHEET_DECKS);
  const row = findRow_(decks, code);
  if (!row) return { ok: false, error: '덱을 찾을 수 없습니다.' };
  const v = readRow_(decks, row);
  if (v[COL.deleted] === 'Y') return { ok: false, error: '삭제된 덱입니다.' };
  return { ok: true, deck: toDeck_(v, true) };
}

function list_(p) {
  const limit = Math.min(Math.max(parseInt(p.limit, 10) || 50, 1), LIMIT.list);
  const offset = Math.max(parseInt(p.offset, 10) || 0, 0);
  const hero = String(p.hero || '');
  const aspect = String(p.aspect || '');
  const q = String(p.q || '').trim().toLowerCase();

  const rows = allRows_(sheet_(SHEET_DECKS)).filter(v =>
    v[COL.deleted] !== 'Y' && v[COL.isPublic] === 'Y' &&
    (!hero || v[COL.heroId] === hero) &&
    (!aspect || v[COL.aspect] === aspect || v[COL.second] === aspect) &&
    (!q || String(v[COL.name]).toLowerCase().indexOf(q) >= 0));
  rows.sort((a, b) => String(b[COL.updatedAt]).localeCompare(String(a[COL.updatedAt])));
  return { ok: true, total: rows.length, decks: rows.slice(offset, offset + limit).map(v => toDeck_(v, false)) };
}

/**
 * 통계. 비공개 덱도 합산에는 넣는다(개별 덱은 드러나지 않는다).
 * 카드 채용률 계산에 필요한 카드 성향 정보는 사이트가 갖고 있으므로, 여기서는 원자료만 센다.
 */
function stats_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('stats');
  if (hit) return JSON.parse(hit);

  const out = { ok: true, totalDecks: 0, heroes: {}, heroAspects: {}, aspects: {},
    cardDecks: {}, cardCopies: {}, generatedAt: now_() };
  allRows_(sheet_(SHEET_DECKS)).forEach(v => {
    if (v[COL.deleted] === 'Y') return;
    out.totalDecks++;
    const h = v[COL.heroId];
    out.heroes[h] = out.heroes[h] || { name: v[COL.heroName], count: 0 };
    out.heroes[h].count++;
    [v[COL.aspect], v[COL.second]].filter(Boolean).forEach(a => {
      out.aspects[a] = (out.aspects[a] || 0) + 1;
      const k = h + '|' + a;
      out.heroAspects[k] = (out.heroAspects[k] || 0) + 1;
    });
    let counts = {};
    try { counts = JSON.parse(v[COL.counts] || '{}'); } catch (err) { /* 손상된 행은 건너뜀 */ }
    Object.keys(counts).forEach(id => {
      out.cardDecks[id] = (out.cardDecks[id] || 0) + 1;
      out.cardCopies[id] = (out.cardCopies[id] || 0) + Number(counts[id] || 0);
    });
  });
  const text = JSON.stringify(out);
  if (text.length < 90000) cache.put('stats', text, STATS_CACHE_SEC);
  return out;
}

// ---------------------------------------------------------------- 검사

function clean_(deck) {
  if (!deck || typeof deck !== 'object') throw new Error('덱 정보가 없습니다.');

  const name = String(deck.name || '').trim().slice(0, LIMIT.name);
  if (!name) throw new Error('덱 이름을 입력하세요.');

  const heroId = String(deck.hero || '').trim();
  if (!CARD_RE.test(heroId)) throw new Error('히어로 정보가 올바르지 않습니다.');

  const aspect = String(deck.aspect || '');
  if (ASPECTS.indexOf(aspect) < 0) throw new Error('성향 정보가 올바르지 않습니다.');
  const second = deck.secondAspect ? String(deck.secondAspect) : '';
  if (second && ASPECTS.indexOf(second) < 0) throw new Error('두 번째 성향 정보가 올바르지 않습니다.');

  const src = deck.counts || {};
  const ids = Object.keys(src);
  if (ids.length > LIMIT.cards) throw new Error('카드 종류가 너무 많습니다.');
  const counts = {};
  ids.forEach(id => {
    const n = Number(src[id]);
    if (!CARD_RE.test(id) || !Number.isInteger(n) || n < 0 || n > 99) {
      throw new Error('카드 구성이 올바르지 않습니다: ' + id);
    }
    if (n > 0) counts[id] = n;
  });

  const copiedFrom = CODE_RE.test(String(deck.copiedFrom || '').toUpperCase())
    ? String(deck.copiedFrom).toUpperCase() : '';

  return {
    name: name,
    memo: String(deck.memo || '').slice(0, LIMIT.memo),
    heroId: heroId,
    heroName: String(deck.heroName || '').slice(0, LIMIT.heroName),
    aspect: aspect,
    second: second,
    counts: counts,
    summary: String(deck.summary || '').slice(0, LIMIT.summary),
    copiedFrom: copiedFrom,
    isPublic: deck.isPublic !== false,
  };
}

function checkKey_(code, editKey) {
  const key = String(editKey || '');
  if (!key) return false;
  const keys = sheet_(SHEET_KEYS);
  const row = findRow_(keys, code);
  return !!row && String(keys.getRange(row, 2).getValue()) === key;
}

// ---------------------------------------------------------------- 시트 도우미

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  [[SHEET_DECKS, DECK_HEADERS], [SHEET_KEYS, KEY_HEADERS]].forEach(pair => {
    let sh = ss.getSheetByName(pair[0]);
    if (!sh) sh = ss.insertSheet(pair[0]);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, pair[1].length).setValues([pair[1]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
}

function sheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function findRow_(sh, code) {
  const c = String(code || '').trim().toUpperCase();
  if (!CODE_RE.test(c) || sh.getLastRow() < 2) return 0;
  const hit = sh.getRange(2, 1, sh.getLastRow() - 1, 1)
    .createTextFinder(c).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}

function readRow_(sh, row) {
  return sh.getRange(row, 1, 1, DECK_HEADERS.length).getDisplayValues()[0];
}

function allRows_(sh) {
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, DECK_HEADERS.length).getDisplayValues();
}

/** 카드 ID "01050" 이 숫자 1050 으로 바뀌지 않게 글자 서식으로 쓴다 */
function writeRow_(sh, row, values) {
  const r = sh.getRange(row, 1, 1, values.length);
  r.setNumberFormat('@');
  r.setValues([values]);
}

function deckRow_(code, d, copiedFrom, deleted, createdAt, updatedAt) {
  return [code, d.name, d.memo, d.heroId, d.heroName, d.aspect, d.second,
    JSON.stringify(d.counts), d.summary, copiedFrom || '', d.isPublic ? 'Y' : '',
    deleted || '', createdAt, updatedAt];
}

function toDeck_(v, full) {
  let counts = {};
  try { counts = JSON.parse(v[COL.counts] || '{}'); } catch (err) { /* 무시 */ }
  const o = {
    code: v[COL.code], name: v[COL.name], hero: v[COL.heroId], heroName: v[COL.heroName],
    aspect: v[COL.aspect], secondAspect: v[COL.second], copiedFrom: v[COL.copiedFrom],
    isPublic: v[COL.isPublic] === 'Y', createdAt: v[COL.createdAt], updatedAt: v[COL.updatedAt],
  };
  if (full) {
    o.memo = v[COL.memo];
    o.counts = counts;
  } else {
    o.cardCount = Object.keys(counts).reduce((s, k) => s + Number(counts[k] || 0), 0);
  }
  return o;
}

// ---------------------------------------------------------------- 기타

function newCode_(decks) {
  for (let t = 0; t < 30; t++) {
    const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid());
    let s = '';
    for (let i = 0; i < 8; i++) s += CODE_ALPHABET[(bytes[i] & 0xff) % CODE_ALPHABET.length];
    const code = s.slice(0, 4) + '-' + s.slice(4);
    if (!findRow_(decks, code)) return code;
  }
  throw new Error('덱 코드를 만들지 못했습니다. 다시 시도하세요.');
}

function newKey_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 40);
}

function editLink_(code, key) {
  return SITE_URL ? SITE_URL + '#deck=' + code + '&key=' + key : '';
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function dropStats_() {
  CacheService.getScriptCache().remove('stats');
}

function now_() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
