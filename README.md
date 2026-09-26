# 덱랩 · 마블 챔피언스 한글 덱 빌더

설치 없이 브라우저에서 쓰는 마블 챔피언스 LCG 한글 덱 빌더. 배포 주소: https://basealtus1122-web.github.io/decklab/

## 고치는 법

`index.html`은 빌드 결과물이다. 직접 고치지 말고 `src/`를 고친 뒤 다시 만든다.

```sh
npm install      # 처음 한 번 (esbuild 설치)
npm run build    # src/ → index.html
npm run watch    # 고칠 때마다 자동으로 다시 만든다
npm run check    # 카드 번역 점검 (잘못 붙은 번역, 빠진 아이콘)
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
    cardText.js         번역 교정 적용, 아이콘 표기 통일, 카드 글 나누기
    icons.js            게임 아이콘 그림 (자원, 위기, 가속, 강화 …)
    deck.js             덱 만들기, 규칙 검사, 파일 저장/불러오기
    online.js           온라인 저장소 호출, 이 브라우저의 내 덱 목록
    useOnlineDeck.js    온라인 저장·불러오기·삭제 상태
    components/         화면 조각 (카드 목록, 덱 패널, 히어로 선택 창, 카드 팝업 …)
    vendor.js           라이브러리 연결
  data/
    cards.json          카드 데이터 (한 줄에 카드 하나)
    card-fixes.json     번역 교정 (잘못 붙은 번역, 빠진 아이콘)
    search.js           특성 검색 별칭, 히어로 부속 덱, 제외 세트
    hero-stats.csv      히어로 수치 (체력·저지·공격·방어·손패, 일상 이름·회복·손패)
  vendor/               라이브러리 묶음 (수정 금지)
    libs.js             React 19, Base UI, lucide 아이콘, shadcn/ui 컴포넌트
    tailwind.css        Tailwind CSS 4 컴파일 결과
apps-script/Code.gs     온라인 덱 저장소 (Google Apps Script)
tools/check-cards.mjs   카드 번역 점검 (npm run check)
```

## 카드 번역 교정

번역 시트에서 카드 이름으로 번역을 붙이다 보니, 같은 이름의 조우 카드(빌런·하수인) 번역이 플레이어 카드에 붙은 경우가 있었다(예: 대거에 시빌 워 조우 카드 '대거' 번역).
`cards.json`은 그대로 두고, 교정은 `src/data/card-fixes.json`에 한 줄에 카드 하나씩 적는다. 앱이 켜질 때 이 교정을 덮어쓰므로 카드 데이터를 새로 뽑아도 교정은 남는다.

```json
{"id": "60021", "why": "왜 고쳤는지", "textKo": "새 번역 전체"}
{"id": "32005", "why": "왜 고쳤는지", "replace": [["바꿀 글", "새 글"]]}
```

- 바꿀 수 있는 칸: `textKo` `alterTextKo` `nameKo` `text` `alterText`, 또는 부분 교체 `replace`(한글 번역에만 적용). 찾는 글이 없으면 `npm run check`와 브라우저 콘솔에 경고가 뜬다.
- `textKo`를 통째로 바꾼 카드는 상세 보기에 "번역: 덱랩 교정"으로 나온다.
- 카드 데이터를 새로 뽑으면 `npm run check`를 돌린다. 한글에만 "공개될 때", "승점" 같은 조우 카드 말이 있거나, 영문과 아이콘 개수가 다른 카드를 알려 준다.

### 아이콘 표기

카드 글 안의 아이콘은 아래처럼 대괄호로 적으면 그림으로 나온다. 시트에 섞여 있던 `(물리력)`, `★`, `3 인원수` 같은 표기는 앱이 이 모양으로 바꾼다.

`[물리] [에너지] [정신] [만능] [별] [위기] [가속] [강화] [증폭] [수렁] [인원수] [부수] [고유]`

영문 원문은 `[physical]` `[energy]` `[mental]` `[wild]` `[star]` `[crisis]` `[acceleration]` `[boost]` `[amplify]` `[hazard]` `[per_hero]` `[cost]` `[unique]` 표기를 그대로 쓴다. 두 겹 대괄호 `[[특성]]`는 굵은 특성 글자다.

## 카드 이미지 켜기

`src/app/config.js`의 `CARD_IMAGE_URL`에 이미지 주소 틀을 넣으면 카드에 마우스를 올렸을 때 이미지가 함께 뜬다.
`{id}` 자리에 카드 ID(예: `01001a`)가 들어간다. 카드 데이터에 `image` 칸을 넣으면 그 주소를 먼저 쓴다.

```js
export const CARD_IMAGE_URL = 'https://example.com/cards/{id}.jpg';
```

## 히어로 수치 넣기

`src/data/hero-stats.csv`에 히어로 면마다 한 줄씩 틀이 만들어져 있다. 수치 칸을 채우면 히어로 선택 창의 팝업과 덱 패널의 "일상 / 히어로" 칸에 나온다. 비어 있는 칸은 화면에 나오지 않는다.

| 머리글 | 뜻 |
| --- | --- |
| `id` | 카드 ID (바꾸지 말 것) |
| `히어로(참고용)` | 사람이 보기 위한 이름. 읽지 않는다 |
| `체력` `저지` `공격` `방어` `히어로손패` | 히어로 면 수치 |
| `일상이름` `회복` `일상손패` | 일상 면 (예: 피터 파커, 3, 6) |

1. 엑셀이나 구글 시트로 열어 채운다. 앤트맨처럼 면이 여럿인 히어로는 면마다 줄이 따로 있다.
2. 엑셀은 "CSV UTF-8(쉼표로 분리)", 구글 시트는 "파일 → 다운로드 → CSV"로 저장해 같은 이름으로 바꿔 넣는다.
3. `npm run build`.

## 온라인 덱 저장소

`apps-script/Code.gs`를 구글 시트에 붙인 Apps Script 웹 앱으로 배포하고, 그 주소를 `src/app/config.js`의 `API_URL`에 넣는다.
로그인 없이 덱 코드(공개)와 편집 키(비밀)로 주인을 가린다. 자세한 내용은 `Code.gs` 머리 주석 참고.
