// 덱랩 설정

// 온라인 덱 저장소 (apps-script/Code.gs 를 웹 앱으로 배포한 주소)
export const API_URL =
  'https://script.google.com/macros/s/AKfycbya8yeb6rLXzdeR8mFP2HQ-OUAokeBYTI0NW9_gE6oTPiPdwiDy0uEtclWy5T5Doi2o/exec';

// 카드 이미지 주소. {id} 자리에 카드 ID(예: 01001a)가 들어간다.
// 비워두면 이미지 없이 글자만 보인다. 카드 데이터에 image 칸이 있으면 그 주소를 먼저 쓴다.
// 예) 'https://example.com/cards/{id}.jpg'
export const CARD_IMAGE_URL = '';

// 화면 아래 데이터 기준일
export const DATA_DATE = '2026.09.09';

export const RULES_URL = 'https://www.fantasyflightgames.com/en/news/2026/7/23/mission-updates/';

// 브라우저 저장소 키
export const STORAGE = {
  myDecks: 'decklab.mydecks',
  prefs: 'decklab.prefs',
};
