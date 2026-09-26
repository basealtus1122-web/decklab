# 덱랩 작업 안내

- `index.html`은 빌드 결과물이다. 절대 직접 고치지 말 것. `src/`를 고치고 `npm run build`로 다시 만든 뒤 `index.html`도 함께 커밋한다(GitHub Pages가 이 파일을 그대로 배포한다).
- 처음이면 `npm install` (esbuild 하나뿐).
- 앱 코드는 `src/app/` (React 19 + JSX, esbuild가 `__jsx`/`__Fragment`(= React.createElement/Fragment)로 변환. `src/app/jsx-shim.js` 참고). React 훅과 UI 컴포넌트는 `src/app/vendor.js`에서 가져온다. npm으로 react를 설치하지 않는다: 라이브러리는 `src/vendor/libs.js`에 미리 묶여 있고 `window.DecklabVendor`로 넘어온다.
- `src/vendor/`는 수정 금지. 새 Tailwind 유틸리티 클래스는 컴파일돼 있지 않으므로 쓰지 말고, 스타일은 `src/style.css`에 클래스로 쓴다.
- 카드 데이터는 `src/data/cards.json` (한 줄에 카드 하나). 화면 문구와 주석은 한국어.
- 번역 교정은 `cards.json`이 아니라 `src/data/card-fixes.json`에 넣는다(앱이 켜질 때 덮어씀). 카드 글의 아이콘은 `[물리]`, `[가속]`처럼 대괄호 표기로 쓰고 `src/app/cardText.js`가 통일한다. 카드 데이터를 새로 뽑았으면 `npm run check`.
- 온라인 저장소 API는 `apps-script/Code.gs` (create/update/delete/get/verify/list/stats). 이 파일을 바꾸면 사용자가 Apps Script를 다시 배포해야 하므로, 바꿀 때는 꼭 알린다.
- 확인: `npm run build` 후 `index.html`을 브라우저로 열어 본다. 히어로 선택 창 → 카드 추가 → 덱 패널, 좁은 화면(760px, 420px)까지.
