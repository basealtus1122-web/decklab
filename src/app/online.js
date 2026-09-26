// 온라인 덱 저장소(apps-script/Code.gs)와 이 브라우저의 "내 덱" 목록
import { API_URL, STORAGE } from './config.js';

export const DECK_CODE_RE = /^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;

/** 서버 호출. text/plain 으로 보내 CORS 사전 요청을 피한다. */
export function call(action, payload) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  })
    .catch(() => {
      throw new Error('서버에 연결하지 못했습니다. 인터넷 연결을 확인하세요.');
    })
    .then((r) => {
      if (!r.ok) throw new Error(`서버 응답 오류 (${r.status})`);
      return r.json();
    })
    .then((j) => {
      if (!j || !j.ok) throw new Error((j && j.error) || '서버 오류');
      return j;
    });
}

// ---------------------------------------------------------------- 내 덱 (편집 키 보관)

export function myDecks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.myDecks) || '[]');
  } catch (e) {
    return [];
  }
}

function keepMyDecks(list) {
  try {
    localStorage.setItem(STORAGE.myDecks, JSON.stringify(list.slice(0, 100)));
  } catch (e) {}
}

export function rememberDeck(entry) {
  keepMyDecks([entry, ...myDecks().filter((x) => x.code !== entry.code)]);
}

export function forgetDeck(code) {
  keepMyDecks(myDecks().filter((x) => x.code !== code));
}

export function editKeyFor(code) {
  const m = myDecks().find((x) => x.code === code);
  return m ? m.key : '';
}

// ---------------------------------------------------------------- 화면 설정 (이 브라우저에만)

export function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.prefs) || '{}') || {};
  } catch (e) {
    return {};
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE.prefs, JSON.stringify(prefs));
  } catch (e) {}
}
