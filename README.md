# 덱랩 · 마블 챔피언스 한글 덱 빌더

설치 없이 브라우저에서 쓰는 마블 챔피언스 LCG 한글 덱 빌더. 배포 주소: https://basealtus1122-web.github.io/decklab/

## 고치는 법

`index.html`은 빌드 결과물이다. 직접 고치지 말고 `src/`를 고친 뒤 다시 만든다.

```sh
npm install      # 처음 한 번 (esbuild 설치)
npm run build    # src/ → index.html
npm run watch    # 고칠 때마다 자동으로 다시 만든다
```

만든 `index.html`을 브라우저로 열어 확인하고, `index.html`까지 함께 커밋하면 GitHub Pages에 반영된다.

## 폴더 구성

```
index.html              배포본 (빌드 결과, 직접 수정 금지)
build.mjs               빌드 스크립트
src/
  index.html            HTML 틀
  style.css             덱랩 스타일
  app/                  앱 코드 (React, JSX)
    main.jsx            시작점
    App.jsx             화면 전체와 상태
    config.js           설정: 서버 주소, 카드 이미지 주소, 데이터 기준일
    cards.js            카드 이름표·규칙(덱 편입 조건, 수량 제한)·검색·정렬
    deck.js             덱 만들기, 규칙 검사, 파일 저장/불러오기
    online.js           온라인 저장소 호출, 이 브라우저의 내 덱 목록
    useOnlineDeck.js    온라인 저장·불러오기·삭제 상태
    components/         화면 조각 (카드 목록, 덱 패널, 히어로 선택 창, 카드 팝업 …)
    vendor.js           라이브러리 연결
  data/
    cards.json          카드 데이터 (한 줄에 카드 하나)
    search.js           특성 검색 별칭, 히어로 부속 덱, 제외 세트
  vendor/               라이브러리 묶음 (수정 금지)
    libs.js             React 19, Base UI, lucide 아이콘, shadcn/ui 컴포넌트
    tailwind.css        Tailwind CSS 4 컴파일 결과
apps-script/Code.gs     온라인 덱 저장소 (Google Apps Script)
```

## 카드 이미지 켜기

`src/app/config.js`의 `CARD_IMAGE_URL`에 이미지 주소 틀을 넣으면 카드에 마우스를 올렸을 때 이미지가 함께 뜬다.
`{id}` 자리에 카드 ID(예: `01001a`)가 들어간다. 카드 데이터에 `image` 칸을 넣으면 그 주소를 먼저 쓴다.

```js
export const CARD_IMAGE_URL = 'https://example.com/cards/{id}.jpg';
```

## 온라인 덱 저장소

`apps-script/Code.gs`를 구글 시트에 붙인 Apps Script 웹 앱으로 배포하고, 그 주소를 `src/app/config.js`의 `API_URL`에 넣는다.
로그인 없이 덱 코드(공개)와 편집 키(비밀)로 주인을 가린다. 자세한 내용은 `Code.gs` 머리 주석 참고.
